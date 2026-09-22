import React, { useState } from 'react';
import {
  Search,
  MapPin,
  ShoppingCart,
  Menu,
  ChevronDown,
  User,
  ShieldCheck,
  Zap,
  Lock,
  ArrowRight,
  Phone,
  Sparkles,
  X
} from 'lucide-react';
import { DayNightToggle } from './DayNightToggle';

interface AmazonHeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSearchSubmit: (e?: React.FormEvent) => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  categories: string[];
  cartCount: number;
  onOpenCart: () => void;
  isAdminLoggedIn: boolean;
  onGoToAdminDashboard?: () => void;
  onOpenLoginModal: () => void;
  onScrollToPassbook: () => void;
  onScrollToSchemes: () => void;
  onScrollToProducts: () => void;
  onScrollToDeals?: () => void;
}

export const AmazonHeader: React.FC<AmazonHeaderProps> = ({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  selectedCategory,
  onSelectCategory,
  categories,
  cartCount,
  onOpenCart,
  isAdminLoggedIn,
  onGoToAdminDashboard,
  onOpenLoginModal,
  onScrollToPassbook,
  onScrollToSchemes,
  onScrollToProducts,
  onScrollToDeals,
}) => {
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const displayCategoryLabel =
    selectedCategory === 'all'
      ? 'All'
      : selectedCategory.length > 12
      ? selectedCategory.slice(0, 10) + '..'
      : selectedCategory;

  return (
    <header className="sticky top-0 z-50 no-print font-sans select-none shadow-md">
      {/* 1. AMAZON MAIN NAV BAR (#131921) */}
      <div className="bg-[#131921] text-white px-3 sm:px-4 py-2 sm:py-2.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
          
          {/* Top Row on Mobile: Brand Logo on Left, Action Icons on Right */}
          <div className="flex items-center justify-between w-full sm:w-auto">
            {/* Brand Logo */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="flex items-center gap-1.5 text-left p-1 rounded-xs hover:outline hover:outline-1 hover:outline-white cursor-pointer transition"
                title="Shri Sai Enterprises - Electronics & Furniture"
              >
                <div className="flex flex-col">
                  <div className="flex items-baseline leading-none">
                    <span className="text-xl sm:text-2xl font-black tracking-tight text-white font-display uppercase">
                      Shri Sai
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-[#febd69] ml-1">
                      .in
                    </span>
                  </div>
                  <div className="text-[9px] sm:text-[10px] font-bold text-amber-400 tracking-wider uppercase">
                    Electronics & Furniture
                  </div>
                </div>
              </button>

              {/* Location Delivery Selector (Desktop only) */}
              <div
                onClick={onScrollToProducts}
                className="hidden lg:flex items-center gap-1.5 p-1.5 rounded-xs hover:outline hover:outline-1 hover:outline-white cursor-pointer"
                title="Free Home Delivery in Wardha City & 50km radius"
              >
                <MapPin className="w-4 h-4 text-[#febd69] shrink-0" />
                <div className="text-left leading-tight text-xs">
                  <span className="text-slate-400 text-[10px] block">Deliver to</span>
                  <span className="font-bold text-white block">Wardha 442001</span>
                </div>
              </div>
            </div>

            {/* Mobile Actions: ERP Link + Cart + Day/Night Toggle (Visible only on mobile top row) */}
            <div className="flex items-center gap-2 sm:hidden">
              {isAdminLoggedIn ? (
                <button
                  type="button"
                  onClick={onGoToAdminDashboard}
                  className="px-2 py-1 rounded bg-[#febd69] text-slate-950 font-bold text-[11px] flex items-center gap-1 shadow-xs cursor-pointer active:scale-95"
                  title="Admin ERP Billing Dashboard"
                >
                  <span>ERP</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onOpenLoginModal}
                  className="px-2 py-1 rounded border border-slate-600 bg-slate-800 text-slate-200 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                  title="Staff & Admin Login"
                >
                  <Lock className="w-3 h-3 text-amber-400" />
                  <span>Login</span>
                </button>
              )}

              {/* Mobile Shopping Cart */}
              <button
                type="button"
                onClick={onOpenCart}
                className="flex items-center gap-0.5 p-1 rounded-xs hover:outline hover:outline-1 hover:outline-white cursor-pointer relative"
                title="Shopping Cart"
              >
                <div className="relative">
                  <ShoppingCart className="w-6 h-6 text-white" />
                  <span className="absolute -top-1.5 -right-1 font-black bg-[#febd69] text-slate-950 text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-mono">
                    {cartCount}
                  </span>
                </div>
              </button>

              {/* Day / Night Toggle for Mobile */}
              <DayNightToggle size="sm" showLabel={false} />
            </div>
          </div>

          {/* Search Bar: Full-Width on Mobile, Center-Expanded on Desktop */}
          <div className="w-full sm:flex-1 sm:max-w-2xl sm:mx-2">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onSearchSubmit(e);
              }}
              className="flex items-center h-10 rounded-[4px] overflow-hidden focus-within:ring-2 focus-within:ring-[#febd69] shadow-sm bg-white"
            >
              {/* Category selector button on Desktop */}
              <div className="relative hidden md:block">
                <button
                  type="button"
                  onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                  className="h-10 px-3 bg-[#e6e6e6] hover:bg-[#d4d4d4] text-slate-800 text-xs font-normal flex items-center gap-1 border-r border-slate-300 cursor-pointer whitespace-nowrap"
                >
                  <span>{displayCategoryLabel}</span>
                  <ChevronDown className="w-3 h-3 text-slate-600" />
                </button>

                {/* Dropdown Menu */}
                {isCategoryDropdownOpen && (
                  <div className="absolute left-0 top-full mt-1 w-48 bg-white text-slate-900 rounded-sm shadow-xl border border-slate-200 py-1 z-50 max-h-60 overflow-y-auto">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          onSelectCategory(cat);
                          setIsCategoryDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs hover:bg-slate-100 cursor-pointer ${
                          selectedCategory === cat ? 'font-bold bg-amber-50 text-amber-900' : ''
                        }`}
                      >
                        {cat === 'all' ? 'All Categories' : cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Input field */}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search TV, Fridge, Cooler, Sofa, Bed, Passbook #..."
                className="flex-1 px-3 text-xs sm:text-sm text-slate-900 outline-none placeholder:text-slate-400 font-sans"
              />

              {/* Clear Button */}
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Search Submit Button */}
              <button
                type="submit"
                className="h-10 px-4 sm:px-5 bg-[#febd69] hover:bg-[#f3a847] active:bg-[#e29334] text-slate-900 flex items-center justify-center transition cursor-pointer shrink-0"
                title="Search Products & Passbooks"
              >
                <Search className="w-4 h-4 sm:w-5 sm:h-5 text-slate-900" />
              </button>
            </form>
          </div>

          {/* Desktop Right Action Icons */}
          <div className="hidden sm:flex items-center gap-3 shrink-0">
            {/* Account / Staff / Admin */}
            {isAdminLoggedIn ? (
              <button
                type="button"
                onClick={onGoToAdminDashboard}
                className="p-1 sm:p-1.5 rounded-xs hover:outline hover:outline-1 hover:outline-white text-left cursor-pointer transition"
                title="Go to Admin Billing ERP"
              >
                <span className="text-[10px] text-slate-300 block leading-tight">Admin,</span>
                <div className="flex items-center gap-1 font-bold text-xs text-[#febd69]">
                  <span>ERP Billing</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenLoginModal}
                className="p-1 sm:p-1.5 rounded-xs hover:outline hover:outline-1 hover:outline-white text-left cursor-pointer transition"
                title="Staff Counter & Admin Login"
              >
                <span className="text-[10px] text-slate-300 block leading-tight">Staff / Admin</span>
                <div className="flex items-center gap-0.5 font-bold text-xs text-white">
                  <span>Login Portal</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </div>
              </button>
            )}

            {/* "Returns & Passbook" Link */}
            <button
              type="button"
              onClick={onScrollToPassbook}
              className="p-1 sm:p-1.5 rounded-xs hover:outline hover:outline-1 hover:outline-white text-left cursor-pointer hidden md:block transition"
              title="30-Month Savings Scheme Passbook Lookup"
            >
              <span className="text-[10px] text-slate-300 block leading-tight">Customer</span>
              <span className="font-bold text-xs text-white block">30M Passbook</span>
            </button>

            {/* Shopping Cart Button */}
            <button
              type="button"
              onClick={onOpenCart}
              className="flex items-center gap-1.5 p-1.5 rounded-xs hover:outline hover:outline-1 hover:outline-white cursor-pointer relative transition"
              title="Shopping Cart"
            >
              <div className="relative">
                <ShoppingCart className="w-7 h-7 text-white" />
                <span className="absolute -top-1 left-3.5 font-black text-[#febd69] text-xs font-mono">
                  {cartCount}
                </span>
              </div>
              <span className="font-bold text-xs text-white self-end mb-1">
                Cart
              </span>
            </button>

            {/* Day / Night toggle */}
            <DayNightToggle size="sm" showLabel={false} />
          </div>
        </div>
      </div>

      {/* 2. SUB-NAV BAR (#232f3e) WITH HORIZONTAL SCROLL CHIPS */}
      <div className="bg-[#232f3e] text-white text-xs px-3 sm:px-4 py-1.5 flex items-center justify-between overflow-x-auto scrollbar-none gap-2 sm:gap-4 border-t border-slate-800">
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* All Categories Button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-slate-800/80 hover:bg-slate-700 text-white font-bold cursor-pointer whitespace-nowrap transition"
          >
            <Menu className="w-3.5 h-3.5" />
            <span>All Categories</span>
          </button>

          {onScrollToDeals && (
            <button
              type="button"
              onClick={onScrollToDeals}
              className="px-2 py-1 rounded-sm hover:bg-white/10 text-amber-300 hover:text-amber-200 cursor-pointer whitespace-nowrap font-bold transition"
            >
              🔥 Today's Deals
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              onSelectCategory('Electronics');
              onScrollToProducts();
            }}
            className={`px-2 py-1 rounded-sm hover:bg-white/10 cursor-pointer whitespace-nowrap transition ${
              selectedCategory === 'Electronics' || selectedCategory === 'Home Appliances'
                ? 'font-bold text-[#febd69]'
                : 'text-slate-200'
            }`}
          >
            Smart TVs & Appliances
          </button>

          <button
            type="button"
            onClick={() => {
              onSelectCategory('Furniture');
              onScrollToProducts();
            }}
            className={`px-2 py-1 rounded-sm hover:bg-white/10 cursor-pointer whitespace-nowrap transition ${
              selectedCategory === 'Furniture' ? 'font-bold text-[#febd69]' : 'text-slate-200'
            }`}
          >
            Teak Furniture & Beds
          </button>

          <button
            type="button"
            onClick={onScrollToSchemes}
            className="px-2 py-1 rounded-sm hover:bg-white/10 text-emerald-400 font-bold cursor-pointer whitespace-nowrap transition"
          >
            30-Month Weekly Scheme
          </button>

          <button
            type="button"
            onClick={onScrollToPassbook}
            className="px-2 py-1 rounded-sm hover:bg-white/10 text-cyan-300 font-semibold cursor-pointer whitespace-nowrap transition"
          >
            Check Passbook
          </button>

          <a
            href="tel:8766486915"
            className="hidden xl:flex items-center gap-1 px-2 py-1 rounded-sm hover:bg-white/10 text-slate-300 cursor-pointer whitespace-nowrap"
          >
            <Phone className="w-3 h-3 text-[#febd69]" />
            <span>Wardha: 8766486915</span>
          </a>
        </div>

        {/* Delivery Guarantee Note */}
        <div className="hidden lg:flex items-center gap-2 text-[11px] text-slate-300 shrink-0 font-mono">
          <span className="text-amber-300 font-semibold">Free Home Delivery in Wardha</span>
          <span>•</span>
          <span>GST: 27ALOPL0030G2ZC</span>
        </div>
      </div>

      {/* Mobile Drawer if All Categories clicked */}
      {isMobileMenuOpen && (
        <div className="bg-[#1e293b] text-white p-4 border-b border-slate-700 space-y-3 sm:hidden shadow-xl animate-in slide-in-from-top duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-slate-700 font-bold text-sm text-[#febd69]">
            <span>Shop By Department</span>
            <button onClick={() => setIsMobileMenuOpen(false)} className="p-1 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  onSelectCategory(cat);
                  setIsMobileMenuOpen(false);
                  onScrollToProducts();
                }}
                className={`text-left p-2 rounded-md transition ${
                  selectedCategory === cat ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-800 text-slate-200'
                }`}
              >
                {cat === 'all' ? 'All Products' : cat}
              </button>
            ))}
          </div>
          <div className="pt-2 border-t border-slate-700 flex flex-col gap-2">
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onScrollToPassbook();
              }}
              className="w-full text-left py-2 px-3 rounded-md bg-blue-900/60 text-blue-200 font-semibold text-xs flex items-center justify-between"
            >
              <span>Digital Passbook Lookup</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onScrollToSchemes();
              }}
              className="w-full text-left py-2 px-3 rounded-md bg-amber-500/20 text-amber-300 font-semibold text-xs flex items-center justify-between"
            >
              <span>30-Month Weekly Scheme</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
