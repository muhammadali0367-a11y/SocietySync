"use client";

import { useEffect, useState } from "react";
import { getResidents, createResident, updateResident, deleteResident, Resident } from "@/lib/api";
import { getActiveSocietyId } from "@/lib/store";
import StatusBadge from "@/components/StatusBadge";
import { HiPlus, HiMagnifyingGlass, HiPencil, HiTrash, HiXMark } from "react-icons/hi2";

export default function ResidentsPage() {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingResident, setEditingResident] = useState<Resident | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    whatsapp: "",
    cnic: "",
    house_number: "",
    block: "",
    house_type: "10-marla",
    is_owner: true,
  });

  const societyId = getActiveSocietyId();

  useEffect(() => {
    if (societyId) loadResidents();
  }, [search, statusFilter]);

  async function loadResidents() {
    if (!societyId) return;
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await getResidents(societyId, params);
      setResidents(res.data);
    } catch (err) {
      console.error("Failed to load residents:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!societyId) return;

    try {
      if (editingResident) {
        await updateResident(editingResident.id, form);
      } else {
        await createResident({ ...form, society_id: societyId });
      }
      setShowForm(false);
      setEditingResident(null);
      resetForm();
      loadResidents();
    } catch (err) {
      console.error("Failed to save resident:", err);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this resident?")) return;
    try {
      await deleteResident(id);
      loadResidents();
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  }

  function startEdit(resident: Resident) {
    setEditingResident(resident);
    setForm({
      name: resident.name,
      phone: resident.phone || "",
      email: resident.email || "",
      whatsapp: resident.whatsapp || "",
      cnic: resident.cnic || "",
      house_number: resident.house_number,
      block: resident.block || "",
      house_type: resident.house_type || "10-marla",
      is_owner: resident.is_owner,
    });
    setShowForm(true);
  }

  function resetForm() {
    setForm({
      name: "", phone: "", email: "", whatsapp: "", cnic: "",
      house_number: "", block: "", house_type: "10-marla", is_owner: true,
    });
  }

  if (!societyId) {
    return <p className="text-gray-500">Please select a society in Settings first.</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Residents</h1>
        <button
          onClick={() => { resetForm(); setEditingResident(null); setShowForm(true); }}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition"
        >
          <HiPlus className="w-4 h-4" /> Add Resident
        </button>
      </div>

      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <HiMagnifyingGlass className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, house number, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="defaulter">Defaulter</option>
          <option value="inactive">Inactive</option>
          <option value="blocked">Blocked</option>
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
                <th className="text-left px-4 py-3 font-medium text-gray-600">House</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Phone</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Block</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Gate</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {residents.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{r.house_number}</td>
                  <td className="px-4 py-3">{r.name}</td>
                  <td className="px-4 py-3 text-gray-500">{r.phone}</td>
                  <td className="px-4 py-3">{r.block}</td>
                  <td className="px-4 py-3">{r.house_type}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium ${r.gate_entry_allowed ? "text-emerald-600" : "text-red-600"}`}>
                      {r.gate_entry_allowed ? "Allowed" : "Blocked"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(r)} className="text-gray-400 hover:text-emerald-600">
                        <HiPencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(r.id)} className="text-gray-400 hover:text-red-600">
                        <HiTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {residents.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                    No residents found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {editingResident ? "Edit Resident" : "Add Resident"}
              </h2>
              <button onClick={() => setShowForm(false)}>
                <HiXMark className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">House # *</label>
                  <input
                    required
                    value={form.house_number}
                    onChange={(e) => setForm({ ...form, house_number: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                  <input
                    value={form.whatsapp}
                    onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CNIC</label>
                  <input
                    value={form.cnic}
                    onChange={(e) => setForm({ ...form, cnic: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Block</label>
                  <input
                    value={form.block}
                    onChange={(e) => setForm({ ...form, block: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">House Type</label>
                  <select
                    value={form.house_type}
                    onChange={(e) => setForm({ ...form, house_type: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="5-marla">5 Marla</option>
                    <option value="7-marla">7 Marla</option>
                    <option value="10-marla">10 Marla</option>
                    <option value="1-kanal">1 Kanal</option>
                    <option value="2-kanal">2 Kanal</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.is_owner}
                  onChange={(e) => setForm({ ...form, is_owner: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <label className="text-sm text-gray-700">Is Owner</label>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition"
                >
                  {editingResident ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
