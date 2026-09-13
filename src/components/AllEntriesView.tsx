import React, { useState } from 'react';
import {
  Search,
  Filter,
  Printer,
  Share2,
  Trash2,
  Calendar,
  PlusCircle,
  FileSpreadsheet
} from 'lucide-react';
import { BusinessSettings, TransactionEntry } from '../types';

interface AllEntriesViewProps {
  entries: TransactionEntry[];
  onDeleteEntry: (id: string) => void;
  onNavigateAdd: () => void;
  onOpenInvoiceModal: (entry: TransactionEntry) => void;
  settings: BusinessSettings;
}

export const AllEntriesView: React.FC<AllEntriesViewProps> = ({
  entries,
  onDeleteEntry,
  onNavigateAdd,
  onOpenInvoiceModal,
  settings,
}) => {
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<'All' | 'Bills' | 'Receipts' | 'Cash' | 'Online' | 'Due'>('All');
  const [filterDate, setFilterDate] = useState('');

  const filtered = entries.filter((e) => {
    const matchesSearch =
      e.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
      e.customerName.toLowerCase().includes(search.toLowerCase()) ||
      e.itemDetails.toLowerCase().includes(search.toLowerCase());

    const isReceipt = e.entryType === 'Receipt' || (e.totalAmount === 0 && e.payingNow > 0);

    const matchesMode =
      filterMode === 'All'
        ? true
        : filterMode === 'Bills'
        ? !isReceipt
        : filterMode === 'Receipts'
        ? isReceipt
        : filterMode === 'Due'
        ? e.dueAmount > 0
        : e.paymentMode === filterMode;

    const matchesDate = filterDate ? e.date === filterDate : true;

    return matchesSearch && matchesMode && matchesDate;
  });

  const totalSales = filtered.reduce((acc, e) => (e.entryType === 'Receipt' ? acc : acc + e.totalAmount), 0);
  const totalCollected = filtered.reduce((acc, e) => acc + e.payingNow, 0);
  const totalPendingDues = filtered.reduce((acc, e) => acc + (e.dueAmount || 0), 0);

  const handleShareWhatsApp = (entry: TransactionEntry) => {
    const text = encodeURIComponent(
      `*${settings.businessName}*\nBill / Invoice: ${entry.invoiceNo}\nDate: ${entry.date}\nCustomer: ${entry.customerName}\nItem: ${entry.itemDetails}\nTotal: ₹${entry.totalAmount.toLocaleString()}\nPaid: ₹${entry.payingNow.toLocaleString()} (${entry.paymentMode})\nDue Balance: ₹${entry.dueAmount.toLocaleString()}\n\nThank you for choosing Shree Sai Enterprises!\nWebsite: ${settings.domainName}`
    );
    const phone = entry.customerPhone ? entry.customerPhone.replace(/[^0-9]/g, '') : '';
    const url = phone ? `https://wa.me/91${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  const exportCSV = () => {
    const headers = ['Invoice No', 'Date', 'Customer', 'Phone', 'Items', 'Total', 'Paid', 'Due', 'Mode', 'Notes'];
    const rows = filtered.map((e) => [
      e.invoiceNo,
      e.date,
      `"${e.customerName.replace(/"/g, '""')}"`,
      e.customerPhone || '',
      `"${e.itemDetails.replace(/"/g, '""')}"`,
      e.totalAmount,
      e.payingNow,
      e.dueAmount,
      e.paymentMode,
      `"${(e.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ShriSaiEnt_Transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            All Entries
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Complete transaction history and cash register log.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={exportCSV}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Export CSV
          </button>
          <button
            onClick={onNavigateAdd}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            + Add Entry
          </button>
        </div>
      </div>

      {/* Summary KPI Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-xs">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Billed</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
            ₹{totalSales.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">{filtered.length} entries shown</p>
        </div>
        <div className="bg-white dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-xs">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Amount Collected</p>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
            ₹{totalCollected.toLocaleString()}
          </p>
          <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1">Cash & Online received</p>
        </div>
        <div className="bg-white dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-xs">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Pending Udhar / Dues</p>
          <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">
            ₹{totalPendingDues.toLocaleString()}
          </p>
          <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1">To be collected from clients</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer, invoice #, item details..."
            className="w-full pl-9 pr-4 py-2 text-sm sm:text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>

        {/* Filter by Mode */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {(
            [
              { id: 'All', label: 'All Entries' },
              { id: 'Bills', label: '🛒 बिले (Bills)' },
              { id: 'Receipts', label: '🧾 जमा पावत्या' },
              { id: 'Cash', label: 'Cash' },
              { id: 'Online', label: 'Online' },
              { id: 'Due', label: 'उधारी (Due)' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              onClick={() => setFilterMode(item.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                filterMode === item.id
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Filter by Date */}
        <div className="relative flex items-center w-full md:w-auto">
          <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="pl-8 pr-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-600 w-full md:w-auto"
          />
          {filterDate && (
            <button
              onClick={() => setFilterDate('')}
              className="ml-1 text-xs text-rose-500 hover:text-rose-700 cursor-pointer font-bold px-1"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Entries Table */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm sm:text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-700 text-xs sm:text-[11px]">
              <tr>
                <th className="py-3 px-4">Invoice / Date</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Item / Details</th>
                <th className="py-3 px-4 text-right">Total (₹)</th>
                <th className="py-3 px-4 text-right">Paid (₹)</th>
                <th className="py-3 px-4 text-right">Due (₹)</th>
                <th className="py-3 px-4 text-center">Mode</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length > 0 ? (
                filtered.map((entry) => {
                  const isReceipt = entry.entryType === 'Receipt' || (entry.totalAmount === 0 && entry.payingNow > 0);
                  return (
                    <tr key={entry.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-750 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[10px] sm:text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                              isReceipt
                                ? 'bg-purple-100 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                                : 'bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                            }`}
                          >
                            {isReceipt ? 'पावती' : 'बिल'}
                          </span>
                          <span className="font-semibold text-slate-900 dark:text-white font-mono text-sm sm:text-xs">
                            {entry.invoiceNo}
                          </span>
                        </div>
                        <p className="text-xs sm:text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{entry.date}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-900 dark:text-white text-sm sm:text-xs">{entry.customerName}</p>
                        {entry.customerPhone && (
                          <p className="text-xs sm:text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                            {entry.customerPhone}
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="text-slate-800 dark:text-slate-200 truncate text-sm sm:text-xs">
                          {isReceipt && !entry.itemDetails.includes('पावती')
                            ? `उधारी जमा पावती - ${entry.itemDetails}`
                            : entry.itemDetails}
                        </p>
                        {entry.notes && (
                          <p className="text-xs sm:text-[11px] text-slate-400 dark:text-slate-500 truncate italic">
                            Note: {entry.notes}
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-white text-base sm:text-xs font-mono-num">
                        {isReceipt ? (
                          <span className="text-slate-400 dark:text-slate-500 font-normal text-xs sm:text-[11px]">— (पावती)</span>
                        ) : (
                          `₹${entry.totalAmount.toLocaleString()}`
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-emerald-600 dark:text-emerald-400 text-base sm:text-xs font-mono-num">
                        {isReceipt ? (
                          <span className="font-black text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full text-xs">
                            +₹{entry.payingNow.toLocaleString()} जमा
                          </span>
                        ) : (
                          `₹${entry.payingNow.toLocaleString()}`
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right text-base sm:text-xs">
                        {isReceipt ? (
                          <span className="text-slate-400 dark:text-slate-500">—</span>
                        ) : entry.dueAmount > 0 ? (
                          <span className="font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full font-mono-num">
                            ₹{entry.dueAmount.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500">₹0</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs sm:text-[10px] font-bold ${
                            entry.paymentMode === 'Cash'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                          }`}
                        >
                          {entry.paymentMode}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            title="Print Receipt"
                            onClick={() => onOpenInvoiceModal(entry)}
                            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 transition cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            title="Share via WhatsApp"
                            onClick={() => handleShareWhatsApp(entry)}
                            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-700 transition cursor-pointer"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            title="Delete entry"
                            onClick={() => {
                              if (window.confirm(`Delete entry ${entry.invoiceNo}?`)) {
                                onDeleteEntry(entry.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 dark:text-slate-500 text-sm sm:text-xs">
                    No transactions found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
