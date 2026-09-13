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
  Trash2,
  RefreshCw,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Users,
  ShoppingCart,
  Eye,
  Package,
  Tag
} from 'lucide-react';
import {
  CardMember,
  CardSchemeId,
  CardTransaction,
  Customer,
  Dealer,
  PurchaseEntry,
  StockItem,
  TransactionEntry
} from '../types';
import { SCHEMES_CONFIG } from '../utils/storage';
import { processUniversalCsv, UniversalImportResult } from '../utils/universalImporter';

interface CsvImportViewProps {
  onImportBills: (bills: TransactionEntry[]) => void;
  onImportReceipts: (receipts: CardTransaction[]) => void;
  onImportCardMembers: (members: CardMember[], autoReceipts?: CardTransaction[]) => void;
  onImportPurchases: (purchases: PurchaseEntry[], dealers: Dealer[]) => void;
  onUniversalImport?: (data: {
    bills: TransactionEntry[];
    salesReceipts?: TransactionEntry[];
    cardMembers: CardMember[];
    cardTransactions: CardTransaction[];
    customers: Customer[];
    stockItems?: StockItem[];
  }) => void;
  onClearZeroBills?: () => void;
  onFullResetData?: () => void;
  existingCardMembers?: CardMember[];
  existingDealers?: Dealer[];
  existingBills?: TransactionEntry[];
  existingReceipts?: CardTransaction[];
  existingCustomers?: Customer[];
  existingPurchases?: PurchaseEntry[];
  existingStock?: StockItem[];
  onSwitchTab?: (tab: any) => void;
}

type ImportTab = 'universal' | 'manual';
type ImportType = 'cards' | 'bills' | 'receipts' | 'purchases';

const normKey = (k: any): string => {
  if (!k) return '';
  return String(k).toLowerCase().replace(/[^a-z0-9]/g, '');
};

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

const parseNum = (val: any, defaultVal = 0): number => {
  if (val === undefined || val === null || val === '') return defaultVal;
  const cleaned = String(val).replace(/[^0-9.-]/g, '');
  const n = parseFloat(cleaned);
  return isNaN(n) ? defaultVal : n;
};

