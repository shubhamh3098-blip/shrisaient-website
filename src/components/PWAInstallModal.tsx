import React, { useState } from 'react';
import { Download, Share2, PlusSquare, X, CheckCircle, Smartphone, Wifi } from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall';
import { AppLogo } from './AppLogo';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstalled, isIOS, hasNativePrompt, installApp } = usePWAInstall();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-md bg-[#0F1D38] border border-amber-500/30 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div className="absolute -top-16 -left-16 w-40 h-40 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with App Logo */}
        <div className="flex flex-col items-center text-center mt-2 mb-6">
          <AppLogo size="xl" variant="iconOnly" className="mb-3" />
          <h3 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Shri Sai Enterprises App
          </h3>
          <p className="text-xs text-amber-400/90 font-medium mt-0.5">
            Official Mobile Application • Wardha
          </p>
        </div>

        {/* Feature Badges */}
        <div className="grid grid-cols-2 gap-2.5 mb-6 text-xs">
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 flex items-center gap-2.5">
            <Smartphone className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span className="text-slate-200">1-Tap Fast Home Screen Access</span>
          </div>
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 flex items-center gap-2.5">
            <Wifi className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="text-slate-200">Works 100% Offline & Live Sync</span>
          </div>
        </div>

        {/* Body based on device state */}
        {installSuccess ? (
          <div className="text-center py-4 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4">
            <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            <p className="font-semibold text-emerald-300">ॲप यशस्वीरित्या इन्स्टॉल झाले!</p>
            <p className="text-xs text-emerald-200/80 mt-1">
              Shri Sai Enterprises ॲप आता तुमच्या होम स्क्रीनवर उपलब्ध आहे.
            </p>
          </div>
        ) : isInstalled ? (
          <div className="text-center py-4 bg-blue-950/40 border border-blue-500/30 rounded-2xl p-4">
            <CheckCircle className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <p className="font-semibold text-white">ॲप आधीच इन्स्टॉल केलेले आहे</p>
            <p className="text-xs text-slate-300 mt-1">
              तुम्ही हे ॲप थेट मोबाईल होम स्क्रीनवरून वापरू शकता.
            </p>
          </div>
        ) : isIOS ? (
          /* iOS Instructions */
          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 text-sm space-y-3">
            <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
              iPhone / iPad वर इन्स्टॉल करण्यासाठी:
            </p>
            <div className="flex items-start gap-3 text-xs text-slate-200">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold flex-shrink-0">
                1
              </span>
              <span>
                Safari ब्राउझरच्या खालील <Share2 className="w-3.5 h-3.5 inline text-blue-400 mx-1" /> <strong>Share</strong> बटणावर टॅप करा.
              </span>
            </div>
            <div className="flex items-start gap-3 text-xs text-slate-200">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold flex-shrink-0">
                2
              </span>
              <span>
                खाली स्क्रोल करून <PlusSquare className="w-3.5 h-3.5 inline text-emerald-400 mx-1" /> <strong>Add to Home Screen</strong> निवडा.
              </span>
            </div>
          </div>
        ) : (
          /* Android / Chrome Native Prompt */
          <div>
            <button
              onClick={handleInstall}
              className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-slate-950 font-bold flex items-center justify-center gap-2.5 shadow-lg shadow-amber-500/25 hover:opacity-95 active:scale-[0.98] transition-all"
            >
              <Download className="w-5 h-5" />
              <span>मोबाईल ॲप इन्स्टॉल करा (Install App)</span>
            </button>
            <p className="text-center text-[11px] text-slate-400 mt-3">
              कोणतीही Play Store फाइल डाउनलोड न करता सुरक्षितपणे जोडले जाते.
            </p>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full mt-4 py-2.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          आत्ता नको (Dismiss)
        </button>
      </div>
    </div>
  );
};
