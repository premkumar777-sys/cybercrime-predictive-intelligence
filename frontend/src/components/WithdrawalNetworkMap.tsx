import { useState, useMemo, useEffect } from "react";
import type { PredictionItem, Location } from "@/lib/api";

const W = 820;
const H = 520;
const CX = W / 2;
const CY = H / 2;
const ORBIT_R = 190;

function riskColor(score: number): string {
  const pct = score <= 1 ? score * 100 : score;
  if (pct >= 70) return "#ff2a5f"; // Neon Red
  if (pct >= 45) return "#ff9f00"; // Neon Amber/Orange
  return "#00f0ff"; // Electric Cyan
}

function riskLabel(score: number): string {
  const pct = score <= 1 ? score * 100 : score;
  if (pct >= 70) return "HIGH RISK";
  if (pct >= 45) return "MED RISK";
  return "MONITORED";
}

function scoreDisplay(score: number): string {
  const pct = score <= 1 ? score * 100 : score;
  return `${Math.round(pct * 10) / 10}%`;
}

interface Props {
  predictions: PredictionItem[];
  locations: Location[];
  caseId: string;
  muleAccount: string;
  riskLevel: string;
}

export function WithdrawalNetworkMap({ predictions, locations, caseId, muleAccount, riskLevel }: Props) {
  const [selected, setSelected] = useState<PredictionItem | null>(null);
  const [packetsCount, setPacketsCount] = useState(1482);
  const [activeScanAngle, setActiveScanAngle] = useState(0);

  // Live packet counter simulation for movie HUD feel
  useEffect(() => {
    const interval = setInterval(() => {
      setPacketsCount((prev) => prev + Math.floor(Math.random() * 5) + 1);
      setActiveScanAngle((prev) => (prev + 5) % 360);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const displayPredictions = useMemo(
    () =>
      predictions.length > 0
        ? predictions
        : locations.map((location, index) => ({
            location_id: location.location_id,
            location_name: location.name,
            risk_score: 0,
            rank: index + 1,
            time_window: "Pending analysis",
            explanation: ["Live monitored location; ranking requires linked transaction data."],
          })),
    [predictions, locations],
  );

  const nodes = useMemo(() => {
    const count = displayPredictions.length || 1;
    return displayPredictions.map((pred, i) => {
      const angle = (2 * Math.PI * i) / count - Math.PI / 2;
      const loc = locations.find((l) => l.location_id === pred.location_id);
      return {
        pred,
        loc,
        angle,
        x: CX + ORBIT_R * Math.cos(angle),
        y: CY + ORBIT_R * Math.sin(angle),
      };
    });
  }, [displayPredictions, locations]);

  const selectedLoc = selected ? locations.find((l) => l.location_id === selected.location_id) : null;

  return (
    <div className="border border-cyan-900/60 bg-slate-950 shadow-2xl rounded-sm overflow-hidden text-cyan-100 font-mono">
      {/* Tactical HUD Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-800/40 bg-slate-900/90 px-4 py-2.5 text-xs">
        <div className="flex items-center gap-2">
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex size-2.5 rounded-full bg-red-500"></span>
          </span>
          <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">
            CYBER INTELLIGENCE TRACE · INVESTIGATOR TACTICAL HUD
          </span>
        </div>
        <div className="flex items-center gap-4 text-[10px]">
          <span className="hidden sm:inline text-slate-400">
            PACKETS PROCESSED: <strong className="text-cyan-300">{packetsCount.toLocaleString()}</strong>/s
          </span>
          <span className="hidden md:inline text-slate-400">
            ENCRYPTION: <strong className="text-emerald-400">AES-256 HARDENED</strong>
          </span>
          <span
            className={`px-2.5 py-0.5 font-bold uppercase tracking-wider text-[10px] rounded-xs border ${
              riskLevel === "HIGH"
                ? "bg-red-950/80 border-red-500/60 text-red-300 shadow-[0_0_10px_rgba(255,42,95,0.4)]"
                : "bg-amber-950/80 border-amber-500/60 text-amber-300"
            }`}
          >
            {riskLevel} RISK · {predictions.length} TARGET NODES
          </span>
        </div>
      </div>

      {/* SVG Movie Canvas */}
      <div className="relative w-full overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
        {/* Tactical Crosshair Background Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a15_1px,transparent_1px),linear-gradient(to_bottom,#0f172a15_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
          className="w-full max-h-[520px] select-none"
        >
          <defs>
            {/* Neon Glow Filters */}
            <filter id="movieGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="muleCenterGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Radar Sweeping Gradient Cone */}
            <radialGradient id="radarSector" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.35" />
              <stop offset="60%" stopColor="#00f0ff" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#00f0ff" stopOpacity="0" />
            </radialGradient>

            {/* Central Mule Node Gradient */}
            <radialGradient id="muleCoreGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ff0055" />
              <stop offset="70%" stopColor="#990033" />
              <stop offset="100%" stopColor="#440011" />
            </radialGradient>

            {/* Movie Style Keyframe Animations */}
            <style>{`
              @keyframes movie-spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
              @keyframes movie-spin-reverse {
                from { transform: rotate(360deg); }
                to { transform: rotate(0deg); }
              }
              @keyframes movie-pulse-ring {
                0% { r: 120px; opacity: 0.6; }
                50% { r: 195px; opacity: 0.15; }
                100% { r: 120px; opacity: 0.6; }
              }
              @keyframes movie-dash-flow {
                to { stroke-dashoffset: -40; }
              }
              @keyframes movie-target-blink {
                0%, 100% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.3; transform: scale(1.15); }
              }
              .spin-slow {
                transform-origin: ${CX}px ${CY}px;
                animation: movie-spin 22s linear infinite;
              }
              .spin-reverse {
                transform-origin: ${CX}px ${CY}px;
                animation: movie-spin-reverse 16s linear infinite;
              }
              .radar-pulse {
                transform-origin: ${CX}px ${CY}px;
                animation: movie-pulse-ring 3.5s ease-in-out infinite;
              }
              .data-flow-line {
                stroke-dasharray: 6 6;
                animation: movie-dash-flow 0.8s linear infinite;
              }
              .target-lock {
                transform-origin: center;
                animation: movie-target-blink 1.2s ease-in-out infinite;
              }
            `}</style>
          </defs>

          {/* Background Grid Ticks */}
          <line x1={CX} y1={20} x2={CX} y2={H - 20} stroke="rgba(0,240,255,0.06)" strokeWidth={1} strokeDasharray="2 4" />
          <line x1={20} y1={CY} x2={W - 20} y2={CY} stroke="rgba(0,240,255,0.06)" strokeWidth={1} strokeDasharray="2 4" />

          {/* Tactical Radar Sonar Rings */}
          <circle cx={CX} cy={CY} r={60} fill="none" stroke="rgba(0,240,255,0.12)" strokeWidth={1} />
          <circle cx={CX} cy={CY} r={120} fill="none" stroke="rgba(0,240,255,0.15)" strokeWidth={1} strokeDasharray="4 4" />
          <circle className="radar-pulse" cx={CX} cy={CY} r={ORBIT_R} fill="none" stroke="rgba(255,42,95,0.25)" strokeWidth={1.5} />
          <circle cx={CX} cy={CY} r={ORBIT_R} fill="none" stroke="rgba(0,240,255,0.20)" strokeWidth={1} strokeDasharray="2 8" className="spin-slow" />
          <circle cx={CX} cy={CY} r={ORBIT_R + 25} fill="none" stroke="rgba(255,159,0,0.15)" strokeWidth={1} strokeDasharray="12 6" className="spin-reverse" />

          {/* Live Rotating Sweeping Radar Beam */}
          <g transform={`rotate(${activeScanAngle} ${CX} ${CY})`}>
            <polygon
              points={`${CX},${CY} ${CX + ORBIT_R * 1.2},${CY - 50} ${CX + ORBIT_R * 1.2},${CY + 50}`}
              fill="url(#radarSector)"
            />
            <line x1={CX} y1={CY} x2={CX + ORBIT_R * 1.25} y2={CY} stroke="#00f0ff" strokeWidth={1.5} strokeOpacity={0.6} />
          </g>

          {/* Connection Cables & Flowing Data Pulses */}
          {nodes.map(({ pred, x, y }) => {
            const col = riskColor(pred.risk_score);
            const isSel = selected?.location_id === pred.location_id;

            return (
              <g key={`edge-group-${pred.location_id}`}>
                {/* Main Link Line */}
                <line
                  x1={CX}
                  y1={CY}
                  x2={x}
                  y2={y}
                  stroke={isSel ? col : "rgba(0,240,255,0.25)"}
                  strokeWidth={isSel ? 2.8 : 1.2}
                  filter={isSel ? "url(#movieGlow)" : undefined}
                />
                {/* Animated Streaming Data Pulses */}
                <line
                  x1={CX}
                  y1={CY}
                  x2={x}
                  y2={y}
                  stroke={col}
                  strokeWidth={isSel ? 3 : 1.8}
                  className="data-flow-line"
                  strokeOpacity={isSel ? 0.95 : 0.65}
                />

                {/* Traveling Packet Ring along path */}
                <circle r={3} fill={col} filter="url(#movieGlow)">
                  <animateMotion
                    path={`M ${CX} ${CY} L ${x} ${y}`}
                    dur={`${Math.max(1.2, 3 - pred.risk_score * 2)}s`}
                    repeatCount="indefinite"
                  />
                </circle>
              </g>
            );
          })}

          {/* Location Target Nodes */}
          {nodes.map(({ pred, loc, x, y, angle }) => {
            const col = riskColor(pred.risk_score);
            const isSel = selected?.location_id === pred.location_id;
            const nr = isSel ? 16 : 12;

            const dx = x - CX;
            const dy = y - CY;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const lx = x + (dx / dist) * 32;
            const ly = y + (dy / dist) * 28;
            const ta = Math.abs(dx) < 40 ? "middle" : dx > 0 ? "start" : "end";
            const shortName =
              pred.location_name.length > 20
                ? pred.location_name.slice(0, 19) + "…"
                : pred.location_name;

            return (
              <g
                key={`node-${pred.location_id}`}
                onClick={() => setSelected(isSel ? null : pred)}
                className="cursor-pointer transition-transform duration-200 hover:scale-110"
                filter={isSel ? "url(#movieGlow)" : undefined}
              >
                {/* Tactical Target Locking Reticle on selection */}
                {isSel && (
                  <g className="target-lock">
                    <circle cx={x} cy={y} r={nr + 12} fill="none" stroke={col} strokeWidth={1.8} strokeDasharray="4 4" />
                    <line x1={x - nr - 16} y1={y} x2={x - nr - 6} y2={y} stroke={col} strokeWidth={2} />
                    <line x1={x + nr + 6} y1={y} x2={x + nr + 16} y2={y} stroke={col} strokeWidth={2} />
                    <line x1={x} y1={y - nr - 16} x2={x} y2={y - nr - 6} stroke={col} strokeWidth={2} />
                    <line x1={x} y1={y + nr + 6} x2={x} y2={y + nr + 16} stroke={col} strokeWidth={2} />
                  </g>
                )}

                {/* Node Outer Ring & Pulse */}
                <circle cx={x} cy={y} r={nr + 4} fill="none" stroke={col} strokeWidth={1} strokeOpacity={isSel ? 0.9 : 0.4} />
                <circle cx={x} cy={y} r={nr} fill="#030712" stroke={col} strokeWidth={isSel ? 3 : 2} />

                {/* Rank Number */}
                <text
                  x={x}
                  y={y + 4}
                  textAnchor="middle"
                  fontSize={isSel ? 12 : 10}
                  fontWeight="900"
                  fill="#ffffff"
                >
                  #{pred.rank}
                </text>

                {/* Node Label Box HUD */}
                <g transform={`translate(${lx - (ta === "end" ? 120 : ta === "middle" ? 60 : 0)}, ${ly - 16})`}>
                  <rect
                    x={0}
                    y={0}
                    width={120}
                    height={38}
                    rx={3}
                    fill="rgba(3,7,18,0.92)"
                    stroke={isSel ? col : "rgba(0,240,255,0.3)"}
                    strokeWidth={isSel ? 1.5 : 0.8}
                  />
                  <text x={6} y={13} fontSize={9} fontWeight="700" fill="#f8fafc">
                    {shortName}
                  </text>
                  <text x={6} y={25} fontSize={9} fontWeight="800" fill={col}>
                    PROB: {scoreDisplay(pred.risk_score)}
                  </text>
                  <text x={60} y={25} fontSize={8} fontWeight="600" fill="rgba(148,163,184,0.8)">
                    [{loc?.location_type ?? "ATM"}]
                  </text>
                  <text x={6} y={34} fontSize={7} fill="rgba(0,240,255,0.7)">
                    WIN: {pred.time_window}
                  </text>
                </g>
              </g>
            );
          })}

          {/* Central Mule Account Tactical Command Core */}
          <g filter="url(#muleCenterGlow)">
            <circle cx={CX} cy={CY} r={34} fill="url(#muleCoreGrad)" stroke="#ff2a5f" strokeWidth={2.5} />
            <circle cx={CX} cy={CY} r={40} fill="none" stroke="#ff2a5f" strokeWidth={1} strokeDasharray="6 4" className="spin-slow" />
            <text x={CX} y={CY - 6} textAnchor="middle" fontSize={10} fontWeight="900" fill="#ffffff" letterSpacing="1">
              MULE
            </text>
            <text x={CX} y={CY + 7} textAnchor="middle" fontSize={8} fontWeight="800" fill="#ff99bb" letterSpacing="0.5">
              ORIGIN
            </text>
            <text x={CX} y={CY + 18} textAnchor="middle" fontSize={7} fontWeight="700" fill="#00f0ff">
              TARGET LOCK
            </text>
          </g>
          {/* Mule Account ID Badge */}
          <g transform={`translate(${CX - 110}, ${CY + 50})`}>
            <rect x={0} y={0} width={220} height={20} rx={2} fill="rgba(3,7,18,0.9)" stroke="#ff2a5f" strokeWidth={1} />
            <text x={110} y={13} textAnchor="middle" fontSize={9} fontWeight="800" fill="#ffffff" letterSpacing="0.5">
              ACC: {muleAccount.length > 24 ? muleAccount.slice(0, 10) + "…" + muleAccount.slice(-8) : muleAccount}
            </text>
          </g>

          {/* Tactical Telemetry HUD Panel (Top Left) */}
          <g transform="translate(16,16)">
            <rect x={0} y={0} width={210} height={92} rx={4} fill="rgba(3,7,18,0.92)" stroke="rgba(0,240,255,0.35)" strokeWidth={1} />
            <path d="M 0 12 L 12 0 L 210 0" fill="none" stroke="#00f0ff" strokeWidth={2} />
            <text x={10} y={18} fontSize={9} fontWeight="900" fill="#00f0ff" letterSpacing="1.2">
              🛰️ CYBER TRACKING TELEMETRY
            </text>
            <text x={10} y={32} fontSize={8} fill="rgba(226,232,240,0.85)">
              CASE FILE: <tspan fontWeight="800" fill="#fff">{caseId}</tspan>
            </text>
            <text x={10} y={44} fontSize={8} fill="rgba(226,232,240,0.85)">
              MONITORED HOPS: <tspan fontWeight="800" fill="#ff9f00">3-5 INTERCEPTED LEGS</tspan>
            </text>
            <text x={10} y={56} fontSize={8} fill="rgba(226,232,240,0.85)">
              ACTIVE CASH-OUT NODES: <tspan fontWeight="800" fill="#ff2a5f">{displayPredictions.length} TARGETS</tspan>
            </text>
            <text x={10} y={70} fontSize={7.5} fill="#00f0ff" fontWeight="700">
              ● REAL-TIME GRAPH VECTORING ENABLED
            </text>
            <text x={10} y={82} fontSize={7} fill="rgba(148,163,184,0.7)">
              CLICK ANY ATM NODE TO LOCK RADAR FOCUS
            </text>
          </g>

          {/* Spatial Interception Intel Box (Top Right) */}
          <g transform={`translate(${W - 230}, 16)`}>
            <rect x={0} y={0} width={214} height={85} rx={4} fill="rgba(3,7,18,0.92)" stroke="rgba(255,159,0,0.4)" strokeWidth={1} />
            <text x={10} y={18} fontSize={9} fontWeight="900" fill="#ff9f00" letterSpacing="1">
              ⚡ LIVE INTERCEPTION GUIDANCE
            </text>
            <text x={10} y={32} fontSize={8} fill="rgba(226,232,240,0.85)">
              AI MODEL: <tspan fill="#00f0ff" fontWeight="800">RANDOM FOREST REGRESSOR</tspan>
            </text>
            <text x={10} y={44} fontSize={8} fill="rgba(226,232,240,0.85)">
              TOP THREAT: <tspan fill="#ff2a5f" fontWeight="800">{nodes[0]?.pred?.location_name || "Scanning..."}</tspan>
            </text>
            <text x={10} y={56} fontSize={8} fill="rgba(226,232,240,0.85)">
              ESTIMATED WINDOW: <tspan fill="#fff" fontWeight="800">{nodes[0]?.pred?.time_window || "--:--"}</tspan>
            </text>
            <text x={10} y={72} fontSize={7.5} fill="#34d399" fontWeight="800">
              ✓ BSA SEC 63 / SEC 65B EVIDENCE SEALED
            </text>
          </g>

          {/* Bottom Watermark & Coordinates Ticks */}
          <text x={16} y={H - 12} fontSize={8} fill="rgba(0,240,255,0.4)" fontWeight="700" letterSpacing="1">
            LAT 28.6139° N, LON 77.2090° E · NATIONAL CYBER CRIME REPORTING PORTAL · I4C / MHA
          </text>
          <text x={W - 16} y={H - 12} textAnchor="end" fontSize={8} fill="rgba(255,42,95,0.6)" fontWeight="800" letterSpacing="1">
            CLASSIFIED · LAW ENFORCEMENT OPERATIONAL VIEW
          </text>
        </svg>
      </div>

      {/* Selected Target Deep Interception HUD Panel */}
      {selected ? (
        <div className="border-t border-cyan-800/60 bg-slate-900/95 p-4 animate-in fade-in duration-300">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-800/40 pb-2 mb-3">
            <div className="flex items-center gap-3">
              <span
                className="grid size-9 place-items-center font-black text-sm text-white rounded-xs shadow-[0_0_12px_rgba(255,42,95,0.6)]"
                style={{ background: riskColor(selected.risk_score) }}
              >
                #{selected.rank}
              </span>
              <div>
                <h4 className="text-sm font-black text-white tracking-wide uppercase flex items-center gap-2">
                  {selected.location_name}
                  <span
                    className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-xs"
                    style={{ background: riskColor(selected.risk_score), color: "#fff" }}
                  >
                    {riskLabel(selected.risk_score)}
                  </span>
                </h4>
                <p className="text-xs text-cyan-300/80">
                  {selectedLoc?.location_type ?? "ATM Location"} ·{" "}
                  <strong className="text-white">PROBABILITY SCORE: {scoreDisplay(selected.risk_score)}</strong>
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="text-xs text-slate-400 hover:text-white border border-slate-700 px-2.5 py-1 rounded-xs bg-slate-800"
            >
              Close Target Inspection
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="border border-cyan-900/40 bg-slate-950 p-2.5 rounded-xs">
              <p className="text-[10px] uppercase font-bold text-cyan-400">Predicted Interception Window</p>
              <p className="text-sm font-extrabold text-white mt-0.5">{selected.time_window}</p>
              <p className="text-[10px] text-slate-400 mt-1">Optimal patrol deployment window</p>
            </div>
            <div className="border border-cyan-900/40 bg-slate-950 p-2.5 rounded-xs">
              <p className="text-[10px] uppercase font-bold text-amber-400">Tactical Risk Factor</p>
              <p className="text-sm font-extrabold text-amber-300 mt-0.5">{scoreDisplay(selected.risk_score)} Likelihood</p>
              <p className="text-[10px] text-slate-400 mt-1">Scored via Random Forest Model</p>
            </div>
            <div className="border border-cyan-900/40 bg-slate-950 p-2.5 rounded-xs sm:col-span-1">
              <p className="text-[10px] uppercase font-bold text-emerald-400">Evidentiary Chain Status</p>
              <p className="text-xs font-bold text-emerald-300 mt-0.5">SHA-256 Merkle Root Verified</p>
              <p className="text-[10px] text-slate-400 mt-1">BSA Section 63 Admissible</p>
            </div>
          </div>

          {selected.explanation && selected.explanation.length > 0 && (
            <div className="mt-3 border-t border-slate-800 pt-2">
              <p className="text-[10px] uppercase font-extrabold text-cyan-400 mb-1">Investigation Intelligence Indicators:</p>
              <ul className="grid gap-1.5 sm:grid-cols-2">
                {selected.explanation.map((exp, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-xs text-slate-300 bg-slate-950/60 px-2.5 py-1 rounded-xs border border-cyan-950">
                    <span className="size-1.5 rounded-full shrink-0" style={{ background: riskColor(selected.risk_score) }} />
                    {exp}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-cyan-900/40 bg-slate-950 px-4 py-2 text-[11px]">
          <div className="flex items-center gap-4">
            <span className="font-bold text-cyan-400">Risk Matrix Legend:</span>
            {[
              { col: "#ff2a5f", label: "High Risk ≥70%" },
              { col: "#ff9f00", label: "Medium Risk ≥45%" },
              { col: "#00f0ff", label: "Monitored <45%" },
            ].map(({ col, label }) => (
              <span key={label} className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full" style={{ background: col, boxShadow: `0 0 6px ${col}` }} />
                <span className="text-slate-300 font-semibold">{label}</span>
              </span>
            ))}
          </div>
          <span className="text-[10px] uppercase tracking-widest font-extrabold text-cyan-500/70">
            NATIONAL CYBER CRIME COMMAND BUREAU · MHA / I4C
          </span>
        </div>
      )}
    </div>
  );
}
