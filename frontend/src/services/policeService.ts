import type {
  PoliceComplaint,
  PoliceStationInfo,
  PriorityAlert,
  RecentActivity,
  PoliceDashboardStats,
  ComplaintStatus,
  PoliceActionLog,
} from "@/types/police";
import { api, type ApiCase } from "@/lib/api";

const STORAGE_KEY = "tg_police_live_complaints_v2";

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage errors
  }
}

// In-memory frontend state store initialized from localStorage or defaults
let complaintsState: PoliceComplaint[] = loadFromStorage(
  STORAGE_KEY,
  []
);
let alertsState: PriorityAlert[] = [];
let activitiesState: RecentActivity[] = [];
let stationState: PoliceStationInfo | null = null;

// Listeners for reactivity
type StateListener = () => void;
const listeners: Set<StateListener> = new Set();

function notifyListeners() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // Ignore listener error
    }
  });
}

function persistState() {
  saveToStorage(STORAGE_KEY, complaintsState);
}

/**
 * Convert a backend ApiCase to PoliceComplaint
 */
function apiCaseToPoliceComplaint(c: ApiCase): PoliceComplaint {
  const d = new Date(c.created_at);
  const dateStr = d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timeStr = d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const isAnalyzed = c.status === "ANALYZED";
  const priority = c.amount >= 50000 ? "HIGH" : "MEDIUM";

  return {
    id: c.case_id,
    liveCaseId: c.case_id,
    acknowledgementNumber: `NCRP-TG-${c.case_id}`,
    fraudType: c.fraud_type.replaceAll("_", " "),
    incidentDate: dateStr,
    incidentTime: timeStr,
    reportedDate: dateStr,
    reportedTime: timeStr,
    lastUpdated: `${dateStr}, ${timeStr}`,
    amount: c.amount,
    formattedAmount: `₹${c.amount.toLocaleString("en-IN")}`,
    transactionRef: `TXN-${c.case_id}-LIVE`,
    bankOrWallet: "State Bank of India / Digital Bank",
    destinationAccount: c.destination_account,
    status: isAnalyzed ? "Investigation in Progress" : "New",
    priority,
    priorityReason:
      c.amount >= 50000
        ? "High-value fraudulent fund movement reported"
        : "Standard jurisdiction triage",
    description: `Reported cyber fraud involving transaction of ₹${c.amount.toLocaleString(
      "en-IN"
    )} to destination ${c.destination_account}.`,
    policeStation: "Medchal Police Station",
    district: "Medchal-Malkajgiri",
    location: {
      area: "Medchal-Malkajgiri",
      landmark: "Cyber Crime Jurisdiction Zone",
      pinCode: "501401",
      latitude: 17.6297,
      longitude: 78.4814,
      sector: "Sector 1 (Medchal Town & Highway)",
    },
    citizen: {
      name: "Registered Citizen",
      maskedMobile: "XXXXXX8902",
      email: "citizen@gmail.com",
      reportedLocation: "Medchal, Telangana",
      district: "Medchal-Malkajgiri",
      state: "Telangana",
    },
    assignedOfficer: {
      name: "Inspector V. Raghunath",
      badgeId: "SHO-01",
      designation: "Station House Officer",
      phone: "+91 94906 17001",
    },
    evidence: [],
    actionLogs: [
      {
        id: `LOG-INIT-${c.case_id}`,
        timestamp: `${dateStr}, ${timeStr}`,
        timeAgo: "Live",
        author: "FastAPI Backend Service",
        badgeId: "SYS-API",
        action: `Complaint record received (Status: ${c.status})`,
      },
    ],
    isGoldenHour: true,
  };
}

