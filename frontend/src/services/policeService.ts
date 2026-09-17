import type {
  PoliceComplaint,
  PoliceStationInfo,
  PriorityAlert,
  RecentActivity,
  PoliceDashboardStats,
  ComplaintStatus,
} from "@/types/police";
import {
  initialPoliceComplaints,
  initialStationInfo,
  initialPriorityAlerts,
  initialRecentActivities,
  initialStats,
} from "@/data/policeDemoData";

// In-memory frontend state store
let complaintsState: PoliceComplaint[] = [...initialPoliceComplaints];
let alertsState: PriorityAlert[] = [...initialPriorityAlerts];
let activitiesState: RecentActivity[] = [...initialRecentActivities];
let stationState: PoliceStationInfo = { ...initialStationInfo };

// Listeners for reactivity
type StateListener = () => void;
const listeners: Set<StateListener> = new Set();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

export const policeService = {
  subscribe(listener: StateListener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  async getStationInfo(): Promise<PoliceStationInfo> {
    await new Promise((r) => setTimeout(r, 60));
    return { ...stationState };
  },

  async getDashboardStats(): Promise<PoliceDashboardStats> {
    await new Promise((r) => setTimeout(r, 80));
    const newCount = complaintsState.filter((c) => c.status === "New").length;
    const underInvestCount = complaintsState.filter((c) => c.status === "Investigation in Progress" || c.status === "Assigned").length;
    const highPriorityCount = complaintsState.filter((c) => c.priority === "HIGH").length;
    const resolvedCount = complaintsState.filter((c) => c.status === "Resolved").length;
    const pendingInfoCount = complaintsState.filter((c) => c.status === "Pending Information").length;

    return {
      totalComplaints: initialStats.totalComplaints + (complaintsState.length - initialPoliceComplaints.length),
      newToday: Math.max(newCount, initialStats.newToday),
      underInvestigation: underInvestCount + 40,
      highPriority: highPriorityCount + 10,
      resolved: resolvedCount + 55,
      pendingInfo: pendingInfoCount,
      totalLossRecoveredOrFrozen: initialStats.totalLossRecoveredOrFrozen,
    };
  },

  async getComplaints(filters?: {
    search?: string;
    status?: string;
    crimeType?: string;
    priority?: string;
    dateRange?: string;
  }): Promise<PoliceComplaint[]> {
    await new Promise((r) => setTimeout(r, 100));
    let list = [...complaintsState];

    if (!filters) return list;

    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      list = list.filter((c) =>
        c.acknowledgementNumber.toLowerCase().includes(q) ||
        c.fraudType.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.location.area.toLowerCase().includes(q) ||
        c.citizen.name.toLowerCase().includes(q) ||
        c.transactionRef.toLowerCase().includes(q) ||
        c.bankOrWallet.toLowerCase().includes(q)
      );
    }

    if (filters.status && filters.status !== "All") {
      list = list.filter((c) => c.status.toLowerCase() === filters.status!.toLowerCase());
    }

    if (filters.crimeType && filters.crimeType !== "All") {
      list = list.filter((c) => c.fraudType.toLowerCase().includes(filters.crimeType!.toLowerCase()));
    }

    if (filters.priority && filters.priority !== "All") {
      list = list.filter((c) => c.priority.toUpperCase() === filters.priority!.toUpperCase());
    }

    return list;
  },

  async getComplaintById(idOrAck: string): Promise<PoliceComplaint | null> {
    await new Promise((r) => setTimeout(r, 60));
    const found = complaintsState.find(
      (c) => c.id === idOrAck || c.acknowledgementNumber.toLowerCase() === idOrAck.toLowerCase()
    );
    return found ? { ...found } : null;
  },

  async updateComplaintStatus(
    complaintId: string,
    newStatus: ComplaintStatus,
    officerNote?: string,
    officerName: string = "Inspector V. Raghunath",
    badgeId: string = "SHO-01"
  ): Promise<PoliceComplaint> {
    await new Promise((r) => setTimeout(r, 120));

    const index = complaintsState.findIndex(
      (c) => c.id === complaintId || c.acknowledgementNumber === complaintId
    );

    if (index === -1) {
      throw new Error("Complaint not found in jurisdiction database.");
    }

    const now = new Date();
    const timeString = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    const fullDateString = `${now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}, ${timeString}`;

    const newLog = {
      id: `LOG-${Date.now()}`,
      timestamp: fullDateString,
      timeAgo: "Just now",
      author: officerName,
      badgeId,
      action: `Status updated to '${newStatus}'`,
      statusChangedTo: newStatus,
      note: officerNote?.trim() || undefined,
    };

    const targetComplaint = complaintsState[index];
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

    // If status became resolved, update any matching priority alerts
    if (newStatus === "Resolved") {
      alertsState = alertsState.filter((a) => a.complaintId !== targetComplaint.id);
    }

    notifyListeners();
    return updatedComplaint;
  },

  async getPriorityAlerts(): Promise<PriorityAlert[]> {
    await new Promise((r) => setTimeout(r, 60));
    return [...alertsState];
  },

  async getRecentActivities(): Promise<RecentActivity[]> {
    await new Promise((r) => setTimeout(r, 60));
    return [...activitiesState];
  },

  resetDemoData() {
    complaintsState = [...initialPoliceComplaints];
    alertsState = [...initialPriorityAlerts];
    activitiesState = [...initialRecentActivities];
    stationState = { ...initialStationInfo };
    notifyListeners();
  },
};
