import { supabase } from "../lib/supabase";

export default function Header() {
  return (
    <header className="atlas-header">
      <div>
        <h1>NoMo</h1>
        <p>Nothiing &amp; More</p>
      </div>

      <div className="header-actions">
        <div className="system-pill">● SYSTEM ONLINE</div>
        <button
          className="sign-out-button"
          onClick={() => supabase.auth.signOut()}
        >
          Sign Out
        </button>
      </div>
    </header>
  );
}
