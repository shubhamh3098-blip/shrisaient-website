import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  Receipt,
  Printer,
  CreditCard,
  CheckCircle,
  Phone,
  MapPin,
  FileText,
  Clock,
  X,
  Share2,
  BookOpen,
  ArrowUpDown,
  Filter,
  AlertTriangle,
  GitMerge,
  Building2,
  Table,
  LayoutGrid,
  TrendingDown,
  TrendingUp,
  DollarSign,
  Edit3
} from 'lucide-react';
import { BillReceipt, Customer, StoreData } from '../../types';
import { StorageService } from '../../services/storageService';
import { useTheme } from '../../context/ThemeContext';
import { EditCustomerModal } from './EditCustomerModal';

interface CustomersViewProps {
  storeData: StoreData;
  onRefreshData: () => void;
  onPrintReceipt: (receipt: BillReceipt) => void;
  onOpenCustomerKhata?: (customer: Customer) => void;
  onFastCollectReceipt?: (customer: Customer) => void;
  onOpenMergeModal?: () => void;
  onOpenTownModal?: () => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  storeData,
  onRefreshData,
  onPrintReceipt,
  onOpenCustomerKhata,
  onFastCollectReceipt,
  onOpenMergeModal,
  onOpenTownModal,
}) => {
  const { isDayMode } = useTheme();

  // Tabs & Views
  const [activeTab, setActiveTab] = useState<'customers' | 'receipts'>('customers');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [dueFilter, setDueFilter] = useState<'all' | 'due' | 'cleared'>('all');

  // Search, Village & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVillage, setSelectedVillage] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'due-desc' | 'due-asc' | 'purchase-desc' | 'name-asc'>('due-desc');

  // Modals
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [isCollectReceiptModalOpen, setIsCollectReceiptModalOpen] = useState(false);
  const [selectedCustomerForReceipt, setSelectedCustomerForReceipt] = useState<Customer | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Add Customer Form
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAltPhone, setFormAltPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formCity, setFormCity] = useState('Wardha');
  const [formCreditLimit, setFormCreditLimit] = useState(50000);
  const [formNotes, setFormNotes] = useState('');

  // Collect Receipt Form
  const [receiptAmount, setReceiptAmount] = useState<number>(0);
  const [receiptMode, setReceiptMode] = useState<BillReceipt['paymentMode']>('Cash');
  const [receiptInvoiceRef, setReceiptInvoiceRef] = useState<string>('');
  const [receiptRemarks, setReceiptRemarks] = useState<string>('');

  // Unique villages list
  const uniqueVillages = useMemo(() => {
    const set = new Set<string>();
    storeData.customers.forEach((c) => {
      const v = (c.city || c.address || '').trim();
      if (v) set.add(v);
    });
    return Array.from(set).sort();
  }, [storeData.customers]);

  // Potential duplicate accounts count (same name or same phone)
  const duplicateAccountsCount = useMemo(() => {
    const nameMap = new Map<string, number>();
    const phoneMap = new Map<string, number>();
    let dupCount = 0;

    storeData.customers.forEach((c) => {
      const n = c.name.trim().toLowerCase();
      nameMap.set(n, (nameMap.get(n) || 0) + 1);

      const p = c.phone ? c.phone.replace(/[^0-9]/g, '') : '';
      if (p && p.length >= 10 && p !== '0') {
        phoneMap.set(p, (phoneMap.get(p) || 0) + 1);
      }
    });

    nameMap.forEach((cnt) => {
      if (cnt > 1) dupCount += cnt;
    });
    phoneMap.forEach((cnt) => {
      if (cnt > 1) dupCount += cnt;
    });

    return Math.min(dupCount, 30);
  }, [storeData.customers]);

  // Overall totals
  const totalDues = useMemo(
    () => storeData.customers.reduce((a, c) => a + (c.currentBalance || 0), 0),
    [storeData.customers]
  );
  const dueCount = useMemo(
    () => storeData.customers.filter((c) => c.currentBalance > 0).length,
    [storeData.customers]
  );
  const clearedCount = useMemo(
    () => storeData.customers.filter((c) => c.currentBalance <= 0).length,
    [storeData.customers]
  );

  // Filtered and sorted customers list
  const filteredCustomers = useMemo(() => {
    let result = storeData.customers.filter((c) => {
      // 1. Search query
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q)) ||
        (c.city && c.city.toLowerCase().includes(q));

      // 2. Village filter
      const matchVillage =
        selectedVillage === 'all' ||
        (c.city && c.city.toLowerCase() === selectedVillage.toLowerCase()) ||
        (c.address && c.address.toLowerCase().includes(selectedVillage.toLowerCase()));

      // 3. Due filter
      const matchDue =
        dueFilter === 'all' ||
        (dueFilter === 'due' && c.currentBalance > 0) ||
        (dueFilter === 'cleared' && c.currentBalance <= 0);

      return matchSearch && matchVillage && matchDue;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'due-desc') return (b.currentBalance || 0) - (a.currentBalance || 0);
      if (sortBy === 'due-asc') return (a.currentBalance || 0) - (b.currentBalance || 0);
      if (sortBy === 'purchase-desc') return (b.totalPurchased || 0) - (a.totalPurchased || 0);
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      return 0;
    });

    return result;
  }, [storeData.customers, searchQuery, selectedVillage, dueFilter, sortBy]);

  // WhatsApp 1-Click Statement Share from Card
  const handleQuickWhatsApp = (cust: Customer) => {
    const totalPurchased = cust.totalPurchased || 0;
    const currentBalance = cust.currentBalance || 0;
    const totalPaid = Math.max(0, totalPurchased - currentBalance);

    const shop = storeData.settings;
    const text = `*${shop.storeName || 'श्री साई एंटरप्रायझेस'}, वर्धा*
*ग्राहक खातेवही सारांश (Customer Ledger)*
----------------------------------------
👤 ग्राहक: *${cust.name}*
📍 गाव / पत्ता: ${cust.address || cust.city || 'वर्धा'}
📦 एकूण खरेदी: ₹${totalPurchased.toLocaleString('en-IN')}
✅ एकूण जमा: ₹${totalPaid.toLocaleString('en-IN')}
----------------------------------------
🔴 *शिल्लक बाकी (Balance Due): ₹${currentBalance.toLocaleString('en-IN')}*
----------------------------------------
💳 UPI ID: *${shop.bankDetails.upiId || 'shrisaienterprises@sbi'}*

धन्यवाद! श्री साई एंटरप्रायझेस, मेन रोड, वर्धा. 
संपर्क: ${shop.phone || '+91 98220 11223'}`;

    const encoded = encodeURIComponent(text);
    const phone = cust.phone && cust.phone !== '0' ? cust.phone.replace(/[^0-9]/g, '') : '';
    window.open(`https://wa.me/${phone ? '91' + phone : ''}?text=${encoded}`, '_blank');
  };

  // Collect Money / Payment Receipt
  const openCollectReceiptModal = (cust: Customer) => {
    if (onFastCollectReceipt) {
      onFastCollectReceipt(cust);
      return;
    }
    setSelectedCustomerForReceipt(cust);
    setReceiptAmount(cust.currentBalance > 0 ? cust.currentBalance : 0);
    setReceiptMode('Cash');
    setReceiptInvoiceRef('');
    setReceiptRemarks('Part payment against invoice/account balance.');
    setIsCollectReceiptModalOpen(true);
  };

  const handleSaveReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerForReceipt || receiptAmount <= 0) {
      alert('कृपया योग्य जमा रक्कम प्रविष्ट करा.');
      return;
    }

    const newReceipt = StorageService.createBillReceipt({
      customerId: selectedCustomerForReceipt.id,
      customerName: selectedCustomerForReceipt.name,
      invoiceNo: receiptInvoiceRef.trim() || undefined,
      amountPaid: Number(receiptAmount),
      paymentMode: receiptMode,
      remarks: receiptRemarks.trim() || 'उधारी बिलाविरुद्ध जमा',
      handledBy: 'Counter Cashier',
    });

    onRefreshData();
    setIsCollectReceiptModalOpen(false);
    onPrintReceipt(newReceipt);
  };

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim()) {
      alert('कृपया ग्राहकाचे नाव आणि फोन नंबर टाका.');
      return;
    }

    StorageService.addCustomer({
      name: formName.trim().toUpperCase(),
      phone: formPhone.trim(),
      altPhone: formAltPhone.trim() || undefined,
      address: formAddress.trim() || 'Wardha',
      city: formCity.trim() || 'Wardha',
      creditLimit: Number(formCreditLimit),
      notes: formNotes.trim() || undefined,
    });

    onRefreshData();
    setIsAddCustomerModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Top Header Section - Clean & Uncluttered */}
      <div className={`p-3.5 sm:p-4 rounded-2xl border transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-3 ${
        isDayMode ? 'bg-white border-slate-200/90 shadow-xs' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <span>ग्राहक व उधारी खातेवही</span>
              <span className="text-xs font-normal text-slate-400 font-sans">Customer Khata</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              ग्राहकांची खाती, बाकी वसुली, ३०-महिने कार्ड व WhatsApp लेजर
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Toggle View: Grid vs Table */}
          <div className={`flex items-center p-1 rounded-xl border ${
            isDayMode ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>कार्ड व्ह्यू</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>रजिस्टर व्ह्यू</span>
            </button>
          </div>

          {/* Merge Duplicate Accounts Modal Button */}
          {onOpenMergeModal && (
            <button
              onClick={onOpenMergeModal}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 cursor-pointer ${
                isDayMode
                  ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
              }`}
              title="डुप्लिकेट खाती एकत्र करा"
            >
              <GitMerge className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">खाती एकत्र करा</span>
            </button>
          )}

          {/* Town / Village View Modal */}
          {onOpenTownModal && (
            <button
              onClick={onOpenTownModal}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 cursor-pointer ${
                isDayMode
                  ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
              }`}
              title="गाव निहाय उधारी वर्गीकरण"
            >
              <Building2 className="w-3.5 h-3.5 text-sky-500" />
              <span className="hidden sm:inline">गाव निहाय</span>
            </button>
          )}

          {/* New Customer Button */}
          <button
            onClick={() => {
              setFormName('');
              setFormPhone('');
              setFormAltPhone('');
              setFormAddress('');
              setFormCity('Wardha');
              setFormCreditLimit(50000);
              setFormNotes('');
              setIsAddCustomerModalOpen(true);
            }}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3.5 py-1.5 rounded-xl text-xs transition cursor-pointer shadow-xs active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ नवीन ग्राहक</span>
          </button>
        </div>
      </div>

      {/* Summary KPI 3-Cards Row - Clean & Spaced */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* KPI 1: Total Clients */}
        <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${
          isDayMode ? 'bg-white border-slate-200/90 shadow-xs' : 'bg-slate-900 border-slate-800'
        }`}>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              एकूण ग्राहक (Total Clients)
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {storeData.customers.length.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-slate-500">
              नोंदणीकृत ग्राहक डेटाबेस
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 2: Market Pending Dues */}
        <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${
          isDayMode ? 'bg-white border-slate-200/90 shadow-xs' : 'bg-slate-900 border-slate-800'
        }`}>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              बाकी मार्केट उधारी (Pending Dues)
            </div>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-0.5">
              ₹{totalDues.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-slate-500">
              {dueCount} ग्राहकांकडे उधारी बाकी
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 3: Due Filter Tabs */}
        <div className={`p-3 rounded-2xl border flex flex-col justify-center gap-1.5 ${
          isDayMode ? 'bg-white border-slate-200/90 shadow-xs' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            उधारी स्थिती फिल्टर
          </div>
          <div className={`grid grid-cols-3 gap-1 p-1 rounded-xl border ${
            isDayMode ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}>
            <button
              onClick={() => setDueFilter('all')}
              className={`py-1 px-1.5 rounded-lg text-xs font-bold transition cursor-pointer text-center ${
                dueFilter === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              सर्व ({storeData.customers.length})
            </button>
            <button
              onClick={() => setDueFilter('due')}
              className={`py-1 px-1.5 rounded-lg text-xs font-bold transition cursor-pointer text-center ${
                dueFilter === 'due'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              बाकीदार ({dueCount})
            </button>
            <button
              onClick={() => setDueFilter('cleared')}
              className={`py-1 px-1.5 rounded-lg text-xs font-bold transition cursor-pointer text-center ${
                dueFilter === 'cleared'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              निल ({clearedCount})
            </button>
          </div>
        </div>
      </div>

      {/* Duplicate Accounts Notice Banner - Slim & Non-intrusive */}
      {duplicateAccountsCount > 0 && onOpenMergeModal && (
        <div className={`px-3.5 py-2 rounded-xl border flex items-center justify-between gap-3 ${
          isDayMode
            ? 'bg-amber-50 border-amber-200/90 text-amber-900'
            : 'bg-amber-950/30 border-amber-800/40 text-amber-200'
        }`}>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="text-xs">
              <strong>{duplicateAccountsCount}</strong> संभाव्य डुप्लिकेट खाती आढळली. हिशोबाच्या अचूकतेसाठी खाती एकत्र करा.
            </span>
          </div>
          <button
            onClick={onOpenMergeModal}
            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition shrink-0 cursor-pointer shadow-xs"
          >
            खाती एकत्र करा
          </button>
        </div>
      )}

      {/* Search, Village and Sort Row */}
      <div className={`p-2.5 sm:p-3 rounded-2xl border flex flex-col md:flex-row items-center gap-2.5 ${
        isDayMode ? 'bg-white border-slate-200/90 shadow-xs' : 'bg-slate-900 border-slate-800'
      }`}>
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="ग्राहकाचे नाव, मोबाईल नंबर किंवा गाव शोधा..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full rounded-xl pl-9 pr-8 py-1.5 text-xs transition border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
              isDayMode
                ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                : 'bg-slate-950/70 border-slate-800 text-white placeholder-slate-500'
            }`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Village Dropdown */}
        <div className="w-full md:w-52 shrink-0">
          <select
            value={selectedVillage}
            onChange={(e) => setSelectedVillage(e.target.value)}
            className={`w-full rounded-xl px-2.5 py-1.5 text-xs border focus:outline-none focus:ring-1 focus:ring-amber-500 transition ${
              isDayMode
                ? 'bg-slate-50 border-slate-200 text-slate-800'
                : 'bg-slate-950 border-slate-800 text-slate-200'
            }`}
          >
            <option value="all">सर्व गावे (All Villages - {uniqueVillages.length})</option>
            {uniqueVillages.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Dropdown */}
        <div className="w-full md:w-52 shrink-0">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className={`w-full rounded-xl px-2.5 py-1.5 text-xs border focus:outline-none focus:ring-1 focus:ring-amber-500 transition ${
              isDayMode
                ? 'bg-slate-50 border-slate-200 text-slate-800'
                : 'bg-slate-950 border-slate-800 text-slate-200'
            }`}
          >
            <option value="due-desc">बाकी जास्त ते कमी (Highest Due)</option>
            <option value="due-asc">बाकी कमी ते जास्त (Lowest Due)</option>
            <option value="purchase-desc">खरेदी जास्त ते कमी (Highest Purchases)</option>
            <option value="name-asc">नाव अ-क्रमाने (A to Z)</option>
          </select>
        </div>
      </div>

      {/* Main Customers Content: Card Grid View OR Table Register View */}
      {viewMode === 'cards' ? (
        /* CARD GRID VIEW */
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2.5 px-1">
            <span>
              एकूण ग्राहक: <strong>{filteredCustomers.length}</strong>
            </span>
            <span>
              {dueFilter === 'due' ? 'फक्त बाकीदार ग्राहक' : dueFilter === 'cleared' ? 'फक्त निल ग्राहक' : 'सर्व खाती'}
            </span>
          </div>

          {filteredCustomers.length === 0 ? (
            <div className={`p-10 text-center rounded-2xl border ${
              isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}>
              <Users className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                कोणतेही ग्राहक सापडले नाहीत
              </p>
              <p className="text-xs text-slate-500 mt-1">
                कृपया शोधातील नाव तपासा किंवा फिल्टर बदला.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredCustomers.map((cust) => {
                const totalPurchased = cust.totalPurchased || 0;
                const currentBalance = cust.currentBalance || 0;
                const totalPaid = Math.max(0, totalPurchased - currentBalance);

                return (
                  <div
                    key={cust.id}
                    className={`rounded-2xl border p-3.5 flex flex-col justify-between transition hover:shadow-md ${
                      isDayMode
                        ? 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Top Row: Name, Village & Due Badge */}
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase truncate">
                            {cust.name}
                          </h3>
                          <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{cust.address || cust.city || 'Wardha'}</span>
                          </div>
                        </div>

                        {/* Due Badge */}
                        <div className="shrink-0">
                          {currentBalance > 0 ? (
                            <span className="text-xs px-2.5 py-1 rounded-full font-black bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                              बाकी: ₹{currentBalance.toLocaleString('en-IN')}
                            </span>
                          ) : (
                            <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              हिशोब पूर्ण
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Middle: Phone & Purchases/Paid Stats */}
                      <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 mb-2">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{cust.phone === '0' || !cust.phone ? 'मोबाईल उपलब्ध नाही' : cust.phone}</span>
                        </div>

                        <div className={`grid grid-cols-2 gap-2 p-2 rounded-xl border text-xs ${
                          isDayMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
                        }`}>
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                              एकूण खरेदी
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white">
                              ₹{totalPurchased.toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                              एकूण जमा
                            </span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              ₹{totalPaid.toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
                      {/* 1. Primary Button: खातेवही हिशोब */}
                      <button
                        onClick={() => onOpenCustomerKhata && onOpenCustomerKhata(cust)}
                        className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                          isDayMode
                            ? 'bg-slate-900 hover:bg-slate-800 text-white'
                            : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                        }`}
                        title="खातेवही हिशोब उघडा"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                        <span className="truncate">खातेवही (Khata)</span>
                      </button>

                      {/* 2. Receive Payment Button */}
                      <button
                        onClick={() => openCollectReceiptModal(cust)}
                        className="py-1.5 px-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition flex items-center justify-center gap-1 cursor-pointer shadow-xs active:scale-95"
                        title="जमा पावती बनवा"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>पावती</span>
                      </button>

                      {/* 3. Edit / Fix Mistakes Button */}
                      <button
                        onClick={() => setEditingCustomer(cust)}
                        className={`p-1.5 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 border ${
                          isDayMode
                            ? 'bg-slate-100 hover:bg-blue-50 text-blue-600 border-slate-200'
                            : 'bg-slate-800 hover:bg-blue-900/30 text-blue-400 border-slate-700'
                        }`}
                        title="खाते दुरुस्त करा"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {/* 4. WhatsApp Direct Share */}
                      <button
                        onClick={() => handleQuickWhatsApp(cust)}
                        className="p-1.5 rounded-xl text-xs font-bold bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600/20 border border-emerald-500/20 transition cursor-pointer active:scale-95"
                        title="WhatsApp वर हिशोब पाठवा"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* TABLE REGISTER VIEW ("सर्व डेटा रजिस्टर") */
        <div className={`rounded-2xl border overflow-hidden shadow-xs ${
          isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className={`uppercase text-[10px] tracking-wider border-b ${
                isDayMode
                  ? 'bg-slate-50 text-slate-500 border-slate-200'
                  : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}>
                <tr>
                  <th className="py-2.5 px-3.5">ग्राहक नाव</th>
                  <th className="py-2.5 px-3.5">मोबाईल</th>
                  <th className="py-2.5 px-3.5">गाव / पत्ता</th>
                  <th className="py-2.5 px-3.5 text-right">एकूण खरेदी</th>
                  <th className="py-2.5 px-3.5 text-right">बाकी उधारी</th>
                  <th className="py-2.5 px-3.5 text-right">क्रेडिट लिमिट</th>
                  <th className="py-2.5 px-3.5 text-center">कृती</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredCustomers.map((cust) => (
                  <tr
                    key={cust.id}
                    className={`transition ${
                      isDayMode ? 'hover:bg-slate-50' : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {cust.name}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {cust.phone === '0' || !cust.phone ? 'मोबाईल नाही' : cust.phone}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {cust.address || cust.city || 'वर्धा'}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-800 dark:text-slate-200">
                      ₹{(cust.totalPurchased || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {cust.currentBalance > 0 ? (
                        <span className="font-black text-rose-600 dark:text-rose-400">
                          ₹{cust.currentBalance.toLocaleString('en-IN')}
                        </span>
                      ) : (
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          पूर्ण (₹0)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-400">
                      ₹{cust.creditLimit.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onOpenCustomerKhata && onOpenCustomerKhata(cust)}
                          className="px-2 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] transition flex items-center gap-1 cursor-pointer"
                        >
                          <BookOpen className="w-3 h-3" />
                          <span>Khata (खातेवही)</span>
                        </button>
                        <button
                          onClick={() => openCollectReceiptModal(cust)}
                          className="px-2 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] transition flex items-center gap-1 cursor-pointer"
                        >
                          <Receipt className="w-3 h-3" />
                          <span>Receipt (पावती)</span>
                        </button>
                        <button
                          onClick={() => setEditingCustomer(cust)}
                          className={`p-1.5 rounded-lg border font-bold text-[11px] transition flex items-center gap-1 cursor-pointer ${
                            isDayMode
                              ? 'bg-slate-100 hover:bg-blue-50 text-blue-600 border-slate-200'
                              : 'bg-slate-800 hover:bg-blue-900/30 text-blue-400 border-slate-700'
                          }`}
                          title="खाते दुरुस्त करा (Edit Info / Fix Balance)"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>दुरुस्त करा</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Collect Receipt Modal (When not using fast receipt) */}
      {isCollectReceiptModalOpen && selectedCustomerForReceipt && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border ${
            isDayMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <div className={`px-5 py-4 border-b flex items-center justify-between ${
              isDayMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}>
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold">
                  Official Bill Receipt #{storeData.settings.nextReceiptNo || 1079} <span className="text-xs font-normal text-slate-400 font-sans">(अधिकृत जमा पावती)</span>
                </h3>
              </div>
              <button
                onClick={() => setIsCollectReceiptModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveReceipt} className="p-5 space-y-4 text-xs">
              <div className={`p-3 rounded-xl border ${
                isDayMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
              }`}>
                <div className="font-bold text-sm text-slate-900 dark:text-white">
                  {selectedCustomerForReceipt.name}
                </div>
                <div className="text-slate-500 text-xs mt-0.5">
                  Current Pending Dues: <strong className="text-rose-500">₹{selectedCustomerForReceipt.currentBalance.toLocaleString('en-IN')}</strong> <span className="text-[10px] opacity-75">(सध्याची बाकी उधारी)</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] uppercase font-bold text-slate-500 block mb-1">
                  Amount Received * <span className="text-[10px] font-normal opacity-75">(जमा रक्कम)</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={selectedCustomerForReceipt.currentBalance || 999999}
                  value={receiptAmount}
                  onChange={(e) => setReceiptAmount(Number(e.target.value))}
                  className={`w-full rounded-xl px-3 py-2 text-sm font-bold border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                    isDayMode ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                />
              </div>

              <div>
                <label className="text-[11px] uppercase font-bold text-slate-500 block mb-1">
                  Payment Mode <span className="text-[10px] font-normal opacity-75">(पेमेंट मोड)</span>
                </label>
                <select
                  value={receiptMode}
                  onChange={(e) => setReceiptMode(e.target.value as any)}
                  className={`w-full rounded-xl px-3 py-2 border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                    isDayMode ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                >
                  <option value="Cash">Cash (काउंटर रोख)</option>
                  <option value="UPI">UPI (GooglePay / PhonePe / QR)</option>
                  <option value="Cheque">Cheque (धनादेश)</option>
                  <option value="Card">Card (POS स्वाइप)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] uppercase font-bold text-slate-500 block mb-1">
                  Remarks / Notes <span className="text-[10px] font-normal opacity-75">(शेरा / टीप)</span>
                </label>
                <input
                  type="text"
                  value={receiptRemarks}
                  onChange={(e) => setReceiptRemarks(e.target.value)}
                  placeholder="e.g. Part payment against dues (उधारी बिलाविरुद्ध जमा)..."
                  className={`w-full rounded-xl px-3 py-2 border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                    isDayMode ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCollectReceiptModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white"
                >
                  Cancel (रद्द करा)
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  Save & Print Receipt (पावती सेव्ह व प्रिंट करा)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Customer Modal */}
      {isAddCustomerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border ${
            isDayMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <div className={`px-5 py-4 border-b flex items-center justify-between ${
              isDayMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}>
              <h3 className="text-sm font-bold">
                Add New Customer Account <span className="text-xs font-normal text-slate-400 font-sans">(नवीन ग्राहक खाते जोडा)</span>
              </h3>
              <button
                onClick={() => setIsAddCustomerModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="text-[11px] uppercase font-bold text-slate-500 block mb-1">
                  Customer Full Name * <span className="text-[10px] font-normal opacity-75">(ग्राहकाचे पूर्ण नाव)</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SAPNA NAGRALE"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className={`w-full rounded-xl px-3 py-2 border uppercase focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                    isDayMode ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] uppercase font-bold text-slate-500 block mb-1">
                    Mobile Number * <span className="text-[10px] font-normal opacity-75">(मोबाईल)</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+91..."
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className={`w-full rounded-xl px-3 py-2 border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                      isDayMode ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-[11px] uppercase font-bold text-slate-500 block mb-1">
                    Alt Phone <span className="text-[10px] font-normal opacity-75">(पर्यायी फोन)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Alternate phone..."
                    value={formAltPhone}
                    onChange={(e) => setFormAltPhone(e.target.value)}
                    className={`w-full rounded-xl px-3 py-2 border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                      isDayMode ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div className="col-span-2">
                  <label className="text-[11px] uppercase font-bold text-slate-500 block mb-1">
                    Address / Area <span className="text-[10px] font-normal opacity-75">(पत्ता / गल्ली)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Street, area..."
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    className={`w-full rounded-xl px-3 py-2 border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                      isDayMode ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-[11px] uppercase font-bold text-slate-500 block mb-1">
                    Town / Village <span className="text-[10px] font-normal opacity-75">(गाव / शहर)</span>
                  </label>
                  <input
                    type="text"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    className={`w-full rounded-xl px-3 py-2 border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                      isDayMode ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] uppercase font-bold text-slate-500 block mb-1">
                  Credit Limit <span className="text-[10px] font-normal opacity-75">(क्रेडिट लिमिट ₹)</span>
                </label>
                <input
                  type="number"
                  value={formCreditLimit}
                  onChange={(e) => setFormCreditLimit(parseFloat(e.target.value) || 0)}
                  className={`w-full rounded-xl px-3 py-2 border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                    isDayMode ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddCustomerModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white"
                >
                  Cancel (रद्द करा)
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  Create Account (खाते तयार करा)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <EditCustomerModal
          customer={editingCustomer}
          storeData={storeData}
          isOpen={true}
          onClose={() => setEditingCustomer(null)}
          onRefreshData={onRefreshData}
        />
      )}
    </div>
  );
};
