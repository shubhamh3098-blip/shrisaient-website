import React, { useState, useMemo } from 'react';
import {
  Building2,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Phone,
  Share2,
  Printer,
  Calendar,
  CheckCircle2,
  Receipt,
  FileText,
  BadgeAlert,
  ChevronRight,
  Wallet,
  CreditCard,
  Users,
  BarChart3,
  ExternalLink,
  MapPin,
  Sparkles,
  Filter,
  Layers,
  ArrowRight
} from 'lucide-react';
import {
  BusinessSettings,
  Dealer,
  DealerPayment,
  PurchaseEntry,
  CardMember,
  CardTransaction,
  Customer,
  CardSchemeId
} from '../types';
import { CardPassbookModal } from './CardPassbookModal';

interface DealerLedgerViewProps {
  dealers: Dealer[];
  purchases: PurchaseEntry[];
  dealerPayments: DealerPayment[];
  cardMembers?: CardMember[];
  cardTransactions?: CardTransaction[];
  customers?: Customer[];
  settings: BusinessSettings;
  onAddDealer: (dealer: Omit<Dealer, 'id'>) => void;
  onAddPurchase: (purchase: Omit<PurchaseEntry, 'id'>) => void;
  onRecordDealerPayment: (payment: Omit<DealerPayment, 'id' | 'createdAt'>) => void;
  onNavigateCardScheme?: () => void;
  initialDealerName?: string;
}

type LedgerMainTab = 'dealers' | 'cards' | 'customers' | 'overview';

