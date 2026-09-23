import React, { useState, useRef } from 'react';
import {
  CalendarCheck,
  CreditCard,
  BookOpen,
  FileText,
  IndianRupee,
  Search,
  Zap,
  Award,
  Receipt,
  Calculator,
  Users,
  CheckCircle2,
  Sparkles,
  ScanLine,
  Coins,
  QrCode,
  Hammer,
  FileCheck,
  ClipboardList,
  MapPin,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Percent,
  ShieldCheck,
  Gift
} from 'lucide-react';
import { ActiveTab } from '../types';

interface QuickActionsBarProps {
  activeTab?: ActiveTab;
  onOpenWeeklyCollection: () => void;
  onOpenNewCard: () => void;
  onOpenCardPassbook?: () => void;
  onOpenCardDueReminders?: () => void;
  onOpenLuckyDraw?: () => void;
  onOpenDailyCollectionLog?: () => void;
  onOpenVillageKhata?: () => void;
  onOpenCustomerKhata: () => void;
  onOpenSalesBill: () => void;
  onOpenBillReceipts?: () => void;
  onOpenBarcodeScanner?: () => void;
  onOpenDynamicUpiQr?: () => void;
  onOpenReceivePayment: () => void;
  onOpenCashReconciliation?: () => void;
  onOpenOwnerDigest?: () => void;
  onOpenFurnitureJobs?: () => void;
  onOpenFinanceDO?: () => void;
  onOpenMasterSearch: () => void;
  onOpenAgentCommission?: () => void;
  onOpenFinanceCalc?: () => void;
  onOpenWarrantyTracker?: () => void;
  onOpenSchemeMaturity?: () => void;
  onOpenWeddingQuotation?: () => void;
  onOpenFestivalWishes?: () => void;
  onOpenWhatsAppGroup?: () => void;
}

type ActionCategory = 'all' | 'scheme' | 'billing' | 'khata' | 'tools';

