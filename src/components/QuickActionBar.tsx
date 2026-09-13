import React from 'react';
import {
  Coins,
  CreditCard,
  BookOpen,
  FilePlus,
  Receipt,
  Sparkles,
  Search,
  Users
} from 'lucide-react';

interface QuickActionBarProps {
  onWeeklyCollection: () => void;
  onNewCard: () => void;
  onCustomerLedger: () => void;
  onNewBill: () => void;
  onReceivePavti: () => void;
  onMasterSearch?: () => void;
}

export const QuickActionBar: React.FC<QuickActionBarProps> = ({
  onWeeklyCollection,
  onNewCard,
  onCustomerLedger,
  onNewBill,
  onReceivePavti,
  onMasterSearch,
}) => {
  return (
    <div className="w-full bg-[var(--tactile-surface-raised)] border-b border-[var(--tactile-border)] py-2.5 px-3 sm:px-6 shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        {/* Shortcut Section Label */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xs font-black uppercase tracking-wider text-[var(--tactile-text-heading)]">
              Quick Actions
            </span>
            <span className="text-[10px] text-[var(--tactile-text-dim)] font-medium">
              (जलद शॉर्टकट मेनू)
            </span>
          </div>
        </div>

        {/* The Quick Action Buttons with English Primary + Small Marathi Subtext */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 w-full md:w-auto">
          {/* 1. Weekly Collection */}
          <button
            id="quick-btn-weekly-collection"
            type="button"
            onClick={onWeeklyCollection}
            className="group relative flex items-center gap-2.5 px-3 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 active:scale-95 transition-all text-emerald-800 dark:text-emerald-200 cursor-pointer shadow-xs text-left"
            title="Open Weekly Card Installment Collection"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
              <Coins className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col min-w-0 leading-tight">
              <span className="text-xs font-black text-emerald-950 dark:text-emerald-100 truncate">
                Weekly Collection
              </span>
              <span className="text-[9px] text-emerald-700 dark:text-emerald-300 font-semibold truncate">
                हप्ते जमा करा
              </span>
            </div>
          </button>

          {/* 2. New Card */}
          <button
            id="quick-btn-new-card"
            type="button"
            onClick={onNewCard}
            className="group relative flex items-center gap-2.5 px-3 py-2 rounded-xl border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 active:scale-95 transition-all text-blue-800 dark:text-blue-200 cursor-pointer shadow-xs text-left"
            title="Create New EMI Scheme Card Member"
          >
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
              <CreditCard className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col min-w-0 leading-tight">
              <span className="text-xs font-black text-blue-950 dark:text-blue-100 truncate">
                New Card
              </span>
              <span className="text-[9px] text-blue-700 dark:text-blue-300 font-semibold truncate">
                नवीन कार्ड नोंदणी
              </span>
            </div>
          </button>

          {/* 3. Customer Ledger */}
          <button
            id="quick-btn-customer-ledger"
            type="button"
            onClick={onCustomerLedger}
            className="group relative flex items-center gap-2.5 px-3 py-2 rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 active:scale-95 transition-all text-purple-800 dark:text-purple-200 cursor-pointer shadow-xs text-left"
            title="Open Customer Accounts & Khata Statements"
          >
            <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col min-w-0 leading-tight">
              <span className="text-xs font-black text-purple-950 dark:text-purple-100 truncate">
                Customer Ledger
              </span>
              <span className="text-[9px] text-purple-700 dark:text-purple-300 font-semibold truncate">
                खातेवही / उधारी
              </span>
            </div>
          </button>

          {/* 4. Sales Bill */}
          <button
            id="quick-btn-new-bill"
            type="button"
            onClick={onNewBill}
            className="group relative flex items-center gap-2.5 px-3 py-2 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 active:scale-95 transition-all text-amber-800 dark:text-amber-200 cursor-pointer shadow-xs text-left"
            title="Generate New Sales Bill / Tax Invoice"
          >
            <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
              <FilePlus className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col min-w-0 leading-tight">
              <span className="text-xs font-black text-amber-950 dark:text-amber-100 truncate">
                Sales Bill
              </span>
              <span className="text-[9px] text-amber-700 dark:text-amber-300 font-semibold truncate">
                नवीन विक्री बिल
              </span>
            </div>
          </button>

          {/* 5. Pavti / Payment Receipt */}
          <button
            id="quick-btn-receive-pavti"
            type="button"
            onClick={onReceivePavti}
            className="group relative flex items-center gap-2.5 px-3 py-2 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 active:scale-95 transition-all text-rose-800 dark:text-rose-200 cursor-pointer shadow-xs text-left"
            title="Record Instant Payment Receipt (जमा पावती)"
          >
            <div className="w-7 h-7 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
              <Receipt className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col min-w-0 leading-tight">
              <span className="text-xs font-black text-rose-950 dark:text-rose-100 truncate">
                Receive Pavti
              </span>
              <span className="text-[9px] text-rose-700 dark:text-rose-300 font-semibold truncate">
                जमा पावती घ्या
              </span>
            </div>
          </button>

          {/* 6. Master Search */}
          {onMasterSearch && (
            <button
              id="quick-btn-master-search"
              type="button"
              onClick={onMasterSearch}
              className="group relative flex items-center gap-2.5 px-3 py-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 active:scale-95 transition-all text-indigo-800 dark:text-indigo-200 cursor-pointer shadow-xs text-left col-span-2 sm:col-span-1"
              title="Open Master Search & Uploaded Database"
            >
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                <Search className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col min-w-0 leading-tight">
                <span className="text-xs font-black text-indigo-950 dark:text-indigo-100 truncate">
                  Master Search
                </span>
                <span className="text-[9px] text-indigo-700 dark:text-indigo-300 font-semibold truncate">
                  सर्व डेटा शोधा
                </span>
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
