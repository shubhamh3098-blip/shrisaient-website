import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Trophy,
  Sparkles,
  Gift,
  Play,
  RotateCcw,
  CheckCircle2,
  Printer,
  Share2,
  Calendar,
  Award,
  Crown,
  Building2,
  Volume2
} from 'lucide-react';
import { StoreData, CardMember } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { StorageService } from '../../services/storageService';

interface DigitalLuckyDrawMachineViewProps {
  storeData: StoreData;
  onRefreshData?: () => void;
}

export const DigitalLuckyDrawMachineView: React.FC<DigitalLuckyDrawMachineViewProps> = ({
  storeData,
  onRefreshData,
}) => {
  const { isDayMode } = useTheme();

  const [drawMonth, setDrawMonth] = useState<number>(12);
  const [selectedPrize, setSelectedPrize] = useState<string>('Smart 4K UHD LED TV 43" (किंमत ₹३२,९९०)');
  const [isSpinning, setIsSpinning] = useState(false);
  const [displayCardNo, setDisplayCardNo] = useState<string>('1052');
  const [winnerMember, setWinnerMember] = useState<CardMember | null>(null);
  const [showCertificate, setShowCertificate] = useState(false);
  const [errorAlert, setErrorAlert] = useState<string | null>(null);
  const spinIntervalRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (spinIntervalRef.current) {
        clearInterval(spinIntervalRef.current);
      }
    };
  }, []);

  // Eligible Active Card Members who haven't won yet
  const eligibleMembers = useMemo(() => {
    return storeData.cardMembers.filter((m) => m.status === 'Active');
  }, [storeData.cardMembers]);

  // Spin Machine Animation
  const handleStartDraw = () => {
    if (eligibleMembers.length === 0) {
      setErrorAlert('लकी ड्रॉ साठी पात्र असलेले सक्रिय कार्ड्स आढळले नाहीत! कृपया प्रथम कार्ड्स ॲक्टिव्ह असल्याची खात्री करा.');
      setTimeout(() => setErrorAlert(null), 4000);
      return;
    }

    if (spinIntervalRef.current) {
      clearInterval(spinIntervalRef.current);
    }

    setErrorAlert(null);
    setIsSpinning(true);
    setWinnerMember(null);
    setShowCertificate(false);

    let counter = 0;
    spinIntervalRef.current = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * eligibleMembers.length);
      setDisplayCardNo(eligibleMembers[randomIndex].cardNo);
      counter++;

      if (counter > 35) {
        clearInterval(spinIntervalRef.current);
        spinIntervalRef.current = null;
        const finalWinner = eligibleMembers[randomIndex];
        setDisplayCardNo(finalWinner.cardNo);
        setWinnerMember(finalWinner);
        setIsSpinning(false);
        setShowCertificate(true);

        // Update winner status in storeData
        const updatedMembers = storeData.cardMembers.map((m) => {
          if (m.id === finalWinner.id) {
            return {
              ...m,
              status: 'Draw Winner' as const,
              drawMonthWon: drawMonth,
              prizeDetails: selectedPrize,
            };
          }
          return m;
        });

        StorageService.saveData({
          ...storeData,
          cardMembers: updatedMembers,
        });

        if (onRefreshData) onRefreshData();
      }
    }, 80);
  };

  const handleSendWhatsAppCongrats = () => {
    if (!winnerMember) return;

    let msg = `*🎉 हार्दिक अभिनंदन! श्री साई एंटरप्रायजेस, वर्धा 🎉*\n\n`;
    msg += `आमच्या ३०-महिने साप्ताहिक बचत योजनेच्या *महिना ${drawMonth}* च्या महा लकी ड्रॉ मध्ये आपले नाव भाग्यशाली विजेता म्हणून जाहीर झाले आहे!\n\n`;
    msg += `👤 भाग्यवान विजेता: *${winnerMember.memberName}*\n`;
    msg += `💳 योजना कार्ड क्र.: *#${winnerMember.cardNo}*\n`;
    msg += `🎁 जिंकलेले बंपर बक्षीस: *${selectedPrize}*\n\n`;
    msg += `🏆 योजनेच्या नियमानुसार आपले पुढील सर्व हप्ते १००% मोफत झाले असून बक्षीसाची वस्तू लगेच घरी घेऊन जाण्यासाठी शोरूमला भेट द्यावी!\n\n`;
    msg += `📍 पत्ता: मातोश्री सभागृह समोर, आर्वी रोड, पंजाब कॉलनी, वर्धा - ४४२००१\n`;
    msg += `📞 संपर्क: 8766486915 / 8600122978\n`;

    const cleanPhone = winnerMember.phone.replace(/[^0-9]/g, '');
    const url = `https://wa.me/91${cleanPhone.slice(-10)}?text=${encodeURIComponent(msg)}`;
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.click();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div
        className={`p-4 sm:p-6 rounded-2xl border transition-all ${
          isDayMode
            ? 'bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 border-amber-200 text-slate-800 shadow-sm'
            : 'bg-gradient-to-r from-[#2b1f07] via-[#1a140b] to-[#141224] border-amber-500/30 text-white shadow-xl'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black tracking-wider uppercase bg-amber-500 text-slate-950">
                Transparent Live Draw
              </span>
              <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
                <Crown className="w-3.5 h-3.5" />
                ३०-महिने बचत योजना लकी ड्रॉ कॉलिंग मशीन
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              डिजिटल लकी ड्रॉ मशीन व सुवर्ण प्रमाणपत्र (Live Transparent Lucky Draw)
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-300 mt-1">
              शोरूमच्या मोठ्या टीव्ही स्क्रीनवर किंवा ग्राहकांसमोर १००% पारदर्शक डिजिटल लकी ड्रॉ काढा आणि विजेत्याला अधिकृत प्रमाणपत्र द्या.
            </p>
          </div>

          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>विजेता प्रमाणपत्र प्रिंट (Print Certificate)</span>
          </button>
        </div>
      </div>

      {errorAlert && (
        <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center justify-between">
          <span>⚠️ {errorAlert}</span>
          <button
            onClick={() => setErrorAlert(null)}
            className="text-rose-500 hover:text-rose-700 px-2 py-0.5 rounded cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Machine Controls & Prize Setup */}
        <div className="lg:col-span-5 space-y-4">
          <div
            className={`p-5 rounded-2xl border transition-all ${
              isDayMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0f172a] border-slate-800 shadow-xl'
            }`}
          >
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2 text-amber-400">
              <Trophy className="w-4 h-4" />
              <span>लकी ड्रॉ सेटअप (Draw Settings)</span>
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">लकी ड्रॉ महिना (Draw Month):</label>
                <select
                  value={drawMonth}
                  onChange={(e) => setDrawMonth(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 outline-none font-bold text-amber-400"
                >
                  {Array.from({ length: 30 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      महिना {m} वा लकी ड्रॉ
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">या महिन्याचे बंपर बक्षीस (Prize):</label>
                <select
                  value={selectedPrize}
                  onChange={(e) => setSelectedPrize(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 outline-none"
                >
                  <option value='Smart 4K UHD LED TV 43" (किंमत ₹३२,९९०)'>
                    Smart 4K UHD LED TV 43" (किंमत ₹३२,९९०)
                  </option>
                  <option value="Double Door Inverter Refrigerator 265L (किंमत ₹२८,९००)">
                    Double Door Inverter Refrigerator 265L (किंमत ₹२८,९००)
                  </option>
                  <option value="चंद्रपूर अस्सल सागवान सोफा सेट 3+1+1 (किंमत ₹३४,०००)">
                    चंद्रपूर अस्सल सागवान सोफा सेट 3+1+1 (किंमत ₹३४,०००)
                  </option>
                  <option value="5-Star Fully Automatic Washing Machine (किंमत ₹२४,९००)">
                    5-Star Fully Automatic Washing Machine (किंमत ₹२४,९००)
                  </option>
                  <option value="शीशम लाकडी स्टोरेज दिवाण व कॉटन गादी (किंमत ₹१९,५००)">
                    शीशम लाकडी स्टोरेज दिवाण व कॉटन गादी (किंमत ₹१९,५००)
                  </option>
                  <option value="सोने नाणे / कॅश व्हाउचर (किंमत ₹२१,०००)">
                    सोने नाणे / कॅश व्हाउचर (किंमत ₹२१,०००)
                  </option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300">
                पात्र सक्रिय कार्ड्स: <strong>{eligibleMembers.length} सभासद</strong> • विजेता जाहीर होताच त्याचे पुढील सर्व हप्ते आपोआप माफ (मोफत) होतील!
              </div>

              <button
                type="button"
                disabled={isSpinning}
                onClick={handleStartDraw}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 transition cursor-pointer disabled:opacity-50"
              >
                <Play className="w-5 h-5 fill-slate-950" />
                <span>{isSpinning ? 'मशीन फिरत आहे...' : 'डिजिटल ड्रॉ सुरू करा (START DRAW)'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): The Animated TV Spinner & Certificate */}
        <div className="lg:col-span-7 flex flex-col items-center">
          {/* Digital Wheel Display Box */}
          <div
            className={`w-full p-6 sm:p-8 rounded-3xl border-4 flex flex-col items-center text-center shadow-2xl relative ${
              isDayMode
                ? 'bg-gradient-to-b from-amber-50 to-orange-50 border-amber-300'
                : 'bg-gradient-to-b from-[#1c1404] via-[#0f0e14] to-[#070914] border-amber-500/40 text-white'
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 tracking-wider uppercase mb-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>श्री साई एंटरप्रायझेस • ३० महिने योजना</span>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>

            <h3 className="text-xl sm:text-2xl font-black mb-4">
              महिना {drawMonth} वा लकी सोडत (Lucky Draw)
            </h3>

            {/* Glowing Big Card Number Spinner */}
            <div className="w-full max-w-xs py-6 px-4 rounded-3xl bg-black/60 border-4 border-amber-400/80 shadow-[0_0_40px_rgba(245,158,11,0.3)] mb-4">
              <span className="text-[11px] text-amber-400 block uppercase font-bold tracking-widest mb-1">
                कार्ड क्रमांक (WINNING CARD NO)
              </span>
              <span className="text-5xl sm:text-6xl font-black font-mono tracking-widest text-amber-400 animate-pulse">
                {displayCardNo}
              </span>
            </div>

            {winnerMember && (
              <div className="space-y-3 animate-fade-in w-full">
                <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                  <span className="text-xs uppercase font-bold tracking-wider block">🏆 भाग्यवान विजेता घोषित!</span>
                  <span className="text-2xl font-black block mt-1">{winnerMember.memberName}</span>
                  <span className="text-xs text-slate-300 block">
                    गाव / पत्ता: {winnerMember.address} • फोन: {winnerMember.phone}
                  </span>
                  <span className="text-xs font-bold text-amber-300 block mt-1">
                    बक्षीस: {selectedPrize}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleSendWhatsAppCongrats}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>विजेत्याला WhatsApp वर अभिनंदन संदेश पाठवा</span>
                </button>
              </div>
            )}
          </div>

          {/* Printable Gold Certificate */}
          {winnerMember && (
            <div className="w-full max-w-[520px] mt-6 p-8 rounded-3xl border-8 border-double border-amber-400 bg-gradient-to-b from-[#1c1605] via-[#100d04] to-[#1c1605] text-white shadow-2xl text-center relative">
              <div className="flex justify-center mb-2">
                <Crown className="w-8 h-8 text-amber-400" />
              </div>

              <h2 className="font-serif font-black text-xl text-amber-400 tracking-wider uppercase">
                SHRI SAI ENTERPRISES, WARDHA
              </h2>
              <p className="text-[10px] text-slate-400 mb-4">
                Electronics & Furniture Showroom • 30-Month Weekly Savings Scheme
              </p>

              <h4 className="font-serif text-base text-amber-300 font-bold mb-2">
                लकी ड्रॉ सुवर्ण विजेता प्रमाणपत्र (WINNER GOLD CERTIFICATE)
              </h4>

              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                प्रमाणित करण्यात येते की ३०-महिने साप्ताहिक बचत योजनेच्या <strong>महिना {drawMonth}</strong> च्या पारदर्शक लकी सोडतीमध्ये खालील सभासद भाग्यशाली विजेता ठरले आहेत:
              </p>

              <div className="py-3 px-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 mb-4">
                <div className="text-lg font-black text-white">{winnerMember.memberName}</div>
                <div className="text-xs text-amber-400 font-mono font-bold">योजना कार्ड क्र. #{winnerMember.cardNo}</div>
                <div className="text-[11px] text-slate-300 mt-1">जिंकलेले बक्षीस: {selectedPrize}</div>
              </div>

              <p className="text-[10px] text-slate-400 italic mb-6">
                योजनेच्या नियमांनुसार विजेत्याचे पुढील सर्व हप्ते १००% मोफत करण्यात आले आहेत.
              </p>

              <div className="pt-4 border-t border-slate-700 flex justify-between text-[11px] text-slate-400">
                <div>तारीख: {new Date().toLocaleDateString('en-IN')}</div>
                <div>अधिकृत स्वाक्षरी व शिक्का</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
