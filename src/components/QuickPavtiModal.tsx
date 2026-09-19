import React, { useState, useMemo, useEffect } from 'react';
import {
  Receipt,
  Search,
  X,
  IndianRupee,
  Calendar,
  CheckCircle,
  Phone,
  Printer,
  Share2,
  FileText,
  RotateCcw,
  Tag
} from 'lucide-react';
import { Customer, BusinessSettings, TransactionEntry } from '../types';

interface QuickPavtiModalProps {
  customers: Customer[];
  transactions?: TransactionEntry[];
  settings: BusinessSettings;
  onClose: () => void;
  onSettlePayment: (
    customerId: string,
    amount: number,
    mode: 'Cash' | 'Online',
    notes: string,
    customReceiptNo?: string,
    refBillNo?: string,
    customDate?: string
  ) => void;
  onOpenInvoiceModal?: (entry: TransactionEntry) => void;
  preselectedCustomerId?: string;
  preselectedBillNo?: string;
  preselectedAmount?: number;
}

export const QuickPavtiModal: React.FC<QuickPavtiModalProps> = ({
  customers = [],
  transactions = [],
  settings,
  onClose,
  onSettlePayment,
  onOpenInvoiceModal,
  preselectedCustomerId,
  preselectedBillNo,
  preselectedAmount,
}) => {
  // Mode: Against Bill (पार्ट पेमेंट) or General Account (थेट खात्यात जमा)
  const [receiptType, setReceiptType] = useState<'against-bill' | 'general'>('against-bill');

  // Customer search & selection
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Manual Receipt Number (मॅन्युअल पावती क्रमांक)
  const [receiptNo, setReceiptNo] = useState<string>('');

  // Against Bill Number (संदर्भ बिल क्रमांक)
  const [againstBillNo, setAgainstBillNo] = useState<string>(preselectedBillNo || '');

  // Payment details
  const [amount, setAmount] = useState<string>(preselectedAmount ? String(preselectedAmount) : '');
  const [mode, setMode] = useState<'Cash' | 'Online'>('Cash');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');
  const [submittedEntry, setSubmittedEntry] = useState<TransactionEntry | null>(null);
  const [remainingBalanceDue, setRemainingBalanceDue] = useState<number>(0);

  // Generate default receipt number on mount or refresh
  const generateNewReceiptNo = () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `SSE/RCPT-${randomSuffix}`;
  };

  useEffect(() => {
    setReceiptNo(generateNewReceiptNo());
  }, []);

  // Preselect customer if provided
  useEffect(() => {
    if (preselectedCustomerId && customers.length > 0) {
      const found = customers.find((c) => c.id === preselectedCustomerId);
      if (found) {
        setSelectedCustomer(found);
      }
    }
  }, [preselectedCustomerId, customers]);

  // Preselect bill if provided
  useEffect(() => {
    if (preselectedBillNo) {
      setAgainstBillNo(preselectedBillNo);
      setReceiptType('against-bill');
    }
  }, [preselectedBillNo]);

  // Filter customers with search
  const filteredCustomers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      return (customers || [])
        .slice()
        .sort((a, b) => (Number(b.balanceDue) || 0) - (Number(a.balanceDue) || 0))
        .slice(0, 15);
    }
    return (customers || [])
      .filter((c) => {
        if (!c) return false;
        const name = String(c.name || '').toLowerCase();
        const phone = String(c.phone || '');
        const village = String(c.village || '').toLowerCase();
        return name.includes(q) || phone.includes(q) || village.includes(q);
      })
      .slice(0, 15);
  }, [customers, search]);

  // Find all unpaid or recent bills for the selected customer
  const customerBills = useMemo(() => {
    if (!selectedCustomer) return [];
    const custId = selectedCustomer.id;
    const custName = (selectedCustomer.name || '').trim().toLowerCase();
    const custPhone = String(selectedCustomer.phone || '').replace(/[^0-9]/g, '');

    return (transactions || []).filter((t) => {
      if (!t || t.entryType === 'Receipt' || t.invoiceNo.startsWith('SSE/RCPT') || t.invoiceNo.startsWith('REC-')) {
        return false;
      }
      const matchId = t.customerId && t.customerId === custId;
      const matchName = custName && (t.customerName || '').trim().toLowerCase() === custName;
      const matchPhone = custPhone && String(t.customerPhone || '').replace(/[^0-9]/g, '') === custPhone;
      return matchId || matchName || matchPhone;
    });
  }, [selectedCustomer, transactions]);

  // Handle selecting a specific bill from the list
  const handleSelectBill = (bill: TransactionEntry) => {
    setAgainstBillNo(bill.invoiceNo);
    const pendingOnBill = bill.dueAmount !== undefined ? bill.dueAmount : Math.max(0, bill.totalAmount - bill.payingNow);
    if (pendingOnBill > 0) {
      setAmount(String(pendingOnBill));
    } else if (selectedCustomer && selectedCustomer.balanceDue > 0) {
      setAmount(String(selectedCustomer.balanceDue));
    }
  };

  // Submit payment & create receipt
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!selectedCustomer || !numAmount || numAmount <= 0) return;

    const finalReceiptNo = receiptNo.trim() || generateNewReceiptNo();
    const finalRefBill = receiptType === 'against-bill' ? againstBillNo.trim() : undefined;
    const finalNotes = notes.trim();

    onSettlePayment(
      selectedCustomer.id,
      numAmount,
      mode,
      finalNotes,
      finalReceiptNo,
      finalRefBill,
      date
    );

    const calculatedRemaining = Math.max(0, (selectedCustomer.balanceDue || 0) - numAmount);
    setRemainingBalanceDue(calculatedRemaining);

    // Create receipt entry object for instant receipt preview & printing
    const createdReceipt: TransactionEntry = {
      id: `rcpt-${Date.now()}`,
      invoiceNo: finalReceiptNo,
      entryType: 'Receipt',
      date: date,
      customerName: selectedCustomer.name,
      customerPhone: selectedCustomer.phone,
      customerId: selectedCustomer.id,
      village: selectedCustomer.village,
      itemDetails: finalRefBill
        ? `उधारी जमा पावती (संदर्भ बिल #${finalRefBill})`
        : `उधारी जमा पावती (थेट खात्यात जमा)`,
      totalAmount: 0,
      payingNow: numAmount,
      dueAmount: 0,
      paymentMode: mode,
      refBillNo: finalRefBill,
      againstBillNo: finalRefBill,
      notes: `${finalRefBill ? `संदर्भ बिल: #${finalRefBill}. ` : ''}${finalNotes || 'उधारी हिशोबात जमा'}`.trim(),
      createdAt: new Date().toISOString(),
    };

    setSubmittedEntry(createdReceipt);
  };

  // WhatsApp share message for this receipt
  const handleWhatsAppShare = () => {
    if (!submittedEntry || !selectedCustomer) return;

    const phone = (selectedCustomer.phone || '').replace(/[^0-9]/g, '');
    const text = encodeURIComponent(
      `*${settings.businessName || 'श्री साई इंटरप्राइजेस'}*\n` +
      `*🧾 उधारी जमा पावती (Part Payment Receipt)*\n` +
      `--------------------------------\n` +
      `पावती क्र. (Receipt No): *${submittedEntry.invoiceNo}*\n` +
      (submittedEntry.refBillNo ? `संदर्भ बिल क्र. (Against Bill): *#${submittedEntry.refBillNo}*\n` : '') +
      `दिनांक (Date): ${submittedEntry.date}\n` +
      `ग्राहक (Customer): *${submittedEntry.customerName}*\n` +
      `जमा रक्कम (Received): *₹${(submittedEntry.payingNow || 0).toLocaleString()}* (${submittedEntry.paymentMode})\n` +
      `उर्वरित बाकी (Remaining Balance): *₹${remainingBalanceDue.toLocaleString()}*\n` +
      (submittedEntry.notes ? `नोंद: ${submittedEntry.notes}\n` : '') +
      `--------------------------------\n` +
      `श्री साई इंटरप्राइजेस, वर्धा\n` +
      `धन्यवाद! 🙏`
    );

    const url = phone ? `https://wa.me/91${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-4 sm:p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800 my-auto max-h-[94vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                उधारी जमा पावती (Payment Receipt)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                पार्ट पेमेंट बिल विरुद्ध किंवा थेट खात्यात जमा करा
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {submittedEntry ? (
          /* ========================================================================= */
          /* SUCCESS SCREEN: RECEIPT SAVED */
          /* ========================================================================= */
          <div className="space-y-4 py-2 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-lg font-extrabold text-slate-900 dark:text-white">
                पावती यशस्वीरित्या नोंदवली गेली!
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Real-time Sync Active: डेटा सर्व उपकरणांवर (Web, .exe, Mobile) त्वरित अपडेट झाला आहे.
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-left space-y-2">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
                <span className="text-slate-500 dark:text-slate-400">पावती क्र. (Receipt No):</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                  {submittedEntry.invoiceNo}
                </span>
              </div>

              {submittedEntry.refBillNo && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">संदर्भ बिल क्र. (Against Bill):</span>
                  <span className="font-mono font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                    #{submittedEntry.refBillNo}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">ग्राहक (Customer):</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {submittedEntry.customerName}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">जमा रक्कम (Credited):</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-base font-mono">
                  ₹{(submittedEntry.payingNow || 0).toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">पेमेंट मोड (Mode):</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {submittedEntry.paymentMode}
                </span>
              </div>

              <div className="flex justify-between items-center border-t border-slate-200 dark:border-slate-700 pt-2">
                <span className="text-slate-700 dark:text-slate-300 font-semibold">उर्वरित उधारी बाकी (Remaining Due):</span>
                <span className={`font-mono font-extrabold ${remainingBalanceDue > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600'}`}>
                  ₹{remainingBalanceDue.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Actions: Print, WhatsApp, Record Another, Close */}
            <div className="space-y-2 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {onOpenInvoiceModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenInvoiceModal(submittedEntry);
                    }}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition"
                  >
                    <Printer className="w-4 h-4" />
                    <span>प्रिंट पावती (Print)</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleWhatsAppShare}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition"
                >
                  <Share2 className="w-4 h-4" />
                  <span>व्हॉट्सॲप पाठवा (WhatsApp)</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSubmittedEntry(null);
                    setAmount('');
                    setAgainstBillNo('');
                    setNotes('');
                    setReceiptNo(generateNewReceiptNo());
                  }}
                  className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer transition flex items-center justify-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>+ आणखी पावती नोंदवा</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  बंद करा (Close)
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* FORM: RECORD PAYMENT & RECEIPT */
          /* ========================================================================= */
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type Switcher: Part Payment Against Bill vs Direct Khata */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                पावती प्रकार (Receipt Type) *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setReceiptType('against-bill')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    receiptType === 'against-bill'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">बिल विरुद्ध पार्ट पेमेंट</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReceiptType('general');
                    setAgainstBillNo('');
                  }}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    receiptType === 'general'
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">थेट खात्यात उधारी जमा</span>
                </button>
              </div>
            </div>

            {/* 1. Customer Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ग्राहक निवडा (Customer) *
              </label>

              {selectedCustomer ? (
                <div className="p-3 rounded-xl border border-blue-500/40 bg-blue-500/10 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {selectedCustomer.name}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                      <span className="font-mono">{selectedCustomer.phone}</span>
                      {selectedCustomer.village && <span>• 📍 {selectedCustomer.village}</span>}
                      <span>•</span>
                      <span className="font-bold text-rose-600 dark:text-rose-400">
                        उधारी बाकी: ₹{(Number(selectedCustomer.balanceDue) || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCustomer(null);
                      setAgainstBillNo('');
                      setAmount('');
                    }}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 cursor-pointer shrink-0 ml-2"
                  >
                    बदला
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={search || ''}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="ग्राहकाचे नाव किंवा मोबाईल नंबर टाईप करा..."
                      className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                  </div>

                  <div className="max-h-36 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-800">
                    {filteredCustomers.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-400">
                        "{search}" नावाचा ग्राहक सापडला नाही
                      </div>
                    ) : (
                      filteredCustomers.map((c) => {
                        const due = Number(c.balanceDue) || 0;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setSelectedCustomer(c);
                              if (due > 0 && !amount) setAmount(String(due));
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center justify-between gap-2 cursor-pointer transition"
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                                {c.name}
                              </p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                                {c.phone} {c.village ? `• ${c.village}` : ''}
                              </p>
                            </div>
                            <span
                              className={`text-[11px] font-bold font-mono ${
                                due > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600'
                              }`}
                            >
                              {due > 0 ? `बाकी: ₹${due.toLocaleString()}` : 'Cleared'}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 2. Against Bill Selection (Only if against-bill type is active) */}
            {receiptType === 'against-bill' && selectedCustomer && (
              <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 space-y-2">
                <label className="block text-xs font-bold text-blue-900 dark:text-blue-300">
                  संदर्भ बिल क्रमांक (Against Bill No.) *
                </label>

                {/* Unpaid / Pending Bills of this Customer */}
                {customerBills.length > 0 ? (
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block mb-1">
                      या ग्राहकाची उपलब्ध बिले (क्लिक करून निवडा):
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                      {customerBills.map((b) => {
                        const billDue = b.dueAmount !== undefined ? b.dueAmount : Math.max(0, b.totalAmount - b.payingNow);
                        const isSelected = againstBillNo.trim().toLowerCase() === b.invoiceNo.trim().toLowerCase();
                        return (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => handleSelectBill(b)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:border-blue-400'
                            }`}
                          >
                            <span className="font-mono font-bold">#{b.invoiceNo}</span>
                            <span className="text-[10px] opacity-80 font-mono">
                              (बाकी: ₹{billDue.toLocaleString()})
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 italic">
                    या ग्राहकाची जुनी बिले थेट नोंदवलेली नाहीत. तुम्ही खाली मॅन्युअल बिल क्रमांक टाकू शकता.
                  </p>
                )}

                {/* Manual Input for Against Bill Number */}
                <div className="pt-1">
                  <input
                    type="text"
                    value={againstBillNo || ''}
                    onChange={(e) => setAgainstBillNo(e.target.value)}
                    placeholder="उदा. INV-2026-101 किंवा मॅन्युअल बिल क्र."
                    className="w-full px-3 py-2 rounded-lg border border-blue-300 dark:border-blue-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-bold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[10px] text-blue-700 dark:text-blue-400 mt-0.5">
                    तुम्ही स्वतः मॅन्युअली कोणताही बिल क्रमांक सेट करू शकता.
                  </p>
                </div>
              </div>
            )}

            {/* 3. Manual Receipt Number (मॅन्युअल पावती क्रमांक) */}
            <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50">
              <label className="block text-xs font-bold text-amber-900 dark:text-amber-300 mb-1 flex items-center justify-between">
                <span>पावती क्रमांक (Receipt Number) *</span>
                <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold">मॅन्युअली सेट करा (Editable)</span>
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  required
                  value={receiptNo || ''}
                  onChange={(e) => setReceiptNo(e.target.value)}
                  placeholder="उदा. 101, RCPT-45, 2026/12"
                  className="w-full px-3 py-2 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-bold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  type="button"
                  onClick={() => setReceiptNo(generateNewReceiptNo())}
                  className="px-2.5 py-2 text-xs font-semibold bg-white dark:bg-slate-700 border border-amber-300 dark:border-amber-600 rounded-lg hover:bg-amber-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 cursor-pointer shrink-0 transition"
                  title="Auto Generate Receipt No"
                >
                  Auto ⟳
                </button>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                तुम्ही तुमच्या दुकानातील छापील पावती बुक नंबर किंवा मॅन्युअल नंबर येथे टाईप करू शकता.
              </p>
            </div>

            {/* 4. Amount Received & Fast Amount Selectors */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  जमा रक्कम (Amount Received) *
                </label>
                {selectedCustomer && selectedCustomer.balanceDue > 0 && (
                  <button
                    type="button"
                    onClick={() => setAmount(String(selectedCustomer.balanceDue))}
                    className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    पूर्ण बाकी भरा (₹{selectedCustomer.balanceDue.toLocaleString()})
                  </button>
                )}
              </div>

              {/* Fast amount buttons */}
              <div className="grid grid-cols-4 gap-1.5 mb-2">
                {[500, 1000, 2000, 5000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAmount(String(amt))}
                    className="py-1 px-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold font-mono transition cursor-pointer text-center"
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>

              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base">
                  ₹
                </span>
                <input
                  type="number"
                  step="any"
                  required
                  value={amount || ''}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-extrabold text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>
            </div>

            {/* 5. Payment Mode & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  पेमेंट मोड (Mode) *
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setMode('Cash')}
                    className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      mode === 'Cash'
                        ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Cash (रोख)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('Online')}
                    className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      mode === 'Online'
                        ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Online / UPI
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  पावती तारीख (Receipt Date) *
                </label>
                <input
                  type="date"
                  value={date || ''}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
            </div>

            {/* 6. Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                शेरा / नोंद (Remarks / Notes)
              </label>
              <input
                type="text"
                value={notes || ''}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  receiptType === 'against-bill' && againstBillNo
                    ? `उदा. संदर्भ बिल #${againstBillNo} चे पार्ट पेमेंट`
                    : 'उदा. उधारी हिशोबात जमा, GPay Txn ID'
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>

            {/* Form Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                रद्द करा (Cancel)
              </button>
              <button
                type="submit"
                disabled={!selectedCustomer || !parseFloat(amount) || parseFloat(amount) <= 0}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5 transition"
              >
                <Receipt className="w-4 h-4" />
                <span>पावती सेव्ह करा (Save Receipt)</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
