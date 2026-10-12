import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Search,
  Printer,
  Plus,
  Calendar,
  CreditCard,
  Phone,
  CheckCircle2,
  Share2,
  Download,
  Edit3,
  Trash2,
  User,
  MapPin,
  FileText,
  DollarSign,
  Clock,
  Building2,
  Check,
  AlertCircle,
  FolderArchive,
  SlidersHorizontal,
  Save,
  QrCode,
  Sparkles,
  ArrowRight,
  TrendingUp,
  RotateCcw
} from 'lucide-react';
import { BillReceipt, Customer, StoreData, Transaction } from '../../types';
import { EditReceiptModal } from './EditReceiptModal';
import { StorageService } from '../../services/storageService';
import { useTheme } from '../../context/ThemeContext';

interface BillReceiptsViewProps {
  storeData: StoreData;
  onOpenFastPaymentModal?: () => void;
  onPrintReceipt: (receipt: BillReceipt) => void;
  onRefreshData?: () => void;
  onNavigateToOldEntry?: () => void;
}

export const BillReceiptsView: React.FC<BillReceiptsViewProps> = ({
  storeData,
  onOpenFastPaymentModal,
  onPrintReceipt,
  onRefreshData,
  onNavigateToOldEntry,
}) => {
  const { isDayMode } = useTheme();

  // Active Sub-Tab: 'list' (सर्व पावत्या) | 'new_receipt' (नवीन पावती फाडा) | 'old_receipt' (जुनी पावती नोंद) | 'settings' (सेटिंग्ज)
  const [activeTab, setActiveTab] = useState<'list' | 'new_receipt' | 'old_receipt' | 'settings'>('list');

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [modeFilter, setModeFilter] = useState<string>('All');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'month'>('all');
  const [editingReceipt, setEditingReceipt] = useState<BillReceipt | null>(null);

  // Success / Alert message
  const [toastMsg, setToastMsg] = useState<{ text: string; isError?: boolean } | null>(null);
  const showToast = (text: string, isError = false) => {
    setToastMsg({ text, isError });
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Next Receipt Number from store settings or calculate default starting from 1080
  const nextRecNo = useMemo(() => {
    if (storeData.settings?.nextReceiptNo) {
      return storeData.settings.nextReceiptNo;
    }
    const maxExisting = storeData.billReceipts.reduce((max, r) => Math.max(max, r.receiptNo || 0), 1079);
    return maxExisting + 1;
  }, [storeData.settings?.nextReceiptNo, storeData.billReceipts]);

  // =========================================================
  // SUB-TAB 2: NEW RECEIPT FORM STATE
  // =========================================================
  const [newRecNo, setNewRecNo] = useState<string>(() => String(nextRecNo));
  const [newRecDate, setNewRecDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [newRecCustomerId, setNewRecCustomerId] = useState<string>('');
  const [newRecCustomerName, setNewRecCustomerName] = useState<string>('');
  const [newRecCustomerPhone, setNewRecCustomerPhone] = useState<string>('');
  const [newRecCustomerVillage, setNewRecCustomerVillage] = useState<string>('');
  const [newRecInvoiceNo, setNewRecInvoiceNo] = useState<string>('');
  const [newRecAmount, setNewRecAmount] = useState<string>('');
  const [newRecPaymentMode, setNewRecPaymentMode] = useState<'Cash' | 'UPI' | 'Cheque' | 'Card'>('Cash');
  const [newRecRefDetails, setNewRecRefDetails] = useState<string>('');
  const [newRecHandledBy, setNewRecHandledBy] = useState<string>('शुभम (कॅश काउंटर)');
  const [newRecRemarks, setNewRecRemarks] = useState<string>('उधारी खाते जमा / हप्ता भरणा');
  const [isNewCustomerToggle, setIsNewCustomerToggle] = useState<boolean>(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState<string>('');

  // When nextRecNo changes, update newRecNo if not manually set
  React.useEffect(() => {
    setNewRecNo(String(nextRecNo));
  }, [nextRecNo]);

  // Selected Customer details
  const selectedCustomer = useMemo(() => {
    if (!newRecCustomerId) return null;
    return storeData.customers.find((c) => c.id === newRecCustomerId) || null;
  }, [newRecCustomerId, storeData.customers]);

  // Filtered customer options for search
  const filteredCustomers = useMemo(() => {
    const q = customerSearchQuery.trim().toLowerCase();
    if (!q) return storeData.customers.slice(0, 15);
    return storeData.customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q)) ||
        (c.village && c.village.toLowerCase().includes(q))
    ).slice(0, 15);
  }, [storeData.customers, customerSearchQuery]);

  // Customer's Unpaid / Recent Invoices
  const customerInvoices = useMemo(() => {
    if (!selectedCustomer) return [];
    return storeData.transactions.filter(
      (t) => t.customerName.toLowerCase() === selectedCustomer.name.toLowerCase()
    );
  }, [selectedCustomer, storeData.transactions]);

  // =========================================================
  // SUB-TAB 3: HISTORICAL OLD RECEIPT FORM STATE (Import format)
  // =========================================================
  const [oldRecNo, setOldRecNo] = useState<string>('1079');
  const [oldRecDate, setOldRecDate] = useState<string>('2024-04-15');
  const [oldRecCustomerName, setOldRecCustomerName] = useState<string>('');
  const [oldRecVillage, setOldRecVillage] = useState<string>('Wardha');
  const [oldRecPhone, setOldRecPhone] = useState<string>('');
  const [oldRecInvoiceNo, setOldRecInvoiceNo] = useState<string>('S-104');
  const [oldRecInvoiceDate, setOldRecInvoiceDate] = useState<string>('2024-03-10');
  const [oldRecAmount, setOldRecAmount] = useState<string>('1500');
  const [oldRecMode, setOldRecMode] = useState<'Cash' | 'UPI' | 'Cheque' | 'Card'>('Cash');
  const [oldRecHandledBy, setOldRecHandledBy] = useState<string>('शुभम');
  const [oldRecRemarks, setOldRecRemarks] = useState<string>('जुने बिल जमा पावती (इम्पोर्ट रेकॉर्ड)');

  // =========================================================
  // SUB-TAB 4: RECEIPT SETTINGS STATE
  // =========================================================
  const [settingsNextNo, setSettingsNextNo] = useState<string>(() => String(storeData.settings?.nextReceiptNo || 1080));
  const [settingsPrefix, setSettingsPrefix] = useState<string>(() => storeData.settings?.invoicePrefix ? `${storeData.settings.invoicePrefix}RCP-` : 'RCP-');
  const [settingsTerms, setSettingsTerms] = useState<string>('पावती ही अंतिम धनादेश / रोख जमा झाल्यानंतरच ग्राह्य धरली जाईल.');

  // Filtered Receipts for Ledger
  const filteredReceipts = useMemo(() => {
    return storeData.billReceipts.filter((r) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        String(r.receiptNo).includes(q) ||
        r.customerName.toLowerCase().includes(q) ||
        (r.invoiceNo && r.invoiceNo.toLowerCase().includes(q)) ||
        (r.remarks && r.remarks.toLowerCase().includes(q)) ||
        (r.handledBy && r.handledBy.toLowerCase().includes(q));

      const matchesMode = modeFilter === 'All' || r.paymentMode === modeFilter;

      let matchesDate = true;
      if (dateFilter === 'today') {
        const todayStr = new Date().toISOString().split('T')[0];
        matchesDate = r.date.startsWith(todayStr);
      } else if (dateFilter === 'month') {
        const thisMonth = new Date().toISOString().slice(0, 7);
        matchesDate = r.date.startsWith(thisMonth);
      }

      return matchesSearch && matchesMode && matchesDate;
    }).sort((a, b) => (b.receiptNo || 0) - (a.receiptNo || 0));
  }, [storeData.billReceipts, search, modeFilter, dateFilter]);

  const [displayLimit, setDisplayLimit] = useState<number>(50);
  const displayedReceipts = useMemo(() => {
    return filteredReceipts.slice(0, displayLimit);
  }, [filteredReceipts, displayLimit]);

  // Total Summary Metrics
  const totalReceiptsAmount = useMemo(() => {
    return storeData.billReceipts.reduce((acc, r) => acc + (r.amountPaid || 0), 0);
  }, [storeData.billReceipts]);

  const cashReceiptsAmount = useMemo(() => {
    return storeData.billReceipts
      .filter((r) => r.paymentMode === 'Cash')
      .reduce((acc, r) => acc + (r.amountPaid || 0), 0);
  }, [storeData.billReceipts]);

  const upiReceiptsAmount = useMemo(() => {
    return storeData.billReceipts
      .filter((r) => r.paymentMode === 'UPI')
      .reduce((acc, r) => acc + (r.amountPaid || 0), 0);
  }, [storeData.billReceipts]);

  const todayReceiptsCount = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return storeData.billReceipts.filter((r) => r.date.startsWith(todayStr)).length;
  }, [storeData.billReceipts]);

  // Handler: Save New Receipt
  const handleSaveNewReceipt = (printAfter = false, shareWhatsApp = false) => {
    const parsedAmount = parseFloat(newRecAmount);
    if (!parsedAmount || parsedAmount <= 0) {
      showToast('कृपया वैध जमा रक्कम टाका!', true);
      return;
    }

    const customerName = isNewCustomerToggle ? newRecCustomerName.trim() : (selectedCustomer?.name || newRecCustomerName.trim());
    if (!customerName) {
      showToast('कृपया ग्राहकाचे नाव निवडा किंवा टाका!', true);
      return;
    }

    const receiptNumber = parseInt(newRecNo, 10) || nextRecNo;

    // Check duplicate receipt number
    const duplicate = storeData.billReceipts.some((r) => r.receiptNo === receiptNumber);
    if (duplicate) {
      showToast(`पावती क्र. #${receiptNumber} आधीच अस्तित्वात आहे! कृपया वेगळा नंबर द्या.`, true);
      return;
    }

    let customerId = newRecCustomerId;
    let updatedCustomers = [...storeData.customers];

    // If new customer toggle
    if (isNewCustomerToggle || !customerId) {
      customerId = `cust-${Date.now()}`;
      const newCustObj: Customer = {
        id: customerId,
        name: customerName,
        phone: newRecCustomerPhone.trim() || '9800000000',
        village: newRecCustomerVillage.trim() || 'Wardha',
        address: newRecCustomerVillage.trim() || 'Wardha',
        city: newRecCustomerVillage.trim() || 'Wardha',
        creditLimit: 25000,
        currentBalance: -parsedAmount, // Advance or credit balance
        totalPurchased: 0,
        createdAt: newRecDate,
      };
      updatedCustomers.push(newCustObj);
    } else {
      // Deduct paid amount from customer balance dues
      updatedCustomers = updatedCustomers.map((c) => {
        if (c.id === customerId) {
          const currentBal = c.currentBalance || 0;
          return {
            ...c,
            currentBalance: Math.max(0, currentBal - parsedAmount),
          };
        }
        return c;
      });
    }

    // Determine balance remaining
    const currentCustBalance = selectedCustomer?.currentBalance || 0;
    const balanceRemaining = Math.max(0, currentCustBalance - parsedAmount);

    const newReceiptObj: BillReceipt = {
      id: `rcpt-${Date.now()}`,
      receiptNo: receiptNumber,
      customerId: customerId,
      customerName: customerName,
      invoiceNo: newRecInvoiceNo.trim() || undefined,
      amountPaid: parsedAmount,
      date: newRecDate,
      paymentMode: newRecPaymentMode,
      balanceRemaining: balanceRemaining,
      remarks: newRecRefDetails.trim() 
        ? `${newRecRemarks} (Ref: ${newRecRefDetails.trim()})` 
        : newRecRemarks,
      handledBy: newRecHandledBy,
    };

    // Update Transactions balanceDue if invoice is linked
    let updatedTransactions = [...storeData.transactions];
    if (newRecInvoiceNo.trim()) {
      updatedTransactions = updatedTransactions.map((t) => {
        if (t.invoiceNo === newRecInvoiceNo.trim()) {
          const newBal = Math.max(0, (t.balanceDue || 0) - parsedAmount);
          return {
            ...t,
            balanceDue: newBal,
            paidAmount: (t.paidAmount || 0) + parsedAmount,
            status: newBal <= 0 ? ('Paid' as const) : ('Partial' as const),
          };
        }
        return t;
      });
    }

    const nextIncrement = Math.max(nextRecNo, receiptNumber + 1);

    const updatedStoreData: StoreData = {
      ...storeData,
      billReceipts: [newReceiptObj, ...storeData.billReceipts],
      customers: updatedCustomers,
      transactions: updatedTransactions,
      settings: {
        ...storeData.settings,
        nextReceiptNo: nextIncrement,
      },
    };

    StorageService.saveData(updatedStoreData);
    if (onRefreshData) onRefreshData();

    showToast(`✓ जमा पावती #${receiptNumber} यशस्वीरीत्या सेव्ह झाली! (रक्कम: ₹${parsedAmount.toLocaleString('en-IN')})`);

    if (printAfter) {
      onPrintReceipt(newReceiptObj);
    }

    if (shareWhatsApp) {
      handleSendWhatsAppReceipt(newReceiptObj);
    }

    // Reset Form
    setNewRecAmount('');
    setNewRecRefDetails('');
    setNewRecNo(String(nextIncrement));
    setActiveTab('list');
  };

  // Handler: Save Old Historical Receipt (matching import)
  const handleSaveOldReceipt = () => {
    const parsedAmount = parseFloat(oldRecAmount);
    if (!parsedAmount || parsedAmount <= 0) {
      showToast('कृपया वैध रक्कम टाका!', true);
      return;
    }
    if (!oldRecCustomerName.trim()) {
      showToast('कृपया ग्राहकाचे नाव टाका!', true);
      return;
    }

    const recNo = parseInt(oldRecNo, 10) || 1079;
    const oldReceiptObj: BillReceipt = {
      id: `old-rcpt-${Date.now()}-${recNo}`,
      receiptNo: recNo,
      customerId: `cust-old-${Date.now()}`,
      customerName: oldRecCustomerName.trim(),
      invoiceNo: oldRecInvoiceNo.trim() || undefined,
      amountPaid: parsedAmount,
      date: oldRecDate,
      paymentMode: oldRecMode,
      balanceRemaining: 0,
      remarks: oldRecRemarks.trim() || `Old Bill Ref: ${oldRecInvoiceNo}`,
      handledBy: oldRecHandledBy,
    };

    const updatedStoreData: StoreData = {
      ...storeData,
      billReceipts: [oldReceiptObj, ...storeData.billReceipts],
    };

    StorageService.saveData(updatedStoreData);
    if (onRefreshData) onRefreshData();

    showToast(`✓ जुनी पावती #${recNo} (${oldRecCustomerName}) यशस्वीरीत्या नोंदवली गेली!`);
    setActiveTab('list');
  };

  // Handler: Save Settings
  const handleSaveSettings = () => {
    const nextSeq = parseInt(settingsNextNo, 10);
    if (isNaN(nextSeq) || nextSeq <= 0) {
      showToast('कृपया वैध पावती सिरीयल नंबर टाका!', true);
      return;
    }

    const updatedStoreData: StoreData = {
      ...storeData,
      settings: {
        ...storeData.settings,
        nextReceiptNo: nextSeq,
      },
    };

    StorageService.saveData(updatedStoreData);
    if (onRefreshData) onRefreshData();

    showToast(`✓ पुढील पावती सिरीयल #${nextSeq} सेव्ह झाली!`);
    setActiveTab('list');
  };

  // Handler: Delete Receipt
  const handleDeleteReceipt = (receipt: BillReceipt) => {
    if (!window.confirm(`पावती क्र. #${receipt.receiptNo} (${receipt.customerName} - ₹${receipt.amountPaid}) डिलीट करायची आहे का?`)) {
      return;
    }

    const updatedReceipts = storeData.billReceipts.filter((r) => r.id !== receipt.id);
    const updatedStoreData: StoreData = {
      ...storeData,
      billReceipts: updatedReceipts,
    };

    StorageService.saveData(updatedStoreData);
    if (onRefreshData) onRefreshData();

    showToast(`पावती क्र. #${receipt.receiptNo} डिलीट करण्यात आली.`);
  };

  // Handler: WhatsApp Receipt
  const handleSendWhatsAppReceipt = (r: BillReceipt) => {
    const msg = `🧾 *श्री साई एंटरप्रायजेस, आर्वी रोड, वर्धा* 🧾\n` +
      `*अधिकृत जमा पावती / PAYMENT RECEIPT*\n` +
      `-----------------------------------------\n` +
      `📋 *पावती क्र.:* #${r.receiptNo}\n` +
      `📅 *तारीख:* ${new Date(r.date).toLocaleDateString('en-IN')}\n` +
      `👤 *ग्राहक नाव:* ${r.customerName}\n` +
      `💵 *जमा रक्कम:* ₹${r.amountPaid.toLocaleString('en-IN')}\n` +
      `💳 *भरणा पद्धत:* ${r.paymentMode}\n` +
      (r.invoiceNo ? `📄 *बिल संदर्भ:* ${r.invoiceNo}\n` : '') +
      `💰 *शिल्लक बाकी:* ₹${(r.balanceRemaining || 0).toLocaleString('en-IN')}\n` +
      `✍️ *शेरा:* ${r.remarks || 'उधारी हप्ता भरणा'}\n` +
      `-----------------------------------------\n` +
      `धन्यवाद! आपल्या व्यवहारासाठी आम्ही आभारी आहोत.\n` +
      `📞 संपर्क: ${storeData.settings.phone || '9822100000'}`;

    const encoded = encodeURIComponent(msg);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Notification */}
      {toastMsg && (
        <div className={`fixed top-20 right-6 z-50 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border font-bold text-sm animate-bounce ${
          toastMsg.isError ? 'bg-rose-600 text-white border-rose-400' : 'bg-emerald-600 text-white border-emerald-400'
        }`}>
          {toastMsg.isError ? <AlertCircle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Main Header Banner */}
      <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl relative overflow-hidden ${
        isDayMode
          ? 'bg-gradient-to-r from-teal-500/10 via-sky-500/5 to-emerald-500/10 border-teal-200 text-slate-900'
          : 'bg-gradient-to-r from-slate-950 via-slate-900 to-teal-950/70 border-slate-800 text-white'
      }`}>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-teal-500 text-slate-950 uppercase tracking-wider">
                अधिकृत पावती विभाग
              </span>
              <span className="text-xs text-teal-400 font-bold flex items-center gap-1">
                <Receipt className="w-3.5 h-3.5" />
                सिरीयल क्र. #1079 पासून सुरू
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3">
              <Receipt className="w-8 h-8 text-teal-400" />
              <span>जमा पावती व्यवस्थापन व नोंदणी विभाग (Receipts Hub)</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              ग्राहकांची उधारी जमा, रोख/UPI पावती, जुनी ऐतिहासिक पावती नोंद व सिरीयल ट्रॅकिंग. पावती त्वरित प्रिंट करा किंवा WhatsApp वर पाठवा.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveTab('new_receipt')}
              className="px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-teal-500/25 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>नवीन पावती फाडा (+ New Receipt)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('old_receipt')}
              className="px-3.5 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
            >
              <FolderArchive className="w-4 h-4" />
              <span>जुनी पावती नोंद (#1079)</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition border border-slate-700 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>प्रिंट रिपोर्ट</span>
            </button>
          </div>
        </div>

        {/* 4 Dedicated Sub-Tabs */}
        <div className="mt-6 flex items-center gap-2 border-b border-slate-700/50 pb-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-black transition flex items-center gap-2.5 cursor-pointer shrink-0 ${
              activeTab === 'list'
                ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/25 scale-[1.02]'
                : isDayMode
                ? 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 border border-slate-700'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>१. सर्व जमा पावत्या नोंदवही (All Receipts #1079+)</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-black/20 font-mono">
              {storeData.billReceipts.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('new_receipt')}
            className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-black transition flex items-center gap-2.5 cursor-pointer shrink-0 ${
              activeTab === 'new_receipt'
                ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/25 scale-[1.02]'
                : isDayMode
                ? 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 border border-slate-700'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>२. नवीन पावती फाडा (New Receipt Entry)</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-black/20 font-mono">
              #{newRecNo}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('old_receipt')}
            className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-black transition flex items-center gap-2.5 cursor-pointer shrink-0 ${
              activeTab === 'old_receipt'
                ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/25 scale-[1.02]'
                : isDayMode
                ? 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 border border-slate-700'
            }`}
          >
            <FolderArchive className="w-4 h-4" />
            <span>३. जुनी पावती नोंद (Historical Past Receipt)</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-black/20 font-mono">Import</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-black transition flex items-center gap-2.5 cursor-pointer shrink-0 ${
              activeTab === 'settings'
                ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/25 scale-[1.02]'
                : isDayMode
                ? 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 border border-slate-700'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>४. पावती सिरीयल सेटिंग्ज (Settings)</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className={`p-4 rounded-2xl border shadow-sm ${
          isDayMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
        }`}>
          <div className="text-xs text-slate-400 font-bold">एकूण जमा पावत्या</div>
          <div className="text-2xl font-black text-teal-400 mt-1 font-mono">
            {storeData.billReceipts.length.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">अधिकृत सिरीयल #1079+</div>
        </div>

        <div className={`p-4 rounded-2xl border shadow-sm ${
          isDayMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
        }`}>
          <div className="text-xs text-slate-400 font-bold">एकूण जमा रक्कम (Total)</div>
          <div className="text-2xl font-black text-emerald-400 mt-1 font-mono">
            ₹{totalReceiptsAmount.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">खात्यावर जमा रोख व ऑनलाइन</div>
        </div>

        <div className={`p-4 rounded-2xl border shadow-sm ${
          isDayMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
        }`}>
          <div className="text-xs text-slate-400 font-bold">रोख (Cash) जमा</div>
          <div className="text-2xl font-black text-amber-400 mt-1 font-mono">
            ₹{cashReceiptsAmount.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            UPI: ₹{upiReceiptsAmount.toLocaleString('en-IN')}
          </div>
        </div>

        <div className={`p-4 rounded-2xl border shadow-sm ${
          isDayMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
        }`}>
          <div className="text-xs text-slate-400 font-bold">पुढील पावती नंबर</div>
          <div className="text-2xl font-black text-sky-400 mt-1 font-mono">
            #{nextRecNo}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">आजच्या पावत्या: {todayReceiptsCount}</div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SUB-TAB 1: ALL RECEIPTS LIST REGISTER                     */}
      {/* ========================================================= */}
      {activeTab === 'list' && (
        <div className={`p-6 rounded-3xl border shadow-xl ${
          isDayMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
        }`}>
          {/* Search, Filter Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-700/50">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="पावती नंबर, ग्राहक नाव, बिल नंबर किंवा शेरा शोधा..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs font-bold border focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  isDayMode ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                }`}
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Payment Mode Filters */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                {['All', 'Cash', 'UPI', 'Cheque', 'Card'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setModeFilter(m)}
                    className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                      modeFilter === m ? 'bg-teal-500 text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {m === 'All' ? 'सर्व' : m}
                  </button>
                ))}
              </div>

              {/* Date Filters */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                {[
                  { id: 'all', label: 'सर्व दिवस' },
                  { id: 'today', label: 'आजच्या' },
                  { id: 'month', label: 'या महिन्यातील' },
                ].map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDateFilter(d.id as any)}
                    className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                      dateFilter === d.id ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table */}
          {filteredReceipts.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              <Receipt className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <p>कोणतीही पावती आढळली नाही.</p>
              <button
                type="button"
                onClick={() => setActiveTab('new_receipt')}
                className="mt-3 px-4 py-2 bg-teal-500 text-slate-950 rounded-xl font-bold text-xs cursor-pointer"
              >
                + नवीन पावती फाडा
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-xs text-left">
                <thead className={`text-[11px] uppercase font-bold border-b ${
                  isDayMode ? 'bg-slate-50 text-slate-600 border-slate-200' : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}>
                  <tr>
                    <th className="py-3.5 px-4">पावती क्र. व तारीख</th>
                    <th className="py-3.5 px-4">ग्राहक नाव</th>
                    <th className="py-3.5 px-4">भरणा प्रकार</th>
                    <th className="py-3.5 px-4">बिल संदर्भ / शेरा</th>
                    <th className="py-3.5 px-4 text-right">जमा रक्कम</th>
                    <th className="py-3.5 px-4 text-right">शिल्लक बाकी</th>
                    <th className="py-3.5 px-4">हँडल्ड बाय</th>
                    <th className="py-3.5 px-4 text-center">क्रिया</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {displayedReceipts.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-teal-400 font-mono text-sm">#{r.receiptNo}</div>
                        <div className="text-[11px] text-slate-400">
                          {new Date(r.date).toLocaleDateString('en-IN')}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-black text-white text-sm">{r.customerName}</div>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          r.paymentMode === 'Cash'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : r.paymentMode === 'UPI'
                            ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                            : r.paymentMode === 'Cheque'
                            ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        }`}>
                          {r.paymentMode}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-300 max-w-xs truncate">
                        {r.invoiceNo && (
                          <span className="text-sky-400 font-mono mr-1.5 font-bold">[{r.invoiceNo}]</span>
                        )}
                        <span>{r.remarks || 'उधारी खाते भरणा'}</span>
                      </td>

                      <td className="py-3 px-4 text-right font-black text-emerald-400 text-sm font-mono">
                        +₹{r.amountPaid.toLocaleString('en-IN')}
                      </td>

                      <td className="py-3 px-4 text-right font-bold text-slate-400 text-xs font-mono">
                        ₹{(r.balanceRemaining || 0).toLocaleString('en-IN')}
                      </td>

                      <td className="py-3 px-4 text-slate-400 text-xs">
                        {r.handledBy || 'शुभम'}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onPrintReceipt(r)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition border border-slate-700 cursor-pointer"
                            title="अधिकृत पावती प्रिंट करा"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSendWhatsAppReceipt(r)}
                            className="p-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-lg transition border border-emerald-500/30 cursor-pointer"
                            title="WhatsApp वर पावती पाठवा"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setEditingReceipt(r)}
                            className="p-1.5 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 rounded-lg transition border border-teal-500/30 cursor-pointer"
                            title="पावती दुरुस्त करा (Edit)"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteReceipt(r)}
                            className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition border border-rose-500/20 cursor-pointer"
                            title="पावती डिलीट करा"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Progressive Loading Footer for Blazing Fast Performance */}
            {filteredReceipts.length > displayedReceipts.length && (
              <div className="mt-4 p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between text-xs text-slate-400">
                <div>
                  दाखवत आहे: <strong className="text-teal-400 font-bold">{displayedReceipts.length}</strong> / एकूण {filteredReceipts.length} पावत्या (सुपरफास्ट मोड)
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDisplayLimit((prev) => Math.min(prev + 50, filteredReceipts.length))}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold cursor-pointer transition border border-slate-700"
                  >
                    + आणखी ५० पावत्या दाखवा
                  </button>
                  <button
                    type="button"
                    onClick={() => setDisplayLimit(filteredReceipts.length)}
                    className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl font-bold cursor-pointer transition border border-slate-800"
                  >
                    सर्व ({filteredReceipts.length})
                  </button>
                </div>
              </div>
            )}
            </>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-TAB 2: NEW INSTANT RECEIPT ENTRY FORM                 */}
      {/* ========================================================= */}
      {activeTab === 'new_receipt' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form (2 cols) */}
          <div className={`lg:col-span-2 p-6 sm:p-8 rounded-3xl border shadow-xl ${
            isDayMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-700/50 mb-6">
              <div>
                <h2 className="text-lg font-black flex items-center gap-2">
                  <Plus className="w-5 h-5 text-teal-400" />
                  <span>नवीन जमा पावती फाडा (Generate Cash / Online Receipt)</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  ग्राहकाची उधारी रक्कम किंवा ॲडव्हान्स जमा करा. थेट प्रिंट व WhatsApp पर्याय उपलब्ध.
                </p>
              </div>

              <div className="px-3.5 py-1.5 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/40 text-xs font-mono font-black">
                सिरीयल #{newRecNo}
              </div>
            </div>

            <div className="space-y-4">
              {/* Row 1: Receipt No & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1.5">
                    पावती क्रमांक (Receipt No) *
                  </label>
                  <input
                    type="number"
                    value={newRecNo}
                    onChange={(e) => setNewRecNo(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-2xl text-sm font-mono font-bold border focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      isDayMode ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1.5">
                    पावती तारीख (Receipt Date) *
                  </label>
                  <input
                    type="date"
                    value={newRecDate}
                    onChange={(e) => setNewRecDate(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-2xl text-sm font-bold border focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      isDayMode ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                    }`}
                  />
                </div>
              </div>

              {/* Row 2: Customer Selection / Toggle */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-400">
                    ग्राहक निवडा / उधारी खातेदार *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewCustomerToggle(!isNewCustomerToggle);
                      if (!isNewCustomerToggle) {
                        setNewRecCustomerId('');
                      }
                    }}
                    className="text-xs text-teal-400 font-bold hover:underline cursor-pointer"
                  >
                    {isNewCustomerToggle ? '← यादीतून ग्राहक निवडा' : '+ नवीन ग्राहक नोंदवा'}
                  </button>
                </div>

                {!isNewCustomerToggle ? (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        placeholder="ग्राहकाचे नाव किंवा मोबाईल शोधा..."
                        value={customerSearchQuery}
                        onChange={(e) => setCustomerSearchQuery(e.target.value)}
                        className={`w-full pl-10 pr-4 py-2 rounded-xl text-xs font-bold border focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                          isDayMode ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                        }`}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 border border-slate-800/60 rounded-2xl">
                      {filteredCustomers.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => {
                            setNewRecCustomerId(c.id);
                            setNewRecCustomerName(c.name);
                            setNewRecCustomerPhone(c.phone || '');
                            setNewRecCustomerVillage(c.village || c.address || '');
                          }}
                          className={`p-2.5 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between ${
                            newRecCustomerId === c.id
                              ? 'bg-teal-500/20 border-teal-500 text-white'
                              : isDayMode
                              ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                              : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <div>
                            <div className="font-bold">{c.name}</div>
                            <div className="text-[10px] text-slate-400">{c.village || 'Wardha'} • {c.phone}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] text-slate-400">उधारी बाकी:</div>
                            <div className="font-bold text-amber-400 font-mono">₹{(c.currentBalance || 0).toLocaleString('en-IN')}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-2xl bg-slate-950 border border-slate-800">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">ग्राहक पूर्ण नाव *</label>
                      <input
                        type="text"
                        placeholder="उदा. रमेश वानखेडे"
                        value={newRecCustomerName}
                        onChange={(e) => setNewRecCustomerName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl text-xs bg-slate-900 border border-slate-700 text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">मोबाईल नंबर</label>
                      <input
                        type="text"
                        placeholder="98XXXXXXXX"
                        value={newRecCustomerPhone}
                        onChange={(e) => setNewRecCustomerPhone(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl text-xs bg-slate-900 border border-slate-700 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">गाव / पत्ता</label>
                      <input
                        type="text"
                        placeholder="उदा. वर्धा, हिंगणी"
                        value={newRecCustomerVillage}
                        onChange={(e) => setNewRecCustomerVillage(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl text-xs bg-slate-900 border border-slate-700 text-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Row 3: Invoice Link (Optional) */}
              {customerInvoices.length > 0 && (
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1.5">
                    संबंधित बिल / इनव्हॉइस जोडा (Linked Invoice)
                  </label>
                  <select
                    value={newRecInvoiceNo}
                    onChange={(e) => {
                      setNewRecInvoiceNo(e.target.value);
                      const inv = customerInvoices.find((t) => t.invoiceNo === e.target.value);
                      if (inv && inv.balanceDue) {
                        setNewRecAmount(String(inv.balanceDue));
                      }
                    }}
                    className={`w-full px-4 py-2.5 rounded-2xl text-xs font-bold border ${
                      isDayMode ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                    }`}
                  >
                    <option value="">कोणतेही बिल जोडायचे नाही (सामान्य खाते भरणा)</option>
                    {customerInvoices.map((inv) => (
                      <option key={inv.id} value={inv.invoiceNo}>
                        बिल #{inv.invoiceNo} (एकूण: ₹{inv.grandTotal} • बाकी: ₹{inv.balanceDue}) - {new Date(inv.date).toLocaleDateString('en-IN')}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Row 4: Amount & Quick Chips */}
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1.5">
                  जमा रक्कम (Amount Paid ₹) *
                </label>
                <div className="relative">
                  <span className="text-lg font-bold text-emerald-400 absolute left-4 top-2.5">₹</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={newRecAmount}
                    onChange={(e) => setNewRecAmount(e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 rounded-2xl text-xl font-mono font-black border focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      isDayMode ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                    }`}
                  />
                </div>

                {/* Quick Chips */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[500, 1000, 2000, 5000, 10000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setNewRecAmount(String(amt))}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                    >
                      +₹{amt.toLocaleString('en-IN')}
                    </button>
                  ))}
                  {selectedCustomer && (selectedCustomer.currentBalance || 0) > 0 && (
                    <button
                      type="button"
                      onClick={() => setNewRecAmount(String(selectedCustomer.currentBalance))}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-pointer"
                    >
                      पूर्ण बाकी: ₹{selectedCustomer.currentBalance.toLocaleString('en-IN')}
                    </button>
                  )}
                </div>
              </div>

              {/* Row 5: Payment Mode & Reference */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1.5">
                    भरणा पद्धत (Payment Mode) *
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(['Cash', 'UPI', 'Cheque', 'Card'] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setNewRecPaymentMode(m)}
                        className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer text-center ${
                          newRecPaymentMode === m
                            ? 'bg-teal-500 text-slate-950 border-teal-500 shadow-md font-black'
                            : isDayMode
                            ? 'bg-slate-50 border-slate-200 text-slate-700'
                            : 'bg-slate-950 border-slate-800 text-slate-300'
                        }`}
                      >
                        {m === 'Cash' ? 'रोख' : m}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1.5">
                    UTR / Cheque No / ट्रान्झॅक्शन आयडी (पर्यायी)
                  </label>
                  <input
                    type="text"
                    placeholder={newRecPaymentMode === 'UPI' ? 'उदा. 423456789012' : newRecPaymentMode === 'Cheque' ? 'उदा. Cheque #450123' : 'रेफरन्स डिटेल्स'}
                    value={newRecRefDetails}
                    onChange={(e) => setNewRecRefDetails(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-2xl text-xs font-bold border focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      isDayMode ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                    }`}
                  />
                </div>
              </div>

              {/* Row 6: Collector & Remarks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1.5">
                    हँडल्ड बाय / जमा घेणारा (Collected By)
                  </label>
                  <select
                    value={newRecHandledBy}
                    onChange={(e) => setNewRecHandledBy(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-2xl text-xs font-bold border ${
                      isDayMode ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                    }`}
                  >
                    <option value="शुभम (कॅश काउंटर)">शुभम (कॅश काउंटर)</option>
                    <option value="हर्षदा फुलझेले">हर्षदा फुलझेले</option>
                    <option value="दुकान व्यवस्थापक">दुकान व्यवस्थापक</option>
                    <option value="कलेक्शन एजंट">कलेक्शन एजंट</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1.5">
                    शेरा / टिप्पणी (Remarks)
                  </label>
                  <input
                    type="text"
                    value={newRecRemarks}
                    onChange={(e) => setNewRecRemarks(e.target.value)}
                    placeholder="उदा. उधारी हप्ता भरणा, दिवाळी खरेदी हप्ता"
                    className={`w-full px-4 py-2.5 rounded-2xl text-xs font-bold border focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      isDayMode ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                    }`}
                  />
                </div>
              </div>

              {/* Actions Button Bar */}
              <div className="pt-4 border-t border-slate-700/50 flex flex-wrap items-center gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => handleSaveNewReceipt(false, false)}
                  className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-2xl transition border border-slate-700 cursor-pointer"
                >
                  फक्त सेव्ह करा (Save Only)
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveNewReceipt(false, true)}
                  className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-2xl transition flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-600/20"
                >
                  <Share2 className="w-4 h-4" />
                  <span>सेव्ह व WhatsApp पाठवा</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveNewReceipt(true, false)}
                  className="px-6 py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-black rounded-2xl transition flex items-center gap-2 shadow-lg shadow-teal-500/25 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>✓ पावती सेव्ह करा व प्रिंट काढा</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Live Receipt Preview Card */}
          <div className={`p-6 rounded-3xl border shadow-xl flex flex-col justify-between ${
            isDayMode ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
          }`}>
            <div>
              <div className="text-xs font-black uppercase text-teal-400 flex items-center gap-1.5 mb-4">
                <Sparkles className="w-4 h-4" />
                <span>थेट पावती प्रीव्ह्यू (Live Receipt Preview)</span>
              </div>

              {/* Receipt Paper UI */}
              <div className="p-5 rounded-2xl bg-white text-slate-950 border border-slate-200 shadow-md font-sans space-y-3">
                <div className="text-center border-b border-dashed border-slate-300 pb-3">
                  <div className="font-black text-sm tracking-tight">श्री साई एंटरप्रायजेस</div>
                  <div className="text-[10px] text-slate-600">आर्वी रोड, वर्धा • 📞 {storeData.settings.phone || '9822100000'}</div>
                  <div className="text-[10px] font-bold text-teal-700 uppercase mt-1">अधिकृत जमा पावती</div>
                </div>

                <div className="flex justify-between text-[11px] font-mono">
                  <span className="font-bold">पावती क्र.: #{newRecNo}</span>
                  <span>{newRecDate}</span>
                </div>

                <div className="text-[11px] space-y-1">
                  <div>
                    <span className="text-slate-500">ग्राहक: </span>
                    <span className="font-bold">{newRecCustomerName || 'ग्राहक नाव'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">गाव/पत्ता: </span>
                    <span>{newRecCustomerVillage || 'वर्धा'}</span>
                  </div>
                  {newRecInvoiceNo && (
                    <div>
                      <span className="text-slate-500">बिल संदर्भ: </span>
                      <span className="font-mono font-bold">{newRecInvoiceNo}</span>
                    </div>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-center">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">जमा झालेली रक्कम</div>
                  <div className="text-2xl font-black text-emerald-700 font-mono">
                    ₹{newRecAmount ? parseFloat(newRecAmount).toLocaleString('en-IN') : '0'}
                  </div>
                  <div className="text-[10px] font-bold text-slate-600 mt-0.5">
                    भरणा पद्धत: {newRecPaymentMode}
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 text-center border-t border-dashed border-slate-300 pt-2">
                  {newRecRemarks}
                  <div className="text-[9px] text-slate-400 mt-1">
                    हँडल्ड बाय: {newRecHandledBy} • संगणकीय पावती
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 text-[11px] text-slate-400 text-center">
              पावती सेव्ह केल्यानंतर ग्राहकाच्या उधारी खात्यातून ही रक्कम आपोआप वजा होईल.
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-TAB 3: HISTORICAL OLD RECEIPT ENTRY (Import format)   */}
      {/* ========================================================= */}
      {activeTab === 'old_receipt' && (
        <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl max-w-4xl mx-auto ${
          isDayMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
        }`}>
          <div className="flex items-center justify-between pb-4 border-b border-slate-700/50 mb-6">
            <div>
              <div className="px-3 py-1 rounded-full text-[11px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 inline-block mb-2">
                इम्पोर्ट व जुनी पावती नोंदणी
              </div>
              <h2 className="text-lg font-black flex items-center gap-2">
                <FolderArchive className="w-5 h-5 text-amber-400" />
                <span>जुनी पावती नोंद (#1079 व मागील पावत्या)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                एक्सेल किंवा जुन्या वहीमधील पावती नंबर, जुना बिल नंबर आणि जमा रक्कम या प्रणालीत नोंदवा.
              </p>
            </div>

            {onNavigateToOldEntry && (
              <button
                type="button"
                onClick={onNavigateToOldEntry}
                className="px-3.5 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold border border-slate-700 cursor-pointer"
              >
                जुने बिल व कार्ड नोंद कडे जा →
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1.5">
                  जुना पावती नंबर (Receipt No) *
                </label>
                <input
                  type="number"
                  value={oldRecNo}
                  onChange={(e) => setOldRecNo(e.target.value)}
                  placeholder="उदा. 1079"
                  className={`w-full px-4 py-2.5 rounded-2xl text-sm font-mono font-bold border ${
                    isDayMode ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                  }`}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1.5">
                  पावती तारीख *
                </label>
                <input
                  type="date"
                  value={oldRecDate}
                  onChange={(e) => setOldRecDate(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-2xl text-sm font-bold border ${
                    isDayMode ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                  }`}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1.5">
                  जमा रक्कम (Amount ₹) *
                </label>
                <input
                  type="number"
                  value={oldRecAmount}
                  onChange={(e) => setOldRecAmount(e.target.value)}
                  placeholder="उदा. 1500"
                  className={`w-full px-4 py-2.5 rounded-2xl text-sm font-mono font-black border text-emerald-400 ${
                    isDayMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1.5">
                  ग्राहकाचे नाव *
                </label>
                <input
                  type="text"
                  value={oldRecCustomerName}
                  onChange={(e) => setOldRecCustomerName(e.target.value)}
                  placeholder="उदा. गजानन ठाकरे"
                  className={`w-full px-4 py-2.5 rounded-2xl text-xs font-bold border ${
                    isDayMode ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                  }`}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1.5">
                  गाव / पत्ता
                </label>
                <input
                  type="text"
                  value={oldRecVillage}
                  onChange={(e) => setOldRecVillage(e.target.value)}
                  placeholder="उदा. वर्धा, सेलू"
                  className={`w-full px-4 py-2.5 rounded-2xl text-xs font-bold border ${
                    isDayMode ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                  }`}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1.5">
                  मोबाईल नंबर (पर्यायी)
                </label>
                <input
                  type="text"
                  value={oldRecPhone}
                  onChange={(e) => setOldRecPhone(e.target.value)}
                  placeholder="98XXXXXXXX"
                  className={`w-full px-4 py-2.5 rounded-2xl text-xs font-mono border ${
                    isDayMode ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1.5">
                  जुना बिल नंबर (Old Bill No)
                </label>
                <input
                  type="text"
                  value={oldRecInvoiceNo}
                  onChange={(e) => setOldRecInvoiceNo(e.target.value)}
                  placeholder="उदा. S-104 किंवा B-89"
                  className={`w-full px-4 py-2.5 rounded-2xl text-xs font-mono font-bold border ${
                    isDayMode ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                  }`}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1.5">
                  भरणा प्रकार (Payment Mode)
                </label>
                <select
                  value={oldRecMode}
                  onChange={(e) => setOldRecMode(e.target.value as any)}
                  className={`w-full px-4 py-2.5 rounded-2xl text-xs font-bold border ${
                    isDayMode ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                  }`}
                >
                  <option value="Cash">रोख (Cash)</option>
                  <option value="UPI">UPI</option>
                  <option value="Cheque">चेक (Cheque)</option>
                  <option value="Card">कार्ड (Card)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1.5">
                  शेरा / संदर्भ
                </label>
                <input
                  type="text"
                  value={oldRecRemarks}
                  onChange={(e) => setOldRecRemarks(e.target.value)}
                  placeholder="उदा. जुने बिल जमा पावती"
                  className={`w-full px-4 py-2.5 rounded-2xl text-xs font-bold border ${
                    isDayMode ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                  }`}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-700/50 flex justify-end">
              <button
                type="button"
                onClick={handleSaveOldReceipt}
                className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-2xl shadow-lg shadow-amber-500/25 transition cursor-pointer flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>✓ जुनी पावती सेव्ह करा व नोंदवा</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-TAB 4: RECEIPT NUMBER & SEQUENCE SETTINGS             */}
      {/* ========================================================= */}
      {activeTab === 'settings' && (
        <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl max-w-2xl mx-auto ${
          isDayMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
        }`}>
          <div className="pb-4 border-b border-slate-700/50 mb-6">
            <h2 className="text-lg font-black flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-teal-400" />
              <span>पावती सिरीयल काउंटर व सेटिंग्ज</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              पुढील पावती नंबर आणि सिरीयल क्रम नियंत्रित करा.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1.5">
                पुढील पावती नंबर (Next Receipt Number) *
              </label>
              <input
                type="number"
                value={settingsNextNo}
                onChange={(e) => setSettingsNextNo(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-2xl text-base font-mono font-black border ${
                  isDayMode ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                }`}
              />
              <p className="text-[11px] text-slate-500 mt-1">
                सध्या सिरीयल #1079 वरून पुढे जात आहे. आपण इच्छित नंबर (उदा. 1080) सेट करू शकता.
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1.5">
                पावती अटी व नियम (Receipt Note)
              </label>
              <textarea
                rows={3}
                value={settingsTerms}
                onChange={(e) => setSettingsTerms(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-2xl text-xs border ${
                  isDayMode ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                }`}
              />
            </div>

            <div className="pt-4 border-t border-slate-700/50 flex justify-end">
              <button
                type="button"
                onClick={handleSaveSettings}
                className="px-6 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>सेटिंग्ज सेव्ह करा</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Receipt Modal */}
      {editingReceipt && (
        <EditReceiptModal
          receipt={editingReceipt}
          storeData={storeData}
          isOpen={true}
          onClose={() => setEditingReceipt(null)}
          onRefreshData={() => {
            if (onRefreshData) onRefreshData();
          }}
        />
      )}
    </div>
  );
};
