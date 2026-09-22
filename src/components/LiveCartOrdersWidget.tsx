import React from 'react';
import { ShoppingCart, Zap, Package, ArrowRight, MessageCircle, Clock, ShieldCheck, CheckCircle2, Edit3 } from 'lucide-react';
import { AdminNotification } from './AdminNotificationDropdown';

interface LiveCartOrdersWidgetProps {
  notifications: AdminNotification[];
  onOpenStorefront: () => void;
  onNavigateToEntries: () => void;
  onEditNotification?: (notification: AdminNotification) => void;
}

export const LiveCartOrdersWidget: React.FC<LiveCartOrdersWidgetProps> = ({
  notifications,
  onOpenStorefront,
  onNavigateToEntries,
  onEditNotification,
}) => {
  const recentActivities = notifications.slice(0, 5);
  const cartActivities = notifications.filter((n) => n.type === 'cart_add');
  const orderActivities = notifications.filter((n) => n.type === 'order_placed' || n.type === 'finance_order_placed');

  return (
    <div className="tactile-card rounded-2xl p-4 sm:p-5 border border-[var(--tactile-border)] bg-gradient-to-br from-white via-slate-50/50 to-amber-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/20 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--tactile-border)] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-xs">
            <ShoppingCart className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                थेट ग्राहक कार्ट व ऑनलाइन ऑर्डर्स (Live Customer Activity)
              </h3>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              ग्राहकांनी बाहेरून कार्टमध्ये जोडलेल्या वस्तू व ०% फायनान्स अर्जांचे थेट दर्शन
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={onOpenStorefront}
            className="px-2.5 py-1.5 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 text-amber-900 dark:text-amber-300 font-semibold transition cursor-pointer flex items-center gap-1"
          >
            <span>दुकान पहा (Storefront)</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center">
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">
            कार्ट ॲक्टिव्हिटी
          </span>
          <span className="text-base font-black text-amber-600 dark:text-amber-400 font-mono">
            {cartActivities.length}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">
            ऑनलाइन ऑर्डर्स / फायनान्स
          </span>
          <span className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {orderActivities.length}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 col-span-2 sm:col-span-1">
          <span className="text-[10px] text-blue-700 dark:text-blue-300 block font-medium">
            बजाज ०% EMI पार्टनर
          </span>
          <span className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center justify-center gap-1 mt-0.5">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>इन्स्टंट स्पॉट अप्रूव्हल</span>
          </span>
        </div>
      </div>

      {/* Live Stream List */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
          अलिकडील ग्राहक क्रिया (Recent Stream):
        </span>

        {recentActivities.length === 0 ? (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 text-center text-xs text-slate-500">
            सध्या कोणत्याही नवीन ग्राहक क्रिया नाहीत. ग्राहक बाहेरून वस्तू कार्टमध्ये टाकताच येथे लाईव्ह अपडेट दिसेल.
          </div>
        ) : (
          <div className="space-y-1.5">
            {recentActivities.map((act) => {
              const isFinance = act.type === 'finance_order_placed';
              const isOrder = act.type === 'order_placed';

              return (
                <div
                  key={act.id}
                  className="p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/80 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                        isFinance
                          ? 'bg-blue-600 text-white'
                          : isOrder
                          ? 'bg-emerald-600 text-white'
                          : 'bg-amber-400 text-slate-950'
                      }`}
                    >
                      {isFinance ? (
                        <Zap className="w-3 h-3 fill-current" />
                      ) : isOrder ? (
                        <Package className="w-3 h-3" />
                      ) : (
                        <ShoppingCart className="w-3 h-3" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h5 className="font-bold text-slate-900 dark:text-white truncate text-xs">
                        {act.title}
                      </h5>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        {act.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {act.amount !== undefined && act.amount > 0 && (
                      <span className="font-mono font-bold text-slate-900 dark:text-amber-400 text-xs">
                        ₹{act.amount.toLocaleString()}
                      </span>
                    )}

                    {onEditNotification && (
                      <button
                        type="button"
                        onClick={() => onEditNotification(act)}
                        className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 hover:bg-amber-200 transition cursor-pointer"
                        title="तपशील पहा व संपादित करा (Edit Details)"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {act.customerPhone && (
                      <a
                        href={`https://wa.me/91${act.customerPhone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 hover:bg-emerald-100 transition"
                        title="WhatsApp मेसेज पाठवा"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
