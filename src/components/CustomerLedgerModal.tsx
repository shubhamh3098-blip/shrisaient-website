import React, { useState, useMemo } from 'react';
import {
  Printer,
  Share2,
  X,
  Phone,
  MapPin,
  Calendar,
  FileText,
  CreditCard,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  IndianRupee,
  Receipt
} from 'lucide-react';
import { BusinessSettings, Customer, TransactionEntry, CardTransaction } from '../types';
import { AppLogo } from './AppLogo';

interface CustomerLedgerModalProps {
  customer: Customer;
  transactions: TransactionEntry[];
  cardTransactions?: CardTransaction[];
  settings: BusinessSettings;
  onClose: () => void;
  onReceivePayment?: (customerId: string, amount: number, mode: 'Cash' | 'Online', notes: string) => void;
}

interface LedgerItem {
  id: string;
  date: string;
  type: 'BILL' | 'PAYMENT' | 'SCHEME_DEPOSIT' | 'SCHEME_REFUND';
  voucherNo: string;
  description: string;
  debit: number; // Sale / Bill amount (+ balance due)
  credit: number; // Payment received (- balance due)
  balance: number; // Running balance after this entry
  mode?: string;
}

export const CustomerLedgerModal: React.FC<CustomerLedgerModalProps> = ({
  customer,
  transactions,
  cardTransactions = [],
  settings,
  onClose,
  onReceivePayment,
}) => {
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState<'Cash' | 'Online'>('Cash');
  const [payNotes, setPayNotes] = useState('');

  // 1. Gather all transactions matching this customer (by customerId, phone, or name)
  const ledgerItems: LedgerItem[] = useMemo(() => {
    const custPhoneClean = (customer.phone || '').replace(/\D/g, '');
    const isCustPhoneValid = custPhoneClean.length >= 10 && !/^(\d)\1{9,}$/.test(custPhoneClean);
    const custNameLower = (customer.name || '').trim().toLowerCase();
    const isGenericCustName = !custNameLower || custNameLower.startsWith('ग्राहक #') || custNameLower.startsWith('customer #');

    // Matching sales bills & payment receipts
    const matchingBills = transactions.filter((t) => {
      // 1. Explicit Customer ID match
      if (t.customerId && t.customerId === customer.id) return true;

      // 2. Phone match ONLY IF both customer and transaction have valid 10-digit phone
      if (isCustPhoneValid && t.customerPhone) {
        const tPhone = t.customerPhone.replace(/\D/g, '');
        if (tPhone.length >= 10 && tPhone === custPhoneClean) return true;
      }

      // 3. Name match: If customer has a real name, match transactions with the exact same name
      if (!isGenericCustName && t.customerName) {
        if (t.customerName.trim().toLowerCase() === custNameLower) return true;
      }

      // 4. If customer is generic "ग्राहक #...", only match if transaction name explicitly matches this exact label
      if (isGenericCustName && t.customerName && t.customerName.trim().toLowerCase() === custNameLower) {
        return true;
      }

      return false;
    });

    // Matching card scheme transactions & payments
    const matchingCardTx = cardTransactions.filter((ct: any) => {
      if (ct.memberId && ct.memberId === customer.id) return true;
      if (ct.customerId && ct.customerId === customer.id) return true;
      if (isCustPhoneValid && ct.customerPhone) {
        const ctPhone = ct.customerPhone.replace(/\D/g, '');
        if (ctPhone.length >= 10 && ctPhone === custPhoneClean) return true;
      }
      const txNameLower = (ct.memberName || ct.customerName || '').trim().toLowerCase();
      if (!isGenericCustName && txNameLower && txNameLower === custNameLower) return true;
      return false;
    });

    // Combine raw entries
    const rawList: {
      id: string;
      date: string;
      type: 'BILL' | 'PAYMENT' | 'SCHEME_DEPOSIT' | 'SCHEME_REFUND';
      voucherNo: string;
      description: string;
      debit: number;
      credit: number;
      mode?: string;
    }[] = [];

    matchingBills.forEach((b) => {
      const isReceiptOnly = b.invoiceNo?.startsWith('REC-') || b.itemDetails?.toLowerCase().includes('settlement');

      if (isReceiptOnly) {
        const creditAmt = b.payingNow || b.totalAmount || 0;
        // Skip ₹0 ghost receipts
        if (creditAmt <= 0) return;

        rawList.push({
          id: `pay-${b.id}`,
          date: b.date || b.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
          type: 'PAYMENT',
          voucherNo: b.invoiceNo || 'REC',
          description: b.itemDetails || `जमा पावती (${b.paymentMode || 'Cash'})`,
          debit: 0,
          credit: creditAmt,
          mode: b.paymentMode,
        });
      } else {
        const total = b.totalAmount || 0;
        const paid = b.payingNow || 0;
        const due = b.dueAmount || 0;

        // Skip completely empty ghost records where debit, paid, and due are all 0
        if (total <= 0 && paid <= 0 && due <= 0) {
          return;
        }

        // Sales Invoice is a DEBIT (Customer owes this amount)
        rawList.push({
          id: `bill-${b.id}`,
          date: b.date || b.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
          type: 'BILL',
          voucherNo: b.invoiceNo || 'INV',
          description: b.itemDetails || 'विक्री बिल तपशील (Sales Bill)',
          debit: total,
          credit: 0,
          mode: b.paymentMode,
        });

        // If customer paid on this bill immediately, record credit
        if (paid > 0) {
          rawList.push({
            id: `pay-${b.id}`,
            date: b.date || b.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
            type: 'PAYMENT',
            voucherNo: `RCPT-${b.invoiceNo}`,
            description: `Payment against ${b.invoiceNo} (${b.paymentMode || 'Cash'})`,
            debit: 0,
            credit: paid,
            mode: b.paymentMode,
          });
        }
      }
    });

    // Add card scheme & payment receipt transactions
    matchingCardTx.forEach((ct: any) => {
      const isCard = !!ct.cardNumber;
      const voucher = ct.receiptNo || (isCard ? `SCH-${ct.cardNumber}` : 'REC');
      const desc = ct.type === 'Refund'
        ? `परतावा (Refund) • ${ct.remarks || ''}`
        : isCard
          ? `कार्ड योजना हप्ता भरणा (Card Scheme: ${ct.remarks || ct.notes || 'Monthly'})`
          : `जमा पावती (Payment Receipt): ${ct.remarks || 'Bill Credit'}`;

      rawList.push({
        id: `card-${ct.id}`,
        date: ct.date || new Date().toISOString().split('T')[0],
        type: ct.type === 'Refund' ? 'SCHEME_REFUND' : 'SCHEME_DEPOSIT',
        voucherNo: voucher,
        description: desc,
        debit: ct.type === 'Refund' ? (ct.amount || 0) : 0,
        credit: ct.type === 'Refund' ? 0 : (ct.amount || 0),
        mode: ct.paymentMode || 'Cash',
      });
    });

    // If there are no individual bills in rawList, create opening register balance entries
    const effectivePurchased = Math.max(
      customer.totalPurchased || 0,
      (customer.totalPaid || 0) + (customer.balanceDue || 0)
    );

    if (matchingBills.length === 0 && effectivePurchased > 0) {
      rawList.push({
        id: `opening-bill-${customer.id}`,
        date: customer.lastVisit || '2025-04-01',
        type: 'BILL',
        voucherNo: 'OPN-PURCHASE',
        description: 'आरंभीची खरेदी / जुनी बिले नोंद (Historical Sales Register Balance)',
        debit: effectivePurchased,
        credit: 0,
        mode: 'Khata / Udhar',
      });

      if ((customer.totalPaid || 0) > 0 && matchingCardTx.length === 0) {
        rawList.push({
          id: `opening-rcpt-${customer.id}`,
          date: customer.lastVisit || '2025-04-01',
          type: 'PAYMENT',
          voucherNo: 'OPN-RECEIPT',
          description: 'मागील जमा पावती / भरणा (Historical Payments Received)',
          debit: 0,
          credit: customer.totalPaid,
          mode: 'Cash/Online',
        });
      }
    }

    // Sort chronologically ascending
    rawList.sort((a, b) => a.date.localeCompare(b.date));

    // Calculate running balance
    let runningBalance = 0;
    return rawList.map((item) => {
      runningBalance = runningBalance + item.debit - item.credit;
      return {
        ...item,
        balance: runningBalance,
      };
    });
  }, [customer, transactions, cardTransactions]);

  // Overall totals
  const totalBilled = useMemo(() => {
    const sumDebit = ledgerItems.reduce((acc, i) => acc + i.debit, 0);
    if (sumDebit > 0 || ledgerItems.length > 0) {
      return sumDebit;
    }
    const effectivePurchased = Math.max(
      customer.totalPurchased || 0,
      (customer.totalPaid || 0) + (customer.balanceDue || 0)
    );
    return effectivePurchased;
  }, [ledgerItems, customer]);

  const totalPaid = useMemo(() => {
    const sumCredit = ledgerItems.reduce((acc, i) => acc + i.credit, 0);
    if (sumCredit > 0 || ledgerItems.length > 0) {
      return sumCredit;
    }
    return customer.totalPaid || 0;
  }, [ledgerItems, customer]);

  const currentDue = Math.max(0, totalBilled - totalPaid);

  // Print statement
  const handlePrint = () => {
    window.print();
  };

  // Format WhatsApp message with complete statement
  const handleShareWhatsApp = () => {
    const phone = customer.phone.replace(/[^0-9]/g, '');
    const today = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    let itemsText = '';
    const recent = ledgerItems.slice(-8); // last 8 records to keep WhatsApp concise
    recent.forEach((item) => {
      const typeLabel = item.type === 'BILL' ? 'खरेदी (Bill)' : 'जमा (Payment)';
      const amtText = item.debit > 0 ? `+₹${item.debit.toLocaleString()}` : `-₹${item.credit.toLocaleString()}`;
      itemsText += `• ${item.date} | ${item.voucherNo} | ${typeLabel}: ${amtText} | बाकी: ₹${item.balance.toLocaleString()}\n`;
    });

    const text = encodeURIComponent(
      `*${settings.businessName}*\n` +
      `*श्री साई इंटरप्राइजेस, वर्धा*\n` +
      `*ग्राहक खातेवही विवरण / Customer Ledger Statement*\n` +
      `------------------------------------------\n` +
      `👤 *ग्राहक:* ${customer.name}\n` +
      `📞 *मोबाईल:* ${customer.phone}\n` +
      (customer.village ? `📍 *गाव:* ${customer.village}\n` : '') +
      `📅 *दिनांक:* ${today}\n` +
      `------------------------------------------\n` +
      `*अलीकडील व्यवहारांचा तपशील (Recent Entries):*\n` +
      (itemsText || 'कोणतीही जुनी उधारी नोंद नाही.\n') +
      `------------------------------------------\n` +
      `📦 एकूण बिल खरेदी (Total Purchases): *₹${totalBilled.toLocaleString()}*\n` +
      `✅ एकूण जमा रक्कम (Total Received): *₹${totalPaid.toLocaleString()}*\n` +
      `⚠️ *शिल्लक बाकी (Balance Due): ₹${currentDue.toLocaleString()}*\n` +
      `------------------------------------------\n` +
      (currentDue > 0
        ? `🙏 विनंती: कृपया शिल्लक रक्कम ₹${currentDue.toLocaleString()} लवकरात लवकर जमा करावी.\n` +
          `💳 UPI / PhonePe / GPay: *8766486915@upi*\n`
        : `🎉 सर्व खाते क्लिअर आहे! धन्यवाद!\n`) +
      `📞 संपर्क: ${settings.phone} / 8600122798\n` +
      `🌐 वेबसाईट: ${settings.domainName}\n` +
      `पत्ता: मातोश्री सभागृह समोर, आर्वी रोड, पंजाब कॉलनी, वर्धा`
    );

    const url = phone ? `https://wa.me/91${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  const submitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(payAmount);
    if (!amt || amt <= 0 || !onReceivePayment) return;

    onReceivePayment(customer.id, amt, payMode, payNotes);
    setPayAmount('');
    setPayNotes('');
    setShowPaymentForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:m-0 print:static print:bg-white print:overflow-visible">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden border border-slate-200 my-auto animate-fade-in flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:my-0 print:overflow-visible">
        
        {/* Top Action Header (hidden in print) */}
        <div className="no-print bg-slate-900 text-white px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-white">
                  ग्राहक खातेवही (Customer Ledger / Khata)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {customer.name}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Detailed statement of bills, payments, and live balance due
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onReceivePayment && (
              <button
                type="button"
                onClick={() => setShowPaymentForm(!showPaymentForm)}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>+ Receive Payment</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Ledger</span>
            </button>

            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Send WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Inline Quick Payment Form (no-print) */}
        {showPaymentForm && (
          <form
            onSubmit={submitPayment}
            className="no-print bg-emerald-50/70 border-b border-emerald-200 p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-emerald-600" />
                जमा पावती नोंदवा (Record Payment Received from {customer.name})
              </span>
              <button
                type="button"
                onClick={() => setShowPaymentForm(false)}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                ✕ Cancel
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Amount Received (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder="e.g. 2000"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-semibold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Payment Mode
                </label>
                <select
                  value={payMode}
                  onChange={(e) => setPayMode(e.target.value as any)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm"
                >
                  <option value="Cash">Cash (रोख)</option>
                  <option value="Online">Online UPI / GPay / PhonePe</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Remarks / Notes
                </label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="e.g. Cleared bill 1002 balance"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
              >
                Save Payment & Update Ledger
              </button>
            </div>
          </form>
        )}

        {/* Scrollable Printable Statement Content */}
        <div id="printable-ledger" className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5 bg-white text-slate-900 print:overflow-visible print:p-2 print:space-y-3">
          
          {/* Official Letterhead Header */}
          <div className="bg-[#0B1528] text-white p-5 rounded-2xl border-b-2 border-amber-500 text-center relative overflow-hidden">
            <div className="flex justify-center mb-2">
              <AppLogo size="sm" variant="iconOnly" />
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-wide font-serif">
              श्री साई इंटरप्राइजेस
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-slate-200">
              Shri Sai Enterprises • Wardha • Wholesale & Retail Electronics
            </p>
            <p className="text-[11px] text-slate-300 mt-1">
              मातोश्री सभागृह समोर, आर्वी रोड, पंजाब कॉलनी, वर्धा - 442001
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono text-amber-300 mt-1.5 font-bold">
              <span>📞 8766486915</span>
              <span>•</span>
              <span>8600122798</span>
              <span>•</span>
              <span>9175534365</span>
              <span>•</span>
              <span>GSTIN: {settings.gstin}</span>
            </div>
            <div className="mt-2 inline-block px-3 py-0.5 rounded-full bg-amber-400 text-slate-950 text-xs font-black tracking-wider uppercase">
              ग्राहक खातेवही विवरण / Customer Ledger Statement
            </div>
          </div>

          {/* Customer Profile & KPI Bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                ग्राहक माहिती (Customer Profile)
              </span>
              <h4 className="text-base font-bold text-slate-900">{customer.name}</h4>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <strong>{customer.phone || 'N/A'}</strong>
                </span>
                {customer.village && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>गाव: <strong>{customer.village}</strong></span>
                  </span>
                )}
                {customer.address && (
                  <span className="text-slate-500">
                    पत्ता: {customer.address}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="block text-[10px] text-slate-500 font-medium">एकूण खरेदी (Total)</span>
                <span className="text-sm font-bold text-slate-900">₹{totalBilled.toLocaleString()}</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="block text-[10px] text-slate-500 font-medium">एकूण जमा (Paid)</span>
                <span className="text-sm font-bold text-emerald-600">₹{totalPaid.toLocaleString()}</span>
              </div>
              <div className={`p-2.5 rounded-lg border ${currentDue > 0 ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-emerald-50 border-emerald-300 text-emerald-900'}`}>
                <span className="block text-[10px] font-bold">शिल्लक बाकी (Due)</span>
                <span className="text-sm font-black">₹{currentDue.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs print:border-slate-300 print:shadow-none print:break-inside-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">दिनांक (Date)</th>
                  <th className="py-2.5 px-3">व्हाऊचर नं (Voucher No)</th>
                  <th className="py-2.5 px-3">तपशील (Particulars)</th>
                  <th className="py-2.5 px-3 text-right">नावे / खरेदी (Debit +)</th>
                  <th className="py-2.5 px-3 text-right">जमा / पावती (Credit -)</th>
                  <th className="py-2.5 px-3 text-right">शिल्लक बाकी (Balance)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {ledgerItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400 font-sans">
                      या ग्राहकाचे अद्याप कोणतेही व्यवहार उपलब्ध नाहीत.
                    </td>
                  </tr>
                ) : (
                  ledgerItems.map((item, idx) => (
                    <tr
                      key={item.id || idx}
                      className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} print:break-inside-avoid`}
                    >
                      <td className="py-2 px-3 text-slate-600 whitespace-nowrap">{item.date}</td>
                      <td className="py-2 px-3 font-semibold text-slate-800 whitespace-nowrap">{item.voucherNo}</td>
                      <td className="py-2 px-3 text-slate-700 font-sans max-w-xs truncate" title={item.description}>
                        {item.description}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900">
                        {item.debit > 0 ? `₹${item.debit.toLocaleString()}` : '-'}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-600">
                        {item.credit > 0 ? `₹${item.credit.toLocaleString()}` : '-'}
                      </td>
                      <td className="py-2 px-3 text-right font-black text-slate-950">
                        ₹{item.balance.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900 print:break-inside-avoid">
                  <td colSpan={3} className="py-2.5 px-3 text-right font-sans uppercase text-[11px]">
                    एकूण बेरीज (Total Ledger Summary):
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-950">
                    ₹{totalBilled.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-emerald-700">
                    ₹{totalPaid.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-amber-800 text-sm">
                    ₹{currentDue.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Statement Footer & Signatures */}
          <div className="pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 items-end text-xs print:break-inside-avoid print:pt-3">
            <div className="space-y-1 text-slate-500">
              <p className="font-semibold text-slate-800">नियम व अटी / Bank & UPI:</p>
              <p>• बँक: {settings.bankDetails.bankName} • A/C: {settings.bankDetails.accountNumber}</p>
              <p>• IFSC: {settings.bankDetails.ifsc} • UPI: 8766486915@upi</p>
              <p className="text-[11px] text-slate-400">
                हे संगणकीकृत खातेवही विवरण आहे. काही चूक आढळल्यास त्वरित कळवावे.
              </p>
            </div>

            <div className="flex flex-col items-end sm:items-end text-right space-y-10">
              <span className="text-[11px] text-slate-400">
                दिनांक: {new Date().toLocaleDateString('en-IN')}
              </span>
              <div className="border-t border-slate-400 pt-1 w-44 text-center">
                <p className="font-bold text-slate-900">श्री साई इंटरप्राइजेस</p>
                <p className="text-[10px] text-slate-500">अधिकृत स्वाक्षरी / Authorized Signatory</p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
