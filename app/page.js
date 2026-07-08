"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

import LockScreen from "../components/LockScreen";
import Header from "../components/Header";
import MetricCard from "../components/MetricCard";
import OpportunityCard from "../components/OpportunityCard";
import Sidebar from "../components/Sidebar";

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
      <LockScreen
        enteredPasskey={enteredPasskey}
        setEnteredPasskey={setEnteredPasskey}
        unlock={() => {
          if (enteredPasskey === ATLAS_PASSKEY) {
            setUnlocked(true);
          } else {
            alert("Incorrect passkey.");
          }
        }}
      />
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
    <div className="app-frame">
      <Sidebar module={module} setModule={setModule} />

      <main className="atlas-shell">
        <Header />

        <section className="grid">
          <MetricCard title="ACTIVE ITEMS" value={filtered.length} icon="📦" />
          <MetricCard title="AVG SCORE" value={avgScore} icon="⭐" />
          <MetricCard title="BEST SCORE" value={bestScore} icon="🔥" />
          <MetricCard title="MODULE" value={module.toUpperCase()} icon="🧠" />
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
            filtered.map((item) => (
              <OpportunityCard key={item.id} item={item} />
            ))
          )}
        </section>
      </main>
    </div>
  );
}