import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Share2,
  Copy,
  Check,
  Megaphone,
  Gift,
  Calendar,
  Tag,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { BusinessSettings } from '../types';

interface PromoGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: BusinessSettings;
  onShowToast?: (msg: string, type: 'success' | 'info' | 'error') => void;
}

const PRESET_CAMPAIGNS = [
  {
    id: 'gudhipadwa',
    title: '🌸 गुढीपाडवा विशेष महाधमाका',
    occasion: 'गुढीपाडवा विशेष',
    product: 'कुलर, फ्रीज, वॉशिंग मशीन, एलईडी टीव्ही आणि सोफा सेट',
    offer: 'फ्लॅट २०% पर्यंत सूट + ०% डाऊन पेमेंट (बजाज / टीव्हीएस फायनान्स)',
    gift: 'प्रत्येक खरेदीवर खात्रीशीर मिक्सर किंवा डिनर सेट मोफत!',
    notes: 'साप्ताहिक बचत कार्डधारकांसाठी विशेष ₹५०० अतिरिक्त सवलत',
  },
  {
    id: 'summer_cooler',
    title: '☀️ उन्हाळा कुलर व एसी धमाका',
    occasion: 'समर कुलिंग महोत्सव',
    product: 'जम्बो कुलर (पत्रा व फायबर), इन्व्हर्टर, गोदरेज व एलजी रेफ्रिजरेटर',
    offer: 'थेट फॅक्टरी दरात कुलर विक्री + मोफत होम डिलिव्हरी',
    gift: 'कूलर स्टँड व कव्हर अगदी मोफत!',
    notes: '२ वर्षांची मोटर गॅरंटी व तत्पर सर्व्हिस',
  },
  {
    id: 'akshaya_tritiya',
    title: '🪙 अक्षय्य तृतीया व लग्न समारंभ पॅकेज',
    occasion: 'अक्षय्य तृतीया विशेष',
    product: 'संपूर्ण लग्नाचे फर्निचर (डबल बेड, कपाट, ३-सीटर सोफा, डायनिंग टेबल)',
    offer: 'फर्निचर कॉम्बो पॅकेजवर ₹१०,००० ची भव्य बचत',
    gift: 'प्युअर कॉटन गाद्या व २ उशा मोफत!',
    notes: 'वर्धा, देवळी, सेलू, पुलगाव परिसरात मोफत पोहोच',
  },
  {
    id: 'scheme_promo',
    title: '🎁 ३०-महिन्यांची साप्ताहिक बचत कार्ड योजना',
    occasion: 'नवीन बचत योजना नोंदणी सुरू',
    product: 'फक्त ₹१०० / ₹२०० दर आठवड्याला भरा आणि मिळवा मनपसंत वस्तू',
    offer: '५० आठवडे पूर्ण झाल्यावर मोफत बोनस किंवा आवडते सामान',
    gift: 'पहिले १०० सभासदांना स्पेशल वेलकम गिफ्ट',
    notes: 'दर आठवड्याला लकी ड्रॉ कूपन! एजंट आपल्या दारात',
  },
  {
    id: 'diwali_fest',
    title: '🪔 दिवाळी व धनत्रयोदशी महासेल',
    occasion: 'दिवाळी व धनत्रयोदशी महोत्सव',
    product: 'सर्व होम अप्लायन्सेस, स्मार्ट टीव्ही, वॉर्डरोब आणि लक्झरी सोफा',
    offer: 'स्क्रॅच कूपनवर मिळवा सोन्याचे नाणे किंवा थेट ₹५,००० पर्यंत सूट',
    gift: 'दिवाळी मिठाई बॉक्स व आकर्षक भेटवस्तू',
    notes: 'फक्त आधार कार्डवर सुलभ हप्ते मंजूर',
  },
];

