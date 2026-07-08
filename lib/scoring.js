export function getRecommendation(score) {
  if (score >= 90) return "BUY";
  if (score >= 75) return "STRONG";
  if (score >= 55) return "WATCH";
  return "IGNORE";
}

export function getProfit(item) {
  const buy = Number(item.buy_price || 0);
  const sell = Number(item.expected_sale_price || 0);
  const fees = Number(item.estimated_fees || 0);
  const shipping = Number(item.estimated_shipping || 0);

  return sell - buy - fees - shipping;
}

export function getROI(item) {
  const buy = Number(item.buy_price || 0);
  const profit = getProfit(item);

  if (!buy) return 0;

  return Math.round((profit / buy) * 100);
}

export function getModule(item) {
  const text = `${item.brand || ""} ${item.item_name || ""}`.toLowerCase();
  const tcgTerms = ["pokemon", "pokémon", "lorcana", "tcg", "card"];

  return tcgTerms.some((term) => text.includes(term)) ? "tcg" : "resale";
}