import { useState } from "react";
import {
  MapPin,
  Shield,
  CircleDot,
  ChevronRight,
  Info,
  Maximize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PoliceComplaint } from "@/types/police";

interface PoliceJurisdictionMapProps {
  complaints: PoliceComplaint[];
  selectedComplaintId?: string | null;
  onSelectComplaint: (complaintId: string) => void;
  onViewComplaint: (complaintId: string) => void;
}

// Coordinate mapping for Medchal Police Station Jurisdiction
function getMapCoords(lat: number, lng: number) {
  const minLat = 17.575;
  const maxLat = 17.665;
  const minLng = 78.465;
  const maxLng = 78.505;

  const xPercent = ((lng - minLng) / (maxLng - minLng)) * 80 + 10;
  const yPercent = (1 - (lat - minLat) / (maxLat - minLat)) * 75 + 12;

  return {
    left: `${Math.max(8, Math.min(92, xPercent))}%`,
    top: `${Math.max(10, Math.min(88, yPercent))}%`,
  };
}

export function PoliceJurisdictionMap({
  complaints,
  selectedComplaintId,
  onSelectComplaint,
  onViewComplaint,
}: PoliceJurisdictionMapProps) {
  const [activePopupId, setActivePopupId] = useState<string | null>(
    selectedComplaintId || null
  );
  const [priorityFilter, setPriorityFilter] = useState<"ALL" | "HIGH" | "MEDIUM" | "LOW">("ALL");

  const filteredComplaints = complaints.filter((c) => {
    if (priorityFilter === "ALL") return true;
    return c.priority === priorityFilter;
  });

  const activeComplaint = complaints.find((c) => c.id === activePopupId);

  return (
    <div className="border border-border bg-card">
      {/* Map Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 bg-muted/20">
        <div>
          <h3 className="text-sm font-bold text-foreground">
            Complaint Distribution in Jurisdiction
          </h3>
          <p className="text-xs text-muted-foreground">
            Medchal Police Station · Geographic incident markers
          </p>
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-1 text-xs">
          <button
            type="button"
            onClick={() => setPriorityFilter("ALL")}
            className={`px-2.5 py-1 text-xs font-semibold rounded-xs transition-colors ${
              priorityFilter === "ALL"
                ? "bg-secondary text-secondary-foreground"
                : "text-muted-foreground hover:text-foreground border border-border"
            }`}
          >
            All ({complaints.length})
          </button>
          <button
            type="button"
            onClick={() => setPriorityFilter("HIGH")}
            className={`px-2.5 py-1 text-xs font-semibold rounded-xs transition-colors ${
              priorityFilter === "HIGH"
                ? "bg-destructive text-destructive-foreground"
                : "text-destructive hover:bg-destructive/10 border border-border"
            }`}
          >
            High ({complaints.filter((c) => c.priority === "HIGH").length})
          </button>
          <button
            type="button"
            onClick={() => setPriorityFilter("MEDIUM")}
            className={`px-2.5 py-1 text-xs font-semibold rounded-xs transition-colors ${
              priorityFilter === "MEDIUM"
                ? "bg-amber-600 text-white"
                : "text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 border border-border"
            }`}
          >
            Medium ({complaints.filter((c) => c.priority === "MEDIUM").length})
          </button>
          <button
            type="button"
            onClick={() => setPriorityFilter("LOW")}
            className={`px-2.5 py-1 text-xs font-semibold rounded-xs transition-colors ${
              priorityFilter === "LOW"
                ? "bg-muted-foreground text-card"
                : "text-muted-foreground hover:bg-muted border border-border"
            }`}
          >
            Low ({complaints.filter((c) => c.priority === "LOW").length})
          </button>
        </div>
      </div>

      {/* Map Canvas (Government Cartographic Visual) */}
      <div className="relative h-[340px] w-full overflow-hidden bg-slate-100 dark:bg-slate-900 select-none">
        {/* SVG Base Roads / Outlines */}
        <svg
          className="absolute inset-0 size-full stroke-slate-300 dark:stroke-slate-700 pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Subtle Sector Zones */}
          <polygon
            points="50,40 280,30 350,180 180,240 40,160"
            fill="rgba(241, 245, 249, 0.4)"
            stroke="rgba(148, 163, 184, 0.4)"
            strokeWidth="1"
          />
          <polygon
            points="280,30 650,20 720,200 350,180"
            fill="rgba(248, 250, 252, 0.4)"
            stroke="rgba(148, 163, 184, 0.4)"
            strokeWidth="1"
          />
          <polygon
            points="180,240 350,180 720,200 680,370 240,360"
            fill="rgba(241, 245, 249, 0.4)"
            stroke="rgba(148, 163, 184, 0.4)"
            strokeWidth="1"
          />

          {/* NH-44 Highway Corridor */}
          <path
            d="M 60,380 L 260,270 L 460,170 L 680,75 L 820,15"
            stroke="rgba(100, 116, 139, 0.4)"
            strokeWidth="3"
            fill="none"
          />
          {/* Railway line */}
          <path
            d="M 120,380 L 300,230 L 420,130 L 580,10"
            stroke="rgba(148, 163, 184, 0.5)"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            fill="none"
          />
          {/* Secondary Arterials */}
          <path
            d="M 350,180 L 520,320 L 740,310"
            stroke="rgba(148, 163, 184, 0.3)"
            strokeWidth="1.5"
            fill="none"
          />
        </svg>

        {/* Sector Labels */}
        <div className="absolute left-[16%] top-[45%] text-[10px] font-semibold text-slate-500/70 tracking-wide pointer-events-none">
          Sector 1 (Medchal Central)
        </div>
        <div className="absolute left-[54%] top-[18%] text-[10px] font-semibold text-slate-500/70 tracking-wide pointer-events-none">
          Sector 2 (NH-44 Corridor)
        </div>
        <div className="absolute left-[58%] top-[72%] text-[10px] font-semibold text-slate-500/70 tracking-wide pointer-events-none">
          Sector 6 (Industrial Area)
        </div>

        {/* Map Markers */}
        {filteredComplaints.map((complaint) => {
          const coords = getMapCoords(
            complaint.location.latitude,
            complaint.location.longitude
          );
          const isSelected = activePopupId === complaint.id;

          const markerClass =
            complaint.priority === "HIGH"
              ? "bg-destructive text-white border-white shadow-xs"
              : complaint.priority === "MEDIUM"
              ? "bg-amber-600 text-white border-white shadow-xs"
              : "bg-slate-600 text-white border-white shadow-xs";

          return (
            <div
              key={complaint.id}
              style={{ left: coords.left, top: coords.top }}
              className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
            >
              <button
                type="button"
                onClick={() => {
                  setActivePopupId(complaint.id);
                  onSelectComplaint(complaint.id);
                }}
                className={`relative flex size-5.5 items-center justify-center rounded-full border-2 text-[10px] font-bold transition-transform hover:scale-125 focus:outline-none ${markerClass} ${
                  isSelected ? "scale-125 ring-2 ring-primary ring-offset-1" : ""
                }`}
                title={`${complaint.acknowledgementNumber} · ${complaint.fraudType}`}
              >
                <span className="leading-none">
                  {complaint.priority === "HIGH" ? "!" : "•"}
                </span>
              </button>
            </div>
          );
        })}

        {/* Selected Complaint Floating Detail Card */}
        {activeComplaint && (
          <div className="absolute bottom-3 left-3 right-3 sm:left-auto sm:right-3 sm:max-w-xs z-20 border border-border bg-card p-3 shadow-md">
            <div className="flex items-start justify-between gap-2 border-b border-border pb-1.5">
              <div>
                <span className="text-[10px] font-bold uppercase text-primary">
                  {activeComplaint.priority} Priority
                </span>
                <p className="text-xs font-bold text-foreground">
                  {activeComplaint.acknowledgementNumber}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActivePopupId(null)}
                className="text-muted-foreground hover:text-foreground text-xs px-1"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="mt-2 space-y-1 text-xs">
              <p className="font-semibold text-foreground">{activeComplaint.fraudType}</p>
              <p className="text-muted-foreground">
                Amount: <strong className="text-foreground">{activeComplaint.formattedAmount}</strong>
              </p>
              <p className="text-muted-foreground">
                Status: <span className="font-medium text-foreground">{activeComplaint.status}</span>
              </p>
              <p className="text-muted-foreground text-[11px] truncate">
                Location: {activeComplaint.location.area}
              </p>
            </div>

            <Button
              size="sm"
              variant="default"
              className="mt-2.5 w-full h-7 text-xs font-semibold"
              onClick={() => onViewComplaint(activeComplaint.id)}
            >
              View Complaint Dossier <ChevronRight size={13} />
            </Button>
          </div>
        )}
      </div>

      {/* Map Legend */}
      <div className="flex items-center justify-between border-t border-border px-4 py-2 bg-muted/10 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-foreground text-[11px]">Legend:</span>
          <span className="flex items-center gap-1 text-[11px]">
            <span className="size-2 rounded-full bg-destructive" /> High
          </span>
          <span className="flex items-center gap-1 text-[11px]">
            <span className="size-2 rounded-full bg-amber-600" /> Medium
          </span>
          <span className="flex items-center gap-1 text-[11px]">
            <span className="size-2 rounded-full bg-slate-500" /> Low
          </span>
        </div>
        <span className="text-[11px]">
          Showing {filteredComplaints.length} locations
        </span>
      </div>
    </div>
  );
}
