import { createBestBuyApiProvider } from "../providers/bestBuyApiProvider";
import { createHtmlParserProvider } from "../providers/htmlParserProvider";
import { runProviders } from "../runProviders";

export const bestBuy = {
  name: "Best Buy",
  matches(hostname) {
    return hostname.replace(/^www\./, "") === "bestbuy.com";
  },
  async parse(url) {
    const { product } = await runProviders(
      [createBestBuyApiProvider(), createHtmlParserProvider()],
      url
    );
    if (!product) return null;

    return { ...product, purchase_source: product.purchase_source || "Best Buy" };
  },
};
