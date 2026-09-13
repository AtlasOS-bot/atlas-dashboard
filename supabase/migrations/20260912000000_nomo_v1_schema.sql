-- =========================================================
-- NoMo V1 — Complete Supabase Schema (Phase 1)
-- =========================================================

-- ---------------------------------------------------------
-- SETTINGS / LOOKUP TABLES
-- ---------------------------------------------------------

create table categories (
  id           bigint generated always as identity primary key,
  name         text not null unique,
  nav_group    text,
  sort_order   integer not null default 0,
  active       boolean not null default true
);

create table subcategories (
  id           bigint generated always as identity primary key,
  category_id  bigint not null references categories(id) on delete restrict,
  name         text not null,
  sort_order   integer not null default 0,
  active       boolean not null default true,
  unique (category_id, name)
);

create table platforms (
  id           bigint generated always as identity primary key,
  name         text not null unique,
  sort_order   integer not null default 0,
  active       boolean not null default true
);

create table storage_locations (
  id           bigint generated always as identity primary key,
  name         text not null unique,
  sort_order   integer not null default 0,
  active       boolean not null default true
);

create table purchase_sources (
  id           bigint generated always as identity primary key,
  name         text not null unique,
  sort_order   integer not null default 0,
  active       boolean not null default true
);

-- ---------------------------------------------------------
-- PRODUCTS (Master Inventory)
-- ---------------------------------------------------------

create sequence products_inventory_id_seq start 1;

