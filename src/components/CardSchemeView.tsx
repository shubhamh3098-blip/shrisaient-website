import React, { useState, useMemo, useEffect, useDeferredValue } from 'react';
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
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
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
import { getNextReceiptNumber } from '../utils/numbering';
import { CardPassbookModal } from './CardPassbookModal';
import { CollectionSlipModal } from './CollectionSlipModal';

interface CardSchemeViewProps {
  cardMembers?: CardMember[];
  cardTransactions?: CardTransaction[];
  members?: CardMember[];
  transactions?: CardTransaction[];
  settings: BusinessSettings;
  staff?: StaffMember[];
  onAddMember: (member: Omit<CardMember, 'id'>) => void;
  onUpdateMember?: (id: string, updates: Partial<CardMember>) => void;
  onRecordTransaction: (tx: Omit<CardTransaction, 'id' | 'createdAt'>) => void;
  onNavigateCsv?: () => void;
  onOpenExportModal?: () => void;
  salesBills?: any;
}

export const CardSchemeView: React.FC<CardSchemeViewProps> = ({
  cardMembers: propsCardMembers,
  cardTransactions: propsCardTransactions,
  members: legacyMembers,
  transactions: legacyTransactions,
  settings,
  staff = [],
  onAddMember,
  onUpdateMember,
  onRecordTransaction,
  onNavigateCsv,
  onOpenExportModal,
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
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [memberCurrentPage, setMemberCurrentPage] = useState(1);
  const MEMBER_PAGE_SIZE = 25;

  // Reset page when filters change
  useEffect(() => {
    setMemberCurrentPage(1);
  }, [selectedSchemeFilter, selectedVillageFilter, selectedAgentFilter, deferredSearchQuery]);

  // Modals
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedMemberForPassbook, setSelectedMemberForPassbook] = useState<CardMember | null>(null);
  const [activeCollectionSlipTx, setActiveCollectionSlipTx] = useState<{
    transaction: CardTransaction;
    member?: CardMember;
  } | null>(null);

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
  const [paymentReceiptNo, setPaymentReceiptNo] = useState<string>('');
  const [paymentRemarks, setPaymentRemarks] = useState('');

  // Auto-calculate next receipt number (baseline 1078 -> 1079...)
  useEffect(() => {
    setPaymentReceiptNo(getNextReceiptNumber(transactions));
  }, [transactions, showPaymentModal]);

  // Inline Member Edit State while collecting weekly payment (नाव, मोबाईल, गाव, शीट बदल)
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editVillage, setEditVillage] = useState('');
  const [editSheetNo, setEditSheetNo] = useState('');
  const [isEditingMember, setIsEditingMember] = useState(false);
  const [editMemberSuccess, setEditMemberSuccess] = useState('');

  // Sync inline edit fields whenever a card is selected for payment
  useEffect(() => {
    if (paymentSelectedCard) {
      setEditCustomerName(paymentSelectedCard.customerName || '');
      setEditPhone(paymentSelectedCard.phone || '');
      setEditVillage(paymentSelectedCard.village || '');
      setEditSheetNo(paymentSelectedCard.sheetNo || '');
      setIsEditingMember(false);
      setEditMemberSuccess('');
    }
  }, [paymentSelectedCard]);

  // Handle instant save of edited member details
  const handleSaveMemberDetails = () => {
    if (!paymentSelectedCard || !onUpdateMember) return;
    const updates: Partial<CardMember> = {
      customerName: editCustomerName.trim() || paymentSelectedCard.customerName,
      phone: editPhone.trim() || undefined,
      village: editVillage.trim() || undefined,
      sheetNo: editSheetNo.trim() || undefined,
    };
    onUpdateMember(paymentSelectedCard.id, updates);
    setPaymentSelectedCard((prev) => (prev ? { ...prev, ...updates } : null));
    setEditMemberSuccess('✅ माहिती यशस्वीरित्या सेव्ह झाली!');
    setTimeout(() => setEditMemberSuccess(''), 3000);
  };

  // Helper to get next available card number for a specific scheme
  const getNextCardNoForScheme = (schemeId: CardSchemeId) => {
    const sMembers = members.filter((m) => m.schemeId === schemeId);
    const cfg = SCHEMES_CONFIG.find((s) => s.id === schemeId);
    const start = cfg?.startCardNo || 1001;
    return sMembers.length > 0 ? Math.max(...sMembers.map((m) => m.cardNumber)) + 1 : start;
  };

  // Update newCardNumber automatically when scheme changes
  useEffect(() => {
    const nextNo = getNextCardNoForScheme(newCardScheme);
    setNewCardNumber(nextNo);
  }, [newCardScheme, members]);

  // Refund Form state
  const [refundCardSearch, setRefundCardSearch] = useState('');
  const [refundSelectedCard, setRefundSelectedCard] = useState<CardMember | null>(null);
  const [refundAmount, setRefundAmount] = useState<number>(1000);
  const [refundMode, setRefundMode] = useState<'Cash' | 'Online'>('Cash');
  const [refundAgentName, setRefundAgentName] = useState(activeAgent);
  const [refundRemarks, setRefundRemarks] = useState('Partial refund / return to customer');

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
    const defaults = ['Shubham Shende', 'Bhushan Lidbe', 'Suraj Pendam', 'Ninad Hole'];
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
      const q = deferredSearchQuery.toLowerCase().trim();
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
  }, [members, selectedSchemeFilter, selectedVillageFilter, selectedAgentFilter, deferredSearchQuery]);

  const memberTotalPages = Math.max(1, Math.ceil(filteredMembers.length / MEMBER_PAGE_SIZE));
  const safeMemberPage = Math.min(memberCurrentPage, memberTotalPages);

  const paginatedMembers = useMemo(() => {
    const start = (safeMemberPage - 1) * MEMBER_PAGE_SIZE;
    return filteredMembers.slice(start, start + MEMBER_PAGE_SIZE);
  }, [filteredMembers, safeMemberPage]);

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

    // Check if customer details were modified in the weekly payment modal and auto-save
    const finalCustomerName = editCustomerName.trim() || paymentSelectedCard.customerName;
    const finalPhone = editPhone.trim() || paymentSelectedCard.phone;
    const finalVillage = editVillage.trim() || paymentSelectedCard.village;
    const finalSheetNo = editSheetNo.trim() || paymentSelectedCard.sheetNo;

    if (onUpdateMember) {
      const hasChanges =
        finalCustomerName !== paymentSelectedCard.customerName ||
        finalPhone !== paymentSelectedCard.phone ||
        finalVillage !== paymentSelectedCard.village ||
        finalSheetNo !== paymentSelectedCard.sheetNo;

      if (hasChanges) {
        onUpdateMember(paymentSelectedCard.id, {
          customerName: finalCustomerName,
          phone: finalPhone || undefined,
          village: finalVillage || undefined,
          sheetNo: finalSheetNo || undefined,
        });
      }
    }

    const updatedMemberObj: CardMember = {
      ...paymentSelectedCard,
      customerName: finalCustomerName,
      phone: finalPhone,
      village: finalVillage,
      sheetNo: finalSheetNo,
    };

    const receiptNo = paymentReceiptNo.trim() || getNextReceiptNumber(transactions);
    const newBalance = (paymentSelectedCard.netBalance || 0) + paymentAmount;
    const date = new Date().toISOString().split('T')[0];
    const finalAgent = paymentAgentName.trim() || activeAgent;

    const txData: Omit<CardTransaction, 'id'> = {
      cardId: paymentSelectedCard.id,
      cardNumber: paymentSelectedCard.cardNumber,
      schemeId: paymentSelectedCard.schemeId,
      customerName: finalCustomerName,
      customerPhone: finalPhone,
      receiptNo,
      date,
      type: 'WeeklyPayment',
      weekNumber: paymentWeekNo,
      amount: paymentAmount,
      paymentMode,
      agentName: finalAgent,
      remarks: paymentRemarks || `Week ${paymentWeekNo} Installment collected by ${finalAgent}`,
      balanceAfter: newBalance,
      createdAt: new Date().toISOString(),
    };

    onRecordTransaction(txData);

    // If customer has a number or whenever payment is collected, immediately open Collection Slip for Print & WhatsApp
    setActiveCollectionSlipTx({
      transaction: {
        ...txData,
        id: `ctx-${Date.now()}`,
        createdAt: new Date().toISOString(),
      },
      member: { ...updatedMemberObj, netBalance: newBalance },
    });

    // Success flash notification
    setLastActionMessage({
      title: `₹${paymentAmount.toLocaleString()} Weekly Payment Deposited!`,
      text: `Card #${paymentSelectedCard.cardNumber} (${finalCustomerName}) | New Balance: ₹${newBalance.toLocaleString()} | Agent: ${finalAgent}`,
      card: { ...updatedMemberObj, netBalance: newBalance },
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
      title: `₹${refundAmount.toLocaleString()} Refund Processed!`,
      text: `Card #${refundSelectedCard.cardNumber} (${refundSelectedCard.customerName}) | Remaining Balance: ₹${newBalance.toLocaleString()} | Agent: ${finalAgent}`,
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
          {onNavigateCsv && (
            <button
              onClick={onNavigateCsv}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              CSV Import
            </button>
          )}

          {onOpenExportModal && (
            <button
              onClick={onOpenExportModal}
              className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="योजना १, २, ३ कार्ड्स व हप्ते पावत्या CSV एक्सपोर्ट करा"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              CSV एक्सपोर्ट (Export)
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
              <span className="px-2 py-1 rounded-lg bg-slate-100 font-mono font-bold text-xs text-slate-800">
                {count} Cards
              </span>
            </div>
          );
        })}
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Universal Search */}
          <div className="sm:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Card # (e.g. 4107), Customer, Village, Sheet #, Agent..."
              className="w-full pl-9 pr-9 py-2.5 bg-white border-2 border-slate-300 rounded-xl text-base sm:text-sm font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:border-blue-600 focus:outline-none shadow-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center text-xs font-bold cursor-pointer transition"
                title="Clear Search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Scheme Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedSchemeFilter}
              onChange={(e) => setSelectedSchemeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white"
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
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white"
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
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white"
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

        {/* Quick Filter Status Bar & Pagination Controls */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span>
              Showing <strong>{filteredMembers.length > 0 ? (safeMemberPage - 1) * MEMBER_PAGE_SIZE + 1 : 0}</strong> -{' '}
              <strong>{Math.min(safeMemberPage * MEMBER_PAGE_SIZE, filteredMembers.length)}</strong> of <strong>{filteredMembers.length}</strong> card members
              {memberTotalPages > 1 && ` (Page ${safeMemberPage}/${memberTotalPages})`}
            </span>
            {(selectedSchemeFilter !== 'all' || selectedVillageFilter !== 'all' || selectedAgentFilter !== 'all' || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedSchemeFilter('all');
                  setSelectedVillageFilter('all');
                  setSelectedAgentFilter('all');
                  setSearchQuery('');
                }}
                className="text-blue-600 underline font-semibold text-[11px] cursor-pointer"
              >
                Clear all filters
              </button>
            )}
          </div>

          {memberTotalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={safeMemberPage <= 1}
                onClick={() => setMemberCurrentPage(1)}
                className="p-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="First Page"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                disabled={safeMemberPage <= 1}
                onClick={() => setMemberCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2 py-0.5 rounded border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center gap-0.5 text-xs"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </button>
              <span className="px-1.5 font-bold text-slate-800">
                {safeMemberPage} / {memberTotalPages}
              </span>
              <button
                type="button"
                disabled={safeMemberPage >= memberTotalPages}
                onClick={() => setMemberCurrentPage((p) => Math.min(memberTotalPages, p + 1))}
                className="px-2 py-0.5 rounded border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center gap-0.5 text-xs"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                disabled={safeMemberPage >= memberTotalPages}
                onClick={() => setMemberCurrentPage(memberTotalPages)}
                className="p-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="Last Page"
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Card Members Table / Mobile Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Mobile View: High-Performance Touch Cards (sm:hidden) */}
        <div className="sm:hidden divide-y divide-slate-100">
          {paginatedMembers.map((member) => (
            <div key={member.id} className="p-3.5 space-y-2 hover:bg-slate-50 transition">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 font-mono font-black text-xs border border-blue-200">
                    #{member.cardNumber}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold">
                    {member.schemeName}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 font-medium block">शिल्लक बचत</span>
                  <span className="font-black text-emerald-700 text-sm font-mono">
                    ₹{(member.netBalance ?? 0).toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-black text-slate-900 text-sm">{member.customerName}</h4>
                <div className="text-xs text-slate-600 flex items-center gap-2 flex-wrap mt-0.5">
                  {member.phone ? (
                    <span className="font-mono font-bold text-slate-800 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" /> {member.phone}
                    </span>
                  ) : (
                    <span className="text-slate-400 text-[11px]">मोबाईल नाही</span>
                  )}
                  {member.village && <span className="font-semibold">📍 {member.village}</span>}
                  {member.sheetNo && <span className="font-semibold">📄 पाना #{member.sheetNo}</span>}
                </div>
              </div>

              {/* Fast Mobile Action Buttons */}
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentSelectedCard(member);
                    setPaymentAgentName(activeAgent);
                    setShowPaymentModal(true);
                  }}
                  className="py-2 px-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold text-center flex items-center justify-center gap-0.5 cursor-pointer active:scale-95 shadow-xs"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" /> + हप्ता
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMemberForPassbook(member)}
                  className="py-2 px-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold text-center flex items-center justify-center gap-0.5 cursor-pointer active:scale-95"
                >
                  <BookOpen className="w-3.5 h-3.5" /> पासबुक
                </button>
                <button
                  type="button"
                  onClick={() => handleShareWhatsApp(member)}
                  className="py-2 px-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold text-center flex items-center justify-center gap-0.5 cursor-pointer active:scale-95"
                  title="WhatsApp पावती पाठवा"
                >
                  <Share2 className="w-3.5 h-3.5" /> पावती
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRefundSelectedCard(member);
                    setRefundAgentName(activeAgent);
                    setShowRefundModal(true);
                  }}
                  className="py-2 px-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold text-center flex items-center justify-center gap-0.5 cursor-pointer active:scale-95"
                >
                  <ArrowDownLeft className="w-3.5 h-3.5" /> परतावा
                </button>
              </div>
            </div>
          ))}
          {filteredMembers.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-xs">
              कोणतेही कार्ड सदस्य सापडले नाहीत.
            </div>
          )}
        </div>

        {/* Desktop View: Full Data Table (hidden on sm screens) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
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
            <tbody className="divide-y divide-slate-100">
              {paginatedMembers.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 font-mono font-bold text-xs border border-blue-200">
                        #{member.cardNumber}
                      </span>
                      <div>
                        <span className="text-[11px] text-slate-500 font-medium block">
                          {member.schemeName}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <p className="font-bold text-slate-900">{member.customerName}</p>
                    {member.phone ? (
                      <p className="text-slate-500 font-mono text-[11px] flex items-center gap-1 mt-0.5">
                        <Phone className="w-2.5 h-2.5" />
                        {member.phone}
                      </p>
                    ) : (
                      <span className="text-slate-400 text-[10px]">No mobile</span>
                    )}
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex flex-col gap-0.5">
                      {member.village ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-800 text-xs">
                          <MapPin className="w-3 h-3 text-emerald-600" />
                          {member.village}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">-</span>
                      )}
                      {member.sheetNo && (
                        <span className="text-[10px] font-mono font-medium text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded w-fit border border-blue-100">
                          Sheet #{member.sheetNo}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex flex-col gap-0.5">
                      {member.agentName ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-indigo-700 text-[11px] bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 w-fit">
                          <UserCheck className="w-2.5 h-2.5" />
                          {member.agentName}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">-</span>
                      )}
                      {member.uniqueId && (
                        <span className="text-[10px] font-mono text-slate-400">
                          {member.uniqueId}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" />
                      ₹50 Paid
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right font-bold text-emerald-600">
                    ₹{(member.totalDeposited ?? 0).toLocaleString()}
                  </td>

                  <td className="py-3 px-4 text-right font-semibold text-rose-600">
                    {(member.totalRefunded ?? 0) > 0 ? `₹${(member.totalRefunded ?? 0).toLocaleString()}` : '₹0'}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <span className="font-bold text-slate-900 text-sm">
                      ₹{(member.netBalance ?? 0).toLocaleString()}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => setSelectedMemberForPassbook(member)}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition cursor-pointer border border-blue-200"
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
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs transition cursor-pointer border border-emerald-200"
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
                        className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition cursor-pointer border border-rose-200"
                        title="Refund / Return"
                      >
                        Refund
                      </button>

                      <button
                        onClick={() => {
                          const lastTx = transactions
                            .filter((t) => t.cardId === member.id || t.cardNumber === member.cardNumber)
                            .slice(-1)[0];
                          if (lastTx) {
                            setActiveCollectionSlipTx({ transaction: lastTx, member });
                          } else {
                            setActiveCollectionSlipTx({
                              transaction: {
                                id: `slip-${member.id}`,
                                cardId: member.id,
                                cardNumber: member.cardNumber,
                                schemeId: member.schemeId,
                                customerName: member.customerName,
                                customerPhone: member.phone,
                                receiptNo: `REC-${member.cardNumber}-${member.sheetNo || 'OPN'}`,
                                date: new Date().toISOString().split('T')[0],
                                type: 'WeeklyPayment',
                                amount: member.totalDeposited || member.netBalance || 50,
                                paymentMode: 'Cash',
                                balanceAfter: member.netBalance,
                                createdAt: new Date().toISOString(),
                              },
                              member,
                            });
                          }
                        }}
                        className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                        title="Print Collection Slip / पावती प्रिंट करा"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleShareWhatsApp(member)}
                        className="p-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
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
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No card members found matching your search or filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Pagination Bar */}
        {memberTotalPages > 1 && (
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2 text-xs text-slate-600">
            <div>
              Showing page <strong>{safeMemberPage}</strong> of <strong>{memberTotalPages}</strong> ({filteredMembers.length} total members)
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={safeMemberPage <= 1}
                onClick={() => setMemberCurrentPage(1)}
                className="px-2 py-1 rounded border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                title="First Page"
              >
                <ChevronsLeft className="w-3.5 h-3.5" /> First
              </button>
              <button
                type="button"
                disabled={safeMemberPage <= 1}
                onClick={() => setMemberCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded border border-slate-200 text-slate-700 font-bold hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </button>
              <div className="px-2 font-bold text-slate-800">
                {safeMemberPage} / {memberTotalPages}
              </div>
              <button
                type="button"
                disabled={safeMemberPage >= memberTotalPages}
                onClick={() => setMemberCurrentPage((p) => Math.min(memberTotalPages, p + 1))}
                className="px-2.5 py-1 rounded border border-slate-200 text-slate-700 font-bold hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                disabled={safeMemberPage >= memberTotalPages}
                onClick={() => setMemberCurrentPage(memberTotalPages)}
                className="px-2 py-1 rounded border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                title="Last Page"
              >
                Last <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: ISSUE NEW CARD (All user requested fields included) */}
      {/* ========================================================================= */}
      {showAddCardModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Issue New Scheme Card (नया कार्ड बनाएं)</h3>
                <p className="text-xs text-slate-500">
                  Fixed Registration Fee: ₹50 • Agent: <strong className="text-blue-600 font-bold">{newAgentName || activeAgent}</strong>
                </p>
              </div>
              <button
                onClick={() => setShowAddCardModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {newCardError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{newCardError}</span>
              </div>
            )}

            <form onSubmit={handleCreateCard} className="space-y-3.5">
              {/* Scheme Select */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
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
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Card Number (कार्ड नं.) *
                  </label>
                  <input
                    type="number"
                    required
                    value={newCardNumber}
                    onChange={(e) => setNewCardNumber(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-400">
                    Range: {SCHEMES_CONFIG.find((s) => s.id === newCardScheme)?.startCardNo} -{' '}
                    {SCHEMES_CONFIG.find((s) => s.id === newCardScheme)?.endCardNo}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Unique ID (यूनिक आईडी) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newUniqueId}
                    onChange={(e) => setNewUniqueId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono bg-slate-50"
                  />
                </div>
              </div>

              {/* Customer Name & Phone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Customer Name (ग्राहक का नाम) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    placeholder="e.g. Ramesh Patil"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mobile Number (मोबाइल नं.) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="e.g. 9823012345"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono"
                  />
                </div>
              </div>

              {/* Village & Sheet No */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Village (गांव) *
                  </label>
                  <select
                    value={newVillage}
                    onChange={(e) => setNewVillage(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
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
                      className="w-full mt-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sheet No (शीट नंबर) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newSheetNo}
                    onChange={(e) => setNewSheetNo(e.target.value)}
                    placeholder="e.g. 21 or Sheet-A"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono"
                  />
                </div>
              </div>

              {/* Agent Name & Registration Fee */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Agent Name (एजेंट का नाम) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newAgentName}
                    onChange={(e) => setNewAgentName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium bg-blue-50/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Registration Fee (Fixed)
                  </label>
                  <div className="flex items-center gap-2 px-3 py-2 border border-emerald-200 bg-emerald-50 rounded-lg text-sm font-bold text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>₹50 (Compulsory Paid)</span>
                  </div>
                </div>
              </div>

              {/* Optional Initial Installment */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
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
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {amt === 0 ? 'None' : `₹${amt}`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddCardModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
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
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Weekly Installment Collection</h3>
                <p className="text-xs text-slate-500">
                  Agent in charge: <strong className="text-emerald-700">{paymentAgentName || activeAgent}</strong>
                </p>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              {!paymentSelectedCard ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Search Card # or Customer Name *
                  </label>
                  <input
                    type="text"
                    value={paymentCardSearch}
                    onChange={(e) => setPaymentCardSearch(e.target.value)}
                    placeholder="Search Card # (e.g. 4107), Mobile, Name, Village..."
                    className="w-full px-3 py-2.5 border-2 border-slate-300 rounded-xl text-base sm:text-sm font-bold text-slate-900 placeholder:text-slate-400 mb-2 focus:border-emerald-600 focus:outline-none"
                  />

                  <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
                    {members
                      .filter(
                        (m) =>
                          m.cardNumber.toString().includes(paymentCardSearch) ||
                          m.customerName.toLowerCase().includes(paymentCardSearch.toLowerCase()) ||
                          (m.phone && m.phone.includes(paymentCardSearch)) ||
                          (m.village && m.village.toLowerCase().includes(paymentCardSearch.toLowerCase())) ||
                          (m.sheetNo && m.sheetNo.toLowerCase().includes(paymentCardSearch.toLowerCase()))
                      )
                      .slice(0, 20)
                      .map((m) => (
                        <div
                          key={m.id}
                          onClick={() => setPaymentSelectedCard(m)}
                          className="p-2.5 text-xs hover:bg-blue-50 cursor-pointer flex items-center justify-between transition"
                        >
                          <div>
                            <span className="font-bold text-blue-600 font-mono">#{m.cardNumber}</span> -{' '}
                            <span className="font-bold text-slate-800">{m.customerName}</span>
                            <span className="text-slate-500 text-[11px] block">
                              {m.village ? `📍 ${m.village}` : ''} {m.sheetNo ? `• Sheet #${m.sheetNo}` : ''} {m.phone ? `• 📞 ${m.phone}` : ''}
                            </span>
                          </div>
                          <span className="font-bold text-emerald-700">₹{(m.netBalance ?? 0).toLocaleString()}</span>
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-mono font-bold text-emerald-700">
                        Card #{paymentSelectedCard.cardNumber} ({paymentSelectedCard.schemeName})
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsEditingMember(!isEditingMember)}
                          className="text-[11px] bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-100 px-2 py-0.5 rounded-md font-bold cursor-pointer transition flex items-center gap-1"
                        >
                          ✏️ {isEditingMember ? 'संपादक बंद करा' : 'माहिती बदला (Edit)'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentSelectedCard(null)}
                          className="text-[11px] text-slate-500 underline font-medium cursor-pointer"
                        >
                          Change Card
                        </button>
                      </div>
                    </div>

                    {!isEditingMember ? (
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{editCustomerName || paymentSelectedCard.customerName}</p>
                        <p className="text-xs text-slate-600 flex items-center gap-2 flex-wrap mt-0.5">
                          <span>📱 <strong>{editPhone || paymentSelectedCard.phone || 'नाही'}</strong></span>
                          <span>📍 <strong>{editVillage || paymentSelectedCard.village || 'N/A'}</strong></span>
                          <span>📄 <strong>शीट #{editSheetNo || paymentSelectedCard.sheetNo || 'N/A'}</strong></span>
                        </p>
                        <p className="text-xs font-semibold text-emerald-800 mt-1">
                          शिल्लक बचत (Current Balance): ₹{(paymentSelectedCard.netBalance ?? 0).toLocaleString()}
                        </p>
                      </div>
                    ) : (
                      <div className="bg-white p-3 rounded-lg border border-emerald-300 space-y-2.5 mt-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800">
                            ✏️ ग्राहक माहिती दुरुस्ती (मोबाईल / गाव / नाव / शीट)
                          </span>
                          {editMemberSuccess && (
                            <span className="text-xs font-bold text-emerald-600 animate-pulse">
                              {editMemberSuccess}
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                              ग्राहकाचे नाव
                            </label>
                            <input
                              type="text"
                              value={editCustomerName}
                              onChange={(e) => setEditCustomerName(e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                              मोबाईल नंबर
                            </label>
                            <input
                              type="tel"
                              value={editPhone}
                              onChange={(e) => setEditPhone(e.target.value)}
                              placeholder="98XXXXXXXX"
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                              गाव (Village)
                            </label>
                            <input
                              type="text"
                              value={editVillage}
                              onChange={(e) => setEditVillage(e.target.value)}
                              placeholder="उदा. Bori"
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                              शीट / पान नं (Sheet #)
                            </label>
                            <input
                              type="text"
                              value={editSheetNo}
                              onChange={(e) => setEditSheetNo(e.target.value)}
                              placeholder="उदा. 12"
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            onClick={handleSaveMemberDetails}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition shadow-xs"
                          >
                            ✓ बदल लगेच सेव्ह करा (Save Info)
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Payment Amount Fast Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
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
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
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
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold text-emerald-700"
                    />
                  </div>

                  {/* Receipt No, Week Number & Mode */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        पावती नं (Receipt No) *
                      </label>
                      <input
                        type="text"
                        required
                        value={paymentReceiptNo}
                        onChange={(e) => setPaymentReceiptNo(e.target.value)}
                        placeholder="1079"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono font-bold text-emerald-700 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Week Number
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="130"
                        value={paymentWeekNo}
                        onChange={(e) => setPaymentWeekNo(parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Payment Mode
                      </label>
                      <select
                        value={paymentMode}
                        onChange={(e) => setPaymentMode(e.target.value as any)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                      >
                        <option value="Cash">Cash (नकद)</option>
                        <option value="Online">Online / UPI (फोनपे/GPay)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Collecting Agent Name
                    </label>
                    <input
                      type="text"
                      value={paymentAgentName}
                      onChange={(e) => setPaymentAgentName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowPaymentModal(false)}
                      className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
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
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Return / Refund to Card Member</h3>
                <p className="text-xs text-slate-500">
                  Deduct from card deposits (e.g. ₹10,000 me se ₹5,000 wapas diye)
                </p>
              </div>
              <button
                onClick={() => setShowRefundModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRefundSubmit} className="space-y-4">
              {!refundSelectedCard ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select Member Card *
                  </label>
                  <input
                    type="text"
                    value={refundCardSearch}
                    onChange={(e) => setRefundCardSearch(e.target.value)}
                    placeholder="Search Card # or Name..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm mb-2"
                  />
                  <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
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
                          className="p-2.5 text-xs hover:bg-rose-50 cursor-pointer flex items-center justify-between transition"
                        >
                          <div>
                            <span className="font-bold text-rose-600 font-mono">#{m.cardNumber}</span> -{' '}
                            <span className="font-bold text-slate-800">{m.customerName}</span>
                            <span className="text-slate-500 text-[11px] block">
                              {m.village ? `📍 ${m.village}` : ''}
                            </span>
                          </div>
                          <span className="font-bold text-slate-900">Balance: ₹{m.netBalance}</span>
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-mono font-bold text-rose-700">
                        Card #{refundSelectedCard.cardNumber} ({refundSelectedCard.schemeName})
                      </span>
                      <button
                        type="button"
                        onClick={() => setRefundSelectedCard(null)}
                        className="text-[11px] text-rose-600 underline font-medium cursor-pointer"
                      >
                        Change Card
                      </button>
                    </div>
                    <p className="font-bold text-slate-900 text-sm">{refundSelectedCard.customerName}</p>
                    <p className="text-xs text-slate-600">
                      Current Deposited Balance:{' '}
                      <strong className="text-rose-700 font-bold">
                        ₹{(refundSelectedCard.netBalance ?? 0).toLocaleString()}
                      </strong>
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Refund Amount to Return (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      max={refundSelectedCard.netBalance}
                      value={refundAmount || ''}
                      onChange={(e) => setRefundAmount(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-rose-300 rounded-lg text-sm font-bold text-rose-700"
                    />
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                      <span>Max refundable: ₹{(refundSelectedCard.netBalance ?? 0).toLocaleString()}</span>
                      <span className="font-semibold text-slate-700">
                        Balance after refund: ₹{Math.max(0, (refundSelectedCard.netBalance ?? 0) - refundAmount).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Refund Mode
                      </label>
                      <select
                        value={refundMode}
                        onChange={(e) => setRefundMode(e.target.value as any)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                      >
                        <option value="Cash">Cash (नकद)</option>
                        <option value="Online">Online / UPI</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Processing Agent
                      </label>
                      <input
                        type="text"
                        value={refundAgentName}
                        onChange={(e) => setRefundAgentName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Reason / Remarks
                    </label>
                    <input
                      type="text"
                      value={refundRemarks}
                      onChange={(e) => setRefundRemarks(e.target.value)}
                      placeholder="e.g. ₹5,000 returned to member upon request"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
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
          member={selectedMemberForPassbook}
          transactions={transactions}
          settings={settings}
          onClose={() => setSelectedMemberForPassbook(null)}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: WEEKLY COLLECTION SLIP (PRINT & WHATSAPP TO CUSTOMER) */}
      {/* ========================================================================= */}
      {activeCollectionSlipTx && (
        <CollectionSlipModal
          transaction={activeCollectionSlipTx.transaction}
          member={activeCollectionSlipTx.member}
          settings={settings}
          onClose={() => setActiveCollectionSlipTx(null)}
        />
      )}
    </div>
  );
};
