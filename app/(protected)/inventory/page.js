"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import InventoryTable, { displayedQuantity } from "../../../components/InventoryTable";
import InventoryDetailPanel from "../../../components/InventoryDetailPanel";
import InventoryEmptyState from "../../../components/InventoryEmptyState";
import AddItemPanel from "../../../components/AddItemPanel";
import EditItemPanel from "../../../components/EditItemPanel";
import InventoryMetrics from "../../../components/InventoryMetrics";
import { devLog } from "../../../lib/devLog";

const SORT_OPTIONS = [
  { value: "name_asc", label: "Alphabetical (A–Z)" },
  { value: "name_desc", label: "Alphabetical (Z–A)" },
  // Quantity/price here always reflect whichever tab is currently active —
  // see compareProducts's "quantity_desc"/"quantity_asc" cases, which use
  // the same displayedQuantity() the list itself renders with, and
  // "price_desc"/"price_asc", which use market_price (the existing
  // per-unit expected selling price field).
  { value: "quantity_desc", label: "Quantity (High → Low)" },
  { value: "quantity_asc", label: "Quantity (Low → High)" },
  { value: "price_desc", label: "Price (High → Low)" },
  { value: "price_asc", label: "Price (Low → High)" },
  { value: "inventory_id", label: "Inventory ID" },
  { value: "category", label: "Category" },
  { value: "brand", label: "Brand" },
  { value: "purchase_date", label: "Purchase Date" },
  { value: "cost_each", label: "Cost Each" },
  { value: "market_price", label: "Market Price" },
  { value: "total_market_value", label: "Total Inventory Value" },
  { value: "total_quantity", label: "Total Quantity" },
  { value: "n_quantity", label: "N Quantity" },
  { value: "m_quantity", label: "M Quantity" },
  { value: "shared_quantity", label: "Shared Quantity" },
  { value: "purchase_source", label: "Purchase Source" },
  { value: "storage_location", label: "Storage Location" },
  { value: "status", label: "Status" },
];

function compareValues(a, b) {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === "string" && typeof b === "string") {
    return a.localeCompare(b);
  }
  return a - b;
}

function compareProducts(a, b, sortBy, activeTab) {
  if (a.status !== b.status) {
    return a.status === "Out of Stock" ? 1 : -1;
  }

  let primary = 0;

  switch (sortBy) {
    case "name_desc":
      primary = -compareValues(a.item_name, b.item_name);
      break;
    case "quantity_desc":
      primary = -compareValues(
        displayedQuantity(a, activeTab),
        displayedQuantity(b, activeTab)
      );
      break;
    case "quantity_asc":
      primary = compareValues(
        displayedQuantity(a, activeTab),
        displayedQuantity(b, activeTab)
      );
      break;
    case "price_desc":
      primary = -compareValues(a.market_price, b.market_price);
      break;
    case "price_asc":
      primary = compareValues(a.market_price, b.market_price);
      break;
    case "inventory_id":
      primary = compareValues(a.inventory_id, b.inventory_id);
      break;
    case "category":
      primary = compareValues(a.category?.name, b.category?.name);
      break;
    case "brand":
      primary = compareValues(a.brand?.name, b.brand?.name);
      break;
    case "purchase_date":
      primary = compareValues(a.purchase_date, b.purchase_date);
      break;
    case "cost_each":
      primary = compareValues(a.cost_each, b.cost_each);
      break;
    case "market_price":
      primary = compareValues(a.market_price, b.market_price);
      break;
    case "total_market_value":
      primary = compareValues(a.total_market_value, b.total_market_value);
      break;
    case "total_quantity":
      primary = compareValues(a.total_quantity, b.total_quantity);
      break;
    case "n_quantity":
      primary = compareValues(a.n_quantity, b.n_quantity);
      break;
    case "m_quantity":
      primary = compareValues(a.m_quantity, b.m_quantity);
      break;
    case "shared_quantity":
      primary = compareValues(a.shared_quantity, b.shared_quantity);
      break;
    case "purchase_source":
      primary = compareValues(a.purchase_source?.name, b.purchase_source?.name);
      break;
    case "storage_location":
      primary = compareValues(
        a.storage_location?.name,
        b.storage_location?.name
      );
      break;
    case "status":
      primary = compareValues(a.status, b.status);
      break;
    case "name_asc":
    default:
      primary = compareValues(a.item_name, b.item_name);
      break;
  }

  if (primary !== 0) return primary;
  return compareValues(a.item_name, b.item_name);
}

