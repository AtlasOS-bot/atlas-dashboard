import { pokemonCenter } from "./retailers/pokemonCenter";
import { target } from "./retailers/target";
import { walmart } from "./retailers/walmart";
import { costco } from "./retailers/costco";
import { bestBuy } from "./retailers/bestBuy";
import { gamestop } from "./retailers/gamestop";
import { amazon } from "./retailers/amazon";

// Adding a new retailer in the future is: write a new file in ./retailers
// following the same { name, matches(hostname), parse(url) } shape — internally
// it declares its own provider chain (official API -> structured feed/API ->
// HTML parsing, in priority order) — then add it to this list. Nothing else
// in the app needs to change, and this file never knows which provider a
// retailer actually used.
const RETAILERS = [pokemonCenter, target, walmart, costco, bestBuy, gamestop, amazon];

export function findRetailer(url) {
  try {
    const hostname = new URL(url).hostname;
    return RETAILERS.find((retailer) => retailer.matches(hostname)) || null;
  } catch (err) {
    return null;
  }
}

export async function lookupProduct(url) {
  const retailer = findRetailer(url);

  if (!retailer) {
    return { supported: false };
  }

  try {
    const product = await retailer.parse(url);
    return { supported: true, retailer: retailer.name, product };
  } catch (err) {
    return {
      supported: true,
      retailer: retailer.name,
      product: null,
      error: "Could not retrieve product details from that link.",
    };
  }
}
