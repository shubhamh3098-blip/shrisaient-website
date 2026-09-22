import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  CheckCircle2,
  ShoppingCart,
  Zap,
  Package,
  Trash2,
  ExternalLink,
  MessageCircle,
  Volume2,
  VolumeX,
  Edit3,
  FileText,
  Clock,
} from 'lucide-react';

export interface AdminNotification {
  id: string;
  type: 'cart_add' | 'order_placed' | 'finance_order_placed';
  title: string;
  subtitle: string;
  amount?: number;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  itemName?: string;
  quantity?: number;
  schemeName?: string;
  providerName?: string;
  timestamp: number;
  read: boolean;
  status?: 'pending' | 'contacted' | 'converted_to_bill' | 'cancelled';
  notes?: string;
}

interface AdminNotificationDropdownProps {
  notifications: AdminNotification[];
  onMarkAllRead: () => void;
  onClearAll: () => void;
  onViewOrder?: (notification: AdminNotification) => void;
  onEditNotification?: (notification: AdminNotification) => void;
  onDeleteNotification?: (id: string) => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
}

export const AdminNotificationDropdown: React.FC<AdminNotificationDropdownProps> = ({
  notifications,
  onMarkAllRead,
  onClearAll,
  onViewOrder,
  onEditNotification,
  onDeleteNotification,
  isMuted = false,
  onToggleMute,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const formatTimeAgo = (timestamp: number) => {
    const diffSec = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSec < 60) return `${diffSec} सेकंदांपूर्वी`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} मिनिटांपूर्वी`;
    const diffHr = Math.floor(diffMin / 60);
    return `${diffHr} तासांपूर्वी`;
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'contacted':
        return (
          <span className="px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 text-[9px] font-bold">
            🔵 संपर्क झाला
          </span>
        );
      case 'converted_to_bill':
        return (
          <span className="px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-[9px] font-bold">
            🟢 बिल बनवले
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[9px] font-bold">
            ⚪ रद्द
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 text-[9px] font-bold">
            🟡 प्रलंबित
          </span>
        );
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition cursor-pointer shadow-xs"
        title="ग्राहक कार्ट व ऑर्डर्स नोटिफिकेशन्स (Live Customer Activity)"
      >
        <Bell className={`w-4 h-4 ${unreadCount > 0 ? 'text-amber-500 animate-wiggle' : 'text-slate-500'}`} />

        {/* Unread Ping Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-black text-white shadow-sm ring-2 ring-white dark:ring-slate-900 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-84 sm:w-96 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 shadow-2xl z-50 overflow-hidden animate-fade-in text-xs">
          {/* Header */}
          <div className="p-3.5 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-400 text-slate-950 font-bold">
                <Bell className="w-3.5 h-3.5" />
              </span>
              <div>
                <h4 className="font-bold text-sm leading-tight text-white">
                  लाईव्ह ग्राहक ॲक्टिव्हिटी
                </h4>
                <p className="text-[10px] text-slate-300">
                  {unreadCount > 0 ? `${unreadCount} नवीन सूचना (Unread)` : 'सर्व पाहिले गेले आहे'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {onToggleMute && (
                <button
                  type="button"
                  onClick={onToggleMute}
                  className="p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer"
                  title={isMuted ? 'ध्वनी सुरू करा' : 'ध्वनी म्यूट करा'}
                >
                  {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
                </button>
              )}
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={onMarkAllRead}
                  className="text-[10px] px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-slate-200 font-medium transition cursor-pointer"
                >
                  वाचले म्हणून चिन्हांकित करा
                </button>
              )}
            </div>
          </div>

          {/* List of Activities */}
          <div className="max-h-88 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
                <p className="font-semibold text-xs text-slate-600 dark:text-slate-300">
                  अद्याप कोणतीही नवीन ॲक्टिव्हिटी नाही
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  ग्राहकाने बाहेर कार्टमध्ये वस्तू जोडल्यास किंवा ऑर्डर दिल्यास येथे त्वरित दिसेल.
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const isFinance = notif.type === 'finance_order_placed';
                const isOrder = notif.type === 'order_placed';
                const isCart = notif.type === 'cart_add';

                return (
                  <div
                    key={notif.id}
                    className={`p-3 transition flex items-start gap-2.5 group ${
                      !notif.read
                        ? 'bg-amber-50/60 dark:bg-amber-950/25'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    {/* Icon indicator */}
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isFinance
                          ? 'bg-blue-600 text-white'
                          : isOrder
                          ? 'bg-emerald-600 text-white'
                          : 'bg-amber-400 text-slate-950'
                      }`}
                    >
                      {isFinance ? (
                        <Zap className="w-3.5 h-3.5 fill-current" />
                      ) : isOrder ? (
                        <Package className="w-3.5 h-3.5" />
                      ) : (
                        <ShoppingCart className="w-3.5 h-3.5" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-slate-900 dark:text-white truncate text-xs">
                          {notif.title}
                        </span>
                        <span className="text-[9px] text-slate-400 shrink-0">
                          {formatTimeAgo(notif.timestamp)}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-snug">
                        {notif.subtitle}
                      </p>

                      <div className="mt-1 flex items-center gap-2 flex-wrap">
                        {notif.amount !== undefined && notif.amount > 0 && (
                          <span className="font-mono font-bold text-slate-900 dark:text-amber-400 text-xs">
                            ₹{notif.amount.toLocaleString()}
                          </span>
                        )}

                        {notif.providerName && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300">
                            {notif.providerName}
                          </span>
                        )}

                        {getStatusBadge(notif.status)}
                      </div>

                      {/* Action buttons (Edit / WhatsApp / Delete) */}
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        {onEditNotification && (
                          <button
                            type="button"
                            onClick={() => {
                              onEditNotification(notif);
                              setIsOpen(false);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-100 dark:bg-amber-950/60 hover:bg-amber-200 text-amber-900 dark:text-amber-200 text-[10px] font-bold transition cursor-pointer"
                            title="तपशील पहा व संपादित करा (Edit)"
                          >
                            <Edit3 className="w-3 h-3 text-amber-700 dark:text-amber-300" />
                            <span>संपादित करा</span>
                          </button>
                        )}

                        {notif.customerPhone && (
                          <a
                            href={`https://wa.me/91${notif.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                              `नमस्कार ${notif.customerName || 'Customer'}, श्री साई इंटरप्राइजेस वर्धा मधून संपर्क करत आहोत.`
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
                          >
                            <MessageCircle className="w-3 h-3" />
                            <span>WhatsApp ({notif.customerPhone})</span>
                          </a>
                        )}

                        {onDeleteNotification && (
                          <button
                            type="button"
                            onClick={() => onDeleteNotification(notif.id)}
                            className="ml-auto text-slate-400 hover:text-red-500 p-1 rounded transition cursor-pointer"
                            title="ही नोंद हटवा"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer with Clear All */}
          {notifications.length > 0 && (
            <div className="p-2.5 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
              <span className="text-slate-500 dark:text-slate-400">
                एकूण {notifications.length} नोंदी
              </span>
              <button
                type="button"
                onClick={onClearAll}
                className="text-red-600 dark:text-red-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>सर्व पुसा</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
