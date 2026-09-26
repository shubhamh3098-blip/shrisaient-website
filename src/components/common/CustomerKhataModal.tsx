import React, { useState, useMemo } from 'react';
import {
  X,
  FileText,
  Printer,
  Share2,
  Calendar,
  CreditCard,
  Plus,
  ArrowDownCircle,
  Receipt,
  Building,
  CheckCircle2,
  Phone,
  MapPin,
  Clock,
  Sparkles,
  Edit3
} from 'lucide-react';
import { BillReceipt, CardMember, CardTransaction, Customer, StoreData, Transaction } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { resolveCardScheme, getSchemeConfig, extractCardNumber } from '../../utils/schemeUtils';
import { EditTransactionModal } from '../transactions/EditTransactionModal';
import { EditReceiptModal } from '../customers/EditReceiptModal';
import { EditCustomerModal } from '../customers/EditCustomerModal';

interface CustomerKhataModalProps {
  customer: Customer;
  storeData: StoreData;
  onClose: () => void;
  onRefreshData: () => void;
  onCollectPayment: (customer: Customer) => void;
  onPrintReceipt?: (receipt: BillReceipt) => void;
  onPrintInvoice?: (transaction: Transaction) => void;
}

type TabType = 'statement' | 'bills' | 'receipts' | 'scheme';

interface LedgerStatementRow {
  id: string;
  date: string;
  displayDate: string;
  voucherNo: string;
  particulars: string;
  debit: number;
  credit: number;
  balance: number;
  type: 'BILL' | 'ADVANCE' | 'RECEIPT' | 'SCHEME';
  refTx?: Transaction;
  refReceipt?: BillReceipt;
}

