import React, { useState } from 'react';
import {
  Printer,
  X,
  Share2,
  Copy,
  Check,
  Calendar,
  User,
  Phone,
  FileSpreadsheet,
  ArrowDownCircle,
  Receipt,
  FileText
} from 'lucide-react';
import { CardTransaction, StoreSettings } from '../../types';

interface AgentCollectionPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentName: string;
  agentPhone?: string;
  transactions: CardTransaction[];
  commissionRate: number;
  dateRangeLabel: string;
  settings: StoreSettings;
}

export const AgentCollectionPrintModal: React.FC<AgentCollectionPrintModalProps> = ({
  isOpen,
  onClose,
  agentName,
  agentPhone = '',
  transactions,
  commissionRate,
  dateRangeLabel,
  settings,
}) => {
  const [printFormat, setPrintFormat] = useState<'thermal' | 'a4'>('thermal');
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  // Financial calculations
  const totalCardsCount = transactions.length;
  const cashTotal = transactions
    .filter((t) => t.paymentMode === 'Cash' || !t.paymentMode)
    .reduce((sum, t) => sum + t.amount, 0);
  const upiTotal = transactions
    .filter((t) => t.paymentMode === 'UPI' || t.paymentMode === 'Bank Transfer')
    .reduce((sum, t) => sum + t.amount, 0);
  const grossTotal = cashTotal + upiTotal;
  const commissionEarned = Math.round((grossTotal * commissionRate) / 100);
  const netCashHandover = Math.max(0, cashTotal - commissionEarned);

  const slipNumber = `AGN-COL-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${transactions.length}`;
  const printTimestamp = new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // WhatsApp Message Generator
  const generateWhatsAppText = () => {
    let text = `🚩 *${settings.storeName}* 🚩\n`;
    text += `📋 *एजंट दैनिक वसुली पावती (Agent Collection Slip)*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `👤 *एजंट:* ${agentName}${agentPhone ? ` (${agentPhone})` : ''}\n`;
    text += `📅 *कालावधी:* ${dateRangeLabel}\n`;
    text += `🕒 *वेळ:* ${printTimestamp}\n`;
    text += `🧾 *पावती क्र.:* #${slipNumber}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `💳 *एकूण जमा कार्ड्स:* ${totalCardsCount}\n`;
    text += `💵 *रोख वसुली (Cash):* ₹${cashTotal.toLocaleString('en-IN')}\n`;
    text += `📱 *ऑनलाइन वसुली (UPI):* ₹${upiTotal.toLocaleString('en-IN')}\n`;
    text += `💰 *एकूण वसुली (Gross):* ₹${grossTotal.toLocaleString('en-IN')}\n`;
    text += `🎖️ *एजंट कमिशन (${commissionRate}%):* ₹${commissionEarned.toLocaleString('en-IN')}\n`;
    text += `🏦 *काऊंटरला जमा करावयाची रोकड:* ₹${netCashHandover.toLocaleString('en-IN')}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `📝 *हप्ते जमा तपशील (${transactions.length} सभासद):*\n`;

    transactions.slice(0, 30).forEach((t, i) => {
      text += `${i + 1}. #${t.cardNo} - ${t.memberName} (आ. ${t.weekNumber || t.monthNumber || 1}) : ₹${t.amount} [${t.paymentMode || 'Cash'}]\n`;
    });

    if (transactions.length > 30) {
      text += `...आणि इतर ${transactions.length - 30} कार्ड्स.\n`;
    }

    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `📍 *पत्ता:* ${settings.address}, ${settings.city}\n`;
    text += `📞 *काऊंटर संपर्क:* ${settings.phone}\n`;
    text += `✅ *काऊंटर कॅश पडताळणी: अधिकृत जमा*`;

    return text;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateWhatsAppText());
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(generateWhatsAppText());
    const phone = agentPhone ? agentPhone.replace(/[^0-9]/g, '') : '';
    const url = phone ? `https://wa.me/91${phone.slice(-10)}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh] text-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* MODAL HEADER (No-Print) */}
        <div className="px-4 py-3 bg-slate-800 border-b border-slate-700 flex flex-wrap items-center justify-between gap-2 text-xs no-print">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-white text-sm">
              एजंट वसुली पावती व हिशोब पत्रक (Agent Collection Print)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Format Toggle */}
            <div className="bg-slate-950 p-0.5 rounded-lg border border-slate-700 flex text-xs">
              <button
                type="button"
                onClick={() => setPrintFormat('thermal')}
                className={`px-2.5 py-1 rounded font-bold cursor-pointer transition ${
                  printFormat === 'thermal'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="काऊंटर थर्मल प्रिंटर (80mm Slip)"
              >
                🧾 80mm थर्मल स्लिप
              </button>
              <button
                type="button"
                onClick={() => setPrintFormat('a4')}
                className={`px-2.5 py-1 rounded font-bold cursor-pointer transition ${
                  printFormat === 'a4'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="ऑफिस A4 पत्रक (A4 Sheet)"
              >
                📄 A4 पूर्ण पत्रक
              </button>
            </div>

            {/* Print Action */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>प्रिंट करा</span>
            </button>

            {/* WhatsApp Share */}
            <button
              type="button"
              onClick={handleWhatsApp}
              className="px-2.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5"
              title="एजंट किंवा दुकान मालकाला WhatsApp वर पाठवा"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            {/* Copy */}
            <button
              type="button"
              onClick={handleCopy}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg cursor-pointer transition"
              title="मजकूर कॉपी करा"
            >
              {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PRINTABLE PREVIEW CONTAINER */}
        <div className="p-4 sm:p-6 overflow-y-auto bg-slate-950/70 flex justify-center items-start">
          
          {/* 1. THERMAL 80MM SLIP FORMAT */}
          {printFormat === 'thermal' ? (
            <div
              id="printable-agent-collection-slip"
              className="w-full max-w-[340px] bg-white text-slate-900 p-4 rounded-xl border border-slate-300 shadow-2xl font-mono text-[11px] leading-tight space-y-2.5"
            >
              {/* Showroom Header */}
              <div className="text-center border-b-2 border-dashed border-slate-800 pb-2">
                <h1 className="text-base font-black tracking-wider uppercase">
                  {settings.storeName || 'श्री साई इंटरप्रायजेस, वर्धा'}
                </h1>
                <p className="text-[10px] font-semibold mt-0.5">
                  {settings.tagline || 'Electronics, Furniture & 30-Month Scheme'}
                </p>
                <p className="text-[9px] text-slate-700 mt-0.5">
                  {settings.address}, {settings.city}
                </p>
                <p className="text-[9px] font-bold text-slate-800 mt-0.5">
                  फोन: {settings.phone} / 8766486915
                </p>
                <div className="mt-1.5 py-0.5 px-2 bg-slate-100 border border-slate-300 rounded text-[10px] font-black tracking-wide uppercase inline-block">
                  ★ एजंट दैनिक वसुली जमा पावती ★
                </div>
              </div>

              {/* Meta details */}
              <div className="space-y-0.5 text-[10px] border-b border-dashed border-slate-300 pb-2">
                <div className="flex justify-between">
                  <span className="text-slate-600">पावती क्र. (Slip):</span>
                  <span className="font-bold">#{slipNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">एजंट नाव (Agent):</span>
                  <span className="font-black text-xs uppercase">{agentName}</span>
                </div>
                {agentPhone && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">मोबाईल (Phone):</span>
                    <span className="font-bold">{agentPhone}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-600">कालावधी (Period):</span>
                  <span className="font-bold text-emerald-800">{dateRangeLabel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">प्रिंट वेळ (Date):</span>
                  <span>{printTimestamp}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-1 border-b border-dashed border-slate-300 pb-2">
                <div className="text-[9px] font-black uppercase text-slate-600 flex justify-between pb-1 border-b border-slate-200">
                  <span>कार्ड | सभासद</span>
                  <span>आठवडा | रक्कम</span>
                </div>

                {transactions.length === 0 ? (
                  <div className="py-2 text-center text-slate-400 italic">कोणतेही कलेक्शन आढळले नाही</div>
                ) : (
                  transactions.map((t, idx) => (
                    <div key={t.id || idx} className="flex justify-between items-start text-[10px] py-0.5 border-b border-slate-100">
                      <div className="max-w-[190px] truncate">
                        <span className="font-bold text-slate-950">#{t.cardNo}</span>{' '}
                        <span className="text-slate-800">{t.memberName}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[9px] text-slate-500 mr-1">आ.{t.weekNumber || t.monthNumber || 1}</span>
                        <span className="font-bold text-slate-950">₹{t.amount}</span>
                        <span className="text-[8px] text-slate-500 block">({t.paymentMode || 'Cash'})</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Financial Calculation Box */}
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 space-y-1 text-[10px]">
                <div className="flex justify-between">
                  <span className="text-slate-600">एकूण जमा कार्ड्स:</span>
                  <span className="font-bold">{totalCardsCount} सभासद</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">रोख वसुली (Cash):</span>
                  <span className="font-bold">₹{cashTotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">ऑनलाइन (UPI / Bank):</span>
                  <span className="font-bold">₹{upiTotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-xs font-black pt-1 border-t border-slate-300">
                  <span>एकूण वसुली (Gross):</span>
                  <span>₹{grossTotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-emerald-800 font-bold pt-0.5">
                  <span>वजा: एजंट कमिशन ({commissionRate}%):</span>
                  <span>-₹{commissionEarned.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-xs font-black text-slate-950 pt-1 border-t-2 border-slate-900 bg-amber-100 p-1.5 rounded">
                  <span>काऊंटर निव्वळ रोकड जमा:</span>
                  <span className="text-sm font-extrabold text-amber-900">
                    ₹{netCashHandover.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-4 flex justify-between items-end text-[9px] text-slate-600">
                <div className="text-center">
                  <div className="w-20 border-b border-slate-400 mb-1"></div>
                  <span>एजंट सही</span>
                </div>
                <div className="text-center">
                  <div className="w-24 border-b border-slate-400 mb-1"></div>
                  <span className="font-bold text-slate-900">कॅशियर / मालक सही</span>
                </div>
              </div>

              <div className="text-center text-[8px] text-slate-400 pt-1">
                श्री साई इंटरप्रायजेस • कॉम्प्युटर जनरेटेड अधिकृत हिशोब स्लिप
              </div>
            </div>
          ) : (
            /* 2. FULL A4 OFFICIAL STATEMENT FORMAT */
            <div
              id="printable-agent-collection-sheet"
              className="w-full bg-white text-slate-900 p-6 sm:p-8 rounded-xl border border-slate-300 shadow-2xl font-sans text-xs space-y-4"
            >
              {/* Header */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
                <div>
                  <h1 className="text-2xl font-black uppercase tracking-wider text-slate-950">
                    {settings.storeName || 'श्री साई इंटरप्रायजेस'}
                  </h1>
                  <p className="text-xs font-semibold text-slate-700 mt-0.5">
                    {settings.tagline || 'Electronics, Furniture Showroom & 30-Month Weekly Savings Scheme'}
                  </p>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    पत्ता: {settings.address}, {settings.city} | फोन: {settings.phone} / 8766486915
                  </p>
                  {settings.gstin && (
                    <p className="text-[11px] font-bold text-slate-700">GSTIN: {settings.gstin}</p>
                  )}
                </div>

                <div className="text-right">
                  <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 font-extrabold px-3 py-1 rounded text-xs uppercase tracking-wider inline-block">
                    एजंट कलेक्शन हिशोब पत्रक (OFFICIAL)
                  </div>
                  <div className="text-[11px] text-slate-500 mt-2">
                    पावती क्र.: <strong className="text-slate-900">#{slipNumber}</strong>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    तारीख: <strong>{printTimestamp}</strong>
                  </div>
                </div>
              </div>

              {/* Agent & Period Summary Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">प्रतिनिधी नाव (Agent)</span>
                  <span className="font-extrabold text-slate-950 text-sm">{agentName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">मोबाईल क्रमांक</span>
                  <span className="font-semibold text-slate-800">{agentPhone || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">कलेक्शन कालावधी</span>
                  <span className="font-bold text-emerald-700">{dateRangeLabel}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">कमिशन दर (Rate)</span>
                  <span className="font-bold text-indigo-700">{commissionRate}% Commission</span>
                </div>
              </div>

              {/* 4 Big Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-center">
                  <div className="text-[10px] uppercase font-bold text-blue-800">एकूण जमा कार्ड्स</div>
                  <div className="text-xl font-black text-blue-950 mt-0.5">{totalCardsCount}</div>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                  <div className="text-[10px] uppercase font-bold text-emerald-800">एकूण वसुली (Gross)</div>
                  <div className="text-xl font-black text-emerald-950 mt-0.5">₹{grossTotal.toLocaleString('en-IN')}</div>
                </div>
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-center">
                  <div className="text-[10px] uppercase font-bold text-purple-800">एजंट कमिशन ({commissionRate}%)</div>
                  <div className="text-xl font-black text-purple-950 mt-0.5">₹{commissionEarned.toLocaleString('en-IN')}</div>
                </div>
                <div className="p-3 bg-amber-50 border-2 border-amber-400 rounded-xl text-center">
                  <div className="text-[10px] uppercase font-bold text-amber-900">काऊंटर निव्वळ कॅश जमा</div>
                  <div className="text-xl font-black text-amber-950 mt-0.5">₹{netCashHandover.toLocaleString('en-IN')}</div>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">अ.क्र.</th>
                      <th className="py-2 px-3">पावती क्र.</th>
                      <th className="py-2 px-3">कार्ड क्र.</th>
                      <th className="py-2 px-3">सभासदाचे नाव</th>
                      <th className="py-2 px-3 text-center">आठवडा</th>
                      <th className="py-2 px-3 text-center">पेमेंट मोड</th>
                      <th className="py-2 px-3 text-right">जमा रक्कम</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-4 text-center text-slate-400 italic">
                          निवडलेल्या कालावधीत कोणतेही कलेक्शन आढळले नाही.
                        </td>
                      </tr>
                    ) : (
                      transactions.map((t, i) => (
                        <tr key={t.id || i} className="hover:bg-slate-50">
                          <td className="py-1.5 px-3 text-slate-400">{i + 1}</td>
                          <td className="py-1.5 px-3 font-semibold text-slate-700">#{t.receiptNo || t.id.slice(0, 6)}</td>
                          <td className="py-1.5 px-3 font-bold text-slate-950">#{t.cardNo}</td>
                          <td className="py-1.5 px-3 font-semibold text-slate-800">{t.memberName}</td>
                          <td className="py-1.5 px-3 text-center font-bold text-slate-600">#{t.weekNumber || t.monthNumber || 1}</td>
                          <td className="py-1.5 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              t.paymentMode === 'UPI' ? 'bg-sky-100 text-sky-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {t.paymentMode || 'Cash'}
                            </span>
                          </td>
                          <td className="py-1.5 px-3 text-right font-extrabold text-slate-950">
                            ₹{t.amount.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot className="bg-slate-50 border-t-2 border-slate-300 font-bold">
                    <tr>
                      <td colSpan={6} className="py-2 px-3 text-right text-slate-800">
                        एकूण एकूण वसुली (Gross Collection Total):
                      </td>
                      <td className="py-2 px-3 text-right text-emerald-700 font-extrabold text-sm">
                        ₹{grossTotal.toLocaleString('en-IN')}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={6} className="py-1.5 px-3 text-right text-slate-600 text-[10px]">
                        वजा: प्रतिनिधी कमिशन ({commissionRate}%):
                      </td>
                      <td className="py-1.5 px-3 text-right text-indigo-700 font-bold">
                        -₹{commissionEarned.toLocaleString('en-IN')}
                      </td>
                    </tr>
                    <tr className="bg-amber-100/80 text-amber-950">
                      <td colSpan={6} className="py-2.5 px-3 text-right font-black text-xs">
                        काऊंटरवर प्रत्यक्ष जमा झालेली निव्वळ रोकड रक्कम (Net Cash Deposited):
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-base text-amber-950">
                        ₹{netCashHandover.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Declarations & Signatures */}
              <div className="pt-6 grid grid-cols-2 gap-8 text-xs text-slate-600 border-t border-slate-200">
                <div>
                  <p className="font-semibold text-slate-800 mb-6">
                    मी वरीलप्रमाणे सर्व हप्ते प्रत्यक्ष सभासदांकडून गोळा केले असून निव्वळ रोकड काऊंटरवर सुपूर्द केली आहे.
                  </p>
                  <div className="w-40 border-b-2 border-slate-400 mb-1"></div>
                  <span className="font-bold text-slate-900 block">एजंट / प्रतिनिधी स्वाक्षरी</span>
                  <span className="text-[10px] text-slate-500">({agentName})</span>
                </div>

                <div className="text-right flex flex-col items-end">
                  <p className="font-semibold text-slate-800 mb-6 text-right">
                    वरील सर्व रोकड व UPI नोंदी तपासून काऊंटर गल्ल्यात जमा करून घेण्यात आल्या आहेत.
                  </p>
                  <div className="w-48 border-b-2 border-slate-400 mb-1"></div>
                  <span className="font-bold text-slate-900 block">
                    काऊंटर व्यवस्थापक / कॅशियर स्वाक्षरी
                  </span>
                  <span className="text-[10px] text-slate-500">({settings.storeName})</span>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
