import React, { useState } from 'react';
import { 
  Share2, 
  Printer, 
  MapPin, 
  FileText, 
  CheckCircle2, 
  X, 
  ShoppingBag, 
  Receipt, 
  Wallet, 
  Calendar, 
  ArrowDownLeft, 
  ArrowUpRight,
  TrendingUp,
  CreditCard,
  Building2,
  Check
} from 'lucide-react';
import { CardMember, CardTransaction, BusinessSettings, TransactionEntry } from '../types';

interface CardPassbookModalProps {
  member: CardMember;
  transactions: CardTransaction[];
  settings: BusinessSettings;
  salesBills?: TransactionEntry[];
  onClose: () => void;
}

export const CardPassbookModal: React.FC<CardPassbookModalProps> = ({
  member,
  transactions,
  settings,
  salesBills = [],
  onClose,
}) => {
  const [activeViewTab, setActiveViewTab] = useState<'all' | 'weekly' | 'purchases' | 'receipts'>('all');
  const [copiedNotice, setCopiedNotice] = useState<string | null>(null);

  // Filter weekly savings transactions for this card member
  const memberTransactions = transactions
    .filter(
      (t) =>
        (t.cardNumber === member.cardNumber && t.schemeId === member.schemeId) ||
        (t.cardNumber === member.cardNumber && !t.schemeId)
    )
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Filter purchases (saman kharida bill) matching this card number or customer name
  const memberBills = (salesBills || [])
    .filter((b) => {
      const matchCard = b.cardNumber && Number(b.cardNumber) === Number(member.cardNumber);
      const matchName = b.customerName && member.customerName && 
        b.customerName.trim().toLowerCase() === member.customerName.trim().toLowerCase();
      const matchPhone = b.customerPhone && member.phone && 
        b.customerPhone.replace(/\D/g, '') === member.phone.replace(/\D/g, '') &&
        member.phone.length > 5;
      return matchCard || matchName || matchPhone;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Calculations
  const totalSchemeDeposited = member.totalDeposited ?? memberTransactions
    .filter((t) => t.type === 'WeeklyPayment' || t.type === 'Fee')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalSchemeRefunded = member.totalRefunded ?? memberTransactions
    .filter((t) => t.type === 'Refund')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const netSavingsBalance = member.netBalance ?? (totalSchemeDeposited - totalSchemeRefunded);

  // Total Goods Purchased
  const totalGoodsPurchased = memberBills.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const totalBillPaidDirectly = memberBills.reduce((sum, b) => sum + (b.payingNow || 0), 0);
  const totalBillDueRemaining = memberBills.reduce((sum, b) => sum + (b.dueAmount || 0), 0);

  // Net Ledger Balance Calculation
  // Net Balance = (Total Goods Purchased - Total Bills Paid) - Net Scheme Savings Available
  const netOutstandingBalance = Math.max(0, totalBillDueRemaining - netSavingsBalance);
  const excessCreditInAccount = Math.max(0, netSavingsBalance - totalBillDueRemaining);

  // Trigger notice flash
  const triggerNotice = (msg: string) => {
    setCopiedNotice(msg);
    setTimeout(() => setCopiedNotice(null), 3500);
  };

  // 1. Share Only Weekly Savings Passbook
  const handleShareWeeklyPassbook = () => {
    const lines = memberTransactions.map(
      (t, idx) => `• ${t.date} | ${t.type === 'WeeklyPayment' ? `Wk ${t.weekNumber || idx+1}` : t.type}: ₹${t.amount}`
    ).slice(-10).join('\n');

    const text = encodeURIComponent(
      `*${settings.businessName || 'SHRI SAI ENTERPRISES'}*\n` +
      `*साप्ताहिक बचत योजना पासबुक (Weekly Savings Passbook)*\n` +
      `--------------------------------\n` +
      `👤 Member: *${member.customerName}*\n` +
      `💳 Card No: *#${member.cardNumber}* (${member.schemeName || 'Scheme'})\n` +
      (member.village ? `📍 Village: ${member.village}\n` : '') +
      (member.sheetNo ? `📄 Sheet No: #${member.sheetNo}\n` : '') +
      `--------------------------------\n` +
      `💰 Total Savings Deposited: *₹${totalSchemeDeposited.toLocaleString()}*\n` +
      (totalSchemeRefunded > 0 ? `🔻 Total Refunded/Used: ₹${totalSchemeRefunded.toLocaleString()}\n` : '') +
      `✨ *Current Savings Balance: ₹${netSavingsBalance.toLocaleString()}*\n` +
      `--------------------------------\n` +
      `📅 Recent Weekly Deposits:\n` +
      (lines || 'Initial Card Entry recorded') + `\n` +
      `--------------------------------\n` +
      `📞 Contact / WhatsApp: ${settings.phone || '8766486915'}\n` +
      `📍 Shop: Arvi Road, Wardha`
    );

    const phone = member.phone ? member.phone.replace(/[^0-9]/g, '') : '';
    const url = phone ? `https://wa.me/91${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
    triggerNotice('Weekly Savings Passbook sent to WhatsApp!');
  };

  // 2. Share Goods Purchase & Bills Ledger
  const handleShareBillsReceipts = () => {
    const billLines = memberBills.map(
      (b) => `• Bill #${b.invoiceNo} (${b.date}): Total ₹${b.totalAmount} | Paid ₹${b.payingNow} | Due ₹${b.dueAmount}`
    ).join('\n');

    const text = encodeURIComponent(
      `*${settings.businessName || 'SHRI SAI ENTERPRISES'}*\n` +
      `*सामान खरेदी व बिल खाते (Goods Purchase & Bills Ledger)*\n` +
      `--------------------------------\n` +
      `👤 Customer: *${member.customerName}*\n` +
      `💳 Card No: *#${member.cardNumber}*\n` +
      (member.village ? `📍 Village: ${member.village}\n` : '') +
      `--------------------------------\n` +
      `📦 Total Purchase: *₹${totalGoodsPurchased.toLocaleString()}*\n` +
      `💵 Direct Payments: *₹${totalBillPaidDirectly.toLocaleString()}*\n` +
      `⚖️ Bill Balance Due: *₹${totalBillDueRemaining.toLocaleString()}*\n` +
      `--------------------------------\n` +
      `📋 Invoices Details:\n` +
      (billLines || 'No separate sales bills recorded.') + `\n` +
      `--------------------------------\n` +
      `📞 Contact: ${settings.phone || '8766486915'}\n` +
      `📍 ${settings.address || 'Wardha, Maharashtra'}`
    );

    const phone = member.phone ? member.phone.replace(/[^0-9]/g, '') : '';
    const url = phone ? `https://wa.me/91${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
    triggerNotice('Bills & Invoices Ledger sent to WhatsApp!');
  };

  // 3. Share Complete 360° Passbook Statement (Bachat + Purchase + Net Balance)
  const handleShareCompleteStatement = () => {
    const text = encodeURIComponent(
      `*${settings.businessName || 'SHRI SAI ENTERPRISES'}*\n` +
      `*ग्राहक संपूर्ण पासबुक व लेजर (360° Complete Statement)*\n` +
      `--------------------------------\n` +
      `👤 Name: *${member.customerName}*\n` +
      `💳 Card No: *#${member.cardNumber}* (${member.schemeName || 'Scheme'})\n` +
      (member.phone ? `📞 Phone: ${member.phone}\n` : '') +
      (member.village ? `📍 Village: ${member.village}\n` : '') +
      (member.sheetNo ? `📄 Sheet No: #${member.sheetNo}\n` : '') +
      `--------------------------------\n` +
      `📊 *1. साप्ताहिक बचत योजना (Weekly Scheme):*\n` +
      `   • Total Scheme Savings: ₹${totalSchemeDeposited.toLocaleString()}\n` +
      `   • Scheme Refunded/Used: ₹${totalSchemeRefunded.toLocaleString()}\n` +
      `   • *Available Savings: ₹${netSavingsBalance.toLocaleString()}*\n\n` +
      `📦 *2. सामान खरेदी व उधारी (Goods Purchase & Bills):*\n` +
      `   • Total Saman Purchase: ₹${totalGoodsPurchased.toLocaleString()}\n` +
      `   • Direct Cash/Receipts Paid: ₹${totalBillPaidDirectly.toLocaleString()}\n` +
      `   • Bill Balance Due: ₹${totalBillDueRemaining.toLocaleString()}\n\n` +
      `--------------------------------\n` +
      (netOutstandingBalance > 0
        ? `⚠️ *अंतिम बाकी रक्कम (Net Payable Due): ₹${netOutstandingBalance.toLocaleString()}*\n   (Total Due ₹${totalBillDueRemaining} - Savings Adjusted ₹${netSavingsBalance})`
        : `✅ *अकाउंट स्टेटस: खात्यात शिल्लक जमा आहे (Excess Credit: ₹${excessCreditInAccount.toLocaleString()})*`
      ) + `\n` +
      `--------------------------------\n` +
      `Date: ${new Date().toISOString().split('T')[0]}\n` +
      `Shop: ${settings.address || 'Shri Sai Enterprises, Arvi Road, Wardha'}\n` +
      `Phone: ${settings.phone || '8766486915'}`
    );

    const phone = member.phone ? member.phone.replace(/[^0-9]/g, '') : '';
    const url = phone ? `https://wa.me/91${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
    triggerNotice('Complete Statement sent to WhatsApp!');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full p-4 sm:p-6 space-y-5 shadow-2xl my-auto max-h-[94vh] flex flex-col border border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-lg bg-blue-700 dark:bg-blue-600 text-white font-mono font-bold text-sm shadow-xs">
                Card #{member.cardNumber}
              </span>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-xl tracking-tight">
                {member.customerName}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                {member.schemeName}
              </span>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium flex flex-wrap items-center gap-2">
              {member.phone && <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">📞 {member.phone}</span>}
              {member.village && (
                <span className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded font-semibold text-[11px] border border-emerald-200 dark:border-emerald-800 inline-flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {member.village}
                </span>
              )}
              {member.sheetNo && (
                <span className="bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded font-semibold text-[11px] border border-purple-200 dark:border-purple-800 font-mono inline-flex items-center gap-1">
                  <FileText className="w-3 h-3" /> Sheet #{member.sheetNo}
                </span>
              )}
              <span className="text-slate-400 dark:text-slate-500 text-[11px]">
                Joined: {member.joiningDate} • Reg Fee: ₹50 (Paid)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Print Passbook"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notice Alert */}
        {copiedNotice && (
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{copiedNotice}</span>
          </div>
        )}

        {/* 3-Way WhatsApp Sharing Action Bar */}
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-blue-950/30 border border-emerald-200 dark:border-emerald-800/60 p-3 rounded-xl shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
              <Share2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Send To Customer WhatsApp (ग्राहक निवडून पाठवा):</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleShareWeeklyPassbook}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95"
                title="Send only weekly deposit dates & amounts"
              >
                <Calendar className="w-3.5 h-3.5" />
                1. Weekly Passbook
              </button>

              <button
                onClick={handleShareBillsReceipts}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95"
                title="Send purchased items, bills and balance due"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                2. Goods & Bills
              </button>

              <button
                onClick={handleShareCompleteStatement}
                className="px-3.5 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-800 hover:bg-black dark:hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95 border border-slate-700"
                title="Complete bank style statement with both Savings + Saman Kharidi"
              >
                <Wallet className="w-3.5 h-3.5 text-amber-400" />
                3. Full 360° Statement
              </button>
            </div>
          </div>
        </div>

        {/* Financial Summary Cards (Bank Passbook Style) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-850 rounded-xl">
            <span className="text-emerald-700 dark:text-emerald-400 font-medium block text-[11px] flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> साप्ताहिक बचत जमा (Savings)
            </span>
            <span className="text-lg font-black text-emerald-800 dark:text-emerald-300 mt-0.5 block">
              ₹{totalSchemeDeposited.toLocaleString()}
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
              {memberTransactions.length} Weekly entries
            </span>
          </div>

          <div className="p-3 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-850 rounded-xl">
            <span className="text-blue-700 dark:text-blue-400 font-medium block text-[11px] flex items-center gap-1">
              <ShoppingBag className="w-3 h-3" /> एकूण सामान खरेदी (Purchased)
            </span>
            <span className="text-lg font-black text-blue-800 dark:text-blue-300 mt-0.5 block">
              ₹{totalGoodsPurchased.toLocaleString()}
            </span>
            <span className="text-[10px] text-blue-600 dark:text-blue-400">
              {memberBills.length} Bill Invoices
            </span>
          </div>

          <div className="p-3 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-850 rounded-xl">
            <span className="text-amber-700 dark:text-amber-400 font-medium block text-[11px] flex items-center gap-1">
              <Receipt className="w-3 h-3" /> बिल बाकी / उधारी (Bill Due)
            </span>
            <span className="text-lg font-black text-amber-800 dark:text-amber-300 mt-0.5 block">
              ₹{totalBillDueRemaining.toLocaleString()}
            </span>
            <span className="text-[10px] text-amber-600 dark:text-amber-400">
              Paid on Bill: ₹{totalBillPaidDirectly.toLocaleString()}
            </span>
          </div>

          <div className={`p-3 rounded-xl border ${
            netOutstandingBalance > 0 
              ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200' 
              : 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
          }`}>
            <span className="font-semibold block text-[11px] flex items-center gap-1">
              <Wallet className="w-3 h-3" /> अंतिम शुद्ध बाकी (Net Due)
            </span>
            <span className={`text-lg font-black mt-0.5 block ${netOutstandingBalance > 0 ? 'text-rose-700 dark:text-rose-300' : 'text-emerald-700 dark:text-emerald-300'}`}>
              {netOutstandingBalance > 0 ? `₹${netOutstandingBalance.toLocaleString()}` : `₹0 (जमा: ₹${excessCreditInAccount.toLocaleString()})`}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
              {netOutstandingBalance > 0 ? 'Customer owes shop' : 'Account is clear / credit'}
            </span>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <button
            onClick={() => setActiveViewTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeViewTab === 'all'
                ? 'bg-slate-900 dark:bg-slate-750 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All Ledger Records ({memberTransactions.length + memberBills.length})
          </button>
          <button
            onClick={() => setActiveViewTab('weekly')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeViewTab === 'weekly'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Weekly Scheme Deposits ({memberTransactions.length})
          </button>
          <button
            onClick={() => setActiveViewTab('purchases')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeViewTab === 'purchases'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Saman Purchase Bills ({memberBills.length})
          </button>
        </div>

        {/* Main Passbook Ledger Table */}
        <div className="flex-1 overflow-hidden border border-slate-200 dark:border-slate-800 rounded-xl">
          <div className="overflow-y-auto max-h-[46vh]">
            <table className="w-full text-left text-sm sm:text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold sticky top-0 border-b border-slate-200 dark:border-slate-700 text-xs sm:text-[11px]">
                <tr>
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5">Type & Ref</th>
                  <th className="p-2.5">Particulars / Details</th>
                  <th className="p-2.5 text-right">Debit (Saman / Return)</th>
                  <th className="p-2.5 text-right">Credit (Jama / Deposit)</th>
                  <th className="p-2.5 text-right">Net Available</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {/* 1. Show Weekly Transactions */}
                {(activeViewTab === 'all' || activeViewTab === 'weekly') && memberTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                    <td className="p-2.5 font-mono text-xs sm:text-[11px] text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {tx.date}
                    </td>
                    <td className="p-2.5">
                      <span
                        className={`px-2 py-0.5 rounded text-xs sm:text-[10px] font-bold ${
                          tx.type === 'WeeklyPayment'
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : tx.type === 'Refund'
                            ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                            : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                        }`}
                      >
                        {tx.type === 'WeeklyPayment'
                          ? `Week ${tx.weekNumber || ''}`
                          : tx.type === 'Refund'
                          ? 'Refund / Return'
                          : 'Opening Fee'}
                      </span>
                      <span className="block text-xs sm:text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                        {tx.receiptNo}
                      </span>
                    </td>
                    <td className="p-2.5 text-slate-700 dark:text-slate-300 text-sm sm:text-xs">
                      {tx.remarks ||
                        (tx.type === 'Fee'
                          ? 'Registration & Card opening fee'
                          : tx.type === 'WeeklyPayment'
                          ? 'Weekly Savings Installment'
                          : 'Customer refund')}
                      {tx.agentName && <span className="text-xs sm:text-[10px] text-slate-400 dark:text-slate-500 block">Agent: {tx.agentName}</span>}
                    </td>
                    <td className="p-2.5 text-right font-bold text-rose-600 dark:text-rose-400 text-base sm:text-xs">
                      {tx.type === 'Refund' ? `₹${(tx.amount ?? 0).toLocaleString()}` : '-'}
                    </td>
                    <td className="p-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400 text-base sm:text-xs">
                      {tx.type !== 'Refund' ? `₹${(tx.amount ?? 0).toLocaleString()}` : '-'}
                    </td>
                    <td className="p-2.5 text-right font-bold text-slate-900 dark:text-white font-mono text-base sm:text-xs">
                      ₹{(tx.balanceAfter ?? tx.amount ?? 0).toLocaleString()}
                    </td>
                  </tr>
                ))}

                {/* 2. Show Purchase Bills */}
                {(activeViewTab === 'all' || activeViewTab === 'purchases') && memberBills.map((b) => (
                  <tr key={b.id} className="bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors">
                    <td className="p-2.5 font-mono text-xs sm:text-[11px] text-blue-900 dark:text-blue-300 whitespace-nowrap">
                      {b.date}
                    </td>
                    <td className="p-2.5">
                      <span className="px-2 py-0.5 rounded text-xs sm:text-[10px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 inline-flex items-center gap-1">
                        <ShoppingBag className="w-2.5 h-2.5" /> सामान बिल
                      </span>
                      <span className="block text-xs sm:text-[10px] text-blue-700 dark:text-blue-400 font-mono mt-0.5 font-bold">
                        #{b.invoiceNo}
                      </span>
                    </td>
                    <td className="p-2.5 text-slate-800 dark:text-slate-200 text-sm sm:text-xs">
                      <div className="font-semibold">{b.itemDetails || 'Electronics / Appliances Item'}</div>
                      <div className="text-xs sm:text-[10px] text-slate-500 dark:text-slate-400 flex gap-2 mt-0.5">
                        <span>Paid: ₹{b.payingNow.toLocaleString()}</span>
                        <span className="text-amber-700 dark:text-amber-400 font-semibold">Due: ₹{b.dueAmount.toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="p-2.5 text-right font-extrabold text-blue-800 dark:text-blue-300 text-base sm:text-xs">
                      ₹{b.totalAmount.toLocaleString()}
                    </td>
                    <td className="p-2.5 text-right font-bold text-emerald-700 dark:text-emerald-400 text-base sm:text-xs">
                      {b.payingNow > 0 ? `₹${b.payingNow.toLocaleString()}` : '-'}
                    </td>
                    <td className="p-2.5 text-right font-bold text-rose-700 dark:text-rose-400 font-mono text-base sm:text-xs">
                      Due: ₹{b.dueAmount.toLocaleString()}
                    </td>
                  </tr>
                ))}

                {memberTransactions.length === 0 && memberBills.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 dark:text-slate-500">
                      <Wallet className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                      <p className="font-medium text-slate-600 dark:text-slate-300">No transactions or bills recorded yet.</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">Opening balance: ₹{member.openingAmt || member.netBalance || 0}</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
          <div className="text-slate-500 dark:text-slate-400 font-medium">
            Member ID: <span className="font-mono text-slate-700 dark:text-slate-200 font-bold">{member.uniqueId || `CARD-${member.cardNumber}`}</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 dark:bg-slate-750 text-white rounded-xl text-xs font-bold hover:bg-black dark:hover:bg-slate-700 cursor-pointer transition-all shadow-xs"
          >
            Close Statement
          </button>
        </div>

      </div>
    </div>
  );
};
