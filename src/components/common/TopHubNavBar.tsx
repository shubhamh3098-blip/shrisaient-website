import React, { useState, useRef, useEffect } from 'react';
import {
  CalendarCheck,
  CreditCard,
  PlusCircle,
  ArrowDownCircle,
  Search,
  Users,
  Store,
  Boxes,
  Receipt,
  Sparkles,
  ArrowLeft,
  Calculator,
  SlidersHorizontal,
  ChevronDown,
  AlertTriangle,
  FileSpreadsheet,
  Wallet,
  Settings,
  LayoutDashboard,
  Smartphone,
  RefreshCw,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';
import { NavTab } from '../Sidebar';
import { useTheme } from '../../context/ThemeContext';

interface TopHubNavBarProps {
  currentTab: NavTab;
  onNavigate: (tab: NavTab) => void;
  onOpenWeeklyCollectionModal?: () => void;
  onOpenNewCardModal?: () => void;
  onOpenFastPaymentModal?: () => void;
  onOpenFinanceModal?: () => void;
  onOpenQuickHisabModal?: () => void;
  onOpenCustomerShowroom?: () => void;
  onOpenMobileAgentHisabModal?: () => void;
  onOpenMobileAgentTerminal?: () => void;
  onOpenFrontAddProductModal?: () => void;
  onOpenSeoModal?: () => void;
  isSimpleView?: boolean;
  onToggleSimpleView?: () => void;
  isLiveSynced?: boolean;
  lastSyncTime?: string;
}

export const TopHubNavBar: React.FC<TopHubNavBarProps> = ({
  currentTab,
  onNavigate,
  onOpenWeeklyCollectionModal,
  onOpenNewCardModal,
  onOpenFastPaymentModal,
  onOpenFinanceModal,
  onOpenQuickHisabModal,
  onOpenCustomerShowroom,
  onOpenMobileAgentHisabModal,
  onOpenMobileAgentTerminal,
  onOpenFrontAddProductModal,
  onOpenSeoModal,
  isSimpleView = true,
  onToggleSimpleView,
  isLiveSynced = true,
  lastSyncTime,
}) => {
  const { isDayMode } = useTheme();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleAction = (callback?: () => void, targetTab?: NavTab) => {
    setIsMoreMenuOpen(false);
    if (callback) {
      callback();
    } else if (targetTab) {
      onNavigate(targetTab);
    }
  };

  // Determine active hub
  const isSchemeActive = currentTab === 'scheme' || currentTab === 'agent-commission' || currentTab === 'scheme-defaulters' || currentTab === 'lucky-draw';
  const isBillingActive = currentTab === 'pos' || currentTab === 'add-entry' || currentTab === 'all-transactions' || currentTab === 'receipts';
  const isCustomerActive = currentTab === 'customers' || currentTab === 'master-search';
  const isStockActive = currentTab === 'inventory' || currentTab === 'dealers' || currentTab === 'expenses';

  return (
    <div
      className={`relative z-30 px-3 sm:px-5 py-2 border-b backdrop-blur-xl transition-all duration-200 ${
        isDayMode
          ? 'bg-white/95 border-slate-200/90 shadow-xs'
          : 'bg-[#090d1f]/95 border-slate-800 shadow-md'
      }`}
    >
      {/* ROW 1: STREAMLINED PRIMARY BAR (सोपी आणि सुटसुटीत मुख्य पट्टी) */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
        {/* LEFT: 3 Quick Daily Direct Actions (दैनिक अतिमहत्त्वाच्या ३ क्रिया) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Action 1: New Bill */}
          <button
            type="button"
            onClick={() => handleAction(undefined, 'add-entry')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-xs shrink-0 whitespace-nowrap ${
              currentTab === 'add-entry'
                ? 'bg-amber-500 text-slate-950 border-amber-600 ring-2 ring-amber-500/30'
                : isDayMode
                ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                : 'bg-amber-950/60 hover:bg-amber-900/80 text-amber-200 border-amber-500/50'
            }`}
            title="नवीन बिल बनवा (New Bill / Invoice)"
          >
            <PlusCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="hidden sm:inline">+ नवीन बिल</span>
            <span className="sm:hidden">+ बिल</span>
          </button>

          {/* Action 2: Weekly Installment Collection */}
          <button
            type="button"
            onClick={() => handleAction(onOpenWeeklyCollectionModal, 'scheme')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 touch-manipulation shrink-0 whitespace-nowrap ${
              isDayMode
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400'
            }`}
            title="३०-महिने कार्ड हप्ते जमा करा (Weekly Collection)"
          >
            <CalendarCheck className="w-3.5 h-3.5 text-white shrink-0" />
            <span>हप्ते जमा</span>
          </button>

          {/* Action 3: Receive Customer Due */}
          <button
            type="button"
            onClick={() => handleAction(onOpenFastPaymentModal, 'customers')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-xs shrink-0 whitespace-nowrap ${
              isDayMode
                ? 'bg-rose-50 hover:bg-rose-100 text-rose-900 border-rose-300'
                : 'bg-rose-950/60 hover:bg-rose-900/80 text-rose-200 border-rose-500/50'
            }`}
            title="ग्राहकाची उधारी जमा करा व पावती द्या (Receive Due)"
          >
            <ArrowDownCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span>उधारी जमा</span>
          </button>
        </div>

        {/* CENTER: 5 Clear Main Hub Navigation Pills (मोठ्या स्क्रीनवर ५ मुख्य विभाग) */}
        <div className={`hidden xl:flex items-center p-1 rounded-xl border gap-1 shrink-0 ${
          isDayMode ? 'bg-slate-100/90 border-slate-200' : 'bg-slate-900/90 border-slate-800'
        }`}>
          {/* Hub 1: Card Scheme */}
          <button
            type="button"
            onClick={() => handleAction(undefined, 'scheme')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              isSchemeActive
                ? 'bg-emerald-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>कार्ड योजना</span>
          </button>

          {/* Hub 2: Billing & POS */}
          <button
            type="button"
            onClick={() => handleAction(undefined, 'pos')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              isBillingActive
                ? 'bg-sky-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>बिलिंग व POS</span>
          </button>

          {/* Hub 3: Customers & Khata */}
          <button
            type="button"
            onClick={() => handleAction(undefined, 'customers')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              isCustomerActive
                ? 'bg-purple-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>खातेवही (Khata)</span>
          </button>

          {/* Hub 4: Stock & Inventory */}
          <button
            type="button"
            onClick={() => handleAction(undefined, 'inventory')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              isStockActive
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>गोदाम साठा</span>
          </button>

          {/* Hub 5: Landing Page & Showroom Editor */}
          <button
            type="button"
            onClick={() => handleAction(undefined, 'landing-editor')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              currentTab === 'landing-editor'
                ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 shadow-md font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="लँडिंग पेज, उत्पादने, सणवार ऑफर्स व बॅनर्स एडिट करा"
          >
            <Store className="w-3.5 h-3.5 text-amber-500" />
            <span>लँडिंग एडिटर</span>
          </button>
        </div>

        {/* RIGHT: Mode Switch & Utilities (सुटसुटीत / विस्तृत टॉगल) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0" ref={dropdownRef}>
          {/* Master Search button */}
          <button
            type="button"
            onClick={() => handleAction(undefined, 'master-search')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition cursor-pointer shrink-0 whitespace-nowrap ${
              currentTab === 'master-search'
                ? 'bg-indigo-500 text-white border-indigo-600'
                : isDayMode
                ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
            }`}
            title="सर्व रेकॉर्ड्स शोधा"
          >
            <Search className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="hidden sm:inline">शोधा</span>
          </button>

          {/* Simple Mode Toggle */}
          {onToggleSimpleView && (
            <button
              type="button"
              onClick={onToggleSimpleView}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer shrink-0 whitespace-nowrap ${
                isSimpleView
                  ? isDayMode
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                  : isDayMode
                  ? 'bg-slate-100 text-slate-700 border-slate-300'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
              title={isSimpleView ? 'विस्तृत व्ह्यू सुरू करा' : 'सोपे सुटसुटीत व्ह्यू सुरू करा'}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="hidden md:inline">{isSimpleView ? 'सोपे व्ह्यू' : 'सर्व टूल्स'}</span>
            </button>
          )}

          {/* Realtime Multi-Device Sync Badge */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition select-none shrink-0 whitespace-nowrap ${
              isLiveSynced
                ? isDayMode
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-xs'
                  : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40 shadow-xs'
                : 'bg-amber-500/10 text-amber-500 border-amber-500/30'
            }`}
            title={`सेंट्रल सर्व्हर व मोबाईल रिअल-टाईम सिंक चालू आहे • शेवटचा सिंक: ${lastSyncTime || 'आत्ताच'}`}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] hidden lg:inline font-mono">सिंक चालू</span>
          </div>

          {/* Field Agent Mobile Terminal */}
          {onOpenMobileAgentTerminal && (
            <button
              type="button"
              onClick={() => handleAction(onOpenMobileAgentTerminal)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer shadow-xs shrink-0 whitespace-nowrap ${
                isDayMode
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-700'
                  : 'bg-emerald-600/90 hover:bg-emerald-500 text-white border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
              }`}
              title="मोबाईल एजंट हप्ता वसुली व दैनिक विक्री हिशोब टर्मिनल"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-200 shrink-0" />
              <span className="hidden sm:inline">एजंट टर्मिनल</span>
              <span className="sm:hidden">एजंट</span>
            </button>
          )}

          {/* Quick Counter Hisab */}
          {onOpenQuickHisabModal && (
            <button
              type="button"
              onClick={() => handleAction(onOpenQuickHisabModal)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition cursor-pointer ${
                isDayMode
                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200'
                  : 'bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 border-amber-500/30'
              }`}
              title="झटपट काऊंटर हिशोब"
            >
              <Calculator className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden md:inline">हिशोब</span>
            </button>
          )}

          {/* Google SEO & Indexing Modal Button */}
          {onOpenSeoModal && (
            <button
              type="button"
              onClick={() => handleAction(onOpenSeoModal)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition cursor-pointer ${
                isDayMode
                  ? 'bg-blue-50 hover:bg-blue-100 text-blue-900 border-blue-200'
                  : 'bg-blue-950/40 hover:bg-blue-900/50 text-blue-300 border-blue-500/30'
              }`}
              title="Google SEO, पत्ता, नंबर आणि रँकिंग माहिती"
            >
              <Search className="w-3.5 h-3.5 text-blue-500" />
              <span className="hidden lg:inline">Google SEO</span>
            </button>
          )}

          {/* Return to Dashboard */}
          {currentTab !== 'dashboard' && (
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer border ${
                isDayMode
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
              title="डॅशबोर्डवर परत जा"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">डॅशबोर्ड</span>
            </button>
          )}
        </div>
      </div>

      {/* ROW 2: EXPANDED SHORTCUTS BAR (केवळ युझरने 'सर्व टूल्स' निवडले तरच दिसेल) */}
      {!isSimpleView && (
        <div className="flex items-center justify-between gap-2 pt-2 mt-2 border-t border-slate-100 dark:border-white/5 animate-in fade-in duration-150">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <button
              type="button"
              onClick={() => handleAction(onOpenNewCardModal, 'scheme')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition cursor-pointer shrink-0 ${
                isDayMode ? 'bg-sky-50 text-sky-800 border-sky-200' : 'bg-sky-950/50 text-sky-300 border-sky-800'
              }`}
            >
              <CreditCard className="w-3 h-3 text-sky-500" />
              <span>नवीन कार्ड</span>
            </button>

            <button
              type="button"
              onClick={() => handleAction(undefined, 'agent-commission')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition cursor-pointer shrink-0 ${
                isDayMode ? 'bg-teal-50 text-teal-800 border-teal-200' : 'bg-teal-950/50 text-teal-300 border-teal-800'
              }`}
            >
              <Users className="w-3 h-3 text-teal-500" />
              <span>एजंट वसुली</span>
            </button>

            <button
              type="button"
              onClick={() => handleAction(undefined, 'scheme-defaulters')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition cursor-pointer shrink-0 ${
                isDayMode ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-rose-950/50 text-rose-300 border-rose-800'
              }`}
            >
              <AlertTriangle className="w-3 h-3 text-rose-500" />
              <span>थकबाकीदार</span>
            </button>

            <button
              type="button"
              onClick={() => handleAction(undefined, 'all-transactions')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition cursor-pointer shrink-0 ${
                isDayMode ? 'bg-slate-50 text-slate-700 border-slate-200' : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              <Receipt className="w-3 h-3 text-indigo-400" />
              <span>विक्री बिले</span>
            </button>

            <button
              type="button"
              onClick={() => handleAction(undefined, 'expenses')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition cursor-pointer shrink-0 ${
                isDayMode ? 'bg-slate-50 text-slate-700 border-slate-200' : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              <Wallet className="w-3 h-3 text-amber-500" />
              <span>दैनिक खर्च</span>
            </button>

            {onOpenMobileAgentHisabModal && (
              <button
                type="button"
                onClick={() => handleAction(onOpenMobileAgentHisabModal)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition cursor-pointer shrink-0 ${
                  isDayMode ? 'bg-indigo-50 text-indigo-900 border-indigo-300' : 'bg-indigo-950/60 text-indigo-200 border-indigo-500/40'
                }`}
                title="मोबाईल एजंट वसुली, रोकड व दैनिक हिशोब डायरी"
              >
                <Smartphone className="w-3 h-3 text-indigo-400" />
                <span>एजंट वसुली व दैनंदिन हिशोब</span>
              </button>
            )}

            {onOpenCustomerShowroom && (
              <button
                type="button"
                onClick={() => handleAction(onOpenCustomerShowroom)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition cursor-pointer shrink-0 ${
                  isDayMode ? 'bg-amber-50 text-amber-900 border-amber-300' : 'bg-amber-950/60 text-amber-200 border-amber-500/40'
                }`}
              >
                <Store className="w-3 h-3 text-amber-500" />
                <span>ग्राहक शोरूम कॅटलॉग</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleAction(undefined, 'profit-loss')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition cursor-pointer shrink-0 ${
                isDayMode ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-emerald-950/50 text-emerald-300 border-emerald-800'
              }`}
            >
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              <span>P&L नफा-तोटा</span>
            </button>

            <button
              type="button"
              onClick={() => handleAction(undefined, 'gst-reports')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition cursor-pointer shrink-0 ${
                isDayMode ? 'bg-sky-50 text-sky-800 border-sky-300' : 'bg-sky-950/50 text-sky-300 border-sky-800'
              }`}
            >
              <FileSpreadsheet className="w-3 h-3 text-sky-400" />
              <span>जीएसटी अहवाल</span>
            </button>

            <button
              type="button"
              onClick={() => handleAction(undefined, 'system-shield')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition cursor-pointer shrink-0 ${
                isDayMode ? 'bg-teal-50 text-teal-800 border-teal-300' : 'bg-teal-950/50 text-teal-300 border-teal-800'
              }`}
            >
              <ShieldCheck className="w-3 h-3 text-teal-400" />
              <span>सिस्टीम शील्ड</span>
            </button>

            {onOpenSeoModal && (
              <button
                type="button"
                onClick={() => handleAction(onOpenSeoModal)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition cursor-pointer shrink-0 ${
                  isDayMode ? 'bg-blue-50 text-blue-900 border-blue-300' : 'bg-blue-950/60 text-blue-200 border-blue-500/40'
                }`}
              >
                <Search className="w-3 h-3 text-blue-500" />
                <span>Google SEO & रँकिंग</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
