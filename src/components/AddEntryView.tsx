import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  User,
  IndianRupee,
  Calendar,
  Banknote,
  Smartphone,
  Info,
  CheckCircle2,
  Printer,
  Share2,
  RotateCcw,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { Customer, StockItem, TransactionEntry, BusinessSettings, CardSchemeId } from '../types';
import { SCHEMES_CONFIG } from '../utils/storage';
import { CreditCard } from 'lucide-react';

interface AddEntryViewProps {
  onSaveEntry: (entry: Omit<TransactionEntry, 'id' | 'createdAt'>) => void;
  onBackToDashboard: () => void;
  stockList: StockItem[];
  customersList: Customer[];
  settings: BusinessSettings;
  todaysTransactions: TransactionEntry[];
  onOpenInvoiceModal: (entry: TransactionEntry) => void;
}

export const AddEntryView: React.FC<AddEntryViewProps> = ({
  onSaveEntry,
  onBackToDashboard,
  stockList,
  customersList,
  settings,
  todaysTransactions,
  onOpenInvoiceModal,
}) => {
  // Form States
  const [selectedStockId, setSelectedStockId] = useState<string>('');
  const [stockSearchQuery, setStockSearchQuery] = useState<string>('');
  const [isStockDropdownOpen, setIsStockDropdownOpen] = useState(false);
  const [stockQty, setStockQty] = useState<number>(1);

  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);

  const [totalAmount, setTotalAmount] = useState<string>('');
  const [payingNow, setPayingNow] = useState<string>('');
  const [itemDetails, setItemDetails] = useState<string>('');
  const [invoiceNo, setInvoiceNo] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'Online'>('Cash');
  const [selectedSchemeId, setSelectedSchemeId] = useState<CardSchemeId | ''>('');
  const [selectedCardNumber, setSelectedCardNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [savedEntry, setSavedEntry] = useState<TransactionEntry | null>(null);

  // Auto-generate invoice number
  useEffect(() => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const generated = `${settings.invoicePrefix || 'INV-2026-'}${todaysTransactions.length + 1}-${randomSuffix}`;
    setInvoiceNo(generated);
  }, [settings.invoicePrefix, todaysTransactions.length]);

  // Filter stock with memoization & 15 items cap
  const filteredStock = useMemo(() => {
    const q = stockSearchQuery.trim().toLowerCase();
    if (!q) return stockList.slice(0, 15);
    return stockList
      .filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.code.toLowerCase().includes(q)
      )
      .slice(0, 15);
  }, [stockList, stockSearchQuery]);

  // Filter customers with memoization & 15 items cap to prevent mobile keyboard lag
  const filteredCustomers = useMemo(() => {
    const q = customerName.trim().toLowerCase();
    if (!q) return [];
    return customersList
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.phone && c.phone.includes(q))
      )
      .slice(0, 15);
  }, [customersList, customerName]);

  // Select a stock item
  const handleSelectStock = (item: StockItem) => {
    setSelectedStockId(item.id);
    setStockSearchQuery(item.name);
    setIsStockDropdownOpen(false);
    
    // Auto populate details & calculate amount
    const calcTotal = item.sellingPrice * stockQty;
    setTotalAmount(calcTotal.toString());
    setPayingNow(calcTotal.toString());
    setItemDetails(`${item.name} (${item.code}) - ${stockQty} ${item.unit}`);
  };

  const handleStockQtyChange = (qty: number) => {
    const validQty = Math.max(1, qty);
    setStockQty(validQty);
    const item = stockList.find((s) => s.id === selectedStockId);
    if (item) {
      const calcTotal = item.sellingPrice * validQty;
      setTotalAmount(calcTotal.toString());
      setPayingNow(calcTotal.toString());
      setItemDetails(`${item.name} (${item.code}) - ${validQty} ${item.unit}`);
    }
  };

  const handleSelectCustomer = (cust: Customer) => {
    setCustomerName(cust.name);
    setCustomerPhone(cust.phone);
    setIsCustomerDropdownOpen(false);
  };

  const numTotal = parseFloat(totalAmount) || 0;
  const numPaid = parseFloat(payingNow) || 0;
  const dueAmount = Math.max(0, numTotal - numPaid);

  const resetForm = () => {
    setSelectedStockId('');
    setStockSearchQuery('');
    setStockQty(1);
    setCustomerName('');
    setCustomerPhone('');
    setTotalAmount('');
    setPayingNow('');
    setItemDetails('');
    setPaymentMode('Cash');
    setSelectedSchemeId('');
    setSelectedCardNumber('');
    setNotes('');
    setErrorMsg('');
    setSavedEntry(null);
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    setInvoiceNo(`${settings.invoicePrefix || 'INV-2026-'}${todaysTransactions.length + 1}-${randomSuffix}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!customerName.trim()) {
      setErrorMsg('Customer Name is required');
      return;
    }

    if (!totalAmount || numTotal <= 0) {
      setErrorMsg('Please enter a valid Total Amount greater than 0');
      return;
    }

    if (numPaid < 0) {
      setErrorMsg('Paying Now cannot be negative');
      return;
    }

    if (numPaid > numTotal) {
      setErrorMsg('Paying Now cannot exceed the Total Amount');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const selectedStock = stockList.find((s) => s.id === selectedStockId);
      const existingCustomer = customersList.find(
        (c) => c.name.toLowerCase() === customerName.toLowerCase()
      );

      const newEntry: Omit<TransactionEntry, 'id' | 'createdAt'> = {
        invoiceNo: invoiceNo.trim() || `INV-${Date.now().toString().slice(-6)}`,
        date,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || existingCustomer?.phone || '',
        customerId: existingCustomer?.id,
        cardNumber: selectedCardNumber ? parseInt(selectedCardNumber) : undefined,
        schemeId: selectedSchemeId ? (selectedSchemeId as CardSchemeId) : undefined,
        stockItemId: selectedStock?.id,
        stockItemName: selectedStock?.name,
        quantity: selectedStock ? stockQty : undefined,
        itemDetails: itemDetails.trim() || 'General Goods / Services',
        totalAmount: numTotal,
        payingNow: numPaid,
        dueAmount,
        paymentMode,
        notes: notes.trim(),
      };

      onSaveEntry(newEntry);
      setIsSubmitting(false);

      const createdEntryFull: TransactionEntry = {
        ...newEntry,
        id: `tx-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      setSavedEntry(createdEntryFull);
    }, 450);
  };

  // Calculations for bottom summary cards
  const todayCashIn = todaysTransactions
    .filter((t) => t.paymentMode === 'Cash')
    .reduce((acc, curr) => acc + curr.payingNow, 0);

  const todayOnlineIn = todaysTransactions
    .filter((t) => t.paymentMode === 'Online')
    .reduce((acc, curr) => acc + curr.payingNow, 0);

  const todayTotalDues = todaysTransactions.reduce(
    (acc, curr) => acc + (curr.dueAmount || 0),
    0
  );

  const handleShareWhatsApp = (entry: TransactionEntry) => {
    const text = encodeURIComponent(
      `*${settings.businessName}*\nBill / Invoice: ${entry.invoiceNo}\nDate: ${entry.date}\nCustomer: ${entry.customerName}\nItem: ${entry.itemDetails}\nTotal Amount: ₹${entry.totalAmount.toLocaleString()}\nPaid: ₹${entry.payingNow.toLocaleString()} (${entry.paymentMode})\nDue Balance: ₹${entry.dueAmount.toLocaleString()}\n\nThank you for doing business with Shri Sai Enterprises!`
    );
    const phone = entry.customerPhone ? entry.customerPhone.replace(/[^0-9]/g, '') : '';
    const url = phone ? `https://wa.me/91${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header bar matching Screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Add Entry
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Record a sale or cash entry for {settings.businessName || 'Shri Sai Enterprises'}.
          </p>
        </div>
        <button
          id="btn-back-dashboard"
          onClick={onBackToDashboard}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition cursor-pointer self-start sm:self-auto active:scale-95"
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* Success banner after saving */}
      {savedEntry && (
        <div className="bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-[#00523f] dark:text-emerald-400 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-950 dark:text-emerald-200">
                पावती यशस्वीपणे जतन झाली! / Entry recorded successfully! (#{savedEntry.invoiceNo})
              </p>
              <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5">
                एकूण: ₹{savedEntry.totalAmount.toLocaleString()} • जमा: ₹{savedEntry.payingNow.toLocaleString()} ({savedEntry.paymentMode})
                {savedEntry.dueAmount > 0 && ` • उर्वरित उधारी: ₹${savedEntry.dueAmount.toLocaleString()}`}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="btn-print-saved-bill"
              onClick={() => onOpenInvoiceModal(savedEntry)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 text-[#00523f] dark:text-emerald-300 text-xs font-bold hover:bg-emerald-50 transition cursor-pointer shadow-2xs active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              पावती प्रिंट (Print)
            </button>
            <button
              id="btn-whatsapp-saved-bill"
              onClick={() => handleShareWhatsApp(savedEntry)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#00523f] hover:bg-[#004232] text-white text-xs font-bold transition shadow-[0_4px_14px_rgba(0,82,63,0.25)] cursor-pointer active:scale-95"
            >
              <Share2 className="w-3.5 h-3.5" />
              व्हॉट्सॲप बिल (WhatsApp)
            </button>
            <button
              id="btn-new-entry-another"
              onClick={resetForm}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-700 text-white text-xs font-semibold hover:bg-slate-800 transition cursor-pointer active:scale-95"
            >
              + पुढील नोंद (Next)
            </button>
          </div>
        </div>
      )}

      {/* Main Entry Card with Crisp borders & clean paddings */}
      <div className="bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {errorMsg && (
            <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm px-4 py-3 rounded-xl flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Product / Item linking to stock */}
          <div className="bg-[#F8F9FA] dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 rounded-xl p-4 space-y-2 relative">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <span>Product / Item</span>
                <span className="font-normal text-slate-500 dark:text-slate-400">
                  (optional — links to stock & auto-deducts)
                </span>
              </label>
              {selectedStockId && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStockId('');
                    setStockSearchQuery('');
                  }}
                  className="text-xs text-rose-500 hover:text-rose-700 font-semibold cursor-pointer"
                >
                  Clear Selection
                </button>
              )}
            </div>

            <div className="relative">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                <input
                  id="input-search-stock"
                  type="text"
                  value={stockSearchQuery}
                  onChange={(e) => {
                    setStockSearchQuery(e.target.value);
                    setIsStockDropdownOpen(true);
                  }}
                  onFocus={() => setIsStockDropdownOpen(true)}
                  placeholder="Search stock items..."
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00523f]/20 focus:border-[#00523f] text-slate-900 dark:text-white placeholder-slate-400 transition"
                />
              </div>

              {/* Stock dropdown list */}
              {isStockDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-30 max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredStock.length > 0 ? (
                    filteredStock.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleSelectStock(item)}
                        className="p-3 hover:bg-emerald-50/60 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between transition text-xs sm:text-sm"
                      >
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{item.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Code: {item.code} • शिल्लक स्टॉक (Stock):{' '}
                            <span
                              className={`font-bold ${
                                item.quantity <= item.minStockLevel
                                  ? 'text-amber-600'
                                  : 'text-emerald-600 dark:text-emerald-400'
                              }`}
                            >
                              {item.quantity} {item.unit}
                            </span>
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs sm:text-sm font-bold text-[#00523f] dark:text-emerald-400">
                            ₹{item.sellingPrice.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            /{item.unit}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-center text-xs text-slate-400">
                      कोणतीही वस्तू सापडली नाही. खाली मॅन्युअली माहिती भरा. (No matching items)
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* If a stock item is selected, show quantity selector */}
            {selectedStockId && (
              <div className="mt-2 flex flex-wrap items-center gap-3 pt-2.5 border-t border-slate-200/80 dark:border-slate-700">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">नग संख्या (Qty):</span>
                <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-2 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => handleStockQtyChange(stockQty - 1)}
                    className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center cursor-pointer text-sm"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={stockQty}
                    onChange={(e) => handleStockQtyChange(parseInt(e.target.value) || 1)}
                    className="w-12 text-center text-xs font-bold text-slate-900 dark:text-white bg-transparent border-0 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleStockQtyChange(stockQty + 1)}
                    className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center cursor-pointer text-sm"
                  >
                    +
                  </button>
                </div>
                <span className="text-xs text-[#00523f] dark:text-emerald-400 font-bold">
                  एकूण रक्कम: ₹
                  {(
                    (stockList.find((s) => s.id === selectedStockId)?.sellingPrice || 0) *
                    stockQty
                  ).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* Form fields grid: 2 columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Customer Name */}
            <div className="relative">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                Customer Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                <input
                  id="input-customer-name"
                  type="text"
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    setIsCustomerDropdownOpen(true);
                  }}
                  onFocus={() => setIsCustomerDropdownOpen(true)}
                  placeholder="Search by name or ID..."
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00523f]/20 focus:border-[#00523f] text-slate-900 dark:text-white placeholder-slate-400 transition"
                  required
                />
                {customerName && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomerName('');
                      setIsCustomerDropdownOpen(false);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center text-xs font-bold cursor-pointer transition"
                    title="Clear"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Customer quick dropdown */}
              {isCustomerDropdownOpen && customerName.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredCustomers.length > 0 && (
                    <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/70 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      जुने ग्राहक ({filteredCustomers.length})
                    </div>
                  )}
                  {filteredCustomers.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => handleSelectCustomer(c)}
                      className="p-3 hover:bg-emerald-50/60 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between text-xs transition"
                    >
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{c.name}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Phone: {c.phone}</p>
                      </div>
                      {c.balanceDue > 0 && (
                        <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 px-2 py-0.5 rounded-full">
                          Due: ₹{c.balanceDue.toLocaleString()}
                        </span>
                      )}
                    </div>
                  ))}
                  <div
                    onClick={() => setIsCustomerDropdownOpen(false)}
                    className="p-2.5 text-center text-xs text-[#00523f] dark:text-emerald-400 font-bold bg-slate-50 dark:bg-slate-800 cursor-pointer hover:bg-emerald-50 dark:hover:bg-slate-750"
                  >
                    + Add as new customer "{customerName}"
                  </div>
                </div>
              )}
            </div>

            {/* Total Amount */}
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                Total Amount (₹) <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-[#00523f] dark:text-emerald-400 font-bold text-sm">
                  ₹
                </div>
                <input
                  id="input-total-amount"
                  type="number"
                  step="0.01"
                  value={totalAmount}
                  onChange={(e) => {
                    setTotalAmount(e.target.value);
                    if (!payingNow || payingNow === totalAmount) {
                      setPayingNow(e.target.value);
                    }
                  }}
                  placeholder="0.00"
                  className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00523f]/20 focus:border-[#00523f] text-slate-900 dark:text-white font-bold placeholder-slate-400 transition"
                  required
                />
              </div>
            </div>

            {/* Customer Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                Customer Phone / WhatsApp <span className="text-slate-400 font-normal">(for invoice share)</span>
              </label>
              <div className="relative flex items-center">
                <Smartphone className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                <input
                  id="input-customer-phone"
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00523f]/20 focus:border-[#00523f] text-slate-900 dark:text-white placeholder-slate-400 transition"
                />
              </div>
            </div>

            {/* Paying Now */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Paying Now (₹) <span className="text-rose-500">*</span>
                </label>
                {dueAmount > 0 ? (
                  <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                    उर्वरित उधारी: ₹{dueAmount.toLocaleString()}
                  </span>
                ) : numTotal > 0 && numPaid === numTotal ? (
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Full Paid
                  </span>
                ) : null}
              </div>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-[#00523f] dark:text-emerald-400 font-bold text-sm">
                  ₹
                </div>
                <input
                  id="input-paying-now"
                  type="number"
                  step="0.01"
                  value={payingNow}
                  onChange={(e) => setPayingNow(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00523f]/20 focus:border-[#00523f] text-slate-900 dark:text-white font-bold placeholder-slate-400 transition"
                  required
                />
              </div>
            </div>

            {/* Item / Details */}
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                Item / Details
              </label>
              <textarea
                id="input-item-details"
                rows={3}
                value={itemDetails}
                onChange={(e) => setItemDetails(e.target.value)}
                placeholder="What was sold or bought (e.g. Rice 10kg, Electric wire)"
                className="w-full p-3 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00523f]/20 focus:border-[#00523f] text-slate-900 dark:text-white placeholder-slate-400 resize-none transition"
              />
            </div>

            {/* Bill / Invoice No. and Date */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  Bill / Invoice No.
                </label>
                <input
                  id="input-invoice-no"
                  type="text"
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  placeholder="INV-2026-1-7120"
                  className="w-full px-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00523f]/20 focus:border-[#00523f] text-slate-900 dark:text-white placeholder-slate-400 transition font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  Date <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                  <input
                    id="input-entry-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00523f]/20 focus:border-[#00523f] text-slate-900 dark:text-white transition"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Link Scheme Card (Optional) */}
          <div className="p-4 sm:p-5 bg-[#F8F9FA] dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#00523f] dark:text-emerald-400" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Link Scheme Card to this Bill (Optional / कार्ड लिंक करें)
                </span>
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                स्कीम १, २, ३
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Card Scheme
                </label>
                <select
                  value={selectedSchemeId}
                  onChange={(e) => {
                    const sid = e.target.value as CardSchemeId | '';
                    setSelectedSchemeId(sid);
                  }}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  <option value="">No Card Scheme (Regular Customer)</option>
                  {SCHEMES_CONFIG.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code} • Nos {s.startCardNo}-{s.endCardNo})
                    </option>
                  ))}
                </select>
              </div>

              {selectedSchemeId && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Card Number ({SCHEMES_CONFIG.find((s) => s.id === selectedSchemeId)?.startCardNo} - {SCHEMES_CONFIG.find((s) => s.id === selectedSchemeId)?.endCardNo})
                  </label>
                  <input
                    type="number"
                    placeholder={`e.g. ${SCHEMES_CONFIG.find((s) => s.id === selectedSchemeId)?.startCardNo || 1001}`}
                    value={selectedCardNumber}
                    onChange={(e) => setSelectedCardNumber(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-[#00523f] dark:text-emerald-400 focus:outline-none"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Payment Mode */}
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
              Payment Mode
            </label>
            <div className="grid grid-cols-2 gap-3 max-w-md">
              <button
                type="button"
                id="btn-mode-cash"
                onClick={() => setPaymentMode('Cash')}
                className={`flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer border ${
                  paymentMode === 'Cash'
                    ? 'border-[#00523f] bg-emerald-50 dark:bg-emerald-950/50 text-[#00523f] dark:text-emerald-300 shadow-sm ring-1 ring-[#00523f]'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                } active:scale-95`}
              >
                <Banknote
                  className={`w-4 h-4 ${
                    paymentMode === 'Cash' ? 'text-[#00523f] dark:text-emerald-400' : 'text-slate-400'
                  }`}
                />
                <span>Cash</span>
              </button>

              <button
                type="button"
                id="btn-mode-online"
                onClick={() => setPaymentMode('Online')}
                className={`flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer border ${
                  paymentMode === 'Online'
                    ? 'border-[#00523f] bg-emerald-50 dark:bg-emerald-950/50 text-[#00523f] dark:text-emerald-300 shadow-sm ring-1 ring-[#00523f]'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                } active:scale-95`}
              >
                <Smartphone
                  className={`w-4 h-4 ${
                    paymentMode === 'Online' ? 'text-[#00523f] dark:text-emerald-400' : 'text-slate-400'
                  }`}
                />
                <span>Online (GPay/UPI)</span>
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
              Notes / Remarks
            </label>
            <textarea
              id="input-entry-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special notes, serial numbers, or remarks..."
              className="w-full p-3 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00523f]/20 focus:border-[#00523f] text-slate-900 dark:text-white placeholder-slate-400 resize-none transition"
            />
          </div>

          {/* Bottom Action bar */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-xs">
              <button
                type="button"
                id="btn-reset-form"
                onClick={resetForm}
                className="px-3 py-1.5 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 font-medium flex items-center gap-1.5 cursor-pointer transition active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Form
              </button>
              <span className="text-slate-400 hidden sm:inline-flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-slate-400" />
                Press Tab to navigate fields
              </span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                id="btn-cancel-entry"
                onClick={onBackToDashboard}
                className="w-1/2 sm:w-auto px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer active:scale-95"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="btn-submit-entry"
                disabled={isSubmitting}
                className="w-1/2 sm:w-auto px-6 py-2 rounded-xl bg-[#00523f] hover:bg-[#004232] text-white text-xs sm:text-sm font-bold shadow-[0_4px_14px_rgba(0,82,63,0.25)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 active:scale-95"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save Entry</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Bottom 3 Bento Summary cards matching Landing Page aesthetics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Today's Summary */}
        <div className="bg-white dark:bg-[#131b2e] rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-[0_10px_30px_-6px_rgba(0,0,0,0.03)] p-5 sm:p-6 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">आजचा व्यवहार सारांश</h2>
              <p className="text-[11px] text-slate-400">Today's Register</p>
            </div>
            <span className="text-xs text-[#00523f] dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
              {todaysTransactions.length} नोंदी (Bills)
            </span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                रोख जमा (Cash In):
              </span>
              <span className="font-bold text-slate-900 dark:text-white">
                ₹{todayCashIn.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                ऑनलाइन जमा (Online UPI):
              </span>
              <span className="font-bold text-slate-900 dark:text-white">
                ₹{todayOnlineIn.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 pt-1.5 border-t border-slate-100 dark:border-slate-800">
              <span className="flex items-center gap-1.5 font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                उधारी येणे बाकी (Pending Udhar):
              </span>
              <span className="font-bold text-amber-600 dark:text-amber-400">
                ₹{todayTotalDues.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* This Month */}
        <div className="bg-white dark:bg-[#131b2e] rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-[0_10px_30px_-6px_rgba(0,0,0,0.03)] p-5 sm:p-6 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">चालू महिना विक्री</h2>
              <p className="text-[11px] text-slate-400">This Month Sales</p>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">2026</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span>एकूण गल्ला (Total Revenue):</span>
              <span className="font-bold text-[#00523f] dark:text-emerald-400 text-sm">
                ₹
                {(
                  todayCashIn +
                  todayOnlineIn +
                  todaysTransactions.reduce((a, b) => a + b.totalAmount, 0)
                ).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span>लाइव्ह डोमेन (Domain):</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                {settings.domainName}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
              इलेक्ट्रॉनिक्स आणि फर्निचर स्टॉक व बिलिंग सुरक्षित क्लाउडवर स्वयंचलित सुरक्षित राहते.
            </p>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="bg-white dark:bg-[#131b2e] rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-[0_10px_30px_-6px_rgba(0,0,0,0.03)] p-5 sm:p-6 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">जलद बिलिंग टिप्स</h2>
              <p className="text-[11px] text-slate-400">Pro Tips</p>
            </div>
          </div>
          <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2">
            <li className="flex items-start gap-1.5">
              <span className="text-[#00523f] dark:text-emerald-400 font-bold">•</span>
              <span>वस्तू स्टॉकमधून निवडल्यास गोदामातील शिल्लक आपोआप कमी होते.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-[#00523f] dark:text-emerald-400 font-bold">•</span>
              <span>बिल सेव्ह झाल्यावर थेट व्हॉट्सॲप बटणाने ग्राहकाला पावती पाठवा.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-[#00523f] dark:text-emerald-400 font-bold">•</span>
              <span>उधारी असल्यास ग्राहकाच्या खात्यात बाकी आपोआप अपडेट होते.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
