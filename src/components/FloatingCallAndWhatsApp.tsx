import React, { useState } from 'react';
import { Phone, MessageCircle, ChevronUp, X, Clock, MapPin } from 'lucide-react';

interface FloatingCallAndWhatsAppProps {
  primaryPhone?: string;
  secondaryPhone?: string;
}

export const FloatingCallAndWhatsApp: React.FC<FloatingCallAndWhatsAppProps> = ({
  primaryPhone = '8766486915',
  secondaryPhone = '8600122798',
}) => {
  const [showWhatsAppPicker, setShowWhatsAppPicker] = useState(false);

  const getWhatsAppUrl = (phone: string, text: string) => {
    return `https://wa.me/91${phone}?text=${encodeURIComponent(text)}`;
  };

  const defaultMessage =
    'Hello Shri Sai Electronics & Furniture,\nI would like to inquire about products / custom furniture / 30-month savings scheme.';

  return (
    <>
      {/* Floating WhatsApp Selector Modal / Popup if clicked */}
      {showWhatsAppPicker && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-150 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-50 text-[#00523f] flex items-center justify-center">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm">Chat on WhatsApp</h4>
                  <p className="text-xs text-slate-500">Select a direct showroom line</p>
                </div>
              </div>
              <button
                onClick={() => setShowWhatsAppPicker(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 pt-1">
              <a
                href={getWhatsAppUrl(primaryPhone, defaultMessage)}
                target="_blank"
                rel="noreferrer"
                onClick={() => setShowWhatsAppPicker(false)}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-emerald-50/60 border border-slate-200/80 hover:border-emerald-200 text-slate-900 font-medium text-xs transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#00523f] text-white flex items-center justify-center">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block font-semibold text-slate-900">Showroom Desk (Main)</span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      +91 {primaryPhone}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                  Online
                </span>
              </a>

              <a
                href={getWhatsAppUrl(secondaryPhone, defaultMessage)}
                target="_blank"
                rel="noreferrer"
                onClick={() => setShowWhatsAppPicker(false)}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-900 font-medium text-xs transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block font-semibold text-slate-900">Orders & Support</span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      +91 {secondaryPhone}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-600 font-semibold">
                  Active
                </span>
              </a>
            </div>

            <div className="text-xs text-slate-500 text-center pt-2 border-t border-slate-100 flex items-center justify-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>9:00 AM – 9:00 PM • Fast Response</span>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Floating Action Buttons: Left = Call Now, Right = WhatsApp */}
      <div className="hidden sm:flex fixed bottom-6 left-6 z-40 no-print">
        <a
          href={`tel:${primaryPhone}`}
          className="group flex items-center gap-2.5 px-4 py-2.5 sm:py-3 rounded-full bg-slate-900 hover:bg-slate-800 text-white shadow-[0_8px_25px_rgba(15,23,42,0.25)] hover:scale-102 active:scale-95 transition-all duration-200 border border-slate-700/50 cursor-pointer"
          title="Call Shri Sai Showroom"
        >
          <div className="relative flex items-center justify-center">
            <Phone className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-semibold tracking-tight leading-none">
              Call Us
            </span>
            <span className="text-[10px] text-slate-400 leading-tight font-mono">
              {primaryPhone}
            </span>
          </div>
        </a>
      </div>

      <div className="hidden sm:flex fixed bottom-6 right-6 z-40 no-print">
        <button
          onClick={() => setShowWhatsAppPicker(true)}
          className="group flex items-center gap-2.5 px-4 py-2.5 sm:py-3 rounded-full bg-[#00523f] hover:bg-[#004232] text-white shadow-[0_8px_25px_rgba(0,82,63,0.3)] hover:scale-102 active:scale-95 transition-all duration-200 border border-emerald-600/30 cursor-pointer"
          title="Chat on WhatsApp"
        >
          <div className="flex flex-col text-right">
            <span className="text-xs font-semibold tracking-tight leading-none">
              WhatsApp
            </span>
            <span className="text-[10px] text-emerald-200 leading-tight">
              Instant Chat
            </span>
          </div>
          <div className="relative flex items-center justify-center">
            <MessageCircle className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-white" />
          </div>
        </button>
      </div>

      {/* Mobile-Only Compact Floating WhatsApp Icon (Zero Collision with Bottom Nav & Cart) */}
      <div className="sm:hidden fixed bottom-20 right-3 z-30 no-print">
        <button
          onClick={() => setShowWhatsAppPicker(true)}
          className="w-11 h-11 rounded-full bg-[#25D366] text-white shadow-[0_4px_16px_rgba(37,211,102,0.45)] hover:scale-105 active:scale-90 transition-all flex items-center justify-center border-2 border-white cursor-pointer"
          title="WhatsApp Chat"
          aria-label="WhatsApp Chat"
        >
          <MessageCircle className="w-5 h-5 fill-white text-[#25D366]" />
        </button>
      </div>
    </>
  );
};
