// Centralized presence read/write logic. Heartbeat-based: the tracked
// user's client periodically upserts its own row; readers derive "online"
// by checking whether that timestamp is still fresh. This also means a
// disconnect (tab closed, crash, network drop, phone locked) is handled
// uniformly by the same staleness check, without needing to special-case
// any particular disconnect scenario.

export const PRESENCE_HEARTBEAT_MS = 20000;
export const PRESENCE_ONLINE_THRESHOLD_MS = 45000;

export async function upsertPresence(supabase, email) {
  if (!email) return;

  // Normalize casing here at the write boundary: EMAIL_TO_PERSON (and thus
  // getEmailForPerson, which N's read side queries by) stores/returns
  // lowercase keys, but the raw session email is written as Supabase Auth
  // returns it. Without normalizing, a mixed-case auth email would insert
  // a presence row under a different key than N ever queries for, so the
  // write silently "succeeds" while N never sees it.
  const normalizedEmail = email.toLowerCase();

  const { error } = await supabase
    .from("presence")
    .upsert({ user_email: normalizedEmail, last_seen_at: new Date().toISOString() });

  if (process.env.NODE_ENV !== "production") {
    if (error) {
      console.error("[presence] heartbeat result: error", error);
    } else {
      console.log("[presence] heartbeat result: success", normalizedEmail);
    }
  }
}

export async function fetchPresence(supabase, email) {
  if (!email) return null;

  const { data, error } = await supabase
    .from("presence")
    .select("last_seen_at")
    .eq("user_email", email)
    .maybeSingle();

  if (process.env.NODE_ENV !== "production" && error) {
    console.error("[presence] fetchPresence error:", error);
  }

  if (error || !data) return null;
  return data.last_seen_at;
}

// Returns an unsubscribe function. Relies on Postgres Changes respecting
// RLS: a caller not authorized to SELECT this row receives no events at
// all, regardless of the filter it requests.
export function subscribeToPresenceChanges(supabase, email, onChange) {
  const channel = supabase
    .channel(`presence-${email}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "presence",
        filter: `user_email=eq.${email}`,
      },
      (payload) => {
        if (process.env.NODE_ENV !== "production") {
          console.log("[presence] N realtime change:", payload.new?.last_seen_at || null);
        }
        onChange(payload.new?.last_seen_at || null);
      }
    )
    .subscribe((status) => {
      if (process.env.NODE_ENV !== "production") {
        console.log("[presence] N realtime subscription status:", status);
      }
    });

  return () => {
    supabase.removeChannel(channel);
  };
}

export function isPresenceOnline(lastSeenAt, now = Date.now()) {
  if (!lastSeenAt) return false;
  return now - new Date(lastSeenAt).getTime() < PRESENCE_ONLINE_THRESHOLD_MS;
}
