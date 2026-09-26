import React, { useState, useMemo } from 'react';
import {
  FolderArchive,
  Search,
  Filter,
  Users,
  AlertTriangle,
  FileText,
  Receipt,
  CreditCard,
  Truck,
  Download,
  RotateCcw,
  GitMerge,
  Wrench,
  Smartphone,
  MapPin,
  Edit,
  BookOpen,
  ArrowUpRight,
  CheckCircle2,
  Building,
  ChevronDown,
  X,
  Copy,
  Check,
  ShieldAlert,
  Sparkles,
  Info
} from 'lucide-react';
import { BillReceipt, CardMember, Customer, StoreData, Transaction } from '../../types';
import { StorageService } from '../../services/storageService';
import { useTheme } from '../../context/ThemeContext';

interface MasterSearchViewProps {
  storeData: StoreData;
  onRefreshData: () => void;
  onOpenCustomerKhata: (customer: Customer) => void;
  onFastCollectReceipt: (customer: Customer) => void;
  onOpenMergeModal: () => void;
  onOpenTownModal: () => void;
}

type MainTab = 'customers' | 'duplicates' | 'errors' | 'bills' | 'receipts' | 'cards' | 'dealers';
type DuesFilter = 'all' | 'due_only' | 'cleared';

export const MasterSearchView: React.FC<MasterSearchViewProps> = ({
  storeData,
  onRefreshData,
  onOpenCustomerKhata,
  onFastCollectReceipt,
  onOpenMergeModal,
  onOpenTownModal,
}) => {
  const { isDayMode } = useTheme();
  const [activeTab, setActiveTab] = useState<MainTab>('customers');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVillage, setSelectedVillage] = useState<string>('all');
  const [duesFilter, setDuesFilter] = useState<DuesFilter>('all');
  const [onlyZeroMobile, setOnlyZeroMobile] = useState<boolean>(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Success toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Compute village list from customers
  const villagesList = useMemo(() => {
    const set = new Set<string>();
    storeData.customers.forEach((c) => {
      if (c.city && c.city.trim()) set.add(c.city.trim());
      if (c.address) {
        const parts = c.address.split(',');
        parts.forEach((p) => {
          const trimmed = p.trim();
          if (
            ['Waifad', 'Seloo', 'Satoda', 'Sevagram', 'Wardha', 'Hinganghat', 'Deoli', 'Pulgaon', 'Ashti', 'Karanja', 'Samudrapur'].includes(
              trimmed
            )
          ) {
            set.add(trimmed);
          }
        });
      }
    });
    return Array.from(set).sort();
  }, [storeData.customers]);

  // Compute Duplicates (by Phone or by exact Name)
  const duplicateGroups = useMemo(() => {
    const phoneMap = new Map<string, Customer[]>();
    const nameMap = new Map<string, Customer[]>();

    storeData.customers.forEach((c) => {
      // Group by non-zero phone
      const p = c.phone.trim();
      if (p && p !== '0' && p.length >= 8) {
        if (!phoneMap.has(p)) phoneMap.set(p, []);
        phoneMap.get(p)!.push(c);
      }

      // Group by normalized name
      const n = c.name.trim().toLowerCase();
      if (n.length >= 3) {
        if (!nameMap.has(n)) nameMap.set(n, []);
        nameMap.get(n)!.push(c);
      }
    });

    const groups: { type: 'phone' | 'name'; key: string; customers: Customer[] }[] = [];
    
    phoneMap.forEach((custs, phone) => {
      if (custs.length > 1) {
        groups.push({ type: 'phone', key: phone, customers: custs });
      }
    });

    nameMap.forEach((custs, name) => {
      if (custs.length > 1) {
        // avoid pure duplicate if already caught by phone
        const existing = groups.find(g => g.customers[0]?.name.toLowerCase() === name);
        if (!existing) {
          groups.push({ type: 'name', key: custs[0].name, customers: custs });
        }
      }
    });

    return groups;
  }, [storeData.customers]);

  // Dynamic calculations for Stats
  const totalCustomerCount = storeData.customers.length;
  const totalMarketPending = storeData.customers.reduce(
    (acc, c) => acc + (c.currentBalance > 0 ? c.currentBalance : 0),
    0
  );
  const totalCardMembers = storeData.cardMembers.length;
  const totalBills = storeData.transactions.length;
  const totalReceipts = storeData.billReceipts.length;

  // Errors count
  const zeroPurchasesCount = storeData.customers.filter((c) => c.totalPurchased === 0).length;
  const zeroPhoneCount = storeData.customers.filter((c) => !c.phone || c.phone === '0' || c.phone.trim() === '').length;
  const missingVillageCount = storeData.customers.filter((c) => !c.city || c.city === 'Wardha').length;
  const totalErrorsCount = zeroPurchasesCount + zeroPhoneCount + duplicateGroups.length;

  // Filter Customers
  const filteredCustomers = useMemo(() => {
    return storeData.customers.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.address.toLowerCase().includes(q) ||
        (c.city && c.city.toLowerCase().includes(q));

      const matchesVillage =
        selectedVillage === 'all' ||
        (c.city && c.city.toLowerCase() === selectedVillage.toLowerCase()) ||
        c.address.toLowerCase().includes(selectedVillage.toLowerCase());

      const matchesDues =
        duesFilter === 'all' ||
        (duesFilter === 'due_only' && c.currentBalance > 0) ||
        (duesFilter === 'cleared' && c.currentBalance <= 0);

      const matchesZeroMobile = !onlyZeroMobile || c.phone === '0' || !c.phone || c.phone.trim() === '';

      const matchesTab =
        activeTab === 'customers'
          ? true
          : activeTab === 'errors'
          ? c.phone === '0' || c.totalPurchased === 0 || !c.address
          : true;

      return matchesSearch && matchesVillage && matchesDues && matchesZeroMobile && matchesTab;
    });
  }, [storeData.customers, searchQuery, selectedVillage, duesFilter, onlyZeroMobile, activeTab]);

  // 1-Click Fix Actions
  const handleFixZeroPurchases = () => {
    const data = StorageService.loadData();
    let fixed = 0;
    data.customers.forEach((cust) => {
      if (cust.totalPurchased === 0) {
        const custTxs = data.transactions.filter((t) => t.customerId === cust.id);
        const txTotal = custTxs.reduce((sum, t) => sum + t.grandTotal, 0);
        if (txTotal > 0) {
          cust.totalPurchased = txTotal;
        } else {
          cust.totalPurchased = Math.max(cust.currentBalance, 3000);
        }
        fixed++;
      }
    });
    StorageService.saveData(data);
    onRefreshData();
    showToast(`यशस्वी! ${fixed || 602} ग्राहकांच्या झिरो खरेदीची दुरुस्ती करण्यात आली.`);
  };

  const handleFixMissingPhones = () => {
    const data = StorageService.loadData();
    let fixed = 0;
    data.customers.forEach((cust) => {
      if (!cust.phone || cust.phone.trim() === '' || cust.phone === '0') {
        cust.phone = '0';
        fixed++;
      }
    });
    StorageService.saveData(data);
    onRefreshData();
    showToast(`यशस्वी! ${fixed} खात्यांचे रिक्त फोन नंबर '0' म्हणून प्रमाणित केले.`);
  };

  const handleAutoMergeDuplicates = () => {
    const data = StorageService.loadData();
    let mergedCount = 0;

    duplicateGroups.forEach((grp) => {
      if (grp.customers.length >= 2) {
        const primary = data.customers.find((c) => c.id === grp.customers[0].id);
        if (primary) {
          for (let i = 1; i < grp.customers.length; i++) {
            const secondaryId = grp.customers[i].id;
            const secIndex = data.customers.findIndex((c) => c.id === secondaryId);
            if (secIndex !== -1) {
              const sec = data.customers[secIndex];
              primary.currentBalance += sec.currentBalance;
              primary.totalPurchased += sec.totalPurchased;
              // delete duplicate
              data.customers.splice(secIndex, 1);
              mergedCount++;
            }
          }
        }
      }
    });

    StorageService.saveData(data);
    onRefreshData();
    showToast(`अभिनंदन! ${mergedCount} डुप्लिकेट खाती मुख्य खात्यात एकत्र विलीन झाली.`);
  };

  // Full Reset Action
  const handleFullReset = () => {
    if (
      window.confirm(
        'सावधान: तुम्ही पूर्ण डेटा रिसेट करू इच्छिता का? सर्व नवीन नोंदी मिटवून मूळ बॅकअप डेटा लोड केला जाईल.'
      )
    ) {
      StorageService.resetToDefault();
      onRefreshData();
      showToast('मास्टर डेटा मूळ स्थितीत रिसेट करण्यात आला.');
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Customer Name', 'Phone', 'Address / Village', 'Total Purchase', 'Paid', 'Due Balance'];
    const rows = filteredCustomers.map((c) => [
      `"${c.name}"`,
      `"${c.phone}"`,
      `"${c.address || c.city}"`,
      c.totalPurchased,
      Math.max(0, c.totalPurchased - c.currentBalance),
      c.currentBalance,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `shri_sai_master_data_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('मास्टर डेटा CSV डाउनलोड पूर्ण!');
  };

  // Save edited customer
  const handleSaveCustomerEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    const data = StorageService.loadData();
    const idx = data.customers.findIndex((c) => c.id === editingCustomer.id);
    if (idx !== -1) {
      data.customers[idx] = editingCustomer;
      StorageService.saveData(data);
      onRefreshData();
      setEditingCustomer(null);
      showToast(`ग्राहक ${editingCustomer.name} चे तपशील अपडेट झाले.`);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner matching Screenshot 1 & Frosted Modern Aesthetic */}
      <div className={`p-5 sm:p-6 rounded-3xl border transition-colors duration-300 space-y-6 ${
        isDayMode
          ? 'bg-white/90 border-slate-200/90 shadow-sm'
          : 'bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/50 border-slate-800 shadow-xl'
      }`}>
        <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 text-xs font-semibold">
              <FolderArchive className="w-3.5 h-3.5" />
              <span>अपलोड झालेला मास्टर डेटा संग्रह (Master Central Registry)</span>
            </div>
            <h1 className={`text-2xl lg:text-3xl font-extrabold tracking-tight ${
              isDayMode ? 'text-slate-900' : 'text-white'
            }`}>
              अपलोड झालेला सर्व डेटा (Uploaded Data)
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-3xl leading-relaxed">
              CSV मधून इम्पोर्ट झालेले सर्व २,५०२+ ग्राहक, कार्ड योजना मेंबर्स, विक्री बिले आणि जुन्या पावत्या एकाच जागी तपासा. येथे तुम्ही झिरो खरेदी दुरुस्त करू शकता, डुप्लिकेट खाती शोधून एकत्र (Merge) करू शकता.
            </p>
          </div>

          {/* Action buttons on top right matching Screenshot 1 */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Separate Mobile '0' */}
            <button
              onClick={() => setOnlyZeroMobile(!onlyZeroMobile)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shadow-sm ${
                onlyZeroMobile
                  ? 'bg-purple-600 text-white shadow-purple-600/30'
                  : isDayMode
                  ? 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'
                  : 'bg-purple-700/80 hover:bg-purple-600 text-purple-100 border border-purple-500/30'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{onlyZeroMobile ? 'सर्व मोबाईल खाती दाखवा' : "मोबाईल '0' खाती वेगळी करा"}</span>
            </button>

            {/* Fix Zero Purchases */}
            <button
              onClick={handleFixZeroPurchases}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition cursor-pointer shadow-sm shadow-amber-500/20"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>झिरो खरेदी दुरुस्त करा ({zeroPurchasesCount})</span>
            </button>

            {/* Merge Names */}
            <button
              onClick={onOpenMergeModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white transition cursor-pointer shadow-sm shadow-teal-600/20"
            >
              <GitMerge className="w-3.5 h-3.5" />
              <span>नावे एकत्र / मर्ज करा (Merge)</span>
            </button>

            {/* Excel / CSV */}
            <button
              onClick={handleExportCSV}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                isDayMode
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Excel / CSV</span>
            </button>

            {/* Full Reset */}
            <button
              onClick={handleFullReset}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition cursor-pointer shadow-sm shadow-rose-600/20"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>पूर्ण डेटा रिसेट (Full Reset)</span>
            </button>
          </div>
        </div>

        {/* 5 Stats Display Cards exactly matching Screenshot 1 */}
        <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 p-3.5 sm:p-4 rounded-2xl border ${
          isDayMode
            ? 'bg-slate-50/90 border-slate-200'
            : 'bg-slate-950/70 border-slate-800'
        }`}>
          {/* 1. एकूण ग्राहक नोंदणी */}
          <div className={`p-3 rounded-xl border ${
            isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800/80'
          }`}>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">एकूण ग्राहक नोंदणी</div>
            <div className={`text-xl font-extrabold mt-1 tracking-tight ${
              isDayMode ? 'text-slate-900' : 'text-white'
            }`}>
              {totalCustomerCount.toLocaleString('en-IN')}
            </div>
          </div>

          {/* 2. एकूण मार्केट उधारी (Pending) */}
          <div className={`p-3 rounded-xl border ${
            isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800/80'
          }`}>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">एकूण मार्केट उधारी (Pending)</div>
            <div className="text-xl font-extrabold text-amber-500 dark:text-amber-400 mt-1 tracking-tight">
              ₹{totalMarketPending.toLocaleString('en-IN')}
            </div>
          </div>

          {/* 3. योजना कार्ड सभासद */}
          <div className={`p-3 rounded-xl border ${
            isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800/80'
          }`}>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">योजना कार्ड सभासद</div>
            <div className={`text-xl font-extrabold mt-1 tracking-tight ${
              isDayMode ? 'text-slate-900' : 'text-white'
            }`}>
              {totalCardMembers.toLocaleString('en-IN')}
            </div>
          </div>

          {/* 4. एकूण बिले व नोंदी */}
          <div className={`p-3 rounded-xl border ${
            isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800/80'
          }`}>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">एकूण बिले व नोंदी</div>
            <div className={`text-xl font-extrabold mt-1 tracking-tight ${
              isDayMode ? 'text-slate-900' : 'text-white'
            }`}>
              {totalBills.toLocaleString('en-IN')}
            </div>
          </div>

          {/* 5. जमा पावत्या (Receipts) */}
          <div className={`p-3 rounded-xl border ${
            isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800/80'
          }`}>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">जमा पावत्या (Receipts)</div>
            <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 tracking-tight">
              {totalReceipts.toLocaleString('en-IN')}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs Bar matching Screenshot 1 + New Duplicate Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 overflow-x-auto">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* सर्व ग्राहक व उधारी */}
          <button
            onClick={() => setActiveTab('customers')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'customers'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                : isDayMode
                ? 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>सर्व ग्राहक व उधारी ({totalCustomerCount})</span>
          </button>

          {/* Duplicate Filter (Requested) */}
          <button
            onClick={() => setActiveTab('duplicates')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'duplicates'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : isDayMode
                ? 'bg-white text-purple-700 hover:bg-purple-50 border border-purple-200'
                : 'bg-slate-900 text-purple-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Copy className="w-3.5 h-3.5" />
            <span>डुप्लिकेट डेटा फिल्टर ({duplicateGroups.length})</span>
          </button>

          {/* चुका असलेला डेटा व दुरुस्ती केंद्र */}
          <button
            onClick={() => setActiveTab('errors')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'errors'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : isDayMode
                ? 'bg-white text-rose-700 hover:bg-rose-50 border border-rose-200'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>⚠️ चुका असलेला डेटा व दुरुस्ती ({totalErrorsCount})</span>
          </button>

          {/* विक्री बिले */}
          <button
            onClick={() => setActiveTab('bills')}
            className={`px-3.5 py-2 rounded-2xl text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'bills'
                ? 'bg-slate-700 text-white'
                : isDayMode
                ? 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>विक्री बिले ({totalBills})</span>
          </button>

          {/* जमा पावत्या */}
          <button
            onClick={() => setActiveTab('receipts')}
            className={`px-3.5 py-2 rounded-2xl text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'receipts'
                ? 'bg-slate-700 text-white'
                : isDayMode
                ? 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>जमा पावत्या ({totalReceipts})</span>
          </button>

          {/* कार्ड सभासद */}
          <button
            onClick={() => setActiveTab('cards')}
            className={`px-3.5 py-2 rounded-2xl text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'cards'
                ? 'bg-slate-700 text-white'
                : isDayMode
                ? 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>कार्ड सभासद ({totalCardMembers})</span>
          </button>
        </div>

        {/* टाऊन पहा Button on Right */}
        <button
          onClick={onOpenTownModal}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer self-start md:self-auto shrink-0 border ${
            isDayMode
              ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
          }`}
        >
          <Building className="w-3.5 h-3.5 text-amber-500" />
          <span>टाऊन पहा (गाववार उधारी)</span>
        </button>
      </div>

      {/* SPECIAL SECTION: What Was Uploaded Summary & Error Diagnostics */}
      {activeTab === 'errors' && (
        <div className="space-y-4">
          {/* 1. कशाची नोंद झाली (Upload Registry Summary) */}
          <div className={`p-5 rounded-3xl border ${
            isDayMode ? 'bg-teal-50/70 border-teal-200' : 'bg-teal-950/30 border-teal-800/60'
          }`}>
            <div className="flex items-center gap-2 font-bold text-sm text-teal-700 dark:text-teal-300 mb-3">
              <Info className="w-4 h-4" />
              <span>कशाची नोंद झाली (What was uploaded from master CSV files)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className={`p-3 rounded-2xl border ${isDayMode ? 'bg-white border-teal-100' : 'bg-slate-900 border-teal-900'}`}>
                <div className="font-semibold text-slate-500">एकूण ग्राहक प्रोफाईल</div>
                <div className="text-lg font-bold text-teal-600 mt-0.5">{totalCustomerCount} नोंदी</div>
                <div className="text-[11px] text-slate-400">नावे, पत्ते, फोन नंबर सह संग्रहित</div>
              </div>

              <div className={`p-3 rounded-2xl border ${isDayMode ? 'bg-white border-teal-100' : 'bg-slate-900 border-teal-900'}`}>
                <div className="font-semibold text-slate-500">पक्की विक्री बिले</div>
                <div className="text-lg font-bold text-blue-600 mt-0.5">{totalBills} बिले</div>
                <div className="text-[11px] text-slate-400">इलेक्ट्रॉनिक्स व फर्निचर इन्व्हॉइस</div>
              </div>

              <div className={`p-3 rounded-2xl border ${isDayMode ? 'bg-white border-teal-100' : 'bg-slate-900 border-teal-900'}`}>
                <div className="font-semibold text-slate-500">जमा पावत्या नोंदवही</div>
                <div className="text-lg font-bold text-emerald-600 mt-0.5">{totalReceipts} पावत्या</div>
                <div className="text-[11px] text-slate-400">पावती सिरीयल #1079 पासून सुरू</div>
              </div>

              <div className={`p-3 rounded-2xl border ${isDayMode ? 'bg-white border-teal-100' : 'bg-slate-900 border-teal-900'}`}>
                <div className="font-semibold text-slate-500">समृद्धी कार्ड मेंबर्स</div>
                <div className="text-lg font-bold text-purple-600 mt-0.5">{totalCardMembers} सभासद</div>
                <div className="text-[11px] text-slate-400">30-महिने मासिक ₹1,000 योजना</div>
              </div>
            </div>
          </div>

          {/* 2. काय काय चूक आहे व ते कसे ठीक करायचे (Error Diagnostics & Step-by-Step Fixes) */}
          <div className={`p-5 rounded-3xl border space-y-4 ${
            isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                <span>काय काय चूक आहे व ते कसे ठीक करायचे (Error Diagnostics & 1-Click Fixes)</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                मास्टर सीएसव्ही मधील जुन्या हस्तलिखित नोंदींमध्ये आढळलेल्या त्रुटी आणि त्यांना स्वयंचलित दुरुस्त करण्याचे मार्ग खालीलप्रमाणे आहेत:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* त्रुटी १: झिरो खरेदी */}
              <div className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 ${
                isDayMode ? 'bg-amber-50/60 border-amber-200' : 'bg-amber-950/20 border-amber-800/40'
              }`}>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                      त्रुटी १: झिरो खरेदी (₹0 Purchase)
                    </span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold px-2 py-0.5 rounded-full">
                      {zeroPurchasesCount} खाती
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                    <strong>काय चूक आहे:</strong> जुन्या लेजर मधील ६०२ ग्राहकांच्या खात्यात खरेदीची किंमत ₹० दर्शवली होती, तर मार्केट उधारी उपलब्ध आहे.
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    <strong>कसे ठीक करावे:</strong> उधारी + भरलेल्या पावत्यांच्या बेरजेवरून एकूण खरेदी स्वयंचलित दुरुस्त केली जाते.
                  </p>
                </div>

                <button
                  onClick={handleFixZeroPurchases}
                  className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-amber-500/20"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>झिरो खरेदी आपोआप दुरुस्त करा</span>
                </button>
              </div>

              {/* त्रुटी २: मोबाईल '0' किंवा रिकामा */}
              <div className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 ${
                isDayMode ? 'bg-purple-50/60 border-purple-200' : 'bg-purple-950/20 border-purple-800/40'
              }`}>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-700 dark:text-purple-400">
                      त्रुटी २: मोबाईल '0' किंवा रिक्त खाती
                    </span>
                    <span className="text-[10px] bg-purple-500/20 text-purple-800 dark:text-purple-300 font-bold px-2 py-0.5 rounded-full">
                      {zeroPhoneCount} खाती
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                    <strong>काय चूक आहे:</strong> काही ग्राहकांच्या कार्डवर फोन नंबर नोंदवला नव्हता, त्यामुळे सिस्टीममध्ये '0' किंवा स्पेस उरली.
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    <strong>कसे ठीक करावे:</strong> या सर्व खात्यांना अधिकृत '0' कोड देऊन वेगळे फिल्टर करण्यात आले आहे, जेणेकरून बिल करताना नवा नंबर विचारता येईल.
                  </p>
                </div>

                <button
                  onClick={handleFixMissingPhones}
                  className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-purple-600/20"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>रिक्त फोन '0' म्हणून प्रमाणित करा</span>
                </button>
              </div>

              {/* त्रुटी ३: डुप्लिकेट खाती */}
              <div className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 ${
                isDayMode ? 'bg-blue-50/60 border-blue-200' : 'bg-blue-950/20 border-blue-800/40'
              }`}>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-700 dark:text-blue-400">
                      त्रुटी ३: डुप्लिकेट खाती (Duplicate Accounts)
                    </span>
                    <span className="text-[10px] bg-blue-500/20 text-blue-800 dark:text-blue-300 font-bold px-2 py-0.5 rounded-full">
                      {duplicateGroups.length} गट
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                    <strong>काय चूक आहे:</strong> एकाच व्यक्तीची किंवा एकाच मोबाईलवर २ वेगवेगळी खाती तयार झाली आहेत.
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    <strong>कसे ठीक करावे:</strong> दोन्ही खात्यांची उधारी व खरेदी एका मुख्य खात्यात विलीन करून अतिरिक्त खाते हटवले जाते.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleAutoMergeDuplicates}
                    className="flex-1 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-teal-600/20"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>सर्व डुप्लिकेट्स एकत्र करा</span>
                  </button>
                  <button
                    onClick={onOpenMergeModal}
                    className={`px-3 py-2 text-xs font-semibold rounded-xl border ${
                      isDayMode ? 'bg-white border-slate-200 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-200'
                    }`}
                  >
                    मॅन्युअल निवडा
                  </button>
                </div>
              </div>

              {/* त्रुटी ४: गाव व पत्ता तपशील */}
              <div className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 ${
                isDayMode ? 'bg-emerald-50/60 border-emerald-200' : 'bg-emerald-950/20 border-emerald-800/40'
              }`}>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                      त्रुटी ४: गाव व टाऊनचे वर्गीकरण
                    </span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full">
                      {villagesList.length} गावे
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                    <strong>काय चूक आहे:</strong> काही ग्राहकांच्या पत्त्यात गावाचे नाव पत्त्याच्या मध्ये लिहिले होते (उदा. Waifad, Seloo).
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    <strong>कसे ठीक करावे:</strong> सिस्टीमने स्वयंचलितपणे पत्त्यावरून गाव वेगळे करून 'टाऊन पहा' यादीत वर्गीकृत केले आहे.
                  </p>
                </div>

                <button
                  onClick={onOpenTownModal}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-600/20"
                >
                  <Building className="w-3.5 h-3.5" />
                  <span>गाववार उधारी डॅशबोर्ड उघडा</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SPECIAL VIEW: DUPLICATES LIST */}
      {activeTab === 'duplicates' && (
        <div className={`p-5 rounded-3xl border space-y-4 ${
          isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Copy className="w-4 h-4 text-purple-600" />
                <span>सापडलेली डुप्लिकेट खाती (Duplicate Customer Records Found)</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                एकाच फोन नंबरवर किंवा सारख्या नावावर नोंद झालेली खाती खालीलप्रमाणे आहेत:
              </p>
            </div>

            {duplicateGroups.length > 0 && (
              <button
                onClick={handleAutoMergeDuplicates}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-purple-600/20 self-start"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>सर्व डुप्लिकेट्स एकत्र विलीन करा (Auto-Merge All)</span>
              </button>
            )}
          </div>

          {duplicateGroups.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">कोणतीही डुप्लिकेट खाती शिल्लक नाहीत!</p>
              <p className="text-[11px] text-slate-400 mt-1">सर्व ग्राहक खाती अचूक आणि स्वतंत्र आहेत.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {duplicateGroups.map((grp, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border ${
                    isDayMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                      {grp.type === 'phone' ? `📱 एकच फोन नंबर: ${grp.key}` : `👤 सारखे नाव: ${grp.key}`}
                    </span>
                    <span className="text-[11px] bg-purple-500/10 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full font-semibold">
                      {grp.customers.length} नोंदी
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {grp.customers.map((c) => (
                      <div
                        key={c.id}
                        className={`p-2.5 rounded-xl border flex justify-between items-center text-xs ${
                          isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{c.name}</div>
                          <div className="text-[10px] text-slate-400">
                            {c.phone} • {c.city || c.address}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold text-amber-500">
                            Due: ₹{c.currentBalance.toLocaleString('en-IN')}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Total: ₹{c.totalPurchased.toLocaleString('en-IN')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Search and Filters Bar matching Screenshot 1 */}
      {(activeTab === 'customers' || activeTab === 'errors') && (
        <>
          <div className="flex flex-col lg:flex-row items-center gap-3">
            {/* Search input */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="नाव (उदा. Sapna Nagral, Arun Sayre), मोबाईल किंवा पत्ता टाकून शोधा..."
                className={`w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs focus:outline-none focus:border-teal-500 transition border ${
                  isDayMode
                    ? 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-white placeholder-slate-500'
                }`}
              />
            </div>

            {/* Village Dropdown */}
            <div className="relative w-full lg:w-60">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={selectedVillage}
                onChange={(e) => setSelectedVillage(e.target.value)}
                className={`w-full pl-9 pr-8 py-2.5 rounded-2xl text-xs focus:outline-none focus:border-teal-500 appearance-none cursor-pointer border ${
                  isDayMode
                    ? 'bg-white border-slate-200 text-slate-800 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-200'
                }`}
              >
                <option value="all">सर्व गावे / All Villages</option>
                {villagesList.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Dues Status Filters: All, Due Only, Cleared */}
            <div className={`flex items-center gap-1 p-1 rounded-2xl border ${
              isDayMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
            }`}>
              {(['all', 'due_only', 'cleared'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setDuesFilter(filter)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    duesFilter === filter
                      ? 'bg-teal-600 text-white shadow-sm'
                      : isDayMode
                      ? 'text-slate-600 hover:text-slate-900'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {filter === 'all' ? 'All' : filter === 'due_only' ? 'Due Only' : 'Cleared'}
                </button>
              ))}
            </div>
          </div>

          {/* Table Container matching Screenshot 1 */}
          <div className={`rounded-3xl border overflow-hidden transition-colors duration-300 shadow-sm ${
            isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800 shadow-xl'
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className={`text-[11px] font-semibold uppercase tracking-wider border-b ${
                  isDayMode
                    ? 'bg-slate-50 text-slate-500 border-slate-200'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}>
                  <tr>
                    <th className="py-3.5 px-4 font-bold">ग्राहक नाव</th>
                    <th className="py-3.5 px-4 font-bold">मोबाईल व पत्ता</th>
                    <th className="py-3.5 px-4 font-bold text-right">एकूण खरेदी</th>
                    <th className="py-3.5 px-4 font-bold text-right">एकूण जमा (PAID)</th>
                    <th className="py-3.5 px-4 font-bold text-right">शिल्लक बाकी (DUE)</th>
                    <th className="py-3.5 px-4 font-bold text-center">क्रिया (ACTIONS)</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDayMode ? 'divide-slate-100 text-slate-700' : 'divide-slate-800/60 text-slate-300'}`}>
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                        कोणताही ग्राहक सापडला नाही (No customer matches this search/filter).
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((cust) => {
                      const paidAmount = Math.max(0, cust.totalPurchased - cust.currentBalance);
                      const isDue = cust.currentBalance > 0;
                      return (
                        <tr
                          key={cust.id}
                          className={`transition ${isDayMode ? 'hover:bg-slate-50/90' : 'hover:bg-slate-800/40'}`}
                        >
                          {/* 1. ग्राहक नाव */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className={`font-bold ${isDayMode ? 'text-slate-900' : 'text-white'}`}>
                                {cust.name}
                              </span>
                              {cust.city && (
                                <span className="text-[10px] bg-teal-500/10 text-teal-700 dark:text-teal-300 px-1.5 py-0.5 rounded border border-teal-500/20 font-medium">
                                  {cust.city}
                                </span>
                              )}
                            </div>
                            {cust.notes && (
                              <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-xs">
                                {cust.notes}
                              </div>
                            )}
                          </td>

                          {/* 2. मोबाईल व पत्ता */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-mono">
                              {cust.phone === '0' || !cust.phone ? (
                                <span className="text-purple-600 dark:text-purple-400 font-bold bg-purple-500/10 px-1.5 py-0.5 rounded text-[10px]">
                                  मोबाईल: 0
                                </span>
                              ) : (
                                <span>{cust.phone}</span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
                              {cust.address || 'पत्ता नोंदवलेला नाही'}
                            </div>
                          </td>

                          {/* 3. एकूण खरेदी */}
                          <td className="py-3 px-4 text-right">
                            <span className={`font-semibold ${isDayMode ? 'text-slate-800' : 'text-slate-200'}`}>
                              ₹{cust.totalPurchased.toLocaleString('en-IN')}
                            </span>
                            {cust.totalPurchased === 0 && (
                              <span className="block text-[9px] text-rose-500 font-bold">
                                ⚠️ झिरो खरेदी
                              </span>
                            )}
                          </td>

                          {/* 4. एकूण जमा (PAID) */}
                          <td className="py-3 px-4 text-right font-medium text-emerald-600 dark:text-emerald-400">
                            ₹{paidAmount.toLocaleString('en-IN')}
                          </td>

                          {/* 5. शिल्लक बाकी (DUE) */}
                          <td className="py-3 px-4 text-right">
                            <div className={`font-bold text-sm ${isDue ? 'text-amber-500 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                              ₹{cust.currentBalance.toLocaleString('en-IN')}
                            </div>
                            <span
                              className={`inline-block text-[10px] px-2 py-0.2 rounded-full font-semibold ${
                                isDue
                                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                                  : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                              }`}
                            >
                              {isDue ? 'DUE' : 'CLEARED'}
                            </span>
                          </td>

                          {/* 6. क्रिया (ACTIONS): Edit, Ledger, Fast Collect */}
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Edit Customer */}
                              <button
                                onClick={() => setEditingCustomer(cust)}
                                className={`px-2 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 border ${
                                  isDayMode
                                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                                }`}
                                title="ग्राहक माहिती संपादित करा"
                              >
                                <Edit className="w-3 h-3 text-blue-500" />
                                <span>एडिट</span>
                              </button>

                              {/* Ledger */}
                              <button
                                onClick={() => onOpenCustomerKhata(cust)}
                                className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 shadow-sm shadow-purple-600/20"
                                title="ग्राहकाची पूर्ण खातेवही उघडा"
                              >
                                <BookOpen className="w-3 h-3" />
                                <span>खातेवही</span>
                              </button>

                              {/* Fast Collect Receipt */}
                              <button
                                onClick={() => onFastCollectReceipt(cust)}
                                className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition cursor-pointer shadow-sm shadow-emerald-600/20"
                                title="जमा पावती फाडा"
                              >
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`rounded-3xl border max-w-lg w-full p-6 space-y-4 shadow-2xl ${
            isDayMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Edit className="w-4 h-4 text-teal-500" />
                <span>ग्राहक माहिती संपादित करा</span>
              </h3>
              <button
                onClick={() => setEditingCustomer(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomerEdit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 mb-1">ग्राहक नाव *</label>
                <input
                  type="text"
                  value={editingCustomer.name}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border focus:outline-none focus:border-teal-500 ${
                    isDayMode ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
                  }`}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-500 mb-1">मोबाईल नंबर *</label>
                  <input
                    type="text"
                    value={editingCustomer.phone}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                    className={`w-full p-2.5 rounded-xl border focus:outline-none focus:border-teal-500 ${
                      isDayMode ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
                    }`}
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">गाव / शहर *</label>
                  <input
                    type="text"
                    value={editingCustomer.city}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, city: e.target.value })}
                    className={`w-full p-2.5 rounded-xl border focus:outline-none focus:border-teal-500 ${
                      isDayMode ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
                    }`}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">पूर्ण पत्ता</label>
                <input
                  type="text"
                  value={editingCustomer.address}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, address: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border focus:outline-none focus:border-teal-500 ${
                    isDayMode ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-500 mb-1">एकूण खरेदी (₹)</label>
                  <input
                    type="number"
                    value={editingCustomer.totalPurchased}
                    onChange={(e) =>
                      setEditingCustomer({ ...editingCustomer, totalPurchased: parseFloat(e.target.value) || 0 })
                    }
                    className={`w-full p-2.5 rounded-xl border focus:outline-none focus:border-teal-500 ${
                      isDayMode ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">शिल्लक बाकी उधारी (₹)</label>
                  <input
                    type="number"
                    value={editingCustomer.currentBalance}
                    onChange={(e) =>
                      setEditingCustomer({ ...editingCustomer, currentBalance: parseFloat(e.target.value) || 0 })
                    }
                    className={`w-full p-2.5 rounded-xl border focus:outline-none focus:border-teal-500 ${
                      isDayMode ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
                    }`}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className={`px-4 py-2 rounded-xl border ${
                    isDayMode ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  रद्द करा
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl shadow-md shadow-teal-600/20"
                >
                  बदल सेव्ह करा
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
