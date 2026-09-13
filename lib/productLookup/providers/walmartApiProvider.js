import { config } from "../config";

function extractItemId(url) {
  const ipPath = url.match(/\/ip\/[^/]+\/(\d+)/);
  if (ipPath) return ipPath[1];

  const trailingId = url.match(/\/(\d{5,})(?:\?|$)/);
  return trailingId ? trailingId[1] : null;
}

// Tier 1 (official API) — real implementation against Walmart's item-lookup
// endpoint. Only activates once WALMART_API_KEY is set. Walmart's public API
// program has changed shape over the years, so treat this as best-effort
// until it's exercised against a real key.
export function createWalmartApiProvider() {
  return {
    id: "walmart-official-api",
    isAvailable() {
      return Boolean(config.walmart.apiKey);
    },
    async fetchProduct(url) {
      const itemId = extractItemId(url);
      if (!itemId) return null;

      const endpoint = `https://api.walmartlabs.com/v1/items/${itemId}?apiKey=${config.walmart.apiKey}&format=json`;
      const response = await fetch(endpoint, {
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) return null;

      const product = await response.json();
      if (!product || !product.name) return null;

      return {
        item_name: product.name || null,
        brand: product.brandName || null,
        price: product.salePrice ?? null,
        image_url: product.largeImage || product.mediumImage || null,
        category: product.categoryPath || null,
        purchase_source: "Walmart",
      };
    },
  };
}
