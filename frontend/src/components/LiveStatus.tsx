import { useEffect, useState } from "react";
import { CheckCircle2, Clock3, LoaderCircle, ReceiptIndianRupee, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, type ApiCase } from "@/lib/api";

type Go = (view: "citizen") => void;

export function LiveStatus({ caseId, go }: { caseId: string | null; go: Go }) {
  const [caseData, setCaseData] = useState<ApiCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = async (selectedCaseId: string) => {
    setLoading(true);
    setError(null);
    try {
      setCaseData(await api.getCase(selectedCaseId));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load complaint status.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (caseId) void loadStatus(caseId);
    else setLoading(false);
  }, [caseId]);

  if (!caseId) {
    return (
      <main className="mx-auto min-h-[700px] max-w-[1440px] px-4 py-8 sm:px-6">
        <p className="text-xs font-bold uppercase text-primary">Citizen services</p>
        <h1 className="mt-1 text-3xl font-extrabold">Complaint Status</h1>
        <div className="mt-8 border border-border bg-card p-8 text-center civic-shadow">
          <h2 className="mt-4 text-xl font-bold">No complaint selected</h2>
          <p className="mt-2 text-sm text-muted-foreground">Submit a complaint first to view its status.</p>
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
          <p className="mt-4 text-xs font-bold uppercase text-primary">Loading</p>
          <p className="mt-2 text-sm text-muted-foreground">Fetching latest complaint status...</p>
        </div>
      </main>
    );
  }

  const refresh = () => loadStatus(caseId);
  const isAnalyzed = caseData.status === "ANALYZED";
  const isClosed = caseData.status === "CLOSED";

  return (
    <main className="mx-auto min-h-[700px] max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase text-primary">Case {caseData.case_id}</p>
          <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">Complaint Status</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refresh} disabled={loading}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
          <Button variant="outline" onClick={() => go("citizen")}>Back to dashboard</Button>
        </div>
      </div>
      
      {error && <p className="mb-6 border-l-4 border-destructive bg-muted p-3 text-sm text-destructive">{error}</p>}

      <div className="grid gap-6 md:grid-cols-[1fr_1fr]">
        <section className="border border-border bg-card p-5 civic-shadow">
          <div className="flex items-center gap-2 border-b border-border pb-4 font-bold text-primary">
            <Clock3 size={18} />Live complaint timeline
          </div>
          <div className="mt-5 space-y-0">
            {[
              ["Complaint registered", new Date(caseData.created_at).toLocaleString(), true],
              ["Police verification", caseData.status !== "CREATED" ? "Received by cybercrime unit" : "Pending review", caseData.status !== "CREATED"],
              ["Investigation", isAnalyzed || isClosed ? "Analysis underway" : "Pending assignment", isAnalyzed || isClosed],
              ["Action update", isClosed ? "Case resolved" : "Pending updates", isClosed],
            ].map(([name, time, complete]) => (
              <div className="relative flex gap-3 pb-7 last:pb-0" key={name as string}>
                <span className={`z-10 mt-1 grid size-6 shrink-0 place-items-center rounded-full border-4 ${complete ? "border-primary bg-primary" : "border-border bg-card"}`}>
                  {complete && <CheckCircle2 className="text-primary-foreground" size={12} />}
                </span>
                <div>
                  <p className={`text-sm font-semibold ${!complete && "text-muted-foreground"}`}>{name as string}</p>
                  <p className="text-xs text-muted-foreground">{time as string}</p>
                </div>
                {/* Visual connecting line */}
                <div className="absolute left-[11px] top-[28px] -bottom-[4px] w-[2px] bg-border last:hidden" />
              </div>
            ))}
          </div>
        </section>

        <section className="border border-border bg-card p-5 civic-shadow h-fit">
          <div className="flex items-center gap-2 border-b border-border pb-4 font-bold text-primary">
            <ReceiptIndianRupee size={18} />Complaint summary
          </div>
          <p className="mt-5 text-2xl font-extrabold">₹{caseData.amount.toLocaleString("en-IN")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{caseData.fraud_type.replaceAll("_", " ")}</p>
          <dl className="mt-5 grid gap-3 border-t border-border pt-5 text-sm">
            <Row label="Case ID" value={caseData.case_id} />
            <Row label="Destination account" value={caseData.destination_account} />
            <Row label="Status" value={caseData.status} />
          </dl>
        </section>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border pb-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-semibold">{value}</dd>
    </div>
  );
}
