import { config } from "../config";

function extractSku(url) {
  const skuParam = url.match(/[?&]skuId=(\d+)/);
  if (skuParam) return skuParam[1];

  const pathSku = url.match(/\/(\d+)\.p(?:\?|$)/);
  return pathSku ? pathSku[1] : null;
}

// Tier 1 (official API) — Best Buy's Products API uses simple key-based
// auth, so this is a real implementation, not a stub. It only activates once
// BESTBUY_API_KEY is set; until then isAvailable() keeps it out of the way.
export function createBestBuyApiProvider() {
  return {
    id: "bestbuy-official-api",
    isAvailable() {
      return Boolean(config.bestBuy.apiKey);
    },
    async fetchProduct(url) {
      const sku = extractSku(url);
      if (!sku) return null;

      const endpoint = `https://api.bestbuy.com/v1/products(sku=${sku})?apiKey=${config.bestBuy.apiKey}&format=json`;
      const response = await fetch(endpoint, {
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) return null;

      const data = await response.json();
      const product = data.products?.[0];
      if (!product) return null;

      return {
        item_name: product.name || null,
        brand: product.manufacturer || null,
        price: product.salePrice ?? product.regularPrice ?? null,
        image_url: product.image || null,
        category:
          product.categoryPath?.[product.categoryPath.length - 1]?.name || null,
        purchase_source: "Best Buy",
      };
    },
  };
}
