-- N's Sidebar subscribes to live changes on `presence` via Postgres
-- Changes (postgres_changes). Supabase only broadcasts changes for tables
-- explicitly added to the `supabase_realtime` publication — the original
-- presence migration created the table and its RLS policies but never
-- added it to that publication, so a live subscription could never
-- receive change events, regardless of RLS or write correctness.
--
-- Idempotent and transactional, consistent with prior migrations.

begin;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'presence'
  ) then
    alter publication supabase_realtime add table presence;
  end if;
end $$;

commit;

notify pgrst, 'reload schema';
