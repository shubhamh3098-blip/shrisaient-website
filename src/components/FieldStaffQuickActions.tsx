import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  PlusCircle,
  Receipt,
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  Phone,
  Banknote,
  Smartphone,
  X,
  Sparkles,
  ArrowRight,
  Printer,
  Share2,
  Calendar,
  Building2,
  BookOpen
} from 'lucide-react';
import {
  Customer,
  CardMember,
  CardTransaction,
  StockItem,
  TransactionEntry,
  BusinessSettings,
  CardSchemeId
} from '../types';
import { SCHEMES_CONFIG } from '../utils/storage';

export type FieldActionTab = 'card-collection' | 'sales' | 'receipt' | 'ledger';

interface FieldStaffQuickActionsProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: FieldActionTab;
  cardMembers: CardMember[];
  cardTransactions: CardTransaction[];
  customers: Customer[];
  stock: StockItem[];
  settings: BusinessSettings;
  currentAgentName?: string;
  onRecordCardPayment: (tx: Omit<CardTransaction, 'id' | 'createdAt'>) => void;
  onSaveSalesEntry: (entry: Omit<TransactionEntry, 'id' | 'createdAt'>) => void;
  onSettleCustomerPayment: (
    customerId: string,
    amount: number,
    mode: 'Cash' | 'Online',
    notes: string
  ) => void;
  onNavigateTab?: (tabName: any) => void;
}

