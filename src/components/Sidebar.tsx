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
  Database,
  Cloud,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Crown,
  LogOut,
  Lock,
  Download,
  Award
} from 'lucide-react';
import { ActiveTab, BusinessSettings, AuthUser } from '../types';
import { AppLogo } from './AppLogo';
import { DayNightToggle } from './DayNightToggle';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  settings: BusinessSettings;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
  cloudStatus?: 'idle' | 'syncing' | 'connected' | 'offline' | 'error' | 'quota-exceeded';
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
    { id: 'dashboard' as ActiveTab, label: 'Dashboard', mrLabel: 'डॅशबोर्ड', icon: LayoutDashboard },
    { id: 'add-entry' as ActiveTab, label: 'New Bill / Entry', mrLabel: 'नवीन बिल / पावती', icon: PlusCircle, hasDot: true },
    { id: 'all-entries' as ActiveTab, label: 'All Transactions', mrLabel: 'सर्व व्यवहार', icon: Clock },
    { id: 'card-scheme' as ActiveTab, label: '30-Month Scheme', mrLabel: 'साप्ताहिक बचत योजना', icon: CreditCard, badge: '30-Mo' },
    { id: 'agent-hisab' as ActiveTab, label: 'Agent Hisab & 4%', mrLabel: 'एजंट हिशोब व कमिशन', icon: Award, badge: '4%+₹50' },
    { id: 'customers' as ActiveTab, label: 'Customer Khata', mrLabel: 'ग्राहक खातेवही', icon: Users },
    { id: 'stock' as ActiveTab, label: 'Stock & Inventory', mrLabel: 'स्टॉक व साहित्य', icon: Package },
    { id: 'purchases' as ActiveTab, label: 'Purchases', mrLabel: 'खरेदी नोंदी', icon: ShoppingCart },
    { id: 'dealer-ledger' as ActiveTab, label: 'Dealer Ledgers', mrLabel: 'डीलर खातेवही', icon: Building2, badge: 'Khata' },
    { id: 'csv-import' as ActiveTab, label: 'Excel Import', mrLabel: 'डेटा आयात', icon: FileSpreadsheet },
    { id: 'uploaded-data' as ActiveTab, label: 'Master Search', mrLabel: 'सर्व डेटा शोध', icon: Database, badge: 'Search' },
    { id: 'staff' as ActiveTab, label: 'Staff & Agents', mrLabel: 'कर्मचारी व एजंट', icon: UserCheck },
    { id: 'expenses' as ActiveTab, label: 'Shop Expenses', mrLabel: 'दुकान खर्च', icon: ReceiptIndianRupee },
  ];

  const accountNav = [
    { 
      id: 'settings' as ActiveTab, 
      label: 'Business Settings', 
      mrLabel: 'दुकान सेटिंग्ज',
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
        className={`fixed lg:static top-0 left-0 bottom-0 z-50 w-64 tactile-card rounded-none border-y-0 border-l-0 border-r border-[var(--tactile-border)] flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top brand header with Authentic App Logo */}
        <div>
          <div className="px-4 py-4 border-b border-[var(--tactile-border-subtle)] flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <AppLogo size="sm" variant="iconOnly" />
              <div className="overflow-hidden">
                <h1 className="font-extrabold text-[var(--tactile-text-heading)] text-sm tracking-tight truncate leading-snug uppercase" style={{ fontFamily: "'Cinzel', 'Playfair Display', serif" }}>
                  Shri Sai Ent
                </h1>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <p className="text-[10px] text-[var(--tactile-primary)] font-mono tracking-tight font-bold truncate">
                    Official ERP & Khata
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation links */}
          <div className="px-3 py-4 space-y-5 overflow-y-auto max-h-[calc(100vh-210px)]">
            {/* MAIN section */}
            <div>
              <p className="px-3 mb-2 text-[10px] font-bold text-[var(--tactile-text-dim)] uppercase tracking-wider flex items-center justify-between">
                <span>MAIN ERP</span>
                <span className="text-[9px] font-normal lowercase tracking-normal">इंग्रजी / मराठी</span>
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
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer ${
                        isActive
                          ? 'tactile-btn-primary font-bold shadow-md'
                          : 'text-[var(--tactile-text-muted)] hover:text-[var(--tactile-text-main)] hover:bg-[var(--tactile-surface-inset)]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isActive ? 'text-white' : 'text-[var(--tactile-text-muted)]'
                          }`}
                        />
                        <div className="flex flex-col items-start text-left min-w-0">
                          <span className="text-xs font-semibold leading-tight truncate">{item.label}</span>
                          <span className={`text-[10px] font-medium leading-tight truncate ${isActive ? 'text-white/85' : 'text-[var(--tactile-text-dim)]'}`}>
                            {item.mrLabel}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.badge && (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                            isActive ? 'bg-white/20 text-white' : 'bg-[var(--tactile-surface-inset)] text-[var(--tactile-text-muted)] border border-[var(--tactile-border-subtle)]'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                        {isActive && item.hasDot && (
                          <span className="w-1.5 h-1.5 rounded-full bg-white shadow-xs"></span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ACCOUNT section */}
            <div>
              <p className="px-3 mb-2 text-[10px] font-bold text-[var(--tactile-text-dim)] uppercase tracking-wider">
                MANAGEMENT
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
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer ${
                        isActive
                          ? 'tactile-btn-primary font-bold shadow-md'
                          : 'text-[var(--tactile-text-muted)] hover:text-[var(--tactile-text-main)] hover:bg-[var(--tactile-surface-inset)]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isActive ? 'text-white' : 'text-[var(--tactile-text-muted)]'
                          }`}
                        />
                        <div className="flex flex-col items-start text-left min-w-0">
                          <span className="text-xs font-semibold leading-tight truncate">{item.label}</span>
                          <span className={`text-[10px] font-medium leading-tight truncate ${isActive ? 'text-white/85' : 'text-[var(--tactile-text-dim)]'}`}>
                            {item.mrLabel}
                          </span>
                        </div>
                      </div>
                      {item.badge && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-amber-500/20 text-amber-600 border border-amber-500/30">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Day / Night Theme Toggle in Sidebar */}
            <div className="pt-2">
              <div className="px-3 py-2 rounded-xl tactile-inset flex items-center justify-between">
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold text-[var(--tactile-text-main)]">
                    Theme Mode
                  </span>
                  <span className="text-[10px] text-[var(--tactile-text-dim)]">
                    दिवस / रात्र मोड
                  </span>
                </div>
                <DayNightToggle id="sidebar-daynight-toggle" size="sm" showLabel={false} />
              </div>
            </div>

                {onViewCustomerShop && (
                  <button
                    type="button"
                    onClick={() => {
                      onViewCustomerShop();
                      setIsOpenMobile(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-amber-600 dark:text-amber-300 hover:bg-amber-500/10 border border-amber-500/30 cursor-pointer mt-2"
                  >
                    <div className="flex items-center gap-3">
                      <Globe className="w-4 h-4 text-amber-500" />
                      <span>Customer Website</span>
                    </div>
                    <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-amber-500/20 text-amber-600 dark:text-amber-300">
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
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 border border-emerald-500/30 cursor-pointer mt-1.5"
                  >
                    <div className="flex items-center gap-3">
                      <Download className="w-4 h-4 text-emerald-500" />
                      <span>मोबाईल ॲप (App)</span>
                    </div>
                    <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                      Install
                    </span>
                  </button>
                )}
              </div>
            </div>

        {/* Cloud Sync Status Indicator */}
        <div className="px-3 py-2 border-t border-[var(--tactile-border-subtle)]">
          <div className="flex items-center justify-between p-2 rounded-xl tactile-inset text-xs">
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
                {cloudStatus === 'quota-exceeded' && (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
                )}
                {(cloudStatus === 'offline' || cloudStatus === 'error') && (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                )}
              </span>
              <div className="truncate">
                <p className="text-[11px] font-semibold text-[var(--tactile-text-main)] truncate flex items-center gap-1">
                  <Cloud className="w-3 h-3 text-[var(--tactile-primary)]" />
                  {cloudStatus === 'connected' && 'Cloud Synced'}
                  {cloudStatus === 'syncing' && 'Syncing Live...'}
                  {cloudStatus === 'quota-exceeded' && 'Local Safe (Daily Quota)'}
                  {cloudStatus === 'offline' && 'Offline (Local)'}
                  {cloudStatus === 'error' && 'Sync Paused'}
                </p>
                <p className="text-[9px] text-[var(--tactile-text-muted)] truncate">
                  {cloudStatus === 'quota-exceeded' ? '100% saved locally • Resets daily' : `Google Firestore • ${lastSyncedTime ? `Synced ${lastSyncedTime}` : 'Real-time'}`}
                </p>
              </div>
            </div>
            {onManualSync && (
              <button
                type="button"
                onClick={onManualSync}
                title="Sync now with Cloud"
                className="p-1 rounded text-[var(--tactile-text-muted)] hover:text-[var(--tactile-text-main)] transition cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${cloudStatus === 'syncing' ? 'animate-spin text-[var(--tactile-primary)]' : ''}`} />
              </button>
            )}
          </div>
        </div>

        {/* User profile footer with Role & Logout */}
        <div className="p-3 border-t border-[var(--tactile-border-subtle)]">
          <div className="flex items-center justify-between p-2 rounded-xl tactile-card border border-[var(--tactile-border)]">
            <div 
              onClick={() => {
                if (currentUser?.role !== 'staff') {
                  handleSelect('settings');
                }
              }}
              className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow text-white shrink-0 tactile-btn-primary">
                {currentUser?.name ? currentUser.name[0].toUpperCase() : (settings.ownerName ? settings.ownerName[0].toUpperCase() : 'S')}
              </div>
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-semibold text-[var(--tactile-text-main)] tracking-wide truncate">
                    {currentUser?.name || settings.ownerName}
                  </p>
                  <span className={`px-1.5 py-0.2 text-[9px] font-bold rounded uppercase ${
                    currentUser?.role === 'staff'
                      ? 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/30'
                      : 'bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30'
                  }`}>
                    {currentUser?.role === 'staff' ? 'Staff' : 'Admin'}
                  </span>
                </div>
                <p className="text-[10px] text-[var(--tactile-text-muted)] font-mono truncate">
                  {currentUser?.email || settings.email || 'shrisaient.in'}
                </p>
              </div>
            </div>

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                title="Log out (लॉगआउट)"
                className="p-1.5 rounded-lg text-[var(--tactile-text-muted)] hover:text-rose-500 transition cursor-pointer shrink-0 ml-1"
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
