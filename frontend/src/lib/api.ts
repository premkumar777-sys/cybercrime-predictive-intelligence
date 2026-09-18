export type ApiCase = {
  case_id: string;
  fraud_type: string;
  amount: number;
  transaction_time: string;
  destination_account: string;
  status: string;
  created_at: string;
};

export type PredictionItem = {
  location_id: string;
  location_name: string;
  risk_score: number;
  rank: number;
  time_window: string;
  features: Record<string, number>;
};

export interface Prediction {
  case_id: string;
  risk_level: string;
  predictions: PredictionItem[];
  status?: string;
  reason?: string;
  transaction_path?: string[];
  graph?: {
    nodes: { id: string; group: string }[];
    links: { source: string; target: string }[];
  };
};

export type Location = {
  location_id: string;
  name: string;
  latitude: number;
  longitude: number;
  location_type?: string;
};

export type UserRole = "citizen" | "police" | "investigator";

export type AuthUser = {
  email: string;
  name: string;
  role: UserRole;
};

export type CitizenProfile = {
  full_name: string;
  phone: string;
  email: string;
  identity_type: string;
  identity_number: string;
  returning_citizen: boolean;
};

const API_URL = import.meta.env["VITE_API_URL"] ?? "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!response.ok) throw new Error((await response.text()) || `Request failed: ${response.status}`);
  return response.json() as Promise<T>;
}

export type AuditBlock = {
  id: number;
  case_id: string;
  block_index: number;
  event_type: string;
  timestamp: string | null;
  actor: string;
  payload_hash: string;
  previous_hash: string;
  block_hash: string;
  event_data: Record<string, any>;
};

export type BlockVerificationDetail = {
  block_index: number;
  event_type: string;
  timestamp: string;
  actor: string;
  block_hash: string;
  previous_hash: string;
  payload_hash: string;
  status: "VALID" | "TAMPERED";
  errors: string[];
};

export type AuditVerification = {
  case_id: string;
  is_valid: boolean;
  tamper_detected: boolean;
  chain_length: number;
  merkle_root: string | null;
  tamper_status: string;
  compliance_note: string;
  verified_at: string;
  blocks: BlockVerificationDetail[];
};

export const api = {
  registerCitizen: (payload: Omit<CitizenProfile, "returning_citizen"> & { password?: string }) =>
    request<CitizenProfile>("/citizens/register", { method: "POST", body: JSON.stringify(payload) }),
  login: (payload: { email: string; password?: string; role?: UserRole }) =>
    request<{ access_token: string; user: AuthUser }>("/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  listCases: () => {
    const token = localStorage.getItem("token");
    return request<ApiCase[]>("/cases", { ...(token && { headers: { "Authorization": `Bearer ${token}` } }) });
  },
  getCase: (caseId: string) => {
    const token = localStorage.getItem("token");
    return request<ApiCase>(`/cases/${encodeURIComponent(caseId)}`, { ...(token && { headers: { "Authorization": `Bearer ${token}` } }) });
  },
  getPrediction: (caseId: string) => {
    const token = localStorage.getItem("token");
    return request<Prediction>(`/cases/${encodeURIComponent(caseId)}/predictions`, { ...(token && { headers: { "Authorization": `Bearer ${token}` } }) });
  },
  analyzeCase: (caseId: string) => {
    const token = localStorage.getItem("token");
    return request<Prediction>(`/cases/${encodeURIComponent(caseId)}/analyze`, { method: "POST", ...(token && { headers: { "Authorization": `Bearer ${token}` } }) });
  },
  listLocations: () => request<Location[]>("/locations"),
  createCase: (payload: { fraud_type: string; amount: number; transaction_time: string; destination_account: string }) => {
    const token = localStorage.getItem("token");
    return request<{ case_id: string; status: string }>("/cases", {
      method: "POST",
      ...(token && { headers: { "Authorization": `Bearer ${token}` } }),
      body: JSON.stringify(payload),
    });
  },
  getAuditTrail: (caseId: string) => {
    const token = localStorage.getItem("token");
    return request<AuditBlock[]>(`/cases/${encodeURIComponent(caseId)}/audit-trail`, {
      ...(token && { headers: { "Authorization": `Bearer ${token}` } }),
    });
  },
  verifyAuditTrail: (caseId: string) => {
    const token = localStorage.getItem("token");
    return request<AuditVerification>(`/cases/${encodeURIComponent(caseId)}/verify-audit`, {
      method: "POST",
      ...(token && { headers: { "Authorization": `Bearer ${token}` } }),
    });
  },
  getEvidence: (caseId: string) => {
    const token = localStorage.getItem("token");
    return request<any[]>(`/cases/${encodeURIComponent(caseId)}/evidence`, {
      ...(token && { headers: { "Authorization": `Bearer ${token}` } }),
    });
  },
  uploadEvidence: async (caseId: string, file: File) => {
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("file", file);
    
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    
    const response = await fetch(`${API_URL}/cases/${encodeURIComponent(caseId)}/evidence`, {
      method: "POST",
      headers,
      body: formData,
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || "Upload failed");
    }
    return response.json();
  },
  downloadEvidence: (caseId: string, evidenceId: string) => {
    const token = localStorage.getItem("token");
    return request<any>(`/cases/${encodeURIComponent(caseId)}/evidence/${encodeURIComponent(evidenceId)}/download`, {
      ...(token && { headers: { "Authorization": `Bearer ${token}` } }),
    });
  },
};

export function formatCase(apiCase: ApiCase) {
  const risk = apiCase.status === "ANALYZED" ? "HIGH" : "MEDIUM";
  return {
    id: apiCase.case_id,
    type: apiCase.fraud_type.replaceAll("_", " "),
    amount: `₹${apiCase.amount.toLocaleString("en-IN")}`,
    district: "Telangana",
    risk,
    time: new Date(apiCase.created_at).toLocaleString(),
  };
}

export function scorePercent(score: number) {
  return `${Math.round((score <= 1 ? score * 100 : score) * 10) / 10}%`;
}
