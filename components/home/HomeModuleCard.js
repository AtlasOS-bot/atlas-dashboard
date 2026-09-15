// Reusable Home module wrapper. `size` drives visual weight ("hero" |
// "large" | "medium" | "small") so the command center reads as a
// composed layout rather than a grid of identical boxes — every module
// on Home is built on this one card, not a bespoke implementation each.
export default function HomeModuleCard({
  title,
  icon,
  size = "medium",
  tag,
  children,
  className = "",
}) {
  return (
    <section className={`home-card home-card-${size} ${className}`.trim()}>
      <div className="home-card-header">
        <span className="home-card-title">
          {icon && <span className="home-card-icon">{icon}</span>}
          {title}
        </span>
        {tag && <span className="home-card-tag">{tag}</span>}
      </div>
      <div className="home-card-body">{children}</div>
    </section>
  );
}
