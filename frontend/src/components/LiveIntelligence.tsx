import { useEffect, useState, type ReactNode, lazy, Suspense } from "react";
import { ArrowRight, FileText, Fingerprint, MapPin, Radar, RefreshCw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, scorePercent, type ApiCase, type Location, type Prediction } from "@/lib/api";

type Go = (view: "investigator" | "intel-report") => void;

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return <section className="border border-border bg-card civic-shadow"><div className="flex items-center gap-2 border-b border-border px-5 py-4 font-bold text-primary"><Radar size={17} />{title}</div><div className="p-5">{children}</div></section>;
}

const LiveMap = lazy(() => import("./LiveMap"));

export function LiveInvestigator({ caseId, go }: { caseId: string | null; go: Go }) {
  const [caseData, setCaseData] = useState<ApiCase | null>(null);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => { setIsClient(true); }, []);

  useEffect(() => {
    if (!caseId) return;
    Promise.all([api.getCase(caseId), api.listLocations()]).then(([loadedCase, loadedLocations]) => {
      setCaseData(loadedCase);
      setLocations(loadedLocations);
      return api.getPrediction(caseId).then(setPrediction).catch(() => undefined);
    }).catch(() => setError("Unable to load this case from the intelligence service."));
  }, [caseId]);

  const analyze = async () => {
    if (!caseId) return;
    setBusy(true); setError(null);
    try { setPrediction(await api.analyzeCase(caseId)); } catch { setError("The prediction service could not analyse this case."); } finally { setBusy(false); }
  };

  if (!caseId || !caseData) return <main className="mx-auto min-h-[700px] max-w-[1440px] px-4 py-8 sm:px-6"><p className="text-xs font-bold uppercase text-primary">Investigator command workspace</p><h1 className="mt-1 text-3xl font-extrabold">Predictive Case Analysis</h1><p className="mt-8 text-sm text-muted-foreground">Open a case from the Police dashboard to begin analysis.</p></main>;

  const topScore = prediction?.predictions[0]?.risk_score ?? 0;
  
  return <main className="mx-auto min-h-[700px] max-w-[1440px] px-4 py-8 sm:px-6"><div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase text-primary">Investigator command workspace</p><h1 className="mt-1 text-3xl font-extrabold">Predictive Case Analysis</h1></div><Button onClick={() => go("intel-report")} disabled={!prediction}><FileText />Generate Intelligence Report</Button></div><div className="grid gap-px bg-border border border-border sm:grid-cols-4"><div className="bg-secondary p-4 text-secondary-foreground"><p className="text-[10px] uppercase opacity-70">Case</p><p className="mt-1 font-bold">{caseData.case_id}</p></div><div className="bg-card p-4"><p className="text-[10px] uppercase text-muted-foreground">Fraud type</p><p className="mt-1 font-bold">{caseData.fraud_type.replaceAll("_", " ")}</p></div><div className="bg-card p-4"><p className="text-[10px] uppercase text-muted-foreground">Amount</p><p className="mt-1 font-bold">₹{caseData.amount.toLocaleString("en-IN")}</p></div><div className="bg-card p-4"><p className="text-[10px] uppercase text-muted-foreground">Status</p><p className="mt-1 font-bold">{caseData.status}</p></div></div><div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_.9fr]"><div className="space-y-6"><Panel title="Predictive intelligence"><div className="flex items-center justify-between border-b border-border pb-5"><div><p className="text-xs uppercase text-muted-foreground">Cash-withdrawal likelihood</p><p className="mt-2 text-4xl font-extrabold text-destructive">{scorePercent(topScore)}</p></div><span className="bg-destructive px-3 py-1 text-xs font-bold text-destructive-foreground">{prediction?.risk_level ?? "PENDING"}</span></div><p className="mt-4 border-l-4 border-accent bg-muted p-3 text-xs leading-relaxed text-muted-foreground">Probabilistic estimate only. Use with corroborating evidence and field verification.</p><Button className="mt-5" onClick={analyze} disabled={busy}>{busy ? "Analysing..." : prediction ? "Re-run analysis" : "Analyse case"}<RefreshCw /></Button>{error && <p className="mt-4 text-xs text-destructive">{error}</p>}</Panel><Panel title="Ranked candidate locations"><div className="space-y-3">{prediction?.predictions.length ? prediction.predictions.map((item) => { const location = locations.find((candidate) => candidate.location_id === item.location_id); return <div className="flex items-start gap-3 border border-border p-3" key={item.location_id}><span className="grid size-8 shrink-0 place-items-center bg-primary text-xs font-bold text-primary-foreground">#{item.rank}</span><div className="min-w-0 flex-1"><p className="font-semibold">{item.location_name}</p><p className="text-xs text-muted-foreground">{location?.location_type ?? "ATM"} · {item.time_window}</p><p className="mt-2 text-xs text-muted-foreground">{item.explanation.join(" · ")}</p></div><strong className="text-lg text-destructive">{scorePercent(item.risk_score)}</strong></div>; }) : <div className="py-8 text-center text-sm text-muted-foreground"><MapPin className="mx-auto mb-3 text-primary" />Run analysis to rank candidate locations.</div>}</div></Panel></div><div className="space-y-6"><Panel title="Interactive GIS Heatmap"><div className="relative aspect-[16/10] overflow-hidden border border-border z-0">
    <Suspense fallback={<div className="grid h-full w-full place-items-center bg-muted text-sm text-muted-foreground">Loading GIS Engine...</div>}>
      {isClient && <LiveMap prediction={prediction} locations={locations} />}
    </Suspense>
  <span className="absolute left-3 top-3 z-[400] bg-card px-2 py-1 text-[10px] font-bold civic-shadow">HYDERABAD · LIVE GIS</span></div><div className="mt-3 flex justify-between text-xs"><span className="font-semibold">{prediction?.predictions.length ? "Locations plotted via Leaflet" : "No locations to plot"}</span></div></Panel></div></div></main>;
}

export function LiveIntelReport({ caseId, go }: { caseId: string | null; go: Go }) {
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  useEffect(() => { if (caseId) api.getPrediction(caseId).then(setPrediction).catch(() => undefined); }, [caseId]);
  return <main className="mx-auto min-h-[700px] max-w-[1100px] px-4 py-8 sm:px-6"><div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase text-primary">Live intelligence report</p><h1 className="mt-1 text-3xl font-extrabold">{caseId ?? "No case selected"} · Investigative Brief</h1></div><Button variant="outline" onClick={() => go("investigator")}><ArrowRight />Back to analysis</Button></div><section className="border border-border bg-card p-6 civic-shadow sm:p-10"><div className="flex gap-3 border-b-2 border-secondary pb-6"><span className="grid size-12 place-items-center bg-primary text-primary-foreground"><ShieldCheck /></span><div><p className="font-extrabold">Predictive Intelligence Brief</p><p className="text-xs text-muted-foreground">Generated from the connected FastAPI prediction service</p></div></div>{prediction ? <><div className="mt-7 grid gap-6 sm:grid-cols-3"><div className="border border-border p-4"><p className="text-[10px] uppercase text-muted-foreground">Risk level</p><p className="mt-2 text-xl font-extrabold">{prediction.risk_level}</p></div><div className="border border-border p-4"><p className="text-[10px] uppercase text-muted-foreground">Candidate locations</p><p className="mt-2 text-xl font-extrabold">{prediction.predictions.length}</p></div><div className="border border-border p-4"><p className="text-[10px] uppercase text-muted-foreground">Top score</p><p className="mt-2 text-xl font-extrabold">{scorePercent(prediction.predictions[0]?.risk_score ?? 0)}</p></div></div><h2 className="mt-8 border-b border-border pb-2 font-bold">Ranked candidate locations</h2><div className="mt-3 overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm"><thead className="bg-muted"><tr><th className="p-3">Rank</th><th>Location</th><th>Risk estimate</th><th>Likely window</th></tr></thead><tbody>{prediction.predictions.map((item) => <tr className="border-b border-border" key={item.location_id}><td className="p-3 font-bold">#{item.rank}</td><td>{item.location_name}</td><td className="text-destructive">{scorePercent(item.risk_score)}</td><td>{item.time_window}</td></tr>)}</tbody></table></div></> : <p className="py-10 text-sm text-muted-foreground">No prediction exists for this case yet. Return to analysis and run the prediction engine.</p>}</section></main>;
}
