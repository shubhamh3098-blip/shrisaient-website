import React, { useState } from 'react';
import { UserCheck, Plus, Phone, Award, ShieldCheck, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { StaffMember } from '../types';

interface StaffViewProps {
  staff: StaffMember[];
  onAddStaff: (member: Omit<StaffMember, 'id'>) => void;
  onUpdateAttendance: (id: string, status: 'Present' | 'Absent' | 'Half Day') => void;
  onRecordAdvance: (id: string, amount: number) => void;
  onApproveStaff?: (id: string) => void;
  onRejectStaff?: (id: string) => void;
}

export const StaffView: React.FC<StaffViewProps> = ({
  staff,
  onAddStaff,
  onUpdateAttendance,
  onRecordAdvance,
  onApproveStaff,
  onRejectStaff,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('Sales & Billing');
  const [phone, setPhone] = useState('');
  const [salary, setSalary] = useState(15000);

  const totalMonthlyPayroll = staff.reduce((acc, s) => acc + s.salary, 0);
  const totalAdvances = staff.reduce((acc, s) => acc + s.advancePaid, 0);
  const presentToday = staff.filter((s) => s.attendanceToday === 'Present').length;
  const pendingApprovalCount = staff.filter((s) => s.status === 'Pending Approval' || s.isApprovedByAdmin === false).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddStaff({
      name: name.trim(),
      role: role.trim(),
      phone: phone.trim(),
      salary,
      advancePaid: 0,
      attendanceToday: 'Present',
      status: 'Active',
      isApprovedByAdmin: true,
      approvedBy: 'Shubham Shende (Admin)',
      approvalDate: new Date().toISOString().split('T')[0],
    });

    setName('');
    setPhone('');
    setSalary(15000);
    setShowModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Staff & Payroll
          </h1>
          <p className="text-sm text-slate-500">
            Employee directory, attendance tracker, advances, and monthly salaries.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          + Add Staff Member
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Total Staff Count</p>
          <p className="text-xl font-bold text-slate-900 mt-1">
            {staff.length} Employees ({presentToday} Present)
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Monthly Payroll Budget</p>
          <p className="text-xl font-bold text-indigo-600 mt-1">
            ₹{totalMonthlyPayroll.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Total Advances Disbursed</p>
          <p className="text-xl font-bold text-amber-600 mt-1">
            ₹{totalAdvances.toLocaleString()}
          </p>
        </div>
        <div className={`rounded-xl border p-4 shadow-xs ${pendingApprovalCount > 0 ? 'bg-amber-50 border-amber-300' : 'bg-white border-slate-200'}`}>
          <p className="text-xs text-slate-500 font-medium">Admin Approval Status</p>
          <p className={`text-xl font-bold mt-1 ${pendingApprovalCount > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
            {pendingApprovalCount > 0 ? `${pendingApprovalCount} Pending Approval` : 'All Approved (सुरक्षित)'}
          </p>
        </div>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {staff.map((member) => {
          const isPending = member.status === 'Pending Approval' || member.isApprovedByAdmin === false;
          return (
            <div
              key={member.id}
              className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between space-y-4 ${
                isPending ? 'border-amber-300 ring-2 ring-amber-100' : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm">
                      {member.name[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{member.name}</h3>
                      <p className="text-xs text-slate-500">{member.role}</p>
                    </div>
                  </div>
                  {isPending ? (
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-300 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-600" />
                      प्रलंबित
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      ॲप्रूव्हड
                    </span>
                  )}
                </div>

                {member.phone && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-3 font-mono">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{member.phone}</span>
                  </div>
                )}

                {/* Admin Approval Decision Bar for Pending Staff */}
                {isPending && (
                  <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                    <div className="text-[11px] font-bold text-amber-900 flex items-center justify-between">
                      <span>ॲडमिन परवानगी आवश्यक:</span>
                      <span className="text-[10px] text-amber-700 font-normal">Login Locked</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {onApproveStaff && (
                        <button
                          type="button"
                          onClick={() => onApproveStaff(member.id)}
                          className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer flex items-center justify-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>ॲप्रूव्ह करा (Approve)</span>
                        </button>
                      )}
                      {onRejectStaff && (
                        <button
                          type="button"
                          onClick={() => onRejectStaff(member.id)}
                          className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>रद्द करा</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Monthly Salary</span>
                    <span className="font-bold text-slate-900">₹{member.salary.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Advance Taken</span>
                    <span className="font-semibold text-amber-600">₹{member.advancePaid.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Attendance quick toggle */}
              <div className="pt-2 border-t border-slate-100">
                <span className="block text-[11px] text-slate-400 mb-1.5">Today's Attendance:</span>
                <div className="grid grid-cols-3 gap-1 text-[11px]">
                  {(['Present', 'Half Day', 'Absent'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => onUpdateAttendance(member.id, status)}
                      className={`py-1 rounded font-medium transition cursor-pointer ${
                        member.attendanceToday === status
                          ? status === 'Present'
                            ? 'bg-emerald-600 text-white'
                            : status === 'Half Day'
                            ? 'bg-amber-500 text-white'
                            : 'bg-rose-500 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Add New Staff Member</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 font-bold">
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Staff Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Role / Designation</label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Sales, Accounts, Store Incharge"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Monthly Salary (₹)</label>
                <input
                  type="number"
                  value={salary}
                  onChange={(e) => setSalary(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-semibold"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  Save Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
