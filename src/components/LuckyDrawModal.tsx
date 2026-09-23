import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Sparkles, 
  Award, 
  Gift, 
  RotateCw, 
  CheckCircle2, 
  MessageCircle, 
  Printer, 
  Trophy, 
  PartyPopper,
  Users,
  CreditCard,
  Check,
  Clock,
  Trash2,
  Share2,
  ChevronDown
} from 'lucide-react';
import { CardMember, CardSchemeConfig } from '../types';
import { getSafeWhatsAppUrl } from '../utils/numbering';

interface LuckyDrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardMembers: CardMember[];
  schemesConfig: CardSchemeConfig[];
  businessName?: string;
  businessPhone?: string;
}

export interface WinnerRecord {
  id: string;
  member: CardMember;
  drawDate: string;
  prize: string;
  drawNo: number;
  status: 'Pending' | 'Delivered';
  deliveredDate?: string;
  deliveredBy?: string;
  memoNo: string;
}

const INITIAL_DEMO_WINNERS: WinnerRecord[] = [
  {
    id: 'w-101',
    member: {
      id: 'm-1',
      cardNumber: 104,
      schemeId: 'scheme1',
      schemeName: '३०-महिने साप्ताहिक बचत योजना',
      customerName: 'रमेशजी वानखेडे',
      phone: '9881234567',
      village: 'देवळी',
      joiningDate: '2025-01-10',
      registrationFee: 50,
      registrationFeePaid: true,
      totalDeposited: 12500,
      totalRefunded: 0,
      netBalance: 12500,
      status: 'Active'
    },
    drawDate: '१५ मार्च २०२६',
    prize: '32" HD LED Smart TV',
    drawNo: 1,
    status: 'Delivered',
    deliveredDate: '१६ मार्च २०२६',
    deliveredBy: 'शुभम शेंडे (संचालक)',
    memoNo: 'DRAW-GIFT-101'
  },
  {
    id: 'w-102',
    member: {
      id: 'm-2',
      cardNumber: 218,
      schemeId: 'scheme2',
      schemeName: 'साप्ताहिक बचत योजना',
      customerName: 'सुनंदाबाई काळे',
      phone: '9421876543',
      village: 'सिंदी (रेल्वे)',
      joiningDate: '2025-02-01',
      registrationFee: 50,
      registrationFeePaid: true,
      totalDeposited: 9500,
      totalRefunded: 0,
      netBalance: 9500,
      status: 'Active',
    },
    drawDate: '०१ एप्रिल २०२६',
    prize: '750W 4-Jar Mixer Grinder',
    drawNo: 2,
    status: 'Pending',
    memoNo: 'DRAW-GIFT-102'
  }
];

// Wheel slices configuration
const WHEEL_SLICES = [
  { label: '32" Smart TV', color: '#F59E0B', textColor: '#0F172A', icon: '📺' },
  { label: 'बेडशीट / ब्लँकेट', color: '#EF4444', textColor: '#FFFFFF', icon: '🎁' },
  { label: 'मिक्सर ग्राइंडर', color: '#10B981', textColor: '#FFFFFF', icon: '⚡' },
  { label: 'सागवान टेबल', color: '#6366F1', textColor: '#FFFFFF', icon: '🛋️' },
  { label: 'कूलर / फॅन', color: '#8B5CF6', textColor: '#FFFFFF', icon: '❄️' },
  { label: 'डबल डोअर फ्रिज', color: '#EC4899', textColor: '#FFFFFF', icon: '🧊' },
  { label: 'सुवर्ण जॅकपॉट', color: '#FBBF24', textColor: '#0F172A', icon: '🏆' },
  { label: 'वॉशिंग मशीन', color: '#0EA5E9', textColor: '#FFFFFF', icon: '🧺' },
];

