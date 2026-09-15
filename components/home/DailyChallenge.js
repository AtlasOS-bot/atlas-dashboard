import HomeModuleCard from "./HomeModuleCard";
import { DAILY_CHALLENGES, pickByDay } from "../../lib/homeContent";

export default function DailyChallenge() {
  const challenge = pickByDay(DAILY_CHALLENGES);

  return (
    <HomeModuleCard title="DAILY CHALLENGE" icon="🎯" size="small">
      <p className="home-placeholder-text">{challenge}</p>
    </HomeModuleCard>
  );
}
