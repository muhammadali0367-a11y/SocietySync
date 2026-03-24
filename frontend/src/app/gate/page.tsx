"use client";

import { useEffect, useState } from "react";
import { verifyGateEntry, getGateLogs, getResidents, GateLog, Resident } from "@/lib/api";
import { getActiveSocietyId } from "@/lib/store";
import { HiQrCode, HiCheckCircle, HiXCircle, HiMagnifyingGlass } from "react-icons/hi2";

export default function GatePage() {
  const [residentId, setResidentId] = useState("");
  const [verifyResult, setVerifyResult] = useState<{
    allowed: boolean;
    reason: string | null;
    resident: { name: string; house_number: string; block: string; status: string } | null;
  } | null>(null);
  const [logs, setLogs] = useState<GateLog[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(false);

  const societyId = getActiveSocietyId();

  useEffect(() => {
    if (societyId) {
      loadLogs();
      loadResidents();
    }
  }, []);

  async function loadLogs() {
    if (!societyId) return;
    try {
      const res = await getGateLogs(societyId);
      setLogs(res.data);
    } catch (err) {
      console.error("Failed:", err);
    }
  }

  async function loadResidents() {
    if (!societyId) return;
    try {
      const res = await getResidents(societyId);
      setResidents(res.data);
    } catch (err) {
      console.error("Failed:", err);
    }
  }

  async function handleVerify() {
    if (!residentId) return;
    setLoading(true);
    try {
      const res = await verifyGateEntry(residentId);
      setVerifyResult(res.data);
      loadLogs();
    } catch (err) {
      console.error("Failed:", err);
    } finally {
      setLoading(false);
    }
  }

  if (!societyId) {
    return <p className="text-gray-500">Please select a society in Settings first.</p>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gate Entry Scanner</h1>
        <p className="text-gray-500 mt-1">
          Verify resident entry by scanning QR code or selecting resident
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scanner / Verification */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <HiQrCode className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-semibold">Verify Entry</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Resident (or scan QR)
              </label>
              <div className="relative">
                <select
                  value={residentId}
                  onChange={(e) => setResidentId(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Select resident...</option>
                  {residents.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.house_number} - {r.name} ({r.status})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleVerify}
              disabled={!residentId || loading}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-3 rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 font-medium"
            >
              <HiMagnifyingGlass className="w-4 h-4" />
              {loading ? "Verifying..." : "Verify Entry"}
            </button>

            {verifyResult && (
              <div
                className={`rounded-xl p-6 text-center ${
                  verifyResult.allowed
                    ? "bg-emerald-50 border border-emerald-200"
                    : "bg-red-50 border border-red-200"
                }`}
              >
                {verifyResult.allowed ? (
                  <HiCheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-3" />
                ) : (
                  <HiXCircle className="w-16 h-16 text-red-500 mx-auto mb-3" />
                )}
                <p
                  className={`text-2xl font-bold ${
                    verifyResult.allowed ? "text-emerald-700" : "text-red-700"
                  }`}
                >
                  {verifyResult.allowed ? "ENTRY ALLOWED" : "ENTRY DENIED"}
                </p>
                {verifyResult.resident && (
                  <div className="mt-3 text-sm">
                    <p className="font-medium">{verifyResult.resident.name}</p>
                    <p className="text-gray-500">
                      House: {verifyResult.resident.house_number}
                      {verifyResult.resident.block ? `, Block ${verifyResult.resident.block}` : ""}
                    </p>
                  </div>
                )}
                {verifyResult.reason && (
                  <p className="mt-2 text-sm text-red-600 font-medium">{verifyResult.reason}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Recent Logs */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Gate Activity</h3>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-center text-gray-400 py-8">No gate activity yet</p>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className={`flex items-center justify-between p-3 rounded-lg text-sm ${
                    log.allowed ? "bg-emerald-50" : "bg-red-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {log.allowed ? (
                      <HiCheckCircle className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <HiXCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className="text-gray-700">{log.resident_id.slice(0, 8)}...</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {new Date(log.scanned_at).toLocaleString()}
                    </p>
                    {log.denied_reason && (
                      <p className="text-xs text-red-500">{log.denied_reason}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
