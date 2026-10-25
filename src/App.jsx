import { useState, useEffect, useRef, useMemo } from 'react'
import { SCENARIOS } from './scenarios'

const HOP = 900 // ms per hop of the animation

export default function App() {
  const [sid, setSid] = useState('dhcp')
  const [pick, setPick] = useState({})
  const sc = SCENARIOS.find((s) => s.id === sid)
  const o = Object.fromEntries(sc.opts.map((p) => [p.key, pick[p.key] ?? p.choices[0][0]]))
  const optKey = sid + JSON.stringify(o)
  const sim = useMemo(() => sc.build(o), [optKey])
  const steps = sim.steps
  const pos = Object.fromEntries(sc.nodes.map((n) => [n.id, n]))

  const [idx, setIdx] = useState(0)
  const [log, setLog] = useState([])
  const [out, setOut] = useState({})
  const [packet, setPacket] = useState(null)
  const [busy, setBusy] = useState(false)
  const [playing, setPlaying] = useState(false)
  const timers = useRef([])
  const logBox = useRef(null)

  const clear = () => { timers.current.forEach(clearTimeout); timers.current = [] }
  const reset = () => { clear(); setIdx(0); setLog([]); setOut({}); setPacket(null); setBusy(false); setPlaying(false) }
  useEffect(() => { reset(); return clear }, [optKey])
  useEffect(() => { logBox.current && (logBox.current.scrollTop = logBox.current.scrollHeight) }, [log])

  const done = idx >= steps.length
  const final = done && idx > 0 ? steps[idx - 1] : null

  const run = () => {
    if (busy || done) return
    const s = steps[idx], pts = s.path.map((id) => pos[id]), last = pts.length - 1
    const at = (ms, fn) => timers.current.push(setTimeout(fn, ms))
    setBusy(true)
    setPacket({ x: pts[0].x, y: pts[0].y, label: s.label, snap: true })
    for (let h = 1; h <= last; h++) {
      let { x, y } = pts[h]
      const lost = s.drop && h === last
      if (lost) { x = (x + pts[h - 1].x) / 2; y = (y + pts[h - 1].y) / 2 }
      at(30 + (h - 1) * HOP, () => setPacket({ x, y, label: s.label, snap: false, bad: lost }))
    }
    at(30 + Math.max(last, 1) * HOP + 250, () => {
      setLog((l) => [...l, { n: idx + 1, label: s.label, text: s.log, bad: !!s.drop || s.end === 'fail' }])
      setOut((p) => ({ ...p, ...s.set }))
      setPacket(null); setIdx((i) => i + 1); setBusy(false)
    })
  }

  // Auto-play: run the next step whenever the previous one has finished
  useEffect(() => {
    if (!playing) return
    if (done) { setPlaying(false); return }
    if (busy) return
    const t = setTimeout(run, 350)
    return () => clearTimeout(t)
  }, [playing, busy, idx])

  const isDown = (a, b) => (sim.down || []).some(([x, y]) => (x === a && y === b) || (x === b && y === a))
  const btn = 'px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed'

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-5">
        <header>
          <h1 className="text-2xl md:text-3xl font-bold text-cyan-400">NetMonitor <span className="text-slate-400 font-normal text-lg">— Real-Life Computer Networks Simulator</span></h1>
          <p className="text-xs text-amber-400/90 mt-1">⚠ Everything here is simulated. Protocol traffic and metrics are predefined; no real packets or emails are sent.</p>
        </header>

        <nav className="flex flex-wrap gap-2">
          {SCENARIOS.map((s) => (
            <button key={s.id} onClick={() => { setSid(s.id); setPick({}) }}
              className={`${btn} ${s.id === sid ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 hover:bg-slate-700'}`}>{s.tab}</button>
          ))}
        </nav>

        <section className="bg-slate-900 rounded-xl p-4 border border-slate-800">
          <h2 className="text-lg font-semibold">{sc.title}</h2>
          <p className="text-sm text-slate-400 mt-1">{sc.story}</p>
          {sc.opts.map((p) => (
            <div key={p.key} className="flex flex-wrap items-center gap-2 mt-3">
              <span className="text-sm text-slate-400">{p.label}:</span>
              {p.choices.map(([v, l]) => (
                <button key={v} onClick={() => setPick({ ...pick, [p.key]: v })}
                  className={`${btn} py-1 ${o[p.key] === v ? 'bg-slate-200 text-slate-900' : 'bg-slate-800 hover:bg-slate-700'}`}>{l}</button>
              ))}
            </div>
          ))}
          <div className="flex flex-wrap gap-2 mt-4">
            <button className={`${btn} bg-emerald-500 text-slate-950`} disabled={playing || done} onClick={() => setPlaying(true)}>▶ Start Simulation</button>
            {playing
              ? <button className={`${btn} bg-amber-500 text-slate-950`} onClick={() => setPlaying(false)}>⏸ Pause</button>
              : <button className={`${btn} bg-sky-500 text-slate-950`} disabled={busy || done} onClick={run}>⏭ Next Step</button>}
            <button className={`${btn} bg-slate-700 hover:bg-slate-600`} onClick={reset}>↺ Reset</button>
            <span className="text-sm text-slate-500 self-center">Step {Math.min(idx + (done ? 0 : 1), steps.length)} / {steps.length}</span>
          </div>
        </section>

        <div className="grid md:grid-cols-5 gap-5">
          <section className="md:col-span-3 bg-slate-900 rounded-xl border border-slate-800 p-2">
            <svg viewBox="0 0 600 260" className="w-full">
              {sc.links.map(([a, b]) => {
                const A = pos[a], B = pos[b], bad = isDown(a, b)
                return (
                  <g key={a + b}>
                    <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={bad ? '#ef4444' : '#475569'} strokeWidth="3" strokeDasharray={bad ? '6 6' : ''} />
                    {bad && <text x={(A.x + B.x) / 2} y={(A.y + B.y) / 2 + 6} textAnchor="middle" fontSize="20" fill="#ef4444">✕</text>}
                  </g>
                )
              })}
              {sc.nodes.map((n) => {
                const off = (sim.off || []).includes(n.id)
                return (
                  <g key={n.id} opacity={off ? 0.35 : 1}>
                    <circle cx={n.x} cy={n.y} r="28" fill="#0f172a" stroke={off ? '#ef4444' : '#22d3ee'} strokeWidth="2" />
                    <text x={n.x} y={n.y + 10} textAnchor="middle" fontSize="28">{n.icon}</text>
                    <text x={n.x} y={n.y + 48} textAnchor="middle" fontSize="12" fill="#cbd5e1">{n.name}{off ? ' (offline)' : ''}</text>
                  </g>
                )
              })}
              {packet && (
                <g style={{ transform: `translate(${packet.x}px, ${packet.y}px)`, transition: packet.snap ? 'none' : `transform ${HOP - 50}ms linear` }}>
                  <circle r="9" fill={packet.bad ? '#ef4444' : '#facc15'} />
                  <text y="-34" textAnchor="middle" fontSize="12" fontWeight="bold" fill={packet.bad ? '#fca5a5' : '#fde047'}>{packet.label}{packet.bad ? ' ✕' : ''}</text>
                </g>
              )}
            </svg>
            <p className="text-center text-xs text-slate-500 pb-1">Simulated message flow</p>
          </section>

          <section className="md:col-span-2 bg-slate-900 rounded-xl border border-slate-800 p-4 flex flex-col">
            <h3 className="font-semibold mb-2">Event Log</h3>
            <ol ref={logBox} className="space-y-2 text-sm overflow-y-auto h-64 pr-1">
              {log.length === 0 && <li className="text-slate-500">Press Start Simulation or Next Step.</li>}
              {log.map((l) => (
                <li key={l.n}>
                  <span className={`font-semibold ${l.bad ? 'text-red-400' : 'text-cyan-400'}`}>{l.n}. {l.label}</span>
                  <div className="text-slate-400">{l.text}</div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <section className="bg-slate-900 rounded-xl border border-slate-800 p-4">
          <h3 className="font-semibold mb-2">Result <span className="text-xs text-slate-500 font-normal">(simulated values)</span></h3>
          {Object.keys(out).length === 0 ? <p className="text-sm text-slate-500">Results appear as the simulation runs.</p> : (
            <dl className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              {Object.entries(out).map(([k, v]) => (
                <div key={k} className="bg-slate-950 rounded-lg p-2"><dt className="text-slate-500 text-xs">{k}</dt><dd className="font-mono text-slate-100">{String(v)}</dd></div>
              ))}
            </dl>
          )}
          {final && (
            <div className={`mt-3 rounded-lg p-3 text-sm border ${final.end === 'ok' ? 'border-emerald-600 bg-emerald-950/40' : 'border-red-600 bg-red-950/40'}`}>
              <p className="font-semibold">{final.end === 'ok' ? '✅ Success' : '❌ Failed'}: {final.log}</p>
              <p className="text-slate-300 mt-1"><b>Why is this protocol needed?</b> {sc.why}</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
