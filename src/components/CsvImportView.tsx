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
  AlertTriangle
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
import { processUniversalCsv, UniversalImportResult } from '../utils/universalImporter';

interface CsvImportViewProps {
  onImportBills: (bills: TransactionEntry[]) => void;
  onImportReceipts: (receipts: CardTransaction[]) => void;
  onImportCardMembers: (members: CardMember[], autoReceipts?: CardTransaction[]) => void;
  onImportPurchases: (purchases: PurchaseEntry[], dealers: Dealer[]) => void;
  onUniversalImport?: (data: {
    bills: TransactionEntry[];
    cardMembers: CardMember[];
    cardTransactions: CardTransaction[];
    customers: Customer[];
  }) => void;
  onClearZeroBills?: () => void;
  onFullResetData?: () => void;
  existingCardMembers?: CardMember[];
  existingDealers?: Dealer[];
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
}) => {
  const [importMode, setImportMode] = useState<ImportTab>('universal');
  const [activeImportType, setActiveImportType] = useState<ImportType>('cards');
  const [targetSchemeId, setTargetSchemeId] = useState<string>('auto');
  const [csvText, setCsvText] = useState('');
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [universalResult, setUniversalResult] = useState<UniversalImportResult | null>(null);
  const [parseError, setParseError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditFilter, setAuditFilter] = useState<string>('all');

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

    if (onUniversalImport) {
      onUniversalImport({
        bills: universalResult.bills,
        cardMembers: universalResult.cardMembers,
        cardTransactions: universalResult.cardTransactions,
        customers: universalResult.customers,
      });
    } else {
      if (universalResult.bills.length > 0) onImportBills(universalResult.bills);
      if (universalResult.cardMembers.length > 0) onImportCardMembers(universalResult.cardMembers, universalResult.cardTransactions);
      else if (universalResult.cardTransactions.length > 0) onImportReceipts(universalResult.cardTransactions);
    }

    setSuccessMessage(
      `सफलतापूर्वक सेव्ह झाले! ${universalResult.bills.length} विक्री बिले, ${universalResult.cardMembers.length} कार्ड मेंबर्स, ${universalResult.cardTransactions.length} जमा पावत्या आणि ${universalResult.customers.length} ग्राहक खाती योग्य विभागात जमा झाली आहेत!`
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

          const itemsSummary = getField(r, ['Items Summary', 'ItemDetails', 'Items', 'Particulars'], 'Sales Invoice');
          const remarks = getField(r, ['Remarks', 'Agent', 'Notes']);

          return {
            id: `inv-imp-${Date.now()}-${idx}`,
            invoiceNo,
            date,
            customerName,
            customerPhone: mobile,
            itemDetails: itemsSummary + (village ? ` (${village})` : ''),
            totalAmount,
            payingNow,
            dueAmount: dueAmount > 0 ? dueAmount : Math.max(0, totalAmount - payingNow),
            paymentMode: getField(r, ['Payment Mode', 'PaymentMode', 'Mode'], 'Cash'),
            notes: remarks ? `Remarks: ${remarks}` : `Bill: Total ₹${totalAmount}, Paid ₹${payingNow}, Due ₹${dueAmount}`,
            createdAt: new Date().toISOString(),
          };
        });

        onImportBills(newBills);
        setSuccessMessage(`सफलता: ${newBills.length} विक्री बिल लोड झाले आणि All Entries अपडेट झाली!`);
      } else if (activeImportType === 'receipts') {
        const newReceipts: CardTransaction[] = parsedRows.map((r, idx) => {
          const receiptNo = getField(r, ['Receipt No', 'ReceiptNo'], `REC-${Date.now().toString().slice(-4)}-${idx + 1}`);
          const date = normalizeDate(getField(r, ['Date']));
          const customerName = getField(r, ['Customer Name', 'NAME'], 'Member');
          const cardNum = parseNum(getField(r, ['Card No', 'CARD.NO']), 1001);
          const amount = parseNum(getField(r, ['Amount Received', 'Amount']), 0);
          const againstBill = getField(r, ['Against Bill No', 'Ref Bill No']);
          const { schemeId } = resolveCardScheme(cardNum, againstBill);

          return {
            id: `rec-imp-${Date.now()}-${idx}`,
            cardId: `cm-${schemeId}-${cardNum}`,
            cardNumber: cardNum,
            schemeId,
            customerName,
            receiptNo,
            date,
            type: 'WeeklyPayment',
            amount,
            paymentMode: 'Cash',
            remarks: againstBill ? `Against Bill #${againstBill}` : 'Payment receipt',
            balanceAfter: amount,
            createdAt: new Date().toISOString(),
          };
        });

        onImportReceipts(newReceipts);
        setSuccessMessage(`सफलता: ${newReceipts.length} पावत्या जमा खात्यात जोडल्या गेल्या!`);
      }
      setCsvText('');
      setParsedRows([]);
    } catch (err: any) {
      setParseError(`Error importing: ${err.message}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header & Quick Cleanup Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            CSV Data Import & Cleanup Tool
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            पुरानी फाइलें अपलोड करें या 1 क्लिक में गलत ₹0 वाले बिल साफ़ करके फिर से ताज़ा डेटा लोड करें।
          </p>
        </div>

        {/* Emergency Cleanup Buttons */}
        <div className="flex flex-wrap gap-2">
          {onClearZeroBills && (
            <button
              onClick={() => {
                if (window.confirm('क्या आप All Entries से सभी ₹0 वाले ग़लत इम्पोर्ट बिल हटाना चाहते हैं?')) {
                  onClearZeroBills();
                  setSuccessMessage('सभी ₹0 वाले 1636 ग़लत बिल All Entries से हटा दिए गए हैं!');
                }
              }}
              className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <Trash2 className="w-4 h-4 text-amber-700" />
              1636 ग़लत जीरो बिल साफ़ करें
            </button>
          )}

          {onFullResetData && (
            <button
              onClick={() => {
                if (window.confirm('चेतावनी: क्या आप पूरा डेटा (बिल, कार्ड्स) रीसेट करके बिल्कुल ₹0 से नया अपलोड करना चाहते हैं?')) {
                  onFullResetData();
                  setSuccessMessage('पूरा डेटा रीसेट हो चुका है! अब आप Scheme 1, 2, 3 और Bills को सही-सही अपलोड कर सकते हैं।');
                }
              }}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <RefreshCw className="w-4 h-4" />
              पूरा डेटा रीसेट करें (Start Clean)
            </button>
          )}
        </div>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')} className="underline text-xs cursor-pointer">Dismiss</button>
        </div>
      )}

      {/* Top Navigation Mode Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setImportMode('universal')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
              importMode === 'universal'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>स्मार्ट ऑटो-डिटेक्टर & एरर क्लीनर (5-in-1 Universal)</span>
          </button>

          <button
            type="button"
            onClick={() => setImportMode('manual')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
              importMode === 'manual'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>मॅन्युअल इम्पोर्ट (Category Wise)</span>
          </button>
        </div>

        {/* Emergency Cleanup Buttons */}
        <div className="flex flex-wrap gap-2">
          {onClearZeroBills && (
            <button
              onClick={() => {
                if (window.confirm('क्या आप All Entries से सभी ₹0 वाले ग़लत इम्पोर्ट बिल हटाना चाहते हैं?')) {
                  onClearZeroBills();
                  setSuccessMessage('सर्व ₹0 चे चुकीचे बिल यशस्वीपणे काढून टाकले आहेत!');
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5 text-amber-700" />
              <span>₹0 चे बिल साफ़ करा</span>
            </button>
          )}

          {onFullResetData && (
            <button
              onClick={() => {
                if (window.confirm('चेतावनी: क्या आप पूरा डेटा (बिल, कार्ड्स) रीसेट करके बिल्कुल ₹0 से नया अपलोड करना चाहते हैं?')) {
                  onFullResetData();
                  setSuccessMessage('सर्व डेटा रीसेट झाला आहे! आता तुम्ही ताज्या 5 फाइल्स अपलोड करू शकता.');
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>डेटा रीसेट (Start Clean)</span>
            </button>
          )}
        </div>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')} className="underline text-xs cursor-pointer ml-2">बंद करा</button>
        </div>
      )}

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
                    <span>विक्री बिले (All Entries)</span>
                  </div>
                  <div className="text-2xl font-black text-amber-950 mt-2">
                    {universalResult.bills.length}
                  </div>
                  <div className="text-[11px] text-amber-700 mt-0.5">बिले लेजरमध्ये जातील</div>
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
                    {universalResult.cardTransactions.length}
                  </div>
                  <div className="text-[11px] text-purple-700 mt-0.5">बचत / विक्री पावत्या जमा होतील</div>
                </div>

                <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50/50">
                  <div className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span>ग्राहक खाती (Khata Ledger)</span>
                  </div>
                  <div className="text-2xl font-black text-blue-950 mt-2">
                    {universalResult.customers.length}
                  </div>
                  <div className="text-[11px] text-blue-700 mt-0.5">खाती अपडेट / नवीन तयार होतील</div>
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
