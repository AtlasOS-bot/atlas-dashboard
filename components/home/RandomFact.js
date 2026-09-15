import HomeModuleCard from "./HomeModuleCard";
import { RANDOM_FACTS, pickByDay } from "../../lib/homeContent";

export default function RandomFact() {
  const fact = pickByDay(RANDOM_FACTS);

  return (
    <HomeModuleCard title="RANDOM FACT" icon="✳" size="small">
      <p className="home-placeholder-text">{fact}</p>
    </HomeModuleCard>
  );
}
