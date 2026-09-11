import { useEffect, useState } from "react";
import { Activity, AlertTriangle, CheckCircle2, Clock3, LoaderCircle, MapPin, Radar, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, scorePercent, type ApiCase, type Location, type Prediction } from "@/lib/api";

type Go = (view: "citizen") => void;

export function LiveStatus({ caseId, go }: { caseId: string | null; go: Go }) {
  const [caseData, setCaseData] = useState<ApiCase | null>(null);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [analysing, setAnalysing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAnalysis = async (selectedCaseId: string) => {
    setLoading(true);
    setError(null);
    try {
      const [loadedCase, loadedLocations] = await Promise.all([
        api.getCase(selectedCaseId),
        api.listLocations(),
      ]);
      setCaseData(loadedCase);
      setLocations(loadedLocations);
      try {
        setPrediction(await api.getPrediction(selectedCaseId));
      } catch {
        setAnalysing(true);
        setPrediction(await api.analyzeCase(selectedCaseId));
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load complaint analysis.");
    } finally {
      setLoading(false);
      setAnalysing(false);
    }
  };

  useEffect(() => {
    if (caseId) void loadAnalysis(caseId);
    else setLoading(false);
  }, [caseId]);

  if (!caseId) {
    return (
      <main className="mx-auto min-h-[700px] max-w-[1440px] px-4 py-8 sm:px-6">
        <p className="text-xs font-bold uppercase text-primary">Citizen services</p>
        <h1 className="mt-1 text-3xl font-extrabold">Complaint Status</h1>
        <div className="mt-8 border border-border bg-card p-8 text-center civic-shadow">
          <AlertTriangle className="mx-auto text-accent" />
          <h2 className="mt-4 text-xl font-bold">No complaint selected</h2>
          <p className="mt-2 text-sm text-muted-foreground">Submit a complaint first to view its live analysis.</p>
          <Button className="mt-5" onClick={() => go("citizen")}>Back to dashboard</Button>
        </div>
      </main>
    );
  }

  if (loading || !caseData) {
    return (
      <main className="mx-auto flex min-h-[700px] max-w-[1440px] items-center justify-center px-4 py-8 sm:px-6">
        <div className="border border-border bg-card p-10 text-center civic-shadow">
          <LoaderCircle className="mx-auto animate-spin text-primary" />
          <p className="mt-4 text-xs font-bold uppercase text-primary">Live intelligence preview</p>
          <p className="mt-2 text-sm text-muted-foreground">Analysing your submitted complaint and identifying nearby candidate locations...</p>
        </div>
      </main>
    );
  }

  const topPrediction = prediction?.predictions[0];
  const refresh = () => loadAnalysis(caseId);

  return (
    <main className="mx-auto min-h-[700px] max-w-[1440px] px-4 py-8 sm:px-6">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase text-primary">Live intelligence preview · Case {caseData.case_id}</p>
          <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">Complaint Status & Analysis</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refresh} disabled={loading}><RefreshCw />Refresh</Button>
          <Button variant="outline" onClick={() => go("citizen")}>Back to dashboard</Button>
        </div>
      </div>
      <div className="mb-6 border-l-4 border-accent bg-muted p-4 text-sm leading-relaxed text-muted-foreground">
        <strong className="text-foreground">Prediction disclaimer:</strong> Nearby locations and scores are likelihood estimates from the prototype prediction service. They are not guaranteed outcomes and require field verification.
      </div>
      <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
        <section className="border border-border bg-card p-5 civic-shadow">
          <div className="flex items-center gap-2 border-b border-border pb-4 font-bold text-primary"><Clock3 size={18} />Live complaint timeline</div>
          <div className="mt-5 space-y-0">
            {[
              ["Complaint registered", new Date(caseData.created_at).toLocaleString(), true],
              ["Police verification", "Received by cybercrime unit", true],
              ["Transaction analysis", analysing ? "Running prediction engine..." : prediction ? "Analysis complete" : "Waiting", Boolean(prediction)],
              ["Nearby location ranking", prediction ? `${prediction.predictions.length} candidate places found` : "Pending analysis", Boolean(prediction)],
            ].map(([name, time, complete]) => (
              <div className="relative flex gap-3 pb-7 last:pb-0" key={name as string}>
                <span className={`z-10 mt-1 grid size-6 shrink-0 place-items-center rounded-full border-4 ${complete ? "border-primary bg-primary" : "border-accent bg-accent"}`}>
                  {complete && <CheckCircle2 className="text-primary-foreground" size={12} />}
                </span>
                <div><p className="text-sm font-semibold">{name as string}</p><p className="text-xs text-muted-foreground">{time as string}</p></div>
              </div>
            ))}
          </div>
          <dl className="mt-5 grid gap-3 border-t border-border pt-5 text-sm">
            <Row label="Fraud type" value={caseData.fraud_type.replaceAll("_", " ")} />
            <Row label="Reported amount" value={`₹${caseData.amount.toLocaleString("en-IN")}`} />
            <Row label="Destination account" value={caseData.destination_account} />
            <Row label="Risk level" value={prediction?.risk_level ?? "PENDING"} />
          </dl>
        </section>
        <section className="border border-border bg-card p-5 civic-shadow">
          <div className="flex items-center justify-between gap-3 border-b border-border pb-4">
            <div className="flex items-center gap-2 font-bold text-primary"><MapPin size={18} />Nearby investigation locations</div>
            {topPrediction && <span className="bg-destructive px-2.5 py-1 text-[10px] font-bold text-destructive-foreground">{prediction?.risk_level} RISK</span>}
          </div>
          {error && <p className="mt-4 border-l-4 border-destructive bg-muted p-3 text-xs text-destructive">{error}</p>}
          {prediction ? (
            <>
              <div className="relative mt-5 h-48 overflow-hidden border border-border bg-muted map-grid">
                <div className="absolute inset-x-[15%] top-1/2 h-px rotate-12 bg-primary/50" />
                <div className="absolute inset-x-[25%] top-1/3 h-px -rotate-25 bg-accent/70" />
                {prediction.predictions.map((item, index) => <span className={`absolute grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-background text-[10px] font-bold text-primary-foreground ${index === 0 ? "bg-destructive" : "bg-primary"}`} style={{ left: `${20 + ((index * 19) % 65)}%`, top: `${28 + ((index * 23) % 48)}%` }} title={`${item.location_name}: ${scorePercent(item.risk_score)}`} key={item.location_id}>{item.rank}</span>)}
              </div>
              <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><Radar size={14} className="text-primary" />Ranked points are synthetic candidate locations from the backend catalog.</p>
              <div className="mt-4 space-y-3">
                {prediction.predictions.map((item) => {
                  const location = locations.find((candidate) => candidate.location_id === item.location_id);
                  return <div className="flex items-start gap-3 border border-border p-3" key={item.location_id}><span className="grid size-8 shrink-0 place-items-center bg-primary text-xs font-bold text-primary-foreground">#{item.rank}</span><div className="min-w-0 flex-1"><p className="font-semibold">{item.location_name}</p><p className="text-xs text-muted-foreground">{location?.location_type ?? "ATM"} · Likely window {item.time_window}</p><p className="mt-1 text-xs text-muted-foreground">{item.explanation.join(" · ")}</p>{location && <p className="mt-1 text-[10px] text-muted-foreground">Coordinates: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</p>}</div><strong className="text-lg text-destructive">{scorePercent(item.risk_score)}</strong></div>;
                })}
              </div>
            </>
          ) : (
            <div className="py-12 text-center"><Activity className="mx-auto text-accent" /><p className="mt-3 text-sm font-semibold">Analysis is being prepared</p><p className="mt-1 text-xs text-muted-foreground">The prediction engine will rank nearby candidate locations automatically.</p></div>
          )}
        </section>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-4 border-b border-border pb-2"><dt className="text-muted-foreground">{label}</dt><dd className="text-right font-semibold">{value}</dd></div>;
}
