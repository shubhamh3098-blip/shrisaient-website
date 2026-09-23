import React, { useState, useMemo, useEffect } from 'react';
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
  Receipt,
  Download
} from 'lucide-react';
import { BusinessSettings, Customer, TransactionEntry, CardTransaction } from '../types';
import { AppLogo } from './AppLogo';
import { getSafeWhatsAppUrl } from '../utils/numbering';

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
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

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

      // 3. Name match: If customer has a real name, match transactions with the exact same name & village
      if (!isGenericCustName && t.customerName) {
        if (t.customerName.trim().toLowerCase() === custNameLower) {
          // If both have village specified, ensure village matches
          if (customer.village && t.village) {
            const vCust = customer.village.trim().toLowerCase();
            const vTx = t.village.trim().toLowerCase();
            if (vCust && vTx && vCust !== vTx) return false;
          }
          return true;
        }
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

    // Track payment vouchers and payment signatures to avoid double-counting receipts across collections
    const seenPaymentKeys = new Set<string>();

    const getReceiptLookupKeys = (voucher: string): string[] => {
      const keys: string[] = [];
      const clean = (voucher || '').trim().toUpperCase();
      if (!clean) return keys;
      keys.push(`v:${clean}`);
      // Only normalize receipt numbers (strip REC-PAY-, REC-, PAY-)
      // Keep down payments like RCPT-3665 separate so they don't collide with bill receipts
      if (!clean.startsWith('RCPT-')) {
        const stripped = clean.replace(/^(REC-PAY-|REC-|PAY-)/i, '').trim();
        if (stripped) {
          keys.push(`norm:${stripped}`);
        }
      }
      return keys;
    };

    matchingBills.forEach((b) => {
      const isReceiptOnly = b.invoiceNo?.startsWith('REC-') || b.itemDetails?.toLowerCase().includes('settlement');

      if (isReceiptOnly) {
        const creditAmt = b.payingNow || b.totalAmount || 0;
        // Skip ₹0 ghost receipts
        if (creditAmt <= 0) return;

        const voucher = (b.invoiceNo || 'REC').trim();
        const lookupKeys = getReceiptLookupKeys(voucher);
        const isDuplicate = lookupKeys.some((k) => seenPaymentKeys.has(k));
        if (isDuplicate) return;

        lookupKeys.forEach((k) => seenPaymentKeys.add(k));
        if (b.id) seenPaymentKeys.add(`id:${b.id}`);
        if (b.date && creditAmt > 0) seenPaymentKeys.add(`da:${b.date}_${creditAmt}`);

        rawList.push({
          id: `pay-${b.id}`,
          date: b.date || b.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
          type: 'PAYMENT',
          voucherNo: voucher,
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
          const downPayVoucher = `RCPT-${b.invoiceNo}`.trim();
          seenPaymentKeys.add(`v:${downPayVoucher.toUpperCase()}`);
          if (b.date) seenPaymentKeys.add(`da:${b.date}_${paid}`);

          rawList.push({
            id: `pay-${b.id}`,
            date: b.date || b.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
            type: 'PAYMENT',
            voucherNo: downPayVoucher,
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
      const voucher = String(ct.receiptNo || (isCard ? `SCH-${ct.cardNumber}` : 'REC')).trim();
      const amt = ct.amount || 0;
      const lookupKeys = getReceiptLookupKeys(voucher);

      // If this voucher matches an already recorded payment receipt, SKIP IT!
      const isDuplicate = lookupKeys.some((k) => seenPaymentKeys.has(k));
      if (isDuplicate) return;

      // Also skip if date + amount matches a non-card receipt already seen
      if (!isCard && ct.date && amt > 0 && seenPaymentKeys.has(`da:${ct.date}_${amt}`)) {
        return;
      }

      lookupKeys.forEach((k) => seenPaymentKeys.add(k));
      if (ct.id) seenPaymentKeys.add(`id:${ct.id}`);
      if (ct.date && amt > 0) seenPaymentKeys.add(`da:${ct.date}_${amt}`);

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
        debit: ct.type === 'Refund' ? amt : 0,
        credit: ct.type === 'Refund' ? 0 : amt,
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

    // Sort chronologically ascending; on same date, put sales BILLs first so balance calculation is orderly
    rawList.sort((a, b) => {
      const dateCmp = a.date.localeCompare(b.date);
      if (dateCmp !== 0) return dateCmp;
      if (a.type === 'BILL' && b.type !== 'BILL') return -1;
      if (a.type !== 'BILL' && b.type === 'BILL') return 1;
      return a.voucherNo.localeCompare(b.voucherNo);
    });

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

  // Cleanup print classes on unmount or after print
  useEffect(() => {
    const handleAfterPrint = () => {
      document.body.classList.remove('is-printing-ledger', 'is-printing-modal');
    };
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      window.removeEventListener('afterprint', handleAfterPrint);
      document.body.classList.remove('is-printing-ledger', 'is-printing-modal');
    };
  }, []);

  // Print statement with mobile & isolation support
  const handlePrint = () => {
    document.body.classList.add('is-printing-ledger', 'is-printing-modal');
    try {
      window.print();
    } catch (err) {
      console.error('Print error:', err);
    } finally {
      setTimeout(() => {
        document.body.classList.remove('is-printing-ledger', 'is-printing-modal');
      }, 2000);
    }
  };

  // Download self-contained A4 Printable HTML Statement
  const handleDownloadA4Statement = () => {
    const today = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const rowsHtml = ledgerItems.map((item, idx) => `
      <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; white-space: nowrap;">${item.date}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; font-weight: 600; font-family: monospace;">${item.voucherNo}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px;">${item.description}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; text-align: right; font-weight: bold; font-family: monospace;">${item.debit > 0 ? '₹' + item.debit.toLocaleString() : '-'}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; text-align: right; font-weight: bold; color: #15803d; font-family: monospace;">${item.credit > 0 ? '₹' + item.credit.toLocaleString() : '-'}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; text-align: right; font-weight: 800; font-family: monospace;">₹${item.balance.toLocaleString()}</td>
      </tr>
    `).join('');

    const htmlDoc = `<!DOCTYPE html>
<html lang="mr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>खातेवही विवरण - ${customer.name} - श्री साई इंटरप्राइजेस</title>
  <style>
    @page { size: A4 portrait; margin: 8mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Devanagari", sans-serif; margin: 0; padding: 12px; color: #0f172a; background: #ffffff; }
    .header { background: #0b1528; color: #ffffff; padding: 20px; border-radius: 12px; border-bottom: 3px solid #f59e0b; text-align: center; }
    .header h1 { margin: 0 0 4px; font-size: 22px; font-weight: 800; letter-spacing: 0.5px; }
    .header p { margin: 2px 0; font-size: 12px; color: #cbd5e1; }
    .header .badge { display: inline-block; margin-top: 10px; background: #f59e0b; color: #000; font-weight: 800; padding: 4px 14px; border-radius: 9999px; font-size: 11px; text-transform: uppercase; }
    .kpi-box { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 16px 0; padding: 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; }
    .kpi-stats { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; text-align: center; }
    .stat-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px; }
    .stat-card.due { background: #fffbeb; border-color: #fcd34d; }
    table { width: 100%; border-collapse: collapse; margin-top: 14px; }
    th { background: #f1f5f9; color: #334155; font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 10px; border-bottom: 2px solid #cbd5e1; text-align: left; }
    tfoot tr { background: #f1f5f9; font-weight: 800; border-top: 2px solid #94a3b8; }
    tfoot td { padding: 10px; font-size: 12px; }
    .footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: flex-end; font-size: 11px; color: #64748b; }
    .sign-box { text-align: center; border-top: 1px solid #475569; width: 180px; padding-top: 6px; font-weight: 700; color: #0f172a; }
    .print-bar { display: flex; gap: 10px; margin-bottom: 12px; }
    .btn { padding: 8px 16px; background: #2563eb; color: #ffffff; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 13px; }
    @media print { .print-bar { display: none !important; } body { padding: 0 !important; } }
  </style>
</head>
<body>
  <div class="print-bar">
    <button class="btn" onclick="window.print()">🖨️ ही खातेवही प्रिंट करा / Save as PDF</button>
  </div>
  <div class="header">
    <h1>श्री साई इंटरप्राइजेस</h1>
    <p>Shri Sai Enterprises • Wardha • Wholesale & Retail Electronics</p>
    <p>मातोश्री सभागृह समोर, आर्वी रोड, पंजाब कॉलनी, वर्धा - 442001</p>
    <p>📞 8766486915 • 8600122798 • GSTIN: ${settings.gstin}</p>
    <div class="badge">ग्राहक खातेवही विवरण / Customer Ledger Statement</div>
  </div>

  <div class="kpi-box">
    <div>
      <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b;">ग्राहक माहिती / Customer Profile</div>
      <div style="font-size: 16px; font-weight: 800; color: #0f172a; margin: 3px 0;">${customer.name}</div>
      <div style="font-size: 12px; color: #475569;">📞 मोबाईल: <strong>${customer.phone || 'N/A'}</strong></div>
      ${customer.village ? `<div style="font-size: 12px; color: #475569;">📍 गाव: <strong>${customer.village}</strong></div>` : ''}
      ${customer.address ? `<div style="font-size: 12px; color: #475569;">पत्ता: ${customer.address}</div>` : ''}
    </div>
    <div class="kpi-stats">
      <div class="stat-card">
        <div style="font-size: 10px; color: #64748b;">एकूण खरेदी</div>
        <div style="font-size: 14px; font-weight: 800; font-family: monospace;">₹${totalBilled.toLocaleString()}</div>
      </div>
      <div class="stat-card">
        <div style="font-size: 10px; color: #64748b;">एकूण जमा</div>
        <div style="font-size: 14px; font-weight: 800; color: #15803d; font-family: monospace;">₹${totalPaid.toLocaleString()}</div>
      </div>
      <div class="stat-card due">
        <div style="font-size: 10px; font-weight: 800; color: #92400e;">शिल्लक बाकी</div>
        <div style="font-size: 15px; font-weight: 900; color: #b45309; font-family: monospace;">₹${currentDue.toLocaleString()}</div>
      </div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 14%;">दिनांक</th>
        <th style="width: 14%;">व्हाऊचर क्र.</th>
        <th>तपशील / Particulars</th>
        <th style="text-align: right; width: 15%;">नावे / खरेदी (Debit)</th>
        <th style="text-align: right; width: 15%;">जमा / पावती (Credit)</th>
        <th style="text-align: right; width: 15%;">शिल्लक बाकी (Balance)</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml || '<tr><td colspan="6" style="text-align: center; padding: 20px; color: #94a3b8;">कोणतेही व्यवहार उपलब्ध नाहीत.</td></tr>'}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="3" style="text-align: right; text-transform: uppercase; font-size: 11px;">एकूण बेरीज (Total Ledger Summary):</td>
        <td style="text-align: right; font-family: monospace;">₹${totalBilled.toLocaleString()}</td>
        <td style="text-align: right; color: #15803d; font-family: monospace;">₹${totalPaid.toLocaleString()}</td>
        <td style="text-align: right; color: #b45309; font-family: monospace; font-size: 13px;">₹${currentDue.toLocaleString()}</td>
      </tr>
    </tfoot>
  </table>

  <div class="footer">
    <div>
      <div style="font-weight: 700; color: #0f172a; margin-bottom: 2px;">नियम व अटी / Bank & UPI:</div>
      <div>• बँक: ${settings.bankDetails.bankName} • A/C: ${settings.bankDetails.accountNumber} • IFSC: ${settings.bankDetails.ifsc}</div>
      <div>• UPI ID: 8766486915@upi (PhonePe / GPay / Paytm)</div>
      <div style="font-size: 10px; color: #94a3b8; margin-top: 3px;">हे संगणकीकृत अधिकृत खातेवही विवरण आहे.</div>
    </div>
    <div style="text-align: right;">
      <div style="margin-bottom: 30px; font-size: 10px; color: #94a3b8;">दिनांक: ${today}</div>
      <div class="sign-box">
        <div>श्री साई इंटरप्राइजेस</div>
        <div style="font-size: 9px; font-weight: normal; color: #64748b;">अधिकृत स्वाक्षरी / Authorized Signatory</div>
      </div>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlDoc], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeName = (customer.name || 'Customer').replace(/[^a-zA-Z0-9_\u0900-\u097F]/g, '_');
    link.href = url;
    link.download = `Ledger_${safeName}_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
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
    const itemsToInclude = ledgerItems.slice(-15); // Include up to 15 entries for rich WhatsApp breakdown
    itemsToInclude.forEach((item, idx) => {
      const typeLabel = item.type === 'BILL' ? 'खरेदी (Bill)' : 'जमा (Receipt)';
      const amtText = item.debit > 0 ? `+₹${item.debit.toLocaleString()}` : `-₹${item.credit.toLocaleString()}`;
      itemsText += `${idx + 1}. ${item.date} [${item.voucherNo}] ${typeLabel}: ${amtText} (बाकी: ₹${item.balance.toLocaleString()})\n`;
    });

    const text = encodeURIComponent(
      `*${settings.businessName}*\n` +
      `*श्री साई इंटरप्राइजेस, वर्धा*\n` +
      `*ग्राहक खातेवही विवरण / Customer Ledger Statement*\n` +
      `------------------------------------------\n` +
      `👤 *ग्राहक:* ${customer.name}\n` +
      `📞 *मोबाईल:* ${customer.phone || 'N/A'}\n` +
      (customer.village ? `📍 *गाव:* ${customer.village}\n` : '') +
      `📅 *दिनांक:* ${today}\n` +
      `------------------------------------------\n` +
      `*सर्व व्यवहारांचा तपशील (Ledger Entries):*\n` +
      (itemsText || 'कोणतीही जुनी उधारी नोंद नाही.\n') +
      `------------------------------------------\n` +
      `📦 एकूण खरेदी (Total Purchases): *₹${totalBilled.toLocaleString()}*\n` +
      `✅ एकूण जमा रक्कम (Total Received): *₹${totalPaid.toLocaleString()}*\n` +
      `⚠️ *शिल्लक बाकी (Balance Due): ₹${currentDue.toLocaleString()}*\n` +
      `------------------------------------------\n` +
      (currentDue > 0
        ? `🙏 विनंती: कृपया शिल्लक बाकी रक्कम ₹${currentDue.toLocaleString()} लवकरात लवकर जमा करावी.\n` +
          `💳 UPI / PhonePe / GPay: *8766486915@upi*\n`
        : `🎉 सर्व खाते पूर्ण क्लिअर आहे! धन्यवाद!\n`) +
      `📞 संपर्क: ${settings.phone} / 8600122798\n` +
      `📍 पत्ता: मातोश्री सभागृह समोर, आर्वी रोड, पंजाब कॉलनी, वर्धा`
    );

    const url = getSafeWhatsAppUrl(customer.phone, text);
    window.open(url, '_blank');
  };

  const submitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingPayment) return;
    const amt = parseFloat(payAmount);
    if (!amt || amt <= 0 || !onReceivePayment) return;

    setIsSubmittingPayment(true);
    onReceivePayment(customer.id, amt, payMode, payNotes);
    setPayAmount('');
    setPayNotes('');
    setShowPaymentForm(false);
    setTimeout(() => {
      setIsSubmittingPayment(false);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto print:p-0 print:m-0 print:static print:bg-white print:overflow-visible">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden border border-slate-200 animate-fade-in flex flex-col h-[95vh] sm:h-auto sm:max-h-[92vh] print:h-auto print:max-h-none print:shadow-none print:border-none print:rounded-none print:my-0 print:overflow-visible">
        
        {/* Top Action Header (hidden in print) */}
        <div className="no-print bg-slate-900 text-white px-3 sm:px-6 py-2.5 sm:py-3.5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 sm:p-2 rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-400 shrink-0">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-bold text-xs sm:text-base text-white">
                  ग्राहक खातेवही (Ledger)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-amber-400 text-slate-950 font-mono">
                  {customer.name}
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400 hidden xs:block">
                सर्व खरेदी बिल, जमा पावत्या आणि चालू बाकी हिशोब
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              title="ग्राहक WhatsApp वर पूर्ण खातेवही हिशोब पाठवा"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp पाठवा</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              title="A4 / Thermal पावती प्रिंट करा"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">प्रिंट (Print)</span>
              <span className="sm:hidden">प्रिंट</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadA4Statement}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              title="A4 खातेवही फाईल डाऊनलोड करा (Offline / Mobile PDF)"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">A4 फाईल</span>
              <span className="sm:hidden">डाऊनलोड</span>
            </button>

            {onReceivePayment && (
              <button
                type="button"
                onClick={() => setShowPaymentForm(!showPaymentForm)}
                className="hidden sm:flex px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-semibold items-center gap-1.5 transition cursor-pointer"
              >
                <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                <span>+ जमा</span>
              </button>
            )}

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
                disabled={isSubmittingPayment}
                className={`px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs transition ${
                  isSubmittingPayment ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer active:scale-95'
                }`}
              >
                {isSubmittingPayment ? 'नोंद होत आहे...' : 'Save Payment & Update Ledger'}
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

          {/* Mobile Card Feed (block on mobile, hidden on desktop & print) */}
          <div className="ledger-mobile-cards block sm:hidden print:hidden space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider px-1">
              <span>सर्व व्यवहार ({ledgerItems.length})</span>
              <span>बाकी हिशोब</span>
            </div>

            {ledgerItems.length === 0 ? (
              <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs">
                या ग्राहकाचे अद्याप कोणतेही व्यवहार उपलब्ध नाहीत.
              </div>
            ) : (
              ledgerItems.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-mono text-slate-500 font-medium">
                        {item.date}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200">
                        {item.voucherNo}
                      </span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                        item.debit > 0
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      }`}
                    >
                      {item.debit > 0 ? 'खरेदी (Bill)' : 'जमा (Payment)'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-800 font-medium leading-snug">
                    {item.description}
                  </p>

                  <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-1">
                      {item.debit > 0 ? (
                        <span className="font-mono font-bold text-slate-900 text-sm">
                          +₹{item.debit.toLocaleString()}
                        </span>
                      ) : (
                        <span className="font-mono font-bold text-emerald-700 text-sm">
                          -₹{item.credit.toLocaleString()}
                        </span>
                      )}
                      {item.mode && (
                        <span className="text-[10px] text-slate-400">
                          ({item.mode})
                        </span>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-medium">चालू बाकी</span>
                      <span className="font-mono font-black text-slate-950 text-xs">
                        ₹{item.balance.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* Mobile Summary Card */}
            <div className="bg-slate-900 text-white p-3.5 rounded-xl space-y-2 mt-3 shadow-sm">
              <div className="flex justify-between text-xs text-slate-300">
                <span>एकूण बिल खरेदी (Purchases):</span>
                <span className="font-mono font-bold text-white">₹{totalBilled.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs text-emerald-300">
                <span>एकूण जमा पावती (Paid):</span>
                <span className="font-mono font-bold">₹{totalPaid.toLocaleString()}</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                <span className="text-xs font-bold text-amber-300 uppercase">शिल्लक बाकी (Due):</span>
                <span className="font-mono font-black text-base text-amber-400">₹{currentDue.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Desktop & Print Ledger Table */}
          <div className="ledger-table-container hidden sm:block print:block border border-slate-200 rounded-xl overflow-hidden shadow-2xs print:border-slate-300 print:shadow-none print:break-inside-auto">
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

        {/* Mobile Sticky Bottom Action Bar (visible on mobile, hidden on desktop & in print) */}
        <div className="sm:hidden no-print p-2.5 bg-white border-t border-slate-200 flex items-center gap-1.5 shrink-0 shadow-lg">
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="flex-1 py-2.5 px-2 rounded-xl bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Share2 className="w-4 h-4 stroke-[2.5]" />
            <span>WhatsApp</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-xs cursor-pointer"
            title="थेट प्रिंट करा"
          >
            <Printer className="w-4 h-4" />
            <span>प्रिंट</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadA4Statement}
            className="py-2.5 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-amber-300 font-bold text-xs flex items-center justify-center gap-1 shadow-xs cursor-pointer"
            title="A4 खातेवही फाईल डाऊनलोड करा"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>A4</span>
          </button>
        </div>

      </div>
    </div>
  );
};
