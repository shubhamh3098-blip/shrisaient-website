import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  PlusCircle,
  FolderArchive,
  Receipt,
  Menu,
  X,
  CalendarCheck,
  Wallet,
  Smartphone,
  CheckCircle2
} from 'lucide-react';
import { StoreData, AdminUser, BillReceipt, Transaction, Customer } from './types';
import { StorageService } from './services/storageService';
import { SecurityService } from './services/securityService';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { Sidebar, NavTab } from './components/Sidebar';
import { QuickActionsBar } from './components/common/QuickActionsBar';
import { TopHubNavBar } from './components/common/TopHubNavBar';
import { DashboardView } from './components/dashboard/DashboardView';
import { AddEntryView } from './components/entry/AddEntryView';
import { MasterSearchView } from './components/master/MasterSearchView';
import { BillReceiptsView } from './components/customers/BillReceiptsView';
import { AgentCommissionView } from './components/agent/AgentCommissionView';
import { AllTransactionsView } from './components/transactions/AllTransactionsView';
import { ExcelImportView } from './components/excel/ExcelImportView';
import { PosInvoiceView } from './components/pos/PosInvoiceView';
import { InventoryView } from './components/inventory/InventoryView';
import { SchemeManagerView } from './components/scheme/SchemeManagerView';
import { CustomersView } from './components/customers/CustomersView';
import { DealersView } from './components/dealers/DealersView';
import { ExpensesDayBookView } from './components/expenses/ExpensesDayBookView';
import { StaffAdvancesView } from './components/staff/StaffAdvancesView';
import { SettingsView } from './components/settings/SettingsView';
import { DailyCashClosingView } from './components/cash/DailyCashClosingView';
import { SchemeDefaultersView } from './components/scheme/SchemeDefaultersView';
import { DealerPdcTrackerView } from './components/dealers/DealerPdcTrackerView';
import { WarrantyServiceView } from './components/service/WarrantyServiceView';
import { FestivalPromoGeneratorView } from './components/promo/FestivalPromoGeneratorView';
import { LuckyDrawMaturityView } from './components/scheme/LuckyDrawMaturityView';
import { AgentLeaderboardView } from './components/agent/AgentLeaderboardView';
import { TempoDeliveryRunSheetView } from './components/delivery/TempoDeliveryRunSheetView';
import { RouteBeatPlannerView } from './components/route/RouteBeatPlannerView';
import { ApplianceFurnitureExchangeView } from './components/exchange/ApplianceFurnitureExchangeView';
import { BirthdayAnniversaryCrmView } from './components/crm/BirthdayAnniversaryCrmView';
import { DailyBackupModal } from './components/common/DailyBackupModal';
import { ProfitLossAnalyticsView } from './components/analytics/ProfitLossAnalyticsView';
import { GstTaxReportsView } from './components/tax/GstTaxReportsView';
import { SystemHealthShieldView } from './components/diagnostics/SystemHealthShieldView';
import { DynamicUpiQrCollectView } from './components/upi/DynamicUpiQrCollectView';
import { DealerPurchaseOrderView } from './components/dealers/DealerPurchaseOrderView';
import { StaffAttendanceSalaryView } from './components/staff/StaffAttendanceSalaryView';
import { CustomerLoyaltyReferralView } from './components/loyalty/CustomerLoyaltyReferralView';
import { EwayDeliveryChallanView } from './components/delivery/EwayDeliveryChallanView';
import { FinanceEmiCaseTrackerView } from './components/finance/FinanceEmiCaseTrackerView';
import { DigitalLuckyDrawMachineView } from './components/scheme/DigitalLuckyDrawMachineView';
import { CustomerCreditRiskShieldView } from './components/customers/CustomerCreditRiskShieldView';
import { BarcodeLabelStudioView } from './components/barcode/BarcodeLabelStudioView';

