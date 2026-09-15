import HomeModuleCard from "./HomeModuleCard";
import { HISTORY_FACTS, pickByDay } from "../../lib/homeContent";

export default function InterestingHistory() {
  const fact = pickByDay(HISTORY_FACTS);

  return (
    <HomeModuleCard title="INTERESTING HISTORY" icon="🕰️" size="small">
      <p className="home-placeholder-text">{fact}</p>
    </HomeModuleCard>
  );
}