export const CustomerKhataModal: React.FC<CustomerKhataModalProps> = ({
  customer,
  storeData,
  onClose,
  onRefreshData,
  onCollectPayment,
  onPrintReceipt,
  onPrintInvoice,
}) => {
  const { isDayMode } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('statement');
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [editingRc, setEditingRc] = useState<BillReceipt | null>(null);
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);

  // 1. Retrieve all sales bills / invoices for this customer
  const transactions = useMemo(() => {
    const custPhone = customer.phone ? customer.phone.replace(/[^0-9]/g, '') : '';
    const custName = customer.name.trim().toLowerCase();
    const isValidCustPhone = Boolean(
      custPhone &&
      custPhone.length >= 10 &&
      custPhone !== '9822000000' &&
      custPhone !== '0000000000' &&
      !/^0+$/.test(custPhone)
    );

    return storeData.transactions.filter((t) => {
      // 1. Direct customer ID match
      if (t.customerId && t.customerId === customer.id) return true;

      // 2. Strict valid 10-digit phone match (never match dummy '9822000000' or '0')
      const txPhone = t.customerPhone ? t.customerPhone.replace(/[^0-9]/g, '') : '';
      const isValidTxPhone = Boolean(
        txPhone &&
        txPhone.length >= 10 &&
        txPhone !== '9822000000' &&
        txPhone !== '0000000000' &&
        !/^0+$/.test(txPhone)
      );

      if (isValidCustPhone && isValidTxPhone) {
        if (custPhone.slice(-10) === txPhone.slice(-10)) return true;
      }

      // 3. Exact customer name match (only if name is distinctive and not empty/generic)
      const tName = (t.customerName || '').trim().toLowerCase();
      if (
        custName.length > 2 &&
        tName === custName &&
        !['cash', 'counter', 'रोख', 'walk-in', 'customer', 'ग्राहक'].includes(custName)
      ) {
        // If both have different valid phone numbers, do not cross-match
        if (isValidCustPhone && isValidTxPhone && custPhone.slice(-10) !== txPhone.slice(-10)) {
          return false;
        }
        return true;
      }

      return false;
    });
  }, [storeData.transactions, customer]);

  // 2. Retrieve all bill receipts for this customer
  const receipts = useMemo(() => {
    const custName = customer.name.trim().toLowerCase();
    const custPhone = customer.phone ? customer.phone.replace(/[^0-9]/g, '') : '';
    return storeData.billReceipts.filter((r) => {
      const matchId = r.customerId === customer.id;
      const rName = (r.customerName || '').trim().toLowerCase();
      const matchExactName = rName === custName;
      const matchPartialName = (custName.length > 5 && rName.includes(custName)) || (rName.length > 5 && custName.includes(rName));
      const matchPhone = custPhone && custPhone.length >= 10 && (r as any).customerPhone && String((r as any).customerPhone).replace(/[^0-9]/g, '').includes(custPhone.slice(-10));
      return matchId || matchExactName || matchPartialName || matchPhone;
    });
  }, [storeData.billReceipts, customer]);

  // 3. Retrieve 30-Month Scheme Cards for this customer
  const linkedCards = useMemo(() => {
    const custPhone = customer.phone ? customer.phone.replace(/[^0-9]/g, '') : '';
    const custName = customer.name.trim().toLowerCase();

    return storeData.cardMembers.filter((card) => {
      const cardPhone = card.phone ? card.phone.replace(/[^0-9]/g, '') : '';
      const cardName = card.memberName.trim().toLowerCase();
      const matchPhone = custPhone && cardPhone && custPhone === cardPhone;
      const matchExactName = cardName === custName;
      const matchPartialName = cardName.length > 4 && custName.length > 4 && (cardName.includes(custName) || custName.includes(cardName));
      return matchPhone || matchExactName || matchPartialName;
    });
  }, [storeData.cardMembers, customer]);

  // 4. Retrieve card transactions (installments) for these linked cards
  const cardTransactions = useMemo(() => {
    const cardNos = new Set(linkedCards.map((c) => c.cardNo));
    const cardIds = new Set(linkedCards.map((c) => c.id));
    const custName = customer.name.trim().toLowerCase();

    return storeData.cardTransactions.filter((ct) => {
      return cardNos.has(ct.cardNo) || cardIds.has(ct.cardMemberId) || ct.memberName.trim().toLowerCase() === custName;
    });
  }, [storeData.cardTransactions, linkedCards, customer]);

  // Format date helper: DD-MM-YYYY
  const formatDate = (dStr: string) => {
    if (!dStr) return '';
    if (/^\d{2}-\d{2}-\d{4}$/.test(dStr)) return dStr;
    const datePart = dStr.split('T')[0];
    const parts = datePart.split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
      return datePart;
    }
    return dStr;
  };

  // Build the chronological ledger statement rows exactly matching the showroom statement
  const ledgerStatementRows = useMemo(() => {
    const rawEntries: Array<{
      id: string;
      date: string;
      displayDate: string;
      voucherNo: string;
      particulars: string;
      debit: number;
      credit: number;
      sortOrder: number;
      type: 'BILL' | 'ADVANCE' | 'RECEIPT' | 'SCHEME';
      refTx?: Transaction;
      refReceipt?: BillReceipt;
    }> = [];

    // Add bills & their advances
    transactions.forEach((tx, idx) => {
      rawEntries.push({
        id: `tx-bill-${tx.id}`,
        date: tx.date,
        displayDate: formatDate(tx.date),
        voucherNo: tx.invoiceNo,
        particulars: tx.items.map((i) => i.name).join(' & ') || 'इलेक्ट्रॉनिक्स/फर्निचर खरेदी',
        debit: tx.grandTotal,
        credit: 0,
        sortOrder: 10 + idx,
        type: 'BILL',
        refTx: tx,
      });

      if (tx.paidAmount && tx.paidAmount > 0) {
        rawEntries.push({
          id: `tx-adv-${tx.id}`,
          date: tx.date,
          displayDate: formatDate(tx.date),
          voucherNo: `RCPT-${tx.invoiceNo}`,
          particulars: `Payment against ${tx.invoiceNo} (${tx.paymentMode || 'Cash'})`,
          debit: 0,
          credit: tx.paidAmount,
          sortOrder: 10 + idx + 0.5,
          type: 'ADVANCE',
          refTx: tx,
        });
      }
    });

    // Add collection receipts
    receipts.forEach((rc, idx) => {
      rawEntries.push({
        id: `rc-${rc.id}`,
        date: rc.date,
        displayDate: formatDate(rc.date),
        voucherNo: `REC-PAY-${rc.receiptNo}`,
        particulars: `जमा घेणारा: ${rc.handledBy || 'SHUBHAM'} • बिलामध्ये जमा${rc.invoiceNo ? ` (Against Bill #${rc.invoiceNo})` : ''}`,
        debit: 0,
        credit: rc.amountPaid,
        sortOrder: 100 + idx,
        type: 'RECEIPT',
        refReceipt: rc,
      });
    });

    // Handle cases where customer has historical totalPurchased higher than individual transaction items
    const rawDebit = rawEntries.reduce((sum, r) => sum + r.debit, 0);
    if ((customer.totalPurchased || 0) > rawDebit) {
      const diff = (customer.totalPurchased || 0) - rawDebit;
      rawEntries.unshift({
        id: 'opening-bill',
        date: customer.createdAt || '2023-01-01',
        displayDate: formatDate(customer.createdAt || '2023-01-01'),
        voucherNo: 'OPENING',
        particulars: 'मागील नोंदलेली जुनी खरेदी (Previous purchases)',
        debit: diff,
        credit: 0,
        sortOrder: 0,
        type: 'BILL',
      });
    }

    // Calculate running balance
    let currentRun = 0;
    const result: LedgerStatementRow[] = rawEntries.map((entry) => {
      currentRun += (entry.debit - entry.credit);
      return {
        id: entry.id,
        date: entry.date,
        displayDate: entry.displayDate,
        voucherNo: entry.voucherNo,
        particulars: entry.particulars,
        debit: entry.debit,
        credit: entry.credit,
        balance: currentRun,
        type: entry.type,
        refTx: entry.refTx,
        refReceipt: entry.refReceipt,
      };
    });

    return result;
  }, [transactions, receipts, customer]);

  // Overall totals
  const totalDebit = ledgerStatementRows.reduce((acc, r) => acc + r.debit, 0) || customer.totalPurchased || 0;
  const totalCredit = ledgerStatementRows.reduce((acc, r) => acc + r.credit, 0) || Math.max(0, totalDebit - customer.currentBalance);
  const currentDue = totalDebit - totalCredit;

  // WhatsApp formatted share statement in Marathi
  const handleShareWhatsApp = () => {
    const shop = storeData.settings;
    const text = `*SHRI SAI ENTERPRISES, WARDHA (श्री साई इंटरप्रायजेस)*
*CUSTOMER LEDGER STATEMENT (ग्राहक खातेवही)*
----------------------------------------
👤 *Customer (ग्राहक):* ${customer.name}
📱 *Mobile (मोबाईल):* ${customer.phone && customer.phone !== '0' ? customer.phone : 'N/A'}
📍 *Village / Address (पत्ता):* ${customer.village || customer.city || 'Waifad'}, ${customer.address || 'Wardha'}
📅 *Date (दिनांक):* ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
----------------------------------------
📊 *Account Summary (हिशोब सारांश):*
• Total Purchases (एकूण खरेदी): *₹${totalDebit.toLocaleString('en-IN')}*
• Total Paid (एकूण जमा): *₹${totalCredit.toLocaleString('en-IN')}*
• Balance Due (शिल्लक बाकी): *₹${currentDue.toLocaleString('en-IN')}* ${currentDue > 0 ? '(देय बाकी)' : '(हिशोब पूर्ण)'}
----------------------------------------
💳 *Payment Bank & UPI Details (पेमेंट तपशील):*
• UPI ID: *${shop.bankDetails?.upiId || '8766486915@ybl'}*
• Bank Name: *${shop.bankDetails?.bankName || 'HDFC Bank'}*
• Account No: *${shop.bankDetails?.accountNumber || '50200083215914'}*
• IFSC Code: *${shop.bankDetails?.ifscCode || 'HDFC0000065'}*

Thank You! (धन्यवाद!)
*SHRI SAI ENTERPRISES (श्री साई इंटरप्रायजेस)*
Address: Opposite Matoshree Sabhagruh, Arvi Road, Punjab Colony, Wardha - 442001
Contacts: 8600122978 | 9175537365 | 8766486915`;

    const encoded = encodeURIComponent(text);
    const phone = customer.phone && customer.phone !== '0' ? customer.phone.replace(/[^0-9]/g, '') : '';
    window.open(`https://wa.me/${phone ? '91' + phone : ''}?text=${encoded}`, '_blank');
  };

  // Print function with dedicated window support for seamless iframe printing
  const handlePrintStatement = () => {
    const printContent = document.getElementById('printable-customer-ledger');
    if (printContent) {
      const printWindow = window.open('', '_blank', 'width=950,height=800');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8" />
              <title>Ledger - ${customer.name}</title>
              <style>
                @page { size: A4; margin: 12mm; }
                body { font-family: system-ui, -apple-system, sans-serif; font-size: 11px; color: #111; margin: 0; padding: 10px; background: #fff; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 10px; font-size: 11px; }
                th, td { border: 1px solid #94a3b8; padding: 6px 8px; }
                th { background-color: #f1f5f9; font-weight: bold; }
                .text-right { text-align: right; }
                .text-left { text-align: left; }
                .text-center { text-align: center; }
                .font-black { font-weight: 900; }
                .font-bold { font-weight: bold; }
                @media print {
                  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
              </style>
            </head>
            <body>
              ${printContent.innerHTML}
              <script>
                window.onload = function() {
                  window.focus();
                  setTimeout(function() { window.print(); }, 250);
                };
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
        return;
      }
    }
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
      {/* Modal Container */}
      <div className={`rounded-2xl w-full max-w-5xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden border transition-colors ${
        isDayMode
          ? 'bg-white border-slate-200 text-slate-900'
          : 'bg-slate-900 border-slate-800 text-white'
      }`}>
        
        {/* Modal Top Header Bar */}
        <div className={`px-4 py-3 flex items-center justify-between border-b ${
          isDayMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
        }`}>
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-blue-400" />
            <span className="font-bold text-base sm:text-lg">
              Customer Ledger <span className="text-xs font-normal text-slate-400">(ग्राहक खातेवही)</span>
            </span>
            <span className="bg-amber-400 text-slate-950 font-extrabold px-2.5 py-0.5 rounded text-xs tracking-wide">
              {customer.name}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditingCustomer(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold transition shadow-sm cursor-pointer"
              title="खाते दुरुस्त करा (Edit Customer Info / Balance)"
            >
              <Edit3 className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">खाते दुरुस्त करा</span>
            </button>
            <button
              onClick={handleShareWhatsApp}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow-sm cursor-pointer"
              title="Share Statement on WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>
            <button
              onClick={handlePrintStatement}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition shadow-sm cursor-pointer"
              title="Print Ledger Statement"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print (प्रिंट)</span>
            </button>
            <button
              onClick={() => {
                onClose();
                onCollectPayment(customer);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Pay (जमा)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className={`flex items-center gap-2 px-4 py-2 border-b text-xs font-bold overflow-x-auto ${
          isDayMode ? 'bg-slate-100 border-slate-200' : 'bg-slate-950/70 border-slate-800'
        }`}>
          <button
            onClick={() => setActiveTab('statement')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'statement'
                ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Full Statement (संपूर्ण खातेवही)</span>
          </button>
          <button
            onClick={() => setActiveTab('bills')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'bills'
                ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Sales Bills (विक्री बिले) ({transactions.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('receipts')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'receipts'
                ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ArrowDownCircle className="w-3.5 h-3.5" />
            <span>Receipts (जमा पावत्या) ({receipts.length})</span>
          </button>
          {linkedCards.length > 0 && (
            <button
              onClick={() => setActiveTab('scheme')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'scheme'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>30-Month Scheme (योजना कार्ड) ({linkedCards.length})</span>
            </button>
          )}
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
          {/* 1. Official Store Banner Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-center text-white shadow-md">
            <h1 className="text-xl sm:text-2xl font-black text-amber-400 tracking-wide font-playfair uppercase">
              {storeData.settings.storeName || 'SHRI SAI ENTERPRISES'}{' '}
              <span className="text-xs sm:text-sm font-normal text-slate-300 font-sans tracking-normal">
                (श्री साई इंटरप्रायजेस)
              </span>
            </h1>
            <p className="text-xs text-slate-300 font-semibold mt-1">
              Electronics, Furniture Showroom & 30-Month Weekly Savings Scheme
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Opposite Matoshree Sabhagruh, Arvi Road, Punjab Colony, Wardha - 442001 <span className="opacity-75">(मातोश्री सभागृह समोर, आर्वी रोड, पंजाब कॉलनी, वर्धा)</span>
            </p>
            <p className="text-xs text-slate-300 mt-1 font-medium">
              📞 संपर्क: 8600122978 • 9175537365 • 8766486915 • GSTIN: 27ALOPL0030G2ZC
            </p>
            <div className="mt-2.5 inline-block px-4 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold rounded-full">
              CUSTOMER LEDGER STATEMENT <span className="font-normal opacity-85">(ग्राहक खातेवही विवरण)</span>
            </div>
          </div>

          {/* 2. Customer Info & 3 Summary Metric Badges */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Customer Profile (ग्राहक माहिती)
              </div>
              <div className="text-xl font-black text-white mt-0.5">
                {customer.name}
              </div>
              <div className="text-xs text-slate-300 mt-1 flex flex-wrap items-center gap-3">
                <span>📞 {customer.phone && customer.phone !== '0' ? customer.phone : 'N/A'}</span>
                <span>📍 Village: {customer.village || customer.city || 'Waifad'}</span>
                <span>Address: {customer.address || `${customer.city || 'Waifad'}, Wardha`}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <div className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-center min-w-[100px] flex-1 md:flex-none">
                <div className="text-[10px] text-slate-400 font-medium">
                  Total Purchases <span className="block text-[9px] opacity-75">(एकूण खरेदी)</span>
                </div>
                <div className="text-base sm:text-lg font-black text-white mt-0.5">
                  ₹{totalDebit.toLocaleString('en-IN')}
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-center min-w-[100px] flex-1 md:flex-none">
                <div className="text-[10px] text-slate-400 font-medium">
                  Total Paid <span className="block text-[9px] opacity-75">(एकूण जमा)</span>
                </div>
                <div className="text-base sm:text-lg font-black text-emerald-400 mt-0.5">
                  ₹{totalCredit.toLocaleString('en-IN')}
                </div>
              </div>
              <div className="bg-amber-950/30 border border-amber-500/50 rounded-xl px-3 py-2 text-center min-w-[110px] flex-1 md:flex-none">
                <div className="text-[10px] text-amber-300 font-medium">
                  Balance Due <span className="block text-[9px] opacity-75">(शिल्लक बाकी)</span>
                </div>
                <div className="text-base sm:text-lg font-black text-amber-400 mt-0.5">
                  ₹{currentDue.toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          </div>

          {/* TAB 1: FULL LEDGER STATEMENT */}
          {activeTab === 'statement' && (
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-900/90 text-slate-400 text-[11px] font-bold border-b border-slate-800 uppercase">
                      <th className="py-2.5 px-3 text-left">दिनांक (DATE)</th>
                      <th className="py-2.5 px-3 text-left">व्हाउचर नं (VOUCHER NO)</th>
                      <th className="py-2.5 px-3 text-left">तपशील (PARTICULARS)</th>
                      <th className="py-2.5 px-3 text-right">नावे / खरेदी (DEBIT +)</th>
                      <th className="py-2.5 px-3 text-right">जमा / पावती (CREDIT -)</th>
                      <th className="py-2.5 px-3 text-right font-black text-amber-400">शिल्लक बाकी (BALANCE)</th>
                      <th className="py-2.5 px-3 text-center">कृती (ACTION)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium text-slate-200">
                    {ledgerStatementRows.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-500">
                          कोणताही व्यवहार नोंद नाही
                        </td>
                      </tr>
                    ) : (
                      ledgerStatementRows.map((row) => (
                        <tr
                          key={row.id}
                          className="hover:bg-slate-900/50 transition-colors"
                        >
                          <td className="py-2.5 px-3 whitespace-nowrap text-slate-300">
                            {row.displayDate}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap font-bold text-white">
                            {row.voucherNo}
                          </td>
                          <td className="py-2.5 px-3 text-slate-300">
                            {row.particulars}
                          </td>
                          <td className="py-2.5 px-3 text-right whitespace-nowrap font-bold text-white">
                            {row.debit > 0 ? `₹${row.debit.toLocaleString('en-IN')}` : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right whitespace-nowrap font-bold text-emerald-400">
                            {row.credit > 0 ? `₹${row.credit.toLocaleString('en-IN')}` : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right whitespace-nowrap font-black text-amber-300">
                            ₹{row.balance.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            {row.refTx ? (
                              <button
                                type="button"
                                onClick={() => setEditingTx(row.refTx!)}
                                className="px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded text-[11px] font-bold inline-flex items-center gap-1 transition cursor-pointer"
                                title="हे बिल दुरुस्त करा"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>दुरुस्त करा</span>
                              </button>
                            ) : row.refReceipt ? (
                              <button
                                type="button"
                                onClick={() => setEditingRc(row.refReceipt!)}
                                className="px-2 py-1 bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/30 rounded text-[11px] font-bold inline-flex items-center gap-1 transition cursor-pointer"
                                title="ही पावती दुरुस्त करा"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>दुरुस्त करा</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setIsEditingCustomer(true)}
                                className="px-2 py-1 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 rounded text-[11px] font-bold inline-flex items-center gap-1 transition cursor-pointer"
                                title="खाते दुरुस्त करा"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>खाते दुरुस्त</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-900 font-bold border-t-2 border-slate-700 text-xs text-white">
                      <td colSpan={3} className="py-3 px-3 uppercase tracking-wider text-right font-black text-amber-400">
                        एकूण बेरीज (TOTAL LEDGER SUMMARY):
                      </td>
                      <td className="py-3 px-3 text-right font-black text-white whitespace-nowrap">
                        ₹{totalDebit.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right font-black text-emerald-400 whitespace-nowrap">
                        ₹{totalCredit.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right font-black text-amber-400 whitespace-nowrap">
                        ₹{currentDue.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-center text-slate-500 text-[10px]">
                        दुरुस्ती सुलभ
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Bottom Footer: Bank & UPI and Date */}
              <div className="p-3 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
                <div>
                  <span className="font-bold text-slate-300">नियम व अटी / Bank & UPI: </span>
                  <span>
                    • बँक: {storeData.settings.bankDetails?.bankName || 'HDFC Bank'}
                    • A/C: {storeData.settings.bankDetails?.accountNumber || '50200083215914'}
                    • IFSC: {storeData.settings.bankDetails?.ifscCode || 'HDFC0000065'}
                    • UPI: {storeData.settings.bankDetails?.upiId || '8766486915@ybl'}
                  </span>
                </div>
                <div className="font-medium text-slate-400 shrink-0">
                  दिनांक: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'numeric', year: 'numeric' })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SALES BILLS */}
          {activeTab === 'bills' && (
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950 p-3 space-y-2">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>ग्राहक विक्री बिले (Invoices)</span>
                <span className="text-[11px] text-slate-500 font-normal">जुने बिल दुरुस्त करण्यासाठी 'दुरुस्त करा' दाबा</span>
              </div>
              {transactions.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs">
                  कोणतीही स्वतंत्र बिले नोंद नाही (एकूण नोंद खरेदी: ₹{totalDebit.toLocaleString('en-IN')})
                </div>
              ) : (
                transactions.map((tx) => (
                  <div key={tx.id} className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="font-bold text-white text-sm">बिल क्र. {tx.invoiceNo}</div>
                      <div className="text-slate-400 text-[11px] mt-0.5">
                        तारीख: {formatDate(tx.date)} • {tx.items.map((i) => `${i.name} (x${i.qty})`).join(', ')}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm font-black text-white">₹{tx.grandTotal.toLocaleString('en-IN')}</div>
                        <div className="text-[11px] text-emerald-400">जमा: ₹{(tx.paidAmount || 0).toLocaleString('en-IN')}</div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setEditingTx(tx)}
                          className="px-2.5 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                          title="हे बिल दुरुस्त करा"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>दुरुस्त करा</span>
                        </button>
                        {onPrintInvoice && (
                          <button
                            onClick={() => onPrintInvoice(tx)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition border border-slate-700 cursor-pointer"
                            title="प्रिंट बिल"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: RECEIPTS */}
          {activeTab === 'receipts' && (
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950 p-3 space-y-2">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>जमा पावत्या (Cash/UPI Collection Receipts)</span>
                <span className="text-[11px] text-slate-500 font-normal">जुनी पावती दुरुस्त करण्यासाठी 'दुरुस्त करा' दाबा</span>
              </div>
              {receipts.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs">
                  कोणतीही स्वतंत्र पावती नोंद नाही
                </div>
              ) : (
                receipts.map((rc) => (
                  <div key={rc.id} className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="font-bold text-white text-sm">पावती #{rc.receiptNo}</div>
                      <div className="text-slate-400 text-[11px] mt-0.5">
                        तारीख: {formatDate(rc.date)} • पद्धत: {rc.paymentMode} • हँडलर: {rc.handledBy || 'SHUBHAM'}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm font-black text-emerald-400">₹{rc.amountPaid.toLocaleString('en-IN')}</div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setEditingRc(rc)}
                          className="px-2.5 py-1.5 bg-teal-600/20 hover:bg-teal-600/30 text-teal-400 border border-teal-500/30 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                          title="ही पावती दुरुस्त करा"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>दुरुस्त करा</span>
                        </button>
                        {onPrintReceipt && (
                          <button
                            onClick={() => onPrintReceipt(rc)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition border border-slate-700 cursor-pointer"
                            title="प्रिंट पावती"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 4: SCHEME CARDS */}
          {activeTab === 'scheme' && (
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950 p-3 space-y-2">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>३०-महिने बचत कार्ड योजना (Linked Scheme Cards)</span>
                <span className="text-[10px] text-amber-400 font-mono font-bold">₹१,००० / महिना</span>
              </div>
              {linkedCards.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs">
                  कोणतेही कार्ड लिंक नाही
                </div>
              ) : (
                linkedCards.map((c) => {
                  const sNo = resolveCardScheme(c);
                  const conf = getSchemeConfig(sNo);
                  const numCard = extractCardNumber(c.cardNo) || c.cardNo;
                  return (
                    <div
                      key={c.id}
                      className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-amber-400 text-sm">कार्ड #{numCard}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            {conf.marathiName} ({conf.tag})
                          </span>
                          {c.status === 'Draw Winner' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500 text-slate-950">
                              लकी ड्रॉ विजेता
                            </span>
                          )}
                        </div>
                        <div className="text-slate-400 text-[11px] mt-1">
                          हप्ते भरले: <strong className="text-slate-200">{c.totalPaidMonths || 0}/30 महिने</strong> (शिल्लक: {Math.max(0, 30 - (c.totalPaidMonths || 0))} महिने)
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">एकूण जमा</div>
                        <div className="text-sm font-black text-amber-400">
                          ₹{(c.totalAmountPaid || 0).toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Bar */}
        <div className={`p-3 px-4 border-t flex items-center justify-between text-xs ${
          isDayMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
        }`}>
          <div className="text-slate-400">
            हिशोब अचूक तपासला गेला आहे • झिरो कोटा लोकल सिंक
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold transition cursor-pointer"
          >
            बंद करा (Close)
          </button>
        </div>
      </div>

      {/* PRINT-ONLY DEDICATED A4 PRINT VIEW */}
      <div id="printable-customer-ledger" className="hidden print:block fixed inset-0 bg-white text-black p-8 z-[9999] overflow-visible">
        <div className="max-w-4xl mx-auto font-sans text-xs">
          {/* Print Header */}
          <div className="border-b-2 border-slate-800 pb-3 mb-3 text-center">
            <h1 className="text-xl font-black uppercase text-slate-900">
              {storeData.settings.storeName || 'श्री साई इंटरप्रायजेस'}
            </h1>
            <p className="text-xs text-slate-700 font-semibold">
              {storeData.settings.tagline || 'Shri Sai Enterprises • Wardha • Wholesale & Retail Electronics'}
            </p>
            <p className="text-[11px] text-slate-600">
              {storeData.settings.address || 'मातोश्री सभागृह समोर, आर्वी रोड, पंजाब कॉलनी, वर्धा - 442001'}
            </p>
            <p className="text-[11px] text-slate-600">
              📞 {storeData.settings.phone || '8766486915 • 8600122798 • 9175534365'} • GSTIN: {storeData.settings.gstin || '27ALOPL0030G2ZC'}
            </p>
            <div className="mt-2 inline-block px-3 py-0.5 bg-slate-100 border border-slate-400 text-slate-900 font-bold text-xs rounded">
              ग्राहक खातेवही विवरण / CUSTOMER LEDGER STATEMENT
            </div>
          </div>

          {/* Customer Profile Box */}
          <div className="p-3 border border-slate-300 rounded mb-3 flex items-center justify-between bg-slate-50">
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-bold">ग्राहक नाव:</div>
              <div className="text-base font-black text-slate-900">{customer.name}</div>
              <div className="text-slate-600 text-xs">
                📍 {customer.village || customer.city || 'Waifad'}, {customer.address || 'Wardha'}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs">एकूण खरेदी: <b>₹{totalDebit.toLocaleString('en-IN')}</b></div>
              <div className="text-xs text-emerald-800">एकूण जमा: <b>₹{totalCredit.toLocaleString('en-IN')}</b></div>
              <div className="text-sm font-black text-rose-800 mt-0.5">बाकी: <b>₹{currentDue.toLocaleString('en-IN')}</b></div>
            </div>
          </div>

          {/* Print Table */}
          <table className="w-full border-collapse border border-slate-300 text-[11px] mb-3">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-300 p-1.5 text-left">दिनांक</th>
                <th className="border border-slate-300 p-1.5 text-left">व्हाउचर नं</th>
                <th className="border border-slate-300 p-1.5 text-left">तपशील</th>
                <th className="border border-slate-300 p-1.5 text-right">खरेदी (+)</th>
                <th className="border border-slate-300 p-1.5 text-right">जमा (-)</th>
                <th className="border border-slate-300 p-1.5 text-right font-black">शिल्लक बाकी</th>
              </tr>
            </thead>
            <tbody>
              {ledgerStatementRows.map((row) => (
                <tr key={row.id}>
                  <td className="border border-slate-300 p-1.5">{row.displayDate}</td>
                  <td className="border border-slate-300 p-1.5 font-bold">{row.voucherNo}</td>
                  <td className="border border-slate-300 p-1.5">{row.particulars}</td>
                  <td className="border border-slate-300 p-1.5 text-right">{row.debit > 0 ? `₹${row.debit.toLocaleString('en-IN')}` : '-'}</td>
                  <td className="border border-slate-300 p-1.5 text-right">{row.credit > 0 ? `₹${row.credit.toLocaleString('en-IN')}` : '-'}</td>
                  <td className="border border-slate-300 p-1.5 text-right font-black">₹{row.balance.toLocaleString('en-IN')}</td>
                </tr>
              ))}
              <tr className="bg-slate-100 font-bold border-t-2 border-slate-800">
                <td colSpan={3} className="p-1.5 text-right uppercase">एकूण बेरीज:</td>
                <td className="p-1.5 text-right">₹{totalDebit.toLocaleString('en-IN')}</td>
                <td className="p-1.5 text-right">₹{totalCredit.toLocaleString('en-IN')}</td>
                <td className="p-1.5 text-right font-black">₹{currentDue.toLocaleString('en-IN')}</td>
              </tr>
            </tbody>
          </table>

          {/* Print Footer Bank & UPI */}
          <div className="border-t border-slate-300 pt-2 text-[10px] text-slate-600 flex justify-between">
            <div>
              • बँक: {storeData.settings.bankDetails?.bankName || 'HDFC Bank'} • A/C: {storeData.settings.bankDetails?.accountNumber || '50200083215914'} • IFSC: {storeData.settings.bankDetails?.ifscCode || 'HDFC0000065'} • UPI: {storeData.settings.bankDetails?.upiId || '8766486915@ybl'}
            </div>
            <div>
              दिनांक: {new Date().toLocaleDateString('en-IN')}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Customer Modal */}
      {isEditingCustomer && (
        <EditCustomerModal
          customer={customer}
          storeData={storeData}
          isOpen={true}
          onClose={() => setIsEditingCustomer(false)}
          onRefreshData={() => {
            onRefreshData();
            setIsEditingCustomer(false);
          }}
        />
      )}

      {/* Edit Transaction / Bill Modal */}
      {editingTx && (
        <EditTransactionModal
          transaction={editingTx}
          storeData={storeData}
          isOpen={true}
          onClose={() => setEditingTx(null)}
          onRefreshData={() => {
            onRefreshData();
            setEditingTx(null);
          }}
        />
      )}

      {/* Edit Receipt Modal */}
      {editingRc && (
        <EditReceiptModal
          receipt={editingRc}
          storeData={storeData}
          isOpen={true}
          onClose={() => setEditingRc(null)}
          onRefreshData={() => {
            onRefreshData();
            setEditingRc(null);
          }}
        />
      )}
    </div>
  );
};
