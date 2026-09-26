import React, { useState, useEffect, useMemo } from 'react';
import { 
  Wallet, 
  ShieldCheck, 
  Sun, 
  Moon, 
  Menu, 
  Calculator, 
  LogOut, 
  ShoppingBag 
} from 'lucide-react';
import { StoreData, AdminUser } from '../types';
import { useTheme } from '../context/ThemeContext';
import { NotificationDropdown } from './common/NotificationDropdown';
import { AppNotification } from '../services/notificationService';
import { SaiLogo } from './common/SaiLogo';

interface NavbarProps {
  storeData: StoreData;
  activeUser: AdminUser;
  onSelectUser: (user: AdminUser) => void;
  onRefreshData: () => void;
  onOpenLiveStore: () => void;
  onOpenMobileApp: () => void;
  onOpenMasterSearch: () => void;
  onToggleMobileSidebar: () => void;
  onOpenFrontAddProduct?: () => void;
  onOpenMobileAgentHisab?: () => void;
  onOpenDataResetModal?: () => void;
  onOpenQuickHisab?: () => void;
  onOpenCustomerShowroom?: () => void;
  onLogout?: () => void;
  onOpenOrderModal?: (notification: AppNotification) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  storeData,
  activeUser,
  onSelectUser,
  onOpenLiveStore,
  onToggleMobileSidebar,
  onOpenQuickHisab,
  onLogout,
  onOpenOrderModal,
}) => {
  const { isDayMode, toggleTheme } = useTheme();

  // Compute Today's Cash Flow with useMemo to eliminate lag re-renders
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  
  const { netCashInDrawer } = useMemo(() => {
    const sales = storeData.transactions
      .filter(t => t.date.startsWith(todayStr) && (t.paymentMode === 'Cash' || t.paidAmount > 0))
      .reduce((acc, t) => acc + (t.paymentMode === 'Cash' ? t.paidAmount : 0), 0);

    const receipts = storeData.billReceipts
      .filter(r => r.date.startsWith(todayStr) && r.paymentMode === 'Cash')
      .reduce((acc, r) => acc + r.amountPaid, 0);

    const scheme = storeData.cardTransactions
      .filter(c => c.date.startsWith(todayStr) && c.paymentMode === 'Cash')
      .reduce((acc, c) => acc + c.amount, 0);

    const expenses = storeData.expenses
      .filter(e => e.date.startsWith(todayStr) && e.paymentMode === 'Cash')
      .reduce((acc, e) => acc + e.amount, 0);

    return {
      netCashInDrawer: sales + receipts + scheme - expenses
    };
  }, [storeData.transactions, storeData.billReceipts, storeData.cardTransactions, storeData.expenses, todayStr]);

  return (
    <header
      className={`sticky top-0 z-40 px-2.5 sm:px-6 py-1.5 sm:py-2.5 transition-colors duration-300 backdrop-blur-md ${
        isDayMode
          ? 'bg-white/90 border-b border-slate-200/90 text-slate-800 shadow-sm'
          : 'bg-[#050814]/95 border-b border-sky-500/20 text-slate-100 shadow-[0_4px_25px_rgba(0,0,0,0.6)]'
      }`}
    >
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        {/* Clear, Understandable Store Heading & Logo */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Mobile Hamburger Toggle */}
          <button
            onClick={onToggleMobileSidebar}
            className={`md:hidden p-2 rounded-xl transition cursor-pointer shrink-0 ${
              isDayMode
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                : 'bg-slate-900 border border-sky-500/30 text-sky-200 hover:border-sky-400'
            }`}
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Neat Vector Logo */}
          <div className="shrink-0">
            <SaiLogo size="md" glow={!isDayMode} />
          </div>

          {/* Clear, Uncluttered ERP Heading */}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className={`text-sm sm:text-base md:text-lg font-black tracking-wide truncate ${
                isDayMode ? 'text-slate-900' : 'text-white'
              }`}>
                श्री साई इंटरप्रायजेस
              </h1>
              <span className="hidden xl:inline text-xs font-bold text-teal-600 dark:text-teal-400 shrink-0">
                (Shri Sai Enterprises ERP)
              </span>
              <span className="hidden sm:inline-block text-[10px] font-bold uppercase bg-amber-500/15 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-md border border-amber-500/30 shrink-0">
                वर्धा शोरूम
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden lg:block truncate">
              इलेक्ट्रॉनिक्स • फर्निचर • ३०-महिने आठवडी बचत योजना (Complete Showroom ERP)
            </p>
          </div>
        </div>

        {/* Clean, Organized Header Controls */}
        <div className="flex items-center gap-1 sm:gap-2 justify-end shrink-0">
          {/* Day's Cash In Drawer (गल्ल्यातील रोख) */}
          <div className={`hidden sm:flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl text-xs border shrink-0 ${
            isDayMode
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
              : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
          }`}>
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Wallet className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </div>
            <div>
              <div className="text-[9px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider leading-none">
                रोख गल्ला
              </div>
              <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 leading-tight">
                ₹{netCashInDrawer >= 0 ? netCashInDrawer.toLocaleString('en-IN') : '0'}
              </div>
            </div>
          </div>

          {/* Quick Shortcuts Pill: Rapid Hisab & Agent (Cleanly Grouped) */}
          {onOpenQuickHisab && (
            <button
              onClick={onOpenQuickHisab}
              className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                isDayMode
                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 border-amber-500/30'
              }`}
              title="काउंटर जलद हिशोब (Rapid Counter Calculator)"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>हिशोब</span>
            </button>
          )}

          {/* Crystal-Clear Day / Night Mode Segmented Switcher */}
          <div
            id="theme-mode-switcher"
            className={`flex items-center p-0.5 sm:p-1 rounded-xl border shrink-0 transition-colors ${
              isDayMode
                ? 'bg-slate-200/80 border-slate-300'
                : 'bg-slate-900 border-slate-700'
            }`}
          >
            {/* Day Mode Tab */}
            <button
              type="button"
              id="btn-theme-day"
              onClick={() => {
                if (!isDayMode) toggleTheme();
              }}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer select-none ${
                isDayMode
                  ? 'bg-white text-amber-700 shadow-sm font-black ring-1 ring-amber-400/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
              title="दिवस मोड सुरू करा (Day Mode — Clear White Light Theme)"
            >
              <Sun className={`w-3.5 h-3.5 shrink-0 ${isDayMode ? 'text-amber-500 fill-amber-400' : 'text-slate-400'}`} />
              <span className="text-[11px] font-bold">दिवस</span>
            </button>

            {/* Night Mode Tab */}
            <button
              type="button"
              id="btn-theme-night"
              onClick={() => {
                if (isDayMode) toggleTheme();
              }}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer select-none ${
                !isDayMode
                  ? 'bg-slate-800 text-sky-200 shadow-sm font-black ring-1 ring-sky-400/50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/60'
              }`}
              title="रात्र मोड सुरू करा (Night Mode — Dark Clear Obsidian Theme)"
            >
              <Moon className={`w-3.5 h-3.5 shrink-0 ${!isDayMode ? 'text-sky-300 fill-sky-400/30' : 'text-slate-500'}`} />
              <span className="text-[11px] font-bold">रात्र</span>
            </button>
          </div>

          {/* Real-time Order & Cart Notifications Bell */}
          <NotificationDropdown onOpenOrderModal={onOpenOrderModal} />

          {/* Single Live Showroom / Store Switcher */}
          <button
            onClick={onOpenLiveStore}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm cursor-pointer transition active:scale-95"
            title="ग्राहक शोरूम व लँडिंग पेज पहा (Customer Showroom)"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ग्राहक दुकान</span>
            <span className="sm:hidden">दुकान</span>
          </button>

          {/* User Account Switcher */}
          <div className={`flex items-center gap-1 border rounded-xl p-1 shrink-0 ${
            isDayMode
              ? 'bg-slate-100 border-slate-200 text-slate-700'
              : 'bg-slate-800 border-slate-700 text-slate-200'
          }`}>
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 ml-1 shrink-0" />
            <select
              id="select-active-user"
              value={activeUser.id}
              onChange={(e) => {
                const found = storeData.adminUsers.find(u => u.id === e.target.value);
                if (found) onSelectUser(found);
              }}
              aria-label="Select active user role"
              className="bg-transparent text-xs font-medium focus:outline-none pr-1 py-0.5 cursor-pointer max-w-[70px] sm:max-w-[110px] md:max-w-none truncate"
            >
              {storeData.adminUsers.map(u => (
                <option key={u.id} value={u.id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                  {u.displayName} ({u.role})
                </option>
              ))}
            </select>
          </div>

          {/* Logout / Lock to Public Landing Page */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-rose-600/15 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-500/30 transition cursor-pointer active:scale-95 shrink-0"
              title="लॉगआउट करा आणि लँडिंग पेजवर जा (Logout)"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">लॉगआउट</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
