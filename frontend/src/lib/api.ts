import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
});

export interface Society {
  id: string;
  name: string;
  address: string | null;
  city: string;
  total_houses: number;
  monthly_fee: number;
  late_fee_percentage: number;
  grace_period_days: number;
  bank_account_title: string | null;
  bank_account_number: string | null;
  bank_name: string | null;
  easypaisa_number: string | null;
  jazzcash_number: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface Resident {
  id: string;
  society_id: string;
  name: string;
  cnic: string | null;
  phone: string | null;
  email: string | null;
  whatsapp: string | null;
  house_number: string;
  block: string | null;
  house_type: string | null;
  is_owner: boolean;
  status: "active" | "inactive" | "defaulter" | "blocked";
  gate_entry_allowed: boolean;
  gate_qr_code: string | null;
  outstanding_balance: number;
  notification_preference: string;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  society_id: string;
  resident_id: string;
  invoice_number: string;
  billing_month: string;
  amount: number;
  late_fee: number;
  total_amount: number;
  paid_amount: number;
  status: "pending" | "paid" | "overdue" | "partially_paid" | "cancelled";
  due_date: string;
  payment_qr_data: string | null;
  issued_at: string;
  paid_at: string | null;
  notification_sent: boolean;
  reminder_count: number;
  created_at: string;
  resident?: Resident;
}

export interface Payment {
  id: string;
  invoice_id: string;
  resident_id: string;
  amount: number;
  payment_method: string;
  transaction_id: string | null;
  reference_number: string | null;
  is_auto_reconciled: boolean;
  bank_statement_line: string | null;
  paid_at: string;
  verified: boolean;
  verified_at: string | null;
  created_at: string;
}

export interface DashboardStats {
  total_residents: number;
  active_residents: number;
  defaulters: number;
  total_invoices_this_month: number;
  paid_invoices: number;
  pending_invoices: number;
  overdue_invoices: number;
  total_collected: number;
  total_pending: number;
  recovery_rate: number;
}

export interface GateLog {
  id: string;
  resident_id: string;
  direction: string | null;
  allowed: boolean;
  denied_reason: string | null;
  scanned_at: string;
}

// --- API Functions ---

// Societies
export const getSocieties = () => api.get<Society[]>("/api/societies/");
export const getSociety = (id: string) => api.get<Society>(`/api/societies/${id}`);
export const createSociety = (data: Partial<Society>) => api.post<Society>("/api/societies/", data);
export const updateSociety = (id: string, data: Partial<Society>) => api.put<Society>(`/api/societies/${id}`, data);

// Residents
export const getResidents = (societyId: string, params?: { status?: string; search?: string }) =>
  api.get<Resident[]>("/api/residents/", { params: { society_id: societyId, ...params } });
export const getResident = (id: string) => api.get<Resident>(`/api/residents/${id}`);
export const createResident = (data: Partial<Resident>) => api.post<Resident>("/api/residents/", data);
export const updateResident = (id: string, data: Partial<Resident>) => api.put<Resident>(`/api/residents/${id}`, data);
export const deleteResident = (id: string) => api.delete(`/api/residents/${id}`);
export const getDefaulters = (societyId: string) =>
  api.get<Resident[]>("/api/residents/defaulters/list", { params: { society_id: societyId } });

// Invoices
export const getInvoices = (societyId: string, params?: { billing_month?: string; status?: string; resident_id?: string }) =>
  api.get<Invoice[]>("/api/invoices/", { params: { society_id: societyId, ...params } });
export const getInvoice = (id: string) => api.get<Invoice>(`/api/invoices/${id}`);
export const generateBulkInvoices = (data: { society_id: string; billing_month: string; due_date: string }) =>
  api.post<Invoice[]>("/api/invoices/bulk", data);
export const checkOverdue = (societyId: string) =>
  api.post("/api/invoices/check-overdue", null, { params: { society_id: societyId } });
export const cancelInvoice = (id: string) => api.put(`/api/invoices/${id}/cancel`);

// Payments
export const getPayments = (params?: { society_id?: string; invoice_id?: string; resident_id?: string }) =>
  api.get<Payment[]>("/api/payments/", { params });
export const recordPayment = (data: { invoice_id: string; resident_id: string; amount: number; payment_method: string; transaction_id?: string; reference_number?: string }) =>
  api.post<Payment>("/api/payments/", data);
export const reconcileStatement = (societyId: string, file: File) => {
  const formData = new FormData();
  formData.append("society_id", societyId);
  formData.append("file", file);
  return api.post("/api/payments/reconcile", formData);
};

// Dashboard
export const getDashboard = (societyId: string) => api.get<DashboardStats>(`/api/dashboard/${societyId}`);

// Gate
export const verifyGateEntry = (residentId: string) =>
  api.post("/api/gate/verify", { resident_id: residentId });
export const getGateLogs = (societyId: string) =>
  api.get<GateLog[]>("/api/gate/logs", { params: { society_id: societyId } });

export default api;
