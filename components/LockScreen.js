"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function LockScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function signIn() {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
    }
  }

  return (
    <main className="lock-screen">
      <div className="lock-card">
        <h1 className="lock-logo">NoMo</h1>
        <p className="lock-tagline">nothiing & more</p>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button onClick={signIn}>Sign In</button>
      </div>
    </main>
  );
}
