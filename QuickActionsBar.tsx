import React, { useState } from 'react';
import {
  Zap,
  CalendarCheck,
  CreditCard,
  BookOpen,
  PlusCircle,
  Receipt,
  ArrowDownCircle,
  Search,
  Users,
  Smartphone,
  PackagePlus,
  Calculator,
  Store,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';
import { NavTab } from '../Sidebar';
import { useTheme } from '../../context/ThemeContext';
import { GalaxyButton } from './GalaxyButton';

interface QuickActionsBarProps {
  onNavigate: (tab: NavTab) => void;
  onOpenFastPaymentModal: () => void;
  onOpenNewCardModal: () => void;
  onOpenWeeklyCollectionModal?: () => void;
  onOpenFrontAddProductModal?: () => void;
  onOpenMobileAgentHisabModal?: () => void;
  onOpenQuickHisabModal?: () => void;
  onOpenFinanceModal?: () => void;
  onOpenCustomerShowroom?: () => void;
}

type QuickCategory = 'core' | 'billing' | 'scheme' | 'tools';

export const QuickActionsBar: React.FC<QuickActionsBarProps> = ({
  onNavigate,
  onOpenFastPaymentModal,
  onOpenNewCardModal,
  onOpenWeeklyCollectionModal,
  onOpenFrontAddProductModal,
  onOpenMobileAgentHisabModal,
  onOpenQuickHisabModal,
  onOpenFinanceModal,
  onOpenCustomerShowroom,
}) => {
  const { isDayMode } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<QuickCategory>('core');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const categories: { id: QuickCategory; label: string; marathi: string }[] = [
    { id: 'core', label: '⭐ Core', marathi: 'मुख्य' },
    { id: 'billing', label: '🧾 Billing', marathi: 'बिलिंग' },
    { id: 'scheme', label: '🎁 Scheme', marathi: 'योजना' },
    { id: 'tools', label: '⚡ Fast Tools', marathi: 'साधने' },
  ];

  if (isCollapsed) {
    return (
      <div className="px-3 py-1 flex items-center justify-between border-b text-[11px] select-none backdrop-blur-xl transition-all border-slate-200 dark:border-white/10 bg-white/40 dark:bg-slate-900/40">
        <div className="flex items-center gap-1.5 text-sky-500 font-bold">
          <Zap className="w-3 h-3 animate-pulse" />
          <span>Quick Actions Dock <span className="font-normal opacity-75">(जलद साधने)</span></span>
        </div>
        <button
          onClick={() => setIsCollapsed(false)}
          className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/15 text-sky-600 dark:text-sky-300 hover:bg-sky-500/25 cursor-pointer"
        >
          <span>Expand (उघडा)</span>
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={`px-3 sm:px-6 py-2 flex flex-col md:flex-row md:items-center justify-between gap-2 select-none transition-colors duration-200 backdrop-blur-md border-b ${
        isDayMode
          ? 'bg-white/95 border-slate-200 text-slate-800 shadow-xs'
          : 'bg-[#060a18]/95 border-slate-800 text-slate-100 shadow-sm'
      }`}
    >
      {/* Left: Category Segment Pills & Collapse toggle */}
      <div className="flex items-center gap-1.5 shrink-0">
        <div className={`flex items-center gap-1 p-0.5 rounded-xl border ${
          isDayMode ? 'bg-slate-100 border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? isDayMode
                    ? 'bg-white text-slate-950 shadow-xs border border-slate-200/80 font-black'
                    : 'bg-slate-800 text-sky-200 border border-sky-400/40 font-black'
                  : isDayMode
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setIsCollapsed(true)}
          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
          title="Minimize Quick Dock"
        >
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Right: Clean, Filtered Apple Action Pills */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
        {/* CORE CATEGORY */}
        {selectedCategory === 'core' && (
          <>
            {onOpenQuickHisabModal && (
              <GalaxyButton
                variant="amber"
                size="sm"
                icon={<Calculator className="w-3.5 h-3.5" />}
                onClick={onOpenQuickHisabModal}
                title="Rapid Scratchpad"
              >
                <span>⚡ Rapid Hisab <span className="text-[10px] font-normal opacity-85">(हिशोब)</span></span>
              </GalaxyButton>
            )}

            {onOpenFinanceModal && (
              <GalaxyButton
                variant="cyan"
                size="sm"
                icon={<Calculator className="w-3.5 h-3.5" />}
                onClick={onOpenFinanceModal}
                title="Bajaj / TVS EMI"
              >
                <span>💰 Finance EMI <span className="text-[10px] font-normal opacity-85">(Bajaj/TVS)</span></span>
              </GalaxyButton>
            )}

            {onOpenCustomerShowroom && (
              <GalaxyButton
                variant="purple"
                size="sm"
                icon={<Store className="w-3.5 h-3.5" />}
                onClick={onOpenCustomerShowroom}
                title="Customer Showroom"
              >
                <span>🏪 Showroom <span className="text-[10px] font-normal opacity-85">(शोरूम)</span></span>
              </GalaxyButton>
            )}

            <GalaxyButton
              variant="emerald"
              size="sm"
              icon={<PlusCircle className="w-3.5 h-3.5" />}
              onClick={() => onNavigate('add-entry')}
              title="New Sales Bill"
            >
              <span>+ Sale Bill <span className="text-[10px] font-normal opacity-85">(नवीन विक्री)</span></span>
            </GalaxyButton>

            <GalaxyButton
              variant="emerald"
              size="sm"
              icon={<CalendarCheck className="w-3.5 h-3.5" />}
              onClick={onOpenWeeklyCollectionModal ? onOpenWeeklyCollectionModal : () => onNavigate('scheme')}
              title="Weekly Savings Collection"
            >
              <span>Weekly Collection <span className="text-[10px] font-normal opacity-85">(हप्ते)</span></span>
            </GalaxyButton>
          </>
        )}

        {/* BILLING CATEGORY */}
        {selectedCategory === 'billing' && (
          <>
            <GalaxyButton
              variant="cyan"
              size="sm"
              icon={<PlusCircle className="w-3.5 h-3.5" />}
              onClick={() => onNavigate('pos')}
              title="POS Terminal"
            >
              <span>POS Terminal <span className="text-[10px] font-normal opacity-85">(पीओएस)</span></span>
            </GalaxyButton>

            <GalaxyButton
              variant="amber"
              size="sm"
              icon={<PlusCircle className="w-3.5 h-3.5" />}
              onClick={() => onNavigate('add-entry')}
              title="Tax Invoice Bill"
            >
              <span>+ Sales Bill <span className="text-[10px] font-normal opacity-85">(नवीन बिल)</span></span>
            </GalaxyButton>

            <GalaxyButton
              variant="cyan"
              size="sm"
              icon={<Receipt className="w-3.5 h-3.5" />}
              onClick={() => onNavigate('receipts')}
              title="Receipts #1079"
            >
              <span>Receipts #1079 <span className="text-[10px] font-normal opacity-85">(पावती)</span></span>
            </GalaxyButton>

            <GalaxyButton
              variant="purple"
              size="sm"
              icon={<BookOpen className="w-3.5 h-3.5" />}
              onClick={() => onNavigate('customers')}
              title="Customer Khata Book"
            >
              <span>Customer Khata <span className="text-[10px] font-normal opacity-85">(खातेवही)</span></span>
            </GalaxyButton>

            <GalaxyButton
              variant="rose"
              size="sm"
              icon={<ArrowDownCircle className="w-3.5 h-3.5" />}
              onClick={onOpenFastPaymentModal}
              title="Collect Due Payment"
            >
              <span>Collect Due <span className="text-[10px] font-normal opacity-85">(उधारी जमा)</span></span>
            </GalaxyButton>
          </>
        )}

        {/* SCHEME CATEGORY */}
        {selectedCategory === 'scheme' && (
          <>
            <GalaxyButton
              variant="emerald"
              size="sm"
              icon={<CalendarCheck className="w-3.5 h-3.5" />}
              onClick={onOpenWeeklyCollectionModal ? onOpenWeeklyCollectionModal : () => onNavigate('scheme')}
              title="Weekly Savings Collection"
            >
              <span>Weekly Collection <span className="text-[10px] font-normal opacity-85">(हप्ते जमा)</span></span>
            </GalaxyButton>

            <GalaxyButton
              variant="cyan"
              size="sm"
              icon={<CreditCard className="w-3.5 h-3.5" />}
              onClick={onOpenNewCardModal}
              title="New Card"
            >
              <span>New Card <span className="text-[10px] font-normal opacity-85">(नवीन कार्ड)</span></span>
            </GalaxyButton>

            {onOpenFinanceModal && (
              <GalaxyButton
                variant="cyan"
                size="sm"
                icon={<Calculator className="w-3.5 h-3.5" />}
                onClick={onOpenFinanceModal}
                title="Finance EMI"
              >
                <span>Finance EMI <span className="text-[10px] font-normal opacity-85">(Bajaj/TVS)</span></span>
              </GalaxyButton>
            )}

            <GalaxyButton
              variant="emerald"
              size="sm"
              icon={<Users className="w-3.5 h-3.5" />}
              onClick={() => onNavigate('agent-commission')}
              title="Agent Commission"
            >
              <span>Agent 4% <span className="text-[10px] font-normal opacity-85">(कमिशन)</span></span>
            </GalaxyButton>
          </>
        )}

        {/* TOOLS CATEGORY */}
        {selectedCategory === 'tools' && (
          <>
            {onOpenQuickHisabModal && (
              <GalaxyButton
                variant="amber"
                size="sm"
                icon={<Calculator className="w-3.5 h-3.5" />}
                onClick={onOpenQuickHisabModal}
                title="Rapid Hisab"
              >
                <span>⚡ Rapid Hisab <span className="text-[10px] font-normal opacity-85">(हिशोब)</span></span>
              </GalaxyButton>
            )}

            {onOpenMobileAgentHisabModal && (
              <GalaxyButton
                variant="cyan"
                size="sm"
                icon={<Smartphone className="w-3.5 h-3.5" />}
                onClick={onOpenMobileAgentHisabModal}
                title="Mobile Agent Portal"
              >
                <span>📱 Agent Portal <span className="text-[10px] font-normal opacity-85">(एजंट)</span></span>
              </GalaxyButton>
            )}

            {onOpenFrontAddProductModal && (
              <GalaxyButton
                variant="emerald"
                size="sm"
                icon={<PackagePlus className="w-3.5 h-3.5" />}
                onClick={onOpenFrontAddProductModal}
                title="Add Product"
              >
                <span>+ Product <span className="text-[10px] font-normal opacity-85">(प्रॉडक्ट)</span></span>
              </GalaxyButton>
            )}

            <GalaxyButton
              variant="cyan"
              size="sm"
              icon={<Search className="w-3.5 h-3.5" />}
              onClick={() => onNavigate('master-search')}
              title="Master Search"
            >
              <span>Master Search <span className="text-[10px] font-normal opacity-85">(मास्टर डेटा)</span></span>
            </GalaxyButton>
          </>
        )}
      </div>
    </div>
  );
};
