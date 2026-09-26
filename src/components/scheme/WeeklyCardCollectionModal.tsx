import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Edit3,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Search,
  Printer,
  Share2,
  Receipt,
  User,
  MapPin,
  FileText,
  CalendarCheck
} from 'lucide-react';
import { CardMember, CardTransaction, StoreData } from '../../types';
import { StorageService } from '../../services/storageService';
import { NotificationService } from '../../services/notificationService';
import { useTheme } from '../../context/ThemeContext';
import { extractCardNumber, resolveCardScheme } from '../../utils/schemeUtils';

interface WeeklyCardCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMember?: CardMember | null;
  storeData: StoreData;
  onRefreshData: () => void;
  defaultAgentName?: string;
  onReceiptIssued?: (tx: CardTransaction) => void;
}

export const getNextAvailableWeek = (member: CardMember, txs: CardTransaction[]): number => {
  const memberTxs = txs.filter((t) => t.cardMemberId === member.id);
  const recordedWeeks = new Set(
    memberTxs.map((t) => Number(t.weekNumber || t.monthNumber || 0))
  );
  let candidate = (member.totalPaidMonths || 0) + 1;
  while (recordedWeeks.has(candidate)) {
    candidate++;
  }
  return candidate;
};

export const WeeklyCardCollectionModal: React.FC<WeeklyCardCollectionModalProps> = ({
  isOpen,
  onClose,
  initialMember,
  storeData,
  onRefreshData,
  defaultAgentName = 'Rahul Sharma',
  onReceiptIssued,
}) => {
  const { isDayMode } = useTheme();

  // Active Member State
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [isChangingCard, setIsChangingCard] = useState<boolean>(false);
  const [cardSearchQuery, setCardSearchQuery] = useState<string>('');

  // Find active member
  const currentMember = useMemo(() => {
    return storeData.cardMembers.find((m) => m.id === selectedMemberId) || initialMember || storeData.cardMembers[0] || null;
  }, [storeData.cardMembers, selectedMemberId, initialMember]);

  // Inline Quick Editor state - keep collapsed by default on mobile unless info is missing
  const [isEditorExpanded, setIsEditorExpanded] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>('');
  const [editPhone, setEditPhone] = useState<string>('');
  const [editVillage, setEditVillage] = useState<string>('');
  const [editSheetNo, setEditSheetNo] = useState<string>('');
  const [infoSaveSuccess, setInfoSaveSuccess] = useState<boolean>(false);

  // Collection form state - default hafta ₹100-200
  const [amount, setAmount] = useState<number>(100);
  const [weekNumber, setWeekNumber] = useState<number>(1);
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI' | 'Bank Transfer'>('Cash');
  const [agentName, setAgentName] = useState<string>(defaultAgentName);
  const [receiptNo, setReceiptNo] = useState<string>('');
  const [collectionSuccess, setCollectionSuccess] = useState<CardTransaction | null>(null);

  // Multi-tap rapid click protection & idempotency key
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [idempotencyToken, setIdempotencyToken] = useState<string>(() => 'tx-token-' + Date.now());

  // Duplicate entry protection state
  const [allowDuplicateOverride, setAllowDuplicateOverride] = useState<boolean>(false);

  // Quick Amount Presets - hafta is 100 to 200 rs, or 250, 500, 1000
  const amountPills = [100, 150, 200, 250, 500, 1000];

  // Helper to generate receipt number
  const generateReceiptNumber = (cardNoStr: string) => {
    const rawDigits = cardNoStr.replace(/\D/g, '') || '1021';
    const randCode = Math.floor(1000 + Math.random() * 9000);
    return `REC-${rawDigits}-${randCode}`;
  };

  // Synchronize when currentMember changes
  useEffect(() => {
    if (currentMember) {
      setSelectedMemberId(currentMember.id);
      setEditName(currentMember.memberName || '');
      setEditPhone(currentMember.phone && currentMember.phone !== '0' ? currentMember.phone : '');
      setEditVillage(currentMember.village || currentMember.address || 'Wardha');
      setEditSheetNo(currentMember.sheetNo || '');
      
      // Auto-set to the NEXT UNRECORDED week number to avoid false duplicate blocks
      const nextWeek = getNextAvailableWeek(currentMember, storeData.cardTransactions);
      setWeekNumber(nextWeek);
      setAllowDuplicateOverride(false);

      // Auto-set amount - default to 100 or member's defined amount (100-200)
      if (currentMember.monthlyAmount && currentMember.monthlyAmount > 0) {
        setAmount(currentMember.monthlyAmount);
      } else {
        setAmount(100);
      }

      // Generate initial receipt number
      setReceiptNo(generateReceiptNumber(currentMember.cardNo));
      setIsChangingCard(false);
      setCollectionSuccess(null);
      setIdempotencyToken('tx-token-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7));
    }
  }, [currentMember?.id, storeData.cardTransactions]);

  // Check if an entry for this card & weekNumber already exists
  const existingEntryForWeek = useMemo(() => {
    if (!currentMember) return null;
    return storeData.cardTransactions.find(
      (tx) =>
        tx.cardMemberId === currentMember.id &&
        (Number(tx.weekNumber) === Number(weekNumber) || Number(tx.monthNumber) === Number(weekNumber))
    );
  }, [currentMember, weekNumber, storeData.cardTransactions]);

  if (!isOpen) return null;

  // Handle empty state gracefully instead of failing to render
  if (!currentMember || storeData.cardMembers.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className={`w-full max-w-md rounded-3xl border shadow-2xl p-6 text-center space-y-4 ${
          isDayMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
        }`}>
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-base">कोणतेही कार्ड उपलब्ध नाही</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              हप्ता जमा करण्यासाठी कृपया आधी ३०-महिने बचत योजना सभासद कार्ड नोंदवा.
            </p>
          </div>
          <div className="flex gap-2 justify-center pt-2">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-800 text-white cursor-pointer hover:bg-slate-700"
            >
              बंद करा (Close)
            </button>
          </div>
        </div>
      </div>
    );
  }

  const cardNum = extractCardNumber(currentMember.cardNo) || currentMember.cardNo;
  const schemeNo = resolveCardScheme(currentMember);

  // Check if member phone / info is incomplete
  const isInfoIncomplete = !currentMember.phone || currentMember.phone === '0' || currentMember.phone.length < 10 || !currentMember.village;

  // Filtered members for card switcher
  const filteredCardList = storeData.cardMembers.filter((m) => {
    if (!cardSearchQuery.trim()) return true;
    const q = cardSearchQuery.toLowerCase();
    const cNum = String(extractCardNumber(m.cardNo) || m.cardNo).toLowerCase();
    return (
      m.memberName.toLowerCase().includes(q) ||
      cNum.includes(q) ||
      (m.phone && m.phone.includes(q)) ||
      (m.village && m.village.toLowerCase().includes(q))
    );
  }).slice(0, 15);

  // Save quick customer details only
  const handleSaveCustomerInfoOnly = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!currentMember) return;

    StorageService.updateCardMember(currentMember.id, {
      memberName: editName.trim() || currentMember.memberName,
      phone: editPhone.trim() || currentMember.phone,
      village: editVillage.trim() || currentMember.village,
      address: editVillage.trim() || currentMember.address,
      sheetNo: editSheetNo.trim() || currentMember.sheetNo,
    });

    onRefreshData();
    setInfoSaveSuccess(true);
    setTimeout(() => setInfoSaveSuccess(false), 2500);
  };

  // Submit Installment Collection with Rapid Multi-Tap & Double Submit Protection
  const handleSubmitCollection = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentMember || isSubmitting) return;

    // Instant Lock
    setIsSubmitting(true);

    try {
      // First ensure edited customer info is also updated
      StorageService.updateCardMember(currentMember.id, {
        memberName: editName.trim() || currentMember.memberName,
        phone: editPhone.trim() || currentMember.phone,
        village: editVillage.trim() || currentMember.village,
        address: editVillage.trim() || currentMember.address,
        sheetNo: editSheetNo.trim() || currentMember.sheetNo,
      });

      const todayPaid = Number(amount) || 100;
      // Determine effective week number: if duplicate detected and force not manually checked, auto-advance or use week
      const targetWeek = Number(weekNumber) || 1;

      const tx = StorageService.collectCardInstallment({
        cardMemberId: currentMember.id,
        monthNumber: targetWeek,
        weekNumber: targetWeek,
        amount: todayPaid,
        paymentMode: paymentMode,
        collectedBy: agentName.trim() || defaultAgentName,
        receiptNo: receiptNo.trim() || generateReceiptNumber(currentMember.cardNo),
        remarks: `साप्ताहिक हप्ता क्र. #${targetWeek} (Token: ${idempotencyToken})`,
      });

      onRefreshData();
      setCollectionSuccess(tx);
      setIdempotencyToken('tx-token-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7));

      // Trigger instant notification
      NotificationService.addNotification({
        type: 'installment_collected',
        title: 'साप्ताहिक हप्ता जमा (Installment Collected)',
        message: `कार्ड #${cardNum} वर ₹${todayPaid} चा हप्ता ${agentName.trim() || defaultAgentName} यांनी जमा केला.`,
        data: {
          amount: todayPaid,
          cardNo: String(cardNum),
          customerName: currentMember.memberName,
        },
      });

      if (onReceiptIssued) {
        onReceiptIssued(tx);
      }
    } finally {
      // Unlock after delay to prevent rapid duplicate double-tap
      setTimeout(() => {
        setIsSubmitting(false);
      }, 700);
    }
  };

  // 1-Click Thermal POS (80mm & 58mm) Receipt Print
  const handlePrintThermalReceipt = (tx: CardTransaction, paperWidth: '80mm' | '58mm' = '80mm') => {
    const printWindow = window.open('', '_blank', 'width=440,height=700');
    if (printWindow) {
      const todayPaid = tx.amount;
      const prevBal = Math.max(0, (currentMember.totalAmountPaid || 0) - todayPaid);
      const totalSavings = (currentMember.totalAmountPaid || 0);
      const targetVal = currentMember.targetAmount || (currentMember.planType === '15000_scheme' ? 15000 : 30000);
      const remBal = Math.max(0, targetVal - totalSavings);
      const cardNoDisplay = cardNum;
      const dateFormatted = new Date(tx.date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      const timeFormatted = new Date(tx.date).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      const waGroupUrl = storeData.settings.whatsappGroupLink || 'https://chat.whatsapp.com/invite/shrisaienterprises';
      const upiUrl = `upi://pay?pa=8766486915@ybl&pn=Shri%20Sai%20Enterprises&am=${todayPaid}&cu=INR`;
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(upiUrl)}`;
      const waQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(waGroupUrl)}`;

      const is80 = paperWidth === '80mm';
      const bodyWidth = is80 ? '74mm' : '54mm';
      const fontSize = is80 ? '12px' : '11px';
      const headerSize = is80 ? '16px' : '13px';
      const bigAmtSize = is80 ? '18px' : '15px';

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8" />
          <title>${is80 ? '80mm' : '58mm'} Thermal Receipt - ${tx.receiptNo}</title>
          <style>
            @page { size: ${is80 ? '80mm' : '58mm'} auto; margin: ${is80 ? '2.5mm' : '2mm'}; }
            body {
              font-family: 'Courier New', Courier, monospace;
              width: ${bodyWidth};
              margin: 0 auto;
              padding: 4px;
              color: #000;
              font-size: ${fontSize};
              line-height: 1.35;
              text-align: center;
            }
            .bold { font-weight: bold; }
            .header-title { font-size: ${headerSize}; font-weight: 900; margin-bottom: 2px; }
            .header-sub { font-size: ${is80 ? '11px' : '9px'}; font-weight: 600; }
            .divider { border-top: 1px dashed #000; margin: 5px 0; }
            .divider-double { border-top: 2px double #000; margin: 5px 0; }
            .row { display: flex; justify-content: space-between; text-align: left; margin: 2.5px 0; font-size: ${is80 ? '11.5px' : '10px'}; }
            .row-val { font-weight: bold; text-align: right; }
            .big-amount { font-size: ${bigAmtSize}; font-weight: 900; margin: 4px 0; }
            .qr-box { margin: 6px auto; width: 110px; height: 110px; }
            .qr-box img { width: 110px; height: 110px; display: block; margin: 0 auto; }
            .highlight-box { font-size: ${is80 ? '10.5px' : '8.5px'}; font-weight: bold; border: 1px solid #000; padding: 4px; margin: 4px 0; }
            .footer { font-size: ${is80 ? '10px' : '8.5px'}; margin-top: 6px; }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="header-title">SHRI SAI ENTERPRISES</div>
          <div class="header-sub">श्री साई एंटरप्रायझेस (इलेक्ट्रॉनिक्स & फर्निचर शोरूम, वर्धा)</div>
          <div>मातोश्री सभागृह समोर, आर्वी रोड, पंजाब कॉलनी, वर्धा</div>
          <div>मो.: 8600122978 / 9175537365 / 8766486915</div>
          <div class="divider-double"></div>
          <div class="bold" style="font-size: ${is80 ? '13px' : '11px'};">साप्ताहिक बचत योजना पावती (${is80 ? '80mm POS' : '58mm POS'})</div>
          <div class="divider"></div>
          <div class="row"><span>पावती क्र (Receipt No):</span><span class="row-val">${tx.receiptNo}</span></div>
          <div class="row"><span>दिनांक (Date & Time):</span><span class="row-val">${dateFormatted} ${timeFormatted}</span></div>
          <div class="row"><span>कार्ड क्र (Card No):</span><span class="row-val">#${cardNoDisplay} (${currentMember.schemeName || 'योजना १'})</span></div>
          <div class="row"><span>ग्राहक (Member Name):</span><span class="row-val">${currentMember.memberName}</span></div>
          <div class="row"><span>गाव / पत्ता (Village):</span><span class="row-val">${currentMember.village || 'Wardha'}</span></div>
          <div class="row"><span>हप्ता क्र (Week / Installment):</span><span class="row-val">#${tx.weekNumber || tx.monthNumber}</span></div>
          <div class="divider"></div>
          <div class="row"><span>१. जुनी रक्कम (मागील जमा):</span><span class="row-val">₹${prevBal.toLocaleString('en-IN')}/-</span></div>
          <div class="row" style="font-size: ${is80 ? '13px' : '11px'}; font-weight: bold;"><span>२. आज जमा हप्ता (Today Paid):</span><span class="row-val">₹${todayPaid.toLocaleString('en-IN')}/-</span></div>
          <div class="big-amount">₹${todayPaid.toLocaleString('en-IN')}/-</div>
          <div class="row"><span>३. आतापर्यंत एकूण जमा:</span><span class="row-val">₹${totalSavings.toLocaleString('en-IN')}/-</span></div>
          <div class="row"><span>४. कार्ड योजना एकूण उद्दिष्ट:</span><span class="row-val">₹${targetVal.toLocaleString('en-IN')}/-</span></div>
          <div class="row" style="font-size: ${is80 ? '13px' : '11px'}; font-weight: bold;"><span>५. कार्डमधील चालू शिल्लक बाकी:</span><span class="row-val" style="text-decoration: underline;">₹${remBal.toLocaleString('en-IN')}/-</span></div>
          <div class="divider"></div>
          <div class="highlight-box">
            हिशोब ताळमेळ: एकूण जमा ₹${totalSavings} + शिल्लक ₹${remBal} = एकूण उद्दिष्ट ₹${targetVal} (१००% अचूक)
          </div>
          <div class="row"><span>पेमेंट मोड:</span><span class="row-val">${tx.paymentMode || 'Cash'}</span></div>
          <div class="row"><span>वसुली प्रतिनिधी:</span><span class="row-val">${tx.collectedBy}</span></div>
          <div class="divider"></div>
          <div class="bold" style="font-size: ${is80 ? '10.5px' : '9px'};">🎁 लकी ड्रॉ, बंपर योजना व ऑफर्ससाठी ग्रुपला जॉईन व्हा:</div>
          <div style="font-size: ${is80 ? '9.5px' : '8px'}; word-break: break-all; margin: 2px 0;">${waGroupUrl}</div>
          <div class="qr-box">
            <img src="${qrApiUrl}" alt="Payment / WhatsApp QR" />
          </div>
          <div style="font-size: ${is80 ? '9px' : '8px'};">Scan QR for UPI / WhatsApp Group • UPI: 8766486915@ybl</div>
          <div class="divider-double"></div>
          <div class="footer">
            श्री साई एंटरप्रायझेसवर विश्वास ठेवल्याबद्दल मनःपूर्वक धन्यवाद! 🙏<br/>
            (संगणकीय अधिकृत पावती - सहीची गरज नाही)
          </div>
          <script>
            window.onload = function() {
              window.focus();
              setTimeout(function() { window.print(); }, 250);
            };
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
      return;
    }
    window.print();
  };

  // Standard Receipt Print
  const handlePrintReceipt = (tx: CardTransaction) => {
    handlePrintThermalReceipt(tx, '80mm');
  };

  // Exact Marathi WhatsApp Collection Slip Template Matching Specifications
  const handleWhatsAppShare = (tx: CardTransaction) => {
    const phoneToUse = editPhone.trim() || currentMember.phone;
    if (!phoneToUse || phoneToUse === '0') {
      alert('कृपया आधी ग्राहकाचा मोबाईल नंबर भरा.');
      return;
    }
    const cleanPhone = phoneToUse.replace(/\D/g, '').slice(-10);

    const todayPaid = tx.amount;
    const totalSavings = currentMember.totalAmountPaid || todayPaid;
    const prevBalance = Math.max(0, totalSavings - todayPaid);
    const targetVal = currentMember.targetAmount || (currentMember.planType === '15000_scheme' ? 15000 : 30000);
    const remainingBalance = Math.max(0, targetVal - totalSavings);
    const dateStr = new Date(tx.date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const timeStr = new Date(tx.date).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const passbookUrl = `https://shrisaient.in/passbook?card=${cardNum}`;
    const waGroupUrl = storeData.settings.whatsappGroupLink || `https://chat.whatsapp.com/invite/shrisaienterprises`;

    const templateText =
`*श्री साई एंटरप्रायझेस, वर्धा*
*(इलेक्ट्रॉनिक्स व फर्निचर शोरूम • ३०-महिने बचत योजना)*
====================================
🧾 *साप्ताहिक हप्ता जमा पावती / Weekly Collection Slip*
====================================
👤 *ग्राहक / सभासद:* ${currentMember.memberName}
💳 *कार्ड नंबर:* #${cardNum} (${currentMember.schemeName || 'योजना १'})
🧾 *पावती क्र. (Receipt No):* ${tx.receiptNo}
📅 *दिनांक (Date & Time):* ${dateStr} (${timeStr})
🗓️ *हप्ता क्र. (Week No):* #${tx.weekNumber || tx.monthNumber}
📍 *गाव / पत्ता:* ${currentMember.village || 'वर्धा'}
------------------------------------
⏳ *१. जुनी रक्कम (मागील जमा):* ₹${prevBalance.toLocaleString('en-IN')}/-
💵 *२. आजची जमा रक्कम (Today Paid):* ₹${todayPaid.toLocaleString('en-IN')}/- [${tx.paymentMode || 'Cash'}]
💰 *३. आतापर्यंत एकूण जमा:* ₹${totalSavings.toLocaleString('en-IN')}/-
🎯 *४. कार्ड योजना एकूण उद्दिष्ट:* ₹${targetVal.toLocaleString('en-IN')}/-
📉 *५. कार्डमधील चालू शिल्लक बाकी (Exact Balance):* ₹${remainingBalance.toLocaleString('en-IN')}/-
✅ *हिशोब पडताळणी: ₹${totalSavings} + ₹${remainingBalance} = ₹${targetVal} (१००% अचूक)*
------------------------------------
🎁 *लकी ड्रॉ, बंपर बक्षीस व स्पेशल ऑफर्ससाठी आमच्या अधिकृत व्हॉट्सॲप ग्रुपला जॉईन व्हा:*
👉 *ग्रुप लिंक:* ${waGroupUrl}
🌐 *लाईव्ह पासबुक पाहण्यासाठी:* ${passbookUrl}
------------------------------------
👨‍💼 *वसुली प्रतिनिधी:* ${tx.collectedBy}
🙏 *श्री साई एंटरप्रायझेसवर विश्वास ठेवल्याबद्दल मनःपूर्वक धन्यवाद!*
📞 *संपर्क:* 8600122978 / 9175537365 / 8766486915
📍 *पत्ता:* मातोश्री सभागृह समोर, आर्वी रोड, पंजाब कॉलनी, वर्धा`;

    const encoded = encodeURIComponent(templateText);
    window.open(`https://wa.me/91${cleanPhone}?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-end sm:justify-center p-0 sm:p-4 overflow-hidden">
      <div
        className={`w-full max-w-md rounded-t-3xl sm:rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh] my-0 sm:my-auto transition-all ${
          isDayMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
        }`}
      >
        {/* Modal Header matching screenshot */}
        <div className={`px-4 sm:px-5 py-3.5 border-b shrink-0 flex items-center justify-between ${
          isDayMode ? 'bg-white border-slate-100' : 'bg-slate-900 border-slate-800'
        }`}>
          <div>
            <h2 className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
              <CalendarCheck className="w-4 h-4 text-emerald-500" />
              <span>साप्ताहिक हप्ता जमा (Weekly Collection)</span>
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              वसुली प्रतिनिधी: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{agentName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4 flex-1 overflow-y-auto overscroll-contain">

          {/* Success Banner if deposited */}
          {collectionSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>₹{collectionSuccess.amount} हप्ता यशस्वीरित्या जमा झाला!</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                पावती क्र: <span className="font-mono font-bold text-slate-900 dark:text-white">{collectionSuccess.receiptNo}</span> (हप्ता #{collectionSuccess.monthNumber})
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handlePrintThermalReceipt(collectionSuccess, '80mm')}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer active:scale-95"
                  title="80mm Thermal Receipt (80 थर्मल प्रिंट पावती)"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>80mm थर्मल प्रिंट</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePrintThermalReceipt(collectionSuccess, '58mm')}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer border border-slate-700"
                  title="58mm Mini POS Thermal Slip"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>58mm थर्मल</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleWhatsAppShare(collectionSuccess)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>WhatsApp पावती</span>
                </button>
              </div>
            </div>
          )}

          {/* 1. Green Summary Box matching screenshot */}
          <div className={`p-4 rounded-2xl border transition-all ${
            isDayMode ? 'bg-emerald-50/50 border-emerald-300 text-slate-900' : 'bg-emerald-950/20 border-emerald-800 text-white'
          }`}>
            <div className="flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-400">
              <span className="font-mono">
                Card #{cardNum} (Scheme {schemeNo} (योजना {schemeNo}))
              </span>
              <button
                type="button"
                onClick={() => setIsChangingCard(!isChangingCard)}
                className="hover:underline cursor-pointer font-semibold text-emerald-600 dark:text-emerald-400"
              >
                {isChangingCard ? 'Close Picker' : 'Change Card'}
              </button>
            </div>

            <h3 className="text-base font-black tracking-tight uppercase mt-1 text-slate-900 dark:text-white">
              {currentMember.memberName}
            </h3>

            <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 flex items-center gap-1.5">
              <span>Village: {currentMember.village || 'Sindi Meghe'}</span>
              <span>•</span>
              <span>Sheet: {currentMember.sheetNo || 'N/A'}</span>
            </div>

            <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mt-2">
              Current Deposited Balance: ₹{currentMember.totalAmountPaid || 0}
            </div>

            {/* Quick Card Switcher Dropdown */}
            {isChangingCard && (
              <div className="mt-3 pt-3 border-t border-emerald-200 dark:border-emerald-800 space-y-2 animate-in fade-in">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="कार्ड नंबर किंवा नाव शोधा (उदा. 1021, Suraj)..."
                    value={cardSearchQuery}
                    onChange={(e) => setCardSearchQuery(e.target.value)}
                    className={`w-full pl-8 pr-3 py-1.5 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                      isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-700'
                    }`}
                  />
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                  {filteredCardList.map((m) => {
                    const cNum = extractCardNumber(m.cardNo) || m.cardNo;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setSelectedMemberId(m.id);
                          setIsChangingCard(false);
                        }}
                        className={`w-full text-left p-2 rounded-xl text-xs flex items-center justify-between transition cursor-pointer ${
                          m.id === currentMember.id
                            ? 'bg-emerald-600 text-white font-bold'
                            : isDayMode
                            ? 'hover:bg-emerald-100/70 text-slate-800'
                            : 'hover:bg-emerald-950/60 text-slate-200'
                        }`}
                      >
                        <div>
                          <span className="font-mono font-bold mr-2">#{cNum}</span>
                          <span>{m.memberName}</span>
                        </div>
                        <span className="text-[11px] opacity-80">{m.village || 'Wardha'}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 2. Inline Quick Customer Detail Editor matching screenshot (Amber Box) */}
          <div className={`p-4 rounded-2xl border transition-all ${
            isDayMode ? 'bg-amber-50/40 border-amber-300' : 'bg-amber-950/20 border-amber-800/80'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span className="text-xs font-bold text-amber-900 dark:text-amber-300">
                  ग्राहकाचा मोबाईल / गाव / नाव दुरुस्त करा
                </span>
                {isInfoIncomplete && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                    माहिती अपूर्ण
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsEditorExpanded(!isEditorExpanded)}
                className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <span>{isEditorExpanded ? 'संक्षिप्त करा ▲' : 'विस्तार करा ▼'}</span>
              </button>
            </div>

            {isEditorExpanded && (
              <div className="mt-3 space-y-3 animate-in fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      ग्राहकाचे नाव
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className={`w-full rounded-xl px-3 py-1.5 text-xs font-bold border border-amber-300 dark:border-amber-700 focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                        isDayMode ? 'bg-white text-slate-900' : 'bg-slate-950 text-white'
                      }`}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        मोबाईल नंबर
                      </label>
                      <span className="text-[10px] font-bold text-rose-500">आवश्यक</span>
                    </div>
                    <input
                      type="text"
                      placeholder="उदा. 9822000000"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className={`w-full rounded-xl px-3 py-1.5 text-xs font-medium border border-amber-300 dark:border-amber-700 focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                        isDayMode ? 'bg-white text-slate-900' : 'bg-slate-950 text-white'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      गाव / पत्ता (Village)
                    </label>
                    <input
                      type="text"
                      value={editVillage}
                      onChange={(e) => setEditVillage(e.target.value)}
                      className={`w-full rounded-xl px-3 py-1.5 text-xs font-medium border border-amber-300 dark:border-amber-700 focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                        isDayMode ? 'bg-white text-slate-900' : 'bg-slate-950 text-white'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      शीट क्रमांक (Sheet No)
                    </label>
                    <input
                      type="text"
                      placeholder="उदा. 5104"
                      value={editSheetNo}
                      onChange={(e) => setEditSheetNo(e.target.value)}
                      className={`w-full rounded-xl px-3 py-1.5 text-xs font-medium border border-amber-300 dark:border-amber-700 focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                        isDayMode ? 'bg-white text-slate-900' : 'bg-slate-950 text-white'
                      }`}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  {infoSaveSuccess ? (
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> माहिती सेव्ह झाली!
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      चूक किंवा रिकामी माहिती थेट दुरुस्त करा
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleSaveCustomerInfoOnly}
                    className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer transition flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>केवळ माहिती त्वरित सेव्ह करा</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 3. Installment Amount (₹) * with quick pills matching screenshot */}
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
              Installment Amount (₹) *
            </label>

            <div className="grid grid-cols-4 gap-2 mb-2">
              {amountPills.map((pill) => {
                const isSelected = amount === pill;
                return (
                  <button
                    type="button"
                    key={pill}
                    onClick={() => setAmount(pill)}
                    className={`py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-700 text-white shadow-md'
                        : isDayMode
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    ₹{pill}
                  </button>
                );
              })}
            </div>

            <input
              type="number"
              required
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              className={`w-full rounded-xl px-3.5 py-2.5 text-base font-extrabold border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                isDayMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
              }`}
            />
          </div>

          {/* 4. Week Number & Payment Mode (2-Columns) matching screenshot */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                Week Number
              </label>
              <input
                type="number"
                min="1"
                max="130"
                value={weekNumber}
                onChange={(e) => {
                  setWeekNumber(parseInt(e.target.value, 10) || 1);
                  setAllowDuplicateOverride(false);
                }}
                className={`w-full rounded-xl px-3 py-2 text-xs font-bold border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                  existingEntryForWeek && !allowDuplicateOverride
                    ? 'border-rose-500 ring-1 ring-rose-500 bg-rose-500/10 text-rose-300'
                    : isDayMode
                    ? 'bg-white border-slate-200 text-slate-900'
                    : 'bg-slate-950 border-slate-800 text-white'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                Payment Mode
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as any)}
                className={`w-full rounded-xl px-3 py-2 text-xs font-medium border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                  isDayMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                }`}
              >
                <option value="Cash">Cash (नकद)</option>
                <option value="UPI">UPI (PhonePe / GooglePay)</option>
                <option value="Bank Transfer">Bank Transfer (बँक ट्रान्सफर)</option>
              </select>
            </div>
          </div>

          {/* Duplicate Entry Warning Banner */}
          {existingEntryForWeek && (
            <div className={`p-3 rounded-xl border text-xs space-y-2 ${
              allowDuplicateOverride
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-rose-500/10 border-rose-500/40 text-rose-300'
            }`}>
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <div className="space-y-1">
                  <p className="font-bold text-xs text-white">
                    सावधान: आठवडा क्र. #{weekNumber} ची पावती आधीच जमा आहे! (Duplicate Detected)
                  </p>
                  <p className="text-[11px] text-slate-300">
                    जुनी पावती: <strong className="text-amber-400">{existingEntryForWeek.receiptNo}</strong> | रक्कम: <strong>₹{existingEntryForWeek.amount}</strong> | दिनांक: <strong>{new Date(existingEntryForWeek.date).toLocaleDateString('en-IN')}</strong> ({existingEntryForWeek.collectedBy})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setWeekNumber((currentMember.totalPaidMonths || 0) + 1);
                    setAllowDuplicateOverride(false);
                  }}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[11px] transition cursor-pointer"
                >
                  पुढील आठवडा #{(currentMember.totalPaidMonths || 0) + 1} निवडा
                </button>
                {!allowDuplicateOverride ? (
                  <button
                    type="button"
                    onClick={() => setAllowDuplicateOverride(true)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] border border-slate-700 cursor-pointer"
                  >
                    तरीही जमा करा (Force Submit)
                  </button>
                ) : (
                  <span className="text-[11px] font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded">
                    ✓ फोर्स सबमिट सक्रिय
                  </span>
                )}
              </div>
            </div>
          )}

          {/* 5. Collecting Agent Name matching screenshot */}
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              Collecting Agent Name
            </label>
            <input
              type="text"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              className={`w-full rounded-xl px-3 py-2 text-xs font-medium border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                isDayMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
              }`}
            />
          </div>

          {/* 6. Receipt Number Section (Yellow/Amber box) matching screenshot */}
          <div className={`p-3.5 rounded-2xl border ${
            isDayMode ? 'bg-amber-50/30 border-amber-300' : 'bg-amber-950/15 border-amber-800/80'
          }`}>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-900 dark:text-white">
                पावती क्रमांक (Receipt Number)
              </label>
              <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400">
                मॅन्युअली बदलू शकता (Editable)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={receiptNo}
                onChange={(e) => setReceiptNo(e.target.value)}
                className={`flex-1 rounded-xl px-3 py-2 text-xs font-mono font-bold border border-amber-300 dark:border-amber-700 focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                  isDayMode ? 'bg-white text-slate-900' : 'bg-slate-950 text-white'
                }`}
              />
              <button
                type="button"
                onClick={() => setReceiptNo(generateReceiptNumber(currentMember.cardNo))}
                className={`px-3 py-2 rounded-xl text-xs font-bold border border-amber-300 dark:border-amber-700 flex items-center gap-1 cursor-pointer transition ${
                  isDayMode ? 'bg-white hover:bg-amber-100/50 text-slate-700' : 'bg-slate-900 hover:bg-slate-800 text-slate-200'
                }`}
              >
                <span>Auto</span>
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
              दुकानातील छापील पावती बुक नंबर किंवा मॅन्युअल नंबर टाका (उदा. 101, B-45).
            </p>
          </div>

        </div>

        {/* Modal Action Footer - Sticky at bottom for mobile view */}
        <div className={`px-4 sm:px-5 py-3 border-t shrink-0 flex items-center justify-between gap-3 sticky bottom-0 z-20 ${
          isDayMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
        }`}>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer min-h-[44px]"
          >
            रद्द करा (Cancel)
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmitCollection}
            className={`px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm shadow-md flex items-center gap-2 cursor-pointer transition active:scale-95 touch-manipulation min-h-[44px] ${
              isSubmitting
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-75'
                : existingEntryForWeek && !allowDuplicateOverride
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/25'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/25'
            }`}
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>नोंद होत आहे... (Saving...)</span>
              </>
            ) : existingEntryForWeek && !allowDuplicateOverride ? (
              <>
                <AlertCircle className="w-4 h-4 text-white" />
                <span>तरीही हप्ता जमा करा (Collect ₹{amount})</span>
              </>
            ) : (
              <>
                <Receipt className="w-4 h-4" />
                <span>हप्ता जमा करा (Collect ₹{amount} Now)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
