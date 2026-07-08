import {
  calculateAtlasScore,
  getDecision,
  getReasons,
} from "../core";

export default function OpportunityCard({ item }) {
  const score = calculateAtlasScore(item);
  const decision = getDecision(score);
  const reasons = getReasons(item, score);

  return (
    <div className="opportunity-card">
      <div className="opportunity-main">
        <div className="top-line">
          <span className="brand">{item.brand}</span>
          <span className={`recommendation ${decision.toLowerCase().replaceAll(" ", "-")}`}>
            {decision}
          </span>
        </div>

        <h3>{item.item_name}</h3>

        <div className="reason-list">
          {reasons.map((reason, index) => (
            <p key={index}>✓ {reason}</p>
          ))}
        </div>

        <div className="mini-signals">
          <span>Market: {item.market_signal_status || "watch"}</span>
          <span>Action: {item.recommended_action || "Review"}</span>
        </div>
      </div>

      <div className="score-block">
        <span>Atlas Score</span>
        <strong>{score}</strong>
        <small>/100</small>
      </div>

      <div className="action-block">
        {item.ebay_sold_comps_url && (
          <a href={item.ebay_sold_comps_url} target="_blank">
            eBay Solds
          </a>
        )}

        {item.official_url && (
          <a href={item.official_url} target="_blank">
            Official Source
          </a>
        )}
      </div>
    </div>
  );
}