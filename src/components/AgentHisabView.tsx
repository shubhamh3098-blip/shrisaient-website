import React, { useState, useMemo } from 'react';
import {
  Award,
  Calendar,
  HandCoins,
  TrendingUp,
  CreditCard,
  PlusCircle,
  Share2,
  Printer,
  UserCheck,
  Search,
  Filter,
  FileSpreadsheet,
  CheckCircle2,
  Banknote,
  Smartphone,
  ArrowRight,
  Receipt
} from 'lucide-react';
import {
  CardMember,
  CardTransaction,
  StaffMember,
  AgentAdvanceEntry,
  BusinessSettings,
  AuthUser
} from '../types';
import {
  getDistinctAgents,
  getAgentDailyStats,
  getAgentMonthlyStats,
  buildAgentDailyWhatsAppText,
  COMMISSION_RATE,
  CARD_BONUS_RATE
} from '../utils/agentCalculator';
import { AgentAdvanceModal } from './AgentAdvanceModal';
import { AgentMonthlySettlementModal } from './AgentMonthlySettlementModal';

interface AgentHisabViewProps {
  cardMembers: CardMember[];
  cardTransactions: CardTransaction[];
  agentAdvances: AgentAdvanceEntry[];
  staff: StaffMember[];
  settings: BusinessSettings;
  currentUser?: AuthUser | null;
  onNavigate: (tab: any) => void;
  onSaveAdvance: (advance: Omit<AgentAdvanceEntry, 'id' | 'createdAt'>) => void;
  onDeleteAdvance?: (advanceId: string) => void;
}

