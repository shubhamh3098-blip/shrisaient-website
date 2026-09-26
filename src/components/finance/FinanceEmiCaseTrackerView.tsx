import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Building2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
  FileCheck,
  ShieldCheck,
  Sparkles,
  Phone
} from 'lucide-react';
import { StoreData, FinanceCase } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { StorageService } from '../../services/storageService';

interface FinanceEmiCaseTrackerViewProps {
  storeData: StoreData;
  onRefreshData?: () => void;
}

export const FinanceEmiCaseTrackerView: React.FC<FinanceEmiCaseTrackerViewProps> = ({
  storeData,
  onRefreshData,
}) => {
  const { isDayMode } = useTheme();

  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Case Form
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [provider, setProvider] = useState<FinanceCase['provider']>('Bajaj Finserv');
  const [productName, setProductName] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState('35000');
  const [downPayment, setDownPayment] = useState('5000');
  const [tenureMonths, setTenureMonths] = useState('8');
  const [monthlyEmi, setMonthlyEmi] = useState('3750');
  const [dbdPercent, setDbdPercent] = useState('1.5');
  const [status, setStatus] = useState<FinanceCase['status']>('Approved');

  const cases = useMemo(() => {
    if (storeData.financeCases && storeData.financeCases.length > 0) {
      return storeData.financeCases;
    }
    // Default seed cases for Shri Sai Enterprises Wardha
    return [
      {
        id: 'fc-1',
        fileNo: 'BAJAJ-WDA-8821',
        customerName: 'प्रमोद कांबळे',
        customerPhone: '98224 55120',
        provider: 'Bajaj Finserv' as const,
        productName: 'LG 43" Smart 4K UHD LED TV',
        invoiceAmount: 32990,
        downPayment: 3990,
        loanAmount: 29000,
        tenureMonths: 8,
        monthlyEmi: 3625,
        dbdPercent: 1.5,
        status: 'Disbursed' as const,
        approvalDate: '2026-09-20',
        disbursedAmount: 28565,
        utrNo: 'CMS2026092004521',
      },
      {
        id: 'fc-2',
        fileNo: 'TVS-WDA-1042',
        customerName: 'सचिन मेश्राम (सावंगी)',
        customerPhone: '87664 12390',
        provider: 'TVS Credit' as const,
        productName: 'Whirlpool Double Door Refrigerator 265L',
        invoiceAmount: 28500,
        downPayment: 4500,
        loanAmount: 24000,
        tenureMonths: 6,
        monthlyEmi: 4000,
        dbdPercent: 2.0,
        status: 'Delivered' as const,
        approvalDate: '2026-09-24',
      },
      {
        id: 'fc-3',
        fileNo: 'HDB-WDA-3391',
        customerName: 'अमोल घोडमारे (वायफड)',
        customerPhone: '91755 88201',
        provider: 'HDB Financial' as const,
        productName: 'चंद्रपूर अस्सल सागवान दिवाण व गादी',
        invoiceAmount: 24000,
        downPayment: 4000,
        loanAmount: 20000,
        tenureMonths: 10,
        monthlyEmi: 2000,
        dbdPercent: 2.5,
        status: 'Underwriting' as const,
      },
    ];
  }, [storeData.financeCases]);

  // Filtered cases
  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      const matchesFilter = activeFilter === 'all' || c.status === activeFilter || c.provider === activeFilter;
      const matchesSearch =
        !searchQuery.trim() ||
        c.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.fileNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.customerPhone.includes(searchQuery);
      return matchesFilter && matchesSearch;
    });
  }, [cases, activeFilter, searchQuery]);

  // Summary Metrics
  const totalLoanValue = cases.reduce((acc, c) => acc + c.loanAmount, 0);
  const totalPendingDisbursal = cases
    .filter((c) => c.status === 'Approved' || c.status === 'Delivered')
    .reduce((acc, c) => acc + c.loanAmount, 0);

  // Update Status of a case
  const handleUpdateCaseStatus = (caseId: string, newStatus: FinanceCase['status'], utr?: string) => {
    const updated = cases.map((c) => {
      if (c.id === caseId) {
        return {
          ...c,
          status: newStatus,
          utrNo: utr || c.utrNo,
          disbursedAmount: newStatus === 'Disbursed' ? Math.round(c.loanAmount * (1 - (c.dbdPercent || 1.5) / 100)) : c.disbursedAmount,
        };
      }
      return c;
    });

    const updatedData: StoreData = {
      ...storeData,
      financeCases: updated,
    };

    StorageService.saveData(updatedData);
    if (onRefreshData) onRefreshData();
  };

  // Add Case
  const handleAddCase = () => {
    if (!customerName.trim() || !productName.trim()) return;

    const inv = parseFloat(invoiceAmount) || 0;
    const dp = parseFloat(downPayment) || 0;
    const loan = Math.max(0, inv - dp);

    const newCase: FinanceCase = {
      id: `fc-${Date.now()}`,
      fileNo: `${provider.slice(0, 3).toUpperCase()}-WDA-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      provider,
      productName: productName.trim(),
      invoiceAmount: inv,
      downPayment: dp,
      loanAmount: loan,
      tenureMonths: parseInt(tenureMonths) || 8,
      monthlyEmi: parseFloat(monthlyEmi) || Math.round(loan / 8),
      dbdPercent: parseFloat(dbdPercent) || 1.5,
      status,
      approvalDate: new Date().toISOString().slice(0, 10),
    };

    const updatedData: StoreData = {
      ...storeData,
      financeCases: [newCase, ...cases],
    };

    StorageService.saveData(updatedData);
    if (onRefreshData) onRefreshData();

    setIsAddModalOpen(false);
    setCustomerName('');
    setCustomerPhone('');
    setProductName('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div
        className={`p-4 sm:p-6 rounded-2xl border transition-all ${
          isDayMode
            ? 'bg-gradient-to-r from-sky-50 via-indigo-50 to-purple-50 border-sky-200 text-slate-800 shadow-sm'
            : 'bg-gradient-to-r from-[#0c182d] via-[#10142b] to-[#170e2b] border-sky-500/30 text-white shadow-xl'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black tracking-wider uppercase bg-sky-500 text-white">
                Finance & NBFC Pipeline
              </span>
              <span className="text-xs text-sky-400 font-semibold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                बजाज, TVS व HDB ईएमआय ट्रॅकर
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              फायनान्स ईएमआय केस ट्रॅकर व बँक सेटलमेंट (Finance EMI Pipeline & Disbursal)
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-300 mt-1">
              ग्राहकांच्या लोन फाइल्स, मंजुरी, डाऊनपेमेंट आणि बँकेकडून शोरूमच्या खात्यात जमा होणारी रक्कम (Disbursal) ट्रॅक करा.
            </p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>नवीन फायनान्स फाइल नोंदवा (+ New Case)</span>
          </button>
        </div>
      </div>

      {/* Top 3 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          className={`p-4 rounded-2xl border ${
            isDayMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0f172a] border-slate-800 shadow-lg'
          }`}
        >
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">
            बँकेकडून येणेबाकी सेटलमेंट (Pending Bank Disbursal)
          </span>
          <div className="text-2xl font-black text-amber-400 font-mono">
            ₹{totalPendingDisbursal.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-slate-400 mt-1">माल पोहोचवला पण बँकेचे पैसे येणे शिल्लक</p>
        </div>

        <div
          className={`p-4 rounded-2xl border ${
            isDayMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0f172a] border-slate-800 shadow-lg'
          }`}
        >
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">
            एकूण चालू लोन फाइल्स (Total Finance Portfolio)
          </span>
          <div className="text-2xl font-black text-sky-400 font-mono">
            ₹{totalLoanValue.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-slate-400 mt-1">{cases.length} ग्राहकांनी फायनान्सवर खरेदी केली</p>
        </div>

        <div
          className={`p-4 rounded-2xl border ${
            isDayMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0f172a] border-slate-800 shadow-lg'
          }`}
        >
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">
            फायनान्स कंपन्या (Active Partners)
          </span>
          <div className="text-sm font-bold text-slate-300 mt-2 flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">Bajaj</span>
            <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">TVS Credit</span>
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">HDB</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          {['all', 'Approved', 'Delivered', 'Disbursed', 'Underwriting'].map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer border ${
                activeFilter === f
                  ? 'bg-sky-600 text-white border-sky-500'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              {f === 'all'
                ? 'सर्व फाइल्स'
                : f === 'Approved'
                ? 'मंजूर (Approved)'
                : f === 'Delivered'
                ? 'डिलिव्हरी झाली (Delivered)'
                : f === 'Disbursed'
                ? 'बँकेने पैसे दिले (Disbursed)'
                : 'तपासणीत (Underwriting)'}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ग्राहक किंवा फाइल क्र. शोधा..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border text-xs bg-black/5 dark:bg-black/30 border-slate-700 outline-none"
          />
        </div>
      </div>

      {/* Cases Directory */}
      <div className="space-y-3">
        {filteredCases.map((cs) => (
          <div
            key={cs.id}
            className={`p-4 rounded-2xl border transition-all ${
              isDayMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0f172a] border-slate-800 shadow-md'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-sky-400">{cs.fileNo}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300">
                    {cs.provider}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      cs.status === 'Disbursed'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : cs.status === 'Delivered'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-sky-500/20 text-sky-300'
                    }`}
                  >
                    {cs.status}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-white mt-1">{cs.customerName}</h3>
                <p className="text-xs text-slate-400">
                  {cs.productName} • फोन: <span className="font-mono text-slate-300">{cs.customerPhone}</span>
                </p>
              </div>

              {/* Finance Numbers */}
              <div className="flex items-center gap-6 text-xs text-right">
                <div>
                  <span className="text-slate-400 block text-[10px]">बिल / डाऊनपेमेंट</span>
                  <span className="font-mono font-bold text-slate-200">
                    ₹{cs.invoiceAmount.toLocaleString('en-IN')} (DP: ₹{cs.downPayment.toLocaleString('en-IN')})
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px]">लोन रक्कम व EMI</span>
                  <span className="font-mono font-bold text-sky-400">
                    ₹{cs.loanAmount.toLocaleString('en-IN')} (₹{cs.monthlyEmi} x {cs.tenureMonths}m)
                  </span>
                </div>

                {/* Status action buttons */}
                <div>
                  {cs.status === 'Approved' && (
                    <button
                      onClick={() => handleUpdateCaseStatus(cs.id, 'Delivered')}
                      className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs transition cursor-pointer"
                    >
                      डिलिव्हरी झाली (Mark Delivered)
                    </button>
                  )}
                  {cs.status === 'Delivered' && (
                    <button
                      onClick={() => {
                        const utr = prompt('बँक UTR क्रमांक किंवा ट्रान्झॅक्शन आयडी टाका:');
                        if (utr) handleUpdateCaseStatus(cs.id, 'Disbursed', utr);
                      }}
                      className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer"
                    >
                      पैसे बँकेत आले (Mark Disbursed)
                    </button>
                  )}
                  {cs.status === 'Disbursed' && (
                    <div className="text-[10px] text-emerald-400 font-mono">
                      ✓ UTR: {cs.utrNo || 'Settled'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0f172a] border border-slate-700 w-full max-w-lg rounded-3xl p-6 text-white shadow-2xl">
            <h3 className="font-bold text-base mb-4 flex items-center gap-2 text-sky-400">
              <Plus className="w-4 h-4" />
              <span>नवीन फायनान्स ईएमआय केस नोंदवा</span>
            </h3>

            <div className="space-y-3 text-xs mb-4">
              <div>
                <label className="block text-slate-400 mb-1">ग्राहकाचे नाव:</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">मोबाईल:</label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">फायनान्स कंपनी:</label>
                  <select
                    value={provider}
                    onChange={(e) => setProvider(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 outline-none"
                  >
                    <option value="Bajaj Finserv">Bajaj Finserv</option>
                    <option value="TVS Credit">TVS Credit</option>
                    <option value="HDB Financial">HDB Financial</option>
                    <option value="IDFC First">IDFC First</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">उत्पादन (Product):</label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="उदा. Samsung 32 Smart LED TV"
                  className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">बिल रक्कम:</label>
                  <input
                    type="number"
                    value={invoiceAmount}
                    onChange={(e) => setInvoiceAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">डाऊनपेमेंट (DP):</label>
                  <input
                    type="number"
                    value={downPayment}
                    onChange={(e) => setDownPayment(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">महिने (Tenure):</label>
                  <input
                    type="number"
                    value={tenureMonths}
                    onChange={(e) => setTenureMonths(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold transition cursor-pointer"
              >
                रद्द करा
              </button>
              <button
                onClick={handleAddCase}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition cursor-pointer"
              >
                सेव्ह करा
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
