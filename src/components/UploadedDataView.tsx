import React, { useState, useMemo } from 'react';
import {
  Database,
  Search,
  Users,
  CreditCard,
  Receipt,
  ShoppingCart,
  Download,
  Merge,
  Sparkles,
  RefreshCw,
  Phone,
  MapPin,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  X,
  FileSpreadsheet,
  ArrowRight,
  Filter,
  IndianRupee,
  Share2,
  Trash2,
  UserCheck,
  UploadCloud,
  AlertCircle,
  Pencil,
  Zap
} from 'lucide-react';
import {
  Customer,
  CardMember,
  TransactionEntry,
  PurchaseEntry,
  Dealer,
  BusinessSettings,
  CardTransaction,
  ActiveTab
} from '../types';
import { CustomerLedgerModal } from './CustomerLedgerModal';
import { EditTransactionModal } from './EditTransactionModal';
import { EditCustomerModal } from './EditCustomerModal';
import { DataIssuesAuditView } from './DataIssuesAuditView';

interface UploadedDataViewProps {
  customers: Customer[];
  cardMembers: CardMember[];
  transactions: TransactionEntry[];
  purchases: PurchaseEntry[];
  dealers: Dealer[];
  cardTransactions: CardTransaction[];
  settings: BusinessSettings;
  onUpdateCustomers: (updated: Customer[]) => void;
  onRecheckLedgers: () => void;
  onNavigateTab: (tab: ActiveTab) => void;
  onSettlePayment?: (customerId: string, amount: number, mode: 'Cash' | 'Online', notes: string) => void;
  onResetData?: (mode: 'all' | 'zero-bills') => void;
  onUpdateTransaction?: (updatedTx: TransactionEntry) => void;
  onDeleteTransaction?: (txId: string) => void;
  onUpdateSingleCustomer?: (updatedCust: Customer) => void;
  onBatchUpdateTransactions?: (updatedTxs: TransactionEntry[]) => void;
  onMergeCustomers?: (primaryId: string, secondaryId: string, overrides?: any) => void;
  mergedRecords?: any[];
}

