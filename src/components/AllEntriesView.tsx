import React, { useState, useMemo, useDeferredValue, useEffect } from 'react';
import {
  Search,
  Filter,
  Printer,
  Share2,
  Trash2,
  Calendar,
  PlusCircle,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  MapPin,
  Tag,
  Barcode,
  Pencil
} from 'lucide-react';
import { BusinessSettings, TransactionEntry } from '../types';

interface AllEntriesViewProps {
  entries: TransactionEntry[];
  onDeleteEntry: (id: string) => void;
  onNavigateAdd: () => void;
  onOpenInvoiceModal: (entry: TransactionEntry) => void;
  onEditEntry?: (entry: TransactionEntry) => void;
  onConfirmOrder?: (entry: TransactionEntry) => void;
  settings: BusinessSettings;
}

export const AllEntriesView: React.FC<AllEntriesViewProps> = ({
  entries,
  onDeleteEntry,
  onNavigateAdd,
  onOpenInvoiceModal,
  onEditEntry,
  onConfirmOrder,
  settings,
}) => {
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [filterMode, setFilterMode] = useState<'All' | 'CartOrders' | 'Cash' | 'Online' | 'Due'>('All');
  const [filterDate, setFilterDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 30; // 30 entries per page for smooth scrolling and fast rendering

  useEffect(() => {
    setCurrentPage(1);
  }, [deferredSearch, filterMode, filterDate]);

  const filtered = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    return entries.filter((e) => {
      const matchesSearch =
        !q ||
        e.invoiceNo.toLowerCase().includes(q) ||
        e.customerName.toLowerCase().includes(q) ||
        (e.customerPhone && e.customerPhone.includes(q)) ||
        (e.village && e.village.toLowerCase().includes(q)) ||
        (e.modelNumber && e.modelNumber.toLowerCase().includes(q)) ||
        (e.model && e.model.toLowerCase().includes(q)) ||
        (e.serialNumber && e.serialNumber.toLowerCase().includes(q)) ||
        e.itemDetails.toLowerCase().includes(q);

      const matchesMode =
        filterMode === 'All'
          ? true
          : filterMode === 'CartOrders'
          ? e.source === 'online_cart' || e.invoiceNo.startsWith('INV-ORD') || Boolean(e.orderStatus) || e.itemDetails.toLowerCase().includes('online')
          : filterMode === 'Due'
          ? e.dueAmount > 0
          : e.paymentMode === filterMode;

      const matchesDate = filterDate ? e.date === filterDate : true;

      return matchesSearch && matchesMode && matchesDate;
    });
  }, [entries, deferredSearch, filterMode, filterDate]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedEntries = useMemo(() => {
    const start = (safeCurrentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, safeCurrentPage]);

  const totalSales = filtered.reduce((acc, e) => acc + e.totalAmount, 0);
  const totalCollected = filtered.reduce((acc, e) => acc + e.payingNow, 0);
  const totalPendingDues = filtered.reduce((acc, e) => acc + (e.dueAmount || 0), 0);

  const handleShareWhatsApp = (entry: TransactionEntry) => {
    let itemsBlock = '';
    if (entry.itemsDetail && entry.itemsDetail.length > 0) {
      itemsBlock = entry.itemsDetail.map((it, idx) => {
        let line = `${idx + 1}) ${it.productName} (${it.quantity} नग × ₹${it.unitPrice.toLocaleString()})`;
        if (it.modelNumber) line += ` [Model: ${it.modelNumber}]`;
        if (it.serialNumber) line += ` [Sr: ${it.serialNumber}]`;
        return line;
      }).join('\n');
    } else {
      itemsBlock = (entry.modelNumber || entry.model ? `Model No: ${entry.modelNumber || entry.model}\n` : '') +
        (entry.serialNumber ? `Serial No / IMEI: ${entry.serialNumber}\n` : '') +
        `Item: ${entry.itemDetails}`;
    }

    const text = encodeURIComponent(
      `*${settings.businessName}*\n` +
      `Bill / Invoice: ${entry.invoiceNo}\n` +
      `Date: ${entry.date}\n` +
      `Customer: ${entry.customerName}${entry.village ? ` (${entry.village})` : ''}\n` +
      `--------------------------------\n` +
      `${itemsBlock}\n` +
      `--------------------------------\n` +
      `Total: ₹${entry.totalAmount.toLocaleString()}\n` +
      `Paid: ₹${entry.payingNow.toLocaleString()} (${entry.paymentMode})\n` +
      (entry.dueAmount > 0 ? `Due Balance: ₹${entry.dueAmount.toLocaleString()}\n` : `Status: Fully Paid\n`) +
      `\nThank you for choosing Shree Sai Enterprises!\nWebsite: ${settings.domainName}`
    );
    const phone = entry.customerPhone ? entry.customerPhone.replace(/[^0-9]/g, '') : '';
    const url = phone ? `https://wa.me/91${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  const exportCSV = () => {
    const headers = [
      'Invoice No',
      'Date',
      'Customer',
      'Village',
      'Phone',
      'Items',
      'Model No',
      'Serial No',
      'Total',
      'Paid',
      'Due',
      'Mode',
      'Notes'
    ];
    const rows = filtered.map((e) => {
      const models = e.itemsDetail && e.itemsDetail.length > 0
        ? e.itemsDetail.map((i) => i.modelNumber).filter(Boolean).join('; ')
        : (e.modelNumber || e.model || '');
      const serials = e.itemsDetail && e.itemsDetail.length > 0
        ? e.itemsDetail.map((i) => i.serialNumber).filter(Boolean).join('; ')
        : (e.serialNumber || '');
      const itemDesc = e.itemsDetail && e.itemsDetail.length > 0
        ? e.itemsDetail.map((i) => `${i.productName} (${i.quantity})`).join('; ')
        : e.itemDetails;

      return [
        e.invoiceNo,
        e.date,
        `"${e.customerName.replace(/"/g, '""')}"`,
        `"${(e.village || '').replace(/"/g, '""')}"`,
        e.customerPhone || '',
        `"${itemDesc.replace(/"/g, '""')}"`,
        `"${models.replace(/"/g, '""')}"`,
        `"${serials.replace(/"/g, '""')}"`,
        e.totalAmount,
        e.payingNow,
        e.dueAmount,
        e.paymentMode,
        `"${(e.notes || '').replace(/"/g, '""')}"`,
      ];
    });

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
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/50 text-[#00523f] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              खरेदी-विक्री नोंदवही (Sales & Cash Register)
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
              {filtered.length} पावत्या
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-baseline gap-2">
            <span>सर्व बिले व व्यवहार</span>
            <span className="text-sm sm:text-base font-normal text-slate-500 dark:text-slate-400">/ All Invoices</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {settings.businessName} • संपूर्ण व्यवहार इतिहास, रोख व ऑनलाइन गल्ला आणि उधारी नोंद
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={exportCSV}
            className="px-4 py-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            एक्सेल डाउनलोड (CSV)
          </button>
          <button
            onClick={onNavigateAdd}
            className="px-5 py-2 rounded-full bg-[#00523f] hover:bg-[#004232] text-white text-xs font-bold shadow-[0_4px_14px_rgba(0,82,63,0.25)] transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            + नवीन बिल नोंद (Add Entry)
          </button>
        </div>
      </div>

      {/* Summary KPI Bento Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#131b2e] rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-[0_10px_30px_-6px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">एकूण बिल विक्री (Total Billed)</p>
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">
            ₹{totalSales.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">{filtered.length} पावत्या दर्शविल्या</p>
        </div>

        <div className="bg-white dark:bg-[#131b2e] rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-[0_10px_30px_-6px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">एकूण जमा रक्कम (Collected)</p>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
          <p className="text-2xl font-extrabold text-[#00523f] dark:text-emerald-400 mt-2">
            ₹{totalCollected.toLocaleString()}
          </p>
          <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-1">रोख आणि ऑनलाइन जमा झालेला गल्ला</p>
        </div>

        <div className="bg-white dark:bg-[#131b2e] rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-[0_10px_30px_-6px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">उर्वरित उधारी येणे (Pending Dues)</p>
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          </div>
          <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-2">
            ₹{totalPendingDues.toLocaleString()}
          </p>
          <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-1">ग्राहकांकडून येणे बाकी</p>
        </div>
      </div>

      {/* Search and Filters with Pill Design */}
      <div className="bg-white dark:bg-[#131b2e] rounded-3xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-[0_10px_30px_-6px_rgba(0,0,0,0.03)] flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="search-entries-input"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ग्राहक नाव, पावती क्र., किंवा वस्तू नावाने शोधा (Search)..."
            className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-[#F8F9FA] dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full focus:outline-none focus:ring-2 focus:ring-[#00523f]/20 focus:border-[#00523f] text-slate-900 dark:text-white placeholder-slate-400 transition"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center text-xs font-bold cursor-pointer transition"
              title="सर्च साफ करा"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter by Mode with Rounded-full Pills */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {(['All', 'CartOrders', 'Cash', 'Online', 'Due'] as const).map((mode) => {
            const isSelected = filterMode === mode;
            return (
              <button
                key={mode}
                onClick={() => setFilterMode(mode)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                  isSelected
                    ? 'bg-[#00523f] text-white shadow-[0_4px_14px_rgba(0,82,63,0.25)]'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {mode === 'All'
                  ? 'सर्व (All)'
                  : mode === 'CartOrders'
                  ? '🛒 ऑनलाईन ऑर्डर्स'
                  : mode === 'Cash'
                  ? 'रोख (Cash)'
                  : mode === 'Online'
                  ? 'ऑनलाइन (UPI)'
                  : 'उधारी (Due)'}
              </button>
            );
          })}
        </div>

        {/* Filter by Date */}
        <div className="relative flex items-center w-full md:w-auto">
          <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="pl-9 pr-3 py-1.5 text-xs bg-[#F8F9FA] dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full text-slate-700 dark:text-slate-200 focus:outline-none focus:border-[#00523f] w-full md:w-auto font-medium"
          />
          {filterDate && (
            <button
              onClick={() => setFilterDate('')}
              className="ml-1.5 text-xs text-rose-500 hover:text-rose-700 cursor-pointer font-bold px-1"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Pagination Status & Quick Jump Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#131b2e] px-4 py-3 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-slate-900 dark:text-white">
            दाखवत आहे: {filtered.length > 0 ? (safeCurrentPage - 1) * PAGE_SIZE + 1 : 0} -{' '}
            {Math.min(safeCurrentPage * PAGE_SIZE, filtered.length)}
          </span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-500 dark:text-slate-400">
            एकूण <strong>{filtered.length.toLocaleString()}</strong> पावत्या (पृष्ठ <strong>{safeCurrentPage}</strong> / {totalPages})
          </span>
        </div>

        {/* Compact Page Controls */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1 self-end sm:self-auto">
            <button
              type="button"
              disabled={safeCurrentPage <= 1}
              onClick={() => setCurrentPage(1)}
              title="पहिले पृष्ठ"
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={safeCurrentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              title="मागील पृष्ठ"
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">मागील</span>
            </button>

            <span className="px-2 font-mono font-bold text-slate-800 dark:text-slate-200">
              {safeCurrentPage} / {totalPages}
            </span>

            <button
              type="button"
              disabled={safeCurrentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              title="पुढील पृष्ठ"
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer"
            >
              <span className="hidden sm:inline">पुढील</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={safeCurrentPage >= totalPages}
              onClick={() => setCurrentPage(totalPages)}
              title="शेवटचे पृष्ठ"
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Entries Table with Neo-Apple Rounded-3xl */}
      <div className="bg-white dark:bg-[#131b2e] rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-[0_10px_30px_-6px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 uppercase tracking-wider font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4">पावती / दिनांक (Invoice)</th>
                <th className="py-3.5 px-4">ग्राहकाचे नाव (Customer)</th>
                <th className="py-3.5 px-4">वस्तू तपशील (Item)</th>
                <th className="py-3.5 px-4 text-right">एकूण (Total ₹)</th>
                <th className="py-3.5 px-4 text-right">जमा (Paid ₹)</th>
                <th className="py-3.5 px-4 text-right">उधारी (Due ₹)</th>
                <th className="py-3.5 px-4 text-center">भरणा पद्धत</th>
                <th className="py-3.5 px-4 text-right">कृती (Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedEntries.length > 0 ? (
                paginatedEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900 dark:text-white font-mono">
                        {entry.invoiceNo}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{entry.date}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900 dark:text-white">{entry.customerName}</p>
                      <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-400 mt-0.5">
                        {entry.customerPhone && (
                          <span className="font-mono">{entry.customerPhone}</span>
                        )}
                        {entry.village && (
                          <span className="text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-800 font-medium flex items-center gap-0.5">
                            <MapPin className="w-2.5 h-2.5" />
                            {entry.village}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 max-w-sm">
                      {entry.itemsDetail && entry.itemsDetail.length > 0 ? (
                        <div className="space-y-1.5">
                          {entry.itemsDetail.map((it, idx) => (
                            <div key={idx} className="border-b border-slate-100 dark:border-slate-800/80 pb-1 last:border-b-0 last:pb-0">
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                  {it.productName}
                                </span>
                                <span className="text-[11px] font-mono text-slate-500 font-bold shrink-0">
                                  {it.quantity} नग
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 flex-wrap text-[10px] mt-0.5 font-mono">
                                {it.modelNumber && (
                                  <span className="bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 px-1.5 py-0.2 rounded border border-blue-200 dark:border-blue-800 font-semibold flex items-center gap-0.5" title="Model No">
                                    <Tag className="w-2.5 h-2.5 text-blue-600" />
                                    {it.modelNumber}
                                  </span>
                                )}
                                {it.serialNumber && (
                                  <span className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-800 font-semibold flex items-center gap-0.5" title="Serial No / IMEI">
                                    <Barcode className="w-2.5 h-2.5 text-emerald-600" />
                                    {it.serialNumber}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <>
                          <p className="text-slate-800 dark:text-slate-200 font-medium truncate">{entry.itemDetails}</p>
                          <div className="flex items-center gap-1.5 flex-wrap text-[10px] mt-1 font-mono">
                            {(entry.modelNumber || entry.model) && (
                              <span className="bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800 font-semibold flex items-center gap-0.5" title="Model No">
                                <Tag className="w-2.5 h-2.5 text-blue-600" />
                                {entry.modelNumber || entry.model}
                              </span>
                            )}
                            {entry.serialNumber && (
                              <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 flex items-center gap-0.5" title="Serial No / IMEI">
                                <Barcode className="w-2.5 h-2.5 text-emerald-600" />
                                {entry.serialNumber}
                              </span>
                            )}
                          </div>
                        </>
                      )}
                      {entry.notes && (
                        <p className="text-[11px] text-slate-400 truncate italic mt-1">
                          टीप: {entry.notes}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-slate-900 dark:text-white">
                      ₹{entry.totalAmount.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-[#00523f] dark:text-emerald-400">
                      ₹{entry.payingNow.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {entry.dueAmount > 0 ? (
                        <span className="font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                          ₹{entry.dueAmount.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-slate-400">₹0</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-3 py-0.5 rounded-full text-[10px] font-bold ${
                          entry.paymentMode === 'Cash'
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-[#00523f] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                        }`}
                      >
                        {entry.paymentMode === 'Cash' ? 'रोख (Cash)' : 'ऑनलाइन (UPI)'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {onConfirmOrder && (
                          <button
                            title="ऑर्डर कन्फर्म करा व मॉडेल/सिरीयल नंबर टाका"
                            onClick={() => onConfirmOrder(entry)}
                            className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition cursor-pointer font-bold text-xs flex items-center gap-1"
                          >
                            <Barcode className="w-3.5 h-3.5" />
                            <span className="hidden xl:inline">सिरीयल</span>
                          </button>
                        )}
                        {onEditEntry && (
                          <button
                            title="बिल दुरुस्त करा (Edit Bill)"
                            onClick={() => onEditEntry(entry)}
                            className="p-1.5 rounded-full text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          title="पावती प्रिंट करा (Print Receipt)"
                          onClick={() => onOpenInvoiceModal(entry)}
                          className="p-1.5 rounded-full text-slate-500 hover:text-[#00523f] hover:bg-emerald-50 dark:hover:bg-slate-800 transition cursor-pointer"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          title="व्हॉट्सॲपवर पाठवा (WhatsApp Share)"
                          onClick={() => handleShareWhatsApp(entry)}
                          className="p-1.5 rounded-full text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 transition cursor-pointer"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button
                          title="नोंद हटवा (Delete Entry)"
                          onClick={() => {
                            if (window.confirm(`Delete entry ${entry.invoiceNo}?`)) {
                              onDeleteEntry(entry.id);
                            }
                          }}
                          className="p-1.5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400 text-xs">
                    कोणतेही रेकॉर्ड सापडले नाही (No transactions found).
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs">
          <p className="text-slate-500 dark:text-slate-400">
            पृष्ठ <strong>{safeCurrentPage}</strong> पैकी <strong>{totalPages}</strong> (एकूण {filtered.length.toLocaleString()} पावत्या)
          </p>

          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            <button
              type="button"
              disabled={safeCurrentPage <= 1}
              onClick={() => {
                setCurrentPage(1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              ⏮ प्रथम
            </button>
            <button
              type="button"
              disabled={safeCurrentPage <= 1}
              onClick={() => {
                setCurrentPage((p) => Math.max(1, p - 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              मागील (Prev)
            </button>

            <button
              type="button"
              disabled={safeCurrentPage >= totalPages}
              onClick={() => {
                setCurrentPage((p) => Math.min(totalPages, p + 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-3.5 py-1.5 rounded-full bg-[#00523f] font-bold text-white hover:bg-[#004232] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 shadow-xs"
            >
              पुढील (Next)
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={safeCurrentPage >= totalPages}
              onClick={() => {
                setCurrentPage(totalPages);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              अंतिम ⏭
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