export const policeService = {
  subscribe(listener: StateListener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  /**
   * Sync with the live FastAPI backend (/cases)
   */
  async syncWithBackend(): Promise<void> {
    try {
      const liveCases = await api.listCases();
      let changed = false;

      // Add cases from backend that aren't already in complaintsState
      liveCases.forEach((bc) => {
        const exists = complaintsState.some(
          (c) =>
            c.id === bc.case_id ||
            c.liveCaseId === bc.case_id ||
            c.acknowledgementNumber.includes(bc.case_id)
        );
        if (!exists) {
          const converted = apiCaseToPoliceComplaint(bc);
          complaintsState.unshift(converted);
          changed = true;
        }
      });

      if (changed) {
        persistState();
        notifyListeners();
      }
    } catch {
      // Backend may be offline or starting up; preserve local state
    }
  },

  async getStationInfo(): Promise<PoliceStationInfo | null> {
    await new Promise((r) => setTimeout(r, 40));
    return stationState ? { ...stationState } : null;
  },

  async getDashboardStats(): Promise<PoliceDashboardStats> {
    await new Promise((r) => setTimeout(r, 50));
    const newCount = complaintsState.filter((c) => c.status === "New").length;
    const underInvestCount = complaintsState.filter(
      (c) => c.status === "Investigation in Progress" || c.status === "Assigned"
    ).length;
    const highPriorityCount = complaintsState.filter(
      (c) => c.priority === "HIGH"
    ).length;
    const resolvedCount = complaintsState.filter(
      (c) => c.status === "Resolved"
    ).length;
    const pendingInfoCount = complaintsState.filter(
      (c) => c.status === "Pending Information"
    ).length;

    return {
      totalComplaints: complaintsState.length,
      newToday: newCount,
      underInvestigation: underInvestCount,
      highPriority: highPriorityCount,
      resolved: resolvedCount,
      pendingInfo: pendingInfoCount,
      totalLossRecoveredOrFrozen: "₹0",
    };
  },

  async getComplaints(filters?: {
    search?: string;
    status?: string;
    crimeType?: string;
    priority?: string;
    station?: string;
    dateRange?: string;
  }): Promise<PoliceComplaint[]> {
    await new Promise((r) => setTimeout(r, 60));
    let list = [...complaintsState];

    if (!filters) return list;

    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.acknowledgementNumber.toLowerCase().includes(q) ||
          c.fraudType.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.location.area.toLowerCase().includes(q) ||
          c.citizen.name.toLowerCase().includes(q) ||
          c.transactionRef.toLowerCase().includes(q) ||
          c.bankOrWallet.toLowerCase().includes(q) ||
          (c.liveCaseId && c.liveCaseId.toLowerCase().includes(q))
      );
    }

    if (filters.status && filters.status !== "All") {
      list = list.filter(
        (c) => c.status.toLowerCase() === filters.status!.toLowerCase()
      );
    }

    if (filters.crimeType && filters.crimeType !== "All") {
      list = list.filter((c) =>
        c.fraudType.toLowerCase().includes(filters.crimeType!.toLowerCase())
      );
    }

    if (filters.priority && filters.priority !== "All") {
      list = list.filter(
        (c) => c.priority.toUpperCase() === filters.priority!.toUpperCase()
      );
    }

    if (filters.station && filters.station !== "All") {
      list = list.filter((c) =>
        c.policeStation.toLowerCase().includes(filters.station!.toLowerCase())
      );
    }

    return list;
  },

  /** Return the current queue so other staff workspaces see the same cases. */
  async getAllComplaints(): Promise<PoliceComplaint[]> {
    await new Promise((r) => setTimeout(r, 20));
    return [...complaintsState];
  },

  async getComplaintById(idOrAck: string): Promise<PoliceComplaint | null> {
    await new Promise((r) => setTimeout(r, 40));
    const found = complaintsState.find(
      (c) =>
        c.id === idOrAck ||
        c.liveCaseId === idOrAck ||
        c.acknowledgementNumber.toLowerCase() === idOrAck.toLowerCase()
    );
    return found ? { ...found } : null;
  },

  /**
   * Add a newly registered citizen complaint into the police jurisdiction
   */
  addComplaint(newComplaint: PoliceComplaint) {
    // Add to top of complaints state
    complaintsState = [
      newComplaint,
      ...complaintsState.filter((c) => c.id !== newComplaint.id),
    ];

    // Add high priority alert if applicable
    if (newComplaint.priority === "HIGH" || newComplaint.amount >= 50000) {
      const newAlert: PriorityAlert = {
        id: `ALERT-${Date.now()}`,
        complaintId: newComplaint.id,
        acknowledgementNumber: newComplaint.acknowledgementNumber,
        type: "Rapid Mule Movement Alert",
        severity: "CRITICAL",
        description: `High-value ${newComplaint.fraudType} (${newComplaint.formattedAmount}) reported in ${newComplaint.policeStation}. Immediate golden hour response recommended.`,
        timeAgo: "Just now",
        actionRequired: "Contact victim bank & initiate account freeze request",
      };
      alertsState = [newAlert, ...alertsState.slice(0, 9)];
    }

    // Add recent activity
    const newActivity: RecentActivity = {
      id: `ACT-${Date.now()}`,
      timestamp: newComplaint.reportedTime,
      timeAgo: "Just now",
      complaintId: newComplaint.id,
      acknowledgementNumber: newComplaint.acknowledgementNumber,
      description: `New complaint filed: ${newComplaint.fraudType} (${newComplaint.formattedAmount}) by ${newComplaint.citizen.name}`,
      type: "new_complaint",
      officerName: "Citizen Online Portal",
    };
    activitiesState = [newActivity, ...activitiesState.slice(0, 14)];

    persistState();
    notifyListeners();
  },

  async updateComplaintStatus(
    complaintId: string,
    newStatus: ComplaintStatus,
    officerNote?: string,
    officerName: string = "Inspector V. Raghunath",
    badgeId: string = "SHO-01"
  ): Promise<PoliceComplaint> {
    await new Promise((r) => setTimeout(r, 80));

    const index = complaintsState.findIndex(
      (c) => c.id === complaintId || c.acknowledgementNumber === complaintId
    );

    if (index === -1) {
      throw new Error("Complaint not found in jurisdiction database.");
    }

    const now = new Date();
    const timeString = now.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const fullDateString = `${now.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })}, ${timeString}`;

    const targetComplaint = complaintsState[index];
    if (!targetComplaint) {
      throw new Error(`Complaint ${complaintId} not found`);
    }

    const newLog: PoliceActionLog = {
      id: `LOG-${Date.now()}`,
      timestamp: fullDateString,
      timeAgo: "Just now",
      author: officerName,
      badgeId,
      action: `Status updated to '${newStatus}'`,
      statusChangedTo: newStatus,
      ...(officerNote?.trim() ? { note: officerNote.trim() } : {}),
    };

    const updatedComplaint: PoliceComplaint = {
      ...targetComplaint,
      status: newStatus,
      lastUpdated: fullDateString,
      actionLogs: [newLog, ...targetComplaint.actionLogs],
    };

    complaintsState[index] = updatedComplaint;

    // Add to recent activities
    const newActivity: RecentActivity = {
      id: `ACT-${Date.now()}`,
      timestamp: timeString,
      timeAgo: "Just now",
      complaintId: targetComplaint.id,
      acknowledgementNumber: targetComplaint.acknowledgementNumber,
      description: `Status changed to '${newStatus}' by ${officerName}`,
      type: "status_change",
      officerName,
    };

    activitiesState = [newActivity, ...activitiesState.slice(0, 14)];

    if (newStatus === "Resolved") {
      alertsState = alertsState.filter(
        (a) => a.complaintId !== targetComplaint.id
      );
    }

    persistState();
    notifyListeners();
    return updatedComplaint;
  },

  async getPriorityAlerts(): Promise<PriorityAlert[]> {
    await new Promise((r) => setTimeout(r, 40));
    return [...alertsState];
  },

  async getRecentActivities(): Promise<RecentActivity[]> {
    await new Promise((r) => setTimeout(r, 40));
    return [...activitiesState];
  },

  resetDemoData() {
    complaintsState = [];
    alertsState = [];
    activitiesState = [];
    stationState = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
    notifyListeners();
  },
};

// Initial sync with backend on load if in browser
if (typeof window !== "undefined") {
  setTimeout(() => {
    policeService.syncWithBackend();
  }, 100);
}
