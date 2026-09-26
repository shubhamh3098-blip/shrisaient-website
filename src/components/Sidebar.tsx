import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  CreditCard,
  Users,
  Truck,
  Receipt,
  UserCheck,
  Settings,
  Sparkles,
  ChevronDown,
  ChevronRight,
  PlusCircle,
  FolderArchive,
  Award,
  FileSpreadsheet,
  FileText,
  X,
  Smartphone,
  PackagePlus,
  Trash2,
  Calculator,
  Store,
  BookOpen,
  Search,
  Layers,
  Coins,
  AlertTriangle,
  Wrench,
  Gift,
  HardDriveDownload,
  Trophy,
  Navigation,
  RotateCcw,
  Cake,
  TrendingUp,
  ShieldCheck,
  QrCode,
  ShieldAlert,
  Barcode
} from 'lucide-react';
import { StoreData } from '../types';
import { useTheme } from '../context/ThemeContext';
import { SaiLogo } from './common/SaiLogo';
import { GalaxyButton } from './common/GalaxyButton';

export type NavTab = 
  | 'dashboard'
  | 'add-entry'
  | 'master-search'
  | 'receipts'
  | 'pos'
  | 'inventory'
  | 'scheme'
  | 'customers'
  | 'finance-calc'
  | 'agent-commission'
  | 'all-transactions'
  | 'dealers'
  | 'expenses'
  | 'staff'
  | 'excel-import'
  | 'settings'
  | 'daily-closing'
  | 'scheme-defaulters'
  | 'dealer-pdc'
  | 'warranty-service'
  | 'festival-promo'
  | 'lucky-draw'
  | 'agent-leaderboard'
  | 'tempo-delivery'
  | 'route-beat'
  | 'exchange-calc'
  | 'crm-wishes'
  | 'landing-editor'
  | 'profit-loss'
  | 'gst-reports'
  | 'system-shield'
  | 'upi-collect'
  | 'dealer-po'
  | 'staff-payslip'
  | 'loyalty-program'
  | 'delivery-challan'
  | 'finance-tracker'
  | 'draw-machine'
  | 'credit-shield'
  | 'barcode-studio';

interface SidebarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  storeData: StoreData;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  onOpenFrontAddProduct?: () => void;
  onOpenMobileAgentHisab?: () => void;
  onOpenDataResetModal?: () => void;
  onOpenQuickHisab?: () => void;
  onOpenCustomerShowroom?: () => void;
  onOpenDailyBackupModal?: () => void;
}

interface NavItemConfig {
  id: NavTab;
  label: string;
  marathi: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number | null;
  badgeColor?: string;
}

