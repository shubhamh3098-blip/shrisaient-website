import React, { useState, useMemo } from 'react';
import { 
  X, 
  Coins, 
  CheckCircle2, 
  AlertTriangle, 
  Printer, 
  MessageCircle, 
  Save, 
  DollarSign, 
  ArrowDownCircle, 
  ArrowUpCircle,
  Clock,
  UserCheck
} from 'lucide-react';
import { 
  TransactionEntry, 
  CardTransaction, 
  BillReceiptEntry, 
  ExpenseEntry, 
  DailyCashReconciliation 
} from '../types';

interface DailyCashReconciliationModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: TransactionEntry[];
  cardTransactions: CardTransaction[];
  billReceipts: BillReceiptEntry[];
  expenses: ExpenseEntry[];
  onSaveReconciliation?: (record: DailyCashReconciliation) => void;
  businessName: string;
  businessPhone: string;
}

export const DailyCashReconciliationModal: React.FC<DailyCashReconciliationModalProps> = ({
  isOpen,
  onClose,
  transactions = [],
  cardTransactions = [],
  billReceipts = [],
  expenses = [],
  onSaveReconciliation,
  businessName = 'Shri Sai Enterprises',
  businessPhone = '8766486915',
}) => {
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const [openingCash, setOpeningCash] = useState<number>(5000);
  const [closedBy, setClosedBy] = useState<string>('Shubham Shende (Owner)');
  const [notes, setNotes] = useState<string>('');

  // Denominations
  const [denominations, setDenominations] = useState({
    c500: 0,
    c200: 0,
    c100: 0,
    c50: 0,
    c20: 0,
    c10: 0,
    coins: 0,
  });

  // Calculate today's cash flows from system
  const { cashSales, cashSchemeDeposits, cashKhataReceipts, cashExpenses, expectedCash } = useMemo(() => {
    // 1. Sales cash
    const sales = transactions
      .filter((t) => t.date === todayStr && t.paymentMode === 'Cash')
      .reduce((sum, t) => sum + Number(t.payingNow || 0), 0);

    // 2. Card Scheme deposits cash
    const scheme = cardTransactions
      .filter((ct) => ct.date === todayStr && ct.paymentMode === 'Cash' && ct.type !== 'Refund')
      .reduce((sum, ct) => sum + Number(ct.amount || 0), 0);

    // 3. Khata receipts cash
    const receipts = billReceipts
      .filter((br) => br.date === todayStr && br.paymentMode === 'Cash')
      .reduce((sum, br) => sum + Number(br.amountPaid || 0), 0);

    // 4. Shop expenses cash
    const exp = expenses
      .filter((e) => e.date === todayStr && e.paymentMode === 'Cash')
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const expCash = openingCash + sales + scheme + receipts - exp;

    return {
      cashSales: sales,
      cashSchemeDeposits: scheme,
      cashKhataReceipts: receipts,
      cashExpenses: exp,
      expectedCash: expCash,
    };
  }, [transactions, cardTransactions, billReceipts, expenses, todayStr, openingCash]);

  // Calculate physical cash counted
  const physicalCash = useMemo(() => {
    return (
      denominations.c500 * 500 +
      denominations.c200 * 200 +
      denominations.c100 * 100 +
      denominations.c50 * 50 +
      denominations.c20 * 20 +
      denominations.c10 * 10 +
      denominations.coins
    );
  }, [denominations]);

  const discrepancy = physicalCash - expectedCash;

  if (!isOpen) return null;

  const handleDenomChange = (key: keyof typeof denominations, val: string) => {
    const num = Math.max(0, parseInt(val, 10) || 0);
    setDenominations((prev) => ({ ...prev, [key]: num }));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppReport = () => {
    const statusText = 
      discrepancy === 0 
        ? '✅ पूर्ण ताळेबंद जुळला (Perfectly Balanced)' 
        : discrepancy > 0 
        ? `⚠️ गल्ल्यात ₹${discrepancy} जास्त (Surplus)` 
        : `⚠️ गल्ल्यात ₹${Math.abs(discrepancy)} कमी (Shortage)`;

    const msg = 
`🏦 *श्री साई इंटरप्राइजेस - दैनिक गल्ला क्लोजिंग अहवाल* 🏦
📅 तारीख: ${new Date().toLocaleDateString('mr-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
👤 क्लोजिंग करणारा: *${closedBy}*

━━━━━━━━━━━━━━━━━━━━
💰 *कॅश इनफ्लो / आउटफ्लो (System Cash):*
• सकाळचा सुरुवातीचा गल्ला: ₹${openingCash.toLocaleString('en-IN')}
• (+) रोख विक्री (Sales): ₹${cashSales.toLocaleString('en-IN')}
• (+) रोख साप्ताहिक हप्ते: ₹${cashSchemeDeposits.toLocaleString('en-IN')}
• (+) रोख खाते पावती (Khata): ₹${cashKhataReceipts.toLocaleString('en-IN')}
• (-) रोख दुकान खर्च: ₹${cashExpenses.toLocaleString('en-IN')}
━━━━━━━━━━━━━━━━━━━━
📊 *अपेक्षित गल्ला (Expected Cash):* *₹${expectedCash.toLocaleString('en-IN')}*
💵 *प्रत्यक्ष मोजलेली रोख रक्कम (Physical):* *₹${physicalCash.toLocaleString('en-IN')}*
${statusText}

📋 *नोटांचा हिशोब (Denominations):*
• 500 x ${denominations.c500} = ₹${denominations.c500 * 500}
• 200 x ${denominations.c200} = ₹${denominations.c200 * 200}
• 100 x ${denominations.c100} = ₹${denominations.c100 * 100}
• 50 x ${denominations.c50} = ₹${denominations.c50 * 50}
• 20 x ${denominations.c20} = ₹${denominations.c20 * 20}
• 10 x ${denominations.c10} = ₹${denominations.c10 * 10}
• नाणी/इतर: ₹${denominations.coins}

नोंद: ${notes || 'काही नाही'}`;

    window.open(`https://wa.me/91${businessPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleSave = () => {
    if (onSaveReconciliation) {
      const rec: DailyCashReconciliation = {
        id: `cash-rec-${Date.now()}`,
        date: todayStr,
        openingCash,
        cashSales,
        cashSchemeDeposits,
        cashKhataReceipts,
        cashExpenses,
        expectedCash,
        physicalCash,
        discrepancy,
        denominations: { ...denominations },
        closedBy,
        notes,
        createdAt: new Date().toISOString(),
      };
      onSaveReconciliation(rec);
    }
    alert('आजचा गल्ला क्लोजिंग अहवाल यशस्वीरित्या सेव्ह झाला!');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs no-print">
      <div className="bg-white dark:bg-[#0F172A] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-emerald-700 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-white">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                दैनिक गल्ला व कॅश क्लोजिंग रिपोर्ट (Cash Reconciliation)
              </h2>
              <p className="text-xs text-emerald-100">
                आजची रोख विक्री, हप्ते, खर्च व नोटांचा प्रत्यक्ष मेळ (Day-End Drawer Count)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* Top Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                सकाळचा सुरुवातीचा गल्ला (₹)
              </label>
              <input
                type="number"
                value={openingCash}
                onChange={(e) => setOpeningCash(Number(e.target.value) || 0)}
                className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                तारीख
              </label>
              <div className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/60 font-mono font-bold text-slate-800 dark:text-slate-200">
                {todayStr}
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                गल्ला क्लोज करणारा
              </label>
              <input
                type="text"
                value={closedBy}
                onChange={(e) => setClosedBy(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
              />
            </div>
          </div>

          {/* System Calculated Inflows / Outflows */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
              आजचे सिस्टीम रोख व्यवहार (System Cash Transactions Today):
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/40">
                <span className="text-[10px] text-blue-700 dark:text-blue-300 block font-semibold">+ रोख विक्री</span>
                <span className="text-sm font-black font-mono text-blue-900 dark:text-blue-200">₹{cashSales.toLocaleString()}</span>
              </div>

              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40">
                <span className="text-[10px] text-emerald-700 dark:text-emerald-300 block font-semibold">+ बचत हप्ते</span>
                <span className="text-sm font-black font-mono text-emerald-900 dark:text-emerald-200">₹{cashSchemeDeposits.toLocaleString()}</span>
              </div>

              <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/40">
                <span className="text-[10px] text-purple-700 dark:text-purple-300 block font-semibold">+ उधारी पावती</span>
                <span className="text-sm font-black font-mono text-purple-900 dark:text-purple-200">₹{cashKhataReceipts.toLocaleString()}</span>
              </div>

              <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40">
                <span className="text-[10px] text-rose-700 dark:text-rose-300 block font-semibold">- दुकान खर्च</span>
                <span className="text-sm font-black font-mono text-rose-900 dark:text-rose-200">₹{cashExpenses.toLocaleString()}</span>
              </div>
            </div>

            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold">
              <span className="text-slate-600 dark:text-slate-400">अपेक्षित रोख रक्कम (Expected Cash in Drawer):</span>
              <span className="text-base font-black text-slate-900 dark:text-white font-mono">
                ₹{expectedCash.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Denomination Counter (Physical Cash) */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-2">
              प्रत्यक्ष नोटांची मोजणी (Physical Currency Count):
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { label: '₹५०० नोटा', key: 'c500', mult: 500 },
                { label: '₹२०० नोटा', key: 'c200', mult: 200 },
                { label: '₹१०० नोटा', key: 'c100', mult: 100 },
                { label: '₹५० नोटा', key: 'c50', mult: 50 },
                { label: '₹२० नोटा', key: 'c20', mult: 20 },
                { label: '₹१० नोटा', key: 'c10', mult: 10 },
              ].map((item) => (
                <div key={item.key} className="flex items-center gap-1.5 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-[11px] font-bold w-16 text-slate-700 dark:text-slate-300">{item.label}:</span>
                  <input
                    type="number"
                    min="0"
                    value={denominations[item.key as keyof typeof denominations]}
                    onChange={(e) => handleDenomChange(item.key as any, e.target.value)}
                    className="w-16 p-1 text-center font-mono font-bold rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                  <span className="text-[10px] text-slate-400 font-mono">
                    = ₹{(denominations[item.key as keyof typeof denominations] * item.mult).toLocaleString()}
                  </span>
                </div>
              ))}

              <div className="flex items-center gap-1.5 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 col-span-2">
                <span className="text-[11px] font-bold w-24 text-slate-700 dark:text-slate-300">नाणी / सुट्टे (Coins):</span>
                <input
                  type="number"
                  min="0"
                  value={denominations.coins}
                  onChange={(e) => handleDenomChange('coins', e.target.value)}
                  className="w-24 p-1 text-center font-mono font-bold rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
            </div>

            {/* Reconciliation Comparison Card */}
            <div className={`mt-3 p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
              discrepancy === 0
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-900 dark:text-emerald-200'
                : discrepancy > 0
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 text-amber-900 dark:text-amber-200'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-900 dark:text-rose-200'
            }`}>
              <div>
                <span className="text-[11px] font-bold block uppercase tracking-wider">प्रत्यक्ष मोजलेली रक्कम (Physical Count):</span>
                <span className="text-xl font-black font-mono">₹{physicalCash.toLocaleString('en-IN')}</span>
              </div>

              <div className="text-left sm:text-right">
                <div className="flex items-center gap-1 font-bold text-xs">
                  {discrepancy === 0 ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>ताळेबंद बरोबर आहे (Exact Match)</span>
                    </>
                  ) : discrepancy > 0 ? (
                    <>
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>गल्ल्यात जास्त: +₹{discrepancy.toLocaleString('en-IN')}</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      <span>गल्ल्यात कमी: -₹{Math.abs(discrepancy).toLocaleString('en-IN')}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              काही विशेष नोंद / टिप्पणी (Notes):
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="उदा. रात्री दुकानात ठेवलेली रक्कम ₹5,000, उर्वरित बँक खात्यात जमा."
              className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
          >
            बंद करा
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleWhatsAppReport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-white font-bold text-xs shadow-2xs transition cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-white" />
              <span>WhatsApp अहवाल</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-2xs transition cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>क्लोजिंग सेव्ह करा</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
