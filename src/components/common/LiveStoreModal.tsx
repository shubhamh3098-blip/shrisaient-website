import React, { useState } from 'react';
import {
  X,
  Store,
  ExternalLink,
  Search,
  ShoppingCart,
  Sparkles,
  Phone,
  CheckCircle2,
  Share2
} from 'lucide-react';
import { StoreData } from '../../types';

interface LiveStoreModalProps {
  storeData: StoreData;
  onClose: () => void;
}

export const LiveStoreModal: React.FC<LiveStoreModalProps> = ({ storeData, onClose }) => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [search, setSearch] = useState<string>('');

  const categories = ['All', 'Electronics', 'Furniture', 'Home Appliances', 'Kitchen Appliances'];

  const filteredStock = storeData.stock.filter((item) => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch =
      !search ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.brand.toLowerCase().includes(search.toLowerCase()) ||
      (item.model && item.model.toLowerCase().includes(search.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleShareStore = () => {
    const url = window.location.origin;
    if (navigator.share) {
      navigator.share({
        title: storeData.settings.storeName,
        text: 'श्री साई एंटरप्रायझेस, वर्धा - इलेक्ट्रॉनिक्स आणि फर्निचर शोरूम',
        url: url,
      });
    } else {
      navigator.clipboard.writeText(url);
      alert('स्टोअर लिंक कॉपी झाली: ' + url);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 md:p-5 bg-gradient-to-r from-amber-600 to-orange-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center font-bold text-xl">
              🏪
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold">{storeData.settings.storeName}</h2>
                <span className="text-[10px] uppercase font-bold bg-white text-orange-700 px-2 py-0.5 rounded-full">
                  Live Customer Storefront
                </span>
              </div>
              <p className="text-xs text-orange-100 mt-0.5">
                {storeData.settings.tagline} • Wardha
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShareStore}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-semibold text-white transition cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>शेअर लिंक</span>
            </button>
            <button onClick={onClose} className="text-white hover:text-orange-200 p-1">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500"
            />
          </div>
        </div>

        {/* Product Catalog Grid */}
        <div className="p-4 md:p-6 overflow-y-auto flex-1 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStock.map((item) => (
              <div
                key={item.id}
                className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-4 flex flex-col justify-between transition group"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-400">
                      {item.category}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      SKU: {item.code}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition">
                    {item.name}
                  </h3>
                  <div className="text-xs text-slate-400 mt-1">
                    Brand: <span className="text-slate-300 font-medium">{item.brand}</span>
                    {item.model && <span> • Model: {item.model}</span>}
                  </div>
                  {item.warrantyMonths && (
                    <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>{item.warrantyMonths} Months Warranty Included</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 mt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-500 line-through">
                      MRP: ₹{item.mrp.toLocaleString('en-IN')}
                    </div>
                    <div className="text-base font-extrabold text-white">
                      ₹{item.salePrice.toLocaleString('en-IN')}
                    </div>
                  </div>

                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Stock: Available
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            📍 {storeData.settings.address}, {storeData.settings.city} • 📞 {storeData.settings.phone}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg"
          >
            बंद करा
          </button>
        </div>
      </div>
    </div>
  );
};
