"use client";

import { useCurrentUser } from "../../lib/currentUserContext";
import { getQuarterInfo } from "../../lib/homeDates";

export default function HomeHero() {
  const { person } = useCurrentUser();
  const { quarterLabel, year } = getQuarterInfo();

  return (
    <header className="home-hero">
      <div className="home-hero-glow" aria-hidden="true" />
      <div className="home-hero-content">
        <p className="home-hero-eyebrow">NOMO // COMMAND CENTER</p>
        <div className="home-hero-row">
          <span className="home-hero-person">{person || "—"}</span>
          <span className="home-hero-divider">•</span>
          <span className="home-hero-status">
            <span className="home-hero-status-dot" />
            SYSTEM ONLINE
          </span>
          <span className="home-hero-divider">•</span>
          <span className="home-hero-quarter">
            {quarterLabel} · {year}
          </span>
        </div>
      </div>
    </header>
  );
}
