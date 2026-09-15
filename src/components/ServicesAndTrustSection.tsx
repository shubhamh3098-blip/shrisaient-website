import React, { useState } from 'react';
import {
  Tv,
  Sofa,
  Sparkles,
  Truck,
  ShieldCheck,
  Star,
  CheckCircle2,
  Phone,
  MessageCircle,
  MapPin,
  Clock,
  ChevronRight,
  Award,
  Building2,
  X
} from 'lucide-react';

interface ServicesAndTrustSectionProps {
  onSelectServiceForQuote?: (serviceName: string) => void;
  shopSettings?: any;
}

interface ServiceItem {
  id: string;
  name: string;
  category: string;
  icon: React.ElementType;
  description: string;
  advantages: string[];
  pricingHint: string;
}

export const ServicesAndTrustSection: React.FC<ServicesAndTrustSectionProps> = ({
  shopSettings,
}) => {
  // 3-Step Simple Enquiry Form state
  const [enquiryName, setEnquiryName] = useState('');
  const [enquiryPhone, setEnquiryPhone] = useState('');
  const [enquiryService, setEnquiryService] = useState('Contemporary Furniture (Sofa / Bed / Dining)');
  const [enquiryNotes, setEnquiryNotes] = useState('');
  const [enquirySubmitted, setEnquirySubmitted] = useState(false);

  // Legal / Info Modals
  const [activeModal, setActiveModal] = useState<'about' | 'contact' | 'privacy' | null>(null);

  const services: ServiceItem[] = [
    {
      id: 'furniture-collection',
      name: 'Contemporary Furniture Studio',
      category: 'Solid Teak & Sheesham',
      icon: Sofa,
      description:
        'Designer living room sofas, ergonomic king-size hydraulic beds, 6-seater dining sets, and multi-door wardrobes crafted for durability and timeless elegance.',
      advantages: [
        'Seasoned teak and Sheesham wood with termite protection',
        'High-density resilient foam with stain-resistant fabrics',
        'Complimentary room delivery & professional assembly',
      ],
      pricingHint: 'Direct showroom pricing & custom sizing',
    },
    {
      id: 'appliances-sales',
      name: 'Smart Electronics & Home Appliances',
      category: 'Authorised Retailer',
      icon: Tv,
      description:
        '4K Ultra HD Smart Google TVs, 5-Star inverter frost-free refrigerators, heavy-duty honeycomb air coolers, and front/top load washing machines.',
      advantages: [
        '100% genuine brand warranty with tax invoice',
        'Free home delivery across Wardha and Arvi region',
        'Zero-cost replacement assistance during warranty',
      ],
      pricingHint: 'Special retail & festive bundle discounts',
    },
    {
      id: 'savings-scheme',
      name: '30-Month Weekly Passbook Scheme',
      category: 'Guaranteed Delivery & Draws',
      icon: Sparkles,
      description:
        'Save small convenient amounts weekly over 30 months. Track your real-time digital passbook online, participate in weekly lucky draws, and take home guaranteed major appliances.',
      advantages: [
        'Low initial registration fee with weekly deposit flexibility',
        'Instant digital receipts and 24/7 online passbook tracker',
        'Guaranteed appliance handover upon term completion',
      ],
      pricingHint: 'Schemes starting from ₹100 / week',
    },
    {
      id: 'custom-interior',
      name: 'White-Glove Delivery & Corporate Supply',
      category: 'Care & Assembly',
      icon: Truck,
      description:
        'End-to-end delivery logistics, unboxing, on-site assembly, and turnkey electronic/furniture supply for residential homes, offices, and builder projects.',
      advantages: [
        'Safe doorstep transport with blanket-padded handling',
        'Trained technicians for TV mounting & furniture setup',
        'GST input credit for corporate & contractor bulk purchases',
      ],
      pricingHint: 'Free on qualifying purchases',
    },
  ];

  const testimonials = [
    {
      name: 'Rajesh Deshmukh',
      location: 'Arvi Road, Wardha',
      rating: 5,
      date: 'February 2026',
      product: 'Teak Wood 5-Seater Sofa Set',
      review:
        'Purchased a 5-seater teak wood sofa set for our living room. Exceptional finish, premium fabric, and delivered right to our living room on the same day. Highly recommended!',
    },
    {
      name: 'Sanjay Thackeray',
      location: 'Sevagram, Wardha',
      rating: 5,
      date: 'January 2026',
      product: '30-Month Scheme Member (#1024)',
      review:
        'Enrolled in the 30-month weekly scheme. The online digital passbook feature is smooth and transparent. Whenever I pay my weekly installment, the balance updates right away.',
    },
    {
      name: 'Amit Kolhe',
      location: 'Pawar Nagar, Deoli',
      rating: 5,
      date: 'March 2026',
      product: 'King Bed with Hydraulic Storage',
      review:
        'The king bed with hydraulic storage is rock solid and spacious. The carpenters assembled everything neatly within an hour. Genuine products and warm customer service.',
    },
    {
      name: 'Pramod Waghmare',
      location: 'Hinganghat Road, Wardha',
      rating: 5,
      date: 'December 2025',
      product: '43" 4K Smart TV & Refrigerator',
      review:
        'Got a 43-inch 4K Google TV and double-door inverter refrigerator. Direct showroom warranty, original GST bill, and unbeatable price compared to big city stores.',
    },
  ];

  const galleryItems = [
    {
      title: 'Handcrafted Teak Living Room Sofas',
      category: 'Living Room Furniture',
      subtitle: 'Premium velvet & high-resilience foam sets',
      imageUrl:
        'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop&q=80',
    },
    {
      title: 'Hydraulic Storage Teak Beds',
      category: 'Bedroom Furniture',
      subtitle: 'Termite-treated solid wood with soft headboard',
      imageUrl:
        'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&auto=format&fit=crop&q=80',
    },
    {
      title: '4K Smart Google TVs & Soundbars',
      category: 'Home Entertainment',
      subtitle: 'Dolby audio, ultra-thin bezels & official warranty',
      imageUrl:
        'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&auto=format&fit=crop&q=80',
    },
    {
      title: 'Heavy-Duty Coolers & Refrigerators',
      category: 'Cooling & Appliances',
      subtitle: 'Inverter double door fridges & 70L desert coolers',
      imageUrl:
        'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=800&auto=format&fit=crop&q=80',
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
      alert('Please enter your full name and 10-digit mobile number.');
      return;
    }

    const message =
      `*Showroom Quotation & Product Inquiry (ShriSaiEnt.in)*\n` +
      `--------------------------------\n` +
      `👤 *Customer Name:* ${enquiryName.trim()}\n` +
      `📞 *Mobile Number:* ${enquiryPhone.trim()}\n` +
      `🛋️ *Product / Requirement:* ${enquiryService}\n` +
      (enquiryNotes.trim() ? `📝 *Notes:* ${enquiryNotes.trim()}\n` : '') +
      `--------------------------------\n` +
      `Please provide product pricing, brochure, and delivery availability. Thank you!`;

    window.open(
      `https://wa.me/91${targetPhone}?text=${encodeURIComponent(message)}`,
      '_blank'
    );
    setEnquirySubmitted(true);
  };

  return (
    <div className="space-y-20 py-8">
      {/* 1. SERVICES & PRICING / QUOTATION SECTION */}
      <section id="services" className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-[#00523f] text-xs font-semibold tracking-wide">
            <ShieldCheck className="w-4 h-4 text-[#00523f]" />
            <span>Curated Showroom Services • Wardha</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-semibold text-slate-900 tracking-tight">
            Craftsmanship, Electronics & Savings
          </h2>
          <p className="text-sm text-slate-500 leading-relaxed max-w-xl mx-auto">
            From hand-built teak furniture to certified 4K smart entertainment and disciplined installment schemes, discover our core capabilities.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((srv) => {
            const Icon = srv.icon;
            return (
              <div
                key={srv.id}
                className="bg-white rounded-3xl border border-slate-150 p-6 shadow-[0_12px_36px_-6px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_45px_-8px_rgba(0,0,0,0.08)] hover:border-slate-300 transition-all duration-300 flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  {/* Header with Icon & Category */}
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 text-[#00523f] flex items-center justify-center group-hover:bg-[#00523f] group-hover:text-white transition-colors duration-300 border border-slate-100">
                      <Icon className="w-6 h-6 stroke-[1.8]" />
                    </div>
                    <span className="text-[11px] font-medium px-3 py-1 rounded-full bg-slate-100 text-slate-600">
                      {srv.category}
                    </span>
                  </div>

                  {/* Service Title */}
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 group-hover:text-[#00523f] transition-colors leading-snug">
                      {srv.name}
                    </h3>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    {srv.description}
                  </p>

                  {/* Advantages bullet points */}
                  <div className="bg-slate-50/80 rounded-2xl p-3.5 space-y-2 border border-slate-100">
                    <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider block">
                      Key Highlights
                    </span>
                    {srv.advantages.map((adv, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#00523f] shrink-0 mt-0.5" />
                        <span className="leading-snug text-[11px]">{adv}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Action & Quote Button */}
                <div className="pt-4 mt-5 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-400 font-medium">Pricing:</span>
                    <span className="font-semibold text-slate-800 text-[11px] text-right">
                      {srv.pricingHint}
                    </span>
                  </div>

                  <button
                    onClick={() => handleSelectServiceForQuote(srv.name)}
                    className="w-full py-2.5 rounded-full bg-slate-900 hover:bg-[#00523f] text-white text-xs font-medium transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <span>Request Quotation</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 2. 3-STEP SIMPLE ENQUIRY FORM */}
      <section id="enquiry-section" className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-gradient-to-b from-slate-950 via-[#033b2e] to-slate-950 text-white rounded-[2.5rem] p-8 sm:p-12 shadow-[0_24px_60px_-15px_rgba(0,82,63,0.3)] border border-emerald-900/40 relative overflow-hidden">
          {/* Subtle warm amber ambient aura */}
          <div className="absolute -right-16 -top-16 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-2xl mx-auto text-center space-y-2 mb-8 relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-medium backdrop-blur-xs border border-white/10">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              Quick 10-Minute Response
            </div>
            <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
              Instant Quotation & Inquiry
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto">
              Share what you are looking for. Our Wardha showroom team will send complete photos, catalog specs, and pricing directly to your WhatsApp.
            </p>
          </div>

          {enquirySubmitted ? (
            <div className="bg-emerald-950/60 border border-emerald-500/30 rounded-3xl p-8 text-center space-y-3 animate-fade-in relative z-10">
              <div className="w-12 h-12 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
              </div>
              <h4 className="text-lg font-semibold text-white">Inquiry Sent Successfully</h4>
              <p className="text-xs text-slate-300 max-w-md mx-auto">
                We have received your details. A showroom consultant will reach out with photographs, dimensions, and current discount offers.
              </p>
              <button
                onClick={() => setEnquirySubmitted(false)}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium underline mt-2 inline-block cursor-pointer"
              >
                Send Another Inquiry
              </button>
            </div>
          ) : (
            <div className="space-y-4 max-w-xl mx-auto relative z-10">
              {/* Step 1: Name */}
              <div>
                <label className="text-xs font-medium text-slate-300 flex items-center justify-between mb-1.5">
                  <span>1. Full Name *</span>
                  <span className="text-[10px] text-emerald-300">Step 1 of 3</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Deshmukh"
                  value={enquiryName}
                  onChange={(e) => setEnquiryName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-white/10 border border-white/15 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm"
                />
              </div>

              {/* Step 2: Mobile Number */}
              <div>
                <label className="text-xs font-medium text-slate-300 flex items-center justify-between mb-1.5">
                  <span>2. Mobile / WhatsApp Number *</span>
                  <span className="text-[10px] text-emerald-300">Step 2 of 3</span>
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={enquiryPhone}
                  onChange={(e) => setEnquiryPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-white/10 border border-white/15 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm font-mono"
                />
              </div>

              {/* Step 3: Service Requirement */}
              <div>
                <label className="text-xs font-medium text-slate-300 flex items-center justify-between mb-1.5">
                  <span>3. Category / Requirement *</span>
                  <span className="text-[10px] text-emerald-300">Step 3 of 3</span>
                </label>
                <select
                  value={enquiryService}
                  onChange={(e) => setEnquiryService(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-white/15 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm cursor-pointer"
                >
                  <option value="Contemporary Furniture (Sofa / Bed / Dining)">
                    Contemporary Furniture (Sofa, Bed, Dining, Wardrobe)
                  </option>
                  <option value="Smart Electronics & Appliances (TV / Fridge / Cooler / Washing Machine)">
                    Smart Electronics (4K TV, Inverter Fridge, Air Cooler, Washer)
                  </option>
                  <option value="30-Month Weekly Installment Card Scheme">
                    30-Month Weekly Savings Card Scheme
                  </option>
                  <option value="Custom Interior & Furniture Fabrication">
                    Custom Interior & Modular Furniture Fabrication
                  </option>
                  <option value="Wholesale & Commercial Project Supply">
                    Wholesale Builder & Corporate Supply
                  </option>
                  <option value="General Inquiries">General Inquiries</option>
                </select>
              </div>

              {/* Optional brief notes */}
              <div>
                <label className="text-xs text-slate-300 block mb-1.5">
                  Additional Details (Optional):
                </label>
                <input
                  type="text"
                  placeholder="e.g. Need 5-seater sofa dimensions or Scheme 1 enrollment details..."
                  value={enquiryNotes}
                  onChange={(e) => setEnquiryNotes(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-white/10 border border-white/15 text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-400 text-xs"
                />
              </div>

              {/* Action Buttons: WhatsApp 1 & WhatsApp 2 */}
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => handleSendEnquiryWhatsApp('8766486915')}
                  className="w-full py-3.5 rounded-full bg-[#00523f] hover:bg-[#004232] text-white font-medium text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(0,82,63,0.35)] cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  Inquire on WhatsApp 1
                </button>
                <button
                  onClick={() => handleSendEnquiryWhatsApp('8600122798')}
                  className="w-full py-3.5 rounded-full bg-white/15 hover:bg-white/20 text-white font-medium text-xs sm:text-sm transition flex items-center justify-center gap-2 border border-white/20 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  Inquire on WhatsApp 2
                </button>
              </div>

              <p className="text-[11px] text-slate-400 text-center pt-1">
                🔒 Your contact info is strictly confidential and used solely to send quotation details.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* 3. SOCIAL PROOF & REVIEWS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-medium border border-amber-200/80">
            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            Verified Customer Reviews
          </div>
          <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
            Trusted by Families Across Wardha
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Hundreds of households rely on Shri Sai for genuine appliances, enduring teak furniture, and hassle-free savings.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl border border-slate-150 p-6 shadow-[0_10px_30px_-6px_rgba(0,0,0,0.03)] flex flex-col justify-between space-y-4 hover:border-slate-300 transition"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex text-amber-400 gap-0.5">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-[11px] text-slate-400">{t.date}</span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed italic">
                  "{t.review}"
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-slate-900 text-xs">{t.name}</h4>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {t.location}
                    </span>
                  </div>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#00523f] font-semibold border border-emerald-100">
                    Verified
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. GALLERY & WORK SHOWCASE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-10">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Showroom Showcase & Delivery Gallery
          </span>
          <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
            Curated Collections in Focus
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            A glimpse into our showroom stock, handcrafted timber creations, and doorstep delivery service.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {galleryItems.map((item, idx) => (
            <div
              key={idx}
              className="group bg-white rounded-3xl border border-slate-150 overflow-hidden shadow-[0_10px_30px_-6px_rgba(0,0,0,0.04)] hover:shadow-lg transition flex flex-col"
            >
              <div className="relative h-52 overflow-hidden bg-slate-100">
                <img
                  src={item.imageUrl}
                  alt={`Shri Sai Showroom - ${item.title}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-xs text-white text-[10px] font-medium">
                  {item.category}
                </span>
              </div>
              <div className="p-5 space-y-1">
                <h4 className="font-semibold text-slate-900 text-xs sm:text-sm leading-snug group-hover:text-[#00523f] transition">
                  {item.title}
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {item.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. SHOWROOM LOCATION & GOOGLE MAPS */}
      <section id="location" className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-3xl border border-slate-150 p-6 sm:p-10 shadow-[0_12px_40px_-10px_rgba(0,0,0,0.05)] space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium mb-2">
                <MapPin className="w-3.5 h-3.5 text-slate-600" />
                Physical Showroom • Wardha
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold text-slate-900">
                Shri Sai Electronics & Furniture
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Opposite Matoshree Sabhagruha, Arvi Road, Punjab Colony, Wardha - 442001
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <a
                href="https://maps.google.com/?q=Matoshree+Sabhagruha+Arvi+Road+Wardha+442001"
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition flex items-center gap-2 shadow-xs"
              >
                <MapPin className="w-3.5 h-3.5" />
                Open Google Maps
              </a>
              <a
                href="tel:8766486915"
                className="px-5 py-2.5 rounded-full bg-[#00523f] hover:bg-[#004232] text-white font-medium text-xs transition flex items-center gap-1.5 shadow-[0_4px_14px_rgba(0,82,63,0.25)]"
              >
                <Phone className="w-3.5 h-3.5" />
                Call 8766486915
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            <div className="space-y-2 p-5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="font-semibold text-slate-900 block">Showroom Hours:</span>
              <p className="text-slate-600">Monday to Sunday: 9:00 AM – 9:00 PM</p>
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-[10px]">
                Open 7 Days a Week
              </span>
            </div>

            <div className="space-y-2 p-5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="font-semibold text-slate-900 block">Prominent Landmark:</span>
              <p className="text-slate-600">Directly opposite Matoshree Sabhagruha, Arvi Road, Punjab Colony, Wardha.</p>
              <span className="text-[11px] text-slate-400">PIN Code: 442001</span>
            </div>

            <div className="space-y-2 p-5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="font-semibold text-slate-900 block">Official Business Registrations:</span>
              <p className="text-slate-600 font-mono">GSTIN: 27ALOPL0030G2ZC</p>
              <p className="text-slate-600 font-mono">Udyam: UDYAM-MH-33-0012948</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. LEGAL PAGES BAR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-slate-100/80 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 border border-slate-200/80">
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => setActiveModal('about')}
              className="font-medium text-slate-700 hover:text-slate-900 transition cursor-pointer"
            >
              About Us
            </button>
            <span>•</span>
            <button
              onClick={() => setActiveModal('contact')}
              className="font-medium text-slate-700 hover:text-slate-900 transition cursor-pointer"
            >
              Contact & Address
            </button>
            <span>•</span>
            <button
              onClick={() => setActiveModal('privacy')}
              className="font-medium text-slate-700 hover:text-slate-900 transition cursor-pointer"
            >
              Privacy Policy & Warranty Terms
            </button>
          </div>

          <div className="text-[11px] text-slate-400">
            Shri Sai Enterprises © 2026 • shrisaient.in
          </div>
        </div>
      </section>

      {/* LEGAL / INFO MODALS */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-150 space-y-4 animate-fade-in max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-semibold text-slate-900 text-base">
                {activeModal === 'about' && 'About Shri Sai Enterprises'}
                {activeModal === 'contact' && 'Contact & Showroom Location'}
                {activeModal === 'privacy' && 'Privacy Policy & Official Warranty'}
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {activeModal === 'about' && (
              <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
                <p>
                  <strong>Shri Sai Enterprises</strong> is Wardha's established destination for contemporary living & bedroom furniture, branded home electronics, air coolers, and community-driven 30-month savings schemes.
                </p>
                <p>
                  Our showroom is committed to making high-quality, long-lasting furniture and energy-efficient appliances accessible to every family across Wardha district and surrounding towns with complete pricing transparency.
                </p>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1 font-mono text-[11px]">
                  <p>Registered Entity: Shri Sai Enterprises</p>
                  <p>GSTIN: 27ALOPL0030G2ZC</p>
                  <p>Udyam Registration: UDYAM-MH-33-0012948</p>
                  <p>Address: Opp. Matoshree Sabhagruha, Arvi Road, Punjab Colony, Wardha - 442001</p>
                </div>
              </div>
            )}

            {activeModal === 'contact' && (
              <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
                <p>Reach out directly to our showroom team:</p>
                <div className="space-y-2 font-mono text-slate-800 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p>📞 Phone & WhatsApp 1: <strong>8766486915</strong></p>
                  <p>📞 Phone & WhatsApp 2: <strong>8600122798</strong></p>
                  <p>📞 Alternative Desk: 9175534365, 7822859073</p>
                  <p>📍 Address: Opp. Matoshree Sabhagruha, Arvi Road, Punjab Colony, Wardha - 442001</p>
                  <p>⏰ Working Hours: 9:00 AM – 9:00 PM (All 7 Days)</p>
                </div>
                <a
                  href="https://maps.google.com/?q=Matoshree+Sabhagruha+Arvi+Road+Wardha+442001"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition flex items-center justify-center gap-1.5 mt-2"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  Open in Google Maps
                </a>
              </div>
            )}

            {activeModal === 'privacy' && (
              <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
                <p className="font-semibold text-slate-900">1. Customer Privacy Policy:</p>
                <p>
                  Customer contact information and order details are strictly utilized for delivery coordination, warranty documentation, and 30-month savings scheme passbook verification. We never share customer data with third parties.
                </p>
                <p className="font-semibold text-slate-900 pt-2">2. Warranty Terms & Official Coverage:</p>
                <p className="bg-amber-50/80 p-3.5 rounded-2xl border border-amber-200/80 text-amber-950">
                  All electronic appliances carry the official manufacturer warranty provided directly by the company brand. Furniture crafted by Shri Sai carries a 5-year structural warranty against seasoning and termite defects.
                </p>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="px-5 py-2 rounded-full bg-slate-900 text-white font-medium text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
