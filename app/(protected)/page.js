import HomeHero from "../../components/home/HomeHero";
import ObjectivesSection from "../../components/home/ObjectivesSection";
import SharedNotes from "../../components/home/SharedNotes";
import CalendarModule from "../../components/home/CalendarModule";
import PlaceholderModule from "../../components/home/PlaceholderModule";

export default function Home() {
  return (
    <div className="home-page">
      <HomeHero />

      <div className="home-modules-grid">
        <ObjectivesSection />
        <SharedNotes />
        <CalendarModule />
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
