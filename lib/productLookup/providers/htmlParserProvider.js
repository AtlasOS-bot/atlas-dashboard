import { fetchHtml } from "../fetchHtml";
import { extractJsonLdProducts, normalizeJsonLdProduct } from "../jsonLd";
import { extractOpenGraphProduct } from "../openGraph";
import { mergeProductSignals } from "../mergeSignals";

// Tier 3 (HTML parsing) — the fallback every retailer can rely on, since it
// needs no credentials. Used directly by retailers with no API integration,
// and as the last resort for retailers that do have one.
export function createHtmlParserProvider() {
  return {
    id: "html-parser",
    isAvailable() {
      return true;
    },
    async fetchProduct(url) {
      const html = await fetchHtml(url);
      const jsonLd = normalizeJsonLdProduct(extractJsonLdProducts(html)[0]);
      const openGraph = extractOpenGraphProduct(html);
      return mergeProductSignals(jsonLd, openGraph);
    },
  };
}
