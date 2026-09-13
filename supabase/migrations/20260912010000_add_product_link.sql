-- Stores the original Product Link a user pasted into Add Item, if any.
-- Not used for anything yet — reserved for future price/restock monitoring,
-- refreshing product info/images, and linking back to the retailer page.
alter table products
  add column product_link text;
