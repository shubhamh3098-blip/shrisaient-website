import React from 'react';
import { Printer, Share2, X, CheckCircle2, ShieldCheck, CreditCard } from 'lucide-react';
import { BusinessSettings, CardMember, CardTransaction } from '../types';
import { AppLogo } from './AppLogo';

interface CollectionSlipModalProps {
  transaction: CardTransaction;
  member?: CardMember;
  settings: BusinessSettings;
  onClose: () => void;
}

export const CollectionSlipModal: React.FC<CollectionSlipModalProps> = ({
  transaction,
  member,
  settings,
  onClose,
}) => {
  const [recipientPhone, setRecipientPhone] = React.useState<string>(() => {
    return (transaction.customerPhone || member?.phone || '').replace(/[^0-9]/g, '');
  });

  const handlePrint = () => {
    window.print();
  };

  const previousBalance = Math.max(0, (transaction.balanceAfter || 0) - (transaction.amount || 0));

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `*${settings.businessName || 'श्री साई इंटरप्राइजेस, वर्धा'}*\n` +
      `*साप्ताहिक बचत हप्ता पावती / Weekly Collection Slip*\n` +
      `====================================\n` +
      `👤 *ग्राहक / सभासद:* ${transaction.customerName}\n` +
      `💳 *कार्ड नंबर:* #${transaction.cardNumber}\n` +
      `🧾 *पावती क्र. (Receipt No):* ${transaction.receiptNo}\n` +
      `📅 *दिनांक (Date):* ${transaction.date}\n` +
      (transaction.weekNumber ? `🗓️ *हप्ता क्र. (Week No):* हप्ता ${transaction.weekNumber}\n` : '') +
      `------------------------------------\n` +
      `💵 *आज जमा रक्कम (Today Paid):* ₹${transaction.amount.toLocaleString('en-IN')}/-\n` +
      `⏳ *मागील शिल्लक जमा (जुने जमा):* ₹${previousBalance.toLocaleString('en-IN')}/-\n` +
      `💰 *आतापर्यंत एकूण जमा (Total Savings):* ₹${(transaction.balanceAfter || 0).toLocaleString('en-IN')}/-\n` +
      `------------------------------------\n` +
      `💳 *पेमेंट मोड:* ${transaction.paymentMode || 'Cash'}\n` +
      (transaction.agentName ? `👨‍💼 *प्रतिनिधी (Agent):* ${transaction.agentName}\n` : '') +
      `====================================\n` +
      `✅ आपली आजची हप्ता रक्कम सुरक्षितपणे जमा झाली आहे.\n` +
      `🙏 श्री साई इंटरप्राइजेसवर विश्वास ठेवल्याबद्दल मनःपूर्वक धन्यवाद!\n` +
      `📞 संपर्क: ${settings.phone || '8766486915'} / 8600122798\n` +
      `📍 पत्ता: मातोश्री सभागृह समोर, आर्वी रोड, पंजाब कॉलनी, वर्धा`
    );

    const cleanPhone = recipientPhone.replace(/[^0-9]/g, '');
    const url = cleanPhone ? `https://wa.me/91${cleanPhone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto print:p-0 print:m-0 print:static print:bg-white">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 animate-fade-in my-auto print:my-0 print:border-none print:shadow-none print:rounded-none print:max-w-none">
        
        {/* Top Action Bar (no-print) */}
        <div className="no-print bg-slate-900 text-white px-4 sm:px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </span>
            <span className="text-xs font-semibold text-slate-200">
              साप्ताहिक बचत पावती (Collection Slip)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            {recipientPhone ? (
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleShareWhatsApp}
                title="Click to share receipt on WhatsApp"
                className="px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* WhatsApp Fast-Sender Bar (no-print) */}
        <div className="no-print bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <span className="text-[11px] font-bold text-emerald-900 dark:text-emerald-200 whitespace-nowrap">
              📱 WhatsApp No:
            </span>
            <input
              type="tel"
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              placeholder="10 digit mobile..."
              className="px-2.5 py-1 text-xs rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono w-32 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>ग्राहकाला व्हॉट्सॲप पाठवा (Send Slip)</span>
          </button>
        </div>

        {/* Printable Slip Sheet */}
        <div id="printable-receipt" className="p-5 sm:p-6 text-slate-800 bg-white space-y-4 font-sans">
          {/* Header Banner */}
          <div className="bg-[#0B1528] text-white p-4 rounded-xl text-center border-b-2 border-amber-500">
            <div className="flex justify-center mb-1.5">
              <AppLogo size="sm" variant="iconOnly" />
            </div>
            <h3 className="text-xl font-extrabold tracking-wide font-serif">
              श्री साई इंटरप्राइजेस
            </h3>
            <p className="text-[11px] font-medium text-slate-200">
              साप्ताहिक बचत कार्ड योजना • ३०-महिने बचत पासबुक
            </p>
            <p className="text-[10px] text-slate-300 mt-0.5">
              मातोश्री सभागृह समोर, आर्वी रोड, पंजाब कॉलनी, वर्धा
            </p>
            <div className="flex items-center justify-center gap-2 text-[10px] font-mono text-amber-300 mt-1 font-bold">
              <span>📞 8766486915</span>
              <span>•</span>
              <span>8600122798</span>
            </div>
          </div>

          {/* Slip Type Badge & Receipt No */}
          <div className="flex items-center justify-between border-b border-dashed border-slate-300 pb-2.5 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">पावती क्रमांक</span>
              <span className="font-mono font-bold text-slate-900">{transaction.receiptNo}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">तारीख / Date</span>
              <span className="font-mono font-semibold text-slate-800">{transaction.date}</span>
            </div>
          </div>

          {/* Member Details */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">कार्ड नंबर:</span>
              <span className="font-bold text-blue-700 font-mono">#{transaction.cardNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">सभासदाचे नाव:</span>
              <span className="font-bold text-slate-900">{transaction.customerName}</span>
            </div>
            {(transaction.customerPhone || member?.phone) && (
              <div className="flex justify-between">
                <span className="text-slate-500">मोबाईल:</span>
                <span className="font-mono text-slate-800">{transaction.customerPhone || member?.phone}</span>
              </div>
            )}
            {member?.village && (
              <div className="flex justify-between">
                <span className="text-slate-500">गाव (Village):</span>
                <span className="font-semibold text-slate-800">{member.village}</span>
              </div>
            )}
            {member?.sheetNo && (
              <div className="flex justify-between">
                <span className="text-slate-500">शीट नंबर:</span>
                <span className="font-mono text-slate-800">{member.sheetNo}</span>
              </div>
            )}
            {transaction.weekNumber && (
              <div className="flex justify-between">
                <span className="text-slate-500">हप्ता क्र. (Week No):</span>
                <span className="font-bold text-slate-900">हप्ता {transaction.weekNumber}</span>
              </div>
            )}
          </div>

          {/* 3-Box Clear Balance Breakdown: जुने जमा + आज जमा = एकूण जमा */}
          <div className="grid grid-cols-3 gap-2 text-center">
            {/* Box 1: जुने जमा */}
            <div className="bg-amber-50/80 border border-amber-300 rounded-xl p-2 text-amber-950">
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-tight block">
                मागील जमा (जुने)
              </span>
              <div className="text-sm sm:text-base font-black font-mono text-amber-900 mt-0.5">
                ₹{previousBalance.toLocaleString('en-IN')}
              </div>
              <span className="text-[9px] text-amber-700 font-medium block">
                Prev Balance
              </span>
            </div>

            {/* Box 2: आज जमा रक्कम */}
            <div className="bg-emerald-50 border-2 border-emerald-500 rounded-xl p-2 text-emerald-950 shadow-xs">
              <span className="text-[10px] font-black text-emerald-800 uppercase tracking-tight block">
                आज जमा रक्कम
              </span>
              <div className="text-base sm:text-lg font-black font-mono text-emerald-700 mt-0.5">
                ₹{transaction.amount.toLocaleString('en-IN')}
              </div>
              <span className="text-[9px] text-emerald-700 font-bold block">
                Today Received
              </span>
            </div>

            {/* Box 3: एकूण जमा */}
            <div className="bg-blue-50/80 border border-blue-300 rounded-xl p-2 text-blue-950">
              <span className="text-[10px] font-bold text-blue-800 uppercase tracking-tight block">
                एकूण जमा बचत
              </span>
              <div className="text-sm sm:text-base font-black font-mono text-blue-900 mt-0.5">
                ₹{(transaction.balanceAfter || 0).toLocaleString('en-IN')}
              </div>
              <span className="text-[9px] text-blue-700 font-medium block">
                Total Savings
              </span>
            </div>
          </div>

          {/* Payment Mode & Agent Info */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-slate-100 rounded-lg text-[11px] font-medium text-slate-700">
            <span>पेमेंट पद्धत: <strong className="text-slate-900">{transaction.paymentMode || 'Cash'}</strong></span>
            {transaction.agentName && (
              <span>प्रतिनिधी: <strong className="text-slate-900">{transaction.agentName}</strong></span>
            )}
          </div>

          {/* Footer Note and Sign */}
          <div className="pt-3 border-t border-dashed border-slate-300 flex justify-between items-end text-[10px] text-slate-500">
            <div>
              <p>• ३० महिने योजना संपल्यावर हमखास गिफ्ट / होम अप्लायन्सेस</p>
              <p>• ही पावती जपून ठेवावी.</p>
            </div>
            <div className="text-center pt-5">
              <div className="border-t border-slate-400 w-24 pt-0.5">
                <span className="font-bold text-slate-800">अधिकृत स्वाक्षरी</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
