import React, { useState, useMemo } from 'react';
import {
  Award,
  Calendar,
  CreditCard,
  Download,
  FileSpreadsheet,
  Filter,
  IndianRupee,
  Layers,
  Phone,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Share2,
  TrendingUp,
  User,
  UserCheck,
  Wallet,
  X,
  Target,
  BarChart3,
  CheckCircle2,
  TrendingDown
} from 'lucide-react';
import { CardMember, CardTransaction, AgentAdvance, BusinessSettings, TransactionEntry } from '../types';
import { calculateAgentEarnings, DayWiseCollectionSummary } from '../utils/numbering';

interface AgentCommissionViewProps {
  cardTransactions: CardTransaction[];
  cardMembers: CardMember[];
  agentAdvances: AgentAdvance[];
  settings: BusinessSettings;
  onRecordAdvance: (advance: Omit<AgentAdvance, 'id' | 'createdAt'>) => void;
  currentAgentFilter?: string;
  onRefreshSync?: () => void;
  salesTransactions?: TransactionEntry[];
}

export const AgentCommissionView: React.FC<AgentCommissionViewProps> = ({
  cardTransactions,
  cardMembers,
  agentAdvances,
  settings,
  onRecordAdvance,
  currentAgentFilter = '',
  onRefreshSync,
  salesTransactions = [],
}) => {
  // Discover all unique agents across transactions, members, advances and the 4 core agents
  const allAgentNames = useMemo(() => {
    const names = new Set<string>();
    // Always include the 4 core field agents
    names.add('Shubham Shende');
    names.add('Bhushan Lidbe');
    names.add('Suraj Pendam');
    names.add('Ninad Hole');

    (cardTransactions || []).forEach((tx) => {
      if (tx.agentName && tx.agentName.trim()) names.add(tx.agentName.trim());
    });
    (cardMembers || []).forEach((m) => {
      if (m.agentName && m.agentName.trim()) names.add(m.agentName.trim());
    });
    (agentAdvances || []).forEach((a) => {
      if (a.agentName && a.agentName.trim()) names.add(a.agentName.trim());
    });
    return Array.from(names).sort();
  }, [cardTransactions, cardMembers, agentAdvances]);

  const [selectedAgent, setSelectedAgent] = useState<string>(() => {
    if (currentAgentFilter && allAgentNames.includes(currentAgentFilter)) {
      return currentAgentFilter;
    }
    return 'Shubham Shende';
  });

  React.useEffect(() => {
    if (currentAgentFilter && allAgentNames.includes(currentAgentFilter)) {
      setSelectedAgent(currentAgentFilter);
    }
  }, [currentAgentFilter, allAgentNames]);

  // Time filter: 'today' | 'week' | 'month' | 'all' | 'custom'
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month' | 'all' | 'custom'>('month');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // Active view tab inside dashboard: 'daywise' | 'newcards' | 'advances' | 'sales-targets'
  const [activeSubTab, setActiveSubTab] = useState<'daywise' | 'newcards' | 'advances' | 'sales-targets'>('daywise');

  // Sales Performance by Staff / Agent
  const salesPerformanceData = useMemo(() => {
    const defaultMonthlyTarget = 200000; // default ₹2,00,000 monthly sales target

    const list = Array.from(allAgentNames).map((name: string) => {
      // Find store sales transactions where agentName matches
      const agentSales = (salesTransactions || []).filter((t) => {
        const agName = (t.agentName || '').trim().toLowerCase();
        const targetName = String(name).trim().toLowerCase();
        return agName === targetName || (name === 'Shubham Shende' && !t.agentName);
      });

      const totalRevenue = agentSales.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
      const totalOrdersCount = agentSales.length;
      const salesIncentive = Math.round(totalRevenue * 0.01); // 1% showroom sales incentive

      // Card Scheme stats for this agent
      const agentCards = (cardMembers || []).filter(
        (m) => (m.agentName || '').trim().toLowerCase() === String(name).trim().toLowerCase()
      );
      const agentTxs = (cardTransactions || []).filter(
        (tx) => (tx.agentName || '').trim().toLowerCase() === String(name).trim().toLowerCase() && tx.type === 'WeeklyPayment'
      );
      const collectionAmount = agentTxs.reduce((sum, tx) => sum + (tx.amount || 0), 0);
      const collectionCommission = Math.round(collectionAmount * 0.04); // 4% scheme commission

      const targetProgress = Math.min(100, Math.round((totalRevenue / defaultMonthlyTarget) * 100));
      const totalCombinedEarnings = salesIncentive + collectionCommission;

      return {
        name,
        totalRevenue,
        totalOrdersCount,
        salesIncentive,
        activeCardsCount: agentCards.length,
        collectionAmount,
        collectionCommission,
        monthlyTarget: defaultMonthlyTarget,
        targetProgress,
        totalCombinedEarnings,
        sales: agentSales,
      };
    });

    return list.sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [allAgentNames, salesTransactions, cardMembers, cardTransactions]);

  // Day detail modal / expanded state
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  // Advance Modal State
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [advanceAmount, setAdvanceAmount] = useState<number>(1000);
  const [advanceDate, setAdvanceDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [advanceMode, setAdvanceMode] = useState<'Cash' | 'Online'>('Cash');
  const [advanceNotes, setAdvanceNotes] = useState<string>('');

  // Salary Slip Modal State
  const [showSlipModal, setShowSlipModal] = useState(false);

  // Compute date range based on filter
  const dateRange = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (timeFilter === 'today') {
      return { startDate: todayStr, endDate: todayStr };
    }
    if (timeFilter === 'week') {
      const d = new Date(today);
      const day = d.getDay() || 7;
      d.setDate(d.getDate() - day + 1); // Monday
      return { startDate: d.toISOString().split('T')[0], endDate: todayStr };
    }
    if (timeFilter === 'month') {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      return { startDate: startOfMonth, endDate: todayStr };
    }
    if (timeFilter === 'custom') {
      return {
        startDate: customStartDate || undefined,
        endDate: customEndDate || undefined,
      };
    }
    return undefined; // All time
  }, [timeFilter, customStartDate, customEndDate]);

  // Compute full stats for selected agent
  const stats = useMemo(() => {
    return calculateAgentEarnings(
      selectedAgent,
      cardTransactions,
      cardMembers,
      agentAdvances,
      dateRange
    );
  }, [selectedAgent, cardTransactions, cardMembers, agentAdvances, dateRange]);

  // Handle Advance submit
  const handleSaveAdvance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!advanceAmount || advanceAmount <= 0) return;

    onRecordAdvance({
      agentName: selectedAgent,
      amount: Number(advanceAmount),
      date: advanceDate || new Date().toISOString().split('T')[0],
      paymentMode: advanceMode,
      notes: advanceNotes.trim() || undefined,
    });

    setShowAdvanceModal(false);
    setAdvanceAmount(1000);
    setAdvanceNotes('');
  };

  // WhatsApp share salary slip
  const handleShareWhatsAppSlip = () => {
    const msg =
      `*श्री साई इंटरप्राइजेस - एजंट पगार व कमिशन पावती*\n` +
      `--------------------------------\n` +
      `👨‍💼 *प्रतिनिधी नाव:* ${stats.agentName}\n` +
      `📅 *कालावधी:* ${dateRange?.startDate || 'सुरुवातीपासून'} ते ${dateRange?.endDate || 'आजपर्यंत'}\n\n` +
      `💰 *हप्ता एकूण वसुली:* ₹${stats.totalCollection.toLocaleString('en-IN')}\n` +
      `📈 *४% कमिशन (पगार):* ₹${stats.commissionAmount.toLocaleString('en-IN')}\n` +
      `💳 *नवीन कार्ड नोंदणी:* ${stats.newCardsCount} कार्ड्स (₹50 प्रति कार्ड = ₹${stats.newCardsBonus.toLocaleString('en-IN')})\n` +
      `--------------------------------\n` +
      `💵 *एकूण देय कमाई:* ₹${stats.totalGrossEarnings.toLocaleString('en-IN')}\n` +
      `🔻 *घेतलेला ॲडव्हान्स:* -₹${stats.advancePaid.toLocaleString('en-IN')}\n` +
      `================================\n` +
      `⭐ *निव्वळ शिल्लक देय पगार:* ₹${stats.netPayableSalary.toLocaleString('en-IN')}\n` +
      `================================\n` +
      `📞 संपर्क: ${settings.phone} / ${settings.ownerName}\n` +
      `🏬 मातोश्री सभागृह समोर, आर्वी रोड, वर्धा`;

    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-3.5 sm:px-6 py-6 space-y-6">
      {/* Top Header & Agent Selector */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  एजंट कमिशन व पगार डॅशबोर्ड
                  <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    ४% वसुली + ₹५० कार्ड
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  तारीखवार रिअल-टाइम वसुली मॉनिटर, नवीन कार्ड्स बोनस आणि ॲडव्हान्स वजावट हिशोब
                </p>
              </div>
            </div>
          </div>

          {/* Agent Switcher & Sync */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 shadow-2xs">
              <User className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">प्रतिनिधी:</span>
              <select
                id="agent-commission-selector"
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden cursor-pointer"
              >
                {allAgentNames.map((agent) => (
                  <option key={agent} value={agent} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    {agent}
                  </option>
                ))}
              </select>
            </div>

            {onRefreshSync && (
              <button
                type="button"
                onClick={onRefreshSync}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                title="रिफ्रेश व क्लाउड सिंक"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowAdvanceModal(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              ॲडव्हान्स नोंदवा
            </button>

            <button
              type="button"
              onClick={() => setShowSlipModal(true)}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              पगार स्लिप
            </button>
          </div>
        </div>

        {/* Time Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" /> कालावधी:
          </span>

          <button
            type="button"
            onClick={() => setTimeFilter('today')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              timeFilter === 'today'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            आज (Today)
          </button>
          <button
            type="button"
            onClick={() => setTimeFilter('week')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              timeFilter === 'week'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            चालू आठवडा (Week)
          </button>
          <button
            type="button"
            onClick={() => setTimeFilter('month')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              timeFilter === 'month'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            चालू महिना (Month)
          </button>
          <button
            type="button"
            onClick={() => setTimeFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              timeFilter === 'all'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            संपूर्ण हिशोब (All)
          </button>

          {timeFilter === 'custom' && (
            <div className="flex items-center gap-2 ml-auto">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              />
              <span className="text-xs text-slate-400">ते</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              />
            </div>
          )}
        </div>
      </div>

      {/* Primary KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* 1. Total Collection */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            एकूण हप्ता वसुली
          </p>
          <p className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1">
            ₹{stats.totalCollection.toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {stats.dayWiseCollections.reduce((acc, d) => acc + d.count, 0)} हप्ते पावत्या
          </span>
        </div>

        {/* 2. 4% Commission (Core Salary) */}
        <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/20 dark:bg-emerald-950/20 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
              ४% कमिशन (पगार)
            </p>
            <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-emerald-600 text-white">
              4%
            </span>
          </div>
          <p className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            ₹{stats.commissionAmount.toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 block mt-0.5">
            हप्ता वसुलीवर ४%
          </span>
        </div>

        {/* 3. New Cards Opened */}
        <div className="bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800/60 bg-blue-50/20 dark:bg-blue-950/20 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider">
              नवीन कार्ड्स बोनस
            </p>
            <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-blue-600 text-white">
              ₹50/कार्ड
            </span>
          </div>
          <p className="text-lg sm:text-xl font-black text-blue-600 dark:text-blue-400 mt-1">
            ₹{stats.newCardsBonus.toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-blue-600/80 dark:text-blue-400/80 block mt-0.5">
            {stats.newCardsCount} नवीन कार्ड्स नोंद
          </span>
        </div>

        {/* 4. Total Gross Earnings */}
        <div className="bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800/60 bg-purple-50/20 dark:bg-purple-950/20 rounded-2xl p-4 shadow-xs">
          <p className="text-[11px] font-bold text-purple-800 dark:text-purple-300 uppercase tracking-wider">
            एकूण कमाई (Gross)
          </p>
          <p className="text-lg sm:text-xl font-black text-purple-600 dark:text-purple-400 mt-1">
            ₹{stats.totalGrossEarnings.toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-purple-600/80 dark:text-purple-400/80 block mt-0.5">
            ४% कमिशन + कार्ड्स
          </span>
        </div>

        {/* 5. Advance Disbursed */}
        <div className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/60 bg-amber-50/20 dark:bg-amber-950/20 rounded-2xl p-4 shadow-xs">
          <p className="text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
            दिलेला ॲडव्हान्स
          </p>
          <p className="text-lg sm:text-xl font-black text-amber-600 dark:text-amber-400 mt-1">
            -₹{stats.advancePaid.toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-amber-600/80 dark:text-amber-400/80 block mt-0.5">
            {stats.advancesList.length} वेळा उचल
          </span>
        </div>

        {/* 6. Net Balance Payable */}
        <div className="bg-emerald-600 text-white rounded-2xl p-4 shadow-md shadow-emerald-600/20 col-span-2 sm:col-span-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-100">
            शिल्लक देय पगार
          </p>
          <p className="text-xl sm:text-2xl font-black mt-1">
            ₹{stats.netPayableSalary.toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-emerald-100 block mt-0.5 font-medium">
            (कमाई - ॲडव्हान्स)
          </span>
        </div>
      </div>

      {/* Tabs for Detailed Breakdown */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-1.5 gap-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab('daywise')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'daywise'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs border border-slate-200/80 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            तारीखवार वसुली मॉनिटर ({stats.dayWiseCollections.length} दिवस)
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('newcards')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'newcards'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs border border-slate-200/80 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            नवीन कार्ड्स नोंदणी ({stats.newCardsCount} कार्ड्स = ₹{stats.newCardsBonus})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('advances')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'advances'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-2xs border border-slate-200/80 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            ॲडव्हान्स हिशोब ({stats.advancesList.length} नोंदी = -₹{stats.advancePaid})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('sales-targets')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'sales-targets'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs border border-slate-200/80 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            विक्री टार्गेट व कामगिरी (Sales & Targets)
          </button>
        </div>

        {/* TAB 1: DAYWISE MONITOR */}
        {activeSubTab === 'daywise' && (
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  तारीखवार कलेक्शन मॉनिटर (Realtime Day-wise Log)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  प्रत्येक दिवसाची एकूण वसुली आणि त्यावर बनणारे ४% कमिशन
                </p>
              </div>
            </div>

            {stats.dayWiseCollections.length === 0 ? (
              <div className="text-center py-12 text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                <p className="text-sm font-medium">निवडलेल्या कालावधीत कोणतीही हप्ता वसुली नाही.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-y border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">तारीख (Date)</th>
                      <th className="py-2.5 px-3 text-center">पावत्या (Receipts)</th>
                      <th className="py-2.5 px-3 text-right">रोख (Cash)</th>
                      <th className="py-2.5 px-3 text-right">ऑनलाइन (Online)</th>
                      <th className="py-2.5 px-3 text-right">एकूण वसुली</th>
                      <th className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400 font-bold">
                        ४% कमिशन कमाई
                      </th>
                      <th className="py-2.5 px-3 text-center">तपशील</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {stats.dayWiseCollections.map((day) => {
                      const isExpanded = expandedDate === day.date;
                      return (
                        <React.Fragment key={day.date}>
                          <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                            <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                              {day.date}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px]">
                                {day.count} पावत्या
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right text-slate-600 dark:text-slate-400">
                              ₹{day.cashAmount.toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 px-3 text-right text-slate-600 dark:text-slate-400">
                              ₹{day.onlineAmount.toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white">
                              ₹{day.totalAmount.toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 px-3 text-right font-black text-emerald-600 dark:text-emerald-400">
                              ₹{day.commission.toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => setExpandedDate(isExpanded ? null : day.date)}
                                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                              >
                                {isExpanded ? 'बंद करा' : 'पाहा'}
                              </button>
                            </td>
                          </tr>

                          {/* Expanded Day Details */}
                          {isExpanded && (
                            <tr className="bg-slate-50/90 dark:bg-slate-800/70">
                              <td colSpan={7} className="p-3 sm:p-4">
                                <div className="space-y-2">
                                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    📅 {day.date} च्या सर्व हप्ते पावत्या ({day.transactions.length}):
                                  </p>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                    {day.transactions.map((tx) => (
                                      <div
                                        key={tx.id}
                                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs shadow-2xs"
                                      >
                                        <div className="flex items-start justify-between">
                                          <div>
                                            <span className="font-bold text-slate-900 dark:text-white">
                                              {tx.customerName}
                                            </span>
                                            <span className="text-[10px] text-slate-400 block">
                                              कार्ड नं: #{tx.cardNumber} • पावती: {tx.receiptNo}
                                            </span>
                                          </div>
                                          <div className="text-right">
                                            <span className="font-black text-emerald-600 dark:text-emerald-400">
                                              ₹{tx.amount}
                                            </span>
                                            <span className="text-[9px] font-bold block text-slate-500">
                                              {tx.paymentMode}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: NEW CARDS LIST */}
        {activeSubTab === 'newcards' && (
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-500" />
                  नवीन जोडलेले सभासद (New Card Registrations)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  प्रत्येक नवीन कार्डसाठी प्रतिनिधीला थेट ₹५० बोनस मिळतो
                </p>
              </div>
              <span className="px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-xs border border-blue-200 dark:border-blue-800">
                {stats.newCardsCount} कार्ड्स × ₹५० = ₹{stats.newCardsBonus.toLocaleString('en-IN')}
              </span>
            </div>

            {stats.newCardsList.length === 0 ? (
              <div className="text-center py-12 text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <CreditCard className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                <p className="text-sm font-medium">या प्रतिनिधीने निवडलेल्या कालावधीत नवीन कार्ड उघडलेले नाही.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-y border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">नोंदणी तारीख</th>
                      <th className="py-2.5 px-3">कार्ड नं</th>
                      <th className="py-2.5 px-3">योजना</th>
                      <th className="py-2.5 px-3">ग्राहकाचे नाव</th>
                      <th className="py-2.5 px-3">गाव / पत्ता</th>
                      <th className="py-2.5 px-3">मोबाईल</th>
                      <th className="py-2.5 px-3 text-right text-blue-600 dark:text-blue-400 font-bold">
                        बोनस रक्कम
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {stats.newCardsList.map((card) => (
                      <tr key={card.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                          {card.joiningDate}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                          #{card.cardNumber}
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-700 dark:text-slate-300">
                          {card.schemeName || card.schemeId}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                          {card.customerName}
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                          {card.village || card.address || '-'}
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                          {card.phone || '-'}
                        </td>
                        <td className="py-3 px-3 text-right font-black text-blue-600 dark:text-blue-400">
                          ₹50
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ADVANCES HISTORY */}
        {activeSubTab === 'advances' && (
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-amber-500" />
                  दिलेल्या ॲडव्हान्सचा हिशोब (Advance Records)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  प्रतिनिधीला महिन्यादरम्यान दिलेली उचल / ॲडव्हान्स, जो पगारातून वजा होतो
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAdvanceModal(true)}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-2xs transition flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                ॲडव्हान्स नोंदवा
              </button>
            </div>

            {stats.advancesList.length === 0 ? (
              <div className="text-center py-12 text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <Wallet className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                <p className="text-sm font-medium">या प्रतिनिधीला कोणताही ॲडव्हान्स दिलेला नाही.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-y border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">तारीख</th>
                      <th className="py-2.5 px-3">प्रतिनिधी नाव</th>
                      <th className="py-2.5 px-3">पेमेंट प्रकार</th>
                      <th className="py-2.5 px-3">कारण / नोंद</th>
                      <th className="py-2.5 px-3 text-right text-amber-600 dark:text-amber-400 font-bold">
                        ॲडव्हान्स रक्कम
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {stats.advancesList.map((adv) => (
                      <tr key={adv.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-400 font-semibold">
                          {adv.date}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                          {adv.agentName}
                        </td>
                        <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-medium">
                            {adv.paymentMode}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                          {adv.notes || 'मासिक उचल / दैनंदिन खर्च'}
                        </td>
                        <td className="py-3 px-3 text-right font-black text-amber-600 dark:text-amber-400">
                          -₹{adv.amount.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: SALES TARGETS & STAFF PERFORMANCE */}
        {activeSubTab === 'sales-targets' && (
          <div className="p-4 sm:p-6 space-y-6">
            {/* Header & Quick Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Target className="w-5 h-5 text-indigo-500" />
                  कर्मचारी विक्री टार्गेट व कामगिरी डॅशबोर्ड (Sales & Target Dashboard)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  शोरूममधील प्रत्यक्ष विक्री (Showroom Sales) + ३०-महिने बचत योजना वसुली (Card Collections) चा एकत्रित अहवाल
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const currentPerf = salesPerformanceData.find(
                    (p) => p.name.toLowerCase() === selectedAgent.toLowerCase()
                  ) || salesPerformanceData[0];
                  if (!currentPerf) return;

                  const text =
                    `🎯 *श्री साई एंटरप्रायझेस, वर्धा - कर्मचारी कामगिरी व टार्गेट अहवाल*\n\n` +
                    `👤 *कर्मचारी:* ${currentPerf.name}\n` +
                    `📅 *कालावधी:* चालू महिना\n` +
                    `🏬 *शोरूम विक्री महसूल:* ₹${currentPerf.totalRevenue.toLocaleString('en-IN')} (${currentPerf.totalOrdersCount} ऑर्डर्स)\n` +
                    `🎯 *मासिक विक्री टार्गेट:* ₹${currentPerf.monthlyTarget.toLocaleString('en-IN')}\n` +
                    `📊 *टार्गेट पूर्तता:* ${currentPerf.targetProgress}%\n` +
                    `💰 *विक्री इन्सेंटिव्ह (1%):* ₹${currentPerf.salesIncentive.toLocaleString('en-IN')}\n` +
                    `💳 *३०-महिने योजना वसुली:* ₹${currentPerf.collectionAmount.toLocaleString('en-IN')}\n` +
                    `💎 *योजना कमिशन (4%):* ₹${currentPerf.collectionCommission.toLocaleString('en-IN')}\n` +
                    `━━━━━━━━━━━━━━━━━\n` +
                    `💵 *एकूण एकत्रित कमाई (Total Earnings):* ₹${currentPerf.totalCombinedEarnings.toLocaleString('en-IN')}\n\n` +
                    `_Shri Sai Enterprises ERP System_`;

                  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                }}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs cursor-pointer shrink-0"
              >
                <Share2 className="w-4 h-4" />
                <span>WhatsApp वर कामगिरी पाठवा</span>
              </button>
            </div>

            {/* Target & Incentive KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
                  <span className="text-xs font-bold">शोरूम विक्री महसूल</span>
                  <BarChart3 className="w-4 h-4 text-indigo-500" />
                </div>
                <p className="text-xl font-black text-slate-900 dark:text-white">
                  ₹{salesPerformanceData.reduce((sum, p) => sum + p.totalRevenue, 0).toLocaleString('en-IN')}
                </p>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  सर्व कर्मचाऱ्यांचे मिळून {salesPerformanceData.reduce((sum, p) => sum + p.totalOrdersCount, 0)} ऑर्डर्स
                </span>
              </div>

              <div className="bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800/60 p-4 rounded-2xl">
                <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 mb-1">
                  <span className="text-xs font-bold">विक्री इन्सेंटिव्ह (1%)</span>
                  <Award className="w-4 h-4 text-indigo-600" />
                </div>
                <p className="text-xl font-black text-indigo-700 dark:text-indigo-300">
                  ₹{salesPerformanceData.reduce((sum, p) => sum + p.salesIncentive, 0).toLocaleString('en-IN')}
                </p>
                <span className="text-[11px] text-indigo-600/70 dark:text-indigo-400/70 mt-1 block">
                  थेट शोरूम विक्रीवरील अतिरिक्त कमिशन
                </span>
              </div>

              <div className="bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 p-4 rounded-2xl">
                <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-1">
                  <span className="text-xs font-bold">३०-महिने योजना वसुली</span>
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-xl font-black text-emerald-700 dark:text-emerald-300">
                  ₹{salesPerformanceData.reduce((sum, p) => sum + p.collectionAmount, 0).toLocaleString('en-IN')}
                </p>
                <span className="text-[11px] text-emerald-600/70 dark:text-emerald-400/70 mt-1 block">
                  कमिशन (4%): ₹{salesPerformanceData.reduce((sum, p) => sum + p.collectionCommission, 0).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 p-4 rounded-2xl">
                <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-1">
                  <span className="text-xs font-bold">मासिक टार्गेट बेंचमार्क</span>
                  <Target className="w-4 h-4 text-amber-600" />
                </div>
                <p className="text-xl font-black text-amber-700 dark:text-amber-300">
                  ₹2,00,000 / कर्मचारी
                </p>
                <span className="text-[11px] text-amber-600/70 dark:text-amber-400/70 mt-1 block">
                  टार्गेट पूर्ण झाल्यावर विशेष मासिक बोनस
                </span>
              </div>
            </div>

            {/* Staff Performance Comparison Leaderboard */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
              <div className="p-4 bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  कर्मचारी विक्री व कमिशन लीडरबोर्ड (Staff Performance Comparison)
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {salesPerformanceData.length} प्रतिनिधी कार्यरत
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4 w-12 text-center">रँक</th>
                      <th className="py-3 px-4">कर्मचारी नाव</th>
                      <th className="py-3 px-4 text-right">शोरूम विक्री</th>
                      <th className="py-3 px-4 text-right">विक्री इन्सेंटिव्ह (1%)</th>
                      <th className="py-3 px-4 text-right">योजना वसुली (4%)</th>
                      <th className="py-3 px-4 min-w-[180px]">टार्गेट प्रगती (Target %): ₹2 लाख</th>
                      <th className="py-3 px-4 text-right text-indigo-600 dark:text-indigo-400 font-bold">
                        एकूण पेआउट कमाई
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {salesPerformanceData.map((perf, idx) => {
                      const isSelected = perf.name.toLowerCase() === selectedAgent.toLowerCase();
                      return (
                        <tr
                          key={perf.name}
                          className={`transition ${
                            isSelected
                              ? 'bg-indigo-50/50 dark:bg-indigo-950/30 font-semibold'
                              : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          <td className="py-3 px-4 text-center font-bold">
                            {idx === 0 ? (
                              <span className="inline-block px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 text-xs font-black">
                                🥇 1
                              </span>
                            ) : idx === 1 ? (
                              <span className="inline-block px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200 text-xs font-black">
                                🥈 2
                              </span>
                            ) : idx === 2 ? (
                              <span className="inline-block px-2 py-0.5 rounded-full bg-amber-700/20 text-amber-800 dark:text-amber-300 text-xs font-black">
                                🥉 3
                              </span>
                            ) : (
                              <span className="text-slate-400 font-mono">#{idx + 1}</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <button
                              type="button"
                              onClick={() => setSelectedAgent(perf.name)}
                              className="font-bold text-slate-900 dark:text-white hover:text-indigo-600 text-left block cursor-pointer"
                            >
                              {perf.name}
                            </button>
                            <span className="text-[10px] text-slate-400">
                              {perf.totalOrdersCount} स्टोअर ऑर्डर्स • {perf.activeCardsCount} कार्ड ग्राहक
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                            ₹{perf.totalRevenue.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                            ₹{perf.salesIncentive.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400">
                            ₹{perf.collectionCommission.toLocaleString('en-IN')}
                            <span className="block text-[10px] text-slate-400">
                              (₹{perf.collectionAmount.toLocaleString('en-IN')})
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-bold text-slate-700 dark:text-slate-300">
                                  {perf.targetProgress}%
                                </span>
                                <span className="text-slate-400 text-[10px]">
                                  ₹{perf.totalRevenue.toLocaleString('en-IN')} / ₹{perf.monthlyTarget.toLocaleString('en-IN')}
                                </span>
                              </div>
                              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    perf.targetProgress >= 100
                                      ? 'bg-emerald-500'
                                      : perf.targetProgress >= 50
                                      ? 'bg-indigo-500'
                                      : 'bg-amber-500'
                                  }`}
                                  style={{ width: `${perf.targetProgress}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-black text-sm text-indigo-700 dark:text-indigo-300">
                            ₹{perf.totalCombinedEarnings.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Selected Agent Store Sales Breakdown */}
            {(() => {
              const currentPerf = salesPerformanceData.find(
                (p) => p.name.toLowerCase() === selectedAgent.toLowerCase()
              );
              if (!currentPerf || !currentPerf.sales || currentPerf.sales.length === 0) {
                return (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
                    <p>
                      <strong>{selectedAgent}</strong> यांनी नोंदवलेल्या थेट शोरूम विक्री पावत्या उपलब्ध नाहीत.
                    </p>
                  </div>
                );
              }

              return (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden p-4 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    {selectedAgent} - नोंदवलेल्या थेट स्टोअर विक्री पावत्या ({currentPerf.sales.length})
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="py-2 px-3">पावती क्र.</th>
                          <th className="py-2 px-3">तारीख</th>
                          <th className="py-2 px-3">ग्राहक</th>
                          <th className="py-2 px-3">वस्तू / तपशील</th>
                          <th className="py-2 px-3 text-right">रक्कम</th>
                          <th className="py-2 px-3 text-right text-indigo-600 dark:text-indigo-400 font-bold">1% इन्सेंटिव्ह</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {currentPerf.sales.slice(0, 10).map((s) => (
                          <tr key={s.id}>
                            <td className="py-2 px-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                              {s.invoiceNo}
                            </td>
                            <td className="py-2 px-3 text-slate-500">{s.date}</td>
                            <td className="py-2 px-3 font-medium text-slate-900 dark:text-white">
                              {s.customerName}
                            </td>
                            <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
                              {s.items?.map((i) => i.name).join(', ') || 'इलेक्ट्रॉनिक्स/फर्निचर'}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold">
                              ₹{(s.totalAmount || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-indigo-600 dark:text-indigo-400">
                              ₹{Math.round((s.totalAmount || 0) * 0.01).toLocaleString('en-IN')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {showAdvanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Wallet className="w-4 h-4 text-amber-500" />
                प्रतिनिधीला ॲडव्हान्स नोंदवा
              </h3>
              <button
                type="button"
                onClick={() => setShowAdvanceModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAdvance} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  प्रतिनिधीचे नाव
                </label>
                <input
                  type="text"
                  value={selectedAgent}
                  disabled
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    ॲडव्हान्स रक्कम (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={advanceAmount}
                    onChange={(e) => setAdvanceAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-black text-amber-600 dark:text-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    तारीख *
                  </label>
                  <input
                    type="date"
                    required
                    value={advanceDate}
                    onChange={(e) => setAdvanceDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  पेमेंट पद्धत
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdvanceMode('Cash')}
                    className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      advanceMode === 'Cash'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    💵 रोख (Cash)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdvanceMode('Online')}
                    className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      advanceMode === 'Online'
                        ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-700 dark:text-blue-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    📱 ऑनलाइन (UPI)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  कारण किंवा टीप (Note)
                </label>
                <input
                  type="text"
                  placeholder="उदा. पेट्रोल खर्च, घरगुती उचल, सण ॲडव्हान्स..."
                  value={advanceNotes}
                  onChange={(e) => setAdvanceNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdvanceModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  रद्द करा
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  सेव्ह करा (Save Advance)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SALARY SETTLEMENT SLIP */}
      {showSlipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-2xl print:p-0 print:border-none">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                महिनाअखेर पगार पावती (Agent Salary Slip)
              </span>
              <button
                type="button"
                onClick={() => setShowSlipModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable Slip Content */}
            <div id="printable-agent-commission" className="py-4 space-y-4 text-slate-800 dark:text-slate-200 print:text-black print:bg-white print:p-0">
              <div className="text-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  {settings.businessNameHindi || 'श्री साई इंटरप्राइजेस'}
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {settings.addressHindi || settings.address}
                </p>
                <p className="text-[11px] font-mono font-bold text-slate-600 dark:text-slate-300">
                  मोबाईल: {settings.phone} {settings.additionalPhones?.[0] ? `• ${settings.additionalPhones[0]}` : ''}
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">प्रतिनिधीचे नाव:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{stats.agentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">कालावधी:</span>
                  <span className="font-medium">
                    {dateRange?.startDate || 'सुरुवात'} ते {dateRange?.endDate || 'आज'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">पावती तारीख:</span>
                  <span className="font-medium">{new Date().toLocaleDateString('mr-IN')}</span>
                </div>
              </div>

              {/* Breakdown Table */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden text-xs">
                <table className="w-full">
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                      <td className="p-2.5">हप्ता एकूण वसुली (Collection)</td>
                      <td className="p-2.5 text-right font-bold">
                        ₹{stats.totalCollection.toLocaleString('en-IN')}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-emerald-700 dark:text-emerald-300">
                        ४% कमिशन (पगार हिशोब)
                      </td>
                      <td className="p-2.5 text-right font-black text-emerald-600 dark:text-emerald-400">
                        +₹{stats.commissionAmount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-blue-700 dark:text-blue-300">
                        नवीन कार्ड नोंदणी ({stats.newCardsCount} कार्ड्स × ₹५०)
                      </td>
                      <td className="p-2.5 text-right font-black text-blue-600 dark:text-blue-400">
                        +₹{stats.newCardsBonus.toLocaleString('en-IN')}
                      </td>
                    </tr>
                    <tr className="bg-purple-50/40 dark:bg-purple-950/20 font-bold">
                      <td className="p-2.5 text-purple-900 dark:text-purple-200">
                        एकूण कमाई (Total Gross Earnings)
                      </td>
                      <td className="p-2.5 text-right text-purple-700 dark:text-purple-300 font-black">
                        ₹{stats.totalGrossEarnings.toLocaleString('en-IN')}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2.5 text-amber-700 dark:text-amber-300 font-bold">
                        वजा: दिलेला ॲडव्हान्स (Advance Disbursed)
                      </td>
                      <td className="p-2.5 text-right text-amber-600 dark:text-amber-400 font-black">
                        -₹{stats.advancePaid.toLocaleString('en-IN')}
                      </td>
                    </tr>
                    <tr className="bg-emerald-600 text-white font-bold text-sm">
                      <td className="p-3">निव्वळ देय पगार (Net Salary Payable)</td>
                      <td className="p-3 text-right font-black text-base">
                        ₹{stats.netPayableSalary.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Signatures */}
              <div className="pt-8 grid grid-cols-2 text-center text-xs text-slate-500">
                <div>
                  <div className="border-t border-slate-300 dark:border-slate-700 w-32 mx-auto pt-1 font-semibold text-slate-700 dark:text-slate-300">
                    प्रतिनिधी सही
                  </div>
                </div>
                <div>
                  <div className="border-t border-slate-300 dark:border-slate-700 w-32 mx-auto pt-1 font-semibold text-slate-700 dark:text-slate-300">
                    मालिक / व्यवस्थापक सही
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 gap-2">
              <button
                type="button"
                onClick={handleShareWhatsAppSlip}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                WhatsApp वर पाठवा
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white hover:bg-slate-800 text-white dark:text-slate-900 text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                प्रिंट करा
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
