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
  Database
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

interface CsvImportViewProps {
  onImportBills: (bills: TransactionEntry[]) => void;
  onImportReceipts: (receipts: CardTransaction[]) => void;
  onImportCardMembers: (members: CardMember[]) => void;
  onImportPurchases: (purchases: PurchaseEntry[], dealers: Dealer[]) => void;
}

type ImportType = 'bills' | 'receipts' | 'cards' | 'purchases';

export const CsvImportView: React.FC<CsvImportViewProps> = ({
  onImportBills,
  onImportReceipts,
  onImportCardMembers,
  onImportPurchases,
}) => {
  const [activeImportType, setActiveImportType] = useState<ImportType>('bills');
  const [csvText, setCsvText] = useState('');
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [parseError, setParseError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Sample CSV Templates
  const sampleTemplates: Record<ImportType, { filename: string; content: string; desc: string }> = {
    bills: {
      filename: 'sample_old_bills.csv',
      desc: 'Old Sales Invoices & Customer Bills',
      content: `InvoiceNo,Date,CustomerName,CustomerPhone,CardNumber,ItemDetails,TotalAmount,PaidAmount,DueAmount,PaymentMode
INV-2025-0101,2025-11-12,Ramesh Patil,9822012345,1001,Copper Wire 2.5mm 10 coils,15000,10000,5000,Cash
INV-2025-0102,2025-11-15,Mahesh Kulkarni,9823098765,,Modular switches 20 pcs,4800,4800,0,Online
INV-2025-0103,2025-12-01,Sunita More,9765412980,1002,LED Battens 20W (15 pcs),3750,3750,0,Cash
INV-2025-0104,2026-01-10,Vikas Jadhav,9421876543,1045,Distribution Box 8 Way + MCBs,6200,4000,2200,Cash`,
    },
    receipts: {
      filename: 'sample_weekly_receipts.csv',
      desc: 'Weekly Card Payment & Refund Receipts (साप्ताहिक जमा व परतावा)',
      content: `ReceiptNo,CardNo,SchemeId,CustomerName,Date,WeekNo,Amount,Type,PaymentMode,Remarks
REC-SCH1-101,1030,scheme1,SANGITA UTTAM PATIL,2025-06-08,1,450,WeeklyPayment,Cash,Week 1 payment
REC-SCH2-102,3191,scheme2,SUNIL DANDAGE,2024-11-15,2,1000,WeeklyPayment,Cash,Week 2 payment
REC-SCH3-103,4107,scheme3,RANJANA SHAMBHARKAR,2025-07-12,1,600,WeeklyPayment,Cash,Week 1 deposit
REF-SCH1-104,1001,scheme1,Prakash Shinde,2026-09-04,,5000,Refund,Cash,Customer return refund (10000 me se 5000 wapas)`,
    },
    cards: {
      filename: 'sample_card_members.csv',
      desc: 'Card Scheme Members (NAME, CARD.NO, VILLEGE, MOBILE.NO, OPENING AMT, DATE, SHEET NO)',
      content: `NAME,CARD.NO,VILLEGE,MOBILE.NO,OPENING AMT,DATE,SHEET NO
RANJANA SHAMBHARKAR,4107,BORI,,600,05-07-2025,2793
VAISHALI BAVNE,4304,HINGNI,,100,18-10-2025,5104
SANGITA,4181,DEVNAGAR,,200,01-10-2025,5110
SUNIL DANDAGE,3191,PIPRI,8855881081,3000,01-11-2024,
PRASHANT BHALE,3201,SATODA,,100,01-11-2024,
SANGITA UTTAM PATIL,1030,HINGNI,7972811639,450,01-06-2025,
YAMUNA PRABHAKAR KAIKADI,1029,HINGNI,8698041323,200,01-06-2025,`,
    },
    purchases: {
      filename: 'sample_dealer_purchases.csv',
      desc: 'Dealer / Supplier Old Purchases (e.g. Manisha Enterprises)',
      content: `BillNo,Date,DealerName,Items,TotalAmount,PaidAmount,PaymentMode
PUR-7701,2026-08-10,Manisha Enterprises,Wires and modular accessories,95000,75000,Online
PUR-7702,2026-08-25,Manisha Enterprises,PVC pipes & conduits lot,50000,40000,Online
PUR-7703,2026-08-15,Polycab Distributors Ltd.,Submersible cables 4mm,72500,72500,Online
PUR-7704,2026-09-01,Anchor Switchgear Pvt Ltd,Panel boards & isolators,28400,20000,Online`,
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
        setParseError('CSV must contain a header row and at least 1 data row.');
        setParsedRows([]);
        return;
      }

      const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
      const rows: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        const currentLine = lines[i];
        // Split by comma ignoring commas inside quotes
        const values = currentLine.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((val) =>
          val.trim().replace(/^["']|["']$/g, '')
        );

        if (values.length < 2) continue;

        const rowObj: any = {};
        headers.forEach((header, index) => {
          rowObj[header] = values[index] || '';
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

  // Execute Import
  const handleCommitImport = () => {
    if (parsedRows.length === 0) return;

    try {
      if (activeImportType === 'bills') {
        const newBills: TransactionEntry[] = parsedRows.map((r, idx) => {
          const totalAmount = parseFloat(r.TotalAmount || r.totalAmount || '0') || 0;
          const payingNow = parseFloat(r.PaidAmount || r.paidAmount || '0') || 0;
          const dueAmount = parseFloat(r.DueAmount || r.dueAmount || '0') || Math.max(0, totalAmount - payingNow);
          const cardNum = r.CardNumber || r.CardNo || r['CARD.NO'] ? parseInt(r.CardNumber || r.CardNo || r['CARD.NO']) : undefined;
          const village = (r.Village || r.VILLEGE || r.village || '').trim();

          return {
            id: `inv-imp-${Date.now()}-${idx}`,
            invoiceNo: r.InvoiceNo || `INV-IMP-${Date.now().toString().slice(-4)}-${idx + 1}`,
            date: r.Date || new Date().toISOString().split('T')[0],
            customerName: r.CustomerName || r.NAME || 'Walk-in Customer',
            customerPhone: r.CustomerPhone || r['MOBILE.NO'] || '',
            cardNumber: cardNum,
            village: village || undefined,
            itemDetails: r.ItemDetails || 'Imported Bill Items',
            totalAmount,
            payingNow,
            dueAmount,
            paymentMode: (r.PaymentMode === 'Online' ? 'Online' : 'Cash') as 'Cash' | 'Online',
            notes: `Imported via CSV on ${new Date().toISOString().split('T')[0]}${village ? ` • Village: ${village}` : ''}`,
            createdAt: new Date().toISOString(),
          };
        });

        onImportBills(newBills);
        setSuccessMessage(`Successfully imported ${newBills.length} old sales bills into the ledger!`);
      } else if (activeImportType === 'receipts') {
        const newReceipts: CardTransaction[] = parsedRows.map((r, idx) => {
          const cardNum = parseInt(r.CardNo || r['CARD.NO'] || r.cardNumber || '1001') || 1001;
          let schemeId: CardSchemeId = 'scheme1';
          if (r.SchemeId) {
            schemeId = r.SchemeId.toLowerCase() as CardSchemeId;
          } else if (cardNum >= 4001 && cardNum <= 6000) {
            schemeId = 'scheme3';
          } else if (cardNum >= 3001 && cardNum <= 3999) {
            schemeId = 'scheme2';
          }

          const type = r.Type === 'Refund' ? 'Refund' : 'WeeklyPayment';
          const amount = parseFloat(r.Amount || '0') || 0;

          return {
            id: `rec-imp-${Date.now()}-${idx}`,
            cardId: `cm-${cardNum}`,
            cardNumber: cardNum,
            schemeId,
            customerName: r.CustomerName || r.NAME || `Card Member #${cardNum}`,
            receiptNo: r.ReceiptNo || `REC-${cardNum}-${idx + 1}`,
            date: r.Date || new Date().toISOString().split('T')[0],
            type,
            weekNumber: r.WeekNo ? parseInt(r.WeekNo) : undefined,
            amount,
            paymentMode: (r.PaymentMode === 'Online' ? 'Online' : 'Cash') as 'Cash' | 'Online',
            remarks: r.Remarks || `Imported ${type}`,
            balanceAfter: amount,
            createdAt: new Date().toISOString(),
          };
        });

        onImportReceipts(newReceipts);
        setSuccessMessage(`Successfully imported ${newReceipts.length} card receipts & refunds!`);
      } else if (activeImportType === 'cards') {
        const newCards: CardMember[] = parsedRows.map((r, idx) => {
          const cardNum = parseInt(r['CARD.NO'] || r['CARD NO'] || r.CardNo || r.cardNumber || r.CardNumber || '1001') || 1001;
          const customerName = (r.NAME || r.Name || r.CustomerName || r.customerName || `Member #${cardNum}`).trim();
          const village = (r.VILLEGE || r.Village || r.village || r.City || '').trim();
          const phone = (r['MOBILE.NO'] || r['MOBILE NO'] || r.Mobile || r.phone || r.Phone || '').trim();
          const sheetNo = (r['SHEET NO'] || r['SHEET_NO'] || r.SheetNo || r.sheetNo || '').trim();
          const openingAmt = parseFloat(r['OPENING AMT'] || r.OpeningAmt || r.openingAmt || '0') || 0;
          const totalDeposited = openingAmt > 0 ? openingAmt : (parseFloat(r.TotalDeposited || '0') || 0);
          const totalRefunded = parseFloat(r.TotalRefunded || '0') || 0;
          const joiningDate = r.DATE || r.Date || r.JoiningDate || new Date().toISOString().split('T')[0];

          let schemeId: CardSchemeId = 'scheme1';
          let schemeName = 'Scheme 1 (योजना 1)';
          if (r.SchemeId) {
            schemeId = r.SchemeId.toLowerCase() as CardSchemeId;
            schemeName = schemeId === 'scheme3' ? 'Scheme 3 (योजना 3)' : schemeId === 'scheme2' ? 'Scheme 2 (योजना 2)' : 'Scheme 1 (योजना 1)';
          } else if (cardNum >= 4001 && cardNum <= 6000) {
            schemeId = 'scheme3';
            schemeName = 'Scheme 3 (योजना 3)';
          } else if (cardNum >= 3001 && cardNum <= 3999) {
            schemeId = 'scheme2';
            schemeName = 'Scheme 2 (योजना 2)';
          } else {
            schemeId = 'scheme1';
            schemeName = 'Scheme 1 (योजना 1)';
          }

          return {
            id: `cm-imp-${cardNum}-${idx}`,
            cardNumber: cardNum,
            schemeId,
            schemeName,
            customerName,
            phone,
            village: village || undefined,
            sheetNo: sheetNo || undefined,
            openingAmt: openingAmt > 0 ? openingAmt : undefined,
            address: village ? `${village}, Wardha` : (r.Address || ''),
            joiningDate,
            registrationFee: 50,
            registrationFeePaid: true,
            totalDeposited,
            totalRefunded,
            netBalance: totalDeposited - totalRefunded,
            status: 'Active',
            notes: `Imported from CSV records${sheetNo ? ` • Sheet #${sheetNo}` : ''}${village ? ` • Village: ${village}` : ''}`,
          };
        });

        onImportCardMembers(newCards);
        setSuccessMessage(`Successfully imported ${newCards.length} scheme cards with villages & sheet numbers into system!`);
      } else if (activeImportType === 'purchases') {
        const newPurchases: PurchaseEntry[] = parsedRows.map((r, idx) => {
          const totalAmount = parseFloat(r.TotalAmount || '0') || 0;
          const paidAmount = parseFloat(r.PaidAmount || '0') || 0;

          return {
            id: `pur-imp-${Date.now()}-${idx}`,
            billNo: r.BillNo || `PUR-IMP-${idx + 1}`,
            date: r.Date || new Date().toISOString().split('T')[0],
            supplierName: r.DealerName || 'Manisha Enterprises',
            items: r.Items || 'Stock Supply',
            totalAmount,
            paidAmount,
            status: paidAmount >= totalAmount ? 'Paid' : paidAmount > 0 ? 'Partial' : 'Pending',
            paymentMode: (r.PaymentMode === 'Cash' ? 'Cash' : 'Online') as any,
          };
        });

        // Group by dealer name to ensure dealer records exist
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
              CSV Data Import (पुरानी फाइल्स का डेटा अपलोड)
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
              Instant Migration
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Easily upload your old bills, weekly installment receipts, card scheme customer files, and dealer purchases into ShriSaiEnt.
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
            className="text-xs text-emerald-700 underline font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Import Type Selector Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            type: 'bills' as ImportType,
            label: '1. Old Sales Bills',
            sub: 'पुराने ग्राहक बिल CSV',
            icon: Receipt,
            color: 'border-blue-500 bg-blue-50/50',
          },
          {
            type: 'receipts' as ImportType,
            label: '2. Weekly Receipts',
            sub: 'किस्त रसीदें व रिफंड CSV',
            icon: FileSpreadsheet,
            color: 'border-emerald-500 bg-emerald-50/50',
          },
          {
            type: 'cards' as ImportType,
            label: '3. Scheme Cards',
            sub: 'कार्ड धारक डेटा CSV',
            icon: CreditCard,
            color: 'border-amber-500 bg-amber-50/50',
          },
          {
            type: 'purchases' as ImportType,
            label: '4. Dealer Purchases',
            sub: 'डीलर खरीद (Manisha Ent.)',
            icon: Building2,
            color: 'border-indigo-500 bg-indigo-50/50',
          },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeImportType === tab.type;
          return (
            <button
              key={tab.type}
              onClick={() => {
                setActiveImportType(tab.type);
                setCsvText('');
                setParsedRows([]);
                setParseError('');
              }}
              className={`p-4 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                isActive
                  ? `border-2 border-slate-900 bg-white shadow-sm ring-2 ring-slate-900/5`
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon
                  className={`w-5 h-5 ${
                    isActive ? 'text-slate-900' : 'text-slate-400'
                  }`}
                />
                {isActive && (
                  <span className="w-2 h-2 rounded-full bg-slate-900" />
                )}
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-xs">{tab.label}</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">{tab.sub}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Upload Box & Template helper */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Upload CSV File for {sampleTemplates[activeImportType].desc}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select a .csv file from your computer or download the sample template below.
            </p>
          </div>

          <button
            onClick={() => handleDownloadSample(activeImportType)}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
          >
            <Download className="w-4 h-4 text-blue-600" />
            Download Sample {sampleTemplates[activeImportType].filename}
          </button>
        </div>

        {/* Drag Drop or File Select */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-blue-500 transition flex flex-col items-center justify-center bg-slate-50/50">
            <Upload className="w-8 h-8 text-blue-600 mb-2" />
            <p className="text-xs font-bold text-slate-800">
              Click to browse or drag & drop your CSV file here
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Supports standard CSV exports from Excel</p>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileUpload}
              className="mt-3 block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">
                Or Paste CSV Text Directly
              </label>
              <button
                type="button"
                onClick={() => {
                  setCsvText(sampleTemplates[activeImportType].content);
                  parseCSVContent(sampleTemplates[activeImportType].content);
                }}
                className="text-[11px] text-blue-600 hover:underline font-semibold"
              >
                Load Sample Data into Box
              </button>
            </div>
            <textarea
              rows={6}
              value={csvText}
              onChange={(e) => {
                setCsvText(e.target.value);
                parseCSVContent(e.target.value);
              }}
              placeholder={`Paste raw CSV here...\n${sampleTemplates[activeImportType].content.split('\n')[0]}`}
              className="w-full p-3 border border-slate-200 rounded-xl text-xs font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Parse Error */}
        {parseError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{parseError}</span>
          </div>
        )}

        {/* Parsed Preview Table */}
        {parsedRows.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Parsed Preview ({parsedRows.length} Rows Ready to Import)
                </h4>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  Verified Valid Format
                </span>
              </div>

              <button
                onClick={handleCommitImport}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center gap-2 cursor-pointer"
              >
                <Database className="w-4 h-4" />
                Import {parsedRows.length} Records into System
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-60 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0">
                  <tr>
                    {Object.keys(parsedRows[0] || {}).map((header) => (
                      <th key={header} className="py-2 px-3 whitespace-nowrap">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parsedRows.slice(0, 10).map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      {Object.values(row).map((val: any, colIdx) => (
                        <td key={colIdx} className="py-2 px-3 whitespace-nowrap text-slate-700">
                          {String(val)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {parsedRows.length > 10 && (
              <p className="text-[11px] text-slate-400 text-right">
                Showing first 10 of {parsedRows.length} rows...
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
