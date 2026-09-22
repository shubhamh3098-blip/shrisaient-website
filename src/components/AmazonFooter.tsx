import React from 'react';
import {
  Phone,
  MapPin,
  ShieldCheck,
  CreditCard,
  MessageCircle,
  Truck,
  Lock,
  ArrowUp,
  Sparkles
} from 'lucide-react';
import { BusinessSettings } from '../types';

interface AmazonFooterProps {
  settings: BusinessSettings;
  onOpenLoginModal: () => void;
  onScrollToPassbook: () => void;
  onScrollToSchemes: () => void;
  onScrollToProducts: () => void;
}

export const AmazonFooter: React.FC<AmazonFooterProps> = ({
  settings,
  onOpenLoginModal,
  onScrollToPassbook,
  onScrollToSchemes,
  onScrollToProducts,
}) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="no-print select-none font-sans text-xs">
      {/* 1. AMAZON "BACK TO TOP" BAR */}
      <button
        onClick={scrollToTop}
        className="w-full py-3.5 bg-[#37475a] hover:bg-[#485769] active:bg-[#232f3e] text-white text-center text-xs sm:text-sm font-semibold transition cursor-pointer flex items-center justify-center gap-1.5"
      >
        <ArrowUp className="w-4 h-4" />
        <span>Back to top</span>
      </button>

      {/* 2. AMAZON 4-COLUMN MAIN FOOTER (#232f3e) */}
      <div className="bg-[#232f3e] text-slate-300 py-10 px-4 sm:px-8 border-b border-slate-700/60">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Column 1: Get to Know Us */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-white">Get to Know Us</h3>
            <ul className="space-y-2 text-slate-300">
              <li>
                <span className="text-white font-semibold block">Shri Sai Enterprises</span>
                <span className="text-[11px] text-slate-400">श्री साई इंटरप्राइजेस, वर्धा</span>
              </li>
              <li>
                <span className="text-slate-400">Owner:</span> {settings.ownerName || 'Shubham'}
              </li>
              <li>
                <span className="text-slate-400">Showroom:</span> Arvi Road, Punjab Colony
              </li>
              <li>
                <span className="text-slate-400">GSTIN:</span>{' '}
                <span className="font-mono text-amber-300 font-bold">27ALOPL0030G2ZC</span>
              </li>
              <li>
                <span className="text-slate-400">Udyam Reg:</span>{' '}
                <span className="font-mono text-slate-200">UDYAM-MH-33-0012948</span>
              </li>
            </ul>
          </div>

          {/* Column 2: Connect with Us */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-white">Connect with Us</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href={`https://wa.me/91${settings.phone}?text=नमस्ते`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline flex items-center gap-1.5 text-slate-200 hover:text-[#febd69]"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>WhatsApp: {settings.phone}</span>
                </a>
              </li>
              {settings.additionalPhones?.map((ph, idx) => (
                <li key={idx}>
                  <a
                    href={`tel:${ph}`}
                    className="hover:underline flex items-center gap-1.5 text-slate-300 hover:text-white"
                  >
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>Helpline: {ph}</span>
                  </a>
                </li>
              ))}
              <li className="pt-1">
                <a
                  href={settings.whatsappGroupLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:underline"
                >
                  <span>Join WhatsApp Offer Community</span>
                  <span>→</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: 30-Month Weekly Scheme */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-white">30-Month Savings Scheme</h3>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={onScrollToPassbook}
                  className="hover:underline text-left text-amber-300 hover:text-amber-200 cursor-pointer font-semibold"
                >
                  Track Digital Passbook
                </button>
              </li>
              <li>
                <button
                  onClick={onScrollToSchemes}
                  className="hover:underline text-left text-slate-300 hover:text-white cursor-pointer"
                >
                  Scheme 1 (Cards 1001 - 2999)
                </button>
              </li>
              <li>
                <button
                  onClick={onScrollToSchemes}
                  className="hover:underline text-left text-slate-300 hover:text-white cursor-pointer"
                >
                  Scheme 2 (Cards 3001 - 3999)
                </button>
              </li>
              <li>
                <button
                  onClick={onScrollToSchemes}
                  className="hover:underline text-left text-slate-300 hover:text-white cursor-pointer"
                >
                  Scheme 3 (Cards 1001 - 6000)
                </button>
              </li>
              <li>
                <span className="text-[11px] text-slate-400">
                  Registration Fee: ₹50 • Full Tenure 30 Months
                </span>
              </li>
            </ul>
          </div>

          {/* Column 4: Let Us Help You */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-white">Let Us Help You</h3>
            <ul className="space-y-2">
              <li>
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <Truck className="w-3.5 h-3.5" />
                  <span>Free Delivery on Orders &gt;₹3,000</span>
                </span>
              </li>
              <li>
                <span className="text-slate-400 text-[11px] block">
                  Same-day delivery across Wardha City & villages
                </span>
              </li>
              <li>
                <span className="text-slate-400 text-[11px] block">
                  Official Company Warranty Service Center support
                </span>
              </li>
              <li>
                <div className="bg-slate-900/60 p-2 rounded border border-slate-700/60 text-[11px] font-mono space-y-0.5">
                  <span className="text-white block font-bold">HDFC Bank A/C:</span>
                  <span className="text-amber-300">50200083215914</span>
                  <span className="text-slate-400 block">IFSC: HDFC0000965</span>
                </div>
              </li>
              <li className="pt-1">
                <button
                  onClick={onOpenLoginModal}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold cursor-pointer border border-slate-700"
                >
                  <Lock className="w-3 h-3 text-[#febd69]" />
                  <span>Staff & Admin Portal</span>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* 3. AMAZON BOTTOM BAR (#131921) */}
      <div className="bg-[#131921] text-slate-400 py-6 px-4 text-center space-y-2 border-t border-slate-800">
        <div className="flex items-center justify-center gap-2">
          <span className="text-lg font-black text-white tracking-tight font-display">
            shri sai
          </span>
          <span className="text-xs font-bold text-[#febd69]">.in</span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-400">
          <a href="#products-catalog" className="hover:underline">Electronics</a>
          <span>•</span>
          <a href="#products-catalog" className="hover:underline">Home Appliances</a>
          <span>•</span>
          <a href="#products-catalog" className="hover:underline">Teak Furniture</a>
          <span>•</span>
          <a href="#passbook-section" className="hover:underline">30-Month Passbook</a>
          <span>•</span>
          <a href="#savings-schemes" className="hover:underline">Weekly Savings Scheme</a>
        </div>

        <p className="text-[11px] text-slate-400">
          पत्ता : मातोश्री सभागृह समोर आर्वी रोड पंजाब कॉलनी वर्धा ,442001
        </p>

        <p className="text-[10px] text-slate-400 pt-1">
          © 2026, Shri Sai Enterprises, Wardha or its affiliates. All rights reserved. GSTIN: 27ALOPL0030G2ZC
        </p>
      </div>
    </footer>
  );
};
