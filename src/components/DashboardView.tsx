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
      `*${settings.businessName}*\nInvoice: ${entry.invoiceNo}\nCustomer: ${entry.customerName}\nItem: ${entry.itemDetails}\nTotal: ₹${(Number(entry.totalAmount) || 0).toLocaleString()}\nPaid: ₹${(Number(entry.payingNow) || 0).toLocaleString()} (${entry.paymentMode})\nDue: ₹${(Number(entry.dueAmount) || 0).toLocaleString()}\nVisit our website: ${settings.domainName}`
    );
    const phone = entry.customerPhone ? entry.customerPhone.replace(/[^0-9]/g, '') : '';
    const url = phone ? `https://wa.me/91${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Banner */}
      <div className="tactile-card rounded-2xl p-6 border border-[var(--tactile-border)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-700 dark:text-teal-300 text-xs font-semibold border border-teal-500/30">
              Live Business Hub
            </span>
            <span className="text-xs text-[var(--tactile-text-muted)] font-mono">
              {settings.domainName}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--tactile-text-heading)]">
            {settings.businessName}
          </h1>
          <p className="text-xs sm:text-sm text-[var(--tactile-text-muted)]">
            Welcome back, {settings.ownerName}. Here is your sales and cash flow overview for today.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="btn-dash-add-entry"
            onClick={() => onNavigate('add-entry')}
            className="px-4 py-2.5 rounded-xl tactile-btn-primary font-semibold text-sm shadow-md transition flex items-center gap-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            + Add New Entry
          </button>
          <button
            id="btn-dash-print-today"
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-xl tactile-btn-secondary text-[var(--tactile-text-main)] font-medium text-sm transition flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print Daily Sheet
          </button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Today's Cash */}
        <div className="tactile-card rounded-2xl border border-[var(--tactile-border)] p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[var(--tactile-text-muted)]">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Today's Cash In
            </span>
            <div className="w-9 h-9 rounded-xl tactile-inset text-emerald-600 flex items-center justify-center">
              <Banknote className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-bold text-[var(--tactile-text-heading)]">
              ₹{(Number(todayCash) || 0).toLocaleString()}
            </div>
            <p className="text-xs text-[var(--tactile-text-muted)] mt-1">
              From {todayTransactions.filter((t) => t.paymentMode === 'Cash').length} cash sales
            </p>
          </div>
        </div>

        {/* Today's Online (UPI) */}
        <div className="tactile-card rounded-2xl border border-[var(--tactile-border)] p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[var(--tactile-text-muted)]">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Today's Online (UPI)
            </span>
            <div className="w-9 h-9 rounded-xl tactile-inset text-teal-600 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-bold text-[var(--tactile-text-heading)]">
              ₹{(Number(todayOnline) || 0).toLocaleString()}
            </div>
            <p className="text-xs text-[var(--tactile-text-muted)] mt-1">
              GPay / PhonePe / Bank transfer
            </p>
          </div>
        </div>

        {/* Total Collected Today */}
        <div className="tactile-card rounded-2xl border border-[var(--tactile-border)] p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[var(--tactile-text-muted)]">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Total Inflow Today
            </span>
            <div className="w-9 h-9 rounded-xl tactile-inset text-[var(--tactile-primary)] flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-bold text-[var(--tactile-primary)]">
              ₹{(Number(totalCollectedToday) || 0).toLocaleString()}
            </div>
            <p className="text-xs text-[var(--tactile-text-muted)] mt-1">
              Total {todayTransactions.length} customer entries
            </p>
          </div>
        </div>

        {/* Total Udhar / Pending Dues */}
        <div className="tactile-card rounded-2xl border border-[var(--tactile-border)] p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[var(--tactile-text-muted)]">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Total Udhar (Dues)
            </span>
            <div className="w-9 h-9 rounded-xl tactile-inset text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-bold text-amber-600">
              ₹{(Number(totalUdharAllTime) || 0).toLocaleString()}
            </div>
            <button
              onClick={() => onNavigate('customers')}
              className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-medium mt-1 inline-flex items-center gap-1 cursor-pointer"
            >
              View Khata Book <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Middle section: Recent Transactions & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions (2 cols) */}
        <div className="lg:col-span-2 tactile-card rounded-2xl border border-[var(--tactile-border)] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--tactile-border-subtle)] pb-3">
            <div>
              <h2 className="text-base font-bold text-[var(--tactile-text-heading)]">Recent Transactions</h2>
              <p className="text-xs text-[var(--tactile-text-muted)]">Latest sales and cash collection entries</p>
            </div>
            <button
              onClick={() => onNavigate('all-entries')}
              className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
            >
              View All Entries →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm sm:text-xs">
              <thead className="tactile-inset text-[var(--tactile-text-muted)] uppercase tracking-wider font-semibold text-xs sm:text-[11px]">
                <tr>
                  <th className="py-2.5 px-3 rounded-l-lg">Bill No / Date</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Items</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Mode</th>
                  <th className="py-2.5 px-3 rounded-r-lg text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--tactile-border-subtle)]">
                {recentTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[var(--tactile-surface-inset)] transition">
                    <td className="py-3 px-3">
                      <p className="font-semibold text-[var(--tactile-text-heading)] font-mono text-sm sm:text-xs">{tx.invoiceNo}</p>
                      <p className="text-xs sm:text-[11px] text-[var(--tactile-text-muted)]">{tx.date}</p>
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-medium text-[var(--tactile-text-heading)] text-sm sm:text-xs">{tx.customerName}</p>
                      {tx.customerPhone && (
                        <p className="text-xs sm:text-[10px] text-[var(--tactile-text-muted)] font-mono">{tx.customerPhone}</p>
                      )}
                    </td>
                    <td className="py-3 px-3 max-w-[160px] truncate text-[var(--tactile-text-main)] text-sm sm:text-xs">
                      {tx.itemDetails}
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-bold text-[var(--tactile-text-heading)] font-mono-num text-base sm:text-xs">₹{(Number(tx.totalAmount) || 0).toLocaleString()}</p>
                      {(Number(tx.dueAmount) || 0) > 0 ? (
                        <span className="text-xs sm:text-[10px] font-semibold text-amber-600">
                          Due: ₹{(Number(tx.dueAmount) || 0).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-xs sm:text-[10px] text-emerald-600 font-semibold">
                          Paid in full
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs sm:text-[10px] font-semibold ${
                          tx.paymentMode === 'Cash'
                            ? 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/30'
                            : 'bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30'
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
                          className="p-1 rounded text-[var(--tactile-text-muted)] hover:text-[var(--tactile-primary)] hover:bg-[var(--tactile-surface-inset)] cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          title="Share on WhatsApp"
                          onClick={() => handleShareWhatsApp(tx)}
                          className="p-1 rounded text-[var(--tactile-text-muted)] hover:text-emerald-600 hover:bg-[var(--tactile-surface-inset)] cursor-pointer"
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
          <div className="tactile-card rounded-2xl border border-[var(--tactile-border)] p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-[var(--tactile-border-subtle)] pb-2.5">
              <h2 className="text-sm font-bold text-[var(--tactile-text-heading)] flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-600" />
                Stock Attention Needed
              </h2>
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-bold rounded-full">
                {lowStockItems.length}
              </span>
            </div>

            {lowStockItems.length > 0 ? (
              <div className="space-y-2.5">
                {lowStockItems.map((item, idx) => (
                  <div
                    key={`${item.id}-${idx}`}
                    className="p-2.5 rounded-xl tactile-inset border border-amber-500/30 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-semibold text-[var(--tactile-text-heading)]">{item.name}</p>
                      <p className="text-[11px] text-amber-600">
                        Remaining: <span className="font-bold">{item.quantity} {item.unit}</span> (Min: {item.minStockLevel})
                      </p>
                    </div>
                    <button
                      onClick={() => onNavigate('stock')}
                      className="px-2.5 py-1 tactile-btn-secondary text-amber-700 dark:text-amber-300 rounded-lg font-medium text-[11px] cursor-pointer"
                    >
                      Restock
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[var(--tactile-text-muted)] py-3 text-center">
                All inventory levels are currently sufficient!
              </p>
            )}
          </div>

          {/* Quick Shortcuts */}
          <div className="tactile-card rounded-2xl border border-[var(--tactile-border)] p-5 space-y-3">
            <h2 className="text-sm font-bold text-[var(--tactile-text-heading)] border-b border-[var(--tactile-border-subtle)] pb-2.5">
              Quick Shortcuts
            </h2>
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <button
                onClick={() => onNavigate('customers')}
                className="p-3 rounded-xl border border-[var(--tactile-border-subtle)] tactile-inset hover:border-[var(--tactile-primary)] text-left transition cursor-pointer"
              >
                <Users className="w-4 h-4 text-teal-600 mb-1" />
                <p className="font-semibold text-[var(--tactile-text-heading)]">Khata Book</p>
                <p className="text-[10px] text-[var(--tactile-text-muted)]">Customer dues</p>
              </button>
              <button
                onClick={() => onNavigate('stock')}
                className="p-3 rounded-xl border border-[var(--tactile-border-subtle)] tactile-inset hover:border-[var(--tactile-primary)] text-left transition cursor-pointer"
              >
                <Package className="w-4 h-4 text-[var(--tactile-primary)] mb-1" />
                <p className="font-semibold text-[var(--tactile-text-heading)]">Inventory</p>
                <p className="text-[10px] text-[var(--tactile-text-muted)]">{stock.length} Products</p>
              </button>
              <button
                onClick={() => onNavigate('expenses')}
                className="p-3 rounded-xl border border-[var(--tactile-border-subtle)] tactile-inset hover:border-[var(--tactile-primary)] text-left transition cursor-pointer"
              >
                <ReceiptIndianRupee className="w-4 h-4 text-emerald-600 mb-1" />
                <p className="font-semibold text-[var(--tactile-text-heading)]">Expenses</p>
                <p className="text-[10px] text-[var(--tactile-text-muted)]">Daily shop costs</p>
              </button>
              <button
                onClick={() => onNavigate('settings')}
                className="p-3 rounded-xl border border-[var(--tactile-border-subtle)] tactile-inset hover:border-[var(--tactile-primary)] text-left transition cursor-pointer"
              >
                <TrendingUp className="w-4 h-4 text-purple-600 mb-1" />
                <p className="font-semibold text-[var(--tactile-text-heading)]">Data & Backup</p>
                <p className="text-[10px] text-[var(--tactile-text-muted)]">Export JSON</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
