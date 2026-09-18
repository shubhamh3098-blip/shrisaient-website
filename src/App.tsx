import React, { useState, useEffect, useRef } from 'react';
import { Menu, Globe, Store, PlusCircle, Cloud, RefreshCw, CheckCircle2, Crown, UserCheck, LogOut, Lock, Download, Search, Database, CreditCard, Zap, Sun, Moon } from 'lucide-react';
import { useTheme } from './context/ThemeContext';
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
  UserRole,
  AgentAdvance,
  BillReceiptEntry
} from './types';
import {
  getStoredCustomerMerges,
  saveStoredCustomerMerges,
  executeFullCustomerMerge,
  detectDuplicateCustomers
} from './utils/customerDeduplication';
import {
  getNextAgainstBillReceiptNumber
} from './utils/numbering';
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
import { loadDatabaseFromIndexedDB, saveDatabaseToIndexedDB, clearDatabaseFromIndexedDB } from './utils/indexedDb';
import {
  subscribeToCloudDatabase,
  syncDatabaseToCloud,
  logAuthEventToCloud,
  resetFirestoreQuotaFlag,
  CloudSyncStatus
} from './lib/firebase';
import { Sidebar } from './components/Sidebar';
import { AddEntryView } from './components/AddEntryView';
import { DashboardView } from './components/DashboardView';
import { AllEntriesView } from './components/AllEntriesView';
import { CustomersView } from './components/CustomersView';
import { BillReceiptsView } from './components/BillReceiptsView';
import { StockView } from './components/StockView';
import { PurchasesView } from './components/PurchasesView';
import { StaffView } from './components/StaffView';
import { ExpensesView } from './components/ExpensesView';
import { SettingsView } from './components/SettingsView';
import { AgentCommissionView } from './components/AgentCommissionView';
import { InvoiceModal } from './components/InvoiceModal';
import { CardSchemeView } from './components/CardSchemeView';
import { DealerLedgerView } from './components/DealerLedgerView';
import { CsvImportView } from './components/CsvImportView';
import { UploadedDataView } from './components/UploadedDataView';
import { LoginModal } from './components/LoginModal';
import { ShopLandingView } from './components/ShopLandingView';
import { MobileBottomNav } from './components/MobileBottomNav';
import { PWAInstallModal } from './components/PWAInstallModal';
import { usePWAInstall } from './utils/usePWAInstall';
import { FieldStaffQuickActions, FieldActionTab } from './components/FieldStaffQuickActions';
import { ThemeToggle } from './components/ThemeToggle';
import QuickActionsBar from './components/QuickActionsBar';
import { GLOBAL_ZERO_RESET_KEY } from './utils/storage';
import { clearStoredCustomerMerges } from './utils/customerDeduplication';

// One-time fresh startup reset: clears any stale cache in browser localStorage and IndexedDB
if (typeof window !== 'undefined') {
  try {
    if (localStorage.getItem(GLOBAL_ZERO_RESET_KEY) !== 'done') {
      localStorage.setItem(GLOBAL_ZERO_RESET_KEY, 'done');
      localStorage.removeItem('shri_sai_enterprise_db');
      localStorage.removeItem('shri_sai_customer_merges');
      clearDatabaseFromIndexedDB().catch(() => {});
    }
  } catch (e) {}
}

