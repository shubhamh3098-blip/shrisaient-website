import React, { useState, useMemo, useEffect } from 'react';
import {
  ClipboardList,
  Search,
  Printer,
  Share2,
  Calendar,
  UserCheck,
  CreditCard,
  Receipt,
  IndianRupee,
  CheckCircle2,
  Phone,
  MapPin,
  Clock,
  ArrowUpRight,
  Filter,
  Download,
  FileText,
  Building2,
  Coins,
  ChevronRight,
  X,
  Fuel,
  Trash2,
  PlusCircle
} from 'lucide-react';
import {
  CardTransaction,
  BillReceiptEntry,
  TransactionEntry,
  BusinessSettings,
  StaffMember,
  CardMember,
  Customer
} from '../types';

export interface AgentDailyExpense {
  id: string;
  date: string;
  agentName: string;
  category: 'Fuel (पेट्रोल)' | 'Food/Tea (नाश्ता/चहा)' | 'Vehicle Maintenance (दुरुस्ती)' | 'Other (इतर)';
  amount: number;
  vehicleKm?: number;
  notes?: string;
  createdAt: string;
}

export interface UnifiedCollectionItem {
  id: string;
  sourceType: 'card-scheme' | 'bill-receipt' | 'direct-sale';
  receiptNo: string;
  date: string; // YYYY-MM-DD
  time?: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  village?: string;
  referenceNo?: string; // Card # or Invoice #
  detail: string;
  amount: number;
  paymentMode: 'Cash' | 'Online';
  agentName: string;
  previousBalance?: number;
  remainingBalance?: number;
  weekNumber?: number;
  createdAt: string;
}

interface DailyCollectionRegisterViewProps {
  cardTransactions: CardTransaction[];
  billReceipts?: BillReceiptEntry[];
  transactions?: TransactionEntry[];
  cardMembers?: CardMember[];
  customers?: Customer[];
  staff?: StaffMember[];
  settings: BusinessSettings;
  onOpenCardMember?: (member: CardMember) => void;
  onOpenCustomerLedger?: (customer: Customer) => void;
  isModal?: boolean;
  onClose?: () => void;
}

