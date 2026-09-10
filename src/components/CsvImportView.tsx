import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  FileText,
  CreditCard,
  Building2,
  Receipt,
  ArrowRight,
  Database,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import {
  CardMember,
  CardSchemeId,
  CardTransaction,
  Customer,
  Dealer,
  PurchaseEntry,
  TransactionEntry
} from '../types';
import { SCHEMES_CONFIG } from '../utils/storage';

interface CsvImportViewProps {
  onImportBills: (bills: TransactionEntry[]) => void;
  onImportReceipts: (receipts: CardTransaction[]) => void;
  onImportCardMembers: (members: CardMember[], autoReceipts?: CardTransaction[]) => void;
  onImportPurchases: (purchases: PurchaseEntry[], dealers: Dealer[]) => void;
  existingCardMembers?: CardMember[];
  existingDealers?: Dealer[];
  onSwitchTab?: (tab: any) => void;
}

type ImportType = 'bills' | 'receipts' | 'cards' | 'purchases';

// Helper: Normalize header keys (lowercase + remove all non-alphanumeric characters)
const normKey = (k: any): string => {
  if (!k) return '';
  return String(k).toLowerCase().replace(/[^a-z0-9]/g, '');
};

// Helper: Get value matching any of the candidate keys
const getField = (row: Record<string, any>, candidates: string[], defaultValue = ''): string => {
  const normMap: Record<string, string> = {};
  for (const [k, v] of Object.entries(row)) {
    if (v !== undefined && v !== null && String(v).trim() !== '') {
      normMap[normKey(k)] = String(v).trim();
    }
  }

  for (const cand of candidates) {
    const nk = normKey(cand);
    if (normMap[nk] !== undefined && normMap[nk] !== '') {
      return normMap[nk];
    }
  }
  return defaultValue;
};

// Helper: Parse numerical values cleanly
const parseNum = (val: any, defaultVal = 0): number => {
  if (val === undefined || val === null || val === '') return defaultVal;
  const cleaned = String(val).replace(/[^0-9.-]/g, '');
  const n = parseFloat(cleaned);
  return isNaN(n) ? defaultVal : n;
};

