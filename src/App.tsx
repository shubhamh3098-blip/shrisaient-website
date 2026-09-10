import React, { useState, useEffect, useRef } from 'react';
import { Menu, Globe, Store, PlusCircle, Cloud, RefreshCw, CheckCircle2, Crown, UserCheck, LogOut, Lock, Download } from 'lucide-react';
import {
  ActiveTab,
  BusinessSettings,
  CardMember,
  CardTransaction,
  Customer,
  Dealer,
  DealerPayment,
  ExpenseEntry,
  PurchaseEntry,
  StaffMember,
  StockItem,
  TransactionEntry,
  AuthUser,
  UserRole
} from './types';
import {
  loadDatabase,
  saveDatabase,
  clearAllDemoData,
  AppDatabase,
  DEFAULT_SETTINGS,
  INITIAL_STOCK,
  INITIAL_CUSTOMERS,
  INITIAL_TRANSACTIONS,
  INITIAL_PURCHASES,
  INITIAL_STAFF,
  INITIAL_EXPENSES,
  INITIAL_DEALERS,
  INITIAL_DEALER_PAYMENTS,
  INITIAL_CARD_MEMBERS,
  INITIAL_CARD_TRANSACTIONS
} from './utils/storage';
import {
  subscribeToCloudDatabase,
  syncDatabaseToCloud,
  logAuthEventToCloud,
  CloudSyncStatus
} from './lib/firebase';
import { Sidebar } from './components/Sidebar';
import { AddEntryView } from './components/AddEntryView';
import { DashboardView } from './components/DashboardView';
import { AllEntriesView } from './components/AllEntriesView';
import { CustomersView } from './components/CustomersView';
import { StockView } from './components/StockView';
import { PurchasesView } from './components/PurchasesView';
import { StaffView } from './components/StaffView';
import { ExpensesView } from './components/ExpensesView';
import { SettingsView } from './components/SettingsView';
import { InvoiceModal } from './components/InvoiceModal';
import { CardSchemeView } from './components/CardSchemeView';
import { DealerLedgerView } from './components/DealerLedgerView';
import { CsvImportView } from './components/CsvImportView';
import { LoginModal } from './components/LoginModal';
import { ShopLandingView } from './components/ShopLandingView';
import { MobileBottomNav } from './components/MobileBottomNav';
import { PWAInstallModal } from './components/PWAInstallModal';
import { usePWAInstall } from './utils/usePWAInstall';

