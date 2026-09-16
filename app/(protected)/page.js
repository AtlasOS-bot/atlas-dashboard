import HomeHero from "../../components/home/HomeHero";
import ObjectivesSection from "../../components/home/ObjectivesSection";
import SharedNotes from "../../components/home/SharedNotes";
import CalendarModule from "../../components/home/CalendarModule";

export default function Home() {
  return (
    <div className="home-page">
      <HomeHero />

      <div className="home-modules-grid">
        <ObjectivesSection />
        <SharedNotes />
        <CalendarModule />
      </div>
    </div>
  );
}
