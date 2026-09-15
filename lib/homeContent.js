// Curated local content for Worth Knowing / Random Fact / Daily Challenge /
// Interesting History. Deliberately static for now — the goal is a small,
// genuinely accurate set rather than fabricated "live" data, structured so
// a future version can swap pickByDay()'s source for a dynamic/AI one
// without changing any component.

export const WORTH_KNOWING = [
  {
    q: "Why do retailers end prices in .99?",
    a: "Shoppers read prices left-to-right and anchor on the leading digit, so $19.99 registers as \"$19-something\" rather than $20 — a well-documented effect called left-digit bias that measurably lifts conversion even though the saving is a single cent.",
  },
  {
    q: "Why do supermarkets put milk at the back of the store?",
    a: "Milk and eggs are bought on nearly every visit, so placing them farthest from the entrance forces a walk past higher-margin aisles — increasing the odds of impulse purchases along the way.",
  },
  {
    q: "Why are shipping containers a standardized size?",
    a: "Before the 1960s ISO standard, cargo was loaded and unloaded piece by piece by hand. A single fixed container size let cranes, ships, trucks, and trains all interlock globally, which is a major reason international shipping costs collapsed over the following decades.",
  },
  {
    q: "Why does scarcity increase collectible prices?",
    a: "When supply is fixed or shrinking (a discontinued print run, a sealed box that can never be resealed) but demand holds or grows, buyers compete harder for the same limited units — the same basic supply-and-demand dynamic that drives any market, just visible fast in collectibles.",
  },
  {
    q: "Why do companies use dynamic pricing?",
    a: "Prices that shift with demand, time, or inventory levels (airline seats, rideshares, some resale platforms) let a seller capture more value during high-demand moments and move inventory faster during low-demand ones, instead of picking one price and living with it either way.",
  },
  {
    q: "Why do some products suddenly become highly collectible?",
    a: "A cultural moment (a show, a nostalgia wave, an influencer) can spike demand for something with a fixed historical supply — since more can't be produced, the price has to move instead.",
  },
];

export const RANDOM_FACTS = [
  "The barcode was first scanned on a pack of chewing gum in 1974 — retail's entire modern inventory-tracking system traces back to that one transaction.",
  "Costco's return policy is intentionally generous because the membership fee, not markup, is where most of its profit comes from — the store is optimized to keep members renewing, not to maximize each sale.",
  "Amazon's original name, Cadabra, was dropped after a lawyer misheard it as \"cadaver\" over the phone.",
  "The \"as seen on TV\" boom of the 1990s helped popularize the 30-day money-back guarantee — a trust mechanism that later became standard across e-commerce.",
  "FedEx's original overnight-delivery model only became profitable once it built a centralized sorting hub in Memphis — routing everything through one point, rather than direct city-to-city, cut the number of routes needed.",
  "The first item ever sold on eBay was a broken laser pointer, in 1995 — the founder was reportedly surprised anyone actually wanted it.",
  "Trading stamps (like S&H Green Stamps) were one of the earliest loyalty-point systems, predating airline miles and store rewards cards by decades.",
];

export const DAILY_CHALLENGES = [
  "Find one product currently selling for 30%+ above retail.",
  "Identify one category showing unusual demand this week.",
  "Find one process in NoMo that could be automated.",
  "Research one upcoming release worth watching.",
  "Look for one item in inventory that's been sitting unlisted longer than it should.",
  "Find one platform or marketplace you haven't tried listing on yet.",
  "Spot one pricing gap between two platforms for the same item.",
];

export const HISTORY_FACTS = [
  "Henry Ford's moving assembly line (1913) cut Model T production time from about 12 hours to roughly 90 minutes, reshaping how goods of all kinds would be manufactured.",
  "The Sears catalog, launched in the late 1800s, was one of the first large-scale mail-order retail systems — a direct ancestor of today's e-commerce.",
  "Barcodes and UPCs became a retail standard in the 1970s specifically to speed up checkout and give stores real inventory data for the first time.",
  "The first commercial container ship, the Ideal-X, sailed in 1956 — a change in logistics that eventually made global shipping dramatically cheaper.",
  "Nasdaq launched in 1971 as the world's first electronic stock market, replacing a purely floor-based trading system.",
  "Ray Kroc didn't found McDonald's — he franchised it from the McDonald brothers, then built the franchising and supply-chain model that made it a global business.",
];

export function pickByDay(list, date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((date - start) / 86400000);
  return list[dayOfYear % list.length];
}
