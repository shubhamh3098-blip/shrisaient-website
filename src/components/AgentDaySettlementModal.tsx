import React, { useState, useMemo } from 'react';
import {
  X,
  CheckCircle2,
  Share2,
  Printer,
  Calendar,
  UserCheck,
  Building2,
  Clock,
  ArrowDownRight,
  HandCoins,
  Receipt,
  FileCheck,
  History,
  ShieldCheck,
  Banknote
} from 'lucide-react';
import {
  CardTransaction,
  CardMember,
  StaffMember,
  AgentAdvanceEntry,
  BusinessSettings,
  AgentDaySettlement
} from '../types';
import {
  getAgentDailyStats,
  AgentPeriodStats
} from '../utils/agentCalculator';

interface AgentDaySettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
  agents: string[];
  initialAgent?: string;
  cardTransactions: CardTransaction[];
  cardMembers: CardMember[];
  agentAdvances: AgentAdvanceEntry[];
  settings: BusinessSettings;
  activeUserName?: string;
  onShowToast?: (msg: string, type: 'success' | 'info' | 'error') => void;
}

export const AgentDaySettlementModal: React.FC<AgentDaySettlementModalProps> = ({
  isOpen,
  onClose,
  agents,
  initialAgent,
  cardTransactions,
  cardMembers,
  agentAdvances,
  settings,
  activeUserName = 'Admin (Shubham)',
  onShowToast,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedAgent, setSelectedAgent] = useState<string>(initialAgent && initialAgent !== 'all' ? initialAgent : (agents[0] || 'Rahul Sharma'));
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [activeTab, setActiveTab] = useState<'settle' | 'history'>('settle');

  // Custom handover input (if agent submitted slightly more/less cash)
  const [cashHandoverInput, setCashHandoverInput] = useState<string>('');
  const [settlementNotes, setSettlementNotes] = useState<string>('');

  // Local storage settlements history
  const [settlementsHistory, setSettlementsHistory] = useState<AgentDaySettlement[]>(() => {
    try {
      const saved = localStorage.getItem('shri_sai_agent_day_settlements');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Calculate day stats for the selected agent & date
  const stats: AgentPeriodStats = useMemo(() => {
    return getAgentDailyStats(
      selectedAgent,
      selectedDate,
      cardTransactions,
      cardMembers,
      agentAdvances,
      'all'
    );
  }, [selectedAgent, selectedDate, cardTransactions, cardMembers, agentAdvances]);

  // Expected cash handed over to shop counter = Total Collection minus Net Payable Commission
  // (Or if shop pays commission separately at month end, Cash Handover is full Collection minus advances)
  const defaultCashHandover = Math.max(0, stats.totalCollection - stats.netPayable);

  // Sync cashHandoverInput when agent/date changes
  React.useEffect(() => {
    setCashHandoverInput(String(defaultCashHandover));
  }, [selectedAgent, selectedDate, defaultCashHandover]);

  if (!isOpen) return null;

  const actualHandover = cashHandoverInput === '' ? defaultCashHandover : Number(cashHandoverInput) || 0;
  const discrepancy = actualHandover - defaultCashHandover;

  const handleSaveSettlement = () => {
    const record: AgentDaySettlement = {
      id: `stl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      date: selectedDate,
      agentName: selectedAgent,
      totalCollection: stats.totalCollection,
      collectionCount: stats.collectionCount,
      commissionEarned: stats.commissionAmount,
      newCardsCount: stats.newCardsCount,
      cardBonusEarned: stats.cardBonusAmount,
      grossEarnings: stats.grossEarnings,
      advancesDeducted: stats.advancesAmount,
      netCommissionPayable: stats.netPayable,
      cashHandedOverToShop: actualHandover,
      settlementStatus: 'Settled',
      settledBy: activeUserName,
      notes: settlementNotes,
      createdAt: new Date().toISOString(),
    };

    const updated = [record, ...settlementsHistory];
    setSettlementsHistory(updated);
    try {
      localStorage.setItem('shri_sai_agent_day_settlements', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }

    if (onShowToast) {
      onShowToast(`✓ ${selectedAgent} यांचा ${selectedDate} चा दैनिक कॅश हिशोब व सेटलमेंट यशस्वीरित्या पूर्ण झाली!`, 'success');
    }
    setActiveTab('history');
  };

  const handleShareWhatsAppSettlement = (item: AgentDaySettlement) => {
    const text = encodeURIComponent(
      `*${settings.businessName || 'SHRI SAI ENTERPRISES, WARDHA'}*\n` +
      `*🤝 दैनिक एजंट कॅश हँडओव्हर व सेटलमेंट पावती*\n` +
      `--------------------------------\n` +
      `👤 एजंट: *${item.agentName}*\n` +
      `📅 तारीख: *${item.date}*\n` +
      `🏢 काउंटरवर जमा कॅश: *₹${item.cashHandedOverToShop.toLocaleString()}*\n` +
      `--------------------------------\n` +
      `💰 आजचे एकूण कार्ड कलेक्शन: *₹${item.totalCollection.toLocaleString()}* (${item.collectionCount} पावत्या)\n` +
      `✨ ४% वसुली कमिशन: *₹${item.commissionEarned.toLocaleString()}*\n` +
      `💳 नवीन कार्ड्स बोनस: *₹${item.cardBonusEarned.toLocaleString()}* (${item.newCardsCount} कार्ड्स)\n` +
      `💵 एकूण कमाई (Gross): *₹${item.grossEarnings.toLocaleString()}*\n` +
      (item.advancesDeducted > 0 ? `🔻 वजा आजचा अॅडव्हान्स: *₹${item.advancesDeducted.toLocaleString()}*\n` : '') +
      `🎯 *निव्वळ देय कमिशन: ₹${item.netCommissionPayable.toLocaleString()}*\n` +
      `--------------------------------\n` +
      `✅ स्थिती: *सेटलमेंट पूर्ण (Settled by ${item.settledBy || 'Admin'})*\n` +
      (item.notes ? `📝 शेरा: ${item.notes}\n` : '') +
      `_श्री साई इंटरप्राइजेस, आर्वी रोड, वर्धा • 8766486915_`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handlePrintSettlementReceipt = (item: AgentDaySettlement) => {
    const printContent = `
      <html>
        <head>
          <title>Agent Settlement - ${item.agentName} - ${item.date}</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 24px; color: #111; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 12px; }
            .title { font-size: 18px; font-weight: bold; }
            .sub { font-size: 12px; color: #555; }
            .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #ccc; font-size: 13px; }
            .total-box { border: 2px solid #000; padding: 8px; margin-top: 14px; text-align: center; font-size: 15px; font-weight: bold; background: #f9f9f9; }
            .footer { margin-top: 30px; display: flex; justify-content: space-between; font-size: 12px; }
            .sign { border-top: 1px solid #444; width: 140px; text-align: center; padding-top: 4px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">${settings.businessName}</div>
            <div class="sub">${settings.address} • Phone: ${settings.phone}</div>
            <div style="margin-top: 6px; font-weight: bold; font-size: 14px;">दैनिक एजंट कॅश हिशोब व पावती (Daily Settlement)</div>
          </div>
          <div class="row"><span>एजंट नाव:</span><strong>${item.agentName}</strong></div>
          <div class="row"><span>तारीख:</span><strong>${item.date}</strong></div>
          <div class="row"><span>एकूण गोळा केलेले कलेक्शन:</span><strong>₹${item.totalCollection.toLocaleString()} (${item.collectionCount} पावत्या)</strong></div>
          <div class="row"><span>४% कलेक्शन कमिशन:</span><strong>₹${item.commissionEarned.toLocaleString()}</strong></div>
          <div class="row"><span>नवीन कार्ड बोनस (₹५० प्रति कार्ड):</span><strong>₹${item.cardBonusEarned.toLocaleString()} (${item.newCardsCount} कार्ड्स)</strong></div>
          <div class="row"><span>एकूण कमिशन कमाई:</span><strong>₹${item.grossEarnings.toLocaleString()}</strong></div>
          ${item.advancesDeducted > 0 ? `<div class="row"><span>वजा आजचा अॅडव्हान्स:</span><strong>- ₹${item.advancesDeducted.toLocaleString()}</strong></div>` : ''}
          <div class="row"><span>निव्वळ कमिशन देय:</span><strong>₹${item.netCommissionPayable.toLocaleString()}</strong></div>
          <div class="total-box">दुकान काउंटरवर जमा निव्वळ कॅश: ₹${item.cashHandedOverToShop.toLocaleString()}</div>
          <div class="footer">
            <div class="sign">एजंट स्वाक्षरी<br><small>(${item.agentName})</small></div>
            <div class="sign">दुकान मालक / कॅशियर<br><small>(${item.settledBy || 'Shubham'})</small></div>
          </div>
        </body>
      </html>
    `;
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(printContent);
      win.document.close();
      win.focus();
      setTimeout(() => {
        win.print();
        win.close();
      }, 300);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-600 text-slate-950 p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-950/15 text-slate-950">
              <HandCoins className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                दैनिक एजंट कॅश हँडओव्हर व सेटलमेंट (Day-End Cash Handover)
              </h2>
              <p className="text-xs font-semibold opacity-90">
                दिवस अखेरीस एजंटने जमा केलेली कॅश, ४% कमिशन व निव्वळ हिशोब पावती
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-950/10 hover:bg-slate-950/20 text-slate-950 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-4 sm:px-6 pt-3 pb-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('settle')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'settle'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>आजचा हिशोब व पावती (Settle Cash)</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>सेटलमेंट इतिहास ({settlementsHistory.length})</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs sm:text-sm">
          {activeTab === 'settle' ? (
            <>
              {/* Agent & Date Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    एजंट निवडा (Agent):
                  </label>
                  <select
                    value={selectedAgent}
                    onChange={(e) => setSelectedAgent(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-amber-500 cursor-pointer"
                  >
                    {agents.map((ag) => (
                      <option key={ag} value={ag}>
                        👤 {ag}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    तारीख (Date):
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Performance & Calculation Summary Card */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 bg-white dark:bg-slate-850">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    दैनिक वसुली व कमिशन तपशील
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-[11px] font-bold">
                    {stats.collectionCount} पावत्या
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 block">एकूण वसुली (Total)</span>
                    <span className="text-base font-black text-slate-900 dark:text-white">
                      ₹{stats.totalCollection.toLocaleString()}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-900/60">
                    <span className="text-[10px] text-amber-700 dark:text-amber-300 block">४% कमिशन</span>
                    <span className="text-base font-black text-amber-700 dark:text-amber-400">
                      ₹{stats.commissionAmount.toLocaleString()}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/70 dark:border-indigo-900/60">
                    <span className="text-[10px] text-indigo-700 dark:text-indigo-300 block">कार्ड बोनस (₹५०)</span>
                    <span className="text-base font-black text-indigo-700 dark:text-indigo-400">
                      ₹{stats.cardBonusAmount.toLocaleString()} ({stats.newCardsCount})
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-900/60">
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-300 block">निव्वळ देय कमिशन</span>
                    <span className="text-base font-black text-emerald-700 dark:text-emerald-400">
                      ₹{stats.netPayable.toLocaleString()}
                    </span>
                  </div>
                </div>

                {stats.advancesAmount > 0 && (
                  <div className="p-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex justify-between">
                    <span>आज घेतलेला अॅडव्हान्स (कपात):</span>
                    <strong>- ₹{stats.advancesAmount.toLocaleString()}</strong>
                  </div>
                )}
              </div>

              {/* Handover Amount Input */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="block text-xs font-black text-amber-950 dark:text-amber-200 uppercase tracking-wide">
                      काउंटरवर प्रत्यक्षात जमा केलेली कॅश (Cash Handed Over to Counter):
                    </label>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      अपेक्षित काउंटर कॅश: <strong className="font-mono text-slate-900 dark:text-white">₹{defaultCashHandover.toLocaleString()}</strong> (वसुली वजा कमिशन)
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-slate-700 dark:text-slate-300">₹</span>
                    <input
                      type="number"
                      value={cashHandoverInput}
                      onChange={(e) => setCashHandoverInput(e.target.value)}
                      placeholder={String(defaultCashHandover)}
                      className="w-36 px-3 py-2 text-lg font-black font-mono rounded-xl bg-white dark:bg-slate-900 border-2 border-amber-500 text-slate-950 dark:text-white text-right focus:outline-hidden"
                    />
                  </div>
                </div>

                {discrepancy !== 0 && (
                  <div className={`p-2 rounded-xl text-xs font-bold flex justify-between items-center ${
                    discrepancy > 0
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                      : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                  }`}>
                    <span>{discrepancy > 0 ? '✓ अतिरिक्त कॅश जमा:' : '⚠️ कमी कॅश आली (शिल्लक):'}</span>
                    <span className="font-mono font-black">₹{Math.abs(discrepancy).toLocaleString()}</span>
                  </div>
                )}

                <div>
                  <input
                    type="text"
                    value={settlementNotes}
                    onChange={(e) => setSettlementNotes(e.target.value)}
                    placeholder="हिशोबाचा शेरा (उदा. उर्वरित ₹५०० उद्या जमा करतील...)"
                    className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  रद्द करा
                </button>
                <button
                  type="button"
                  onClick={handleSaveSettlement}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black transition flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>सेटलमेंट पूर्ण करा व पावती नोंदवा</span>
                </button>
              </div>
            </>
          ) : (
            /* History Tab */
            <div className="space-y-3">
              {settlementsHistory.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  कोणतीही सेटलमेंट पावती अद्याप नोंदवलेली नाही.
                </div>
              ) : (
                settlementsHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          👤 {item.agentName}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                          {item.date}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[10px]">
                          ✓ Settled
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        एकूण वसुली: <strong>₹{item.totalCollection.toLocaleString()}</strong> ({item.collectionCount} पावत्या) • कमिशन: <strong>₹{item.commissionEarned.toLocaleString()}</strong> • बोनस: <strong>₹{item.cardBonusEarned.toLocaleString()}</strong>
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-400 font-bold">
                        काउंटरवर जमा निव्वळ कॅश: ₹{item.cashHandedOverToShop.toLocaleString()}
                      </p>
                      {item.notes && (
                        <p className="text-[11px] text-slate-500 italic">
                          शेरा: {item.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handlePrintSettlementReceipt(item)}
                        className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center gap-1.5 hover:bg-blue-100 cursor-pointer"
                        title="प्रिंट पावती"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>प्रिंट</span>
                      </button>
                      <button
                        onClick={() => handleShareWhatsAppSettlement(item)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center gap-1.5 hover:bg-emerald-100 cursor-pointer"
                        title="WhatsApp द्वारे पाठवा"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
