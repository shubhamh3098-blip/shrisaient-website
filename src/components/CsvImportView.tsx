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
  RefreshCw
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
  onClearZeroBills?: () => void;
  onFullResetData?: () => void;
  existingCardMembers?: CardMember[];
  existingDealers?: Dealer[];
  onSwitchTab?: (tab: any) => void;
}

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
  onClearZeroBills,
  onFullResetData,
}) => {
  const [activeImportType, setActiveImportType] = useState<ImportType>('cards');
  const [targetSchemeId, setTargetSchemeId] = useState<string>('auto');
  const [csvText, setCsvText] = useState('');
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [parseError, setParseError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

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
      setParseError(`Failed to parse CSV: ${err.message}`);
    }
  };

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

  const handleCommitImport = () => {
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
        setSuccessMessage(`सफलता: ${newCards.length} कार्ड मेंबर्स लोड हो गए और ₹ जमा पासबुक में क्रेडिट हो गया!`);
      } else if (activeImportType === 'bills') {
        const newBills: TransactionEntry[] = parsedRows.map((r, idx) => {
          const invoiceNo = getField(r, ['Bill No', 'InvoiceNo', 'BillNo'], `INV-${Date.now().toString().slice(-4)}-${idx + 1}`);
          const date = normalizeDate(getField(r, ['Date', 'BillDate']));
          const customerName = getField(r, ['Customer Name', 'NAME', 'Name'], 'Customer');
          const totalAmount = parseNum(getField(r, ['Grand Total', 'TotalAmount', 'Total']), 0);
          const payingNow = parseNum(getField(r, ['Amount Paid', 'PaidAmount', 'Paid']), 0);
          const dueAmount = parseNum(getField(r, ['Balance Due', 'DueAmount', 'Due']), Math.max(0, totalAmount - payingNow));

          return {
            id: `inv-imp-${Date.now()}-${idx}`,
            invoiceNo,
            date,
            customerName,
            itemDetails: getField(r, ['Items Summary', 'ItemDetails'], 'Sales Invoice'),
            totalAmount,
            payingNow,
            dueAmount,
            paymentMode: 'Cash',
            notes: `Bill: Total ₹${totalAmount}, Paid ₹${payingNow}, Due ₹${dueAmount}`,
            createdAt: new Date().toISOString(),
          };
        });

        onImportBills(newBills);
        setSuccessMessage(`सफलता: ${newBills.length} बिक्री बिल लोड हो गए और All Entries अपडेट हो गई!`);
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
        setSuccessMessage(`सफलता: ${newReceipts.length} रसीदें जमा में जुड़ गईं!`);
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

      {/* Tabs */}
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

      {/* Upload Zone */}
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
            <p className="text-sm font-bold text-slate-800">CSV फाइल चुनने के लिए यहाँ क्लिक करें</p>
            <p className="text-xs text-slate-400">Excel या Google Sheets से डाउनलोड की गई .csv फाइल</p>
          </div>
        </div>

        {parseError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
            {parseError}
          </div>
        )}
      </div>

      {/* Preview & Confirm */}
      {parsedRows.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-900 text-lg">डेटा प्रीव्यू ({parsedRows.length} रिकॉर्ड मिले)</h3>
              <p className="text-xs text-slate-500">जाँच लें और फिर नीचे दिए हरे बटन को दबाकर सेव करें।</p>
            </div>
            <button
              onClick={handleCommitImport}
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