// Modals
import { ReceiptPrintModal } from './components/common/ReceiptPrintModal';
import { TaxInvoicePrintModal } from './components/common/TaxInvoicePrintModal';
import { CustomerKhataModal } from './components/common/CustomerKhataModal';
import { FastReceiptModal } from './components/common/FastReceiptModal';
import { MergeCustomerModal } from './components/common/MergeCustomerModal';
import { TownViewModal } from './components/common/TownViewModal';
import { LiveStoreModal } from './components/common/LiveStoreModal';
import { WeeklyCardCollectionModal } from './components/scheme/WeeklyCardCollectionModal';
import { MobileAppModal } from './components/common/MobileAppModal';
import { FrontAddProductModal } from './components/common/FrontAddProductModal';
import { MobileAgentHisabModal } from './components/common/MobileAgentHisabModal';
import { DataResetAndCsvModal } from './components/common/DataResetAndCsvModal';
import { QuickCounterHisabModal } from './components/common/QuickCounterHisabModal';
import { FinanceEmiModal } from './components/common/FinanceEmiModal';
import { CustomerShowroomView } from './components/showroom/CustomerShowroomView';
import { LandingPageEditorView } from './components/showroom/LandingPageEditorView';
import { AppleHubSegmentBar } from './components/common/AppleHubSegmentBar';
import { GoogleSeoIndexingModal } from './components/common/GoogleSeoIndexingModal';
import { MobileAgentFieldTerminal } from './components/agent/MobileAgentFieldTerminal';

