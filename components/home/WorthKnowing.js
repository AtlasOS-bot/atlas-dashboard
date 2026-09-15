"use client";

import { useState } from "react";
import HomeModuleCard from "./HomeModuleCard";
import { WORTH_KNOWING, pickByDay } from "../../lib/homeContent";

export default function WorthKnowing() {
  const [revealed, setRevealed] = useState(false);
  const item = pickByDay(WORTH_KNOWING);

  return (
    <HomeModuleCard title="WORTH KNOWING" icon="💡" size="medium">
      <p className="worth-knowing-question">{item.q}</p>
      {revealed ? (
        <p className="worth-knowing-answer">{item.a}</p>
      ) : (
        <button
          type="button"
          className="worth-knowing-reveal"
          onClick={() => setRevealed(true)}
        >
          TAP TO REVEAL
        </button>
      )}
    </HomeModuleCard>
  );
}
