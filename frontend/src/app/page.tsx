"use client";

import { useEffect, useState } from "react";
import { getDashboard, getSocieties, DashboardStats, Society } from "@/lib/api";
import { getActiveSocietyId, setActiveSocietyId } from "@/lib/store";
import StatsCard from "@/components/StatsCard";
import {
  HiUsers,
  HiDocumentText,
  HiCurrencyRupee,
  HiShieldExclamation,
  HiCheckCircle,
  HiClock,
  HiExclamationTriangle,
} from "react-icons/hi2";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [society, setSociety] = useState<Society | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const res = await getSocieties();

      let societyId = getActiveSocietyId();
      if (!societyId && res.data.length > 0) {
        societyId = res.data[0].id;
        setActiveSocietyId(societyId);
      }

      if (societyId) {
        const activeSociety = res.data.find((s) => s.id === societyId) || res.data[0];
        setSociety(activeSociety);
        const dashRes = await getDashboard(activeSociety.id);
        setStats(dashRes.data);
      }
    } catch (err) {
      console.error("Failed to load dashboard:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!society) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold text-gray-700">Welcome to SocietySync</h2>
        <p className="text-gray-500 mt-2">Go to Settings to create your first society.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{society.name}</h1>
        <p className="text-gray-500 mt-1">{society.address} - {society.city}</p>
      </div>

      {stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <StatsCard
              title="Total Residents"
              value={stats.total_residents}
              subtitle={`${stats.active_residents} active`}
              icon={<HiUsers className="w-5 h-5" />}
              color="blue"
            />
            <StatsCard
              title="Invoices This Month"
              value={stats.total_invoices_this_month}
              subtitle={`${stats.paid_invoices} paid`}
              icon={<HiDocumentText className="w-5 h-5" />}
              color="emerald"
            />
            <StatsCard
              title="Collected"
              value={`Rs. ${stats.total_collected.toLocaleString()}`}
              subtitle={`Recovery: ${stats.recovery_rate}%`}
              icon={<HiCurrencyRupee className="w-5 h-5" />}
              color="emerald"
            />
            <StatsCard
              title="Defaulters"
              value={stats.defaulters}
              subtitle="Gate restricted"
              icon={<HiShieldExclamation className="w-5 h-5" />}
              color="red"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            <StatsCard
              title="Paid Invoices"
              value={stats.paid_invoices}
              icon={<HiCheckCircle className="w-5 h-5" />}
              color="emerald"
            />
            <StatsCard
              title="Pending Invoices"
              value={stats.pending_invoices}
              icon={<HiClock className="w-5 h-5" />}
              color="amber"
            />
            <StatsCard
              title="Overdue Invoices"
              value={stats.overdue_invoices}
              icon={<HiExclamationTriangle className="w-5 h-5" />}
              color="red"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recovery Overview</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Collection Progress</span>
                    <span className="font-medium text-gray-900">{stats.recovery_rate}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div
                      className="bg-emerald-500 h-3 rounded-full transition-all"
                      style={{ width: `${Math.min(stats.recovery_rate, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <p className="text-sm text-gray-500">Collected</p>
                    <p className="text-lg font-bold text-emerald-600">
                      Rs. {stats.total_collected.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Pending</p>
                    <p className="text-lg font-bold text-amber-600">
                      Rs. {stats.total_pending.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Society Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Monthly Fee</span>
                  <span className="font-medium">Rs. {society.monthly_fee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Late Fee</span>
                  <span className="font-medium">{society.late_fee_percentage}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Grace Period</span>
                  <span className="font-medium">{society.grace_period_days} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Bank</span>
                  <span className="font-medium">{society.bank_name || "Not set"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">EasyPaisa</span>
                  <span className="font-medium">{society.easypaisa_number || "Not set"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">JazzCash</span>
                  <span className="font-medium">{society.jazzcash_number || "Not set"}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
