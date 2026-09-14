"use client";

import { Suspense, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import LockScreen from "../../components/LockScreen";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import PresenceTracker from "../../components/PresenceTracker";
import { ModuleProvider } from "../../lib/moduleContext";
import { CurrentUserProvider } from "../../lib/currentUserContext";
import { getPersonForEmail } from "../../lib/currentUser";

export default function ProtectedLayout({ children }) {
  const [session, setSession] = useState(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setSessionLoaded(true);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

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
