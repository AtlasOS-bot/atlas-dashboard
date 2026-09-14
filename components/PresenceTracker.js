"use client";

import { useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useCurrentUser } from "../lib/currentUserContext";
import { PRESENCE_HEARTBEAT_MS, upsertPresence } from "../lib/presence";

// Renders nothing. While mounted for M, sends a heartbeat on load and then
// on an interval; N's session never calls upsertPresence at all, since
// only M's own presence is tracked.
const DEV = process.env.NODE_ENV !== "production";

export default function PresenceTracker() {
  const { person, email } = useCurrentUser();

  useEffect(() => {
    if (DEV) console.log("[presence] PresenceTracker mounted");
  }, []);

  useEffect(() => {
    if (DEV) {
      console.log("[presence] session email:", email);
      console.log("[presence] resolved person:", person);
    }
  }, [person, email]);

  useEffect(() => {
    if (person !== "M" || !email) return;

    if (DEV) console.log("[presence] starting M heartbeat");

    function heartbeat() {
      if (DEV) console.log("[presence] heartbeat attempt");
      upsertPresence(supabase, email);
    }

    heartbeat();
    const interval = setInterval(heartbeat, PRESENCE_HEARTBEAT_MS);

    return () => clearInterval(interval);
  }, [person, email]);

  return null;
}
