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
  AlertCircle,
  Barcode,
  FileSpreadsheet,
  FileText,
  Users,
  MapPin,
  Tag,
  Plus,
  Trash2,
  Package,
  Layers,
  Calculator
} from 'lucide-react';
import { Customer, StockItem, TransactionEntry, BusinessSettings, CardSchemeId, SaleItemDetail } from '../types';
import { SCHEMES_CONFIG } from '../utils/storage';
import { getNextBillNumber } from '../utils/numbering';
import { CreditCard } from 'lucide-react';

export interface SaleFormProductRow {
  id: string;
  stockItemId?: string;
  productName: string;
  modelNumber: string;
  serialNumber: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface AddEntryViewProps {
  onSaveEntry: (entry: Omit<TransactionEntry, 'id' | 'createdAt'>) => void;
  onBackToDashboard: () => void;
  stockList: StockItem[];
  customersList: Customer[];
  settings: BusinessSettings;
  todaysTransactions: TransactionEntry[];
  allTransactions?: TransactionEntry[];
  onOpenInvoiceModal: (entry: TransactionEntry) => void;
}

export const AddEntryView: React.FC<AddEntryViewProps> = ({
  onSaveEntry,
  onBackToDashboard,
  stockList,
  customersList,
  settings,
  todaysTransactions,
  allTransactions = [],
  onOpenInvoiceModal,
}) => {
  // Form States - Multi-product rows state
  const [productRows, setProductRows] = useState<SaleFormProductRow[]>([
    {
      id: 'row-1',
      stockItemId: '',
      productName: '',
      modelNumber: '',
      serialNumber: '',
      quantity: 1,
      unitPrice: 0,
      total: 0,
    },
  ]);

  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerVillage, setCustomerVillage] = useState<string>('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);

  const [docType, setDocType] = useState<'invoice' | 'quotation'>('invoice');
  const [modelNumber, setModelNumber] = useState<string>('');
  const [serialNumber, setSerialNumber] = useState<string>('');
  const [totalAmount, setTotalAmount] = useState<string>('');
  const [payingNow, setPayingNow] = useState<string>('');
  const [itemDetails, setItemDetails] = useState<string>('');
  const [billSeries, setBillSeries] = useState<'regular' | 'bajaj'>('regular');
  const [invoiceNo, setInvoiceNo] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'Online'>('Cash');
  const [selectedSchemeId, setSelectedSchemeId] = useState<CardSchemeId | ''>('');
  const [selectedCardNumber, setSelectedCardNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [selectedAgent, setSelectedAgent] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [savedEntry, setSavedEntry] = useState<TransactionEntry | null>(null);

  const txPool = allTransactions && allTransactions.length > 0 ? allTransactions : todaysTransactions;

  // Auto-generate invoice number based on series and docType:
  // Regular bill: 3848 -> 3849...
  // Bajaj Finserv bill: B-200 -> B-201...
  // Quotation: Q-3849...
  useEffect(() => {
    const nextBill = getNextBillNumber(txPool, billSeries);
    if (docType === 'quotation') {
      setInvoiceNo(`Q-${nextBill}`);
    } else {
      setInvoiceNo(nextBill);
    }
  }, [billSeries, txPool.length, docType]);

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
  const handleAddProductRow = () => {
    setProductRows((prev) => [
      ...prev,
      {
        id: `row-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        stockItemId: '',
        productName: '',
        modelNumber: '',
        serialNumber: '',
        quantity: 1,
        unitPrice: 0,
        total: 0,
      },
    ]);
  };

  const handleRemoveProductRow = (id: string) => {
    if (productRows.length <= 1) {
      setProductRows([
        {
          id: `row-${Date.now()}`,
          stockItemId: '',
          productName: '',
          modelNumber: '',
          serialNumber: '',
          quantity: 1,
          unitPrice: 0,
          total: 0,
        },
      ]);
      return;
    }
    setProductRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleUpdateProductRow = (
    id: string,
    field: keyof SaleFormProductRow,
    value: any
  ) => {
    setProductRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        const updated = { ...row, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          const q = field === 'quantity' ? Math.max(1, Number(value) || 1) : updated.quantity;
          const p = field === 'unitPrice' ? Math.max(0, Number(value) || 0) : updated.unitPrice;
          updated.quantity = q;
          updated.unitPrice = p;
          updated.total = q * p;
        }
        return updated;
      })
    );
  };

  const handleSelectStockForRow = (rowId: string, item: StockItem) => {
    setProductRows((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;
        const q = row.quantity || 1;
        const p = item.sellingPrice || 0;
        return {
          ...row,
          stockItemId: item.id,
          productName: item.name,
          modelNumber: row.modelNumber || item.code || '',
          unitPrice: p,
          total: q * p,
        };
      })
    );
  };

  // Products total sum
  const productsTotalSum = useMemo(() => {
    return productRows.reduce((acc, r) => acc + (Number(r.total) || 0), 0);
  }, [productRows]);

  const handleApplyProductsSumToBill = () => {
    if (productsTotalSum > 0) {
      setTotalAmount(productsTotalSum.toString());
      if (!payingNow || Number(payingNow) === Number(totalAmount)) {
        setPayingNow(productsTotalSum.toString());
      }
    }
  };

  const handleSelectCustomer = (cust: Customer) => {
    setCustomerName(cust.name);
    setCustomerPhone(cust.phone || '');
    if (cust.village) {
      setCustomerVillage(cust.village);
    }
    setIsCustomerDropdownOpen(false);
  };

  // Extract unique village suggestions from customers and transactions
  const villageList = useMemo(() => {
    const set = new Set<string>();
    customersList.forEach((c) => {
      if (c.village && c.village.trim()) set.add(c.village.trim());
    });
    (allTransactions || []).forEach((t) => {
      if (t.village && t.village.trim()) set.add(t.village.trim());
    });
    return Array.from(set).sort();
  }, [customersList, allTransactions]);

  const numTotal = parseFloat(totalAmount) || 0;
  const numPaid = parseFloat(payingNow) || 0;
  const dueAmount = Math.max(0, numTotal - numPaid);

  const resetForm = () => {
    setProductRows([
      {
        id: `row-${Date.now()}`,
        stockItemId: '',
        productName: '',
        modelNumber: '',
        serialNumber: '',
        quantity: 1,
        unitPrice: 0,
        total: 0,
      },
    ]);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerVillage('');
    setDocType('invoice');
    setModelNumber('');
    setSerialNumber('');
    setTotalAmount('');
    setPayingNow('');
    setItemDetails('');
    setPaymentMode('Cash');
    setSelectedSchemeId('');
    setSelectedCardNumber('');
    setNotes('');
    setErrorMsg('');
    setSavedEntry(null);
    const nextBill = getNextBillNumber(txPool, billSeries);
    setInvoiceNo(nextBill);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!customerName.trim()) {
      setErrorMsg('Customer Name is required / ग्राहकाचे नाव आवश्यक आहे');
      return;
    }

    if (!totalAmount || numTotal <= 0) {
      setErrorMsg('Please enter a valid Total Amount greater than 0 / वैध बिल रक्कम टाका');
      return;
    }

    if (numPaid < 0) {
      setErrorMsg('Paying Now cannot be negative / भरलेली रक्कम ऋण असू शकत नाही');
      return;
    }

    if (numPaid > numTotal) {
      setErrorMsg('Paying Now cannot exceed the Total Amount / भरलेली रक्कम बिलापेक्षा जास्त असू शकत नाही');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const existingCustomer = customersList.find(
        (c) => c.name.toLowerCase() === customerName.toLowerCase()
      );

      // Process productRows into itemsDetail
      const validProductRows = productRows.filter(
        (r) => r.productName.trim() || r.modelNumber.trim() || r.serialNumber.trim() || r.total > 0
      );

      const itemsDetail: SaleItemDetail[] = (validProductRows.length > 0 ? validProductRows : productRows).map((r, idx) => {
        const serials = r.serialNumber
          ? r.serialNumber.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean)
          : [];
        return {
          id: `item-${idx + 1}-${Date.now()}`,
          stockItemId: r.stockItemId || undefined,
          productName: r.productName.trim() || `प्रॉडक्ट #${idx + 1}`,
          modelNumber: r.modelNumber.trim() || undefined,
          serialNumber: r.serialNumber.trim() || undefined,
          serialNumbers: serials.length > 0 ? serials : undefined,
          quantity: Math.max(1, Number(r.quantity) || 1),
          unitPrice: Number(r.unitPrice) || 0,
          total: Number(r.total) || ((Number(r.quantity) || 1) * (Number(r.unitPrice) || 0)),
        };
      });

      const summaryItemDetails = itemsDetail.length > 0
        ? itemsDetail.map((i) => `${i.productName}${i.modelNumber ? ` (${i.modelNumber})` : ''} - ${i.quantity} नग`).join(' + ')
        : (itemDetails.trim() || 'General Goods / Services');

      const allModels = itemsDetail.map((i) => i.modelNumber).filter(Boolean).join(', ');
      const allSerials = itemsDetail.map((i) => i.serialNumber).filter(Boolean).join(', ');

      const newEntry: Omit<TransactionEntry, 'id' | 'createdAt'> = {
        invoiceNo: invoiceNo.trim() || `INV-${Date.now().toString().slice(-6)}`,
        date,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || existingCustomer?.phone || '',
        customerId: existingCustomer?.id,
        village: customerVillage.trim() || existingCustomer?.village || undefined,
        cardNumber: selectedCardNumber ? parseInt(selectedCardNumber) : undefined,
        schemeId: selectedSchemeId ? (selectedSchemeId as CardSchemeId) : undefined,
        stockItemId: itemsDetail[0]?.stockItemId,
        stockItemName: itemsDetail[0]?.productName,
        quantity: itemsDetail.reduce((acc, i) => acc + i.quantity, 0),
        itemDetails: summaryItemDetails || itemDetails.trim() || 'General Goods / Services',
        itemsDetail: itemsDetail.length > 0 ? itemsDetail : undefined,
        totalAmount: numTotal,
        payingNow: numPaid,
        dueAmount,
        paymentMode,
        notes: notes.trim(),
        docType,
        modelNumber: allModels || modelNumber.trim() || undefined,
        model: allModels || modelNumber.trim() || undefined,
        serialNumber: allSerials || serialNumber.trim() || undefined,
        agentName: selectedAgent.trim() || undefined,
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
    let itemsSummary = `Item: ${entry.itemDetails}\n`;
    if (entry.itemsDetail && entry.itemsDetail.length > 0) {
      itemsSummary = `*खरेदी केलेल्या वस्तू (Items):*\n` + entry.itemsDetail.map((it, idx) => {
        let line = `${idx + 1}. *${it.productName}* (${it.quantity} नग x ₹${it.unitPrice.toLocaleString()}) = ₹${it.total.toLocaleString()}`;
        if (it.modelNumber) line += `\n   ↳ Model: ${it.modelNumber}`;
        if (it.serialNumber) line += `\n   ↳ Serial/IMEI: ${it.serialNumber}`;
        return line;
      }).join('\n') + `\n`;
    }

    const text = encodeURIComponent(
      `*${settings.businessName || 'Shri Sai Enterprises'}*\n` +
      `*${entry.docType === 'quotation' ? 'दरपत्रक (QUOTATION)' : 'पक्के विक्री बिल (TAX INVOICE)'}*: #${entry.invoiceNo}\n` +
      `तारीख: ${entry.date}\n` +
      `ग्राहक: *${entry.customerName}*${entry.village ? ` (${entry.village})` : ''}\n` +
      `--------------------------------\n` +
      itemsSummary +
      `--------------------------------\n` +
      `एकूण बिल (Total): ₹${entry.totalAmount.toLocaleString()}\n` +
      (entry.docType !== 'quotation' ? `आज जमा (Paid): ₹${entry.payingNow.toLocaleString()} (${entry.paymentMode})\n` : '') +
      (entry.docType !== 'quotation' && entry.dueAmount > 0 ? `*उर्वरित बाकी (Due): ₹${entry.dueAmount.toLocaleString()}*\n` : (entry.docType !== 'quotation' ? `*स्थिती: पूर्ण जमा (FULL PAID)*\n` : '')) +
      `\nश्री साई एंटरप्रायझेस, वर्धा धन्यवाद!`
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

      {/* Success banner after saving with crystal-clear Bill / Quotation Print actions */}
      {savedEntry && (
        <div className="bg-emerald-50/95 dark:bg-emerald-950/50 border-2 border-emerald-500/80 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-emerald-900/10 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-md">
              <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-700 text-white font-black text-xs uppercase">
                  {savedEntry.docType === 'quotation' ? 'दरपत्रक / कोटेशन जतन' : 'विक्री बिल जतन'}
                </span>
                <span className="font-mono font-black text-emerald-900 dark:text-emerald-100 text-sm">
                  #{savedEntry.invoiceNo}
                </span>
              </div>
              <p className="text-xs font-bold text-emerald-950 dark:text-emerald-200 mt-1">
                {savedEntry.customerName} • एकूण रक्कम: ₹{savedEntry.totalAmount.toLocaleString()}
                {savedEntry.docType !== 'quotation' && (
                  <>
                    {' '}• जमा: ₹{savedEntry.payingNow.toLocaleString()} ({savedEntry.paymentMode})
                    {savedEntry.dueAmount > 0 && (
                      <span className="text-amber-800 dark:text-amber-300 font-extrabold ml-1">
                        • उधारी बाकी: ₹{savedEntry.dueAmount.toLocaleString()}
                      </span>
                    )}
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <button
              id="btn-print-saved-bill"
              type="button"
              onClick={() => onOpenInvoiceModal(savedEntry)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#00523f] hover:bg-[#004232] text-white text-xs font-black shadow-md shadow-[#00523f]/25 transition cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>
                {savedEntry.docType === 'quotation' ? 'कोटेशन प्रिंट करा (Print Quotation)' : 'बिल प्रिंट करा (Print Tax Invoice)'}
              </span>
            </button>

            <button
              id="btn-whatsapp-saved-bill"
              type="button"
              onClick={() => handleShareWhatsApp(savedEntry)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
            >
              <Share2 className="w-4 h-4" />
              <span>WhatsApp पाठवा</span>
            </button>

            <button
              id="btn-new-entry-another"
              type="button"
              onClick={resetForm}
              className="px-3.5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 text-xs font-bold transition cursor-pointer active:scale-95"
            >
              + पुढील नोंद
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

          {/* Document Type Selector: विक्री बिल (Tax Invoice) vs कोटेशन (Quotation / Estimate) */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <span>दस्तऐवज प्रकार (Document Type):</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  docType === 'invoice' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                }`}>
                  {docType === 'invoice' ? 'पक्के विक्री बिल (TAX INVOICE)' : 'दरपत्रक / अंदाजपत्रक (QUOTATION)'}
                </span>
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {docType === 'invoice'
                  ? 'ग्राहकाला दिलेले पक्के विक्री बिल — अंतिम हिशोब व उधारी खात्यात जमा होते.'
                  : 'ग्राहकाला दिलेले दरपत्रक / अंदाजपत्रक — केवळ माहितीसाठी, उधारी खात्यावर परिणाम होत नाही.'}
              </p>
            </div>
            <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  setDocType('invoice');
                  setInvoiceNo((prev) => prev.replace(/^Q-/, ''));
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  docType === 'invoice'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>विक्री बिल (Sale Invoice)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setDocType('quotation');
                  setInvoiceNo((prev) => (prev.startsWith('Q-') ? prev : `Q-${prev}`));
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  docType === 'quotation'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>कोटेशन (Quotation)</span>
              </button>
            </div>
          </div>

          {/* Customer & Invoice Details */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 sm:p-5 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/80 pb-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-[#00523f] dark:text-emerald-400" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  ग्राहक व बिल तपशील (Customer & Bill Info)
                </span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                तारीख: {date}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Bill Series & Number */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    बिल नंबर (Bill / Invoice No.)
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setBillSeries('regular')}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition cursor-pointer ${
                        billSeries === 'regular'
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-slate-200 dark:bg-slate-750 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      नियमित (3849+)
                    </button>
                    <button
                      type="button"
                      onClick={() => setBillSeries('bajaj')}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition cursor-pointer ${
                        billSeries === 'bajaj'
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'bg-slate-200 dark:bg-slate-750 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      बजाज (B-201+)
                    </button>
                  </div>
                </div>
                <input
                  id="input-invoice-no"
                  type="text"
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  placeholder={billSeries === 'bajaj' ? 'B-201' : '3849'}
                  className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00523f]/20 focus:border-[#00523f] text-slate-900 dark:text-white font-mono font-bold"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  Date (तारीख) <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                  <input
                    id="input-entry-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00523f]/20 focus:border-[#00523f] text-slate-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              {/* Customer Name */}
              <div className="relative">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  Customer Name (ग्राहकाचे नाव) <span className="text-rose-500">*</span>
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
                    placeholder="Search or enter customer name..."
                    className="w-full pl-10 pr-8 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00523f]/20 focus:border-[#00523f] text-slate-900 dark:text-white placeholder-slate-400"
                    required
                  />
                  {customerName && (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomerName('');
                        setIsCustomerDropdownOpen(false);
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center text-xs font-bold cursor-pointer"
                    >
                      ×
                    </button>
                  )}
                </div>

                {isCustomerDropdownOpen && customerName.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-30 max-h-52 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredCustomers.length > 0 && (
                      <div className="px-3 py-1 bg-slate-50 dark:bg-slate-800 text-[10px] font-bold text-slate-400 uppercase">
                        मागील ग्राहक ({filteredCustomers.length})
                      </div>
                    )}
                    {filteredCustomers.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => handleSelectCustomer(c)}
                        className="p-2.5 hover:bg-emerald-50/60 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{c.name}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {c.phone ? `Phone: ${c.phone}` : ''}{c.village ? ` | गाव: ${c.village}` : ''}
                          </p>
                        </div>
                        {c.balanceDue > 0 && (
                          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 px-2 py-0.5 rounded-full">
                            Due: ₹{c.balanceDue.toLocaleString()}
                          </span>
                        )}
                      </div>
                    ))}
                    <div
                      onClick={() => setIsCustomerDropdownOpen(false)}
                      className="p-2 text-center text-xs text-[#00523f] dark:text-emerald-400 font-bold bg-slate-50 dark:bg-slate-800 cursor-pointer"
                    >
                      + Add as new customer "{customerName}"
                    </div>
                  </div>
                )}
              </div>

              {/* Customer Village (गाव / परिसर) */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>गाव / परिसर (Village / Location)</span>
                </label>
                <input
                  id="input-customer-village"
                  type="text"
                  list="village-suggestions"
                  value={customerVillage}
                  onChange={(e) => setCustomerVillage(e.target.value)}
                  placeholder="उदा. Satoda, Wardha, Hinganghat"
                  className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00523f]/20 focus:border-[#00523f] text-slate-900 dark:text-white placeholder-slate-400"
                />
                <datalist id="village-suggestions">
                  {villageList.map((v) => (
                    <option key={v} value={v} />
                  ))}
                </datalist>
              </div>

              {/* Customer Phone */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5 text-slate-500" />
                  <span>Phone / WhatsApp (बिल पाठवण्यासाठी)</span>
                </label>
                <input
                  id="input-customer-phone"
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="उदा. 9876543210"
                  className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00523f]/20 focus:border-[#00523f] text-slate-900 dark:text-white placeholder-slate-400"
                />
              </div>

              {/* Staff / Sales Agent */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-[#00523f]" />
                  <span>विक्रेता / प्रतिनिधी (Sales Agent)</span>
                </label>
                <select
                  value={selectedAgent}
                  onChange={(e) => setSelectedAgent(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  <option value="">दुकान काउंटर (Shop Counter)</option>
                  <option value="Shubham Shende">शुभम शेंडे (Shubham Shende)</option>
                  <option value="Bhushan Lidbe">भूषण लिडबे (Bhushan Lidbe)</option>
                  <option value="Suraj Pendam">सुरज पेंदाम (Suraj Pendam)</option>
                  <option value="Ninad Hole">निनाद होले (Ninad Hole)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Multiple Products Section (अनेक वस्तू, स्वतंत्र मॉडेल व सिरीयल नंबर) */}
          <div className="bg-[#fbfcff] dark:bg-slate-850/60 rounded-2xl border-2 border-emerald-500/20 dark:border-emerald-500/30 p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-[#00523f] dark:text-emerald-400" />
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                    वस्तू / प्रॉडक्ट्स तपशील (Products, Models & Serial Numbers)
                  </h3>
                  <span className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full text-xs font-mono">
                    {productRows.length} {productRows.length === 1 ? 'Product' : 'Products'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  एका बिलात १ किंवा अनेक वस्तू जोडा — प्रत्येक वस्तूचा स्वतंत्र मॉडेल नंबर व सिरीयल/IMEI नंबर नोंदवा.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddProductRow}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer self-start sm:self-auto active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>+ आणखी वस्तू / प्रॉडक्ट जोडा (+ Add Product)</span>
              </button>
            </div>

            {/* List of Product Rows */}
            <div className="space-y-4">
              {productRows.map((row, index) => {
                const stockItem = stockList.find((s) => s.id === row.stockItemId);
                return (
                  <div
                    key={row.id}
                    className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/80 p-3.5 sm:p-4 space-y-3 shadow-xs hover:border-emerald-400/60 dark:hover:border-emerald-500/50 transition"
                  >
                    {/* Row Header */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-[#00523f] text-white font-bold flex items-center justify-center text-[11px]">
                          {index + 1}
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          वस्तू #{index + 1} {row.productName ? `• ${row.productName}` : ''}
                        </span>
                        {stockItem && (
                          <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                            स्टॉक शिल्लक: {stockItem.quantity} {stockItem.unit} • दर: ₹{stockItem.sellingPrice.toLocaleString()}
                          </span>
                        )}
                      </div>

                      {productRows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveProductRow(row.id)}
                          className="text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 text-xs font-semibold flex items-center gap-1 cursor-pointer p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          title="ही वस्तू बिलातून काढा"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">काढा (Remove)</span>
                        </button>
                      )}
                    </div>

                    {/* Inputs Grid for this product */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
                      {/* Product Name with Stock Suggestions */}
                      <div className="lg:col-span-4">
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          वस्तू / प्रॉडक्टचे नाव (Product Name) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          list={`stock-list-${row.id}`}
                          value={row.productName}
                          onChange={(e) => {
                            const val = e.target.value;
                            handleUpdateProductRow(row.id, 'productName', val);
                            const matched = stockList.find(
                              (s) => s.name.toLowerCase() === val.toLowerCase() || s.code.toLowerCase() === val.toLowerCase()
                            );
                            if (matched) {
                              handleSelectStockForRow(row.id, matched);
                            }
                          }}
                          placeholder="उदा. LG Single Door Fridge, LED TV, Fan"
                          className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-900 dark:text-white"
                          required
                        />
                        <datalist id={`stock-list-${row.id}`}>
                          {stockList.map((item) => (
                            <option key={item.id} value={item.name}>
                              {item.code ? `Code: ${item.code} | ` : ''}स्टॉक: {item.quantity} | ₹{item.sellingPrice}
                            </option>
                          ))}
                        </datalist>
                      </div>

                      {/* Model Number */}
                      <div className="lg:col-span-3">
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                          <Tag className="w-3 h-3 text-blue-600" />
                          <span>मॉडेल नंबर (Model No.)</span>
                        </label>
                        <input
                          type="text"
                          value={row.modelNumber}
                          onChange={(e) => handleUpdateProductRow(row.id, 'modelNumber', e.target.value)}
                          placeholder="उदा. GL-B191KOWX"
                          className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-900 dark:text-white font-mono"
                        />
                      </div>

                      {/* Serial Number / IMEI */}
                      <div className="lg:col-span-3">
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                          <Barcode className="w-3 h-3 text-emerald-600" />
                          <span>सिरीयल / IMEI नंबर (Serial No.)</span>
                        </label>
                        <input
                          type="text"
                          value={row.serialNumber}
                          onChange={(e) => handleUpdateProductRow(row.id, 'serialNumber', e.target.value)}
                          placeholder="उदा. 602NRZX294301 / IMEI"
                          className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-900 dark:text-white font-mono"
                        />
                      </div>

                      {/* Quantity */}
                      <div className="lg:col-span-1">
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          नग (Qty)
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={row.quantity}
                          onChange={(e) => handleUpdateProductRow(row.id, 'quantity', parseInt(e.target.value) || 1)}
                          className="w-full px-2 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-center font-bold text-slate-900 dark:text-white focus:outline-none"
                        />
                      </div>

                      {/* Unit Price */}
                      <div className="lg:col-span-1">
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          दर ₹ (Rate)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={row.unitPrice || ''}
                          onChange={(e) => handleUpdateProductRow(row.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className="w-full px-2 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-right font-bold text-slate-900 dark:text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Row Subtotal info */}
                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400">
                        {row.quantity} नग × ₹{(row.unitPrice || 0).toLocaleString()}
                      </span>
                      <span className="font-extrabold text-[#00523f] dark:text-emerald-400">
                        रक्कम: ₹{(row.quantity * (row.unitPrice || 0)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom of Products: Add button and total summary */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleAddProductRow}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 border-2 border-dashed border-emerald-500/50 hover:border-emerald-600 text-[#00523f] dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ आणखी एक प्रॉडक्ट जोडा (+ Add Another Product)</span>
              </button>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <div className="bg-white dark:bg-slate-900 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                  <span className="text-slate-500 dark:text-slate-400">एकूण प्रॉडक्ट्स बेरीज: </span>
                  <span className="font-black text-slate-900 dark:text-white text-sm">
                    ₹{productsTotalSum.toLocaleString()}
                  </span>
                </div>

                {productsTotalSum > 0 && (
                  <button
                    type="button"
                    onClick={handleApplyProductsSumToBill}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
                    title="ही बेरीज खालील एकूण बिलात भरा"
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    <span>एकूण बिलात भरा</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Payment & Financial Details */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 sm:p-5 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/80 pb-3">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <IndianRupee className="w-4 h-4 text-[#00523f] dark:text-emerald-400" />
                <span>पेमेंट व बिल हिशोब (Financial & Payment Details)</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Total Amount */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    Total Amount (एकूण बिल ₹) <span className="text-rose-500">*</span>
                  </label>
                  {productsTotalSum > 0 && Number(totalAmount) !== productsTotalSum && (
                    <button
                      type="button"
                      onClick={handleApplyProductsSumToBill}
                      className="text-[10px] text-emerald-600 font-bold hover:underline cursor-pointer"
                    >
                      Use Products Sum: ₹{productsTotalSum.toLocaleString()}
                    </button>
                  )}
                </div>
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
                    className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00523f]/20 focus:border-[#00523f] text-slate-900 dark:text-white font-extrabold placeholder-slate-400 transition"
                    required
                  />
                </div>
              </div>

              {/* Paying Now */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Paying Now (आता जमा ₹) <span className="text-rose-500">*</span>
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
                    className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00523f]/20 focus:border-[#00523f] text-slate-900 dark:text-white font-extrabold placeholder-slate-400 transition"
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

          {/* Sales / Collection Agent Selection */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#00523f] dark:text-emerald-400" />
                <span>विक्री / वसुली प्रतिनिधी (Agent / Staff)</span>
              </label>
              <span className="text-[10px] text-slate-400">
                (डॅशबोर्डवर एजंट वसुली हिशोबासाठी)
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { name: '', label: 'दुकान काउंटर' },
                { name: 'Shubham Shende', label: 'शुभम शेंडे' },
                { name: 'Bhushan Lidbe', label: 'भूषण लिडबे' },
                { name: 'Suraj Pendam', label: 'सुरज पेंदाम' },
                { name: 'Ninad Hole', label: 'निनाद होले' },
              ].map((ag) => (
                <button
                  key={ag.name}
                  type="button"
                  onClick={() => setSelectedAgent(ag.name)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    selectedAgent === ag.name
                      ? 'bg-[#00523f] text-white shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {ag.label}
                </button>
              ))}
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
