import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  CheckCircle2,
  ShoppingCart,
  ShoppingBag,
  CreditCard,
  Trash2,
  Check,
  X,
  Clock,
  Edit3
} from 'lucide-react';
import { NotificationService, AppNotification } from '../../services/notificationService';
import { useTheme } from '../../context/ThemeContext';

interface NotificationDropdownProps {
  onOpenOrderModal?: (notification: AppNotification) => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ onOpenOrderModal }) => {
  const { isDayMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = NotificationService.subscribe((list) => {
      setNotifications(list);
    });
    return () => unsubscribe();
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
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

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const formatTimeAgo = (isoStr: string) => {
    const diffMs = Date.now() - new Date(isoStr).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);

    if (diffMin < 1) return 'आत्ताच (Just now)';
    if (diffMin < 60) return `${diffMin} मिनिटांपूर्वी`;
    if (diffHour < 24) return `${diffHour} तासांपूर्वी`;
    return new Date(isoStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  };

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'order_completed':
        return <ShoppingBag className="w-4 h-4 text-emerald-400" />;
      case 'cart_item_added':
        return <ShoppingCart className="w-4 h-4 text-amber-400" />;
      case 'installment_collected':
        return <CreditCard className="w-4 h-4 text-blue-400" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="View notifications"
        className={`relative p-2 rounded-xl transition cursor-pointer flex items-center justify-center ${
          isDayMode
            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
        }`}
        title="सूचना व ग्राहक अ‍ॅक्टिव्हिटी (Live Notifications)"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center animate-pulse shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl shadow-2xl border z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 ${
            isDayMode
              ? 'bg-white border-slate-200 text-slate-900'
              : 'bg-slate-900 border-slate-800 text-white'
          }`}
        >
          {/* Header */}
          <div
            className={`px-4 py-3 border-b flex items-center justify-between ${
              isDayMode ? 'bg-slate-50 border-slate-100' : 'bg-slate-950/80 border-slate-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs">सूचना व अ‍ॅक्टिव्हिटी (Activity)</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/10 text-rose-500 border border-rose-500/20">
                  {unreadCount} नवीन
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={() => NotificationService.markAllAsRead()}
                  className="p-1 text-slate-400 hover:text-emerald-500 rounded text-[11px] font-medium transition cursor-pointer flex items-center gap-0.5"
                  title="Mark all as read"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span className="text-[10px]">वाचले</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={() => NotificationService.clearAll()}
                  className="p-1 text-slate-400 hover:text-rose-400 rounded transition cursor-pointer"
                  title="Clear all notifications"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-200 rounded transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                <Bell className="w-6 h-6 mx-auto mb-2 opacity-30" />
                कोणतीही नवीन सूचना नाही (No recent activities)
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => NotificationService.markAsRead(item.id)}
                  className={`p-3.5 text-xs transition flex items-start gap-3 cursor-pointer ${
                    !item.isRead
                      ? isDayMode
                        ? 'bg-amber-50/60 hover:bg-amber-50'
                        : 'bg-slate-800/40 hover:bg-slate-800/70'
                      : isDayMode
                      ? 'hover:bg-slate-50'
                      : 'hover:bg-slate-800/30'
                  }`}
                >
                  <div
                    className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                      isDayMode ? 'bg-slate-100' : 'bg-slate-800'
                    }`}
                  >
                    {getIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4
                        className={`text-xs font-bold truncate ${
                          !item.isRead
                            ? 'text-slate-900 dark:text-white'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {item.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 shrink-0 font-medium flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {formatTimeAgo(item.timestamp)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                      {item.message}
                    </p>
                    {item.data?.amount && (
                      <div className="mt-1 flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          ₹{item.data.amount.toLocaleString('en-IN')}
                        </span>
                        {item.data.customerName && (
                          <span className="text-[10px] text-slate-400 truncate">
                            {item.data.customerName}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Action Button: Edit Order & Assign Model/Serial */}
                    {(item.type === 'order_completed' || item.type === 'cart_item_added' || item.data?.itemNames) && (
                      <div className="mt-2 pt-1.5 border-t border-slate-700/40 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            NotificationService.markAsRead(item.id);
                            if (onOpenOrderModal) {
                              onOpenOrderModal(item);
                            }
                            setIsOpen(false);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>ऑर्डर संपादन व मॉडेल/सिरीयल टाका</span>
                        </button>
                      </div>
                    )}
                  </div>
                  {!item.isRead && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
