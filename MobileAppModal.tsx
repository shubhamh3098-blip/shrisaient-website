import React from 'react';
import {
  X,
  Smartphone,
  Download,
  QrCode,
  CheckCircle2,
  Share2,
  ShieldCheck,
  WifiOff
} from 'lucide-react';
import { SaiLogo } from './SaiLogo';

interface MobileAppModalProps {
  onClose: () => void;
}

export const MobileAppModal: React.FC<MobileAppModalProps> = ({ onClose }) => {
  const currentUrl = window.location.href;

  const handleInstallClick = () => {
    alert('ॲप इन्स्टॉल करण्यासाठी: तुमच्या मोबाईल ब्राउझरमधील मेनू (३ डॉट्स) वर क्लिक करून "Add to Home screen" किंवा "Install App" निवडा.');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <SaiLogo size="sm" glow={true} />
            <div>
              <h3 className="text-base font-bold text-white">श्री साई एंटरप्रायझेस मोबाईल अ‍ॅप</h3>
              <p className="text-[11px] text-slate-400">Official Mobile App & PWA</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QR Code Simulation */}
        <div className="flex flex-col items-center justify-center p-6 bg-slate-950 rounded-2xl border border-slate-800 text-center space-y-3">
          <div className="w-44 h-44 bg-white p-3 rounded-xl shadow-lg flex flex-col items-center justify-center border-4 border-slate-700">
            {/* Standard SVG QR representation */}
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <path d="M0,0 h30 v30 h-30 z M40,0 h20 v10 h-20 z M70,0 h30 v30 h-30 z M10,10 h10 v10 h-10 z M80,10 h10 v10 h-10 z M0,40 h10 v20 h-10 z M30,40 h40 v10 h-40 z M80,40 h20 v20 h-20 z M0,70 h30 v30 h-30 z M10,80 h10 v10 h-10 z M40,70 h20 v30 h-20 z M70,70 h30 v30 h-30 z M80,80 h10 v10 h-10 z" fill="#0f172a" />
            </svg>
          </div>
          <div className="text-xs text-slate-300 font-medium">
            मोबाईल कॅमेरा किंवा Google Lens ने स्कॅन करा
          </div>
          <div className="text-[11px] text-slate-400 max-w-xs">
            तुमच्या Android किंवा iOS मोबाईलवर त्वरित अ‍ॅप उघडा व होम स्क्रीनवर सेव्ह करा.
          </div>
        </div>

        {/* Features List */}
        <div className="space-y-2 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>ऑफलाईन बिलिंग आणि जलद हप्ते वसुली (No internet required)</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>थेट ब्लूटूथ थर्मल प्रिंटर व WhatsApp पावती शेअरिंग</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>क्लाउड बॅकअप सोबत ऑटो सिंक</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={handleInstallClick}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <Download className="w-4 h-4" />
            <span>मोबाईलमध्ये अ‍ॅप इन्स्टॉल करा (Install)</span>
          </button>
          <button
            onClick={onClose}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
          >
            बंद करा
          </button>
        </div>
      </div>
    </div>
  );
};