function AppContent() {
  const { isDayMode } = useTheme();
  const [storeData, setStoreData] = useState<StoreData>(() => StorageService.loadData());
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [activeUser, setActiveUser] = useState<AdminUser>(() => {
    const sessionUser = SecurityService.getActiveSessionUser();
    if (sessionUser) return sessionUser;
    return storeData.adminUsers[0];
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Printable modal states
  const [printingReceipt, setPrintingReceipt] = useState<BillReceipt | null>(null);
  const [printingInvoice, setPrintingInvoice] = useState<Transaction | null>(null);

  // Khata & Receipt Modals
  const [khataCustomer, setKhataCustomer] = useState<Customer | null>(null);
  const [receiptCustomer, setReceiptCustomer] = useState<Customer | null>(null);
  const [isFastReceiptModalOpen, setIsFastReceiptModalOpen] = useState(false);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [isTownModalOpen, setIsTownModalOpen] = useState(false);
  const [isLiveStoreModalOpen, setIsLiveStoreModalOpen] = useState(false);
  const [isMobileAppModalOpen, setIsMobileAppModalOpen] = useState(false);
  const [isFrontAddProductModalOpen, setIsFrontAddProductModalOpen] = useState(false);
  const [isMobileAgentHisabModalOpen, setIsMobileAgentHisabModalOpen] = useState(false);
  const [isDataResetModalOpen, setIsDataResetModalOpen] = useState(false);
  const [isQuickHisabModalOpen, setIsQuickHisabModalOpen] = useState(false);
  const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);
  const [isWeeklyCollectionModalOpen, setIsWeeklyCollectionModalOpen] = useState(false);
  const [isDailyBackupModalOpen, setIsDailyBackupModalOpen] = useState(false);
  // Public Landing Page & Admin Authentication Lock with Auto-Lock protection
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const isAuth = sessionStorage.getItem('sai_admin_authenticated') === 'true';
      if (isAuth) {
        const timedOut = SecurityService.checkSessionTimeout();
        return !timedOut;
      }
    }
    return false;
  });
  const [isCustomerShowroomOpen, setIsCustomerShowroomOpen] = useState(false);
  const [isFieldAgentTerminalOpen, setIsFieldAgentTerminalOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('mode') === 'agent' || urlParams.get('agent') === 'true') {
        return true;
      }
      return localStorage.getItem('sai_field_agent_mode') === 'true';
    }
    return false;
  });
  const [isGoogleSeoModalOpen, setIsGoogleSeoModalOpen] = useState(false);
  const [isLiveSynced, setIsLiveSynced] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<string>('आत्ताच');
  const [showPwaInstallBanner, setShowPwaInstallBanner] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sai_pwa_dismissed') !== 'true';
    }
    return true;
  });

  // Continuous Multi-Device Realtime Sync (Field Agent Phone <-> Shop Counter Terminal)
  useEffect(() => {
    const unsubscribe = StorageService.initRealtimeSync((newData) => {
      setStoreData(newData);
      setIsLiveSynced(true);
      setLastSyncTime(
        new Date().toLocaleTimeString('mr-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const [isSimpleView, setIsSimpleView] = useState<boolean>(() => {
    const saved = localStorage.getItem('sai_erp_simple_view');
    return saved !== null ? saved === 'true' : true; // Default clean simple view
  });

  const handleToggleSimpleView = () => {
    setIsSimpleView((prev) => {
      const next = !prev;
      localStorage.setItem('sai_erp_simple_view', String(next));
      return next;
    });
  };

  // Auto-Lock Timer & Inactivity Tracking for Production Security
  useEffect(() => {
    if (!isAdminAuthenticated) return;

    const interval = setInterval(() => {
      const timedOut = SecurityService.checkSessionTimeout();
      if (timedOut) {
        setIsAdminAuthenticated(false);
      }
    }, 60000);

    const handleUserActivity = () => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('sai_last_activity_time', String(Date.now()));
      }
    };

    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('click', handleUserActivity);
    window.addEventListener('touchstart', handleUserActivity);

    return () => {
      clearInterval(interval);
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('click', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
    };
  }, [isAdminAuthenticated]);

  // Sync data refresh helper
  const handleRefreshData = () => {
    const updated = StorageService.loadData();
    setStoreData(updated);
  };

  const handleAdminLogin = (user?: AdminUser) => {
    const loggedUser = user || storeData.adminUsers[0];
    SecurityService.saveActiveSession(loggedUser);
    setActiveUser(loggedUser);
    setIsAdminAuthenticated(true);
    setIsCustomerShowroomOpen(false);
  };

  const handleAdminLogout = () => {
    SecurityService.clearSession();
    setIsAdminAuthenticated(false);
    setIsCustomerShowroomOpen(false);
  };

  const handleOpenKhata = (customer: Customer) => {
    setKhataCustomer(customer);
  };

  const handleFastCollect = (customer: Customer) => {
    setReceiptCustomer(customer);
    setIsFastReceiptModalOpen(true);
  };

  // If Field Agent Mode is active (Mobile Agent Terminal)
  if (isFieldAgentTerminalOpen) {
    return (
      <MobileAgentFieldTerminal
        storeData={storeData}
        onRefreshData={handleRefreshData}
        onClose={() => {
          setIsFieldAgentTerminalOpen(false);
          localStorage.removeItem('sai_field_agent_mode');
        }}
        onOpenCustomerKhata={handleOpenKhata}
        isStandalonePage={true}
      />
    );
  }

  // If not logged in as Admin, OR if viewing the public Customer Showroom landing page
  if (!isAdminAuthenticated || isCustomerShowroomOpen) {
    return (
      <CustomerShowroomView
        storeData={storeData}
        isAdminLoggedIn={isAdminAuthenticated}
        onEnterAdminERP={handleAdminLogin}
        onReturnToERP={() => setIsCustomerShowroomOpen(false)}
        onRefreshData={handleRefreshData}
        onOpenAgentTerminal={() => {
          setIsFieldAgentTerminalOpen(true);
          localStorage.setItem('sai_field_agent_mode', 'true');
        }}
      />
    );
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 apple-wallpaper-bg ${
      isDayMode
        ? 'text-slate-800'
        : 'text-slate-100'
    }`}>
      {/* Top Sticky Header */}
      <Navbar
        storeData={storeData}
        activeUser={activeUser}
        onSelectUser={setActiveUser}
        onRefreshData={handleRefreshData}
        onOpenLiveStore={() => setIsCustomerShowroomOpen(true)}
        onOpenMobileApp={() => setIsMobileAppModalOpen(true)}
        onOpenMasterSearch={() => setCurrentTab('master-search')}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
        onOpenFrontAddProduct={() => setIsFrontAddProductModalOpen(true)}
        onOpenMobileAgentHisab={() => setIsMobileAgentHisabModalOpen(true)}
        onOpenDataResetModal={() => setIsDataResetModalOpen(true)}
        onOpenQuickHisab={() => setIsQuickHisabModalOpen(true)}
        onOpenCustomerShowroom={() => setIsCustomerShowroomOpen(true)}
        onLogout={handleAdminLogout}
      />

      {/* Streamlined Top Navigation Bar */}
      <TopHubNavBar
        currentTab={currentTab}
        onNavigate={(tab) => setCurrentTab(tab)}
        onOpenFastPaymentModal={() => {
          setReceiptCustomer(null);
          setIsFastReceiptModalOpen(true);
        }}
        onOpenNewCardModal={() => setCurrentTab('scheme')}
        onOpenWeeklyCollectionModal={() => setIsWeeklyCollectionModalOpen(true)}
        onOpenFrontAddProductModal={() => setIsFrontAddProductModalOpen(true)}
        onOpenMobileAgentHisabModal={() => setIsMobileAgentHisabModalOpen(true)}
        onOpenMobileAgentTerminal={() => setIsFieldAgentTerminalOpen(true)}
        onOpenQuickHisabModal={() => setIsQuickHisabModalOpen(true)}
        onOpenFinanceModal={() => setIsFinanceModalOpen(true)}
        onOpenCustomerShowroom={() => setIsCustomerShowroomOpen(true)}
        onOpenSeoModal={() => setIsGoogleSeoModalOpen(true)}
        isSimpleView={isSimpleView}
        onToggleSimpleView={handleToggleSimpleView}
        isLiveSynced={isLiveSynced}
        lastSyncTime={lastSyncTime}
      />

      {/* Mobile PWA Web App Shortcut Prompt (Dedicated for Field Agents) */}
      {showPwaInstallBanner && (
        <div className="md:hidden bg-linear-to-r from-indigo-950 via-slate-900 to-indigo-950 text-white px-3.5 py-2 border-b border-indigo-500/30 text-xs flex items-center justify-between gap-2 z-20 shadow-md">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30">
              <Smartphone className="w-3.5 h-3.5" />
            </div>
            <p className="text-[11px] leading-tight text-slate-300 truncate">
              <span className="font-bold text-amber-300">मोबाईल ॲप शॉर्टकट:</span> ब्राऊझर मेनू (⋮) दाबा ➔ <span className="underline text-white font-medium">Add to Home screen</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowPwaInstallBanner(false);
              localStorage.setItem('sai_pwa_dismissed', 'true');
            }}
            className="p-1 rounded text-slate-400 hover:text-white shrink-0 cursor-pointer"
            title="बंद करा"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main App Body */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Navigation Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          storeData={storeData}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          onOpenFrontAddProduct={() => setIsFrontAddProductModalOpen(true)}
          onOpenMobileAgentHisab={() => setIsMobileAgentHisabModalOpen(true)}
          onOpenDataResetModal={() => setIsDataResetModalOpen(true)}
          onOpenQuickHisab={() => setIsQuickHisabModalOpen(true)}
          onOpenCustomerShowroom={() => setIsCustomerShowroomOpen(true)}
          onOpenDailyBackupModal={() => setIsDailyBackupModalOpen(true)}
        />

        {/* Dynamic Main Workspace View */}
        <main className={`flex-1 overflow-y-auto px-2.5 sm:px-5 md:px-6 py-2.5 sm:py-5 md:py-6 pb-28 md:pb-8 transition-colors duration-300 ${
          isDayMode ? 'bg-slate-100/40' : 'bg-transparent'
        }`}>
          <div className="max-w-7xl mx-auto">
            {/* Sub-Feature Segment Navigation (Only in detailed view to keep main workspace uncluttered) */}
            {!isSimpleView && (
              <AppleHubSegmentBar
                currentTab={currentTab}
                onSelectTab={setCurrentTab}
              />
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={currentTab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                {/* 1. Dashboard */}
                {currentTab === 'dashboard' && (
                  <DashboardView
                    storeData={storeData}
                    onNavigate={setCurrentTab}
                    onOpenInvoicePrint={(tx) => setPrintingInvoice(tx)}
                  />
                )}

                {/* 2. Add Entry (Screenshot 2) */}
                {currentTab === 'add-entry' && (
                  <AddEntryView
                    storeData={storeData}
                    onRefreshData={handleRefreshData}
                    onPrintInvoice={(tx) => setPrintingInvoice(tx)}
                    onBackToDashboard={() => setCurrentTab('dashboard')}
                  />
                )}

                {/* 3. Master Search / Central Data (Screenshot 1) */}
                {currentTab === 'master-search' && (
                  <MasterSearchView
                    storeData={storeData}
                    onRefreshData={handleRefreshData}
                    onOpenCustomerKhata={handleOpenKhata}
                    onFastCollectReceipt={handleFastCollect}
                    onOpenMergeModal={() => setIsMergeModalOpen(true)}
                    onOpenTownModal={() => setIsTownModalOpen(true)}
                  />
                )}

                {/* 4. Bill Receipts #1079 */}
                {currentTab === 'receipts' && (
                  <BillReceiptsView
                    storeData={storeData}
                    onOpenFastPaymentModal={() => {
                      setReceiptCustomer(null);
                      setIsFastReceiptModalOpen(true);
                    }}
                    onPrintReceipt={(r) => setPrintingReceipt(r)}
                    onRefreshData={handleRefreshData}
                  />
                )}

                {/* 5. Customer Khata */}
                {currentTab === 'customers' && (
                  <CustomersView
                    storeData={storeData}
                    onRefreshData={handleRefreshData}
                    onPrintReceipt={(receipt) => setPrintingReceipt(receipt)}
                    onOpenCustomerKhata={handleOpenKhata}
                    onFastCollectReceipt={handleFastCollect}
                    onOpenMergeModal={() => setIsMergeModalOpen(true)}
                    onOpenTownModal={() => setIsTownModalOpen(true)}
                  />
                )}

                {/* 5b. Finance EMI Calculator Screen */}
                {currentTab === 'finance-calc' && (
                  <div className="p-4 sm:p-6 space-y-4">
                    <FinanceEmiModal
                      storeData={storeData}
                      isOpen={true}
                      onClose={() => setCurrentTab('dashboard')}
                    />
                  </div>
                )}

                {/* 6. 30-Month Scheme */}
                {currentTab === 'scheme' && (
                  <SchemeManagerView
                    storeData={storeData}
                    onRefreshData={handleRefreshData}
                  />
                )}

                {/* 7. Agent 4% & Salary Dashboard */}
                {currentTab === 'agent-commission' && (
                  <AgentCommissionView
                    storeData={storeData}
                    onRefreshData={handleRefreshData}
                    onOpenWeeklyCollectionModal={() => setIsWeeklyCollectionModalOpen(true)}
                  />
                )}

                {/* 8. Sales Bills / All Transactions */}
                {currentTab === 'all-transactions' && (
                  <AllTransactionsView
                    storeData={storeData}
                    onPrintInvoice={(tx) => setPrintingInvoice(tx)}
                    onRefreshData={handleRefreshData}
                  />
                )}

                {/* 9. Inventory & Stock */}
                {currentTab === 'inventory' && (
                  <InventoryView
                    storeData={storeData}
                    onRefreshData={handleRefreshData}
                    onOpenFrontAddProduct={() => setIsFrontAddProductModalOpen(true)}
                  />
                )}

                {/* 10. POS Invoice Terminal */}
                {currentTab === 'pos' && (
                  <PosInvoiceView
                    storeData={storeData}
                    onRefreshData={handleRefreshData}
                    onPrintInvoice={(tx) => setPrintingInvoice(tx)}
                  />
                )}

                {/* 11. Dealers & Purchases */}
                {currentTab === 'dealers' && (
                  <DealersView
                    storeData={storeData}
                    onRefreshData={handleRefreshData}
                  />
                )}

                {/* 12. Expenses Day-Book */}
                {currentTab === 'expenses' && (
                  <ExpensesDayBookView
                    storeData={storeData}
                    onRefreshData={handleRefreshData}
                  />
                )}

                {/* 13. Staff & Advances */}
                {currentTab === 'staff' && (
                  <StaffAdvancesView
                    storeData={storeData}
                    onRefreshData={handleRefreshData}
                  />
                )}

                {/* 14. Excel / CSV Data Import */}
                {currentTab === 'excel-import' && (
                  <ExcelImportView
                    storeData={storeData}
                    onRefreshData={handleRefreshData}
                    onNavigate={setCurrentTab}
                  />
                )}

                {/* 15. Settings & Cloud Backup */}
                {currentTab === 'settings' && (
                  <SettingsView
                    storeData={storeData}
                    onRefreshData={handleRefreshData}
                  />
                )}

                {/* 16. Daily Cash Closing & Reconciliation */}
                {currentTab === 'daily-closing' && (
                  <DailyCashClosingView
                    storeData={storeData}
                    onRefreshData={handleRefreshData}
                  />
                )}

                {/* 17. 30-Month Scheme Defaulters & Recovery Tracker */}
                {currentTab === 'scheme-defaulters' && (
                  <SchemeDefaultersView
                    storeData={storeData}
                    onRefreshData={handleRefreshData}
                  />
                )}

                {/* 18. Wholesaler Payment Due & Cheque/PDC Alert */}
                {currentTab === 'dealer-pdc' && (
                  <DealerPdcTrackerView
                    storeData={storeData}
                    onRefreshData={handleRefreshData}
                  />
                )}

                {/* 19. Warranty & Free Service Expiry Reminder */}
                {currentTab === 'warranty-service' && (
                  <WarrantyServiceView
                    storeData={storeData}
                    onRefreshData={handleRefreshData}
                  />
                )}

                {/* 20. Festival & Weekly Scheme WhatsApp Broadcast & Poster Generator */}
                {currentTab === 'festival-promo' && (
                  <FestivalPromoGeneratorView
                    storeData={storeData}
                  />
                )}

                {/* 21. 30-Month Lucky Draw & Maturity Bonus Tracker */}
                {currentTab === 'lucky-draw' && (
                  <LuckyDrawMaturityView
                    storeData={storeData}
                    onRefreshData={handleRefreshData}
                  />
                )}

                {/* 22. Agent Performance & Incentive Leaderboard */}
                {currentTab === 'agent-leaderboard' && (
                  <AgentLeaderboardView
                    storeData={storeData}
                    onNavigateTab={(tab) => setCurrentTab(tab as any)}
                  />
                )}

                {/* 23. Tempo Delivery & Installation Run-Sheet */}
                {currentTab === 'tempo-delivery' && (
                  <TempoDeliveryRunSheetView
                    storeData={storeData}
                  />
                )}

                {/* 24. Village & Beat Route Recovery Planner */}
                {currentTab === 'route-beat' && (
                  <RouteBeatPlannerView
                    storeData={storeData}
                  />
                )}

                {/* 25. Old Appliance & Furniture Exchange Calculator */}
                {currentTab === 'exchange-calc' && (
                  <ApplianceFurnitureExchangeView
                    storeData={storeData}
                  />
                )}

                {/* 26. Customer Birthday & Anniversary VIP Wishes CRM */}
                {currentTab === 'crm-wishes' && (
                  <BirthdayAnniversaryCrmView
                    storeData={storeData}
                  />
                )}

                {/* 27. Landing Page & Showroom Storefront Editor */}
                {currentTab === 'landing-editor' && (
                  <LandingPageEditorView
                    storeData={storeData}
                    onRefreshData={handleRefreshData}
                    onOpenCustomerShowroom={() => setIsCustomerShowroomOpen(true)}
                  />
                )}

                {/* 28. P&L Profit & Loss Analytics */}
                {currentTab === 'profit-loss' && (
                  <ProfitLossAnalyticsView
                    storeData={storeData}
                  />
                )}

                {/* 29. GSTR-1, GSTR-3B & Tax Audit Reports */}
                {currentTab === 'gst-reports' && (
                  <GstTaxReportsView
                    storeData={storeData}
                  />
                )}

                {/* 30. System Health Shield & Stock Aging Diagnostics */}
                {currentTab === 'system-shield' && (
                  <SystemHealthShieldView
                    storeData={storeData}
                    onRefreshData={handleRefreshData}
                  />
                )}

                {/* 31. Dynamic Counter UPI QR & Quick Collect */}
                {currentTab === 'upi-collect' && (
                  <DynamicUpiQrCollectView
                    storeData={storeData}
                    onRefreshData={handleRefreshData}
                  />
                )}

                {/* 32. Dealer Purchase Orders & Damage Debit Notes */}
                {currentTab === 'dealer-po' && (
                  <DealerPurchaseOrderView
                    storeData={storeData}
                    onRefreshData={handleRefreshData}
                  />
                )}

                {/* 33. Staff Attendance, Incentives & Salary Payslips */}
                {currentTab === 'staff-payslip' && (
                  <StaffAttendanceSalaryView
                    storeData={storeData}
                    onRefreshData={handleRefreshData}
                  />
                )}

                {/* 34. Customer Loyalty Coins & Scheme Referrals */}
                {currentTab === 'loyalty-program' && (
                  <CustomerLoyaltyReferralView
                    storeData={storeData}
                    onRefreshData={handleRefreshData}
                  />
                )}

                {/* 35. Delivery Challan & Security Gate Pass */}
                {currentTab === 'delivery-challan' && (
                  <EwayDeliveryChallanView
                    storeData={storeData}
                    onRefreshData={handleRefreshData}
                  />
                )}

                {/* 36. Bajaj/TVS NBFC Consumer Durable EMI Case Tracker */}
                {currentTab === 'finance-tracker' && (
                  <FinanceEmiCaseTrackerView
                    storeData={storeData}
                    onRefreshData={handleRefreshData}
                  />
                )}

                {/* 37. Digital Transparent Lucky Draw Machine & Drum Roller */}
                {currentTab === 'draw-machine' && (
                  <DigitalLuckyDrawMachineView
                    storeData={storeData}
                    onRefreshData={handleRefreshData}
                  />
                )}

                {/* 38. Customer 360 Credit Score & Khata Risk Shield */}
                {currentTab === 'credit-shield' && (
                  <CustomerCreditRiskShieldView
                    storeData={storeData}
                    onRefreshData={handleRefreshData}
                  />
                )}

                {/* 39. Barcode & QR Price Tag Label Studio */}
                {currentTab === 'barcode-studio' && (
                  <BarcodeLabelStudioView
                    storeData={storeData}
                    onRefreshData={handleRefreshData}
                    onNavigateToPos={() => setCurrentTab('pos')}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Ultra-Smooth One-Thumb Access for Field Agents) */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-2xl px-1 pt-1.5 pb-[max(0.6rem,env(safe-area-inset-bottom))] flex items-center justify-around select-none ${
        isDayMode
          ? 'bg-white/95 border-slate-200/90 text-slate-600 shadow-[0_-2px_15px_rgba(0,0,0,0.06)]'
          : 'bg-[#050814]/95 border-sky-500/25 text-slate-300 shadow-[0_-4px_25px_rgba(0,0,0,0.7)]'
      }`}>
        {/* 1. Dashboard */}
        <button
          onClick={() => setCurrentTab('dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl text-[10px] font-semibold transition cursor-pointer min-w-[50px] min-h-[44px] ${
            currentTab === 'dashboard'
              ? 'text-teal-600 dark:text-sky-400 font-bold dark:drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span>डॅशबोर्ड</span>
        </button>

        {/* 2. 1-Tap Weekly Installment Collection (हप्ते जमा) */}
        <button
          type="button"
          onClick={() => setIsWeeklyCollectionModalOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-1.5 rounded-xl text-[10px] font-bold text-emerald-600 dark:text-emerald-400 transition cursor-pointer min-w-[50px] min-h-[44px] active:scale-95 touch-manipulation"
          title="साप्ताहिक कार्ड हप्ते जमा करा (Weekly Installment Collection)"
        >
          <div className="relative">
            <CalendarCheck className="w-5 h-5 mb-0.5 text-emerald-500" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
          </div>
          <span>हप्ते जमा</span>
        </button>

        {/* 3. Add Entry (+) Elevated Center Button */}
        <button
          onClick={() => setCurrentTab('add-entry')}
          className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl text-[10px] font-semibold transition cursor-pointer min-w-[50px] min-h-[44px] ${
            currentTab === 'add-entry'
              ? 'text-amber-500 font-bold'
              : 'text-slate-400 hover:text-amber-400'
          }`}
        >
          <div className="w-9 h-9 -mt-4 bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.5)] border border-amber-300">
            <PlusCircle className="w-5 h-5" />
          </div>
          <span className="mt-0.5">नवीन बिल</span>
        </button>

        {/* 4. Agent Field Terminal & Daily Hishob (एजंट वसुली व विक्री हिशोब) */}
        <button
          onClick={() => {
            setIsFieldAgentTerminalOpen(true);
            localStorage.setItem('sai_field_agent_mode', 'true');
          }}
          className="flex flex-col items-center justify-center py-1 px-1.5 rounded-xl text-[10px] font-bold text-amber-600 dark:text-amber-400 transition cursor-pointer min-w-[50px] min-h-[44px]"
          title="एजंट मोबाईल टर्मिनल (हप्ता वसुली व विक्री हिशोब)"
        >
          <Smartphone className="w-5 h-5 mb-0.5 text-amber-500 animate-pulse" />
          <span>एजंट टर्मिनल</span>
        </button>

        {/* 5. Menu Toggle */}
        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-1.5 rounded-xl text-[10px] font-semibold text-slate-400 hover:text-teal-600 transition cursor-pointer min-w-[50px] min-h-[44px]"
        >
          <Menu className="w-5 h-5 mb-0.5" />
          <span>सर्व मेनू</span>
        </button>
      </nav>

      {/* Customer Khata Ledger Modal */}
      {khataCustomer && (
        <CustomerKhataModal
          customer={khataCustomer}
          storeData={storeData}
          onClose={() => setKhataCustomer(null)}
          onRefreshData={handleRefreshData}
          onCollectPayment={(cust) => {
            setReceiptCustomer(cust);
            setIsFastReceiptModalOpen(true);
          }}
          onPrintReceipt={(r) => setPrintingReceipt(r)}
          onPrintInvoice={(tx) => setPrintingInvoice(tx)}
        />
      )}

      {/* Fast Receipt Collection Modal */}
      {isFastReceiptModalOpen && (
        <FastReceiptModal
          customer={receiptCustomer}
          storeData={storeData}
          onClose={() => {
            setIsFastReceiptModalOpen(false);
            setReceiptCustomer(null);
          }}
          onRefreshData={handleRefreshData}
          onPrintReceipt={(r) => setPrintingReceipt(r)}
        />
      )}

      {/* Merge Duplicate Customers Modal */}
      {isMergeModalOpen && (
        <MergeCustomerModal
          storeData={storeData}
          onClose={() => setIsMergeModalOpen(false)}
          onRefreshData={handleRefreshData}
        />
      )}

      {/* Town / Village Breakdown Modal */}
      {isTownModalOpen && (
        <TownViewModal
          storeData={storeData}
          onClose={() => setIsTownModalOpen(false)}
          onSelectTown={() => {
            setCurrentTab('master-search');
          }}
        />
      )}

      {/* Customer Website / Live Store Modal */}
      {isLiveStoreModalOpen && (
        <LiveStoreModal
          storeData={storeData}
          onClose={() => setIsLiveStoreModalOpen(false)}
        />
      )}

      {/* Mobile App QR & Install Modal */}
      {isMobileAppModalOpen && (
        <MobileAppModal
          onClose={() => setIsMobileAppModalOpen(false)}
        />
      )}

      {/* Official Tax Invoice Print Modal */}
      {printingInvoice && (
        <TaxInvoicePrintModal
          transaction={printingInvoice}
          settings={storeData.settings}
          onClose={() => setPrintingInvoice(null)}
        />
      )}

      {/* Official Bill Receipt Print Modal */}
      {printingReceipt && (
        <ReceiptPrintModal
          receipt={printingReceipt}
          settings={storeData.settings}
          onClose={() => setPrintingReceipt(null)}
        />
      )}

      {/* Front Add Product Modal (User Requested) */}
      {isFrontAddProductModalOpen && (
        <FrontAddProductModal
          onClose={() => setIsFrontAddProductModalOpen(false)}
          onRefreshData={handleRefreshData}
        />
      )}

      {/* Mobile Agent Card Receipt & Hisab Modal (User Requested) */}
      {isMobileAgentHisabModalOpen && (
        <MobileAgentHisabModal
          storeData={storeData}
          onClose={() => setIsMobileAgentHisabModalOpen(false)}
          onRefreshData={handleRefreshData}
          onOpenCustomerKhata={(customer) => {
            setIsMobileAgentHisabModalOpen(false);
            setKhataCustomer(customer);
          }}
          onPrintReceipt={(receipt) => {
            setPrintingReceipt(receipt);
          }}
        />
      )}

      {/* Data Reset & Zero-Quota CSV Import Modal */}
      {isDataResetModalOpen && (
        <DataResetAndCsvModal
          storeData={storeData}
          isOpen={isDataResetModalOpen}
          onClose={() => setIsDataResetModalOpen(false)}
          onRefreshData={handleRefreshData}
        />
      )}

      {/* Rapid Counter Hisab Scratchpad Modal */}
      {isQuickHisabModalOpen && (
        <QuickCounterHisabModal
          storeData={storeData}
          onClose={() => setIsQuickHisabModalOpen(false)}
          onConvertToBill={() => {
            setIsQuickHisabModalOpen(false);
            setCurrentTab('add-entry');
          }}
        />
      )}

      {/* Finance EMI Calculator Modal (Bajaj / TVS / HDB / IDBI) */}
      {isFinanceModalOpen && (
        <FinanceEmiModal
          storeData={storeData}
          isOpen={isFinanceModalOpen}
          onClose={() => setIsFinanceModalOpen(false)}
        />
      )}

      {/* Weekly Card Installment Collection Modal (Exact User Model) */}
      {isWeeklyCollectionModalOpen && (
        <WeeklyCardCollectionModal
          isOpen={isWeeklyCollectionModalOpen}
          onClose={() => setIsWeeklyCollectionModalOpen(false)}
          storeData={storeData}
          onRefreshData={handleRefreshData}
          defaultAgentName={activeUser ? activeUser.displayName : 'Rahul Sharma'}
        />
      )}

      {/* 1-Click Daily Night Auto-Backup & Offline Vault Modal */}
      {isDailyBackupModalOpen && (
        <DailyBackupModal
          isOpen={isDailyBackupModalOpen}
          onClose={() => setIsDailyBackupModalOpen(false)}
          storeData={storeData}
          onRefreshData={handleRefreshData}
        />
      )}

      {/* Google SEO, Fast Indexing & Local Ranking Modal */}
      <GoogleSeoIndexingModal
        isOpen={isGoogleSeoModalOpen}
        onClose={() => setIsGoogleSeoModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
