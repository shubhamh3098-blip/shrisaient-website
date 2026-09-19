import React, { useState } from 'react';
import {
  Tv,
  Wind,
  Zap,
  Wrench,
  Truck,
  ShieldCheck,
  Star,
  CheckCircle2,
  Phone,
  MessageCircle,
  MapPin,
  Clock,
  FileText,
  Send,
  Sparkles,
  ExternalLink,
  ChevronRight,
  HelpCircle,
  Award,
  Users,
  Building2,
  X
} from 'lucide-react';

interface ServicesAndTrustSectionProps {
  onSelectServiceForQuote?: (serviceName: string) => void;
  shopSettings?: any;
}

interface ServiceItem {
  id: string;
  nameMr: string;
  nameEn: string;
  category: string;
  icon: React.ElementType;
  description: string;
  advantages: string[];
  pricingHint: string;
  sampleItems: string;
}

export const ServicesAndTrustSection: React.FC<ServicesAndTrustSectionProps> = ({
  shopSettings,
}) => {
  // 3-Step Simple Enquiry Form state
  const [enquiryName, setEnquiryName] = useState('');
  const [enquiryPhone, setEnquiryPhone] = useState('');
  const [enquiryService, setEnquiryService] = useState('कूलर किंवा इलेक्ट्रॉनिक्स खरेदी (New Purchase)');
  const [enquiryNotes, setEnquiryNotes] = useState('');
  const [enquirySubmitted, setEnquirySubmitted] = useState(false);

  // Legal / Info Modals
  const [activeModal, setActiveModal] = useState<'about' | 'contact' | 'privacy' | null>(null);

  const services: ServiceItem[] = [
    {
      id: 'appliances-sales',
      nameMr: 'घरगुती इलेक्ट्रॉनिक्स व कुलर विक्री',
      nameEn: 'Home Appliances & Air Coolers',
      category: 'Sales & Free Delivery',
      icon: Wind,
      description:
        'सर्व नामांकित कंपन्यांचे हेवी-ड्युटी कुलर, स्मार्ट एलईडी टीव्ही, सिंगल व डबल डोअर फ्रिज, वॉशिंग मशीन आणि सीलिंग फॅन उपलब्ध.',
      advantages: [
        'वर्धा शहर व परिसरात विनामूल्य होम डिलिव्हरी (Free Delivery)',
        'अधिकृत कंपनी वॉरंटी व पक्के जीएसटी बिल',
        'होलसेल व वाजवी रीटेल दर',
      ],
      pricingHint: 'थेट रिटेल व स्कीम डिस्काउंट उपलब्ध',
      sampleItems: 'कूलर, स्मार्ट TV, फ्रिज, फॅन, मिक्सर',
    },
    {
      id: 'savings-scheme',
      nameMr: '३०-महिने साप्ताहिक बचत कार्ड योजना',
      nameEn: '30-Month Weekly Savings Scheme',
      category: 'Weekly Lucky Draw Hub',
      icon: Sparkles,
      description:
        'प्रत्येक आठवड्याला छोटी बचत करा आणि ३० महिन्यांत आपल्या स्वप्नातील ब्रँडेड टीव्ही, फ्रिज किंवा कुलर निश्चित मिळवा.',
      advantages: [
        'अल्प नोंदणी शुल्क व सुलभ साप्ताहिक हप्ते',
        'डिजिटल ऑनलाइन पासबुक - हप्ता भरल्याची त्वरित पावती',
        'लकी ड्रॉ मध्ये बंपर गिफ्ट्स जिंकण्याची सुवर्णसंधी',
      ],
      pricingHint: 'योजना १, २ व ३ (Cards 1 ते 2000)',
      sampleItems: 'योजना १ (₹१५०), योजना २ (₹१००), योजना ३ (₹२००)',
    },
    {
      id: 'electrical-wiring',
      nameMr: 'इलेक्ट्रिकल वायरिंग व कॉन्ट्रॅक्टिंग',
      nameEn: 'Residential & Commercial Wiring',
      category: 'Installation & Fitting',
      icon: Zap,
      description:
        'नवीन घरे, दुकाने, हॉस्पिटल्स आणि गोदामांचे संपूर्ण कन्सिल्ड वायरिंग, एमसीबी पॅनेल, अर्थिंग आणि इन्व्हर्टर फिटिंग.',
      advantages: [
        'अनुभवी व कुशल वायरमन टीम',
        'Polycab, Anchor व Finolex चे ओरिजिनल मटेरियल',
        'अचूक वेळेत सुरक्षित काम पूर्ण करण्याची हमी',
      ],
      pricingHint: 'जागेवर मोफत साईट व्हिजिट व कोटेशन',
      sampleItems: 'कन्सिल्ड वायरिंग, MCB फिटिंग, अर्थिंग',
    },
    {
      id: 'appliance-repair',
      nameMr: 'कूलर व फॅन दुरुस्ती व देखभाल',
      nameEn: 'Cooler & Appliance Repair Service',
      category: 'Maintenance & Spares',
      icon: Wrench,
      description:
        'उन्हाळ्यात कुलर सर्व्हिसिंग, नवीन पॅड्स बसवणे, सबमर्सिबल वॉटर पंप, फॅन मोटर वाइंडिंग आणि इलेक्ट्रिकल उपकरण दुरुस्ती.',
      advantages: [
        'ओरिजिनल स्पेअर पार्टसची उपलब्धता',
        'जलद स्थानिक दुरुस्ती सेवा',
        'किफायतशीर व पारदर्शक दर',
      ],
      pricingHint: 'तपासणी शुल्क वाजवी • जागेवर दुरुस्ती',
      sampleItems: 'कूलर पंप, फॅन मोटर, वायरिंग रिपेअर',
    },
    {
      id: 'wholesale-contractor',
      nameMr: 'घाऊक पुरवठा (बिल्डर्स व कॉन्ट्रॅक्टर्स)',
      nameEn: 'Wholesale & Builder Supply',
      category: 'B2B & Bulk Deals',
      icon: Building2,
      description:
        'स्थानिक इलेक्ट्रिशियन, बिल्डर्स आणि कॉन्ट्रॅक्टर्ससाठी इलेक्ट्रिकल वायर्स, पाईप्स, स्विचेस आणि फिक्सचर्सचा थेट घाऊक पुरवठा.',
      advantages: [
        'थेट डिलरशिप होलसेल दरपत्रक',
        'जीएसटी इनव्हॉईस व सुलभ पेमेंट',
        'मोठ्या ऑर्डर्सवर थेट साईट डिलिव्हरी',
      ],
      pricingHint: 'बल्क डिस्काउंट उपलब्ध • GST इनपुट क्रेडिट',
      sampleItems: 'वायर बंडल, पीव्हीसी पाईप, स्विचगियर',
    },
  ];

  const testimonials = [
    {
      name: 'राजेश देशमुख',
      location: 'आर्वी रोड, वर्धा',
      rating: 5,
      date: 'फेब्रुवारी २०२५',
      product: 'हेवी ड्युटी कुलर खरेदी',
      review:
        'श्री साई इंटरप्राइजेसकडून घरासाठी मोठा कुलर घेतला. त्याच दिवशी दुपारी घरी मोफत डिलिव्हरी मिळाली आणि कुलरची हवा खूपच थंड आहे. भावही वर्ध्यातील इतर दुकानांपेक्षा वाजवी मिळाला!',
    },
    {
      name: 'संजय ठाकरे',
      location: 'सेवाग्राम, वर्धा',
      rating: 5,
      date: 'जानेवारी २०२५',
      product: '३०-महिने बचत योजना सभासद',
      review:
        '३०-महिन्यांच्या साप्ताहिक बचत योजनेचे कार्ड काढले आहे. ऑनलाईन मोबाईलवर पासबुक पाहण्याची सोय खूपच उत्कृष्ट आहे. हप्ता भरल्याची पावती लगेच दिसते. अतिशय विश्वासू संस्था.',
    },
    {
      name: 'अमित कोल्हे',
      location: 'पवार नगर, देवळी',
      rating: 5,
      date: 'मार्च २०२५',
      product: 'नवीन घराचे संपूर्ण इलेक्ट्रिकल वायरिंग',
      review:
        'नवीन बंगल्याचे संपूर्ण वायरिंग साहित्य श्री साई इंटरप्राइजेसकडून घेतले. सर्व वायर्स व स्विचेस Polycab चे पक्के ओरिजिनल मिळाले. दुकानदार खूप प्रामाणिक आणि सहकार्य करणारे आहेत.',
    },
    {
      name: 'प्रमोद वाघमारे',
      location: 'हिंगणघाट रोड, वर्धा',
      rating: 5,
      date: 'डिसेंबर २०२४',
      product: '४३ इंच स्मार्ट एलईडी टीव्ही',
      review:
        'दुकानदारांनी टीव्हीची सर्व माहिती अगदी स्पष्ट समजावून सांगितली आणि थेट कंपनी वॉरंटी दिली. बिल आणि वॉरंटीची कायदेशीर नोंद व्यवस्थित आहे. ५ पैकी ५ स्टार सेवा!',
    },
  ];

  const galleryItems = [
    {
      title: 'हेवी ड्युटी कुलर थेट गोडाऊन स्टॉक',
      category: 'उत्पादने व कुलर',
      subtitle: 'उन्हाळ्यासाठी ताज्या स्टॉकची उपलब्धता',
      imageUrl:
        'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=600&auto=format&fit=crop&q=80',
    },
    {
      title: 'स्मार्ट टीव्ही व फ्रिज घरपोच डिलिव्हरी',
      category: 'फ्री होम डिलिव्हरी',
      subtitle: 'वर्धा व आर्वी तालुक्यातील ग्राहकांसाठी जलद सेवा',
      imageUrl:
        'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600&auto=format&fit=crop&q=80',
    },
    {
      title: 'दर्जेदार इलेक्ट्रिकल वायरिंग प्रकल्प',
      category: 'इलेक्ट्रिकल कामे',
      subtitle: 'सुरक्षित कन्सिल्ड वायरिंग व एमसीबी इन्स्टॉलेशन',
      imageUrl:
        'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=80',
    },
    {
      title: '३०-महिने बचत योजना लकी ड्रॉ व बक्षीस वितरण',
      category: 'बचत योजना',
      subtitle: 'आनंदी सभासदांना घरगुती उपकरणांचे वितरण',
      imageUrl:
        'https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=600&auto=format&fit=crop&q=80',
    },
  ];

  const handleSelectServiceForQuote = (serviceName: string) => {
    setEnquiryService(serviceName);
    const enquiryEl = document.getElementById('enquiry-section');
    if (enquiryEl) {
      enquiryEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSendEnquiryWhatsApp = (targetPhone = '8766486915') => {
    if (!enquiryName.trim() || !enquiryPhone.trim()) {
      alert('कृपया आपले नाव आणि मोबाईल नंबर टाका.');
      return;
    }

    const message =
      `*नवीन कोटेशन / दरपत्रक चौकशी (ShriSaiEnt.in)*\n` +
      `--------------------------------\n` +
      `👤 *ग्राहक नाव:* ${enquiryName.trim()}\n` +
      `📞 *मोबाईल नंबर:* ${enquiryPhone.trim()}\n` +
      `⚡ *सेवेची गरज / विषय:* ${enquiryService}\n` +
      (enquiryNotes.trim() ? `📝 *तपशील / नोंद:* ${enquiryNotes.trim()}\n` : '') +
      `--------------------------------\n` +
      `कृपया तात्काळ दरपत्रक व माहिती पाठवा. धन्यवाद!`;

    window.open(
      `https://wa.me/91${targetPhone}?text=${encodeURIComponent(message)}`,
      '_blank'
    );
    setEnquirySubmitted(true);
  };

  return (
    <div className="space-y-16">
      {/* 1. SERVICES & PRICING / QUOTATION SECTION */}
      <section id="services" className="max-w-7xl mx-auto px-4 sm:px-6 pt-10">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-700 dark:text-teal-300 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            आमच्या अधिकृत सेवा व दरपत्रक (Verified Services in Wardha)
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-[var(--tactile-text-heading)] tracking-tight">
            Best Enterprise Services in Wardha, Maharashtra
          </h2>
          <p className="text-sm sm:text-base text-[var(--tactile-text-muted)] leading-relaxed">
            श्री साई इंटरप्राइजेस - घरगुती इलेक्ट्रॉनिक्स विक्री, ३०-महिने साप्ताहिक बचत योजना, वायरिंग व रिपेअरिंगची विश्वासू सेवा.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((srv) => {
            const Icon = srv.icon;
            return (
              <div
                key={srv.id}
                className="tactile-card rounded-3xl border border-[var(--tactile-border)] p-6 shadow-xs hover:border-[var(--tactile-primary)] transition-all duration-300 flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  {/* Header with Icon & Category */}
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-2xl tactile-inset text-[var(--tactile-primary)] flex items-center justify-center group-hover:bg-[var(--tactile-primary)] group-hover:text-white transition-colors duration-300 shadow-xs">
                      <Icon className="w-6 h-6 stroke-[2]" />
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg tactile-inset text-[var(--tactile-text-muted)]">
                      {srv.category}
                    </span>
                  </div>

                  {/* Service Title */}
                  <div>
                    <h3 className="text-lg font-black text-[var(--tactile-text-heading)] group-hover:text-[var(--tactile-primary)] transition-colors">
                      {srv.nameMr}
                    </h3>
                    <span className="text-xs font-medium text-[var(--tactile-text-dim)] block mt-0.5">
                      {srv.nameEn}
                    </span>
                  </div>

                  <p className="text-xs text-[var(--tactile-text-muted)] leading-relaxed">
                    {srv.description}
                  </p>

                  {/* Advantages bullet points */}
                  <div className="tactile-inset rounded-2xl p-3.5 space-y-2 border border-[var(--tactile-border-subtle)]">
                    <span className="text-[10px] font-black uppercase text-[var(--tactile-text-dim)] tracking-wider block">
                      मुख्य वैशिष्ट्ये व फायदे (Key Advantages):
                    </span>
                    {srv.advantages.map((adv, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-[var(--tactile-text-main)]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="leading-snug">{adv}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Action & Quote Button */}
                <div className="pt-5 mt-5 border-t border-[var(--tactile-border-subtle)] space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] text-[var(--tactile-text-muted)] font-medium">दर स्वरूप:</span>
                    <span className="font-bold text-[var(--tactile-text-heading)] text-[11px] text-right">
                      {srv.pricingHint}
                    </span>
                  </div>

                  <button
                    onClick={() => handleSelectServiceForQuote(srv.nameMr)}
                    className="w-full py-2.5 rounded-xl tactile-btn-primary text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <span>Request a Quote / दरपत्रक मिळवा</span>
                    <ChevronRight className="w-3.5 h-3.5 text-amber-300 group-hover:text-white" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 2. 3-STEP SIMPLE ENQUIRY FORM (फॉर्म लहान: १. नाव, २. मोबाईल, ३. सेवेची गरज) */}
      <section id="enquiry-section" className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-950 text-white rounded-3xl p-6 sm:p-10 shadow-2xl border border-white/15 relative overflow-hidden">
          {/* Subtle decorative glow */}
          <div className="absolute -right-20 -top-20 w-60 h-60 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-2xl mx-auto text-center space-y-2 mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold">
              <Clock className="w-3.5 h-3.5" />
              १० मिनिटांत तात्काळ कोटेशन व माहिती मिळेल
            </div>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
              ३-सोप्या स्टेप्समध्ये दरपत्रक मिळवा (3-Step Quick Enquiry)
            </h3>
            <p className="text-xs sm:text-sm text-slate-300">
              आपल्याला हव्या असलेल्या उत्पादनाची किंवा सेवेची माहिती भरा. आमची टीम थेट संपर्क करेल.
            </p>
          </div>

          {enquirySubmitted ? (
            <div className="bg-emerald-900/60 border border-emerald-500/40 rounded-2xl p-6 text-center space-y-3 animate-fade-in">
              <div className="w-12 h-12 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6 stroke-[3]" />
              </div>
              <h4 className="text-lg font-bold text-white">चौकशी यशस्वीरित्या पाठवली!</h4>
              <p className="text-xs text-slate-200">
                आपली विनंती प्राप्त झाली आहे. आम्ही दिलेल्या मोबाईल नंबरवर त्वरित संपर्क साधू.
              </p>
              <button
                onClick={() => setEnquirySubmitted(false)}
                className="text-xs text-amber-300 font-bold underline hover:text-white mt-2 inline-block cursor-pointer"
              >
                दुसरी चौकशी पाठवा
              </button>
            </div>
          ) : (
            <div className="space-y-4 max-w-xl mx-auto">
              {/* Step 1: Name */}
              <div>
                <label className="text-xs font-bold text-slate-200 flex items-center justify-between mb-1">
                  <span>१. आपले पूर्ण नाव (Your Full Name) *</span>
                  <span className="text-[10px] text-amber-300">पायरी १/३</span>
                </label>
                <input
                  type="text"
                  placeholder="उदा. राहुल देशमुख / Rahul Deshmukh"
                  value={enquiryName}
                  onChange={(e) => setEnquiryName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm"
                />
              </div>

              {/* Step 2: Mobile Number */}
              <div>
                <label className="text-xs font-bold text-slate-200 flex items-center justify-between mb-1">
                  <span>२. मोबाईल / WhatsApp नंबर (10-Digit Mobile) *</span>
                  <span className="text-[10px] text-amber-300">पायरी २/३</span>
                </label>
                <input
                  type="tel"
                  placeholder="उदा. 9876543210"
                  value={enquiryPhone}
                  onChange={(e) => setEnquiryPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm font-mono"
                />
              </div>

              {/* Step 3: Service Requirement */}
              <div>
                <label className="text-xs font-bold text-slate-200 flex items-center justify-between mb-1">
                  <span>३. सेवेची गरज / चौकशीचा विषय (Service Needed) *</span>
                  <span className="text-[10px] text-amber-300">पायरी ३/३</span>
                </label>
                <select
                  value={enquiryService}
                  onChange={(e) => setEnquiryService(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#0B1528] border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm cursor-pointer"
                >
                  <option value="कूलर किंवा इलेक्ट्रॉनिक्स खरेदी (New Appliance Purchase)">
                    कूलर किंवा इलेक्ट्रॉनिक्स खरेदी (New Appliance Purchase)
                  </option>
                  <option value="३०-महिने साप्ताहिक बचत कार्ड योजना (30-Month Card Scheme)">
                    ३०-महिने साप्ताहिक बचत कार्ड योजना (30-Month Card Scheme)
                  </option>
                  <option value="घरगुती किंवा दुकान इलेक्ट्रिकल वायरिंग (Electrical Wiring)">
                    घरगुती किंवा दुकान इलेक्ट्रिकल वायरिंग (Electrical Wiring)
                  </option>
                  <option value="कूलर किंवा पंखा दुरुस्ती व सर्व्हिसिंग (Appliance Repair)">
                    कूलर किंवा पंखा दुरुस्ती व सर्व्हिसिंग (Appliance Repair)
                  </option>
                  <option value="होलसेल साहित्य पुरवठा (Wholesale Builder Inquiry)">
                    होलसेल साहित्य पुरवठा (Wholesale Builder Inquiry)
                  </option>
                  <option value="इतर चौकशी (Other Details)">इतर चौकशी (Other Details)</option>
                </select>
              </div>

              {/* Optional brief notes */}
              <div>
                <label className="text-xs text-slate-300 block mb-1">
                  काही विशेष माहिती (पर्यायी - Additional Notes):
                </label>
                <input
                  type="text"
                  placeholder="उदा. २ कुलर हवे आहेत, पत्ता आर्वी रोड..."
                  value={enquiryNotes}
                  onChange={(e) => setEnquiryNotes(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-400 text-xs"
                />
              </div>

              {/* Action Buttons: WhatsApp 1 & WhatsApp 2 */}
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => handleSendEnquiryWhatsApp('8766486915')}
                  className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  दरपत्रक मागा (WA: 8766486915)
                </button>
                <button
                  onClick={() => handleSendEnquiryWhatsApp('8600122798')}
                  className="w-full py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  दरपत्रक मागा (WA: 8600122798)
                </button>
              </div>

              <p className="text-[11px] text-slate-400 text-center pt-1">
                🔒 आपली माहिती पूर्णपणे सुरक्षित राहील. आम्ही कोणताही स्पॅम मेसेज पाठवत नाही.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* 3. SOCIAL PROOF & TRUST FACTORS (समाधानी ग्राहकांचे अभिप्राय व ५-स्टार रिव्ह्यूज) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-xs font-bold border border-amber-200 dark:border-amber-800/60">
            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            ग्राहकांचा विश्वास (100% Verified Customer Reviews)
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            वर्धा जिल्ह्यातील समाधानी ग्राहकांचे अभिप्राय
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            श्री साई इंटरप्राइजेसने गेल्या अनेक वर्षांत शेकडो कुटुंबांचा विश्वास संपादन केला आहे.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-amber-400 dark:hover:border-amber-500 transition"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex text-amber-400">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-[10px] text-slate-400">{t.date}</span>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic">
                  "{t.review}"
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs">{t.name}</h4>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5 text-blue-500" />
                      {t.location}
                    </span>
                  </div>
                  <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold">
                    सत्यापित ग्राहक
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. PROJECT GALLERY / WORK SHOWCASE (पूर्ण झालेल्या कामांचे व डिलिव्हरीचे फोटो) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-8">
          <span className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
            Work Showcase & Delivery Gallery
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            कामांचे फोटो व डिलिव्हरीचे क्षण
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            आमच्या दर्जेदार उत्पादने, कुलर स्टॉक व वर्धा परिसरातील यशस्वी डिलिव्हरीची काही क्षणचित्रे.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {galleryItems.map((item, idx) => (
            <div
              key={idx}
              className="group bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col"
            >
              <div className="relative h-48 overflow-hidden bg-slate-100 dark:bg-[#0F172A]">
                <img
                  src={item.imageUrl}
                  alt={`Shri Sai Enterprises Wardha - ${item.title}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-[#0B1528]/80 backdrop-blur-xs text-amber-300 text-[10px] font-bold">
                  {item.category}
                </span>
              </div>
              <div className="p-4 space-y-1">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm leading-snug group-hover:text-blue-500 transition">
                  {item.title}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  {item.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. GOOGLE BUSINESS PROFILE (GOOGLE MAP) & LOCATION GUIDE */}
      <section id="location" className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-white dark:bg-[#1E293B] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-10 shadow-xs space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold mb-2">
                <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                Google Business Profile • Wardha Location
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                Shri Sai Enterprises (Google Map वर थेट शोधा)
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                मातोश्री सभागृह समोर, आर्वी रोड, पंजाब कॉलनी, वर्धा - 442001
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <a
                href="https://maps.google.com/?q=Matoshree+Sabhagruha+Arvi+Road+Wardha+442001"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-bold text-xs transition flex items-center gap-2 shadow-sm"
              >
                <MapPin className="w-4 h-4" />
                Google Maps वर दिशा पहा (Directions)
              </a>
              <a
                href="tel:8766486915"
                className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-amber-400 hover:bg-slate-800 dark:hover:bg-amber-300 text-amber-300 dark:text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shadow-sm"
              >
                <Phone className="w-3.5 h-3.5" />
                8766486915 वर कॉल करा
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            <div className="space-y-2 p-4 rounded-2xl bg-slate-50 dark:bg-[#0F172A] border border-slate-100 dark:border-slate-800">
              <span className="font-bold text-slate-900 dark:text-white block">दुकान उघडे असण्याची वेळ:</span>
              <p className="text-slate-600 dark:text-slate-300">सोमवार ते रविवार: सकाळी ९:०० ते रात्री ९:००</p>
              <span className="inline-block px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold text-[10px]">
                आठवड्याचे ७ दिवस सुरू
              </span>
            </div>

            <div className="space-y-2 p-4 rounded-2xl bg-slate-50 dark:bg-[#0F172A] border border-slate-100 dark:border-slate-800">
              <span className="font-bold text-slate-900 dark:text-white block">जवळचा महत्त्वाचा लँडमार्क:</span>
              <p className="text-slate-600 dark:text-slate-300">मातोश्री सभागृहाच्या अगदी समोर, आर्वी रोड, पंजाब कॉलनी, वर्धा.</p>
              <span className="text-[10px] text-slate-400">पिनकोड: 442001</span>
            </div>

            <div className="space-y-2 p-4 rounded-2xl bg-slate-50 dark:bg-[#0F172A] border border-slate-100 dark:border-slate-800">
              <span className="font-bold text-slate-900 dark:text-white block">अधिकृत व्यवसाय नोंदणी:</span>
              <p className="text-slate-600 dark:text-slate-300 font-mono">GSTIN: 27ALOPL0030G2ZC</p>
              <p className="text-slate-600 dark:text-slate-300 font-mono">Udyam: UDYAM-MH-33-0012948</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. TRUST LINKS & LEGAL PAGES BAR (About Us, Contact Us, Privacy Policy & Warranty) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-slate-100 dark:bg-[#1E293B] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => setActiveModal('about')}
              className="font-semibold text-slate-800 dark:text-slate-200 hover:text-blue-500 transition cursor-pointer"
            >
              आमच्याबद्दल (About Us)
            </button>
            <span>•</span>
            <button
              onClick={() => setActiveModal('contact')}
              className="font-semibold text-slate-800 dark:text-slate-200 hover:text-blue-500 transition cursor-pointer"
            >
              संपर्क व पत्ता (Contact Us)
            </button>
            <span>•</span>
            <button
              onClick={() => setActiveModal('privacy')}
              className="font-semibold text-slate-800 dark:text-slate-200 hover:text-blue-500 transition cursor-pointer"
            >
              गोपनीयता धोरण व वॉरंटी नियम (Privacy Policy & Warranty)
            </button>
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Shri Sai Enterprises © 2026 • shrisaient.in
          </div>
        </div>
      </section>

      {/* LEGAL / INFO MODALS */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E293B] text-slate-900 dark:text-slate-100 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4 animate-fade-in max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-black text-slate-900 dark:text-white text-base">
                {activeModal === 'about' && 'आमच्याबद्दल (About Shri Sai Enterprises)'}
                {activeModal === 'contact' && 'संपर्क व पत्ता (Contact Us)'}
                {activeModal === 'privacy' && 'गोपनीयता धोरण आणि वॉरंटी अटी'}
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {activeModal === 'about' && (
              <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <p>
                  <strong>श्री साई इंटरप्राइजेस (Shri Sai Enterprises)</strong> ही वर्धा शहरातील अग्रगण्य इलेक्ट्रॉनिक्स व घरगुती उपकरणे विक्री, इलेक्ट्रिकल वायरिंग आणि ३०-महिने साप्ताहिक बचत कार्ड योजना चालवणारी अधिकृत व नोंदणीकृत संस्था आहे.
                </p>
                <p>
                  आमचे मुख्य ध्येय म्हणजे वर्धा व लगतच्या ग्रामीण भागातील प्रत्येक कुटुंबाला वाजवी दरात उच्च दर्जाचे ब्रँडेड इलेक्ट्रॉनिक्स साहित्य पुरवणे.
                </p>
                <div className="bg-slate-50 dark:bg-[#0F172A] p-3 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1 font-mono">
                  <p>नोंदणीकृत नाव: Shri Sai Enterprises</p>
                  <p>GSTIN: 27ALOPL0030G2ZC</p>
                  <p>उद्योग आधार: UDYAM-MH-33-0012948</p>
                  <p>पत्ता: मातोश्री सभागृह समोर, आर्वी रोड, पंजाब कॉलनी, वर्धा - 442001</p>
                </div>
              </div>
            )}

            {activeModal === 'contact' && (
              <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <p>आपण आम्हाला खालील पत्त्यावर किंवा फोनवर थेट संपर्क साधू शकता:</p>
                <div className="space-y-2 font-mono text-slate-800 dark:text-slate-200">
                  <p>📞 WhatsApp व कॉल 1: <strong>8766486915</strong></p>
                  <p>📞 WhatsApp व कॉल 2: <strong>8600122798</strong></p>
                  <p>📞 इतर फोन: 9175534365, 7822859073</p>
                  <p>📍 पत्ता: मातोश्री सभागृह समोर, आर्वी रोड, पंजाब कॉलनी, वर्धा - 442001</p>
                  <p>⏰ वेळ: सकाळी ९:०० ते रात्री ९:०० (सर्व दिवस)</p>
                </div>
                <a
                  href="https://maps.google.com/?q=Matoshree+Sabhagruha+Arvi+Road+Wardha+442001"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 mt-2"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  Google Maps वर पत्ता उघडा
                </a>
              </div>
            )}

            {activeModal === 'privacy' && (
              <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <p className="font-bold text-slate-900 dark:text-white">१. गोपनीयता धोरण (Privacy Policy):</p>
                <p>
                  ग्राहकाने दिलेले नाव, पत्ता आणि मोबाईल क्रमांक केवळ ऑर्डर डिलिव्हरी, वॉरंटी नोंद आणि बचत योजनेच्या पासबुक नोंदीसाठीच वापरले जातात. ग्राहकांची वैयक्तिक माहिती कोणत्याही तृतीय पक्षाला विकली जात नाही.
                </p>
                <p className="font-bold text-slate-900 dark:text-white pt-2">२. वॉरंटी व विक्री अटी (Official Disclaimer):</p>
                <p className="bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200 dark:border-amber-800/60 text-amber-950 dark:text-amber-200">
                  दिलेली वॉरंटी ही दुकानदाराची नसून कंपनीची आहे. म्हणून वस्तूत काही बिघाड आल्यास त्याला दुकानदार जबाबदार नसून कंपनी आहे. तेव्हा कृपया वस्तू घेतेवेळेस कंपनीच्या सर्व्हिस सेण्टरचा मोबाईल नंबर घ्यावा.
                </p>
                <p>
                  इलेक्ट्रॉनिक्स उत्पादनांच्या बिघाडाबाबत संबंधित कंपनीच्या अधिकृत सर्व्हिस सेंटरद्वारे दुरुस्ती किंवा बदल करून दिला जातो.
                </p>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-amber-400 text-white dark:text-slate-950 font-bold text-xs cursor-pointer"
              >
                बंद करा (Close)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
