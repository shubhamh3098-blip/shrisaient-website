import React, { useState, useMemo } from 'react';
import {
  X,
  Sparkles,
  Gift,
  Share2,
  Calendar,
  Heart,
  PartyPopper,
  MessageCircle,
  Copy,
  Check,
  Tag,
  Search,
  Users,
  Store,
  Clock,
  Printer
} from 'lucide-react';
import { BusinessSettings, Customer, CardMember } from '../types';

interface FestivalPreset {
  id: string;
  name: string;
  marathiName: string;
  tagline: string;
  icon: string;
  themeColor: string;
  defaultDiscount: string;
  defaultFreeGift: string;
  couponCode: string;
}

const FESTIVALS: FestivalPreset[] = [
  {
    id: 'diwali',
    name: 'Diwali',
    marathiName: '🪔 दिवाळी महाबचत धमाका',
    tagline: 'घरोघरी समृद्धी! टीव्ही, फ्रीज, वॉशिंग मशीन व फर्निचरवर भव्य सवलत',
    icon: '🪔',
    themeColor: 'from-amber-600 via-yellow-600 to-rose-600',
    defaultDiscount: '१०% ते २०% थेट सूट',
    defaultFreeGift: 'प्रत्येक मोठ्या खरेदीवर आकर्षक सोन्याचे नाणे किंवा भेटवस्तू मोफत',
    couponCode: 'SAI-DIWALI'
  },
  {
    id: 'gudi-padwa',
    name: 'Gudi Padwa',
    marathiName: '🚩 गुढीपाडवा नववर्ष महासेल',
    tagline: 'हिंदू नववर्षाच्या मंगल प्रसंगी नवीन वस्तूंची शुभ खरेदी',
    icon: '🚩',
    themeColor: 'from-orange-600 to-amber-600',
    defaultDiscount: 'फ्लॅट ₹१,५०० ते ₹५,००० सवलत',
    defaultFreeGift: 'सागवान फर्निचरवर फ्री होम डिलिव्हरी व इन्स्टॉलेशन',
    couponCode: 'SAI-PADWA'
  },
  {
    id: 'dussehra',
    name: 'Dussehra',
    marathiName: '🏹 विजयादशमी दसरा महोत्सव',
    tagline: 'सीमोल्लंघन करा आणि नवीन इलेक्ट्रॉनिक्स व फर्निचर घरी आणा',
    icon: '🏹',
    themeColor: 'from-amber-700 via-rose-700 to-purple-800',
    defaultDiscount: '०% डाऊन पेमेंट व सुलभ ईएमआय हप्ते',
    defaultFreeGift: 'टीव्ही वॉल माउंट व कुलर ट्रॉली मोफत',
    couponCode: 'SAI-DASARA'
  },
  {
    id: 'dhanteras',
    name: 'Dhanteras',
    marathiName: '💰 धनत्रयोदशी सुवर्ण खरेदी',
    tagline: 'धनधान्य व समृद्धीची मंगल खरेदी, खात्रीशीर भेटवस्तूंसह',
    icon: '💰',
    themeColor: 'from-yellow-600 to-amber-700',
    defaultDiscount: 'खात्रीशीर कॅशबॅक व डिस्काउंट व्हाऊचर',
    defaultFreeGift: 'चांदीचे नाणे किंवा मिक्सर ग्राइंडर मोफत',
    couponCode: 'SAI-DHAN'
  },
  {
    id: 'ganeshotsav',
    name: 'Ganeshotsav',
    marathiName: '🐘 श्री गणेशोत्सव विशेष ऑफर',
    tagline: 'बाप्पाच्या आगमनाला नवीन टीव्ही, कुलर व सागवान देव्हारा खरेदीवर विशेष सवलत',
    icon: '🐘',
    themeColor: 'from-rose-600 to-amber-600',
    defaultDiscount: 'सागवान देव्हारा व फर्निचरवर विशेष १५% सूट',
    defaultFreeGift: '२ कम्फर्ट उशा किंवा बेडशीट सेट',
    couponCode: 'SAI-BAPPA'
  },
  {
    id: 'makar-sankranti',
    name: 'Makar Sankranti',
    marathiName: '🪁 मकर संक्रांत तिळगूळ ऑफर',
    tagline: 'तिळगूळ घ्या गोड गोड बोला, आणि साई एंटरप्रायझेसमधून नवीन वस्तू घेऊन जा!',
    icon: '🪁',
    themeColor: 'from-teal-600 to-emerald-700',
    defaultDiscount: 'विशेष कॉम्बो सवलत',
    defaultFreeGift: 'खात्रीशीर तिळगूळ गिफ्ट पॅक',
    couponCode: 'SAI-SANKRANTI'
  }
];

interface FestivalAndWishesModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: BusinessSettings;
  customers?: Customer[];
  cardMembers?: CardMember[];
}

