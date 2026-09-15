import HomeModuleCard from "./HomeModuleCard";

// One shared implementation for every Home module that has no live data
// source yet (Business Trends, Resale Trends, Pokémon Market, Calendar,
// Goals, Local Events, Financial Progress, Personal Productivity) —
// config-driven so connecting real data later means swapping content in,
// not building a new component.
export default function PlaceholderModule({ title, icon, size = "medium", description }) {
  return (
    <HomeModuleCard title={title} icon={icon} size={size} tag="COMING SOON">
      <p className="home-placeholder-text">{description}</p>
    </HomeModuleCard>
  );
}
