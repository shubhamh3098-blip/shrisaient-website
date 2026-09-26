import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Search,
  Filter,
  Printer,
  MessageCircle,
  CheckCircle2,
  Users,
  MapPin,
  Phone,
  Calendar,
  Send,
  UserCheck,
  TrendingDown,
  Download,
  Share2
} from 'lucide-react';
import { StoreData, CardMember } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface SchemeDefaultersViewProps {
  storeData: StoreData;
  onRefreshData?: () => void;
}

export const SchemeDefaultersView: React.FC<SchemeDefaultersViewProps> = ({
  storeData,
  onRefreshData,
}) => {
  const { isDayMode } = useTheme();

  // Current scheme week tracker (e.g., Week 15)
  const [currentWeek, setCurrentWeek] = useState<number>(15);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [selectedVillage, setSelectedVillage] = useState<string>('all');
  const [minOverdueWeeks, setMinOverdueWeeks] = useState<number>(2); // 2+ weeks default

  // Extract unique agents from members or staff
  const agentsList = useMemo(() => {
    const agents = new Set<string>();
    storeData.cardMembers.forEach((m) => {
      if (m.collectedBy) agents.add(m.collectedBy);
    });
    // Add known agents if available
    ['सचिन (Sachin)', 'मंगेश (Mangesh)', 'अनिकेत (Aniket)', 'राहुल (Rahul)'].forEach((a) => agents.add(a));
    return Array.from(agents);
  }, [storeData]);

  // Extract unique villages
  const villagesList = useMemo(() => {
    const villages = new Set<string>();
    storeData.cardMembers.forEach((m) => {
      if (m.village) villages.add(m.village);
      else if (m.address) {
        // extract first word or town
        const town = m.address.split(',')[0].trim();
        if (town) villages.add(town);
      }
    });
    ['हिंगणी (Hingani)', 'बोरगाव (Borgaon)', 'केळझर (Keljhar)', 'वायफड (Waifad)', 'सेलू (Seloo)', 'वर्धा (Wardha)'].forEach((v) => villages.add(v));
    return Array.from(villages).filter(Boolean);
  }, [storeData]);

  // Calculate overdue details for all active members
  const defaulterList = useMemo(() => {
    return storeData.cardMembers
      .filter((m) => m.status === 'Active')
      .map((member) => {
        // Weekly installment is ₹100 or ₹200
        const weeklyAmt = (member.monthlyAmount && member.monthlyAmount <= 500) ? member.monthlyAmount : 100;
        const totalPaid = member.totalAmountPaid || member.totalPaid || 0;
        const paidWeeks = member.paidMonthsCount ? member.paidMonthsCount * 4 : Math.max(0, Math.floor(totalPaid / weeklyAmt));
        const overdueWeeks = Math.max(0, currentWeek - paidWeeks);
        const overdueAmount = overdueWeeks * weeklyAmt;
        const agent = member.collectedBy || 'सचिन (Sachin)';
        const village = member.village || (member.address ? member.address.split(',')[0].trim() : 'वर्धा');

        return {
          ...member,
          weeklyAmt,
          paidWeeks,
          overdueWeeks,
          overdueAmount,
          agent,
          villageClean: village,
        };
      })
      .filter((m) => m.overdueWeeks >= minOverdueWeeks)
      .filter((m) => {
        if (selectedAgent !== 'all' && m.agent !== selectedAgent) return false;
        if (selectedVillage !== 'all' && !m.villageClean.toLowerCase().includes(selectedVillage.toLowerCase())) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            m.cardNo.toLowerCase().includes(q) ||
            m.memberName.toLowerCase().includes(q) ||
            m.phone.includes(q) ||
            m.villageClean.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => b.overdueWeeks - a.overdueWeeks);
  }, [storeData.cardMembers, currentWeek, minOverdueWeeks, selectedAgent, selectedVillage, searchQuery]);

  // Aggregated Defaulters Metrics
  const totalDefaulters = defaulterList.length;
  const totalOverdueAmount = defaulterList.reduce((acc, m) => acc + m.overdueAmount, 0);
  const criticalDefaulters = defaulterList.filter((m) => m.overdueWeeks >= 4).length;

  // Generate WhatsApp recovery link
  const getWhatsAppLink = (m: typeof defaulterList[0]) => {
    const text = `नमस्कार ${m.memberName}जी! 🚩 श्री साई इंटरप्रायजेस, वर्धा.\nआपले कार्ड क्र. #${m.cardNo} चे *${m.overdueWeeks} आठवड्यांचे हप्ते थकीत आहेत* (एकूण थकबाकी: *₹${m.overdueAmount}*).\n\nचालू आठवड्याचा हप्ता भरून लकी ड्रॉ बक्षीस योजनेमध्ये आपली पात्रता कायम ठेवावी.\n\n📍 पत्ता: श्री साई इंटरप्रायजेस, आर्वी रोड, वर्धा.\n📞 संपर्क: 7822859073`;
    return `https://wa.me/91${m.phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
  };

  const handlePrintSheet = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className={`p-5 rounded-2xl border transition-colors ${
        isDayMode
          ? 'bg-gradient-to-r from-rose-50 via-orange-50 to-amber-50 border-rose-200'
          : 'bg-gradient-to-r from-[#2a171b] via-[#201722] to-[#1e1c2a] border-rose-500/20'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase bg-rose-500 text-white mb-1.5 shadow-sm">
              <AlertTriangle className="w-3.5 h-3.5" /> कार्ड योजना थकबाकीदार ट्रॅकर
            </div>
            <h1 className="text-xl sm:text-2xl font-black font-playfair tracking-tight text-slate-900 dark:text-white">
              Defaulters & Overdue Cards Recovery Tracker
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              २ किंवा त्याहून अधिक आठवडे हप्ता न भरलेल्या कार्ड्सची यादी, एजंटनुसार वसुली पत्रक आणि १-क्लिक WhatsApp तगादा.
            </p>
          </div>

          {/* Controls: Current Week & Print */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 shadow-sm">
              <Calendar className="w-4 h-4 text-rose-500" />
              <span className="text-xs font-bold text-slate-500">चालू आठवडा:</span>
              <input
                type="number"
                min="1"
                max="120"
                value={currentWeek}
                onChange={(e) => setCurrentWeek(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-14 text-xs font-black text-rose-600 bg-transparent outline-none text-center"
              />
            </div>

            <button
              onClick={handlePrintSheet}
              className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>एजंट वसुली पत्रक प्रिंट करा</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`p-4 rounded-2xl border shadow-sm ${
          isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <span className="text-xs font-bold text-slate-500 block">एकूण थकबाकीदार कार्ड्स</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-rose-600 tabular-nums">
              {totalDefaulters} सभासद
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 font-bold">
              {minOverdueWeeks}+ आठवडे थकीत
            </span>
          </div>
        </div>

        <div className={`p-4 rounded-2xl border shadow-sm ${
          isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <span className="text-xs font-bold text-slate-500 block">एकूण वसुलीयोग्य थकबाकी रक्कम</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-amber-600 tabular-nums">
              ₹{totalOverdueAmount.toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-slate-400">हप्ता ₹100-200</span>
          </div>
        </div>

        <div className={`p-4 rounded-2xl border shadow-sm ${
          isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <span className="text-xs font-bold text-slate-500 block">अतिथकीत सभासद (४+ आठवडे)</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-purple-600 tabular-nums">
              {criticalDefaulters} कार्ड्स
            </span>
            <span className="text-xs text-purple-500 font-bold">लकी ड्रॉ अपात्र</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className={`p-4 rounded-2xl border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 ${
        isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="कार्ड नंबर, सभासदाचे नाव, फोन किंवा गाव शोधा..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs font-medium border outline-none ${
              isDayMode ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-slate-700 text-white'
            }`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Overdue Weeks Filter */}
          <select
            value={minOverdueWeeks}
            onChange={(e) => setMinOverdueWeeks(Number(e.target.value))}
            className={`px-3 py-2 rounded-xl text-xs font-bold border outline-none cursor-pointer ${
              isDayMode ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
            }`}
          >
            <option value={1}>सर्व थकीत (१+ आठवडे)</option>
            <option value={2}>२ आठवड्यांपेक्षा जास्त (2+ Weeks)</option>
            <option value={3}>३ आठवड्यांपेक्षा जास्त (3+ Weeks)</option>
            <option value={4}>४+ आठवडे अतिथकीत (Critical 4+)</option>
          </select>

          {/* Agent Filter */}
          <select
            value={selectedAgent}
            onChange={(e) => setSelectedAgent(e.target.value)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border outline-none cursor-pointer ${
              isDayMode ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
            }`}
          >
            <option value="all">सर्व एजंट (All Agents)</option>
            {agentsList.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>

          {/* Village Filter */}
          <select
            value={selectedVillage}
            onChange={(e) => setSelectedVillage(e.target.value)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border outline-none cursor-pointer ${
              isDayMode ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
            }`}
          >
            <option value="all">सर्व गावे / रूट्स (All Villages)</option>
            {villagesList.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Defaulters Table / Printable Sheet */}
      <div className={`rounded-2xl border shadow-sm overflow-hidden ${
        isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-black text-sm text-slate-900 dark:text-white">
              थकबाकीदार कार्ड्स यादी ({defaulterList.length} सभासद)
            </h3>
            <span className="text-[11px] text-slate-500">
              एजंटला थेट वसुलीसाठी पाठवता येईल अशी प्रिंट-रेडी यादी
            </span>
          </div>
          <span className="text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-900/20 px-3 py-1 rounded-full border border-rose-200 dark:border-rose-800">
            थकबाकी रक्कम: ₹{totalOverdueAmount.toLocaleString('en-IN')}
          </span>
        </div>

        {defaulterList.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2 opacity-80" />
            <p className="font-bold text-sm text-slate-700 dark:text-slate-300">
              अभिनंदन! या निकषात एकही थकबाकीदार सभासद नाही.
            </p>
            <p className="text-xs text-slate-400 mt-1">सर्व सभासदांचे चालू आठवड्यापर्यंतचे हप्ते वेळेत भरले आहेत.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 font-bold">
                  <th className="py-3 px-3">कार्ड क्र.</th>
                  <th className="py-3 px-3">सभासदाचे नाव</th>
                  <th className="py-3 px-3">गाव / पत्ता</th>
                  <th className="py-3 px-3">मोबाईल</th>
                  <th className="py-3 px-3 text-center">भरलेले आठवडे</th>
                  <th className="py-3 px-3 text-center">थकीत आठवडे</th>
                  <th className="py-3 px-3 text-right">थकबाकी रक्कम</th>
                  <th className="py-3 px-3">नियुक्त एजंट</th>
                  <th className="py-3 px-3 text-center">तगादा / वसुली</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {defaulterList.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                    <td className="py-3 px-3 font-black text-blue-600 dark:text-blue-400">
                      #{m.cardNo}
                    </td>
                    <td className="py-3 px-3 font-extrabold text-slate-900 dark:text-white">
                      {m.memberName}
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                        <span>{m.villageClean}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-500">
                      {m.phone}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-emerald-600">
                      {m.paidWeeks} / {currentWeek}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        m.overdueWeeks >= 4
                          ? 'bg-rose-500/15 text-rose-600 border border-rose-500/30'
                          : 'bg-amber-500/15 text-amber-600 border border-amber-500/30'
                      }`}>
                        {m.overdueWeeks} आठवडे
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-black text-rose-600 tabular-nums">
                      ₹{m.overdueAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-slate-700 dark:text-slate-300 font-semibold">
                      {m.agent}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <a
                        href={getWhatsAppLink(m)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-sm transition active:scale-95 cursor-pointer"
                        title="सभासदाला WhatsApp वर थकबाकी स्मरणपत्र पाठवा"
                      >
                        <MessageCircle className="w-3 h-3" />
                        <span>तगादा पाठवा</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
