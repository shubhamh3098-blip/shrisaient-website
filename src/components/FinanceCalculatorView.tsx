import React, { useState, useMemo, useEffect } from 'react';
import {
  Calculator,
  Share2,
  Printer,
  Sparkles,
  Percent,
  Calendar,
  CheckCircle2,
  FileText,
  Phone,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Building2,
  Layers,
  HelpCircle,
  TrendingDown,
  RotateCcw,
  Clock,
  Zap,
  Copy,
  Check,
  MessageSquare,
  Send,
} from 'lucide-react';
import { BusinessSettings } from '../types';
import {
  FINANCE_PARTNERS,
  POPULAR_SCHEMES,
  APPLIANCE_PRESETS,
  FinancePartnerId,
  calculateFinanceTerms,
  FinanceCalculationInput,
  generateEmiScheduleWhatsAppText,
} from '../utils/financeCalculator';
import { getSafeWhatsAppUrl } from '../utils/numbering';

interface FinanceCalculatorViewProps {
  settings: BusinessSettings;
  onNavigateBack?: () => void;
  initialProductPrice?: number;
  initialProductName?: string;
  initialCustomerName?: string;
  initialCustomerPhone?: string;
  initialPartnerId?: FinancePartnerId;
  initialTab?: 'calculator' | 'comparison' | 'schedule' | 'documents';
}

