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
