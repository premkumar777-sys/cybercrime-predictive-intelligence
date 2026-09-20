import { useState } from "react";
import {
  FileText,
  Shield,
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Building,
  Paperclip,
  ArrowLeft,
  Printer,
  ChevronRight,
  Eye,
  Lock,
  History,
  Send,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PoliceEvidenceViewer } from "@/components/police/PoliceEvidenceViewer";
import type { PoliceComplaint, ComplaintStatus, EvidenceItem } from "@/types/police";
import { policeService } from "@/services/policeService";

interface PoliceComplaintDetailModalProps {
  complaint: PoliceComplaint;
  onClose: () => void;
  onStatusUpdated: (updated: PoliceComplaint) => void;
}

const statusOptions: ComplaintStatus[] = [
  "New",
  "Acknowledged",
  "Assigned",
  "Investigation in Progress",
  "Pending Information",
  "Forwarded",
  "Resolved",
];

export function PoliceComplaintDetailModal({
  complaint,
  onClose,
  onStatusUpdated,
}: PoliceComplaintDetailModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<ComplaintStatus>(complaint.status);
  const [officerNote, setOfficerNote] = useState("");
  const [updating, setUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceItem | null>(null);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setUpdateMessage(null);

    try {
      const updated = await policeService.updateComplaintStatus(
        complaint.id,
        selectedStatus,
        officerNote
      );
      setUpdateMessage("Complaint status and case notes updated successfully.");
      setOfficerNote("");
      onStatusUpdated(updated);
      setTimeout(() => setUpdateMessage(null), 4000);
    } catch (err) {
      setUpdateMessage("Failed to update status. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-2 sm:p-4 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="relative my-6 flex max-h-[92vh] w-full max-w-4xl flex-col border border-border bg-card shadow-lg">
        {/* Institutional Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-secondary p-4 text-secondary-foreground">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="grid size-8 place-items-center bg-white/10 text-secondary-foreground hover:bg-white/20"
              aria-label="Back"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-secondary-foreground/70">
                POLICE CASE DOSSIER · {complaint.policeStation}
              </p>
              <h2 className="text-lg font-bold text-white">
                {complaint.acknowledgementNumber}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-white border border-white/20">
              {complaint.status}
            </span>
            <span
              className={`px-2.5 py-0.5 text-xs font-bold ${
                complaint.priority === "HIGH"
                  ? "bg-destructive text-white"
                  : "bg-amber-600 text-white"
              }`}
            >
              {complaint.priority}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:flex h-8 text-xs bg-card text-foreground"
              onClick={() => window.print()}
            >
              <Printer size={13} className="mr-1" /> Print
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-secondary-foreground/70 hover:text-white"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Key Facts Strip */}
          <div className="grid gap-px border border-border bg-border sm:grid-cols-4">
            <div className="bg-card p-3.5">
              <p className="text-[10px] font-bold uppercase text-muted-foreground">Type</p>
              <p className="mt-0.5 text-xs font-bold text-foreground">{complaint.fraudType}</p>
            </div>
            <div className="bg-card p-3.5">
              <p className="text-[10px] font-bold uppercase text-muted-foreground">Amount Lost</p>
              <p className="mt-0.5 text-sm font-bold text-primary">{complaint.formattedAmount}</p>
            </div>
            <div className="bg-card p-3.5">
              <p className="text-[10px] font-bold uppercase text-muted-foreground">Incident Date</p>
              <p className="mt-0.5 text-xs font-medium text-foreground">{complaint.incidentDate}, {complaint.incidentTime}</p>
            </div>
            <div className="bg-card p-3.5">
              <p className="text-[10px] font-bold uppercase text-muted-foreground">Assigned Officer</p>
              <p className="mt-0.5 text-xs font-medium text-foreground">{complaint.assignedOfficer.name}</p>
            </div>
          </div>

          {/* Main 2-Column Content */}
          <div className="grid gap-5 lg:grid-cols-[1.3fr_.7fr]">
            {/* Left Column */}
            <div className="space-y-5">
              {/* Complainant Info */}
              <div className="border border-border bg-card p-4">
                <div className="mb-3 flex items-center justify-between border-b border-border pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-foreground">
                    Citizen Complainant Details
                  </h3>
                  <span className="text-[10px] text-muted-foreground">
                    Privacy-Protected View
                  </span>
                </div>
                <dl className="grid gap-2 text-xs sm:grid-cols-2">
                  <div>
                    <dt className="text-muted-foreground text-[11px]">Name:</dt>
                    <dd className="font-semibold text-foreground">{complaint.citizen.name}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-[11px]">Contact (Masked):</dt>
                    <dd className="font-semibold text-foreground">{complaint.citizen.maskedMobile}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-[11px]">Email:</dt>
                    <dd className="text-foreground">{complaint.citizen.email}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-[11px]">Location:</dt>
                    <dd className="text-foreground">{complaint.location.area}, {complaint.location.landmark}</dd>
                  </div>
                </dl>
              </div>

              {/* Description */}
              <div className="border border-border bg-card p-4">
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-foreground border-b border-border pb-2">
                  Complaint Description
                </h3>
                <p className="text-xs leading-relaxed text-foreground bg-muted/30 p-3 border border-border/60">
                  {complaint.description}
                </p>
              </div>

              {/* Transaction & Bank Details */}
              <div className="border border-border bg-card p-4">
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-foreground border-b border-border pb-2">
                  Transaction & Bank Information
                </h3>
                <dl className="grid gap-2 text-xs sm:grid-cols-2">
                  <div>
                    <dt className="text-muted-foreground text-[11px]">Transaction ID / UTR:</dt>
                    <dd className="font-mono text-xs font-semibold text-foreground">{complaint.transactionRef}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-[11px]">Victim Bank / App:</dt>
                    <dd className="font-medium text-foreground">{complaint.bankOrWallet}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-muted-foreground text-[11px]">Destination Beneficiary Identifier:</dt>
                    <dd className="font-mono text-xs font-semibold text-destructive">{complaint.destinationAccount || "Inquiry in progress"}</dd>
                  </div>
                </dl>
              </div>

              {/* Evidence Section */}
              <div className="border border-border bg-card p-4">
                <div className="mb-3 flex items-center justify-between border-b border-border pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-foreground">
                    Evidence Files ({complaint.evidence.length})
                  </h3>
                  <span className="text-[10px] text-muted-foreground">Digital Attachments</span>
                </div>

                {complaint.evidence.length > 0 ? (
                  <div className="space-y-2">
                    {complaint.evidence.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between border border-border p-2.5 bg-muted/20 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-foreground truncate">{item.name}</p>
                          <p className="text-[10px] text-muted-foreground">{item.fileFormat} · {item.size} · Uploaded {item.uploadedAt}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 ml-3">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs px-2.5"
                            onClick={() => setSelectedEvidence(item)}
                          >
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground py-2">No evidence uploaded by citizen yet.</p>
                )}
              </div>
            </div>

            {/* Right Column: Status Action & Case Log */}
            <div className="space-y-5">
              {/* Status Update Form */}
              <div className="border border-border bg-card p-4">
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-foreground border-b border-border pb-2">
                  Update Case Status
                </h3>

                <form onSubmit={handleUpdateStatus} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-foreground mb-1">
                      Status:
                    </label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value as ComplaintStatus)}
                      className="h-9 w-full border border-input bg-background px-2 text-xs font-medium text-foreground outline-none focus:ring-1 focus:ring-ring"
                    >
                      {statusOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-foreground mb-1">
                      Case Diary Note:
                    </label>
                    <textarea
                      value={officerNote}
                      onChange={(e) => setOfficerNote(e.target.value)}
                      placeholder="Add investigation notes, bank nodal follow-up..."
                      className="h-20 w-full border border-input bg-background p-2 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring resize-y"
                    />
                  </div>

                  {updateMessage && (
                    <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 p-2 border border-emerald-200 dark:border-emerald-800">
                      {updateMessage}
                    </p>
                  )}

                  <Button
                    type="submit"
                    disabled={updating}
                    className="w-full h-8 text-xs font-semibold"
                  >
                    {updating ? "Saving..." : "Save Case Update"}
                  </Button>
                </form>
              </div>

              {/* Case Action History */}
              <div className="border border-border bg-card p-4">
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-foreground border-b border-border pb-2">
                  Case Activity Log
                </h3>

                <ol className="space-y-3 text-xs">
                  {complaint.actionLogs.map((log, index) => (
                    <li key={log.id || index} className="border-b border-border/50 pb-2 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span className="font-semibold text-foreground">{log.author}</span>
                        <span>{log.timestamp}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{log.action}</p>
                      {log.note && (
                        <p className="mt-1 text-[11px] text-foreground italic bg-muted/40 p-1.5 border-l-2 border-primary">
                          "{log.note}"
                        </p>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-border bg-muted/10 px-4 py-2.5 text-xs text-muted-foreground">
          <span>Medchal Police Station · Case Reference ID: {complaint.id}</span>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      {/* Embedded Evidence Viewer */}
      <PoliceEvidenceViewer
        evidence={selectedEvidence}
        complaintAck={complaint.acknowledgementNumber}
        onClose={() => setSelectedEvidence(null)}
      />
    </div>
  );
}
