import React, { useState, useMemo } from 'react';
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
  BookOpen,
  Receipt,
  RotateCw,
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
  ArrowUpDown,
  Sparkles,
  LayoutGrid,
  Table as TableIcon,
  Download,
  Calculator,
  GitMerge,
} from 'lucide-react';
import { BusinessSettings, Customer, TransactionEntry, CardTransaction } from '../types';
import { CustomerLedgerModal } from './CustomerLedgerModal';
import { QuickCustomerHisabModal } from './QuickCustomerHisabModal';
import { exportCustomersToCsv } from '../utils/csvExporter';
import { detectDuplicateCustomers } from '../utils/duplicateDetector';
import { DuplicateCustomerMergeModal } from './DuplicateCustomerMergeModal';

interface CustomersViewProps {
  customers: Customer[];
  transactions?: TransactionEntry[];
  cardTransactions?: CardTransaction[];
  onAddCustomer: (customer: Omit<Customer, 'id'>) => void;
  onUpdateCustomer?: (customer: Customer) => void;
  onSettlePayment: (
    customerId: string,
    amount: number,
    mode: 'Cash' | 'Online',
    notes: string,
    customReceiptNo?: string,
    refBillNo?: string,
    customDate?: string
  ) => void;
  onRecalculateLedgers?: () => void;
  onOpenQuickPavti?: (customer?: Customer | null, billNo?: string, amount?: number) => void;
  onMergeCustomers?: (
    primaryId: string,
    duplicateId: string,
    mergedData: {
      name: string;
      phone: string;
      village?: string;
      address?: string;
    }
  ) => void;
  settings: BusinessSettings;
}