export default function App() {
  const [db, setDb] = useState<AppDatabase>(() => loadDatabase());
  const [activeTab, setActiveTab] = useState<ActiveTab>('add-entry'); // matches the user's workflow where "Add Entry" is active
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<TransactionEntry | null>(null);
  const [selectedDealerForLedger, setSelectedDealerForLedger] = useState<string | undefined>();
  const [cloudStatus, setCloudStatus] = useState<CloudSyncStatus>('syncing');
  const [lastSyncedTime, setLastSyncedTime] = useState<string>('');
  
  // Application Mode: Default to 'erp' (Internal Business Management) for immediate and effortless testing
  const [appMode, setAppMode] = useState<'erp' | 'shop'>(() => {
    if (typeof window === 'undefined') return 'erp';
    const params = new URLSearchParams(window.location.search);
    if (params.get('passbook') || params.get('invoice') || params.get('view') === 'shop') {
      return 'shop';
    }
    return 'erp';
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
  // Direct admin login for smooth testing of billing, merging, and customer management
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    if (params.get('passbook') || params.get('invoice') || params.get('view') === 'shop') {
      return null;
    }
    try {
      const saved = localStorage.getItem('shri_sai_auth_user');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    const defaultUser: AuthUser = {
      id: 'usr-admin-shubham',
      email: 'shubhamh3098@gmail.com',
      name: 'Shubham Shende',
      role: 'admin',
      phone: '8766486915',
      loggedInAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem('shri_sai_auth_user', JSON.stringify(defaultUser));
    } catch (e) {}
    return defaultUser;
  });
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false);
  const [showFieldQuickActions, setShowFieldQuickActions] = useState<boolean>(false);
  const [fieldQuickActionTab, setFieldQuickActionTab] = useState<FieldActionTab>('card-collection');
  const [selectedAgentForCommission, setSelectedAgentForCommission] = useState<string>('Shubham Shende');
  const { isInstallable } = usePWAInstall();
  const { theme, toggleTheme } = useTheme();
  
  const isRemoteUpdateRef = useRef(false);

  // Auto-detect PWA standalone mode and URL shortcut parameters for Field Staff
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    const actionParam = params.get('action');

    // Check if launched as PWA shortcut or has action params
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (tabParam) {
      if (
        tabParam === 'dashboard' ||
        tabParam === 'add-entry' ||
        tabParam === 'all-entries' ||
        tabParam === 'customers' ||
        tabParam === 'stock' ||
        tabParam === 'purchases' ||
        tabParam === 'staff' ||
        tabParam === 'agent-commission' ||
        tabParam === 'expenses' ||
        tabParam === 'settings' ||
        tabParam === 'card-scheme' ||
        tabParam === 'dealer-ledger' ||
        tabParam === 'csv-import' ||
        tabParam === 'uploaded-data'
      ) {
        setActiveTab(tabParam as ActiveTab);
        setAppMode('erp');
      }
    }

    // Direct action routing from PWA shortcuts
    if (actionParam === 'collection') {
      setFieldQuickActionTab('card-collection');
      setShowFieldQuickActions(true);
    } else if (actionParam === 'receipt') {
      setFieldQuickActionTab('receipt');
      setShowFieldQuickActions(true);
    } else if (actionParam === 'sales') {
      setFieldQuickActionTab('sales');
      setShowFieldQuickActions(true);
    } else if (actionParam === 'ledger') {
      setFieldQuickActionTab('ledger');
      setShowFieldQuickActions(true);
    } else if (isStandalone) {
      // When opened from home screen icon:
      // If user is staff or prefers card collection/entry, bring to card-scheme or show quick actions
      const savedUser = localStorage.getItem('shri_sai_auth_user');
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          if (parsed.role === 'staff') {
            setActiveTab('card-scheme');
            setAppMode('erp');
          }
        } catch (e) {}
      }
    }
  }, []);

  // Clear demo data handler - resets customers, transactions, card members to a clean slate
  const handleClearAllDemoData = async () => {
    await handleResetData('all');
    alert(
      'यशस्वी: सर्व ग्राहक, विक्री नोंदी (Transactions), कार्ड मेंबर्स व जुना डेटा पूर्णपणे साफ़ (Reset) करण्यात आला आहे!\n\nआता सर्व रेकॉर्ड्स ₹0 बॅलन्ससह पूर्णपणे ताजे व स्वच्छ आहेत.'
    );
  };

  const lastImportTimeRef = useRef<number>(0);
  const isResettingRef = useRef<boolean>(false);

  // Helper: safely merges remote/idb items into local state without ever wiping out existing local data
  const safeMergeCollections = <T extends Record<string, any>>(
    localList: T[] = [],
    remoteList: T[] = [],
    getKey: (item: T) => string
  ): T[] => {
    // If remote is empty, NEVER wipe out local list!
    if (!remoteList || remoteList.length === 0) {
      return localList || [];
    }
    // If local is empty, take remote
    if (!localList || localList.length === 0) {
      return remoteList;
    }

    const map = new Map<string, T>();
    // 1. Put remote entries first
    remoteList.forEach((item) => {
      const key = getKey(item);
      if (key) map.set(key, item);
    });
    // 2. Local entries take precedence (prevents stale remote/idb from downgrading freshly imported data)
    localList.forEach((item) => {
      const key = getKey(item);
      if (key) {
        const existing = map.get(key);
        map.set(key, existing ? { ...existing, ...item } : item);
      }
    });

    return Array.from(map.values());
  };

  // 0. Load comprehensive state from IndexedDB on startup (bypasses localStorage 5MB quota)
  useEffect(() => {
    let isMounted = true;
    loadDatabaseFromIndexedDB().then((idbData) => {
      if (!isMounted || !idbData || isResettingRef.current) return;
      setDb((prev) => {
        // If a local import just happened in the last 60 seconds, do not let older IDB state overwrite it
        const isRecent = (Date.now() - lastImportTimeRef.current) < 60000;
        if (isRecent) {
          return prev;
        }

        // Build exclusion set for merged secondary customers
        const allMerges = getStoredCustomerMerges();
        const mergedSecIds = new Set<string>();
        const mergedSecNames = new Set<string>();
        [...(prev.mergedRecords || []), ...(idbData.mergedRecords || [])].forEach((r) => {
          if (r.secondaryId) mergedSecIds.add(r.secondaryId);
          if (r.secondaryName) mergedSecNames.add(r.secondaryName.trim().toLowerCase());
        });
        Object.entries(allMerges).forEach(([k, rec]) => {
          if (rec && rec.primaryId) {
            mergedSecIds.add(k);
            mergedSecNames.add(k.toLowerCase());
          }
        });

        const rawCustomers = safeMergeCollections(prev.customers || [], idbData.customers || [], (c) => c.id || c.phone || c.name);
        const filteredCustomers = rawCustomers.filter((c) => {
          if (mergedSecIds.has(c.id)) return false;
          const n = (c.name || '').trim().toLowerCase();
          if (mergedSecNames.has(n)) {
            const rec = allMerges[n];
            if (rec && rec.primaryId !== c.id) return false;
          }
          return true;
        });

        return {
          ...prev,
          settings: { ...prev.settings, ...(idbData.settings || {}) },
          stock: safeMergeCollections(prev.stock || [], idbData.stock || [], (s) => s.id || s.name),
          customers: filteredCustomers,
          transactions: safeMergeCollections(prev.transactions || [], idbData.transactions || [], (t) => t.invoiceNo || t.id),
          cardTransactions: safeMergeCollections(prev.cardTransactions || [], idbData.cardTransactions || [], (ct) => ct.receiptNo || ct.id),
          cardMembers: safeMergeCollections(prev.cardMembers || [], idbData.cardMembers || [], (cm) => `${cm.schemeId}_${cm.cardNumber}`),
          billReceipts: safeMergeCollections(prev.billReceipts || [], idbData.billReceipts || [], (br) => br.receiptNo || br.id),
          dealers: safeMergeCollections(prev.dealers || [], idbData.dealers || [], (d) => d.id || d.name),
          purchases: safeMergeCollections(prev.purchases || [], idbData.purchases || [], (p) => p.billNo || p.id),
          dealerPayments: safeMergeCollections(prev.dealerPayments || [], idbData.dealerPayments || [], (dp) => dp.id || ''),
          expenses: safeMergeCollections(prev.expenses || [], idbData.expenses || [], (e) => e.id || ''),
          agentAdvances: safeMergeCollections(prev.agentAdvances || [], idbData.agentAdvances || [], (a) => a.id || ''),
        };
      });
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // 1. Real-time Cloud Firestore Listener (Across All Devices & shrisaient.in)
  useEffect(() => {
    const unsubscribe = subscribeToCloudDatabase(
      (remoteData) => {
        if (remoteData && !isResettingRef.current) {
          isRemoteUpdateRef.current = true;
          setDb((prev) => {
            // If a local CSV import occurred recently, strictly protect local data from being downgraded
            const isRecentLocalImport = (Date.now() - lastImportTimeRef.current) < 60000;

            const mergedTransactions = isRecentLocalImport && (prev.transactions || []).length > 0
              ? safeMergeCollections(prev.transactions || [], remoteData.transactions || [], (t) => (t.invoiceNo ? `inv_${t.invoiceNo.toLowerCase().trim()}` : t.id || ''))
              : safeMergeCollections(
                  prev.transactions || [],
                  remoteData.transactions || [],
                  (t) => (t.invoiceNo ? `inv_${t.invoiceNo.toLowerCase().trim()}` : t.id || '')
                );

            const mergedCardTransactions = safeMergeCollections(
              prev.cardTransactions || [],
              remoteData.cardTransactions || [],
              (ct) => (ct.receiptNo ? `rcpt_${ct.receiptNo}` : ct.id || '')
            );

            const mergedCardMembers = safeMergeCollections(
              prev.cardMembers || [],
              remoteData.cardMembers || [],
              (cm) => (cm.schemeId && cm.cardNumber ? `${cm.schemeId}_${cm.cardNumber}` : cm.id || '')
            );

            // Filter out any merged secondary accounts from incoming cloud customers
            const allCloudMerges = getStoredCustomerMerges();
            const cloudMergedSecIds = new Set<string>();
            const cloudMergedSecNames = new Set<string>();
            [...(prev.mergedRecords || []), ...(remoteData.mergedRecords || [])].forEach((r) => {
              if (r.secondaryId) cloudMergedSecIds.add(r.secondaryId);
              if (r.secondaryName) cloudMergedSecNames.add(r.secondaryName.trim().toLowerCase());
            });
            Object.entries(allCloudMerges).forEach(([k, rec]) => {
              if (rec && rec.primaryId) {
                cloudMergedSecIds.add(k);
                cloudMergedSecNames.add(k.toLowerCase());
              }
            });

            const mergedCustomers = safeMergeCollections(
              prev.customers || [],
              remoteData.customers || [],
              (c) => (c.phone && c.phone.length >= 10 ? `p_${c.phone}` : (c.id || c.name.toLowerCase().trim()))
            ).filter((c) => {
              if (cloudMergedSecIds.has(c.id)) return false;
              const n = (c.name || '').trim().toLowerCase();
              if (cloudMergedSecNames.has(n)) {
                const rec = allCloudMerges[n];
                if (rec && rec.primaryId !== c.id) return false;
              }
              return true;
            });

            const mergedBillReceipts = safeMergeCollections(
              prev.billReceipts || [],
              remoteData.billReceipts || [],
              (br) => (br.receiptNo ? `br_${br.receiptNo}` : br.id || '')
            );

            const mergedStock = safeMergeCollections(
              prev.stock || [],
              remoteData.stock || [],
              (s) => s.id || s.name.toLowerCase().trim()
            );

            const mergedPurchases = safeMergeCollections(
              prev.purchases || [],
              remoteData.purchases || [],
              (p) => (p.billNo ? `p_${p.billNo.toLowerCase().trim()}` : p.id || '')
            );

            const mergedDealers = safeMergeCollections(
              prev.dealers || [],
              remoteData.dealers || [],
              (d) => d.id || d.name.toLowerCase().trim()
            );

            const mergedDealerPayments = safeMergeCollections(
              prev.dealerPayments || [],
              remoteData.dealerPayments || [],
              (dp) => dp.id || ''
            );

            const mergedExpenses = safeMergeCollections(
              prev.expenses || [],
              remoteData.expenses || [],
              (e) => e.id || ''
            );

            const mergedAgentAdvances = safeMergeCollections(
              prev.agentAdvances || [],
              remoteData.agentAdvances || [],
              (a) => a.id || ''
            );

            const updated: AppDatabase = {
              ...prev,
              settings: remoteData.settings ? { ...prev.settings, ...remoteData.settings } : prev.settings,
              stock: mergedStock,
              customers: mergedCustomers,
              transactions: mergedTransactions,
              purchases: mergedPurchases,
              dealers: mergedDealers,
              dealerPayments: mergedDealerPayments,
              cardMembers: mergedCardMembers,
              cardTransactions: mergedCardTransactions,
              staff: remoteData.staff && remoteData.staff.length > 0 ? remoteData.staff : prev.staff,
              expenses: mergedExpenses,
              agentAdvances: mergedAgentAdvances,
              billReceipts: mergedBillReceipts,
              mergedRecords: remoteData.mergedRecords || prev.mergedRecords || [],
            };

            return updated;
          });
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
  const isInitialMountRef = useRef(true);
  const initialReconcileDoneRef = useRef(false);

  useEffect(() => {
    saveDatabase(db);
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }
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

  // One-time self-healing reconcile on startup once transactions exist
  useEffect(() => {
    if (!initialReconcileDoneRef.current && (db.transactions?.length > 0 || (db.cardTransactions && db.cardTransactions.length > 0))) {
      initialReconcileDoneRef.current = true;
      const timer = setTimeout(() => {
        handleRecheckLedgers();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [db.transactions?.length, db.cardTransactions?.length]);

  const handleManualCloudSync = async () => {
    await resetFirestoreQuotaFlag();
    setCloudStatus('syncing');
    syncDatabaseToCloud(db, (status) => {
      setCloudStatus(status);
      if (status === 'connected') {
        setLastSyncedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    }, true);
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

      // 2. Auto deduct stock if stock item was linked (supports multiple itemsDetail)
      let updatedStock = prev.stock;
      if (entryData.itemsDetail && entryData.itemsDetail.length > 0) {
        const deductMap = new Map<string, number>();
        entryData.itemsDetail.forEach((item) => {
          if (item.stockItemId) {
            deductMap.set(item.stockItemId, (deductMap.get(item.stockItemId) || 0) + (item.quantity || 1));
          }
        });
        if (deductMap.size > 0) {
          updatedStock = prev.stock.map((s) => {
            if (deductMap.has(s.id)) {
              return {
                ...s,
                quantity: Math.max(0, s.quantity - (deductMap.get(s.id) || 1)),
              };
            }
            return s;
          });
        }
      } else if (entryData.stockItemId && entryData.quantity) {
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

  // Handler: Settle payment from customer (generates an official Against Bill Receipt)
  const handleSettlePayment = (
    customerId: string,
    amount: number,
    mode: 'Cash' | 'Online',
    notes: string
  ) => {
    setDb((prev) => {
      let customerName = '';
      let customerPhone = '';
      let prevDue = 0;
      let newDue = 0;

      const updatedCustomers = prev.customers.map((c) => {
        if (c.id === customerId) {
          customerName = c.name;
          customerPhone = c.phone;
          prevDue = c.balanceDue || 0;
          newDue = Math.max(0, prevDue - amount);
          return {
            ...c,
            totalPaid: (c.totalPaid || 0) + amount,
            balanceDue: newDue,
            lastVisit: new Date().toISOString().split('T')[0],
          };
        }
        return c;
      });

      // Compute next sequential receipt number (baseline 1078, so starting from 1079+)
      const receiptNo = getNextAgainstBillReceiptNumber(prev.billReceipts || [], prev.transactions || []);

      // Also record as a payment received entry in ledger
      const paymentReceipt: TransactionEntry = {
        id: `tx-settle-${Date.now()}`,
        invoiceNo: `REC-${receiptNo}`,
        date: new Date().toISOString().split('T')[0],
        customerName,
        customerPhone,
        customerId,
        agentName: currentUser?.name || 'दुकान काउंटर',
        itemDetails: `बिलाविरोधात जमा पावती #${receiptNo} (${notes || 'पार्ट पेमेंट / उधारी जमा'})`,
        totalAmount: amount,
        payingNow: amount,
        dueAmount: 0,
        paymentMode: mode,
        notes: `Received towards pending dues. ${notes}`,
        createdAt: new Date().toISOString(),
      };

      const billReceiptEntry: BillReceiptEntry = {
        id: `rcp-${Date.now()}`,
        receiptNo,
        date: new Date().toISOString().split('T')[0],
        customerId,
        customerName,
        customerPhone,
        previousBalance: prevDue,
        amountPaid: amount,
        remainingBalance: newDue,
        paymentMode: mode,
        agentName: currentUser?.name || 'दुकान काउंटर',
        notes: notes || 'पार्ट पेमेंट / हप्ता जमा',
        createdAt: new Date().toISOString(),
      };

      return {
        ...prev,
        customers: updatedCustomers,
        transactions: [paymentReceipt, ...prev.transactions],
        billReceipts: [billReceiptEntry, ...(prev.billReceipts || [])],
      };
    });
  };

  // Handler: Save against-bill receipt directly from BillReceiptsView
  const handleSaveBillReceipt = (receipt: BillReceiptEntry) => {
    setDb((prev) => {
      // 1. Update customer's balance and total paid
      const updatedCustomers = prev.customers.map((c) => {
        if (c.id === receipt.customerId) {
          return {
            ...c,
            totalPaid: (c.totalPaid || 0) + receipt.amountPaid,
            balanceDue: Math.max(0, receipt.remainingBalance),
            lastVisit: receipt.date,
          };
        }
        return c;
      });

      // 2. Add as transaction for day-end cashbook reconciliation
      const ledgerEntry: TransactionEntry = {
        id: `tx-rcp-${Date.now()}`,
        invoiceNo: `REC-${receipt.receiptNo}`,
        date: receipt.date,
        customerName: receipt.customerName,
        customerPhone: receipt.customerPhone,
        customerId: receipt.customerId,
        agentName: receipt.agentName,
        itemDetails: `बिलाविरोधात जमा पावती #${receipt.receiptNo} (${receipt.againstInvoiceNo ? `बिल क्र. ${receipt.againstInvoiceNo}` : 'पार्ट पेमेंट'})`,
        totalAmount: receipt.amountPaid,
        payingNow: receipt.amountPaid,
        dueAmount: 0,
        paymentMode: receipt.paymentMode,
        notes: `बिलाविरोधात जमा: ${receipt.notes || 'भागशः भरणा'}`,
        createdAt: new Date().toISOString(),
      };

      return {
        ...prev,
        customers: updatedCustomers,
        transactions: [ledgerEntry, ...prev.transactions],
        billReceipts: [receipt, ...(prev.billReceipts || [])],
      };
    });
  };

  // Handler: Delete against-bill receipt
  const handleDeleteBillReceipt = (receiptId: string) => {
    setDb((prev) => ({
      ...prev,
      billReceipts: (prev.billReceipts || []).filter((r) => r.id !== receiptId),
    }));
  };

  const handleRecheckLedgers = () => {
    setDb((prev) => {
      // 1. Purge zero-amount ghost transactions and sanitize phones & names
      const validTransactions = (prev.transactions || [])
        .filter(
          (t) =>
            Number(t.totalAmount || 0) > 0 ||
            Number(t.payingNow || 0) > 0 ||
            Number(t.dueAmount || 0) > 0 ||
            (t.invoiceNo && t.invoiceNo.trim().length > 0)
        )
        .map((t, idx) => {
          // Clean phone: strip '0', '00', short/invalid strings
          const rawP = (t.customerPhone || '').toString().trim();
          let cleanP = rawP.replace(/\D/g, '');
          if (cleanP.length < 10 || /^(\d)\1{9,}$/.test(cleanP) || rawP === '0' || rawP === '00') {
            cleanP = '';
          } else if (cleanP.length === 12 && cleanP.startsWith('91')) {
            cleanP = cleanP.slice(2);
          } else if (cleanP.length > 10) {
            cleanP = cleanP.slice(-10);
          }

          // Clean name: provide fallback if empty or just '0'
          let cleanN = (t.customerName || '').trim();
          if (!cleanN || cleanN === '0' || cleanN === '-') {
            cleanN = `ग्राहक (बिल #${t.invoiceNo || idx + 1}${t.village ? ` - ${t.village}` : ''})`;
          }

          return {
            ...t,
            customerPhone: cleanP,
            customerName: cleanN,
            village: (t.village || '').trim(),
          };
        });

      // 2. Build or resolve individual customer accounts from transactions
      // CRITICAL: NEVER group customers by phone if phone is empty or '0'.
      // If phone is empty, group ONLY by exact (name + village).
      // If name is generic/missing, treat each bill as an individual customer.
      const customerMap = new Map<string, Customer>();
      const existingCustomers = (prev.customers || []).map((c) => {
        let cleanPhone = (c.phone || '').toString().trim().replace(/\D/g, '');
        if (cleanPhone.length < 10 || /^(\d)\1{9,}$/.test(cleanPhone)) {
          cleanPhone = '';
        } else if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
          cleanPhone = cleanPhone.slice(2);
        } else if (cleanPhone.length > 10) {
          cleanPhone = cleanPhone.slice(-10);
        }
        return {
          ...c,
          phone: cleanPhone,
          name: (c.name || '').trim(),
          village: (c.village || '').trim(),
        };
      });

      // Index existing customers
      const existingByPhone = new Map<string, Customer>();
      const existingByNameVillage = new Map<string, Customer>();
      const existingByName = new Map<string, Customer>();
      const existingById = new Map<string, Customer>();

      existingCustomers.forEach((c) => {
        existingById.set(c.id, c);
        if (c.phone) {
          existingByPhone.set(c.phone, c);
        }
        if (c.name) {
          const n = c.name.toLowerCase().trim();
          const v = (c.village || '').toLowerCase().trim();
          existingByNameVillage.set(`${n}::${v}`, c);
          if (!existingByName.has(n)) {
            existingByName.set(n, c);
          }
        }
      });

      // For transactions: map each to an exact individual customer key
      const txToCustKey = new Map<string, string>();
      const storedMerges = getStoredCustomerMerges();

      // Build lookup for secondary IDs and names that have been permanently merged
      const mergedSecToPrimary = new Map<string, string>();
      const mergedNameToPrimary = new Map<string, string>();
      (prev.mergedRecords || []).forEach((r) => {
        if (r.secondaryId && r.primaryId) mergedSecToPrimary.set(r.secondaryId, r.primaryId);
        if (r.secondaryName && r.primaryId) mergedNameToPrimary.set(r.secondaryName.trim().toLowerCase(), r.primaryId);
      });
      Object.entries(storedMerges).forEach(([k, rec]) => {
        if (rec && rec.primaryId) {
          mergedSecToPrimary.set(k, rec.primaryId);
          mergedNameToPrimary.set(k.toLowerCase(), rec.primaryId);
        }
      });

      validTransactions.forEach((t) => {
        let phone = t.customerPhone || '';
        let nameLower = (t.customerName || '').trim().toLowerCase();
        let villageLower = (t.village || '').trim().toLowerCase();

        // 1. Resolve permanently merged customer accounts
        if (t.customerId && mergedSecToPrimary.has(t.customerId)) {
          t.customerId = mergedSecToPrimary.get(t.customerId)!;
        }
        if (nameLower && mergedNameToPrimary.has(nameLower)) {
          t.customerId = mergedNameToPrimary.get(nameLower)!;
        }

        const mergeRecord = storedMerges[nameLower] || (t.customerId ? storedMerges[t.customerId] : undefined);
        if (mergeRecord) {
          t.customerName = mergeRecord.primaryName;
          nameLower = mergeRecord.primaryName.trim().toLowerCase();
          if (mergeRecord.primaryPhone && !phone) {
            phone = mergeRecord.primaryPhone;
            t.customerPhone = phone;
          }
        }

        // Auto-consolidate Shesh Bhagat / Sheshrav Bhagat (the exact case reported by the user)
        const isSheshBhagat =
          (nameLower.includes('shesh') || nameLower.includes('sheshrav') || nameLower.includes('sheshrao')) &&
          nameLower.includes('bhagat');
        if (isSheshBhagat) {
          phone = phone || '9623626338';
          t.customerPhone = phone;
          t.customerName = 'SHESHRAO BHAGAT';
          nameLower = 'sheshrao bhagat';
          if (!t.village) t.village = 'Satoda, Wardha';
          villageLower = 'satoda';
        }

        const isGeneric = !nameLower || nameLower.startsWith('ग्राहक #') || nameLower.startsWith('ग्राहक (बिल #') || nameLower.startsWith('customer #');

        let key = '';
        if (t.customerId && existingById.has(t.customerId)) {
          // If transaction is already cleanly linked to an existing customer ID, keep it linked!
          key = `id:${t.customerId}`;
        } else if (phone) {
          // Valid phone number is a unique customer key
          key = `phone:${phone}`;
        } else if (isGeneric) {
          // Generic or unnamed bill: NEVER merge with other records!
          key = `bill:${t.invoiceNo || t.id}`;
        } else if (existingByName.has(nameLower)) {
          // Exact name match in existing accounts (unify missing vs present village to avoid duplicates)
          key = `id:${existingByName.get(nameLower)!.id}`;
        } else {
          // Distinct person identified by (Name + Village)
          key = `nv:${nameLower}::${villageLower}`;
        }

        txToCustKey.set(t.id, key);

        if (!customerMap.has(key)) {
          // Resolve customer object from existing or create fresh
          let matchedExisting: Customer | undefined;
          if (key.startsWith('id:')) {
            const custId = key.slice(3);
            matchedExisting = existingById.get(custId);
          } else if (phone && existingByPhone.has(phone)) {
            matchedExisting = existingByPhone.get(phone);
          } else if (!isGeneric && existingByNameVillage.has(`${nameLower}::${villageLower}`)) {
            matchedExisting = existingByNameVillage.get(`${nameLower}::${villageLower}`);
          } else if (!isGeneric && existingByName.has(nameLower)) {
            matchedExisting = existingByName.get(nameLower);
          }

          if (matchedExisting) {
            customerMap.set(key, {
              ...matchedExisting,
              name: t.customerName,
              phone: phone || matchedExisting.phone || '',
              village: t.village || matchedExisting.village || '',
              totalPurchased: 0,
              totalPaid: 0,
              balanceDue: 0,
            });
          } else {
            const newId = `cust-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
            customerMap.set(key, {
              id: newId,
              name: t.customerName,
              phone: phone,
              village: t.village || '',
              address: t.village ? `${t.village}, Wardha` : '',
              totalPurchased: 0,
              totalPaid: 0,
              balanceDue: 0,
              createdAt: t.date || new Date().toISOString().split('T')[0],
            });
          }
        }
      });

      // 3. Assign transaction customerIds and compute exact ledger totals
      const customerPaymentVouchers = new Map<string, Set<string>>();
      const customerPaymentDateAmts = new Map<string, Set<string>>();

      const reconciledTransactions = validTransactions.map((t) => {
        const key = txToCustKey.get(t.id)!;
        const cust = customerMap.get(key)!;
        const isReceipt = t.invoiceNo?.startsWith('REC-') || t.itemDetails?.toLowerCase().includes('settlement');

        if (!customerPaymentVouchers.has(cust.id)) {
          customerPaymentVouchers.set(cust.id, new Set());
          customerPaymentDateAmts.set(cust.id, new Set());
        }
        const vSet = customerPaymentVouchers.get(cust.id)!;
        const daSet = customerPaymentDateAmts.get(cust.id)!;

        if (isReceipt) {
          const recAmt = Number(t.payingNow || t.totalAmount || 0);
          const vCode = (t.invoiceNo || '').trim().toUpperCase();
          const normCode = vCode.replace(/^(REC-PAY-|REC-|PAY-)/i, '').trim();

          // Deduplicate if already processed
          if ((vCode && vSet.has(vCode)) || (normCode && vSet.has(normCode))) {
            return {
              ...t,
              customerId: cust.id,
              customerName: cust.name,
              customerPhone: cust.phone,
              village: cust.village || t.village,
            };
          }

          if (vCode) vSet.add(vCode);
          if (normCode) vSet.add(normCode);
          if (t.date && recAmt > 0) daSet.add(`${t.date}_${recAmt}`);

          cust.totalPaid += recAmt;
        } else {
          cust.totalPurchased += Number(t.totalAmount || 0);
          cust.totalPaid += Number(t.payingNow || 0);
          if (t.payingNow > 0 && t.invoiceNo) {
            vSet.add(`RCPT-${t.invoiceNo.trim().toUpperCase()}`);
            if (t.date) daSet.add(`${t.date}_${t.payingNow}`);
          }
        }

        return {
          ...t,
          customerId: cust.id,
          customerName: cust.name,
          customerPhone: cust.phone,
          village: cust.village || t.village,
        };
      });

      // 4. Also account for Card Transactions (excluding any receipts already accounted for in transactions)
      (prev.cardTransactions || []).forEach((ct) => {
        const ctPhone = (ct.customerPhone || '').replace(/\D/g, '');
        const isCtPhoneValid = ctPhone.length >= 10 && !/^(\d)\1{9,}$/.test(ctPhone);
        const ctNameLower = (ct.memberName || ct.customerName || '').trim().toLowerCase();
        const ctVillageLower = (ct.village || (ct as any).customerVillage || '').trim().toLowerCase();

        let matchedCust: Customer | undefined;
        if (isCtPhoneValid && customerMap.has(`phone:${ctPhone}`)) {
          matchedCust = customerMap.get(`phone:${ctPhone}`);
        } else if (ctNameLower && customerMap.has(`nv:${ctNameLower}::${ctVillageLower}`)) {
          matchedCust = customerMap.get(`nv:${ctNameLower}::${ctVillageLower}`);
        } else if (ctNameLower && customerMap.has(`nv:${ctNameLower}::`)) {
          matchedCust = customerMap.get(`nv:${ctNameLower}::`);
        }

        if (matchedCust) {
          const vSet = customerPaymentVouchers.get(matchedCust.id);
          const daSet = customerPaymentDateAmts.get(matchedCust.id);

          const rcptCode = String(ct.receiptNo || '').trim().toUpperCase();
          const normCode = rcptCode.replace(/^(REC-PAY-|REC-|PAY-)/i, '').trim();
          const amt = Number(ct.amount || 0);
          const isCard = !!ct.cardNumber;

          // If this receipt voucher was ALREADY processed in transactions for this customer, DO NOT count it twice!
          if (vSet) {
            if (rcptCode && vSet.has(rcptCode)) return;
            if (normCode && vSet.has(normCode)) return;
          }
          if (!isCard && daSet && ct.date && amt > 0 && daSet.has(`${ct.date}_${amt}`)) {
            return;
          }

          if (vSet && rcptCode) vSet.add(rcptCode);
          if (vSet && normCode) vSet.add(normCode);
          if (daSet && ct.date && amt > 0) daSet.add(`${ct.date}_${amt}`);

          matchedCust.totalPaid += amt;
        }
      });

      // 5. Retain any standalone non-bloated customers who don't have transactions yet
      existingCustomers.forEach((c) => {
        const phone = c.phone || '';
        const nameLower = (c.name || '').toLowerCase().trim();
        const villageLower = (c.village || '').toLowerCase().trim();
        const isGeneric = !nameLower || nameLower.startsWith('ग्राहक #') || nameLower.startsWith('customer #');

        // Avoid reviving duplicate Sheshrav if Sheshrao is present
        const isShesh = (nameLower.includes('shesh') || nameLower.includes('sheshrav') || nameLower.includes('sheshrao')) && nameLower.includes('bhagat');
        if (isShesh && (customerMap.has('phone:9623626338') || customerMap.has('id:cust-shesh'))) {
          return;
        }

        // Avoid reviving permanently merged accounts
        if (
          storedMerges[nameLower] ||
          (c.id && storedMerges[c.id]) ||
          (c.id && mergedSecToPrimary.has(c.id)) ||
          (nameLower && mergedNameToPrimary.has(nameLower) && mergedNameToPrimary.get(nameLower) !== c.id)
        ) {
          return;
        }

        const key = c.id ? `id:${c.id}` : (phone ? `phone:${phone}` : `nv:${nameLower}::${villageLower}`);
        if (!customerMap.has(key) && !isGeneric && (c.totalPurchased || 0) < 100000) {
          customerMap.set(key, {
            ...c,
            phone,
            balanceDue: Math.max(0, (c.totalPurchased || 0) - (c.totalPaid || 0)),
          });
        }
      });

      // 6. Final balance due calculation & de-duplicate by customer ID
      const seenCustomerIds = new Set<string>();
      const finalCustomers: Customer[] = [];

      for (const c of customerMap.values()) {
        if (!c.id || seenCustomerIds.has(c.id)) continue;
        if (mergedSecToPrimary.has(c.id)) continue;
        const nLow = (c.name || '').trim().toLowerCase();
        if (mergedNameToPrimary.has(nLow) && mergedNameToPrimary.get(nLow) !== c.id) continue;

        seenCustomerIds.add(c.id);
        finalCustomers.push({
          ...c,
          balanceDue: Math.max(0, c.totalPurchased - c.totalPaid),
        });
      }

      return {
        ...prev,
        transactions: reconciledTransactions,
        customers: finalCustomers,
      };
    });
  };

  const handleMergeCustomers = (
    primaryId: string,
    secondaryId: string,
    customOverrides?: {
      name?: string;
      phone?: string;
      village?: string;
      address?: string;
    }
  ) => {
    setDb((prev) => {
      let primaryCust = (prev.customers || []).find((c) => c.id === primaryId);
      let secondaryCust = (prev.customers || []).find((c) => c.id === secondaryId);
      if (!primaryCust && primaryId) {
        primaryCust = (prev.customers || []).find((c) => c.name.toLowerCase().trim() === primaryId.toLowerCase().trim());
      }
      if (!secondaryCust && secondaryId) {
        secondaryCust = (prev.customers || []).find((c) => c.name.toLowerCase().trim() === secondaryId.toLowerCase().trim());
      }
      if (!primaryCust || !secondaryCust) return prev;

      const mergeResult = executeFullCustomerMerge(
        primaryCust,
        secondaryCust,
        prev.customers,
        prev.transactions || [],
        prev.billReceipts || [],
        prev.cardMembers || [],
        prev.cardTransactions || [],
        customOverrides
      );

      const newRecord = {
        secondaryId: secondaryCust.id,
        secondaryName: secondaryCust.name,
        secondaryPhone: secondaryCust.phone,
        primaryId: primaryCust.id,
        primaryName: mergeResult.mergedCustomer.name,
        primaryPhone: mergeResult.mergedCustomer.phone,
        mergedAt: new Date().toISOString(),
      };

      const updatedMergedRecords = [
        newRecord,
        ...(prev.mergedRecords || []).filter((r) => r.secondaryId !== secondaryCust.id),
      ];

      const nextDb: AppDatabase = {
        ...prev,
        customers: mergeResult.updatedCustomers,
        transactions: mergeResult.updatedTransactions,
        billReceipts: mergeResult.updatedReceipts,
        cardMembers: mergeResult.updatedCardMembers,
        cardTransactions: mergeResult.updatedCardTransactions,
        mergedRecords: updatedMergedRecords,
      };

      saveDatabase(nextDb);
      saveDatabaseToIndexedDB(nextDb);
      isRemoteUpdateRef.current = false;
      syncDatabaseToCloud(nextDb, setCloudStatus, true);

      return nextDb;
    });
  };

  // Auto-heal customers and purge ghost entries on startup
  useEffect(() => {
    handleRecheckLedgers();
  }, []);

  const handleUpdateCustomers = (updatedCustomers: Customer[]) => {
    setDb((prev) => ({
      ...prev,
      customers: updatedCustomers,
    }));
  };

  const handleUpdateTransaction = (updatedTx: TransactionEntry) => {
    setDb((prev) => {
      const nextTxList = (prev.transactions || []).map((t) =>
        t.id === updatedTx.id ? updatedTx : t
      );
      // Synchronize customer name, phone, village if linked
      const nextCustomers = (prev.customers || []).map((c) => {
        if (
          c.id === updatedTx.customerId ||
          (updatedTx.customerPhone && updatedTx.customerPhone.length >= 10 && c.phone === updatedTx.customerPhone)
        ) {
          return {
            ...c,
            name: updatedTx.customerName || c.name,
            phone: updatedTx.customerPhone || c.phone,
            village: updatedTx.village || c.village,
          };
        }
        return c;
      });

      return {
        ...prev,
        transactions: nextTxList,
        customers: nextCustomers,
      };
    });

    setTimeout(() => {
      handleRecheckLedgers();
    }, 50);
  };

  const handleDeleteTransaction = (txId: string) => {
    setDb((prev) => ({
      ...prev,
      transactions: (prev.transactions || []).filter((t) => t.id !== txId),
    }));
    setTimeout(() => {
      handleRecheckLedgers();
    }, 50);
  };

  const handleUpdateSingleCustomer = (updatedCust: Customer) => {
    setDb((prev) => {
      const nextCustomers = (prev.customers || []).map((c) =>
        c.id === updatedCust.id ? updatedCust : c
      );
      const nextTransactions = (prev.transactions || []).map((t) => {
        if (t.customerId === updatedCust.id) {
          return {
            ...t,
            customerName: updatedCust.name,
            customerPhone: updatedCust.phone,
            village: updatedCust.village || t.village,
          };
        }
        return t;
      });
      return {
        ...prev,
        customers: nextCustomers,
        transactions: nextTransactions,
      };
    });
    setTimeout(() => {
      handleRecheckLedgers();
    }, 50);
  };

  const handleBatchUpdateTransactions = (updatedTxs: TransactionEntry[]) => {
    const updateMap = new Map(updatedTxs.map((t) => [t.id, t]));
    setDb((prev) => ({
      ...prev,
      transactions: (prev.transactions || []).map((t) => updateMap.get(t.id) || t),
    }));
    setTimeout(() => {
      handleRecheckLedgers();
    }, 50);
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

  // Purchases Handlers (with automatic Dealer Ledger & Stock Synchronization)
  const handleAddPurchase = (purchaseData: Omit<PurchaseEntry, 'id'>) => {
    const newPurchase: PurchaseEntry = {
      ...purchaseData,
      id: `pur-${Date.now()}`,
    };

    setDb((prev) => {
      // 1. Sync with dealer ledger
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
          phone: purchaseData.supplierPhone || '',
          totalPurchases: purchaseData.totalAmount,
          totalPaid: purchaseData.paidAmount,
          balanceDue: Math.max(0, purchaseData.totalAmount - purchaseData.paidAmount),
          lastTransactionDate: purchaseData.date,
        });
      }

      // 2. Auto-sync with Inventory Stock if itemsDetail are provided
      let updatedStock = [...prev.stock];
      if (purchaseData.itemsDetail && purchaseData.itemsDetail.length > 0) {
        purchaseData.itemsDetail.forEach((item) => {
          const existingStockIdx = updatedStock.findIndex(
            (s) => s.name.trim().toLowerCase() === item.description.trim().toLowerCase()
          );

          if (existingStockIdx >= 0) {
            const currentItem = updatedStock[existingStockIdx];
            updatedStock[existingStockIdx] = {
              ...currentItem,
              quantity: currentItem.quantity + item.qty,
              purchasePrice: item.rate,
              description: item.serialNumbers && item.serialNumbers.length > 0
                ? `${currentItem.description || ''} | Batch: ${item.serialNumbers.join(', ')}`.trim()
                : currentItem.description,
            };
          } else {
            updatedStock.push({
              id: `stock-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              name: item.description,
              code: item.hsn || `LG-${Date.now().toString().slice(-4)}`,
              category: 'Home Appliances & Electronics',
              quantity: item.qty,
              unit: 'Pcs',
              purchasePrice: item.rate,
              sellingPrice: Math.round(item.rate * 1.15),
              minStockLevel: 1,
              description: `Procured from ${supplier} (Inv #${purchaseData.billNo}). Serials: ${(item.serialNumbers || []).join(', ')}`,
            });
          }
        });
      }

      return {
        ...prev,
        purchases: [newPurchase, ...prev.purchases],
        dealers: updatedDealers,
        stock: updatedStock,
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

  const handleUpdateCardMember = (id: string, updates: Partial<CardMember>) => {
    setDb((prev) => {
      const updatedMembers = (prev.cardMembers || []).map((m) => {
        if (m.id === id || (updates.cardNumber && m.cardNumber === updates.cardNumber && m.schemeId === (updates.schemeId || m.schemeId))) {
          return { ...m, ...updates };
        }
        return m;
      });
      return {
        ...prev,
        cardMembers: updatedMembers,
      };
    });
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

  // CSV Bulk Import Handlers (Optimized with O(1) Maps & non-blocking async persistence)
  const handleImportBills = (newBills: TransactionEntry[]) => {
    lastImportTimeRef.current = Date.now();
    isRemoteUpdateRef.current = false;
    setDb((prev) => {
      // 1. Filter out zero-value ghost records
      const filteredBills = newBills.filter(
        (b) =>
          Number(b.totalAmount || 0) > 0 ||
          Number(b.payingNow || 0) > 0 ||
          Number(b.dueAmount || 0) > 0 ||
          (b.invoiceNo && b.invoiceNo.trim().length > 0)
      );

      // 2. High-speed Map lookups for Transactions (O(1))
      const txMap = new Map<string, TransactionEntry>();
      const existingTxs = prev.transactions || [];
      for (let i = 0; i < existingTxs.length; i++) {
        const inv = (existingTxs[i].invoiceNo || existingTxs[i].id).trim().toLowerCase();
        if (inv) txMap.set(inv, existingTxs[i]);
      }

      for (let i = 0; i < filteredBills.length; i++) {
        const bill = filteredBills[i];
        const inv = (bill.invoiceNo || bill.id).trim().toLowerCase();
        const existing = inv ? txMap.get(inv) : undefined;
        if (existing) {
          txMap.set(inv, { ...existing, ...bill });
        } else {
          txMap.set(inv || `bill-${Date.now()}-${i}`, bill);
        }
      }
      const existingTransactions = Array.from(txMap.values());

      // 3. High-speed Map lookups for Customers
      const updatedCustomers = [...(prev.customers || [])];
      const custIdMap = new Map<string, number>();
      const custPhoneMap = new Map<string, number>();
      const custNameMap = new Map<string, number>();
      const custNameVillageMap = new Map<string, number>();

      for (let i = 0; i < updatedCustomers.length; i++) {
        const c = updatedCustomers[i];
        if (c.id) custIdMap.set(c.id, i);
        const p = (c.phone || '').replace(/\D/g, '');
        if (p.length >= 10) custPhoneMap.set(p, i);
        if (c.name) {
          const n = c.name.trim().toLowerCase();
          custNameMap.set(n, i);
          if (c.village) custNameVillageMap.set(`${n}::${c.village.trim().toLowerCase()}`, i);
        }
      }

      for (let i = 0; i < filteredBills.length; i++) {
        const bill = filteredBills[i];
        const normName = (bill.customerName || '').trim().toLowerCase();
        const normVillage = (bill.village || '').trim().toLowerCase();
        const rawDigits = (bill.customerPhone || '').replace(/\D/g, '');
        const isPhoneValid = rawDigits.length >= 10 && !/^(\d)\1{9,}$/.test(rawDigits);
        const phone = isPhoneValid ? rawDigits : '';
        const isGenericName = !normName || normName.startsWith('ग्राहक #') || normName.startsWith('customer #');

        let foundIdx: number | undefined;
        if (bill.customerId && custIdMap.has(bill.customerId)) {
          foundIdx = custIdMap.get(bill.customerId);
        } else if (phone && custPhoneMap.has(phone)) {
          foundIdx = custPhoneMap.get(phone);
        } else if (!isGenericName && normName && normVillage && custNameVillageMap.has(`${normName}::${normVillage}`)) {
          foundIdx = custNameVillageMap.get(`${normName}::${normVillage}`);
        } else if (!isGenericName && normName && custNameMap.has(normName)) {
          foundIdx = custNameMap.get(normName);
        }

        if (foundIdx !== undefined) {
          const curr = updatedCustomers[foundIdx];
          bill.customerId = curr.id;
          bill.customerPhone = curr.phone || phone;
          updatedCustomers[foundIdx] = {
            ...curr,
            village: bill.village || curr.village,
            phone: curr.phone || phone,
          };
        } else {
          const newId = bill.customerId || `cust-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`;
          bill.customerId = newId;
          bill.customerPhone = phone;
          const newCust: Customer = {
            id: newId,
            name: bill.customerName,
            phone: phone,
            village: bill.village || '',
            totalPurchased: 0,
            totalPaid: 0,
            balanceDue: 0,
          };
          updatedCustomers.push(newCust);
          const newIdx = updatedCustomers.length - 1;
          custIdMap.set(newId, newIdx);
          if (phone) custPhoneMap.set(phone, newIdx);
          if (!isGenericName && normName) {
            custNameMap.set(normName, newIdx);
            if (normVillage) custNameVillageMap.set(`${normName}::${normVillage}`, newIdx);
          }
        }
      }

      // Reconcile each customer's exact totals from all transactions
      const customerBillStats = new Map<string, { totalPurchased: number; totalPaid: number }>();
      for (let i = 0; i < existingTransactions.length; i++) {
        const t = existingTransactions[i];
        const tNormName = (t.customerName || '').trim().toLowerCase();
        const tVillage = (t.village || '').trim().toLowerCase();
        const tPhone = (t.customerPhone || '').replace(/\D/g, '');
        const isTPhoneValid = tPhone.length >= 10 && !/^(\d)\1{9,}$/.test(tPhone);

        let cIdx: number | undefined;
        if (t.customerId && custIdMap.has(t.customerId)) {
          cIdx = custIdMap.get(t.customerId);
        } else if (isTPhoneValid && custPhoneMap.has(tPhone)) {
          cIdx = custPhoneMap.get(tPhone);
        } else if (tNormName && tVillage && custNameVillageMap.has(`${tNormName}::${tVillage}`)) {
          cIdx = custNameVillageMap.get(`${tNormName}::${tVillage}`);
        } else if (tNormName && custNameMap.has(tNormName)) {
          cIdx = custNameMap.get(tNormName);
        }

        if (cIdx !== undefined) {
          const cust = updatedCustomers[cIdx];
          t.customerId = cust.id;
          t.customerPhone = cust.phone;
          const stats = customerBillStats.get(cust.id) || { totalPurchased: 0, totalPaid: 0 };
          const isReceipt = t.invoiceNo?.startsWith('REC-') || t.itemDetails?.toLowerCase().includes('settlement');
          if (isReceipt) {
            stats.totalPaid += Number(t.payingNow || t.totalAmount || 0);
          } else {
            stats.totalPurchased += Number(t.totalAmount || 0);
            stats.totalPaid += Number(t.payingNow || 0);
          }
          customerBillStats.set(cust.id, stats);
        }
      }

      for (let i = 0; i < updatedCustomers.length; i++) {
        const cust = updatedCustomers[i];
        const stats = customerBillStats.get(cust.id);
        if (stats) {
          cust.totalPurchased = stats.totalPurchased;
          cust.totalPaid = stats.totalPaid;
          cust.balanceDue = Math.max(0, stats.totalPurchased - stats.totalPaid);
        }
      }

      const updatedDb: AppDatabase = {
        ...prev,
        transactions: existingTransactions,
        customers: updatedCustomers,
      };

      // Immediately save locally and sync to cloud
      saveDatabase(updatedDb);
      saveDatabaseToIndexedDB(updatedDb);
      syncDatabaseToCloud(updatedDb, setCloudStatus, true);

      return updatedDb;
    });
  };

  const handleImportReceipts = (newReceipts: CardTransaction[]) => {
    lastImportTimeRef.current = Date.now();
    isRemoteUpdateRef.current = false;
    setDb((prev) => {
      // 1. Prepare transactions & customers copies
      const updatedTransactions = [...(prev.transactions || [])];
      const updatedCustomers = [...(prev.customers || [])];
      const existingBillReceipts = [...(prev.billReceipts || [])];
      const existingCardTransactions = [...(prev.cardTransactions || [])];

      // Fast lookup for Customers
      const custIdMap = new Map<string, number>();
      const custPhoneMap = new Map<string, number>();
      const custNameMap = new Map<string, number>();

      for (let i = 0; i < updatedCustomers.length; i++) {
        const c = updatedCustomers[i];
        if (c.id) custIdMap.set(c.id, i);
        const p = (c.phone || '').replace(/\D/g, '');
        if (p.length >= 10) custPhoneMap.set(p, i);
        if (c.name) custNameMap.set(c.name.trim().toLowerCase(), i);
      }

      // Fast index of unpaid bills
      const unpaidByInvoice = new Map<string, number>();
      const unpaidByPhone = new Map<string, number[]>();
      const unpaidByName = new Map<string, number[]>();
      const unpaidByCard = new Map<number, number[]>();
      const existingTxInvoices = new Set<string>();

      for (let i = 0; i < updatedTransactions.length; i++) {
        const t = updatedTransactions[i];
        const invLower = (t.invoiceNo || '').trim().toLowerCase();
        if (invLower) existingTxInvoices.add(invLower);

        if (t.dueAmount > 0) {
          if (invLower) unpaidByInvoice.set(invLower, i);
          const p = (t.customerPhone || '').replace(/\D/g, '');
          if (p.length >= 10) {
            const list = unpaidByPhone.get(p) || [];
            list.push(i);
            unpaidByPhone.set(p, list);
          }
          if (t.customerName) {
            const n = t.customerName.trim().toLowerCase();
            const list = unpaidByName.get(n) || [];
            list.push(i);
            unpaidByName.set(n, list);
          }
          if (t.cardNumber) {
            const list = unpaidByCard.get(t.cardNumber) || [];
            list.push(i);
            unpaidByCard.set(t.cardNumber, list);
          }
        }
      }

      // Existing receipt deduplication set (FINGERPRINTS, NOT invoices!)
      // A receipt is NOT a sales bill! Never check sales invoice numbers against receipts!
      const existingReceiptFingerprints = new Set<string>();
      const existingReceiptCodes = new Set<string>();

      const addReceiptLookup = (rNo: string, amt?: number, dt?: string) => {
        if (!rNo) return;
        const clean = String(rNo).trim().toLowerCase();
        existingReceiptCodes.add(clean);
        if (amt !== undefined) {
          existingReceiptFingerprints.add(`${clean}__${amt}`);
          if (dt) existingReceiptFingerprints.add(`${clean}__${amt}__${dt}`);
        }
      };

      for (const br of existingBillReceipts) {
        if (br.receiptNo) addReceiptLookup(br.receiptNo, br.amount, br.date);
      }
      for (const ct of existingCardTransactions) {
        if (ct.receiptNo) addReceiptLookup(ct.receiptNo, ct.amount, ct.date);
      }

      const newBillReceipts: BillReceiptEntry[] = [];
      const newLedgerTransactions: TransactionEntry[] = [];
      const deduplicatedNewCardTransactions: CardTransaction[] = [];
      const seenBatchKeys = new Set<string>();

      for (let idx = 0; idx < newReceipts.length; idx++) {
        const rcpt = newReceipts[idx];
        const receiptCode = String(rcpt.receiptNo || '').trim();
        const receiptLower = receiptCode.toLowerCase();
        const rcptAmount = Number(rcpt.amount || 0);
        const rcptDate = String(rcpt.date || '').trim();

        // Prevent duplicate lines within the same uploaded file
        const batchKey = receiptLower 
          ? `${receiptLower}__${rcptAmount}__${rcptDate}__${rcpt.customerName || ''}`
          : `idx_${idx}`;
        if (seenBatchKeys.has(batchKey)) {
          continue;
        }
        seenBatchKeys.add(batchKey);

        // Check if this exact receipt already exists in database
        const isExactDuplicate = receiptLower && (
          existingReceiptFingerprints.has(`${receiptLower}__${rcptAmount}__${rcptDate}`) ||
          existingReceiptFingerprints.has(`${receiptLower}__${rcptAmount}`)
        );

        // Always register the card transaction so it is preserved in the receipts list
        deduplicatedNewCardTransactions.push(rcpt);

        // If it's an exact duplicate of an already recorded receipt, skip double-crediting balances
        if (isExactDuplicate) {
          continue;
        }
        if (receiptLower) {
          addReceiptLookup(receiptLower, rcptAmount, rcptDate);
        }

        const rcptNameNorm = (rcpt.customerName || '').trim().toLowerCase();
        const rawDigits = (rcpt.customerPhone || '').replace(/\D/g, '');
        const isPhoneValid = rawDigits.length >= 10 && !/^(\d)\1{9,}$/.test(rawDigits);
        const rcptPhone = isPhoneValid ? rawDigits : '';
        const isGenericName = !rcptNameNorm || rcptNameNorm.startsWith('ग्राहक #') || rcptNameNorm.startsWith('customer #');
        const rcptCard = rcpt.cardNumber;
        const cleanReceiptNumStr = receiptCode.replace(/\D/g, '') || String(1000 + idx);

        // Find or create customer
        let matchedCustId = (rcpt as any).customerId;
        let custIdx: number | undefined;

        if (matchedCustId && custIdMap.has(matchedCustId)) {
          custIdx = custIdMap.get(matchedCustId);
        } else if (rcptPhone && custPhoneMap.has(rcptPhone)) {
          custIdx = custPhoneMap.get(rcptPhone);
        } else if (!isGenericName && rcptNameNorm && custNameMap.has(rcptNameNorm)) {
          custIdx = custNameMap.get(rcptNameNorm);
        }

        if (custIdx !== undefined) {
          const cust = updatedCustomers[custIdx];
          matchedCustId = cust.id;
          const newPaid = (cust.totalPaid || 0) + rcptAmount;
          const effectivePurchased = Math.max(cust.totalPurchased || 0, newPaid);
          const newDue = Math.max(0, (cust.balanceDue || 0) - rcptAmount);
          updatedCustomers[custIdx] = {
            ...cust,
            totalPurchased: effectivePurchased,
            totalPaid: newPaid,
            balanceDue: newDue,
            village: (rcpt as any).village || (rcpt as any).customerVillage || cust.village || '',
            phone: cust.phone || rcptPhone,
          };
        } else if (rcpt.customerName) {
          matchedCustId = `cust-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`;
          const newC: Customer = {
            id: matchedCustId,
            name: rcpt.customerName,
            phone: rcptPhone,
            village: (rcpt as any).village || (rcpt as any).customerVillage || '',
            address: '',
            totalPurchased: rcptAmount,
            totalPaid: rcptAmount,
            balanceDue: 0,
            createdAt: rcpt.date || new Date().toISOString(),
          };
          updatedCustomers.push(newC);
          const newIdx = updatedCustomers.length - 1;
          custIdMap.set(matchedCustId, newIdx);
          if (rcptPhone) custPhoneMap.set(rcptPhone, newIdx);
          if (!isGenericName && rcptNameNorm) custNameMap.set(rcptNameNorm, newIdx);
        }

        // Fast credit against matching unpaid bills
        let remainingCredit = rcptAmount;
        const targetInvoice = ((rcpt as any).invoiceNo || '').trim().toLowerCase();

        if (targetInvoice && unpaidByInvoice.has(targetInvoice)) {
          const billIdx = unpaidByInvoice.get(targetInvoice)!;
          const bill = updatedTransactions[billIdx];
          if (bill && bill.dueAmount > 0) {
            const creditToApply = Math.min(bill.dueAmount, remainingCredit);
            updatedTransactions[billIdx] = {
              ...bill,
              payingNow: bill.payingNow + creditToApply,
              dueAmount: Math.max(0, bill.dueAmount - creditToApply),
              notes: bill.notes
                ? `${bill.notes} • Credited ₹${creditToApply} via Receipt #${receiptCode}`
                : `Credited ₹${creditToApply} via Receipt #${receiptCode}`,
            };
            remainingCredit -= creditToApply;
          }
        } else {
          // Check bills by phone, card, or name
          const candidateIndices = [
            ...(rcptPhone ? unpaidByPhone.get(rcptPhone) || [] : []),
            ...(rcptCard ? unpaidByCard.get(rcptCard) || [] : []),
            ...(!isGenericName && rcptNameNorm ? unpaidByName.get(rcptNameNorm) || [] : []),
          ];

          for (const billIdx of candidateIndices) {
            if (remainingCredit <= 0) break;
            const bill = updatedTransactions[billIdx];
            if (bill && bill.dueAmount > 0) {
              const creditToApply = Math.min(bill.dueAmount, remainingCredit);
              updatedTransactions[billIdx] = {
                ...bill,
                payingNow: bill.payingNow + creditToApply,
                dueAmount: Math.max(0, bill.dueAmount - creditToApply),
                notes: bill.notes
                  ? `${bill.notes} • Credited ₹${creditToApply} via Receipt #${receiptCode}`
                  : `Credited ₹${creditToApply} via Receipt #${receiptCode}`,
              };
              remainingCredit -= creditToApply;
            }
          }
        }

        // Add to Bill Receipts
        newBillReceipts.push({
          id: `br-imp-${Date.now()}-${idx}`,
          receiptNo: cleanReceiptNumStr,
          date: rcpt.date || new Date().toISOString().split('T')[0],
          customerId: matchedCustId || `cust-unknown-${idx}`,
          customerName: rcpt.customerName,
          customerPhone: rcptPhone,
          customerVillage: (rcpt as any).village || (rcpt as any).customerVillage || '',
          againstInvoiceNo: targetInvoice || '',
          billTotal: rcptAmount,
          previousBalance: rcptAmount,
          amountPaid: rcptAmount,
          remainingBalance: 0,
          paymentMode: (rcpt.paymentMode === 'Online' ? 'Online' : 'Cash'),
          agentName: (rcpt as any).collectedBy || (rcpt as any).agentName || 'Counter',
          notes: rcpt.remarks || `पावती #${receiptCode}`,
          createdAt: rcpt.createdAt || new Date().toISOString(),
        });

        // Add ledger record ONLY if not already existing
        const recInvNo = receiptCode.startsWith('REC-') ? receiptCode : `REC-${receiptCode}`;
        if (!existingTxInvoices.has(recInvNo.toLowerCase())) {
          existingTxInvoices.add(recInvNo.toLowerCase());
          newLedgerTransactions.push({
            id: `tx-imp-rcpt-${Date.now()}-${idx}`,
            invoiceNo: recInvNo,
            date: rcpt.date || new Date().toISOString().split('T')[0],
            customerId: matchedCustId,
            customerName: rcpt.customerName,
            customerPhone: rcptPhone,
            village: (rcpt as any).village || (rcpt as any).customerVillage || '',
            totalAmount: rcptAmount,
            payingNow: rcptAmount,
            dueAmount: 0,
            itemDetails: rcpt.remarks || `जमा पावती #${receiptCode}`,
            paymentMode: rcpt.paymentMode || 'Cash',
            notes: `जमा पावती #${receiptCode}`,
            createdAt: rcpt.createdAt || new Date().toISOString(),
          });
        }
      }

      // Merge card transactions by receiptNo or id so all receipts are uniquely preserved
      const cardTxMap = new Map<string, CardTransaction>();
      (prev.cardTransactions || []).forEach((ct, i) => {
        const key = ct.receiptNo ? String(ct.receiptNo).trim().toLowerCase() : (ct.id || `old-ct-${i}`);
        cardTxMap.set(key, ct);
      });
      deduplicatedNewCardTransactions.forEach((ct, i) => {
        const key = ct.receiptNo ? String(ct.receiptNo).trim().toLowerCase() : (ct.id || `new-ct-${i}`);
        cardTxMap.set(key, ct);
      });
      const finalCardTransactions = Array.from(cardTxMap.values());

      const billReceiptsMap = new Map<string, BillReceiptEntry>();
      existingBillReceipts.forEach((br, i) => {
        const key = br.receiptNo ? String(br.receiptNo).trim().toLowerCase() : (br.id || `old-br-${i}`);
        billReceiptsMap.set(key, br);
      });
      newBillReceipts.forEach((br, i) => {
        const key = br.receiptNo ? String(br.receiptNo).trim().toLowerCase() : (br.id || `new-br-${i}`);
        billReceiptsMap.set(key, br);
      });
      const finalBillReceipts = Array.from(billReceiptsMap.values());

      const updatedDb: AppDatabase = {
        ...prev,
        transactions: [...newLedgerTransactions, ...updatedTransactions],
        cardTransactions: finalCardTransactions,
        billReceipts: finalBillReceipts,
        customers: updatedCustomers,
      };

      saveDatabase(updatedDb);
      saveDatabaseToIndexedDB(updatedDb);
      syncDatabaseToCloud(updatedDb, setCloudStatus, true);

      return updatedDb;
    });
  };

  const handleImportCardMembers = (newCards: CardMember[]) => {
    lastImportTimeRef.current = Date.now();
    isRemoteUpdateRef.current = false;
    setDb((prev) => {
      const existing = [...(prev.cardMembers || [])];
      const memberMap = new Map<string, number>();

      for (let i = 0; i < existing.length; i++) {
        const cm = existing[i];
        memberMap.set(`${cm.schemeId}-${cm.cardNumber}`, i);
      }

      for (let i = 0; i < newCards.length; i++) {
        const nc = newCards[i];
        const key = `${nc.schemeId}-${nc.cardNumber}`;
        const existingIdx = memberMap.get(key);
        if (existingIdx !== undefined) {
          existing[existingIdx] = {
            ...existing[existingIdx],
            customerName: nc.customerName || existing[existingIdx].customerName,
            phone: nc.phone || existing[existingIdx].phone,
            village: nc.village || existing[existingIdx].village,
            sheetNo: nc.sheetNo || existing[existingIdx].sheetNo,
            openingAmt: nc.openingAmt !== undefined ? nc.openingAmt : existing[existingIdx].openingAmt,
            totalDeposited: Math.max(existing[existingIdx].totalDeposited || 0, nc.totalDeposited || 0),
            netBalance: Math.max(existing[existingIdx].netBalance || 0, nc.netBalance || 0),
            notes: nc.notes || existing[existingIdx].notes,
          };
        } else {
          existing.push(nc);
          memberMap.set(key, existing.length - 1);
        }
      }

      const updatedDb: AppDatabase = {
        ...prev,
        cardMembers: existing,
      };

      saveDatabase(updatedDb);
      saveDatabaseToIndexedDB(updatedDb);
      syncDatabaseToCloud(updatedDb, setCloudStatus, true);

      return updatedDb;
    });
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

      const updatedDb: AppDatabase = {
        ...prev,
        purchases: [...newPurchases, ...prev.purchases],
        dealers: currentDealers,
      };
      lastImportTimeRef.current = Date.now();
      isRemoteUpdateRef.current = false;
      saveDatabase(updatedDb);
      saveDatabaseToIndexedDB(updatedDb);
      syncDatabaseToCloud(updatedDb, setCloudStatus, true);
      return updatedDb;
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

  const handleRecordAgentAdvance = (advanceData: Omit<AgentAdvance, 'id' | 'createdAt'>) => {
    const newAdvance: AgentAdvance = {
      ...advanceData,
      id: `adv-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setDb((prev) => ({
      ...prev,
      agentAdvances: [newAdvance, ...(prev.agentAdvances || [])],
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
          const newDb: AppDatabase = {
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
            billReceipts: parsed.billReceipts || db.billReceipts || [],
            agentAdvances: parsed.agentAdvances || db.agentAdvances || [],
          };
          setDb(newDb);
          setTimeout(() => {
            saveDatabase(newDb);
            saveDatabaseToIndexedDB(newDb);
            syncDatabaseToCloud(newDb, setCloudStatus, true);
          }, 50);
          alert('डेटा यशस्वीरीत्या आयात केला गेला! (Data imported successfully!)');
        }
      } catch (err) {
        alert('Invalid JSON backup file.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = async (mode: 'all' | 'zero-bills' | 'sample' = 'all') => {
    if (mode === 'zero-bills') {
      handleRecheckLedgers();
      return;
    }

    if (mode === 'sample') {
      const sampleDb: AppDatabase = {
        settings: db.settings || DEFAULT_SETTINGS,
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
        agentAdvances: [],
      };
      setDb(sampleDb);
      saveDatabase(sampleDb);
      await saveDatabaseToIndexedDB(sampleDb);
      isRemoteUpdateRef.current = true;
      syncDatabaseToCloud(sampleDb, setCloudStatus, true);
      return;
    }

    // FULL RESET (पूर्ण डेटा गायब / रिसेट):
    // सर्व ग्राहक, बिले, कार्ड्स, हप्ते, खरेदी, डीलर व खर्च पूर्णपणे रिकामे (0 records, ₹0 balance)
    isResettingRef.current = true;
    clearStoredCustomerMerges();
    const cleanDb: AppDatabase = {
      settings: db.settings || DEFAULT_SETTINGS,
      stock: [],
      customers: [],
      transactions: [],
      purchases: [],
      dealers: [],
      dealerPayments: [],
      cardMembers: [],
      cardTransactions: [],
      staff: db.staff && db.staff.length > 0 ? db.staff : INITIAL_STAFF,
      expenses: [],
      agentAdvances: [],
      billReceipts: [],
      mergedRecords: [],
    };

    // 1. Immediately update React state to clear all views instantly
    setDb(cleanDb);

    // 2. Persist to localStorage
    try {
      localStorage.setItem('shri_sai_enterprise_db', JSON.stringify(cleanDb));
      localStorage.removeItem('shri_sai_customer_merges');
    } catch (e) {}

    // 3. Clear and persist to IndexedDB so browser reloads don't reload old records
    try {
      await saveDatabaseToIndexedDB(cleanDb);
    } catch (e) {
      console.warn('IndexedDB save error:', e);
    }

    // 4. Suppress Firestore snapshot revert and push clean slate to Firestore
    isRemoteUpdateRef.current = true;
    try {
      await syncDatabaseToCloud(cleanDb, setCloudStatus, true);
    } catch (e) {
      console.warn('Cloud reset error:', e);
    }
    setTimeout(() => {
      isResettingRef.current = false;
    }, 5000);
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
          onOpenFieldActions={() => {
            if (!currentUser) {
              setShowLoginModal(true);
            } else {
              setFieldQuickActionTab('card-collection');
              setShowFieldQuickActions(true);
            }
          }}
        />

        {/* Field Staff Quick Actions Hub (also accessible from shop mode for authenticated staff) */}
        {showFieldQuickActions && (
          <FieldStaffQuickActions
            isOpen={showFieldQuickActions}
            onClose={() => setShowFieldQuickActions(false)}
            initialTab={fieldQuickActionTab}
            cardMembers={db.cardMembers || []}
            cardTransactions={db.cardTransactions || []}
            customers={db.customers || []}
            stock={db.stock || []}
            settings={db.settings}
            currentAgentName={currentUser?.name || 'Staff Agent'}
            onRecordCardPayment={handleRecordCardTransaction}
            onSaveSalesEntry={handleSaveEntry}
            onSettleCustomerPayment={handleSettlePayment}
            onAddMember={handleAddCardMember}
            onUpdateMember={handleUpdateCardMember}
            onNavigateTab={(tabName) => {
              setActiveTab(tabName);
              setAppMode('erp');
            }}
          />
        )}

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
    <div className="min-h-screen bg-[#F5EFEB] dark:bg-[#0B1120] flex text-slate-800 dark:text-slate-100 antialiased font-sans transition-colors duration-300">
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
        <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between no-print">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-base tracking-tight truncate">
                {db.settings.businessName}
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-mono font-medium border border-slate-200 dark:border-slate-700">
                Cloud ERP
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Install Mobile App button */}
            <button
              type="button"
              onClick={() => setShowInstallModal(true)}
              title="Install Official Mobile App"
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>मोबाईल ॲप</span>
            </button>

            {/* View Customer Website button */}
            <button
              type="button"
              onClick={() => setAppMode('shop')}
              title="View Customer Website & Public Passbook Portal"
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold transition cursor-pointer shadow-2xs"
            >
              <Store className="w-3.5 h-3.5 text-amber-700" />
              <span>Customer Website</span>
            </button>

            {/* Real-time Google Cloud Sync Status Badge */}
            <button
              type="button"
              onClick={handleManualCloudSync}
              title="Real-time Google Cloud database sync. Click to force sync."
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition cursor-pointer ${
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
              <span>
                {cloudStatus === 'connected' && 'Cloud Synced'}
                {cloudStatus === 'syncing' && 'Syncing...'}
                {cloudStatus === 'offline' && 'Offline'}
                {cloudStatus === 'error' && 'Sync Error'}
              </span>
            </button>

            {/* All Uploaded Data Quick Access Button (from Screenshot) */}
            <button
              type="button"
              onClick={() => setActiveTab('uploaded-data')}
              title="अपलोड झालेला सर्व २,५०२+ डेटा शोधा, चुका तपासा व एडिट करा"
              className={`flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer shadow-2xs ${
                activeTab === 'uploaded-data'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <Search className={`w-3.5 h-3.5 ${activeTab === 'uploaded-data' ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`} />
              <span className="hidden sm:inline">सर्व डेटा शोधा</span>
              <span className="sm:hidden text-[11px]">डेटा</span>
            </button>

            {/* Day / Night Tactile Theme Toggle */}
            <ThemeToggle size="sm" showLabel={false} />

            {/* Field Staff Quick Actions Modal Launcher Button */}
            <button
              type="button"
              onClick={() => {
                setFieldQuickActionTab('card-collection');
                setShowFieldQuickActions(true);
              }}
              title="फिल्ड स्टाफ क्विक काउंटर: साप्ताहिक हफ्ता, नवीन बिल, पावती जमा व खातेवही"
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black transition cursor-pointer shadow-sm active:scale-95"
            >
              <CreditCard className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
              <span className="hidden xs:inline">स्टाफ काउंटर</span>
              <span className="xs:hidden text-[11px]">काउंटर</span>
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

        {/* Quick Actions Bar for High Speed Mobile/Desktop Work */}
        <QuickActionsBar
          onOpenWeeklyCollection={() => {
            setFieldQuickActionTab('card-collection');
            setShowFieldQuickActions(true);
          }}
          onOpenNewCard={() => {
            setFieldQuickActionTab('new-card');
            setShowFieldQuickActions(true);
          }}
          onOpenCustomerKhata={() => setActiveTab('customers')}
          onOpenSalesBill={() => setActiveTab('add-entry')}
          onOpenBillReceipts={() => setActiveTab('bill-receipts')}
          onOpenReceivePayment={() => {
            setFieldQuickActionTab('settle-khata');
            setShowFieldQuickActions(true);
          }}
          onOpenMasterSearch={() => setActiveTab('uploaded-data')}
          onOpenAgentCommission={() => setActiveTab('agent-commission')}
        />

        {/* View Switcher */}
        <main className="flex-1 pb-24 md:pb-12">
          {activeTab === 'dashboard' && (
            <DashboardView
              transactions={db.transactions}
              customers={db.customers}
              stock={db.stock}
              settings={db.settings}
              cardTransactions={db.cardTransactions || []}
              cardMembers={db.cardMembers || []}
              staff={db.staff || []}
              agentAdvances={db.agentAdvances || []}
              onNavigate={setActiveTab}
              onOpenInvoiceModal={setSelectedInvoice}
              onOpenAgentCommission={(agentName) => {
                if (agentName) setSelectedAgentForCommission(agentName);
                setActiveTab('agent-commission');
              }}
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
              allTransactions={db.transactions}
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
              onUpdateMember={handleUpdateCardMember}
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
              existingCustomers={db.customers || []}
              existingBills={db.transactions || []}
              existingReceipts={db.cardTransactions || []}
              onSwitchTab={setActiveTab}
              onResetData={handleResetData}
            />
          )}

          {activeTab === 'uploaded-data' && (
            <UploadedDataView
              customers={db.customers}
              cardMembers={db.cardMembers || []}
              transactions={db.transactions}
              purchases={db.purchases}
              dealers={db.dealers || []}
              cardTransactions={db.cardTransactions || []}
              settings={db.settings}
              onUpdateCustomers={handleUpdateCustomers}
              onRecheckLedgers={handleRecheckLedgers}
              onNavigateTab={setActiveTab}
              onSettlePayment={handleSettlePayment}
              onResetData={handleResetData}
              onUpdateTransaction={handleUpdateTransaction}
              onDeleteTransaction={handleDeleteTransaction}
              onUpdateSingleCustomer={handleUpdateSingleCustomer}
              onBatchUpdateTransactions={handleBatchUpdateTransactions}
              onMergeCustomers={handleMergeCustomers}
              mergedRecords={db.mergedRecords || []}
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

          {activeTab === 'bill-receipts' && (
            <BillReceiptsView
              billReceipts={db.billReceipts || []}
              customers={db.customers}
              transactions={db.transactions}
              settings={db.settings}
              onSaveReceipt={handleSaveBillReceipt}
              onDeleteReceipt={handleDeleteBillReceipt}
            />
          )}

          {activeTab === 'customers' && (
            <CustomersView
              customers={db.customers}
              transactions={db.transactions}
              cardTransactions={db.cardTransactions || []}
              onAddCustomer={handleAddCustomer}
              onSettlePayment={handleSettlePayment}
              onRecheckLedgers={handleRecheckLedgers}
              onNavigateUploadedData={() => setActiveTab('uploaded-data')}
              onMergeCustomers={handleMergeCustomers}
              settings={db.settings}
              mergedRecords={db.mergedRecords || []}
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
              settings={db.settings}
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

          {activeTab === 'agent-commission' && (
            <AgentCommissionView
              cardTransactions={db.cardTransactions || []}
              cardMembers={db.cardMembers || []}
              agentAdvances={db.agentAdvances || []}
              settings={db.settings}
              onRecordAdvance={handleRecordAgentAdvance}
              onRefreshSync={handleManualCloudSync}
              currentAgentFilter={selectedAgentForCommission}
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
        onOpenFieldActions={() => {
          setFieldQuickActionTab('card-collection');
          setShowFieldQuickActions(true);
        }}
        cloudStatus={cloudStatus}
        isInstallable={isInstallable}
      />

      {/* Field Staff Quick Actions Hub (Sales, Receipt, Card Collection, Ledger) */}
      {showFieldQuickActions && (
        <FieldStaffQuickActions
          isOpen={showFieldQuickActions}
          onClose={() => setShowFieldQuickActions(false)}
          initialTab={fieldQuickActionTab}
          cardMembers={db.cardMembers || []}
          cardTransactions={db.cardTransactions || []}
          customers={db.customers || []}
          stock={db.stock || []}
          settings={db.settings}
          currentAgentName={currentUser?.name || 'Staff Agent'}
          onRecordCardPayment={handleRecordCardTransaction}
          onSaveSalesEntry={handleSaveEntry}
          onSettleCustomerPayment={handleSettlePayment}
          onAddMember={handleAddCardMember}
          onUpdateMember={handleUpdateCardMember}
          onNavigateTab={(tabName) => {
            setActiveTab(tabName);
            setAppMode('erp');
          }}
        />
      )}

      {/* PWA Install Modal Dialog */}
      <PWAInstallModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
      />
    </div>
  );
}