export const DealerLedgerView: React.FC<DealerLedgerViewProps> = ({
  dealers,
  purchases,
  dealerPayments,
  cardMembers = [],
  cardTransactions = [],
  customers = [],
  settings,
  onAddDealer,
  onAddPurchase,
  onRecordDealerPayment,
  onNavigateCardScheme,
  initialDealerName,
}) => {
  const [activeMainTab, setActiveMainTab] = useState<LedgerMainTab>('dealers');

  // DEALER TAB STATES
  const [selectedDealerId, setSelectedDealerId] = useState<string>(() => {
    if (initialDealerName) {
      const match = dealers.find(
        (d) => d.name.toLowerCase() === initialDealerName.toLowerCase()
      );
      if (match) return match.id;
    }
    const manisha = dealers.find((d) => d.name.toLowerCase().includes('manisha'));
    return manisha ? manisha.id : dealers[0]?.id || '';
  });

  const [dealerSearchQuery, setDealerSearchQuery] = useState('');
  const [dealerEntryTypeFilter, setDealerEntryTypeFilter] = useState<'all' | 'purchases' | 'payments'>('all');
  const [showAddDealerModal, setShowAddDealerModal] = useState(false);
  const [showAddBillModal, setShowAddBillModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // New Dealer state
  const [newDealerName, setNewDealerName] = useState('');
  const [newDealerPhone, setNewDealerPhone] = useState('');
  const [newDealerAddress, setNewDealerAddress] = useState('');
  const [newDealerGstin, setNewDealerGstin] = useState('');

  // New Purchase Bill state
  const [billNo, setBillNo] = useState(`PUR-${Date.now().toString().slice(-4)}`);
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [billItems, setBillItems] = useState('');
  const [billTotal, setBillTotal] = useState<number>(0);
  const [billPaid, setBillPaid] = useState<number>(0);
  const [billMode, setBillMode] = useState<'Cash' | 'Online' | 'Cheque'>('Online');

  // New Payment Voucher state
  const [voucherNo, setVoucherNo] = useState(`VCH-${Date.now().toString().slice(-4)}`);
  const [voucherDate, setVoucherDate] = useState(new Date().toISOString().split('T')[0]);
  const [voucherAmount, setVoucherAmount] = useState<number>(0);
  const [voucherMode, setVoucherMode] = useState<'Cash' | 'Online' | 'Cheque'>('Online');
  const [voucherRef, setVoucherRef] = useState('');
  const [voucherNotes, setVoucherNotes] = useState('');

  // CARD MEMBERS TAB STATES
  const [cardSearchQuery, setCardSearchQuery] = useState('');
  const [selectedSchemeFilter, setSelectedSchemeFilter] = useState<'all' | CardSchemeId>('all');
  const [selectedVillageFilter, setSelectedVillageFilter] = useState<string>('all');
  const [selectedCardForPassbook, setSelectedCardForPassbook] = useState<CardMember | null>(null);

  // CUSTOMERS TAB STATES
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [customerBalanceFilter, setCustomerBalanceFilter] = useState<'all' | 'due'>('all');

  // OVERVIEW TAB STATE
  const [universalSearch, setUniversalSearch] = useState('');

  // Selected dealer object
  const selectedDealer =
    dealers.find((d) => d.id === selectedDealerId) || dealers[0] || {
      id: '',
      name: 'No Dealer',
      phone: '',
      totalPurchases: 0,
      totalPaid: 0,
      balanceDue: 0,
    };

  // Overall totals across all dealers
  const totalAllPurchases = dealers.reduce((acc, d) => acc + (d.totalPurchases || 0), 0);
  const totalAllPaid = dealers.reduce((acc, d) => acc + (d.totalPaid || 0), 0);
  const totalAllDue = dealers.reduce((acc, d) => acc + (d.balanceDue || 0), 0);

  // Card Scheme Totals
  const totalCardDeposited = cardMembers.reduce((sum, m) => sum + (m.totalDeposited || 0), 0);
  const totalCardRefunded = cardMembers.reduce((sum, m) => sum + (m.totalRefunded || 0), 0);
  const totalCardNetBalance = cardMembers.reduce((sum, m) => sum + (m.netBalance || 0), 0);

  // Customer Udhar Totals
  const totalCustomerPurchases = customers.reduce(
    (sum, c) => sum + (c.totalPurchased || c.totalPurchases || 0),
    0
  );
  const totalCustomerPaid = customers.reduce((sum, c) => sum + (c.totalPaid || 0), 0);
  const totalCustomerDue = customers.reduce((sum, c) => sum + (c.balanceDue || 0), 0);

  // Unique villages for filter
  const uniqueVillages = useMemo(() => {
    const list = cardMembers
      .map((m) => m.village?.trim())
      .filter((v): v is string => Boolean(v && v.length > 0));
    return Array.from(new Set(list)).sort();
  }, [cardMembers]);

  // Dealer specific ledger items (Purchases + Payments merged & sorted)
  const dealerPurchases = purchases.filter(
    (p) =>
      selectedDealer &&
      p.supplierName.trim().toLowerCase() === selectedDealer.name.trim().toLowerCase()
  );

  const dealerPaymentsList = dealerPayments.filter(
    (p) =>
      selectedDealer &&
      (p.dealerId === selectedDealer.id ||
        p.dealerName.trim().toLowerCase() === selectedDealer.name.trim().toLowerCase())
  );

  // Build Chronological Ledger Entries for Selected Dealer
  type DealerLedgerEntry = {
    id: string;
    date: string;
    refNo: string;
    type: 'Purchase Bill' | 'Payment Voucher';
    description: string;
    mode: string;
    purchaseAmount?: number; // Credit (amount we owe)
    paymentAmount?: number;  // Debit (amount we paid)
    balanceAfter?: number;
  };

  const rawLedgerEntries: DealerLedgerEntry[] = [
    ...dealerPurchases.map((p) => ({
      id: p.id,
      date: p.date,
      refNo: p.billNo,
      type: 'Purchase Bill' as const,
      description: p.items,
      mode: p.paymentMode,
      purchaseAmount: p.totalAmount,
      paymentAmount: p.paidAmount > 0 ? p.paidAmount : undefined,
    })),
    ...dealerPaymentsList.map((dp) => ({
      id: dp.id,
      date: dp.date,
      refNo: dp.voucherNo,
      type: 'Payment Voucher' as const,
      description: dp.notes || (dp.referenceNo ? `Ref: ${dp.referenceNo}` : 'Payment to dealer'),
      mode: dp.paymentMode,
      purchaseAmount: undefined,
      paymentAmount: dp.amount,
    })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Compute Running Balance for Dealer Ledger
  let currentBalance = 0;
  const computedLedgerEntries = rawLedgerEntries.map((entry) => {
    const purchase = entry.purchaseAmount || 0;
    const payment = entry.paymentAmount || 0;
    currentBalance += (purchase - payment);
    return {
      ...entry,
      balanceAfter: currentBalance,
    };
  });

  const filteredDealerLedger = computedLedgerEntries.filter((entry) => {
    if (dealerEntryTypeFilter === 'purchases' && entry.type !== 'Purchase Bill') return false;
    if (dealerEntryTypeFilter === 'payments' && entry.type !== 'Payment Voucher') return false;
    if (dealerSearchQuery) {
      const q = dealerSearchQuery.toLowerCase();
      return (
        entry.refNo.toLowerCase().includes(q) ||
        entry.description.toLowerCase().includes(q) ||
        entry.date.includes(q)
      );
    }
    return true;
  });

  // Filtered Card Members
  const filteredCardMembers = useMemo(() => {
    return cardMembers.filter((m) => {
      if (selectedSchemeFilter !== 'all' && m.schemeId !== selectedSchemeFilter) return false;
      if (selectedVillageFilter !== 'all' && m.village !== selectedVillageFilter) return false;
      if (cardSearchQuery) {
        const q = cardSearchQuery.toLowerCase();
        return (
          m.cardNumber.toString().includes(q) ||
          m.customerName.toLowerCase().includes(q) ||
          (m.phone && m.phone.includes(q)) ||
          (m.village && m.village.toLowerCase().includes(q)) ||
          (m.sheetNo && m.sheetNo.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [cardMembers, selectedSchemeFilter, selectedVillageFilter, cardSearchQuery]);

  // Filtered Customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (customerBalanceFilter === 'due' && c.balanceDue <= 0) return false;
      if (customerSearchQuery) {
        const q = customerSearchQuery.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          (c.phone && c.phone.includes(q))
        );
      }
      return true;
    });
  }, [customers, customerBalanceFilter, customerSearchQuery]);

  // Handle Add Dealer
  const handleAddDealerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDealerName.trim()) return;

    onAddDealer({
      name: newDealerName.trim(),
      phone: newDealerPhone.trim(),
      address: newDealerAddress.trim(),
      gstin: newDealerGstin.trim(),
      totalPurchases: 0,
      totalPaid: 0,
      balanceDue: 0,
      lastTransactionDate: new Date().toISOString().split('T')[0],
    });

    setNewDealerName('');
    setNewDealerPhone('');
    setNewDealerAddress('');
    setNewDealerGstin('');
    setShowAddDealerModal(false);
  };

  // Handle Add Bill for selected dealer
  const handleAddBillSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDealer || billTotal <= 0) return;

    onAddPurchase({
      billNo: billNo.trim() || `PUR-${Date.now().toString().slice(-4)}`,
      supplierName: selectedDealer.name,
      items: billItems.trim() || 'Procured goods',
      totalAmount: billTotal,
      paidAmount: billPaid,
      paymentMode: billMode,
      date: billDate,
      status: billPaid >= billTotal ? 'Paid' : billPaid > 0 ? 'Partial' : 'Pending',
    });

    setBillNo(`PUR-${Date.now().toString().slice(-4)}`);
    setBillItems('');
    setBillTotal(0);
    setBillPaid(0);
    setShowAddBillModal(false);
  };

  // Handle Payment Voucher to dealer
  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDealer || voucherAmount <= 0) return;

    onRecordDealerPayment({
      dealerId: selectedDealer.id,
      dealerName: selectedDealer.name,
      voucherNo: voucherNo.trim() || `VCH-${Date.now().toString().slice(-4)}`,
      date: voucherDate,
      amount: voucherAmount,
      paymentMode: voucherMode,
      referenceNo: voucherRef.trim() || undefined,
      notes: voucherNotes.trim() || 'Payment issued to dealer',
    });

    setVoucherNo(`VCH-${Date.now().toString().slice(-4)}`);
    setVoucherAmount(0);
    setVoucherRef('');
    setVoucherNotes('');
    setShowPaymentModal(false);
  };

  // WhatsApp Share for Dealer Statement
  const handleShareDealerWhatsApp = () => {
    if (!selectedDealer) return;
    const text = encodeURIComponent(
      `*${settings.businessName}*\n` +
      `*Supplier / Dealer Ledger Statement*\n` +
      `--------------------------------\n` +
      `Dealer: *${selectedDealer.name}*\n` +
      `Total Procured Purchases: ₹${(selectedDealer.totalPurchases ?? 0).toLocaleString()}\n` +
      `Total Payments Issued: ₹${(selectedDealer.totalPaid ?? 0).toLocaleString()}\n` +
      `*Current Balance Payable: ₹${(selectedDealer.balanceDue ?? 0).toLocaleString()}*\n` +
      `--------------------------------\n` +
      `Date: ${new Date().toISOString().split('T')[0]}\n` +
      `Domain: ${settings.domainName}`
    );
    const phone = selectedDealer.phone ? selectedDealer.phone.replace(/[^0-9]/g, '') : '';
    const url = phone ? `https://wa.me/91${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Unified Khata & Ledgers (खाता बही)
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Complete Accounting
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Track all transactions in one place: Dealers (Manisha Enterprises), Card Scheme members, and Shop Customers.
          </p>
        </div>

        {/* Global Action */}
        <div className="flex items-center gap-2">
          {activeMainTab === 'dealers' && (
            <>
              <button
                onClick={() => setShowAddDealerModal(true)}
                className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                + New Dealer
              </button>
              {selectedDealer && (
                <button
                  onClick={() => setShowAddBillModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  + Purchase Bill ({selectedDealer.name})
                </button>
              )}
            </>
          )}

          {activeMainTab === 'cards' && onNavigateCardScheme && (
            <button
              onClick={onNavigateCardScheme}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition flex items-center gap-1.5 cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5" />
              Manage Card Schemes & Payments
            </button>
          )}
        </div>
      </div>

      {/* Main Ledger Category Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 overflow-x-auto">
        <button
          onClick={() => setActiveMainTab('dealers')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap cursor-pointer ${
            activeMainTab === 'dealers'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Building2 className="w-4 h-4 text-blue-600" />
          <span>🏢 Dealer Khata (डीलर - Manisha Enterprises आदि)</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-800 font-bold">
            {dealers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveMainTab('cards')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap cursor-pointer ${
            activeMainTab === 'cards'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <CreditCard className="w-4 h-4 text-emerald-600" />
          <span>💳 Card Customer Ledgers (कार्ड ग्राहक खाता)</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">
            {cardMembers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveMainTab('customers')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap cursor-pointer ${
            activeMainTab === 'customers'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Users className="w-4 h-4 text-purple-600" />
          <span>👥 Shop Customers Udhar (दुकान उधारी खाता)</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-purple-100 text-purple-800 font-bold">
            {customers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveMainTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap cursor-pointer ${
            activeMainTab === 'overview'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-amber-600" />
          <span>📊 Unified Summary (समस्त सारांश)</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DEALERS / SUPPLIERS KHATA */}
      {/* ========================================================================= */}
      {activeMainTab === 'dealers' && (
        <div className="space-y-6">
          {/* Dealer Overall KPI Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Total Procured Purchases</span>
                <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                  <Building2 className="w-4 h-4" />
                </span>
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-2">₹{totalAllPurchases.toLocaleString()}</p>
              <p className="text-[11px] text-slate-400 mt-1">Across all {dealers.length} registered suppliers</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Total Payments Given</span>
                <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                  <ArrowUpRight className="w-4 h-4" />
                </span>
              </div>
              <p className="text-2xl font-bold text-emerald-600 mt-2">₹{totalAllPaid.toLocaleString()}</p>
              <p className="text-[11px] text-emerald-700/80 mt-1">Paid through Online / Cash / Cheque</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Total Pending Payable (देना बाकी)</span>
                <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                  <Wallet className="w-4 h-4" />
                </span>
              </div>
              <p className="text-2xl font-bold text-amber-600 mt-2">₹{totalAllDue.toLocaleString()}</p>
              <p className="text-[11px] text-amber-700/80 mt-1">Net outstanding due to suppliers</p>
            </div>
          </div>

          {/* 2-Column Layout: Left Dealer Directory, Right Selected Dealer's Ledger */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Dealer List (4 cols) */}
            <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-sm">Dealer Directory</h3>
                <span className="text-xs text-slate-500 font-medium">{dealers.length} Dealers</span>
              </div>

              {/* Dealer Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={dealerSearchQuery}
                  onChange={(e) => setDealerSearchQuery(e.target.value)}
                  placeholder="Search dealer name or phone..."
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-blue-500"
                />
              </div>

              {/* Dealer Item Cards */}
              <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
                {dealers
                  .filter(
                    (d) =>
                      d.name.toLowerCase().includes(dealerSearchQuery.toLowerCase()) ||
                      (d.phone && d.phone.includes(dealerSearchQuery))
                  )
                  .map((dealer) => {
                    const isSelected = selectedDealer && selectedDealer.id === dealer.id;
                    const isManisha = dealer.name.toLowerCase().includes('manisha');

                    return (
                      <div
                        key={dealer.id}
                        onClick={() => setSelectedDealerId(dealer.id)}
                        className={`p-3 rounded-xl border transition cursor-pointer text-left ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50/50 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 text-xs sm:text-sm">
                                {dealer.name}
                              </span>
                              {isManisha && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-0.5">
                                  <Sparkles className="w-2.5 h-2.5 text-amber-700" />
                                  Key Supplier
                                </span>
                              )}
                            </div>
                            {dealer.phone && (
                              <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                <Phone className="w-3 h-3" />
                                {dealer.phone}
                              </p>
                            )}
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block font-medium">Payable Due</span>
                            <span
                              className={`text-xs font-bold ${
                                (dealer.balanceDue ?? 0) > 0 ? 'text-amber-600' : 'text-emerald-600'
                              }`}
                            >
                              ₹{(dealer.balanceDue ?? 0).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-slate-100/80 flex items-center justify-between text-[10px] text-slate-500">
                          <span>Purchases: ₹{(dealer.totalPurchases ?? 0).toLocaleString()}</span>
                          <span>Paid: ₹{(dealer.totalPaid ?? 0).toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Right: Selected Dealer's Full Ledger Passbook (8 cols) */}
            <div className="lg:col-span-8 space-y-4">
              {selectedDealer ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-5">
                  {/* Dealer Header Card */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="p-2 rounded-xl bg-blue-100 text-blue-700">
                          <Building2 className="w-5 h-5" />
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-lg font-bold text-slate-900">{selectedDealer.name}</h2>
                            {selectedDealer.name.toLowerCase().includes('manisha') && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                ⭐ Primary Dealer
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 flex flex-wrap items-center gap-3 mt-0.5">
                            {selectedDealer.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" /> {selectedDealer.phone}
                              </span>
                            )}
                            {selectedDealer.gstin && <span>GSTIN: {selectedDealer.gstin}</span>}
                            {selectedDealer.address && <span>📍 {selectedDealer.address}</span>}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={handleShareDealerWhatsApp}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        WhatsApp
                      </button>
                      <button
                        onClick={() => window.print()}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Print
                      </button>
                      <button
                        onClick={() => setShowPaymentModal(true)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        Record Payment
                      </button>
                      <button
                        onClick={() => setShowAddBillModal(true)}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Bill
                      </button>
                    </div>
                  </div>

                  {/* Highlight notice regarding auto-entry */}
                  <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center gap-2 text-xs text-blue-900">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>
                      <strong>Automated Dealer Ledger:</strong> All purchase invoices entered under{' '}
                      <strong>{selectedDealer.name}</strong> in the Purchases section automatically reflect in this statement.
                    </span>
                  </div>

                  {/* Dealer Specific KPI Ribbon */}
                  <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                    <div>
                      <span className="text-[11px] text-slate-500 font-medium block">Total Invoiced</span>
                      <span className="text-base font-bold text-slate-900">
                        ₹{(selectedDealer?.totalPurchases ?? 0).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 font-medium block">Paid to Dealer</span>
                      <span className="text-base font-bold text-emerald-600">
                        ₹{(selectedDealer?.totalPaid ?? 0).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 font-medium block">Balance Payable (देना बाकी)</span>
                      <span
                        className={`text-base font-bold ${
                          (selectedDealer?.balanceDue ?? 0) > 0 ? 'text-amber-600' : 'text-emerald-600'
                        }`}
                      >
                        ₹{(selectedDealer?.balanceDue ?? 0).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Ledger Table Filter & Search Controls */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setDealerEntryTypeFilter('all')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                          dealerEntryTypeFilter === 'all'
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        All Entries ({computedLedgerEntries.length})
                      </button>
                      <button
                        onClick={() => setDealerEntryTypeFilter('purchases')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                          dealerEntryTypeFilter === 'purchases'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Bills Only ({dealerPurchases.length})
                      </button>
                      <button
                        onClick={() => setDealerEntryTypeFilter('payments')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                          dealerEntryTypeFilter === 'payments'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Payments Only ({dealerPaymentsList.length})
                      </button>
                    </div>

                    <div className="relative w-full sm:w-56">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        value={dealerSearchQuery}
                        onChange={(e) => setDealerSearchQuery(e.target.value)}
                        placeholder="Search bill no or items..."
                        className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  {/* Chronological Statement Table */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                          <tr>
                            <th className="py-2.5 px-3">Date</th>
                            <th className="py-2.5 px-3">Type & Ref No</th>
                            <th className="py-2.5 px-3">Items / Particulars</th>
                            <th className="py-2.5 px-3 text-center">Mode</th>
                            <th className="py-2.5 px-3 text-right">Bill (Credit)</th>
                            <th className="py-2.5 px-3 text-right">Paid (Debit)</th>
                            <th className="py-2.5 px-3 text-right">Balance Due</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredDealerLedger.map((entry) => (
                            <tr key={entry.id} className="hover:bg-slate-50 transition">
                              <td className="py-2.5 px-3 font-mono text-slate-600 text-[11px]">
                                {entry.date}
                              </td>
                              <td className="py-2.5 px-3">
                                <span
                                  className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold mr-1.5 ${
                                    entry.type === 'Purchase Bill'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-emerald-100 text-emerald-800'
                                  }`}
                                >
                                  {entry.type === 'Purchase Bill' ? 'BILL' : 'PAID'}
                                </span>
                                <span className="font-mono font-semibold text-slate-800">
                                  {entry.refNo}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-slate-700 max-w-[220px] truncate">
                                {entry.description}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span className="text-[10px] text-slate-500 font-medium px-1.5 py-0.5 bg-slate-100 rounded">
                                  {entry.mode}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                                {entry.purchaseAmount ? `₹${(entry.purchaseAmount ?? 0).toLocaleString()}` : '-'}
                              </td>
                              <td className="py-2.5 px-3 text-right font-semibold text-emerald-600">
                                {entry.paymentAmount ? `₹${(entry.paymentAmount ?? 0).toLocaleString()}` : '-'}
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold text-slate-900 font-mono">
                                ₹{(entry.balanceAfter ?? 0).toLocaleString()}
                              </td>
                            </tr>
                          ))}

                          {filteredDealerLedger.length === 0 && (
                            <tr>
                              <td colSpan={7} className="py-8 text-center text-slate-400">
                                No entries recorded for this dealer yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400">
                  Select a dealer from the directory to inspect their full ledger.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CARD CUSTOMER SCHEME LEDGERS */}
      {/* ========================================================================= */}
      {activeMainTab === 'cards' && (
        <div className="space-y-6">
          {/* Card Schemes Summary Ribbon */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
              <span className="text-xs font-medium text-slate-500">Active Card Members</span>
              <p className="text-2xl font-bold text-slate-900 mt-1">{cardMembers.length}</p>
              <p className="text-[11px] text-slate-400 mt-1">Across Schemes 1, 2, and 3</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
              <span className="text-xs font-medium text-slate-500">Total Deposited Funds</span>
              <p className="text-2xl font-bold text-emerald-600 mt-1">₹{totalCardDeposited.toLocaleString()}</p>
              <p className="text-[11px] text-emerald-700/80 mt-1">Weekly payments collected</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
              <span className="text-xs font-medium text-slate-500">Total Customer Refunds</span>
              <p className="text-2xl font-bold text-rose-600 mt-1">₹{totalCardRefunded.toLocaleString()}</p>
              <p className="text-[11px] text-rose-700/80 mt-1">Partial / settlement returns</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
              <span className="text-xs font-medium text-slate-500">Net Card Balance Held</span>
              <p className="text-2xl font-bold text-blue-600 mt-1">₹{totalCardNetBalance.toLocaleString()}</p>
              <p className="text-[11px] text-blue-700/80 mt-1">Customer fund liability</p>
            </div>
          </div>

          {/* Scheme Numbers Range Callout */}
          <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-900 font-bold text-[10px]">
                3 ACTIVE SCHEMES
              </span>
              <span>
                <strong>Scheme 1:</strong> #1001-2999 • <strong>Scheme 2:</strong> #3001-3999 •{' '}
                <strong>Scheme 3:</strong> #4001-6000 • <strong>Fee:</strong> ₹50 Fixed
              </span>
            </div>
            {onNavigateCardScheme && (
              <button
                onClick={onNavigateCardScheme}
                className="font-bold underline text-amber-800 hover:text-amber-900 cursor-pointer text-xs"
              >
                Go to Card Management →
              </button>
            )}
          </div>

          {/* Filter Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              {/* Search */}
              <div className="sm:col-span-6 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={cardSearchQuery}
                  onChange={(e) => setCardSearchQuery(e.target.value)}
                  placeholder="Search Card # (e.g. 4107), Name, Village (e.g. Bori, Hingni), Sheet No..."
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-blue-500"
                />
              </div>

              {/* Scheme filter */}
              <div className="sm:col-span-3">
                <select
                  value={selectedSchemeFilter}
                  onChange={(e) => setSelectedSchemeFilter(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white"
                >
                  <option value="all">All Schemes (सभी योजनाएं)</option>
                  <option value="scheme1">Scheme 1 (1001 - 2999)</option>
                  <option value="scheme2">Scheme 2 (3001 - 3999)</option>
                  <option value="scheme3">Scheme 3 (4001 - 6000)</option>
                </select>
              </div>

              {/* Village filter */}
              <div className="sm:col-span-3">
                <select
                  value={selectedVillageFilter}
                  onChange={(e) => setSelectedVillageFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white"
                >
                  <option value="all">All Villages / Locations (सभी गांव)</option>
                  {uniqueVillages.map((v) => (
                    <option key={v} value={v}>
                      📍 {v}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Scheme Pills */}
            <div className="flex items-center gap-2 pt-1 border-t border-slate-100 flex-wrap">
              <span className="text-[11px] text-slate-400 font-medium">Quick Filter:</span>
              <button
                onClick={() => {
                  setSelectedSchemeFilter('all');
                  setSelectedVillageFilter('all');
                  setCardSearchQuery('');
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer ${
                  selectedSchemeFilter === 'all' && selectedVillageFilter === 'all' && !cardSearchQuery
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Cards ({cardMembers.length})
              </button>
              <button
                onClick={() => setSelectedSchemeFilter('scheme1')}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer ${
                  selectedSchemeFilter === 'scheme1'
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
              >
                Scheme 1 ({cardMembers.filter((m) => m.schemeId === 'scheme1').length})
              </button>
              <button
                onClick={() => setSelectedSchemeFilter('scheme2')}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer ${
                  selectedSchemeFilter === 'scheme2'
                    ? 'bg-purple-600 text-white'
                    : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                }`}
              >
                Scheme 2 ({cardMembers.filter((m) => m.schemeId === 'scheme2').length})
              </button>
              <button
                onClick={() => setSelectedSchemeFilter('scheme3')}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer ${
                  selectedSchemeFilter === 'scheme3'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                Scheme 3 ({cardMembers.filter((m) => m.schemeId === 'scheme3').length})
              </button>
            </div>
          </div>

          {/* Card Customer Members Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Card # / Scheme</th>
                    <th className="py-3 px-4">Customer Name & Phone</th>
                    <th className="py-3 px-4">Village / Sheet No</th>
                    <th className="py-3 px-4 text-center">Opening Fee</th>
                    <th className="py-3 px-4 text-right">Deposited</th>
                    <th className="py-3 px-4 text-right">Refunded</th>
                    <th className="py-3 px-4 text-right">Net Balance (बाकी)</th>
                    <th className="py-3 px-4 text-center">Ledger Passbook</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCardMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 rounded bg-blue-50 text-blue-700 font-mono font-bold text-xs border border-blue-200">
                            #{member.cardNumber}
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium">
                            {member.schemeName}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{member.customerName}</p>
                        {member.phone && (
                          <p className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                            <Phone className="w-2.5 h-2.5" />
                            {member.phone}
                          </p>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-0.5">
                          {member.village ? (
                            <span className="text-slate-800 font-semibold text-xs flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-emerald-600" />
                              {member.village}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">-</span>
                          )}
                          {member.sheetNo && (
                            <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded w-fit border border-blue-100">
                              Sheet #{member.sheetNo}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          ₹50 Paid
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-bold text-emerald-600">
                        ₹{(member.totalDeposited ?? 0).toLocaleString()}
                      </td>

                      <td className="py-3 px-4 text-right font-semibold text-rose-600">
                        {(member.totalRefunded ?? 0) > 0 ? `₹${(member.totalRefunded ?? 0).toLocaleString()}` : '₹0'}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <span className="font-bold text-slate-900 text-sm">
                          ₹{(member.netBalance ?? 0).toLocaleString()}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedCardForPassbook(member)}
                            className="px-3 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition cursor-pointer border border-blue-200 flex items-center gap-1"
                          >
                            <FileText className="w-3 h-3" />
                            Passbook
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredCardMembers.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No card members found matching the search or scheme filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SHOP CUSTOMERS UDHAR KHATA */}
      {/* ========================================================================= */}
      {activeMainTab === 'customers' && (
        <div className="space-y-6">
          {/* Shop Customers KPI Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
              <span className="text-xs font-medium text-slate-500">Total Billed Sales</span>
              <p className="text-2xl font-bold text-slate-900 mt-1">₹{totalCustomerPurchases.toLocaleString()}</p>
              <p className="text-[11px] text-slate-400 mt-1">Across all retail customers</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
              <span className="text-xs font-medium text-slate-500">Total Amount Collected</span>
              <p className="text-2xl font-bold text-emerald-600 mt-1">₹{totalCustomerPaid.toLocaleString()}</p>
              <p className="text-[11px] text-emerald-700/80 mt-1">Cash, UPI, and settlements</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
              <span className="text-xs font-medium text-slate-500">Customer Udhar Due (उधारी लेना बाकी)</span>
              <p className="text-2xl font-bold text-rose-600 mt-1">₹{totalCustomerDue.toLocaleString()}</p>
              <p className="text-[11px] text-rose-700/80 mt-1">Outstanding store credit to collect</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={customerSearchQuery}
                onChange={(e) => setCustomerSearchQuery(e.target.value)}
                placeholder="Search customer name or phone..."
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCustomerBalanceFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                  customerBalanceFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                All Customers ({customers.length})
              </button>
              <button
                onClick={() => setCustomerBalanceFilter('due')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                  customerBalanceFilter === 'due'
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                }`}
              >
                Pending Udhar Only ({customers.filter((c) => c.balanceDue > 0).length})
              </button>
            </div>
          </div>

          {/* Customer Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Customer Name</th>
                    <th className="py-3 px-4">Phone Number</th>
                    <th className="py-3 px-4 text-right">Total Billed</th>
                    <th className="py-3 px-4 text-right">Total Paid</th>
                    <th className="py-3 px-4 text-right">Udhar Balance (बाकी)</th>
                    <th className="py-3 px-4 text-center">Last Visit</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCustomers.map((cust) => (
                    <tr key={cust.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{cust.name}</td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono">
                        {cust.phone || <span className="text-slate-400">No phone</span>}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        ₹{(cust.totalPurchased ?? cust.totalPurchases ?? 0).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-emerald-600">
                        ₹{(cust.totalPaid ?? 0).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span
                          className={`font-bold ${
                            (cust.balanceDue ?? 0) > 0 ? 'text-rose-600' : 'text-slate-600'
                          }`}
                        >
                          ₹{(cust.balanceDue ?? 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-500 font-mono text-[11px]">
                        {cust.lastVisit}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {cust.phone && (cust.balanceDue ?? 0) > 0 && (
                          <button
                            onClick={() => {
                              const text = encodeURIComponent(
                                `Namaste ${cust.name}, aapka ${settings.businessName} par baaki hisab ₹${(cust.balanceDue ?? 0).toLocaleString()} hai. Kripya dukan par aakar hisab clear kare. Dhanyawad!`
                              );
                              window.open(`https://wa.me/91${cust.phone}?text=${text}`, '_blank');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Share2 className="w-3 h-3" />
                            Reminder
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredCustomers.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No customers found matching the search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: CONSOLIDATED ALL-LEDGERS OVERVIEW */}
      {/* ========================================================================= */}
      {activeMainTab === 'overview' && (
        <div className="space-y-6">
          {/* Universal 3-Way Financial Balance Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1: Suppliers / Dealers */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  🏢 Suppliers & Dealers Khata
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] bg-blue-50 text-blue-700 font-semibold">
                  {dealers.length} Dealers
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Procurement bills from <strong>Manisha Enterprises</strong>, Polycab, and other vendors.
              </p>
              <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Procured:</span>
                  <span className="font-bold text-slate-900">₹{(totalAllPurchases ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Payments Issued:</span>
                  <span className="font-bold text-emerald-600">₹{(totalAllPaid ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-100 text-sm">
                  <span className="font-semibold text-slate-700">Payable Due (देना बाकी):</span>
                  <span className="font-bold text-amber-600">₹{(totalAllDue ?? 0).toLocaleString()}</span>
                </div>
              </div>
              <button
                onClick={() => setActiveMainTab('dealers')}
                className="w-full mt-2 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
              >
                Inspect Dealer Ledgers <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Card 2: Card Customers */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                  💳 Scheme Card Members Khata
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] bg-emerald-50 text-emerald-700 font-semibold">
                  {cardMembers.length} Cards
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Weekly installments (₹100/200/500/1000) and card refund accounts across Schemes 1, 2, 3.
              </p>
              <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Deposits Collected:</span>
                  <span className="font-bold text-emerald-600">₹{(totalCardDeposited ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Refunds Returned:</span>
                  <span className="font-bold text-rose-600">₹{(totalCardRefunded ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-100 text-sm">
                  <span className="font-semibold text-slate-700">Net Balance in Hand:</span>
                  <span className="font-bold text-blue-600">₹{(totalCardNetBalance ?? 0).toLocaleString()}</span>
                </div>
              </div>
              <button
                onClick={() => setActiveMainTab('cards')}
                className="w-full mt-2 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
              >
                Inspect Card Ledgers <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Card 3: Shop Udhar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-600">
                  👥 Retail Shop Customers
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] bg-purple-50 text-purple-700 font-semibold">
                  {customers.length} Customers
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Counter sales, store billing, and outstanding credit balances to recover.
              </p>
              <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Billed:</span>
                  <span className="font-bold text-slate-900">₹{(totalCustomerPurchases ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Cash / Paid Collected:</span>
                  <span className="font-bold text-emerald-600">₹{(totalCustomerPaid ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-100 text-sm">
                  <span className="font-semibold text-slate-700">Udhar Due (लेना बाकी):</span>
                  <span className="font-bold text-rose-600">₹{(totalCustomerDue ?? 0).toLocaleString()}</span>
                </div>
              </div>
              <button
                onClick={() => setActiveMainTab('customers')}
                className="w-full mt-2 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
              >
                Inspect Shop Customers <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Universal Quick Search Across All Khata */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Universal Account Finder</h3>
              <p className="text-xs text-slate-500">
                Instantly find any Dealer (e.g. Manisha Enterprises), Scheme Card Holder, or Customer:
              </p>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={universalSearch}
                onChange={(e) => setUniversalSearch(e.target.value)}
                placeholder="Type name (Manisha, Prakash, etc.), card number (#4107), village (Bori, Hingni)..."
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-blue-500"
              />
            </div>

            {universalSearch && (
              <div className="space-y-4 pt-2">
                {/* Dealer matches */}
                {dealers.some((d) => d.name.toLowerCase().includes(universalSearch.toLowerCase())) && (
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                      Matched Dealers:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {dealers
                        .filter((d) => d.name.toLowerCase().includes(universalSearch.toLowerCase()))
                        .map((d) => (
                          <div
                            key={d.id}
                            onClick={() => {
                              setSelectedDealerId(d.id);
                              setActiveMainTab('dealers');
                            }}
                            className="p-3 border border-blue-200 bg-blue-50/50 rounded-xl cursor-pointer hover:bg-blue-100/50 flex items-center justify-between"
                          >
                            <div>
                              <span className="font-bold text-xs text-slate-900 block">{d.name}</span>
                              <span className="text-[10px] text-slate-500">Dealer / Supplier</span>
                            </div>
                            <span className="text-xs font-bold text-amber-600">
                              Due: ₹{(d.balanceDue ?? 0).toLocaleString()}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Card Member matches */}
                {cardMembers.some(
                  (m) =>
                    m.cardNumber.toString().includes(universalSearch) ||
                    m.customerName.toLowerCase().includes(universalSearch.toLowerCase()) ||
                    (m.village && m.village.toLowerCase().includes(universalSearch.toLowerCase()))
                ) && (
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                      Matched Scheme Card Members:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {cardMembers
                        .filter(
                          (m) =>
                            m.cardNumber.toString().includes(universalSearch) ||
                            m.customerName.toLowerCase().includes(universalSearch.toLowerCase()) ||
                            (m.village && m.village.toLowerCase().includes(universalSearch.toLowerCase()))
                        )
                        .slice(0, 6)
                        .map((m) => (
                          <div
                            key={m.id}
                            onClick={() => setSelectedCardForPassbook(m)}
                            className="p-3 border border-emerald-200 bg-emerald-50/50 rounded-xl cursor-pointer hover:bg-emerald-100/50 flex items-center justify-between"
                          >
                            <div>
                              <span className="font-bold text-xs text-slate-900 block">
                                #{m.cardNumber} - {m.customerName}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {m.schemeName} {m.village ? `• ${m.village}` : ''}
                              </span>
                            </div>
                            <span className="text-xs font-bold text-emerald-700">
                              Balance: ₹{(m.netBalance ?? 0).toLocaleString()}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* Modal: Card Member Passbook */}
      {selectedCardForPassbook && (
        <CardPassbookModal
          member={selectedCardForPassbook}
          transactions={cardTransactions}
          settings={settings}
          onClose={() => setSelectedCardForPassbook(null)}
        />
      )}

      {/* Modal: Add New Dealer */}
      {showAddDealerModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Add New Dealer / Supplier</h3>
              <button
                onClick={() => setShowAddDealerModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddDealerSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dealer / Supplier Business Name *
                </label>
                <input
                  type="text"
                  required
                  value={newDealerName}
                  onChange={(e) => setNewDealerName(e.target.value)}
                  placeholder="e.g. Manisha Enterprises"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone / Mobile Number
                </label>
                <input
                  type="tel"
                  value={newDealerPhone}
                  onChange={(e) => setNewDealerPhone(e.target.value)}
                  placeholder="e.g. 9823019876"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dealer GSTIN (Optional)
                </label>
                <input
                  type="text"
                  value={newDealerGstin}
                  onChange={(e) => setNewDealerGstin(e.target.value)}
                  placeholder="e.g. 27AABCM7612E1Z4"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Address / City
                </label>
                <input
                  type="text"
                  value={newDealerAddress}
                  onChange={(e) => setNewDealerAddress(e.target.value)}
                  placeholder="e.g. Wholesale Market Yard, Pune"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddDealerModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
                >
                  Save Dealer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Purchase Bill under this Dealer */}
      {showAddBillModal && selectedDealer && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">New Purchase Bill</h3>
                <p className="text-xs text-blue-600 font-bold">Supplier: {selectedDealer.name}</p>
              </div>
              <button
                onClick={() => setShowAddBillModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddBillSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Bill / Invoice No *
                  </label>
                  <input
                    type="text"
                    required
                    value={billNo}
                    onChange={(e) => setBillNo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Bill Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={billDate}
                    onChange={(e) => setBillDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Items Purchased / Description *
                </label>
                <textarea
                  required
                  rows={2}
                  value={billItems}
                  onChange={(e) => setBillItems(e.target.value)}
                  placeholder="e.g. Copper wire 50 coils, 100 pcs switches"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Total Bill Amount (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={billTotal || ''}
                    onChange={(e) => setBillTotal(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Amount Paid Now (₹)
                  </label>
                  <input
                    type="number"
                    value={billPaid || ''}
                    onChange={(e) => setBillPaid(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Mode
                </label>
                <select
                  value={billMode}
                  onChange={(e) => setBillMode(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                >
                  <option value="Online">Online / NEFT / UPI</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddBillModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
                >
                  Save Bill to {selectedDealer.name}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Record Payment Voucher to Dealer */}
      {showPaymentModal && selectedDealer && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Record Payment to Dealer</h3>
                <p className="text-xs text-emerald-700 font-bold">Payee: {selectedDealer.name}</p>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <span className="text-xs text-amber-800">
                  Current Pending Payable: <strong>₹{(selectedDealer?.balanceDue ?? 0).toLocaleString()}</strong>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Voucher No *
                  </label>
                  <input
                    type="text"
                    required
                    value={voucherNo}
                    onChange={(e) => setVoucherNo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date Paid *
                  </label>
                  <input
                    type="date"
                    required
                    value={voucherDate}
                    onChange={(e) => setVoucherDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Amount (₹) *
                </label>
                <input
                  type="number"
                  required
                  value={voucherAmount || ''}
                  onChange={(e) => setVoucherAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-emerald-300 rounded-lg text-sm font-bold text-emerald-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={voucherMode}
                    onChange={(e) => setVoucherMode(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  >
                    <option value="Online">Online (NEFT / UPI)</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    UTR / Cheque Ref #
                  </label>
                  <input
                    type="text"
                    value={voucherRef}
                    onChange={(e) => setVoucherRef(e.target.value)}
                    placeholder="e.g. UTR-984712"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Notes / Remarks
                </label>
                <input
                  type="text"
                  value={voucherNotes}
                  onChange={(e) => setVoucherNotes(e.target.value)}
                  placeholder="e.g. Part payment against monthly bill"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
                >
                  Confirm Payment Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
