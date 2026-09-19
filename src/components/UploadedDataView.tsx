import React, { useState, useMemo, useEffect } from 'react';
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
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Table as TableIcon,
  X,
  Edit2,
  Trash2,
  AlertTriangle,
  GitMerge,
  Wand2,
  RefreshCw,
  ShieldCheck,
  Check,
  ArrowRight,
  ShieldAlert,
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
  ActiveTab,
} from '../types';
import { EditRecordModal, EditableRecordData } from './EditRecordModal';
import { detectDuplicateCustomers, DuplicatePair } from '../utils/duplicateDetector';
import { DuplicateCustomerMergeModal } from './DuplicateCustomerMergeModal';

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
  onEditBillInFullEditor?: (bill: TransactionEntry) => void;
  onMergeCustomers?: (primaryId: string, duplicateId: string, mergedData: any) => void;
  onBatchMergeCustomers?: (
    merges: Array<{
      primaryId: string;
      duplicateId: string;
      mergedData: {
        name: string;
        phone: string;
        village?: string;
        address?: string;
      };
    }>
  ) => number;
  onAutoFixCalculations?: () => { fixedBills: number; fixedCustomers: number };
  onAutoCleanPhones?: () => number;
  onAutoFillAddresses?: () => number;
  onClearAllDemoData?: () => void;
  onClearZeroBills?: () => void;
}

