import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Calculator,
  X,
  Printer,
  Share2,
  Copy,
  Check,
  Building2,
  Percent,
  Calendar,
  IndianRupee,
  CheckCircle2,
  Info,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  User,
  Phone,
  MapPin,
} from 'lucide-react';
import { BusinessSettings, Customer } from '../types';

export interface FinanceDetailsPayload {
  provider: string;
  customerName: string;
  customerPhone: string;
  customerVillage: string;
  productName: string;
  productPrice: number;
  downPayment: number;
  financedAmount: number;
  tenure: number;
  monthlyEmi: number;
  processingFee: number;
  advanceEmis: number;
  upfrontPaid: number;
}

interface FinanceCalculatorModalProps {
  settings: BusinessSettings;
  isOpen: boolean;
  onClose: () => void;
  initialAmount?: number;
  initialProductName?: string;
  initialCustomerName?: string;
  initialCustomerPhone?: string;
  initialCustomerVillage?: string;
  customers?: Customer[];
  onApplyToBill?: (financeDetails: FinanceDetailsPayload) => void;
}

export type FinanceProvider = 'bajaj' | 'tvs' | 'hdb' | 'idbi' | 'other';

interface SchemePreset {
  id: string;
  name: string;
  provider: FinanceProvider;
  tenure: number;
  advanceEmis: number;
  interestRate: number; // 0 for no-cost EMI
  defaultFee: number;
  description: string;
  popular?: boolean;
}

const SCHEME_PRESETS: SchemePreset[] = [
  {
    id: 'bajaj-8-0',
    name: 'Bajaj 8/0 Scheme (0% No-Cost EMI)',
    provider: 'bajaj',
    tenure: 8,
    advanceEmis: 0,
    interestRate: 0,
    defaultFee: 750,
    description: '८ महिने, ० अगाऊ हप्ता, ०% व्याज',
    popular: true,
  },
  {
    id: 'bajaj-10-2',
    name: 'Bajaj 10/2 Scheme (2 Advance EMIs)',
    provider: 'bajaj',
    tenure: 10,
    advanceEmis: 2,
    interestRate: 0,
    defaultFee: 850,
    description: '१० महिने, २ अगाऊ हप्ते डाऊन पेमेंट, ०% व्याज',
    popular: true,
  },
  {
    id: 'bajaj-12-4',
    name: 'Bajaj 12/4 Scheme (4 Advance EMIs)',
    provider: 'bajaj',
    tenure: 12,
    advanceEmis: 4,
    interestRate: 0,
    defaultFee: 999,
    description: '१२ महिने, ४ अगाऊ हप्ते डाऊन पेमेंट, ०% व्याज',
    popular: true,
  },
  {
    id: 'tvs-10-2',
    name: 'TVS Credit 10/2 Scheme',
    provider: 'tvs',
    tenure: 10,
    advanceEmis: 2,
    interestRate: 0,
    defaultFee: 800,
    description: '१० महिने, २ अगाऊ हप्ते, टीव्हीएस सुलभ हप्ता',
    popular: true,
  },
  {
    id: 'tvs-18-4',
    name: 'TVS Credit 18/4 Long Term',
    provider: 'tvs',
    tenure: 18,
    advanceEmis: 4,
    interestRate: 0,
    defaultFee: 1200,
    description: '१८ महिने मोठा कालावधी, ४ अगाऊ हप्ते',
  },
  {
    id: 'hdb-8-0',
    name: 'HDB Finance 8/0 No-Cost',
    provider: 'hdb',
    tenure: 8,
    advanceEmis: 0,
    interestRate: 0,
    defaultFee: 750,
    description: 'एचडीबी ८ महिने ० अगाऊ हप्ता',
    popular: true,
  },
  {
    id: 'hdb-12-3',
    name: 'HDB Finance 12/3 Scheme',
    provider: 'hdb',
    tenure: 12,
    advanceEmis: 3,
    interestRate: 0,
    defaultFee: 950,
    description: '१२ महिने, ३ अगाऊ हप्ते',
  },
  {
    id: 'idbi-12-interest',
    name: 'IDBI Bank 12-Month EMI (12% p.a.)',
    provider: 'idbi',
    tenure: 12,
    advanceEmis: 0,
    interestRate: 12,
    defaultFee: 500,
    description: 'आयडीबीआय बँक १२ महिने, १२% व्याज',
  },
  {
    id: 'idbi-24-interest',
    name: 'IDBI Bank 24-Month EMI (13.5% p.a.)',
    provider: 'idbi',
    tenure: 24,
    advanceEmis: 0,
    interestRate: 13.5,
    defaultFee: 650,
    description: '२ वर्षे कालावधी, १३.५% बँक व्याजदर',
  },
];

