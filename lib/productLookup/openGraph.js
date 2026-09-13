// Fallback signal source for sites that don't embed JSON-LD Product data but
// do set Open Graph meta tags (common, since those drive social link
// previews and are usually still server-rendered even in JS-heavy SPAs).

function getMetaContent(html, property) {
  const pattern = new RegExp(
    `<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']*)["']`,
    "i"
  );
  const altPattern = new RegExp(
    `<meta[^>]+content=["']([^"']*)["'][^>]+property=["']${property}["']`,
    "i"
  );

  const match = html.match(pattern) || html.match(altPattern);
  return match ? match[1] : null;
}

export function extractOpenGraphProduct(html) {
  const title = getMetaContent(html, "og:title");
  const image = getMetaContent(html, "og:image");
  const price =
    getMetaContent(html, "product:price:amount") ||
    getMetaContent(html, "og:price:amount");

  if (!title && !image && !price) return null;

  return {
    item_name: title && title !== "undefined" ? title : null,
    brand: null,
    price: price ? Number(price) : null,
    image_url: image || null,
    category: null,
  };
}
