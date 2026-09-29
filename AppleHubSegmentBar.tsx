import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  PlusCircle,
  FileText,
  Receipt,
  Users,
  FolderArchive,
  CreditCard,
  Calculator,
  Award,
  Boxes,
  Truck,
  BookOpen,
  UserCheck,
  FileSpreadsheet,
  Settings,
  ChevronRight,
  Sparkles,
  Coins,
  AlertTriangle,
  Wrench,
  Gift,
  Trophy,
  Navigation,
  RotateCcw,
  Cake,
  Store,
  TrendingUp,
  ShieldCheck,
  ShieldAlert,
  Barcode,
  QrCode
} from 'lucide-react';
import { NavTab } from '../Sidebar';
import { useTheme } from '../../context/ThemeContext';

interface AppleHubSegmentBarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export interface HubGroup {
  id: string;
  title: string;
  marathi: string;
  tabs: {
    id: NavTab;
    label: string;
    marathi: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }[];
}

export const HUB_GROUPS: HubGroup[] = [
  {
    id: 'billing',
    title: 'Billing & Sales Hub',
    marathi: 'बिलिंग, विक्री व खाते',
    tabs: [
      { id: 'pos', label: 'POS Terminal', marathi: 'पीओएस', icon: ShoppingCart, badge: 'Fast' },
      { id: 'add-entry', label: 'New Sale', marathi: '+ बिल', icon: PlusCircle },
      { id: 'all-transactions', label: 'Bills History', marathi: 'विक्री बिले', icon: FileText },
      { id: 'receipts', label: 'Receipts #1079', marathi: 'पावत्या', icon: Receipt },
      { id: 'customers', label: 'Khata Book', marathi: 'खातेवही', icon: Users },
      { id: 'credit-shield', label: 'Credit Shield 360', marathi: 'क्रेडिट स्कोअर', icon: ShieldAlert, badge: 'Risk' },
      { id: 'delivery-challan', label: 'Delivery Challan & E-Way', marathi: 'डिलिव्हरी चॅलन', icon: Truck, badge: 'GatePass' },
      { id: 'tempo-delivery', label: 'Tempo Delivery', marathi: 'टेम्पो डिलिव्हरी', icon: Truck, badge: 'POD' },
      { id: 'exchange-calc', label: 'Exchange Calc', marathi: 'एक्सचेंज', icon: RotateCcw, badge: 'Offer' },
      { id: 'crm-wishes', label: 'VIP Wishes CRM', marathi: 'वाढदिवस VIP', icon: Cake, badge: 'Voucher' },
      { id: 'warranty-service', label: 'Warranty & Service', marathi: 'वॉरंटी', icon: Wrench, badge: 'Alert' },
      { id: 'master-search', label: 'Master Data', marathi: 'आर्काइव्ह', icon: FolderArchive },
    ],
  },
  {
    id: 'scheme',
    title: '30-Month Scheme & Finance Hub',
    marathi: 'बचत योजना व फायनान्स',
    tabs: [
      { id: 'scheme', label: '30-Mo Scheme', marathi: 'कार्ड्स व ड्रॉ', icon: CreditCard },
      { id: 'draw-machine', label: 'Lucky Draw Machine', marathi: 'डिजिटल लकी ड्रॉ', icon: Trophy, badge: 'Live Draw' },
      { id: 'finance-tracker', label: 'Bajaj / TVS EMI Tracker', marathi: 'फायनान्स ट्रॅकर', icon: CreditCard, badge: '0% EMI' },
      { id: 'route-beat', label: 'Route Beat Planner', marathi: 'बीट रूट', icon: Navigation, badge: 'Route' },
      { id: 'scheme-defaulters', label: 'Defaulters & Recovery', marathi: 'थकबाकीदार', icon: AlertTriangle, badge: 'वसुली' },
      { id: 'festival-promo', label: 'Festival Promo AI', marathi: 'जाहिरात AI', icon: Gift, badge: 'AI' },
      { id: 'finance-calc', label: 'Finance EMI Calc', marathi: 'Bajaj / TVS', icon: Calculator, badge: '0% Fee' },
      { id: 'agent-commission', label: 'Agent 4% & Salary', marathi: 'कमिशन', icon: Award },
      { id: 'lucky-draw', label: 'Lucky Draw & Maturity', marathi: 'लकी ड्रॉ', icon: Trophy, badge: 'Draw' },
      { id: 'agent-leaderboard', label: 'Agent Ranking', marathi: 'लीडरबोर्ड', icon: Trophy, badge: 'Top' },
    ],
  },
  {
    id: 'inventory',
    title: 'Stock & Inventory Hub',
    marathi: 'गोदाम साठा व खरेदी',
    tabs: [
      { id: 'inventory', label: 'Stock Catalog', marathi: 'गोदाम साठा', icon: Boxes },
      { id: 'barcode-studio', label: 'Barcode Label Studio', marathi: 'बारकोड स्टिकर', icon: Barcode, badge: 'Print' },
      { id: 'dealers', label: 'Dealers & Purchases', marathi: 'खरेदी व डीलर', icon: Truck },
      { id: 'dealer-po', label: 'Purchase Orders (PO)', marathi: 'खरेदी ऑर्डर', icon: FileSpreadsheet, badge: 'PO' },
      { id: 'dealer-pdc', label: 'Dealer PDC Alert', marathi: 'चेक अलर्ट', icon: Truck, badge: '3-Days' },
    ],
  },
  {
    id: 'showroom',
    title: 'Showroom & Landing Hub',
    marathi: 'शोरूम व लँडिंग पेज',
    tabs: [
      { id: 'landing-editor', label: 'Landing Page & Offers Editor', marathi: 'लँडिंग पेज व ऑफर्स', icon: Store, badge: 'Live' },
    ],
  },
  {
    id: 'accounts',
    title: 'Accounts & Settings Hub',
    marathi: 'हिशोब व व्यवस्थापन',
    tabs: [
      { id: 'daily-closing', label: 'Daily Cash Closing', marathi: 'गल्ला बंद', icon: Coins, badge: 'Day-End' },
      { id: 'expenses', label: 'Day-Book & Expenses', marathi: 'दैनिक खर्च', icon: BookOpen },
      { id: 'upi-collect', label: 'Dynamic UPI QR', marathi: 'काऊंटर QR', icon: QrCode, badge: 'UPI' },
      { id: 'staff', label: 'Staff & Advances', marathi: 'कर्मचारी पगार', icon: UserCheck },
      { id: 'staff-payslip', label: 'Staff Attendance & Salary', marathi: 'हजेरी व पगार पावती', icon: UserCheck, badge: 'Payslip' },
      { id: 'excel-import', label: 'Excel Import', marathi: 'डेटा आयात', icon: FileSpreadsheet },
      { id: 'settings', label: 'Settings & Backup', marathi: 'सेटिंग्ज', icon: Settings },
    ],
  },
  {
    id: 'analytics',
    title: 'Business Health, Tax & Shield',
    marathi: 'नफा-तोटा, कर व सिस्टीम शील्ड',
    tabs: [
      { id: 'profit-loss', label: 'P&L Profit & Loss', marathi: 'नफा-तोटा', icon: TrendingUp, badge: 'P&L' },
      { id: 'gst-reports', label: 'GSTR-1, 3B & Tax Audit', marathi: 'जीएसटी अहवाल', icon: FileSpreadsheet, badge: 'GST' },
      { id: 'system-shield', label: 'Stock Aging & System Shield', marathi: 'सिस्टीम शील्ड', icon: ShieldCheck, badge: 'Shield' },
      { id: 'loyalty-program', label: 'Loyalty Rewards & Referrals', marathi: 'रिवॉर्ड कॉइन्स', icon: Coins, badge: 'VIP' },
    ],
  },
];

