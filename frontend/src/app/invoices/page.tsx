"use client";

import { useEffect, useState } from "react";
import {
  getInvoices, generateBulkInvoices, checkOverdue, cancelInvoice, Invoice,
} from "@/lib/api";
import { getActiveSocietyId } from "@/lib/store";
import StatusBadge from "@/components/StatusBadge";
import { HiDocumentPlus, HiExclamationTriangle, HiXMark, HiQrCode } from "react-icons/hi2";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthFilter, setMonthFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showGenerate, setShowGenerate] = useState(false);
  const [showQr, setShowQr] = useState<string | null>(null);
  const [genForm, setGenForm] = useState({ billing_month: "", due_date: "" });
  const [generating, setGenerating] = useState(false);

  const societyId = getActiveSocietyId();

  useEffect(() => {
    if (societyId) loadInvoices();
  }, [monthFilter, statusFilter]);

  async function loadInvoices() {
    if (!societyId) return;
    try {
      const params: Record<string, string> = {};
      if (monthFilter) params.billing_month = monthFilter;
      if (statusFilter) params.status = statusFilter;
      const res = await getInvoices(societyId, params);
      setInvoices(res.data);
    } catch (err) {
      console.error("Failed to load invoices:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateBulk(e: React.FormEvent) {
    e.preventDefault();
    if (!societyId) return;
    setGenerating(true);
    try {
      const res = await generateBulkInvoices({
        society_id: societyId,
        billing_month: genForm.billing_month,
        due_date: genForm.due_date,
      });
      alert(`Generated ${res.data.length} invoices!`);
      setShowGenerate(false);
      loadInvoices();
    } catch (err) {
      console.error("Failed to generate:", err);
      alert("Failed to generate invoices");
    } finally {
      setGenerating(false);
    }
  }

  async function handleCheckOverdue() {
    if (!societyId) return;
    try {
      const res = await checkOverdue(societyId);
      alert(
        `Overdue: ${res.data.overdue_count}\nNew Defaulters: ${res.data.new_defaulters}`
      );
      loadInvoices();
    } catch (err) {
      console.error("Failed:", err);
    }
  }

  async function handleCancel(id: string) {
    if (!confirm("Cancel this invoice?")) return;
    try {
      await cancelInvoice(id);
      loadInvoices();
    } catch (err) {
      console.error("Failed:", err);
    }
  }

  if (!societyId) {
    return <p className="text-gray-500">Please select a society in Settings first.</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
        <div className="flex gap-3">
          <button
            onClick={handleCheckOverdue}
            className="flex items-center gap-2 border border-amber-300 text-amber-700 px-4 py-2 rounded-lg hover:bg-amber-50 transition text-sm"
          >
            <HiExclamationTriangle className="w-4 h-4" /> Check Overdue
          </button>
          <button
            onClick={() => setShowGenerate(true)}
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition text-sm"
          >
            <HiDocumentPlus className="w-4 h-4" /> Generate Invoices
          </button>
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <input
          type="month"
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          placeholder="Filter by month"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
          <option value="partially_paid">Partially Paid</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Invoice #</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Resident</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Month</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Amount</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Late Fee</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Total</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Paid</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Due Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{inv.invoice_number}</td>
                  <td className="px-4 py-3">
                    {inv.resident?.name || "—"}
                    <span className="text-gray-400 text-xs ml-1">
                      {inv.resident?.house_number}
                    </span>
                  </td>
                  <td className="px-4 py-3">{inv.billing_month}</td>
                  <td className="px-4 py-3 text-right">Rs. {inv.amount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-red-500">
                    {inv.late_fee > 0 ? `Rs. ${inv.late_fee.toLocaleString()}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    Rs. {inv.total_amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-emerald-600">
                    Rs. {inv.paid_amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{inv.due_date}</td>
                  <td className="px-4 py-3"><StatusBadge status={inv.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {inv.payment_qr_data && (
                        <button
                          onClick={() => setShowQr(inv.payment_qr_data)}
                          className="text-gray-400 hover:text-emerald-600"
                          title="View QR Code"
                        >
                          <HiQrCode className="w-4 h-4" />
                        </button>
                      )}
                      {inv.status !== "paid" && inv.status !== "cancelled" && (
                        <button
                          onClick={() => handleCancel(inv.id)}
                          className="text-gray-400 hover:text-red-600"
                          title="Cancel"
                        >
                          <HiXMark className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-gray-400">
                    No invoices found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Generate Invoices Modal */}
      {showGenerate && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-semibold mb-4">Generate Monthly Invoices</h2>
            <p className="text-sm text-gray-500 mb-4">
              This will create invoices for all active residents who don&apos;t already have one for the selected month.
            </p>
            <form onSubmit={handleGenerateBulk} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Billing Month</label>
                <input
                  required
                  type="month"
                  value={genForm.billing_month}
                  onChange={(e) => setGenForm({ ...genForm, billing_month: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  required
                  type="date"
                  value={genForm.due_date}
                  onChange={(e) => setGenForm({ ...genForm, due_date: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowGenerate(false)} className="px-4 py-2 text-sm text-gray-600">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  {generating ? "Generating..." : "Generate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQr && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowQr(null)}>
          <div className="bg-white rounded-xl p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Payment QR Code</h3>
            <img src={`data:image/png;base64,${showQr}`} alt="Payment QR" className="mx-auto w-64 h-64" />
            <p className="text-sm text-gray-500 mt-3">Scan with EasyPaisa/JazzCash/Bank app</p>
            <button onClick={() => setShowQr(null)} className="mt-4 px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
