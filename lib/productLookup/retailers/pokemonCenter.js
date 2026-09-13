import { createHtmlParserProvider } from "../providers/htmlParserProvider";
import { runProviders } from "../runProviders";

export const pokemonCenter = {
  name: "Pokémon Center",
  matches(hostname) {
    return hostname.replace(/^www\./, "") === "pokemoncenter.com";
  },
  async parse(url) {
    const { product } = await runProviders([createHtmlParserProvider()], url);
    if (!product) return null;

    return {
      ...product,
      // Every product on this site is obviously Pokémon merchandise.
      category: "Pokémon",
      purchase_source: product.purchase_source || "Pokémon Center",
    };
  },
};