export const AppleHubSegmentBar: React.FC<AppleHubSegmentBarProps> = ({
  currentTab,
  onSelectTab,
}) => {
  const { isDayMode } = useTheme();

  // Find which hub group currentTab belongs to
  const currentHub = HUB_GROUPS.find((group) =>
    group.tabs.some((t) => t.id === currentTab)
  );

  // If on dashboard, don't show the secondary sub-bar (keeps dashboard completely clean)
  if (!currentHub) {
    return null;
  }

  return (
    <div className="mb-2.5 sm:mb-4">
      <div
        className={`p-1.5 sm:p-2 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-1.5 sm:gap-2 backdrop-blur-xl border transition-all ${
          isDayMode
            ? 'bg-white/85 border-slate-200/90 shadow-[inset_0_1px_2px_rgba(255,255,255,1),0_4px_12px_rgba(15,23,42,0.04)]'
            : 'bg-slate-900/70 border-sky-500/20 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.15),0_8px_24px_rgba(0,0,0,0.35)]'
        }`}
      >
        {/* Hub Category Label */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 sm:px-3 sm:py-1 shrink-0">
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
          <span className="text-xs font-black uppercase tracking-wider text-sky-500 dark:text-sky-400">
            {currentHub.title}
          </span>
          <span className="text-[11px] text-slate-400 font-normal hidden sm:inline">
            ({currentHub.marathi})
          </span>
        </div>

        {/* Apple Segment Pill Bar */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1 px-1 bg-slate-100/80 dark:bg-slate-950/60 rounded-xl border border-slate-200/60 dark:border-white/5 touch-pan-x">
          {currentHub.tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`apple-segment-item group relative flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-all shrink-0 min-h-[36px] sm:min-h-0 ${
                  isActive
                    ? isDayMode
                      ? 'bg-white text-sky-900 shadow-sm border border-sky-300 font-bold'
                      : 'bg-sky-500/25 text-sky-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] border border-sky-400/50 font-bold'
                    : isDayMode
                    ? 'text-slate-600 hover:text-slate-950 hover:bg-white/60'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 transition-transform group-hover:scale-110 ${
                    isActive
                      ? isDayMode
                        ? 'text-sky-600'
                        : 'text-sky-300'
                      : 'text-slate-400 group-hover:text-slate-300'
                  }`}
                />
                <span>
                  {tab.label}{' '}
                  <span
                    className={`text-[10px] font-normal ${
                      isActive ? 'opacity-85' : 'opacity-60'
                    }`}
                  >
                    ({tab.marathi})
                  </span>
                </span>

                {tab.badge && (
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full border ${
                      isActive
                        ? 'bg-sky-500 text-white border-sky-400'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
