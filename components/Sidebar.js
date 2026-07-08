export default function Sidebar({ module, setModule }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">A</div>

      <button
        className={module === "resale" ? "side-active" : ""}
        onClick={() => setModule("resale")}
      >
        💰 Resale
      </button>

      <button
        className={module === "tcg" ? "side-active" : ""}
        onClick={() => setModule("tcg")}
      >
        🃏 TCG
      </button>

      <button disabled>⭐ Watchlist</button>
      <button disabled>🚨 Alerts</button>
      <button disabled>📊 Analytics</button>
    </aside>
  );
}