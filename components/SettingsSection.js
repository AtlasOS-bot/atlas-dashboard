"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

// Generic Add/Rename/Deactivate/Reorder UI for any lookup table that follows
// the standard { id, name, sort_order, active } shape. Adding a future
// lookup table to Settings is just one more <SettingsSection /> instance —
// nothing here is specific to any particular table.
export default function SettingsSection({ table, label }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");

  async function loadItems() {
    const { data } = await supabase.from(table).select("*").order("sort_order");
    setItems(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table]);

  async function handleAdd() {
    const name = newName.trim();
    if (!name) return;

    setError("");
    const nextOrder = items.length
      ? Math.max(...items.map((item) => item.sort_order || 0)) + 1
      : 1;

    const { error: insertError } = await supabase
      .from(table)
      .insert({ name, sort_order: nextOrder, active: true });

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setNewName("");
    await loadItems();
  }

  function handleRenameInput(item, name) {
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, name } : i)));
  }

  async function handleRenameCommit(item) {
    const current = items.find((i) => i.id === item.id);
    if (!current || !current.name.trim()) return;

    const { error: updateError } = await supabase
      .from(table)
      .update({ name: current.name.trim() })
      .eq("id", item.id);

    if (updateError) setError(updateError.message);
  }

  async function handleToggleActive(item) {
    setError("");
    const { error: updateError } = await supabase
      .from(table)
      .update({ active: !item.active })
      .eq("id", item.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    await loadItems();
  }

  async function handleMove(item, direction) {
    const index = items.findIndex((i) => i.id === item.id);
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= items.length) return;

    const other = items[swapIndex];
    setError("");

    const { error: err1 } = await supabase
      .from(table)
      .update({ sort_order: other.sort_order })
      .eq("id", item.id);

    const { error: err2 } = await supabase
      .from(table)
      .update({ sort_order: item.sort_order })
      .eq("id", other.id);

    if (err1 || err2) {
      setError((err1 || err2).message);
      return;
    }

    await loadItems();
  }

  return (
    <div className="settings-section">
      <h3>{label}</h3>

      {error && <p className="form-error">{error}</p>}

      {loading ? (
        <p className="inventory-loading">Loading...</p>
      ) : (
        <div className="settings-list">
          {items.map((item, index) => (
            <div key={item.id} className="settings-row">
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

      <div className="settings-add-row">
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
