import { useEffect, useState, useMemo } from "react";
import {
  Shield,
  FileText,
  AlertTriangle,
  Activity,
  CheckCircle2,
  Clock3,
  Search,
  Download,
  Building2,
  RefreshCw,
  Eye,
  ChevronRight,
  ChevronDown,
  RotateCcw,
  Bell,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PoliceJurisdictionMap } from "@/components/police/PoliceJurisdictionMap";
import { PoliceComplaintDetailModal } from "@/components/police/PoliceComplaintDetailModal";
import { policeService } from "@/services/policeService";
import type {
  PoliceComplaint,
  PoliceStationInfo,
  PriorityAlert,
  RecentActivity,
  PoliceDashboardStats,
  ComplaintStatus,
  ComplaintPriority,
} from "@/types/police";

interface PoliceDashboardProps {
  onSelectInvestigatorCase?: (caseId: string) => void;
}

export function PoliceDashboard({ onSelectInvestigatorCase }: PoliceDashboardProps) {
  // Data states
  const [complaints, setComplaints] = useState<PoliceComplaint[]>([]);
  const [stationInfo, setStationInfo] = useState<PoliceStationInfo | null>(null);
  const [stats, setStats] = useState<PoliceDashboardStats | null>(null);
  const [alerts, setAlerts] = useState<PriorityAlert[]>([]);
  const [activities, setActivities] = useState<RecentActivity[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);
  const [detailModalComplaint, setDetailModalComplaint] = useState<PoliceComplaint | null>(null);
  const [showRecentActivity, setShowRecentActivity] = useState(false);

  // Filters and Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [crimeTypeFilter, setCrimeTypeFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [stationFilter, setStationFilter] = useState("All");
  const [syncing, setSyncing] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [loadedStation, loadedStats, loadedComplaints, loadedAlerts, loadedActivities] =
        await Promise.all([
          policeService.getStationInfo(),
          policeService.getDashboardStats(),
          policeService.getComplaints(),
          policeService.getPriorityAlerts(),
          policeService.getRecentActivities(),
        ]);

      setStationInfo(loadedStation);
      setStats(loadedStats);
      setComplaints(loadedComplaints);
      setAlerts(loadedAlerts);
      setActivities(loadedActivities);
    } catch (err) {
      setError("Unable to load police jurisdiction data. Please check connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSyncBackend = async () => {
    setSyncing(true);
    await policeService.syncWithBackend();
    await loadData();
    setSyncing(false);
  };

  useEffect(() => {
    loadData();
    // Auto-sync with live FastAPI backend periodically
    const interval = setInterval(() => {
      policeService.syncWithBackend();
    }, 8000);
    const unsubscribe = policeService.subscribe(() => {
      policeService.getComplaints().then(setComplaints);
      policeService.getDashboardStats().then(setStats);
      policeService.getPriorityAlerts().then(setAlerts);
      policeService.getRecentActivities().then(setActivities);
    });
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  // Filtered complaints calculation
  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesAck = c.acknowledgementNumber.toLowerCase().includes(q);
        const matchesType = c.fraudType.toLowerCase().includes(q);
        const matchesDesc = c.description.toLowerCase().includes(q);
        const matchesArea = c.location.area.toLowerCase().includes(q);
        const matchesCitizen = c.citizen.name.toLowerCase().includes(q);
        const matchesTxn = c.transactionRef.toLowerCase().includes(q);
        const matchesCaseId = c.liveCaseId?.toLowerCase().includes(q);
        if (!matchesAck && !matchesType && !matchesDesc && !matchesArea && !matchesCitizen && !matchesTxn && !matchesCaseId) {
          return false;
        }
      }

      if (statusFilter !== "All" && c.status !== statusFilter) {
        return false;
      }

      if (crimeTypeFilter !== "All" && !c.fraudType.toLowerCase().includes(crimeTypeFilter.toLowerCase())) {
        return false;
      }

      if (priorityFilter !== "All" && c.priority !== priorityFilter) {
        return false;
      }

      if (stationFilter !== "All" && !c.policeStation.toLowerCase().includes(stationFilter.toLowerCase())) {
        return false;
      }

      return true;
    });
  }, [complaints, searchQuery, statusFilter, crimeTypeFilter, priorityFilter, stationFilter]);

  const handleOpenDetail = (complaintId: string) => {
    const found = complaints.find((c) => c.id === complaintId || c.acknowledgementNumber === complaintId);
    if (found) {
      setDetailModalComplaint(found);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter("All");
    setCrimeTypeFilter("All");
    setPriorityFilter("All");
  };

  const getStatusBadge = (status: ComplaintStatus) => {
    switch (status) {
      case "New":
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
      case "Acknowledged":
        return "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300";
      case "Assigned":
        return "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300";
      case "Investigation in Progress":
        return "bg-sky-50 text-sky-800 dark:bg-sky-950 dark:text-sky-200 font-semibold";
      case "Pending Information":
        return "bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200";
      case "Forwarded":
        return "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300";
      case "Resolved":
        return "bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200";
    }
  };

  const getPriorityBadge = (priority: ComplaintPriority) => {
    switch (priority) {
      case "HIGH":
        return "text-destructive font-bold";
      case "MEDIUM":
        return "text-amber-700 dark:text-amber-400 font-medium";
      case "LOW":
        return "text-muted-foreground font-medium";
    }
  };

  if (loading && !complaints.length) {
    return (
      <main className="mx-auto min-h-[700px] max-w-[1400px] px-4 py-8 sm:px-6">
        <div className="space-y-6 animate-pulse">
          <div className="h-16 bg-muted rounded-xs" />
          <div className="grid gap-4 sm:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-muted rounded-xs" />
            ))}
          </div>
          <div className="h-80 bg-muted rounded-xs" />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto min-h-[700px] max-w-[1400px] px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-lg border border-border bg-card p-6 text-center">
          <AlertTriangle className="mx-auto text-destructive" size={36} />
          <h2 className="mt-3 text-lg font-bold text-foreground">Unable to load complaints</h2>
          <p className="mt-1 text-xs text-muted-foreground">{error}</p>
          <Button className="mt-4" size="sm" onClick={loadData}>
            <RefreshCw size={13} className="mr-1.5" /> Try Again
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-[700px] max-w-[1400px] px-4 py-6 sm:px-6 space-y-6 text-foreground">
      {/* 1 & 2. Simple Page Title Area */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-2xl">
              Police Operations Dashboard
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 border border-border bg-muted/60 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground uppercase">
              <Shield size={11} className="text-primary" /> Authorized Police Access
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {stationInfo?.name || "Medchal Police Station"} · {stationInfo?.district || "Medchal-Malkajgiri"} District, Telangana
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncBackend}
            disabled={syncing}
            className="h-8 text-xs font-medium gap-1.5 border-emerald-600 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
            title="Fetch real-time cases from backend"
          >
            <RefreshCw size={13} className={syncing ? "animate-spin" : ""} />
            {syncing ? "Syncing..." : "Sync Live Cases"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            className="h-8 text-xs font-medium gap-1.5"
            title="Refresh local complaints queue"
          >
            <RefreshCw size={13} /> Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => window.print()}
            className="h-8 text-xs font-medium gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Download size={13} /> Daily Brief
          </Button>
        </div>
      </div>

      {/* 3. Compact Official Jurisdiction Information Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 border border-border bg-card px-4 py-2.5">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
            Current Jurisdiction:
          </span>
          <span className="font-bold text-foreground">
            {stationInfo?.name || "Medchal Police Station"}
          </span>
          <span className="text-muted-foreground">({stationInfo?.district || "Medchal-Malkajgiri District"})</span>
        </div>

        <div className="text-xs text-muted-foreground">
          Complaints in Jurisdiction: <strong className="text-foreground">{stats?.totalComplaints || complaints.length}</strong>
        </div>
      </div>

      {/* 4. Four Simple Statistics Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Complaints */}
        <div className="border border-border bg-card p-4">
          <p className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider">
            Total Complaints
          </p>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {stats?.totalComplaints || complaints.length}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">Station register total</p>
        </div>

        {/* New Today */}
        <div className="border border-border bg-card p-4">
          <p className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider">
            New Today
          </p>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {stats?.newToday ?? 0}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">Pending verification</p>
        </div>

        {/* Under Investigation */}
        <div className="border border-border bg-card p-4">
          <p className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider">
            Under Investigation
          </p>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {stats?.underInvestigation ?? 0}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">Assigned to officers</p>
        </div>

        {/* High Priority (Subtle Red Accent) */}
        <div className="border border-border bg-card p-4">
          <p className="text-[11px] font-bold uppercase text-destructive tracking-wider">
            High Priority
          </p>
          <p className="mt-2 text-2xl font-bold text-destructive">
            {stats?.highPriority ?? 0}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">Requires immediate action</p>
        </div>
      </div>

      {/* 5 & 6. Side-by-Side: Map (Left) & Priority Alerts (Right) */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left: Complaint Distribution Map (~58% on desktop) */}
        <div className="lg:col-span-7">
          <PoliceJurisdictionMap
            complaints={complaints}
            selectedComplaintId={selectedComplaintId}
            onSelectComplaint={(id) => setSelectedComplaintId(id)}
            onViewComplaint={handleOpenDetail}
          />
        </div>

        {/* Right: Priority Alerts (~42% on desktop) */}
        <div className="lg:col-span-5 border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-muted/20">
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-destructive" />
              <h3 className="text-sm font-bold text-foreground">
                Priority Alerts ({alerts.length})
              </h3>
            </div>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">
              Action Required
            </span>
          </div>

          <div className="divide-y divide-border">
            {alerts.slice(0, 4).map((alert) => (
              <div
                key={alert.id}
                className="flex items-start justify-between gap-3 p-3.5 hover:bg-muted/30 transition-colors"
              >
                <div className="border-l-2 border-destructive pl-2.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">
                      {alert.acknowledgementNumber}
                    </span>
                    <span className="text-[10px] font-semibold text-destructive uppercase">
                      HIGH
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {alert.timeAgo}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-foreground mt-0.5">
                    {alert.type} · <span className="font-semibold text-primary">{alert.amount}</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                    {alert.reason}
                  </p>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs font-medium shrink-0"
                  onClick={() => handleOpenDetail(alert.complaintId)}
                >
                  View
                </Button>
              </div>
            ))}
          </div>

          <div className="border-t border-border px-4 py-2 bg-muted/10 text-[11px] text-muted-foreground text-center">
            Review urgent notifications to secure 1930 nodal hold on fraud accounts.
          </div>
        </div>
      </div>

      {/* 8. Main Operational Complaints Table */}
      <section className="border border-border bg-card">
        {/* Table Title and Toolbar */}
        <div className="border-b border-border p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-foreground">
                Complaints in Your Jurisdiction
              </h2>
              <p className="text-xs text-muted-foreground">
                Showing {filteredComplaints.length} of {complaints.length} registered cases
              </p>
            </div>

            {(searchQuery || statusFilter !== "All" || crimeTypeFilter !== "All" || priorityFilter !== "All") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
              >
                <RotateCcw size={11} /> Reset Filters
              </Button>
            )}
          </div>

          {/* Compact Clean Filter Toolbar */}
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
            {/* Search Input */}
            <div className="sm:col-span-2 relative">
              <Search className="absolute left-2.5 top-2.5 text-muted-foreground" size={14} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search complaints by Ack No, Case ID, type, victim..."
                className="h-9 w-full border border-input bg-background pl-8 pr-3 text-xs outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            {/* Station Filter */}
            <div>
              <select
                value={stationFilter}
                onChange={(e) => setStationFilter(e.target.value)}
                className="h-9 w-full border border-input bg-background px-2 text-xs font-medium text-foreground"
                title="Filter by nearby Police Station"
              >
                <option value="All">All Police Stations</option>
                <option value="Medchal">Medchal Police Station</option>
                <option value="Cyber Crime">Cyber Crime PS, Hyd</option>
                <option value="Madhapur">Madhapur PS</option>
                <option value="Kukatpally">Kukatpally PS</option>
                <option value="Malkajgiri">Malkajgiri PS</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 w-full border border-input bg-background px-2 text-xs font-medium text-foreground"
              >
                <option value="All">All Statuses</option>
                <option value="New">New</option>
                <option value="Acknowledged">Acknowledged</option>
                <option value="Assigned">Assigned</option>
                <option value="Investigation in Progress">Investigation in Progress</option>
                <option value="Pending Information">Pending Information</option>
                <option value="Forwarded">Forwarded</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            {/* Crime Type Filter */}
            <div>
              <select
                value={crimeTypeFilter}
                onChange={(e) => setCrimeTypeFilter(e.target.value)}
                className="h-9 w-full border border-input bg-background px-2 text-xs font-medium text-foreground"
              >
                <option value="All">All Crime Types</option>
                <option value="UPI">UPI Fraud</option>
                <option value="OTP">OTP Fraud</option>
                <option value="Investment">Investment Scam</option>
                <option value="Phishing">Phishing</option>
                <option value="Job">Job Scam</option>
                <option value="Credit Card">Credit Card KYC</option>
                <option value="Social Media">Social Extortion</option>
                <option value="Electricity">Electricity Bill Scam</option>
                <option value="Loan">Loan App Harassment</option>
                <option value="AePS">AePS Biometric</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="h-9 w-full border border-input bg-background px-2 text-xs font-medium text-foreground"
              >
                <option value="All">All Priorities</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Complaints Table */}
        <div className="overflow-x-auto">
          {filteredComplaints.length > 0 ? (
            <table className="w-full min-w-[800px] text-left text-xs">
              <thead className="border-b border-border bg-muted/40 text-[11px] font-semibold text-muted-foreground uppercase">
                <tr>
                  <th className="p-3">Acknowledgement No.</th>
                  <th>Type</th>
                  <th>Station</th>
                  <th>Reported</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredComplaints.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-muted/20 transition-colors"
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(c.id)}
                          className="font-bold text-primary hover:underline text-xs"
                        >
                          {c.acknowledgementNumber}
                        </button>
                        {c.liveCaseId && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-xs border border-emerald-500/30 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-[9px] font-extrabold tracking-tight" title={`FastAPI Backend Case Reference: ${c.liveCaseId}`}>
                            LIVE {c.liveCaseId}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {c.citizen.name} · {c.location.area}
                      </div>
                    </td>
                    <td className="font-medium text-foreground">
                      {c.fraudType}
                    </td>
                    <td className="text-muted-foreground text-xs">
                      {c.policeStation}
                    </td>
                    <td className="text-muted-foreground text-xs">
                      {c.reportedDate}
                    </td>
                    <td className="font-semibold text-foreground">
                      {c.formattedAmount}
                    </td>
                    <td>
                      <span className={`px-2 py-0.5 text-[11px] rounded-xs ${getStatusBadge(c.status)}`}>
                        {c.status}
                      </span>
                    </td>
                    <td>
                      <span className={`text-[11px] ${getPriorityBadge(c.priority)}`}>
                        {c.priority}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenDetail(c.id)}
                          className="h-7 text-xs font-medium"
                        >
                          View
                        </Button>
                        {onSelectInvestigatorCase && (
                          <Button
                            size="sm"
                            onClick={() => onSelectInvestigatorCase(c.liveCaseId || c.id)}
                            className="h-7 text-[11px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90 gap-1 px-2"
                            title="Open in Investigator Command Workspace for predictive ML analysis"
                          >
                            Investigate <ChevronRight size={11} />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-12 px-4 text-center">
              <p className="text-sm font-semibold text-foreground">
                No complaints found in this jurisdiction
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {searchQuery || statusFilter !== "All" || crimeTypeFilter !== "All" || priorityFilter !== "All"
                  ? "Try resetting your search query or filters."
                  : "New complaints assigned to your police station will appear here."}
              </p>
              {(searchQuery || statusFilter !== "All" || crimeTypeFilter !== "All" || priorityFilter !== "All") && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleResetFilters}
                  className="mt-3 text-xs"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Table Summary Footer */}
        <div className="flex items-center justify-between border-t border-border bg-muted/10 px-4 py-2.5 text-xs text-muted-foreground">
          <span>
            Medchal Police Station Queue · Active Records: {filteredComplaints.length}
          </span>
          <span className="font-medium text-foreground">
            Station Code: {stationInfo?.stationCode || "TG-MDCL-PS-04"}
          </span>
        </div>
      </section>

      {/* 7. Secondary / Collapsible Recent Activity Section */}
      <section className="border border-border bg-card">
        <button
          type="button"
          onClick={() => setShowRecentActivity(!showRecentActivity)}
          className="flex w-full items-center justify-between p-3.5 text-left text-xs font-bold text-foreground hover:bg-muted/20"
        >
          <div className="flex items-center gap-2">
            <Clock3 size={14} className="text-primary" />
            <span>Recent Station Activity & Log ({activities.length})</span>
          </div>
          <ChevronDown
            size={14}
            className={`text-muted-foreground transition-transform ${
              showRecentActivity ? "rotate-180" : ""
            }`}
          />
        </button>

        {showRecentActivity && (
          <div className="border-t border-border p-4">
            <ol className="space-y-3 text-xs">
              {activities.slice(0, 6).map((act) => (
                <li key={act.id} className="flex items-start justify-between gap-3 pb-2 border-b border-border/40 last:border-0 last:pb-0">
                  <div>
                    <span className="font-semibold text-foreground">{act.description}</span>
                    <span className="text-muted-foreground block text-[11px] mt-0.5">
                      Case: {act.acknowledgementNumber}
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground shrink-0">{act.timestamp}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </section>

      {/* Complaint Detail Dossier Modal */}
      {detailModalComplaint && (
        <PoliceComplaintDetailModal
          complaint={detailModalComplaint}
          onClose={() => setDetailModalComplaint(null)}
          onStatusUpdated={(updated) => {
            setDetailModalComplaint(updated);
          }}
        />
      )}
    </main>
  );
}
