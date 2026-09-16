import React, { useState, useMemo } from 'react';
import {
  Banknote,
  Smartphone,
  TrendingUp,
  CreditCard,
  PlusCircle,
  Calendar,
  Share2,
  Printer,
  HandCoins,
  Award,
  ChevronRight,
  UserCheck,
  CheckCircle2,
  Clock,
  ArrowUpRight,
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
  buildAgentDailyWhatsAppText,
  COMMISSION_RATE,
  CARD_BONUS_RATE
} from '../utils/agentCalculator';
import { AgentAdvanceModal } from './AgentAdvanceModal';
import { AgentMonthlySettlementModal } from './AgentMonthlySettlementModal';

interface AgentHisabWidgetProps {
  cardMembers: CardMember[];
  cardTransactions: CardTransaction[];
  agentAdvances: AgentAdvanceEntry[];
  staff: StaffMember[];
  settings: BusinessSettings;
  currentUser?: AuthUser | null;
  onNavigate: (tab: any) => void;
  onSaveAdvance: (advance: Omit<AgentAdvanceEntry, 'id' | 'createdAt'>) => void;
}

export const AgentHisabWidget: React.FC<AgentHisabWidgetProps> = ({
  cardMembers,
  cardTransactions,
  agentAdvances,
  staff,
  settings,
  currentUser,
  onNavigate,
  onSaveAdvance,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  const allAgents = useMemo(() => {
    return getDistinctAgents(cardMembers, cardTransactions, staff);
  }, [cardMembers, cardTransactions, staff]);

  // Determine if current logged-in user is an agent/staff
  const isAgentLoggedIn = currentUser?.role === 'staff' && currentUser?.name;
  const initialAgentSelection = isAgentLoggedIn ? currentUser.name : 'all';

  const [selectedAgent, setSelectedAgent] = useState<string>(initialAgentSelection);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [showAdvanceModal, setShowAdvanceModal] = useState<boolean>(false);
  const [showMonthlyModal, setShowMonthlyModal] = useState<boolean>(false);
  const [advanceModalAgent, setAdvanceModalAgent] = useState<string>('');

  // Daily statistics for selected agent and date
  const stats = useMemo(() => {
    return getAgentDailyStats(
      selectedAgent,
      selectedDate,
      cardTransactions,
      cardMembers,
      agentAdvances
    );
  }, [selectedAgent, selectedDate, cardTransactions, cardMembers, agentAdvances]);

  // Agent breakdown for the selected day (for admin view)
  const agentBreakdown = useMemo(() => {
    return allAgents.map((ag) => {
      const agStats = getAgentDailyStats(
        ag,
        selectedDate,
        cardTransactions,
        cardMembers,
        agentAdvances
      );
      return agStats;
    }).filter((s) => s.totalCollection > 0 || s.newCardsCount > 0 || s.advancesAmount > 0);
  }, [allAgents, selectedDate, cardTransactions, cardMembers, agentAdvances]);

  // Share daily hisab on WhatsApp
  const handleShareDaily = (agentToShare?: string) => {
    const targetAgent = agentToShare || (selectedAgent === 'all' ? 'All Agents' : selectedAgent);
    const targetStats = agentToShare
      ? getAgentDailyStats(agentToShare, selectedDate, cardTransactions, cardMembers, agentAdvances)
      : stats;

    const text = buildAgentDailyWhatsAppText(
      targetAgent,
      selectedDate,
      targetStats,
      settings.businessName
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleOpenAdvance = (agentName?: string) => {
    setAdvanceModalAgent(agentName || (selectedAgent === 'all' ? allAgents[0] : selectedAgent));
    setShowAdvanceModal(true);
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden mb-6 text-slate-100">
      
      {/* Widget Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-xs">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold text-[10px] tracking-wider border border-amber-500/30 uppercase">
                4% कमिशन + ₹50 बोनस
              </span>
              <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                रियल-टाइम सिंक
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2 mt-0.5">
              {isAgentLoggedIn ? `माझा दैनिक वसुली व कमिशन हिशोब` : `एजंट दैनिक व साप्ताहिक हिशोब केंद्र`}
            </h2>
            <p className="text-xs text-slate-400">
              {isAgentLoggedIn
                ? `स्वागत आहे, ${currentUser?.name}! तुमच्या आजच्या वसुलीवर थेट ४% कमिशन व प्रत्येक नवीन कार्डवर ₹५० बोनस.`
                : `एजंट वसुलीवर ४% कमिशन, प्रति नवीन कार्ड ₹५० इन्सेंटिव्ह व दिवसनिहाय अॅडव्हान्स ट्रॅकिंग.`}
            </p>
          </div>
        </div>

        {/* Action Shortcuts */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Add Advance button */}
          <button
            onClick={() => handleOpenAdvance()}
            className="px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <HandCoins className="w-3.5 h-3.5" />
            + अॅडव्हान्स नोंदवा (+ Advance)
          </button>

          {/* Monthly Settlement Modal */}
          <button
            onClick={() => setShowMonthlyModal(true)}
            className="px-3.5 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Calendar className="w-3.5 h-3.5" />
            मासिक हिशोब (Monthly)
          </button>

          {/* WhatsApp Share */}
          <button
            onClick={() => handleShareDaily()}
            className="px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Share Today's Hisab on WhatsApp"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">WhatsApp</span>
          </button>
        </div>
      </div>

      {/* Filter Bar: Agent Selector & Date Switcher */}
      <div className="p-3 sm:p-4 bg-slate-800/60 border-b border-slate-700/60 flex flex-wrap items-center justify-between gap-3">
        {/* Agent Filter (Selectable for admin, or locked badge for logged-in agent) */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-300">एजंट (Agent):</span>
          {isAgentLoggedIn ? (
            <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center gap-2">
              <UserCheck className="w-3.5 h-3.5 text-amber-400" />
              {currentUser?.name}
            </div>
          ) : (
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden cursor-pointer"
            >
              <option value="all">👥 सर्व एजंट्स (All Agents)</option>
              {allAgents.map((ag) => (
                <option key={ag} value={ag}>
                  👤 {ag}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setSelectedDate(todayStr)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedDate === todayStr
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            आज (Today)
          </button>
          <button
            onClick={() => setSelectedDate(yesterdayStr)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedDate === yesterdayStr
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            काल (Yesterday)
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Main KPI Summary Dashboard */}
      <div className="p-4 sm:p-5">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
          {/* 1. Collection Amount */}
          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">आजची वसुली</span>
              <Banknote className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white">
              ₹{stats.totalCollection.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              {stats.collectionCount} हप्ते जमा (Weekly txs)
            </div>
          </div>

          {/* 2. 4% Commission */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <div className="flex items-center justify-between text-amber-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">४% कमिशन</span>
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-300">
              ₹{stats.commissionAmount.toLocaleString()}
            </div>
            <div className="text-[10px] text-amber-400/80 mt-1 font-medium">
              ₹{stats.totalCollection.toLocaleString()} × 4%
            </div>
          </div>

          {/* 3. New Cards Opened */}
          <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30">
            <div className="flex items-center justify-between text-indigo-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">नवीन कार्ड्स</span>
              <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-indigo-300">
              {stats.newCardsCount} <span className="text-xs font-normal">कार्ड</span>
            </div>
            <div className="text-[10px] text-indigo-400/80 mt-1">
              {stats.newCardsCount > 0 ? `+₹${stats.cardBonusAmount.toLocaleString()} बोनस` : `₹50 प्रति नवीन कार्ड`}
            </div>
          </div>

          {/* 4. Total Gross Commission */}
          <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30">
            <div className="flex items-center justify-between text-blue-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">एकूण कमाई</span>
              <Award className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-blue-300">
              ₹{stats.grossEarnings.toLocaleString()}
            </div>
            <div className="text-[10px] text-blue-400/80 mt-1">
              कमिशन + कार्ड बोनस
            </div>
          </div>

          {/* 5. Advances Given Today */}
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30">
            <div className="flex items-center justify-between text-rose-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">अॅडव्हान्स</span>
              <HandCoins className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-rose-300">
              ₹{stats.advancesAmount.toLocaleString()}
            </div>
            <div className="text-[10px] text-rose-400/80 mt-1">
              {stats.advances.length} नोंदी (Advances)
            </div>
          </div>

          {/* 6. Net Amount for Day */}
          <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40">
            <div className="flex items-center justify-between text-emerald-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">निव्वळ देय</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-300">
              ₹{stats.netPayable.toLocaleString()}
            </div>
            <div className="text-[10px] text-emerald-400/80 mt-1">
              कमाई - अॅडव्हान्स
            </div>
          </div>
        </div>

        {/* Quick Action Banner for Mobile Speed */}
        <div className="bg-slate-800/50 rounded-xl p-3.5 border border-slate-700/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>
              <strong>साप्ताहिक हप्ता जमा करणे:</strong> कार्ड योजनेमध्ये जावून ग्राहकाचा हप्ता थेट जमा करा, हिशोब आपोआप अपडेट होतो.
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onNavigate('card-scheme')}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <PlusCircle className="w-4 h-4" />
              + साप्ताहिक हप्ता जमा करा (Weekly Pay)
            </button>
          </div>
        </div>

        {/* Agent-Wise Performance Breakdown on Selected Date (When 'all' or multiple agents) */}
        {selectedAgent === 'all' && agentBreakdown.length > 0 && (
          <div className="mt-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-amber-400" />
              आज काम केलेल्या एजंट्सचा तपशील ({selectedDate}):
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {agentBreakdown.map((ag) => (
                <div
                  key={ag.agentName}
                  className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/70 hover:border-amber-500/40 transition flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      {ag.agentName}
                    </span>
                    <button
                      onClick={() => handleShareDaily(ag.agentName)}
                      className="p-1.5 rounded-lg bg-slate-700/60 hover:bg-emerald-600/30 text-slate-300 hover:text-emerald-400 transition"
                      title="Share WhatsApp"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 text-center text-xs py-1.5 border-y border-slate-700/60 my-1.5">
                    <div>
                      <div className="text-[10px] text-slate-400">वसुली</div>
                      <div className="font-bold text-white">₹{ag.totalCollection.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-amber-400">४% कमिशन</div>
                      <div className="font-bold text-amber-300">₹{ag.commissionAmount.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-indigo-400">नवीन कार्ड्स</div>
                      <div className="font-bold text-indigo-300">
                        {ag.newCardsCount > 0 ? `+${ag.newCardsCount} (₹${ag.cardBonusAmount})` : '-'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-[11px] text-slate-400">
                      अॅडव्हान्स: <strong className="text-rose-400">₹{ag.advancesAmount}</strong>
                    </span>
                    <span className="text-xs font-black text-emerald-400">
                      निव्वळ: ₹{ag.netPayable.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Advance Modal */}
      {showAdvanceModal && (
        <AgentAdvanceModal
          isOpen={showAdvanceModal}
          onClose={() => setShowAdvanceModal(false)}
          agents={allAgents}
          initialAgent={advanceModalAgent}
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
            handleOpenAdvance(ag);
          }}
        />
      )}
    </div>
  );
};
