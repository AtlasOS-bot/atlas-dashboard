"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [opportunities, setOpportunities] = useState([]);

  useEffect(() => {
    async function loadData() {
      const { data, error } = await supabase
        .from("opportunities")
        .select("*")
        .order("confidence_score", { ascending: false })
        .limit(10);

      if (error) {
        console.error(error);
        return;
      }

      setOpportunities(data || []);
    }

    loadData();
  }, []);

  const avgScore = opportunities.length
    ? Math.round(opportunities.reduce((sum, x) => sum + (x.confidence_score || 0), 0) / opportunities.length)
    : 0;

  return (
    <main style={{ minHeight: "100vh", padding: "50px", color: "white" }}>
      <h1 style={{ fontSize: "56px", letterSpacing: "6px", color: "#7DF9FF" }}>
        ATLAS OS
      </h1>

      <p style={{ color: "#87CEFA", marginBottom: 40 }}>
        MARKET INTELLIGENCE COMMAND CENTER
      </p>

      <div className="grid">
        <Metric title="OPPORTUNITIES" value={opportunities.length} icon="🚨" />
        <Metric title="AVG SCORE" value={avgScore} icon="⭐" />
        <Metric title="SCOUTS" value="LIVE" icon="📡" />
        <Metric title="ATLAS CORE" value="READY" icon="🧠" />
      </div>

      <section className="panel">
        <h2>LIVE OPPORTUNITIES</h2>

        {opportunities.length === 0 ? (
          <p>Connected, but no opportunities found.</p>
        ) : (
          opportunities.map((item) => (
            <div className="row" key={item.id}>
              <div>
                <strong>{item.brand}</strong>
                <p>{item.item_name}</p>
              </div>
              <div className="score">{item.confidence_score}</div>
              <div>{item.market_signal_status || "watch"}</div>
              <a href={item.ebay_sold_comps_url || "#"} target="_blank">eBay</a>
            </div>
          ))
        )}
      </section>
    </main>
  );
}

function Metric({ title, value, icon }) {
  return (
    <div className="metric-card">
      <div>{icon} {title}</div>
      <h2>{value}</h2>
    </div>
  );
}