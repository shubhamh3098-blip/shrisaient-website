import React, { useState } from 'react';
import {
  RotateCcw,
  Plus,
  Trash2,
  Calculator,
  CheckCircle2,
  Sparkles,
  Printer,
  Share2,
  Tv,
  Sofa,
  Layers,
  Wind,
  ArrowRight,
  ShieldCheck,
  PackageCheck
} from 'lucide-react';
import { StoreData, StockItem } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface ApplianceFurnitureExchangeViewProps {
  storeData: StoreData;
}

interface OldItemEvaluation {
  category: 'LED TV' | 'Refrigerator' | 'Washing Machine' | 'Air Cooler' | 'Teak Sofa' | 'Steel Almirah' | 'Diwan Bed';
  brand: string;
  condition: 'Working (चांगल्या स्थितीत)' | 'Defective/Needs Repair (दुरुस्तीची गरज)' | 'Scrap (भंगार)';
  yearsUsed: number;
  calculatedExchangeValue: number;
}

export const ApplianceFurnitureExchangeView: React.FC<ApplianceFurnitureExchangeViewProps> = ({
  storeData,
}) => {
  const { isDayMode } = useTheme();

  // Exchange Assessment State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedNewProduct, setSelectedNewProduct] = useState<StockItem | null>(storeData.stock[0] || null);

  const [oldItem, setOldItem] = useState<OldItemEvaluation>({
    category: 'LED TV',
    brand: 'LG / Samsung 32-inch Old',
    condition: 'Working (चांगल्या स्थितीत)',
    yearsUsed: 4,
    calculatedExchangeValue: 3500,
  });

  // Calculate Exchange Fair Value Rule-of-thumb
  const computeExchangeBonus = (cat: string, condition: string, years: number) => {
    let baseVal = 2000;
    if (cat === 'LED TV') baseVal = 3000;
    if (cat === 'Refrigerator') baseVal = 4000;
    if (cat === 'Teak Sofa') baseVal = 5000;
    if (cat === 'Steel Almirah') baseVal = 2500;
    if (cat === 'Washing Machine') baseVal = 2500;
    if (cat === 'Air Cooler') baseVal = 1200;

    // Condition multiplier
    let mult = 1.0;
    if (condition.includes('Working')) mult = 1.2;
    if (condition.includes('Defective')) mult = 0.7;
    if (condition.includes('Scrap')) mult = 0.4;

    // Depreciation for years
    const yearDiscount = Math.max(0.5, 1 - years * 0.08);

    return Math.round(baseVal * mult * yearDiscount);
  };

  const handleUpdateItem = (updated: Partial<OldItemEvaluation>) => {
    const next = { ...oldItem, ...updated };
    const val = computeExchangeBonus(next.category, next.condition, next.yearsUsed);
    setOldItem({ ...next, calculatedExchangeValue: val });
  };

  // Pricing math
  const newProductPrice = selectedNewProduct ? selectedNewProduct.salePrice : 35000;
  const exchangeDiscount = oldItem.calculatedExchangeValue;
  const finalPayable = Math.max(0, newProductPrice - exchangeDiscount);
  const weeklyInstallmentApprox = Math.round(finalPayable / (30 * 4));

  // WhatsApp Exchange Offer slip
  const handleShareWhatsAppSlip = () => {
    if (!customerPhone) {
      alert('कृपया ग्राहकाचा मोबाईल नंबर टाका');
      return;
    }

    const msg =
`🔄 *SHRI SAI ENTERPRISES - OLD APPLIANCE & FURNITURE EXCHANGE QUOTATION* 🔄

Dear *${customerName || 'Customer'}*,
Thank you for visiting Shri Sai Enterprises, Wardha! Here is your exclusive exchange offer breakdown:

✨ *New Product Chosen:*
Product: *${selectedNewProduct?.name || 'Selected Showroom Item'}*
Brand/Model: ${selectedNewProduct?.brand || 'Premium Teak/Electronics'}
Original Showroom Price: ₹${newProductPrice.toLocaleString('en-IN')}

♻️ *Old Product Exchange Valuation:*
Old Item: *${oldItem.category} (${oldItem.brand})*
Condition: ${oldItem.condition}
Approved Exchange Discount: *-₹${exchangeDiscount.toLocaleString('en-IN')}*

🔥 *NET PAYABLE AMOUNT: ₹${finalPayable.toLocaleString('en-IN')} ONLY*
💳 *30-Month Scheme Weekly Option:* Approx ₹${weeklyInstallmentApprox}/week or 0% Bajaj/TVS Finance!

📍 *Shri Sai Enterprises*
Main Market Road, Wardha.
📞 98220 11223 / 87664 86915`;

    const encoded = encodeURIComponent(msg);
    const phone = customerPhone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/91${phone}?text=${encoded}`, '_blank');
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className={`p-4 sm:p-5 rounded-2xl border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
        isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20">
            <RotateCcw className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight">
                Old Appliance & Furniture Exchange Calculator
              </h1>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                जुने द्या - नवीन न्या
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Instant valuation of old TVs, Refrigerators, Coolers, and Sofas with automated invoice exchange deduction
            </p>
          </div>
        </div>

        {/* Action button */}
        <button
          type="button"
          onClick={handleShareWhatsAppSlip}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer"
        >
          <Share2 className="w-4 h-4" />
          <span>Send Exchange Quote to Customer</span>
        </button>
      </div>

      {/* Main Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Valuation Calculator Form (7 cols) */}
        <div className={`lg:col-span-7 p-4 sm:p-5 rounded-2xl border space-y-4 ${
          isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-center gap-2 border-b pb-3 border-slate-100 dark:border-slate-800">
            <Calculator className="w-4 h-4 text-emerald-500" />
            <h2 className="text-sm font-bold">1. Customer & Old Item Assessment</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-bold mb-1 text-slate-600 dark:text-slate-400">
                Customer Name (ग्राहकाचे नाव):
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="उदा. Ramesh Patil"
                className={`w-full p-2.5 rounded-xl border font-bold ${
                  isDayMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>
            <div>
              <label className="block font-bold mb-1 text-slate-600 dark:text-slate-400">
                WhatsApp Mobile (मोबाईल):
              </label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="उदा. 98220 11223"
                className={`w-full p-2.5 rounded-xl border font-mono font-bold ${
                  isDayMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>
          </div>

          {/* Old Item Selector */}
          <div className="space-y-3 pt-2 text-xs">
            <div>
              <label className="block font-bold mb-1 text-slate-600 dark:text-slate-400">
                Old Product Category (जुन्या वस्तूचा प्रकार):
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'LED TV', label: 'Old LED/CRT TV' },
                  { id: 'Refrigerator', label: 'Refrigerator' },
                  { id: 'Teak Sofa', label: 'Old Sofa / Cot' },
                  { id: 'Air Cooler', label: 'Air Cooler' },
                  { id: 'Washing Machine', label: 'Washing Machine' },
                  { id: 'Steel Almirah', label: 'Steel Cupboard' },
                ].map((item) => {
                  const isSel = oldItem.category === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleUpdateItem({ category: item.id as any })}
                      className={`p-2 rounded-xl border text-center font-bold transition cursor-pointer ${
                        isSel
                          ? 'bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                          : isDayMode
                          ? 'bg-slate-50 border-slate-200 text-slate-700'
                          : 'bg-slate-800 border-slate-700 text-slate-300'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold mb-1 text-slate-600 dark:text-slate-400">
                  Old Brand / Specs:
                </label>
                <input
                  type="text"
                  value={oldItem.brand}
                  onChange={(e) => handleUpdateItem({ brand: e.target.value })}
                  placeholder="उदा. Videocon 32 inch / Godrej 190L"
                  className={`w-full p-2.5 rounded-xl border font-medium ${
                    isDayMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-600 dark:text-slate-400">
                  Years Used (वापरलेली वर्षे):
                </label>
                <select
                  value={oldItem.yearsUsed}
                  onChange={(e) => handleUpdateItem({ yearsUsed: Number(e.target.value) })}
                  className={`w-full p-2.5 rounded-xl border font-bold ${
                    isDayMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                >
                  <option value={1}>1-2 Years (नवीन सारखे)</option>
                  <option value={3}>3-4 Years (मध्यम)</option>
                  <option value={6}>5-7 Years (जुने)</option>
                  <option value={10}>8+ Years (फार जुने)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold mb-1 text-slate-600 dark:text-slate-400">
                Working Condition (कामाची स्थिती):
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  'Working (चांगल्या स्थितीत)',
                  'Defective/Needs Repair (दुरुस्तीची गरज)',
                  'Scrap (भंगार)',
                ].map((cond) => {
                  const isSel = oldItem.condition === cond;
                  return (
                    <button
                      key={cond}
                      type="button"
                      onClick={() => handleUpdateItem({ condition: cond as any })}
                      className={`p-2 rounded-xl border text-center text-[11px] font-bold transition cursor-pointer ${
                        isSel
                          ? 'bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                          : isDayMode
                          ? 'bg-slate-50 border-slate-200 text-slate-700'
                          : 'bg-slate-800 border-slate-700 text-slate-300'
                      }`}
                    >
                      {cond.split(' ')[0]}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* New Showroom Product Selection */}
          <div className="border-t pt-3 border-slate-100 dark:border-slate-800 space-y-2 text-xs">
            <label className="block font-bold text-slate-600 dark:text-slate-400">
              2. Select New Showroom Product to Purchase:
            </label>
            <select
              value={selectedNewProduct?.id || ''}
              onChange={(e) => {
                const found = storeData.stock.find((s) => s.id === e.target.value);
                if (found) setSelectedNewProduct(found);
              }}
              className={`w-full p-2.5 rounded-xl border font-bold ${
                isDayMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700 text-white'
              }`}
            >
              {storeData.stock.map((stk) => (
                <option key={stk.id} value={stk.id}>
                  {stk.name} ({stk.brand}) — ₹{stk.salePrice.toLocaleString('en-IN')}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right Column: Instant Exchange Breakdown Card (5 cols) */}
        <div className={`lg:col-span-5 p-4 sm:p-5 rounded-2xl border flex flex-col justify-between space-y-4 ${
          isDayMode ? 'bg-emerald-50/40 border-emerald-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Official Exchange Certificate
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                Instant Value
              </span>
            </div>

            <div className="space-y-3 mt-4 text-xs">
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span>New Product MRP/Price:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  ₹{newProductPrice.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                <div className="flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Old Item Exchange Value:</span>
                </div>
                <span className="font-mono font-black text-sm">
                  - ₹{exchangeDiscount.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-baseline">
                <div>
                  <span className="text-xs font-bold text-slate-500 block">Final Net Cash / Card to Pay:</span>
                  <span className="text-[10px] text-slate-400">Tax Invoice will reflect exchange deduction</span>
                </div>
                <span className="font-mono font-black text-2xl text-slate-900 dark:text-white">
                  ₹{finalPayable.toLocaleString('en-IN')}
                </span>
              </div>

              {/* Weekly Installment Alternative */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs">
                <div className="font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>30-Month Weekly Passbook Option</span>
                </div>
                <p className="text-[11px] mt-0.5 opacity-90">
                  Pay remaining balance at just <strong>₹{weeklyInstallmentApprox} / week</strong> or 0% downpayment on Bajaj/TVS EMI!
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={handleShareWhatsAppSlip}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>Share Exchange Slip via WhatsApp</span>
            </button>
            <p className="text-[10px] text-center text-slate-400">
              *Valuation subject to final physical inspection at Wardha showroom.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
