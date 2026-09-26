import React, { useState } from 'react';
import {
  Printer,
  X,
  Share2,
  CheckCircle2,
  Copy,
  Check,
  CreditCard,
  Building,
  QrCode,
  Calendar,
  Phone,
  MapPin,
  FileText,
  Gift,
  AlertTriangle,
  Award,
  ShieldCheck,
  BookOpen
} from 'lucide-react';
import { CardMember, CardTransaction, StoreSettings } from '../../types';
import {
  getCardFinancialSummary,
  getSchemeConfig,
  resolveCardScheme,
  extractCardNumber,
  SCHEME_OFFICIAL_RULES_16,
  SCHEME_WARRANTY_DISCLAIMER
} from '../../utils/schemeUtils';

interface CardPassbookPrintModalProps {
  member: CardMember | null;
  transactions?: CardTransaction[];
  settings: StoreSettings;
  isOpen: boolean;
  onClose: () => void;
}

type PrintFormat = 'card30' | 'thermal58' | 'thermal80' | 'a4' | 'rules';

export const CardPassbookPrintModal: React.FC<CardPassbookPrintModalProps> = ({
  member,
  transactions = [],
  settings,
  isOpen,
  onClose,
}) => {
  const [printFormat, setPrintFormat] = useState<PrintFormat>('card30');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !member) return null;

  const schemeNo = resolveCardScheme(member);
  const config = getSchemeConfig(schemeNo);
  const cardNum = extractCardNumber(member.cardNo);
  const fin = getCardFinancialSummary(member);

  // Filter receipts for this member
  const memberReceipts = transactions.filter(
    (ct) => ct.cardMemberId === member.id || ct.cardNo === member.cardNo
  );

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    let msg = `*${settings.storeName || 'SHRI SAI ENTERPRISES'}*\n`;
    msg += `(श्री साई इंटरप्रायजेस, वर्धा - ३०-महिने बचत योजना पासबुक)\n`;
    msg += `📞 संपर्क: 8600122978 / 9175537365 / 8766486915\n`;
    msg += `----------------------------------------\n`;
    msg += `📋 *ग्राहक खातेवही व पासबुक तपशील (PASSBOOK CARD)*\n`;
    msg += `💳 *कार्ड क्र.:* #${cardNum} (${config.marathiName})\n`;
    msg += `👤 *ग्राहक:* ${member.memberName}\n`;
    msg += `📱 *मोबाईल:* ${member.phone && member.phone !== '0' ? member.phone : 'N/A'}\n`;
    msg += `📍 *गाव / पत्ता:* ${member.village || member.address || 'Wardha'}\n`;
    msg += `🎟️ *सदस्यता शुल्क:* ₹${fin.membershipFee}/-\n`;
    msg += `📅 *दिनांक:* ${new Date(member.startDate || Date.now()).toLocaleDateString('en-IN')}\n`;
    msg += `----------------------------------------\n`;
    msg += `📊 *अचूक हिशोब जुळवणी (Exact Math Summary):*\n`;
    msg += `• योजना हप्ता: *₹५००/- दरमहा* (साप्ताहिक ₹१०० हप्ता)\n`;
    msg += `• योजना एकूण उद्दिष्ट: *₹${fin.schemeTarget.toLocaleString('en-IN')}* (३० महिने)\n`;
    msg += `• एकूण आजवर जमा: *₹${fin.totalPaid.toLocaleString('en-IN')}* (${fin.totalPaidMonths}/${fin.durationMonths} महिने भरले)\n`;
    msg += `• शिल्लक बाकी: *₹${fin.balanceDue.toLocaleString('en-IN')}* (देय बाकी)\n`;
    msg += `🎁 *मॅच्युरिटी बोनस:* ₹${fin.bonusAmount}/- (३० महिने पूर्ण झाल्यावर)\n`;
    msg += `💰 *एकूण परतावा/वस्तू:* *₹${fin.totalMaturityValue.toLocaleString('en-IN')}* (१५,००० + ५०० बोनस)\n`;
    msg += `✅ *हिशोब पडताळणी: ₹${fin.totalPaid.toLocaleString('en-IN')} + ₹${fin.balanceDue.toLocaleString('en-IN')} = ₹${fin.schemeTarget.toLocaleString('en-IN')} (१००% अचूक)*\n`;
    msg += `----------------------------------------\n`;
    msg += `💳 *बँक व UPI पेमेंट तपशील:*\n`;
    msg += `• UPI ID: *${settings.bankDetails?.upiId || '8766486915@ybl'}*\n`;
    msg += `• बँक खाते: ${settings.bankDetails?.bankName || 'HDFC Bank'} - A/C ${settings.bankDetails?.accountNumber || '50200083215914'}\n`;
    msg += `• IFSC: ${settings.bankDetails?.ifscCode || 'HDFC0000065'}\n`;
    msg += `----------------------------------------\n`;
    msg += `धन्यवाद! 🙏 श्री साई इंटरप्रायजेस, वर्धा`;

    const encoded = encodeURIComponent(msg);
    const cleanPhone = member.phone.replace(/\D/g, '');
    const phoneParam = cleanPhone.length >= 10 ? `phone=91${cleanPhone.slice(-10)}&` : '';
    window.open(`https://api.whatsapp.com/send?${phoneParam}text=${encoded}`, '_blank');
  };

  const handleShareRulesWhatsApp = () => {
    let msg = `*श्री साई इंटरप्रायजेस, वर्धा - ३०-महिने बचत योजना*\n`;
    msg += `*अधिकृत नियम व अटी (Official Rules & Conditions)*\n`;
    msg += `मातोश्री सभागृह समोर, आर्वी रोड, पंजाब कॉलनी, वर्धा\n`;
    msg += `📞 संपर्क: 8600122978 / 9175537365 / 8766486915\n`;
    msg += `----------------------------------------\n`;
    SCHEME_OFFICIAL_RULES_16.forEach((r) => {
      msg += `${r}\n\n`;
    });
    msg += `----------------------------------------\n`;
    msg += `📌 *गॅरंटी व वॉरंटी नियम:*\n${SCHEME_WARRANTY_DISCLAIMER}\n`;
    msg += `धन्यवाद! 🙏 श्री साई इंटरप्रायजेस`;

    const encoded = encodeURIComponent(msg);
    const cleanPhone = member.phone.replace(/\D/g, '');
    const phoneParam = cleanPhone.length >= 10 ? `phone=91${cleanPhone.slice(-10)}&` : '';
    window.open(`https://api.whatsapp.com/send?${phoneParam}text=${encoded}`, '_blank');
  };

  const handleCopy = () => {
    const text = `कार्ड #${cardNum} | ${member.memberName} | जमा: ₹${fin.totalPaid} | बाकी: ₹${fin.balanceDue} | योजना: ₹${fin.schemeTarget} + बोनस ₹${fin.bonusAmount} = एकूण ₹${fin.totalMaturityValue}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Build the 30-month table data
  // Each month: 5 installment lines (100, 100, 100, 100, 200/100 = 500 total)
  const monthsData = Array.from({ length: 30 }, (_, idx) => {
    const monthNum = idx + 1;
    const cumulativeTotal = monthNum * 500;
    const isPaid = fin.totalPaid >= cumulativeTotal;
    const isPartiallyPaid = !isPaid && fin.totalPaid > (monthNum - 1) * 500;
    return {
      monthNum,
      cumulativeTotal,
      isPaid,
      isPartiallyPaid,
    };
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col max-h-[96vh]">
        {/* Top Control Bar */}
        <div className="px-4 py-3 bg-slate-800/90 border-b border-slate-700 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-white font-bold">
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>३०-महिने बचत योजना पासबुक • कार्ड क्र. #{cardNum}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Format Selector */}
            <div className="flex rounded-lg bg-slate-900 p-0.5 border border-slate-700">
              <button
                type="button"
                onClick={() => setPrintFormat('card30')}
                className={`px-2.5 py-1 rounded text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                  printFormat === 'card30'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <span>📜 मूळ कार्ड (Passbook Card)</span>
              </button>
              <button
                type="button"
                onClick={() => setPrintFormat('rules')}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition cursor-pointer ${
                  printFormat === 'rules'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                १६ नियम व अटी
              </button>
              <button
                type="button"
                onClick={() => setPrintFormat('thermal58')}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition cursor-pointer ${
                  printFormat === 'thermal58'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                2" (58mm POS)
              </button>
              <button
                type="button"
                onClick={() => setPrintFormat('thermal80')}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition cursor-pointer ${
                  printFormat === 'thermal80'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                3" (80mm)
              </button>
              <button
                type="button"
                onClick={() => setPrintFormat('a4')}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition cursor-pointer ${
                  printFormat === 'a4'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                A4 स्टेटमेंट
              </button>
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs transition cursor-pointer flex items-center gap-1 border border-slate-700"
              title="तपशील कॉपी करा"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'कॉपी झाले' : 'Copy'}</span>
            </button>

            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition cursor-pointer flex items-center gap-1 shadow-sm"
              title="WhatsApp वर पासबुक पाठवा"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handleShareRulesWhatsApp}
              className="px-2.5 py-1.5 bg-teal-700 hover:bg-teal-600 text-white font-bold rounded-lg text-xs transition cursor-pointer flex items-center gap-1 shadow-sm"
              title="WhatsApp वर १६ नियम व अटी पाठवा"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>नियम WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Paper Container */}
        <div className="p-3 sm:p-5 overflow-y-auto bg-slate-950/70 flex justify-center">
          {/* Format 0: EXACT PHYSICAL 30-MONTH PASSBOOK CARD REPLICA (As in the photo) */}
          {printFormat === 'card30' && (
            <div
              id="printable-card-passbook"
              className="w-full max-w-4xl bg-[#fffdfa] text-slate-900 p-4 sm:p-6 rounded-xl border-2 border-amber-900/30 shadow-2xl font-sans text-xs leading-normal space-y-4"
            >
              {/* Top Header matching physical card */}
              <div className="border-b-2 border-slate-900 pb-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-dashed border-slate-400 pb-2 mb-2">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-800">
                      सदस्यता शुल्क: <b className="text-slate-950 font-mono">रु. ५०/-</b>
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="font-bold text-slate-800">
                      दिनांक: <span className="font-mono">{member.startDate ? new Date(member.startDate).toLocaleDateString('en-IN') : '19/8/24'}</span>
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="font-bold text-slate-800">
                      शिट नं.: <span className="font-mono">{member.sheetNo || '1'}</span>
                    </span>
                    {(member.itemBillNo || member.deliveredItemName) && (
                      <>
                        <span className="text-slate-400">•</span>
                        <span className="font-bold text-emerald-900 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300 text-[10px]">
                          बिल: #{member.itemBillNo || 'नोंद'} ({member.deliveredItemName || 'वस्तू'})
                        </span>
                      </>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-red-700 font-black font-mono text-xl tracking-wider">
                      कार्ड क्र. {String(cardNum).padStart(5, '0')}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs pt-1">
                  <div className="md:col-span-2">
                    <span className="font-bold text-slate-700">पूर्ण नाव श्री / सौ : </span>
                    <span className="font-black uppercase text-sm text-slate-950 underline decoration-amber-600 underline-offset-4">
                      {member.memberName}
                    </span>
                  </div>
                  <div className="text-left md:text-right">
                    <span className="font-bold text-slate-700">मो. नं. : </span>
                    <span className="font-mono font-bold text-slate-900">
                      {member.phone && member.phone !== '0' ? member.phone : '_______________'}
                    </span>
                  </div>
                  <div className="md:col-span-3">
                    <span className="font-bold text-slate-700">पत्ता : </span>
                    <span className="font-semibold text-slate-900">
                      {member.village || member.address || 'इंदूसी नगर, वर्धा'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 30 Months Grid - Exactly structured like the physical card in two halves */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Left Half: Months 1 to 14 */}
                <div className="border border-slate-400 rounded-lg overflow-hidden bg-white">
                  <div className="bg-amber-100/70 border-b border-slate-400 px-2 py-1 font-bold text-[11px] text-amber-950 flex justify-between">
                    <span>भाग १ (महिना क्र. १ ते १४) • दरमहा ₹५००</span>
                    <span>एकूण: ₹७,०००</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-center border-collapse text-[10px]">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold">
                          <th className="py-1 px-1 border-r border-slate-300">सो.क्र.</th>
                          <th className="py-1 px-1 border-r border-slate-300">हप्ते (रुपये)</th>
                          <th className="py-1 px-1 border-r border-slate-300">र.नं.</th>
                          <th className="py-1 px-1 border-r border-slate-300">दिनांक</th>
                          <th className="py-1 px-1">स्थिती / सही</th>
                        </tr>
                      </thead>
                      <tbody>
                        {monthsData.slice(0, 14).map((m) => (
                          <tr
                            key={m.monthNum}
                            className={`border-b border-slate-200 transition ${
                              m.isPaid
                                ? 'bg-emerald-50/70 text-slate-950'
                                : m.isPartiallyPaid
                                ? 'bg-amber-50/70 text-slate-950'
                                : 'text-slate-600'
                            }`}
                          >
                            <td className="py-1 px-1 font-bold font-mono border-r border-slate-300 bg-slate-50">
                              {m.monthNum}
                            </td>
                            <td className="py-1 px-1 border-r border-slate-300 font-mono text-[9px] leading-tight">
                              <div>100 100</div>
                              <div>100 200</div>
                            </td>
                            <td className="py-1 px-1 font-bold font-mono border-r border-slate-300 text-slate-900">
                              ₹{m.cumulativeTotal}
                            </td>
                            <td className="py-1 px-1 border-r border-slate-300 font-mono text-[9px]">
                              {m.isPaid ? 'जमा' : m.isPartiallyPaid ? 'अंशतः' : '-'}
                            </td>
                            <td className="py-1 px-1">
                              {m.isPaid ? (
                                <span className="inline-flex items-center gap-0.5 text-emerald-700 font-bold text-[9px]">
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span>जमा ✓</span>
                                </span>
                              ) : m.isPartiallyPaid ? (
                                <span className="text-amber-700 font-bold text-[9px]">अंशतः</span>
                              ) : (
                                <span className="text-slate-300 text-[9px]">बाकी</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Right Half: Months 15 to 30 */}
                <div className="border border-slate-400 rounded-lg overflow-hidden bg-white flex flex-col justify-between">
                  <div>
                    <div className="bg-amber-100/70 border-b border-slate-400 px-2 py-1 font-bold text-[11px] text-amber-950 flex justify-between">
                      <span>भाग २ (महिना क्र. १५ ते ३०) • दरमहा ₹५००</span>
                      <span>एकूण: ₹८,०००</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-center border-collapse text-[10px]">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold">
                            <th className="py-1 px-1 border-r border-slate-300">सो.क्र.</th>
                            <th className="py-1 px-1 border-r border-slate-300">हप्ते (रुपये)</th>
                            <th className="py-1 px-1 border-r border-slate-300">र.नं.</th>
                            <th className="py-1 px-1 border-r border-slate-300">दिनांक</th>
                            <th className="py-1 px-1">स्थिती / सही</th>
                          </tr>
                        </thead>
                        <tbody>
                          {monthsData.slice(14, 30).map((m) => (
                            <tr
                              key={m.monthNum}
                              className={`border-b border-slate-200 transition ${
                                m.isPaid
                                  ? 'bg-emerald-50/70 text-slate-950'
                                  : m.isPartiallyPaid
                                  ? 'bg-amber-50/70 text-slate-950'
                                  : 'text-slate-600'
                              }`}
                            >
                              <td className="py-1 px-1 font-bold font-mono border-r border-slate-300 bg-slate-50">
                                {m.monthNum}
                              </td>
                              <td className="py-1 px-1 border-r border-slate-300 font-mono text-[9px] leading-tight">
                                <div>100 100</div>
                                <div>100 200</div>
                              </td>
                              <td className="py-1 px-1 font-bold font-mono border-r border-slate-300 text-slate-900">
                                ₹{m.cumulativeTotal}
                              </td>
                              <td className="py-1 px-1 border-r border-slate-300 font-mono text-[9px]">
                                {m.isPaid ? 'जमा' : m.isPartiallyPaid ? 'अंशतः' : '-'}
                              </td>
                              <td className="py-1 px-1">
                                {m.isPaid ? (
                                  <span className="inline-flex items-center gap-0.5 text-emerald-700 font-bold text-[9px]">
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    <span>जमा ✓</span>
                                  </span>
                                ) : m.isPartiallyPaid ? (
                                  <span className="text-amber-700 font-bold text-[9px]">अंशतः</span>
                                ) : (
                                  <span className="text-slate-300 text-[9px]">बाकी</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Bonus & Total Banner exactly as printed on card */}
                  <div className="bg-amber-500/20 border-t-2 border-amber-600 p-2 text-center font-bold text-xs space-y-0.5">
                    <div className="text-amber-900 font-extrabold text-sm">
                      Bonus Rs. {fin.bonusAmount}/-
                    </div>
                    <div className="text-slate-950 font-black text-base">
                      Total Rs. {fin.totalMaturityValue.toLocaleString('en-IN')}/-
                    </div>
                    <div className="text-[10px] text-slate-700">
                      (३० महिने पूर्ण भरल्यानंतर ₹१५,००० + ₹५०० बोनस = ₹१५,५०० वस्तू अथवा परतावा)
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Calculation Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-100 p-3 rounded-lg border border-slate-300 text-center font-mono">
                <div>
                  <span className="text-[10px] text-slate-600 font-sans block">योजना उद्दिष्ट</span>
                  <span className="font-bold text-sm text-slate-900">₹{fin.schemeTarget.toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-600 font-sans block">एकूण आजवर जमा</span>
                  <span className="font-black text-sm text-emerald-700">₹{fin.totalPaid.toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-600 font-sans block">शिल्लक बाकी देय</span>
                  <span className="font-black text-sm text-rose-700">₹{fin.balanceDue.toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-600 font-sans block">मॅच्युरिटी मूल्य</span>
                  <span className="font-black text-sm text-amber-700">₹{fin.totalMaturityValue.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Bottom Section from Physical Card: Bill Details + Disclaimer + QR + 16 Rules */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2 border-t-2 border-slate-900">
                {/* Left: Bill Section & Guarantee Disclaimer (5 cols) */}
                <div className="md:col-span-5 space-y-2 border border-slate-300 p-2.5 rounded-lg bg-slate-50 text-[10px]">
                  <div className="font-bold text-slate-900 uppercase border-b border-slate-300 pb-1 flex justify-between items-center">
                    <span>बिल व खरेदी नोंद (Bill Entry)</span>
                    <span className="text-slate-700 font-semibold">
                      {member.itemDueDt ? `देय ता.: ${member.itemDueDt}` : 'पैसे देण्याची ता.: ________'}
                    </span>
                  </div>

                  <div className="space-y-1 font-mono text-[10px]">
                    <div className="flex justify-between border-b border-dashed border-slate-300 pb-0.5">
                      <span className="font-sans text-slate-600">Bill No. :</span>
                      <span className={`font-bold ${member.itemBillNo ? 'text-slate-950 font-black' : 'text-slate-400'}`}>
                        {member.itemBillNo || '____________________'}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-slate-300 pb-0.5">
                      <span className="font-sans text-slate-600">Date :</span>
                      <span className={`font-bold ${member.itemBillDate ? 'text-slate-950' : 'text-slate-400'}`}>
                        {member.itemBillDate ? new Date(member.itemBillDate).toLocaleDateString('en-IN') : '____________________'}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-slate-300 pb-0.5">
                      <span className="font-sans text-slate-600">Item :</span>
                      <span className={`font-bold uppercase ${member.deliveredItemName ? 'text-emerald-900 font-black' : 'text-slate-400'}`}>
                        {member.deliveredItemName || '____________________'}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-slate-300 pb-0.5">
                      <span className="font-sans text-slate-600">Amt :</span>
                      <span className={`font-bold ${member.itemTotalAmount ? 'text-slate-950 font-black' : 'text-slate-400'}`}>
                        {member.itemTotalAmount ? `₹${member.itemTotalAmount.toLocaleString('en-IN')}` : '____________________'}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-slate-300 pb-0.5">
                      <span className="font-sans text-slate-600">Advance :</span>
                      <span className={`font-bold ${member.itemAdvancePaid ? 'text-emerald-800 font-black' : 'text-slate-400'}`}>
                        {member.itemAdvancePaid ? `₹${member.itemAdvancePaid.toLocaleString('en-IN')}` : '____________________'}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-slate-300 pb-0.5">
                      <span className="font-sans text-slate-600">Balance :</span>
                      <span className={`font-bold ${member.itemBalanceDue !== undefined && member.itemBalanceDue > 0 ? 'text-rose-700 font-black' : member.itemBalanceDue === 0 ? 'text-emerald-700 font-black' : 'text-slate-400'}`}>
                        {member.itemBalanceDue !== undefined ? `₹${member.itemBalanceDue.toLocaleString('en-IN')}` : '____________________'}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-slate-300 pb-0.5">
                      <span className="font-sans text-slate-600">Due Dt. :</span>
                      <span className={`font-bold ${member.itemDueDt ? 'text-slate-950' : 'text-slate-400'}`}>
                        {member.itemDueDt || '____________________'}
                      </span>
                    </div>
                  </div>

                  {/* Warranty Disclaimer from card */}
                  <div className="p-1.5 rounded bg-amber-50 border border-amber-300 text-[8.5px] leading-tight text-amber-950">
                    <span className="font-bold">महत्त्वाची सूचना: </span>
                    {SCHEME_WARRANTY_DISCLAIMER}
                  </div>

                  {/* QR code box */}
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-200">
                    <div className="w-12 h-12 bg-white p-0.5 border border-slate-400 rounded shrink-0 flex items-center justify-center">
                      <QrCode className="w-10 h-10 text-slate-900" />
                    </div>
                    <span className="text-[8px] text-slate-600 leading-tight">
                      ही पावती व योजनेची संपूर्ण माहिती अथवा कोणत्याही अडचणीकरिता हा QR कोड स्कॅन करा.
                    </span>
                  </div>
                </div>

                {/* Right: All 16 Rules & Conditions (7 cols) */}
                <div className="md:col-span-7 border border-slate-300 p-2.5 rounded-lg bg-slate-50 text-[9.5px] space-y-1.5 flex flex-col justify-between">
                  <div>
                    <h3 className="font-black text-xs text-amber-950 uppercase border-b border-slate-300 pb-1 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                      <span>नियम व अटी :- (Rules & Conditions)</span>
                    </h3>
                    <ol className="space-y-1 pt-1 text-slate-800 leading-tight">
                      {SCHEME_OFFICIAL_RULES_16.map((rule, idx) => (
                        <li key={idx} className="flex gap-1">
                          <span className="text-slate-900 font-normal">{rule}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Declaration & Signatures */}
                  <div className="pt-2 border-t border-slate-300 space-y-2">
                    <p className="text-[8px] text-slate-600 italic">
                      मी खाली सही करणार मला श्री साई एंटरप्रायझेस ची वस्तू खरेदी करण्याकरिता या योजनेत सहभागी होत आहे.
                    </p>
                    <div className="flex justify-between items-end pt-3 text-[9px] font-bold text-slate-800">
                      <div className="text-center">
                        <div className="w-24 border-b border-slate-400 mb-1"></div>
                        <span>कार्ड काढणाऱ्याची सही</span>
                      </div>
                      <div className="text-center">
                        <div className="w-24 border-b border-slate-400 mb-1"></div>
                        <span>ग्राहकाची सही</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Format 1: 16 Rules standalone printable document */}
          {printFormat === 'rules' && (
            <div
              id="printable-card-passbook"
              className="w-full max-w-3xl bg-white text-slate-900 p-6 rounded-xl border border-slate-200 shadow-xl space-y-4 font-sans text-xs"
            >
              <div className="text-center border-b-2 border-slate-900 pb-3">
                <h1 className="text-xl font-black uppercase tracking-wider text-slate-950 font-serif">
                  {settings.storeName || 'SHRI SAI ENTERPRISES'}
                </h1>
                <p className="text-xs font-semibold text-slate-700">श्री साई इंटरप्रायजेस, वर्धा</p>
                <p className="text-[11px] text-slate-600">
                  मातोश्री सभागृह समोर, आर्वी रोड, पंजाब कॉलनी, वर्धा • 📞 8600122978 / 9175537365 / 8766486915
                </p>
                <div className="inline-block bg-amber-100 text-amber-900 px-3 py-1 rounded-full text-xs font-bold mt-2">
                  ३०-महिने बचत योजना • अधिकृत १६ नियम व अटी (Rules & Conditions)
                </div>
              </div>

              <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 space-y-2.5">
                <ol className="space-y-2 text-slate-800 text-[11px] leading-relaxed">
                  {SCHEME_OFFICIAL_RULES_16.map((rule, idx) => (
                    <li key={idx} className="p-2 bg-white rounded-lg border border-amber-100 shadow-xs">
                      {rule}
                    </li>
                  ))}
                </ol>
              </div>

              <div className="p-3 bg-slate-100 rounded-xl border border-slate-300 text-xs">
                <span className="font-bold text-slate-900">हमी व वॉरंटी नियम: </span>
                <span>{SCHEME_WARRANTY_DISCLAIMER}</span>
              </div>

              <div className="pt-4 border-t border-slate-300 flex justify-between items-end text-xs text-slate-600">
                <div>
                  <p className="font-bold text-slate-900">श्री साई इंटरप्रायजेस, वर्धा</p>
                  <p>अधिकृत संपर्क: 8600122978 / 8766486915</p>
                </div>
                <div className="text-center">
                  <div className="w-36 border-b border-slate-500 mb-1"></div>
                  <span className="font-bold text-slate-900">अधिकृत स्वाक्षरी / शिक्का</span>
                </div>
              </div>
            </div>
          )}

          {/* Format 2: 58mm Thermal POS */}
          {printFormat === 'thermal58' && (
            <div
              id="printable-card-passbook"
              className="w-[58mm] max-w-full bg-white text-slate-900 p-3 rounded-lg border border-slate-200 shadow-xl font-mono text-[11px] leading-tight space-y-2"
            >
              <div className="text-center border-b border-dashed border-slate-800 pb-2">
                <div className="font-black text-sm uppercase tracking-wider text-slate-950 font-sans">
                  {settings.storeName || 'SHRI SAI ENTERPRISES'}
                </div>
                <div className="text-[9px] font-bold text-slate-700">श्री साई इंटरप्रायजेस, वर्धा</div>
                <div className="text-[8px] text-slate-600">📞 8600122978 / 8766486915</div>
              </div>

              <div className="text-center font-bold text-[10px] uppercase bg-slate-100 py-1 rounded border border-slate-200">
                ३०-महिने पासबुक पावती
              </div>

              <div className="space-y-1 text-[10px]">
                <div className="flex justify-between">
                  <span className="text-slate-600">कार्ड क्र.:</span>
                  <span className="font-extrabold text-slate-950">#{cardNum}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">ग्राहक:</span>
                  <span className="font-bold text-slate-950 uppercase">{member.memberName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">मोबाईल:</span>
                  <span>{member.phone && member.phone !== '0' ? member.phone : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">पत्ता:</span>
                  <span>{member.village || member.address || 'Wardha'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">सदस्यता शुल्क:</span>
                  <span className="font-bold">₹{fin.membershipFee}/-</span>
                </div>
              </div>

              <div className="border-t border-dashed border-slate-400 pt-1.5 space-y-1 text-[10px]">
                <div className="flex justify-between">
                  <span>दरमहा हप्ता:</span>
                  <span className="font-bold">₹५०० (४x१००+२००)</span>
                </div>
                <div className="flex justify-between">
                  <span>भरलेले महिने:</span>
                  <span className="font-bold">{fin.totalPaidMonths} / ३० महिने</span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-300 rounded p-2 text-center space-y-1">
                <div className="text-[9px] uppercase font-bold text-slate-600">
                  एकूण जमा रक्कम (TOTAL PAID)
                </div>
                <div className="text-base font-black text-slate-950">
                  ₹{fin.totalPaid.toLocaleString('en-IN')}
                </div>
                <div className="flex justify-between text-[9px] pt-1 border-t border-slate-200 font-bold">
                  <span className="text-slate-600">योजना उद्दिष्ट:</span>
                  <span>₹{fin.schemeTarget.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-[9px] font-bold text-rose-700">
                  <span>शिल्लक बाकी:</span>
                  <span>₹{fin.balanceDue.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-[9px] font-bold text-amber-700 pt-1 border-t border-slate-200">
                  <span>बोनस (Bonus):</span>
                  <span>₹{fin.bonusAmount}</span>
                </div>
                <div className="flex justify-between text-[10px] font-black text-slate-950">
                  <span>एकूण परतावा:</span>
                  <span>₹{fin.totalMaturityValue.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Optional Bill Entry in Thermal 58mm */}
              {(member.deliveredItemName || member.itemBillNo) && (
                <div className="bg-emerald-50 border border-emerald-300 rounded p-1.5 text-[9px] space-y-0.5 text-left">
                  <div className="font-bold text-emerald-950 uppercase border-b border-emerald-200 pb-0.5">
                    खरेदी बिल नोंद (Item / Bill)
                  </div>
                  <div className="flex justify-between">
                    <span>बिल क्र.:</span>
                    <span className="font-bold">#{member.itemBillNo || 'नोंद'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>वस्तू:</span>
                    <span className="font-bold uppercase text-emerald-900">{member.deliveredItemName}</span>
                  </div>
                  {member.itemTotalAmount && (
                    <div className="flex justify-between">
                      <span>एकूण किंमत:</span>
                      <span className="font-bold">₹{member.itemTotalAmount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {member.itemBalanceDue !== undefined && (
                    <div className="flex justify-between text-rose-700 font-bold">
                      <span>बाकी रक्कम:</span>
                      <span>₹{member.itemBalanceDue.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="text-[8px] text-center text-slate-600 bg-emerald-50 border border-emerald-200 p-1 rounded">
                हिशोब पडताळणी: ₹{fin.totalPaid} + ₹{fin.balanceDue} = ₹{fin.schemeTarget} (१००% अचूक)
              </div>

              <div className="border-t border-dashed border-slate-400 pt-1 text-[8px] text-center text-slate-600 leading-tight">
                <div>UPI: <b>8766486915@ybl</b></div>
                <div>धन्यवाद! श्री साई इंटरप्रायजेस</div>
              </div>
            </div>
          )}

          {/* Format 3: 80mm POS */}
          {printFormat === 'thermal80' && (
            <div
              id="printable-card-passbook"
              className="w-[80mm] max-w-full bg-white text-slate-900 p-4 rounded-xl border border-slate-200 shadow-xl font-mono text-xs space-y-2.5"
            >
              <div className="text-center border-b-2 border-slate-900 pb-2">
                <div className="font-black text-base uppercase tracking-wider text-slate-950 font-sans">
                  {settings.storeName || 'SHRI SAI ENTERPRISES'}
                </div>
                <div className="text-[10px] font-bold text-slate-800">श्री साई इंटरप्रायजेस, वर्धा</div>
                <div className="text-[9px] text-slate-600">३०-महिने बचत योजना पासबुक • 📞 8600122978 / 8766486915</div>
              </div>

              <div className="text-center font-bold text-[11px] uppercase bg-amber-50 text-amber-950 py-1 rounded border border-amber-300">
                ग्राहक पासबुक पावती (PASSBOOK SLIP)
              </div>

              <div className="grid grid-cols-2 gap-1 text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-500 block text-[9px]">कार्ड क्र.:</span>
                  <span className="font-black text-slate-950 text-sm">#{cardNum}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block text-[9px]">सदस्यता शुल्क:</span>
                  <span className="font-bold text-slate-900">₹५०/-</span>
                </div>
                <div className="col-span-2 pt-1 border-t border-slate-200">
                  <span className="text-slate-500 text-[9px] block">ग्राहक नाव:</span>
                  <span className="font-extrabold text-slate-950 uppercase">{member.memberName}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[9px] block">मोबाईल:</span>
                  <span className="font-semibold">{member.phone && member.phone !== '0' ? member.phone : 'N/A'}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 text-[9px] block">पत्ता:</span>
                  <span className="font-semibold">{member.village || member.address || 'Wardha'}</span>
                </div>
              </div>

              <div className="border border-slate-300 rounded-lg p-2.5 space-y-1 bg-slate-50 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-600">योजना उद्दिष्ट (३० महिने):</span>
                  <span className="font-bold">₹{fin.schemeTarget.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">दरमहा हप्ता:</span>
                  <span className="font-bold">₹५००/- (साप्ताहिक ₹१००)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">भरलेले महिने:</span>
                  <span className="font-bold text-emerald-700">{fin.totalPaidMonths} / ३० महिने</span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-950 pt-1 border-t border-slate-300">
                  <span>एकूण जमा रक्कम:</span>
                  <span className="text-emerald-700">₹{fin.totalPaid.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between font-bold text-rose-600">
                  <span>शिल्लक बाकी (Balance):</span>
                  <span>₹{fin.balanceDue.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between font-bold text-amber-700 pt-1 border-t border-dashed border-slate-300">
                  <span>३०-महिने बोनस:</span>
                  <span>+₹{fin.bonusAmount}</span>
                </div>
                <div className="flex justify-between font-black text-xs text-slate-950">
                  <span>मॅच्युरिटी एकूण परतावा:</span>
                  <span>₹{fin.totalMaturityValue.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Optional Bill Entry in Thermal 80mm */}
              {(member.deliveredItemName || member.itemBillNo) && (
                <div className="bg-emerald-50 border border-emerald-300 rounded p-2 text-[10px] space-y-1 text-left">
                  <div className="font-bold text-emerald-950 uppercase border-b border-emerald-200 pb-0.5 flex justify-between">
                    <span>खरेदी बिल नोंद (Item / Bill)</span>
                    <span className="text-emerald-700">✓ अधिकृत पावती</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <div>
                      <span className="text-slate-600 block text-[9px]">बिल क्र.:</span>
                      <span className="font-black text-slate-900">#{member.itemBillNo || 'नोंद'}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-600 block text-[9px]">तारीख:</span>
                      <span className="font-bold">{member.itemBillDate ? new Date(member.itemBillDate).toLocaleDateString('en-IN') : '-'}</span>
                    </div>
                  </div>
                  <div className="pt-0.5">
                    <span className="text-slate-600 block text-[9px]">नेलेली वस्तू:</span>
                    <span className="font-black text-emerald-950 uppercase">{member.deliveredItemName}</span>
                  </div>
                  <div className="flex justify-between pt-0.5 border-t border-emerald-200">
                    <span>एकूण किंमत:</span>
                    <span className="font-black">₹{(member.itemTotalAmount ?? 15500).toLocaleString('en-IN')}</span>
                  </div>
                  {member.itemBalanceDue !== undefined && (
                    <div className="flex justify-between text-rose-700 font-bold">
                      <span>शिल्लक बाकी:</span>
                      <span>₹{member.itemBalanceDue.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="p-1.5 rounded bg-emerald-50 border border-emerald-300 text-center text-[9.5px] text-emerald-950 font-bold">
                हिशोब पडताळणी: जमा ₹{fin.totalPaid} + बाकी ₹{fin.balanceDue} = एकूण ₹{fin.schemeTarget} (१००% अचूक)
              </div>

              <div className="pt-2 border-t border-dashed border-slate-400 flex justify-between items-end text-[9px] text-slate-600">
                <div>
                  <p className="font-bold text-slate-800">UPI: 8766486915@ybl</p>
                  <p>HDFC Bank: 50200083215914</p>
                </div>
                <div className="text-center">
                  <div className="w-20 border-b border-slate-400 mb-0.5"></div>
                  <span>अधिकृत सही</span>
                </div>
              </div>
            </div>
          )}

          {/* Format 4: A4 Full Ledger */}
          {printFormat === 'a4' && (
            <div
              id="printable-card-passbook"
              className="w-full bg-white text-slate-900 p-6 sm:p-8 rounded-xl border border-slate-200 shadow-xl font-sans text-xs space-y-4"
            >
              <div className="text-center border-b-2 border-slate-900 pb-3">
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest block">
                  30-MONTH SAVINGS SCHEME PASSBOOK (३०-महिने ग्राहक खातेवही)
                </span>
                <h1 className="text-2xl font-black uppercase tracking-wider text-slate-950 font-serif">
                  {settings.storeName || 'SHRI SAI ENTERPRISES'}
                </h1>
                <p className="text-[11px] font-semibold text-slate-700 mt-0.5">
                  मातोश्री सभागृह समोर, आर्वी रोड, पंजाब कॉलनी, वर्धा - 442001
                </p>
                <p className="text-[10px] text-slate-600 mt-0.5">
                  📞 8600122978 / 9175537365 / 8766486915
                </p>
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-700 mt-2 px-2 pt-1 border-t border-dashed border-slate-300">
                  <span>योजना: {config.name} ({config.marathiName})</span>
                  <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-300 font-extrabold font-mono">
                    कार्ड क्र.: #{cardNum}
                  </span>
                  <span>तारीख: {new Date().toLocaleDateString('en-IN')}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-[11px]">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-slate-500">सभासद तपशील:</p>
                  <p className="font-extrabold text-slate-950 text-sm">{member.memberName}</p>
                  <p className="text-slate-600">मोबाईल: {member.phone && member.phone !== '0' ? member.phone : 'N/A'}</p>
                  <p className="text-slate-600">पत्ता: {member.village || member.address || 'Wardha'}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[10px] uppercase font-bold text-slate-500">योजना तपशील:</p>
                  <p className="font-bold text-slate-900">{config.description}</p>
                  <p className="text-slate-600">सदस्यता शुल्क: ₹५०/- | दरमहा हप्ता: ₹५००/- (साप्ताहिक ₹१००)</p>
                  <p className="text-slate-600">जमा महिने: <span className="font-bold text-emerald-700">{fin.totalPaidMonths}</span> / ३० महिने</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div className="bg-blue-50 border border-blue-200 p-2.5 rounded-xl text-center">
                  <span className="text-[9px] font-bold text-blue-800 uppercase block">योजना उद्दिष्ट</span>
                  <span className="text-base font-black text-blue-950">₹{fin.schemeTarget.toLocaleString('en-IN')}</span>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl text-center">
                  <span className="text-[9px] font-bold text-emerald-800 uppercase block">आजवर जमा</span>
                  <span className="text-base font-black text-emerald-950">₹{fin.totalPaid.toLocaleString('en-IN')}</span>
                </div>
                <div className="bg-rose-50 border border-rose-200 p-2.5 rounded-xl text-center">
                  <span className="text-[9px] font-bold text-rose-800 uppercase block">शिल्लक बाकी</span>
                  <span className="text-base font-black text-rose-950">₹{fin.balanceDue.toLocaleString('en-IN')}</span>
                </div>
                <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl text-center">
                  <span className="text-[9px] font-bold text-amber-800 uppercase block">मॅच्युरिटी परतावा</span>
                  <span className="text-base font-black text-amber-950">₹{fin.totalMaturityValue.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Receipt History */}
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase mb-2 flex items-center justify-between">
                  <span>हप्ते जमा इतिहास (Installments History)</span>
                  <span className="text-[10px] text-slate-500">{memberReceipts.length} पावत्या</span>
                </h3>
                <table className="w-full border-collapse text-left text-[11px]">
                  <thead>
                    <tr className="bg-slate-100 border-y border-slate-300 text-slate-700">
                      <th className="py-1.5 px-2">पावती क्र.</th>
                      <th className="py-1.5 px-2">दिनांक</th>
                      <th className="py-1.5 px-2">हप्ता क्र.</th>
                      <th className="py-1.5 px-2">माध्यम</th>
                      <th className="py-1.5 px-2">जमा घेणारा</th>
                      <th className="py-1.5 px-2 text-right">रक्कम</th>
                    </tr>
                  </thead>
                  <tbody>
                    {memberReceipts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-3 text-center text-slate-500">
                          प्रारंभिक शिल्लक नोंद: ₹{fin.totalPaid.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ) : (
                      memberReceipts.map((rec) => (
                        <tr key={rec.id} className="border-b border-slate-200">
                          <td className="py-1.5 px-2 font-mono font-bold">{rec.receiptNo}</td>
                          <td className="py-1.5 px-2 text-slate-600">
                            {new Date(rec.date).toLocaleDateString('en-IN')}
                          </td>
                          <td className="py-1.5 px-2">हप्ता #{rec.weekNumber || rec.monthNumber || 1}</td>
                          <td className="py-1.5 px-2">{rec.paymentMode}</td>
                          <td className="py-1.5 px-2 text-slate-600">{rec.collectedBy}</td>
                          <td className="py-1.5 px-2 text-right font-bold font-mono">
                            ₹{rec.amount.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-900 font-bold bg-slate-50">
                      <td colSpan={5} className="py-2 px-2 text-right">एकूण जमा (Total):</td>
                      <td className="py-2 px-2 text-right font-mono text-emerald-700 text-xs">
                        ₹{fin.totalPaid.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
