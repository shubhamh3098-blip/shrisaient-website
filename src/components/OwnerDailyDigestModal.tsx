import React, { useMemo } from 'react';
import { 
  X, 
  Send, 
  MessageCircle, 
  Printer, 
  TrendingUp, 
  CreditCard, 
  Users, 
  Receipt, 
  ReceiptIndianRupee, 
  Calendar,
  CheckCircle2,
  Sparkles,
  Share2
} from 'lucide-react';
import { 
  TransactionEntry, 
  CardTransaction, 
  BillReceiptEntry, 
  ExpenseEntry, 
  BusinessSettings 
} from '../types';

interface OwnerDailyDigestModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: TransactionEntry[];
  cardTransactions: CardTransaction[];
  billReceipts: BillReceiptEntry[];
  expenses: ExpenseEntry[];
  settings: BusinessSettings;
}

export const OwnerDailyDigestModal: React.FC<OwnerDailyDigestModalProps> = ({
  isOpen,
  onClose,
  transactions = [],
  cardTransactions = [],
  billReceipts = [],
  expenses = [],
  settings,
}) => {
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const summary = useMemo(() => {
    // 1. Invoices today
    const todaysTx = transactions.filter((t) => t.date === todayStr);
    const totalSalesGross = todaysTx.reduce((sum, t) => sum + Number(t.totalAmount || 0), 0);
    const totalSalesCollected = todaysTx.reduce((sum, t) => sum + Number(t.payingNow || 0), 0);
    const cashSales = todaysTx.filter((t) => t.paymentMode === 'Cash').reduce((sum, t) => sum + Number(t.payingNow || 0), 0);
    const onlineSales = todaysTx.filter((t) => t.paymentMode === 'Online').reduce((sum, t) => sum + Number(t.payingNow || 0), 0);

    // 2. Card Scheme Collections today
    const todaysCardTx = cardTransactions.filter((ct) => ct.date === todayStr && ct.type !== 'Refund');
    const totalCardDeposits = todaysCardTx.reduce((sum, ct) => sum + Number(ct.amount || 0), 0);
    const cashCardDeposits = todaysCardTx.filter((ct) => ct.paymentMode === 'Cash').reduce((sum, ct) => sum + Number(ct.amount || 0), 0);
    const onlineCardDeposits = todaysCardTx.filter((ct) => ct.paymentMode === 'Online').reduce((sum, ct) => sum + Number(ct.amount || 0), 0);

    // 3. Bill Receipts (Khata recoveries)
    const todaysReceipts = billReceipts.filter((br) => br.date === todayStr);
    const totalKhataReceipts = todaysReceipts.reduce((sum, br) => sum + Number(br.amountPaid || 0), 0);
    const cashKhata = todaysReceipts.filter((br) => br.paymentMode === 'Cash').reduce((sum, br) => sum + Number(br.amountPaid || 0), 0);
    const onlineKhata = todaysReceipts.filter((br) => br.paymentMode === 'Online').reduce((sum, br) => sum + Number(br.amountPaid || 0), 0);

    // 4. Expenses today
    const todaysExpenses = expenses.filter((e) => e.date === todayStr);
    const totalExpenses = todaysExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

    // Totals
    const totalInflow = totalSalesCollected + totalCardDeposits + totalKhataReceipts;
    const totalCashInflow = cashSales + cashCardDeposits + cashKhata;
    const totalOnlineInflow = onlineSales + onlineCardDeposits + onlineKhata;
    const netCashInHand = totalCashInflow - totalExpenses;

    return {
      todaysTxCount: todaysTx.length,
      totalSalesGross,
      totalSalesCollected,
      cashSales,
      onlineSales,
      todaysCardCount: todaysCardTx.length,
      totalCardDeposits,
      cashCardDeposits,
      onlineCardDeposits,
      todaysReceiptsCount: todaysReceipts.length,
      totalKhataReceipts,
      cashKhata,
      onlineKhata,
      totalExpenses,
      totalInflow,
      totalCashInflow,
      totalOnlineInflow,
      netCashInHand,
    };
  }, [transactions, cardTransactions, billReceipts, expenses, todayStr]);

  if (!isOpen) return null;

  const handleSendWhatsAppToOwner = () => {
    const ownerPhone = settings.phone || '8766486915';
    const dateFormatted = new Date().toLocaleDateString('mr-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const msg = 
`📊 *श्री साई इंटरप्राइजेस - दैनिक व्यवसाय अहवाल (Owner Daily Digest)* 📊
📅 तारीख: ${dateFormatted}
📍 आर्वी रोड, पंजाब कॉलनी, वर्धा

━━━━━━━━━━━━━━━━━━━━
📈 *आजची एकूण आवक (Total Inflow):* *₹${summary.totalInflow.toLocaleString('en-IN')}*
💵 एकूण रोख जमा (Cash): ₹${summary.totalCashInflow.toLocaleString('en-IN')}
📱 एकूण डिजिटल/UPI जमा: ₹${summary.totalOnlineInflow.toLocaleString('en-IN')}
━━━━━━━━━━━━━━━━━━━━

1️⃣ *दुकान विक्री (Shop Sales):*
• एकूण बिले: ${summary.todaysTxCount} बिले
• आजची एकूण विक्री: ₹${summary.totalSalesGross.toLocaleString('en-IN')}
• बिलांमधून जमा रक्कम: *₹${summary.totalSalesCollected.toLocaleString('en-IN')}*

2️⃣ *३०-महिने साप्ताहिक बचत योजना:*
• जमा झालेले हप्ते: ${summary.todaysCardCount} पावत्या
• एकूण जमा रक्कम: *₹${summary.totalCardDeposits.toLocaleString('en-IN')}*

3️⃣ *ग्राहक उधारी वसुली (Khata Receipts):*
• एकूण जमा पावत्या: ${summary.todaysReceiptsCount} पावत्या
• वसूल झालेली रक्कम: *₹${summary.totalKhataReceipts.toLocaleString('en-IN')}*

4️⃣ *दुकान खर्च (Expenses):*
• आजचा एकूण खर्च: *₹${summary.totalExpenses.toLocaleString('en-IN')}*

━━━━━━━━━━━━━━━━━━━━
💼 *आजचा निव्वळ गल्ला (Net Cash in Hand):* *₹${summary.netCashInHand.toLocaleString('en-IN')}*
━━━━━━━━━━━━━━━━━━━━
श्री साई इंटरप्राइजेस क्लाउड ईआरपी द्वारे स्वयंचलित तयार.`;

    window.open(`https://wa.me/91${ownerPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs no-print">
      <div className="bg-white dark:bg-[#0F172A] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300 font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                दैनिक व्यवसाय अहवाल (Owner Daily Digest)
              </h2>
              <p className="text-xs text-slate-300">
                आजची एकूण विक्री, साप्ताहिक हप्ते, उधारी वसुली व खर्च सारांश
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
          {/* Top Date & Gross Hero Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white shadow-md">
            <div className="flex items-center justify-between text-xs text-indigo-200 mb-1">
              <span className="flex items-center gap-1 font-medium">
                <Calendar className="w-3.5 h-3.5" />
                {new Date().toLocaleDateString('mr-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 font-mono text-[10px]">
                {settings.businessName}
              </span>
            </div>

            <div className="mt-2">
              <span className="text-[11px] font-bold text-indigo-200 uppercase tracking-wider block">
                आजची एकूण आवक (Total Money Inflow)
              </span>
              <div className="text-2xl sm:text-3xl font-black font-mono text-amber-300 mt-0.5">
                ₹{summary.totalInflow.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-indigo-700/50 flex items-center justify-between text-xs">
              <div>
                <span className="text-indigo-200 block text-[10px]">रोख आवक (Cash):</span>
                <span className="font-bold text-white font-mono">₹{summary.totalCashInflow.toLocaleString()}</span>
              </div>
              <div className="text-right">
                <span className="text-indigo-200 block text-[10px]">डिजिटल आवक (UPI/Bank):</span>
                <span className="font-bold text-white font-mono">₹{summary.totalOnlineInflow.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Breakdown Rows */}
          <div className="space-y-2">
            {/* Sales */}
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <strong className="text-slate-900 dark:text-white font-bold block">दुकान विक्री (Shop Sales)</strong>
                  <span className="text-slate-400 text-[11px]">{summary.todaysTxCount} नवीन बिले तयार</span>
                </div>
              </div>
              <div className="text-right">
                <span className="font-bold text-slate-900 dark:text-white text-sm font-mono block">
                  ₹{summary.totalSalesCollected.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-slate-400">विक्री मूल्य: ₹{summary.totalSalesGross.toLocaleString()}</span>
              </div>
            </div>

            {/* Scheme Cards */}
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <strong className="text-slate-900 dark:text-white font-bold block">साप्ताहिक बचत हप्ते (Card Scheme)</strong>
                  <span className="text-slate-400 text-[11px]">{summary.todaysCardCount} सभासदांचे हप्ते जमा</span>
                </div>
              </div>
              <div className="text-right">
                <span className="font-bold text-emerald-700 dark:text-emerald-400 text-sm font-mono block">
                  ₹{summary.totalCardDeposits.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-slate-400">योजना १ ते ५</span>
              </div>
            </div>

            {/* Khata Receipts */}
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <strong className="text-slate-900 dark:text-white font-bold block">उधारी पावती जमा (Khata Receipts)</strong>
                  <span className="text-slate-400 text-[11px]">{summary.todaysReceiptsCount} ग्राहकांची जुनी बाकी जमा</span>
                </div>
              </div>
              <div className="text-right">
                <span className="font-bold text-purple-700 dark:text-purple-400 text-sm font-mono block">
                  ₹{summary.totalKhataReceipts.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-slate-400">खातेवही वसूली</span>
              </div>
            </div>

            {/* Expenses */}
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 flex items-center justify-center">
                  <ReceiptIndianRupee className="w-4 h-4" />
                </div>
                <div>
                  <strong className="text-slate-900 dark:text-white font-bold block">दुकान खर्च (Shop Expenses)</strong>
                  <span className="text-slate-400 text-[11px]">चहा-नाश्ता, वाहतूक, मेंटेनन्स</span>
                </div>
              </div>
              <div className="text-right">
                <span className="font-bold text-rose-700 dark:text-rose-400 text-sm font-mono block">
                  - ₹{summary.totalExpenses.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-slate-400">खर्च वजा</span>
              </div>
            </div>
          </div>

          {/* Bottom Net Cash highlight */}
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <span className="font-bold text-slate-800 dark:text-slate-200">
              आजचा शिल्लक रोख गल्ला (Net Cash in Hand):
            </span>
            <span className="text-lg font-black text-emerald-700 dark:text-emerald-400 font-mono">
              ₹{summary.netCashInHand.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between gap-2 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
          >
            बंद करा
          </button>

          <button
            type="button"
            onClick={handleSendWhatsAppToOwner}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-white font-bold text-xs shadow-md transition cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            <span>शुभमजींना (Owner) WhatsApp अहवाल पाठवा</span>
          </button>
        </div>
      </div>
    </div>
  );
};
