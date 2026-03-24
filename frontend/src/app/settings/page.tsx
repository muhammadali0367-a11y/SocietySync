"use client";

import { useEffect, useState } from "react";
import { getSocieties, createSociety, updateSociety, Society } from "@/lib/api";
import { getActiveSocietyId, setActiveSocietyId } from "@/lib/store";

export default function SettingsPage() {
  const [societies, setSocieties] = useState<Society[]>([]);
  const [activeSocietyId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    address: "",
    city: "Lahore",
    total_houses: 0,
    monthly_fee: 3000,
    late_fee_percentage: 10,
    grace_period_days: 7,
    bank_account_title: "",
    bank_account_number: "",
    bank_name: "",
    easypaisa_number: "",
    jazzcash_number: "",
    contact_email: "",
    contact_phone: "",
  });

  useEffect(() => {
    loadSocieties();
  }, []);

  async function loadSocieties() {
    try {
      const res = await getSocieties();
      setSocieties(res.data);
      const activeId = getActiveSocietyId();
      if (activeId) {
        setActiveId(activeId);
        const active = res.data.find((s) => s.id === activeId);
        if (active) populateForm(active);
      } else if (res.data.length > 0) {
        selectSociety(res.data[0]);
      }
    } catch (err) {
      console.error("Failed:", err);
    } finally {
      setLoading(false);
    }
  }

  function populateForm(s: Society) {
    setForm({
      name: s.name,
      address: s.address || "",
      city: s.city,
      total_houses: s.total_houses,
      monthly_fee: s.monthly_fee,
      late_fee_percentage: s.late_fee_percentage,
      grace_period_days: s.grace_period_days,
      bank_account_title: s.bank_account_title || "",
      bank_account_number: s.bank_account_number || "",
      bank_name: s.bank_name || "",
      easypaisa_number: s.easypaisa_number || "",
      jazzcash_number: s.jazzcash_number || "",
      contact_email: s.contact_email || "",
      contact_phone: s.contact_phone || "",
    });
  }

  function selectSociety(s: Society) {
    setActiveId(s.id);
    setActiveSocietyId(s.id);
    populateForm(s);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (activeSocietyId) {
        await updateSociety(activeSocietyId, form);
      } else {
        const res = await createSociety(form);
        setActiveSocietyId(res.data.id);
        setActiveId(res.data.id);
      }
      loadSocieties();
      alert("Settings saved!");
    } catch (err) {
      console.error("Failed:", err);
      alert("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateNew() {
    setActiveId(null);
    setForm({
      name: "", address: "", city: "Lahore", total_houses: 0, monthly_fee: 3000,
      late_fee_percentage: 10, grace_period_days: 7, bank_account_title: "",
      bank_account_number: "", bank_name: "", easypaisa_number: "",
      jazzcash_number: "", contact_email: "", contact_phone: "",
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <button
          onClick={handleCreateNew}
          className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
        >
          + New Society
        </button>
      </div>

      {societies.length > 1 && (
        <div className="flex gap-2 mb-6">
          {societies.map((s) => (
            <button
              key={s.id}
              onClick={() => selectSociety(s)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeSocietyId === s.id
                  ? "bg-emerald-600 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Society Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Society Name *</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Houses</label>
              <input
                type="number"
                value={form.total_houses}
                onChange={(e) => setForm({ ...form, total_houses: Number(e.target.value) })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
              <input
                value={form.contact_email}
                onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
              <input
                value={form.contact_phone}
                onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Billing Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Fee (Rs.)</label>
              <input
                type="number"
                value={form.monthly_fee}
                onChange={(e) => setForm({ ...form, monthly_fee: Number(e.target.value) })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Late Fee (%)</label>
              <input
                type="number"
                value={form.late_fee_percentage}
                onChange={(e) => setForm({ ...form, late_fee_percentage: Number(e.target.value) })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grace Period (days)</label>
              <input
                type="number"
                value={form.grace_period_days}
                onChange={(e) => setForm({ ...form, grace_period_days: Number(e.target.value) })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Payment Accounts</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
              <input
                value={form.bank_name}
                onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account Title</label>
              <input
                value={form.bank_account_title}
                onChange={(e) => setForm({ ...form, bank_account_title: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
              <input
                value={form.bank_account_number}
                onChange={(e) => setForm({ ...form, bank_account_number: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">EasyPaisa Number</label>
              <input
                value={form.easypaisa_number}
                onChange={(e) => setForm({ ...form, easypaisa_number: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">JazzCash Number</label>
              <input
                value={form.jazzcash_number}
                onChange={(e) => setForm({ ...form, jazzcash_number: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium disabled:opacity-50"
          >
            {saving ? "Saving..." : activeSocietyId ? "Update Settings" : "Create Society"}
          </button>
        </div>
      </form>
    </div>
  );
}
