import React, { useState, useMemo } from 'react';
import {
  Trophy,
  Award,
  TrendingUp,
  Users,
  CreditCard,
  Percent,
  Receipt,
  Calendar,
  Sparkles,
  ChevronRight,
  Flame,
  Star,
  Target,
  Medal,
  CheckCircle2,
  Share2,
  Crown
} from 'lucide-react';
import { StoreData } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface AgentLeaderboardViewProps {
  storeData: StoreData;
  onNavigateTab?: (tab: string) => void;
}

export const AgentLeaderboardView: React.FC<AgentLeaderboardViewProps> = ({
  storeData,
  onNavigateTab,
}) => {
  const { isDayMode } = useTheme();

  // Period filter
  const [periodFilter, setPeriodFilter] = useState<'all' | 'this-month' | 'this-week'>('this-month');

  // Compute Agent-wise stats
  const agentPerformance = useMemo(() => {
    // Collect all unique agents from staff, cardTransactions, and cardMembers
    const agentMap: Record<
      string,
      {
        id: string;
        name: string;
        phone: string;
        role: string;
        totalCollection: number;
        collectionCount: number;
        newCardsCreated: number;
        commissionEarned: number;
        cashInHand: number;
      }
    > = {};

    // 1. Seed from staff list (Agents)
    storeData.staff
      .filter((s) => s.role.toLowerCase().includes('agent') || s.role.toLowerCase().includes('collection') || s.role.toLowerCase().includes('एजंट'))
      .forEach((s) => {
        agentMap[s.name] = {
          id: s.id,
          name: s.name,
          phone: s.phone || '98220 11223',
          role: s.role,
          totalCollection: 0,
          collectionCount: 0,
          newCardsCreated: 0,
          commissionEarned: 0,
          cashInHand: 0,
        };
      });

    // Ensure default recognized agents exist
    const defaultAgents = ['प्रमोद', 'संतोष', 'अनिल'];
    defaultAgents.forEach((name, idx) => {
      if (!agentMap[name]) {
        agentMap[name] = {
          id: `agent-def-${idx}`,
          name: name,
          phone: '98220 11223',
          role: 'Field Collection Agent (एजंट)',
          totalCollection: 0,
          collectionCount: 0,
          newCardsCreated: 0,
          commissionEarned: 0,
          cashInHand: 0,
        };
      }
    });

    // 2. Aggregate Card Transactions (Collections)
    (storeData.cardTransactions || []).forEach((ct) => {
      const collector = ct.collectedBy || 'प्रमोद';
      // Match key
      const matchedKey = Object.keys(agentMap).find((k) =>
        collector.toLowerCase().includes(k.toLowerCase())
      ) || collector;

      if (!agentMap[matchedKey]) {
        agentMap[matchedKey] = {
          id: `agent-auto-${matchedKey}`,
          name: matchedKey,
          phone: '98220 11223',
          role: 'Field Agent',
          totalCollection: 0,
          collectionCount: 0,
          newCardsCreated: 0,
          commissionEarned: 0,
          cashInHand: 0,
        };
      }

      agentMap[matchedKey].totalCollection += ct.amount || 0;
      agentMap[matchedKey].collectionCount += 1;
    });

    // 3. Aggregate Card Members (New card enrollments)
    (storeData.cardMembers || []).forEach((cm) => {
      const recruiter = cm.collectedBy || 'प्रमोद';
      const matchedKey = Object.keys(agentMap).find((k) =>
        recruiter.toLowerCase().includes(k.toLowerCase())
      ) || recruiter;

      if (agentMap[matchedKey]) {
        agentMap[matchedKey].newCardsCreated += 1;
      }
    });

    // 4. Calculate Commission (4% standard model + ₹50 per new card bonus)
    return Object.values(agentMap).map((ag) => {
      const baseCommission = Math.round(ag.totalCollection * 0.04);
      const cardIncentive = ag.newCardsCreated * 50;
      const totalCommission = baseCommission + cardIncentive;
      const netCashToHandover = ag.totalCollection - totalCommission;

      return {
        ...ag,
        baseCommission,
        cardIncentive,
        commissionEarned: totalCommission,
        cashInHand: netCashToHandover,
      };
    }).sort((a, b) => b.totalCollection - a.totalCollection);
  }, [storeData]);

  // Overall Totals
  const overallTotals = useMemo(() => {
    const totalCollected = agentPerformance.reduce((sum, a) => sum + a.totalCollection, 0);
    const totalTransactions = agentPerformance.reduce((sum, a) => sum + a.collectionCount, 0);
    const totalCardsEnrolled = agentPerformance.reduce((sum, a) => sum + a.newCardsCreated, 0);
    const totalCommission = agentPerformance.reduce((sum, a) => sum + a.commissionEarned, 0);

    return {
      totalCollected,
      totalTransactions,
      totalCardsEnrolled,
      totalCommission,
    };
  }, [agentPerformance]);

  // Share Agent Performance WhatsApp
  const handleSharePerformanceWhatsApp = (ag: any, rank: number) => {
    const msg =
`🏆 *श्री साई एंटरप्रायझेस, वर्धा - एजंट कामगिरी गौरव (Agent Leaderboard)* 🏆

एजंट नाव: *${ag.name}* (रँक #${rank})
📅 महिना: मार्च २०२६

💰 एकूण वसुली: *₹${ag.totalCollection.toLocaleString('en-IN')}*
📋 एकूण पावत्या: *${ag.collectionCount} पावत्या*
💳 नवीन कार्ड्स नोंदणी: *${ag.newCardsCreated} कार्ड्स*
🎁 एकूण ४% कमिशन + इन्सेंटिव्ह: *₹${ag.commissionEarned.toLocaleString('en-IN')}*
💵 दुकानात जमा करावयाची नेट कॅश: *₹${ag.cashInHand.toLocaleString('en-IN')}*

_उत्कृष्ट कामगिरीबद्दल अभिनंदन! अधिक वसुली करा, जास्त कमिशन कमवा!_
श्री साई एंटरप्रायझेस, वर्धा. 📞 98220 11223`;

    const encoded = encodeURIComponent(msg);
    const phone = ag.phone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${phone ? '91' + phone : ''}?text=${encoded}`, '_blank');
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className={`p-4 sm:p-5 rounded-2xl border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
        isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight">
                एजंट कामगिरी व लीडरबोर्ड (Agent Performance & Incentive Leaderboard)
              </h1>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                ४% कमिशन + ₹५० कार्ड बोनस
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              प्रत्येक एजंटची साप्ताहिक/मासिक वसुली, नवीन कार्ड्स नोंदणी, प्रोत्साहन भत्ते व टॉप परफॉर्मर रँकिंग
            </p>
          </div>
        </div>

        {/* Action Button: Go to Commission view */}
        {onNavigateTab && (
          <button
            type="button"
            onClick={() => onNavigateTab('agent-commission')}
            className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-teal-600/20 cursor-pointer shrink-0"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>८०mm वसुली स्लिप प्रिंट व नेट हिशोब</span>
          </button>
        )}
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className={`p-4 rounded-2xl border ${
          isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>एकूण एजंट वसुली</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            ₹{overallTotals.totalCollected.toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-slate-400">सर्व एजंट्सकडून गोळा</span>
        </div>

        <div className={`p-4 rounded-2xl border ${
          isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>नवीन कार्ड्स नोंदणी</span>
            <CreditCard className="w-4 h-4 text-sky-500" />
          </div>
          <p className="text-xl sm:text-2xl font-black font-mono text-sky-600 dark:text-sky-400 mt-1">
            {overallTotals.totalCardsEnrolled} Cards
          </p>
          <span className="text-[11px] text-slate-400">३०-महिने नवीन सभासद</span>
        </div>

        <div className={`p-4 rounded-2xl border ${
          isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>एकूण कमिशन वाटप</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl sm:text-2xl font-black font-mono text-amber-600 dark:text-amber-400 mt-1">
            ₹{overallTotals.totalCommission.toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-slate-400">४% मॉडेल + कार्ड इन्सेंटिव्ह</span>
        </div>

        <div className={`p-4 rounded-2xl border ${
          isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>एकूण पावती संख्या</span>
            <Receipt className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-xl sm:text-2xl font-black font-mono text-purple-600 dark:text-purple-400 mt-1">
            {overallTotals.totalTransactions} Receipts
          </p>
          <span className="text-[11px] text-slate-400">फील्ड कलेक्शन पावत्या</span>
        </div>
      </div>

      {/* Podium Display (Top 3 Agents) */}
      <div className={`p-5 rounded-2xl border ${
        isDayMode
          ? 'bg-gradient-to-b from-amber-50/40 via-white to-white border-amber-200/80'
          : 'bg-gradient-to-b from-amber-950/20 via-slate-900 to-slate-900 border-amber-500/20'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500 animate-pulse" />
            <h2 className="text-sm sm:text-base font-black">
              या महिन्याचे टॉप स्टार एजंट्स (Top Performers Podium)
            </h2>
          </div>
          <span className="text-xs font-bold text-slate-500">
            {agentPerformance.length} एजंट्स कार्यरत
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {agentPerformance.slice(0, 3).map((ag, index) => {
            const rankColors = [
              {
                badge: 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950',
                border: 'border-amber-400 shadow-amber-500/10',
                icon: CrownIcon,
                title: '१ ला नंबर (Gold)',
              },
              {
                badge: 'bg-slate-300 text-slate-950',
                border: 'border-slate-300 shadow-slate-500/10',
                icon: Medal,
                title: '२ रा नंबर (Silver)',
              },
              {
                badge: 'bg-amber-700 text-white',
                border: 'border-amber-700/60 shadow-orange-500/10',
                icon: Medal,
                title: '३ रा नंबर (Bronze)',
              },
            ][index];

            return (
              <div
                key={ag.id}
                className={`p-4 rounded-2xl border-2 transition-all shadow-md ${rankColors.border} ${
                  isDayMode ? 'bg-white' : 'bg-slate-800/80'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-black flex items-center gap-1 ${rankColors.badge}`}>
                    <span>#{index + 1} {rankColors.title}</span>
                  </span>
                  <span className="text-xs font-bold font-mono text-emerald-500">
                    {ag.collectionCount} पावत्या
                  </span>
                </div>

                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {ag.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {ag.role} • 📞 {ag.phone}
                </p>

                <div className="mt-3.5 space-y-1.5 pt-3 border-t border-slate-100 dark:border-slate-700 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">एकूण वसुली:</span>
                    <span className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
                      ₹{ag.totalCollection.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">नवीन कार्ड्स:</span>
                    <span className="font-mono font-bold text-sky-500">
                      {ag.newCardsCreated} कार्ड्स
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">मिळणारे कमिशन:</span>
                    <span className="font-mono font-black text-amber-600 dark:text-amber-400">
                      ₹{ag.commissionEarned.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-2">
                  <button
                    type="button"
                    onClick={() => handleSharePerformanceWhatsApp(ag, index + 1)}
                    className="w-full py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 border border-emerald-500/30 cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>WhatsApp कामगिरी रिपोर्ट पाठवा</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Comprehensive Leaderboard Table */}
      <div className={`rounded-2xl border overflow-hidden shadow-xs ${
        isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            सर्व एजंट्स संपूर्ण ताळेबंद व परफॉर्मन्स
          </span>
          <span className="text-xs text-slate-400">४% कमिशन + ₹५० नवीन कार्ड फी</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                isDayMode ? 'bg-slate-50 text-slate-500 border-slate-200' : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}>
                <th className="p-3 text-center w-12">रँक</th>
                <th className="p-3">एजंट नाव व संपर्क</th>
                <th className="p-3 text-right">एकूण वसुली (Collection)</th>
                <th className="p-3 text-center">पावत्या</th>
                <th className="p-3 text-center">नवीन कार्ड्स</th>
                <th className="p-3 text-right">४% कमिशन</th>
                <th className="p-3 text-right">कार्ड बोनस</th>
                <th className="p-3 text-right">एकूण मानधन</th>
                <th className="p-3 text-right">दुकान जमा कॅश</th>
                <th className="p-3 text-right">शेअर</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {agentPerformance.map((ag, idx) => (
                <tr
                  key={ag.id}
                  className="hover:bg-slate-500/5 transition"
                >
                  <td className="p-3 text-center font-black">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-black ${
                      idx === 0
                        ? 'bg-amber-500 text-slate-950'
                        : idx === 1
                        ? 'bg-slate-300 text-slate-950'
                        : idx === 2
                        ? 'bg-amber-700 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      {idx + 1}
                    </span>
                  </td>

                  <td className="p-3">
                    <div className="font-bold text-slate-900 dark:text-white">
                      {ag.name}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {ag.role} • {ag.phone}
                    </div>
                  </td>

                  <td className="p-3 text-right font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
                    ₹{ag.totalCollection.toLocaleString('en-IN')}
                  </td>

                  <td className="p-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                    {ag.collectionCount}
                  </td>

                  <td className="p-3 text-center font-mono font-bold text-sky-500">
                    {ag.newCardsCreated}
                  </td>

                  <td className="p-3 text-right font-mono text-slate-600 dark:text-slate-400">
                    ₹{ag.baseCommission.toLocaleString('en-IN')}
                  </td>

                  <td className="p-3 text-right font-mono text-amber-600 dark:text-amber-400">
                    +₹{ag.cardIncentive.toLocaleString('en-IN')}
                  </td>

                  <td className="p-3 text-right font-mono font-black text-amber-600 dark:text-amber-400">
                    ₹{ag.commissionEarned.toLocaleString('en-IN')}
                  </td>

                  <td className="p-3 text-right font-mono font-black text-emerald-600 dark:text-emerald-400">
                    ₹{ag.cashInHand.toLocaleString('en-IN')}
                  </td>

                  <td className="p-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleSharePerformanceWhatsApp(ag, idx + 1)}
                      className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 border border-emerald-500/30 cursor-pointer"
                      title="WhatsApp शेअर"
                    >
                      <Share2 className="w-3.5 h-3.5" />
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

function CrownIcon({ className }: { className?: string }) {
  return <Crown className={className} />;
}