// Helper: Normalize dates into YYYY-MM-DD
const normalizeDate = (dStr: string): string => {
  if (!dStr) return new Date().toISOString().split('T')[0];
  const clean = dStr.trim().replace(/\//g, '-');
  const parts = clean.split('-');
  if (parts.length === 3) {
    const p1 = parts[0].trim();
    const p2 = parts[1].trim();
    const p3 = parts[2].trim();
    // DD-MM-YYYY
    if (p1.length <= 2 && p3.length === 4) {
      return `${p3}-${p2.padStart(2, '0')}-${p1.padStart(2, '0')}`;
    }
    // DD-MM-YY
    if (p1.length <= 2 && p3.length === 2) {
      return `20${p3}-${p2.padStart(2, '0')}-${p1.padStart(2, '0')}`;
    }
    // YYYY-MM-DD
    if (p1.length === 4) {
      return `${p1}-${p2.padStart(2, '0')}-${p3.padStart(2, '0')}`;
    }
  }
  return clean || new Date().toISOString().split('T')[0];
};

export const CsvImportView: React.FC<CsvImportViewProps> = ({
  onImportBills,
  onImportReceipts,
  onImportCardMembers,
  onImportPurchases,
  existingCardMembers = [],
  onSwitchTab,
}) => {
  const [activeImportType, setActiveImportType] = useState<ImportType>('cards');
  const [targetSchemeId, setTargetSchemeId] = useState<string>('auto');
  const [csvText, setCsvText] = useState('');
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [parseError, setParseError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Sample CSV Templates
  const sampleTemplates: Record<ImportType, { filename: string; content: string; desc: string }> = {
    cards: {
      filename: 'sample_card_members.csv',
      desc: 'Card Scheme Members (NAME, CARD.NO, VILLEGE, MOBILE.NO, OPENING AMT, DATE, SHEET NO)',
      content: `NAME,CARD.NO,VILLEGE,MOBILE.NO,OPENING AMT,DATE,SHEET NO
RANJANA SHAMBHARKAR,4107,BORI,,600,05-07-2025,2793
VAISHALI BAVNE,4304,HINGNI,,100,18-10-2025,5104
SUNIL DANDAGE,3191,PIPRI,8855881081,3000,01-11-2024,
SANGITA UTTAM PATIL,1030,HINGNI,7972811639,450,01-06-2025,
YAMUNA PRABHAKAR KAIKADI,1029,HINGNI,8698041323,200,01-06-2025,`,
    },
    bills: {
      filename: 'sample_sales_bills.csv',
      desc: 'Old Sales Invoices & Customer Bills (Bill No, Customer Name, Grand Total, Amount Paid, Balance Due)',
      content: `Bill No,Date,Card No,Customer Name,Mobile,Village,Items Summary,SubTotal,Discount,Grand Total,Amount Paid,Balance Due,Payment Mode,Agent,Remarks
1002,23-02-2023,WALK-IN,ARUN SAYRE,,ANTERGAON,,,,6500,5200,1300,Credit / Udhari,,
1003,23-02-2023,WALK-IN,PRAKASH BUDHBAWARE,8262988399,ANTERGAON,,,,4000,2000,2000,Credit / Udhari,,
B-02,30-08-2024,WALK-IN,AMOL LENDE,9763990295,WARDHA,,,,13500,13500,0,Cash,,`,
    },
    receipts: {
      filename: 'sample_receipts_collections.csv',
      desc: 'Old Receipts & Cash Collections (Receipt No, Date, Customer Name, Amount Received, Against Bill No)',
      content: `Receipt No,Date,Card No,Customer Name,Ref Bill No,Payment Mode,Amount Received,Against Bill No,Remarks
SSE/RCPT/202302/0001,23-02-2023,,ARUN SAYRE (ANTERGAON),1002,Cash,5200,1002,Imported Sale Receipt against Bill 1002
SSE/SCHEME3/DEP/3011,05-09-2026,4850,,,,1000,,Scheme: Scheme3
SSE/RCPT/202609/3013,07-09-2026,1021,SURAJ GAUTAM MOON (Scheme1),,Cash,200,,Weekly Scheme Deposit (Scheme1)`,
    },
    purchases: {
      filename: 'sample_dealer_purchases.csv',
      desc: 'Dealer / Supplier Old Purchases (e.g. Manisha Enterprises)',
      content: `BillNo,Date,DealerName,Items,TotalAmount,PaidAmount,PaymentMode
PUR-7701,2026-08-10,Manisha Enterprises,Wires and modular accessories,95000,75000,Online
PUR-7702,2026-08-25,Manisha Enterprises,PVC pipes & conduits lot,50000,40000,Online`,
    },
  };

  // Download Sample CSV
  const handleDownloadSample = (type: ImportType) => {
    const item = sampleTemplates[type];
    const blob = new Blob([item.content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', item.filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Parse CSV
  const parseCSVContent = (content: string) => {
    setParseError('');
    setSuccessMessage('');
    if (!content.trim()) {
      setParsedRows([]);
      return;
    }

    try {
      const lines = content.trim().split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.length < 2) {
        setParseError('CSV file must contain a header row and at least 1 data row.');
        setParsedRows([]);
        return;
      }

      const rawHeaders = lines[0].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((h) =>
        h.trim().replace(/^["']|["']$/g, '')
      );

      const rows: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        const currentLine = lines[i];
        const values = currentLine.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((val) =>
          val.trim().replace(/^["']|["']$/g, '')
        );

        const hasContent = values.some((v) => v && v.length > 0);
        if (!hasContent) continue;

        const rowObj: Record<string, string> = {};
        rawHeaders.forEach((header, index) => {
          if (header) {
            rowObj[header] = values[index] !== undefined ? values[index] : '';
          }
        });

        rows.push(rowObj);
      }

      setParsedRows(rows);
    } catch (err: any) {
      setParseError(`Failed to parse CSV: ${err.message}`);
    }
  };

  // Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
      parseCSVContent(text);
    };
    reader.readAsText(file);
  };

  // Determine Scheme for Card Member
  const resolveCardScheme = (cardNum: number, rawSchemeText: string): { schemeId: CardSchemeId; schemeName: string } => {
    if (targetSchemeId !== 'auto') {
      const found = SCHEMES_CONFIG.find((s) => s.id === targetSchemeId);
      if (found) {
        return { schemeId: found.id as CardSchemeId, schemeName: found.name };
      }
    }

    const text = (rawSchemeText || '').toLowerCase();
    if (text.includes('scheme 1') || text.includes('scheme1') || text.includes('योजना 1') || text.includes('sch-1')) {
      return { schemeId: 'scheme1', schemeName: 'Scheme 1 (योजना 1)' };
    }
    if (text.includes('scheme 2') || text.includes('scheme2') || text.includes('योजना 2') || text.includes('sch-2')) {
      return { schemeId: 'scheme2', schemeName: 'Scheme 2 (योजना 2)' };
    }
    if (text.includes('scheme 3') || text.includes('scheme3') || text.includes('योजना 3') || text.includes('sch-3')) {
      return { schemeId: 'scheme3', schemeName: 'Scheme 3 (योजना 3)' };
    }
    if (text.includes('scheme 4') || text.includes('scheme4') || text.includes('योजना 4') || text.includes('sch-4')) {
      return { schemeId: 'scheme4', schemeName: 'Scheme 4 (योजना 4)' };
    }
    if (text.includes('scheme 5') || text.includes('scheme5') || text.includes('योजना 5') || text.includes('sch-5')) {
      return { schemeId: 'scheme5', schemeName: 'Scheme 5 (योजना 5)' };
    }
    if (text.includes('scheme 6') || text.includes('scheme6') || text.includes('योजना 6') || text.includes('sch-6')) {
      return { schemeId: 'scheme6', schemeName: 'Scheme 6 (योजना 6)' };
    }

    if (cardNum >= 4001 && cardNum <= 6000) {
      return { schemeId: 'scheme3', schemeName: 'Scheme 3 (योजना 3)' };
    } else if (cardNum >= 3001 && cardNum <= 3999) {
      return { schemeId: 'scheme2', schemeName: 'Scheme 2 (योजना 2)' };
    } else if (cardNum >= 6001 && cardNum <= 7999) {
      return { schemeId: 'scheme4', schemeName: 'Scheme 4 (योजना 4)' };
    } else if (cardNum >= 8001 && cardNum <= 9999) {
      return { schemeId: 'scheme5', schemeName: 'Scheme 5 (योजना 5)' };
    } else if (cardNum >= 10001 && cardNum <= 12000) {
      return { schemeId: 'scheme6', schemeName: 'Scheme 6 (योजना 6)' };
    }
    return { schemeId: 'scheme1', schemeName: 'Scheme 1 (योजना 1)' };
  };

  // Execute Import
  const handleCommitImport = () => {
    if (parsedRows.length === 0) return;

    try {
      if (activeImportType === 'cards') {
        const newCards: CardMember[] = [];
        const autoReceipts: CardTransaction[] = [];

        parsedRows.forEach((r, idx) => {
          const cardNumRaw = getField(r, ['CARD.NO', 'Card No', 'CardNumber', 'CardNo', 'CARD NO', 'CARD_NO']);
          const cardNum = parseNum(cardNumRaw, 1001);
          const customerName = getField(r, ['NAME', 'Customer Name', 'CustomerName', 'Name', 'MEMBER NAME'], `Member #${cardNum}`);
          const village = getField(r, ['VILLEGE', 'Village', 'City', 'Town', 'Address']);
          const phone = getField(r, ['MOBILE.NO', 'Mobile', 'Phone', 'CustomerPhone', 'MOBILE NO', 'Contact']);
          const sheetNo = getField(r, ['SHEET NO', 'SheetNo', 'SHEET_NO', 'Sheet']);
          const rawScheme = getField(r, ['Scheme', 'SchemeId', 'SCHEME', 'Scheme Name']);
          const dateRaw = getField(r, ['DATE', 'Date', 'JoiningDate', 'Joining Date']);
          const joiningDate = normalizeDate(dateRaw);

          const openingAmtRaw = getField(r, ['OPENING AMT', 'Saving Balance', 'OpeningAmt', 'Opening Balance', 'Balance', 'Total Deposited', 'TotalDeposited']);
          const openingAmt = parseNum(openingAmtRaw, 0);

          const { schemeId, schemeName } = resolveCardScheme(cardNum, rawScheme);

          const cardId = `cm-${schemeId}-${cardNum}`;

          const member: CardMember = {
            id: cardId,
            cardNumber: cardNum,
            schemeId,
            schemeName,
            customerName,
            phone: phone || '',
            village: village || undefined,
            sheetNo: sheetNo || undefined,
            openingAmt: openingAmt > 0 ? openingAmt : undefined,
            address: village ? `${village}, Wardha` : '',
            joiningDate,
            registrationFee: 50,
            registrationFeePaid: true,
            totalDeposited: openingAmt,
            totalRefunded: 0,
            netBalance: openingAmt,
            status: 'Active',
            notes: `Imported via CSV record${sheetNo ? ` • Sheet #${sheetNo}` : ''}${village ? ` • Village: ${village}` : ''}`,
          };

          newCards.push(member);

          if (openingAmt > 0) {
            autoReceipts.push({
              id: `rcpt-opn-${schemeId}-${cardNum}-${Date.now().toString().slice(-4)}-${idx}`,
              cardId,
              cardNumber: cardNum,
              schemeId,
              customerName,
              customerPhone: phone || undefined,
              receiptNo: `REC-OPN-${cardNum}`,
              date: joiningDate,
              type: 'WeeklyPayment',
              weekNumber: 1,
              amount: openingAmt,
              paymentMode: 'Cash',
              agentName: 'Opening Balance',
              remarks: `Initial/Opening Deposit of ₹${openingAmt} (Imported from records)`,
              balanceAfter: openingAmt,
              createdAt: new Date().toISOString(),
            });
          }
        });

        onImportCardMembers(newCards, autoReceipts);
        setSuccessMessage(
          `Successfully imported ${newCards.length} members into ${
            targetSchemeId !== 'auto' ? targetSchemeId.toUpperCase() : 'their Schemes'
          }! ${autoReceipts.length} Opening Deposits were also auto-credited to Passbooks & Collection Ledger.`
        );
      } else if (activeImportType === 'bills') {
        const newBills: TransactionEntry[] = parsedRows.map((r, idx) => {
          const invoiceNo = getField(r, ['Bill No', 'InvoiceNo', 'BillNo', 'Invoice No', 'Invoice', 'Bill_No'], `INV-${Date.now().toString().slice(-4)}-${idx + 1}`);
          const dateRaw = getField(r, ['Date', 'BillDate', 'DATE']);
          const date = normalizeDate(dateRaw);
          const customerName = getField(r, ['Customer Name', 'CustomerName', 'NAME', 'Name', 'Customer'], 'Walk-in Customer');
          const customerPhone = getField(r, ['Mobile', 'CustomerPhone', 'Phone', 'MOBILE.NO']);
          const village = getField(r, ['Village', 'VILLEGE', 'City', 'Town']);
          const itemDetails = getField(r, ['Items Summary', 'ItemDetails', 'Items', 'Description', 'Item'], 'Imported Sale Bill');
          
          const grandTotalRaw = getField(r, ['Grand Total', 'TotalAmount', 'Total Amount', 'Total', 'SubTotal']);
          const amountPaidRaw = getField(r, ['Amount Paid', 'PaidAmount', 'Paid Amount', 'Paid', 'PayingNow']);
          const balanceDueRaw = getField(r, ['Balance Due', 'DueAmount', 'Due Amount', 'Due', 'Balance']);
          const paymentModeRaw = getField(r, ['Payment Mode', 'PaymentMode', 'Mode']);

          const totalAmount = parseNum(grandTotalRaw, 0);
          const payingNow = parseNum(amountPaidRaw, 0);
          const dueAmount = parseNum(balanceDueRaw, Math.max(0, totalAmount - payingNow));

          const cardNumRaw = getField(r, ['Card No', 'CardNo', 'Card Number', 'CARD.NO']);
          const cardNum = cardNumRaw && cardNumRaw !== 'WALK-IN' ? parseInt(cardNumRaw.replace(/[^0-9]/g, '')) : undefined;

          return {
            id: `inv-imp-${Date.now()}-${idx}`,
            invoiceNo,
            date,
            customerName,
            customerPhone: customerPhone || undefined,
            cardNumber: cardNum && !isNaN(cardNum) ? cardNum : undefined,
            village: village || undefined,
            itemDetails,
            totalAmount,
            payingNow,
            dueAmount,
            paymentMode: paymentModeRaw.toLowerCase().includes('online') ? 'Online' : 'Cash',
            notes: `Imported Sale Bill • Total: ₹${totalAmount} • Paid: ₹${payingNow} • Due: ₹${dueAmount}${village ? ` • Village: ${village}` : ''}`,
            createdAt: new Date().toISOString(),
          };
        });

        onImportBills(newBills);
        setSuccessMessage(`Successfully imported ${newBills.length} old sales bills into Customer & Sales Ledger!`);
      } else if (activeImportType === 'receipts') {
        const newReceipts: CardTransaction[] = parsedRows.map((r, idx) => {
          const receiptNo = getField(r, ['Receipt No', 'ReceiptNo', 'Ref Bill No', 'Bill No'], `REC-${Date.now().toString().slice(-4)}-${idx + 1}`);
          const dateRaw = getField(r, ['Date', 'DATE']);
          const date = normalizeDate(dateRaw);
          const customerName = getField(r, ['Customer Name', 'CustomerName', 'NAME', 'Name'], 'Member');
          const cardNumRaw = getField(r, ['Card No', 'CARD.NO', 'CardNo', 'CardNumber']);
          const cardNum = parseNum(cardNumRaw, 1001);
          
          const amountRaw = getField(r, ['Amount Received', 'Amount', 'TotalReceived', 'AmountPaid', 'Total Amount']);
          const amount = parseNum(amountRaw, 0);

          const againstBill = getField(r, ['Against Bill No', 'Ref Bill No', 'AgainstBillNo', 'RefBillNo']);
          const remarks = getField(r, ['Remarks', 'Notes', 'Remarks / Note'], againstBill ? `Payment against Bill #${againstBill}` : 'Weekly collection');

          const { schemeId } = resolveCardScheme(cardNum, remarks);

          return {
            id: `rec-imp-${Date.now()}-${idx}`,
            cardId: `cm-${schemeId}-${cardNum}`,
            cardNumber: cardNum,
            schemeId,
            customerName,
            receiptNo,
            date,
            type: 'WeeklyPayment',
            weekNumber: 1,
            amount,
            paymentMode: 'Cash',
            remarks,
            balanceAfter: amount,
            createdAt: new Date().toISOString(),
          };
        });

        onImportReceipts(newReceipts);
        setSuccessMessage(`Successfully imported ${newReceipts.length} payment receipts into collections!`);
      } else if (activeImportType === 'purchases') {
        const newPurchases: PurchaseEntry[] = parsedRows.map((r, idx) => {
          const totalAmount = parseNum(getField(r, ['TotalAmount', 'Total Amount', 'Total', 'Grand Total']), 0);
          const paidAmount = parseNum(getField(r, ['PaidAmount', 'Paid Amount', 'Paid']), 0);
          const dealerName = getField(r, ['DealerName', 'Dealer Name', 'Supplier', 'Dealer'], 'Manisha Enterprises');
          return {
            id: `pur-imp-${Date.now()}-${idx}`,
            billNo: getField(r, ['BillNo', 'Bill No', 'InvoiceNo'], `PUR-IMP-${idx + 1}`),
            date: normalizeDate(getField(r, ['Date', 'DATE'])),
            supplierName: dealerName,
            items: getField(r, ['Items', 'ItemDetails', 'Description'], 'Stock Supply'),
            totalAmount,
            paidAmount,
            status: paidAmount >= totalAmount ? 'Paid' : paidAmount > 0 ? 'Partial' : 'Pending',
            paymentMode: 'Online',
          };
        });

        const dealerMap = new Map<string, Dealer>();
        newPurchases.forEach((p) => {
          const name = p.supplierName.trim();
          if (!dealerMap.has(name)) {
            dealerMap.set(name, {
              id: `dlr-imp-${Date.now()}-${Math.random().toString().slice(-4)}`,
              name,
              phone: '',
              totalPurchases: p.totalAmount,
              totalPaid: p.paidAmount,
              balanceDue: Math.max(0, p.totalAmount - p.paidAmount),
              lastTransactionDate: p.date,
            });
          } else {
            const existing = dealerMap.get(name)!;
            existing.totalPurchases += p.totalAmount;
            existing.totalPaid += p.paidAmount;
            existing.balanceDue = Math.max(0, existing.totalPurchases - existing.totalPaid);
            if (p.date > (existing.lastTransactionDate || '')) existing.lastTransactionDate = p.date;
          }
        });

        onImportPurchases(newPurchases, Array.from(dealerMap.values()));
        setSuccessMessage(`Successfully imported ${newPurchases.length} dealer purchases & updated dealer ledgers!`);
      }

      setCsvText('');
      setParsedRows([]);
    } catch (err: any) {
      setParseError(`Error importing records: ${err.message}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              CSV Data Import (पुरानी फाइल्स व हिसाब अपलोड)
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Smart Auto-Match
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Scheme 1, 2, 3 कार्ड मेंबर्स, बिल व रसीदों का डेटा बिना किसी स्पेलिंग मिसमैच के 100% सही लोड करें।
          </p>
        </div>
      </div>

      {/* Success Banner */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage('')}
            className="text-xs text-emerald-700 underline font-bold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Import Type Selector Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            type: 'cards' as ImportType,
            label: 'Card Members (योजना ग्राहक)',
            desc: 'Scheme 1, 2, 3 ग्राहक सूची',
            icon: CreditCard,
            color: 'blue',
          },
          {
            type: 'bills' as ImportType,
            label: 'Sales Bills (दुकान बिल/बिक्री)',
            desc: 'Invoice, Total, Paid, Due',
            icon: FileText,
            color: 'amber',
          },
          {
            type: 'receipts' as ImportType,
            label: 'Receipts / Collections (जमा रसीदें)',
            desc: 'Amount Received & Against Bill',
            icon: Receipt,
            color: 'emerald',
          },
          {
            type: 'purchases' as ImportType,
            label: 'Dealer Purchases (सप्लायर खरीदी)',
            desc: 'Manisha Ent & Distributor bills',
            icon: Building2,
            color: 'purple',
          },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeImportType === item.type;
          return (
            <button
              key={item.type}
              onClick={() => {
                setActiveImportType(item.type);
                setParsedRows([]);
                setParseError('');
                setSuccessMessage('');
              }}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                isActive
                  ? 'bg-slate-900 border-slate-900 text-white shadow-md ring-2 ring-slate-900/20'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                {isActive && <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>}
              </div>
              <div className="font-bold text-sm leading-snug">{item.label}</div>
              <div className={`text-xs mt-0.5 ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>
                {item.desc}
              </div>
            </button>
          );
        })}
      </div>

      {/* Specific Scheme Selector for Member Import */}
      {activeImportType === 'cards' && (
        <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-700" />
                <h3 className="font-bold text-indigo-950 text-sm md:text-base">
                  Target Scheme Selection (यह फाइल किस योजना की है?)
                </h3>
              </div>
              <p className="text-xs text-indigo-800 mt-0.5">
                आप जिस योजना को चुनेंगे, फाइल के सभी कार्ड सीधे उसी योजना में सही रूप से जमा होंगे।
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={targetSchemeId}
                onChange={(e) => setTargetSchemeId(e.target.value)}
                className="px-4 py-2 bg-white border border-indigo-300 rounded-xl font-bold text-sm text-indigo-950 shadow-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="auto">✨ Auto-Detect (कार्ड नं. से अपने आप पहचानें)</option>
                <option value="scheme1">Scheme 1 (योजना 1 • कार्ड 1001-2999)</option>
                <option value="scheme2">Scheme 2 (योजना 2 • कार्ड 3001-3999)</option>
                <option value="scheme3">Scheme 3 (योजना 3 • कार्ड 1001-6000)</option>
                <option value="scheme4">Scheme 4 (योजना 4 • कार्ड 6001-7999)</option>
                <option value="scheme5">Scheme 5 (योजना 5 • कार्ड 8001-9999)</option>
                <option value="scheme6">Scheme 6 (योजना 6 • कार्ड 10001-12000)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Upload Box */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-slate-900 text-lg">
              {activeImportType === 'cards' && 'Upload Card Scheme Members CSV'}
              {activeImportType === 'bills' && 'Upload Sales & Invoices CSV'}
              {activeImportType === 'receipts' && 'Upload Receipts & Collections CSV'}
              {activeImportType === 'purchases' && 'Upload Purchases CSV'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Spelling tolerant: Supports <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">NAME</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">CARD.NO</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">VILLEGE</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">OPENING AMT</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">Saving Balance</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">Grand Total</code> etc.
            </p>
          </div>
          <button
            onClick={() => handleDownloadSample(activeImportType)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer self-start sm:self-auto"
          >
            <Download className="w-4 h-4 text-slate-600" />
            Download Sample Format
          </button>
        </div>

        {/* Drag & Drop Area */}
        <div className="relative border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl p-8 text-center bg-slate-50/50 hover:bg-blue-50/20 transition group">
          <input
            type="file"
            accept=".csv,text/csv,text/plain"
            onChange={handleFileUpload}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
          />
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">
                Click to browse or drag & drop CSV file here
              </p>
              <p className="text-xs text-slate-400 mt-1">
                CSV (.csv) or plain text format directly exported from Excel / Google Sheets
              </p>
            </div>
          </div>
        </div>

        {/* Or Paste Raw CSV Text */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Or Paste CSV Content Directly (या टेक्स्ट कॉपी-पेस्ट करें):
          </label>
          <textarea
            rows={4}
            value={csvText}
            onChange={(e) => {
              setCsvText(e.target.value);
              parseCSVContent(e.target.value);
            }}
            placeholder="NAME,CARD.NO,VILLEGE,MOBILE.NO,OPENING AMT,DATE,SHEET NO&#10;RANJANA SHAMBHARKAR,4107,BORI,,600,05-07-2025,2793"
            className="w-full font-mono text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {parseError && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{parseError}</span>
          </div>
        )}
      </div>

      {/* Preview Section */}
      {parsedRows.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-lg">
                  Preview Ready ({parsedRows.length} Records Found)
                </span>
                <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 font-bold text-xs rounded-full">
                  Verified Clean
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Review below how columns and amounts have been matched before saving into system.
              </p>
            </div>

            <button
              onClick={handleCommitImport}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5" />
              Confirm & Save {parsedRows.length} Records Now
            </button>
          </div>

          {/* Table Preview */}
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">#</th>
                  {activeImportType === 'cards' && (
                    <>
                      <th className="p-3">Card No</th>
                      <th className="p-3">Customer Name</th>
                      <th className="p-3">Village</th>
                      <th className="p-3">Opening Amt</th>
                      <th className="p-3">Target Scheme</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Sheet No</th>
                    </>
                  )}
                  {activeImportType === 'bills' && (
                    <>
                      <th className="p-3">Bill No</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Customer Name</th>
                      <th className="p-3">Village</th>
                      <th className="p-3">Grand Total</th>
                      <th className="p-3">Amount Paid</th>
                      <th className="p-3">Balance Due</th>
                    </>
                  )}
                  {activeImportType === 'receipts' && (
                    <>
                      <th className="p-3">Receipt No</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Customer / Card</th>
                      <th className="p-3">Amount Received</th>
                      <th className="p-3">Against Bill</th>
                      <th className="p-3">Remarks</th>
                    </>
                  )}
                  {activeImportType === 'purchases' && (
                    <>
                      <th className="p-3">Bill No</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Dealer Name</th>
                      <th className="p-3">Items</th>
                      <th className="p-3">Total Amount</th>
                      <th className="p-3">Paid Amount</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {parsedRows.slice(0, 10).map((row, idx) => {
                  if (activeImportType === 'cards') {
                    const cardNum = parseNum(getField(row, ['CARD.NO', 'Card No', 'CardNumber', 'CardNo', 'CARD NO']));
                    const name = getField(row, ['NAME', 'Customer Name', 'CustomerName', 'Name']);
                    const village = getField(row, ['VILLEGE', 'Village', 'City', 'Address']);
                    const opnAmt = parseNum(getField(row, ['OPENING AMT', 'Saving Balance', 'OpeningAmt', 'Balance']));
                    const date = normalizeDate(getField(row, ['DATE', 'Date']));
                    const sheet = getField(row, ['SHEET NO', 'SheetNo']);
                    const rawScheme = getField(row, ['Scheme', 'SchemeId']);
                    const scheme = resolveCardScheme(cardNum, rawScheme);

                    return (
                      <tr key={idx} className="hover:bg-slate-50/80">
                        <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                        <td className="p-3 font-bold text-indigo-700">#{cardNum}</td>
                        <td className="p-3 font-bold text-slate-900">{name}</td>
                        <td className="p-3 text-slate-600">{village || '—'}</td>
                        <td className="p-3 font-bold text-emerald-700">₹{opnAmt.toLocaleString('en-IN')}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-bold text-[10px]">
                            {scheme.schemeName}
                          </span>
                        </td>
                        <td className="p-3 text-slate-500">{date}</td>
                        <td className="p-3 font-mono text-slate-500">{sheet || '—'}</td>
                      </tr>
                    );
                  }

                  if (activeImportType === 'bills') {
                    const billNo = getField(row, ['Bill No', 'InvoiceNo', 'BillNo', 'Invoice No']);
                    const date = normalizeDate(getField(row, ['Date', 'BillDate']));
                    const name = getField(row, ['Customer Name', 'CustomerName', 'NAME', 'Name']);
                    const village = getField(row, ['Village', 'VILLEGE', 'City']);
                    const grandTotal = parseNum(getField(row, ['Grand Total', 'TotalAmount', 'Total Amount', 'Total']));
                    const amountPaid = parseNum(getField(row, ['Amount Paid', 'PaidAmount', 'Paid Amount', 'Paid']));
                    const balanceDue = parseNum(getField(row, ['Balance Due', 'DueAmount', 'Due Amount', 'Due']));

                    return (
                      <tr key={idx} className="hover:bg-slate-50/80">
                        <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                        <td className="p-3 font-bold text-amber-700">{billNo}</td>
                        <td className="p-3 text-slate-500">{date}</td>
                        <td className="p-3 font-bold text-slate-900">{name}</td>
                        <td className="p-3 text-slate-600">{village || '—'}</td>
                        <td className="p-3 font-bold text-slate-900">₹{grandTotal.toLocaleString('en-IN')}</td>
                        <td className="p-3 font-bold text-emerald-700">₹{amountPaid.toLocaleString('en-IN')}</td>
                        <td className="p-3 font-bold text-rose-600">₹{balanceDue.toLocaleString('en-IN')}</td>
                      </tr>
                    );
                  }

                  if (activeImportType === 'receipts') {
                    const receiptNo = getField(row, ['Receipt No', 'ReceiptNo', 'Ref Bill No']);
                    const date = normalizeDate(getField(row, ['Date']));
                    const name = getField(row, ['Customer Name', 'CustomerName', 'NAME', 'Name']);
                    const cardNo = getField(row, ['Card No', 'CARD.NO']);
                    const amt = parseNum(getField(row, ['Amount Received', 'Amount', 'TotalReceived']));
                    const againstBill = getField(row, ['Against Bill No', 'Ref Bill No']);
                    const remarks = getField(row, ['Remarks', 'Notes']);

                    return (
                      <tr key={idx} className="hover:bg-slate-50/80">
                        <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                        <td className="p-3 font-bold text-blue-700">{receiptNo}</td>
                        <td className="p-3 text-slate-500">{date}</td>
                        <td className="p-3 font-bold text-slate-900">
                          {name} {cardNo ? `(#${cardNo})` : ''}
                        </td>
                        <td className="p-3 font-bold text-emerald-700">₹{amt.toLocaleString('en-IN')}</td>
                        <td className="p-3 font-mono text-amber-700">{againstBill || '—'}</td>
                        <td className="p-3 text-slate-500 truncate max-w-xs">{remarks || '—'}</td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                      <td className="p-3 font-bold text-slate-900">{getField(row, ['BillNo', 'Bill No'])}</td>
                      <td className="p-3 text-slate-500">{normalizeDate(getField(row, ['Date']))}</td>
                      <td className="p-3 font-bold text-slate-900">{getField(row, ['DealerName', 'Dealer Name'])}</td>
                      <td className="p-3 text-slate-500">{getField(row, ['Items'])}</td>
                      <td className="p-3 font-bold text-slate-900">
                        ₹{parseNum(getField(row, ['TotalAmount', 'Total Amount'])).toLocaleString('en-IN')}
                      </td>
                      <td className="p-3 font-bold text-emerald-700">
                        ₹{parseNum(getField(row, ['PaidAmount', 'Paid Amount'])).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {parsedRows.length > 10 && (
            <p className="text-xs text-center text-slate-400 italic">
              Showing first 10 of {parsedRows.length} total rows in file. All {parsedRows.length} will be imported on confirm.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
