import React, { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Building2,
  FileText,
  Calendar,
  IndianRupee,
  ArrowRight,
  Plus,
  RefreshCw,
  ExternalLink,
  Receipt,
  FileCheck
} from 'lucide-react';
import { Dealer, PurchaseEntry, DealerPayment, BusinessSettings } from '../types';

interface ScanDealerStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  dealers: Dealer[];
  onAddDealer: (dealer: Omit<Dealer, 'id'>) => void;
  onAddPurchase: (purchase: Omit<PurchaseEntry, 'id'>) => void;
  onRecordDealerPayment: (payment: Omit<DealerPayment, 'id' | 'createdAt'>) => void;
  settings: BusinessSettings;
}

interface StatementTxRow {
  id: string;
  date: string;
  type: 'INVOICE' | 'PAYMENT';
  refNo: string;
  particulars: string;
  debit: number; // Purchase bill amount
  credit: number; // Payment made
  balance: number;
  selected: boolean;
}

export const ScanDealerStatementModal: React.FC<ScanDealerStatementModalProps> = ({
  isOpen,
  onClose,
  dealers,
  onAddDealer,
  onAddPurchase,
  onRecordDealerPayment,
  settings,
}) => {
  const [fileSrc, setFileSrc] = useState<string | null>(null);
  const [fileMime, setFileMime] = useState<string>('application/pdf');
  const [fileName, setFileName] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanStepText, setScanStepText] = useState('');
  const [scanError, setScanError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [importedCount, setImportedCount] = useState({ purchases: 0, payments: 0 });

  // Extracted Statement Fields
  const [docType, setDocType] = useState<'STATEMENT' | 'INVOICE'>('STATEMENT');
  const [dealerName, setDealerName] = useState('');
  const [dealerPhone, setDealerPhone] = useState('');
  const [dealerAddress, setDealerAddress] = useState('');
  const [dealerGstin, setDealerGstin] = useState('');
  const [statementPeriod, setStatementPeriod] = useState('');
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [closingBalance, setClosingBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<StatementTxRow[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Check if dealer exists in system
  const matchedDealer = dealers.find(
    (d) => d.name.trim().toLowerCase() === dealerName.trim().toLowerCase()
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const mime = file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');
    setFileMime(mime);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setFileSrc(result);
      processFileWithAI(result, mime);
    };
    reader.readAsDataURL(file);
  };

  const handleUseSample = (type: 'manisha_statement' | 'lg_invoice') => {
    setIsScanning(true);
    setScanError(null);
    setScanStepText('डेमो पार्टी लेजर स्टेटमेंट लोड करत आहे...');

    setTimeout(() => {
      if (type === 'manisha_statement') {
        setDocType('STATEMENT');
        setDealerName('MANISHA ENTERPRISES');
        setDealerPhone('9766911693');
        setDealerAddress('Ingole Chowk, Main Road, Wardha 442001');
        setDealerGstin('27ABDPB8956C1ZS');
        setStatementPeriod('01-Apr-2025 to 31-Mar-2026');
        setOpeningBalance(0);
        setClosingBalance(18500);

        setTransactions([
          {
            id: 'demo-1',
            date: '2026-03-05',
            type: 'INVOICE',
            refNo: 'CS/2526/04128',
            particulars: 'LG 240L Double Door Refrigerator (2 Qty)',
            debit: 50957,
            credit: 0,
            balance: 50957,
            selected: true,
          },
          {
            id: 'demo-2',
            date: '2026-03-10',
            type: 'PAYMENT',
            refNo: 'UTR-SBI984210',
            particulars: 'NEFT Online Bank Transfer from Current A/c',
            debit: 0,
            credit: 40000,
            balance: 10957,
            selected: true,
          },
          {
            id: 'demo-3',
            date: '2026-03-16',
            type: 'INVOICE',
            refNo: 'CS/2526/04910',
            particulars: 'LG 7.0 Kg Smart Inverter Washing Machine (1 Qty)',
            debit: 19824,
            credit: 0,
            balance: 30781,
            selected: true,
          },
          {
            id: 'demo-4',
            date: '2026-03-20',
            type: 'PAYMENT',
            refNo: 'RTGS-ICICI88912',
            particulars: 'Part Payment towards Bill CS/2526/04910',
            debit: 0,
            credit: 12281,
            balance: 18500,
            selected: true,
          },
        ]);
      } else {
        setDocType('INVOICE');
        setDealerName('LG ELECTRONICS INDIA PVT LTD');
        setDealerPhone('9822001122');
        setDealerAddress('Plot No. 12, Butibori Industrial Area, Nagpur');
        setDealerGstin('27AAACL0829M1ZM');
        setStatementPeriod('15-Mar-2026');
        setOpeningBalance(0);
        setClosingBalance(84000);

        setTransactions([
          {
            id: 'demo-lg-1',
            date: '2026-03-15',
            type: 'INVOICE',
            refNo: 'LGE-NGP-2026-902',
            particulars: 'LG 43 inch 4K Ultra HD Smart TV (3 Qty)',
            debit: 84000,
            credit: 0,
            balance: 84000,
            selected: true,
          },
        ]);
      }

      setIsScanning(false);
      setScanStepText('');
    }, 600);
  };

  const processFileWithAI = async (base64Data: string, mime: string) => {
    setIsScanning(true);
    setScanError(null);
    setScanStepText('AI द्वारे पार्टी बिल / लेजर स्टेटमेंट तपासत आहे...');

    try {
      const response = await fetch('/api/scan-dealer-statement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileBase64: base64Data,
          mimeType: mime,
        }),
      });

      const resJson = await response.json();
      if (!response.ok || !resJson.success) {
        throw new Error(resJson.error || 'Failed to extract statement data');
      }

      const extracted = resJson.data;

      setDocType(extracted.documentType === 'INVOICE' ? 'INVOICE' : 'STATEMENT');
      if (extracted.dealerName) setDealerName(extracted.dealerName);
      if (extracted.dealerPhone) setDealerPhone(extracted.dealerPhone);
      if (extracted.dealerAddress) setDealerAddress(extracted.dealerAddress);
      if (extracted.dealerGstin) setDealerGstin(extracted.dealerGstin);
      if (extracted.statementPeriod) setStatementPeriod(extracted.statementPeriod);
      setOpeningBalance(Number(extracted.openingBalance) || 0);
      setClosingBalance(Number(extracted.closingBalance) || 0);

      if (Array.isArray(extracted.transactions) && extracted.transactions.length > 0) {
        const rows: StatementTxRow[] = extracted.transactions.map((tx: any, idx: number) => ({
          id: `tx-${idx}-${Date.now()}`,
          date: tx.date || new Date().toISOString().split('T')[0],
          type: tx.type === 'PAYMENT' ? 'PAYMENT' : 'INVOICE',
          refNo: tx.refNo || `REF-${idx + 1}`,
          particulars: tx.particulars || 'Goods / Payment Entry',
          debit: Number(tx.debit) || 0,
          credit: Number(tx.credit) || 0,
          balance: Number(tx.balance) || 0,
          selected: true,
        }));
        setTransactions(rows);
      }
    } catch (err: any) {
      console.error(err);
      setScanError(err.message || 'स्टेटमेंट तपासण्यात अडचण आली. कृपया डेमो डेटा वापरा किंवा पुन्हा प्रयत्न करा.');
    } finally {
      setIsScanning(false);
      setScanStepText('');
    }
  };

  const toggleRow = (id: string) => {
    setTransactions((prev) =>
      prev.map((row) => (row.id === id ? { ...row, selected: !row.selected } : row))
    );
  };

  const handleImportToLedger = () => {
    const selectedRows = transactions.filter((t) => t.selected);
    if (selectedRows.length === 0) {
      alert('कृपया समाविष्ट करण्यासाठी किमान एक तरी नोंद निवडा.');
      return;
    }

    const finalDealerName = dealerName.trim() || 'NEW DEALER';

    // 1. Create Dealer if not exists
    if (!matchedDealer) {
      onAddDealer({
        name: finalDealerName,
        phone: dealerPhone || '9876543210',
        address: dealerAddress || 'Wardha Maharashtra',
        gstin: dealerGstin || '',
        category: 'Electronics & Appliances',
        openingBalance: openingBalance || 0,
        currentBalance: closingBalance || 0,
      });
    }

    let pCount = 0;
    let payCount = 0;

    // 2. Import each selected transaction
    selectedRows.forEach((row) => {
      if (row.type === 'INVOICE' && row.debit > 0) {
        onAddPurchase({
          billNo: row.refNo || `PUR-${Date.now().toString().slice(-4)}`,
          supplierName: finalDealerName,
          items: row.particulars,
          totalAmount: row.debit,
          paidAmount: 0,
          pendingAmount: row.debit,
          date: row.date,
          paymentMode: 'Online',
          notes: `AI Scanned Statement Entry: ${statementPeriod || 'Imported'}`,
        });
        pCount++;
      } else if (row.type === 'PAYMENT' && row.credit > 0) {
        onRecordDealerPayment({
          dealerId: matchedDealer ? matchedDealer.id : `dealer-${Date.now()}`,
          dealerName: finalDealerName,
          amount: row.credit,
          date: row.date,
          paymentMode: 'Online',
          referenceNo: row.refNo || 'NEFT/UPI',
          notes: `AI Scanned Statement Payment: ${row.particulars}`,
        });
        payCount++;
      }
    });

    setImportedCount({ purchases: pCount, payments: payCount });
    setIsSuccess(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-xs">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <span>AI पार्टी बिल व लेजर स्टेटमेंट स्कॅनर</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase">
                  PDF & Photo Auto-Detect
                </span>
              </h2>
              <p className="text-xs text-blue-100">
                सप्लायर खरेदी बिल किंवा पूर्ण लेजर खातेवही PDF अपलोड करा - नोंदी आपोआप पार्टी खात्यात जोडल्या जातील
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Screen */}
        {isSuccess ? (
          <div className="p-8 text-center space-y-4 my-auto">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50 dark:ring-emerald-950/20">
              <FileCheck className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              पार्टी लेजरमध्ये यशस्वीरीत्या समाविष्ट केले!
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
              <strong>{dealerName}</strong> यांच्या खात्यात एकूण <strong>{importedCount.purchases} खरेदी पावत्या</strong> आणि{' '}
              <strong>{importedCount.payments} पेमेंट नोंदी</strong> लेजरमध्ये अचूक अपडेट झाल्या आहेत.
            </p>
            <div className="pt-4 flex justify-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm cursor-pointer shadow-md"
              >
                पार्टी खातेवही पहा (View Ledger)
              </button>
            </div>
          </div>
        ) : (
          <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
            {/* Upload or Camera Selection Box */}
            <div className="border-2 border-dashed border-indigo-300 dark:border-indigo-800 bg-indigo-50/40 dark:bg-indigo-950/20 rounded-2xl p-5 text-center">
              <input
                type="file"
                ref={fileInputRef}
                accept="application/pdf,image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <input
                type="file"
                ref={cameraInputRef}
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
              />

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition"
                >
                  <Upload className="w-4 h-4" />
                  <span>पार्टी स्टेटमेंट / बिल PDF किंवा फोटो निवडा</span>
                </button>
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-bold rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition"
                >
                  <Camera className="w-4 h-4 text-indigo-500" />
                  <span>कॅमेऱ्याने फोटो काढा</span>
                </button>
              </div>

              {/* Quick Sample Buttons */}
              <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
                <span className="text-[11px] font-semibold text-slate-500">त्वरित टेस्ट करण्यासाठी डेमो वापरा:</span>
                <button
                  type="button"
                  onClick={() => handleUseSample('manisha_statement')}
                  className="px-2.5 py-1 rounded-lg bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/60 dark:hover:bg-indigo-800 text-indigo-800 dark:text-indigo-200 text-xs font-bold cursor-pointer"
                >
                  📑 मनीषा एंटरप्रायझेस लेजर स्टेटमेंट (Demo)
                </button>
                <button
                  type="button"
                  onClick={() => handleUseSample('lg_invoice')}
                  className="px-2.5 py-1 rounded-lg bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/60 dark:hover:bg-purple-800 text-purple-800 dark:text-purple-200 text-xs font-bold cursor-pointer"
                >
                  🧾 एलजी इलेक्ट्रॉनिक्स खरेदी बिल (Demo)
                </button>
              </div>

              {fileName && (
                <div className="mt-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                  निवडलेली फाईल: <strong className="text-slate-900 dark:text-white">{fileName}</strong>
                </div>
              )}
            </div>

            {/* Scanning Indicator */}
            {isScanning && (
              <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-800 flex items-center justify-center gap-3 text-indigo-700 dark:text-indigo-300">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-xs sm:text-sm font-bold">{scanStepText}</span>
              </div>
            )}

            {scanError && (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/40 rounded-2xl border border-rose-200 dark:border-rose-800 flex items-center gap-3 text-rose-700 dark:text-rose-300 text-xs">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{scanError}</span>
              </div>
            )}

            {/* Extracted Details & Party Match */}
            {dealerName && (
              <div className="space-y-4">
                {/* Party & Statement Summary Header Card */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2 space-y-1">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-indigo-600" />
                      <strong className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                        {dealerName}
                      </strong>
                      {matchedDealer ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 text-[10px] font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> आधीपासून नोंद आहे
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 text-[10px] font-bold flex items-center gap-1">
                          <Plus className="w-3 h-3" /> नवीन डीलर जोडला जाईल
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      {dealerAddress || 'वर्धा / महाराष्ट्र'} • मो.: {dealerPhone || '-'} • GST: {dealerGstin || '-'}
                    </p>
                    <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                      कालावधी: {statementPeriod || 'चालू आर्थिक वर्ष'}
                    </p>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-right space-y-1">
                    <span className="text-[11px] text-slate-500 block">स्टेटमेंटनुसार शेवटची देय रक्कम:</span>
                    <span className="text-lg font-black text-rose-600 dark:text-rose-400 block font-mono">
                      ₹{closingBalance.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      (एकूण {transactions.length} नोंदी आढळल्या)
                    </span>
                  </div>
                </div>

                {/* Transactions Table Preview */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                  <div className="p-3 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-indigo-500" />
                      नोंदी निवडा (Select Entries to Import)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      निवडलेले: {transactions.filter((t) => t.selected).length} / {transactions.length}
                    </span>
                  </div>

                  <div className="overflow-x-auto max-h-72">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold sticky top-0 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="py-2.5 px-3 w-10 text-center">निवडा</th>
                          <th className="py-2.5 px-3">तारीख</th>
                          <th className="py-2.5 px-3">प्रकार</th>
                          <th className="py-2.5 px-3">बिल / संदर्भ क्र.</th>
                          <th className="py-2.5 px-3">तपशील (Particulars)</th>
                          <th className="py-2.5 px-3 text-right">खरेदी (Debit ₹)</th>
                          <th className="py-2.5 px-3 text-right">पेमेंट (Credit ₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {transactions.map((tx) => (
                          <tr
                            key={tx.id}
                            onClick={() => toggleRow(tx.id)}
                            className={`cursor-pointer transition ${
                              tx.selected
                                ? 'bg-indigo-50/40 dark:bg-indigo-950/20'
                                : 'opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                            }`}
                          >
                            <td className="py-2.5 px-3 text-center">
                              <input
                                type="checkbox"
                                checked={tx.selected}
                                onChange={() => {}}
                                className="w-4 h-4 text-indigo-600 rounded-sm cursor-pointer"
                              />
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400">
                              {tx.date}
                            </td>
                            <td className="py-2.5 px-3">
                              {tx.type === 'INVOICE' ? (
                                <span className="inline-block px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 text-[10px] font-bold">
                                  खरेदी बिल
                                </span>
                              ) : (
                                <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-bold">
                                  जमा पेमेंट
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                              {tx.refNo}
                            </td>
                            <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 font-medium">
                              {tx.particulars}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                              {tx.debit > 0 ? `₹${tx.debit.toLocaleString('en-IN')}` : '-'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              {tx.credit > 0 ? `₹${tx.credit.toLocaleString('en-IN')}` : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-2 flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    सप्लायर: <strong>{dealerName}</strong> • {transactions.filter((t) => t.selected).length} नोंदी लेजरमध्ये जातील
                  </div>
                  <button
                    type="button"
                    onClick={handleImportToLedger}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm cursor-pointer shadow-md flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>लेजरमध्ये थेट जोडा (Import into Ledger)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
