import React, { useState, useMemo } from 'react';
import {
  X,
  Printer,
  Share2,
  Calendar,
  HandCoins,
  TrendingUp,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  FileText,
  UserCheck
} from 'lucide-react';
import { CardMember, CardTransaction, AgentAdvanceEntry, BusinessSettings } from '../types';
import { getAgentMonthlyStats } from '../utils/agentCalculator';

interface AgentMonthlySettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
  agents: string[];
  initialAgent?: string;
  cardTransactions: CardTransaction[];
  cardMembers: CardMember[];
  agentAdvances: AgentAdvanceEntry[];
  settings: BusinessSettings;
  onOpenAdvanceModal?: (agentName: string) => void;
}

export const AgentMonthlySettlementModal: React.FC<AgentMonthlySettlementModalProps> = ({
  isOpen,
  onClose,
  agents,
  initialAgent,
  cardTransactions,
  cardMembers,
  agentAdvances,
  settings,
  onOpenAdvanceModal,
}) => {
  const currentYearMonth = new Date().toISOString().slice(0, 7); // 'YYYY-MM'
  const [selectedMonth, setSelectedMonth] = useState<string>(currentYearMonth);
  const [selectedAgent, setSelectedAgent] = useState<string>(initialAgent || agents[0] || '');

  // Calculate monthly stats
  const monthlyStats = useMemo(() => {
    return getAgentMonthlyStats(
      selectedAgent,
      selectedMonth,
      cardTransactions,
      cardMembers,
      agentAdvances
    );
  }, [selectedAgent, selectedMonth, cardTransactions, cardMembers, agentAdvances]);

  if (!isOpen) return null;

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `*${settings.businessName || 'SHRI SAI ENTERPRISES'}*\n` +
      `*📊 एजंट मासिक पगार व कमिशन सेटलमेंट (Monthly Settlement)*\n` +
      `--------------------------------\n` +
      `👤 एजंट: *${selectedAgent}*\n` +
      `📅 महिना: *${selectedMonth}*\n` +
      `--------------------------------\n` +
      `💰 एकूण वसुली (Total Collection): *₹${monthlyStats.totalCollection.toLocaleString()}*\n` +
      `✨ ४% कलेक्शन कमिशन (4% Comm): *₹${monthlyStats.totalCommission.toLocaleString()}*\n` +
      `💳 नवीन कार्ड्स नोंद (New Cards): *${monthlyStats.totalNewCards}* कार्ड्स\n` +
      `🎁 कार्ड इन्सेंटिव्ह (Card Bonus @ ₹50): *₹${monthlyStats.totalCardBonus.toLocaleString()}*\n` +
      `--------------------------------\n` +
      `💵 एकूण कमाई (Gross Earnings): *₹${monthlyStats.totalGross.toLocaleString()}*\n` +
      `🔻 महिनाभरात घेतलेला एकूण अॅडव्हान्स (Advances): *₹${monthlyStats.totalAdvances.toLocaleString()}*\n` +
      `--------------------------------\n` +
      `🎯 *देय निव्वळ शिल्लक रक्कम (Net Payable): ₹${monthlyStats.netPayable.toLocaleString()}*\n` +
      `--------------------------------\n` +
      `_श्री साई इंटरप्राइजेस, वर्धा • संपर्क: ${settings.phone}_`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-2 sm:p-4 animate-fade-in print:p-0 print:static print:bg-white">
      <div className="bg-[#0f172a] text-slate-100 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col border border-slate-700 shadow-2xl overflow-hidden print:max-w-none print:max-h-none print:border-none print:rounded-none print:bg-white print:text-black">
        
        {/* Header - Screen only */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                मासिक एजंट पगार व कमिशन हिशोब (Monthly Agent Settlement)
              </h2>
              <p className="text-xs text-slate-400">
                4% collection commission + ₹50 per card - day-wise advances
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="Print Monthly Slip"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">प्रिंट (Print)</span>
            </button>
            <button
              onClick={handleShareWhatsApp}
              className="p-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="Share on WhatsApp"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Controls Bar - Screen only */}
        <div className="p-4 bg-slate-800/60 border-b border-slate-700/60 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 no-print">
          {/* Agent Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              एजंट निवडा (Select Agent)
            </label>
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            >
              {agents.map((ag) => (
                <option key={ag} value={ag}>
                  {ag}
                </option>
              ))}
            </select>
          </div>

          {/* Month Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              महिना निवडा (Select Month)
            </label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>

          {/* Quick Action: Add Advance */}
          <div className="flex items-end">
            {onOpenAdvanceModal && (
              <button
                type="button"
                onClick={() => onOpenAdvanceModal(selectedAgent)}
                className="w-full py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/40 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <HandCoins className="w-4 h-4" />
                + या एजंटला अॅडव्हान्स द्या (+ Advance)
              </button>
            )}
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 print:overflow-visible print:p-0">

          {/* Printable Header (Visible only on Print) */}
          <div className="hidden print:block text-center border-b-2 border-black pb-4 mb-6">
            <h1 className="text-2xl font-bold uppercase tracking-wider">{settings.businessName || 'SHRI SAI ENTERPRISES'}</h1>
            <p className="text-sm">{settings.address || 'Matoshree Sabhagruha Samor, Arvi Road, Wardha'}</p>
            <p className="text-xs">फोन: {settings.phone} | GSTIN: {settings.gstin || 'N/A'}</p>
            <div className="mt-3 inline-block px-4 py-1 border border-black font-bold text-sm uppercase">
              एजंट मासिक पगार व कमिशन सेटलमेंट पावती ({selectedMonth})
            </div>
            <div className="mt-2 flex justify-between text-xs px-4">
              <span>एजंट नाव: <strong>{selectedAgent}</strong></span>
              <span>तारीख: <strong>{new Date().toLocaleDateString('en-IN')}</strong></span>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 print:grid-cols-4 print:gap-2">
            {/* Card 1: Total Collections */}
            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 print:bg-white print:border-black print:text-black">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 print:text-slate-600 block mb-1">
                एकूण वसुली (Collection)
              </span>
              <div className="text-xl sm:text-2xl font-black text-white print:text-black">
                ₹{monthlyStats.totalCollection.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                4% दरानुसार कमिशन पात्र
              </div>
            </div>

            {/* Card 2: 4% Commission */}
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 print:bg-white print:border-black print:text-black">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400 print:text-slate-600 block mb-1">
                ४% कमिशन (4% Comm)
              </span>
              <div className="text-xl sm:text-2xl font-black text-amber-300 print:text-black">
                ₹{monthlyStats.totalCommission.toLocaleString()}
              </div>
              <div className="text-[10px] text-amber-400/80 mt-1">
                ₹{monthlyStats.totalCollection.toLocaleString()} × 4%
              </div>
            </div>

            {/* Card 3: New Cards & Bonus */}
            <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 print:bg-white print:border-black print:text-black">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400 print:text-slate-600 block mb-1">
                नवीन कार्ड्स (₹50/कार्ड)
              </span>
              <div className="text-xl sm:text-2xl font-black text-indigo-300 print:text-black">
                {monthlyStats.totalNewCards} <span className="text-xs font-normal">कार्ड्स</span> = ₹{monthlyStats.totalCardBonus.toLocaleString()}
              </div>
              <div className="text-[10px] text-indigo-400/80 mt-1">
                {monthlyStats.totalNewCards} कार्ड्स × ₹50 बोनस
              </div>
            </div>

            {/* Card 4: Net Payable */}
            <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40 print:bg-white print:border-black print:text-black">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400 print:text-slate-600 block mb-1">
                निव्वळ देय (Net Payable)
              </span>
              <div className="text-xl sm:text-2xl font-black text-emerald-300 print:text-black">
                ₹{monthlyStats.netPayable.toLocaleString()}
              </div>
              <div className="text-[10px] text-emerald-400/80 mt-1">
                कमाई ₹{monthlyStats.totalGross.toLocaleString()} - अॅडव्हान्स ₹{monthlyStats.totalAdvances.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Advances Itemized Breakdown (If any) */}
          {monthlyStats.advancesList.length > 0 && (
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 print:bg-white print:border-black">
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 print:text-black flex items-center gap-1.5">
                  <HandCoins className="w-4 h-4" /> महिनाभरातील अॅडव्हान्स नोंदी (Advances Given)
                </h3>
                <span className="text-xs font-bold text-amber-300 print:text-black">
                  एकूण अॅडव्हान्स: ₹{monthlyStats.totalAdvances.toLocaleString()}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {monthlyStats.advancesList.map((adv) => (
                  <div
                    key={adv.id}
                    className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs print:border-slate-300 print:bg-slate-50 print:text-black"
                  >
                    <div>
                      <div className="font-semibold text-slate-200 print:text-black">{adv.date}</div>
                      <div className="text-[10px] text-slate-400">{adv.paymentMode} {adv.notes ? `• ${adv.notes}` : ''}</div>
                    </div>
                    <div className="font-bold text-amber-400 print:text-black">
                      ₹{adv.amount.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Day-by-Day Historical Breakdown Table */}
          <div className="rounded-xl border border-slate-700/70 overflow-hidden bg-slate-900/40 print:bg-white print:border-black">
            <div className="px-4 py-3 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between print:bg-slate-100 print:border-black">
              <h3 className="text-xs sm:text-sm font-bold text-white print:text-black flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                दिवसनिहाय वसुली व कमिशन तपशील (Day-wise Hisab Breakdown)
              </h3>
              <span className="text-xs text-slate-400 print:text-slate-600">
                {monthlyStats.dayRows.length} कार्य दिवस (Active Days)
              </span>
            </div>

            {monthlyStats.dayRows.length === 0 ? (
              <div className="p-8 text-center text-slate-400 print:text-black text-xs">
                या महिन्यात या एजंटचे कोणतेही कलेक्शन अथवा नवीन कार्ड नोंद झालेले नाही.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/90 text-slate-300 border-b border-slate-700 print:bg-slate-200 print:text-black print:border-black">
                    <tr>
                      <th className="p-2.5 font-bold">तारीख (Date)</th>
                      <th className="p-2.5 font-bold text-right">कलेक्शन (₹)</th>
                      <th className="p-2.5 font-bold text-right">४% कमिशन (₹)</th>
                      <th className="p-2.5 font-bold text-center">नवीन कार्ड्स</th>
                      <th className="p-2.5 font-bold text-right">कार्ड बोनस (₹)</th>
                      <th className="p-2.5 font-bold text-right">अॅडव्हान्स (₹)</th>
                      <th className="p-2.5 font-bold text-right">दिवसाची निव्वळ कमाई (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200 print:divide-slate-300 print:text-black">
                    {monthlyStats.dayRows.map((row) => (
                      <tr key={row.date} className="hover:bg-slate-800/40 transition">
                        <td className="p-2.5 font-semibold font-mono">{row.date}</td>
                        <td className="p-2.5 text-right font-medium">₹{row.collection.toLocaleString()}</td>
                        <td className="p-2.5 text-right font-bold text-amber-400 print:text-black">
                          ₹{row.commission.toLocaleString()}
                        </td>
                        <td className="p-2.5 text-center">
                          {row.newCards > 0 ? (
                            <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold text-[10px]">
                              +{row.newCards}
                            </span>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </td>
                        <td className="p-2.5 text-right text-indigo-300 print:text-black">
                          {row.cardBonus > 0 ? `₹${row.cardBonus.toLocaleString()}` : '-'}
                        </td>
                        <td className="p-2.5 text-right text-rose-400 print:text-black">
                          {row.advances > 0 ? `-₹${row.advances.toLocaleString()}` : '-'}
                        </td>
                        <td className="p-2.5 text-right font-black text-emerald-400 print:text-black">
                          ₹{row.net.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {/* Totals Footer */}
                  <tfoot className="bg-slate-800 font-bold border-t-2 border-slate-600 text-white print:bg-slate-200 print:border-black print:text-black">
                    <tr>
                      <td className="p-2.5">एकूण (Total)</td>
                      <td className="p-2.5 text-right">₹{monthlyStats.totalCollection.toLocaleString()}</td>
                      <td className="p-2.5 text-right text-amber-400 print:text-black">₹{monthlyStats.totalCommission.toLocaleString()}</td>
                      <td className="p-2.5 text-center">{monthlyStats.totalNewCards}</td>
                      <td className="p-2.5 text-right text-indigo-300 print:text-black">₹{monthlyStats.totalCardBonus.toLocaleString()}</td>
                      <td className="p-2.5 text-right text-rose-400 print:text-black">-₹{monthlyStats.totalAdvances.toLocaleString()}</td>
                      <td className="p-2.5 text-right text-emerald-400 print:text-black text-sm">₹{monthlyStats.netPayable.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Printable Signature Section (Visible only on Print) */}
          <div className="hidden print:grid grid-cols-2 gap-8 pt-12 text-xs">
            <div className="text-center border-t border-black pt-2">
              <p className="font-bold">एजंटची स्वाक्षरी (Agent Signature)</p>
              <p className="text-[10px] text-slate-500">रक्कम मिळाल्याबद्दल सही</p>
            </div>
            <div className="text-center border-t border-black pt-2">
              <p className="font-bold">श्री साई इंटरप्राइजेस (अधिकृत स्वाक्षरी)</p>
              <p className="text-[10px] text-slate-500">Authorized Signatory</p>
            </div>
          </div>
        </div>

        {/* Footer Bar - Screen only */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between no-print">
          <div className="text-xs text-slate-400">
            हिशोब सूत्र: (वसुली × ४%) + (नवीन कार्ड × ₹५०) - अॅडव्हान्स
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition cursor-pointer"
          >
            बंद करा (Close)
          </button>
        </div>

      </div>
    </div>
  );
};
