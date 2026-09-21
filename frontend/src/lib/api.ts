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
  explanation?: string[];
  features?: Record<string, number>;
};

export type Prediction = {
  case_id: string;
  risk_level: string;
  predictions: PredictionItem[];
  status?: string;
  reason?: string | null;
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

export type CitizenRegistrationPayload = Omit<CitizenProfile, "returning_citizen"> & {
  password: string;
};

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init?.headers as Record<string, string> ?? {}),
  };
  
  // Set default Content-Type if not sending FormData
  if (!(init?.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
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
  listCases: () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return request<ApiCase[]>("/cases", {
      ...(token && { headers: { "Authorization": `Bearer ${token}` } }),
    });
  },
  getCase: (caseId: string) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return request<ApiCase>(`/cases/${encodeURIComponent(caseId)}`, {
      ...(token && { headers: { "Authorization": `Bearer ${token}` } }),
    });
  },
  createCase: (payload: any) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return request<{ case_id: string; status: string }>("/cases", {
      method: "POST",
      body: JSON.stringify(payload),
      ...(token && { headers: { "Authorization": `Bearer ${token}` } }),
    });
  },
  analyzeCase: (caseId: string) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return request<Prediction>(`/cases/${encodeURIComponent(caseId)}/analyze`, {
      method: "POST",
      ...(token && { headers: { "Authorization": `Bearer ${token}` } }),
    });
  },
  getPrediction: (caseId: string) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return request<Prediction>(`/cases/${encodeURIComponent(caseId)}/predictions`, {
      ...(token && { headers: { "Authorization": `Bearer ${token}` } }),
    });
  },
  listLocations: () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return request<Location[]>("/locations", {
      ...(token && { headers: { "Authorization": `Bearer ${token}` } }),
    });
  },
  registerCitizen: (payload: CitizenRegistrationPayload) =>
    request<CitizenProfile>("/citizens/register", { method: "POST", body: JSON.stringify(payload) }),
  login: async (payload: { email: string; role: UserRole; password?: string }): Promise<AuthUser> => {
    const res = await request<{ access_token?: string; user?: AuthUser } | AuthUser>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: payload.email, password: payload.password ?? "password123", role: payload.role }),
    });
    if ("access_token" in res && res.access_token) {
      localStorage.setItem("token", res.access_token);
      return res.user!;
    }
    return res as AuthUser;
  },
  getAuditTrail: (caseId: string) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return request<AuditBlock[]>(`/cases/${encodeURIComponent(caseId)}/audit-trail`, {
      ...(token && { headers: { "Authorization": `Bearer ${token}` } }),
    });
  },
  verifyAuditTrail: (caseId: string) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return request<AuditVerification>(`/cases/${encodeURIComponent(caseId)}/verify-audit`, {
      method: "POST",
      ...(token && { headers: { "Authorization": `Bearer ${token}` } }),
    });
  },
  getEvidence: (caseId: string) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return request<any[]>(`/cases/${encodeURIComponent(caseId)}/evidence`, {
      ...(token && { headers: { "Authorization": `Bearer ${token}` } }),
    });
  },
  uploadEvidence: async (caseId: string, fileOrFormData: File | FormData) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const formData = fileOrFormData instanceof FormData ? fileOrFormData : (() => {
      const fd = new FormData();
      fd.append("file", fileOrFormData);
      return fd;
    })();
    
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
