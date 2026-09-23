import React, { useState, useMemo } from 'react';
import {
  Banknote,
  Smartphone,
  TrendingUp,
  Calendar,
  Share2,
  Eye,
  CreditCard,
  UserCheck,
  Receipt,
  X,
  Printer,
  ChevronRight,
  Award,
  Wallet,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  MapPin
} from 'lucide-react';
import { CardTransaction, TransactionEntry, CardMember, StaffMember, AgentAdvance, BusinessSettings } from '../types';

export interface AgentDefinition {
  id: string;
  name: string;
  marathiName: string;
  phone: string;
  avatarBg: string;
  badgeBg: string;
  borderColor: string;
  accentColor: string;
}

export const CORE_AGENTS: AgentDefinition[] = [
  {
    id: 'shubham',
    name: 'Shubham Shende',
    marathiName: 'शुभम शेंडे',
    phone: '8766486915',
    avatarBg: 'bg-emerald-600 text-white',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    borderColor: 'border-emerald-200 dark:border-emerald-800/80',
    accentColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    id: 'bhushan',
    name: 'Bhushan Lidbe',
    marathiName: 'भूषण लिडबे',
    phone: '8600122798',
    avatarBg: 'bg-blue-600 text-white',
    badgeBg: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    borderColor: 'border-blue-200 dark:border-blue-800/80',
    accentColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    id: 'suraj',
    name: 'Suraj Pendam',
    marathiName: 'सुरज पेंदाम',
    phone: '9175534365',
    avatarBg: 'bg-purple-600 text-white',
    badgeBg: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    borderColor: 'border-purple-200 dark:border-purple-800/80',
    accentColor: 'text-purple-600 dark:text-purple-400',
  },
  {
    id: 'ninad',
    name: 'Ninad Hole',
    marathiName: 'निनाद होले',
    phone: '7822859073',
    avatarBg: 'bg-amber-600 text-white',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    borderColor: 'border-amber-200 dark:border-amber-800/80',
    accentColor: 'text-amber-600 dark:text-amber-400',
  },
];

export function matchesAgent(txAgentName: string | undefined, agentFullName: string): boolean {
  if (!txAgentName) return false;
  const a = txAgentName.trim().toLowerCase();
  const target = agentFullName.trim().toLowerCase();
  if (a === target) return true;
  const parts = target.split(' ');
  const firstName = parts[0] || '';
  const lastName = parts[1] || '';
  if (firstName && a === firstName) return true;
  if (lastName && a === lastName) return true;
  if (firstName && a.includes(firstName)) return true;
  if (lastName && a.includes(lastName)) return true;
  return false;
}

interface AgentCollectionDashboardSectionProps {
  cardTransactions: CardTransaction[];
  transactions?: TransactionEntry[];
  cardMembers?: CardMember[];
  staff?: StaffMember[];
  agentAdvances?: AgentAdvance[];
  settings: BusinessSettings;
  onNavigate: (tab: any) => void;
  onOpenAgentCommission?: (agentName: string) => void;
}

