export function getDecision(score) {
  if (score >= 90) return "BUY";
  if (score >= 75) return "STRONG";
  if (score >= 55) return "WATCH";
  return "IGNORE";
}