import { useEffect, useState, type ReactNode, lazy, Suspense, useRef, useMemo } from "react";
import { ArrowRight, CheckCircle2, AlertTriangle, FileText, Fingerprint, Link as LinkIcon, Lock, MapPin, Radar, RefreshCw, ShieldCheck, ZoomIn, ZoomOut, Maximize } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, scorePercent, type ApiCase, type Location, type Prediction, type AuditBlock, type AuditVerification } from "@/lib/api";

type Go = (view: "investigator" | "intel-report") => void;

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return <section className="border border-border bg-card civic-shadow"><div className="flex items-center gap-2 border-b border-border px-5 py-4 font-bold text-primary"><Radar size={17} />{title}</div><div className="p-5">{children}</div></section>;
}

const LiveMap = lazy(() => import("./LiveMap"));

const ForceGraph2D = lazy(() => import("react-force-graph-2d"));

function TransactionGraph({ graphData }: { graphData: { nodes: any[]; links: any[] } }) {
  const fgRef = useRef<any>();
  const [dimensions, setDimensions] = useState({ width: 0, height: 400 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      setDimensions({ width: entries[0].contentRect.width, height: 400 });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="relative h-[400px] w-full overflow-hidden bg-background">
      <Suspense fallback={<div className="grid h-full place-items-center text-sm text-muted-foreground">Loading graph engine...</div>}>
        <ForceGraph2D
          ref={fgRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={graphData}
          nodeLabel={(node: any) => `${node.id} (${node.group})`}
          nodeColor={(node: any) => {
            if (node.group === "source") return "#3b82f6";
            if (node.group === "cashout") return "#ef4444";
            return "#f59e0b";
          }}
          nodeRelSize={6}
          linkColor={() => "#cbd5e1"}
          linkDirectionalArrowLength={3.5}
          linkDirectionalArrowRelPos={1}
          cooldownTicks={100}
          onEngineStop={() => fgRef.current?.zoomToFit(400)}
        />
      </Suspense>
      <div className="absolute bottom-3 left-3 flex flex-col gap-1 rounded bg-card p-2 text-[10px] font-bold civic-shadow">
        <div className="flex items-center gap-2"><span className="size-2 rounded-full bg-blue-500"></span> Source</div>
        <div className="flex items-center gap-2"><span className="size-2 rounded-full bg-amber-500"></span> Mule</div>
        <div className="flex items-center gap-2"><span className="size-2 rounded-full bg-red-500"></span> Cash-Out</div>
      </div>
      <div className="absolute right-3 top-3 flex flex-col gap-1">
        <Button variant="secondary" size="icon" className="size-7 rounded-sm" onClick={() => {
           const currentZoom = fgRef.current?.zoom() || 1;
           fgRef.current?.zoom(currentZoom * 1.2, 400);
        }}><ZoomIn size={14}/></Button>
        <Button variant="secondary" size="icon" className="size-7 rounded-sm" onClick={() => {
           const currentZoom = fgRef.current?.zoom() || 1;
           fgRef.current?.zoom(currentZoom / 1.2, 400);
        }}><ZoomOut size={14}/></Button>
        <Button variant="secondary" size="icon" className="size-7 rounded-sm" onClick={() => fgRef.current?.zoomToFit(400)}><Maximize size={14}/></Button>
      </div>
    </div>
  );
}

export function LiveInvestigator({ caseId, go }: { caseId: string | null; go: Go }) {
  const [caseData, setCaseData] = useState<ApiCase | null>(null);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [auditTrail, setAuditTrail] = useState<AuditBlock[]>([]);
  const [auditVerification, setAuditVerification] = useState<AuditVerification | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => { setIsClient(true); }, []);

  useEffect(() => {
    if (!caseId) return;
    Promise.all([api.getCase(caseId), api.listLocations(), api.getAuditTrail(caseId).catch(() => [])]).then(([loadedCase, loadedLocations, loadedTrail]) => {
      setCaseData(loadedCase);
      setLocations(loadedLocations);
      setAuditTrail(loadedTrail || []);
      return api.getPrediction(caseId).then(setPrediction).catch(() => undefined);
    }).catch(() => setError("Unable to load this case from the intelligence service."));
  }, [caseId]);

  const analyze = async () => {
    if (!caseId) return;
setBusy(true);
    setError(null);
    try {
      const predRes = await api.analyzeCase(caseId);
      setPrediction(predRes);
      const updatedTrail = await api.getAuditTrail(caseId);
      setAuditTrail(updatedTrail);
      setAuditVerification(null);
    } catch (e: any) {
      if (e.message?.includes("409")) setError("Analysis is already running for this case.");
      else if (e.message?.includes("403")) setError("Unauthorized. Investigator role required.");
      else setError("Prediction service temporarily unavailable");
    } finally {
      setBusy(false);
    }
  };

  const verifyAudit = async () => {
    if (!caseId) return;
    setVerifying(true);
    try {
      const res = await api.verifyAuditTrail(caseId);
      setAuditVerification(res);
    } catch {
      setError("Failed to verify blockchain audit trail.");
    } finally {
      setVerifying(false);
    }
  };

  if (!caseId || !caseData) return <main className="mx-auto min-h-[700px] max-w-[1440px] px-4 py-8 sm:px-6"><p className="text-xs font-bold uppercase text-primary">Investigator command workspace</p><h1 className="mt-1 text-3xl font-extrabold">Predictive Case Analysis</h1><p className="mt-8 text-sm text-muted-foreground">Open a case from the Police dashboard to begin analysis.</p></main>;

  const topScore = prediction?.predictions[0]?.risk_score ?? 0;
  const now = new Date();
  
  return <main className="mx-auto min-h-[700px] max-w-[1440px] px-4 py-8 sm:px-6"><div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase text-primary">Investigator command workspace</p><h1 className="mt-1 text-3xl font-extrabold">Predictive Case Analysis</h1></div><Button onClick={() => go("intel-report")} disabled={!prediction || prediction.status === "INSUFFICIENT_DATA"}><FileText />Generate Intelligence Report</Button></div><div className="grid gap-px bg-border border border-border sm:grid-cols-4"><div className="bg-secondary p-4 text-secondary-foreground"><p className="text-[10px] uppercase opacity-70">Case</p><p className="mt-1 font-bold">{caseData.case_id}</p></div><div className="bg-card p-4"><p className="text-[10px] uppercase text-muted-foreground">Fraud type</p><p className="mt-1 font-bold">{caseData.fraud_type.replaceAll("_", " ")}</p></div><div className="bg-card p-4"><p className="text-[10px] uppercase text-muted-foreground">Amount</p><p className="mt-1 font-bold">₹{caseData.amount.toLocaleString("en-IN")}</p></div><div className="bg-card p-4"><p className="text-[10px] uppercase text-muted-foreground">Status</p><p className="mt-1 font-bold">{caseData.status}</p></div></div><div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_.9fr]"><div className="space-y-6"><Panel title="Predictive intelligence">
  <div className="flex items-center justify-between border-b border-border pb-5">
    <div><p className="text-xs uppercase text-muted-foreground">Candidate Score</p><p className="mt-2 text-4xl font-extrabold text-destructive">{prediction?.status === "INSUFFICIENT_DATA" ? "N/A" : topScore.toFixed(3)}</p></div>
    <div className="text-right">
      <span className="bg-destructive px-3 py-1 text-xs font-bold text-destructive-foreground">{prediction?.risk_level ?? "PENDING"}</span>
      <p className="mt-2 text-[10px] text-muted-foreground">Model: RF-v1.3 (Candidate Scorer)</p>
      {prediction && <p className="text-[10px] text-muted-foreground">Data Snapshot: {now.toLocaleTimeString()}</p>}
    </div>
  </div>
  {prediction?.status === "INSUFFICIENT_DATA" ? <p className="mt-4 border-l-4 border-destructive bg-destructive/10 p-3 text-xs font-bold text-destructive">Prediction Unavailable: {prediction.reason}</p> : <p className="mt-4 border-l-4 border-accent bg-muted p-3 text-xs leading-relaxed text-muted-foreground">Candidate score represents ranking relevance, NOT a calibrated probability.</p>}
  <Button className="mt-5" onClick={analyze} disabled={busy}>{busy ? "Analysing..." : prediction ? "Re-run analysis" : "Analyse case"}<RefreshCw /></Button>{error && <p className="mt-4 text-xs text-destructive font-bold">{error}</p>}</Panel>
  <Panel title="Transaction Intelligence">
    <div className="border border-border">
      {prediction?.graph && prediction.graph.nodes.length > 0 ? (
        <TransactionGraph graphData={prediction.graph} />
      ) : (
        <div className="p-4 bg-muted">
          <div className="text-center text-xs font-sans p-4 text-muted-foreground">No transaction graph available.</div>
        </div>
      )}
    </div>
  </Panel>
  <Panel title="Ranked candidate locations"><div className="space-y-3">{prediction?.status === "INSUFFICIENT_DATA" ? <div className="py-8 text-center text-sm text-destructive"><MapPin className="mx-auto mb-3 text-destructive" />Insufficient data to rank candidates.</div> : prediction?.predictions.length ? prediction.predictions.map((item) => { const location = locations.find((candidate) => candidate.location_id === item.location_id); return <div className="flex items-start gap-3 border border-border p-3" key={item.location_id}><span className="grid size-8 shrink-0 place-items-center bg-primary text-xs font-bold text-primary-foreground">#{item.rank}</span><div className="min-w-0 flex-1"><p className="font-semibold">{item.location_name}</p><p className="text-xs text-muted-foreground">{location?.location_type ?? "ATM"} · {item.time_window}</p><div className="mt-2 flex gap-2 flex-wrap">{Object.entries(item.features || {}).map(([k, v]) => <span key={k} className="text-[10px] bg-muted px-2 py-0.5 rounded-sm">{k.replace(/_/g, " ")}: {v}</span>)}</div></div><strong className="text-lg text-destructive">{item.risk_score.toFixed(3)}</strong></div>; }) : <div className="py-8 text-center text-sm text-muted-foreground"><MapPin className="mx-auto mb-3 text-primary" />Run analysis to rank candidate locations.</div>}</div></Panel></div><div className="space-y-6"><Panel title="Interactive GIS Heatmap"><div className="relative aspect-[16/10] overflow-hidden border border-border z-0">
    <Suspense fallback={<div className="grid h-full w-full place-items-center bg-muted text-sm text-muted-foreground">Loading GIS Engine...</div>}>
      {isClient && <LiveMap prediction={prediction} locations={locations} />}
    </Suspense>
  <span className="absolute left-3 top-3 z-[400] bg-card px-2 py-1 text-[10px] font-bold civic-shadow">HYDERABAD · LIVE GIS</span></div><div className="mt-3 flex justify-between text-xs"><span className="font-semibold">{prediction?.predictions.length ? "Locations plotted via Leaflet" : "No locations to plot"}</span></div></Panel></div></div>
  <div className="mt-6">
    <Panel title="Immutable Blockchain Audit Trail & Evidentiary Chain (BSA Sec 63 / Sec 65B)">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <p className="text-xs text-muted-foreground">
            Real cryptographic SHA-256 ledger chaining complaint registration, ML scoring, and enforcement dispatches.
          </p>
          {auditVerification?.merkle_root && (
            <p className="mt-1 font-mono text-[11px] text-primary">
              Merkle Root: <span className="font-bold">{auditVerification.merkle_root}</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {auditVerification && (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold ${auditVerification.is_valid ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : "bg-destructive/10 text-destructive border border-destructive/20"}`}>
              {auditVerification.is_valid ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
              {auditVerification.is_valid ? "VERIFIED TAMPER-FREE" : "TAMPER DETECTED"}
            </span>
          )}
          <Button size="sm" variant="outline" onClick={verifyAudit} disabled={verifying || auditTrail.length === 0}>
            <ShieldCheck size={14} className="mr-1 text-primary" />
            {verifying ? "Verifying Cryptographic Chain..." : "Verify Ledger Integrity"}
          </Button>
        </div>
      </div>

      {auditVerification?.tamper_detected && (
        <div className="mt-4 border-l-4 border-destructive bg-destructive/10 p-3 text-xs text-destructive">
          <p className="font-bold">Cryptographic Discrepancy Detected:</p>
          <ul className="mt-1 list-disc pl-4 space-y-0.5">
            {auditVerification.blocks.filter(b => b.status === "TAMPERED").flatMap(b => b.errors).map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {auditVerification?.is_valid && (
        <div className="mt-4 border-l-4 border-emerald-500 bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-300">
          <p className="font-bold">✓ Non-Repudiation & Evidentiary Integrity Certified</p>
          <p className="mt-0.5 opacity-90">{auditVerification.compliance_note}</p>
        </div>
      )}

      <div className="mt-5 space-y-3">
        {auditTrail.length === 0 ? (
          <div className="py-6 text-center text-xs text-muted-foreground">
            No blockchain blocks synchronized yet for this case. Run analysis or register a case to generate blocks.
          </div>
        ) : (
          auditTrail.map((block) => {
            const verifiedBlock = auditVerification?.blocks.find(b => b.block_index === block.block_index);
            const isTampered = verifiedBlock?.status === "TAMPERED";

            return (
              <div key={block.id ?? block.block_index} className={`border p-3 transition-colors ${isTampered ? "border-destructive/50 bg-destructive/5" : "border-border bg-card/60"}`}>
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="grid size-6 place-items-center bg-primary text-[10px] font-extrabold text-primary-foreground">
                      #{block.block_index}
                    </span>
                    <span className="font-bold text-xs tracking-wider uppercase text-primary">
                      {block.event_type.replaceAll("_", " ")}
                    </span>
                    <span className="bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                      {block.actor}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {block.timestamp ? new Date(block.timestamp).toLocaleString() : "Just now"}
                  </span>
                </div>

                <div className="mt-2.5 grid gap-2 sm:grid-cols-2 text-[11px]">
                  <div className="truncate font-mono">
                    <span className="text-muted-foreground mr-1.5">Block Hash:</span>
                    <span className="font-semibold text-foreground" title={block.block_hash}>
                      {block.block_hash.slice(0, 16)}...{block.block_hash.slice(-8)}
                    </span>
                  </div>
                  <div className="truncate font-mono">
                    <span className="text-muted-foreground mr-1.5">Prev Hash:</span>
                    <span className="text-muted-foreground" title={block.previous_hash}>
                      {block.previous_hash.slice(0, 16)}...{block.previous_hash.slice(-8)}
                    </span>
                  </div>
                </div>

                <div className="mt-2 rounded bg-muted/50 p-2 font-mono text-[10px] text-muted-foreground">
                  <span className="font-sans font-bold text-foreground mr-2">Synchronized Event Data:</span>
                  {JSON.stringify(block.event_data)}
                </div>
              </div>
            );
          })
        )}
      </div>
    </Panel>
  </div>
  </main>;
}

export function LiveIntelReport({ caseId, go }: { caseId: string | null; go: Go }) {
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [auditTrail, setAuditTrail] = useState<AuditBlock[]>([]);
  const now = new Date();
  
  useEffect(() => {
    if (caseId) {
      api.getPrediction(caseId).then(setPrediction).catch(() => undefined);
      api.getAuditTrail(caseId).then(setAuditTrail).catch(() => undefined);
    }
  }, [caseId]);
  
  return <main className="mx-auto min-h-[700px] max-w-[1100px] px-4 py-8 sm:px-6"><div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase text-primary">Live intelligence report</p><h1 className="mt-1 text-3xl font-extrabold">{caseId ?? "No case selected"} · Investigative Brief</h1></div><Button variant="outline" onClick={() => go("investigator")}><ArrowRight />Back to analysis</Button></div><section className="border border-border bg-card p-6 civic-shadow sm:p-10"><div className="flex gap-3 border-b-2 border-secondary pb-6"><span className="grid size-12 place-items-center bg-primary text-primary-foreground"><ShieldCheck /></span><div className="flex-1"><p className="font-extrabold">Predictive Intelligence Brief</p><p className="text-xs text-muted-foreground">Generated from the connected FastAPI prediction service</p></div><div className="text-right text-[10px] text-muted-foreground"><p>Data Snapshot: {now.toLocaleTimeString()}</p><p>Model Version: RF-v1.3 Candidate Scorer</p></div></div>
  {prediction?.status === "INSUFFICIENT_DATA" ? <div className="my-8 border-l-4 border-destructive bg-destructive/10 p-5 text-sm"><p className="font-bold text-destructive">Prediction Unavailable</p><p className="mt-1 text-muted-foreground">{prediction.reason}</p></div> : 
  prediction ? <><div className="mt-7 grid gap-6 sm:grid-cols-3"><div className="border border-border p-4"><p className="text-[10px] uppercase text-muted-foreground">Risk level</p><p className="mt-2 text-xl font-extrabold">{prediction.risk_level}</p></div><div className="border border-border p-4"><p className="text-[10px] uppercase text-muted-foreground">Candidate locations</p><p className="mt-2 text-xl font-extrabold">{prediction.predictions.length}</p></div><div className="border border-border p-4"><p className="text-[10px] uppercase text-muted-foreground">Top score</p><p className="mt-2 text-xl font-extrabold">{scorePercent(prediction.predictions[0]?.risk_score ?? 0)}</p></div></div><h2 className="mt-8 border-b border-border pb-2 font-bold">Ranked candidate locations</h2><div className="mt-3 overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm"><thead className="bg-muted"><tr><th className="p-3">Rank</th><th>Location</th><th>Risk estimate</th><th>Likely window</th></tr></thead><tbody>{prediction.predictions.map((item) => <tr className="border-b border-border" key={item.location_id}><td className="p-3 font-bold">#{item.rank}</td><td>{item.location_name}</td><td className="text-destructive">{scorePercent(item.risk_score)}</td><td>{item.time_window}</td></tr>)}</tbody></table></div></> : <p className="py-10 text-sm text-muted-foreground">No prediction exists for this case yet. Return to analysis and run the prediction engine.</p>}
  {auditTrail.length > 0 && (
    <div className="mt-8 border border-border/80 bg-muted/20 p-4">
      <div className="flex items-center gap-2 font-bold text-xs text-primary mb-2">
        <Lock size={14} />
        <span>Blockchain Evidentiary Chain of Custody (BSA Section 63 / Sec 65B)</span>
      </div>
      <p className="text-[11px] text-muted-foreground mb-3">
        This brief is cryptographically anchored to an immutable ledger. Every event and ML inference is hashed via SHA-256 to ensure zero post-incident tampering.
      </p>
      <div className="space-y-1.5 font-mono text-[10px]">
        {auditTrail.map((b) => (
          <div key={b.id ?? b.block_index} className="flex flex-wrap items-center justify-between gap-1 border-b border-border/40 pb-1">
            <span className="text-foreground font-bold">Block #{b.block_index} [{b.event_type}]:</span>
            <span className="text-muted-foreground">Hash: {b.block_hash.slice(0, 24)}... (Prev: {b.previous_hash.slice(0, 8)}...)</span>
          </div>
        ))}
      </div>
    </div>
  )}
  <div className="mt-10 border-t border-border pt-4 text-[10px] text-muted-foreground">DISCLAIMER: This document contains predictive intelligence intended for lead generation. Candidate location ranks are probabilistic and derived from partial transaction-hop data. Not for direct evidentiary use without field corroboration.</div>
  </section></main>;
}
