import { createAmazonApiProvider } from "../providers/amazonApiProvider";
import { createHtmlParserProvider } from "../providers/htmlParserProvider";
import { runProviders } from "../runProviders";

export const amazon = {
  name: "Amazon",
  matches(hostname) {
    return hostname.replace(/^www\./, "") === "amazon.com";
  },
  async parse(url) {
    const { product } = await runProviders(
      [createAmazonApiProvider(), createHtmlParserProvider()],
      url
    );
    if (!product) return null;

    return { ...product, purchase_source: product.purchase_source || "Amazon" };
  },
};
