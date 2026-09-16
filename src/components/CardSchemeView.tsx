import React, { useState, useMemo, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Share2,
  Printer,
  Calendar,
  Phone,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  FileSpreadsheet,
  Download,
  X,
  Filter,
  UserCheck,
  MapPin,
  FileText,
  User,
  ShieldCheck,
  RotateCcw,
  Check,
  Tag,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import {
  CardMember,
  CardSchemeConfig,
  CardSchemeId,
  CardTransaction,
  BusinessSettings,
  StaffMember
} from '../types';
import { SCHEMES_CONFIG } from '../utils/storage';
import { CardPassbookModal } from './CardPassbookModal';
import { exportSchemeCardsToCsv, exportReceiptsToCsv } from '../utils/csvExporter';

interface CardSchemeViewProps {
  cardMembers?: CardMember[];
  cardTransactions?: CardTransaction[];
  members?: CardMember[];
  transactions?: CardTransaction[];
  settings: BusinessSettings;
  staff?: StaffMember[];
  onAddMember: (member: Omit<CardMember, 'id'>) => void;
  onRecordTransaction: (tx: Omit<CardTransaction, 'id' | 'createdAt'>) => void;
  onUpdateMember?: (member: CardMember) => void;
  onDeleteMember?: (memberId: string) => void;
  onUpdateTransaction?: (tx: CardTransaction) => void;
  onDeleteTransaction?: (txId: string) => void;
  onNavigateCsv?: () => void;
  salesBills?: any;
  initialAction?: 'payment' | 'add-card' | null;
  onClearInitialAction?: () => void;
}

export const CardSchemeView: React.FC<CardSchemeViewProps> = ({
  cardMembers: propsCardMembers,
  cardTransactions: propsCardTransactions,
  members: legacyMembers,
  transactions: legacyTransactions,
  settings,
  staff = [],
  onAddMember,
  onRecordTransaction,
  onUpdateMember,
  onDeleteMember,
  onUpdateTransaction,
  onDeleteTransaction,
  onNavigateCsv,
  salesBills = [],
  initialAction,
  onClearInitialAction,
}) => {
  // Safe resolution of data arrays to prevent any undefined error
  const members = useMemo(
    () => propsCardMembers || legacyMembers || [],
    [propsCardMembers, legacyMembers]
  );
  const transactions = useMemo(
    () => propsCardTransactions || legacyTransactions || [],
    [propsCardTransactions, legacyTransactions]
  );

  // Agent Session State (remembers agent in localStorage so they feed it once and stay on this page)
  const [activeAgent, setActiveAgent] = useState<string>(() => {
    return localStorage.getItem('active_card_agent') || 'Rahul Sharma';
  });
  const [showAgentPicker, setShowAgentPicker] = useState(false);
  const [customAgentInput, setCustomAgentInput] = useState('');

  // Flash action notification banner
  const [lastActionMessage, setLastActionMessage] = useState<{
    title: string;
    text: string;
    card?: CardMember;
  } | null>(null);

  // Filters
  const [selectedSchemeFilter, setSelectedSchemeFilter] = useState<string>('all');
  const [selectedVillageFilter, setSelectedVillageFilter] = useState<string>('all');
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedMemberForPassbook, setSelectedMemberForPassbook] = useState<CardMember | null>(null);

  // Trigger quick modal actions from top shortcut buttons
  useEffect(() => {
    if (initialAction === 'payment') {
      setShowPaymentModal(true);
      onClearInitialAction?.();
    } else if (initialAction === 'add-card') {
      setShowAddCardModal(true);
      onClearInitialAction?.();
    }
  }, [initialAction, onClearInitialAction]);

  // New Card Form state
  const [newCardScheme, setNewCardScheme] = useState<CardSchemeId>('scheme1');
  const [newCardNumber, setNewCardNumber] = useState<number>(1005);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newVillage, setNewVillage] = useState('Bori');
  const [newCustomVillage, setNewCustomVillage] = useState('');
  const [newSheetNo, setNewSheetNo] = useState('');
  const [newUniqueId, setNewUniqueId] = useState(`SAI-SCH1-1005`);
  const [newAgentName, setNewAgentName] = useState(activeAgent);
  const [newInitialDeposit, setNewInitialDeposit] = useState<number>(0);
  const [newCardError, setNewCardError] = useState('');

  // Payment Form state
  const [paymentCardSearch, setPaymentCardSearch] = useState('');
  const [paymentSelectedCard, setPaymentSelectedCard] = useState<CardMember | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(500);
  const [paymentWeekNo, setPaymentWeekNo] = useState<number>(1);
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'Online'>('Cash');
  const [paymentAgentName, setPaymentAgentName] = useState(activeAgent);
  const [paymentRemarks, setPaymentRemarks] = useState('');
  const [paymentReceiptNo, setPaymentReceiptNo] = useState('');
  const [sendWhatsAppOnPayment, setSendWhatsAppOnPayment] = useState(true);

  // Refund Form state
  const [refundCardSearch, setRefundCardSearch] = useState('');
  const [refundSelectedCard, setRefundSelectedCard] = useState<CardMember | null>(null);
  const [refundAmount, setRefundAmount] = useState<number>(1000);
  const [refundMode, setRefundMode] = useState<'Cash' | 'Online'>('Cash');
  const [refundAgentName, setRefundAgentName] = useState(activeAgent);
  const [refundRemarks, setRefundRemarks] = useState('Partial refund / return to customer');

  // Dedicated Member Edit Modal state
  const [editingMember, setEditingMember] = useState<CardMember | null>(null);

  // Weekly Collection Inline Member Edit state
  const [paymentEditCustomerName, setPaymentEditCustomerName] = useState('');
  const [paymentEditPhone, setPaymentEditPhone] = useState('');
  const [paymentEditVillage, setPaymentEditVillage] = useState('');
  const [paymentEditSheetNo, setPaymentEditSheetNo] = useState('');
  const [showInlineMemberEdit, setShowInlineMemberEdit] = useState(false);

  // Synchronize inline member fields whenever paymentSelectedCard changes
  useEffect(() => {
    if (paymentSelectedCard) {
      setPaymentEditCustomerName(paymentSelectedCard.customerName || '');
      setPaymentEditPhone(paymentSelectedCard.phone || '');
      setPaymentEditVillage(paymentSelectedCard.village || '');
      setPaymentEditSheetNo(paymentSelectedCard.sheetNo || '');
      setPaymentReceiptNo(`REC-${paymentSelectedCard.cardNumber}-${Date.now().toString().slice(-4)}`);
      if (!paymentSelectedCard.phone || !paymentSelectedCard.village) {
        setShowInlineMemberEdit(true);
      } else {
        setShowInlineMemberEdit(false);
      }
    }
  }, [paymentSelectedCard]);

  // Keep newAgentName, paymentAgentName, refundAgentName in sync with activeAgent
  useEffect(() => {
    setNewAgentName(activeAgent);
    setPaymentAgentName(activeAgent);
    setRefundAgentName(activeAgent);
    localStorage.setItem('active_card_agent', activeAgent);
  }, [activeAgent]);

  // Update Unique ID when scheme or card number changes
  useEffect(() => {
    const code = newCardScheme === 'scheme1' ? 'SCH1' : newCardScheme === 'scheme2' ? 'SCH2' : 'SCH3';
    setNewUniqueId(`SAI-${code}-${newCardNumber}`);
  }, [newCardScheme, newCardNumber]);

  // Overall Scheme Totals
  const totalCards = members.length;
  const totalSchemeDeposits = members.reduce((acc, m) => acc + (m.totalDeposited || 0), 0);
  const totalSchemeRefunds = members.reduce((acc, m) => acc + (m.totalRefunded || 0), 0);
  const totalNetSchemeBalance = totalSchemeDeposits - totalSchemeRefunds;
  const totalFeeCollected = members.filter((m) => m.registrationFeePaid).length * 50;

  // List of distinct villages
  const villageList = useMemo(() => {
    const vList = members
      .map((m) => m.village?.trim())
      .filter((v): v is string => Boolean(v && v.length > 0));
    const defaults = ['Bori', 'Hingni', 'Devnagar', 'Kelhzar', 'Vayfad', 'Khadki'];
    return Array.from(new Set([...defaults, ...vList])).sort();
  }, [members]);

  // List of distinct agents
  const agentList = useMemo(() => {
    const fromMembers = members
      .map((m) => m.agentName?.trim())
      .filter((a): a is string => Boolean(a && a.length > 0));
    const fromStaff = staff.map((s) => s.name.trim());
    const defaults = ['Rahul Sharma', 'Sachin Deshmukh', 'Pooja Patil'];
    return Array.from(new Set([...defaults, ...fromStaff, ...fromMembers])).sort();
  }, [members, staff]);

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const matchesScheme =
        selectedSchemeFilter === 'all' || m.schemeId === selectedSchemeFilter;
      const matchesVillage =
        selectedVillageFilter === 'all' || m.village === selectedVillageFilter;
      const matchesAgent =
        selectedAgentFilter === 'all' || m.agentName === selectedAgentFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        m.cardNumber.toString().includes(q) ||
        m.customerName.toLowerCase().includes(q) ||
        (m.phone && m.phone.toLowerCase().includes(q)) ||
        (m.village && m.village.toLowerCase().includes(q)) ||
        (m.sheetNo && m.sheetNo.toLowerCase().includes(q)) ||
        (m.uniqueId && m.uniqueId.toLowerCase().includes(q)) ||
        (m.agentName && m.agentName.toLowerCase().includes(q));
      return matchesScheme && matchesVillage && matchesAgent && matchesSearch;
    });
  }, [members, selectedSchemeFilter, selectedVillageFilter, selectedAgentFilter, searchQuery]);

  // Pagination for smooth rendering with 1000+ members
  const [currentPage, setCurrentPage] = useState(1);
  const [showAllMembers, setShowAllMembers] = useState(false);
  const MEMBERS_PAGE_SIZE = 50;

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSchemeFilter, selectedVillageFilter, selectedAgentFilter, searchQuery]);

  const totalPages = Math.ceil(filteredMembers.length / MEMBERS_PAGE_SIZE) || 1;
  const paginatedMembers = useMemo(() => {
    if (showAllMembers) return filteredMembers;
    const start = (currentPage - 1) * MEMBERS_PAGE_SIZE;
    return filteredMembers.slice(start, start + MEMBERS_PAGE_SIZE);
  }, [filteredMembers, showAllMembers, currentPage]);

  // Handle New Card Submit
  const handleCreateCard = (e: React.FormEvent) => {
    e.preventDefault();
    setNewCardError('');

    const config = SCHEMES_CONFIG.find((s) => s.id === newCardScheme);
    if (!config) return;

    if (newCardNumber < config.startCardNo || newCardNumber > config.endCardNo) {
      setNewCardError(
        `Card number for ${config.name} must be between ${config.startCardNo} and ${config.endCardNo}`
      );
      return;
    }

    // Check if card number already exists in this scheme
    const exists = members.some(
      (m) => m.schemeId === newCardScheme && m.cardNumber === newCardNumber
    );
    if (exists) {
      setNewCardError(
        `Card #${newCardNumber} is already registered in ${config.name}. Please select another card number.`
      );
      return;
    }

    const joiningDate = new Date().toISOString().split('T')[0];
    const finalVillage = newVillage === 'other' ? newCustomVillage.trim() : newVillage.trim();
    const finalAgent = newAgentName.trim() || activeAgent;
    const finalUniqueId = newUniqueId.trim() || `SAI-${newCardScheme.toUpperCase()}-${newCardNumber}`;

    // Add Member
    onAddMember({
      cardNumber: newCardNumber,
      uniqueId: finalUniqueId,
      schemeId: newCardScheme,
      schemeName: config.name,
      customerName: newCustomerName.trim(),
      phone: newPhone.trim(),
      village: finalVillage || undefined,
      sheetNo: newSheetNo.trim() || undefined,
      agentName: finalAgent,
      openingAmt: newInitialDeposit || undefined,
      address: finalVillage ? `${finalVillage}, Wardha` : 'Wardha',
      joiningDate,
      registrationFee: 50,
      registrationFeePaid: true,
      totalDeposited: newInitialDeposit,
      totalRefunded: 0,
      netBalance: newInitialDeposit,
      status: 'Active',
      notes: `Card opened by Agent ${finalAgent} with ₹50 fee.${newInitialDeposit > 0 ? ` Initial deposit: ₹${newInitialDeposit}` : ''}${newSheetNo ? ` • Sheet #${newSheetNo}` : ''}${finalVillage ? ` • Village: ${finalVillage}` : ''}`,
    });

    // Record fee transaction
    onRecordTransaction({
      cardId: `cm-${Date.now()}`,
      cardNumber: newCardNumber,
      schemeId: newCardScheme,
      customerName: newCustomerName.trim(),
      customerPhone: newPhone.trim(),
      receiptNo: `FEE-${newCardNumber}`,
      date: joiningDate,
      type: 'Fee',
      amount: 50,
      paymentMode: 'Cash',
      agentName: finalAgent,
      remarks: `Card Opening / Registration Fee (₹50 Fixed) collected by ${finalAgent}`,
      balanceAfter: 0,
    });

    // If initial deposit was made
    if (newInitialDeposit > 0) {
      onRecordTransaction({
        cardId: `cm-${Date.now()}`,
        cardNumber: newCardNumber,
        schemeId: newCardScheme,
        customerName: newCustomerName.trim(),
        customerPhone: newPhone.trim(),
        receiptNo: `REC-${newCardNumber}-W1`,
        date: joiningDate,
        type: 'WeeklyPayment',
        weekNumber: 1,
        amount: newInitialDeposit,
        paymentMode: 'Cash',
        agentName: finalAgent,
        remarks: `Week 1 Deposit upon Card Registration by ${finalAgent}`,
        balanceAfter: newInitialDeposit,
      });
    }

    // Success flash notification
    setLastActionMessage({
      title: `Card #${newCardNumber} Issued Successfully!`,
      text: `Customer: ${newCustomerName.trim()} | Village: ${finalVillage} | Sheet: ${newSheetNo} | Agent: ${finalAgent} | Fee: ₹50 Paid.`,
    });

    // Reset Form for next fast entry, stay on same page
    setNewCustomerName('');
    setNewPhone('');
    setNewSheetNo('');
    setNewCustomVillage('');
    setNewInitialDeposit(0);
    setNewCardNumber((prev) => prev + 1);
    setShowAddCardModal(false);
  };

  // Handle Weekly Payment Submit
  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentSelectedCard || paymentAmount <= 0) return;

    // Check if customer details were updated in the inline editor
    let activeCard = paymentSelectedCard;
    const isInfoChanged =
      (paymentEditCustomerName.trim() && paymentEditCustomerName.trim() !== (paymentSelectedCard.customerName || '').trim()) ||
      paymentEditPhone.trim() !== (paymentSelectedCard.phone || '').trim() ||
      paymentEditVillage.trim() !== (paymentSelectedCard.village || '').trim() ||
      paymentEditSheetNo.trim() !== (paymentSelectedCard.sheetNo || '').trim();

    if (onUpdateMember && isInfoChanged) {
      activeCard = {
        ...paymentSelectedCard,
        customerName: paymentEditCustomerName.trim() || paymentSelectedCard.customerName,
        phone: paymentEditPhone.trim(),
        village: paymentEditVillage.trim(),
        sheetNo: paymentEditSheetNo.trim(),
      };
      onUpdateMember(activeCard);
    }

    const receiptNo = paymentReceiptNo.trim() || `REC-${activeCard.cardNumber}-${Date.now().toString().slice(-4)}`;
    const newBalance = (activeCard.netBalance || 0) + paymentAmount;
    const date = new Date().toISOString().split('T')[0];
    const finalAgent = paymentAgentName.trim() || activeAgent;

    onRecordTransaction({
      cardId: activeCard.id,
      cardNumber: activeCard.cardNumber,
      schemeId: activeCard.schemeId,
      customerName: activeCard.customerName,
      customerPhone: activeCard.phone,
      receiptNo,
      date,
      type: 'WeeklyPayment',
      weekNumber: paymentWeekNo,
      amount: paymentAmount,
      paymentMode,
      agentName: finalAgent,
      remarks: paymentRemarks || `Week ${paymentWeekNo} Installment collected by ${finalAgent}`,
      balanceAfter: newBalance,
    });

    // Auto-send WhatsApp receipt if customer has mobile number
    if (sendWhatsAppOnPayment && activeCard.phone && activeCard.phone.trim().length >= 10) {
      const cleanPhone = activeCard.phone.replace(/[^0-9]/g, '');
      const waMessage = encodeURIComponent(
        `*${settings.businessName || 'SHRI SAI ENTERPRISES'}*\n` +
        `*साप्ताहिक बचत पावती (Weekly Payment Receipt)*\n` +
        `--------------------------------\n` +
        `पावती क्र.: *${receiptNo}*\n` +
        `तारीख: ${date}\n` +
        `कार्ड क्र.: *#${activeCard.cardNumber}* (${activeCard.schemeName})\n` +
        `नाव: *${activeCard.customerName}*\n` +
        `जमा रक्कम: *₹${(Number(paymentAmount) || 0).toLocaleString()}* (Week ${paymentWeekNo})\n` +
        `पेमेंट मोड: ${paymentMode} | एजंट: ${finalAgent}\n` +
        `खात्यात एकूण शिल्लक जमा: *₹${(Number(newBalance) || 0).toLocaleString()}*\n` +
        `--------------------------------\n` +
        `धन्यवाद! - श्री साई इंटरप्राइजेस, वर्धा\n` +
        `📞 संपर्क: ${settings.phone || '8766486915'}`
      );
      window.open(`https://wa.me/91${cleanPhone}?text=${waMessage}`, '_blank');
    }

    // Success flash notification
    setLastActionMessage({
      title: `₹${(Number(paymentAmount) || 0).toLocaleString()} Weekly Payment Deposited!`,
      text: `Card #${activeCard.cardNumber} (${activeCard.customerName}) | New Balance: ₹${(Number(newBalance) || 0).toLocaleString()} | Agent: ${finalAgent}${isInfoChanged ? ' (माहिती अपडेट झाली)' : ''}`,
      card: { ...activeCard, netBalance: newBalance },
    });

    // Reset Form, stay on this page
    setShowPaymentModal(false);
    setPaymentRemarks('');
    setPaymentCardSearch('');
    setPaymentSelectedCard(null);
  };

  // Handle Refund Submit
  const handleRefundSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundSelectedCard || refundAmount <= 0) return;

    if (refundAmount > refundSelectedCard.netBalance) {
      alert(
        `Refund amount (₹${refundAmount}) cannot exceed current card balance (₹${refundSelectedCard.netBalance})!`
      );
      return;
    }

    const receiptNo = `REF-${refundSelectedCard.cardNumber}-${Date.now().toString().slice(-4)}`;
    const newBalance = refundSelectedCard.netBalance - refundAmount;
    const date = new Date().toISOString().split('T')[0];
    const finalAgent = refundAgentName.trim() || activeAgent;

    onRecordTransaction({
      cardId: refundSelectedCard.id,
      cardNumber: refundSelectedCard.cardNumber,
      schemeId: refundSelectedCard.schemeId,
      customerName: refundSelectedCard.customerName,
      customerPhone: refundSelectedCard.phone,
      receiptNo,
      date,
      type: 'Refund',
      amount: refundAmount,
      paymentMode: refundMode,
      agentName: finalAgent,
      remarks: refundRemarks || `Refund / partial withdrawal processed by ${finalAgent}`,
      balanceAfter: newBalance,
    });

    // Success flash notification
    setLastActionMessage({
      title: `₹${(Number(refundAmount) || 0).toLocaleString()} Refund Processed!`,
      text: `Card #${refundSelectedCard.cardNumber} (${refundSelectedCard.customerName}) | Remaining Balance: ₹${(Number(newBalance) || 0).toLocaleString()} | Agent: ${finalAgent}`,
      card: { ...refundSelectedCard, netBalance: newBalance },
    });

    // Reset Form, stay on this page
    setShowRefundModal(false);
    setRefundCardSearch('');
    setRefundSelectedCard(null);
  };

  // WhatsApp share for member
  const handleShareWhatsApp = (member: CardMember) => {
    const text = encodeURIComponent(
      `*${settings.businessName}*\n` +
      `*Card Scheme Account Passbook*\n` +
      `--------------------------------\n` +
      `Card No: *#${member.cardNumber}* (${member.schemeName})\n` +
      `Member: *${member.customerName}*\n` +
      (member.uniqueId ? `Unique ID: ${member.uniqueId}\n` : '') +
      (member.village ? `Village: ${member.village}\n` : '') +
      (member.sheetNo ? `Sheet No: ${member.sheetNo}\n` : '') +
      (member.agentName ? `Agent: ${member.agentName}\n` : '') +
      `Card Fee: ₹50 (Paid)\n` +
      `--------------------------------\n` +
      `Total Deposited: ₹${(member.totalDeposited ?? 0).toLocaleString()}\n` +
      `Total Refunded/Withdrawn: ₹${(member.totalRefunded ?? 0).toLocaleString()}\n` +
      `*Current Net Balance: ₹${(member.netBalance ?? 0).toLocaleString()}*\n` +
      `--------------------------------\n` +
      `Date: ${new Date().toISOString().split('T')[0]}\n` +
      `Visit: ${settings.domainName}`
    );
    const phone = member.phone ? member.phone.replace(/[^0-9]/g, '') : '';
    const url = phone ? `https://wa.me/91${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Weekly Card Scheme Management (कार्ड योजना)
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-xs">
              3 Active Schemes
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Weekly installments (₹100/200/500/1000), card opening fee ₹50, customer refunds, and dedicated Agent Counter Mode.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Download CSV for Schemes / Receipts */}
          <button
            onClick={() => exportSchemeCardsToCsv(filteredMembers, selectedSchemeFilter === 'all' ? 'All_Schemes' : selectedSchemeFilter, selectedSchemeFilter)}
            className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="Download Scheme CSV"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Download CSV (कार्ड डेटा)</span>
          </button>

          {transactions.length > 0 && (
            <button
              onClick={() => exportReceiptsToCsv(transactions, 'ShriSai_Scheme_Receipts')}
              className="px-3.5 py-2 rounded-xl bg-purple-50 border border-purple-300 text-purple-800 text-xs font-bold hover:bg-purple-100 transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="Download Receipts CSV"
            >
              <Download className="w-4 h-4 text-purple-600" />
              <span>Download Receipts (पावत्या CSV)</span>
            </button>
          )}

          {onNavigateCsv && (
            <button
              onClick={onNavigateCsv}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              CSV Import
            </button>
          )}

          <button
            onClick={() => {
              setRefundSelectedCard(null);
              setRefundCardSearch('');
              setShowRefundModal(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold hover:bg-rose-100 transition flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowDownLeft className="w-4 h-4" />
            ↩️ Refund / Return
          </button>

          <button
            onClick={() => {
              setPaymentSelectedCard(null);
              setPaymentCardSearch('');
              setShowPaymentModal(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <ArrowUpRight className="w-4 h-4" />
            ⚡ Weekly Collection
          </button>

          <button
            onClick={() => {
              setNewCustomerName('');
              setNewCardError('');
              setShowAddCardModal(true);
            }}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-blue-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            ➕ Issue New Card
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* AGENT QUICK ACTION & SESSION BAR (एजेंट काउंटर मोड) */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 rounded-2xl p-4 sm:p-5 text-white shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-300">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold tracking-wider uppercase text-blue-300">
                  Agent Collection Counter (एजेंट काउंटर मोड)
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Active Session
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-sm font-bold text-white">
                  Current Agent: <span className="text-amber-300 underline font-extrabold">{activeAgent}</span>
                </span>
                <button
                  onClick={() => setShowAgentPicker(!showAgentPicker)}
                  className="px-2 py-0.5 rounded text-[11px] bg-white/10 hover:bg-white/20 text-blue-200 transition cursor-pointer"
                >
                  {showAgentPicker ? 'Close' : 'Change Agent ✎'}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Counter Shortcuts */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                setNewAgentName(activeAgent);
                setShowAddCardModal(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-white text-slate-900 text-xs font-bold hover:bg-slate-100 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-blue-600" />
              New Card
            </button>
            <button
              onClick={() => {
                setPaymentAgentName(activeAgent);
                setShowPaymentModal(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              Collect Weekly
            </button>
            <button
              onClick={() => {
                setRefundAgentName(activeAgent);
                setShowRefundModal(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              Refund
            </button>
          </div>
        </div>

        {/* Change Agent Popdown */}
        {showAgentPicker && (
          <div className="pt-3 border-t border-blue-800/60 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-blue-200 mb-1">
                Select Agent from Registered Staff / Agents:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {agentList.map((agent) => (
                  <button
                    key={agent}
                    type="button"
                    onClick={() => {
                      setActiveAgent(agent);
                      setShowAgentPicker(false);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition ${
                      activeAgent === agent
                        ? 'bg-amber-400 text-slate-950 font-bold'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {agent}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-blue-200 mb-1">
                Or Type New Agent Name:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customAgentInput}
                  onChange={(e) => setCustomAgentInput(e.target.value)}
                  placeholder="e.g. Nilesh Deshmukh"
                  className="px-3 py-1.5 bg-white/10 border border-blue-400/40 rounded-lg text-xs text-white placeholder-blue-300/50 w-full"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customAgentInput.trim()) {
                      setActiveAgent(customAgentInput.trim());
                      setCustomAgentInput('');
                      setShowAgentPicker(false);
                    }
                  }}
                  className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold rounded-lg shrink-0 cursor-pointer"
                >
                  Save Agent
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Instant Action Success Banner (Vaps aaye usi page pe feedback) */}
      {lastActionMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start justify-between gap-3 text-emerald-900 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm">{lastActionMessage.title}</h4>
              <p className="text-xs text-emerald-700 mt-0.5">{lastActionMessage.text}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {lastActionMessage.card && (
              <button
                onClick={() => handleShareWhatsApp(lastActionMessage.card!)}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer"
              >
                <Share2 className="w-3 h-3" />
                WhatsApp Receipt
              </button>
            )}
            <button
              onClick={() => setLastActionMessage(null)}
              className="text-emerald-500 hover:text-emerald-800 font-bold p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* KPI Stats Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Issued Cards</span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <CreditCard className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{totalCards}</p>
          <p className="text-[11px] text-slate-400 mt-1">₹{(totalFeeCollected ?? 0).toLocaleString()} Fee Collected</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Deposited</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-2">₹{(totalSchemeDeposits ?? 0).toLocaleString()}</p>
          <p className="text-[11px] text-emerald-700/80 mt-1">Weekly installments</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Refunded / Returned</span>
            <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <ArrowDownLeft className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-bold text-rose-600 mt-2">₹{(totalSchemeRefunds ?? 0).toLocaleString()}</p>
          <p className="text-[11px] text-rose-700/80 mt-1">Paid back to members</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Net Balance in Hand</span>
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Sparkles className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-bold text-indigo-600 mt-2">₹{(totalNetSchemeBalance ?? 0).toLocaleString()}</p>
          <p className="text-[11px] text-indigo-700/80 mt-1">Held customer deposits</p>
        </div>
      </div>

      {/* Scheme Ranges Reference Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {SCHEMES_CONFIG.map((sc) => {
          const count = members.filter((m) => m.schemeId === sc.id).length;
          const isSelected = selectedSchemeFilter === sc.id;

          return (
            <div
              key={sc.id}
              onClick={() => setSelectedSchemeFilter(isSelected ? 'all' : sc.id)}
              className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                isSelected
                  ? 'border-blue-500 bg-blue-50/50 shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-slate-900">{sc.name}</span>
                  <span className="text-[10px] font-mono text-slate-500">({sc.code})</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Card Range: <strong className="font-mono font-bold text-slate-700">{sc.startCardNo}</strong> to{' '}
                  <strong className="font-mono font-bold text-slate-700">{sc.endCardNo}</strong>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 rounded-lg bg-slate-100 font-mono font-bold text-xs text-slate-800">
                  {count} Cards
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    exportSchemeCardsToCsv(members, sc.name, sc.id);
                  }}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-700 transition cursor-pointer"
                  title={`Download ${sc.name} CSV`}
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Universal Search */}
          <div className="sm:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Card # (e.g. 4107), Customer, Village, Sheet #, Agent..."
              className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm sm:text-xs bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-blue-500"
            />
          </div>

          {/* Scheme Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedSchemeFilter}
              onChange={(e) => setSelectedSchemeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
            >
              <option value="all">All Schemes (सभी योजनाएं)</option>
              {SCHEMES_CONFIG.map((sc) => (
                <option key={sc.id} value={sc.id}>
                  {sc.name} ({sc.startCardNo}-{sc.endCardNo})
                </option>
              ))}
            </select>
          </div>

          {/* Village Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedVillageFilter}
              onChange={(e) => setSelectedVillageFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
            >
              <option value="all">All Villages (सभी गांव)</option>
              {villageList.map((v) => (
                <option key={v} value={v}>
                  📍 {v}
                </option>
              ))}
            </select>
          </div>

          {/* Agent Filter */}
          <div className="sm:col-span-2">
            <select
              value={selectedAgentFilter}
              onChange={(e) => setSelectedAgentFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
            >
              <option value="all">All Agents (सभी एजेंट)</option>
              {agentList.map((a) => (
                <option key={a} value={a}>
                  👤 {a}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Filter Status Bar */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span>
              Showing <strong className="text-slate-900 dark:text-white">{filteredMembers.length}</strong> of <strong className="text-slate-900 dark:text-white">{members.length}</strong> card members
            </span>
            {(selectedSchemeFilter !== 'all' || selectedVillageFilter !== 'all' || selectedAgentFilter !== 'all' || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedSchemeFilter('all');
                  setSelectedVillageFilter('all');
                  setSelectedAgentFilter('all');
                  setSearchQuery('');
                }}
                className="text-blue-600 dark:text-blue-400 underline font-semibold text-[11px] cursor-pointer"
              >
                Clear all filters
              </button>
            )}
          </div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            Current Agent in Session: <strong className="text-slate-700 dark:text-slate-300">{activeAgent}</strong>
          </span>
        </div>
      </div>

      {/* Card Members Table */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm sm:text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700 text-xs sm:text-[11px]">
              <tr>
                <th className="py-3 px-4">Card # / Scheme</th>
                <th className="py-3 px-4">Customer Name & Phone</th>
                <th className="py-3 px-4">Village / Sheet #</th>
                <th className="py-3 px-4">Agent / Unique ID</th>
                <th className="py-3 px-4 text-center">Fee Status</th>
                <th className="py-3 px-4 text-right">Deposited</th>
                <th className="py-3 px-4 text-right">Refunded</th>
                <th className="py-3 px-4 text-right">Net Balance</th>
                <th className="py-3 px-4 text-center">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedMembers.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-750 transition">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-mono font-bold text-sm sm:text-xs border border-blue-200 dark:border-blue-800">
                        #{member.cardNumber}
                      </span>
                      <div>
                        <span className="text-xs sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium block">
                          {member.schemeName}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <p className="font-bold text-slate-900 dark:text-white text-sm sm:text-xs">{member.customerName}</p>
                    {member.phone ? (
                      <p className="text-slate-500 dark:text-slate-400 font-mono text-xs sm:text-[11px] flex items-center gap-1 mt-0.5">
                        <Phone className="w-2.5 h-2.5" />
                        {member.phone}
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setEditingMember(member)}
                        className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 border border-amber-200 dark:border-amber-800 rounded px-1.5 py-0.5 text-[10px] font-semibold cursor-pointer mt-0.5"
                        title="मोबाईल नंबर जोडा"
                      >
                        + मोबाईल जोडा
                      </button>
                    )}
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex flex-col gap-0.5">
                      {member.village ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200 text-sm sm:text-xs">
                          <MapPin className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          {member.village}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setEditingMember(member)}
                          className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 border border-amber-200 dark:border-amber-800 rounded px-1.5 py-0.5 text-[10px] font-semibold cursor-pointer w-fit"
                          title="गाव / पत्ता जोडा"
                        >
                          + गाव जोडा
                        </button>
                      )}
                      {member.sheetNo && (
                        <span className="text-xs sm:text-[10px] font-mono font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.2 rounded w-fit border border-blue-100 dark:border-blue-800">
                          Sheet #{member.sheetNo}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex flex-col gap-0.5">
                      {member.agentName ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-indigo-700 dark:text-indigo-300 text-xs sm:text-[11px] bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded border border-indigo-100 dark:border-indigo-800 w-fit">
                          <UserCheck className="w-2.5 h-2.5" />
                          {member.agentName}
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 text-xs sm:text-[11px]">-</span>
                      )}
                      {member.uniqueId && (
                        <span className="text-xs sm:text-[10px] font-mono text-slate-400 dark:text-slate-500">
                          {member.uniqueId}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs sm:text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 className="w-3 h-3" />
                      ₹50 Paid
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400 font-mono-num text-base sm:text-xs">
                    ₹{(member.totalDeposited ?? 0).toLocaleString()}
                  </td>

                  <td className="py-3 px-4 text-right font-semibold text-rose-600 dark:text-rose-400 font-mono-num text-base sm:text-xs">
                    {(member.totalRefunded ?? 0) > 0 ? `₹${(member.totalRefunded ?? 0).toLocaleString()}` : '₹0'}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <span className="font-bold text-slate-900 dark:text-white font-mono-num text-base sm:text-sm">
                      ₹{(member.netBalance ?? 0).toLocaleString()}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => setSelectedMemberForPassbook(member)}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 font-bold text-xs transition cursor-pointer border border-blue-200 dark:border-blue-800"
                        title="View Passbook / Ledger"
                      >
                        Passbook
                      </button>

                      <button
                        onClick={() => {
                          setPaymentSelectedCard(member);
                          setPaymentAgentName(activeAgent);
                          setShowPaymentModal(true);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 font-bold text-xs transition cursor-pointer border border-emerald-200 dark:border-emerald-800"
                        title="Deposit Weekly Payment"
                      >
                        + Pay
                      </button>

                      <button
                        onClick={() => {
                          setRefundSelectedCard(member);
                          setRefundAgentName(activeAgent);
                          setShowRefundModal(true);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 font-bold text-xs transition cursor-pointer border border-rose-200 dark:border-rose-800"
                        title="Refund / Return"
                      >
                        Refund
                      </button>

                      <button
                        type="button"
                        onClick={() => setEditingMember(member)}
                        className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900 text-amber-800 dark:text-amber-300 font-bold text-xs transition cursor-pointer border border-amber-200 dark:border-amber-800"
                        title="माहिती दुरुस्त करा (Edit Name, Phone, Village)"
                      >
                        ✏️ एडिट
                      </button>

                      <button
                        onClick={() => handleShareWhatsApp(member)}
                        className="p-1 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-slate-700 rounded-lg transition cursor-pointer"
                        title="Share on WhatsApp"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredMembers.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 dark:text-slate-500 text-sm sm:text-xs">
                    No card members found matching your search or filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Member Table Pagination Bar */}
        {filteredMembers.length > MEMBERS_PAGE_SIZE && (
          <div className="bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-700 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="text-slate-600 dark:text-slate-400 font-medium">
              पान <strong className="text-slate-900 dark:text-white font-bold">{currentPage}</strong> पैकी{' '}
              <strong className="text-slate-900 dark:text-white font-bold">{totalPages}</strong> ({filteredMembers.length} सभासद)
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAllMembers(!showAllMembers)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                {showAllMembers ? 'पाने दाखवा (50 प्रति पान)' : 'सर्व एकदम पहा'}
              </button>

              {!showAllMembers && (
                <>
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer flex items-center gap-1"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>मागे</span>
                  </button>
                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer flex items-center gap-1"
                  >
                    <span>पुढे</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: ISSUE NEW CARD (All user requested fields included) */}
      {/* ========================================================================= */}
      {showAddCardModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl my-auto border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Issue New Scheme Card (नया कार्ड बनाएं)</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Fixed Registration Fee: ₹50 • Agent: <strong className="text-blue-600 dark:text-blue-400 font-bold">{newAgentName || activeAgent}</strong>
                </p>
              </div>
              <button
                onClick={() => setShowAddCardModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {newCardError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{newCardError}</span>
              </div>
            )}

            <form onSubmit={handleCreateCard} className="space-y-3.5">
              {/* Scheme Select */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Select Card Scheme *
                </label>
                <select
                  value={newCardScheme}
                  onChange={(e) => {
                    const sId = e.target.value as CardSchemeId;
                    setNewCardScheme(sId);
                    const cfg = SCHEMES_CONFIG.find((s) => s.id === sId);
                    if (cfg) {
                      setNewCardNumber(cfg.startCardNo + members.filter((m) => m.schemeId === sId).length);
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                >
                  {SCHEMES_CONFIG.map((sc) => (
                    <option key={sc.id} value={sc.id}>
                      {sc.name} ({sc.code} • Card Nos {sc.startCardNo} to {sc.endCardNo})
                    </option>
                  ))}
                </select>
              </div>

              {/* Card No & Unique ID */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Card Number (कार्ड नं.) *
                  </label>
                  <input
                    type="number"
                    required
                    value={newCardNumber}
                    onChange={(e) => setNewCardNumber(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono font-bold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                  />
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
                    Range: {SCHEMES_CONFIG.find((s) => s.id === newCardScheme)?.startCardNo} -{' '}
                    {SCHEMES_CONFIG.find((s) => s.id === newCardScheme)?.endCardNo}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Unique ID (यूनिक आईडी) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newUniqueId}
                    onChange={(e) => setNewUniqueId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Customer Name & Phone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Customer Name (ग्राहक का नाम) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    placeholder="e.g. Ramesh Patil"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mobile Number (मोबाइल नं.) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="e.g. 9823012345"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
              </div>

              {/* Village & Sheet No */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Village (गांव) *
                  </label>
                  <select
                    value={newVillage}
                    onChange={(e) => setNewVillage(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                  >
                    {villageList.map((v) => (
                      <option key={v} value={v}>
                        📍 {v}
                      </option>
                    ))}
                    <option value="other">+ Type Other Village...</option>
                  </select>

                  {newVillage === 'other' && (
                    <input
                      type="text"
                      required
                      value={newCustomVillage}
                      onChange={(e) => setNewCustomVillage(e.target.value)}
                      placeholder="Enter village name..."
                      className="w-full mt-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Sheet No (शीट नंबर) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newSheetNo}
                    onChange={(e) => setNewSheetNo(e.target.value)}
                    placeholder="e.g. 21 or Sheet-A"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
              </div>

              {/* Agent Name & Registration Fee */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Agent Name (एजेंट का नाम) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newAgentName}
                    onChange={(e) => setNewAgentName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium bg-blue-50/50 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Registration Fee (Fixed)
                  </label>
                  <div className="flex items-center gap-2 px-3 py-2 border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg text-sm font-bold text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>₹50 (Compulsory Paid)</span>
                  </div>
                </div>
              </div>

              {/* Optional Initial Installment */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Optional Initial Deposit / Week 1 Installment (₹)
                </label>
                <div className="flex items-center gap-2">
                  {[0, 100, 200, 500, 1000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setNewInitialDeposit(amt)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        newInitialDeposit === amt
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {amt === 0 ? 'None' : `₹${amt}`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddCardModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
                >
                  Confirm & Issue Card #{newCardNumber}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: FAST WEEKLY COLLECTION (वीकली कलेक्शन) */}
      {/* ========================================================================= */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl my-auto border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Weekly Installment Collection</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Agent in charge: <strong className="text-emerald-700 dark:text-emerald-400">{paymentAgentName || activeAgent}</strong>
                </p>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              {!paymentSelectedCard ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Search Card # or Customer Name *
                  </label>
                  <input
                    type="text"
                    value={paymentCardSearch}
                    onChange={(e) => setPaymentCardSearch(e.target.value)}
                    placeholder="Search Card # (e.g. 4107) or Name..."
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm mb-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />

                  <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                    {members
                      .filter(
                        (m) =>
                          m.cardNumber.toString().includes(paymentCardSearch) ||
                          m.customerName.toLowerCase().includes(paymentCardSearch.toLowerCase()) ||
                          (m.village && m.village.toLowerCase().includes(paymentCardSearch.toLowerCase())) ||
                          (m.sheetNo && m.sheetNo.toLowerCase().includes(paymentCardSearch.toLowerCase()))
                      )
                      .slice(0, 15)
                      .map((m) => (
                        <div
                          key={m.id}
                          onClick={() => setPaymentSelectedCard(m)}
                          className="p-2.5 text-xs hover:bg-blue-50 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between transition"
                        >
                          <div>
                            <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">#{m.cardNumber}</span> -{' '}
                            <span className="font-bold text-slate-800 dark:text-slate-200">{m.customerName}</span>
                            <span className="text-slate-500 dark:text-slate-400 text-[11px] block">
                              {m.village ? `📍 ${m.village}` : ''} {m.sheetNo ? `• Sheet #${m.sheetNo}` : ''}
                            </span>
                          </div>
                          <span className="font-bold text-emerald-700 dark:text-emerald-400">₹{(m.netBalance ?? 0).toLocaleString()}</span>
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300">
                        Card #{paymentSelectedCard.cardNumber} ({paymentSelectedCard.schemeName})
                      </span>
                      <button
                        type="button"
                        onClick={() => setPaymentSelectedCard(null)}
                        className="text-[11px] text-emerald-600 dark:text-emerald-400 underline font-medium cursor-pointer"
                      >
                        Change Card
                      </button>
                    </div>
                    <p className="font-bold text-slate-900 dark:text-white text-sm">{paymentSelectedCard.customerName}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Village: {paymentSelectedCard.village || 'N/A'} • Sheet: {paymentSelectedCard.sheetNo || 'N/A'}
                    </p>
                    <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                      Current Deposited Balance: ₹{(paymentSelectedCard.netBalance ?? 0).toLocaleString()}
                    </p>
                  </div>

                  {/* Inline Member Missing Details Editor */}
                  <div className="p-3 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-200">
                        <Edit2 className="w-3.5 h-3.5 text-amber-600" />
                        <span>ग्राहकाचा मोबाईल / गाव / नाव दुरुस्त करा</span>
                        {(!paymentSelectedCard.phone || !paymentSelectedCard.village) && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 font-bold">माहिती अपूर्ण</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowInlineMemberEdit(!showInlineMemberEdit)}
                        className="text-[11px] font-bold text-amber-700 dark:text-amber-300 underline cursor-pointer"
                      >
                        {showInlineMemberEdit ? 'संक्षिप्त करा ▲' : 'माहिती बदला ▼'}
                      </button>
                    </div>

                    {showInlineMemberEdit && (
                      <div className="space-y-2 pt-1 border-t border-amber-200/60 dark:border-amber-800/60">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">
                              ग्राहकाचे नाव
                            </label>
                            <input
                              type="text"
                              value={paymentEditCustomerName}
                              onChange={(e) => setPaymentEditCustomerName(e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-amber-300 dark:border-amber-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5 flex items-center justify-between">
                              <span>मोबाईल नंबर</span>
                              {!paymentEditPhone && <span className="text-[10px] text-rose-600 font-bold">आवश्यक</span>}
                            </label>
                            <input
                              type="tel"
                              value={paymentEditPhone}
                              onChange={(e) => setPaymentEditPhone(e.target.value)}
                              placeholder="उदा. 9822000000"
                              className="w-full px-2.5 py-1.5 border border-amber-300 dark:border-amber-700 rounded-lg text-xs font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5 flex items-center justify-between">
                              <span>गाव / पत्ता (Village)</span>
                              {!paymentEditVillage && <span className="text-[10px] text-rose-600 font-bold">आवश्यक</span>}
                            </label>
                            <input
                              type="text"
                              value={paymentEditVillage}
                              onChange={(e) => setPaymentEditVillage(e.target.value)}
                              placeholder="उदा. KELZAR, WAIFAD, ARVI"
                              className="w-full px-2.5 py-1.5 border border-amber-300 dark:border-amber-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">
                              शीट क्रमांक (Sheet No)
                            </label>
                            <input
                              type="text"
                              value={paymentEditSheetNo}
                              onChange={(e) => setPaymentEditSheetNo(e.target.value)}
                              placeholder="उदा. 5104"
                              className="w-full px-2.5 py-1.5 border border-amber-300 dark:border-amber-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            />
                          </div>
                        </div>

                        {onUpdateMember && (
                          <div className="flex justify-end pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                const updated: CardMember = {
                                  ...paymentSelectedCard,
                                  customerName: paymentEditCustomerName.trim() || paymentSelectedCard.customerName,
                                  phone: paymentEditPhone.trim(),
                                  village: paymentEditVillage.trim(),
                                  sheetNo: paymentEditSheetNo.trim(),
                                };
                                onUpdateMember(updated);
                                setPaymentSelectedCard(updated);
                                alert('सफलता: कार्ड मेंबर माहिती (नाव, फोन, गाव) त्वरित अपडेट करण्यात आली!');
                              }}
                              className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>केवळ माहिती त्वरित सेव्ह करा</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Payment Amount Fast Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Installment Amount (₹) *
                    </label>
                    <div className="grid grid-cols-4 gap-2 mb-2">
                      {[100, 200, 500, 1000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setPaymentAmount(amt)}
                          className={`py-2 rounded-lg font-bold text-xs transition cursor-pointer ${
                            paymentAmount === amt
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          ₹{amt}
                        </button>
                      ))}
                    </div>
                    <input
                      type="number"
                      required
                      value={paymentAmount || ''}
                      onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-emerald-700 dark:text-emerald-300 bg-white dark:bg-slate-800"
                    />
                  </div>

                  {/* Week Number & Mode */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Week Number
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="52"
                        value={paymentWeekNo}
                        onChange={(e) => setPaymentWeekNo(parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono font-bold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Payment Mode
                      </label>
                      <select
                        value={paymentMode}
                        onChange={(e) => setPaymentMode(e.target.value as any)}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                      >
                        <option value="Cash">Cash (नकद)</option>
                        <option value="Online">Online / UPI (फोनपे/GPay)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Collecting Agent Name
                    </label>
                    <input
                      type="text"
                      value={paymentAgentName}
                      onChange={(e) => setPaymentAgentName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  {/* Manual / Custom Receipt Number Field */}
                  <div className="bg-amber-50/70 dark:bg-amber-950/20 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800/60">
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center justify-between">
                      <span>पावती क्रमांक (Receipt Number)</span>
                      <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold">मॅन्युअली बदलू शकता (Editable)</span>
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={paymentReceiptNo}
                        onChange={(e) => setPaymentReceiptNo(e.target.value)}
                        placeholder={`उदा. REC-${paymentSelectedCard.cardNumber}-101 किंवा 501`}
                        className="w-full px-3 py-2 border border-amber-300 dark:border-amber-700 rounded-lg text-sm font-mono font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setPaymentReceiptNo(`REC-${paymentSelectedCard.cardNumber}-${Date.now().toString().slice(-4)}`)
                        }
                        className="px-2.5 py-2 text-xs font-semibold bg-white dark:bg-slate-700 border border-amber-300 dark:border-amber-600 rounded-lg hover:bg-amber-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 cursor-pointer shrink-0 transition"
                        title="Auto Generate Receipt No"
                      >
                        Auto ⟳
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                      दुकानातील छापील पावती बुक नंबर किंवा मॅन्युअल नंबर टाका (उदा. 101, B-45).
                    </p>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setShowPaymentModal(false)}
                      className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
                    >
                      Save Weekly Payment (₹{paymentAmount})
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: PROCESS REFUND / RETURN (रिफंड / वापसी) */}
      {/* ========================================================================= */}
      {showRefundModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl my-auto border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Return / Refund to Card Member</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Deduct from card deposits (e.g. ₹10,000 me se ₹5,000 wapas दिए)
                </p>
              </div>
              <button
                onClick={() => setShowRefundModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRefundSubmit} className="space-y-4">
              {!refundSelectedCard ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Select Member Card *
                  </label>
                  <input
                    type="text"
                    value={refundCardSearch}
                    onChange={(e) => setRefundCardSearch(e.target.value)}
                    placeholder="Search Card # or Name..."
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm mb-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                  <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                    {members
                      .filter(
                        (m) =>
                          m.netBalance > 0 &&
                          (m.cardNumber.toString().includes(refundCardSearch) ||
                            m.customerName.toLowerCase().includes(refundCardSearch.toLowerCase()) ||
                            (m.village && m.village.toLowerCase().includes(refundCardSearch.toLowerCase())))
                      )
                      .slice(0, 15)
                      .map((m) => (
                        <div
                          key={m.id}
                          onClick={() => {
                            setRefundSelectedCard(m);
                            setRefundAmount(Math.min(5000, m.netBalance));
                          }}
                          className="p-2.5 text-xs hover:bg-rose-50 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between transition"
                        >
                          <div>
                            <span className="font-bold text-rose-600 dark:text-rose-400 font-mono">#{m.cardNumber}</span> -{' '}
                            <span className="font-bold text-slate-800 dark:text-slate-200">{m.customerName}</span>
                            <span className="text-slate-500 dark:text-slate-400 text-[11px] block">
                              {m.village ? `📍 ${m.village}` : ''}
                            </span>
                          </div>
                          <span className="font-bold text-slate-900 dark:text-white">Balance: ₹{m.netBalance}</span>
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-3 bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-mono font-bold text-rose-700 dark:text-rose-300">
                        Card #{refundSelectedCard.cardNumber} ({refundSelectedCard.schemeName})
                      </span>
                      <button
                        type="button"
                        onClick={() => setRefundSelectedCard(null)}
                        className="text-[11px] text-rose-600 dark:text-rose-400 underline font-medium cursor-pointer"
                      >
                        Change Card
                      </button>
                    </div>
                    <p className="font-bold text-slate-900 dark:text-white text-sm">{refundSelectedCard.customerName}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Current Deposited Balance:{' '}
                      <strong className="text-rose-700 dark:text-rose-300 font-bold">
                        ₹{(refundSelectedCard.netBalance ?? 0).toLocaleString()}
                      </strong>
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Refund Amount to Return (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      max={refundSelectedCard.netBalance}
                      value={refundAmount || ''}
                      onChange={(e) => setRefundAmount(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-rose-300 dark:border-rose-700 rounded-lg text-sm font-bold text-rose-700 dark:text-rose-300 bg-white dark:bg-slate-800"
                    />
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      <span>Max refundable: ₹{(refundSelectedCard.netBalance ?? 0).toLocaleString()}</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        Balance after refund: ₹{Math.max(0, (Number(refundSelectedCard.netBalance) || 0) - (Number(refundAmount) || 0)).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Refund Mode
                      </label>
                      <select
                        value={refundMode}
                        onChange={(e) => setRefundMode(e.target.value as any)}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                      >
                        <option value="Cash">Cash (नकद)</option>
                        <option value="Online">Online / UPI</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Processing Agent
                      </label>
                      <input
                        type="text"
                        value={refundAgentName}
                        onChange={(e) => setRefundAgentName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Reason / Remarks
                    </label>
                    <input
                      type="text"
                      value={refundRemarks}
                      onChange={(e) => setRefundRemarks(e.target.value)}
                      placeholder="e.g. ₹5,000 returned to member upon request"
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setShowRefundModal(false)}
                      className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
                    >
                      Confirm Refund (₹{refundAmount})
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: FULL CARD PASSBOOK / LEDGER */}
      {/* ========================================================================= */}
      {selectedMemberForPassbook && (
        <CardPassbookModal
          salesBills={salesBills || []}
          member={selectedMemberForPassbook}
          transactions={transactions}
          settings={settings}
          onUpdateMember={onUpdateMember}
          onClose={() => setSelectedMemberForPassbook(null)}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: DEDICATED EDIT CARD MEMBER DETAILS (नाव, फोन, गाव, शीट नं.) */}
      {/* ========================================================================= */}
      {editingMember && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl my-auto border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 dark:bg-amber-950/60 rounded-xl text-amber-700 dark:text-amber-300">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    कार्ड माहिती दुरुस्त करा (Edit Card Member)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    कार्ड क्र.: <strong className="text-blue-600 font-mono">#{editingMember.cardNumber}</strong> • योजना: {editingMember.schemeName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingMember(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-bold p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (onUpdateMember) {
                  onUpdateMember(editingMember);
                }
                setLastActionMessage({
                  title: 'माहिती यशस्वीपणे अपडेट केली!',
                  text: `कार्ड #${editingMember.cardNumber} (${editingMember.customerName}) ची माहिती सेव्ह झाली.`,
                  card: editingMember,
                });
                setEditingMember(null);
              }}
              className="space-y-3.5"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    कार्ड क्रमांक (Card Number)
                  </label>
                  <input
                    type="number"
                    value={editingMember.cardNumber}
                    onChange={(e) =>
                      setEditingMember({
                        ...editingMember,
                        cardNumber: parseInt(e.target.value) || editingMember.cardNumber,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    शीट क्रमांक (Sheet No)
                  </label>
                  <input
                    type="text"
                    value={editingMember.sheetNo || ''}
                    placeholder="उदा. 5104"
                    onChange={(e) =>
                      setEditingMember({
                        ...editingMember,
                        sheetNo: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ग्राहकाचे नाव (Customer Name) *
                </label>
                <input
                  type="text"
                  required
                  value={editingMember.customerName}
                  onChange={(e) =>
                    setEditingMember({
                      ...editingMember,
                      customerName: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    मोबाईल नंबर (Phone)
                  </label>
                  <input
                    type="tel"
                    value={editingMember.phone || ''}
                    placeholder="१० अंकी नंबर"
                    onChange={(e) =>
                      setEditingMember({
                        ...editingMember,
                        phone: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    गाव / पत्ता (Village)
                  </label>
                  <input
                    type="text"
                    value={editingMember.village || ''}
                    placeholder="उदा. Kelzar, Wardha"
                    onChange={(e) =>
                      setEditingMember({
                        ...editingMember,
                        village: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    कलेक्शन एजंट (Agent Name)
                  </label>
                  <input
                    type="text"
                    value={editingMember.agentName || ''}
                    onChange={(e) =>
                      setEditingMember({
                        ...editingMember,
                        agentName: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    स्थिती (Status)
                  </label>
                  <select
                    value={editingMember.status || 'Active'}
                    onChange={(e) =>
                      setEditingMember({
                        ...editingMember,
                        status: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Active">सुरू (Active)</option>
                    <option value="Completed">पूर्ण झाले (Completed)</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">एकूण जमा शिल्लक:</span>
                <strong className="text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                  ₹{(editingMember.netBalance ?? 0).toLocaleString()}
                </strong>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                {onDeleteMember ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`तुम्हाला नक्की कार्ड #${editingMember.cardNumber} (${editingMember.customerName}) हटवायचे आहे का?`)) {
                        onDeleteMember(editingMember.id);
                        setEditingMember(null);
                      }
                    }}
                    className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer border border-rose-200 dark:border-rose-800"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>मेंबर हटवा</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingMember(null)}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    रद्द करा
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>माहिती सेव्ह करा</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
