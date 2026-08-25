import os

filepath = r"c:\project Straxon\straxonsecure\src\routes\dashboard.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Restore responsiveness fixes
content = content.replace(
    'className="hidden xl:flex flex-col gap-3 min-h-0"',
    'className="flex flex-col gap-3 min-h-0 w-full xl:w-auto"'
)
content = content.replace(
    'className="flex flex-col gap-3 min-h-0"',
    'className="flex flex-col gap-3 min-h-0 w-full xl:w-auto"' # Col 2
)
content = content.replace(
    'className={`flex-1 grid gap-3 min-h-0 ${sideOpen ? "xl:grid-cols-[280px_1fr_260px]" : "xl:grid-cols-[280px_1fr]"}`}',
    'className={`flex-1 grid gap-3 min-h-0 overflow-y-auto p-4 xl:p-0 xl:overflow-hidden ${sideOpen ? "xl:grid-cols-[280px_1fr_260px]" : "xl:grid-cols-[280px_1fr]"}`}'
)
content = content.replace(
    'className="hidden xl:flex"',
    'className="flex flex-col w-full xl:w-auto xl:w-[260px]"' # Col 3
)

# 2. Inject ML Hook
ml_hook = """  const { events, blockedIPs, blockedSet, blockIP, unblockIP, flagEvent, liveOps, rtConnected } =
    useThreatEngine(paused, mounted);

  // ML Engine Integration
  const [mlAnomalies, setMlAnomalies] = useState<any[]>([]);
  useEffect(() => {
    if (!mounted || paused || events.length === 0) return;
    const interval = setInterval(async () => {
      try {
        const payload = events.slice(0, 20);
        const res = await fetch("http://localhost:8082/api/ml/anomaly-detect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ events: payload }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.anomalies && data.anomalies.length > 0) {
            setMlAnomalies((prev) => {
              const newMap = new Map(prev.map((a: any) => [a.event_id, a]));
              data.anomalies.forEach((a: any) => newMap.set(a.event_id, a));
              return Array.from(newMap.values())
                .sort((a: any, b: any) => b.anomaly_score - a.anomaly_score)
                .slice(0, 20);
            });
          }
        }
      } catch (err) { }
    }, 5000);
    return () => clearInterval(interval);
  }, [mounted, paused, events]);"""
content = content.replace('  const { events, blockedIPs, blockedSet, blockIP, unblockIP, flagEvent, liveOps, rtConnected } =\n    useThreatEngine(paused, mounted);', ml_hook)

# 3. Replace Anomalies Tab UI
old_ui = """                  <div className="grid lg:grid-cols-2 gap-4">
                    <div className="bg-[#020610]/80 backdrop-blur-md border border-white/10 rounded-lg p-4 flex flex-col gap-3">
                      <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                        Behavioral Drift
                      </div>
                      <div className="text-sm font-mono text-slate-300">
                        Account <span className="text-[#00f3ff]">admin@straxon.io</span> logged in
                        from unusual ASN (AS4134 ChinaNet) outside typical business hours.
                      </div>
                      <div className="flex justify-between items-center mt-auto pt-2 border-t border-white/10">
                        <span className="text-[10px] font-mono text-slate-400">
                          Confidence: 92%
                        </span>
                        <button className="text-[10px] font-mono text-red-400 border border-red-900 bg-red-950/30 px-2 py-1 rounded hover:bg-red-900/50 transition-colors">
                          FORCE MFA
                        </button>
                      </div>
                    </div>

                    <div className="bg-[#020610]/80 backdrop-blur-md border border-white/10 rounded-lg p-4 flex flex-col gap-3">
                      <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                        Time Series Spike
                      </div>
                      <div className="text-sm font-mono text-slate-300">
                        <span className="text-yellow-400">400% increase</span> in outbound DNS
                        traffic over past 5 mins compared to 14-day baseline.
                      </div>
                      <div className="flex justify-between items-center mt-auto pt-2 border-t border-white/10">
                        <span className="text-[10px] font-mono text-slate-400">
                          Confidence: 88%
                        </span>
                        <button className="text-[10px] font-mono text-[#00f3ff] border border-[#00f3ff]/30 bg-[#00f3ff]/10 px-2 py-1 rounded hover:bg-cyan-900/50 transition-colors">
                          VIEW PCAP
                        </button>
                      </div>
                    </div>
                  </div>"""
new_ui = """                  <div className="grid lg:grid-cols-2 gap-4">
                    {mlAnomalies.length === 0 ? (
                      <div className="col-span-full py-12 text-center text-slate-500 font-mono text-xs">
                        [ SYSTEM OPTIMAL ] — No anomalies detected by ML Engine in current timeline.
                      </div>
                    ) : (
                      mlAnomalies.map((anomaly, idx) => (
                        <div
                          key={anomaly.event_id || idx}
                          className="bg-[#020610]/80 backdrop-blur-md border border-white/10 rounded-lg p-4 flex flex-col gap-3 cyber-hover"
                        >
                          <div className="flex justify-between items-start">
                            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                              {anomaly.attack_type || "Behavioral Drift"}
                            </div>
                            <div className={`text-[10px] font-mono px-2 py-0.5 rounded border ${anomaly.severity === 'critical' ? 'text-red-400 border-red-900 bg-red-950/30' : 'text-yellow-400 border-yellow-900 bg-yellow-950/30'}`}>
                              {anomaly.severity}
                            </div>
                          </div>
                          <div className="text-sm font-mono text-slate-300">
                            {anomaly.reason || "Unusual telemetry spike detected compared to baseline."}
                          </div>
                          <div className="flex justify-between items-center mt-auto pt-2 border-t border-white/10">
                            <span className="text-[10px] font-mono text-[#00f3ff]">
                              Score: {Math.round(anomaly.anomaly_score * 100)}%
                            </span>
                            <button className="text-[10px] font-mono text-[#00f3ff] border border-[#00f3ff]/30 bg-[#00f3ff]/10 px-2 py-1 rounded hover:bg-cyan-900/50 transition-colors">
                              VIEW EVENT
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>"""
content = content.replace(old_ui, new_ui)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)
