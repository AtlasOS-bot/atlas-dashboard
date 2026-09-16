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

// Days remaining until the next quarter starts, using the actual calendar
// quarter boundaries (never hard-coded) — correctly rolls Q4 -> Q1 into
// the following year. Both dates are normalized to local midnight before
// diffing so the count is a whole number of days, unaffected by the
// current time of day.
export function getNextQuarterCountdown(date = new Date()) {
  const { quarterLabel, year } = getQuarterInfo(date);
  const quarterNum = Number(quarterLabel.slice(1));
  const nextQuarterNum = quarterNum === 4 ? 1 : quarterNum + 1;
  const nextQuarterYear = quarterNum === 4 ? year + 1 : year;
  const nextQuarterStartMonth = (nextQuarterNum - 1) * 3;
  const nextQuarterStart = new Date(nextQuarterYear, nextQuarterStartMonth, 1);

  const startOfToday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysUntil = Math.round((nextQuarterStart - startOfToday) / msPerDay);

  return { nextQuarterLabel: `Q${nextQuarterNum}`, daysUntil };
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
