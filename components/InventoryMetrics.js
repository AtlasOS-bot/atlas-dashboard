"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import MetricCard from "./MetricCard";
import { calculateInventoryMetrics } from "../lib/inventoryMetrics";
import { fetchSalesMetrics } from "../lib/salesMetrics";

function formatCurrency(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

export default function InventoryMetrics({ products }) {
  const [salesMetrics, setSalesMetrics] = useState({
    itemsSold: 0,
    revenueEarned: 0,
    profitEarned: 0,
    costOfSoldInventory: 0,
  });

  useEffect(() => {
    let cancelled = false;

    fetchSalesMetrics(supabase).then((metrics) => {
      if (!cancelled) setSalesMetrics(metrics);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const inventoryMetrics = calculateInventoryMetrics(products);

  return (
    <div className="metrics-dashboard">
      {/* Existing inventory metrics — unchanged */}
      <section className="metrics-row">
        <MetricCard
          title="Inventory Units"
          value={inventoryMetrics.totalUnits}
          icon="📦"
        />
        <MetricCard
          title="Inventory Cost"
          value={formatCurrency(inventoryMetrics.totalCost)}
          icon="💰"
        />
        <MetricCard
          title="Expected Revenue"
          value={formatCurrency(inventoryMetrics.expectedRevenue)}
          icon="📈"
        />
      </section>

      {/* New: Expected Profit / Added Today / Unlisted Items */}
      <section className="metrics-row">
        <MetricCard
          title="Expected Profit"
          value={formatCurrency(inventoryMetrics.expectedProfit)}
          icon="🧮"
        />
        <MetricCard
          title="Added Today"
          value={inventoryMetrics.addedToday}
          icon="🆕"
        />
        <MetricCard
          title="Unlisted Items"
          value={inventoryMetrics.unlistedItems}
          icon="🚫"
        />
      </section>

      {/* Existing sales metrics — unchanged */}
      <section className="metrics-row">
        <MetricCard title="Items Sold" value={salesMetrics.itemsSold} icon="🏷️" />
        <MetricCard
          title="Revenue Earned"
          value={formatCurrency(salesMetrics.revenueEarned)}
          icon="🧾"
        />
        <MetricCard
          title="Profit Earned"
          value={formatCurrency(salesMetrics.profitEarned)}
          icon="💵"
        />
      </section>

      {/* New: Cost of Sold Inventory */}
      <section className="metrics-row metrics-row-single">
        <MetricCard
          title="Cost of Sold Inventory"
          value={formatCurrency(salesMetrics.costOfSoldInventory)}
          icon="🧾"
        />
      </section>
    </div>
  );
}
