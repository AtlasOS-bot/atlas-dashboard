// Centralized sales-derived calculations only — no inventory data here.
// Shared by the Master Inventory dashboard today and intended for direct
// reuse by a future Analytics page.
//
// startDate/endDate already wire straight to sales.date_sold, so Today /
// Week / Month / Year / Custom Range in a future Analytics page can reuse
// this exact function by supplying different bounds — only "All Time" (no
// bounds) is used today, but the shape is already date-filter-ready, so
// nothing here needs to change when those filters are actually built.
//
// costOfSoldInventory sums sales.cost_snapshot — the cost basis already
// captured at the moment each sale was recorded (cost_each × quantity_sold
// at that time), immune to later edits to the product's current cost_each.
// This is the correct, already-existing field for "what did the inventory
// that has actually sold originally cost" — nothing new was invented here.
const EMPTY_SALES_METRICS = {
  itemsSold: 0,
  revenueEarned: 0,
  profitEarned: 0,
  costOfSoldInventory: 0,
};

export async function fetchSalesMetrics(supabase, { startDate, endDate } = {}) {
  let query = supabase
    .from("sales")
    .select("profit, quantity_sold, sale_price, cost_snapshot");

  if (startDate) query = query.gte("date_sold", startDate);
  if (endDate) query = query.lte("date_sold", endDate);

  const { data, error } = await query;

  if (error || !data) {
    return EMPTY_SALES_METRICS;
  }

  return data.reduce(
    (acc, sale) => {
      acc.itemsSold += Number(sale.quantity_sold || 0);
      acc.revenueEarned += Number(sale.sale_price || 0);
      acc.profitEarned += Number(sale.profit || 0);
      acc.costOfSoldInventory += Number(sale.cost_snapshot || 0);
      return acc;
    },
    { itemsSold: 0, revenueEarned: 0, profitEarned: 0, costOfSoldInventory: 0 }
  );
}
