"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const ATLAS_PASSKEY = process.env.NEXT_PUBLIC_ATLAS_PASSKEY;

export default function Home() {
  const [opportunities, setOpportunities] = useState([]);
  const [enteredPasskey, setEnteredPasskey] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [module, setModule] = useState("resale");

  useEffect(() => {
    async function loadData() {
      if (!unlocked) return;

      const { data } = await supabase
        .from("opportunities")
        .select("*")
        .order("confidence_score", { ascending: false })
        .limit(50);

      setOpportunities(data || []);
    }

    loadData();
  }, [unlocked]);

  if (!unlocked) {
    return (
      <main className="lock-screen">
        <div className="lock-card">
          <h1>ATLAS OS</h1>
          <p>Secure Market Intelligence Access</p>

          <input
            type="password"
            placeholder="Enter Passkey"
            value={enteredPasskey}
            onChange={(e) => setEnteredPasskey(e.target.value)}
          />

          <button
            onClick={() => {
              if (enteredPasskey === ATLAS_PASSKEY) {
                setUnlocked(true);
              } else {
                alert("Incorrect passkey.");
              }
            }}
          >
            Unlock Atlas
          </button>
        </div>
      </main>
    );
  }

  const tcgTerms = ["pokemon", "pokémon", "lorcana", "tcg", "card"];
  const filtered = opportunities.filter((item) => {
    const text = `${item.brand || ""} ${item.item_name || ""}`.toLowerCase();
    const isTcg = tcgTerms.some((term) => text.includes(term));
    return module === "tcg" ? isTcg : !isTcg;
  });

  const avgScore = filtered.length
    ? Math.round(
        filtered.reduce((sum, item) => sum + (item.confidence_score || 0), 0) /
          filtered.length
      )
    : 0;

  const bestScore = filtered.length
    ? Math.max(...filtered.map((item) => item.confidence_score || 0))
    : 0;

  return (
    <main className="atlas-shell">
      <header className="atlas-header">
        <div>
          <h1>ATLAS OS</h1>
          <p>RESALE + TCG INTELLIGENCE COMMAND CENTER</p>
        </div>

        <div className="system-pill">● SYSTEM ONLINE</div>
      </header>

      <div className="module-tabs">
        <button
          className={module === "resale" ? "active" : ""}
          onClick={() => setModule("resale")}
        >
          💰 Resale Module
        </button>

        <button
          className={module === "tcg" ? "active" : ""}
          onClick={() => setModule("tcg")}
        >
          🃏 TCG Module
        </button>
      </div>

      <section className="grid">
        <Metric title="ACTIVE ITEMS" value={filtered.length} icon="📦" />
        <Metric title="AVG SCORE" value={avgScore} icon="⭐" />
        <Metric title="BEST SCORE" value={bestScore} icon="🔥" />
        <Metric title="MODULE" value={module.toUpperCase()} icon="🧠" />
      </section>

      <section className="panel">
        <h2>
          {module === "resale"
            ? "LIVE RESALE INTELLIGENCE"
            : "LIVE TCG INTELLIGENCE"}
        </h2>

        {filtered.length === 0 ? (
          <p className="muted">No opportunities found for this module yet.</p>
        ) : (
          filtered.map((item) => <OpportunityCard key={item.id} item={item} />)
        )}
      </section>
    </main>
  );
}

function Metric({ title, value, icon }) {
  return (
    <div className="metric-card">
      <div className="metric-label">
        {icon} {title}
      </div>
      <h2>{value}</h2>
    </div>
  );
}

function OpportunityCard({ item }) {
  const score = item.confidence_score || 0;

  let badge = "WATCH";
  if (score >= 90) badge = "BUY";
  else if (score >= 75) badge = "STRONG";
  else if (score >= 55) badge = "WATCH";

  return (
    <div className="opportunity-card">
      <div className="opportunity-main">
        <div className="top-line">
          <span className="brand">{item.brand}</span>
          <span className={`recommendation ${badge.toLowerCase()}`}>
            {badge}
          </span>
        </div>

        <h3>{item.item_name}</h3>

        <p className="reason">
          {item.atlas_reason || "Atlas is still learning why this matters."}
        </p>

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