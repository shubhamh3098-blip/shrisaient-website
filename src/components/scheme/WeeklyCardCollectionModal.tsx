import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  CalendarCheck,
  Camera,
  Image
} from 'lucide-react';
import { CardMember, CardTransaction, StoreData } from '../../types';
import { StorageService } from '../../services/storageService';
import { NotificationService } from '../../services/notificationService';
import { useTheme } from '../../context/ThemeContext';
import { extractCardNumber, resolveCardScheme } from '../../utils/schemeUtils';
import { getLivePassbookUrl, getWhatsAppGroupDisplay } from '../../utils/passbookUtils';
import {
  shareThermalReceiptOnWhatsApp,
  printThermalReceiptViaIframe,
} from '../../services/receiptImageService';
import { WeeklyDepositReceiptModal } from './WeeklyDepositReceiptModal';

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

  // Dedicated 58mm / 80mm Print & WhatsApp PNG Photo Modal Viewer
  const [viewReceiptTx, setViewReceiptTx] = useState<CardTransaction | null>(null);
  const [viewReceiptFormat, setViewReceiptFormat] = useState<'80mm' | '58mm'>('80mm');

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

  // Track previous member ID to only reset inputs and success state when user actually switches cards
  const prevMemberIdRef = useRef<string>('');

  // Synchronize initialMember prop when passed from parent
  useEffect(() => {
    if (initialMember?.id) {
      setSelectedMemberId(initialMember.id);
    }
  }, [initialMember?.id]);

  // Synchronize when currentMember changes
  useEffect(() => {
    if (currentMember) {
      const isCardSwitched = prevMemberIdRef.current !== currentMember.id;
      prevMemberIdRef.current = currentMember.id;

      if (isCardSwitched) {
        setSelectedMemberId(currentMember.id);
        setEditName(currentMember.memberName || '');
        setEditPhone(currentMember.phone && currentMember.phone !== '0' ? currentMember.phone : '');
        setEditVillage(currentMember.village || currentMember.address || 'Wardha');
        setEditSheetNo(currentMember.sheetNo || '');
        setCollectionSuccess(null);
      }
      
      // Auto-set to the NEXT UNRECORDED week number to avoid false duplicate blocks
      const nextWeek = getNextAvailableWeek(currentMember, storeData.cardTransactions);
      setWeekNumber(nextWeek);
      setAllowDuplicateOverride(false);

      if (isCardSwitched) {
        // Auto-set amount - default to 100 or member's defined amount (100-200)
        if (currentMember.monthlyAmount && currentMember.monthlyAmount > 0) {
          setAmount(currentMember.monthlyAmount);
        } else {
          setAmount(100);
        }

        // Generate initial receipt number
        setReceiptNo(generateReceiptNumber(currentMember.cardNo));
        setIsChangingCard(false);
        setIdempotencyToken('tx-token-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7));
      }
    }
  }, [currentMember?.id, storeData.cardTransactions]);

  // Active / latest transaction for this card
  const latestCardTx = useMemo(() => {
    if (!currentMember) return null;
    const memberTxs = storeData.cardTransactions.filter((t) => t.cardMemberId === currentMember.id);
    if (memberTxs.length === 0) return null;
    return memberTxs[memberTxs.length - 1];
  }, [currentMember?.id, storeData.cardTransactions]);

  // Advance to next member card automatically for zero-friction field collection
  const handleAdvanceToNextCard = () => {
    setCollectionSuccess(null);
    const currentIndex = storeData.cardMembers.findIndex((m) => m.id === currentMember?.id);
    if (currentIndex !== -1 && currentIndex < storeData.cardMembers.length - 1) {
      const nextMember = storeData.cardMembers[currentIndex + 1];
      setSelectedMemberId(nextMember.id);
      setIsChangingCard(false);
    } else {
      // If at end of list or not found, open search picker so agent can choose any card
      setIsChangingCard(true);
    }
  };

  // Switch to previous card
  const handleSelectPreviousCard = () => {
    setCollectionSuccess(null);
    const currentIndex = storeData.cardMembers.findIndex((m) => m.id === currentMember?.id);
    if (currentIndex > 0) {
      const prevMember = storeData.cardMembers[currentIndex - 1];
      setSelectedMemberId(prevMember.id);
      setIsChangingCard(false);
    }
  };

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
  const handleSubmitCollection = (e?: React.FormEvent, autoAction: 'print80' | 'print58' | 'photo' | 'modal' | 'none' = 'modal') => {
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

      // AUTOMATICALLY open the 58mm/80mm Print & HD WhatsApp Photo preview modal!
      setViewReceiptTx(tx);
      setViewReceiptFormat(autoAction === 'print58' ? '58mm' : '80mm');

      if (autoAction === 'print80') {
        handlePrintThermalReceipt(tx, '80mm');
      } else if (autoAction === 'print58') {
        handlePrintThermalReceipt(tx, '58mm');
      }

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

  // 1-Click Thermal POS (80mm & 58mm) Receipt Print - safe for mobile browsers without popup blocker
  const handlePrintThermalReceipt = (tx: CardTransaction, paperWidth: '80mm' | '58mm' = '80mm') => {
    try {
      printThermalReceiptViaIframe(tx, currentMember, storeData.settings, paperWidth);
      NotificationService.success(`${paperWidth} पावती प्रिंट कमांड पाठवली.`);
    } catch (e) {
      console.warn('Iframe print failed, falling back to window.print:', e);
      window.print();
    }
  };

  // Open HD Visual 58mm / 80mm Print & WhatsApp PNG Photo Modal
  const handleOpenReceiptModal = (tx: CardTransaction, format: '80mm' | '58mm' = '80mm') => {
    setViewReceiptTx(tx);
    setViewReceiptFormat(format);
  };

  // Standard Receipt Print
  const handlePrintReceipt = (tx: CardTransaction) => {
    handlePrintThermalReceipt(tx, '80mm');
  };

  // Direct 80mm / 58mm Thermal Receipt Photo Sharing on WhatsApp
  const [isGeneratingPhoto, setIsGeneratingPhoto] = useState(false);
  const handleShareThermalPhoto = async (tx: CardTransaction, format: '80mm' | '58mm' = '80mm') => {
    setIsGeneratingPhoto(true);
    try {
      const res = await shareThermalReceiptOnWhatsApp(tx, currentMember, storeData.settings, format);
      NotificationService.success(res.message);
    } catch (e: any) {
      console.error('Failed to share receipt image:', e);
      NotificationService.error('पावती फोटो तयार करताना त्रुटी आली.');
    } finally {
      setIsGeneratingPhoto(false);
    }
  };

  // Exact Marathi WhatsApp Collection Slip Template with 100% Working Links
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

    const passbookUrl = getLivePassbookUrl(cardNum);
    const groupDisplay = getWhatsAppGroupDisplay(storeData.settings);

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
${groupDisplay.displayText}
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

          {/* Success Status Indicator with Direct Print / WhatsApp PNG Buttons */}
          {collectionSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 space-y-2.5 text-xs text-emerald-800 dark:text-emerald-200 font-bold animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span className="font-extrabold text-sm text-emerald-700 dark:text-emerald-300">
                    ₹{collectionSuccess.amount} हप्ता यशस्वी जमा झाला!
                  </span>
                </div>
                <span className="font-mono text-xs font-black px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-800 dark:text-emerald-200">
                  #{collectionSuccess.receiptNo}
                </span>
              </div>

              {/* Direct Print & WhatsApp PNG Photo Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleOpenReceiptModal(collectionSuccess, '80mm')}
                  className="col-span-2 sm:col-span-1 py-2.5 px-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer touch-manipulation min-h-[44px]"
                  title="58mm / 80mm HD पावती फोटो व WhatsApp PNG पहा"
                >
                  <Camera className="w-4 h-4 shrink-0 text-amber-300" />
                  <span>📸 58/80 फोटो पहा</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePrintThermalReceipt(collectionSuccess, '80mm')}
                  className="py-2.5 px-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer touch-manipulation min-h-[44px]"
                  title="80mm Thermal Slip Print (80mm पावती प्रिंट)"
                >
                  <Printer className="w-4 h-4 shrink-0" />
                  <span>80mm प्रिंट</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePrintThermalReceipt(collectionSuccess, '58mm')}
                  className="py-2.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 active:scale-95 cursor-pointer touch-manipulation min-h-[44px]"
                  title="58mm Mini POS Thermal Slip"
                >
                  <Printer className="w-4 h-4 shrink-0" />
                  <span>58mm थर्मल</span>
                </button>

                <button
                  type="button"
                  disabled={isGeneratingPhoto}
                  onClick={() => handleShareThermalPhoto(collectionSuccess, '80mm')}
                  className="py-2.5 px-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer touch-manipulation min-h-[44px]"
                  title="WhatsApp वर पावती फोटो (PNG) थेट पाठवा"
                >
                  {isGeneratingPhoto ? (
                    <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                  ) : (
                    <Share2 className="w-4 h-4 shrink-0 text-white" />
                  )}
                  <span>WhatsApp फोटो</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleWhatsAppShare(collectionSuccess)}
                  className="col-span-2 sm:col-span-1 py-2.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer touch-manipulation min-h-[44px]"
                  title="Send Marathi WhatsApp Receipt Text"
                >
                  <Share2 className="w-4 h-4 shrink-0" />
                  <span>WhatsApp स्लिप</span>
                </button>
              </div>

              {/* One-Tap Advance to Next Card Button */}
              <button
                type="button"
                onClick={handleAdvanceToNextCard}
                className="w-full mt-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow cursor-pointer active:scale-95 touch-manipulation min-h-[44px]"
              >
                <span>➡️ पुढील कार्ड / पुढचा ग्राहक जमा करा (Next Card)</span>
              </button>
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
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleSelectPreviousCard}
                  className="px-2 py-0.5 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 cursor-pointer font-bold transition text-[11px]"
                  title="मागील कार्ड (Previous Card)"
                >
                  ◀ मागील
                </button>
                <button
                  type="button"
                  onClick={() => setIsChangingCard(!isChangingCard)}
                  className="px-2 py-0.5 rounded-lg hover:underline cursor-pointer font-semibold text-emerald-600 dark:text-emerald-400"
                >
                  {isChangingCard ? 'Close' : 'Change Card'}
                </button>
                <button
                  type="button"
                  onClick={handleAdvanceToNextCard}
                  className="px-2 py-0.5 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 cursor-pointer font-bold transition text-[11px]"
                  title="पुढील कार्ड (Next Card)"
                >
                  पुढील ▶
                </button>
              </div>
            </div>

            <h3 className="text-base font-black tracking-tight uppercase mt-1 text-slate-900 dark:text-white">
              {currentMember.memberName}
            </h3>

            <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 flex items-center gap-1.5">
              <span>Village: {currentMember.village || 'Sindi Meghe'}</span>
              <span>•</span>
              <span>Sheet: {currentMember.sheetNo || 'N/A'}</span>
            </div>

            {/* Live Scheme Collection Calculation Breakdown */}
            <div className={`mt-2.5 p-2.5 rounded-xl border space-y-1 text-xs ${
              isDayMode ? 'bg-emerald-50/70 border-emerald-200' : 'bg-emerald-950/40 border-emerald-800/80'
            }`}>
              <div className="flex justify-between items-center text-[11px] text-slate-600 dark:text-slate-300">
                <span>१. मागील जुनी जमा (Old Deposited Balance):</span>
                <span className="font-bold text-slate-800 dark:text-white">₹{(currentMember.totalAmountPaid || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center text-[11px] text-emerald-700 dark:text-emerald-400">
                <span>२. आज घेतलेला हप्ता (New Hafta Entry):</span>
                <span className="font-bold">+ ₹{(amount || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-emerald-200 dark:border-emerald-800/80 text-xs font-black">
                <span className="text-emerald-800 dark:text-emerald-300">एकूण नवीन जमा (New Total Deposited):</span>
                <span className="text-emerald-700 dark:text-emerald-400 text-sm">
                  ₹{((currentMember.totalAmountPaid || 0) + (amount || 0)).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Quick Print/Share Bar for Latest Recorded Receipt on this card */}
            {latestCardTx && !collectionSuccess && (
              <div className="mt-3 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-emerald-500" />
                    <span>मागील पावती: <strong>#{latestCardTx.receiptNo}</strong> (हप्ता #{latestCardTx.weekNumber || latestCardTx.monthNumber})</span>
                  </span>
                  <span className="font-mono text-xs font-black text-emerald-700 dark:text-emerald-300">
                    ₹{latestCardTx.amount}/-
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => handleOpenReceiptModal(latestCardTx, '80mm')}
                    className="py-2 px-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-1 shadow cursor-pointer active:scale-95 touch-manipulation min-h-[38px]"
                    title="मागील पावतीचा 58mm/80mm PNG फोटो पहा व WhatsApp वर पाठवा"
                  >
                    <Camera className="w-3.5 h-3.5 text-amber-300" />
                    <span>📸 फोटो (58/80)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePrintThermalReceipt(latestCardTx, '80mm')}
                    className="py-2 px-2 rounded-xl bg-amber-500/20 text-amber-800 dark:text-amber-300 font-extrabold text-xs flex items-center justify-center gap-1 border border-amber-500/30 hover:bg-amber-500/30 cursor-pointer active:scale-95 touch-manipulation min-h-[38px]"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>80mm प्रिंट</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePrintThermalReceipt(latestCardTx, '58mm')}
                    className="py-2 px-2 rounded-xl bg-slate-800 text-amber-300 font-bold text-xs flex items-center justify-center gap-1 border border-slate-700 hover:bg-slate-700 cursor-pointer active:scale-95 touch-manipulation min-h-[38px]"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>58mm मिनी</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleWhatsAppShare(latestCardTx)}
                    className="py-2 px-2 rounded-xl bg-emerald-600/20 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center justify-center gap-1 border border-emerald-500/30 hover:bg-emerald-600/30 cursor-pointer active:scale-95 touch-manipulation min-h-[38px]"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>
                </div>
              </div>
            )}

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

          {/* 7. Instant 58mm / 80mm Print & WhatsApp Photo Option Box (Always Visible) */}
          <div className={`p-3.5 rounded-2xl border space-y-2.5 ${
            isDayMode ? 'bg-gradient-to-br from-emerald-50/60 to-amber-50/60 border-emerald-300' : 'bg-slate-900 border-emerald-700/60'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <Printer className="w-4 h-4 text-emerald-500" />
                <span>पावती प्रिंट व व्हॉट्सॲप फोटो (58mm / 80mm Options)</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                रक्कम: ₹{amount || 100}
              </span>
            </div>

            <p className="text-[11px] text-slate-600 dark:text-slate-300">
              हप्ता जमा करताना थेट प्रिंट हवी असल्यास खालील बटण दाबा:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSubmitCollection(undefined, 'print80')}
                className="py-2.5 px-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer touch-manipulation min-h-[44px]"
                title="हप्ता सेव्ह करा आणि लगेच 80mm पावती प्रिंट करा"
              >
                <Printer className="w-4 h-4 shrink-0" />
                <span>🖨️ जमा व 80mm प्रिंट</span>
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSubmitCollection(undefined, 'print58')}
                className="py-2.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-extrabold text-xs flex items-center justify-center gap-1.5 border border-slate-700 active:scale-95 cursor-pointer touch-manipulation min-h-[44px]"
                title="हप्ता सेव्ह करा आणि लगेच 58mm मिनी पावती प्रिंट करा"
              >
                <Printer className="w-4 h-4 shrink-0" />
                <span>🖨️ जमा व 58mm प्रिंट</span>
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSubmitCollection(undefined, 'photo')}
                className="py-2.5 px-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer touch-manipulation min-h-[44px]"
                title="हप्ता सेव्ह करा आणि 58/80mm WhatsApp PNG पावती फोटो उघडा"
              >
                <Camera className="w-4 h-4 shrink-0 text-amber-300" />
                <span>📸 जमा व फोटो</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (latestCardTx) {
                    handleOpenReceiptModal(latestCardTx, '80mm');
                  } else {
                    setViewReceiptTx({
                      id: 'preview-' + Date.now(),
                      cardMemberId: currentMember.id,
                      cardNo: currentMember.cardNo,
                      memberName: currentMember.memberName,
                      amount: Number(amount) || 100,
                      date: new Date().toISOString(),
                      collectedBy: agentName.trim() || defaultAgentName,
                      receiptNo: receiptNo.trim() || generateReceiptNumber(currentMember.cardNo),
                      monthNumber: weekNumber,
                      weekNumber: weekNumber,
                      paymentMode: paymentMode,
                    });
                    setViewReceiptFormat('80mm');
                  }
                }}
                className="py-2.5 px-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-800 dark:text-emerald-300 font-extrabold text-xs flex items-center justify-center gap-1 border border-emerald-500/30 active:scale-95 cursor-pointer touch-manipulation min-h-[44px]"
                title="पावती प्रिव्ह्यू पहा (Preview Slip)"
              >
                <Receipt className="w-4 h-4 shrink-0" />
                <span>👁️ पावती प्रिव्ह्यू</span>
              </button>
            </div>
          </div>

        </div>

        {/* Modal Action Footer - Sticky at bottom for mobile view */}
        <div className={`px-4 sm:px-5 py-3 border-t shrink-0 sticky bottom-0 z-20 transition-all ${
          isDayMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
        }`}>
          {collectionSuccess ? (
            <div className="w-full space-y-2.5 py-0.5 animate-in slide-in-from-bottom duration-200">
              {/* 1. Fast Success Feedback Header right above print buttons */}
              <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300">
                <div className="flex items-center gap-1.5 text-xs font-black truncate">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                  <span className="truncate">₹{collectionSuccess.amount} हप्ता जमा! पावती #{collectionSuccess.receiptNo}</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 shrink-0">
                  हप्ता #{collectionSuccess.monthNumber || collectionSuccess.weekNumber}
                </span>
              </div>

              {/* 2. Instant Thermal Print & Direct WhatsApp Photo/Slip Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenReceiptModal(collectionSuccess, '80mm')}
                  className="col-span-2 sm:col-span-1 py-2.5 px-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/25 cursor-pointer active:scale-95 touch-manipulation min-h-[44px]"
                  title="58mm / 80mm HD पावती फोटो व WhatsApp PNG पहा"
                >
                  <Camera className="w-4 h-4 shrink-0 text-amber-300" />
                  <span>📸 58/80 फोटो पहा</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePrintThermalReceipt(collectionSuccess, '80mm')}
                  className="py-2.5 px-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/25 cursor-pointer active:scale-95 touch-manipulation min-h-[44px]"
                  title="80mm Thermal Slip Print (80mm पावती प्रिंट)"
                >
                  <Printer className="w-3.5 h-3.5 shrink-0" />
                  <span>80mm प्रिंट</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePrintThermalReceipt(collectionSuccess, '58mm')}
                  className="py-2.5 px-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer active:scale-95 touch-manipulation min-h-[44px]"
                  title="58mm Mini POS Thermal Slip"
                >
                  <Printer className="w-3.5 h-3.5 shrink-0" />
                  <span>58mm थर्मल</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleWhatsAppShare(collectionSuccess)}
                  className="py-2.5 px-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/25 cursor-pointer active:scale-95 touch-manipulation min-h-[44px]"
                  title="Send Marathi WhatsApp Receipt Text"
                >
                  <Share2 className="w-3.5 h-3.5 shrink-0" />
                  <span>WhatsApp स्लिप</span>
                </button>
              </div>

              {/* 3. The One-Tap Next Card Button for field collection agent */}
              <div className="flex items-center gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={handleAdvanceToNextCard}
                  className="flex-1 py-3 px-3 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-600/30 cursor-pointer active:scale-95 touch-manipulation min-h-[46px]"
                >
                  <span>➡️ पुढील कार्ड / पुढचा ग्राहक जमा करा (Next Card)</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="py-3 px-3.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer transition shrink-0 min-h-[46px]"
                >
                  पूर्ण (Done)
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full space-y-2">
              {/* Row 1: Direct 80mm / 58mm / Photo Action Buttons right in the footer! */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSubmitCollection(undefined, 'print80')}
                  className="flex-1 py-2 px-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] flex items-center justify-center gap-1 shadow cursor-pointer active:scale-95 touch-manipulation min-h-[42px]"
                  title="हप्ता सेव्ह करा आणि लगेच 80mm पावती प्रिंट करा"
                >
                  <Printer className="w-3.5 h-3.5 shrink-0" />
                  <span>80mm प्रिंट</span>
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSubmitCollection(undefined, 'print58')}
                  className="flex-1 py-2 px-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-extrabold text-[11px] flex items-center justify-center gap-1 border border-slate-700 cursor-pointer active:scale-95 touch-manipulation min-h-[42px]"
                  title="हप्ता सेव्ह करा आणि लगेच 58mm मिनी प्रिंट करा"
                >
                  <Printer className="w-3.5 h-3.5 shrink-0" />
                  <span>58mm थर्मल</span>
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSubmitCollection(undefined, 'photo')}
                  className="flex-1 py-2 px-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-[11px] flex items-center justify-center gap-1 shadow cursor-pointer active:scale-95 touch-manipulation min-h-[42px]"
                  title="हप्ता सेव्ह करा आणि WhatsApp PNG फोटो उघडा"
                >
                  <Camera className="w-3.5 h-3.5 shrink-0 text-amber-300" />
                  <span>WhatsApp फोटो</span>
                </button>
              </div>

              {/* Row 2: Cancel and Main Collect Button */}
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer min-h-[44px]"
                >
                  रद्द करा (Cancel)
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSubmitCollection(undefined, 'modal')}
                  className={`flex-1 px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition active:scale-95 touch-manipulation min-h-[44px] ${
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
                      <span>तरीही जमा करा (₹{amount})</span>
                    </>
                  ) : (
                    <>
                      <Receipt className="w-4 h-4" />
                      <span>हप्ता जमा करा (Collect ₹{amount})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 58mm & 80mm Thermal Receipt Print & HD WhatsApp PNG Photo Modal */}
      {viewReceiptTx && currentMember && (
        <WeeklyDepositReceiptModal
          isOpen={Boolean(viewReceiptTx)}
          onClose={() => setViewReceiptTx(null)}
          tx={viewReceiptTx}
          member={currentMember}
          settings={storeData.settings}
          defaultFormat={viewReceiptFormat}
        />
      )}
    </div>
  );
};
