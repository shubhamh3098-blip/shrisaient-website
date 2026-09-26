import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Plus,
  Search,
  Sparkles,
  Trophy,
  CheckCircle2,
  Clock,
  Printer,
  Gift,
  Calendar,
  User,
  Phone,
  DollarSign,
  X,
  AlertCircle,
  Filter,
  Layers,
  MapPin,
  Check,
  Trash2,
  Share2,
  QrCode,
  ClipboardList,
  Copy,
  Edit3,
  MessageCircle,
  ShieldCheck,
  BookOpen
} from 'lucide-react';
import { CardMember, CardTransaction, StoreData } from '../../types';
import { StorageService } from '../../services/storageService';
import { useTheme } from '../../context/ThemeContext';
import { WeeklyCardCollectionModal } from './WeeklyCardCollectionModal';
import { CardPassbookPrintModal } from './CardPassbookPrintModal';
import { InteractiveDigitalCard } from './InteractiveDigitalCard';
import {
  SCHEME_CONFIGS,
  getSchemeConfig,
  resolveCardScheme,
  validateCardNumberForScheme,
  extractCardNumber,
  getNextAvailableCardNumber,
  getSchemeBadgeClasses,
  getCardFinancialSummary,
  getCardTargetAmount,
  getCardBalanceDue,
  SchemeConfig
} from '../../utils/schemeUtils';

interface SchemeManagerViewProps {
  storeData: StoreData;
  onRefreshData: () => void;
}

