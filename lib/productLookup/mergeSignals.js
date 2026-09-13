export function mergeProductSignals(primary, fallback) {
  if (!primary && !fallback) return null;
  if (!primary) return fallback;
  if (!fallback) return primary;

  return {
    item_name: primary.item_name || fallback.item_name,
    brand: primary.brand || fallback.brand,
    price: primary.price ?? fallback.price,
    image_url: primary.image_url || fallback.image_url,
    category: primary.category || fallback.category,
  };
}
