import { supabase } from "./supabase";

// Shared by every lookup dropdown's "+" button: prompt for a name, insert it
// into the given table with the next sort_order, and hand back the new row
// so the caller can add it to its own list state and select it. Returns
// null if the user cancels or the insert fails (already alerted).
export async function quickAddLookupValue(table, existingItems, extraFields = {}) {
  const name = window.prompt("Enter a new value:");
  if (!name || !name.trim()) return null;

  const trimmed = name.trim();
  const nextOrder = existingItems.length
    ? Math.max(...existingItems.map((item) => item.sort_order || 0)) + 1
    : 1;

  const { data, error } = await supabase
    .from(table)
    .insert({ name: trimmed, sort_order: nextOrder, active: true, ...extraFields })
    .select()
    .single();

  if (error) {
    alert(`Could not add "${trimmed}": ${error.message}`);
    return null;
  }

  return data;
}
