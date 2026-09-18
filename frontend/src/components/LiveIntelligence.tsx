import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowRight,
  ChevronRight,
  FileText,
  Fingerprint,
  MapPin,
  Radar,
  RefreshCw,
  ShieldCheck,
  Search,
  Activity,
  AlertTriangle,
} from "lucide-react";
import { WithdrawalNetworkMap } from "@/components/WithdrawalNetworkMap";
import { Button } from "@/components/ui/button";
import {
  api,
  scorePercent,
  type ApiCase,
  type Location,
  type Prediction,
} from "@/lib/api";
import { policeService } from "@/services/policeService";
import type { PoliceComplaint } from "@/types/police";

type Go = (view: "investigator" | "intel-report") => void;

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border border-border bg-card civic-shadow">
      <div className="flex items-center gap-2 border-b border-border px-5 py-4 font-bold text-primary">
        <Radar size={17} />
        {title}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function LiveInvestigator({
  caseId: initialCaseId,
  go,
  onCaseChange,
}: {
  caseId: string | null;
  go: Go;
  onCaseChange?: (caseId: string) => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(initialCaseId);
  const [allCases, setAllCases] = useState<ApiCase[]>([]);
  const [caseData, setCaseData] = useState<ApiCase | null>(null);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [busy, setBusy] = useState(false);
  const [loadingCases, setLoadingCases] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const localComplaintToCase = (complaint: PoliceComplaint): ApiCase => ({
    case_id: complaint.liveCaseId || complaint.id,
    fraud_type: complaint.fraudType.toUpperCase().replace(/[\s/-]+/g, "_"),
    amount: complaint.amount,
    transaction_time: new Date(`${complaint.incidentDate} ${complaint.incidentTime}`).toISOString(),
    destination_account: complaint.destinationAccount || "ACC-MULE-UNKNOWN",
    status: complaint.status === "Investigation in Progress" ? "ANALYZED" : "RECEIVED",
    created_at: new Date(`${complaint.reportedDate} ${complaint.reportedTime}`).toISOString(),
  });

  const isActiveCase = (caseItem: ApiCase) =>
    !["RESOLVED", "CLOSED", "REJECTED"].includes(caseItem.status.toUpperCase());

  // Sync initialCaseId if parent updates it
  useEffect(() => {
    if (initialCaseId) {
      setActiveId(initialCaseId);
    }
  }, [initialCaseId]);

  // Load list of all real backend cases
  const refreshCaseList = async () => {
    try {
      setLoadingCases(true);
      const [backendCases, localComplaints] = await Promise.all([
        api.listCases().catch(() => [] as ApiCase[]),
        policeService.getAllComplaints(),
      ]);
      const mergedCases = new Map<string, ApiCase>();
      backendCases.forEach((caseItem) => mergedCases.set(caseItem.case_id, caseItem));
      localComplaints.forEach((complaint) => {
        const localCase = localComplaintToCase(complaint);
        const backendCase = mergedCases.get(localCase.case_id);
        mergedCases.set(localCase.case_id, backendCase ? { ...localCase, ...backendCase } : localCase);
      });
      const cases = [...mergedCases.values()].filter(isActiveCase);
      setAllCases(cases);
      // Auto-select most recent case if none selected
      if (!activeId && cases.length > 0) {
        const latest = cases[cases.length - 1];
        if (latest) {
          setActiveId(latest.case_id);
          onCaseChange?.(latest.case_id);
        }
      }
    } catch {
      // Backend may be starting
    } finally {
      setLoadingCases(false);
    }
  };

  useEffect(() => {
    refreshCaseList();
    const unsubscribe = policeService.subscribe(() => {
      refreshCaseList();
    });
    const interval = setInterval(refreshCaseList, 8000);
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  // Load active case details and locations
  useEffect(() => {
    if (!activeId) return;
    setError(null);
    const localCase = allCases.find((caseItem) => caseItem.case_id === activeId);
    Promise.all([
      api.getCase(activeId).catch(() => {
        if (localCase) return localCase;
        throw new Error("Case not found");
      }),
      api.listLocations(),
    ])
      .then(([loadedCase, loadedLocations]) => {
        setCaseData(loadedCase);
        setLocations(loadedLocations);
        return api
          .getPrediction(activeId)
          .then(setPrediction)
          .catch(() => setPrediction(null));
      })
      .catch(() =>
        setError("Unable to load this case from the intelligence service.")
      );
  }, [activeId, allCases]);

  const analyze = async () => {
    if (!activeId) return;
    setBusy(true);
    setError(null);
    try {
      let analysisCaseId = activeId;
      try {
        await api.getCase(activeId);
      } catch {
        const localCase = allCases.find((caseItem) => caseItem.case_id === activeId);
        if (!localCase) throw new Error("Case not found");
        const created = await api.createCase({
          fraud_type: localCase.fraud_type,
          amount: localCase.amount,
          transaction_time: localCase.transaction_time,
          destination_account: localCase.destination_account,
        });
        analysisCaseId = created.case_id;
        setActiveId(analysisCaseId);
        onCaseChange?.(analysisCaseId);
      }

      const pred = await api.analyzeCase(analysisCaseId);
      setPrediction(pred);
      // Refresh case to show updated ANALYZED status
      const updated = await api.getCase(analysisCaseId);
      setCaseData(updated);
      refreshCaseList();
    } catch {
      setError("The predictive intelligence engine could not analyze this case.");
    } finally {
      setBusy(false);
    }
  };

  const handleSelectCase = (newId: string) => {
    setActiveId(newId);
    onCaseChange?.(newId);
  };

  const topScore = prediction?.predictions[0]?.risk_score ?? 0;

  return (
    <main className="mx-auto min-h-[700px] max-w-[1440px] px-4 py-8 sm:px-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-4">
        <div>
          <p className="text-xs font-bold uppercase text-primary">
            State Cyber Crime CID · Command Workspace
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-foreground">
            Predictive Case Intelligence & Withdrawal Analytics
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {allCases.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground hidden sm:inline">
                Active Case:
              </span>
              <select
                value={activeId || ""}
                onChange={(e) => handleSelectCase(e.target.value)}
                className="h-9 border border-input bg-background px-2.5 text-xs font-bold text-primary"
              >
                {allCases.map((c) => (
                  <option key={c.case_id} value={c.case_id}>
                    {c.case_id} — {c.fraud_type.replaceAll("_", " ")} (₹
                    {c.amount.toLocaleString("en-IN")}) · {c.status}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={refreshCaseList}
            className="h-9 text-xs"
            title="Refresh cases from live backend"
          >
            <RefreshCw size={13} className={loadingCases ? "animate-spin" : ""} />
          </Button>

          <Button
            size="sm"
            onClick={() => go("intel-report")}
            disabled={!prediction}
            className="h-9 text-xs gap-1.5 bg-primary text-primary-foreground"
          >
            <FileText size={13} />
            Generate Intelligence Brief
          </Button>
        </div>
      </div>

      {/* If no case is selected or available */}
      {(!activeId || !caseData) && (
        <div className="border border-border bg-card p-8 text-center civic-shadow">
          <Radar size={40} className="mx-auto text-primary mb-3" />
          <h2 className="text-lg font-bold text-foreground">
            No Active Case Selected
          </h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            Select a case from the dropdown above or click on any case below to begin predictive location analysis.
          </p>

        </div>
      )}

      {allCases.length > 0 && (
        <section className="border border-border bg-card civic-shadow">
          <div className="flex items-center justify-between border-b border-border bg-muted/40 px-5 py-3">
            <div>
              <h2 className="font-bold text-foreground">Active and Live Case Requests</h2>
              <p className="text-xs text-muted-foreground">All cases currently available to the investigator command unit</p>
            </div>
            <span className="text-xs font-bold text-primary">{allCases.length} active</span>
          </div>
          <div className="divide-y divide-border text-left text-xs">
            {allCases.map((c) => (
              <div key={c.case_id} className="flex items-center justify-between gap-4 p-3 hover:bg-muted/30">
                <div className="min-w-0">
                  <span className="font-bold text-primary">{c.case_id}</span>
                  <span className="ml-2 font-medium text-foreground">{c.fraud_type.replaceAll("_", " ")}</span>
                  <p className="mt-0.5 text-muted-foreground">
                    ₹{c.amount.toLocaleString("en-IN")} · {c.status} · Destination: {c.destination_account}
                  </p>
                </div>
                <Button size="sm" variant={activeId === c.case_id ? "default" : "outline"} onClick={() => handleSelectCase(c.case_id)}>
                  {activeId === c.case_id ? "Viewing" : "View Case"} <ChevronRight size={12} />
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Case Details Bar */}
      {caseData && (
        <>
          <div className="grid gap-px bg-border border border-border sm:grid-cols-4">
            <div className="bg-secondary p-4 text-secondary-foreground">
              <p className="text-[10px] uppercase opacity-70">Case ID</p>
              <p className="mt-1 font-bold text-base">{caseData.case_id}</p>
            </div>
            <div className="bg-card p-4">
              <p className="text-[10px] uppercase text-muted-foreground">
                Reported Fraud Type
              </p>
              <p className="mt-1 font-bold">
                {caseData.fraud_type.replaceAll("_", " ")}
              </p>
            </div>
            <div className="bg-card p-4">
              <p className="text-[10px] uppercase text-muted-foreground">
                Transaction Amount
              </p>
              <p className="mt-1 font-bold text-destructive">
                ₹{caseData.amount.toLocaleString("en-IN")}
              </p>
            </div>
            <div className="bg-card p-4">
              <p className="text-[10px] uppercase text-muted-foreground">
                Prediction Status
              </p>
              <div className="mt-1 flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 text-xs font-bold rounded-xs ${caseData.status === "ANALYZED"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                    }`}
                >
                  {caseData.status}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Dest: {caseData.destination_account}
                </span>
              </div>
            </div>
          </div>

          {/* Main Analysis Grid */}
          <div className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
            {/* Left: Predictive Risk Overview */}
            <Panel title="Predictive Risk Assessment & Location Engine">
              <div className="flex items-center justify-between border-b border-border pb-5">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">
                    Cash-Withdrawal Likelihood Score
                  </p>
                  <p className="mt-2 text-4xl font-extrabold text-destructive">
                    {scorePercent(topScore)}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 text-xs font-bold rounded-xs ${prediction?.risk_level === "HIGH"
                    ? "bg-destructive text-destructive-foreground"
                    : "bg-primary text-primary-foreground"
                    }`}
                >
                  {prediction?.risk_level ?? "PENDING"}
                </span>
              </div>

              <p className="mt-4 border-l-4 border-accent bg-muted p-3 text-xs leading-relaxed text-muted-foreground">
                FastAPI Predictive Intelligence Engine: Probabilistic spatial-temporal estimates calculated using transaction pattern correlation across monitored ATMs and mule account clusters.
              </p>

              {prediction?.status === "INSUFFICIENT_DATA" && (
                <p className="mt-4 border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
                  Analysis completed, but this case needs linked transaction hops and cash-out history before locations can be ranked.
                </p>
              )}

              <div className="mt-5 flex items-center gap-3">
                <Button
                  onClick={analyze}
                  disabled={busy}
                  className="bg-primary text-primary-foreground gap-1.5"
                >
                  <RefreshCw
                    size={13}
                    className={busy ? "animate-spin" : ""}
                  />
                  {busy
                    ? "Executing AI Location Engine..."
                    : prediction
                      ? "Re-Run Predictive Analysis"
                      : "Analyse Case in Predictive Engine"}
                </Button>
              </div>

              {error && (
                <p className="mt-4 text-xs text-destructive bg-destructive/10 border border-destructive/20 p-3">
                  {error}
                </p>
              )}
            </Panel>

            {/* Right: Ranked Candidate Locations */}
            <Panel title="Ranked Candidate Locations for Field Interception">
              <div className="space-y-3">
                {prediction?.predictions?.length ? (
                  prediction.predictions.map((item) => {
                    const location = locations.find(
                      (candidate) => candidate.location_id === item.location_id
                    );
                    return (
                      <div
                        className="flex items-start gap-3 border border-border p-3 hover:bg-muted/20 transition-colors"
                        key={item.location_id}
                      >
                        <span className="grid size-8 shrink-0 place-items-center bg-primary text-xs font-bold text-primary-foreground">
                          #{item.rank}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-foreground">
                            {item.location_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {location?.location_type ?? "ATM"} · Likely Window:{" "}
                            <strong>{item.time_window}</strong>
                          </p>
                          <p className="mt-1.5 text-xs text-muted-foreground border-l-2 border-primary/40 pl-2">
                            {(item.explanation ?? Object.entries(item.features ?? {}).map(([name, value]) => `${name.replaceAll("_", " ")}: ${Math.round(value * 100)}%`)).join(" · ")}
                          </p>
                        </div>
                        <strong className="text-lg font-extrabold text-destructive shrink-0">
                          {scorePercent(item.risk_score)}
                        </strong>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center text-sm text-muted-foreground">
                    <MapPin className="mx-auto mb-3 text-primary" size={32} />
                    <p className="font-semibold text-foreground">
                      No candidate locations ranked yet
                    </p>
                    <p className="text-xs mt-1 text-muted-foreground">
                      Click "Analyse Case" to trigger the backend predictive machine learning engine.
                    </p>
                  </div>
                )}
              </div>
            </Panel>
          </div>

          {/* Withdrawal Network Map — full width */}
          {locations.length > 0 && (
            <section className="space-y-0">
              <div className="flex items-center gap-2 border border-border border-b-0 px-5 py-4 font-bold text-primary bg-card civic-shadow">
                <Radar size={17} />
                {prediction?.predictions?.length ? "Cash-Out Location Network Graph" : "Live Monitored Location Map"}
              </div>
              <WithdrawalNetworkMap
                predictions={prediction?.predictions ?? []}
                locations={locations}
                caseId={activeId ?? ""}
                muleAccount={caseData?.destination_account ?? ""}
                riskLevel={prediction.risk_level}
              />
            </section>
          )}
        </>
      )}
    </main>
  );
}

export function LiveIntelReport({
  caseId,
  go,
}: {
  caseId: string | null;
  go: Go;
}) {
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [caseData, setCaseData] = useState<ApiCase | null>(null);

  useEffect(() => {
    if (caseId) {
      api
        .getPrediction(caseId)
        .then(setPrediction)
        .catch(() => undefined);
      api
        .getCase(caseId)
        .then(setCaseData)
        .catch(() => undefined);
    }
  }, [caseId]);

  return (
    <main className="mx-auto min-h-[700px] max-w-[1100px] px-4 py-8 sm:px-6 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-4">
        <div>
          <p className="text-xs font-bold uppercase text-primary">
            Investigative Intelligence Brief
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-foreground">
            {caseId ?? "No case selected"} · Spatial-Temporal Brief
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => go("investigator")}>
            <ArrowRight /> Back to Analysis
          </Button>
          <Button size="sm" onClick={() => window.print()}>
            Download / Print PDF
          </Button>
        </div>
      </div>

      <section className="border border-border bg-card p-6 civic-shadow sm:p-10">
        <div className="flex gap-3 border-b-2 border-secondary pb-6">
          <span className="grid size-12 place-items-center bg-primary text-primary-foreground">
            <ShieldCheck />
          </span>
          <div>
            <p className="font-extrabold text-foreground">
              Predictive Intelligence Brief — Law Enforcement Confidential
            </p>
            <p className="text-xs text-muted-foreground">
              Generated in real-time from the connected FastAPI Cybercrime Predictive Model
            </p>
          </div>
        </div>

        {caseData && (
          <div className="mt-6 grid gap-4 sm:grid-cols-3 border-b border-border pb-6">
            <div className="border border-border p-3">
              <p className="text-[10px] uppercase text-muted-foreground font-bold">
                Case Reference
              </p>
              <p className="mt-1 text-sm font-bold text-foreground">
                {caseData.case_id}
              </p>
            </div>
            <div className="border border-border p-3">
              <p className="text-[10px] uppercase text-muted-foreground font-bold">
                Reported Amount
              </p>
              <p className="mt-1 text-sm font-bold text-destructive">
                ₹{caseData.amount.toLocaleString("en-IN")}
              </p>
            </div>
            <div className="border border-border p-3">
              <p className="text-[10px] uppercase text-muted-foreground font-bold">
                credited account
              </p>
              <p className="mt-1 text-sm font-bold text-foreground truncate">
                {caseData.destination_account}
              </p>
            </div>
          </div>
        )}

        {prediction ? (
          <>
            {/* Social Media Fraud Advisory Banner */}
            <div className="mt-6 overflow-hidden border border-border">
              <div className="flex flex-col sm:flex-row">
                {/* Left: icon panel */}
                <div className="flex shrink-0 items-center justify-center bg-gradient-to-br from-blue-700 via-indigo-700 to-blue-900 p-6 sm:w-48">
                  <div className="text-center">
                    <div className="mx-auto mb-2 grid size-16 place-items-center rounded-full bg-white/10 ring-2 ring-white/20">
                      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" className="size-9">
                        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                      </svg>
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-blue-200">Active Threat</p>
                    <p className="mt-0.5 text-xs font-semibold text-white">Social Media</p>
                  </div>
                </div>

                {/* Right: content */}
                <div className="flex-1 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Advisory · Cyber Crime Wing</p>
                      <h3 className="mt-0.5 text-base font-extrabold text-foreground">Social Media Fraud — Active Threat Category</h3>
                    </div>
                    <span className="bg-destructive px-2 py-0.5 text-xs font-bold text-white">HIGH VOLUME</span>
                  </div>

                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                    Fraudsters exploit social platforms (Facebook, Instagram, WhatsApp, Telegram) to impersonate banks, government officials, and family members. Victims are lured into sharing OTPs, making payments, or installing malicious APKs.
                  </p>

                  {/* Sub-type chips */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {["Fake Profile Impersonation", "Romance / Matrimonial Scam", "Investment Fraud", "Fake Customer Care", "Account Takeover", "Sextortion"].map((tag) => (
                      <span key={tag} className="border border-border bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Key indicators */}
                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    {[
                      { label: "Never share OTP", desc: "No legitimate bank/govt ever asks for your OTP or PIN." },
                      { label: "Verify identity", desc: "Call back on official numbers before sending money to 'friends'." },
                      { label: "Report on 1930", desc: "Call cybercrime helpline within golden hour to freeze transfers." },
                    ].map(({ label, desc }) => (
                      <div key={label} className="border-l-2 border-primary pl-3">
                        <p className="text-[11px] font-bold text-foreground">{label}</p>
                        <p className="text-[10px] text-muted-foreground leading-snug">{desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <h2 className="mt-8 border-b border-border pb-2 font-bold text-foreground">
              Ranked Interception Candidate Locations
            </h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="bg-muted text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="p-3">Rank</th>
                    <th>Location</th>
                    <th>Risk Estimate</th>
                    <th>Estimated Window</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs">
                  {(prediction?.predictions ?? []).map((item) => (
                    <tr key={item.location_id}>
                      <td className="p-3 font-bold">#{item.rank}</td>
                      <td className="font-semibold text-foreground">
                        {item.location_name}
                      </td>
                      <td className="text-destructive font-bold">
                        {scorePercent(item.risk_score)}
                      </td>
                      <td>{item.time_window}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="py-10 text-sm text-muted-foreground text-center">
            No prediction exists for this case yet. Return to analysis and run the prediction engine.
          </p>
        )}
      </section>
    </main>
  );
}
