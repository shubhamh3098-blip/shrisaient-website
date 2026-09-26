import React, { useState, useMemo } from 'react';
import {
  X,
  Calculator,
  Share2,
  Printer,
  Copy,
  CheckCircle2,
  Percent,
  Calendar,
  IndianRupee,
  Building2,
  FileText
} from 'lucide-react';
import { StoreData } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { GalaxyButton } from './GalaxyButton';

interface FinanceEmiModalProps {
  storeData: StoreData;
  isOpen: boolean;
  onClose: () => void;
  initialProductName?: string;
  productTitle?: string;
  initialPrice?: number;
}

export const FinanceEmiModal: React.FC<FinanceEmiModalProps> = ({
  storeData,
  isOpen,
  onClose,
  initialProductName = 'Smart LED TV 43" 4K Ultra HD Display',
  productTitle,
  initialPrice = 23900,
}) => {
  const { isDayMode } = useTheme();

  // Inputs
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [productName, setProductName] = useState(productTitle || initialProductName);
  const [productPrice, setProductPrice] = useState<string>(initialPrice.toString());
  const [provider, setProvider] = useState<'bajaj' | 'tvs' | 'hdb' | 'idbi' | 'other'>('bajaj');
  
  // Scheme parameters: S / R scheme (e.g., 8/2 scheme = 8 months tenure, 2 advance EMIs)
  const [schemeTenure, setSchemeTenure] = useState<string>('8');
  const [schemeAdvEmis, setSchemeAdvEmis] = useState<string>('2');
  const [interestRate, setInterestRate] = useState<string>('0'); // 0 for 0% No Cost EMI
  const [downPayment, setDownPayment] = useState<string>('0');
  const [processingFee, setProcessingFee] = useState<string>('550');
  const [dbdCharge, setDbdCharge] = useState<string>('0');
  const [copied, setCopied] = useState(false);

  // Preset Schemes like on shrisaient.in (8/2, 10/2, 12/4, 24/6)
  const schemePresets = [
    { label: '8/2 (8 Months, 2 Adv)', tenure: '8', adv: '2', rate: '0' },
    { label: '10/2 (10 Months, 2 Adv)', tenure: '10', adv: '2', rate: '0' },
    { label: '12/4 (12 Months, 4 Adv)', tenure: '12', adv: '4', rate: '0' },
    { label: '6/0 (6 Months, 0 Adv)', tenure: '6', adv: '0', rate: '0' },
    { label: '24/6 (24 Months, 6 Adv)', tenure: '24', adv: '6', rate: '12' },
  ];

  const providers = {
    bajaj: { name: 'बजाज फायनान्स (Bajaj Finserv)', color: 'blue', badge: 'Bajaj Finance' },
    tvs: { name: 'टीव्हीएस क्रेडिट (TVS Credit)', color: 'emerald', badge: 'TVS Credit' },
    hdb: { name: 'एचडीबी फायनान्स (HDB Financial)', color: 'rose', badge: 'HDB Finance' },
    idbi: { name: 'आयडीबीआय बँक फायनान्स (IDBI Bank)', color: 'indigo', badge: 'IDBI Bank' },
    other: { name: 'इतर फायनान्स / एनबीएफसी (Custom)', color: 'slate', badge: 'Custom Finance' },
  };

  // Calculations
  const calculations = useMemo(() => {
    const price = Math.max(0, Number(productPrice) || 0);
    const directDown = Math.max(0, Number(downPayment) || 0);
    const loanAmount = Math.max(0, price - directDown);
    const tenure = Math.max(1, Number(schemeTenure) || 1);
    const advEmis = Math.min(tenure, Math.max(0, Number(schemeAdvEmis) || 0));
    const annualRate = Math.max(0, Number(interestRate) || 0);
    const fee = Math.max(0, Number(processingFee) || 0);
    const dbd = Math.max(0, Number(dbdCharge) || 0);

    let monthlyEmi = 0;
    let totalInterest = 0;

    if (annualRate === 0) {
      monthlyEmi = Math.round(loanAmount / tenure);
      totalInterest = 0;
    } else {
      const monthlyRate = annualRate / 1200;
      const compound = Math.pow(1 + monthlyRate, tenure);
      monthlyEmi = Math.round((loanAmount * monthlyRate * compound) / (compound - 1));
      totalInterest = Math.max(0, monthlyEmi * tenure - loanAmount);
    }

    const advanceEmiAmount = advEmis * monthlyEmi;
    const upfrontPayableToday = directDown + advanceEmiAmount + fee + dbd;
    const remainingEmisCount = Math.max(0, tenure - advEmis);
    const totalPayableByCustomer = upfrontPayableToday + remainingEmisCount * monthlyEmi;
    const totalExtraCost = totalPayableByCustomer - price;

    // Amortization schedule
    const schedule = [];
    let remainingBalance = loanAmount;
    for (let m = 1; m <= tenure; m++) {
      const isAdvance = m <= advEmis;
      const interestPart = annualRate > 0 ? Math.round(remainingBalance * (annualRate / 1200)) : 0;
      const principalPart = monthlyEmi - interestPart;
      remainingBalance = Math.max(0, remainingBalance - principalPart);
      schedule.push({
        month: m,
        emi: monthlyEmi,
        isAdvance,
        principal: principalPart,
        interest: interestPart,
        remainingBalance,
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
  }, [productPrice, downPayment, schemeTenure, schemeAdvEmis, interestRate, processingFee, dbdCharge]);

  if (!isOpen) return null;

  const handleShareWhatsApp = () => {
    const greeting = customerName ? `नमस्कार ${customerName} जी,\n` : '';
    const text = encodeURIComponent(
      greeting +
      `*${storeData.settings.storeName}*\n` +
      `*फायनान्स ईएमआय कोटेशन (Finance EMI Quotation)*\n` +
      `--------------------------------\n` +
      (customerName ? `👤 ग्राहक: *${customerName}* ${customerPhone ? `(${customerPhone})` : ''}\n` : '') +
      `📦 वस्तूचे नाव: *${productName}*\n` +
      `💰 वस्तूची किंमत: *₹${calculations.price.toLocaleString('en-IN')}*\n` +
      `🏢 फायनान्स: *${providers[provider].name}*\n` +
      `📋 योजना: *${schemeTenure}/${schemeAdvEmis} स्कीम (${calculations.annualRate === 0 ? '0% No-Cost EMI' : `${calculations.annualRate}% व्याज`})*\n` +
      `--------------------------------\n` +
      `💵 *आज दुकानात भरावयाची एकूण रक्कम: ₹${calculations.upfrontPayableToday.toLocaleString('en-IN')}*\n` +
      `   • डाऊन पेमेंट: ₹${calculations.directDown.toLocaleString('en-IN')}\n` +
      `   • अगाऊ हप्ते (${calculations.advEmis}): ₹${calculations.advanceEmiAmount.toLocaleString('en-IN')}\n` +
      `   • फाईल चार्ज / फी: ₹${(calculations.fee + calculations.dbd).toLocaleString('en-IN')}\n` +
      `--------------------------------\n` +
      `✨ *दरमहा हप्ता (Monthly EMI): ₹${calculations.monthlyEmi.toLocaleString('en-IN')} / महिना*\n` +
      `📅 कालावधी: *${calculations.remainingEmisCount} पुढील हप्ते* (एकूण ${calculations.tenure} महिने)\n` +
      `--------------------------------\n` +
      `📍 *${storeData.settings.storeName}*\n` +
      `📞 संपर्क: ${storeData.settings.phone}\n` +
      `${storeData.settings.address}\nआजच भेट द्या!`
    );

    const cleanPhone = customerPhone.replace(/[^0-9]/g, '');
    const url = cleanPhone.length === 10 ? `https://wa.me/91${cleanPhone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  const handleCopy = () => {
    const text =
      `${storeData.settings.storeName} - Finance Quotation\n` +
      (customerName ? `Customer: ${customerName} (${customerPhone || '-'})\n` : '') +
      `Product: ${productName} (₹${calculations.price.toLocaleString('en-IN')})\n` +
      `Provider: ${providers[provider].name}\n` +
      `Scheme: ${schemeTenure}/${schemeAdvEmis} (${calculations.annualRate}% Rate)\n` +
      `Upfront Today: ₹${calculations.upfrontPayableToday.toLocaleString('en-IN')}\n` +
      `Monthly EMI: ₹${calculations.monthlyEmi.toLocaleString('en-IN')} x ${calculations.remainingEmisCount} Months\n` +
      `Contact: ${storeData.settings.phone}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className={`w-full max-w-4xl rounded-2xl border shadow-2xl overflow-hidden my-auto transition-all ${
        isDayMode ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0b1329] border-sky-500/30 text-white'
      }`}>
        {/* Header */}
        <div className={`px-5 py-4 border-b flex items-center justify-between ${
          isDayMode ? 'bg-gradient-to-r from-sky-50 to-blue-50 border-slate-200' : 'bg-gradient-to-r from-sky-950/60 to-blue-950/60 border-sky-500/20'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold tracking-tight">
                  बजाज / टीव्हीएस फायनान्स ईएमआय कॅल्क्युलेटर
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  Bajaj / TVS / HDB / IDBI
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-sky-300/70">
                0% No Cost EMI व अगाऊ हप्ते (S/R Scheme) हिशोब • 1-Tap WhatsApp कोटेशन
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition cursor-pointer ${
              isDayMode ? 'hover:bg-slate-200 text-slate-500' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 max-h-[75vh] overflow-y-auto space-y-5">
          {/* Provider Selection */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 dark:text-sky-300/80 uppercase tracking-wider mb-2 block">
              1. फायनान्स कंपनी निवडा (Select Finance Partner)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {(Object.keys(providers) as Array<keyof typeof providers>).map((key) => {
                const p = providers[key];
                const isSelected = provider === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setProvider(key)}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-left transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-sky-500 bg-sky-500/15 text-sky-400 shadow-sm shadow-sky-500/20'
                        : isDayMode
                        ? 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                        : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <span>{p.badge}</span>
                    <span className="text-[10px] opacity-70 truncate mt-0.5">{p.name.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Product & Customer Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">
                वस्तूचे नाव (Product Description)
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="उदा. Samsung 43 Inch LED TV"
                className={`w-full p-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                  isDayMode ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-900/80 border-slate-700 text-white'
                }`}
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">
                वस्तूची किंमत (MRP / Deal ₹)
              </label>
              <input
                type="number"
                value={productPrice}
                onChange={(e) => setProductPrice(e.target.value)}
                placeholder="उदा. 24000"
                className={`w-full p-2.5 rounded-xl border text-xs font-bold text-base focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                  isDayMode ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-900/80 border-slate-700 text-white'
                }`}
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1 block">
                थेट डाऊन पेमेंट (Cash Down ₹)
              </label>
              <input
                type="number"
                value={downPayment}
                onChange={(e) => setDownPayment(e.target.value)}
                placeholder="उदा. 0"
                className={`w-full p-2.5 rounded-xl border text-xs font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  isDayMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/80 border-slate-700'
                }`}
              />
            </div>
          </div>

          {/* Scheme Presets */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold text-slate-500 dark:text-sky-300/80 uppercase tracking-wider">
                2. लोकप्रिय फायनान्स योजना (Popular S/R Schemes)
              </label>
              <span className="text-[10px] text-slate-400">0% No Cost Schemes</span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {schemePresets.map((sch) => {
                const isActive = schemeTenure === sch.tenure && schemeAdvEmis === sch.adv;
                return (
                  <button
                    key={sch.label}
                    type="button"
                    onClick={() => {
                      setSchemeTenure(sch.tenure);
                      setSchemeAdvEmis(sch.adv);
                      setInterestRate(sch.rate);
                    }}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                      isActive
                        ? 'border-indigo-500 bg-indigo-500/20 text-indigo-400 shadow-xs'
                        : isDayMode
                        ? 'border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700'
                        : 'border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    {sch.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scheme Fine Tuning */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl border bg-slate-500/5 border-slate-200 dark:border-sky-500/20">
            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">
                एकूण हप्ते (Tenure Months)
              </label>
              <input
                type="number"
                value={schemeTenure}
                onChange={(e) => setSchemeTenure(e.target.value)}
                className={`w-full p-2 rounded-lg border text-xs font-semibold ${
                  isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-700 text-white'
                }`}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">
                अगाऊ हप्ते (Advance EMIs)
              </label>
              <input
                type="number"
                value={schemeAdvEmis}
                onChange={(e) => setSchemeAdvEmis(e.target.value)}
                className={`w-full p-2 rounded-lg border text-xs font-semibold ${
                  isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-700 text-white'
                }`}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">
                व्याज दर (Interest Rate % p.a.)
              </label>
              <input
                type="number"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                placeholder="0 for No Cost"
                className={`w-full p-2 rounded-lg border text-xs font-semibold ${
                  isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-700 text-white'
                }`}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">
                प्रोसेसिंग फी (File Charge ₹)
              </label>
              <input
                type="number"
                value={processingFee}
                onChange={(e) => setProcessingFee(e.target.value)}
                className={`w-full p-2 rounded-lg border text-xs font-semibold ${
                  isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-700 text-white'
                }`}
              />
            </div>
          </div>

          {/* Customer Contacts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">
                ग्राहकाचे नाव (Customer Name - ऐच्छिक)
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="उदा. राहुल देशमुख"
                className={`w-full p-2.5 rounded-xl border text-xs ${
                  isDayMode ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-900/80 border-slate-700 text-white'
                }`}
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">
                मोबाईल नंबर (WhatsApp No)
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="उदा. 9822100000"
                className={`w-full p-2.5 rounded-xl border text-xs font-mono ${
                  isDayMode ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-900/80 border-slate-700 text-white'
                }`}
              />
            </div>
          </div>

          {/* High-Impact Result Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-sky-950/40 via-blue-950/30 to-indigo-950/40 border border-sky-500/40 shadow-xl">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-700/50">
              {/* Upfront Payment */}
              <div className="sm:pr-4">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400 block mb-1">
                  आज भरावयाची एकूण रक्कम (Pay Today)
                </span>
                <div className="text-2xl sm:text-3xl font-black text-amber-400 tabular-nums">
                  ₹{calculations.upfrontPayableToday.toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-slate-300 mt-1 space-y-0.5">
                  <div>• डाऊन पेमेंट: ₹{calculations.directDown.toLocaleString('en-IN')}</div>
                  <div>• अगाऊ हप्ते ({calculations.advEmis}): ₹{calculations.advanceEmiAmount.toLocaleString('en-IN')}</div>
                  <div>• फाईल चार्ज: ₹{(calculations.fee + calculations.dbd).toLocaleString('en-IN')}</div>
                </div>
              </div>

              {/* Monthly EMI */}
              <div className="sm:px-4 pt-3 sm:pt-0">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400 block mb-1">
                  दरमहा हप्ता (Monthly EMI)
                </span>
                <div className="text-2xl sm:text-3xl font-black text-emerald-400 tabular-nums">
                  ₹{calculations.monthlyEmi.toLocaleString('en-IN')}
                  <span className="text-xs font-normal text-slate-400"> / महिना</span>
                </div>
                <div className="text-[11px] text-slate-300 mt-1 space-y-0.5">
                  <div>• कालावधी: {calculations.remainingEmisCount} पुढील हप्ते</div>
                  <div>• एकूण महिने: {calculations.tenure} महिने</div>
                  <div>• योजना: {schemeTenure}/{schemeAdvEmis} स्कीम</div>
                </div>
              </div>

              {/* Loan Summary */}
              <div className="sm:pl-4 pt-3 sm:pt-0">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-sky-400 block mb-1">
                  कर्ज सारांश (Loan Summary)
                </span>
                <div className="text-lg font-bold text-white tabular-nums">
                  लोन: ₹{calculations.loanAmount.toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-slate-300 mt-1 space-y-0.5">
                  <div>• एकूण खर्च: ₹{calculations.totalPayableByCustomer.toLocaleString('en-IN')}</div>
                  <div>• अतिरिक्त खर्च: ₹{calculations.totalExtraCost.toLocaleString('en-IN')}</div>
                  <div>• व्याज: {calculations.annualRate === 0 ? '0% No-Cost' : `₹${calculations.totalInterest}`}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className={`p-4 border-t flex flex-wrap items-center justify-between gap-3 ${
          isDayMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
        }`}>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition cursor-pointer ${
                isDayMode ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200' : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700'
              }`}
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'कॉपी झाले!' : 'कोटेशन कॉपी'}</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition cursor-pointer ${
                isDayMode ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200' : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700'
              }`}
            >
              <Printer className="w-4 h-4" />
              <span>प्रिंट कोटेशन</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <GalaxyButton
              variant="emerald"
              onClick={handleShareWhatsApp}
              icon={<Share2 className="w-3.5 h-3.5" />}
            >
              WhatsApp कोटेशन पाठवा
            </GalaxyButton>
            <button
              type="button"
              onClick={onClose}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition ${
                isDayMode ? 'text-slate-600 hover:bg-slate-200' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              बंद करा
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