export const FieldStaffQuickActions: React.FC<FieldStaffQuickActionsProps> = ({
  isOpen,
  onClose,
  initialTab = 'card-collection',
  cardMembers,
  customers,
  stock,
  settings,
  currentAgentName = 'Staff Agent',
  onRecordCardPayment,
  onSaveSalesEntry,
  onSettleCustomerPayment,
  onNavigateTab
}) => {
  const [activeTab, setActiveTab] = useState<FieldActionTab>(initialTab);

  // Status message
  const [successNotice, setSuccessNotice] = useState<string>('');
  const [errorNotice, setErrorNotice] = useState<string>('');

  // -------------------------------------------------------------
  // 1. CARD COLLECTION STATE (Weekly Installment / साप्ताहिक हफ्ता)
  // -------------------------------------------------------------
  const [cardSearch, setCardSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState<CardMember | null>(null);
  const [collectionAmount, setCollectionAmount] = useState<number>(500);
  const [collectionWeekNo, setCollectionWeekNo] = useState<number>(1);
  const [collectionMode, setCollectionMode] = useState<'Cash' | 'Online'>('Cash');
  const [agentNameInput, setAgentNameInput] = useState<string>(() => {
    return localStorage.getItem('active_card_agent') || currentAgentName || 'Staff Agent';
  });
  const [collectionRemarks, setCollectionRemarks] = useState('');

  // -------------------------------------------------------------
  // 2. QUICK SALES / BILL STATE (नया बिल / सेल)
  // -------------------------------------------------------------
  const [saleCustName, setSaleCustName] = useState('');
  const [saleCustPhone, setSaleCustPhone] = useState('');
  const [saleItemDetails, setSaleItemDetails] = useState('');
  const [saleTotalAmount, setSaleTotalAmount] = useState<string>('');
  const [salePayingNow, setSalePayingNow] = useState<string>('');
  const [salePaymentMode, setSalePaymentMode] = useState<'Cash' | 'Online'>('Cash');
  const [saleLinkedScheme, setSaleLinkedScheme] = useState<CardSchemeId | ''>('');
  const [saleLinkedCardNo, setSaleLinkedCardNo] = useState<string>('');
  const [selectedStockId, setSelectedStockId] = useState<string>('');
  const [stockSearch, setStockSearch] = useState<string>('');
  const [stockQty, setStockQty] = useState<number>(1);

  // -------------------------------------------------------------
  // 3. RECEIPT / PAYMENT IN (उधार वसूली पावती)
  // -------------------------------------------------------------
  const [receiptSearch, setReceiptSearch] = useState('');
  const [receiptCustomer, setReceiptCustomer] = useState<Customer | null>(null);
  const [receiptAmount, setReceiptAmount] = useState<string>('');
  const [receiptMode, setReceiptMode] = useState<'Cash' | 'Online'>('Cash');
  const [receiptNotes, setReceiptNotes] = useState('Weekly Field Payment / फिल्ड वसूली');

  // -------------------------------------------------------------
  // 4. QUICK LEDGER LOOKUP (खाता बही)
  // -------------------------------------------------------------
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [viewedCustomerLedger, setViewedCustomerLedger] = useState<Customer | null>(null);

  if (!isOpen) return null;

  // Filtered card members for collection
  const filteredCardMembers = useMemo(() => {
    const q = cardSearch.trim().toLowerCase();
    if (!q) return cardMembers.slice(0, 8);
    return cardMembers
      .filter((m) => {
        return (
          m.cardNumber.toString().includes(q) ||
          m.customerName.toLowerCase().includes(q) ||
          (m.phone && m.phone.includes(q)) ||
          (m.village && m.village.toLowerCase().includes(q)) ||
          (m.sheetNo && m.sheetNo.toLowerCase().includes(q))
        );
      })
      .slice(0, 15);
  }, [cardMembers, cardSearch]);

  // Filtered customers for receipt / ledger
  const filteredCustomers = useMemo(() => {
    const q = (activeTab === 'receipt' ? receiptSearch : ledgerSearch).trim().toLowerCase();
    if (!q) return customers.filter((c) => c.balanceDue > 0).slice(0, 8);
    return customers
      .filter((c) => {
        return (
          c.name.toLowerCase().includes(q) ||
          (c.phone && c.phone.includes(q)) ||
          (c.address && c.address.toLowerCase().includes(q))
        );
      })
      .slice(0, 15);
  }, [customers, receiptSearch, ledgerSearch, activeTab]);

  // Stock items list
  const filteredStock = useMemo(() => {
    const q = stockSearch.trim().toLowerCase();
    if (!q) return stock.slice(0, 6);
    return stock.filter((s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q));
  }, [stock, stockSearch]);

  // Handle Card Collection Submit
  const handleCollectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorNotice('');
    setSuccessNotice('');

    if (!selectedMember) {
      setErrorNotice('कृपया सदस्य कार्ड निवडा किंवा सर्च करा');
      return;
    }

    if (!collectionAmount || collectionAmount <= 0) {
      setErrorNotice('कृपया योग्य हफ्ता रक्कम टाका');
      return;
    }

    const receiptNo = `CS-${Date.now().toString().slice(-6)}`;
    const newBal = (selectedMember.netBalance || 0) + collectionAmount;

    onRecordCardPayment({
      cardId: selectedMember.id,
      cardNumber: selectedMember.cardNumber,
      schemeId: selectedMember.schemeId,
      customerName: selectedMember.customerName,
      customerPhone: selectedMember.phone,
      receiptNo,
      date: new Date().toISOString().split('T')[0],
      type: 'WeeklyPayment',
      weekNumber: collectionWeekNo,
      amount: collectionAmount,
      paymentMode: collectionMode,
      agentName: agentNameInput.trim() || currentAgentName,
      remarks: collectionRemarks.trim() || `Field collection by ${agentNameInput}`,
      balanceAfter: newBal
    });

    localStorage.setItem('active_card_agent', agentNameInput);

    setSuccessNotice(
      `पावती जतन झाली! कार्ड #${selectedMember.cardNumber} (${selectedMember.customerName}) साठी ₹${collectionAmount} जमा झाले.`
    );
    setSelectedMember(null);
    setCardSearch('');
    setCollectionRemarks('');
  };

  // Handle Quick Sales Submit
  const handleSalesSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorNotice('');
    setSuccessNotice('');

    if (!saleCustName.trim()) {
      setErrorNotice('कृपया ग्राहकाचे नाव टाका');
      return;
    }
    const tot = parseFloat(saleTotalAmount) || 0;
    const paid = parseFloat(salePayingNow) || 0;

    if (tot <= 0) {
      setErrorNotice('कृपया एकूण रक्कम टाका');
      return;
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const invNo = `${settings.invoicePrefix || 'INV-2026-'}${randomSuffix}`;

    const selectedStockItem = stock.find((s) => s.id === selectedStockId);

    onSaveSalesEntry({
      invoiceNo: invNo,
      date: new Date().toISOString().split('T')[0],
      customerName: saleCustName.trim(),
      customerPhone: saleCustPhone.trim(),
      itemDetails: saleItemDetails.trim() || (selectedStockItem ? `${selectedStockItem.name} x ${stockQty}` : 'इलेक्ट्रॉनिक्स विक्री'),
      totalAmount: tot,
      payingNow: paid,
      dueAmount: Math.max(0, tot - paid),
      paymentMode: salePaymentMode,
      stockItemId: selectedStockItem?.id,
      stockItemName: selectedStockItem?.name,
      quantity: selectedStockItem ? stockQty : undefined,
      schemeId: saleLinkedScheme ? saleLinkedScheme : undefined,
      cardNumber: saleLinkedCardNo ? parseInt(saleLinkedCardNo) : undefined,
      notes: `Field Staff Booking by ${agentNameInput}`
    });

    setSuccessNotice(`विक्री बिल #${invNo} यशस्वीपणे जतन झाले!`);
    setSaleCustName('');
    setSaleCustPhone('');
    setSaleItemDetails('');
    setSaleTotalAmount('');
    setSalePayingNow('');
    setSelectedStockId('');
    setStockSearch('');
    setSaleLinkedScheme('');
    setSaleLinkedCardNo('');
  };

  // Handle Receipt / Khata Settle
  const handleReceiptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorNotice('');
    setSuccessNotice('');

    if (!receiptCustomer) {
      setErrorNotice('कृपया ग्राहक निवडा');
      return;
    }

    const amt = parseFloat(receiptAmount) || 0;
    if (amt <= 0) {
      setErrorNotice('कृपया योग्य पावती रक्कम टाका');
      return;
    }

    onSettleCustomerPayment(
      receiptCustomer.id,
      amt,
      receiptMode,
      receiptNotes.trim() || `Field collection by ${agentNameInput}`
    );

    setSuccessNotice(`पावती जमा! ${receiptCustomer.name} यांच्या खात्यात ₹${amt} जमा झाले.`);
    setReceiptCustomer(null);
    setReceiptAmount('');
    setReceiptSearch('');
  };

  // WhatsApp Share Helper
  const handleShareWhatsAppReminder = (c: Customer) => {
    const text = encodeURIComponent(
      `नमस्ते ${c.name} जी,\n*${settings.businessName} (वर्धा)* कडून आपल्या खात्याची बाकी रक्कम *₹${(c.balanceDue || 0).toLocaleString()}* आहे.\nकृपया साप्ताहिक रक्कम स्टाफकडे किंवा ऑनलाइन भरावी.\nसंपर्क: ${settings.phone}`
    );
    const phone = c.phone.replace(/[^0-9]/g, '');
    const url = phone ? `https://wa.me/91${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div 
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Title & Agent Badge */}
        <div className="bg-gradient-to-r from-[#0B1528] via-[#102038] to-[#1E3A8A] text-white p-4 sm:p-5 flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 font-black flex items-center justify-center shadow-md shadow-amber-400/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg tracking-tight">
                  फिल्ड स्टाफ क्विक काउंटर (Field Counter)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Mobile Staff Mode
                </span>
              </div>
              <p className="text-xs text-slate-300">
                साप्ताहिक कलेक्शन, नवीन विक्री बिल, पावती व ग्राहक खातेवही
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 4 Essential Field Staff Tabs */}
        <div className="bg-slate-100 p-2 grid grid-cols-4 gap-1.5 border-b border-slate-200 text-xs font-bold shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveTab('card-collection');
              setErrorNotice('');
              setSuccessNotice('');
            }}
            className={`py-2 px-1 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 transition cursor-pointer text-center ${
              activeTab === 'card-collection'
                ? 'bg-amber-400 text-slate-950 shadow-sm font-black'
                : 'text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-4 h-4 shrink-0" />
            <span className="truncate">१. कार्ड हफ्ता</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('sales');
              setErrorNotice('');
              setSuccessNotice('');
            }}
            className={`py-2 px-1 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 transition cursor-pointer text-center ${
              activeTab === 'sales'
                ? 'bg-blue-600 text-white shadow-sm font-black'
                : 'text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
            }`}
          >
            <PlusCircle className="w-4 h-4 shrink-0" />
            <span className="truncate">२. नवीन बिल</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('receipt');
              setErrorNotice('');
              setSuccessNotice('');
            }}
            className={`py-2 px-1 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 transition cursor-pointer text-center ${
              activeTab === 'receipt'
                ? 'bg-emerald-600 text-white shadow-sm font-black'
                : 'text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-4 h-4 shrink-0" />
            <span className="truncate">३. पावती (जमा)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('ledger');
              setErrorNotice('');
              setSuccessNotice('');
            }}
            className={`py-2 px-1 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 transition cursor-pointer text-center ${
              activeTab === 'ledger'
                ? 'bg-purple-600 text-white shadow-sm font-black'
                : 'text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            <span className="truncate">४. खातेवही</span>
          </button>
        </div>

        {/* Feedback notices */}
        {successNotice && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successNotice}</span>
            </div>
            <button
              onClick={() => setSuccessNotice('')}
              className="text-emerald-700 font-bold hover:underline cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {errorNotice && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorNotice}</span>
            </div>
            <button
              onClick={() => setErrorNotice('')}
              className="text-rose-700 font-bold hover:underline cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Main Tab Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* ========================================================= */}
          {/* TAB 1: CARD COLLECTION (साप्ताहिक कार्ड हफ्ता कलेक्शन)  */}
          {/* ========================================================= */}
          {activeTab === 'card-collection' && (
            <form onSubmit={handleCollectionSubmit} className="space-y-4">
              <div className="bg-amber-50/70 border border-amber-200/80 p-3.5 rounded-2xl flex items-center justify-between flex-wrap gap-2 text-xs">
                <span className="text-amber-900 font-bold flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-amber-700" />
                  साप्ताहिक कार्ड कलेक्शन (Week Payment Entry)
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-600">स्टाफ / एजंट:</span>
                  <input
                    type="text"
                    value={agentNameInput}
                    onChange={(e) => setAgentNameInput(e.target.value)}
                    placeholder="Agent Name"
                    className="px-2 py-1 bg-white border border-amber-300 rounded-lg font-bold text-slate-800 text-xs w-32 focus:outline-none"
                  />
                </div>
              </div>

              {/* Select Member Card */}
              {!selectedMember ? (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    कार्ड नंबर किंवा नाव शोधा (Search Card / Name / Village)
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={cardSearch}
                      onChange={(e) => setCardSearch(e.target.value)}
                      placeholder="Type Card # (उदा. 1001), नाव किंवा गाव..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
                      autoFocus
                    />
                  </div>

                  <div className="max-h-52 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-2xl">
                    {filteredCardMembers.length > 0 ? (
                      filteredCardMembers.map((m) => (
                        <div
                          key={m.id}
                          onClick={() => setSelectedMember(m)}
                          className="p-3 hover:bg-amber-50/80 cursor-pointer flex items-center justify-between transition text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono font-bold text-xs">
                                #{m.cardNumber}
                              </span>
                              <span className="font-extrabold text-slate-900 text-sm">
                                {m.customerName}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500 mt-0.5 block">
                              {m.village ? `📍 ${m.village}` : ''} {m.sheetNo ? `• पाना #${m.sheetNo}` : ''} {m.phone ? `• 📞 ${m.phone}` : ''}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block">एकूण जमा</span>
                            <span className="font-black text-emerald-700 text-sm">
                              ₹{(m.netBalance ?? 0).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-xs text-slate-500">
                        कोणताही कार्ड सदस्य सापडला नाही.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Selected Card Info Box */}
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-700 text-white font-mono font-black text-xs">
                        कार्ड #{selectedMember.cardNumber} ({selectedMember.schemeName || '३०-महिने योजना'})
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedMember(null)}
                        className="text-xs text-emerald-700 font-bold underline cursor-pointer"
                      >
                        बदला (Change)
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-base">
                          {selectedMember.customerName}
                        </h4>
                        <p className="text-xs text-slate-600">
                          {selectedMember.village ? `गाव: ${selectedMember.village}` : ''}{' '}
                          {selectedMember.sheetNo ? `• शीट: ${selectedMember.sheetNo}` : ''}{' '}
                          {selectedMember.phone ? `• मो.: ${selectedMember.phone}` : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-slate-500 block font-medium">खाते शिल्लक</span>
                        <span className="text-base font-black text-emerald-700">
                          ₹{(selectedMember.netBalance || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Fast Amount Selector Buttons */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      हफ्ता रक्कम (Installment Amount ₹) *
                    </label>
                    <div className="grid grid-cols-4 gap-2 mb-2">
                      {[100, 200, 500, 1000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setCollectionAmount(amt)}
                          className={`py-2 rounded-xl font-black text-xs transition cursor-pointer ${
                            collectionAmount === amt
                              ? 'bg-amber-400 text-slate-950 shadow-sm'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          ₹{amt}
                        </button>
                      ))}
                    </div>
                    <input
                      type="number"
                      value={collectionAmount || ''}
                      onChange={(e) => setCollectionAmount(parseFloat(e.target.value) || 0)}
                      required
                      placeholder="उदा. 500"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-black text-base text-emerald-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>

                  {/* Week & Mode */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        आठवडा नं. (Week #)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="52"
                        value={collectionWeekNo}
                        onChange={(e) => setCollectionWeekNo(parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        पेमेंट प्रकार (Payment Mode)
                      </label>
                      <select
                        value={collectionMode}
                        onChange={(e) => setCollectionMode(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                      >
                        <option value="Cash">Cash (रोख)</option>
                        <option value="Online">Online / PhonePe / GPay</option>
                      </select>
                    </div>
                  </div>

                  {/* Remarks */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      टिप / रिमार्क (Remarks)
                    </label>
                    <input
                      type="text"
                      value={collectionRemarks}
                      onChange={(e) => setCollectionRemarks(e.target.value)}
                      placeholder="उदा. साप्ताहिक हफ्ता फिल्डमध्ये घेतला"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-400/25 cursor-pointer active:scale-98 transition"
                    >
                      <CheckCircle2 className="w-5 h-5 text-slate-950" />
                      <span>हफ्ता पावती जतन करा (₹{collectionAmount})</span>
                    </button>
                  </div>
                </div>
              )}
            </form>
          )}

          {/* ========================================================= */}
          {/* TAB 2: QUICK SALES ENTRY (नवीन विक्री बिल / बुकिंग)     */}
          {/* ========================================================= */}
          {activeTab === 'sales' && (
            <form onSubmit={handleSalesSubmit} className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-2xl text-xs text-blue-900 font-bold flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-blue-700 shrink-0" />
                <span>मार्केटमध्ये नवीन विक्री बिल किंवा बुकिंग त्वरित तयार करा</span>
              </div>

              {/* Customer details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ग्राहकाचे नाव (Customer Name) *
                  </label>
                  <input
                    type="text"
                    required
                    value={saleCustName}
                    onChange={(e) => setSaleCustName(e.target.value)}
                    placeholder="उदा. Ramesh Patil"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    मोबाईल नंबर (Phone / WhatsApp)
                  </label>
                  <input
                    type="tel"
                    value={saleCustPhone}
                    onChange={(e) => setSaleCustPhone(e.target.value)}
                    placeholder="उदा. 9823012345"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Stock Selector Helper */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  वस्तू / प्रॉडक्ट निवडा (किंवा खाली तपशील टाईप करा)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={stockSearch}
                    onChange={(e) => setStockSearch(e.target.value)}
                    placeholder="स्टॉक सर्च करा (कूलर, टीव्ही, पंखा...)"
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                {stockSearch && (
                  <div className="max-h-32 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl bg-slate-50">
                    {filteredStock.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => {
                          setSelectedStockId(s.id);
                          setSaleItemDetails(`${s.name} (${s.code})`);
                          setSaleTotalAmount(s.sellingPrice.toString());
                          setSalePayingNow(s.sellingPrice.toString());
                          setStockSearch('');
                        }}
                        className="p-2 text-xs hover:bg-blue-50 cursor-pointer flex justify-between items-center"
                      >
                        <span className="font-bold text-slate-800">{s.name}</span>
                        <span className="font-bold text-blue-600">₹{s.sellingPrice}</span>
                      </div>
                    ))}
                  </div>
                )}
                <input
                  type="text"
                  value={saleItemDetails}
                  onChange={(e) => setSaleItemDetails(e.target.value)}
                  placeholder="वस्तूचे नाव व तपशील (उदा. Cooler 50L / Smart TV 32 inch)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              {/* Total & Paid Amount */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    एकूण बिल (Total Amount ₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={saleTotalAmount}
                    onChange={(e) => {
                      setSaleTotalAmount(e.target.value);
                      if (!salePayingNow || salePayingNow === saleTotalAmount) {
                        setSalePayingNow(e.target.value);
                      }
                    }}
                    placeholder="उदा. 4500"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    रोख जमा (Paying Now ₹)
                  </label>
                  <input
                    type="number"
                    value={salePayingNow}
                    onChange={(e) => setSalePayingNow(e.target.value)}
                    placeholder="उदा. 1000"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-emerald-700"
                  />
                </div>
              </div>

              {/* Payment Mode & Link Scheme Card */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    पेमेंट पद्धत
                  </label>
                  <select
                    value={salePaymentMode}
                    onChange={(e) => setSalePaymentMode(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="Cash">Cash (रोख)</option>
                    <option value="Online">Online / PhonePe</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    कार्ड नंबर लिंक (ऐच्छिक)
                  </label>
                  <input
                    type="number"
                    value={saleLinkedCardNo}
                    onChange={(e) => setSaleLinkedCardNo(e.target.value)}
                    placeholder="उदा. 1001"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              {/* Submit Sales */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer transition active:scale-98"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>विक्री बिल सेव्ह करा (Save Sale Bill)</span>
                </button>
              </div>
            </form>
          )}

          {/* ========================================================= */}
          {/* TAB 3: RECEIPT / PAYMENT IN (उधार वसुली पावती)          */}
          {/* ========================================================= */}
          {activeTab === 'receipt' && (
            <form onSubmit={handleReceiptSubmit} className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl text-xs text-emerald-900 font-bold flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>मार्केटमध्ये ग्राहकाकडून जुनी बाकी / उधार वसुली जमा करा</span>
              </div>

              {!receiptCustomer ? (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    बाकीदार ग्राहक निवडा (Search Due Customer)
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={receiptSearch}
                      onChange={(e) => setReceiptSearch(e.target.value)}
                      placeholder="ग्राहकाचे नाव किंवा मोबाईल टाईप करा..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      autoFocus
                    />
                  </div>

                  <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-2xl">
                    {filteredCustomers.length > 0 ? (
                      filteredCustomers.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => {
                            setReceiptCustomer(c);
                            setReceiptAmount(c.balanceDue > 0 ? c.balanceDue.toString() : '500');
                          }}
                          className="p-3 hover:bg-emerald-50/80 cursor-pointer flex items-center justify-between text-xs transition"
                        >
                          <div>
                            <span className="font-extrabold text-slate-900 text-sm">{c.name}</span>
                            <span className="text-[11px] text-slate-500 block">
                              {c.phone ? `📞 ${c.phone}` : ''} {c.address ? `• 📍 ${c.address}` : ''}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block">एकूण बाकी</span>
                            <span className="font-black text-rose-600 text-sm">
                              ₹{(c.balanceDue || 0).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-xs text-slate-500">
                        कोणताही ग्राहक सापडला नाही.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Selected Customer Card */}
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded bg-emerald-700 text-white font-bold text-xs">
                        ग्राहक: {receiptCustomer.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => setReceiptCustomer(null)}
                        className="text-xs text-emerald-700 font-bold underline cursor-pointer"
                      >
                        बदला
                      </button>
                    </div>
                    <div className="flex justify-between items-center text-xs text-slate-700 pt-1">
                      <span>मोबाईल: {receiptCustomer.phone || 'N/A'}</span>
                      <span className="font-bold text-rose-600">
                        बाकी (Due): ₹{(receiptCustomer.balanceDue || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Receipt Amount */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      वसूल झालेली रक्कम (Received Amount ₹) *
                    </label>
                    <input
                      type="number"
                      required
                      value={receiptAmount}
                      onChange={(e) => setReceiptAmount(e.target.value)}
                      placeholder="उदा. 1000"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-black text-base text-emerald-700 focus:outline-none"
                    />
                  </div>

                  {/* Payment Mode */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      पेमेंट पद्धत
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setReceiptMode('Cash')}
                        className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 border ${
                          receiptMode === 'Cash'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200'
                        }`}
                      >
                        <Banknote className="w-4 h-4" />
                        <span>Cash (रोख)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setReceiptMode('Online')}
                        className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 border ${
                          receiptMode === 'Online'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200'
                        }`}
                      >
                        <Smartphone className="w-4 h-4" />
                        <span>Online (UPI)</span>
                      </button>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      टिप (Notes)
                    </label>
                    <input
                      type="text"
                      value={receiptNotes}
                      onChange={(e) => setReceiptNotes(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer transition active:scale-98"
                    >
                      <Receipt className="w-4 h-4" />
                      <span>पावती जमा करा (Save Receipt)</span>
                    </button>
                  </div>
                </div>
              )}
            </form>
          )}

          {/* ========================================================= */}
          {/* TAB 4: QUICK LEDGER LOOKUP (खाता बही स्टेटमेंट)        */}
          {/* ========================================================= */}
          {activeTab === 'ledger' && (
            <div className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 p-3 rounded-2xl text-xs text-purple-900 font-bold flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-purple-700 shrink-0" />
                  <span>ग्राहकाचे खाते, बाकी व स्टेटमेंट फिल्डमध्ये लगेच तपासा</span>
                </div>
                {onNavigateTab && (
                  <button
                    type="button"
                    onClick={() => {
                      onNavigateTab('dealer-ledger');
                      onClose();
                    }}
                    className="text-[11px] font-bold text-purple-700 underline cursor-pointer"
                  >
                    सर्व खातेवही →
                  </button>
                )}
              </div>

              {!viewedCustomerLedger ? (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    खाते तपासण्यासाठी ग्राहक शोधा
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={ledgerSearch}
                      onChange={(e) => setLedgerSearch(e.target.value)}
                      placeholder="ग्राहकाचे नाव किंवा फोन नंबर..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-purple-400 focus:outline-none"
                    />
                  </div>

                  <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-2xl">
                    {filteredCustomers.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => setViewedCustomerLedger(c)}
                        className="p-3 hover:bg-purple-50/80 cursor-pointer flex items-center justify-between text-xs transition"
                      >
                        <div>
                          <span className="font-extrabold text-slate-900 text-sm">{c.name}</span>
                          <span className="text-[11px] text-slate-500 block">
                            {c.phone ? `📞 ${c.phone}` : ''} {c.address ? `• 📍 ${c.address}` : ''}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block">बाकी (Due)</span>
                          <span
                            className={`font-black text-sm ${
                              c.balanceDue > 0 ? 'text-rose-600' : 'text-emerald-700'
                            }`}
                          >
                            ₹{(c.balanceDue || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded bg-purple-700 text-white font-bold text-xs">
                        खाते: {viewedCustomerLedger.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => setViewedCustomerLedger(null)}
                        className="text-xs text-purple-700 font-bold underline cursor-pointer"
                      >
                        दुसरा ग्राहक पहा
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-purple-200/60 text-center">
                      <div className="p-2 bg-white rounded-xl">
                        <span className="text-[10px] text-slate-500 block">एकूण खरेदी</span>
                        <span className="font-extrabold text-slate-900 text-xs">
                          ₹{(viewedCustomerLedger.totalPurchased || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="p-2 bg-white rounded-xl">
                        <span className="text-[10px] text-slate-500 block">एकूण जमा</span>
                        <span className="font-extrabold text-emerald-700 text-xs">
                          ₹{(viewedCustomerLedger.totalPaid || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="p-2 bg-white rounded-xl">
                        <span className="text-[10px] text-slate-500 block">शिल्लक बाकी</span>
                        <span className="font-black text-rose-600 text-xs">
                          ₹{(viewedCustomerLedger.balanceDue || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleShareWhatsAppReminder(viewedCustomerLedger)}
                        className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>WhatsApp वर बाकी पाठवा</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setReceiptCustomer(viewedCustomerLedger);
                          setReceiptAmount(viewedCustomerLedger.balanceDue > 0 ? viewedCustomerLedger.balanceDue.toString() : '');
                          setActiveTab('receipt');
                        }}
                        className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>रक्कम जमा करा</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer info bar */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-600 shrink-0">
          <span className="font-medium">
            श्री साई एंटरप्रायझेस • अधिकृत फिल्ड पोर्टल
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-lg border border-slate-300 text-slate-700 font-bold hover:bg-slate-200 transition cursor-pointer"
          >
            बंद करा (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
