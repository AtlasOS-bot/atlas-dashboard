export function getReasons(item, score) {
  const reasons = [];

  if (item.ebay_sold_comps_url) {
    reasons.push("eBay sold comps available");
  }

  if (item.official_url) {
    reasons.push("Official source link found");
  }

  if (item.market_signal_status) {
    reasons.push(`Market signal: ${item.market_signal_status}`);
  }

  if (score >= 90) {
    reasons.push("High confidence opportunity");
  }

  if (reasons.length === 0) {
    reasons.push("Atlas is still learning why this matters.");
  }

  return reasons;
}