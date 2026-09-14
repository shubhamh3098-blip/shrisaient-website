import React, { useState, useMemo } from 'react';
import {
  Search,
  Receipt,
  FileText,
  CreditCard,
  Users,
  ShoppingCart,
  Building2,
  Filter,
  Download,
  Printer,
  Eye,
  ExternalLink,
  Calendar,
  Phone,
  MapPin,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowDownLeft,
  ArrowUpRight,
  Database,
  Layers,
  ChevronRight,
  LayoutGrid,
  Table as TableIcon,
  X,
  Edit2,
  Trash2,
} from 'lucide-react';
import {
  TransactionEntry,
  CardMember,
  CardTransaction,
  Customer,
  PurchaseEntry,
  Dealer,
  StockItem,
  BusinessSettings,
  ActiveTab
} from '../types';
import { EditRecordModal, EditableRecordData } from './EditRecordModal';

interface UploadedDataViewProps {
  transactions: TransactionEntry[];
  cardMembers: CardMember[];
  cardTransactions: CardTransaction[];
  customers: Customer[];
  purchases: PurchaseEntry[];
  dealers: Dealer[];
  stock?: StockItem[];
  settings: BusinessSettings;
  onOpenInvoiceModal: (entry: TransactionEntry) => void;
  onOpenPassbookModal: (member: CardMember) => void;
  onNavigateTab: (tab: ActiveTab, filterParam?: string) => void;
  onUpdateRecord?: (category: 'bill' | 'receipt' | 'card' | 'customer' | 'purchase' | 'dealer', id: string, updatedData: any) => void;
  onDeleteRecord?: (category: 'bill' | 'receipt' | 'card' | 'customer' | 'purchase' | 'dealer', id: string) => void;
}

type FilterCategory = 'all' | 'receipts' | 'bills' | 'cards' | 'customers' | 'purchases' | 'dealers';

