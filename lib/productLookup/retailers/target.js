import { createHtmlParserProvider } from "../providers/htmlParserProvider";
import { runProviders } from "../runProviders";

export const target = {
  name: "Target",
  matches(hostname) {
    return hostname.replace(/^www\./, "") === "target.com";
  },
  async parse(url) {
    const { product } = await runProviders([createHtmlParserProvider()], url);
    if (!product) return null;

    return { ...product, purchase_source: product.purchase_source || "Target" };
  },
};