export const FestivalAndWishesModal: React.FC<FestivalAndWishesModalProps> = ({
  isOpen,
  onClose,
  settings,
  customers = [],
  cardMembers = []
}) => {
  const [activeTab, setActiveTab] = useState<'festival' | 'birthdays'>('festival');
  const [selectedFestival, setSelectedFestival] = useState<FestivalPreset>(FESTIVALS[0]);
  const [customDiscount, setCustomDiscount] = useState<string>(FESTIVALS[0].defaultDiscount);
  const [customFreeGift, setCustomFreeGift] = useState<string>(FESTIVALS[0].defaultFreeGift);
  const [customCoupon, setCustomCoupon] = useState<string>(FESTIVALS[0].couponCode);
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [bdaySearchQuery, setBdaySearchQuery] = useState('');
  const [wishedCustomerIds, setWishedCustomerIds] = useState<Set<string>>(() => new Set());

  if (!isOpen) return null;

  const handleSelectFestival = (fest: FestivalPreset) => {
    setSelectedFestival(fest);
    setCustomDiscount(fest.defaultDiscount);
    setCustomFreeGift(fest.defaultFreeGift);
    setCustomCoupon(fest.couponCode);
  };

  const storeName = settings.businessName || 'श्री साई एंटरप्रायझेस, वर्धा';
  const storeAddress = settings.address || 'मातोश्री सभागृह समोर, आर्वी रोड, पंजाब कॉलनी, वर्धा - ४४२००१';
  const storePhone = settings.ownerPhone || settings.phone || '9766911693 / 8766486915';
  const groupLink = settings.whatsappGroupLink || 'https://chat.whatsapp.com/CLcaeUq1bHH1RE0203oPaP?s=cl&p=a&mlu=4&ilr=4';

  // Generated Festival Broadcast Message
  const festivalMessage = useMemo(() => {
    return (
      `${selectedFestival.marathiName} 🚩\n` +
      `*${storeName}* 🛍️\n` +
      `(इलेक्ट्रॉनिक्स शोभिवंत दालन व सागवान फर्निचर)\n` +
      `--------------------------------\n` +
      `आपणास व आपल्या संपूर्ण परिवारास सणाच्या मनःपूर्वक हार्दिक शुभेच्छा! 💐\n\n` +
      `या सणानिमित्त आपल्यासाठी खास *महाधमाका ऑफर्स:*\n` +
      `🏷️ *सूट:* ${customDiscount}\n` +
      `🎁 *विशेष मोफत भेट:* ${customFreeGift}\n` +
      `🎟️ *कूपन कोड:* *${customCoupon}* (बिलिंगवेळी दाखवा)\n` +
      `💳 *०% डाऊन पेमेंट व सुलभ ईएमआय (Bajaj / TVS)* उपलब्ध!\n` +
      `--------------------------------\n` +
      `👉 *दरमहा सोडतीचे निकाल व नवीन ऑफर्ससाठी अधिकृत WhatsApp ग्रुप जॉईन करा:* \n${groupLink}\n\n` +
      `📍 *पत्ता:* ${storeAddress}\n` +
      `📞 *संपर्क:* ${storePhone}\n` +
      `_आजच भेट द्या व सणाचा आनंद द्विगुणीत करा!_ 🙏`
    );
  }, [selectedFestival, customDiscount, customFreeGift, customCoupon, storeName, storeAddress, storePhone, groupLink]);

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(festivalMessage);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2000);
  };

  const handleShareFestivalWhatsApp = () => {
    const encoded = encodeURIComponent(festivalMessage);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  // Combine and deduplicate customer list for birthdays
  const allPeople = useMemo(() => {
    const map = new Map<string, { id: string; name: string; phone: string; village?: string; type: string }>();
    customers.forEach((c) => {
      if (c.phone) {
        map.set(c.phone, {
          id: c.id,
          name: c.name,
          phone: c.phone,
          village: c.village,
          type: 'ग्राहक'
        });
      }
    });
    cardMembers.forEach((m) => {
      if (m.phone && !map.has(m.phone)) {
        map.set(m.phone, {
          id: m.id,
          name: m.customerName,
          phone: m.phone,
          village: m.village,
          type: `कार्ड #${m.cardNumber}`
        });
      }
    });
    return Array.from(map.values());
  }, [customers, cardMembers]);

  const filteredPeople = useMemo(() => {
    return allPeople.filter((p) => {
      const q = bdaySearchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        (p.village && p.village.toLowerCase().includes(q))
      );
    });
  }, [allPeople, bdaySearchQuery]);

  // Send Birthday / Anniversary Wish
  const handleSendWish = (person: { id: string; name: string; phone: string; village?: string }) => {
    const cleanPh = person.phone.replace(/\D/g, '').slice(-10);
    const wishMsg =
      `🎂 *वाढदिवसाच्या हार्दिक शुभेच्छा!* 💐\n` +
      `आदरणीय *${person.name}* जी${person.village ? ` (${person.village})` : ''},\n\n` +
      `*${storeName}* परिवारातर्फे आपणास वाढदिवसाच्या मनःपूर्वक हार्दिक शुभेच्छा! 💐✨\n` +
      `आपणास दीर्घायुष्य, उत्तम आरोग्य व भरभराट लाभो हीच ईश्वरचरणी प्रार्थना.\n\n` +
      `🎁 *आपल्यासाठी साई विशेष वाढदिवस भेट:* \n` +
      `आपल्या पुढील खरेदीवर थेट *₹५००/- किंवा ५% अतिरिक्त सूट* मिळवण्यासाठी खालील कूपन वापरा:\n` +
      `🎟️ कूपन कोड: *SAI-BDAY500*\n\n` +
      `👉 *अधिकृत WhatsApp ग्रुप:* ${groupLink}\n\n` +
      `📍 *पत्ता:* ${storeAddress}\n` +
      `📞 *संपर्क:* ${storePhone}\n` +
      `_आपला दिवस आनंदाचा जावो!_ 🙏`;

    const encoded = encodeURIComponent(wishMsg);
    setWishedCustomerIds((prev) => new Set([...prev, person.id]));
    window.open(`https://wa.me/91${cleanPh}?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-white dark:bg-[#0C1425] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-slate-900 dark:text-white">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-600 via-orange-600 to-rose-700 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shadow-inner text-xl">
              🎉
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-xl font-black tracking-tight">
                  सण-उत्सव ऑफर व वाढदिवस शुभेच्छा हब
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-300 text-slate-950 font-bold text-[10px] tracking-wider uppercase">
                  Festival & Wishes
                </span>
              </div>
              <p className="text-xs text-amber-100 font-medium">
                दिवाळी, पाडवा सण ऑफर्स ब्रॉडकास्ट व ग्राहकांना १-क्लिक वाढदिवस शुभेच्छा व डिस्काउंट कूपन
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('festival')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'festival'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>१. सण-उत्सव महाऑफर ब्रॉडकास्ट</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('birthdays')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'birthdays'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            <Heart className="w-4 h-4 text-rose-300" />
            <span>२. ग्राहक वाढदिवस व शुभेच्छा ({allPeople.length} संपर्क)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {activeTab === 'festival' ? (
            <div className="space-y-5">
              {/* Festival Presets Selector */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  आगामी सण निवडा:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {FESTIVALS.map((fest) => {
                    const isSelected = selectedFestival.id === fest.id;
                    return (
                      <div
                        key={fest.id}
                        onClick={() => handleSelectFestival(fest)}
                        className={`p-3 rounded-2xl border-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 shadow-sm ring-2 ring-amber-500/20'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                        }`}
                      >
                        <div className="text-xl mb-1">{fest.icon}</div>
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                          {fest.marathiName}
                        </h4>
                        <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                          {fest.tagline}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Offer Customization */}
              <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  ऑफर व कूपन तपशील सानुकूल करा (Customize Offer):
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">विशेष सवलत (Discount)</label>
                    <input
                      type="text"
                      value={customDiscount}
                      onChange={(e) => setCustomDiscount(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">मोफत भेट (Free Gift)</label>
                    <input
                      type="text"
                      value={customFreeGift}
                      onChange={(e) => setCustomFreeGift(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">कूपन कोड (Coupon Code)</label>
                    <input
                      type="text"
                      value={customCoupon}
                      onChange={(e) => setCustomCoupon(e.target.value.toUpperCase())}
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Preview Message Card */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-emerald-500/30 p-4 sm:p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-emerald-600" />
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      तयार WhatsApp ब्रॉडकास्ट मेसेज प्रिव्ह्यू:
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyMessage}
                      className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 transition flex items-center gap-1 cursor-pointer"
                    >
                      {copiedSuccess ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSuccess ? 'कॉपी झाले!' : 'मेसेज कॉपी करा'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleShareFestivalWhatsApp}
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>WhatsApp वर ब्रॉडकास्ट करा</span>
                    </button>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-line border border-slate-200 dark:border-slate-700 max-h-56 overflow-y-auto">
                  {festivalMessage}
                </div>
              </div>
            </div>
          ) : (
            /* Birthday & Anniversary Tab */
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={bdaySearchQuery}
                    onChange={(e) => setBdaySearchQuery(e.target.value)}
                    placeholder="ग्राहकाचे नाव, मोबाईल किंवा गाव शोधा..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <span className="text-xs text-slate-500 font-semibold">
                  एकूण ग्राहक: {filteredPeople.length}
                </span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[55vh] overflow-y-auto">
                {filteredPeople.slice(0, 50).map((person) => {
                  const isWished = wishedCustomerIds.has(person.id);
                  return (
                    <div key={person.id} className="p-3.5 flex items-center justify-between gap-3 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400 font-black flex items-center justify-center text-xs shrink-0">
                          🎂
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <strong className="text-slate-900 dark:text-white font-bold">{person.name}</strong>
                            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded font-mono">
                              {person.type}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                            <span className="font-mono">{person.phone}</span>
                            {person.village && <span>• {person.village}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isWished && (
                          <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            <span>शुभेच्छा पाठवली</span>
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleSendWish(person)}
                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>१-क्लिक शुभेच्छा (WhatsApp)</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
