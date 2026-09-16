-- Shared NoMo calendar events for the Home Calendar module. Organization
-- data N and M both read and write, following the exact same
-- "authenticated full access" RLS pattern already used for
-- objective_periods/objective_items/notes (see
-- 20260915000000_add_home_objectives_notes.sql) — nothing new invented.

begin;

create table calendar_events (
  id            bigint generated always as identity primary key,
  title         text not null,
  event_date    date not null,
  start_time    time,
  end_time      time,
  description   text,
  created_by    text not null check (created_by in ('N', 'M')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index calendar_events_event_date_idx on calendar_events (event_date);

alter table calendar_events enable row level security;

create policy "authenticated full access" on calendar_events
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

commit;

notify pgrst, 'reload schema';
