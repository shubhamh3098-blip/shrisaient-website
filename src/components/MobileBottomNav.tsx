import React from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  CreditCard,
  Users,
  Store,
  Download,
  Zap
} from 'lucide-react';
import { ActiveTab } from '../types';

interface MobileBottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenShopView: () => void;
  onOpenInstallModal?: () => void;
  onOpenFieldActions?: () => void;
  cloudStatus?: 'idle' | 'syncing' | 'connected' | 'offline' | 'error';
  isInstallable?: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenShopView,
  onOpenInstallModal,
  onOpenFieldActions,
  cloudStatus = 'connected',
  isInstallable = false,
}) => {
  const isOnline = cloudStatus === 'connected' || cloudStatus === 'syncing';

  return (
    <nav
      id="mobile-bottom-nav"
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#0B1528]/95 backdrop-blur-md border-t border-slate-800/80 px-2 py-1.5 lg:hidden safe-area-pb"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto text-[10px]">
        {/* Field Quick Staff Actions Hub */}
        {onOpenFieldActions && (
          <button
            type="button"
            onClick={onOpenFieldActions}
            className="flex flex-col items-center justify-center p-1.5 rounded-xl transition-all cursor-pointer min-w-[52px] text-amber-400 hover:text-amber-300 active:scale-95"
            title="Field Staff Quick Actions (कलेक्शन / बिल / पावती)"
          >
            <div className="relative">
              <Zap className="w-5 h-5 mb-0.5 fill-amber-400 text-amber-400 animate-pulse" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full ring-2 ring-[#0B1528]" />
            </div>
            <span className="font-extrabold text-[9px] text-amber-300">क्विक स्टाफ</span>
          </button>
        )}

        {/* Dashboard */}
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all cursor-pointer min-w-[48px] ${
            activeTab === 'dashboard'
              ? 'text-amber-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className={`w-5 h-5 mb-0.5 ${activeTab === 'dashboard' ? 'scale-110' : ''}`} />
          <span>Home</span>
        </button>

        {/* Card Scheme */}
        <button
          onClick={() => setActiveTab('card-scheme')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all cursor-pointer min-w-[48px] ${
            activeTab === 'card-scheme'
              ? 'text-amber-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CreditCard className={`w-5 h-5 mb-0.5 ${activeTab === 'card-scheme' ? 'scale-110' : ''}`} />
          <span>योजना</span>
        </button>

        {/* Center Primary Action: Add Entry */}
        <button
          onClick={() => setActiveTab('add-entry')}
          className="flex flex-col items-center justify-center -mt-4 cursor-pointer focus:outline-none"
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-600 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/30 border-2 border-[#0B1528] active:scale-95 transition-transform">
            <PlusCircle className="w-6 h-6 stroke-[2.5]" />
          </div>
          <span className="text-[10px] font-bold text-amber-400 mt-0.5">नया बिल</span>
        </button>

        {/* Customers / Khata */}
        <button
          onClick={() => setActiveTab('customers')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all cursor-pointer min-w-[48px] ${
            activeTab === 'customers'
              ? 'text-amber-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className={`w-5 h-5 mb-0.5 ${activeTab === 'customers' ? 'scale-110' : ''}`} />
          <span>ग्राहक</span>
        </button>

        {/* Customer Shop / Install */}
        {isInstallable && onOpenInstallModal ? (
          <button
            onClick={onOpenInstallModal}
            className="flex flex-col items-center justify-center p-1.5 rounded-xl text-amber-300 hover:text-amber-200 transition-all cursor-pointer min-w-[48px]"
            title="Install App"
          >
            <Download className="w-5 h-5 mb-0.5 animate-bounce" />
            <span className="font-bold">ॲप 📥</span>
          </button>
        ) : (
          <button
            onClick={onOpenShopView}
            className="flex flex-col items-center justify-center p-1.5 rounded-xl text-slate-400 hover:text-amber-300 transition-all cursor-pointer min-w-[48px]"
            title="Open Public Customer Shop"
          >
            <Store className="w-5 h-5 mb-0.5" />
            <span>शॉप</span>
          </button>
        )}
      </div>

      {/* Ultra-slim Cloud Sync Status bar on mobile bottom */}
      <div className="flex items-center justify-center gap-1.5 pt-1 text-[9px] text-slate-500 border-t border-slate-800/40">
        <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-500'}`} />
        <span>{isOnline ? 'Online Google Cloud Sync Active' : 'Offline Mode (Local Storage)'}</span>
      </div>
    </nav>
  );
};
