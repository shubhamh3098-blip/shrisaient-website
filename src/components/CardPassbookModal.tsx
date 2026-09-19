import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Share2, 
  Printer, 
  MapPin, 
  Phone,
  User,
  X, 
  ShoppingBag, 
  Receipt, 
  Wallet, 
  Calendar, 
  ArrowDownLeft, 
  ArrowUpRight,
  TrendingUp,
  Check,
  Edit2,
  Plus,
  Filter
} from 'lucide-react';
import { CardMember, CardTransaction, BusinessSettings, TransactionEntry } from '../types';

interface CardPassbookModalProps {
  member: CardMember;
  transactions: CardTransaction[];
  settings: BusinessSettings;
  salesBills?: TransactionEntry[];
  onUpdateMember?: (member: CardMember) => void;
  onRecordTransaction?: (tx: Omit<CardTransaction, 'id' | 'createdAt' | 'balanceAfter'>) => void;
  onClose: () => void;
}

export interface UnifiedPassbookRow {
  id: string;
  date: string;
  refNo: string;
  particulars: string;
  mode: string;
  type: 'credit' | 'debit';
  typeLabel: string;
  creditAmount: number; // KAB DIYE ₹
  debitAmount: number; // KAB LIYE ₹ (Goods or Refund)
  runningBalance: number;
  agentName: string;
  rawType: string;
}

