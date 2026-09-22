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
  ChevronRight,
  BookOpen,
  Loader2,
  PlusCircle,
  Truck
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
import { AgentCollectionSheetModal } from './AgentCollectionSheetModal';
import { OverdueRemindersModal } from './OverdueRemindersModal';
import { WhatsAppGroupInviteModal } from './WhatsAppGroupInviteModal';
import { DeliveryChallanModal } from './DeliveryChallanModal';
import { exportSchemeCardsToCsv, exportReceiptsToCsv } from '../utils/csvExporter';
import { buildCustomerPassbookWhatsAppText } from '../utils/agentCalculator';

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
  initialAction?: 'payment' | 'add-card' | 'refund' | 'delivery-challan' | null;
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
  const [overdueFilterOnly, setOverdueFilterOnly] = useState(false);

  // Modals
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedMemberForPassbook, setSelectedMemberForPassbook] = useState<CardMember | null>(null);
  const [showAgentCollectionModal, setShowAgentCollectionModal] = useState(false);
  const [showOverdueRemindersModal, setShowOverdueRemindersModal] = useState(false);
  const [showWhatsAppGroupModal, setShowWhatsAppGroupModal] = useState(false);
  const [showDeliveryChallanModal, setShowDeliveryChallanModal] = useState(false);
  const [deliveryChallanInitialMember, setDeliveryChallanInitialMember] = useState<CardMember | null>(null);

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
  const [cardToast, setCardToast] = useState<{ text: string; type?: 'success' | 'error' } | null>(null);

  const showCardToast = (text: string, type: 'success' | 'error' = 'success') => {
    setCardToast({ text, type });
    setTimeout(() => setCardToast(null), 3500);
  };

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
  const [refundAcknowledgeRule, setRefundAcknowledgeRule] = useState(false);

  // Helper: Card must be Completed (or paid 30 months / 130 weeks >= ₹13,000) for cash refund
  const isCardFullyCompleted = (member: CardMember | null | undefined): boolean => {
    if (!member) return false;
    return member.status === 'Completed' || (Number(member.totalDeposited) || 0) >= 13000;
  };

  // Dedicated Member Edit Modal state
  const [editingMember, setEditingMember] = useState<CardMember | null>(null);

  // Weekly Collection Inline Member Edit state
  const [paymentEditCustomerName, setPaymentEditCustomerName] = useState('');
  const [paymentEditPhone, setPaymentEditPhone] = useState('');
  const [paymentEditVillage, setPaymentEditVillage] = useState('');
  const [paymentEditSheetNo, setPaymentEditSheetNo] = useState('');
  const [showInlineMemberEdit, setShowInlineMemberEdit] = useState(false);

  // Prevent duplicate weekly payment submissions (Idempotency & Debounce)
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Optimistic member deletion
  const [deletedMemberIds, setDeletedMemberIds] = useState<Set<string>>(new Set());

  // Custom villages management
  const [customVillages, setCustomVillages] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('shri_sai_custom_villages');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const handleAddNewVillage = (vName: string) => {
    const trimmed = vName.trim();
    if (!trimmed) return;
    if (!customVillages.includes(trimmed)) {
      const updated = [...customVillages, trimmed];
      setCustomVillages(updated);
      try {
        localStorage.setItem('shri_sai_custom_villages', JSON.stringify(updated));
      } catch (e) {}
    }
    setNewVillage(trimmed);
    showCardToast(`✓ नवीन गाव "${trimmed}" यशस्वीरित्या जोडले गेले!`, 'success');
  };

  const handleDeleteMemberOptimistic = (member: CardMember) => {
    if (confirm(`तुम्हाला नक्की कार्ड #${member.cardNumber} (${member.customerName}) हटवायचे आहे का?\n\nटीप: हे कार्ड हटवल्यास एजंटचे कमिशन व नवीन कार्ड बोनस आपोआप वजा (Rollback) होईल.`)) {
      setDeletedMemberIds((prev) => new Set(prev).add(member.id));
      showCardToast(`✓ कार्ड #${member.cardNumber} (${member.customerName}) हटवले आणि कमिशन रोलबॅक केले.`, 'success');
      if (onDeleteMember) {
        onDeleteMember(member.id);
      }
    }
  };

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

  // Handle external trigger from QuickActionBar
  useEffect(() => {
    if (initialAction === 'payment') {
      setShowPaymentModal(true);
      onClearInitialAction?.();
    } else if (initialAction === 'add-card') {
      setShowAddCardModal(true);
      onClearInitialAction?.();
    } else if (initialAction === 'refund') {
      setShowRefundModal(true);
      onClearInitialAction?.();
    } else if (initialAction === 'delivery-challan') {
      setShowDeliveryChallanModal(true);
      onClearInitialAction?.();
    }
  }, [initialAction, onClearInitialAction]);

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

  // List of distinct villages (including custom added villages)
  const villageList = useMemo(() => {
    const vList = members
      .map((m) => m.village?.trim())
      .filter((v): v is string => Boolean(v && v.length > 0));
    const defaults = ['Bori', 'Hingni', 'Devnagar', 'Kelhzar', 'Vayfad', 'Khadki', 'Seloo', 'Deoli', 'Pulgaon', 'Wardha'];
    return Array.from(new Set([...defaults, ...customVillages, ...vList])).sort();
  }, [members, customVillages]);

  // List of distinct agents
  const agentList = useMemo(() => {
    const fromMembers = members
      .map((m) => m.agentName?.trim())
      .filter((a): a is string => Boolean(a && a.length > 0));
    const fromStaff = staff.map((s) => s.name.trim());
    const defaults = ['Rahul Sharma', 'Sachin Deshmukh', 'Pooja Patil'];
    return Array.from(new Set([...defaults, ...fromStaff, ...fromMembers])).sort();
  }, [members, staff]);

  // Pre-calculate overdue counts for quick badges and filtering (aligned with OverdueRemindersModal)
  const overdueMap = useMemo(() => {
    const txByCard = new Map<number, CardTransaction[]>();
    transactions.forEach((t) => {
      const arr = txByCard.get(t.cardNumber) || [];
      arr.push(t);
      txByCard.set(t.cardNumber, arr);
    });

    const map = new Map<string, { overdueCount: number; overdueAmount: number }>();
    members.forEach((m) => {
      const mTx = txByCard.get(m.cardNumber) || [];
      const isWeekly = m.schemeId === 'scheme3' || (m.schemeName && m.schemeName.includes('Week'));
      const installmentAmount = isWeekly ? 250 : 1000;
      const totalTargetInstallments = isWeekly ? 52 : 30;

      const weeklyPayments = mTx.filter((t) => t.type === 'WeeklyPayment');
      const paidInstallments =
        weeklyPayments.length > 0
          ? weeklyPayments.length
          : Math.floor((m.totalDeposited || 0) / installmentAmount);

      let expectedInstallments = 1;
      if (m.joiningDate) {
        const join = new Date(m.joiningDate);
        const now = new Date();
        if (isWeekly) {
          const diffTime = Math.abs(now.getTime() - join.getTime());
          const weeksPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7)) + 1;
          expectedInstallments = Math.max(1, Math.min(totalTargetInstallments, weeksPassed));
        } else {
          const monthsPassed =
            (now.getFullYear() - join.getFullYear()) * 12 +
            (now.getMonth() - join.getMonth()) +
            1;
          expectedInstallments = Math.max(1, Math.min(totalTargetInstallments, monthsPassed));
        }
      } else {
        expectedInstallments = 4;
      }

      const overdueCount = Math.max(0, expectedInstallments - paidInstallments);
      const overdueAmount = overdueCount * installmentAmount;
      map.set(m.id, { overdueCount, overdueAmount });
    });
    return map;
  }, [members, transactions]);

  const totalOverdueMembersCount = useMemo(() => {
    let count = 0;
    overdueMap.forEach((val) => {
      if (val.overdueCount >= 2) count++;
    });
    return count;
  }, [overdueMap]);

  // Filtered members list (with optimistic deleted member exclusions)
  const filteredMembers = useMemo(() => {
    return members
      .filter((m) => !deletedMemberIds.has(m.id))
      .filter((m) => {
        const matchesScheme =
          selectedSchemeFilter === 'all' || m.schemeId === selectedSchemeFilter;
        const matchesVillage =
          selectedVillageFilter === 'all' || m.village === selectedVillageFilter;
        const matchesAgent =
          selectedAgentFilter === 'all' || m.agentName === selectedAgentFilter;
        const matchesOverdue = overdueFilterOnly ? (overdueMap.get(m.id)?.overdueCount || 0) >= 2 : true;
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
        return matchesScheme && matchesVillage && matchesAgent && matchesOverdue && matchesSearch;
      });
  }, [members, deletedMemberIds, selectedSchemeFilter, selectedVillageFilter, selectedAgentFilter, overdueFilterOnly, overdueMap, searchQuery]);

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

  // Handle Weekly Payment Submit (Debounced and Idempotent)
  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentSelectedCard || paymentAmount <= 0 || isSubmittingPayment) return;

    setIsSubmittingPayment(true);

    try {
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

      // Auto-send Marathi WhatsApp receipt if customer has mobile number
      if (sendWhatsAppOnPayment && activeCard.phone && activeCard.phone.trim().length >= 10) {
        const cleanPhone = activeCard.phone.replace(/[^0-9]/g, '');
        const groupLink = settings.whatsappGroupLink || 'https://chat.whatsapp.com/CLcaeUq1bHH1RE0203oPaP?s=cl&p=a&mlu=4&ilr=4';
        const waMessage = encodeURIComponent(
          `*${settings.businessName || 'SHRI SAI ENTERPRISES'}*\n` +
          `*साप्ताहिक बचत पावती (Weekly Payment Receipt)*\n` +
          `--------------------------------\n` +
          `पावती क्र.: *${receiptNo}*\n` +
          `तारीख: ${date}\n` +
          `कार्ड क्र.: *#${activeCard.cardNumber}* (${activeCard.schemeName})\n` +
          `नाव: *${activeCard.customerName}*\n` +
          (activeCard.village ? `गाव: ${activeCard.village}\n` : '') +
          (activeCard.sheetNo ? `शीट क्र.: ${activeCard.sheetNo}\n` : '') +
          `जमा रक्कम: *₹${(Number(paymentAmount) || 0).toLocaleString()}* (Week ${paymentWeekNo})\n` +
          `पेमेंट मोड: ${paymentMode} | कलेक्शन एजंट: ${finalAgent}\n` +
          `खात्यात एकूण शिल्लक जमा: *₹${(Number(newBalance) || 0).toLocaleString()}*\n` +
          `--------------------------------\n` +
          `👉 श्री साई एंटरप्रायझेस अधिकृत व्हॉट्सॲप ग्रुप जॉईन करा:\n${groupLink}\n\n` +
          `धन्यवाद! - श्री साई इंटरप्राइजेस, वर्धा\n` +
          `📞 संपर्क: 8766486915 / 8600122798\n` +
          `🌐 वेबसाईट: ${settings.domainName || 'shrisaient.in'}`
        );
        window.open(`https://wa.me/91${cleanPhone}?text=${waMessage}`, '_blank');
      }

      // Success flash notification
      setLastActionMessage({
        title: `₹${(Number(paymentAmount) || 0).toLocaleString()} साप्ताहिक हप्ता जमा झाला!`,
        text: `कार्ड #${activeCard.cardNumber} (${activeCard.customerName}) | नवीन शिल्लक: ₹${(Number(newBalance) || 0).toLocaleString()} | एजंट: ${finalAgent}${isInfoChanged ? ' (माहिती अपडेट झाली)' : ''}`,
        card: { ...activeCard, netBalance: newBalance },
      });

      // Reset Form, stay on this page
      setShowPaymentModal(false);
      setPaymentRemarks('');
      setPaymentCardSearch('');
      setPaymentSelectedCard(null);
    } finally {
      setTimeout(() => {
        setIsSubmittingPayment(false);
      }, 600);
    }
  };

  // Handle Refund Submit (Restricted to Completed cards per official shop rule)
  const handleRefundSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundSelectedCard || refundAmount <= 0) return;

    // Strict Rule: Cash refund only allowed when card scheme is completed (30 months / full scheme paid)
    const completed = isCardFullyCompleted(refundSelectedCard);
    if (!completed && !refundAcknowledgeRule) {
      showCardToast(
        `⛔ कॅश रिफंड नियम: हे कार्ड अद्याप पूर्ण भरलेले नाही (Status: ${refundSelectedCard.status}). नियमानुसार कॅश रिफंड फक्त ३० महिने योजना पूर्ण भरल्यावरच मिळतो! चालू कार्डवर मधेच रोख परतावा मिळत नाही.`,
        'error'
      );
      return;
    }

    if (refundAmount > refundSelectedCard.netBalance) {
      showCardToast(
        `Refund amount (₹${refundAmount}) cannot exceed current card balance (₹${refundSelectedCard.netBalance})!`,
        'error'
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

  // Marathi WhatsApp share for member passbook
  const handleShareWhatsApp = (member: CardMember) => {
    const memberTxs = transactions.filter((t) => t.cardNumber === member.cardNumber);
    const text = buildCustomerPassbookWhatsAppText(member, memberTxs, settings.businessName || 'SHRI SAI ENTERPRISES, WARDHA');
    const phone = member.phone ? member.phone.replace(/[^0-9]/g, '') : '';
    const url = phone ? `https://wa.me/91${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 relative">
      {/* In-app Toast */}
      {cardToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className={`px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2.5 border text-xs font-bold backdrop-blur-md ${
            cardToast.type === 'error'
              ? 'bg-rose-950/95 text-rose-100 border-rose-700'
              : 'bg-emerald-950/95 text-emerald-100 border-emerald-600'
          }`}>
            <span>{cardToast.type === 'error' ? '❌' : '✓'}</span>
            <span>{cardToast.text}</span>
            <button
              type="button"
              onClick={() => setCardToast(null)}
              className="ml-1 text-xs opacity-70 hover:opacity-100 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Weekly Card Scheme Management (कार्ड योजना)
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-xs shrink-0">
              3 Schemes
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
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
            type="button"
            onClick={() => setShowAgentCollectionModal(true)}
            className="px-3.5 py-2 rounded-xl bg-blue-50 border border-blue-300 text-blue-900 text-xs font-bold hover:bg-blue-100 transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="दैनिक हप्ता वसुली पत्रक (Daily Agent Beat Sheet Report)"
          >
            <Printer className="w-4 h-4 text-blue-600" />
            <span>📄 वसुली अहवाल (Beat Sheet)</span>
          </button>

          <button
            type="button"
            onClick={() => setShowOverdueRemindersModal(true)}
            className="px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold hover:bg-amber-100 transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="प्रलंबित हप्ते WhatsApp स्मरणपत्र (2+ Overdue Reminders)"
          >
            <Clock className="w-4 h-4 text-amber-600" />
            <span>🔔 हप्ता आठवण (Overdue)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setDeliveryChallanInitialMember(null);
              setShowDeliveryChallanModal(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-orange-50 border border-orange-300 text-orange-950 text-xs font-bold hover:bg-orange-100 transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="३० महिने योजना पूर्ण झाल्यावर किंवा लकी ड्रॉ विजेत्याला वस्तू देताना अधिकृत डिलिव्हरी पावती व चलन"
          >
            <Truck className="w-4 h-4 text-orange-600" />
            <span>🚚 बक्षीस वितरण चलन (Challan)</span>
          </button>

          <button
            type="button"
            onClick={() => setShowWhatsAppGroupModal(true)}
            className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold hover:bg-emerald-100 transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="कार्ड ग्राहकांसाठी WhatsApp ग्रुप लिंक व QR कोड"
          >
            <Share2 className="w-4 h-4 text-emerald-600" />
            <span>💬 WhatsApp ग्रुप</span>
          </button>

          <button
            onClick={() => {
              const el = document.getElementById('card-scheme-search-input');
              if (el) {
                el.focus();
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }}
            className="px-3.5 py-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-bold hover:bg-indigo-100 transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="कोणत्याही कार्डचे बँक पासबुक उघडा (Search & Open Bank Passbook)"
          >
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <span>📖 बँक पासबुक (Passbook)</span>
          </button>

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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
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
            <span className="text-xs font-medium text-slate-500">Total Refunded</span>
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

        <div
          onClick={() => setOverdueFilterOnly(!overdueFilterOnly)}
          className={`rounded-2xl border p-4 shadow-2xs transition cursor-pointer ${
            totalOverdueMembersCount > 0
              ? overdueFilterOnly
                ? 'bg-amber-600 text-white border-amber-700'
                : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
              : 'bg-white text-slate-900 border-slate-200'
          }`}
          title="प्रलंबित हप्ते (२+ हप्ते बाकी असलेले सभासद)"
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold ${overdueFilterOnly ? 'text-white' : 'text-amber-800'}`}>
              ⚠️ Overdue Defaulters
            </span>
            <span className={`p-1 rounded-lg ${overdueFilterOnly ? 'bg-amber-700 text-white' : 'bg-amber-100 text-amber-700'}`}>
              <Clock className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-2xl font-black mt-2">{totalOverdueMembersCount}</p>
          <p className={`text-[11px] mt-1 font-semibold ${overdueFilterOnly ? 'text-amber-100' : 'text-amber-700'}`}>
            {overdueFilterOnly ? '✓ फिल्टर चालू (Clear)' : '२+ हप्ते थकबाकी (Filter)'}
          </p>
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
              id="card-scheme-search-input"
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

                  <td className="py-3 px-4 text-right font-bold font-mono-num text-base sm:text-xs">
                    <span className="text-emerald-600 dark:text-emerald-400">
                      ₹{(member.totalDeposited ?? 0).toLocaleString()}
                    </span>
                    {overdueMap.get(member.id)?.overdueCount && (overdueMap.get(member.id)!.overdueCount >= 2) ? (
                      <span
                        className="block text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded px-1 py-0.5 mt-0.5 text-right w-fit ml-auto"
                        title={`${overdueMap.get(member.id)!.overdueCount} हप्ते प्रलंबित आहेत (थकबाकी: ₹${overdueMap.get(member.id)!.overdueAmount.toLocaleString()})`}
                      >
                        ⚠️ {overdueMap.get(member.id)!.overdueCount} हप्ते बाकी
                      </span>
                    ) : null}
                  </td>

                  <td className="py-3 px-4 text-right font-semibold text-rose-600 dark:text-rose-400 font-mono-num text-base sm:text-xs">
                    {(member.totalRefunded ?? 0) > 0 ? `₹${(member.totalRefunded ?? 0).toLocaleString()}` : '₹0'}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <span className="font-bold text-slate-900 dark:text-white font-mono-num text-base sm:text-sm">
                      ₹{(member.netBalance ?? 0).toLocaleString()}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5 flex-wrap">
                      <button
                        onClick={() => setSelectedMemberForPassbook(member)}
                        className="min-h-[44px] px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition cursor-pointer shadow-xs flex items-center gap-1.5 shrink-0"
                        title="बँक पासबुक उघडा (View Full Bank Passbook & Account Details)"
                      >
                        <BookOpen className="w-4 h-4" />
                        <span>📖 पासबुक</span>
                      </button>

                      <button
                        onClick={() => {
                          setPaymentSelectedCard(member);
                          setPaymentAgentName(activeAgent);
                          setShowPaymentModal(true);
                        }}
                        className="min-h-[44px] px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer shadow-xs flex items-center gap-1.5 shrink-0"
                        title="हप्ता जमा करा (Deposit Weekly Payment)"
                      >
                        <PlusCircle className="w-4 h-4" />
                        <span>+ हप्ता जमा</span>
                      </button>

                      <button
                        onClick={() => {
                          setRefundSelectedCard(member);
                          setRefundAgentName(activeAgent);
                          setShowRefundModal(true);
                        }}
                        className="min-h-[44px] px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 font-bold text-xs transition cursor-pointer border border-rose-200 dark:border-rose-800 flex items-center gap-1 shrink-0"
                        title="रक्कम परतावा (Refund / Return)"
                      >
                        <span>रक्कम परतावा</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setEditingMember(member)}
                        className="min-h-[44px] px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900 text-amber-800 dark:text-amber-300 font-bold text-xs transition cursor-pointer border border-amber-200 dark:border-amber-800 flex items-center gap-1.5 shrink-0"
                        title="माहिती दुरुस्त करा (Edit Name, Phone, Village)"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>✏️ एडिट</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteMemberOptimistic(member)}
                        className="min-h-[44px] px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 font-bold text-xs transition cursor-pointer border border-rose-200 dark:border-rose-800 flex items-center gap-1.5 shrink-0"
                        title="कार्ड मेंबर हटवा (Delete Card Member & Rollback Commission)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>🗑️ हटवा</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setDeliveryChallanInitialMember(member);
                          setShowDeliveryChallanModal(true);
                        }}
                        className="min-h-[44px] px-3 py-2 text-orange-700 dark:text-orange-300 hover:text-orange-800 bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 rounded-xl transition cursor-pointer border border-orange-200 dark:border-orange-800 flex items-center gap-1.5 shrink-0 font-bold text-xs"
                        title="बक्षीस / वस्तू वितरण चलन पावती (Delivery Challan)"
                      >
                        <Truck className="w-3.5 h-3.5 text-orange-600" />
                        <span>🚚 चलन</span>
                      </button>

                      <button
                        onClick={() => handleShareWhatsApp(member)}
                        className="min-h-[44px] px-3 py-2 text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 rounded-xl transition cursor-pointer border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 shrink-0 font-bold text-xs"
                        title="Share Passbook on WhatsApp"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>💬 WhatsApp</span>
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Village (गाव) *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const entered = prompt('नवीन गावाचे नाव टाका (उदा. Deoli, Seloo, Pulgaon, Nachangaon):');
                        if (entered && entered.trim()) {
                          handleAddNewVillage(entered.trim());
                        }
                      }}
                      className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+ नवीन गाव जोडा</span>
                    </button>
                  </div>
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
                    <option value="other">+ इतर गाव टाईप करा (Type Other Village)...</option>
                  </select>

                  {newVillage === 'other' && (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <input
                        type="text"
                        required
                        value={newCustomVillage}
                        onChange={(e) => setNewCustomVillage(e.target.value)}
                        placeholder="गावाचे नाव टाईप करा..."
                        className="flex-1 px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newCustomVillage.trim()) {
                            handleAddNewVillage(newCustomVillage.trim());
                            setNewCustomVillage('');
                          }
                        }}
                        className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shrink-0 cursor-pointer"
                      >
                        जोडा
                      </button>
                    </div>
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
                                showCardToast('सफलता: कार्ड मेंबर माहिती (नाव, फोन, गाव) त्वरित अपडेट करण्यात आली!', 'success');
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

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setShowPaymentModal(false)}
                      className="min-h-[44px] px-5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition"
                    >
                      रद्द करा (Cancel)
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingPayment || paymentAmount <= 0}
                      className="min-h-[44px] px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs sm:text-sm font-bold shadow-md cursor-pointer transition flex items-center gap-2"
                    >
                      {isSubmittingPayment ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>हप्ता जमा होत आहे...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>हप्ता जमा करा (₹{(paymentAmount || 0).toLocaleString()})</span>
                        </>
                      )}
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
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl my-auto border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Return / Refund to Card Member</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  ३० महिने योजना पूर्ण झाल्यावर ठेवीचा परतावा (Cash Refund)
                </p>
              </div>
              <button
                onClick={() => setShowRefundModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Official Refund Rule Banner */}
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl space-y-1 text-xs text-amber-950 dark:text-amber-200">
              <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-300">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>अधिकृत कॅश रिफंड नियम (Official Refund Policy):</span>
              </div>
              <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
                कॅश रिफंड (रोख परतावा) <strong>फक्त योजना पूर्ण भरल्यावरच (३० महिने पूर्ण)</strong> केला जाऊ शकतो. चालू/अपूर्ण कार्डवर मधेच कॅश रिफंड दिला जाणार नाही. (अपूर्ण कार्डवर ग्राहक किमान ५०% डाऊन पेमेंटसह वस्तू खरेदी करू शकतात).
              </p>
            </div>

            <form onSubmit={handleRefundSubmit} className="space-y-4">
              {!refundSelectedCard ? (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Select Member Card *
                    </label>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      (पूर्ण झालेले कार्ड प्राधान्याने निवडा)
                    </span>
                  </div>
                  <input
                    type="text"
                    value={refundCardSearch}
                    onChange={(e) => setRefundCardSearch(e.target.value)}
                    placeholder="Search Card # or Name..."
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm mb-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                  <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                    {members
                      .filter(
                        (m) =>
                          m.netBalance > 0 &&
                          (m.cardNumber.toString().includes(refundCardSearch) ||
                            m.customerName.toLowerCase().includes(refundCardSearch.toLowerCase()) ||
                            (m.village && m.village.toLowerCase().includes(refundCardSearch.toLowerCase())))
                      )
                      .slice(0, 20)
                      .map((m) => {
                        const isCompleted = isCardFullyCompleted(m);
                        return (
                          <div
                            key={m.id}
                            onClick={() => {
                              setRefundSelectedCard(m);
                              setRefundAmount(Math.min(5000, m.netBalance));
                              setRefundAcknowledgeRule(false);
                            }}
                            className="p-2.5 text-xs hover:bg-rose-50 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between transition"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-rose-600 dark:text-rose-400 font-mono">#{m.cardNumber}</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200">{m.customerName}</span>
                                {isCompleted ? (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">
                                    ✓ पूर्ण (पात्र)
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-medium">
                                    ⏳ अपूर्ण (चालू)
                                  </span>
                                )}
                              </div>
                              <span className="text-slate-500 dark:text-slate-400 text-[11px] block mt-0.5">
                                {m.village ? `📍 ${m.village}` : ''} • जमा: ₹{(m.totalDeposited || 0).toLocaleString()}
                              </span>
                            </div>
                            <span className="font-bold text-slate-900 dark:text-white">Balance: ₹{m.netBalance.toLocaleString()}</span>
                          </div>
                        );
                      })}
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
                        onClick={() => {
                          setRefundSelectedCard(null);
                          setRefundAcknowledgeRule(false);
                        }}
                        className="text-[11px] text-rose-600 dark:text-rose-400 underline font-medium cursor-pointer"
                      >
                        Change Card
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-slate-900 dark:text-white text-sm">{refundSelectedCard.customerName}</p>
                      {isCardFullyCompleted(refundSelectedCard) ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] bg-emerald-100 text-emerald-800 font-bold">
                          ✓ योजना पूर्ण (Completed)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[11px] bg-amber-100 text-amber-800 font-bold">
                          ⏳ योजना अपूर्ण (Active)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Current Deposited Balance:{' '}
                      <strong className="text-rose-700 dark:text-rose-300 font-bold">
                        ₹{(refundSelectedCard.netBalance ?? 0).toLocaleString()}
                      </strong>
                    </p>
                  </div>

                  {/* Warning if card is not completed */}
                  {!isCardFullyCompleted(refundSelectedCard) && (
                    <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-xl space-y-2 text-xs text-rose-950 dark:text-rose-200">
                      <div className="flex items-center gap-1.5 font-bold text-rose-800 dark:text-rose-300">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>चेतावणी: हे कार्ड अद्याप पूर्ण भरलेले नाही!</span>
                      </div>
                      <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
                        दुकान नियमानुसार कॅश रिफंड फक्त योजना पूर्ण भरल्यावरच (३० महिने पूर्ण) दिला जातो. चालू कार्डवर मधेच रोख परतावा दिला जात नाही.
                      </p>
                      {onUpdateMember && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = { ...refundSelectedCard, status: 'Completed' as const };
                            onUpdateMember(updated);
                            setRefundSelectedCard(updated);
                            showCardToast(`✓ कार्ड #${refundSelectedCard.cardNumber} चे स्टेटस 'Completed' केले!`, 'success');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer transition shadow-xs flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          ग्राहकाचे ३० महिने पूर्ण झाले आहेत (Mark as Completed)
                        </button>
                      )}
                      <label className="flex items-start gap-2 pt-1 font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={refundAcknowledgeRule}
                          onChange={(e) => setRefundAcknowledgeRule(e.target.checked)}
                          className="w-4 h-4 mt-0.5 accent-rose-600 rounded"
                        />
                        <span className="text-[11px] leading-tight text-rose-900 dark:text-rose-300">
                          मी पडताळणी केली आहे, ३० महिने योजना पूर्ण भरली असल्याने कॅश रिफंड देण्यास मान्यता देत आहे.
                        </span>
                      </label>
                    </div>
                  )}

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
                      placeholder="e.g. ३० महिने योजना पूर्ण झाल्यानंतर ठेव परतावा (Cash refund after 30 months completed)"
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
                      disabled={!isCardFullyCompleted(refundSelectedCard) && !refundAcknowledgeRule}
                      className={`px-5 py-2 rounded-lg text-xs font-semibold shadow-xs transition ${
                        !isCardFullyCompleted(refundSelectedCard) && !refundAcknowledgeRule
                          ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                          : 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer'
                      }`}
                      title={
                        !isCardFullyCompleted(refundSelectedCard) && !refundAcknowledgeRule
                          ? 'कॅश रिफंडसाठी कार्ड पूर्ण असणे किंवा पडताळणी संमती आवश्यक आहे.'
                          : ''
                      }
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
                    value={editingMember.cardNumber ?? ''}
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
                  value={editingMember.customerName || ''}
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

      {/* Agent Collection Sheet Modal */}
      {showAgentCollectionModal && (
        <AgentCollectionSheetModal
          isOpen={showAgentCollectionModal}
          onClose={() => setShowAgentCollectionModal(false)}
          cardMembers={members}
          cardTransactions={transactions}
          settings={settings}
          preselectedAgent={activeAgent}
        />
      )}

      {/* Overdue Payment Reminders Modal */}
      {showOverdueRemindersModal && (
        <OverdueRemindersModal
          isOpen={showOverdueRemindersModal}
          onClose={() => setShowOverdueRemindersModal(false)}
          cardMembers={members}
          cardTransactions={transactions}
          settings={settings}
        />
      )}

      {/* WhatsApp Group Invite Modal */}
      {showWhatsAppGroupModal && (
        <WhatsAppGroupInviteModal
          isOpen={showWhatsAppGroupModal}
          onClose={() => setShowWhatsAppGroupModal(false)}
          cardMembers={members}
          settings={settings}
        />
      )}

      {/* Delivery & Prize Challan Modal */}
      {showDeliveryChallanModal && (
        <DeliveryChallanModal
          isOpen={showDeliveryChallanModal}
          onClose={() => {
            setShowDeliveryChallanModal(false);
            setDeliveryChallanInitialMember(null);
          }}
          cardMembers={members}
          settings={settings}
          initialMember={deliveryChallanInitialMember}
        />
      )}
    </div>
  );
};
