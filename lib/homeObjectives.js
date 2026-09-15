// Data layer for the shared Home objective ladder (quarter/month/week/day).
// A "period" is one row per (period_type, period_key) — e.g. ("quarter",
// "2026-Q3") — created lazily the first time either N or M views it.
// Items belong to a period and carry who created them (N/M only, never a
// real name).

export async function ensurePeriod(supabase, periodType, periodKey) {
  const { data: existing } = await supabase
    .from("objective_periods")
    .select("*")
    .eq("period_type", periodType)
    .eq("period_key", periodKey)
    .maybeSingle();

  if (existing) return existing;

  const { data: created, error } = await supabase
    .from("objective_periods")
    .insert({ period_type: periodType, period_key: periodKey })
    .select()
    .single();

  if (error) {
    // Most likely N and M both created it for the first time at once —
    // the unique constraint rejected the second insert, so just re-fetch.
    const { data: retry } = await supabase
      .from("objective_periods")
      .select("*")
      .eq("period_type", periodType)
      .eq("period_key", periodKey)
      .maybeSingle();
    return retry;
  }

  return created;
}

export async function updateHeadline(supabase, periodId, headline, person) {
  await supabase
    .from("objective_periods")
    .update({ headline, updated_by: person, updated_at: new Date().toISOString() })
    .eq("id", periodId);
}

export async function fetchItems(supabase, periodId) {
  const { data } = await supabase
    .from("objective_items")
    .select("*")
    .eq("period_id", periodId)
    .order("created_at", { ascending: true });

  return data || [];
}

export async function addItem(supabase, periodId, body, person) {
  const { data } = await supabase
    .from("objective_items")
    .insert({ period_id: periodId, body, created_by: person })
    .select()
    .single();

  return data;
}

export async function toggleItem(supabase, itemId, isDone) {
  await supabase
    .from("objective_items")
    .update({ is_done: isDone, updated_at: new Date().toISOString() })
    .eq("id", itemId);
}

export async function deleteItem(supabase, itemId) {
  await supabase.from("objective_items").delete().eq("id", itemId);
}
