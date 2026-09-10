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
  Download
} from 'lucide-react';
import { ActiveTab, BusinessSettings, AuthUser } from '../types';
import { AppLogo } from './AppLogo';

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
}) => {
  const mainNav = [
    { id: 'dashboard' as ActiveTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'add-entry' as ActiveTab, label: 'Add Entry', icon: PlusCircle, hasDot: true },
    { id: 'all-entries' as ActiveTab, label: 'All Entries', icon: Clock },
    { id: 'card-scheme' as ActiveTab, label: 'Card Scheme (योजना)', icon: CreditCard, badge: '3 Schemes' },
    { id: 'customers' as ActiveTab, label: 'Customers (ग्राहक)', icon: Users },
    { id: 'stock' as ActiveTab, label: 'Stock', icon: Package },
    { id: 'purchases' as ActiveTab, label: 'Purchases (खरीद)', icon: ShoppingCart },
    { id: 'dealer-ledger' as ActiveTab, label: 'All Ledgers (खाता बही)', icon: Building2, badge: 'Dealers & Cards' },
    { id: 'csv-import' as ActiveTab, label: 'CSV Data Import', icon: FileSpreadsheet },
    { id: 'staff' as ActiveTab, label: 'Staff', icon: UserCheck },
    { id: 'expenses' as ActiveTab, label: 'Expenses', icon: ReceiptIndianRupee },
  ];


  const accountNav = [
    { 
      id: 'settings' as ActiveTab, 
      label: 'Settings', 
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
        className={`fixed lg:static top-0 left-0 bottom-0 z-50 w-64 bg-[#0A1124] text-slate-300 flex flex-col justify-between transition-transform duration-300 ease-in-out border-r border-slate-800/60 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top brand header with Authentic App Logo */}
        <div>
          <div className="px-4 py-4 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <AppLogo size="sm" variant="iconOnly" />
              <div className="overflow-hidden">
                <h1 className="font-extrabold text-white text-sm tracking-tight truncate leading-snug uppercase" style={{ fontFamily: "'Cinzel', 'Playfair Display', serif" }}>
                  Shri Sai Ent
                </h1>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <p className="text-[10px] text-amber-400/90 font-mono tracking-tight truncate">
                    Official Mobile App
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation links */}
          <div className="px-3 py-4 space-y-6 overflow-y-auto max-h-[calc(100vh-170px)]">
            {/* MAIN section */}
            <div>
              <p className="px-3 mb-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                MAIN
              </p>
              <div className="space-y-1">
                {mainNav.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      id={`nav-btn-${item.id}`}
                      onClick={() => handleSelect(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`w-4 h-4 ${
                            isActive ? 'text-white' : 'text-slate-400'
                          }`}
                        />
                        <span>{item.label}</span>
                      </div>
                      {isActive && item.hasDot && (
                        <span className="w-2 h-2 rounded-full bg-white shadow-sm"></span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ACCOUNT section */}
            <div>
              <p className="px-3 mb-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                ACCOUNT
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
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`w-4 h-4 ${
                            isActive ? 'text-white' : 'text-slate-400'
                          }`}
                        />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
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
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-amber-300 hover:text-amber-200 hover:bg-amber-400/10 border border-amber-400/20 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <Globe className="w-4 h-4 text-amber-400" />
                      <span>Customer Website</span>
                    </div>
                    <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-amber-400/20 text-amber-300">
                      Live Shop
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
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-emerald-300 hover:text-emerald-200 hover:bg-emerald-500/10 border border-emerald-500/20 cursor-pointer mt-1.5"
                  >
                    <div className="flex items-center gap-3">
                      <Download className="w-4 h-4 text-emerald-400" />
                      <span>मोबाईल ॲप (App)</span>
                    </div>
                    <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-emerald-500/20 text-emerald-300">
                      Install
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Cloud Sync Status Indicator */}
        <div className="px-3 py-2 border-t border-slate-800/80 bg-[#070c1a]">
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
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
                <p className="text-[11px] font-semibold text-slate-200 truncate flex items-center gap-1">
                  <Cloud className="w-3 h-3 text-blue-400" />
                  {cloudStatus === 'connected' && 'Cloud Synced'}
                  {cloudStatus === 'syncing' && 'Syncing Live...'}
                  {cloudStatus === 'offline' && 'Offline (Local)'}
                  {cloudStatus === 'error' && 'Sync Paused'}
                </p>
                <p className="text-[9px] text-slate-400 truncate">
                  Google Firestore • {lastSyncedTime ? `Synced ${lastSyncedTime}` : 'Real-time'}
                </p>
              </div>
            </div>
            {onManualSync && (
              <button
                type="button"
                onClick={onManualSync}
                title="Sync now with Cloud"
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${cloudStatus === 'syncing' ? 'animate-spin text-blue-400' : ''}`} />
              </button>
            )}
          </div>
        </div>

        {/* User profile footer with Role & Logout */}
        <div className="p-3 border-t border-slate-800/80 bg-[#080d1c]">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/40 border border-slate-800/80">
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
                  <p className="text-xs font-semibold text-white tracking-wide truncate">
                    {currentUser?.name || settings.ownerName}
                  </p>
                  <span className={`px-1.5 py-0.2 text-[9px] font-bold rounded uppercase ${
                    currentUser?.role === 'staff'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  }`}>
                    {currentUser?.role === 'staff' ? 'Staff' : 'Admin'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono truncate">
                  {currentUser?.email || settings.email || 'shrisaient.in'}
                </p>
              </div>
            </div>

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                title="Log out (लॉगआउट)"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 transition cursor-pointer shrink-0 ml-1"
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
