import React, { useState, useMemo } from 'react';
import {
  UserCheck,
  Calendar,
  CheckCircle2,
  Printer,
  Share2,
  DollarSign,
  Clock,
  Building2,
  Award,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { StoreData, Staff, StaffAttendanceRecord } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { StorageService } from '../../services/storageService';

interface StaffAttendanceSalaryViewProps {
  storeData: StoreData;
  onRefreshData?: () => void;
}

export const StaffAttendanceSalaryView: React.FC<StaffAttendanceSalaryViewProps> = ({
  storeData,
  onRefreshData,
}) => {
  const { isDayMode } = useTheme();

  const todayStr = new Date().toISOString().slice(0, 10);
  const currentMonthStr = todayStr.slice(0, 7);

  const [activeTab, setActiveTab] = useState<'attendance' | 'payslip'>('attendance');
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedStaffId, setSelectedStaffId] = useState<string>(storeData.staff[0]?.id || 'stf-1');
  const [payslipMonth, setPayslipMonth] = useState<string>(currentMonthStr);
  const [attendanceSuccessMsg, setAttendanceSuccessMsg] = useState<string | null>(null);

  // Active Staff & Agents
  const staffList = useMemo(() => {
    return storeData.staff.length > 0 ? storeData.staff : [
      { id: 'stf-1', name: 'Bhushan Lidbe', role: 'Agent' as const, phone: '+91 87664 86915', monthlySalary: 25000, joiningDate: '2022-01-01', isActive: true },
      { id: 'stf-2', name: 'Shubham Shende', role: 'Agent' as const, phone: '+91 86001 22978', monthlySalary: 25000, joiningDate: '2022-01-01', isActive: true },
      { id: 'stf-3', name: 'Suraj Moon', role: 'Agent' as const, phone: '+91 91755 34365', monthlySalary: 22000, joiningDate: '2022-06-01', isActive: true },
      { id: 'stf-4', name: 'Rahul Wankhede', role: 'Agent' as const, phone: '+91 97664 11220', monthlySalary: 18000, joiningDate: '2023-02-15', isActive: true },
      { id: 'stf-5', name: 'Sachin Deshmukh', role: 'Agent' as const, phone: '+91 94220 33441', monthlySalary: 18000, joiningDate: '2023-04-10', isActive: true },
    ];
  }, [storeData.staff]);

  // Attendance Records
  const attendanceList = useMemo(() => storeData.staffAttendance || [], [storeData.staffAttendance]);

  // Daily map for selectedDate
  const [dailyStatusMap, setDailyStatusMap] = useState<Record<string, 'Present' | 'Half Day' | 'Absent' | 'Paid Leave'>>({});

  // Initialize status map when selectedDate changes
  useMemo(() => {
    const map: Record<string, 'Present' | 'Half Day' | 'Absent' | 'Paid Leave'> = {};
    staffList.forEach((s) => {
      const found = attendanceList.find((a) => a.date === selectedDate && a.staffId === s.id);
      map[s.id] = found ? found.status : 'Present';
    });
    setDailyStatusMap(map);
  }, [selectedDate, staffList, attendanceList]);

  // Save Today's Attendance
  const handleSaveAttendance = () => {
    const updatedRecords = [...attendanceList.filter((a) => a.date !== selectedDate)];

    staffList.forEach((s) => {
      updatedRecords.push({
        id: `att-${selectedDate}-${s.id}`,
        date: selectedDate,
        staffId: s.id,
        staffName: s.name,
        status: dailyStatusMap[s.id] || 'Present',
      });
    });

    const updatedData: StoreData = {
      ...storeData,
      staffAttendance: updatedRecords,
    };

    StorageService.saveData(updatedData);
    setAttendanceSuccessMsg(`${selectedDate} ची हजेरी यशस्वीरित्या सेव्ह झाली!`);
    if (onRefreshData) onRefreshData();
    setTimeout(() => setAttendanceSuccessMsg(null), 4000);
  };

  // Payslip Calculations for selected staff member
  const payslipData = useMemo(() => {
    const staff = staffList.find((s) => s.id === selectedStaffId) || staffList[0];
    if (!staff) return null;

    // Monthly attendance
    const monthAtt = attendanceList.filter((a) => a.staffId === staff.id && a.date.startsWith(payslipMonth));
    const presentDays = monthAtt.filter((a) => a.status === 'Present').length;
    const halfDays = monthAtt.filter((a) => a.status === 'Half Day').length;
    const paidLeaveDays = monthAtt.filter((a) => a.status === 'Paid Leave').length;
    const absentDays = monthAtt.filter((a) => a.status === 'Absent').length;

    const effectiveDays = presentDays + (halfDays * 0.5) + paidLeaveDays;
    const workingDaysInMonth = 30;

    // Basic Salary earned
    const earnedBasic = Math.round((staff.monthlySalary / workingDaysInMonth) * (monthAtt.length > 0 ? effectiveDays : 30));

    // Agent 4% Commission calculation
    const nameLower = staff.name.toLowerCase();
    const agentTx = storeData.cardTransactions.filter(
      (c) => c.date.startsWith(payslipMonth) && c.collectedBy?.toLowerCase().includes(nameLower)
    );
    const agentReceipts = storeData.billReceipts.filter(
      (r) => r.date.startsWith(payslipMonth) && r.handledBy?.toLowerCase().includes(nameLower)
    );

    const totalCollected = agentTx.reduce((acc, c) => acc + c.amount, 0) + agentReceipts.reduce((acc, r) => acc + r.amountPaid, 0);
    const commission4Pct = Math.round((totalCollected * 4) / 100);

    // Advances taken
    const advances = storeData.agentAdvances
      .filter((a) => a.staffId === staff.id && a.status === 'Pending')
      .reduce((acc, a) => acc + a.amount, 0);

    const netPayable = Math.max(0, earnedBasic + commission4Pct - advances);

    return {
      staff,
      presentDays,
      halfDays,
      paidLeaveDays,
      absentDays,
      effectiveDays,
      earnedBasic,
      totalCollected,
      commission4Pct,
      advances,
      netPayable,
    };
  }, [staffList, selectedStaffId, attendanceList, payslipMonth, storeData.cardTransactions, storeData.billReceipts, storeData.agentAdvances]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div
        className={`p-4 sm:p-6 rounded-2xl border transition-all ${
          isDayMode
            ? 'bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-blue-200 text-slate-800 shadow-sm'
            : 'bg-gradient-to-r from-[#0d162d] via-[#10132b] to-[#121c29] border-blue-500/30 text-white shadow-xl'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black tracking-wider uppercase bg-blue-500 text-white">
                HR & Payroll Pro
              </span>
              <span className="text-xs text-blue-400 font-semibold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                कर्मचारी हजेरी, कमिशन व पगार पावती
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              कर्मचारी हजेरी व पगार पावती जनरेटर (Staff Attendance & Salary Slip)
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-300 mt-1">
              दुकान स्टाफ व फील्ड एजंट्सची रोजची हजेरी नोंदवा, ४% वसुली कमिशन जोडा आणि १-क्लिकमध्ये पगार पावती प्रिंट करा.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>पगार पावती प्रिंट (Print Slip)</span>
            </button>
          </div>
        </div>
      </div>

      {attendanceSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-lg animate-fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
          <span>{attendanceSuccessMsg}</span>
        </div>
      )}

      {/* Tabs */}
      <div
        className={`flex items-center gap-2 p-1.5 rounded-xl border text-xs font-bold ${
          isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}
      >
        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex-1 py-2 px-4 rounded-lg transition cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'attendance' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>दैनिक हजेरी नोंदवही (Daily Attendance Register)</span>
        </button>

        <button
          onClick={() => setActiveTab('payslip')}
          className={`flex-1 py-2 px-4 rounded-lg transition cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'payslip' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>स्वयंचलित पगार पावती (Salary Payslip Generator)</span>
        </button>
      </div>

      {/* TAB 1: ATTENDANCE REGISTER */}
      {activeTab === 'attendance' && (
        <div
          className={`p-5 rounded-2xl border transition-all ${
            isDayMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0f172a] border-slate-800 shadow-xl'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
            <div>
              <h3 className="font-bold text-sm">दैनिक हजेरी (Mark Staff Attendance)</h3>
              <p className="text-xs text-slate-400">सर्व कर्मचारी व एजंट्सची आजची हजेरी नोंदवा.</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-bold">तारीख निवडा:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl border text-xs font-mono bg-black/5 dark:bg-black/30 border-slate-300 dark:border-slate-700 outline-none"
              />
            </div>
          </div>

          <div className="space-y-3 mb-6">
            {staffList.map((st) => (
              <div
                key={st.id}
                className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <span className="font-bold text-sm text-white">{st.name}</span>
                  <span className="text-xs text-slate-400 ml-2">({st.role} • {st.phone})</span>
                  <span className="text-xs text-slate-500 block">मूळ पगार: ₹{st.monthlySalary.toLocaleString('en-IN')}/महिना</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {(['Present', 'Half Day', 'Absent', 'Paid Leave'] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setDailyStatusMap((prev) => ({ ...prev, [st.id]: status }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border ${
                        dailyStatusMap[st.id] === status
                          ? status === 'Present'
                            ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                            : status === 'Half Day'
                            ? 'bg-amber-600 text-white border-amber-500'
                            : status === 'Paid Leave'
                            ? 'bg-blue-600 text-white border-blue-500'
                            : 'bg-rose-600 text-white border-rose-500'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      {status === 'Present' ? 'हजर (P)' : status === 'Half Day' ? 'अर्धा (HD)' : status === 'Paid Leave' ? 'रजा (PL)' : 'गैरहजर (A)'}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSaveAttendance}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>हजेरी रजिस्टर सेव्ह करा (Save Attendance)</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: SALARY PAYSLIP GENERATOR */}
      {activeTab === 'payslip' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls */}
          <div className="lg:col-span-4 space-y-4">
            <div
              className={`p-5 rounded-2xl border transition-all ${
                isDayMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0f172a] border-slate-800 shadow-xl'
              }`}
            >
              <h3 className="font-bold text-sm mb-3">कर्मचारी व महिना निवडा</h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">कर्मचारी (Staff/Agent):</label>
                  <select
                    value={selectedStaffId}
                    onChange={(e) => setSelectedStaffId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-xs bg-black/5 dark:bg-black/30 border-slate-300 dark:border-slate-700 outline-none"
                  >
                    {staffList.map((st) => (
                      <option key={st.id} value={st.id} className="bg-slate-900 text-white">
                        {st.name} ({st.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">पगार महिना (Month):</label>
                  <input
                    type="month"
                    value={payslipMonth}
                    onChange={(e) => setPayslipMonth(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-mono bg-black/5 dark:bg-black/30 border-slate-300 dark:border-slate-700 outline-none text-blue-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Printable Payslip Card */}
          <div className="lg:col-span-8 flex justify-center">
            {payslipData && (
              <div
                className={`w-full max-w-[550px] p-6 rounded-3xl border-2 shadow-2xl relative ${
                  isDayMode ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#0b1020] border-slate-700 text-white'
                }`}
              >
                {/* Header */}
                <div className="text-center border-b border-slate-200 dark:border-slate-800 pb-4 mb-4">
                  <h3 className="font-serif font-black text-lg text-blue-400 uppercase tracking-wide">
                    SHRI SAI ENTERPRISES
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Opposite Matoshree Sabhagruh, Arvi Road, Punjab Colony, Wardha - 442001
                  </p>
                  <span className="inline-block mt-2 px-3 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold text-xs uppercase">
                    पगार पावती (Salary Payslip) • {payslipMonth}
                  </span>
                </div>

                {/* Staff Details */}
                <div className="grid grid-cols-2 gap-2 text-xs mb-4 p-3 rounded-xl bg-slate-900/40 border border-slate-800">
                  <div>
                    <span className="text-slate-400 block text-[10px]">कर्मचाऱ्याचे नाव:</span>
                    <strong className="text-sm">{payslipData.staff.name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">हुद्दा (Designation):</span>
                    <strong>{payslipData.staff.role}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">मोबाईल:</span>
                    <span className="font-mono">{payslipData.staff.phone}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">हजेरी दिवस:</span>
                    <span className="font-mono text-emerald-400 font-bold">{payslipData.effectiveDays} दिवस</span>
                  </div>
                </div>

                {/* Earnings & Deductions Table */}
                <div className="space-y-2 text-xs mb-4">
                  <div className="flex justify-between py-1.5 border-b border-slate-800">
                    <span className="text-slate-400">१. मूळ पगार (Basic Earned Salary):</span>
                    <span className="font-mono font-bold">₹{payslipData.earnedBasic.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-slate-800">
                    <span className="text-slate-400">२. एजंट ४% वसुली कमिशन (₹{payslipData.totalCollected.toLocaleString('en-IN')} संकलनावर):</span>
                    <span className="font-mono font-bold text-emerald-400">+₹{payslipData.commission4Pct.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-slate-800">
                    <span className="text-slate-400">३. घेतलेली उचल / ॲडव्हान्स (Advance Deducted):</span>
                    <span className="font-mono font-bold text-rose-400">-₹{payslipData.advances.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="flex justify-between py-2.5 px-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-sm font-black">
                    <span className="text-blue-300">निव्वळ देय पगार (Net Salary Payable):</span>
                    <span className="font-mono text-xl text-blue-400">
                      ₹{payslipData.netPayable.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Signature Line */}
                <div className="pt-8 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800">
                  <div className="text-center">
                    <div className="w-28 border-b border-slate-600 mb-1" />
                    <span>कर्मचारी स्वाक्षरी</span>
                  </div>

                  <div className="text-center">
                    <div className="w-28 border-b border-slate-600 mb-1" />
                    <span>अधिकृत स्वाक्षरी / शिक्का</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
