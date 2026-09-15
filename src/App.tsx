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

  // 0. Load comprehensive state from IndexedDB on startup (bypasses localStorage 5MB quota)
  useEffect(() => {
    let isMounted = true;
    loadDatabaseFromIndexedDB().then((idbData) => {
      if (!isMounted || !idbData) return;
      setDb((prev) => {
        // If IndexedDB has more complete datasets, merge them in
        const idbCustCount = idbData.customers?.length || 0;
        const prevCustCount = prev.customers?.length || 0;
        const idbTxCount = idbData.transactions?.length || 0;
        const prevTxCount = prev.transactions?.length || 0;
        const idbCardTxCount = idbData.cardTransactions?.length || 0;
        const prevCardTxCount = prev.cardTransactions?.length || 0;

        if (idbCustCount >= prevCustCount || idbTxCount >= prevTxCount || idbCardTxCount >= prevCardTxCount) {
          return {
            ...prev,
            ...idbData,
            settings: { ...prev.settings, ...(idbData.settings || {}) },
          };
        }
        return prev;
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
            agentAdvances: remoteData.agentAdvances !== undefined ? remoteData.agentAdvances : prev.agentAdvances,
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
  const isInitialMountRef = useRef(true);
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
      // 1. Purge zero-amount ghost transactions
      const validTransactions = (prev.transactions || []).filter(
        (t) =>
          Number(t.totalAmount || 0) > 0 ||
          Number(t.payingNow || 0) > 0 ||
          Number(t.dueAmount || 0) > 0 ||
          (t.invoiceNo && !t.invoiceNo.startsWith('INV-000'))
      );

      // 2. Clean customer phones: strip "0", "00", or invalid short sequences
      const updatedCustomers = (prev.customers || []).map((c) => {
        let cleanPhone = (c.phone || '').replace(/\D/g, '');
        if (cleanPhone.length < 10 || /^(\d)\1{9,}$/.test(cleanPhone)) {
          cleanPhone = '';
        }
        return {
          ...c,
          phone: cleanPhone,
        };
      });

      // 3. Reconcile each customer's actual transactions
      const customerStats = new Map<string, { totalPurchased: number; totalPaid: number; count: number }>();
      updatedCustomers.forEach((c) => {
        customerStats.set(c.id, { totalPurchased: 0, totalPaid: 0, count: 0 });
      });

      validTransactions.forEach((t) => {
        const tPhone = (t.customerPhone || '').replace(/\D/g, '');
        const isTPhoneValid = tPhone.length >= 10 && !/^(\d)\1{9,}$/.test(tPhone);
        const tNameNorm = (t.customerName || '').trim().toLowerCase();
        const isGenericTName = !tNameNorm || tNameNorm.startsWith('ग्राहक #') || tNameNorm.startsWith('customer #');

        // Find customer
        const matchedCust = updatedCustomers.find((c) => {
          if (t.customerId && c.id === t.customerId) return true;
          if (isTPhoneValid && c.phone && c.phone === tPhone) return true;
          if (!isGenericTName && c.name && c.name.trim().toLowerCase() === tNameNorm) return true;
          if (isGenericTName && c.name && c.name.trim().toLowerCase() === tNameNorm) return true;
          return false;
        });

        if (matchedCust) {
          const stats = customerStats.get(matchedCust.id)!;
          const isReceipt = t.invoiceNo?.startsWith('REC-') || t.itemDetails?.toLowerCase().includes('settlement');
          if (isReceipt) {
            stats.totalPaid += Number(t.payingNow || t.totalAmount || 0);
          } else {
            stats.totalPurchased += Number(t.totalAmount || 0);
            stats.totalPaid += Number(t.payingNow || 0);
          }
          stats.count += 1;
        }
      });

      // Also account for card transactions
      (prev.cardTransactions || []).forEach((ct) => {
        const ctPhone = (ct.customerPhone || '').replace(/\D/g, '');
        const isCtPhoneValid = ctPhone.length >= 10 && !/^(\d)\1{9,}$/.test(ctPhone);
        const ctNameNorm = (ct.memberName || ct.customerName || '').trim().toLowerCase();
        const isGenericCtName = !ctNameNorm || ctNameNorm.startsWith('ग्राहक #') || ctNameNorm.startsWith('customer #');

        const matchedCust = updatedCustomers.find((c) => {
          if (ct.memberId && c.id === ct.memberId) return true;
          if (ct.customerId && c.id === ct.customerId) return true;
          if (isCtPhoneValid && c.phone && c.phone === ctPhone) return true;
          if (!isGenericCtName && c.name && c.name.trim().toLowerCase() === ctNameNorm) return true;
          return false;
        });

        if (matchedCust) {
          const stats = customerStats.get(matchedCust.id)!;
          stats.totalPaid += Number(ct.amount || 0);
        }
      });

      // Build reconciled customer records
      const reconciledCustomers = updatedCustomers.map((c) => {
        const stats = customerStats.get(c.id);
        if (stats && stats.count > 0) {
          // Linked transactions are authoritative
          const purchased = stats.totalPurchased;
          const paid = stats.totalPaid;
          const due = Math.max(0, purchased - paid);
          return {
            ...c,
            totalPurchased: purchased,
            totalPaid: paid,
            balanceDue: due,
          };
        } else {
          // No linked individual transactions: sanitize opening register balance
          let purchased = Number(c.totalPurchased || 0);
          let paid = Number(c.totalPaid || 0);
          let due = Number(c.balanceDue || 0);

          const isGeneric = (c.name || '').trim().toLowerCase().startsWith('ग्राहक #');
          // If a generic customer has no linked transactions and bloated numbers from phone "0" bug
          if (isGeneric && purchased > 100000) {
            purchased = 0;
            paid = 0;
            due = 0;
          } else {
            if (purchased === 0 && (paid > 0 || due > 0)) {
              purchased = paid + due;
            }
            due = Math.max(0, purchased - paid);
          }

          return {
            ...c,
            totalPurchased: purchased,
            totalPaid: paid,
            balanceDue: due,
          };
        }
      });

      return {
        ...prev,
        transactions: validTransactions,
        customers: reconciledCustomers,
      };
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

  // CSV Bulk Import Handlers
  const handleImportBills = (newBills: TransactionEntry[]) => {
    setDb((prev) => {
      // 1. Filter out zero-value ghost records
      const filteredBills = newBills.filter(
        (b) =>
          Number(b.totalAmount || 0) > 0 ||
          Number(b.payingNow || 0) > 0 ||
          Number(b.dueAmount || 0) > 0 ||
          (b.invoiceNo && !b.invoiceNo.startsWith('INV-000'))
      );

      // 2. Exact match & deduplication by Invoice Number
      const existingTransactions = [...(prev.transactions || [])];
      filteredBills.forEach((bill) => {
        const existingIdx = existingTransactions.findIndex(
          (t) => t.invoiceNo.trim().toLowerCase() === bill.invoiceNo.trim().toLowerCase()
        );
        if (existingIdx >= 0) {
          existingTransactions[existingIdx] = {
            ...existingTransactions[existingIdx],
            ...bill,
          };
        } else {
          existingTransactions.unshift(bill);
        }
      });

      // 3. Also update or add to customers list so their totalPurchased & balanceDue are up to date
      const updatedCustomers = [...(prev.customers || [])];
      filteredBills.forEach((bill) => {
        const normName = (bill.customerName || '').trim().toLowerCase();
        const rawDigits = (bill.customerPhone || '').replace(/\D/g, '');
        const isPhoneValid = rawDigits.length >= 10 && !/^(\d)\1{9,}$/.test(rawDigits);
        const phone = isPhoneValid ? rawDigits : '';
        const isGenericName = !normName || normName.startsWith('ग्राहक #') || normName.startsWith('customer #');

        const idx = updatedCustomers.findIndex((c) => {
          if (c.id && bill.customerId && c.id === bill.customerId) return true;
          if (phone && c.phone) {
            const cDigits = c.phone.replace(/\D/g, '');
            if (cDigits.length >= 10 && cDigits === phone) return true;
          }
          if (!isGenericName && c.name && c.name.trim().toLowerCase() === normName) return true;
          return false;
        });

        if (idx >= 0) {
          const curr = updatedCustomers[idx];
          const newPurchased = (curr.totalPurchased || 0) + bill.totalAmount;
          const newPaid = (curr.totalPaid || 0) + bill.payingNow;
          updatedCustomers[idx] = {
            ...curr,
            totalPurchased: newPurchased,
            totalPaid: newPaid,
            balanceDue: Math.max(0, newPurchased - newPaid),
            village: bill.village || curr.village,
            phone: curr.phone || phone,
          };
        } else {
          updatedCustomers.push({
            id: bill.customerId || `cust-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            name: bill.customerName,
            phone: phone,
            village: bill.village || '',
            totalPurchased: bill.totalAmount,
            totalPaid: bill.payingNow,
            balanceDue: bill.dueAmount,
          });
        }
      });

      return {
        ...prev,
        transactions: existingTransactions,
        customers: updatedCustomers,
      };
    });
  };

  const handleImportReceipts = (newReceipts: CardTransaction[]) => {
    setDb((prev) => {
      // 1. Credit receipts against matching bills (reduce dueAmount, increase payingNow)
      const updatedTransactions = [...(prev.transactions || [])];
      // 2. Also prepare payment entries for bills if needed and credit customer balanceDue
      const updatedCustomers = [...(prev.customers || [])];

      newReceipts.forEach((rcpt) => {
        const rcptNameNorm = (rcpt.customerName || '').trim().toLowerCase();
        const rawDigits = (rcpt.customerPhone || '').replace(/\D/g, '');
        const isPhoneValid = rawDigits.length >= 10 && !/^(\d)\1{9,}$/.test(rawDigits);
        const rcptPhone = isPhoneValid ? rawDigits : '';
        const isGenericName = !rcptNameNorm || rcptNameNorm.startsWith('ग्राहक #') || rcptNameNorm.startsWith('customer #');
        const rcptCard = rcpt.cardNumber;
        const rcptAmount = Number(rcpt.amount || 0);

        // Find matching customer
        const custIdx = updatedCustomers.findIndex((c) => {
          if (c.id && (rcpt as any).customerId && c.id === (rcpt as any).customerId) return true;
          if (rcptPhone && c.phone) {
            const cDigits = c.phone.replace(/\D/g, '');
            if (cDigits.length >= 10 && cDigits === rcptPhone) return true;
          }
          if (!isGenericName && c.name && c.name.trim().toLowerCase() === rcptNameNorm) return true;
          return false;
        });

        if (custIdx >= 0) {
          const cust = updatedCustomers[custIdx];
          const newPaid = (cust.totalPaid || 0) + rcptAmount;
          const effectivePurchased = Math.max(cust.totalPurchased || 0, newPaid);
          const newDue = Math.max(0, (cust.balanceDue || 0) - rcptAmount);
          updatedCustomers[custIdx] = {
            ...cust,
            totalPurchased: effectivePurchased,
            totalPaid: newPaid,
            balanceDue: newDue,
          };
        }

        // Credit against customer's existing unpaid bills (by invoiceNo if specified, or by customer name / card)
        let remainingCredit = rcptAmount;
        const targetInvoice = (rcpt as any).invoiceNo;

        for (let i = 0; i < updatedTransactions.length && remainingCredit > 0; i++) {
          const bill = updatedTransactions[i];
          const billNameNorm = (bill.customerName || '').trim().toLowerCase();
          const billDigits = (bill.customerPhone || '').replace(/\D/g, '');
          const isBillPhoneValid = billDigits.length >= 10 && !/^(\d)\1{9,}$/.test(billDigits);
          const isTargetBill = targetInvoice
            ? bill.invoiceNo?.toLowerCase() === targetInvoice.toLowerCase()
            : (bill.dueAmount > 0) &&
              ((!isGenericName && billNameNorm === rcptNameNorm) ||
               (rcptPhone && isBillPhoneValid && billDigits === rcptPhone) ||
               (rcptCard && bill.cardNumber === rcptCard));

          if (isTargetBill && bill.dueAmount > 0) {
            const creditToApply = Math.min(bill.dueAmount, remainingCredit);
            updatedTransactions[i] = {
              ...bill,
              payingNow: bill.payingNow + creditToApply,
              dueAmount: Math.max(0, bill.dueAmount - creditToApply),
              notes: bill.notes
                ? `${bill.notes} • Credited ₹${creditToApply} via Receipt #${rcpt.receiptNo}`
                : `Credited ₹${creditToApply} via Receipt #${rcpt.receiptNo}`,
            };
            remainingCredit -= creditToApply;
          }
        }
      });

      return {
        ...prev,
        transactions: updatedTransactions,
        cardTransactions: [...newReceipts, ...(prev.cardTransactions || [])],
        customers: updatedCustomers,
      };
    });
  };

  const handleImportCardMembers = (newCards: CardMember[]) => {
    setDb((prev) => {
      const existing = [...(prev.cardMembers || [])];
      newCards.forEach((nc) => {
        const idx = existing.findIndex(
          (ec) => ec.schemeId === nc.schemeId && ec.cardNumber === nc.cardNumber
        );
        if (idx >= 0) {
          existing[idx] = {
            ...existing[idx],
            customerName: nc.customerName || existing[idx].customerName,
            phone: nc.phone || existing[idx].phone,
            village: nc.village || existing[idx].village,
            sheetNo: nc.sheetNo || existing[idx].sheetNo,
            openingAmt: nc.openingAmt !== undefined ? nc.openingAmt : existing[idx].openingAmt,
            totalDeposited: Math.max(existing[idx].totalDeposited || 0, nc.totalDeposited || 0),
            netBalance: Math.max(existing[idx].netBalance || 0, nc.netBalance || 0),
            notes: nc.notes || existing[idx].notes,
          };
        } else {
          existing.push(nc);
        }
      });
      return {
        ...prev,
        cardMembers: existing,
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
    };

    // 1. Immediately update React state to clear all views instantly
    setDb(cleanDb);

    // 2. Persist to localStorage
    try {
      localStorage.setItem('shri_sai_enterprise_db', JSON.stringify(cleanDb));
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
        <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between no-print">
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

            {/* All Uploaded Data Quick Access Button (from Screenshot) */}
            <button
              type="button"
              onClick={() => setActiveTab('uploaded-data')}
              title="अपलोड झालेला सर्व २,५०२+ डेटा शोधा व तपासा"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer shadow-2xs ${
                activeTab === 'uploaded-data'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Search className={`w-3.5 h-3.5 ${activeTab === 'uploaded-data' ? 'text-white' : 'text-blue-600'}`} />
              <span className="hidden sm:inline">सर्व डेटा शोधा</span>
            </button>

            {/* Day / Night Tactile Theme Toggle */}
            <ThemeToggle size="sm" showLabel={true} />

            {/* Field Staff Quick Actions Modal Launcher Button */}
            <button
              type="button"
              onClick={() => {
                setFieldQuickActionTab('card-collection');
                setShowFieldQuickActions(true);
              }}
              title="फिल्ड स्टाफ क्विक काउंटर: साप्ताहिक हफ्ता, नवीन बिल, पावती जमा व खातेवही"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black transition cursor-pointer shadow-sm active:scale-95"
            >
              <CreditCard className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
              <span>स्टाफ काउंटर</span>
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
        <main className="flex-1 pb-12">
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