export const PromoGeneratorModal: React.FC<PromoGeneratorModalProps> = ({
  isOpen,
  onClose,
  settings,
  onShowToast,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('gudhipadwa');
  const [occasion, setOccasion] = useState<string>(PRESET_CAMPAIGNS[0].occasion);
  const [product, setProduct] = useState<string>(PRESET_CAMPAIGNS[0].product);
  const [offer, setOffer] = useState<string>(PRESET_CAMPAIGNS[0].offer);
  const [gift, setGift] = useState<string>(PRESET_CAMPAIGNS[0].gift);
  const [customNotes, setCustomNotes] = useState<string>(PRESET_CAMPAIGNS[0].notes);

  const [generatedMessage, setGeneratedMessage] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [hasCopied, setHasCopied] = useState<boolean>(false);

  // Initialize with the first preset
  React.useEffect(() => {
    handleSelectPreset(PRESET_CAMPAIGNS[0]);
  }, []);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: typeof PRESET_CAMPAIGNS[0]) => {
    setSelectedPreset(preset.id);
    setOccasion(preset.occasion);
    setProduct(preset.product);
    setOffer(preset.offer);
    setGift(preset.gift);
    setCustomNotes(preset.notes);

    // Generate immediately with clean, zero-watermark template
    const clean = `🎉 *${preset.occasion.toUpperCase()} महाधमाका ऑफर!* 🎉
*${settings.businessName || 'SHRI SAI ENTERPRISES, WARDHA'}* 🙏✨

घर सजवा आणि आनंद द्विगुणीत करा! आमच्या शोरूममध्ये खास सणानिमित्त सुरू आहे भव्य सेल:

✨ *ऑफरचे मुख्य आकर्षण:*
━━━━━━━━━━━━━━━━━
🛍️ *वस्तू:* ${preset.product}
💰 *खास सवलत:* ${preset.offer}
🎁 *मोफत भेट:* ${preset.gift}
${preset.notes ? `⭐ *विशेष:* ${preset.notes}\n` : ''}━━━━━━━━━━━━━━━━━

💳 *बजाज / टीव्हीएस / एचडीबी फायनान्सवर ०% व्याजावर सुलभ हप्ते उपलब्ध!*
🤝 *३०-महिन्यांची साप्ताहिक बचत कार्ड योजना सुरू (कमी हप्त्यात मोठी बचत)!*

👉 *अधिकृत व्हॉट्सॲप ग्रुप जॉईन करा व रोजच्या ऑफर्स मिळवा:*
${settings.whatsappGroupLink || 'https://chat.whatsapp.com/CLcaeUq1bHH1RE0203oPaP?s=cl&p=a&mlu=4&ilr=4'}

📍 *पत्ता:* ${settings.address || 'मातोश्री सभागृह समोर, आर्वी रोड, वर्धा'}
📞 *संपर्क / ऑर्डर:* ${settings.phone || '8766486915 / 8600122798'}
🌐 *वेबसाईट:* ${settings.domainName || 'shrisaient.in'}

_आजच भेट द्या आणि आपल्या पसंतीचे सामान घरी घेऊन जा!_ ✨`;

    setGeneratedMessage(clean);
  };

  const handleGenerateWithAi = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate-promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          occasion,
          product,
          offer,
          gift,
          customNotes,
          businessName: settings.businessName || 'SHRI SAI ENTERPRISES',
          phone: settings.phone || '8766486915 / 8600122798',
          address: settings.address || 'मातोश्री सभागृह समोर, आर्वी रोड, वर्धा',
          whatsappGroupLink:
            settings.whatsappGroupLink ||
            'https://chat.whatsapp.com/CLcaeUq1bHH1RE0203oPaP?s=cl&p=a&mlu=4&ilr=4',
        }),
      });

      if (!res.ok) throw new Error('Generation failed');
      const data = await res.json();
      if (data.message) {
        setGeneratedMessage(data.message);
        if (onShowToast) {
          onShowToast(
            data.provider === 'gemini'
              ? '✓ Gemini AI द्वारे वॉटरमार्क नसलेला सुंदर मेसेज तयार झाला!'
              : '✓ नवीन सणवार मेसेज तयार झाला!',
            'success'
          );
        }
      }
    } catch (err) {
      // Fallback local generator (Zero-watermark guaranteed)
      const fallback = `🎉 *${occasion.toUpperCase()} महाधमाका ऑफर!* 🎉
*${settings.businessName || 'SHRI SAI ENTERPRISES'}* कडून सस्नेह नमस्कार! 🙏✨

✨ *ऑफरचे मुख्य आकर्षण:*
━━━━━━━━━━━━━━━━━
🛍️ *वस्तू:* ${product}
💰 *खास सवलत:* ${offer}
🎁 *मोफत भेट:* ${gift}
${customNotes ? `⭐ *विशेष:* ${customNotes}\n` : ''}━━━━━━━━━━━━━━━━━

💳 *बजाज / टीव्हीएस फायनान्सवर ०% सुलभ हप्ते उपलब्ध!*
👉 *व्हॉट्सॲप ग्रुप जॉईन करा:* ${settings.whatsappGroupLink || 'https://chat.whatsapp.com/CLcaeUq1bHH1RE0203oPaP?s=cl&p=a&mlu=4&ilr=4'}

📍 *पत्ता:* ${settings.address || 'मातोश्री सभागृह समोर, आर्वी रोड, वर्धा'}
📞 *संपर्क:* ${settings.phone || '8766486915 / 8600122798'}`;
      setGeneratedMessage(fallback);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedMessage);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
    if (onShowToast) {
      onShowToast('✓ मेसेज कॉपी झाला! आता WhatsApp वर पेस्ट करा.', 'success');
    }
  };

  const handleShareToWhatsApp = () => {
    const encoded = encodeURIComponent(generatedMessage);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto text-slate-800 dark:text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-md">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>सणवार व साप्ताहिक ऑफर्स व्हॉट्सॲप जनरेटर</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800">
                  Zero Watermark
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                गुढीपाडवा, उन्हाळा सेल, लग्न फर्निचर व साप्ताहिक कार्ड योजना जाहिरात मेसेज तयार करा
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: 2 Columns */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Left Column: Presets & Controls (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>रेडीमेड सणवार मोहिमा निवडा (Quick Presets):</span>
              </label>
              <div className="space-y-1.5">
                {PRESET_CAMPAIGNS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition border cursor-pointer flex items-center justify-between ${
                      selectedPreset === p.id
                        ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{p.title}</span>
                    {selectedPreset === p.id && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Editable Form Inputs */}
            <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  प्रसंग / सण (Occasion):
                </label>
                <input
                  type="text"
                  value={occasion}
                  onChange={(e) => setOccasion(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  वस्तू / प्रॉडक्ट्स (Products):
                </label>
                <input
                  type="text"
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  सूट / ऑफर (Discount / EMI):
                </label>
                <input
                  type="text"
                  value={offer}
                  onChange={(e) => setOffer(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  मोफत गिफ्ट (Free Gift):
                </label>
                <input
                  type="text"
                  value={gift}
                  onChange={(e) => setGift(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  विशेष टीप (Special Highlight):
                </label>
                <input
                  type="text"
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <button
                type="button"
                onClick={handleGenerateWithAi}
                disabled={isGenerating}
                className="w-full min-h-[44px] mt-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>मेसेज तयार होत आहे...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>✨ Gemini AI ने नवीन मेसेज बनवा</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Live Message Preview (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span>💬 तयार व्हॉट्सॲप मेसेज प्रिव्ह्यू (Live Preview)</span>
              </label>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                ✓ १००% वॉटरमार्क मुक्त (No AI Watermark)
              </span>
            </div>

            <div className="flex-1 min-h-[350px] relative">
              <textarea
                value={generatedMessage}
                onChange={(e) => setGeneratedMessage(e.target.value)}
                rows={15}
                className="w-full h-full p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-xs leading-relaxed text-slate-900 dark:text-slate-100 resize-none focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs sm:text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            बंद करा (Close)
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="min-h-[44px] px-4 py-2 border border-amber-600 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer flex items-center gap-1.5"
            >
              {hasCopied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>कॉपी झाले!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>मेसेज कॉपी करा</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleShareToWhatsApp}
              className="min-h-[44px] px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition cursor-pointer flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              <span>WhatsApp वर ब्रॉडकास्ट करा</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
