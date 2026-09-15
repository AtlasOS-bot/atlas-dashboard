"use client";

import { Suspense, useEffect, useState } from "react";
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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setSessionLoaded(true);
    });

    // "SIGNED_IN" fires specifically for an actual sign-in (LockScreen's
    // signIn() succeeding), never for a page reload/refresh with an
    // existing session (that fires "INITIAL_SESSION" instead) — so this
    // sends a fresh login to Home without disturbing a bookmarked or
    // already-open route like /inventory on reload.
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        if (event === "SIGNED_IN") {
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
