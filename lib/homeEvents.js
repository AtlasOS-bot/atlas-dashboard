// Data layer for the shared NoMo calendar. Events are organization data —
// both accounts can create, edit, delete, and see every event, attributed
// only as "N" or "M", never a real name.

function logDevError(label, error) {
  if (process.env.NODE_ENV !== "production" && error) {
    console.error(`[calendar] ${label}:`, error);
  }
}

export async function fetchEventsInRange(supabase, startDateKey, endDateKey) {
  const { data, error } = await supabase
    .from("calendar_events")
    .select("*")
    .gte("event_date", startDateKey)
    .lte("event_date", endDateKey)
    .order("event_date", { ascending: true });

  logDevError("fetchEventsInRange error", error);
  return data || [];
}

export async function createEvent(supabase, event, person) {
  const { data, error } = await supabase
    .from("calendar_events")
    .insert({ ...event, created_by: person })
    .select()
    .single();

  logDevError("createEvent error", error);
  return data;
}

export async function updateEvent(supabase, id, event) {
  const { error } = await supabase
    .from("calendar_events")
    .update({ ...event, updated_at: new Date().toISOString() })
    .eq("id", id);

  logDevError("updateEvent error", error);
}

export async function deleteEvent(supabase, id) {
  const { error } = await supabase.from("calendar_events").delete().eq("id", id);
  logDevError("deleteEvent error", error);
}
