import React, { useState, useMemo } from 'react';
import {
  Coins,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Calendar,
  Save,
  RotateCcw,
  Sparkles,
  Lock,
  FileSpreadsheet,
  Clock,
  UserCheck,
  TrendingUp,
  Receipt
} from 'lucide-react';
import { StoreData, DailyCashClosing, CashDenomination } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { GalaxyButton } from '../common/GalaxyButton';

interface DailyCashClosingViewProps {
  storeData: StoreData;
  onRefreshData?: () => void;
  onSaveClosing?: (closing: DailyCashClosing) => void;
}

export const DailyCashClosingView: React.FC<DailyCashClosingViewProps> = ({
  storeData,
  onRefreshData,
  onSaveClosing,
}) => {
  const { isDayMode } = useTheme();

  // Selected date for day closing (default today)
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Opening Cash in drawer
  const [openingCash, setOpeningCash] = useState<number>(2000);
  const [otherCashIn, setOtherCashIn] = useState<number>(0);
  const [otherCashOut, setOtherCashOut] = useState<number>(0);
  const [closedBy, setClosedBy] = useState<string>('Rahul Joshi (कॅश काउंटर)');
  const [remarks, setRemarks] = useState<string>('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');

  // Cash Denominations
  const [denominations, setDenominations] = useState<CashDenomination>({
    d500: 0,
    d200: 0,
    d100: 0,
    d50: 0,
    d20: 0,
    d10: 0,
    coins: 0,
  });

  // Calculate automated cash inflows for selected date
  const cashInflows = useMemo(() => {
    // 1. Store Sales Bills Cash
    const salesCash = (storeData.transactions || [])
      .filter((t) => t.date.startsWith(selectedDate) && t.paymentMode === 'Cash')
      .reduce((sum, t) => sum + (t.paidAmount || 0), 0);

    // 2. Customer Credit Receipts Cash
    const receiptsCash = (storeData.billReceipts || [])
      .filter((r) => r.date.startsWith(selectedDate) && r.paymentMode === 'Cash')
      .reduce((sum, r) => sum + (r.amountPaid || 0), 0);

    // 3. 30-Month Scheme Card Installments Cash
    const schemeCash = (storeData.cardTransactions || [])
      .filter((ct) => ct.date.startsWith(selectedDate) && ct.paymentMode === 'Cash')
      .reduce((sum, ct) => sum + (ct.amount || 0), 0);

    const totalCashIn = salesCash + receiptsCash + schemeCash + otherCashIn;

    return {
      salesCash,
      receiptsCash,
      schemeCash,
      otherCashIn,
      totalCashIn,
    };
  }, [storeData, selectedDate, otherCashIn]);

  // Calculate automated cash outflows for selected date
  const cashOutflows = useMemo(() => {
    // 1. Shop Expenses Cash
    const expensesCash = (storeData.expenses || [])
      .filter((e) => e.date.startsWith(selectedDate) && e.paymentMode === 'Cash')
      .reduce((sum, e) => sum + (e.amount || 0), 0);

    // 2. Staff / Agent Advances Cash
    const staffAdvanceCash = (storeData.agentAdvances || [])
      .filter((a) => a.date.startsWith(selectedDate))
      .reduce((sum, a) => sum + (a.amount || 0), 0);

    // 3. Wholesale Dealer Payments Cash
    const dealerCash = (storeData.dealerPayments || [])
      .filter((dp) => dp.date.startsWith(selectedDate) && dp.paymentMode === 'Cash')
      .reduce((sum, dp) => sum + (dp.amount || 0), 0);

    const totalCashOut = expensesCash + staffAdvanceCash + dealerCash + otherCashOut;

    return {
      expensesCash,
      staffAdvanceCash,
      dealerCash,
      otherCashOut,
      totalCashOut,
    };
  }, [storeData, selectedDate, otherCashOut]);

  // Expected Cash in Drawer: Opening + Inflows - Outflows
  const expectedCash = openingCash + cashInflows.totalCashIn - cashOutflows.totalCashOut;

  // Actual Cash counted from denominations
  const actualCash = useMemo(() => {
    return (
      denominations.d500 * 500 +
      denominations.d200 * 200 +
      denominations.d100 * 100 +
      denominations.d50 * 50 +
      denominations.d20 * 20 +
      denominations.d10 * 10 +
      denominations.coins
    );
  }, [denominations]);

  // Discrepancy: actual - expected
  const discrepancy = actualCash - expectedCash;
  const isMatched = Math.abs(discrepancy) < 0.01;
  const isShortage = discrepancy < -0.01;
  const isExcess = discrepancy > 0.01;

  // Handle count change
  const handleDenomChange = (key: keyof CashDenomination, value: string) => {
    const parsed = Math.max(0, parseInt(value, 10) || 0);
    setDenominations((prev) => ({ ...prev, [key]: parsed }));
  };

  // Quick auto-match (fills denominations matching expected cash for fast demo)
  const handleAutoFillMatch = () => {
    let rem = Math.max(0, expectedCash);
    const d500 = Math.floor(rem / 500);
    rem %= 500;
    const d200 = Math.floor(rem / 200);
    rem %= 200;
    const d100 = Math.floor(rem / 100);
    rem %= 100;
    const d50 = Math.floor(rem / 50);
    rem %= 50;
    const d20 = Math.floor(rem / 20);
    rem %= 20;
    const d10 = Math.floor(rem / 10);
    rem %= 10;
    const coins = rem;

    setDenominations({ d500, d200, d100, d50, d20, d10, coins });
  };

  // Save day closing
  const handleSaveDayClosing = () => {
    const closingRecord: DailyCashClosing = {
      id: `closing-${selectedDate}-${Date.now()}`,
      date: selectedDate,
      closedAt: new Date().toISOString(),
      closedBy,
      openingCash,
      salesCash: cashInflows.salesCash,
      receiptsCash: cashInflows.receiptsCash,
      schemeCash: cashInflows.schemeCash,
      otherCashIn,
      totalCashIn: cashInflows.totalCashIn,
      expensesCash: cashOutflows.expensesCash,
      staffAdvanceCash: cashOutflows.staffAdvanceCash,
      dealerCash: cashOutflows.dealerCash,
      otherCashOut,
      totalCashOut: cashOutflows.totalCashOut,
      expectedCash,
      actualCash,
      discrepancy,
      denominations,
      remarks,
      status: isMatched ? 'Matched' : isShortage ? 'Shortage' : 'Excess',
    };

    if (onSaveClosing) {
      onSaveClosing(closingRecord);
    } else {
      // Save to local storage storeData
      const existing = storeData.dailyClosings || [];
      const updated = [closingRecord, ...existing.filter((c) => c.date !== selectedDate)];
      storeData.dailyClosings = updated;
      try {
        localStorage.setItem('sse_store_data', JSON.stringify(storeData));
      } catch (e) {
        console.error('Failed to save daily closing to localStorage', e);
      }
    }

    setSaveSuccessMsg(`✅ ${selectedDate} चा दैनिक गल्ला बंद यशस्वीरित्या सेव्ह झाला!`);
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  // Print day closing sheet
  const handlePrintClosing = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className={`p-5 rounded-2xl border transition-colors ${
        isDayMode
          ? 'bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 border-amber-200'
          : 'bg-gradient-to-r from-[#172033] via-[#151c2d] to-[#1a233a] border-amber-500/20'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase bg-amber-400 text-slate-950 mb-1.5 shadow-sm">
              <Coins className="w-3.5 h-3.5" /> दैनिक गल्ला बंद व कॅश पडताळणी
            </div>
            <h1 className="text-xl sm:text-2xl font-black font-playfair tracking-tight">
              Daily Cash Register & Day-End Closing
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              रोज संध्याकाळी काउंटरवरील प्रत्यक्ष रोख नोटा मोजून सिस्टीमच्या हिशोबाशी १ रुपयाच्या अचूकतेने ताडून पहा.
            </p>
          </div>

          {/* Date Picker & Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 shadow-sm">
              <Calendar className="w-4 h-4 text-amber-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-xs font-bold bg-transparent outline-none cursor-pointer"
              />
            </div>

            <button
              onClick={handleAutoFillMatch}
              className="px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-700 transition cursor-pointer flex items-center gap-1.5"
              title="सिस्टीमच्या अपेक्षेनुसार नोटा स्वयंचलित भरा (Auto-fill matching cash)"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              <span>ऑटो-मॅच</span>
            </button>

            <button
              onClick={handlePrintClosing}
              className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-300 dark:border-slate-700 transition cursor-pointer flex items-center gap-1.5 shadow-sm"
              title="गल्ला बंद पावती प्रिंट करा"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>प्रिंट</span>
            </button>
          </div>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Main 3-Column Layout: Inflows | Outflows | Denominations & Result */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Cash Inflows & Outflows (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Top Row: Opening Cash */}
          <div className={`p-4 rounded-2xl border shadow-sm ${
            isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">
                  आरंभीची रोख शिल्लक (Morning Opening Drawer Cash)
                </span>
                <span className="text-[11px] text-slate-400">दुकान उघडताना गल्ल्यात ठेवलेली सुरुवातीची रक्कम</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-amber-500">₹</span>
                <input
                  type="number"
                  value={openingCash}
                  onChange={(e) => setOpeningCash(Math.max(0, Number(e.target.value) || 0))}
                  className={`w-28 px-2.5 py-1.5 rounded-lg border text-sm font-black text-right outline-none focus:ring-2 focus:ring-amber-400 ${
                    isDayMode ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Cash Inflows (रोख आवक) */}
          <div className={`p-4 rounded-2xl border shadow-sm space-y-3 ${
            isDayMode ? 'bg-white border-emerald-200' : 'bg-slate-900 border-emerald-900/40'
          }`}>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600">
                  <ArrowDownRight className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                    रोख आवक जमा (Cash Inflows)
                  </h3>
                  <span className="text-[10px] text-slate-400">दिवसभरात गल्ल्यात आलेली प्रत्यक्ष रोख</span>
                </div>
              </div>
              <span className="text-base font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                + ₹{cashInflows.totalCashIn.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-50 dark:border-slate-800/50">
                <span className="text-slate-600 dark:text-slate-400">१. दुकान रोख विक्री (Sales Cash Bills):</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                  ₹{cashInflows.salesCash.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-50 dark:border-slate-800/50">
                <span className="text-slate-600 dark:text-slate-400">२. ग्राहक उधारी रोख जमा (Customer Khata Receipts):</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                  ₹{cashInflows.receiptsCash.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-50 dark:border-slate-800/50">
                <span className="text-slate-600 dark:text-slate-400">३. ३०-महिने साप्ताहिक बचत योजना हप्ते जमा (Card Scheme):</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                  ₹{cashInflows.schemeCash.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-slate-600 dark:text-slate-400">४. इतर रोख जमा (Other Cash In):</span>
                <div className="flex items-center gap-1">
                  <span className="text-slate-400">₹</span>
                  <input
                    type="number"
                    value={otherCashIn}
                    onChange={(e) => setOtherCashIn(Math.max(0, Number(e.target.value) || 0))}
                    className={`w-24 px-2 py-0.5 rounded border text-xs font-bold text-right outline-none ${
                      isDayMode ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-slate-700'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Cash Outflows (रोख जावक/खर्च) */}
          <div className={`p-4 rounded-2xl border shadow-sm space-y-3 ${
            isDayMode ? 'bg-white border-rose-200' : 'bg-slate-900 border-rose-900/40'
          }`}>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-rose-600 dark:text-rose-400">
                    रोख जावक व खर्च (Cash Outflows)
                  </h3>
                  <span className="text-[10px] text-slate-400">गल्ल्यातून केलेला प्रत्यक्ष रोख खर्च</span>
                </div>
              </div>
              <span className="text-base font-black text-rose-600 dark:text-rose-400 tabular-nums">
                - ₹{cashOutflows.totalCashOut.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-50 dark:border-slate-800/50">
                <span className="text-slate-600 dark:text-slate-400">१. दुकान खर्च डे-बुक (Shop Expenses):</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                  ₹{cashOutflows.expensesCash.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-50 dark:border-slate-800/50">
                <span className="text-slate-600 dark:text-slate-400">२. स्टाफ / एजंट ॲडव्हान्स (Staff Advances):</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                  ₹{cashOutflows.staffAdvanceCash.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-50 dark:border-slate-800/50">
                <span className="text-slate-600 dark:text-slate-400">३. होलसेल डीलर रोख पेमेंट (Dealer Cash):</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                  ₹{cashOutflows.dealerCash.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-slate-600 dark:text-slate-400">४. इतर रोख जावक (Other Outflow):</span>
                <div className="flex items-center gap-1">
                  <span className="text-slate-400">₹</span>
                  <input
                    type="number"
                    value={otherCashOut}
                    onChange={(e) => setOtherCashOut(Math.max(0, Number(e.target.value) || 0))}
                    className={`w-24 px-2 py-0.5 rounded border text-xs font-bold text-right outline-none ${
                      isDayMode ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-slate-700'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Expected Cash Box Summary */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-md flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-blue-100 uppercase tracking-wider block">
                गल्ल्यात असायला हवी ती अपेक्षित रोख (System Expected Cash)
              </span>
              <span className="text-[11px] text-blue-200">
                आरंभीची रोख (₹{openingCash}) + आवक (₹{cashInflows.totalCashIn}) - जावक (₹{cashOutflows.totalCashOut})
              </span>
            </div>
            <div className="text-right">
              <span className="text-2xl sm:text-3xl font-black tabular-nums">
                ₹{expectedCash.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Physical Denominations Counter & Verification (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className={`p-4 rounded-2xl border shadow-sm space-y-4 ${
            isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-400/20 text-amber-600 dark:text-amber-300">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    प्रत्यक्ष नोटा मोजणी (Cash Denominations)
                  </h3>
                  <span className="text-[10px] text-slate-400">गल्ल्यातील प्रत्यक्ष नोटांची संख्या टाका</span>
                </div>
              </div>
            </div>

            {/* Denomination Rows */}
            <div className="space-y-2">
              {[
                { label: '₹५०० च्या नोटा', key: 'd500' as const, val: 500, count: denominations.d500 },
                { label: '₹२०० च्या नोटा', key: 'd200' as const, val: 200, count: denominations.d200 },
                { label: '₹१०० च्या नोटा', key: 'd100' as const, val: 100, count: denominations.d100 },
                { label: '₹५० च्या नोटा', key: 'd50' as const, val: 50, count: denominations.d50 },
                { label: '₹२० च्या नोटा', key: 'd20' as const, val: 20, count: denominations.d20 },
                { label: '₹१० च्या नोटा', key: 'd10' as const, val: 10, count: denominations.d10 },
              ].map((d) => (
                <div key={d.key} className="flex items-center justify-between gap-2 text-xs py-1 border-b border-slate-50 dark:border-slate-800/60">
                  <span className="w-24 font-bold text-slate-700 dark:text-slate-300">{d.label}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">x</span>
                    <input
                      type="number"
                      min="0"
                      value={d.count === 0 ? '' : d.count}
                      placeholder="0"
                      onChange={(e) => handleDenomChange(d.key, e.target.value)}
                      className={`w-16 px-2 py-1 rounded-md border text-center font-bold text-xs outline-none focus:ring-1 focus:ring-amber-400 ${
                        isDayMode ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-slate-700'
                      }`}
                    />
                  </div>
                  <span className="w-24 text-right font-black text-slate-900 dark:text-white tabular-nums">
                    = ₹{(d.count * d.val).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}

              {/* Coins row */}
              <div className="flex items-center justify-between gap-2 text-xs py-1">
                <span className="w-24 font-bold text-slate-700 dark:text-slate-300">नाणी (Coins)</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">रक्कम:</span>
                  <input
                    type="number"
                    min="0"
                    value={denominations.coins === 0 ? '' : denominations.coins}
                    placeholder="0"
                    onChange={(e) => handleDenomChange('coins', e.target.value)}
                    className={`w-16 px-2 py-1 rounded-md border text-center font-bold text-xs outline-none focus:ring-1 focus:ring-amber-400 ${
                      isDayMode ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-slate-700'
                    }`}
                  />
                </div>
                <span className="w-24 text-right font-black text-slate-900 dark:text-white tabular-nums">
                  = ₹{(denominations.coins || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Total Actual Cash Count */}
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-between border border-slate-200 dark:border-slate-700">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                प्रत्यक्ष मोजलेली रोख (Actual Cash Count)
              </span>
              <span className="text-lg font-black text-slate-950 dark:text-white tabular-nums">
                ₹{actualCash.toLocaleString('en-IN')}
              </span>
            </div>

            {/* Tally / Discrepancy Verification Status Card */}
            <div className={`p-4 rounded-2xl border transition-all ${
              isMatched
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200'
                : isShortage
                ? 'bg-rose-500/10 border-rose-500/40 text-rose-800 dark:text-rose-200'
                : 'bg-blue-500/10 border-blue-500/30 text-blue-800 dark:text-blue-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isMatched ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0" />
                  )}
                  <div>
                    <h4 className="font-black text-sm">
                      {isMatched
                        ? 'गल्ला अचूक जुळला! (Cash Matched)'
                        : isShortage
                        ? '⚠️ गल्ल्यात तूट आहे! (Cash Shortage)'
                        : 'ℹ️ गल्ल्यात जास्त रोख आहे (Cash Excess)'}
                    </h4>
                    <p className="text-[11px] opacity-80">
                      अपेक्षित: ₹{expectedCash.toLocaleString('en-IN')} | प्रत्यक्ष: ₹{actualCash.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-lg font-black tabular-nums ${
                    isMatched ? 'text-emerald-600' : isShortage ? 'text-rose-600' : 'text-blue-600'
                  }`}>
                    {discrepancy > 0 ? `+₹${discrepancy}` : discrepancy < 0 ? `-₹${Math.abs(discrepancy)}` : '₹० तूट'}
                  </span>
                </div>
              </div>
            </div>

            {/* Staff / Remarks Form & Save Action */}
            <div className="space-y-2.5 pt-1">
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                  गल्ला बंद करणारा अधिकारी / कॅशियर:
                </label>
                <input
                  type="text"
                  value={closedBy}
                  onChange={(e) => setClosedBy(e.target.value)}
                  className={`w-full px-3 py-1.5 rounded-xl border text-xs font-semibold outline-none ${
                    isDayMode ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                  नोंद किंवा शेरा (Remarks):
                </label>
                <input
                  type="text"
                  placeholder="उदा. ₹५०० चे यूपीआय पेमेंट उशिरा जमा झाले..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className={`w-full px-3 py-1.5 rounded-xl border text-xs outline-none ${
                    isDayMode ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                />
              </div>

              <button
                onClick={handleSaveDayClosing}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm shadow-md transition cursor-pointer flex items-center justify-center gap-2 active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>गल्ला बंद सेव्ह करा (Lock Day-End Closing)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* History of Past Day Closings */}
      {storeData.dailyClosings && storeData.dailyClosings.length > 0 && (
        <div className={`p-5 rounded-2xl border shadow-sm space-y-3 ${
          isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>गेल्या दिवसांचे गल्ला बंद रेकॉर्ड (Closing History)</span>
            </h3>
            <span className="text-xs text-slate-400">
              एकूण {storeData.dailyClosings.length} दिवस नोंदणीकृत
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500">
                  <th className="py-2 px-3">तारीख</th>
                  <th className="py-2 px-3">अपेक्षित रोख</th>
                  <th className="py-2 px-3">प्रत्यक्ष रोख</th>
                  <th className="py-2 px-3">तूट / शिल्लक</th>
                  <th className="py-2 px-3">स्थिती</th>
                  <th className="py-2 px-3">कॅशियर</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {storeData.dailyClosings.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-2 px-3 font-bold">{c.date}</td>
                    <td className="py-2 px-3 font-semibold">₹{c.expectedCash.toLocaleString('en-IN')}</td>
                    <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">₹{c.actualCash.toLocaleString('en-IN')}</td>
                    <td className="py-2 px-3 font-bold">
                      <span className={c.discrepancy < 0 ? 'text-rose-600' : c.discrepancy > 0 ? 'text-blue-600' : 'text-emerald-600'}>
                        {c.discrepancy === 0 ? '₹०' : c.discrepancy > 0 ? `+₹${c.discrepancy}` : `-₹${Math.abs(c.discrepancy)}`}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        c.status === 'Matched'
                          ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                          : c.status === 'Shortage'
                          ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                          : 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                      }`}>
                        {c.status === 'Matched' ? 'जुळला (Matched)' : c.status === 'Shortage' ? 'तूट (Shortage)' : 'जास्त (Excess)'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-500">{c.closedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
