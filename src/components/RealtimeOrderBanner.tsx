import React, { useEffect, useState } from 'react';
import {
  Bell,
  X,
  CheckCircle2,
  ExternalLink,
  Phone,
  ShoppingBag,
  Volume2,
  Barcode,
  Eye,
} from 'lucide-react';
import {
  OrderNotificationPayload,
  subscribeToRealtimeOrders,
  playOrderChimeSound,
} from '../utils/notifications';

interface RealtimeOrderBannerProps {
  onViewInvoice?: (invoiceNo: string) => void;
  onConfirmOrder?: (invoiceNo: string) => void;
}

export const RealtimeOrderBanner: React.FC<RealtimeOrderBannerProps> = ({
  onViewInvoice,
  onConfirmOrder,
}) => {
  const [activeAlert, setActiveAlert] = useState<OrderNotificationPayload | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToRealtimeOrders((order) => {
      setActiveAlert(order);
      if (!isMuted) {
        playOrderChimeSound();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isMuted]);

  if (!activeAlert) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] max-w-md w-[calc(100vw-2rem)] animate-in slide-in-from-top-4 duration-300 pointer-events-auto">
      <div className="bg-slate-900 text-white rounded-3xl p-4 sm:p-5 shadow-2xl border-2 border-emerald-500/80 backdrop-blur-md space-y-3">
        {/* Header with sound badge and close button */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <ShoppingBag className="w-4 h-4" />
            </span>
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-white flex items-center gap-1.5">
                नवीन ऑनलाईन ऑर्डर प्राप्त!
              </h4>
              <span className="text-[10px] text-slate-400 font-mono">
                बिल क्र. #{activeAlert.invoiceNo}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setIsMuted(!isMuted);
                if (isMuted) playOrderChimeSound();
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title={isMuted ? 'ध्वनी चालू करा' : 'म्युट करा'}
            >
              <Volume2 className={`w-3.5 h-3.5 ${isMuted ? 'text-slate-600' : 'text-emerald-400'}`} />
            </button>
            <button
              onClick={() => setActiveAlert(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="बंद करा"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Order Details Body */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-200">
            <span className="font-semibold text-sm text-emerald-300">
              {activeAlert.customerName}
            </span>
            <a
              href={`tel:${activeAlert.customerPhone}`}
              className="flex items-center gap-1 text-[11px] font-mono text-slate-300 hover:text-emerald-400 transition"
            >
              <Phone className="w-3 h-3 text-emerald-400" />
              <span>{activeAlert.customerPhone}</span>
            </a>
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 space-y-1 font-mono text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-400">एकूण बिल (Total):</span>
              <strong className="text-white">₹{activeAlert.totalAmount.toLocaleString()}</strong>
            </div>
            {activeAlert.downPayment !== undefined && activeAlert.downPayment > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>किमान ५०% DP:</span>
                <strong>₹{activeAlert.downPayment.toLocaleString()}</strong>
              </div>
            )}
            <div className="flex justify-between text-slate-400 text-[10px]">
              <span>पेमेंट मोड:</span>
              <span className="text-slate-300">{activeAlert.paymentMode}</span>
            </div>
            {activeAlert.financePlan && (
              <div className="flex justify-between text-amber-300 text-[10px]">
                <span>फायनान्स प्लॅन:</span>
                <span>{activeAlert.financePlan}</span>
              </div>
            )}
          </div>

          <p className="text-[11px] text-slate-300 line-clamp-2">
            📦 {activeAlert.itemSummary}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1 border-t border-slate-800 text-xs">
          {onConfirmOrder && (
            <button
              onClick={() => {
                onConfirmOrder(activeAlert.invoiceNo);
                setActiveAlert(null);
              }}
              className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm active:scale-95"
            >
              <Barcode className="w-3.5 h-3.5" />
              <span>कन्फर्म व सिरीयल जोडा</span>
            </button>
          )}

          {onViewInvoice && (
            <button
              onClick={() => {
                onViewInvoice(activeAlert.invoiceNo);
                setActiveAlert(null);
              }}
              className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-medium flex items-center gap-1 transition cursor-pointer"
              title="बिल पहा"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>बिल</span>
            </button>
          )}

          <button
            onClick={() => setActiveAlert(null)}
            className="py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-medium transition cursor-pointer"
          >
            <span>Dismiss</span>
          </button>
        </div>
      </div>
    </div>
  );
};
