import React, { useState, useMemo } from 'react';
import {
  X,
  Printer,
  Share2,
  Phone,
  MapPin,
  Calendar,
  FileText,
  Receipt,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  ExternalLink,
  Edit3,
  Save,
  RotateCcw,
  AlertCircle
} from 'lucide-react';
import { Customer, TransactionEntry, BusinessSettings, CardTransaction } from '../types';
import { openStandardPrintWindow } from '../utils/printStandards';

interface CustomerLedgerModalProps {
  customer: Customer;
  transactions: TransactionEntry[];
  cardTransactions?: CardTransaction[];
  settings: BusinessSettings;
  onClose: () => void;
  onReceivePayment?: (customer: Customer, billNo?: string, dueAmount?: number) => void;
  onUpdateCustomer?: (updated: Customer) => void;
}

interface LedgerRow {
  id: string;
  date: string;
  type: 'Bill' | 'Receipt';
  voucherNo: string;
  refBillNo?: string;
  particulars: string;
  paymentMode: string;
  debit: number;  // Billed / Udhar added
  credit: number; // Cash / Received (reduces udhar)
  runningBalance: number;
  rawEntry: TransactionEntry;
}

export const CustomerLedgerModal: React.FC<CustomerLedgerModalProps> = ({
  customer,
  transactions,
  cardTransactions = [],
  settings,
  onClose,
  onReceivePayment,
  onUpdateCustomer,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'bills' | 'receipts'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showOpeningModal, setShowOpeningModal] = useState(false);
  const [openingInput, setOpeningInput] = useState(String(customer?.openingBalance || 0));
  const [openingDateInput, setOpeningDateInput] = useState(customer?.openingBalanceDate || '');

  // 1. Gather all transactions associated with this customer
  const customerNameNorm = (customer?.name || '').trim().toLowerCase();
  const customerPhoneClean = String(customer?.phone || '').replace(/[^0-9]/g, '');

  const matchingTransactions = useMemo(() => {
    if (!customer) return [];
    const cleanCName = customerNameNorm.replace(/[\(\[\{].*?[\)\]\}]/g, '').replace(/\s+/g, ' ').trim();

    return (transactions || []).filter((t) => {
      if (!t) return false;
      const tName = (t.customerName || '').trim().toLowerCase();
      const cleanTName = tName.replace(/[\(\[\{].*?[\)\]\}]/g, '').replace(/\s+/g, ' ').trim();
      const nameMatch =
        (customerNameNorm && tName === customerNameNorm) ||
        (cleanCName && cleanTName && cleanCName === cleanTName) ||
        (cleanCName.length >= 4 && cleanTName.length >= 4 && (cleanTName.includes(cleanCName) || cleanCName.includes(cleanTName)));

      const tPhone = String(t.customerPhone || '').replace(/[^0-9]/g, '');
      const phoneMatch = customerPhoneClean && tPhone && tPhone === customerPhoneClean;
      const idMatch = t.customerId && t.customerId === customer.id;
      return nameMatch || phoneMatch || idMatch;
    });
  }, [transactions, customerNameNorm, customerPhoneClean, customer?.id]);

  // 2. Build Chronological Ledger with Running Balance
  const ledgerRows = useMemo(() => {
    // Sort transactions chronologically (oldest first)
    const sorted = [...matchingTransactions].sort((a, b) => {
      const dateA = a.date || '';
      const dateB = b.date || '';
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      return (a.createdAt || '').localeCompare(b.createdAt || '');
    });

    const hasBills = sorted.some((e) => e.entryType !== 'Receipt' && (e.totalAmount || 0) > 0);

    // If explicit opening balance is set by user, honor it.
    // If customer has real bills, do NOT create an artificial opening balance unless customer.openingBalance > 0.
    // If customer has NO bills, fallback to customer.openingBalance or customer.balanceDue.
    const initialOpening = customer?.openingBalance !== undefined
      ? (customer.openingBalance || 0)
      : (hasBills ? 0 : (customer?.balanceDue || 0));

    let currentBalance = initialOpening;
    const rows: LedgerRow[] = [];

    if (initialOpening > 0) {
      // Date of opening balance should be BEFORE the first transaction, never customer.lastVisit!
      const oldestDate = sorted[0]?.date || '2024-04-01';
      let opnDate = customer?.openingBalanceDate;
      if (!opnDate) {
        try {
          const parts = oldestDate.split('-').map(Number);
          const prev = new Date(parts[0], (parts[1] || 1) - 1, (parts[2] || 1) - 1);
          opnDate = prev.toISOString().split('T')[0];
        } catch {
          opnDate = '2024-04-01';
        }
      }

      rows.push({
        id: `opn-${customer?.id || 'bal'}`,
        date: opnDate,
        type: 'Bill',
        voucherNo: 'OPN-KHATA',
        refBillNo: undefined,
        particulars: 'आरंभीची शिल्लक (Opening Khata Balance)',
        paymentMode: 'Cash',
        debit: initialOpening,
        credit: 0,
        runningBalance: currentBalance,
        rawEntry: {
          id: `opn-${customer?.id || 'bal'}`,
          invoiceNo: 'OPN-KHATA',
          date: opnDate,
          customerName: customer?.name || '',
          itemDetails: 'आरंभीची शिल्लक (Opening Khata Balance)',
          totalAmount: initialOpening,
          payingNow: 0,
          dueAmount: initialOpening,
          paymentMode: 'Cash',
          createdAt: new Date().toISOString(),
        },
      });
    }

    sorted.forEach((entry) => {
      const isExplicitReceipt =
        entry.entryType === 'Receipt' ||
        entry.invoiceNo.startsWith('SSE/RCPT') ||
        entry.invoiceNo.includes('RCPT') ||
        entry.itemDetails.toLowerCase().includes('receipt') ||
        (entry.totalAmount === 0 && entry.payingNow > 0);

      const refBill =
        entry.refBillNo ||
        entry.againstBillNo ||
        (entry.notes && entry.notes.match(/bill[:#\s]*([0-9a-zA-Z-]+)/i)?.[1]);

      if (isExplicitReceipt) {
        // Customer paid money later (उधारी जमा / पावती)
        const credit = entry.payingNow;
        currentBalance = Math.max(0, currentBalance - credit);

        rows.push({
          id: entry.id,
          date: entry.date,
          type: 'Receipt',
          voucherNo: entry.invoiceNo,
          refBillNo: refBill || undefined,
          particulars: entry.itemDetails || `उधारी जमा पावती (${refBill ? `बिल #${refBill}` : 'रोख'})`,
          paymentMode: entry.paymentMode || 'Cash',
          debit: 0,
          credit,
          runningBalance: currentBalance,
          rawEntry: entry,
        });
      } else {
        // Sales bill (खरेदी / उधारी बिल)
        // If customer bought items worth totalAmount:
        // That adds totalAmount to udhari (debit), and immediate payingNow is credit
        const debit = entry.totalAmount;
        const immediatePaid = entry.payingNow;

        currentBalance += (debit - immediatePaid);

        rows.push({
          id: entry.id,
          date: entry.date,
          type: 'Bill',
          voucherNo: entry.invoiceNo,
          refBillNo: undefined,
          particulars: entry.itemDetails || 'विक्री बिल (Sales Bill)',
          paymentMode: entry.paymentMode || 'Cash',
          debit,
          credit: immediatePaid,
          runningBalance: currentBalance,
          rawEntry: entry,
        });
      }
    });

    return rows;
  }, [matchingTransactions, customer]);

  // Overall totals
  const totalBilled = ledgerRows.reduce((sum, r) => sum + r.debit, 0);
  const totalReceived = ledgerRows.reduce((sum, r) => sum + r.credit, 0);
  const calculatedDue = Math.max(0, totalBilled - totalReceived);
  const displayDue = calculatedDue;

  const currentOpeningAmt = customer?.openingBalance !== undefined
    ? (customer.openingBalance || 0)
    : (ledgerRows.some((r) => r.type === 'Bill' && r.voucherNo !== 'OPN-KHATA') ? 0 : (customer?.balanceDue || 0));

  const handleSetOpeningZero = () => {
    if (!onUpdateCustomer || !customer) return;
    const baseBilled = totalBilled - (currentOpeningAmt || 0);
    const updated: Customer = {
      ...customer,
      openingBalance: 0,
      openingBalanceDate: undefined,
      totalPurchased: baseBilled,
      totalPurchases: baseBilled,
      totalPaid: totalReceived,
      balanceDue: Math.max(0, baseBilled - totalReceived),
    };
    onUpdateCustomer(updated);
    setShowOpeningModal(false);
  };

  const handleSaveCustomOpening = () => {
    if (!onUpdateCustomer || !customer) return;
    const val = parseFloat(openingInput) || 0;
    const baseBilled = totalBilled - (currentOpeningAmt || 0);
    const updated: Customer = {
      ...customer,
      openingBalance: val,
      openingBalanceDate: openingDateInput || undefined,
      totalPurchased: baseBilled + val,
      totalPurchases: baseBilled + val,
      totalPaid: totalReceived,
      balanceDue: Math.max(0, (baseBilled + val) - totalReceived),
    };
    onUpdateCustomer(updated);
    setShowOpeningModal(false);
  };

  // Filtered rows for UI
  const filteredRows = useMemo(() => {
    return ledgerRows.filter((r) => {
      const matchesType =
        filterType === 'all'
          ? true
          : filterType === 'bills'
          ? r.type === 'Bill'
          : r.type === 'Receipt';

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        r.voucherNo.toLowerCase().includes(q) ||
        (r.refBillNo && r.refBillNo.toLowerCase().includes(q)) ||
        r.particulars.toLowerCase().includes(q) ||
        r.date.includes(q);

      return matchesType && matchesSearch;
    });
  }, [ledgerRows, filterType, searchQuery]);

  // Print Statement Handler
  const handlePrint = () => {
    const innerHtml = `
      <div class="header-bar">
        <div>
          <h1 class="brand-title">${settings.businessName}</h1>
          <p class="brand-subtitle">${settings.address} | संपर्क: ${settings.phone} ${settings.gstin ? `| GSTIN: ${settings.gstin}` : ''}</p>
        </div>
        <div class="text-right">
          <div class="doc-type-badge">ग्राहक खातेवही (Ledger)</div>
          <p style="font-size: 8.5pt; color: #64748b; margin-top: 4px;">स्टेटमेंट दिनांक: <strong>${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong></p>
        </div>
      </div>

      <div class="info-grid">
        <div class="info-box">
          <strong>ग्राहक तपशील (Customer Info):</strong><br>
          नाव: <strong>${customer.name}</strong><br>
          मोबाईल: <strong>${customer.phone || 'N/A'}</strong> ${customer.address ? `| पत्ता: ${customer.address}` : ''}
        </div>
        <div class="info-box">
          <strong>खाते सारांश (Account Summary):</strong><br>
          नोंदींची संख्या: <strong>${ledgerRows.length}</strong> (बिले व पावत्या)<br>
          स्थिती: <strong>${displayDue > 0 ? `₹${displayDue.toLocaleString()} बाकी` : 'पूर्ण जमा'}</strong>
        </div>
      </div>

      <div class="kpi-row">
        <div class="kpi-card">
          <div class="kpi-title">एकूण खरेदी (Debit / Billed)</div>
          <div class="kpi-val">₹${totalBilled.toLocaleString()}</div>
        </div>
        <div class="kpi-card paid">
          <div class="kpi-title">एकूण जमा (Credit / Paid)</div>
          <div class="kpi-val">₹${totalReceived.toLocaleString()}</div>
        </div>
        <div class="kpi-card ${displayDue > 0 ? 'due' : 'paid'}">
          <div class="kpi-title">शिल्लक बाकी (Balance Due)</div>
          <div class="kpi-val">₹${displayDue.toLocaleString()}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 75px;">दिनांक</th>
            <th style="width: 80px;">प्रकार</th>
            <th style="width: 95px;">व्हाउचर नं</th>
            <th>तपशील / संदर्भ</th>
            <th style="width: 55px;" class="text-center">मोड</th>
            <th class="text-right" style="width: 95px;">नावे ₹ (Debit)</th>
            <th class="text-right" style="width: 95px;">जमा ₹ (Credit)</th>
            <th class="text-right" style="width: 100px;">शिल्लक ₹ (Balance)</th>
          </tr>
        </thead>
        <tbody>
          ${ledgerRows
            .map(
              (r) => `
            <tr>
              <td class="font-mono">${r.date}</td>
              <td class="${r.type === 'Bill' ? 'tag-bill' : 'tag-receipt'}">${r.type === 'Bill' ? 'विक्री बिल' : 'उधारी जमा'}</td>
              <td class="font-mono"><strong>${r.voucherNo}</strong>${r.refBillNo ? `<br/><small style="color: #64748b;">Ref #${r.refBillNo}</small>` : ''}</td>
              <td>${r.particulars}</td>
              <td class="text-center">${r.paymentMode}</td>
              <td class="text-right font-mono font-bold">${r.debit > 0 ? `₹${r.debit.toLocaleString()}` : '-'}</td>
              <td class="text-right font-mono font-bold tag-receipt">${r.credit > 0 ? `₹${r.credit.toLocaleString()}` : '-'}</td>
              <td class="text-right font-mono font-bold" style="${r.runningBalance > 0 ? 'color: #e11d48;' : ''}">₹${r.runningBalance.toLocaleString()}</td>
            </tr>
          `
            )
            .join('')}
          <tr style="background-color: #f8fafc; font-weight: bold; border-top: 2px solid #cbd5e1;">
            <td colspan="5" class="text-right">एकूण बेरीज (Totals):</td>
            <td class="text-right font-mono">₹${totalBilled.toLocaleString()}</td>
            <td class="text-right font-mono tag-receipt">₹${totalReceived.toLocaleString()}</td>
            <td class="text-right font-mono" style="${displayDue > 0 ? 'color: #e11d48;' : ''}">₹${displayDue.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>

      <div class="footer-section">
        <div>
          <p style="margin: 0;">ही संगणकीय प्रणालीद्वारे तयार केलेली अधिकृत खातेवही आहे.</p>
          <p style="margin: 3px 0 0 0;">${settings.businessName} • ${settings.address || 'वर्धा'} • फोन: ${settings.phone || '8766486915'}</p>
        </div>
        <div class="sign-box">
          <div class="sign-line"></div>
          <strong>अधिकृत स्वाक्षरी / सही व शिक्का</strong>
        </div>
      </div>
    `;

    openStandardPrintWindow(`Ledger_${customer.name}`, innerHtml, 'portrait', 'A4');
  };

  // WhatsApp Share Handler
  const handleWhatsAppShare = () => {
    let msg = `*${settings.businessName} - ग्राहक खातेवही / स्टेटमेंट*\n`;
    msg += `ग्राहक: *${customer.name}*\n`;
    if (customer.phone) msg += `फोन: ${customer.phone}\n`;
    msg += `--------------------------------\n`;
    msg += `एकूण खरेदी (Debit): ₹${totalBilled.toLocaleString()}\n`;
    msg += `एकूण जमा रक्कम (Credit): ₹${totalReceived.toLocaleString()}\n`;
    msg += `*सध्याची शिल्लक बाकी (Due): ₹${displayDue.toLocaleString()}*\n`;
    msg += `--------------------------------\n`;
    msg += `*अलीकडील नोंदी (Recent Transactions):*\n`;

    // Last 5 transactions
    const recent = ledgerRows.slice(-5);
    recent.forEach((r) => {
      const typeStr = r.type === 'Bill' ? 'विक्री बिल' : 'उधारी जमा';
      msg += `• ${r.date} | ${typeStr} (#${r.voucherNo})${r.refBillNo ? ` [Ref: #${r.refBillNo}]` : ''} - `;
      if (r.debit > 0) msg += `नावे: ₹${r.debit.toLocaleString()} `;
      if (r.credit > 0) msg += `जमा: ₹${r.credit.toLocaleString()} `;
      msg += `| बाकी: ₹${r.runningBalance.toLocaleString()}\n`;
    });

    msg += `\nहिशोब तपासण्यासाठी किंवा बाकी जमा करण्यासाठी संपर्क करा: ${settings.phone}\n`;
    msg += `धन्यवाद! 🙏`;

    const phoneClean = customer.phone ? customer.phone.replace(/[^0-9]/g, '') : '';
    const url = phoneClean
      ? `https://wa.me/91${phoneClean}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-5xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 font-bold">
                📖
              </span>
              <div>
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  <span>{customer.name}</span>
                  {displayDue > 0 ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      उधारी बाकी: ₹{displayDue.toLocaleString()}
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      हिशोब पूर्ण (Cleared)
                    </span>
                  )}
                </h2>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 mt-1">
                  {customer.phone && (
                    <span className="flex items-center gap-1 font-mono">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {customer.phone}
                    </span>
                  )}
                  {customer.address && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {customer.address}
                    </span>
                  )}
                  <span className="text-slate-400 font-mono">
                    ID: {customer.id}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              title="Print Customer Ledger Statement"
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border border-white/10"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">प्रिंट स्टेटमेंट</span>
            </button>
            <button
              onClick={handleWhatsAppShare}
              title="Share Statement on WhatsApp"
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">व्हॉट्सॲप पाठवा</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3-Way Summary Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 sm:p-5 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 p-3.5 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span>एकूण खरेदी बिल (Total Billed / Debit)</span>
              <ArrowUpRight className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              ₹{totalBilled.toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              {ledgerRows.filter((r) => r.type === 'Bill').length} बिले नोंदवली
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 p-3.5 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span>एकूण जमा रक्कम (Paid / Credit)</span>
              <ArrowDownLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              ₹{totalReceived.toLocaleString()}
            </p>
            <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">
              तत्काळ भरलेले + नंतर आणलेली उधारी
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/20 p-3.5 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs text-rose-800 dark:text-rose-300 font-medium">
                सध्याची उधारी बाकी (Net Due)
              </span>
              <p className="text-2xl font-bold text-rose-700 dark:text-rose-400 mt-1">
                ₹{displayDue.toLocaleString()}
              </p>
              <p className="text-[11px] text-rose-600/80 dark:text-rose-400/80 mt-0.5">
                {displayDue > 0 ? 'ग्राहकाकडून येणे बाकी' : 'सर्व हिशोब पूर्ण आहे'}
              </p>
            </div>
            {onReceivePayment && displayDue > 0 && (
              <button
                onClick={() => {
                  onClose();
                  onReceivePayment(customer);
                }}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                उधारी जमा करा
              </button>
            )}
          </div>
        </div>

        {/* Opening Balance Management Bar */}
        <div className="px-5 py-2.5 bg-amber-50/70 dark:bg-amber-950/30 border-b border-amber-200/70 dark:border-amber-900/40 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-amber-900 dark:text-amber-200">
              आरंभीची शिल्लक (Opening Balance):
            </span>
            <span className="font-mono font-bold text-amber-950 dark:text-amber-100 bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded-md border border-amber-300 dark:border-amber-700">
              ₹{(currentOpeningAmt || 0).toLocaleString()}
            </span>
            {currentOpeningAmt === 0 ? (
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                (✓ खात्यावरील सर्व हिशोब थेट बिले व जमा पावत्यांनुसार अचूक मोजला आहे)
              </span>
            ) : (
              <span className="text-[11px] text-amber-700 dark:text-amber-400">
                (जुन्या खात्यावरील आरंभीची बाकी समाविष्ट आहे)
              </span>
            )}
          </div>

          {onUpdateCustomer && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setOpeningInput(String(customer?.openingBalance || 0));
                  setOpeningDateInput(customer?.openingBalanceDate || '');
                  setShowOpeningModal(true);
                }}
                className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>आरंभीची शिल्लक दुरुस्त करा</span>
              </button>
            </div>
          )}
        </div>

        {/* Search & Filter Toolbar */}
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-2 sm:py-1.5 rounded-xl text-sm sm:text-xs font-semibold transition cursor-pointer ${
                filterType === 'all'
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              सर्व नोंदी ({ledgerRows.length})
            </button>
            <button
              onClick={() => setFilterType('bills')}
              className={`px-3 py-2 sm:py-1.5 rounded-xl text-sm sm:text-xs font-semibold transition cursor-pointer ${
                filterType === 'bills'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40'
              }`}
            >
              विक्री बिले ({ledgerRows.filter((r) => r.type === 'Bill').length})
            </button>
            <button
              onClick={() => setFilterType('receipts')}
              className={`px-3 py-2 sm:py-1.5 rounded-xl text-sm sm:text-xs font-semibold transition cursor-pointer ${
                filterType === 'receipts'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
              }`}
            >
              उधारी जमा पावत्या ({ledgerRows.filter((r) => r.type === 'Receipt').length})
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Bill No, Receipt No, or Date..."
              className="w-full pl-9 pr-3 py-2.5 sm:py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-base sm:text-xs text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-medium"
            />
          </div>
        </div>

        {/* Ledger Table - Increased base font size on small screens (<640px) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white dark:bg-slate-900">
          {filteredRows.length === 0 ? (
            <div className="py-16 text-center text-slate-400 dark:text-slate-500 space-y-2">
              <FileText className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 stroke-1" />
              <p className="text-base sm:text-sm font-semibold text-slate-600 dark:text-slate-300">कोणत्याही नोंदी आढळल्या नाहीत</p>
              <p className="text-sm sm:text-xs text-slate-400 dark:text-slate-500">
                या ग्राहकाचे अद्याप कोणतेही बिल किंवा जमा पावती सिस्टीममध्ये लोड झालेली नाही.
              </p>
            </div>
          ) : (
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm sm:text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-3.5 px-3.5 whitespace-nowrap text-sm sm:text-xs">दिनांक (Date)</th>
                      <th className="py-3.5 px-3.5 whitespace-nowrap text-sm sm:text-xs">प्रकार</th>
                      <th className="py-3.5 px-3.5 whitespace-nowrap text-sm sm:text-xs">व्हाउचर / बिल नं</th>
                      <th className="py-3.5 px-3.5 text-sm sm:text-xs">तपशील व संदर्भ</th>
                      <th className="py-3.5 px-3.5 text-center whitespace-nowrap text-sm sm:text-xs">मोड</th>
                      <th className="py-3.5 px-3.5 text-right text-blue-800 dark:text-blue-400 whitespace-nowrap text-sm sm:text-xs">खरेदी / नावे ₹</th>
                      <th className="py-3.5 px-3.5 text-right text-emerald-800 dark:text-emerald-400 whitespace-nowrap text-sm sm:text-xs">जमा रक्कम ₹</th>
                      <th className="py-3.5 px-3.5 text-right text-slate-900 dark:text-white font-bold whitespace-nowrap text-sm sm:text-xs">शिल्लक बाकी ₹</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredRows.map((row) => (
                      <tr
                        key={row.id}
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition ${
                          row.type === 'Receipt' ? 'bg-emerald-50/20 dark:bg-emerald-950/20' : ''
                        }`}
                      >
                        {/* Date */}
                        <td className="py-3.5 px-3.5 font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap text-sm sm:text-xs">
                          {row.date}
                        </td>

                        {/* Type Badge */}
                        <td className="py-3.5 px-3.5 whitespace-nowrap">
                          {row.type === 'Bill' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 sm:py-0.5 rounded-md text-xs sm:text-[11px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                              <FileText className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
                              विक्री बिल
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 sm:py-0.5 rounded-md text-xs sm:text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              <Receipt className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
                              उधारी जमा
                            </span>
                          )}
                        </td>

                        {/* Voucher No & Against Bill */}
                        <td className="py-3.5 px-3.5 whitespace-nowrap">
                          <div className="font-bold text-slate-900 dark:text-white font-mono text-sm sm:text-xs">
                            {row.voucherNo}
                          </div>
                          {row.refBillNo && (
                            <div className="text-xs sm:text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800 inline-block mt-0.5">
                              संदर्भ बिल: #{row.refBillNo}
                            </div>
                          )}
                          {row.type === 'Bill' && onReceivePayment && (
                            <button
                              type="button"
                              onClick={() => {
                                const billDue = row.rawEntry.dueAmount !== undefined ? row.rawEntry.dueAmount : Math.max(0, row.rawEntry.totalAmount - row.rawEntry.payingNow);
                                onClose();
                                onReceivePayment(customer, row.voucherNo, billDue);
                              }}
                              className="text-[10px] text-blue-600 hover:text-blue-800 dark:text-blue-400 font-bold block mt-1 hover:underline cursor-pointer"
                              title="या बिलाविरुद्ध पार्ट पेमेंट पावती नोंदवा"
                            >
                              + पार्ट पेमेंट पावती
                            </button>
                          )}
                        </td>

                        {/* Particulars */}
                        <td className="py-3.5 px-3.5 text-slate-700 dark:text-slate-300 max-w-xs text-sm sm:text-xs">
                          <p className="truncate font-medium">{row.particulars}</p>
                          {row.rawEntry.notes && row.rawEntry.notes !== row.particulars && (
                            <p className="text-xs sm:text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                              {row.rawEntry.notes}
                            </p>
                          )}
                        </td>

                        {/* Payment Mode */}
                        <td className="py-3.5 px-3.5 text-center whitespace-nowrap">
                          <span className="px-2.5 py-1 sm:py-0.5 rounded-md text-xs sm:text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {row.paymentMode}
                          </span>
                        </td>

                        {/* Debit (Bill Amount) */}
                        <td className="py-3.5 px-3.5 text-right font-bold text-slate-900 dark:text-white whitespace-nowrap text-base sm:text-xs font-mono-num">
                          {row.debit > 0 ? (
                            `₹${row.debit.toLocaleString()}`
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600">-</span>
                          )}
                        </td>

                        {/* Credit (Received) */}
                        <td className="py-3.5 px-3.5 text-right font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap text-base sm:text-xs font-mono-num">
                          {row.credit > 0 ? (
                            `₹${row.credit.toLocaleString()}`
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600">-</span>
                          )}
                        </td>

                        {/* Running Balance */}
                        <td className="py-3.5 px-3.5 text-right whitespace-nowrap">
                          <span
                            className={`font-mono font-bold text-base sm:text-xs ${
                              row.runningBalance > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            ₹{row.runningBalance.toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="text-slate-500 dark:text-slate-400">
            दिसत असलेल्या नोंदी: <strong>{filteredRows.length}</strong> (एकूण {ledgerRows.length} पैकी)
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold transition cursor-pointer"
            >
              बंद करा (Close)
            </button>
            {onReceivePayment && displayDue > 0 && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onReceivePayment(customer);
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                + उधारी जमा नोंदवा
              </button>
            )}
          </div>
        </div>

        {/* Opening Balance Edit Modal */}
        {showOpeningModal && (
          <div className="fixed inset-0 bg-black/60 z-60 flex items-center justify-center p-4 backdrop-blur-xs">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-scale-in">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-amber-600" />
                  आरंभीची शिल्लक दुरुस्त करा / ताळमेळ
                </h3>
                <button
                  type="button"
                  onClick={() => setShowOpeningModal(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl space-y-2 text-xs border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>एकूण विक्री बिले (Invoices):</span>
                  <span className="font-mono font-bold">₹{(totalBilled - (currentOpeningAmt || 0)).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
                  <span>एकूण जमा पावत्या व रोख (Paid):</span>
                  <span className="font-mono font-bold">₹{totalReceived.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-700">
                  <span>थेट बिल-पावती बाकी (Direct Net Due):</span>
                  <span className="font-mono text-rose-600 dark:text-rose-400">
                    ₹{Math.max(0, (totalBilled - (currentOpeningAmt || 0)) - totalReceived).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    आरंभीची बाकी रक्कम (Opening Balance Amount ₹)
                  </label>
                  <input
                    type="number"
                    value={openingInput}
                    onChange={(e) => setOpeningInput(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono font-bold"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    जर सर्व बिले व पावत्या सॉफ्टवेअरमध्ये आहेत, तर ही रक्कम ० (शून्य) ठेवावी.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    आरंभीची दिनांक (Opening Date)
                  </label>
                  <input
                    type="date"
                    value={openingDateInput}
                    onChange={(e) => setOpeningDateInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleSetOpeningZero}
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  आरंभीची शिल्लक ० करा (फक्त बिले व पावत्यांनुसार जुळवा)
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowOpeningModal(false)}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
                  >
                    रद्द करा
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveCustomOpening}
                    className="flex-1 py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    बदल जतन करा
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
