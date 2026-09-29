import React, { useState } from 'react';
import {
  ShoppingCart,
  Search,
  Plus,
  Trash2,
  Printer,
  CheckCircle,
  User,
  Phone,
  MapPin,
  FileText,
  Percent,
  CreditCard,
  History,
  RotateCcw,
  Barcode,
  Sparkles,
  RefreshCw,
  Gift,
  Link,
  Tag,
  X
} from 'lucide-react';
import { Customer, InvoiceItem, StockItem, StoreData, Transaction, BillReceipt, CardMember } from '../../types';
import { StorageService } from '../../services/storageService';
import { NotificationService } from '../../services/notificationService';
import { useTheme } from '../../context/ThemeContext';

interface PosInvoiceViewProps {
  storeData: StoreData;
  onRefreshData: () => void;
  onPrintInvoice: (tx: Transaction) => void;
}

export const PosInvoiceView: React.FC<PosInvoiceViewProps> = ({
  storeData,
  onRefreshData,
  onPrintInvoice,
}) => {
  const { isDayMode } = useTheme();
  const [activeTab, setActiveTab] = useState<'terminal' | 'history'>('terminal');
  const [searchItemQuery, setSearchItemQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Customer state
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customCustomerName, setCustomCustomerName] = useState<string>('');
  const [customCustomerPhone, setCustomCustomerPhone] = useState<string>('');
  const [customCustomerAddress, setCustomCustomerAddress] = useState<string>('Wardha');

  // Cart items
  const [cart, setCart] = useState<InvoiceItem[]>([]);
  const [paymentMode, setPaymentMode] = useState<Transaction['paymentMode']>('Cash');
  const [paidAmountInput, setPaidAmountInput] = useState<number | ''>('');
  const [remarks, setRemarks] = useState<string>('');
  const [deliveryStatus, setDeliveryStatus] = useState<Transaction['deliveryStatus']>('Delivered');
  const [successTx, setSuccessTx] = useState<Transaction | null>(null);

  // Card Scheme Linking State
  const [linkedCardNo, setLinkedCardNo] = useState<string>('');
  const [linkedCardMember, setLinkedCardMember] = useState<CardMember | null>(null);
  const [showCardSelector, setShowCardSelector] = useState<boolean>(false);
  const [cardSearchQuery, setCardSearchQuery] = useState<string>('');

  // Filter stock items
  const filteredStock = storeData.stock.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchItemQuery.toLowerCase()) ||
      item.code.toLowerCase().includes(searchItemQuery.toLowerCase()) ||
      item.brand.toLowerCase().includes(searchItemQuery.toLowerCase()) ||
      (item.model && item.model.toLowerCase().includes(searchItemQuery.toLowerCase())) ||
      (item.serialNo && item.serialNo.toLowerCase().includes(searchItemQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Add item to cart with serial number guaranteed
  const handleAddToCart = (stock: StockItem) => {
    const sNo = stock.serialNo && stock.serialNo.trim() !== ''
      ? stock.serialNo
      : `${stock.brand.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`;

    const existingIndex = cart.findIndex((item) => item.stockId === stock.id);
    if (existingIndex !== -1) {
      const updated = [...cart];
      if (updated[existingIndex].qty < stock.stockQty) {
        updated[existingIndex].qty += 1;
        const sub = updated[existingIndex].qty * updated[existingIndex].rate;
        const disc = sub * (updated[existingIndex].discountPct / 100);
        updated[existingIndex].total = sub - disc;
        setCart(updated);
      }
    } else {
      const rate = stock.salePrice;
      const newItem: InvoiceItem = {
        stockId: stock.id,
        name: stock.name,
        brand: stock.brand,
        model: stock.model,
        serialNo: sNo,
        qty: 1,
        rate,
        discountPct: 0,
        taxPct: stock.category === 'Electronics' ? 18 : 12,
        total: rate,
      };
      setCart([...cart, newItem]);
    }
  };

  const updateCartQty = (index: number, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(index);
      return;
    }
    const item = cart[index];
    const stockItem = storeData.stock.find((s) => s.id === item.stockId);
    if (stockItem && newQty > stockItem.stockQty) {
      alert(`Only ${stockItem.stockQty} units available in stock!`);
      return;
    }
    const updated = [...cart];
    updated[index].qty = newQty;
    const sub = updated[index].qty * updated[index].rate;
    const disc = sub * (updated[index].discountPct / 100);
    updated[index].total = sub - disc;
    setCart(updated);
  };

  const updateCartDiscount = (index: number, discPct: number) => {
    const updated = [...cart];
    updated[index].discountPct = discPct;
    const sub = updated[index].qty * updated[index].rate;
    const disc = sub * (discPct / 100);
    updated[index].total = sub - disc;
    setCart(updated);
  };

  const updateCartSerial = (index: number, newSerial: string) => {
    const updated = [...cart];
    updated[index].serialNo = newSerial;
    setCart(updated);
  };

  const updateCartModel = (index: number, newModel: string) => {
    const updated = [...cart];
    updated[index].model = newModel;
    setCart(updated);
  };

  const handleSelectCardMember = (member: CardMember) => {
    setLinkedCardMember(member);
    setLinkedCardNo(member.cardNo);
    setShowCardSelector(false);
    if (!customCustomerName.trim()) {
      setCustomCustomerName(member.memberName);
    }
    if (!customCustomerPhone.trim()) {
      setCustomCustomerPhone(member.phone);
    }
    if (!customCustomerAddress.trim() || customCustomerAddress === 'Wardha') {
      setCustomCustomerAddress(member.village || member.address || 'Wardha');
    }
  };

  const handleClearCardLink = () => {
    setLinkedCardMember(null);
    setLinkedCardNo('');
    setCardSearchQuery('');
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + item.qty * item.rate, 0);
  const discountTotal = cart.reduce((acc, item) => acc + (item.qty * item.rate * item.discountPct) / 100, 0);
  const taxableAmount = subtotal - discountTotal;
  const taxTotal = cart.reduce((acc, item) => {
    const itemTaxable = item.qty * item.rate * (1 - item.discountPct / 100);
    return acc + (itemTaxable * item.taxPct) / 100;
  }, 0);
  const grandTotal = Math.round(taxableAmount);
  const finalPaidAmount = paidAmountInput === '' ? grandTotal : Number(paidAmountInput);
  const balanceDue = Math.max(0, grandTotal - finalPaidAmount);

  // Generate Invoice
  const handleGenerateInvoice = () => {
    if (cart.length === 0) {
      alert('कृपया बिलासाठी किमान १ वस्तू निवडा.');
      return;
    }

    const custName = customCustomerName.trim() || 'Walk-in Customer';
    const custPhone = customCustomerPhone.trim() || '0';
    const custAddr = customCustomerAddress.trim() || 'Wardha';

    const data = StorageService.loadData();
    let targetCustomerId = selectedCustomerId;

    if (selectedCustomerId) {
      const existing = data.customers.find((c) => c.id === selectedCustomerId);
      if (existing) {
        existing.totalPurchased += grandTotal;
        existing.currentBalance += balanceDue;
      }
    } else {
      const newCustId = `cust_${Date.now()}`;
      targetCustomerId = newCustId;
      const newCust: Customer = {
        id: newCustId,
        name: custName,
        phone: custPhone,
        address: custAddr,
        city: 'Wardha',
        creditLimit: 30000,
        currentBalance: balanceDue,
        totalPurchased: grandTotal,
        createdAt: new Date().toISOString(),
      };
      data.customers.unshift(newCust);
    }

    const nextInvNo = data.settings.nextInvoiceNo || 1080;
    data.settings.nextInvoiceNo = nextInvNo + 1;

    const newTx: Transaction = {
      id: `tx_${Date.now()}`,
      invoiceNo: `SSE-INV-${nextInvNo}`,
      date: new Date().toISOString().slice(0, 10),
      customerId: targetCustomerId,
      customerName: custName,
      customerPhone: custPhone,
      customerAddress: custAddr,
      paymentMode: paymentMode,
      items: cart,
      subtotal: subtotal,
      discountTotal: discountTotal,
      taxTotal: Math.round(taxTotal),
      grandTotal: grandTotal,
      paidAmount: finalPaidAmount,
      balanceDue: balanceDue,
      deliveryStatus: deliveryStatus,
      status: finalPaidAmount >= grandTotal ? 'Paid' : finalPaidAmount > 0 ? 'Partial' : 'Unpaid',
      linkedCardId: linkedCardMember?.id || undefined,
      linkedCardNo: linkedCardNo.trim() || linkedCardMember?.cardNo || undefined,
      remarks: remarks || (linkedCardNo ? `Linked Scheme Card: ${linkedCardNo}` : undefined),
      createdBy: 'Admin (Bhushan)',
    };

    data.transactions.unshift(newTx);

    // Deduct stock for each cart item
    cart.forEach((cartItem) => {
      const sItem = data.stock.find((s) => s.id === cartItem.stockId);
      if (sItem && sItem.stockQty >= cartItem.qty) {
        sItem.stockQty -= cartItem.qty;
      }
    });

    // If paidAmount > 0, generate Bill Receipt
    if (finalPaidAmount > 0) {
      const recNum = data.settings.nextReceiptNo || 1079;
      data.settings.nextReceiptNo = recNum + 1;
      const receiptPaymentMode: BillReceipt['paymentMode'] =
        paymentMode === 'UPI' ? 'UPI' :
        paymentMode === 'Card' ? 'Card' :
        paymentMode === 'Cheque' ? 'Cheque' : 'Cash';

      data.billReceipts.unshift({
        id: `rec_${Date.now()}`,
        receiptNo: recNum,
        customerId: targetCustomerId,
        customerName: custName,
        invoiceNo: newTx.invoiceNo,
        amountPaid: finalPaidAmount,
        date: new Date().toISOString().slice(0, 10),
        paymentMode: receiptPaymentMode,
        balanceRemaining: balanceDue,
        remarks: `POS Counter Sale Payment for Invoice #${nextInvNo}${linkedCardNo ? ` | Linked Card: ${linkedCardNo}` : ''}`,
        handledBy: 'Admin (Bhushan)',
      });
    }

    StorageService.saveData(data);
    onRefreshData();
    setSuccessTx(newTx);

    // Fire real-time notification
    NotificationService.addNotification({
      type: 'order_completed',
      title: 'नवीन विक्री बिल तयार (POS Sale Completed)',
      message: `${custName} यांच्यासाठी ₹${grandTotal.toLocaleString('en-IN')} चे बिल (${newTx.invoiceNo}) पूर्ण झाले.`,
      data: {
        amount: grandTotal,
        customerName: custName,
        customerPhone: custPhone,
        itemNames: cart.map((i) => i.name),
        invoiceNo: newTx.invoiceNo,
      },
    });

    setCart([]);
    setPaidAmountInput('');
    setCustomCustomerName('');
    setCustomCustomerPhone('');
    setSelectedCustomerId('');
    setLinkedCardNo('');
    setLinkedCardMember(null);
    setShowCardSelector(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className={`text-xl font-extrabold flex items-center gap-2 ${
            isDayMode ? 'text-slate-900' : 'text-white'
          }`}>
            <ShoppingCart className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <span>POS Billing Terminal & Invoice Creator</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            शो-रूम बिलिंग टर्मिनल • प्रत्येक प्रॉडक्टसाठी सिरीयल नंबर ऑटोमॅटिक लिंक
          </p>
        </div>

        {/* Tab switch */}
        <div className={`flex items-center p-1 rounded-2xl border ${
          isDayMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
        }`}>
          <button
            onClick={() => setActiveTab('terminal')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'terminal'
                ? 'bg-teal-600 text-white shadow-sm'
                : isDayMode ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
            }`}
          >
            Billing Terminal
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'history'
                ? 'bg-teal-600 text-white shadow-sm'
                : isDayMode ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Invoice History ({storeData.transactions.length})</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successTx && (
        <div className={`p-4 rounded-3xl border flex items-center justify-between text-xs animate-in fade-in duration-300 ${
          isDayMode
            ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
            : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
        }`}>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
            <div>
              <p className="font-bold text-emerald-800 dark:text-emerald-300">
                Invoice {successTx.invoiceNo} generated successfully!
              </p>
              <p className="text-emerald-600 dark:text-emerald-400">
                Customer: {successTx.customerName} • Grand Total: ₹{successTx.grandTotal.toLocaleString('en-IN')} (Paid: ₹{successTx.paidAmount.toLocaleString('en-IN')})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPrintInvoice(successTx)}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition cursor-pointer shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Invoice</span>
            </button>
            <button
              onClick={() => setSuccessTx(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-white px-2 py-1 text-xs cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {activeTab === 'terminal' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Product Selector & Catalog (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Search & Category Filter */}
            <div className={`p-4 rounded-3xl border space-y-3 ${
              isDayMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
            }`}>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search product by name, brand, model, SKU, serial number..."
                  value={searchItemQuery}
                  onChange={(e) => setSearchItemQuery(e.target.value)}
                  className={`w-full rounded-2xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-teal-500 border ${
                    isDayMode
                      ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                      : 'bg-slate-800/80 border-slate-700 text-white placeholder-slate-500'
                  }`}
                />
              </div>

              {/* Category Chips */}
              <div className="flex flex-wrap gap-1.5">
                {['All', 'Electronics', 'Furniture', 'Home Appliances', 'Kitchen Appliances'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-teal-600 text-white shadow-sm'
                        : isDayMode
                        ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Cards Grid with Serial Number Badge */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[560px] overflow-y-auto pr-1">
              {filteredStock.map((stock) => {
                const inCart = cart.find((i) => i.stockId === stock.id);
                const isOutOfStock = stock.stockQty <= 0;
                return (
                  <div
                    key={stock.id}
                    className={`rounded-2xl p-3.5 flex flex-col justify-between transition border ${
                      isDayMode
                        ? inCart
                          ? 'border-teal-500 bg-teal-50/50 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300 shadow-sm'
                        : inCart
                        ? 'border-teal-500/60 bg-slate-800/40'
                        : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-1">
                        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-lg border ${
                          isDayMode
                            ? 'bg-slate-100 text-slate-600 border-slate-200'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}>
                          {stock.category}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                            stock.stockQty <= stock.minAlertQty
                              ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30'
                              : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {stock.stockQty} {stock.unit} in stock
                        </span>
                      </div>
                      <h4 className={`text-xs font-bold line-clamp-2 mt-1.5 ${
                        isDayMode ? 'text-slate-900' : 'text-white'
                      }`}>
                        {stock.name}
                      </h4>
                      <div className="text-[11px] text-slate-400 mt-1 space-y-0.5">
                        <p>Brand: <span className="font-semibold text-slate-600 dark:text-slate-300">{stock.brand}</span> ({stock.model})</p>
                        <div className="flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 font-mono">
                          <Barcode className="w-3 h-3" />
                          <span>S/N: {stock.serialNo || 'Auto-Generates on Selection'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-sm font-extrabold text-teal-600 dark:text-teal-400">
                          ₹{stock.salePrice.toLocaleString('en-IN')}
                        </span>
                        {stock.mrp > stock.salePrice && (
                          <span className="text-[10px] text-slate-400 line-through ml-1.5">
                            MRP ₹{stock.mrp.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleAddToCart(stock)}
                        disabled={isOutOfStock}
                        className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl transition cursor-pointer ${
                          isOutOfStock
                            ? 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed'
                            : inCart
                            ? 'bg-teal-600 text-white shadow-sm'
                            : isDayMode
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                            : 'bg-slate-800 hover:bg-slate-700 text-white'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{inCart ? `Add (${inCart.qty})` : 'Add to Bill'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Invoice Cart & Customer Checkout (5 cols) */}
          <div className={`lg:col-span-5 rounded-3xl border p-5 flex flex-col justify-between space-y-4 shadow-sm ${
            isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <div className="space-y-4">
              {/* Customer Selector */}
              <div className="border-b border-slate-200 dark:border-slate-800 pb-3 space-y-2.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>Customer Details (ग्राहक तपशील)</span>
                  <button
                    onClick={() => {
                      setSelectedCustomerId('');
                      setCustomCustomerName('');
                      setCustomCustomerPhone('');
                    }}
                    className="text-[10px] text-teal-600 dark:text-teal-400 hover:underline cursor-pointer font-semibold"
                  >
                    Clear / Walk-in
                  </button>
                </label>

                {/* Existing Customer Dropdown */}
                <select
                  value={selectedCustomerId}
                  onChange={(e) => {
                    setSelectedCustomerId(e.target.value);
                    const found = storeData.customers.find((c) => c.id === e.target.value);
                    if (found) {
                      setCustomCustomerName(found.name);
                      setCustomCustomerPhone(found.phone);
                      setCustomCustomerAddress(found.address + ', ' + found.city);
                    }
                  }}
                  className={`w-full rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-teal-500 border ${
                    isDayMode
                      ? 'bg-slate-50 border-slate-200 text-slate-800'
                      : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                >
                  <option value="">-- Select Registered Customer (Optional) --</option>
                  {storeData.customers.slice(0, 100).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone}) - Due: ₹{c.currentBalance}
                    </option>
                  ))}
                </select>

                {/* Manual Name & Phone */}
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Customer Name"
                    value={customCustomerName}
                    onChange={(e) => setCustomCustomerName(e.target.value)}
                    className={`rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-teal-500 border ${
                      isDayMode
                        ? 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
                        : 'bg-slate-800/80 border-slate-700 text-white placeholder-slate-500'
                    }`}
                  />
                  <input
                    type="text"
                    placeholder="Mobile (+91...)"
                    value={customCustomerPhone}
                    onChange={(e) => setCustomCustomerPhone(e.target.value)}
                    className={`rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-teal-500 border ${
                      isDayMode
                        ? 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
                        : 'bg-slate-800/80 border-slate-700 text-white placeholder-slate-500'
                    }`}
                  />
                </div>

                {/* Link Bill to 30-Month Scheme Card */}
                <div className="p-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Gift className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-[11px] font-bold text-slate-800 dark:text-amber-300">
                        कार्ड योजना लिंक (Scheme Card Link)
                      </span>
                    </div>
                    {linkedCardNo && (
                      <button
                        type="button"
                        onClick={handleClearCardLink}
                        className="text-[10px] text-rose-500 hover:underline flex items-center gap-0.5 font-semibold"
                      >
                        <X className="w-3 h-3" />
                        <span>Unlink</span>
                      </button>
                    )}
                  </div>

                  {linkedCardMember ? (
                    <div className={`p-2 rounded-lg border text-xs flex items-center justify-between ${
                      isDayMode ? 'bg-white border-amber-300' : 'bg-slate-900 border-amber-500/40'
                    }`}>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span className="font-mono bg-amber-500 text-slate-950 px-1 py-0.2 rounded text-[10px] font-bold">
                            {linkedCardMember.cardNo}
                          </span>
                          <span>{linkedCardMember.memberName}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {linkedCardMember.village || 'Wardha'} • {linkedCardMember.totalPaidMonths}/30 हप्ते भरले
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        ✓ Linked
                      </span>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="flex gap-1.5">
                        <div className="relative flex-1">
                          <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="कार्ड नंबर / सभासद शोधा..."
                            value={cardSearchQuery}
                            onChange={(e) => {
                              setCardSearchQuery(e.target.value);
                              setShowCardSelector(true);
                            }}
                            onFocus={() => setShowCardSelector(true)}
                            className={`w-full pl-7 pr-2 py-1 rounded-lg text-xs focus:outline-none border ${
                              isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-700 text-white'
                            }`}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowCardSelector(!showCardSelector)}
                          className="px-2 py-1 rounded-lg text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1"
                        >
                          <Link className="w-3 h-3" />
                          <span>{showCardSelector ? 'बंद' : 'निवडा'}</span>
                        </button>
                      </div>

                      {showCardSelector && (
                        <div className={`absolute z-30 left-0 right-0 mt-1 max-h-40 overflow-y-auto rounded-xl border shadow-xl divide-y ${
                          isDayMode ? 'bg-white border-slate-200 divide-slate-100' : 'bg-slate-900 border-slate-700 divide-slate-800'
                        }`}>
                          {storeData.cardMembers
                            .filter((m) => {
                              if (!cardSearchQuery.trim()) return true;
                              const q = cardSearchQuery.toLowerCase();
                              return (
                                m.cardNo.toLowerCase().includes(q) ||
                                m.memberName.toLowerCase().includes(q) ||
                                m.phone.includes(q)
                              );
                            })
                            .slice(0, 10)
                            .map((m) => (
                              <div
                                key={m.id}
                                onClick={() => handleSelectCardMember(m)}
                                className={`p-2 text-xs cursor-pointer flex justify-between items-center ${
                                  isDayMode ? 'hover:bg-amber-50' : 'hover:bg-slate-800'
                                }`}
                              >
                                <div>
                                  <div className="font-bold text-slate-900 dark:text-white">
                                    <span className="font-mono text-amber-500 mr-1.5">{m.cardNo}</span>
                                    {m.memberName}
                                  </div>
                                  <div className="text-[10px] text-slate-400">
                                    {m.village || 'Wardha'} • {m.phone}
                                  </div>
                                </div>
                                <span className="text-[10px] font-bold text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded">
                                  {m.totalPaidMonths}/30
                                </span>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Items in Cart with Editable Serial Number & Model */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-800 dark:text-white">
                    Cart Items ({cart.length})
                  </span>
                  {cart.length > 0 && (
                    <button
                      onClick={() => setCart([])}
                      className="text-[10px] text-rose-500 hover:underline cursor-pointer"
                    >
                      Empty Cart
                    </button>
                  )}
                </div>

                {cart.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl">
                    Cart is empty. Click 'Add to Bill' from product catalog.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {cart.map((item, index) => (
                      <div
                        key={item.stockId}
                        className={`rounded-2xl p-2.5 text-xs space-y-1.5 border ${
                          isDayMode
                            ? 'bg-slate-50 border-slate-200'
                            : 'bg-slate-800/70 border-slate-700/60'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{item.name}</p>
                            <p className="text-[10px] text-slate-400">
                              {item.brand} • Rate: ₹{item.rate.toLocaleString('en-IN')}
                            </p>
                          </div>
                          <button
                            onClick={() => removeFromCart(index)}
                            className="text-slate-400 hover:text-rose-500 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Model & Serial Columns in Cart */}
                        <div className="grid grid-cols-2 gap-1.5 pt-1">
                          <div className="flex items-center gap-1">
                            <Tag className="w-3 h-3 text-emerald-500 shrink-0" />
                            <input
                              type="text"
                              placeholder="Model No..."
                              value={item.model || ''}
                              onChange={(e) => updateCartModel(index, e.target.value)}
                              className={`w-full rounded-lg px-2 py-0.5 text-[11px] border focus:outline-none focus:border-teal-500 ${
                                isDayMode
                                  ? 'bg-white border-slate-200 text-slate-900'
                                  : 'bg-slate-900 border-slate-700 text-white'
                              }`}
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <Barcode className="w-3 h-3 text-blue-500 shrink-0" />
                            <input
                              type="text"
                              placeholder="Serial No / IMEI..."
                              value={item.serialNo || ''}
                              onChange={(e) => updateCartSerial(index, e.target.value)}
                              className={`w-full rounded-lg px-2 py-0.5 text-[11px] font-mono border focus:outline-none focus:border-teal-500 ${
                                isDayMode
                                  ? 'bg-white border-slate-200 text-slate-900'
                                  : 'bg-slate-900 border-slate-700 text-amber-300'
                              }`}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-700/50">
                          {/* Qty Counter */}
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-400">Qty:</span>
                            <input
                              type="number"
                              min="1"
                              value={item.qty}
                              onChange={(e) => updateCartQty(index, parseInt(e.target.value) || 1)}
                              className={`w-12 rounded px-1.5 py-0.5 text-center text-xs border ${
                                isDayMode
                                  ? 'bg-white border-slate-200 text-slate-900'
                                  : 'bg-slate-900 border-slate-700 text-white'
                              }`}
                            />
                          </div>

                          {/* Discount % */}
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-400">Disc%:</span>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={item.discountPct}
                              onChange={(e) =>
                                updateCartDiscount(index, parseFloat(e.target.value) || 0)
                              }
                              className={`w-12 rounded px-1.5 py-0.5 text-center text-xs border ${
                                isDayMode
                                  ? 'bg-white border-slate-200 text-slate-900'
                                  : 'bg-slate-900 border-slate-700 text-white'
                              }`}
                            />
                          </div>

                          {/* Total */}
                          <div className="font-bold text-teal-600 dark:text-teal-400">
                            ₹{item.total.toLocaleString('en-IN')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Calculations & Checkout */}
            <div className="border-t border-slate-200 dark:border-slate-800 pt-3 space-y-2.5">
              <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Subtotal:</span>
                  <span>₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                {discountTotal > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span>Discount:</span>
                    <span>-₹{discountTotal.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between font-extrabold text-sm text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-800">
                  <span>Grand Total:</span>
                  <span className="text-teal-600 dark:text-teal-400">₹{grandTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Payment Mode & Split */}
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-1">
                      Payment Mode
                    </label>
                    <select
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value as any)}
                      className={`w-full rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-teal-500 border ${
                        isDayMode
                          ? 'bg-slate-50 border-slate-200 text-slate-800'
                          : 'bg-slate-800 border-slate-700 text-white'
                      }`}
                    >
                      <option value="Cash">Cash (Counter)</option>
                      <option value="UPI">UPI / PhonePe / GPay</option>
                      <option value="Card">Card / POS</option>
                      <option value="Bajaj Finance">Bajaj Finance / EMI</option>
                      <option value="Cheque">Bank Cheque</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-1">
                      Paid Now (₹)
                    </label>
                    <input
                      type="number"
                      placeholder={`Full: ${grandTotal}`}
                      value={paidAmountInput}
                      onChange={(e) =>
                        setPaidAmountInput(e.target.value === '' ? '' : parseFloat(e.target.value))
                      }
                      className={`w-full rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-teal-500 border ${
                        isDayMode
                          ? 'bg-slate-50 border-slate-200 text-slate-800'
                          : 'bg-slate-800 border-slate-700 text-white'
                      }`}
                    />
                  </div>
                </div>

                {balanceDue > 0 && (
                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-300 flex justify-between">
                    <span>Outstanding Due (उधारी):</span>
                    <span className="font-bold">₹{balanceDue.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <button
                  id="btn-pos-generate-invoice"
                  onClick={handleGenerateInvoice}
                  disabled={cart.length === 0}
                  className={`w-full py-2.5 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                    cart.length === 0
                      ? 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed'
                      : 'bg-teal-600 hover:bg-teal-500 text-white shadow-teal-600/20'
                  }`}
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Save & Generate Invoice (₹{grandTotal.toLocaleString('en-IN')})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Invoice History View */
        <div className={`p-5 rounded-3xl border space-y-4 shadow-sm ${
          isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex justify-between items-center">
            <h3 className={`text-sm font-bold uppercase tracking-wider ${
              isDayMode ? 'text-slate-900' : 'text-white'
            }`}>
              All Invoices & Sales Records ({storeData.transactions.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className={`text-[10px] uppercase tracking-wider border-b ${
                isDayMode
                  ? 'bg-slate-50 text-slate-500 border-slate-200'
                  : 'bg-slate-800/80 text-slate-400 border-slate-800'
              }`}>
                <tr>
                  <th className="py-2.5 px-3">Invoice No</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Items & Serial Summary</th>
                  <th className="py-2.5 px-3">Total (₹)</th>
                  <th className="py-2.5 px-3">Paid / Mode</th>
                  <th className="py-2.5 px-3">Balance</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDayMode ? 'divide-slate-100 text-slate-700' : 'divide-slate-800 text-slate-300'}`}>
                {storeData.transactions.map((tx) => (
                  <tr key={tx.id} className={`transition ${isDayMode ? 'hover:bg-slate-50' : 'hover:bg-slate-800/40'}`}>
                    <td className={`py-3 px-3 font-semibold ${isDayMode ? 'text-slate-900' : 'text-white'}`}>
                      {tx.invoiceNo}
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {new Date(tx.date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-3">
                      <p className={`font-semibold ${isDayMode ? 'text-slate-900' : 'text-slate-200'}`}>{tx.customerName}</p>
                      <p className="text-[10px] text-slate-400">{tx.customerPhone}</p>
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-[11px] space-y-0.5">
                        {tx.items.map((i, idx) => (
                          <div key={idx} className="flex items-center gap-1">
                            <span>{i.name} (x{i.qty})</span>
                            {i.serialNo && (
                              <span className="text-[9px] bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1 rounded font-mono">
                                SN: {i.serialNo}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className={`py-3 px-3 font-bold ${isDayMode ? 'text-slate-900' : 'text-white'}`}>
                      ₹{tx.grandTotal.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                        ₹{tx.paidAmount.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-slate-400 block">{tx.paymentMode}</span>
                    </td>
                    <td className="py-3 px-3">
                      {tx.balanceDue > 0 ? (
                        <span className="text-amber-600 dark:text-amber-400 font-bold">
                          ₹{tx.balanceDue.toLocaleString('en-IN')}
                        </span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold">Nil</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => onPrintInvoice(tx)}
                        className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center gap-1 ml-auto ${
                          isDayMode
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                            : 'bg-slate-800 hover:bg-slate-700 text-teal-300 border-slate-700'
                        }`}
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Bill</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
