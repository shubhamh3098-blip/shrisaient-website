import React, { useState, useRef } from 'react';
import {
  Sparkles,
  MessageCircle,
  Copy,
  Download,
  Share2,
  Calendar,
  Tag,
  Palette,
  CheckCircle2,
  RefreshCw,
  Gift,
  Tv,
  Coins,
  MapPin,
  Phone,
  Image as ImageIcon
} from 'lucide-react';
import { StoreData } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface FestivalPromoGeneratorViewProps {
  storeData: StoreData;
}

interface PromoPreset {
  id: string;
  festivalName: string;
  category: string;
  discount: string;
  schemeWeekly: string;
  themeColor: string;
  badge: string;
}

const PRESETS: PromoPreset[] = [
  {
    id: 'gudi-padwa',
    festivalName: 'गुढीपाडवा विशेष महासेल',
    category: 'स्मार्ट टीव्ही, कुलर व अस्सल सागवान सोफा',
    discount: '३०%',
    schemeWeekly: '१००',
    themeColor: '#d97706',
    badge: '🚩 नववर्ष महाधमाका',
  },
  {
    id: 'akshaya-tritiya',
    festivalName: 'अक्षय्य तृतीया सुवर्ण महोत्सव',
    category: 'चंद्रपूर अस्सल सागवान दिवाण, कपाट व सोफा सेट',
    discount: '३५%',
    schemeWeekly: '२००',
    themeColor: '#b45309',
    badge: '✨ शुभ मुहूर्त खरेदी',
  },
  {
    id: 'diwali',
    festivalName: 'दिवाळी भव्य लक्ष्मीपूजन ऑफर',
    category: '५५" 4K स्मार्ट टीव्ही, इनव्हर्टर फ्रीज व वाशिंग मशीन',
    discount: '४०%',
    schemeWeekly: '१००',
    themeColor: '#dc2626',
    badge: '🪔 दीपमहोत्सव धमाका',
  },
  {
    id: 'dussehra',
    festivalName: 'दसरा विशेष सीमोल्लंघन सेल',
    category: 'सागवान लाकडी फर्निचर व होम अप्लायन्सेस',
    discount: '२५%',
    schemeWeekly: '१००',
    themeColor: '#7c3aed',
    badge: '🏹 दसरा महाऑफर',
  },
  {
    id: 'weekly-scheme',
    festivalName: '३०-महिने साप्ताहिक बचत कार्ड योजना',
    category: 'दर आठवड्याला फक्त ₹१०० किंवा ₹२०० चा हप्ता',
    discount: 'लकी ड्रॉ',
    schemeWeekly: '१००',
    themeColor: '#059669',
    badge: '🎁 दरमहा लकी ड्रॉ बक्षीस',
  },
  {
    id: 'summer-cooler',
    festivalName: 'उन्हाळा कुलर व फ्रीज महामेळा',
    category: 'हेवी ड्युटी कुलर, डीप फ्रिझर व सिंगल/डबल डोअर फ्रीज',
    discount: '३०%',
    schemeWeekly: '१००',
    themeColor: '#0284c7',
    badge: '❄️ समर कुलिंग ऑफर',
  },
];

