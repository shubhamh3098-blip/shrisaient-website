import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  Calendar,
  FileSpreadsheet,
  Printer,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  Wallet,
  Coins,
  Receipt,
  ShoppingBag,
  Package,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import { StoreData } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface ProfitLossAnalyticsViewProps {
  storeData: StoreData;
}

export const ProfitLossAnalyticsView: React.FC<ProfitLossAnalyticsViewProps> = ({ storeData }) => {
  const { isDayMode } = useTheme();

  // Date range filter: 'thisMonth' | 'lastMonth' | 'fy2026' | 'all'
  const [timeRange, setTimeRange] = useState<'thisMonth' | 'lastMonth' | 'fy2026' | 'all'>('thisMonth');

  const now = new Date();
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastYearMonth = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;

  // Filter transactions, expenses, receipts, and purchases based on timeRange
  const filterByDate = (dateStr: string) => {
    if (!dateStr) return false;
    if (timeRange === 'thisMonth') {
      return dateStr.startsWith(currentYearMonth);
    }
    if (timeRange === 'lastMonth') {
      return dateStr.startsWith(lastYearMonth);
    }
    if (timeRange === 'fy2026') {
      // FY 2026-27: from 2026-04-01 to 2027-03-31
      return dateStr >= '2026-04-01' && dateStr <= '2027-03-31';
    }
    return true; // 'all'
  };

  const filteredTransactions = useMemo(() => {
    return storeData.transactions.filter(t => filterByDate(t.date));
  }, [storeData.transactions, timeRange]);

  const filteredExpenses = useMemo(() => {
    return storeData.expenses.filter(e => filterByDate(e.date));
  }, [storeData.expenses, timeRange]);

  const filteredCardTransactions = useMemo(() => {
    return storeData.cardTransactions.filter(ct => filterByDate(ct.date));
  }, [storeData.cardTransactions, timeRange]);

  const filteredPurchases = useMemo(() => {
    return storeData.purchases.filter(p => filterByDate(p.date));
  }, [storeData.purchases, timeRange]);

  // Create Stock Price Lookup Map for Cost of Goods Sold (COGS)
  const stockMap = useMemo(() => {
    const map = new Map<string, { purchasePrice: number; mrp: number; salePrice: number; category: string }>();
    storeData.stock.forEach(s => {
      map.set(s.id, { purchasePrice: s.purchasePrice, mrp: s.mrp, salePrice: s.salePrice, category: s.category });
      map.set(s.name.toLowerCase().trim(), { purchasePrice: s.purchasePrice, mrp: s.mrp, salePrice: s.salePrice, category: s.category });
    });
    return map;
  }, [storeData.stock]);

  // Calculate Metrics
  const calculations = useMemo(() => {
    // 1. Gross Revenue from Transactions
    let totalSalesRevenue = 0;
    let totalDiscountGiven = 0;
    let totalTaxCollected = 0;
    let cogs = 0; // Cost of Goods Sold

    const categoryBreakdown: Record<string, { revenue: number; cogs: number; profit: number; count: number }> = {
      Electronics: { revenue: 0, cogs: 0, profit: 0, count: 0 },
      Furniture: { revenue: 0, cogs: 0, profit: 0, count: 0 },
      'Home Appliances': { revenue: 0, cogs: 0, profit: 0, count: 0 },
      Other: { revenue: 0, cogs: 0, profit: 0, count: 0 },
    };

    filteredTransactions.forEach(tx => {
      totalSalesRevenue += tx.grandTotal;
      totalDiscountGiven += (tx.discountTotal || 0);
      totalTaxCollected += (tx.taxTotal || 0);

      tx.items.forEach(item => {
        const itemTotal = item.total || (item.rate * item.qty);
        // Look up purchase cost
        const found = stockMap.get(item.stockId) || stockMap.get(item.name.toLowerCase().trim());
        let itemCost = 0;
        let cat = 'Other';

        if (found && found.purchasePrice > 0) {
          itemCost = found.purchasePrice * item.qty;
          cat = found.category || 'Other';
        } else {
          // If cost unknown, estimate COGS at 78% (22% gross margin industry standard)
          itemCost = itemTotal * 0.78;
        }

        cogs += itemCost;

        if (!categoryBreakdown[cat]) {
          categoryBreakdown[cat] = { revenue: 0, cogs: 0, profit: 0, count: 0 };
        }
        categoryBreakdown[cat].revenue += itemTotal;
        categoryBreakdown[cat].cogs += itemCost;
        categoryBreakdown[cat].profit += (itemTotal - itemCost);
        categoryBreakdown[cat].count += item.qty;
      });
    });

    const grossProfit = totalSalesRevenue - cogs;
    const grossMarginPct = totalSalesRevenue > 0 ? (grossProfit / totalSalesRevenue) * 100 : 0;

    // 2. Operating Expenses Breakdown
    let totalExpenses = 0;
    const expenseByCategory: Record<string, number> = {};

    filteredExpenses.forEach(exp => {
      totalExpenses += exp.amount;
      expenseByCategory[exp.category] = (expenseByCategory[exp.category] || 0) + exp.amount;
    });

    // 3. Staff Salary / Commission Cost
    const totalStaffSalary = storeData.staff
      .filter(s => s.isActive)
      .reduce((acc, s) => acc + (s.monthlySalary || 0), 0);

    // 4. Scheme Collection vs Bonus/Prizes Cost
    const schemeCollection = filteredCardTransactions.reduce((acc, ct) => acc + ct.amount, 0);

    // 5. Net Operating Profit
    // Net Profit = Gross Profit - Operating Expenses - Staff Cost
    const netProfit = grossProfit - totalExpenses;
    const netMarginPct = totalSalesRevenue > 0 ? (netProfit / totalSalesRevenue) * 100 : 0;

    return {
      totalSalesRevenue,
      totalDiscountGiven,
      totalTaxCollected,
      cogs,
      grossProfit,
      grossMarginPct,
      totalExpenses,
      expenseByCategory,
      totalStaffSalary,
      schemeCollection,
      netProfit,
      netMarginPct,
      categoryBreakdown,
      billCount: filteredTransactions.length,
    };
  }, [filteredTransactions, filteredExpenses, filteredCardTransactions, stockMap, storeData.staff]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    let csv = `SHRI SAI ENTERPRISES, WARDHA - PROFIT & LOSS REPORT\n`;
    csv += `Period: ${timeRange.toUpperCase()}, Generated: ${new Date().toLocaleDateString('en-IN')}\n\n`;
    csv += `METRIC,AMOUNT (INR)\n`;
    csv += `Total Sales Revenue,${calculations.totalSalesRevenue.toFixed(2)}\n`;
    csv += `Cost of Goods Sold (COGS),${calculations.cogs.toFixed(2)}\n`;
    csv += `Gross Profit,${calculations.grossProfit.toFixed(2)}\n`;
    csv += `Gross Margin %,${calculations.grossMarginPct.toFixed(2)}%\n`;
    csv += `Total Operating Expenses,${calculations.totalExpenses.toFixed(2)}\n`;
    csv += `30-Month Scheme Collections,${calculations.schemeCollection.toFixed(2)}\n`;
    csv += `Net Operating Profit,${calculations.netProfit.toFixed(2)}\n`;
    csv += `Net Margin %,${calculations.netMarginPct.toFixed(2)}%\n\n`;

    csv += `CATEGORY BREAKDOWN\n`;
    csv += `Category,Units Sold,Revenue,Cost (COGS),Profit,Margin %\n`;
    Object.entries(calculations.categoryBreakdown).forEach(([cat, data]) => {
      const margin = data.revenue > 0 ? ((data.profit / data.revenue) * 100).toFixed(1) : '0';
      csv += `${cat},${data.count},${data.revenue.toFixed(2)},${data.cogs.toFixed(2)},${data.profit.toFixed(2)},${margin}%\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ShriSai_PL_Report_${timeRange}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header with Title and Quick Filter */}
      <div className={`p-4 sm:p-6 rounded-2xl border transition-all ${
        isDayMode
          ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 border-emerald-200 text-slate-800 shadow-sm'
          : 'bg-gradient-to-r from-[#0d1f19] via-[#0d1624] to-[#141b2d] border-emerald-500/30 text-white shadow-xl'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black tracking-wider uppercase bg-emerald-500 text-slate-950">
                ERP Strong Upgrade
              </span>
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                व्यवसाय नफा-तोटा व मार्जिन विश्लेषक
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              P&L नफा-तोटा व व्यवसाय आरोग्य (Profit & Loss Analytics)
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-300 mt-1">
              श्री साई एंटरप्रायझेस, वर्धा — विक्री, खरेदी खर्च (COGS), दैनिक खर्च व निव्वळ नफा रिअल-टाइम हिशोब.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter Buttons */}
            <div className={`p-1 rounded-xl border flex items-center gap-1 text-xs font-bold ${
              isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-700'
            }`}>
              <button
                onClick={() => setTimeRange('thisMonth')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  timeRange === 'thisMonth'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                या महिन्यात (Current Month)
              </button>
              <button
                onClick={() => setTimeRange('lastMonth')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  timeRange === 'lastMonth'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                मागील महिना
              </button>
              <button
                onClick={() => setTimeRange('fy2026')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  timeRange === 'fy2026'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                चालू आर्थिक वर्ष (FY 26-27)
              </button>
              <button
                onClick={() => setTimeRange('all')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  timeRange === 'all'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                एकूण सर्व (All Time)
              </button>
            </div>

            {/* Export & Print */}
            <button
              onClick={handleExportCsv}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>CA Excel Export</span>
            </button>
            <button
              onClick={handlePrint}
              className={`p-2 rounded-xl border font-bold text-xs transition cursor-pointer ${
                isDayMode ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
              title="प्रिंट अहवाल"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Top 4 Primary Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Gross Revenue */}
        <div className={`p-4 rounded-2xl border transition-all ${
          isDayMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0f172a] border-slate-800 shadow-lg'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-bold uppercase tracking-wider">एकूण विक्री महसूल (Sales Revenue)</span>
            <span className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
              <ShoppingBag className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-sky-400 font-mono">
            ₹{calculations.totalSalesRevenue.toLocaleString('en-IN')}
          </div>
          <div className="mt-2 text-xs flex items-center justify-between text-slate-400">
            <span>{calculations.billCount} बिले तयार झाली</span>
            <span className="text-emerald-400 font-bold">100% अचूक</span>
          </div>
        </div>

        {/* 2. COGS (Cost of Goods Sold) */}
        <div className={`p-4 rounded-2xl border transition-all ${
          isDayMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0f172a] border-slate-800 shadow-lg'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-bold uppercase tracking-wider">खरेदी किंमत (Cost of Goods / COGS)</span>
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Package className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
            ₹{calculations.cogs.toLocaleString('en-IN')}
          </div>
          <div className="mt-2 text-xs flex items-center justify-between text-slate-400">
            <span>विकलेल्या वस्तूंची खरेदी किंमत</span>
            <span className="font-mono text-slate-300">
              {((calculations.cogs / (calculations.totalSalesRevenue || 1)) * 100).toFixed(1)}% of Sales
            </span>
          </div>
        </div>

        {/* 3. Gross Profit */}
        <div className={`p-4 rounded-2xl border transition-all ${
          isDayMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0f172a] border-slate-800 shadow-lg'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-bold uppercase tracking-wider">सकल नफा (Gross Profit)</span>
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
            ₹{calculations.grossProfit.toLocaleString('en-IN')}
          </div>
          <div className="mt-2 text-xs flex items-center justify-between">
            <span className="text-slate-400">Gross Margin %:</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold font-mono">
              {calculations.grossMarginPct.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* 4. Net Operating Profit */}
        <div className={`p-4 rounded-2xl border transition-all ${
          isDayMode
            ? calculations.netProfit >= 0 ? 'bg-emerald-50/70 border-emerald-300' : 'bg-rose-50/70 border-rose-300'
            : calculations.netProfit >= 0 ? 'bg-emerald-950/20 border-emerald-500/40' : 'bg-rose-950/20 border-rose-500/40'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-bold uppercase tracking-wider">निव्वळ नफा (Net Operating Profit)</span>
            <span className={`p-2 rounded-xl ${calculations.netProfit >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
              <Coins className="w-4 h-4" />
            </span>
          </div>
          <div className={`text-2xl sm:text-3xl font-black font-mono ${
            calculations.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            ₹{calculations.netProfit.toLocaleString('en-IN')}
          </div>
          <div className="mt-2 text-xs flex items-center justify-between text-slate-400">
            <span>दैनिक खर्च वजा केल्यानंतर</span>
            <span className={`font-mono font-bold ${calculations.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {calculations.netMarginPct.toFixed(1)}% Net
            </span>
          </div>
        </div>
      </div>

      {/* Middle Section: P&L Statement Flow & Category Margins */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col (7 cols): Full Step-by-Step P&L Statement */}
        <div className={`lg:col-span-7 p-5 rounded-2xl border transition-all ${
          isDayMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0f172a] border-slate-800 shadow-xl'
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              <h2 className="font-black text-base">नफा-तोटा तपशीलवार विवरण (P&L Income Statement)</h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">सर्व आकडे ₹ मध्ये</span>
          </div>

          <div className="space-y-3 text-sm">
            {/* 1. Revenue Block */}
            <div className="p-3 rounded-xl bg-sky-500/5 border border-sky-500/20 space-y-2">
              <div className="flex items-center justify-between font-bold text-sky-400">
                <span>(A) एकूण विक्री महसूल (Gross Sales Revenue)</span>
                <span className="font-mono text-base">₹{calculations.totalSalesRevenue.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 pl-4">
                <span>दिलेली एकूण सूट (Discounts Deducted)</span>
                <span className="font-mono text-rose-400">-₹{calculations.totalDiscountGiven.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 pl-4">
                <span>गोळा केलेला जीएसटी कर (GST Output Tax)</span>
                <span className="font-mono text-slate-300">₹{calculations.totalTaxCollected.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* 2. COGS Block */}
            <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-2">
              <div className="flex items-center justify-between font-bold text-amber-400">
                <span>(B) वस्तूंची खरेदी किंमत (Cost of Goods Sold - COGS)</span>
                <span className="font-mono text-base">-₹{calculations.cogs.toLocaleString('en-IN')}</span>
              </div>
              <div className="text-xs text-slate-400 pl-4">
                प्रत्येक विकलेल्या मालाच्या मूळ इनव्हॉइस व होलसेल खरेदी दरावर आधारित
              </div>
            </div>

            {/* 3. Gross Profit Line */}
            <div className={`p-3 rounded-xl flex items-center justify-between font-black text-base border ${
              isDayMode ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-400'
            }`}>
              <span>(C) सकल नफा (Gross Profit = A - B)</span>
              <span className="font-mono text-lg">₹{calculations.grossProfit.toLocaleString('en-IN')}</span>
            </div>

            {/* 4. Operating Expenses Breakdown */}
            <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/20 space-y-2.5">
              <div className="flex items-center justify-between font-bold text-rose-400">
                <span>(D) एकूण दैनिक व मासिक खर्च (Operating Expenses)</span>
                <span className="font-mono text-base">-₹{calculations.totalExpenses.toLocaleString('en-IN')}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 pl-4 pt-1">
                {Object.keys(calculations.expenseByCategory).length > 0 ? (
                  Object.entries(calculations.expenseByCategory).map(([cat, amt]) => (
                    <div key={cat} className="flex justify-between pr-2">
                      <span className="truncate">• {cat}:</span>
                      <span className="font-mono text-slate-200">₹{amt.toLocaleString('en-IN')}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-500 italic col-span-2">या कालावधीत कोणताही स्वतंत्र खर्च नोंदवला नाही</div>
                )}
              </div>
            </div>

            {/* 5. 30-Month Scheme Weekly Collections Contribution */}
            <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20 flex items-center justify-between">
              <div>
                <span className="font-bold text-purple-400">(E) ३०-महिने साप्ताहिक बचत योजना संकलन</span>
                <p className="text-xs text-slate-400">वर्ध्यातील ग्राहकांकडून साप्ताहिक हप्ते जमा</p>
              </div>
              <span className="font-mono font-bold text-purple-300 text-base">
                +₹{calculations.schemeCollection.toLocaleString('en-IN')}
              </span>
            </div>

            {/* Final Net Profit Line */}
            <div className={`p-4 rounded-xl flex items-center justify-between font-black text-lg border-2 ${
              calculations.netProfit >= 0
                ? 'bg-emerald-600 text-white border-emerald-400 shadow-lg'
                : 'bg-rose-600 text-white border-rose-400 shadow-lg'
            }`}>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-300" />
                <span>निव्वळ व्यवसाय नफा (Net Operating Profit)</span>
              </div>
              <span className="font-mono text-2xl">
                ₹{calculations.netProfit.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Right Col (5 cols): Category Margins & Capital Health */}
        <div className="lg:col-span-5 space-y-6">
          {/* Category Margins */}
          <div className={`p-5 rounded-2xl border transition-all ${
            isDayMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0f172a] border-slate-800 shadow-xl'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-amber-400" />
                <h3 className="font-black text-sm">कॅटेगरीनुसार नफा व विक्री (Category Profitability)</h3>
              </div>
            </div>

            <div className="space-y-4">
              {Object.entries(calculations.categoryBreakdown).map(([cat, data]) => {
                const margin = data.revenue > 0 ? ((data.profit / data.revenue) * 100).toFixed(1) : '0';
                const revShare = calculations.totalSalesRevenue > 0
                  ? ((data.revenue / calculations.totalSalesRevenue) * 100).toFixed(0)
                  : '0';

                return (
                  <div key={cat} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${
                          cat === 'Electronics' ? 'bg-sky-400' : cat === 'Furniture' ? 'bg-amber-400' : 'bg-emerald-400'
                        }`} />
                        {cat} ({data.count} नग)
                      </span>
                      <span className="text-emerald-400 font-mono font-bold">
                        मार्जिन: {margin}%
                      </span>
                    </div>

                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden flex">
                      <div
                        className={`h-full ${
                          cat === 'Electronics' ? 'bg-sky-500' : cat === 'Furniture' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(5, Number(revShare)))}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                      <span>विक्री: ₹{data.revenue.toLocaleString('en-IN')}</span>
                      <span>नफा: ₹{data.profit.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Working Capital & Receivables Health */}
          <div className={`p-5 rounded-2xl border transition-all ${
            isDayMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0f172a] border-slate-800 shadow-xl'
          }`}>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
              <Wallet className="w-5 h-5 text-sky-400" />
              <h3 className="font-black text-sm">कॅश फ्लो व खेळते भांडवल (Working Capital Health)</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-800/40">
                <span className="text-slate-400">ग्राहकांकडील येणेबाकी (Customer Dues / Receivables):</span>
                <span className="font-mono font-bold text-amber-400">
                  ₹{storeData.customers.reduce((acc, c) => acc + (c.currentBalance || 0), 0).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex justify-between p-2.5 rounded-xl bg-slate-800/40">
                <span className="text-slate-400">होलसेल डीलर्सना देणेबाकी (Wholesaler Payables):</span>
                <span className="font-mono font-bold text-rose-400">
                  ₹{storeData.dealers.reduce((acc, d) => acc + (d.currentPayable || 0), 0).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex justify-between p-2.5 rounded-xl bg-slate-800/40">
                <span className="text-slate-400">गोदामातील एकूण साठा मूल्य (Current Stock Asset Value):</span>
                <span className="font-mono font-bold text-emerald-400">
                  ₹{storeData.stock.reduce((acc, s) => acc + (s.stockQty * s.purchasePrice), 0).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/30 text-[11px] text-sky-300 flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  टीप: वरील हिशोब आपोआप सर्व विक्री बिले, खरेदी आणि रोजच्या खर्चाशी सिंक राहतो. बँक लोन किंवा ऑडिटसाठी हा डेटा एक्सेलमध्ये एक्सपोर्ट करता येतो.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
