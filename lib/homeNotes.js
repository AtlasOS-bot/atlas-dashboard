// Data layer for the shared N/M Notes module. Notes are organization data —
// both accounts can create, edit, delete, and see every note, attributed
// only as "N" or "M", never a real name.

export async function fetchNotes(supabase) {
  const { data } = await supabase
    .from("notes")
    .select("*")
    .order("created_at", { ascending: false });

  return data || [];
}

export async function createNote(supabase, body, person) {
  const { data } = await supabase
    .from("notes")
    .insert({ body, created_by: person })
    .select()
    .single();

  return data;
}

export async function updateNote(supabase, id, body) {
  await supabase
    .from("notes")
    .update({ body, updated_at: new Date().toISOString() })
    .eq("id", id);
}

export async function deleteNote(supabase, id) {
  await supabase.from("notes").delete().eq("id", id);
}
