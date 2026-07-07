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
