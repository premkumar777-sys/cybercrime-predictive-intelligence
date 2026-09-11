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
  explanation: string[];
};

export type Prediction = {
  case_id: string;
  risk_level: string;
  predictions: PredictionItem[];
};

export type Location = {
  location_id: string;
  name: string;
  latitude: number;
  longitude: number;
  location_type?: string;
};

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!response.ok) throw new Error((await response.text()) || `Request failed: ${response.status}`);
  return response.json() as Promise<T>;
}

export const api = {
  listCases: () => request<ApiCase[]>("/cases"),
  getCase: (caseId: string) => request<ApiCase>(`/cases/${encodeURIComponent(caseId)}`),
  getPrediction: (caseId: string) => request<Prediction>(`/cases/${encodeURIComponent(caseId)}/predictions`),
  analyzeCase: (caseId: string) => request<Prediction>(`/cases/${encodeURIComponent(caseId)}/analyze`, { method: "POST" }),
  listLocations: () => request<Location[]>("/locations"),
  createCase: (payload: { fraud_type: string; amount: number; transaction_time: string; destination_account: string }) =>
    request<{ case_id: string; status: string }>("/cases", { method: "POST", body: JSON.stringify(payload) }),
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