create table products (
  id                    bigint generated always as identity primary key,

  inventory_id          text not null unique
                          default ('NM-' || lpad(nextval('products_inventory_id_seq')::text, 6, '0')),

  item_name             text not null,
  brand                 text,

  category_id           bigint references categories(id) on delete restrict,
  subcategory_id        bigint references subcategories(id) on delete restrict,

  n_quantity            integer not null default 0 check (n_quantity >= 0),
  m_quantity            integer not null default 0 check (m_quantity >= 0),
  shared_quantity       integer not null default 0 check (shared_quantity >= 0),

  total_quantity        integer generated always as
                          (n_quantity + m_quantity + shared_quantity) stored,

  cost_each             numeric(12,2) check (cost_each >= 0),
  total_cost            numeric(14,2) generated always as
                          (cost_each * (n_quantity + m_quantity + shared_quantity)) stored,

  market_price          numeric(12,2) check (market_price >= 0),
  total_market_value    numeric(14,2) generated always as
                          (market_price * (n_quantity + m_quantity + shared_quantity)) stored,

  storage_location_id   bigint references storage_locations(id) on delete restrict,
  purchase_source_id    bigint references purchase_sources(id) on delete restrict,
  purchase_date         date,
  notes                 text,

  status                text generated always as (
                          case when (n_quantity + m_quantity + shared_quantity) = 0
                               then 'Out of Stock'
                               else 'In Stock'
                          end
                        ) stored,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- Lock inventory_id from ever changing after creation
create or replace function prevent_inventory_id_change()
returns trigger as $$
begin
  if new.inventory_id <> old.inventory_id then
    raise exception 'inventory_id is permanent and cannot be changed';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_products_lock_inventory_id
  before update on products
  for each row execute function prevent_inventory_id_change();

-- Keep updated_at current on every edit
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_products_set_updated_at
  before update on products
  for each row execute function set_updated_at();

-- ---------------------------------------------------------
-- PRODUCT PLATFORMS (per-platform listing status + URL)
-- ---------------------------------------------------------

create table product_platforms (
  product_id    bigint not null references products(id) on delete cascade,
  platform_id   bigint not null references platforms(id) on delete restrict,
  is_listed     boolean not null default false,
  listing_url   text,
  primary key (product_id, platform_id)
);

-- ---------------------------------------------------------
-- PRODUCT IMAGES (one main image now, room for more later)
-- ---------------------------------------------------------

create table product_images (
  id            bigint generated always as identity primary key,
  product_id    bigint not null references products(id) on delete cascade,
  image_url     text not null,
  is_main       boolean not null default false,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now()
);

-- Only one main image per product
create unique index uq_product_images_one_main
  on product_images (product_id)
  where is_main;

-- ---------------------------------------------------------
-- SALES
-- ---------------------------------------------------------

create table sales (
  id              bigint generated always as identity primary key,
  product_id      bigint not null references products(id) on delete restrict,

  quantity_sold   integer not null check (quantity_sold > 0),

  sold_from       text not null check (sold_from in ('N', 'M', 'Shared')),
  sold_by         text not null check (sold_by in ('N', 'M')),

  platform_id     bigint references platforms(id) on delete restrict,

  sale_price      numeric(12,2) not null check (sale_price >= 0),
  cost_snapshot   numeric(12,2) not null check (cost_snapshot >= 0),
  fees            numeric(12,2) not null default 0 check (fees >= 0),
  shipping        numeric(12,2) not null default 0 check (shipping >= 0),

  profit          numeric(12,2) generated always as
                    (sale_price - cost_snapshot - fees - shipping) stored,

  date_sold       date not null default current_date,
  notes           text,
  created_at      timestamptz not null default now()
);

-- Enforce "never negative": validate stock and decrement atomically
create or replace function handle_sale_insert()
returns trigger as $$
declare
  available integer;
begin
  perform 1 from products where id = new.product_id for update;

  select case new.sold_from
           when 'N' then n_quantity
           when 'M' then m_quantity
           when 'Shared' then shared_quantity
         end
    into available
    from products
    where id = new.product_id;

  if available is null then
    raise exception 'Product % not found', new.product_id;
  end if;

  if new.quantity_sold > available then
    raise exception 'Cannot sell % units from % — only % available',
      new.quantity_sold, new.sold_from, available;
  end if;

  update products
     set n_quantity      = case when new.sold_from = 'N'      then n_quantity - new.quantity_sold      else n_quantity end,
         m_quantity      = case when new.sold_from = 'M'      then m_quantity - new.quantity_sold      else m_quantity end,
         shared_quantity = case when new.sold_from = 'Shared' then shared_quantity - new.quantity_sold else shared_quantity end
   where id = new.product_id;

  return new;
end;
$$ language plpgsql;

create trigger trg_sales_handle_insert
  before insert on sales
  for each row execute function handle_sale_insert();

-- ---------------------------------------------------------
-- INVENTORY HISTORY (append-only audit log)
-- ---------------------------------------------------------

create table inventory_history (
  id            bigint generated always as identity primary key,
  occurred_at   timestamptz not null default now(),
  performed_by  text not null check (performed_by in ('N', 'M')),
  entity_type   text not null,
  entity_id     bigint not null,
  action        text not null,
  notes         text
);

-- No update/delete policies are granted below — insert + read only,
-- enforcing "history is never edited manually" at the access-control level.

-- ---------------------------------------------------------
-- ROW LEVEL SECURITY — authenticated users only, full shared access
-- ---------------------------------------------------------

alter table categories         enable row level security;
alter table subcategories      enable row level security;
alter table platforms          enable row level security;
alter table storage_locations  enable row level security;
alter table purchase_sources   enable row level security;
alter table products           enable row level security;
alter table product_platforms  enable row level security;
alter table product_images     enable row level security;
alter table sales              enable row level security;
alter table inventory_history  enable row level security;

create policy "authenticated full access" on categories
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on subcategories
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on platforms
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on storage_locations
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on purchase_sources
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on products
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on product_platforms
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on product_images
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on sales
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- inventory_history: read + insert only, no update/delete (append-only)
create policy "authenticated read" on inventory_history
  for select using (auth.role() = 'authenticated');
create policy "authenticated insert" on inventory_history
  for insert with check (auth.role() = 'authenticated');

-- =========================================================
-- OPTIONAL SEED DATA
-- =========================================================

insert into categories (name, nav_group, sort_order) values
  ('Pokémon', 'Master Inventory', 1),
  ('Star Wars Unlimited', 'Master Inventory', 2),
  ('Lorcana', 'Master Inventory', 3),
  ('One Piece', 'Master Inventory', 4),
  ('Magic', 'Master Inventory', 5),
  ('Sports Cards', 'Master Inventory', 6),
  ('Dolls', null, 7),
  ('Shoes', null, 8),
  ('Games', null, 9);

insert into platforms (name, sort_order) values
  ('Mercari', 1),
  ('eBay', 2),
  ('Facebook Marketplace', 3),
  ('OfferUp', 4),
  ('Whatnot', 5),
  ('Shopify', 6),
  ('Etsy', 7),
  ('TikTok Shop', 8);

insert into purchase_sources (name, sort_order) values
  ('Pokémon Center', 1),
  ('Costco', 2),
  ('Target', 3),
  ('Walmart', 4),
  ('Best Buy', 5),
  ('GameStop', 6),
  ('Amazon', 7),
  ('eBay', 8),
  ('Facebook Marketplace', 9),
  ('OfferUp', 10),
  ('Other', 11);

insert into storage_locations (name, sort_order) values
  ('Office', 1),
  ('Shelf A', 2),
  ('Shelf B', 3),
  ('Shelf C', 4),
  ('Bin 1', 5),
  ('Bin 2', 6),
  ('Garage', 7),
  ('Storage Unit', 8),
  ('Other', 9);
