// Centralized inventory-derived calculations only — no sales data here.
// Shared by the Master Inventory dashboard today and intended for direct
// reuse by a future Analytics page.
//
// This is a pure function over whatever `products` array is passed in.
// "All Time" means the full list; a future date-scoped inventory view
// would filter the array before calling this — the aggregation logic
// itself never has to change. totalUnits/totalCost/expectedRevenue are
// current snapshots, not events with their own dates the way sales are,
// so a meaningful "as of a past date" view would require historical
// inventory snapshots that don't exist yet — that's future work, not
// something faked here.
//
// Naming note: NoMo's schema currently has exactly one "selling price"
// signal — market_price / total_market_value — but conceptually that is
// NOT the same thing as Purchase Cost, and it will eventually be distinct
// from a genuine "Current Market Value" field too. This function
// deliberately returns `expectedRevenue`, not `marketValue`, so every
// consumer (this page, future Analytics) speaks in terms of the business
// concept, not today's DB column name. If NoMo later adds a dedicated
// selling-price field, only the one line below reading
// `total_market_value` needs to change — nothing downstream does.
//
// expectedProfit is deliberately NOT its own separate accumulator — it is
// derived from expectedRevenue and totalCost, both of which already exist
// here, so there is exactly one place either figure is computed.
//
// unlistedItems reuses the product_platforms data Master Inventory already
// fetches (is_listed per platform) — no new query. A product counts as
// unlisted if none of its platform rows are currently listed, including
// products with no platform rows at all.
//
// addedToday reuses products.created_at, already stamped by the database
// on every insert — compared against the caller's local calendar date only
// (time-of-day is ignored), so "today" matches what the person looking at
// the dashboard actually means by "today."
export function calculateInventoryMetrics(products, now = new Date()) {
  const todayKey = now.toDateString();

  const totals = (products || []).reduce(
    (acc, product) => {
      acc.totalUnits += Number(product.total_quantity || 0);
      acc.totalCost += Number(product.total_cost || 0);
      acc.expectedRevenue += Number(product.total_market_value || 0);

      if (product.created_at && new Date(product.created_at).toDateString() === todayKey) {
        acc.addedToday += 1;
      }

      const isListedAnywhere = (product.product_platforms || []).some(
        (pp) => pp.is_listed
      );
      if (!isListedAnywhere) {
        acc.unlistedItems += 1;
      }

      return acc;
    },
    {
      totalUnits: 0,
      totalCost: 0,
      expectedRevenue: 0,
      addedToday: 0,
      unlistedItems: 0,
    }
  );

  return {
    ...totals,
    expectedProfit: totals.expectedRevenue - totals.totalCost,
  };
}
