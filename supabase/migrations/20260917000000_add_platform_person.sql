-- =========================================================
-- Per-person platform listing tracking
-- =========================================================
--
-- Previously, product_platforms had exactly one row per
-- (product_id, platform_id), with a single is_listed flag that could not
-- say WHO (N or M) actually posted the listing. This adds a `person`
-- column so N and M can each independently have their own row for the
-- same product + platform, e.g.:
--
--   product 1 | Mercari | N | is_listed = true
--   product 1 | Mercari | M | is_listed = true
--
-- Existing rows are preserved exactly as-is: `person` is added as a
-- nullable column with no default and no backfill, so every row that
-- existed before this migration keeps person = null. There is no reliable
-- existing signal (no history table entry, no created_by column) for who
-- actually made a pre-existing listing, so this migration does NOT guess
-- or assign N/M to old rows — that would fabricate data. Those legacy
-- rows are simply left alone; the new N/M UI only reads/writes rows where
-- person is 'N' or 'M', so legacy rows are invisible to it but are never
-- deleted or modified.
--
-- The old primary key (product_id, platform_id) can no longer hold, since
-- a platform can now have up to two rows per product (one per person, plus
-- possibly a legacy null-person row). A surrogate `id` primary key
-- replaces it, and a unique constraint on (product_id, platform_id,
-- person) prevents duplicate N or duplicate M rows for the same
-- product+platform — Postgres unique constraints treat NULL as distinct
-- from NULL, so this does not affect the single pre-existing legacy row
-- per product+platform.
--
-- RLS is unchanged: the existing "authenticated full access" policy on
-- product_platforms already covers all columns and all operations, so it
-- continues to apply as-is.

alter table product_platforms
  add column person text check (person in ('N', 'M'));

alter table product_platforms
  add column id bigint generated always as identity;

alter table product_platforms
  drop constraint product_platforms_pkey;

alter table product_platforms
  add primary key (id);

alter table product_platforms
  add constraint uq_product_platforms_product_platform_person
  unique (product_id, platform_id, person);
