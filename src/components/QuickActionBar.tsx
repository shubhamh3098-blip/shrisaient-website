import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar,
  FileText,
  Users,
  Calculator,
  Coins,
  CreditCard,
  BookOpen,
  FilePlus,
  Receipt,
  Sparkles,
  ArrowDownLeft,
  ChevronDown,
  ChevronUp,
  Clock,
  AlertCircle,
  Package,
  BadgePercent
} from 'lucide-react';

interface QuickActionBarProps {
  onWeeklyCollection: () => void;
  onNewCard: () => void;
  onCardPassbook?: () => void;
  onRefund?: () => void;
  onCustomerLedger: () => void;
  onCustomerDueList?: () => void;
  onAllCustomers?: () => void;
  onNewBill: () => void;
  onAllTransactions?: () => void;
  onReceivePavti: () => void;
  onPurchases?: () => void;
  onFinanceCalc?: () => void;
}

export const QuickActionBar: React.FC<QuickActionBarProps> = ({
  onWeeklyCollection,
  onNewCard,
  onCardPassbook,
  onRefund,
  onCustomerLedger,
  onCustomerDueList,
  onAllCustomers,
  onNewBill,
  onAllTransactions,
  onReceivePavti,
  onPurchases,
  onFinanceCalc,
}) => {
  const [openHub, setOpenHub] = useState<'card' | 'sales' | 'customer' | 'finance' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenHub(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenHub(null);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const toggleHub = (hub: 'card' | 'sales' | 'customer' | 'finance') => {
    setOpenHub((prev) => (prev === hub ? null : hub));
  };

  return (
    <div
      ref={containerRef}
      className="w-full bg-[var(--tactile-surface-raised)] border-b border-[var(--tactile-border)] py-2 sm:py-2.5 px-2.5 sm:px-6 shadow-xs relative z-30"
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        {/* Shortcut Section Label */}
        <div className="flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-[var(--tactile-text-heading)]">
                Quick Actions
              </span>
              <span className="text-[10px] text-[var(--tactile-text-dim)] font-medium">
                (जलद शॉर्टकट हब)
              </span>
            </div>
          </div>
          <span className="text-[10px] text-[var(--tactile-text-dim)] md:hidden font-medium">
            (हब निवडा ▾)
          </span>
        </div>

        {/* 4 Categorized Hub Pills matching Screenshot */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full md:w-auto">
          {/* 1. हप्ते व कार्ड (योजना हब) */}
          <div className="relative shrink-0 flex-1 sm:flex-initial">
            <button
              id="hub-btn-card-scheme"
              type="button"
              onClick={() => toggleHub('card')}
              className={`w-full sm:w-auto flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-xs ${
                openHub === 'card'
                  ? 'border-emerald-500 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-100 ring-2 ring-emerald-500/20'
                  : 'border-emerald-500/40 bg-emerald-50/80 dark:bg-emerald-950/30 hover:bg-emerald-100/70 text-emerald-800 dark:text-emerald-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <div className="text-left leading-tight">
                  <div className="font-extrabold text-[12px] text-emerald-950 dark:text-emerald-100">
                    हप्ते व कार्ड
                  </div>
                  <div className="text-[9px] text-emerald-700 dark:text-emerald-300 font-semibold">
                    योजना हब
                  </div>
                </div>
              </div>
              {openHub === 'card' ? (
                <ChevronUp className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-300 shrink-0" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-300 shrink-0" />
              )}
            </button>

            {/* Dropdown Menu 1: Card Scheme */}
            {openHub === 'card' && (
              <div className="absolute left-0 mt-2 w-72 sm:w-80 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-500/30 dark:border-emerald-500/20 shadow-2xl p-2.5 space-y-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span>कार्ड योजना मेनू (CARD SCHEME)</span>
                  <span className="text-[9px] text-emerald-600 font-bold">३०-महिने बचत</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setOpenHub(null);
                    onWeeklyCollection();
                  }}
                  className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-left transition cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Coins className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                      <span>⚡ Weekly Collection</span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">हप्ते जमा</span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      साप्ताहिक हप्ते जमा करा व पावती द्या
                    </p>
                  </div>
                </button>

                {onCardPassbook && (
                  <button
                    type="button"
                    onClick={() => {
                      setOpenHub(null);
                      onCardPassbook();
                    }}
                    className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-left transition cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          📖 डिजिटल पासबुक (Passbook)
                        </span>
                        <span className="text-[9px] bg-indigo-600 text-white font-black px-1.5 py-0.5 rounded-full uppercase">
                          NEW
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        बँक-स्टाईल स्टेटमेंट लेजर, जमा-खर्च व खरेदी
                      </p>
                    </div>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setOpenHub(null);
                    onNewCard();
                  }}
                  className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/40 text-left transition cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                      <span>➕ New Card</span>
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono font-bold">₹50 फी</span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      नवीन कार्ड नोंदणी करा (नाव, गाव, मोबाईल)
                    </p>
                  </div>
                </button>

                {onRefund && (
                  <button
                    type="button"
                    onClick={() => {
                      setOpenHub(null);
                      onRefund();
                    }}
                    className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left transition cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <ArrowDownLeft className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        ↩️ परत / रिफंड (Refund Return)
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        कार्डधारकाला रक्कम परत केल्यास नोंद
                      </p>
                    </div>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 2. विक्री व बिल (बिलिंग हब) */}
          <div className="relative shrink-0 flex-1 sm:flex-initial">
            <button
              id="hub-btn-sales-billing"
              type="button"
              onClick={() => toggleHub('sales')}
              className={`w-full sm:w-auto flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-xs ${
                openHub === 'sales'
                  ? 'border-amber-500 bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-100 ring-2 ring-amber-500/20'
                  : 'border-amber-500/40 bg-amber-50/80 dark:bg-amber-950/30 hover:bg-amber-100/70 text-amber-800 dark:text-amber-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <FileText className="w-3.5 h-3.5" />
                </div>
                <div className="text-left leading-tight">
                  <div className="font-extrabold text-[12px] text-amber-950 dark:text-amber-100">
                    विक्री व बिल
                  </div>
                  <div className="text-[9px] text-amber-700 dark:text-amber-300 font-semibold">
                    बिलिंग हब
                  </div>
                </div>
              </div>
              {openHub === 'sales' ? (
                <ChevronUp className="w-3.5 h-3.5 text-amber-700 dark:text-amber-300 shrink-0" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-amber-700 dark:text-amber-300 shrink-0" />
              )}
            </button>

            {/* Dropdown Menu 2: Sales & Billing */}
            {openHub === 'sales' && (
              <div className="absolute left-0 mt-2 w-72 sm:w-80 rounded-2xl bg-white dark:bg-slate-900 border border-amber-500/30 dark:border-amber-500/20 shadow-2xl p-2.5 space-y-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">
                  विक्री व बिलिंग मेनू (SALES & BILLING)
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setOpenHub(null);
                    onNewBill();
                  }}
                  className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-950/40 text-left transition cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <FilePlus className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                      <span>➕ New Bill / Tax Invoice</span>
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono font-bold">विक्री बिल</span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      नवीन विक्री बिल, GST, वॉरंटी व इनव्हॉईस
                    </p>
                  </div>
                </button>

                {onAllTransactions && (
                  <button
                    type="button"
                    onClick={() => {
                      setOpenHub(null);
                      onAllTransactions();
                    }}
                    className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        🕒 सर्व व्यवहार व बिले (All Transactions)
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        मागील सर्व बिले, पावत्या व तारीखवार नोंदी
                      </p>
                    </div>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setOpenHub(null);
                    onReceivePavti();
                  }}
                  className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-left transition cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                      <span>🧾 जमा पावती घ्या (Quick Pavti)</span>
                      <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono font-bold">उधारी जमा</span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      ग्राहकाकडून बिलाचे बाकी पैसे जमा करून पावती द्या
                    </p>
                  </div>
                </button>

                {onPurchases && (
                  <button
                    type="button"
                    onClick={() => {
                      setOpenHub(null);
                      onPurchases();
                    }}
                    className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-teal-50 dark:hover:bg-teal-950/40 text-left transition cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Package className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        📦 नवीन माल खरेदी (Purchases)
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        सप्लायर माल खरेदी बिल व स्टॉक आवक
                      </p>
                    </div>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 3. ग्राहक व उधारी (खातेवही हब) */}
          <div className="relative shrink-0 flex-1 sm:flex-initial">
            <button
              id="hub-btn-customer-khata"
              type="button"
              onClick={() => toggleHub('customer')}
              className={`w-full sm:w-auto flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-xs ${
                openHub === 'customer'
                  ? 'border-purple-500 bg-purple-100 dark:bg-purple-950/60 text-purple-900 dark:text-purple-100 ring-2 ring-purple-500/20'
                  : 'border-purple-500/40 bg-purple-50/80 dark:bg-purple-950/30 hover:bg-purple-100/70 text-purple-800 dark:text-purple-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <Users className="w-3.5 h-3.5" />
                </div>
                <div className="text-left leading-tight">
                  <div className="font-extrabold text-[12px] text-purple-950 dark:text-purple-100">
                    ग्राहक व उधारी
                  </div>
                  <div className="text-[9px] text-purple-700 dark:text-purple-300 font-semibold">
                    खातेवही हब
                  </div>
                </div>
              </div>
              {openHub === 'customer' ? (
                <ChevronUp className="w-3.5 h-3.5 text-purple-700 dark:text-purple-300 shrink-0" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-purple-700 dark:text-purple-300 shrink-0" />
              )}
            </button>

            {/* Dropdown Menu 3: Customer & Khata */}
            {openHub === 'customer' && (
              <div className="absolute left-0 mt-2 w-72 sm:w-80 rounded-2xl bg-white dark:bg-slate-900 border border-purple-500/30 dark:border-purple-500/20 shadow-2xl p-2.5 space-y-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">
                  ग्राहक व खातेवही मेनू (CUSTOMERS & KHATA)
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setOpenHub(null);
                    onCustomerLedger();
                  }}
                  className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-950/40 text-left transition cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                      <span>📖 ग्राहक खातेवही (Customer Ledger)</span>
                      <span className="text-[10px] text-purple-600 dark:text-purple-400 font-mono font-bold">खातावही</span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      प्रत्येक ग्राहकाचा तपशील, एकूण खरेदी, जमा व बाकी
                    </p>
                  </div>
                </button>

                {onCustomerDueList && (
                  <button
                    type="button"
                    onClick={() => {
                      setOpenHub(null);
                      onCustomerDueList();
                    }}
                    className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left transition cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                        <span>⚠️ थकबाकी यादी (Pending Due List)</span>
                        <span className="text-[10px] text-rose-600 font-bold">उधारी</span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        ज्या ग्राहकांकडे पैसे बाकी आहेत त्यांची वसुली यादी
                      </p>
                    </div>
                  </button>
                )}

                {onAllCustomers && (
                  <button
                    type="button"
                    onClick={() => {
                      setOpenHub(null);
                      onAllCustomers();
                    }}
                    className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/40 text-left transition cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Users className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        👥 सर्व ग्राहक डिरेक्टरी (Customer Directory)
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        संपूर्ण ग्राहक यादी, पत्ते, फोन नंबर व व्हॉट्सॲप
                      </p>
                    </div>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 4. फायनान्स ईएमआय (Bajaj / TVS हब) */}
          <div className="relative shrink-0 flex-1 sm:flex-initial">
            <button
              id="hub-btn-finance-emi"
              type="button"
              onClick={() => toggleHub('finance')}
              className={`w-full sm:w-auto flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-xs ${
                openHub === 'finance'
                  ? 'border-blue-500 bg-blue-100 dark:bg-blue-950/60 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/20'
                  : 'border-blue-500/40 bg-blue-50/80 dark:bg-blue-950/30 hover:bg-blue-100/70 text-blue-800 dark:text-blue-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <Calculator className="w-3.5 h-3.5" />
                </div>
                <div className="text-left leading-tight">
                  <div className="font-extrabold text-[12px] text-blue-950 dark:text-blue-100">
                    फायनान्स ईएमआय
                  </div>
                  <div className="text-[9px] text-blue-700 dark:text-blue-300 font-semibold">
                    Bajaj / TVS हब
                  </div>
                </div>
              </div>
              {openHub === 'finance' ? (
                <ChevronUp className="w-3.5 h-3.5 text-blue-700 dark:text-blue-300 shrink-0" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-blue-700 dark:text-blue-300 shrink-0" />
              )}
            </button>

            {/* Dropdown Menu 4: Finance & EMI */}
            {openHub === 'finance' && (
              <div className="absolute right-0 sm:left-0 mt-2 w-72 sm:w-80 rounded-2xl bg-white dark:bg-slate-900 border border-blue-500/30 dark:border-blue-500/20 shadow-2xl p-2.5 space-y-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span>फायनान्स ईएमआय मेनू (FINANCE & LOAN)</span>
                  <span className="text-[9px] text-blue-600 font-bold">0% EMI उपलब्ध</span>
                </div>

                {onFinanceCalc && (
                  <button
                    type="button"
                    onClick={() => {
                      setOpenHub(null);
                      onFinanceCalc();
                    }}
                    className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/40 text-left transition cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Calculator className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                        <span>🧮 Finance EMI Calculator</span>
                        <span className="text-[10px] bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 px-1.5 py-0.5 rounded font-mono font-bold">
                          कॅल्क्युलेटर
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        बजाज फायनान्स, TVS Credit, HDB, IDBI हप्ता व व्याज गणना
                      </p>
                    </div>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setOpenHub(null);
                    onNewBill();
                  }}
                  className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-left transition cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <BadgePercent className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      📝 हप्ता व डाऊनपेमेंट प्लॅन (EMI Plan)
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      फायनान्स ईएमआय तपशील थेट नवीन बिलामध्ये जोडा
                    </p>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