export const QuickActionsBar: React.FC<QuickActionsBarProps> = ({
  activeTab,
  onOpenWeeklyCollection,
  onOpenNewCard,
  onOpenCardPassbook,
  onOpenCardDueReminders,
  onOpenLuckyDraw,
  onOpenDailyCollectionLog,
  onOpenVillageKhata,
  onOpenCustomerKhata,
  onOpenSalesBill,
  onOpenBillReceipts,
  onOpenBarcodeScanner,
  onOpenDynamicUpiQr,
  onOpenReceivePayment,
  onOpenCashReconciliation,
  onOpenOwnerDigest,
  onOpenFurnitureJobs,
  onOpenFinanceDO,
  onOpenMasterSearch,
  onOpenAgentCommission,
  onOpenFinanceCalc,
  onOpenWarrantyTracker,
  onOpenSchemeMaturity,
  onOpenWeddingQuotation,
  onOpenFestivalWishes,
  onOpenWhatsAppGroup,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ActionCategory>('all');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -280 : 280;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Structured list of all 1-tap quick actions
  const allActions = [
    // ---------------- CARD SCHEME ACTIONS ----------------
    {
      id: 'qa-weekly-collection',
      category: 'scheme' as const,
      tabKey: 'card-collection',
      title: 'हप्ता वसुली',
      subTitle: 'Weekly Collection',
      icon: CalendarCheck,
      badge: 'TOP',
      badgeClass: 'bg-emerald-600 text-white',
      borderClass: 'border-emerald-300 dark:border-emerald-700/80',
      bgClass: 'bg-emerald-50/90 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60',
      textClass: 'text-emerald-950 dark:text-emerald-100',
      iconBg: 'bg-emerald-600 text-white',
      onClick: onOpenWeeklyCollection,
    },
    {
      id: 'qa-collection-register',
      category: 'scheme' as const,
      tabKey: 'daily-collection-log',
      title: 'दैनिक वसुली',
      subTitle: 'Print Register',
      icon: ClipboardList,
      badge: 'PRINT',
      badgeClass: 'bg-emerald-700 text-white',
      borderClass: 'border-emerald-300 dark:border-emerald-700/80',
      bgClass: 'bg-emerald-50/90 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60',
      textClass: 'text-emerald-950 dark:text-emerald-100',
      iconBg: 'bg-emerald-700 text-white',
      onClick: onOpenDailyCollectionLog || (() => {}),
    },
    {
      id: 'qa-card-passbook',
      category: 'scheme' as const,
      tabKey: 'card-passbook',
      title: 'डिजिटल पासबुक',
      subTitle: 'Bank Ledger',
      icon: BookOpen,
      badge: 'NEW',
      badgeClass: 'bg-indigo-600 text-white',
      borderClass: 'border-indigo-300 dark:border-indigo-700/80',
      bgClass: 'bg-indigo-50/90 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60',
      textClass: 'text-indigo-950 dark:text-indigo-100',
      iconBg: 'bg-indigo-600 text-white',
      onClick: onOpenCardPassbook || (() => {}),
    },
    {
      id: 'qa-new-card',
      category: 'scheme' as const,
      tabKey: 'new-card',
      title: 'नवीन कार्ड',
      subTitle: 'New Member',
      icon: CreditCard,
      badge: 'ADD',
      badgeClass: 'bg-blue-600 text-white',
      borderClass: 'border-blue-300 dark:border-blue-700/80',
      bgClass: 'bg-blue-50/90 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60',
      textClass: 'text-blue-950 dark:text-blue-100',
      iconBg: 'bg-blue-600 text-white',
      onClick: onOpenNewCard,
    },
    {
      id: 'qa-agent-commission',
      category: 'scheme' as const,
      tabKey: 'agent-commission',
      title: 'एजंट कमिशन',
      subTitle: '4% Commission',
      icon: Percent,
      badge: '4%',
      badgeClass: 'bg-teal-600 text-white',
      borderClass: 'border-teal-300 dark:border-teal-700/80',
      bgClass: 'bg-teal-50/90 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/60',
      textClass: 'text-teal-950 dark:text-teal-100',
      iconBg: 'bg-teal-600 text-white',
      onClick: onOpenAgentCommission || (() => {}),
    },
    {
      id: 'qa-lucky-draw',
      category: 'scheme' as const,
      tabKey: 'lucky-draw',
      title: 'लकी ड्रॉ व गिफ्ट',
      subTitle: 'Gift Delivery',
      icon: Award,
      badge: 'GIFT',
      badgeClass: 'bg-amber-600 text-white',
      borderClass: 'border-amber-300 dark:border-amber-700/80',
      bgClass: 'bg-amber-50/90 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60',
      textClass: 'text-amber-950 dark:text-amber-100',
      iconBg: 'bg-amber-600 text-white',
      onClick: onOpenLuckyDraw || (() => {}),
    },
    {
      id: 'qa-scheme-maturity',
      category: 'scheme' as const,
      tabKey: 'scheme-maturity',
      title: '३०-महिने पूर्तता',
      subTitle: 'Settlement & Gold',
      icon: Gift,
      badge: '30M',
      badgeClass: 'bg-rose-600 text-white',
      borderClass: 'border-rose-300 dark:border-rose-700/80',
      bgClass: 'bg-rose-50/90 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60',
      textClass: 'text-rose-950 dark:text-rose-100',
      iconBg: 'bg-rose-600 text-white',
      onClick: onOpenSchemeMaturity || (() => {}),
    },

    // ---------------- BILLING & INVOICE ACTIONS ----------------
    {
      id: 'qa-sales-bill',
      category: 'billing' as const,
      tabKey: 'add-entry',
      title: 'नवीन बिल',
      subTitle: 'Sales Bill',
      icon: FileText,
      badge: 'BILL',
      badgeClass: 'bg-amber-600 text-white',
      borderClass: 'border-amber-300 dark:border-amber-700/80',
      bgClass: 'bg-amber-50/90 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60',
      textClass: 'text-amber-950 dark:text-amber-100',
      iconBg: 'bg-amber-600 text-white',
      onClick: onOpenSalesBill,
    },
    {
      id: 'qa-bill-receipts',
      category: 'billing' as const,
      tabKey: 'bill-receipts',
      title: 'जमा पावत्या',
      subTitle: 'Bill Receipts',
      icon: Receipt,
      badge: '#1079',
      badgeClass: 'bg-emerald-600 text-white',
      borderClass: 'border-emerald-300 dark:border-emerald-700/80',
      bgClass: 'bg-emerald-50/90 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60',
      textClass: 'text-emerald-950 dark:text-emerald-100',
      iconBg: 'bg-emerald-600 text-white',
      onClick: onOpenBillReceipts || (() => {}),
    },
    {
      id: 'qa-dynamic-upi',
      category: 'billing' as const,
      tabKey: 'upi-qr',
      title: 'UPI QR कोड',
      subTitle: 'PhonePe/GPay',
      icon: QrCode,
      badge: 'QR',
      badgeClass: 'bg-indigo-600 text-white',
      borderClass: 'border-indigo-300 dark:border-indigo-700/80',
      bgClass: 'bg-indigo-50/90 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60',
      textClass: 'text-indigo-950 dark:text-indigo-100',
      iconBg: 'bg-indigo-600 text-white',
      onClick: onOpenDynamicUpiQr || onOpenSalesBill,
    },

    // ---------------- CUSTOMER & KHATA ACTIONS ----------------
    {
      id: 'qa-customer-khata',
      category: 'khata' as const,
      tabKey: 'customers',
      title: 'ग्राहक खातेवही',
      subTitle: 'Customer Khata',
      icon: Users,
      badge: 'LEDGER',
      badgeClass: 'bg-purple-600 text-white',
      borderClass: 'border-purple-300 dark:border-purple-700/80',
      bgClass: 'bg-purple-50/90 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/60',
      textClass: 'text-purple-950 dark:text-purple-100',
      iconBg: 'bg-purple-600 text-white',
      onClick: onOpenCustomerKhata,
    },
    {
      id: 'qa-village-khata',
      category: 'khata' as const,
      tabKey: 'village-khata',
      title: 'गाववार उधारी',
      subTitle: 'Route & Village',
      icon: MapPin,
      badge: 'ROUTE',
      badgeClass: 'bg-rose-600 text-white',
      borderClass: 'border-rose-300 dark:border-rose-700/80',
      bgClass: 'bg-rose-50/90 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60',
      textClass: 'text-rose-950 dark:text-rose-100',
      iconBg: 'bg-rose-600 text-white',
      onClick: onOpenVillageKhata || (() => {}),
    },
    {
      id: 'qa-receive-payment',
      category: 'khata' as const,
      tabKey: 'settle-khata',
      title: 'उधारी जमा',
      subTitle: 'Receive Payment',
      icon: IndianRupee,
      badge: 'CASH',
      badgeClass: 'bg-rose-700 text-white',
      borderClass: 'border-rose-300 dark:border-rose-700/80',
      bgClass: 'bg-rose-50/90 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60',
      textClass: 'text-rose-950 dark:text-rose-100',
      iconBg: 'bg-rose-600 text-white',
      onClick: onOpenReceivePayment,
    },

    // ---------------- RECONCILIATION & TOOLS ----------------
    {
      id: 'qa-cash-reconcile',
      category: 'tools' as const,
      tabKey: 'daily-reconciliation',
      title: 'दैनिक गल्ला',
      subTitle: 'Cash Tally Sheet',
      icon: Coins,
      badge: 'TALLY',
      badgeClass: 'bg-emerald-600 text-white',
      borderClass: 'border-emerald-300 dark:border-emerald-700/80',
      bgClass: 'bg-emerald-50/90 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60',
      textClass: 'text-emerald-950 dark:text-emerald-100',
      iconBg: 'bg-emerald-600 text-white',
      onClick: onOpenCashReconciliation || (() => {}),
    },
    {
      id: 'qa-owner-digest',
      category: 'tools' as const,
      tabKey: 'owner-digest',
      title: 'मालक रिपोर्ट',
      subTitle: 'Daily Digest',
      icon: TrendingUp,
      badge: 'WHATSAPP',
      badgeClass: 'bg-blue-600 text-white',
      borderClass: 'border-blue-300 dark:border-blue-700/80',
      bgClass: 'bg-blue-50/90 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60',
      textClass: 'text-blue-950 dark:text-blue-100',
      iconBg: 'bg-blue-600 text-white',
      onClick: onOpenOwnerDigest || (() => {}),
    },
    {
      id: 'qa-finance-calc',
      category: 'tools' as const,
      tabKey: 'finance-calc',
      title: 'फायनान्स EMI',
      subTitle: 'Bajaj / TVS',
      icon: Calculator,
      badge: 'EMI',
      badgeClass: 'bg-cyan-600 text-white',
      borderClass: 'border-cyan-300 dark:border-cyan-700/80',
      bgClass: 'bg-cyan-50/90 dark:bg-cyan-950/40 hover:bg-cyan-100 dark:hover:bg-cyan-900/60',
      textClass: 'text-cyan-950 dark:text-cyan-100',
      iconBg: 'bg-cyan-600 text-white',
      onClick: onOpenFinanceCalc || (() => {}),
    },
    {
      id: 'qa-furniture-jobs',
      category: 'tools' as const,
      tabKey: 'furniture-jobs',
      title: 'फर्निचर जॉब्स',
      subTitle: 'Teak Job Cards',
      icon: Hammer,
      badge: 'JOB',
      badgeClass: 'bg-amber-600 text-white',
      borderClass: 'border-amber-300 dark:border-amber-700/80',
      bgClass: 'bg-amber-50/90 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60',
      textClass: 'text-amber-950 dark:text-amber-100',
      iconBg: 'bg-amber-600 text-white',
      onClick: onOpenFurnitureJobs || (() => {}),
    },
    {
      id: 'qa-warranty-tracker',
      category: 'tools' as const,
      tabKey: 'warranty-tracker',
      title: 'वॉरंटी ट्रॅकर',
      subTitle: 'Claims & Expiry',
      icon: ShieldCheck,
      badge: 'CLAIM',
      badgeClass: 'bg-emerald-600 text-white',
      borderClass: 'border-emerald-300 dark:border-emerald-700/80',
      bgClass: 'bg-emerald-50/90 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60',
      textClass: 'text-emerald-950 dark:text-emerald-100',
      iconBg: 'bg-emerald-600 text-white',
      onClick: onOpenWarrantyTracker || (() => {}),
    },
    {
      id: 'qa-wedding-quote',
      category: 'tools' as const,
      tabKey: 'wedding-package',
      title: 'लग्न पॅकेज',
      subTitle: 'Wedding Quotes',
      icon: Gift,
      badge: 'NEW',
      badgeClass: 'bg-rose-600 text-white',
      borderClass: 'border-rose-300 dark:border-rose-700/80',
      bgClass: 'bg-rose-50/90 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60',
      textClass: 'text-rose-950 dark:text-rose-100',
      iconBg: 'bg-rose-600 text-white',
      onClick: onOpenWeddingQuotation || (() => {}),
    },
    {
      id: 'qa-festival-wishes',
      category: 'tools' as const,
      tabKey: 'festival-wishes',
      title: 'सण व वाढदिवस',
      subTitle: 'Offers & Wishes',
      icon: Sparkles,
      badge: 'OFFERS',
      badgeClass: 'bg-amber-600 text-white',
      borderClass: 'border-amber-300 dark:border-amber-700/80',
      bgClass: 'bg-amber-50/90 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60',
      textClass: 'text-amber-950 dark:text-amber-100',
      iconBg: 'bg-amber-600 text-white',
      onClick: onOpenFestivalWishes || (() => {}),
    },
    {
      id: 'qa-whatsapp-group',
      category: 'scheme' as const,
      tabKey: 'whatsapp-group',
      title: 'WhatsApp ग्रुप',
      subTitle: 'Auto Invite & VCF',
      icon: Users,
      badge: 'COMMUNITY',
      badgeClass: 'bg-emerald-600 text-white',
      borderClass: 'border-emerald-300 dark:border-emerald-700/80',
      bgClass: 'bg-emerald-50/90 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60',
      textClass: 'text-emerald-950 dark:text-emerald-100',
      iconBg: 'bg-emerald-600 text-white',
      onClick: onOpenWhatsAppGroup || (() => {}),
    },
    {
      id: 'qa-master-search',
      category: 'tools' as const,
      tabKey: 'uploaded-data',
      title: 'मास्टर शोध',
      subTitle: '2500+ Customers',
      icon: Search,
      badge: 'SEARCH',
      badgeClass: 'bg-indigo-600 text-white',
      borderClass: 'border-indigo-300 dark:border-indigo-700/80',
      bgClass: 'bg-indigo-50/90 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60',
      textClass: 'text-indigo-950 dark:text-indigo-100',
      iconBg: 'bg-indigo-600 text-white',
      onClick: onOpenMasterSearch,
    },
  ];

  const filteredActions =
    selectedCategory === 'all'
      ? allActions
      : allActions.filter((a) => a.category === selectedCategory);

  return (
    <section
      aria-label="Quick Actions"
      className="bg-white/95 dark:bg-[#0C1425]/95 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800 px-2 sm:px-4 py-1.5 sm:py-2 shadow-2xs no-print relative z-20"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-3">
        {/* Left Header / Category Switcher */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 pb-1 sm:pb-0">
          <div className="flex items-center gap-1.5 shrink-0 pr-2 border-r border-slate-200 dark:border-slate-800">
            <div className="w-6 h-6 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black">
              <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            </div>
            <span className="text-[11px] font-black tracking-wider uppercase text-slate-900 dark:text-slate-100 font-mono hidden md:inline">
              QUICK ACTIONS
            </span>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-2 py-0.5 rounded-lg transition cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              सर्व ({allActions.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('scheme')}
              className={`px-2 py-0.5 rounded-lg transition cursor-pointer ${
                selectedCategory === 'scheme'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400'
              }`}
            >
              कार्ड योजना
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('billing')}
              className={`px-2 py-0.5 rounded-lg transition cursor-pointer ${
                selectedCategory === 'billing'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-slate-500 hover:text-amber-600 dark:hover:text-amber-400'
              }`}
            >
              बिलिंग
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('khata')}
              className={`px-2 py-0.5 rounded-lg transition cursor-pointer ${
                selectedCategory === 'khata'
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'text-slate-500 hover:text-purple-600 dark:hover:text-purple-400'
              }`}
            >
              खातेवही
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('tools')}
              className={`px-2 py-0.5 rounded-lg transition cursor-pointer ${
                selectedCategory === 'tools'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-500 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              टूल्स
            </button>
          </div>
        </div>

        {/* Scroll Controls (Desktop only) */}
        <div className="hidden lg:flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => scroll('left')}
            className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition cursor-pointer"
            title="डावीकडे स्क्रोल करा"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => scroll('right')}
            className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition cursor-pointer"
            title="उजवीकडे स्क्रोल करा"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 1-Tap Action Chips Horizontal Scrollable Row */}
      <div
        ref={scrollContainerRef}
        className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 pt-2 scroll-smooth"
      >
        {filteredActions.map((action) => {
          const IconComp = action.icon;
          const isActive = activeTab && action.tabKey === activeTab;

          return (
            <button
              key={action.id}
              id={action.id}
              type="button"
              onClick={action.onClick}
              className={`group flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer shrink-0 active:scale-95 text-left shadow-2xs ${
                action.borderClass
              } ${action.bgClass} ${
                isActive ? 'ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-slate-900 font-black' : ''
              }`}
              title={`${action.title} - ${action.subTitle}`}
            >
              <div
                className={`w-7 h-7 rounded-lg ${action.iconBg} flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform`}
              >
                <IconComp className="w-4 h-4" />
              </div>

              <div className="leading-tight pr-1">
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-black block tracking-tight whitespace-nowrap ${action.textClass}`}>
                    {action.title}
                  </span>
                  {action.badge && (
                    <span
                      className={`text-[9px] font-black uppercase px-1 py-0.2 rounded font-mono ${action.badgeClass}`}
                    >
                      {action.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block whitespace-nowrap">
                  {action.subTitle}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default QuickActionsBar;
