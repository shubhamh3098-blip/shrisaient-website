import React from 'react';
import {
  Banknote,
  Smartphone,
  TrendingUp,
  AlertTriangle,
  PlusCircle,
  Clock,
  Printer,
  Share2,
  Users,
  Package,
  ReceiptIndianRupee,
  ArrowUpRight
} from 'lucide-react';
import { BusinessSettings, Customer, StockItem, TransactionEntry } from '../types';

interface DashboardViewProps {
  transactions: TransactionEntry[];
  customers: Customer[];
  stock: StockItem[];
  settings: BusinessSettings;
  onNavigate: (tab: any) => void;
  onOpenInvoiceModal: (entry: TransactionEntry) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  transactions,
  customers,
  stock,
  settings,
  onNavigate,
  onOpenInvoiceModal,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const todayTransactions = transactions.filter((t) => t.date === todayStr);

  const todayCash = todayTransactions
    .filter((t) => t.paymentMode === 'Cash')
    .reduce((acc, t) => acc + t.payingNow, 0);

  const todayOnline = todayTransactions
    .filter((t) => t.paymentMode === 'Online')
    .reduce((acc, t) => acc + t.payingNow, 0);

  const totalCollectedToday = todayCash + todayOnline;

  const totalUdharAllTime = customers.reduce(
    (acc, c) => acc + (c.balanceDue || 0),
    0
  );

  const lowStockItems = stock.filter((s) => s.quantity <= s.minStockLevel);

  const recentTransactions = transactions.slice(0, 6);

  const handleShareWhatsApp = (entry: TransactionEntry) => {
    const text = encodeURIComponent(
      `*${settings.businessName}*\nInvoice: ${entry.invoiceNo}\nCustomer: ${entry.customerName}\nItem: ${entry.itemDetails}\nTotal: ₹${entry.totalAmount.toLocaleString()}\nPaid: ₹${entry.payingNow.toLocaleString()} (${entry.paymentMode})\nDue: ₹${entry.dueAmount.toLocaleString()}\nVisit our website: ${settings.domainName}`
    );
    const phone = entry.customerPhone ? entry.customerPhone.replace(/[^0-9]/g, '') : '';
    const url = phone ? `https://wa.me/91${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white rounded-2xl p-6 shadow-xs border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors duration-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-semibold border border-blue-200 dark:border-blue-800">
              Live Business Hub
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              {settings.domainName}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {settings.businessName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Welcome back, {settings.ownerName}. Here is your sales and cash flow overview for today.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="btn-dash-add-entry"
            onClick={() => onNavigate('add-entry')}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-md shadow-blue-600/30 transition flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            + Add New Entry
          </button>
          <button
            id="btn-dash-print-today"
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-sm border border-slate-200 dark:border-slate-700 transition flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Printer className="w-4 h-4" />
            Print Daily Sheet
          </button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Today's Cash */}
        <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Today's Cash In
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Banknote className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              ₹{todayCash.toLocaleString()}
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              From {todayTransactions.filter((t) => t.paymentMode === 'Cash').length} cash sales
            </p>
          </div>
        </div>

        {/* Today's Online (UPI) */}
        <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Today's Online (UPI)
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              ₹{todayOnline.toLocaleString()}
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              GPay / PhonePe / Bank transfer
            </p>
          </div>
        </div>

        {/* Total Collected Today */}
        <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Total Inflow Today
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-bold text-indigo-600 dark:text-indigo-400">
              ₹{totalCollectedToday.toLocaleString()}
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Total {todayTransactions.length} customer entries
            </p>
          </div>
        </div>

        {/* Total Udhar / Pending Dues */}
        <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Total Udhar (Dues)
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-bold text-amber-600 dark:text-amber-400">
              ₹{totalUdharAllTime.toLocaleString()}
            </div>
            <button
              onClick={() => onNavigate('customers')}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium mt-1 inline-flex items-center gap-1 cursor-pointer"
            >
              View Khata Book <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Middle section: Recent Transactions & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-4 transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Recent Transactions</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Latest sales and cash collection entries</p>
            </div>
            <button
              onClick={() => onNavigate('all-entries')}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              View All Entries →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3 rounded-l-lg">Bill No / Date</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Items</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Mode</th>
                  <th className="py-2.5 px-3 rounded-r-lg text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3">
                      <p className="font-semibold text-slate-900 dark:text-white font-mono">{tx.invoiceNo}</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">{tx.date}</p>
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-medium text-slate-900 dark:text-slate-200">{tx.customerName}</p>
                      {tx.customerPhone && (
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">{tx.customerPhone}</p>
                      )}
                    </td>
                    <td className="py-3 px-3 max-w-[160px] truncate text-slate-600 dark:text-slate-400">
                      {tx.itemDetails}
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-900 dark:text-white">₹{tx.totalAmount.toLocaleString()}</p>
                      {tx.dueAmount > 0 ? (
                        <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                          Due: ₹{tx.dueAmount.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                          Paid in full
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          tx.paymentMode === 'Cash'
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                        }`}
                      >
                        {tx.paymentMode}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          title="Print Receipt"
                          onClick={() => onOpenInvoiceModal(tx)}
                          className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          title="Share on WhatsApp"
                          onClick={() => handleShareWhatsApp(tx)}
                          className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column: Quick Navigation & Low Stock alert */}
        <div className="space-y-6">
          {/* Low Stock Warning Card */}
          <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-3 transition-colors">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                Stock Attention Needed
              </h2>
              <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-bold rounded-full border border-amber-200 dark:border-amber-800">
                {lowStockItems.length}
              </span>
            </div>

            {lowStockItems.length > 0 ? (
              <div className="space-y-2.5">
                {lowStockItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/60 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{item.name}</p>
                      <p className="text-[11px] text-amber-700 dark:text-amber-400">
                        Remaining: <span className="font-bold">{item.quantity} {item.unit}</span> (Min: {item.minStockLevel})
                      </p>
                    </div>
                    <button
                      onClick={() => onNavigate('stock')}
                      className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 rounded-lg font-medium text-[11px] hover:bg-amber-100 dark:hover:bg-amber-900/40 cursor-pointer"
                    >
                      Restock
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400 py-3 text-center">
                All inventory levels are currently sufficient!
              </p>
            )}
          </div>

          {/* Quick Shortcuts */}
          <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-3 transition-colors">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2.5">
              Quick Shortcuts
            </h2>
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <button
                onClick={() => onNavigate('customers')}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-slate-800 hover:border-blue-200 text-left transition cursor-pointer"
              >
                <Users className="w-4 h-4 text-blue-600 dark:text-blue-400 mb-1" />
                <p className="font-semibold text-slate-900 dark:text-white">Khata Book</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Customer dues</p>
              </button>
              <button
                onClick={() => onNavigate('stock')}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-slate-800 hover:border-blue-200 text-left transition cursor-pointer"
              >
                <Package className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mb-1" />
                <p className="font-semibold text-slate-900 dark:text-white">Inventory</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">{stock.length} Products</p>
              </button>
              <button
                onClick={() => onNavigate('expenses')}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-slate-800 hover:border-blue-200 text-left transition cursor-pointer"
              >
                <ReceiptIndianRupee className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mb-1" />
                <p className="font-semibold text-slate-900 dark:text-white">Expenses</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Daily shop costs</p>
              </button>
              <button
                onClick={() => onNavigate('settings')}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-slate-800 hover:border-blue-200 text-left transition cursor-pointer"
              >
                <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400 mb-1" />
                <p className="font-semibold text-slate-900 dark:text-white">Data & Backup</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Export JSON</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