export const SchemeManagerView: React.FC<SchemeManagerViewProps> = ({
  storeData,
  onRefreshData,
}) => {
  const { isDayMode } = useTheme();

  // Active Scheme Tab: 'all' | 1 | 2 | 3 | 4 | 5
  const [activeSchemeTab, setActiveSchemeTab] = useState<'all' | number>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Billed' | 'Unbilled' | 'Overdue' | 'Draw Winner' | 'Matured'>('all');
  const [selectedMember, setSelectedMember] = useState<CardMember | null>(null);

  // Village Directory State (Task 4)
  const [availableVillages, setAvailableVillages] = useState<string[]>(() => StorageService.getVillages());
  const [isAddVillageModalOpen, setIsAddVillageModalOpen] = useState(false);
  const [newVillageNameInput, setNewVillageNameInput] = useState('');

  // Customer Edit Info Modal State (Task 4)
  const [isEditMemberModalOpen, setIsEditMemberModalOpen] = useState(false);
  const [editMemberName, setEditMemberName] = useState('');
  const [editMemberPhone, setEditMemberPhone] = useState('');
  const [editMemberVillage, setEditMemberVillage] = useState('Wardha (वर्धा)');
  const [editMemberAddress, setEditMemberAddress] = useState('Wardha (वर्धा)');
  const [editMemberNominee, setEditMemberNominee] = useState('');

  // New Customer Welcome Flow State (Task 10)
  const [welcomeMember, setWelcomeMember] = useState<CardMember | null>(null);

  // Card Deletion State
  const [memberToDelete, setMemberToDelete] = useState<CardMember | null>(null);
  const [isDeletingCard, setIsDeletingCard] = useState(false);
  const [deleteToast, setDeleteToast] = useState<string | null>(null);

  // Agent Beat Sheet Modal State
  const [isBeatSheetModalOpen, setIsBeatSheetModalOpen] = useState(false);
  const [beatVillageFilter, setBeatVillageFilter] = useState<string>('all');

  // Dynamic UPI Quick Pay state
  const [copyUpiSuccess, setCopyUpiSuccess] = useState(false);

  // Installment Deposit Modal
  const [printPassbookMember, setPrintPassbookMember] = useState<CardMember | null>(null);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [depositMonthNo, setDepositMonthNo] = useState<number>(1);
  const [depositAmount, setDepositAmount] = useState<number>(100);
  const [depositMode, setDepositMode] = useState<'Cash' | 'UPI'>('Cash');
  const [depositRemarks, setDepositRemarks] = useState('');
  const [depositSuccessReceipt, setDepositSuccessReceipt] = useState<CardTransaction | null>(null);

  // Lucky Draw Modal
  const [isDrawModalOpen, setIsDrawModalOpen] = useState(false);
  const [drawSchemeNo, setDrawSchemeNo] = useState<number>(1);
  const [selectedDrawMonth, setSelectedDrawMonth] = useState<number>(new Date().getMonth() + 1);
  const [drawPrizeTitle, setDrawPrizeTitle] = useState('Samsung 43-inch Smart LED TV / LG Refrigerator');
  const [drawnWinner, setDrawnWinner] = useState<CardMember | null>(null);
  const [isRolling, setIsRolling] = useState(false);

  // New Member Registration Modal
  const [isNewMemberModalOpen, setIsNewMemberModalOpen] = useState(false);
  const [formSchemeNo, setFormSchemeNo] = useState<number>(1);
  const [formCardNoNum, setFormCardNoNum] = useState<string>('1001');
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('Wardha');
  const [formVillage, setFormVillage] = useState('Wardha');
  const [formNominee, setFormNominee] = useState('');
  const [formMonthlyAmount, setFormMonthlyAmount] = useState(100);
  const [formDurationMonths, setFormDurationMonths] = useState(30);
  const [formTargetAmount, setFormTargetAmount] = useState<number>(15000);
  const [formPlanType, setFormPlanType] = useState<'15000_scheme' | '30000_scheme' | 'custom_scheme'>('15000_scheme');
  const [formAgent, setFormAgent] = useState<string>('राहुल (Rahul)');
  const [formValidationError, setFormValidationError] = useState<string | null>(null);

  // Enrich members with their resolved schemeNo
  const allEnrichedMembers = useMemo(() => {
    return storeData.cardMembers.map((m) => {
      const sNo = resolveCardScheme(m);
      const cardNum = extractCardNumber(m.cardNo);
      return {
        ...m,
        schemeNo: sNo,
        schemeConfig: getSchemeConfig(sNo),
        numericCardNo: cardNum,
      };
    });
  }, [storeData.cardMembers]);

  // Filter members based on Scheme Tab, Status, and Search Query
  const filteredMembers = useMemo(() => {
    return allEnrichedMembers.filter((m) => {
      // 1. Scheme Tab Filter
      if (activeSchemeTab !== 'all' && m.schemeNo !== activeSchemeTab) {
        return false;
      }

      // 2. Status Filter
      if (statusFilter === 'Overdue') {
        if (m.status !== 'Active' || m.totalPaidMonths >= 5) {
          return false;
        }
      } else if (statusFilter === 'Billed') {
        if (!m.deliveredItemName && !m.itemBillNo) {
          return false;
        }
      } else if (statusFilter === 'Unbilled') {
        if (m.deliveredItemName || m.itemBillNo) {
          return false;
        }
      } else if (statusFilter !== 'all' && m.status !== statusFilter) {
        return false;
      }

      // 3. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const cardNoMatch = m.cardNo.toLowerCase().includes(q) || String(m.numericCardNo).includes(q);
        const nameMatch = m.memberName.toLowerCase().includes(q);
        const phoneMatch = m.phone.includes(q);
        const villageMatch = (m.village || '').toLowerCase().includes(q) || (m.address || '').toLowerCase().includes(q);
        return cardNoMatch || nameMatch || phoneMatch || villageMatch;
      }

      return true;
    });
  }, [allEnrichedMembers, activeSchemeTab, statusFilter, searchQuery]);

  // Statistics for Current Scheme View
  const schemeStats = useMemo(() => {
    const relevant = activeSchemeTab === 'all'
      ? allEnrichedMembers
      : allEnrichedMembers.filter((m) => m.schemeNo === activeSchemeTab);

    const total = relevant.length;
    const active = relevant.filter((m) => m.status === 'Active').length;
    const winners = relevant.filter((m) => m.status === 'Draw Winner').length;
    const matured = relevant.filter((m) => m.status === 'Matured').length;
    const totalPool = relevant.reduce((a, m) => a + m.totalAmountPaid, 0);

    return { total, active, winners, matured, totalPool };
  }, [allEnrichedMembers, activeSchemeTab]);

  // Open New Member Modal with next available card pre-filled
  const handleOpenNewMemberModal = (schemeNoToOpen = 1) => {
    const targetScheme = typeof activeSchemeTab === 'number' ? activeSchemeTab : schemeNoToOpen;
    setFormSchemeNo(targetScheme);
    const nextCard = getNextAvailableCardNumber(storeData.cardMembers, targetScheme);
    setFormCardNoNum(String(nextCard));
    setFormName('');
    setFormPhone('');
    setFormVillage('Wardha');
    setFormAddress('Wardha');
    setFormNominee('');
    setFormMonthlyAmount(1000);
    setFormDurationMonths(30);
    setFormValidationError(null);
    setIsNewMemberModalOpen(true);
  };

  // Change Scheme in New Member Form -> recalculate next available card
  const handleFormSchemeChange = (newSchemeNo: number) => {
    setFormSchemeNo(newSchemeNo);
    const nextCard = getNextAvailableCardNumber(storeData.cardMembers, newSchemeNo);
    setFormCardNoNum(String(nextCard));
    setFormValidationError(null);
  };

  // Handle Member Registration with Range Validation
  const handleRegisterMember = (e: React.FormEvent) => {
    e.preventDefault();
    setFormValidationError(null);

    if (!formName.trim() || !formPhone.trim()) {
      setFormValidationError('कृपया सभासदाचे पूर्ण नाव व मोबाईल क्रमांक टाका.');
      return;
    }

    const cardNum = parseInt(formCardNoNum.trim(), 10);
    const validation = validateCardNumberForScheme(cardNum, formSchemeNo);
    if (!validation.valid) {
      setFormValidationError(validation.message || 'अवैध कार्ड क्रमांक');
      return;
    }

    // Check if this card number already exists in this scheme
    const formattedCardNo = `SCH${formSchemeNo}-${cardNum}`;
    const alreadyExists = storeData.cardMembers.some(
      (m) =>
        resolveCardScheme(m) === formSchemeNo &&
        (m.cardNo === formattedCardNo || extractCardNumber(m.cardNo) === cardNum)
    );

    if (alreadyExists) {
      setFormValidationError(
        `योजना ${formSchemeNo} मध्ये कार्ड क्रमांक ${cardNum} आधीच नोंदणीकृत आहे. कृपया दुसरा कार्ड क्रमांक निवडा.`
      );
      return;
    }

    const today = new Date();
    const startDate = today.toISOString().slice(0, 10);
    const end = new Date(today.setMonth(today.getMonth() + formDurationMonths));
    const endDate = end.toISOString().slice(0, 10);

    const schemeConf = getSchemeConfig(formSchemeNo);

    const newMem = StorageService.addCardMember({
      cardNo: formattedCardNo,
      schemeNo: formSchemeNo,
      schemeName: schemeConf.marathiName,
      memberName: formName.trim().toUpperCase(),
      phone: formPhone.trim(),
      village: formVillage.trim() || 'Wardha',
      address: formAddress.trim() || `${formVillage.trim()}, Wardha`,
      nomineeName: formNominee.trim() || undefined,
      durationMonths: formDurationMonths,
      monthlyAmount: formMonthlyAmount,
      targetAmount: formTargetAmount,
      planType: formPlanType,
      collectedBy: formAgent,
      startDate,
      endDate,
      notes: `${formTargetAmount === 15000 ? '₹१५,००० बचत योजना (हप्ता ₹' + formMonthlyAmount + ')' : 'बचत योजना (हप्ता ₹' + formMonthlyAmount + ', एकूण ₹' + formTargetAmount.toLocaleString('en-IN') + ')'} (${schemeConf.marathiName}: कार्ड #${cardNum}) - एजंट: ${formAgent}`,
    });

    onRefreshData();
    setIsNewMemberModalOpen(false);
    setSelectedMember(newMem);
    setWelcomeMember(newMem); // Trigger Welcome & Live Passbook Share Flow (Task 10)
  };

  // Village Quick-Add Handler (Task 4)
  const handleAddCustomVillage = (villageName: string) => {
    const trimmed = villageName.trim();
    if (!trimmed) return;
    const updated = StorageService.addVillage(trimmed);
    setAvailableVillages(updated);
    setFormVillage(trimmed);
    setEditMemberVillage(trimmed);
    setIsAddVillageModalOpen(false);
    setNewVillageNameInput('');
  };

  // Open Edit Customer Info Modal (Task 4)
  const handleOpenEditMemberModal = (member: CardMember) => {
    setEditMemberName(member.memberName || '');
    setEditMemberPhone(member.phone && member.phone !== '0' ? member.phone : '');
    setEditMemberVillage(member.village || member.address || 'Wardha (वर्धा)');
    setEditMemberAddress(member.address || member.village || 'Wardha (वर्धा)');
    setEditMemberNominee(member.nomineeName || '');
    setIsEditMemberModalOpen(true);
  };

  // Save Edited Customer Info
  const handleSaveEditMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    StorageService.updateCardMember(selectedMember.id, {
      memberName: editMemberName.trim() || selectedMember.memberName,
      phone: editMemberPhone.trim() || selectedMember.phone,
      village: editMemberVillage.trim() || selectedMember.village,
      address: editMemberAddress.trim() || selectedMember.address,
      nomineeName: editMemberNominee.trim() || undefined,
    });
    onRefreshData();
    setIsEditMemberModalOpen(false);
    const refreshed = StorageService.loadData().cardMembers.find((m) => m.id === selectedMember.id);
    if (refreshed) setSelectedMember(refreshed);
  };

  // 1-Click WhatsApp Welcome & Passbook Share Flow (Task 10)
  const handleSendWhatsAppWelcome = (member: CardMember) => {
    const cleanPhone = (member.phone || '').replace(/\D/g, '').slice(-10);
    if (!cleanPhone) {
      alert('कृपया आधी ग्राहकाचा वैध १०-अंकी मोबाईल नंबर टाका.');
      return;
    }
    const cardNum = extractCardNumber(member.cardNo) || member.cardNo;
    const sNo = resolveCardScheme(member);
    const conf = getSchemeConfig(sNo);
    const passbookUrl = `https://shrisaient.in/passbook?card=${cardNum}`;
    const waGroupUrl = `https://chat.whatsapp.com/invite/shrisaienterprises`;

    const welcomeMsg =
`*श्री साई इंटरप्राइजेस, वर्धा - आपले सहर्ष स्वागत!*
====================================
👤 *सन्माननीय ग्राहक:* ${member.memberName}
💳 *आपला बचत कार्ड नंबर:* #${cardNum}
🏷️ *योजना:* योजना ${sNo} (${conf.marathiName})
📍 *गाव / शहर:* ${member.village || member.address || 'वर्धा'}
💰 *मासिक हप्ता:* ₹${member.monthlyAmount || 1000}/-
------------------------------------
🌐 *आपले डिजिटल लाईव्ह पासबुक (Live Passbook Link):*
${passbookUrl}
(येथे आपण जमा केलेले सर्व हप्ते, पावत्या आणि लकी ड्रॉ निकाल कधीही पाहू शकता)
------------------------------------
👥 *श्री साई इंटरप्राइजेस अधिकृत ग्राहक व्हॉट्सॲप ग्रुप:*
${waGroupUrl}
(नवीन योजना, सणांच्या ऑफर्स आणि लकी ड्रॉ निकालासाठी लगेच ग्रुप जॉईन करा)
====================================
🙏 श्री साई इंटरप्राइजेस परिवारात सामील झाल्याबद्दल आपले मनःपूर्वक आभार!
📞 संपर्क: 8766486915 / 8600122798
📍 पत्ता: मातोश्री सभागृह समोर, आर्वी रोड, पंजाब कॉलनी, वर्धा`;

    window.open(`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(welcomeMsg)}`, '_blank');
  };

  // Collect Installment
  const openDepositModal = (member: CardMember, nextMonth: number) => {
    setSelectedMember(member);
    setDepositMonthNo(nextMonth);
    setDepositAmount(member.monthlyAmount || 1000);
    setDepositMode('Cash');
    setDepositRemarks('');
    setDepositSuccessReceipt(null);
    setIsDepositModalOpen(true);
  };

  const handleConfirmDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;

    const receipt = StorageService.collectCardInstallment({
      cardMemberId: selectedMember.id,
      monthNumber: depositMonthNo,
      amount: depositAmount,
      paymentMode: depositMode,
      collectedBy: 'Counter Staff',
      remarks: depositRemarks.trim() || `हप्ता महिना #${depositMonthNo}`,
    });

    onRefreshData();
    setIsDepositModalOpen(false);
    setDepositSuccessReceipt(receipt);

    // Refresh selected member state
    const refreshed = StorageService.loadData().cardMembers.find((m) => m.id === selectedMember.id);
    if (refreshed) setSelectedMember(refreshed);
  };

  // 1. Delete Card Member with Commission Rollback
  const handleConfirmDeleteCard = () => {
    if (!memberToDelete) return;
    setIsDeletingCard(true);
    try {
      const cardNum = memberToDelete.cardNo;
      const name = memberToDelete.memberName;
      const res = StorageService.deleteCardMember(memberToDelete.id);
      setSelectedMember(null);
      setMemberToDelete(null);
      onRefreshData();
      setDeleteToast(`कार्ड #${cardNum} (${name}) आणि संबंधित ₹${res.rolledBackAmount.toLocaleString('en-IN')} चा हिशोब यशस्वीरित्या हटवला व रोलबॅक केला गेला.`);
      setTimeout(() => setDeleteToast(null), 5000);
    } finally {
      setIsDeletingCard(false);
    }
  };

  // 2. Thermal Passbook Slip (Opens verified print modal with 58mm, 80mm & A4 options)
  const handlePrintMemberThermalSlip = (member: CardMember) => {
    setPrintPassbookMember(member);
  };

  // 3. Marathi WhatsApp Statement
  const handleShareWhatsAppStatement = (member: CardMember) => {
    const sNo = resolveCardScheme(member);
    const conf = getSchemeConfig(sNo);
    const cardNum = extractCardNumber(member.cardNo);
    const fin = getCardFinancialSummary(member);

    let msg = `*SHRI SAI ENTERPRISES, WARDHA (श्री साई इंटरप्रायजेस)*\n`;
    msg += `*CUSTOMER LEDGER STATEMENT (ग्राहक खातेवही)*\n`;
    msg += `----------------------------------------\n`;
    msg += `👤 *Customer (ग्राहक):* ${member.memberName}\n`;
    msg += `📞 *Mobile (मोबाईल):* ${member.phone && member.phone !== '0' ? member.phone : 'N/A'}\n`;
    msg += `📍 *Village / Address (पत्ता):* ${member.village || member.address || 'Wardha'}\n`;
    msg += `💳 *Card No (कार्ड क्र.):* #${cardNum} (${conf.marathiName})\n`;
    msg += `📅 *Date (दिनांक):* ${new Date().toLocaleDateString('en-IN')}\n`;
    msg += `----------------------------------------\n`;
    msg += `📊 *Account Summary (अचूक हिशोब सारांश):*\n`;
    msg += `• Total Scheme Target (एकूण योजना उद्दिष्ट): *₹${fin.schemeTarget.toLocaleString('en-IN')}*\n`;
    msg += `• Total Paid (एकूण जमा हप्ते): *₹${fin.totalPaid.toLocaleString('en-IN')}* (${fin.totalPaidMonths}/${fin.durationMonths} हप्ते जमा)\n`;
    msg += `• Balance Due (शिल्लक बाकी): *₹${fin.balanceDue.toLocaleString('en-IN')}* (देय बाकी)\n`;
    msg += `• हिशोब जुळवणी: ₹${fin.totalPaid.toLocaleString('en-IN')} + ₹${fin.balanceDue.toLocaleString('en-IN')} = ₹${fin.schemeTarget.toLocaleString('en-IN')} ✅ (१००% अचूक)\n`;
    msg += `----------------------------------------\n`;
    msg += `💳 *Payment Bank & UPI Details (पेमेंट तपशील):*\n`;
    msg += `• UPI ID: *8766486915@ybl*\n`;
    msg += `• Bank Name: *HDFC Bank*\n`;
    msg += `• Account No: *50200083215914*\n`;
    msg += `• IFSC Code: *HDFC0000065*\n`;
    msg += `Thank You! (धन्यवाद!)\n`;
    msg += `*SHRI SAI ENTERPRISES*\n`;
    msg += `📞 8600122978 / 9175537365 / 8766486915`;

    const encoded = encodeURIComponent(msg);
    const cleanPhone = member.phone.replace(/\D/g, '');
    const phoneParam = cleanPhone.length >= 10 ? `phone=91${cleanPhone.slice(-10)}&` : '';
    window.open(`https://api.whatsapp.com/send?${phoneParam}text=${encoded}`, '_blank');
  };

  // 4. Update member details (e.g. delivered item, bill info)
  const handleUpdateCardMember = async (updatedMember: CardMember) => {
    try {
      const updatedMembers = storeData.cardMembers.map((m) =>
        m.id === updatedMember.id ? updatedMember : m
      );
      await StorageService.saveData({
        ...storeData,
        cardMembers: updatedMembers,
      });
      setSelectedMember(updatedMember);
      onRefreshData();
    } catch (err) {
      console.error('Failed to update member item details:', err);
    }
  };

  // Conduct Lucky Draw
  const handleRunLuckyDraw = () => {
    const eligible = allEnrichedMembers.filter(
      (m) =>
        m.schemeNo === drawSchemeNo &&
        m.status === 'Active' &&
        m.totalPaidMonths > 0
    );

    if (eligible.length === 0) {
      alert(`योजना ${drawSchemeNo} मध्ये लकी ड्रॉसाठी पात्र (किमान १ हप्ता भरलेले) कोणतेही ॲक्टिव्ह मेंबर्स आढळले नाहीत.`);
      return;
    }

    setIsRolling(true);
    setDrawnWinner(null);

    let counter = 0;
    const interval = setInterval(() => {
      const randIdx = Math.floor(Math.random() * eligible.length);
      setDrawnWinner(eligible[randIdx]);
      counter++;

      if (counter > 16) {
        clearInterval(interval);
        const finalWinner = eligible[Math.floor(Math.random() * eligible.length)];
        setDrawnWinner(finalWinner);
        setIsRolling(false);

        // Update winner record
        const updated = StorageService.loadData();
        const mem = updated.cardMembers.find((m) => m.id === finalWinner.id);
        if (mem) {
          mem.status = 'Draw Winner';
          mem.drawMonthWon = selectedDrawMonth;
          mem.prizeDetails = `योजना ${drawSchemeNo} महिना ${selectedDrawMonth} ड्रॉ: ${drawPrizeTitle}`;
          StorageService.saveData(updated);
          onRefreshData();
        }
      }
    }, 110);
  };

  const currentTabConfig = typeof activeSchemeTab === 'number' ? getSchemeConfig(activeSchemeTab) : null;

  return (
    <div className="space-y-5">
      {/* 1. Header & Scheme Selector Navigation */}
      <div className={`p-4 sm:p-5 rounded-2xl border transition-colors ${
        isDayMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="flex flex-col 2xl:flex-row 2xl:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20 shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight font-playfair whitespace-nowrap">
                  30-Month Weekly Savings Scheme
                </h1>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-sans whitespace-nowrap">
                  (३०-महिने साप्ताहिक बचत योजना)
                </span>
                <span className="text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 px-2.5 py-0.5 rounded-full border border-amber-500/30 whitespace-nowrap">
                  ३० महिने • दरमहा ₹५०० • ₹१५,००० + ₹५०० बोनस = ₹१५,५००
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                योजना १ व २ (१००१-३०००) • योजना ३ व ४ (१००१-६०००) • अचूक पासबुक व हिशोब व्यवस्थापन
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap pt-2 2xl:pt-0 border-t 2xl:border-t-0 border-slate-100 dark:border-slate-800">
            <button
              onClick={() => {
                if (storeData.cardMembers.length > 0) {
                  setPrintPassbookMember(selectedMember || storeData.cardMembers[0]);
                }
              }}
              className="flex items-center gap-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 font-bold px-3 py-2 rounded-xl text-xs transition cursor-pointer border border-amber-500/40 shadow-sm active:scale-95 whitespace-nowrap"
              title="३०-महिने मूळ पासबुक कार्ड व १६ अधिकृत नियम व अटी"
            >
              <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0" />
              <span>१६ नियम व मूळ कार्ड</span>
            </button>

            <button
              id="btn-agent-beat-sheet"
              onClick={() => setIsBeatSheetModalOpen(true)}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold px-3 py-2 rounded-xl text-xs transition cursor-pointer border border-amber-500/30 shadow-sm active:scale-95 whitespace-nowrap"
            >
              <ClipboardList className="w-4 h-4 text-amber-400 shrink-0" />
              <span>दैनिक बीट शीट</span>
            </button>

            <button
              id="btn-scheme-weekly-collection"
              onClick={() => {
                if (!selectedMember && storeData.cardMembers.length > 0) {
                  setSelectedMember(storeData.cardMembers[0]);
                }
                setIsDepositModalOpen(true);
              }}
              className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold px-3 py-2 rounded-xl text-xs transition cursor-pointer shadow-sm shadow-emerald-700/20 active:scale-95 whitespace-nowrap"
            >
              <CreditCard className="w-4 h-4 text-white shrink-0" />
              <span>हप्ता संकलन (Collection)</span>
            </button>

            <button
              id="btn-scheme-lucky-draw"
              onClick={() => {
                setDrawSchemeNo(typeof activeSchemeTab === 'number' ? activeSchemeTab : 1);
                setDrawnWinner(null);
                setIsDrawModalOpen(true);
              }}
              className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold px-3 py-2 rounded-xl text-xs transition cursor-pointer shadow-sm shadow-orange-500/20 active:scale-95 whitespace-nowrap"
            >
              <Trophy className="w-4 h-4 text-slate-950 shrink-0" />
              <span>Lucky Draw</span>
            </button>

            <button
              id="btn-add-scheme-member"
              onClick={() => handleOpenNewMemberModal()}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-2 rounded-xl text-xs transition cursor-pointer shadow-sm shadow-emerald-600/20 active:scale-95 whitespace-nowrap"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>+ नवीन सभासद</span>
            </button>
          </div>
        </div>

        {/* Scheme Selection Tabs (Exact Ranges from User Request) */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
            <span>Select Scheme Batch <span className="text-[10px] font-normal opacity-80">(योजना निवडा)</span></span>
            <span className="text-[10px] text-slate-500 normal-case font-normal">
              Scheme 1 & 2: 1001-3000 • Scheme 3, 4, 5 & 6: 1001-6000
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {/* All Schemes Tab */}
            <button
              onClick={() => setActiveSchemeTab('all')}
              className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                activeSchemeTab === 'all'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md dark:bg-slate-100 dark:text-slate-900'
                  : isDayMode
                  ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">All Schemes <span className="text-[10px] font-normal opacity-80">(सर्व)</span></span>
                <span className="text-[10px] opacity-75 font-mono">ALL</span>
              </div>
              <div className="text-[11px] opacity-80 mt-1 font-semibold">
                {allEnrichedMembers.length} Cards (कार्ड्स)
              </div>
            </button>

            {/* Schemes 1 to 6 */}
            {[1, 2, 3, 4, 5, 6].map((sNo) => {
              const conf = getSchemeConfig(sNo);
              const isSelected = activeSchemeTab === sNo;
              const countInScheme = allEnrichedMembers.filter((m) => m.schemeNo === sNo).length;

              return (
                <button
                  key={sNo}
                  onClick={() => setActiveSchemeTab(sNo)}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                    isSelected
                      ? 'border-amber-500 bg-amber-500/10 text-amber-500 shadow-sm'
                      : isDayMode
                      ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold flex items-center gap-1">
                      <span>Scheme {sNo} <span className="text-[10px] font-normal opacity-80">({conf.marathiName})</span></span>
                    </span>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800/10 dark:bg-slate-800">
                      {conf.tag}
                    </span>
                  </div>
                  <div className="text-[11px] mt-1 flex items-center justify-between">
                    <span className="font-semibold">{countInScheme} Members (सभासद)</span>
                    {sNo >= 4 && (
                      <span className="text-[9px] text-purple-400 font-bold uppercase">Upcoming (भावी)</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Scheme KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={`p-3.5 rounded-2xl border ${
          isDayMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
        }`}>
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            {activeSchemeTab === 'all' ? 'Total Scheme Members (एकूण सभासद)' : `Scheme ${activeSchemeTab} Members (${currentTabConfig?.marathiName})`}
          </span>
          <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
            {schemeStats.total} <span className="text-xs font-normal text-slate-500">Cards (कार्ड्स)</span>
          </p>
          <span className="text-[11px] text-emerald-500 font-semibold flex items-center gap-1 mt-0.5">
            <Check className="w-3 h-3" /> {schemeStats.active} Active Passbooks (चालू)
          </span>
        </div>

        <div className={`p-3.5 rounded-2xl border ${
          isDayMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
        }`}>
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Scheme Pool (एकूण जमा फंड)</span>
          <p className="text-lg font-black text-amber-500 mt-0.5">
            ₹{schemeStats.totalPool.toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-slate-400">Weekly & Monthly Collection (संकलन)</span>
        </div>

        <div className={`p-3.5 rounded-2xl border ${
          isDayMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
        }`}>
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Lucky Draw Winners (लकी ड्रॉ विजेते)</span>
          <p className="text-lg font-black text-sky-500 mt-0.5">
            {schemeStats.winners} <span className="text-xs font-normal text-slate-500">Winners (विजेते)</span>
          </p>
          <span className="text-[11px] text-slate-400">TV, Fridge, Furniture Rewards (वाटप)</span>
        </div>

        <div className={`p-3.5 rounded-2xl border ${
          isDayMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
        }`}>
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Card Range (योजना मर्यादा)</span>
          <p className="text-base font-black text-slate-900 dark:text-white mt-0.5">
            {currentTabConfig ? currentTabConfig.tag : 'All Schemes (सर्व योजना)'}
          </p>
          <span className="text-[11px] text-slate-400">
            {currentTabConfig ? `30 Months • ₹${currentTabConfig.monthlyAmount}/mo (३० महिने)` : 'All Card Batches (सर्व गट)'}
          </span>
        </div>
      </div>

      {/* 3. Main Workspace: Search & Directory (5 Cols) + Digital Passbook & Ledger (7 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-w-0 w-full">
        {/* Left Side: Member Directory (5 cols) */}
        <div className={`lg:col-span-5 min-w-0 overflow-hidden rounded-2xl border p-4 space-y-3.5 flex flex-col ${
          isDayMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
        }`}>
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              placeholder="Search Card No (e.g. 1050), Name, Phone, Village... (शोध)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full rounded-xl pl-10 pr-4 py-2 text-xs border focus:outline-none focus:ring-1 focus:ring-amber-500 transition ${
                isDayMode
                  ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                  : 'bg-slate-950 border-slate-800 text-white placeholder-slate-500'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2 text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Status Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
            {(['all', 'Active', 'Billed', 'Unbilled', 'Overdue', 'Draw Winner', 'Matured'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition cursor-pointer text-[11px] ${
                  statusFilter === st
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : isDayMode
                    ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {st === 'all'
                  ? 'All Members (सर्व सभासद)'
                  : st === 'Active'
                  ? 'Active (चालू)'
                  : st === 'Billed'
                  ? '🧾 बिल झालेले (Billed)'
                  : st === 'Unbilled'
                  ? '⏳ बिल बाकी (Unbilled)'
                  : st === 'Overdue'
                  ? '२+ थकीत हप्ते (Overdue)'
                  : st === 'Draw Winner'
                  ? 'Lucky Draw Winner (विजेते)'
                  : 'Matured (मुदत पूर्ण)'}
              </button>
            ))}
          </div>

          {/* Member Card List */}
          <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
            {filteredMembers.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No members found. Please adjust filters or enroll a new member (कोणतेही सभासद सापडले नाहीत).
              </div>
            ) : (
              filteredMembers.map((member) => {
                const isSelected = selectedMember?.id === member.id;
                const badgeClasses = getSchemeBadgeClasses(member.schemeNo);
                const progressPct = Math.round(
                  (member.totalPaidMonths / (member.durationMonths || 30)) * 100
                );

                return (
                  <div
                    key={member.id}
                    onClick={() => setSelectedMember(member)}
                    className={`p-3 rounded-xl border transition cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500 shadow-sm'
                        : isDayMode
                        ? 'bg-slate-50 border-slate-200 hover:border-slate-300'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Scheme Tag */}
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeClasses.badge}`}
                          >
                            Scheme {member.schemeNo} ({member.schemeConfig.tag})
                          </span>

                          {/* Card Number */}
                          <span className="font-mono text-xs font-black text-slate-900 dark:text-white bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded">
                            #{member.numericCardNo || member.cardNo}
                          </span>

                          {/* Bill Status Badge on Member Card */}
                          {member.deliveredItemName || member.itemBillNo ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1 whitespace-nowrap">
                              <Check className="w-2.5 h-2.5 text-emerald-600 stroke-[3]" />
                              <span className="truncate max-w-[105px]">बिल: {member.deliveredItemName || `#${member.itemBillNo}`}</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                              ⏳ बिल बाकी
                            </span>
                          )}

                          {member.status === 'Draw Winner' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500 text-slate-950 flex items-center gap-1">
                              <Trophy className="w-2.5 h-2.5" /> Winner (विजेता)
                            </span>
                          )}
                        </div>

                        <h3 className="text-xs font-bold text-slate-900 dark:text-white mt-1.5 truncate">
                          {member.memberName}
                        </h3>

                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                          <span>{member.phone}</span>
                          {member.village && (
                            <>
                              <span>•</span>
                              <span className="truncate">{member.village}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-xs font-black text-amber-500">
                          ₹{member.totalAmountPaid.toLocaleString('en-IN')}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {member.totalPaidMonths} / {member.durationMonths || 30} Mos (महिने)
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-2.5">
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-amber-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, progressPct)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* 1-Tap Direct Installment Deposit Button for Mobile & Desktop */}
                    <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between gap-2">
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {member.totalPaidMonths >= (member.durationMonths || 30) ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">योजना पूर्ण (Matured)</span>
                        ) : (
                          <span>पुढील: <strong>#{member.totalPaidMonths + 1}</strong> हप्ता</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDepositModal(member, member.totalPaidMonths + 1);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition cursor-pointer touch-manipulation min-h-[34px]"
                        title="हप्ता जमा करा"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>हप्ता जमा (₹{member.monthlyAmount || 100})</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Digital Passbook & Ledger (7 cols) */}
        <div className={`lg:col-span-7 min-w-0 overflow-hidden rounded-2xl border p-4 sm:p-5 space-y-4 ${
          isDayMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
        }`}>
          {selectedMember ? (
            <div className="space-y-4 min-w-0">
              {/* Member Profile Top Header Card */}
              <div className={`p-4 rounded-xl border flex flex-col xl:flex-row justify-between gap-4 min-w-0 ${
                isDayMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
              }`}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 whitespace-nowrap">
                      Scheme {resolveCardScheme(selectedMember)} ({selectedMember.schemeName || 'बचत योजना'})
                    </span>
                    <span className="font-mono text-sm font-black text-slate-900 dark:text-white bg-slate-200 dark:bg-slate-800 px-2.5 py-0.5 rounded whitespace-nowrap">
                      Card #{extractCardNumber(selectedMember.cardNo) || selectedMember.cardNo}
                    </span>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase whitespace-nowrap">
                      {selectedMember.status}
                    </span>

                    {/* Member Profile Bill Status Indicator */}
                    {selectedMember.deliveredItemName || selectedMember.itemBillNo ? (
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-600 text-white whitespace-nowrap flex items-center gap-1 shadow-xs">
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>बिल: #{selectedMember.itemBillNo || 'नोंद'} ({selectedMember.deliveredItemName || 'वस्तू डिलिव्हरी'})</span>
                      </span>
                    ) : (
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 whitespace-nowrap flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>अद्याप बिल नाही (बचत चालू)</span>
                      </span>
                    )}
                  </div>

                  <h2 className="text-base font-black text-slate-900 dark:text-white mt-1.5 uppercase truncate">
                    {selectedMember.memberName}
                  </h2>

                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 space-y-0.5">
                    <p className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{selectedMember.phone}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{selectedMember.address || selectedMember.village || 'Wardha (वर्धा)'}</span>
                    </p>
                    {selectedMember.nomineeName && (
                      <p className="text-[11px] truncate">
                        Nominee (वारसदार): <strong className="text-slate-800 dark:text-slate-200">{selectedMember.nomineeName}</strong>
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-left xl:text-right space-y-1 min-w-0">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Deposited (एकूण जमा)</span>
                  <p className="text-2xl font-black text-amber-500">
                    ₹{selectedMember.totalAmountPaid.toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                    {selectedMember.totalPaidMonths} of {selectedMember.durationMonths || 30} Installments Deposited (हप्ते जमा)
                  </p>

                  <div className="flex flex-wrap items-center xl:justify-end gap-1.5 mt-2">
                    {selectedMember.totalPaidMonths < (selectedMember.durationMonths || 30) && (
                      <button
                        id="btn-collect-next-installment"
                        onClick={() =>
                          openDepositModal(selectedMember, selectedMember.totalPaidMonths + 1)
                        }
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm shadow-amber-500/20 active:scale-95 whitespace-nowrap"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>हप्ता जमा (#{selectedMember.totalPaidMonths + 1})</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handlePrintMemberThermalSlip(selectedMember)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 transition cursor-pointer border border-slate-700 whitespace-nowrap"
                      title="Print 58mm POS thermal passbook slip"
                    >
                      <Printer className="w-3.5 h-3.5 text-amber-400" />
                      <span>थर्मल पावती (58mm)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleShareWhatsAppStatement(selectedMember)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 transition cursor-pointer shadow-sm whitespace-nowrap"
                      title="Share Marathi passbook ledger on WhatsApp"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>WhatsApp खातेवही</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSendWhatsAppWelcome(selectedMember)}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 transition cursor-pointer shadow-sm whitespace-nowrap"
                      title="Send Welcome & Live Passbook link via WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>स्वागत मेसेज</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEditMemberModal(selectedMember)}
                      className="border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 transition cursor-pointer whitespace-nowrap"
                      title="गाव आणि संपर्क माहिती बदला (Edit village, phone, etc.)"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-amber-500" />
                      <span>माहिती बदला</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMemberToDelete(selectedMember)}
                      className="border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 transition cursor-pointer whitespace-nowrap"
                      title="कार्ड हटवा आणि कमिशन रोलबॅक करा (Delete card & rollback)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>कार्ड हटवा</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Winner Prize Banner if applicable */}
              {selectedMember.prizeDetails && (
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-500 text-xs flex items-center gap-3">
                  <Trophy className="w-6 h-6 text-amber-500 shrink-0" />
                  <div>
                    <strong className="block text-slate-900 dark:text-white font-bold">
                      Lucky Draw Prize Winner! (लकी ड्रॉ बक्षीस विजेता)
                    </strong>
                    <span>{selectedMember.prizeDetails}</span>
                  </div>
                </div>
              )}

              {/* Interactive 30-Month Passbook Card Replica & Saving Khata */}
              <InteractiveDigitalCard
                member={selectedMember}
                transactions={storeData.cardTransactions}
                storeTransactions={storeData.transactions}
                settings={storeData.settings}
                onDepositNext={(monthNo) => openDepositModal(selectedMember, monthNo)}
                onUpdateMember={handleUpdateCardMember}
                onOpenPrintModal={() => setPrintPassbookMember(selectedMember)}
              />

              {/* Dynamic UPI Quick Pay QR Code Box */}
              <div
                className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
                  isDayMode
                    ? 'bg-gradient-to-r from-amber-50/70 to-orange-50/70 border-amber-200 shadow-sm'
                    : 'bg-gradient-to-r from-slate-950 to-slate-900 border-amber-500/20'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="bg-white p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(
                        `upi://pay?pa=8766486915@ybl&pn=Shri%20Sai%20Enterprises&am=${
                          selectedMember.monthlyAmount || 1000
                        }&cu=INR&tn=Card%20${extractCardNumber(selectedMember.cardNo)}%20Installment`
                      )}`}
                      alt="UPI QR Code"
                      className="w-18 h-18"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 dark:text-white">
                      <QrCode className="w-4 h-4 text-amber-500" />
                      <span>थेट UPI स्कॅन आणि पेमेंट (GPay / PhonePe / Paytm)</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      हप्ता रक्कम: <strong className="text-amber-500 font-bold">₹{selectedMember.monthlyAmount || 1000}</strong> (कार्ड #{extractCardNumber(selectedMember.cardNo)})
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 text-[11px] font-mono bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 w-fit">
                      <span>UPI: <strong>8766486915@ybl</strong></span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText('8766486915@ybl');
                          setCopyUpiSuccess(true);
                          setTimeout(() => setCopyUpiSuccess(false), 2000);
                        }}
                        className="text-amber-500 hover:text-amber-400 cursor-pointer ml-1"
                        title="Copy UPI ID"
                      >
                        {copyUpiSuccess ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    शिल्लक देय रक्कम (Due Balance)
                  </span>
                  <span className="text-base font-black text-rose-500 font-mono">
                    ₹{getCardBalanceDue(selectedMember).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Passbook Transactions History */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Receipts History <span className="text-xs font-normal text-slate-400 font-sans">(जमा पावत्यांची नोंद)</span></span>
                  <span className="text-[10px] text-slate-400">
                    {storeData.cardTransactions.filter((ct) => ct.cardMemberId === selectedMember.id).length} Receipts (पावत्या)
                  </span>
                </h3>

                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                  {storeData.cardTransactions.filter((ct) => ct.cardMemberId === selectedMember.id).length === 0 ? (
                    <div className="p-4 text-center text-slate-500 text-xs bg-slate-50 dark:bg-slate-950/40 rounded-xl">
                      No counter receipts logged yet for this member (Initial recorded sum: ₹{selectedMember.totalAmountPaid}).
                    </div>
                  ) : (
                    storeData.cardTransactions
                      .filter((ct) => ct.cardMemberId === selectedMember.id)
                      .map((rec) => (
                        <div
                          key={rec.id}
                          className={`flex justify-between items-center p-2.5 rounded-xl border text-xs ${
                            isDayMode
                              ? 'bg-slate-50 border-slate-200 text-slate-800'
                              : 'bg-slate-950/80 border-slate-800 text-slate-200'
                          }`}
                        >
                          <div>
                            <span className="font-bold">Receipt #{rec.receiptNo} <span className="text-[10px] font-normal opacity-75">(पावती)</span></span>
                            <span className="text-slate-400 ml-2">Installment Month #{rec.monthNumber} (महिना)</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-amber-500 font-black">₹{rec.amount}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {new Date(rec.date).toLocaleDateString('en-IN')}
                            </span>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-24 text-center text-slate-400 text-xs space-y-2">
              <CreditCard className="w-10 h-10 mx-auto text-slate-400 opacity-60" />
              <p className="font-bold text-slate-700 dark:text-slate-300">
                Select Any Card From The Left Directory (कार्ड निवडा)
              </p>
              <p className="text-[11px] text-slate-500">
                Click on any member card to inspect their 30-month digital passbook and deposit upcoming installments.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 4. Modal: Weekly Installment Collection matching user reference model */}
      <WeeklyCardCollectionModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        initialMember={selectedMember}
        storeData={storeData}
        onRefreshData={() => {
          onRefreshData();
          if (selectedMember) {
            const updated = StorageService.loadData().cardMembers.find((m) => m.id === selectedMember.id);
            if (updated) setSelectedMember(updated);
          }
        }}
        defaultAgentName="Rahul Sharma"
      />

      {/* 5. Modal: Enroll New 30-Month Scheme Member */}
      {isNewMemberModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className={`rounded-2xl border w-full max-w-lg overflow-hidden shadow-2xl my-6 ${
            isDayMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <div className={`px-5 py-4 border-b flex items-center justify-between ${
              isDayMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}>
              <div>
                <h3 className="text-sm font-bold">Enroll 30-Month Scheme Member <span className="text-xs font-normal text-slate-400 font-sans">(नवीन सभासद नोंदणी)</span></h3>
                <p className="text-[11px] text-slate-500">
                  Select scheme batch and assign card number in 1001-3000 or 1001-6000 range.
                </p>
              </div>
              <button
                onClick={() => setIsNewMemberModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRegisterMember} className="p-5 space-y-4 text-xs">
              {formValidationError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formValidationError}</span>
                </div>
              )}

              {/* Scheme Plan Type Selector (₹15,000 vs ₹30,000 vs Custom) */}
              <div>
                <label className="text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-1">
                  Scheme Type & Target Amount (योजनेचा प्रकार व फायनल रक्कम) *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormPlanType('15000_scheme');
                      setFormTargetAmount(15000);
                      if (formMonthlyAmount > 200) setFormMonthlyAmount(100);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      formPlanType === '15000_scheme'
                        ? 'bg-amber-500 text-slate-950 font-bold border-amber-500 shadow-sm'
                        : isDayMode
                        ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="text-xs font-black">₹15,000 योजना</div>
                    <div className="text-[10px] opacity-80 mt-0.5">हप्ता ₹100 / ₹200</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormPlanType('30000_scheme');
                      setFormTargetAmount(30000);
                      setFormMonthlyAmount(1000);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      formPlanType === '30000_scheme'
                        ? 'bg-amber-500 text-slate-950 font-bold border-amber-500 shadow-sm'
                        : isDayMode
                        ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="text-xs font-black">₹30,000 योजना</div>
                    <div className="text-[10px] opacity-80 mt-0.5">हप्ता ₹1,000 (किंवा ₹250)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormPlanType('custom_scheme')}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      formPlanType === 'custom_scheme'
                        ? 'bg-amber-500 text-slate-950 font-bold border-amber-500 shadow-sm'
                        : isDayMode
                        ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="text-xs font-black">सानुकूल (Custom)</div>
                    <div className="text-[10px] opacity-80 mt-0.5">मनपसंत हप्ता व रक्कम</div>
                  </button>
                </div>
              </div>

              {/* Scheme Batch Selector */}
              <div>
                <label className="text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-1">
                  Select Scheme Batch (बचत योजना तुकडी) *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6].map((sNo) => {
                    const conf = getSchemeConfig(sNo);
                    const isSel = formSchemeNo === sNo;
                    return (
                      <button
                        type="button"
                        key={sNo}
                        onClick={() => handleFormSchemeChange(sNo)}
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                          isSel
                            ? 'bg-amber-500 text-slate-950 font-bold border-amber-500 shadow-sm'
                            : isDayMode
                            ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="text-xs font-bold">Scheme {sNo} ({conf.marathiName})</div>
                        <div className="text-[10px] opacity-80 mt-0.5">{conf.tag}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Card Number, Installment, Target Amount & Agent Mapping */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-1">
                    Card Number (कार्ड क्र.) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min={getSchemeConfig(formSchemeNo).minCard}
                      max={getSchemeConfig(formSchemeNo).maxCard}
                      value={formCardNoNum}
                      onChange={(e) => {
                        setFormCardNoNum(e.target.value);
                        setFormValidationError(null);
                      }}
                      className={`w-full rounded-xl px-3 py-2 text-sm font-mono font-bold border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                        isDayMode
                          ? 'bg-slate-50 border-slate-200 text-slate-900'
                          : 'bg-slate-950 border-slate-800 text-white'
                      }`}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    मर्यादा: {getSchemeConfig(formSchemeNo).minCard} - {getSchemeConfig(formSchemeNo).maxCard}
                  </span>
                </div>

                <div>
                  <label className="text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-1">
                    Installment (हप्ता ₹) *
                  </label>
                  <div className="flex items-center gap-1 mb-1.5 overflow-x-auto">
                    {[100, 200, 250, 500, 1000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setFormMonthlyAmount(amt)}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold transition cursor-pointer ${
                          formMonthlyAmount === amt
                            ? 'bg-amber-500 text-slate-950 shadow-sm'
                            : isDayMode ? 'bg-slate-200 text-slate-700' : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        ₹{amt}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    value={formMonthlyAmount}
                    onChange={(e) => setFormMonthlyAmount(parseInt(e.target.value, 10) || 100)}
                    className={`w-full rounded-xl px-3 py-2 text-sm font-bold border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                      isDayMode
                        ? 'bg-slate-50 border-slate-200 text-slate-900'
                        : 'bg-slate-950 border-slate-800 text-white'
                    }`}
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">साप्ताहिक/मासिक हप्ता</span>
                </div>

                <div>
                  <label className="text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-1">
                    Final Maturity (एकूण रक्कम ₹) *
                  </label>
                  <div className="flex items-center gap-1 mb-1.5">
                    <button
                      type="button"
                      onClick={() => setFormTargetAmount(15000)}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold transition cursor-pointer ${
                        formTargetAmount === 15000
                          ? 'bg-emerald-500 text-white shadow-sm'
                          : isDayMode ? 'bg-slate-200 text-slate-700' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      ₹15,000
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormTargetAmount(30000)}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold transition cursor-pointer ${
                        formTargetAmount === 30000
                          ? 'bg-emerald-500 text-white shadow-sm'
                          : isDayMode ? 'bg-slate-200 text-slate-700' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      ₹30,000
                    </button>
                  </div>
                  <input
                    type="number"
                    value={formTargetAmount}
                    onChange={(e) => setFormTargetAmount(parseInt(e.target.value, 10) || 15000)}
                    className={`w-full rounded-xl px-3 py-2 text-sm font-bold text-emerald-600 dark:text-emerald-400 border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                      isDayMode
                        ? 'bg-slate-50 border-slate-200'
                        : 'bg-slate-950 border-slate-800'
                    }`}
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">परिपक्वता खरेदी कूपन मूल्य</span>
                </div>
              </div>

              {/* Agent Allocation */}
              <div>
                <label className="text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-1">
                  Assigned Agent / Staff (वसुली एजंट नियुक्ती)
                </label>
                <select
                  value={formAgent}
                  onChange={(e) => setFormAgent(e.target.value)}
                  className={`w-full rounded-xl px-3 py-2 text-xs font-bold border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                    isDayMode
                      ? 'bg-slate-50 border-slate-200 text-slate-900'
                      : 'bg-slate-950 border-slate-800 text-white'
                  }`}
                >
                  {['राहुल (Rahul)', 'सचिन (Sachin)', 'प्रवीण (Praveen)', 'मंगेश (Mangesh)', 'अनिकेत (Aniket)', 'Counter Staff'].map((ag) => (
                    <option key={ag} value={ag}>
                      {ag} (4% वसुली कमिशन मॅपिंग)
                    </option>
                  ))}
                </select>
              </div>

              {/* Member Full Name */}
              <div>
                <label className="text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-1">
                  Full Name (सभासदाचे नाव) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mangesh Vinayakrao Deshmukh (नाव)"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className={`w-full rounded-xl px-3 py-2 border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                    isDayMode
                      ? 'bg-slate-50 border-slate-200 text-slate-900'
                      : 'bg-slate-950 border-slate-800 text-white'
                  }`}
                />
              </div>

              {/* Mobile and Nominee */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-1">
                    Mobile Number (मोबाईल) *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="98220 12345"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className={`w-full rounded-xl px-3 py-2 border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                      isDayMode
                        ? 'bg-slate-50 border-slate-200 text-slate-900'
                        : 'bg-slate-950 border-slate-800 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-1">
                    Nominee (वारसदार नाव)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Wife / Son (वारसदार)"
                    value={formNominee}
                    onChange={(e) => setFormNominee(e.target.value)}
                    className={`w-full rounded-xl px-3 py-2 border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                      isDayMode
                        ? 'bg-slate-50 border-slate-200 text-slate-900'
                        : 'bg-slate-950 border-slate-800 text-white'
                    }`}
                  />
                </div>
              </div>

              {/* Village & Address (Task 4: Standardized Village Selection & Add New Village) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400">
                      Village / Town (गाव / शहर) *
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsAddVillageModalOpen(true)}
                      className="text-[10px] font-bold text-amber-500 hover:text-amber-400 cursor-pointer underline flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+ नवीन गाव जोडा</span>
                    </button>
                  </div>
                  <select
                    value={formVillage}
                    onChange={(e) => {
                      if (e.target.value === '__add_new__') {
                        setIsAddVillageModalOpen(true);
                      } else {
                        setFormVillage(e.target.value);
                      }
                    }}
                    className={`w-full rounded-xl px-3 py-2 border text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                      isDayMode
                        ? 'bg-slate-50 border-slate-200 text-slate-900'
                        : 'bg-slate-950 border-slate-800 text-white'
                    }`}
                  >
                    {availableVillages.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                    <option value="__add_new__">+ नवीन गाव टाईप करा / Add New...</option>
                  </select>

                  {/* Popular Village Quick-Select Chips */}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {['Wardha (वर्धा)', 'Seloo (सेलू)', 'Deoli (देवळी)', 'Pulgaon (पुलगाव)', 'Sevagram (सेवाग्राम)'].map((quickV) => (
                      <button
                        key={quickV}
                        type="button"
                        onClick={() => setFormVillage(quickV)}
                        className={`text-[10px] px-2 py-0.5 rounded-md border transition cursor-pointer ${
                          formVillage === quickV
                            ? 'bg-amber-500 text-slate-950 font-bold border-amber-500'
                            : isDayMode
                            ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {quickV.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-1">
                    Address / Area (पत्ता / गल्ली)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Kelkar Wadi, Main Road (पत्ता)"
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    className={`w-full rounded-xl px-3 py-2 border text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                      isDayMode
                        ? 'bg-slate-50 border-slate-200 text-slate-900'
                        : 'bg-slate-950 border-slate-800 text-white'
                    }`}
                  />
                </div>
              </div>

              {/* Scheme Summary Box */}
              <div className={`p-3 rounded-xl border text-[11px] space-y-1 ${
                isDayMode ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}>
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <div>
                    योजना: <strong className="text-slate-900 dark:text-white">Scheme {formSchemeNo} ({getSchemeConfig(formSchemeNo).marathiName})</strong> |
                    कार्ड कोड: <strong className="text-amber-500 font-mono">SCH{formSchemeNo}-{formCardNoNum}</strong>
                  </div>
                  <div>
                    हप्ता: <strong className="text-amber-600 dark:text-amber-400">₹{formMonthlyAmount}/-</strong>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-1 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                  <div>
                    परिपक्वता लक्ष्य (Target): <strong className="text-emerald-500 font-bold">₹{formTargetAmount.toLocaleString('en-IN')}</strong> कूपन खरेदी
                  </div>
                  <div>
                    एजंट: <strong className="text-slate-900 dark:text-white font-medium">{formAgent}</strong> (४% कमिशन)
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewMemberModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel (रद्द करा)
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-sm shadow-emerald-600/20 cursor-pointer active:scale-95"
                >
                  Register Member & Create Passbook (नोंदणी करा)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Modal: Lucky Draw */}
      {isDrawModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className={`rounded-3xl border w-full max-w-lg overflow-hidden shadow-2xl ${
            isDayMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <div className={`px-5 py-4 border-b flex items-center justify-between ${
              isDayMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}>
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-bold">Monthly Lucky Draw <span className="text-xs font-normal text-slate-400 font-sans">(मासिक लकी ड्रॉ)</span></h3>
              </div>
              <button
                onClick={() => setIsDrawModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs">
              {/* Select Scheme & Month for Draw */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] uppercase font-bold text-slate-500 block mb-1">
                    Select Scheme Batch (योजना बॅच)
                  </label>
                  <select
                    value={drawSchemeNo}
                    disabled={isRolling}
                    onChange={(e) => setDrawSchemeNo(parseInt(e.target.value, 10))}
                    className={`w-full rounded-xl px-3 py-2 text-xs border font-bold ${
                      isDayMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    {[1, 2, 3, 4, 5, 6].map((sNo) => (
                      <option key={sNo} value={sNo}>
                        Scheme {sNo} ({getSchemeConfig(sNo).tag})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] uppercase font-bold text-slate-500 block mb-1">
                    Draw Month Number (ड्रॉ महिना)
                  </label>
                  <select
                    value={selectedDrawMonth}
                    disabled={isRolling}
                    onChange={(e) => setSelectedDrawMonth(parseInt(e.target.value, 10))}
                    className={`w-full rounded-xl px-3 py-2 text-xs border font-bold ${
                      isDayMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    {Array.from({ length: 30 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>
                        Month #{m} Lucky Draw (महिना #{m})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Prize Details */}
              <div>
                <label className="text-[11px] uppercase font-bold text-slate-500 block mb-1">
                  Draw Prize (ड्रॉ बक्षीस)
                </label>
                <input
                  type="text"
                  value={drawPrizeTitle}
                  disabled={isRolling}
                  onChange={(e) => setDrawPrizeTitle(e.target.value)}
                  className={`w-full rounded-xl px-3 py-2 text-xs border font-semibold ${
                    isDayMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                  }`}
                />
              </div>

              {/* Winner Animation Roulette Display */}
              <div className={`p-6 rounded-2xl border text-center relative overflow-hidden ${
                drawnWinner
                  ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-amber-500 shadow-lg shadow-amber-500/10'
                  : isDayMode
                  ? 'bg-slate-50 border-slate-200'
                  : 'bg-slate-950 border-slate-800'
              }`}>
                {drawnWinner ? (
                  <div className="space-y-2 animate-pulse">
                    <Trophy className="w-12 h-12 text-amber-500 mx-auto" />
                    <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">
                      {isRolling ? 'Spinning Roulette... (फिरत आहे)' : '🎉 Lucky Draw Winner! (भाग्यवान विजेता) 🎉'}
                    </span>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase">
                      {drawnWinner.memberName}
                    </h2>
                    <div className="text-xs text-slate-500 font-bold">
                      Scheme {resolveCardScheme(drawnWinner)} • Card #{extractCardNumber(drawnWinner.cardNo) || drawnWinner.cardNo} • {drawnWinner.village || drawnWinner.address}
                    </div>
                  </div>
                ) : (
                  <div className="py-6 space-y-2 text-slate-400">
                    <Gift className="w-10 h-10 text-amber-500 mx-auto opacity-80" />
                    <p className="font-bold text-xs">Press Below Button To Start Draw (ड्रॉ सुरू करा)</p>
                    <p className="text-[10px] text-slate-500">
                      All active, up-to-date members of Scheme {drawSchemeNo} are eligible.
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  disabled={isRolling}
                  onClick={() => setIsDrawModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Close (बंद करा)
                </button>
                <button
                  type="button"
                  disabled={isRolling}
                  onClick={handleRunLuckyDraw}
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-xl shadow-md shadow-orange-500/20 cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {isRolling ? 'Rolling... (फिरत आहे)' : 'Spin & Draw Winner (लकी ड्रॉ काढा)'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Modal: Delete Customer Card Confirmation with Commission Rollback */}
      {memberToDelete && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={`rounded-2xl border w-full max-w-md overflow-hidden shadow-2xl ${
              isDayMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
            }`}
          >
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-rose-500/10 flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <h3 className="font-black text-sm">कार्ड हटवा आणि कमिशन रोलबॅक (Delete Card)</h3>
              </div>
              <button
                type="button"
                onClick={() => setMemberToDelete(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">कार्ड क्रमांक (Card No):</span>
                  <strong className="text-amber-500 font-mono text-sm">#{extractCardNumber(memberToDelete.cardNo)}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ग्राहकाचे नाव (Customer):</span>
                  <strong className="text-slate-800 dark:text-slate-200">{memberToDelete.memberName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">गाव / पत्ता (Village):</span>
                  <span>{memberToDelete.village || memberToDelete.address || 'Wardha'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">एकूण जमा रक्कम (Total Paid):</span>
                  <strong className="text-rose-500 font-bold">₹{memberToDelete.totalAmountPaid.toLocaleString('en-IN')}</strong>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-[11px] leading-relaxed">
                <strong>⚠️ सावधान (Warning):</strong><br />
                हे कार्ड हटवल्यास सभासदाचा सर्व डेटा काढला जाईल आणि सर्व जमा रकमेचे कमिशन लेजरमधून रोलबॅक केले जाईल. ही कृती पूर्ववत करता येणार नाही.
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  disabled={isDeletingCard}
                  onClick={() => setMemberToDelete(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  रद्द करा (Cancel)
                </button>
                <button
                  type="button"
                  disabled={isDeletingCard}
                  onClick={handleConfirmDeleteCard}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-md shadow-rose-600/20 cursor-pointer flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDeletingCard ? 'हटवत आहे...' : 'होय, कार्ड हटवा (Confirm Delete)'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. Modal: Agent Daily Beat Sheet (दैनिक बीट शीट) */}
      {isBeatSheetModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div
            className={`rounded-2xl border w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl ${
              isDayMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
            }`}
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base uppercase tracking-tight">
                    दैनिक बीट शीट (Agent Daily Collection Beat Sheet)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    श्री साई इंटरप्रायजेस • फील्ड एजंट संकलन यादी व मार्ग नियोजन
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const printWin = window.open('', '_blank', 'width=900,height=700');
                    if (!printWin) return;
                    const membersToPrint = allEnrichedMembers.filter(
                      (m) => beatVillageFilter === 'all' || (m.village || m.address || '').toLowerCase().includes(beatVillageFilter.toLowerCase())
                    );
                    printWin.document.write(`
                      <!DOCTYPE html>
                      <html>
                      <head>
                        <title>Daily Beat Sheet - Shri Sai Enterprises</title>
                        <style>
                          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 11px; margin: 15px; }
                          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                          th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
                          th { background: #f0f0f0; }
                          .header { text-align: center; margin-bottom: 12px; }
                          .title { font-size: 16px; font-weight: bold; }
                        </style>
                      </head>
                      <body>
                        <div class="header">
                          <div class="title">SHRI SAI ENTERPRISES, WARDHA</div>
                          <div>DAILY COLLECTION BEAT SHEET (दैनिक संकलन बीट शीट)</div>
                          <div>तारीख: ${new Date().toLocaleDateString('en-IN')} | गाव/मार्ग: ${beatVillageFilter === 'all' ? 'सर्व गावे' : beatVillageFilter}</div>
                        </div>
                        <table>
                          <thead>
                            <tr>
                              <th>क्र.</th>
                              <th>कार्ड क्र.</th>
                              <th>सभासदाचे नाव</th>
                              <th>मोबाईल</th>
                              <th>गाव/पत्ता</th>
                              <th>हप्ता</th>
                              <th>जमा हप्ते</th>
                              <th>सही/शेरा</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${membersToPrint.map((m, idx) => `
                              <tr>
                                <td>${idx + 1}</td>
                                <td>#${extractCardNumber(m.cardNo)}</td>
                                <td><b>${m.memberName}</b></td>
                                <td>${m.phone}</td>
                                <td>${m.village || m.address || 'Wardha'}</td>
                                <td>₹${m.monthlyAmount || 1000}</td>
                                <td>${m.totalPaidMonths} / ${m.durationMonths || 30}</td>
                                <td style="width: 80px;"></td>
                              </tr>
                            `).join('')}
                          </tbody>
                        </table>
                      </body>
                      </html>
                    `);
                    printWin.document.close();
                    printWin.focus();
                    setTimeout(() => printWin.print(), 300);
                  }}
                  className="flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs transition cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>प्रिंट बीट शीट (Print)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsBeatSheetModalOpen(false)}
                  className="text-slate-400 hover:text-slate-200 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Village Filter Tabs */}
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-[11px] font-bold text-slate-400 mr-1 shrink-0">गाव / Route:</span>
              {['all', 'Wardha', 'Sindi Meghe', 'Deoli', 'Seloo', 'Hinganghat', 'Pulgaon'].map((vil) => (
                <button
                  key={vil}
                  type="button"
                  onClick={() => setBeatVillageFilter(vil)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    beatVillageFilter === vil
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                      : isDayMode
                      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {vil === 'all' ? 'सर्व गावे (All)' : vil}
                </button>
              ))}
            </div>

            {/* Members Beat List */}
            <div className="p-4 flex-1 overflow-y-auto space-y-2">
              {allEnrichedMembers
                .filter(
                  (m) =>
                    beatVillageFilter === 'all' ||
                    (m.village || m.address || '').toLowerCase().includes(beatVillageFilter.toLowerCase())
                )
                .map((m) => {
                  const cardNum = extractCardNumber(m.cardNo);
                  const isOverdue = m.status === 'Active' && m.totalPaidMonths < 3;
                  return (
                    <div
                      key={m.id}
                      className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                        isDayMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 font-black flex items-center justify-center border border-amber-500/20 shrink-0 font-mono text-xs">
                          #{cardNum}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white">{m.memberName}</span>
                            {isOverdue && (
                              <span className="text-[10px] bg-rose-500/15 text-rose-500 px-1.5 py-0.5 rounded font-bold">
                                थकीत (Overdue)
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                            <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{m.phone}</span>
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{m.village || m.address || 'Wardha'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-slate-800">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">जमा हप्ते</span>
                          <span className="font-bold text-amber-500">{m.totalPaidMonths} / {m.durationMonths || 30}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMember(m);
                            setIsBeatSheetModalOpen(false);
                            setIsDepositModalOpen(true);
                          }}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition cursor-pointer flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>हप्ता जमा (₹{m.monthlyAmount || 1000})</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* 8. Modal: Add New Village / Town (Task 4) */}
      {isAddVillageModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={`rounded-2xl border w-full max-w-md overflow-hidden shadow-2xl ${
              isDayMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
            }`}
          >
            <div
              className={`px-5 py-4 border-b flex items-center justify-between ${
                isDayMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-sm">नवीन गाव जोडा (Add New Village)</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddVillageModalOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddCustomVillage(newVillageNameInput);
              }}
              className="p-5 space-y-4 text-xs"
            >
              <div>
                <label className="text-[11px] uppercase font-bold text-slate-500 block mb-1">
                  गावाचे नाव (Village Name in Marathi / English) *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="उदा. Anji Mothi (आंजी मोठी)"
                  value={newVillageNameInput}
                  onChange={(e) => setNewVillageNameInput(e.target.value)}
                  className={`w-full rounded-xl px-3 py-2.5 text-xs font-semibold border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                    isDayMode ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddVillageModalOpen(false)}
                  className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                >
                  रद्द करा
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-sm"
                >
                  गाव सेव्ह करा
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. Modal: Edit Customer Info (Task 4) */}
      {isEditMemberModalOpen && selectedMember && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={`rounded-2xl border w-full max-w-lg overflow-hidden shadow-2xl ${
              isDayMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
            }`}
          >
            <div
              className={`px-5 py-4 border-b flex items-center justify-between ${
                isDayMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-sm">
                  ग्राहक माहिती बदला (Edit Member #{extractCardNumber(selectedMember.cardNo)})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditMemberModalOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditMember} className="p-5 space-y-4 text-xs">
              <div>
                <label className="text-[11px] uppercase font-bold text-slate-500 block mb-1">
                  ग्राहकाचे पूर्ण नाव (Full Name) *
                </label>
                <input
                  type="text"
                  required
                  value={editMemberName}
                  onChange={(e) => setEditMemberName(e.target.value)}
                  className={`w-full rounded-xl px-3 py-2 border text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                    isDayMode ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] uppercase font-bold text-slate-500 block mb-1">
                    मोबाईल नंबर (Phone) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={editMemberPhone}
                    onChange={(e) => setEditMemberPhone(e.target.value)}
                    className={`w-full rounded-xl px-3 py-2 border text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                      isDayMode ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-[11px] uppercase font-bold text-slate-500 block mb-1">
                    वारसदार (Nominee)
                  </label>
                  <input
                    type="text"
                    value={editMemberNominee}
                    onChange={(e) => setEditMemberNominee(e.target.value)}
                    className={`w-full rounded-xl px-3 py-2 border text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                      isDayMode ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                    }`}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] uppercase font-bold text-slate-500">
                    गाव / शहर (Village / Beat) *
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsAddVillageModalOpen(true)}
                    className="text-[10px] font-bold text-amber-500 underline"
                  >
                    + नवीन गाव
                  </button>
                </div>
                <select
                  value={editMemberVillage}
                  onChange={(e) => {
                    if (e.target.value === '__add_new__') {
                      setIsAddVillageModalOpen(true);
                    } else {
                      setEditMemberVillage(e.target.value);
                    }
                  }}
                  className={`w-full rounded-xl px-3 py-2 border text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                    isDayMode ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                  }`}
                >
                  {availableVillages.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                  <option value="__add_new__">+ नवीन गाव...</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] uppercase font-bold text-slate-500 block mb-1">
                  पत्ता / गल्ली (Full Address)
                </label>
                <input
                  type="text"
                  value={editMemberAddress}
                  onChange={(e) => setEditMemberAddress(e.target.value)}
                  className={`w-full rounded-xl px-3 py-2 border text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                    isDayMode ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditMemberModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                >
                  रद्द करा
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-sm cursor-pointer"
                >
                  बदल सेव्ह करा (Save Changes)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 10. Modal: New Customer Welcome Flow (Task 10) */}
      {welcomeMember && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div
            className={`rounded-3xl border w-full max-w-md overflow-hidden shadow-2xl text-center ${
              isDayMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
            }`}
          >
            <div className="p-6 space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center border border-emerald-500/30">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-500 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  नवीन नोंदणी यशस्वी (Registration Complete)
                </span>
                <h3 className="text-lg font-black mt-2 text-slate-900 dark:text-white">
                  {welcomeMember.memberName}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  कार्ड नंबर: <strong className="text-amber-500 font-mono">#{extractCardNumber(welcomeMember.cardNo)}</strong> ({welcomeMember.village || 'वर्धा'})
                </p>
              </div>

              <div className={`p-4 rounded-2xl border text-xs text-left space-y-2 ${
                isDayMode ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-950 border-slate-800 text-slate-300'
              }`}>
                <div className="flex justify-between">
                  <span className="text-slate-400">योजना:</span>
                  <span className="font-bold">योजना {resolveCardScheme(welcomeMember)} (३० महिने)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">मासिक हप्ता:</span>
                  <span className="font-bold text-amber-500">₹{welcomeMember.monthlyAmount || 1000}/-</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">लाईव्ह पासबुक:</span>
                  <span className="text-emerald-500 font-mono text-[11px] truncate">shrisaient.in/passbook?card={extractCardNumber(welcomeMember.cardNo)}</span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleSendWhatsAppWelcome(welcomeMember)}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 cursor-pointer active:scale-95 transition"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>व्हॉट्सॲपवर स्वागत मेसेज आणि पासबुक पाठवा</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handlePrintMemberThermalSlip(welcomeMember)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Printer className="w-3.5 h-3.5 text-amber-500" />
                    <span>थर्मल पावती प्रिंट</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setWelcomeMember(null)}
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    पूर्ण (Done)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Passbook Print Modal */}
      {printPassbookMember && (
        <CardPassbookPrintModal
          member={printPassbookMember}
          transactions={storeData.cardTransactions}
          settings={storeData.settings}
          isOpen={true}
          onClose={() => setPrintPassbookMember(null)}
        />
      )}

      {/* Delete Success Toast Notification */}
      {deleteToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{deleteToast}</span>
        </div>
      )}
    </div>
  );
};
