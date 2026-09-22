import React from 'react';
import {
  Sparkles,
  Star,
  ShoppingCart,
  MessageCircle,
  Truck,
  CheckCircle2,
  ChevronRight,
  Plus
} from 'lucide-react';
import { StockItem } from '../types';
import { getRealProductImage } from '../utils/productImages';

interface AmazonDealsCarouselProps {
  items: StockItem[];
  onAddToCart: (item: StockItem) => void;
  onOpenItemModal?: (item: StockItem) => void;
  shopPhone?: string;
}

export const AmazonDealsCarousel: React.FC<AmazonDealsCarouselProps> = ({
  items,
  onAddToCart,
  shopPhone = '8766486915',
}) => {
  if (!items || items.length === 0) return null;

  // Take top deals
  const dealItems = items.slice(0, 8);

  return (
    <section id="todays-deals" className="max-w-7xl mx-auto px-3 sm:px-6 py-6 select-none">
      <div className="bg-white dark:bg-[#1e293b] p-4 sm:p-5 rounded-[4px] shadow-sm border border-slate-200 dark:border-slate-700">
        {/* Deals Header */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Today's Deals</span>
              <span className="text-xs px-2 py-0.5 rounded bg-[#cc0c39] text-white font-bold tracking-tight uppercase">
                Up to 35% off
              </span>
            </h2>
            <span className="text-xs text-[#007185] dark:text-cyan-400 hover:underline cursor-pointer hidden md:inline">
              Wardha Showroom Exclusives
            </span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Same-day free home delivery on orders above ₹3,000
          </span>
        </div>

        {/* Horizontal Scrolling Products Row */}
        <div className="flex items-stretch gap-4 overflow-x-auto pt-4 pb-2 scrollbar-thin">
          {dealItems.map((item, idx) => {
            const realImg = getRealProductImage(item.name, item.category, item.imageUrl);
            const mrp = Math.round(item.sellingPrice * 1.3);
            const discountPercent = Math.round(((mrp - item.sellingPrice) / mrp) * 100);

            return (
              <div
                key={item.id || idx}
                className="w-56 sm:w-64 shrink-0 bg-slate-50 dark:bg-slate-800/60 p-3 rounded border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between hover:shadow-md transition group"
              >
                <div>
                  {/* Photo with discount pill */}
                  <div className="relative h-44 w-full bg-white dark:bg-slate-900 rounded overflow-hidden p-2 flex items-center justify-center">
                    <img
                      src={realImg}
                      alt={item.name}
                      className="max-h-full max-w-full object-contain group-hover:scale-105 transition duration-300"
                      loading="lazy"
                    />
                    <span className="absolute top-2 left-2 bg-[#cc0c39] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                      {discountPercent}% off
                    </span>
                    <span className="absolute top-2 right-2 text-[10px] font-bold bg-[#febd69] text-slate-950 px-1 rounded">
                      Deal
                    </span>
                  </div>

                  {/* Pricing info */}
                  <div className="mt-3 space-y-1">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-mono">
                        ₹{item.sellingPrice.toLocaleString()}
                      </span>
                      <span className="text-[11px] text-slate-400 line-through">
                        ₹{mrp.toLocaleString()}
                      </span>
                    </div>

                    <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-2 leading-snug group-hover:text-blue-600 transition">
                      {item.name}
                    </h3>

                    {/* Ratings */}
                    <div className="flex items-center gap-1 text-[11px]">
                      <div className="flex items-center text-amber-500">
                        <Star className="w-3 h-3 fill-amber-500" />
                        <Star className="w-3 h-3 fill-amber-500" />
                        <Star className="w-3 h-3 fill-amber-500" />
                        <Star className="w-3 h-3 fill-amber-500" />
                        <Star className="w-3 h-3 fill-amber-500" />
                      </div>
                      <span className="text-slate-500 font-mono text-[10px] font-medium">4.8 (80+)</span>
                    </div>

                    <div className="flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">
                      <Truck className="w-3 h-3" />
                      <span>FREE Delivery tomorrow</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1.5">
                  <button
                    onClick={() => onAddToCart(item)}
                    className="w-full py-1.5 bg-[#ffd814] hover:bg-[#f7ca00] active:bg-[#e29334] text-slate-950 font-medium text-xs rounded-full flex items-center justify-center gap-1 transition shadow-2xs border border-[#fcd200] cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add to Cart</span>
                  </button>

                  <a
                    href={`https://wa.me/91${shopPhone}?text=${encodeURIComponent(
                      `नमस्ते Shri Sai Enterprises,\nमुझे यह प्रोडक्ट खरीदना है:\n*${item.name}*\nकिंमत: ₹${item.sellingPrice.toLocaleString()}\nकृपया उपलब्धता बताएं।`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 font-medium text-[11px] rounded-full flex items-center justify-center gap-1 transition cursor-pointer"
                  >
                    <MessageCircle className="w-3 h-3 text-emerald-600" />
                    <span>WhatsApp Inquiry</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
