import React, { useState, useMemo, useDeferredValue, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  MapPin,
  IndianRupee,
  Share2,
  CheckCircle,
  CheckCircle2,
  AlertCircle,
  FileText,
  Printer,
  Receipt,
  RefreshCw,
  BookOpen,
  Database,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Merge,
  Sparkles,
  X
} from 'lucide-react';
import { BusinessSettings, Customer, TransactionEntry, CardTransaction } from '../types';
import { CustomerLedgerModal } from './CustomerLedgerModal';
import { MergeCustomerModal } from './MergeCustomerModal';
import { detectDuplicateCustomers } from '../utils/customerDeduplication';

interface CustomersViewProps {
  customers: Customer[];
  transactions?: TransactionEntry[];
  cardTransactions?: CardTransaction[];
  onAddCustomer: (customer: Omit<Customer, 'id'>) => void;
  onSettlePayment: (customerId: string, amount: number, mode: 'Cash' | 'Online', notes: string) => void;
  onRecheckLedgers?: () => void;
  onNavigateUploadedData?: () => void;
  onMergeCustomers?: (primaryId: string, secondaryId: string, overrides?: any) => void;
  settings: BusinessSettings;
  mergedRecords?: any[];
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  transactions = [],
  cardTransactions = [],
  onAddCustomer,
  onSettlePayment,
  onRecheckLedgers,
  onNavigateUploadedData,
  onMergeCustomers,
  settings,
  mergedRecords,
}) => {
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [statusFilter, setStatusFilter] = useState<'all' | 'due' | 'cleared'>('all');
  const [selectedVillage, setSelectedVillage] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'due_desc' | 'name_asc' | 'purchased_desc'>('due_desc');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 24; // 24 cards per page ensures instant render without mobile freezing

  const [showAddModal, setShowAddModal] = useState(false);
  const [settleModalCust, setSettleModalCust] = useState<Customer | null>(null);
  const [selectedLedgerCust, setSelectedLedgerCust] = useState<Customer | null>(null);
  const [recheckMessage, setRecheckMessage] = useState<string>('');

  // Customer Account Merge states
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [mergePrimaryCust, setMergePrimaryCust] = useState<Customer | null>(null);
  const [mergeSecondaryCust, setMergeSecondaryCust] = useState<Customer | null>(null);
  const [mergeSuccessBanner, setMergeSuccessBanner] = useState<string | null>(null);

  // Detect likely duplicate accounts (e.g. Shesh Bhagat vs Sheshrav Bhagat)
  const duplicateCandidates = useMemo(() => detectDuplicateCustomers(customers, mergedRecords), [customers, mergedRecords]);

  // Add customer form states
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');

  // Settle form states
  const [settleAmount, setSettleAmount] = useState('');
  const [settleMode, setSettleMode] = useState<'Cash' | 'Online'>('Cash');
  const [settleNotes, setSettleNotes] = useState('');

  // Extract unique villages/areas
  const uniqueVillages = useMemo(() => {
    const set = new Set<string>();
    customers.forEach((c) => {
      if (c.village) set.add(c.village.trim());
      else if (c.address) {
        const parts = c.address.split(',').map((p) => p.trim()).filter(Boolean);
        parts.forEach((p) => {
          if (p.length > 2 && !p.toLowerCase().includes('shop') && !p.toLowerCase().includes('plot')) {
            set.add(p);
          }
        });
      }
    });
    return Array.from(set).slice(0, 20);
  }, [customers]);

  const dueCount = useMemo(() => customers.filter((c) => (c.balanceDue || 0) > 0).length, [customers]);
  const clearedCount = useMemo(() => customers.filter((c) => (c.balanceDue || 0) <= 0).length, [customers]);

  // Reset page to 1 whenever search query, status or village filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [deferredSearch, statusFilter, selectedVillage, sortBy]);

  const filtered = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    return customers
      .filter((c) => {
        const matchesSearch =
          !q ||
          c.name.toLowerCase().includes(q) ||
          (c.phone && c.phone.includes(q)) ||
          (c.address && c.address.toLowerCase().includes(q)) ||
          (c.village && c.village.toLowerCase().includes(q));

        let matchesStatus = true;
        if (statusFilter === 'due') matchesStatus = (c.balanceDue || 0) > 0;
        if (statusFilter === 'cleared') matchesStatus = (c.balanceDue || 0) <= 0;

        let matchesVillage = true;
        if (selectedVillage !== 'all') {
          matchesVillage =
            (c.village && c.village.toLowerCase() === selectedVillage.toLowerCase()) ||
            (c.address && c.address.toLowerCase().includes(selectedVillage.toLowerCase()));
        }

        return matchesSearch && matchesStatus && matchesVillage;
      })
      .sort((a, b) => {
        if (sortBy === 'due_desc') return (b.balanceDue || 0) - (a.balanceDue || 0);
        if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
        if (sortBy === 'purchased_desc') {
          const purA = Math.max(a.totalPurchased || 0, (a.totalPaid || 0) + (a.balanceDue || 0));
          const purB = Math.max(b.totalPurchased || 0, (b.totalPaid || 0) + (b.balanceDue || 0));
          return purB - purA;
        }
        return 0;
      });
  }, [customers, deferredSearch, statusFilter, selectedVillage, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  // Paginated subset of customers to render only 24 items at a time
  const paginatedCustomers = useMemo(() => {
    const start = (safeCurrentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, safeCurrentPage]);

  const totalUdhar = customers.reduce((acc, c) => acc + (c.balanceDue || 0), 0);

  const handleRunRecheck = () => {
    if (onRecheckLedgers) {
      onRecheckLedgers();
      setRecheckMessage('खातेवही तपासणी पूर्ण! सर्व ग्राहकांचे जुने बिल, जमा पावत्या व बाकी अचूक जुळवले गेले आहेत.');
      setTimeout(() => setRecheckMessage(''), 5000);
    }
  };

  const handleSendReminder = (c: Customer) => {
    const effectivePurchased = Math.max(c.totalPurchased || 0, (c.totalPaid || 0) + (c.balanceDue || 0));
    const text = encodeURIComponent(
      `*${settings.businessName}*\n` +
      `*श्री साई इंटरप्राइजेस, वर्धा*\n` +
      `*ग्राहक खाते विवरण / Ledger Statement*\n` +
      `------------------------------------------\n` +
      `👤 *ग्राहक:* ${c.name}\n` +
      `📞 *मोबाईल:* ${c.phone || 'N/A'}\n` +
      (c.village ? `📍 *गाव:* ${c.village}\n` : '') +
      `📅 *दिनांक:* ${new Date().toLocaleDateString('en-IN')}\n` +
      `------------------------------------------\n` +
      `📦 एकूण खरेदी (Total Purchases): *₹${effectivePurchased.toLocaleString()}*\n` +
      `✅ एकूण जमा (Total Paid): *₹${(c.totalPaid || 0).toLocaleString()}*\n` +
      `⚠️ *शिल्लक बाकी (Balance Due): ₹${(c.balanceDue || 0).toLocaleString()}*\n` +
      `------------------------------------------\n` +
      (c.balanceDue > 0
        ? `🙏 नम्र विनंती: कृपया बाकी रक्कम ₹${(c.balanceDue || 0).toLocaleString()} लवकरात लवकर जमा करावी.\n` +
          `💳 UPI / PhonePe / GPay: *8766486915@upi*\n`
        : `🎉 आपले सर्व खाते क्लिअर आहे! धन्यवाद!\n`) +
      `📞 संपर्क: ${settings.phone} / 8600122798\n` +
      `📍 पत्ता: मातोश्री सभागृह समोर, आर्वी रोड, पंजाब कॉलनी, वर्धा`
    );
    const phone = c.phone.replace(/[^0-9]/g, '');
    const url = phone ? `https://wa.me/91${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  const submitAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;

    onAddCustomer({
      name: newName.trim(),
      phone: newPhone.trim(),
      address: newAddress.trim() || undefined,
      totalPurchased: 0,
      totalPaid: 0,
      balanceDue: 0,
      lastVisit: new Date().toISOString().split('T')[0],
    });

    setNewName('');
    setNewPhone('');
    setNewAddress('');
    setShowAddModal(false);
  };

  const submitSettlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(settleAmount);
    if (!settleModalCust || !amount || amount <= 0) return;

    onSettlePayment(settleModalCust.id, amount, settleMode, settleNotes);
    setSettleModalCust(null);
    setSettleAmount('');
    setSettleNotes('');
  };

  return (
    <div className="max-w-7xl mx-auto px-2.5 sm:px-6 py-3.5 sm:py-6 space-y-3.5 sm:space-y-6 pb-28">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Customers & Khata Book
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            ग्राहक नोंदवही, जुने हिशोब, बाकी उधारी आणि WhatsApp स्टेटमेंट
          </p>
        </div>

        {/* Action buttons toolbar - Clean and responsive */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 self-start sm:self-auto w-full sm:w-auto">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ नवीन ग्राहक</span>
          </button>

          {onNavigateUploadedData && (
            <button
              type="button"
              onClick={onNavigateUploadedData}
              title="अपलोड झालेला सर्व २,५०२+ डेटा व मास्टर रजिस्टर पहा"
              className="px-2.5 sm:px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 dark:bg-blue-950/50 dark:text-blue-200 border border-blue-200 dark:border-blue-800 text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
            >
              <Database className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="hidden sm:inline">सर्व डेटा रजिस्टर</span>
              <span className="sm:hidden">डेटा</span>
            </button>
          )}

          {onMergeCustomers && (
            <button
              type="button"
              onClick={() => {
                setMergePrimaryCust(null);
                setMergeSecondaryCust(null);
                setShowMergeModal(true);
              }}
              title="दोन खाती एकाच व्यक्तीची असल्यास एकत्र करा (Merge Accounts)"
              className="px-2.5 sm:px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-200 dark:border-indigo-800 text-xs font-bold transition flex items-center gap-1 cursor-pointer border border-indigo-200 shadow-2xs"
            >
              <Merge className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden sm:inline">खाते एकत्र करा</span>
              <span className="sm:hidden">Merge</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleRunRecheck}
            title="सर्व जुने बिल व पावत्या तपासून खातेवही अचूक जुळवा"
            className="px-2.5 sm:px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer border border-slate-200 dark:border-slate-700 shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">खातेवही ताडून पहा</span>
            <span className="sm:hidden">Recheck</span>
          </button>
        </div>
      </div>

      {/* Recheck Toast Banner */}
      {recheckMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{recheckMessage}</span>
          </div>
          <button
            onClick={() => setRecheckMessage('')}
            className="text-xs text-emerald-700 font-bold hover:underline cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Merge Success Banner */}
      {mergeSuccessBanner && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{mergeSuccessBanner}</span>
          </div>
          <button
            onClick={() => setMergeSuccessBanner(null)}
            className="text-xs text-emerald-700 dark:text-emerald-300 font-bold hover:underline cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* KPI & Filters Bar - Mobile friendly grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4">
        <div className="bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-750 p-3 sm:p-4 shadow-xs">
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">एकूण ग्राहक (Clients)</p>
          <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">{customers.length.toLocaleString()}</p>
        </div>
        <div className="bg-amber-50/70 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800 p-3 sm:p-4 shadow-xs">
          <p className="text-[11px] sm:text-xs text-amber-900 dark:text-amber-300 font-bold">मार्केट उधारी (Pending)</p>
          <p className="text-xl sm:text-2xl font-black text-amber-700 dark:text-amber-400 mt-1">₹{totalUdhar.toLocaleString()}</p>
        </div>
        <div className="col-span-2 md:col-span-1 bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-750 p-2.5 sm:p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1 sm:mb-0">
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">उधारी फिल्टर (Filter)</p>
            <span className="text-[10px] sm:text-[11px] text-slate-400 font-mono">
              {filtered.length} / {customers.length}
            </span>
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5 mt-1 sm:mt-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setStatusFilter('all')}
              className={`flex-1 py-1 text-[11px] sm:text-xs font-bold rounded-lg transition cursor-pointer ${
                statusFilter === 'all' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              All ({customers.length})
            </button>
            <button
              onClick={() => setStatusFilter('due')}
              className={`flex-1 py-1 text-[11px] sm:text-xs font-bold rounded-lg transition cursor-pointer ${
                statusFilter === 'due' ? 'bg-[#0D9488] text-white shadow-xs' : 'text-amber-800 dark:text-amber-300 hover:text-amber-900'
              }`}
            >
              Due ({dueCount})
            </button>
            <button
              onClick={() => setStatusFilter('cleared')}
              className={`flex-1 py-1 text-[11px] sm:text-xs font-bold rounded-lg transition cursor-pointer ${
                statusFilter === 'cleared' ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-800 dark:text-emerald-400 hover:text-emerald-900'
              }`}
            >
              Cleared ({clearedCount})
            </button>
          </div>
        </div>
      </div>

      {/* Auto-detected Duplicate Accounts Alert Banner */}
      {duplicateCandidates.length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border border-amber-300 dark:border-amber-800 shadow-xs space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 shrink-0 mt-0.5">
                <AlertCircle className="w-5 h-5 text-amber-700 dark:text-amber-300" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-amber-950 dark:text-amber-100 flex items-center gap-2">
                  <span>संभाव्य डुप्लिकेट खाती आढळली ({duplicateCandidates.length})</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-200 dark:bg-amber-800 rounded-full text-amber-950 dark:text-amber-100">
                    अकाउंटिंग दुरुस्ती
                  </span>
                </h4>
                <p className="text-xs text-amber-900 dark:text-amber-200 mt-1">
                  <strong>{duplicateCandidates[0].primary.name}</strong> ({duplicateCandidates[0].primary.phone || 'मोबाईल नाही'}) आणि <strong>{duplicateCandidates[0].secondary.name}</strong> ({duplicateCandidates[0].secondary.village || duplicateCandidates[0].secondary.address || 'पत्ता उपलब्ध नाही'}) हे एकाच व्यक्तीचे २ खाते असू शकतात.
                </p>
                <div className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5 font-medium">
                  कारण: {duplicateCandidates[0].reason}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setMergePrimaryCust(duplicateCandidates[0].primary);
                setMergeSecondaryCust(duplicateCandidates[0].secondary);
                setShowMergeModal(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-black text-xs flex items-center gap-2 shadow-md shadow-amber-600/30 transition cursor-pointer self-start sm:self-auto shrink-0 active:scale-95"
            >
              <Merge className="w-4 h-4" />
              <span>आताच १-क्लिक एकत्र करा (Merge Both)</span>
            </button>
          </div>
        </div>
      )}

      {/* Search & Village Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="search-customers-input"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ग्राहकाचे नाव, फोन नंबर किंवा गाव शोधा... (Search customer)"
            className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00523f]/20 focus:border-[#00523f] shadow-2xs transition"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center text-xs font-bold cursor-pointer transition"
              title="सर्च साफ करा (Clear)"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {uniqueVillages.length > 0 && (
          <select
            value={selectedVillage}
            onChange={(e) => setSelectedVillage(e.target.value)}
            className="px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00523f]/20 shadow-2xs cursor-pointer"
          >
            <option value="all">📍 सर्व गावे / All Villages ({uniqueVillages.length})</option>
            {uniqueVillages.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        )}

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00523f]/20 shadow-2xs cursor-pointer"
        >
          <option value="due_desc">💰 बाकी जास्त ते कमी (Highest Due)</option>
          <option value="name_asc">🔤 नाव A ते Z (Name A-Z)</option>
          <option value="purchased_desc">🛍️ एकूण खरेदी जास्त (Top Purchases)</option>
        </select>
      </div>

      {/* Pagination Status & Quick Jump Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-850 p-3 rounded-2xl border border-slate-200 dark:border-slate-750 shadow-2xs text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-slate-900 dark:text-white">
            दाखवत आहे: {filtered.length > 0 ? (safeCurrentPage - 1) * PAGE_SIZE + 1 : 0} -{' '}
            {Math.min(safeCurrentPage * PAGE_SIZE, filtered.length)}
          </span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-500 dark:text-slate-400">
            एकूण <strong>{filtered.length.toLocaleString()}</strong> ग्राहक (पृष्ठ <strong>{safeCurrentPage}</strong> / {totalPages})
          </span>
          {search && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-[#00523f] dark:text-emerald-400 text-[11px] font-bold border border-emerald-200 dark:border-emerald-800">
              "{search}" चे निकाल
            </span>
          )}
        </div>

        {/* Compact Page Controls */}
        <div className="flex items-center gap-1 self-end sm:self-auto">
          <button
            type="button"
            disabled={safeCurrentPage <= 1}
            onClick={() => setCurrentPage(1)}
            title="पहिले पृष्ठ (First)"
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={safeCurrentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            title="मागील पृष्ठ (Previous)"
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
            title="पुढील पृष्ठ (Next)"
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer"
          >
            <span className="hidden sm:inline">पुढील</span>
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={safeCurrentPage >= totalPages}
            onClick={() => setCurrentPage(totalPages)}
            title="शेवटचे पृष्ठ (Last)"
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Customers List Cards - Only 24 items mapped for ultra-fast performance */}
      {paginatedCustomers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {paginatedCustomers.map((c) => {
            const effectivePurchased = Math.max(c.totalPurchased || 0, (c.totalPaid || 0) + (c.balanceDue || 0));

            return (
              <div
                key={c.id}
                className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-750 p-3.5 sm:p-5 shadow-xs flex flex-col justify-between space-y-3 sm:space-y-4 hover:border-teal-500/50 transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">{c.name}</h3>
                      {c.phone && c.phone !== '0' ? (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <a href={`tel:${c.phone}`} className="font-mono hover:text-blue-600 hover:underline">
                            {c.phone}
                          </a>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 mt-1">
                          <Phone className="w-3 h-3 text-slate-300 shrink-0" />
                          <span className="italic text-[11px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">मोबाईल नाही</span>
                        </div>
                      )}
                    </div>
                    {c.balanceDue > 0 ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-100/90 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800 shadow-2xs shrink-0 font-mono">
                        बाकी: ₹{c.balanceDue.toLocaleString()}
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shrink-0">
                        Cleared
                      </span>
                    )}
                  </div>

                  {c.address && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-2">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{c.address}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 block text-[11px] font-medium">एकूण खरेदी (Total)</span>
                      <span className="font-bold text-slate-900 dark:text-white font-mono text-xs sm:text-sm">
                        ₹{effectivePurchased.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 block text-[11px] font-medium">एकूण जमा (Paid)</span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400 font-mono text-xs sm:text-sm">
                        ₹{(c.totalPaid || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  {/* Full Statement Button */}
                  <button
                    onClick={() => setSelectedLedgerCust(c)}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-[#00523f] text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.99]"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                    <span>खातेवही हिशोब (Bills + Payments)</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSettleModalCust(c)}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-[#00523f] dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-xs font-bold transition cursor-pointer text-center"
                    >
                      + Receive Payment
                    </button>
                    {onMergeCustomers && (
                      <button
                        title="हे खाते दुसऱ्या खात्यात एकत्र / विलीन करा (Merge Accounts)"
                        onClick={() => {
                          setMergePrimaryCust(c);
                          setMergeSecondaryCust(null);
                          setShowMergeModal(true);
                        }}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-300 transition cursor-pointer"
                      >
                        <Merge className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      title="WhatsApp Statement / Due Reminder"
                      onClick={() => handleSendReminder(c)}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs active:scale-95 shrink-0"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-750 p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            कोणताही ग्राहक सापडला नाही (No Customers Found)
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            तुम्ही शोधत असलेले नाव किंवा फिल्टर उपलब्ध नाही. कृपया सर्च बदलून पहा किंवा फिल्टर क्लिअर करा.
          </p>
          {(search || statusFilter !== 'all' || selectedVillage !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
                setSelectedVillage('all');
              }}
              className="px-4 py-2 rounded-full bg-slate-900 dark:bg-slate-700 text-white text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
            >
              फिल्टर साफ करा (Clear Filters)
            </button>
          )}
        </div>
      )}

      {/* Bottom Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            पृष्ठ <strong>{safeCurrentPage}</strong> पैकी <strong>{totalPages}</strong> (एकूण {filtered.length.toLocaleString()} ग्राहक)
          </p>

          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            <button
              type="button"
              disabled={safeCurrentPage <= 1}
              onClick={() => {
                setCurrentPage(1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              ⏮ प्रथम (First)
            </button>
            <button
              type="button"
              disabled={safeCurrentPage <= 1}
              onClick={() => {
                setCurrentPage((p) => Math.max(1, p - 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              मागील (Prev)
            </button>

            {/* Quick jump to page */}
            <div className="flex items-center gap-1 px-2 text-xs">
              <span className="text-slate-500">पृष्ठ:</span>
              <select
                value={safeCurrentPage}
                onChange={(e) => {
                  setCurrentPage(Number(e.target.value));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 dark:text-white"
              >
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              disabled={safeCurrentPage >= totalPages}
              onClick={() => {
                setCurrentPage((p) => Math.min(totalPages, p + 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-3.5 py-1.5 rounded-full bg-[#00523f] text-xs font-bold text-white hover:bg-[#004232] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 shadow-xs"
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
              className="px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              अंतिम (Last) ⏭
            </button>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Add New Customer</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>
            <form onSubmit={submitAddCustomer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer / Business Name *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Ramesh Hardware or Amit Patil"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone / WhatsApp Number *
                </label>
                <input
                  type="tel"
                  required
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="e.g. 9822112233"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Shop Address / Location
                </label>
                <textarea
                  rows={2}
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="Shop number, street, town..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settle Balance Modal */}
      {settleModalCust && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Receive Payment / Udhar Settle</h3>
                <p className="text-xs text-slate-500">{settleModalCust.name}</p>
              </div>
              <button
                onClick={() => setSettleModalCust(null)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs flex items-center justify-between">
              <span className="text-amber-800 font-medium">Current Balance Due:</span>
              <span className="font-bold text-amber-900 text-sm">
                ₹{settleModalCust.balanceDue.toLocaleString()}
              </span>
            </div>

            <form onSubmit={submitSettlePayment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Amount Received (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  placeholder={settleModalCust.balanceDue.toString()}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSettleMode('Cash')}
                    className={`py-2 text-xs font-semibold rounded-lg border ${
                      settleMode === 'Cash'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Cash
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettleMode('Online')}
                    className={`py-2 text-xs font-semibold rounded-lg border ${
                      settleMode === 'Online'
                        ? 'border-blue-600 bg-blue-50 text-blue-800'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Online (UPI)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Note / Reference
                </label>
                <input
                  type="text"
                  value={settleNotes}
                  onChange={(e) => setSettleNotes(e.target.value)}
                  placeholder="e.g. Cleared pending bill, GPay Txn ID"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSettleModalCust(null)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Ledger & Print Modal */}
      {selectedLedgerCust && (
        <CustomerLedgerModal
          customer={selectedLedgerCust}
          transactions={transactions}
          cardTransactions={cardTransactions}
          settings={settings}
          onClose={() => setSelectedLedgerCust(null)}
          onReceivePayment={(customerId, amount, mode, notes) => {
            onSettlePayment(customerId, amount, mode, notes);
            // Refresh customer balance locally in modal if needed
            setSelectedLedgerCust((prev) =>
              prev ? { ...prev, totalPaid: prev.totalPaid + amount, balanceDue: Math.max(0, prev.balanceDue - amount) } : null
            );
          }}
        />
      )}
      {/* Customer Deduplication & Merge Modal */}
      {showMergeModal && onMergeCustomers && (
        <MergeCustomerModal
          isOpen={true}
          customers={customers}
          initialPrimaryCustomer={mergePrimaryCust}
          initialSecondaryCustomer={mergeSecondaryCust}
          onClose={() => {
            setShowMergeModal(false);
            setMergePrimaryCust(null);
            setMergeSecondaryCust(null);
          }}
          onConfirmMerge={(pId, sId, overrides) => {
            onMergeCustomers(pId, sId, overrides);
            setMergeSuccessBanner(
              '✓ यशस्वीपणे दोन्ही खाती एकत्र (Merge) झाली! सर्व जुनी बिले, पावत्या व बाकी रक्कम एकत्र जोडली गेली आहे.'
            );
          }}
        />
      )}
    </div>
  );
};
