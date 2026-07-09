-- Run this once in the Supabase SQL editor for a new project.
-- Single-user personal app, no auth yet, so RLS is wide open for now
-- rather than locked to a specific user — revisit if this ever needs
-- to support more than one person.

create table if not exists ideas (
  id uuid primary key default gen_random_uuid(),
  transcript text not null,
  title text not null,
  summary text,
  keywords text[] default '{}',
  category text,
  confidence float,
  status text not null default 'floating', -- 'floating' | 'planted'
  created_at timestamptz not null default now(),
  planted_at timestamptz
);

alter table ideas enable row level security;

create policy "Allow all access"
  on ideas
  for all
  using (true)
  with check (true);

-- Migration: AI-generated step plan for a planted idea, e.g.
-- {"steps": [{"text": "...", "done": false}, ...]}. Generated once
-- (via api/plan.js) the first time a bonsai is opened in the Garden,
-- then persisted here so it never regenerates for the same idea.
alter table ideas add column if not exists plan jsonb;

-- Migration: the bloom milestone (all plan steps checked off), plus
-- the ongoing brainstorm/journal notes and the AI-written project
-- brief generated from them (api/brief.js).
alter table ideas add column if not exists bloomed boolean not null default false;
alter table ideas add column if not exists notes jsonb not null default '[]'::jsonb;
alter table ideas add column if not exists brief text;

-- Migration: the Workshop's living task list (api/checkin.js suggests
-- additions to it) — separate from `plan`, which is the frozen
-- pre-bloom checklist that got the idea to bloom in the first place.
alter table ideas add column if not exists tasks jsonb not null default '[]'::jsonb;

-- Migration: whether the plan-reveal ceremony (PlanReveal.jsx) has
-- been completed for this idea — false shows the reveal every visit
-- through the door; true skips straight to the Workshop dashboard.
alter table ideas add column if not exists plan_revealed boolean not null default false;

-- Migration: the Workshop's desk tools (WorkshopDashboard.jsx). Each
-- idea's ongoing work is split across purpose-built tools instead of
-- one flat dashboard:
--   milestones — phases of grouped tasks, e.g.
--     [{"id": "...", "title": "Research", "tasks": [{"text": "...", "done": false}]}]
--     Replaces the old flat `tasks` column as the primary work
--     surface; existing flat tasks are migrated into a single
--     "Tasks" milestone in the store the first time an idea's board
--     loads, rather than via a SQL data migration.
--   research — reference notes/links/open questions, e.g.
--     [{"text": "...", "createdAt": "..."}]
--   decisions — pros/cons/risks/alternatives considered, e.g.
--     [{"kind": "pro" | "con" | "risk" | "alternative", "text": "...", "createdAt": "..."}]
--   ledger — resources, people, and budget, e.g.
--     {"resources": [{"text": "...", "have": false}], "people": [{"text": "..."}],
--      "budgetEstimate": null, "budgetSpent": null}
--   notebook — the idea's foundation, e.g.
--     {"goal": "...", "constraints": "...", "success": "..."}
alter table ideas add column if not exists milestones jsonb not null default '[]'::jsonb;
alter table ideas add column if not exists research jsonb not null default '[]'::jsonb;
alter table ideas add column if not exists decisions jsonb not null default '[]'::jsonb;
alter table ideas add column if not exists ledger jsonb not null default '{}'::jsonb;
alter table ideas add column if not exists notebook jsonb not null default '{}'::jsonb;
