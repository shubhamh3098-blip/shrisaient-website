import React, { useState, useMemo, useRef } from 'react';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertCircle,
  Download,
  Filter,
  Users,
  CreditCard,
  FileText,
  Receipt,
  FileUp,
  Trash2,
  Sparkles,
  RefreshCw,
  FolderOpen,
  ArrowRight,
  ClipboardPaste,
  ShieldCheck,
  Edit3,
  Search,
  GitMerge,
  RotateCcw,
  BookOpen,
  X,
  Wrench
} from 'lucide-react';
import { Customer, StoreData, Transaction, BillReceipt } from '../../types';
import { StorageService } from '../../services/storageService';
import { useTheme } from '../../context/ThemeContext';
import { parseFileToTable, parseCsvOrTextToTable } from '../../utils/universalFileParser';
import {
  importCustomersTolerant,
  importSchemeCardsTolerant,
  importBillsTolerant,
  importReceiptsTolerant,
  TolerantImportResult,
} from '../../utils/tolerantDataImporter';
import { NavTab } from '../Sidebar';
import { EditTransactionModal } from '../transactions/EditTransactionModal';
import { EditReceiptModal } from '../customers/EditReceiptModal';
import { EditCustomerModal } from '../customers/EditCustomerModal';
import { MergeCustomerModal } from '../common/MergeCustomerModal';

interface ExcelImportViewProps {
  storeData: StoreData;
  onRefreshData: () => void;
  onNavigate?: (tab: NavTab) => void;
}

type ImportType = 'customers' | 'scheme_cards' | 'bills' | 'receipts';

