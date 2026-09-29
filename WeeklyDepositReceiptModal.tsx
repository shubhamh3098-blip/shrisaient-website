import React, { useState, useEffect } from 'react';
import {
  Printer,
  X,
  Share2,
  Camera,
  Download,
  Copy,
  Check,
  CheckCircle2,
  RefreshCw,
  QrCode,
  Smartphone,
  FileText,
  ExternalLink
} from 'lucide-react';
import { CardMember, CardTransaction, StoreSettings } from '../../types';
import {
  generateThermalReceiptDataUrl,
  generateThermalReceiptBlob,
  printThermalReceiptViaIframe,
  shareThermalReceiptOnWhatsApp
} from '../../services/receiptImageService';
import { NotificationService } from '../../services/notificationService';
import { getLivePassbookUrl } from '../../utils/passbookUtils';

interface WeeklyDepositReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  tx: CardTransaction | null;
  member: CardMember | null;
  settings?: StoreSettings;
  defaultFormat?: '80mm' | '58mm';
}

export const WeeklyDepositReceiptModal: React.FC<WeeklyDepositReceiptModalProps> = ({
  isOpen,
  onClose,
  tx,
  member,
  settings,
  defaultFormat = '80mm',
}) => {
  const [format, setFormat] = useState<'80mm' | '58mm'>(defaultFormat);
  const [activeTab, setActiveTab] = useState<'photo' | 'slip'>('photo');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [isLoadingPhoto, setIsLoadingPhoto] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (defaultFormat) {
      setFormat(defaultFormat);
    }
  }, [defaultFormat]);

  // Generate high-definition PNG preview whenever tx, member, or format changes
  useEffect(() => {
    if (!isOpen || !tx || !member) return;

    let isMounted = true;
    setIsLoadingPhoto(true);

    generateThermalReceiptDataUrl(tx, member, settings, format)
      .then((url) => {
        if (isMounted) {
          setPhotoDataUrl(url);
          setIsLoadingPhoto(false);
        }
      })
      .catch((err) => {
        console.error('Error generating thermal receipt preview:', err);
        if (isMounted) {
          setIsLoadingPhoto(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, tx?.id, member?.id, format, settings]);

  if (!isOpen || !tx || !member) return null;

  const todayPaid = tx.amount || 0;
  const totalSavings = member.totalAmountPaid || todayPaid;
  const prevBal = Math.max(0, totalSavings - todayPaid);
  const targetVal = member.targetAmount || (member.planType === '15000_scheme' ? 15000 : 30000);
  const remBal = Math.max(0, targetVal - totalSavings);
  const cleanCardNo = member.cardNo.replace(/\D/g, '') || member.cardNo;
  const dateFormatted = new Date(tx.date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const timeFormatted = new Date(tx.date).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const passbookUrl = getLivePassbookUrl(cleanCardNo);

  // 1-Click Print (Popup-Blocker Safe)
  const handlePrint = () => {
    try {
      printThermalReceiptViaIframe(tx, member, settings, format);
      NotificationService.success(`${format} पावती प्रिंट कमांड पाठवली.`);
    } catch (e) {
      console.error('Print error:', e);
      window.print();
    }
  };

  // WhatsApp PNG Photo Share
  const handleSharePhoto = async () => {
    setIsSharing(true);
    try {
      const res = await shareThermalReceiptOnWhatsApp(tx, member, settings, format);
      NotificationService.success(res.message);
    } catch (e) {
      console.error('Share photo error:', e);
      NotificationService.error('फोटो शेअर करताना अडचण आली.');
    } finally {
      setIsSharing(false);
    }
  };

  // Download PNG file directly
  const handleDownloadPng = async () => {
    try {
      const blob = await generateThermalReceiptBlob(tx, member, settings, format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ShriSai_Receipt_${tx.receiptNo || cleanCardNo}_${format}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      NotificationService.success(`${format} पावती PNG फोटो डाऊनलोड झाला!`);
    } catch (e) {
      console.error('Download error:', e);
      NotificationService.error('फोटो डाऊनलोड अयशस्वी.');
    }
  };

  // WhatsApp Text Message
  const handleSendWhatsAppText = () => {
    const cleanPhone = (member.phone || '').replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone === '0000000000') {
      NotificationService.error('ग्राहकाचा मोबाईल नंबर उपलब्ध नाही.');
      return;
    }

    const text = `*श्री साई एंटरप्रायझेस, वर्धा*
(साप्ताहिक बचत योजना पावती - ${format} POS)
------------------------------------
🧾 *पावती क्र:* #${tx.receiptNo}
📅 *तारीख:* ${dateFormatted} (${timeFormatted})
💳 *कार्ड क्र:* #${cleanCardNo} (${member.schemeName || 'योजना १'})
👤 *ग्राहक:* ${member.memberName}
📍 *गाव:* ${member.village || 'वर्धा'}
🔢 *हप्ता क्र:* #${tx.weekNumber || tx.monthNumber}
------------------------------------
💰 *१. जुनी रक्कम (मागील जमा):* ₹${prevBal.toLocaleString('en-IN')}/-
💵 *२. आज जमा हप्ता (Today Paid):* ₹${todayPaid.toLocaleString('en-IN')}/-
💎 *३. आतापर्यंत एकूण जमा:* ₹${totalSavings.toLocaleString('en-IN')}/-
🎯 *४. कार्ड योजना एकूण उद्दिष्ट:* ₹${targetVal.toLocaleString('en-IN')}/-
📉 *५. कार्ड चालू शिल्लक बाकी:* ₹${remBal.toLocaleString('en-IN')}/-
✅ *हिशोब पडताळणी: ₹${totalSavings} + ₹${remBal} = ₹${targetVal} (१००% अचूक)*
------------------------------------
🌐 *लाईव्ह डिजिटल पासबुक लिंक:* ${passbookUrl}
👨‍💼 *प्रतिनिधी:* ${tx.collectedBy || 'Staff'}
🙏 *श्री साई एंटरप्रायझेसवर विश्वास ठेवल्याबद्दल मनःपूर्वक धन्यवाद!*`;

    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?phone=91${cleanPhone}&text=${encoded}`, '_blank');
  };

  // Copy text to clipboard
  const handleCopyText = () => {
    const text = `श्री साई एंटरप्रायझेस हप्ता पावती #${tx.receiptNo}
कार्ड #${cleanCardNo} - ${member.memberName} (${member.village || 'वर्धा'})
हप्ता क्र: #${tx.weekNumber || tx.monthNumber}
मागील जमा: ₹${prevBal}
आज जमा हप्ता: ₹${todayPaid}
एकूण जमा: ₹${totalSavings} / ${targetVal}
शिल्लक बाकी: ₹${remBal}
पासबुक: ${passbookUrl}`;

    navigator.clipboard.writeText(text);
    setIsCopied(true);
    NotificationService.success('पावती तपशील कॉपी केला!');
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-end sm:justify-center p-0 sm:p-4 overflow-hidden animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[95vh] sm:max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-800 bg-slate-950 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-1.5 text-amber-400 font-extrabold text-sm sm:text-base">
              <Camera className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>पावती फोटो (58/80mm) व प्रिंट</span>
            </div>
            <p className="text-[11px] text-slate-400">
              कार्ड #{cleanCardNo} • {member.memberName} (पावती #{tx.receiptNo})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Selector Bar: 80mm vs 58mm */}
        <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 flex-1">
            <button
              type="button"
              onClick={() => setFormat('80mm')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
                format === '80mm'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>80mm (3-इंच)</span>
            </button>
            <button
              type="button"
              onClick={() => setFormat('58mm')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
                format === '58mm'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>58mm (2-इंच Mini)</span>
            </button>
          </div>

          {/* View Tab Toggle: Photo vs Paper Slip */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('photo')}
              className={`py-1.5 px-2.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                activeTab === 'photo'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="WhatsApp PNG Photo"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>PNG फोटो</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('slip')}
              className={`py-1.5 px-2.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                activeTab === 'slip'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="थर्मल स्लिप व्ह्यू"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>स्लिप</span>
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 overscroll-contain bg-slate-950/60 flex flex-col items-center">
          {activeTab === 'photo' ? (
            /* High-Res WhatsApp PNG Photo Preview */
            <div className="w-full flex flex-col items-center space-y-2.5 animate-in fade-in duration-150">
              <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>व्हॉट्सॲपवर पाठवला जाणारा अचूक {format} PNG फोटो:</span>
              </div>

              {isLoadingPhoto ? (
                <div className="w-full h-80 rounded-2xl border border-slate-800 bg-slate-900/60 flex flex-col items-center justify-center gap-3">
                  <RefreshCw className="w-6 h-6 text-amber-400 animate-spin" />
                  <span className="text-xs font-semibold text-slate-300">
                    {format} HD पावती फोटो तयार होत आहे...
                  </span>
                </div>
              ) : photoDataUrl ? (
                <div className="relative group max-w-full rounded-2xl overflow-hidden border-2 border-slate-700/80 shadow-2xl bg-white">
                  <img
                    src={photoDataUrl}
                    alt={`Shri Sai Receipt ${format}`}
                    className="max-h-[58vh] sm:max-h-[52vh] w-auto mx-auto object-contain block"
                  />
                  <div className="absolute top-2 right-2 bg-black/75 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-mono font-bold text-amber-300 border border-amber-400/40">
                    {format} PNG
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-rose-400">
                  फोटो लोड करताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा.
                </div>
              )}
            </div>
          ) : (
            /* Interactive Visual Thermal Paper Slip */
            <div
              className={`bg-white text-slate-950 p-4 rounded-2xl border border-slate-300 shadow-2xl font-mono text-xs leading-relaxed space-y-2 select-text ${
                format === '80mm' ? 'w-full max-w-[340px]' : 'w-full max-w-[290px] text-[11px]'
              }`}
            >
              <div className="text-center border-b border-dashed border-slate-400 pb-2">
                <div className="font-black text-sm uppercase tracking-wide text-slate-950 font-sans">
                  {settings?.storeName || 'SHRI SAI ENTERPRISES'}
                </div>
                <div className="text-[10px] font-bold text-slate-700">
                  श्री साई एंटरप्रायझेस (इलेक्ट्रॉनिक्स & फर्निचर)
                </div>
                <div className="text-[9px] text-slate-600">
                  मातोश्री सभागृह समोर, आर्वी रोड, वर्धा • 📞 8600122978
                </div>
                <div className="mt-1 font-bold text-[10px] bg-slate-100 py-0.5 rounded border border-slate-300">
                  साप्ताहिक बचत योजना पावती ({format} POS)
                </div>
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-600">पावती क्र:</span>
                  <span className="font-black text-slate-950">#{tx.receiptNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">दिनांक:</span>
                  <span>{dateFormatted} {timeFormatted}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">कार्ड क्र:</span>
                  <span className="font-extrabold text-slate-950">#{cleanCardNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">ग्राहक:</span>
                  <span className="font-bold text-slate-950">{member.memberName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">गाव / पत्ता:</span>
                  <span>{member.village || 'वर्धा'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">हप्ता क्र:</span>
                  <span className="font-bold">#{tx.weekNumber || tx.monthNumber}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-slate-400 pt-2 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>१. मागील जुनी जमा:</span>
                  <span className="font-bold">₹{prevBal.toLocaleString('en-IN')}/-</span>
                </div>
                <div className="flex justify-between text-emerald-800 font-extrabold text-xs bg-emerald-50 px-1 py-0.5 rounded">
                  <span>२. आज जमा हप्ता:</span>
                  <span>₹{todayPaid.toLocaleString('en-IN')}/-</span>
                </div>
                <div className="text-center font-black text-base py-1 bg-slate-900 text-white rounded">
                  ₹{todayPaid.toLocaleString('en-IN')}/- जमा
                </div>
                <div className="flex justify-between">
                  <span>३. आतापर्यंत एकूण जमा:</span>
                  <span className="font-extrabold">₹{totalSavings.toLocaleString('en-IN')}/-</span>
                </div>
                <div className="flex justify-between">
                  <span>४. योजना उद्दिष्ट:</span>
                  <span>₹{targetVal.toLocaleString('en-IN')}/-</span>
                </div>
                <div className="flex justify-between font-bold text-rose-700">
                  <span>५. शिल्लक बाकी:</span>
                  <span className="underline">₹{remBal.toLocaleString('en-IN')}/-</span>
                </div>
              </div>

              <div className="border-t border-dashed border-slate-300 pt-1.5 text-center text-[10px] text-slate-700 bg-slate-50 p-1.5 rounded">
                हिशोब ताळमेळ: ₹{totalSavings} + ₹{remBal} = ₹{targetVal} (१००% अचूक)
              </div>

              <div className="flex justify-between text-[10px] text-slate-600 pt-1">
                <span>मोड: {tx.paymentMode || 'Cash'}</span>
                <span>प्रतिनिधी: {tx.collectedBy || 'Staff'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons Footer - Ultra Mobile-Optimized */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 space-y-2 shrink-0">
          {/* Main Action Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* 1. Share WhatsApp PNG Photo */}
            <button
              type="button"
              disabled={isSharing || isLoadingPhoto}
              onClick={handleSharePhoto}
              className="py-2.5 px-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/25 active:scale-95 cursor-pointer touch-manipulation min-h-[44px]"
              title="Share Thermal PNG Photo on WhatsApp"
            >
              {isSharing ? (
                <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
              ) : (
                <Camera className="w-4 h-4 text-amber-300 shrink-0" />
              )}
              <span className="truncate">📸 WhatsApp फोटो</span>
            </button>

            {/* 2. Direct Safe Print (58mm or 80mm) */}
            <button
              type="button"
              onClick={handlePrint}
              className="py-2.5 px-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer touch-manipulation min-h-[44px]"
              title={`Print ${format} Slip`}
            >
              <Printer className="w-4 h-4 shrink-0" />
              <span className="truncate">🖨️ {format} प्रिंट</span>
            </button>

            {/* 3. Download PNG File */}
            <button
              type="button"
              disabled={isLoadingPhoto}
              onClick={handleDownloadPng}
              className="py-2.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 active:scale-95 cursor-pointer touch-manipulation min-h-[44px]"
              title="Download PNG File to Gallery"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span className="truncate">PNG सेव्ह</span>
            </button>

            {/* 4. Send WhatsApp Text Slip */}
            <button
              type="button"
              onClick={handleSendWhatsAppText}
              className="py-2.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer touch-manipulation min-h-[44px]"
              title="Send Marathi WhatsApp Text Receipt"
            >
              <Share2 className="w-4 h-4 shrink-0" />
              <span className="truncate">WhatsApp स्लिप</span>
            </button>
          </div>

          {/* Secondary Utility Row */}
          <div className="flex items-center justify-between gap-2 pt-0.5 text-xs">
            <button
              type="button"
              onClick={handleCopyText}
              className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 font-semibold flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 min-h-[38px]"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">कॉपी झाले!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>मजकूर कॉपी करा</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold cursor-pointer active:scale-95 min-h-[38px]"
            >
              बंद करा (Done)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