export const FestivalPromoGeneratorView: React.FC<FestivalPromoGeneratorViewProps> = ({
  storeData,
}) => {
  const { isDayMode } = useTheme();

  const [selectedPreset, setSelectedPreset] = useState<PromoPreset>(PRESETS[0]);
  const [festivalName, setFestivalName] = useState<string>(PRESETS[0].festivalName);
  const [category, setCategory] = useState<string>(PRESETS[0].category);
  const [discount, setDiscount] = useState<string>(PRESETS[0].discount);
  const [schemeWeekly, setSchemeWeekly] = useState<string>(PRESETS[0].schemeWeekly);
  const [customNote, setCustomNote] = useState<string>('०% फायनान्स उपलब्ध • मोफत होम डिलिव्हरी');

  // AI Generated / Current state
  const [headline, setHeadline] = useState<string>(
    '🚩 श्री साई इंटरप्रायजेस, वर्धा - भव्य गुढीपाडवा महाधमाका सेल!'
  );
  const [whatsappMessage, setWhatsappMessage] = useState<string>(
    `🚩 *श्री साई इंटरप्रायजेस, वर्धा* 🚩\n✨ *गुढीपाडवा विशेष सणवार महा ऑफर!* ✨\n\nघर सजवा दर्जेदार इलेक्ट्रॉनिक्स आणि १००% अस्सल चंद्रपूर सागवान लाकडी फर्निचरने थेट फॅक्टरी दरात!\n\n🎁 *मुख्य ऑफर्स:*\n🔹 स्मार्ट टीव्ही, कुलर व सागवान सोफ्यावर तब्बल *३०% पर्यंत भव्य सूट!*\n🔹 *३०-महिने साप्ताहिक योजना:* दर आठवड्याला फक्त *₹१०० चा हप्ता!*\n🔹 दर महिन्याच्या लकी ड्रॉ मध्ये जिंका आकर्षक बक्षिसे!\n🔹 ०% व्याज फायनान्स (Bajaj Finance / TVS Credit) उपलब्ध.\n🔹 वर्धा शहर व ग्रामीण भागात मोफत होम डिलिव्हरी.\n\n📍 *पत्ता:* श्री साई इंटरप्रायजेस, मातोश्री सभागृह समोर, आर्वी रोड, पंजाब कॉलनी, वर्धा - ४४२००१\n📞 *संपर्क:* 8600122978 / 9175537365 / 8766486915\n💬 *ऑर्डर / चौकशी:* https://wa.me/918600122978?text=मला_ऑफरबद्दल_माहिती_हवी_आहे`
  );
  const [tagline, setTagline] = useState<string>('दर्जेदार वस्तू • खात्रीशीर सेवा • सहज सुलभ हप्ते');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [aiSource, setAiSource] = useState<string>('preset');

  // Canvas / SVG ref for poster export
  const posterRef = useRef<HTMLDivElement>(null);

  // Apply a preset
  const handleSelectPreset = (p: PromoPreset) => {
    setSelectedPreset(p);
    setFestivalName(p.festivalName);
    setCategory(p.category);
    setDiscount(p.discount);
    setSchemeWeekly(p.schemeWeekly);

    const generatedHeadline = `🚩 श्री साई इंटरप्रायजेस, वर्धा - भव्य ${p.festivalName}!`;
    const generatedMsg = `🚩 *श्री साई इंटरप्रायजेस, वर्धा* 🚩\n✨ *${p.festivalName} विशेष सणवार महा ऑफर!* ✨\n\nघर सजवा दर्जेदार इलेक्ट्रॉनिक्स आणि अस्सल चंद्रपूर सागवान फर्निचरने थेट फॅक्टरी दरात!\n\n🎁 *मुख्य ऑफर्स:*\n🔹 ${p.category} वर तब्बल *${p.discount} पर्यंत भव्य सूट!*\n🔹 *३०-महिने साप्ताहिक योजना:* दर आठवड्याला फक्त *₹${p.schemeWeekly} चा हप्ता!*\n🔹 लकी ड्रॉ मध्ये जिंका स्मार्ट टीव्ही किंवा फ्रीज!\n🔹 ०% व्याज फायनान्स (Bajaj / TVS) उपलब्ध.\n🔹 वर्धा शहर व ग्रामीण भागात मोफत होम डिलिव्हरी.\n\n📍 *पत्ता:* श्री साई इंटरप्रायजेस, मातोश्री सभागृह समोर, आर्वी रोड, पंजाब कॉलनी, वर्धा - ४४२००१\n📞 *संपर्क:* 8600122978 / 9175537365 / 8766486915\n💬 *ऑर्डर / माहिती:* https://wa.me/918600122978?text=मला_${encodeURIComponent(p.festivalName)}_माहिती_हवी_आहे`;

    setHeadline(generatedHeadline);
    setWhatsappMessage(generatedMsg);
    setAiSource('preset');
  };

  // Generate with Gemini Free Tier API (/api/generate-promo) with resilient fallback
  const handleGenerateWithGemini = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate-promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          festivalName,
          category,
          discount,
          schemeWeekly,
          customMessage: customNote,
          shopPhone: storeData.settings.phone || '7822859073',
          shopAddress: storeData.settings.address || 'मातोश्री सभागृह समोर, आर्वी रोड, वर्धा',
        }),
      });

      if (!res.ok) {
        throw new Error(`Server status ${res.status}`);
      }

      const data = await res.json();
      if (data.headline) setHeadline(data.headline);
      if (data.whatsappMessage) setWhatsappMessage(data.whatsappMessage);
      if (data.bannerTagline) setTagline(data.bannerTagline);
      setAiSource(data.source || 'gemini-3.8-flash');
    } catch (err: any) {
      console.warn('AI promo generation notice, applying smart local fallback:', err?.message || err);
      // Instant graceful fallback
      const phone = storeData.settings.phone || '7822859073';
      const address = storeData.settings.address || 'मातोश्री सभागृह समोर, आर्वी रोड, वर्धा';
      const fallbackMsg = `🚩 *श्री साई इंटरप्रायजेस, वर्धा* 🚩\n✨ *${festivalName} विशेष सणवार महा ऑफर!* ✨\n\nघर सजवा दर्जेदार इलेक्ट्रॉनिक्स आणि १००% अस्सल चंद्रपूर सागवान लाकडी फर्निचरने थेट फॅक्टरी दरात!\n\n🎁 *मुख्य सणवार ऑफर्स:*\n🔹 *${category}* वर तब्बल *${discount} पर्यंत भव्य सूट!*\n🔹 *३०-महिने साप्ताहिक योजना:* दर आठवड्याला फक्त *₹${schemeWeekly} चा हप्ता!*\n🔹 प्रत्येक खरेदीवर हमखास भेटवस्तू व दरमहा लकी ड्रॉ मध्ये आकर्षक बक्षिसे!\n🔹 ०% व्याज फायनान्स (Bajaj Finance / TVS Credit) सह त्वरित मंजुरी.\n🔹 वर्धा शहर व ग्रामीण भागात मोफत सुरक्षित होम डिलिव्हरी.\n${customNote ? `🔹 *विशेष सूचना:* ${customNote}\n` : ''}\n📍 *पत्ता:* श्री साई इंटरप्रायजेस, ${address}\n📞 *संपर्क:* ${phone} / 8766486915\n💬 *थेट व्हॉट्सॲप ऑर्डर / चौकशी:* https://wa.me/91${phone}?text=${encodeURIComponent(`नमस्कार, मला ${festivalName} ऑफरबद्दल माहिती हवी आहे.`)}`;

      setHeadline(`🚩 श्री साई इंटरप्रायजेस, वर्धा - भव्य ${festivalName} विशेष महाधमाका सेल! 🎁`);
      setWhatsappMessage(fallbackMsg);
      setTagline(`${festivalName} निमित्त दर्जेदार वस्तू आणि सर्वात मोठा डिस्काउंट धमाका!`);
      setAiSource('smart-template-engine');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(whatsappMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDirectWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(url, '_blank');
  };

  // Download SVG poster
  const handleDownloadPosterSvg = () => {
    if (!posterRef.current) return;
    const svgEl = posterRef.current.querySelector('svg');
    if (!svgEl) return;

    const svgData = new XMLSerializer().serializeToString(svgEl);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    const downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = `Shri_Sai_${festivalName.replace(/\s+/g, '_')}_Poster.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className={`p-5 rounded-2xl border transition-colors ${
        isDayMode
          ? 'bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 border-amber-200'
          : 'bg-gradient-to-r from-[#291e14] via-[#211b15] to-[#181c2b] border-amber-500/20'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 mb-1.5 shadow-sm">
              <Gift className="w-3.5 h-3.5" /> सणवार व साप्ताहिक ऑफर्स ब्रॉडकास्ट
            </div>
            <h1 className="text-xl sm:text-2xl font-black font-playfair tracking-tight text-slate-900 dark:text-white">
              Festival & Weekly Scheme WhatsApp Broadcast & Poster Generator
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              गुढीपाडवा, अक्षय्य तृतीया, दिवाळी, किंवा साप्ताहिक लकी ड्रॉ योजना जाहिरात — १-क्लिक आकर्षक मेसेज व पोस्टर तयार करा.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 flex items-center gap-1">
              <Gift className="w-3.5 h-3.5 text-emerald-500" />
              <span>डिजिटल पोस्टर स्टुडिओ</span>
            </span>
          </div>
        </div>
      </div>

      {/* Preset Buttons Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => handleSelectPreset(p)}
            className={`px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95 ${
              selectedPreset.id === p.id
                ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
            }`}
          >
            <span>{p.badge}</span>
          </button>
        ))}
      </div>

      {/* 2-Column Grid: Form Controls (Left) | Live Poster & WhatsApp Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form & Customizer (5 cols) */}
        <div className={`lg:col-span-5 p-5 rounded-2xl border shadow-sm space-y-4 ${
          isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Palette className="w-4 h-4 text-amber-500" />
              <span>जाहिरात तपशील सानुकूल करा</span>
            </h3>
            {aiSource !== 'preset' && (
              <span className="text-[10px] font-extrabold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/50">
                विशेष जाहिरात मोहीम
              </span>
            )}
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                सण / महोत्सवाचे नाव:
              </label>
              <input
                type="text"
                value={festivalName}
                onChange={(e) => setFestivalName(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border font-bold outline-none ${
                  isDayMode ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>

            <div>
              <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                प्रॉडक्ट कॅटेगरी / ऑफर वस्तू:
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border outline-none ${
                  isDayMode ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  सूट / डिस्काउंट:
                </label>
                <input
                  type="text"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border font-bold text-rose-600 outline-none ${
                    isDayMode ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-slate-700'
                  }`}
                />
              </div>

              <div>
                <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  साप्ताहिक हप्ता (₹):
                </label>
                <input
                  type="text"
                  value={schemeWeekly}
                  onChange={(e) => setSchemeWeekly(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border font-bold text-emerald-600 outline-none ${
                    isDayMode ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-slate-700'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                विशेष टीप / इतर वैशिष्ट्ये:
              </label>
              <input
                type="text"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border outline-none ${
                  isDayMode ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>

            {/* Campaign Generator Button */}
            <button
              onClick={handleGenerateWithGemini}
              disabled={isGenerating}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-500 hover:to-orange-500 text-white font-black text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              <Gift className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>
                {isGenerating
                  ? 'जाहिरात व बॅनर तयार होत आहे...'
                  : '✨ १-क्लिक सणवार जाहिरात व बॅनर तयार करा'}
              </span>
            </button>
          </div>

          {/* Quick Stats on Scheme / Showroom */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300">
            <div className="flex justify-between font-bold">
              <span>दुकान फोन:</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400">8600122978 / 9175537365 / 8766486915</span>
            </div>
            <div className="flex justify-between">
              <span>योजना कालावधी:</span>
              <span className="font-bold">३० महिने (१२० आठवडे)</span>
            </div>
            <div className="flex justify-between">
              <span>स्थान:</span>
              <span>मातोश्री सभागृह समोर, आर्वी रोड, पंजाब कॉलनी, वर्धा</span>
            </div>
          </div>
        </div>

        {/* Right Column: Live Poster & WhatsApp Text (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Visual Digital Poster Card */}
          <div
            ref={posterRef}
            className="p-1 rounded-3xl bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-600 shadow-xl overflow-hidden"
          >
            <svg
              viewBox="0 0 700 420"
              className="w-full h-auto rounded-2xl block"
              style={{ backgroundColor: '#0f172a' }}
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1e1b4b" />
                  <stop offset="40%" stopColor="#0f172a" />
                  <stop offset="100%" stopColor="#31102e" />
                </linearGradient>
                <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="50%" stopColor="#fef08a" />
                  <stop offset="100%" stopColor="#d97706" />
                </linearGradient>
                <linearGradient id="badgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#dc2626" />
                  <stop offset="100%" stopColor="#991b1b" />
                </linearGradient>
              </defs>

              {/* Background */}
              <rect width="700" height="420" fill="url(#bgGrad)" />

              {/* Decorative Border */}
              <rect
                x="14"
                y="14"
                width="672"
                height="392"
                rx="16"
                fill="none"
                stroke="url(#goldGrad)"
                strokeWidth="2"
                strokeDasharray="8, 4"
              />

              {/* Top Banner Tag */}
              <rect x="230" y="24" width="240" height="30" rx="15" fill="url(#badgeGrad)" />
              <text
                x="350"
                y="44"
                textAnchor="middle"
                fill="#ffffff"
                fontSize="13"
                fontWeight="900"
                fontFamily="sans-serif"
              >
                {selectedPreset.badge}
              </text>

              {/* Brand Title */}
              <text
                x="350"
                y="90"
                textAnchor="middle"
                fill="url(#goldGrad)"
                fontSize="26"
                fontWeight="900"
                fontFamily="serif"
              >
                🚩 श्री साई इंटरप्रायजेस, वर्धा 🚩
              </text>

              <text
                x="350"
                y="114"
                textAnchor="middle"
                fill="#e2e8f0"
                fontSize="12"
                fontWeight="700"
                fontFamily="sans-serif"
              >
                इलेक्ट्रॉनिक्स व अस्सल चंद्रपूर सागवान लाकडी फर्निचर भव्य दालन
              </text>

              {/* Festival Headline Box */}
              <rect x="50" y="130" width="600" height="50" rx="12" fill="#ffffff" fillOpacity="0.08" stroke="#f59e0b" strokeWidth="1" />
              <text
                x="350"
                y="162"
                textAnchor="middle"
                fill="#fef08a"
                fontSize="19"
                fontWeight="900"
                fontFamily="sans-serif"
              >
                {festivalName}
              </text>

              {/* Offer Pillars (Left: Products | Right: Scheme) */}
              <g transform="translate(60, 200)">
                <rect width="270" height="120" rx="14" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
                <text x="20" y="30" fill="#f59e0b" fontSize="13" fontWeight="900">
                  📺 इलेक्ट्रॉनिक्स व फर्निचर
                </text>
                <text x="20" y="55" fill="#ffffff" fontSize="12" fontWeight="700">
                  {category.slice(0, 32)}
                </text>
                <text x="20" y="80" fill="#38bdf8" fontSize="11" fontWeight="600">
                  • ०% फायनान्स (Bajaj/TVS) उपलब्ध
                </text>
                <rect x="20" y="90" width="130" height="22" rx="11" fill="#dc2626" />
                <text x="85" y="105" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="900">
                  सूट: {discount} पर्यंत
                </text>
              </g>

              <g transform="translate(370, 200)">
                <rect width="270" height="120" rx="14" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
                <text x="20" y="30" fill="#10b981" fontSize="13" fontWeight="900">
                  🪙 ३०-महिने साप्ताहिक बचत योजना
                </text>
                <text x="20" y="55" fill="#ffffff" fontSize="14" fontWeight="900">
                  हप्ता: फक्त ₹{schemeWeekly} / आठवडा
                </text>
                <text x="20" y="80" fill="#fbbf24" fontSize="11" fontWeight="700">
                  • दरमहा लकी ड्रॉ मध्ये जिंका टीव्ही/फ्रीज
                </text>
                <rect x="20" y="90" width="150" height="22" rx="11" fill="#059669" />
                <text x="95" y="105" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="900">
                  १००% खात्रीशीर रिटर्न
                </text>
              </g>

              {/* Bottom Footer Details */}
              <rect x="30" y="338" width="640" height="52" rx="10" fill="#0284c7" fillOpacity="0.25" stroke="#0284c7" strokeWidth="1" />
              <text x="50" y="360" fill="#ffffff" fontSize="11" fontWeight="700" fontFamily="sans-serif">
                📍 पत्ता: मातोश्री सभागृह समोर, आर्वी रोड, पंजाब कॉलनी, वर्धा | 🚚 मोफत होम डिलिव्हरी
              </text>
              <text x="50" y="378" fill="#fef08a" fontSize="11" fontWeight="900" fontFamily="sans-serif">
                📞 संपर्क: 8600122978 / 9175537365 / 8766486915 (श्री साई इंटरप्रायजेस)
              </text>
            </svg>
          </div>

          {/* Download and Share Poster Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={handleDownloadPosterSvg}
              className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>🖼️ जाहिरात पोस्टर डाउनलोड करा (SVG/Graphic)</span>
            </button>

            <button
              onClick={handleDirectWhatsApp}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md transition cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp वर थेट शेअर करा</span>
            </button>
          </div>

          {/* Ready-to-Send WhatsApp Text Box */}
          <div className={`p-4 rounded-2xl border shadow-sm space-y-2.5 ${
            isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-emerald-500" />
                <span>तयार मराठी व्हॉट्सॲप ब्रॉडकास्ट मेसेज:</span>
              </span>

              <button
                onClick={handleCopyMessage}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs cursor-pointer flex items-center gap-1 transition"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-600">कॉपी झाले!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>मेसेज कॉपी करा</span>
                  </>
                )}
              </button>
            </div>

            <textarea
              rows={8}
              value={whatsappMessage}
              onChange={(e) => setWhatsappMessage(e.target.value)}
              className={`w-full p-3 rounded-xl border text-xs leading-relaxed font-mono outline-none ${
                isDayMode ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-950 border-slate-800 text-slate-200'
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