export const AgentCollectionDashboardSection: React.FC<AgentCollectionDashboardSectionProps> = ({
  cardTransactions,
  transactions = [],
  cardMembers = [],
  staff = [],
  agentAdvances = [],
  settings,
  onNavigate,
  onOpenAgentCommission,
}) => {
  const [timeFilter, setTimeFilter] = useState<'today' | 'yesterday' | '7days' | 'month' | 'custom'>('today');
  const [customDate, setCustomDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Modal for inspecting an agent's individual receipts
  const [inspectAgent, setInspectAgent] = useState<AgentDefinition | null>(null);
  const [inspectModeFilter, setInspectModeFilter] = useState<'all' | 'Cash' | 'Online'>('all');

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  
  const yesterdayStr = useMemo(() => {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    return y.toISOString().split('T')[0];
  }, []);

  const past7DaysStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  }, []);

  const startOfMonthStr = useMemo(() => {
    return new Date().toISOString().slice(0, 7) + '-01';
  }, []);

  // Filter helper for dates
  const isDateInFilter = (dateStr: string) => {
    if (timeFilter === 'today') return dateStr === todayStr;
    if (timeFilter === 'yesterday') return dateStr === yesterdayStr;
    if (timeFilter === '7days') return dateStr >= past7DaysStr && dateStr <= todayStr;
    if (timeFilter === 'month') return dateStr >= startOfMonthStr && dateStr <= todayStr;
    if (timeFilter === 'custom') return dateStr === customDate;
    return true;
  };

  // Compile calculations for each of the 4 agents
  const agentStats = useMemo(() => {
    return CORE_AGENTS.map((agent) => {
      // 1. All transactions by this agent
      const agentCardTxs = cardTransactions.filter((tx) => matchesAgent(tx.agentName, agent.name));
      const agentSaleTxs = transactions.filter((tx) => matchesAgent(tx.agentName, agent.name));

      // Today stats
      const todayCardTxs = agentCardTxs.filter((tx) => tx.date === todayStr);
      const todaySaleTxs = agentSaleTxs.filter((tx) => tx.date === todayStr);

      const todayCardCash = todayCardTxs.filter((tx) => tx.paymentMode === 'Cash').reduce((sum, tx) => sum + (tx.amount || 0), 0);
      const todayCardOnline = todayCardTxs.filter((tx) => tx.paymentMode === 'Online').reduce((sum, tx) => sum + (tx.amount || 0), 0);
      const todaySaleCash = todaySaleTxs.filter((tx) => tx.paymentMode === 'Cash').reduce((sum, tx) => sum + (tx.payingNow || 0), 0);
      const todaySaleOnline = todaySaleTxs.filter((tx) => tx.paymentMode === 'Online').reduce((sum, tx) => sum + (tx.payingNow || 0), 0);

      const todayCash = todayCardCash + todaySaleCash;
      const todayOnline = todayCardOnline + todaySaleOnline;
      const todayTotal = todayCash + todayOnline;
      const todayCount = todayCardTxs.length + todaySaleTxs.length;

      // Yesterday stats
      const yesterdayCardTxs = agentCardTxs.filter((tx) => tx.date === yesterdayStr);
      const yesterdaySaleTxs = agentSaleTxs.filter((tx) => tx.date === yesterdayStr);

      const yesterdayCardCash = yesterdayCardTxs.filter((tx) => tx.paymentMode === 'Cash').reduce((sum, tx) => sum + (tx.amount || 0), 0);
      const yesterdayCardOnline = yesterdayCardTxs.filter((tx) => tx.paymentMode === 'Online').reduce((sum, tx) => sum + (tx.amount || 0), 0);
      const yesterdaySaleCash = yesterdaySaleTxs.filter((tx) => tx.paymentMode === 'Cash').reduce((sum, tx) => sum + (tx.payingNow || 0), 0);
      const yesterdaySaleOnline = yesterdaySaleTxs.filter((tx) => tx.paymentMode === 'Online').reduce((sum, tx) => sum + (tx.payingNow || 0), 0);

      const yesterdayCash = yesterdayCardCash + yesterdaySaleCash;
      const yesterdayOnline = yesterdayCardOnline + yesterdaySaleOnline;
      const yesterdayTotal = yesterdayCash + yesterdayOnline;
      const yesterdayCount = yesterdayCardTxs.length + yesterdaySaleTxs.length;

      // Selected period stats
      const periodCardTxs = agentCardTxs.filter((tx) => isDateInFilter(tx.date));
      const periodSaleTxs = agentSaleTxs.filter((tx) => isDateInFilter(tx.date));

      const periodCardCash = periodCardTxs.filter((tx) => tx.paymentMode === 'Cash').reduce((sum, tx) => sum + (tx.amount || 0), 0);
      const periodCardOnline = periodCardTxs.filter((tx) => tx.paymentMode === 'Online').reduce((sum, tx) => sum + (tx.amount || 0), 0);
      const periodSaleCash = periodSaleTxs.filter((tx) => tx.paymentMode === 'Cash').reduce((sum, tx) => sum + (tx.payingNow || 0), 0);
      const periodSaleOnline = periodSaleTxs.filter((tx) => tx.paymentMode === 'Online').reduce((sum, tx) => sum + (tx.payingNow || 0), 0);

      const periodCash = periodCardCash + periodSaleCash;
      const periodOnline = periodCardOnline + periodSaleOnline;
      const periodTotal = periodCash + periodOnline;
      const periodCount = periodCardTxs.length + periodSaleTxs.length;

      // All-time stats
      const allTimeCardTotal = agentCardTxs.reduce((sum, tx) => sum + (tx.amount || 0), 0);
      const allTimeSaleTotal = agentSaleTxs.reduce((sum, tx) => sum + (tx.payingNow || 0), 0);
      const allTimeTotal = allTimeCardTotal + allTimeSaleTotal;
      const allTimeCount = agentCardTxs.length + agentSaleTxs.length;

      // Advances taken
      const advances = agentAdvances.filter((adv) => matchesAgent(adv.agentName, agent.name));
      const totalAdvance = advances.reduce((sum, a) => sum + (a.amount || 0), 0);

      // Estimated 4% commission on period collection
      const estimatedCommission = Math.round(periodTotal * 0.04);

      return {
        agent,
        todayCash,
        todayOnline,
        todayTotal,
        todayCount,
        yesterdayCash,
        yesterdayOnline,
        yesterdayTotal,
        yesterdayCount,
        periodCash,
        periodOnline,
        periodTotal,
        periodCount,
        allTimeTotal,
        allTimeCount,
        totalAdvance,
        estimatedCommission,
        periodCardTxs,
        periodSaleTxs,
      };
    });
  }, [cardTransactions, transactions, agentAdvances, timeFilter, customDate, todayStr, yesterdayStr, past7DaysStr, startOfMonthStr]);

  // Overall totals across all 4 agents for the selected filter
  const overallPeriod = useMemo(() => {
    return agentStats.reduce(
      (acc, curr) => ({
        total: acc.total + curr.periodTotal,
        cash: acc.cash + curr.periodCash,
        online: acc.online + curr.periodOnline,
        count: acc.count + curr.periodCount,
        todayTotal: acc.todayTotal + curr.todayTotal,
        todayOnline: acc.todayOnline + curr.todayOnline,
        todayCash: acc.todayCash + curr.todayCash,
        yesterdayTotal: acc.yesterdayTotal + curr.yesterdayTotal,
      }),
      { total: 0, cash: 0, online: 0, count: 0, todayTotal: 0, todayOnline: 0, todayCash: 0, yesterdayTotal: 0 }
    );
  }, [agentStats]);

  // Share daily summary on WhatsApp
  const handleShareAgentWhatsApp = (stat: typeof agentStats[0]) => {
    const filterLabel =
      timeFilter === 'today'
        ? `आजचे संकलन (${todayStr})`
        : timeFilter === 'yesterday'
        ? `कालचे संकलन (${yesterdayStr})`
        : `कलेक्शन अहवाल (${timeFilter})`;

    const text = encodeURIComponent(
      `*${settings.businessName} - एजंट संकलन अहवाल*\n` +
      `--------------------------------\n` +
      `👨‍💼 *प्रतिनिधी:* ${stat.agent.name} (${stat.agent.marathiName})\n` +
      `📅 *कालावधी / तारीख:* ${filterLabel}\n\n` +
      `💵 *रोख जमा (Cash in Hand):* ₹${stat.periodCash.toLocaleString('en-IN')}\n` +
      `📲 *ऑनलाईन जमा (Online UPI):* ₹${stat.periodOnline.toLocaleString('en-IN')}\n` +
      `💰 *एकूण वसुली (Total Collection):* ₹${stat.periodTotal.toLocaleString('en-IN')}\n` +
      `🧾 *एकूण पावत्या (Receipts):* ${stat.periodCount} पावत्या\n` +
      `--------------------------------\n` +
      `💼 ४% कमिशन हिशोब: ₹${stat.estimatedCommission.toLocaleString('en-IN')}\n` +
      `🏬 संपर्क: ${settings.ownerName} - ${settings.phone}\n` +
      `श्री साई इंटरप्राइजेस, वर्धा`
    );

    const phone = stat.agent.phone ? stat.agent.phone.replace(/[^0-9]/g, '') : '';
    const url = phone ? `https://wa.me/91${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  // Inspect receipts for active agent modal
  const selectedAgentStats = useMemo(() => {
    if (!inspectAgent) return null;
    return agentStats.find((s) => s.agent.id === inspectAgent.id) || null;
  }, [inspectAgent, agentStats]);

  const inspectReceiptsList = useMemo(() => {
    if (!selectedAgentStats) return [];
    const list: Array<{
      id: string;
      date: string;
      receiptNo: string;
      customerName: string;
      phone?: string;
      cardNumber?: number;
      amount: number;
      paymentMode: 'Cash' | 'Online';
      type: string;
      remarks?: string;
    }> = [];

    selectedAgentStats.periodCardTxs.forEach((ctx) => {
      list.push({
        id: ctx.id,
        date: ctx.date,
        receiptNo: ctx.receiptNo || `REC-${ctx.cardNumber}`,
        customerName: ctx.customerName,
        phone: ctx.customerPhone,
        cardNumber: ctx.cardNumber,
        amount: ctx.amount,
        paymentMode: ctx.paymentMode,
        type: ctx.type === 'WeeklyPayment' ? 'साप्ताहिक हप्ता' : ctx.type === 'Fee' ? 'नोंदणी फी' : ctx.type,
        remarks: ctx.remarks,
      });
    });

    selectedAgentStats.periodSaleTxs.forEach((stx) => {
      list.push({
        id: stx.id,
        date: stx.date,
        receiptNo: stx.invoiceNo,
        customerName: stx.customerName,
        phone: stx.customerPhone,
        cardNumber: stx.cardNumber,
        amount: stx.payingNow,
        paymentMode: stx.paymentMode,
        type: stx.docType === 'quotation' ? 'कोटेशन विक्री' : 'दुकान विक्री',
        remarks: stx.itemDetails,
      });
    });

    // Filter by cash/online if selected
    if (inspectModeFilter === 'all') return list;
    return list.filter((item) => item.paymentMode === inspectModeFilter);
  }, [selectedAgentStats, inspectModeFilter]);

  return (
    <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-6 transition-colors">
      {/* Section Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800">
              <UserCheck className="w-3.5 h-3.5" />
              ४ फील्ड प्रतिनिधी दैनिक वसुली (4 Core Agents)
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500 hidden sm:inline">
              • लाईव्ह कॅश व ऑनलाईन हिशोब
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            एजंट दैनिक संकलन व हिशोब डॅशबोर्ड
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            शुभम शेंडे, भूषण लिडबे, सुरज पेंदाम आणि निनाद होले यांच्या आजच्या, कालच्या व मागील तारखांच्या वसुलीचा अचूक हिशोब.
          </p>
        </div>

        {/* Date Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800/90 p-1 border border-slate-200 dark:border-slate-700 text-xs font-medium">
            <button
              id="btn-filter-agent-today"
              onClick={() => setTimeFilter('today')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                timeFilter === 'today'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              आजचे (Today)
            </button>
            <button
              id="btn-filter-agent-yesterday"
              onClick={() => setTimeFilter('yesterday')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                timeFilter === 'yesterday'
                  ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              कालचे (Yesterday)
            </button>
            <button
              id="btn-filter-agent-7days"
              onClick={() => setTimeFilter('7days')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                timeFilter === '7days'
                  ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-400 font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              ७ दिवस
            </button>
            <button
              id="btn-filter-agent-month"
              onClick={() => setTimeFilter('month')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                timeFilter === 'month'
                  ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              हा महिना
            </button>
          </div>

          {/* Custom Date Input */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/60 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <input
              type="date"
              value={customDate}
              onChange={(e) => {
                setCustomDate(e.target.value);
                setTimeFilter('custom');
              }}
              className="bg-transparent text-slate-800 dark:text-slate-200 text-xs font-medium focus:outline-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Summary Highlight Box for selected date filter */}
      <div className="bg-linear-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-slate-700/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
              {timeFilter === 'today'
                ? `आजचे एकूण संकलन (${todayStr})`
                : timeFilter === 'yesterday'
                ? `कालचे एकूण संकलन (${yesterdayStr})`
                : timeFilter === 'custom'
                ? `निवडलेल्या तारखेचे संकलन (${customDate})`
                : `निवडलेल्या कालावधीचे एकूण संकलन`}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              ({overallPeriod.count} पावत्या जमा)
            </span>
          </div>
          <div className="flex items-baseline gap-3">
            <div className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              ₹{overallPeriod.total.toLocaleString('en-IN')}
            </div>
            {timeFilter === 'today' && (
              <span className="text-xs text-slate-300">
                (कालची एकूण वसुली: ₹{overallPeriod.yesterdayTotal.toLocaleString('en-IN')})
              </span>
            )}
          </div>
        </div>

        {/* Breakdown: Cash vs Online */}
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 w-full md:w-auto">
          {/* Cash In-Hand */}
          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-300 uppercase tracking-wider font-semibold">
                रोख जमा (Cash)
              </p>
              <p className="text-lg font-bold text-emerald-400">
                ₹{overallPeriod.cash.toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          {/* Online / UPI */}
          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-300 uppercase tracking-wider font-semibold">
                ऑनलाइन (UPI / Bank)
              </p>
              <p className="text-lg font-bold text-blue-400">
                ₹{overallPeriod.online.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Direct Action Hub for Detailed Register & Village-wise Khata */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>तपशीलवार वसुली याद्या, पावती प्रिंट व गावांच्या याद्या:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate('daily-collection-log')}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>📋 दैनिक वसुली रजिस्टर व प्रिंट</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('village-khata')}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-2xs transition cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>📍 गाववार उधारी व कार्ड (Route Sheet)</span>
          </button>
        </div>
      </div>

      {/* 4 Agent Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        {agentStats.map((stat) => {
          const { agent } = stat;
          return (
            <div
              key={agent.id}
              className={`rounded-2xl border ${agent.borderColor} bg-white dark:bg-[#0F172A] p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4`}
            >
              {/* Agent Top Details */}
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-11 h-11 rounded-xl ${agent.avatarBg} flex items-center justify-center font-black text-sm shadow-xs`}>
                      {agent.name.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight">
                        {agent.name}
                      </h3>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {agent.marathiName}
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                        Mo: {agent.phone}
                      </p>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${agent.badgeBg}`}>
                    {stat.periodCount} पावत्या
                  </span>
                </div>

                {/* Primary Metric: Today's Collection */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-600 dark:text-slate-400">
                      {timeFilter === 'today' ? 'आजचे संकलन (Today)' : 'निवडलेले संकलन'}:
                    </span>
                    <span className="text-xs text-slate-400">
                      {timeFilter === 'today' ? todayStr : timeFilter}
                    </span>
                  </div>

                  <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    ₹{stat.periodTotal.toLocaleString('en-IN')}
                  </div>

                  {/* Cash vs Online Split */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/50 text-xs">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                        💵 रोख (Cash):
                      </span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        ₹{stat.periodCash.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                        📲 ऑनलाइन (UPI):
                      </span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        ₹{stat.periodOnline.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Comparative Row: Yesterday vs All-Time */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">कालची वसुली</p>
                    <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                      ₹{stat.yesterdayTotal.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">४% कमिशन</p>
                    <p className="font-bold text-purple-600 dark:text-purple-400 mt-0.5">
                      ₹{stat.estimatedCommission.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setInspectAgent(agent)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    पावत्या पाहा
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenAgentCommission) {
                        onOpenAgentCommission(agent.name);
                      } else {
                        onNavigate('agent-commission');
                      }
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/50 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer border border-purple-200 dark:border-purple-800"
                  >
                    <Wallet className="w-3.5 h-3.5" />
                    पेमेंट व पगार
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleShareAgentWhatsApp(stat)}
                  className="w-full py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer border border-emerald-200 dark:border-emerald-800"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  WhatsApp वर अहवाल पाठवा
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reconcile & Settlement Table for the 4 Agents */}
      <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              एजंटनिहाय वसुली व पेमेंट हिशोब तक्ता (Settlement & Reconcile)
            </h3>
          </div>
          <button
            onClick={() => onNavigate('agent-commission')}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            सर्व कमिशन व ॲडव्हान्स लेजर उघडा <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-3 rounded-l-lg">प्रतिनिधी नाव (Agent)</th>
                <th className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400">आजची रोख जमा (Cash in Hand)</th>
                <th className="py-2.5 px-3 text-blue-600 dark:text-blue-400">आजची ऑनलाईन (Online UPI)</th>
                <th className="py-2.5 px-3 font-bold">एकूण संकलन (Total)</th>
                <th className="py-2.5 px-3">कालचे संकलन (Yesterday)</th>
                <th className="py-2.5 px-3">पावत्या</th>
                <th className="py-2.5 px-3 rounded-r-lg text-right">क्रिया (Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
              {agentStats.map((stat) => (
                <tr key={stat.agent.id} className="hover:bg-white/80 dark:hover:bg-slate-800/60 transition">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg ${stat.agent.avatarBg} flex items-center justify-center font-bold text-xs`}>
                        {stat.agent.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{stat.agent.name}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">{stat.agent.marathiName}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    ₹{stat.periodCash.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 font-bold text-blue-600 dark:text-blue-400 font-mono">
                    ₹{stat.periodOnline.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 font-bold text-slate-900 dark:text-white font-mono text-sm">
                    ₹{stat.periodTotal.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-mono">
                    ₹{stat.yesterdayTotal.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 bg-slate-200/70 dark:bg-slate-800 rounded-md font-semibold text-[11px]">
                      {stat.periodCount} पावत्या
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        title="पावत्या तपासा"
                        onClick={() => setInspectAgent(stat.agent)}
                        className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 font-medium cursor-pointer"
                      >
                        पावत्या
                      </button>
                      <button
                        title="पगार व कमिशन"
                        onClick={() => {
                          if (onOpenAgentCommission) {
                            onOpenAgentCommission(stat.agent.name);
                          } else {
                            onNavigate('agent-commission');
                          }
                        }}
                        className="px-2 py-1 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-500 cursor-pointer"
                      >
                        पेमेंट
                      </button>
                      <button
                        title="WhatsApp अहवाल"
                        onClick={() => handleShareAgentWhatsApp(stat)}
                        className="p-1 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 hover:bg-emerald-100 cursor-pointer"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Detailed Receipts List for Selected Agent */}
      {inspectAgent && selectedAgentStats && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${inspectAgent.avatarBg} flex items-center justify-center font-bold text-sm`}>
                  {inspectAgent.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">
                    {inspectAgent.name} ({inspectAgent.marathiName}) - पावत्या तपशील
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    कालावधी: {timeFilter === 'today' ? `आज (${todayStr})` : timeFilter === 'yesterday' ? `काल (${yesterdayStr})` : timeFilter} • एकूण {inspectReceiptsList.length} नोंदी
                  </p>
                </div>
              </div>

              <button
                onClick={() => setInspectAgent(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Filter Pills */}
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-500">पेमेंट मोड:</span>
                <div className="inline-flex rounded-lg bg-slate-200/80 dark:bg-slate-800 p-0.5">
                  <button
                    onClick={() => setInspectModeFilter('all')}
                    className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                      inspectModeFilter === 'all'
                        ? 'bg-white dark:bg-slate-700 font-bold text-slate-900 dark:text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    सर्व ({selectedAgentStats.periodCount})
                  </button>
                  <button
                    onClick={() => setInspectModeFilter('Cash')}
                    className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                      inspectModeFilter === 'Cash'
                        ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    रोख (Cash): ₹{selectedAgentStats.periodCash.toLocaleString('en-IN')}
                  </button>
                  <button
                    onClick={() => setInspectModeFilter('Online')}
                    className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                      inspectModeFilter === 'Online'
                        ? 'bg-blue-600 text-white font-bold shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    ऑनलाईन (UPI): ₹{selectedAgentStats.periodOnline.toLocaleString('en-IN')}
                  </button>
                </div>
              </div>

              <div className="font-bold text-slate-900 dark:text-white">
                एकूण संकलन: <span className="text-emerald-600 dark:text-emerald-400 font-mono">₹{selectedAgentStats.periodTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Receipts Table */}
            <div className="overflow-y-auto p-4 sm:p-5 flex-1">
              {inspectReceiptsList.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase font-semibold border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="py-2.5 px-3 rounded-l-lg">पावती / तारीख</th>
                        <th className="py-2.5 px-3">ग्राहक / सभासद</th>
                        <th className="py-2.5 px-3">कार्ड / प्रकार</th>
                        <th className="py-2.5 px-3">मोड</th>
                        <th className="py-2.5 px-3 rounded-r-lg text-right">रक्कम</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {inspectReceiptsList.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="py-2.5 px-3">
                            <p className="font-mono font-bold text-slate-900 dark:text-white">{item.receiptNo}</p>
                            <p className="text-[10px] text-slate-400">{item.date}</p>
                          </td>
                          <td className="py-2.5 px-3">
                            <p className="font-semibold text-slate-800 dark:text-slate-200">{item.customerName}</p>
                            {item.phone && <p className="text-[10px] text-slate-400 font-mono">{item.phone}</p>}
                          </td>
                          <td className="py-2.5 px-3">
                            {item.cardNumber ? (
                              <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                                कार्ड #{item.cardNumber}
                              </span>
                            ) : (
                              <span className="text-slate-600 dark:text-slate-400">{item.type}</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                item.paymentMode === 'Cash'
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                  : 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                              }`}
                            >
                              {item.paymentMode === 'Cash' ? 'रोख (Cash)' : 'ऑनलाईन (UPI)'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-black text-slate-900 dark:text-white font-mono text-sm">
                            ₹{item.amount.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs space-y-2">
                  <Receipt className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 stroke-[1.5]" />
                  <p className="font-semibold">या निवडलेल्या कालावधीत कोणतीही पावती सापडली नाही.</p>
                  <p className="text-[11px]">फील्ड एजंटने ॲपमधून हप्ता भरणा केल्यावर येथे पावत्या तात्काळ दिसतील.</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setInspectAgent(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-xs cursor-pointer"
              >
                बंद करा (Close)
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleShareAgentWhatsApp(selectedAgentStats)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  WhatsApp अहवाल
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInspectAgent(null);
                    if (onOpenAgentCommission) {
                      onOpenAgentCommission(inspectAgent.name);
                    } else {
                      onNavigate('agent-commission');
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Wallet className="w-4 h-4" />
                  पेमेंट लेजर उघडा
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
