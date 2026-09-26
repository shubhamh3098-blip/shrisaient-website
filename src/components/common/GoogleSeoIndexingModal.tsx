import React, { useState } from 'react';
import {
  Search,
  Globe,
  MapPin,
  Phone,
  CheckCircle2,
  Copy,
  ExternalLink,
  Share2,
  Sparkles,
  FileCode2,
  Star,
  Clock,
  Navigation,
  X
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface GoogleSeoIndexingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleSeoIndexingModal: React.FC<GoogleSeoIndexingModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { isDayMode } = useTheme();
  const [copiedType, setCopiedType] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  const businessInfo = {
    name: 'Shri Sai Enterprises (श्री साई एंटरप्रायजेस)',
    tagline: 'Best Electronics & Furniture Showroom in Wardha',
    phones: ['8600122978', '9175537365', '8766486915'],
    address: 'Opposite Matoshree Sabhagruh, Arvi Road, Punjab Colony, Wardha - 442001 (Maharashtra)',
    marathiAddress: 'मातोश्री सभागृह समोर, आर्वी रोड, पंजाब कॉलनी, वर्धा - ४४२००१',
    timing: 'सकाळी ९:३० ते रात्री ९:३० (आठवड्याचे सर्व दिवस चालू)',
    googleMapsUrl: 'https://maps.google.com/?q=Shri+Sai+Enterprises+Matoshree+Sabhagruh+Arvi+Road+Wardha',
    websiteUrl: 'https://shrisaient.in',
  };

  const gmbListingText = `🏪 ${businessInfo.name} - Electronics & Furniture Showroom
📍 पत्ता: ${businessInfo.marathiAddress}
(${businessInfo.address})
📞 संपर्क / कॉल: ${businessInfo.phones.join(' / ')}
⏰ वेळ: ${businessInfo.timing}
🌟 उत्पादने: स्मार्ट TV, फ्रिज, वॉशिंग मशीन, सागवान सोफा, बेड, कपाटे
🎁 योजना: ३० महिन्यांची साप्ताहिक बचत योजना (Weekly Lucky Draw Scheme)
🌐 वेबसाइट: ${businessInfo.websiteUrl}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl shadow-2xl border overflow-hidden ${
          isDayMode
            ? 'bg-slate-50 border-slate-300 text-slate-800'
            : 'bg-[#0f172a] border-slate-700 text-slate-100'
        }`}
      >
        {/* HEADER */}
        <div
          className={`flex items-center justify-between px-5 py-4 border-b ${
            isDayMode
              ? 'bg-white border-slate-200'
              : 'bg-slate-900/90 border-slate-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold">
                  Google SEO, Indexing & Local Ranking Format
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3" /> १००% रेडी
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                इलेक्ट्रॉनिक्स, फर्निचर, पत्ता, मोबाईल नंबर व झटपट Google Indexing ची संपूर्ण माहिती
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTENT SCROLLABLE */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* SECTION 1: GOOGLE LIVE SEARCH SNIPPET PREVIEW */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-blue-500" />
                Google Search मध्ये तुमचे दुकान कसे दिसते (Live Google Preview)
              </h4>
              <span className="text-[11px] text-emerald-500 font-medium">Googlebot Verified</span>
            </div>

            {/* Simulated Google Search Result Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1a2333] border border-slate-200 dark:border-slate-700/80 shadow-md space-y-2">
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                <div className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center text-[10px] text-white font-bold">
                  S
                </div>
                <span className="font-mono text-[11px]">https://shrisaient.in</span>
                <span className="text-slate-400">› showroom › wardha</span>
              </div>

              <a
                href="#preview"
                className="block text-base sm:text-lg font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                Best Electronics & Furniture Showroom in Wardha | Shri Sai Enterprises
              </a>

              {/* Rating & In stock */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <div className="flex items-center text-amber-500 font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-500 inline mr-0.5" />
                  <span>4.9</span>
                </div>
                <span className="text-slate-400">★★★★★</span>
                <span className="text-slate-500 dark:text-slate-400">(528 पुनरावलोकने / Reviews)</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">• शोरूम मध्ये उपलब्ध</span>
                <span className="text-slate-500">• वर्धा (Wardha)</span>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                वर्ध्यातील अग्रगण्य इलेक्ट्रॉनिक्स व फर्निचर शोरूम. स्मार्ट LED TV, फ्रिज, वॉशिंग मशीन, सागवान सोफा, बेड व कपाट उत्तम दरात आणि ३० महिन्यांच्या सुलभ बचत योजनेसह. पत्ता: मातोश्री सभागृह समोर, आर्वी रोड, पंजाब कॉलनी, वर्धा. फोन: 8600122978, 9175537365.
              </p>

              {/* Sitelinks Mini Grid */}
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                  <div className="font-bold text-blue-600 dark:text-blue-400">📺 Electronics in Wardha</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Smart 4K LED TV, Double Door फ्रिज, Washing Machines</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                  <div className="font-bold text-blue-600 dark:text-blue-400">🛋️ Teakwood Furniture</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">चंद्रपूर सागवान सोफा संच, हायड्रॉलिक स्टोरेज बेड, लोखंडी कपाट</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                  <div className="font-bold text-blue-600 dark:text-blue-400">🎁 ३० महिन्यांची बचत योजना</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">दर आठवड्याला ₹१००/₹२०० बचत + मासिक भाग्यवान सोडत</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                  <div className="font-bold text-blue-600 dark:text-blue-400">📞 डायरेक्ट कॉल व पत्ता</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">8600122978 / 9175537365 • आर्वी रोड, पंजाब कॉलनी</div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: FAST INDEXING STATUS (झटपट इंडेक्सिंग घटक) */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Google जलद इंडेक्सिंग (Fast Indexing Checklist)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Feature 1 */}
              <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">robots.txt</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Googlebot व Bingbot साठी परवानगी आणि थेट sitemap.xml लिंक उपलब्ध आहे.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">sitemap.xml</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  सर्व मुख्य पेजेस (इलेक्ट्रॉनिक्स, फर्निचर, योजना, संपर्क) प्राधान्य 1.0 सह समाविष्ट.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Schema.org JSON-LD</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  LocalBusiness, FurnitureStore, ElectronicsStore व FAQPage स्ट्रक्चर्ड डेटा तयार.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Geo & Address</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  वर्धा अक्षांश-रेखांश (20.7453, 78.6022) व पिनकोड 442001 मेटा टॅग्ज सक्रिय.
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 3: OFFICIAL STORE DETAILS & ONE-CLICK COPIES */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                Google Business / Justdial / IndiaMART साठी अचूक तपशील
              </h4>
              <button
                type="button"
                onClick={() => copyToClipboard(gmbListingText, 'all_info')}
                className="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                {copiedType === 'all_info' ? 'सर्व कॉपी झाले!' : 'सर्व माहिती कॉपी करा'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Store Address Card */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" /> अधिकृत पत्ता (Official Address)
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(businessInfo.marathiAddress, 'address')}
                    className="text-[11px] text-blue-500 hover:underline flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    {copiedType === 'address' ? 'कॉपी झाले!' : 'पत्ता कॉपी'}
                  </button>
                </div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {businessInfo.marathiAddress}
                </p>
                <p className="text-xs text-slate-500 font-mono">
                  {businessInfo.address}
                </p>
                <div className="pt-1 flex items-center gap-2">
                  <a
                    href={businessInfo.googleMapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline"
                  >
                    <Navigation className="w-3 h-3" /> Google Maps वर उघडा
                  </a>
                </div>
              </div>

              {/* Phone Numbers Card */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-emerald-500" /> संपर्क क्रमांक (Contact Numbers)
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(businessInfo.phones.join(', '), 'phones')}
                    className="text-[11px] text-blue-500 hover:underline flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    {copiedType === 'phones' ? 'कॉपी झाले!' : 'नंबर कॉपी'}
                  </button>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">मुख्य संपर्क / चौकशी:</span>
                    <a href="tel:8600122978" className="font-mono font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
                      +91 86001 22978
                    </a>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">बिलिंग व हप्ता वसुली:</span>
                    <a href="tel:9175537365" className="font-mono font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
                      +91 91755 37365
                    </a>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">डिलिव्हरी व ग्राहक सेवा:</span>
                    <a href="tel:8766486915" className="font-mono font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
                      +91 87664 86915
                    </a>
                  </div>
                </div>

                <div className="pt-1 flex items-center gap-2 text-[11px] text-slate-500">
                  <Clock className="w-3 h-3" /> {businessInfo.timing}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: 3 QUICK STEPS FOR GOOGLE FIRST PAGE RANK */}
          <div className="p-4 sm:p-5 rounded-2xl bg-linear-to-r from-blue-900/10 via-indigo-900/10 to-purple-900/10 border border-blue-500/20 space-y-3">
            <h4 className="text-sm font-bold text-blue-700 dark:text-blue-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-500" />
              Google वर लवकरात लवकर रँक होण्यासाठी ३ सोप्या पायऱ्या (Steps):
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="font-bold text-slate-900 dark:text-white">१. Google Search Console</div>
                <p className="text-slate-600 dark:text-slate-400">
                  Search Console मध्ये जाऊन <span className="font-mono text-blue-500">sitemap.xml</span> सबमिट करा व "Request Indexing" वर क्लिक करा.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="font-bold text-slate-900 dark:text-white">२. Google My Business (GMB)</div>
                <p className="text-slate-600 dark:text-slate-400">
                  Google Maps वर "Shri Sai Enterprises" प्रोफाईल मध्ये हाच अचूक पत्ता (Opp. Matoshree Sabhagruh) आणि फोन नंबर जोडा.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="font-bold text-slate-900 dark:text-white">३. WhatsApp वर शेअर करा</div>
                <p className="text-slate-600 dark:text-slate-400">
                  ग्राहकांना WhatsApp वर ही लिंक पाठवल्यास OpenGraph कार्ड आपोआप फोटो, पत्ता व नंबरसह आकर्षक दिसते.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* FOOTER */}
        <div
          className={`flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t text-xs ${
            isDayMode
              ? 'bg-slate-100 border-slate-200'
              : 'bg-slate-900/90 border-slate-800'
          }`}
        >
          <div className="flex items-center gap-2 text-slate-500">
            <FileCode2 className="w-4 h-4 text-emerald-500" />
            <span>robots.txt, sitemap.xml, Schema.org JSON-LD आणि Geo-Tags सर्व सक्रिय आहेत.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => copyToClipboard(gmbListingText, 'footer_copy')}
              className="px-3 py-1.5 rounded-xl border border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold hover:bg-blue-500/20 transition cursor-pointer flex items-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              {copiedType === 'footer_copy' ? 'कॉपी झाले!' : 'माहिती कॉपी करा'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold hover:opacity-90 transition cursor-pointer"
            >
              समजले (Close)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
