export function calculateAtlasScore(item) {
  const confidence = Number(item.confidence_score || 0);
  const marketStrength = item.market_signal_status === "strong" ? 15 : 0;
  const hasEbay = item.ebay_sold_comps_url ? 10 : 0;
  const hasSource = item.official_url ? 5 : 0;

  const score = confidence + marketStrength + hasEbay + hasSource;

  return Math.min(score, 100);
}