type FilterCategory = 'all' | 'discrepancies' | 'receipts' | 'bills' | 'cards' | 'customers' | 'purchases' | 'dealers';

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
  onEditBillInFullEditor,
  onMergeCustomers,
  onBatchMergeCustomers,
  onAutoFixCalculations,
  onAutoCleanPhones,
  onAutoFillAddresses,
  onClearAllDemoData,
  onClearZeroBills,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('all');
  const [selectedDate, setSelectedDate] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAll, setShowAll] = useState(false);
  const PAGE_SIZE = 50;
  const [selectedRecordDetail, setSelectedRecordDetail] = useState<any | null>(null);
  const [editingRecord, setEditingRecord] = useState<EditableRecordData | null>(null);

  // Duplicate and audit state
  const [dismissedPairIds, setDismissedPairIds] = useState<Set<string>>(new Set());
  const [showDuplicateMergeModal, setShowDuplicateMergeModal] = useState(false);
  const [selectedDuplicatePairId, setSelectedDuplicatePairId] = useState<string | undefined>(undefined);
  const [auditSubTab, setAuditSubTab] = useState<'all' | 'duplicates' | 'calculations' | 'phones' | 'villages'>('all');
  const [auditFeedback, setAuditFeedback] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Auto-dismiss audit feedback after 5 seconds
  useEffect(() => {
    if (auditFeedback) {
      const timer = setTimeout(() => setAuditFeedback(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [auditFeedback]);

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
    modelNo?: string;
    serialNo?: string;
    isQuotation?: boolean;
    quotationValidity?: string;
    date?: string;
    referenceNo?: string;
    amount?: number;
    paidAmount?: number;
    secondaryAmount?: number;
    amountLabel?: string;
    phone?: string;
    village?: string;
    status?: string;
    isDiscrepancy?: boolean;
    discrepancyReasons?: string[];
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
      const amt = Number(ct.amount) || 0;

      const reasons: string[] = [];
      if (amt <= 0) reasons.push('रक्कम ₹0 किंवा अमान्य');
      if (!custName || custName === 'ग्राहक' || custName.toLowerCase() === 'customer') reasons.push('ग्राहकाचे नाव स्पष्ट नाही');
      if (!village) reasons.push('गाव नोंद नाही');
      if (!ct.cardNumber || ct.cardNumber <= 0) reasons.push('कार्ड नंबर अमान्य');

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
        amount: amt,
        amountLabel: 'जमा रक्कम',
        phone: String(phone || ''),
        village: String(village || ''),
        status: 'जमा',
        isDiscrepancy: reasons.length > 0,
        discrepancyReasons: reasons,
        rawItem: { ...ct, member },
      });
    });

    // B. Customer Khata / Bill Payment Receipts
    (paymentReceipts || []).forEach((pr) => {
      if (!pr) return;
      const amt = Number(pr.payingNow) || 0;
      const reasons: string[] = [];
      if (amt <= 0) reasons.push('पावती रक्कम ₹0');
      if (!pr.customerName || pr.customerName === 'ग्राहक' || pr.customerName.toLowerCase() === 'customer') reasons.push('ग्राहकाचे नाव स्पष्ट नाही');
      if (!pr.village) reasons.push('गाव नोंद नाही');

      list.push({
        id: `bill-rcpt-${pr.id || Math.random()}`,
        category: 'receipt',
        categoryLabel: 'उधारी जमा पावती (Khata Payment)',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
        title: String(pr.customerName || 'ग्राहक'),
        subtitle: String(pr.itemDetails || 'उधारी जमा पावती'),
        date: pr.date || '',
        referenceNo: pr.invoiceNo || '',
        amount: amt,
        amountLabel: 'जमा पावती रक्कम',
        phone: String(pr.customerPhone || ''),
        village: String(pr.village || ''),
        status: 'जमा',
        isDiscrepancy: reasons.length > 0,
        discrepancyReasons: reasons,
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
      const isQuotation = Boolean(sb.isQuotation);
      const modelNo = sb.modelNo || '';
      const serialNo = sb.serialNo || '';
      const quotationValidity = sb.quotationValidity || '';

      const reasons: string[] = [];
      if (totalAmt <= 0) reasons.push(isQuotation ? 'कोटेशन रक्कम ₹0' : 'बिल रक्कम ₹0');
      if (!sb.customerName || sb.customerName === 'ग्राहक' || sb.customerName.toLowerCase() === 'customer') reasons.push('ग्राहकाचे नाव स्पष्ट नाही');
      if (!sb.village) reasons.push('गाव नोंद नाही');

      const extraDetails = [
        modelNo ? `मॉडेल: ${modelNo}` : '',
        serialNo ? `SN: ${serialNo}` : '',
      ].filter(Boolean).join(' • ');

      list.push({
        id: `bill-${sb.id || Math.random()}`,
        category: 'bill',
        categoryLabel: isQuotation ? '📋 कोटेशन (Quotation)' : 'विक्री बिल (Sales Bill)',
        badgeColor: isQuotation
          ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-700'
          : 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800',
        title: `${sb.customerName || 'ग्राहक'} - ${prodName}`,
        subtitle: `${isQuotation ? 'कोटेशन #' : 'बिल #'}${sb.invoiceNo || '-'} • प्रॉडक्ट: ${prodName}${extraDetails ? ` • ${extraDetails}` : ''} • मोड: ${sb.paymentMode || 'Cash'}`,
        productName: prodName,
        modelNo,
        serialNo,
        isQuotation,
        quotationValidity,
        date: sb.date || '',
        referenceNo: sb.invoiceNo || '',
        amount: totalAmt,
        paidAmount: payingAmt,
        secondaryAmount: due,
        amountLabel: isQuotation ? 'कोटेशन अंदाज (Total)' : 'एकूण बिल (Total)',
        phone: String(sb.customerPhone || ''),
        village: String(sb.village || ''),
        status: isQuotation ? '📋 कोटेशन' : due > 0 ? `बाकी: ₹${due.toLocaleString()}` : 'पूर्ण पेड',
        isDiscrepancy: reasons.length > 0,
        discrepancyReasons: reasons,
        rawItem: sb,
      });
    });

    // D. Card Scheme Members (कार्ड सभासद)
    (cardMembers || []).forEach((cm) => {
      if (!cm) return;
      const custName = cm.customerName || (cm as any).name || `कार्ड #${cm.cardNumber ?? '-'}`;
      const totalDep = Number(cm.totalDeposited ?? (cm as any).totalPaid ?? 0);
      const netBal = Number(cm.netBalance ?? totalDep);

      const reasons: string[] = [];
      if (!cm.cardNumber || cm.cardNumber <= 0) reasons.push('कार्ड नंबर अमान्य');
      if (!cm.customerName || cm.customerName.toLowerCase() === 'customer') reasons.push('सभासदाचे नाव स्पष्ट नाही');
      if (!cm.village) reasons.push('गाव नोंद नाही');

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
        isDiscrepancy: reasons.length > 0,
        discrepancyReasons: reasons,
        rawItem: cm,
      });
    });

    // E. Customer Khata Ledger Accounts (ग्राहक खाती)
    (customers || []).forEach((cust) => {
      if (!cust) return;
      const totalPurch = Number(cust.totalPurchases ?? cust.totalPurchased ?? 0);
      const totalPaid = Number(cust.totalPaid ?? 0);
      const balDue = Number(cust.balanceDue !== undefined ? cust.balanceDue : Math.max(0, totalPurch - totalPaid));

      const reasons: string[] = [];
      if (!cust.phone) reasons.push('मोबाईल नंबर नोंद नाही');
      if (!cust.address && !cust.village) reasons.push('पत्ता/गाव नोंद नाही');

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
        isDiscrepancy: reasons.length > 0,
        discrepancyReasons: reasons,
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

      const reasons: string[] = [];
      if (tot <= 0) reasons.push('खरेदी रक्कम ₹0');
      if (!supName || supName === 'सप्लायर') reasons.push('सप्लायर नाव नाही');

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
        isDiscrepancy: reasons.length > 0,
        discrepancyReasons: reasons,
        rawItem: p,
      });
    });

    // G. Dealers (सप्लायर्स / डीलर्स)
    (dealers || []).forEach((dlr) => {
      if (!dlr) return;
      const totPurch = Number(dlr.totalPurchases) || 0;
      const totPaid = Number(dlr.totalPaid) || 0;
      const balDue = Number(dlr.balanceDue !== undefined ? dlr.balanceDue : Math.max(0, totPurch - totPaid));

      const reasons: string[] = [];
      if (!dlr.phone) reasons.push('मोबाईल नंबर नोंद नाही');

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
        isDiscrepancy: reasons.length > 0,
        discrepancyReasons: reasons,
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
      if (activeCategory === 'discrepancies' && !rec.isDiscrepancy) return false;
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

  // Reset pagination when search or category filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeCategory, selectedDate]);

  const totalPages = Math.ceil(filteredRecords.length / PAGE_SIZE) || 1;
  const paginatedRecords = useMemo(() => {
    if (showAll) return filteredRecords;
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredRecords.slice(start, start + PAGE_SIZE);
  }, [filteredRecords, showAll, currentPage]);

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

  const totalDiscrepanciesCount = useMemo(() => {
    return allRecords.filter((r) => r.isDiscrepancy).length;
  }, [allRecords]);

  // Duplicate detection for customers
  const duplicatePairs = useMemo(() => {
    return detectDuplicateCustomers(customers, dismissedPairIds);
  }, [customers, dismissedPairIds]);

  // Calculation errors detection (Bills math & Customer ledger balances)
  const calcErrors = useMemo(() => {
    const list: Array<{
      id: string;
      itemType: 'bill' | 'customer';
      title: string;
      reference: string;
      description: string;
      expectedText: string;
      actualText: string;
      rawItem: any;
    }> = [];

    // 1. Check bills math: totalAmount === payingNow + dueAmount
    salesBills.forEach((b) => {
      if (b.totalAmount > 0) {
        const expectedDue = Math.max(0, b.totalAmount - (b.payingNow || 0));
        if (Math.abs((b.dueAmount || 0) - expectedDue) > 0.5) {
          list.push({
            id: `calc-bill-${b.id}`,
            itemType: 'bill',
            title: b.customerName || 'विक्री बिल',
            reference: b.invoiceNo || 'बिल',
            description: `एकूण बिल ₹${b.totalAmount.toLocaleString()} ≠ भरणा ₹${(b.payingNow || 0).toLocaleString()} + बाकी ₹${(b.dueAmount || 0).toLocaleString()}`,
            expectedText: `योग्य बाकी: ₹${expectedDue.toLocaleString()}`,
            actualText: `नोंद केलेली बाकी: ₹${(b.dueAmount || 0).toLocaleString()}`,
            rawItem: b,
          });
        }
      }
    });

    // 2. Check customer khata balance math: balanceDue === totalPurchases - totalPaid
    customers.forEach((c) => {
      const purch = Number(c.totalPurchases ?? c.totalPurchased ?? 0);
      const paid = Number(c.totalPaid ?? 0);
      const expectedBal = Math.max(0, purch - paid);
      const storedBal = Number(c.balanceDue ?? 0);

      if (Math.abs(storedBal - expectedBal) > 0.5) {
        list.push({
          id: `calc-cust-${c.id}`,
          itemType: 'customer',
          title: c.name,
          reference: c.phone || c.village || 'ग्राहक खाते',
          description: `खाते बाकी बेरीज जुळत नाही: खरेदी ₹${purch.toLocaleString()} - जमा ₹${paid.toLocaleString()} = ₹${expectedBal.toLocaleString()}`,
          expectedText: `योग्य बाकी: ₹${expectedBal.toLocaleString()}`,
          actualText: `नोंद केलेली बाकी: ₹${storedBal.toLocaleString()}`,
          rawItem: c,
        });
      }
    });

    return list;
  }, [salesBills, customers]);

  // Missing / '0' phone numbers
  const missingPhones = useMemo(() => {
    return customers.filter((c) => {
      const p = (c.phone || '').trim();
      return !p || p === '0' || p === '0000000000' || p === '--' || p === 'null' || p === 'undefined';
    });
  }, [customers]);

  // Missing villages or addresses
  const missingVillages = useMemo(() => {
    return customers.filter((c) => !c.village && !c.address);
  }, [customers]);

  // Zero-purchases accounts
  const zeroPurchasesCustomers = useMemo(() => {
    return customers.filter((c) => Number(c.totalPurchases ?? c.totalPurchased ?? 0) === 0);
  }, [customers]);

  // Total audit discrepancies count
  const totalAuditIssues = useMemo(() => {
    return duplicatePairs.length + calcErrors.length + missingPhones.length + missingVillages.length;
  }, [duplicatePairs.length, calcErrors.length, missingPhones.length, missingVillages.length]);

  // Action: Merge single duplicate pair
  const handleMergeSinglePair = (pair: DuplicatePair) => {
    const primary = pair.custA;
    const duplicate = pair.custB;
    const bestName = primary.name.length >= duplicate.name.length ? primary.name : duplicate.name;
    const bestPhone = primary.phone && primary.phone !== '0' ? primary.phone : duplicate.phone || '';
    const bestVillage = primary.village || duplicate.village || primary.address || duplicate.address || '';

    if (onMergeCustomers) {
      onMergeCustomers(primary.id, duplicate.id, {
        name: bestName,
        phone: bestPhone,
        village: bestVillage,
        address: bestVillage,
      });
      setAuditFeedback({
        message: `✅ "${primary.name}" आणि "${duplicate.name}" ही खाती यशस्वीरित्या एकत्र (Merged) झाली! सर्व बिले व जमा अचूक जोडले गेले.`,
        type: 'success',
      });
    }
  };

  // Action: Batch merge all duplicate pairs
  const handleRunBatchMerge = () => {
    if (duplicatePairs.length === 0) {
      setAuditFeedback({ message: 'कोणतेही डुप्लिकेट खाते शिल्लक नाही.', type: 'info' });
      return;
    }

    const batch = duplicatePairs.map((p) => {
      const bestName = p.custA.name.length >= p.custB.name.length ? p.custA.name : p.custB.name;
      const bestPhone = p.custA.phone && p.custA.phone !== '0' ? p.custA.phone : p.custB.phone || '';
      const bestVillage = p.custA.village || p.custB.village || p.custA.address || p.custB.address || '';
      return {
        primaryId: p.custA.id,
        duplicateId: p.custB.id,
        mergedData: {
          name: bestName,
          phone: bestPhone,
          village: bestVillage,
          address: bestVillage,
        },
      };
    });

    if (onBatchMergeCustomers) {
      onBatchMergeCustomers(batch);
      setAuditFeedback({
        message: `⚡ उत्कृष्ट! सर्व ${batch.length} डुप्लिकेट खाती १-क्लिकमध्ये एकत्र (Merged) झाली आणि हिशोब अचूक झाला!`,
        type: 'success',
      });
    }
  };

  // Action: Auto-fix calculations
  const handleRunAutoFixCalculations = () => {
    if (onAutoFixCalculations) {
      const res = onAutoFixCalculations();
      setAuditFeedback({
        message: `🧮 हिशोब बेरीज दुरुस्ती पूर्ण! ${res.fixedBills} बिले आणि ${res.fixedCustomers} ग्राहक खात्यांची बेरीज व बाकी १००% अचूक झाली!`,
        type: 'success',
      });
    }
  };

  // Action: Auto-clean '0' phones
  const handleRunAutoCleanPhones = () => {
    if (onAutoCleanPhones) {
      const cleaned = onAutoCleanPhones();
      setAuditFeedback({
        message: `📱 ${cleaned} खात्यांमधील अमान्य '0' मोबाईल नंबर स्वच्छ (Clean) केले गेले.`,
        type: 'success',
      });
    }
  };

  // Action: Auto-fill missing addresses from bills
  const handleRunAutoFillAddresses = () => {
    if (onAutoFillAddresses) {
      const filled = onAutoFillAddresses();
      setAuditFeedback({
        message: `📍 ${filled} ग्राहकांचे पत्ते मागील जुन्या बिलांवरून व नोंदींवरून शोधून अचूक भरले गेले!`,
        type: 'success',
      });
    }
  };

  // Action: Full 1-click audit & fix
  const handleRunFullAutoAudit = () => {
    const msgParts: string[] = [];
    if (duplicatePairs.length > 0 && onBatchMergeCustomers) {
      const batch = duplicatePairs.map((p) => {
        const bestName = p.custA.name.length >= p.custB.name.length ? p.custA.name : p.custB.name;
        const bestPhone = p.custA.phone && p.custA.phone !== '0' ? p.custA.phone : p.custB.phone || '';
        const bestVillage = p.custA.village || p.custB.village || p.custA.address || p.custB.address || '';
        return {
          primaryId: p.custA.id,
          duplicateId: p.custB.id,
          mergedData: { name: bestName, phone: bestPhone, village: bestVillage, address: bestVillage },
        };
      });
      onBatchMergeCustomers(batch);
      msgParts.push(`${batch.length} डुप्लिकेट्स एकत्र केले`);
    }

    if (onAutoFixCalculations) {
      const res = onAutoFixCalculations();
      msgParts.push(`${res.fixedBills} बिले व ${res.fixedCustomers} खाती बेरीज दुरुस्त केली`);
    }

    if (onAutoFillAddresses) {
      const filled = onAutoFillAddresses();
      if (filled > 0) msgParts.push(`${filled} पत्ते भरले`);
    }

    if (onAutoCleanPhones) {
      const cleaned = onAutoCleanPhones();
      if (cleaned > 0) msgParts.push(`${cleaned} फोन स्वच्छ केले`);
    }

    setAuditFeedback({
      message: `🚀 संपूर्ण ऑटो-ऑडिट यशस्वी! ${msgParts.join(' • ')}`,
      type: 'success',
    });
  };

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
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 pb-20">
      {/* Top Banner & Header matching screenshot */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-5 sm:p-6 rounded-2xl sm:rounded-3xl text-white shadow-xl border border-slate-700/50">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">अपलोड झालेला सर्व डेटा (Uploaded Data)</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Universal Search
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
                CSV मधून इम्पोर्ट झालेले सर्व ग्राहक, कार्ड योजना मेंबर्स, विक्री बिले आणि जुन्या पावत्या एकाच जागी तपासा. येथे तुम्ही झिरो खरेदी दुरुस्त करू शकता आणि सारखी नावे एकत्र (Merge) करू शकता.
              </p>
            </div>
          </div>
        </div>

        {/* 5 Quick Action Buttons in Header matching user screenshot */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* 1. Mobile 0 Filter button */}
          <button
            type="button"
            onClick={() => {
              setActiveCategory('discrepancies');
              setAuditSubTab('phones');
            }}
            className="px-3.5 py-2 rounded-xl bg-purple-900/80 hover:bg-purple-800 text-purple-200 text-xs font-bold border border-purple-500/40 transition cursor-pointer flex items-center gap-1.5 shadow-xs"
            title="ज्या खात्यांमध्ये मोबाईल नंबर नाही किंवा 0 आहे ती खाती पाहा"
          >
            <Phone className="w-3.5 h-3.5 text-purple-300" />
            <span>मोबाईल &apos;0&apos; खाती वेगळी करा</span>
          </button>

          {/* 2. Zero purchases fix button */}
          <button
            type="button"
            onClick={() => {
              if (onClearZeroBills) {
                onClearZeroBills();
                setAuditFeedback({
                  message: '✨ ₹0 खरेदी असलेल्या बोगस नोंदी यशस्वीरित्या स्वच्छ करण्यात आल्या!',
                  type: 'success',
                });
              } else {
                setActiveCategory('discrepancies');
              }
            }}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-xs"
            title="झिरो खरेदी दुरुस्त करा"
          >
            <Sparkles className="w-3.5 h-3.5 text-slate-950" />
            <span>झिरो खरेदी दुरुस्त करा ({zeroPurchasesCustomers.length})</span>
          </button>

          {/* 3. Merge Duplicate Names Modal Button */}
          <button
            type="button"
            onClick={() => {
              setShowDuplicateMergeModal(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
            title="सारखी नावे एकत्र (Merge) करा"
          >
            <GitMerge className="w-3.5 h-3.5" />
            <span>नावे एकत्र / मर्ज करा (Merge)</span>
          </button>

          {/* 4. Export CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-600 transition cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Excel / CSV</span>
          </button>

          {/* 5. Clear / Reset Demo Data */}
          {onClearAllDemoData && (
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
              title="सर्व डेटा रिसेट करा"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>पूर्ण डेटा रिसेट</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Overview Cards matching screenshot */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* 1. Customers Khata KPI */}
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
              <span>एकूण ग्राहक नोंदणी</span>
            </span>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-2 font-mono-num">
            {customers.length}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
            खरेदी व उधारी खाती
          </div>
        </div>

        {/* 2. Customer Dues (Pending Market Khata) KPI */}
        <div
          onClick={() => setActiveCategory(activeCategory === 'customers' ? 'all' : 'customers')}
          className="p-4 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-700 shadow-2xs transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs font-bold text-rose-950 dark:text-rose-300">
            <span className="flex items-center gap-1.5">
              <ArrowDownLeft className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span>एकूण मार्केट उधारी</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-rose-100 text-rose-700">Pending</span>
          </div>
          <div className="text-xl font-black text-rose-600 dark:text-rose-400 mt-2 font-mono-num">
            ₹{totalCustomerDues.toLocaleString()}
          </div>
          <div className="text-[11px] text-rose-600/80 dark:text-rose-400/80 mt-0.5 truncate">
            ग्राहकांकडून येणे बाकी
          </div>
        </div>

        {/* 3. Card Members KPI */}
        <div
          onClick={() => setActiveCategory(activeCategory === 'cards' ? 'all' : 'cards')}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            activeCategory === 'cards'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-600 ring-2 ring-emerald-400/30'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-emerald-950 dark:text-emerald-300">
            <span className="flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>योजना कार्ड सभासद</span>
            </span>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-2 font-mono-num">
            {cardMembers.length}
          </div>
          <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5 truncate font-semibold">
            ₹{totalCardSavings.toLocaleString()} जमा बचत
          </div>
        </div>

        {/* 4. Sales Bills KPI */}
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
              <span>एकूण बिले व नोंदी</span>
            </span>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-2 font-mono-num">
            {salesBills.length}
          </div>
          <div className="text-[11px] text-blue-700 dark:text-blue-400 mt-0.5 truncate font-semibold">
            ₹{totalBillsSum.toLocaleString()} एकूण विक्री
          </div>
        </div>

        {/* 5. Receipts KPI */}
        <div
          onClick={() => setActiveCategory(activeCategory === 'receipts' ? 'all' : 'receipts')}
          className={`col-span-2 md:col-span-1 p-4 rounded-2xl border transition cursor-pointer ${
            activeCategory === 'receipts'
              ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-400 dark:border-purple-600 ring-2 ring-purple-400/30'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-purple-900 dark:text-purple-300">
            <span className="flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>जमा पावत्या (Receipts)</span>
            </span>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-2 font-mono-num">
            {totalReceiptsCount}
          </div>
          <div className="text-[11px] text-purple-700 dark:text-purple-400 mt-0.5 truncate font-semibold">
            ₹{totalReceiptsSum.toLocaleString()} जमा रक्कम
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
              value={searchQuery || ''}
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
                value={selectedDate || ''}
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

        {/* Discrepancy / Gadbad Alert Banner matching user request */}
        {totalAuditIssues > 0 && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-rose-50 border-2 border-amber-300/80 dark:from-amber-950/40 dark:to-rose-950/40 dark:border-amber-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-black text-amber-950 dark:text-amber-200">
                  ⚠️ इंपोर्ट केलेल्या डेटामध्ये <span className="underline decoration-rose-500 text-rose-700 dark:text-rose-400 font-extrabold">{totalAuditIssues} नोंदींमध्ये त्रुटी / हिशोब चूक</span> आढळली आहे!
                </p>
                <p className="text-[11px] sm:text-xs text-amber-900/80 dark:text-amber-300/80 mt-0.5">
                  (जसे की {duplicatePairs.length} डुप्लिकेट खाती, {calcErrors.length} हिशोब बेरीज चुका, {missingPhones.length} मोबाईल &apos;0&apos;, आणि {missingVillages.length} अपूर्ण पत्ते)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleRunFullAutoAudit}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>१-क्लिक सर्व ऑटो दुरुस्त करा</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveCategory(activeCategory === 'discrepancies' ? 'all' : 'discrepancies')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeCategory === 'discrepancies'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-700 hover:bg-rose-50'
                }`}
              >
                <Wand2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                <span>{activeCategory === 'discrepancies' ? 'सर्व नोंदी दाखवा' : 'दुरुस्ती केंद्र उघडा'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Category Pills Switcher */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-sm sm:text-xs">
          {[
            { id: 'all', label: 'सर्व रेकॉर्ड्स', count: allRecords.length, icon: Layers },
            { id: 'customers', label: '👥 सर्व ग्राहक व उधारी', count: customers.length, icon: Users },
            { id: 'discrepancies', label: '⚠️ चुका असलेला डेटा', count: totalAuditIssues, icon: AlertTriangle, isWarning: totalAuditIssues > 0 },
            { id: 'bills', label: '🧾 विक्री बिले', count: salesBills.length, icon: FileText },
            { id: 'receipts', label: '✓ जमा पावत्या', count: totalReceiptsCount, icon: Receipt },
            { id: 'cards', label: '💳 कार्ड सभासद', count: cardMembers.length, icon: CreditCard },
            { id: 'purchases', label: '🛒 डीलर खरेदी', count: purchases.length, icon: ShoppingCart },
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
                    ? cat.id === 'discrepancies'
                      ? 'bg-rose-600 text-white shadow-xs ring-2 ring-rose-300 dark:ring-rose-900'
                      : 'bg-slate-900 dark:bg-indigo-600 text-white shadow-xs'
                    : (cat as any).isWarning
                    ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-700 hover:bg-rose-200'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-xs sm:text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : (cat as any).isWarning
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
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

      {/* ========================================================= */}
      {/* ⚠️ डेटा ऑडिट व दुरुस्ती केंद्र (Data Quality & Audit Hub) */}
      {/* ========================================================= */}
      {activeCategory === 'discrepancies' && (
        <div className="space-y-4">
          {/* Audit Hub Header */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="p-3 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                      ⚠️ डेटा ऑडिट व दुरुस्ती केंद्र (Data Quality & Audit Hub)
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                      चुका असलेला डेटा दुरुस्त करा
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
                    येथे हिशोब बेरीज चुकीची बिले, मोबाईल नंबर नसलेली खाती आणि अपूर्ण पत्ते सहजपणे ओळखून थेट दुरुस्त करा.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleRunAutoCleanPhones}
                  className="px-4 py-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>📱 मोबाईल &apos;0&apos; खाती स्वच्छ करा</span>
                </button>
              </div>
            </div>

            {/* Audit Hub 5 Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-5">
              <div
                onClick={() => setAuditSubTab('all')}
                className={`p-3.5 rounded-2xl border transition cursor-pointer ${
                  auditSubTab === 'all'
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-400 dark:border-rose-600 ring-2 ring-rose-400/20'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">एकूण चुका (Issues)</div>
                <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1 font-mono-num">
                  {totalAuditIssues}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">सर्व त्रुटी एकत्र</div>
              </div>

              <div
                onClick={() => setAuditSubTab('calculations')}
                className={`p-3.5 rounded-2xl border transition cursor-pointer ${
                  auditSubTab === 'calculations'
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-400 dark:border-blue-600 ring-2 ring-blue-400/20'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">हिशोब बेरीज चूक</div>
                <div className={`text-2xl font-black mt-1 font-mono-num ${calcErrors.length > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {calcErrors.length}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">बिल व खाते गणित</div>
              </div>

              <div
                onClick={() => setAuditSubTab('phones')}
                className={`p-3.5 rounded-2xl border transition cursor-pointer ${
                  auditSubTab === 'phones'
                    ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-400 dark:border-purple-600 ring-2 ring-purple-400/20'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">मोबाईल नाही किंवा 0</div>
                <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1 font-mono-num">
                  {missingPhones.length}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">फोन नंबर रिकामा</div>
              </div>

              <div
                onClick={() => setAuditSubTab('villages')}
                className={`p-3.5 rounded-2xl border transition cursor-pointer ${
                  auditSubTab === 'villages'
                    ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-400 dark:border-sky-600 ring-2 ring-sky-400/20'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">गाव किंवा पत्ता नाही</div>
                <div className="text-2xl font-black text-sky-600 dark:text-sky-400 mt-1 font-mono-num">
                  {missingVillages.length}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">पत्ता रिकामा</div>
              </div>

              <div
                onClick={() => setAuditSubTab('duplicates')}
                className={`p-3.5 rounded-2xl border transition cursor-pointer ${
                  auditSubTab === 'duplicates'
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 dark:border-amber-600 ring-2 ring-amber-400/20'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">डुप्लिकेट खाती</div>
                <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 font-mono-num">
                  {duplicatePairs.length}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">एकाच नावाची खाती</div>
              </div>
            </div>

            {/* Automatic Options Toolbar (स्वयंचलित पर्याय) */}
            <div className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white border border-indigo-700/50 shadow-md">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                    <h3 className="font-bold text-sm text-white">
                      ⚡ ऑटोमॅटिक दुरुस्ती ऑप्शन्स (1-Click Automatic Fix & Merge)
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Tally-Grade Integrity
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    सर्व अचूक डुप्लिकेट्स एकत्र करा, हिशोब बेरीज आपोआप सुधारा आणि अपूर्ण पत्ते १-क्लिकमध्ये भरून घ्या.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {duplicatePairs.length > 0 && (
                    <button
                      type="button"
                      onClick={handleRunBatchMerge}
                      className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <GitMerge className="w-3.5 h-3.5" />
                      <span>सर्व डुप्लिकेट्स ऑटो-मर्ज ({duplicatePairs.length})</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleRunAutoFixCalculations}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>हिशोब बेरीज ऑटो-दुरुस्त करा</span>
                  </button>

                  {missingPhones.length > 0 && (
                    <button
                      type="button"
                      onClick={handleRunAutoCleanPhones}
                      className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>मोबाईल 0 खाती स्वच्छ ({missingPhones.length})</span>
                    </button>
                  )}

                  {missingVillages.length > 0 && (
                    <button
                      type="button"
                      onClick={handleRunAutoFillAddresses}
                      className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>पत्ते ऑटो-भरा ({missingVillages.length})</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleRunFullAutoAudit}
                    className="px-4 py-2 rounded-xl bg-white text-indigo-950 hover:bg-slate-100 font-black text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>🚀 सर्व चुका १-क्लिकमध्ये आपोआप दुरुस्त करा</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Realtime Feedback Notification Toast */}
            {auditFeedback && (
              <div
                className={`mt-4 p-3.5 rounded-2xl border flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 ${
                  auditFeedback.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                    : auditFeedback.type === 'error'
                    ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                    : 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200'
                }`}
              >
                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold">
                  {auditFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  )}
                  <span>{auditFeedback.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAuditFeedback(null)}
                  className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-slate-500 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Audit Sub-category Filters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <span className="text-slate-400 font-bold mr-1">तपासा:</span>
              {[
                { id: 'all', label: 'सर्व चुका', count: totalAuditIssues },
                { id: 'duplicates', label: '🔀 डुप्लिकेट खाती', count: duplicatePairs.length },
                { id: 'calculations', label: '🧮 हिशोब बेरीज चूक', count: calcErrors.length },
                { id: 'phones', label: '📱 मोबाईल नाही / 0', count: missingPhones.length },
                { id: 'villages', label: '📍 गाव / पत्ता नाही', count: missingVillages.length },
              ].map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setAuditSubTab(sub.id as any)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    auditSubTab === sub.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <span>{sub.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${auditSubTab === sub.id ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>
                    {sub.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Module 1: Duplicate Accounts Section (एकाच व्यक्तीची २ खाती आढळली - Duplicate Accounts) */}
          {(auditSubTab === 'all' || auditSubTab === 'duplicates') && (
            <div className="bg-amber-50/50 dark:bg-amber-950/20 border-2 border-amber-300 dark:border-amber-700/60 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400">
                    <GitMerge className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-amber-950 dark:text-amber-200">
                        एकाच व्यक्तीची २ खाती आढळली (Duplicate Accounts - Accounting Error)
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white">
                        तातडीने विलीन करा
                      </span>
                    </div>
                    <p className="text-xs text-amber-800 dark:text-amber-300/80 mt-0.5">
                      खालील व्यक्तींचे नाव किंवा तपशील एकाच व्यक्तीचा असून दोन वेगळी खाती तयार झाली आहेत. दोन्ही खाती एकत्र (Merge) केल्यास सर्व बिले, पावत्या व बाकी अचूक होईल.
                    </p>
                  </div>
                </div>

                {duplicatePairs.length > 0 && (
                  <button
                    type="button"
                    onClick={handleRunBatchMerge}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>⚡ सर्व {duplicatePairs.length} डुप्लिकेट खाती आपोआप एकत्र करा</span>
                  </button>
                )}
              </div>

              {duplicatePairs.length === 0 ? (
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/60 text-center text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>अभिनंदन! सिस्टीममध्ये कोणतेही डुप्लिकेट खाते शिल्लक नाही. सर्व खाती अचूक आहेत!</span>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-xs font-bold text-amber-900 dark:text-amber-300">
                    एकूण {duplicatePairs.length} संभाव्य डुप्लिकेट खाती सापडली:
                  </div>

                  {duplicatePairs.map((pair) => {
                    const cA = pair.custA;
                    const cB = pair.custB;
                    const purchA = Number(cA.totalPurchased || (cA as any).totalPurchases || 0);
                    const paidA = Number(cA.totalPaid || 0);
                    const purchB = Number(cB.totalPurchased || (cB as any).totalPurchases || 0);
                    const paidB = Number(cB.totalPaid || 0);
                    const combPurch = purchA + purchB;
                    const combPaid = paidA + paidB;
                    const combBal = Math.max(0, combPurch - combPaid);

                    return (
                      <div
                        key={pair.id}
                        className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/80 rounded-2xl p-4 shadow-xs space-y-3 hover:border-amber-400 transition"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                          {/* Account chips comparison */}
                          <div className="flex-1 space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                              <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700">
                                खाते १: <span className="font-black text-indigo-600 dark:text-indigo-400">{cA.name}</span>{' '}
                                <span className="text-slate-500 font-normal">
                                  [{cA.phone && cA.phone !== '0' ? cA.phone : 'मोबाईल नाही'} / {cA.village || 'पत्ता नाही'}]
                                </span>{' '}
                                <span className="font-mono-num text-rose-600 dark:text-rose-400">(बाकी: ₹{(cA.balanceDue || 0).toLocaleString()})</span>
                              </span>

                              <span className="text-amber-600 font-black">आणि</span>

                              <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700">
                                खाते २: <span className="font-black text-indigo-600 dark:text-indigo-400">{cB.name}</span>{' '}
                                <span className="text-slate-500 font-normal">
                                  [{cB.phone && cB.phone !== '0' ? cB.phone : 'मोबाईल नाही'} / {cB.village || 'पत्ता नाही'}]
                                </span>{' '}
                                <span className="font-mono-num text-rose-600 dark:text-rose-400">(बाकी: ₹{(cB.balanceDue || 0).toLocaleString()})</span>
                              </span>
                            </div>

                            {/* Combined Hisab Preview */}
                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 bg-amber-50/60 dark:bg-amber-950/30 px-3 py-1.5 rounded-xl border border-amber-200/50 dark:border-amber-800/40">
                              <span className="text-amber-900 dark:text-amber-300 font-bold">एकत्रित होणारा हिशोब:</span>
                              <span>खरेदी: <strong className="text-slate-900 dark:text-white">₹{combPurch.toLocaleString()}</strong></span>
                              <span>|</span>
                              <span>जमा: <strong className="text-emerald-600 dark:text-emerald-400">₹{combPaid.toLocaleString()}</strong></span>
                              <span>|</span>
                              <span>शिल्लक बाकी: <strong className="text-rose-600 dark:text-rose-400">₹{combBal.toLocaleString()}</strong></span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleMergeSinglePair(pair)}
                              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                            >
                              <GitMerge className="w-3.5 h-3.5" />
                              <span>हे दोन खाती एकत्र / Merge करा</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedDuplicatePairId(pair.id);
                                setShowDuplicateMergeModal(true);
                              }}
                              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs transition cursor-pointer"
                              title="तपशीलवार मर्ज करा"
                            >
                              तपशील
                            </button>
                            <button
                              type="button"
                              onClick={() => setDismissedPairIds((prev) => new Set([...prev, pair.id]))}
                              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                              title="हे खाते डुप्लिकेट नाही, दुर्लक्ष करा"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Module 2: Calculation Errors Section (हिशोब बेरीज चूक - Calculation Errors) */}
          {(auditSubTab === 'all' || auditSubTab === 'calculations') && (
            <div className="bg-blue-50/50 dark:bg-blue-950/20 border-2 border-blue-300 dark:border-blue-700/60 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-500/20 text-blue-700 dark:text-blue-400">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-blue-950 dark:text-blue-200">
                      हिशोब बेरीज व शिल्लक बाकी चूक (Calculation & Math Discrepancies)
                    </h3>
                    <p className="text-xs text-blue-800 dark:text-blue-300/80 mt-0.5">
                      बिलाची एकूण रक्कम आणि भरणा व बाकी यातील फरक किंवा खाते उधारी बेरीज जुळत नसल्यास त्वरित दुरुस्त करा.
                    </p>
                  </div>
                </div>

                {calcErrors.length > 0 && (
                  <button
                    type="button"
                    onClick={handleRunAutoFixCalculations}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>🧮 सर्व {calcErrors.length} हिशोब बेरीज आपोआप दुरुस्त करा</span>
                  </button>
                )}
              </div>

              {calcErrors.length === 0 ? (
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/60 text-center text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>सर्व बिलांची व ग्राहक खात्यांची हिशोब बेरीज १००% अचूक आहे! कोणतीही गणिती चूक नाही.</span>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {calcErrors.map((err) => (
                    <div
                      key={err.id}
                      className="bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800/80 rounded-2xl p-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">{err.title}</span>
                          <span className="text-[11px] px-2 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono-num">
                            {err.reference}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-bold uppercase bg-amber-100 text-amber-800">
                            {err.itemType === 'bill' ? 'बिल चूक' : 'खाते चूक'}
                          </span>
                        </div>
                        <div className="text-slate-600 dark:text-slate-400">{err.description}</div>
                        <div className="flex items-center gap-3 text-[11px]">
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">{err.expectedText}</span>
                          <span className="text-rose-600 dark:text-rose-400 font-medium">({err.actualText})</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleRunAutoFixCalculations}
                        className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition cursor-pointer shrink-0 flex items-center gap-1.5"
                      >
                        <Wand2 className="w-3.5 h-3.5" />
                        <span>दुरुस्त करा</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Module 3: Missing Phones List */}
          {(auditSubTab === 'all' || auditSubTab === 'phones') && missingPhones.length > 0 && (
            <div className="bg-purple-50/50 dark:bg-purple-950/20 border-2 border-purple-300 dark:border-purple-700/60 rounded-3xl p-5 sm:p-6 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-purple-950 dark:text-purple-200">
                    📱 मोबाईल नंबर नसलेली किंवा &apos;0&apos; असलेली खाती ({missingPhones.length})
                  </h3>
                  <p className="text-xs text-purple-800 dark:text-purple-300/80 mt-0.5">
                    या खात्यांमध्ये मोबाईल नंबर नाही किंवा जुन्या फाईलमधून &apos;0&apos; आलेला आहे.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRunAutoCleanPhones}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>सर्व &apos;0&apos; स्वच्छ करा</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto pr-1">
                {missingPhones.slice(0, 30).map((c) => (
                  <div key={c.id} className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800/60 text-xs flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{c.name}</span>
                    <span className="text-[11px] text-purple-600 font-mono-num shrink-0">{c.village || 'गाव नाही'}</span>
                  </div>
                ))}
              </div>
              {missingPhones.length > 30 && (
                <div className="text-[11px] text-purple-700 dark:text-purple-400 font-semibold text-center">
                  + आणखी {missingPhones.length - 30} खाती समाविष्ट आहेत
                </div>
              )}
            </div>
          )}

          {/* Module 4: Missing Villages List */}
          {(auditSubTab === 'all' || auditSubTab === 'villages') && missingVillages.length > 0 && (
            <div className="bg-sky-50/50 dark:bg-sky-950/20 border-2 border-sky-300 dark:border-sky-700/60 rounded-3xl p-5 sm:p-6 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-sky-950 dark:text-sky-200">
                    📍 गाव किंवा पत्ता नोंद नसलेली खाती ({missingVillages.length})
                  </h3>
                  <p className="text-xs text-sky-800 dark:text-sky-300/80 mt-0.5">
                    या खात्यांमध्ये गाव किंवा पत्ता नोंद नाही. जुन्या बिलांवरून व पावत्यांवरून पत्ता आपोआप भरता येतो.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRunAutoFillAddresses}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>बिलांवरून पत्ते ऑटो-भरा</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto pr-1">
                {missingVillages.slice(0, 30).map((c) => (
                  <div key={c.id} className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-800/60 text-xs flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{c.name}</span>
                    <span className="text-[11px] text-sky-600 font-mono-num shrink-0">{c.phone || 'फोन नाही'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

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
                {paginatedRecords.map((item, idx) => (
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
                        <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
                          <span className="inline-flex items-center text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                            📦 {item.productName}
                          </span>
                          {item.modelNo && (
                            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              Mod: {item.modelNo}
                            </span>
                          )}
                          {item.serialNo && (
                            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                              SN: {item.serialNo}
                            </span>
                          )}
                        </div>
                      )}
                      {item.subtitle && (
                        <div className="text-sm sm:text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {item.subtitle}
                        </div>
                      )}
                      {item.isDiscrepancy && item.discrepancyReasons && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.discrepancyReasons.map((r, ri) => (
                            <span key={ri} className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-0.5">
                              ⚠️ {r}
                            </span>
                          ))}
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
                            <span className="text-[10px] sm:text-[9px] font-bold text-slate-400">
                              {item.isQuotation ? 'अंदाज:' : 'एकूण:'}
                            </span>
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
                          className={`px-3 py-1.5 rounded-xl text-white text-sm sm:text-xs font-bold transition inline-flex items-center gap-1 cursor-pointer ${
                            item.isQuotation
                              ? 'bg-amber-600 hover:bg-amber-700 text-white'
                              : 'bg-slate-900 dark:bg-indigo-600 hover:bg-indigo-600 dark:hover:bg-indigo-500'
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{item.category === 'bill' ? (item.isQuotation ? 'कोटेशन' : 'बिल') : 'पावती'}</span>
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
          {paginatedRecords.map((item, idx) => (
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

                  {item.modelNo && (
                    <span className="text-xs sm:text-[11px] font-mono font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 sm:px-2 py-1 sm:py-0.5 rounded border border-slate-200 dark:border-slate-700">
                      Mod: {item.modelNo}
                    </span>
                  )}

                  {item.serialNo && (
                    <span className="text-xs sm:text-[11px] font-mono font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2.5 sm:px-2 py-1 sm:py-0.5 rounded border border-amber-200 dark:border-amber-800">
                      SN: {item.serialNo}
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

                {item.isDiscrepancy && item.discrepancyReasons && (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {item.discrepancyReasons.map((r, ri) => (
                      <span key={ri} className="px-2 py-0.5 rounded-md text-xs sm:text-[11px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-1">
                        ⚠️ {r}
                      </span>
                    ))}
                  </div>
                )}

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
                      className={`px-3.5 sm:px-3 py-2.5 sm:py-2 rounded-xl text-white text-sm sm:text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs ${
                        item.isQuotation
                          ? 'bg-amber-600 hover:bg-amber-700 text-white'
                          : 'bg-slate-900 dark:bg-indigo-600 hover:bg-indigo-600 dark:hover:bg-indigo-500'
                      }`}
                    >
                      <Eye className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                      <span>{item.category === 'bill' ? (item.isQuotation ? 'कोटेशन पाहा' : 'बिल पाहा') : 'पावती पाहा'}</span>
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

      {/* Pagination Controls */}
      {filteredRecords.length > PAGE_SIZE && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            पान <strong className="text-slate-900 dark:text-white font-bold">{currentPage}</strong> पैकी{' '}
            <strong className="text-slate-900 dark:text-white font-bold">{totalPages}</strong> ({filteredRecords.length} रेकॉर्ड्स)
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAll(!showAll)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 transition cursor-pointer"
            >
              {showAll ? 'पाने दाखवा (50 प्रति पान)' : 'सर्व एकदम पहा'}
            </button>

            {!showAll && (
              <>
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-750 transition cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>मागे</span>
                </button>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-750 transition cursor-pointer flex items-center gap-1"
                >
                  <span>पुढे</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
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
          onOpenFullEditor={onEditBillInFullEditor}
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

      {/* Duplicate Customer Merge Modal */}
      {showDuplicateMergeModal && (
        <DuplicateCustomerMergeModal
          isOpen={showDuplicateMergeModal}
          onClose={() => {
            setShowDuplicateMergeModal(false);
            setSelectedDuplicatePairId(undefined);
          }}
          duplicatePairs={duplicatePairs}
          customers={customers}
          transactions={transactions}
          cardMembers={cardMembers}
          initialSelectedPairId={selectedDuplicatePairId}
          onDismissPair={(pairId) => {
            setDismissedPairIds((prev) => new Set([...prev, pairId]));
          }}
          onMerge={(primaryId, duplicateId, mergedData) => {
            if (onMergeCustomers) {
              onMergeCustomers(primaryId, duplicateId, mergedData);
              setAuditFeedback({
                message: `✨ ${mergedData.name} यांचे दोन खाती यशस्वीरित्या १ खात्यात विलीन (Merge) करण्यात आली!`,
                type: 'success',
              });
            }
          }}
        />
      )}

      {/* Reset All Data Confirmation Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">सर्व डेटा रिसेट करा?</h3>
                <p className="text-xs text-rose-600 font-semibold">ही कृती पूर्ववत करता येणार नाही</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              आपण सर्व इंपोर्ट केलेला आणि तयार केलेला डेटा (ग्राहक, बिले, पावत्या, कार्ड्स) पूर्णपणे पुसून सिस्टीम नवीन करू इच्छिता का?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                रद्द करा
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowResetConfirm(false);
                  if (onClearAllDemoData) {
                    onClearAllDemoData();
                  }
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-sm cursor-pointer"
              >
                होय, पूर्ण रिसेट करा
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
