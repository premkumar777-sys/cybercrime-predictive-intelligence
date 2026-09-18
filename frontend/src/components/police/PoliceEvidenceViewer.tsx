import { useState } from "react";
import {
  FileText,
  Image as ImageIcon,
  Download,
  X,
  CheckCircle2,
  Lock,
  Building,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { EvidenceItem } from "@/types/police";

interface PoliceEvidenceViewerProps {
  evidence: EvidenceItem | null;
  complaintAck: string;
  onClose: () => void;
}

export function PoliceEvidenceViewer({
  evidence,
  complaintAck,
  onClose,
}: PoliceEvidenceViewerProps) {
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!evidence) return null;

  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2500);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative flex max-h-[90vh] w-full max-w-xl flex-col border border-border bg-card shadow-lg">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border bg-secondary px-4 py-3 text-secondary-foreground">
          <div className="flex items-center gap-2">
            <span className="grid size-6 place-items-center bg-white/10 text-white text-xs">
              {evidence.type === "screenshot" ? (
                <ImageIcon size={14} />
              ) : (
                <FileText size={14} />
              )}
            </span>
            <div>
              <h3 className="text-xs font-bold text-white truncate max-w-xs">
                {evidence.name}
              </h3>
              <p className="text-[10px] text-secondary-foreground/70">
                Case: {complaintAck} · {evidence.fileFormat} ({evidence.size})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-secondary-foreground/70 hover:text-white text-xs"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex items-center gap-1.5 border border-border bg-muted/40 p-2.5 text-[11px] text-muted-foreground">
            <Lock size={12} className="text-primary shrink-0" />
            <span>Digital Chain of Custody Record · Uploaded on {evidence.uploadedAt}</span>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            {evidence.description}
          </p>

          {/* Evidence Content Mock */}
          {evidence.type === "receipt" ? (
            <div className="border border-border bg-background p-4 text-xs space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="font-bold text-foreground">
                  {evidence.mockContent?.title || "Transaction Confirmation"}
                </span>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5">
                  VERIFIED
                </span>
              </div>

              {evidence.mockContent?.details && (
                <dl className="grid gap-2 text-xs sm:grid-cols-2">
                  {Object.entries(evidence.mockContent.details).map(([key, value]) => (
                    <div key={key} className="border-b border-border/40 pb-1">
                      <dt className="text-[10px] font-medium text-muted-foreground">{key}</dt>
                      <dd className="font-semibold text-foreground mt-0.5">{value}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          ) : evidence.type === "screenshot" ? (
            <div className="border border-border bg-slate-950 p-4 text-center text-slate-100 rounded-xs">
              <div className="mx-auto max-w-xs rounded border border-slate-800 bg-slate-900 p-3 text-left">
                <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-800 pb-1.5 mb-2">
                  <span>Mobile Screen Capture</span>
                  <span className="text-emerald-400 font-semibold">UPI App</span>
                </div>
                <div className="text-center py-2">
                  <p className="text-[11px] text-slate-400">Payment Request</p>
                  <p className="font-bold text-white text-xs mt-0.5">TG-DISCOM-VERIFY</p>
                  <p className="text-lg font-bold text-amber-400 mt-2">₹75,000.00</p>
                  <p className="text-[10px] text-slate-400 bg-slate-800 p-1.5 rounded mt-2">
                    "Approve to prevent power disconnection"
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="border border-border bg-background p-4 text-xs space-y-2">
              <span className="font-bold text-foreground">Document Extract</span>
              {evidence.mockContent?.details && (
                <dl className="grid gap-1.5 sm:grid-cols-2">
                  {Object.entries(evidence.mockContent.details).map(([key, value]) => (
                    <div key={key} className="border-b border-border/40 pb-1">
                      <dt className="text-[10px] text-muted-foreground">{key}</dt>
                      <dd className="font-semibold text-foreground">{value}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-border bg-muted/10 px-4 py-2.5 text-xs">
          <div>
            {downloadSuccess ? (
              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 size={12} /> Download simulated (Demo file)
              </span>
            ) : (
              <span className="text-[11px] text-muted-foreground">Officer review mode</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onClose}>
              Close
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={handleDownload}
              disabled={downloading}
            >
              <Download size={12} /> {downloading ? "Downloading..." : "Download"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
