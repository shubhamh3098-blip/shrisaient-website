import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Wrench,
  CheckCircle2,
  Calculator,
  Phone,
  MapPin,
  User,
  Search,
  Pencil,
  Zap,
  BookOpen,
  Filter,
  ArrowRight,
  Sparkles,
  Info,
  Merge,
  AlertCircle
} from 'lucide-react';
import { Customer, TransactionEntry } from '../types';
import { MergeCustomerModal } from './MergeCustomerModal';
import { detectDuplicateCustomers } from '../utils/customerDeduplication';

export interface DataIssue {
  id: string;
  type: 'math' | 'phone' | 'village' | 'name' | 'zero';
  category: 'bill' | 'customer';
  title: string;
  description: string;
  solutionTip: string;
  entityId: string;
  customerName: string;
  customerPhone: string;
  village: string;
  invoiceNo?: string;
  date?: string;
  totalAmount?: number;
  payingNow?: number;
  dueAmount?: number;
  itemDetails?: string;
  rawTransaction?: TransactionEntry;
  rawCustomer?: Customer;
}

interface DataIssuesAuditViewProps {
  transactions: TransactionEntry[];
  customers: Customer[];
  onEditTransaction: (tx: TransactionEntry) => void;
  onEditCustomer: (cust: Customer) => void;
  onFixMathTransaction: (tx: TransactionEntry) => void;
  onFixAllMath: () => void;
  onOpenLedger?: (cust: Customer) => void;
  onRecheckLedgers?: () => void;
  onMergeCustomers?: (primaryId: string, secondaryId: string, overrides?: any) => void;
  mergedRecords?: any[];
}