export const LuckyDrawModal: React.FC<LuckyDrawModalProps> = ({
  isOpen,
  onClose,
  cardMembers,
  schemesConfig,
  businessName = 'Shri Sai Enterprises',
  businessPhone = '8766486915',
}) => {
  const [selectedScheme, setSelectedScheme] = useState<string>('all');
  const [prizeName, setPrizeName] = useState<string>('32" HD LED Smart TV');
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentDisplayedMember, setCurrentDisplayedMember] = useState<CardMember | null>(null);
  const [winner, setWinner] = useState<WinnerRecord | null>(null);
  const [rotationDegrees, setRotationDegrees] = useState(0);
  const [selectedWinnerForPrint, setSelectedWinnerForPrint] = useState<WinnerRecord | null>(null);
  const [selectedWinnerForPoster, setSelectedWinnerForPoster] = useState<WinnerRecord | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Load winner history from localStorage
  const [winnerHistory, setWinnerHistory] = useState<WinnerRecord[]>(() => {
    try {
      const saved = localStorage.getItem('shri_sai_lucky_winners');
      return saved ? JSON.parse(saved) : INITIAL_DEMO_WINNERS;
    } catch {
      return INITIAL_DEMO_WINNERS;
    }
  });

  // Save winner history
  useEffect(() => {
    try {
      localStorage.setItem('shri_sai_lucky_winners', JSON.stringify(winnerHistory));
    } catch (e) {
      console.error(e);
    }
  }, [winnerHistory]);

  const spinTimerRef = useRef<any>(null);

  // Eligible members for the draw
  const eligibleMembers = React.useMemo(() => {
    return cardMembers.filter((m) => {
      if (m.status !== 'Active') return false;
      if (selectedScheme !== 'all' && m.schemeId !== selectedScheme) return false;
      return true;
    });
  }, [cardMembers, selectedScheme]);

  if (!isOpen) return null;

  const handleStartDraw = () => {
    if (eligibleMembers.length === 0) {
      alert('लकी ड्रॉ साठी पात्र ग्राहक उपलब्ध नाहीत.');
      return;
    }

    setIsSpinning(true);
    setWinner(null);
    setShowConfetti(false);

    // Random rotations: at least 5 full turns (1800 deg) plus random offset
    const additionalTurns = 1800 + Math.floor(Math.random() * 360);
    const targetDeg = rotationDegrees + additionalTurns;
    setRotationDegrees(targetDeg);

    let speed = 40;
    let iterations = 0;
    const maxIterations = 40 + Math.floor(Math.random() * 20);

    const spinStep = () => {
      iterations++;

      // Click sound effect
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.frequency.setValueAtTime(520, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.03);
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.03);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.03);
      } catch (e) {}

      // Pick random candidates to display excitement
      const randomCandidate = eligibleMembers[Math.floor(Math.random() * eligibleMembers.length)];
      setCurrentDisplayedMember(randomCandidate);

      if (iterations < maxIterations) {
        if (iterations > maxIterations - 12) {
          speed += 25;
        } else if (iterations > maxIterations - 25) {
          speed += 10;
        }
        spinTimerRef.current = setTimeout(spinStep, speed);
      } else {
        // Final Winner Picked!
        const finalWinnerMember = eligibleMembers[Math.floor(Math.random() * eligibleMembers.length)];
        setCurrentDisplayedMember(finalWinnerMember);
        setIsSpinning(false);
        setShowConfetti(true);

        // Celebratory fanfare sound
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime + i * 0.12);
            gain.gain.setValueAtTime(0.15, audioCtx.currentTime + i * 0.12);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + i * 0.12 + 0.35);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(audioCtx.currentTime + i * 0.12);
            osc.stop(audioCtx.currentTime + i * 0.12 + 0.35);
          });
        } catch (e) {}

        const newWinner: WinnerRecord = {
          id: `w-${Date.now()}`,
          member: finalWinnerMember,
          drawDate: new Date().toLocaleDateString('mr-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }),
          prize: prizeName,
          drawNo: winnerHistory.length + 1,
          status: 'Pending',
          memoNo: `DRAW-GIFT-${winnerHistory.length + 101}`
        };

        setWinner(newWinner);
        setWinnerHistory((prev) => [newWinner, ...prev]);
      }
    };

    spinStep();
  };

  // Toggle delivery status
  const handleToggleDeliveryStatus = (winnerId: string) => {
    setWinnerHistory((prev) =>
      prev.map((w) => {
        if (w.id === winnerId) {
          const nextStatus = w.status === 'Delivered' ? 'Pending' : 'Delivered';
          return {
            ...w,
            status: nextStatus,
            deliveredDate: nextStatus === 'Delivered' ? new Date().toLocaleDateString('mr-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : undefined,
            deliveredBy: nextStatus === 'Delivered' ? 'शुभम शेंडे (संचालक)' : undefined
          };
        }
        return w;
      })
    );
  };

  // Delete winner
  const handleDeleteWinner = (winnerId: string) => {
    if (confirm('नक्की हा विजेता रेकॉर्ड हटवायचा आहे का?')) {
      setWinnerHistory((prev) => prev.filter((w) => w.id !== winnerId));
      if (winner?.id === winnerId) setWinner(null);
    }
  };

  const handleWhatsAppWinner = (record: WinnerRecord) => {
    const rawPhone = (record.member.phone || '').replace(/\D/g, '');
    const cleanPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone.startsWith('91') ? rawPhone : `91${businessPhone}`;

    const msg = 
`🎉 *अभिनंदन! अभिनंदन! अभिनंदन!* 🎉
🚩 *श्री साई इंटरप्राइजेस, वर्धा* 🚩
(३०-महिने साप्ताहिक बचत कार्ड योजना लकी ड्रॉ)

हार्दिक अभिनंदन *${record.member.customerName}* जी!
आपण ठरला आहात *श्री साई साप्ताहिक लकी ड्रॉ चे भाग्यवान विजेते!*

🏆 *विजेता तपशील:*
• कार्ड नंबर: *#${record.member.cardNumber}*
• योजना: *${record.member.schemeName || '३०-महिने योजना'}*
• गाव/पत्ता: ${record.member.village || 'वर्धा'}
🎁 *लकी ड्रॉ बक्षीस:* *${record.prize}*
📅 *ड्रॉ तारीख:* ${record.drawDate}
📜 *लकी ड्रॉ पावती क्रमांक:* #${record.memoNo}
📌 *स्थिती:* ${record.status === 'Delivered' ? '✅ बक्षीस सुपूर्द केले' : '⏳ बक्षीस वाटप प्रलंबित'}

कृपया आपले मूळ पासबुक व ओळखपत्र घेऊन दुकानात येऊन आपले बक्षीस स्वीकारावे.

📍 *पत्ता:* मातोश्री सभागृह समोर, आर्वी रोड, पंजाब कॉलनी, वर्धा.
📞 *संपर्क:* ${businessPhone} / 8600122798`;

    const url = getSafeWhatsAppUrl(record.member.phone, msg);
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm no-print">
      <div className="bg-white dark:bg-[#0C1427] rounded-3xl shadow-2xl border border-amber-500/40 w-full max-w-4xl max-h-[94vh] flex flex-col overflow-hidden text-slate-900 dark:text-white">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-slate-950 shadow-md">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white">
                  डिजिटल लकी ड्रॉ स्पिनर (Lucky Draw)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 uppercase">
                  Live Wheel
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ३०-महिने साप्ताहिक बचत कार्ड योजना • भाग्यवान विजेता निवड व भेटवस्तू वाटप
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Configuration Bar */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-[#111C35] border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Scheme Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">योजना:</span>
              <select
                value={selectedScheme}
                onChange={(e) => setSelectedScheme(e.target.value)}
                disabled={isSpinning}
                className="text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-1 px-2.5 font-bold"
              >
                <option value="all">सर्व योजना ({cardMembers.length} कार्ड्स)</option>
                {schemesConfig.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({cardMembers.filter(m => m.schemeId === s.id && m.status === 'Active').length} पात्र)
                  </option>
                ))}
              </select>
            </div>

            {/* Prize Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">ड्रॉ बक्षीस:</span>
              <input
                type="text"
                value={prizeName}
                onChange={(e) => setPrizeName(e.target.value)}
                placeholder="उदा. 32 इंच स्मार्ट टीव्ही, कुलर, बेडशीट"
                disabled={isSpinning}
                className="text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-1 px-2.5 min-w-[200px] font-bold"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              <span>पात्र कार्ड्स: {eligibleMembers.length}</span>
            </span>
          </div>
        </div>

        {/* Main Stage (Scrollable with shrink-0 children to prevent flex clipping) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col items-center justify-start text-center space-y-6">
          
          {/* Visual Spinner Wheel & Winner Stage (shrink-0 ensures no flex clipping) */}
          <div className="w-full max-w-xl mx-auto rounded-3xl bg-gradient-to-b from-amber-500/5 via-slate-50 to-amber-500/10 dark:from-slate-900 dark:via-[#0E1730] dark:to-[#172347] border-2 border-amber-400/60 shadow-xl p-5 sm:p-6 flex flex-col items-center shrink-0">
            
            {/* Header / State indicator */}
            <div className="mb-3 text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-300 text-xs font-black uppercase tracking-wider">
                <Sparkles className={`w-4 h-4 text-amber-500 ${isSpinning ? 'animate-spin' : ''}`} />
                <span>
                  {isSpinning 
                    ? '🎰 लकी ड्रॉ चक्र फिरत आहे... निवडीची प्रतीक्षा...' 
                    : winner 
                    ? '🎉 भाग्यवान विजेता घोषित झाला आहे!' 
                    : 'तयार! ड्रॉ काढण्यासाठी खालील बटण दाबा'}
                </span>
              </div>
            </div>

            {/* The Wheel of Fortune Graphic */}
            <div className="relative my-3 flex items-center justify-center">
              {/* Pointer Needle at top */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none drop-shadow-md">
                <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[24px] border-t-amber-500" />
                <div className="w-3 h-3 bg-amber-400 rounded-full mx-auto -mt-6 shadow-xs border border-white" />
              </div>

              {/* Rotating Wheel Container */}
              <div
                className="w-56 h-56 sm:w-64 sm:h-64 rounded-full border-4 border-amber-400 shadow-2xl relative overflow-hidden transition-transform duration-[3000ms] ease-out"
                style={{
                  transform: `rotate(${rotationDegrees}deg)`,
                  transitionTimingFunction: 'cubic-bezier(0.15, 0.9, 0.2, 1)',
                }}
              >
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  {WHEEL_SLICES.map((slice, index) => {
                    const angle = 360 / WHEEL_SLICES.length;
                    const startAngle = index * angle;
                    const endAngle = (index + 1) * angle;
                    const x1 = 50 + 50 * Math.cos((Math.PI * (startAngle - 90)) / 180);
                    const y1 = 50 + 50 * Math.sin((Math.PI * (startAngle - 90)) / 180);
                    const x2 = 50 + 50 * Math.cos((Math.PI * (endAngle - 90)) / 180);
                    const y2 = 50 + 50 * Math.sin((Math.PI * (endAngle - 90)) / 180);
                    const pathData = `M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`;

                    const textAngle = startAngle + angle / 2;
                    const textRad = (Math.PI * (textAngle - 90)) / 180;
                    const tx = 50 + 32 * Math.cos(textRad);
                    const ty = 50 + 32 * Math.sin(textRad);

                    return (
                      <g key={index}>
                        <path d={pathData} fill={slice.color} stroke="#FFFFFF" strokeWidth="0.8" />
                        <text
                          x={tx}
                          y={ty}
                          fill={slice.textColor}
                          fontSize="5.5"
                          fontWeight="bold"
                          textAnchor="middle"
                          dominantBaseline="central"
                          transform={`rotate(${textAngle}, ${tx}, ${ty})`}
                        >
                          {slice.icon} {slice.label.slice(0, 8)}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Center Trophy Hub */}
                <div className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-300 border-2 border-white shadow-lg flex items-center justify-center text-slate-950 font-black text-base z-10 pointer-events-none">
                  ⭐
                </div>
              </div>
            </div>

            {/* Winner Announcement Spotlight Card (Never clipped) */}
            <div className="w-full mt-3 p-4 rounded-2xl bg-white dark:bg-slate-950 border-2 border-amber-300 dark:border-amber-800 shadow-md flex flex-col items-center justify-center transition-all">
              {currentDisplayedMember ? (
                <div className="w-full space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 text-slate-950 font-black text-xs sm:text-sm font-mono shadow-xs">
                    <CreditCard className="w-4 h-4" />
                    <span>कार्ड नंबर: #{currentDisplayedMember.cardNumber}</span>
                  </div>

                  {/* Customer Name with Word-break and unclipped typography */}
                  <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight break-words px-2 leading-tight">
                    {currentDisplayedMember.customerName}
                  </div>

                  {/* Scheme & Village */}
                  <div className="text-xs text-slate-600 dark:text-slate-400 font-bold flex items-center justify-center gap-2 flex-wrap">
                    <span>{currentDisplayedMember.schemeName || '३०-महिने योजना'}</span>
                    <span>•</span>
                    <span className="text-indigo-600 dark:text-indigo-400">
                      गाव: {currentDisplayedMember.village || 'वर्धा'}
                    </span>
                  </div>

                  {/* Prize Badge */}
                  <div className="inline-block pt-1">
                    <span className="px-3 py-1 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 text-xs font-black border border-amber-300 dark:border-amber-800">
                      🎁 बक्षीस: {prizeName}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-slate-400 dark:text-slate-500 text-xs font-medium flex flex-col items-center py-2">
                  <Gift className="w-8 h-8 text-amber-500 mb-1 opacity-80 animate-bounce" />
                  <span>बक्षीस: <strong>{prizeName}</strong></span>
                  <span className="text-[11px] text-slate-400 mt-0.5">ड्रॉ सुरू करण्यासाठी खालील बटण दाबा</span>
                </div>
              )}
            </div>

            {/* Action Buttons (ALWAYS VISIBLE, NEVER CUT OFF) */}
            <div className="w-full mt-4 flex flex-col items-center gap-3">
              {/* Main Spin CTA */}
              <button
                type="button"
                onClick={handleStartDraw}
                disabled={isSpinning || eligibleMembers.length === 0}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 active:scale-95 text-slate-950 font-black text-sm sm:text-base shadow-[0_8px_25px_rgba(245,158,11,0.4)] disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <RotateCw className={`w-5 h-5 text-slate-950 ${isSpinning ? 'animate-spin' : ''}`} />
                <span>
                  {isSpinning 
                    ? 'निवड सुरू आहे...' 
                    : winner 
                    ? '🔄 पुन्हा ड्रॉ काढा (Spin Again)' 
                    : '🎰 ड्रॉ काढा (Spin the Wheel)'}
                </span>
              </button>

              {/* Winner Action Buttons: WhatsApp & Print Slip */}
              {winner && (
                <div className="flex items-center gap-2 flex-wrap justify-center w-full mt-1">
                  <button
                    type="button"
                    onClick={() => setSelectedWinnerForPoster(winner)}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 text-slate-950 font-black text-xs shadow-md transition cursor-pointer active:scale-95"
                  >
                    <Sparkles className="w-4 h-4 text-slate-950" />
                    <span>🎉 WhatsApp पोस्टर पहा</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleWhatsAppWinner(winner)}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-white font-bold text-xs shadow-md transition cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4 fill-white" />
                    <span>WhatsApp वर अभिनंदन</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedWinnerForPrint(winner)}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs shadow-md transition cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>🖨️ भेटवस्तू पावती प्रिंट</span>
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* Winner History & Delivery Log */}
          {winnerHistory.length > 0 && (
            <div className="w-full max-w-xl text-left bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 shrink-0">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <PartyPopper className="w-4 h-4 text-amber-500" />
                  <span>लकी ड्रॉ विजेते व भेटवस्तू वाटप यादी ({winnerHistory.length} विजेते):</span>
                </h3>
                <span className="text-[11px] text-slate-500 font-bold">
                  {winnerHistory.filter(w => w.status === 'Delivered').length} सुपूर्द • {winnerHistory.filter(w => w.status === 'Pending').length} प्रलंबित
                </span>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {winnerHistory.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold flex items-center justify-center font-mono shrink-0">
                        #{rec.drawNo}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <strong className="text-slate-900 dark:text-white font-bold text-sm">
                            {rec.member.customerName}
                          </strong>
                          <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded">
                            कार्ड #{rec.member.cardNumber}
                          </span>
                          {rec.member.village && (
                            <span className="text-[10px] text-slate-500 bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                              {rec.member.village}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 flex-wrap">
                          <span className="font-semibold text-amber-700 dark:text-amber-400">
                            🎁 {rec.prize}
                          </span>
                          <span>• ड्रॉ तारीख: {rec.drawDate}</span>
                          {rec.deliveredDate && (
                            <span className="text-emerald-600 font-semibold">• वाटप: {rec.deliveredDate}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      {/* Status Toggle Button */}
                      <button
                        type="button"
                        onClick={() => handleToggleDeliveryStatus(rec.id)}
                        className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition cursor-pointer flex items-center gap-1 ${
                          rec.status === 'Delivered'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300'
                        }`}
                        title="वाटप स्थिती बदला"
                      >
                        {rec.status === 'Delivered' ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>सुपूर्द केले</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>प्रलंबित</span>
                          </>
                        )}
                      </button>

                      {/* Winner Poster Button */}
                      <button
                        type="button"
                        onClick={() => setSelectedWinnerForPoster(rec)}
                        className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 hover:bg-amber-100 transition cursor-pointer"
                        title="विजेता WhatsApp पोस्टर बनवा"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                      </button>

                      {/* Print Handover Slip Button */}
                      <button
                        type="button"
                        onClick={() => setSelectedWinnerForPrint(rec)}
                        className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition cursor-pointer"
                        title="भेटवस्तू पावती प्रिंट करा"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>

                      {/* WhatsApp Button */}
                      <button
                        type="button"
                        onClick={() => handleWhatsAppWinner(rec)}
                        className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 hover:bg-emerald-100 transition cursor-pointer"
                        title="WhatsApp वर मेसेज पाठवा"
                      >
                        <MessageCircle className="w-3.5 h-3.5 fill-emerald-600" />
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleDeleteWinner(rec.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition cursor-pointer"
                        title="हटवा"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#15213b] flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>श्री साई इंटरप्राइजेस, वर्धा • अधिकृत लकी ड्रॉ व भेटवस्तू वाटप पोर्टल</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold cursor-pointer"
          >
            बंद करा (Close)
          </button>
        </div>

        {/* Printable Winner Handover Slip Modal */}
        {selectedWinnerForPrint && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-2xl text-slate-900 dark:text-white space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-500">
                  लकी ड्रॉ भेटवस्तू पावती प्रिंट
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedWinnerForPrint(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-900"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Printable Voucher Box */}
              <div id="printable-gift-slip" className="p-5 border-2 border-amber-500 rounded-2xl bg-amber-50/20 dark:bg-amber-950/20 space-y-3 text-xs">
                <div className="text-center border-b border-amber-300 pb-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[9px] uppercase tracking-widest">
                    LUCKY DRAW GIFT HANDOVER SLIP
                  </span>
                  <h3 className="text-base font-black uppercase text-slate-900 dark:text-white mt-1">
                    {businessName}
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    आर्वी रोड, पंजाब कॉलनी, वर्धा • मो. {businessPhone}
                  </p>
                  <div className="text-[11px] font-bold text-amber-700 dark:text-amber-400 mt-0.5">
                    ३०-महिने साप्ताहिक बचत कार्ड योजना लकी ड्रॉ
                  </div>
                </div>

                <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                  <span>पावती #: <strong>{selectedWinnerForPrint.memoNo}</strong></span>
                  <span>ड्रॉ तारीख: <strong>{selectedWinnerForPrint.drawDate}</strong></span>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-amber-200 dark:border-amber-900 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">भाग्यवान विजेता:</span>
                    <strong className="text-slate-900 dark:text-white text-sm font-bold">
                      {selectedWinnerForPrint.member.customerName}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">कार्ड क्रमांक:</span>
                    <strong className="font-mono text-indigo-600 font-bold">
                      #{selectedWinnerForPrint.member.cardNumber} ({selectedWinnerForPrint.member.schemeName})
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">गाव / पत्ता:</span>
                    <strong>{selectedWinnerForPrint.member.village || 'वर्धा'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">मोबाईल नंबर:</span>
                    <strong className="font-mono">{selectedWinnerForPrint.member.phone}</strong>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-800">
                    <span className="text-amber-700 font-bold">जिंकलेले बक्षीस:</span>
                    <strong className="text-amber-600 dark:text-amber-400 font-black text-sm">
                      🎁 {selectedWinnerForPrint.prize}
                    </strong>
                  </div>
                </div>

                {/* Signatures */}
                <div className="pt-6 border-t border-amber-200 dark:border-amber-900 grid grid-cols-2 gap-6 text-center text-[10px]">
                  <div className="space-y-4">
                    <div className="h-6 border-b border-dashed border-slate-400"></div>
                    <p className="font-bold">विजेता स्वाक्षरी<br /><span className="font-normal text-slate-400">(बक्षीस मिळाले)</span></p>
                  </div>
                  <div className="space-y-4">
                    <div className="h-6 border-b border-dashed border-slate-400"></div>
                    <p className="font-bold">अधिकृत स्वाक्षरी<br /><span className="font-normal text-slate-400">श्री साई इंटरप्राइजेस</span></p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedWinnerForPrint(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
                >
                  बंद करा
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>पावती प्रिंट करा</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Festive Winner Announcement WhatsApp Poster Modal */}
        {selectedWinnerForPoster && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white dark:bg-[#0C1425] rounded-3xl p-4 sm:p-6 w-full max-w-lg border border-amber-400 shadow-2xl text-slate-900 dark:text-white space-y-4 max-h-[95vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500 animate-spin" />
                  <span className="font-black text-sm text-slate-800 dark:text-slate-100">
                    विजेता अभिनंदन WhatsApp पोस्टर (Digital Poster)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedWinnerForPoster(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* POSTER CANVAS / PREVIEW */}
              <div id="festive-winner-poster" className="rounded-2xl p-5 sm:p-6 bg-gradient-to-b from-amber-700 via-rose-900 to-slate-950 text-white border-4 border-amber-400 shadow-2xl relative overflow-hidden text-center">
                {/* Decorative corners */}
                <div className="absolute top-2 left-2 text-amber-300 text-lg">🚩</div>
                <div className="absolute top-2 right-2 text-amber-300 text-lg">🚩</div>
                <div className="absolute bottom-2 left-2 text-amber-300 text-xs">✨</div>
                <div className="absolute bottom-2 right-2 text-amber-300 text-xs">✨</div>

                {/* Header */}
                <div className="space-y-1 mb-3">
                  <span className="inline-block px-3 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[9px] sm:text-[10px] tracking-widest uppercase shadow-sm">
                    ३०-महिने साप्ताहिक बचत कार्ड योजना
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black tracking-wide text-amber-200 uppercase drop-shadow-md">
                    {businessName || 'श्री साई एंटरप्रायझेस, वर्धा'}
                  </h2>
                  <p className="text-[11px] text-amber-100 font-medium">
                    शोभिवंत फर्निचर, इलेक्ट्रॉनिक्स व गृहोपयोगी वस्तूंचे दालन
                  </p>
                </div>

                {/* Banner Ribbon */}
                <div className="my-2.5 py-1.5 px-3 bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-500 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg border border-amber-200">
                  🎉 भव्य लकी ड्रॉ सोडत निकाल क्र. #{selectedWinnerForPoster.drawNo} 🎉
                </div>

                {/* Winner Card Container */}
                <div className="my-3 p-4 rounded-2xl bg-black/40 backdrop-blur-xs border-2 border-amber-400/60 shadow-inner space-y-2">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 mx-auto flex items-center justify-center text-2xl shadow-lg text-slate-950">
                    👑
                  </div>
                  <div className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">
                    महाभाग्यवान विजेते
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                    {selectedWinnerForPoster.member.customerName}
                  </h3>
                  <div className="flex items-center justify-center gap-2 text-xs font-semibold text-amber-200 flex-wrap">
                    <span className="bg-amber-400/20 px-2 py-0.5 rounded-lg border border-amber-400/40">
                      बचत कार्ड क्र: #{selectedWinnerForPoster.member.cardNumber}
                    </span>
                    <span className="bg-amber-400/20 px-2 py-0.5 rounded-lg border border-amber-400/40">
                      गाव: {selectedWinnerForPoster.member.village || 'वर्धा'}
                    </span>
                  </div>

                  {/* Prize Won Box */}
                  <div className="mt-2.5 pt-2.5 border-t border-amber-400/30">
                    <span className="text-[10px] text-amber-300 block font-bold uppercase">
                      जिंकलेले आकर्षक सुवर्ण बक्षीस:
                    </span>
                    <div className="text-lg sm:text-xl font-black text-yellow-300 mt-0.5 drop-shadow-sm flex items-center justify-center gap-1.5">
                      <span>🎁</span>
                      <span>{selectedWinnerForPoster.prize}</span>
                      <span>✨</span>
                    </div>
                  </div>
                </div>

                {/* Footer / Contact & WhatsApp Group */}
                <div className="pt-2 border-t border-amber-400/30 text-[10px] text-amber-200/90 space-y-1">
                  <p className="font-bold text-white text-xs">
                    श्री साई एंटरप्रायझेस परिवारातर्फे विजेत्यांचे हार्दिक अभिनंदन! 💐💐
                  </p>
                  <p>
                    मातोश्री सभागृह समोर, आर्वी रोड, पंजाब कॉलनी, वर्धा • मो. {businessPhone}
                  </p>
                  <div className="inline-block mt-1 px-3 py-1 bg-emerald-600/90 rounded-lg text-white font-bold text-[10px]">
                    📲 पुढील ड्रॉ व अपडेट्ससाठी आमच्या अधिकृत WhatsApp ग्रुपशी जुळलेले राहा
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => setSelectedWinnerForPoster(null)}
                  className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
                >
                  बंद करा
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const groupLink = 'https://chat.whatsapp.com/CLcaeUq1bHH1RE0203oPaP?s=cl&p=a&mlu=4&ilr=4';
                      const text =
                        `🎉🏆 *भव्य लकी ड्रॉ निकाल जाहीर!* 🏆🎉\n` +
                        `🚩 *${businessName || 'श्री साई एंटरप्रायझेस, वर्धा'}* 🚩\n` +
                        `(३०-महिने साप्ताहिक बचत कार्ड योजना)\n` +
                        `--------------------------------\n` +
                        `✨ *सोडत क्र. #${selectedWinnerForPoster.drawNo} चे महाविजेते:* \n\n` +
                        `👑 *नाव:* *${selectedWinnerForPoster.member.customerName}*\n` +
                        `🔢 *कार्ड क्र:* *#${selectedWinnerForPoster.member.cardNumber}*\n` +
                        `📍 *गाव:* *${selectedWinnerForPoster.member.village || 'वर्धा'}*\n` +
                        `🎁 *जिंकलेले बक्षीस:* *${selectedWinnerForPoster.prize}*\n` +
                        `📅 *तारीख:* ${selectedWinnerForPoster.drawDate}\n` +
                        `--------------------------------\n` +
                        `श्री साई एंटरप्रायझेस परिवारातर्फे विजेत्यांचे मनःपूर्वक अभिनंदन! 💐💐\n\n` +
                        `👉 *पुढील सोडतीचे निकाल पाहण्यासाठी WhatsApp ग्रुप जॉईन करा:* \n${groupLink}\n\n` +
                        `📞 संपर्क: ${businessPhone} / 9766911693`;
                      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                    }}
                    className="px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4 fill-white" />
                    <span>WhatsApp ग्रुपवर शेअर करा</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3 py-2 rounded-xl bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>प्रिंट पोस्टर</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default LuckyDrawModal;
