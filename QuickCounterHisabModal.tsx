import React, { useState } from 'react';
import {
  X,
  Calculator,
  Share2,
  Phone,
  MessageCircle,
  Copy,
  CheckCircle2,
  Receipt,
  Plus,
  ArrowRight
} from 'lucide-react';
import { StoreData, Customer } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface QuickCounterHisabModalProps {
  storeData: StoreData;
  onClose: () => void;
  onConvertToBill?: (details: {
    customerName: string;
    customerPhone: string;
    itemName: string;
    totalAmount: number;
    paidAmount: number;
    balanceDue: number;
  }) => void;
}

export const QuickCounterHisabModal: React.FC<QuickCounterHisabModalProps> = ({
  storeData,
  onClose,
  onConvertToBill,
}) => {
  const { isDayMode } = useTheme();

  // Scratchpad Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [itemName, setItemName] = useState('दिवाण (Wooden Diwan 5x6)');
  const [totalPrice, setTotalPrice] = useState<string>('7000');
  const [advancePaid, setAdvancePaid] = useState<string>('3000');
  const [oldExchangeValuation, setOldExchangeValuation] = useState<string>('0');
  const [notes, setNotes] = useState('');
  const [copied, setCopied] = useState(false);

  // Quick Preset Items
  const presetItems = [
    'दिवाण 5x6 (Diwan Bed)',
    'किंग साइज बेड (King Bed)',
    'सॅमसंग 43" 4K Smart TV',
    'एलजी 242L Refrigerator',
    'कूलर (Desert Air Cooler)',
    'टीकवूड सोफा सेट 5-Seater',
    'स्टील व लाकडी कपाट (Almari)',
    'वॉशिंग मशीन (Washing Machine)',
  ];

  // Mathematical Calculations
  const totalNum = parseFloat(totalPrice) || 0;
  const advanceNum = parseFloat(advancePaid) || 0;
  const exchangeNum = parseFloat(oldExchangeValuation) || 0;
  const netPayable = Math.max(0, totalNum - exchangeNum);
  const balanceDue = Math.max(0, netPayable - advanceNum);

  // Formatted Message for WhatsApp
  const generateHisabText = () => {
    let msg = `*श्री साई इंटरप्रायजेस, वर्धा*\n`;
    msg += `(Electronics & Furniture Showroom)\n`;
    msg += `मातोश्री सभागृह समोर, आर्वी रोड, पंजाब कॉलनी, वर्धा - 442001\n`;
    msg += `📞 संपर्क: 8600122978 / 9175537365 / 8766486915\n`;
    msg += `--------------------------------\n`;
    msg += `📋 *काउंटर हिशोब चिठ्ठी (Counter Deal Summary)*\n`;
    if (customerName.trim()) msg += `ग्राहक: *${customerName.trim()}*\n`;
    if (customerPhone.trim()) msg += `मोबाईल: ${customerPhone.trim()}\n`;
    msg += `तारीख: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}\n`;
    msg += `--------------------------------\n`;
    msg += `वस्तू/तपशील: *${itemName}*\n`;
    msg += `एकूण किंमत: *₹${totalNum.toLocaleString('en-IN')}*\n`;
    if (exchangeNum > 0) {
      msg += `जुनी वस्तू जमा (Exchange): -₹${exchangeNum.toLocaleString('en-IN')}\n`;
      msg += `निव्वळ देय रक्कम: ₹${netPayable.toLocaleString('en-IN')}\n`;
    }
    msg += `रोख / अ‍ॅडव्हान्स जमा: *₹${advanceNum.toLocaleString('en-IN')}*\n`;
    msg += `--------------------------------\n`;
    if (balanceDue > 0) {
      msg += `🚨 *शिल्लक बाकी (Balance Due): ₹${balanceDue.toLocaleString('en-IN')}*\n`;
    } else {
      msg += `✅ *हिशोब पूर्ण: पूर्ण रक्कम जमा (Full Paid / Nil Due)*\n`;
    }
    if (notes.trim()) {
      msg += `टीप: ${notes.trim()}\n`;
    }
    msg += `--------------------------------\n`;
    msg += `आमच्या शोरूमला भेट दिल्याबद्दल धन्यवाद! 🙏`;
    return msg;
  };

  const handleShareWhatsApp = () => {
    const text = generateHisabText();
    const encoded = encodeURIComponent(text);
    const cleanPhone = customerPhone.replace(/[^0-9]/g, '');
    const url = cleanPhone.length >= 10
      ? `https://wa.me/91${cleanPhone.slice(-10)}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateHisabText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className={`w-full max-w-xl rounded-3xl shadow-2xl border flex flex-col max-h-[92vh] overflow-hidden transition-colors ${
        isDayMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
      }`}>
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-950 text-amber-400 flex items-center justify-center shadow-md">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base sm:text-lg">
                  काउंटर हिशोब कॅल्क्युलेटर (Rapid Hisab)
                </h2>
                <span className="text-[10px] font-black uppercase bg-slate-950 text-amber-300 px-2 py-0.5 rounded-full">
                  Scratchpad
                </span>
              </div>
              <p className="text-xs text-slate-900/80 font-medium">
                उदा. दिवाण 7000, 3000 दिले, बाकी 4000 • 1-टॅप WhatsApp शेअर
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-black/10 text-slate-950 transition cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Quick presets */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">
              रेडिमेड वस्तू सिलेक्ट करा (Quick Preset Items):
            </label>
            <div className="flex flex-wrap gap-1.5">
              {presetItems.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setItemName(p)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                    itemName === p
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-sm'
                      : isDayMode
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                      : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Item details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">
                वस्तू / तपशील नाव (Item Description)
              </label>
              <input
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="उदा. दिवाण, टीव्ही, सोफा..."
                className={`w-full p-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                  isDayMode ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">
                एकूण ठरलेली रक्कम (Total Deal Amount ₹)
              </label>
              <input
                type="number"
                value={totalPrice}
                onChange={(e) => setTotalPrice(e.target.value)}
                placeholder="उदा. 7000"
                className={`w-full p-2.5 rounded-xl border text-xs font-bold text-base focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                  isDayMode ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>
          </div>

          {/* Down payment & Old Exchange */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1 block">
                रोख जमा / अ‍ॅडव्हान्स दिले (Cash Paid ₹)
              </label>
              <input
                type="number"
                value={advancePaid}
                onChange={(e) => setAdvancePaid(e.target.value)}
                placeholder="उदा. 3000"
                className={`w-full p-2.5 rounded-xl border text-xs font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  isDayMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700'
                }`}
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1 block">
                जुनी वस्तू जमा किंमत (Old Exchange Valuation ₹)
              </label>
              <input
                type="number"
                value={oldExchangeValuation}
                onChange={(e) => setOldExchangeValuation(e.target.value)}
                placeholder="उदा. 0"
                className={`w-full p-2.5 rounded-xl border text-xs font-bold text-blue-600 dark:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDayMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700'
                }`}
              />
            </div>
          </div>

          {/* Customer Meta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">
                ग्राहकाचे नाव (Customer Name - ऐच्छिक)
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="उदा. रमेश वानखडे"
                className={`w-full p-2.5 rounded-xl border text-xs ${
                  isDayMode ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
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
                  isDayMode ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>
          </div>

          {/* Big Visual Calculation Card */}
          <div className={`p-4 rounded-2xl border-2 transition-all ${
            balanceDue > 0
              ? 'bg-rose-500/10 border-rose-500/40'
              : 'bg-emerald-500/10 border-emerald-500/40'
          }`}>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  काऊंटर हिशोब निकाल (Live Calculation)
                </span>
                <div className="text-sm font-semibold mt-1">
                  ₹{totalNum.toLocaleString('en-IN')} - ₹{exchangeNum.toLocaleString('en-IN')} (एक्सचेंज) - ₹{advanceNum.toLocaleString('en-IN')} (दिले)
                </div>
              </div>

              <div className="text-right">
                <span className={`text-xs font-bold uppercase tracking-widest ${
                  balanceDue > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                }`}>
                  {balanceDue > 0 ? 'शिल्लक बाकी (Balance Due)' : 'सर्व हिशोब क्लिअर'}
                </span>
                <div className={`text-2xl sm:text-3xl font-black tabular-nums ${
                  balanceDue > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                }`}>
                  ₹{balanceDue.toLocaleString('en-IN')}
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
              <span>{copied ? 'कॉपी झाले!' : 'हिशोब कॉपी'}</span>
            </button>

            {onConvertToBill && (
              <button
                type="button"
                onClick={() => {
                  onConvertToBill({
                    customerName: customerName || 'Walk-in Customer',
                    customerPhone: customerPhone || '',
                    itemName,
                    totalAmount: totalNum,
                    paidAmount: advanceNum,
                    balanceDue,
                  });
                  onClose();
                }}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
              >
                <Receipt className="w-4 h-4" />
                <span>याचे बिल बनवा (Make Bill)</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 active:scale-95 transition cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp वर पाठवा (1-Tap Share)</span>
            </button>

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
