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
  Share2
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
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'customers' | 'cards' | 'bills' | 'receipts' | 'purchases'>('customers');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'due' | 'cleared'>('all');
  const [selectedVillage, setSelectedVillage] = useState<string>('all');
  const [selectedLedgerCustomer, setSelectedLedgerCustomer] = useState<Customer | null>(null);

  // Merge Duplicate Customers Modal State
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [mergeSearch, setMergeSearch] = useState('');
  const [primaryCustId, setPrimaryCustId] = useState<string>('');
  const [secondaryCustId, setSecondaryCustId] = useState<string>('');
  const [mergeSuccessMsg, setMergeSuccessMsg] = useState<string | null>(null);

  // Quick stats calculation
  const totalMarketUdhar = useMemo(() => {
    return customers.reduce((acc, c) => acc + (c.balanceDue || 0), 0);
  }, [customers]);

  const zeroPurchasedCount = useMemo(() => {
    return customers.filter(
      (c) => (c.totalPurchased === 0 || !c.totalPurchased) && ((c.totalPaid || 0) > 0 || (c.balanceDue || 0) > 0)
    ).length;
  }, [customers]);

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

      {/* Navigation Sub-Tabs & Universal Search */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setActiveSubTab('customers')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition cursor-pointer ${
                activeSubTab === 'customers'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>सर्व ग्राहक व उधारी ({customers.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('cards')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition cursor-pointer ${
                activeSubTab === 'cards'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>कार्ड सभासद ({cardMembers.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('bills')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition cursor-pointer ${
                activeSubTab === 'bills'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>विक्री बिले ({transactions.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('receipts')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition cursor-pointer ${
                activeSubTab === 'receipts'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>जमा पावत्या ({(cardTransactions || []).length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('purchases')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition cursor-pointer ${
                activeSubTab === 'purchases'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>डीलर खरेदी ({purchases.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2 px-2">
            <button
              onClick={onRecheckLedgers}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              title="खातेवही परत ताडून पहा"
            >
              <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
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
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-2xs"
            />
          </div>

          {activeSubTab === 'customers' && (
            <>
              {uniqueVillages.length > 0 && (
                <select
                  value={selectedVillage}
                  onChange={(e) => setSelectedVillage(e.target.value)}
                  className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs cursor-pointer"
                >
                  <option value="all">📍 सर्व गावे / All Villages</option>
                  {uniqueVillages.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              )}

              <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                    statusFilter === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setStatusFilter('due')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                    statusFilter === 'due' ? 'bg-amber-600 text-white' : 'text-amber-800 hover:text-amber-900'
                  }`}
                >
                  Due Only
                </button>
                <button
                  onClick={() => setStatusFilter('cleared')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                    statusFilter === 'cleared' ? 'bg-emerald-600 text-white' : 'text-emerald-800 hover:text-emerald-900'
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
      {/* 1. CUSTOMERS SUB-TAB                                      */}
      {/* ========================================================= */}
      {activeSubTab === 'customers' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1 font-medium">
            <span>
              {filteredCustomers.length} ग्राहक आढळले {searchQuery && `("${searchQuery}" साठी)`}
            </span>
            <span className="text-[11px] text-slate-400">
              टीप: ज्यांचे टोटल खरेदी ₹० दिसत होते ते आपोआप भरणा + बाकी नुसार दुरुस्त केले आहे.
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">ग्राहक नाव</th>
                    <th className="py-3 px-4">मोबाईल व पत्ता</th>
                    <th className="py-3 px-4 text-right">एकूण खरेदी</th>
                    <th className="py-3 px-4 text-right">एकूण जमा (Paid)</th>
                    <th className="py-3 px-4 text-right">शिल्लक बाकी (Due)</th>
                    <th className="py-3 px-4 text-center">खातेवही / क्रिया</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredCustomers.slice(0, 150).map((c) => {
                    const effectivePurchased = Math.max(
                      c.totalPurchased || 0,
                      (c.totalPaid || 0) + (c.balanceDue || 0)
                    );

                    return (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4">
                          <div className="font-extrabold text-slate-900 text-sm">{c.name}</div>
                          {c.village && (
                            <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                              📍 {c.village}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {c.phone ? (
                            <div className="flex items-center gap-1 font-mono text-slate-800">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{c.phone}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">No mobile</span>
                          )}
                          {c.address && (
                            <div className="text-[11px] text-slate-500 truncate max-w-xs mt-0.5">
                              {c.address}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                          ₹{effectivePurchased.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 text-sm">
                          ₹{(c.totalPaid || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {c.balanceDue > 0 ? (
                            <span className="font-mono font-black text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full text-xs">
                              ₹{c.balanceDue.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full text-[11px]">
                              Cleared
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setSelectedLedgerCustomer(c)}
                              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
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
                              className="p-1 rounded-lg border border-slate-200 text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition cursor-pointer"
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
              <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-500">
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
          <div className="flex items-center justify-between text-xs text-slate-500 px-1 font-medium">
            <span>{filteredCardMembers.length} कार्ड सभासद नोंदी सापडल्या</span>
            <button
              onClick={() => onNavigateTab('card-scheme')}
              className="text-blue-600 hover:underline font-bold"
            >
              कार्ड योजना पेजवर जा →
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">कार्ड नं.</th>
                    <th className="py-3 px-4">सभासदाचे नाव</th>
                    <th className="py-3 px-4">योजना (Scheme)</th>
                    <th className="py-3 px-4">गाव / मोबाईल</th>
                    <th className="py-3 px-4 text-right">एकूण भरणा (Deposited)</th>
                    <th className="py-3 px-4 text-center">स्थिती (Status)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredCardMembers.slice(0, 150).map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-black text-blue-700 text-sm">
                        #{m.cardNumber}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{m.customerName}</td>
                      <td className="py-3 px-4 text-slate-600">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          {m.schemeName || m.schemeId}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {m.village && <span>📍 {m.village} </span>}
                        {m.phone && <span className="font-mono text-slate-500">({m.phone})</span>}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 text-sm">
                        ₹{(m.totalDeposited || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            m.status === 'Completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : m.status === 'Closed'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-blue-100 text-blue-800'
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
          <div className="flex items-center justify-between text-xs text-slate-500 px-1 font-medium">
            <span>{filteredTransactions.length} विक्री बिले व नोंदी</span>
            <button
              onClick={() => onNavigateTab('all-entries')}
              className="text-blue-600 hover:underline font-bold"
            >
              सर्व नोंदी पेजवर जा →
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">तारीख व बिल नं.</th>
                    <th className="py-3 px-4">ग्राहक नाव</th>
                    <th className="py-3 px-4">तपशील (Items)</th>
                    <th className="py-3 px-4 text-right">एकूण बिल</th>
                    <th className="py-3 px-4 text-right">रोख भरणा</th>
                    <th className="py-3 px-4 text-right">उधारी बाकी</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredTransactions.slice(0, 150).map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-slate-900">{t.invoiceNo || 'REC'}</div>
                        <div className="text-[11px] text-slate-400">{t.date}</div>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{t.customerName}</td>
                      <td className="py-3 px-4 text-slate-600 truncate max-w-xs">{t.itemDetails}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                        ₹{(t.totalAmount || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 text-sm">
                        ₹{(t.payingNow || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-amber-800 text-sm">
                        ₹{(t.dueAmount || 0).toLocaleString()}
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
    </div>
  );
};
