import React, { useState } from 'react';
import { 
  Download, 
  Share2, 
  PlusSquare, 
  X, 
  CheckCircle, 
  Smartphone, 
  Wifi, 
  Monitor, 
  Laptop, 
  FileCode, 
  Sparkles,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall';
import { AppLogo } from './AppLogo';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstalled, isIOS, hasNativePrompt, installApp } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'pc' | 'mobile'>('pc');
  const [installSuccess, setInstallSuccess] = useState(false);

  if (!isOpen) return null;

  const handleInstall = async () => {
    if (hasNativePrompt) {
      const success = await installApp();
      if (success) {
        setInstallSuccess(true);
        setTimeout(() => {
          onClose();
        }, 1800);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-lg bg-[#0F1D38] border border-amber-500/30 rounded-3xl p-5 sm:p-6 text-white shadow-2xl relative overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div className="absolute -top-16 -left-16 w-40 h-40 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer z-10"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with App Logo */}
        <div className="flex flex-col items-center text-center mt-1 mb-4 shrink-0">
          <AppLogo size="lg" variant="iconOnly" className="mb-2" />
          <h3 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Shri Sai Enterprises
          </h3>
          <p className="text-xs text-amber-400 font-semibold mt-0.5">
            अधिकृत ERP व बिलिंग ॲप • PC आणि मोबाईल इन्स्टॉलेशन
          </p>
        </div>

        {/* Device Mode Switcher */}
        <div className="grid grid-cols-2 p-1 bg-slate-900/80 rounded-2xl border border-slate-700/80 mb-4 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('pc')}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'pc'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>Windows PC / लॅपटॉप</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('mobile')}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'mobile'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>मोबाईल (Android / iOS)</span>
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
          
          {installSuccess ? (
            <div className="text-center py-6 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4">
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
              <p className="font-bold text-sm text-emerald-300">ॲप यशस्वीरित्या इन्स्टॉल झाले!</p>
              <p className="text-xs text-emerald-200/80 mt-1">
                Shri Sai Enterprises ॲप आता तुमच्या स्क्रीनवर डेस्कटॉप ॲप म्हणून उपलब्ध आहे.
              </p>
            </div>
          ) : activeTab === 'pc' ? (
            /* WINDOWS PC TAB */
            <div className="space-y-3.5">
              
              {/* Method 1: 1-Click Desktop App (Native PWA) */}
              <div className="bg-slate-800/80 border border-blue-500/30 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-blue-300 font-bold text-sm">
                    <Laptop className="w-4 h-4 text-blue-400" />
                    <span>मार्ग १: १-क्लिक Windows Desktop App (सर्वात सोपा)</span>
                  </div>
                  <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Recommended
                  </span>
                </div>

                <p className="text-slate-300 leading-relaxed text-[11px]">
                  Chrome किंवा Edge ब्राउझरमध्ये खालील बटण दाबल्यावर तुमच्या Windows PC च्या डेस्कटॉपवर आणि Start Menu मध्ये <strong>Shri Sai Enterprises ERP</strong> चा थेट शॉर्टकट तयार होतो. हे स्वतंत्र ॲप विंडोमध्ये इंटरनेट नसतानाही चालते.
                </p>

                <button
                  type="button"
                  onClick={handleInstall}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-98 transition cursor-pointer"
                >
                  <Download className="w-4 h-4 text-yellow-300" />
                  <span>Windows PC वर १-क्लिक इन्स्टॉल करा (Desktop App)</span>
                </button>

                <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/60">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>ब्राउझरच्या URL बारमधील <Download className="w-3 h-3 inline text-blue-400 mx-0.5" /> आयकॉनवर क्लिक करूनही इन्स्टॉल करू शकता.</span>
                </div>
              </div>

              {/* Method 2: Standalone .exe File / Electron Build */}
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                  <FileCode className="w-4 h-4 text-amber-400" />
                  <span>मार्ग २: Windows .exe फाईल (Standalone Application)</span>
                </div>

                <p className="text-slate-300 text-[11px] leading-relaxed">
                  या सॉफ्टवेअरसाठी <strong>Windows 64-bit (.exe)</strong> बिल्ड पूर्णपणे तयार आहे:
                </p>

                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/80 space-y-1.5 font-mono text-[11px]">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>dist-electron/win-unpacked/Shri Sai Enterprises.exe</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-300">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>electron-builder.json (NSIS Setup & Portable .exe)</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200/90 text-[11px] space-y-1">
                  <span className="font-bold block">💡 नवीन .exe तयार करण्याची कमांड:</span>
                  <code className="block bg-black/40 px-2 py-1 rounded text-amber-300 font-mono">
                    npm run build:exe
                  </code>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    ही कमांड चालवल्यास Windows Installer (.exe) थेट <code>dist-electron</code> फोल्डरमध्ये तयार होतो.
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* MOBILE TAB (Android & iOS) */
            <div className="space-y-3.5">
              {isIOS ? (
                /* iOS Safari Instructions */
                <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 space-y-3">
                  <p className="font-bold text-amber-400 uppercase tracking-wider text-[11px]">
                    iPhone / iPad वर इन्स्टॉल करण्यासाठी:
                  </p>
                  <div className="flex items-start gap-3 text-slate-200">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold shrink-0">
                      1
                    </span>
                    <span>
                      Safari ब्राउझरच्या खालील <Share2 className="w-3.5 h-3.5 inline text-blue-400 mx-1" /> <strong>Share</strong> बटणावर टॅप करा.
                    </span>
                  </div>
                  <div className="flex items-start gap-3 text-slate-200">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold shrink-0">
                      2
                    </span>
                    <span>
                      खाली स्क्रोल करून <PlusSquare className="w-3.5 h-3.5 inline text-emerald-400 mx-1" /> <strong>Add to Home Screen</strong> निवडा.
                    </span>
                  </div>
                </div>
              ) : (
                /* Android Prompt */
                <div className="space-y-3">
                  <button
                    onClick={handleInstall}
                    className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-slate-950 font-bold flex items-center justify-center gap-2.5 shadow-lg shadow-amber-500/25 hover:opacity-95 active:scale-98 transition cursor-pointer"
                  >
                    <Download className="w-5 h-5" />
                    <span>Android मोबाईलवर ॲप इन्स्टॉल करा (Install App)</span>
                  </button>
                  <p className="text-center text-[11px] text-slate-400">
                    कोणतीही Play Store फाइल डाउनलोड न करता थेट ॲप तुमच्या होम स्क्रीनवर जोडले जाते.
                  </p>
                </div>
              )}

              {/* Feature Highlights */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-2.5 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-slate-200">1-Tap होम स्क्रीन ऍक्सेस</span>
                </div>
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-2.5 flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-slate-200">ऑफलाइन काम व लाईव्ह सिंक</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Bottom Close */}
        <div className="pt-3 border-t border-slate-800 mt-2 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer text-center"
          >
            बंद करा (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
