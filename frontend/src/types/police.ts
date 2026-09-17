export type ComplaintStatus =
  | "New"
  | "Acknowledged"
  | "Assigned"
  | "Investigation in Progress"
  | "Pending Information"
  | "Forwarded"
  | "Resolved";

export type ComplaintPriority = "HIGH" | "MEDIUM" | "LOW";

export type EvidenceItem = {
  id: string;
  name: string;
  type: "receipt" | "screenshot" | "statement" | "chat" | "document";
  fileFormat: string;
  size: string;
  uploadedAt: string;
  description: string;
  previewUrl?: string;
  mockContent?: {
    title: string;
    details: Record<string, string>;
    rawText?: string;
  };
};

export type ActionLog = {
  id: string;
  timestamp: string;
  timeAgo: string;
  author: string;
  badgeId: string;
  action: string;
  statusChangedTo?: ComplaintStatus;
  note?: string;
};

export type CitizenSafeInfo = {
  name: string;
  maskedMobile: string;
  email: string;
  reportedLocation: string;
  district: string;
  state: string;
};

export type PoliceComplaintLocation = {
  area: string;
  landmark: string;
  pinCode: string;
  latitude: number;
  longitude: number;
  sector: string;
};

export type PoliceComplaint = {
  id: string;
  acknowledgementNumber: string;
  fraudType: string;
  fraudSubcategory?: string;
  incidentDate: string;
  incidentTime: string;
  reportedDate: string;
  reportedTime: string;
  lastUpdated: string;
  amount: number;
  formattedAmount: string;
  transactionRef: string;
  bankOrWallet: string;
  destinationAccount?: string;
  liveCaseId?: string;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  priorityReason?: string;
  description: string;
  policeStation: string;
  district: string;
  location: PoliceComplaintLocation;
  citizen: CitizenSafeInfo;
  assignedOfficer: {
    name: string;
    badgeId: string;
    designation: string;
    phone: string;
  };
  evidence: EvidenceItem[];
  actionLogs: ActionLog[];
  isGoldenHour: boolean;
};

export type PoliceStationInfo = {
  id: string;
  name: string;
  district: string;
  state: string;
  stationCode: string;
  inCharge: string;
  designation: string;
  contactNumber: string;
  controlRoomNumber: string;
  email: string;
  address: string;
  jurisdictionPincodes: string[];
  activeOfficerCount: number;
};

export type PriorityAlert = {
  id: string;
  complaintId: string;
  acknowledgementNumber: string;
  type: string;
  amount: string;
  timeAgo: string;
  reason: string;
  status: string;
  priority: "HIGH" | "URGENT";
  goldenHourActive?: boolean;
};

export type RecentActivity = {
  id: string;
  timestamp: string;
  timeAgo: string;
  complaintId: string;
  acknowledgementNumber: string;
  description: string;
  type: "status_change" | "assignment" | "new_complaint" | "evidence_added" | "note_added";
  officerName?: string;
};

export type PoliceDashboardStats = {
  totalComplaints: number;
  newToday: number;
  underInvestigation: number;
  highPriority: number;
  resolved: number;
  pendingInfo: number;
  totalLossRecoveredOrFrozen: string;
};
