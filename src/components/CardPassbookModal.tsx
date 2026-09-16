import React, { useState, useEffect } from 'react';
import { 
  Share2, 
  Printer, 
  MapPin, 
  FileText, 
  X, 
  ShoppingBag, 
  Receipt, 
  Wallet, 
  Calendar, 
  ArrowDownLeft, 
  ArrowUpRight,
  TrendingUp,
  Check,
  Edit2
} from 'lucide-react';
import { CardMember, CardTransaction, BusinessSettings, TransactionEntry } from '../types';

interface CardPassbookModalProps {
  member: CardMember;
  transactions: CardTransaction[];
  settings: BusinessSettings;
  salesBills?: TransactionEntry[];
  onUpdateMember?: (member: CardMember) => void;
  onClose: () => void;
}

export const CardPassbookModal: React.FC<CardPassbookModalProps> = ({
  member,
  transactions,
  settings,
  salesBills = [],
  onUpdateMember,
  onClose,
}) => {
  const [activeViewTab, setActiveViewTab] = useState<'all' | 'weekly' | 'purchases'>('all');
  const [copiedNotice, setCopiedNotice] = useState<string | null>(null);

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
  const memberTransactions = transactions
    .filter(
      (t) =>
        (t.cardNumber === currentMember.cardNumber && t.schemeId === currentMember.schemeId) ||
        (t.cardNumber === currentMember.cardNumber && !t.schemeId)
    )
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Filter purchases (saman kharida bill) matching this card number or customer name
  const memberBills = (salesBills || [])
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

  // Calculations
  const totalSchemeDeposited = currentMember.totalDeposited ?? memberTransactions
    .filter((t) => t.type === 'WeeklyPayment' || t.type === 'Fee')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalSchemeRefunded = currentMember.totalRefunded ?? memberTransactions
    .filter((t) => t.type === 'Refund')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const netSavingsBalance = currentMember.netBalance ?? (totalSchemeDeposited - totalSchemeRefunded);

  // Total Goods Purchased
  const totalGoodsPurchased = memberBills.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const totalBillPaidDirectly = memberBills.reduce((sum, b) => sum + (b.payingNow || 0), 0);
  const totalBillDueRemaining = memberBills.reduce((sum, b) => sum + (b.dueAmount || 0), 0);

  // Net Ledger Balance Calculation
  const netOutstandingBalance = Math.max(0, totalBillDueRemaining - netSavingsBalance);
  const excessCreditInAccount = Math.max(0, netSavingsBalance - totalBillDueRemaining);

  const triggerNotice = (msg: string) => {
    setCopiedNotice(msg);
    setTimeout(() => setCopiedNotice(null), 3500);
  };

  // WhatsApp Share Handlers
  const handleShareWeeklyPassbook = () => {
    const lines = memberTransactions.map(
      (t, idx) => `• ${t.date} | ${t.type === 'WeeklyPayment' ? `Wk ${t.weekNumber || idx+1}` : t.type}: ₹${t.amount}`
    ).slice(-10).join('\n');

    const text = encodeURIComponent(
      `*${settings.businessName || 'SHRI SAI ENTERPRISES'}*\n` +
      `*साप्ताहिक बचत योजना पासबुक (Weekly Savings Passbook)*\n` +
      `--------------------------------\n` +
      `👤 Member: *${currentMember.customerName}*\n` +
      `💳 Card No: *#${currentMember.cardNumber}* (${currentMember.schemeName || 'Scheme'})\n` +
      (currentMember.village ? `📍 Village: ${currentMember.village}\n` : '') +
      (currentMember.sheetNo ? `📄 Sheet No: #${currentMember.sheetNo}\n` : '') +
      `--------------------------------\n` +
      `💰 Total Savings Deposited: *₹${totalSchemeDeposited.toLocaleString()}*\n` +
      (totalSchemeRefunded > 0 ? `🔻 Total Refunded/Used: ₹${totalSchemeRefunded.toLocaleString()}\n` : '') +
      `✨ *Current Savings Balance: ₹${netSavingsBalance.toLocaleString()}*\n` +
      `--------------------------------\n` +
      `📅 Recent Weekly Deposits:\n` +
      (lines || 'Initial Card Entry recorded') + `\n` +
      `--------------------------------\n` +
      `📞 Contact: ${settings.phone || '8766486915'}\n` +
      `📍 Shop: Arvi Road, Wardha`
    );

    const phone = currentMember.phone ? currentMember.phone.replace(/[^0-9]/g, '') : '';
    const url = phone ? `https://wa.me/91${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
    triggerNotice('Weekly Savings Passbook sent to WhatsApp!');
  };

  const handleShareBillsReceipts = () => {
    const billLines = memberBills.map(
      (b) => `• Bill #${b.invoiceNo} (${b.date}): Total ₹${b.totalAmount} | Paid ₹${b.payingNow} | Due ₹${b.dueAmount}`
    ).join('\n');

    const text = encodeURIComponent(
      `*${settings.businessName || 'SHRI SAI ENTERPRISES'}*\n` +
      `*सामान खरेदी व बिल खाते (Goods Purchase & Bills Ledger)*\n` +
      `--------------------------------\n` +
      `👤 Customer: *${currentMember.customerName}*\n` +
      `💳 Card No: *#${currentMember.cardNumber}*\n` +
      (currentMember.village ? `📍 Village: ${currentMember.village}\n` : '') +
      `--------------------------------\n` +
      `📦 Total Purchase: *₹${totalGoodsPurchased.toLocaleString()}*\n` +
      `💵 Direct Payments: *₹${totalBillPaidDirectly.toLocaleString()}*\n` +
      `⚖️ Bill Balance Due: *₹${totalBillDueRemaining.toLocaleString()}*\n` +
      `--------------------------------\n` +
      `📋 Invoices Details:\n` +
      (billLines || 'No separate sales bills recorded.') + `\n` +
      `--------------------------------\n` +
      `📞 Contact: ${settings.phone || '8766486915'}\n` +
      `📍 ${settings.address || 'Wardha, Maharashtra'}`
    );

    const phone = currentMember.phone ? currentMember.phone.replace(/[^0-9]/g, '') : '';
    const url = phone ? `https://wa.me/91${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
    triggerNotice('Bills & Invoices Ledger sent to WhatsApp!');
  };

  const handleShareCompleteStatement = () => {
    const text = encodeURIComponent(
      `*${settings.businessName || 'SHRI SAI ENTERPRISES'}*\n` +
      `*ग्राहक संपूर्ण पासबुक व लेजर (360° Complete Statement)*\n` +
      `--------------------------------\n` +
      `👤 Name: *${currentMember.customerName}*\n` +
      `💳 Card No: *#${currentMember.cardNumber}* (${currentMember.schemeName || 'Scheme'})\n` +
      (currentMember.phone ? `📞 Phone: ${currentMember.phone}\n` : '') +
      (currentMember.village ? `📍 Village: ${currentMember.village}\n` : '') +
      (currentMember.sheetNo ? `📄 Sheet No: #${currentMember.sheetNo}\n` : '') +
      `--------------------------------\n` +
      `📊 *1. साप्ताहिक बचत योजना (Weekly Scheme):*\n` +
      `   • Total Scheme Savings: ₹${totalSchemeDeposited.toLocaleString()}\n` +
      `   • Scheme Refunded/Used: ₹${totalSchemeRefunded.toLocaleString()}\n` +
      `   • *Available Savings: ₹${netSavingsBalance.toLocaleString()}*\n\n` +
      `📦 *2. सामान खरेदी व उधारी (Goods Purchase & Bills):*\n` +
      `   • Total Saman Purchase: ₹${totalGoodsPurchased.toLocaleString()}\n` +
      `   • Direct Cash/Receipts Paid: ₹${totalBillPaidDirectly.toLocaleString()}\n` +
      `   • Bill Balance Due: ₹${totalBillDueRemaining.toLocaleString()}\n\n` +
      `--------------------------------\n` +
      (netOutstandingBalance > 0
        ? `⚠️ *अंतिम बाकी रक्कम (Net Payable Due): ₹${netOutstandingBalance.toLocaleString()}*\n   (Total Due ₹${totalBillDueRemaining} - Savings Adjusted ₹${netSavingsBalance})`
        : `✅ *अकाउंट स्टेटस: खात्यात शिल्लक जमा आहे (Excess Credit: ₹${excessCreditInAccount.toLocaleString()})*`
      ) + `\n` +
      `--------------------------------\n` +
      `Date: ${new Date().toISOString().split('T')[0]}\n` +
      `Shop: ${settings.address || 'Shri Sai Enterprises, Arvi Road, Wardha'}\n` +
      `Phone: ${settings.phone || '8766486915'}`
    );

    const phone = currentMember.phone ? currentMember.phone.replace(/[^0-9]/g, '') : '';
    const url = phone ? `https://wa.me/91${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
    triggerNotice('Complete Statement sent to WhatsApp!');
  };

  // Transactions to print
  const printTransactions = printMode === 'compact1Page' ? memberTransactions.slice(-14) : memberTransactions;
  const printBills = printMode === 'compact1Page' ? memberBills.slice(-4) : memberBills;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:static print:p-0 print:bg-white print:overflow-visible print:block">
      {/* ========================================================================= */}
      {/* 1. DEDICATED COMPACT 1-PAGE PASSBOOK PRINT TEMPLATE (PRINT ONLY) */}
      {/* ========================================================================= */}
      <div className="hidden print:block font-sans text-black w-full bg-white p-1">
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            @page {
              size: A4 portrait;
              margin: 6mm 6mm 6mm 6mm;
            }
            body {
              background: white !important;
              color: black !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .print-table tr {
              page-break-inside: avoid !important;
            }
          }
        `}} />

        {/* Print Header */}
        <div className="border-b-2 border-slate-900 pb-1.5 mb-1.5 text-center">
          <div className="flex items-center justify-between">
            <div className="text-left">
              <span className="text-[9px] font-bold tracking-wider uppercase text-slate-600 block">
                अधिकृत साप्ताहिक बचत योजना व लेजर
              </span>
              <h1 className="text-lg font-black tracking-tight text-slate-950 uppercase leading-none">
                {settings.businessName || 'SHRI SAI ENTERPRISES'}
              </h1>
              <p className="text-[9px] text-slate-700 mt-0.5">
                {settings.address || 'आर्वी रोड, वर्धा (महाराष्ट्र)'} • मो.: {settings.phone || '8766486915'}
              </p>
            </div>
            <div className="text-right border-2 border-slate-900 px-2.5 py-0.5 rounded-lg bg-slate-50">
              <span className="text-[8px] uppercase font-bold text-slate-600 block">कार्ड क्रमांक (Card No)</span>
              <span className="text-base font-black text-slate-950 font-mono block">#{currentMember.cardNumber}</span>
              <span className="text-[8px] font-bold text-slate-700 block">{currentMember.schemeName}</span>
            </div>
          </div>
        </div>

        {/* Member Details Box (Ultra Compact Grid) */}
        <div className="border border-slate-400 rounded-md p-1.5 mb-1.5 bg-slate-50 text-[9px] grid grid-cols-3 gap-1">
          <div>
            <span className="text-slate-500 font-medium">ग्राहकाचे नाव:</span>{' '}
            <strong className="text-slate-950 text-[10px]">{currentMember.customerName}</strong>
          </div>
          <div>
            <span className="text-slate-500 font-medium">मोबाईल:</span>{' '}
            <strong className="font-mono text-slate-900">{currentMember.phone || 'उपलब्ध नाही'}</strong>
          </div>
          <div>
            <span className="text-slate-500 font-medium">गाव / पत्ता:</span>{' '}
            <strong className="text-slate-900">{currentMember.village || 'वर्धा'}</strong>
          </div>
          <div>
            <span className="text-slate-500 font-medium">शीट क्रमांक:</span>{' '}
            <strong className="font-mono text-slate-900">#{currentMember.sheetNo || currentMember.cardNumber}</strong>
          </div>
          <div>
            <span className="text-slate-500 font-medium">नोंदणी दिनांक:</span>{' '}
            <strong className="font-mono text-slate-900">{currentMember.joiningDate || '-'}</strong>
          </div>
          <div>
            <span className="text-slate-500 font-medium">प्रिंट दिनांक:</span>{' '}
            <strong className="font-mono text-slate-900">{new Date().toISOString().split('T')[0]}</strong>
          </div>
        </div>

        {/* 4-Box Single-Row Financial Summary (Compact Bar) */}
        <div className="grid grid-cols-4 gap-1 mb-1.5 text-center text-[9px]">
          <div className="border border-slate-300 rounded p-1 bg-slate-50">
            <span className="text-slate-600 block text-[8px]">१. एकूण बचत जमा</span>
            <span className="font-black text-slate-950 text-xs block font-mono">₹{totalSchemeDeposited.toLocaleString()}</span>
            <span className="text-[7.5px] text-slate-500">({memberTransactions.length} हप्ते)</span>
          </div>
          <div className="border border-slate-300 rounded p-1 bg-slate-50">
            <span className="text-slate-600 block text-[8px]">२. एकूण सामान खरेदी</span>
            <span className="font-black text-slate-950 text-xs block font-mono">₹{totalGoodsPurchased.toLocaleString()}</span>
            <span className="text-[7.5px] text-slate-500">({memberBills.length} बिले)</span>
          </div>
          <div className="border border-slate-300 rounded p-1 bg-slate-50">
            <span className="text-slate-600 block text-[8px]">३. बिल उधारी बाकी</span>
            <span className="font-black text-slate-950 text-xs block font-mono">₹{totalBillDueRemaining.toLocaleString()}</span>
            <span className="text-[7.5px] text-slate-500">बिलावर जमा: ₹{totalBillPaidDirectly.toLocaleString()}</span>
          </div>
          <div className={`border-2 rounded p-1 ${netOutstandingBalance > 0 ? 'border-slate-900 bg-slate-100' : 'border-slate-400 bg-white'}`}>
            <span className="text-slate-700 font-bold block text-[8px]">४. अंतिम देय बाकी (Net Due)</span>
            <span className="font-black text-slate-950 text-xs block font-mono">
              {netOutstandingBalance > 0 ? `₹${netOutstandingBalance.toLocaleString()}` : `₹0 (जमा शिल्लक ₹${excessCreditInAccount})`}
            </span>
            <span className="text-[7.5px] text-slate-600 font-bold">{netOutstandingBalance > 0 ? 'ग्राहकाने देणे बाकी' : 'खाते सुरळीत'}</span>
          </div>
        </div>

        {/* Compact Table (1-Page Fit) */}
        <table className="w-full text-left border-collapse border border-slate-400 text-[8.5px] print-table mb-1.5">
          <thead>
            <tr className="bg-slate-200 text-slate-900 font-bold border-b border-slate-400">
              <th className="p-0.5 border border-slate-300 text-center w-6">क्र.</th>
              <th className="p-0.5 border border-slate-300 w-16">दिनांक</th>
              <th className="p-0.5 border border-slate-300 w-20">प्रकार व पावती/बिल</th>
              <th className="p-0.5 border border-slate-300">तपशील (Particulars)</th>
              <th className="p-0.5 border border-slate-300 text-right w-14">नावे / खर्च (₹)</th>
              <th className="p-0.5 border border-slate-300 text-right w-14">जमा / हप्ता (₹)</th>
              <th className="p-0.5 border border-slate-300 text-right w-18">शिल्लक बचत (₹)</th>
            </tr>
          </thead>
          <tbody>
            {/* Scheme Transactions */}
            {printTransactions.map((tx, idx) => (
              <tr key={tx.id} className="border-b border-slate-200">
                <td className="p-0.5 border border-slate-200 text-center font-mono text-[8px]">{idx + 1}</td>
                <td className="p-0.5 border border-slate-200 font-mono text-[8px] whitespace-nowrap">{tx.date}</td>
                <td className="p-0.5 border border-slate-200 font-semibold text-[8px]">
                  {tx.type === 'WeeklyPayment' ? `Week ${tx.weekNumber || ''}` : tx.type === 'Refund' ? 'वापसी/रिफंड' : 'फी'}
                  <span className="text-slate-500 font-mono block text-[7.5px]">{tx.receiptNo}</span>
                </td>
                <td className="p-0.5 border border-slate-200 text-[8px]">
                  {tx.remarks || (tx.type === 'WeeklyPayment' ? 'साप्ताहिक बचत हप्ता' : tx.type === 'Fee' ? 'नोंदणी फी' : 'रिफंड')}
                  {tx.agentName && <span className="text-slate-500 text-[7.5px]"> (एजंट: {tx.agentName})</span>}
                </td>
                <td className="p-0.5 border border-slate-200 text-right font-mono text-[8px]">
                  {tx.type === 'Refund' ? tx.amount?.toLocaleString() : '-'}
                </td>
                <td className="p-0.5 border border-slate-200 text-right font-mono font-bold text-[8px]">
                  {tx.type !== 'Refund' ? tx.amount?.toLocaleString() : '-'}
                </td>
                <td className="p-0.5 border border-slate-200 text-right font-mono font-bold text-[8px]">
                  {(tx.balanceAfter ?? tx.amount ?? 0).toLocaleString()}
                </td>
              </tr>
            ))}

            {/* Purchases / Goods Bills */}
            {printBills.map((b, bIdx) => (
              <tr key={b.id} className="border-b border-slate-200 bg-slate-50">
                <td className="p-0.5 border border-slate-200 text-center font-mono text-[8px]">{printTransactions.length + bIdx + 1}</td>
                <td className="p-0.5 border border-slate-200 font-mono text-[8px] whitespace-nowrap">{b.date}</td>
                <td className="p-0.5 border border-slate-200 font-semibold text-[8px]">
                  सामान खरेदी
                  <span className="text-slate-600 font-mono font-bold block text-[7.5px]">#{b.invoiceNo}</span>
                </td>
                <td className="p-0.5 border border-slate-200 text-[8px]">
                  {b.itemDetails || b.stockItemName || 'इलेक्ट्रॉनिक्स व वस्तू खरेदी'}
                  <span className="text-slate-500 text-[7.5px] block">
                    एकूण: ₹{b.totalAmount.toLocaleString()} | जमा: ₹{b.payingNow.toLocaleString()} | उधारी: ₹{b.dueAmount.toLocaleString()}
                  </span>
                </td>
                <td className="p-0.5 border border-slate-200 text-right font-mono font-bold text-[8px]">
                  {b.totalAmount.toLocaleString()}
                </td>
                <td className="p-0.5 border border-slate-200 text-right font-mono text-[8px]">
                  {b.payingNow > 0 ? b.payingNow.toLocaleString() : '-'}
                </td>
                <td className="p-0.5 border border-slate-200 text-right font-mono text-[8px] text-slate-700">
                  बाकी: {b.dueAmount.toLocaleString()}
                </td>
              </tr>
            ))}

            {memberTransactions.length === 0 && memberBills.length === 0 && (
              <tr>
                <td colSpan={7} className="p-3 text-center text-slate-500 text-[9px]">
                  कोणतीही हप्ता किंवा बिलांची नोंद नाही.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {printMode === 'compact1Page' && (memberTransactions.length > 14 || memberBills.length > 4) && (
          <p className="text-[7.5px] text-slate-500 italic mb-1 text-center">
            * टीप: 1-पान प्रिंटसाठी शेवटचे हप्ते व बिले संक्षिप्त रूपात दाखवले आहेत. संपूर्ण स्टेटमेंट पाहण्यासाठी 'सर्व पाने' पर्याय निवडावा.
          </p>
        )}

        {/* Compact Print Footer with Signatures */}
        <div className="pt-1.5 border-t border-slate-400 flex items-end justify-between text-[8.5px] text-slate-700">
          <div className="space-y-0.5">
            <p className="font-semibold">• हे संगणकीय पासबुक लेजर स्टेटमेंट असून माहितीसाठी अधिकृत आहे.</p>
            <p className="text-slate-500">काही त्रुटी आढळल्यास त्वरित दुकानात संपर्क साधावा.</p>
            <div className="pt-4 font-bold text-slate-800">ग्राहक स्वाक्षरी (Customer Signature)</div>
          </div>
          <div className="text-right space-y-0.5">
            <p className="font-bold text-slate-900 uppercase">{settings.businessName || 'SHRI SAI ENTERPRISES'}</p>
            <p className="text-slate-500">आर्वी रोड, वर्धा</p>
            <div className="pt-4 font-bold text-slate-950">अधिकृत स्वाक्षरी व शिक्का (Authorized Sign & Stamp)</div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. REGULAR INTERACTIVE MODAL (HIDDEN ON PRINT) */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full p-4 sm:p-6 space-y-4 shadow-2xl my-auto max-h-[94vh] flex flex-col border border-slate-200 dark:border-slate-800 print:hidden overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-lg bg-blue-700 dark:bg-blue-600 text-white font-mono font-bold text-sm shadow-xs">
                Card #{currentMember.cardNumber}
              </span>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-xl tracking-tight">
                {currentMember.customerName}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                {currentMember.schemeName}
              </span>
              <button
                type="button"
                onClick={() => setIsEditingCustomer(!isEditingCustomer)}
                className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-lg cursor-pointer transition"
                title="ग्राहकाची माहिती (नाव, फोन, गाव) दुरुस्त करा"
              >
                <Edit2 className="w-3 h-3" />
                <span>{isEditingCustomer ? 'संपादन बंद करा' : 'माहिती दुरुस्त करा'}</span>
              </button>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium flex flex-wrap items-center gap-2">
              {currentMember.phone ? (
                <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">📞 {currentMember.phone}</span>
              ) : (
                <span className="text-rose-600 font-semibold text-[11px] bg-rose-50 px-1.5 py-0.5 rounded">मोबाईल नाही</span>
              )}
              {currentMember.village ? (
                <span className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded font-semibold text-[11px] border border-emerald-200 dark:border-emerald-800 inline-flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {currentMember.village}
                </span>
              ) : (
                <span className="text-amber-700 font-semibold text-[11px] bg-amber-50 px-1.5 py-0.5 rounded">गाव नोंद नाही</span>
              )}
              {currentMember.sheetNo && (
                <span className="bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded font-semibold text-[11px] border border-purple-200 dark:border-purple-800 font-mono inline-flex items-center gap-1">
                  <FileText className="w-3 h-3" /> Sheet #{currentMember.sheetNo}
                </span>
              )}
              <span className="text-slate-400 dark:text-slate-500 text-[11px]">
                Joined: {currentMember.joiningDate} • Reg Fee: ₹50 (Paid)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Print Mode Selector */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px]">
              <button
                type="button"
                onClick={() => setPrintMode('compact1Page')}
                className={`px-2 py-1 rounded font-bold transition cursor-pointer ${
                  printMode === 'compact1Page'
                    ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="प्रिंट फक्त १ पानात बसवा (Compact 1 Page Fit)"
              >
                १ पान प्रिंट
              </button>
              <button
                type="button"
                onClick={() => setPrintMode('all')}
                className={`px-2 py-1 rounded font-bold transition cursor-pointer ${
                  printMode === 'all'
                    ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="सर्व पाने प्रिंट करा (Full Ledger)"
              >
                सर्व पाने
              </button>
            </div>

            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
              title={`प्रिंट करा (${printMode === 'compact1Page' ? '1 पान' : 'सर्व पाने'})`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>प्रिंट ({printMode === 'compact1Page' ? '1-Page' : 'All'})</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Edit Customer Form in Passbook */}
        {isEditingCustomer && (
          <form
            onSubmit={handleSaveCustomerInfo}
            className="p-3.5 bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1">
                <Edit2 className="w-3.5 h-3.5" /> ग्राहकाची माहिती दुरुस्त करा (अपडेट करा)
              </span>
              <button
                type="button"
                onClick={() => setIsEditingCustomer(false)}
                className="text-[11px] text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                रद्द करा
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">
                  ग्राहकाचे नाव *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-amber-300 dark:border-amber-700 rounded-lg text-xs bg-white dark:bg-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">
                  मोबाईल नंबर
                </label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="१० अंकी मोबाईल नंबर"
                  className="w-full px-2.5 py-1.5 border border-amber-300 dark:border-amber-700 rounded-lg text-xs font-mono bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">
                  गाव / पत्ता (Village)
                </label>
                <input
                  type="text"
                  value={editVillage}
                  onChange={(e) => setEditVillage(e.target.value)}
                  placeholder="उदा. Kelzar, Wardha"
                  className="w-full px-2.5 py-1.5 border border-amber-300 dark:border-amber-700 rounded-lg text-xs bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">
                  शीट क्रमांक
                </label>
                <input
                  type="text"
                  value={editSheetNo}
                  onChange={(e) => setEditSheetNo(e.target.value)}
                  placeholder="उदा. 5104"
                  className="w-full px-2.5 py-1.5 border border-amber-300 dark:border-amber-700 rounded-lg text-xs bg-white dark:bg-slate-800"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="submit"
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>माहिती सेव्ह करा</span>
              </button>
            </div>
          </form>
        )}

        {/* Notice Alert */}
        {copiedNotice && (
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{copiedNotice}</span>
          </div>
        )}

        {/* 3-Way WhatsApp Sharing Action Bar */}
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-blue-950/30 border border-emerald-200 dark:border-emerald-800/60 p-3 rounded-xl shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
              <Share2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Send To Customer WhatsApp (ग्राहक निवडून पाठवा):</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleShareWeeklyPassbook}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95"
                title="Send only weekly deposit dates & amounts"
              >
                <Calendar className="w-3.5 h-3.5" />
                1. Weekly Passbook
              </button>

              <button
                onClick={handleShareBillsReceipts}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95"
                title="Send purchased items, bills and balance due"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                2. Goods & Bills
              </button>

              <button
                onClick={handleShareCompleteStatement}
                className="px-3.5 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-800 hover:bg-black dark:hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95 border border-slate-700"
                title="Complete bank style statement with both Savings + Saman Kharidi"
              >
                <Wallet className="w-3.5 h-3.5 text-amber-400" />
                3. Full 360° Statement
              </button>
            </div>
          </div>
        </div>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-850 rounded-xl">
            <span className="text-emerald-700 dark:text-emerald-400 font-medium block text-[11px] flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> साप्ताहिक बचत जमा (Savings)
            </span>
            <span className="text-lg font-black text-emerald-800 dark:text-emerald-300 mt-0.5 block">
              ₹{totalSchemeDeposited.toLocaleString()}
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
              {memberTransactions.length} Weekly entries
            </span>
          </div>

          <div className="p-3 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-850 rounded-xl">
            <span className="text-blue-700 dark:text-blue-400 font-medium block text-[11px] flex items-center gap-1">
              <ShoppingBag className="w-3 h-3" /> एकूण सामान खरेदी (Purchased)
            </span>
            <span className="text-lg font-black text-blue-800 dark:text-blue-300 mt-0.5 block">
              ₹{totalGoodsPurchased.toLocaleString()}
            </span>
            <span className="text-[10px] text-blue-600 dark:text-blue-400">
              {memberBills.length} Bill Invoices
            </span>
          </div>

          <div className="p-3 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-850 rounded-xl">
            <span className="text-amber-700 dark:text-amber-400 font-medium block text-[11px] flex items-center gap-1">
              <Receipt className="w-3 h-3" /> बिल बाकी / उधारी (Bill Due)
            </span>
            <span className="text-lg font-black text-amber-800 dark:text-amber-300 mt-0.5 block">
              ₹{totalBillDueRemaining.toLocaleString()}
            </span>
            <span className="text-[10px] text-amber-600 dark:text-amber-400">
              Paid on Bill: ₹{totalBillPaidDirectly.toLocaleString()}
            </span>
          </div>

          <div className={`p-3 rounded-xl border ${
            netOutstandingBalance > 0 
              ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200' 
              : 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
          }`}>
            <span className="font-semibold block text-[11px] flex items-center gap-1">
              <Wallet className="w-3 h-3" /> अंतिम शुद्ध बाकी (Net Due)
            </span>
            <span className={`text-lg font-black mt-0.5 block ${netOutstandingBalance > 0 ? 'text-rose-700 dark:text-rose-300' : 'text-emerald-700 dark:text-emerald-300'}`}>
              {netOutstandingBalance > 0 ? `₹${netOutstandingBalance.toLocaleString()}` : `₹0 (जमा: ₹${excessCreditInAccount.toLocaleString()})`}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
              {netOutstandingBalance > 0 ? 'Customer owes shop' : 'Account is clear / credit'}
            </span>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <button
            onClick={() => setActiveViewTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeViewTab === 'all'
                ? 'bg-slate-900 dark:bg-slate-750 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All Ledger Records ({memberTransactions.length + memberBills.length})
          </button>
          <button
            onClick={() => setActiveViewTab('weekly')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeViewTab === 'weekly'
                ? 'bg-emerald-700 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Weekly Savings Deposits ({memberTransactions.length})
          </button>
          <button
            onClick={() => setActiveViewTab('purchases')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeViewTab === 'purchases'
                ? 'bg-blue-700 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Goods Purchases & Bills ({memberBills.length})
          </button>
        </div>

        {/* Transaction Records List */}
        <div className="overflow-y-auto max-h-[42vh] divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
          {/* 1. All Unified Records (Sorted chronologically) */}
          {activeViewTab === 'all' && (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {memberTransactions.map((tx) => (
                <div key={tx.id} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${tx.type === 'Refund' ? 'bg-rose-100 dark:bg-rose-950 text-rose-600' : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600'}`}>
                      {tx.type === 'Refund' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {tx.type === 'WeeklyPayment' ? `साप्ताहिक बचत हप्ता (Week ${tx.weekNumber || 1})` : tx.type === 'Refund' ? 'रिफंड वापसी' : 'नोंदणी फी'}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                          {tx.receiptNo}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {tx.date} • {tx.paymentMode} {tx.agentName ? `• Agent: ${tx.agentName}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`font-bold font-mono text-sm block ${tx.type === 'Refund' ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {tx.type === 'Refund' ? `-₹${tx.amount.toLocaleString()}` : `+₹${tx.amount.toLocaleString()}`}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Bal: ₹{(tx.balanceAfter ?? tx.amount).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}

              {memberBills.map((bill) => (
                <div key={bill.id} className="p-3 bg-blue-50/30 dark:bg-blue-950/20 hover:bg-blue-50/60 transition flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">
                          सामान खरेदी बिल #{bill.invoiceNo}
                        </span>
                        <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/60 px-1.5 py-0.5 rounded">
                          Goods Bill
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                        {bill.date} • {bill.itemDetails || bill.stockItemName || 'वस्तू खरेदी'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold font-mono text-sm block text-slate-900 dark:text-white">
                      ₹{bill.totalAmount.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-amber-700 dark:text-amber-400 font-mono">
                      Due: ₹{bill.dueAmount.toLocaleString()} (Paid ₹{bill.payingNow.toLocaleString()})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 2. Weekly Scheme only */}
          {activeViewTab === 'weekly' && (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {memberTransactions.map((tx) => (
                <div key={tx.id} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {tx.type === 'WeeklyPayment' ? `Week ${tx.weekNumber || ''} हप्ता जमा` : tx.type}
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {tx.date} • {tx.paymentMode} • Agent: {tx.agentName || 'Shop'} • {tx.receiptNo}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold font-mono text-sm block text-emerald-600">
                      +₹{tx.amount.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Bal: ₹{(tx.balanceAfter ?? tx.amount).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 3. Purchases & Bills only */}
          {activeViewTab === 'purchases' && (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {memberBills.map((bill) => (
                <div key={bill.id} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">
                        बिल #{bill.invoiceNo} • {bill.itemDetails || bill.stockItemName || 'वस्तू'}
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        तारीख: {bill.date} • पेमेंट मोड: {bill.paymentMode}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold font-mono text-sm block text-slate-900 dark:text-white">
                      ₹{bill.totalAmount.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-amber-700 dark:text-amber-400 font-mono block">
                      उधारी बाकी: ₹{bill.dueAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Action Bottom Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
          <span className="text-slate-500 dark:text-slate-400">
            श्री साई इंटरप्राइजेस • कार्ड पासबुक व ग्राहक लेजर व्यवस्थापन
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              बंद करा (Close)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
