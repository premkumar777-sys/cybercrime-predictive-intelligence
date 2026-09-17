import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, LoaderCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, type ApiCase, type Prediction } from "@/lib/api";

type Go = (view: "citizen") => void;

export function LiveStatus({ caseId, go }: { caseId: string | null; go: Go }) {
  const [caseData, setCaseData] = useState<ApiCase | null>(null);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(true);
  const [analysing, setAnalysing] = useState(false);

  const loadAnalysis = async (selectedCaseId: string) => {
    setLoading(true);
    try {
      const loadedCase = await api.getCase(selectedCaseId);
      setCaseData(loadedCase);
      try {
        setPrediction(await api.getPrediction(selectedCaseId));
      } catch {
        setAnalysing(true);
        setPrediction(await api.analyzeCase(selectedCaseId));
      }
    } catch {
      setPrediction(null);
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
          <p className="mt-2 text-sm text-muted-foreground">Checking the latest status of your submitted complaint...</p>
        </div>
      </main>
    );
  }

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
        <strong className="text-foreground">Status note:</strong> This page shows the current progress of your submitted complaint. Investigation details are available only to authorised staff.
      </div>
      <div className="max-w-2xl">
        <section className="border border-border bg-card p-5 civic-shadow">
          <div className="flex items-center gap-2 border-b border-border pb-4 font-bold text-primary"><Clock3 size={18} />Live complaint timeline</div>
          <div className="mt-5 space-y-0">
            {[
              ["Complaint registered", new Date(caseData.created_at).toLocaleString(), true],
              ["Police verification", "Received by cybercrime unit", true],
              ["Transaction analysis", analysing ? "Running prediction engine..." : prediction ? "Analysis complete" : "Waiting", Boolean(prediction)],
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
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-4 border-b border-border pb-2"><dt className="text-muted-foreground">{label}</dt><dd className="text-right font-semibold">{value}</dd></div>;
}