export const FinanceCalculatorModal: React.FC<FinanceCalculatorModalProps> = ({
  settings,
  isOpen,
  onClose,
  initialAmount = 25000,
  initialProductName = 'Samsung 43" Smart LED TV / Refrigerator',
  initialCustomerName = '',
  initialCustomerPhone = '',
  initialCustomerVillage = '',
  customers = [],
  onApplyToBill,
}) => {
  const [selectedProvider, setSelectedProvider] = useState<FinanceProvider>('bajaj');
  const [customerName, setCustomerName] = useState<string>(initialCustomerName);
  const [customerPhone, setCustomerPhone] = useState<string>(initialCustomerPhone);
  const [customerVillage, setCustomerVillage] = useState<string>(initialCustomerVillage);
  const [productName, setProductName] = useState(initialProductName);
  const [productPrice, setProductPrice] = useState<number>(initialAmount || 25000);
  const [cashDownPayment, setCashDownPayment] = useState<number>(0);
  const [tenureMonths, setTenureMonths] = useState<number>(10);
  const [advanceEmis, setAdvanceEmis] = useState<number>(2);
  const [interestRate, setInterestRate] = useState<number>(0);
  const [processingFee, setProcessingFee] = useState<number>(850);
  const [dbdCharge, setDbdCharge] = useState<number>(0);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('bajaj-10-2');
  const [copiedNotice, setCopiedNotice] = useState<string | null>(null);

  // Sync initial customer props if changed
  useEffect(() => {
    if (initialCustomerName) setCustomerName(initialCustomerName);
    if (initialCustomerPhone) setCustomerPhone(initialCustomerPhone);
    if (initialCustomerVillage) setCustomerVillage(initialCustomerVillage);
    if (initialAmount) setProductPrice(initialAmount);
    if (initialProductName) setProductName(initialProductName);
  }, [initialCustomerName, initialCustomerPhone, initialCustomerVillage, initialAmount, initialProductName]);

  // Isolate print and set body modal class
  useEffect(() => {
    if (!isOpen) return;
    document.body.classList.add('has-finance-modal');
    return () => {
      document.body.classList.remove('has-finance-modal');
      document.body.classList.remove('printing-finance');
    };
  }, [isOpen]);

  const handleSelectPreset = (preset: SchemePreset) => {
    setSelectedPresetId(preset.id);
    setSelectedProvider(preset.provider);
    setTenureMonths(preset.tenure);
    setAdvanceEmis(preset.advanceEmis);
    setInterestRate(preset.interestRate);
    setProcessingFee(preset.defaultFee);
  };

  // Calculations
  const calculations = useMemo(() => {
    const price = Math.max(0, Number(productPrice) || 0);
    const directDown = Math.min(price, Math.max(0, Number(cashDownPayment) || 0));
    const loanAmount = Math.max(0, price - directDown);
    const tenure = Math.max(1, Number(tenureMonths) || 1);
    const advEmis = Math.min(tenure, Math.max(0, Number(advanceEmis) || 0));
    const annualRate = Math.max(0, Number(interestRate) || 0);
    const fee = Math.max(0, Number(processingFee) || 0);
    const dbd = Math.max(0, Number(dbdCharge) || 0);

    let monthlyEmi = 0;
    let totalInterest = 0;

    if (annualRate === 0) {
      // 0% No Cost EMI
      monthlyEmi = Math.round(loanAmount / tenure);
      totalInterest = 0;
    } else {
      // Standard Reducing EMI Formula: E = P * r * (1+r)^n / ((1+r)^n - 1)
      const monthlyRate = annualRate / (12 * 100);
      const factor = Math.pow(1 + monthlyRate, tenure);
      monthlyEmi = Math.round((loanAmount * monthlyRate * factor) / (factor - 1));
      totalInterest = Math.max(0, monthlyEmi * tenure - loanAmount);
    }

    const advanceEmiAmount = advEmis * monthlyEmi;
    // Total upfront amount customer must pay today at shop:
    const upfrontPayableToday = directDown + advanceEmiAmount + fee + dbd;
    const remainingEmisCount = Math.max(0, tenure - advEmis);
    const totalPayableByCustomer = upfrontPayableToday + (remainingEmisCount * monthlyEmi);
    const totalExtraCost = totalPayableByCustomer - price;

    // Monthly Amortization Schedule
    const schedule = [];
    let balance = loanAmount;
    for (let i = 1; i <= tenure; i++) {
      const isAdvance = i <= advEmis;
      const interestPart = annualRate > 0 ? Math.round(balance * (annualRate / (12 * 100))) : 0;
      const principalPart = monthlyEmi - interestPart;
      balance = Math.max(0, balance - principalPart);

      schedule.push({
        month: i,
        emi: monthlyEmi,
        isAdvance,
        principal: principalPart,
        interest: interestPart,
        remainingBalance: balance,
      });
    }

    return {
      price,
      directDown,
      loanAmount,
      tenure,
      advEmis,
      annualRate,
      fee,
      dbd,
      monthlyEmi,
      totalInterest,
      advanceEmiAmount,
      upfrontPayableToday,
      remainingEmisCount,
      totalPayableByCustomer,
      totalExtraCost,
      schedule,
    };
  }, [productPrice, cashDownPayment, tenureMonths, advanceEmis, interestRate, processingFee, dbdCharge]);

  const providerNames: Record<FinanceProvider, { name: string; color: string; badge: string }> = {
    bajaj: { name: 'बजाज फायनान्स (Bajaj Finserv)', color: 'blue', badge: 'Bajaj Finance' },
    tvs: { name: 'टीव्हीएस क्रेडिट (TVS Credit)', color: 'emerald', badge: 'TVS Credit' },
    hdb: { name: 'एचडीबी फायनान्स (HDB Financial)', color: 'rose', badge: 'HDB Finance' },
    idbi: { name: 'आयडीबीआय बँक फायनान्स (IDBI Bank)', color: 'indigo', badge: 'IDBI Bank' },
    other: { name: 'इतर फायनान्स / एनबीएफसी (Custom)', color: 'slate', badge: 'Custom Finance' },
  };

  const handlePrint = () => {
    document.body.classList.add('printing-finance');
    const cleanUp = () => {
      document.body.classList.remove('printing-finance');
      window.removeEventListener('afterprint', cleanUp);
    };
    window.addEventListener('afterprint', cleanUp);
    setTimeout(() => {
      window.print();
      setTimeout(cleanUp, 1500);
    }, 60);
  };

  const handleShareWhatsApp = () => {
    const greeting = customerName ? `नमस्कार ${customerName} जी,\n\n` : '';
    const text = encodeURIComponent(
      greeting +
      `*${settings.businessName || 'SHRI SAI ENTERPRISES'}*\n` +
      `*फायनान्स ईएमआय कोटेशन (Finance EMI Quotation)*\n` +
      `--------------------------------\n` +
      (customerName ? `👤 ग्राहक: *${customerName}* ${customerPhone ? `(${customerPhone})` : ''}\n` : '') +
      `📦 वस्तूचे नाव: *${productName}*\n` +
      `💰 वस्तूची किंमत: *₹${calculations.price.toLocaleString()}*\n` +
      `🏢 फायनान्स: *${providerNames[selectedProvider].name}*\n` +
      `📋 योजना: *${tenureMonths}/${advanceEmis} स्कीम (${calculations.annualRate === 0 ? '0% No-Cost EMI' : `${calculations.annualRate}% व्याज`})*\n` +
      `--------------------------------\n` +
      `💵 *आज दुकानात भरावयाची एकूण रक्कम: ₹${calculations.upfrontPayableToday.toLocaleString()}*\n` +
      `   • डाऊन पेमेंट: ₹${calculations.directDown.toLocaleString()}\n` +
      `   • अगाऊ हप्ते (${calculations.advEmis}): ₹${calculations.advanceEmiAmount.toLocaleString()}\n` +
      `   • फाईल चार्ज / फी: ₹${(calculations.fee + calculations.dbd).toLocaleString()}\n` +
      `--------------------------------\n` +
      `✨ *दरमहा हप्ता (Monthly EMI): ₹${calculations.monthlyEmi.toLocaleString()} / महिना*\n` +
      `📅 कालावधी: *${calculations.remainingEmisCount} पुढील हप्ते* (एकूण ${calculations.tenure} महिने)\n` +
      `--------------------------------\n` +
      `📍 *${settings.businessName || 'SHRI SAI ENTERPRISES'}*\n` +
      `📞 संपर्क: ${settings.phone || '8766486915'}\n` +
      `आर्वी रोड, वर्धा. आजच भेट द्या!`
    );
    const cleanPhone = customerPhone ? customerPhone.replace(/[^0-9]/g, '') : '';
    const targetUrl = cleanPhone.length === 10
      ? `https://wa.me/91${cleanPhone}?text=${text}`
      : `https://wa.me/?text=${text}`;
    window.open(targetUrl, '_blank');
  };

  const handleCopyQuotation = () => {
    const text = 
      `${settings.businessName || 'SHRI SAI ENTERPRISES'} - Finance Quotation\n` +
      (customerName ? `Customer: ${customerName} (${customerPhone || '-'})\n` : '') +
      `Product: ${productName} (₹${calculations.price.toLocaleString()})\n` +
      `Provider: ${providerNames[selectedProvider].name}\n` +
      `Scheme: ${tenureMonths}/${advanceEmis} (${calculations.annualRate}% Rate)\n` +
      `Upfront Today: ₹${calculations.upfrontPayableToday.toLocaleString()}\n` +
      `Monthly EMI: ₹${calculations.monthlyEmi.toLocaleString()} x ${calculations.remainingEmisCount} Months\n` +
      `Contact: ${settings.phone || '8766486915'}`;

    navigator.clipboard.writeText(text);
    setCopiedNotice('कोटेशन क्लिपबोर्डवर कॉपी झाले!');
    setTimeout(() => setCopiedNotice(null), 3000);
  };

  if (!isOpen) return null;

  const modalContent = (
    <>
      {/* ================= SCREEN MODAL (HIDDEN DURING PRINT) ================= */}
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:hidden">
        <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-5xl w-full max-h-[94vh] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-fade-in">
          
          {/* Modal Header */}
          <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-base sm:text-lg tracking-tight">
                    फायनान्स ईएमआय कॅल्क्युलेटर (Finance EMI Calculator)
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950 uppercase tracking-wider">
                    Bajaj • TVS • HDB • IDBI
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  इलेक्ट्रॉनिक्स, फर्निचर व गृहोपयोगी वस्तूंसाठी अचूक हप्ता, डाऊन पेमेंट, थेट बिलाशी लिंक व प्रिंट
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition cursor-pointer"
                title="Print Quotation Slip"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>प्रिंट पावती (Print Slip)</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            
            {copiedNotice && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fade-in">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{copiedNotice}</span>
              </div>
            )}

            {/* Customer Details Box (Linked to Bill and Print Slip) */}
            <div className="bg-blue-50/70 dark:bg-blue-950/30 p-3 sm:p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-950 dark:text-blue-200 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>ग्राहक तपशील (Customer Details - बिलाशी थेट जोडण्यासाठी):</span>
                </h4>
                <span className="text-[11px] text-blue-700 dark:text-blue-300 font-medium">
                  येथे नाव व फोन नंबर भरल्यास थेट बिलामध्ये जोडले जाते व पावतीवर छापले जाते
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Customer Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-400" />
                    <span>ग्राहकाचे नाव (Customer Name)</span>
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="उदा. राहुल देशमुख / सचिन पाटील"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-xs bg-white dark:bg-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                {/* Customer Phone */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>मोबाईल नंबर (Mobile Number)</span>
                  </label>
                  <input
                    type="tel"
                    maxLength={10}
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="उदा. 9876543210"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-xs bg-white dark:bg-slate-900 font-mono font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                {/* Customer Village */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>गाव / पत्ता (Village / City)</span>
                  </label>
                  <input
                    type="text"
                    value={customerVillage}
                    onChange={(e) => setCustomerVillage(e.target.value)}
                    placeholder="उदा. वर्धा / सेलू / आर्वी"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-xs bg-white dark:bg-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* 1. Finance Company Selector Bar */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                १. फायनान्स कंपनी निवडा (Select Finance Partner):
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {(['bajaj', 'tvs', 'hdb', 'idbi', 'other'] as FinanceProvider[]).map((prov) => {
                  const isSelected = selectedProvider === prov;
                  return (
                    <button
                      key={prov}
                      type="button"
                      onClick={() => {
                        setSelectedProvider(prov);
                        const firstPreset = SCHEME_PRESETS.find((p) => p.provider === prov);
                        if (firstPreset) handleSelectPreset(firstPreset);
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100 ring-2 ring-blue-500/20 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="text-xs font-black truncate">{providerNames[prov].badge}</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                        {prov === 'bajaj' ? 'बजाज फायनान्स' : prov === 'tvs' ? 'TVS क्रेडिट' : prov === 'hdb' ? 'HDB फायनान्स' : prov === 'idbi' ? 'IDBI बँक' : 'इतर फायनान्स'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Popular Preset Schemes for Selected Provider */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>लोकप्रिय ईएमआय योजना (Select Scheme Preset):</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {SCHEME_PRESETS.filter((p) => p.provider === selectedProvider).map((preset) => {
                  const isSelected = selectedPresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer relative ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50/80 dark:bg-amber-950/40 text-amber-950 dark:text-amber-100 ring-2 ring-amber-400/30'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {preset.popular && (
                        <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-600 text-white">
                          HOT
                        </span>
                      )}
                      <span className="text-xs font-bold block">{preset.name}</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                        {preset.description}
                      </span>
                      <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 mt-1 block">
                        कालावधी: {preset.tenure} महिने • {preset.advanceEmis} अगाऊ हप्ते • फी ₹{preset.defaultFee}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Calculate Parameters Inputs */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                हिशोब तपशील (Calculate Parameters):
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Product Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    वस्तूचे नाव / मॉडेल (Product Name / Model)
                  </label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="उदा. Samsung 43 LED TV, LG Refrigerator, Wooden Bed"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-xs bg-white dark:bg-slate-900 font-medium"
                  />
                </div>

                {/* Product Price */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    वस्तूची किंमत (Price ₹) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">₹</span>
                    <input
                      type="number"
                      min="1000"
                      step="100"
                      value={productPrice}
                      onChange={(e) => setProductPrice(Number(e.target.value))}
                      className="w-full pl-7 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-xs font-bold font-mono bg-white dark:bg-slate-900"
                    />
                  </div>
                </div>

                {/* Direct Cash Down Payment */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    थेट डाऊन पेमेंट (Cash Down Payment ₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="500"
                      value={cashDownPayment}
                      onChange={(e) => setCashDownPayment(Number(e.target.value))}
                      className="w-full pl-7 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-xs font-mono bg-white dark:bg-slate-900"
                    />
                  </div>
                </div>

                {/* Tenure Months */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    एकूण कालावधी (Tenure Months)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="36"
                    value={tenureMonths}
                    onChange={(e) => setTenureMonths(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-xs font-mono bg-white dark:bg-slate-900"
                  />
                </div>

                {/* Advance EMIs */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    अगाऊ हप्ते (Advance EMIs Count)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={tenureMonths}
                    value={advanceEmis}
                    onChange={(e) => setAdvanceEmis(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-xs font-mono bg-white dark:bg-slate-900"
                  />
                </div>

                {/* Processing Fee */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    फाईल चार्ज / प्रक्रिया फी (Processing Fee ₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={processingFee}
                      onChange={(e) => setProcessingFee(Number(e.target.value))}
                      className="w-full pl-7 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-xs font-mono bg-white dark:bg-slate-900"
                    />
                  </div>
                </div>

                {/* Interest Rate */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    वार्षिक व्याजदर (Interest Rate % p.a.)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={interestRate}
                      onChange={(e) => setInterestRate(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-xs font-mono bg-white dark:bg-slate-900"
                    />
                    <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">%</span>
                  </div>
                </div>

                {/* DBD / Dealer Buy Down */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    DBD / इतर अतिरिक्त शुल्क (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={dbdCharge}
                    onChange={(e) => setDbdCharge(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-xs font-mono bg-white dark:bg-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* 4. Calculated Financial Result Dashboard (4 Prominent Cards) */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                अंतिम हिशोब व हप्ता तपशील (Calculated Financial Summary):
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                
                {/* Card 1: Monthly EMI */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-md">
                  <span className="text-[11px] font-semibold text-blue-100 block">
                    दरमहा हप्ता (Monthly EMI)
                  </span>
                  <span className="text-2xl font-black font-mono mt-1 block">
                    ₹{calculations.monthlyEmi.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-blue-200 mt-1 block font-medium">
                    पुढील {calculations.remainingEmisCount} महिने भरावयाचे
                  </span>
                </div>

                {/* Card 2: Total Upfront Today */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md">
                  <span className="text-[11px] font-semibold text-amber-100 block">
                    आज तात्काळ भरावयाची रक्कम (Pay Today)
                  </span>
                  <span className="text-2xl font-black font-mono mt-1 block">
                    ₹{calculations.upfrontPayableToday.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-amber-100 mt-1 block font-medium">
                    DP (₹{calculations.directDown}) + अगाऊ हप्ते (₹{calculations.advanceEmiAmount}) + फी
                  </span>
                </div>

                {/* Card 3: Net Loan Amount */}
                <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                    कर्ज रक्कम (Financed Loan Amount)
                  </span>
                  <span className="text-2xl font-black font-mono mt-1 block text-slate-900 dark:text-white">
                    ₹{calculations.loanAmount.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                    किंमत ₹{calculations.price.toLocaleString()} मधून DP वजा
                  </span>
                </div>

                {/* Card 4: Total Cost to Customer */}
                <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                    एकूण ग्राहक खर्च (Total Paid by Customer)
                  </span>
                  <span className="text-2xl font-black font-mono mt-1 block text-emerald-600 dark:text-emerald-400">
                    ₹{calculations.totalPayableByCustomer.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                    अतिरिक्त खर्च: ₹{calculations.totalExtraCost.toLocaleString()} (व्याज+फी)
                  </span>
                </div>
              </div>
            </div>

            {/* 5. Action Buttons Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition active:scale-95"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>WhatsApp वर कोटेशन पाठवा</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyQuotation}
                  className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition active:scale-95"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>हिशोब कॉपी करा</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition hover:bg-slate-50 active:scale-95"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>प्रिंट पावती (Print Slip)</span>
                </button>
              </div>

              {onApplyToBill && (
                <button
                  type="button"
                  onClick={() => {
                    onApplyToBill({
                      provider: providerNames[selectedProvider].name,
                      customerName,
                      customerPhone,
                      customerVillage,
                      productName,
                      productPrice: calculations.price,
                      downPayment: calculations.directDown,
                      financedAmount: calculations.loanAmount,
                      tenure: calculations.tenure,
                      monthlyEmi: calculations.monthlyEmi,
                      processingFee: calculations.fee + calculations.dbd,
                      advanceEmis: calculations.advEmis,
                      upfrontPaid: calculations.upfrontPayableToday,
                    });
                    onClose();
                  }}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition active:scale-95"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>बिलामध्ये फायनान्स तपशील भरा (Apply to Bill)</span>
                </button>
              )}
            </div>

            {/* 6. Repayment Schedule Table (Amortization) */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                हप्त्यांचे वेळापत्रक (Month-by-Month EMI Schedule):
              </h4>
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-2.5 px-3">हप्ता क्र. (Month)</th>
                      <th className="py-2.5 px-3">प्रकार (Type)</th>
                      <th className="py-2.5 px-3 text-right">हप्ता रक्कम (EMI ₹)</th>
                      <th className="py-2.5 px-3 text-right">मुद्दल (Principal ₹)</th>
                      {calculations.annualRate > 0 && <th className="py-2.5 px-3 text-right">व्याज (Interest ₹)</th>}
                      <th className="py-2.5 px-3 text-right">शिल्लक कर्ज (Balance ₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                    {calculations.schedule.map((row) => (
                      <tr
                        key={row.month}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                          row.isAdvance ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''
                        }`}
                      >
                        <td className="py-2 px-3 font-bold font-sans">
                          Month #{row.month}
                        </td>
                        <td className="py-2 px-3">
                          {row.isAdvance ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
                              अगाऊ हप्ता (Advance)
                            </span>
                          ) : (
                            <span className="text-slate-600 dark:text-slate-400 font-sans">
                              नियमित बँक ईएमआय
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900 dark:text-white">
                          ₹{row.emi.toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-600 dark:text-slate-300">
                          ₹{row.principal.toLocaleString()}
                        </td>
                        {calculations.annualRate > 0 && (
                          <td className="py-2 px-3 text-right text-rose-600 dark:text-rose-400">
                            ₹{row.interest.toLocaleString()}
                          </td>
                        )}
                        <td className="py-2 px-3 text-right font-bold text-slate-700 dark:text-slate-300">
                          ₹{row.remainingBalance.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Modal Footer */}
          <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 shrink-0">
            <span>
              {settings.businessName} • फायनान्स कॅल्क्युलेटर व ग्राहक कोटेशन प्रणाली
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-bold hover:bg-slate-100 cursor-pointer"
            >
              बंद करा (Close)
            </button>
          </div>

        </div>
      </div>

      {/* ================= DEDICATED OFFICIAL PRINT SLIP (A4 SINGLE PAGE) ================= */}
      <div id="printable-finance-slip" className="hidden print:block font-sans text-black w-full bg-white leading-normal p-4">
        {/* 1. Official Header */}
        <div className="border-b-2 border-slate-900 pb-2 mb-3">
          <div className="flex justify-between items-start">
            <div className="space-y-0.5">
              <h1 className="text-xl font-black tracking-tight text-slate-950 uppercase">
                {settings.businessName || 'SHRI SAI ENTERPRISES'}
              </h1>
              <p className="text-xs font-semibold text-slate-800">
                इलेक्ट्रॉनिक्स, फर्निचर & होम अप्लायन्सेस दालन (SHOWROOM)
              </p>
              <p className="text-[11px] text-slate-600">
                {settings.address || 'मातोश्री सभागृहासमोर, आर्वी रोड, पंजाब कॉलनी, वर्धा - ४४२००१'} • मो.: {settings.phone || '8766486915, 8600122978'}
              </p>
              {settings.gstin && (
                <p className="text-[10px] font-mono text-slate-600">GSTIN: {settings.gstin}</p>
              )}
            </div>

            <div className="border-2 border-slate-900 p-2 rounded text-right min-w-[170px] bg-slate-50">
              <span className="text-[10px] block font-bold text-slate-600 uppercase tracking-wider">
                कोटेशन क्र. (QUOTATION NO.)
              </span>
              <span className="text-base font-black font-mono block text-slate-950">
                SSE/FIN/{Date.now().toString().slice(-6)}
              </span>
              <div className="text-[11px] font-bold text-slate-800 mt-0.5">
                दिनांक: {new Date().toLocaleDateString('mr-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </div>
            </div>
          </div>

          <div className="mt-2 pt-1.5 border-t border-slate-300 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-900 uppercase tracking-wide bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
              अधिकृत फायनान्स ईएमआय अंदाजपत्रक / कोटेशन पावती (Finance EMI Quotation & Estimate Slip)
            </span>
            <span className="text-slate-700 font-bold text-[11px]">
              पार्टनर: {providerNames[selectedProvider].name}
            </span>
          </div>
        </div>

        {/* 2. Customer & Product Details Box */}
        <div className="border border-slate-400 rounded-md p-2.5 mb-3 bg-slate-50 text-xs">
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
            <div>
              <span className="text-slate-500 font-medium">ग्राहकाचे नाव:</span>{' '}
              <strong className="text-slate-900 text-sm">{customerName || 'सन्माननीय ग्राहक'}</strong>
            </div>
            <div>
              <span className="text-slate-500 font-medium">मोबाईल क्र.:</span>{' '}
              <strong className="text-slate-900 font-mono">{customerPhone || 'उपलब्ध नाही'}</strong>
            </div>
            <div>
              <span className="text-slate-500 font-medium">गाव / पत्ता:</span>{' '}
              <strong className="text-slate-900">{customerVillage || 'वर्धा'}</strong>
            </div>
            <div>
              <span className="text-slate-500 font-medium">वस्तूचे नाव / मॉडेल:</span>{' '}
              <strong className="text-slate-900">{productName}</strong>
            </div>
          </div>
        </div>

        {/* 3. Four Highlighted Financial KPI Boxes */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          <div className="border-2 border-slate-900 p-2 rounded-md bg-slate-100">
            <span className="text-[10px] font-black text-slate-900 block uppercase">
              १. आज तात्काळ भरावयाची रक्कम
            </span>
            <span className="text-lg font-black font-mono block text-slate-950 mt-0.5">
              ₹{calculations.upfrontPayableToday.toLocaleString()}
            </span>
            <span className="text-[9px] font-bold text-slate-700 block">
              DP + अगाऊ हप्ते + फी (Pay Today)
            </span>
          </div>

          <div className="border-2 border-slate-900 p-2 rounded-md bg-slate-100">
            <span className="text-[10px] font-black text-slate-900 block uppercase">
              २. दरमहा हप्ता (Monthly EMI)
            </span>
            <span className="text-lg font-black font-mono block text-slate-950 mt-0.5">
              ₹{calculations.monthlyEmi.toLocaleString()}
            </span>
            <span className="text-[9px] font-bold text-slate-700 block">
              पुढील {calculations.remainingEmisCount} महिने भरावयाचे
            </span>
          </div>

          <div className="border border-slate-400 p-2 rounded-md bg-white">
            <span className="text-[10px] font-bold text-slate-600 block uppercase">
              ३. मंजूर कर्ज रक्कम (Loan)
            </span>
            <span className="text-base font-black font-mono block text-slate-950 mt-0.5">
              ₹{calculations.loanAmount.toLocaleString()}
            </span>
            <span className="text-[9px] text-slate-500 block">
              Financed Amount
            </span>
          </div>

          <div className="border border-slate-400 p-2 rounded-md bg-white">
            <span className="text-[10px] font-bold text-slate-600 block uppercase">
              ४. योजना / कालावधी
            </span>
            <span className="text-base font-black font-mono block text-slate-950 mt-0.5">
              {calculations.tenure} महिने
            </span>
            <span className="text-[9px] text-slate-500 block">
              {calculations.advEmis} अगाऊ हप्ते ({calculations.annualRate === 0 ? '0% No-Cost' : `${calculations.annualRate}%`})
            </span>
          </div>
        </div>

        {/* 4. Complete Financial Breakdown Table */}
        <div className="border border-slate-400 rounded-md p-2.5 mb-3 bg-white text-xs">
          <div className="font-bold text-slate-900 border-b border-slate-300 pb-1 mb-2 uppercase text-[11px]">
            तपशीलवार हिशोब (Financial Cost Breakdown):
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
            <div className="flex justify-between py-0.5 border-b border-slate-200">
              <span className="text-slate-600">वस्तूची एकूण मूळ किंमत (Product Price):</span>
              <span className="font-mono font-bold">₹{calculations.price.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-slate-200">
              <span className="text-slate-600">थेट डाऊन पेमेंट (Cash Down Payment):</span>
              <span className="font-mono font-bold">₹{calculations.directDown.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-slate-200">
              <span className="text-slate-600">अगाऊ हप्ते रक्कम ({calculations.advEmis} x ₹{calculations.monthlyEmi.toLocaleString()}):</span>
              <span className="font-mono font-bold">₹{calculations.advanceEmiAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-slate-200">
              <span className="text-slate-600">फाईल चार्ज / प्रक्रिया फी (Processing Fee):</span>
              <span className="font-mono font-bold">₹{(calculations.fee + calculations.dbd).toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-slate-200 font-bold bg-slate-50 px-1 rounded">
              <span className="text-slate-900">आज एकूण रोख भरणा (Total Upfront Today):</span>
              <span className="font-mono text-slate-950 font-black">₹{calculations.upfrontPayableToday.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-slate-200 font-bold bg-slate-50 px-1 rounded">
              <span className="text-slate-900">एकूण ग्राहक खर्च (Total Paid by Customer):</span>
              <span className="font-mono text-slate-950 font-black">₹{calculations.totalPayableByCustomer.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* 5. Compact Repayment Schedule Table */}
        <div className="mb-3">
          <div className="font-bold text-slate-900 mb-1 text-xs uppercase">
            हप्त्यांचे वेळापत्रक (Month-by-Month EMI Repayment Schedule):
          </div>
          <table className="w-full text-left border-collapse border border-slate-400 text-xs">
            <thead>
              <tr className="bg-slate-200 font-bold border-b border-slate-500">
                <th className="p-1 border border-slate-400 text-center w-[12%]">हप्ता क्र.</th>
                <th className="p-1 border border-slate-400 w-[30%]">प्रकार</th>
                <th className="p-1 border border-slate-400 text-right w-[25%]">हप्ता रक्कम (EMI ₹)</th>
                <th className="p-1 border border-slate-400 text-right w-[33%]">शिल्लक मुद्दल कर्ज (₹)</th>
              </tr>
            </thead>
            <tbody>
              {calculations.schedule.map((r) => (
                <tr key={r.month} className="border-b border-slate-200">
                  <td className="p-1 border border-slate-300 text-center font-mono font-bold text-[11px]">
                    महिना #{r.month}
                  </td>
                  <td className="p-1 border border-slate-300 text-[11px]">
                    {r.isAdvance ? 'अगाऊ हप्ता (दुकानात भरलेला)' : 'नियमित बँक ईएमआय (खात्यातून)'}
                  </td>
                  <td className="p-1 border border-slate-300 text-right font-mono font-bold text-[11px]">
                    ₹{r.emi.toLocaleString()}
                  </td>
                  <td className="p-1 border border-slate-300 text-right font-mono text-[11px]">
                    ₹{r.remainingBalance.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 6. Terms, Required Documents and Dual Signatures */}
        <div className="pt-2 border-t border-slate-400 mt-2 text-xs">
          <div className="bg-slate-50 border border-slate-300 p-2 rounded text-[10px] text-slate-700 space-y-0.5 mb-5">
            <p><strong>आवश्यक कागदपत्रे:</strong> १. आधार कार्ड २. पॅन कार्ड ३. बँक पासबुक किंवा कॅन्सल चेक ४. आधार लिंक मोबाईल नंबर.</p>
            <p><strong>टीप:</strong> १. हे केवळ प्राथमिक अंदाजपत्रक / कोटेशन आहे. २. फायनान्स मंजुरी व प्रत्यक्ष हप्त्याची तारीख फायनान्स कंपनीच्या नियमांवर अवलंबून राहील.</p>
          </div>

          <div className="flex justify-between items-end px-4 text-xs font-bold pt-4">
            <div className="text-center min-w-[160px] border-t border-slate-700 pt-1">
              <span>ग्राहकाची स्वाक्षरी</span>
              <span className="block text-[10px] font-normal text-slate-500">(Customer Signature)</span>
            </div>

            <div className="text-center min-w-[200px] border-t border-slate-700 pt-1">
              <span>श्री साई एंटरप्रायझेस करिता</span>
              <span className="block text-[10px] font-normal text-slate-500">(Authorized Signatory / Stamp)</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
};
