import React, { useState, useEffect, useRef } from 'react';
import { Menu, Globe, Store, PlusCircle, Cloud, RefreshCw, CheckCircle2, Crown, UserCheck, LogOut, Lock, Download, Search, CreditCard, Coins, Megaphone, ShieldCheck, Save, Edit3 } from 'lucide-react';
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
  AgentAdvanceEntry
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
import { AgentHisabView } from './components/AgentHisabView';
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
import { FinanceCalculatorModal, FinanceDetailsPayload } from './components/FinanceCalculatorModal';
import { CashClosingModal } from './components/CashClosingModal';
import { PromoGeneratorModal } from './components/PromoGeneratorModal';
import { WarrantyTrackerModal } from './components/WarrantyTrackerModal';
import { AdminNotificationDropdown, AdminNotification } from './components/AdminNotificationDropdown';
import { NotificationEditModal } from './components/NotificationEditModal';

export default function App() {
  const [db, setDb] = useState<AppDatabase>(() => loadDatabase());
  const [activeTab, setActiveTab] = useState<ActiveTab>('add-entry'); // matches the user's screenshot where "Add Entry" is active
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<TransactionEntry | null>(null);
  const [cardSchemeInitialAction, setCardSchemeInitialAction] = useState<'payment' | 'add-card' | 'refund' | 'delivery-challan' | null>(null);
  const [editingEntry, setEditingEntry] = useState<TransactionEntry | null>(null);
  const [financePrefill, setFinancePrefill] = useState<FinanceDetailsPayload | null>(null);
  const [showQuickPavtiModal, setShowQuickPavtiModal] = useState<boolean>(false);
  const [quickPavtiCustomer, setQuickPavtiCustomer] = useState<Customer | null>(null);
  const [quickPavtiBillNo, setQuickPavtiBillNo] = useState<string | undefined>(undefined);
  const [quickPavtiAmount, setQuickPavtiAmount] = useState<number | undefined>(undefined);
  const [showFinanceModal, setShowFinanceModal] = useState<boolean>(false);

  // New High-Value Smart Tools States
  const [showCashClosingModal, setShowCashClosingModal] = useState<boolean>(false);
  const [showPromoModal, setShowPromoModal] = useState<boolean>(false);
  const [showWarrantyModal, setShowWarrantyModal] = useState<boolean>(false);
  const [showBackupReminder, setShowBackupReminder] = useState<boolean>(() => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const lastBackup = localStorage.getItem('shri_sai_last_backup_date');
      const hours = new Date().getHours();
      return hours >= 17 && lastBackup !== today;
    } catch (e) {
      return false;
    }
  });

  const handleApplyFinanceToBill = (details: FinanceDetailsPayload) => {
    setFinancePrefill(details);
    setActiveTab('add-entry');
    showToast(`✓ ${details.customerName ? details.customerName + ' करिता ' : ''}${details.provider} फायनान्स तपशील बिलामध्ये जोडले!`, 'success');
  };

  const handleOpenQuickPavti = (customer?: Customer | null, billNo?: string, amount?: number) => {
    setQuickPavtiCustomer(customer || null);
    setQuickPavtiBillNo(billNo);
    setQuickPavtiAmount(amount);
    setShowQuickPavtiModal(true);
  };
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
    isFinance?: boolean;
    providerName?: string;
    schemeName?: string;
    monthlyEmi?: number;
    downPayment?: number;
  } | null>(null);

  // Live Admin Notifications list (Cart activities, online orders, finance applications)
  const [adminNotifications, setAdminNotifications] = useState<AdminNotification[]>(() => {
    try {
      const saved = localStorage.getItem('shri_sai_admin_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(() => {
    try {
      return localStorage.getItem('shri_sai_sound_muted') === 'true';
    } catch (e) {
      return false;
    }
  });

  const toggleAudioMuted = () => {
    setIsAudioMuted((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('shri_sai_sound_muted', String(next));
      } catch (e) {}
      return next;
    });
  };

  const handleMarkAllNotificationsRead = () => {
    setAdminNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      try {
        localStorage.setItem('shri_sai_admin_notifications', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handleClearAllNotifications = () => {
    setAdminNotifications([]);
    try {
      localStorage.removeItem('shri_sai_admin_notifications');
    } catch (e) {}
  };

  const [selectedNotificationToEdit, setSelectedNotificationToEdit] = useState<AdminNotification | null>(null);

  const handleSaveNotification = (updated: AdminNotification) => {
    setAdminNotifications((prev) => {
      const exists = prev.some((n) => n.id === updated.id);
      const list = exists
        ? prev.map((n) => (n.id === updated.id ? updated : n))
        : [updated, ...prev];
      try {
        localStorage.setItem('shri_sai_admin_notifications', JSON.stringify(list));
      } catch (e) {}
      return list;
    });
    showToast('✓ सूचनेतील बदल यशस्वीरित्या सेव्ह केले!', 'success');
  };

  const handleDeleteNotification = (id: string) => {
    setAdminNotifications((prev) => {
      const list = prev.filter((n) => n.id !== id);
      try {
        localStorage.setItem('shri_sai_admin_notifications', JSON.stringify(list));
      } catch (e) {}
      return list;
    });
    showToast('नोंद यशस्वीरित्या हटवली.', 'info');
  };

  const handleCreateBillFromNotification = (notif: AdminNotification) => {
    const totalAmt = Number(notif.amount) || 0;
    const isFin = notif.type === 'finance_order_placed' || Boolean(notif.providerName);

    const draftEntry: TransactionEntry = {
      id: `INV-${Date.now().toString().slice(-6)}`,
      invoiceNo: `BILL-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString().split('T')[0],
      customerName: notif.customerName || (notif.type === 'cart_add' ? 'काउंटर ग्राहक' : 'ऑनलाइन ग्राहक'),
      customerPhone: notif.customerPhone || '',
      village: notif.customerAddress || 'वर्धा',
      itemDetails: notif.itemName || notif.title || 'इलेक्ट्रॉनिक्स / फर्निचर',
      category: 'electronics',
      totalAmount: totalAmt,
      payingNow: isFin ? 0 : totalAmt,
      dueAmount: isFin ? totalAmt : 0,
      paymentMode: isFin ? 'Online' : 'Cash',
      entryType: 'Bill',
      notes: notif.notes || (notif.providerName ? `फायनान्स: ${notif.providerName} (${notif.schemeName || '0% EMI'})` : 'वेबसाईट कार्टमधून तयार केलेले बिल'),
      createdAt: new Date().toISOString(),
    };

    setEditingEntry(draftEntry);
    setAdminNotifications((prev) => {
      const list = prev.map((n) => (n.id === notif.id ? { ...n, status: 'converted_to_bill' as const, read: true } : n));
      try {
        localStorage.setItem('shri_sai_admin_notifications', JSON.stringify(list));
      } catch (e) {}
      return list;
    });
    setAppMode('erp');
    setActiveTab('add-entry');
    showToast(`✓ ग्राहक ${draftEntry.customerName} ची माहिती नवीन बिल फॉर्ममध्ये भरली आहे!`, 'success');
  };

  const [toastBanner, setToastBanner] = useState<{
    text: string;
    type?: 'success' | 'info' | 'error';
  } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastBanner({ text, type });
    setTimeout(() => {
      setToastBanner((prev) => (prev?.text === text ? null : prev));
    }, 4000);
  };
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
    if (isAudioMuted) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.35, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      }
    } catch (e) {}
  };

  // Play gentle ping chime when customer adds item to cart
  const playCartSound = () => {
    if (isAudioMuted) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
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

  // Real-time listener for orders and cart activity across tabs and server SSE
  useEffect(() => {
    const handleCartActivity = (detail: any) => {
      if (!detail) return;
      playCartSound();
      const itemName = detail.item?.name || detail.itemName || 'वस्तू';
      const itemPrice = detail.item?.sellingPrice || detail.itemPrice || 0;

      const notif: AdminNotification = {
        id: `cart_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        type: 'cart_add',
        title: 'ग्राहकाने कार्टमध्ये वस्तू जोडली',
        subtitle: `${itemName} (किंमत: ₹${itemPrice.toLocaleString()})`,
        itemName,
        amount: itemPrice,
        timestamp: Date.now(),
        read: false,
      };

      setAdminNotifications((prev) => {
        const updated = [notif, ...prev.slice(0, 49)];
        try {
          localStorage.setItem('shri_sai_admin_notifications', JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });

      if (appMode === 'erp') {
        showToast(`🛒 ग्राहकाने कार्टमध्ये वस्तू जोडली: ${itemName}`, 'info');
      }
    };

    const handleOrderPlaced = (order: any, isFinanceEvent = false) => {
      if (!order) return;
      playOrderSound();

      const isFinance = isFinanceEvent || Boolean(order.financeDetails) || order.paymentMode?.includes('Finance');
      const totalAmt = Number(order.grandTotal ?? order.totalAmount ?? 0);
      const custName = order.customerName || 'ग्राहक';
      const custPhone = order.customerPhone || '';
      const schemeName = order.financeDetails?.schemeName;
      const providerName = order.financeDetails?.providerName;

      triggerBrowserNotification(
        isFinance ? `⚡ नवीन ०% फायनान्स अर्ज! ₹${totalAmt}` : `🛍️ नवीन ऑर्डर प्राप्त! ₹${totalAmt}`,
        `ग्राहक: ${custName} (${custPhone || 'Wardha'})${schemeName ? ` • ${schemeName}` : ''}`
      );

      setNewOrderAlert({
        customerName: custName,
        customerPhone: custPhone,
        totalAmount: totalAmt,
        invoiceNo: order.invoiceNo || `ORD-${Date.now().toString().slice(-4)}`,
        date: order.date || new Date().toLocaleDateString('en-IN'),
        itemsSummary: order.items ? order.items.map((i: any) => `${i.name} x${i.quantity}`).join(', ') : (order.itemDetails || ''),
        isFinance,
        providerName,
        schemeName,
        monthlyEmi: order.financeDetails?.monthlyEmi,
        downPayment: order.financeDetails?.downPayment,
      });

      const notif: AdminNotification = {
        id: `ord_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        type: isFinance ? 'finance_order_placed' : 'order_placed',
        title: isFinance ? '⚡ नवीन ०% फायनान्स अर्ज' : '🛍️ नवीन ग्राहक ऑनलाइन ऑर्डर',
        subtitle: `${custName} (${custPhone || 'वर्धा'})${schemeName ? ` • ${providerName || 'Bajaj'} (${schemeName})` : ' • COD/UPI'}`,
        amount: totalAmt,
        customerName: custName,
        customerPhone: custPhone,
        providerName,
        schemeName,
        timestamp: Date.now(),
        read: false,
      };

      setAdminNotifications((prev) => {
        const updated = [notif, ...prev.slice(0, 49)];
        try {
          localStorage.setItem('shri_sai_admin_notifications', JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });
    };

    // 1. Local window listeners
    const onWindowOrder = (e: any) => handleOrderPlaced(e.detail);
    const onWindowCart = (e: any) => handleCartActivity(e.detail);
    window.addEventListener('shri_sai_order_placed', onWindowOrder);
    window.addEventListener('shri_sai_cart_updated', onWindowCart);

    // 2. BroadcastChannel for instant cross-tab sync
    let bc: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('shri_sai_realtime_channel');
        bc.onmessage = (event) => {
          const msg = event.data;
          if (!msg) return;
          if (msg.type === 'cart_add') {
            handleCartActivity(msg);
          } else if (msg.type === 'order_placed' || msg.type === 'finance_order_placed') {
            handleOrderPlaced(msg.order, msg.type === 'finance_order_placed');
          }
        };
      }
    } catch (e) {}

    // 3. Real-Time Server-Sent Events (SSE) connection to /api/realtime/events
    let eventSource: EventSource | null = null;
    let pollInterval: any = null;
    let lastKnownEventId = '';

    try {
      if (typeof EventSource !== 'undefined') {
        eventSource = new EventSource('/api/realtime/events');
        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data && data.id && data.id !== lastKnownEventId) {
              lastKnownEventId = data.id;
              if (data.type === 'cart_activity') {
                handleCartActivity(data.data || data.order);
              } else if (data.type === 'order_placed' || data.type === 'finance_order_placed') {
                handleOrderPlaced(data.data || data.order, data.type === 'finance_order_placed');
              }
            }
          } catch (err) {
            // Ignore parse errors on heartbeat
          }
        };

        eventSource.onerror = () => {
          // SSE reconnects automatically
        };
      }
    } catch (e) {
      console.warn('SSE not supported or failed to initialize, relying on polling', e);
    }

    // 4. Fallback polling every 8 seconds for multi-device sync
    pollInterval = setInterval(async () => {
      try {
        const res = await fetch('/api/realtime/recent-orders');
        if (res.ok) {
          const result = await res.json();
          const events = result.events || (Array.isArray(result) ? result : []);
          if (Array.isArray(events) && events.length > 0) {
            const latest = events[0];
            const evtId = latest.id || `${latest.type}-${latest.timestamp}`;
            if (lastKnownEventId && evtId !== lastKnownEventId) {
              lastKnownEventId = evtId;
              if (latest.type === 'cart_activity') {
                handleCartActivity(latest.data || latest.order);
              } else if (latest.type === 'order_placed' || latest.type === 'finance_order_placed') {
                handleOrderPlaced(latest.data || latest.order, latest.type === 'finance_order_placed');
              }
            } else if (!lastKnownEventId) {
              lastKnownEventId = evtId;
            }
          }
        }
      } catch (err) {
        // Network offline or endpoint unavailable
      }
    }, 8000);

    return () => {
      window.removeEventListener('shri_sai_order_placed', onWindowOrder);
      window.removeEventListener('shri_sai_cart_updated', onWindowCart);
      if (bc) bc.close();
      if (eventSource) eventSource.close();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [appMode, isAudioMuted]);

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
    showToast(
      '✓ सर्व जुना डेटा (बिले, कार्ड्स, ग्राहक व पावत्या) 100% पूर्णपणे क्लिअर झाला आहे! आता सिस्टीम पूर्ण स्वच्छ झाली आहे.',
      'success'
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
    showToast('✓ सर्व कार्ड्स व योजना डेटा (Card Scheme Data) 100% पूर्णपणे क्लिअर झाला आहे!', 'success');
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
    showToast('✓ सर्व सेल्स बिले व ग्राहक यादी (Sales Bills Data) 100% पूर्णपणे क्लिअर झाली आहेत!', 'success');
  };

  const handleClearZeroBills = () => {
    const filteredTransactions = (db.transactions || []).filter((t) => 
      (t.totalAmount || 0) > 0 || t.entryType === 'Receipt' || (t.payingNow || 0) > 0
    );
    const updatedDb = { ...db, transactions: filteredTransactions };
    setDb(updatedDb);
    saveDatabase(updatedDb);
    syncDatabaseToCloud(updatedDb, setCloudStatus, true, true);
    showToast('✓ सर्व ₹0 ची चुकीची बिले यशस्वीपणे काढून टाकली आहेत!', 'success');
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
              purchases: isAllRecentlyCleared ? [] : (remoteData.purchases !== undefined ? remoteData.purchases : (prev.purchases || [])),
              dealers: isAllRecentlyCleared ? [] : (remoteData.dealers !== undefined ? remoteData.dealers : (prev.dealers || [])),
              dealerPayments: isAllRecentlyCleared ? [] : (remoteData.dealerPayments !== undefined ? remoteData.dealerPayments : (prev.dealerPayments || [])),
              cardMembers: mergedCardMembers,
              cardTransactions: mergedCardTransactions,
              staff: isAllRecentlyCleared ? [] : (remoteData.staff !== undefined ? remoteData.staff : (prev.staff || [])),
              expenses: isAllRecentlyCleared ? [] : (remoteData.expenses !== undefined ? remoteData.expenses : (prev.expenses || [])),
              agentAdvances: isAllRecentlyCleared ? [] : (remoteData.agentAdvances !== undefined ? remoteData.agentAdvances : (prev.agentAdvances || [])),
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

  // Instant Real-Time sync trigger when returning to mobile browser or PC tab
  useEffect(() => {
    const handleSyncCheckOnActive = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        handleManualCloudSync();
      }
    };
    window.addEventListener('visibilitychange', handleSyncCheckOnActive);
    window.addEventListener('online', handleSyncCheckOnActive);
    return () => {
      window.removeEventListener('visibilitychange', handleSyncCheckOnActive);
      window.removeEventListener('online', handleSyncCheckOnActive);
    };
  }, [db]);

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

      // 2. Auto deduct stock if stock item(s) were linked
      let updatedStock = prev.stock;
      if (entryData.lineItems && entryData.lineItems.length > 0) {
        const deductions = new Map<string, number>();
        entryData.lineItems.forEach((li) => {
          if (li.stockItemId && li.qty) {
            deductions.set(li.stockItemId, (deductions.get(li.stockItemId) || 0) + Number(li.qty));
          }
        });
        if (deductions.size > 0) {
          updatedStock = prev.stock.map((item) => {
            const deductQty = deductions.get(item.id);
            if (deductQty) {
              const soldSerials = entryData.lineItems
                ?.filter((li) => li.stockItemId === item.id && li.serialNo)
                .map((li) => li.serialNo!.trim().toLowerCase()) || [];
              const remainingSerials = item.serialNumbers
                ? item.serialNumbers.filter((s) => !soldSerials.includes(s.trim().toLowerCase()))
                : undefined;
              return {
                ...item,
                quantity: Math.max(0, item.quantity - deductQty),
                serialNumbers: remainingSerials,
              };
            }
            return item;
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

  // Handler: Update customer (e.g. edit khata, adjust opening balance)
  const handleUpdateCustomer = (updatedCust: Customer) => {
    setDb((prev) => {
      const updated = {
        ...prev,
        customers: (prev.customers || []).map((c) => (c.id === updatedCust.id ? updatedCust : c)),
      };
      saveDatabase(updated);
      syncDatabaseToCloud(updated, setCloudStatus, true, false);
      return updated;
    });
    showToast(`✓ ग्राहक खाते यशस्वीरित्या अद्ययावत केले: ${updatedCust.name}`, 'success');
  };

  // Handler: Settle payment from customer (with Part Payment against Bill & Manual Receipt No support)
  const handleSettlePayment = (
    customerId: string,
    amount: number,
    mode: 'Cash' | 'Online',
    notes: string,
    customReceiptNo?: string,
    refBillNo?: string,
    customDate?: string
  ) => {
    setDb((prev) => {
      let customerName = '';
      let customerPhone = '';
      let customerVillage = '';
      const updatedCustomers = prev.customers.map((c) => {
        if (c.id === customerId) {
          customerName = c.name;
          customerPhone = c.phone;
          customerVillage = c.village || '';
          const newDue = Math.max(0, c.balanceDue - amount);
          return {
            ...c,
            totalPaid: (c.totalPaid || 0) + amount,
            balanceDue: newDue,
            lastVisit: customDate || new Date().toISOString().split('T')[0],
          };
        }
        return c;
      });

      const finalReceiptNo = customReceiptNo?.trim() || `SSE/RCPT-${Date.now().toString().slice(-4)}`;
      const finalDate = customDate || new Date().toISOString().split('T')[0];

      // If payment is made against a specific bill, adjust that bill's remaining dueAmount
      let updatedTransactions = prev.transactions || [];
      if (refBillNo) {
        const cleanRef = refBillNo.trim().toLowerCase();
        updatedTransactions = updatedTransactions.map((t) => {
          if (t.invoiceNo.trim().toLowerCase() === cleanRef) {
            const currentDue = t.dueAmount !== undefined ? t.dueAmount : Math.max(0, t.totalAmount - (t.payingNow || 0));
            const newDue = Math.max(0, currentDue - amount);
            const newPaid = (t.payingNow || 0) + amount;
            return {
              ...t,
              dueAmount: newDue,
              payingNow: newPaid,
            };
          }
          return t;
        });
      }

      // Record as formal Receipt entry in transaction ledger
      const paymentReceipt: TransactionEntry = {
        id: `tx-settle-${Date.now()}`,
        invoiceNo: finalReceiptNo,
        entryType: 'Receipt',
        date: finalDate,
        customerName,
        customerPhone,
        customerId,
        village: customerVillage,
        itemDetails: refBillNo
          ? `उधारी जमा पावती (संदर्भ बिल #${refBillNo}) - ${notes || 'पार्ट पेमेंट'}`
          : `उधारी जमा पावती (${notes || 'हिशोबात जमा'})`,
        totalAmount: 0,
        payingNow: amount,
        dueAmount: 0,
        paymentMode: mode,
        refBillNo: refBillNo?.trim() || undefined,
        againstBillNo: refBillNo?.trim() || undefined,
        notes: `उधारी हिशोबात जमा. ${refBillNo ? `संदर्भ बिल: #${refBillNo}. ` : ''}${notes || ''}`.trim(),
        createdAt: new Date().toISOString(),
      };

      const nextDb = {
        ...prev,
        customers: updatedCustomers,
        transactions: [paymentReceipt, ...updatedTransactions],
      };

      // Real-time instant cloud sync across Web, .exe and Mobile
      syncDatabaseToCloud(nextDb, setCloudStatus, true);

      return nextDb;
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

      // Sync stock items with purchased goods, models, and serial numbers
      let updatedStock = [...(prev.stock || [])];
      if (purchaseData.lineItems && purchaseData.lineItems.length > 0) {
        purchaseData.lineItems.forEach((li) => {
          const itemModel = li.modelNo?.trim();
          const itemName = li.description?.trim();
          const itemSerials = li.serialNumbers || [];
          const qty = Math.max(1, Number(li.quantity) || 1);
          const rate = Math.max(0, Number(li.rate) || 0);

          const existingIdx = updatedStock.findIndex((st) =>
            (itemModel && st.modelNo && st.modelNo.toLowerCase() === itemModel.toLowerCase()) ||
            (itemName && st.name.toLowerCase() === itemName.toLowerCase())
          );

          if (existingIdx !== -1) {
            const current = updatedStock[existingIdx];
            const mergedSerials = Array.from(new Set([...(current.serialNumbers || []), ...itemSerials]));
            updatedStock[existingIdx] = {
              ...current,
              quantity: current.quantity + qty,
              purchasePrice: rate > 0 ? rate : current.purchasePrice,
              modelNo: itemModel || current.modelNo,
              hsnCode: li.hsn || current.hsnCode,
              serialNumbers: mergedSerials,
            };
          } else {
            updatedStock.unshift({
              id: `stk-${Date.now()}-${Math.random().toString().slice(2, 6)}`,
              name: itemName || `Product ${itemModel || 'Item'}`,
              code: itemModel ? `MOD-${itemModel}` : `STK-${Date.now().toString().slice(-4)}`,
              modelNo: itemModel,
              category: 'इलेक्ट्रॉनिक्स & घरगुती उपकरणे',
              quantity: qty,
              unit: 'नग',
              purchasePrice: rate,
              sellingPrice: Math.round(rate * 1.15),
              minStockLevel: 2,
              hsnCode: li.hsn || '84182100',
              serialNumbers: itemSerials,
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
      // 1. Merge transactions with deduplication using Map
      const txMap = new Map<string, TransactionEntry>();
      (prev.transactions || []).forEach((t) => {
        const key = t.invoiceNo ? `inv-${t.invoiceNo.trim().toUpperCase()}` : t.id;
        txMap.set(key, t);
      });
      newBills.forEach((b) => {
        const key = b.invoiceNo ? `inv-${b.invoiceNo.trim().toUpperCase()}` : b.id;
        txMap.set(key, b);
      });

      // 2. Also register or update customer records for Khata ledger using Map
      const custMap = new Map<string, Customer>();
      const phoneToKey = new Map<string, string>();
      (prev.customers || []).forEach((c) => {
        const nameKey = c.name.toLowerCase().trim();
        custMap.set(nameKey, { ...c });
        if (c.phone) {
          phoneToKey.set(c.phone.replace(/[^0-9]/g, ''), nameKey);
        }
      });

      newBills.forEach((b) => {
        if (!b.customerName || b.customerName === 'Customer') return;
        const nameKey = b.customerName.toLowerCase().trim();
        const rawPhone = b.customerPhone ? b.customerPhone.replace(/[^0-9]/g, '') : '';
        const matchedKey = custMap.has(nameKey) ? nameKey : (rawPhone ? phoneToKey.get(rawPhone) : undefined);

        const isReceipt =
          b.entryType === 'Receipt' ||
          b.invoiceNo.startsWith('SSE/RCPT') ||
          b.invoiceNo.includes('RCPT') ||
          (b.totalAmount === 0 && b.payingNow > 0);

        if (matchedKey && custMap.has(matchedKey)) {
          const existing = custMap.get(matchedKey)!;
          existing.totalPurchases = (existing.totalPurchases || 0) + b.totalAmount;
          existing.totalPurchased = existing.totalPurchases;
          existing.totalPaid += b.payingNow;
          if (isReceipt) {
            existing.balanceDue = Math.max(0, existing.balanceDue - b.payingNow);
          } else {
            existing.balanceDue += b.dueAmount;
          }
          if (b.date) existing.lastTransactionDate = b.date;
        } else {
          const newCust: Customer = {
            id: `cust-${nameKey.replace(/[^a-z0-9]/g, '-') || Date.now()}`,
            name: b.customerName,
            phone: b.customerPhone || '',
            totalPurchased: b.totalAmount,
            totalPurchases: b.totalAmount,
            totalPaid: b.payingNow,
            balanceDue: isReceipt ? 0 : b.dueAmount,
            lastTransactionDate: b.date,
          };
          custMap.set(nameKey, newCust);
          if (rawPhone) phoneToKey.set(rawPhone, nameKey);
        }
      });

      // 3. Auto-register any new products into stock using Map
      const stockMap = new Map<string, StockItem>();
      (prev.stock || []).forEach((s) => {
        stockMap.set(s.name.trim().toLowerCase(), { ...s });
      });

      newBills.forEach((b) => {
        if (b.stockItemName && b.stockItemName.trim().length > 1) {
          const sName = b.stockItemName.trim();
          const sKey = sName.toLowerCase();
          if (!stockMap.has(sKey)) {
            stockMap.set(sKey, {
              id: `stk-b-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              name: sName,
              code: `PRD-${(stockMap.size + 1).toString().padStart(3, '0')}`,
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
        transactions: Array.from(txMap.values()),
        customers: Array.from(custMap.values()),
        stock: deduplicateStock(Array.from(stockMap.values())),
      };
    });
  };

  // Helper to re-balance and reconcile all customer ledgers from raw transactions in linear O(N + M) time
  const handleRecalculateCustomerLedgers = () => {
    setDb((prev) => {
      const allTx = prev.transactions || [];
      // Build index of transactions by customer name and phone
      const txByName = new Map<string, TransactionEntry[]>();
      const txByPhone = new Map<string, TransactionEntry[]>();

      allTx.forEach((t) => {
        if (t.customerName) {
          const nameKey = t.customerName.toLowerCase().trim();
          if (!txByName.has(nameKey)) txByName.set(nameKey, []);
          txByName.get(nameKey)!.push(t);
        }
        if (t.customerPhone) {
          const phoneKey = t.customerPhone.replace(/[^0-9]/g, '');
          if (phoneKey) {
            if (!txByPhone.has(phoneKey)) txByPhone.set(phoneKey, []);
            txByPhone.get(phoneKey)!.push(t);
          }
        }
      });

      const updatedCustomers = (prev.customers || []).map((c) => {
        const cName = c.name.toLowerCase().trim();
        const cPhone = c.phone ? c.phone.replace(/[^0-9]/g, '') : '';
        const nameTxs = txByName.get(cName) || [];
        const phoneTxs = cPhone ? (txByPhone.get(cPhone) || []) : [];
        const combinedSet = new Set<TransactionEntry>([...nameTxs, ...phoneTxs]);

        if (combinedSet.size === 0) return c;

        let totalPurchased = 0;
        let totalPaid = 0;
        let hasRealBills = false;

        combinedSet.forEach((t) => {
          const isReceipt =
            t.entryType === 'Receipt' ||
            t.invoiceNo.startsWith('SSE/RCPT') ||
            t.invoiceNo.includes('RCPT') ||
            (t.totalAmount === 0 && t.payingNow > 0);

          if (isReceipt) {
            totalPaid += t.payingNow;
          } else {
            hasRealBills = true;
            totalPurchased += t.totalAmount;
            totalPaid += t.payingNow;
          }
        });

        // Respect explicit opening khata balance if customer had one
        const explicitOpening = c.openingBalance || 0;
        const basePurchased = hasRealBills ? explicitOpening : (c.totalPurchased || c.totalPurchases || c.balanceDue || 0);
        const finalPurchased = basePurchased + totalPurchased;
        let balanceDue = Math.max(0, finalPurchased - totalPaid);
        if (!hasRealBills && c.balanceDue > 0) {
          balanceDue = totalPaid > 0 ? Math.max(0, c.balanceDue - totalPaid) : c.balanceDue;
        }

        return {
          ...c,
          totalPurchased: finalPurchased,
          totalPurchases: finalPurchased,
          totalPaid,
          balanceDue,
          openingBalance: explicitOpening,
        };
      });

      const updatedDb = { ...prev, customers: updatedCustomers };
      saveDatabase(updatedDb);
      syncDatabaseToCloud(updatedDb, setCloudStatus, true, false);
      return updatedDb;
    });
    showToast('✓ सर्व ग्राहकांची खाती बिले व जमा पावत्यांनुसार अचूक जुळवली गेली!', 'success');
  };

  // Merge duplicate customer accounts into a single reconciled master account
  const handleMergeCustomers = (
    primaryId: string,
    duplicateId: string,
    mergedData: {
      name: string;
      phone: string;
      village?: string;
      address?: string;
    }
  ) => {
    setDb((prev) => {
      const custA = prev.customers.find((c) => c.id === primaryId);
      const custB = prev.customers.find((c) => c.id === duplicateId);
      if (!custA || !custB) return prev;

      const totalPurchasedA = Number(custA.totalPurchased || custA.totalPurchases) || 0;
      const totalPaidA = Number(custA.totalPaid) || 0;
      const totalPurchasedB = Number(custB.totalPurchased || custB.totalPurchases) || 0;
      const totalPaidB = Number(custB.totalPaid) || 0;

      const combinedPurchased = totalPurchasedA + totalPurchasedB;
      const combinedPaid = totalPaidA + totalPaidB;
      const combinedBalance = Math.max(0, combinedPurchased - combinedPaid);

      const mergedCustomer: Customer = {
        ...custA,
        name: mergedData.name,
        phone: mergedData.phone,
        village: mergedData.village || custA.village || custB.village,
        address: mergedData.address || custA.address || custB.address,
        totalPurchased: combinedPurchased,
        totalPurchases: combinedPurchased,
        totalPaid: combinedPaid,
        balanceDue: combinedBalance,
        lastVisit:
          (custA.lastVisit || '') > (custB.lastVisit || '')
            ? custA.lastVisit
            : custB.lastVisit || new Date().toISOString().split('T')[0],
      };

      // 1. Update customers list: remove custB, update custA
      const updatedCustomers = prev.customers
        .filter((c) => c.id !== duplicateId)
        .map((c) => (c.id === primaryId ? mergedCustomer : c));

      // 2. Re-point transactions
      const updatedTransactions = (prev.transactions || []).map((t) => {
        if (
          t.customerId === duplicateId ||
          (t.customerName && t.customerName.toLowerCase().trim() === custB.name.toLowerCase().trim())
        ) {
          return {
            ...t,
            customerId: primaryId,
            customerName: mergedData.name,
            customerPhone: mergedData.phone || t.customerPhone,
            village: mergedData.village || t.village,
          };
        }
        if (
          t.customerId === primaryId ||
          (t.customerName && t.customerName.toLowerCase().trim() === custA.name.toLowerCase().trim())
        ) {
          return {
            ...t,
            customerName: mergedData.name,
            customerPhone: mergedData.phone || t.customerPhone,
            village: mergedData.village || t.village,
          };
        }
        return t;
      });

      // 3. Re-point card members
      const updatedCardMembers = (prev.cardMembers || []).map((m) => {
        if (
          m.customerName &&
          (m.customerName.toLowerCase().trim() === custB.name.toLowerCase().trim() ||
            m.customerName.toLowerCase().trim() === custA.name.toLowerCase().trim())
        ) {
          return {
            ...m,
            customerName: mergedData.name,
            phone: mergedData.phone || m.phone,
            village: mergedData.village || m.village,
          };
        }
        return m;
      });

      const nextDb = {
        ...prev,
        customers: updatedCustomers,
        transactions: updatedTransactions,
        cardMembers: updatedCardMembers,
      };

      saveDatabase(nextDb);
      syncDatabaseToCloud(nextDb, setCloudStatus, true, true);

      return nextDb;
    });
  };

  // Batch merge multiple pairs of duplicate customers in a single atomic transaction
  const handleBatchMergeCustomers = (
    merges: Array<{
      primaryId: string;
      duplicateId: string;
      mergedData: {
        name: string;
        phone: string;
        village?: string;
        address?: string;
      };
    }>
  ) => {
    if (!merges || merges.length === 0) return 0;
    let mergedCount = 0;

    setDb((prev) => {
      let currentCustomers = [...(prev.customers || [])];
      let currentTransactions = [...(prev.transactions || [])];
      let currentCardMembers = [...(prev.cardMembers || [])];

      const redirectIdMap = new Map<string, string>();
      const nameRedirectMap = new Map<string, { newName: string; newPhone: string; newVillage?: string }>();

      merges.forEach(({ primaryId, duplicateId, mergedData }) => {
        let finalPrimaryId = primaryId;
        while (redirectIdMap.has(finalPrimaryId)) {
          finalPrimaryId = redirectIdMap.get(finalPrimaryId)!;
        }
        redirectIdMap.set(duplicateId, finalPrimaryId);

        const custAIndex = currentCustomers.findIndex((c) => c.id === finalPrimaryId);
        const custBIndex = currentCustomers.findIndex((c) => c.id === duplicateId);

        if (custAIndex !== -1 && custBIndex !== -1) {
          const custA = currentCustomers[custAIndex];
          const custB = currentCustomers[custBIndex];

          nameRedirectMap.set(custB.name.toLowerCase().trim(), {
            newName: mergedData.name,
            newPhone: mergedData.phone || custA.phone || custB.phone || '',
            newVillage: mergedData.village || custA.village || custB.village || '',
          });

          const totalPurchasedA = Number(custA.totalPurchased || custA.totalPurchases) || 0;
          const totalPaidA = Number(custA.totalPaid) || 0;
          const totalPurchasedB = Number(custB.totalPurchased || custB.totalPurchases) || 0;
          const totalPaidB = Number(custB.totalPaid) || 0;

          const combinedPurchased = totalPurchasedA + totalPurchasedB;
          const combinedPaid = totalPaidA + totalPaidB;
          const combinedBalance = Math.max(0, combinedPurchased - combinedPaid);

          const mergedCustomer: Customer = {
            ...custA,
            name: mergedData.name,
            phone: mergedData.phone || custA.phone || custB.phone || '',
            village: mergedData.village || custA.village || custB.village || '',
            address: mergedData.address || custA.address || custB.address || '',
            totalPurchased: combinedPurchased,
            totalPurchases: combinedPurchased,
            totalPaid: combinedPaid,
            balanceDue: combinedBalance,
            lastVisit:
              (custA.lastVisit || '') > (custB.lastVisit || '')
                ? custA.lastVisit
                : custB.lastVisit || new Date().toISOString().split('T')[0],
          };

          currentCustomers[custAIndex] = mergedCustomer;
          currentCustomers = currentCustomers.filter((c) => c.id !== duplicateId);
          mergedCount++;
        }
      });

      // Update transactions pointing to merged accounts
      currentTransactions = currentTransactions.map((t) => {
        const redirectedCustId = t.customerId ? redirectIdMap.get(t.customerId) : undefined;
        const normName = t.customerName ? t.customerName.toLowerCase().trim() : '';
        const nameInfo = nameRedirectMap.get(normName);

        if (redirectedCustId || nameInfo) {
          return {
            ...t,
            customerId: redirectedCustId || t.customerId,
            customerName: nameInfo?.newName || t.customerName,
            customerPhone: nameInfo?.newPhone || t.customerPhone,
            village: nameInfo?.newVillage || t.village,
          };
        }
        return t;
      });

      // Update card members pointing to merged accounts
      currentCardMembers = currentCardMembers.map((m) => {
        const normName = m.customerName ? m.customerName.toLowerCase().trim() : '';
        const nameInfo = nameRedirectMap.get(normName);
        if (nameInfo) {
          return {
            ...m,
            customerName: nameInfo.newName,
            phone: nameInfo.newPhone || m.phone,
            village: nameInfo.newVillage || m.village,
          };
        }
        return m;
      });

      const nextDb = {
        ...prev,
        customers: currentCustomers,
        transactions: currentTransactions,
        cardMembers: currentCardMembers,
      };

      saveDatabase(nextDb);
      syncDatabaseToCloud(nextDb, setCloudStatus, true, true);
      return nextDb;
    });

    return mergedCount;
  };

  // Auto-Fix All Calculation Discrepancies (Bill arithmetic + Customer ledger balances)
  const handleAutoFixCalculations = () => {
    let fixedBills = 0;
    let fixedCustomers = 0;

    setDb((prev) => {
      // 1. Fix calculation mistakes in bills (dueAmount = totalAmount - payingNow)
      const updatedTransactions = (prev.transactions || []).map((t) => {
        const isReceipt =
          t.entryType === 'Receipt' ||
          t.invoiceNo.startsWith('SSE/RCPT') ||
          t.invoiceNo.includes('RCPT') ||
          (t.totalAmount === 0 && t.payingNow > 0);

        if (!isReceipt && t.totalAmount > 0) {
          const expectedDue = Math.max(0, t.totalAmount - (t.payingNow || 0));
          if (Math.abs((t.dueAmount || 0) - expectedDue) > 0.5) {
            fixedBills++;
            return {
              ...t,
              dueAmount: expectedDue,
            };
          }
        }
        return t;
      });

      // 2. Build index of transactions by customer ID, name, and phone
      const txByName = new Map<string, TransactionEntry[]>();
      const txByPhone = new Map<string, TransactionEntry[]>();
      const txById = new Map<string, TransactionEntry[]>();

      updatedTransactions.forEach((t) => {
        if (t.customerId) {
          if (!txById.has(t.customerId)) txById.set(t.customerId, []);
          txById.get(t.customerId)!.push(t);
        }
        if (t.customerName) {
          const nameKey = t.customerName.toLowerCase().trim();
          if (!txByName.has(nameKey)) txByName.set(nameKey, []);
          txByName.get(nameKey)!.push(t);
        }
        if (t.customerPhone) {
          const phoneKey = t.customerPhone.replace(/[^0-9]/g, '');
          if (phoneKey && phoneKey.length >= 6) {
            if (!txByPhone.has(phoneKey)) txByPhone.set(phoneKey, []);
            txByPhone.get(phoneKey)!.push(t);
          }
        }
      });

      // 3. Recalculate each customer's balanceDue and totals
      const updatedCustomers = (prev.customers || []).map((c) => {
        const cName = c.name.toLowerCase().trim();
        const cPhone = c.phone ? c.phone.replace(/[^0-9]/g, '') : '';

        const idTxs = txById.get(c.id) || [];
        const nameTxs = txByName.get(cName) || [];
        const phoneTxs = cPhone && cPhone.length >= 6 ? (txByPhone.get(cPhone) || []) : [];
        const combinedSet = new Set<TransactionEntry>([...idTxs, ...nameTxs, ...phoneTxs]);

        let calculatedPurchased = 0;
        let calculatedPaid = 0;

        if (combinedSet.size > 0) {
          combinedSet.forEach((t) => {
            const isReceipt =
              t.entryType === 'Receipt' ||
              t.invoiceNo.startsWith('SSE/RCPT') ||
              t.invoiceNo.includes('RCPT') ||
              (t.totalAmount === 0 && t.payingNow > 0);

            if (isReceipt) {
              calculatedPaid += Number(t.payingNow) || 0;
            } else {
              calculatedPurchased += Number(t.totalAmount) || 0;
              calculatedPaid += Number(t.payingNow) || 0;
            }
          });
        } else {
          calculatedPurchased = Number(c.totalPurchases || c.totalPurchased) || 0;
          calculatedPaid = Number(c.totalPaid) || 0;
        }

        const calculatedBalance = Math.max(0, calculatedPurchased - calculatedPaid);
        const storedBalance = Number(c.balanceDue) || 0;

        if (
          Math.abs(storedBalance - calculatedBalance) > 0.5 ||
          Math.abs(Number(c.totalPurchases || 0) - calculatedPurchased) > 0.5 ||
          Math.abs(Number(c.totalPaid || 0) - calculatedPaid) > 0.5
        ) {
          fixedCustomers++;
        }

        return {
          ...c,
          totalPurchased: calculatedPurchased,
          totalPurchases: calculatedPurchased,
          totalPaid: calculatedPaid,
          balanceDue: calculatedBalance,
        };
      });

      const nextDb = {
        ...prev,
        transactions: updatedTransactions,
        customers: updatedCustomers,
      };

      saveDatabase(nextDb);
      syncDatabaseToCloud(nextDb, setCloudStatus, true, true);
      return nextDb;
    });

    return { fixedBills, fixedCustomers };
  };

  // Auto-Clean '0' and invalid phone numbers
  const handleAutoCleanPhones = () => {
    let cleanedCount = 0;
    setDb((prev) => {
      const updatedCustomers = (prev.customers || []).map((c) => {
        const p = (c.phone || '').trim();
        if (p === '0' || p === '0000000000' || p === '--' || p === 'null' || p === 'undefined') {
          cleanedCount++;
          return { ...c, phone: '' };
        }
        return c;
      });

      const nextDb = { ...prev, customers: updatedCustomers };
      saveDatabase(nextDb);
      syncDatabaseToCloud(nextDb, setCloudStatus, true, true);
      return nextDb;
    });
    return cleanedCount;
  };

  // Auto-Fill missing customer addresses from matching transactions
  const handleAutoFillAddresses = () => {
    let filledCount = 0;
    setDb((prev) => {
      // Build lookup of customerName -> village from transactions and card members
      const villageByName = new Map<string, string>();
      (prev.transactions || []).forEach((t) => {
        if (t.customerName && t.village && t.village.trim() && t.village !== '0') {
          villageByName.set(t.customerName.toLowerCase().trim(), t.village.trim());
        }
      });
      (prev.cardMembers || []).forEach((m) => {
        if (m.customerName && m.village && m.village.trim() && m.village !== '0') {
          villageByName.set(m.customerName.toLowerCase().trim(), m.village.trim());
        }
      });

      const updatedCustomers = (prev.customers || []).map((c) => {
        if (!c.village && !c.address) {
          const foundVillage = villageByName.get(c.name.toLowerCase().trim());
          if (foundVillage) {
            filledCount++;
            return {
              ...c,
              village: foundVillage,
              address: foundVillage,
            };
          }
        }
        return c;
      });

      const nextDb = { ...prev, customers: updatedCustomers };
      saveDatabase(nextDb);
      syncDatabaseToCloud(nextDb, setCloudStatus, true, true);
      return nextDb;
    });
    return filledCount;
  };

  const handleImportReceipts = (newReceipts: CardTransaction[]) => {
    setDb((prev) => {
      // Fast O(1) Map for card members
      const memberMap = new Map<string, CardMember>();
      (prev.cardMembers || []).forEach((m) => {
        memberMap.set(`${m.schemeId}-${m.cardNumber}`, { ...m });
      });

      newReceipts.forEach((rcpt) => {
        const key = `${rcpt.schemeId}-${rcpt.cardNumber}`;
        const member = memberMap.get(key);
        if (member) {
          member.totalDeposited += rcpt.amount;
          member.netBalance = Math.max(0, member.totalDeposited - member.totalRefunded);
        }
      });

      return {
        ...prev,
        cardTransactions: [...newReceipts, ...(prev.cardTransactions || [])],
        cardMembers: Array.from(memberMap.values()),
      };
    });
  };

  const handleImportCardMembers = (newCards: CardMember[], autoReceipts?: CardTransaction[]) => {
    setDb((prev) => {
      const memberMap = new Map<string, CardMember>();
      (prev.cardMembers || []).forEach((m) => {
        memberMap.set(`${m.schemeId}-${m.cardNumber}`, m);
      });
      newCards.forEach((nm) => {
        memberMap.set(`${nm.schemeId}-${nm.cardNumber}`, nm);
      });

      const updatedReceipts = autoReceipts && autoReceipts.length > 0
        ? [...autoReceipts, ...(prev.cardTransactions || [])]
        : (prev.cardTransactions || []);

      return {
        ...prev,
        cardMembers: Array.from(memberMap.values()),
        cardTransactions: updatedReceipts,
      };
    });
  };

  const handleImportPurchases = (newPurchases: PurchaseEntry[], importedDealers: Dealer[]) => {
    setDb((prev) => {
      // Merge dealers using Map
      const dealerMap = new Map<string, Dealer>();
      (prev.dealers || []).forEach((cd) => {
        dealerMap.set(cd.name.toLowerCase().trim(), { ...cd });
      });

      importedDealers.forEach((idlr) => {
        const key = idlr.name.toLowerCase().trim();
        const existing = dealerMap.get(key);
        if (existing) {
          existing.totalPurchases += idlr.totalPurchases;
          existing.totalPaid += idlr.totalPaid;
          existing.balanceDue = Math.max(0, existing.totalPurchases - existing.totalPaid);
        } else {
          dealerMap.set(key, { ...idlr });
        }
      });

      return {
        ...prev,
        purchases: [...newPurchases, ...prev.purchases],
        dealers: Array.from(dealerMap.values()),
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
    purchases?: PurchaseEntry[];
    dealers?: Dealer[];
  }) => {
    setDb((prev) => {
      // 1. Merge transactions & receipts with deduplication in O(N)
      const txMap = new Map<string, TransactionEntry>();
      (prev.transactions || []).forEach((t) => {
        const pfx = t.entryType === 'Receipt' ? 'rcpt' : 'bill';
        const key = t.invoiceNo ? `${pfx}-${t.invoiceNo.trim().toUpperCase()}` : t.id;
        txMap.set(key, t);
      });
      (data.bills || []).forEach((b) => {
        const pfx = b.entryType === 'Receipt' ? 'rcpt' : 'bill';
        const key = b.invoiceNo ? `${pfx}-${b.invoiceNo.trim().toUpperCase()}` : b.id;
        txMap.set(key, b);
      });
      (data.salesReceipts || []).forEach((r) => {
        const key = r.invoiceNo ? `rcpt-${r.invoiceNo.trim().toUpperCase()}` : r.id;
        txMap.set(key, r);

        // If receipt specifies againstBillNo / refBillNo, update that bill's payingNow and dueAmount
        const ref = (r.againstBillNo || r.refBillNo || '').trim().toUpperCase();
        if (ref) {
          const targetBill = txMap.get(`bill-${ref}`) || Array.from(txMap.values()).find((t) => t.invoiceNo && t.invoiceNo.trim().toUpperCase() === ref);
          if (targetBill) {
            targetBill.payingNow = (targetBill.payingNow || 0) + (r.payingNow || 0);
            targetBill.dueAmount = Math.max(0, (targetBill.totalAmount || 0) - targetBill.payingNow);
          }
        }
      });
      const currentBills = Array.from(txMap.values());

      // 2. Merge card members in O(N) using Map
      const memberMap = new Map<string, CardMember>();
      (prev.cardMembers || []).forEach((m) => {
        memberMap.set(`${m.schemeId}-${m.cardNumber}`, { ...m });
      });
      (data.cardMembers || []).forEach((nm) => {
        const key = `${nm.schemeId}-${nm.cardNumber}`;
        const existing = memberMap.get(key);
        if (existing) {
          memberMap.set(key, {
            ...existing,
            ...nm,
            totalDeposited: Math.max(existing.totalDeposited, nm.totalDeposited),
            netBalance: Math.max(existing.netBalance, nm.netBalance),
          });
        } else {
          memberMap.set(key, { ...nm });
        }
      });

      // 3. Deduplicate and merge card transactions in O(N)
      const cardTxMap = new Map<string, CardTransaction>();
      (prev.cardTransactions || []).forEach((ct) => cardTxMap.set(ct.id, ct));
      (data.cardTransactions || []).forEach((ct) => cardTxMap.set(ct.id, ct));
      const currentCardTx = Array.from(cardTxMap.values());

      // Pre-aggregate card transaction totals by member key in a single pass O(M)
      const memberTxTotals = new Map<string, { dep: number; ref: number }>();
      currentCardTx.forEach((t) => {
        const key = `${t.schemeId}-${t.cardNumber}`;
        let totals = memberTxTotals.get(key);
        if (!totals) {
          totals = { dep: 0, ref: 0 };
          memberTxTotals.set(key, totals);
        }
        if (t.type === 'WeeklyPayment') {
          totals.dep += t.amount;
        } else if (t.type === 'Refund') {
          totals.ref += t.amount;
        }
      });

      // Re-calculate card member balances in single O(K) loop
      memberMap.forEach((m, key) => {
        const totals = memberTxTotals.get(key);
        const opening = m.openingAmt || 0;
        const dep = opening + (totals ? totals.dep : 0);
        const ref = totals ? totals.ref : 0;
        m.totalDeposited = dep;
        m.totalRefunded = ref;
        m.netBalance = Math.max(0, dep - ref);
      });
      const currentMembers = Array.from(memberMap.values());

      // 4. Merge customers and preserve khata balances accurately
      const custMap = new Map<string, Customer>();
      (prev.customers || []).forEach((c) => {
        custMap.set(c.name.trim().toLowerCase(), { ...c });
      });

      (data.customers || []).forEach((nc) => {
        const key = nc.name.trim().toLowerCase();
        const existing = custMap.get(key);
        if (existing) {
          if (!existing.phone && nc.phone) existing.phone = nc.phone;
          if (!existing.address && nc.address) existing.address = nc.address;
          if (!existing.village && nc.village) existing.village = nc.village;
          if (nc.balanceDue && nc.balanceDue > 0) {
            existing.balanceDue = nc.balanceDue;
            existing.totalPurchased = Math.max(existing.totalPurchased || 0, nc.totalPurchased || nc.balanceDue);
            existing.totalPurchases = existing.totalPurchased;
            existing.totalPaid = Math.max(existing.totalPaid || 0, nc.totalPaid || 0);
          }
          if (nc.linkedCardNumber && !existing.linkedCardNumber) {
            existing.linkedCardNumber = nc.linkedCardNumber;
            existing.linkedSchemeId = nc.linkedSchemeId;
          }
        } else {
          custMap.set(key, { ...nc });
        }
      });

      // If new bills were imported in this file, accumulate them onto the customer accounts
      if (data.bills && data.bills.length > 0) {
        data.bills.forEach((b) => {
          if (!b.customerName) return;
          const key = b.customerName.trim().toLowerCase();
          let cust = custMap.get(key);
          if (!cust) {
            cust = {
              id: `cust-${key.replace(/[^a-z0-9]/g, '-')}`,
              name: b.customerName.trim(),
              phone: b.customerPhone || '',
              address: b.village ? `${b.village}, Wardha` : 'Wardha',
              village: b.village || undefined,
              totalPurchases: 0,
              totalPurchased: 0,
              totalPaid: 0,
              balanceDue: 0,
              lastVisit: b.date,
            };
            custMap.set(key, cust);
          }
          cust.totalPurchases = (cust.totalPurchases || 0) + (b.totalAmount || 0);
          cust.totalPurchased = cust.totalPurchases;
          cust.totalPaid = (cust.totalPaid || 0) + (b.payingNow || 0);
          cust.balanceDue = Math.max(0, cust.totalPurchases - cust.totalPaid);
          if (!cust.phone && b.customerPhone) cust.phone = b.customerPhone;
          if ((!cust.address || cust.address === 'Wardha') && b.village) cust.address = `${b.village}, Wardha`;
          if (b.date && (!cust.lastVisit || b.date > cust.lastVisit)) cust.lastVisit = b.date;
        });
      }

      // If sales receipts were imported in this file, credit them against customer dues
      if (data.salesReceipts && data.salesReceipts.length > 0) {
        data.salesReceipts.forEach((r) => {
          if (!r.customerName || !(r.payingNow > 0)) return;
          const key = r.customerName.trim().toLowerCase();
          const cust = custMap.get(key);
          if (cust) {
            cust.totalPaid = (cust.totalPaid || 0) + r.payingNow;
            cust.balanceDue = Math.max(0, (cust.totalPurchases || cust.totalPurchased || 0) - cust.totalPaid);
          }
        });
      }

      const currentCustomers = Array.from(custMap.values());

      // 5. Merge Stock / Inventory Items in O(Stock) using Map
      const stockMap = new Map<string, StockItem>();
      (prev.stock || []).forEach((s) => {
        stockMap.set(s.name.trim().toLowerCase(), { ...s });
      });

      const incomingStock = data.stockItems || [];
      incomingStock.forEach((ns) => {
        const key = ns.name.trim().toLowerCase();
        const existing = stockMap.get(key);
        if (existing) {
          if (ns.sellingPrice && ns.sellingPrice > 0 && (!existing.sellingPrice || existing.sellingPrice === 0)) {
            existing.sellingPrice = ns.sellingPrice;
          }
          if (ns.category && !existing.category) {
            existing.category = ns.category;
          }
        } else {
          stockMap.set(key, { ...ns });
        }
      });

      // Also ensure any individual bill with stockItemName gets auto-registered in stock
      data.bills.forEach((b) => {
        if (b.stockItemName && b.stockItemName.trim().length > 1) {
          const sName = b.stockItemName.trim();
          const sKey = sName.toLowerCase();
          if (!stockMap.has(sKey)) {
            stockMap.set(sKey, {
              id: `stk-bill-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              name: sName,
              code: `PRD-${(stockMap.size + 1).toString().padStart(3, '0')}`,
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

      // 6. Merge Purchases
      const purchaseMap = new Map<string, PurchaseEntry>();
      (prev.purchases || []).forEach((p) => {
        const key = p.billNo ? p.billNo.trim().toUpperCase() : p.id;
        purchaseMap.set(key, { ...p });
      });
      (data.purchases || []).forEach((p) => {
        const key = p.billNo ? p.billNo.trim().toUpperCase() : p.id;
        purchaseMap.set(key, { ...p });
      });
      const currentPurchases = Array.from(purchaseMap.values());

      // 7. Merge Dealers
      const dealerMap = new Map<string, Dealer>();
      (prev.dealers || []).forEach((d) => {
        dealerMap.set(d.name.trim().toLowerCase(), { ...d });
      });
      (data.dealers || []).forEach((nd) => {
        const key = nd.name.trim().toLowerCase();
        const existing = dealerMap.get(key);
        if (existing) {
          existing.totalPurchases = Math.max(existing.totalPurchases || 0, nd.totalPurchases || 0);
          existing.totalPaid = Math.max(existing.totalPaid || 0, nd.totalPaid || 0);
          existing.balanceDue = Math.max(0, existing.totalPurchases - existing.totalPaid);
          if (!existing.phone && nd.phone) existing.phone = nd.phone;
          if (!existing.gstin && nd.gstin) existing.gstin = nd.gstin;
          if (!existing.address && nd.address) existing.address = nd.address;
        } else {
          dealerMap.set(key, { ...nd });
        }
      });
      const currentDealers = Array.from(dealerMap.values());

      return {
        ...prev,
        transactions: currentBills,
        customers: currentCustomers,
        cardMembers: currentMembers,
        cardTransactions: currentCardTx,
        stock: deduplicateStock(Array.from(stockMap.values())),
        purchases: currentPurchases,
        dealers: currentDealers,
      };
    });
  };


  // Staff Handlers with Verification & Access Control
  const handleAddStaff = (staffData: Omit<StaffMember, 'id'>) => {
    const newStaff: StaffMember = {
      ...staffData,
      id: `stf-${Date.now()}`,
      status: staffData.status || 'pending_approval',
      registeredAt: staffData.registeredAt || new Date().toISOString(),
    };
    setDb((prev) => {
      const nextDb = {
        ...prev,
        staff: [newStaff, ...(prev.staff || [])],
      };
      saveDatabase(nextDb);
      syncDatabaseToCloud(nextDb, setCloudStatus, true, true);
      return nextDb;
    });
  };

  const handleApproveStaff = (id: string) => {
    setDb((prev) => {
      const updatedStaff = (prev.staff || []).map((s) =>
        s.id === id
          ? {
              ...s,
              status: 'active' as const,
              approvedAt: new Date().toISOString(),
              approvedBy: currentUser?.name || 'Admin (Shubham)',
            }
          : s
      );
      const nextDb = { ...prev, staff: updatedStaff };
      saveDatabase(nextDb);
      syncDatabaseToCloud(nextDb, setCloudStatus, true, true);
      return nextDb;
    });
    showToast('कर्मचारी खाते मंजूर (Approved) करण्यात आले!', 'success');
  };

  const handleRejectStaff = (id: string) => {
    setDb((prev) => {
      const updatedStaff = (prev.staff || []).map((s) =>
        s.id === id ? { ...s, status: 'rejected' as const } : s
      );
      const nextDb = { ...prev, staff: updatedStaff };
      saveDatabase(nextDb);
      syncDatabaseToCloud(nextDb, setCloudStatus, true, true);
      return nextDb;
    });
    showToast('कर्मचारी अर्ज नाकारण्यात आला.', 'info');
  };

  const handleDeleteStaff = (id: string) => {
    setDb((prev) => {
      const updatedStaff = (prev.staff || []).filter((s) => s.id !== id);
      const nextDb = { ...prev, staff: updatedStaff };
      saveDatabase(nextDb);
      syncDatabaseToCloud(nextDb, setCloudStatus, true, true);
      return nextDb;
    });
    showToast('कर्मचारी हटवण्यात आला.', 'info');
  };

  const handleUpdateStaff = (updatedMember: StaffMember) => {
    setDb((prev) => {
      const updatedStaff = (prev.staff || []).map((s) =>
        s.id === updatedMember.id ? updatedMember : s
      );
      const nextDb = { ...prev, staff: updatedStaff };
      saveDatabase(nextDb);
      syncDatabaseToCloud(nextDb, setCloudStatus, true, true);
      return nextDb;
    });

    // If current logged in user is this staff member, sync session
    if (currentUser && currentUser.id === updatedMember.id) {
      setCurrentUser((prev) =>
        prev
          ? {
              ...prev,
              name: updatedMember.name,
              phone: updatedMember.phone,
              email: updatedMember.email || prev.email,
            }
          : null
      );
    }
    showToast(`✓ कर्मचारी माहिती यशस्वीरित्या अपडेट केली: ${updatedMember.name}`, 'success');
  };

  const handleUpdateAttendance = (
    id: string,
    status: 'Present' | 'Absent' | 'Half Day'
  ) => {
    setDb((prev) => ({
      ...prev,
      staff: (prev.staff || []).map((s) =>
        s.id === id ? { ...s, attendanceToday: status } : s
      ),
    }));
  };

  const handleRecordAdvance = (id: string, amount: number) => {
    setDb((prev) => ({
      ...prev,
      staff: (prev.staff || []).map((s) =>
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
          showToast('Data imported successfully!', 'success');
        }
      } catch (err) {
        showToast('Invalid JSON backup file.', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = async () => {
    const freshDb: AppDatabase = {
      settings: DEFAULT_SETTINGS,
      stock: INITIAL_STOCK,
      customers: [],
      transactions: [],
      purchases: [],
      staff: [],
      expenses: [],
      dealers: [],
      dealerPayments: [],
      cardMembers: [],
      cardTransactions: [],
      agentAdvances: [],
    };
    userClearedSectionsRef.current.all = Date.now();
    setDb(freshDb);
    saveDatabase(freshDb);
    try {
      await clearCloudSection('all');
    } catch (e) {}
    syncDatabaseToCloud(freshDb, setCloudStatus, true, true);
    showToast('✓ सर्व जुना व डेमो डेटा (ग्राहक, बिले, खरेदी, कार्ड्स, खर्च) पूर्णपणे डिलीट झाला आहे!', 'success');
  };

  const handleUpdateRecord = (category: string, id: string, updatedData: any) => {
    setDb((prev) => {
      let nextDb = { ...prev };
      if (category === 'bill') {
        nextDb.transactions = (prev.transactions || []).map((t) => (t.id === id ? { ...t, ...updatedData } : t));
      } else if (category === 'receipt') {
        nextDb.cardTransactions = (prev.cardTransactions || []).map((ct) => (ct.id === id ? { ...ct, ...updatedData } : ct));
        nextDb.transactions = (prev.transactions || []).map((t) => (t.id === id ? { ...t, ...updatedData } : t));
      } else if (category === 'card') {
        nextDb.cardMembers = (prev.cardMembers || []).map((m) => (m.id === id ? { ...m, ...updatedData } : m));
      } else if (category === 'customer') {
        nextDb.customers = (prev.customers || []).map((c) => (c.id === id ? { ...c, ...updatedData } : c));
      } else if (category === 'purchase') {
        nextDb.purchases = (prev.purchases || []).map((p) => (p.id === id ? { ...p, ...updatedData } : p));
      } else if (category === 'dealer') {
        nextDb.dealers = (prev.dealers || []).map((d) => (d.id === id ? { ...d, ...updatedData } : d));
      }

      // Re-synchronize customer khata ledger balances when any bill or receipt changes
      if (category === 'bill' || category === 'receipt') {
        const custMap = new Map<string, Customer>();
        (nextDb.customers || []).forEach((c) => {
          custMap.set(c.name.toLowerCase().trim(), {
            ...c,
            totalPurchased: 0,
            totalPurchases: 0,
            totalPaid: 0,
            balanceDue: 0,
          });
        });

        (nextDb.transactions || []).forEach((t) => {
          const key = (t.customerName || '').toLowerCase().trim();
          if (!key || key === 'customer' || key === 'ग्राहक') return;
          let cust = custMap.get(key);
          if (!cust) {
            cust = {
              id: `cust-${key.replace(/[^a-z0-9]/g, '-')}`,
              name: t.customerName,
              phone: t.customerPhone || '',
              address: t.village ? `${t.village}, Wardha` : 'Wardha',
              totalPurchased: 0,
              totalPurchases: 0,
              totalPaid: 0,
              balanceDue: 0,
              lastVisit: t.date,
            };
            custMap.set(key, cust);
          }
          if (t.entryType !== 'Receipt') {
            cust.totalPurchased += (t.totalAmount || 0);
            cust.totalPurchases = cust.totalPurchased;
          }
          cust.totalPaid += (t.payingNow || 0);
          cust.balanceDue = Math.max(0, (cust.totalPurchased || 0) - cust.totalPaid);
          if (!cust.phone && t.customerPhone) cust.phone = t.customerPhone;
          if (t.village && (!cust.address || cust.address === 'Wardha')) cust.address = `${t.village}, Wardha`;
          if (t.date && (!cust.lastVisit || t.date > cust.lastVisit)) cust.lastVisit = t.date;
        });

        nextDb.customers = Array.from(custMap.values());
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
        nextDb.transactions = (prev.transactions || []).filter((t) => t.id !== id);
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

  const handleSaveAgentAdvance = (advanceData: Omit<AgentAdvanceEntry, 'id' | 'createdAt'>) => {
    setDb((prev) => {
      const newAdvance: AgentAdvanceEntry = {
        ...advanceData,
        id: `adv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        createdAt: new Date().toISOString(),
      };
      const nextDb = {
        ...prev,
        agentAdvances: [newAdvance, ...(prev.agentAdvances || [])],
      };
      saveDatabase(nextDb);
      syncDatabaseToCloud(nextDb, setCloudStatus, false);
      return nextDb;
    });
  };

  const handleDeleteAgentAdvance = (advanceId: string) => {
    setDb((prev) => {
      const nextDb = {
        ...prev,
        agentAdvances: (prev.agentAdvances || []).filter((a) => a.id !== advanceId),
      };
      saveDatabase(nextDb);
      syncDatabaseToCloud(nextDb, setCloudStatus, false);
      return nextDb;
    });
  };

  if (appMode === 'shop') {
    return (
      <>
        {/* In-app Toast Banner */}
        {toastBanner && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
            <div className={`px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border text-sm font-semibold backdrop-blur-md ${
              toastBanner.type === 'error'
                ? 'bg-rose-950/95 text-rose-100 border-rose-700'
                : 'bg-emerald-950/95 text-emerald-100 border-emerald-600'
            }`}>
              <span>{toastBanner.type === 'error' ? '❌' : '✓'}</span>
              <span>{toastBanner.text}</span>
              <button
                type="button"
                onClick={() => setToastBanner(null)}
                className="ml-2 text-xs opacity-70 hover:opacity-100 cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Real-time New Order Floating Notification Banner */}
        {newOrderAlert && (
          <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4 no-print animate-fade-in">
            <div className={`p-3 rounded-2xl shadow-2xl border-2 flex items-center justify-between gap-3 text-slate-950 ${
              newOrderAlert.isFinance
                ? 'bg-gradient-to-r from-blue-400 via-indigo-300 to-amber-300 border-blue-400'
                : 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 border-amber-300'
            }`}>
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-8 h-8 rounded-full bg-slate-950 text-amber-300 flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                  {newOrderAlert.isFinance ? '⚡' : '🔔'}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-extrabold text-xs sm:text-sm text-slate-950">
                      {newOrderAlert.isFinance ? 'नवीन ०% फायनान्स अर्ज प्राप्त!' : 'नवीन कस्टमर ऑर्डर प्राप्त!'}
                    </span>
                    <span className="bg-slate-900 text-amber-300 text-[11px] font-mono font-bold px-2 py-0.2 rounded-full">
                      ₹{(Number(newOrderAlert.totalAmount) || 0).toLocaleString()}
                    </span>
                    {newOrderAlert.providerName && (
                      <span className="bg-blue-900 text-white text-[10px] font-bold px-2 py-0.2 rounded-full">
                        {newOrderAlert.providerName}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-semibold text-slate-800 truncate">
                    ग्राहक: {newOrderAlert.customerName} {newOrderAlert.customerPhone ? `• ${newOrderAlert.customerPhone}` : ''}
                    {newOrderAlert.monthlyEmi ? ` • हप्ता: ₹${newOrderAlert.monthlyEmi.toLocaleString()}/महिना` : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {newOrderAlert.customerPhone && (
                  <a
                    href={`https://wa.me/91${newOrderAlert.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                      newOrderAlert.isFinance
                        ? `नमस्ते ${newOrderAlert.customerName}, श्री साई इंटरप्राइजेस वर्धाकडून आपला ${newOrderAlert.providerName || 'बजाज'} ०% फायनान्स अर्ज (₹${newOrderAlert.totalAmount}) प्राप्त झाला आहे.`
                        : `नमस्ते ${newOrderAlert.customerName}, श्री साई इंटरप्राइजेसमध्ये आपली ऑनलाइन ऑर्डर प्राप्त झाली आहे.`
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
                      setSelectedNotificationToEdit({
                        id: `alert_${Date.now()}`,
                        type: newOrderAlert.isFinance ? 'finance_order_placed' : 'order_placed',
                        title: newOrderAlert.isFinance ? '०% फायनान्स अर्ज' : 'नवीन ग्राहक ऑर्डर',
                        subtitle: `${newOrderAlert.customerName} • ₹${newOrderAlert.totalAmount}`,
                        customerName: newOrderAlert.customerName,
                        customerPhone: newOrderAlert.customerPhone,
                        itemName: newOrderAlert.itemsSummary || 'इलेक्ट्रॉनिक्स/फर्निचर',
                        amount: newOrderAlert.totalAmount,
                        providerName: newOrderAlert.providerName,
                        schemeName: newOrderAlert.schemeName,
                        timestamp: Date.now(),
                        read: true,
                        status: 'pending',
                      });
                      setNewOrderAlert(null);
                    }}
                    className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-amber-300" />
                    <span>एडिट / बिल बनवा</span>
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
            onRegisterStaff={handleAddStaff}
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
          onRegisterStaff={handleAddStaff}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen tactile-canvas flex text-[var(--tactile-text-main)] antialiased font-sans relative">
      {/* In-app Toast Banner */}
      {toastBanner && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className={`px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border text-sm font-semibold backdrop-blur-md ${
            toastBanner.type === 'error'
              ? 'bg-rose-950/95 text-rose-100 border-rose-700'
              : 'bg-emerald-950/95 text-emerald-100 border-emerald-600'
          }`}>
            <span>{toastBanner.type === 'error' ? '❌' : '✓'}</span>
            <span>{toastBanner.text}</span>
            <button
              type="button"
              onClick={() => setToastBanner(null)}
              className="ml-2 text-xs opacity-70 hover:opacity-100 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

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
        onOpenCashClosing={() => setShowCashClosingModal(true)}
        onOpenPromoGenerator={() => setShowPromoModal(true)}
        onOpenWarrantyTracker={() => setShowWarrantyModal(true)}
        onQuickBackup={handleExportData}
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
          <div className={`px-4 py-2.5 shadow-md flex items-center justify-between gap-3 border-b-2 text-slate-950 no-print animate-fade-in ${
            newOrderAlert.isFinance
              ? 'bg-gradient-to-r from-blue-300 via-indigo-200 to-amber-300 border-blue-400'
              : 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 border-amber-300'
          }`}>
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold min-w-0">
              <span className="text-base">{newOrderAlert.isFinance ? '⚡' : '🔔'}</span>
              <span>{newOrderAlert.isFinance ? 'नवीन ०% फायनान्स अर्ज प्राप्त:' : 'नवीन ग्राहक ऑर्डर प्राप्त:'}</span>
              <span className="bg-slate-950 text-amber-300 text-xs px-2 py-0.5 rounded-full font-mono font-bold">
                ₹{(Number(newOrderAlert.totalAmount) || 0).toLocaleString()}
              </span>
              {newOrderAlert.providerName && (
                <span className="bg-blue-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {newOrderAlert.providerName}
                </span>
              )}
              <span className="hidden sm:inline font-semibold text-slate-900 truncate">
                {newOrderAlert.customerName} ({newOrderAlert.customerPhone || 'Wardha'})
                {newOrderAlert.monthlyEmi ? ` • हप्ता: ₹${newOrderAlert.monthlyEmi.toLocaleString()}/महिना` : ''}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0 text-xs">
              {newOrderAlert.customerPhone && (
                <a
                  href={`https://wa.me/91${newOrderAlert.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                    newOrderAlert.isFinance
                      ? `नमस्ते ${newOrderAlert.customerName}, श्री साई इंटरप्राइजेस वर्धाकडून आपला ${newOrderAlert.providerName || 'बजाज'} ०% फायनान्स अर्ज (₹${newOrderAlert.totalAmount}) प्राप्त झाला आहे. आम्ही तात्काळ मंजुरी प्रक्रिया सुरू करत आहोत.`
                      : `नमस्ते ${newOrderAlert.customerName}, श्री साई इंटरप्राइजेसमध्ये आपली ऑनलाइन ऑर्डर प्राप्त झाली आहे.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold transition shadow-xs"
                >
                  WhatsApp
                </a>
              )}
              <button
                onClick={() => {
                  setSelectedNotificationToEdit({
                    id: `alert_${Date.now()}`,
                    type: newOrderAlert.isFinance ? 'finance_order_placed' : 'order_placed',
                    title: newOrderAlert.isFinance ? '०% फायनान्स अर्ज' : 'नवीन ग्राहक ऑर्डर',
                    subtitle: `${newOrderAlert.customerName} • ₹${newOrderAlert.totalAmount}`,
                    customerName: newOrderAlert.customerName,
                    customerPhone: newOrderAlert.customerPhone,
                    itemName: newOrderAlert.itemsSummary || 'इलेक्ट्रॉनिक्स/फर्निचर',
                    amount: newOrderAlert.totalAmount,
                    providerName: newOrderAlert.providerName,
                    schemeName: newOrderAlert.schemeName,
                    timestamp: Date.now(),
                    read: true,
                    status: 'pending',
                  });
                  setNewOrderAlert(null);
                }}
                className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-white rounded-lg font-bold transition shadow-xs flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-300" />
                <span>एडिट / बिल बनवा</span>
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
        <header className="sticky top-0 z-30 tactile-card rounded-none border-t-0 border-x-0 border-b border-[var(--tactile-border)] px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between no-print backdrop-blur-md">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="p-1.5 sm:p-2 rounded-lg text-[var(--tactile-text-muted)] hover:bg-[var(--tactile-surface-inset)] lg:hidden cursor-pointer shrink-0"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <span className="font-bold text-[var(--tactile-text-heading)] text-sm sm:text-base tracking-tight truncate max-w-[130px] xs:max-w-[200px] sm:max-w-none">
                {db.settings.businessName}
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full tactile-inset text-[var(--tactile-text-muted)] text-xs font-mono font-medium shrink-0">
                Cloud ERP
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 justify-end">
            {/* 1. Install Mobile App button (Desktop/Tablet) */}
            <button
              type="button"
              onClick={() => setShowInstallModal(true)}
              title="Install Official Mobile App"
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>मोबाईल ॲप</span>
            </button>

            {/* 2. View Customer Website button */}
            <button
              type="button"
              onClick={() => setAppMode('shop')}
              title="View Customer Website & Public Passbook Portal"
              className="flex items-center gap-1 px-2 py-1.5 sm:px-2.5 rounded-lg border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-bold transition cursor-pointer shadow-2xs"
            >
              <Store className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span className="hidden sm:inline">Website</span>
              <span className="sm:hidden">Shop</span>
            </button>

            {/* 3. Live Customer Cart & Online Orders Notification Bell */}
            <AdminNotificationDropdown
              notifications={adminNotifications}
              onMarkAllRead={handleMarkAllNotificationsRead}
              onClearAll={handleClearAllNotifications}
              onEditNotification={setSelectedNotificationToEdit}
              onDeleteNotification={handleDeleteNotification}
              isMuted={isAudioMuted}
              onToggleMute={toggleAudioMuted}
            />

            {/* 4. Real-time Google Cloud Sync Status Badge */}
            <button
              type="button"
              onClick={handleManualCloudSync}
              title="Real-time Google Cloud database sync. Click to force sync."
              className={`flex items-center gap-1 px-2 py-1.5 sm:px-2.5 rounded-lg border text-xs font-medium transition cursor-pointer ${
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
              <span className="hidden md:inline">
                {cloudStatus === 'connected' && 'Synced'}
                {cloudStatus === 'syncing' && 'Syncing...'}
                {cloudStatus === 'quota-exceeded' && 'Quota Full'}
                {cloudStatus === 'offline' && 'Offline'}
                {cloudStatus === 'error' && 'Error'}
              </span>
            </button>

            {/* 5. Global Data Search Shortcut (Desktop) */}
            <button
              type="button"
              onClick={() => setActiveTab('uploaded-data')}
              title="Search uploaded Excel data and all system records"
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-xs font-semibold transition cursor-pointer shadow-2xs"
            >
              <Search className="w-3.5 h-3.5" />
              <span>सर्व डेटा शोधा</span>
            </button>

            {/* 6. Active Day / Night Theme Toggle */}
            <DayNightToggle id="erp-header-daynight" size="sm" showLabel={false} />

            {/* Quick backup button (Desktop/Tablet) */}
            <button
              type="button"
              onClick={() => {
                handleExportData();
                localStorage.setItem('shri_sai_last_backup_date', new Date().toISOString().split('T')[0]);
                setShowBackupReminder(false);
                showToast('✓ आजचा संपूर्ण डेटा बॅकअप यशस्वीरित्या तुमच्या डिव्हाइसवर सुरक्षित सेव्ह झाला!', 'success');
              }}
              title="1-Click Instant Device Backup"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-indigo-500/40 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-800 dark:text-indigo-300 text-xs font-bold transition cursor-pointer shadow-2xs"
            >
              <Save className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>बॅकअप</span>
            </button>

            {/* 7. New Bill / Entry Shortcut */}
            <button
              type="button"
              onClick={() => setActiveTab('add-entry')}
              title="Create New Bill / Entry"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer shadow-xs active:scale-95"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Entry</span>
              <span className="sm:hidden">+ बिल</span>
            </button>

            {/* 8. User Role Badge & Auth Switcher */}
            {currentUser ? (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowLoginModal(true)}
                  title="Role Switch / Change Account"
                  className={`flex items-center gap-1 px-2 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                    currentUser.role === 'admin'
                      ? 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-200'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200'
                  }`}
                >
                  {currentUser.role === 'admin' ? (
                    <Crown className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  ) : (
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  )}
                  <span className="hidden sm:inline">{currentUser.role === 'admin' ? 'Admin' : 'Staff'}</span>
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
                <span>Login</span>
              </button>
            )}
          </div>
        </header>

        {/* Daily Auto-Backup Reminder Banner (Item 7) */}
        {showBackupReminder && (
          <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white px-4 py-2.5 shadow-md flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm no-print border-b border-blue-500/30">
            <div className="flex items-center gap-2.5 font-medium">
              <span className="text-lg">💾</span>
              <div>
                <strong>दैनिक डेटा बॅकअप स्मरणपत्र (Daily Backup Reminder):</strong>
                <span className="opacity-90 ml-1.5 hidden sm:inline">
                  दुकान बंद करण्यापूर्वी आजचा संपूर्ण व्यवहार, ग्राहक, स्टॉक व कार्ड डेटा १-क्लिकमध्ये सुरक्षित डाऊनलोड करा.
                </span>
                <span className="opacity-90 ml-1.5 sm:hidden">
                  आजचा डेटा सुरक्षित डाऊनलोड करा.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  handleExportData();
                  localStorage.setItem('shri_sai_last_backup_date', new Date().toISOString().split('T')[0]);
                  setShowBackupReminder(false);
                  showToast('✓ आजचा संपूर्ण डेटा बॅकअप यशस्वीरित्या डाऊनलोड झाला!', 'success');
                }}
                className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold transition shadow-xs flex items-center gap-1.5 text-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>१-क्लिक बॅकअप घ्या</span>
              </button>
              <button
                type="button"
                onClick={() => setShowBackupReminder(false)}
                className="px-2 py-1 text-white/80 hover:text-white hover:bg-white/10 rounded-lg text-xs cursor-pointer font-medium"
              >
                नंतर
              </button>
            </div>
          </div>
        )}

        {/* Pending Staff Verification Alert for Admin */}
        {currentUser?.role === 'admin' && (db.staff || []).some((s) => s.status === 'pending_approval') && (
          <div className="bg-gradient-to-r from-purple-800 via-indigo-800 to-blue-800 text-white px-4 py-2.5 shadow-md flex items-center justify-between gap-3 text-xs sm:text-sm no-print">
            <div className="flex items-center gap-2.5 font-medium">
              <span className="text-base animate-pulse">🔒</span>
              <span>
                <strong>डेटा सुरक्षा पडताळणी:</strong> {(db.staff || []).filter((s) => s.status === 'pending_approval').length} नवीन कर्मचाऱ्याने नोंदणी केली आहे. सुरक्षेसाठी ॲडमिन मंजुरी आवश्यक आहे.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('staff')}
              className="px-3 py-1 bg-white text-indigo-900 hover:bg-indigo-50 rounded-lg font-bold transition shadow-xs cursor-pointer text-xs shrink-0"
            >
              अर्ज तपासा व मंजूर करा ({(db.staff || []).filter((s) => s.status === 'pending_approval').length})
            </button>
          </div>
        )}

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
          onCardPassbook={() => {
            setActiveTab('card-scheme');
          }}
          onRefund={() => {
            setActiveTab('card-scheme');
            setCardSchemeInitialAction('refund');
          }}
          onDeliveryChallan={() => {
            setActiveTab('card-scheme');
            setCardSchemeInitialAction('delivery-challan');
          }}
          onCustomerLedger={() => {
            setActiveTab('customers');
          }}
          onCustomerDueList={() => {
            setActiveTab('customers');
          }}
          onAllCustomers={() => {
            setActiveTab('customers');
          }}
          onNewBill={() => {
            setActiveTab('add-entry');
          }}
          onAllTransactions={() => {
            setActiveTab('all-entries');
          }}
          onReceivePavti={() => {
            setShowQuickPavtiModal(true);
          }}
          onPurchases={() => {
            setActiveTab('purchases');
          }}
          onFinanceCalc={() => {
            setShowFinanceModal(true);
          }}
          onWarrantyTracker={() => {
            setShowWarrantyModal(true);
          }}
        />

        {/* View Switcher */}
        <main className="flex-1 pb-28 lg:pb-12">
          {activeTab === 'dashboard' && (
            <DashboardView
              transactions={db.transactions}
              customers={db.customers}
              stock={db.stock}
              settings={db.settings}
              cardMembers={db.cardMembers || []}
              cardTransactions={db.cardTransactions || []}
              agentAdvances={db.agentAdvances || []}
              staff={db.staff || []}
              currentUser={currentUser}
              adminNotifications={adminNotifications}
              onOpenStorefront={() => setAppMode('shop')}
              onNavigate={setActiveTab}
              onOpenInvoiceModal={setSelectedInvoice}
              onSaveAdvance={handleSaveAgentAdvance}
              onEditNotification={setSelectedNotificationToEdit}
            />
          )}

          {activeTab === 'finance-calc' && (
            <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-xs">
                <FinanceCalculatorModal
                  settings={db.settings}
                  customers={db.customers}
                  isOpen={true}
                  onClose={() => setActiveTab('dashboard')}
                  onApplyToBill={(financeDetails) => {
                    handleApplyFinanceToBill(financeDetails);
                  }}
                />
              </div>
            </div>
          )}

          {activeTab === 'agent-hisab' && (
            <AgentHisabView
              cardMembers={db.cardMembers || []}
              cardTransactions={db.cardTransactions || []}
              agentAdvances={db.agentAdvances || []}
              staff={db.staff || []}
              settings={db.settings}
              currentUser={currentUser}
              onNavigate={setActiveTab}
              onSaveAdvance={handleSaveAgentAdvance}
              onDeleteAdvance={handleDeleteAgentAdvance}
            />
          )}

          {activeTab === 'add-entry' && (
            <AddEntryView
              onSaveEntry={handleSaveEntry}
              onUpdateEntry={(id, updated) => {
                handleUpdateRecord('bill', id, updated);
                setEditingEntry(null);
              }}
              initialEntryToEdit={editingEntry}
              initialFinancePrefill={financePrefill}
              onClearFinancePrefill={() => setFinancePrefill(null)}
              onCancelEdit={() => setEditingEntry(null)}
              allTransactions={db.transactions}
              onBackToDashboard={() => {
                setEditingEntry(null);
                setFinancePrefill(null);
                setActiveTab('dashboard');
              }}
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
                onEditBillInFullEditor={(bill) => {
                  setEditingEntry(bill);
                  setActiveTab('add-entry');
                }}
                onMergeCustomers={handleMergeCustomers}
                onBatchMergeCustomers={handleBatchMergeCustomers}
                onAutoFixCalculations={handleAutoFixCalculations}
                onAutoCleanPhones={handleAutoCleanPhones}
                onAutoFillAddresses={handleAutoFillAddresses}
                onClearAllDemoData={handleClearAllDemoData}
                onClearZeroBills={handleClearZeroBills}
              />
            </ErrorBoundary>
          )}

          {activeTab === 'all-entries' && (
            <AllEntriesView
              entries={db.transactions}
              onDeleteEntry={handleDeleteEntry}
              onNavigateAdd={() => {
                setEditingEntry(null);
                setActiveTab('add-entry');
              }}
              onEditEntry={(entry) => {
                setEditingEntry(entry);
                setActiveTab('add-entry');
              }}
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
              onUpdateCustomer={handleUpdateCustomer}
              onSettlePayment={handleSettlePayment}
              onRecalculateLedgers={handleRecalculateCustomerLedgers}
              onOpenQuickPavti={handleOpenQuickPavti}
              onMergeCustomers={handleMergeCustomers}
              settings={db.settings}
            />
          )}

          {activeTab === 'stock' && (
            <StockView
              stock={db.stock}
              onAddStockItem={handleAddStockItem}
              onUpdateStockQty={handleUpdateStockQty}
              transactions={db.transactions || []}
              settings={db.settings}
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
              settings={db.settings}
            />
          )}

          {activeTab === 'staff' && (
            <StaffView
              staff={db.staff || []}
              onAddStaff={handleAddStaff}
              onUpdateStaff={handleUpdateStaff}
              onUpdateAttendance={handleUpdateAttendance}
              onRecordAdvance={handleRecordAdvance}
              onApproveStaff={handleApproveStaff}
              onRejectStaff={handleRejectStaff}
              onDeleteStaff={handleDeleteStaff}
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
                db={db}
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
        onUpdateEntry={(updated) => {
          handleUpdateRecord('bill', updated.id, updated);
          setSelectedInvoice(updated);
        }}
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

      {/* Universal Finance EMI Calculator Modal (Bajaj, TVS, HDB, IDBI) */}
      {showFinanceModal && (
        <FinanceCalculatorModal
          settings={db.settings}
          customers={db.customers}
          isOpen={showFinanceModal}
          onClose={() => setShowFinanceModal(false)}
          onApplyToBill={(financeDetails) => {
            setShowFinanceModal(false);
            handleApplyFinanceToBill(financeDetails);
          }}
        />
      )}

      {/* Quick Pavti / Instant Payment Receipt Modal */}
      {showQuickPavtiModal && (
        <QuickPavtiModal
          customers={db.customers || []}
          transactions={db.transactions || []}
          settings={db.settings}
          onClose={() => {
            setShowQuickPavtiModal(false);
            setQuickPavtiCustomer(null);
            setQuickPavtiBillNo(undefined);
            setQuickPavtiAmount(undefined);
          }}
          onSettlePayment={handleSettlePayment}
          onOpenInvoiceModal={setSelectedInvoice}
          preselectedCustomerId={quickPavtiCustomer?.id}
          preselectedBillNo={quickPavtiBillNo}
          preselectedAmount={quickPavtiAmount}
        />
      )}

      {/* Daily Cash Closing Modal */}
      {showCashClosingModal && (
        <CashClosingModal
          isOpen={showCashClosingModal}
          onClose={() => setShowCashClosingModal(false)}
          settings={db.settings}
          transactions={db.transactions || []}
          cardTransactions={db.cardTransactions || []}
          expenses={db.expenses || []}
          dealerPayments={db.dealerPayments || []}
          staff={db.staff || []}
          activeUserName={currentUser?.name || db.settings.ownerName || 'Admin'}
          onShowToast={showToast}
        />
      )}

      {/* Festival / Weekly Scheme Promo Generator Modal */}
      {showPromoModal && (
        <PromoGeneratorModal
          isOpen={showPromoModal}
          onClose={() => setShowPromoModal(false)}
          settings={db.settings}
        />
      )}

      {/* Warranty & Free Service Expiry Tracker Modal */}
      {showWarrantyModal && (
        <WarrantyTrackerModal
          isOpen={showWarrantyModal}
          onClose={() => setShowWarrantyModal(false)}
          settings={db.settings}
          transactions={db.transactions || []}
        />
      )}

      {/* Interactive Cart / Order / Finance Notification Edit Modal */}
      <NotificationEditModal
        notification={selectedNotificationToEdit}
        isOpen={Boolean(selectedNotificationToEdit)}
        onClose={() => setSelectedNotificationToEdit(null)}
        onSave={handleSaveNotification}
        onDelete={handleDeleteNotification}
        onConvertToBill={handleCreateBillFromNotification}
      />

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
