import { createWalmartApiProvider } from "../providers/walmartApiProvider";
import { createHtmlParserProvider } from "../providers/htmlParserProvider";
import { runProviders } from "../runProviders";

export const walmart = {
  name: "Walmart",
  matches(hostname) {
    return hostname.replace(/^www\./, "") === "walmart.com";
  },
  async parse(url) {
    const { product } = await runProviders(
      [createWalmartApiProvider(), createHtmlParserProvider()],
      url
    );
    if (!product) return null;

    return { ...product, purchase_source: product.purchase_source || "Walmart" };
  },
};
