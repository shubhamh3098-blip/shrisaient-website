import React, { useState, useEffect } from 'react';
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

  // Filter stock
  const filteredStock = stockList.filter((item) =>
    item.name.toLowerCase().includes(stockSearchQuery.toLowerCase()) ||
    item.code.toLowerCase().includes(stockSearchQuery.toLowerCase())
  );

  // Filter customers
  const filteredCustomers = customersList.filter((c) =>
    c.name.toLowerCase().includes(customerName.toLowerCase()) ||
    c.phone.includes(customerName)
  );

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
      `*${settings.businessName}*\nBill / Invoice: ${entry.invoiceNo}\nDate: ${entry.date}\nCustomer: ${entry.customerName}\nItem: ${entry.itemDetails}\nTotal Amount: ₹${(Number(entry.totalAmount) || 0).toLocaleString()}\nPaid: ₹${(Number(entry.payingNow) || 0).toLocaleString()} (${entry.paymentMode})\nDue Balance: ₹${(Number(entry.dueAmount) || 0).toLocaleString()}\n\nThank you for doing business with Shri Sai Enterprises!`
    );
    const phone = entry.customerPhone ? entry.customerPhone.replace(/[^0-9]/g, '') : '';
    const url = phone ? `https://wa.me/91${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header bar matching screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Add Entry
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Record a sale or cash entry for {settings.businessName}.
          </p>
        </div>
        <button
          id="btn-back-dashboard"
          onClick={onBackToDashboard}
          className="inline-flex items-center text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition self-start sm:self-auto cursor-pointer"
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* Success banner after saving */}
      {savedEntry && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                Entry recorded successfully! (#{savedEntry.invoiceNo})
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                Total: ₹{(Number(savedEntry.totalAmount) || 0).toLocaleString()} • Paid: ₹{(Number(savedEntry.payingNow) || 0).toLocaleString()} ({savedEntry.paymentMode})
                {(Number(savedEntry.dueAmount) || 0) > 0 && ` • Due Balance: ₹${(Number(savedEntry.dueAmount) || 0).toLocaleString()}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="btn-print-saved-bill"
              onClick={() => onOpenInvoiceModal(savedEntry)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-100 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Receipt
            </button>
            <button
              id="btn-whatsapp-saved-bill"
              onClick={() => handleShareWhatsApp(savedEntry)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition shadow-xs cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              WhatsApp Bill
            </button>
            <button
              id="btn-new-entry-another"
              onClick={resetForm}
              className="px-3 py-1.5 rounded-lg bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white text-xs font-medium transition cursor-pointer"
            >
              + Next Entry
            </button>
          </div>
        </div>
      )}

      {/* Main Entry Card matching screenshot */}
      <div className="bg-white dark:bg-slate-800/95 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm p-5 sm:p-7">
        <form onSubmit={handleSubmit} className="space-y-6">
          {errorMsg && (
            <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm px-4 py-3 rounded-xl flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Product / Item linking to stock */}
          <div className="bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700 rounded-xl p-4 space-y-2 relative">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Product / Item{' '}
                <span className="font-normal text-slate-400 dark:text-slate-500">
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
                  className="text-xs text-rose-500 hover:text-rose-700 dark:text-rose-400 font-medium cursor-pointer"
                >
                  Clear Selection
                </button>
              )}
            </div>

            <div className="relative">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
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
                  className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition"
                />
              </div>

              {/* Stock dropdown list */}
              {isStockDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-30 max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredStock.length > 0 ? (
                    filteredStock.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleSelectStock(item)}
                        className="p-2.5 hover:bg-blue-50/60 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between transition text-xs sm:text-sm"
                      >
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100">{item.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Code: {item.code} • In Stock:{' '}
                            <span
                              className={`font-semibold ${
                                item.quantity <= item.minStockLevel
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : 'text-emerald-600 dark:text-emerald-400'
                              }`}
                            >
                              {item.quantity} {item.unit}
                            </span>
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                            ₹{(Number(item.sellingPrice) || 0).toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            /{item.unit}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-center text-xs text-slate-400 dark:text-slate-500">
                      No matching stock items. You can still type details manually below.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* If a stock item is selected, show quantity selector */}
            {selectedStockId && (
              <div className="mt-2 flex items-center gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-700">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Quantity:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleStockQtyChange(stockQty - 1)}
                    className="w-7 h-7 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={stockQty}
                    onChange={(e) => handleStockQtyChange(parseInt(e.target.value) || 1)}
                    className="w-16 text-center py-1 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded font-semibold text-slate-800 dark:text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={() => handleStockQtyChange(stockQty + 1)}
                    className="w-7 h-7 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center cursor-pointer"
                  >
                    +
                  </button>
                </div>
                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  Auto-calculated total: ₹
                  {(
                    ((stockList.find((s) => s.id === selectedStockId)?.sellingPrice || 0) *
                    stockQty) || 0
                  ).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* Form fields grid: 2 columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Customer Name */}
            <div className="relative">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Customer Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <User className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
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
                  className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition"
                  required
                />
              </div>

              {/* Customer quick dropdown */}
              {isCustomerDropdownOpen && customerName.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredCustomers.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => handleSelectCustomer(c)}
                      className="p-2.5 hover:bg-blue-50/60 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between text-xs transition"
                    >
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{c.name}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Phone: {c.phone}</p>
                      </div>
                      {(Number(c.balanceDue) || 0) > 0 && (
                        <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded">
                          Due: ₹{(Number(c.balanceDue) || 0).toLocaleString()}
                        </span>
                      )}
                    </div>
                  ))}
                  <div
                    onClick={() => setIsCustomerDropdownOpen(false)}
                    className="p-2 text-center text-xs text-blue-600 dark:text-blue-400 font-medium bg-slate-50 dark:bg-slate-800 cursor-pointer hover:bg-blue-50 dark:hover:bg-slate-700"
                  >
                    + Keep "{customerName}" as customer
                  </div>
                </div>
              )}
            </div>

            {/* Total Amount */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Total Amount (₹) <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3 text-slate-400 font-semibold text-sm">
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
                  className="w-full pl-8 pr-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-900 dark:text-slate-100 font-medium placeholder-slate-400 dark:placeholder-slate-500 transition"
                  required
                />
              </div>
            </div>

            {/* Customer Phone (Optional helper for receipts & WhatsApp) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Customer Phone / WhatsApp{' '}
                <span className="text-slate-400 dark:text-slate-500 font-normal">(for invoice share)</span>
              </label>
              <input
                id="input-customer-phone"
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="e.g. 9876543210"
                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition"
              />
            </div>

            {/* Paying Now */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Paying Now (₹) <span className="text-rose-500">*</span>
                </label>
                {(Number(dueAmount) || 0) > 0 ? (
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                    Remaining Udhar: ₹{(Number(dueAmount) || 0).toLocaleString()}
                  </span>
                ) : numTotal > 0 && numPaid === numTotal ? (
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                    ✓ Full Payment
                  </span>
                ) : null}
              </div>
              <div className="relative flex items-center">
                <div className="absolute left-3 text-slate-400 font-semibold text-sm">
                  ₹
                </div>
                <input
                  id="input-paying-now"
                  type="number"
                  step="0.01"
                  value={payingNow}
                  onChange={(e) => setPayingNow(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-900 dark:text-slate-100 font-medium placeholder-slate-400 dark:placeholder-slate-500 transition"
                  required
                />
              </div>
            </div>

            {/* Item / Details */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Item / Details
              </label>
              <textarea
                id="input-item-details"
                rows={3}
                value={itemDetails}
                onChange={(e) => setItemDetails(e.target.value)}
                placeholder="What was sold or bought (e.g. Rice 10kg, Electric wire)"
                className="w-full p-3 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 resize-none transition"
              />
            </div>

            {/* Bill / Invoice No. and Date */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Bill / Invoice No.
                </label>
                <input
                  id="input-invoice-no"
                  type="text"
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  placeholder="e.g. INV-2024-001"
                  className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Date <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                  <input
                    id="input-entry-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-800 dark:text-slate-100 transition"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Link Scheme Card (Optional) */}
          <div className="p-4 bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Link Scheme Card to this Bill (Optional / कार्ड लिंक करें)
                </span>
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">Card Schems 1, 2, 3</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Card Scheme
                </label>
                <select
                  value={selectedSchemeId}
                  onChange={(e) => {
                    const sid = e.target.value as CardSchemeId | '';
                    setSelectedSchemeId(sid);
                  }}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg text-xs"
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
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Card Number (कार्ड नंबर)
                  </label>
                  <input
                    type="number"
                    placeholder={`e.g. ${SCHEMES_CONFIG.find((s) => s.id === selectedSchemeId)?.startCardNo || 1001}`}
                    value={selectedCardNumber}
                    onChange={(e) => setSelectedCardNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg text-xs font-mono font-bold text-blue-700 dark:text-blue-400"
                  />
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
                    Range: {SCHEMES_CONFIG.find((s) => s.id === selectedSchemeId)?.startCardNo} - {SCHEMES_CONFIG.find((s) => s.id === selectedSchemeId)?.endCardNo}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Payment Mode */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Payment Mode
            </label>
            <div className="grid grid-cols-2 gap-3 max-w-md">
              <button
                type="button"
                id="btn-mode-cash"
                onClick={() => setPaymentMode('Cash')}
                className={`flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl font-semibold text-sm transition cursor-pointer border-2 ${
                  paymentMode === 'Cash'
                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Banknote
                  className={`w-5 h-5 ${
                    paymentMode === 'Cash' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
                  }`}
                />
                <span>Cash</span>
              </button>

              <button
                type="button"
                id="btn-mode-online"
                onClick={() => setPaymentMode('Online')}
                className={`flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl font-semibold text-sm transition cursor-pointer border-2 ${
                  paymentMode === 'Online'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Smartphone
                  className={`w-5 h-5 ${
                    paymentMode === 'Online' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'
                  }`}
                />
                <span>Online (UPI)</span>
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Notes
            </label>
            <textarea
              id="input-entry-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any extra notes"
              className="w-full p-3 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 resize-none transition"
            />
          </div>

          {/* Bottom Action bar */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-xs">
              <button
                type="button"
                id="btn-reset-form"
                onClick={resetForm}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Form
              </button>
              <span className="text-slate-400 dark:text-slate-500 hidden sm:inline-flex items-center gap-1">
                <Info className="w-3.5 h-3.5" />
                Tip: Use Tab to navigate quickly
              </span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                id="btn-cancel-entry"
                onClick={onBackToDashboard}
                className="w-1/2 sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="btn-submit-entry"
                disabled={isSubmitting}
                className="w-1/2 sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-600/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Save Entry</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Bottom 3 cards matching screenshot */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Today's Summary */}
        <div className="bg-white dark:bg-slate-800/95 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-2.5">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Today's Summary</h2>
            <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-md">
              {todaysTransactions.length} Entries
            </span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Cash Received:
              </span>
              <span className="font-semibold text-slate-900 dark:text-white">
                ₹{(Number(todayCashIn) || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Online (UPI) In:
              </span>
              <span className="font-semibold text-slate-900 dark:text-white">
                ₹{(Number(todayOnlineIn) || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-100 dark:border-slate-700/60">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Udhar (Pending Dues):
              </span>
              <span className="font-bold text-amber-600 dark:text-amber-400">
                ₹{(Number(todayTotalDues) || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* This Month */}
        <div className="bg-white dark:bg-slate-800/95 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-2.5">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">This Month</h2>
            <span className="text-xs text-slate-400 font-medium">September 2026</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span>Total Revenue:</span>
              <span className="font-bold text-slate-900 dark:text-white text-sm">
                ₹
                {(
                  (Number(todayCashIn) || 0) +
                  (Number(todayOnlineIn) || 0) +
                  todaysTransactions.reduce((a, b) => a + (Number(b.totalAmount) || 0), 0)
                ).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span>Domain Active:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
                {settings.domainName}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-700/60">
              Track real-time transactions & inventory effortlessly.
            </p>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="bg-white dark:bg-slate-800/95 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs p-5 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-2.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Quick Tips</h2>
          </div>
          <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2 list-disc list-inside">
            <li>Link items from stock to auto-deduct inventory on save.</li>
            <li>Press Tab to swiftly jump through customer and amount fields.</li>
            <li>Use the WhatsApp button after saving to send instant e-bills.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