export const DataIssuesAuditView: React.FC<DataIssuesAuditViewProps> = ({
  transactions,
  customers,
  onEditTransaction,
  onEditCustomer,
  onFixMathTransaction,
  onFixAllMath,
  onOpenLedger,
  onRecheckLedgers,
  onMergeCustomers,
  mergedRecords,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'math' | 'phone' | 'village' | 'name'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Customer Account Merge modal states
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [mergePrimaryCust, setMergePrimaryCust] = useState<Customer | null>(null);
  const [mergeSecondaryCust, setMergeSecondaryCust] = useState<Customer | null>(null);

  // Auto-detect duplicate customer accounts (like Shesh Bhagat vs Sheshrav Bhagat)
  const duplicateCandidates = useMemo(() => detectDuplicateCustomers(customers, mergedRecords), [customers, mergedRecords]);

  // 1. Calculate all issues
  const allIssues = useMemo<DataIssue[]>(() => {
    const list: DataIssue[] = [];

    // Check transactions
    transactions.forEach((t) => {
      const total = Number(t.totalAmount) || 0;
      const paid = Number(t.payingNow) || 0;
      const due = Number(t.dueAmount) || 0;
      const cleanPhone = (t.customerPhone || '').replace(/\D/g, '');
      const hasValidPhone = cleanPhone.length >= 10 && cleanPhone !== '0' && !/^(\d)\1{9,}$/.test(cleanPhone);
      const hasVillage = Boolean(t.village && t.village.trim() && t.village.trim() !== '-');
      const isGenericName =
        !t.customerName ||
        t.customerName.trim() === '' ||
        t.customerName.startsWith('ग्राहक #') ||
        t.customerName.startsWith('ग्राहक (बिल #') ||
        t.customerName === '0';
      const isZeroBill = total === 0 && paid === 0 && due === 0;

      // Check Math: Total != Paid + Due
      const mathDiff = total - (paid + due);
      if (Math.abs(mathDiff) > 1 && !isZeroBill) {
        list.push({
          id: `issue-math-${t.id}`,
          type: 'math',
          category: 'bill',
          title: `हिशोब बेरीज तफावत: ₹${Math.abs(mathDiff).toLocaleString()} चा फरक`,
          description: `एकूण बिल ₹${total.toLocaleString()} ≠ रोख जमा ₹${paid.toLocaleString()} + उधारी बाकी ₹${due.toLocaleString()}`,
          solutionTip: `उधारी बाकी ₹${Math.max(0, total - paid).toLocaleString()} असायला हवी.`,
          entityId: t.id,
          customerName: t.customerName || 'अज्ञात ग्राहक',
          customerPhone: t.customerPhone || '',
          village: t.village || '',
          invoiceNo: t.invoiceNo,
          date: t.date,
          totalAmount: total,
          payingNow: paid,
          dueAmount: due,
          itemDetails: t.itemDetails,
          rawTransaction: t,
        });
      }

      // Check Phone on transaction
      if (!hasValidPhone && !isZeroBill) {
        list.push({
          id: `issue-phone-tx-${t.id}`,
          type: 'phone',
          category: 'bill',
          title: 'मोबाईल नंबर उपलब्ध नाही किंवा 0 आहे',
          description: t.customerPhone
            ? `नोंदवलेला नंबर "${t.customerPhone}" वैध नाही`
            : 'मोबाईल नंबर रिकामा किंवा "0" आहे',
          solutionTip: 'ग्राहकाचा खरा 10 अंकी नंबर टाका म्हणजे खाती वेगळी राहतील.',
          entityId: t.id,
          customerName: t.customerName || 'अज्ञात ग्राहक',
          customerPhone: t.customerPhone || '',
          village: t.village || '',
          invoiceNo: t.invoiceNo,
          date: t.date,
          totalAmount: total,
          payingNow: paid,
          dueAmount: due,
          itemDetails: t.itemDetails,
          rawTransaction: t,
        });
      }

      // Check Village
      if (!hasVillage && !isZeroBill) {
        list.push({
          id: `issue-vil-tx-${t.id}`,
          type: 'village',
          category: 'bill',
          title: 'गाव किंवा परिसर माहिती नाही',
          description: 'या बिलामध्ये ग्राहकाचे गाव किंवा पत्ता नोंदवलेला नाही',
          solutionTip: 'गाव किंवा परिसर प्रविष्ट करा जेणेकरून वसुली सोपी होईल.',
          entityId: t.id,
          customerName: t.customerName || 'अज्ञात ग्राहक',
          customerPhone: t.customerPhone || '',
          village: '',
          invoiceNo: t.invoiceNo,
          date: t.date,
          totalAmount: total,
          payingNow: paid,
          dueAmount: due,
          itemDetails: t.itemDetails,
          rawTransaction: t,
        });
      }

      // Check Name
      if (isGenericName && !isZeroBill) {
        list.push({
          id: `issue-name-tx-${t.id}`,
          type: 'name',
          category: 'bill',
          title: 'ग्राहकाचे नाव उपलब्ध नाही',
          description: `सिस्टीमने दिलेले जेनेरिक नाव "${t.customerName || 'रिकामा'}" आहे.`,
          solutionTip: 'ग्राहकाचे खरे नाव टाकून बिल अचूक करा.',
          entityId: t.id,
          customerName: t.customerName || '',
          customerPhone: t.customerPhone || '',
          village: t.village || '',
          invoiceNo: t.invoiceNo,
          date: t.date,
          totalAmount: total,
          payingNow: paid,
          dueAmount: due,
          itemDetails: t.itemDetails,
          rawTransaction: t,
        });
      }
    });

    // Check customers
    customers.forEach((c) => {
      const cleanPhone = (c.phone || '').replace(/\D/g, '');
      const hasValidPhone = cleanPhone.length >= 10 && cleanPhone !== '0' && !/^(\d)\1{9,}$/.test(cleanPhone);
      const hasVillage = Boolean(c.village && c.village.trim() && c.village.trim() !== '-');
      const isGenericName =
        !c.name ||
        c.name.trim() === '' ||
        c.name.startsWith('ग्राहक #') ||
        c.name.startsWith('ग्राहक (बिल #') ||
        c.name === '0';

      if (!hasValidPhone) {
        list.push({
          id: `issue-phone-cust-${c.id}`,
          type: 'phone',
          category: 'customer',
          title: 'खातेवहीत मोबाईल नंबर नाही',
          description: 'या ग्राहकाच्या खात्यामध्ये 10 अंकी मोबाईल क्रमांक नोंदवलेला नाही.',
          solutionTip: 'मोबाईल नंबर अपडेट केल्यास SMS व व्हॉट्सॲप मेसेज पाठवता येतील.',
          entityId: c.id,
          customerName: c.name,
          customerPhone: c.phone || '',
          village: c.village || '',
          dueAmount: c.balanceDue,
          rawCustomer: c,
        });
      }

      if (!hasVillage && !c.address) {
        list.push({
          id: `issue-vil-cust-${c.id}`,
          type: 'village',
          category: 'customer',
          title: 'ग्राहकाचे गाव किंवा पत्ता नाही',
          description: 'खातेवहीत या ग्राहकाचे गाव किंवा पत्ता उपलब्ध नाही.',
          solutionTip: 'पत्ता किंवा खूण प्रविष्ट करा.',
          entityId: c.id,
          customerName: c.name,
          customerPhone: c.phone || '',
          village: '',
          dueAmount: c.balanceDue,
          rawCustomer: c,
        });
      }

      if (isGenericName) {
        list.push({
          id: `issue-name-cust-${c.id}`,
          type: 'name',
          category: 'customer',
          title: 'ग्राहकाचे मूळ नाव हवे आहे',
          description: `खात्याचे नाव जेनेरिक आहे: "${c.name}"`,
          solutionTip: 'ग्राहकाचे मूळ नाव संपादित करा.',
          entityId: c.id,
          customerName: c.name,
          customerPhone: c.phone || '',
          village: c.village || '',
          dueAmount: c.balanceDue,
          rawCustomer: c,
        });
      }
    });

    return list;
  }, [transactions, customers]);

  // Counts by type
  const counts = useMemo(() => {
    return {
      all: allIssues.length,
      math: allIssues.filter((i) => i.type === 'math').length,
      phone: allIssues.filter((i) => i.type === 'phone').length,
      village: allIssues.filter((i) => i.type === 'village').length,
      name: allIssues.filter((i) => i.type === 'name').length,
    };
  }, [allIssues]);

  // Filtered issues list
  const filteredIssues = useMemo(() => {
    return allIssues.filter((item) => {
      if (activeFilter !== 'all' && item.type !== activeFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        item.customerName.toLowerCase().includes(q) ||
        (item.customerPhone && item.customerPhone.includes(q)) ||
        (item.village && item.village.toLowerCase().includes(q)) ||
        (item.invoiceNo && item.invoiceNo.toLowerCase().includes(q)) ||
        item.title.toLowerCase().includes(q)
      );
    });
  }, [allIssues, activeFilter, searchQuery]);

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Top Banner with Quick Actions */}
      <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-amber-500/5 dark:from-amber-950/40 dark:via-rose-950/30 dark:to-slate-900 border border-amber-300 dark:border-amber-800/60 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-900 dark:text-amber-300 text-xs font-bold">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>डेटा ऑडिट व दुरुस्ती केंद्र (Data Quality & Audit Hub)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              चूका असलेला डेटा दुरुस्त करा
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              येथे हिशोब बेरीज चुकीची बिले, मोबाईल नंबर नसलेली खाती आणि अपूर्ण पत्ते सहजपणे ओळखून थेट दुरुस्त करा.
            </p>
          </div>

          {/* Quick Auto Fix Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {counts.math > 0 && (
              <button
                type="button"
                onClick={onFixAllMath}
                className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-600/25 transition cursor-pointer active:scale-95"
                title="सर्व बिलांची उधारी बाकी = एकूण बिल - भरणा आपोआप जुळवा"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>⚡ सर्व हिशोब बेरीज आपोआप जुळवा ({counts.math})</span>
              </button>
            )}

            {onRecheckLedgers && (
              <button
                type="button"
                onClick={() => {
                  onRecheckLedgers();
                  alert('मोबाईल "0" असलेली खाती नावांनुसार वेगळी करण्यात आली आहेत!');
                }}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold text-xs flex items-center gap-2 transition cursor-pointer active:scale-95"
              >
                <User className="w-4 h-4 text-amber-400" />
                <span>मोबाईल '0' खाती वेगळी करा</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mt-5">
          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">एकूण चुका (Issues)</span>
            <span className="text-lg sm:text-xl font-black text-rose-600 dark:text-rose-400 font-mono mt-0.5 block">
              {counts.all.toLocaleString()}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">🧮 हिशोब बेरीज चूक</span>
            <span className="text-lg sm:text-xl font-black text-amber-600 dark:text-amber-400 font-mono mt-0.5 block">
              {counts.math.toLocaleString()}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">📱 मोबाईल नाही किंवा 0</span>
            <span className="text-lg sm:text-xl font-black text-blue-600 dark:text-blue-400 font-mono mt-0.5 block">
              {counts.phone.toLocaleString()}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">📍 गाव किंवा पत्ता नाही</span>
            <span className="text-lg sm:text-xl font-black text-slate-700 dark:text-slate-300 font-mono mt-0.5 block">
              {counts.village.toLocaleString()}
            </span>
          </div>
        </div>

        {/* DUPLICATE CUSTOMER ACCOUNTS ALERT BANNER (TOP PRIORITY) */}
        {duplicateCandidates.length > 0 && (
          <div className="mt-5 p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border-2 border-amber-400 dark:border-amber-700 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-500 text-white shadow-xs shrink-0 mt-0.5">
                  <Merge className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black text-amber-950 dark:text-amber-100">
                      एकाच व्यक्तीची २ खाती आढळली (Duplicate Accounts - Accounting Error)
                    </h4>
                    <span className="text-[11px] font-bold px-2 py-0.5 bg-amber-200 dark:bg-amber-850 text-amber-900 dark:text-amber-200 rounded-full">
                      तातडीने विलीन करा
                    </span>
                  </div>
                  <p className="text-xs text-amber-900 dark:text-amber-200 mt-1">
                    खालील व्यक्तीचे नाव किंवा तपशील एकाच व्यक्तीचा असून दोन वेगळी खाती तयार झाली आहेत. दोन्ही खाती एकत्र (Merge) केल्यास सर्व बिले, पावत्या व बाकी अचूक होईल.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              {duplicateCandidates.map((cand, idx) => {
                const pur1 = Math.max(cand.primary.totalPurchased || 0, (cand.primary.totalPaid || 0) + (cand.primary.balanceDue || 0));
                const pur2 = Math.max(cand.secondary.totalPurchased || 0, (cand.secondary.totalPaid || 0) + (cand.secondary.balanceDue || 0));
                const combPur = pur1 + pur2;
                const combPaid = (cand.primary.totalPaid || 0) + (cand.secondary.totalPaid || 0);
                const combDue = Math.max(0, combPur - combPaid);

                return (
                  <div
                    key={`dup-cand-${idx}`}
                    className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-black text-slate-900 dark:text-white">
                          खाते १: {cand.primary.name}
                        </span>
                        <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-mono">
                          {cand.primary.phone || 'मोबाईल नाही'}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          (बाकी: ₹{(cand.primary.balanceDue || 0).toLocaleString()})
                        </span>
                        <span className="text-xs text-amber-600 font-bold">आणि</span>
                        <span className="text-xs font-black text-slate-900 dark:text-white">
                          खाते २: {cand.secondary.name}
                        </span>
                        <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {cand.secondary.village || cand.secondary.address || 'पत्ता नाही'}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          (बाकी: ₹{(cand.secondary.balanceDue || 0).toLocaleString()})
                        </span>
                      </div>
                      <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-2">
                        <span>एकत्रित होणारा हिशोब ➔ खरेदी: ₹{combPur.toLocaleString()} | जमा: ₹{combPaid.toLocaleString()} | शिल्लक बाकी: ₹{combDue.toLocaleString()}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setMergePrimaryCust(cand.primary);
                        setMergeSecondaryCust(cand.secondary);
                        setShowMergeModal(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer shrink-0 active:scale-95"
                    >
                      <Merge className="w-3.5 h-3.5" />
                      <span>हे दोन खाती एकत्र / Merge करा</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2 sm:p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            सर्व चुका ({counts.all})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('math')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'math'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>हिशोब चूक ({counts.math})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('phone')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'phone'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>मोबाईल नाही ({counts.phone})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('village')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'village'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>गाव नाही ({counts.village})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="नाव, बिल क्र. किंवा मोबाईल शोधा..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Issues List Container */}
      {filteredIssues.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            या फिल्टरनुसार कोणतीही चूक आढळली नाही!
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            सर्व नोंदी व्यवस्थित आहेत किंवा फिल्टरनुसार डेटा मॅच होत नाही.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Mobile Cards (sm:hidden) */}
          <div className="space-y-3 sm:hidden">
            {filteredIssues.map((issue) => (
              <div
                key={issue.id}
                className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2.5"
              >
                {/* Header: Title & Category */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {issue.type === 'math' ? (
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold text-[11px] flex items-center gap-1">
                        <Calculator className="w-3 h-3" />
                        हिशोब चूक
                      </span>
                    ) : issue.type === 'phone' ? (
                      <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 font-bold text-[11px] flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        मोबाईल अपूर्ण
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 font-bold text-[11px] flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        गाव अपूर्ण
                      </span>
                    )}

                    {issue.invoiceNo && (
                      <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        #{issue.invoiceNo}
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    {issue.category === 'bill' ? 'विक्री बिल' : 'ग्राहक खाते'}
                  </span>
                </div>

                {/* Customer & Info */}
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    {issue.customerName}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {issue.customerPhone ? (
                      <span className="font-mono">{issue.customerPhone}</span>
                    ) : (
                      <span className="text-amber-600 dark:text-amber-400">फोन: उपलब्ध नाही</span>
                    )}
                    <span>•</span>
                    <span>{issue.village || 'गाव: उपलब्ध नाही'}</span>
                  </div>
                </div>

                {/* Error Banner */}
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-xs">
                  <div className="font-bold text-amber-900 dark:text-amber-300">
                    {issue.title}
                  </div>
                  <div className="text-amber-800 dark:text-amber-400 text-[11px] mt-0.5">
                    {issue.description}
                  </div>
                </div>

                {/* Financial Details if bill */}
                {issue.category === 'bill' && (
                  <div className="grid grid-cols-3 gap-1.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">एकूण बिल</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        ₹{(issue.totalAmount || 0).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-sans">जमा भरणा</span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-300">
                        ₹{(issue.payingNow || 0).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-amber-700 dark:text-amber-400 block font-sans">उधारी बाकी</span>
                      <span className="font-bold text-amber-900 dark:text-amber-300">
                        ₹{(issue.dueAmount || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}

                {/* Action Buttons for Mobile */}
                <div className="flex items-center gap-2 pt-1">
                  {issue.type === 'math' && issue.rawTransaction && (
                    <button
                      type="button"
                      onClick={() => onFixMathTransaction(issue.rawTransaction!)}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5 fill-current" />
                      <span>हिशोब जुळवा</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (issue.rawTransaction) {
                        onEditTransaction(issue.rawTransaction);
                      } else if (issue.rawCustomer) {
                        onEditCustomer(issue.rawCustomer);
                      }
                    }}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>✏️ दुरुस्त करा / एडिट</span>
                  </button>

                  {issue.rawCustomer && onOpenLedger && (
                    <button
                      type="button"
                      onClick={() => onOpenLedger(issue.rawCustomer!)}
                      className="py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
                      title="खातेवही उघडा"
                    >
                      <BookOpen className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table (hidden sm:block) */}
          <div className="hidden sm:block overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">प्रकार / संदर्भ</th>
                    <th className="py-3 px-4">ग्राहकाचे नाव व संपर्क</th>
                    <th className="py-3 px-4">आढळलेली चूक व तफावत</th>
                    <th className="py-3 px-4 text-right">रक्कम / हिशोब (₹)</th>
                    <th className="py-3 px-4 text-center">कृती (Action)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredIssues.map((issue) => (
                    <tr
                      key={issue.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition"
                    >
                      {/* Column 1: Type & Ref */}
                      <td className="py-3 px-4 align-top">
                        <div className="space-y-1">
                          {issue.type === 'math' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold text-[11px]">
                              <Calculator className="w-3 h-3" />
                              हिशोब चूक
                            </span>
                          ) : issue.type === 'phone' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 font-bold text-[11px]">
                              <Phone className="w-3 h-3" />
                              मोबाईल अपूर्ण
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 font-bold text-[11px]">
                              <MapPin className="w-3 h-3" />
                              गाव अपूर्ण
                            </span>
                          )}

                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                            {issue.invoiceNo ? `बिल #${issue.invoiceNo}` : 'ग्राहक नोंद'}
                          </div>
                          {issue.date && (
                            <div className="text-[10px] text-slate-400">{issue.date}</div>
                          )}
                        </div>
                      </td>

                      {/* Column 2: Customer & Contact */}
                      <td className="py-3 px-4 align-top">
                        <div className="font-bold text-slate-900 dark:text-white text-sm">
                          {issue.customerName}
                        </div>
                        <div className="text-slate-500 dark:text-slate-400 font-mono text-[11px] mt-0.5">
                          {issue.customerPhone ? issue.customerPhone : 'फोन: उपलब्ध नाही'}
                        </div>
                        <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                          {issue.village ? issue.village : 'गाव: उपलब्ध नाही'}
                        </div>
                      </td>

                      {/* Column 3: Error & Tip */}
                      <td className="py-3 px-4 align-top max-w-xs">
                        <div className="font-bold text-amber-900 dark:text-amber-300 text-xs">
                          {issue.title}
                        </div>
                        <div className="text-slate-600 dark:text-slate-300 text-[11px] mt-0.5">
                          {issue.description}
                        </div>
                        <div className="text-emerald-700 dark:text-emerald-400 text-[10px] font-medium mt-1">
                          💡 {issue.solutionTip}
                        </div>
                      </td>

                      {/* Column 4: Financials */}
                      <td className="py-3 px-4 align-top text-right font-mono">
                        {issue.category === 'bill' ? (
                          <div className="space-y-0.5 text-xs">
                            <div className="text-slate-700 dark:text-slate-300">
                              एकूण: <span className="font-bold">₹{(issue.totalAmount || 0).toLocaleString()}</span>
                            </div>
                            <div className="text-emerald-600 dark:text-emerald-400">
                              जमा: <span className="font-bold">₹{(issue.payingNow || 0).toLocaleString()}</span>
                            </div>
                            <div className="text-amber-800 dark:text-amber-400">
                              बाकी: <span className="font-black">₹{(issue.dueAmount || 0).toLocaleString()}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-amber-800 dark:text-amber-400 font-bold text-xs">
                            बाकी: ₹{(issue.dueAmount || 0).toLocaleString()}
                          </div>
                        )}
                      </td>

                      {/* Column 5: Actions */}
                      <td className="py-3 px-4 align-top text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {issue.type === 'math' && issue.rawTransaction && (
                            <button
                              type="button"
                              onClick={() => onFixMathTransaction(issue.rawTransaction!)}
                              className="px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs cursor-pointer active:scale-95"
                              title="आपोआप बाकी सेट करा (Due = Total - Paid)"
                            >
                              <Zap className="w-3 h-3 fill-current" />
                              <span>जुळवा</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              if (issue.rawTransaction) {
                                onEditTransaction(issue.rawTransaction);
                              } else if (issue.rawCustomer) {
                                onEditCustomer(issue.rawCustomer);
                              }
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs cursor-pointer active:scale-95"
                          >
                            <Pencil className="w-3 h-3" />
                            <span>एडिट करा</span>
                          </button>

                          {issue.rawCustomer && onOpenLedger && (
                            <button
                              type="button"
                              onClick={() => onOpenLedger(issue.rawCustomer!)}
                              className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
                              title="खातेवही उघडा"
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
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
          onConfirmMerge={onMergeCustomers}
        />
      )}
    </div>
  );
};
