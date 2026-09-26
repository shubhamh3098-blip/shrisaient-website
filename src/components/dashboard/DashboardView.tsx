import React, { useState } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  Wallet,
  ShoppingBag,
  Users,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Clock,
  Printer,
  Sparkles,
  Plus,
  Receipt,
  CheckCircle2,
  FileSpreadsheet,
  Target,
  UserCheck,
  ChevronRight,
  Flame,
  ArrowRight,
  Percent,
  RefreshCw,
  Award,
  Filter,
  ShieldCheck,
  Coins,
  FileText,
  QrCode,
  Barcode,
  ShieldAlert,
  Truck,
  Trophy
} from 'lucide-react';
import { StoreData, Transaction } from '../../types';
import { NavTab } from '../Sidebar';
import { useTheme } from '../../context/ThemeContext';
import { GalaxyButton } from '../common/GalaxyButton';

interface DashboardViewProps {
  storeData: StoreData;
  onNavigate: (tab: NavTab) => void;
  onOpenInvoicePrint: (tx: Transaction) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  storeData,
  onNavigate,
  onOpenInvoicePrint,
}) => {
  const { isDayMode } = useTheme();
  const todayStr = new Date().toISOString().slice(0, 10);
  const currentMonthStr = new Date().toISOString().slice(0, 7);

  const [agentTimeframe, setAgentTimeframe] = useState<'today' | 'month'>('today');
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<string>('all');

  // Filter agents from staff list
  const agents = storeData.staff.filter(
    (s) => s.role === 'Agent' || s.role === 'Sales Executive' || s.role === 'Cashier'
  );

  // Fallback default agents list if none are tagged
  const activeAgents = agents.length > 0 ? agents : [
    { id: 'stf-1', name: 'Bhushan Lidbe', role: 'Agent' as const, phone: '+91 87664 86915', monthlySalary: 25000, joiningDate: '2022-01-01', isActive: true },
    { id: 'stf-2', name: 'Shubham Shende', role: 'Agent' as const, phone: '+91 86001 22978', monthlySalary: 25000, joiningDate: '2022-01-01', isActive: true },
    { id: 'stf-3', name: 'Suraj Moon', role: 'Agent' as const, phone: '+91 91755 34365', monthlySalary: 22000, joiningDate: '2022-06-01', isActive: true },
    { id: 'stf-4', name: 'Rahul Wankhede', role: 'Agent' as const, phone: '+91 97664 11220', monthlySalary: 18000, joiningDate: '2023-02-15', isActive: true },
    { id: 'stf-5', name: 'Sachin Deshmukh', role: 'Agent' as const, phone: '+91 94220 33441', monthlySalary: 18000, joiningDate: '2023-04-10', isActive: true },
  ];

  // Assigned Routes / Sectors map for Shri Sai Enterprises Wardha
  const agentRoutes: Record<string, string> = {
    'Bhushan Lidbe': 'मुख्य शोरूम व सिनियर रिकव्हरी (Head Agent • 8766486915)',
    'Shubham Shende': 'वर्धा शहर, सावंगी मेघे व सिंधी (Wardha-Sawangi • 8600122978)',
    'Suraj Moon': 'वायफड, सेलू व बोरगाव बीट (Waifad-Seloo • 9175534365)',
    'Rahul Wankhede': 'ग्रामीण संकलन बीट (Rural Collection)',
    'Sachin Deshmukh': 'शहर उपनगर व सेवाग्राम (Sewagram Beat)',
    'Pravin Raut': 'हिंगणघाट, देवळी व पुलगाव (Hinganghat-Deoli)',
    'Aniket Gawande': 'स्थानिक काऊंटर व तात्काळ वसुली (Sales Exec)',
    'Rahul Joshi': 'कॅश काऊंटर व जमा पावती (Cashier)',
    'Mahesh Sharma': 'शोरूम मॅनेजर (Manager)',
  };

  // Check if a date matches the active timeframe
  const isWithinTimeframe = (dateStr: string) => {
    if (agentTimeframe === 'today') {
      return dateStr.startsWith(todayStr);
    }
    return dateStr.startsWith(currentMonthStr);
  };

  // Calculate agent-by-agent metrics
  const agentPerformanceList = activeAgents.map((ag) => {
    const agNameLower = ag.name.toLowerCase();

    // 1. New Bill Sales Cash/Advance collected by this agent
    const newBillSales = storeData.transactions.filter(
      (t) =>
        isWithinTimeframe(t.date) &&
        (t.createdBy?.toLowerCase().includes(agNameLower) ||
          (ag.name.includes('Bhushan') && (!t.createdBy || t.createdBy.includes('Admin'))))
    );
    const newBillCollected = newBillSales.reduce((acc, t) => acc + t.paidAmount, 0);

    // 2. Old customer balance dues recovered via Bill Receipts
    const duesReceipts = storeData.billReceipts.filter(
      (r) =>
        isWithinTimeframe(r.date) &&
        r.handledBy?.toLowerCase().includes(agNameLower)
    );
    const duesRecovered = duesReceipts.reduce((acc, r) => acc + r.amountPaid, 0);

    // 3. 30-Month scheme card installments collected
    const schemeReceipts = storeData.cardTransactions.filter(
      (c) =>
        isWithinTimeframe(c.date) &&
        c.collectedBy?.toLowerCase().includes(agNameLower)
    );
    const schemeCollected = schemeReceipts.reduce((acc, c) => acc + c.amount, 0);

    const totalCollected = newBillCollected + duesRecovered + schemeCollected;
    const totalReceiptsCount = newBillSales.length + duesReceipts.length + schemeReceipts.length;
    const commission4Pct = Math.round((totalCollected * 4) / 100);

    // Daily target (₹10,000 for today, ₹2,50,000 for month)
    const targetAmount = agentTimeframe === 'today' ? 10000 : 250000;
    const achievementPct = Math.min(100, Math.round((totalCollected / targetAmount) * 100));

    return {
      agent: ag,
      route: agentRoutes[ag.name] || 'वर्धा शहर व ग्रामीण बीट (Field)',
      newBillCollected,
      newBillCount: newBillSales.length,
      duesRecovered,
      duesCount: duesReceipts.length,
      schemeCollected,
      schemeCount: schemeReceipts.length,
      totalCollected,
      totalReceiptsCount,
      commission4Pct,
      targetAmount,
      achievementPct,
    };
  });

  // Overall totals for the Agent Live Tracking Strip
  const totalAllAgentRecovery = agentPerformanceList.reduce((acc, a) => acc + a.totalCollected, 0);
  const totalAllNewBills = agentPerformanceList.reduce((acc, a) => acc + a.newBillCollected, 0);
  const totalAllDuesRecovered = agentPerformanceList.reduce((acc, a) => acc + a.duesRecovered, 0);
  const totalAllSchemeCollected = agentPerformanceList.reduce((acc, a) => acc + a.schemeCollected, 0);
  const totalAllCommission4Pct = Math.round((totalAllAgentRecovery * 4) / 100);

  // Live recent collection activity feed across receipts, card deposits, and sales
  const recentActivities = [
    ...storeData.billReceipts.map((r) => ({
      id: r.id,
      date: r.date,
      refNo: `पावती #${r.receiptNo}`,
      agentName: r.handledBy || 'Bhushan Lidbe',
      customerName: r.customerName,
      type: 'जुनी उधारी वसुली (Dues Receipt)',
      typeColor: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
      mode: r.paymentMode,
      amount: r.amountPaid,
      note: r.remarks || 'उधारी वसुली जमा',
    })),
    ...storeData.cardTransactions.map((c) => ({
      id: c.id,
      date: c.date,
      refNo: `कार्ड #${c.cardNo}`,
      agentName: c.collectedBy || 'Rahul Wankhede',
      customerName: c.memberName,
      type: 'योजना हप्ता (Scheme Installment)',
      typeColor: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
      mode: c.paymentMode,
      amount: c.amount,
      note: `${c.monthNumber} वा हप्ता जमा`,
    })),
    ...storeData.transactions.filter((t) => t.paidAmount > 0).map((t) => ({
      id: t.id,
      date: t.date,
      refNo: t.invoiceNo,
      agentName: t.createdBy || 'Bhushan Lidbe',
      customerName: t.customerName,
      type: 'नवीन विक्री बिल (New Bill Cash)',
      typeColor: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
      mode: t.paymentMode,
      amount: t.paidAmount,
      note: `नवीन बिल तात्काळ वसुली (एकूण: ₹${t.grandTotal})`,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  // General Store KPIs
  const todayTransactions = storeData.transactions.filter((t) => t.date.startsWith(todayStr));
  const todaySalesTotal = todayTransactions.reduce((acc, t) => acc + t.grandTotal, 0);
  const todayCashCollected = todayTransactions.reduce(
    (acc, t) => acc + (t.paymentMode === 'Cash' ? t.paidAmount : 0),
    0
  );

  const totalCustomerDues = storeData.customers.reduce((acc, c) => acc + c.currentBalance, 0);
  const totalStockUnits = storeData.stock.reduce((acc, s) => acc + s.stockQty, 0);
  const totalStockCost = storeData.stock.reduce((acc, s) => acc + s.purchasePrice * s.stockQty, 0);
  const totalStockSaleValue = storeData.stock.reduce((acc, s) => acc + s.salePrice * s.stockQty, 0);

  const activeSchemeMembers = storeData.cardMembers.filter((m) => m.status === 'Active').length;
  const totalSchemePoolDeposited = storeData.cardMembers.reduce((acc, m) => acc + m.totalAmountPaid, 0);

  const todayReceipts = storeData.billReceipts.filter((r) => r.date.startsWith(todayStr));
  const todayReceiptsTotal = todayReceipts.reduce((acc, r) => acc + r.amountPaid, 0);

  const todaySchemeTx = storeData.cardTransactions.filter((c) => c.date.startsWith(todayStr));
  const todaySchemeTotal = todaySchemeTx.reduce((acc, c) => acc + c.amount, 0);

  const todayExpenses = storeData.expenses.filter((e) => e.date.startsWith(todayStr));
  const todayExpensesTotal = todayExpenses.reduce((acc, e) => acc + e.amount, 0);

  const lowStockItems = storeData.stock.filter((s) => s.stockQty <= s.minAlertQty);

  // Filtered agent cards
  const filteredAgentCards =
    selectedAgentFilter === 'all'
      ? agentPerformanceList
      : agentPerformanceList.filter((a) => a.agent.id === selectedAgentFilter);

  return (
    <div className="space-y-4 sm:space-y-6 pb-6 sm:pb-8">
      {/* Top Banner & Quick Actions */}
      <div
        className={`rounded-2xl sm:rounded-3xl border p-3.5 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 ${
          isDayMode
            ? 'bg-white border-slate-200 shadow-xs'
            : 'bg-slate-900/90 border-slate-800 shadow-md'
        }`}
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse shadow-[0_0_8px_#38bdf8]"></span>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Shri Sai Enterprises — Wardha Main Dashboard <span className="text-xs font-normal text-slate-500 dark:text-sky-300/70 font-sans hidden sm:inline">(वर्धा मुख्य डॅशबोर्ड)</span>
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Electronics, Furniture Sales, 30-Month Scheme, Live Agent Recovery & Cash Register <span className="text-[11px] opacity-75 hidden sm:inline">(इलेक्ट्रॉनिक्स, फर्निचर, बचत योजना व कॅश ट्रॅकिंग)</span>
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <GalaxyButton
            id="btn-quick-new-invoice"
            onClick={() => onNavigate('pos')}
            variant="amber"
            size="sm"
            icon={<ShoppingBag className="w-4 h-4" />}
          >
            <span>New Sale POS <span className="text-[10px] font-normal opacity-85 hidden sm:inline">(नवीन विक्री)</span></span>
          </GalaxyButton>
          <GalaxyButton
            id="btn-quick-add-entry"
            onClick={() => onNavigate('add-entry')}
            variant="cyan"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
          >
            <span>+ Add Bill <span className="text-[10px] font-normal opacity-85 hidden sm:inline">(नवीन बिल)</span></span>
          </GalaxyButton>
          <GalaxyButton
            id="btn-quick-collect-bill"
            onClick={() => onNavigate('customers')}
            variant="emerald"
            size="sm"
            icon={<Receipt className="w-4 h-4" />}
          >
            <span>Receipt #{storeData.settings.nextReceiptNo || 1083} <span className="text-[10px] font-normal opacity-85 hidden sm:inline">(जमा पावती)</span></span>
          </GalaxyButton>
          <GalaxyButton
            id="btn-quick-dynamic-upi"
            onClick={() => onNavigate('upi-collect')}
            variant="purple"
            size="sm"
            icon={<QrCode className="w-4 h-4" />}
          >
            <span>काऊंटर UPI QR <span className="text-[10px] font-normal opacity-85 hidden sm:inline">(Live QR)</span></span>
          </GalaxyButton>
          <GalaxyButton
            id="btn-quick-import-csv"
            onClick={() => onNavigate('excel-import')}
            variant="subtle"
            size="sm"
            icon={<FileSpreadsheet className="w-4 h-4" />}
          >
            <span>CSV / Excel <span className="text-[10px] font-normal opacity-85 hidden sm:inline">(आयात)</span></span>
          </GalaxyButton>
          <GalaxyButton
            id="btn-quick-agent-commission"
            onClick={() => onNavigate('agent-commission')}
            variant="purple"
            size="sm"
            icon={<Percent className="w-4 h-4" />}
          >
            <span>Agent 4% <span className="text-[10px] font-normal opacity-85 hidden sm:inline">(कमिशन)</span></span>
          </GalaxyButton>
          <GalaxyButton
            id="btn-quick-pl-analytics"
            onClick={() => onNavigate('profit-loss')}
            variant="emerald"
            size="sm"
            icon={<TrendingUp className="w-4 h-4" />}
          >
            <span>P&L नफा-तोटा <span className="text-[10px] font-normal opacity-85 hidden sm:inline">(Analytics)</span></span>
          </GalaxyButton>
          <GalaxyButton
            id="btn-quick-gst-reports"
            onClick={() => onNavigate('gst-reports')}
            variant="cyan"
            size="sm"
            icon={<FileSpreadsheet className="w-4 h-4" />}
          >
            <span>जीएसटी अहवाल <span className="text-[10px] font-normal opacity-85 hidden sm:inline">(GSTR-1/3B)</span></span>
          </GalaxyButton>
          <GalaxyButton
            id="btn-quick-system-shield"
            onClick={() => onNavigate('system-shield')}
            variant="amber"
            size="sm"
            icon={<ShieldCheck className="w-4 h-4" />}
          >
            <span>सिस्टीम शील्ड <span className="text-[10px] font-normal opacity-85 hidden sm:inline">(Stock Aging)</span></span>
          </GalaxyButton>
          <GalaxyButton
            id="btn-quick-barcode-studio"
            onClick={() => onNavigate('barcode-studio')}
            variant="cyan"
            size="sm"
            icon={<Barcode className="w-4 h-4" />}
          >
            <span>बारकोड स्टुडिओ <span className="text-[10px] font-normal opacity-85 hidden sm:inline">(Stickers)</span></span>
          </GalaxyButton>
          <GalaxyButton
            id="btn-quick-credit-shield"
            onClick={() => onNavigate('credit-shield')}
            variant="subtle"
            size="sm"
            icon={<ShieldAlert className="w-4 h-4 text-rose-500" />}
          >
            <span>क्रेडिट स्कोअर <span className="text-[10px] font-normal opacity-85 hidden sm:inline">(Risk Shield)</span></span>
          </GalaxyButton>
          <GalaxyButton
            id="btn-quick-delivery-challan"
            onClick={() => onNavigate('delivery-challan')}
            variant="emerald"
            size="sm"
            icon={<Truck className="w-4 h-4" />}
          >
            <span>डिलिव्हरी चलान <span className="text-[10px] font-normal opacity-85 hidden sm:inline">(Gate Pass)</span></span>
          </GalaxyButton>
          <GalaxyButton
            id="btn-quick-finance-tracker"
            onClick={() => onNavigate('finance-tracker')}
            variant="purple"
            size="sm"
            icon={<CreditCard className="w-4 h-4" />}
          >
            <span>बजाज/TVS EMI <span className="text-[10px] font-normal opacity-85 hidden sm:inline">(Loan Cases)</span></span>
          </GalaxyButton>
          <GalaxyButton
            id="btn-quick-draw-machine"
            onClick={() => onNavigate('draw-machine')}
            variant="amber"
            size="sm"
            icon={<Trophy className="w-4 h-4" />}
          >
            <span>लकी ड्रॉ मशीन <span className="text-[10px] font-normal opacity-85 hidden sm:inline">(Live Spinner)</span></span>
          </GalaxyButton>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🚀 HIGHLIGHT FEATURE: AGENT COLLECTION LIVE TRACKING (एजंट वसुली ट्रॅकिंग) */}
      {/* ========================================================================= */}
      <div
        className={`rounded-2xl sm:rounded-3xl border p-3.5 sm:p-6 shadow-sm space-y-4 sm:space-y-6 ${
          isDayMode
            ? 'bg-gradient-to-br from-white via-slate-50/50 to-amber-50/20 border-slate-200'
            : 'bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border-slate-800'
        }`}
      >
        {/* Section Header with Live Status & Timeframe Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Field Agent Collection & Live Recovery <span className="text-xs font-normal text-slate-500 dark:text-slate-400 font-sans">(एजंट वसुली व कलेक्शन ट्रॅकिंग)</span>
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase tracking-wide">
                  Live Sync (थेट)
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                New Bills Cash, Old Dues & 30-Month Scheme Collections <span className="text-[10px] opacity-75">(नवीन बिले, जुनी उधारी व बचत हप्ते)</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* Timeframe selector */}
            <div
              className={`p-1 rounded-2xl border flex items-center gap-1 ${
                isDayMode ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800'
              }`}
            >
              <button
                onClick={() => setAgentTimeframe('today')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                  agentTimeframe === 'today'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Today's Collection <span className="text-[10px] font-normal opacity-80">(आजचे संकलन)</span>
              </button>
              <button
                onClick={() => setAgentTimeframe('month')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                  agentTimeframe === 'month'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Current Month <span className="text-[10px] font-normal opacity-80">(चालू महिना)</span>
              </button>
            </div>

            {/* Agent filter dropdown */}
            <select
              value={selectedAgentFilter}
              onChange={(e) => setSelectedAgentFilter(e.target.value)}
              className={`px-3 py-1.5 rounded-2xl text-xs font-semibold border cursor-pointer ${
                isDayMode
                  ? 'bg-white border-slate-200 text-slate-800'
                  : 'bg-slate-950 border-slate-800 text-slate-200'
              }`}
            >
              <option value="all">All Agents (सर्व एजंट)</option>
              {activeAgents.map((ag) => (
                <option key={ag.id} value={ag.id}>
                  {ag.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 5-KPI Collection Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
          {/* Total Combined Recovery */}
          <div
            className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border ${
              isDayMode ? 'bg-white border-amber-200 shadow-sm' : 'bg-slate-950 border-amber-500/30'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-amber-600 dark:text-amber-400 font-bold mb-1">
              <span>Total Recovery <span className="text-[10px] font-normal opacity-80 hidden sm:inline">(एकूण संकलन)</span></span>
              <Wallet className="w-4 h-4 shrink-0" />
            </div>
            <div className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white">
              ₹{totalAllAgentRecovery.toLocaleString('en-IN')}
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">
              {agentTimeframe === 'today' ? 'Today recovery (आजची वसुली)' : 'Month recovery (महिन्याची वसुली)'}
            </p>
          </div>

          {/* New Bill Sales Cash Collected */}
          <div
            className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border ${
              isDayMode ? 'bg-white border-blue-200 shadow-sm' : 'bg-slate-950 border-blue-500/30'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-blue-600 dark:text-blue-400 font-bold mb-1">
              <span>New Bill Cash <span className="text-[10px] font-normal opacity-80 hidden sm:inline">(नवीन बिल)</span></span>
              <ShoppingBag className="w-4 h-4 shrink-0" />
            </div>
            <div className="text-lg sm:text-2xl font-black text-blue-600 dark:text-blue-400">
              ₹{totalAllNewBills.toLocaleString('en-IN')}
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">
              Cash & advance (रोख व ॲडव्हान्स)
            </p>
          </div>

          {/* Old Dues Recovered */}
          <div
            className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border ${
              isDayMode ? 'bg-white border-emerald-200 shadow-sm' : 'bg-slate-950 border-emerald-500/30'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-bold mb-1">
              <span>Old Dues <span className="text-[10px] font-normal opacity-80 hidden sm:inline">(जुनी उधारी)</span></span>
              <Receipt className="w-4 h-4 shrink-0" />
            </div>
            <div className="text-lg sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
              ₹{totalAllDuesRecovered.toLocaleString('en-IN')}
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">
              Receipts #1079+ (पावत्या)
            </p>
          </div>

          {/* 30-Month Scheme Card Installments */}
          <div
            className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border ${
              isDayMode ? 'bg-white border-purple-200 shadow-sm' : 'bg-slate-950 border-purple-500/30'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-purple-600 dark:text-purple-400 font-bold mb-1">
              <span>Scheme <span className="text-[10px] font-normal opacity-80 hidden sm:inline">(योजना हप्ते)</span></span>
              <CreditCard className="w-4 h-4 shrink-0" />
            </div>
            <div className="text-lg sm:text-2xl font-black text-purple-600 dark:text-purple-400">
              ₹{totalAllSchemeCollected.toLocaleString('en-IN')}
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">
              Installments (साप्ताहिक हप्ते)
            </p>
          </div>

          {/* 4% Commission Accrued */}
          <div
            className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border col-span-2 sm:col-span-1 ${
              isDayMode ? 'bg-white border-rose-200 shadow-sm' : 'bg-slate-950 border-rose-500/30'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-rose-600 dark:text-rose-400 font-bold mb-1">
              <span>Agent 4% Comm. <span className="text-[10px] font-normal opacity-80 hidden sm:inline">(कमिशन)</span></span>
              <Award className="w-4 h-4 shrink-0" />
            </div>
            <div className="text-lg sm:text-2xl font-black text-rose-600 dark:text-rose-400">
              ₹{totalAllCommission4Pct.toLocaleString('en-IN')}
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">
              4% incentive (४% कमिशन)
            </p>
          </div>
        </div>

        {/* Agent Leaderboard & Performance Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Agent-Wise Breakdown & Targets <span className="text-[11px] font-normal text-slate-400 font-sans">(एजंटनिहाय वसुली स्थिती व उद्दिष्ट)</span>
            </h4>
            <span className="text-[11px] text-slate-500">
              {filteredAgentCards.length} Active Field Agents (फिल्ड एजंट)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredAgentCards.map((perf) => (
              <div
                key={perf.agent.id}
                className={`p-4 rounded-2xl border transition hover:border-amber-500/50 ${
                  isDayMode ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-950 border-slate-800'
                }`}
              >
                {/* Agent Header */}
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 font-bold flex items-center justify-center text-sm border border-amber-500/20">
                      {perf.agent.name.slice(0, 1)}
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                        {perf.agent.name}
                      </h5>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{perf.route}</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    4% = ₹{perf.commission4Pct.toLocaleString('en-IN')}
                  </span>
                </div>

                {/* Total Collected Amount */}
                <div className="my-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Total Recovery (एकूण):</span>
                  <span className="text-base font-extrabold text-slate-900 dark:text-white">
                    ₹{perf.totalCollected.toLocaleString('en-IN')}
                  </span>
                </div>

                {/* Breakdown Badges */}
                <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] mb-3">
                  <div className="p-1.5 rounded-lg bg-blue-500/5 border border-blue-500/15">
                    <span className="text-slate-400 block">New Bill (नवीन)</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      ₹{perf.newBillCollected.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
                    <span className="text-slate-400 block">Old Dues (बाकी)</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      ₹{perf.duesRecovered.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-purple-500/5 border border-purple-500/15">
                    <span className="text-slate-400 block">Scheme (योजना)</span>
                    <span className="font-bold text-purple-600 dark:text-purple-400">
                      ₹{perf.schemeCollected.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Target Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400">
                    <span>Target (उद्दिष्ट): ₹{perf.targetAmount.toLocaleString('en-IN')}</span>
                    <span className="font-bold text-amber-500">{perf.achievementPct}% achieved (साध्य)</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${perf.achievementPct}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Recent Collections Stream (थेट वसुली नोंदी) */}
        <div
          className={`rounded-2xl border p-4 ${
            isDayMode ? 'bg-slate-50/70 border-slate-200' : 'bg-slate-950/60 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-500" />
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Live Real-Time Activity Feed <span className="text-xs font-normal text-slate-400 font-sans">(थेट वसुली नोंदी)</span>
              </h4>
            </div>
            <button
              onClick={() => onNavigate('customers')}
              className="text-xs font-semibold text-amber-500 hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>View All Receipts (सर्व पावत्या)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-800/80">
            {recentActivities.map((act) => (
              <div
                key={act.id}
                className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${act.typeColor}`}
                  >
                    {act.type}
                  </span>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {act.customerName}
                    </span>
                    <span className="text-slate-400 text-[11px] ml-2">
                      ({act.refNo} • एजंट: <strong>{act.agentName}</strong>)
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3 self-end sm:self-auto">
                  <span className="px-2 py-0.5 rounded-md bg-slate-200/60 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-300 font-medium">
                    {act.mode}
                  </span>
                  <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                    +₹{act.amount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 💎 ERP ENTERPRISE STRONG UPGRADES: P&L, GST AUDIT & SYSTEM SHIELD         */}
      {/* ========================================================================= */}
      <div
        className={`rounded-2xl sm:rounded-3xl border p-4 sm:p-6 shadow-sm space-y-4 ${
          isDayMode
            ? 'bg-gradient-to-r from-emerald-50/60 via-sky-50/50 to-teal-50/60 border-emerald-200'
            : 'bg-gradient-to-r from-[#0a1f1b]/70 via-[#0d1726]/70 to-[#0e2124]/70 border-emerald-500/30'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  ERP Powerhouse Upgrades <span className="text-xs font-normal text-slate-500 dark:text-slate-400 font-sans">(उद्योग नफा, कर व सिस्टीम शील्ड)</span>
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-slate-950 uppercase tracking-wide">
                  Active Pro
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                रिअल-टाइम नफा-तोटा विश्लेषण, जीएसटी अहवाल (CA रेडी) आणि गोदामातील डेड-स्टॉक डायग्नोस्टिक्स.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Card 1: P&L Profit & Loss */}
          <div
            onClick={() => onNavigate('profit-loss')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer group hover:scale-[1.01] ${
              isDayMode ? 'bg-white border-emerald-200 hover:border-emerald-400 shadow-xs' : 'bg-slate-900/90 border-emerald-500/30 hover:border-emerald-400 shadow-md'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4" />
                P&L नफा-तोटा ॲनालिटिक्स
              </span>
              <ArrowRight className="w-4 h-4 text-emerald-500 group-hover:translate-x-1 transition" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
              ₹{(storeData.transactions.reduce((acc, t) => acc + t.grandTotal, 0) * 0.22 - storeData.expenses.reduce((acc, e) => acc + e.amount, 0)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              अंदाजे निव्वळ नफा (Net Margin: ~22% Gross) • श्रेणीनुसार नफा तपशील पाहण्यासाठी क्लिक करा.
            </p>
          </div>

          {/* Card 2: GST & Tax Reports */}
          <div
            onClick={() => onNavigate('gst-reports')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer group hover:scale-[1.01] ${
              isDayMode ? 'bg-white border-sky-200 hover:border-sky-400 shadow-xs' : 'bg-slate-900/90 border-sky-500/30 hover:border-sky-400 shadow-md'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4" />
                जीएसटी व टॅक्स ऑडिट (CA File)
              </span>
              <ArrowRight className="w-4 h-4 text-sky-400 group-hover:translate-x-1 transition" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-sky-400 font-mono">
              GSTR-1 & 3B Ready
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              HSN कोड टेबल १२, B2B/B2C विक्री आणि १-क्लिक CA एक्सेल एक्सपोर्ट.
            </p>
          </div>

          {/* Card 3: Stock Aging & System Shield */}
          <div
            onClick={() => onNavigate('system-shield')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer group hover:scale-[1.01] ${
              isDayMode ? 'bg-white border-teal-200 hover:border-teal-400 shadow-xs' : 'bg-slate-900/90 border-teal-500/30 hover:border-teal-400 shadow-md'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                सिस्टीम शील्ड व डेड-स्टॉक
              </span>
              <ArrowRight className="w-4 h-4 text-teal-400 group-hover:translate-x-1 transition" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-teal-400 font-mono">
              100% Health Protected
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              ९०+ दिवस अडकलेले भांडवल शोधणे, डेटा अखंडता ऑटो-रिपेअर व सुरक्षित स्नॅपशॉट.
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 📊 GENERAL SHOWROOM KPIS (विक्री, उधारी, स्टॉक आणि योजना) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Sales */}
        <div
          className={`p-4 rounded-2xl border relative overflow-hidden ${
            isDayMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
          }`}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Today's Sales (आजची विक्री)
              </p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                ₹{todaySalesTotal.toLocaleString('en-IN')}
              </h3>
            </div>
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl border border-emerald-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-2">
            <span>{todayTransactions.length} बिले तयार केली</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              ₹{todayCashCollected.toLocaleString('en-IN')} रोख
            </span>
          </div>
        </div>

        {/* Customer Outstanding Dues */}
        <div
          className={`p-4 rounded-2xl border relative overflow-hidden ${
            isDayMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
          }`}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Customer Outstanding Dues <span className="text-[10px] font-normal opacity-75">(ग्राहकांची उधारी)</span>
              </p>
              <h3 className="text-2xl font-black text-rose-500 mt-1">
                ₹{totalCustomerDues.toLocaleString('en-IN')}
              </h3>
            </div>
            <div className="p-2 bg-rose-500/10 text-rose-500 rounded-xl border border-rose-500/20">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-2">
            <span>{storeData.customers.length} Accounts (ग्राहक खाती)</span>
            <button
              onClick={() => onNavigate('customers')}
              className="text-amber-500 hover:underline cursor-pointer font-bold"
            >
              Collect Receipt (पावती) →
            </button>
          </div>
        </div>

        {/* Inventory Valuation */}
        <div
          className={`p-4 rounded-2xl border relative overflow-hidden ${
            isDayMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
          }`}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Stock Retail Valuation <span className="text-[10px] font-normal opacity-75">(स्टॉक मूल्यांकन)</span>
              </p>
              <h3 className="text-2xl font-black text-sky-500 mt-1">
                ₹{totalStockSaleValue.toLocaleString('en-IN')}
              </h3>
            </div>
            <div className="p-2 bg-sky-500/10 text-sky-500 rounded-xl border border-sky-500/20">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-2">
            <span>{totalStockUnits} Units In Stock (शोरूम साठा)</span>
            <span className="text-slate-600 dark:text-slate-300">
              Cost: ₹{totalStockCost.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* 30-Month Savings Scheme Pool */}
        <div
          className={`p-4 rounded-2xl border relative overflow-hidden ${
            isDayMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
          }`}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                30-Month Scheme Pool <span className="text-[10px] font-normal opacity-75">(योजना संकलन)</span>
              </p>
              <h3 className="text-2xl font-black text-amber-500 mt-1">
                ₹{totalSchemePoolDeposited.toLocaleString('en-IN')}
              </h3>
            </div>
            <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/20">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-2">
            <span>{activeSchemeMembers} Active Cardholders (कार्डधारक)</span>
            <button
              onClick={() => onNavigate('scheme')}
              className="text-amber-500 hover:underline cursor-pointer font-bold"
            >
              Lucky Draw (लकी ड्रॉ) →
            </button>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Day-Book Tally & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Cash & Day-Book Register */}
        <div
          className={`rounded-3xl border p-5 shadow-sm ${
            isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Today's Day-Book Cash Flow <span className="text-xs font-normal text-slate-500 dark:text-slate-400 font-sans">(दैनिक रोख वही)</span>
              </h3>
            </div>
            <button
              onClick={() => onNavigate('expenses')}
              className="text-xs text-amber-500 hover:underline cursor-pointer font-semibold"
            >
              Expense Register (खर्च वही) →
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Direct Sales Cash (रोख विक्री):</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                +₹{todayCashCollected.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Bill Receipts Dues Recovered (उधारी वसुली):</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                +₹{todayReceiptsTotal.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">30-Month Scheme Installments (योजना हप्ते):</span>
              <span className="font-bold text-amber-500">
                +₹{todaySchemeTotal.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Daily Expenses & Vouchers (दैनिक खर्च):</span>
              <span className="font-bold text-rose-500">
                -₹{todayExpensesTotal.toLocaleString('en-IN')}
              </span>
            </div>

            <div
              className={`pt-2 flex justify-between items-center p-3 rounded-xl border ${
                isDayMode
                  ? 'bg-slate-50 border-slate-200'
                  : 'bg-slate-800/50 border-slate-700/60'
              }`}
            >
              <span className="font-bold text-slate-800 dark:text-slate-200">
                Net Cash in Drawer (गल्ल्यात निव्वळ रोख):
              </span>
              <span className="font-black text-base text-emerald-600 dark:text-emerald-400">
                ₹
                {(
                  todayCashCollected +
                  todayReceiptsTotal +
                  todaySchemeTotal -
                  todayExpensesTotal
                ).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div
          className={`rounded-3xl border p-5 shadow-sm lg:col-span-2 ${
            isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Low Stock Alerts ({lowStockItems.length} Products Low) <span className="text-xs font-normal text-slate-400 font-sans">(कमी शिल्लक अलर्ट)</span>
              </h3>
            </div>
            <button
              onClick={() => onNavigate('inventory')}
              className="text-xs text-amber-500 hover:underline cursor-pointer font-semibold"
            >
              Inventory Management (स्टॉक व्यवस्थापन) →
            </button>
          </div>

          {lowStockItems.length === 0 ? (
            <div
              className={`p-6 text-center text-slate-500 text-xs rounded-2xl border ${
                isDayMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/40 border-slate-800'
              }`}
            >
              सर्व इलेक्ट्रॉनिक्स आणि फर्निचर वस्तूंचा स्टॉक समाधानकारक पातळीवर आहे.
            </div>
          ) : (
            <div className="space-y-2">
              {lowStockItems.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between p-3 rounded-xl text-xs border ${
                    isDayMode
                      ? 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      : 'bg-slate-800/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                      {item.category}
                    </span>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{item.name}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        कोड: {item.code} • ब्रँड: {item.brand}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-rose-500 text-sm">
                      {item.stockQty} {item.unit} शिल्लक
                    </span>
                    <p className="text-[10px] text-slate-400">किमान अलर्ट: {item.minAlertQty}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Invoices & Sales Table */}
      <div
        className={`rounded-3xl border p-5 shadow-sm ${
          isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Recent Tax Invoices <span className="text-xs font-normal text-slate-400 font-sans">(अलीकडील बिले)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tax invoice records with warranty & serial numbers <span className="text-[10px] opacity-75">(वॉरंटी व सिरीयल नंबरसह विक्री नोंदी)</span>
            </p>
          </div>
          <button
            onClick={() => onNavigate('pos')}
            className="text-xs font-bold text-amber-500 hover:underline cursor-pointer"
          >
            Create New Invoice (नवीन बिल) →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead
              className={`uppercase text-[10px] tracking-wider ${
                isDayMode
                  ? 'bg-slate-100 text-slate-600'
                  : 'bg-slate-800/80 text-slate-400'
              }`}
            >
              <tr>
                <th className="py-2.5 px-3">Invoice No. (बिल)</th>
                <th className="py-2.5 px-3">Date (दिनांक)</th>
                <th className="py-2.5 px-3">Customer Name (ग्राहक नाव)</th>
                <th className="py-2.5 px-3">Total Amount (एकूण)</th>
                <th className="py-2.5 px-3">Paid / Due (जमा / बाकी)</th>
                <th className="py-2.5 px-3">Payment Mode (मोड)</th>
                <th className="py-2.5 px-3">Status (स्थिती)</th>
                <th className="py-2.5 px-3 text-right">Print (प्रिंट)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {storeData.transactions.slice(0, 5).map((tx) => (
                <tr
                  key={tx.id}
                  className={`transition ${
                    isDayMode ? 'hover:bg-slate-50' : 'hover:bg-slate-800/40'
                  }`}
                >
                  <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                    {tx.invoiceNo}
                  </td>
                  <td className="py-3 px-3 text-slate-500 dark:text-slate-400">
                    {new Date(tx.date).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-800 dark:text-slate-200">
                      {tx.customerName}
                    </div>
                    <div className="text-[10px] text-slate-400">{tx.customerPhone}</div>
                  </td>
                  <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                    ₹{tx.grandTotal.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      ₹{tx.paidAmount.toLocaleString('en-IN')}
                    </span>
                    {tx.balanceDue > 0 && (
                      <span className="text-rose-500 block text-[10px] font-bold">
                        बाकी: ₹{tx.balanceDue.toLocaleString('en-IN')}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                        isDayMode
                          ? 'bg-slate-100 border-slate-200 text-slate-700'
                          : 'bg-slate-800 border-slate-700 text-slate-300'
                      }`}
                    >
                      {tx.paymentMode}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        tx.status === 'Paid'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          : tx.status === 'Partial'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                      }`}
                    >
                      {tx.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => onOpenInvoicePrint(tx)}
                      className={`p-2 rounded-xl border transition cursor-pointer inline-flex items-center justify-center ${
                        isDayMode
                          ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                      }`}
                      title="टॅक्स इनव्हॉइस प्रिंट करा"
                    >
                      <Printer className="w-3.5 h-3.5 text-amber-500" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
