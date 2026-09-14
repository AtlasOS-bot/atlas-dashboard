-- Presence tracking: lets N see whether M currently has NoMo open.
--
-- Heartbeat-based rather than raw Realtime Presence, so access control can
-- be enforced with the same standard RLS pattern already used everywhere
-- else in this project. Postgres Changes subscriptions on this table
-- already respect RLS, so a live subscription only ever receives events
-- the subscriber is authorized to see under the policies below.
--
-- Idempotent and transactional, consistent with prior migrations.

begin;

create table if not exists presence (
  user_email    text primary key,
  last_seen_at  timestamptz not null default now()
);

alter table presence enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'presence'
      and policyname = 'users can insert their own presence'
  ) then
    create policy "users can insert their own presence" on presence
      for insert
      with check (user_email = auth.jwt() ->> 'email');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'presence'
      and policyname = 'users can update their own presence'
  ) then
    create policy "users can update their own presence" on presence
      for update
      using (user_email = auth.jwt() ->> 'email')
      with check (user_email = auth.jwt() ->> 'email');
  end if;
end $$;

-- Security boundary: only N (normaycr@gmail.com) may ever read presence
-- rows — M is granted insert/update above but no select at all, so M
-- cannot read anyone's presence, including their own. This email must
-- match the "N" entry in lib/currentUser.js; update both together if it
-- ever changes.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'presence'
      and policyname = 'only N can read presence'
  ) then
    create policy "only N can read presence" on presence
      for select
      using (auth.jwt() ->> 'email' = 'normaycr@gmail.com');
  end if;
end $$;

commit;

notify pgrst, 'reload schema';
