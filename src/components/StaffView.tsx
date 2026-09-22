import React, { useState } from 'react';
import {
  UserCheck,
  Plus,
  Phone,
  ShieldCheck,
  ShieldAlert,
  Check,
  X,
  Trash2,
  Lock,
  Mail,
  Clock,
  Sparkles,
  Pencil
} from 'lucide-react';
import { StaffMember } from '../types';

interface StaffViewProps {
  staff: StaffMember[];
  onAddStaff: (member: Omit<StaffMember, 'id'>) => void;
  onUpdateAttendance: (id: string, status: 'Present' | 'Absent' | 'Half Day') => void;
  onRecordAdvance: (id: string, amount: number) => void;
  onApproveStaff?: (id: string) => void;
  onRejectStaff?: (id: string) => void;
  onDeleteStaff?: (id: string) => void;
  onUpdateStaff?: (member: StaffMember) => void;
}

export const StaffView: React.FC<StaffViewProps> = ({
  staff,
  onAddStaff,
  onUpdateAttendance,
  onRecordAdvance,
  onApproveStaff,
  onRejectStaff,
  onDeleteStaff,
  onUpdateStaff,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);

  // Add Staff form states
  const [name, setName] = useState('');
  const [role, setRole] = useState('Sales & Billing');
  const [phone, setPhone] = useState('');
  const [salary, setSalary] = useState(15000);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Edit Staff form states
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('Sales & Billing');
  const [editPhone, setEditPhone] = useState('');
  const [editSalary, setEditSalary] = useState(15000);
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');

  const pendingStaff = staff.filter((s) => s.status === 'pending_approval');
  const activeStaff = staff.filter((s) => s.status !== 'pending_approval');

  const totalMonthlyPayroll = activeStaff.reduce((acc, s) => acc + (s.salary || 0), 0);
  const totalAdvances = activeStaff.reduce((acc, s) => acc + (s.advancePaid || 0), 0);
  const presentToday = activeStaff.filter((s) => s.attendanceToday === 'Present').length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddStaff({
      name: name.trim(),
      role: role.trim(),
      phone: phone.trim(),
      email: email.trim() || `${phone.trim()}@shrisai.in`,
      password: password.trim() || 'staff123',
      salary,
      advancePaid: 0,
      attendanceToday: 'Present',
      status: 'active', // Added by Admin directly -> active immediately
      approvedBy: 'Admin Direct Entry',
      approvedAt: new Date().toISOString(),
    });

    setName('');
    setPhone('');
    setEmail('');
    setPassword('');
    setSalary(15000);
    setShowModal(false);
  };

  const handleStartEdit = (member: StaffMember) => {
    setEditingStaff(member);
    setEditName(member.name || '');
    setEditRole(member.role || 'Sales & Billing');
    setEditPhone(member.phone || '');
    setEditSalary(member.salary || 15000);
    setEditEmail(member.email || '');
    setEditPassword(member.password || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff || !editName.trim()) return;

    if (onUpdateStaff) {
      onUpdateStaff({
        ...editingStaff,
        name: editName.trim(),
        role: editRole.trim(),
        phone: editPhone.trim(),
        salary: editSalary,
        email: editEmail.trim(),
        password: editPassword.trim() || editingStaff.password,
      });
    }

    setEditingStaff(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Staff & Security Access Control</span>
            {pendingStaff.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white animate-pulse">
                {pendingStaff.length} पेंडिंग मंजुरी
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            कर्मचारी नोंदणी, सुरक्षित ॲक्सेस मंजुरी (Admin Verification), हजेरी व पगार व्यवस्थापन.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          + थेट नवीन स्टाफ जोडा (Add Staff)
        </button>
      </div>

      {/* PENDING APPROVALS SECTION - CRITICAL FOR USER'S REQUEST */}
      {pendingStaff.length > 0 && (
        <div className="rounded-2xl border-2 border-amber-400 bg-amber-50/80 dark:bg-amber-950/30 dark:border-amber-600 p-4 sm:p-5 space-y-3.5 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-amber-950 dark:text-amber-100 flex items-center gap-2">
                  <span>🔒 नवीन स्टाफ नोंदणी अर्ज व मंजुरी (Pending Verification)</span>
                  <span className="text-xs bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded-full font-mono">
                    {pendingStaff.length} नवीन
                  </span>
                </h3>
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  डेटा सुरक्षेसाठी, खालील कर्मचाऱ्यांना ॲडमिनने मंजूर केल्यानंतरच ईआरपीमधील डेटा ॲक्सेस करता येईल.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {pendingStaff.map((member) => (
              <div
                key={member.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-amber-300 dark:border-amber-700/60 p-4 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">{member.name}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{member.role}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                    पेंडिंग (Pending)
                  </span>
                </div>

                <div className="text-xs space-y-1 text-slate-600 dark:text-slate-300 font-mono">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{member.phone}</span>
                  </div>
                  {member.email && (
                    <div className="flex items-center gap-1.5 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{member.email}</span>
                    </div>
                  )}
                  {member.registeredAt && (
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-sans">
                      <Clock className="w-3 h-3" />
                      <span>नोंदणी तारीख: {new Date(member.registeredAt).toLocaleDateString('mr-IN')}</span>
                    </div>
                  )}
                </div>

                {/* Approve / Reject Actions */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onApproveStaff && onApproveStaff(member.id)}
                    className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>मंजूर करा (Approve)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onRejectStaff && onRejectStaff(member.id)}
                    className="py-1.5 px-2 bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                    title="Reject Application"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteStaff && onDeleteStaff(member.id)}
                    className="py-1.5 px-2 bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-700 rounded-lg text-xs transition cursor-pointer"
                    title="Delete Request"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">सक्रिय कर्मचारी (Active Staff)</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {activeStaff.length} Employees ({presentToday} Present Today)
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Monthly Payroll Budget</p>
          <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
            ₹{totalMonthlyPayroll.toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Total Advances Disbursed</p>
          <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            ₹{totalAdvances.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Active Staff Grid */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          अधिकृत व सक्रिय कर्मचारी यादी (Authorized Staff Directory)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {activeStaff.map((member) => (
            <div
              key={member.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-sm">
                      {member.name[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm">{member.name}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{member.role}</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <ShieldCheck className="w-3 h-3" />
                    <span>सक्रिय</span>
                  </span>
                </div>

                {member.phone && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-3 font-mono">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{member.phone}</span>
                  </div>
                )}

                {member.approvedBy && (
                  <div className="text-[10px] text-slate-400 mt-1">
                    व्हेरिफायड: {member.approvedBy}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Monthly Salary</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      ₹{(member.salary || 0).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Advance Paid</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      ₹{(member.advancePaid || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Attendance Buttons & Advance input */}
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1.5">
                    आजची हजेरी (Today's Attendance)
                  </span>
                  <div className="grid grid-cols-3 gap-1">
                    {(['Present', 'Absent', 'Half Day'] as const).map((status) => (
                      <button
                        key={status}
                        onClick={() => onUpdateAttendance(member.id, status)}
                        className={`py-1 text-[11px] font-semibold rounded-lg border transition cursor-pointer ${
                          member.attendanceToday === status
                            ? status === 'Present'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold'
                              : status === 'Absent'
                              ? 'bg-rose-50 text-rose-700 border-rose-300 font-bold'
                              : 'bg-amber-50 text-amber-700 border-amber-300 font-bold'
                            : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        {status === 'Present' ? 'हजर' : status === 'Absent' ? 'गैरहजर' : 'अर्धा दिवस'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const amount = prompt(`Enter advance amount for ${member.name}:`);
                        if (amount && !isNaN(Number(amount))) {
                          onRecordAdvance(member.id, Number(amount));
                        }
                      }}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition cursor-pointer"
                    >
                      + ॲडव्हान्स नोंदवा
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStartEdit(member)}
                      className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer flex items-center gap-1 py-1 px-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200"
                      title="स्टाफ माहिती व मोबाईल नंबर दुरुस्त करा"
                    >
                      <Pencil className="w-3.5 h-3.5 text-blue-500" />
                      <span>बदल (Edit)</span>
                    </button>
                  </div>

                  {onDeleteStaff && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`${member.name} यांचे खाते व ॲक्सेस हटवायचा आहे का?`)) {
                          onDeleteStaff(member.id);
                        }
                      }}
                      className="text-xs text-slate-400 hover:text-rose-600 transition cursor-pointer"
                      title="Delete staff"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Staff Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">नवीन स्टाफ जोडा (Add Staff)</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  नाव (Full Name) *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="उदा. राहुल इंगळे"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-white bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  रोल / पद (Role) *
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-white bg-white dark:bg-slate-800"
                >
                  <option value="Sales & Billing">काउंटर बिलिंग व विक्री (Sales & Billing)</option>
                  <option value="Collection Agent">कार्ड हप्ते वसुली एजंट (Collection Agent)</option>
                  <option value="Store Manager">स्टोअर व स्टॉक असिस्टंट (Store Assistant)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  मोबाईल नंबर *
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-white bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ईमेल (पर्यायी)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staff@shrisai.in"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-white bg-white dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    मासिक पगार (₹)
                  </label>
                  <input
                    type="number"
                    value={salary}
                    onChange={(e) => setSalary(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-white bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    पासवर्ड
                  </label>
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="डिफॉल्ट: staff123"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-white bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  रद्द करा
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm cursor-pointer"
                >
                  स्टाफ जोडा (Add)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Staff Modal (Allows full editing of mobile number, role, salary, password) */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Pencil className="w-4 h-4 text-blue-600" />
                <span>स्टाफ माहिती दुरुस्त करा (Edit Staff)</span>
              </h2>
              <button
                onClick={() => setEditingStaff(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  नाव (Full Name) *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-white bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  मोबाईल नंबर (Mobile Number) *
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full px-3 py-2 rounded-xl border border-blue-400 dark:border-blue-600 text-xs sm:text-sm text-slate-800 dark:text-white bg-blue-50/30 dark:bg-slate-800 font-mono font-bold"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  मोबाईल नंबर सहज बदलू शकता.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  रोल / पद (Role) *
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-white bg-white dark:bg-slate-800"
                >
                  <option value="Sales & Billing">काउंटर बिलिंग व विक्री (Sales & Billing)</option>
                  <option value="Collection Agent">कार्ड हप्ते वसुली एजंट (Collection Agent)</option>
                  <option value="Store Manager">स्टोअर व स्टॉक असिस्टंट (Store Assistant)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ईमेल (पर्यायी)
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-white bg-white dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    मासिक पगार (₹)
                  </label>
                  <input
                    type="number"
                    value={editSalary}
                    onChange={(e) => setEditSalary(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-white bg-white dark:bg-slate-800 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    पासवर्ड (Password)
                  </label>
                  <input
                    type="text"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-white bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  रद्द करा
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm cursor-pointer"
                >
                  बदल सेव्ह करा (Save Changes)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
