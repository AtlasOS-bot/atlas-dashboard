"use client";

import { getQuarterInfo, getNextQuarterCountdown } from "../../lib/homeDates";

// "NoMo" / "Nothiing & More" / SYSTEM ONLINE / Sign Out already live in the
// compact app Header — this is deliberately just a one-line quarter/
// countdown status strip, not a second branding block.
export default function HomeHero() {
  const { quarterLabel, year } = getQuarterInfo();
  const { nextQuarterLabel, daysUntil } = getNextQuarterCountdown();
  const dayWord = daysUntil === 1 ? "day" : "days";

  return (
    <div className="home-status-strip">
      <span>
        {quarterLabel} · {year}
      </span>
      <span className="home-status-strip-divider">•</span>
      <span>
        {nextQuarterLabel} begins in {daysUntil} {dayWord}
      </span>
    </div>
  );
}
