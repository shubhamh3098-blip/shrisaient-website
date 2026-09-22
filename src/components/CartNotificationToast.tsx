import React, { useEffect, useState } from 'react';
import { ShoppingCart, CheckCircle2, X, Plus, Minus, Zap, Edit3, Trash2 } from 'lucide-react';
import { StockItem } from '../types';

export interface CartNotificationItem {
  item: StockItem;
  quantity: number;
  timestamp: number;
}

interface CartNotificationToastProps {
  notification: CartNotificationItem | null;
  cartCount: number;
  cartTotal: number;
  currentQuantity?: number;
  onClose: () => void;
  onOpenCart: () => void;
  onOpenBajajFinance: () => void;
  onUpdateQuantity?: (itemId: string, delta: number) => void;
  onRemoveItem?: (itemId: string) => void;
}

export const CartNotificationToast: React.FC<CartNotificationToastProps> = ({
  notification,
  cartCount,
  cartTotal,
  currentQuantity,
  onClose,
  onOpenCart,
  onOpenBajajFinance,
  onUpdateQuantity,
  onRemoveItem,
}) => {
  const [isInteracting, setIsInteracting] = useState(false);

  useEffect(() => {
    if (!notification || isInteracting) return;
    const timer = setTimeout(() => {
      onClose();
    }, 6000);
    return () => clearTimeout(timer);
  }, [notification, isInteracting, onClose]);

  if (!notification) return null;

  const { item } = notification;
  const displayQty = currentQuantity !== undefined ? currentQuantity : notification.quantity;

  const handleDecrease = () => {
    setIsInteracting(true);
    if (displayQty <= 1) {
      if (onRemoveItem) {
        onRemoveItem(item.id);
      } else if (onUpdateQuantity) {
        onUpdateQuantity(item.id, -1);
      }
      onClose();
    } else if (onUpdateQuantity) {
      onUpdateQuantity(item.id, -1);
    }
  };

  const handleIncrease = () => {
    setIsInteracting(true);
    if (onUpdateQuantity) {
      onUpdateQuantity(item.id, 1);
    }
  };

  return (
    <div
      onMouseEnter={() => setIsInteracting(true)}
      onMouseLeave={() => setIsInteracting(false)}
      className="fixed top-4 right-3 sm:right-6 z-50 max-w-md w-[calc(100vw-1.5rem)] sm:w-96 animate-fade-in-down no-print"
    >
      <div className="bg-white dark:bg-[#1E293B] text-slate-900 dark:text-slate-100 rounded-2xl shadow-2xl border-2 border-emerald-500/80 dark:border-emerald-500/60 p-3.5 sm:p-4 relative backdrop-blur-md overflow-hidden">
        {/* Top Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-amber-400 to-blue-600" />

        {/* Header with Title & Dismiss */}
        <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>कार्टमध्ये जोडले गेले! (Added to Cart)</span>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition cursor-pointer"
            title="बंद करा"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Item Details Preview with Live Quantity Editor */}
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <ShoppingCart className="w-6 h-6 text-slate-400" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm line-clamp-1">
              {item.name}
            </h4>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs font-black text-slate-900 dark:text-white font-mono">
                ₹{item.sellingPrice.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                एकूण: ₹{(item.sellingPrice * displayQty).toLocaleString()}
              </span>
            </div>

            {/* Direct Quantity Modifier inside the Notification */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                संख्या (Qty):
              </span>
              <div className="flex items-center border border-slate-300 dark:border-slate-700 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={handleDecrease}
                  className="px-2 py-1 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer active:scale-95"
                  title={displayQty <= 1 ? 'कार्टमधून हटवा' : 'संख्या कमी करा'}
                >
                  {displayQty <= 1 ? (
                    <Trash2 className="w-3 h-3 text-red-500" />
                  ) : (
                    <Minus className="w-3 h-3" />
                  )}
                </button>
                <span className="px-2.5 py-0.5 font-bold text-xs font-mono text-slate-900 dark:text-white min-w-[1.5rem] text-center">
                  {displayQty}
                </span>
                <button
                  type="button"
                  onClick={handleIncrease}
                  className="px-2 py-1 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer active:scale-95"
                  title="संख्या वाढवा"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCart();
                }}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer ml-auto"
                title="कार्टमध्ये तपशील संपादित करा"
              >
                <Edit3 className="w-3 h-3" />
                <span>संपादित करा</span>
              </button>
            </div>
          </div>
        </div>

        {/* Cart Subtotal Summary */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-medium">
            कार्ट एकूण ({cartCount} {cartCount === 1 ? 'वस्तू' : 'वस्तू'}):
          </span>
          <span className="font-black text-slate-900 dark:text-amber-400 font-mono text-sm">
            ₹{cartTotal.toLocaleString()}
          </span>
        </div>

        {/* Quick Action Buttons */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              onClose();
              onOpenCart();
            }}
            className="w-full py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>कार्ट उघडा ({cartCount})</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenBajajFinance();
            }}
            className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
            title="बजाज फायनान्सने खरेदी करा"
          >
            <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
            <span>बजाज ०% EMI</span>
          </button>
        </div>
      </div>
    </div>
  );
};
