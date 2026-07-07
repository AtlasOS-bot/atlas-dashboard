export default function Home() {
  return (
    <main className="min-h-screen bg-black text-cyan-100 p-10">
      <h1 className="text-5xl font-bold text-cyan-400 tracking-widest">
        ATLAS OS
      </h1>

      <p className="text-cyan-200 mt-2 tracking-widest">
        MARKET INTELLIGENCE COMMAND CENTER
      </p>

      <section className="grid grid-cols-4 gap-4 mt-10">
        <div className="border border-cyan-400/40 rounded-xl p-6 bg-cyan-950/20">
          <p>🚨 ALERTS</p>
          <h2 className="text-4xl mt-3">ONLINE</h2>
        </div>

        <div className="border border-cyan-400/40 rounded-xl p-6 bg-cyan-950/20">
          <p>⭐ SCORE ENGINE</p>
          <h2 className="text-4xl mt-3">ACTIVE</h2>
        </div>

        <div className="border border-cyan-400/40 rounded-xl p-6 bg-cyan-950/20">
          <p>📡 SCOUTS</p>
          <h2 className="text-4xl mt-3">LIVE</h2>
        </div>

        <div className="border border-cyan-400/40 rounded-xl p-6 bg-cyan-950/20">
          <p>🧠 ATLAS CORE</p>
          <h2 className="text-4xl mt-3">READY</h2>
        </div>
      </section>

      <section className="mt-10 border border-cyan-400/40 rounded-xl p-6 bg-cyan-950/20">
        <h2 className="text-2xl text-cyan-400">TOP OPPORTUNITIES</h2>
        <p className="mt-4 text-cyan-100">
          Supabase connection comes next.
        </p>
      </section>
    </main>
  );
}
