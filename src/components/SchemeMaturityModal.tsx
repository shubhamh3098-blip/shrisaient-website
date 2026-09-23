import React, { useState, useMemo } from 'react';
import {
  X,
  Award,
  CheckCircle2,
  Printer,
  Share2,
  Gift,
  Tv,
  CreditCard,
  Calendar,
  Sparkles,
  User,
  MapPin,
  Phone,
  FileCheck
} from 'lucide-react';
import { CardMember, BusinessSettings, StockItem } from '../types';

interface SchemeMaturityModalProps {
  isOpen: boolean;
  onClose: () => void;
  member?: CardMember | null;
  cardMembers?: CardMember[];
  settings: BusinessSettings;
  stockItems?: StockItem[];
  onCompleteMaturity: (data: {
    memberId: string;
    productDelivered: string;
    productValue: number;
    schemeCreditUsed: number;
    extraPaidByCustomer: number;
    refundToCustomer: number;
    paymentMode: 'Cash' | 'Online';
    notes?: string;
  }) => void;
}

const DEFAULT_POPULAR_GIFTS = [
  { name: '43" 4K Ultra HD Smart Google TV', mrp: 32000, offerPrice: 22000, category: 'Electronics' },
  { name: '32" HD Ready Smart LED TV', mrp: 18000, offerPrice: 12500, category: 'Electronics' },
  { name: '240L Inverter Double Door Refrigerator', mrp: 30000, offerPrice: 24500, category: 'Home Appliance' },
  { name: 'सागवान ३-डोअर कपाट (CP Pure Teak Almirah)', mrp: 36000, offerPrice: 28000, category: 'Furniture' },
  { name: 'सागवान ६x६ बॉक्स डबल बेड (Teak Double Bed)', mrp: 42000, offerPrice: 32000, category: 'Furniture' },
  { name: '7.5 Kg Fully Automatic Top-Load Washing Machine', mrp: 24000, offerPrice: 18500, category: 'Home Appliance' },
  { name: 'Heavy Commercial Desert Air Cooler (120L)', mrp: 14000, offerPrice: 9500, category: 'Cooler' },
  { name: '750W 4-Jar Mixer Grinder + Dry Iron Combo', mrp: 8000, offerPrice: 5500, category: 'Small Appliance' },
];

