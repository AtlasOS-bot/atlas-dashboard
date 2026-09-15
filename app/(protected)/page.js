import HomeHero from "../../components/home/HomeHero";
import AiDailyBriefing from "../../components/home/AiDailyBriefing";
import ObjectivesSection from "../../components/home/ObjectivesSection";
import SharedNotes from "../../components/home/SharedNotes";
import WorthKnowing from "../../components/home/WorthKnowing";
import RandomFact from "../../components/home/RandomFact";
import DailyChallenge from "../../components/home/DailyChallenge";
import InterestingHistory from "../../components/home/InterestingHistory";
import PlaceholderModule from "../../components/home/PlaceholderModule";

export default function Home() {
  return (
    <div className="home-page">
      <HomeHero />

      <div className="home-modules-grid">
        <AiDailyBriefing />
        <ObjectivesSection />
        <SharedNotes />
        <WorthKnowing />
        <RandomFact />
        <DailyChallenge />
        <InterestingHistory />
        <PlaceholderModule
          title="BUSINESS TRENDS"
          icon="📈"
          description="Retail, consumer behavior, and e-commerce shifts will surface here once a data source is connected."
        />
        <PlaceholderModule
          title="RESALE TRENDS"
          icon="🔁"
          description="Categories heating up or cooling down, and price movement, will surface here once connected."
        />
        <PlaceholderModule
          title="POKÉMON MARKET"
          icon="🃏"
          description="Notable price movement, hot products, and upcoming releases will surface here once connected."
        />
        <PlaceholderModule
          title="CALENDAR"
          icon="🗓️"
          description="Business dates, releases, and planned objectives will surface here."
        />
        <PlaceholderModule
          title="GOALS"
          icon="🧭"
          description="Longer-term ongoing goals will live here, separate from the objective ladder above."
        />
        <PlaceholderModule
          title="LOCAL EVENTS"
          icon="📍"
          description="Location-aware events will surface here once a source is connected."
        />
        <PlaceholderModule
          title="FINANCIAL PROGRESS"
          icon="💹"
          description="A progress-oriented view of NoMo's trajectory over time — not a duplicate of the Inventory dashboard's metrics."
        />
        <PlaceholderModule
          title="PERSONAL PRODUCTIVITY"
          icon="⚡"
          description="Objective completion, consistency, and activity trends will surface here."
        />
      </div>
    </div>
  );
}