export const DailyCollectionRegisterView: React.FC<DailyCollectionRegisterViewProps> = ({
  cardTransactions = [],
  billReceipts = [],
  transactions = [],
  cardMembers = [],
  customers = [],
  staff = [],
  settings,
  onOpenCardMember,
  onOpenCustomerLedger,
  isModal = false,
  onClose,
}) => {
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }, []);

  const [selectedDateFilter, setSelectedDateFilter] = useState<'today' | 'yesterday' | 'all' | 'custom'>('today');
  const [customDate, setCustomDate] = useState<string>(todayStr);
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'card-scheme' | 'bill-receipt' | 'direct-sale'>('all');
  const [selectedMode, setSelectedMode] = useState<'all' | 'Cash' | 'Online'>('all');
  const [selectedVillage, setSelectedVillage] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printTemplate, setPrintTemplate] = useState<'day-sheet' | 'handover-slip' | 'thermal'>('day-sheet');
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // Agent route expenses (Fuel, Food/Tea, Travel)
  const [dailyExpenses, setDailyExpenses] = useState<AgentDailyExpense[]>(() => {
    try {
      const saved = localStorage.getItem('shri_sai_agent_daily_expenses');
      return saved ? JSON.parse(saved) : [
        {
          id: 'exp-1',
          date: new Date().toISOString().split('T')[0],
          agentName: 'Bhushan Lidbe',
          category: 'Fuel (पेट्रोल)',
          amount: 250,
          vehicleKm: 35,
          notes: 'आर्वी - रोहणा रूट दुचाकी पेट्रोल',
          createdAt: new Date().toISOString()
        }
      ];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('shri_sai_agent_daily_expenses', JSON.stringify(dailyExpenses));
    } catch (e) {
      console.error(e);
    }
  }, [dailyExpenses]);

  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [expenseCategory, setExpenseCategory] = useState<AgentDailyExpense['category']>('Fuel (पेट्रोल)');
  const [expenseAmount, setExpenseAmount] = useState<number>(200);
  const [expenseAgent, setExpenseAgent] = useState<string>('Bhushan Lidbe');
  const [expenseKm, setExpenseKm] = useState<number>(30);
  const [expenseNotes, setExpenseNotes] = useState<string>('');

  // Map of cardId to member for quick lookup
  const cardMemberMap = useMemo(() => {
    const map = new Map<string, CardMember>();
    cardMembers.forEach((m) => {
      map.set(m.id, m);
      map.set(String(m.cardNumber), m);
    });
    return map;
  }, [cardMembers]);

  // Map of customerId to customer for quick lookup
  const customerMap = useMemo(() => {
    const map = new Map<string, Customer>();
    customers.forEach((c) => {
      map.set(c.id, c);
      if (c.phone) map.set(c.phone.trim(), c);
    });
    return map;
  }, [customers]);

  // List of distinct agents
  const distinctAgents = useMemo(() => {
    const set = new Set<string>();
    ['Shubham Shende', 'Bhushan Lidbe', 'Suraj Pendam', 'Ninad Hole', 'Counter'].forEach((a) => set.add(a));
    staff.forEach((s) => set.add(s.name.trim()));
    cardTransactions.forEach((tx) => tx.agentName && set.add(tx.agentName.trim()));
    billReceipts.forEach((r) => r.agentName && set.add(r.agentName.trim()));
    transactions.forEach((t) => t.agentName && set.add(t.agentName.trim()));
    return Array.from(set).sort();
  }, [staff, cardTransactions, billReceipts, transactions]);

  // Build unified chronological collection records
  const allCollections = useMemo<UnifiedCollectionItem[]>(() => {
    const list: UnifiedCollectionItem[] = [];

    // 1. Card Scheme Transactions (Weekly Installments & Deposits)
    cardTransactions.forEach((tx) => {
      if (tx.type === 'Refund') return; // Exclude refunds from collection
      if (!tx.amount || tx.amount <= 0) return;

      const member = cardMemberMap.get(tx.cardId) || cardMemberMap.get(String(tx.cardNumber));
      const village = tx.village || member?.village || '';
      const timeStr = tx.createdAt ? new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

      list.push({
        id: `card-${tx.id}`,
        sourceType: 'card-scheme',
        receiptNo: tx.receiptNo || `CT-${tx.cardNumber}`,
        date: tx.date,
        time: timeStr,
        customerId: member?.id,
        customerName: tx.customerName || member?.customerName || 'अज्ञात ग्राहक',
        customerPhone: tx.customerPhone || member?.phone || '',
        village: village,
        referenceNo: `Card #${tx.cardNumber}`,
        detail: tx.type === 'WeeklyPayment'
          ? `३०-महिने बचत हप्ता (आठवडा #${tx.weekNumber || 1})`
          : (tx.type === 'Fee' ? 'नोंदणी फी (Registration Fee)' : 'ठेव जमा (Deposit)'),
        amount: tx.amount,
        paymentMode: tx.paymentMode || 'Cash',
        agentName: tx.agentName || 'Counter',
        weekNumber: tx.weekNumber,
        remainingBalance: tx.balanceAfter,
        createdAt: tx.createdAt || tx.date,
      });
    });

    // 2. Bill Receipts (Customer Khata credit bill payments)
    billReceipts.forEach((r) => {
      if (!r.amountPaid || r.amountPaid <= 0) return;
      const cust = customerMap.get(r.customerId);
      const village = r.customerVillage || cust?.village || '';
      const timeStr = r.createdAt ? new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

      list.push({
        id: `bill-${r.id}`,
        sourceType: 'bill-receipt',
        receiptNo: r.receiptNo || `BR-${r.id.slice(-4)}`,
        date: r.date,
        time: timeStr,
        customerId: r.customerId,
        customerName: r.customerName || cust?.name || 'ग्राहक',
        customerPhone: r.customerPhone || cust?.phone || '',
        village: village,
        referenceNo: r.againstInvoiceNo ? `Bill #${r.againstInvoiceNo}` : 'उधारी खाते',
        detail: `उधारी बिल जमा पावती (आधीची बाकी: ₹${(r.previousBalance || 0).toLocaleString()}, शिल्लक: ₹${(r.remainingBalance || 0).toLocaleString()})`,
        amount: r.amountPaid,
        paymentMode: r.paymentMode || 'Cash',
        agentName: r.agentName || 'Counter',
        previousBalance: r.previousBalance,
        remainingBalance: r.remainingBalance,
        createdAt: r.createdAt || r.date,
      });
    });

    // 3. Direct Sales Advances / Paying Now at Bill Generation
    transactions.forEach((t) => {
      if (!t.payingNow || t.payingNow <= 0) return;
      // If payment was made today or entry date
      const timeStr = t.createdAt ? new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
      list.push({
        id: `sale-${t.id}`,
        sourceType: 'direct-sale',
        receiptNo: t.invoiceNo || `INV-${t.id.slice(-4)}`,
        date: t.date,
        time: timeStr,
        customerId: t.customerId,
        customerName: t.customerName || 'थेट ग्राहक',
        customerPhone: t.customerPhone || '',
        village: t.village || '',
        referenceNo: `Invoice #${t.invoiceNo}`,
        detail: `थेट विक्री तत्काळ जमा (वस्तू: ${t.itemDetails || 'इलेक्ट्रॉनिक्स/फर्निचर'})`,
        amount: t.payingNow,
        paymentMode: t.paymentMode || 'Cash',
        agentName: t.agentName || 'Counter',
        remainingBalance: t.dueAmount,
        createdAt: t.createdAt || t.date,
      });
    });

    // Sort latest first
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [cardTransactions, billReceipts, transactions, cardMemberMap, customerMap]);

  // Distinct villages in the collection dataset
  const distinctVillages = useMemo(() => {
    const set = new Set<string>();
    allCollections.forEach((c) => {
      if (c.village && c.village.trim()) {
        set.add(c.village.trim());
      }
    });
    return Array.from(set).sort();
  }, [allCollections]);

  // Active target date
  const targetDate = useMemo(() => {
    if (selectedDateFilter === 'today') return todayStr;
    if (selectedDateFilter === 'yesterday') return yesterdayStr;
    if (selectedDateFilter === 'custom') return customDate;
    return null;
  }, [selectedDateFilter, todayStr, yesterdayStr, customDate]);

  // Filtered collections
  const filteredCollections = useMemo(() => {
    return allCollections.filter((item) => {
      // Date filter
      if (targetDate && item.date !== targetDate) return false;

      // Agent filter
      if (selectedAgent !== 'all') {
        const itemAgent = (item.agentName || '').toLowerCase().trim();
        const filterAgent = selectedAgent.toLowerCase().trim();
        if (!itemAgent.includes(filterAgent) && !filterAgent.includes(itemAgent)) {
          return false;
        }
      }

      // Type filter
      if (selectedType !== 'all' && item.sourceType !== selectedType) return false;

      // Mode filter
      if (selectedMode !== 'all' && item.paymentMode !== selectedMode) return false;

      // Village filter
      if (selectedVillage !== 'all') {
        const v = (item.village || '').toLowerCase().trim();
        if (!v.includes(selectedVillage.toLowerCase().trim())) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = item.customerName.toLowerCase().includes(q);
        const matchPhone = (item.customerPhone || '').includes(q);
        const matchReceipt = (item.receiptNo || '').toLowerCase().includes(q);
        const matchRef = (item.referenceNo || '').toLowerCase().includes(q);
        const matchVillage = (item.village || '').toLowerCase().includes(q);
        const matchAgent = (item.agentName || '').toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchReceipt && !matchRef && !matchVillage && !matchAgent) {
          return false;
        }
      }

      return true;
    });
  }, [allCollections, targetDate, selectedAgent, selectedType, selectedMode, selectedVillage, searchQuery]);

  // Totals calculations
  const totals = useMemo(() => {
    let totalCash = 0;
    let totalOnline = 0;
    let cardCount = 0;
    let billCount = 0;
    let saleCount = 0;

    filteredCollections.forEach((c) => {
      if (c.paymentMode === 'Cash') totalCash += c.amount;
      else totalOnline += c.amount;

      if (c.sourceType === 'card-scheme') cardCount++;
      else if (c.sourceType === 'bill-receipt') billCount++;
      else saleCount++;
    });

    return {
      total: totalCash + totalOnline,
      cash: totalCash,
      online: totalOnline,
      totalCount: filteredCollections.length,
      cardCount,
      billCount,
      saleCount,
    };
  }, [filteredCollections]);

  // Filtered agent expenses for the selected date and agent
  const filteredExpenses = useMemo(() => {
    return dailyExpenses.filter((exp) => {
      if (targetDate && exp.date !== targetDate) return false;
      if (selectedAgent !== 'all' && exp.agentName.trim().toLowerCase() !== selectedAgent.trim().toLowerCase()) return false;
      return true;
    });
  }, [dailyExpenses, targetDate, selectedAgent]);

  const totalExpenseAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  const netCashInHand = useMemo(() => {
    return Math.max(0, totals.cash - totalExpenseAmount);
  }, [totals.cash, totalExpenseAmount]);

  const handleAddExpense = () => {
    if (expenseAmount <= 0) {
      alert('कृपया योग्य रक्कम प्रविष्ट करा.');
      return;
    }
    const newExp: AgentDailyExpense = {
      id: `exp-${Date.now()}`,
      date: targetDate || todayStr,
      agentName: expenseAgent,
      category: expenseCategory,
      amount: expenseAmount,
      vehicleKm: expenseKm,
      notes: expenseNotes,
      createdAt: new Date().toISOString()
    };
    setDailyExpenses((prev) => [newExp, ...prev]);
    setExpenseAmount(200);
    setExpenseNotes('');
    setShowAddExpenseModal(false);
  };

  const handleDeleteExpense = (id: string) => {
    if (confirm('नक्की हा खर्च हटवायचा आहे का?')) {
      setDailyExpenses((prev) => prev.filter((e) => e.id !== id));
    }
  };

  // WhatsApp summary string
  const whatsappSummaryText = useMemo(() => {
    const displayDate = targetDate || 'सर्व तारखा';
    const displayAgent = selectedAgent === 'all' ? 'सर्व एजंट' : selectedAgent;

    let text = `*📋 श्री साई इंटरप्राइजेस - दैनिक वसुली रजिस्टर*\n`;
    text += `📅 तारीख: ${displayDate} | एजंट: ${displayAgent}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `💰 *एकूण वसुली:* ₹${totals.total.toLocaleString('en-IN')}\n`;
    text += `💵 *एकूण रोख वसुली (Gross Cash):* ₹${totals.cash.toLocaleString('en-IN')}\n`;
    if (totalExpenseAmount > 0) {
      text += `⛽ *एजंट पेट्रोल व मार्ग खर्च:* -₹${totalExpenseAmount.toLocaleString('en-IN')}\n`;
      text += `👑 *दुकान गल्ला निव्वळ जमा (Net Cash):* ₹${netCashInHand.toLocaleString('en-IN')}\n`;
    }
    text += `📱 *ऑनलाईन (UPI/Bank):* ₹${totals.online.toLocaleString('en-IN')}\n`;
    text += `🧾 *एकूण पावत्या:* ${totals.totalCount} (बचत कार्ड: ${totals.cardCount}, उधारी: ${totals.billCount})\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    text += `*वसुली यादी (Customer List):*\n`;

    filteredCollections.slice(0, 30).forEach((c, idx) => {
      const modeIcon = c.paymentMode === 'Cash' ? '💵' : '📱';
      text += `${idx + 1}. ${c.customerName} ${c.village ? `(${c.village})` : ''}\n`;
      text += `   ↳ ₹${c.amount.toLocaleString('en-IN')} [${modeIcon} ${c.paymentMode}] | ${c.referenceNo} | पावती #${c.receiptNo}\n`;
    });

    if (filteredCollections.length > 30) {
      text += `\n...आणि इतर ${filteredCollections.length - 30} पावत्या.\n`;
    }

    if (filteredExpenses.length > 0) {
      text += `\n⛽ *मार्ग खर्च तपशील (${filteredExpenses.length}):*\n`;
      filteredExpenses.forEach((exp) => {
        text += `• ${exp.agentName} - ${exp.category}: ₹${exp.amount} (${exp.vehicleKm ? exp.vehicleKm + ' KM' : ''} ${exp.notes || ''})\n`;
      });
    }

    text += `\n📍 आर्वी रोड, पंजाब कॉलनी, वर्धा • मो. 8766486915`;
    return text;
  }, [totals, filteredCollections, targetDate, selectedAgent, filteredExpenses, totalExpenseAmount, netCashInHand]);

  const handleShareWhatsApp = () => {
    const encoded = encodeURIComponent(whatsappSummaryText);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const handleCopySummary = () => {
    navigator.clipboard.writeText(whatsappSummaryText);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 3000);
  };

  const handleTriggerPrint = () => {
    setShowPrintModal(true);
  };

  const handleExecutePrint = () => {
    window.print();
  };

  return (
    <div className={`${isModal ? 'fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-2 sm:p-4 backdrop-blur-xs overflow-y-auto' : 'space-y-4 max-w-7xl mx-auto p-3 sm:p-6'}`}>
      <div className={`${isModal ? 'bg-white dark:bg-slate-900 rounded-2xl w-full max-w-6xl max-h-[95vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden' : 'space-y-4'}`}>
        
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-blue-900/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  <span>दैनिक वसुली रजिस्टर</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                    Daily Collection Log
                  </span>
                </h1>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                कुणाकुणाचे कलेक्शन झाले • बचत कार्ड हप्ते + उधारी बिल वसुली • पावती प्रिंट व कॅश हँडओव्हर
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-stretch sm:self-auto justify-end">
            <button
              onClick={handleShareWhatsApp}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="WhatsApp वर वसुली यादी पाठवा"
            >
              <Share2 className="w-4 h-4" />
              <span>WhatsApp शेअर</span>
            </button>

            <button
              onClick={handleTriggerPrint}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black transition flex items-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>🖨️ कलेक्शन प्रिंट शीट</span>
            </button>

            {isModal && onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
                title="बंद करा"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 space-y-3">
          {/* Top Row: Date Presets & Agent */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Date Pill Buttons */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <button
                onClick={() => setSelectedDateFilter('today')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  selectedDateFilter === 'today'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                आज (Today)
              </button>
              <button
                onClick={() => setSelectedDateFilter('yesterday')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  selectedDateFilter === 'yesterday'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                काल (Yesterday)
              </button>
              <button
                onClick={() => setSelectedDateFilter('custom')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                  selectedDateFilter === 'custom'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                तारीख निवडा
              </button>
              <button
                onClick={() => setSelectedDateFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  selectedDateFilter === 'all'
                    ? 'bg-slate-800 dark:bg-slate-700 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                सर्व तारखा
              </button>
            </div>

            {/* Custom Date Input */}
            {selectedDateFilter === 'custom' && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">तारीख:</span>
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200"
                />
              </div>
            )}

            {/* Agent Selector Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                एजंट:
              </span>
              <select
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200"
              >
                <option value="all">सर्व एजंट (All Agents)</option>
                {distinctAgents.map((ag) => (
                  <option key={ag} value={ag}>
                    👤 {ag}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Bottom Row: Search & Sub-filters */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-1">
            {/* Search Input */}
            <div className="sm:col-span-4 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ग्राहक नाव, फोन, पावती #, कार्ड #, गाव..."
                className="w-full pl-9 pr-8 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Type Filter */}
            <div className="sm:col-span-3">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as any)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                <option value="all">सर्व प्रकार (बचत + उधारी + थेट)</option>
                <option value="card-scheme">💳 ३०-महिने बचत हप्ता (Card Installment)</option>
                <option value="bill-receipt">🧾 उधारी बिल जमा (Customer Khata)</option>
                <option value="direct-sale">🛒 थेट विक्री तत्काळ जमा (Direct Sale)</option>
              </select>
            </div>

            {/* Mode Filter */}
            <div className="sm:col-span-2">
              <select
                value={selectedMode}
                onChange={(e) => setSelectedMode(e.target.value as any)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                <option value="all">सर्व पेमेंट मोड (All Modes)</option>
                <option value="Cash">💵 रोकड (Cash)</option>
                <option value="Online">📱 ऑनलाईन / फोनपे (UPI)</option>
              </select>
            </div>

            {/* Village Filter */}
            <div className="sm:col-span-3">
              <select
                value={selectedVillage}
                onChange={(e) => setSelectedVillage(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                <option value="all">सर्व गावे (All Villages)</option>
                {distinctVillages.map((v) => (
                  <option key={v} value={v}>
                    📍 {v}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Real-Time Collection KPI Summary Bar */}
        <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Total Collected */}
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-400 font-bold">
              <span>एकूण वसुली (Total)</span>
              <Coins className="w-4 h-4" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1 font-mono">
              ₹{totals.total.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">
              {totals.totalCount} पावत्या नोंदी
            </p>
          </div>

          {/* Cash Collection */}
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center justify-between text-xs text-amber-700 dark:text-amber-400 font-bold">
              <span>एकूण जमा रोकड (Gross Cash)</span>
              <span className="text-sm">💵</span>
            </div>
            <p className="text-xl sm:text-2xl font-black text-amber-700 dark:text-amber-300 mt-1 font-mono">
              ₹{totals.cash.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-amber-600/80 dark:text-amber-400/80 mt-0.5">
              {totals.total > 0 ? Math.round((totals.cash / totals.total) * 100) : 0}% रोकड वाटा
            </p>
          </div>

          {/* Online UPI Collection */}
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between text-xs text-blue-700 dark:text-blue-400 font-bold">
              <span>ऑनलाईन (PhonePe / UPI)</span>
              <span className="text-sm">📱</span>
            </div>
            <p className="text-xl sm:text-2xl font-black text-blue-700 dark:text-blue-300 mt-1 font-mono">
              ₹{totals.online.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-blue-600/80 dark:text-blue-400/80 mt-0.5">
              थेट बँक / QR जमा
            </p>
          </div>

          {/* Net Cash Handover after Fuel Expenses */}
          <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-900 to-slate-900 text-white border border-indigo-700/50 shadow-xs">
            <div className="flex items-center justify-between text-xs text-indigo-300 font-bold">
              <span>गल्ला निव्वळ रोकड (Net Cash)</span>
              <Fuel className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-amber-300 mt-1 font-mono">
              ₹{netCashInHand.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-indigo-200 mt-0.5">
              पेट्रोल खर्च (-₹{totalExpenseAmount}) वजा करून
            </p>
          </div>
        </div>

        {/* Agent Route & Fuel Expense Ribbon */}
        <div className="px-3 sm:px-4 py-2.5 bg-amber-500/10 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-900/40 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-black text-amber-800 dark:text-amber-300 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
              <Fuel className="w-4 h-4 text-amber-600" />
              <span>मार्ग पेट्रोल व एजंट दैनंदिन खर्च ({filteredExpenses.length}):</span>
            </span>

            {filteredExpenses.length === 0 ? (
              <span className="text-slate-500 text-[11px] italic">या तारखेला कोणताही खर्च नोंदवलेला नाही.</span>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                {filteredExpenses.map((exp) => (
                  <div
                    key={exp.id}
                    className="inline-flex items-center gap-1.5 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 shadow-2xs text-[11px]"
                  >
                    <span className="font-bold text-slate-900 dark:text-white">{exp.agentName}:</span>
                    <span className="text-slate-600 dark:text-slate-400">{exp.category}</span>
                    <strong className="font-mono text-rose-600 dark:text-rose-400">₹{exp.amount}</strong>
                    {exp.vehicleKm && <span className="text-slate-400 text-[10px]">({exp.vehicleKm} KM)</span>}
                    <button
                      type="button"
                      onClick={() => handleDeleteExpense(exp.id)}
                      className="text-slate-400 hover:text-rose-600 ml-1 cursor-pointer"
                      title="हटवा"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowAddExpenseModal(true)}
            className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1 shadow-xs cursor-pointer transition active:scale-95"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ पेट्रोल/मार्ग खर्च नोंदवा</span>
          </button>
        </div>

        {/* Collection Items Table / Chronological List */}
        <div className="overflow-x-auto flex-1 p-3 sm:p-4">
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 font-bold text-[11px] uppercase tracking-wider">
                  <th className="p-3 w-10 text-center">क्र.</th>
                  <th className="p-3">वेळ व पावती क्र.</th>
                  <th className="p-3">ग्राहक माहिती व गाव</th>
                  <th className="p-3">कलेक्शन प्रकार व संदर्भ</th>
                  <th className="p-3 text-right">रक्कम जमा (₹)</th>
                  <th className="p-3 text-center">पेमेंट मोड</th>
                  <th className="p-3">जमा करणारा एजंट</th>
                  <th className="p-3 text-center">कृती</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {filteredCollections.map((item, idx) => {
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-blue-50/40 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      {/* Sr No */}
                      <td className="p-3 text-center font-mono font-bold text-slate-400">
                        {idx + 1}
                      </td>

                      {/* Time & Receipt No */}
                      <td className="p-3 whitespace-nowrap">
                        <div className="font-mono font-bold text-blue-700 dark:text-blue-400">
                          #{item.receiptNo}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{item.time || item.date}</span>
                        </div>
                      </td>

                      {/* Customer Name, Phone & Village */}
                      <td className="p-3">
                        <div className="font-bold text-slate-900 dark:text-white text-sm">
                          {item.customerName}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {item.customerPhone && (
                            <span className="font-mono flex items-center gap-0.5 text-slate-700 dark:text-slate-300 font-semibold">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {item.customerPhone}
                            </span>
                          )}
                          {item.village && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold flex items-center gap-0.5">
                              <MapPin className="w-2.5 h-2.5" />
                              {item.village}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Type & Reference */}
                      <td className="p-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {item.sourceType === 'card-scheme' ? (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-black text-[10px] uppercase tracking-wider">
                              बचत कार्ड हप्ता
                            </span>
                          ) : item.sourceType === 'bill-receipt' ? (
                            <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-black text-[10px] uppercase tracking-wider">
                              उधारी बिल जमा
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-black text-[10px] uppercase tracking-wider">
                              थेट विक्री जमा
                            </span>
                          )}
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                            {item.referenceNo}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                          {item.detail}
                        </p>
                      </td>

                      {/* Amount Collected */}
                      <td className="p-3 text-right whitespace-nowrap">
                        <div className="font-mono font-black text-base text-emerald-700 dark:text-emerald-400">
                          ₹{item.amount.toLocaleString('en-IN')}
                        </div>
                        {item.remainingBalance !== undefined && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            बाकी: ₹{item.remainingBalance.toLocaleString('en-IN')}
                          </div>
                        )}
                      </td>

                      {/* Payment Mode */}
                      <td className="p-3 text-center whitespace-nowrap">
                        {item.paymentMode === 'Cash' ? (
                          <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold text-[11px] inline-flex items-center gap-1 border border-amber-300 dark:border-amber-700">
                            💵 रोकड
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 font-bold text-[11px] inline-flex items-center gap-1 border border-blue-300 dark:border-blue-700">
                            📱 ऑनलाईन
                          </span>
                        )}
                      </td>

                      {/* Agent Name */}
                      <td className="p-3 whitespace-nowrap">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                          <span>{item.agentName}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              const text = `*श्री साई इंटरप्राइजेस - वसुली पावती*\nपावती #: ${item.receiptNo}\nग्राहक: ${item.customerName}\nरक्कम: ₹${item.amount}\nमोड: ${item.paymentMode}\nतारीख: ${item.date}\nएजंट: ${item.agentName}`;
                              window.open(`https://wa.me/${item.customerPhone ? '91' + item.customerPhone.replace(/[^0-9]/g, '').slice(-10) : ''}?text=${encodeURIComponent(text)}`, '_blank');
                            }}
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 cursor-pointer"
                            title="WhatsApp पावती पाठवा"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>

                          {item.sourceType === 'card-scheme' && onOpenCardMember && (
                            <button
                              onClick={() => {
                                const m = cardMemberMap.get(item.customerId || '') || cardMembers.find((cm) => cm.customerName === item.customerName);
                                if (m) onOpenCardMember(m);
                              }}
                              className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold cursor-pointer"
                              title="कार्ड पासबुक उघडा"
                            >
                              पासबुक
                            </button>
                          )}

                          {item.sourceType === 'bill-receipt' && onOpenCustomerLedger && (
                            <button
                              onClick={() => {
                                const c = customerMap.get(item.customerId || '') || customers.find((cust) => cust.name === item.customerName);
                                if (c) onOpenCustomerLedger(c);
                              }}
                              className="px-2 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-[11px] font-bold cursor-pointer"
                              title="ग्राहक खातेवही उघडा"
                            >
                              खाते
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredCollections.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-slate-400">
                      <ClipboardList className="w-10 h-10 mx-auto text-slate-300 mb-2 opacity-50" />
                      <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
                        निवडलेल्या तारखेला किंवा एजंटसाठी कोणतेही कलेक्शन सापडले नाही.
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        कृपया तारीख किंवा फिल्टर तपासा किंवा वरून नवीन हप्ता/पावती जमा करा.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Summary / Quick Action */}
        <div className="p-3 sm:p-4 bg-slate-100 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-600 dark:text-slate-400 font-medium">
            एकूण <strong className="text-slate-900 dark:text-white">{filteredCollections.length}</strong> ग्राहकांचे कलेक्शन • 
            रोकड: <strong className="text-amber-700 dark:text-amber-300 font-mono">₹{totals.cash.toLocaleString('en-IN')}</strong> • 
            ऑनलाईन: <strong className="text-blue-700 dark:text-blue-300 font-mono">₹{totals.online.toLocaleString('en-IN')}</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition cursor-pointer"
            >
              {copiedSuccess ? '✓ प्रत तयार झाली' : 'कलेक्शन सारांश कॉपी करा'}
            </button>
            <button
              onClick={handleTriggerPrint}
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>प्रिंट शीट तयार करा</span>
            </button>
          </div>
        </div>
      </div>

      {/* PRINT MODAL & PREVIEW */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-black/80 z-60 flex items-center justify-center p-2 sm:p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[95vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden text-slate-900">
            {/* Modal Controls Bar */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between gap-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <Printer className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="text-base font-bold text-white">
                    दैनिक कलेक्शन प्रिंट व हँडओव्हर शीट
                  </h3>
                  <p className="text-xs text-slate-400">
                    A4 फॉरमॅट • एजंट व काऊंटर सहीसह पूर्ण पावती यादी
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Switch between Sheet vs Handover Slip */}
                <div className="flex items-center bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs">
                  <button
                    onClick={() => setPrintTemplate('day-sheet')}
                    className={`px-2.5 py-1 rounded font-bold cursor-pointer ${
                      printTemplate === 'day-sheet' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    संपूर्ण वसुली शीट (Day Sheet)
                  </button>
                  <button
                    onClick={() => setPrintTemplate('handover-slip')}
                    className={`px-2.5 py-1 rounded font-bold cursor-pointer ${
                      printTemplate === 'handover-slip' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    कॅश हँडओव्हर व्हाऊचर
                  </button>
                </div>

                <button
                  onClick={handleExecutePrint}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  प्रिंट करा (Print Now)
                </button>

                <button
                  onClick={() => setShowPrintModal(false)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Preview Area */}
            <div id="printable-daily-collection" className="p-6 sm:p-8 overflow-y-auto flex-1 bg-white print:p-0 print:border-none print:shadow-none">
              {printTemplate === 'day-sheet' ? (
                /* TEMPLATE 1: Comprehensive A4 Collection Day Sheet */
                <div className="max-w-3xl mx-auto space-y-6 text-slate-900 border border-slate-300 p-6 rounded-xl shadow-xs print:border-none print:p-0">
                  {/* Business Header */}
                  <div className="text-center border-b-2 border-slate-900 pb-4">
                    <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">
                      {settings.businessName || 'SHRI SAI ENTERPRISES'}
                    </h2>
                    <p className="text-xs font-bold text-slate-700 mt-0.5">
                      सागवान फर्निचर व ब्रँडेड इलेक्ट्रॉनिक्स अधिकृत शोरूम
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {settings.address || 'मातोश्री सभागृह समोर, आर्वी रोड, पंजाब कॉलनी, वर्धा - ४४२००१'}
                    </p>
                    <p className="text-xs font-mono font-bold text-slate-800 mt-0.5">
                      मोबाईल: {settings.phone || '8766486915, 8600122798'} • GSTIN: {settings.gstin || '27ALOPL0030G2ZC'}
                    </p>
                    <div className="inline-block mt-2 px-4 py-1 bg-slate-900 text-white rounded-full text-xs font-black tracking-widest uppercase">
                      दैनिक एजंट वसुली रजिस्टर / DAILY AGENT COLLECTION REGISTER
                    </div>
                  </div>

                  {/* Metadata Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs border-b border-slate-200 pb-3">
                    <div>
                      <span className="text-slate-500 block">तारीख (Date):</span>
                      <strong className="font-mono text-sm">{targetDate || todayStr}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">एजंट नाव (Agent):</span>
                      <strong className="text-sm">{selectedAgent === 'all' ? 'सर्व एजंट' : selectedAgent}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">एकूण पावत्या (Receipts):</span>
                      <strong className="font-mono text-sm">{filteredCollections.length} नोंदी</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">प्रिंट वेळ (Printed At):</span>
                      <strong className="font-mono text-xs">{new Date().toLocaleString()}</strong>
                    </div>
                  </div>

                  {/* Summary Box */}
                  <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
                    <div>
                      <span className="text-[11px] text-slate-500 font-bold block">एकूण वसुली (Total)</span>
                      <strong className="text-lg font-black text-slate-900 font-mono">
                        ₹{totals.total.toLocaleString('en-IN')}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[11px] text-amber-700 font-bold block">रोकड जमा (Cash in Hand)</span>
                      <strong className="text-lg font-black text-amber-700 font-mono">
                        ₹{totals.cash.toLocaleString('en-IN')}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[11px] text-blue-700 font-bold block">ऑनलाईन (UPI/Bank)</span>
                      <strong className="text-lg font-black text-blue-700 font-mono">
                        ₹{totals.online.toLocaleString('en-IN')}
                      </strong>
                    </div>
                  </div>

                  {/* Tabular Customer Items */}
                  <table className="w-full text-left text-xs border border-slate-300">
                    <thead>
                      <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 font-bold text-[11px]">
                        <th className="p-2 border-r border-slate-300 w-8 text-center">क्र.</th>
                        <th className="p-2 border-r border-slate-300">पावती #</th>
                        <th className="p-2 border-r border-slate-300">ग्राहक नाव व गाव</th>
                        <th className="p-2 border-r border-slate-300">प्रकार / संदर्भ</th>
                        <th className="p-2 border-r border-slate-300 text-right">रक्कम (₹)</th>
                        <th className="p-2 border-r border-slate-300 text-center">मोड</th>
                        <th className="p-2 border-r border-slate-300">एजंट</th>
                        <th className="p-2 text-center w-20">ग्राहक सही</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredCollections.map((item, idx) => (
                        <tr key={item.id}>
                          <td className="p-2 border-r border-slate-200 text-center font-mono">{idx + 1}</td>
                          <td className="p-2 border-r border-slate-200 font-mono font-bold">#{item.receiptNo}</td>
                          <td className="p-2 border-r border-slate-200">
                            <span className="font-bold">{item.customerName}</span>
                            {item.village && <span className="text-[10px] text-slate-500 block">गाव: {item.village}</span>}
                          </td>
                          <td className="p-2 border-r border-slate-200 text-[11px]">
                            <span className="font-mono font-semibold">{item.referenceNo}</span>
                            <span className="text-slate-500 block text-[10px]">
                              {item.sourceType === 'card-scheme' ? 'बचत हप्ता' : 'उधारी पावती'}
                            </span>
                          </td>
                          <td className="p-2 border-r border-slate-200 text-right font-mono font-black">
                            ₹{item.amount.toLocaleString('en-IN')}
                          </td>
                          <td className="p-2 border-r border-slate-200 text-center font-bold text-[11px]">
                            {item.paymentMode === 'Cash' ? 'कॅश' : 'UPI'}
                          </td>
                          <td className="p-2 border-r border-slate-200 text-[11px]">{item.agentName}</td>
                          <td className="p-2 border-slate-200"></td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 font-black border-t-2 border-slate-900 text-slate-900">
                        <td colSpan={4} className="p-2.5 text-right uppercase border-r border-slate-300">
                          एकूण एकूण वसुली (Grand Total):
                        </td>
                        <td className="p-2.5 text-right font-mono text-sm border-r border-slate-300">
                          ₹{totals.total.toLocaleString('en-IN')}
                        </td>
                        <td colSpan={3} className="p-2.5 text-xs text-slate-600">
                          (रोकड: ₹{totals.cash.toLocaleString('en-IN')} | UPI: ₹{totals.online.toLocaleString('en-IN')})
                        </td>
                      </tr>
                    </tfoot>
                  </table>

                  {/* Verification & Handover Signatures */}
                  <div className="pt-8 border-t border-slate-300 grid grid-cols-3 gap-6 text-center text-xs">
                    <div className="space-y-8">
                      <div className="h-10 border-b border-dashed border-slate-400"></div>
                      <p className="font-bold text-slate-800">
                        वसुली एजंट सही<br />
                        <span className="text-[11px] text-slate-500 font-normal">({selectedAgent === 'all' ? 'एजंट प्रतिनिधी' : selectedAgent})</span>
                      </p>
                    </div>

                    <div className="space-y-8">
                      <div className="h-10 border-b border-dashed border-slate-400"></div>
                      <p className="font-bold text-slate-800">
                        काऊंटर कॅश स्वीकारक<br />
                        <span className="text-[11px] text-slate-500 font-normal">(शोरूम कॅशियर)</span>
                      </p>
                    </div>

                    <div className="space-y-8">
                      <div className="h-10 border-b border-dashed border-slate-400"></div>
                      <p className="font-bold text-slate-800">
                        अधिकृत स्वाक्षरी<br />
                        <span className="text-[11px] text-slate-500 font-normal">शुभम शेंडे (संचालक)</span>
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* TEMPLATE 2: Agent Cash Handover Slip */
                <div className="max-w-md mx-auto space-y-4 text-slate-900 border-2 border-slate-800 p-6 rounded-xl shadow-xs">
                  <div className="text-center border-b border-slate-300 pb-3">
                    <h2 className="text-lg font-black uppercase text-slate-900">
                      {settings.businessName || 'SHRI SAI ENTERPRISES'}
                    </h2>
                    <p className="text-[11px] text-slate-600">
                      आर्वी रोड, वर्धा • मो. {settings.phone || '8766486915'}
                    </p>
                    <div className="mt-2 inline-block px-3 py-0.5 bg-amber-500 text-slate-950 font-black text-xs rounded uppercase">
                      एजंट दैनिक कॅश हँडओव्हर व्हाऊचर
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">तारीख व वेळ:</span>
                      <strong className="font-mono">{targetDate || todayStr} ({new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">एजंट नाव:</span>
                      <strong className="text-sm font-bold">{selectedAgent === 'all' ? 'एजंट' : selectedAgent}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">एकूण जमा पावत्या:</span>
                      <strong className="font-mono">{filteredCollections.length} पावत्या</strong>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2 text-xs">
                    <div className="flex justify-between font-semibold">
                      <span>एकूण गोळा झालेली रक्कम:</span>
                      <span className="font-mono font-bold">₹{totals.total.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-blue-700 font-semibold">
                      <span>त्यापैकी ऑनलाईन / QR जमा:</span>
                      <span className="font-mono font-bold">- ₹{totals.online.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-slate-700 font-semibold">
                      <span>एकूण जमा रोकड (Gross Cash):</span>
                      <span className="font-mono font-bold">₹{totals.cash.toLocaleString('en-IN')}</span>
                    </div>
                    {totalExpenseAmount > 0 && (
                      <div className="flex justify-between text-rose-600 font-semibold">
                        <span>वजा: एजंट मार्ग/पेट्रोल खर्च:</span>
                        <span className="font-mono font-bold">- ₹{totalExpenseAmount.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-emerald-800 font-black text-sm pt-1 border-t border-slate-300">
                      <span>काऊंटरवर प्रत्यक्ष जमा केलेली निव्वळ रोकड (Net Cash):</span>
                      <span className="font-mono text-base font-black text-emerald-700">₹{netCashInHand.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-300 grid grid-cols-2 gap-4 text-center text-xs">
                    <div className="space-y-6">
                      <div className="h-8 border-b border-dashed border-slate-400"></div>
                      <p className="font-bold text-slate-800">कॅश जमा करणारा एजंट</p>
                    </div>
                    <div className="space-y-6">
                      <div className="h-8 border-b border-dashed border-slate-400"></div>
                      <p className="font-bold text-slate-800">कॅश स्वीकारक (काऊंटर)</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADD AGENT ROUTE / PETROL EXPENSE MODAL */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 bg-black/75 z-60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 w-full max-w-md border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-slate-900 dark:text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Fuel className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">एजंट पेट्रोल व मार्ग खर्च नोंदवा</h3>
                  <p className="text-[11px] text-slate-500">कलेक्शन गल्ल्यातून झालेला प्रत्यक्ष खर्च</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddExpenseModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  एजंट निवडा:
                </label>
                <select
                  value={expenseAgent}
                  onChange={(e) => setExpenseAgent(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                >
                  {distinctAgents.filter(a => a !== 'Counter').map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    खर्चाचा प्रकार:
                  </label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold text-xs"
                  >
                    <option value="Fuel (पेट्रोल)">⛽ Fuel (पेट्रोल)</option>
                    <option value="Food/Tea (नाश्ता/चहा)">☕ Food/Tea (नाश्ता/चहा)</option>
                    <option value="Vehicle Maintenance (दुरुस्ती)">🔧 Maintenance (दुरुस्ती)</option>
                    <option value="Other (इतर)">📦 Other (इतर)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    खर्च रक्कम (₹):
                  </label>
                  <input
                    type="number"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  गाडी धाव अंतर (किलोमीटर - ऐच्छिक):
                </label>
                <input
                  type="number"
                  value={expenseKm}
                  onChange={(e) => setExpenseKm(Number(e.target.value))}
                  placeholder="उदा. 40 KM"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  तपशील / रूट टिपणी:
                </label>
                <input
                  type="text"
                  value={expenseNotes}
                  onChange={(e) => setExpenseNotes(e.target.value)}
                  placeholder="उदा. वर्धा ते देवळी रूट, बाईक पेट्रोल"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddExpenseModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                रद्द करा
              </button>
              <button
                type="button"
                onClick={handleAddExpense}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition"
              >
                खर्च जतन करा (+ Save Expense)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
