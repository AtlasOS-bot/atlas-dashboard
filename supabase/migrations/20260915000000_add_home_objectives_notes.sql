-- Home command-center: shared objectives (quarter/month/week/day) and
-- shared notes. Both are organization-wide data N and M both read and
-- write, following the exact same "authenticated full access" RLS
-- pattern already used for products/sales/etc. in the main schema —
-- nothing new invented here, just reused.

begin;

create table objective_periods (
  id            bigint generated always as identity primary key,
  period_type   text not null check (period_type in ('quarter', 'month', 'week', 'day')),
  period_key    text not null,
  headline      text,
  updated_by    text check (updated_by in ('N', 'M')),
  updated_at    timestamptz not null default now(),
  created_at    timestamptz not null default now(),
  unique (period_type, period_key)
);

create table objective_items (
  id            bigint generated always as identity primary key,
  period_id     bigint not null references objective_periods(id) on delete cascade,
  body          text not null,
  is_done       boolean not null default false,
  created_by    text not null check (created_by in ('N', 'M')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table notes (
  id            bigint generated always as identity primary key,
  body          text not null,
  created_by    text not null check (created_by in ('N', 'M')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table objective_periods enable row level security;
alter table objective_items   enable row level security;
alter table notes             enable row level security;

create policy "authenticated full access" on objective_periods
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on objective_items
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on notes
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

commit;

notify pgrst, 'reload schema';
