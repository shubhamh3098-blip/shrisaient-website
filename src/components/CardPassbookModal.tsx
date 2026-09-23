import React, { useState, useMemo } from 'react';
import {
  Share2,
  Printer,
  MessageCircle,
  MapPin,
  FileText,
  CheckCircle2,
  X,
  Phone,
  User,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Package,
  RotateCcw,
  Calendar,
  Sparkles,
  Calculator,
  QrCode,
  Download,
  AlertCircle
} from 'lucide-react';
import { CardMember, CardTransaction, BusinessSettings, TransactionEntry } from '../types';
import { getSafeWhatsAppUrl, getNextReceiptNumber } from '../utils/numbering';

interface CardPassbookModalProps {
  member: CardMember;
  transactions: CardTransaction[];
  salesTransactions?: TransactionEntry[];
  settings: BusinessSettings;
  onClose?: () => void;
  onRecordTransaction?: (tx: Omit<CardTransaction, 'id' | 'createdAt'>) => void;
  onUpdateMember?: (id: string, updates: Partial<CardMember>) => void;
  onOpenFinanceCalculator?: () => void;
  isFullView?: boolean;
}

export const CardPassbookModal: React.FC<CardPassbookModalProps> = ({
  member,
  transactions,
  salesTransactions = [],
  settings,
  onClose,
  onRecordTransaction,
  onUpdateMember,
  onOpenFinanceCalculator,
  isFullView = false,
}) => {
  // Filter state for passbook table: All | Kab Diye (Credits) | Kab Liye (Debits/Goods/Refunds)
  const [activeFilter, setActiveFilter] = useState<'all' | 'credit' | 'debit'>('all');

  // Quick Inline Transaction Modals
  const [showAddTxModal, setShowAddTxModal] = useState<'deposit' | 'goods' | 'refund' | null>(null);
  const [txAmount, setTxAmount] = useState<string>('250');
  const [txWeekNumber, setTxWeekNumber] = useState<string>('');
  const [txGoodsDetail, setTxGoodsDetail] = useState<string>('');
  const [txReceiptNo, setTxReceiptNo] = useState<string>('');
  const [txPaymentMode, setTxPaymentMode] = useState<'Cash' | 'Online'>('Cash');
  const [txRemarks, setTxRemarks] = useState<string>('');
  const [txDate, setTxDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [txAgent, setTxAgent] = useState<string>(member.agentName || 'Kishor Bawankar');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txError, setTxError] = useState('');

  // Get member transactions sorted by date (Direct Card Transactions + Store Sales Invoices for goods taken)
  const rawMemberTransactions = useMemo(() => {
    // 1. Direct card transactions
    const directCardTx = transactions.filter(
      (t) =>
        Number(t.cardNumber) === Number(member.cardNumber) &&
        t.schemeId === member.schemeId
    );

    // 2. Sales / Goods invoices for this card member from regular store billing
    const normName = (member.customerName || '').trim().toLowerCase();
    const memberPhone = (member.phone || '').trim().replace(/\D/g, '');
    const memberCardNum = Number(member.cardNumber);

    const linkedSales = (salesTransactions || []).filter((s) => {
      // match by explicit card number
      if (s.cardNumber && Number(s.cardNumber) === memberCardNum) return true;
      // or match by customer name
      if (s.customerName) {
        const sName = s.customerName.trim().toLowerCase();
        if (sName === normName) return true;
        // Check partial match if at least 2 words match (e.g. "pari" and "nagpure")
        const memberWords = normName.split(/\s+/).filter(Boolean);
        const saleWords = sName.split(/\s+/).filter(Boolean);
        if (memberWords.length >= 2 && memberWords.every((w) => sName.includes(w))) return true;
        if (saleWords.length >= 2 && saleWords.every((w) => normName.includes(w))) return true;
      }
      // or match by phone
      if (memberPhone && memberPhone.length >= 8 && s.customerPhone) {
        const sPhone = s.customerPhone.trim().replace(/\D/g, '');
        if (sPhone.includes(memberPhone) || memberPhone.includes(sPhone)) return true;
      }
      return false;
    });

    const synthesizedGoodsTx: CardTransaction[] = [];
    linkedSales.forEach((sale) => {
      // Check if this sale is already recorded in directCardTx to avoid duplicates
      const alreadyInCardTx = directCardTx.some(
        (ctx) =>
          ctx.receiptNo === sale.invoiceNo ||
          (ctx.type === 'GoodsTaken' && ctx.date === sale.date && ctx.amount === sale.totalAmount)
      );

      if (!alreadyInCardTx) {
        const itemDesc =
          sale.itemDetails ||
          (sale.itemsDetail && sale.itemsDetail.length > 0
            ? sale.itemsDetail.map((i) => `${i.productName || 'वस्तू'} x${i.quantity || 1}`).join(', ')
            : 'गृहोपयोगी वस्तू / साहित्य');

        synthesizedGoodsTx.push({
          id: `sale-goods-${sale.id}`,
          cardId: member.id,
          cardNumber: member.cardNumber,
          schemeId: member.schemeId,
          customerName: member.customerName,
          customerPhone: member.phone || sale.customerPhone,
          receiptNo: sale.invoiceNo || `BILL-${sale.id.slice(-6)}`,
          date: sale.date,
          type: 'GoodsTaken',
          amount: sale.totalAmount || 0,
          paymentMode: sale.paymentMode || 'Cash',
          agentName: sale.agentName || member.agentName || 'Store Billing',
          remarks: `वस्तू उचल / विक्री बिल: ${itemDesc} (बिल #${sale.invoiceNo})`,
          goodsDetail: itemDesc,
          balanceAfter: 0,
          createdAt: sale.createdAt || sale.date,
        });
      }
    });

    return [...directCardTx, ...synthesizedGoodsTx].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [transactions, salesTransactions, member]);

  // Calculate Running Bank Passbook Balance
  const transactionsWithRunningBalance = useMemo(() => {
    let running = 0;
    return rawMemberTransactions.map((tx) => {
      const isDeposit = tx.type === 'WeeklyPayment' || tx.type === 'Deposit' || tx.type === 'Fee';
      const isDebit = tx.type === 'Refund' || tx.type === 'GoodsTaken';
      
      if (isDeposit) {
        running += (tx.amount || 0);
      } else if (isDebit) {
        running -= (tx.amount || 0);
      }

      return {
        ...tx,
        isDeposit,
        isDebit,
        runningBalance: running,
      };
    });
  }, [rawMemberTransactions]);

  // Totals
  const totalDeposited = useMemo(() => {
    return transactionsWithRunningBalance
      .filter((t) => t.isDeposit)
      .reduce((sum, t) => sum + (t.amount || 0), 0);
  }, [transactionsWithRunningBalance]);

  const totalGoodsAndRefunds = useMemo(() => {
    return transactionsWithRunningBalance
      .filter((t) => t.isDebit)
      .reduce((sum, t) => sum + (t.amount || 0), 0);
  }, [transactionsWithRunningBalance]);

  const currentNetSavings = totalDeposited - totalGoodsAndRefunds;

  // 52-week or 30-month scheme target calculation
  const totalTargetWeeks = 52;
  const weeksPaidCount = rawMemberTransactions.filter((t) => t.type === 'WeeklyPayment').length;
  const progressPercent = Math.min(100, Math.round((weeksPaidCount / totalTargetWeeks) * 100));

  // Overdue Due
  // If goods taken > deposited, deficit is due. Or target (e.g. 52 weeks * 250 = ₹13,000) minus deposited.
  const targetTotalScheme = totalTargetWeeks * 250; // typical 52 weeks @ 250 = 13,000
  const overdueDue = currentNetSavings < 0 
    ? Math.abs(currentNetSavings) + Math.max(0, targetTotalScheme - totalDeposited)
    : Math.max(0, targetTotalScheme - totalDeposited);

  // Filtered rows for the view
  const displayTransactions = useMemo(() => {
    if (activeFilter === 'credit') {
      return transactionsWithRunningBalance.filter((t) => t.isDeposit);
    }
    if (activeFilter === 'debit') {
      return transactionsWithRunningBalance.filter((t) => t.isDebit);
    }
    return transactionsWithRunningBalance;
  }, [transactionsWithRunningBalance, activeFilter]);

  // Handle Recording New Passbook Entry
  const handleSaveQuickTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !onRecordTransaction) return;
    setTxError('');

    const amt = parseFloat(txAmount);
    if (isNaN(amt) || amt <= 0) {
      setTxError('कृपया योग्य रक्कम प्रविष्ट करा (Please enter a valid amount).');
      return;
    }

    setIsSubmitting(true);

    const type = showAddTxModal === 'goods' 
      ? 'GoodsTaken' 
      : showAddTxModal === 'refund' 
      ? 'Refund' 
      : 'WeeklyPayment';

    const defaultReceipt = showAddTxModal === 'goods'
      ? `SSE/BILL/${Date.now().toString().slice(-6)}`
      : showAddTxModal === 'refund'
      ? `SSE/RET/${Date.now().toString().slice(-6)}`
      : getNextReceiptNumber(transactions);

    const newBalanceAfter = type === 'WeeklyPayment'
      ? currentNetSavings + amt
      : currentNetSavings - amt;

    onRecordTransaction({
      cardId: member.id,
      cardNumber: member.cardNumber,
      schemeId: member.schemeId,
      customerName: member.customerName,
      customerPhone: member.phone,
      receiptNo: txReceiptNo || defaultReceipt,
      date: txDate,
      type: type as any,
      weekNumber: txWeekNumber ? parseInt(txWeekNumber, 10) : undefined,
      amount: amt,
      paymentMode: txPaymentMode,
      agentName: txAgent,
      remarks: txRemarks || (showAddTxModal === 'goods' ? `साहित्य / वस्तू: ${txGoodsDetail}` : undefined),
      goodsDetail: txGoodsDetail || undefined,
      balanceAfter: newBalanceAfter,
    });

    // Update card member totals if callback available
    if (onUpdateMember) {
      if (type === 'WeeklyPayment') {
        onUpdateMember(member.id, {
          totalDeposited: totalDeposited + amt,
          netBalance: currentNetSavings + amt,
        });
      } else if (type === 'Refund') {
        onUpdateMember(member.id, {
          totalRefunded: (member.totalRefunded || 0) + amt,
          netBalance: currentNetSavings - amt,
        });
      } else if (type === 'GoodsTaken') {
        onUpdateMember(member.id, {
          totalGoodsTaken: (member.totalGoodsTaken || 0) + amt,
          netBalance: currentNetSavings - amt,
        });
      }
    }

    setShowAddTxModal(null);
    setTxAmount('250');
    setTxGoodsDetail('');
    setTxRemarks('');
    setTxReceiptNo('');
    setTimeout(() => {
      setIsSubmitting(false);
    }, 600);
  };

  // WhatsApp Passbook Statement
  const handleShareWhatsApp = () => {
    const passbookUrl = `${window.location.origin}/?passbook=${member.cardNumber}`;
    const text = encodeURIComponent(
      `*${settings.businessName}*\n` +
      `*अधिकृत पासबुक खातेवही (Bank-Style Card Passbook)*\n` +
      `--------------------------------\n` +
      `👤 ग्राहक नाव: *${member.customerName}*\n` +
      `💳 कार्ड नंबर: *#${member.cardNumber}* (${member.schemeName})\n` +
      (member.village ? `📍 गाव: ${member.village}\n` : '') +
      (member.sheetNo ? `📑 बुक रेफरन्स: ${member.sheetNo}\n` : '') +
      (member.agentName ? `🧑‍💼 प्रतिनिधी / एजंट: ${member.agentName}\n` : '') +
      `--------------------------------\n` +
      `✅ *एकूण जमा (KAB DIYE): ₹${totalDeposited.toLocaleString('en-IN')}*\n` +
      `🛍️ *एकूण उचल / सामान (KAB LIYE): ₹${totalGoodsAndRefunds.toLocaleString('en-IN')}*\n` +
      `💰 *शिल्लक बाकी (NET BALANCE): ₹${currentNetSavings.toLocaleString('en-IN')}*\n` +
      `⏳ *प्रलंबित हप्ता (DUE): ₹${overdueDue.toLocaleString('en-IN')}*\n` +
      `📊 योजना प्रगती: *${weeksPaidCount} of 52 हप्ते जमा (${progressPercent}%)*\n` +
      `--------------------------------\n` +
      `👉 *अधिकृत कार्डधारक WhatsApp ग्रुप:* ${settings.whatsappGroupLink || 'https://chat.whatsapp.com/CLcaeUq1bHH1RE0203oPaP?s=cl&p=a&mlu=4&ilr=4'}\n` +
      `🔗 डिजिटल पासबुक लिंक: ${passbookUrl}\n` +
      `तारीख: ${new Date().toISOString().split('T')[0]}\n` +
      `दुकान: ${settings.address}\n` +
      `संपर्क: ${settings.phone} / 8766486915`
    );
    const url = getSafeWhatsAppUrl(member.phone, text);
    window.open(url, '_blank');
  };

  return (
    <div
      className={
        isFullView
          ? 'w-full space-y-4 print:p-0 print:m-0 print:static print:bg-white'
          : 'fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:m-0 print:static print:bg-white'
      }
    >
      <div
        id="printable-passbook"
        className={
          isFullView
            ? 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full p-4 sm:p-6 space-y-5 shadow-sm print:p-4 print:shadow-none print:border-none text-slate-800 dark:text-slate-100'
            : 'bg-white rounded-3xl max-w-5xl w-full p-4 sm:p-6 space-y-5 shadow-2xl my-auto print:my-0 print:p-4 print:shadow-none print:border-none print:max-w-none text-slate-800'
        }
      >
        {/* Printable Passbook Official Letterhead */}
        <div className="hidden print:block border-b-2 border-slate-900 pb-3 text-center mb-3">
          <h2 className="text-2xl font-black tracking-wide font-serif text-slate-900">
            {settings.businessName} • अधिकृत पासबुक खातेवही
          </h2>
          <p className="text-xs text-slate-600 mt-0.5 font-medium">
            साप्ताहिक बचत कार्ड योजना • Wardha • मोबाईल: 8766486915 / {settings.phone}
          </p>
          <div className="flex justify-center gap-4 text-[10px] font-mono text-slate-600 mt-1">
            <span>GSTIN: 27AABCS1429B1Z8</span>
            <span>•</span>
            <span>तारीख: {new Date().toISOString().split('T')[0]}</span>
            <span>•</span>
            <span>कार्ड क्र: #{member.cardNumber}</span>
          </div>
        </div>

        {/* Modal Top Bar (WhatsApp, Print, Close) */}
        <div className="flex items-center justify-between no-print border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-bold text-slate-700 text-xs">
              डिजिटल बँक पासबुक लेजर (Bank Style Passbook)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onOpenFinanceCalculator && (
              <button
                type="button"
                onClick={onOpenFinanceCalculator}
                className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold flex items-center gap-1.5 border border-amber-300 cursor-pointer transition"
                title="बजाज / टीव्हीएस / एचडीबी फायनान्स कॅल्क्युलेटर उघडा"
              >
                <Calculator className="w-3.5 h-3.5 text-amber-700" />
                फायनान्स EMI
              </button>
            )}

            <a
              href={settings.whatsappGroupLink || 'https://chat.whatsapp.com/CLcaeUq1bHH1RE0203oPaP?s=cl&p=a&mlu=4&ilr=4'}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition"
              title="अधिकृत व्हॉट्सॲप ग्रुपमध्ये सामील व्हा"
            >
              <MessageCircle className="w-3.5 h-3.5 text-teal-600" />
              <span>ग्रुप जॉईन</span>
            </a>

            <button
              onClick={handleShareWhatsApp}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition active:scale-95"
            >
              <Share2 className="w-3.5 h-3.5" />
              WhatsApp
            </button>
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              Print A4
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 cursor-pointer"
                title="बंद करा"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* HERO HEADER CARD (Matches Screenshot Exactly) */}
        {/* ========================================================================= */}
        <div className="bg-gradient-to-r from-[#0a1426] via-[#0d1a33] to-[#0a1222] rounded-2xl p-4 sm:p-6 text-white shadow-xl border border-slate-800 relative overflow-hidden">
          {/* Top section: Left Member Info & QR | Right 4 KPI Summary Cards */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            {/* Left: QR Code Box + Member Badges & Details */}
            <div className="flex items-start gap-4">
              {/* QR Code Container */}
              <div className="bg-white p-2.5 rounded-2xl shadow-lg shrink-0 text-center border border-slate-200 w-24">
                {/* Crisp SVG QR Icon Pattern */}
                <div className="w-full aspect-square bg-slate-50 rounded-lg p-1.5 flex items-center justify-center border border-slate-200">
                  <svg viewBox="0 0 100 100" className="w-full h-full text-slate-900" fill="currentColor">
                    {/* QR Finder patterns */}
                    <path d="M0,0 h30 v30 h-30 z M5,5 v20 h20 v-20 z M10,10 h10 v10 h-10 z" />
                    <path d="M70,0 h30 v30 h-30 z M75,5 v20 h20 v-20 z M80,10 h10 v10 h-10 z" />
                    <path d="M0,70 h30 v30 h-30 z M5,75 v20 h20 v-20 z M10,80 h10 v10 h-10 z" />
                    {/* QR Data Dots */}
                    <rect x="38" y="8" width="6" height="6" />
                    <rect x="52" y="8" width="6" height="6" />
                    <rect x="38" y="20" width="6" height="6" />
                    <rect x="48" y="24" width="6" height="6" />
                    <rect x="12" y="42" width="6" height="6" />
                    <rect x="22" y="48" width="6" height="6" />
                    <rect x="40" y="40" width="8" height="8" />
                    <rect x="44" y="56" width="6" height="6" />
                    <rect x="60" y="42" width="6" height="6" />
                    <rect x="74" y="48" width="6" height="6" />
                    <rect x="88" y="42" width="6" height="6" />
                    <rect x="38" y="74" width="6" height="6" />
                    <rect x="52" y="82" width="6" height="6" />
                    <rect x="68" y="74" width="6" height="6" />
                    <rect x="80" y="86" width="6" height="6" />
                  </svg>
                </div>
                <div className="font-mono font-black text-[10px] text-slate-900 mt-1 uppercase tracking-tighter">
                  CARD #{member.cardNumber}
                </div>
                <div className="text-[8px] font-bold text-slate-400 tracking-wider">SCAN QR</div>
              </div>

              {/* Name & Details */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white font-mono font-bold text-xs">
                    ACCOUNT #{member.cardNumber}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold text-xs">
                    {member.schemeName}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Book Ref: {member.sheetNo || `S${member.schemeId?.replace('scheme', '') || '1'}-${String(member.cardNumber).padStart(3, '0')}`}
                  </span>
                </div>

                <h3 className="text-2xl font-black text-white tracking-tight">
                  {member.customerName}
                </h3>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                  <div className="flex items-center gap-1 text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>{member.village || member.address || 'Wardha Rural'}</span>
                  </div>
                  {member.phone && (
                    <div className="flex items-center gap-1 font-mono text-slate-300">
                      <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>+91 {member.phone}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-xs text-amber-300 font-medium pt-0.5">
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  <span>Agent: {member.agentName || 'Kishor Bawankar'}</span>
                </div>
              </div>
            </div>

            {/* Right: 4 KPI Cards (Matches Screenshot Exactly) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
              {/* 1. KAB DIYE (Credits) */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col justify-between min-w-[115px]">
                <span className="text-[11px] text-slate-400 font-medium block">
                  एकूण जमा (KAB DIYE)
                </span>
                <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono my-0.5">
                  ₹{totalDeposited.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-slate-400">Total Credits</span>
              </div>

              {/* 2. KAB LIYE (Debits / Goods & Refunds) */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col justify-between min-w-[115px]">
                <span className="text-[11px] text-slate-400 font-medium block">
                  एकूण उचल (KAB LIYE)
                </span>
                <span className="text-xl sm:text-2xl font-black text-rose-400 font-mono my-0.5">
                  ₹{totalGoodsAndRefunds.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-slate-400">Goods & Refunds</span>
              </div>

              {/* 3. BALANCE (Current Net Savings) */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col justify-between min-w-[115px]">
                <span className="text-[11px] text-slate-400 font-medium block">
                  शिल्लक बाकी (BALANCE)
                </span>
                <span className={`text-xl sm:text-2xl font-black font-mono my-0.5 ${
                  currentNetSavings >= 0 ? 'text-sky-400' : 'text-rose-400'
                }`}>
                  ₹{currentNetSavings.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-slate-400">Current Net Savings</span>
              </div>

              {/* 4. DUE (Overdue Due) */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col justify-between min-w-[115px]">
                <span className="text-[11px] text-slate-400 font-medium block">
                  प्रलंबित हप्ता (DUE)
                </span>
                <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono my-0.5">
                  ₹{overdueDue.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-slate-400">Overdue Due</span>
              </div>
            </div>
          </div>

          {/* Scheme Progress Bar (Matches Screenshot Exactly) */}
          <div className="mt-5 pt-4 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs font-bold mb-1.5">
              <div className="flex items-center gap-1.5 text-amber-300">
                <Calendar className="w-4 h-4 text-amber-400" />
                <span>५२-आठवडे योजना प्रगती (52-Week Scheme Progress):</span>
                <span className="text-white font-mono">{weeksPaidCount} of 52 Weeks Paid</span>
              </div>
              <div className="text-emerald-400 font-mono">{progressPercent}% Complete</div>
            </div>

            <div className="h-2 rounded-full bg-slate-800/90 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 via-emerald-400 to-teal-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(4, progressPercent)}%` }}
              />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* QUICK ACTION BUTTONS BAR */}
        {/* ========================================================================= */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 no-print">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 mr-1">
              त्वरित नोंदी (Quick Entries):
            </span>

            {/* Button 1: Add Weekly Deposit */}
            <button
              type="button"
              onClick={() => {
                setShowAddTxModal('deposit');
                setTxAmount('250');
                setTxWeekNumber(String(weeksPaidCount + 1));
              }}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              + साप्ताहिक हप्ता जमा
            </button>

            {/* Button 2: Issue Goods / Vastu Taken */}
            <button
              type="button"
              onClick={() => {
                setShowAddTxModal('goods');
                setTxAmount('1000');
                setTxGoodsDetail('Orient Ceiling Fan / Mixer');
              }}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition active:scale-95"
            >
              <Package className="w-3.5 h-3.5" />
              + वस्तू / साहित्य उचल (Goods)
            </button>

            {/* Button 3: Return / Refund Amount */}
            <button
              type="button"
              onClick={() => {
                setShowAddTxModal('refund');
                setTxAmount('1000');
              }}
              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              + रक्कम परत / रिफंड (Return)
            </button>
          </div>

          <div className="text-xs text-slate-500 font-mono">
            नोंदी: <span className="font-bold text-slate-800">{transactionsWithRunningBalance.length}</span>
          </div>
        </div>

        {/* Quick Transaction Inline Form / Popover */}
        {showAddTxModal && (
          <form
            onSubmit={handleSaveQuickTransaction}
            className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 shadow-lg space-y-3 no-print animate-fade-in"
          >
            <div className="flex items-center justify-between pb-2 border-b border-amber-200">
              <h4 className="font-bold text-sm text-amber-950 dark:text-amber-200 flex items-center gap-2">
                {showAddTxModal === 'deposit' && <ArrowDownLeft className="w-4 h-4 text-emerald-600" />}
                {showAddTxModal === 'goods' && <Package className="w-4 h-4 text-blue-600" />}
                {showAddTxModal === 'refund' && <RotateCcw className="w-4 h-4 text-rose-600" />}
                <span>
                  {showAddTxModal === 'deposit' && 'नवीन आठवडा हप्ता / रक्कम जमा करा (Kab Diye)'}
                  {showAddTxModal === 'goods' && 'वस्तू / साहित्य उचल नोंदवा (Kab Liye - Goods Taken)'}
                  {showAddTxModal === 'refund' && 'ग्राहकास रक्कम परत / रिफंड नोंदवा (Kab Liye - Return Amount)'}
                </span>
              </h4>
              <button
                type="button"
                onClick={() => setShowAddTxModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {txError && (
              <div className="p-2.5 rounded-xl bg-rose-100 border border-rose-300 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{txError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  रक्कम (Amount ₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    required
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    placeholder="250"
                    className="w-full pl-6 pr-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-bold font-mono outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {showAddTxModal === 'deposit' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    हप्ता क्र. (Week No.)
                  </label>
                  <input
                    type="number"
                    value={txWeekNumber}
                    onChange={(e) => setTxWeekNumber(e.target.value)}
                    placeholder={String(weeksPaidCount + 1)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-bold font-mono outline-none"
                  />
                </div>
              )}

              {showAddTxModal === 'goods' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    वस्तूचे नाव व तपशील (Appliance Details) *
                  </label>
                  <input
                    type="text"
                    required
                    value={txGoodsDetail}
                    onChange={(e) => setTxGoodsDetail(e.target.value)}
                    placeholder="उदा. Orient Ceiling Fan / Mixer"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-medium outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  पावती / बिल क्र. (Ref No)
                </label>
                <input
                  type="text"
                  value={txReceiptNo}
                  onChange={(e) => setTxReceiptNo(e.target.value)}
                  placeholder="Auto generated if empty"
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  तारीख (Date)
                </label>
                <input
                  type="date"
                  value={txDate}
                  onChange={(e) => setTxDate(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-mono outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-4 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="pmode"
                    checked={txPaymentMode === 'Cash'}
                    onChange={() => setTxPaymentMode('Cash')}
                  />
                  <span>रोख (Cash)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="pmode"
                    checked={txPaymentMode === 'Online'}
                    onChange={() => setTxPaymentMode('Online')}
                  />
                  <span>ऑनलाइन (UPI / Bank)</span>
                </label>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddTxModal(null)}
                  className="px-3 py-1.5 rounded-xl bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  रद्द करा
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md transition ${
                    isSubmitting ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer active:scale-95'
                  }`}
                >
                  {isSubmitting ? 'जतन होत आहे...' : 'नोंद जतन करा (Save Entry)'}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* DETAILED ACCOUNT STATEMENT TABLE (Matches Screenshot Exactly) */}
        {/* ========================================================================= */}
        <div className="space-y-3">
          {/* Table Header with Filter Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm sm:text-base font-bold text-slate-900">
                  तपशीलवार पासबुक लेजर (Detailed Account Statement)
                </h4>
                <span className="text-[11px] text-slate-500 font-mono font-medium">
                  Showing {displayTransactions.length} Records
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Official timeline showing every deposit made (&quot;Kab Diye&quot;) and every product or refund taken (&quot;Kab Liye&quot;)
              </p>
            </div>

            {/* Filter Tabs (Matches Screenshot) */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl no-print text-xs font-semibold">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  activeFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                सर्व नोंदी (All)
              </button>
              <button
                onClick={() => setActiveFilter('credit')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  activeFilter === 'credit'
                    ? 'bg-white text-emerald-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                केवल जमा (Kab Diye)
              </button>
              <button
                onClick={() => setActiveFilter('debit')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  activeFilter === 'debit'
                    ? 'bg-white text-rose-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                केवल उचल / सामान (Kab Liye)
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto max-h-[380px] overflow-y-auto print:max-h-none print:overflow-visible">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 sticky top-0 print:static z-10">
                  <tr>
                    <th className="p-3 print:p-2 whitespace-nowrap">तारीख (DATE)</th>
                    <th className="p-3 print:p-2 whitespace-nowrap">पावती / बिल क्र. (REF NO)</th>
                    <th className="p-3 print:p-2">तपशील (PARTICULARS &amp; GOODS DETAIL)</th>
                    <th className="p-3 print:p-2">प्रकार (TYPE)</th>
                    <th className="p-3 print:p-2 text-right whitespace-nowrap">जमा रक्कम ₹ (KAB DIYE)</th>
                    <th className="p-3 print:p-2 text-right whitespace-nowrap">नावे / उचल ₹ (KAB LIYE)</th>
                    <th className="p-3 print:p-2 text-right whitespace-nowrap">शिल्लक ₹ (RUNNING BALANCE)</th>
                    <th className="p-3 print:p-2 whitespace-nowrap">स्वाक्षरी / प्रतिनिधी (AGENT)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayTransactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-50/80 transition-colors print:break-inside-avoid"
                    >
                      {/* Date */}
                      <td className="p-3 print:p-2 font-mono text-[11px] text-slate-700 whitespace-nowrap">
                        {tx.date}
                      </td>

                      {/* Ref No */}
                      <td className="p-3 print:p-2 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        {tx.receiptNo}
                      </td>

                      {/* Particulars & Goods Details */}
                      <td className="p-3 print:p-2 text-slate-800">
                        <div className="font-medium">
                          {tx.remarks ||
                            (tx.type === 'Fee'
                              ? `Passbook Account Opened (${member.schemeName} Registration)`
                              : tx.type === 'WeeklyPayment'
                              ? `Week #${tx.weekNumber || '1'} Installment Deposit`
                              : tx.type === 'GoodsTaken'
                              ? `Goods Issued: ${tx.goodsDetail || 'Appliance'}`
                              : 'Customer Refund / Return Payout')}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Mode: {tx.paymentMode || 'Cash'}
                          {tx.goodsDetail && ` • Item: ${tx.goodsDetail}`}
                        </div>
                      </td>

                      {/* Type Badge */}
                      <td className="p-3 print:p-2 whitespace-nowrap">
                        {tx.isDeposit ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px] inline-flex items-center gap-1">
                            <span>↙</span> जमा (CREDIT)
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[10px] inline-flex items-center gap-1">
                            <span>↗</span> उचल / नावे (DEBIT)
                          </span>
                        )}
                      </td>

                      {/* Kab Diye (Deposit Amount) */}
                      <td className="p-3 print:p-2 text-right font-mono font-bold whitespace-nowrap">
                        {tx.isDeposit ? (
                          <span className="text-emerald-600">
                            +₹{(tx.amount || 0).toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* Kab Liye (Goods / Refund Amount) */}
                      <td className="p-3 print:p-2 text-right font-mono font-bold whitespace-nowrap">
                        {tx.isDebit ? (
                          <span className="text-rose-600">
                            -₹{(tx.amount || 0).toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* Running Balance */}
                      <td className="p-3 print:p-2 text-right font-mono font-black text-slate-900 whitespace-nowrap">
                        ₹{(tx.runningBalance || 0).toLocaleString('en-IN')}
                      </td>

                      {/* Agent */}
                      <td className="p-3 print:p-2 text-slate-600 text-[11px] whitespace-nowrap">
                        {tx.agentName || member.agentName || 'Kishor Bawankar'}
                      </td>
                    </tr>
                  ))}

                  {displayTransactions.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="font-bold text-sm">कोणतीही नोंद आढळली नाही</p>
                        <p className="text-xs mt-1">
                          प्रारंभिक शिल्लक: ₹{member.openingAmt || 0}. वरील बटनाने पहिली नोंद जमा करा.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Printable Passbook Footer */}
        <div className="hidden print:flex items-end justify-between pt-8 border-t border-slate-300 text-xs mt-6">
          <div>
            <p className="text-slate-700 text-[11px] font-semibold">
              ५२ आठवडे किंवा ३० महिने मुदत संपल्यावर नियमानुसार गृहोपयोगी साहित्य किंवा भेटवस्तू दिली जाईल.
            </p>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">
              {settings.businessName} • संपर्क: 8766486915 / {settings.phone}
            </p>
          </div>
          <div className="text-center">
            <div className="h-8 w-36 border-b-2 border-dashed border-slate-700 mx-auto"></div>
            <p className="text-[11px] font-black text-slate-900 mt-1">अधिकृत स्वाक्षरी व शिक्का</p>
            <p className="text-[9px] text-slate-500 font-serif">{settings.businessName}</p>
          </div>
        </div>

        {/* Close Button in Footer */}
        {onClose && (
          <div className="flex justify-end pt-2 no-print">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer transition"
            >
              पासबुक बंद करा (Close Passbook)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
