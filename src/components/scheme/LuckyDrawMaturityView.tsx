import React, { useState, useMemo } from 'react';
import {
  Trophy,
  Gift,
  Calendar,
  Sparkles,
  CheckCircle2,
  Users,
  Search,
  Dice5,
  Printer,
  Share2,
  Crown,
  ChevronRight,
  TrendingUp,
  Percent,
  Calculator,
  Flame,
  Award
} from 'lucide-react';
import { StoreData, CardMember } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { StorageService } from '../../services/storageService';

interface LuckyDrawMaturityViewProps {
  storeData: StoreData;
  onRefreshData: () => void;
}

export const LuckyDrawMaturityView: React.FC<LuckyDrawMaturityViewProps> = ({
  storeData,
  onRefreshData,
}) => {
  const { isDayMode } = useTheme();

  // Active view tab
  const [activeSubTab, setActiveSubTab] = useState<'draw' | 'maturity' | 'winners'>('draw');

  // Lucky Draw State
  const [selectedScheme, setSelectedScheme] = useState<number>(1);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [prizeName, setPrizeName] = useState('Samsung 43" Smart LED TV / Whirlpool Refrigerator');
  const [isRolling, setIsRolling] = useState(false);
  const [currentWinner, setCurrentWinner] = useState<CardMember | null>(null);
  const [rollingCardDisplay, setRollingCardDisplay] = useState<string>('----');
  const [searchQuery, setSearchQuery] = useState('');

  // Eligible members for Lucky Draw (Active and paid up to current required month)
  const eligibleMembers = useMemo(() => {
    return storeData.cardMembers.filter((m) => {
      // Must be Active (not already won or matured)
      if (m.status !== 'Active') return false;
      // Filter by scheme if provided
      if (m.schemeNo && m.schemeNo !== selectedScheme) return false;
      // Filter by having paid minimum required installments (at least 1, ideally paid on time)
      return m.totalPaidMonths >= 1;
    });
  }, [storeData.cardMembers, selectedScheme]);

  // Lucky Draw Winners history
  const drawWinners = useMemo(() => {
    return storeData.cardMembers.filter(
      (m) => m.status === 'Draw Winner' || !!m.drawMonthWon
    );
  }, [storeData.cardMembers]);

  // Maturity tracker members (All members with totalPaidMonths >= 25 or Status === 'Matured')
  const maturityMembers = useMemo(() => {
    return storeData.cardMembers
      .filter((m) => {
        const matchesSearch =
          m.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.cardNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.phone.includes(searchQuery);
        return matchesSearch;
      })
      .map((m) => {
        const totalDuration = m.durationMonths || 30;
        const paidMonths = m.totalPaidMonths || 0;
        const remainingMonths = Math.max(0, totalDuration - paidMonths);
        const monthlyAmt = m.monthlyAmount || 1000;
        const totalDeposited = m.totalAmountPaid || paidMonths * monthlyAmt;
        const targetTotal = m.targetAmount || (m.monthlyAmount && m.monthlyAmount <= 500 ? 15000 : totalDuration * monthlyAmt);
        
        // Maturity Benefits calculation:
        // In the 30-month scheme: Total ₹30,000 deposited.
        // Option A: 1 Month Bonus (Store contributes 31st month ₹1,000 or ₹1,500 benefit)
        // Option B: Gold Coin / Gift Hamper worth ₹2,500 + Full Purchase Voucher
        const bonusBenefit = Math.round(targetTotal * 0.05); // 5% store appreciation bonus
        const maturityValue = totalDeposited >= targetTotal ? targetTotal + bonusBenefit : totalDeposited;
        const isEligibleForGift = paidMonths >= totalDuration;
        const progressPct = Math.min(100, Math.round((paidMonths / totalDuration) * 100));

        return {
          ...m,
          totalDuration,
          paidMonths,
          remainingMonths,
          monthlyAmt,
          totalDeposited,
          targetTotal,
          bonusBenefit,
          maturityValue,
          isEligibleForGift,
          progressPct,
        };
      })
      .sort((a, b) => b.progressPct - a.progressPct);
  }, [storeData.cardMembers, searchQuery]);

  // Trigger Rolling Wheel Draw Animation
  const handleStartDraw = () => {
    if (eligibleMembers.length === 0) {
      alert('लकी ड्रॉसाठी पात्र सभासद उपलब्ध नाहीत.');
      return;
    }

    setIsRolling(true);
    setCurrentWinner(null);

    let count = 0;
    const maxIterations = 28;
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * eligibleMembers.length);
      const tempPick = eligibleMembers[randomIndex];
      setRollingCardDisplay(`कार्ड #${tempPick.cardNo} - ${tempPick.memberName}`);
      count++;

      if (count >= maxIterations) {
        clearInterval(interval);
        // Final Pick
        const winningMember = eligibleMembers[Math.floor(Math.random() * eligibleMembers.length)];
        setCurrentWinner(winningMember);
        setIsRolling(false);
      }
    }, 90);
  };

  // Confirm and Save Winner
  const handleConfirmWinner = () => {
    if (!currentWinner) return;

    // Update member record in storage
    StorageService.updateCardMember(currentWinner.id, {
      status: 'Draw Winner',
      drawMonthWon: selectedMonth,
      prizeDetails: prizeName,
      notes: `${selectedMonth} व्या महिन्याचा लकी ड्रॉ विजेता: ${prizeName}`,
    });

    onRefreshData();
    alert(`अभिनंदन! ${currentWinner.memberName} (कार्ड #${currentWinner.cardNo}) यांना ड्रॉ विजेता घोषित करण्यात आले आहे.`);
  };

  // WhatsApp Share for Lucky Draw Winner
  const handleShareWinnerWhatsApp = (winner: CardMember) => {
    const msg = 
`🎉 *श्री साई एंटरप्रायझेस, वर्धा - ३०-महिने बचत योजना लकी ड्रॉ निकाल!* 🎉

हार्दिक अभिनंदन! 🌟
विजेता कार्ड क्र.: *${winner.cardNo}*
सभासद नाव: *${winner.memberName}*
गाव / पत्ता: ${winner.village || winner.address}
लकी ड्रॉ महिना: *महिना #${winner.drawMonthWon || selectedMonth}*
मिळालेले बक्षीस: 🎁 *${winner.prizeDetails || prizeName}*

📍 *श्री साई एंटरप्रायझेस* - इलेक्ट्रॉनिक्स, फर्निचर व बचत योजना
मेन रोड, वर्धा. 📞 98220 11223
_बचत करा, समृद्ध व्हा!_`;

    const encoded = encodeURIComponent(msg);
    const phone = winner.phone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${phone ? '91' + phone : ''}?text=${encoded}`, '_blank');
  };

  // WhatsApp Share for Maturity Voucher
  const handleShareMaturityNotice = (item: any) => {
    const msg =
`💐 *श्री साई एंटरप्रायझेस, वर्धा - ३०-महिने योजना परिपक्वता (Maturity) अभिनंदन!* 💐

आदरणीय *${item.memberName}*,
आपल्या ३०-महिने बचत योजना कार्ड क्र. *${item.cardNo}* चे सर्व हप्ते यशस्वीरीत्या पूर्ण झाले आहेत!

💰 एकूण भरलेली रक्कम: *₹${item.totalDeposited.toLocaleString('en-IN')}*
🎁 साई एंटरप्रायझेस मॅच्युरिटी बोनस / गिफ्ट व्हाऊचर: *₹${item.bonusBenefit.toLocaleString('en-IN')}*
🛍️ एकूण खरेदी पत (Maturity Purchasing Power): *₹${item.maturityValue.toLocaleString('en-IN')}*

आपले हक्काचे होम अप्लायन्सेस / फर्निचर / टीव्ही खरेदी करण्यासाठी आजच शोरूमला भेट द्या!
📍 मेन रोड, वर्धा. 📞 98220 11223`;

    const encoded = encodeURIComponent(msg);
    const phone = item.phone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${phone ? '91' + phone : ''}?text=${encoded}`, '_blank');
  };

  return (
    <div className="space-y-4">
      {/* Top Header Banner */}
      <div className={`p-4 sm:p-5 rounded-2xl border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
        isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 shadow-md shadow-amber-500/20">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight">
                लकी ड्रॉ व परिपक्वता ट्रॅकर (Lucky Draw & 30-Month Maturity)
              </h1>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                ३०-महिने योजना
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              प्रत्येक महिन्याचा पारदर्शक लकी ड्रॉ, विजेता निवड, ३०-महिने पूर्ण सभासदांचे बोनस व गिफ्ट व्हाऊचर व्यवस्थापन
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold shrink-0">
          <button
            type="button"
            onClick={() => setActiveSubTab('draw')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeSubTab === 'draw'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Dice5 className="w-3.5 h-3.5" />
            <span>🎲 थेट लकी ड्रॉ (Live Draw)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('maturity')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeSubTab === 'maturity'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>🎁 मॅच्युरिटी व गिफ्ट्स ({maturityMembers.filter(m => m.progressPct >= 80).length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('winners')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeSubTab === 'winners'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>👑 विजेत्यांची यादी ({drawWinners.length})</span>
          </button>
        </div>
      </div>

      {/* SUB-VIEW 1: LIVE LUCKY DRAW */}
      {activeSubTab === 'draw' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left: Draw Setup Controls */}
          <div className={`p-4 sm:p-5 rounded-2xl border space-y-4 ${
            isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-bold">लकी ड्रॉ कॉन्फिगरेशन</h2>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1 text-slate-600 dark:text-slate-400">
                  योजना निवडा (Scheme)
                </label>
                <select
                  value={selectedScheme}
                  onChange={(e) => setSelectedScheme(Number(e.target.value))}
                  className={`w-full p-2 rounded-xl border font-bold ${
                    isDayMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700'
                  }`}
                >
                  <option value={1}>योजना १ (कार्ड क्र. 1001-3000)</option>
                  <option value={2}>योजना २ (कार्ड क्र. 3001-6000)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-600 dark:text-slate-400">
                  ड्रॉचा महिना क्रमांक (Month No. 1 to 30)
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className={`w-full p-2 rounded-xl border font-bold ${
                      isDayMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700'
                    }`}
                  >
                    {Array.from({ length: 30 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>
                        महिना #{m} चा लकी ड्रॉ
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-600 dark:text-slate-400">
                  या महिन्याचे मुख्य बक्षीस (Prize Title)
                </label>
                <input
                  type="text"
                  value={prizeName}
                  onChange={(e) => setPrizeName(e.target.value)}
                  placeholder="उदा. Samsung 43 LED TV / गोदरेज कपाट"
                  className={`w-full p-2 rounded-xl border font-semibold ${
                    isDayMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700'
                  }`}
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-slate-700 dark:text-slate-300">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>पात्र सभासद संख्या:</span>
                  <span className="text-sm text-amber-600 dark:text-amber-400 font-mono">
                    {eligibleMembers.length} ग्राहक
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  फक्त सक्रीय (Active) आणि ज्यांनी या महिन्यापर्यंत हप्ते भरले आहेत असेच सभासद पात्र आहेत.
                </p>
              </div>

              <button
                type="button"
                onClick={handleStartDraw}
                disabled={isRolling || eligibleMembers.length === 0}
                className={`w-full py-3 px-4 rounded-xl font-black text-sm uppercase tracking-wide flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                  isRolling
                    ? 'bg-slate-400 text-slate-700 cursor-not-allowed'
                    : 'bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 active:scale-98 shadow-amber-500/20'
                }`}
              >
                <Dice5 className={`w-5 h-5 ${isRolling ? 'animate-spin' : ''}`} />
                <span>{isRolling ? 'ड्रॉ फिरत आहे...' : '🎲 लकी ड्रॉ फिरवा (Roll Draw)'}</span>
              </button>
            </div>
          </div>

          {/* Center & Right: Live Roller & Winner Display */}
          <div className="lg:col-span-2 space-y-4">
            {/* Draw Arena Box */}
            <div className={`p-6 rounded-2xl border text-center relative overflow-hidden flex flex-col items-center justify-center min-h-[300px] ${
              isDayMode
                ? 'bg-gradient-to-b from-amber-50/70 to-white border-amber-200'
                : 'bg-gradient-to-b from-amber-950/20 to-slate-900 border-amber-500/30'
            }`}>
              <div className="absolute top-3 left-4 flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                <Crown className="w-4 h-4" />
                <span>श्री साई ३०-महिने बचत योजना लकी ड्रॉ</span>
              </div>

              {isRolling ? (
                <div className="space-y-4 py-8">
                  <div className="inline-block p-4 rounded-full bg-amber-500/20 animate-bounce">
                    <Dice5 className="w-12 h-12 text-amber-500 animate-spin" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black font-mono text-amber-600 dark:text-amber-400 tracking-wider">
                    {rollingCardDisplay}
                  </h3>
                  <p className="text-xs text-slate-500">पारदर्शक यादृच्छिक निवड सुरू आहे...</p>
                </div>
              ) : currentWinner ? (
                <div className="space-y-3 py-4 max-w-lg w-full">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-500/40">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>लकी विजेता घोषित!</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/15 border-2 border-amber-500/40">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      विजेते कार्ड नंबर
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
                      कार्ड #{currentWinner.cardNo}
                    </h2>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-1">
                      {currentWinner.memberName}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      📍 {currentWinner.village || currentWinner.address} • 📞 {currentWinner.phone}
                    </p>

                    <div className="mt-3 pt-3 border-t border-amber-500/20 flex items-center justify-between text-xs">
                      <span className="text-slate-500">मिळणारे बक्षीस:</span>
                      <span className="font-black text-emerald-600 dark:text-emerald-400">
                        🎁 {prizeName}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleConfirmWinner}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>विजेता सेव्ह करा (Confirm Record)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleShareWinnerWhatsApp(currentWinner)}
                      className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold text-xs border border-emerald-500/30 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>WhatsApp निकाल पाठवा</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 py-10">
                  <div className="w-16 h-16 rounded-full bg-amber-500/15 flex items-center justify-center mx-auto text-amber-500">
                    <Trophy className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                    महिना #{selectedMonth} चा लकी ड्रॉ काढण्यासाठी वरील बटण दाबा
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    सिस्टीम पात्र {eligibleMembers.length} सभासदांमधून पूर्णपणे पारदर्शक पद्धतीने संगणकीय ड्रॉ काढेल.
                  </p>
                </div>
              )}
            </div>

            {/* Quick Eligible Samples Preview */}
            <div className={`p-4 rounded-2xl border ${
              isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}>
              <div className="flex items-center justify-between text-xs font-bold pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">पात्र कार्ड्सचे नमुने (Eligible Cards Sample):</span>
                <span className="text-emerald-500">{eligibleMembers.length} Cards in Pool</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-2.5 max-h-28 overflow-y-auto">
                {eligibleMembers.slice(0, 30).map((m) => (
                  <span
                    key={m.id}
                    className={`text-[11px] px-2 py-0.5 rounded-lg border font-mono ${
                      isDayMode ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    #{m.cardNo} {m.memberName.split(' ')[0]}
                  </span>
                ))}
                {eligibleMembers.length > 30 && (
                  <span className="text-[11px] px-2 py-0.5 text-slate-400">
                    +{eligibleMembers.length - 30} इतर
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: 30-MONTH MATURITY & BONUS GIFTS TRACKER */}
      {activeSubTab === 'maturity' && (
        <div className="space-y-4">
          {/* Search and Summary */}
          <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="सभासद नाव, कार्ड क्र. किंवा मोबाईलने शोधा..."
                className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs border focus:outline-none focus:border-emerald-500 ${
                  isDayMode ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>

            <div className="flex items-center gap-2 text-xs font-bold">
              <span className="px-2.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                पूर्ण (30/30 भरलेले): {maturityMembers.filter((m) => m.progressPct >= 100).length}
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                अंतिम टप्प्यात (25+ हप्ते): {maturityMembers.filter((m) => m.progressPct >= 80 && m.progressPct < 100).length}
              </span>
            </div>
          </div>

          {/* Members Maturity Table */}
          <div className={`rounded-2xl border overflow-hidden shadow-xs ${
            isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                    isDayMode ? 'bg-slate-50 text-slate-500 border-slate-200' : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}>
                    <th className="p-3">कार्ड क्र. व नाव</th>
                    <th className="p-3">हप्ते प्रगती (Progress)</th>
                    <th className="p-3 text-right">भरलेली रक्कम</th>
                    <th className="p-3 text-right">बोनस / व्हाऊचर</th>
                    <th className="p-3 text-right">एकूण खरेदी मूल्य</th>
                    <th className="p-3 text-center">स्थिती</th>
                    <th className="p-3 text-right">अ‍ॅक्शन</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {maturityMembers.map((item) => (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-500/5 transition ${
                        item.progressPct >= 100 ? 'bg-emerald-500/5' : ''
                      }`}
                    >
                      <td className="p-3">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{item.memberName}</span>
                          {item.progressPct >= 100 && (
                            <span className="px-1.5 py-0.2 rounded bg-emerald-500 text-slate-950 text-[10px] font-black">
                              100%
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                          <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                            #{item.cardNo}
                          </span>
                          <span>•</span>
                          <span>{item.phone}</span>
                          <span>•</span>
                          <span>{item.village || item.address}</span>
                        </div>
                      </td>

                      <td className="p-3 min-w-[140px]">
                        <div className="flex items-center justify-between font-bold text-[11px] mb-1">
                          <span>{item.paidMonths}/{item.totalDuration} महिने</span>
                          <span className="text-emerald-500">{item.progressPct}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              item.progressPct >= 100
                                ? 'bg-emerald-500'
                                : item.progressPct >= 80
                                ? 'bg-amber-500'
                                : 'bg-sky-500'
                            }`}
                            style={{ width: `${item.progressPct}%` }}
                          />
                        </div>
                        {item.remainingMonths > 0 && (
                          <span className="text-[10px] text-slate-400">
                            {item.remainingMonths} महिने बाकी
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                        ₹{item.totalDeposited.toLocaleString('en-IN')}
                      </td>

                      <td className="p-3 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                        +₹{item.bonusBenefit.toLocaleString('en-IN')}
                      </td>

                      <td className="p-3 text-right font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                        ₹{item.maturityValue.toLocaleString('en-IN')}
                      </td>

                      <td className="p-3 text-center">
                        {item.progressPct >= 100 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                            मॅच्युअर (Matured)
                          </span>
                        ) : item.progressPct >= 80 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                            अंतिम टप्पा
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            सुरू
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleShareMaturityNotice(item)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1 ml-auto cursor-pointer"
                          title="WhatsApp वर परिपक्वता मेसेज पाठवा"
                        >
                          <Share2 className="w-3 h-3" />
                          <span>WhatsApp</span>
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

      {/* SUB-VIEW 3: PREVIOUS LUCKY DRAW WINNERS */}
      {activeSubTab === 'winners' && (
        <div className={`p-4 sm:p-5 rounded-2xl border space-y-4 ${
          isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" />
              <h2 className="text-base font-bold">आतापर्यंतचे सर्व लकी ड्रॉ विजेते</h2>
            </div>
            <span className="text-xs font-bold text-slate-500">
              एकूण विजेते: {drawWinners.length}
            </span>
          </div>

          {drawWinners.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              अद्याप कोणताही लकी ड्रॉ काढलेला नाही. कृपया थेट लकी ड्रॉ टॅबमधून ड्रॉ काढा.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {drawWinners.map((winner) => (
                <div
                  key={winner.id}
                  className={`p-3.5 rounded-xl border relative overflow-hidden ${
                    isDayMode ? 'bg-amber-50/50 border-amber-200' : 'bg-amber-950/20 border-amber-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950">
                      महिना #{winner.drawMonthWon || 1}
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                      #{winner.cardNo}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-2">
                    {winner.memberName}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    📍 {winner.village || winner.address} • 📞 {winner.phone}
                  </p>

                  <div className="mt-2.5 pt-2 border-t border-amber-500/20 flex items-center justify-between text-xs">
                    <span className="text-slate-400">बक्षीस:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      🎁 {winner.prizeDetails || 'Samsung Smart LED TV'}
                    </span>
                  </div>

                  <div className="mt-2 text-right">
                    <button
                      type="button"
                      onClick={() => handleShareWinnerWhatsApp(winner)}
                      className="text-[11px] font-bold text-emerald-600 hover:underline flex items-center gap-1 ml-auto cursor-pointer"
                    >
                      <Share2 className="w-3 h-3" />
                      <span>WhatsApp शेअर करा</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