export default function App() {
  const [db, setDb] = useState<AppDatabase>(() => loadDatabase());
  const [activeTab, setActiveTab] = useState<ActiveTab>('add-entry'); // matches the user's screenshot where "Add Entry" is active
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<TransactionEntry | null>(null);
  const [selectedDealerForLedger, setSelectedDealerForLedger] = useState<string | undefined>();
  const [cloudStatus, setCloudStatus] = useState<CloudSyncStatus>('syncing');
  const [lastSyncedTime, setLastSyncedTime] = useState<string>('');
  
  // Application Mode: 'erp' (Internal Business Management) or 'shop' (Safe Public Storefront & Customer Passbook)
  const [appMode, setAppMode] = useState<'erp' | 'shop'>(() => {
    if (typeof window === 'undefined') return 'shop';
    const params = new URLSearchParams(window.location.search);
    if (params.get('passbook') || params.get('invoice') || params.get('view') === 'shop') {
      return 'shop';
    }
    // If user has active session, stay in ERP; otherwise default to public shop
    try {
      const saved = localStorage.getItem('shri_sai_auth_user');
      if (saved) return 'erp';
    } catch (e) {}
    return 'shop';
  });

  const initialPassbookParam = (() => {
    if (typeof window === 'undefined') return null;
    const p = new URLSearchParams(window.location.search).get('passbook');
    return p ? parseInt(p, 10) : null;
  })();

  const initialInvoiceParam = (() => {
    if (typeof window === 'undefined') return null;
    return new URLSearchParams(window.location.search).get('invoice');
  })();

  // Auth state with local storage persistence
  // Never authenticate automatically if opening a public passbook or customer shop link
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    if (params.get('passbook') || params.get('invoice') || params.get('view') === 'shop') {
      return null;
    }
    try {
      const saved = localStorage.getItem('shri_sai_auth_user');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return null;
  });
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false);
  const { isInstallable } = usePWAInstall();
  
  const isRemoteUpdateRef = useRef(false);

  // Clear demo data handler - resets customers, transactions, card members to a clean slate
  const handleClearAllDemoData = () => {
    const clean = clearAllDemoData(db);
    setDb(clean);
    syncDatabaseToCloud(clean, setCloudStatus, true);
    alert(
      'सफलता: सभी टेस्ट ग्राहक, बिक्री (Transactions) और डमी कार्ड मेंबर्स साफ़ कर दिए गए हैं!\n\nअब आपका खाता ₹0 बैलेंस के साथ वास्तविक बिजनेस एंट्री के लिए बिल्कुल तैयार है।'
    );
  };

  // 1. Real-time Cloud Firestore Listener (Across All Devices & shrisaient.in)
  useEffect(() => {
    const unsubscribe = subscribeToCloudDatabase(
      (remoteData) => {
        if (remoteData) {
          isRemoteUpdateRef.current = true;
          setDb((prev) => ({
            settings: remoteData.settings ? { ...prev.settings, ...remoteData.settings } : prev.settings,
            stock: remoteData.stock !== undefined ? remoteData.stock : prev.stock,
            customers: remoteData.customers !== undefined ? remoteData.customers : prev.customers,
            transactions: remoteData.transactions !== undefined ? remoteData.transactions : prev.transactions,
            purchases: remoteData.purchases !== undefined ? remoteData.purchases : prev.purchases,
            dealers: remoteData.dealers !== undefined ? remoteData.dealers : prev.dealers,
            dealerPayments: remoteData.dealerPayments !== undefined ? remoteData.dealerPayments : prev.dealerPayments,
            cardMembers: remoteData.cardMembers !== undefined ? remoteData.cardMembers : prev.cardMembers,
            cardTransactions: remoteData.cardTransactions !== undefined ? remoteData.cardTransactions : prev.cardTransactions,
            staff: remoteData.staff !== undefined ? remoteData.staff : prev.staff,
            expenses: remoteData.expenses !== undefined ? remoteData.expenses : prev.expenses,
          }));
          setLastSyncedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }
      },
      (status) => {
        setCloudStatus(status);
        if (status === 'connected') {
          setLastSyncedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }
      },
      db
    );

    return () => {
      unsubscribe();
    };
  }, []);

  // 2. Sync with localStorage AND sync with Cloud on local edits
  useEffect(() => {
    saveDatabase(db);
    if (isRemoteUpdateRef.current) {
      isRemoteUpdateRef.current = false;
      return;
    }
    syncDatabaseToCloud(db, (status) => {
      setCloudStatus(status);
      if (status === 'connected') {
        setLastSyncedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    });
  }, [db]);

  const handleManualCloudSync = () => {
    setCloudStatus('syncing');
    syncDatabaseToCloud(db, (status) => {
      setCloudStatus(status);
      if (status === 'connected') {
        setLastSyncedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    });
  };

  // Handler: Add transaction entry (From Add Entry Form)
  const handleSaveEntry = (entryData: Omit<TransactionEntry, 'id' | 'createdAt'>) => {
    const newEntry: TransactionEntry = {
      ...entryData,
      id: `tx-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    setDb((prev) => {
      // 1. Update or create Customer
      let customerExists = false;
      const updatedCustomers = prev.customers.map((c) => {
        if (
          (entryData.customerId && c.id === entryData.customerId) ||
          c.name.toLowerCase() === entryData.customerName.toLowerCase()
        ) {
          customerExists = true;
          return {
            ...c,
            totalPurchased: c.totalPurchased + entryData.totalAmount,
            totalPaid: c.totalPaid + entryData.payingNow,
            balanceDue: Math.max(0, c.balanceDue + entryData.dueAmount),
            phone: entryData.customerPhone || c.phone,
            lastVisit: entryData.date,
          };
        }
        return c;
      });

      if (!customerExists) {
        const newCustomer: Customer = {
          id: `cust-${Date.now()}`,
          name: entryData.customerName,
          phone: entryData.customerPhone || '',
          totalPurchased: entryData.totalAmount,
          totalPaid: entryData.payingNow,
          balanceDue: entryData.dueAmount,
          lastVisit: entryData.date,
        };
        updatedCustomers.unshift(newCustomer);
      }

      // 2. Auto deduct stock if stock item was linked
      let updatedStock = prev.stock;
      if (entryData.stockItemId && entryData.quantity) {
        updatedStock = prev.stock.map((item) => {
          if (item.id === entryData.stockItemId) {
            return {
              ...item,
              quantity: Math.max(0, item.quantity - (entryData.quantity || 1)),
            };
          }
          return item;
        });
      }

      return {
        ...prev,
        transactions: [newEntry, ...prev.transactions],
        customers: updatedCustomers,
        stock: updatedStock,
      };
    });
  };

  // Handler: Delete transaction entry
  const handleDeleteEntry = (id: string) => {
    setDb((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((t) => t.id !== id),
    }));
  };

  // Handler: Add customer
  const handleAddCustomer = (customerData: Omit<Customer, 'id'>) => {
    const newCustomer: Customer = {
      ...customerData,
      id: `cust-${Date.now()}`,
    };
    setDb((prev) => ({
      ...prev,
      customers: [newCustomer, ...prev.customers],
    }));
  };

  // Handler: Settle payment from customer
  const handleSettlePayment = (
    customerId: string,
    amount: number,
    mode: 'Cash' | 'Online',
    notes: string
  ) => {
    setDb((prev) => {
      let customerName = '';
      let customerPhone = '';
      const updatedCustomers = prev.customers.map((c) => {
        if (c.id === customerId) {
          customerName = c.name;
          customerPhone = c.phone;
          const newDue = Math.max(0, c.balanceDue - amount);
          return {
            ...c,
            totalPaid: c.totalPaid + amount,
            balanceDue: newDue,
            lastVisit: new Date().toISOString().split('T')[0],
          };
        }
        return c;
      });

      // Also record as a payment received entry in ledger
      const paymentReceipt: TransactionEntry = {
        id: `tx-settle-${Date.now()}`,
        invoiceNo: `REC-${Date.now().toString().slice(-5)}`,
        date: new Date().toISOString().split('T')[0],
        customerName,
        customerPhone,
        customerId,
        itemDetails: `Khata Payment Settlement (${notes || 'Udhar Clearance'})`,
        totalAmount: amount,
        payingNow: amount,
        dueAmount: 0,
        paymentMode: mode,
        notes: `Received towards pending dues. ${notes}`,
        createdAt: new Date().toISOString(),
      };

      return {
        ...prev,
        customers: updatedCustomers,
        transactions: [paymentReceipt, ...prev.transactions],
      };
    });
  };

  // Stock Handlers
  const handleAddStockItem = (itemData: Omit<StockItem, 'id'>) => {
    const newItem: StockItem = {
      ...itemData,
      id: `stk-${Date.now()}`,
    };
    setDb((prev) => ({
      ...prev,
      stock: [newItem, ...prev.stock],
    }));
  };

  const handleUpdateStockQty = (id: string, newQty: number) => {
    setDb((prev) => ({
      ...prev,
      stock: prev.stock.map((s) => (s.id === id ? { ...s, quantity: newQty } : s)),
    }));
  };

  const handleUpdateStockItem = (updatedItem: StockItem) => {
    setDb((prev) => ({
      ...prev,
      stock: prev.stock.map((s) => (s.id === updatedItem.id ? updatedItem : s)),
    }));
  };

  const handleDeleteStockItem = (itemId: string) => {
    setDb((prev) => ({
      ...prev,
      stock: prev.stock.filter((s) => s.id !== itemId),
    }));
  };

  // Purchases Handlers (with automatic Dealer Ledger Synchronization)
  const handleAddPurchase = (purchaseData: Omit<PurchaseEntry, 'id'>) => {
    const newPurchase: PurchaseEntry = {
      ...purchaseData,
      id: `pur-${Date.now()}`,
    };

    setDb((prev) => {
      // Sync with dealer ledger
      const supplier = purchaseData.supplierName.trim();
      let dealerExists = false;
      const updatedDealers = (prev.dealers || []).map((d) => {
        if (d.name.toLowerCase() === supplier.toLowerCase()) {
          dealerExists = true;
          const newTotalPurchases = d.totalPurchases + purchaseData.totalAmount;
          const newTotalPaid = d.totalPaid + purchaseData.paidAmount;
          return {
            ...d,
            totalPurchases: newTotalPurchases,
            totalPaid: newTotalPaid,
            balanceDue: Math.max(0, newTotalPurchases - newTotalPaid),
            lastTransactionDate: purchaseData.date,
          };
        }
        return d;
      });

      if (!dealerExists && supplier) {
        updatedDealers.push({
          id: `dlr-${Date.now()}`,
          name: supplier,
          phone: '',
          totalPurchases: purchaseData.totalAmount,
          totalPaid: purchaseData.paidAmount,
          balanceDue: Math.max(0, purchaseData.totalAmount - purchaseData.paidAmount),
          lastTransactionDate: purchaseData.date,
        });
      }

      return {
        ...prev,
        purchases: [newPurchase, ...prev.purchases],
        dealers: updatedDealers,
      };
    });
  };

  // Card Scheme Handlers
  const handleAddCardMember = (memberData: Omit<CardMember, 'id'>) => {
    const newMember: CardMember = {
      ...memberData,
      id: `cm-${Date.now()}`,
    };
    setDb((prev) => ({
      ...prev,
      cardMembers: [newMember, ...(prev.cardMembers || [])],
    }));
  };

  const handleRecordCardTransaction = (txData: Omit<CardTransaction, 'id' | 'createdAt'>) => {
    const newTx: CardTransaction = {
      ...txData,
      id: `ctx-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    setDb((prev) => {
      // Update card member balances
      const updatedMembers = (prev.cardMembers || []).map((m) => {
        if (m.cardNumber === txData.cardNumber && m.schemeId === txData.schemeId) {
          let deposited = m.totalDeposited;
          let refunded = m.totalRefunded;

          if (txData.type === 'WeeklyPayment') {
            deposited += txData.amount;
          } else if (txData.type === 'Refund') {
            refunded += txData.amount;
          }

          const netBalance = Math.max(0, deposited - refunded);
          return {
            ...m,
            totalDeposited: deposited,
            totalRefunded: refunded,
            netBalance,
          };
        }
        return m;
      });

      return {
        ...prev,
        cardTransactions: [newTx, ...(prev.cardTransactions || [])],
        cardMembers: updatedMembers,
      };
    });
  };

  // Dealer Handlers
  const handleAddDealer = (dealerData: Omit<Dealer, 'id'>) => {
    const newDealer: Dealer = {
      ...dealerData,
      id: `dlr-${Date.now()}`,
    };
    setDb((prev) => ({
      ...prev,
      dealers: [newDealer, ...(prev.dealers || [])],
    }));
  };

  const handleRecordDealerPayment = (paymentData: Omit<DealerPayment, 'id' | 'createdAt'>) => {
    const newPayment: DealerPayment = {
      ...paymentData,
      id: `dp-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    setDb((prev) => {
      const updatedDealers = (prev.dealers || []).map((d) => {
        if (
          d.id === paymentData.dealerId ||
          d.name.toLowerCase() === paymentData.dealerName.toLowerCase()
        ) {
          const newPaid = d.totalPaid + paymentData.amount;
          return {
            ...d,
            totalPaid: newPaid,
            balanceDue: Math.max(0, d.totalPurchases - newPaid),
            lastTransactionDate: paymentData.date,
          };
        }
        return d;
      });

      return {
        ...prev,
        dealerPayments: [newPayment, ...(prev.dealerPayments || [])],
        dealers: updatedDealers,
      };
    });
  };

  // CSV Bulk Import Handlers
  const handleImportBills = (newBills: TransactionEntry[]) => {
    setDb((prev) => ({
      ...prev,
      transactions: [...newBills, ...prev.transactions],
    }));
  };

  const handleImportReceipts = (newReceipts: CardTransaction[]) => {
    setDb((prev) => ({
      ...prev,
      cardTransactions: [...newReceipts, ...(prev.cardTransactions || [])],
    }));
  };

  const handleImportCardMembers = (newCards: CardMember[]) => {
    setDb((prev) => ({
      ...prev,
      cardMembers: [...newCards, ...(prev.cardMembers || [])],
    }));
  };

  const handleImportPurchases = (newPurchases: PurchaseEntry[], importedDealers: Dealer[]) => {
    setDb((prev) => {
      // Merge dealers
      const currentDealers = [...(prev.dealers || [])];
      importedDealers.forEach((idlr) => {
        const idx = currentDealers.findIndex((cd) => cd.name.toLowerCase() === idlr.name.toLowerCase());
        if (idx >= 0) {
          currentDealers[idx].totalPurchases += idlr.totalPurchases;
          currentDealers[idx].totalPaid += idlr.totalPaid;
          currentDealers[idx].balanceDue = Math.max(0, currentDealers[idx].totalPurchases - currentDealers[idx].totalPaid);
        } else {
          currentDealers.push(idlr);
        }
      });

      return {
        ...prev,
        purchases: [...newPurchases, ...prev.purchases],
        dealers: currentDealers,
      };
    });
  };


  // Staff Handlers
  const handleAddStaff = (staffData: Omit<StaffMember, 'id'>) => {
    const newStaff: StaffMember = {
      ...staffData,
      id: `stf-${Date.now()}`,
    };
    setDb((prev) => ({
      ...prev,
      staff: [newStaff, ...prev.staff],
    }));
  };

  const handleUpdateAttendance = (
    id: string,
    status: 'Present' | 'Absent' | 'Half Day'
  ) => {
    setDb((prev) => ({
      ...prev,
      staff: prev.staff.map((s) =>
        s.id === id ? { ...s, attendanceToday: status } : s
      ),
    }));
  };

  const handleRecordAdvance = (id: string, amount: number) => {
    setDb((prev) => ({
      ...prev,
      staff: prev.staff.map((s) =>
        s.id === id ? { ...s, advancePaid: s.advancePaid + amount } : s
      ),
    }));
  };

  // Expenses Handlers
  const handleAddExpense = (expData: Omit<ExpenseEntry, 'id'>) => {
    const newExp: ExpenseEntry = {
      ...expData,
      id: `exp-${Date.now()}`,
    };
    setDb((prev) => ({
      ...prev,
      expenses: [newExp, ...prev.expenses],
    }));
  };

  // Settings & Backups
  const handleUpdateSettings = (newSettings: BusinessSettings) => {
    setDb((prev) => ({
      ...prev,
      settings: newSettings,
    }));
  };

  const handleExportData = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(db, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `ShriSaiEnt_backup_${new Date().toISOString().split('T')[0]}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && typeof parsed === 'object') {
          setDb({
            settings: parsed.settings || db.settings,
            stock: parsed.stock || db.stock,
            customers: parsed.customers || db.customers,
            transactions: parsed.transactions || db.transactions,
            purchases: parsed.purchases || db.purchases,
            staff: parsed.staff || db.staff,
            expenses: parsed.expenses || db.expenses,
            dealers: parsed.dealers || db.dealers || INITIAL_DEALERS,
            dealerPayments: parsed.dealerPayments || db.dealerPayments || INITIAL_DEALER_PAYMENTS,
            cardMembers: parsed.cardMembers || db.cardMembers || INITIAL_CARD_MEMBERS,
            cardTransactions: parsed.cardTransactions || db.cardTransactions || INITIAL_CARD_TRANSACTIONS,
          });
          alert('Data imported successfully!');
        }
      } catch (err) {
        alert('Invalid JSON backup file.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    const freshDb: AppDatabase = {
      settings: DEFAULT_SETTINGS,
      stock: INITIAL_STOCK,
      customers: INITIAL_CUSTOMERS,
      transactions: INITIAL_TRANSACTIONS,
      purchases: INITIAL_PURCHASES,
      staff: INITIAL_STAFF,
      expenses: INITIAL_EXPENSES,
      dealers: INITIAL_DEALERS,
      dealerPayments: INITIAL_DEALER_PAYMENTS,
      cardMembers: INITIAL_CARD_MEMBERS,
      cardTransactions: INITIAL_CARD_TRANSACTIONS,
    };
    setDb(freshDb);
  };

  if (appMode === 'shop') {
    return (
      <>
        <ShopLandingView
          settings={db.settings}
          stock={db.stock}
          cardMembers={db.cardMembers}
          cardTransactions={db.cardTransactions}
          onOpenLoginModal={() => setShowLoginModal(true)}
          initialPassbookCardNo={initialPassbookParam}
          initialInvoiceNo={initialInvoiceParam}
          isAdminLoggedIn={currentUser !== null}
          onGoToAdminDashboard={() => setAppMode('erp')}
          onUpdateStockItem={handleUpdateStockItem}
          onAddStockItem={handleAddStockItem}
          onDeleteStockItem={handleDeleteStockItem}
          onRecordOrder={handleSaveEntry}
        />

        {showLoginModal && (
          <LoginModal
            isOpen={showLoginModal}
            canClose={true}
            onClose={() => setShowLoginModal(false)}
            onLoginSuccess={(user) => {
              setCurrentUser(user);
              localStorage.setItem('shri_sai_auth_user', JSON.stringify(user));
              logAuthEventToCloud(user);
              setShowLoginModal(false);
              setAppMode('erp');
            }}
            adminEmail="shubhamh3098@gmail.com"
            adminName={db.settings.ownerName || 'Shubham (Admin)'}
            adminPassword={db.settings.adminPassword || 'admin'}
            staffPassword={db.settings.staffPassword || 'staff'}
            staffList={db.staff}
          />
        )}
      </>
    );
  }

  // Security Guard: Prevent unauthenticated users/customers from viewing internal ERP
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#0B1528] flex items-center justify-center p-4">
        <LoginModal
          isOpen={true}
          canClose={true}
          onClose={() => setAppMode('shop')}
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            localStorage.setItem('shri_sai_auth_user', JSON.stringify(user));
            logAuthEventToCloud(user);
            setShowLoginModal(false);
            setAppMode('erp');
          }}
          adminEmail="shubhamh3098@gmail.com"
          adminName={db.settings.ownerName || 'Shubham (Admin)'}
          adminPassword={db.settings.adminPassword || 'admin'}
          staffPassword={db.settings.staffPassword || 'staff'}
          staffList={db.staff}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex text-slate-800 antialiased font-sans">
      {/* Sidebar navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        settings={db.settings}
        isOpenMobile={isMobileOpen}
        setIsOpenMobile={setIsMobileOpen}
        cloudStatus={cloudStatus}
        lastSyncedTime={lastSyncedTime}
        onManualSync={handleManualCloudSync}
        currentUser={currentUser}
        onViewCustomerShop={() => setAppMode('shop')}
        onOpenInstallModal={() => setShowInstallModal(true)}
        onLogout={() => {
          setCurrentUser(null);
          localStorage.removeItem('shri_sai_auth_user');
          setAppMode('shop');
        }}
      />

      {/* Main Content View */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto pb-20 lg:pb-0">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between no-print">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm sm:text-base tracking-tight truncate">
                {db.settings.businessName}
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-mono font-medium border border-slate-200">
                Cloud ERP
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Install Mobile App button */}
            <button
              type="button"
              onClick={() => setShowInstallModal(true)}
              title="Install Official Mobile App"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden md:inline">मोबाईल ॲप</span>
              <span className="md:hidden">ॲप</span>
            </button>

            {/* View Customer Website button */}
            <button
              type="button"
              onClick={() => setAppMode('shop')}
              title="View Customer Website & Public Passbook Portal"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold transition cursor-pointer shadow-2xs"
            >
              <Store className="w-3.5 h-3.5 text-amber-700" />
              <span className="hidden sm:inline">Customer Website</span>
              <span className="sm:hidden">Shop</span>
            </button>

            {/* Real-time Google Cloud Sync Status Badge */}
            <button
              type="button"
              onClick={handleManualCloudSync}
              title="Real-time Google Cloud database sync. Click to force sync."
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition cursor-pointer ${
                cloudStatus === 'connected'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : cloudStatus === 'syncing'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span className="relative flex h-2 w-2">
                {cloudStatus === 'connected' && (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </>
                )}
                {cloudStatus === 'syncing' && (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500 animate-pulse"></span>
                )}
                {(cloudStatus === 'offline' || cloudStatus === 'error') && (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                )}
              </span>
              <Cloud className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {cloudStatus === 'connected' && 'Cloud Synced'}
                {cloudStatus === 'syncing' && 'Syncing...'}
                {cloudStatus === 'offline' && 'Offline'}
                {cloudStatus === 'error' && 'Sync Error'}
              </span>
            </button>

            {activeTab !== 'add-entry' && (
              <button
                onClick={() => setActiveTab('add-entry')}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                New Entry
              </button>
            )}

            {/* User Role Badge & Auth Switcher */}
            {currentUser ? (
              <div className="flex items-center gap-1.5 pl-1">
                <button
                  type="button"
                  onClick={() => setShowLoginModal(true)}
                  title="Role Switch / Change Account via Gmail OTP"
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                    currentUser.role === 'admin'
                      ? 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                  }`}
                >
                  {currentUser.role === 'admin' ? (
                    <Crown className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  ) : (
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  )}
                  <span>{currentUser.role === 'admin' ? 'Admin' : 'Staff'}</span>
                  <span className="hidden md:inline text-[11px] font-normal text-slate-500 font-mono">
                    ({currentUser.email.split('@')[0]})
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCurrentUser(null);
                    localStorage.removeItem('shri_sai_auth_user');
                    setAppMode('shop');
                  }}
                  title="Log out & Switch to Customer Website"
                  className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-600 transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowLoginModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Login (Gmail OTP)</span>
              </button>
            )}
          </div>
        </header>

        {/* View Switcher */}
        <main className="flex-1 pb-12">
          {activeTab === 'dashboard' && (
            <DashboardView
              transactions={db.transactions}
              customers={db.customers}
              stock={db.stock}
              settings={db.settings}
              onNavigate={setActiveTab}
              onOpenInvoiceModal={setSelectedInvoice}
            />
          )}

          {activeTab === 'add-entry' && (
            <AddEntryView
              onSaveEntry={handleSaveEntry}
              onBackToDashboard={() => setActiveTab('dashboard')}
              stockList={db.stock}
              customersList={db.customers}
              settings={db.settings}
              todaysTransactions={db.transactions.filter(
                (t) => t.date === new Date().toISOString().split('T')[0]
              )}
              onOpenInvoiceModal={setSelectedInvoice}
            />
          )}

          {activeTab === 'card-scheme' && (
            <CardSchemeView
              cardMembers={db.cardMembers || []}
              cardTransactions={db.cardTransactions || []}
              members={db.cardMembers || []}
              transactions={db.cardTransactions || []}
              staff={db.staff || []}
              onAddMember={handleAddCardMember}
              onRecordTransaction={handleRecordCardTransaction}
              settings={db.settings}
              onNavigateCsv={() => setActiveTab('csv-import')}
              salesBills={db.transactions}
            />
          )}

          {activeTab === 'dealer-ledger' && (
            <DealerLedgerView
              dealers={db.dealers || []}
              purchases={db.purchases}
              dealerPayments={db.dealerPayments || []}
              cardMembers={db.cardMembers || []}
              cardTransactions={db.cardTransactions || []}
              customers={db.customers || []}
              onAddDealer={handleAddDealer}
              onRecordDealerPayment={handleRecordDealerPayment}
              onAddPurchase={handleAddPurchase}
              settings={db.settings}
              onNavigateCardScheme={() => setActiveTab('card-scheme')}
              initialDealerName={selectedDealerForLedger}
            />
          )}

          {activeTab === 'csv-import' && (
            <CsvImportView
              onImportBills={handleImportBills}
              onImportReceipts={handleImportReceipts}
              onImportCardMembers={handleImportCardMembers}
              onImportPurchases={handleImportPurchases}
              existingCardMembers={db.cardMembers || []}
              existingDealers={db.dealers || []}
              onSwitchTab={setActiveTab}
            />
          )}

          {activeTab === 'all-entries' && (
            <AllEntriesView
              entries={db.transactions}
              onDeleteEntry={handleDeleteEntry}
              onNavigateAdd={() => setActiveTab('add-entry')}
              onOpenInvoiceModal={setSelectedInvoice}
              settings={db.settings}
            />
          )}

          {activeTab === 'customers' && (
            <CustomersView
              customers={db.customers}
              onAddCustomer={handleAddCustomer}
              onSettlePayment={handleSettlePayment}
              settings={db.settings}
            />
          )}

          {activeTab === 'stock' && (
            <StockView
              stock={db.stock}
              onAddStockItem={handleAddStockItem}
              onUpdateStockQty={handleUpdateStockQty}
            />
          )}

          {activeTab === 'purchases' && (
            <PurchasesView
              purchases={db.purchases}
              dealers={db.dealers || []}
              onAddPurchase={handleAddPurchase}
              onNavigateDealerLedger={(dealerName) => {
                setSelectedDealerForLedger(dealerName);
                setActiveTab('dealer-ledger');
              }}
            />
          )}

          {activeTab === 'staff' && (
            <StaffView
              staff={db.staff}
              onAddStaff={handleAddStaff}
              onUpdateAttendance={handleUpdateAttendance}
              onRecordAdvance={handleRecordAdvance}
            />
          )}

          {activeTab === 'expenses' && (
            <ExpensesView
              expenses={db.expenses}
              onAddExpense={handleAddExpense}
            />
          )}

          {activeTab === 'settings' && (
            currentUser?.role === 'staff' ? (
              <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
                  <Lock className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Admin Permissions Required</h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  सेटिंग्स और सिस्टम डेटा केवल Admin (मालिक) के लिए आरक्षित हैं।
                  <br />
                  यदि आप एडमिन हैं, तो कृपया अपने अधिकृत Gmail OTP से लॉगिन करें।
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowLoginModal(true)}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition cursor-pointer"
                  >
                    Switch to Admin Login (OTP)
                  </button>
                </div>
              </div>
            ) : (
              <SettingsView
                settings={db.settings}
                onUpdateSettings={handleUpdateSettings}
                onExportData={handleExportData}
                onImportData={handleImportData}
                onResetData={handleResetData}
                onClearAllDemoData={handleClearAllDemoData}
                cloudStatus={cloudStatus}
                lastSyncedTime={lastSyncedTime}
                onManualCloudSync={handleManualCloudSync}
                userRole={currentUser?.role || 'admin'}
              />
            )
          )}
        </main>
      </div>

      {/* Invoice modal for previewing, printing and WhatsApp sharing */}
      <InvoiceModal
        entry={selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        settings={db.settings}
      />

      {/* Login & Role Verification Modal with Gmail OTP & Password */}
      {showLoginModal && (
        <LoginModal
          isOpen={showLoginModal}
          canClose={true}
          onClose={() => setShowLoginModal(false)}
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            localStorage.setItem('shri_sai_auth_user', JSON.stringify(user));
            setShowLoginModal(false);
          }}
          adminEmail="shubhamh3098@gmail.com"
          adminName={db.settings.ownerName || 'Shubham (Admin)'}
          adminPassword={db.settings.adminPassword || 'admin'}
          staffPassword={db.settings.staffPassword || 'staff'}
          staffList={db.staff}
        />
      )}

      {/* Native Mobile Bottom Navigation Bar (for phones/tablets) */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenShopView={() => setAppMode('shop')}
        onOpenInstallModal={() => setShowInstallModal(true)}
        cloudStatus={cloudStatus}
        isInstallable={isInstallable}
      />

      {/* PWA Install Modal Dialog */}
      <PWAInstallModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
      />
    </div>
  );
}