export const CardPassbookModal: React.FC<CardPassbookModalProps> = ({
  member,
  transactions,
  settings,
  salesBills = [],
  onUpdateMember,
  onRecordTransaction,
  onClose,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'credit' | 'debit'>('all');
  const [copiedNotice, setCopiedNotice] = useState<string | null>(null);

  // Quick action states for adding deposit or refund
  const [showAddTxModal, setShowAddTxModal] = useState(false);
  const [txType, setTxType] = useState<'WeeklyPayment' | 'Refund'>('WeeklyPayment');
  const [txAmount, setTxAmount] = useState<number>(250);
  const [txWeekNumber, setTxWeekNumber] = useState<number>(1);
  const [txMode, setTxMode] = useState<'Cash' | 'Online'>('Cash');
  const [txAgent, setTxAgent] = useState<string>(member.agentName || 'Kishor Bawankar');
  const [txRemarks, setTxRemarks] = useState<string>('');

  // Editable customer info state
  const [currentMember, setCurrentMember] = useState<CardMember>(member);
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);
  const [editName, setEditName] = useState(member.customerName || '');
  const [editPhone, setEditPhone] = useState(member.phone || '');
  const [editVillage, setEditVillage] = useState(member.village || '');
  const [editSheetNo, setEditSheetNo] = useState(member.sheetNo || '');

  // Print mode (compact 1-page fit vs all pages)
  const [printMode, setPrintMode] = useState<'compact1Page' | 'all'>('compact1Page');

  useEffect(() => {
    setCurrentMember(member);
    setEditName(member.customerName || '');
    setEditPhone(member.phone || '');
    setEditVillage(member.village || '');
    setEditSheetNo(member.sheetNo || '');
  }, [member]);

  const handleSaveCustomerInfo = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: CardMember = {
      ...currentMember,
      customerName: editName.trim() || currentMember.customerName,
      phone: editPhone.trim(),
      village: editVillage.trim(),
      sheetNo: editSheetNo.trim(),
    };
    setCurrentMember(updated);
    if (onUpdateMember) {
      onUpdateMember(updated);
    }
    setIsEditingCustomer(false);
    triggerNotice('ग्राहकाची माहिती यशस्वीपणे अपडेट केली!');
  };

  // Filter weekly savings transactions for this card member
  const memberTransactions = useMemo(() => {
    return transactions
      .filter(
        (t) =>
          (t.cardNumber === currentMember.cardNumber && t.schemeId === currentMember.schemeId) ||
          (t.cardNumber === currentMember.cardNumber && !t.schemeId)
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [transactions, currentMember.cardNumber, currentMember.schemeId]);

  // Filter purchases (saman kharida bill) matching this card number or customer name
  const memberBills = useMemo(() => {
    return (salesBills || [])
      .filter((b) => {
        const matchCard = b.cardNumber && Number(b.cardNumber) === Number(currentMember.cardNumber);
        const matchName = b.customerName && currentMember.customerName && 
          b.customerName.trim().toLowerCase() === currentMember.customerName.trim().toLowerCase();
        const matchPhone = b.customerPhone && currentMember.phone && 
          b.customerPhone.replace(/\D/g, '') === currentMember.phone.replace(/\D/g, '') &&
          currentMember.phone.length > 5;
        return matchCard || matchName || matchPhone;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [salesBills, currentMember.cardNumber, currentMember.customerName, currentMember.phone]);

  // Automatically compute next week number
  useEffect(() => {
    const weeklyCount = memberTransactions.filter((t) => t.type === 'WeeklyPayment').length;
    setTxWeekNumber(weeklyCount + 1);
  }, [memberTransactions]);

  // UNIFIED BANK PASSBOOK TIMELINE WITH EXACT RUNNING BALANCE ARITHMETIC
  const passbookRows: UnifiedPassbookRow[] = useMemo(() => {
    const rawEvents: Array<{
      date: string;
      order: number;
      refNo: string;
      particulars: string;
      mode: string;
      type: 'credit' | 'debit';
      typeLabel: string;
      creditAmount: number;
      debitAmount: number;
      agentName: string;
      rawType: string;
    }> = [];

    // 1. Initial Opening / Registration Event if registered
    if (currentMember.joiningDate) {
      const regFee = currentMember.registrationFee || 50;
      rawEvents.push({
        date: currentMember.joiningDate,
        order: 0,
        refNo: currentMember.sheetNo ? `S${currentMember.sheetNo}` : `REG-${currentMember.cardNumber}`,
        particulars: `Passbook Account Opened (${currentMember.schemeName || 'Scheme'} Registration)`,
        mode: 'Cash',
        type: 'credit',
        typeLabel: 'जमा (CREDIT)',
        creditAmount: regFee,
        debitAmount: 0,
        agentName: currentMember.agentName || 'Kishor Bawankar',
        rawType: 'Registration',
      });
    }

    // 2. Weekly Savings Deposits & Refunds
    memberTransactions.forEach((tx, idx) => {
      const isRefund = tx.type === 'Refund';
      const isWeekly = tx.type === 'WeeklyPayment';
      
      let refNo = tx.receiptNo || (isWeekly ? `SSE/RCPT/2026/REC-W0${tx.weekNumber || idx + 1}` : `SSE/REF/00${idx + 1}`);
      let particulars = '';
      if (isWeekly) {
        particulars = `Week #${tx.weekNumber || idx + 1} Installment Deposit`;
      } else if (isRefund) {
        particulars = tx.remarks || 'परत रक्कम (Refund Returned to Member)';
      } else {
        particulars = tx.remarks || 'नोंदणी फी जमा';
      }

      rawEvents.push({
        date: tx.date || new Date().toISOString().split('T')[0],
        order: 1,
        refNo,
        particulars: `${particulars} Mode: ${tx.paymentMode || 'Cash'}`,
        mode: tx.paymentMode || 'Cash',
        type: isRefund ? 'debit' : 'credit',
        typeLabel: isRefund ? 'उचल / नावे (DEBIT)' : 'जमा (CREDIT)',
        creditAmount: isRefund ? 0 : (tx.amount || 0),
        debitAmount: isRefund ? (tx.amount || 0) : 0,
        agentName: tx.agentName || currentMember.agentName || 'Kishor Bawankar',
        rawType: tx.type,
      });
    });

    // 3. Goods Purchases & Bills
    memberBills.forEach((bill, bIdx) => {
      // Goods taken: Debit
      rawEvents.push({
        date: bill.date || new Date().toISOString().split('T')[0],
        order: 2,
        refNo: bill.invoiceNo || `SSE/INV/202609/${bIdx + 1}`,
        particulars: `वस्तू उचल / खरेदी (${bill.itemDetails || bill.stockItemName || 'Electronics & Goods'})`,
        mode: bill.paymentMode || 'Bill Credit',
        type: 'debit',
        typeLabel: 'उचल / नावे (DEBIT)',
        creditAmount: 0,
        debitAmount: bill.totalAmount || 0,
        agentName: bill.salesConsultant || currentMember.agentName || 'Kishor Bawankar',
        rawType: 'BillPurchase',
      });

      // Immediate payment made on bill: Credit
      if ((bill.payingNow || 0) > 0) {
        rawEvents.push({
          date: bill.date || new Date().toISOString().split('T')[0],
          order: 3,
          refNo: `SSE/RCPT/${bill.invoiceNo || bIdx + 1}`,
          particulars: `POS Payment for Bill ${bill.invoiceNo || ''} Mode: ${bill.paymentMode || 'Cash'}`,
          mode: bill.paymentMode || 'Cash',
          type: 'credit',
          typeLabel: 'जमा (CREDIT)',
          creditAmount: bill.payingNow || 0,
          debitAmount: 0,
          agentName: bill.salesConsultant || currentMember.agentName || 'Kishor Bawankar',
          rawType: 'BillPayment',
        });
      }
    });

    // Sort chronologically (oldest to newest)
    rawEvents.sort((a, b) => {
      const dateA = a.date || '';
      const dateB = b.date || '';
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      return a.order - b.order;
    });

    // Calculate running balance step-by-step
    let balance = 0;
    return rawEvents.map((ev, index) => {
      if (ev.type === 'credit') {
        balance += ev.creditAmount;
      } else {
        balance -= ev.debitAmount;
      }
      return {
        id: `row-${index}-${ev.refNo}`,
        date: ev.date,
        refNo: ev.refNo,
        particulars: ev.particulars,
        mode: ev.mode,
        type: ev.type,
        typeLabel: ev.typeLabel,
        creditAmount: ev.creditAmount,
        debitAmount: ev.debitAmount,
        runningBalance: balance,
        agentName: ev.agentName,
        rawType: ev.rawType,
      };
    });
  }, [currentMember, memberTransactions, memberBills]);

  // Overall Financial Calculations
  const totalCredits = useMemo(() => {
    return passbookRows.reduce((sum, r) => sum + r.creditAmount, 0);
  }, [passbookRows]);

  const totalDebits = useMemo(() => {
    return passbookRows.reduce((sum, r) => sum + r.debitAmount, 0);
  }, [passbookRows]);

  const netBalance = useMemo(() => {
    return totalCredits - totalDebits;
  }, [totalCredits, totalDebits]);

  // Scheme Progress: 52 weeks or 30 months scheme
  const totalTargetWeeks = 52;
  const paidWeeksCount = useMemo(() => {
    return memberTransactions.filter((t) => t.type === 'WeeklyPayment').length;
  }, [memberTransactions]);
  const progressPercent = Math.min(100, Math.round((paidWeeksCount / totalTargetWeeks) * 100));

  // Overdue Due Calculation
  const overdueDue = useMemo(() => {
    // If netBalance is negative (e.g. goods taken exceed savings), overdue due reflects the remaining net amount
    if (netBalance < 0) {
      return Math.abs(netBalance);
    }
    // Expected weekly target calculation
    const expectedWeeks = Math.min(totalTargetWeeks, 52);
    const weeklyRate = 250;
    const expectedSavings = paidWeeksCount * weeklyRate;
    const actualSavings = memberTransactions
      .filter((t) => t.type === 'WeeklyPayment')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    return Math.max(0, expectedSavings - actualSavings);
  }, [netBalance, paidWeeksCount, memberTransactions]);

  const filteredRows = useMemo(() => {
    if (activeFilter === 'credit') {
      return passbookRows.filter((r) => r.creditAmount > 0);
    }
    if (activeFilter === 'debit') {
      return passbookRows.filter((r) => r.debitAmount > 0);
    }
    return passbookRows;
  }, [passbookRows, activeFilter]);

  useEffect(() => {
    document.body.classList.add('has-passbook-modal');
    return () => {
      document.body.classList.remove('has-passbook-modal');
      document.body.classList.remove('printing-passbook');
    };
  }, []);

  const handlePrint = () => {
    document.body.classList.add('printing-passbook');
    const cleanUp = () => {
      document.body.classList.remove('printing-passbook');
      window.removeEventListener('afterprint', cleanUp);
    };
    window.addEventListener('afterprint', cleanUp);
    setTimeout(() => {
      window.print();
      setTimeout(cleanUp, 1500);
    }, 60);
  };

  const triggerNotice = (msg: string) => {
    setCopiedNotice(msg);
    setTimeout(() => setCopiedNotice(null), 3500);
  };

  const handleSaveNewTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onRecordTransaction) {
      triggerNotice('Transaction recording is not available.');
      return;
    }
    const amt = Math.max(1, Number(txAmount) || 250);
    onRecordTransaction({
      cardId: currentMember.id,
      cardNumber: currentMember.cardNumber,
      schemeId: currentMember.schemeId,
      customerName: currentMember.customerName,
      customerPhone: currentMember.phone,
      receiptNo: `SSE/REC/${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().split('T')[0],
      type: txType,
      weekNumber: txType === 'WeeklyPayment' ? txWeekNumber : undefined,
      amount: amt,
      paymentMode: txMode,
      agentName: txAgent,
      remarks: txRemarks || (txType === 'WeeklyPayment' ? `Week #${txWeekNumber} हप्ता जमा` : 'रिफंड वापसी'),
    });
    setShowAddTxModal(false);
    triggerNotice(txType === 'WeeklyPayment' ? `हप्ता ₹${amt} यशस्वीपणे जमा केला!` : `परतावा ₹${amt} नोंदवला!`);
  };

  const handleShareWhatsApp = () => {
    const lines = passbookRows.slice(-8).map((r) => {
      const amtStr = r.type === 'credit' ? `+₹${r.creditAmount}` : `-₹${r.debitAmount}`;
      const balStr = r.runningBalance < 0
        ? `₹${Math.abs(r.runningBalance).toLocaleString()} बाकी`
        : `₹${r.runningBalance.toLocaleString()} जमा`;
      return `• ${r.date} | ${r.particulars} | ${amtStr} | Bal: ${balStr}`;
    }).join('\n');

    const balSummary = netBalance < 0
      ? `⚖️ *ग्राहकाकडे येणे बाकी (उधारी): ₹${Math.abs(netBalance).toLocaleString()} (बाकी)*`
      : `⚖️ *शिल्लक जमा (ठेव): ₹${netBalance.toLocaleString()} (जमा)*`;

    const text = encodeURIComponent(
      `*${settings.businessName || 'SHRI SAI ENTERPRISES'}*\n` +
      `*बँक पासबुक व योजना लेजर (Bank Passbook Statement)*\n` +
      `--------------------------------\n` +
      `👤 Member: *${currentMember.customerName}*\n` +
      `💳 Account No: *#${currentMember.cardNumber}* (${currentMember.schemeName || 'Scheme3'})\n` +
      `📍 गाव: *${currentMember.village || 'Wardha'}*\n` +
      `👤 एजंट: *${currentMember.agentName || 'Kishor Bawankar'}*\n` +
      `--------------------------------\n` +
      `💰 एकूण जमा (Kab Diye): *₹${totalCredits.toLocaleString()}*\n` +
      `📦 एकूण उचल / वस्तू (Kab Liye): *₹${totalDebits.toLocaleString()}*\n` +
      `${balSummary}\n` +
      `⚠️ प्रलंबित हप्ता / बाकी: *₹${overdueDue.toLocaleString()}*\n` +
      `📊 प्रगती: *${paidWeeksCount} of ${totalTargetWeeks} Weeks Paid (${progressPercent}%)*\n` +
      `--------------------------------\n` +
      `📋 शेवटचे व्यवहार (Recent Activity):\n` +
      `${lines}\n` +
      `--------------------------------\n` +
      `📞 संपर्क: ${settings.phone || '8766486915'} • आर्वी रोड, वर्धा`
    );

    const phone = currentMember.phone ? currentMember.phone.replace(/[^0-9]/g, '') : '';
    const url = phone ? `https://wa.me/91${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  const modalContent = (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:static print:p-0 print:bg-white print:overflow-visible print:block">
      
      {/* ========================================================================= */}
      {/* 1. OFFICIAL HIGH-READABILITY PRINT TEMPLATE (NO APP LEAKAGE, CLEAN TABLE) */}
      {/* ========================================================================= */}
      <div id="printable-passbook" className="hidden print:block font-sans text-black w-full bg-white leading-normal">
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            @page {
              size: A4 portrait;
              margin: 8mm;
            }
            body {
              background: white !important;
              color: black !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            #printable-passbook {
              display: block !important;
            }
          }
        `}} />

        {/* Header with Shop Details and Card Info */}
        <div className="border-b-2 border-slate-900 pb-2 mb-3">
          <div className="flex justify-between items-start">
            <div className="space-y-0.5">
              <h1 className="text-xl font-black tracking-tight text-slate-950 uppercase">
                {settings.businessName || 'SHRI SAI ENTERPRISES'}
              </h1>
              <p className="text-xs font-semibold text-slate-800">
                इलेक्ट्रॉनिक्स, फर्निचर & होम अप्लायन्सेस दालन
              </p>
              <p className="text-[11px] text-slate-600">
                {settings.address || 'मातोश्री सभागृहासमोर, आर्वी रोड, पंजाब कॉलनी, वर्धा - ४४२००१'} • मो.: {settings.phone || '8766486915, 8600122978'}
              </p>
              {settings.gstin && (
                <p className="text-[10px] font-mono text-slate-600">GSTIN: {settings.gstin}</p>
              )}
            </div>

            <div className="border-2 border-slate-900 p-2 rounded text-right min-w-[170px] bg-slate-50">
              <span className="text-[10px] block font-bold text-slate-600 uppercase tracking-wider">
                खाते / कार्ड क्र. (CARD NO.)
              </span>
              <span className="text-xl font-black font-mono block text-slate-950">
                #{currentMember.cardNumber}
              </span>
              <div className="text-[11px] font-bold text-slate-800 mt-0.5">
                {currentMember.schemeName || 'योजना'} {currentMember.sheetNo ? `• शीट: #${currentMember.sheetNo}` : ''}
              </div>
            </div>
          </div>

          <div className="mt-2 pt-1.5 border-t border-slate-300 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-900 uppercase tracking-wide bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
              अधिकृत सभासद पासबुक व खातेवही (Member Passbook & Ledger Statement)
            </span>
            <span className="text-slate-600 text-[11px] font-mono">
              दिनांक: {new Date().toLocaleDateString('mr-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Member Details Box */}
        <div className="border border-slate-400 rounded-md p-2.5 mb-3 bg-slate-50 text-xs">
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
            <div>
              <span className="text-slate-500 font-medium">सभासदाचे नाव:</span>{' '}
              <strong className="text-slate-900 text-sm">{currentMember.customerName}</strong>
            </div>
            <div>
              <span className="text-slate-500 font-medium">मोबाईल क्र.:</span>{' '}
              <strong className="text-slate-900 font-mono">{currentMember.phone || 'उपलब्ध नाही'}</strong>
            </div>
            <div>
              <span className="text-slate-500 font-medium">गाव / पत्ता:</span>{' '}
              <strong className="text-slate-900">{currentMember.village || currentMember.address || 'वर्धा'}</strong>
            </div>
            <div>
              <span className="text-slate-500 font-medium">प्रतिनिधी / एजंट:</span>{' '}
              <strong className="text-slate-900">{currentMember.agentName || 'Kishor Bawankar'}</strong>
            </div>
          </div>
        </div>

        {/* Financial Highlights Box (खूप सोप्या भाषेत) */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          <div className="border border-slate-400 p-2 rounded-md bg-white">
            <span className="text-[10px] font-bold text-slate-600 block uppercase">१. एकूण उचल / खरेदी</span>
            <span className="text-base font-black font-mono block text-slate-950 mt-0.5">
              ₹{totalDebits.toLocaleString()}
            </span>
            <span className="text-[9px] text-slate-500 block">Total Goods / Debits</span>
          </div>

          <div className="border border-slate-400 p-2 rounded-md bg-white">
            <span className="text-[10px] font-bold text-slate-600 block uppercase">२. एकूण भरणा / जमा</span>
            <span className="text-base font-black font-mono block text-slate-950 mt-0.5">
              ₹{totalCredits.toLocaleString()}
            </span>
            <span className="text-[9px] text-slate-500 block">Total Paid / Credits</span>
          </div>

          <div className="border-2 border-slate-900 p-2 rounded-md bg-slate-100">
            <span className="text-[10px] font-black text-slate-900 block uppercase">
              ३. {netBalance < 0 ? 'ग्राहकाकडे येणे बाकी (उधारी)' : 'शिल्लक जमा (ठेव)'}
            </span>
            <span className="text-base font-black font-mono block text-slate-950 mt-0.5">
              ₹{Math.abs(netBalance).toLocaleString()} {netBalance < 0 ? 'बाकी' : 'जमा'}
            </span>
            <span className="text-[9px] font-bold text-slate-700 block">
              {netBalance < 0 ? 'Net Balance Due (To Pay)' : 'Net Advance Balance (Credit)'}
            </span>
          </div>

          <div className="border border-slate-400 p-2 rounded-md bg-white">
            <span className="text-[10px] font-bold text-slate-600 block uppercase">४. योजना प्रगती</span>
            <span className="text-base font-black font-mono block text-slate-950 mt-0.5">
              {paidWeeksCount} / {totalTargetWeeks} हप्ते
            </span>
            <span className="text-[9px] text-slate-500 block">
              भरणा प्रमाण: {progressPercent}%
            </span>
          </div>
        </div>

        {/* Passbook Ledger Table */}
        <table className="w-full text-left border-collapse border border-slate-600 text-xs mb-3">
          <thead>
            <tr className="bg-slate-200 text-slate-950 font-bold border-b border-slate-600">
              <th className="p-1.5 border border-slate-500 text-center w-[4%]">#</th>
              <th className="p-1.5 border border-slate-500 whitespace-nowrap w-[11%]">तारीख</th>
              <th className="p-1.5 border border-slate-500 whitespace-nowrap w-[14%]">पावती/बिल क्र.</th>
              <th className="p-1.5 border border-slate-500 w-[30%]">तपशील (वस्तू खरेदी / हप्ता जमा)</th>
              <th className="p-1.5 border border-slate-500 text-right whitespace-nowrap w-[12%]">जमा रक्कम (₹)</th>
              <th className="p-1.5 border border-slate-500 text-right whitespace-nowrap w-[13%]">उचल/नावे (₹)</th>
              <th className="p-1.5 border border-slate-500 text-right whitespace-nowrap w-[16%]">शिल्लक बाकी (₹)</th>
            </tr>
          </thead>
          <tbody>
            {passbookRows.map((r, idx) => (
              <tr key={r.id} className="border-b border-slate-300">
                <td className="p-1.5 border border-slate-300 text-center font-mono text-[11px]">{idx + 1}</td>
                <td className="p-1.5 border border-slate-300 font-mono text-[11px] whitespace-nowrap">{r.date}</td>
                <td className="p-1.5 border border-slate-300 font-mono font-medium text-[11px] whitespace-nowrap">{r.refNo}</td>
                <td className="p-1.5 border border-slate-300 text-[11px] font-medium leading-tight">{r.particulars}</td>
                <td className="p-1.5 border border-slate-300 text-right font-mono font-bold text-[11px] whitespace-nowrap">
                  {r.creditAmount > 0 ? `+₹${r.creditAmount.toLocaleString()}` : '-'}
                </td>
                <td className="p-1.5 border border-slate-300 text-right font-mono font-bold text-[11px] whitespace-nowrap">
                  {r.debitAmount > 0 ? `₹${r.debitAmount.toLocaleString()}` : '-'}
                </td>
                <td className="p-1.5 border border-slate-300 text-right font-mono font-black text-[11px] whitespace-nowrap">
                  {r.runningBalance < 0
                    ? `₹${Math.abs(r.runningBalance).toLocaleString()} बाकी (Dr)`
                    : r.runningBalance > 0
                    ? `₹${r.runningBalance.toLocaleString()} जमा (Cr)`
                    : '₹0'}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-200 font-bold border-t-2 border-slate-700 text-xs">
              <td colSpan={4} className="p-1.5 border border-slate-500 text-right uppercase tracking-wider">
                एकूण बेरीज (Grand Total):
              </td>
              <td className="p-1.5 border border-slate-500 text-right font-mono font-black text-slate-950">
                +₹{totalCredits.toLocaleString()}
              </td>
              <td className="p-1.5 border border-slate-500 text-right font-mono font-black text-slate-950">
                ₹{totalDebits.toLocaleString()}
              </td>
              <td className="p-1.5 border border-slate-500 text-right font-mono font-black text-slate-950">
                ₹{Math.abs(netBalance).toLocaleString()} {netBalance < 0 ? 'बाकी' : 'जमा'}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Footer & Dual Signatures */}
        <div className="pt-2 border-t border-slate-400 mt-4">
          <div className="text-[10px] text-slate-600 mb-6 italic">
            टीप: १. कृपया प्रत्येक हप्ता किंवा वस्तू खरेदीची नोंद पासबुकमध्ये तपासून घ्यावी. २. ही संगणकीय अधिकृत प्रत आहे. काही तफावत असल्यास दुकानात संपर्क साधावा.
          </div>

          <div className="flex justify-between items-end px-4 text-xs font-bold pt-6">
            <div className="text-center min-w-[160px] border-t border-slate-700 pt-1">
              <span>सभासदाची स्वाक्षरी</span>
              <span className="block text-[10px] font-normal text-slate-500">(Member Signature)</span>
            </div>

            <div className="text-center min-w-[200px] border-t border-slate-700 pt-1">
              <span>श्री साई एंटरप्रायझेस करिता</span>
              <span className="block text-[10px] font-normal text-slate-500">(Authorized Signatory / Stamp)</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. AUTHENTIC SCREEN MODAL MATCHING USER SCREENSHOT */}
      {/* ========================================================================= */}
      <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl max-w-6xl w-full p-3 sm:p-5 space-y-4 shadow-2xl my-auto max-h-[95vh] flex flex-col border border-slate-300 dark:border-slate-800 print:hidden overflow-y-auto">
        
        {/* Top Controls Bar */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>ग्राहक बँक पासबुक व ३६०° लेजर</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            {onRecordTransaction && (
              <button
                type="button"
                onClick={() => setShowAddTxModal(true)}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>हप्ता / उचल नोंदवा</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs transition"
              title="WhatsApp वर पासबुक पाठवा"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>प्रिंट पासबुक</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {copiedNotice && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{copiedNotice}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* EXACT TOP NAVY MEMBER CARD FROM USER SCREENSHOT */}
        {/* ========================================================================= */}
        <div className="bg-[#0b1329] text-white rounded-2xl p-4 sm:p-6 border border-slate-700/60 shadow-xl relative overflow-hidden">
          
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
            
            {/* Left Section: Stylized Authentic QR Code Card + Member Details */}
            <div className="flex items-start sm:items-center gap-4 min-w-0">
              {/* White QR Card */}
              <div className="bg-white p-2 rounded-xl text-center shadow-md w-24 sm:w-28 shrink-0 flex flex-col items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-16 h-16 sm:w-20 sm:h-20">
                  <rect width="100" height="100" fill="white" />
                  <rect x="10" y="10" width="26" height="26" fill="black" />
                  <rect x="14" y="14" width="18" height="18" fill="white" />
                  <rect x="18" y="18" width="10" height="10" fill="black" />

                  <rect x="64" y="10" width="26" height="26" fill="black" />
                  <rect x="68" y="14" width="18" height="18" fill="white" />
                  <rect x="72" y="18" width="10" height="10" fill="black" />

                  <rect x="10" y="64" width="26" height="26" fill="black" />
                  <rect x="14" y="68" width="18" height="18" fill="white" />
                  <rect x="18" y="72" width="10" height="10" fill="black" />

                  <rect x="42" y="42" width="16" height="16" rx="3" fill="#eab308" />
                  <text x="50" y="53" fontSize="8" fontWeight="bold" textAnchor="middle" fill="#0f172a">SSE</text>

                  <rect x="42" y="12" width="6" height="6" fill="black" />
                  <rect x="52" y="20" width="6" height="6" fill="black" />
                  <rect x="14" y="44" width="6" height="6" fill="black" />
                  <rect x="26" y="48" width="6" height="6" fill="black" />
                  <rect x="44" y="68" width="6" height="6" fill="black" />
                  <rect x="68" y="52" width="6" height="6" fill="black" />
                  <rect x="76" y="76" width="6" height="6" fill="black" />
                  <rect x="84" y="64" width="6" height="6" fill="black" />
                  <rect x="64" y="84" width="6" height="6" fill="black" />
                </svg>
                <span className="text-[10px] font-mono font-black text-slate-900 mt-1">CARD #{currentMember.cardNumber}</span>
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">SCAN QR</span>
              </div>

              {/* Member Details */}
              <div className="min-w-0 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="px-2.5 py-0.5 rounded-md bg-blue-600 text-white font-mono font-bold text-xs tracking-wide">
                    ACCOUNT #{currentMember.cardNumber}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md bg-amber-500 text-slate-950 font-bold text-xs">
                    {currentMember.schemeName || 'Scheme3'}
                  </span>
                  <span className="text-slate-400 font-mono text-xs">
                    Book Ref: {currentMember.sheetNo ? `S3-${currentMember.sheetNo}` : `S3-00${currentMember.cardNumber}`}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate">
                    {currentMember.customerName}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setIsEditingCustomer(!isEditingCustomer)}
                    className="p-1 text-slate-400 hover:text-amber-400 cursor-pointer"
                    title="ग्राहकाचे नाव, फोन किंवा पत्ता दुरुस्त करा"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="truncate max-w-[240px]">
                      {currentMember.village || currentMember.address || 'Deoli (Near Ram Mandir, Deoli Rural, Wardha)'}
                    </span>
                  </div>

                  {currentMember.phone && (
                    <div className="flex items-center gap-1 font-mono">
                      <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>+91 {currentMember.phone}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Agent: {currentMember.agentName || 'Kishor Bawankar'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Section: 4 Dark Glassy Financial KPI Boxes */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full lg:w-auto shrink-0">
              
              {/* Box 1: एकूण जमा (KAB DIYE) */}
              <div className="bg-[#141e38]/90 border border-slate-700/80 rounded-xl p-3 min-w-[130px]">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  एकूण जमा (KAB DIYE)
                </span>
                <span className="text-xl font-black text-emerald-400 font-mono block mt-0.5">
                  ₹{totalCredits.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">
                  Total Credits
                </span>
              </div>

              {/* Box 2: एकूण उचल (KAB LIYE) */}
              <div className="bg-[#141e38]/90 border border-slate-700/80 rounded-xl p-3 min-w-[130px]">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  एकूण उचल (KAB LIYE)
                </span>
                <span className="text-xl font-black text-rose-400 font-mono block mt-0.5">
                  ₹{totalDebits.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">
                  Goods & Refunds
                </span>
              </div>

              {/* Box 3: शिल्लक बाकी (BALANCE) */}
              <div className="bg-[#141e38]/90 border border-slate-700/80 rounded-xl p-3 min-w-[130px]">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {netBalance < 0 ? 'येणे बाकी (उधारी)' : 'शिल्लक जमा (BALANCE)'}
                </span>
                <span className={`text-xl font-black font-mono block mt-0.5 ${netBalance >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  ₹{Math.abs(netBalance).toLocaleString()} {netBalance < 0 ? 'बाकी' : 'जमा'}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">
                  {netBalance < 0 ? 'Customer Balance Due' : 'Advance Credit Balance'}
                </span>
              </div>

              {/* Box 4: प्रलंबित हप्ता (DUE) */}
              <div className="bg-[#141e38]/90 border border-slate-700/80 rounded-xl p-3 min-w-[130px]">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  प्रलंबित हप्ता (DUE)
                </span>
                <span className="text-xl font-black text-amber-400 font-mono block mt-0.5">
                  ₹{overdueDue.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">
                  Overdue Due
                </span>
              </div>

            </div>

          </div>

          {/* Bottom Progress Bar Row */}
          <div className="mt-5 pt-3 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs font-bold mb-1.5">
              <span className="text-amber-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>५२-आठवडे योजना प्रगती (52-Week Scheme Progress): {paidWeeksCount} of {totalTargetWeeks} Weeks Paid</span>
              </span>
              <span className="text-emerald-400 font-mono font-bold">
                {progressPercent}% Complete
              </span>
            </div>

            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-400 via-teal-400 to-emerald-400 transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

        </div>

        {/* Quick Edit Customer Form in Passbook if toggled */}
        {isEditingCustomer && (
          <form
            onSubmit={handleSaveCustomerInfo}
            className="p-4 bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1">
                <Edit2 className="w-3.5 h-3.5" /> ग्राहकाची माहिती दुरुस्त करा (नाव, फोन, गाव, शीट क्र.)
              </span>
              <button
                type="button"
                onClick={() => setIsEditingCustomer(false)}
                className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                रद्द करा
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">नाव *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-white dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">मोबाईल</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-2.5 py-1.5 border rounded-lg text-xs font-mono bg-white dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">गाव / पत्ता</label>
                <input
                  type="text"
                  value={editVillage}
                  onChange={(e) => setEditVillage(e.target.value)}
                  className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-white dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">शीट क्र.</label>
                <input
                  type="text"
                  value={editSheetNo}
                  onChange={(e) => setEditSheetNo(e.target.value)}
                  className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-white dark:bg-slate-800"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                माहिती सेव्ह करा
              </button>
            </div>
          </form>
        )}

        {/* Quick Add Installment / Debit Modal */}
        {showAddTxModal && (
          <form
            onSubmit={handleSaveNewTx}
            className="p-4 bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl space-y-3 animate-fade-in"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                <Plus className="w-4 h-4" /> नवीन आठवडा हप्ता जमा किंवा परतावा नोंदवा
              </span>
              <button
                type="button"
                onClick={() => setShowAddTxModal(false)}
                className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                रद्द करा
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">प्रकार</label>
                <select
                  value={txType}
                  onChange={(e) => setTxType(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-white dark:bg-slate-800"
                >
                  <option value="WeeklyPayment">आठवडा हप्ता जमा (Weekly)</option>
                  <option value="Refund">परतावा / रिफंड (Refund)</option>
                </select>
              </div>

              {txType === 'WeeklyPayment' && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">आठवडा क्र. (Week #)</label>
                  <input
                    type="number"
                    min="1"
                    max="52"
                    value={txWeekNumber}
                    onChange={(e) => setTxWeekNumber(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 border rounded-lg text-xs font-mono bg-white dark:bg-slate-800"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">रक्कम (₹) *</label>
                <input
                  type="number"
                  min="10"
                  step="50"
                  required
                  value={txAmount}
                  onChange={(e) => setTxAmount(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 border rounded-lg text-xs font-bold font-mono bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">पेमेंट मोड</label>
                <select
                  value={txMode}
                  onChange={(e) => setTxMode(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-white dark:bg-slate-800"
                >
                  <option value="Cash">Cash (रोख)</option>
                  <option value="Online">Online (UPI / Bank)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">एजंट / प्रतिनिधी</label>
                <input
                  type="text"
                  value={txAgent}
                  onChange={(e) => setTxAgent(e.target.value)}
                  className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-white dark:bg-slate-800"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <input
                type="text"
                value={txRemarks}
                onChange={(e) => setTxRemarks(e.target.value)}
                placeholder="काही टीप / रिमार्क्स (ऐच्छिक)..."
                className="w-2/3 px-2.5 py-1.5 border rounded-lg text-xs bg-white dark:bg-slate-800"
              />
              <button
                type="submit"
                className="px-5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer shadow-xs"
              >
                पावती सेव्ह करा
              </button>
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* DETAILED ACCOUNT STATEMENT SECTION (EXACT AS SCREENSHOT) */}
        {/* ========================================================================= */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          
          {/* Statement Header & Filter Pills */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                तपशीलवार पासबुक लेजर (Detailed Account Statement){' '}
                <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                  Showing {filteredRows.length} Records
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Official timeline showing every deposit made ("Kab Diye") and every product or refund taken ("Kab Liye")
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-slate-200/80 dark:bg-slate-800 p-1 rounded-xl shrink-0 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  activeFilter === 'all'
                    ? 'bg-white dark:bg-slate-700 text-slate-950 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                सर्व नोंदी (All)
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('credit')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  activeFilter === 'credit'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                केवळ जमा (Kab Diye)
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('debit')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  activeFilter === 'debit'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                केवळ उचल / सामान (Kab Liye)
              </button>
            </div>
          </div>

          {/* Statement Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/90 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-3.5 whitespace-nowrap">तारीख (DATE)</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">पावती / बिल क्र. (REF NO)</th>
                  <th className="py-3 px-3.5 min-w-[220px]">तपशील (PARTICULARS & GOODS DETAIL)</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">प्रकार (TYPE)</th>
                  <th className="py-3 px-3.5 text-right whitespace-nowrap text-emerald-600 dark:text-emerald-400">
                    जमा रक्कम ₹ (KAB DIYE)
                  </th>
                  <th className="py-3 px-3.5 text-right whitespace-nowrap text-rose-600 dark:text-rose-400">
                    नावे / उचल ₹ (KAB LIYE)
                  </th>
                  <th className="py-3 px-3.5 text-right whitespace-nowrap text-slate-900 dark:text-white">
                    शिल्लक ₹ (RUNNING BALANCE)
                  </th>
                  <th className="py-3 px-3.5 whitespace-nowrap text-slate-600 dark:text-slate-400">
                    स्वाक्षरी / प्रतिनिधी (AGENT)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRows.map((row) => {
                  const isCredit = row.type === 'credit';
                  return (
                    <tr key={row.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-3.5 font-mono whitespace-nowrap text-slate-700 dark:text-slate-300">
                        {row.date}
                      </td>
                      <td className="py-3 px-3.5 font-mono font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {row.refNo}
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {row.particulars}
                        </div>
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        {isCredit ? (
                          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 inline-flex items-center gap-1">
                            <span>↙</span> जमा (CREDIT)
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 inline-flex items-center gap-1">
                            <span>↗</span> उचल / नावे (DEBIT)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        {row.creditAmount > 0 ? `+₹${row.creditAmount.toLocaleString()}` : '-'}
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono font-bold text-sm text-rose-600 dark:text-rose-400 whitespace-nowrap">
                        {row.debitAmount > 0 ? `₹${row.debitAmount.toLocaleString()}` : '-'}
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono font-black text-sm whitespace-nowrap">
                        {row.runningBalance < 0 ? (
                          <span className="text-amber-600 dark:text-amber-400 font-bold">
                            ₹{Math.abs(row.runningBalance).toLocaleString()} बाकी (Dr)
                          </span>
                        ) : row.runningBalance > 0 ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                            ₹{row.runningBalance.toLocaleString()} जमा (Cr)
                          </span>
                        ) : (
                          <span className="text-slate-400">₹0</span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-slate-600 dark:text-slate-400 whitespace-nowrap font-medium">
                        {row.agentName}
                      </td>
                    </tr>
                  );
                })}

                {filteredRows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      कोणतीही नोंद आढळली नाही.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Bottom Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 pt-2 border-t border-slate-200 dark:border-slate-800">
          <span>
            {settings.businessName} • अधिकृत ३०-महिने / ५२-आठवडे योजना पासबुक
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              बंद करा (Close)
            </button>
          </div>
        </div>

      </div>
    </div>
  );

  if (typeof document === 'undefined') {
    return modalContent;
  }
  return createPortal(modalContent, document.body);
};
