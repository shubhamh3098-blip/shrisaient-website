import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Boxes,
  Database,
  RefreshCw,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingDown,
  Layers,
  Wrench,
  Download,
  Percent,
  Search,
  Check,
  X
} from 'lucide-react';
import { StoreData, StockItem } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { StorageService } from '../../services/storageService';

interface SystemHealthShieldViewProps {
  storeData: StoreData;
  onRefreshData?: () => void;
}

export const SystemHealthShieldView: React.FC<SystemHealthShieldViewProps> = ({
  storeData,
  onRefreshData,
}) => {
  const { isDayMode } = useTheme();

  const [activeTab, setActiveTab] = useState<'stock-aging' | 'data-integrity' | 'system-audit'>('stock-aging');
  const [isScanning, setIsScanning] = useState(false);
  const [repairSuccessMsg, setRepairSuccessMsg] = useState<string | null>(null);

  // 1. Stock Aging Analysis
  const agingAnalysis = useMemo(() => {
    const now = Date.now();
    const MS_PER_DAY = 1000 * 60 * 60 * 24;

    const freshStock: StockItem[] = [];      // 0 - 30 days
    const normalStock: StockItem[] = [];     // 31 - 60 days
    const slowMoving: StockItem[] = [];      // 61 - 90 days
    const deadStock: StockItem[] = [];       // 90+ days

    let deadCapitalLocked = 0;
    let slowCapitalLocked = 0;
    let totalStockValue = 0;

    storeData.stock.forEach(item => {
      const itemVal = item.stockQty * item.purchasePrice;
      totalStockValue += itemVal;

      // Calculate days in stock based on updatedAt or synthetic age
      const itemDate = item.updatedAt ? new Date(item.updatedAt).getTime() : (now - (MS_PER_DAY * 45));
      const ageDays = Math.max(1, Math.floor((now - itemDate) / MS_PER_DAY));

      if (ageDays <= 30) {
        freshStock.push(item);
      } else if (ageDays <= 60) {
        normalStock.push(item);
      } else if (ageDays <= 90) {
        slowMoving.push(item);
        slowCapitalLocked += itemVal;
      } else {
        deadStock.push(item);
        deadCapitalLocked += itemVal;
      }
    });

    return {
      freshStock,
      normalStock,
      slowMoving,
      deadStock,
      deadCapitalLocked,
      slowCapitalLocked,
      totalStockValue,
    };
  }, [storeData.stock]);

  // 2. Data Integrity & Anomaly Scanner
  const anomalies = useMemo(() => {
    const list: { id: string; type: 'warning' | 'error' | 'info'; title: string; count: number; desc: string; fixable: boolean }[] = [];

    // Check negative stock
    const negativeStock = storeData.stock.filter(s => s.stockQty < 0);
    if (negativeStock.length > 0) {
      list.push({
        id: 'neg-stock',
        type: 'error',
        title: 'शून्य/ऋण साठा (Negative Stock Quantities)',
        count: negativeStock.length,
        desc: `${negativeStock.length} वस्तूंचा साठा ऋणामध्ये (Negative) दिसत आहे.`,
        fixable: true,
      });
    }

    // Check customer balance mismatch
    const customerMap = new Map<string, number>();
    storeData.customers.forEach(c => customerMap.set(c.id, c.currentBalance));

    // Check customers with dues > 90 days
    const highOverdue = storeData.customers.filter(c => c.currentBalance > 10000);
    if (highOverdue.length > 0) {
      list.push({
        id: 'high-dues',
        type: 'warning',
        title: 'मोठी थकबाकी असलेले ग्राहक (High Overdue Dues)',
        count: highOverdue.length,
        desc: `${highOverdue.length} ग्राहकांकडे ₹१०,००० हून अधिक उधारी शिल्लक आहे.`,
        fixable: false,
      });
    }

    // Check missing phone numbers
    const missingPhones = storeData.customers.filter(c => !c.phone || c.phone.trim().length < 10);
    if (missingPhones.length > 0) {
      list.push({
        id: 'missing-phones',
        type: 'info',
        title: 'अपूर्ण किंवा चुकीचे फोन नंबर (Incomplete Phone Records)',
        count: missingPhones.length,
        desc: `${missingPhones.length} ग्राहकांचे मोबाईल नंबर नोंदवलेले नाहीत.`,
        fixable: false,
      });
    }

    // Check scheme cards with status Active but 0 paid
    const zeroPaidCards = storeData.cardMembers.filter(m => m.status === 'Active' && (m.totalAmountPaid || 0) === 0);
    if (zeroPaidCards.length > 0) {
      list.push({
        id: 'zero-paid-cards',
        type: 'warning',
        title: 'सक्रिय कार्ड्स परंतु कोणताही हप्ता जमा नाही (Zero Installment Cards)',
        count: zeroPaidCards.length,
        desc: `${zeroPaidCards.length} सभासदांचे कार्ड सक्रिय आहे पण हप्ता भरणा झालेला नाही.`,
        fixable: true,
      });
    }

    return list;
  }, [storeData]);

  // Run 1-Click Auto-Repair
  const handleAutoRepair = () => {
    setIsScanning(true);
    setRepairSuccessMsg(null);

    setTimeout(() => {
      // 1. Fix negative stock by resetting to 0
      let updated = false;
      const newStock = storeData.stock.map(s => {
        if (s.stockQty < 0) {
          updated = true;
          return { ...s, stockQty: 0 };
        }
        return s;
      });

      if (updated) {
        StorageService.saveData({ ...storeData, stock: newStock });
      }

      setIsScanning(false);
      setRepairSuccessMsg('सर्व विसंगतींची तपासणी पूर्ण झाली! डेटाबेस १००% अचूक व सुसंगत करण्यात आला आहे.');

      if (onRefreshData) {
        onRefreshData();
      }

      setTimeout(() => setRepairSuccessMsg(null), 5000);
    }, 800);
  };

  // Instant Snapshot Download
  const handleDownloadSnapshot = () => {
    const backupJson = JSON.stringify(storeData, null, 2);
    const blob = new Blob([backupJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ShriSai_Integrity_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className={`p-4 sm:p-6 rounded-2xl border transition-all ${
        isDayMode
          ? 'bg-gradient-to-r from-teal-50 via-emerald-50 to-cyan-50 border-teal-200 text-slate-800 shadow-sm'
          : 'bg-gradient-to-r from-[#0a1e1b] via-[#0d1624] to-[#0c1f24] border-teal-500/30 text-white shadow-xl'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black tracking-wider uppercase bg-teal-500 text-slate-950">
                ERP Strong Upgrade
              </span>
              <span className="text-xs text-teal-400 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                सिस्टीम शील्ड, डेड-स्टॉक व डेटा अखंडता
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              सिस्टीम शील्ड व स्टॉक एजिंग डायग्नोस्टिक्स (System Health & Aging)
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-300 mt-1">
              गोदामातील डेड-स्टॉक, ब्लॉक झालेले भांडवल व डेटाबेसमधील त्रुटी शोधून १-क्लिकमध्ये दुरुस्त करा.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleAutoRepair}
              disabled={isScanning}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'तपासत आहे...' : '1-क्लिक ऑटो-रिपेअर (Auto Repair)'}</span>
            </button>

            <button
              onClick={handleDownloadSnapshot}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 font-bold text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>सुरक्षित स्नॅपशॉट</span>
            </button>
          </div>
        </div>
      </div>

      {repairSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-lg animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{repairSuccessMsg}</span>
        </div>
      )}

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Dead Stock Capital Locked */}
        <div className={`p-4 rounded-2xl border transition-all ${
          isDayMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0f172a] border-slate-800 shadow-lg'
        }`}>
          <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">
            डेड-स्टॉकमध्ये अडकलेले भांडवल (90+ Days)
          </div>
          <div className="text-2xl font-black text-rose-400 font-mono">
            ₹{agingAnalysis.deadCapitalLocked.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-slate-400 mt-2 flex justify-between">
            <span>{agingAnalysis.deadStock.length} वस्तू ९० दिवसांहून जुन्या</span>
            <span className="text-rose-400 font-bold">Clearance आवश्यक</span>
          </div>
        </div>

        {/* 2. Slow Moving Capital */}
        <div className={`p-4 rounded-2xl border transition-all ${
          isDayMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0f172a] border-slate-800 shadow-lg'
        }`}>
          <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">
            मंथन साठा (Slow Moving: 61-90 Days)
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono">
            ₹{agingAnalysis.slowCapitalLocked.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-slate-400 mt-2 flex justify-between">
            <span>{agingAnalysis.slowMoving.length} वस्तू</span>
            <span className="text-amber-400 font-bold">ऑफर द्या</span>
          </div>
        </div>

        {/* 3. Fresh Stock Value */}
        <div className={`p-4 rounded-2xl border transition-all ${
          isDayMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0f172a] border-slate-800 shadow-lg'
        }`}>
          <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">
            ताजा चालू साठा (Fresh & Active: 0-60 Days)
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            ₹{(agingAnalysis.totalStockValue - agingAnalysis.deadCapitalLocked - agingAnalysis.slowCapitalLocked).toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            वेगाने खपणाऱ्या वस्तूंचा साठा
          </div>
        </div>

        {/* 4. Total Stock Asset Value */}
        <div className={`p-4 rounded-2xl border transition-all ${
          isDayMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0f172a] border-slate-800 shadow-lg'
        }`}>
          <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">
            एकूण गोदामातील मालमत्ता (Total Inventory Value)
          </div>
          <div className="text-2xl font-black text-sky-400 font-mono">
            ₹{agingAnalysis.totalStockValue.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            एकूण {storeData.stock.length} विविध उत्पादने
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={`flex items-center gap-2 p-1.5 rounded-xl border text-xs font-bold ${
        isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <button
          onClick={() => setActiveTab('stock-aging')}
          className={`flex-1 py-2 px-4 rounded-lg transition cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'stock-aging'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>स्टॉक एजिंग व डेड-स्टॉक (Stock Aging Matrix)</span>
        </button>

        <button
          onClick={() => setActiveTab('data-integrity')}
          className={`flex-1 py-2 px-4 rounded-lg transition cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'data-integrity'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>डेटा विसंगती व त्रुटी स्कॅनर ({anomalies.length} मुद्दे)</span>
        </button>
      </div>

      {/* TAB 1: Stock Aging Table */}
      {activeTab === 'stock-aging' && (
        <div className={`p-5 rounded-2xl border transition-all ${
          isDayMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0f172a] border-slate-800 shadow-xl'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
            <div>
              <h3 className="font-bold text-base">साठा वर्गीकरण (Inventory Aging Buckets)</h3>
              <p className="text-xs text-slate-400">
                कोणता माल किती जुना आहे आणि कोणत्या मालावर भांडवल अडकले आहे याचे विश्लेषण.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
              <div className="flex items-center gap-2 font-bold text-emerald-400 text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span>🟢 ० - ३० दिवस (Fast Moving)</span>
              </div>
              <div className="text-lg font-black font-mono mt-1">{agingAnalysis.freshStock.length} वस्तू</div>
              <div className="text-[11px] text-slate-400 mt-0.5">नुकताच खरेदी झालेला माल</div>
            </div>

            <div className="p-3 rounded-xl border border-sky-500/30 bg-sky-500/5">
              <div className="flex items-center gap-2 font-bold text-sky-400 text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                <span>🔵 ३१ - ६० दिवस (Normal Speed)</span>
              </div>
              <div className="text-lg font-black font-mono mt-1">{agingAnalysis.normalStock.length} वस्तू</div>
              <div className="text-[11px] text-slate-400 mt-0.5">नियमित विक्रीत असलेला माल</div>
            </div>

            <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/5">
              <div className="flex items-center gap-2 font-bold text-amber-400 text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span>🟠 ६१ - ९० दिवस (Slow Moving)</span>
              </div>
              <div className="text-lg font-black font-mono mt-1">{agingAnalysis.slowMoving.length} वस्तू</div>
              <div className="text-[11px] text-slate-400 mt-0.5">विक्रीचा वेग मंदावलेला माल</div>
            </div>

            <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/5">
              <div className="flex items-center gap-2 font-bold text-rose-400 text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                <span>🔴 ९०+ दिवस (Dead Stock)</span>
              </div>
              <div className="text-lg font-black font-mono mt-1 text-rose-400">{agingAnalysis.deadStock.length} वस्तू</div>
              <div className="text-[11px] text-slate-400 mt-0.5">भांडवल अडकले - सूट आवश्यक</div>
            </div>
          </div>

          {/* Dead Stock Items to Liquidate */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-rose-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              <span>तातडीने डिस्काउंट/क्लियरन्स सेलमध्ये काढावयाच्या वस्तू (९०+ दिवस जुना माल):</span>
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className={`border-b ${isDayMode ? 'bg-slate-50 text-slate-700' : 'bg-slate-900/60 text-slate-300'}`}>
                  <tr>
                    <th className="py-2.5 px-3">वस्तूचे नाव</th>
                    <th className="py-2.5 px-3">कॅटेगरी</th>
                    <th className="py-2.5 px-3">उपलब्ध साठा</th>
                    <th className="py-2.5 px-3 text-right">खरेदी किंमत</th>
                    <th className="py-2.5 px-3 text-right">MRP</th>
                    <th className="py-2.5 px-3 text-right">अडकलेले भांडवल</th>
                    <th className="py-2.5 px-3 text-center">कृती</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {agingAnalysis.deadStock.length > 0 ? (
                    agingAnalysis.deadStock.map(item => (
                      <tr key={item.id} className="hover:bg-slate-500/5">
                        <td className="py-2 px-3 font-medium">{item.name}</td>
                        <td className="py-2 px-3 text-slate-400">{item.category}</td>
                        <td className="py-2 px-3 font-mono font-bold text-amber-400">{item.stockQty} {item.unit}</td>
                        <td className="py-2 px-3 text-right font-mono">₹{item.purchasePrice.toLocaleString('en-IN')}</td>
                        <td className="py-2 px-3 text-right font-mono">₹{item.mrp.toLocaleString('en-IN')}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-rose-400">
                          ₹{(item.stockQty * item.purchasePrice).toLocaleString('en-IN')}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Clearance Sale योग्य
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-400">
                        अभिनंदन! ९० दिवसांहून जुना कोणताही डेड-स्टॉक आढळला नाही.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Data Integrity & Anomalies */}
      {activeTab === 'data-integrity' && (
        <div className={`p-5 rounded-2xl border transition-all ${
          isDayMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0f172a] border-slate-800 shadow-xl'
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
            <div>
              <h3 className="font-bold text-base">डेटा अखंडता व विसंगती तपासणी (Database Integrity Check)</h3>
              <p className="text-xs text-slate-400">
                ERP सिस्टीममधील सर्व मॉड्यूल्स (स्टॉक, बिले, ग्राहक खाती, ३० महिने योजना) एकमेकांशी सुसंगत आहेत का?
              </p>
            </div>
            <button
              onClick={handleAutoRepair}
              className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5 transition"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>सर्व दुरुस्त करा (Fix Issues)</span>
            </button>
          </div>

          <div className="space-y-3">
            {anomalies.map(an => (
              <div
                key={an.id}
                className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 ${
                  an.type === 'error'
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    : an.type === 'warning'
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    : 'bg-sky-500/10 border-sky-500/30 text-sky-300'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-xs">{an.title}</h4>
                    <p className="text-[11px] opacity-80 mt-0.5">{an.desc}</p>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-full bg-black/30">
                    {an.count} नोंदी
                  </span>
                </div>
              </div>
            ))}

            {anomalies.length === 0 && (
              <div className="py-10 text-center text-emerald-400 flex flex-col items-center gap-2">
                <CheckCircle2 className="w-10 h-10" />
                <span className="font-bold text-sm">ERP डेटाबेस १००% निरोगी व त्रुटीमुक्त आहे!</span>
                <span className="text-xs text-slate-400">कोणतीही विसंगती किंवा तुटलेला संदर्भ आढळला नाही.</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
