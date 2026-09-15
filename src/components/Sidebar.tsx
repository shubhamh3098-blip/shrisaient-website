import React from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  Clock,
  Users,
  Package,
  ShoppingCart,
  UserCheck,
  ReceiptIndianRupee,
  Settings,
  Globe,
  Store,
  ChevronRight,
  CreditCard,
  Building2,
  FileSpreadsheet,
  Cloud,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Crown,
  LogOut,
  Lock,
  Download,
  Database,
  Sun,
  Moon,
  Award,
  Receipt
} from 'lucide-react';
import { ActiveTab, BusinessSettings, AuthUser } from '../types';
import { AppLogo } from './AppLogo';
import { useTheme } from '../context/ThemeContext';
import { ThemeToggle } from './ThemeToggle';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  settings: BusinessSettings;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
  cloudStatus?: 'idle' | 'syncing' | 'connected' | 'offline' | 'error';
  lastSyncedTime?: string;
  onManualSync?: () => void;
  currentUser?: AuthUser | null;
  onLogout?: () => void;
  onViewCustomerShop?: () => void;
  onOpenInstallModal?: () => void;
  onOpenCsvExport?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  settings,
  isOpenMobile,
  setIsOpenMobile,
  cloudStatus = 'connected',
  lastSyncedTime,
  onManualSync,
  currentUser,
  onLogout,
  onViewCustomerShop,
  onOpenInstallModal,
  onOpenCsvExport,
}) => {
  const { theme, toggleTheme } = useTheme();

  const mainNav = [
    { id: 'dashboard' as ActiveTab, title: 'Dashboard', marathi: 'डॅशबोर्ड', icon: LayoutDashboard },
    { id: 'add-entry' as ActiveTab, title: 'New Bill / Entry', marathi: 'नवीन बिल / पावती', icon: PlusCircle, hasDot: true },
    { id: 'all-entries' as ActiveTab, title: 'All Transactions', marathi: 'सर्व व्यवहार', icon: Clock },
    { id: 'bill-receipts' as ActiveTab, title: 'Bill Receipts', marathi: 'बिलाच्या जमा पावत्या', icon: Receipt, badge: '#1079' },
    { id: 'card-scheme' as ActiveTab, title: '30-Month Scheme', marathi: 'साप्ताहिक बचत योजना', icon: CreditCard, badge: '30-Mo' },
    { id: 'customers' as ActiveTab, title: 'Customer Khata', marathi: 'ग्राहक खातेवही', icon: Users },
    { id: 'stock' as ActiveTab, title: 'Stock & Inventory', marathi: 'स्टॉक व साहित्य', icon: Package },
    { id: 'purchases' as ActiveTab, title: 'Purchases', marathi: 'खरेदी नोंदी', icon: ShoppingCart },
    { id: 'dealer-ledger' as ActiveTab, title: 'Dealer Ledgers', marathi: 'डीलर खातेवही', icon: Building2, badge: 'Khata' },
    { id: 'csv-import' as ActiveTab, title: 'Excel Import', marathi: 'डेटा आयात', icon: FileSpreadsheet },
    { id: 'uploaded-data' as ActiveTab, title: 'Master Search', marathi: 'सर्व डेटा शोध', icon: Database, badge: 'Search' },
    { id: 'staff' as ActiveTab, title: 'Staff & Agents', marathi: 'कर्मचारी व एजंट', icon: UserCheck },
    { id: 'agent-commission' as ActiveTab, title: 'Agent Commission', marathi: 'एजंट कमिशन व डॅशबोर्ड', icon: Award, badge: '4%' },
    { id: 'expenses' as ActiveTab, title: 'Shop Expenses', marathi: 'दुकान खर्च', icon: ReceiptIndianRupee },
  ];

  const accountNav = [
    { 
      id: 'settings' as ActiveTab, 
      title: 'Settings', 
      marathi: 'सेटिंग्ज व बॅकअप', 
      icon: Settings,
      badge: currentUser?.role === 'staff' ? 'Admin' : undefined 
    },
  ];

  const handleSelect = (tab: ActiveTab) => {
    setActiveTab(tab);
    setIsOpenMobile(false);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setIsOpenMobile(false)}
        />
      )}

      <aside
        id="app-sidebar"
        className={`fixed lg:static top-0 left-0 bottom-0 z-50 w-64 bg-white dark:bg-[#0A1124] text-slate-700 dark:text-slate-300 flex flex-col justify-between transition-colors duration-300 ease-in-out border-r border-slate-200 dark:border-slate-800/60 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top brand header with Authentic App Logo */}
        <div>
          <div className="px-4 py-4 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-transparent flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <AppLogo size="sm" variant="iconOnly" />
              <div className="overflow-hidden">
                <h1 className="font-extrabold text-slate-900 dark:text-white text-sm tracking-tight truncate leading-snug uppercase" style={{ fontFamily: "'Cinzel', 'Playfair Display', serif" }}>
                  Shri Sai Ent
                </h1>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 font-mono tracking-tight truncate font-semibold">
                    Official Mobile App
                  </p>
                </div>
              </div>
            </div>

            {/* Day / Night Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Day (Light)' : 'Night (Dark)'} Mode`}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-300 transition-colors border border-slate-200 dark:border-slate-700/60 cursor-pointer flex items-center justify-center shrink-0"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-300 animate-spin-slow" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>
          </div>

          {/* Navigation links */}
          <div className="px-3 py-3 space-y-4 overflow-y-auto max-h-[calc(100vh-170px)]">
            {/* MAIN section */}
            <div>
              <div className="px-3 mb-2 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>MAIN ERP</span>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-normal tracking-normal">
                  इंग्रजी / मराठी
                </span>
              </div>
              <div className="space-y-1">
                {mainNav.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      id={`nav-btn-${item.id}`}
                      onClick={() => handleSelect(item.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-left transition-all cursor-pointer active:scale-98 ${
                        isActive
                          ? 'bg-[#00523f] text-white shadow-[0_4px_14px_rgba(0,82,63,0.35)]'
                          : 'text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'
                          }`}
                        />
                        <div className="truncate leading-tight">
                          <span className={`font-bold text-xs block ${isActive ? 'text-white' : 'text-slate-800 dark:text-slate-200'}`}>
                            {item.title}
                          </span>
                          <span className={`text-[10px] block font-normal ${isActive ? 'text-emerald-100 dark:text-emerald-200' : 'text-slate-500 dark:text-slate-400'}`}>
                            {item.marathi}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isActive && item.hasDot && (
                          <span className="w-2 h-2 rounded-full bg-emerald-300 shadow-xs"></span>
                        )}
                        {!isActive && item.badge && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ACCOUNT section */}
            <div>
              <p className="px-3 mb-2 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                SYSTEM
              </p>
              <div className="space-y-1">
                {accountNav.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      id={`nav-btn-${item.id}`}
                      onClick={() => handleSelect(item.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-left transition-all cursor-pointer active:scale-98 ${
                        isActive
                          ? 'bg-[#00523f] text-white shadow-[0_4px_14px_rgba(0,82,63,0.35)]'
                          : 'text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'
                          }`}
                        />
                        <div className="truncate leading-tight">
                          <span className={`font-bold text-xs block ${isActive ? 'text-white' : 'text-slate-800 dark:text-slate-200'}`}>
                            {item.title}
                          </span>
                          <span className={`text-[10px] block font-normal ${isActive ? 'text-emerald-100 dark:text-emerald-200' : 'text-slate-500 dark:text-slate-400'}`}>
                            {item.marathi}
                          </span>
                        </div>
                      </div>
                      {item.badge && (
                        <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}

                {onViewCustomerShop && (
                  <button
                    type="button"
                    onClick={() => {
                      onViewCustomerShop();
                      setIsOpenMobile(false);
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-full text-xs font-bold transition-all text-amber-700 dark:text-amber-300 hover:bg-amber-100/60 dark:hover:bg-amber-400/10 border border-amber-300 dark:border-amber-400/20 cursor-pointer mt-1"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Globe className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span className="truncate">ग्राहक स्टोअर (Live Shop)</span>
                    </div>
                    <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 shrink-0">
                      Live
                    </span>
                  </button>
                )}

                {/* In-app Mobile PWA Install */}
                {onOpenInstallModal && (
                  <button
                    id="sidebar-install-app-btn"
                    onClick={() => {
                      onOpenInstallModal();
                      setIsOpenMobile(false);
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100/60 dark:hover:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/20 cursor-pointer mt-1"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="truncate">मोबाईल ॲप (App)</span>
                    </div>
                    <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 shrink-0">
                      Install
                    </span>
                  </button>
                )}

                {/* CSV Data Export Modal Launcher */}
                {onOpenCsvExport && (
                  <button
                    id="sidebar-csv-export-btn"
                    type="button"
                    onClick={() => {
                      onOpenCsvExport();
                      setIsOpenMobile(false);
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-300/80 dark:border-emerald-700/60 cursor-pointer mt-1 shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <div className="truncate text-left leading-tight">
                        <span className="block truncate">CSV डेटा एक्सपोर्ट</span>
                        <span className="text-[9px] text-emerald-700/80 dark:text-emerald-400/80 block font-medium">
                          योजना, बिले, खरेदी व लेजर
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 text-[9px] font-bold rounded-md bg-emerald-600 text-white shrink-0 shadow-2xs">
                      Excel
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Cloud Sync Status Indicator */}
        <div className="px-3 py-2 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-[#070c1a]">
          <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs shadow-2xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="relative flex h-2 w-2 shrink-0">
                {cloudStatus === 'connected' && (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </>
                )}
                {cloudStatus === 'syncing' && (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400 animate-pulse"></span>
                )}
                {(cloudStatus === 'offline' || cloudStatus === 'error') && (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                )}
              </span>
              <div className="truncate">
                <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate flex items-center gap-1">
                  <Cloud className="w-3 h-3 text-blue-500 dark:text-blue-400" />
                  {cloudStatus === 'connected' && 'Cloud Synced (Live)'}
                  {cloudStatus === 'syncing' && 'Syncing Live...'}
                  {cloudStatus === 'offline' && 'Offline (Local)'}
                  {cloudStatus === 'error' && 'Sync Paused'}
                </p>
                <p className="text-[9px] text-slate-500 dark:text-slate-400 truncate">
                  Firestore Blaze Cloud • {lastSyncedTime ? `Synced ${lastSyncedTime}` : 'Real-time'}
                </p>
              </div>
            </div>
            {onManualSync && (
              <button
                type="button"
                onClick={onManualSync}
                title="Sync now with Cloud"
                className="p-1 rounded text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${cloudStatus === 'syncing' ? 'animate-spin text-blue-500' : ''}`} />
              </button>
            )}
          </div>
        </div>

        {/* Day / Night Tactile Switcher */}
        <div className="px-3 py-2 border-t border-slate-200 dark:border-slate-800/80 bg-slate-100/60 dark:bg-[#0a1224] flex items-center justify-between">
          <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 font-marathi">थीम (Day / Night)</span>
          <ThemeToggle size="sm" showLabel={true} />
        </div>

        {/* User profile footer with Role & Logout */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#080d1c]">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80">
            <div 
              onClick={() => {
                if (currentUser?.role !== 'staff') {
                  handleSelect('settings');
                }
              }}
              className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shadow text-white shrink-0 ${
                currentUser?.role === 'staff' 
                  ? 'bg-gradient-to-tr from-emerald-600 to-teal-600'
                  : 'bg-gradient-to-tr from-blue-600 to-indigo-600'
              }`}>
                {currentUser?.name ? currentUser.name[0].toUpperCase() : (settings.ownerName ? settings.ownerName[0].toUpperCase() : 'S')}
              </div>
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white tracking-wide truncate">
                    {currentUser?.name || settings.ownerName}
                  </p>
                  <span className={`px-1.5 py-0.2 text-[9px] font-bold rounded uppercase ${
                    currentUser?.role === 'staff'
                      ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                      : 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30'
                  }`}>
                    {currentUser?.role === 'staff' ? 'Staff' : 'Admin'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">
                  {currentUser?.email || settings.email || 'shrisaient.in'}
                </p>
              </div>
            </div>

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                title="Log out (लॉगआउट)"
                className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition cursor-pointer shrink-0 ml-1"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
