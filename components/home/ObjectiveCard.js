"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useCurrentUser } from "../../lib/currentUserContext";
import HomeModuleCard from "./HomeModuleCard";
import {
  ensurePeriod,
  updateHeadline,
  fetchItems,
  addItem,
  toggleItem,
  deleteItem,
} from "../../lib/homeObjectives";

// One shared implementation for all four objective levels (quarter/month/
// week/day) — each level is just a different periodType/periodKey plus
// which parts of the UI (headline text, checklist) it shows.
export default function ObjectiveCard({
  periodType,
  periodKey,
  label,
  size = "medium",
  showHeadline = true,
  showChecklist = false,
}) {
  const { person } = useCurrentUser();
  const [period, setPeriod] = useState(null);
  const [headline, setHeadline] = useState("");
  const [editingHeadline, setEditingHeadline] = useState(false);
  const [items, setItems] = useState([]);
  const [newItemText, setNewItemText] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const row = await ensurePeriod(supabase, periodType, periodKey);
      if (cancelled) return;

      if (!row) {
        setLoading(false);
        return;
      }

      setPeriod(row);
      setHeadline(row.headline || "");

      if (showChecklist) {
        const rows = await fetchItems(supabase, row.id);
        if (!cancelled) setItems(rows);
      }

      if (!cancelled) setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodType, periodKey]);

  async function saveHeadline() {
    setEditingHeadline(false);
    if (!period || !person) return;
    await updateHeadline(supabase, period.id, headline, person);
  }

  async function handleAddItem() {
    const text = newItemText.trim();
    if (!text || !period || !person) return;

    const created = await addItem(supabase, period.id, text, person);
    if (created) setItems((prev) => [...prev, created]);
    setNewItemText("");
  }

  async function handleToggle(item) {
    const nextDone = !item.is_done;
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, is_done: nextDone } : i))
    );
    await toggleItem(supabase, item.id, nextDone);
  }

  async function handleDelete(item) {
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    await deleteItem(supabase, item.id);
  }

  return (
    <HomeModuleCard title={label} size={size} className="objective-card">
      {loading ? (
        <p className="home-placeholder-text">Loading…</p>
      ) : (
        <>
          {showHeadline &&
            (editingHeadline ? (
              <textarea
                className="objective-headline-input"
                value={headline}
                autoFocus
                onChange={(e) => setHeadline(e.target.value)}
                onBlur={saveHeadline}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    saveHeadline();
                  }
                }}
              />
            ) : (
              <p
                className={
                  headline
                    ? "objective-headline"
                    : "objective-headline objective-headline-empty"
                }
                onClick={() => setEditingHeadline(true)}
              >
                {headline || "Click to set the objective…"}
              </p>
            ))}

          {showChecklist && (
            <div className="objective-checklist">
              <div className="objective-checklist-items">
                {items.map((item) => (
                  <div key={item.id} className="objective-item">
                    <label className="objective-item-label">
                      <input
                        type="checkbox"
                        checked={item.is_done}
                        onChange={() => handleToggle(item)}
                      />
                      <span
                        className={
                          item.is_done
                            ? "objective-item-text done"
                            : "objective-item-text"
                        }
                      >
                        {item.body}
                      </span>
                    </label>
                    <span className="objective-item-author">{item.created_by}</span>
                    <button
                      type="button"
                      className="objective-item-delete"
                      onClick={() => handleDelete(item)}
                      aria-label="Delete item"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <div className="objective-add-row">
                <input
                  type="text"
                  className="objective-add-input"
                  placeholder="Add an item…"
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddItem();
                  }}
                />
                <button
                  type="button"
                  className="objective-add-button"
                  onClick={handleAddItem}
                >
                  + Add
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </HomeModuleCard>
  );
}
