// Pure calendar-grid math for the Home Calendar module — no data access
// here, just date arithmetic. Uses the native Date constructor's own
// month/day overflow handling (e.g. new Date(year, -1, day) correctly
// rolls back into December of the previous year, new Date(year, 1, 0)
// correctly returns Feb 28/29 depending on leap year) rather than any
// hand-rolled leap-year or month-boundary logic.

// Local-safe "YYYY-MM-DD" key, matching the format Postgres `date`
// columns already round-trip through supabase-js as plain strings —
// never parse those back into a Date with `new Date(dateString)`
// (that parses as UTC and can land on the wrong local day); use
// parseDateKey below instead.
export function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseDateKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// Returns a flat array of 42 (6 weeks) or 35 (5 weeks) cells — whichever
// exactly covers the month — each { date, inMonth }, aligned so the grid
// always starts on Sunday.
export function getCalendarGrid(year, month) {
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];

  for (let i = startWeekday - 1; i >= 0; i--) {
    cells.push({ date: new Date(year, month, -i), inMonth: false });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ date: new Date(year, month, day), inMonth: true });
  }

  let nextMonthDay = 1;
  while (cells.length % 7 !== 0) {
    cells.push({ date: new Date(year, month + 1, nextMonthDay), inMonth: false });
    nextMonthDay += 1;
  }

  return cells;
}

export function formatTime(value) {
  if (!value) return "";
  const [h, m] = value.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}