export const FinanceCalculatorView: React.FC<FinanceCalculatorViewProps> = ({
  settings,
  onNavigateBack,
  initialProductPrice = 25000,
  initialProductName = 'Smart LED TV 43" 4K',
  initialCustomerName = '',
  initialCustomerPhone = '',
  initialPartnerId = 'bajaj',
  initialTab = 'calculator',
}) => {
  const [selectedPartnerId, setSelectedPartnerId] = useState<FinancePartnerId>(initialPartnerId);
  const [productName, setProductName] = useState<string>(initialProductName);
  const [productPrice, setProductPrice] = useState<number>(initialProductPrice);
  const [selectedSchemeId, setSelectedSchemeId] = useState<string>('10/2');
  const [customTenure, setCustomTenure] = useState<number>(10);
  const [customAdvanceEmis, setCustomAdvanceEmis] = useState<number>(2);
  const [isNoCost, setIsNoCost] = useState<boolean>(true);
  const [interestRate, setInterestRate] = useState<number>(0);
  const [extraDownPayment, setExtraDownPayment] = useState<number>(0);
  const [processingFee, setProcessingFee] = useState<number>(FINANCE_PARTNERS[initialPartnerId]?.defaultProcessingFee || 799);
  const [insuranceAmount, setInsuranceAmount] = useState<number>(0);
  const [dbdPercent, setDbdPercent] = useState<number>(0);
  const [dbdAmount, setDbdAmount] = useState<number>(0);

  // Customer details for formal quotation & direct schedule sending
  const [customerName, setCustomerName] = useState<string>(initialCustomerName);
  const [customerPhone, setCustomerPhone] = useState<string>(initialCustomerPhone);

  // Date and EMI Due Day settings
  const [startDate, setStartDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [emiDueDay, setEmiDueDay] = useState<number>(5);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  // Active sub-tab
  const [activeTab, setActiveTab] = useState<'calculator' | 'comparison' | 'schedule' | 'documents'>(initialTab);

  // Sync state if props change
  useEffect(() => {
    if (initialCustomerName) setCustomerName(initialCustomerName);
    if (initialCustomerPhone) setCustomerPhone(initialCustomerPhone);
    if (initialProductName) setProductName(initialProductName);
    if (initialProductPrice) setProductPrice(initialProductPrice);
    if (initialPartnerId) setSelectedPartnerId(initialPartnerId);
    if (initialTab) setActiveTab(initialTab);
  }, [initialCustomerName, initialCustomerPhone, initialProductName, initialProductPrice, initialPartnerId, initialTab]);

  // When partner changes, update processing fee default
  const handleSelectPartner = (partnerId: FinancePartnerId) => {
    setSelectedPartnerId(partnerId);
    setProcessingFee(FINANCE_PARTNERS[partnerId].defaultProcessingFee);
  };

  // When scheme changes, update tenure & advance EMIs
  const handleSelectScheme = (schemeId: string) => {
    setSelectedSchemeId(schemeId);
    const scheme = POPULAR_SCHEMES.find((s) => s.id === schemeId);
    if (scheme) {
      setCustomTenure(scheme.tenureMonths);
      setCustomAdvanceEmis(scheme.advanceEmis);
      setIsNoCost(scheme.isNoCost);
      setInterestRate(scheme.defaultInterestRate);
    }
  };

  // When appliance preset selected
  const handleSelectPreset = (preset: typeof APPLIANCE_PRESETS[0]) => {
    setProductName(preset.name);
    setProductPrice(preset.price);
  };

  // Main calculation input
  const calculationInput: FinanceCalculationInput = useMemo(() => {
    return {
      partnerId: selectedPartnerId,
      productName,
      productPrice: Math.max(1000, Number(productPrice) || 0),
      schemeId: selectedSchemeId,
      tenureMonths: Math.max(1, Number(customTenure) || 1),
      advanceEmis: Math.max(0, Number(customAdvanceEmis) || 0),
      isNoCost,
      interestRate: Number(interestRate) || 0,
      extraDownPayment: Math.max(0, Number(extraDownPayment) || 0),
      processingFee: Math.max(0, Number(processingFee) || 0),
      insuranceAmount: Math.max(0, Number(insuranceAmount) || 0),
      dbdPercent: Math.max(0, Number(dbdPercent) || 0),
      dbdAmount: Math.max(0, Number(dbdAmount) || 0),
      customerName,
      customerPhone,
      startDate,
      emiDueDay,
    };
  }, [
    selectedPartnerId,
    productName,
    productPrice,
    selectedSchemeId,
    customTenure,
    customAdvanceEmis,
    isNoCost,
    interestRate,
    extraDownPayment,
    processingFee,
    insuranceAmount,
    dbdPercent,
    dbdAmount,
    customerName,
    customerPhone,
    startDate,
    emiDueDay,
  ]);

  const result = useMemo(() => {
    return calculateFinanceTerms(calculationInput);
  }, [calculationInput]);

  // Comparison between all 4 partners for the same product & scheme
  const comparisonResults = useMemo(() => {
    const partners: FinancePartnerId[] = ['bajaj', 'tvs', 'idbi', 'hdb'];
    return partners.map((pId) => {
      const p = FINANCE_PARTNERS[pId];
      const res = calculateFinanceTerms({
        ...calculationInput,
        partnerId: pId,
        processingFee: p.defaultProcessingFee,
      });
      return {
        partner: p,
        result: res,
      };
    });
  }, [calculationInput]);

  // WhatsApp Share Handler
  const handleShareWhatsApp = () => {
    const p = FINANCE_PARTNERS[selectedPartnerId];
    const text = encodeURIComponent(
      `*${settings.businessName}*\n` +
      `*अधिकृत फायनान्स व ईएमआय कोटेशन (Official Finance Quotation)*\n` +
      `--------------------------------\n` +
      (customerName ? `ग्राहक नाव: *${customerName}*\n` : '') +
      `उत्पादन: *${productName}*\n` +
      `किंमत: *₹${result.productPrice.toLocaleString('en-IN')}*\n` +
      `फायनान्स पार्टनर: *${p.marathiName}*\n` +
      `योजना / कालावधी: *${result.tenureMonths} महिने (${result.advanceEmis > 0 ? `${result.advanceEmis} आगाऊ हप्ते + ${result.remainingMonths} मासिक` : 'समान मासिक हप्ते'})*\n` +
      `--------------------------------\n` +
      `💰 *मासिक हप्ता (Monthly EMI): ₹${result.monthlyEmi.toLocaleString('en-IN')} / महिना*\n` +
      `💳 *सुरुवातीला डाऊन पेमेंट: ₹${result.totalDownPayment.toLocaleString('en-IN')}*\n` +
      `   (हप्ता ॲडव्हान्स: ₹${result.advanceEmisTotal.toLocaleString('en-IN')} + प्रोसेसिंग फी: ₹${processingFee}${insuranceAmount > 0 ? ` + इन्शुरन्स: ₹${insuranceAmount.toLocaleString('en-IN')}` : ''})\n` +
      `📄 *कर्ज रक्कम (Financed): ₹${result.loanAmount.toLocaleString('en-IN')}*\n` +
      `⏱️ *एकूण उरलेले हप्ते: ${result.remainingMonths} महिने*\n` +
      (result.dbdAmount > 0 ? `🏷️ *DBD / डीलर सबव्हेन्शन सवलत: ₹${result.dbdAmount.toLocaleString('en-IN')}*\n` : '') +
      `--------------------------------\n` +
      `📋 *आवश्यक कागदपत्रे (KYC Documents):*\n` +
      `1. आधार कार्ड (Aadhaar Card)\n` +
      `2. पॅन कार्ड (PAN Card)\n` +
      `3. बँक पासबुक / कॅन्सल चेक\n` +
      `4. १ पासपोर्ट फोटो\n` +
      `5. बँक एटीएम कार्ड (E-Mandate)\n` +
      `--------------------------------\n` +
      `दुकान: ${settings.businessName}, ${settings.address}\n` +
      `संपर्क: ${settings.phone} / 8766486915\n` +
      `*फायनान्स त्वरित व खात्रीशीर मंजूर केले जाईल!*`
    );
    const url = getSafeWhatsAppUrl(customerPhone, decodeURIComponent(text));
    window.open(url, '_blank');
  };

  // Full Date-Wise Schedule WhatsApp Share Handler
  const handleShareScheduleWhatsApp = () => {
    const p = FINANCE_PARTNERS[selectedPartnerId];
    const scheme = POPULAR_SCHEMES.find((s) => s.id === selectedSchemeId);
    const msgText = generateEmiScheduleWhatsAppText({
      businessName: settings.businessName || 'श्री साई एंटरप्रायझेस',
      businessAddress: settings.address,
      businessPhone: settings.phone,
      partnerName: p.marathiName,
      customerName,
      customerPhone,
      productName,
      productPrice,
      schemeName: scheme?.marathiName || `${customTenure} महिने हप्ता`,
      result,
      dueDay: emiDueDay,
    });

    const url = getSafeWhatsAppUrl(customerPhone, msgText);
    window.open(url, '_blank');
  };

  // Direct SMS Share Handler
  const handleShareScheduleSMS = () => {
    const p = FINANCE_PARTNERS[selectedPartnerId];
    const scheme = POPULAR_SCHEMES.find((s) => s.id === selectedSchemeId);
    const msgText = generateEmiScheduleWhatsAppText({
      businessName: settings.businessName || 'श्री साई एंटरप्रायझेस',
      businessAddress: settings.address,
      businessPhone: settings.phone,
      partnerName: p.marathiName,
      customerName,
      customerPhone,
      productName,
      productPrice,
      schemeName: scheme?.marathiName || `${customTenure} महिने हप्ता`,
      result,
      dueDay: emiDueDay,
    });

    const cleanPhone = customerPhone.replace(/[^0-9]/g, '');
    const url = cleanPhone ? `sms:${cleanPhone}?body=${encodeURIComponent(msgText)}` : `sms:?body=${encodeURIComponent(msgText)}`;
    window.location.href = url;
  };

  // Copy Schedule Text to Clipboard
  const handleCopySchedule = () => {
    const p = FINANCE_PARTNERS[selectedPartnerId];
    const scheme = POPULAR_SCHEMES.find((s) => s.id === selectedSchemeId);
    const msgText = generateEmiScheduleWhatsAppText({
      businessName: settings.businessName || 'श्री साई एंटरप्रायझेस',
      businessAddress: settings.address,
      businessPhone: settings.phone,
      partnerName: p.marathiName,
      customerName,
      customerPhone,
      productName,
      productPrice,
      schemeName: scheme?.marathiName || `${customTenure} महिने हप्ता`,
      result,
      dueDay: emiDueDay,
    });
    navigator.clipboard.writeText(msgText).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Top Banner with Partners */}
      <div className="bg-gradient-to-r from-slate-950 via-[#0B1528] to-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" /> झटपट ग्राहक ईएमआय
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                No-Cost EMI उपलब्ध
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <Calculator className="w-7 h-7 text-amber-400" />
              फायनान्स व ईएमआय कॅल्क्युलेटर
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
              बजाज फायनान्स (Bajaj Finserv), टीव्हीएस क्रेडिट (TVS Credit), आयडीबीआय (IDBI Bank) आणि एचडीबी (HDB Financial) चे अधिकृत हप्ते, डाऊन पेमेंट व महिनावार हिशोब एका क्लिकवर.
            </p>
          </div>

          <div className="flex items-center gap-2 no-print shrink-0">
            <button
              onClick={handleShareWhatsApp}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-900/40 cursor-pointer transition active:scale-95"
            >
              <Share2 className="w-4 h-4" />
              WhatsApp कोटेशन
            </button>
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold flex items-center gap-1.5 border border-slate-700 cursor-pointer transition active:scale-95"
            >
              <Printer className="w-4 h-4" />
              प्रिंट कोटेशन
            </button>
          </div>
        </div>

        {/* Partner Selector Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5 mt-5 pt-5 border-t border-slate-800/80">
          {(Object.keys(FINANCE_PARTNERS) as FinancePartnerId[]).map((pId) => {
            const partner = FINANCE_PARTNERS[pId];
            const isSelected = selectedPartnerId === pId;
            return (
              <button
                key={pId}
                onClick={() => handleSelectPartner(pId)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'bg-white/10 border-amber-400 shadow-md ring-2 ring-amber-400/40'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                {isSelected && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-400 shadow-sm shadow-amber-400/80"></span>
                )}
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 block mb-0.5">
                    {partner.badgeText}
                  </span>
                  <div className="font-bold text-sm text-white">{partner.name}</div>
                </div>
                <div className="text-[11px] text-slate-400 mt-2 font-mono flex items-center justify-between">
                  <span>फी: ₹{partner.defaultProcessingFee}</span>
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub-Tabs: Calculator | Comparison | Month-by-Month Schedule | KYC Documents */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 no-print overflow-x-auto">
        <button
          onClick={() => setActiveTab('calculator')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'calculator'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
          }`}
        >
          <Calculator className="w-4 h-4" />
          मुख्य कॅल्क्युलेटर (Calculator)
        </button>
        <button
          onClick={() => setActiveTab('comparison')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'comparison'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
          }`}
        >
          <Layers className="w-4 h-4" />
          कंपन्यांची तुलना (Bajaj vs TVS vs IDBI vs HDB)
        </button>
        <button
          onClick={() => setActiveTab('schedule')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'schedule'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
          }`}
        >
          <Calendar className="w-4 h-4" />
          महिनावार हप्ता वेळापत्रक (Amortization)
        </button>
        <button
          onClick={() => setActiveTab('documents')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'documents'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          आवश्यक कागदपत्रे व नियम (KYC Documents)
        </button>
      </div>

      {/* VIEW 1: MAIN CALCULATOR */}
      {activeTab === 'calculator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Product & Scheme Configuration (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Quick Presets */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                लोकप्रिय गृहोपयोगी वस्तू (Quick Appliance Presets)
              </h3>
              <div className="flex flex-wrap gap-2">
                {APPLIANCE_PRESETS.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => handleSelectPreset(item)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer flex items-center gap-1.5 ${
                      productPrice === item.price && productName === item.name
                        ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700 font-bold'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.marathi}</span>
                    <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      ₹{item.price.toLocaleString('en-IN')}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Inputs: Product Value, Name, Scheme */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
                उत्पादन व फायनान्स माहिती भरा
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    उत्पादन / वस्तूचे नाव
                  </label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="उदा. Samsung Smart TV 43 Inch"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    वस्तूची किंमत (MRP / Invoice Price ₹) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">₹</span>
                    <input
                      type="number"
                      value={productPrice || ''}
                      onChange={(e) => setProductPrice(Number(e.target.value))}
                      placeholder="25000"
                      className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Scheme Presets Buttons */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
                  फायनान्स योजना निवडा (Scheme Selection)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {POPULAR_SCHEMES.map((scheme) => {
                    const isSelected = selectedSchemeId === scheme.id;
                    return (
                      <button
                        key={scheme.id}
                        type="button"
                        onClick={() => handleSelectScheme(scheme.id)}
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                          isSelected
                            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 text-amber-900 dark:text-amber-200 font-bold ring-2 ring-amber-400/40'
                            : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs">{scheme.name}</span>
                          {scheme.isNoCost && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-extrabold">
                              0%
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                          {scheme.marathiName}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Advanced Parameters: Extra Downpayment, Processing Fee, Interest */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    अतिरिक्त रोख डाऊन पेमेंट (Extra DP ₹)
                  </label>
                  <input
                    type="number"
                    value={extraDownPayment || ''}
                    onChange={(e) => setExtraDownPayment(Number(e.target.value))}
                    placeholder="0"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                  />
                  <span className="text-[10px] text-slate-400">ग्राहकाने रोख दिलेली आगाऊ रक्कम</span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    प्रोसेसिंग फी / फाईल चार्ज (₹)
                  </label>
                  <input
                    type="number"
                    value={processingFee || ''}
                    onChange={(e) => setProcessingFee(Number(e.target.value))}
                    placeholder="799"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                  />
                  <span className="text-[10px] text-slate-400">कंपनीनुसार फी (उदा. 799, 650)</span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    इन्शुरन्स / डिव्हाईस प्रोटेक्शन (₹)
                  </label>
                  <input
                    type="number"
                    value={insuranceAmount || ''}
                    onChange={(e) => setInsuranceAmount(Number(e.target.value))}
                    placeholder="0"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                  />
                  <span className="text-[10px] text-slate-400">बजाज/कंपनी इन्शुरन्स डाऊन पेमेंटमध्ये</span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    DBD / सबव्हेन्शन (₹ किंवा %)
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="number"
                      value={dbdAmount || ''}
                      onChange={(e) => {
                        setDbdAmount(Number(e.target.value));
                        setDbdPercent(0);
                      }}
                      placeholder="रक्कम ₹"
                      className="w-1/2 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                    />
                    <input
                      type="number"
                      value={dbdPercent || ''}
                      onChange={(e) => {
                        setDbdPercent(Number(e.target.value));
                        setDbdAmount(0);
                      }}
                      placeholder="% टक्के"
                      className="w-1/2 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400">दुकानदाराला मिळणाऱ्या रकमेतून वजावट</span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    व्याजदर (% Annual)
                  </label>
                  <input
                    type="number"
                    value={interestRate}
                    onChange={(e) => {
                      setInterestRate(Number(e.target.value));
                      setIsNoCost(Number(e.target.value) === 0);
                    }}
                    placeholder="0"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                  />
                  <span className="text-[10px] text-slate-400">0% = No Cost EMI</span>
                </div>
              </div>

              {/* Customer Info for Quotation */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    ग्राहक नाव (Quotation व वेळापत्रकासाठी)
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="उदा. रमेशजी तायडे"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    मोबाईल नंबर (WhatsApp वर यादी पाठवण्यासाठी)
                  </label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="9822314567"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                  />
                </div>
              </div>

              {/* EMI Date & Auto-Debit Due Day Settings */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 bg-blue-50/50 dark:bg-blue-950/20 p-3 rounded-xl border border-blue-200/80 dark:border-blue-900/40">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    हप्ता तारीख व वेळापत्रक नियोजन (EMI Date & Due Schedule)
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      📅 खरेदी / लोन सुरू तारीख (Sanction Date)
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                    />
                    <span className="text-[10px] text-slate-500">डाऊन पेमेंट व आगाऊ हप्ता जमा तारीख</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      🗓️ दरमहा बँक हप्ता कटिंग तारीख (EMI Due Day)
                    </label>
                    <div className="flex items-center gap-1.5">
                      {[2, 5, 10, 15].map((day) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => setEmiDueDay(day)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                            emiDueDay === day
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          {day} तारीख
                        </button>
                      ))}
                      <input
                        type="number"
                        min="1"
                        max="28"
                        value={emiDueDay}
                        onChange={(e) => setEmiDueDay(Math.min(28, Math.max(1, Number(e.target.value) || 5)))}
                        className="w-14 px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-center font-bold"
                        title="इतर तारीख"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500">बँकेतून हप्ता कटिंग होण्याची दरमहा तारीख</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Calculation Results & Quotation Slip (5 cols) */}
          <div id="printable-finance-quote" className="lg:col-span-5 space-y-5 print:w-full print:m-0 print:p-0">
            {/* Primary Hero EMI Card */}
            <div className="bg-gradient-to-br from-[#0c1a30] via-[#091527] to-[#040914] rounded-2xl p-6 text-white shadow-2xl border border-slate-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                <Calculator className="w-36 h-36" />
              </div>

              <div className="flex items-center justify-between mb-4">
                <span className="px-2.5 py-1 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-extrabold uppercase tracking-wide">
                  {FINANCE_PARTNERS[selectedPartnerId].name}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {result.isNoCost || result.totalInterestPaid === 0 ? '0% No-Cost EMI' : 'Standard EMI'}
                </span>
              </div>

              {/* Big Monthly EMI */}
              <div className="mb-6">
                <span className="text-xs text-slate-300 block font-medium">दरमहा येणारा हप्ता (Monthly EMI)</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-4xl sm:text-5xl font-black font-mono text-amber-400 tracking-tight">
                    ₹{result.monthlyEmi.toLocaleString('en-IN')}
                  </span>
                  <span className="text-sm text-slate-300 font-semibold">/ महिना</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  पुढील {result.remainingMonths} महिन्यांसाठी दरमहा ऑटो-डेबिट होईल.
                </p>
              </div>

              {/* Upfront Down Payment Box */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10 mb-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300 font-semibold">
                    दुकानात भरायचे एकूण डाऊन पेमेंट:
                  </span>
                  <span className="text-lg font-bold text-emerald-400 font-mono">
                    ₹{result.totalDownPayment.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 space-y-0.5 pt-1 border-t border-white/5">
                  <div className="flex justify-between">
                    <span>आगाऊ हप्ते ({result.advanceEmis} महिने):</span>
                    <span className="font-mono">₹{result.advanceEmisTotal.toLocaleString('en-IN')}</span>
                  </div>
                  {extraDownPayment > 0 && (
                    <div className="flex justify-between">
                      <span>अतिरिक्त रोख डाऊन पेमेंट:</span>
                      <span className="font-mono">₹{extraDownPayment.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>फाईल चार्ज / प्रोसेसिंग फी:</span>
                    <span className="font-mono">₹{processingFee.toLocaleString('en-IN')}</span>
                  </div>
                  {insuranceAmount > 0 && (
                    <div className="flex justify-between text-blue-300">
                      <span>इन्शुरन्स / डिव्हाईस कव्हर:</span>
                      <span className="font-mono">+₹{insuranceAmount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {result.dbdAmount > 0 && (
                    <div className="flex justify-between text-amber-300 pt-1 border-t border-white/5">
                      <span>DBD सबव्हेन्शन वजावट:</span>
                      <span className="font-mono">-₹{result.dbdAmount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-emerald-300 font-semibold pt-1 border-t border-white/5">
                    <span>दुकानदाराला येणारे नेट डिस्बर्समेंट:</span>
                    <span className="font-mono">₹{result.netStoreDisbursal.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Breakdown Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                  <span className="text-[10px] text-slate-400 block">फायनान्स कर्ज रक्कम</span>
                  <span className="font-bold text-base font-mono text-white mt-0.5 block">
                    ₹{result.loanAmount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                  <span className="text-[10px] text-slate-400 block">कालावधी (Tenure)</span>
                  <span className="font-bold text-base font-mono text-white mt-0.5 block">
                    {result.tenureMonths} महिने
                  </span>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                  <span className="text-[10px] text-slate-400 block">ग्राहकाकडून एकूण परतफेड</span>
                  <span className="font-bold text-base font-mono text-white mt-0.5 block">
                    ₹{result.totalPaidByCustomer.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                  <span className="text-[10px] text-slate-400 block">अतिरिक्त खर्च / व्याज</span>
                  <span className="font-bold text-base font-mono text-amber-400 mt-0.5 block">
                    ₹{result.totalExtraCost.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 mt-5 pt-4 border-t border-slate-800">
                {/* Send Full Date-Wise Schedule directly on WhatsApp */}
                <button
                  type="button"
                  onClick={handleShareScheduleWhatsApp}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-900/50 transition active:scale-95"
                >
                  <Share2 className="w-4 h-4" />
                  📲 तारीखवार संपूर्ण हप्ते वेळापत्रक WhatsApp पाठवा
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleShareWhatsApp}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer transition active:scale-95"
                  >
                    <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                    फक्त कोटेशन
                  </button>

                  <button
                    type="button"
                    onClick={handleCopySchedule}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer transition active:scale-95"
                  >
                    {copySuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        कॉपी झाले!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-blue-400" />
                        वेळापत्रक कॉपी
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer transition active:scale-95"
                    title="प्रिंट स्लिप"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    प्रिंट
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Dealer Store Disbursal Note */}
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl p-3.5 text-xs text-amber-900 dark:text-amber-300 flex items-start gap-2.5">
              <Building2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">दुकानदारासाठी खात्रीशीर माहिती:</span>
                <p className="text-[11px] text-amber-800 dark:text-amber-400 mt-0.5">
                  मंजुरीनंतर कंपनीकडून थेट दुकानाच्या बँक खात्यात <strong>₹{result.netStoreDisbursal.toLocaleString('en-IN')}</strong> जमा होतात. ग्राहकाला उत्पादन त्वरित डिलेव्हर करू शकता.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: SIDE-BY-SIDE COMPARISON TABLE */}
      {activeTab === 'comparison' && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  सर्व फायनान्स कंपन्यांची तुलना (Side-by-Side Comparison)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {productName} (किंमत: ₹{result.productPrice.toLocaleString('en-IN')}) साठी योजना: {selectedSchemeId}
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-lg border border-blue-200 dark:border-blue-800">
                एकूण ४ भागीदार उपलब्ध
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {comparisonResults.map(({ partner, result: compResult }) => {
                const isSelected = selectedPartnerId === partner.id;
                return (
                  <div
                    key={partner.id}
                    className={`rounded-2xl p-4 border transition flex flex-col justify-between ${
                      isSelected
                        ? 'bg-blue-50/50 dark:bg-blue-950/30 border-blue-500 shadow-md ring-2 ring-blue-500/20'
                        : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${partner.badgeBg}`}>
                          {partner.name}
                        </span>
                        {isSelected && (
                          <span className="text-[10px] font-bold text-blue-600 flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3" /> निवडलेले
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                        {partner.marathiName}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {partner.tagline}
                      </p>

                      {/* EMI and Down Payment */}
                      <div className="my-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
                        <div>
                          <span className="text-[10px] text-slate-400 block">मासिक हप्ता (EMI)</span>
                          <span className="text-xl font-black font-mono text-blue-700 dark:text-blue-400">
                            ₹{compResult.monthlyEmi.toLocaleString('en-IN')}
                            <span className="text-xs font-normal text-slate-500"> /महिना</span>
                          </span>
                        </div>

                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                          <span className="text-[10px] text-slate-400 block">सुरुवातीला डाऊन पेमेंट</span>
                          <span className="text-sm font-bold font-mono text-emerald-600">
                            ₹{compResult.totalDownPayment.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      {/* Parameters list */}
                      <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                        <div className="flex justify-between">
                          <span>प्रोसेसिंग फी:</span>
                          <span className="font-mono font-bold">₹{partner.defaultProcessingFee}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>कर्ज रक्कम:</span>
                          <span className="font-mono font-bold">₹{compResult.loanAmount.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>उरलेले हप्ते:</span>
                          <span className="font-mono font-bold">{compResult.remainingMonths} महिने</span>
                        </div>
                        <div className="flex justify-between">
                          <span>एकूण परतफेड:</span>
                          <span className="font-mono font-bold">₹{compResult.totalPaidByCustomer.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        handleSelectPartner(partner.id);
                        setActiveTab('calculator');
                      }}
                      className="mt-4 w-full py-2 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-blue-600 text-white text-xs font-bold transition cursor-pointer"
                    >
                      ही कंपनी निवडा
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: MONTH-BY-MONTH SCHEDULE */}
      {activeTab === 'schedule' && (
        <div id="printable-emi-schedule" className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 animate-fade-in print:p-0 print:border-none print:shadow-none">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                तारीखवार संपूर्ण हप्ता परतफेड वेळापत्रक (Date-Wise EMI Schedule)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {productName} • {FINANCE_PARTNERS[selectedPartnerId].name} • दरमहा {emiDueDay} तारखेला बँक खात्यातून ईएमआय कटिंग
              </p>
            </div>

            {/* Direct Schedule Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleShareScheduleWhatsApp}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>WhatsApp वर वेळापत्रक पाठवा</span>
              </button>

              <button
                type="button"
                onClick={handleShareScheduleSMS}
                className="px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center gap-1.5 border border-blue-200 dark:border-blue-800 transition active:scale-95 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>SMS पाठवा</span>
              </button>

              <button
                type="button"
                onClick={handleCopySchedule}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-300 dark:border-slate-700 transition active:scale-95 cursor-pointer"
              >
                {copySuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>कॉपी झाले!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-blue-600" />
                    <span>कॉपी करा</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-300 dark:border-slate-700 transition active:scale-95 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>प्रिंट</span>
              </button>
            </div>
          </div>

          {/* Quick Customer & Finance Controls for Instant Schedule */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>⚡ थेट ग्राहकाची माहिती व कंपनी निवडा (हप्ते वेळापत्रक पाठवण्यासाठी):</span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                {FINANCE_PARTNERS[selectedPartnerId].name}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  ग्राहकाचे नाव
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="उदा. अमोल पाटील"
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  मोबाईल नंबर (WhatsApp)
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="उदा. 9876543210"
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  वस्तू किंमत (रुपये)
                </label>
                <input
                  type="number"
                  value={productPrice}
                  onChange={(e) => setProductPrice(Math.max(1000, Number(e.target.value) || 0))}
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  हप्ता कटिंग तारीख (Due Day)
                </label>
                <select
                  value={emiDueDay}
                  onChange={(e) => setEmiDueDay(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold"
                >
                  <option value={2}>दरमहा २ तारीख</option>
                  <option value={5}>दरमहा ५ तारीख (Bajaj Standard)</option>
                  <option value={7}>दरमहा ७ तारीख</option>
                  <option value={10}>दरमहा १० तारीख</option>
                  <option value={15}>दरमहा १५ तारीख</option>
                </select>
              </div>
            </div>

            {/* Quick Partner & Scheme selector chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] font-bold text-slate-500 mr-1">कंपनी:</span>
              {(Object.keys(FINANCE_PARTNERS) as FinancePartnerId[]).map((pId) => (
                <button
                  key={pId}
                  type="button"
                  onClick={() => handleSelectPartner(pId)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                    selectedPartnerId === pId
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {FINANCE_PARTNERS[pId].name}
                </button>
              ))}

              <span className="text-[11px] font-bold text-slate-500 mx-1">| योजना:</span>
              {POPULAR_SCHEMES.map((scheme) => (
                <button
                  key={scheme.id}
                  type="button"
                  onClick={() => handleSelectScheme(scheme.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                    selectedSchemeId === scheme.id
                      ? 'bg-amber-500 text-white shadow-2xs'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {scheme.name}
                </button>
              ))}
            </div>
          </div>

          {/* Key Schedule Metrics Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-blue-50/60 dark:bg-blue-950/30 rounded-xl border border-blue-200/80 dark:border-blue-800/50">
              <span className="text-[10px] text-blue-700 dark:text-blue-300 font-medium block">📅 लोन मंजूर तारीख</span>
              <span className="text-xs font-bold font-mono text-blue-950 dark:text-blue-100 mt-0.5 block">{startDate}</span>
            </div>
            <div className="p-3 bg-amber-50/60 dark:bg-amber-950/30 rounded-xl border border-amber-200/80 dark:border-amber-800/50">
              <span className="text-[10px] text-amber-700 dark:text-amber-300 font-medium block">🗓️ दरमहा हप्ता तारीख</span>
              <span className="text-xs font-bold font-mono text-amber-950 dark:text-amber-100 mt-0.5 block">दरमहा {emiDueDay} तारीख</span>
            </div>
            <div className="p-3 bg-purple-50/60 dark:bg-purple-950/30 rounded-xl border border-purple-200/80 dark:border-purple-800/50">
              <span className="text-[10px] text-purple-700 dark:text-purple-300 font-medium block">🏁 शेवटचा हप्ता तारीख</span>
              <span className="text-xs font-bold font-mono text-purple-950 dark:text-purple-100 mt-0.5 block">
                {result.schedule[result.schedule.length - 1]?.formattedDate || result.schedule[result.schedule.length - 1]?.dateStr}
              </span>
            </div>
            <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-200/80 dark:border-emerald-800/50">
              <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-medium block">✅ अंतिम स्थिती</span>
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-200 mt-0.5 block">लोन पूर्ण समाप्त (NIL)</span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                <tr>
                  <th className="p-3">हप्ता क्र.</th>
                  <th className="p-3">हप्ता देय तारीख (Due Date)</th>
                  <th className="p-3">प्रकार व स्थिती</th>
                  <th className="p-3 text-right">हप्ता रक्कम (EMI)</th>
                  <th className="p-3 text-right">मुद्दल (Principal)</th>
                  <th className="p-3 text-right">व्याज (Interest)</th>
                  <th className="p-3 text-right">शिल्लक बाकी (Balance)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {result.schedule.map((row, idx) => {
                  const isLastRow = idx === result.schedule.length - 1;
                  return (
                    <tr
                      key={row.month}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                        isLastRow
                          ? 'bg-emerald-50/40 dark:bg-emerald-950/20 font-semibold'
                          : row.isAdvance
                          ? 'bg-amber-50/50 dark:bg-amber-950/20'
                          : ''
                      }`}
                    >
                      <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                        हप्ता #{row.month}
                      </td>
                      <td className="p-3 text-slate-800 dark:text-slate-200 font-bold">
                        {row.formattedDate || row.dateStr}
                      </td>
                      <td className="p-3">
                        {row.isAdvance ? (
                          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                            आगाऊ डाऊन पेमेंटमध्ये भरले
                          </span>
                        ) : isLastRow ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1 w-fit">
                            🏁 शेवटचा हप्ता (कर्ज संपले)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">
                            मासिक बँक ईएमआय
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right font-bold text-slate-900 dark:text-white">
                        ₹{row.emi.toLocaleString('en-IN')}
                      </td>
                      <td className="p-3 text-right text-emerald-600 font-semibold">
                        ₹{row.principal.toLocaleString('en-IN')}
                      </td>
                      <td className="p-3 text-right text-rose-600 font-semibold">
                        {row.interest > 0 ? `₹${row.interest.toLocaleString('en-IN')}` : '₹0'}
                      </td>
                      <td className="p-3 text-right font-bold text-slate-700 dark:text-slate-300">
                        {row.remainingBalance === 0 ? (
                          <span className="text-emerald-600 font-black">₹0 (पूर्ण पेड)</span>
                        ) : (
                          `₹${row.remainingBalance.toLocaleString('en-IN')}`
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 4: KYC DOCUMENTS & CRITERIA */}
      {activeTab === 'documents' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 animate-fade-in">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              फायनान्ससाठी आवश्यक कागदपत्रे व नियम (KYC Checklist)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              बजाज, टीव्हीएस, आयडीबीआय व एचडीबी फायनान्स त्वरित मंजूर होण्यासाठी ग्राहकाकडून खालील कागदपत्रे आवश्यक आहेत:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-3">
              <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                १. आवश्यक प्राथमिक कागदपत्रे (Mandatory Documents)
              </h4>
              <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-emerald-600">•</span>
                  <span><strong>आधार कार्ड (Aadhaar Card):</strong> मोबाईल नंबर लिंक असलेले मूळ किंवा झेरॉक्स प्रत.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-emerald-600">•</span>
                  <span><strong>पॅन कार्ड (PAN Card):</strong> ग्राहकाचे मूळ पॅन कार्ड अनिवार्य आहे.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-emerald-600">•</span>
                  <span><strong>बँक पासबुक किंवा कॅन्सल चेक (Bank Proof):</strong> ग्राहकाचे चालू बँक खाते ज्यातून हप्ता कापला जाईल.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-emerald-600">•</span>
                  <span><strong>१ पासपोर्ट साईझ फोटो (Passport Photo):</strong> प्रत्यक्ष किंवा सेल्फी व्हेरिफिकेशन.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-emerald-600">•</span>
                  <span><strong>बँक एटीएम कार्ड (ATM Card / Debit Card):</strong> ई-मॅन्डेट (E-Mandate) / ऑटो-डेबिट सेट करण्यासाठी.</span>
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-800/60 bg-blue-50/50 dark:bg-blue-950/20 space-y-3">
              <h4 className="font-bold text-sm text-blue-900 dark:text-blue-200 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                २. पात्रता व अटी (Eligibility & Guidelines)
              </h4>
              <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-blue-600">•</span>
                  <span><strong>वय:</strong> किमान २१ वर्षे ते कमाल ६५ वर्षे पूर्ण असणे आवश्यक.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-blue-600">•</span>
                  <span><strong>सिबिल स्कोअर (CIBIL Score):</strong> ७००+ असल्यास शून्य डाऊन पेमेंट किंवा १००% मंजुरी मिळते.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-blue-600">•</span>
                  <span><strong>नवीन ग्राहक (New to Credit):</strong> बजाज किंवा टीव्हीएस मध्ये नवीन ग्राहकांनाही सहज कर्ज मिळते.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-blue-600">•</span>
                  <span><strong>मंजुरी कालावधी:</strong> ऑनलाइन ओटीपी व्हेरिफिकेशनने अवघ्या ५ ते १० मिनिटांत मंजुरी.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* PRINT-ONLY OFFICIAL QUOTATION SLIP */}
      <div className="hidden print:block border-2 border-slate-900 p-8 bg-white text-slate-900 font-sans">
        <div className="text-center border-b-2 border-slate-900 pb-4 mb-4">
          <h2 className="text-2xl font-black font-serif uppercase tracking-wide">
            {settings.businessName}
          </h2>
          <p className="text-xs font-semibold mt-1">
            अधिकृत इलेक्ट्रॉनिक्स, गृहोपयोगी वस्तू व ग्राहक फायनान्स केंद्र
          </p>
          <p className="text-xs mt-0.5 text-slate-600">{settings.address} • संपर्क: {settings.phone} / 8766486915</p>
          <div className="inline-block mt-2 px-3 py-1 bg-slate-900 text-white text-xs font-bold uppercase tracking-wider rounded">
            अधिकृत फायनान्स व ईएमआय कोटेशन (Quotation Slip)
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs mb-4">
          <div>
            <p><strong>ग्राहक नाव:</strong> {customerName || 'सन्माननीय ग्राहक'}</p>
            <p><strong>मोबाईल:</strong> {customerPhone || '-'}</p>
            <p><strong>कोटेशन तारीख:</strong> {new Date().toISOString().split('T')[0]}</p>
          </div>
          <div className="text-right">
            <p><strong>फायनान्स पार्टनर:</strong> {FINANCE_PARTNERS[selectedPartnerId].marathiName}</p>
            <p><strong>योजना कोड:</strong> {selectedSchemeId}</p>
            <p><strong>कालावधी:</strong> {result.tenureMonths} महिने</p>
          </div>
        </div>

        <table className="w-full text-xs border border-slate-300 mb-4">
          <thead className="bg-slate-100 font-bold border-b border-slate-300">
            <tr>
              <th className="p-2 text-left">उत्पादन / तपशील</th>
              <th className="p-2 text-right">किंमत</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-200">
              <td className="p-2 font-bold">{productName}</td>
              <td className="p-2 text-right font-mono font-bold">₹{result.productPrice.toLocaleString('en-IN')}</td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="p-2">मासिक हप्ता (Monthly EMI)</td>
              <td className="p-2 text-right font-mono font-black text-sm">₹{result.monthlyEmi.toLocaleString('en-IN')} x {result.remainingMonths} महिने</td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="p-2">आगाऊ हप्ते डाऊन पेमेंट ({result.advanceEmis} हप्ते)</td>
              <td className="p-2 text-right font-mono font-bold">₹{result.advanceEmisTotal.toLocaleString('en-IN')}</td>
            </tr>
            {extraDownPayment > 0 && (
              <tr className="border-b border-slate-200">
                <td className="p-2">अतिरिक्त रोख डाऊन पेमेंट</td>
                <td className="p-2 text-right font-mono">₹{extraDownPayment.toLocaleString('en-IN')}</td>
              </tr>
            )}
            <tr className="border-b border-slate-200">
              <td className="p-2">प्रोसेसिंग फी / फाईल चार्ज</td>
              <td className="p-2 text-right font-mono">₹{processingFee.toLocaleString('en-IN')}</td>
            </tr>
            {insuranceAmount > 0 && (
              <tr className="border-b border-slate-200">
                <td className="p-2">इन्शुरन्स / डिव्हाईस प्रोटेक्शन</td>
                <td className="p-2 text-right font-mono">₹{insuranceAmount.toLocaleString('en-IN')}</td>
              </tr>
            )}
            {result.dbdAmount > 0 && (
              <tr className="border-b border-slate-200">
                <td className="p-2">डीलर सबव्हेन्शन सवलत (DBD)</td>
                <td className="p-2 text-right font-mono">-₹{result.dbdAmount.toLocaleString('en-IN')}</td>
              </tr>
            )}
            <tr className="bg-slate-100 font-bold text-sm">
              <td className="p-2">दुकानात सुरुवातीला भरायची एकूण रक्कम:</td>
              <td className="p-2 text-right font-mono">₹{result.totalDownPayment.toLocaleString('en-IN')}</td>
            </tr>
          </tbody>
        </table>

        <div className="text-[11px] text-slate-600 mb-6">
          <p className="font-bold mb-1">आवश्यक कागदपत्रे:</p>
          <p>१. आधार कार्ड • २. पॅन कार्ड • ३. बँक पासबुक/कॅन्सल चेक • ४. १ फोटो • ५. बँक एटीएम कार्ड.</p>
        </div>

        <div className="flex justify-between items-end pt-6 border-t border-slate-300 text-xs">
          <div>
            <p>ग्राहक स्वाक्षरी</p>
          </div>
          <div className="text-right">
            <p className="font-bold">अधिकृत स्वाक्षरी व शिक्का</p>
            <p className="text-[10px] text-slate-500">{settings.businessName}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