export const UploadedDataView: React.FC<UploadedDataViewProps> = ({
  customers,
  cardMembers,
  transactions,
  purchases,
  dealers,
  cardTransactions,
  settings,
  onUpdateCustomers,
  onRecheckLedgers,
  onNavigateTab,
  onSettlePayment,
  onResetData,
  onUpdateTransaction,
  onDeleteTransaction,
  onUpdateSingleCustomer,
  onBatchUpdateTransactions,
  onMergeCustomers,
  mergedRecords,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'customers' | 'errors' | 'cards' | 'bills' | 'receipts' | 'purchases'>('customers');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'due' | 'cleared'>('all');
  const [selectedVillage, setSelectedVillage] = useState<string>('all');
  const [selectedLedgerCustomer, setSelectedLedgerCustomer] = useState<Customer | null>(null);

  // Edit Modals State
  const [editingTransaction, setEditingTransaction] = useState<TransactionEntry | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Merge Duplicate Customers Modal State
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [mergeSearch, setMergeSearch] = useState('');
  const [primaryCustId, setPrimaryCustId] = useState<string>('');
  const [secondaryCustId, setSecondaryCustId] = useState<string>('');
  const [mergeSuccessMsg, setMergeSuccessMsg] = useState<string | null>(null);

  // Issue count for badge
  const issueCount = useMemo(() => {
    let count = 0;
    transactions.forEach((t) => {
      const total = Number(t.totalAmount) || 0;
      const paid = Number(t.payingNow) || 0;
      const due = Number(t.dueAmount) || 0;
      const cleanPhone = (t.customerPhone || '').replace(/\D/g, '');
      const isZero = total === 0 && paid === 0 && due === 0;
      if (!isZero && Math.abs(total - (paid + due)) > 1) count++;
      else if (!isZero && (cleanPhone.length < 10 || cleanPhone === '0')) count++;
      else if (!isZero && (!t.village || !t.village.trim() || t.village === '-')) count++;
      else if (!isZero && (!t.customerName || t.customerName.startsWith('ग्राहक #') || t.customerName === '0')) count++;
    });
    return count;
  }, [transactions]);

  // Quick stats calculation
  const totalMarketUdhar = useMemo(() => {
    return customers.reduce((acc, c) => acc + (c.balanceDue || 0), 0);
  }, [customers]);

  const zeroPurchasedCount = useMemo(() => {
    return customers.filter(
      (c) => (c.totalPurchased === 0 || !c.totalPurchased) && ((c.totalPaid || 0) > 0 || (c.balanceDue || 0) > 0)
    ).length;
  }, [customers]);

  // Auto-Fix All Math discrepancies across all transactions
  const handleFixAllMath = () => {
    const fixed: TransactionEntry[] = [];
    transactions.forEach((t) => {
      const total = Number(t.totalAmount) || 0;
      const paid = Number(t.payingNow) || 0;
      const due = Number(t.dueAmount) || 0;
      if (Math.abs(total - (paid + due)) > 1) {
        fixed.push({
          ...t,
          dueAmount: Math.max(0, total - paid),
        });
      }
    });

    if (fixed.length === 0) {
      alert('हिशोब बेरीज चुकीचे कोणतेही बिल नाही!');
      return;
    }

    if (onBatchUpdateTransactions) {
      onBatchUpdateTransactions(fixed);
    } else if (onUpdateTransaction) {
      fixed.forEach((tx) => onUpdateTransaction(tx));
    }
    alert(`यशस्वीरित्या ${fixed.length} बिलांची हिशोब बेरीज (उधारी बाकी = एकूण बिल - भरणा) आपोआप जुळवण्यात आली आहे!`);
  };

  const handleFixSingleMath = (tx: TransactionEntry) => {
    const total = Number(tx.totalAmount) || 0;
    const paid = Number(tx.payingNow) || 0;
    const updated: TransactionEntry = {
      ...tx,
      dueAmount: Math.max(0, total - paid),
    };
    if (onUpdateTransaction) {
      onUpdateTransaction(updated);
      alert(`बिल #${tx.invoiceNo || ''} चा हिशोब जुळवला! बाकी: ₹${Math.max(0, total - paid).toLocaleString()}`);
    }
  };

  // Unique villages for filter
  const uniqueVillages = useMemo(() => {
    const vSet = new Set<string>();
    customers.forEach((c) => {
      if (c.village) vSet.add(c.village.trim());
      else if (c.address) {
        const parts = c.address.split(',').map((p) => p.trim());
        parts.forEach((p) => {
          if (p.length > 2 && !p.toLowerCase().includes('shop') && !p.toLowerCase().includes('wardha')) {
            vSet.add(p);
          }
        });
      }
    });
    return Array.from(vSet).sort().slice(0, 30);
  }, [customers]);

  // 1. Filtered customers
  const filteredCustomers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return customers.filter((c) => {
      const matchSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q)) ||
        (c.village && c.village.toLowerCase().includes(q));

      let matchStatus = true;
      if (statusFilter === 'due') matchStatus = (c.balanceDue || 0) > 0;
      if (statusFilter === 'cleared') matchStatus = (c.balanceDue || 0) <= 0;

      let matchVillage = true;
      if (selectedVillage !== 'all') {
        matchVillage =
          (c.village && c.village.toLowerCase() === selectedVillage.toLowerCase()) ||
          (c.address && c.address.toLowerCase().includes(selectedVillage.toLowerCase()));
      }

      return matchSearch && matchStatus && matchVillage;
    });
  }, [customers, searchQuery, statusFilter, selectedVillage]);

  // 2. Filtered card members
  const filteredCardMembers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return cardMembers.filter((m) => {
      if (!q) return true;
      return (
        m.customerName.toLowerCase().includes(q) ||
        m.cardNumber.toString().includes(q) ||
        (m.phone && m.phone.includes(q)) ||
        (m.village && m.village.toLowerCase().includes(q))
      );
    });
  }, [cardMembers, searchQuery]);

  // 3. Filtered transactions / bills
  const filteredTransactions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return transactions.filter((t) => {
      if (!q) return true;
      return (
        t.customerName.toLowerCase().includes(q) ||
        (t.invoiceNo && t.invoiceNo.toLowerCase().includes(q)) ||
        (t.customerPhone && t.customerPhone.includes(q)) ||
        (t.itemDetails && t.itemDetails.toLowerCase().includes(q))
      );
    });
  }, [transactions, searchQuery]);

  // 4. Filtered card scheme & payment receipts
  const filteredReceipts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return (cardTransactions || []).filter((r: any) => {
      if (!q) return true;
      return (
        (r.customerName && r.customerName.toLowerCase().includes(q)) ||
        (r.memberName && r.memberName.toLowerCase().includes(q)) ||
        (r.receiptNo && r.receiptNo.toLowerCase().includes(q)) ||
        (r.cardNumber && r.cardNumber.toString().includes(q)) ||
        (r.invoiceNo && r.invoiceNo.toLowerCase().includes(q)) ||
        (r.remarks && r.remarks.toLowerCase().includes(q))
      );
    });
  }, [cardTransactions, searchQuery]);

  // Auto-Fix Zero Purchases across all customers
  const handleFixZeroPurchases = () => {
    let fixedCount = 0;
    const updated = customers.map((c) => {
      const paid = Number(c.totalPaid || 0);
      const due = Number(c.balanceDue || 0);
      const currentPurchased = Number(c.totalPurchased || 0);

      if (currentPurchased === 0 && (paid > 0 || due > 0)) {
        fixedCount++;
        return {
          ...c,
          totalPurchased: paid + due,
        };
      }
      if (currentPurchased < paid + due) {
        fixedCount++;
        return {
          ...c,
          totalPurchased: paid + due,
        };
      }
      return c;
    });

    if (fixedCount > 0) {
      onUpdateCustomers(updated);
      alert(`सफलतापूर्वक ${fixedCount} ग्राहकांची 'एकूण खरेदी' (Total Purchased = भरणा + बाकी) दुरुस्त करण्यात आली आहे!`);
    } else {
      alert('सर्व ग्राहकांची खरेदी रक्कम आधीच व्यवस्थित जुळवलेली आहे.');
    }
  };

  // Reconstruct Customers from 1,079 receipts if customers are 0
  const handleReconstructCustomersFromReceipts = () => {
    if (!cardTransactions || cardTransactions.length === 0) {
      alert('कोणत्याही जमा पावत्या उपलब्ध नाहीत.');
      return;
    }

    const custMap = new Map<string, {
      name: string;
      phone: string;
      village: string;
      totalPaid: number;
    }>();

    cardTransactions.forEach((r: any) => {
      const name = (r.customerName || r.memberName || '').trim();
      if (!name) return;
      const cleanPhone = (r.phone || r.customerPhone || '').replace(/\D/g, '');
      const validPhone = cleanPhone.length >= 10 && !/^(\d)\1{9,}$/.test(cleanPhone) ? cleanPhone : '';
      const key = validPhone ? `p_${validPhone}` : `n_${name.toLowerCase()}`;

      const existing = custMap.get(key) || {
        name,
        phone: validPhone,
        village: r.village || r.customerVillage || '',
        totalPaid: 0,
      };

      existing.totalPaid += Number(r.amount || 0);
      if (!existing.village && (r.village || r.customerVillage)) {
        existing.village = r.village || r.customerVillage;
      }
      if (!existing.phone && validPhone) {
        existing.phone = validPhone;
      }
      custMap.set(key, existing);
    });

    const newCustomersList: Customer[] = Array.from(custMap.values()).map((c, idx) => ({
      id: `cust-rcpt-${Date.now()}-${idx}`,
      name: c.name,
      phone: c.phone,
      village: c.village,
      address: '',
      totalPurchased: c.totalPaid,
      totalPaid: c.totalPaid,
      balanceDue: 0,
      createdAt: new Date().toISOString(),
    }));

    onUpdateCustomers(newCustomersList);
    alert(`यशस्वी! ${newCustomersList.length} ग्राहकांची खाती १,०७९ पावत्यांमधून 'ग्राहक खातेवही' मध्ये तात्काळ तयार झाली आहेत!`);
  };

  // Find Duplicate candidates
  const duplicateCandidates = useMemo(() => {
    if (!mergeSearch.trim()) {
      // Suggest top common names that have multiple entries
      const nameGroups = new Map<string, Customer[]>();
      customers.forEach((c) => {
        // Clean basic name
        const cleanName = c.name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '')
          .slice(0, 8);
        if (!cleanName) return;
        const group = nameGroups.get(cleanName) || [];
        group.push(c);
        nameGroups.set(cleanName, group);
      });

      const candList: { key: string; items: Customer[] }[] = [];
      nameGroups.forEach((items, key) => {
        if (items.length > 1) {
          candList.push({ key, items });
        }
      });
      return candList.slice(0, 15);
    }

    const q = mergeSearch.toLowerCase().trim();
    const matches = customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q))
    );
    return [{ key: 'search', items: matches }];
  }, [customers, mergeSearch]);

  // Execute Merge
  const handleExecuteMerge = () => {
    if (!primaryCustId || !secondaryCustId) {
      alert('कृपया मुख्य खाते (Primary) आणि मर्ज करायचे दुय्यम खाते (Secondary) दोन्ही निवडा.');
      return;
    }
    if (primaryCustId === secondaryCustId) {
      alert('दोन्ही खाती वेगळी असणे आवश्यक आहे.');
      return;
    }

    const primary = customers.find((c) => c.id === primaryCustId);
    const secondary = customers.find((c) => c.id === secondaryCustId);

    if (!primary || !secondary) {
      alert('ग्राहक सापडला नाही.');
      return;
    }

    if (onMergeCustomers) {
      onMergeCustomers(primaryCustId, secondaryCustId);
      const pur1 = Math.max(primary.totalPurchased || 0, (primary.totalPaid || 0) + (primary.balanceDue || 0));
      const pur2 = Math.max(secondary.totalPurchased || 0, (secondary.totalPaid || 0) + (secondary.balanceDue || 0));
      const combinedPurchased = pur1 + pur2;
      const combinedPaid = (primary.totalPaid || 0) + (secondary.totalPaid || 0);
      const combinedDue = Math.max(0, combinedPurchased - combinedPaid);
      setMergeSuccessMsg(
        `यशस्वीपणे '${secondary.name}' चे खाते '${primary.name}' मध्ये विलीन झाले!\nसर्व व्यवहारांचे रि-मॅपिंग पूर्ण झाले असून एकूण खरेदी: ₹${combinedPurchased.toLocaleString()} | जमा: ₹${combinedPaid.toLocaleString()} | बाकी: ₹${combinedDue.toLocaleString()}`
      );
      setSecondaryCustId('');
      return;
    }

    const primaryPurchased = Math.max(primary.totalPurchased || 0, (primary.totalPaid || 0) + (primary.balanceDue || 0));
    const secondaryPurchased = Math.max(secondary.totalPurchased || 0, (secondary.totalPaid || 0) + (secondary.balanceDue || 0));

    const combinedPurchased = primaryPurchased + secondaryPurchased;
    const combinedPaid = (primary.totalPaid || 0) + (secondary.totalPaid || 0);
    const combinedDue = (primary.balanceDue || 0) + (secondary.balanceDue || 0);

    const mergedPrimary: Customer = {
      ...primary,
      phone: primary.phone || secondary.phone || '',
      village: primary.village || secondary.village,
      address: primary.address && secondary.address && primary.address !== secondary.address
        ? `${primary.address} | ${secondary.address}`
        : (primary.address || secondary.address),
      totalPurchased: combinedPurchased,
      totalPaid: combinedPaid,
      balanceDue: combinedDue,
    };

    // Remove secondary customer, update primary customer
    const updatedCustomers = customers
      .filter((c) => c.id !== secondary.id)
      .map((c) => (c.id === primary.id ? mergedPrimary : c));

    onUpdateCustomers(updatedCustomers);
    setMergeSuccessMsg(
      `यशस्वीपणे '${secondary.name}' चे खाते '${primary.name}' मध्ये विलीन झाले!\nएकूण खरेदी: ₹${combinedPurchased.toLocaleString()} | जमा: ₹${combinedPaid.toLocaleString()} | बाकी: ₹${combinedDue.toLocaleString()}`
    );
    setSecondaryCustId('');
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['नाव (Customer Name)', 'मोबाईल (Phone)', 'गाव (Village)', 'पत्ता (Address)', 'एकूण खरेदी (Total Purchased)', 'एकूण जमा (Total Paid)', 'शिल्लक बाकी (Balance Due)'];
    const rows = customers.map((c) => {
      const effectivePurchased = Math.max(c.totalPurchased || 0, (c.totalPaid || 0) + (c.balanceDue || 0));
      return [
        `"${c.name.replace(/"/g, '""')}"`,
        `"${c.phone || ''}"`,
        `"${(c.village || '').replace(/"/g, '""')}"`,
        `"${(c.address || '').replace(/"/g, '""')}"`,
        effectivePurchased,
        c.totalPaid || 0,
        c.balanceDue || 0,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ShriSai_All_Uploaded_Data_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-[#0B1528] via-[#0F1E36] to-[#0A101D] text-white p-6 sm:p-8 relative overflow-hidden shadow-xl border border-blue-900/40">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold">
              <Database className="w-3.5 h-3.5" />
              <span>अपलोड झालेला मास्टर डेटा संग्रह (Master Central Registry)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              अपलोड झालेला सर्व डेटा (Uploaded Data)
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              CSV मधून इम्पोर्ट झालेले सर्व २,५०२ ग्राहक, कार्ड योजना मेंबर्स, विक्री बिले आणि जुन्या पावत्या एकाच जागी तपासा. येथे तुम्ही झिरो खरेदी दुरुस्त करू शकता आणि सारखी नावे एकत्र (Merge) करू शकता.
            </p>
          </div>

          {/* Quick Action Tools */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {onRecheckLedgers && (
              <button
                onClick={() => {
                  onRecheckLedgers();
                  alert('सर्व ग्राहकांची खाती मोबाईल "0" व नावांच्या आधारे स्वतंत्र करण्यात आली आहेत! सर्व हिशोब ताळेबंद व्यवस्थित जुळला आहे.');
                }}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition cursor-pointer active:scale-95"
                title="मोबाईल नंबर '0' मुळे एकत्र आलेली ग्राहकांची खाती वेगळी करा (Auto-Separate)"
              >
                <Users className="w-4 h-4" />
                <span>मोबाईल '0' खाती वेगळी करा</span>
              </button>
            )}

            <button
              onClick={handleFixZeroPurchases}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer active:scale-95"
              title="ज्यांची खरेदी ₹0 दिसत आहे त्यांची खरेदी = भरणा + बाकी आपोआप सेट करा"
            >
              <Sparkles className="w-4 h-4" />
              <span>झिरो खरेदी दुरुस्त करा {zeroPurchasedCount > 0 && `(${zeroPurchasedCount})`}</span>
            </button>

            <button
              onClick={() => setShowMergeModal(true)}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/20 transition cursor-pointer active:scale-95"
            >
              <Merge className="w-4 h-4" />
              <span>नावे एकत्र / मर्ज करा (Merge)</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs flex items-center gap-2 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Excel / CSV</span>
            </button>

            {customers.length === 0 && (cardTransactions || []).length > 0 && (
              <button
                onClick={handleReconstructCustomersFromReceipts}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition cursor-pointer active:scale-95"
                title="१,०७९ पावत्यांमधील सर्व ग्राहकांची खाती तयार करा"
              >
                <UserCheck className="w-4 h-4" />
                <span>पावत्यांमधून ग्राहक खाती बनवा ({cardTransactions.length})</span>
              </button>
            )}

            {onResetData && (
              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      'तुम्हाला खरोखर सर्व ग्राहक, विक्री बिले आणि कार्ड्स डेटा पूर्णपणे रिसेट (Full Reset) करायचा आहे का?\n\nसर्व डेटा गायब होऊन सिस्टीम पूर्णपणे रिकामी (₹0) होईल. हा डेटा पुन्हा मिळवता येणार नाही.'
                    )
                  ) {
                    onResetData('all');
                  }
                }}
                className="px-3.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-600/20 transition cursor-pointer active:scale-95"
                title="सर्व डेटा पूर्णपणे रिसेट करा (Clean 0 Slate)"
              >
                <Trash2 className="w-4 h-4" />
                <span>पूर्ण डेटा रिसेट (Full Reset)</span>
              </button>
            )}
          </div>
        </div>

        {/* 5 Fast Metric Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5">
            <span className="text-[11px] text-slate-400 font-medium block">एकूण ग्राहक नोंदणी</span>
            <span className="text-lg sm:text-xl font-black text-white font-mono mt-1 block">
              {customers.length.toLocaleString()}
            </span>
          </div>

          <div className="bg-amber-500/10 border border-amber-400/20 rounded-2xl p-3.5">
            <span className="text-[11px] text-amber-300 font-medium block">एकूण मार्केट उधारी (Pending)</span>
            <span className="text-lg sm:text-xl font-black text-amber-400 font-mono mt-1 block">
              ₹{totalMarketUdhar.toLocaleString()}
            </span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5">
            <span className="text-[11px] text-slate-400 font-medium block">योजना कार्ड सभासद</span>
            <span className="text-lg sm:text-xl font-black text-white font-mono mt-1 block">
              {cardMembers.length.toLocaleString()}
            </span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5">
            <span className="text-[11px] text-slate-400 font-medium block">एकूण बिले व नोंदी</span>
            <span className="text-lg sm:text-xl font-black text-white font-mono mt-1 block">
              {transactions.length.toLocaleString()}
            </span>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-400/20 rounded-2xl p-3.5">
            <span className="text-[11px] text-emerald-300 font-medium block">जमा पावत्या (Receipts)</span>
            <span className="text-lg sm:text-xl font-black text-emerald-400 font-mono mt-1 block">
              {(cardTransactions || []).length.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Informative Guidance Banner if only Receipts are loaded */}
      {(cardMembers.length === 0 || transactions.length === 0) && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs text-slate-800">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-500 text-white shrink-0 shadow-xs mt-0.5">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-2">
                {cardTransactions.length > 0 && cardMembers.length === 0 && transactions.length === 0 ? (
                  <span>सध्या {(cardTransactions || []).length.toLocaleString()} जमा पावत्या (Receipts) लोड झालेल्या आहेत!</span>
                ) : cardMembers.length === 0 ? (
                  <span>योजना कार्ड सभासद (Scheme Cards) फाईल अजून अपलोड झालेली नाही!</span>
                ) : (
                  <span>विक्री बिले (Sales Bills) फाईल अजून अपलोड झालेली नाही!</span>
                )}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                तुम्ही <strong>shrisaient.in</strong> वर फक्त पावत्यांची CSV फाईल अपलोड केली आहे. 
                तुमच्याकडे असलेली <strong>विक्री बिलांची (Sales CSV)</strong> किंवा <strong>योजना कार्ड सभासदांची (Scheme CSV)</strong> फाईल डाव्या बाजूच्या <strong>'Excel Import (डेटा आयात)'</strong> टॅबमधून अपलोड करा — त्या सर्व नोंदी आपोआप इथे एकत्र (Merge) दिसतील!
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {customers.length === 0 && cardTransactions.length > 0 && (
              <button
                onClick={handleReconstructCustomersFromReceipts}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition cursor-pointer active:scale-95"
              >
                <UserCheck className="w-4 h-4" />
                <span>पावत्यांमधून ग्राहक खाती जोडा</span>
              </button>
            )}
            <button
              onClick={() => onNavigateTab('csv-import')}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition cursor-pointer active:scale-95"
            >
              <UploadCloud className="w-4 h-4" />
              <span>बाकी फाईल्स इम्पोर्ट करा (Excel Import)</span>
            </button>
          </div>
        </div>
      )}

      {/* Navigation Sub-Tabs & Universal Search */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveSubTab('customers')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition cursor-pointer shrink-0 ${
                activeSubTab === 'customers'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>सर्व ग्राहक व उधारी ({customers.length})</span>
            </button>

            {/* ERROR AUDIT OPTION */}
            <button
              onClick={() => setActiveSubTab('errors')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition cursor-pointer shrink-0 ${
                activeSubTab === 'errors'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>⚠️ चुका असलेला डेटा ({issueCount})</span>
              {issueCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
              )}
            </button>

            <button
              onClick={() => setActiveSubTab('bills')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition cursor-pointer shrink-0 ${
                activeSubTab === 'bills'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>विक्री बिले ({transactions.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('receipts')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition cursor-pointer shrink-0 ${
                activeSubTab === 'receipts'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>जमा पावत्या ({(cardTransactions || []).length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('cards')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition cursor-pointer shrink-0 ${
                activeSubTab === 'cards'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>कार्ड सभासद ({cardMembers.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('purchases')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition cursor-pointer shrink-0 ${
                activeSubTab === 'purchases'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>डीलर खरेदी ({purchases.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2 px-2 shrink-0">
            <button
              onClick={onRecheckLedgers}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              title="खातेवही परत ताडून पहा"
            >
              <RefreshCw className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>ताडून पहा</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="नाव (उदा. Sapna Nagral, Arun Sayre), मोबाईल किंवा पत्ता टाकून शोधा..."
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-2xs placeholder:text-slate-400"
            />
          </div>

          {activeSubTab === 'customers' && (
            <>
              {uniqueVillages.length > 0 && (
                <select
                  value={selectedVillage}
                  onChange={(e) => setSelectedVillage(e.target.value)}
                  className="px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs cursor-pointer"
                >
                  <option value="all">📍 सर्व गावे / All Villages</option>
                  {uniqueVillages.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              )}

              <div className="flex items-center bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                    statusFilter === 'all'
                      ? 'bg-slate-900 dark:bg-slate-700 text-white'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setStatusFilter('due')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                    statusFilter === 'due' ? 'bg-amber-600 text-white' : 'text-amber-800 dark:text-amber-300 hover:text-amber-900'
                  }`}
                >
                  Due Only
                </button>
                <button
                  onClick={() => setStatusFilter('cleared')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                    statusFilter === 'cleared' ? 'bg-emerald-600 text-white' : 'text-emerald-800 dark:text-emerald-300 hover:text-emerald-900'
                  }`}
                >
                  Cleared
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 0. DATA AUDIT & ERRORS VIEW (चूका असलेला डेटा)           */}
      {/* ========================================================= */}
      {activeSubTab === 'errors' && (
        <DataIssuesAuditView
          transactions={transactions}
          customers={customers}
          onEditTransaction={(tx) => setEditingTransaction(tx)}
          onEditCustomer={(cust) => setEditingCustomer(cust)}
          onFixMathTransaction={handleFixSingleMath}
          onFixAllMath={handleFixAllMath}
          onOpenLedger={(cust) => setSelectedLedgerCustomer(cust)}
          onRecheckLedgers={onRecheckLedgers}
          onMergeCustomers={onMergeCustomers}
          mergedRecords={mergedRecords}
        />
      )}

      {/* ========================================================= */}
      {/* 1. CUSTOMERS SUB-TAB                                      */}
      {/* ========================================================= */}
      {activeSubTab === 'customers' && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1 font-medium gap-1">
            <span>
              {filteredCustomers.length} ग्राहक आढळले {searchQuery && `("${searchQuery}" साठी)`}
            </span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              टीप: ज्यांचे खरेदी ₹० दिसत होते ते आपोआप भरणा + बाकी नुसार दुरुस्त केले आहे.
            </span>
          </div>

          {/* MOBILE CARDS VIEW (sm:hidden) */}
          <div className="space-y-2.5 sm:hidden">
            {filteredCustomers.slice(0, 150).map((c) => {
              const effectivePurchased = Math.max(
                c.totalPurchased || 0,
                (c.totalPaid || 0) + (c.balanceDue || 0)
              );

              return (
                <div
                  key={c.id}
                  className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-black text-slate-900 dark:text-white text-sm">
                        {c.name}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5">
                        {c.village && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            📍 {c.village}
                          </span>
                        )}
                        {c.phone && c.phone !== '0' ? (
                          <a
                            href={`tel:${c.phone}`}
                            className="text-[11px] font-mono text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1 hover:underline"
                          >
                            <Phone className="w-3 h-3" />
                            {c.phone}
                          </a>
                        ) : (
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium italic">
                            मोबाईल नाही
                          </span>
                        )}
                      </div>
                    </div>

                    {c.balanceDue > 0 ? (
                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-slate-400 block">शिल्लक बाकी</span>
                        <span className="font-mono font-black text-amber-900 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 px-2 py-0.5 rounded-lg text-xs inline-block">
                          ₹{c.balanceDue.toLocaleString()}
                        </span>
                      </div>
                    ) : (
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 rounded-full text-[11px]">
                        Cleared
                      </span>
                    )}
                  </div>

                  {c.address && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {c.address}
                    </div>
                  )}

                  {/* Financial Stats Bar */}
                  <div className="grid grid-cols-2 gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">एकूण खरेदी</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        ₹{effectivePurchased.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-sans">एकूण जमा</span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">
                        ₹{(c.totalPaid || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setEditingCustomer(c)}
                      className="flex-1 py-2 px-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>✏️ एडिट करा</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedLedgerCustomer(c)}
                      className="flex-1 py-2 px-2.5 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                      <span>खातेवही</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPrimaryCustId(c.id);
                        setShowMergeModal(true);
                      }}
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      title="खाते एकत्र (Merge) करा"
                    >
                      <Merge className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* DESKTOP TABLE VIEW (hidden sm:block) */}
          <div className="hidden sm:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">ग्राहक नाव</th>
                    <th className="py-3 px-4">मोबाईल व पत्ता</th>
                    <th className="py-3 px-4 text-right">एकूण खरेदी</th>
                    <th className="py-3 px-4 text-right">एकूण जमा (Paid)</th>
                    <th className="py-3 px-4 text-right">शिल्लक बाकी (Due)</th>
                    <th className="py-3 px-4 text-center">क्रिया (Actions)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {filteredCustomers.slice(0, 150).map((c) => {
                    const effectivePurchased = Math.max(
                      c.totalPurchased || 0,
                      (c.totalPaid || 0) + (c.balanceDue || 0)
                    );

                    return (
                      <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                        <td className="py-3 px-4">
                          <div className="font-extrabold text-slate-900 dark:text-white text-sm">{c.name}</div>
                          {c.village && (
                            <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              📍 {c.village}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                          {c.phone && c.phone !== '0' ? (
                            <div className="flex items-center gap-1 font-mono text-slate-800 dark:text-slate-200">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{c.phone}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">मोबाईल नाही</span>
                          )}
                          {c.address && (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs mt-0.5">
                              {c.address}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white text-sm">
                          ₹{effectivePurchased.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                          ₹{(c.totalPaid || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {c.balanceDue > 0 ? (
                            <span className="font-mono font-black text-amber-900 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 px-2 py-0.5 rounded-full text-xs">
                              ₹{c.balanceDue.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full text-[11px]">
                              Cleared
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setEditingCustomer(c)}
                              className="px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                              title="ग्राहकाचा डेटा (नाव, फोन, गाव, पत्ता) एडिट करा"
                            >
                              <Pencil className="w-3 h-3" />
                              <span>एडिट</span>
                            </button>
                            <button
                              onClick={() => setSelectedLedgerCustomer(c)}
                              className="px-2 py-1 rounded-lg bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                              title="संपूर्ण खातेवही व स्टेटमेंट पहा"
                            >
                              <BookOpen className="w-3 h-3 text-amber-400" />
                              <span>खातेवही</span>
                            </button>
                            <button
                              onClick={() => {
                                setPrimaryCustId(c.id);
                                setShowMergeModal(true);
                              }}
                              className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 transition cursor-pointer"
                              title="या ग्राहकाचे नाव दुसऱ्या खात्यासोबत एकत्र (Merge) करा"
                            >
                              <Merge className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredCustomers.length > 150 && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
                पहिले १५० ग्राहक दाखवले आहेत. संपूर्ण शोधण्यासाठी वर नाव किंवा फोन टाईप करा.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. CARD MEMBERS SUB-TAB                                   */}
      {/* ========================================================= */}
      {activeSubTab === 'cards' && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1 font-medium gap-1">
            <span>{filteredCardMembers.length} कार्ड सभासद नोंदी सापडल्या</span>
            <button
              onClick={() => onNavigateTab('card-scheme')}
              className="text-blue-600 dark:text-blue-400 hover:underline font-bold"
            >
              कार्ड योजना काउंटर →
            </button>
          </div>

          {/* MOBILE CARDS VIEW (sm:hidden) */}
          <div className="space-y-2.5 sm:hidden">
            {filteredCardMembers.slice(0, 150).map((m) => (
              <div
                key={m.id}
                className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono font-black text-blue-600 dark:text-blue-400 text-xs bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
                      #{m.cardNumber}
                    </span>
                    <div className="font-black text-slate-900 dark:text-white text-sm mt-1">
                      {m.customerName}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {m.village && <span>📍 {m.village}</span>}
                      {m.phone && <span className="font-mono">({m.phone})</span>}
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                      m.status === 'Completed'
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                        : m.status === 'Closed'
                        ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                        : 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                    }`}
                  >
                    {m.status}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                    {m.schemeName || m.schemeId}
                  </span>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-sans">एकूण भरणा</span>
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      ₹{(m.totalDeposited || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* DESKTOP TABLE VIEW (hidden sm:block) */}
          <div className="hidden sm:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">कार्ड नं.</th>
                    <th className="py-3 px-4">सभासदाचे नाव</th>
                    <th className="py-3 px-4">योजना (Scheme)</th>
                    <th className="py-3 px-4">गाव / मोबाईल</th>
                    <th className="py-3 px-4 text-right">एकूण भरणा (Deposited)</th>
                    <th className="py-3 px-4 text-center">स्थिती (Status)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {filteredCardMembers.slice(0, 150).map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                      <td className="py-3 px-4 font-mono font-black text-blue-700 dark:text-blue-400 text-sm">
                        #{m.cardNumber}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{m.customerName}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                          {m.schemeName || m.schemeId}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {m.village && <span>📍 {m.village} </span>}
                        {m.phone && <span className="font-mono text-slate-500 dark:text-slate-400">({m.phone})</span>}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                        ₹{(m.totalDeposited || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            m.status === 'Completed'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                              : m.status === 'Closed'
                              ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                              : 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                          }`}
                        >
                          {m.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. TRANSACTIONS / BILLS SUB-TAB                           */}
      {/* ========================================================= */}
      {activeSubTab === 'bills' && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1 font-medium gap-2">
            <span>{filteredTransactions.length} विक्री बिले व नोंदी</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleFixAllMath}
                className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer active:scale-95"
                title="सर्व बिलांची उधारी बाकी जुळवा"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>हिशोब बेरीज जुळवा (Auto-Fix)</span>
              </button>

              <button
                onClick={() => onNavigateTab('all-entries')}
                className="text-blue-600 dark:text-blue-400 hover:underline font-bold"
              >
                सर्व नोंदी रजिस्टर →
              </button>
            </div>
          </div>

          {/* MOBILE CARDS VIEW (sm:hidden) */}
          <div className="space-y-2.5 sm:hidden">
            {filteredTransactions.slice(0, 150).map((t) => {
              const total = Number(t.totalAmount) || 0;
              const paid = Number(t.payingNow) || 0;
              const due = Number(t.dueAmount) || 0;
              const mathDiff = total - (paid + due);
              const hasMathError = Math.abs(mathDiff) > 1;

              return (
                <div
                  key={t.id}
                  className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-slate-900 dark:text-white text-sm">
                          #{t.invoiceNo || 'REC'}
                        </span>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500">
                          {t.date}
                        </span>
                      </div>
                      <div className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5">
                        {t.customerName}
                      </div>
                      {(t.customerPhone || t.village) && (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {t.customerPhone && <span className="font-mono">{t.customerPhone} </span>}
                          {t.village && <span>• 📍 {t.village}</span>}
                        </div>
                      )}
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        hasMathError
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      }`}
                    >
                      {hasMathError ? `तफावत ₹${Math.abs(mathDiff)}` : 'हिशोब ओके'}
                    </span>
                  </div>

                  {t.itemDetails && (
                    <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="font-semibold text-slate-400 block text-[10px]">तपशील:</span>
                      {t.itemDetails}
                    </div>
                  )}

                  {/* 3 Stats Bar */}
                  <div className="grid grid-cols-3 gap-1.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-center text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">एकूण बिल</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        ₹{total.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-sans">रोख भरणा</span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">
                        ₹{paid.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-amber-800 dark:text-amber-400 block font-sans">उधारी बाकी</span>
                      <span className="font-bold text-amber-900 dark:text-amber-300">
                        ₹{due.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Math error quick fix tip */}
                  {hasMathError && (
                    <div className="flex items-center justify-between p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs">
                      <span className="text-amber-900 dark:text-amber-300 text-[11px]">
                        बाकी ₹{Math.max(0, total - paid).toLocaleString()} हवी होती
                      </span>
                      <button
                        type="button"
                        onClick={() => handleFixSingleMath(t)}
                        className="px-2 py-1 rounded-lg bg-amber-600 text-white font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                      >
                        <Zap className="w-3 h-3 fill-current" />
                        <span>जुळवा</span>
                      </button>
                    </div>
                  )}

                  {/* Action Button */}
                  <button
                    type="button"
                    onClick={() => setEditingTransaction(t)}
                    className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer active:scale-95"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>✏️ हे बिल एडिट करा (Edit Bill)</span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* DESKTOP TABLE VIEW (hidden sm:block) */}
          <div className="hidden sm:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">तारीख व बिल नं.</th>
                    <th className="py-3 px-4">ग्राहक नाव</th>
                    <th className="py-3 px-4">तपशील (Items)</th>
                    <th className="py-3 px-4 text-right">एकूण बिल</th>
                    <th className="py-3 px-4 text-right">रोख भरणा</th>
                    <th className="py-3 px-4 text-right">उधारी बाकी</th>
                    <th className="py-3 px-4 text-center">हिशोब</th>
                    <th className="py-3 px-4 text-center">क्रिया (Actions)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {filteredTransactions.slice(0, 150).map((t) => {
                    const total = Number(t.totalAmount) || 0;
                    const paid = Number(t.payingNow) || 0;
                    const due = Number(t.dueAmount) || 0;
                    const mathDiff = total - (paid + due);
                    const hasMathError = Math.abs(mathDiff) > 1;

                    return (
                      <tr key={t.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                        <td className="py-3 px-4">
                          <div className="font-mono font-bold text-slate-900 dark:text-white">{t.invoiceNo || 'REC'}</div>
                          <div className="text-[11px] text-slate-400 dark:text-slate-500">{t.date}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">{t.customerName}</div>
                          {t.customerPhone && (
                            <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400">{t.customerPhone}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300 truncate max-w-xs">{t.itemDetails}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white text-sm">
                          ₹{total.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                          ₹{paid.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-amber-800 dark:text-amber-300 text-sm">
                          ₹{due.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {hasMathError ? (
                            <button
                              type="button"
                              onClick={() => handleFixSingleMath(t)}
                              className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold text-[10px] hover:bg-amber-200 cursor-pointer"
                              title={`तफावत: ₹${Math.abs(mathDiff)}. हिशोब जुळवण्यासाठी क्लिक करा.`}
                            >
                              फरक ₹{Math.abs(mathDiff)}
                            </button>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold">✓ अचूक</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => setEditingTransaction(t)}
                            className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-[11px] font-bold transition flex items-center gap-1 mx-auto cursor-pointer"
                          >
                            <Pencil className="w-3 h-3" />
                            <span>एडिट करा</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. PURCHASES SUB-TAB                                      */}
      {/* ========================================================= */}
      {activeSubTab === 'purchases' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1 font-medium">
            <span>{purchases.length} डीलर खरेदी बिले</span>
            <button
              onClick={() => onNavigateTab('purchases')}
              className="text-blue-600 hover:underline font-bold"
            >
              खरेदी रजिस्टरवर जा →
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">बिल नं. व तारीख</th>
                    <th className="py-3 px-4">सप्लायर / डीलर</th>
                    <th className="py-3 px-4">वस्तू तपशील</th>
                    <th className="py-3 px-4 text-right">एकूण रक्कम</th>
                    <th className="py-3 px-4 text-right">दिलेली रक्कम</th>
                    <th className="py-3 px-4 text-center">स्थिती</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {purchases.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-900">{p.billNo}</span>
                        <span className="text-[11px] text-slate-400 block">{p.date}</span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{p.supplierName}</td>
                      <td className="py-3 px-4 text-slate-600 truncate max-w-xs">{p.items}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        ₹{(p.totalAmount || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                        ₹{(p.paidAmount || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.status === 'Paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4.5. RECEIPTS SUB-TAB (जमा पावत्या व बिल क्रेडिट)         */}
      {/* ========================================================= */}
      {activeSubTab === 'receipts' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                जमा पावत्या व बिल क्रेडिट नोंदवही (Payment & Scheme Receipts)
              </h3>
              <p className="text-xs text-slate-500">
                CSV मधून इम्पोर्ट झालेल्या सर्व साप्ताहिक/मासिक योजना पावत्या आणि बिलाच्या विरोधात जमा (Credit) झालेल्या नोंदी.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
              एकूण {filteredReceipts.length} पावत्या
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <tr>
                  <th className="py-3 px-4">पावती क्र. / तारीख</th>
                  <th className="py-3 px-4">ग्राहक नाव</th>
                  <th className="py-3 px-4">कार्ड नं</th>
                  <th className="py-3 px-4">संबंधित बिल / शेरा</th>
                  <th className="py-3 px-4 text-center">प्रकार / मोड</th>
                  <th className="py-3 px-4 text-right">जमा रक्कम (Credit)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {filteredReceipts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      कोणत्याही जमा पावत्या सापडल्या नाहीत.
                    </td>
                  </tr>
                ) : (
                  filteredReceipts.map((r: any) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-900 block">{r.receiptNo}</span>
                        <span className="text-[11px] text-slate-400 font-mono">{r.date}</span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {r.customerName || r.memberName || '-'}
                      </td>
                      <td className="py-3 px-4">
                        {r.cardNumber ? (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 font-mono">
                            #{r.cardNumber}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                        {r.remarks || 'बिलामध्ये क्रेडिट (Credit against bill)'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            r.type === 'Refund'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {r.type === 'Refund' ? 'परतावा' : 'जमा भरणा'} • {r.paymentMode || 'Cash'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 text-sm">
                        +₹{(r.amount || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. MERGE DUPLICATE CUSTOMERS MODAL (उदा. SAPNA NAGRALHE)   */}
      {/* ========================================================= */}
      {showMergeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl space-y-5 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <Merge className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">
                    सारखी / डुप्लिकेट नावे एकत्र करा (Merge Customer Accounts)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    उदा. <span className="font-bold text-amber-700">SAPNA NAGRALHE</span> आणि{' '}
                    <span className="font-bold text-blue-700">SAPNA NAGRALE</span> यांचे व्यवहार एकाच मुख्य खात्यात विलीन करा.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowMergeModal(false);
                  setMergeSuccessMsg(null);
                }}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {mergeSuccessMsg && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold whitespace-pre-line flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{mergeSuccessMsg}</span>
              </div>
            )}

            {/* Quick Search */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">ग्राहक नाव किंवा फोन शोधा:</label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={mergeSearch}
                  onChange={(e) => setMergeSearch(e.target.value)}
                  placeholder="उदा. Sapna Nagralhe, Arun Sayre..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Selection Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Box 1: Primary Account */}
              <div className="p-4 rounded-2xl border-2 border-blue-200 bg-blue-50/40 space-y-2.5">
                <span className="text-xs font-black text-blue-900 block flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  १. मुख्य खाते (हे खाते कायम राहील)
                </span>
                <select
                  value={primaryCustId}
                  onChange={(e) => setPrimaryCustId(e.target.value)}
                  className="w-full p-2.5 bg-white border border-blue-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- मुख्य ग्राहक निवडा --</option>
                  {customers
                    .filter((c) => !mergeSearch || c.name.toLowerCase().includes(mergeSearch.toLowerCase()) || (c.phone && c.phone.includes(mergeSearch)))
                    .slice(0, 50)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.phone ? `(${c.phone})` : ''} - Due: ₹{c.balanceDue.toLocaleString()}
                      </option>
                    ))}
                </select>

                {primaryCustId && (
                  (() => {
                    const c = customers.find((x) => x.id === primaryCustId);
                    if (!c) return null;
                    const eff = Math.max(c.totalPurchased || 0, (c.totalPaid || 0) + (c.balanceDue || 0));
                    return (
                      <div className="text-[11px] space-y-1 bg-white p-2.5 rounded-xl border border-blue-200 text-slate-700">
                        <div className="font-extrabold text-blue-900">{c.name}</div>
                        <div>पत्ता: {c.address || c.village || 'N/A'}</div>
                        <div>फोन: {c.phone || 'N/A'}</div>
                        <div className="font-mono font-bold text-slate-900 pt-1 border-t border-slate-100">
                          खरेदी: ₹{eff.toLocaleString()} | जमा: ₹{(c.totalPaid || 0).toLocaleString()} | बाकी: ₹{c.balanceDue.toLocaleString()}
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>

              {/* Box 2: Secondary Account to Merge */}
              <div className="p-4 rounded-2xl border-2 border-amber-200 bg-amber-50/40 space-y-2.5">
                <span className="text-xs font-black text-amber-900 block flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-600" />
                  २. दुय्यम खाते (हे मुख्य खात्यात विलीन होईल)
                </span>
                <select
                  value={secondaryCustId}
                  onChange={(e) => setSecondaryCustId(e.target.value)}
                  className="w-full p-2.5 bg-white border border-amber-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">-- विलीन करायचे खाते निवडा --</option>
                  {customers
                    .filter(
                      (c) =>
                        c.id !== primaryCustId &&
                        (!mergeSearch || c.name.toLowerCase().includes(mergeSearch.toLowerCase()) || (c.phone && c.phone.includes(mergeSearch)))
                    )
                    .slice(0, 50)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.phone ? `(${c.phone})` : ''} - Due: ₹{c.balanceDue.toLocaleString()}
                      </option>
                    ))}
                </select>

                {secondaryCustId && (
                  (() => {
                    const c = customers.find((x) => x.id === secondaryCustId);
                    if (!c) return null;
                    const eff = Math.max(c.totalPurchased || 0, (c.totalPaid || 0) + (c.balanceDue || 0));
                    return (
                      <div className="text-[11px] space-y-1 bg-white p-2.5 rounded-xl border border-amber-200 text-slate-700">
                        <div className="font-extrabold text-amber-900">{c.name}</div>
                        <div>पत्ता: {c.address || c.village || 'N/A'}</div>
                        <div>फोन: {c.phone || 'N/A'}</div>
                        <div className="font-mono font-bold text-slate-900 pt-1 border-t border-slate-100">
                          खरेदी: ₹{eff.toLocaleString()} | जमा: ₹{(c.totalPaid || 0).toLocaleString()} | बाकी: ₹{c.balanceDue.toLocaleString()}
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>
            </div>

            {/* Merge Action Button */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowMergeModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs transition cursor-pointer"
              >
                रद्द करा
              </button>
              <button
                type="button"
                onClick={handleExecuteMerge}
                disabled={!primaryCustId || !secondaryCustId}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-500/20 transition cursor-pointer"
              >
                <Merge className="w-4 h-4" />
                <span>दोन्ही खाती कायमस्वरूपी एकत्र करा (Confirm Merge)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ledger Statement Modal */}
      {selectedLedgerCustomer && (
        <CustomerLedgerModal
          customer={selectedLedgerCustomer}
          transactions={transactions}
          cardTransactions={cardTransactions}
          settings={settings}
          onClose={() => setSelectedLedgerCustomer(null)}
          onReceivePayment={onSettlePayment}
        />
      )}

      {/* Edit Transaction Modal */}
      {editingTransaction && (
        <EditTransactionModal
          isOpen={!!editingTransaction}
          onClose={() => setEditingTransaction(null)}
          transaction={editingTransaction}
          existingVillages={uniqueVillages}
          onSave={(updatedTx) => {
            onUpdateTransaction?.(updatedTx);
            setEditingTransaction(null);
            onRecheckLedgers();
          }}
          onDelete={(txId) => {
            onDeleteTransaction?.(txId);
            setEditingTransaction(null);
            onRecheckLedgers();
          }}
        />
      )}

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <EditCustomerModal
          isOpen={!!editingCustomer}
          onClose={() => setEditingCustomer(null)}
          customer={editingCustomer}
          existingVillages={uniqueVillages}
          onSave={(updatedCust) => {
            onUpdateSingleCustomer?.(updatedCust);
            setEditingCustomer(null);
            onRecheckLedgers();
          }}
        />
      )}
    </div>
  );
};
