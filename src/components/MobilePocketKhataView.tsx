import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Users,
  Search,
  Phone,
  MessageCircle,
  IndianRupee,
  CheckCircle2,
  AlertCircle,
  Calendar,
  MapPin,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
  QrCode,
  Share2,
  ExternalLink,
  Plus,
  ArrowRight,
  Filter
} from 'lucide-react';
import { Customer, CardMember, CardTransaction, TransactionEntry, BusinessSettings } from '../types';
import { WhatsAppCardGroupInviteModal } from './WhatsAppCardGroupInviteModal';
import { getNextReceiptNumber, getSafeWhatsAppUrl } from '../utils/numbering';

interface MobilePocketKhataViewProps {
  isOpen: boolean;
  onClose: () => void;
  cardMembers: CardMember[];
  cardTransactions: CardTransaction[];
  customers: Customer[];
  salesTransactions?: TransactionEntry[];
  settings: BusinessSettings;
  onRecordCardPayment: (tx: Omit<CardTransaction, 'id' | 'createdAt'>) => void;
  onSettleCustomerPayment: (customerId: string, amount: number, mode: 'Cash' | 'Online', notes: string) => void;
}

export const MobilePocketKhataView: React.FC<MobilePocketKhataViewProps> = ({
  isOpen,
  onClose,
  cardMembers,
  cardTransactions = [],
  customers,
  salesTransactions = [],
  settings,
  onRecordCardPayment,
  onSettleCustomerPayment,
}) => {
  const [activeTab, setActiveTab] = useState<'card-dues' | 'shop-khata'>('card-dues');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVillage, setSelectedVillage] = useState<string>('all');
  const [onlyDueFilter, setOnlyDueFilter] = useState<boolean>(true);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [showGroupModal, setShowGroupModal] = useState<boolean>(false);

  // Quick Payment Collection Bottom Sheet State
  const [collectingItem, setCollectingItem] = useState<{
    type: 'card' | 'khata';
    id: string;
    name: string;
    phone: string;
    dueAmount: number;
    identifier?: string;
  } | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(1000);
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'Online'>('Cash');
  const [paymentReceiptNo, setPaymentReceiptNo] = useState<string>('');
  const [paymentSuccessNotice, setPaymentSuccessNotice] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  // Extract all distinct villages
  const allVillages = useMemo(() => {
    const vSet = new Set<string>();
    cardMembers.forEach((m) => {
      if (m.village?.trim()) vSet.add(m.village.trim());
    });
    customers.forEach((c) => {
      if (c.village?.trim()) vSet.add(c.village.trim());
    });
    return Array.from(vSet).sort();
  }, [cardMembers, customers]);

  // Card items with dues calculation
  const cardItems = useMemo(() => {
    return cardMembers.map((m) => {
      const memberTxs = cardTransactions.filter(
        (tx) => tx.memberId === m.id && tx.type === 'WeeklyPayment'
      );
      const paidWeeks = memberTxs.length;
      const totalPaid = memberTxs.reduce((sum, tx) => sum + (tx.amount || 0), 0);
      const totalTarget = 30000; // 30 months scheme
      const dueWeeks = Math.max(0, 30 - paidWeeks);
      const isDue = paidWeeks < 30; // Pending installments
      const monthlyAmount = 1000;

      return {
        member: m,
        paidWeeks,
        totalPaid,
        totalTarget,
        dueWeeks,
        isDue,
        monthlyAmount,
        lastPaymentDate: memberTxs[memberTxs.length - 1]?.date || m.joinDate,
      };
    });
  }, [cardMembers, cardTransactions]);

  // Filtered Cards
  const filteredCards = useMemo(() => {
    return cardItems.filter((item) => {
      const m = item.member;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        m.customerName.toLowerCase().includes(q) ||
        (m.phone && m.phone.includes(q)) ||
        m.cardNumber.toString().includes(q) ||
        (m.village && m.village.toLowerCase().includes(q));

      const matchVillage =
        selectedVillage === 'all' ||
        (m.village && m.village.trim().toLowerCase() === selectedVillage.toLowerCase());

      const matchDue = !onlyDueFilter || item.isDue;

      return matchSearch && matchVillage && matchDue;
    });
  }, [cardItems, searchQuery, selectedVillage, onlyDueFilter]);

  // Helper to accurately resolve customer due balance from balanceDue, purchases - paid, or linked sales transactions
  const getCustomerDueDetails = (c: Customer) => {
    let due = typeof c.balanceDue === 'number' ? Math.max(0, c.balanceDue) : 0;
    const purchased = typeof c.totalPurchased === 'number'
      ? c.totalPurchased
      : (typeof (c as any).totalPurchases === 'number' ? (c as any).totalPurchases : 0);
    const paid = typeof c.totalPaid === 'number' ? c.totalPaid : 0;
    const calcFromPurchased = Math.max(0, purchased - paid);

    if (due === 0 && calcFromPurchased > 0) {
      due = calcFromPurchased;
    }

    if (due === 0 && typeof (c as any).netBalance === 'number' && (c as any).netBalance !== 0) {
      due = Math.abs((c as any).netBalance);
    }

    // Check sales transactions if due is still 0
    if (due === 0 && salesTransactions && salesTransactions.length > 0) {
      const cPhoneClean = c.phone ? c.phone.replace(/\D/g, '').slice(-10) : '';
      const cNameNorm = (c.name || '').trim().toLowerCase();
      const txDueSum = salesTransactions
        .filter((t) => {
          const tPhoneClean = t.customerPhone ? t.customerPhone.replace(/\D/g, '').slice(-10) : '';
          const tNameNorm = (t.customerName || '').trim().toLowerCase();
          return (
            (t.customerId && t.customerId === c.id) ||
            (cPhoneClean && tPhoneClean && cPhoneClean === tPhoneClean) ||
            (cNameNorm && tNameNorm && cNameNorm === tNameNorm)
          );
        })
        .reduce((sum, t) => sum + Math.max(0, Number(t.dueAmount || 0)), 0);

      if (txDueSum > 0) {
        due = txDueSum;
      }
    }

    const effectivePurchased = Math.max(purchased, paid + due);

    return {
      dueAmount: due,
      totalPurchased: effectivePurchased,
      totalPaid: paid,
      isDue: due > 0,
    };
  };

  // Pre-calculated customer due mapping
  const allCustomerItems = useMemo(() => {
    return customers.map((c) => ({
      customer: c,
      ...getCustomerDueDetails(c),
    }));
  }, [customers, salesTransactions]);

  const customersDueCount = useMemo(() => {
    return allCustomerItems.filter((item) => item.isDue).length;
  }, [allCustomerItems]);

  // Filtered Khata Customers with due balance properly sorted
  const filteredCustomers = useMemo(() => {
    return allCustomerItems
      .filter((item) => {
        const c = item.customer;
        const q = searchQuery.toLowerCase().trim();
        const matchSearch =
          !q ||
          c.name.toLowerCase().includes(q) ||
          (c.phone && c.phone.includes(q)) ||
          (c.village && c.village.toLowerCase().includes(q));

        const matchVillage =
          selectedVillage === 'all' ||
          (c.village && c.village.trim().toLowerCase() === selectedVillage.toLowerCase());

        const matchDue = !onlyDueFilter || item.isDue;

        return matchSearch && matchVillage && matchDue;
      })
      .sort((a, b) => b.dueAmount - a.dueAmount);
  }, [allCustomerItems, searchQuery, selectedVillage, onlyDueFilter]);

  // Summary Totals
  const totalCardsDueAmount = filteredCards.reduce(
    (sum, c) => sum + (c.isDue ? c.monthlyAmount : 0),
    0
  );
  const totalKhataDueAmount = filteredCustomers.reduce(
    (sum, c) => sum + c.dueAmount,
    0
  );

  // Send WhatsApp Reminder
  const handleSendWhatsApp = (
    name: string,
    phone: string,
    amount: number,
    type: 'card' | 'khata',
    detailStr?: string,
    totalPurchased?: number,
    totalPaid?: number
  ) => {
    if (!phone) {
      alert('ग्राहकाचा मोबाईल नंबर उपलब्ध नाही.');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const upiId = settings.upiId || 'shubhamh3098@oksbi';
    const storeName = settings.businessName || 'श्री साई एंटरप्रायझेस, वर्धा';

    let text = '';
    if (type === 'card') {
      const groupLink = settings.whatsappGroupLink || 'https://chat.whatsapp.com/CLcaeUq1bHH1RE0203oPaP?s=cl&p=a&mlu=4&ilr=4';
      text = `*नमस्कार ${name} जी,* 🙏\n\n*${storeName}* कडून आपल्या *३०-महिने बचत व लकी ड्रॉ योजनेचा (कार्ड क्र. ${detailStr || ''})* मासिक हप्ता *₹${amount.toLocaleString('en-IN')}/-* जमा करणे शिल्लक आहे.\n\nकृपया आपला हप्ता वेळेत जमा करून मासिक लकी ड्रॉ सोडतीसाठी पात्र राहा.\n\n📲 *PhonePe / GPay UPI ID:* \`${upiId}\`\n\n👉 *अधिकृत व्हॉट्सॲप ग्रुप (सोडत व निकाल):* ${groupLink}\n\nधन्यवाद!\n*श्री साई एंटरप्रायझेस, वर्धा*\n📞 संपर्क: ${settings.ownerPhone || '8766486915'}`;
    } else {
      const breakdownText = (totalPurchased && totalPurchased > 0)
        ? `\n(एकूण खरेदी: ₹${totalPurchased.toLocaleString('en-IN')}, आतापर्यंत जमा: ₹${(totalPaid || 0).toLocaleString('en-IN')})`
        : '';
      text = `*नमस्कार ${name} जी,* 🙏\n\n*${storeName}* कडून आपल्या खात्यावर *₹${amount.toLocaleString('en-IN')}/-* उधारी बाकी आहे.${breakdownText}\n\nकृपया वरील बाकी रक्कम PhonePe, GPay किंवा दुकानात येऊन जमा करावी ही नम्र विनंती.\n\n📲 *PhonePe / GPay UPI ID:* \`${upiId}\`\n\nधन्यवाद!\n*श्री साई एंटरप्रायझेस, वर्धा*\n📞 संपर्क: ${settings.ownerPhone || '8766486915'}`;
    }

    const url = getSafeWhatsAppUrl(phone, text);
    window.open(url, '_blank');
  };

  // Open Quick Collect Sheet
  const handleOpenCollect = (
    type: 'card' | 'khata',
    id: string,
    name: string,
    phone: string,
    dueAmount: number,
    identifier?: string
  ) => {
    setCollectingItem({ type, id, name, phone, dueAmount, identifier });
    setPaymentAmount(type === 'card' ? (dueAmount > 0 && dueAmount <= 1000 ? dueAmount : 500) : (dueAmount > 0 ? dueAmount : 1000));
    setPaymentReceiptNo(type === 'card' ? getNextReceiptNumber(cardTransactions) : `REC-${Date.now().toString().slice(-4)}`);
    setPaymentSuccessNotice('');
    setIsSubmitting(false);
  };

  // Submit Payment Collection with Double-Tap Lock
  const handleConfirmCollection = () => {
    if (isSubmitting || !collectingItem || paymentAmount <= 0) return;
    setIsSubmitting(true);

    if (collectingItem.type === 'card') {
      const member = cardMembers.find((m) => m.id === collectingItem.id);
      const newBal = (member?.netBalance || 0) + paymentAmount;
      const weekNum = (cardTransactions.filter((t) => t.cardId === collectingItem.id).length || 0) + 1;

      onRecordCardPayment({
        cardId: collectingItem.id,
        cardNumber: member ? member.cardNumber : parseInt(collectingItem.identifier?.replace(/\D/g, '') || '0', 10),
        schemeId: member ? member.schemeId : 'scheme1',
        customerName: collectingItem.name,
        customerPhone: collectingItem.phone,
        receiptNo: paymentReceiptNo || getNextReceiptNumber(cardTransactions),
        date: new Date().toISOString().split('T')[0],
        type: 'WeeklyPayment',
        weekNumber: weekNum,
        amount: paymentAmount,
        paymentMode: paymentMode,
        agentName: 'Staff Mobile',
        remarks: `Mobile Pocket Khata: Week ${weekNum} Installment ₹${paymentAmount}`,
        balanceAfter: newBal,
      });
    } else {
      onSettleCustomerPayment(
        collectingItem.id,
        paymentAmount,
        paymentMode,
        `Mobile Pocket Khata: Settle ₹${paymentAmount} by ${paymentMode}`
      );
    }

    setPaymentSuccessNotice(`✓ ₹${paymentAmount.toLocaleString('en-IN')} यशस्वीरीत्या जमा झाले! पावती क्र. ${paymentReceiptNo || 'CR-0001'}`);
    setTimeout(() => {
      setCollectingItem(null);
      setPaymentSuccessNotice('');
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-100 dark:bg-slate-950 overflow-hidden">
      {/* Mobile-Friendly App Header */}
      <div className="bg-[#0B1528] text-white px-4 py-3 shrink-0 flex items-center justify-between border-b border-slate-800 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-sm shadow-xs">
            साई
          </div>
          <div>
            <h1 className="text-sm font-extrabold flex items-center gap-1.5 leading-tight">
              <span>पॉकेट उधारी व कार्ड डायरी</span>
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/40">
                Mobile
              </span>
            </h1>
            <p className="text-[10px] text-slate-400">लहान स्क्रीनवर १-टॅप हिशोब व WhatsApp</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowGroupModal(true)}
            className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition shadow-2xs"
            title="व्हॉट्सॲप ग्रुप आमंत्रण हब व VCF Contacts"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>ग्रुप जोडा</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Switcher Pills (Card Dues vs Shop Khata) */}
      <div className="p-2.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="grid grid-cols-2 gap-2 max-w-md mx-auto">
          <button
            type="button"
            onClick={() => setActiveTab('card-dues')}
            className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'card-dues'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>कार्ड हप्ते</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                activeTab === 'card-dues'
                  ? 'bg-white text-emerald-800'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {cardItems.filter((c) => c.isDue).length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('shop-khata')}
            className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'shop-khata'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>दुकान उधारी</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                activeTab === 'shop-khata'
                  ? 'bg-white text-purple-800'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {customersDueCount}
            </span>
          </button>
        </div>

        {/* Quick Search Input */}
        <div className="mt-2.5 relative max-w-md mx-auto">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="नाव, मोबाईल किंवा कार्ड नंबरने शोधा..."
            className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-emerald-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Horizontal Village Filter Carousel */}
        <div className="mt-2 flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar max-w-md mx-auto text-xs">
          <button
            type="button"
            onClick={() => setSelectedVillage('all')}
            className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition text-[11px] cursor-pointer ${
              selectedVillage === 'all'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            सर्व गावे
          </button>

          {allVillages.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setSelectedVillage(v)}
              className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition text-[11px] cursor-pointer flex items-center gap-1 ${
                selectedVillage === v
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <MapPin className="w-2.5 h-2.5" />
              <span>{v}</span>
            </button>
          ))}
        </div>

        {/* Due vs All Filter Toggle */}
        <div className="mt-2 flex items-center justify-between gap-2 max-w-md mx-auto text-xs px-0.5">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setOnlyDueFilter(true)}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] cursor-pointer transition flex items-center gap-1 ${
                onlyDueFilter
                  ? 'bg-rose-500 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <AlertCircle className="w-3 h-3" />
              <span>फक्त बाकीदार ({activeTab === 'card-dues' ? cardItems.filter((c) => c.isDue).length : customersDueCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setOnlyDueFilter(false)}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] cursor-pointer transition ${
                !onlyDueFilter
                  ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              सर्व ({activeTab === 'card-dues' ? cardItems.length : customers.length})
            </button>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">
            {activeTab === 'card-dues' ? `${filteredCards.length} कार्ड` : `${filteredCustomers.length} ग्राहक`}
          </span>
        </div>
      </div>

      {/* Main Mobile Card Feed (Zero Horizontal Scroll!) */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 pb-24 max-w-md mx-auto w-full">
        {activeTab === 'card-dues' ? (
          filteredCards.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              कोणतेही कार्ड ग्राहक आढळले नाहीत.
            </div>
          ) : (
            filteredCards.map(({ member, paidWeeks, totalPaid, isDue, monthlyAmount }) => {
              const isExpanded = expandedCardId === member.id;
              const phoneClean = member.phone ? member.phone.replace(/\D/g, '').slice(-10) : '';

              return (
                <div
                  key={member.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5 shadow-2xs space-y-3"
                >
                  {/* Top Customer Info */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs ${
                          isDue
                            ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                            : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                        }`}
                      >
                        {member.customerName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight">
                          {member.customerName}
                        </h3>
                        <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            कार्ड क्र. {member.cardNumber}
                          </span>
                          {member.village && (
                            <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-0.5">
                              <MapPin className="w-2.5 h-2.5 text-rose-500" />
                              {member.village}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Dues Status Badge */}
                    <div className="text-right">
                      {isDue ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 text-[10px] font-black uppercase">
                          हप्ता बाकी
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[10px] font-black uppercase">
                          पूर्ण जमा
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress Strip */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">हप्ते प्रगती</span>
                      <strong className="text-slate-800 dark:text-slate-200">
                        {paidWeeks} / 30 महिने
                      </strong>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-medium">जमा रक्कम</span>
                      <strong className="font-mono text-emerald-600 dark:text-emerald-400">
                        ₹{totalPaid.toLocaleString('en-IN')}
                      </strong>
                    </div>

                    <div className="text-right border-l border-slate-200 dark:border-slate-700 pl-3">
                      <span className="text-[10px] text-rose-500 font-bold block">चालू देय</span>
                      <strong className="font-mono text-rose-600 dark:text-rose-400">
                        {isDue ? `₹${monthlyAmount}` : '₹0'}
                      </strong>
                    </div>
                  </div>

                  {/* 3 Thumb-Friendly Mobile Action Buttons */}
                  <div className="grid grid-cols-3 gap-2">
                    {/* 1. Direct Call */}
                    {phoneClean ? (
                      <a
                        href={`tel:${phoneClean}`}
                        className="py-2 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95"
                      >
                        <Phone className="w-3.5 h-3.5 text-blue-600" />
                        <span>कॉल</span>
                      </a>
                    ) : (
                      <div className="py-2 px-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-slate-400 text-xs text-center">
                        फोन नाही
                      </div>
                    )}

                    {/* 2. Instant WhatsApp Reminder */}
                    <button
                      type="button"
                      onClick={() =>
                        handleSendWhatsApp(
                          member.customerName,
                          member.phone || '',
                          monthlyAmount,
                          'card',
                          String(member.cardNumber)
                        )
                      }
                      className="py-2 px-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 border border-emerald-200 dark:border-emerald-800 cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600/20" />
                      <span>WhatsApp</span>
                    </button>

                    {/* 3. 1-Tap Quick Collect */}
                    <button
                      type="button"
                      onClick={() =>
                        handleOpenCollect(
                          'card',
                          member.id,
                          member.customerName,
                          member.phone || '',
                          monthlyAmount,
                          `कार्ड क्र. ${member.cardNumber}`
                        )
                      }
                      className="py-2 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs active:scale-95 cursor-pointer"
                    >
                      <IndianRupee className="w-3.5 h-3.5" />
                      <span>हप्ता जमा</span>
                    </button>
                  </div>

                  {/* Expand Mini Passbook Toggle */}
                  <div className="pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setExpandedCardId(isExpanded ? null : member.id)}
                      className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 cursor-pointer"
                    >
                      <span>३०-महिने पासबुक ग्रिड</span>
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                    <span className="text-[10px] text-slate-400">
                      एजंट: {member.agentName || 'शोरूम'}
                    </span>
                  </div>

                  {/* Expandable 30-Month Compact Grid */}
                  {isExpanded && (
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                      <div className="grid grid-cols-6 gap-1.5 text-center">
                        {Array.from({ length: 30 }, (_, i) => i + 1).map((mNo) => {
                          const isPaid = mNo <= paidWeeks;
                          const isCurrent = mNo === paidWeeks + 1;
                          return (
                            <div
                              key={mNo}
                              className={`py-1 rounded-md text-[10px] font-mono font-bold ${
                                isPaid
                                  ? 'bg-emerald-500 text-white shadow-2xs'
                                  : isCurrent
                                  ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-500 animate-pulse'
                                  : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                              }`}
                            >
                              म.{mNo}
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 px-1 pt-1">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded bg-emerald-500" /> भरलेले ({paidWeeks})
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded bg-amber-400" /> चालू बाकी
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded bg-slate-300 dark:bg-slate-600" /> पुढील महिने
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )
        ) : (
          /* Shop Customers Khata Feed */
          filteredCustomers.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              कोणतीही उधारी शिल्लक ग्राहक आढळले नाहीत.
            </div>
          ) : (
            filteredCustomers.map(({ customer, dueAmount, totalPurchased, totalPaid }) => {
              const phoneClean = customer.phone ? customer.phone.replace(/\D/g, '').slice(-10) : '';

              return (
                <div
                  key={customer.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5 shadow-2xs space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-sm shrink-0">
                        {customer.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight truncate">
                          {customer.name}
                        </h3>
                        <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {customer.village && (
                            <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-0.5">
                              <MapPin className="w-2.5 h-2.5 text-purple-500" />
                              {customer.village}
                            </span>
                          )}
                          <span>मो.: {customer.phone || '-'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400 block font-medium">बाकी उधारी</span>
                      <strong
                        className={`text-base font-extrabold font-mono block ${
                          dueAmount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        ₹{dueAmount.toLocaleString('en-IN')}
                      </strong>
                      {dueAmount === 0 ? (
                        <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded inline-block mt-0.5">
                          ✓ हिशोब पूर्ण
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded inline-block mt-0.5">
                          बाकी देय
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Customer Purchase & Payment Ledger Strip */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-slate-400 block text-[10px]">एकूण खरेदी:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200 font-mono">
                        ₹{totalPurchased.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">आतापर्यंत जमा:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                        ₹{totalPaid.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* 3 Touch Actions */}
                  <div className="grid grid-cols-3 gap-2">
                    {phoneClean ? (
                      <a
                        href={`tel:${phoneClean}`}
                        className="py-2 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95"
                      >
                        <Phone className="w-3.5 h-3.5 text-blue-600" />
                        <span>कॉल</span>
                      </a>
                    ) : (
                      <div className="py-2 px-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-slate-400 text-xs text-center">
                        फोन नाही
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        handleSendWhatsApp(
                          customer.name,
                          customer.phone || '',
                          dueAmount,
                          'khata',
                          undefined,
                          totalPurchased,
                          totalPaid
                        )
                      }
                      className="py-2 px-2 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 border border-purple-200 dark:border-purple-800 cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-purple-600 fill-purple-600/20" />
                      <span>WhatsApp</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleOpenCollect(
                          'khata',
                          customer.id,
                          customer.name,
                          customer.phone || '',
                          dueAmount,
                          `बाकी: ₹${dueAmount.toLocaleString('en-IN')}`
                        )
                      }
                      className="py-2 px-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs active:scale-95 cursor-pointer"
                    >
                      <IndianRupee className="w-3.5 h-3.5" />
                      <span>उधारी जमा</span>
                    </button>
                  </div>
                </div>
              );
            })
          )
        )}
      </div>

      {/* Sticky Bottom Summary Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0B1528] text-white p-3 border-t border-slate-800 flex items-center justify-between safe-area-pb shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-slate-800 text-amber-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">
              {activeTab === 'card-dues' ? 'एकूण कार्ड हप्ता बाकी' : 'एकूण दुकान उधारी बाकी'}
            </span>
            <strong className="text-base font-black font-mono text-emerald-400">
              ₹{(activeTab === 'card-dues' ? totalCardsDueAmount : totalKhataDueAmount).toLocaleString('en-IN')}
            </strong>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            const list = activeTab === 'card-dues' ? filteredCards : filteredCustomers;
            alert(`या स्क्रीनवरील सर्व ${list.length} ग्राहकांना WhatsApp मेसेज पाठवण्यासाठी प्रत्येकासमोरील हिरवे 'WhatsApp' बटण दाबा.`);
          }}
          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95 transition"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>१-क्लिक मदत</span>
        </button>
      </div>

      {/* Quick Collect Bottom Sheet Modal */}
      {collectingItem && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 p-5 max-w-md w-full space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {collectingItem.type === 'card' ? 'हप्ता जमा करा' : 'उधारी जमा करा'}
                </h3>
                <p className="text-xs text-slate-500">
                  {collectingItem.name} {collectingItem.identifier ? `(${collectingItem.identifier})` : ''}
                </p>
                <div className="mt-1 flex items-center gap-1.5 text-xs flex-wrap">
                  <span className="text-slate-400">चालू बाकी:</span>
                  <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                    ₹{collectingItem.dueAmount.toLocaleString('en-IN')}
                  </span>
                  {collectingItem.dueAmount > paymentAmount && (
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                      (जमा झाल्यावर बाकी: ₹{(collectingItem.dueAmount - paymentAmount).toLocaleString('en-IN')})
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCollectingItem(null)}
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {paymentSuccessNotice ? (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 rounded-2xl border border-emerald-200 text-emerald-800 dark:text-emerald-300 font-bold text-center text-xs">
                {paymentSuccessNotice}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Fast Preset Amount Buttons */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] text-slate-500 font-medium">
                      {collectingItem.type === 'card' ? 'हफ्ता रक्कम निवडा (Weekly Amount):' : 'उधारी रक्कम निवडा:'}
                    </span>
                    <span className="text-[11px] font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                      निवड: ₹{paymentAmount.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {(collectingItem.type === 'card'
                      ? [100, 200, 500, 1000]
                      : [500, 1000, 2000, collectingItem.dueAmount > 0 ? collectingItem.dueAmount : 3000]
                    ).map((amt, idx) => {
                      const isSelected = paymentAmount === amt;
                      const isFullDue = collectingItem.type === 'khata' && idx === 3 && collectingItem.dueAmount > 0;
                      return (
                        <button
                          key={`${amt}-${idx}`}
                          type="button"
                          onClick={() => setPaymentAmount(amt)}
                          className={`py-2.5 px-1 rounded-xl text-xs font-black border transition cursor-pointer flex flex-col items-center justify-center gap-0.5 touch-manipulation active:scale-95 ${
                            isSelected
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-500/40'
                              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                          }`}
                        >
                          <span className="text-sm">{isFullDue ? `पूर्ण ₹${amt}` : `₹${amt}`}</span>
                          {isSelected && (
                            <span className="text-[9px] text-white/90 leading-none">✓ फिक्स</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Amount, Receipt No & Mode */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] text-slate-500 block mb-1 font-medium">इतर रक्कम (₹)</span>
                    <input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(Number(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block mb-1 font-medium">पेमेंट पद्धत</span>
                    <select
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value as 'Cash' | 'Online')}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                    >
                      <option value="Cash">💵 रोख (Cash)</option>
                      <option value="Online">📱 PhonePe/UPI</option>
                    </select>
                  </div>
                </div>

                {/* Receipt Number Badge for Card */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-200 dark:border-slate-700/60">
                  <span>पावती क्रमांक:</span>
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                    {paymentReceiptNo || (collectingItem.type === 'card' ? 'CR-0001' : 'REC-001')}
                  </span>
                </div>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleConfirmCollection}
                  className={`w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition ${
                    isSubmitting ? 'opacity-70 cursor-not-allowed scale-98' : 'cursor-pointer active:scale-98'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>जमा नोंदवत आहे...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>पावती नोंदवा व खात्यात जमा करा (₹{paymentAmount})</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* WhatsApp Group Invite & Add Modal */}
      {showGroupModal && (
        <WhatsAppCardGroupInviteModal
          isOpen={showGroupModal}
          onClose={() => setShowGroupModal(false)}
          cardMembers={cardMembers}
          settings={settings}
        />
      )}
    </div>
  );
};
