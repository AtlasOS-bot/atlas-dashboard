import { createHtmlParserProvider } from "../providers/htmlParserProvider";
import { runProviders } from "../runProviders";

export const gamestop = {
  name: "GameStop",
  matches(hostname) {
    return hostname.replace(/^www\./, "") === "gamestop.com";
  },
  async parse(url) {
    const { product } = await runProviders([createHtmlParserProvider()], url);
    if (!product) return null;

    return {
      ...product,
      // Almost everything on this site is obviously a game/game-adjacent item.
      category: product.category || "Games",
      purchase_source: product.purchase_source || "GameStop",
    };
  },
};
