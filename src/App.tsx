import React, { useState, useEffect, useRef } from 'react';
import { Menu, Globe, Store, PlusCircle, Cloud, RefreshCw, CheckCircle2, Crown, UserCheck, LogOut, Lock, Download, Search } from 'lucide-react';
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
  deduplicateStock,
  clearAllDemoData,
  clearCardsData,
  clearBillsData,
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
  clearCloudSection,
  logAuthEventToCloud,
  checkIsQuotaExceededToday,
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
import { UploadedDataView } from './components/UploadedDataView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CardPassbookModal } from './components/CardPassbookModal';
import { LoginModal } from './components/LoginModal';
import { ShopLandingView } from './components/ShopLandingView';
import { MobileBottomNav } from './components/MobileBottomNav';
import { PWAInstallModal } from './components/PWAInstallModal';
import { usePWAInstall } from './utils/usePWAInstall';
import { DayNightToggle } from './components/DayNightToggle';
import { QuickActionBar } from './components/QuickActionBar';
import { QuickPavtiModal } from './components/QuickPavtiModal';

export default function App() {
  const [db, setDb] = useState<AppDatabase>(() => loadDatabase());
  const [activeTab, setActiveTab] = useState<ActiveTab>('add-entry'); // matches the user's screenshot where "Add Entry" is active
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<TransactionEntry | null>(null);
  const [cardSchemeInitialAction, setCardSchemeInitialAction] = useState<'payment' | 'add-card' | null>(null);
  const [showQuickPavtiModal, setShowQuickPavtiModal] = useState<boolean>(false);
  const [selectedPassbookMember, setSelectedPassbookMember] = useState<CardMember | null>(null);
  const [selectedDealerForLedger, setSelectedDealerForLedger] = useState<string | undefined>();
  const [cloudStatus, setCloudStatus] = useState<CloudSyncStatus>(() => {
    return checkIsQuotaExceededToday() ? 'quota-exceeded' : 'syncing';
  });
  const [lastSyncedTime, setLastSyncedTime] = useState<string>('');
  
  // Application Mode: 'erp' (Internal Business Management) or 'shop' (Safe Public Storefront & Customer Passbook)
  const [appMode, setAppMode] = useState<'erp' | 'shop'>(() => {
    if (typeof window === 'undefined') return 'shop';
    const params = new URLSearchParams(window.location.search);
    if (params.get('passbook') || params.get('invoice') || params.get('view') === 'shop') {
      return 'shop';
    }
    // If URL explicitly requests ERP view or an admin tab, go to ERP
    if (params.get('view') === 'erp' || params.get('tab') || params.get('mode') === 'erp') {
      return 'erp';
    }
    // Default to the Public Storefront & Customer Landing Page
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
  const [newOrderAlert, setNewOrderAlert] = useState<{
    customerName: string;
    customerPhone?: string;
    totalAmount: number;
    invoiceNo: string;
    date: string;
    itemsSummary?: string;
  } | null>(null);
  const { isInstallable } = usePWAInstall();
  
  const isRemoteUpdateRef = useRef(false);
  const isFirstMountRef = useRef(true);
  const userClearedSectionsRef = useRef<{
    all?: number;
    cards?: number;
    bills?: number;
  }>({});

  // Play audio chime when customer places an order
  const playOrderSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      }
    } catch (e) {}
  };

  // Trigger system notification if permitted
  const triggerBrowserNotification = (title: string, body: string) => {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          new Notification(title, { body, icon: '/favicon.ico' });
        } catch (e) {}
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((perm) => {
          if (perm === 'granted') {
            try {
              new Notification(title, { body, icon: '/favicon.ico' });
            } catch (e) {}
          }
        });
      }
    }
  };

  // Real-time listener for orders placed in shop mode or other tabs
  useEffect(() => {
    const handleOnlineOrder = (e: any) => {
      const order = e.detail;
      if (order) {
        playOrderSound();
        triggerBrowserNotification(
          `🛍️ नवीन ऑर्डर प्राप्त! ₹${order.grandTotal || order.totalAmount}`,
          `ग्राहक: ${order.customerName} (${order.customerPhone || 'Wardha'})`
        );
        setNewOrderAlert({
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          totalAmount: Number(order.grandTotal ?? order.totalAmount ?? 0),
          invoiceNo: order.invoiceNo,
          date: order.date,
          itemsSummary: order.items ? order.items.map((i: any) => `${i.name} x${i.quantity}`).join(', ') : '',
        });
      }
    };

    window.addEventListener('shri_sai_order_placed', handleOnlineOrder);
    return () => {
      window.removeEventListener('shri_sai_order_placed', handleOnlineOrder);
    };
  }, []);

  // Clear demo data handler - resets customers, transactions, card members to a clean slate
  const handleClearAllDemoData = async () => {
    const clean = clearAllDemoData(db);
    userClearedSectionsRef.current.all = Date.now();
    setDb(clean);
    saveDatabase(clean);
    try {
      await clearCloudSection('all');
    } catch (e) {}
    syncDatabaseToCloud(clean, setCloudStatus, true, true);
    alert(
      '✓ सर्व जुना डेटा (बिले, कार्ड्स, ग्राहक व पावत्या) 100% पूर्णपणे क्लिअर झाला आहे!\n\nआता सिस्टीम पूर्ण स्वच्छ झाली आहे.'
    );
  };

  const handleClearCardsData = async () => {
    const clean = clearCardsData(db);
    userClearedSectionsRef.current.cards = Date.now();
    setDb(clean);
    saveDatabase(clean);
    try {
      await clearCloudSection('cards');
    } catch (e) {}
    syncDatabaseToCloud(clean, setCloudStatus, true, true);
    alert('✓ सर्व कार्ड्स व योजना डेटा (Card Scheme Data) 100% पूर्णपणे क्लिअर झाला आहे!');
  };

  const handleClearBillsData = async () => {
    const clean = clearBillsData(db);
    userClearedSectionsRef.current.bills = Date.now();
    setDb(clean);
    saveDatabase(clean);
    try {
      await clearCloudSection('bills');
    } catch (e) {}
    syncDatabaseToCloud(clean, setCloudStatus, true, true);
    alert('✓ सर्व सेल्स बिले व ग्राहक यादी (Sales Bills Data) 100% पूर्णपणे क्लिअर झाली आहेत!');
  };

  const handleClearZeroBills = () => {
    const filteredTransactions = (db.transactions || []).filter((t) => (t.totalAmount || 0) > 0);
    const updatedDb = { ...db, transactions: filteredTransactions };
    setDb(updatedDb);
    saveDatabase(updatedDb);
    syncDatabaseToCloud(updatedDb, setCloudStatus, true, true);
    alert('✓ सर्व ₹0 ची चुकीची बिले यशस्वीपणे काढून टाकली आहेत!');
  };

  // 1. Real-time Cloud Firestore Listener (Across All Devices & shrisaient.in)
  useEffect(() => {
    const unsubscribe = subscribeToCloudDatabase(
      (remoteData) => {
        if (remoteData) {
          isRemoteUpdateRef.current = true;
          setDb((prev) => {
            const now = Date.now();
            const isAllRecentlyCleared = Boolean(
              userClearedSectionsRef.current.all && now - userClearedSectionsRef.current.all < 30000
            );
            const isCardsRecentlyCleared =
              isAllRecentlyCleared ||
              Boolean(userClearedSectionsRef.current.cards && now - userClearedSectionsRef.current.cards < 30000);
            const isBillsRecentlyCleared =
              isAllRecentlyCleared ||
              Boolean(userClearedSectionsRef.current.bills && now - userClearedSectionsRef.current.bills < 30000);

            // Respect intentional clearing; otherwise use remoteData, or keep local if remote empty
            const mergedTransactions = isBillsRecentlyCleared
              ? []
              : (remoteData.transactions !== undefined ? remoteData.transactions : prev.transactions || []);

            const mergedCardMembers = isCardsRecentlyCleared
              ? []
              : (remoteData.cardMembers !== undefined ? remoteData.cardMembers : prev.cardMembers || []);

            const mergedCardTransactions = isCardsRecentlyCleared
              ? []
              : (remoteData.cardTransactions !== undefined ? remoteData.cardTransactions : prev.cardTransactions || []);

            const mergedCustomers = isBillsRecentlyCleared
              ? []
              : (remoteData.customers !== undefined ? remoteData.customers : prev.customers || []);

            const rawStock =
              remoteData.stock && remoteData.stock.length > 0
                ? remoteData.stock
                : (prev.stock && prev.stock.length > 0 ? prev.stock : []);
            const mergedStock = deduplicateStock(rawStock);

            return {
              settings: remoteData.settings ? { ...prev.settings, ...remoteData.settings } : prev.settings,
              stock: mergedStock,
              customers: mergedCustomers,
              transactions: mergedTransactions,
              purchases: remoteData.purchases !== undefined && remoteData.purchases.length > 0 ? remoteData.purchases : prev.purchases,
              dealers: remoteData.dealers !== undefined && remoteData.dealers.length > 0 ? remoteData.dealers : prev.dealers,
              dealerPayments: remoteData.dealerPayments !== undefined && remoteData.dealerPayments.length > 0 ? remoteData.dealerPayments : prev.dealerPayments,
              cardMembers: mergedCardMembers,
              cardTransactions: mergedCardTransactions,
              staff: remoteData.staff !== undefined && remoteData.staff.length > 0 ? remoteData.staff : prev.staff,
              expenses: remoteData.expenses !== undefined && remoteData.expenses.length > 0 ? remoteData.expenses : prev.expenses,
            };
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
  useEffect(() => {
    saveDatabase(db);
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
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

  const handleManualCloudSync = () => {
    setCloudStatus('syncing');
    syncDatabaseToCloud(
      db,
      (status) => {
        setCloudStatus(status);
        if (status === 'connected') {
          setLastSyncedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }
      },
      true,
      true
    );
  };

  // Handler: Add transaction entry (From Add Entry Form)
  const handleSaveEntry = (entryData: Omit<TransactionEntry, 'id' | 'createdAt'>) => {
    const newEntry: TransactionEntry = {
      ...entryData,
      id: `tx-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    if (entryData.itemDetails && entryData.itemDetails.includes('Online Store Order')) {
      playOrderSound();
      triggerBrowserNotification(
        `🛍️ नवीन ऑनलाइन ऑर्डर! ₹${entryData.totalAmount}`,
        `ग्राहक: ${entryData.customerName}`
      );
      setNewOrderAlert({
        customerName: entryData.customerName,
        customerPhone: entryData.customerPhone,
        totalAmount: entryData.totalAmount,
        invoiceNo: entryData.invoiceNo || 'INV-ORD',
        date: entryData.date,
        itemsSummary: entryData.itemDetails,
      });
    }

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
    setDb((prev) => {
      // Also register or update customer records for Khata ledger
      const currentCustomers = [...(prev.customers || [])];
      newBills.forEach((b) => {
        if (!b.customerName || b.customerName === 'Customer') return;
        const existingIdx = currentCustomers.findIndex(
          (c) => c.name.toLowerCase() === b.customerName.toLowerCase() || (b.customerPhone && c.phone === b.customerPhone)
        );

        const isReceipt =
          b.entryType === 'Receipt' ||
          b.invoiceNo.startsWith('SSE/RCPT') ||
          b.invoiceNo.includes('RCPT') ||
          (b.totalAmount === 0 && b.payingNow > 0);

        if (existingIdx >= 0) {
          currentCustomers[existingIdx].totalPurchases += b.totalAmount;
          currentCustomers[existingIdx].totalPaid += b.payingNow;
          if (isReceipt) {
            currentCustomers[existingIdx].balanceDue = Math.max(0, currentCustomers[existingIdx].balanceDue - b.payingNow);
          } else {
            currentCustomers[existingIdx].balanceDue += b.dueAmount;
          }
          if (b.date) currentCustomers[existingIdx].lastTransactionDate = b.date;
        } else {
          currentCustomers.push({
            id: `cust-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: b.customerName,
            phone: b.customerPhone || '',
            totalPurchased: b.totalAmount,
            totalPurchases: b.totalAmount,
            totalPaid: b.payingNow,
            balanceDue: isReceipt ? 0 : b.dueAmount,
            lastTransactionDate: b.date,
          });
        }
      });

      // Auto-register any new products into stock
      const currentStock = [...(prev.stock || [])];
      newBills.forEach((b) => {
        if (b.stockItemName && b.stockItemName.trim().length > 1) {
          const sName = b.stockItemName.trim();
          const exists = currentStock.some((s) => s.name.trim().toLowerCase() === sName.toLowerCase());
          if (!exists) {
            currentStock.push({
              id: `stk-b-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              name: sName,
              code: `PRD-${(currentStock.length + 1).toString().padStart(3, '0')}`,
              category: b.category || 'इलेक्ट्रॉनिक्स & घरगुती उपकरणे',
              quantity: b.quantity || 1,
              sellingPrice: b.unitPrice || (b.totalAmount && b.quantity ? Math.round(b.totalAmount / b.quantity) : b.totalAmount),
              purchasePrice: Math.round((b.unitPrice || b.totalAmount || 0) * 0.75),
              minStockLevel: 2,
              unit: 'नग',
              description: `बिलांमधून जोडलेले उत्पादन`,
            });
          }
        }
      });

      return {
        ...prev,
        transactions: [...newBills, ...(prev.transactions || [])],
        customers: currentCustomers,
        stock: currentStock,
      };
    });
  };

  // Helper to re-balance and reconcile all customer ledgers from raw transactions
  const handleRecalculateCustomerLedgers = () => {
    setDb((prev) => {
      const allTx = prev.transactions || [];
      const updatedCustomers = (prev.customers || []).map((c) => {
        const cName = c.name.toLowerCase().trim();
        const cPhone = c.phone ? c.phone.replace(/[^0-9]/g, '') : '';
        const cTx = allTx.filter((t) => {
          const matchName = t.customerName && t.customerName.toLowerCase().trim() === cName;
          const matchPhone = cPhone && t.customerPhone && t.customerPhone.replace(/[^0-9]/g, '') === cPhone;
          const matchId = t.customerId && t.customerId === c.id;
          return matchName || matchPhone || matchId;
        });

        if (cTx.length === 0) return c;

        let totalPurchased = 0;
        let totalPaid = 0;

        cTx.forEach((t) => {
          const isReceipt =
            t.entryType === 'Receipt' ||
            t.invoiceNo.startsWith('SSE/RCPT') ||
            t.invoiceNo.includes('RCPT') ||
            (t.totalAmount === 0 && t.payingNow > 0);

          if (isReceipt) {
            totalPaid += t.payingNow;
          } else {
            totalPurchased += t.totalAmount;
            totalPaid += t.payingNow;
          }
        });

        const balanceDue = Math.max(0, totalPurchased - totalPaid);

        return {
          ...c,
          totalPurchased,
          totalPurchases: totalPurchased,
          totalPaid,
          balanceDue,
        };
      });

      return { ...prev, customers: updatedCustomers };
    });
  };

  const handleImportReceipts = (newReceipts: CardTransaction[]) => {
    setDb((prev) => {
      // Update card member balances for receipts
      const currentMembers = [...(prev.cardMembers || [])];
      newReceipts.forEach((rcpt) => {
        const mIdx = currentMembers.findIndex(
          (m) => m.cardNumber === rcpt.cardNumber && m.schemeId === rcpt.schemeId
        );
        if (mIdx >= 0) {
          currentMembers[mIdx].totalDeposited += rcpt.amount;
          currentMembers[mIdx].netBalance = Math.max(0, currentMembers[mIdx].totalDeposited - currentMembers[mIdx].totalRefunded);
        }
      });

      return {
        ...prev,
        cardTransactions: [...newReceipts, ...(prev.cardTransactions || [])],
        cardMembers: currentMembers,
      };
    });
  };

  const handleImportCardMembers = (newCards: CardMember[], autoReceipts?: CardTransaction[]) => {
    setDb((prev) => {
      const updatedMembers = [...newCards, ...(prev.cardMembers || [])];
      const updatedReceipts = autoReceipts && autoReceipts.length > 0
        ? [...autoReceipts, ...(prev.cardTransactions || [])]
        : (prev.cardTransactions || []);

      return {
        ...prev,
        cardMembers: updatedMembers,
        cardTransactions: updatedReceipts,
      };
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

      return {
        ...prev,
        purchases: [...newPurchases, ...prev.purchases],
        dealers: currentDealers,
      };
    });
  };

  const handleUniversalImport = (data: {
    bills: TransactionEntry[];
    salesReceipts?: TransactionEntry[];
    cardMembers: CardMember[];
    cardTransactions: CardTransaction[];
    customers: Customer[];
    stockItems?: StockItem[];
  }) => {
    setDb((prev) => {
      // 1. Merge transactions & receipts with deduplication
      const txMap = new Map<string, TransactionEntry>();
      // Existing transactions
      (prev.transactions || []).forEach((t) => {
        const key = t.invoiceNo ? `inv-${t.invoiceNo.trim().toUpperCase()}` : t.id;
        txMap.set(key, t);
      });
      // Incoming bills override or add
      (data.bills || []).forEach((b) => {
        const key = b.invoiceNo ? `inv-${b.invoiceNo.trim().toUpperCase()}` : b.id;
        txMap.set(key, b);
      });
      // Incoming sales receipts
      (data.salesReceipts || []).forEach((r) => {
        const key = r.invoiceNo ? `inv-${r.invoiceNo.trim().toUpperCase()}` : r.id;
        txMap.set(key, r);
      });
      const currentBills = Array.from(txMap.values());

      // 2. Merge card members
      const currentMembers = [...(prev.cardMembers || [])];
      (data.cardMembers || []).forEach((nm) => {
        const idx = currentMembers.findIndex((m) => m.cardNumber === nm.cardNumber && m.schemeId === nm.schemeId);
        if (idx >= 0) {
          currentMembers[idx] = {
            ...currentMembers[idx],
            ...nm,
            totalDeposited: Math.max(currentMembers[idx].totalDeposited, nm.totalDeposited),
            netBalance: Math.max(currentMembers[idx].netBalance, nm.netBalance),
          };
        } else {
          currentMembers.push(nm);
        }
      });

      // 3. Deduplicate and merge card transactions
      const cardTxMap = new Map<string, CardTransaction>();
      (prev.cardTransactions || []).forEach((ct) => cardTxMap.set(ct.id, ct));
      (data.cardTransactions || []).forEach((ct) => cardTxMap.set(ct.id, ct));
      const currentCardTx = Array.from(cardTxMap.values());

      // Re-calculate card member balances from card transactions
      currentMembers.forEach((m) => {
        const txs = currentCardTx.filter((t) => t.cardNumber === m.cardNumber && t.schemeId === m.schemeId);
        let dep = m.openingAmt || 0;
        let ref = 0;
        txs.forEach((t) => {
          if (t.type === 'WeeklyPayment') dep += t.amount;
          else if (t.type === 'Refund') ref += t.amount;
        });
        m.totalDeposited = dep;
        m.totalRefunded = ref;
        m.netBalance = Math.max(0, dep - ref);
      });

      // 4. Merge customers and recompute balance cleanly from currentBills to avoid doubling on re-import
      const custMap = new Map<string, Customer>();
      (prev.customers || []).forEach((c) => {
        custMap.set(c.name.trim().toLowerCase(), {
          ...c,
          totalPurchases: 0,
          totalPurchased: 0,
          totalPaid: 0,
          balanceDue: 0,
        });
      });
      (data.customers || []).forEach((nc) => {
        const key = nc.name.trim().toLowerCase();
        const existing = custMap.get(key);
        if (existing) {
          if (!existing.phone && nc.phone) existing.phone = nc.phone;
          if (!existing.address && nc.address) existing.address = nc.address;
        } else {
          custMap.set(key, {
            ...nc,
            totalPurchases: 0,
            totalPurchased: 0,
            totalPaid: 0,
            balanceDue: 0,
          });
        }
      });
      // Accurately calculate customer ledger totals from all bills
      currentBills.forEach((b) => {
        if (!b.customerName) return;
        const key = b.customerName.trim().toLowerCase();
        let cust = custMap.get(key);
        if (!cust) {
          cust = {
            id: `cust-${key.replace(/[^a-z0-9]/g, '-')}`,
            name: b.customerName.trim(),
            phone: b.customerPhone || '',
            address: b.village ? `${b.village}, Wardha` : 'Wardha',
            totalPurchases: 0,
            totalPurchased: 0,
            totalPaid: 0,
            balanceDue: 0,
            lastVisit: b.date,
          };
          custMap.set(key, cust);
        }
        cust.totalPurchases += (b.totalAmount || 0);
        cust.totalPurchased = cust.totalPurchases;
        cust.totalPaid += (b.payingNow || 0);
        cust.balanceDue = Math.max(0, cust.totalPurchases - cust.totalPaid);
        if (!cust.phone && b.customerPhone) cust.phone = b.customerPhone;
        if (!cust.address && b.village) cust.address = `${b.village}, Wardha`;
        if (b.date) cust.lastVisit = b.date;
      });
      const currentCustomers = Array.from(custMap.values());

      // 4. Merge Stock / Inventory Items extracted from Bills
      const currentStock = [...(prev.stock || [])];
      const incomingStock = data.stockItems || [];
      incomingStock.forEach((ns) => {
        const idx = currentStock.findIndex(
          (s) => s.name.trim().toLowerCase() === ns.name.trim().toLowerCase()
        );
        if (idx >= 0) {
          if (ns.sellingPrice && ns.sellingPrice > 0 && (!currentStock[idx].sellingPrice || currentStock[idx].sellingPrice === 0)) {
            currentStock[idx].sellingPrice = ns.sellingPrice;
          }
          if (ns.category && !currentStock[idx].category) {
            currentStock[idx].category = ns.category;
          }
        } else {
          currentStock.push(ns);
        }
      });

      // Also ensure any individual bill with stockItemName gets auto-registered in stock
      data.bills.forEach((b) => {
        if (b.stockItemName && b.stockItemName.trim().length > 1) {
          const sName = b.stockItemName.trim();
          const exists = currentStock.some((s) => s.name.trim().toLowerCase() === sName.toLowerCase());
          if (!exists) {
            currentStock.push({
              id: `stk-bill-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              name: sName,
              code: `PRD-${(currentStock.length + 1).toString().padStart(3, '0')}`,
              category: b.category || 'इलेक्ट्रॉनिक्स & घरगुती उपकरणे',
              quantity: b.quantity || 1,
              sellingPrice: b.unitPrice || (b.totalAmount && b.quantity ? Math.round(b.totalAmount / b.quantity) : b.totalAmount),
              purchasePrice: Math.round((b.unitPrice || b.totalAmount || 0) * 0.75),
              minStockLevel: 2,
              unit: 'नग',
              description: `बिलांमधून जोडलेले उत्पादन (बिल #${b.invoiceNo})`,
            });
          }
        }
      });

      return {
        ...prev,
        transactions: currentBills,
        customers: currentCustomers,
        cardMembers: currentMembers,
        cardTransactions: currentCardTx,
        stock: deduplicateStock(currentStock),
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

  const handleUpdateRecord = (category: string, id: string, updatedData: any) => {
    setDb((prev) => {
      let nextDb = { ...prev };
      if (category === 'bill') {
        nextDb.transactions = (prev.transactions || []).map((t) => (t.id === id ? { ...t, ...updatedData } : t));
      } else if (category === 'receipt') {
        nextDb.cardTransactions = (prev.cardTransactions || []).map((ct) => (ct.id === id ? { ...ct, ...updatedData } : ct));
      } else if (category === 'card') {
        nextDb.cardMembers = (prev.cardMembers || []).map((m) => (m.id === id ? { ...m, ...updatedData } : m));
      } else if (category === 'customer') {
        nextDb.customers = (prev.customers || []).map((c) => (c.id === id ? { ...c, ...updatedData } : c));
      } else if (category === 'purchase') {
        nextDb.purchases = (prev.purchases || []).map((p) => (p.id === id ? { ...p, ...updatedData } : p));
      } else if (category === 'dealer') {
        nextDb.dealers = (prev.dealers || []).map((d) => (d.id === id ? { ...d, ...updatedData } : d));
      }
      saveDatabase(nextDb);
      syncDatabaseToCloud(nextDb, setCloudStatus, false);
      return nextDb;
    });
  };

  const handleDeleteRecord = (category: string, id: string) => {
    setDb((prev) => {
      let nextDb = { ...prev };
      if (category === 'bill') {
        nextDb.transactions = (prev.transactions || []).filter((t) => t.id !== id);
      } else if (category === 'receipt') {
        nextDb.cardTransactions = (prev.cardTransactions || []).filter((ct) => ct.id !== id);
      } else if (category === 'card') {
        nextDb.cardMembers = (prev.cardMembers || []).filter((m) => m.id !== id);
        nextDb.cardTransactions = (prev.cardTransactions || []).filter((ct) => ct.cardId !== id);
      } else if (category === 'customer') {
        nextDb.customers = (prev.customers || []).filter((c) => c.id !== id);
      } else if (category === 'purchase') {
        nextDb.purchases = (prev.purchases || []).filter((p) => p.id !== id);
      } else if (category === 'dealer') {
        nextDb.dealers = (prev.dealers || []).filter((d) => d.id !== id);
      }
      saveDatabase(nextDb);
      syncDatabaseToCloud(nextDb, setCloudStatus, false);
      return nextDb;
    });
  };

  const handleUpdateMember = (updatedMember: any) => {
    setDb((prev) => {
      const nextDb = {
        ...prev,
        cardMembers: (prev.cardMembers || []).map((m) => (m.id === updatedMember.id ? updatedMember : m)),
      };
      saveDatabase(nextDb);
      syncDatabaseToCloud(nextDb, setCloudStatus, false);
      return nextDb;
    });
  };

  const handleDeleteMember = (memberId: string) => {
    setDb((prev) => {
      const nextDb = {
        ...prev,
        cardMembers: (prev.cardMembers || []).filter((m) => m.id !== memberId),
        cardTransactions: (prev.cardTransactions || []).filter((ct) => ct.cardId !== memberId),
      };
      saveDatabase(nextDb);
      syncDatabaseToCloud(nextDb, setCloudStatus, false);
      return nextDb;
    });
  };

  if (appMode === 'shop') {
    return (
      <>
        {/* Real-time New Order Floating Notification Banner */}
        {newOrderAlert && (
          <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4 no-print animate-fade-in">
            <div className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 p-3 rounded-2xl shadow-2xl border-2 border-amber-300 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-8 h-8 rounded-full bg-slate-950 text-amber-300 flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                  🔔
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-xs sm:text-sm text-slate-950">
                      नवीन कस्टमर ऑर्डर प्राप्त!
                    </span>
                    <span className="bg-slate-900 text-amber-300 text-[11px] font-mono font-bold px-2 py-0.2 rounded-full">
                      ₹{(Number(newOrderAlert.totalAmount) || 0).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[11px] font-semibold text-slate-800 truncate">
                    ग्राहक: {newOrderAlert.customerName} {newOrderAlert.customerPhone ? `• ${newOrderAlert.customerPhone}` : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {newOrderAlert.customerPhone && (
                  <a
                    href={`https://wa.me/91${newOrderAlert.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                      `नमस्ते ${newOrderAlert.customerName}, श्री साई इंटरप्राइजेसमध्ये आपली ऑनलाइन ऑर्डर प्राप्त झाली आहे.`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1"
                  >
                    WA
                  </a>
                )}
                {currentUser && (
                  <button
                    onClick={() => {
                      setAppMode('erp');
                      setActiveTab('all-entries');
                      setNewOrderAlert(null);
                    }}
                    className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
                  >
                    नोंदी पहा
                  </button>
                )}
                <button
                  onClick={() => setNewOrderAlert(null)}
                  className="p-1 rounded-lg text-slate-800 hover:text-black hover:bg-black/10 transition cursor-pointer"
                  title="Dismiss"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        )}

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
    <div className="min-h-screen tactile-canvas flex text-[var(--tactile-text-main)] antialiased font-sans">
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
        {/* Real-time Online Order Banner in ERP */}
        {newOrderAlert && (
          <div className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 px-4 py-2.5 shadow-md flex items-center justify-between gap-3 border-b-2 border-amber-300 no-print animate-fade-in">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold min-w-0">
              <span className="text-base">🔔</span>
              <span>नवीन ग्राहक ऑर्डर प्राप्त:</span>
              <span className="bg-slate-950 text-amber-300 text-xs px-2 py-0.5 rounded-full font-mono font-bold">
                ₹{(Number(newOrderAlert.totalAmount) || 0).toLocaleString()}
              </span>
              <span className="hidden sm:inline font-semibold text-slate-900 truncate">
                {newOrderAlert.customerName} ({newOrderAlert.customerPhone || 'Wardha'})
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0 text-xs">
              {newOrderAlert.customerPhone && (
                <a
                  href={`https://wa.me/91${newOrderAlert.customerPhone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold transition shadow-xs"
                >
                  WhatsApp
                </a>
              )}
              <button
                onClick={() => {
                  setActiveTab('all-entries');
                  setNewOrderAlert(null);
                }}
                className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-white rounded-lg font-bold transition shadow-xs"
              >
                नोंदी पहा
              </button>
              <button
                onClick={() => setNewOrderAlert(null)}
                className="p-1 text-slate-800 hover:text-black font-bold text-sm"
                title="Dismiss"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Real-time Google Firestore Daily Quota Banner */}
        {cloudStatus === 'quota-exceeded' && (
          <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white px-4 py-2.5 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm no-print">
            <div className="flex items-center gap-2 font-medium">
              <span className="text-base">⚡</span>
              <span>
                <strong>Cloud Write Quota Limit Reached (Free Tier):</strong> All your bills, customers, stock, and entries are 100% safely stored in your browser's local database. Quota will automatically reset tomorrow.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a
                href="https://console.firebase.google.com/project/the-transmitter-bpqwl/firestore/databases/ai-studio-shrisaienterpris-49489c0f-d339-4f9e-a68f-91136656859a/data?openUpgradeDialog=true"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1 bg-white text-orange-800 hover:bg-orange-50 rounded-lg font-bold transition shadow-xs flex items-center gap-1 text-xs"
              >
                Upgrade Plan / View Quota ↗
              </a>
              <button
                type="button"
                onClick={handleManualCloudSync}
                className="px-3 py-1 bg-black/20 hover:bg-black/30 text-white rounded-lg font-bold transition text-xs cursor-pointer"
              >
                Retry Cloud Sync
              </button>
            </div>
          </div>
        )}

        {/* Top Navbar */}
        <header className="sticky top-0 z-30 tactile-card rounded-none border-t-0 border-x-0 border-b border-[var(--tactile-border)] px-4 sm:px-6 py-3 flex items-center justify-between no-print backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="p-2 rounded-lg text-[var(--tactile-text-muted)] hover:bg-[var(--tactile-surface-inset)] lg:hidden cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <span className="font-bold text-[var(--tactile-text-heading)] text-sm sm:text-base tracking-tight truncate">
                {db.settings.businessName}
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full tactile-inset text-[var(--tactile-text-muted)] text-xs font-mono font-medium">
                Cloud ERP
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Active Day / Night Theme Toggle */}
            <DayNightToggle id="erp-header-daynight" size="sm" showLabel={false} />

            {/* Install Mobile App button */}
            <button
              type="button"
              onClick={() => setShowInstallModal(true)}
              title="Install Official Mobile App"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden md:inline">मोबाईल ॲप</span>
              <span className="md:hidden">ॲप</span>
            </button>

            {/* View Customer Website button */}
            <button
              type="button"
              onClick={() => setAppMode('shop')}
              title="View Customer Website & Public Passbook Portal"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-bold transition cursor-pointer shadow-2xs"
            >
              <Store className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
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
                  : cloudStatus === 'quota-exceeded'
                  ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
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
                {cloudStatus === 'quota-exceeded' && (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                )}
                {(cloudStatus === 'offline' || cloudStatus === 'error') && (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                )}
              </span>
              <Cloud className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {cloudStatus === 'connected' && 'Cloud Synced'}
                {cloudStatus === 'syncing' && 'Syncing...'}
                {cloudStatus === 'quota-exceeded' && 'Local (Quota Full)'}
                {cloudStatus === 'offline' && 'Offline'}
                {cloudStatus === 'error' && 'Sync Error'}
              </span>
            </button>

            {/* Master Search / Uploaded Data Quick Button */}
            <button
              type="button"
              onClick={() => setActiveTab('uploaded-data')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold shadow-2xs transition cursor-pointer ${
                activeTab === 'uploaded-data'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-indigo-50/70 border-indigo-200 text-indigo-900 hover:bg-indigo-100'
              }`}
              title="CSV द्वारे अपलोड केलेला सर्व डेटा, बिले व पावत्या शोधा"
            >
              <Search className="w-3.5 h-3.5 text-indigo-600 group-hover:text-indigo-700" />
              <span className="hidden sm:inline">सर्व डेटा शोधा</span>
              <span className="sm:hidden">शोधा</span>
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

        {/* Quick Shortcut Buttons Bar */}
        <QuickActionBar
          onWeeklyCollection={() => {
            setActiveTab('card-scheme');
            setCardSchemeInitialAction('payment');
          }}
          onNewCard={() => {
            setActiveTab('card-scheme');
            setCardSchemeInitialAction('add-card');
          }}
          onCustomerLedger={() => {
            setActiveTab('customers');
          }}
          onNewBill={() => {
            setActiveTab('add-entry');
          }}
          onReceivePavti={() => {
            setShowQuickPavtiModal(true);
          }}
          onMasterSearch={() => {
            setActiveTab('uploaded-data');
          }}
        />

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
              initialAction={cardSchemeInitialAction}
              onClearInitialAction={() => setCardSchemeInitialAction(null)}
              onUpdateMember={handleUpdateMember}
              onDeleteMember={handleDeleteMember}
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
              transactions={db.transactions || []}
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
              onUniversalImport={handleUniversalImport}
              existingCardMembers={db.cardMembers || []}
              existingDealers={db.dealers || []}
              existingBills={db.transactions || []}
              existingReceipts={db.cardTransactions || []}
              existingCustomers={db.customers || []}
              existingPurchases={db.purchases || []}
              existingStock={db.stock || []}
              onSwitchTab={setActiveTab}
              onFullResetData={handleClearAllDemoData}
              onClearCardsData={handleClearCardsData}
              onClearBillsData={handleClearBillsData}
              onClearZeroBills={handleClearZeroBills}
            />
          )}

          {activeTab === 'uploaded-data' && (
            <ErrorBoundary fallbackTitle="मास्टर शोध (Master Search) लोड करताना त्रुटी आली">
              <UploadedDataView
                transactions={db.transactions || []}
                cardMembers={db.cardMembers || []}
                cardTransactions={db.cardTransactions || []}
                customers={db.customers || []}
                purchases={db.purchases || []}
                dealers={db.dealers || []}
                stock={db.stock || []}
                settings={db.settings}
                onOpenInvoiceModal={setSelectedInvoice}
                onOpenPassbookModal={setSelectedPassbookMember}
                onNavigateTab={(tab, filterParam) => {
                  if (tab === 'dealer-ledger' && filterParam) {
                    setSelectedDealerForLedger(filterParam);
                  }
                  setActiveTab(tab);
                }}
                onUpdateRecord={handleUpdateRecord}
                onDeleteRecord={handleDeleteRecord}
              />
            </ErrorBoundary>
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
              transactions={db.transactions || []}
              cardTransactions={db.cardTransactions || []}
              onAddCustomer={handleAddCustomer}
              onSettlePayment={handleSettlePayment}
              onRecalculateLedgers={handleRecalculateCustomerLedgers}
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
                onClearCardsData={handleClearCardsData}
                onClearBillsData={handleClearBillsData}
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

      {/* Card Passbook modal for previewing member passbook from Universal Uploaded Data search */}
      {selectedPassbookMember && (
        <CardPassbookModal
          member={selectedPassbookMember}
          transactions={db.cardTransactions || []}
          settings={db.settings}
          salesBills={db.transactions || []}
          onClose={() => setSelectedPassbookMember(null)}
          onUpdateMember={(updatedMember) => {
            handleUpdateMember(updatedMember);
            setSelectedPassbookMember(updatedMember);
          }}
        />
      )}

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

      {/* Quick Pavti / Instant Payment Receipt Modal */}
      {showQuickPavtiModal && (
        <QuickPavtiModal
          customers={db.customers || []}
          settings={db.settings}
          onClose={() => setShowQuickPavtiModal(false)}
          onSettlePayment={handleSettlePayment}
          onOpenInvoiceModal={setSelectedInvoice}
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
