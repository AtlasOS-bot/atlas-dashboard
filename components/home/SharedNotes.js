"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useCurrentUser } from "../../lib/currentUserContext";
import HomeModuleCard from "./HomeModuleCard";
import { fetchNotes, createNote, updateNote, deleteNote } from "../../lib/homeNotes";

export default function SharedNotes() {
  const { person } = useCurrentUser();
  const [notes, setNotes] = useState([]);
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchNotes(supabase).then((rows) => {
      if (!cancelled) setNotes(rows);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleAdd() {
    const text = draft.trim();
    if (!text || !person) return;

    const created = await createNote(supabase, text, person);
    if (created) setNotes((prev) => [created, ...prev]);
    setDraft("");
  }

  function startEdit(note) {
    setEditingId(note.id);
    setEditingText(note.body);
  }

  async function saveEdit(note) {
    const text = editingText.trim();
    setEditingId(null);
    if (!text || text === note.body) return;

    setNotes((prev) => prev.map((n) => (n.id === note.id ? { ...n, body: text } : n)));
    await updateNote(supabase, note.id, text);
  }

  async function handleDelete(note) {
    setNotes((prev) => prev.filter((n) => n.id !== note.id));
    await deleteNote(supabase, note.id);
  }

  return (
    <HomeModuleCard title="SHARED NOTES" icon="🗒️" size="wide">
      <div className="shared-notes-add">
        <textarea
          className="shared-notes-input"
          placeholder="Write a shared note…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button type="button" className="shared-notes-add-button" onClick={handleAdd}>
          + Add Note
        </button>
      </div>

      <div className="shared-notes-list">
        {notes.length === 0 && <p className="home-placeholder-text">No notes yet.</p>}

        {notes.map((note) => (
          <div key={note.id} className="shared-note">
            <div className="shared-note-author">{note.created_by} wrote</div>

            {editingId === note.id ? (
              <textarea
                className="shared-notes-input"
                value={editingText}
                autoFocus
                onChange={(e) => setEditingText(e.target.value)}
                onBlur={() => saveEdit(note)}
              />
            ) : (
              <p className="shared-note-body" onClick={() => startEdit(note)}>
                &ldquo;{note.body}&rdquo;
              </p>
            )}

            <button
              type="button"
              className="shared-note-delete"
              onClick={() => handleDelete(note)}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </HomeModuleCard>
  );
}
