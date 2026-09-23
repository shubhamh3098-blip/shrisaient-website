import React, { useState } from 'react';
import { Printer, Share2, X, CheckCircle2, Receipt, Banknote, Smartphone, Building2, User, Phone, MapPin, Calendar, FileText } from 'lucide-react';
import { BusinessSettings, BillReceiptEntry } from '../types';
import { AppLogo } from './AppLogo';
import { getSafeWhatsAppUrl } from '../utils/numbering';

interface AgainstBillReceiptModalProps {
  receipt: BillReceiptEntry | null;
  onClose: () => void;
  settings: BusinessSettings;
}

// Convert number to Indian words (Simple Marathi / English helper)
function numberToWordsMarathi(num: number): string {
  if (!num || isNaN(num)) return 'शून्य';
  if (num === 0) return 'शून्य रुपये';
  return `${num.toLocaleString('en-IN')} रुपये फक्त`;
}

export const AgainstBillReceiptModal: React.FC<AgainstBillReceiptModalProps> = ({
  receipt,
  onClose,
  settings,
}) => {
  const [printFormat, setPrintFormat] = useState<'voucher' | 'thermal'>('voucher');

  if (!receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `*${settings.businessName}*\n` +
      `*अधिकृत जमा पावती (MONEY RECEIPT)*\n` +
      `--------------------------------\n` +
      `🧾 *पावती क्र. (Receipt No):* ${receipt.receiptNo}\n` +
      `📅 *दिनांक (Date):* ${receipt.date}\n` +
      (receipt.againstInvoiceNo ? `📄 *संदर्भ बिल क्र. (Against Bill):* ${receipt.againstInvoiceNo}\n` : '') +
      `👤 *ग्राहक (Customer):* ${receipt.customerName}\n` +
      (receipt.customerPhone ? `📞 *संपर्क:* ${receipt.customerPhone}\n` : '') +
      (receipt.customerVillage ? `📍 *गाव / पत्ता:* ${receipt.customerVillage}\n` : '') +
      `--------------------------------\n` +
      `💵 *आज जमा रक्कम (Received):* ₹${receipt.amountPaid.toLocaleString('en-IN')} (${receipt.paymentMode})\n` +
      `📊 *आधीची बाकी (Previous Due):* ₹${receipt.previousBalance.toLocaleString('en-IN')}\n` +
      `⏳ *उर्वरित बाकी (Remaining Due):* ₹${receipt.remainingBalance.toLocaleString('en-IN')}\n` +
      (receipt.agentName ? `👨‍💼 *जमा करून घेणारे:* ${receipt.agentName}\n` : '') +
      (receipt.notes ? `📝 *शेरा:* ${receipt.notes}\n` : '') +
      `--------------------------------\n` +
      `पत्ता: ${settings.address}\n` +
      `संपर्क: ${settings.phone} / ${settings.whatsappSecondaryNumber || '8600122798'}\n` +
      `धन्यवाद! श्री साई इंटरप्राइजेस, वर्धा`
    );

    const url = getSafeWhatsAppUrl(receipt.customerPhone, text);
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto">
        
        {/* Top Action Bar (Hidden on print) */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
              <Receipt className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                बिलाविरोधात जमा पावती (Against Bill Receipt #{receipt.receiptNo})
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                पार्ट पेमेंट व उधारी हिशोब पावती • प्रिंट किंवा व्हॉट्सॲप करा
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Format toggle: standard voucher vs thermal slip */}
            <div className="hidden sm:inline-flex rounded-lg bg-slate-200/80 dark:bg-slate-700 p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setPrintFormat('voucher')}
                className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                  printFormat === 'voucher'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                A4/A5 व्हाउचर
              </button>
              <button
                type="button"
                onClick={() => setPrintFormat('thermal')}
                className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                  printFormat === 'thermal'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                ८०mm थर्मल पावती
              </button>
            </div>

            <button
              onClick={handlePrint}
              id="btn-print-against-bill-receipt"
              className="px-3.5 py-2 rounded-xl bg-[#00523f] hover:bg-[#004232] text-white font-bold text-xs shadow-md shadow-[#00523f]/20 flex items-center gap-1.5 transition cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4" />
              पावती प्रिंट करा
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition cursor-pointer active:scale-95"
            >
              <Share2 className="w-4 h-4" />
              WhatsApp
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div id="printable-against-bill-receipt" className="p-6 sm:p-8 bg-white text-slate-900">
          
          {/* Header */}
          <div className="border-b-2 border-emerald-800 pb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <AppLogo className="w-12 h-12 rounded-xl shadow-xs shrink-0" />
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-emerald-900 tracking-tight leading-tight">
                    {settings.businessName}
                  </h1>
                  <p className="text-xs font-bold text-slate-700">
                    {settings.businessNameHindi || 'श्री साई इंटरप्राइजेस'} • इलेक्ट्रॉनिक्स, फर्निचर व गृहोपयोगी वस्तू
                  </p>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    {settings.address}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="inline-block px-3 py-1 rounded-md bg-emerald-800 text-white text-xs font-black uppercase tracking-wider">
                  जमा पावती (RECEIPT)
                </div>
                <p className="text-[10px] text-slate-500 font-mono mt-1">
                  GSTIN: {settings.gstin}
                </p>
                <p className="text-[11px] font-bold text-slate-800 mt-0.5">
                  मो: {settings.phone}, {settings.whatsappSecondaryNumber || '8600122798'}
                </p>
              </div>
            </div>
          </div>

          {/* Receipt Info Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 py-3 border-b border-slate-200 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-bold">पावती क्रमांक (Receipt No)</span>
              <span className="font-mono font-black text-base text-emerald-800">
                #{receipt.receiptNo}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-bold">दिनांक (Date)</span>
              <span className="font-bold text-slate-800">{receipt.date}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-bold">संदर्भ बिल क्र. (Against Bill)</span>
              <span className="font-mono font-bold text-slate-800">
                {receipt.againstInvoiceNo || 'उधारी खाते / Khata'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-bold">पेमेंट पद्धत (Mode)</span>
              <span className="inline-flex items-center gap-1 font-bold text-slate-800">
                {receipt.paymentMode === 'Cash' ? '💵 रोख (Cash)' : '📲 ऑनलाईन (UPI)'}
              </span>
            </div>
          </div>

          {/* Customer Details Box */}
          <div className="bg-slate-50 rounded-xl p-3.5 my-4 border border-slate-200 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <span className="text-[10px] text-slate-500 block font-semibold">ग्राहकाचे नाव (Customer Name):</span>
                <span className="font-bold text-slate-900 text-sm">{receipt.customerName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block font-semibold">मोबाईल नंबर (Phone):</span>
                <span className="font-mono font-bold text-slate-800">{receipt.customerPhone || '—'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block font-semibold">गाव / पत्ता (Village / Address):</span>
                <span className="font-semibold text-slate-800">{receipt.customerVillage || 'वर्धा शहर / परिसर'}</span>
              </div>
            </div>
          </div>

          {/* Financial Calculation Table */}
          <div className="rounded-xl border border-slate-300 overflow-hidden my-4">
            <table className="w-full text-left text-xs">
              <thead className="bg-emerald-800 text-white font-bold">
                <tr>
                  <th className="py-2.5 px-3.5">तपशील (Particulars)</th>
                  <th className="py-2.5 px-3.5 text-right">रक्कम (Amount ₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="py-2.5 px-3.5 font-medium text-slate-700">
                    बिलाची आधीची शिल्लक बाकी (Previous Balance Due)
                  </td>
                  <td className="py-2.5 px-3.5 text-right font-mono font-bold text-slate-800 text-sm">
                    ₹{receipt.previousBalance.toLocaleString('en-IN')}
                  </td>
                </tr>

                <tr className="bg-emerald-50/70">
                  <td className="py-3 px-3.5 font-bold text-emerald-900">
                    <div>
                      <span>आज प्रत्यक्ष जमा रक्कम (Amount Received Now)</span>
                      <p className="text-[10px] text-emerald-700 font-normal mt-0.5">
                        ({numberToWordsMarathi(receipt.amountPaid)})
                      </p>
                    </div>
                  </td>
                  <td className="py-3 px-3.5 text-right font-mono font-black text-emerald-800 text-lg">
                    ₹{receipt.amountPaid.toLocaleString('en-IN')}
                  </td>
                </tr>

                <tr className="bg-slate-50">
                  <td className="py-2.5 px-3.5 font-bold text-slate-900">
                    उर्वरित शिल्लक बाकी (Remaining Balance Due)
                  </td>
                  <td className="py-2.5 px-3.5 text-right font-mono font-bold text-slate-900 text-sm">
                    {receipt.remainingBalance > 0 ? (
                      <span className="text-amber-700">₹{receipt.remainingBalance.toLocaleString('en-IN')}</span>
                    ) : (
                      <span className="text-emerald-700 font-black">₹0 (पूर्ण भरणा / Cleared)</span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Notes & Staff info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs py-2 text-slate-600">
            <div>
              {receipt.agentName && (
                <p>
                  <span className="font-bold text-slate-700">जमा करून घेणारे (Agent / Staff):</span> {receipt.agentName}
                </p>
              )}
              {receipt.notes && (
                <p className="text-[11px] text-slate-500 mt-0.5">
                  <span className="font-bold">शेरा / शेरा:</span> {receipt.notes}
                </p>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-[11px]">
              <CheckCircle2 className="w-4 h-4" />
              <span>संगणकीय अधिकृत पावती (Official Computerized Voucher)</span>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-10 mt-4 border-t border-dashed border-slate-300 text-xs">
            <div className="text-center">
              <div className="h-10"></div>
              <p className="border-t border-slate-400 pt-1 font-semibold text-slate-700">
                ग्राहकाची सही (Customer's Signature)
              </p>
            </div>
            <div className="text-center">
              <div className="h-10 flex items-center justify-center">
                <span className="text-[10px] text-slate-400 font-mono italic">श्री साई इंटरप्राइजेस, वर्धा</span>
              </div>
              <p className="border-t border-slate-400 pt-1 font-bold text-slate-900">
                अधिकृत सही व शिक्का (Authorized Signatory)
              </p>
            </div>
          </div>

          {/* Terms Footer */}
          <div className="mt-6 pt-3 border-t border-slate-200 text-[10px] text-slate-500 text-center space-y-0.5">
            <p>कृपया ही मूळ पावती जतन करून ठेवावी • चेक अथवा ऑनलाईन ट्रान्सफर जमा झाल्यावर पावती ग्राह्य धरली जाईल.</p>
            <p>श्री साई इंटरप्राइजेस • वर्धा • संपर्क: 8766486915 / 8600122798</p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-semibold cursor-pointer"
          >
            बंद करा (Close)
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Share2 className="w-4 h-4" />
              WhatsApp वर पावती पाठवा
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-[#00523f] hover:bg-[#004232] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4" />
              पावती प्रिंट करा (Print)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
