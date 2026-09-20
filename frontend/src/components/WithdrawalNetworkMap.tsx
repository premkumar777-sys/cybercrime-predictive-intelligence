import { useState, useMemo } from "react";
import type { PredictionItem, Location } from "@/lib/api";

const W = 780;
const H = 480;
const CX = W / 2;
const CY = H / 2;
const ORBIT_R = 175;

function riskColor(score: number): string {
  const pct = score <= 1 ? score * 100 : score;
  if (pct >= 70) return "#dc2626";
  if (pct >= 45) return "#d97706";
  return "#0ea5e9";
}

function riskLabel(score: number): string {
  const pct = score <= 1 ? score * 100 : score;
  if (pct >= 70) return "HIGH";
  if (pct >= 45) return "MED";
  return "LOW";
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
  const displayPredictions = useMemo(
    () => predictions.length > 0
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
      return { pred, loc, x: CX + ORBIT_R * Math.cos(angle), y: CY + ORBIT_R * Math.sin(angle) };
    });
  }, [displayPredictions, locations]);

  const selectedLoc = selected ? locations.find((l) => l.location_id === selected.location_id) : null;
  const pulse1 = ORBIT_R * 0.38;
  const pulse2 = ORBIT_R * 0.55;

  return (
    <div className="border border-border bg-card">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/20 px-4 py-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
            Spatial-Temporal Cash-Out Analysis · Investigator View
          </p>
          <h3 className="mt-0.5 text-sm font-bold text-foreground">
            Withdrawal Probability Network — Case {caseId}
          </h3>
        </div>
        <span className={`px-2 py-0.5 text-xs font-bold ${riskLevel === "HIGH" ? "bg-red-600 text-white" : "bg-amber-600 text-white"}`}>
          {riskLevel} RISK · {predictions.length} NODES
        </span>
      </div>

      {/* SVG Canvas */}
      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" className="w-full max-h-[480px] select-none" style={{ background: "hsl(var(--card))" }}>
          <defs>
            <radialGradient id="wnCenterGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="70%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#92400e" stopOpacity="0.8" />
            </radialGradient>
            <marker id="wnArrow" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
              <polygon points="0 0, 7 3.5, 0 7" fill="rgba(245,158,11,0.55)" />
            </marker>
            <filter id="wnGlow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <style>{`
              @keyframes wn-pulse{0%{r:${pulse1}px;opacity:.25}50%{r:${pulse2}px;opacity:.07}100%{r:${pulse1}px;opacity:.25}}
              .wn-pr{animation:wn-pulse 2.8s ease-in-out infinite}
              @keyframes wn-blink{0%,100%{opacity:1}50%{opacity:.45}}
              .wn-blink{animation:wn-blink 1.6s ease-in-out infinite}
              @keyframes wn-dash{to{stroke-dashoffset:-24}}
              .wn-flow{animation:wn-dash 1.4s linear infinite}
            `}</style>
          </defs>

          {/* Grid dots */}
          {Array.from({ length: 16 }, (_, row) =>
            Array.from({ length: 26 }, (_, col) => (
              <circle key={`g-${row}-${col}`} cx={col * 32 + 4} cy={row * 32 + 4} r={1} fill="rgba(148,163,184,0.07)" />
            ))
          )}

          {/* Orbit ring */}
          <circle cx={CX} cy={CY} r={ORBIT_R} fill="none" stroke="rgba(148,163,184,0.10)" strokeWidth={1} strokeDasharray="4 6" />
          {/* Pulse ring */}
          <circle className="wn-pr" cx={CX} cy={CY} r={pulse1} fill="none" stroke="rgba(245,158,11,0.30)" strokeWidth={1.5} />

          {/* Edges */}
          {nodes.map(({ pred, x, y }) => {
            const col = riskColor(pred.risk_score);
            const isSel = selected?.location_id === pred.location_id;
            return (
              <line key={`e-${pred.location_id}`}
                x1={CX} y1={CY} x2={x} y2={y}
                stroke={isSel ? col : "rgba(148,163,184,0.18)"}
                strokeWidth={isSel ? 2.5 : 1}
                strokeDasharray={isSel ? "8 4" : undefined}
                className={isSel ? "wn-flow" : undefined}
                markerEnd={isSel ? "url(#wnArrow)" : undefined}
              />
            );
          })}

          {/* Location nodes */}
          {nodes.map(({ pred, loc, x, y }) => {
            const col = riskColor(pred.risk_score);
            const isSel = selected?.location_id === pred.location_id;
            const nr = isSel ? 14 : 11;
            const dx = x - CX, dy = y - CY;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const lx = x + (dx / dist) * 28;
            const ly = y + (dy / dist) * 24;
            const ta = Math.abs(dx) < 30 ? "middle" : dx > 0 ? "start" : "end";
            const shortName = pred.location_name.length > 18 ? pred.location_name.slice(0, 17) + "…" : pred.location_name;

            return (
              <g key={`n-${pred.location_id}`} onClick={() => setSelected(isSel ? null : pred)} style={{ cursor: "pointer" }} filter={isSel ? "url(#wnGlow)" : undefined}>
                {isSel && <circle cx={x} cy={y} r={nr + 7} fill="none" stroke={col} strokeWidth={1.5} strokeOpacity={0.45} className="wn-blink" />}
                <circle cx={x} cy={y} r={nr} fill={isSel ? col : "rgba(15,23,42,0.92)"} stroke={col} strokeWidth={isSel ? 2.5 : 1.8} />
                <text x={x} y={y + 4.5} textAnchor="middle" fontSize={isSel ? 11 : 9} fontWeight="bold" fill={isSel ? "#fff" : col}>#{pred.rank}</text>
                <text x={lx} y={ly - 6} textAnchor={ta} fontSize={9} fontWeight="600" fill="rgba(226,232,240,0.85)">{shortName}</text>
                <text x={lx} y={ly + 6} textAnchor={ta} fontSize={8.5} fontWeight="700" fill={col}>{scoreDisplay(pred.risk_score)}</text>
                <text x={lx} y={ly + 16} textAnchor={ta} fontSize={7.5} fill="rgba(148,163,184,0.65)">{loc?.location_type ?? "ATM"}</text>
              </g>
            );
          })}

          {/* Center node */}
          <g>
            <circle cx={CX} cy={CY} r={28} fill="url(#wnCenterGrad)" />
            <circle cx={CX} cy={CY} r={28} fill="none" stroke="#f59e0b" strokeWidth={2} />
            <text x={CX} y={CY - 5} textAnchor="middle" fontSize={8} fontWeight="700" fill="#fff" letterSpacing="0.5">MULE</text>
            <text x={CX} y={CY + 7} textAnchor="middle" fontSize={7} fill="rgba(255,255,255,0.72)">ACCOUNT</text>
          </g>
          <text x={CX} y={CY + 46} textAnchor="middle" fontSize={8} fill="rgba(148,163,184,0.55)">
            {muleAccount.length > 22 ? muleAccount.slice(0, 10) + "…" + muleAccount.slice(-8) : muleAccount}
          </text>

          {/* Legend box (top-left) */}
          <g transform="translate(14,14)">
            <rect x={0} y={0} width={172} height={78} rx={2} fill="rgba(15,23,42,0.85)" stroke="rgba(148,163,184,0.15)" strokeWidth={1} />
            <text x={8} y={15} fontSize={8.5} fontWeight="700" fill="rgba(148,163,184,0.9)" letterSpacing="1">INVESTIGATION MAP</text>
            <text x={8} y={27} fontSize={7.5} fill="rgba(100,116,139,0.8)">{predictions.length} NODES · CASH-OUT NETWORK</text>
            {[
              { col: "#f59e0b", label: "Mule Account (Focus)", r: 5, y: 42 },
              { col: "#dc2626", label: "High Risk Location", r: 4, y: 55 },
              { col: "#d97706", label: "Medium Risk Location", r: 4, y: 67 },
            ].map(item => (
              <g key={item.label}>
                <circle cx={14} cy={item.y} r={item.r} fill={item.col} />
                <text x={22} y={item.y + 3.5} fontSize={7.5} fill="rgba(226,232,240,0.75)">{item.label}</text>
              </g>
            ))}
          </g>

          {/* Linkage analysis box (top-right) */}
          <g transform={`translate(${W - 220}, 14)`}>
            <rect x={0} y={0} width={205} height={72} rx={2} fill="rgba(15,23,42,0.85)" stroke="rgba(148,163,184,0.15)" strokeWidth={1} />
            <text x={8} y={16} fontSize={8} fontWeight="700" fill="#f59e0b" letterSpacing="0.5">⚡ LINKAGE ANALYSIS STORY</text>
            <text x={8} y={30} fontSize={7} fill="rgba(148,163,184,0.75)">Mule account connected to</text>
            <text x={8} y={41} fontSize={7} fill="rgba(148,163,184,0.75)">{predictions.length} probable withdrawal node{predictions.length !== 1 ? "s" : ""}.</text>
            <text x={8} y={55} fontSize={7} fill="rgba(148,163,184,0.60)">Click any node for field interception</text>
            <text x={8} y={65} fontSize={7} fill="rgba(148,163,184,0.60)">guidance and estimated time window.</text>
          </g>

          {/* Footer watermark */}
          <text x={W - 8} y={H - 8} textAnchor="end" fontSize={7.5} fill="rgba(100,116,139,0.45)" fontWeight="600" letterSpacing="1">
            MODE: INVESTIGATOR · LAW ENFORCEMENT CONFIDENTIAL
          </text>
        </svg>
      </div>

      {/* Selected node detail */}
      {selected && (
        <div className="border-t border-border bg-muted/10 px-4 py-3">
          <div className="flex flex-wrap items-start gap-4">
            <div className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center text-sm font-extrabold text-white"
                style={{ background: riskColor(selected.risk_score) }}>
                #{selected.rank}
              </span>
              <div>
                <p className="font-bold text-foreground text-sm">{selected.location_name}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedLoc?.location_type ?? "ATM"} ·{" "}
                  <span className="font-bold" style={{ color: riskColor(selected.risk_score) }}>
                    {scoreDisplay(selected.risk_score)} withdrawal probability
                  </span>
                </p>
              </div>
            </div>
            <div className="border-l border-border pl-4">
              <p className="text-[10px] uppercase text-muted-foreground font-semibold">Estimated Window</p>
              <p className="text-sm font-bold text-foreground">{selected.time_window}</p>
            </div>
            <div className="border-l border-border pl-4">
              <p className="text-[10px] uppercase text-muted-foreground font-semibold">Risk Level</p>
              <span className="mt-0.5 inline-block px-2 py-0.5 text-xs font-bold text-white"
                style={{ background: riskColor(selected.risk_score) }}>
                {riskLabel(selected.risk_score)}
              </span>
            </div>
            <div className="border-l border-border pl-4 flex-1 min-w-[200px]">
              <p className="text-[10px] uppercase text-muted-foreground font-semibold mb-1">Intelligence Basis</p>
              <ul className="space-y-0.5">
                {(selected.explanation ?? []).map((e, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <span className="mt-1 size-1.5 shrink-0 rounded-full" style={{ background: riskColor(selected.risk_score) }} />
                    {e}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Footer legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-muted/10 px-4 py-2 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-foreground">Legend:</span>
          {[{ col: "#dc2626", label: "High ≥70%" }, { col: "#d97706", label: "Medium ≥45%" }, { col: "#0ea5e9", label: "Low <45%" }].map(({ col, label }) => (
            <span key={label} className="flex items-center gap-1">
              <span className="size-2 rounded-full" style={{ background: col }} />
              {label}
            </span>
          ))}
        </div>
        <span className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/60">
          Predictive Intelligence Engine · Confidential
        </span>
      </div>
    </div>
  );
}
