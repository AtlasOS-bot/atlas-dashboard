-- Brand becomes a managed lookup table, same shape as categories/platforms/
-- purchase_sources/storage_locations, so it can be administered from Settings
-- and used as a quick-add-capable dropdown like the others.

create table brands (
  id           bigint generated always as identity primary key,
  name         text not null unique,
  sort_order   integer not null default 0,
  active       boolean not null default true
);

alter table brands enable row level security;

create policy "authenticated full access" on brands
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- The old free-text `brand` column is left in place (unused going forward)
-- rather than dropped, so no existing data is lost. brand_id is the column
-- the app now reads and writes.
alter table products
  add column brand_id bigint references brands(id) on delete restrict;

insert into brands (name, sort_order) values
  ('Pokémon', 1),
  ('Disney', 2),
  ('Mattel', 3),
  ('Funko', 4),
  ('Loungefly', 5),
  ('Nintendo', 6),
  ('Sony', 7),
  ('Microsoft', 8),
  ('Bandai', 9),
  ('Ravensburger', 10);
