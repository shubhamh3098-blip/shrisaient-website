import React, { useState, useMemo } from 'react';
import {
  FileText,
  CreditCard,
  Receipt,
  Search,
  CheckCircle2,
  Calendar,
  User,
  Phone,
  MapPin,
  Package,
  Layers,
  ArrowRight,
  Plus,
  Trash2,
  AlertCircle,
  Clock,
  Printer,
  Sparkles,
  RefreshCw,
  FolderArchive,
  Check,
  Eye,
  Tag,
  DollarSign
} from 'lucide-react';
import { StoreData, CardMember, Transaction, BillReceipt, Customer, CardTransaction } from '../../types';
import { StorageService } from '../../services/storageService';
import { useTheme } from '../../context/ThemeContext';
import { SCHEME_CONFIGS, getSchemeConfig } from '../../utils/schemeUtils';

interface OldRecordEntryViewProps {
  storeData: StoreData;
  onRefreshData: () => void;
  onNavigate?: (tab: string) => void;
}

export const OldRecordEntryView: React.FC<OldRecordEntryViewProps> = ({
  storeData,
  onRefreshData,
  onNavigate,
}) => {
  const { isDayMode } = useTheme();

  // 3 Distinct Tabs: 'old_card' | 'old_bill' | 'old_receipt'
  const [activeTab, setActiveTab] = useState<'old_card' | 'old_bill' | 'old_receipt'>('old_card');

  // Success / Error Notifications
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  const showToast = (msg: string, isError = false) => {
    if (isError) {
      setErrorToast(msg);
      setTimeout(() => setErrorToast(null), 4000);
    } else {
      setSuccessToast(msg);
      setTimeout(() => setSuccessToast(null), 3500);
    }
  };

  // Known village list from existing customers/cards for quick dropdown
  const villageList = useMemo(() => {
    const set = new Set<string>();
    storeData.customers.forEach((c) => {
      if (c.village) set.add(c.village);
      if (c.city) set.add(c.city);
    });
    storeData.cardMembers.forEach((m) => {
      if (m.village) set.add(m.village);
      if (m.address) set.add(m.address);
    });
    const arr = Array.from(set).filter(Boolean).sort();
    return arr.length > 0 ? arr : ['Wardha', 'Hingni', 'Waifad', 'Seloo', 'Sevagram', 'Deoli', 'Sindi Meghe', 'Nalwadi'];
  }, [storeData.customers, storeData.cardMembers]);

  // ==========================================
  // SECTION 1: OLD SCHEME CARD ENTRY STATE
  // ==========================================
  const [cardSchemeNo, setCardSchemeNo] = useState<number>(1);
  const [cardNo, setCardNo] = useState<string>('');
  const [cardMemberName, setCardMemberName] = useState<string>('');
  const [cardVillage, setCardVillage] = useState<string>('');
  const [cardPhone, setCardPhone] = useState<string>('');
  const [cardSheetNo, setCardSheetNo] = useState<string>('1');
  const [cardDate, setCardDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [cardOpeningAmt, setCardOpeningAmt] = useState<string>('500');
  const [cardPaidMonths, setCardPaidMonths] = useState<string>('1');
  const [cardTotalPaid, setCardTotalPaid] = useState<string>('500');
  const [cardTargetAmt, setCardTargetAmt] = useState<string>('15000');
  const [cardAgent, setCardAgent] = useState<string>('Shubham');
  const [cardStatus, setCardStatus] = useState<'Active' | 'Draw Winner' | 'Matured'>('Active');
  
  // Attached Item Details (Old Khata Delivery)
  const [hasDeliveredItem, setHasDeliveredItem] = useState(false);
  const [deliveredItemName, setDeliveredItemName] = useState('');
  const [deliveredItemBillNo, setDeliveredItemBillNo] = useState('');
  const [deliveredItemBillDate, setDeliveredItemBillDate] = useState('');
  const [deliveredItemTotalAmt, setDeliveredItemTotalAmt] = useState('');
  const [deliveredItemBalanceDue, setDeliveredItemBalanceDue] = useState('');

  // Scheme 1/2/3 Card Counts
  const scheme1CardsCount = useMemo(() => storeData.cardMembers.filter(m => (m.schemeNo || 1) === 1).length, [storeData.cardMembers]);
  const scheme2CardsCount = useMemo(() => storeData.cardMembers.filter(m => m.schemeNo === 2).length, [storeData.cardMembers]);
  const scheme3CardsCount = useMemo(() => storeData.cardMembers.filter(m => m.schemeNo === 3).length, [storeData.cardMembers]);

  const handleCardOpeningAmtChange = (val: string) => {
    setCardOpeningAmt(val);
    const amt = parseFloat(val) || 0;
    const months = parseInt(cardPaidMonths, 10) || 1;
    setCardTotalPaid(String(amt * months));
  };

  const handleCardPaidMonthsChange = (val: string) => {
    setCardPaidMonths(val);
    const months = parseInt(val, 10) || 0;
    const amt = parseFloat(cardOpeningAmt) || 0;
    setCardTotalPaid(String(amt * months));
  };

  const isCardDuplicate = useMemo(() => {
    if (!cardNo.trim()) return false;
    const cleanNo = cardNo.trim().toUpperCase();
    return storeData.cardMembers.some(
      (m) => (m.schemeNo || 1) === cardSchemeNo && m.cardNo.trim().toUpperCase() === cleanNo
    );
  }, [cardNo, cardSchemeNo, storeData.cardMembers]);

  const handleSaveOldCard = (e: React.FormEvent) => {
    e.preventDefault();

    if (!cardNo.trim()) {
      showToast('कृपया कार्ड नंबर (CARD.NO) टाका!', true);
      return;
    }

    if (!cardMemberName.trim()) {
      showToast('कृपया सभासदाचे नाव (NAME) टाका!', true);
      return;
    }

    if (isCardDuplicate) {
      showToast(`कार्ड क्र. ${cardNo} योजना ${cardSchemeNo} मध्ये आधीच नोंदवले गेले आहे! कृपया वेगळा कार्ड नंबर वापरा.`, true);
      return;
    }

    const schemeConf = getSchemeConfig(cardSchemeNo);
    const monthsPaid = parseInt(cardPaidMonths, 10) || 0;
    const monthlyAmt = parseFloat(cardOpeningAmt) || schemeConf.monthlyAmount;
    const totalPaid = parseFloat(cardTotalPaid) || (monthsPaid * monthlyAmt);
    const targetAmt = parseFloat(cardTargetAmt) || (cardSchemeNo === 3 ? 30000 : 15000);

    const newCardId = `card-old-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const formattedCardNo = cardNo.trim();

    const newCard: CardMember = {
      id: newCardId,
      cardNo: formattedCardNo,
      schemeNo: cardSchemeNo,
      schemeName: schemeConf.name,
      sheetNo: cardSheetNo.trim() || '1',
      memberName: cardMemberName.trim().toUpperCase(),
      phone: cardPhone.trim() || '9822000000',
      address: cardVillage.trim() || 'Wardha',
      village: cardVillage.trim() || 'Wardha',
      durationMonths: 30,
      monthlyAmount: monthlyAmt,
      targetAmount: targetAmt,
      startDate: cardDate || new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: cardStatus,
      totalPaidMonths: monthsPaid,
      paidMonthsCount: monthsPaid,
      totalAmountPaid: totalPaid,
      totalPaid: totalPaid,
      isLuckyDrawEligible: cardStatus === 'Active' && monthsPaid >= 1,
      collectedBy: cardAgent.trim() || 'Direct Showroom',
      notes: `जुनी कार्ड नोंद (Import Format) - Sheet No: ${cardSheetNo}`,
      ...(hasDeliveredItem ? {
        deliveredItemName: deliveredItemName.trim(),
        itemBillNo: deliveredItemBillNo.trim(),
        itemBillDate: deliveredItemBillDate || cardDate,
        itemTotalAmount: parseFloat(deliveredItemTotalAmt) || 0,
        itemBalanceDue: parseFloat(deliveredItemBalanceDue) || 0,
      } : {}),
    };

    const initialTx: CardTransaction[] = [];
    if (monthsPaid > 0 && totalPaid > 0) {
      initialTx.push({
        id: `ctx-${Date.now()}-init`,
        receiptNo: `RCP-${formattedCardNo}-01`,
        cardMemberId: newCardId,
        cardNo: formattedCardNo,
        memberName: cardMemberName.trim().toUpperCase(),
        monthNumber: Math.min(monthsPaid, 30),
        amount: totalPaid,
        date: cardDate,
        paymentMode: 'Cash',
        collectedBy: cardAgent.trim() || 'Showroom Entry',
        remarks: `जुनी नोंदणी हप्ता जमा (${monthsPaid} महिने)`,
      });
    }

    const updatedCardMembers = [newCard, ...storeData.cardMembers];
    const updatedCardTx = [...initialTx, ...storeData.cardTransactions];

    StorageService.saveData({
      ...storeData,
      cardMembers: updatedCardMembers,
      cardTransactions: updatedCardTx,
    });

    onRefreshData();
    showToast(`✓ कार्ड क्र. ${formattedCardNo} (योजना ${cardSchemeNo}) यशस्वीरित्या नोंदवले गेले!`);

    const numPart = parseInt(formattedCardNo, 10);
    if (!isNaN(numPart)) {
      setCardNo(String(numPart + 1));
    } else {
      setCardNo('');
    }
    setCardMemberName('');
    setCardPhone('');
    setHasDeliveredItem(false);
    setDeliveredItemName('');
    setDeliveredItemBillNo('');
  };

  // ==========================================
  // SECTION 2: OLD BILL / INVOICE ENTRY STATE
  // ==========================================
  const [billNo, setBillNo] = useState<string>('BILL-1001');
  const [billDate, setBillDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerVillage, setCustomerVillage] = useState<string>('Wardha');
  const [itemName, setItemName] = useState<string>('');
  const [billTotalAmt, setBillTotalAmt] = useState<string>('');
  const [billPaidAmt, setBillPaidAmt] = useState<string>('');
  const [billBalanceDue, setBillBalanceDue] = useState<string>('0');
  const [billPaymentMode, setBillPaymentMode] = useState<'Cash' | 'UPI' | 'Cheque' | 'Card'>('Cash');
  const [billAgent, setBillAgent] = useState<string>('Shubham');

  const handleBillTotalAmtChange = (val: string) => {
    setBillTotalAmt(val);
    const total = parseFloat(val) || 0;
    const paid = parseFloat(billPaidAmt) || 0;
    setBillBalanceDue(String(Math.max(0, total - paid)));
  };

  const handleBillPaidAmtChange = (val: string) => {
    setBillPaidAmt(val);
    const total = parseFloat(billTotalAmt) || 0;
    const paid = parseFloat(val) || 0;
    setBillBalanceDue(String(Math.max(0, total - paid)));
  };

  const handleCustomerPhoneChange = (phone: string) => {
    setCustomerPhone(phone);
    if (phone.length >= 10) {
      const existing = storeData.customers.find((c) => c.phone.includes(phone));
      if (existing) {
        if (!customerName) setCustomerName(existing.name);
        if (!customerVillage && existing.village) setCustomerVillage(existing.village);
      }
    }
  };

  const handleSaveOldBill = (e: React.FormEvent) => {
    e.preventDefault();

    if (!billNo.trim()) {
      showToast('कृपया बिल/इनव्हॉईस नंबर टाका!', true);
      return;
    }

    if (!customerName.trim()) {
      showToast('कृपया ग्राहकाचे नाव टाका!', true);
      return;
    }

    const totalAmt = parseFloat(billTotalAmt) || 0;
    if (totalAmt <= 0) {
      showToast('कृपया बिलाची एकूण रक्कम टाका!', true);
      return;
    }

    const paidAmt = parseFloat(billPaidAmt) || 0;
    const balanceDue = parseFloat(billBalanceDue) || Math.max(0, totalAmt - paidAmt);
    const cleanCustomerName = customerName.trim().toUpperCase();
    const cleanPhone = customerPhone.trim() || '9822000000';
    const cleanVillage = customerVillage.trim() || 'Wardha';

    let customerId = '';
    const existingCust = storeData.customers.find(
      (c) => c.name.toLowerCase() === cleanCustomerName.toLowerCase() || (cleanPhone !== '9822000000' && c.phone === cleanPhone)
    );

    let updatedCustomers = [...storeData.customers];

    if (existingCust) {
      customerId = existingCust.id;
      updatedCustomers = updatedCustomers.map((c) => {
        if (c.id === customerId) {
          return {
            ...c,
            totalPurchased: (c.totalPurchased || 0) + totalAmt,
            currentBalance: (c.currentBalance || 0) + balanceDue,
            village: c.village || cleanVillage,
          };
        }
        return c;
      });
    } else {
      customerId = `cust-old-${Date.now()}`;
      const newCust: Customer = {
        id: customerId,
        name: cleanCustomerName,
        phone: cleanPhone,
        address: cleanVillage,
        city: cleanVillage,
        village: cleanVillage,
        creditLimit: 100000,
        currentBalance: balanceDue,
        totalPurchased: totalAmt,
        createdAt: billDate || new Date().toISOString(),
      };
      updatedCustomers.unshift(newCust);
    }

    const newTxId = `tx-old-${Date.now()}`;
    const newTx: Transaction = {
      id: newTxId,
      invoiceNo: billNo.trim().toUpperCase(),
      date: billDate || new Date().toISOString().split('T')[0],
      customerId: customerId,
      customerName: cleanCustomerName,
      customerPhone: cleanPhone,
      customerAddress: cleanVillage,
      items: [
        {
          stockId: 'old-item',
          name: itemName.trim() || 'Showroom Goods / जुना माल',
          brand: 'Standard',
          qty: 1,
          rate: totalAmt,
          discountPct: 0,
          taxPct: 0,
          total: totalAmt,
        },
      ],
      subtotal: totalAmt,
      discountTotal: 0,
      taxTotal: 0,
      grandTotal: totalAmt,
      paidAmount: paidAmt,
      balanceDue: balanceDue,
      paymentMode: billPaymentMode,
      status: balanceDue <= 0 ? 'Paid' : paidAmt > 0 ? 'Partial' : 'Unpaid',
      deliveryStatus: 'Delivered',
      createdBy: billAgent.trim() || 'Old Data Entry',
      remarks: `जुने बिल नोंद (Import Format) - वस्तू: ${itemName || 'General'}`,
    };

    StorageService.saveData({
      ...storeData,
      customers: updatedCustomers,
      transactions: [newTx, ...storeData.transactions],
    });

    onRefreshData();
    showToast(`✓ बिल क्र. ${billNo} यशस्वीरित्या सेव्ह झाले!`);

    const match = billNo.match(/\d+/);
    if (match) {
      const nextNum = parseInt(match[0], 10) + 1;
      setBillNo(billNo.replace(/\d+/, String(nextNum)));
    } else {
      setBillNo('');
    }
    setCustomerName('');
    setCustomerPhone('');
    setItemName('');
    setBillTotalAmt('');
    setBillPaidAmt('');
    setBillBalanceDue('0');
  };

  // ==========================================
  // SECTION 3: DEDICATED SEPARATE RECEIPT ENTRY
  // ==========================================
  const [rcpNumber, setRcpNumber] = useState<string>(
    String(storeData.settings?.nextReceiptNo || 1079)
  );
  const [rcpDate, setRcpDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [rcpCustomerName, setRcpCustomerName] = useState<string>('');
  const [rcpPhone, setRcpPhone] = useState<string>('');
  const [rcpVillage, setRcpVillage] = useState<string>('Wardha');
  const [rcpAmount, setRcpAmount] = useState<string>('');
  const [rcpPaymentMode, setRcpPaymentMode] = useState<'Cash' | 'UPI' | 'Cheque' | 'Card'>('Cash');
  const [rcpBillRef, setRcpBillRef] = useState<string>('');
  const [rcpCollectedBy, setRcpCollectedBy] = useState<string>('Shubham');
  const [rcpRemarks, setRcpRemarks] = useState<string>('');

  const handleRcpPhoneChange = (phone: string) => {
    setRcpPhone(phone);
    if (phone.length >= 10) {
      const existing = storeData.customers.find((c) => c.phone.includes(phone));
      if (existing) {
        if (!rcpCustomerName) setRcpCustomerName(existing.name);
        if (!rcpVillage && existing.village) setRcpVillage(existing.village);
      }
    }
  };

  const handleSaveDedicatedReceipt = (e: React.FormEvent) => {
    e.preventDefault();

    const parsedRcpNo = parseInt(rcpNumber, 10);
    if (!parsedRcpNo || isNaN(parsedRcpNo)) {
      showToast('कृपया वैध पावती नंबर (Receipt No) टाका!', true);
      return;
    }

    if (!rcpCustomerName.trim()) {
      showToast('कृपया खातेदाराचे / ग्राहकाचे नाव टाका!', true);
      return;
    }

    const amt = parseFloat(rcpAmount) || 0;
    if (amt <= 0) {
      showToast('कृपया पावतीची जमा रक्कम टाका!', true);
      return;
    }

    const cleanCustName = rcpCustomerName.trim().toUpperCase();
    const cleanPhone = rcpPhone.trim() || '9822000000';
    const cleanVillage = rcpVillage.trim() || 'Wardha';

    // Find or link customer
    let custId = '';
    const existing = storeData.customers.find(
      (c) => c.name.toLowerCase() === cleanCustName.toLowerCase() || (cleanPhone !== '9822000000' && c.phone === cleanPhone)
    );

    let updatedCustomers = [...storeData.customers];
    let remainingBal = 0;

    if (existing) {
      custId = existing.id;
      remainingBal = Math.max(0, (existing.currentBalance || 0) - amt);
      updatedCustomers = updatedCustomers.map((c) => {
        if (c.id === custId) {
          return {
            ...c,
            currentBalance: remainingBal,
          };
        }
        return c;
      });
    } else {
      custId = `cust-rcp-${Date.now()}`;
      updatedCustomers.unshift({
        id: custId,
        name: cleanCustName,
        phone: cleanPhone,
        address: cleanVillage,
        city: cleanVillage,
        village: cleanVillage,
        creditLimit: 50000,
        currentBalance: 0,
        totalPurchased: amt,
        createdAt: rcpDate || new Date().toISOString(),
      });
    }

    const newReceipt: BillReceipt = {
      id: `rcp-ded-${Date.now()}`,
      receiptNo: parsedRcpNo,
      customerId: custId,
      customerName: cleanCustName,
      invoiceNo: rcpBillRef.trim() || undefined,
      amountPaid: amt,
      date: rcpDate || new Date().toISOString().split('T')[0],
      paymentMode: rcpPaymentMode,
      balanceRemaining: remainingBal,
      handledBy: rcpCollectedBy.trim() || 'Showroom Cashier',
      remarks: rcpRemarks.trim() || `थेट पावती नोंद #${parsedRcpNo}`,
    };

    const nextNo = parsedRcpNo + 1;

    StorageService.saveData({
      ...storeData,
      customers: updatedCustomers,
      billReceipts: [newReceipt, ...storeData.billReceipts],
      settings: {
        ...storeData.settings,
        nextReceiptNo: nextNo,
      },
    });

    onRefreshData();
    showToast(`✓ पावती #${parsedRcpNo} (₹${amt.toLocaleString('en-IN')}) यशस्वीरित्या नोंदवली गेली!`);

    // Auto increment receipt number for rapid consecutive data entry
    setRcpNumber(String(nextNo));
    setRcpCustomerName('');
    setRcpPhone('');
    setRcpAmount('');
    setRcpBillRef('');
    setRcpRemarks('');
  };

  // Recent previews
  const recentOldCards = useMemo(() => storeData.cardMembers.slice(0, 10), [storeData.cardMembers]);
  const recentOldBills = useMemo(() => storeData.transactions.slice(0, 10), [storeData.transactions]);
  const recentOldReceipts = useMemo(() => storeData.billReceipts.slice(0, 10), [storeData.billReceipts]);

  return (
    <div className="space-y-6 pb-16">
      {/* Toast notifications */}
      {successToast && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-400 font-bold text-sm animate-bounce">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}
      {errorToast && (
        <div className="fixed top-20 right-6 z-50 bg-rose-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-rose-400 font-bold text-sm animate-pulse">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className={`p-6 rounded-3xl border shadow-xl relative overflow-hidden ${
        isDayMode
          ? 'bg-gradient-to-r from-amber-50 via-sky-50 to-indigo-50 border-amber-200 text-slate-900'
          : 'bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/80 border-slate-800 text-white'
      }`}>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500 text-slate-950 tracking-wider uppercase">
                पुराना डेटा व पावती नोंदणी
              </span>
              <span className="text-xs text-amber-500 font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Import Format Compatible
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2.5">
              <FolderArchive className="w-7 h-7 text-amber-400" />
              <span>जुने बिल, पावती व योजना कार्ड नोंदणी (Old Record Entry)</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              जसे एक्सेल/CSV मध्ये इंपोर्ट केले होते, तसेच एकापाठोपाठ एक जुने इनव्हॉईस, जमा पावत्या (#१०७९+) आणि योजना १, २, ३ ची कार्ड्स थेट सिस्टीममध्ये भरा.
            </p>
          </div>

          {/* Quick Stats Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className={`px-4 py-2.5 rounded-2xl border text-center ${
              isDayMode ? 'bg-white border-slate-200' : 'bg-slate-950/80 border-slate-800'
            }`}>
              <div className="text-[10px] text-slate-400 uppercase font-bold">एकूण जमा पावत्या</div>
              <div className="text-lg font-black text-teal-400">#{storeData.settings?.nextReceiptNo || 1079}</div>
            </div>
            <div className={`px-4 py-2.5 rounded-2xl border text-center ${
              isDayMode ? 'bg-white border-slate-200' : 'bg-slate-950/80 border-slate-800'
            }`}>
              <div className="text-[10px] text-slate-400 uppercase font-bold">योजना १ कार्ड्स</div>
              <div className="text-lg font-black text-amber-400">{scheme1CardsCount}</div>
            </div>
            <div className={`px-4 py-2.5 rounded-2xl border text-center ${
              isDayMode ? 'bg-white border-slate-200' : 'bg-slate-950/80 border-slate-800'
            }`}>
              <div className="text-[10px] text-slate-400 uppercase font-bold">योजना २/३ कार्ड्स</div>
              <div className="text-lg font-black text-sky-400">{scheme2CardsCount + scheme3CardsCount}</div>
            </div>
          </div>
        </div>

        {/* 3 Dedicated Separate Mode Switcher Tabs */}
        <div className="mt-6 flex items-center gap-2 border-b border-slate-700/50 pb-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('old_card')}
            className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-black transition flex items-center gap-2.5 cursor-pointer shrink-0 ${
              activeTab === 'old_card'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 scale-[1.02]'
                : isDayMode
                ? 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 border border-slate-700'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>१. जुने योजना कार्ड नोंदणी (Scheme 1, 2, 3 Cards)</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-black/20 font-mono">
              {storeData.cardMembers.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('old_bill')}
            className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-black transition flex items-center gap-2.5 cursor-pointer shrink-0 ${
              activeTab === 'old_bill'
                ? 'bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/25 scale-[1.02]'
                : isDayMode
                ? 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 border border-slate-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>२. जुने विक्री बिल / इनव्हॉईस नोंदणी (Old Sales Bills)</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-black/20 font-mono">
              {storeData.transactions.length}
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
            <Receipt className="w-4 h-4" />
            <span>३. स्वतंत्र जुनी जमा पावती नोंद (#१०७९+) (Receipt Section)</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-black/20 font-mono">
              {storeData.billReceipts.length}
            </span>
          </button>

          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('receipts')}
              className={`px-4 py-3 rounded-2xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shrink-0 ml-auto ${
                isDayMode
                  ? 'bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200'
                  : 'bg-teal-500/10 text-teal-300 hover:bg-teal-500/20 border border-teal-500/30'
              }`}
            >
              <span>अधिकृत पावती विभागात जा →</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: OLD SCHEME CARD ENTRY (योजना १, २, ३)             */}
      {/* ========================================================= */}
      {activeTab === 'old_card' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className={`lg:col-span-8 p-6 rounded-3xl border shadow-xl ${
            isDayMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-700/50 mb-6">
              <div>
                <h2 className="text-lg font-black flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-amber-400" />
                  <span>जुने योजना कार्ड फॉर्म (Import Format)</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  एक्सेलचे कॉलम्स: NAME, CARD.NO, VILLEGE, MOBILE.NO, OPENING AMT, DATE, SHEET NO
                </p>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
                योजना १, २, ३ विशेष
              </span>
            </div>

            <form onSubmit={handleSaveOldCard} className="space-y-5">
              {/* Scheme Batch Selector: 1, 2, 3 */}
              <div>
                <label className="text-xs font-black uppercase text-slate-400 block mb-2 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span>बचत योजना निवडा (Select Scheme Batch 1, 2, 3) *</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3].map((sNo) => {
                    const conf = getSchemeConfig(sNo);
                    const isSelected = cardSchemeNo === sNo;
                    return (
                      <button
                        type="button"
                        key={sNo}
                        onClick={() => {
                          setCardSchemeNo(sNo);
                          if (sNo === 3) {
                            setCardTargetAmt('30000');
                            if (cardOpeningAmt === '100' || cardOpeningAmt === '200') setCardOpeningAmt('500');
                          } else {
                            setCardTargetAmt('15000');
                          }
                        }}
                        className={`p-3.5 rounded-2xl border text-left transition cursor-pointer relative ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 font-black border-amber-500 shadow-md scale-[1.02]'
                            : isDayMode
                            ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-black">योजना {sNo}</span>
                          {isSelected && <Check className="w-4 h-4 text-slate-950" />}
                        </div>
                        <div className="text-[11px] opacity-80 mt-1 font-mono">
                          कार्ड क्र. {conf.minCard} - {conf.maxCard}
                        </div>
                        <div className="text-[10px] opacity-75 mt-0.5">
                          {sNo === 3 ? 'महा-बचत ₹३०,०००' : '३० महिने ₹१५,०००'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* CARD.NO, SHEET NO, DATE */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">
                    कार्ड नंबर (CARD.NO) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="उदा. 1030"
                    value={cardNo}
                    onChange={(e) => setCardNo(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl font-mono text-base font-black border focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      isCardDuplicate
                        ? 'border-rose-500 bg-rose-500/10 text-rose-400'
                        : isDayMode
                        ? 'bg-slate-50 border-slate-200 text-slate-900'
                        : 'bg-slate-950 border-slate-800 text-white'
                    }`}
                  />
                  {isCardDuplicate ? (
                    <span className="text-[10px] text-rose-400 mt-1 block">
                      ⚠ हे कार्ड योजना {cardSchemeNo} मध्ये आधीच नोंदवलेले आहे!
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {getSchemeConfig(cardSchemeNo).tag}
                    </span>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">
                    शिट नंबर (SHEET NO)
                  </label>
                  <input
                    type="text"
                    placeholder="उदा. 1 किंवा A"
                    value={cardSheetNo}
                    onChange={(e) => setCardSheetNo(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-bold border focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      isDayMode ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                    }`}
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">एक्सेल शीट क्रम</span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">
                    नोंद तारीख (DATE)
                  </label>
                  <input
                    type="date"
                    value={cardDate}
                    onChange={(e) => setCardDate(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-bold border focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      isDayMode ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                    }`}
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">सुरुवात दिनांक</span>
                </div>
              </div>

              {/* NAME, MOBILE.NO, VILLEGE */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">
                    सभासदाचे नाव (NAME) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="उदा. SANGITA UTTAM PATIL"
                    value={cardMemberName}
                    onChange={(e) => setCardMemberName(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-bold uppercase border focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      isDayMode ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">
                    मोबाईल नंबर (MOBILE.NO)
                  </label>
                  <input
                    type="tel"
                    placeholder="उदा. 7972811639"
                    value={cardPhone}
                    onChange={(e) => setCardPhone(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-mono font-bold border focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      isDayMode ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">
                    गाव / शहर (VILLEGE) *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      list="villageOptions"
                      placeholder="उदा. HINGNI"
                      value={cardVillage}
                      onChange={(e) => setCardVillage(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-bold border focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                        isDayMode ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                      }`}
                    />
                    <datalist id="villageOptions">
                      {villageList.map((v) => (
                        <option key={v} value={v} />
                      ))}
                    </datalist>
                  </div>
                </div>
              </div>

              {/* OPENING AMT, PAID MONTHS, TOTAL PAID, STATUS */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">
                    हप्ता रक्कम (OPENING AMT)
                  </label>
                  <input
                    type="number"
                    value={cardOpeningAmt}
                    onChange={(e) => handleCardOpeningAmtChange(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl text-sm font-mono font-black border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                      isDayMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-amber-400'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">
                    भरलेले महिने (PAID MONTHS)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={cardPaidMonths}
                    onChange={(e) => handleCardPaidMonthsChange(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl text-sm font-mono font-black border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                      isDayMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                    }`}
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">एकूण ३० पैकी</span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">
                    एकूण जमा (TOTAL PAID ₹)
                  </label>
                  <input
                    type="number"
                    value={cardTotalPaid}
                    onChange={(e) => setCardTotalPaid(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl text-sm font-mono font-black border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                      isDayMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-emerald-400'
                    }`}
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">खात्यात जमा रक्कम</span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">
                    स्थिती (STATUS)
                  </label>
                  <select
                    value={cardStatus}
                    onChange={(e) => setCardStatus(e.target.value as any)}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-bold border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                      isDayMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                    }`}
                  >
                    <option value="Active">Active (सक्रिय - ड्रॉसाठी पात्र)</option>
                    <option value="Draw Winner">Draw Winner (विजेता)</option>
                    <option value="Matured">Matured (पूर्ण झाले)</option>
                  </select>
                </div>
              </div>

              {/* Collapsible: Attached Delivered Item / Old Bill */}
              <div className={`p-4 rounded-2xl border transition ${
                hasDeliveredItem ? 'border-indigo-500/40 bg-indigo-500/5' : 'border-slate-800 bg-slate-950/40'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="attachDeliveredItem"
                      checked={hasDeliveredItem}
                      onChange={(e) => setHasDeliveredItem(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 cursor-pointer"
                    />
                    <label htmlFor="attachDeliveredItem" className="text-xs font-bold cursor-pointer">
                      या कार्डवर जुनी वस्तू दिली आहे का? (Item Delivered / Old Khata Bill)
                    </label>
                  </div>
                  {hasDeliveredItem && <span className="text-[11px] text-indigo-400 font-bold">खाते तपशील सक्रिय</span>}
                </div>

                {hasDeliveredItem && (
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-indigo-500/20">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">वस्तूचे नाव (Item Name)</label>
                      <input
                        type="text"
                        placeholder="उदा. स्टील कपाट / मिक्सर"
                        value={deliveredItemName}
                        onChange={(e) => setDeliveredItemName(e.target.value)}
                        className={`w-full px-3 py-1.5 rounded-lg text-xs font-bold border ${
                          isDayMode ? 'bg-white border-slate-300' : 'bg-slate-950 border-slate-800 text-white'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">जुने बिल क्र. (Old Bill No)</label>
                      <input
                        type="text"
                        placeholder="उदा. BILL-552"
                        value={deliveredItemBillNo}
                        onChange={(e) => setDeliveredItemBillNo(e.target.value)}
                        className={`w-full px-3 py-1.5 rounded-lg text-xs font-bold border ${
                          isDayMode ? 'bg-white border-slate-300' : 'bg-slate-950 border-slate-800 text-white'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">एकूण किंमत ₹ (Total)</label>
                      <input
                        type="number"
                        placeholder="उदा. 12000"
                        value={deliveredItemTotalAmt}
                        onChange={(e) => setDeliveredItemTotalAmt(e.target.value)}
                        className={`w-full px-3 py-1.5 rounded-lg text-xs font-bold border ${
                          isDayMode ? 'bg-white border-slate-300' : 'bg-slate-950 border-slate-800 text-white'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">बाकी रक्कम ₹ (Due)</label>
                      <input
                        type="number"
                        placeholder="उदा. 4000"
                        value={deliveredItemBalanceDue}
                        onChange={(e) => setDeliveredItemBalanceDue(e.target.value)}
                        className={`w-full px-3 py-1.5 rounded-lg text-xs font-bold border ${
                          isDayMode ? 'bg-white border-slate-300' : 'bg-slate-950 border-slate-800 text-white'
                        }`}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  सेव्ह केल्यानंतर पुढचा कार्ड नंबर आपोआप भरला जाईल.
                </span>
                <button
                  type="submit"
                  disabled={isCardDuplicate}
                  className={`px-8 py-3.5 rounded-2xl text-sm font-black transition flex items-center gap-2 cursor-pointer shadow-xl ${
                    isCardDuplicate
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/25'
                  }`}
                >
                  <Plus className="w-5 h-5" />
                  <span>जुने कार्ड सेव्ह करा (Save Card)</span>
                </button>
              </div>
            </form>
          </div>

          {/* Recent Cards Preview List */}
          <div className={`lg:col-span-4 p-6 rounded-3xl border shadow-xl flex flex-col justify-between ${
            isDayMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-700/50 mb-4">
                <h3 className="text-sm font-black flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>नुकतीच नोंदवलेली कार्ड्स</span>
                </h3>
                <span className="text-xs text-slate-400 font-mono">एकूण: {storeData.cardMembers.length}</span>
              </div>

              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {recentOldCards.map((m) => (
                  <div
                    key={m.id}
                    className={`p-3 rounded-2xl border text-xs flex items-center justify-between ${
                      isDayMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800/80'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded text-[11px]">
                          #{m.cardNo}
                        </span>
                        <span className="font-bold truncate max-w-[140px]">{m.memberName}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>योजना {m.schemeNo || 1}</span>
                        <span>•</span>
                        <span>{m.village || m.address}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-emerald-400 font-mono">
                        ₹{(m.totalAmountPaid || 0).toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-slate-500">{m.totalPaidMonths || 0} महिने</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 mt-4">
              <button
                type="button"
                onClick={() => onNavigate && onNavigate('scheme')}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>सर्व ३० महिने कार्ड्स पहा (Open Scheme Manager)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: OLD BILL / INVOICE ENTRY                           */}
      {/* ========================================================= */}
      {activeTab === 'old_bill' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className={`lg:col-span-8 p-6 rounded-3xl border shadow-xl ${
            isDayMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-700/50 mb-6">
              <div>
                <h2 className="text-lg font-black flex items-center gap-2">
                  <FileText className="w-5 h-5 text-sky-400" />
                  <span>जुने विक्री बिल फॉर्म (Old Sales Bill / Invoice)</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  ग्राहकाचे जुने बिल आणि विक्री तपशील सिस्टीममध्ये नोंदवा.
                </p>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/30">
                विक्री बिल नोंद
              </span>
            </div>

            <form onSubmit={handleSaveOldBill} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">
                    जुने बिल/इनव्हॉईस क्र. (Bill No) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="उदा. BILL-1001 किंवा 124"
                    value={billNo}
                    onChange={(e) => setBillNo(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl font-mono text-base font-black border focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                      isDayMode ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">
                    बिलाची तारीख (Bill Date)
                  </label>
                  <input
                    type="date"
                    value={billDate}
                    onChange={(e) => setBillDate(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-bold border focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                      isDayMode ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">
                    एजंट / बिल फाडणारा (Created By)
                  </label>
                  <input
                    type="text"
                    placeholder="उदा. SHUBHAM किंवा BHUSHAN"
                    value={billAgent}
                    onChange={(e) => setBillAgent(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-bold border focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                      isDayMode ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">
                    ग्राहकाचे नाव (Customer Name) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="उदा. VIJAY GADE"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-bold uppercase border focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                      isDayMode ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">
                    मोबाईल नंबर (Phone)
                  </label>
                  <input
                    type="tel"
                    placeholder="उदा. 9822100001"
                    value={customerPhone}
                    onChange={(e) => handleCustomerPhoneChange(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-mono font-bold border focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                      isDayMode ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">
                    गाव / शहर (Village)
                  </label>
                  <input
                    type="text"
                    list="villageOptions"
                    placeholder="उदा. WAIFAD"
                    value={customerVillage}
                    onChange={(e) => setCustomerVillage(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-bold border focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                      isDayMode ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">
                  वस्तूचे नाव / वर्णन (Item Description)
                </label>
                <input
                  type="text"
                  placeholder="उदा. Godrej Double Door Refrigerator 260L किंवा सागवान पलंग"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-bold border focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                    isDayMode ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-sky-500/5 border border-sky-500/20">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">
                    एकूण बिलाची रक्कम ₹ *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="उदा. 28500"
                    value={billTotalAmt}
                    onChange={(e) => handleBillTotalAmtChange(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl text-sm font-mono font-black border focus:outline-none focus:ring-1 focus:ring-sky-500 ${
                      isDayMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">
                    भरलेली रक्कम ₹ (Paid)
                  </label>
                  <input
                    type="number"
                    placeholder="उदा. 10000"
                    value={billPaidAmt}
                    onChange={(e) => handleBillPaidAmtChange(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl text-sm font-mono font-black border focus:outline-none focus:ring-1 focus:ring-sky-500 ${
                      isDayMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-emerald-400'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">
                    बाकी उधारी ₹ (Balance Due)
                  </label>
                  <input
                    type="number"
                    value={billBalanceDue}
                    onChange={(e) => setBillBalanceDue(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl text-sm font-mono font-black border focus:outline-none focus:ring-1 focus:ring-sky-500 ${
                      isDayMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-amber-400'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">
                    पेमेंट मोड (Mode)
                  </label>
                  <select
                    value={billPaymentMode}
                    onChange={(e) => setBillPaymentMode(e.target.value as any)}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-bold border focus:outline-none focus:ring-1 focus:ring-sky-500 ${
                      isDayMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                    }`}
                  >
                    <option value="Cash">Cash (रोख)</option>
                    <option value="UPI">UPI / PhonePe</option>
                    <option value="Cheque">Cheque (धनादेश)</option>
                    <option value="Card">Debit / Credit Card</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  सेव्ह केल्यानंतर ग्राहकाच्या खात्यात व विक्री यादीत नोंद होईल.
                </span>
                <button
                  type="submit"
                  className="px-8 py-3.5 rounded-2xl text-sm font-black transition flex items-center gap-2 cursor-pointer shadow-xl bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-sky-500/25"
                >
                  <Plus className="w-5 h-5" />
                  <span>जुने बिल सेव्ह करा (Save Bill)</span>
                </button>
              </div>
            </form>
          </div>

          {/* Recent Bills Preview */}
          <div className={`lg:col-span-4 p-6 rounded-3xl border shadow-xl flex flex-col justify-between ${
            isDayMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-700/50 mb-4">
                <h3 className="text-sm font-black flex items-center gap-2">
                  <Clock className="w-4 h-4 text-sky-400" />
                  <span>नुकतीच नोंदवलेली बिले</span>
                </h3>
                <span className="text-xs text-slate-400 font-mono">एकूण: {storeData.transactions.length}</span>
              </div>

              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {recentOldBills.map((tx) => (
                  <div
                    key={tx.id}
                    className={`p-3 rounded-2xl border text-xs flex items-center justify-between ${
                      isDayMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800/80'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sky-400 bg-sky-400/10 px-1.5 py-0.5 rounded text-[11px]">
                          {tx.invoiceNo}
                        </span>
                        <span className="font-bold truncate max-w-[130px]">{tx.customerName}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>{tx.date}</span>
                        <span>•</span>
                        <span>{tx.customerAddress || 'Wardha'}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-white font-mono">
                        ₹{(tx.grandTotal || 0).toLocaleString('en-IN')}
                      </div>
                      <div className={`text-[10px] font-bold ${
                        tx.balanceDue > 0 ? 'text-rose-400' : 'text-emerald-400'
                      }`}>
                        {tx.balanceDue > 0 ? `बाकी ₹${tx.balanceDue.toLocaleString('en-IN')}` : 'Paid'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 mt-4">
              <button
                type="button"
                onClick={() => onNavigate && onNavigate('all-transactions')}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>सर्व बिले पहा (Sales Bills History)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: DEDICATED SEPARATE RECEIPT ENTRY (#१०७९+)          */}
      {/* ========================================================= */}
      {activeTab === 'old_receipt' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className={`lg:col-span-8 p-6 rounded-3xl border shadow-xl ${
            isDayMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-700/50 mb-6">
              <div>
                <h2 className="text-lg font-black flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-teal-400" />
                  <span>स्वतंत्र जमा पावती नोंद फॉर्म (Receipt Entry #1079+)</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  ग्राहकांच्या उधारी खात्यातील थेट रोख/UPI जमा पावत्यांची जलद नोंद करा. सेव्ह केल्यावर पावती नंबर आपोआप वाढेल.
                </p>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/30 font-mono">
                फास्ट पावती एंट्री
              </span>
            </div>

            <form onSubmit={handleSaveDedicatedReceipt} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">
                    पावती नंबर (Receipt No) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="उदा. 1079"
                    value={rcpNumber}
                    onChange={(e) => setRcpNumber(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl font-mono text-base font-black border focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      isDayMode ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-teal-400'
                    }`}
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">पुढील पावती आपोआप येईल</span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">
                    पावती तारीख (Date) *
                  </label>
                  <input
                    type="date"
                    required
                    value={rcpDate}
                    onChange={(e) => setRcpDate(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-bold border focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      isDayMode ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">
                    जमा रक्कम ₹ (Amount Paid) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="उदा. 5000"
                    value={rcpAmount}
                    onChange={(e) => setRcpAmount(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-base font-mono font-black border focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      isDayMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-emerald-400'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">
                    खातेदाराचे / ग्राहकाचे नाव *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="उदा. VIJAY GADE"
                    value={rcpCustomerName}
                    onChange={(e) => setRcpCustomerName(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-bold uppercase border focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      isDayMode ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">
                    मोबाईल नंबर (Phone)
                  </label>
                  <input
                    type="tel"
                    placeholder="उदा. 9822100001"
                    value={rcpPhone}
                    onChange={(e) => handleRcpPhoneChange(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-mono font-bold border focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      isDayMode ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">
                    गाव / शहर (Village)
                  </label>
                  <input
                    type="text"
                    list="villageOptions"
                    placeholder="उदा. WAIFAD"
                    value={rcpVillage}
                    onChange={(e) => setRcpVillage(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-bold border focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      isDayMode ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">
                    पेमेंट मोड (Mode)
                  </label>
                  <select
                    value={rcpPaymentMode}
                    onChange={(e) => setRcpPaymentMode(e.target.value as any)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      isDayMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                    }`}
                  >
                    <option value="Cash">Cash (रोख)</option>
                    <option value="UPI">UPI / PhonePe / GPay</option>
                    <option value="Cheque">Cheque (धनादेश)</option>
                    <option value="Card">Debit / Credit Card</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">
                    पावती कोणाकडे जमा केली (Collected By)
                  </label>
                  <input
                    type="text"
                    placeholder="उदा. SHUBHAM किंवा BHUSHAN"
                    value={rcpCollectedBy}
                    onChange={(e) => setRcpCollectedBy(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-bold border focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      isDayMode ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">
                    संबंधित बिल क्र. (Bill No Ref - पर्यायी)
                  </label>
                  <input
                    type="text"
                    placeholder="उदा. BILL-1001"
                    value={rcpBillRef}
                    onChange={(e) => setRcpBillRef(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-mono font-bold border focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      isDayMode ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">
                  शेरा / रिमार्क (Remarks / Note)
                </label>
                <input
                  type="text"
                  placeholder="उदा. जुनी उधारी पावती / हप्ता जमा / काउंटर जमा"
                  value={rcpRemarks}
                  onChange={(e) => setRcpRemarks(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-bold border focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                    isDayMode ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                  }`}
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  सेव्ह केल्यानंतर ही पावती बिल पावती वहीत (#१०७९+) थेट जमा होईल.
                </span>
                <button
                  type="submit"
                  className="px-8 py-3.5 rounded-2xl text-sm font-black transition flex items-center gap-2 cursor-pointer shadow-xl bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-teal-500/25"
                >
                  <Plus className="w-5 h-5" />
                  <span>जमा पावती सेव्ह करा (Save Receipt #{rcpNumber})</span>
                </button>
              </div>
            </form>
          </div>

          {/* Recent Receipts Preview */}
          <div className={`lg:col-span-4 p-6 rounded-3xl border shadow-xl flex flex-col justify-between ${
            isDayMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-700/50 mb-4">
                <h3 className="text-sm font-black flex items-center gap-2">
                  <Clock className="w-4 h-4 text-teal-400" />
                  <span>नुकतीच नोंदवलेल्या पावत्या</span>
                </h3>
                <span className="text-xs text-slate-400 font-mono">एकूण: {storeData.billReceipts.length}</span>
              </div>

              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {recentOldReceipts.map((r) => (
                  <div
                    key={r.id}
                    className={`p-3 rounded-2xl border text-xs flex items-center justify-between ${
                      isDayMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800/80'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-teal-400 bg-teal-400/10 px-1.5 py-0.5 rounded text-[11px]">
                          #{r.receiptNo}
                        </span>
                        <span className="font-bold truncate max-w-[130px]">{r.customerName}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>{r.date}</span>
                        <span>•</span>
                        <span>{r.handledBy || 'Cashier'}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-emerald-400 font-mono">
                        ₹{(r.amountPaid || 0).toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-slate-400 font-bold">{r.paymentMode}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 mt-4">
              <button
                type="button"
                onClick={() => onNavigate && onNavigate('receipts')}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>सर्व जमा पावत्या वही उघडा (#1079+)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
