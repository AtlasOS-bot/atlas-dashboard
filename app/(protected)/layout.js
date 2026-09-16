"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import LockScreen from "../../components/LockScreen";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import PresenceTracker from "../../components/PresenceTracker";
import { ModuleProvider } from "../../lib/moduleContext";
import { CurrentUserProvider } from "../../lib/currentUserContext";
import { getPersonForEmail } from "../../lib/currentUser";

export default function ProtectedLayout({ children }) {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  // Tracks whether a session already existed, across the whole listener's
  // lifetime — not just the current render's closure — so a re-fired
  // "SIGNED_IN" can be told apart from a genuine new one below.
  const hadSessionRef = useRef(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      hadSessionRef.current = !!session;
      setSession(session);
      setSessionLoaded(true);
    });

    // "SIGNED_IN" is NOT exclusive to an actual sign-in. Supabase's
    // GoTrueClient also re-fires it from session recovery: every time the
    // tab goes hidden -> visible (backgrounding the app, switching to
    // another page and returning), _onVisibilityChanged() calls
    // _recoverAndRefresh(), which — when the existing session in storage
    // is still valid, the common case — calls
    // _notifyAllSubscribers('SIGNED_IN', currentSession) again (see
    // node_modules/@supabase/auth-js/dist/main/GoTrueClient.js, the
    // _recoverAndRefresh method). So a plain tab refocus with an already
    // -valid session looks identical to a fresh login from this event
    // name alone. The only reliable signal for "this is an actual new
    // login" is the transition itself: no session before, a session now.
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const isGenuineNewLogin = event === "SIGNED_IN" && !hadSessionRef.current;
        hadSessionRef.current = !!session;
        setSession(session);
        if (isGenuineNewLogin) {
          router.push("/");
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  if (!sessionLoaded) {
    return null;
  }

  if (!session) {
    return <LockScreen />;
  }

  const email = session.user?.email || null;
  const person = getPersonForEmail(email);

  return (
    <CurrentUserProvider email={email} person={person}>
      <ModuleProvider>
        <PresenceTracker />
        <div className="app-frame">
          <Suspense fallback={null}>
            <Sidebar />
          </Suspense>

          <main className="atlas-shell">
            <Header />
            {children}
          </main>
        </div>
      </ModuleProvider>
    </CurrentUserProvider>
  );
}
