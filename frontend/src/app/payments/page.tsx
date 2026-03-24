"use client";

import { useEffect, useState, useRef } from "react";
import {
  getPayments, getInvoices, recordPayment, reconcileStatement,
  Payment, Invoice,
} from "@/lib/api";
import { getActiveSocietyId } from "@/lib/store";
import { HiPlus, HiArrowUpTray, HiCheckCircle, HiXMark } from "react-icons/hi2";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRecord, setShowRecord] = useState(false);
  const [showReconcile, setShowReconcile] = useState(false);
  const [reconcileResult, setReconcileResult] = useState<Record<string, unknown> | null>(null);
  const [pendingInvoices, setPendingInvoices] = useState<Invoice[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [payForm, setPayForm] = useState({
    invoice_id: "",
    resident_id: "",
    amount: 0,
    payment_method: "bank_transfer",
    transaction_id: "",
    reference_number: "",
  });

  const societyId = getActiveSocietyId();

  useEffect(() => {
    if (societyId) {
      loadPayments();
      loadPendingInvoices();
    }
  }, []);

  async function loadPayments() {
    if (!societyId) return;
    try {
      const res = await getPayments({ society_id: societyId });
      setPayments(res.data);
    } catch (err) {
      console.error("Failed to load payments:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadPendingInvoices() {
    if (!societyId) return;
    try {
      const res = await getInvoices(societyId, { status: "pending" });
      const overdue = await getInvoices(societyId, { status: "overdue" });
      setPendingInvoices([...res.data, ...overdue.data]);
    } catch (err) {
      console.error("Failed:", err);
    }
  }

  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault();
    try {
      await recordPayment(payForm);
      setShowRecord(false);
      loadPayments();
      loadPendingInvoices();
    } catch (err) {
      console.error("Failed:", err);
      alert("Failed to record payment");
    }
  }

  async function handleReconcile() {
    if (!societyId || !fileRef.current?.files?.[0]) return;
    try {
      const res = await reconcileStatement(societyId, fileRef.current.files[0]);
      setReconcileResult(res.data);
      loadPayments();
    } catch (err) {
      console.error("Failed:", err);
      alert("Failed to reconcile statement");
    }
  }

  function selectInvoice(invoiceId: string) {
    const inv = pendingInvoices.find((i) => i.id === invoiceId);
    if (inv) {
      setPayForm({
        ...payForm,
        invoice_id: inv.id,
        resident_id: inv.resident_id,
        amount: inv.total_amount - inv.paid_amount,
      });
    }
  }

  if (!societyId) {
    return <p className="text-gray-500">Please select a society in Settings first.</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setShowReconcile(true)}
            className="flex items-center gap-2 border border-blue-300 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-50 transition text-sm"
          >
            <HiArrowUpTray className="w-4 h-4" /> Reconcile Statement
          </button>
          <button
            onClick={() => setShowRecord(true)}
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition text-sm"
          >
            <HiPlus className="w-4 h-4" /> Record Payment
          </button>
        </div>
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
                <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Amount</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Method</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Transaction ID</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Reference</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Auto-Reconciled</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Verified</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(p.paid_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">Rs. {p.amount.toLocaleString()}</td>
                  <td className="px-4 py-3 capitalize">{p.payment_method.replace("_", " ")}</td>
                  <td className="px-4 py-3 font-mono text-xs">{p.transaction_id || "—"}</td>
                  <td className="px-4 py-3 text-xs">{p.reference_number || "—"}</td>
                  <td className="px-4 py-3">
                    {p.is_auto_reconciled ? (
                      <span className="text-blue-600 text-xs font-medium">Auto</span>
                    ) : (
                      <span className="text-gray-400 text-xs">Manual</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {p.verified ? (
                      <HiCheckCircle className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <span className="text-gray-400 text-xs">Pending</span>
                    )}
                  </td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    No payments recorded yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Record Payment Modal */}
      {showRecord && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Record Payment</h2>
              <button onClick={() => setShowRecord(false)}>
                <HiXMark className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Invoice</label>
                <select
                  required
                  value={payForm.invoice_id}
                  onChange={(e) => selectInvoice(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Select invoice...</option>
                  {pendingInvoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoice_number} - {inv.resident?.name || "Resident"} - Rs.{" "}
                      {(inv.total_amount - inv.paid_amount).toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (Rs.)</label>
                <input
                  required
                  type="number"
                  value={payForm.amount}
                  onChange={(e) => setPayForm({ ...payForm, amount: Number(e.target.value) })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select
                  value={payForm.payment_method}
                  onChange={(e) => setPayForm({ ...payForm, payment_method: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="easypaisa">EasyPaisa</option>
                  <option value="jazzcash">JazzCash</option>
                  <option value="1link">1Link</option>
                  <option value="cash">Cash</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID</label>
                <input
                  value={payForm.transaction_id}
                  onChange={(e) => setPayForm({ ...payForm, transaction_id: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowRecord(false)} className="px-4 py-2 text-sm text-gray-600">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition">
                  Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reconcile Modal */}
      {showReconcile && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Bank Statement Reconciliation</h2>
              <button onClick={() => { setShowReconcile(false); setReconcileResult(null); }}>
                <HiXMark className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {!reconcileResult ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-500">
                  Upload a CSV bank statement. The system will automatically match transactions
                  to pending invoices using invoice numbers, house numbers, and resident names.
                </p>
                <p className="text-xs text-gray-400">
                  Expected CSV format: Date, Description, Credit, Debit, Balance
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                />
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowReconcile(false)}
                    className="px-4 py-2 text-sm text-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReconcile}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
                  >
                    Upload & Reconcile
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold">{(reconcileResult as Record<string, number>).total_transactions}</p>
                    <p className="text-xs text-gray-500">Total</p>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-emerald-600">{(reconcileResult as Record<string, number>).matched}</p>
                    <p className="text-xs text-gray-500">Matched</p>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-amber-600">{(reconcileResult as Record<string, number>).unmatched}</p>
                    <p className="text-xs text-gray-500">Unmatched</p>
                  </div>
                </div>
                <p className="text-sm text-emerald-600 font-medium">
                  Rs. {((reconcileResult as Record<string, number>).total_amount_matched || 0).toLocaleString()} auto-reconciled
                </p>
                <button
                  onClick={() => { setShowReconcile(false); setReconcileResult(null); }}
                  className="w-full px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
