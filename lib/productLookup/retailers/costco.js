import { createHtmlParserProvider } from "../providers/htmlParserProvider";
import { runProviders } from "../runProviders";

export const costco = {
  name: "Costco",
  matches(hostname) {
    return hostname.replace(/^www\./, "") === "costco.com";
  },
  async parse(url) {
    const { product } = await runProviders([createHtmlParserProvider()], url);
    if (!product) return null;

    return { ...product, purchase_source: product.purchase_source || "Costco" };
  },
};
