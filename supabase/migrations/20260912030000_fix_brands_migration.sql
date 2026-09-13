-- Brings the database to the schema the app expects, regardless of whether
-- it is currently in the original schema (no brands table at all), the
-- partially-applied schema (brands exists but missing columns/brand_id),
-- or the fully-applied schema. Safe to run multiple times.

begin;

create table if not exists brands (
  id    bigint generated always as identity primary key,
  name  text not null unique
);

alter table brands add column if not exists sort_order integer not null default 0;
alter table brands add column if not exists active boolean not null default true;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'brands_name_key' and conrelid = 'brands'::regclass
  ) then
    alter table brands add constraint brands_name_key unique (name);
  end if;
end $$;

alter table products add column if not exists brand_id bigint references brands(id) on delete restrict;

alter table brands enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'brands' and policyname = 'authenticated full access'
  ) then
    create policy "authenticated full access" on brands
      for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
  end if;
end $$;

insert into brands (name, sort_order)
select v.name, v.sort_order
from (values
  ('Pokémon', 1),
  ('Disney', 2),
  ('Mattel', 3),
  ('Funko', 4),
  ('Loungefly', 5),
  ('Nintendo', 6),
  ('Sony', 7),
  ('Microsoft', 8),
  ('Bandai', 9),
  ('Ravensburger', 10)
) as v(name, sort_order)
where not exists (select 1 from brands where brands.name = v.name);

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'products' and column_name = 'brand'
  ) then
    with distinct_brands as (
      select distinct trim(p.brand) as name
      from products p
      where p.brand is not null
        and trim(p.brand) <> ''
        and not exists (
          select 1 from brands b where lower(trim(b.name)) = lower(trim(p.brand))
        )
    ),
    next_sort as (
      select coalesce(max(sort_order), 0) as base from brands
    )
    insert into brands (name, sort_order, active)
    select db.name, next_sort.base + row_number() over (order by db.name), true
    from distinct_brands db, next_sort;

    update products p
    set brand_id = b.id
    from brands b
    where p.brand_id is null
      and p.brand is not null
      and trim(p.brand) <> ''
      and lower(trim(b.name)) = lower(trim(p.brand));
  end if;
end $$;

commit;

notify pgrst, 'reload schema';
