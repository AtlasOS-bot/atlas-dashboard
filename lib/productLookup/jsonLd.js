// Most e-commerce sites embed Schema.org Product markup as JSON-LD for
// Google Shopping / SEO purposes, server-rendered into the initial HTML.
// This is the most reliable retailer-agnostic signal available, so every
// retailer service uses this as its primary extraction strategy.

export function extractJsonLdProducts(html) {
  const scripts = [
    ...html.matchAll(
      /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    ),
  ];

  const products = [];

  for (const match of scripts) {
    try {
      const parsed = JSON.parse(match[1].trim());
      const items = Array.isArray(parsed) ? parsed : [parsed];
      items.forEach((item) => collectProducts(item, products));
    } catch (err) {
      // Malformed JSON-LD block — skip it and keep looking.
    }
  }

  return products;
}

function collectProducts(node, products) {
  if (!node || typeof node !== "object") return;

  const type = node["@type"];
  const isProduct =
    type === "Product" || (Array.isArray(type) && type.includes("Product"));

  if (isProduct) {
    products.push(node);
  }

  if (Array.isArray(node["@graph"])) {
    node["@graph"].forEach((child) => collectProducts(child, products));
  }
}

export function normalizeJsonLdProduct(product) {
  if (!product) return null;

  const offer = Array.isArray(product.offers) ? product.offers[0] : product.offers;
  const image = Array.isArray(product.image) ? product.image[0] : product.image;
  const brand =
    typeof product.brand === "string" ? product.brand : product.brand?.name;
  const price = offer?.price ?? offer?.lowPrice ?? null;

  return {
    item_name: product.name || null,
    brand: brand || null,
    price: price != null ? Number(price) : null,
    image_url: image || null,
    category: typeof product.category === "string" ? product.category : null,
  };
}