interface HubSection {
  id: string;
  title: string;
  marathi: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  items: NavItemConfig[];
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentTab, 
  onTabChange, 
  storeData,
  isMobileOpen = false,
  onCloseMobile = () => {},
  onOpenFrontAddProduct,
  onOpenMobileAgentHisab,
  onOpenDataResetModal,
  onOpenQuickHisab,
  onOpenCustomerShowroom,
  onOpenDailyBackupModal,
}) => {
  const { isDayMode } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  // Compute badge counts
  const lowStockCount = storeData.stock.filter((s) => s.stockQty <= s.minAlertQty).length;
  const activeMembersCount = storeData.cardMembers.filter((m) => m.status === 'Active').length;
  const customersWithDues = storeData.customers.filter((c) => c.currentBalance > 0).length;
  const totalCustomerCount = storeData.customers.length;
  const totalReceiptsCount = storeData.billReceipts.length;

  // Define Apple Hub Sections (Decluttering: Grouping features logically inside parent modules)
  const hubSections: HubSection[] = useMemo(() => [
    {
      id: 'billing-hub',
      title: 'Billing & Sales',
      marathi: 'बिलिंग, विक्री व खाते',
      icon: ShoppingCart,
      accentColor: 'text-sky-400',
      items: [
        {
          id: 'pos',
          label: 'POS Invoice Terminal',
          marathi: 'पीओएस बिलिंग',
          icon: ShoppingCart,
          badge: 'Fast',
          badgeColor: isDayMode ? 'bg-sky-100 text-sky-800 border-sky-300' : 'bg-sky-500/20 text-sky-300 border-sky-500/30',
        },
        {
          id: 'upi-collect',
          label: 'Dynamic UPI QR Code',
          marathi: 'डायनॅमिक UPI QR कोड',
          icon: QrCode,
          badge: 'Live QR',
          badgeColor: isDayMode ? 'bg-purple-100 text-purple-800 border-purple-300' : 'bg-purple-500/20 text-purple-300 border-purple-500/30',
        },
        {
          id: 'add-entry',
          label: 'New Sale / Add Entry',
          marathi: 'नवीन विक्री नोंद',
          icon: PlusCircle,
        },
        {
          id: 'all-transactions',
          label: 'Sales Bills History',
          marathi: 'विक्री बिले',
          icon: FileText,
        },
        {
          id: 'receipts',
          label: 'Bill Receipts #1079',
          marathi: 'जमा पावत्या',
          icon: Receipt,
          badge: `${totalReceiptsCount}`,
          badgeColor: isDayMode ? 'bg-blue-100 text-blue-800 border-blue-300' : 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        },
        {
          id: 'customers',
          label: 'Customer Khata Book',
          marathi: 'उधारी खातेवही',
          icon: Users,
          badge: customersWithDues > 0 ? `${customersWithDues} Dues` : null,
          badgeColor: isDayMode ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        },
        {
          id: 'credit-shield',
          label: 'Customer 360 Credit Shield',
          marathi: 'क्रेडिट स्कोअर व रिस्क शील्ड',
          icon: ShieldAlert,
          badge: '360° Risk',
          badgeColor: isDayMode ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-rose-500/20 text-rose-300 border-rose-500/30',
        },
        {
          id: 'delivery-challan',
          label: 'Delivery Challan & Gate Pass',
          marathi: 'डिलिव्हरी चलान व गेट-पास',
          icon: Truck,
          badge: 'Challan',
          badgeColor: isDayMode ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        },
        {
          id: 'warranty-service',
          label: 'Warranty & Service',
          marathi: 'वॉरंटी व सर्व्हिस',
          icon: Wrench,
          badge: 'Alert',
          badgeColor: isDayMode ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        },
        {
          id: 'tempo-delivery',
          label: 'Tempo Delivery Sheet',
          marathi: 'टेम्पो डिलिव्हरी व वाहतूक',
          icon: Truck,
          badge: 'POD',
          badgeColor: isDayMode ? 'bg-blue-100 text-blue-800 border-blue-300' : 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        },
        {
          id: 'exchange-calc',
          label: 'Appliance Exchange Calc',
          marathi: 'जुने फर्निचर/उपकरण एक्सचेंज',
          icon: RotateCcw,
          badge: 'Offer',
          badgeColor: isDayMode ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        },
        {
          id: 'crm-wishes',
          label: 'Birthday & Anniversary VIP',
          marathi: 'वाढदिवस व ॲनिव्हर्सरी VIP CRM',
          icon: Cake,
          badge: 'VIP',
          badgeColor: isDayMode ? 'bg-purple-100 text-purple-800 border-purple-300' : 'bg-purple-500/20 text-purple-400 border-purple-500/30',
        },
        {
          id: 'master-search',
          label: 'Uploaded Master Data',
          marathi: 'मास्टर डेटा आर्काइव्ह',
          icon: FolderArchive,
          badge: `${totalCustomerCount}`,
          badgeColor: isDayMode ? 'bg-teal-100 text-teal-800 border-teal-300' : 'bg-teal-500/20 text-teal-400 border-teal-500/30',
        },
      ],
    },
    {
      id: 'scheme-hub',
      title: 'Scheme & Finance',
      marathi: '३० महिने योजना व फायनान्स',
      icon: CreditCard,
      accentColor: 'text-purple-400',
      items: [
        {
          id: 'scheme',
          label: '30-Month Scheme',
          marathi: 'कार्ड्स, हप्ते, ड्रॉ',
          icon: CreditCard,
          badge: `${activeMembersCount} Cards`,
          badgeColor: isDayMode ? 'bg-purple-100 text-purple-800 border-purple-300' : 'bg-purple-500/20 text-purple-400 border-purple-500/30',
        },
        {
          id: 'route-beat',
          label: 'Village Beat Route Planner',
          marathi: 'गाव व बीट रूट वसुली प्लॅनर',
          icon: Navigation,
          badge: 'Route',
          badgeColor: isDayMode ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        },
        {
          id: 'scheme-defaulters',
          label: 'Defaulters & Recovery',
          marathi: 'थकबाकीदार व तगादा',
          icon: AlertTriangle,
          badge: 'वसुली',
          badgeColor: isDayMode ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-rose-500/20 text-rose-300 border-rose-500/30',
        },
        {
          id: 'festival-promo',
          label: 'Festival Promo Maker',
          marathi: 'सणवार जाहिरात व बॅनर',
          icon: Gift,
          badge: 'पोस्टर',
          badgeColor: isDayMode ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        },
        {
          id: 'finance-calc',
          label: 'Finance EMI Calc',
          marathi: 'Bajaj / TVS / HDB',
          icon: Calculator,
          badge: '0% Fee',
          badgeColor: isDayMode ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        },
        {
          id: 'agent-commission',
          label: 'Agent 4% & Salary',
          marathi: 'एजंट कमिशन',
          icon: Award,
          badge: '4%',
          badgeColor: isDayMode ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        },
        {
          id: 'lucky-draw',
          label: 'Lucky Draw & Maturity',
          marathi: 'लकी ड्रॉ व मॅच्युरिटी',
          icon: Trophy,
          badge: 'Draw',
          badgeColor: isDayMode ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        },
        {
          id: 'draw-machine',
          label: 'Digital Lucky Draw Machine',
          marathi: 'पारदर्शक लकी ड्रॉ मशीन',
          icon: Trophy,
          badge: 'Live Spinner',
          badgeColor: isDayMode ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        },
        {
          id: 'finance-tracker',
          label: 'Bajaj/TVS EMI Case Tracker',
          marathi: 'बजाज व TVS ईएमआय ट्रॅकर',
          icon: CreditCard,
          badge: 'NBFC Pipeline',
          badgeColor: isDayMode ? 'bg-sky-100 text-sky-800 border-sky-300' : 'bg-sky-500/20 text-sky-300 border-sky-500/30',
        },
        {
          id: 'agent-leaderboard',
          label: 'Agent Leaderboard',
          marathi: 'एजंट रँकिंग व इन्सेंटिव्ह',
          icon: Trophy,
          badge: 'Top',
          badgeColor: isDayMode ? 'bg-purple-100 text-purple-800 border-purple-300' : 'bg-purple-500/20 text-purple-400 border-purple-500/30',
        },
      ],
    },
    {
      id: 'inventory-hub',
      title: 'Stock & Inventory',
      marathi: 'गोदाम साठा व खरेदी',
      icon: Boxes,
      accentColor: 'text-emerald-400',
      items: [
        {
          id: 'inventory',
          label: 'Inventory & Stock',
          marathi: 'गोदाम साठा',
          icon: Boxes,
          badge: lowStockCount > 0 ? `${lowStockCount} Low` : null,
          badgeColor: isDayMode ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-rose-500/20 text-rose-400 border-rose-500/30',
        },
        {
          id: 'dealers',
          label: 'Dealers & Purchases',
          marathi: 'खरेदी व डीलर',
          icon: Truck,
        },
        {
          id: 'dealer-po',
          label: 'Purchase Orders & Debit Notes',
          marathi: 'खरेदी मागणी व डेबिट नोट',
          icon: RotateCcw,
          badge: 'PO/Claim',
          badgeColor: isDayMode ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        },
        {
          id: 'dealer-pdc',
          label: 'Dealer PDC & Cheques',
          marathi: 'डीलर चेक व देय तारीख',
          icon: Truck,
          badge: '3-Days',
          badgeColor: isDayMode ? 'bg-blue-100 text-blue-800 border-blue-300' : 'bg-blue-500/20 text-blue-300 border-blue-500/30',
        },
        {
          id: 'barcode-studio',
          label: 'Barcode & Price Label Studio',
          marathi: 'बारकोड व किंमत लेबल स्टुडिओ',
          icon: Barcode,
          badge: 'Stickers',
          badgeColor: isDayMode ? 'bg-sky-100 text-sky-800 border-sky-300' : 'bg-sky-500/20 text-sky-300 border-sky-500/30',
        },
      ],
    },
    {
      id: 'showroom-hub',
      title: 'Storefront & Landing',
      marathi: 'शोरूम, लँडिंग पेज व ऑफर्स',
      icon: Store,
      accentColor: 'text-amber-400',
      items: [
        {
          id: 'landing-editor',
          label: 'Landing Page & Offers Editor',
          marathi: 'लँडिंग पेज व ऑफर्स एडिटर',
          icon: Store,
          badge: 'नवीन Live',
          badgeColor: isDayMode ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        },
      ],
    },
    {
      id: 'accounts-hub',
      title: 'Accounts & Settings',
      marathi: 'हिशोब व व्यवस्थापन',
      icon: Settings,
      accentColor: 'text-amber-400',
      items: [
        {
          id: 'daily-closing',
          label: 'Daily Cash Closing',
          marathi: 'दिवसाचा गल्ला बंद',
          icon: Coins,
          badge: 'Day-End',
          badgeColor: isDayMode ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        },
        {
          id: 'expenses',
          label: 'Day-Book & Expenses',
          marathi: 'दैनिक खर्च व कॅश',
          icon: BookOpen,
          badge: 'DayBook',
          badgeColor: isDayMode ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        },
        {
          id: 'staff',
          label: 'Staff & Advances',
          marathi: 'कर्मचारी पगार',
          icon: UserCheck,
        },
        {
          id: 'staff-payslip',
          label: 'Staff Attendance & Salary Slip',
          marathi: 'हजेरी व पगार पावती',
          icon: UserCheck,
          badge: 'Salary',
          badgeColor: isDayMode ? 'bg-blue-100 text-blue-800 border-blue-300' : 'bg-blue-500/20 text-blue-300 border-blue-500/30',
        },
        {
          id: 'excel-import',
          label: 'Excel / CSV Import',
          marathi: 'डेटा आयात',
          icon: FileSpreadsheet,
        },
        {
          id: 'settings',
          label: 'Settings & Backup',
          marathi: 'सेटिंग्ज व बॅकअप',
          icon: Settings,
        },
      ],
    },
    {
      id: 'analytics-hub',
      title: 'Business Health, Tax & Audit',
      marathi: 'नफा-तोटा, जीएसटी व सिस्टीम शील्ड',
      icon: TrendingUp,
      accentColor: 'text-emerald-400',
      items: [
        {
          id: 'profit-loss',
          label: 'P&L Profit & Loss Analytics',
          marathi: 'नफा-तोटा व मार्जिन',
          icon: TrendingUp,
          badge: 'P&L Live',
          badgeColor: isDayMode ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        },
        {
          id: 'gst-reports',
          label: 'GSTR-1, 3B & Tax Audit',
          marathi: 'जीएसटी अहवाल व CA फाइल',
          icon: FileSpreadsheet,
          badge: 'GST Center',
          badgeColor: isDayMode ? 'bg-sky-100 text-sky-800 border-sky-300' : 'bg-sky-500/20 text-sky-400 border-sky-500/30',
        },
        {
          id: 'system-shield',
          label: 'Stock Aging & System Shield',
          marathi: 'डेड-स्टॉक व डेटा अखंडता',
          icon: ShieldCheck,
          badge: 'Shield',
          badgeColor: isDayMode ? 'bg-teal-100 text-teal-800 border-teal-300' : 'bg-teal-500/20 text-teal-400 border-teal-500/30',
        },
        {
          id: 'loyalty-program',
          label: 'Loyalty Rewards & Referrals',
          marathi: 'रिवॉर्ड कॉइन्स व रेफरल बोनस',
          icon: Coins,
          badge: 'VIP Coins',
          badgeColor: isDayMode ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        },
      ],
    },
  ], [isDayMode, lowStockCount, activeMembersCount, customersWithDues, totalCustomerCount, totalReceiptsCount]);

  // Track expanded state for each hub (auto-expand hub holding currentTab by default)
  const [expandedHubs, setExpandedHubs] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {
      'billing-hub': true,
      'scheme-hub': true,
      'inventory-hub': true,
      'showroom-hub': true,
      'accounts-hub': false,
      'analytics-hub': true,
    };
    // Ensure active hub is expanded
    hubSections.forEach((hub) => {
      if (hub.items.some((i) => i.id === currentTab)) {
        initial[hub.id] = true;
      }
    });
    return initial;
  });

  // Automatically expand hub when currentTab changes
  useEffect(() => {
    hubSections.forEach((hub) => {
      if (hub.items.some((i) => i.id === currentTab)) {
        setExpandedHubs((prev) => (prev[hub.id] ? prev : { ...prev, [hub.id]: true }));
      }
    });
  }, [currentTab, hubSections]);

  const toggleHub = (hubId: string) => {
    setExpandedHubs((prev) => ({ ...prev, [hubId]: !prev[hubId] }));
  };

  const handleSelectTab = (id: NavTab) => {
    onTabChange(id);
    onCloseMobile();
  };

  // Filtered Hubs based on search query
  const filteredHubs = useMemo(() => {
    if (!searchQuery.trim()) return hubSections;
    const q = searchQuery.toLowerCase().trim();
    return hubSections.map((hub) => {
      const filteredItems = hub.items.filter(
        (item) =>
          item.label.toLowerCase().includes(q) ||
          item.marathi.toLowerCase().includes(q)
      );
      return {
        ...hub,
        items: filteredItems,
      };
    }).filter((hub) => hub.items.length > 0);
  }, [hubSections, searchQuery]);

  const sidebarContent = (
    <div className={`flex flex-col h-full select-none apple-glass-panel ${
      isDayMode
        ? 'bg-white/85 border-r border-slate-200/90 text-slate-800'
        : 'bg-[#070b18]/85 border-r border-sky-500/20 text-slate-100'
    }`}>
      {/* Mobile Header with close button */}
      <div className="flex md:hidden items-center justify-between p-3.5 border-b border-slate-200 dark:border-white/10">
        <div className="flex items-center gap-2 font-bold text-sm">
          <SaiLogo size="sm" glow={!isDayMode} />
          <span>Shri Sai ERP <span className="text-[11px] font-normal opacity-75">(मेनू)</span></span>
        </div>
        <button
          onClick={onCloseMobile}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Instant Search Filter for Decluttering & Fast Access */}
      <div className="p-3 pb-2">
        <div className={`relative flex items-center rounded-xl border px-2.5 py-1.5 transition-all ${
          isDayMode
            ? 'bg-slate-100/90 border-slate-200 text-slate-900 focus-within:border-sky-400 focus-within:bg-white'
            : 'bg-slate-900/80 border-white/10 text-slate-100 focus-within:border-sky-400 focus-within:bg-slate-900'
        }`}>
          <Search className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
          <input
            type="text"
            placeholder="Search module... (शोधा)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs outline-none placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-slate-400 hover:text-slate-200 p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Main Navigation Area (Structured Apple Hubs) */}
      <div className="px-2.5 space-y-2 overflow-y-auto flex-1 no-scrollbar pb-6">
        {/* 1. Dashboard (Top Primary Anchor) */}
        {!searchQuery && (
          <button
            id="nav-tab-dashboard"
            onClick={() => handleSelectTab('dashboard')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
              currentTab === 'dashboard'
                ? isDayMode
                  ? 'bg-sky-600 text-white shadow-sm font-bold'
                  : 'bg-sky-500/25 text-sky-200 border border-sky-400/50 shadow-sm font-bold'
                : isDayMode
                ? 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <LayoutDashboard className={`w-4 h-4 shrink-0 ${
                currentTab === 'dashboard'
                  ? isDayMode ? 'text-white' : 'text-sky-300'
                  : 'text-sky-500'
              }`} />
              <span>Dashboard <span className="text-[10px] font-normal opacity-85">(डॅशबोर्ड)</span></span>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium ${
              currentTab === 'dashboard'
                ? isDayMode ? 'bg-white/25 text-white' : 'bg-sky-500/30 text-sky-200'
                : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}>
              Home
            </span>
          </button>
        )}

        {/* 2. Structured Apple Hubs (Grouped Features) */}
        <div className="space-y-2 pt-1">
          {filteredHubs.map((hub) => {
            const HubIcon = hub.icon;
            const isExpanded = expandedHubs[hub.id] || searchQuery.length > 0;
            const hasActiveChild = hub.items.some((i) => i.id === currentTab);

            return (
              <div
                key={hub.id}
                className={`rounded-2xl transition-all duration-200 border ${
                  hasActiveChild
                    ? isDayMode
                      ? 'border-sky-200 bg-sky-50/40'
                      : 'border-sky-500/25 bg-sky-500/[0.03]'
                    : isDayMode
                    ? 'border-transparent hover:border-slate-200/80 bg-slate-50/50'
                    : 'border-transparent hover:border-white/5 bg-white/[0.01]'
                }`}
              >
                {/* Hub Header Toggle */}
                <button
                  type="button"
                  onClick={() => toggleHub(hub.id)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold cursor-pointer group transition-colors"
                >
                  <div className="flex items-center gap-2 truncate">
                    <HubIcon className={`w-4 h-4 shrink-0 ${hub.accentColor}`} />
                    <span className="truncate text-left text-slate-800 dark:text-slate-200 font-bold">
                      {hub.title}
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal hidden lg:inline">
                      ({hub.marathi})
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                      {hub.items.length}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </button>

                {/* Sub-Features nested cleanly inside the Hub */}
                {isExpanded && (
                  <div className="px-1.5 pb-2 pt-0.5 space-y-0.5">
                    {hub.items.map((item) => {
                      const ItemIcon = item.icon;
                      const isActive = currentTab === item.id;

                      return (
                        <button
                          key={item.id}
                          id={`nav-tab-${item.id}`}
                          onClick={() => handleSelectTab(item.id)}
                          className={`w-full flex items-center justify-between pl-6 pr-2.5 py-2 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer group ${
                            isActive
                              ? isDayMode
                                ? 'bg-sky-500/15 text-sky-950 font-bold border-l-2 border-sky-600 shadow-sm'
                                : 'bg-sky-500/20 text-sky-200 font-bold border-l-2 border-sky-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]'
                              : isDayMode
                              ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                              : 'text-slate-400 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <ItemIcon
                              className={`w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-110 ${
                                isActive
                                  ? isDayMode ? 'text-sky-600' : 'text-sky-300'
                                  : 'text-slate-400 group-hover:text-slate-300'
                              }`}
                            />
                            <span className="truncate text-left">
                              {item.label}
                            </span>
                          </div>

                          {item.badge && (
                            <span
                              className={`text-[9px] font-semibold px-1.5 py-0.2 rounded-full border ${
                                isActive
                                  ? isDayMode ? 'bg-sky-200 text-sky-900 border-sky-300' : 'bg-sky-400 text-slate-950 border-sky-300'
                                  : item.badgeColor || 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-transparent'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 3. Compact Apple Quick Actions Capsule */}
        {!searchQuery && (onOpenQuickHisab || onOpenCustomerShowroom || onOpenMobileAgentHisab || onOpenFrontAddProduct) && (
          <div className="pt-2 border-t border-slate-200/80 dark:border-white/10 space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-0.5 flex items-center justify-between">
              <span>Quick Launch (जलद साधने)</span>
              <Sparkles className="w-3 h-3 text-amber-400" />
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {onOpenQuickHisab && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenQuickHisab();
                    if (isMobileOpen) onCloseMobile();
                  }}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl text-[11px] font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/20 transition cursor-pointer active:scale-95"
                  title="Rapid Scratchpad"
                >
                  <Calculator className="w-3 h-3 text-amber-400 shrink-0" />
                  <span className="truncate">⚡ Rapid Hisab</span>
                </button>
              )}

              {onOpenCustomerShowroom && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenCustomerShowroom();
                    if (isMobileOpen) onCloseMobile();
                  }}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl text-[11px] font-semibold bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/20 transition cursor-pointer active:scale-95"
                  title="Customer Showroom"
                >
                  <Store className="w-3 h-3 text-purple-400 shrink-0" />
                  <span className="truncate">🏪 Showroom</span>
                </button>
              )}

              {onOpenMobileAgentHisab && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenMobileAgentHisab();
                    if (isMobileOpen) onCloseMobile();
                  }}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl text-[11px] font-semibold bg-sky-500/10 hover:bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/20 transition cursor-pointer active:scale-95"
                  title="Mobile Agent Portal"
                >
                  <Smartphone className="w-3 h-3 text-sky-400 shrink-0" />
                  <span className="truncate">📱 Agent Hisab</span>
                </button>
              )}

              {onOpenFrontAddProduct && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenFrontAddProduct();
                    if (isMobileOpen) onCloseMobile();
                  }}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl text-[11px] font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 transition cursor-pointer active:scale-95"
                  title="Add Product"
                >
                  <PackagePlus className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span className="truncate">+ Product</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 1-Click Daily Night Backup Vault Button */}
      {onOpenDailyBackupModal && (
        <div className="px-3 py-1.5 border-t border-slate-200/60 dark:border-white/10">
          <button
            type="button"
            onClick={() => {
              onOpenDailyBackupModal();
              if (isMobileOpen) onCloseMobile();
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-black bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30 transition cursor-pointer active:scale-95 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <HardDriveDownload className="w-4 h-4 text-amber-500 shrink-0" />
              <span>💾 १-क्लिक सुरक्षित बॅकअप</span>
            </div>
            <span className="text-[10px] bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded font-black">
              Safe
            </span>
          </button>
        </div>
      )}

      {/* Data Reset & Zero Quota CSV Button */}
      {onOpenDataResetModal && (
        <div className="px-3 py-2 border-t border-slate-200/60 dark:border-white/10">
          <button
            type="button"
            onClick={onOpenDataResetModal}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 transition cursor-pointer active:scale-95"
          >
            <div className="flex items-center gap-2">
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              <span>डेटा रीसेट व CSV</span>
            </div>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded font-mono">
              0% Quota
            </span>
          </button>
        </div>
      )}

      {/* Showroom Status Footer */}
      <div className={`p-3 border-t text-xs ${
        isDayMode
          ? 'border-slate-200/80 bg-slate-50/80 text-slate-600'
          : 'border-white/10 bg-slate-950/40 text-slate-400'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold text-slate-800 dark:text-slate-200">Shri Sai Wardha</span>
          </div>
          <span className="font-mono text-[10px] opacity-75">#{storeData.settings.nextReceiptNo || 1079}</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:block w-64 h-[calc(100vh-57px)] shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-Over Drawer with Backdrop */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