export const SchemeMaturityModal: React.FC<SchemeMaturityModalProps> = ({
  isOpen,
  onClose,
  member: initialMember,
  cardMembers = [],
  settings,
  stockItems = [],
  onCompleteMaturity,
}) => {
  const [selectedMemberId, setSelectedMemberId] = useState<string>(
    initialMember?.id || cardMembers[0]?.id || ''
  );

  const member = useMemo(() => {
    if (initialMember) return initialMember;
    return cardMembers.find((m) => m.id === selectedMemberId) || cardMembers[0] || null;
  }, [initialMember, cardMembers, selectedMemberId]);

  const [selectedProduct, setSelectedProduct] = useState<string>('43" 4K Ultra HD Smart Google TV');
  const [productValue, setProductValue] = useState<number>(22000);
  const [bonusDiscount, setBonusDiscount] = useState<number>(500);
  const [settlementMode, setSettlementMode] = useState<'Cash' | 'Online'>('Cash');
  const [deliveryDate, setDeliveryDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [memoNo, setMemoNo] = useState<string>(
    `MAT-${member ? member.cardNumber : '0000'}-${Date.now().toString().slice(-4)}`
  );
  const [notes, setNotes] = useState<string>('३०-महिने साप्ताहिक बचत योजना यशस्वीरीत्या पूर्ण. वस्तू सुपूर्द केली.');
  const [isSavedSuccess, setIsSavedSuccess] = useState(false);

  // Deposited balance in card
  const totalDeposited = member?.totalDeposited || 0;
  const netSavingsBalance = member?.netBalance ?? totalDeposited;

  // Total Credit Available = Net Savings + Bonus Discount
  const totalCreditAvailable = netSavingsBalance + bonusDiscount;

  // Difference:
  // If productValue > totalCreditAvailable => customer must pay extra
  // If productValue < totalCreditAvailable => shop refunds remaining cash
  const extraToPayByCustomer = Math.max(0, productValue - totalCreditAvailable);
  const cashRefundToCustomer = Math.max(0, totalCreditAvailable - productValue);

  if (!isOpen) return null;

  if (!member) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 text-center space-y-4">
          <p className="text-slate-600 dark:text-slate-300">कोणतेही कार्ड सभासद सापडले नाही.</p>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 text-white rounded-xl text-sm font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const handleProductSelect = (name: string, price: number) => {
    setSelectedProduct(name);
    setProductValue(price);
  };

  const handleConfirmMaturity = () => {
    if (!selectedProduct.trim()) {
      alert('कृपया वाटप करावयाची वस्तू निवडा.');
      return;
    }

    onCompleteMaturity({
      memberId: member.id,
      productDelivered: selectedProduct,
      productValue,
      schemeCreditUsed: Math.min(productValue, totalCreditAvailable),
      extraPaidByCustomer: extraToPayByCustomer,
      refundToCustomer: cashRefundToCustomer,
      paymentMode: settlementMode,
      notes: `${notes} (वस्तू: ${selectedProduct}, किंमत: ₹${productValue}, जादा भरणा: ₹${extraToPayByCustomer})`
    });

    setIsSavedSuccess(true);
  };

  const handleWhatsAppCertificate = () => {
    const cleanPh = (member.phone || '').replace(/\D/g, '').slice(-10);
    const msg =
`🎊 *हार्दिक अभिनंदन! योजना पूर्तता प्रमाणपत्र* 🎊
🚩 *श्री साई इंटरप्राइजेस, वर्धा* 🚩
(३०-महिने साप्ताहिक बचत योजना मॅच्युरिटी सेटलमेंट)

आदरणीय सभासद *${member.customerName}* जी,
आपली ३०-महिने साप्ताहिक बचत योजना यशस्वीरीत्या पूर्ण झाली असून आपले अधिकृत पूर्तता प्रमाणपत्र खालीलप्रमाणे आहे:

📜 *योजना पूर्तता तपशील (Settlement Memo #${memoNo}):*
• कार्ड नंबर: *#${member.cardNumber}* (${member.schemeName})
• गाव/पत्ता: ${member.village || 'वर्धा'}
• एकूण जमा रक्कम: *₹${totalDeposited.toLocaleString('en-IN')}*
• दुकानाकडून बोनस/सवलत: ₹${bonusDiscount.toLocaleString('en-IN')}
• एकूण जमा क्रेडिट: *₹${totalCreditAvailable.toLocaleString('en-IN')}*

🎁 *वाटप केलेली निवडक वस्तू:*
*${selectedProduct}* (किंमत: ₹${productValue.toLocaleString('en-IN')})
${extraToPayByCustomer > 0 ? `• जादा फरक भरणा (Customer Paid): *₹${extraToPayByCustomer.toLocaleString('en-IN')}* (${settlementMode})\n` : ''}${cashRefundToCustomer > 0 ? `• ग्राहकास शिल्लक रोख परतावा: *₹${cashRefundToCustomer.toLocaleString('en-IN')}*\n` : ''}📅 *सुपूर्द तारीख:* ${deliveryDate}

श्री साई इंटरप्राइजेस परिवारावर दाखवलेल्या विश्वासाबद्दल आपले मनःपूर्वक आभार! 🙏

📍 *पत्ता:* मातोश्री सभागृह समोर, आर्वी रोड, पंजाब कॉलनी, वर्धा.
📱 *संपर्क:* ${settings.phone || '8766486915'} / 8600122798`;

    window.open(`https://wa.me/91${cleanPh}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm no-print">
      <div className="bg-white dark:bg-[#0C1425] rounded-3xl shadow-2xl border border-amber-500/40 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-slate-900 dark:text-white">
        
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-amber-500/30 bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shadow-inner">
              <Award className="w-6 h-6 text-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-xl font-black tracking-tight">
                  ३०-महिने योजना पूर्तता व वस्तू वाटप (Scheme Maturity Settlement)
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-950 text-amber-300 font-bold text-[10px] tracking-wider uppercase">
                  Maturity Memo
                </span>
              </div>
              <p className="text-xs text-amber-100 font-medium">
                सभासदाची जमा रक्कम हिशोबात घेऊन वस्तू वाटप, जादा रक्कम/परतावा व अधिकृत पूर्तता प्रमाणपत्र
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-black/20 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Member Profile Ribbon */}
        <div className="p-3 sm:p-4 bg-amber-50/70 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-900/50 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center font-mono text-sm">
              #{member.cardNumber}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  {member.customerName}
                </h3>
                {!initialMember && cardMembers.length > 1 && (
                  <select
                    value={selectedMemberId}
                    onChange={(e) => setSelectedMemberId(e.target.value)}
                    className="text-xs bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-lg px-2 py-1 font-medium text-slate-800 dark:text-slate-200 cursor-pointer"
                  >
                    {cardMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        #{m.cardNumber} - {m.customerName} ({m.village || 'वर्धा'}) - ₹{m.totalDeposited || 0}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {member.schemeName} • {member.village || 'वर्धा'} • फोन: {member.phone || '-'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">एकूण जमा बचत (Total Savings)</span>
              <strong className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                ₹{totalDeposited.toLocaleString('en-IN')}
              </strong>
            </div>
            <div className="text-right pl-3 border-l border-amber-200 dark:border-amber-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">सध्या शिल्लक (Net Balance)</span>
              <strong className="text-lg font-black text-indigo-600 dark:text-indigo-400 font-mono">
                ₹{netSavingsBalance.toLocaleString('en-IN')}
              </strong>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Step 1: Select or Enter Product */}
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1.5">
              <Gift className="w-4 h-4 text-amber-500" />
              <span>१. वाटप करावयाची वस्तू निवडा (Select Delivered Product):</span>
            </label>

            {/* Quick Product Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
              {DEFAULT_POPULAR_GIFTS.map((g, idx) => {
                const isSelected = selectedProduct === g.name;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleProductSelect(g.name, g.offerPrice)}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md font-bold'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-xs font-bold truncate block">{g.name}</span>
                    <div className="mt-1 flex items-baseline justify-between text-[11px] font-mono">
                      <span className={isSelected ? 'text-slate-900' : 'text-slate-400'}>किंमत:</span>
                      <strong className={isSelected ? 'text-slate-950 font-black' : 'text-amber-600 dark:text-amber-400'}>
                        ₹{g.offerPrice.toLocaleString('en-IN')}
                      </strong>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Input */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  इतर वस्तू नाव (Custom Item):
                </label>
                <input
                  type="text"
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  placeholder="उदा. 43 इंच स्मार्ट टीव्ही / सागवान डबल बेड"
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  वस्तूची किंमत (₹):
                </label>
                <input
                  type="number"
                  value={productValue}
                  onChange={(e) => setProductValue(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold"
                />
              </div>
            </div>
          </div>

          {/* Step 2: Financial Settlement Math */}
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-3xl border border-indigo-900/50 shadow-xl space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>२. फायनान्शियल सेटलमेंट हिशोब (Financial Breakdown):</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700">
                <span className="text-[10px] text-slate-400 block font-bold">वस्तू किंमत (Price)</span>
                <span className="text-lg font-black text-white font-mono mt-0.5 block">
                  ₹{productValue.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700">
                <span className="text-[10px] text-slate-400 block font-bold">जमा बचत (Savings)</span>
                <span className="text-lg font-black text-emerald-400 font-mono mt-0.5 block">
                  - ₹{netSavingsBalance.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700">
                <span className="text-[10px] text-slate-400 block font-bold">दुकानातर्फे बोनस/सवलत</span>
                <div className="flex items-center justify-center gap-1 mt-0.5">
                  <span className="text-amber-400 font-mono font-black text-sm">₹</span>
                  <input
                    type="number"
                    value={bonusDiscount}
                    onChange={(e) => setBonusDiscount(Number(e.target.value))}
                    className="w-16 px-1 py-0.5 bg-slate-900 border border-slate-600 rounded text-center text-sm font-bold text-amber-400 font-mono"
                  />
                </div>
              </div>
              <div className={`p-3 rounded-2xl border ${extraToPayByCustomer > 0 ? 'bg-rose-950/60 border-rose-600 text-rose-300' : 'bg-emerald-950/60 border-emerald-600 text-emerald-300'}`}>
                <span className="text-[10px] font-bold block">
                  {extraToPayByCustomer > 0 ? 'ग्राहकाने द्यावयाचा फरक' : 'ग्राहकास परतावा (Refund)'}
                </span>
                <span className="text-xl font-black font-mono mt-0.5 block">
                  ₹{(extraToPayByCustomer > 0 ? extraToPayByCustomer : cashRefundToCustomer).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {extraToPayByCustomer > 0 && (
              <div className="flex items-center gap-4 text-xs pt-1">
                <span className="text-slate-300 font-semibold">फरक भरणा पेमेंट मोड:</span>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="settleMode"
                    value="Cash"
                    checked={settlementMode === 'Cash'}
                    onChange={() => setSettlementMode('Cash')}
                  />
                  <span>💵 रोख (Cash)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="settleMode"
                    value="Online"
                    checked={settlementMode === 'Online'}
                    onChange={() => setSettlementMode('Online')}
                  />
                  <span>📱 ऑनलाईन / QR (Online)</span>
                </label>
              </div>
            )}
          </div>

          {/* Printable Preview Certificate Section */}
          <div
            id="printable-maturity-memo"
            className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-amber-400/60 shadow-lg space-y-4 text-slate-900 dark:text-white"
          >
            <div className="text-center border-b border-amber-300 dark:border-amber-800/80 pb-3">
              <span className="px-3 py-1 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] tracking-widest uppercase">
                SCHEME MATURITY SETTLEMENT CERTIFICATE
              </span>
              <h3 className="text-xl font-black uppercase text-slate-900 dark:text-white mt-1.5">
                {settings.businessName || 'श्री साई इंटरप्राइजेस'}
              </h3>
              <p className="text-xs text-slate-500">
                मातोश्री सभागृह समोर, आर्वी रोड, पंजाब कॉलनी, वर्धा • मो. {settings.phone || '8766486915'}
              </p>
              <div className="text-xs font-bold text-amber-700 dark:text-amber-400 mt-1">
                ३०-महिने साप्ताहिक बचत योजना पूर्तता व वस्तू सुपूर्द पावती
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] block">सभासद नाव:</span>
                <strong className="text-sm font-bold">{member.customerName}</strong>
                <span className="text-slate-500 block text-[11px]">गाव: {member.village || 'वर्धा'} • फोन: {member.phone}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 text-[10px] block">पावती क्रमांक व तारीख:</span>
                <strong className="font-mono text-sm">#{memoNo}</strong>
                <span className="text-slate-500 block text-[11px] font-mono">तारीख: {deliveryDate}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span>कार्ड नंबर व योजना:</span>
                <strong className="font-mono">#{member.cardNumber} ({member.schemeName})</strong>
              </div>
              <div className="flex justify-between">
                <span>एकूण जमा हप्ता बचत:</span>
                <strong className="font-mono text-emerald-600">₹{totalDeposited.toLocaleString('en-IN')}</strong>
              </div>
              <div className="flex justify-between">
                <span>सुपूर्द केलेली वस्तू:</span>
                <strong className="font-bold text-indigo-600 dark:text-indigo-400">{selectedProduct}</strong>
              </div>
              <div className="flex justify-between">
                <span>वस्तूची ठरलेली किंमत:</span>
                <strong className="font-mono">₹{productValue.toLocaleString('en-IN')}</strong>
              </div>
              {extraToPayByCustomer > 0 && (
                <div className="flex justify-between text-rose-600 dark:text-rose-400 font-bold pt-1 border-t border-slate-200 dark:border-slate-700">
                  <span>ग्राहकाने जमा केलेला जादा फरक:</span>
                  <span className="font-mono">₹{extraToPayByCustomer.toLocaleString('en-IN')} ({settlementMode})</span>
                </div>
              )}
              {cashRefundToCustomer > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold pt-1 border-t border-slate-200 dark:border-slate-700">
                  <span>ग्राहकास परत केलेली शिल्लक रोकड:</span>
                  <span className="font-mono">₹{cashRefundToCustomer.toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>

            {/* Signature Line */}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-8 text-center text-xs">
              <div className="space-y-6">
                <div className="h-8 border-b border-dashed border-slate-400"></div>
                <p className="font-bold text-slate-800 dark:text-slate-200">सभासदाची सही (वस्तू सुस्थितीत मिळाली)</p>
              </div>
              <div className="space-y-6">
                <div className="h-8 border-b border-dashed border-slate-400"></div>
                <p className="font-bold text-slate-800 dark:text-slate-200">अधिकृत स्वाक्षरी • श्री साई इंटरप्राइजेस</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleWhatsAppCertificate}
              className="px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition"
            >
              <Share2 className="w-4 h-4" />
              <span>WhatsApp वर प्रमाणपत्र पाठवा</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition"
            >
              <Printer className="w-4 h-4" />
              <span>A4 प्रिंट</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
            >
              बंद करा
            </button>
            <button
              onClick={handleConfirmMaturity}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 active:scale-95 text-slate-950 font-black text-xs shadow-md cursor-pointer transition flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSavedSuccess ? '✅ योजना मॅच्युरिटी नोंदवली गेली!' : '🎯 योजना मॅच्युरिटी पूर्ण करा'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SchemeMaturityModal;