const PAGE_SIZE = 24;

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers = [],
  transactions = [],
  cardTransactions = [],
  onAddCustomer,
  onUpdateCustomer,
  onSettlePayment,
  onRecalculateLedgers,
  onOpenQuickPavti,
  onMergeCustomers,
  settings,
}) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'due' | 'high-due' | 'cleared'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'due-desc' | 'due-asc'>('due-desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAll, setShowAll] = useState(false);
  const [recalcSuccess, setRecalcSuccess] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const [showAddModal, setShowAddModal] = useState(false);
  const [settleModalCust, setSettleModalCust] = useState<Customer | null>(null);
  const [selectedLedgerCustomer, setSelectedLedgerCustomer] = useState<Customer | null>(null);
  const [quickHisabCustomer, setQuickHisabCustomer] = useState<Customer | null>(null);
  const [showQuickHisabModal, setShowQuickHisabModal] = useState(false);

  // Duplicate accounts detection state
  const [showDuplicateMergeModal, setShowDuplicateMergeModal] = useState(false);
  const [selectedDuplicatePairId, setSelectedDuplicatePairId] = useState<string | undefined>(undefined);
  const [dismissedPairIds, setDismissedPairIds] = useState<Set<string>>(new Set());

  const duplicatePairs = useMemo(() => {
    return detectDuplicateCustomers(customers || [], dismissedPairIds);
  }, [customers, dismissedPairIds]);

  // Add customer form states
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newVillage, setNewVillage] = useState('');

  // Settle form states
  const [settleAmount, setSettleAmount] = useState('');
  const [settleMode, setSettleMode] = useState<'Cash' | 'Online'>('Cash');
  const [settleNotes, setSettleNotes] = useState('');

  // Reconcile real-time customer ledger metrics to eliminate discrepancies between table & ledger
  const customerLiveMetricsMap = useMemo(() => {
    const map = new Map<string, { totalBilled: number; totalPaid: number; due: number }>();

    const txByCustId = new Map<string, TransactionEntry[]>();
    const txByName = new Map<string, TransactionEntry[]>();
    const txByPhone = new Map<string, TransactionEntry[]>();

    (transactions || []).forEach((t) => {
      if (t.customerId) {
        const arr = txByCustId.get(t.customerId) || [];
        arr.push(t);
        txByCustId.set(t.customerId, arr);
      }
      if (t.customerName) {
        const norm = t.customerName.toLowerCase().replace(/[\s\.\-_]/g, '');
        if (norm) {
          const arr = txByName.get(norm) || [];
          arr.push(t);
          txByName.set(norm, arr);
        }
      }
      if (t.customerPhone) {
        const digits = t.customerPhone.replace(/\D/g, '');
        if (digits.length >= 6) {
          const arr = txByPhone.get(digits) || [];
          arr.push(t);
          txByPhone.set(digits, arr);
        }
      }
    });

    (customers || []).forEach((c) => {
      const custId = c.id;
      const nameNorm = (c.name || '').toLowerCase().replace(/[\s\.\-_]/g, '');
      const phoneDigits = (c.phone || '').replace(/\D/g, '');

      const txSet = new Set<TransactionEntry>();
      if (custId && txByCustId.has(custId)) {
        txByCustId.get(custId)!.forEach((t) => txSet.add(t));
      }
      if (nameNorm && txByName.has(nameNorm)) {
        txByName.get(nameNorm)!.forEach((t) => txSet.add(t));
      }
      if (phoneDigits.length >= 6 && txByPhone.has(phoneDigits)) {
        txByPhone.get(phoneDigits)!.forEach((t) => txSet.add(t));
      }

      const txList = Array.from(txSet);
      const hasBills = txList.some((t) => t.entryType !== 'Receipt' && (t.totalAmount || 0) > 0);

      const initialOpening = c.openingBalance !== undefined
        ? (c.openingBalance || 0)
        : (hasBills ? 0 : (c.balanceDue || 0));

      let billed = initialOpening;
      let paid = 0;

      txList.forEach((t) => {
        if (t.entryType === 'Receipt') {
          paid += (t.payingNow || t.totalAmount || 0);
        } else {
          billed += (t.totalAmount || 0);
          paid += (t.payingNow || 0);
        }
      });

      if (txList.length === 0 && initialOpening === 0) {
        billed = Number(c.totalPurchased) || 0;
        paid = Number(c.totalPaid) || 0;
      }

      const due = Math.max(0, billed - paid);

      map.set(c.id, {
        totalBilled: billed,
        totalPaid: paid,
        due,
      });
    });

    return map;
  }, [customers, transactions]);

  // Defensive calculations for overall totals
  const { totalCustomers, totalUdhar, customersWithDueCount } = useMemo(() => {
    let sumUdhar = 0;
    let dueCount = 0;
    (customers || []).forEach((c) => {
      if (!c) return;
      const metrics = customerLiveMetricsMap.get(c.id);
      const due = metrics ? metrics.due : (Number(c.balanceDue) || 0);
      if (due > 0) {
        sumUdhar += due;
        dueCount++;
      }
    });
    return {
      totalCustomers: (customers || []).length,
      totalUdhar: sumUdhar,
      customersWithDueCount: dueCount,
    };
  }, [customers, customerLiveMetricsMap]);

  // Robust, crash-proof filtering & sorting
  const filtered = useMemo(() => {
    const q = (search || '').toLowerCase().trim();

    return (customers || [])
      .filter((c) => {
        if (!c) return false;

        const nameStr = String(c.name || '').toLowerCase();
        const phoneStr = String(c.phone || '');
        const addrStr = String(c.address || '').toLowerCase();
        const villStr = String(c.village || '').toLowerCase();

        const matchesSearch =
          !q ||
          nameStr.includes(q) ||
          phoneStr.includes(q) ||
          addrStr.includes(q) ||
          villStr.includes(q);

        if (!matchesSearch) return false;

        const metrics = customerLiveMetricsMap.get(c.id);
        const due = metrics ? metrics.due : (Number(c.balanceDue) || 0);
        if (filterType === 'due') return due > 0;
        if (filterType === 'high-due') return due >= 5000;
        if (filterType === 'cleared') return due <= 0;
        return true;
      })
      .sort((a, b) => {
        const metricsA = customerLiveMetricsMap.get(a?.id || '');
        const metricsB = customerLiveMetricsMap.get(b?.id || '');
        const dueA = metricsA ? metricsA.due : (Number(a?.balanceDue) || 0);
        const dueB = metricsB ? metricsB.due : (Number(b?.balanceDue) || 0);

        if (sortBy === 'due-desc') return dueB - dueA;
        if (sortBy === 'due-asc') return dueA - dueB;
        return String(a?.name || '').localeCompare(String(b?.name || ''));
      });
  }, [customers, search, filterType, sortBy, customerLiveMetricsMap]);

  // Pagination chunking to eliminate mobile/laptop freezing
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const displayedCustomers = useMemo(() => {
    if (showAll) return filtered;
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage, showAll]);

  const handleSendReminder = (c: Customer) => {
    if (!c) return;
    const due = Number(c.balanceDue) || 0;
    const text = encodeURIComponent(
      `Namaste ${c.name || 'Customer'},\nThis is a gentle reminder from *${settings.businessName || 'Shri Sai Enterprises'}* regarding your outstanding balance of *₹${due.toLocaleString()}*.\nKindly clear the payment at your earliest convenience via Cash or UPI.\nContact: ${settings.phone || '8766486915'}\nWebsite: ${settings.domainName || 'shrisaient.in'}`
    );
    const phone = String(c.phone || '').replace(/[^0-9]/g, '');
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
      village: newVillage.trim() || undefined,
      totalPurchased: 0,
      totalPaid: 0,
      balanceDue: 0,
      lastVisit: new Date().toISOString().split('T')[0],
    });

    setNewName('');
    setNewPhone('');
    setNewAddress('');
    setNewVillage('');
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
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-5 space-y-5">
      {/* Header with English Primary & Small Marathi Subtext */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-[var(--tactile-text-heading)] tracking-tight">
              Customer Directory & Khata
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-md bg-[var(--tactile-surface-inset)] border border-[var(--tactile-border)] text-[var(--tactile-text-muted)] font-medium">
              ग्राहक खातेवही
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[var(--tactile-text-muted)] mt-0.5">
            Manage customer accounts, outstanding balances (Udhar), and instant ledger statements.
            <span className="ml-1 text-[11px] text-[var(--tactile-text-dim)]">(उधारी बाकी हिशोब व व्हॉट्सॲप स्मरणपत्र)</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Hisab & Print Calculator Button */}
          <button
            onClick={() => {
              setQuickHisabCustomer(null);
              setShowQuickHisabModal(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs font-bold hover:bg-amber-500/25 transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="मोबाईल हिशोब कॅल्क्युलेटर (उदा. दिवाण 7000, 3000 दिले, 1500 पावती)"
          >
            <Calculator className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <div className="flex flex-col text-left leading-tight">
              <span>Quick Hisab & Print</span>
              <span className="text-[9px] text-amber-700 dark:text-amber-300 font-normal">हिशोब कॅल्क्युलेटर</span>
            </div>
          </button>

          {/* Duplicate Khata Merge Button */}
          <button
            onClick={() => {
              if (duplicatePairs.length > 0) {
                setSelectedDuplicatePairId(duplicatePairs[0].id);
              }
              setShowDuplicateMergeModal(true);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer ${
              duplicatePairs.length > 0
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 border border-amber-400 animate-pulse'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
            title="दोन सारखी ग्राहक खाती शोधून त्यांचा हिशोब एकत्र करा"
          >
            <GitMerge className="w-4 h-4" />
            <div className="flex flex-col text-left leading-tight">
              <span className="flex items-center gap-1">
                Merge Khata
                {duplicatePairs.length > 0 && (
                  <span className="bg-slate-950 text-white text-[9px] px-1.5 py-0.2 rounded-full font-mono">
                    {duplicatePairs.length}
                  </span>
                )}
              </span>
              <span className="text-[9px] opacity-80 font-normal">खाती विलीनीकरण</span>
            </div>
          </button>

          {/* Download CSV button */}
          <button
            onClick={() => exportCustomersToCsv(filtered, 'ShriSai_Customers_Khata')}
            className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="Download Customers Khata CSV"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <div className="flex flex-col text-left leading-tight">
              <span>Download CSV</span>
              <span className="text-[9px] text-emerald-700/80 font-normal">ग्राहक खाती एक्सपोर्ट</span>
            </div>
          </button>

          {onRecalculateLedgers && (
            <button
              onClick={() => {
                onRecalculateLedgers();
                setRecalcSuccess(true);
                setTimeout(() => setRecalcSuccess(false), 3500);
              }}
              title="Recalculate customer balances against all sales bills & receipts"
              className="px-3 py-2 rounded-xl tactile-btn-secondary text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5 text-blue-600" />
              <div className="flex flex-col text-left leading-tight">
                <span>Recheck Balances</span>
                <span className="text-[9px] text-[var(--tactile-text-dim)]">खातेवही ताडून पहा</span>
              </div>
            </button>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl tactile-btn-primary text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4" />
            <div className="flex flex-col text-left leading-tight">
              <span>+ Add Customer</span>
              <span className="text-[9px] text-white/80 font-normal">नवीन ग्राहक नोंदवा</span>
            </div>
          </button>
        </div>
      </div>

      {recalcSuccess && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>✓ सर्व ग्राहकांचे जुने बिल आणि जमा पावत्या ताडून हिशोब बरोबर केला गेला आहे!</span>
        </div>
      )}

      {/* KPI Overview Cards with High Contrast & Clear Marathi hints */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="tactile-card p-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs text-[var(--tactile-text-muted)] font-bold">Total Customers</p>
              <span className="text-[10px] text-[var(--tactile-text-dim)]">एकूण ग्राहक</span>
            </div>
            <p className="text-2xl font-black text-[var(--tactile-text-heading)] mt-1 font-mono-num">
              {totalCustomers}
            </p>
            <p className="text-[11px] text-[var(--tactile-text-muted)] mt-0.5">
              {customersWithDueCount} with pending dues
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-600">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="tactile-card p-4 border-amber-500/40 bg-amber-500/5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs text-amber-800 dark:text-amber-300 font-bold">Total Market Udhar</p>
              <span className="text-[10px] text-amber-700/80 dark:text-amber-400">एकूण बाजार उधारी बाकी</span>
            </div>
            <p className="text-2xl font-black text-amber-700 dark:text-amber-400 mt-1 font-mono-num">
              ₹{totalUdhar.toLocaleString()}
            </p>
            <p className="text-[11px] text-amber-700/80 dark:text-amber-400 mt-0.5">
              Across {customersWithDueCount} balance accounts
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-700 dark:text-amber-400">
            <IndianRupee className="w-5 h-5" />
          </div>
        </div>

        <div className="tactile-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <p className="text-xs text-[var(--tactile-text-muted)] font-bold">Fast Filter</p>
              <span className="text-[10px] text-[var(--tactile-text-dim)]">जलद फिल्टर</span>
            </div>
            <span className="text-xs font-mono font-bold text-[var(--tactile-primary)]">
              {filtered.length} Results
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 mt-2">
            <button
              onClick={() => {
                setFilterType(filterType === 'due' ? 'all' : 'due');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer text-center ${
                filterType === 'due'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-[var(--tactile-surface-inset)] text-[var(--tactile-text-muted)] hover:text-[var(--tactile-text-main)]'
              }`}
            >
              <span>Dues Only (बाकी)</span>
            </button>
            <button
              onClick={() => {
                setFilterType(filterType === 'cleared' ? 'all' : 'cleared');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer text-center ${
                filterType === 'cleared'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-[var(--tactile-surface-inset)] text-[var(--tactile-text-muted)] hover:text-[var(--tactile-text-main)]'
              }`}
            >
              <span>Cleared (शून्य बाकी)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Potential Duplicate Accounts Detected Banner (संभाव्य डुप्लिकेट खाती आढळली) */}
      {duplicatePairs.length > 0 && (
        <div className="rounded-2xl p-4 sm:p-5 bg-amber-500/10 border-2 border-amber-500/40 text-slate-900 dark:text-white shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0 mt-0.5">
              <GitMerge className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm sm:text-base text-amber-950 dark:text-amber-200">
                  संभाव्य डुप्लिकेट खाती आढळली ({duplicatePairs.length})
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-100 border border-amber-300 dark:border-amber-700">
                  अकाउंटिंग दुरुस्ती
                </span>
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">
                {duplicatePairs[0].custA.name} ({duplicatePairs[0].custA.phone || duplicatePairs[0].custA.village || 'खाते १'}) आणि {duplicatePairs[0].custB.name} ({duplicatePairs[0].custB.phone || duplicatePairs[0].custB.village || 'खाते २'}) हे एकाच व्यक्तीचे २ खाते असू शकतात.
              </p>
              <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5 font-medium">
                कारण: {duplicatePairs[0].reason}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
            <button
              onClick={() => {
                setSelectedDuplicatePairId(duplicatePairs[0].id);
                setShowDuplicateMergeModal(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs transition flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <GitMerge className="w-4 h-4" />
              <span>हिशोब तपासा व एकत्र करा (Review Hisab & Merge)</span>
            </button>
            <button
              onClick={() => {
                setDismissedPairIds((prev) => new Set(prev).add(duplicatePairs[0].id));
              }}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg text-xs font-bold cursor-pointer"
              title="ही २ वेगळी खाती ठेवा (Dismiss)"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* SEARCH BAR - 100% VISIBLE TEXT WITH HIGH CONTRAST & CLEAR BUTTON */}
      <div className="tactile-card p-3 sm:p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Main Search Input - High Contrast & Mobile Proof (text-base on mobile <640px) */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by customer name, phone number, village or address..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold text-base sm:text-sm placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#0D5C4D] shadow-xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setCurrentPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                title="Clear Search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort Selector & View Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--tactile-surface-inset)] border border-[var(--tactile-border)] text-sm sm:text-xs text-[var(--tactile-text-main)] flex-1 sm:flex-none">
              <ArrowUpDown className="w-3.5 h-3.5 text-[var(--tactile-text-muted)] shrink-0" />
              <span className="text-xs sm:text-[11px] font-medium text-[var(--tactile-text-muted)] hidden sm:inline">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-sm sm:text-xs font-bold text-[var(--tactile-text-main)] focus:outline-none cursor-pointer w-full"
              >
                <option value="due-desc">Highest Udhar First (जास्त उधारी)</option>
                <option value="due-asc">Lowest Udhar First (कमी उधारी)</option>
                <option value="name">Customer Name A-Z (नावाप्रमाणे)</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-[var(--tactile-surface-inset)] border border-[var(--tactile-border)] rounded-xl p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-white dark:bg-slate-800 text-[var(--tactile-text-main)] shadow-2xs'
                    : 'text-[var(--tactile-text-muted)] hover:text-[var(--tactile-text-main)]'
                }`}
                title="कार्ड व्ह्यू"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-800 text-[var(--tactile-text-main)] shadow-2xs'
                    : 'text-[var(--tactile-text-muted)] hover:text-[var(--tactile-text-main)]'
                }`}
                title="टेबल व्ह्यू"
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Table</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Filter Chips */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs sm:text-[11px] font-bold text-[var(--tactile-text-muted)] mr-1">Quick:</span>
            {[
              { id: 'all', label: 'All Clients', mr: 'सर्व' },
              { id: 'due', label: 'With Balance Due', mr: 'उधारी बाकी' },
              { id: 'high-due', label: 'High Dues (₹5,000+)', mr: 'मोठी उधारी' },
              { id: 'cleared', label: 'Zero Balance', mr: 'पूर्ण जमा' },
            ].map((chip) => (
              <button
                key={chip.id}
                onClick={() => {
                  setFilterType(chip.id as any);
                  setCurrentPage(1);
                }}
                className={`px-3 sm:px-2.5 py-1.5 sm:py-1 rounded-lg text-sm sm:text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                  filterType === chip.id
                    ? 'tactile-btn-primary text-white font-bold'
                    : 'bg-[var(--tactile-surface-inset)] text-[var(--tactile-text-muted)] hover:text-[var(--tactile-text-main)]'
                }`}
              >
                <span>{chip.label}</span>
                <span className="text-xs sm:text-[9px] opacity-75 font-normal">({chip.mr})</span>
              </button>
            ))}
          </div>

          <div className="text-xs sm:text-[11px] text-[var(--tactile-text-dim)] font-mono">
            Showing {displayedCustomers.length} of {filtered.length} customers
          </div>
        </div>
      </div>

      {/* Customer List: Cards or Table */}
      {displayedCustomers.length === 0 ? (
        <div className="tactile-card p-12 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-[var(--tactile-surface-inset)] flex items-center justify-center text-[var(--tactile-text-muted)]">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[var(--tactile-text-heading)]">
            No Customers Found
          </h3>
          <p className="text-sm sm:text-xs text-[var(--tactile-text-muted)] max-w-sm mx-auto">
            {search
              ? `No customer matching "${search}". Check spelling or clear search.`
              : 'No customers recorded yet in this category.'}
          </p>
          {search && (
            <button
              onClick={() => {
                setSearch('');
                setFilterType('all');
              }}
              className="px-4 py-2.5 rounded-xl tactile-btn-secondary text-sm sm:text-xs font-bold cursor-pointer"
            >
              Reset Search & Filters
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* Customer List Table with Increased Base Font Size (<640px) */
        <div className="tactile-card overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm sm:text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold border-b border-[var(--tactile-border)]">
                <tr>
                  <th className="py-3.5 px-3 sm:px-4 text-sm sm:text-xs">ग्राहक (Customer Name)</th>
                  <th className="py-3.5 px-3 sm:px-4 text-sm sm:text-xs whitespace-nowrap">मोबाईल / गाव</th>
                  <th className="py-3.5 px-3 sm:px-4 text-sm sm:text-xs text-right whitespace-nowrap">एकूण खरेदी (Total)</th>
                  <th className="py-3.5 px-3 sm:px-4 text-sm sm:text-xs text-right whitespace-nowrap">जमा (Paid)</th>
                  <th className="py-3.5 px-3 sm:px-4 text-sm sm:text-xs text-right whitespace-nowrap">उधारी बाकी (Due)</th>
                  <th className="py-3.5 px-3 sm:px-4 text-sm sm:text-xs text-center whitespace-nowrap">कृती (Actions)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--tactile-border-subtle)]">
                {displayedCustomers.map((c) => {
                  const metrics = customerLiveMetricsMap.get(c.id);
                  const due = metrics ? metrics.due : (Number(c?.balanceDue) || 0);
                  const totalPurchased = metrics ? metrics.totalBilled : (Number(c?.totalPurchased) || 0);
                  const totalPaid = metrics ? metrics.totalPaid : (Number(c?.totalPaid) || 0);

                  return (
                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                      <td className="py-3.5 px-3 sm:px-4">
                        <div className="font-bold text-base sm:text-sm text-[var(--tactile-text-heading)]">
                          {c.name || 'Unnamed Customer'}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 sm:px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-sm sm:text-xs font-mono text-[var(--tactile-text-main)]">
                          <Phone className="w-3.5 h-3.5 text-[var(--tactile-text-dim)] shrink-0" />
                          <span>{c.phone || '-'}</span>
                        </div>
                        {(c.address || c.village) && (
                          <div className="flex items-center gap-1 text-xs sm:text-[11px] text-[var(--tactile-text-dim)] mt-0.5">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span className="truncate max-w-[140px]">
                              {[c.address, c.village].filter(Boolean).join(', ')}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-3 sm:px-4 text-right whitespace-nowrap">
                        <span className="font-bold text-base sm:text-xs text-[var(--tactile-text-heading)] font-mono-num">
                          ₹{totalPurchased.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 sm:px-4 text-right whitespace-nowrap">
                        <span className="font-bold text-base sm:text-xs text-emerald-600 dark:text-emerald-400 font-mono-num">
                          ₹{totalPaid.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 sm:px-4 text-right whitespace-nowrap">
                        {due > 0 ? (
                          <span className="font-black text-base sm:text-sm text-amber-700 dark:text-amber-400 font-mono-num bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                            ₹{due.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                            Cleared • जमा
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 sm:px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedLedgerCustomer(c)}
                            className="py-1.5 px-2.5 rounded-lg tactile-btn-primary text-sm sm:text-xs font-bold transition cursor-pointer flex items-center gap-1"
                            title="खातेवही उघडा"
                          >
                            <BookOpen className="w-3.5 h-3.5 text-amber-300" />
                            <span>Statement</span>
                          </button>
                          <button
                            onClick={() => (onOpenQuickPavti ? onOpenQuickPavti(c) : setSettleModalCust(c))}
                            className="py-1.5 px-2.5 rounded-lg bg-[var(--tactile-surface-inset)] hover:bg-[var(--tactile-surface)] text-[var(--tactile-text-main)] border border-[var(--tactile-border)] text-sm sm:text-xs font-bold transition cursor-pointer flex items-center gap-1"
                            title="रक्कम जमा करा / पावती फाडा"
                          >
                            <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                            <span>+ Pay</span>
                          </button>
                          <button
                            title="हिशोब कॅल्क्युलेटर (उदा. बिल, अ‍ॅडव्हान्स, पावती)"
                            onClick={() => {
                              setQuickHisabCustomer(c);
                              setShowQuickHisabModal(true);
                            }}
                            className="p-1.5 rounded-lg bg-amber-500/15 text-amber-800 dark:text-amber-200 hover:bg-amber-500/25 border border-amber-500/30 transition cursor-pointer"
                          >
                            <Calculator className="w-3.5 h-3.5" />
                          </button>
                          <button
                            title="हे खाते दुसऱ्या खात्यात विलीन करा (Merge with another account)"
                            onClick={() => {
                              const matchingPair = duplicatePairs.find((p) => p.custA.id === c.id || p.custB.id === c.id);
                              if (matchingPair) {
                                setSelectedDuplicatePairId(matchingPair.id);
                              } else {
                                setSelectedDuplicatePairId(undefined);
                              }
                              setShowDuplicateMergeModal(true);
                            }}
                            className="p-1.5 rounded-lg bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/25 border border-indigo-500/30 transition cursor-pointer"
                          >
                            <GitMerge className="w-3.5 h-3.5" />
                          </button>
                          {due > 0 && (
                            <button
                              title="Send WhatsApp Due Reminder"
                              onClick={() => handleSendReminder(c)}
                              className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30 transition cursor-pointer"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Customer Cards Grid with Increased Base Font Size (<640px) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {displayedCustomers.map((c) => {
            const metrics = customerLiveMetricsMap.get(c.id);
            const due = metrics ? metrics.due : (Number(c?.balanceDue) || 0);
            const totalPurchased = metrics ? metrics.totalBilled : (Number(c?.totalPurchased) || 0);
            const totalPaid = metrics ? metrics.totalPaid : (Number(c?.totalPaid) || 0);

            return (
              <div
                key={c.id}
                className="tactile-card p-4 flex flex-col justify-between space-y-3 tactile-card-hover"
              >
                <div>
                  {/* Customer Name & Status Badge - text-base on mobile (<640px) */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base sm:text-sm font-extrabold text-[var(--tactile-text-heading)] truncate">
                        {c.name || 'Unnamed Customer'}
                      </h3>
                      <div className="flex items-center gap-1.5 text-sm sm:text-xs text-[var(--tactile-text-muted)] mt-1">
                        <Phone className="w-3.5 h-3.5 text-[var(--tactile-text-dim)] shrink-0" />
                        <span className="font-mono">{c.phone || 'No Phone'}</span>
                      </div>
                    </div>

                    {due > 0 ? (
                      <span className="px-2.5 py-1 sm:py-0.5 rounded-full text-sm sm:text-xs font-black bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 shrink-0 font-mono-num">
                        Due: ₹{due.toLocaleString()}
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 sm:py-0.5 rounded-full text-xs sm:text-[11px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shrink-0">
                        Cleared • जमा
                      </span>
                    )}
                  </div>

                  {(c.address || c.village) && (
                    <div className="flex items-center gap-1.5 text-sm sm:text-xs text-[var(--tactile-text-dim)] mt-2">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">
                        {[c.address, c.village].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}

                  {/* Financial Metrics with English Primary & Marathi hint */}
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-[var(--tactile-border-subtle)] text-sm sm:text-xs">
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs sm:text-[10px] text-[var(--tactile-text-muted)] font-bold">Total Billed</span>
                        <span className="text-[11px] sm:text-[9px] text-[var(--tactile-text-dim)]">एकूण खरेदी</span>
                      </div>
                      <span className="font-bold text-base sm:text-xs text-[var(--tactile-text-heading)] font-mono-num">
                        ₹{totalPurchased.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs sm:text-[10px] text-[var(--tactile-text-muted)] font-bold">Total Paid</span>
                        <span className="text-[11px] sm:text-[9px] text-emerald-600 font-medium">एकूण जमा</span>
                      </div>
                      <span className="font-bold text-base sm:text-xs text-emerald-600 dark:text-emerald-400 font-mono-num">
                        ₹{totalPaid.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons - Increased Font Size for Small Screens */}
                <div className="space-y-1.5 pt-2 border-t border-[var(--tactile-border-subtle)]">
                  {/* Full Ledger & Bills Statement Button */}
                  <button
                    onClick={() => setSelectedLedgerCustomer(c)}
                    className="w-full py-2.5 sm:py-2 px-3 rounded-xl tactile-btn-primary text-sm sm:text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <BookOpen className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-amber-300" />
                    <span>Statement & Bills (खातेवही)</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => (onOpenQuickPavti ? onOpenQuickPavti(c) : setSettleModalCust(c))}
                      className="flex-1 py-2 sm:py-1.5 px-3 rounded-lg bg-[var(--tactile-surface-inset)] hover:bg-[var(--tactile-surface)] text-[var(--tactile-text-main)] border border-[var(--tactile-border)] text-sm sm:text-xs font-bold transition cursor-pointer text-center flex items-center justify-center gap-1"
                    >
                      <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                      <span>+ Receive Payment</span>
                    </button>

                    <button
                      title="हिशोब कॅल्क्युलेटर व पावती प्रिंट (Quick Hisab)"
                      onClick={() => {
                        setQuickHisabCustomer(c);
                        setShowQuickHisabModal(true);
                      }}
                      className="p-2 sm:p-1.5 rounded-lg bg-amber-500/15 text-amber-800 dark:text-amber-200 hover:bg-amber-500/25 border border-amber-500/30 transition cursor-pointer"
                    >
                      <Calculator className="w-4 h-4" />
                    </button>

                    <button
                      title="हे खाते दुसऱ्या खात्यात विलीन करा (Merge Accounts)"
                      onClick={() => {
                        const matchingPair = duplicatePairs.find((p) => p.custA.id === c.id || p.custB.id === c.id);
                        if (matchingPair) {
                          setSelectedDuplicatePairId(matchingPair.id);
                        } else {
                          setSelectedDuplicatePairId(undefined);
                        }
                        setShowDuplicateMergeModal(true);
                      }}
                      className="p-2 sm:p-1.5 rounded-lg bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/25 border border-indigo-500/30 transition cursor-pointer"
                    >
                      <GitMerge className="w-4 h-4" />
                    </button>

                    {due > 0 && (
                      <button
                        title="Send WhatsApp Due Reminder (व्हॉट्सॲप स्मरणपत्र)"
                        onClick={() => handleSendReminder(c)}
                        className="p-2 sm:p-1.5 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30 transition cursor-pointer"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls - Keeps mobile & laptop super fast */}
      {filtered.length > PAGE_SIZE && (
        <div className="tactile-card p-3 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-[var(--tactile-text-muted)] font-medium">
            Page <strong className="text-[var(--tactile-text-heading)]">{currentPage}</strong> of{' '}
            <strong className="text-[var(--tactile-text-heading)]">{totalPages}</strong> (
            {filtered.length} customers)
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAll(!showAll)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold border border-[var(--tactile-border)] bg-[var(--tactile-surface-inset)] text-[var(--tactile-text-main)] hover:bg-[var(--tactile-surface)] transition cursor-pointer"
            >
              {showAll ? 'Show Pages (24 per page)' : 'View All'}
            </button>

            {!showAll && (
              <>
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1.5 rounded-lg border border-[var(--tactile-border)] bg-[var(--tactile-surface-raised)] text-[var(--tactile-text-main)] text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--tactile-surface-inset)] transition cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prev</span>
                </button>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-2.5 py-1.5 rounded-lg border border-[var(--tactile-border)] bg-[var(--tactile-surface-raised)] text-[var(--tactile-text-main)] text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--tactile-surface-inset)] transition cursor-pointer flex items-center gap-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Customer Ledger Statement Modal */}
      {selectedLedgerCustomer && (
        <CustomerLedgerModal
          customer={selectedLedgerCustomer}
          transactions={transactions}
          cardTransactions={cardTransactions}
          settings={settings}
          onClose={() => setSelectedLedgerCustomer(null)}
          onUpdateCustomer={(updated) => {
            if (onUpdateCustomer) {
              onUpdateCustomer(updated);
            }
            setSelectedLedgerCustomer(updated);
          }}
          onReceivePayment={(c, billNo, dueAmount) => {
            if (onOpenQuickPavti) {
              onOpenQuickPavti(c, billNo, dueAmount);
            } else {
              setSettleModalCust(c);
              if (dueAmount) setSettleAmount(String(dueAmount));
            }
          }}
        />
      )}

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="tactile-card-modal max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--tactile-border-subtle)] pb-3">
              <div>
                <h3 className="font-black text-[var(--tactile-text-heading)] text-base">
                  Add New Customer
                </h3>
                <p className="text-[11px] text-[var(--tactile-text-muted)]">
                  नवीन ग्राहक खाते नोंदणी
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-[var(--tactile-surface-inset)] hover:bg-[var(--tactile-surface)] flex items-center justify-center text-[var(--tactile-text-muted)] hover:text-[var(--tactile-text-main)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={submitAddCustomer} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[var(--tactile-text-main)] mb-1">
                  Customer / Business Name * <span className="text-[10px] text-[var(--tactile-text-dim)]">(ग्राहकाचे नाव)</span>
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Ramesh Sharma or Patil Electricals"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--tactile-border)] bg-[var(--tactile-surface-raised)] text-[var(--tactile-text-main)] font-semibold text-sm placeholder:text-[var(--tactile-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--tactile-border-focus)] shadow-inner"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--tactile-text-main)] mb-1">
                  Phone / WhatsApp Number * <span className="text-[10px] text-[var(--tactile-text-dim)]">(मोबाईल नंबर)</span>
                </label>
                <input
                  type="tel"
                  required
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="e.g. 9822112233"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--tactile-border)] bg-[var(--tactile-surface-raised)] text-[var(--tactile-text-main)] font-semibold text-sm placeholder:text-[var(--tactile-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--tactile-border-focus)] shadow-inner font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--tactile-text-main)] mb-1">
                  Village / City <span className="text-[10px] text-[var(--tactile-text-dim)]">(गाव / शहर)</span>
                </label>
                <input
                  type="text"
                  value={newVillage}
                  onChange={(e) => setNewVillage(e.target.value)}
                  placeholder="e.g. Wardha, Arvi, Hinganghat, Seloo"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--tactile-border)] bg-[var(--tactile-surface-raised)] text-[var(--tactile-text-main)] text-sm placeholder:text-[var(--tactile-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--tactile-border-focus)] shadow-inner"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--tactile-text-main)] mb-1">
                  Address Details <span className="text-[10px] text-[var(--tactile-text-dim)]">(पत्ता)</span>
                </label>
                <textarea
                  rows={2}
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="Shop number, landmark, area..."
                  className="w-full px-3.5 py-2 rounded-xl border border-[var(--tactile-border)] bg-[var(--tactile-surface-raised)] text-[var(--tactile-text-main)] text-sm placeholder:text-[var(--tactile-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--tactile-border-focus)] shadow-inner resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--tactile-border-subtle)]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-[var(--tactile-border)] text-xs font-semibold text-[var(--tactile-text-muted)] hover:text-[var(--tactile-text-main)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl tactile-btn-primary text-xs font-bold shadow-md cursor-pointer"
                >
                  Save Customer (जतन करा)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settle / Receive Payment Modal */}
      {settleModalCust && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="tactile-card-modal max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--tactile-border-subtle)] pb-3">
              <div>
                <h3 className="font-black text-[var(--tactile-text-heading)] text-base">
                  Receive Payment (उधारी जमा पावती)
                </h3>
                <p className="text-xs font-bold text-blue-600 dark:text-blue-400">
                  {settleModalCust.name}
                </p>
              </div>
              <button
                onClick={() => setSettleModalCust(null)}
                className="w-8 h-8 rounded-full bg-[var(--tactile-surface-inset)] hover:bg-[var(--tactile-surface)] flex items-center justify-center text-[var(--tactile-text-muted)] hover:text-[var(--tactile-text-main)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs flex items-center justify-between">
              <span className="text-amber-800 dark:text-amber-300 font-bold">Current Balance Due:</span>
              <span className="font-black text-amber-700 dark:text-amber-400 text-base font-mono-num">
                ₹{(Number(settleModalCust.balanceDue) || 0).toLocaleString()}
              </span>
            </div>

            <form onSubmit={submitSettlePayment} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[var(--tactile-text-main)] mb-1">
                  Amount Received (₹) * <span className="text-[10px] text-[var(--tactile-text-dim)]">(जमा रक्कम)</span>
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  placeholder={String(settleModalCust.balanceDue || '')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--tactile-border)] bg-[var(--tactile-surface-raised)] text-[var(--tactile-text-main)] font-black text-base placeholder:text-[var(--tactile-text-muted)] focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--tactile-text-main)] mb-1">
                  Payment Mode <span className="text-[10px] text-[var(--tactile-text-dim)]">(पेमेंट प्रकार)</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSettleMode('Cash')}
                    className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      settleMode === 'Cash'
                        ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
                        : 'border-[var(--tactile-border)] bg-[var(--tactile-surface-inset)] text-[var(--tactile-text-main)]'
                    }`}
                  >
                    Cash (रोख)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettleMode('Online')}
                    className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      settleMode === 'Online'
                        ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                        : 'border-[var(--tactile-border)] bg-[var(--tactile-surface-inset)] text-[var(--tactile-text-main)]'
                    }`}
                  >
                    Online / UPI (गुगल पे)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--tactile-text-main)] mb-1">
                  Notes / Reference <span className="text-[10px] text-[var(--tactile-text-dim)]">(नोंद / पावती संदर्भ)</span>
                </label>
                <input
                  type="text"
                  value={settleNotes}
                  onChange={(e) => setSettleNotes(e.target.value)}
                  placeholder="e.g. Cleared pending invoice, GPay Txn ID"
                  className="w-full px-3.5 py-2 rounded-xl border border-[var(--tactile-border)] bg-[var(--tactile-surface-raised)] text-[var(--tactile-text-main)] text-xs placeholder:text-[var(--tactile-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--tactile-border-focus)] shadow-inner"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--tactile-border-subtle)]">
                <button
                  type="button"
                  onClick={() => setSettleModalCust(null)}
                  className="px-4 py-2 rounded-xl border border-[var(--tactile-border)] text-xs font-semibold text-[var(--tactile-text-muted)] hover:text-[var(--tactile-text-main)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  Record Payment (पावती नोंदवा)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Customer Hisab Calculator Modal */}
      {showQuickHisabModal && (
        <QuickCustomerHisabModal
          initialCustomer={quickHisabCustomer}
          customers={customers}
          settings={settings}
          onClose={() => {
            setShowQuickHisabModal(false);
            setQuickHisabCustomer(null);
          }}
          onSaveQuickHisab={(data) => {
            if (data.customerId && data.receiptPaid > 0) {
              onSettlePayment(
                data.customerId,
                data.receiptPaid,
                'Cash',
                `${data.itemDetails} - जमा पावती हिशोब. ${data.notes || ''}`
              );
            }
          }}
        />
      )}

      {/* Duplicate Customer Accounts Merge Modal */}
      <DuplicateCustomerMergeModal
        isOpen={showDuplicateMergeModal}
        customers={customers}
        transactions={transactions}
        duplicatePairs={duplicatePairs}
        initialSelectedPairId={selectedDuplicatePairId}
        onClose={() => {
          setShowDuplicateMergeModal(false);
          setSelectedDuplicatePairId(undefined);
        }}
        onDismissPair={(pairId) => {
          setDismissedPairIds((prev) => new Set(prev).add(pairId));
        }}
        onMerge={(primaryId, duplicateId, mergedData) => {
          if (onMergeCustomers) {
            onMergeCustomers(primaryId, duplicateId, mergedData);
          }
          setShowDuplicateMergeModal(false);
          setSelectedDuplicatePairId(undefined);
        }}
      />
    </div>
  );
};
