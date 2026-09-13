import { supabase } from "./supabase";

// History logging is best-effort and must never block the underlying
// inventory action, so failures here are swallowed intentionally.
export async function logHistory({ person, entityType, entityId, action, notes }) {
  if (!person) return;

  try {
    await supabase.from("inventory_history").insert({
      performed_by: person,
      entity_type: entityType,
      entity_id: entityId,
      action,
      notes: notes || null,
    });
  } catch (err) {
    // Intentionally ignored — see comment above.
  }
}
