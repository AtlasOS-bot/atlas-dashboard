// Period keys for the Home objective ladder (quarter/month/week/day),
// all derived from the local calendar date — never hard-coded.

export function getQuarterInfo(date = new Date()) {
  const year = date.getFullYear();
  const quarter = Math.floor(date.getMonth() / 3) + 1;
  return { key: `${year}-Q${quarter}`, quarterLabel: `Q${quarter}`, year };
}

export function getMonthInfo(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  return {
    key: `${year}-${String(month).padStart(2, "0")}`,
    label: date.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  };
}

// ISO 8601 week number.
export function getWeekInfo(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return {
    key: `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`,
    label: `Week ${weekNo}, ${d.getUTCFullYear()}`,
  };
}

export function getDayInfo(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return {
    key: `${y}-${m}-${d}`,
    label: date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    }),
  };
}
