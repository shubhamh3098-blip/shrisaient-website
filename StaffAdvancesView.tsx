import React, { useState } from 'react';
import {
  UserCheck,
  Plus,
  DollarSign,
  Phone,
  Calendar,
  Briefcase,
  CheckCircle,
  Clock,
  X,
  Edit3,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { AgentAdvance, Staff, StoreData } from '../../types';
import { StorageService } from '../../services/storageService';

interface StaffAdvancesViewProps {
  storeData: StoreData;
  onRefreshData: () => void;
}

export const StaffAdvancesView: React.FC<StaffAdvancesViewProps> = ({
  storeData,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<'staff' | 'advances'>('staff');
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [isAddAdvanceModalOpen, setIsAddAdvanceModalOpen] = useState(false);

  // Edit Staff State
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [editStaffName, setEditStaffName] = useState('');
  const [editStaffRole, setEditStaffRole] = useState<Staff['role']>('Sales Executive');
  const [editStaffPhone, setEditStaffPhone] = useState('');
  const [editStaffSalary, setEditStaffSalary] = useState<number>(18000);
  const [editStaffActive, setEditStaffActive] = useState<boolean>(true);
  const [editStaffError, setEditStaffError] = useState<string>('');
  const [editStaffSuccess, setEditStaffSuccess] = useState<string>('');

  // Add Staff Form
  const [staffName, setStaffName] = useState('');
  const [staffRole, setStaffRole] = useState<Staff['role']>('Sales Executive');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffSalary, setStaffSalary] = useState<number>(18000);

  // Add Advance Form
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [advanceAmount, setAdvanceAmount] = useState<number>(2000);
  const [advanceReason, setAdvanceReason] = useState<string>('Personal emergency');
  const [advanceDeductionMonth, setAdvanceDeductionMonth] = useState<string>('Sep 2026');

  const openEditStaff = (staff: Staff) => {
    setEditingStaff(staff);
    setEditStaffName(staff.name);
    setEditStaffRole(staff.role);
    setEditStaffPhone(staff.phone || '');
    setEditStaffSalary(staff.monthlySalary);
    setEditStaffActive(staff.isActive !== false);
    setEditStaffError('');
    setEditStaffSuccess('');
  };

  const handleUpdateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    if (!editStaffName.trim() || !editStaffPhone.trim()) {
      setEditStaffError('नाव व मोबाईल नंबर भरणे आवश्यक आहे.');
      return;
    }

    const cleanPhone = editStaffPhone.trim();
    if (cleanPhone.replace(/\D/g, '').length < 10) {
      setEditStaffError('कृपया १०-अंकी वैध मोबाईल नंबर टाका.');
      return;
    }

    const result = StorageService.updateStaff(editingStaff.id, {
      name: editStaffName.trim(),
      role: editStaffRole,
      phone: cleanPhone,
      monthlySalary: Number(editStaffSalary),
      isActive: editStaffActive,
    });

    if (!result.success) {
      setEditStaffError(result.error || 'Failed to update staff member.');
      return;
    }

    setEditStaffSuccess('कर्मचाऱ्याचा मोबाईल नंबर व माहिती यशस्वीरित्या अपडेट झाली!');
    setTimeout(() => {
      onRefreshData();
      setEditingStaff(null);
    }, 500);
  };

  const handleDeleteStaff = (staff: Staff) => {
    if (confirm(`तुम्हाला खात्री आहे का? "${staff.name}" यांचे रेकॉर्ड काढून टाकायचे आहे?`)) {
      StorageService.deleteStaff(staff.id);
      onRefreshData();
      if (editingStaff?.id === staff.id) setEditingStaff(null);
    }
  };

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName.trim() || !staffPhone.trim()) {
      alert('Please fill staff Name and Phone.');
      return;
    }

    StorageService.addStaff({
      name: staffName.trim(),
      role: staffRole,
      phone: staffPhone.trim(),
      monthlySalary: Number(staffSalary),
      joiningDate: new Date().toISOString().slice(0, 10),
      isActive: true,
    });

    onRefreshData();
    setIsAddStaffModalOpen(false);
  };

  const handleAddAdvance = (e: React.FormEvent) => {
    e.preventDefault();
    const stf = storeData.staff.find((s) => s.id === selectedStaffId);
    if (!stf || advanceAmount <= 0) {
      alert('Please select a staff member and specify advance amount.');
      return;
    }

    StorageService.addAgentAdvance({
      staffId: stf.id,
      staffName: stf.name,
      date: new Date().toISOString(),
      amount: Number(advanceAmount),
      reason: advanceReason.trim(),
      deductionMonth: advanceDeductionMonth.trim(),
      status: 'Pending',
    });

    onRefreshData();
    setIsAddAdvanceModalOpen(false);
  };

  const totalMonthlyPayroll = storeData.staff.reduce((a, s) => a + s.monthlySalary, 0);
  const pendingAdvancesTotal = storeData.agentAdvances
    .filter((a) => a.status === 'Pending')
    .reduce((a, ad) => a + ad.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Staff & Agent Advances</h2>
            <p className="text-xs text-slate-400">
              Manage showroom sales team, cashier, drivers & salary advance deductions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('staff')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
                activeTab === 'staff'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Employees ({storeData.staff.length})
            </button>
            <button
              onClick={() => setActiveTab('advances')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
                activeTab === 'advances'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Advances ({storeData.agentAdvances.length})
            </button>
          </div>

          <button
            onClick={() => {
              if (storeData.staff.length > 0) setSelectedStaffId(storeData.staff[0].id);
              setIsAddAdvanceModalOpen(true);
            }}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-2 rounded-lg text-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Disburse Advance</span>
          </button>
          <button
            onClick={() => {
              setStaffName('');
              setStaffPhone('');
              setIsAddStaffModalOpen(true);
            }}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-2 rounded-lg text-xs transition cursor-pointer shadow-md shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add Staff</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
          <span className="text-slate-400 text-[10px] uppercase font-bold">Total Showroom Staff</span>
          <p className="text-lg font-bold text-white mt-0.5">{storeData.staff.length} Active Members</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
          <span className="text-slate-400 text-[10px] uppercase font-bold">Monthly Payroll Liability</span>
          <p className="text-lg font-bold text-sky-400 mt-0.5">₹{totalMonthlyPayroll.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
          <span className="text-slate-400 text-[10px] uppercase font-bold">Pending Salary Advances</span>
          <p className="text-lg font-bold text-amber-400 mt-0.5">₹{pendingAdvancesTotal.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {activeTab === 'staff' ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-3">Name</th>
                  <th className="py-3 px-3">Designation / Role</th>
                  <th className="py-3 px-3">Contact Number</th>
                  <th className="py-3 px-3">Monthly Salary</th>
                  <th className="py-3 px-3">Joining Date</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Action (क्रिया)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {storeData.staff.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3 font-semibold text-white">{s.name}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 border border-slate-700 text-slate-200">
                        {s.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-300 font-mono">{s.phone}</td>
                    <td className="py-3 px-3 font-bold text-amber-400">
                      ₹{s.monthlySalary.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-slate-400">{s.joiningDate}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        s.isActive !== false ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {s.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditStaff(s)}
                          className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                          title="Edit Staff / Mobile Number"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>बदला (Edit)</span>
                        </button>
                        <button
                          onClick={() => handleDeleteStaff(s)}
                          className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                          title="Delete Staff"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-3">Staff / Agent</th>
                  <th className="py-3 px-3">Advance Date</th>
                  <th className="py-3 px-3">Advance Amount</th>
                  <th className="py-3 px-3">Reason</th>
                  <th className="py-3 px-3">Deduction Cycle</th>
                  <th className="py-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {storeData.agentAdvances.map((adv) => (
                  <tr key={adv.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3 font-semibold text-white">{adv.staffName}</td>
                    <td className="py-3 px-3 text-slate-400">
                      {new Date(adv.date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-3 px-3 font-extrabold text-amber-400">
                      ₹{adv.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-slate-300">{adv.reason}</td>
                    <td className="py-3 px-3 text-slate-400">{adv.deductionMonth}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          adv.status === 'Pending'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {adv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {isAddStaffModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Enroll Staff Member</h3>
              <button
                onClick={() => setIsAddStaffModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="p-5 space-y-4 text-xs">
              <div>
                <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Anand K. Shinde"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1">
                    Designation *
                  </label>
                  <select
                    value={staffRole}
                    onChange={(e) => setStaffRole(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Sales Executive">Sales Executive</option>
                    <option value="Floor Manager">Floor Manager</option>
                    <option value="Cashier">Cashier</option>
                    <option value="Delivery Driver">Delivery Driver</option>
                    <option value="Accountant">Accountant</option>
                    <option value="Agent">Agent</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1">
                    Monthly Salary (₹)
                  </label>
                  <input
                    type="number"
                    value={staffSalary}
                    onChange={(e) => setStaffSalary(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1">
                  Mobile Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="+91..."
                  value={staffPhone}
                  onChange={(e) => setStaffPhone(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddStaffModalOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg shadow-md shadow-amber-500/20"
                >
                  Save Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Disburse Advance Modal */}
      {isAddAdvanceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Disburse Salary Advance</h3>
              <button
                onClick={() => setIsAddAdvanceModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddAdvance} className="p-5 space-y-4 text-xs">
              <div>
                <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1">
                  Select Staff Member *
                </label>
                <select
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                >
                  {storeData.staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.role} - ₹{s.monthlySalary}/mo)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1">
                    Advance Amount (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={advanceAmount}
                    onChange={(e) => setAdvanceAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1">
                    Deduction Month
                  </label>
                  <input
                    type="text"
                    value={advanceDeductionMonth}
                    onChange={(e) => setAdvanceDeductionMonth(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1">
                  Reason for Advance
                </label>
                <input
                  type="text"
                  value={advanceReason}
                  onChange={(e) => setAdvanceReason(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddAdvanceModalOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  Confirm Advance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Staff Modal (Fixing Mobile Number Update Bug) */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">कर्मचारी माहिती व मोबाईल नंबर अपडेट (Edit Staff)</h3>
              </div>
              <button
                onClick={() => setEditingStaff(null)}
                className="text-slate-400 hover:text-white cursor-pointer p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateStaff} className="p-5 space-y-4 text-xs">
              {editStaffError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{editStaffError}</span>
                </div>
              )}
              {editStaffSuccess && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-2 text-xs">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{editStaffSuccess}</span>
                </div>
              )}

              <div>
                <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1">
                  कर्मचाऱ्याचे नाव (Staff Name) *
                </label>
                <input
                  type="text"
                  required
                  value={editStaffName}
                  onChange={(e) => setEditStaffName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-medium"
                />
              </div>

              <div>
                <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1">
                  मोबाईल नंबर (Contact Mobile Number) *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="उदा. 9876543210"
                  value={editStaffPhone}
                  onChange={(e) => setEditStaffPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-amber-500/50 rounded-lg px-3 py-2 text-amber-300 font-mono text-sm font-bold focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  हा नंबर आता संपादित करण्यासाठी पूर्णपणे खुला आहे (Full Edit Enabled).
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1">
                    पद / भूमिका (Designation)
                  </label>
                  <select
                    value={editStaffRole}
                    onChange={(e) => setEditStaffRole(e.target.value as Staff['role'])}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Manager">Manager (व्यवस्थापक)</option>
                    <option value="Sales Executive">Sales Executive</option>
                    <option value="Accountant">Accountant (हिशोबनीस)</option>
                    <option value="Delivery / Technician">Delivery / Technician</option>
                    <option value="Agent">Agent (योजना प्रतिनिधी)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1">
                    मासिक पगार (Monthly Salary ₹)
                  </label>
                  <input
                    type="number"
                    value={editStaffSalary}
                    onChange={(e) => setEditStaffSalary(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1">
                  कार्यरत स्थिती (Status)
                </label>
                <div className="flex items-center gap-4 mt-1.5">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="radio"
                      name="staffActive"
                      checked={editStaffActive === true}
                      onChange={() => setEditStaffActive(true)}
                      className="accent-amber-500"
                    />
                    <span>Active (सक्रिय)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-400">
                    <input
                      type="radio"
                      name="staffActive"
                      checked={editStaffActive === false}
                      onChange={() => setEditStaffActive(false)}
                      className="accent-amber-500"
                    />
                    <span>Inactive (निष्क्रिय)</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer"
                >
                  रद्द करा (Cancel)
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg shadow-md shadow-amber-500/20 cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>माहिती सेव्ह करा (Save Updates)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
