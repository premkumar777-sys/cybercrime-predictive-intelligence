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

export const api = {
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
  listCases: () => request<ApiCase[]>("/cases"),
  getCase: (caseId: string) => request<ApiCase>(`/cases/${encodeURIComponent(caseId)}`),
  getPrediction: (caseId: string) => request<Prediction>(`/cases/${encodeURIComponent(caseId)}/predictions`),
  analyzeCase: (caseId: string) => request<Prediction>(`/cases/${encodeURIComponent(caseId)}/analyze`, { method: "POST" }),
  listLocations: () => request<Location[]>("/locations"),
  createCase: (payload: { fraud_type: string; amount: number; transaction_time: string; destination_account: string }) =>
    request<{ case_id: string; status: string }>("/cases", { method: "POST", body: JSON.stringify(payload) }),
  uploadEvidence: (caseId: string, formData: FormData) =>
    request<{ id: number; filename: string; uploaded_at: string }>(`/cases/${encodeURIComponent(caseId)}/evidence`, {
      method: "POST",
      body: formData,
    }),
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
