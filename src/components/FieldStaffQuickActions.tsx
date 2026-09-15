import React, { useState, useMemo, useEffect } from 'react';
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
  BookOpen,
  RotateCcw,
  UserPlus,
  ArrowUpRight,
  Edit2,
  Save,
  Clock
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
import { CollectionSlipModal } from './CollectionSlipModal';
import { CardPassbookModal } from './CardPassbookModal';

export type FieldActionTab = 'card-collection' | 'card-ledger' | 'receipt' | 'new-card' | 'sales' | 'cash-refund' | 'ledger';

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
  onAddMember?: (member: Omit<CardMember, 'id'>) => void;
  onUpdateMember?: (id: string, updates: Partial<CardMember>) => void;
  onNavigateTab?: (tabName: any) => void;
}

export const FieldStaffQuickActions: React.FC<FieldStaffQuickActionsProps> = ({
  isOpen,
  onClose,
  initialTab = 'card-collection',
  cardMembers,
  cardTransactions = [],
  customers,
  stock,
  settings,
  currentAgentName = 'Staff Agent',
  onRecordCardPayment,
  onSaveSalesEntry,
  onSettleCustomerPayment,
  onAddMember,
  onUpdateMember,
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
  const [collectionSchemeFilter, setCollectionSchemeFilter] = useState<CardSchemeId | 'all'>('all');
  const [selectedMember, setSelectedMember] = useState<CardMember | null>(null);
  const [collectionAmount, setCollectionAmount] = useState<number>(500);
  const [collectionWeekNo, setCollectionWeekNo] = useState<number>(1);
  const [collectionMode, setCollectionMode] = useState<'Cash' | 'Online'>('Cash');
  const [agentNameInput, setAgentNameInput] = useState<string>(() => {
    return localStorage.getItem('active_card_agent') || currentAgentName || 'Staff Agent';
  });
  const [collectionRemarks, setCollectionRemarks] = useState('');

  // Inline edit state for card member in weekly payment flow
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editVillage, setEditVillage] = useState('');
  const [editSheetNo, setEditSheetNo] = useState('');
  const [isEditingMember, setIsEditingMember] = useState(false);
  const [editMemberSuccess, setEditMemberSuccess] = useState('');

  useEffect(() => {
    if (selectedMember) {
      setEditCustomerName(selectedMember.customerName || '');
      setEditPhone(selectedMember.phone || '');
      setEditVillage(selectedMember.village || '');
      setEditSheetNo(selectedMember.sheetNo || '');
      setIsEditingMember(false);
      setEditMemberSuccess('');
    }
  }, [selectedMember]);

  const handleSaveMemberEdits = () => {
    if (!selectedMember || !onUpdateMember) return;
    const updates: Partial<CardMember> = {
      customerName: editCustomerName.trim() || selectedMember.customerName,
      phone: editPhone.trim() || undefined,
      village: editVillage.trim() || undefined,
      sheetNo: editSheetNo.trim() || undefined,
    };
    onUpdateMember(selectedMember.id, updates);
    setSelectedMember((prev) => (prev ? { ...prev, ...updates } : null));
    setEditMemberSuccess('✓ माहिती तात्काळ सेव्ह झाली!');
    setTimeout(() => setEditMemberSuccess(''), 2500);
  };

  // -------------------------------------------------------------
  // 1B. NEW CARD CREATION STATE (नवीन कार्ड नोंदणी)
  // -------------------------------------------------------------
  const [newCardScheme, setNewCardScheme] = useState<CardSchemeId>('scheme1');
  const [newCardNumber, setNewCardNumber] = useState<number>(() => {
    const s1Members = cardMembers.filter((m) => m.schemeId === 'scheme1');
    return s1Members.length > 0 ? Math.max(...s1Members.map((m) => m.cardNumber)) + 1 : 1001;
  });
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newVillage, setNewVillage] = useState('Bori');
  const [newCustomVillage, setNewCustomVillage] = useState('');
  const [newSheetNo, setNewSheetNo] = useState('');
  const [newAgentName, setNewAgentName] = useState(() => {
    return localStorage.getItem('active_card_agent') || currentAgentName || 'Staff Agent';
  });
  const [newInitialDeposit, setNewInitialDeposit] = useState<number>(0);

  const getNextCardNoForScheme = (schemeId: CardSchemeId) => {
    const sMembers = cardMembers.filter((m) => m.schemeId === schemeId);
    const cfg = SCHEMES_CONFIG.find((s) => s.id === schemeId);
    const start = cfg?.startCardNo || 1001;
    return sMembers.length > 0 ? Math.max(...sMembers.map((m) => m.cardNumber)) + 1 : start;
  };

  useEffect(() => {
    setNewCardNumber(getNextCardNoForScheme(newCardScheme));
  }, [newCardScheme, cardMembers]);

  // Village list derived from members
  const villageList = useMemo(() => {
    const vList = cardMembers
      .map((m) => m.village?.trim())
      .filter((v): v is string => Boolean(v && v.length > 0));
    const defaults = ['Bori', 'Hingni', 'Devnagar', 'Kelhzar', 'Vayfad', 'Khadki'];
    return Array.from(new Set([...defaults, ...vList])).sort();
  }, [cardMembers]);

  // -------------------------------------------------------------
  // 1C. CARD LEDGER STATE (कार्ड हिशोब लेजर व पासबुक)
  // -------------------------------------------------------------
  const [cardLedgerSearch, setCardLedgerSearch] = useState('');
  const [cardLedgerSchemeFilter, setCardLedgerSchemeFilter] = useState<CardSchemeId | 'all'>('all');
  const [cardLedgerSelectedMember, setCardLedgerSelectedMember] = useState<CardMember | null>(null);
  const [ledgerIsEditingMember, setLedgerIsEditingMember] = useState(false);
  const [ledgerEditPhone, setLedgerEditPhone] = useState('');
  const [ledgerEditVillage, setLedgerEditVillage] = useState('');
  const [ledgerEditSheetNo, setLedgerEditSheetNo] = useState('');
  const [ledgerEditSuccess, setLedgerEditSuccess] = useState('');

  useEffect(() => {
    if (cardLedgerSelectedMember) {
      setLedgerEditPhone(cardLedgerSelectedMember.phone || '');
      setLedgerEditVillage(cardLedgerSelectedMember.village || '');
      setLedgerEditSheetNo(cardLedgerSelectedMember.sheetNo || '');
      setLedgerIsEditingMember(false);
      setLedgerEditSuccess('');
    }
  }, [cardLedgerSelectedMember]);

  const handleSaveLedgerMemberEdits = () => {
    if (!cardLedgerSelectedMember || !onUpdateMember) return;
    const updates: Partial<CardMember> = {
      phone: ledgerEditPhone.trim() || undefined,
      village: ledgerEditVillage.trim() || undefined,
      sheetNo: ledgerEditSheetNo.trim() || undefined,
    };
    onUpdateMember(cardLedgerSelectedMember.id, updates);
    setCardLedgerSelectedMember((prev) => (prev ? { ...prev, ...updates } : null));
    setLedgerEditSuccess('✓ सभासदाची माहिती दुरुस्त झाली!');
    setTimeout(() => setLedgerEditSuccess(''), 2500);
  };

  // -------------------------------------------------------------
  // 1D. POPUP MODALS (स्लिप व पासबुक पॉपअप्स)
  // -------------------------------------------------------------
  const [activeSlipModal, setActiveSlipModal] = useState<{
    transaction: CardTransaction;
    member?: CardMember;
  } | null>(null);
  const [activePassbookModal, setActivePassbookModal] = useState<CardMember | null>(null);

  // -------------------------------------------------------------
  // 1E. RECEIPTS STATE (साप्ताहिक पावती व उधार वसुली)
  // -------------------------------------------------------------
  const [receiptViewType, setReceiptViewType] = useState<'card-slips' | 'customer-khata'>('card-slips');
  const [cardSlipSearch, setCardSlipSearch] = useState('');

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
  // 4. CASH REFUND STATE (रोख परतावा / रिफंड)
  // -------------------------------------------------------------
  const [refundSearch, setRefundSearch] = useState('');
  const [refundMember, setRefundMember] = useState<CardMember | null>(null);
  const [refundAmount, setRefundAmount] = useState<string>('');
  const [refundReason, setRefundReason] = useState('Scheme Card Cash Refund / रोख परतावा');

  // -------------------------------------------------------------
  // 5. QUICK LEDGER LOOKUP (खाता बही)
  // -------------------------------------------------------------
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [viewedCustomerLedger, setViewedCustomerLedger] = useState<Customer | null>(null);

  if (!isOpen) return null;

  // Filtered card members for collection with scheme filtering & fast short-circuiting
  const filteredCardMembers = useMemo(() => {
    const pool =
      collectionSchemeFilter === 'all'
        ? cardMembers
        : cardMembers.filter((m) => m.schemeId === collectionSchemeFilter);

    const q = cardSearch.trim().toLowerCase();
    if (!q) return pool.slice(0, 15);

    const matches: CardMember[] = [];
    for (const m of pool) {
      if (
        m.cardNumber.toString().includes(q) ||
        m.customerName.toLowerCase().includes(q) ||
        (m.phone && m.phone.includes(q)) ||
        (m.village && m.village.toLowerCase().includes(q)) ||
        (m.sheetNo && m.sheetNo.toLowerCase().includes(q))
      ) {
        matches.push(m);
        if (matches.length >= 25) break;
      }
    }
    return matches;
  }, [cardMembers, cardSearch, collectionSchemeFilter]);

  // Filtered card members for Card Ledger & Statement lookup
  const filteredCardLedgerMembers = useMemo(() => {
    const pool =
      cardLedgerSchemeFilter === 'all'
        ? cardMembers
        : cardMembers.filter((m) => m.schemeId === cardLedgerSchemeFilter);

    const q = cardLedgerSearch.trim().toLowerCase();
    if (!q) return pool.slice(0, 15);

    const matches: CardMember[] = [];
    for (const m of pool) {
      if (
        m.cardNumber.toString().includes(q) ||
        m.customerName.toLowerCase().includes(q) ||
        (m.phone && m.phone.includes(q)) ||
        (m.village && m.village.toLowerCase().includes(q)) ||
        (m.sheetNo && m.sheetNo.toLowerCase().includes(q))
      ) {
        matches.push(m);
        if (matches.length >= 25) break;
      }
    }
    return matches;
  }, [cardMembers, cardLedgerSearch, cardLedgerSchemeFilter]);

  // Recent card collection receipts / slips for field staff
  const recentCardSlips = useMemo(() => {
    const q = cardSlipSearch.trim().toLowerCase();
    const sorted = [...cardTransactions].sort(
      (a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime()
    );
    if (!q) return sorted.slice(0, 30);
    return sorted
      .filter(
        (tx) =>
          tx.receiptNo?.toLowerCase().includes(q) ||
          tx.cardNumber.toString().includes(q) ||
          tx.customerName?.toLowerCase().includes(q) ||
          tx.agentName?.toLowerCase().includes(q)
      )
      .slice(0, 40);
  }, [cardTransactions, cardSlipSearch]);

  // Filtered card members for cash refund with early exit
  const filteredRefundMembers = useMemo(() => {
    const q = refundSearch.trim().toLowerCase();
    if (!q) return cardMembers.filter((m) => (m.netBalance || 0) > 0).slice(0, 8);

    const matches: CardMember[] = [];
    for (const m of cardMembers) {
      if (
        m.cardNumber.toString().includes(q) ||
        m.customerName.toLowerCase().includes(q) ||
        (m.phone && m.phone.includes(q)) ||
        (m.village && m.village.toLowerCase().includes(q))
      ) {
        matches.push(m);
        if (matches.length >= 15) break;
      }
    }
    return matches;
  }, [cardMembers, refundSearch]);

  // Filtered customers for receipt / ledger with early exit
  const filteredCustomers = useMemo(() => {
    const q = (activeTab === 'receipt' ? receiptSearch : ledgerSearch).trim().toLowerCase();
    if (!q) return customers.filter((c) => c.balanceDue > 0).slice(0, 8);

    const matches: Customer[] = [];
    for (const c of customers) {
      if (
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q))
      ) {
        matches.push(c);
        if (matches.length >= 15) break;
      }
    }
    return matches;
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

    // Auto-save member detail updates if edited during weekly collection
    const finalCustomerName = editCustomerName.trim() || selectedMember.customerName;
    const finalPhone = editPhone.trim() || selectedMember.phone;
    const finalVillage = editVillage.trim() || selectedMember.village;
    const finalSheetNo = editSheetNo.trim() || selectedMember.sheetNo;

    const hasChanges =
      finalCustomerName !== selectedMember.customerName ||
      finalPhone !== selectedMember.phone ||
      finalVillage !== selectedMember.village ||
      finalSheetNo !== selectedMember.sheetNo;

    if (hasChanges && onUpdateMember) {
      onUpdateMember(selectedMember.id, {
        customerName: finalCustomerName,
        phone: finalPhone || undefined,
        village: finalVillage || undefined,
        sheetNo: finalSheetNo || undefined,
      });
    }

    const receiptNo = `CS-${Date.now().toString().slice(-6)}`;
    const newBal = (selectedMember.netBalance || 0) + collectionAmount;

    const txPayload: Omit<CardTransaction, 'id' | 'createdAt'> = {
      cardId: selectedMember.id,
      cardNumber: selectedMember.cardNumber,
      schemeId: selectedMember.schemeId,
      customerName: finalCustomerName,
      customerPhone: finalPhone,
      receiptNo,
      date: new Date().toISOString().split('T')[0],
      type: 'WeeklyPayment',
      weekNumber: collectionWeekNo,
      amount: collectionAmount,
      paymentMode: collectionMode,
      agentName: agentNameInput.trim() || currentAgentName,
      remarks: collectionRemarks.trim() || `Field collection by ${agentNameInput}`,
      balanceAfter: newBal
    };

    onRecordCardPayment(txPayload);

    localStorage.setItem('active_card_agent', agentNameInput);

    const savedTx: CardTransaction = {
      ...txPayload,
      id: `tx_${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    const updatedMemberObj: CardMember = {
      ...selectedMember,
      customerName: finalCustomerName,
      phone: finalPhone,
      village: finalVillage,
      sheetNo: finalSheetNo,
      totalDeposited: (selectedMember.totalDeposited || 0) + collectionAmount,
      netBalance: newBal
    };

    setSuccessNotice(
      `पावती जतन झाली! कार्ड #${selectedMember.cardNumber} (${finalCustomerName}) साठी ₹${collectionAmount} जमा झाले.`
    );

    // Open instant slip for WhatsApp share & printing
    setActiveSlipModal({
      transaction: savedTx,
      member: updatedMemberObj
    });

    setSelectedMember(null);
    setCardSearch('');
    setCollectionRemarks('');
  };

  // Handle New Card Registration Submit (नवीन कार्ड नोंदणी)
  const handleCreateCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorNotice('');
    setSuccessNotice('');

    if (!onAddMember) {
      setErrorNotice('नवीन कार्ड जोडण्याची सुविधा सध्या उपलब्ध नाही.');
      return;
    }

    if (!newCustomerName.trim()) {
      setErrorNotice('कृपया ग्राहकाचे नाव टाका');
      return;
    }

    if (!newPhone.trim()) {
      setErrorNotice('कृपया ग्राहकाचा मोबाईल नंबर टाका');
      return;
    }

    const config = SCHEMES_CONFIG.find((s) => s.id === newCardScheme);
    if (!config) {
      setErrorNotice('कृपया योजना निवडा');
      return;
    }

    if (newCardNumber < config.startCardNo || newCardNumber > config.endCardNo) {
      setErrorNotice(
        `${config.name} साठी कार्ड नंबर ${config.startCardNo} ते ${config.endCardNo} दरम्यान असणे आवश्यक आहे.`
      );
      return;
    }

    // Check if card number already exists in this scheme
    const exists = cardMembers.some(
      (m) => m.schemeId === newCardScheme && m.cardNumber === newCardNumber
    );
    if (exists) {
      setErrorNotice(
        `कार्ड #${newCardNumber} या योजनेत आधीच नोंदणीकृत आहे. कृपया दुसरा कार्ड नंबर टाका.`
      );
      return;
    }

    const joiningDate = new Date().toISOString().split('T')[0];
    const finalVillage = newVillage === 'other' ? newCustomVillage.trim() : newVillage.trim();
    const finalAgent = newAgentName.trim() || agentNameInput.trim() || currentAgentName;
    const finalUniqueId = `SAI-${newCardScheme.toUpperCase()}-${newCardNumber}`;

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
      notes: `Card opened in field by Agent ${finalAgent} with ₹50 fee.${newInitialDeposit > 0 ? ` Initial deposit: ₹${newInitialDeposit}` : ''}${newSheetNo ? ` • Sheet #${newSheetNo}` : ''}${finalVillage ? ` • Village: ${finalVillage}` : ''}`,
    });

    // Record fee transaction
    onRecordCardPayment({
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
      remarks: `Card Registration Fee (₹50) collected in field by ${finalAgent}`,
      balanceAfter: 0,
    });

    // If initial deposit was collected
    if (newInitialDeposit > 0) {
      onRecordCardPayment({
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

    localStorage.setItem('active_card_agent', finalAgent);

    setSuccessNotice(
      `नवीन कार्ड #${newCardNumber} यशस्वीरित्या जारी झाले! ग्राहक: ${newCustomerName.trim()} | गाव: ${finalVillage || 'N/A'} | फी: ₹50 जमा.${newInitialDeposit > 0 ? ` (प्रथम हफ्ता: ₹${newInitialDeposit})` : ''}`
    );

    // Reset Form for next fast entry, increment card number
    setNewCustomerName('');
    setNewPhone('');
    setNewSheetNo('');
    setNewCustomVillage('');
    setNewInitialDeposit(0);
    setNewCardNumber((prev) => prev + 1);
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

  // Handle Cash Refund Submit
  const handleRefundSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorNotice('');
    setSuccessNotice('');

    if (!refundMember) {
      setErrorNotice('कृपया ज्या कार्डचा रोख परतावा करायचा आहे ते कार्ड निवडा');
      return;
    }

    const amt = parseFloat(refundAmount) || 0;
    if (amt <= 0) {
      setErrorNotice('कृपया योग्य परतावा रक्कम टाका');
      return;
    }

    if (amt > (refundMember.netBalance || 0)) {
      setErrorNotice(`परतावा रक्कम शिल्लक जमा रकमेपेक्षा (₹${(refundMember.netBalance || 0).toLocaleString()}) जास्त असू शकत नाही.`);
      return;
    }

    const receiptNo = `RF-${Date.now().toString().slice(-6)}`;
    const newBal = Math.max(0, (refundMember.netBalance || 0) - amt);

    onRecordCardPayment({
      cardId: refundMember.id,
      cardNumber: refundMember.cardNumber,
      schemeId: refundMember.schemeId,
      customerName: refundMember.customerName,
      customerPhone: refundMember.phone,
      receiptNo,
      date: new Date().toISOString().split('T')[0],
      type: 'Refund',
      amount: amt,
      paymentMode: 'Cash',
      agentName: agentNameInput.trim() || currentAgentName,
      remarks: refundReason.trim() || `Cash Refund by ${agentNameInput}`,
      balanceAfter: newBal
    });

    setSuccessNotice(`रोख परतावा यशस्वी! कार्ड #${refundMember.cardNumber} (${refundMember.customerName}) यांना ₹${amt} रोख परत केले.`);
    setRefundMember(null);
    setRefundAmount('');
    setRefundSearch('');
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
        <div className="bg-[#00523f] text-white p-4 sm:p-5 flex items-center justify-between border-b border-emerald-800/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-800/60 text-emerald-200 font-black flex items-center justify-center border border-emerald-600/40">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg tracking-tight">
                  फिल्ड स्टाफ क्विक काउंटर (Field Counter)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/20 text-white border border-white/30">
                  Mobile Staff
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                साप्ताहिक हफ्ता कलेक्शन, नवीन बिल, पावती व ग्राहक खातेवही
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/30 text-emerald-100 hover:text-white flex items-center justify-center transition cursor-pointer"
            title="बंद करा (Close)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 6 Essential Field Staff Tabs with High-Contrast Design */}
        <div className="bg-[#F8F9FA] p-2 sm:p-2.5 grid grid-cols-6 gap-1 sm:gap-1.5 border-b border-slate-200 text-xs font-bold shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveTab('card-collection');
              setErrorNotice('');
              setSuccessNotice('');
            }}
            className={`py-2 px-1 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-1 transition-all cursor-pointer text-center active:scale-95 ${
              activeTab === 'card-collection'
                ? 'bg-[#00523f] text-white shadow-[0_4px_14px_rgba(0,82,63,0.3)] font-black'
                : 'text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="truncate text-[10px] sm:text-xs">१. हप्ता जमा</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('card-ledger');
              setErrorNotice('');
              setSuccessNotice('');
            }}
            className={`py-2 px-1 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-1 transition-all cursor-pointer text-center active:scale-95 ${
              activeTab === 'card-ledger'
                ? 'bg-[#00523f] text-white shadow-[0_4px_14px_rgba(0,82,63,0.3)] font-black'
                : 'text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="truncate text-[10px] sm:text-xs">२. कार्ड हिशोब</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('receipt');
              setErrorNotice('');
              setSuccessNotice('');
            }}
            className={`py-2 px-1 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-1 transition-all cursor-pointer text-center active:scale-95 ${
              activeTab === 'receipt'
                ? 'bg-[#00523f] text-white shadow-[0_4px_14px_rgba(0,82,63,0.3)] font-black'
                : 'text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="truncate text-[10px] sm:text-xs">३. पावत्या</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('new-card');
              setErrorNotice('');
              setSuccessNotice('');
            }}
            className={`py-2 px-1 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-1 transition-all cursor-pointer text-center active:scale-95 ${
              activeTab === 'new-card'
                ? 'bg-[#00523f] text-white shadow-[0_4px_14px_rgba(0,82,63,0.3)] font-black'
                : 'text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="truncate text-[10px] sm:text-xs">४. नवीन कार्ड</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('sales');
              setErrorNotice('');
              setSuccessNotice('');
            }}
            className={`py-2 px-1 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-1 transition-all cursor-pointer text-center active:scale-95 ${
              activeTab === 'sales'
                ? 'bg-[#00523f] text-white shadow-[0_4px_14px_rgba(0,82,63,0.3)] font-black'
                : 'text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="truncate text-[10px] sm:text-xs">५. बिल</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('cash-refund');
              setErrorNotice('');
              setSuccessNotice('');
            }}
            className={`py-2 px-1 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-1 transition-all cursor-pointer text-center active:scale-95 ${
              activeTab === 'cash-refund'
                ? 'bg-[#00523f] text-white shadow-[0_4px_14px_rgba(0,82,63,0.3)] font-black'
                : 'text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="truncate text-[10px] sm:text-xs">६. परतावा</span>
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
                <div className="space-y-2.5">
                  {/* Scheme Filter Chips for quick narrowing */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                    <button
                      type="button"
                      onClick={() => setCollectionSchemeFilter('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                        collectionSchemeFilter === 'all'
                          ? 'bg-[#00523f] text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      सर्व योजना ({cardMembers.length})
                    </button>
                    {SCHEMES_CONFIG.map((sch) => {
                      const count = cardMembers.filter((m) => m.schemeId === sch.id).length;
                      return (
                        <button
                          key={sch.id}
                          type="button"
                          onClick={() => setCollectionSchemeFilter(sch.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                            collectionSchemeFilter === sch.id
                              ? 'bg-[#00523f] text-white shadow-xs'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          <span>{sch.name}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/15">
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-extrabold text-slate-800">
                      कार्ड नंबर किंवा नाव शोधा (Search Card / Name / Village)
                    </label>
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-full">
                      {filteredCardMembers.length} कार्ड उपलब्ध
                    </span>
                  </div>

                  <div className="relative">
                    <Search className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={cardSearch}
                      onChange={(e) => setCardSearch(e.target.value)}
                      placeholder="उदा. 1001, नाव, गाव, फोन किंवा पाना क्र..."
                      className="w-full pl-11 pr-10 py-3 rounded-xl border-2 border-slate-300 bg-white text-base font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:border-amber-500 focus:ring-2 focus:ring-amber-400/30 focus:outline-none transition shadow-inner"
                      autoFocus
                    />
                    {cardSearch && (
                      <button
                        type="button"
                        onClick={() => setCardSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer font-bold text-base"
                        title="Clear search"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-2xl bg-white shadow-xs">
                    {filteredCardMembers.length > 0 ? (
                      filteredCardMembers.map((m) => (
                        <div
                          key={m.id}
                          onClick={() => setSelectedMember(m)}
                          className="p-3.5 hover:bg-amber-50/80 active:bg-amber-100 cursor-pointer flex items-center justify-between transition text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-1 rounded-lg bg-emerald-800 text-white font-mono font-black text-xs">
                                #{m.cardNumber}
                              </span>
                              <span className="font-extrabold text-slate-900 text-sm">
                                {m.customerName}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-600 mt-1 block font-medium">
                              {m.village ? `📍 गाव: ${m.village}` : ''} {m.sheetNo ? `• पाना #${m.sheetNo}` : ''} {m.phone ? `• 📞 ${m.phone}` : ''}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block font-bold">एकूण जमा</span>
                            <span className="font-black text-emerald-700 text-sm">
                              ₹{(m.netBalance ?? 0).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center text-xs text-slate-500">
                        कोणताही कार्ड सदस्य सापडला नाही. कृपया कार्ड नंबर किंवा नाव तपासा.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Selected Card Info Box with Inline Edit */}
                  <div className="p-4 bg-emerald-50/80 border-2 border-emerald-200 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-800 text-white font-mono font-black text-xs">
                          कार्ड #{selectedMember.cardNumber}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold text-[11px]">
                          {selectedMember.schemeName || selectedMember.schemeId}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsEditingMember(!isEditingMember)}
                          className="px-2.5 py-1 rounded-lg bg-white border border-emerald-300 text-xs text-emerald-900 font-bold hover:bg-emerald-100/60 transition flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-emerald-700" />
                          <span>{isEditingMember ? 'संपादन बंद' : 'माहिती बदला (Edit)'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedMember(null)}
                          className="text-xs text-slate-600 hover:text-slate-900 font-bold underline cursor-pointer"
                        >
                          दुसरे कार्ड निवडा
                        </button>
                      </div>
                    </div>

                    {/* Inline Edit Form for mobile field collection */}
                    {isEditingMember ? (
                      <div className="p-3 bg-white rounded-xl border border-emerald-200 space-y-2.5 shadow-xs animate-in fade-in">
                        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                          <span className="text-xs font-black text-emerald-900">
                            ✏️ ग्राहकाची माहिती अपडेट करा (Update & Save)
                          </span>
                          <span className="text-[10px] text-slate-500">हफ्ता घेताना थेट सेव्ह होईल</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                              ग्राहकाचे नाव (Customer Name) *
                            </label>
                            <input
                              type="text"
                              value={editCustomerName}
                              onChange={(e) => setEditCustomerName(e.target.value)}
                              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              placeholder="ग्राहकाचे नाव"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                              मोबाईल नंबर (Phone)
                            </label>
                            <input
                              type="tel"
                              value={editPhone}
                              onChange={(e) => setEditPhone(e.target.value)}
                              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              placeholder="10 digit mobile"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                              गाव / पत्ता (Village / Address)
                            </label>
                            <input
                              type="text"
                              value={editVillage}
                              onChange={(e) => setEditVillage(e.target.value)}
                              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              placeholder="उदा. शिरोळ, जयसिंगपूर"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                              शीट / पाना क्र. (Sheet No.)
                            </label>
                            <input
                              type="text"
                              value={editSheetNo}
                              onChange={(e) => setEditSheetNo(e.target.value)}
                              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              placeholder="उदा. S-14"
                            />
                          </div>
                        </div>

                        <div className="pt-1 flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={handleSaveMemberEdits}
                            className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>✓ बदल लगेच सेव्ह करा</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between pt-1">
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-base">
                            {selectedMember.customerName}
                          </h4>
                          <p className="text-xs text-slate-600 font-medium mt-0.5">
                            {selectedMember.village ? `📍 गाव: ${selectedMember.village}` : ''}{' '}
                            {selectedMember.sheetNo ? `• पाना #${selectedMember.sheetNo}` : ''}{' '}
                            {selectedMember.phone ? `• 📞 ${selectedMember.phone}` : ''}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] text-slate-500 block font-medium">खाते शिल्लक जमा</span>
                          <span className="text-base font-black text-emerald-700">
                            ₹{(selectedMember.netBalance || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Action shortcut to open Passbook / Ledger modal */}
                    <div className="pt-1 border-t border-emerald-200/60 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-emerald-800 font-semibold">
                        मागील सर्व हप्ते व पासबुक इतिहास पहा
                      </span>
                      <button
                        type="button"
                        onClick={() => setActivePassbookModal(selectedMember)}
                        className="px-2.5 py-1 rounded-lg bg-white border border-emerald-300 text-emerald-800 font-bold hover:bg-emerald-100/50 flex items-center gap-1 cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                        <span>पासबुक पहा (Passbook)</span>
                      </button>
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
          {/* TAB 2: NEW CARD CREATION (नवीन कार्ड नोंदणी - फिल्ड)     */}
          {/* ========================================================= */}
          {activeTab === 'new-card' && (
            <form onSubmit={handleCreateCardSubmit} className="space-y-4">
              <div className="bg-sky-50 border border-sky-200 p-3 rounded-2xl text-xs text-sky-950 font-bold flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-sky-700 shrink-0" />
                <span>फिल्डवर नवीन सदस्याचे कार्ड त्वरित उघडा (Fixed Registration Fee: ₹50)</span>
              </div>

              {/* Scheme Select */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  योजना निवडा (Select Scheme) *
                </label>
                <select
                  value={newCardScheme}
                  onChange={(e) => {
                    const sId = e.target.value as CardSchemeId;
                    setNewCardScheme(sId);
                    const cfg = SCHEMES_CONFIG.find((s) => s.id === sId);
                    if (cfg) {
                      const existingInScheme = cardMembers.filter((m) => m.schemeId === sId);
                      const nextNo = existingInScheme.length > 0 
                        ? Math.max(...existingInScheme.map((m) => m.cardNumber)) + 1 
                        : cfg.startCardNo;
                      setNewCardNumber(nextNo);
                    }
                  }}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-white text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  {SCHEMES_CONFIG.map((sc) => (
                    <option key={sc.id} value={sc.id}>
                      {sc.name} ({sc.code} • कार्ड क्र. {sc.startCardNo} ते {sc.endCardNo})
                    </option>
                  ))}
                </select>
              </div>

              {/* Card Number & Unique ID */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    कार्ड नंबर (Card No.) *
                  </label>
                  <input
                    type="number"
                    required
                    value={newCardNumber}
                    onChange={(e) => setNewCardNumber(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-black text-slate-900 bg-white"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    मर्यादा: {SCHEMES_CONFIG.find((s) => s.id === newCardScheme)?.startCardNo} -{' '}
                    {SCHEMES_CONFIG.find((s) => s.id === newCardScheme)?.endCardNo}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    यूनिक आयडी (Unique ID)
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={`SAI-${newCardScheme.toUpperCase()}-${newCardNumber}`}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono bg-slate-100 text-slate-600 font-bold"
                  />
                </div>
              </div>

              {/* Customer Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ग्राहकाचे नाव (Customer Name) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    placeholder="उदा. रमेश पाटील"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    मोबाईल नंबर (Phone) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="उदा. 9823012345"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Village & Sheet No */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    गाव (Village) *
                  </label>
                  <select
                    value={newVillage}
                    onChange={(e) => setNewVillage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium bg-white"
                  >
                    {villageList.map((v) => (
                      <option key={v} value={v}>
                        📍 {v}
                      </option>
                    ))}
                    <option value="other">+ इतर गाव टाका (Other)...</option>
                  </select>

                  {newVillage === 'other' && (
                    <input
                      type="text"
                      required
                      value={newCustomVillage}
                      onChange={(e) => setNewCustomVillage(e.target.value)}
                      placeholder="गावाचे नाव टाका..."
                      className="w-full mt-1.5 px-3 py-1.5 border border-slate-300 rounded-xl text-xs bg-white"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    शीट नंबर (Sheet No.)
                  </label>
                  <input
                    type="text"
                    value={newSheetNo}
                    onChange={(e) => setNewSheetNo(e.target.value)}
                    placeholder="उदा. 21 किंवा A"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono bg-white"
                  />
                </div>
              </div>

              {/* Agent Name & Registration Fee */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    एजंटचे नाव (Agent Name) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newAgentName}
                    onChange={(e) => setNewAgentName(e.target.value)}
                    placeholder="उदा. राहुल शर्मा"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium bg-sky-50/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    नोंदणी फी (Registration Fee)
                  </label>
                  <div className="flex items-center gap-1.5 px-3 py-2 border border-emerald-300 bg-emerald-50 rounded-xl text-xs font-bold text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>₹50 (रोख अनिवार्य जमा)</span>
                  </div>
                </div>
              </div>

              {/* Optional Initial Installment */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  पहिला हफ्ता (Optional Week 1 Deposit)
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {[0, 100, 200, 500, 1000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setNewInitialDeposit(amt)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        newInitialDeposit === amt
                          ? 'bg-sky-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {amt === 0 ? 'फक्त ₹५० फी' : `+ ₹${amt} हफ्ता`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-sky-600 via-sky-600 to-sky-700 hover:from-sky-500 hover:to-sky-600 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-600/25 cursor-pointer active:scale-98 transition"
                >
                  <CheckCircle2 className="w-5 h-5 text-white" />
                  <span>नवीन कार्ड जारी करा (Issue Card #{newCardNumber})</span>
                </button>
              </div>
            </form>
          )}

          {/* ========================================================= */}
          {/* TAB 3: QUICK SALES ENTRY (नवीन विक्री बिल / बुकिंग)     */}
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
          {/* TAB 3: RECEIPTS & SLIPS (साप्ताहिक पावती व उधार वसुली) */}
          {/* ========================================================= */}
          {activeTab === 'receipt' && (
            <div className="space-y-4">
              {/* Dual sub-toggle */}
              <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                <button
                  type="button"
                  onClick={() => setReceiptViewType('card-slips')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    receiptViewType === 'card-slips'
                      ? 'bg-[#00523f] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>साप्ताहिक हप्ता पावत्या (Card Slips)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReceiptViewType('customer-khata')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    receiptViewType === 'customer-khata'
                      ? 'bg-[#00523f] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>उधार वसुली (Khata Settle)</span>
                </button>
              </div>

              {receiptViewType === 'card-slips' ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-extrabold text-slate-800">
                      पावती नंबर, कार्ड नं किंवा नाव शोधा (Search Receipt / Card / Name)
                    </label>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      {recentCardSlips.length} पावत्या
                    </span>
                  </div>

                  <div className="relative">
                    <Search className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={cardSlipSearch}
                      onChange={(e) => setCardSlipSearch(e.target.value)}
                      placeholder="पावती क्र. (उदा. CS-123), कार्ड #, नाव किंवा एजंट..."
                      className="w-full pl-11 pr-10 py-2.5 rounded-xl border-2 border-slate-300 bg-white text-sm font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:border-emerald-500 focus:outline-none"
                    />
                    {cardSlipSearch && (
                      <button
                        type="button"
                        onClick={() => setCardSlipSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-2xl bg-white shadow-xs">
                    {recentCardSlips.length > 0 ? (
                      recentCardSlips.map((tx) => {
                        const memberObj = cardMembers.find(
                          (m) =>
                            m.id === tx.cardId ||
                            (m.cardNumber === tx.cardNumber && m.schemeId === tx.schemeId)
                        );
                        return (
                          <div
                            key={tx.id}
                            className="p-3.5 hover:bg-emerald-50/50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                          >
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-mono font-black text-xs">
                                  {tx.receiptNo}
                                </span>
                                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 font-mono font-bold text-xs">
                                  कार्ड #{tx.cardNumber}
                                </span>
                                <span className="font-extrabold text-slate-900 text-sm">
                                  {tx.customerName}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2 flex-wrap font-medium">
                                <span>📅 {tx.date}</span>
                                {tx.weekNumber && <span>• हप्ता क्र. {tx.weekNumber}</span>}
                                <span>• पेमेंट: {tx.paymentMode}</span>
                                {tx.agentName && <span>• एजंट: {tx.agentName}</span>}
                                {memberObj?.village && <span>• 📍 {memberObj.village}</span>}
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                              <div className="text-left sm:text-right">
                                <span className="text-[10px] text-slate-400 block font-bold">हप्ता रक्कम</span>
                                <span className="font-black text-emerald-700 text-sm">
                                  ₹{tx.amount.toLocaleString()}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setActiveSlipModal({
                                      transaction: tx,
                                      member: memberObj
                                    })
                                  }
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer"
                                  title="पावती पहा व प्रिंट करा"
                                >
                                  <Receipt className="w-3.5 h-3.5" />
                                  <span>पावती पहा</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const text = encodeURIComponent(
                                      `*${settings.businessName}*\n` +
                                        `*साप्ताहिक बचत योजना पावती*\n` +
                                        `------------------------\n` +
                                        `पावती नं: ${tx.receiptNo}\n` +
                                        `कार्ड नं: #${tx.cardNumber}\n` +
                                        `ग्राहक: ${tx.customerName}\n` +
                                        `दिनांक: ${tx.date}\n` +
                                        (tx.weekNumber ? `हप्ता क्र.: ${tx.weekNumber}\n` : '') +
                                        `जमा रक्कम: ₹${tx.amount.toLocaleString()}\n` +
                                        `मोड: ${tx.paymentMode}\n` +
                                        `एकूण शिल्लक: ₹${tx.balanceAfter.toLocaleString()}\n` +
                                        `------------------------\n` +
                                        `आपली रक्कम सुरक्षितपणे जमा झाली आहे.`
                                    );
                                    window.open(`https://wa.me/?text=${text}`, '_blank');
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs flex items-center gap-1 cursor-pointer"
                                  title="WhatsApp वर पावती पाठवा"
                                >
                                  <Share2 className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">WhatsApp</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-8 text-center text-xs text-slate-500">
                        कोणतीही पावती सापडली नाही.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
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
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: CASH REFUND CARD (रोख परतावा / रिफंड)             */}
          {/* ========================================================= */}
          {activeTab === 'cash-refund' && (
            <form onSubmit={handleRefundSubmit} className="space-y-4">
              <div className="bg-rose-50 border border-rose-200 p-3 rounded-2xl text-xs text-rose-900 font-bold flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>योजना कार्ड सभासद रोख परतावा (Cash Refund to Member)</span>
                </div>
                <span className="text-[10px] text-rose-700 bg-rose-200/60 px-2 py-0.5 rounded-md font-mono">
                  Cash Payout
                </span>
              </div>

              {/* Select Card Member for Refund */}
              {!refundMember ? (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    रोख परताव्यासाठी कार्ड शोधा (कार्ड नं., नाव किंवा मोबाईल)
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={refundSearch}
                      onChange={(e) => setRefundSearch(e.target.value)}
                      placeholder="उदा. 1001 किंवा ग्राहकाचे नाव किंवा 9876543210"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5 max-h-56 overflow-y-auto">
                    {filteredRefundMembers.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                        कोणतेही शिल्लक जमा असलेले कार्ड सापडले नाही.
                      </div>
                    ) : (
                      filteredRefundMembers.map((m) => (
                        <div
                          key={m.id}
                          onClick={() => {
                            setRefundMember(m);
                            setRefundAmount('');
                          }}
                          className="p-3 rounded-xl border border-slate-200 hover:border-rose-400 hover:bg-rose-50/40 cursor-pointer transition flex items-center justify-between"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded font-mono font-black text-xs bg-slate-900 text-white">
                                #{m.cardNumber}
                              </span>
                              <span className="font-bold text-slate-900 text-xs">{m.customerName}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5 flex gap-2">
                              <span>योजना {m.schemeId}</span>
                              {m.village && <span>• गाव: {m.village}</span>}
                              {m.phone && <span>• 📞 {m.phone}</span>}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-slate-500 block">शिल्लक जमा</span>
                            <span className="font-extrabold text-emerald-600 text-xs">
                              ₹{(m.netBalance || 0).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3 p-4 rounded-2xl bg-rose-50/50 border border-rose-200">
                  {/* Selected Card Member Details Banner */}
                  <div className="flex items-start justify-between pb-3 border-b border-rose-200/80">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-md font-mono font-black text-xs bg-rose-600 text-white">
                          कार्ड #{refundMember.cardNumber}
                        </span>
                        <span className="font-bold text-slate-900 text-sm">{refundMember.customerName}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {refundMember.village ? `गाव: ${refundMember.village}` : ''} • फोन: {refundMember.phone || 'N/A'} • योजना: {refundMember.schemeId}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRefundMember(null)}
                      className="text-xs text-rose-600 hover:text-rose-800 font-bold cursor-pointer"
                    >
                      बदला ✕
                    </button>
                  </div>

                  {/* Summary of Deposits & Available Refund Balance */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-white p-2 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">एकूण जमा</span>
                      <span className="font-bold text-slate-900">₹{(refundMember.totalDeposited || 0).toLocaleString()}</span>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">मागील परतावा</span>
                      <span className="font-bold text-rose-600">₹{(refundMember.totalRefunded || 0).toLocaleString()}</span>
                    </div>
                    <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                      <span className="text-[10px] text-emerald-800 font-bold block">उपलब्ध शिल्लक</span>
                      <span className="font-black text-emerald-700">₹{(refundMember.netBalance || 0).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Refund Amount Input */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">
                        रोख परतावा रक्कम (Cash Refund Amount ₹) *
                      </label>
                      <button
                        type="button"
                        onClick={() => setRefundAmount(String(refundMember.netBalance || 0))}
                        className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                      >
                        संपूर्ण शिल्लक (₹{(refundMember.netBalance || 0).toLocaleString()})
                      </button>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                      <input
                        type="number"
                        value={refundAmount}
                        onChange={(e) => setRefundAmount(e.target.value)}
                        placeholder="परतावा रक्कम टाका"
                        className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-rose-300 text-sm font-bold text-rose-950 focus:ring-2 focus:ring-rose-500 focus:outline-none bg-white"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Payment Mode Note */}
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-2 text-xs text-amber-900">
                    <Banknote className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>हा परतावा <strong>रोख स्वरूपात (Cash)</strong> ग्राहकाला दिला जात आहे व कार्ड खात्यात त्वरित नोंद होईल.</span>
                  </div>

                  {/* Reason / Remarks */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      तपशील / कारण (Reason for Refund)
                    </label>
                    <input
                      type="text"
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      placeholder="उदा. योजना बंद परतावा किंवा जास्तीचा हफ्ता परत"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer transition active:scale-98"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>रोख परतावा नोंदवा (Confirm Cash Refund)</span>
                    </button>
                  </div>
                </div>
              )}
            </form>
          )}

          {/* ========================================================= */}
          {/* TAB 2: CARD SCHEME LEDGER / PASSBOOK (कार्ड हिशोब व पासबुक) */}
          {/* ========================================================= */}
          {activeTab === 'card-ledger' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-2xl text-xs text-blue-900 font-bold flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-700 shrink-0" />
                  <span>साप्ताहिक कार्ड हिशोब, सर्व हप्ते व पासबुक स्टेटमेंट</span>
                </div>
                <span className="text-[11px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                  {filteredCardLedgerMembers.length} कार्ड्स
                </span>
              </div>

              {!cardLedgerSelectedMember ? (
                <div className="space-y-3">
                  {/* Scheme selector chips */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                    <button
                      type="button"
                      onClick={() => setCardLedgerSchemeFilter('all')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition cursor-pointer ${
                        cardLedgerSchemeFilter === 'all'
                          ? 'bg-[#00523f] text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      सर्व योजना (All)
                    </button>
                    {SCHEMES_CONFIG.map((sch) => (
                      <button
                        key={sch.id}
                        type="button"
                        onClick={() => setCardLedgerSchemeFilter(sch.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition cursor-pointer ${
                          cardLedgerSchemeFilter === sch.id
                            ? 'bg-[#00523f] text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {sch.name} (#{sch.startCardNo}-{sch.endCardNo})
                      </button>
                    ))}
                  </div>

                  {/* Search box */}
                  <div className="relative">
                    <Search className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={cardLedgerSearch}
                      onChange={(e) => setCardLedgerSearch(e.target.value)}
                      placeholder="कार्ड #, सभासदाचे नाव, गाव किंवा शीट नं..."
                      className="w-full pl-11 pr-10 py-2.5 rounded-xl border-2 border-slate-300 bg-white text-sm font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:border-blue-500 focus:outline-none"
                    />
                    {cardLedgerSearch && (
                      <button
                        type="button"
                        onClick={() => setCardLedgerSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* List of members */}
                  <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-2xl bg-white shadow-xs">
                    {filteredCardLedgerMembers.length > 0 ? (
                      filteredCardLedgerMembers.map((m) => (
                        <div
                          key={m.id}
                          onClick={() => setCardLedgerSelectedMember(m)}
                          className="p-3.5 hover:bg-blue-50/50 cursor-pointer flex items-center justify-between gap-3 text-xs transition"
                        >
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2 py-0.5 rounded font-mono font-black text-xs bg-slate-900 text-white">
                                #{m.cardNumber}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 font-bold text-[11px]">
                                योजना {m.schemeId}
                              </span>
                              <span className="font-extrabold text-slate-900 text-sm">
                                {m.customerName}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2 flex-wrap font-medium">
                              {m.village && <span>📍 {m.village}</span>}
                              {m.phone && <span>📞 {m.phone}</span>}
                              {m.sheetNo && <span>📄 शीट #{m.sheetNo}</span>}
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-[10px] text-slate-400 block font-bold">शिल्लक बचत</span>
                            <span className="font-black text-emerald-700 text-sm">
                              ₹{(m.netBalance || 0).toLocaleString()}
                            </span>
                            <span className="text-[10px] text-blue-600 block mt-0.5 font-bold">
                              हिशोब पहा →
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-xs text-slate-500">
                        कोणतेही कार्ड सापडले नाही.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Selected Member Header Card */}
                  <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-2xl space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-lg bg-slate-900 text-white font-mono font-black text-sm">
                            कार्ड #{cardLedgerSelectedMember.cardNumber}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-blue-200 text-blue-900 font-bold text-xs">
                            {cardLedgerSelectedMember.schemeName || `योजना ${cardLedgerSelectedMember.schemeId}`}
                          </span>
                        </div>
                        <h4 className="text-base font-extrabold text-slate-900 mt-1">
                          {cardLedgerSelectedMember.customerName}
                        </h4>
                        <div className="text-xs text-slate-600 flex items-center gap-2 flex-wrap mt-0.5 font-medium">
                          {cardLedgerSelectedMember.village && <span>📍 गाव: {cardLedgerSelectedMember.village}</span>}
                          {cardLedgerSelectedMember.phone && <span>📞 {cardLedgerSelectedMember.phone}</span>}
                          {cardLedgerSelectedMember.sheetNo && <span>📄 शीट: {cardLedgerSelectedMember.sheetNo}</span>}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCardLedgerSelectedMember(null)}
                        className="text-xs text-blue-700 hover:text-blue-900 font-bold underline cursor-pointer"
                      >
                        दुसरे कार्ड पहा ✕
                      </button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 text-center text-xs pt-2 border-t border-blue-200/70">
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-500 block font-bold">एकूण जमा</span>
                        <span className="font-extrabold text-slate-900 text-sm">
                          ₹{(cardLedgerSelectedMember.totalDeposited || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-500 block font-bold">परतावा (Refund)</span>
                        <span className="font-extrabold text-rose-600 text-sm">
                          ₹{(cardLedgerSelectedMember.totalRefunded || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                        <span className="text-[10px] text-emerald-800 block font-bold">शिल्लक बचत</span>
                        <span className="font-black text-emerald-700 text-sm">
                          ₹{(cardLedgerSelectedMember.netBalance || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Quick action buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          const m = cardLedgerSelectedMember;
                          const mTx = cardTransactions
                            .filter(
                              (t) =>
                                t.cardNumber === m.cardNumber &&
                                t.schemeId === m.schemeId
                            )
                            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                          const txList = mTx
                            .map((t, idx) => `${idx + 1}. हप्ता: ₹${t.amount} (${t.date}) पावती #${t.receiptNo}`)
                            .join('\n');
                          const text = encodeURIComponent(
                            `*${settings.businessName}*\n` +
                              `*कार्ड बचत योजना पासबुक हिशोब*\n` +
                              `------------------------\n` +
                              `कार्ड नं: #${m.cardNumber} (${m.schemeName || `योजना ${m.schemeId}`})\n` +
                              `सभासद: ${m.customerName}\n` +
                              (m.village ? `गाव: ${m.village}\n` : '') +
                              (m.sheetNo ? `शीट नं: ${m.sheetNo}\n` : '') +
                              `------------------------\n` +
                              `एकूण जमा: ₹${(m.totalDeposited || 0).toLocaleString()}\n` +
                              `परतावा: ₹${(m.totalRefunded || 0).toLocaleString()}\n` +
                              `*शिल्लक बचत: ₹${(m.netBalance || 0).toLocaleString()}*\n` +
                              `------------------------\n` +
                              `*हप्ते तपशील:*\n` +
                              (txList || 'अद्याप हप्ते नोंदवले नाहीत') +
                              `\n------------------------\n` +
                              `श्री साई एंटरप्रायझेस, वर्धा`
                          );
                          window.open(`https://wa.me/?text=${text}`, '_blank');
                        }}
                        className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Share2 className="w-4 h-4" />
                        <span>WhatsApp वर हिशोब</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActivePassbookModal(cardLedgerSelectedMember)}
                        className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <BookOpen className="w-4 h-4" />
                        <span>पासबुक प्रिंट करा</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMember(cardLedgerSelectedMember);
                          setActiveTab('card-collection');
                        }}
                        className="py-2.5 px-3 rounded-xl bg-[#00523f] hover:bg-[#004030] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <PlusCircle className="w-4 h-4" />
                        <span>+ हप्ता जमा करा</span>
                      </button>
                    </div>
                  </div>

                  {/* Transaction Statement Table / History */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>हप्ता नोंदी व व्यवहार इतिहास (Payment History)</span>
                    </h5>

                    {(() => {
                      const memberTx = cardTransactions
                        .filter(
                          (t) =>
                            t.cardNumber === cardLedgerSelectedMember.cardNumber &&
                            t.schemeId === cardLedgerSelectedMember.schemeId
                        )
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                      if (memberTx.length === 0) {
                        return (
                          <div className="p-6 text-center text-xs text-slate-500 border border-slate-200 rounded-2xl bg-white">
                            या कार्डावर अद्याप कोणतीही पेमेंट नोंद झालेली नाही.
                          </div>
                        );
                      }

                      return (
                        <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl bg-white shadow-xs overflow-hidden">
                          {memberTx.map((tx) => (
                            <div
                              key={tx.id}
                              className="p-3 flex items-center justify-between text-xs hover:bg-slate-50 transition"
                            >
                              <div>
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                      tx.type === 'REFUND'
                                        ? 'bg-rose-100 text-rose-800'
                                        : 'bg-emerald-100 text-emerald-800'
                                    }`}
                                  >
                                    {tx.type === 'REFUND'
                                      ? 'रोख परतावा'
                                      : `हप्ता ${tx.weekNumber ? `#${tx.weekNumber}` : 'जमा'}`}
                                  </span>
                                  <span className="font-mono text-slate-500 text-[11px]">
                                    {tx.receiptNo}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-500 mt-1 flex gap-2">
                                  <span>📅 {tx.date}</span>
                                  <span>• मोड: {tx.paymentMode}</span>
                                  {tx.agentName && <span>• एजंट: {tx.agentName}</span>}
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <span
                                    className={`font-black text-sm block ${
                                      tx.type === 'REFUND' ? 'text-rose-600' : 'text-emerald-700'
                                    }`}
                                  >
                                    {tx.type === 'REFUND' ? '-' : '+'}₹{tx.amount.toLocaleString()}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    शिल्लक: ₹{tx.balanceAfter.toLocaleString()}
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setActiveSlipModal({
                                      transaction: tx,
                                      member: cardLedgerSelectedMember
                                    })
                                  }
                                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                                  title="पावती पहा"
                                >
                                  <Receipt className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 5: QUICK LEDGER LOOKUP (खाता बही स्टेटमेंट)        */}
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

      {/* Instant Collection Slip Modal */}
      {activeSlipModal && (
        <CollectionSlipModal
          transaction={activeSlipModal.transaction}
          member={activeSlipModal.member}
          settings={settings}
          onClose={() => setActiveSlipModal(null)}
        />
      )}

      {/* Passbook / Ledger Modal */}
      {activePassbookModal && (
        <CardPassbookModal
          member={activePassbookModal}
          transactions={cardTransactions}
          settings={settings}
          onClose={() => setActivePassbookModal(null)}
        />
      )}
    </div>
  );
};
