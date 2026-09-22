import React from 'react';
import {
  Star,
  Truck,
  CheckCircle2,
  MessageCircle,
  Plus,
  Edit3,
  ShieldCheck,
  CreditCard
} from 'lucide-react';
import { StockItem } from '../types';
import { getRealProductImage } from '../utils/productImages';

interface AmazonProductCardProps {
  item: StockItem;
  onAddToCart: (item: StockItem) => void;
  isAdminMode?: boolean;
  onEditItem?: (item: StockItem) => void;
  shopPhone?: string;
}

export const AmazonProductCard: React.FC<AmazonProductCardProps> = ({
  item,
  onAddToCart,
  isAdminMode = false,
  onEditItem,
  shopPhone = '8766486915',
}) => {
  const realImg = getRealProductImage(item.name, item.category, item.imageUrl);
  const mrp = Math.round(item.sellingPrice * 1.32);
  const discountPercent = Math.round(((mrp - item.sellingPrice) / mrp) * 100);
  const emiMonth = Math.round(item.sellingPrice / 24);

  // Deterministic ratings based on code length
  const ratingCount = 50 + ((item.code.charCodeAt(item.code.length - 1) || 5) * 8);

  // Badge logic
  const isBestSeller = item.sellingPrice > 10000 && item.sellingPrice < 30000;
  const isSaiChoice = item.quantity > 5;

  return (
    <div className="bg-white dark:bg-[#1e293b] rounded-[4px] border border-slate-200 dark:border-slate-700 p-3 sm:p-4 flex flex-col justify-between hover:shadow-lg transition-all duration-200 group relative">
      <div>
        {/* Product Image Area with Badges */}
        <div className="relative w-full h-48 sm:h-52 bg-white dark:bg-[#0f172a] rounded overflow-hidden p-2 flex items-center justify-center border border-slate-100 dark:border-slate-800">
          <img
            src={realImg}
            alt={item.name}
            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />

          {/* Amazon Best Seller Badge */}
          {isBestSeller ? (
            <div className="absolute top-2 left-0 bg-[#e67a00] text-white text-[10px] font-bold px-2 py-0.5 rounded-r shadow-xs">
              #1 Best Seller
            </div>
          ) : isSaiChoice ? (
            <div className="absolute top-2 left-0 bg-[#232f3e] text-white text-[10px] font-bold px-2 py-0.5 rounded-r shadow-xs flex items-center gap-1">
              <span className="text-[#febd69]">Sai's</span>
              <span>Choice</span>
            </div>
          ) : null}

          {/* Admin Edit Button */}
          {isAdminMode && onEditItem && (
            <button
              onClick={() => onEditItem(item)}
              className="absolute top-2 right-2 px-2 py-1 rounded bg-slate-900/90 hover:bg-slate-900 text-amber-300 text-[10px] font-bold backdrop-blur-xs flex items-center gap-1 shadow-md cursor-pointer z-10"
              title="किंमत व फोटो बदला"
            >
              <Edit3 className="w-3 h-3 text-amber-400" />
              <span>बदला</span>
            </button>
          )}
        </div>

        {/* Product Details */}
        <div className="mt-3 space-y-1.5">
          {/* Category & Code */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span className="truncate">{item.category}</span>
            <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
              {item.code}
            </span>
          </div>

          {/* Product Title */}
          <h3 className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm line-clamp-2 leading-snug group-hover:text-[#007185] dark:group-hover:text-cyan-400 transition">
            {item.name}
          </h3>

          {/* Ratings */}
          <div className="flex items-center gap-1 text-xs">
            <div className="flex items-center text-amber-500">
              <Star className="w-3.5 h-3.5 fill-amber-500" />
              <Star className="w-3.5 h-3.5 fill-amber-500" />
              <Star className="w-3.5 h-3.5 fill-amber-500" />
              <Star className="w-3.5 h-3.5 fill-amber-500" />
              <Star className="w-3.5 h-3.5 fill-amber-500" />
            </div>
            <span className="text-slate-600 dark:text-slate-400 font-mono text-[11px]">
              4.8 ({ratingCount})
            </span>
          </div>

          {/* Deal & Discount Pill */}
          <div className="flex items-center gap-2 pt-0.5">
            <span className="bg-[#cc0c39] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
              {discountPercent}% off
            </span>
            <span className="text-[10px] font-bold text-[#cc0c39] uppercase tracking-tight">
              Limited time deal
            </span>
          </div>

          {/* Amazon Price Box */}
          <div className="pt-0.5">
            <div className="flex items-baseline gap-2">
              <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-mono">
                ₹{item.sellingPrice.toLocaleString()}
              </span>
              <span className="text-xs text-slate-500 line-through">
                M.R.P.: ₹{mrp.toLocaleString()}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              बचत कार्ड: किमान ५०% डाऊन पेमेंट + ₹{emiMonth.toLocaleString()}/महिना
            </p>
          </div>

          {/* Sai Assured & Free Delivery in Wardha Badge (No Prime) */}
          <div className="flex items-center gap-1.5 text-xs text-[#007185] dark:text-cyan-400 font-bold pt-0.5 flex-wrap">
            <span className="text-emerald-700 dark:text-emerald-400 font-black flex items-center gap-1 text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>✓ साई ॲश्युअर्ड</span>
            </span>
            <span className="text-slate-500 dark:text-slate-400 font-normal text-[11px]">
              वर्ध्यात मोफत घरपोच डिलिव्हरी
            </span>
          </div>

          {/* Stock info */}
          <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>In stock ({item.quantity} {item.unit} in Wardha)</span>
          </p>
        </div>
      </div>

      {/* Buttons */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
        {isAdminMode && onEditItem && (
          <button
            onClick={() => onEditItem(item)}
            className="w-full py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-amber-600" />
            <span>किंमत/फोटो बदला</span>
          </button>
        )}

        {/* Amazon Yellow "Add to Cart" Button */}
        <button
          onClick={() => onAddToCart(item)}
          className="w-full py-2 bg-[#ffd814] hover:bg-[#f7ca00] active:bg-[#f0b800] text-slate-950 font-medium text-xs sm:text-sm rounded-full transition shadow-2xs border border-[#fcd200] flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add to Cart</span>
        </button>

        {/* WhatsApp Inquiry Button */}
        <a
          href={`https://wa.me/91${shopPhone}?text=${encodeURIComponent(
            `नमस्ते Shri Sai Enterprises,\nमुझे यह प्रोडक्ट खरीदना / जानकारी चाहिए:\n*${item.name}*\nकिंमत: ₹${item.sellingPrice.toLocaleString()}\nकृपया उपलब्धता और डिलीवरी बताएं।`
          )}`}
          target="_blank"
          rel="noreferrer"
          className="w-full py-1.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-xs font-semibold rounded-full transition flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <MessageCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>WhatsApp Inquiry</span>
        </a>
      </div>
    </div>
  );
};
