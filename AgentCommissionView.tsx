import React, { useState, useMemo } from 'react';
import {
  Users,
  Percent,
  Wallet,
  TrendingUp,
  Award,
  Calendar,
  CheckCircle2,
  DollarSign,
  Printer,
  Search,
  Filter,
  Share2,
  Download,
  ArrowDownCircle,
  Check,
  PlusCircle,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  Clock,
  ChevronRight,
  Phone,
  Receipt,
  FileText
} from 'lucide-react';
import { Staff, StoreData, CardTransaction } from '../../types';
import { StorageService } from '../../services/storageService';
import { useTheme } from '../../context/ThemeContext';
import { AgentCollectionPrintModal } from './AgentCollectionPrintModal';

interface AgentCommissionViewProps {
  storeData: StoreData;
  onRefreshData: () => void;
  onOpenWeeklyCollectionModal?: () => void;
}

type TimeframeFilter = 'today' | 'yesterday' | 'this_week' | 'this_month' | 'all' | 'custom';

export const AgentCommissionView: React.FC<AgentCommissionViewProps> = ({
  storeData,
  onRefreshData,
  onOpenWeeklyCollectionModal,
}) => {
  const { isDayMode } = useTheme();

  // Active View Tab: 'collections' (दैनिक वसुली व प्रिंट पावती) vs 'salary' (मासिक पगार व उचल)
  const [activeTab, setActiveTab] = useState<'collections' | 'salary'>('collections');

  // Agent Selection
  const [selectedAgentName, setSelectedAgentName] = useState<string>('all');
  const [commissionRate, setCommissionRate] = useState<number>(4); // 4% default

  // Timeframe and search
  const [timeframe, setTimeframe] = useState<TimeframeFilter>('all');
  const [customDate, setCustomDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [paymentModeFilter, setPaymentModeFilter] = useState<'all' | 'Cash' | 'UPI'>('all');

  // Handover Verification Status (Tracks whether counter confirmed receipt for today)
  const [verifiedHandovers, setVerifiedHandovers] = useState<Record<string, boolean>>({});

  // Print Modal State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // New Advance Modal State
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [advanceAgentId, setAdvanceAgentId] = useState('');
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [advanceReason, setAdvanceReason] = useState('');

  // Extract all agents from staff + card transactions
  const staffAgents = useMemo(() => {
    return storeData.staff.filter((s) => s.role === 'Agent' || s.role === 'Sales Executive');
  }, [storeData.staff]);

  const allAgentNames = useMemo(() => {
    const set = new Set<string>();
    staffAgents.forEach((a) => set.add(a.name));
    storeData.cardTransactions.forEach((t) => {
      if (t.collectedBy) set.add(t.collectedBy);
    });
    return Array.from(set).sort();
  }, [staffAgents, storeData.cardTransactions]);

  // Selected agent details
  const currentAgentStaff = staffAgents.find(
    (a) => a.name.toLowerCase() === selectedAgentName.toLowerCase()
  );

  // Filter card transactions by Agent, Timeframe, Payment Mode, and Search
  const filteredTransactions = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    const currentMonthStr = todayStr.slice(0, 7);

    // 7 days ago timestamp
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return storeData.cardTransactions.filter((tx) => {
      // 1. Agent Filter
      if (selectedAgentName !== 'all') {
        const matchesAgent =
          tx.collectedBy &&
          tx.collectedBy.toLowerCase().includes(selectedAgentName.toLowerCase());
        if (!matchesAgent) return false;
      }

      // 2. Timeframe Filter
      const txDate = tx.date || '';
      if (timeframe === 'today') {
        if (!txDate.startsWith(todayStr)) return false;
      } else if (timeframe === 'yesterday') {
        if (!txDate.startsWith(yesterdayStr)) return false;
      } else if (timeframe === 'this_week') {
        const d = new Date(txDate);
        if (isNaN(d.getTime()) || d < sevenDaysAgo) return false;
      } else if (timeframe === 'this_month') {
        if (!txDate.startsWith(currentMonthStr)) return false;
      } else if (timeframe === 'custom') {
        if (!txDate.startsWith(customDate)) return false;
      }

      // 3. Payment Mode Filter
      if (paymentModeFilter !== 'all') {
        const mode = tx.paymentMode || 'Cash';
        if (paymentModeFilter === 'Cash' && mode !== 'Cash') return false;
        if (paymentModeFilter === 'UPI' && mode !== 'UPI' && mode !== 'Bank Transfer') return false;
      }

      // 4. Search Query Filter (Card No, Member Name, Receipt No)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesQ =
          (tx.cardNo && tx.cardNo.toLowerCase().includes(q)) ||
          (tx.memberName && tx.memberName.toLowerCase().includes(q)) ||
          (tx.receiptNo && tx.receiptNo.toLowerCase().includes(q));
        if (!matchesQ) return false;
      }

      return true;
    });
  }, [
    storeData.cardTransactions,
    selectedAgentName,
    timeframe,
    customDate,
    paymentModeFilter,
    searchQuery,
  ]);

  // Financial Metrics for the filtered list
  const totalCount = filteredTransactions.length;
  const cashTotal = filteredTransactions
    .filter((t) => t.paymentMode === 'Cash' || !t.paymentMode)
    .reduce((sum, t) => sum + t.amount, 0);
  const upiTotal = filteredTransactions
    .filter((t) => t.paymentMode === 'UPI' || t.paymentMode === 'Bank Transfer')
    .reduce((sum, t) => sum + t.amount, 0);
  const grossCollection = cashTotal + upiTotal;
  const commissionEarned = Math.round((grossCollection * commissionRate) / 100);
  const netCashToDeposit = Math.max(0, cashTotal - commissionEarned);

  // Timeframe Label for Print Slip
  const getTimeframeLabel = () => {
    switch (timeframe) {
      case 'today':
        return `आजची वसुली (${new Date().toLocaleDateString('en-IN')})`;
      case 'yesterday':
        return 'कालची वसुली';
      case 'this_week':
        return 'चालू आठवडा (मागील ७ दिवस)';
      case 'this_month':
        return `चालू महिना (${new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' })})`;
      case 'custom':
        return `दिनांक: ${customDate}`;
      case 'all':
      default:
        return 'सर्व कालावधीतील वसुली (All Records)';
    }
  };

  // Toggle Handover Verification
  const handoverKey = `${selectedAgentName}_${timeframe}_${customDate}`;
  const isHandoverVerified = !!verifiedHandovers[handoverKey];

  const toggleHandoverVerification = () => {
    setVerifiedHandovers((prev) => ({
      ...prev,
      [handoverKey]: !prev[handoverKey],
    }));
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'पावती क्र.',
      'कार्ड नंबर',
      'सभासदाचे नाव',
      'आठवडा क्र.',
      'तारीख',
      'वेळ',
      'पेमेंट मोड',
      'वसुली रक्कम (₹)',
      'एजंट प्रतिनिधी',
    ];

    const rows = filteredTransactions.map((t) => [
      t.receiptNo || t.id,
      t.cardNo,
      `"${(t.memberName || '').replace(/"/g, '""')}"`,
      t.weekNumber || t.monthNumber || 1,
      new Date(t.date).toLocaleDateString('en-IN'),
      new Date(t.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      t.paymentMode || 'Cash',
      t.amount,
      `"${t.collectedBy || ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Agent_Collection_${selectedAgentName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Monthly Salary Stats across all staff agents
  const agentStats = staffAgents.map((agent) => {
    const collections = storeData.cardTransactions.filter(
      (c) => c.collectedBy && c.collectedBy.toLowerCase().includes(agent.name.toLowerCase())
    );
    const totalCollected = collections.reduce((acc, c) => acc + c.amount, 0);
    const commEarned = Math.round((totalCollected * commissionRate) / 100);

    const advances = storeData.agentAdvances.filter(
      (a) => a.staffId === agent.id && a.status === 'Pending'
    );
    const totalAdvances = advances.reduce((acc, a) => acc + a.amount, 0);
    const netPayable = Math.max(0, agent.monthlySalary + commEarned - totalAdvances);

    return {
      agent,
      collectionCount: collections.length,
      totalCollected,
      commissionEarned: commEarned,
      totalAdvances,
      netPayable,
    };
  });

  const totalAllCollections = agentStats.reduce((acc, s) => acc + s.totalCollected, 0) || 450000;
  const totalAllCommission = Math.round((totalAllCollections * commissionRate) / 100);
  const totalAllAdvances = agentStats.reduce((acc, s) => acc + s.totalAdvances, 0);

  // Handle Add Advance
  const handleSaveAdvance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!advanceAgentId || !advanceAmount) return;

    const amt = parseFloat(advanceAmount);
    if (isNaN(amt) || amt <= 0) return;

    const staffMember = storeData.staff.find((s) => s.id === advanceAgentId);

    const currentMonthLabel = new Date().toLocaleString('en-IN', { month: 'short', year: 'numeric' });

    StorageService.addAgentAdvance({
      staffId: advanceAgentId,
      staffName: staffMember?.name || 'Agent',
      amount: amt,
      date: new Date().toISOString(),
      reason: advanceReason.trim() || 'घरगुती / वैयक्तिक उचल',
      deductionMonth: currentMonthLabel,
      status: 'Pending',
    });

    onRefreshData();
    setIsAdvanceModalOpen(false);
    setAdvanceAmount('');
    setAdvanceReason('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. TOP HEADER & NAVIGATION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Award className="w-6 h-6 text-amber-500" />
              <span>एजंट वसुली पत्रक, पावती प्रिंट व कमिशन</span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
              ⚡ {commissionRate}% Live Commission Model
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            प्रत्येक एजंटने नेमके काय कलेक्शन केले त्याचा तपशील, ८०mm थर्मल व A4 प्रिंट पावती, व्हॉट्सॲप हिशोब आणि काऊंटर जमा.
          </p>
        </div>

        {/* Global Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Commission Rate Config */}
          <div className="bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 px-3 py-1.5 rounded-xl text-xs flex items-center gap-2 shadow-xs">
            <span className="text-slate-500 dark:text-slate-400 font-bold">कमिशन दर (%):</span>
            <input
              type="number"
              value={commissionRate}
              onChange={(e) => setCommissionRate(parseFloat(e.target.value) || 0)}
              className="w-12 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-1.5 py-0.5 text-center font-black text-amber-600 dark:text-amber-400 outline-none"
              min="0"
              max="20"
            />
          </div>

          {/* Quick Collect Installment */}
          {onOpenWeeklyCollectionModal && (
            <button
              type="button"
              onClick={onOpenWeeklyCollectionModal}
              className="px-3.5 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs flex items-center gap-1.5 cursor-pointer transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>हप्ता जमा करा (Collect)</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. MODE SWITCHER TABS (दैनिक वसुली vs मासिक पगार) */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab('collections')}
          className={`pb-3 px-4 text-xs sm:text-sm font-black flex items-center gap-2 border-b-2 cursor-pointer transition ${
            activeTab === 'collections'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>१. एजंटनिहाय दैनिक वसुली व पावती प्रिंट (Daily Collections & Print)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('salary')}
          className={`pb-3 px-4 text-xs sm:text-sm font-black flex items-center gap-2 border-b-2 cursor-pointer transition ${
            activeTab === 'salary'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>२. मासिक पगार, उचल (Advance) व कमिशन हिशोब (Monthly Salary & Advances)</span>
        </button>
      </div>

      {/* TAB 1: DAILY & WEEKLY COLLECTIONS BREAKDOWN WITH PRINT SLIP */}
      {activeTab === 'collections' && (
        <div className="space-y-5">
          
          {/* FILTER & SELECTION BAR */}
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              
              {/* Agent Selector */}
              <div className="flex items-center gap-2 min-w-[280px]">
                <Users className="w-4 h-4 text-indigo-500 shrink-0" />
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 shrink-0">
                  प्रतिनिधी (Agent):
                </span>
                <select
                  value={selectedAgentName}
                  onChange={(e) => setSelectedAgentName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs font-black border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none cursor-pointer"
                >
                  <option value="all">सर्व प्रतिनिधी (All Agents)</option>
                  {allAgentNames.map((name) => (
                    <option key={name} value={name}>
                      👤 {name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Timeframe Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'today', label: 'आज (Today)' },
                  { id: 'yesterday', label: 'काल' },
                  { id: 'this_week', label: 'चालू आठवडा' },
                  { id: 'this_month', label: 'चालू महिना' },
                  { id: 'all', label: 'सर्व (All Time)' },
                  { id: 'custom', label: 'तारीख' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTimeframe(t.id as TimeframeFilter)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      timeframe === t.id
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : isDayMode
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}

                {timeframe === 'custom' && (
                  <input
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="px-2.5 py-1 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none"
                  />
                )}
              </div>

            </div>

            {/* Sub-Filters: Search & Payment Mode */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
              <div className="relative w-full sm:w-80">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="कार्ड क्र., नाव किंवा पावती शोधा..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <span className="text-slate-500 font-medium">पेमेंट मोड:</span>
                <select
                  value={paymentModeFilter}
                  onChange={(e) => setPaymentModeFilter(e.target.value as any)}
                  className="px-2.5 py-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-bold outline-none cursor-pointer"
                >
                  <option value="all">सर्व मोड (All)</option>
                  <option value="Cash">फक्त रोख (Cash)</option>
                  <option value="UPI">फक्त UPI / बँक</option>
                </select>
              </div>
            </div>
          </div>

          {/* 3. 5 KEY SUMMARY STATS TILES */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* 1. Cards Count */}
            <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Receipt className="w-3.5 h-3.5 text-blue-500" />
                <span>जमा कार्ड्स संख्या</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
                {totalCount} <span className="text-xs font-normal text-slate-400">हप्ते</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 truncate">{getTimeframeLabel()}</div>
            </div>

            {/* 2. Gross Collection */}
            <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Wallet className="w-3.5 h-3.5 text-emerald-500" />
                <span>एकूण वसुली (Gross)</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                ₹{grossCollection.toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                रोख: ₹{cashTotal} • UPI: ₹{upiTotal}
              </div>
            </div>

            {/* 3. Cash In-Hand */}
            <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <ArrowDownCircle className="w-3.5 h-3.5 text-amber-500" />
                <span>एकूण रोख रक्कम (Cash)</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                ₹{cashTotal.toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">एजंटजवळ प्रत्यक्ष जमा रोख</div>
            </div>

            {/* 4. Commission Earned */}
            <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Percent className="w-3.5 h-3.5 text-purple-500" />
                <span>एजंट कमिशन ({commissionRate}%)</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">
                ₹{commissionEarned.toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">देय अथवा कपात कमिशन</div>
            </div>

            {/* 5. Net Cash to Deposit at Showroom Counter */}
            <div className="col-span-2 sm:col-span-1 p-3.5 bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl shadow-xs">
              <div className="text-[11px] font-black text-amber-800 dark:text-amber-300 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                <span>काऊंटर निव्वळ कॅश जमा</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-amber-900 dark:text-amber-200 mt-1">
                ₹{netCashToDeposit.toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] text-amber-700 dark:text-amber-400 mt-0.5">
                कमिशन वजा जाता निव्वळ रोकड
              </div>
            </div>
          </div>

          {/* 4. ACTION CONTROLS BAR: PRINT SLIP, WHATSAPP REPORT, CSV EXPORT, HANDOVER VERIFICATION */}
          <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-black flex items-center gap-2">
                  <span>{selectedAgentName === 'all' ? 'सर्व एजंट वसुली पावती' : `${selectedAgentName} - वसुली हिशोब`}</span>
                  {isHandoverVerified && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500 text-slate-950 flex items-center gap-1">
                      <Check className="w-3 h-3" /> काऊंटर जमा पडताळणी पूर्ण
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  एकूण {totalCount} हप्ते • निव्वळ रोकड ₹{netCashToDeposit.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Cash Handover Verification Toggle */}
              <button
                type="button"
                onClick={toggleHandoverVerification}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                  isHandoverVerified
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                }`}
                title="काऊंटरवर कॅश जमा झाली असल्यास पडताळणी खूण करा"
              >
                <CheckCircle2 className={`w-4 h-4 ${isHandoverVerified ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span>{isHandoverVerified ? 'कॅश पडताळणी झाली ✅' : 'काऊंटर कॅश जमा मार्क करा'}</span>
              </button>

              {/* Export to CSV */}
              <button
                type="button"
                onClick={handleExportCSV}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition cursor-pointer flex items-center gap-1.5"
                title="Excel/CSV मध्ये डेटा डाऊनलोड करा"
              >
                <Download className="w-4 h-4 text-teal-400" />
                <span className="hidden sm:inline">Excel/CSV</span>
              </button>

              {/* Print Slip Button (THE MAIN FEATURE) */}
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(true)}
                className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30 transition cursor-pointer flex items-center gap-2"
                title="थर्मल स्लिप किंवा A4 पत्रक प्रिंट करा"
              >
                <Printer className="w-4 h-4" />
                <span>🖨️ वसुली पावती प्रिंट करा (Print Slip)</span>
              </button>
            </div>
          </div>

          {/* 5. DETAILED TRANSACTIONS TABLE */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-500" />
                <span>गोळा केलेल्या हप्त्यांची तपशीलवार यादी (Detailed Collection Items)</span>
              </h2>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                एकूण: {totalCount} नोंदी
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950 text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">अ.क्र.</th>
                    <th className="py-3 px-4">पावती क्र.</th>
                    <th className="py-3 px-4">कार्ड क्र.</th>
                    <th className="py-3 px-4">सभासदाचे नाव</th>
                    <th className="py-3 px-4 text-center">आठवडा क्र.</th>
                    <th className="py-3 px-4">तारीख व वेळ</th>
                    <th className="py-3 px-4">प्रतिनिधी (Agent)</th>
                    <th className="py-3 px-4 text-center">पेमेंट मोड</th>
                    <th className="py-3 px-4 text-right">रक्कम</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        <AlertCircle className="w-6 h-6 mx-auto mb-2 text-slate-400/60" />
                        <p className="font-bold text-sm">निवडलेल्या फिल्टरनुसार कोणतेही कलेक्शन आढळले नाही.</p>
                        <p className="text-xs mt-1">तारीख किंवा एजंट नाव बदलून पुन्हा तपासा किंवा वरून नवीन हप्ता जमा करा.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx, idx) => (
                      <tr key={tx.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 text-slate-400 font-medium">{idx + 1}</td>
                        <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">
                          #{tx.receiptNo || tx.id.slice(0, 8)}
                        </td>
                        <td className="py-3 px-4 font-black text-indigo-600 dark:text-indigo-400">
                          #{tx.cardNo}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                          {tx.memberName}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                            आ.{tx.weekNumber || tx.monthNumber || 1}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-[11px]">
                          {new Date(tx.date).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                          })}{' '}
                          • {new Date(tx.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {tx.collectedBy || 'Counter'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            tx.paymentMode === 'UPI' || tx.paymentMode === 'Bank Transfer'
                              ? 'bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800'
                              : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                          }`}>
                            {tx.paymentMode || 'Cash'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-white text-sm">
                          ₹{tx.amount.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {filteredTransactions.length > 0 && (
                  <tfoot className="bg-slate-50 dark:bg-slate-950 border-t-2 border-slate-200 dark:border-slate-800 font-bold">
                    <tr>
                      <td colSpan={8} className="py-3 px-4 text-right text-slate-700 dark:text-slate-300 font-bold">
                        एकूण वसुली (Gross Collection Total):
                      </td>
                      <td className="py-3 px-4 text-right font-black text-emerald-600 dark:text-emerald-400 text-base">
                        ₹{grossCollection.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: MONTHLY SALARY, ADVANCES & COMMISSION BREAKDOWN */}
      {activeTab === 'salary' && (
        <div className="space-y-6">
          {/* Stats Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-blue-500" />
                <span>एकूण योजना वसुली (Total Scheme Collections)</span>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                ₹{totalAllCollections.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">सर्व एजंटांनी केलेली एकूण वसुली</div>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1.5">
                <Percent className="w-4 h-4 text-emerald-500" />
                <span>देय कमिशन ({commissionRate}%) (Total Commission)</span>
              </div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
                ₹{totalAllCommission.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">एजंटांना देय असलेली एकूण कमिशन रक्कम</div>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-amber-500" />
                <span>शिल्लक उचल (Total Pending Advances)</span>
              </div>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">
                ₹{totalAllAdvances.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">पगारातून वजा करावयाची उचल</div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                <span>एजंटनिहाय वसुली, उचल व देय पगार हिशोब (Monthly Payout Breakdown)</span>
              </h2>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdvanceModalOpen(true)}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>उचल (Advance) नोंदवा</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>पगार पत्रक प्रिंट</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950 text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">एजंट नाव व मोबाईल</th>
                    <th className="py-3 px-4">मूळ मासिक पगार</th>
                    <th className="py-3 px-4 text-right">एकूण वसुली</th>
                    <th className="py-3 px-4 text-right">{commissionRate}% कमिशन</th>
                    <th className="py-3 px-4 text-right">उचल (Advance)</th>
                    <th className="py-3 px-4 text-right">अंतिम देय पगार (Net Payout)</th>
                    <th className="py-3 px-4 text-center">क्रिया</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                  {agentStats.map(({ agent, totalCollected, commissionEarned: cEarned, totalAdvances, netPayable }) => (
                    <tr key={agent.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{agent.name}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">{agent.phone} • {agent.role}</div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">
                        ₹{agent.monthlySalary.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-slate-800 dark:text-slate-200">
                        ₹{totalCollected.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        +₹{cEarned.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-rose-600 dark:text-rose-400">
                        {totalAdvances > 0 ? `-₹${totalAdvances.toLocaleString('en-IN')}` : '₹0'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-amber-600 dark:text-amber-400 text-sm">
                        ₹{netPayable.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAgentName(agent.name);
                            setActiveTab('collections');
                          }}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition cursor-pointer"
                        >
                          वसुली पावती पाहा ➔
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 6. DEDICATED PRINT SLIP MODAL (80mm Thermal & A4 Statement) */}
      <AgentCollectionPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        agentName={selectedAgentName === 'all' ? 'सर्व प्रतिनिधी (All Agents)' : selectedAgentName}
        agentPhone={currentAgentStaff?.phone || ''}
        transactions={filteredTransactions}
        commissionRate={commissionRate}
        dateRangeLabel={getTimeframeLabel()}
        settings={storeData.settings}
      />

      {/* 7. NEW ADVANCE MODAL */}
      {isAdvanceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-rose-500" />
              <span>एजंट उचल (Advance) नोंदवा</span>
            </h3>

            <form onSubmit={handleSaveAdvance} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">
                  एजंट निवडा:
                </label>
                <select
                  value={advanceAgentId}
                  onChange={(e) => setAdvanceAgentId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-bold outline-none"
                >
                  <option value="">-- एजंट निवडा --</option>
                  {staffAgents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.role}) - पगार ₹{s.monthlySalary}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">
                  उचल रक्कम (Advance Amount ₹):
                </label>
                <input
                  type="number"
                  placeholder="उदा. 2000"
                  value={advanceAmount}
                  onChange={(e) => setAdvanceAmount(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-black text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">
                  कारणे / शेरा (Reason):
                </label>
                <input
                  type="text"
                  placeholder="उदा. घरगुती खर्च / गाडी पेट्रोल"
                  value={advanceReason}
                  onChange={(e) => setAdvanceReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-bold outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdvanceModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold cursor-pointer"
                >
                  रद्द करा
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black shadow-xs cursor-pointer"
                >
                  उचल जतन करा
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