export const AgentHisabView: React.FC<AgentHisabViewProps> = ({
  cardMembers,
  cardTransactions,
  agentAdvances,
  staff,
  settings,
  currentUser,
  onNavigate,
  onSaveAdvance,
  onDeleteAdvance,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthStr = new Date().toISOString().slice(0, 7);

  const allAgents = useMemo(() => {
    return getDistinctAgents(cardMembers, cardTransactions, staff);
  }, [cardMembers, cardTransactions, staff]);

  const isAgentLoggedIn = currentUser?.role === 'staff' && currentUser?.name;

  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');
  const [selectedAgent, setSelectedAgent] = useState<string>(isAgentLoggedIn ? currentUser.name : 'all');
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [showAdvanceModal, setShowAdvanceModal] = useState<boolean>(false);
  const [showMonthlyModal, setShowMonthlyModal] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Daily Stats
  const dailyStats = useMemo(() => {
    return getAgentDailyStats(
      selectedAgent,
      selectedDate,
      cardTransactions,
      cardMembers,
      agentAdvances
    );
  }, [selectedAgent, selectedDate, cardTransactions, cardMembers, agentAdvances]);

  // Monthly Stats
  const monthlyStats = useMemo(() => {
    return getAgentMonthlyStats(
      selectedAgent,
      selectedMonth,
      cardTransactions,
      cardMembers,
      agentAdvances
    );
  }, [selectedAgent, selectedMonth, cardTransactions, cardMembers, agentAdvances]);

  // Advances list for selected filter
  const filteredAdvances = useMemo(() => {
    return agentAdvances.filter((adv) => {
      const matchesAgent = selectedAgent === 'all' || adv.agentName === selectedAgent;
      const matchesPeriod = viewMode === 'daily'
        ? adv.date === selectedDate
        : adv.date && adv.date.startsWith(selectedMonth);
      return matchesAgent && matchesPeriod;
    });
  }, [agentAdvances, selectedAgent, viewMode, selectedDate, selectedMonth]);

  const handleShareWhatsAppDaily = () => {
    const text = buildAgentDailyWhatsAppText(
      selectedAgent === 'all' ? 'All Agents' : selectedAgent,
      selectedDate,
      dailyStats,
      settings.businessName
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-fade-in text-slate-100">
      
      {/* Top Page Header */}
      <div className="tactile-card rounded-2xl p-6 border border-slate-800 bg-[#0f172a] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold text-xs border border-amber-500/30 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" />
              ४% कलेक्शन कमिशन + ₹५० बोनस प्रणाली
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              लाइव्ह रिअल-टाइम
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            {isAgentLoggedIn ? `माझा कमिशन व दैनिक हिशोब` : `एजंट हिशोब व कमिशन व्यवस्थापन (Agent Hub)`}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-3xl">
            प्रत्येक साप्ताहिक वसुलीवर थेट ४% कमिशन, नवीन कार्ड सुरू केल्यास ₹५० प्रति कार्ड प्रोत्साहन भत्ता, आणि दिवसनिहाय अॅडव्हान्स कपात.
          </p>
        </div>

        {/* Top Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowAdvanceModal(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer shadow-md"
          >
            <HandCoins className="w-4 h-4" />
            + अॅडव्हान्स नोंदवा (Give Advance)
          </button>
          <button
            onClick={() => onNavigate('card-scheme')}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs sm:text-sm border border-slate-700 transition flex items-center gap-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-amber-400" />
            + साप्ताहिक हप्ता जमा करा
          </button>
        </div>
      </div>

      {/* Control Tabs & Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        {/* Toggle: Daily vs Monthly */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800">
          <button
            onClick={() => setViewMode('daily')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              viewMode === 'daily'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            दैनिक हिशोब (Daily Hisab)
          </button>
          <button
            onClick={() => setViewMode('monthly')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              viewMode === 'monthly'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            मासिक सेटलमेंट (Monthly Breakdown)
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Agent Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400">एजंट:</span>
            {isAgentLoggedIn ? (
              <span className="px-3 py-1.5 rounded-xl bg-slate-800 border border-amber-500/40 text-amber-300 font-bold text-xs">
                {currentUser?.name}
              </span>
            ) : (
              <select
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-medium text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              >
                <option value="all">👥 सर्व एजंट्स (All)</option>
                {allAgents.map((ag) => (
                  <option key={ag} value={ag}>
                    👤 {ag}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Date or Month Picker */}
          {viewMode === 'daily' ? (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400">तारीख:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-medium text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400">महिना:</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-medium text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>
          )}

          {/* Share button */}
          <button
            onClick={viewMode === 'daily' ? handleShareWhatsAppDaily : () => setShowMonthlyModal(true)}
            className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            WhatsApp
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Metric 1 */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {viewMode === 'daily' ? 'आजची वसुली' : 'मासिक वसुली'}
            </span>
            <Banknote className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-white">
            ₹{(viewMode === 'daily' ? dailyStats.totalCollection : monthlyStats.totalCollection).toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {viewMode === 'daily' ? `${dailyStats.collectionCount} पावत्या` : 'एकूण योजना कलेक्शन'}
          </div>
        </div>

        {/* Metric 2: 4% Commission */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 shadow-md">
          <div className="flex items-center justify-between text-amber-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">४% कमिशन</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-300">
            ₹{(viewMode === 'daily' ? dailyStats.commissionAmount : monthlyStats.totalCommission).toLocaleString()}
          </div>
          <div className="text-[10px] text-amber-400/80 mt-1">
            कलेक्शन रकमेवर ४%
          </div>
        </div>

        {/* Metric 3: New Cards Bonus */}
        <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 shadow-md">
          <div className="flex items-center justify-between text-indigo-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">नवीन कार्ड्स</span>
            <CreditCard className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-indigo-300">
            {viewMode === 'daily' ? dailyStats.newCardsCount : monthlyStats.totalNewCards} <span className="text-xs font-normal">कार्ड्स</span>
          </div>
          <div className="text-[10px] text-indigo-400/80 mt-1">
            बोनस: ₹{(viewMode === 'daily' ? dailyStats.cardBonusAmount : monthlyStats.totalCardBonus).toLocaleString()} (₹50/कार्ड)
          </div>
        </div>

        {/* Metric 4: Total Gross Earnings */}
        <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 shadow-md">
          <div className="flex items-center justify-between text-blue-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">एकूण कमाई</span>
            <Award className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-300">
            ₹{(viewMode === 'daily' ? dailyStats.grossEarnings : monthlyStats.totalGross).toLocaleString()}
          </div>
          <div className="text-[10px] text-blue-400/80 mt-1">
            ४% + कार्ड इन्सेंटिव्ह
          </div>
        </div>

        {/* Metric 5: Advances Given */}
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 shadow-md">
          <div className="flex items-center justify-between text-rose-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">अॅडव्हान्स कपात</span>
            <HandCoins className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-300">
            ₹{(viewMode === 'daily' ? dailyStats.advancesAmount : monthlyStats.totalAdvances).toLocaleString()}
          </div>
          <div className="text-[10px] text-rose-400/80 mt-1">
            {filteredAdvances.length} अॅडव्हान्स नोंदी
          </div>
        </div>

        {/* Metric 6: Net Amount */}
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 shadow-md">
          <div className="flex items-center justify-between text-emerald-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">निव्वळ देय</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-300">
            ₹{(viewMode === 'daily' ? dailyStats.netPayable : monthlyStats.netPayable).toLocaleString()}
          </div>
          <div className="text-[10px] text-emerald-400/80 mt-1">
            हातात येणारी रक्कम
          </div>
        </div>
      </div>

      {/* Mode Content: Daily or Monthly Breakdown Table */}
      {viewMode === 'monthly' ? (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-400" />
                मासिक दिवसनिहाय हिशोब तक्ता ({selectedMonth})
              </h2>
              <p className="text-xs text-slate-400">
                प्रत्येक दिवसाची वसुली, ४% कमिशन, नवीन कार्ड्स बोनस आणि अॅडव्हान्स
              </p>
            </div>
            <button
              onClick={() => setShowMonthlyModal(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              मासिक पावती प्रिंट करा
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-300 border-b border-slate-700">
                <tr>
                  <th className="p-3 font-bold">तारीख (Date)</th>
                  <th className="p-3 font-bold text-right">वसुली (Collection ₹)</th>
                  <th className="p-3 font-bold text-right">४% कमिशन (₹)</th>
                  <th className="p-3 font-bold text-center">नवीन कार्ड्स</th>
                  <th className="p-3 font-bold text-right">कार्ड बोनस @ ₹50 (₹)</th>
                  <th className="p-3 font-bold text-right">एकूण कमाई (₹)</th>
                  <th className="p-3 font-bold text-right">अॅडव्हान्स (₹)</th>
                  <th className="p-3 font-bold text-right">निव्वळ देय (Net ₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {monthlyStats.dayRows.map((r) => (
                  <tr key={r.date} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 font-semibold font-mono">{r.date}</td>
                    <td className="p-3 text-right font-medium">₹{r.collection.toLocaleString()}</td>
                    <td className="p-3 text-right font-bold text-amber-400">₹{r.commission.toLocaleString()}</td>
                    <td className="p-3 text-center">
                      {r.newCards > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold">
                          +{r.newCards}
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                    <td className="p-3 text-right text-indigo-300">
                      {r.cardBonus > 0 ? `₹${r.cardBonus.toLocaleString()}` : '-'}
                    </td>
                    <td className="p-3 text-right font-bold text-blue-300">₹{r.gross.toLocaleString()}</td>
                    <td className="p-3 text-right text-rose-400">
                      {r.advances > 0 ? `-₹${r.advances.toLocaleString()}` : '-'}
                    </td>
                    <td className="p-3 text-right font-black text-emerald-400">₹{r.net.toLocaleString()}</td>
                  </tr>
                ))}
                {monthlyStats.dayRows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400 text-xs">
                      या महिन्यात या एजंटची कोणतीही नोंद आढळली नाही.
                    </td>
                  </tr>
                )}
              </tbody>
              {monthlyStats.dayRows.length > 0 && (
                <tfoot className="bg-slate-800 font-bold border-t-2 border-slate-700 text-white">
                  <tr>
                    <td className="p-3">एकूण महिना बेरीज (Total):</td>
                    <td className="p-3 text-right">₹{monthlyStats.totalCollection.toLocaleString()}</td>
                    <td className="p-3 text-right text-amber-400">₹{monthlyStats.totalCommission.toLocaleString()}</td>
                    <td className="p-3 text-center">{monthlyStats.totalNewCards}</td>
                    <td className="p-3 text-right text-indigo-300">₹{monthlyStats.totalCardBonus.toLocaleString()}</td>
                    <td className="p-3 text-right text-blue-300">₹{monthlyStats.totalGross.toLocaleString()}</td>
                    <td className="p-3 text-right text-rose-400">-₹{monthlyStats.totalAdvances.toLocaleString()}</td>
                    <td className="p-3 text-right text-emerald-400 text-sm">₹{monthlyStats.netPayable.toLocaleString()}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      ) : (
        /* Daily View Transactions & Cards List */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card Transactions Today */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-amber-400" />
                  आज जमा झालेले साप्ताहिक हप्ते ({dailyStats.transactions.length})
                </h3>
                <p className="text-[11px] text-slate-400">
                  या वसुलीवर ४% कमिशन लागू आहे
                </p>
              </div>
              <span className="text-xs font-bold text-amber-400">
                एकूण: ₹{dailyStats.totalCollection.toLocaleString()}
              </span>
            </div>

            <div className="divide-y divide-slate-800/80 max-h-[360px] overflow-y-auto">
              {dailyStats.transactions.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  आज या एजंटने अद्याप कोणताही हप्ता जमा केलेला नाही.
                </div>
              ) : (
                dailyStats.transactions.map((tx) => (
                  <div key={tx.id} className="p-3.5 hover:bg-slate-800/30 transition flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span className="text-amber-400">#{tx.cardNumber}</span>
                        <span>{tx.customerName}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        पावती: {tx.receiptNo} • एजंट: <strong>{tx.agentName}</strong> • {tx.paymentMode}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-sm text-emerald-400">₹{tx.amount.toLocaleString()}</div>
                      <div className="text-[10px] text-amber-400">
                        ४% = ₹{Math.round(tx.amount * 0.04)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* New Cards Issued Today */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-indigo-400" />
                  आज नोंदविलेले नवीन कार्ड्स ({dailyStats.newCards.length})
                </h3>
                <p className="text-[11px] text-slate-400">
                  प्रत्येक नवीन कार्डवर ₹५० प्रोत्साहन बोनस
                </p>
              </div>
              <span className="text-xs font-bold text-indigo-400">
                बोनस: ₹{dailyStats.cardBonusAmount.toLocaleString()}
              </span>
            </div>

            <div className="divide-y divide-slate-800/80 max-h-[360px] overflow-y-auto">
              {dailyStats.newCards.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  आज या एजंटने नवीन कार्ड उघडलेले नाही.
                </div>
              ) : (
                dailyStats.newCards.map((card) => (
                  <div key={card.id} className="p-3.5 hover:bg-slate-800/30 transition flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono text-[10px]">
                          #{card.cardNumber}
                        </span>
                        <span>{card.customerName}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        गाव: {card.village || 'N/A'} • फोन: {card.phone || 'N/A'} • एजंट: <strong>{card.agentName}</strong>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 font-black text-xs border border-indigo-500/30">
                        +₹50 बोनस
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Advances History Section */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <HandCoins className="w-5 h-5 text-amber-400" />
              दिवसनिहाय एजंट अॅडव्हान्स नोंदी (Agent Advances History)
            </h3>
            <p className="text-xs text-slate-400">
              एजंटला दिलेल्या अॅडव्हान्सची दिवसनिहाय नोंद, जी मासिक पगारातून वजा होते
            </p>
          </div>
          <button
            onClick={() => setShowAdvanceModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <HandCoins className="w-3.5 h-3.5" />
            + नवीन अॅडव्हान्स द्या
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-300 border-b border-slate-700">
              <tr>
                <th className="p-3 font-bold">तारीख (Date)</th>
                <th className="p-3 font-bold">एजंट (Agent)</th>
                <th className="p-3 font-bold text-right">रक्कम (Amount ₹)</th>
                <th className="p-3 font-bold text-center">पेमेंट पद्धत</th>
                <th className="p-3 font-bold">नोंद / कारण (Notes)</th>
                {onDeleteAdvance && <th className="p-3 font-bold text-center">कृती</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {filteredAdvances.map((adv) => (
                <tr key={adv.id} className="hover:bg-slate-800/40 transition">
                  <td className="p-3 font-mono font-semibold">{adv.date}</td>
                  <td className="p-3 font-bold text-white">{adv.agentName}</td>
                  <td className="p-3 text-right font-black text-rose-400">₹{adv.amount.toLocaleString()}</td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px]">
                      {adv.paymentMode}
                    </span>
                  </td>
                  <td className="p-3 text-slate-400">{adv.notes || '-'}</td>
                  {onDeleteAdvance && (
                    <td className="p-3 text-center">
                      <button
                        onClick={() => {
                          if (confirm('हा अॅडव्हान्स डिलीट करायचा आहे का?')) {
                            onDeleteAdvance(adv.id);
                          }
                        }}
                        className="text-slate-500 hover:text-rose-400 text-[11px] transition cursor-pointer"
                      >
                        हटवा
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {filteredAdvances.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400 text-xs">
                    कोणतीही अॅडव्हान्स नोंद आढळली नाही.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Advance Modal */}
      {showAdvanceModal && (
        <AgentAdvanceModal
          isOpen={showAdvanceModal}
          onClose={() => setShowAdvanceModal(false)}
          agents={allAgents}
          initialAgent={selectedAgent === 'all' ? allAgents[0] : selectedAgent}
          onSaveAdvance={onSaveAdvance}
          settings={settings}
        />
      )}

      {/* Monthly Settlement Modal */}
      {showMonthlyModal && (
        <AgentMonthlySettlementModal
          isOpen={showMonthlyModal}
          onClose={() => setShowMonthlyModal(false)}
          agents={allAgents}
          initialAgent={selectedAgent === 'all' ? allAgents[0] : selectedAgent}
          cardTransactions={cardTransactions}
          cardMembers={cardMembers}
          agentAdvances={agentAdvances}
          settings={settings}
          onOpenAdvanceModal={(ag) => {
            setShowMonthlyModal(false);
            setShowAdvanceModal(true);
          }}
        />
      )}
    </div>
  );
};
