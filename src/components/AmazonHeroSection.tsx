import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Truck,
  ShieldCheck,
  CreditCard,
  Tv,
  ArrowRight,
  Sparkles,
  Phone,
  MessageCircle,
  Clock,
  CheckCircle2,
  Bookmark
} from 'lucide-react';
import { REAL_PRODUCT_IMAGES } from '../utils/productImages';

interface AmazonHeroSectionProps {
  onSelectCategory: (cat: string) => void;
  onScrollToProducts: () => void;
  onScrollToPassbook: () => void;
  onScrollToSchemes: () => void;
  shopPhone?: string;
}

export const AmazonHeroSection: React.FC<AmazonHeroSectionProps> = ({
  onSelectCategory,
  onScrollToProducts,
  onScrollToPassbook,
  onScrollToSchemes,
  shopPhone = '8766486915',
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: 'Wardha Mega Electronics & Appliance Sale',
      subtitle: 'Up to 45% Off on 4K Smart TVs, 5-Star Refrigerators & Heavy-Duty Coolers',
      tag: 'DEAL OF THE MONTH',
      bgGradient: 'from-[#0B1528] via-[#1a2d52] to-[#0f1d38]',
      accentColor: '#febd69',
      category: 'Home Appliances',
      image: REAL_PRODUCT_IMAGES.smartTv43,
      ctaText: 'Shop Electronics Deals',
      badge: 'Free Delivery to Wardha',
    },
    {
      title: '30-Month Weekly Savings Scheme (योजना 1, 2, 3)',
      subtitle: 'Book your dream Fridge, Smart TV or Sofa with just ₹50 • Digital Passbook Tracking',
      tag: 'POPULAR SAVINGS PLAN',
      bgGradient: 'from-[#08332a] via-[#0d5c4d] to-[#06241e]',
      accentColor: '#4ade80',
      category: 'Schemes',
      image: REAL_PRODUCT_IMAGES.refrigeratorDoubleDoor,
      ctaText: 'View 30-Month Schemes',
      badge: 'Guaranteed Delivery',
    },
    {
      title: 'Luxury Solid Teak & Sheesham Furniture',
      subtitle: 'Handcrafted 3+1+1 Sofa Sets, Hydraulic Storage King Beds & 4-Door Wardrobes',
      tag: 'NEW SHOWROOM ARRIVALS',
      bgGradient: 'from-[#381c0d] via-[#5c3319] to-[#261309]',
      accentColor: '#fbbf24',
      category: 'Furniture',
      image: REAL_PRODUCT_IMAGES.sofaTeak,
      ctaText: 'Explore Furniture Deals',
      badge: '5-Year Showroom Warranty',
    },
    {
      title: 'Summer Heavy Duty Desert Air Coolers',
      subtitle: '70L Tank, 3-Side Honeycomb Pads, 100% Copper Motor & Inverter Compatible',
      tag: 'SUMMER ESSENTIALS',
      bgGradient: 'from-[#0e3b43] via-[#155e75] to-[#082f38]',
      accentColor: '#38bdf8',
      category: 'Home Appliances',
      image: REAL_PRODUCT_IMAGES.airCooler,
      ctaText: 'Check Cooler Stock',
      badge: 'High Air Delivery',
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  return (
    <div className="relative bg-[#eaeded] dark:bg-[#0b1120] transition-colors select-none">
      {/* 1. AMAZON MAIN HERO CAROUSEL BANNER */}
      <div className="relative w-full h-[320px] sm:h-[400px] md:h-[460px] lg:h-[500px] overflow-hidden">
        {slides.map((slide, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            <div className={`w-full h-full bg-gradient-to-r ${slide.bgGradient} relative flex items-center`}>
              {/* Background ambient lighting */}
              <div className="absolute inset-0 bg-black/20" />

              {/* Slide Content Container */}
              <div className="max-w-7xl mx-auto px-4 sm:px-8 w-full flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                {/* Text description */}
                <div className="max-w-2xl text-left space-y-2 sm:space-y-4 pt-4 sm:pt-0">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs border border-white/20 text-xs font-bold text-white tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-[#febd69]" />
                    <span>{slide.tag}</span>
                    <span className="text-white/40">•</span>
                    <span className="text-[#febd69]">{slide.badge}</span>
                  </div>

                  <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white font-display tracking-tight leading-[1.15]">
                    {slide.title}
                  </h1>

                  <p className="text-xs sm:text-base text-slate-200 line-clamp-2 max-w-xl font-sans">
                    {slide.subtitle}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      onClick={() => {
                        if (slide.category === 'Schemes') {
                          onScrollToSchemes();
                        } else {
                          onSelectCategory(slide.category);
                          onScrollToProducts();
                        }
                      }}
                      className="px-5 sm:px-7 py-2.5 sm:py-3 bg-[#ffd814] hover:bg-[#f7ca00] text-slate-950 font-bold text-xs sm:text-sm rounded-full shadow-lg transition active:scale-95 cursor-pointer border border-[#fcd200]"
                    >
                      {slide.ctaText}
                    </button>

                    <button
                      onClick={onScrollToPassbook}
                      className="px-4 sm:px-6 py-2.5 sm:py-3 bg-white/15 hover:bg-white/25 text-white font-semibold text-xs sm:text-sm rounded-full backdrop-blur-xs border border-white/30 transition cursor-pointer"
                    >
                      Check 30M Passbook
                    </button>
                  </div>
                </div>

                {/* Hero Real Image Banner Preview */}
                <div className="hidden md:flex shrink-0 items-center justify-center relative">
                  <div className="w-64 h-64 lg:w-84 lg:h-84 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 bg-white/5 backdrop-blur-xs p-2 transform hover:scale-105 transition duration-300">
                    <img
                      src={slide.image}
                      alt={slide.title}
                      className="w-full h-full object-cover rounded-xl"
                      loading="eager"
                    />
                    <div className="absolute bottom-4 left-4 right-4 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg text-[11px] text-white flex items-center justify-between border border-white/10">
                      <span className="font-bold text-[#febd69]">Shri Sai Wardha</span>
                      <span className="text-emerald-400 font-mono">100% Genuine</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Carousel Prev & Next Controls */}
        <button
          onClick={prevSlide}
          className="absolute left-2 top-1/3 -translate-y-1/2 z-20 w-10 h-16 bg-black/30 hover:bg-black/60 text-white rounded-r flex items-center justify-center transition cursor-pointer"
          title="Previous Slide"
        >
          <ChevronLeft className="w-7 h-7" />
        </button>

        <button
          onClick={nextSlide}
          className="absolute right-2 top-1/3 -translate-y-1/2 z-20 w-10 h-16 bg-black/30 hover:bg-black/60 text-white rounded-l flex items-center justify-center transition cursor-pointer"
          title="Next Slide"
        >
          <ChevronRight className="w-7 h-7" />
        </button>

        {/* AMAZON HERO BOTTOM FADE GRADIENT OVERLAY (Where quad cards overlap!) */}
        <div className="absolute bottom-0 left-0 right-0 h-40 sm:h-56 bg-gradient-to-t from-[#eaeded] via-[#eaeded]/80 to-transparent dark:from-[#0b1120] dark:via-[#0b1120]/80 dark:to-transparent z-15 pointer-events-none" />
      </div>

      {/* 2. AMAZON QUAD BENTO CARDS (The iconic 4 white cards overlapping the hero) */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 relative z-20 -mt-20 sm:-mt-28 md:-mt-36 lg:-mt-44 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1: Appliances Quad Card */}
          <div className="bg-white dark:bg-[#1e293b] p-4 rounded-[4px] shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight mb-3">
                Up to 45% off | Smart Home Appliances
              </h2>
              <div className="grid grid-cols-2 gap-2.5">
                <div
                  onClick={() => {
                    onSelectCategory('Home Appliances');
                    onScrollToProducts();
                  }}
                  className="cursor-pointer group"
                >
                  <div className="h-24 sm:h-26 rounded overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img
                      src={REAL_PRODUCT_IMAGES.smartTv32}
                      alt="Smart TVs"
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                  </div>
                  <span className="text-[11px] text-slate-700 dark:text-slate-300 font-medium block mt-1 truncate">
                    Smart 4K TVs
                  </span>
                </div>

                <div
                  onClick={() => {
                    onSelectCategory('Home Appliances');
                    onScrollToProducts();
                  }}
                  className="cursor-pointer group"
                >
                  <div className="h-24 sm:h-26 rounded overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img
                      src={REAL_PRODUCT_IMAGES.refrigeratorDoubleDoor}
                      alt="Refrigerators"
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                  </div>
                  <span className="text-[11px] text-slate-700 dark:text-slate-300 font-medium block mt-1 truncate">
                    Refrigerators
                  </span>
                </div>

                <div
                  onClick={() => {
                    onSelectCategory('Home Appliances');
                    onScrollToProducts();
                  }}
                  className="cursor-pointer group"
                >
                  <div className="h-24 sm:h-26 rounded overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img
                      src={REAL_PRODUCT_IMAGES.airCooler}
                      alt="Coolers"
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                  </div>
                  <span className="text-[11px] text-slate-700 dark:text-slate-300 font-medium block mt-1 truncate">
                    Desert Coolers
                  </span>
                </div>

                <div
                  onClick={() => {
                    onSelectCategory('Home Appliances');
                    onScrollToProducts();
                  }}
                  className="cursor-pointer group"
                >
                  <div className="h-24 sm:h-26 rounded overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img
                      src={REAL_PRODUCT_IMAGES.washingMachine}
                      alt="Washing Machine"
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                  </div>
                  <span className="text-[11px] text-slate-700 dark:text-slate-300 font-medium block mt-1 truncate">
                    Washers
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                onSelectCategory('Home Appliances');
                onScrollToProducts();
              }}
              className="text-xs font-semibold text-[#007185] dark:text-cyan-400 hover:text-[#c7511f] hover:underline text-left mt-3 flex items-center gap-1 cursor-pointer"
            >
              <span>See all appliances deals</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 2: Teak Furniture Quad Card */}
          <div className="bg-white dark:bg-[#1e293b] p-4 rounded-[4px] shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight mb-3">
                Handcrafted Solid Teak Furniture
              </h2>
              <div className="grid grid-cols-2 gap-2.5">
                <div
                  onClick={() => {
                    onSelectCategory('Furniture');
                    onScrollToProducts();
                  }}
                  className="cursor-pointer group"
                >
                  <div className="h-24 sm:h-26 rounded overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img
                      src={REAL_PRODUCT_IMAGES.sofaTeak}
                      alt="Sofa Set"
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                  </div>
                  <span className="text-[11px] text-slate-700 dark:text-slate-300 font-medium block mt-1 truncate">
                    3+1+1 Sofa Sets
                  </span>
                </div>

                <div
                  onClick={() => {
                    onSelectCategory('Furniture');
                    onScrollToProducts();
                  }}
                  className="cursor-pointer group"
                >
                  <div className="h-24 sm:h-26 rounded overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img
                      src={REAL_PRODUCT_IMAGES.bedKing}
                      alt="King Bed"
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                  </div>
                  <span className="text-[11px] text-slate-700 dark:text-slate-300 font-medium block mt-1 truncate">
                    Hydraulic Beds
                  </span>
                </div>

                <div
                  onClick={() => {
                    onSelectCategory('Furniture');
                    onScrollToProducts();
                  }}
                  className="cursor-pointer group"
                >
                  <div className="h-24 sm:h-26 rounded overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img
                      src={REAL_PRODUCT_IMAGES.wardrobe4D}
                      alt="Wardrobe"
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                  </div>
                  <span className="text-[11px] text-slate-700 dark:text-slate-300 font-medium block mt-1 truncate">
                    4-Door Wardrobes
                  </span>
                </div>

                <div
                  onClick={() => {
                    onSelectCategory('Furniture');
                    onScrollToProducts();
                  }}
                  className="cursor-pointer group"
                >
                  <div className="h-24 sm:h-26 rounded overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img
                      src={REAL_PRODUCT_IMAGES.diningTable}
                      alt="Dining"
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                  </div>
                  <span className="text-[11px] text-slate-700 dark:text-slate-300 font-medium block mt-1 truncate">
                    Dining Sets
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                onSelectCategory('Furniture');
                onScrollToProducts();
              }}
              className="text-xs font-semibold text-[#007185] dark:text-cyan-400 hover:text-[#c7511f] hover:underline text-left mt-3 flex items-center gap-1 cursor-pointer"
            >
              <span>Explore handcrafted furniture</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 3: 30-Month Weekly Scheme Quad Card */}
          <div className="bg-white dark:bg-[#1e293b] p-4 rounded-[4px] shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight mb-3">
                ३०-महिने साप्ताहिक बचत योजना हब
              </h2>
              <div className="grid grid-cols-2 gap-2.5">
                <div onClick={onScrollToPassbook} className="cursor-pointer group bg-amber-50 dark:bg-amber-950/40 p-2 rounded border border-amber-200 dark:border-amber-800/60">
                  <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold block">Live Passbook</span>
                  <p className="text-xs font-black text-slate-900 dark:text-white mt-1">Check Status</p>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1">Instant search</span>
                </div>

                <div onClick={onScrollToSchemes} className="cursor-pointer group bg-blue-50 dark:bg-blue-950/40 p-2 rounded border border-blue-200 dark:border-blue-800/60">
                  <span className="text-[10px] text-blue-700 dark:text-blue-400 font-bold block">Registration</span>
                  <p className="text-xs font-black text-slate-900 dark:text-white mt-1">Just ₹50</p>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1">Start anytime</span>
                </div>

                <div onClick={onScrollToSchemes} className="cursor-pointer group bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded border border-emerald-200 dark:border-emerald-800/60">
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold block">Active Schemes</span>
                  <p className="text-xs font-black text-slate-900 dark:text-white mt-1">1 to 6</p>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1">1001-12000</span>
                </div>

                <div onClick={onScrollToSchemes} className="cursor-pointer group bg-purple-50 dark:bg-purple-950/40 p-2 rounded border border-purple-200 dark:border-purple-800/60">
                  <span className="text-[10px] text-purple-700 dark:text-purple-400 font-bold block">Guaranteed</span>
                  <p className="text-xs font-black text-slate-900 dark:text-white mt-1">Item or Draw</p>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1">Full security</span>
                </div>
              </div>
            </div>

            <button
              onClick={onScrollToSchemes}
              className="text-xs font-semibold text-[#007185] dark:text-cyan-400 hover:text-[#c7511f] hover:underline text-left mt-3 flex items-center gap-1 cursor-pointer"
            >
              <span>View scheme details & rules</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 4: Wardha Assurances & Quick Connect */}
          <div className="bg-white dark:bg-[#1e293b] p-4 rounded-[4px] shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight mb-3">
                Shri Sai Wardha Assurances
              </h2>

              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5 p-2 rounded bg-slate-50 dark:bg-slate-800/60">
                  <Truck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Free Wardha Delivery
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      Orders above ₹3,000 delivered same day
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2 rounded bg-slate-50 dark:bg-slate-800/60">
                  <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      100% Genuine Brand Warranty
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      Official company service center support
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2 rounded bg-slate-50 dark:bg-slate-800/60">
                  <CreditCard className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Flexible Payment & EMI
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      UPI, Cash on Delivery, Weekly Card Scheme
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <a
              href={`https://wa.me/91${shopPhone}?text=${encodeURIComponent(
                'नमस्ते Shri Sai Enterprises, मुझे इलेक्ट्रॉनिक्स / फर्नीचर की जानकारी चाहिए।'
              )}`}
              target="_blank"
              rel="noreferrer"
              className="mt-3 w-full py-2 bg-[#ffd814] hover:bg-[#f7ca00] text-slate-950 font-bold text-xs rounded-full flex items-center justify-center gap-1.5 transition border border-[#fcd200] shadow-2xs"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-800" />
              <span>Direct WhatsApp Inquiry</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
