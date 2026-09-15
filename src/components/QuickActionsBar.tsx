import React from 'react';
import {
  CalendarCheck,
  CreditCard,
  BookOpen,
  FileText,
  IndianRupee,
  Search,
  Zap,
  Award,
  Receipt
} from 'lucide-react';

interface QuickActionsBarProps {
  onOpenWeeklyCollection: () => void;
  onOpenNewCard: () => void;
  onOpenCustomerKhata: () => void;
  onOpenSalesBill: () => void;
  onOpenBillReceipts?: () => void;
  onOpenReceivePayment: () => void;
  onOpenMasterSearch: () => void;
  onOpenAgentCommission?: () => void;
}

export const QuickActionsBar: React.FC<QuickActionsBarProps> = ({
  onOpenWeeklyCollection,
  onOpenNewCard,
  onOpenCustomerKhata,
  onOpenSalesBill,
  onOpenBillReceipts,
  onOpenReceivePayment,
  onOpenMasterSearch,
  onOpenAgentCommission,
}) => {
  return (
    <section
      aria-label="Quick Actions"
      className="bg-white/95 dark:bg-[#0C1425]/95 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 overflow-x-auto no-scrollbar shadow-2xs no-print"
    >
      {/* Label Badge */}
      <div className="flex items-center gap-2.5 shrink-0 pr-3 border-r border-slate-200 dark:border-slate-800">
        <div className="w-7 h-7 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
          <Zap className="w-4 h-4 fill-amber-500 text-amber-500" />
        </div>
        <div>
          <span className="text-[11px] font-black tracking-wider uppercase text-slate-900 dark:text-slate-100 block font-mono">
            QUICK ACTIONS
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">
            जलद शॉर्टकट मेनू
          </span>
        </div>
      </div>

      {/* Action Buttons Row - Perfectly styled, full labels, no text cutoff */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* 1. Weekly Collection (Green) */}
        <button
          type="button"
          onClick={onOpenWeeklyCollection}
          title="साप्ताहिक हप्ते जमा करा (Weekly Collection)"
          className="group flex items-center gap-2 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/90 hover:bg-emerald-100/90 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-950 dark:text-emerald-100 transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0"
        >
          <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
            <CalendarCheck className="w-3.5 h-3.5" />
          </div>
          <div className="text-left leading-tight">
            <span className="text-xs font-black block tracking-tight whitespace-nowrap">
              Weekly Collection
            </span>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-medium block whitespace-nowrap">
              हप्ते जमा करा
            </span>
          </div>
        </button>

        {/* 2. New Card (Blue) */}
        <button
          type="button"
          onClick={onOpenNewCard}
          title="नवीन कार्ड नोंदणी (New Scheme Card)"
          className="group flex items-center gap-2 px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-800/80 bg-blue-50/90 hover:bg-blue-100/90 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-blue-950 dark:text-blue-100 transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0"
        >
          <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
            <CreditCard className="w-3.5 h-3.5" />
          </div>
          <div className="text-left leading-tight">
            <span className="text-xs font-black block tracking-tight whitespace-nowrap">
              New Card
            </span>
            <span className="text-[10px] text-blue-700 dark:text-blue-300 font-medium block whitespace-nowrap">
              नवीन कार्ड नोंद
            </span>
          </div>
        </button>

        {/* 3. Customer Khata (Purple) */}
        <button
          type="button"
          onClick={onOpenCustomerKhata}
          title="ग्राहक खातेवही व उधारी (Customer Khata)"
          className="group flex items-center gap-2 px-3 py-1.5 rounded-xl border border-purple-200 dark:border-purple-800/80 bg-purple-50/90 hover:bg-purple-100/90 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 text-purple-950 dark:text-purple-100 transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0"
        >
          <div className="w-6 h-6 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
            <BookOpen className="w-3.5 h-3.5" />
          </div>
          <div className="text-left leading-tight">
            <span className="text-xs font-black block tracking-tight whitespace-nowrap">
              Customer Khata
            </span>
            <span className="text-[10px] text-purple-700 dark:text-purple-300 font-medium block whitespace-nowrap">
              खातेवही / उधारी
            </span>
          </div>
        </button>

        {/* 4. Sales Bill (Amber / Orange) */}
        <button
          type="button"
          onClick={onOpenSalesBill}
          title="नवीन विक्री बिल (Sales Bill / Add Entry)"
          className="group flex items-center gap-2 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-800/80 bg-amber-50/90 hover:bg-amber-100/90 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-950 dark:text-amber-100 transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0"
        >
          <div className="w-6 h-6 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
            <FileText className="w-3.5 h-3.5" />
          </div>
          <div className="text-left leading-tight">
            <span className="text-xs font-black block tracking-tight whitespace-nowrap">
              Sales Bill
            </span>
            <span className="text-[10px] text-amber-700 dark:text-amber-300 font-medium block whitespace-nowrap">
              नवीन विक्री बिल
            </span>
          </div>
        </button>

        {/* 4.5 Bill Receipts (Emerald / Green) */}
        {onOpenBillReceipts && (
          <button
            type="button"
            onClick={onOpenBillReceipts}
            title="बिलाच्या विरोधात जमा पावत्या (Receipts Against Bill - #1079...)"
            className="group flex items-center gap-2 px-3 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-800/80 bg-emerald-100/80 hover:bg-emerald-200/80 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/70 text-emerald-950 dark:text-emerald-100 transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0"
          >
            <div className="w-6 h-6 rounded-lg bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
              <Receipt className="w-3.5 h-3.5" />
            </div>
            <div className="text-left leading-tight">
              <span className="text-xs font-black block tracking-tight whitespace-nowrap flex items-center gap-1">
                <span>Bill Receipts</span>
                <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-600 text-white font-mono">#1079</span>
              </span>
              <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-medium block whitespace-nowrap">
                बिलाविरोधात जमा पावती
              </span>
            </div>
          </button>
        )}

        {/* 5. Receive Payment (Rose / Pink) */}
        <button
          type="button"
          onClick={onOpenReceivePayment}
          title="जमा पावती घ्या / रोख भरणा (Receive Payment)"
          className="group flex items-center gap-2 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-800/80 bg-rose-50/90 hover:bg-rose-100/90 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-950 dark:text-rose-100 transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0"
        >
          <div className="w-6 h-6 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
            <IndianRupee className="w-3.5 h-3.5" />
          </div>
          <div className="text-left leading-tight">
            <span className="text-xs font-black block tracking-tight whitespace-nowrap">
              Receive Payment
            </span>
            <span className="text-[10px] text-rose-700 dark:text-rose-300 font-medium block whitespace-nowrap">
              जमा पावती घ्या
            </span>
          </div>
        </button>

        {/* 6. Master Search (Indigo / Blue-Purple) */}
        <button
          type="button"
          onClick={onOpenMasterSearch}
          title="सर्व डेटा शोध (Master Search / Uploaded 2,500+ records)"
          className="group flex items-center gap-2 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/90 hover:bg-indigo-100/90 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 text-indigo-950 dark:text-indigo-100 transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0"
        >
          <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
            <Search className="w-3.5 h-3.5" />
          </div>
          <div className="text-left leading-tight">
            <span className="text-xs font-black block tracking-tight whitespace-nowrap">
              Master Search
            </span>
            <span className="text-[10px] text-indigo-700 dark:text-indigo-300 font-medium block whitespace-nowrap">
              सर्व डेटा शोधा
            </span>
          </div>
        </button>

        {/* 7. Agent Commission & Day-wise Monitor (Teal / Emerald) */}
        {onOpenAgentCommission && (
          <button
            type="button"
            onClick={onOpenAgentCommission}
            title="एजंट कमिशन व डॅशबोर्ड (4% Commission + ₹50 New Card + Advances)"
            className="group flex items-center gap-2 px-3 py-1.5 rounded-xl border border-teal-200 dark:border-teal-800/80 bg-teal-50/90 hover:bg-teal-100/90 dark:bg-teal-950/40 dark:hover:bg-teal-900/50 text-teal-950 dark:text-teal-100 transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0"
          >
            <div className="w-6 h-6 rounded-lg bg-[#00523f] text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
              <Award className="w-3.5 h-3.5" />
            </div>
            <div className="text-left leading-tight">
              <span className="text-xs font-black block tracking-tight whitespace-nowrap">
                Agent 4% & पगार
              </span>
              <span className="text-[10px] text-teal-700 dark:text-teal-300 font-medium block whitespace-nowrap">
                कमिशन डॅशबोर्ड
              </span>
            </div>
          </button>
        )}
      </div>
    </section>
  );
};

export default QuickActionsBar;
