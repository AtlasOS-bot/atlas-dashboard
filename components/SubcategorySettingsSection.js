"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

// Subcategories need the same Add/Rename/Deactivate/Reorder controls as
// every other lookup table, plus a parent Category assignment — the one
// thing that doesn't fit the generic SettingsSection shape.
export default function SubcategorySettingsSection() {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newCategoryId, setNewCategoryId] = useState("");
  const [error, setError] = useState("");

  async function loadData() {
    const [{ data: categoryData }, { data: subcategoryData }] = await Promise.all([
      supabase.from("categories").select("*").order("sort_order"),
      supabase.from("subcategories").select("*").order("sort_order"),
    ]);

    setCategories(categoryData || []);
    setItems(subcategoryData || []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  function categoryName(categoryId) {
    return categories.find((c) => c.id === categoryId)?.name || "—";
  }

  async function handleAdd() {
    const name = newName.trim();
    if (!name || !newCategoryId) return;

    setError("");
    const nextOrder = items.length
      ? Math.max(...items.map((item) => item.sort_order || 0)) + 1
      : 1;

    const { error: insertError } = await supabase.from("subcategories").insert({
      name,
      category_id: Number(newCategoryId),
      sort_order: nextOrder,
      active: true,
    });

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setNewName("");
    await loadData();
  }

  function handleRenameInput(item, name) {
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, name } : i)));
  }

  async function handleRenameCommit(item) {
    const current = items.find((i) => i.id === item.id);
    if (!current || !current.name.trim()) return;

    const { error: updateError } = await supabase
      .from("subcategories")
      .update({ name: current.name.trim() })
      .eq("id", item.id);

    if (updateError) setError(updateError.message);
  }

  async function handleCategoryChange(item, categoryId) {
    setError("");
    const { error: updateError } = await supabase
      .from("subcategories")
      .update({ category_id: Number(categoryId) })
      .eq("id", item.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    await loadData();
  }

  async function handleToggleActive(item) {
    setError("");
    const { error: updateError } = await supabase
      .from("subcategories")
      .update({ active: !item.active })
      .eq("id", item.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    await loadData();
  }

  async function handleMove(item, direction) {
    const index = items.findIndex((i) => i.id === item.id);
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= items.length) return;

    const other = items[swapIndex];
    setError("");

    const { error: err1 } = await supabase
      .from("subcategories")
      .update({ sort_order: other.sort_order })
      .eq("id", item.id);

    const { error: err2 } = await supabase
      .from("subcategories")
      .update({ sort_order: item.sort_order })
      .eq("id", other.id);

    if (err1 || err2) {
      setError((err1 || err2).message);
      return;
    }

    await loadData();
  }

  return (
    <div className="settings-section">
      <h3>Subcategories</h3>

      {error && <p className="form-error">{error}</p>}

      {loading ? (
        <p className="inventory-loading">Loading...</p>
      ) : (
        <div className="settings-list">
          {items.map((item, index) => (
            <div key={item.id} className="settings-row settings-row-subcategory">
              <div className="settings-row-order">
                <button
                  type="button"
                  className="settings-order-button"
                  onClick={() => handleMove(item, "up")}
                  disabled={index === 0}
                >
                  ▲
                </button>
                <button
                  type="button"
                  className="settings-order-button"
                  onClick={() => handleMove(item, "down")}
                  disabled={index === items.length - 1}
                >
                  ▼
                </button>
              </div>

              <input
                className="form-input settings-name-input"
                value={item.name}
                onChange={(e) => handleRenameInput(item, e.target.value)}
                onBlur={() => handleRenameCommit(item)}
              />

              <select
                className="form-select"
                value={item.category_id || ""}
                onChange={(e) => handleCategoryChange(item, e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <label className="settings-active-toggle">
                <input
                  type="checkbox"
                  checked={item.active}
                  onChange={() => handleToggleActive(item)}
                />
                Active
              </label>
            </div>
          ))}
        </div>
      )}

      <div className="settings-add-row settings-add-row-subcategory">
        <select
          className="form-select"
          value={newCategoryId}
          onChange={(e) => setNewCategoryId(e.target.value)}
        >
          <option value="">Category…</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          className="form-input"
          placeholder="Add new..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
          }}
        />
        <button type="button" className="inventory-add-button" onClick={handleAdd}>
          + Add
        </button>
      </div>
    </div>
  );
}
