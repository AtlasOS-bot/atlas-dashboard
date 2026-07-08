export default function MetricCard({ title, value, icon }) {
  return (
    <div className="metric-card">
      <div className="metric-label">
        {icon} {title}
      </div>
      <h2>{value}</h2>
    </div>
  );
}