"use client";

import { useEffect, useState } from "react";
import { getDefaulters, getInvoices, updateResident, Resident, Invoice } from "@/lib/api";
import { getActiveSocietyId } from "@/lib/store";
import StatusBadge from "@/components/StatusBadge";
import { HiShieldExclamation, HiLockOpen, HiDocumentText } from "react-icons/hi2";

export default function DefaultersPage() {
  const [defaulters, setDefaulters] = useState<Resident[]>([]);
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const societyId = getActiveSocietyId();

  useEffect(() => {
    if (societyId) loadDefaulters();
  }, []);

  async function loadDefaulters() {
    if (!societyId) return;
    try {
      const res = await getDefaulters(societyId);
      setDefaulters(res.data);
    } catch (err) {
      console.error("Failed:", err);
    } finally {
      setLoading(false);
    }
  }

  async function viewInvoices(resident: Resident) {
    setSelectedResident(resident);
    try {
      const res = await getInvoices(societyId!, { resident_id: resident.id });
      setInvoices(res.data);
    } catch (err) {
      console.error("Failed:", err);
    }
  }

  async function unblockResident(id: string) {
    if (!confirm("Unblock this resident and allow gate entry?")) return;
    try {
      await updateResident(id, { status: "active" as never, gate_entry_allowed: true });
      loadDefaulters();
      setSelectedResident(null);
    } catch (err) {
      console.error("Failed:", err);
    }
  }

  if (!societyId) {
    return <p className="text-gray-500">Please select a society in Settings first.</p>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Defaulters</h1>
        <p className="text-gray-500 mt-1">
          Residents with overdue payments and restricted gate entry
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      ) : defaulters.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <HiShieldExclamation className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No defaulters. All residents are up to date!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            {defaulters.map((d) => (
              <div
                key={d.id}
                className={`bg-white rounded-xl border p-4 cursor-pointer transition ${
                  selectedResident?.id === d.id
                    ? "border-red-300 ring-2 ring-red-100"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => viewInvoices(d)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{d.name}</p>
                    <p className="text-sm text-gray-500">
                      {d.house_number} {d.block ? `- Block ${d.block}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-red-600">
                      Rs. {d.outstanding_balance.toLocaleString()}
                    </p>
                    <StatusBadge status={d.status} />
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                  <span>Phone: {d.phone}</span>
                  <span>Gate: {d.gate_entry_allowed ? "Allowed" : "Blocked"}</span>
                </div>
              </div>
            ))}
          </div>

          {selectedResident && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{selectedResident.name}</h3>
                <button
                  onClick={() => unblockResident(selectedResident.id)}
                  className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700"
                >
                  <HiLockOpen className="w-4 h-4" /> Unblock
                </button>
              </div>

              <div className="space-y-2 mb-6 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">House</span>
                  <span>{selectedResident.house_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Outstanding</span>
                  <span className="font-medium text-red-600">
                    Rs. {selectedResident.outstanding_balance.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Gate Entry</span>
                  <span className="text-red-600 font-medium">Blocked</span>
                </div>
              </div>

              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <HiDocumentText className="w-4 h-4" /> Invoice History
              </h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {invoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm"
                  >
                    <div>
                      <p className="font-mono text-xs text-gray-500">{inv.invoice_number}</p>
                      <p className="text-gray-700">{inv.billing_month}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">Rs. {inv.total_amount.toLocaleString()}</p>
                      <StatusBadge status={inv.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
