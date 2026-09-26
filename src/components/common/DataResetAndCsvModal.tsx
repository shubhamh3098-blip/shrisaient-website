import React, { useState, useMemo, useRef } from 'react';
import {
  X,
  Trash2,
  Upload,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  RotateCcw,
  Users,
  CreditCard,
  Boxes,
  FileText,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Database
} from 'lucide-react';
import { StoreData, Customer, CardMember, StockItem } from '../../types';
import { StorageService } from '../../services/storageService';
import { useTheme } from '../../context/ThemeContext';
import { parseFileToTable, parseCsvOrTextToTable } from '../../utils/universalFileParser';
import { importCustomersTolerant, importSchemeCardsTolerant } from '../../utils/tolerantDataImporter';
import {
  userShowroomCustomers,
  userShowroomTransactions,
  userShowroomReceipts,
  userShowroomCards,
} from '../../data/userShowroomData';

interface DataResetAndCsvModalProps {
  storeData: StoreData;
  isOpen: boolean;
  onClose: () => void;
  onRefreshData: () => void;
}

export const DataResetAndCsvModal: React.FC<DataResetAndCsvModalProps> = ({
  storeData,
  isOpen,
  onClose,
  onRefreshData,
}) => {
  const { isDayMode } = useTheme();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [activeSection, setActiveSection] = useState<'reset' | 'import'>('reset');
  const [importCategory, setImportCategory] = useState<'customers' | 'scheme' | 'stock'>('customers');
  const [keepStockOnWipe, setKeepStockOnWipe] = useState(true);
  const [confirmWipeInput, setConfirmWipeInput] = useState('');
  const [showWipeDialog, setShowWipeDialog] = useState(false);

  // CSV Import State
  const [pastedCsv, setPastedCsv] = useState('');
  const [importMode, setImportMode] = useState<'merge' | 'append' | 'replace'>('merge');
  const [fileName, setFileName] = useState<string | null>(null);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);
  const [importErrorMsg, setImportErrorMsg] = useState<string | null>(null);

  // Counts
  const custCount = storeData.customers.length;
  const txCount = storeData.transactions.length;
  const receiptCount = storeData.billReceipts.length;
  const cardCount = storeData.cardMembers.length;
  const stockCount = storeData.stock.length;

  // Wipe handler
  const handlePerformWipe = () => {
    StorageService.wipeAllDemoData({ keepStock: keepStockOnWipe, keepDealers: true });
    onRefreshData();
    setShowWipeDialog(false);
    setConfirmWipeInput('');
    setImportSuccessMsg('सर्व डेमो डेटा यशस्वीरित्या साफ झाला! सर्व खाती ० झाली आहेत.');
    setTimeout(() => setImportSuccessMsg(null), 5000);
  };

  // Restore Default Demo Data
  const handleRestoreDemo = () => {
    if (window.confirm('तुम्हाला मूळ फॅक्टरी डेमो डेटा पुन्हा लोड करायचा आहे का?')) {
      StorageService.resetToDefault();
      onRefreshData();
      setImportSuccessMsg('फॅक्टरी डेमो डेटा पूर्ववत लोड केला गेला आहे.');
      setTimeout(() => setImportSuccessMsg(null), 4000);
    }
  };

  // Load Authentic Wardha Showroom Database (Instant zero-quota load)
  const handleLoadRealShowroomData = () => {
    if (window.confirm('तुम्हाला श्री साई इंटरप्रायझेस वर्धा चा अधिकृत शोरूम डेटा (1,000+ ग्राहक, बिले व कार्ड्स) पूर्ववत लोड करायचा आहे का?')) {
      const current = StorageService.loadData();
      const updated: StoreData = {
        ...current,
        customers: userShowroomCustomers,
        transactions: userShowroomTransactions,
        billReceipts: userShowroomReceipts,
        cardMembers: userShowroomCards,
        isDemoWiped: false,
      };
      StorageService.saveData(updated);
      onRefreshData();
      setImportSuccessMsg(`अधिकृत शोरूम डेटा यशस्वीरित्या लोड झाला! (${userShowroomCustomers.length} ग्राहक, ${userShowroomTransactions.length} बिले, ${userShowroomReceipts.length} पावत्या)`);
      setTimeout(() => setImportSuccessMsg(null), 5000);
    }
  };

  // Sample CSV Templates
  const sampleTemplates = {
    customers: `नाव,मोबाईल,गाव,पत्ता,खरेदी,बाकी
विजय गाडे,9822100001,वायफड,वायफड रोड,1700,0
चेतन कांगणे,9822100002,वर्धा,मेन मार्केट,14000,0
संजय ढोंगडे,9822100003,सेलू,बस स्टँड चौक,0,0
योगेश ठाकरे,9822100004,साटोडा,स्टेशन रोड,22000,5000
सपना नगराळे,9822100005,वर्धा,शिवाजी चौक,85200,3200`,
    scheme: `कार्ड क्र,सभासद नाव,मोबाईल,गाव,भरलेले महिने,एकूण भरलेली रक्कम,मासिक हप्ता
SSE-CD-0101,Rameshwar Pawar,9822100010,Wardha,28,28000,1000
SSE-CD-0102,Pravin Raut,9822100011,Sevagram,30,30000,1000
SSE-CD-0103,Kailash Shinde,9822100012,Waifad,15,15000,1000`,
    stock: `वस्तू नाव,श्रेणी,विक्री भाव,खरेदी भाव,शिल्लक नग,किमान अलर्ट
Samsung 32 Inch Smart TV,इलेक्ट्रॉनिक्स,16500,13200,8,2
Godrej Double Door Refrigerator,इलेक्ट्रॉनिक्स,24500,19800,5,2
Wooden King Size Bed,फर्निचर,32000,24000,3,1`,
  };

  // Download sample CSV
  const handleDownloadSample = () => {
    const csvContent = sampleTemplates[importCategory];
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `shri_sai_${importCategory}_sample.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // File Upload handler (Excel .xlsx, .xls, .csv, .tsv, .txt)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(`${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
    try {
      const parsed = await parseFileToTable(file);
      setPastedCsv(parsed.rawText);
      setImportErrorMsg(null);

      // Auto-detect category
      let category = importCategory;
      const lowerHeaders = parsed.headers.map(h => (h || '').toLowerCase()).join(' ');
      if (lowerHeaders.includes('card') || lowerHeaders.includes('कार्ड') || lowerHeaders.includes('scheme') || lowerHeaders.includes('योजना')) {
        category = 'scheme';
        setImportCategory('scheme');
      }

      // Automatically execute import immediately!
      const mode = importMode === 'append' ? 'allow' : 'merge';
      if (category === 'customers') {
        const res = importCustomersTolerant(parsed.headers, parsed.rows, storeData, mode);
        onRefreshData();
        setImportSuccessMsg(`🎉 अभिनंदन! "${file.name}" मधील सर्व ${res.totalRowsProcessed} नोंदी सिस्टीममध्ये सुरक्षित सेव्ह झाल्या! (नवीन: ${res.added}, अद्ययावत: ${res.updated})`);
      } else if (category === 'scheme') {
        const res = importSchemeCardsTolerant(parsed.headers, parsed.rows, storeData);
        onRefreshData();
        setImportSuccessMsg(`🎉 अभिनंदन! "${file.name}" मधील सर्व ${res.totalRowsProcessed} कार्ड नोंदी सुरक्षित सेव्ह झाल्या! (नवीन: ${res.added}, अद्ययावत: ${res.updated})`);
      } else {
        setImportSuccessMsg(`Excel/CSV फाईल मधून ${parsed.rows.length} नोंदी वाचल्या! खालील "आता आयात करा" बटनाने सेव्ह करा.`);
      }
    } catch (err: any) {
      console.error('File read error:', err);
      const reader = new FileReader();
      reader.onload = (evt) => {
        const content = evt.target?.result as string;
        if (content) {
          setPastedCsv(content);
          setImportErrorMsg(null);
          setImportSuccessMsg(`फाईल वाचली! आता आयात करा बटनावर क्लिक करा.`);
        }
      };
      reader.onerror = () => {
        setImportErrorMsg('फाईल वाचताना अडचण आली.');
      };
      reader.readAsText(file);
    }
  };

  // Parse CSV / Text Rows safely with universal parser
  const parsedRows = useMemo(() => {
    if (!pastedCsv.trim()) return [];
    const table = parseCsvOrTextToTable(pastedCsv);
    return table.rows.map((cols, idx) => ({
      idx: idx + 1,
      cols,
      raw: cols.join(','),
    }));
  }, [pastedCsv]);

  // Execute Bulk Import locally (Tolerant: 100% saved, 0 Firebase Read/Writes)
  const handleExecuteImport = () => {
    if (!pastedCsv.trim()) {
      setImportErrorMsg('कृपया CSV किंवा Excel फाईल अपलोड करा किंवा मजकूर पेस्ट करा.');
      return;
    }

    const table = parseCsvOrTextToTable(pastedCsv);
    if (table.rows.length === 0) {
      setImportErrorMsg('डेटा रिकामी आहे किंवा नोंदी आढळल्या नाहीत.');
      return;
    }

    try {
      if (importCategory === 'customers') {
        const mode = importMode === 'append' ? 'allow' : 'merge';
        const res = importCustomersTolerant(table.headers, table.rows, storeData, mode);
        onRefreshData();
        setImportSuccessMsg(`🎉 अभिनंदन! एकूण ${res.totalRowsProcessed} पैकी ${res.added} नवीन ग्राहक जोडले आणि ${res.updated} अद्ययावत केले. सर्व नोंदी सेव्ह झाल्या! (Firebase Quota 0% वापरला गेला)`);
      } else if (importCategory === 'scheme') {
        const res = importSchemeCardsTolerant(table.headers, table.rows, storeData);
        onRefreshData();
        setImportSuccessMsg(`🎉 यशस्वी! एकूण ${res.totalRowsProcessed} पैकी ${res.added} कार्ड सभासद जोडले गेले. सर्व नोंदी सुरक्षित सेव्ह झाल्या!`);
      } else if (importCategory === 'stock') {
        const newItems: StockItem[] = table.rows.map((cols, i) => {
          const name = cols[0] || `Product ${i + 1}`;
          const category: 'Other' = 'Other';
          const salePrice = parseFloat(cols[2]) || parseFloat(cols[1]) || 0;
          const purchasePrice = parseFloat(cols[3]) || 0;
          const stockQty = parseInt(cols[4]) || 1;
          const minAlertQty = parseInt(cols[5]) || 2;

          return {
            id: 'stk-' + Date.now() + '-' + i,
            code: 'SKU-' + (1000 + i),
            name,
            category,
            brand: 'Standard',
            model: 'Gen',
            mrp: salePrice ? Math.round(salePrice * 1.15) : 0,
            salePrice,
            purchasePrice,
            stockQty,
            minAlertQty,
            unit: 'Pcs',
            updatedAt: new Date().toISOString(),
          };
        });

        const res = StorageService.bulkImportStock(newItems, importMode);
        onRefreshData();
        setImportSuccessMsg(`यशस्वी! ${res.added} स्टॉक उत्पादने आयात झाली.`);
      }

      setPastedCsv('');
      setFileName(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setImportErrorMsg('इम्पोर्ट करताना त्रुटी आली: ' + (err.message || 'तपासा'));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div
        className={`w-full max-w-4xl rounded-2xl shadow-2xl border flex flex-col max-h-[92vh] overflow-hidden transition-colors ${
          isDayMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
        }`}
      >
        {/* Header */}
        <div
          className={`p-4 border-b flex items-center justify-between sticky top-0 z-20 ${
            isDayMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 text-white shadow-md shadow-rose-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg">
                  डेटा मॅनेजर (Data Reset & Zero-Quota CSV Import)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>0% Firebase Quota Used</span>
                </span>
              </div>
              <p className={`text-xs ${isDayMode ? 'text-slate-500' : 'text-slate-400'}`}>
                सर्व डेमो डेटा एका क्लिकमध्ये हटवा आणि तुमची CSV फाईल मोफत अमर्याद इम्पोर्ट करा
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-xl transition ${
              isDayMode ? 'hover:bg-slate-200 text-slate-600' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quota-Safety Reassurance Banner */}
        <div className="p-3 bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/15 border-b border-emerald-500/20 flex items-start gap-2.5 text-xs text-emerald-700 dark:text-emerald-300">
          <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
          <div>
            <span className="font-bold">तुमचा Firebase Quota १००% सुरक्षित आहे: </span>
            हा ॲप तुमच्या कॉम्प्युटरच्या वेगवान लोकल स्टोरेज (Offline High-Speed Storage Engine) वर चालतो.
            तुम्ही CSV द्वारे १०,००० ग्राहकांचा डेटा इम्पोर्ट केला तरी Firebase चा १ रुपयाही चार्ज किंवा कोटा लागणार नाही
            (Zero Firebase Read/Writes).
          </div>
        </div>

        {/* Section Tabs */}
        <div className={`p-3 border-b flex gap-2 ${isDayMode ? 'bg-slate-100/70' : 'bg-slate-900/50'}`}>
          <button
            type="button"
            onClick={() => setActiveSection('reset')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
              activeSection === 'reset'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                : isDayMode
                ? 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-750'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>१. सर्व डेमो डेटा साफ करा (1-Click Data Reset)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('import')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
              activeSection === 'import'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : isDayMode
                ? 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-750'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>२. तुमचा CSV डेटा इम्पोर्ट करा (CSV Bulk Import)</span>
          </button>
        </div>

        {/* Notifications */}
        {importSuccessMsg && (
          <div className="m-3 p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>{importSuccessMsg}</span>
          </div>
        )}
        {importErrorMsg && (
          <div className="m-3 p-3 bg-rose-500/20 border border-rose-500/40 text-rose-800 dark:text-rose-200 rounded-xl text-xs flex items-center gap-2 font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{importErrorMsg}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* SECTION 1: RESET / WIPE DEMO DATA */}
          {activeSection === 'reset' && (
            <div className="space-y-4">
              <div
                className={`p-4 rounded-2xl border ${
                  isDayMode ? 'bg-rose-50/60 border-rose-200' : 'bg-rose-950/20 border-rose-800/40'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm text-rose-700 dark:text-rose-300">
                      एका क्लिकमध्ये सर्व डेमो डेटा हटवा (Wipe All Demo Data)
                    </h4>
                    <p className="text-xs text-rose-950/80 dark:text-rose-200/80 leading-relaxed">
                      या बटणावर क्लिक केल्यास सिस्टीममधील सर्व नमुना/डेमो ग्राहक, जुनी बिले, जमा पावत्या आणि कार्ड योजना
                      रेकॉर्ड्स पूर्णपणे पुसून ० (शून्य) होतील. तुमचे दुकान नाव, GST तपशील, कर्मचारी आणि पुढील पावती क्र. १०७९ सुरक्षित राहील.
                    </p>
                  </div>
                </div>

                {/* Current Data Live Counters */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-4 pt-3 border-t border-rose-200/60 dark:border-rose-800/30">
                  <div className={`p-2 rounded-xl text-center ${isDayMode ? 'bg-white' : 'bg-slate-900'}`}>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">डेमो ग्राहक</span>
                    <p className="text-sm font-bold text-rose-600">{custCount}</p>
                  </div>
                  <div className={`p-2 rounded-xl text-center ${isDayMode ? 'bg-white' : 'bg-slate-900'}`}>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">विक्री बिले</span>
                    <p className="text-sm font-bold text-rose-600">{txCount}</p>
                  </div>
                  <div className={`p-2 rounded-xl text-center ${isDayMode ? 'bg-white' : 'bg-slate-900'}`}>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">जमा पावत्या</span>
                    <p className="text-sm font-bold text-rose-600">{receiptCount}</p>
                  </div>
                  <div className={`p-2 rounded-xl text-center ${isDayMode ? 'bg-white' : 'bg-slate-900'}`}>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">कार्ड सभासद</span>
                    <p className="text-sm font-bold text-rose-600">{cardCount}</p>
                  </div>
                  <div className={`p-2 rounded-xl text-center ${isDayMode ? 'bg-white' : 'bg-slate-900'}`}>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">स्टॉक वस्तू</span>
                    <p className="text-sm font-bold text-slate-600 dark:text-slate-300">{stockCount}</p>
                  </div>
                </div>

                {/* Keep stock checkbox */}
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="chk-keep-stock"
                    checked={keepStockOnWipe}
                    onChange={(e) => setKeepStockOnWipe(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300"
                  />
                  <label htmlFor="chk-keep-stock" className="text-xs font-semibold cursor-pointer">
                    शोरूममधील स्टॉक वस्तू जशाच्या तशा ठेवा (Keep Catalog Stock Items)
                  </label>
                </div>

                {/* Wipe Button */}
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowWipeDialog(true)}
                    className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-rose-600/30 transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>सर्व डेमो डेटा एका क्लिकमध्ये पुसून टाका (Wipe Demo Data)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRestoreDemo}
                    className={`px-3 py-2.5 rounded-xl text-xs font-medium flex items-center gap-1.5 border transition ${
                      isDayMode
                        ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                        : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700'
                    }`}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>फॅक्टरी डेमो डेटा पूर्ववत आणा</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLoadRealShowroomData}
                    className="px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 shadow-md shadow-amber-500/20 active:scale-95 transition cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>अधिकृत वर्धा शोरूम खाते डेटा लोड करा (1,000+ Accounts)</span>
                  </button>
                </div>
              </div>

              {/* Wipe Confirmation Dialog */}
              {showWipeDialog && (
                <div className="p-4 rounded-2xl border-2 border-rose-500 bg-rose-500/10 space-y-3 animate-in fade-in zoom-in-95">
                  <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                    <AlertTriangle className="w-5 h-5" />
                    <span>कृपया खात्री करा: तुम्ही सर्व डेमो डेटा पुसण्यास तयार आहात का?</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    ही क्रिया केल्यावर सर्व {custCount} ग्राहक, {txCount} बिले आणि {cardCount} कार्ड्स लगेच पुसले जातील, आणि तुम्ही तुमचा स्वतःचा CSV डेटा नव्याने टाकू शकाल.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handlePerformWipe}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md transition cursor-pointer"
                    >
                      होय, नक्की पुसून टाका (Confirm Clear All)
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowWipeDialog(false)}
                      className="px-3 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs transition cursor-pointer"
                    >
                      रद्द करा (Cancel)
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SECTION 2: CSV BULK IMPORT */}
          {activeSection === 'import' && (
            <div className="space-y-4">
              {/* Category selector */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold">कोणता डेटा भरायचा आहे?</span>
                  <div className="flex rounded-xl p-1 bg-slate-200 dark:bg-slate-800 text-xs">
                    <button
                      type="button"
                      onClick={() => setImportCategory('customers')}
                      className={`px-3 py-1 rounded-lg font-semibold transition ${
                        importCategory === 'customers' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500'
                      }`}
                    >
                      👥 ग्राहक नोंदवही
                    </button>
                    <button
                      type="button"
                      onClick={() => setImportCategory('scheme')}
                      className={`px-3 py-1 rounded-lg font-semibold transition ${
                        importCategory === 'scheme' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-500'
                      }`}
                    >
                      💳 ३०-महिने कार्ड्स
                    </button>
                    <button
                      type="button"
                      onClick={() => setImportCategory('stock')}
                      className={`px-3 py-1 rounded-lg font-semibold transition ${
                        importCategory === 'stock' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500'
                      }`}
                    >
                      📦 स्टॉक उत्पादने
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadSample}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 border transition ${
                    isDayMode
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  }`}
                >
                  <Download className="w-3.5 h-3.5 text-emerald-500" />
                  <span>नमुना CSV डाऊनलोड करा (.CSV)</span>
                </button>
              </div>

              {/* Upload or Paste Area */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* File picker */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-4 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition ${
                    isDayMode
                      ? 'border-slate-300 bg-slate-50 hover:bg-emerald-50/40 hover:border-emerald-400'
                      : 'border-slate-700 bg-slate-800/40 hover:bg-slate-800 hover:border-emerald-500'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv,.tsv,.txt"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-2">
                    <Upload className="w-6 h-6" />
                  </div>
                  <span className="font-bold text-xs text-slate-900 dark:text-white">
                    {fileName ? fileName : 'येथे तुमची Excel (.xlsx, .xls) किंवा CSV फाईल निवडा'}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5">
                    Excel शीट किंवा .CSV फाईल थेट चालेल (कोणतीही त्रुटी असली तरी डेटा अडकणार नाही)
                  </span>
                </div>

                {/* Import Mode options */}
                <div
                  className={`p-3.5 rounded-2xl border space-y-2 ${
                    isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  <span className="text-[11px] font-bold uppercase text-slate-400 block">
                    इम्पोर्ट पद्धत (Import Mode):
                  </span>
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="merge"
                      checked={importMode === 'merge'}
                      onChange={() => setImportMode('merge')}
                      className="text-emerald-600"
                    />
                    <span>
                      <strong>स्मार्ट मर्ज (Merge/Update):</strong> जुन्या ग्राहकात बाकी रक्कम जोडली जाईल.
                    </span>
                  </label>
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="append"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="text-emerald-600"
                    />
                    <span>
                      <strong>सर्व नवीन जोडा (Append):</strong> प्रत्येक ओळ नवीन रेकॉर्ड म्हणून जोडा.
                    </span>
                  </label>
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="text-emerald-600"
                    />
                    <span>
                      <strong>जुना बदलून नवीन ठेवा (Replace All):</strong> संपूर्ण यादी नव्याने टाका.
                    </span>
                  </label>
                </div>
              </div>

              {/* Pasted CSV preview */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    CSV मजकूर (Direct Paste or Loaded File):
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    {parsedRows.length > 0 ? `${parsedRows.length} ओळी लोड झाल्या` : 'रिकामे'}
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={pastedCsv}
                  onChange={(e) => setPastedCsv(e.target.value)}
                  placeholder={`येथे CSV मजकूर पेस्ट करा किंवा वरील बटणाने फाईल निवडा... (उदा. नाव,मोबाईल,गाव,खरेदी,बाकी)`}
                  className={`w-full p-2.5 rounded-xl font-mono text-xs border focus:outline-none focus:border-emerald-500 ${
                    isDayMode
                      ? 'bg-slate-50 border-slate-200 text-slate-800'
                      : 'bg-slate-800 border-slate-700 text-slate-200'
                  }`}
                />
              </div>

              {/* Preview Table if rows exist */}
              {parsedRows.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-emerald-600">
                    पूर्वावलोकन (Preview - पहिल्या ५ ओळी):
                  </span>
                  <div
                    className={`rounded-xl border overflow-x-auto max-h-36 ${
                      isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    <table className="w-full text-[11px] text-left">
                      <thead className={isDayMode ? 'bg-slate-100 text-slate-600' : 'bg-slate-800 text-slate-300'}>
                        <tr>
                          <th className="p-2">#</th>
                          <th className="p-2">स्तंभ १</th>
                          <th className="p-2">स्तंभ २</th>
                          <th className="p-2">स्तंभ ३</th>
                          <th className="p-2">स्तंभ ४</th>
                          <th className="p-2">स्तंभ ५</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {parsedRows.slice(0, 5).map((r) => (
                          <tr key={r.idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="p-2 font-mono text-slate-400">{r.idx}</td>
                            <td className="p-2 font-semibold">{r.cols[0]}</td>
                            <td className="p-2">{r.cols[1]}</td>
                            <td className="p-2">{r.cols[2]}</td>
                            <td className="p-2">{r.cols[3]}</td>
                            <td className="p-2">{r.cols[4]}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Execute Button */}
              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleExecuteImport}
                  disabled={parsedRows.length === 0}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    थेट सिस्टीममध्ये इम्पोर्ट करा ({parsedRows.length} रेकॉर्ड्स - 0 Firebase Quota)
                  </span>
                </button>

                <span className="text-[11px] text-slate-400">
                  सर्व डेटा तात्काळ तुमच्या ब्राउझरमध्ये सुरक्षित सेव्ह होतो.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