export const UploadedDataView: React.FC<UploadedDataViewProps> = ({
  transactions = [],
  cardMembers = [],
  cardTransactions = [],
  customers = [],
  purchases = [],
  dealers = [],
  stock = [],
  settings,
  onOpenInvoiceModal,
  onOpenPassbookModal,
  onNavigateTab,
  onUpdateRecord,
  onDeleteRecord,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('all');
  const [selectedDate, setSelectedDate] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [selectedRecordDetail, setSelectedRecordDetail] = useState<any | null>(null);
  const [editingRecord, setEditingRecord] = useState<EditableRecordData | null>(null);

  // 1. Build lookup for card members by card number
  const memberMap = useMemo(() => {
    const map = new Map<number, CardMember>();
    (cardMembers || []).forEach((m) => {
      if (m && m.cardNumber) {
        map.set(m.cardNumber, m);
      }
    });
    return map;
  }, [cardMembers]);

  // 2. Separate transactions into Bills vs Payment Receipts
  const { salesBills, paymentReceipts } = useMemo(() => {
    const bills: TransactionEntry[] = [];
    const rcpts: TransactionEntry[] = [];
    (transactions || []).forEach((tx) => {
      if (!tx) return;
      const isReceipt =
        tx.entryType === 'Receipt' ||
        (tx.totalAmount === 0 && (tx.payingNow || 0) > 0) ||
        (tx.itemDetails && (tx.itemDetails.toLowerCase().includes('पावती') || tx.itemDetails.toLowerCase().includes('उधारी जमा')));
      if (isReceipt) {
        rcpts.push(tx);
      } else {
        bills.push(tx);
      }
    });
    return { salesBills: bills, paymentReceipts: rcpts };
  }, [transactions]);

  // 3. Normalized Universal Item List for Unified Search
  interface UnifiedRecord {
    id: string;
    category: 'receipt' | 'bill' | 'card' | 'customer' | 'purchase' | 'dealer';
    categoryLabel: string;
    badgeColor: string;
    title: string;
    subtitle: string;
    productName?: string;
    date?: string;
    referenceNo?: string;
    amount?: number;
    paidAmount?: number;
    secondaryAmount?: number;
    amountLabel?: string;
    phone?: string;
    village?: string;
    status?: string;
    rawItem: any;
  }

  const allRecords = useMemo<UnifiedRecord[]>(() => {
    const list: UnifiedRecord[] = [];

    // A. Card Scheme Deposit Receipts
    (cardTransactions || []).forEach((ct) => {
      if (!ct) return;
      const member = ct.cardNumber ? memberMap.get(ct.cardNumber) : undefined;
      const custName = member?.customerName || (member as any)?.name || ct.customerName || (ct as any).memberName || 'ग्राहक';
      const phone = member?.phone || ct.customerPhone || (ct as any).memberPhone || '';
      const village = member?.village || (ct as any).village || '';
      list.push({
        id: `card-tx-${ct.id || Math.random()}`,
        category: 'receipt',
        categoryLabel: 'कार्ड योजना पावती (Scheme Deposit)',
        badgeColor: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800',
        title: `${custName} (कार्ड #${ct.cardNumber ?? '-'})`,
        subtitle: ct.receiptNo
          ? `पावती #${ct.receiptNo} • हप्ता #${ct.weekNumber || (ct as any).installmentNumber || '-'}`
          : `हप्ता #${ct.weekNumber || (ct as any).installmentNumber || '-'} • ${ct.paymentMode || 'Cash'}`,
        date: ct.date || '',
        referenceNo: ct.receiptNo || (ct.id ? `TX-${ct.id}` : ''),
        amount: Number(ct.amount) || 0,
        amountLabel: 'जमा रक्कम',
        phone: String(phone || ''),
        village: String(village || ''),
        status: 'जमा',
        rawItem: { ...ct, member },
      });
    });

    // B. Customer Khata / Bill Payment Receipts
    (paymentReceipts || []).forEach((pr) => {
      if (!pr) return;
      list.push({
        id: `bill-rcpt-${pr.id || Math.random()}`,
        category: 'receipt',
        categoryLabel: 'उधारी जमा पावती (Khata Payment)',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
        title: String(pr.customerName || 'ग्राहक'),
        subtitle: String(pr.itemDetails || 'उधारी जमा पावती'),
        date: pr.date || '',
        referenceNo: pr.invoiceNo || '',
        amount: Number(pr.payingNow) || 0,
        amountLabel: 'जमा पावती रक्कम',
        phone: String(pr.customerPhone || ''),
        village: String(pr.village || ''),
        status: 'जमा',
        rawItem: pr,
      });
    });

    // C. Sales Bills (विक्री बिले)
    (salesBills || []).forEach((sb) => {
      if (!sb) return;
      const totalAmt = Number(sb.totalAmount) || 0;
      const payingAmt = Number(sb.payingNow) || 0;
      const due = sb.dueAmount !== undefined ? Number(sb.dueAmount) : Math.max(0, totalAmt - payingAmt);
      const prodName = sb.stockItemName || sb.itemDetails || 'खरेदी बिल';
      list.push({
        id: `bill-${sb.id || Math.random()}`,
        category: 'bill',
        categoryLabel: 'विक्री बिल (Sales Bill)',
        badgeColor: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800',
        title: `${sb.customerName || 'ग्राहक'} - ${prodName}`,
        subtitle: `बिल #${sb.invoiceNo || '-'} • प्रॉडक्ट: ${prodName} • मोड: ${sb.paymentMode || 'Cash'}`,
        productName: prodName,
        date: sb.date || '',
        referenceNo: sb.invoiceNo || '',
        amount: totalAmt,
        paidAmount: payingAmt,
        secondaryAmount: due,
        amountLabel: 'एकूण बिल (Total)',
        phone: String(sb.customerPhone || ''),
        village: String(sb.village || ''),
        status: due > 0 ? `बाकी: ₹${due.toLocaleString()}` : 'पूर्ण पेड',
        rawItem: sb,
      });
    });

    // D. Card Scheme Members (कार्ड सभासद)
    (cardMembers || []).forEach((cm) => {
      if (!cm) return;
      const custName = cm.customerName || (cm as any).name || `कार्ड #${cm.cardNumber ?? '-'}`;
      const totalDep = Number(cm.totalDeposited ?? (cm as any).totalPaid ?? 0);
      const netBal = Number(cm.netBalance ?? totalDep);
      list.push({
        id: `card-member-${cm.id || Math.random()}`,
        category: 'card',
        categoryLabel: `कार्ड सभासद (कार्ड #${cm.cardNumber ?? '-'})`,
        badgeColor: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
        title: `${custName} - कार्ड #${cm.cardNumber ?? '-'}`,
        subtitle: `${cm.schemeName || 'योजना'} • जमा: ₹${totalDep.toLocaleString()}`,
        date: cm.joiningDate || (cm as any).startDate || '',
        referenceNo: cm.cardNumber !== undefined ? `कार्ड #${cm.cardNumber}` : '',
        amount: totalDep,
        secondaryAmount: netBal,
        amountLabel: 'एकूण बचत जमा',
        phone: String(cm.phone || ''),
        village: String(cm.village || ''),
        status: cm.status === 'Completed' ? 'पूर्ण' : 'सुरू',
        rawItem: cm,
      });
    });

    // E. Customer Khata Ledger Accounts (ग्राहक खाती)
    (customers || []).forEach((cust) => {
      if (!cust) return;
      const totalPurch = Number(cust.totalPurchases ?? cust.totalPurchased ?? 0);
      const totalPaid = Number(cust.totalPaid ?? 0);
      const balDue = Number(cust.balanceDue !== undefined ? cust.balanceDue : Math.max(0, totalPurch - totalPaid));
      list.push({
        id: `cust-${cust.id || Math.random()}`,
        category: 'customer',
        categoryLabel: 'ग्राहक खातावही (Khata Ledger)',
        badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800',
        title: String(cust.name || 'ग्राहक'),
        subtitle: `एकूण खरेदी: ₹${totalPurch.toLocaleString()} • जमा: ₹${totalPaid.toLocaleString()}`,
        referenceNo: String(cust.phone || cust.id || ''),
        amount: balDue,
        secondaryAmount: totalPurch,
        amountLabel: 'शिल्लक येणेबाकी (Due)',
        phone: String(cust.phone || ''),
        village: String(cust.address || cust.village || ''),
        status: balDue > 0 ? `येणेबाकी: ₹${balDue.toLocaleString()}` : 'हिशोब निरंक',
        rawItem: cust,
      });
    });

    // F. Purchases (खरेदी नोंदी)
    (purchases || []).forEach((p) => {
      if (!p) return;
      const supName = p.supplierName || (p as any).dealerName || 'सप्लायर';
      const itm = p.items || (p as any).itemDetails || 'खरेदी बिल';
      const bNo = p.billNo || (p as any).invoiceNo || `PUR-${p.id || ''}`;
      const tot = Number(p.totalAmount) || 0;
      const paid = Number(p.paidAmount) || 0;
      const due = Math.max(0, tot - paid);
      list.push({
        id: `purchase-${p.id || Math.random()}`,
        category: 'purchase',
        categoryLabel: 'खरेदी नोंद (Purchase)',
        badgeColor: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800',
        title: `${supName} - ${itm}`,
        subtitle: `बिल #${bNo} • मोड: ${p.paymentMode || 'Cash'}`,
        date: p.date || '',
        referenceNo: String(bNo),
        amount: tot,
        secondaryAmount: due,
        amountLabel: 'खरेदी रक्कम',
        status: due > 0 ? `देणेबाकी: ₹${due.toLocaleString()}` : 'पेड',
        rawItem: p,
      });
    });

    // G. Dealers (सप्लायर्स / डीलर्स)
    (dealers || []).forEach((dlr) => {
      if (!dlr) return;
      const totPurch = Number(dlr.totalPurchases) || 0;
      const totPaid = Number(dlr.totalPaid) || 0;
      const balDue = Number(dlr.balanceDue !== undefined ? dlr.balanceDue : Math.max(0, totPurch - totPaid));
      list.push({
        id: `dealer-${dlr.id || Math.random()}`,
        category: 'dealer',
        categoryLabel: 'डीलर / सप्लायर (Supplier)',
        badgeColor: 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-800',
        title: String(dlr.name || 'डीलर'),
        subtitle: `एकूण खरेदी: ₹${totPurch.toLocaleString()} • पेड: ₹${totPaid.toLocaleString()}`,
        referenceNo: String(dlr.phone || dlr.id || ''),
        amount: balDue,
        amountLabel: 'देणेबाकी (To Pay)',
        phone: String(dlr.phone || ''),
        village: String(dlr.address || ''),
        status: balDue > 0 ? `देणेबाकी: ₹${balDue.toLocaleString()}` : 'हिशोब निरंक',
        rawItem: dlr,
      });
    });

    return list;
  }, [cardTransactions, memberMap, paymentReceipts, salesBills, cardMembers, customers, purchases, dealers]);

  // 4. Live Filtering across all fields
  const filteredRecords = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();

    return allRecords.filter((rec) => {
      if (!rec) return false;

      // Category filter
      if (activeCategory === 'receipts' && rec.category !== 'receipt') return false;
      if (activeCategory === 'bills' && rec.category !== 'bill') return false;
      if (activeCategory === 'cards' && rec.category !== 'card') return false;
      if (activeCategory === 'customers' && rec.category !== 'customer') return false;
      if (activeCategory === 'purchases' && rec.category !== 'purchase') return false;
      if (activeCategory === 'dealers' && rec.category !== 'dealer') return false;

      // Date filter
      if (selectedDate && rec.date && rec.date !== selectedDate) return false;

      // Search Query
      if (!q) return true;

      const titleStr = String(rec.title || '').toLowerCase();
      const subtitleStr = String(rec.subtitle || '').toLowerCase();
      const refStr = String(rec.referenceNo || '').toLowerCase();
      const phoneStr = String(rec.phone || '').toLowerCase();
      const villageStr = String(rec.village || '').toLowerCase();
      const labelStr = String(rec.categoryLabel || '').toLowerCase();
      const amountStr = rec.amount !== undefined ? String(rec.amount) : '';

      return (
        titleStr.includes(q) ||
        subtitleStr.includes(q) ||
        refStr.includes(q) ||
        phoneStr.includes(q) ||
        villageStr.includes(q) ||
        labelStr.includes(q) ||
        amountStr.includes(q)
      );
    });
  }, [allRecords, activeCategory, selectedDate, searchQuery]);

  // Aggregate stats
  const totalReceiptsCount = (cardTransactions || []).length + (paymentReceipts || []).length;
  const totalReceiptsSum =
    (cardTransactions || []).reduce((sum, c) => sum + (Number(c?.amount) || 0), 0) +
    (paymentReceipts || []).reduce((sum, p) => sum + (Number(p?.payingNow) || 0), 0);

  const totalBillsSum = (salesBills || []).reduce((sum, b) => sum + (Number(b?.totalAmount) || 0), 0);
  const totalCustomerDues = (customers || []).reduce((sum, c) => sum + (Number(c?.balanceDue) || 0), 0);
  const totalCardSavings = (cardMembers || []).reduce(
    (sum, m) => sum + Number(m?.totalDeposited ?? (m as any)?.totalPaid ?? 0),
    0
  );

  // Scheme-specific card counts
  const scheme1Cards = (cardMembers || []).filter((m) => m && m.schemeId === 'scheme1');
  const scheme2Cards = (cardMembers || []).filter((m) => m && m.schemeId === 'scheme2');
  const scheme3Cards = (cardMembers || []).filter((m) => m && m.schemeId === 'scheme3');

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredRecords.length === 0) return;
    const headers = ['प्रकार', 'तारीख', 'संदर्भ_क्रमांक', 'शीर्षक / नाव', 'तपशील', 'फोन', 'गाव', 'रक्कम', 'स्थिती'];
    const rows = filteredRecords.map((r) => [
      `"${String(r.categoryLabel || '').replace(/"/g, '""')}"`,
      `"${r.date || ''}"`,
      `"${r.referenceNo || ''}"`,
      `"${String(r.title || '').replace(/"/g, '""')}"`,
      `"${String(r.subtitle || '').replace(/"/g, '""')}"`,
      `"${r.phone || ''}"`,
      `"${r.village || ''}"`,
      r.amount || 0,
      `"${r.status || ''}"`,
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `integrated_data_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-3xl text-white shadow-xl border border-slate-700/50">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight">अपलोड केलेला सर्व डेटा व शोध केंद्र</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Universal Search
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                CSV द्वारे आलेला आणि सिस्टीममध्ये जोडलेला सर्व डेटा: पावत्या, बिले, कार्ड्स, ग्राहक व खरेदी नोंदी.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigateTab('csv-import')}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition cursor-pointer flex items-center gap-1.5"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>नवीन CSV अपलोड करा</span>
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-sm cursor-pointer flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Excel / CSV एक्सपोर्ट</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* Receipts KPI */}
        <div
          onClick={() => setActiveCategory(activeCategory === 'receipts' ? 'all' : 'receipts')}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            activeCategory === 'receipts'
              ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-400 dark:border-purple-600 ring-2 ring-purple-400/30'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-purple-900 dark:text-purple-300">
            <span className="flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>जमा पावत्या</span>
            </span>
            <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
              {totalReceiptsCount}
            </span>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-2 font-mono-num">
            ₹{totalReceiptsSum.toLocaleString()}
          </div>
          <div className="text-[11px] text-purple-700 dark:text-purple-400 mt-0.5 truncate">
            योजना + ग्राहक जमा पावत्या
          </div>
        </div>

        {/* Bills KPI */}
        <div
          onClick={() => setActiveCategory(activeCategory === 'bills' ? 'all' : 'bills')}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            activeCategory === 'bills'
              ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-400 dark:border-blue-600 ring-2 ring-blue-400/30'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-blue-900 dark:text-blue-300">
            <span className="flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>विक्री बिले</span>
            </span>
            <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
              {salesBills.length}
            </span>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-2 font-mono-num">
            ₹{totalBillsSum.toLocaleString()}
          </div>
          <div className="text-[11px] text-blue-700 dark:text-blue-400 mt-0.5 truncate">
            एकूण विक्री बिले
          </div>
        </div>

        {/* Card Members KPI */}
        <div
          onClick={() => setActiveCategory(activeCategory === 'cards' ? 'all' : 'cards')}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            activeCategory === 'cards'
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 dark:border-amber-600 ring-2 ring-amber-400/30'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-700 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-amber-950 dark:text-amber-300">
            <span className="flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>कार्ड सभासद</span>
            </span>
            <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
              {cardMembers.length}
            </span>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-2 font-mono-num">
            ₹{totalCardSavings.toLocaleString()}
          </div>
          <div className="text-[11px] text-amber-800 dark:text-amber-400 mt-0.5 truncate">
            बचत खाती जमा
          </div>
        </div>

        {/* Customers Khata KPI */}
        <div
          onClick={() => setActiveCategory(activeCategory === 'customers' ? 'all' : 'customers')}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            activeCategory === 'customers'
              ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-600 ring-2 ring-indigo-400/30'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-indigo-950 dark:text-indigo-300">
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>ग्राहक खाती</span>
            </span>
            <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
              {customers.length}
            </span>
          </div>
          <div className="text-xl font-black text-rose-600 dark:text-rose-400 mt-2 font-mono-num">
            ₹{totalCustomerDues.toLocaleString()}
          </div>
          <div className="text-[11px] text-indigo-700 dark:text-indigo-400 mt-0.5 truncate">
            एकूण येणेबाकी (Dues)
          </div>
        </div>

        {/* Purchases KPI */}
        <div
          onClick={() => setActiveCategory(activeCategory === 'purchases' ? 'all' : 'purchases')}
          className={`col-span-2 md:col-span-1 p-4 rounded-2xl border transition cursor-pointer ${
            activeCategory === 'purchases'
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-400 dark:border-rose-600 ring-2 ring-rose-400/30'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-700 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-rose-950 dark:text-rose-300">
            <span className="flex items-center gap-1.5">
              <ShoppingCart className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span>खरेदी व डीलर्स</span>
            </span>
            <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300">
              {purchases.length}
            </span>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-2 font-mono-num">
            {dealers.length} डीलर्स
          </div>
          <div className="text-[11px] text-rose-700 dark:text-rose-400 mt-0.5 truncate">
            खरेदी आवक नोंदी
          </div>
        </div>
      </div>

      {/* Real-time Search Box & Category Filters Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="नाव, मोबाईल नं, गाव, कार्ड नं (उदा. 1001), पावती किंवा बिल नं (उदा. 101, 102), किंवा रक्कम टाकून शोधा..."
              className="w-full pl-11 pr-10 py-3 rounded-2xl border border-slate-200 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 text-base sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Date filter */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:flex-none">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full sm:w-auto px-3.5 py-3 rounded-2xl border border-slate-200 dark:border-slate-750 text-sm sm:text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            {selectedDate && (
              <button
                type="button"
                onClick={() => setSelectedDate('')}
                className="p-3 sm:p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-sm sm:text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
                title="तारीख फिल्टर हटवा"
              >
                Clear Date
              </button>
            )}
          </div>
        </div>

        {/* Category Pills Switcher */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-sm sm:text-xs">
          {[
            { id: 'all', label: 'सर्व रेकॉर्ड्स', count: allRecords.length, icon: Layers },
            { id: 'receipts', label: '🧾 जमा पावत्या', count: totalReceiptsCount, icon: Receipt },
            { id: 'bills', label: '🛒 विक्री बिले', count: salesBills.length, icon: FileText },
            { id: 'cards', label: '💳 कार्ड सभासद', count: cardMembers.length, icon: CreditCard },
            { id: 'customers', label: '👥 ग्राहक खाती', count: customers.length, icon: Users },
            { id: 'purchases', label: '📦 खरेदी नोंदी', count: purchases.length, icon: ShoppingCart },
            { id: 'dealers', label: '🏢 डीलर्स', count: dealers.length, icon: Building2 },
          ].map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id as FilterCategory)}
                className={`px-3.5 py-2.5 sm:py-2 rounded-xl font-bold flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer text-sm sm:text-xs ${
                  isActive
                    ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-xs sm:text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Quick Scheme & Location Search Shortcuts */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
          <span className="text-slate-400 font-medium mr-1 flex items-center gap-1">
            <span>⚡ जलद पर्याय:</span>
          </span>
          <button
            type="button"
            onClick={() => {
              setActiveCategory('cards');
              setSearchQuery('योजना १');
            }}
            className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold transition cursor-pointer dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
          >
            💳 योजना १ ({scheme1Cards.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveCategory('cards');
              setSearchQuery('योजना २');
            }}
            className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 font-bold transition cursor-pointer dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800"
          >
            💳 योजना २ ({scheme2Cards.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveCategory('cards');
              setSearchQuery('योजना ३');
            }}
            className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 font-bold transition cursor-pointer dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800"
          >
            💳 योजना ३ ({scheme3Cards.length})
          </button>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          {['केळझर', 'वायफड', 'वर्धा', 'पावती', 'उधारी'].map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setSearchQuery(tag)}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-medium transition cursor-pointer dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
            >
              #{tag}
            </button>
          ))}
          {(searchQuery || activeCategory !== 'all' || selectedDate) && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('all');
                setSelectedDate('');
              }}
              className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold transition cursor-pointer dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 ml-auto"
            >
              ✕ सर्व फिल्टर काढा
            </button>
          )}
        </div>
      </div>

      {/* Results Header / Summary & View Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-1">
        <div className="text-sm sm:text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-2 flex-wrap">
          <span>सापडलेले रेकॉर्ड्स:</span>
          <span className="font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md text-sm sm:text-xs font-mono-num">
            {filteredRecords.length}
          </span>
          {searchQuery && (
            <span>
              &quot;<span className="text-indigo-600 dark:text-indigo-400 font-bold">{searchQuery}</span>&quot; साठी
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {filteredRecords.length > 0 && (
            <div className="hidden md:block text-xs text-slate-400 dark:text-slate-500">
              कोणत्याही नोंदीवर क्लिक करून पावती, बिल किंवा पासबुक उघडू शकता.
            </div>
          )}
          {/* Table / Cards View Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-0.5 ml-auto">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="कार्ड व्ह्यू"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>कार्ड्स</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="टेबल व्ह्यू"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>टेबल</span>
            </button>
          </div>
        </div>
      </div>

      {/* Unified Results Grid / Table */}
      {filteredRecords.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">एकही नोंद सापडली नाही</h3>
          <p className="text-sm sm:text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            &quot;{searchQuery}&quot; साठी कोणताही डेटा सापडला नाही. कृपया नाव, फोन नंबर किंवा कार्ड नंबर तपासा.
          </p>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="px-4 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold text-sm sm:text-xs hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition cursor-pointer"
            >
              शोध रद्द करा (Clear Search)
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* Full Data Table with Increased Base Font Size (<640px) */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm sm:text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3.5 px-3 sm:px-4 text-sm sm:text-xs whitespace-nowrap">प्रकार</th>
                  <th className="py-3.5 px-3 sm:px-4 text-sm sm:text-xs whitespace-nowrap">क्रमांक / तारीख</th>
                  <th className="py-3.5 px-3 sm:px-4 text-sm sm:text-xs">नाव व प्रॉडक्ट तपशील</th>
                  <th className="py-3.5 px-3 sm:px-4 text-sm sm:text-xs whitespace-nowrap">मोबाईल / गाव</th>
                  <th className="py-3.5 px-3 sm:px-4 text-sm sm:text-xs text-right whitespace-nowrap">रक्कम / अॅडव्हान्स / बाकी (₹)</th>
                  <th className="py-3.5 px-3 sm:px-4 text-sm sm:text-xs text-center whitespace-nowrap">कृती (Action)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRecords.map((item, idx) => (
                  <tr key={`${item.id}-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition">
                    <td className="py-3.5 px-3 sm:px-4 whitespace-nowrap">
                      <span className={`text-xs sm:text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${item.badgeColor}`}>
                        {item.categoryLabel}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 sm:px-4 whitespace-nowrap">
                      <div className="font-mono text-sm sm:text-xs font-bold text-slate-800 dark:text-slate-200">
                        {item.referenceNo ? `#${item.referenceNo}` : '-'}
                      </div>
                      {item.date && (
                        <div className="text-xs sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{item.date}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-3 sm:px-4 max-w-xs">
                      <div className="text-base sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                        {item.title}
                      </div>
                      {item.productName && item.category === 'bill' && (
                        <div className="mt-0.5">
                          <span className="inline-flex items-center text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                            📦 {item.productName}
                          </span>
                        </div>
                      )}
                      {item.subtitle && (
                        <div className="text-sm sm:text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {item.subtitle}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-3 sm:px-4 whitespace-nowrap">
                      {item.phone && (
                        <div className="text-sm sm:text-xs font-mono text-slate-700 dark:text-slate-300 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{item.phone}</span>
                        </div>
                      )}
                      {item.village && (
                        <div className="text-xs sm:text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{item.village}</span>
                        </div>
                      )}
                      {!item.phone && !item.village && (
                        <span className="text-xs text-slate-400 dark:text-slate-500">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 sm:px-4 text-right whitespace-nowrap">
                      {item.category === 'bill' ? (
                        <div className="flex flex-col items-end gap-0.5">
                          <div className="text-base sm:text-sm font-black text-slate-900 dark:text-white font-mono-num flex items-center gap-1">
                            <span className="text-[10px] sm:text-[9px] font-bold text-slate-400">एकूण:</span>
                            <span>₹{(item.amount || 0).toLocaleString()}</span>
                          </div>
                          {item.paidAmount !== undefined && item.paidAmount > 0 && (
                            <div className="text-xs sm:text-[11px] font-bold text-emerald-600 dark:text-emerald-400 font-mono-num flex items-center gap-1">
                              <span className="text-[10px] sm:text-[9px] font-medium text-emerald-500">अॅडव्हान्स/जमा:</span>
                              <span>₹{item.paidAmount.toLocaleString()}</span>
                            </div>
                          )}
                          {item.secondaryAmount !== undefined && (
                            <div className={`text-xs sm:text-[11px] font-black font-mono-num flex items-center gap-1 ${
                              item.secondaryAmount > 0
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-slate-400 dark:text-slate-500'
                            }`}>
                              <span className="text-[10px] sm:text-[9px] font-medium text-amber-500">बाकी:</span>
                              <span>₹{item.secondaryAmount.toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <>
                          <div className="text-base sm:text-sm font-black text-slate-900 dark:text-white font-mono-num">
                            {item.category === 'receipt' && '+ '}₹{(item.amount || 0).toLocaleString()}
                          </div>
                          {item.secondaryAmount !== undefined && item.secondaryAmount > 0 && (
                            <div className="text-xs sm:text-[10px] text-amber-600 dark:text-amber-400 font-bold font-mono-num">
                              बाकी: ₹{(item.secondaryAmount || 0).toLocaleString()}
                            </div>
                          )}
                        </>
                      )}
                    </td>
                    <td className="py-3.5 px-3 sm:px-4 text-center whitespace-nowrap">
                      {/* Actions */}
                      {(item.category === 'bill' || item.category === 'receipt') && (
                        <button
                          type="button"
                          onClick={() => {
                            if (item.category === 'bill') {
                              onOpenInvoiceModal(item.rawItem);
                            } else if (item.rawItem.invoiceNo) {
                              onOpenInvoiceModal(item.rawItem);
                            } else if (item.rawItem.member) {
                              onOpenPassbookModal(item.rawItem.member);
                            } else {
                              const foundMember = memberMap.get(item.rawItem.cardNumber);
                              if (foundMember) onOpenPassbookModal(foundMember);
                              else onNavigateTab('card-scheme');
                            }
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-indigo-600 hover:bg-indigo-600 dark:hover:bg-indigo-500 text-white text-sm sm:text-xs font-bold transition inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{item.category === 'bill' ? 'बिल' : 'पावती'}</span>
                        </button>
                      )}
                      {item.category === 'card' && (
                        <button
                          type="button"
                          onClick={() => onOpenPassbookModal(item.rawItem)}
                          className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-sm sm:text-xs font-bold transition inline-flex items-center gap-1 cursor-pointer"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>पासबुक</span>
                        </button>
                      )}
                      {item.category === 'customer' && (
                        <button
                          type="button"
                          onClick={() => onNavigateTab('customers', item.rawItem.name)}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm sm:text-xs font-bold transition inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>खातावही</span>
                        </button>
                      )}
                      {item.category === 'purchase' && (
                        <button
                          type="button"
                          onClick={() => onNavigateTab('purchases')}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 text-white text-sm sm:text-xs font-bold transition inline-flex items-center gap-1 cursor-pointer"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>तपशील</span>
                        </button>
                      )}
                      {item.category === 'dealer' && (
                        <button
                          type="button"
                          onClick={() => onNavigateTab('dealer-ledger', item.rawItem.name)}
                          className="px-3 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm sm:text-xs font-bold transition inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Building2 className="w-3.5 h-3.5" />
                          <span>लेजर</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setEditingRecord(item)}
                        className="ml-1.5 px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 text-sm sm:text-xs font-bold transition inline-flex items-center gap-1 cursor-pointer border border-amber-300 dark:border-amber-700"
                        title="नोंद दुरुस्त करा (Edit Record)"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                        <span>एडिट</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* List Cards with Increased Base Font Size (<640px) */
        <div className="space-y-2.5">
          {filteredRecords.map((item, idx) => (
            <div
              key={`${item.id}-${idx}`}
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-600 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition flex flex-col md:flex-row md:items-center justify-between gap-3 group"
            >
              {/* Left Details */}
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center flex-wrap gap-2">
                  <span
                    className={`text-xs sm:text-[10px] font-black uppercase px-2.5 sm:px-2 py-1 sm:py-0.5 rounded-md border ${item.badgeColor}`}
                  >
                    {item.categoryLabel}
                  </span>

                  {item.referenceNo && (
                    <span className="text-xs sm:text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 sm:px-2 py-1 sm:py-0.5 rounded">
                      #{item.referenceNo}
                    </span>
                  )}

                  {item.date && (
                    <span className="text-xs sm:text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {item.date}
                    </span>
                  )}

                  {item.status && (
                    <span className="text-xs sm:text-[11px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 px-2.5 sm:px-2 py-1 sm:py-0.5 rounded border border-slate-200 dark:border-slate-700">
                      {item.status}
                    </span>
                  )}

                  {item.productName && (
                    <span className="text-xs sm:text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 sm:px-2 py-1 sm:py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                      📦 प्रॉडक्ट: {item.productName}
                    </span>
                  )}
                </div>

                {/* Title and Subtitle - increased font size for small screens */}
                <div className="flex flex-col">
                  <h4 className="text-base sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition truncate">
                    {item.title}
                  </h4>
                  <p className="text-sm sm:text-xs text-slate-600 dark:text-slate-400 truncate mt-0.5">
                    {item.subtitle}
                  </p>
                </div>

                {/* Village and Phone Badges */}
                <div className="flex items-center flex-wrap gap-3 text-xs sm:text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                  {item.phone && (
                    <span className="flex items-center gap-1 font-mono text-slate-600 dark:text-slate-400">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {item.phone}
                    </span>
                  )}
                  {item.village && (
                    <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {item.village}
                    </span>
                  )}
                </div>
              </div>

              {/* Right Side Amounts & Actions */}
              <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-2.5 md:pt-0 border-slate-100 dark:border-slate-800 shrink-0">
                {item.amount !== undefined && (
                  <div className="text-left md:text-right">
                    {item.category === 'bill' ? (
                      <div className="flex flex-col items-start md:items-end gap-0.5">
                        <div className="text-xs sm:text-[10px] text-slate-400 font-semibold">
                          {item.amountLabel || 'एकूण बिल (Total)'}
                        </div>
                        <div className="text-lg sm:text-base font-black text-slate-900 dark:text-white font-mono-num">
                          ₹{(item.amount || 0).toLocaleString()}
                        </div>
                        {item.paidAmount !== undefined && item.paidAmount > 0 && (
                          <div className="text-xs sm:text-[11px] text-emerald-600 dark:text-emerald-400 font-bold font-mono-num">
                            अॅडव्हान्स: ₹{item.paidAmount.toLocaleString()}
                          </div>
                        )}
                        {item.secondaryAmount !== undefined && (
                          <div className={`text-xs sm:text-[11px] font-bold font-mono-num ${
                            item.secondaryAmount > 0
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-slate-400 dark:text-slate-500'
                          }`}>
                            बाकी: ₹{(item.secondaryAmount || 0).toLocaleString()}
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="text-xs sm:text-[10px] text-slate-400 font-semibold">
                          {item.amountLabel || 'रक्कम'}
                        </div>
                        <div
                          className={`text-lg sm:text-base font-black font-mono-num ${
                            item.category === 'receipt'
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : item.category === 'customer'
                              ? (item.amount || 0) > 0
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-slate-900 dark:text-white'
                              : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {item.category === 'receipt' && '+ '}₹{(item.amount || 0).toLocaleString()}
                        </div>
                        {item.secondaryAmount !== undefined && item.secondaryAmount > 0 && (
                          <div className="text-xs sm:text-[10px] text-amber-600 dark:text-amber-400 font-bold font-mono-num">
                            शिल्लक: ₹{(item.secondaryAmount || 0).toLocaleString()}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Direct Action Buttons */}
                <div className="flex items-center gap-1.5">
                  {/* If Receipt or Bill */}
                  {(item.category === 'bill' || item.category === 'receipt') && (
                    <button
                      type="button"
                      onClick={() => {
                        if (item.category === 'bill') {
                          onOpenInvoiceModal(item.rawItem);
                        } else if (item.rawItem.invoiceNo) {
                          onOpenInvoiceModal(item.rawItem);
                        } else if (item.rawItem.member) {
                          onOpenPassbookModal(item.rawItem.member);
                        } else {
                          // Generic card receipt
                          const foundMember = memberMap.get(item.rawItem.cardNumber);
                          if (foundMember) onOpenPassbookModal(foundMember);
                          else onNavigateTab('card-scheme');
                        }
                      }}
                      className="px-3.5 sm:px-3 py-2.5 sm:py-2 rounded-xl bg-slate-900 dark:bg-indigo-600 hover:bg-indigo-600 dark:hover:bg-indigo-500 text-white text-sm sm:text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                    >
                      <Eye className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                      <span>{item.category === 'bill' ? 'बिल पाहा' : 'पावती पाहा'}</span>
                    </button>
                  )}

                  {/* If Card Member */}
                  {item.category === 'card' && (
                    <button
                      type="button"
                      onClick={() => onOpenPassbookModal(item.rawItem)}
                      className="px-3.5 sm:px-3 py-2.5 sm:py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-sm sm:text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                    >
                      <CreditCard className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                      <span>पासबुक उघडा</span>
                    </button>
                  )}

                  {/* If Customer */}
                  {item.category === 'customer' && (
                    <button
                      type="button"
                      onClick={() => onNavigateTab('customers', item.rawItem.name)}
                      className="px-3.5 sm:px-3 py-2.5 sm:py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm sm:text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                    >
                      <Users className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                      <span>खातावही उघडा</span>
                    </button>
                  )}

                  {/* If Purchase or Dealer */}
                  {item.category === 'purchase' && (
                    <button
                      type="button"
                      onClick={() => onNavigateTab('purchases')}
                      className="px-3.5 sm:px-3 py-2.5 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm sm:text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <ShoppingCart className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                      <span>खरेदी तपशील</span>
                    </button>
                  )}

                  {item.category === 'dealer' && (
                    <button
                      type="button"
                      onClick={() => onNavigateTab('dealer-ledger', item.rawItem.name)}
                      className="px-3.5 sm:px-3 py-2.5 sm:py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm sm:text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Building2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                      <span>डीलर लेजर</span>
                    </button>
                  )}

                  {/* General View Details Button */}
                  <button
                    type="button"
                    onClick={() => setSelectedRecordDetail(item)}
                    className="p-2 sm:p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold transition cursor-pointer"
                    title="नोंदीचा संपूर्ण तपशील पाहा"
                  >
                    <Eye className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingRecord(item)}
                    className="px-3 sm:px-2.5 py-2 sm:py-1.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    title="नोंद एडिट करा"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                    <span>एडिट</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Record Detail Modal */}
      {selectedRecordDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in no-print">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${selectedRecordDetail.badgeColor}`}>
                  {selectedRecordDetail.categoryLabel}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecordDetail(null)}
                className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {selectedRecordDetail.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {selectedRecordDetail.subtitle}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
                {selectedRecordDetail.referenceNo && (
                  <div>
                    <span className="text-slate-400 block font-medium">संदर्भ / पावती क्र:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 font-mono text-sm">
                      {selectedRecordDetail.referenceNo}
                    </span>
                  </div>
                )}
                {selectedRecordDetail.date && (
                  <div>
                    <span className="text-slate-400 block font-medium">तारीख:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {selectedRecordDetail.date}
                    </span>
                  </div>
                )}
                {selectedRecordDetail.phone && (
                  <div>
                    <span className="text-slate-400 block font-medium">मोबाईल नंबर:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                      {selectedRecordDetail.phone}
                    </span>
                  </div>
                )}
                {selectedRecordDetail.village && (
                  <div>
                    <span className="text-slate-400 block font-medium">गाव / पत्ता:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {selectedRecordDetail.village}
                    </span>
                  </div>
                )}
                {selectedRecordDetail.amount !== undefined && (
                  <div>
                    <span className="text-slate-400 block font-medium">
                      {selectedRecordDetail.amountLabel || 'रक्कम'}:
                    </span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400 font-mono text-base">
                      ₹{(selectedRecordDetail.amount || 0).toLocaleString()}
                    </span>
                  </div>
                )}
                {selectedRecordDetail.secondaryAmount !== undefined && selectedRecordDetail.secondaryAmount > 0 && (
                  <div>
                    <span className="text-slate-400 block font-medium">उर्वरित शिल्लक / देणे:</span>
                    <span className="font-black text-amber-600 dark:text-amber-400 font-mono text-base">
                      ₹{(selectedRecordDetail.secondaryAmount || 0).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              {selectedRecordDetail.category === 'card' && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenPassbookModal(selectedRecordDetail.rawItem);
                    setSelectedRecordDetail(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>पासबुक उघडा</span>
                </button>
              )}
              {(selectedRecordDetail.category === 'bill' || (selectedRecordDetail.category === 'receipt' && selectedRecordDetail.rawItem.invoiceNo)) && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenInvoiceModal(selectedRecordDetail.rawItem);
                    setSelectedRecordDetail(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <FileText className="w-4 h-4" />
                  <span>बिल प्रिंट / पाहा</span>
                </button>
              )}
              {selectedRecordDetail.category === 'customer' && (
                <button
                  type="button"
                  onClick={() => {
                    onNavigateTab('customers', selectedRecordDetail.rawItem.name);
                    setSelectedRecordDetail(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Users className="w-4 h-4" />
                  <span>खातावही उघडा</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setEditingRecord(selectedRecordDetail);
                  setSelectedRecordDetail(null);
                }}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Edit2 className="w-4 h-4" />
                <span>नोंद एडिट करा</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedRecordDetail(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                बंद करा
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Record Modal for Imported & Existing Data */}
      {editingRecord && (
        <EditRecordModal
          isOpen={!!editingRecord}
          record={editingRecord}
          onClose={() => setEditingRecord(null)}
          onSave={(category, id, updatedData) => {
            if (onUpdateRecord) {
              onUpdateRecord(category, id, updatedData);
            }
            setEditingRecord(null);
          }}
          onDelete={
            onDeleteRecord
              ? (category, id) => {
                  onDeleteRecord(category, id);
                  setEditingRecord(null);
                }
              : undefined
          }
        />
      )}
    </div>
  );
};
