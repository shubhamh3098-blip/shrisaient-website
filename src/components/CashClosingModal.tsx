import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Coins,
  CheckCircle2,
  AlertTriangle,
  Share2,
  Save,
  Calendar,
  ArrowDownRight,
  ArrowUpRight,
  FileText,
  Clock,
  History
} from 'lucide-react';
import {
  TransactionEntry,
  CardTransaction,
  ExpenseEntry,
  DealerPayment,
  StaffMember,
  BusinessSettings,
  DailyCashClosing
} from '../types';

interface CashClosingModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: TransactionEntry[];
  cardTransactions: CardTransaction[];
  expenses: ExpenseEntry[];
  dealerPayments?: DealerPayment[];
  staff?: StaffMember[];
  settings: BusinessSettings;
  activeUserName?: string;
  onShowToast?: (msg: string, type: 'success' | 'info' | 'error') => void;
}

export const CashClosingModal: React.FC<CashClosingModalProps> = ({
  isOpen,
  onClose,
  transactions,
  cardTransactions,
  expenses,
  dealerPayments = [],
  staff = [],
  settings,
  activeUserName = 'Admin (Shubham)',
  onShowToast,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [activeTab, setActiveTab] = useState<'today' | 'history'>('today');

  // Denominations State
  const [denom500, setDenom500] = useState<number>(0);
  const [denom200, setDenom200] = useState<number>(0);
  const [denom100, setDenom100] = useState<number>(0);
  const [denom50, setDenom50] = useState<number>(0);
  const [denom20, setDenom20] = useState<number>(0);
  const [denom10, setDenom10] = useState<number>(0);
  const [denomCoins, setDenomCoins] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');

  // Stored Closings History
  const [closingHistory, setClosingHistory] = useState<DailyCashClosing[]>(() => {
    try {
      const saved = localStorage.getItem('shri_sai_daily_closings');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Calculate Cash Flows for the selected date
  const cashSales = useMemo(() => {
    return transactions
      .filter((t) => t.date === selectedDate && t.paymentMode === 'Cash')
      .reduce((sum, t) => sum + (Number(t.payingNow) || 0), 0);
  }, [transactions, selectedDate]);

  const cardCashPayments = useMemo(() => {
    return cardTransactions
      .filter(
        (c) =>
          c.date === selectedDate &&
          c.paymentMode === 'Cash' &&
          (c.type === 'WeeklyPayment' || c.type === 'Fee')
      )
      .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  }, [cardTransactions, selectedDate]);

  const cashExpenses = useMemo(() => {
    return expenses
      .filter((e) => e.date === selectedDate && e.paymentMode === 'Cash')
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [expenses, selectedDate]);

  const cashDealerPayments = useMemo(() => {
    return dealerPayments
      .filter((d) => d.date === selectedDate && d.paymentMode === 'Cash')
      .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  }, [dealerPayments, selectedDate]);

  const cashRefunds = useMemo(() => {
    return cardTransactions
      .filter(
        (c) =>
          c.date === selectedDate &&
          c.paymentMode === 'Cash' &&
          c.type === 'Refund'
      )
      .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  }, [cardTransactions, selectedDate]);

  // Total Cash In & Total Cash Out
  const totalCashIn = cashSales + cardCashPayments;
  const totalCashOut = cashExpenses + cashDealerPayments + cashRefunds;
  const expectedCashInDrawer = totalCashIn - totalCashOut;

  // Total Counted Cash from denominations
  const totalCountedCash = useMemo(() => {
    return (
      denom500 * 500 +
      denom200 * 200 +
      denom100 * 100 +
      denom50 * 50 +
      denom20 * 20 +
      denom10 * 10 +
      denomCoins
    );
  }, [denom500, denom200, denom100, denom50, denom20, denom10, denomCoins]);

  const difference = totalCountedCash - expectedCashInDrawer;

  // Load existing closing if already saved for this date
  useEffect(() => {
    const existing = closingHistory.find((c) => c.date === selectedDate);
    if (existing) {
      setDenom500(existing.denominations.note500 || 0);
      setDenom200(existing.denominations.note200 || 0);
      setDenom100(existing.denominations.note100 || 0);
      setDenom50(existing.denominations.note50 || 0);
      setDenom20(existing.denominations.note20 || 0);
      setDenom10(existing.denominations.note10 || 0);
      setDenomCoins(existing.denominations.coins || 0);
      setNotes(existing.notes || '');
    } else {
      setDenom500(0);
      setDenom200(0);
      setDenom100(0);
      setDenom50(0);
      setDenom20(0);
      setDenom10(0);
      setDenomCoins(0);
      setNotes('');
    }
  }, [selectedDate, closingHistory]);

  if (!isOpen) return null;

  const handleSaveClosing = () => {
    const newClosing: DailyCashClosing = {
      id: `closing_${selectedDate}_${Date.now()}`,
      date: selectedDate,
      expectedCash: expectedCashInDrawer,
      countedCash: totalCountedCash,
      difference,
      denominations: {
        note500: denom500,
        note200: denom200,
        note100: denom100,
        note50: denom50,
        note20: denom20,
        note10: denom10,
        coins: denomCoins,
      },
      cashSales,
      cardCashPayments,
      cashExpenses,
      cashAdvances: 0,
      cashDealerPayments,
      cashRefunds,
      closedBy: activeUserName,
      notes,
      createdAt: new Date().toISOString(),
    };

    const updated = [newClosing, ...closingHistory.filter((c) => c.date !== selectedDate)];
    setClosingHistory(updated);
    try {
      localStorage.setItem('shri_sai_daily_closings', JSON.stringify(updated));
    } catch (e) {}

    if (onShowToast) {
      onShowToast(`✓ ${selectedDate} चा गल्ला बंद यशस्वीरित्या सेव्ह केला!`, 'success');
    }
  };

  const handleShareWhatsApp = () => {
    const statusText =
      difference === 0
        ? '✅ गल्ला तंतोतंत जुळला (Perfect Match)'
        : difference > 0
        ? `⚠️ जास्तीची रोख (Surplus): +₹${difference.toLocaleString()}`
        : `❌ गल्ल्यात तूट (Shortage): -₹${Math.abs(difference).toLocaleString()}`;

    const text = encodeURIComponent(
      `*${settings.businessName || 'SHRI SAI ENTERPRISES'}*\n` +
      `🪙 *दुकान दैनिक गल्ला बंद अहवाल (Daily Cash Closing)*\n` +
      `--------------------------------\n` +
      `📅 तारीख: *${selectedDate}*\n` +
      `👤 हिशोब तपासक: *${activeUserName}*\n` +
      `--------------------------------\n` +
      `📥 *जमा रोख (Total Cash In): ₹${totalCashIn.toLocaleString()}*\n` +
      `  • दुकान रोख विक्री: ₹${cashSales.toLocaleString()}\n` +
      `  • कार्ड योजना रोख हप्ते: ₹${cardCashPayments.toLocaleString()}\n` +
      `--------------------------------\n` +
      `📤 *गेलेली रोख (Total Cash Out): ₹${totalCashOut.toLocaleString()}*\n` +
      `  • दुकान दैनिक खर्च: ₹${cashExpenses.toLocaleString()}\n` +
      `  • डीलर रोख पेमेंट्स: ₹${cashDealerPayments.toLocaleString()}\n` +
      `  • कार्ड परतावा / विथड्रॉल: ₹${cashRefunds.toLocaleString()}\n` +
      `--------------------------------\n` +
      `⚖️ *सिस्टीमप्रमाणे अपेक्षित रोख:* *₹${expectedCashInDrawer.toLocaleString()}*\n` +
      `💵 *गल्ल्यात प्रत्यक्ष मोजलेली रोख:* *₹${totalCountedCash.toLocaleString()}*\n` +
      `📊 *फरक (Status):* *${statusText}*\n` +
      `--------------------------------\n` +
      `🔢 *नोटा तपशील (Denominations):*\n` +
      (denom500 > 0 ? `  ₹500 x ${denom500} = ₹${denom500 * 500}\n` : '') +
      (denom200 > 0 ? `  ₹200 x ${denom200} = ₹${denom200 * 200}\n` : '') +
      (denom100 > 0 ? `  ₹100 x ${denom100} = ₹${denom100 * 100}\n` : '') +
      (denom50 > 0 ? `  ₹50 x ${denom50} = ₹${denom50 * 50}\n` : '') +
      (denom20 > 0 ? `  ₹20 x ${denom20} = ₹${denom20 * 20}\n` : '') +
      (denom10 > 0 ? `  ₹10 x ${denom10} = ₹${denom10 * 10}\n` : '') +
      (denomCoins > 0 ? `  नाणी (Coins) = ₹${denomCoins}\n` : '') +
      (notes ? `📝 टीप: ${notes}\n` : '') +
      `--------------------------------\n` +
      `📍 आर्वी रोड, वर्धा • 📞 8766486915`
    );

    const ownerPhone = settings.phone ? settings.phone.replace(/[^0-9]/g, '') : '8766486915';
    window.open(`https://wa.me/91${ownerPhone}?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto text-slate-800 dark:text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>दैनिक गल्ला बंद व कॅश पडताळणी</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-medium">
                  Day-End Closing
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                दुकान बंद करताना रोख आवक, खर्च आणि गल्ल्यातील नोटांची प्रत्यक्ष मोजणी
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-bar: Date & Tabs */}
        <div className="px-4 sm:px-6 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-800/30 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('today')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                activeTab === 'today'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              गल्ला हिशोब (Today's Cash)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1 ${
                activeTab === 'history'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>मागील इतिहास ({closingHistory.length})</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {activeTab === 'today' ? (
            <>
              {/* Summary Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Cash In */}
                <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300 mb-1">
                    <span className="flex items-center gap-1">
                      <ArrowDownRight className="w-4 h-4 text-emerald-600" />
                      एकूण जमा रोख (Cash In)
                    </span>
                    <span>₹{totalCashIn.toLocaleString()}</span>
                  </div>
                  <div className="text-[11px] space-y-0.5 text-slate-600 dark:text-slate-400 pt-1 border-t border-emerald-200/60 dark:border-emerald-900/40">
                    <div className="flex justify-between">
                      <span>दुकान रोख विक्री:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">₹{cashSales.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>कार्ड हप्ते जमा:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">₹{cardCashPayments.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Cash Out */}
                <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20">
                  <div className="flex items-center justify-between text-xs font-bold text-rose-800 dark:text-rose-300 mb-1">
                    <span className="flex items-center gap-1">
                      <ArrowUpRight className="w-4 h-4 text-rose-600" />
                      एकूण खर्च/गेलेली रोख (Cash Out)
                    </span>
                    <span>₹{totalCashOut.toLocaleString()}</span>
                  </div>
                  <div className="text-[11px] space-y-0.5 text-slate-600 dark:text-slate-400 pt-1 border-t border-rose-200/60 dark:border-rose-900/40">
                    <div className="flex justify-between">
                      <span>दुकान खर्च:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">₹{cashExpenses.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>डीलर रोख पेमेंट्स:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">₹{cashDealerPayments.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>कार्ड परतावा / विथड्रॉल:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">₹{cashRefunds.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Net Expected Cash */}
                <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-blue-800 dark:text-blue-300 block mb-1">
                      सिस्टीमप्रमाणे गल्ल्यात अपेक्षित रोख
                    </span>
                    <p className="text-xl sm:text-2xl font-black text-blue-900 dark:text-blue-200">
                      ₹{expectedCashInDrawer.toLocaleString()}
                    </p>
                  </div>
                  <p className="text-[11px] text-blue-700/80 dark:text-blue-400 mt-2">
                    (जमा रोख ₹{totalCashIn.toLocaleString()} - खर्च ₹{totalCashOut.toLocaleString()})
                  </p>
                </div>
              </div>

              {/* Denomination Input Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-850/40">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center justify-between">
                  <span>प्रत्यक्ष नोटा मोजणी (Cash Denominations)</span>
                  <span className="text-[11px] font-normal text-slate-500">गल्ल्यातील प्रत्येक नोट मोजून संख्या टाका</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  {/* ₹500 */}
                  <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                    <label className="font-bold text-slate-700 dark:text-slate-200 flex justify-between mb-1">
                      <span>₹500 x</span>
                      <span className="text-emerald-600 font-bold">₹{(denom500 * 500).toLocaleString()}</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={denom500 || ''}
                      onChange={(e) => setDenom500(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      placeholder="0"
                      className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-600 rounded-md font-mono text-sm bg-transparent"
                    />
                  </div>

                  {/* ₹200 */}
                  <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                    <label className="font-bold text-slate-700 dark:text-slate-200 flex justify-between mb-1">
                      <span>₹200 x</span>
                      <span className="text-emerald-600 font-bold">₹{(denom200 * 200).toLocaleString()}</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={denom200 || ''}
                      onChange={(e) => setDenom200(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      placeholder="0"
                      className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-600 rounded-md font-mono text-sm bg-transparent"
                    />
                  </div>

                  {/* ₹100 */}
                  <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                    <label className="font-bold text-slate-700 dark:text-slate-200 flex justify-between mb-1">
                      <span>₹100 x</span>
                      <span className="text-emerald-600 font-bold">₹{(denom100 * 100).toLocaleString()}</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={denom100 || ''}
                      onChange={(e) => setDenom100(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      placeholder="0"
                      className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-600 rounded-md font-mono text-sm bg-transparent"
                    />
                  </div>

                  {/* ₹50 */}
                  <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                    <label className="font-bold text-slate-700 dark:text-slate-200 flex justify-between mb-1">
                      <span>₹50 x</span>
                      <span className="text-emerald-600 font-bold">₹{(denom50 * 50).toLocaleString()}</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={denom50 || ''}
                      onChange={(e) => setDenom50(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      placeholder="0"
                      className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-600 rounded-md font-mono text-sm bg-transparent"
                    />
                  </div>

                  {/* ₹20 */}
                  <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                    <label className="font-bold text-slate-700 dark:text-slate-200 flex justify-between mb-1">
                      <span>₹20 x</span>
                      <span className="text-emerald-600 font-bold">₹{(denom20 * 20).toLocaleString()}</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={denom20 || ''}
                      onChange={(e) => setDenom20(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      placeholder="0"
                      className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-600 rounded-md font-mono text-sm bg-transparent"
                    />
                  </div>

                  {/* ₹10 */}
                  <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                    <label className="font-bold text-slate-700 dark:text-slate-200 flex justify-between mb-1">
                      <span>₹10 x</span>
                      <span className="text-emerald-600 font-bold">₹{(denom10 * 10).toLocaleString()}</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={denom10 || ''}
                      onChange={(e) => setDenom10(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      placeholder="0"
                      className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-600 rounded-md font-mono text-sm bg-transparent"
                    />
                  </div>

                  {/* Coins */}
                  <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 col-span-2">
                    <label className="font-bold text-slate-700 dark:text-slate-200 flex justify-between mb-1">
                      <span>नाणी व सुट्टे पैसे (Coins Total ₹)</span>
                      <span className="text-emerald-600 font-bold">₹{denomCoins.toLocaleString()}</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={denomCoins || ''}
                      onChange={(e) => setDenomCoins(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      placeholder="एकूण नाणी रक्कम"
                      className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-600 rounded-md font-mono text-sm bg-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Comparison & Difference Banner */}
              <div
                className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  totalCountedCash === 0
                    ? 'bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                    : difference === 0
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                    : difference > 0
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    {difference === 0 && totalCountedCash > 0 ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                    )}
                    <span className="text-sm font-bold">
                      {totalCountedCash === 0
                        ? 'कृपया वरील नोटांची संख्या भरा'
                        : difference === 0
                        ? 'गल्ला तंतोतंत जुळला! (Perfect Cash Match)'
                        : difference > 0
                        ? `जास्तीची रोख आढळली (Surplus Cash)`
                        : `गल्ल्यात तूट आढळली (Cash Shortage)`}
                    </span>
                  </div>
                  <p className="text-xs opacity-80 mt-0.5">
                    प्रत्यक्ष मोजलेले: <strong>₹{totalCountedCash.toLocaleString()}</strong> | सिस्टीम अपेक्षित: <strong>₹{expectedCashInDrawer.toLocaleString()}</strong>
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xs uppercase font-bold opacity-75">फरक (Difference):</span>
                  <div className="text-xl font-black">
                    {difference === 0 ? '₹0' : (difference > 0 ? `+₹${difference.toLocaleString()}` : `-₹${Math.abs(difference).toLocaleString()}`)}
                  </div>
                </div>
              </div>

              {/* Notes Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  काही विशेष टीप किंवा कारण (Closing Notes / Remarks):
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="उदा. गल्ल्यात ₹५० ची नाणी जास्त राहिली, उद्या बँकेत भरायची रक्कम..."
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                />
              </div>
            </>
          ) : (
            /* History Tab */
            <div className="space-y-3">
              {closingHistory.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-sm">
                  अद्याप कोणताही गल्ला बंद रेकॉर्ड सेव्ह केलेला नाही.
                </div>
              ) : (
                closingHistory.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 flex flex-wrap items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>📅 {rec.date}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            rec.difference === 0
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : rec.difference > 0
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {rec.difference === 0 ? 'जुळला (Matched)' : `फरक: ₹${rec.difference}`}
                        </span>
                      </div>
                      <div className="text-slate-500 mt-1">
                        अपेक्षित: ₹{rec.expectedCash.toLocaleString()} | मोजलेले: ₹{rec.countedCash.toLocaleString()} | तपासक: {rec.closedBy || 'Admin'}
                      </div>
                      {rec.notes && <div className="text-slate-600 dark:text-slate-400 mt-0.5 italic">टीप: {rec.notes}</div>}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDate(rec.date);
                        setActiveTab('today');
                      }}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-bold text-xs transition cursor-pointer"
                    >
                      तपासा / लोड करा
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs sm:text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            बंद करा (Close)
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="min-h-[44px] px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition cursor-pointer flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              <span>WhatsApp अहवाल</span>
            </button>

            <button
              type="button"
              onClick={handleSaveClosing}
              className="min-h-[44px] px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition cursor-pointer flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>गल्ला बंद सेव्ह करा</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
