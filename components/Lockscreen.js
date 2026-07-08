export default function LockScreen({
  enteredPasskey,
  setEnteredPasskey,
  unlock,
}) {
  return (
    <main className="lock-screen">
      <div className="lock-card">
        <h1>ATLAS OS</h1>
        <p>Secure Market Intelligence Access</p>

        <input
          type="password"
          placeholder="Enter Passkey"
          value={enteredPasskey}
          onChange={(e) => setEnteredPasskey(e.target.value)}
        />

        <button onClick={unlock}>Unlock Atlas</button>
      </div>
    </main>
  );
}