function MasterInventoryPageInner() {
  const searchParams = useSearchParams();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [queryError, setQueryError] = useState("");
  const [search, setSearch] = useState(() => searchParams.get("category") || "");
  const [sortBy, setSortBy] = useState("name_asc");
  // Which of the three organization-wide views is showing: "master" (every
  // item, combined N+M quantity), "n" (N-owned items, N's quantity), or "m"
  // (M-owned items, M's quantity). Plain page state, independent of login —
  // resets to "master" on every load/navigation, no persistence.
  const [activeTab, setActiveTab] = useState("master");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showAddItem, setShowAddItem] = useState(false);

  async function loadProducts() {
    const { data, error } = await supabase
      .from("products")
      .select(`
        id,
        inventory_id,
        item_name,
        brand_id,
        category_id,
        subcategory_id,
        n_quantity,
        m_quantity,
        shared_quantity,
        total_quantity,
        cost_each,
        total_cost,
        market_price,
        total_market_value,
        storage_location_id,
        purchase_source_id,
        purchase_date,
        notes,
        status,
        product_link,
        created_at,
        brand:brands(name),
        category:categories(name),
        subcategory:subcategories(name),
        storage_location:storage_locations(name),
        purchase_source:purchase_sources(name),
        product_platforms(platform_id, person, is_listed, listing_url, platform:platforms(name)),
        product_images(id, image_url, is_main, sort_order)
      `);

    if (error) {
      devLog("✗ Master Inventory query failed", error);
      // A failed query (e.g. a broken relationship) must never be mistaken
      // for "no products exist" — that hid a real schema problem before.
      setQueryError(
        `Could not load inventory: ${error.message}. Your products are safe — this is a query/schema problem, not missing data.`
      );
    } else {
      setQueryError("");
      const withImages = (data || []).filter(
        (p) => (p.product_images || []).length > 0
      ).length;
      devLog("✓ Inventory query returned rows", {
        totalProducts: data?.length || 0,
        productsWithAtLeastOneImage: withImages,
      });
    }

    setProducts(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadProducts();
  }, []);

  const sorted = useMemo(() => {
    return [...products].sort((a, b) => compareProducts(a, b, sortBy, activeTab));
  }, [products, sortBy, activeTab]);

  // Master shows every item regardless of ownership split. N/M each show
  // only items that person actually owns any quantity of — the underlying
  // product list is the same shared data in all three cases, just filtered
  // differently for display.
  const tabFiltered = useMemo(() => {
    if (activeTab === "n") {
      return sorted.filter((product) => Number(product.n_quantity || 0) > 0);
    }
    if (activeTab === "m") {
      return sorted.filter((product) => Number(product.m_quantity || 0) > 0);
    }
    return sorted;
  }, [sorted, activeTab]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return tabFiltered;

    return tabFiltered.filter((product) => {
      const platformNames = (product.product_platforms || [])
        .map((pp) => pp.platform?.name || "")
        .join(" ");

      const haystack = [
        product.inventory_id,
        product.item_name,
        product.brand?.name,
        product.category?.name,
        product.subcategory?.name,
        product.storage_location?.name,
        product.purchase_source?.name,
        product.status,
        platformNames,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [tabFiltered, search]);

  return (
    <div className="inventory-page">
      <InventoryMetrics products={products} />

      <div className="inventory-tabs">
        <button
          type="button"
          className={
            activeTab === "master" ? "inventory-tab active" : "inventory-tab"
          }
          onClick={() => setActiveTab("master")}
        >
          Master Inventory
        </button>
        <button
          type="button"
          className={activeTab === "n" ? "inventory-tab active" : "inventory-tab"}
          onClick={() => setActiveTab("n")}
        >
          N Inventory
        </button>
        <button
          type="button"
          className={activeTab === "m" ? "inventory-tab active" : "inventory-tab"}
          onClick={() => setActiveTab("m")}
        >
          M Inventory
        </button>
      </div>

      <div className="inventory-toolbar">
        <input
          type="text"
          className="inventory-search"
          placeholder="Search inventory..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="inventory-sort-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              Sort: {option.label}
            </option>
          ))}
        </select>

        <button
          className="inventory-add-button"
          onClick={() => setShowAddItem(true)}
        >
          + Add Item
        </button>
      </div>

      {queryError ? (
        <p className="form-error">{queryError}</p>
      ) : loading ? (
        <p className="inventory-loading">Loading inventory...</p>
      ) : products.length === 0 ? (
        <InventoryEmptyState onAddItem={() => setShowAddItem(true)} />
      ) : filtered.length === 0 ? (
        <p className="inventory-no-results">No items match your search.</p>
      ) : (
        <InventoryTable
          products={filtered}
          onRowClick={setSelectedProduct}
          quantityView={activeTab}
        />
      )}

      {selectedProduct && (
        <InventoryDetailPanel
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onEdit={(product) => {
            setSelectedProduct(null);
            setEditingProduct(product);
          }}
        />
      )}

      {showAddItem && (
        <AddItemPanel
          onClose={() => setShowAddItem(false)}
          onCreated={loadProducts}
        />
      )}

      {editingProduct && (
        <EditItemPanel
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSaved={loadProducts}
          onDeleted={loadProducts}
        />
      )}
    </div>
  );
}

export default function MasterInventoryPage() {
  return (
    <Suspense fallback={null}>
      <MasterInventoryPageInner />
    </Suspense>
  );
}