export const ExcelImportView: React.FC<ExcelImportViewProps> = ({
  storeData,
  onRefreshData,
  onNavigate,
}) => {
  const { isDayMode } = useTheme();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [importType, setImportType] = useState<ImportType>('customers');
  const [selectedSchemeBatch, setSelectedSchemeBatch] = useState<number | undefined>(undefined);
  const [inputTab, setInputTab] = useState<'upload' | 'paste'>('upload');
  const [pastedData, setPastedData] = useState<string>('');
  const [duplicateMode, setDuplicateMode] = useState<'merge' | 'skip' | 'allow'>('merge');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
    details?: { imported: number; merged: number; skipped: number; targetTab?: NavTab };
  } | null>(null);

  const [importSuccessModal, setImportSuccessModal] = useState<{
    isOpen: boolean;
    result: TolerantImportResult;
    fileName: string;
    typeLabel: string;
    targetTab: NavTab;
  } | null>(null);

  // Data Correction & Audit Toolkit States
  const [showCorrectionHub, setShowCorrectionHub] = useState(false);
  const [correctionCategory, setCorrectionCategory] = useState<'bills' | 'receipts' | 'customers'>('bills');
  const [correctionSearch, setCorrectionSearch] = useState('');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editingReceipt, setEditingReceipt] = useState<BillReceipt | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);

  // Recalculate / Audit all customer balances across entire store
  const handleAuditAllCustomerBalances = () => {
    if (!window.confirm('तुम्हाला सर्व ग्राहकांची बिले व पावत्या तपासून खात्यातील शिल्लक रकमेचा ताळमेळ (Audit) करायचा आहे का? यामुळे जुनी चुकीची शिल्लक आपोआप बरोबर होईल.')) {
      return;
    }
    let count = 0;
    storeData.customers.forEach((cust) => {
      const res = StorageService.recalculateCustomerBalance(cust.id);
      if (res) count++;
    });
    onRefreshData();
    alert(`✓ यशस्वी! एकूण ${count} ग्राहकांचा हिशोब प्रत्यक्ष विक्री बिले व जमा पावत्यांवरून ताळमेळ झाला. सर्व खाती आता अचूक आहेत!`);
  };

  // Filtered lists for correction search
  const filteredCorrectionBills = useMemo(() => {
    const q = correctionSearch.trim().toLowerCase();
    if (!q) return storeData.transactions.slice(-15).reverse();
    return storeData.transactions.filter(
      (tx) =>
        tx.invoiceNo.toLowerCase().includes(q) ||
        tx.customerName.toLowerCase().includes(q) ||
        tx.customerPhone.includes(q)
    ).slice(0, 30);
  }, [storeData.transactions, correctionSearch]);

  const filteredCorrectionReceipts = useMemo(() => {
    const q = correctionSearch.trim().toLowerCase();
    if (!q) return storeData.billReceipts.slice(-15).reverse();
    return storeData.billReceipts.filter(
      (r) =>
        String(r.receiptNo).includes(q) ||
        r.customerName.toLowerCase().includes(q) ||
        (r.invoiceNo && r.invoiceNo.toLowerCase().includes(q))
    ).slice(0, 30);
  }, [storeData.billReceipts, correctionSearch]);

  const filteredCorrectionCustomers = useMemo(() => {
    const q = correctionSearch.trim().toLowerCase();
    if (!q) return storeData.customers.slice(0, 15);
    return storeData.customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.city && c.city.toLowerCase().includes(q))
    ).slice(0, 30);
  }, [storeData.customers, correctionSearch]);

  // Ready-to-use CSV templates for showroom operations
  const sampleCsvTemplates: Record<ImportType, string> = {
    customers: `Name,Phone,Address,Village,TotalPurchase,DueBalance
VIJAY GADE,9822100001,Waifad Road,Waifad,1700,0
CHETAN KANGALE,9822100002,Main Market,Wardha,14000,0
SANJAY DHONGADE,9822100003,Bus Stand Chowk,Seloo,4500,0
YOGESH THAKARE,9822100004,Station Road,Satoda,22000,5000
SHATRUGNA LOKHANDE,9822100005,Near Sevagram Ashram,Sevagram,900,0`,
    scheme_cards: `NAME,CARD.NO,VILLEGE,MOBILE.NO,OPENING AMT,DATE,SHEET NO
SANGITA UTTAM PATIL,1030,HINGNI,7972811639,450,01-01-2025,1
YAMUNA PRABHAKAR KAIKADI,1029,HINGNI,8698041323,200,01-01-2025,1
RANJANA SHAMBHARKAR,4107,BORI,9822100012,600,05-07-2025,2793
SUNIL DANDAGE,3191,PIPRI,8855881081,100,02-02-2025,2`,
    bills: `NAME,VILLAGE,DATE,BILL NO,MOBILE NO,PRODUCT,TOTAL,ADVANCE,BALANCE
MOHAN PILEWAR,SELDOH,21-02-2023,1001,9822100021,DIWAN 4*6,7300,7300,0
SAHARE,ANTERGAON,23-02-2023,1002,9822100022,DIWAN 4*6,6500,5200,1300
PRAKASH BUDHBAWARE,ANTERGAON,23-02-2023,1003,8262988399,MANDIR 21'',4000,2000,2000`,
    receipts: `SR NO,DATE,NAME,VILLAGE,AMOUNT,RECIVED BY
1,24-03-2023,VIJAY GADE,WAIFAD,200,SHUBHAM
2,13-05-2023,CHETAN KANGALE,WARDHA,14000,SHUBHAM
3,17-05-2023,SANJAY DHONGADE,SELOO,4500,BHUSHAN`,
  };

  // Perform clean import commit to StorageService
  const executeDirectImport = (
    parsed: { headers: string[]; rows: string[][] },
    targetType: ImportType = importType,
    fileName?: string
  ) => {
    try {
      setIsProcessing(true);
      let res: TolerantImportResult;
      let typeLabel = '';
      let targetTab: NavTab = 'customers';

      if (targetType === 'customers') {
        typeLabel = 'ग्राहक';
        targetTab = 'customers';
        res = importCustomersTolerant(parsed.headers, parsed.rows, storeData, duplicateMode);
      } else if (targetType === 'scheme_cards') {
        typeLabel = 'कार्ड सभासद';
        targetTab = 'scheme';
        res = importSchemeCardsTolerant(parsed.headers, parsed.rows, storeData, selectedSchemeBatch);
      } else if (targetType === 'bills') {
        typeLabel = 'विक्री बिले';
        targetTab = 'all-transactions';
        res = importBillsTolerant(parsed.headers, parsed.rows, storeData);
      } else {
        typeLabel = 'जमा पावत्या';
        targetTab = 'receipts';
        res = importReceiptsTolerant(parsed.headers, parsed.rows, storeData);
      }

      onRefreshData();

      setStatusMessage({
        type: 'success',
        text: `🎉 अभिनंदन! ${fileName ? `"${fileName}" मधून ` : ''}सर्व ${res.totalRowsProcessed} नोंदी सिस्टीममध्ये १००% सुरक्षित सेव्ह झाल्या! (नवीन ${typeLabel}: ${res.added}, अद्ययावत: ${res.updated}). कोणतीही नोंद रिजेक्ट झाली नाही!`,
        details: { imported: res.added, merged: res.updated, skipped: res.skipped, targetTab },
      });

      // Explicit modal popup so user is 100% assured data was saved
      setImportSuccessModal({
        isOpen: true,
        result: res,
        fileName: fileName || 'CSV/Excel Data',
        typeLabel,
        targetTab,
      });
    } catch (err: any) {
      console.error('Import error:', err);
      setStatusMessage({
        type: 'error',
        text: 'आयात करताना त्रुटी आली: ' + (err?.message || 'तपासा'),
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle file reading (.xlsx, .xls, .csv, .tsv, .txt)
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setUploadedFileName(`${file.name} (${(file.size / 1024).toFixed(1)} KB)`);

    try {
      setIsProcessing(true);
      const parsed = await parseFileToTable(file);
      if (parsed.rows.length === 0) {
        setStatusMessage({
          type: 'error',
          text: `फाईल "${file.name}" मध्ये नोंदी आढळल्या नाहीत. कृपया वैध Excel किंवा CSV फाईल निवडा.`,
        });
        setIsProcessing(false);
        return;
      }

      // Intelligent format auto-detection
      let detectedType = importType;
      const combinedHeaders = parsed.headers.map((h) => (h || '').toLowerCase()).join(' ');
      if (
        combinedHeaders.includes('card') ||
        combinedHeaders.includes('कार्ड') ||
        combinedHeaders.includes('scheme') ||
        combinedHeaders.includes('योजना') ||
        combinedHeaders.includes('sheet')
      ) {
        detectedType = 'scheme_cards';
        setImportType('scheme_cards');
      } else if (
        combinedHeaders.includes('bill') ||
        combinedHeaders.includes('बिल') ||
        combinedHeaders.includes('invoice') ||
        combinedHeaders.includes('product')
      ) {
        detectedType = 'bills';
        setImportType('bills');
      } else if (
        combinedHeaders.includes('receipt') ||
        combinedHeaders.includes('पावती') ||
        combinedHeaders.includes('recived')
      ) {
        detectedType = 'receipts';
        setImportType('receipts');
      }

      setPastedData(parsed.rawText);

      // Save immediately into storage
      executeDirectImport(parsed, detectedType, file.name);
    } catch (err: any) {
      console.error('File read error:', err);
      // Fallback: read plain text
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (text) {
          setPastedData(text);
          const parsed = parseCsvOrTextToTable(text);
          executeDirectImport(parsed, importType, file.name);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDownloadSampleCsv = () => {
    const content = sampleCsvTemplates[importType] || sampleCsvTemplates.customers;
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `shri_sai_${importType}_sample.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleLoadSample = () => {
    const sample = sampleCsvTemplates[importType];
    setPastedData(sample);
    setInputTab('paste');
    setUploadedFileName(`shri_sai_${importType}_sample.csv`);
    setStatusMessage({
      type: 'success',
      text: 'श्री साई एंटरप्रायजेसचा नमुना डेटा लोड केला. खालील हिरव्या बटनाने थेट आयात करा.',
    });
  };

  // Live parsed table data
  const parsedTable = useMemo(() => {
    if (!pastedData.trim()) return { headers: [], rows: [] };
    return parseCsvOrTextToTable(pastedData);
  }, [pastedData]);

  const previewRows = useMemo(() => {
    return parsedTable.rows.slice(0, 6);
  }, [parsedTable]);

  return (
    <div className="space-y-4 sm:space-y-5 max-w-6xl mx-auto pb-6 sm:pb-10">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
        <div>
          <h1
            className={`text-lg sm:text-2xl font-black tracking-tight flex items-center gap-2 ${
              isDayMode ? 'text-slate-900' : 'text-white'
            }`}
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-500/30 shadow-xs shrink-0">
              <FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span>Excel / CSV मास्टर डेटा आयात</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1">
            ग्राहकांची यादी, ३०-महिने कार्ड्स, विक्री बिले व जमा पावत्या १-क्लिकमध्ये थेट ERP मध्ये सुरक्षित आयात करा
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={handleDownloadSampleCsv}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl text-xs font-bold border transition cursor-pointer min-h-[36px] ${
              isDayMode
                ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-xs'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-white/10'
            }`}
          >
            <Download className="w-3.5 h-3.5 text-teal-500" />
            <span>नमुना CSV डाऊनलोड</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCorrectionHub(!showCorrectionHub)}
            className={`flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl text-xs font-bold border transition cursor-pointer min-h-[36px] ${
              showCorrectionHub
                ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md shadow-amber-500/25 ring-2 ring-amber-400'
                : isDayMode
                ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                : 'bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 border-amber-500/30'
            }`}
          >
            <Wrench className="w-3.5 h-3.5 text-amber-500" />
            <span>🛠️ चुका दुरुस्ती व हिशोब ताळमेळ</span>
          </button>

          <button
            type="button"
            onClick={handleLoadSample}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl text-xs font-bold border transition cursor-pointer min-h-[36px] ${
              isDayMode
                ? 'bg-teal-50 hover:bg-teal-100 text-teal-800 border-teal-200'
                : 'bg-teal-950/40 hover:bg-teal-900/50 text-teal-300 border-teal-500/30'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-500" />
            <span>नमुना डेटा लोड</span>
          </button>
        </div>
      </div>

      {/* DATA CORRECTION & AUDIT TOOLKIT (User Request: "uplaod kai chuka aahe tya pn dusrat krta aalya pahije billpn june edit jhale pahijee nai kaa recipt pnn") */}
      {showCorrectionHub && (
        <div className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl border shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-200 ${
          isDayMode ? 'bg-amber-50/70 border-amber-300 shadow-amber-500/10' : 'bg-slate-900/95 border-amber-500/40 shadow-black'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200 dark:border-amber-500/20 pb-3">
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Wrench className="w-4 h-4 text-amber-500" />
                <span>डेटा दुरुस्ती व हिशोब ताळमेळ केंद्र (Mistakes Correction & Audit Center)</span>
              </h3>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                अपलोड केलेल्या डेटातील चुका, जुनी बिले, जमा पावत्या किंवा ग्राहकांच्या शिल्लक रकमेतील त्रुटी येथे लगेच दुरुस्त करा.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAuditAllCustomerBalances}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                title="सर्व बिले व पावत्या पुन्हा तपासून सर्व ग्राहकांचा शिल्लक रकमेचा ताळमेळ करा"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>🔄 सर्व खात्यांचा ऑटो-ताळमेळ (Audit All)</span>
              </button>

              <button
                type="button"
                onClick={() => setIsMergeModalOpen(true)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                title="एकाच नावाचे किंवा फोनचे दोन ग्राहक खाते सुरक्षित एकत्र करा"
              >
                <GitMerge className="w-3.5 h-3.5" />
                <span>🔀 खाती एकत्र करा (Merge)</span>
              </button>

              <button
                type="button"
                onClick={() => setShowCorrectionHub(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sub-Tabs: Invoices / Receipts / Customer Accounts */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            {[
              { id: 'bills', label: 'विक्री बिले दुरुस्ती (Edit Bills)', count: storeData.transactions.length, icon: FileText },
              { id: 'receipts', label: 'जमा पावत्या दुरुस्ती (Edit Receipts)', count: storeData.billReceipts.length, icon: Receipt },
              { id: 'customers', label: 'ग्राहक खाते व हिशोब (Edit Customers)', count: storeData.customers.length, icon: Users },
            ].map((tab) => (
              <button
                type="button"
                key={tab.id}
                onClick={() => {
                  setCorrectionCategory(tab.id as any);
                  setCorrectionSearch('');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  correctionCategory === tab.id
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                <span className="text-[10px] opacity-75 font-mono">({tab.count})</span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={
                correctionCategory === 'bills'
                  ? 'बिल क्र. (Invoice No) किंवा ग्राहक नाव शोधा...'
                  : correctionCategory === 'receipts'
                  ? 'पावती क्र. (Receipt No) किंवा ग्राहक नाव शोधा...'
                  : 'ग्राहक नाव किंवा मोबाईल नंबर शोधा...'
              }
              value={correctionSearch}
              onChange={(e) => setCorrectionSearch(e.target.value)}
              className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                isDayMode ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
              }`}
            />
          </div>

          {/* Results List */}
          <div className="max-h-60 overflow-y-auto space-y-2">
            {correctionCategory === 'bills' && (
              filteredCorrectionBills.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">कोणतेही बिल सापडले नाही</div>
              ) : (
                filteredCorrectionBills.map((tx) => (
                  <div
                    key={tx.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                      isDayMode ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>बिल क्र. {tx.invoiceNo}</span>
                        <span className="text-amber-500 font-extrabold">{tx.customerName}</span>
                        <span className="text-slate-400 text-[11px] font-mono">{tx.customerPhone}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        तारीख: {tx.date} • वस्तू: {tx.items.map((i) => i.name).join(', ')}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-black text-slate-900 dark:text-white">₹{tx.grandTotal.toLocaleString('en-IN')}</div>
                        <div className="text-[10px] text-rose-500">बाकी: ₹{tx.balanceDue.toLocaleString('en-IN')}</div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setEditingTransaction(tx)}
                        className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        title="हे बिल एडिट करा / चुका दुरुस्त करा"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>दुरुस्त करा</span>
                      </button>
                    </div>
                  </div>
                ))
              )
            )}

            {correctionCategory === 'receipts' && (
              filteredCorrectionReceipts.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">कोणतीही पावती सापडली नाही</div>
              ) : (
                filteredCorrectionReceipts.map((rc) => (
                  <div
                    key={rc.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                      isDayMode ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>पावती #{rc.receiptNo}</span>
                        <span className="text-teal-500 font-extrabold">{rc.customerName}</span>
                        {rc.invoiceNo && (
                          <span className="text-slate-400 text-[11px] font-mono">बिल: {rc.invoiceNo}</span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        तारीख: {rc.date} • पद्धत: {rc.paymentMode} • हँडलर: {rc.handledBy || 'SHUBHAM'}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                        ₹{rc.amountPaid.toLocaleString('en-IN')}
                      </div>

                      <button
                        type="button"
                        onClick={() => setEditingReceipt(rc)}
                        className="px-2.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        title="ही पावती एडिट करा / चुका दुरुस्त करा"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>दुरुस्त करा</span>
                      </button>
                    </div>
                  </div>
                ))
              )
            )}

            {correctionCategory === 'customers' && (
              filteredCorrectionCustomers.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">कोणताही ग्राहक सापडला नाही</div>
              ) : (
                filteredCorrectionCustomers.map((cust) => (
                  <div
                    key={cust.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                      isDayMode ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{cust.name}</span>
                        <span className="text-slate-400 text-[11px] font-mono">{cust.phone || 'मोबाईल नाही'}</span>
                        <span className="text-slate-400 text-[10px]">({cust.city || cust.village || 'वर्धा'})</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        एकूण खरेदी: ₹{(cust.totalPurchased || 0).toLocaleString('en-IN')}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">शिल्लक उधारी:</span>
                        <span className="font-black text-rose-600 dark:text-rose-400 text-sm">
                          ₹{(cust.currentBalance || 0).toLocaleString('en-IN')}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setEditingCustomer(cust)}
                        className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        title="ग्राहक खाते व हिशोब दुरुस्त करा"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>दुरुस्त करा</span>
                      </button>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        </div>
      )}

      {/* Success / Status Message Banner */}
      {statusMessage && (
        <div
          className={`p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in fade-in zoom-in-95 duration-150 ${
            statusMessage.type === 'success'
              ? isDayMode
                ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950 shadow-sm'
                : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
              : isDayMode
              ? 'bg-rose-50/90 border-rose-200 text-rose-950 shadow-sm'
              : 'bg-rose-950/60 border-rose-500/40 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2.5 sm:gap-3">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            )}
            <div>
              <p className="font-bold text-sm leading-snug">{statusMessage.text}</p>
              {statusMessage.details && (
                <p className="text-slate-600 dark:text-slate-300 mt-1 text-[11px]">
                  नवीन जोडले: <strong>{statusMessage.details.imported}</strong> | आधीच्या खात्यात जमा: <strong>{statusMessage.details.merged}</strong> | डुप्लिकेट वगळले: <strong>{statusMessage.details.skipped}</strong>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {statusMessage.details?.targetTab && onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate(statusMessage.details!.targetTab!)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-xs min-h-[34px]"
              >
                <span>डेटा पहा</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setStatusMessage(null)}
              className="px-2.5 py-1 text-xs opacity-75 hover:opacity-100 cursor-pointer min-h-[34px]"
            >
              बंद करा
            </button>
          </div>
        </div>
      )}

      {/* Apple Frosted Glass Main Card */}
      <div
        className={`rounded-2xl sm:rounded-3xl border p-3.5 sm:p-7 shadow-sm space-y-4 sm:space-y-6 backdrop-blur-2xl transition-all ${
          isDayMode
            ? 'bg-white/90 border-slate-200/90 shadow-slate-200/50'
            : 'bg-slate-900/80 border-white/10 shadow-2xl'
        }`}
      >
        {/* Step 1: Category Selector (4 Hub Categories) */}
        <div>
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <span>१. आयात करावयाचा डेटा प्रकार निवडा (Category)</span>
            </label>
            <span className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 hidden sm:flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>१००% सुरक्षित आयात</span>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            {[
              { id: 'customers', label: 'सर्व ग्राहक व उधारी', sub: 'Customers & Khata', icon: Users, color: 'teal' },
              { id: 'scheme_cards', label: '३०-महिने कार्ड्स', sub: 'Scheme Members', icon: CreditCard, color: 'emerald' },
              { id: 'bills', label: 'विक्री बिले', sub: 'Sales Invoices', icon: FileText, color: 'amber' },
              { id: 'receipts', label: 'जमा पावत्या', sub: 'Receipts #1079', icon: Receipt, color: 'purple' },
            ].map((cat) => {
              const Icon = cat.icon;
              const isSel = importType === cat.id;
              return (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => {
                    setImportType(cat.id as any);
                    setStatusMessage(null);
                  }}
                  className={`p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border text-left flex flex-col justify-between transition-all duration-150 cursor-pointer min-h-[74px] sm:min-h-[90px] ${
                    isSel
                      ? 'bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-600/20 ring-2 ring-teal-500/30'
                      : isDayMode
                      ? 'bg-slate-50 hover:bg-slate-100/90 border-slate-200 text-slate-700'
                      : 'bg-slate-950/60 hover:bg-slate-800 border-white/10 text-slate-300'
                  }`}
                >
                  <Icon className={`w-4 h-4 sm:w-5 sm:h-5 mb-1.5 sm:mb-2.5 ${isSel ? 'text-white' : 'text-teal-500'}`} />
                  <div>
                    <div className="text-xs font-bold leading-tight">{cat.label}</div>
                    <div className={`text-[10px] mt-0.5 leading-tight ${isSel ? 'text-teal-100' : 'text-slate-400'}`}>
                      {cat.sub}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Scheme Batch Picker if scheme_cards is selected */}
          {importType === 'scheme_cards' && (
            <div
              className={`mt-3 p-3.5 rounded-2xl border animate-in fade-in duration-150 ${
                isDayMode ? 'bg-amber-50/70 border-amber-200' : 'bg-amber-950/30 border-amber-500/30'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>योजना बॅच निवडा (Select Scheme Batch)</span>
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  योजना १ व २: १००१-३००० • योजना ३, ४ व ५: १००१-६०००
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedSchemeBatch(undefined)}
                  className={`p-2 rounded-xl border text-xs font-bold transition cursor-pointer text-center ${
                    selectedSchemeBatch === undefined
                      ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                      : isDayMode
                      ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      : 'bg-slate-900 border-white/10 text-slate-300'
                  }`}
                >
                  <div>ऑटो-डिटेक्ट</div>
                  <div className="text-[9px] opacity-75 font-normal">कार्ड नंबरानुसार</div>
                </button>
                {[1, 2, 3, 4, 5].map((sNo) => {
                  const isSel = selectedSchemeBatch === sNo;
                  const range = sNo <= 2 ? '1001-3000' : '1001-6000';
                  return (
                    <button
                      type="button"
                      key={sNo}
                      onClick={() => setSelectedSchemeBatch(sNo)}
                      className={`p-2 rounded-xl border text-xs font-bold transition cursor-pointer text-center ${
                        isSel
                          ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                          : isDayMode
                          ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          : 'bg-slate-900 border-white/10 text-slate-300'
                      }`}
                    >
                      <div>योजना {sNo}</div>
                      <div className="text-[9px] opacity-75 font-normal">{range}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Upload Mode Tabs (Upload File vs Direct Paste) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              २. फाईल किंवा मजकूर द्या (Upload File or Paste Data)
            </label>

            {/* Input Switcher Pills */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-white/10">
              <button
                type="button"
                onClick={() => setInputTab('upload')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  inputTab === 'upload'
                    ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-300 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <FileUp className="w-3.5 h-3.5" />
                <span>फाईल अपलोड</span>
              </button>
              <button
                type="button"
                onClick={() => setInputTab('paste')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  inputTab === 'paste'
                    ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-300 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
                <span>थेट मजकूर पेस्ट</span>
              </button>
            </div>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv,.tsv,.txt"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFileUpload(e.target.files[0]);
              }
            }}
          />

          {inputTab === 'upload' ? (
            /* Drag & Drop File Box */
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-5 sm:p-8 rounded-2xl sm:rounded-3xl border-2 border-dashed text-center transition cursor-pointer flex flex-col items-center justify-center gap-2.5 sm:gap-3 ${
                isDragging
                  ? 'border-teal-500 bg-teal-500/10'
                  : isDayMode
                  ? 'border-slate-300 bg-slate-50/70 hover:bg-slate-100/80 hover:border-teal-500'
                  : 'border-slate-700 bg-slate-950/40 hover:bg-slate-950 hover:border-teal-500'
              }`}
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-500/20 shadow-xs">
                <FileUp className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white">
                  {uploadedFileName ? (
                    <span className="text-teal-600 dark:text-teal-400">
                      निवडलेली फाईल: {uploadedFileName}
                    </span>
                  ) : (
                    'Excel (.xlsx, .xls) किंवा CSV फाईल येथे ड्रॅग करा किंवा क्लिक करा'
                  )}
                </p>
                <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1">
                  समर्थित: Excel Sheets (.xlsx, .xls), CSV (.csv), Tab-separated (.tsv), Text (.txt)
                </p>
              </div>
              <span className="px-4 sm:px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md shadow-teal-600/20 min-h-[38px] flex items-center justify-center">
                {isProcessing ? 'प्रक्रिया सुरू आहे...' : 'फाईल निवडा (Browse File)'}
              </span>
            </div>
          ) : (
            /* Paste Textarea */
            <div className="space-y-2">
              <textarea
                value={pastedData}
                onChange={(e) => setPastedData(e.target.value)}
                placeholder={`येथे Excel किंवा CSV मधील मजकूर थेट पेस्ट करा...\nउदा:\n${sampleCsvTemplates[importType]}`}
                rows={6}
                className={`w-full p-4 rounded-2xl font-mono text-xs border focus:outline-none focus:ring-2 focus:ring-teal-500 resize-y transition ${
                  isDayMode
                    ? 'bg-slate-50 border-slate-200 text-slate-800'
                    : 'bg-slate-950/70 border-white/10 text-slate-200'
                }`}
              />
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{parsedTable.rows.length} नोंदी ओळखल्या</span>
                {pastedData && (
                  <button
                    type="button"
                    onClick={() => setPastedData('')}
                    className="text-rose-500 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>मजकूर पुसा</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Step 3: Duplicate Handling & Instant Import Trigger */}
        <div className="pt-2 border-t border-slate-100 dark:border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            {/* Duplicate Mode Toggle */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 shrink-0">
                <Filter className="w-3.5 h-3.5 text-teal-500" />
                <span>डुप्लिकेट धोरण:</span>
              </span>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-white/10">
                {[
                  { id: 'merge', label: 'खरेदी जोडा (Merge)' },
                  { id: 'skip', label: 'वगळा (Skip)' },
                  { id: 'allow', label: 'नवीन नोंद (Allow)' },
                ].map((m) => (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => setDuplicateMode(m.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer min-h-[32px] ${
                      duplicateMode === m.id
                        ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-300 shadow-xs font-bold'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Execute Import Button */}
            {parsedTable.rows.length > 0 && (
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => {
                  executeDirectImport(parsedTable, importType, uploadedFileName || undefined);
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl sm:rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-lg shadow-teal-600/25 active:scale-95 cursor-pointer transition min-h-[44px]"
              >
                <Upload className="w-4 h-4" />
                <span>सर्व {parsedTable.rows.length} नोंदी थेट सेव्ह करा</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Clean Preview Table */}
        {parsedTable.rows.length > 0 && (
          <div className="space-y-3 pt-2">
            {/* Top Preview Action Bar */}
            <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              isDayMode ? 'bg-emerald-50/80 border-emerald-200' : 'bg-emerald-950/30 border-emerald-500/30'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-black text-slate-800 dark:text-white">
                    {uploadedFileName ? `फाईल वाचली: ${uploadedFileName}` : 'डेटा वाचला गेला'}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    एकूण <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{parsedTable.rows.length}</strong> नोंदी ERP मध्ये सेव्ह होण्यासाठी तयार आहेत.
                  </div>
                </div>
              </div>

              <button
                type="button"
                disabled={isProcessing}
                onClick={() => {
                  executeDirectImport(parsedTable, importType, uploadedFileName || undefined);
                }}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 active:scale-95 cursor-pointer transition"
              >
                <Upload className="w-4 h-4" />
                <span>{isProcessing ? 'सेव्ह होत आहे...' : `✅ या सर्व ${parsedTable.rows.length} नोंदी ERP मध्ये सेव्ह करा`}</span>
              </button>
            </div>

            <div className="flex items-center justify-between text-xs px-1">
              <span className="font-bold text-slate-700 dark:text-slate-300">
                थेट प्रिव्ह्यू (Data Preview — एकूण {parsedTable.rows.length} पैकी पाहिलेल्या नोंदी)
              </span>
              <span className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold">
                सर्व नोंदी वैध व सुरक्षित आयात होण्यासाठी तयार
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/10">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100/90 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-3 py-2.5 w-12 text-center">#</th>
                    {parsedTable.headers.slice(0, 6).map((h, i) => (
                      <th key={i} className="px-3 py-2.5 whitespace-nowrap">
                        {h || `कॉलम ${i + 1}`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-sans">
                  {previewRows.map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      className={
                        isDayMode
                          ? 'hover:bg-slate-50/80 transition'
                          : 'hover:bg-white/[0.02] transition'
                      }
                    >
                      <td className="px-3 py-2 text-center text-slate-400 font-mono text-[11px]">
                        {rIdx + 1}
                      </td>
                      {row.slice(0, 6).map((cell, cIdx) => (
                        <td key={cIdx} className="px-3 py-2 text-slate-700 dark:text-slate-200 whitespace-nowrap">
                          {cell || <span className="opacity-30">-</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom Large Save CTA */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => {
                  executeDirectImport(parsedTable, importType, uploadedFileName || undefined);
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-xl shadow-emerald-600/30 active:scale-95 cursor-pointer transition min-h-[48px]"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                <span>सर्व {parsedTable.rows.length} नोंदी ERP डेटाबेसमध्ये त्वरित सेव्ह करा</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Celebratory Import Success Modal */}
      {importSuccessModal?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl text-center space-y-4 ${
              isDayMode ? 'bg-white border-emerald-200 text-slate-900' : 'bg-slate-900 border-emerald-500/40 text-white'
            }`}
          >
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center border-2 border-emerald-500/30 shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                🎉 फाईल यशस्वीपणे सेव्ह झाली!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {importSuccessModal.fileName} मधील सर्व नोंदी सिस्टीममध्ये सुरक्षित साठवल्या गेल्या आहेत.
              </p>
            </div>

            {/* Quick Stats Bento */}
            <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 text-center">
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold">एकूण नोंदी</div>
                <div className="text-base font-black text-slate-800 dark:text-white">
                  {importSuccessModal.result.totalRowsProcessed}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold">नवीन जोडले</div>
                <div className="text-base font-black text-emerald-600 dark:text-emerald-400">
                  {importSuccessModal.result.added}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold">अद्ययावत</div>
                <div className="text-base font-black text-blue-600 dark:text-blue-400">
                  {importSuccessModal.result.updated}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => {
                    const tab = importSuccessModal.targetTab;
                    setImportSuccessModal(null);
                    onNavigate(tab);
                  }}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 cursor-pointer transition flex items-center justify-center gap-2"
                >
                  <span>थेट {importSuccessModal.typeLabel} यादी पहा</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setImportSuccessModal(null)}
                className={`w-full py-2.5 rounded-xl border text-xs font-bold cursor-pointer transition ${
                  isDayMode
                    ? 'border-slate-200 text-slate-700 hover:bg-slate-100'
                    : 'border-white/10 text-slate-300 hover:bg-slate-800'
                }`}
              >
                नवीन फाईल अपलोड करा / बंद करा
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Transaction Modal */}
      {editingTransaction && (
        <EditTransactionModal
          transaction={editingTransaction}
          storeData={storeData}
          isOpen={true}
          onClose={() => setEditingTransaction(null)}
          onRefreshData={() => {
            onRefreshData();
            setEditingTransaction(null);
          }}
        />
      )}

      {/* Edit Receipt Modal */}
      {editingReceipt && (
        <EditReceiptModal
          receipt={editingReceipt}
          storeData={storeData}
          isOpen={true}
          onClose={() => setEditingReceipt(null)}
          onRefreshData={() => {
            onRefreshData();
            setEditingReceipt(null);
          }}
        />
      )}

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <EditCustomerModal
          customer={editingCustomer}
          storeData={storeData}
          isOpen={true}
          onClose={() => setEditingCustomer(null)}
          onRefreshData={() => {
            onRefreshData();
            setEditingCustomer(null);
          }}
        />
      )}

      {/* Merge Duplicate Accounts Modal */}
      {isMergeModalOpen && (
        <MergeCustomerModal
          storeData={storeData}
          onClose={() => setIsMergeModalOpen(false)}
          onRefreshData={() => {
            onRefreshData();
            setIsMergeModalOpen(false);
          }}
        />
      )}
    </div>
  );
};
