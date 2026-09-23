import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Search,
  Plus,
  Printer,
  Share2,
  Calendar,
  Banknote,
  Smartphone,
  User,
  CheckCircle2,
  AlertCircle,
  FileText,
  Building2,
  ArrowUpRight,
  Filter,
  X,
  History
} from 'lucide-react';
import { BillReceiptEntry, Customer, TransactionEntry, BusinessSettings } from '../types';
import { getNextAgainstBillReceiptNumber } from '../utils/numbering';
import { AgainstBillReceiptModal } from './AgainstBillReceiptModal';

interface BillReceiptsViewProps {
  billReceipts: BillReceiptEntry[];
  customers: Customer[];
  transactions: TransactionEntry[];
  settings: BusinessSettings;
  onSaveReceipt: (receipt: BillReceiptEntry) => void;
  onDeleteReceipt?: (receiptId: string) => void;
}

export const BillReceiptsView: React.FC<BillReceiptsViewProps> = ({
  billReceipts,
  customers,
  transactions,
  settings,
  onSaveReceipt,
  onDeleteReceipt,
}) => {
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'yesterday' | 'month'>('all');
  const [modeFilter, setModeFilter] = useState<'all' | 'Cash' | 'Online'>('all');
  const [agentFilter, setAgentFilter] = useState<string>('all');

  // Modal states
  const [showNewReceiptModal, setShowNewReceiptModal] = useState(false);
  const [activeReceiptForModal, setActiveReceiptForModal] = useState<BillReceiptEntry | null>(null);

  // New receipt form states
  const nextReceiptNo = useMemo(() => {
    return getNextAgainstBillReceiptNumber(billReceipts, transactions);
  }, [billReceipts, transactions]);

  const [receiptNo, setReceiptNo] = useState(nextReceiptNo);
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [againstBillNo, setAgainstBillNo] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'Online'>('Cash');
  const [selectedAgent, setSelectedAgent] = useState<string>('Shubham Shende');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-fill customer balance & pending bills when customer is selected
  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  // Customer's bills that have due amounts
  const customerBills = useMemo(() => {
    if (!selectedCustomer) return [];
    return transactions.filter(
      (tx) =>
        (tx.customerId === selectedCustomer.id ||
          tx.customerName.toLowerCase() === selectedCustomer.name.toLowerCase()) &&
        (tx.docType !== 'quotation')
    );
  }, [selectedCustomer, transactions]);

  const previousBalance = selectedCustomer ? (selectedCustomer.balanceDue || 0) : 0;
  const numAmountPaid = parseFloat(amountPaid) || 0;
  const remainingBalance = Math.max(0, previousBalance - numAmountPaid);

  // Reset form when opening modal
  const handleOpenNewModal = () => {
    setReceiptNo(getNextAgainstBillReceiptNumber(billReceipts, transactions));
    setReceiptDate(new Date().toISOString().split('T')[0]);
    setSelectedCustomerId('');
    setAgainstBillNo('');
    setAmountPaid('');
    setPaymentMode('Cash');
    setSelectedAgent('Shubham Shende');
    setNotes('');
    setFormError('');
    setShowNewReceiptModal(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setFormError('');

    if (!selectedCustomer) {
      setFormError('कृपया ग्राहक निवडा (Please select a customer)');
      return;
    }

    if (!numAmountPaid || numAmountPaid <= 0) {
      setFormError('कृपया वैध जमा रक्कम टाका (Please enter a valid amount paid)');
      return;
    }

    setIsSubmitting(true);

    const cleanReceiptNo = receiptNo.trim() || nextReceiptNo;

    const newReceipt: BillReceiptEntry = {
      id: `rcp-${Date.now()}`,
      receiptNo: cleanReceiptNo,
      date: receiptDate,
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      customerPhone: selectedCustomer.phone,
      customerVillage: selectedCustomer.village || selectedCustomer.address,
      againstInvoiceNo: againstBillNo.trim() || undefined,
      previousBalance,
      amountPaid: numAmountPaid,
      remainingBalance,
      paymentMode,
      agentName: selectedAgent.trim() || undefined,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    onSaveReceipt(newReceipt);
    setShowNewReceiptModal(false);
    // Directly open print modal for the saved receipt!
    setActiveReceiptForModal(newReceipt);
    setTimeout(() => {
      setIsSubmitting(false);
    }, 600);
  };

  // Today & Yesterday dates
  const todayStr = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  const currentMonthPrefix = todayStr.slice(0, 7);

  // Filtered receipts
  const filteredReceipts = useMemo(() => {
    return billReceipts.filter((r) => {
      // Date filter
      if (dateFilter === 'today' && r.date !== todayStr) return false;
      if (dateFilter === 'yesterday' && r.date !== yesterdayStr) return false;
      if (dateFilter === 'month' && !r.date.startsWith(currentMonthPrefix)) return false;

      // Mode filter
      if (modeFilter !== 'all' && r.paymentMode !== modeFilter) return false;

      // Agent filter
      if (agentFilter !== 'all') {
        if (!r.agentName || !r.agentName.toLowerCase().includes(agentFilter.toLowerCase())) {
          return false;
        }
      }

      // Search
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchesNo = r.receiptNo.toLowerCase().includes(q);
        const matchesCust = r.customerName.toLowerCase().includes(q);
        const matchesPhone = (r.customerPhone || '').includes(q);
        const matchesBill = (r.againstInvoiceNo || '').toLowerCase().includes(q);
        if (!matchesNo && !matchesCust && !matchesPhone && !matchesBill) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      // Sort by receipt number descending
      const numA = parseInt(a.receiptNo.replace(/[^0-9]/g, ''), 10) || 0;
      const numB = parseInt(b.receiptNo.replace(/[^0-9]/g, ''), 10) || 0;
      return numB - numA;
    });
  }, [billReceipts, dateFilter, modeFilter, agentFilter, search, todayStr, yesterdayStr, currentMonthPrefix]);

  // Summary stats
  const stats = useMemo(() => {
    let todayTotal = 0;
    let todayCash = 0;
    let todayOnline = 0;
    let allTimeTotal = 0;

    billReceipts.forEach((r) => {
      allTimeTotal += r.amountPaid;
      if (r.date === todayStr) {
        todayTotal += r.amountPaid;
        if (r.paymentMode === 'Cash') todayCash += r.amountPaid;
        else todayOnline += r.amountPaid;
      }
    });

    return {
      todayTotal,
      todayCash,
      todayOnline,
      allTimeTotal,
      totalCount: billReceipts.length,
    };
  }, [billReceipts, todayStr]);

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-[#00523f] to-teal-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-xs font-semibold text-emerald-200 mb-2">
              <Receipt className="w-3.5 h-3.5" />
              <span>अधिकृत जमा पावती विभाग (Money Receipt Against Bills)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              बिलाच्या विरोधात जमा पावत्या (Receipts Against Bill)
            </h1>
            <p className="text-emerald-100/90 text-xs sm:text-sm mt-1 max-w-2xl">
              बिलाच्या उधारीवर व पार्ट पेमेंटवर घेतलेल्या सर्व अधिकृत पावत्यांचा हिशोब (क्रमांक १०७८ नंतर १०७९, १०८०...). ग्राहकाला तात्काळ संगणकीय पावती प्रिंट करून द्या.
            </p>
          </div>

          <button
            onClick={handleOpenNewModal}
            id="btn-open-new-bill-receipt"
            className="px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold text-sm shadow-lg shadow-amber-400/20 flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 shrink-0"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            <span>नवीन जमा पावती बनवा (#{nextReceiptNo})</span>
          </button>
        </div>

        {/* Decorative background shape */}
        <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            पुढील पावती क्र. (Next No)
          </span>
          <div className="flex items-center gap-1.5 mt-1">
            <Receipt className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-300 font-mono">
              #{nextReceiptNo}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">१०७८ पर्यंत रेकॉर्ड, आता १०७९ पासून</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            आजची एकूण जमा (Today's Receipts)
          </span>
          <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1 block">
            ₹{stats.todayTotal.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 block">
            आजच्या सर्व जमा पावत्या
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            आज रोख जमा (Today Cash)
          </span>
          <div className="flex items-center gap-1 mt-1">
            <Banknote className="w-4 h-4 text-emerald-600" />
            <span className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-400">
              ₹{stats.todayCash.toLocaleString('en-IN')}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">काऊंटर किंवा एजंट रोख</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            आज ऑनलाईन जमा (Today UPI)
          </span>
          <div className="flex items-center gap-1 mt-1">
            <Smartphone className="w-4 h-4 text-blue-600" />
            <span className="text-xl sm:text-2xl font-black text-blue-700 dark:text-blue-400">
              ₹{stats.todayOnline.toLocaleString('en-IN')}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">बँक / UPI खात्यात थेट</span>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            एकूण पावत्या (Total Slips)
          </span>
          <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1 block">
            {stats.totalCount}
          </span>
          <span className="text-[10px] text-slate-400 mt-1 block">
            एकूण ₹{stats.allTimeTotal.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="पावती क्र. (उदा. 1079), ग्राहकाचे नाव, फोन किंवा बिल क्र. शोधा..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00523f]"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Date Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: 'all', label: 'सर्व पावत्या' },
              { id: 'today', label: 'आज (Today)' },
              { id: 'yesterday', label: 'काल (Yesterday)' },
              { id: 'month', label: 'चालू महिना' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setDateFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  dateFilter === f.id
                    ? 'bg-[#00523f] text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mode & Agent Secondary Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <span className="text-slate-500 font-semibold flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            पेमेंट मोड:
          </span>
          {['all', 'Cash', 'Online'].map((m) => (
            <button
              key={m}
              onClick={() => setModeFilter(m as any)}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer font-medium ${
                modeFilter === m
                  ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {m === 'all' ? 'सर्व' : m === 'Cash' ? '💵 रोख' : '📲 ऑनलाईन'}
            </button>
          ))}

          <span className="text-slate-500 font-semibold ml-3 flex items-center gap-1">
            प्रतिनिधी / Agent:
          </span>
          {[
            { id: 'all', label: 'सर्व' },
            { id: 'Shubham', label: 'शुभम' },
            { id: 'Bhushan', label: 'भूषण' },
            { id: 'Suraj', label: 'सुरज' },
            { id: 'Ninad', label: 'निनाद' },
          ].map((ag) => (
            <button
              key={ag.id}
              onClick={() => setAgentFilter(ag.id)}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer font-medium ${
                agentFilter === ag.id
                  ? 'bg-emerald-800 text-white font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {ag.label}
            </button>
          ))}

          <span className="text-slate-400 ml-auto font-mono text-[11px]">
            {filteredReceipts.length} पावत्या आढळल्या
          </span>
        </div>
      </div>

      {/* Receipts Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        {filteredReceipts.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <Receipt className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              कोणतीही जमा पावती आढळली नाही
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              बिलाच्या उधारीवर नवीन पार्ट पेमेंट किंवा हप्ता जमा करण्यासाठी वरील "नवीन जमा पावती बनवा" बटनावर क्लिक करा.
            </p>
            <button
              onClick={handleOpenNewModal}
              className="px-4 py-2 rounded-xl bg-[#00523f] text-white text-xs font-bold shadow-sm transition"
            >
              + पहिली पावती बनवा (#{nextReceiptNo})
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">पावती क्र. (Receipt No)</th>
                  <th className="py-3 px-4">दिनांक (Date)</th>
                  <th className="py-3 px-4">ग्राहक व संपर्क (Customer)</th>
                  <th className="py-3 px-4">संदर्भ बिल (Against Bill)</th>
                  <th className="py-3 px-4 text-right">जमा रक्कम (Paid ₹)</th>
                  <th className="py-3 px-4 text-right">शिल्लक बाकी (Balance ₹)</th>
                  <th className="py-3 px-4">पेमेंट मोड</th>
                  <th className="py-3 px-4">प्रतिनिधी (Staff)</th>
                  <th className="py-3 px-4 text-center">क्रिया (Actions)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredReceipts.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition group"
                  >
                    <td className="py-3.5 px-4 font-mono font-black text-emerald-700 dark:text-emerald-400 text-sm">
                      #{r.receiptNo}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-medium">
                      {r.date}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {r.customerName}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                        {r.customerPhone && <span>{r.customerPhone}</span>}
                        {r.customerVillage && <span>• {r.customerVillage}</span>}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-700 dark:text-slate-300">
                      {r.againstInvoiceNo ? (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold">
                          {r.againstInvoiceNo}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">खाते जमा</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-800 dark:text-emerald-300 text-sm">
                      ₹{r.amountPaid.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-slate-700 dark:text-slate-300 font-medium">
                      {r.remainingBalance > 0 ? (
                        <span className="text-amber-700 dark:text-amber-400 font-bold">
                          ₹{r.remainingBalance.toLocaleString('en-IN')}
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-bold text-[11px]">पूर्ण जमा (₹0)</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          r.paymentMode === 'Cash'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                        }`}
                      >
                        {r.paymentMode === 'Cash' ? (
                          <>
                            <Banknote className="w-3 h-3" />
                            <span>Cash</span>
                          </>
                        ) : (
                          <>
                            <Smartphone className="w-3 h-3" />
                            <span>Online</span>
                          </>
                        )}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-medium text-[11px]">
                      {r.agentName || 'दुकान काउंटर'}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setActiveReceiptForModal(r)}
                          title="पावती प्रिंट करा (Print Receipt)"
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-[#00523f] hover:text-white text-slate-700 dark:text-slate-300 transition cursor-pointer"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveReceiptForModal(r)}
                          title="WhatsApp वर पाठवा"
                          className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-600 hover:text-white text-emerald-700 dark:text-emerald-400 transition cursor-pointer"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Receipt Creation Modal */}
      {showNewReceiptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto">
            
            <div className="p-4 bg-emerald-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-white/10 text-white">
                  <Receipt className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-sm font-bold">
                    नवीन बिलाविरोधात जमा पावती बनवा (New Against Bill Receipt)
                  </h3>
                  <p className="text-[11px] text-emerald-200">
                    उधारी किंवा बिलावर घेतलेला हप्ता जमा करून तात्काळ पावती द्या
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowNewReceiptModal(false)}
                className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="p-5 space-y-4 text-xs">
              
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Receipt No & Date row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    पावती क्र. (Receipt No) *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={receiptNo}
                      onChange={(e) => setReceiptNo(e.target.value)}
                      placeholder="उदा. 1079"
                      className="w-full p-2.5 font-mono font-black text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-emerald-800 dark:text-emerald-300 focus:outline-none focus:ring-2 focus:ring-[#00523f]"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-semibold">
                      (१०७९ पासून)
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    दिनांक (Date) *
                  </label>
                  <input
                    type="date"
                    required
                    value={receiptDate}
                    onChange={(e) => setReceiptDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00523f]"
                  />
                </div>
              </div>

              {/* Customer Selector */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    ग्राहक निवडा (Select Customer) *
                  </label>
                  {selectedCustomer && (
                    <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
                      सध्याची उधारी बाकी: ₹{selectedCustomer.balanceDue?.toLocaleString('en-IN') || 0}
                    </span>
                  )}
                </div>
                <select
                  required
                  value={selectedCustomerId}
                  onChange={(e) => {
                    setSelectedCustomerId(e.target.value);
                    setAgainstBillNo('');
                  }}
                  className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#00523f]"
                >
                  <option value="">-- ग्राहक निवडा (Customer) --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `(${c.phone})` : ''} — बाकी: ₹{(c.balanceDue || 0).toLocaleString('en-IN')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Against Bill No (Optional or choose from customer's bills) */}
              {selectedCustomer && (
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    संदर्भ बिल क्र. (Against Bill No)
                  </label>
                  {customerBills.length > 0 ? (
                    <select
                      value={againstBillNo}
                      onChange={(e) => setAgainstBillNo(e.target.value)}
                      className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#00523f]"
                    >
                      <option value="">-- जनरल उधारी खाते जमा (No specific bill) --</option>
                      {customerBills.map((b) => (
                        <option key={b.id} value={b.invoiceNo}>
                          {b.invoiceNo} • {b.date} • एकूण: ₹{b.totalAmount.toLocaleString('en-IN')} (बाकी: ₹{(b.dueAmount || 0).toLocaleString('en-IN')})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={againstBillNo}
                      onChange={(e) => setAgainstBillNo(e.target.value)}
                      placeholder="उदा. 3848, 3849 किंवा B-201 (किंवा रिकामे सोडा)"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00523f]"
                    />
                  )}
                </div>
              )}

              {/* Amount to pay */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  आज जमा केलेली रक्कम (Amount Paid ₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    required
                    min="1"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    placeholder="रक्कम टाका (उदा. 2000)"
                    className="w-full pl-7 pr-3 py-2.5 font-mono font-black text-base bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-emerald-800 dark:text-emerald-300 focus:outline-none focus:ring-2 focus:ring-[#00523f]"
                  />
                </div>

                {/* Quick preset buttons if customer has balance */}
                {previousBalance > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="text-[10px] text-slate-400">पटकन भरा:</span>
                    <button
                      type="button"
                      onClick={() => setAmountPaid(previousBalance.toString())}
                      className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-bold hover:bg-amber-200"
                    >
                      पूर्ण बाकी (₹{previousBalance})
                    </button>
                    {[500, 1000, 2000, 5000].map(
                      (amt) =>
                        amt <= previousBalance && (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setAmountPaid(amt.toString())}
                            className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-semibold hover:bg-slate-200"
                          >
                            ₹{amt}
                          </button>
                        )
                    )}
                  </div>
                )}
              </div>

              {/* Remaining Balance Preview Box */}
              {selectedCustomer && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">आधीची बाकी</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      ₹{previousBalance.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-600 block">आज जमा</span>
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      - ₹{numAmountPaid.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">उर्वरित बाकी</span>
                    <span className="font-mono font-bold text-amber-700 dark:text-amber-400">
                      ₹{remainingBalance.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              )}

              {/* Payment Mode */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  पेमेंट पद्धत (Payment Mode) *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMode('Cash')}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-bold transition cursor-pointer border ${
                      paymentMode === 'Cash'
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Banknote className="w-4 h-4" />
                    <span>रोख (Cash)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMode('Online')}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-bold transition cursor-pointer border ${
                      paymentMode === 'Online'
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>ऑनलाईन UPI (GPay/PhonePe)</span>
                  </button>
                </div>
              </div>

              {/* Agent Selector */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  जमा करून घेणारे प्रतिनिधी (Agent / Staff)
                </label>
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { id: 'Shubham Shende', label: 'शुभम शेंडे' },
                    { id: 'Bhushan Lidbe', label: 'भूषण लिडबे' },
                    { id: 'Suraj Pendam', label: 'सुरज पेंदाम' },
                    { id: 'Ninad Hole', label: 'निनाद होले' },
                    { id: 'दुकान काउंटर', label: 'दुकान काउंटर' },
                  ].map((ag) => (
                    <button
                      key={ag.id}
                      type="button"
                      onClick={() => setSelectedAgent(ag.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        selectedAgent === ag.id
                          ? 'bg-[#00523f] text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {ag.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  शेरा / टिप (Notes / Remarks)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="उदा. टीव्हीचा दुसरा हप्ता, रोख जमा..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00523f]"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowNewReceiptModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                >
                  रद्द करा
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  id="btn-submit-save-bill-receipt"
                  className={`px-5 py-2.5 rounded-xl bg-[#00523f] hover:bg-[#004232] text-white font-bold text-xs shadow-md shadow-[#00523f]/20 flex items-center gap-2 transition ${
                    isSubmitting ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer active:scale-95'
                  }`}
                >
                  <Receipt className="w-4 h-4" />
                  <span>{isSubmitting ? 'पावती जतन होत आहे...' : 'पावती जतन करा व प्रिंट करा (Save & Print)'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View & Print Modal */}
      {activeReceiptForModal && (
        <AgainstBillReceiptModal
          receipt={activeReceiptForModal}
          onClose={() => setActiveReceiptForModal(null)}
          settings={settings}
        />
      )}

    </div>
  );
};
