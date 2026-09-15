import HomeModuleCard from "./HomeModuleCard";

// Deliberately not simulating live AI output — the UI/architecture is
// ready for a real briefing source, but nothing here is fabricated data.
export default function AiDailyBriefing() {
  return (
    <HomeModuleCard title="AI DAILY BRIEFING" icon="✦" tag="ARCHITECTURE READY">
      <p className="home-placeholder-text">
        N/M&apos;s daily business briefing will summarize trends, resale
        opportunities, and calendar events here once a live source is
        connected. Nothing is simulated yet.
      </p>
    </HomeModuleCard>
  );
}