const normalizeDate = (dStr: string): string => {
  if (!dStr) return new Date().toISOString().split('T')[0];
  const clean = dStr.trim().replace(/\//g, '-');
  const parts = clean.split('-');
  if (parts.length === 3) {
    const p1 = parts[0].trim();
    const p2 = parts[1].trim();
    const p3 = parts[2].trim();
    if (p1.length <= 2 && p3.length === 4) {
      return `${p3}-${p2.padStart(2, '0')}-${p1.padStart(2, '0')}`;
    }
    if (p1.length <= 2 && p3.length === 2) {
      return `20${p3}-${p2.padStart(2, '0')}-${p1.padStart(2, '0')}`;
    }
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
  onUniversalImport,
  onClearZeroBills,
  onFullResetData,
  existingCardMembers = [],
  existingDealers = [],
  existingBills = [],
  existingReceipts = [],
  existingCustomers = [],
  existingPurchases = [],
  existingStock = [],
  onSwitchTab,
}) => {
  const [importMode, setImportMode] = useState<ImportTab>('universal');
  const [activeImportType, setActiveImportType] = useState<ImportType>('cards');
  const [targetSchemeId, setTargetSchemeId] = useState<string>('auto');
  const [csvText, setCsvText] = useState('');
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [universalResult, setUniversalResult] = useState<UniversalImportResult | null>(null);
  const [universalActiveTab, setUniversalActiveTab] = useState<'products' | 'bills' | 'receipts' | 'cards' | 'customers'>('products');
  const [parseError, setParseError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditFilter, setAuditFilter] = useState<string>('all');
  const [lastImportedSummary, setLastImportedSummary] = useState<{
    date: string;
    billsCount: number;
    receiptsCount: number;
    cardMembersCount: number;
    customersCount: number;
    purchasesCount: number;
    productsCount?: number;
    sampleRows: Array<{ type: string; title: string; ref?: string; amount?: number }>;
  } | null>(null);

  const handleProcessCsvString = (text: string) => {
    setParseError('');
    setSuccessMessage('');
    if (!text.trim()) {
      setParsedRows([]);
      setUniversalResult(null);
      return;
    }

    try {
      // 1. Run Universal Smart Importer & Cleaner
      const uniRes = processUniversalCsv(text);
      setUniversalResult(uniRes);

      // 2. Also populate standard row previews
      parseCSVContent(text);
    } catch (err: any) {
      setParseError(`CSV प्रक्रिया करताना त्रुटी आली: ${err.message}`);
    }
  };

  const parseCSVContent = (content: string) => {
    try {
      const lines = content.trim().split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.length < 2) {
        setParseError('CSV फाईलमध्ये किमान १ हेडर आणि १ डेटा ओळ असणे आवश्यक आहे.');
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

        if (!values.some((v) => v && v.length > 0)) continue;

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
      setParseError(`CSV Parsing Error: ${err.message}`);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
      handleProcessCsvString(text);
    };
    reader.readAsText(file);
  };

  const resolveCardScheme = (cardNum: number, rawSchemeText: string): { schemeId: CardSchemeId; schemeName: string } => {
    if (targetSchemeId !== 'auto') {
      const found = SCHEMES_CONFIG.find((s) => s.id === targetSchemeId);
      if (found) return { schemeId: found.id as CardSchemeId, schemeName: found.name };
    }

    const text = (rawSchemeText || '').toLowerCase();
    if (text.includes('scheme 1') || text.includes('scheme1')) return { schemeId: 'scheme1', schemeName: 'Scheme 1 (योजना 1)' };
    if (text.includes('scheme 2') || text.includes('scheme2')) return { schemeId: 'scheme2', schemeName: 'Scheme 2 (योजना 2)' };
    if (text.includes('scheme 3') || text.includes('scheme3')) return { schemeId: 'scheme3', schemeName: 'Scheme 3 (योजना 3)' };

    if (cardNum >= 4001 && cardNum <= 6000) return { schemeId: 'scheme3', schemeName: 'Scheme 3 (योजना 3)' };
    if (cardNum >= 3001 && cardNum <= 3999) return { schemeId: 'scheme2', schemeName: 'Scheme 2 (योजना 2)' };
    return { schemeId: 'scheme1', schemeName: 'Scheme 1 (योजना 1)' };
  };

  const handleCommitUniversal = () => {
    if (!universalResult) return;

    const totalReceiptsCount = (universalResult.salesReceipts?.length || 0) + universalResult.cardTransactions.length;

    // Collect sample rows for verification
    const sampleRows: Array<{ type: string; title: string; ref?: string; amount?: number }> = [];
    universalResult.bills.slice(0, 8).forEach(b => sampleRows.push({ type: 'विक्री बिल', title: `${b.customerName}${b.stockItemName ? ` (${b.stockItemName})` : ''}`, ref: b.invoiceNo, amount: b.totalAmount }));
    if (universalResult.stockItems && universalResult.stockItems.length > 0) {
      universalResult.stockItems.slice(0, 6).forEach(s => sampleRows.push({ type: 'प्रॉडक्ट / वस्तू', title: s.name, ref: s.code, amount: s.sellingPrice }));
    }
    universalResult.cardTransactions.slice(0, 8).forEach(c => sampleRows.push({ type: 'योजना पावती', title: `कार्ड #${c.cardNumber} (${c.customerName})`, ref: c.receiptNo, amount: c.amount }));
    if (universalResult.salesReceipts) {
      universalResult.salesReceipts.slice(0, 8).forEach(r => sampleRows.push({ type: 'उधारी जमा', title: r.customerName, ref: r.invoiceNo, amount: r.payingNow }));
    }
    universalResult.cardMembers.slice(0, 8).forEach(m => sampleRows.push({ type: 'कार्ड मेंबर', title: `${m.customerName} (#${m.cardNumber})`, ref: m.schemeName, amount: m.totalDeposited }));
    universalResult.customers.slice(0, 8).forEach(cust => sampleRows.push({ type: 'ग्राहक खाते', title: cust.name, ref: cust.phone, amount: cust.balanceDue }));

    if (onUniversalImport) {
      onUniversalImport({
        bills: universalResult.bills,
        salesReceipts: universalResult.salesReceipts || [],
        cardMembers: universalResult.cardMembers,
        cardTransactions: universalResult.cardTransactions,
        customers: universalResult.customers,
        stockItems: universalResult.stockItems || [],
      });
    } else {
      if (universalResult.bills.length > 0) onImportBills(universalResult.bills);
      if (universalResult.salesReceipts && universalResult.salesReceipts.length > 0) onImportBills(universalResult.salesReceipts);
      if (universalResult.cardMembers.length > 0) onImportCardMembers(universalResult.cardMembers, universalResult.cardTransactions);
      else if (universalResult.cardTransactions.length > 0) onImportReceipts(universalResult.cardTransactions);
    }

    const prodCount = universalResult.stockItems?.length || 0;

    setLastImportedSummary({
      date: new Date().toLocaleTimeString('mr-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      billsCount: universalResult.bills.length,
      receiptsCount: totalReceiptsCount,
      cardMembersCount: universalResult.cardMembers.length,
      customersCount: universalResult.customers.length,
      purchasesCount: 0,
      productsCount: prodCount,
      sampleRows,
    });

    setSuccessMessage(
      `सफलतापूर्वक सेव्ह झाले! ${universalResult.bills.length} विक्री बिले, ${prodCount} प्रॉडक्ट्स/वस्तू, ${totalReceiptsCount} जमा पावत्या, ${universalResult.cardMembers.length} कार्ड मेंबर्स आणि ${universalResult.customers.length} ग्राहक खाती सिस्टीममध्ये सुरक्षित सेव्ह झाली आहेत!`
    );
    setUniversalResult(null);
    setCsvText('');
    setParsedRows([]);
  };

  const handleCommitManual = () => {
    if (parsedRows.length === 0) return;
    try {
      if (activeImportType === 'cards') {
        const newCards: CardMember[] = [];
        const autoReceipts: CardTransaction[] = [];

        parsedRows.forEach((r, idx) => {
          const cardNum = parseNum(getField(r, ['CARD.NO', 'Card No', 'CardNumber', 'CardNo']), 1001);
          const customerName = getField(r, ['NAME', 'Customer Name', 'CustomerName', 'Name'], `Member #${cardNum}`);
          const village = getField(r, ['VILLEGE', 'Village', 'City', 'Address']);
          const phone = getField(r, ['MOBILE.NO', 'Mobile', 'Phone', 'CustomerPhone']);
          const sheetNo = getField(r, ['SHEET NO', 'SheetNo']);
          const dateRaw = getField(r, ['DATE', 'Date']);
          const joiningDate = normalizeDate(dateRaw);
          const openingAmt = parseNum(getField(r, ['OPENING AMT', 'Saving Balance', 'OpeningAmt', 'Balance']), 0);

          const { schemeId, schemeName } = resolveCardScheme(cardNum, getField(r, ['Scheme', 'SchemeId']));
          const cardId = `cm-${schemeId}-${cardNum}`;

          newCards.push({
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
            notes: `Imported via CSV record${sheetNo ? ` • Sheet #${sheetNo}` : ''}`,
          });

          if (openingAmt > 0) {
            autoReceipts.push({
              id: `rcpt-opn-${schemeId}-${cardNum}-${idx}`,
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
              remarks: `Initial/Opening Deposit of ₹${openingAmt}`,
              balanceAfter: openingAmt,
              createdAt: new Date().toISOString(),
            });
          }
        });

        onImportCardMembers(newCards, autoReceipts);
        setSuccessMessage(`सफलता: ${newCards.length} कार्ड मेंबर्स लोड झाले आणि ₹ जमा पासबुकमध्ये क्रेडिट झाले!`);
      } else if (activeImportType === 'bills') {
        const newBills: TransactionEntry[] = parsedRows.map((r, idx) => {
          const invoiceNo = getField(r, ['Bill No', 'InvoiceNo', 'BillNo', 'Bill_No', 'Bill', 'INV NO'], `INV-${Date.now().toString().slice(-4)}-${idx + 1}`);
          const date = normalizeDate(getField(r, ['Date', 'BillDate', 'Bill Date', 'DATE']));
          const customerName = getField(r, ['Customer Name', 'NAME', 'Name', 'CustomerName', 'Customer'], 'Customer');
          const mobile = getField(r, ['Mobile', 'MOBILE.NO', 'Mobile No', 'Phone', 'Contact']);
          const village = getField(r, ['Village', 'VILLEGE', 'Town', 'City', 'Address']);

          let totalAmount = parseNum(getField(r, ['Grand Total', 'TotalAmount', 'Total', 'SubTotal', 'Sub Total', 'Bill Amount', 'GRAND TOTAL']), 0);
          const payingNow = parseNum(getField(r, ['Amount Paid', 'PaidAmount', 'Paid', 'Cash Paid', 'AMOUNT PAID']), 0);
          const dueAmount = parseNum(getField(r, ['Balance Due', 'DueAmount', 'Due', 'BALANCE DUE', 'Balance']), 0);

          if (totalAmount === 0 && (payingNow > 0 || dueAmount > 0)) {
            totalAmount = payingNow + dueAmount;
          }

          const rawProduct = getField(r, ['Product', 'Product Name', 'ProductName', 'Item', 'Item Name', 'ItemName', 'Particulars', 'Description', 'Goods', 'Vastu', 'Sahitya']);
          const rawQty = parseNum(getField(r, ['Quantity', 'Qty', 'Pieces', 'Nos', 'Count', 'Nag']), 1);
          const rawRate = parseNum(getField(r, ['Rate', 'Price', 'UnitPrice', 'Unit Price', 'MRP', 'Bhav', 'Dar']), 0);
          const rawCat = getField(r, ['Category', 'Type', 'Group', 'Class', 'Vibhag']);

          const itemsSummary = rawProduct || getField(r, ['Items Summary', 'ItemDetails', 'Items', 'Particulars'], 'Sales Invoice');
          const remarks = getField(r, ['Remarks', 'Agent', 'Notes']);

          return {
            id: `inv-imp-${Date.now()}-${idx}`,
            invoiceNo,
            date,
            customerName,
            customerPhone: mobile,
            village: village || undefined,
            stockItemName: rawProduct || undefined,
            quantity: rawQty > 0 ? rawQty : 1,
            unitPrice: rawRate > 0 ? rawRate : (totalAmount > 0 && rawQty > 0 ? Math.round(totalAmount / rawQty) : undefined),
            category: rawCat || undefined,
            itemDetails: itemsSummary + (rawQty > 1 ? ` (${rawQty} नग)` : '') + (village ? ` (${village})` : ''),
            totalAmount,
            payingNow,
            dueAmount: dueAmount > 0 ? dueAmount : Math.max(0, totalAmount - payingNow),
            paymentMode: getField(r, ['Payment Mode', 'PaymentMode', 'Mode'], 'Cash'),
            notes: remarks ? `Remarks: ${remarks}` : `Bill: Total ₹${totalAmount}, Paid ₹${payingNow}, Due ₹${dueAmount}${rawProduct ? ` | वस्तू: ${rawProduct}` : ''}`,
            createdAt: new Date().toISOString(),
          };
        });

        onImportBills(newBills);
        setSuccessMessage(`सफलता: ${newBills.length} विक्री बिल लोड झाले आणि All Entries अपडेट झाली!`);
      } else if (activeImportType === 'receipts') {
        const schemeReceipts: CardTransaction[] = [];
        const customerReceiptEntries: TransactionEntry[] = [];

        parsedRows.forEach((r, idx) => {
          const receiptNo = getField(r, ['Receipt No', 'ReceiptNo', 'VoucherNo'], `REC-${Date.now().toString().slice(-4)}-${idx + 1}`);
          const date = normalizeDate(getField(r, ['Date', 'Receipt Date', 'DATE']));
          const customerName = getField(r, ['Customer Name', 'NAME', 'Name', 'Customer'], 'Customer');
          const rawCardNo = getField(r, ['Card No', 'CARD.NO', 'CardNumber']);
          const cardNum = parseNum(rawCardNo, 0);
          const amount = parseNum(getField(r, ['Amount Received', 'Amount', 'AMOUNT RECEIVED', 'Total Received']), 0);
          const againstBill = getField(r, ['Against Bill No', 'Ref Bill No', 'Bill No', 'AgainstBillNo']);
          const remarks = getField(r, ['Remarks', 'Notes', 'REMARKS']);
          const rawMode = getField(r, ['Payment Mode', 'Mode', 'PAYMENT MODE'], 'Cash');
          const paymentMode: 'Cash' | 'Online' =
            rawMode.toLowerCase().includes('online') || rawMode.toLowerCase().includes('upi')
              ? 'Online'
              : 'Cash';

          // If card number is provided AND not against a sales bill
          if (cardNum > 0 && !againstBill) {
            const { schemeId } = resolveCardScheme(cardNum, remarks);
            schemeReceipts.push({
              id: `rec-imp-${Date.now()}-${idx}`,
              cardId: `cm-${schemeId}-${cardNum}`,
              cardNumber: cardNum,
              schemeId,
              customerName,
              receiptNo,
              date,
              type: 'WeeklyPayment',
              amount,
              paymentMode,
              remarks: remarks || `Scheme Payment Receipt: ${receiptNo}`,
              balanceAfter: amount,
              createdAt: new Date().toISOString(),
            });
          } else {
            // Customer credit recovery / udhari settlement receipt against bill
            customerReceiptEntries.push({
              id: `rcpt-entry-${Date.now()}-${idx}`,
              invoiceNo: receiptNo,
              date,
              customerName,
              itemDetails: againstBill
                ? `उधारी जमा (पावती #${receiptNo} - बिल #${againstBill})`
                : `उधारी जमा पावती #${receiptNo} (${remarks || paymentMode})`,
              totalAmount: 0,
              payingNow: amount,
              dueAmount: 0,
              paymentMode,
              refBillNo: againstBill || undefined,
              againstBillNo: againstBill || undefined,
              entryType: 'Receipt',
              notes: remarks
                ? `पावती: ${receiptNo} | संदर्भ बिल: ${againstBill || 'Direct'} | ${remarks}`
                : `पावती: ${receiptNo} | संदर्भ बिल: ${againstBill || 'Direct'}`,
              createdAt: new Date().toISOString(),
            });
          }
        });

        if (schemeReceipts.length > 0) {
          onImportReceipts(schemeReceipts);
        }
        if (customerReceiptEntries.length > 0) {
          onImportBills(customerReceiptEntries);
        }

        setSuccessMessage(
          `सफलता: ${customerReceiptEntries.length} ग्राहक उधारी जमा पावत्या (Sales Receipts) आणि ${schemeReceipts.length} कार्ड योजना पावत्या योग्य खात्यात जोडल्या गेल्या!`
        );
      }
      setCsvText('');
      setParsedRows([]);
    } catch (err: any) {
      setParseError(`Error importing: ${err.message}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header & Emergency Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Database className="w-6 h-6 text-indigo-600" />
            <span>CSV डेटा इम्पोर्ट & व्यवस्थापन</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            फायली थेट अपलोड करा, डेटाची शुद्धता तपासा आणि सिस्टीममधील सर्व रेकॉर्ड्स मास्टर सर्चमध्ये पाहा.
          </p>
        </div>

        {/* Emergency Cleanup & Reset Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {onClearZeroBills && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('तुम्हाला सर्व ₹0 वाले चुकीचे इम्पोर्ट झालेले बिल काढून टाकायचे आहेत का?')) {
                  onClearZeroBills();
                  setSuccessMessage('सर्व ₹0 चे चुकीचे बिल यशस्वीपणे काढून टाकले आहेत!');
                }
              }}
              className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
            >
              <Trash2 className="w-3.5 h-3.5 text-amber-600" />
              <span>₹0 चे बिल साफ़ करा</span>
            </button>
          )}

          {onFullResetData && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('सावधान: तुम्हाला सर्व डेटा (बिल, कार्ड्स, ग्राहक) रीसेट करून सुरुवातीपासून नवीन डेटा अपलोड करायचा आहे का?')) {
                  onFullResetData();
                  setSuccessMessage('सर्व डेटा रीसेट झाला आहे! आता तुम्ही ताज्या फायली नव्याने अपलोड करू शकता.');
                  setLastImportedSummary(null);
                }
              }}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>डेटा रीसेट (Start Clean)</span>
            </button>
          )}
        </div>
      </div>

      {/* Live System Imported Database Status Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-900 via-slate-900 to-slate-950 text-white border border-indigo-700/40 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>सिस्टीममध्ये उपलब्ध असलेला सध्याचा डेटा</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold border border-emerald-500/30">
                  {existingBills.length + existingReceipts.length + existingCardMembers.length + existingCustomers.length + existingPurchases.length} एकूण नोंदी
                </span>
              </h2>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                खालील सर्व डेटाबेस सिस्टीममध्ये सुरक्षित साठवलेला असून मास्टर सर्चमध्ये शोधण्यासाठी सज्ज आहे.
              </p>
            </div>
          </div>

          {onSwitchTab && (
            <button
              type="button"
              onClick={() => onSwitchTab('uploaded-data')}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition flex items-center gap-2 cursor-pointer shadow-sm self-start sm:self-auto shrink-0"
            >
              <Database className="w-4 h-4" />
              <span>🔍 मास्टर सर्च उघडा (सर्व डेटा शोधा) ➜</span>
            </button>
          )}
        </div>

        {/* 5 Data Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 pt-1">
          <div
            onClick={() => onSwitchTab && onSwitchTab('uploaded-data')}
            className="p-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 transition cursor-pointer"
          >
            <div className="flex items-center justify-between text-xs text-indigo-200 font-semibold">
              <span>विक्री बिले</span>
              <FileText className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="text-xl font-black text-white mt-1 font-mono">
              {existingBills.length.toLocaleString()}
            </div>
            <span className="text-[10px] text-indigo-300">Invoices</span>
          </div>

          <div
            onClick={() => onSwitchTab && onSwitchTab('uploaded-data')}
            className="p-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 transition cursor-pointer"
          >
            <div className="flex items-center justify-between text-xs text-purple-200 font-semibold">
              <span>जमा पावत्या</span>
              <Receipt className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-xl font-black text-white mt-1 font-mono">
              {existingReceipts.length.toLocaleString()}
            </div>
            <span className="text-[10px] text-purple-300">Receipts</span>
          </div>

          <div
            onClick={() => onSwitchTab && onSwitchTab('uploaded-data')}
            className="p-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 transition cursor-pointer"
          >
            <div className="flex items-center justify-between text-xs text-amber-200 font-semibold">
              <span>कार्ड सभासद</span>
              <CreditCard className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl font-black text-white mt-1 font-mono">
              {existingCardMembers.length.toLocaleString()}
            </div>
            <span className="text-[10px] text-amber-300">Scheme Cards</span>
          </div>

          <div
            onClick={() => onSwitchTab && onSwitchTab('uploaded-data')}
            className="p-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 transition cursor-pointer"
          >
            <div className="flex items-center justify-between text-xs text-teal-200 font-semibold">
              <span>ग्राहक खाती</span>
              <Users className="w-3.5 h-3.5 text-teal-400" />
            </div>
            <div className="text-xl font-black text-white mt-1 font-mono">
              {existingCustomers.length.toLocaleString()}
            </div>
            <span className="text-[10px] text-teal-300">Customers</span>
          </div>

          <div
            onClick={() => onSwitchTab && onSwitchTab('uploaded-data')}
            className="p-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 transition cursor-pointer col-span-2 sm:col-span-1"
          >
            <div className="flex items-center justify-between text-xs text-rose-200 font-semibold">
              <span>खरेदी आवक</span>
              <ShoppingCart className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div className="text-xl font-black text-white mt-1 font-mono">
              {existingPurchases.length.toLocaleString()}
            </div>
            <span className="text-[10px] text-rose-300">Purchases</span>
          </div>
        </div>
      </div>

      {/* Recently Imported Inspection Panel (If import just occurred) */}
      {lastImportedSummary && (
        <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-400 dark:border-emerald-600 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200 dark:border-emerald-800 pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <h3 className="text-sm font-black text-emerald-950 dark:text-emerald-200">
                  🎉 नुकताच इम्पोर्ट झालेला डेटा (वेळ: {lastImportedSummary.date})
                </h3>
                <p className="text-xs text-emerald-800 dark:text-emerald-400 mt-0.5">
                  खालील नोंदी सिस्टीममध्ये यशस्वीरित्या जमा करण्यात आल्या आहेत:
                </p>
              </div>
            </div>
            {onSwitchTab && (
              <button
                type="button"
                onClick={() => onSwitchTab('uploaded-data')}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs self-start sm:self-auto"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>मास्टर सर्चमध्ये हा डेटा पाहा</span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            <span className="px-3 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-300 border border-blue-200">
              🛒 {lastImportedSummary.billsCount} विक्री बिले
            </span>
            <span className="px-3 py-1 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-900 dark:text-purple-300 border border-purple-200">
              🧾 {lastImportedSummary.receiptsCount} जमा पावत्या
            </span>
            <span className="px-3 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-300 border border-amber-200">
              💳 {lastImportedSummary.cardMembersCount} कार्ड सभासद
            </span>
            <span className="px-3 py-1 rounded-lg bg-teal-100 dark:bg-teal-900/40 text-teal-900 dark:text-teal-300 border border-teal-200">
              👥 {lastImportedSummary.customersCount} ग्राहक खाती
            </span>
          </div>

          {lastImportedSummary.sampleRows.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900">
              <table className="w-full text-xs text-left">
                <thead className="bg-emerald-100/50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-300 font-bold border-b border-emerald-200 dark:border-emerald-800">
                  <tr>
                    <th className="px-3 py-2">प्रकार</th>
                    <th className="px-3 py-2">नाव / तपशील</th>
                    <th className="px-3 py-2">संदर्भ / पावती / बिल क्र.</th>
                    <th className="px-3 py-2 text-right">रक्कम</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {lastImportedSummary.sampleRows.map((r, i) => (
                    <tr key={i} className="hover:bg-emerald-50/50 dark:hover:bg-slate-800/50">
                      <td className="px-3 py-2 font-bold text-slate-700 dark:text-slate-300">
                        {r.type}
                      </td>
                      <td className="px-3 py-2 font-semibold text-slate-900 dark:text-white">
                        {r.title}
                      </td>
                      <td className="px-3 py-2 font-mono text-slate-600 dark:text-slate-400">
                        {r.ref || '-'}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        ₹{(r.amount || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Success Notification Banner */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 text-sm font-bold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            {onSwitchTab && (
              <button
                type="button"
                onClick={() => onSwitchTab('uploaded-data')}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Database className="w-3.5 h-3.5" />
                <span>मास्टर सर्चमध्ये तपासा</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setSuccessMessage('')}
              className="text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer ml-1"
            >
              ✕ बंद करा
            </button>
          </div>
        </div>
      )}

      {/* Top Navigation Mode Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setImportMode('universal')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
              importMode === 'universal'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>स्मार्ट ऑटो-डिटेक्टर (5-in-1 Universal)</span>
          </button>

          <button
            type="button"
            onClick={() => setImportMode('manual')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
              importMode === 'manual'
                ? 'bg-slate-900 dark:bg-slate-700 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>मॅन्युअल इम्पोर्ट (Category Wise)</span>
          </button>

          {onSwitchTab && (
            <button
              type="button"
              onClick={() => onSwitchTab('uploaded-data')}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 shadow-2xs"
            >
              <Database className="w-4 h-4 text-emerald-600" />
              <span>🔍 मास्टर सर्च</span>
            </button>
          )}
        </div>
      </div>

      {importMode === 'universal' ? (
        <div className="space-y-6">
          {/* Universal Header & Rules Banner */}
          <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-blue-950 text-white p-6 rounded-3xl shadow-md relative overflow-hidden">
            <div className="relative z-10 space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>स्वयंचलित स्पेलिंग, तारीख व खाते दुरुस्ती प्रणाली सक्रिय</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                कोणतीही CSV फाईल टाका — आपोआप ओळखून अचूक ठिकाणी सेव्ह होईल!
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
                ही प्रणाली ५ पैकी कोणत्याही फाईलमधील स्पेलिंग चुका (उदा. <i>KELHZAR ➔ Kelzar</i>, <i>VAYFAD ➔ Waifad</i>, <i>NI,LIMA ➔ NILIMA</i>), नावातील कंसात असलेले गाव वेगळे करणे, फोन नंबर दुरुस्ती, आणि चुकीचे मायनस बॅलन्स आपोआप दुरुस्त करून थेट योग्य लेजरमध्ये जमा करते.
              </p>

              {/* Destination Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2.5 border border-white/10">
                  <div className="text-[11px] text-slate-300 font-medium">१. विक्री बिले</div>
                  <div className="text-xs font-bold text-white flex items-center gap-1 mt-0.5">
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    <span>All Entries & Ledger</span>
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2.5 border border-white/10">
                  <div className="text-[11px] text-slate-300 font-medium">२. ग्राहक खाती</div>
                  <div className="text-xs font-bold text-white flex items-center gap-1 mt-0.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-400" />
                    <span>Customers Khata</span>
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2.5 border border-white/10">
                  <div className="text-[11px] text-slate-300 font-medium">३. बचत योजना</div>
                  <div className="text-xs font-bold text-white flex items-center gap-1 mt-0.5">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Card Scheme 1, 2, 3</span>
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2.5 border border-white/10">
                  <div className="text-[11px] text-slate-300 font-medium">४. जमा पावत्या</div>
                  <div className="text-xs font-bold text-white flex items-center gap-1 mt-0.5">
                    <Receipt className="w-3.5 h-3.5 text-purple-400" />
                    <span>Receipts & Passbook</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Load Server Files */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>रेडी सॅम्पल फाईल त्वरित लोड करा:</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                खालील बटणावर क्लिक करून थेट उपलब्ध CSV तपासून टेस्ट करू शकता:
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={async () => {
                  try {
                    const res = await fetch('/data/scheme2.csv');
                    const text = await res.text();
                    setCsvText(text);
                    handleProcessCsvString(text);
                  } catch (e: any) {
                    setParseError('Scheme 2 फाईल लोड करता आली नाही: ' + e.message);
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Scheme 2 लोड करा</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  try {
                    const res = await fetch('/data/scheme3.csv');
                    const text = await res.text();
                    setCsvText(text);
                    handleProcessCsvString(text);
                  } catch (e: any) {
                    setParseError('Scheme 3 फाईल लोड करता आली नाही: ' + e.message);
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Scheme 3 लोड करा</span>
              </button>
            </div>
          </div>

          {/* Upload Dropzone */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="relative border-2 border-dashed border-indigo-300 hover:border-indigo-600 rounded-2xl p-8 text-center bg-indigo-50/40 hover:bg-indigo-50/70 transition cursor-pointer">
              <input
                type="file"
                accept=".csv,text/csv,text/plain"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-xs">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-800">
                  कोणतीही CSV फाईल निवडण्यासाठी येथे क्लिक करा किंवा ड्रॅग करा
                </p>
                <p className="text-xs text-slate-500">
                  (Scheme 1, Scheme 2, Scheme 3, Sales Bills, किंवा Receipts फाईल)
                </p>
              </div>
            </div>

            {parseError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{parseError}</span>
              </div>
            )}
          </div>

          {/* Universal Result Analysis & Destination Mapping */}
          {universalResult && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
              {/* Header Analysis Box */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-600 text-white uppercase tracking-wider">
                      {universalResult.detectedType === 'bills' && '🛒 Sales Invoices (विक्री बिले)'}
                      {universalResult.detectedType === 'receipts' && '🧾 Receipts / Payments (पावत्या)'}
                      {universalResult.detectedType === 'cards_raw' && '💳 Card Scheme Members (कार्ड योजना)'}
                      {universalResult.detectedType === 'cards_master' && '💳 Card Scheme Master (मास्टर कार्ड्स)'}
                      {universalResult.detectedType === 'unknown' && '📄 CSV फाईल'}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      ओळखण्यात आलेली फाईल
                    </span>
                  </div>
                  <p className="text-sm font-bold text-slate-900 mt-1">
                    {universalResult.summaryText}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCommitUniversal}
                  className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2 transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>✓ सर्व दुरुस्त डेटा योग्य ठिकाणी सेव्ह करा</span>
                </button>
              </div>

              {/* Destination Breakdown Counters */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/50">
                  <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-amber-600" />
                    <span>विक्री बिले (Sales Invoices)</span>
                  </div>
                  <div className="text-2xl font-black text-amber-950 mt-2">
                    {universalResult.bills.length}
                  </div>
                  <div className="text-[11px] text-amber-700 mt-0.5">
                    {universalResult.bills.length > 0 ? 'नवीन बिले लेजरमध्ये जातील' : 'एकही विक्री बिल नाही (पावत्या फाईल)'}
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-indigo-200 bg-indigo-50/50">
                  <div className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-indigo-600" />
                    <span>कार्ड्स मेंबर्स (Card Schemes)</span>
                  </div>
                  <div className="text-2xl font-black text-indigo-950 mt-2">
                    {universalResult.cardMembers.length}
                  </div>
                  <div className="text-[11px] text-indigo-700 mt-0.5">योजना सभासद जोडले जातील</div>
                </div>

                <div className="p-4 rounded-2xl border border-purple-200 bg-purple-50/50">
                  <div className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-purple-600" />
                    <span>जमा पावत्या (Receipts)</span>
                  </div>
                  <div className="text-2xl font-black text-purple-950 mt-2">
                    {(universalResult.salesReceipts?.length || 0) + universalResult.cardTransactions.length}
                  </div>
                  <div className="text-[11px] text-purple-700 mt-0.5">
                    {universalResult.cardTransactions.length > 0 && (universalResult.salesReceipts?.length || 0) > 0
                      ? `${universalResult.cardTransactions.length} कार्ड योजना + ${universalResult.salesReceipts?.length || 0} ग्राहक जमा`
                      : universalResult.cardTransactions.length > 0
                      ? `${universalResult.cardTransactions.length} कार्ड योजना पावत्या जमा होतील`
                      : `${universalResult.salesReceipts?.length || 0} ग्राहक उधारी जमा पावत्या`}
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50/50">
                  <div className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span>ग्राहक खाती (Khata Ledger)</span>
                  </div>
                  <div className="text-2xl font-black text-blue-950 mt-2">
                    {universalResult.customers.length}
                  </div>
                  <div className="text-[11px] text-blue-700 mt-0.5">खाती अपडेट / शिल्लक जमा होईल</div>
                </div>
              </div>

              {/* Audit & Error Corrections Report Box */}
              <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/80 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                      {universalResult.auditIssues.length}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        स्वयंचलित दुरुस्ती अहवाल (Automated Audit & Fixes)
                      </h4>
                      <p className="text-xs text-slate-500">
                        {universalResult.auditIssues.length} विसंगती व स्पेलिंग चुका सापडल्या आणि आपोआप सुधारल्या गेल्या.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowAuditModal(!showAuditModal)}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-2xs self-start sm:self-auto"
                  >
                    <span>{showAuditModal ? 'तपशील लपवा' : 'सर्व दुरुस्त्या तपासा'}</span>
                    {showAuditModal ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Audit Issues List Accordion */}
                {showAuditModal && (
                  <div className="space-y-3 pt-2 border-t border-slate-200">
                    <div className="flex flex-wrap gap-2 text-xs">
                      {['all', 'spelling', 'date', 'phone', 'amount', 'card_number'].map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setAuditFilter(cat)}
                          className={`px-3 py-1 rounded-lg font-bold capitalize cursor-pointer transition ${
                            auditFilter === cat
                              ? 'bg-slate-900 text-white'
                              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {cat === 'all' && `सर्व दुरुस्त्या (${universalResult.auditIssues.length})`}
                          {cat === 'spelling' && 'स्पेलिंग व गावे'}
                          {cat === 'date' && 'तारीख स्वरूप'}
                          {cat === 'phone' && 'मोबाईल नंबर'}
                          {cat === 'amount' && 'चुकीची रक्कम'}
                          {cat === 'card_number' && 'कार्ड नंबर वाटप'}
                        </button>
                      ))}
                    </div>

                    <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white text-xs">
                      <table className="w-full text-left">
                        <thead className="bg-slate-100 font-bold text-slate-700 sticky top-0 border-b border-slate-200">
                          <tr>
                            <th className="p-2.5">प्रकार</th>
                            <th className="p-2.5">वर्णन</th>
                            <th className="p-2.5 text-rose-600">मूळ फाईलमध्ये (अगोदर)</th>
                            <th className="p-2.5 text-emerald-700">दुरुस्त केलेले रूप (आता)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {universalResult.auditIssues
                            .filter((iss) => auditFilter === 'all' || iss.type === auditFilter)
                            .slice(0, 50)
                            .map((iss, i) => (
                              <tr key={i} className="hover:bg-slate-50">
                                <td className="p-2.5 font-bold uppercase text-[10px] text-slate-500">
                                  {iss.type}
                                </td>
                                <td className="p-2.5 text-slate-700">{iss.description}</td>
                                <td className="p-2.5 font-mono text-rose-700 bg-rose-50/50">{iss.original}</td>
                                <td className="p-2.5 font-mono font-bold text-emerald-800 bg-emerald-50/50">{iss.corrected}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Manual Import Category Interface */
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { type: 'cards' as ImportType, label: '1. Card Members (योजना ग्राहक)', desc: 'Scheme 1, 2, 3 फाइल', icon: CreditCard },
              { type: 'bills' as ImportType, label: '2. Sales Bills (दुकान बिल/बिक्री)', desc: 'Total, Paid, Due फाइल', icon: FileText },
              { type: 'receipts' as ImportType, label: '3. Receipts (जमा रसीदें)', desc: 'Amount Received फाइल', icon: Receipt },
              { type: 'purchases' as ImportType, label: '4. Purchases (सप्लायर खरीदी)', desc: 'Dealer Purchases', icon: Building2 },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeImportType === item.type;
              return (
                <button
                  key={item.type}
                  onClick={() => {
                    setActiveImportType(item.type);
                    setParsedRows([]);
                  }}
                  className={`p-4 rounded-2xl border text-left cursor-pointer transition ${
                    isActive ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Icon className={`w-6 h-6 ${isActive ? 'text-emerald-400' : 'text-slate-600'}`} />
                    {isActive && <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>}
                  </div>
                  <div className="font-bold text-sm">{item.label}</div>
                  <div className={`text-xs ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>{item.desc}</div>
                </button>
              );
            })}
          </div>

          {activeImportType === 'cards' && (
            <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-indigo-950 text-sm">Target Scheme Selection (यह फाइल किस योजना की है?)</h3>
                <p className="text-xs text-indigo-800">चुनें कि यह फाइल Scheme 1, 2 या 3 किसकी है:</p>
              </div>
              <select
                value={targetSchemeId}
                onChange={(e) => setTargetSchemeId(e.target.value)}
                className="px-4 py-2 bg-white border border-indigo-300 rounded-xl font-bold text-sm text-indigo-950"
              >
                <option value="auto">✨ Auto-Detect (कार्ड नंबर से पहचानें)</option>
                <option value="scheme1">Scheme 1 (योजना 1)</option>
                <option value="scheme2">Scheme 2 (योजना 2)</option>
                <option value="scheme3">Scheme 3 (योजना 3)</option>
              </select>
            </div>
          )}

          {/* Upload Dropzone */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="relative border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-8 text-center bg-slate-50 cursor-pointer">
              <input
                type="file"
                accept=".csv,text/csv,text/plain"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center space-y-2">
                <Upload className="w-8 h-8 text-blue-600" />
                <p className="text-sm font-bold text-slate-800">CSV फाईल निवडण्यासाठी येथे क्लिक करा</p>
                <p className="text-xs text-slate-400">Excel किंवा Google Sheets मधील .csv फाईल</p>
              </div>
            </div>

            {parseError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
                {parseError}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manual Rows Preview & Confirm Table (if rows parsed) */}
      {parsedRows.length > 0 && importMode === 'manual' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-900 text-lg">डेटा प्रीव्ह्यू ({parsedRows.length} रेकॉर्ड्स मिळाले)</h3>
              <p className="text-xs text-slate-500">तपासून खालील हिरव्या बटनावर क्लिक करून सेव्ह करा.</p>
            </div>
            <button
              onClick={handleCommitManual}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md cursor-pointer"
            >
              ✓ Confirm & Save {parsedRows.length} Records Now
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-2.5">#</th>
                  {activeImportType === 'cards' && (
                    <>
                      <th className="p-2.5">Card No</th>
                      <th className="p-2.5">Customer Name</th>
                      <th className="p-2.5">Village</th>
                      <th className="p-2.5">Opening Amt</th>
                      <th className="p-2.5">Date</th>
                    </>
                  )}
                  {activeImportType === 'bills' && (
                    <>
                      <th className="p-2.5">Bill No</th>
                      <th className="p-2.5">Customer</th>
                      <th className="p-2.5">Total Amount</th>
                      <th className="p-2.5">Paid Amount</th>
                      <th className="p-2.5">Balance Due</th>
                    </>
                  )}
                  {activeImportType === 'receipts' && (
                    <>
                      <th className="p-2.5">Receipt No</th>
                      <th className="p-2.5">Customer</th>
                      <th className="p-2.5">Amount</th>
                      <th className="p-2.5">Against Bill</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {parsedRows.slice(0, 10).map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-2.5 text-slate-400">{idx + 1}</td>
                    {activeImportType === 'cards' && (
                      <>
                        <td className="p-2.5 font-bold text-indigo-700">#{getField(row, ['CARD.NO', 'Card No'])}</td>
                        <td className="p-2.5 font-bold text-slate-900">{getField(row, ['NAME', 'Customer Name'])}</td>
                        <td className="p-2.5 text-slate-600">{getField(row, ['VILLEGE', 'Village'])}</td>
                        <td className="p-2.5 font-bold text-emerald-700">₹{parseNum(getField(row, ['OPENING AMT', 'Saving Balance']))}</td>
                        <td className="p-2.5 text-slate-500">{normalizeDate(getField(row, ['DATE', 'Date']))}</td>
                      </>
                    )}
                    {activeImportType === 'bills' && (
                      <>
                        <td className="p-2.5 font-bold text-amber-700">{getField(row, ['Bill No', 'InvoiceNo'])}</td>
                        <td className="p-2.5 font-bold text-slate-900">{getField(row, ['Customer Name', 'NAME'])}</td>
                        <td className="p-2.5 font-bold text-slate-900">₹{parseNum(getField(row, ['Grand Total', 'Total']))}</td>
                        <td className="p-2.5 font-bold text-emerald-700">₹{parseNum(getField(row, ['Amount Paid', 'Paid']))}</td>
                        <td className="p-2.5 font-bold text-rose-600">₹{parseNum(getField(row, ['Balance Due', 'Due']))}</td>
                      </>
                    )}
                    {activeImportType === 'receipts' && (
                      <>
                        <td className="p-2.5 font-bold text-blue-700">{getField(row, ['Receipt No'])}</td>
                        <td className="p-2.5 font-bold text-slate-900">{getField(row, ['Customer Name'])}</td>
                        <td className="p-2.5 font-bold text-emerald-700">₹{parseNum(getField(row, ['Amount Received']))}</td>
                        <td className="p-2.5 font-mono text-amber-700">{getField(row, ['Against Bill No', 'Ref Bill No'])}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
