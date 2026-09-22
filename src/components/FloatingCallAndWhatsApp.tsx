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
    'नमस्ते Shri Sai Enterprises (वर्धा),\nमला उत्पादने / सेवा / ३०-महिने बचत योजनेबद्दल चौकशी करायची आहे.';

  return (
    <>
      {/* Floating WhatsApp Selector Modal / Popup if clicked */}
      {showWhatsAppPicker && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">WhatsApp चॅट सुरू करा</h4>
                  <p className="text-[11px] text-slate-500">कोणत्या नंबरवर बोलायचे आहे?</p>
                </div>
              </div>
              <button
                onClick={() => setShowWhatsAppPicker(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 pt-1">
              <a
                href={getWhatsAppUrl(primaryPhone, defaultMessage)}
                target="_blank"
                rel="noreferrer"
                onClick={() => setShowWhatsAppPicker(false)}
                className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-slate-900 font-bold text-xs transition"
              >
                <div className="flex items-center gap-2.5">
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="block text-slate-900">WhatsApp 1 (मुख्य ऑफिस)</span>
                    <span className="text-[11px] text-emerald-700 font-mono font-normal">
                      +91 {primaryPhone}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                  ऑनलाइन
                </span>
              </a>

              <a
                href={getWhatsAppUrl(secondaryPhone, defaultMessage)}
                target="_blank"
                rel="noreferrer"
                onClick={() => setShowWhatsAppPicker(false)}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-900 font-bold text-xs transition"
              >
                <div className="flex items-center gap-2.5">
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="block text-slate-900">WhatsApp 2 (सपोर्ट व ऑर्डर्स)</span>
                    <span className="text-[11px] text-slate-600 font-mono font-normal">
                      +91 {secondaryPhone}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                  सक्रिय
                </span>
              </a>
            </div>

            <div className="text-[11px] text-slate-500 text-center pt-2 border-t border-slate-100 flex items-center justify-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>सकाळी ९:०० ते रात्री ९:०० • त्वरित उत्तर मिळेल</span>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Buttons: Left = Call Us, Right = WhatsApp Instant Chat */}
      {/* Positioned at bottom-20 on mobile to strictly avoid overlapping the bottom nav bar (bottom-0) */}
      <div className="fixed bottom-20 sm:bottom-6 left-3 sm:left-6 z-40 no-print">
        <a
          href={`tel:${primaryPhone}`}
          className="group flex items-center justify-center p-2.5 sm:px-4 sm:py-2.5 rounded-full bg-[#0B1528] hover:bg-slate-800 text-white shadow-xl shadow-slate-900/40 hover:scale-105 active:scale-95 transition-all duration-200 border border-slate-700/80 cursor-pointer"
          title={`Direct Call: ${primaryPhone}`}
          aria-label="Call Shri Sai Enterprises"
        >
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div className="hidden sm:flex flex-col text-left leading-tight ml-2.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Call Us
            </span>
            <span className="text-xs font-mono font-bold text-white tracking-tight">
              {primaryPhone}
            </span>
          </div>
        </a>
      </div>

      <div className="fixed bottom-20 sm:bottom-6 right-3 sm:right-6 z-40 no-print">
        <button
          onClick={() => setShowWhatsAppPicker(true)}
          className="group flex items-center justify-center p-2.5 sm:px-4 sm:py-2.5 rounded-full bg-[#0D5C4D] hover:bg-[#094539] text-white shadow-xl shadow-emerald-950/40 hover:scale-105 active:scale-95 transition-all duration-200 border border-emerald-500/60 cursor-pointer"
          title="Chat with Shri Sai Enterprises on WhatsApp"
          aria-label="Chat on WhatsApp"
        >
          <div className="hidden sm:flex flex-col text-right leading-tight mr-2">
            <span className="text-xs font-bold text-white tracking-tight">
              WhatsApp
            </span>
            <span className="text-[10px] text-emerald-200 font-medium">
              Instant Chat
            </span>
          </div>
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/20 text-white flex items-center justify-center shrink-0">
            <MessageCircle className="w-4 h-4 sm:w-4 sm:h-4 text-white" />
          </div>
        </button>
      </div>
    </>
  );
};
