import JSZip from 'jszip';
import {
  initialStoreData,
  cleanDemoCustomers,
  cleanDemoCards,
  cleanDemoTransactions,
  cleanDemoStock,
  cleanDemoBillReceipts
} from '../mockData';
import { SAMPLE_SHOWROOM_PRODUCTS } from '../utils/defaultLandingConfig';
import {
  AdminUser,
  AgentAdvance,
  BillReceipt,
  CardMember,
  CardTransaction,
  Customer,
  Dealer,
  DealerPayment,
  Expense,
  Purchase,
  Staff,
  StockItem,
  StoreData,
  StoreSettings,
  Transaction,
} from '../types';

const STORAGE_KEY = 'shri_sai_enterprises_store_data_v3';
const SYNC_CHANNEL_NAME = 'shri_sai_realtime_sync_channel';

export class StorageService {
  private static cachedData: StoreData | null = null;
  private static eventSource: EventSource | null = null;
  private static broadcastChannel: BroadcastChannel | null = null;
  private static isConnected: boolean = false;
  private static lastSyncTimestamp: string | null = null;
  private static syncListeners: Array<(data: StoreData) => void> = [];

  private static getDeviceId(): string {
    if (typeof window === 'undefined') return 'server';
    let id = sessionStorage.getItem('sai_device_uuid');
    if (!id) {
      id = `dev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      sessionStorage.setItem('sai_device_uuid', id);
    }
    return id;
  }

  public static loadData(): StoreData {
    if (this.cachedData) return this.cachedData;

    try {
      // Clean up legacy v1 and v2 keys to completely eliminate old dummy data
      try {
        localStorage.removeItem('shri_sai_enterprises_store_data_v1');
        localStorage.removeItem('shri_sai_enterprises_store_data_v2');
      } catch (e) {
        // ignore storage access errors
      }

      const serialized = localStorage.getItem(STORAGE_KEY);
      if (serialized) {
        const parsed = JSON.parse(serialized);

        // Ensure settings match current showroom configuration
        if (!parsed.settings) {
          parsed.settings = { ...initialStoreData.settings };
        } else {
          parsed.settings.storeName = initialStoreData.settings.storeName;
          parsed.settings.tagline = initialStoreData.settings.tagline;
          parsed.settings.address = initialStoreData.settings.address;
          parsed.settings.phone = initialStoreData.settings.phone;
          parsed.settings.gstin = initialStoreData.settings.gstin;
          if (!parsed.settings.bankDetails || parsed.settings.bankDetails.bankName !== 'HDFC Bank') {
            parsed.settings.bankDetails = { ...initialStoreData.settings.bankDetails };
          }
        }

        // Ensure settings.nextReceiptNo defaults to at least 1087
        if (!parsed.settings.nextReceiptNo || parsed.settings.nextReceiptNo < 1087) {
          parsed.settings.nextReceiptNo = 1087;
        }

        // Ensure field agents exist in staff array
        if (!parsed.staff || parsed.staff.length < 5 || parsed.staff.some((s: any) => s.name.includes('Dinesh Fulzele'))) {
          parsed.staff = [...initialStoreData.staff];
        }

        // Check if legacy dummy products or dummy customers exist in storage, purge them!
        const hasDummyCustomers = parsed.customers?.some((c: any) => c.name === 'VIJAY GADE' || c.id === 'cust-1');
        const hasDummyStock = parsed.stock?.some((s: any) => s.id === 'stk-1' || s.code === 'ELE-SAM-55Q');
        if (hasDummyCustomers || hasDummyStock || !parsed.isDemoWiped) {
          parsed.customers = [];
          parsed.transactions = [];
          parsed.cardMembers = [];
          parsed.cardTransactions = [];
          parsed.billReceipts = [];
          parsed.stock = [];
          parsed.purchases = [];
          parsed.expenses = [];
          parsed.dealerPayments = [];
          parsed.agentAdvances = [];
          parsed.isDemoWiped = true;
          this.saveData(parsed);
        }

        if (parsed.isDemoWiped) {
          // Keep customer/transaction collections wiped/clean
          if (!parsed.billReceipts) parsed.billReceipts = [];
          if (!parsed.cardTransactions) parsed.cardTransactions = [];
          if (!parsed.customers) parsed.customers = [];
          if (!parsed.transactions) parsed.transactions = [];
          if (!parsed.cardMembers) parsed.cardMembers = [];
          if (!parsed.expenses) parsed.expenses = [];
          if (!parsed.purchases) parsed.purchases = [];
          if (!parsed.dealerPayments) parsed.dealerPayments = [];
          if (!parsed.agentAdvances) parsed.agentAdvances = [];
        }

        // Ensure stock has showroom showcase catalog so customer showroom is always full & ready
        if (!parsed.stock || !Array.isArray(parsed.stock) || parsed.stock.length === 0) {
          parsed.stock = SAMPLE_SHOWROOM_PRODUCTS.map((p, idx) => ({
            ...p,
            id: `stk-show-${idx + 1}`,
            updatedAt: new Date().toISOString(),
          }));
          this.saveData(parsed);
        }

        // Sanitize legacy dummy phone number (9822000000) from stored transactions so they are not grouped together
        if (parsed.transactions && Array.isArray(parsed.transactions)) {
          let hasLegacyDummy = false;
          parsed.transactions.forEach((tx: Transaction) => {
            if (tx.customerPhone === '9822000000') {
              tx.customerPhone = '';
              hasLegacyDummy = true;
            }
          });
          if (hasLegacyDummy) {
            this.saveData(parsed, false);
          }
        }

        this.cachedData = parsed;
        return parsed;
      }
    } catch (e) {
      console.error('Failed to parse stored store data, loading initial dataset:', e);
    }

    // Default initialization with crisp clean store (zero dummy products / customers)
    this.cachedData = { ...initialStoreData, isDemoWiped: true };
    this.saveData(this.cachedData);
    return this.cachedData;
  }

  public static saveData(data: StoreData, pushToServer: boolean = true): void {
    data.updatedAt = new Date().toISOString();
    this.cachedData = data;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }

    // 1. Notify other browser tabs/windows on the same device instantly
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        if (!this.broadcastChannel) {
          this.broadcastChannel = new BroadcastChannel(SYNC_CHANNEL_NAME);
        }
        this.broadcastChannel.postMessage({
          type: 'LOCAL_SYNC_UPDATE',
          deviceId: this.getDeviceId(),
          data,
        });
      }
    } catch {
      // ignore broadcast errors
    }

    // 2. Real-time Push to Central Server for multi-device sync (Mobile agent <-> Counter desktop)
    if (pushToServer && typeof window !== 'undefined') {
      this.pushToServer(data);
    }
  }

  /**
   * Pushes store data to central server endpoint
   */
  public static async pushToServer(data: StoreData): Promise<boolean> {
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data,
          sourceDeviceId: this.getDeviceId(),
        }),
      });
      if (res.ok) {
        this.isConnected = true;
        this.lastSyncTimestamp = new Date().toISOString();
        return true;
      }
    } catch {
      this.isConnected = false;
    }
    return false;
  }

  /**
   * Pulls latest state from central server
   */
  public static async pullFromServer(): Promise<StoreData | null> {
    try {
      const res = await fetch('/api/sync');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          this.isConnected = true;
          this.lastSyncTimestamp = new Date().toISOString();
          const serverData: StoreData = json.data;

          // Merge if server data is newer or has records
          const current = this.loadData();
          const serverTime = new Date(serverData.updatedAt || 0).getTime();
          const localTime = new Date(current.updatedAt || 0).getTime();

          // Preserve stock catalog if server had empty stock
          if ((!serverData.stock || serverData.stock.length === 0) && current.stock && current.stock.length > 0) {
            serverData.stock = current.stock;
          } else if (!serverData.stock || serverData.stock.length === 0) {
            serverData.stock = SAMPLE_SHOWROOM_PRODUCTS.map((p, idx) => ({
              ...p,
              id: `stk-show-${idx + 1}`,
              updatedAt: new Date().toISOString(),
            }));
          }

          if (serverTime >= localTime || (serverData.cardTransactions?.length || 0) > (current.cardTransactions?.length || 0)) {
            this.cachedData = serverData;
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(serverData));
            } catch {}
            return serverData;
          }
        }
      }
    } catch {
      this.isConnected = false;
    }
    return null;
  }

  /**
   * Initializes real-time continuous synchronization:
   * - Server-Sent Events (SSE) from server
   * - BroadcastChannel across tabs
   * - Automatic re-sync when network reconnects
   */
  public static initRealtimeSync(onUpdate: (data: StoreData) => void): () => void {
    if (typeof window === 'undefined') return () => {};

    if (!this.syncListeners.includes(onUpdate)) {
      this.syncListeners.push(onUpdate);
    }

    const notifyListeners = (data: StoreData) => {
      this.cachedData = data;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch {}
      this.syncListeners.forEach((fn) => {
        try {
          fn(data);
        } catch (e) {
          console.error('Error invoking sync listener:', e);
        }
      });
    };

    // 1. Initial background pull from server
    this.pullFromServer().then((serverData) => {
      if (serverData) {
        notifyListeners(serverData);
      } else {
        // If server had no data yet, push our current local state to initialize it
        const current = this.loadData();
        this.pushToServer(current);
      }
    });

    // 2. Setup Server-Sent Events (SSE) connection
    let reconnectTimeout: any = null;
    const connectSSE = () => {
      if (this.eventSource) {
        this.eventSource.close();
      }

      try {
        const es = new EventSource('/api/sync/events');
        this.eventSource = es;

        es.onopen = () => {
          this.isConnected = true;
          this.lastSyncTimestamp = new Date().toISOString();
        };

        es.onmessage = (event) => {
          try {
            if (!event.data || event.data.startsWith(':')) return;
            const payload = JSON.parse(event.data);

            if (payload.type === 'REALTIME_STORE_UPDATE' && payload.data) {
              this.isConnected = true;
              this.lastSyncTimestamp = new Date().toISOString();

              // Avoid re-processing our own echo if same device
              if (payload.sourceDeviceId === this.getDeviceId()) {
                return;
              }

              notifyListeners(payload.data);
            }
          } catch (err) {
            console.error('Error handling SSE sync event:', err);
          }
        };

        es.onerror = () => {
          this.isConnected = false;
          es.close();
          // Auto reconnect after 2 seconds for superfast mobile recovery
          clearTimeout(reconnectTimeout);
          reconnectTimeout = setTimeout(connectSSE, 2000);
        };
      } catch {
        this.isConnected = false;
      }
    };

    connectSSE();

    // 3. Listen to local BroadcastChannel (other tabs on same browser)
    try {
      if ('BroadcastChannel' in window) {
        if (!this.broadcastChannel) {
          this.broadcastChannel = new BroadcastChannel(SYNC_CHANNEL_NAME);
        }
        this.broadcastChannel.onmessage = (msg) => {
          if (msg.data?.type === 'LOCAL_SYNC_UPDATE' && msg.data?.data) {
            if (msg.data.deviceId !== this.getDeviceId()) {
              notifyListeners(msg.data.data);
            }
          }
        };
      }
    } catch {}

    // 4. Online/Offline network event listeners
    const handleOnline = () => {
      this.isConnected = true;
      connectSSE();
      this.pullFromServer().then((data) => {
        if (data) notifyListeners(data);
      });
      const current = this.loadData();
      this.pushToServer(current);
    };

    const handleOffline = () => {
      this.isConnected = false;
    };

    // 5. Mobile & Computer tab focus / screen wake event listeners for instant sync
    const handleVisibilityOrFocus = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        this.pullFromServer().then((data) => {
          if (data) notifyListeners(data);
        });
        if (!this.isConnected || !this.eventSource || this.eventSource.readyState === EventSource.CLOSED) {
          connectSSE();
        }
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    // Return teardown function
    return () => {
      const idx = this.syncListeners.indexOf(onUpdate);
      if (idx !== -1) {
        this.syncListeners.splice(idx, 1);
      }
      clearTimeout(reconnectTimeout);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }

  public static getSyncStatus(): { isConnected: boolean; lastSyncTimestamp: string | null } {
    return {
      isConnected: this.isConnected,
      lastSyncTimestamp: this.lastSyncTimestamp,
    };
  }

  public static resetToDefault(): StoreData {
    this.cachedData = { ...initialStoreData, isDemoWiped: true };
    this.saveData(this.cachedData);
    return this.cachedData;
  }

  public static loadCleanDemoData(): StoreData {
    const current = this.loadData();
    const demoData: StoreData = {
      ...current,
      stock: [...cleanDemoStock],
      customers: [...cleanDemoCustomers],
      transactions: [...cleanDemoTransactions],
      cardMembers: [...cleanDemoCards],
      billReceipts: [...cleanDemoBillReceipts],
      isDemoWiped: false,
    };
    this.cachedData = demoData;
    this.saveData(demoData);
    return demoData;
  }

  /**
   * 1-Click Complete Demo Data Reset / Clean Slate
   * Wipes all mock/demo customers, transactions, bill receipts, and scheme cards,
   * while keeping settings, staff, and admin logins safe.
   */
  public static wipeAllDemoData(options?: { keepStock?: boolean; keepDealers?: boolean }): StoreData {
    const current = this.loadData();
    const cleanData: StoreData = {
      updatedAt: new Date().toISOString(),
      updatedBy: 'Admin (Data Reset)',
      settings: {
        ...current.settings,
        nextReceiptNo: 1079, // starts fresh at #1079
      },
      stock: options?.keepStock ? current.stock : [],
      customers: [],
      transactions: [],
      purchases: [],
      dealers: options?.keepDealers ? current.dealers : [],
      dealerPayments: [],
      cardMembers: [],
      cardTransactions: [],
      staff: current.staff?.length ? current.staff : [...initialStoreData.staff],
      expenses: [],
      agentAdvances: [],
      billReceipts: [],
      authSessions: current.authSessions || [],
      adminUsers: current.adminUsers || [...initialStoreData.adminUsers],
      isDemoWiped: true,
    };
    this.cachedData = cleanData;
    this.saveData(cleanData);
    return cleanData;
  }

  /**
   * Bulk import customers with zero Firebase read/write quota usage
   */
  public static bulkImportCustomers(
    newCustomers: Customer[],
    mode: 'merge' | 'replace' | 'append' = 'merge'
  ): { total: number; added: number; updated: number } {
    const data = this.loadData();
    let added = 0;
    let updated = 0;

    if (mode === 'replace') {
      data.customers = newCustomers;
      added = newCustomers.length;
    } else {
      newCustomers.forEach((nc) => {
        const existingIdx = data.customers.findIndex(
          (c) =>
            (nc.phone && nc.phone !== '0' && c.phone === nc.phone) ||
            c.name.trim().toLowerCase() === nc.name.trim().toLowerCase()
        );

        if (existingIdx >= 0) {
          if (mode === 'merge') {
            data.customers[existingIdx] = {
              ...data.customers[existingIdx],
              currentBalance: (data.customers[existingIdx].currentBalance || 0) + (nc.currentBalance || 0),
              totalPurchased: (data.customers[existingIdx].totalPurchased || 0) + (nc.totalPurchased || 0),
              village: nc.village || data.customers[existingIdx].village,
              address: nc.address || data.customers[existingIdx].address,
              phone: nc.phone && nc.phone !== '0' ? nc.phone : data.customers[existingIdx].phone,
            };
            updated++;
          }
        } else {
          data.customers.push(nc);
          added++;
        }
      });
    }

    data.isDemoWiped = true;
    this.saveData(data);
    return { total: data.customers.length, added, updated };
  }

  /**
   * Bulk import 30-Month Scheme cards
   */
  public static bulkImportSchemeCards(
    newCards: CardMember[],
    mode: 'merge' | 'replace' | 'append' = 'merge'
  ): { total: number; added: number; updated: number } {
    const data = this.loadData();
    let added = 0;
    let updated = 0;

    if (mode === 'replace') {
      data.cardMembers = newCards;
      added = newCards.length;
    } else {
      newCards.forEach((nc) => {
        const existingIdx = data.cardMembers.findIndex(
          (m) => m.cardNo.toLowerCase() === nc.cardNo.toLowerCase()
        );

        if (existingIdx >= 0) {
          if (mode === 'merge') {
            data.cardMembers[existingIdx] = {
              ...data.cardMembers[existingIdx],
              ...nc,
            };
            updated++;
          }
        } else {
          data.cardMembers.push(nc);
          added++;
        }
      });
    }

    data.isDemoWiped = true;
    this.saveData(data);
    return { total: data.cardMembers.length, added, updated };
  }

  /**
   * Bulk import stock inventory
   */
  public static bulkImportStock(
    newStock: StockItem[],
    mode: 'merge' | 'replace' | 'append' = 'merge'
  ): { total: number; added: number; updated: number } {
    const data = this.loadData();
    let added = 0;
    let updated = 0;

    if (mode === 'replace') {
      data.stock = newStock;
      added = newStock.length;
    } else {
      newStock.forEach((ns) => {
        const existingIdx = data.stock.findIndex(
          (s) => s.name.trim().toLowerCase() === ns.name.trim().toLowerCase()
        );

        if (existingIdx >= 0) {
          if (mode === 'merge') {
            data.stock[existingIdx] = {
              ...data.stock[existingIdx],
              stockQty: data.stock[existingIdx].stockQty + ns.stockQty,
              salePrice: ns.salePrice || data.stock[existingIdx].salePrice,
              purchasePrice: ns.purchasePrice || data.stock[existingIdx].purchasePrice,
              updatedAt: new Date().toISOString(),
            };
            updated++;
          }
        } else {
          data.stock.push(ns);
          added++;
        }
      });
    }

    this.saveData(data);
    return { total: data.stock.length, added, updated };
  }

  // Stock operations
  public static addStockItem(item: Omit<StockItem, 'id' | 'updatedAt'>): StockItem {
    const data = this.loadData();
    const newItem: StockItem = {
      ...item,
      id: 'stk-' + Date.now(),
      updatedAt: new Date().toISOString(),
    };
    data.stock.unshift(newItem);
    this.saveData(data);
    return newItem;
  }

  public static updateStockItem(item: StockItem): void {
    const data = this.loadData();
    const index = data.stock.findIndex((s) => s.id === item.id);
    if (index !== -1) {
      data.stock[index] = { ...item, updatedAt: new Date().toISOString() };
      this.saveData(data);
    }
  }

  public static deleteStockItem(id: string): void {
    const data = this.loadData();
    data.stock = data.stock.filter((s) => s.id !== id);
    this.saveData(data);
  }

  // Sales / Invoices
  public static createTransaction(
    txData: Omit<Transaction, 'id' | 'invoiceNo' | 'date'>
  ): Transaction {
    const data = this.loadData();
    const invCount = data.transactions.length + 1044;
    const invoiceNo = `${data.settings.invoicePrefix || 'SSE-INV-'}${new Date().getFullYear()}-${invCount}`;

    const newTx: Transaction = {
      ...txData,
      id: 'tx-' + Date.now(),
      invoiceNo,
      date: new Date().toISOString(),
    };

    // Deduct stock quantities
    for (const item of newTx.items) {
      const stockObj = data.stock.find((s) => s.id === item.stockId);
      if (stockObj) {
        stockObj.stockQty = Math.max(0, stockObj.stockQty - item.qty);
        stockObj.updatedAt = new Date().toISOString();
      }
    }

    // Update customer balance & total purchase
    if (newTx.customerId) {
      const cust = data.customers.find((c) => c.id === newTx.customerId);
      if (cust) {
        cust.totalPurchased += newTx.grandTotal;
        cust.currentBalance += newTx.balanceDue;
      }
    }

    data.transactions.unshift(newTx);
    this.saveData(data);
    return newTx;
  }

  // Update existing sales transaction / old bill
  public static updateTransaction(updatedTx: Transaction): Transaction {
    const data = this.loadData();
    const idx = data.transactions.findIndex((t) => t.id === updatedTx.id);
    if (idx === -1) {
      throw new Error('Transaction not found: ' + updatedTx.id);
    }

    const oldTx = data.transactions[idx];

    // Revert old transaction effects on customer
    if (oldTx.customerId) {
      const oldCust = data.customers.find((c) => c.id === oldTx.customerId);
      if (oldCust) {
        oldCust.totalPurchased = Math.max(0, oldCust.totalPurchased - oldTx.grandTotal);
        oldCust.currentBalance = Math.max(0, oldCust.currentBalance - oldTx.balanceDue);
      }
    }

    // Apply new transaction effects on customer
    if (updatedTx.customerId) {
      const newCust = data.customers.find((c) => c.id === updatedTx.customerId);
      if (newCust) {
        newCust.totalPurchased += updatedTx.grandTotal;
        newCust.currentBalance += updatedTx.balanceDue;
      }
    }

    // Adjust stock inventory if items or quantities changed
    for (const oldItem of oldTx.items) {
      const stockObj = data.stock.find((s) => s.id === oldItem.stockId);
      if (stockObj) {
        stockObj.stockQty += oldItem.qty; // return old qty
      }
    }
    for (const newItem of updatedTx.items) {
      const stockObj = data.stock.find((s) => s.id === newItem.stockId);
      if (stockObj) {
        stockObj.stockQty = Math.max(0, stockObj.stockQty - newItem.qty);
        stockObj.updatedAt = new Date().toISOString();
      }
    }

    data.transactions[idx] = { ...updatedTx };
    this.saveData(data);
    return data.transactions[idx];
  }

  // Delete sales transaction
  public static deleteTransaction(id: string): boolean {
    const data = this.loadData();
    const idx = data.transactions.findIndex((t) => t.id === id);
    if (idx === -1) return false;

    const oldTx = data.transactions[idx];

    // Revert stock
    for (const item of oldTx.items) {
      const stockObj = data.stock.find((s) => s.id === item.stockId);
      if (stockObj) {
        stockObj.stockQty += item.qty;
      }
    }

    // Revert customer balance
    if (oldTx.customerId) {
      const cust = data.customers.find((c) => c.id === oldTx.customerId);
      if (cust) {
        cust.totalPurchased = Math.max(0, cust.totalPurchased - oldTx.grandTotal);
        cust.currentBalance = Math.max(0, cust.currentBalance - oldTx.balanceDue);
      }
    }

    data.transactions.splice(idx, 1);
    this.saveData(data);
    return true;
  }

  // Update existing bill receipt / payment collection
  public static updateBillReceipt(updatedReceipt: BillReceipt): BillReceipt {
    const data = this.loadData();
    const idx = data.billReceipts.findIndex((r) => r.id === updatedReceipt.id);
    if (idx === -1) {
      throw new Error('Receipt not found: ' + updatedReceipt.id);
    }

    const oldRcpt = data.billReceipts[idx];

    // Revert old receipt from customer
    if (oldRcpt.customerId) {
      const oldCust = data.customers.find((c) => c.id === oldRcpt.customerId);
      if (oldCust) {
        oldCust.currentBalance += oldRcpt.amountPaid;
      }
    }

    // Apply new receipt to customer
    if (updatedReceipt.customerId) {
      const newCust = data.customers.find((c) => c.id === updatedReceipt.customerId);
      if (newCust) {
        newCust.currentBalance = Math.max(0, newCust.currentBalance - updatedReceipt.amountPaid);
        updatedReceipt.balanceRemaining = newCust.currentBalance;
      }
    }

    data.billReceipts[idx] = { ...updatedReceipt };
    this.saveData(data);
    return data.billReceipts[idx];
  }

  // Delete bill receipt
  public static deleteBillReceipt(id: string): boolean {
    const data = this.loadData();
    const idx = data.billReceipts.findIndex((r) => r.id === id);
    if (idx === -1) return false;

    const oldRcpt = data.billReceipts[idx];
    if (oldRcpt.customerId) {
      const cust = data.customers.find((c) => c.id === oldRcpt.customerId);
      if (cust) {
        cust.currentBalance += oldRcpt.amountPaid;
      }
    }

    data.billReceipts.splice(idx, 1);
    this.saveData(data);
    return true;
  }

  // Against-Bill Receipts starting from 1079
  public static createBillReceipt(receiptData: {
    customerId: string;
    customerName: string;
    invoiceNo?: string;
    amountPaid: number;
    paymentMode: 'Cash' | 'UPI' | 'Cheque' | 'Card';
    remarks?: string;
    handledBy: string;
  }): BillReceipt {
    const data = this.loadData();

    // Determine receipt number (at least 1079)
    let nextNum = data.settings.nextReceiptNo || 1079;
    if (data.billReceipts.length > 0) {
      const highestExisting = Math.max(...data.billReceipts.map((r) => r.receiptNo));
      if (highestExisting >= nextNum) {
        nextNum = highestExisting + 1;
      }
    }

    const customer = data.customers.find((c) => c.id === receiptData.customerId);
    const prevBalance = customer ? customer.currentBalance : 0;
    const newBalance = Math.max(0, prevBalance - receiptData.amountPaid);

    if (customer) {
      customer.currentBalance = newBalance;
    }

    const newReceipt: BillReceipt = {
      id: 'rec-' + nextNum,
      receiptNo: nextNum,
      customerId: receiptData.customerId,
      customerName: receiptData.customerName,
      invoiceNo: receiptData.invoiceNo,
      amountPaid: receiptData.amountPaid,
      date: new Date().toISOString(),
      paymentMode: receiptData.paymentMode,
      balanceRemaining: newBalance,
      remarks: receiptData.remarks,
      handledBy: receiptData.handledBy,
    };

    data.billReceipts.unshift(newReceipt);
    data.settings.nextReceiptNo = nextNum + 1;
    this.saveData(data);
    return newReceipt;
  }

  // 30-Month Card Scheme
  public static addCardMember(
    member: Omit<CardMember, 'id' | 'totalPaidMonths' | 'totalAmountPaid' | 'status'>
  ): CardMember {
    const data = this.loadData();
    const newMember: CardMember = {
      ...member,
      id: 'cm-' + Date.now(),
      status: 'Active',
      totalPaidMonths: 0,
      totalAmountPaid: 0,
    };
    data.cardMembers.unshift(newMember);
    this.saveData(data);
    return newMember;
  }

  public static updateCardMember(id: string, updates: Partial<CardMember>): CardMember | null {
    const data = this.loadData();
    const index = data.cardMembers.findIndex((m) => m.id === id);
    if (index !== -1) {
      data.cardMembers[index] = { ...data.cardMembers[index], ...updates };
      this.saveData(data);
      return data.cardMembers[index];
    }
    return null;
  }

  /**
   * Delete card member with complete backend rollback:
   * 1. Removes or archives card from cardMembers
   * 2. Finds and removes all related cardTransactions, rolling back agent collections & commissions
   * 3. Recounts store stats
   */
  public static deleteCardMember(id: string): { success: boolean; rolledBackAmount: number; rolledBackTransactions: number } {
    const data = this.loadData();
    const index = data.cardMembers.findIndex((m) => m.id === id);
    if (index === -1) {
      return { success: false, rolledBackAmount: 0, rolledBackTransactions: 0 };
    }

    const memberToDelete = data.cardMembers[index];
    // Find all transactions associated with this card
    const relatedTxs = data.cardTransactions.filter(
      (tx) => tx.cardMemberId === id || (memberToDelete.cardNo && tx.cardNo === memberToDelete.cardNo)
    );
    const rolledBackAmount = relatedTxs.reduce((sum, tx) => sum + (tx.amount || 0), 0);
    const rolledBackTransactions = relatedTxs.length;

    // Remove transactions to rollback collection balances and agent commissions
    data.cardTransactions = data.cardTransactions.filter(
      (tx) => tx.cardMemberId !== id && (!memberToDelete.cardNo || tx.cardNo !== memberToDelete.cardNo)
    );

    // Remove card member
    data.cardMembers.splice(index, 1);

    this.saveData(data);
    return { success: true, rolledBackAmount, rolledBackTransactions };
  }

  public static collectCardInstallment(collection: {
    cardMemberId: string;
    monthNumber: number;
    amount: number;
    paymentMode: 'Cash' | 'UPI' | 'Bank Transfer';
    collectedBy: string;
    receiptNo?: string;
    weekNumber?: number;
    remarks?: string;
  }): CardTransaction {
    const data = this.loadData();
    const member = data.cardMembers.find((m) => m.id === collection.cardMemberId);

    if (member) {
      member.totalPaidMonths += 1;
      member.totalAmountPaid += collection.amount;
      if (member.totalPaidMonths >= member.durationMonths) {
        member.status = 'Matured';
      }
    }

    const receiptNum = 2800 + data.cardTransactions.length + 1;
    const finalReceiptNo = collection.receiptNo && collection.receiptNo.trim().length > 0
      ? collection.receiptNo.trim()
      : `REC-${member ? member.cardNo.replace(/\D/g, '') || 'CARD' : 'CARD'}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newCardTx: CardTransaction = {
      id: 'ct-' + Date.now(),
      receiptNo: finalReceiptNo,
      cardMemberId: collection.cardMemberId,
      cardNo: member ? member.cardNo : '',
      memberName: member ? member.memberName : '',
      monthNumber: collection.monthNumber,
      weekNumber: collection.weekNumber || collection.monthNumber,
      amount: collection.amount,
      date: new Date().toISOString(),
      paymentMode: collection.paymentMode,
      collectedBy: collection.collectedBy,
      remarks: collection.remarks,
    };

    data.cardTransactions.unshift(newCardTx);
    this.saveData(data);
    return newCardTx;
  }

  // Village & Beat Directory Management
  public static getVillages(): string[] {
    const DEFAULT_VILLAGES = [
      'Wardha (वर्धा)',
      'Seloo (सेलू)',
      'Deoli (देवळी)',
      'Pulgaon (पुलगाव)',
      'Arvi (आर्वी)',
      'Hinganghat (हिंगणघाट)',
      'Samudrapur (समुद्रपूर)',
      'Karanja Ghadge (कारंजा घाडगे)',
      'Sevagram (सेवाग्राम)',
      'Pavnar (पवनार)',
      'Borgaon Meghe (बोरगाव मेघे)',
      'Sawangi Meghe (सावंगी मेघे)',
      'Pipri (पिपरी)',
      'Anji Mothi (आंजी मोठी)',
      'Sindi Railway (सिंदी रेल्वे)',
      'Nachangaon (नाचनगाव)',
      'Talegaon (तळेगाव)',
      'Rohana (रोहणा)',
    ];

    try {
      const customSaved = localStorage.getItem('shri_sai_villages_list_v1');
      const customList: string[] = customSaved ? JSON.parse(customSaved) : [];

      // Also gather any villages present in card members
      const data = this.loadData();
      const existingInMembers = data.cardMembers
        .map((m) => m.village?.trim())
        .filter((v): v is string => Boolean(v && v.length > 1));

      const set = new Set<string>([...DEFAULT_VILLAGES, ...customList, ...existingInMembers]);
      return Array.from(set).sort((a, b) => a.localeCompare(b));
    } catch {
      return DEFAULT_VILLAGES;
    }
  }

  public static addVillage(newVillage: string): string[] {
    const trimmed = newVillage.trim();
    if (!trimmed) return this.getVillages();

    try {
      const customSaved = localStorage.getItem('shri_sai_villages_list_v1');
      const customList: string[] = customSaved ? JSON.parse(customSaved) : [];
      if (!customList.includes(trimmed)) {
        customList.push(trimmed);
        localStorage.setItem('shri_sai_villages_list_v1', JSON.stringify(customList));
      }
    } catch (e) {
      console.error('Failed to persist village:', e);
    }
    return this.getVillages();
  }

  // Customer Management
  public static addCustomer(cust: Omit<Customer, 'id' | 'currentBalance' | 'totalPurchased' | 'createdAt'>): Customer {
    const data = this.loadData();
    const newCust: Customer = {
      ...cust,
      id: 'cust-' + Date.now(),
      currentBalance: 0,
      totalPurchased: 0,
      createdAt: new Date().toISOString(),
    };
    data.customers.unshift(newCust);
    this.saveData(data);
    return newCust;
  }

  public static updateCustomer(id: string, updates: Partial<Customer>): Customer | null {
    const data = this.loadData();
    const idx = data.customers.findIndex((c) => c.id === id);
    if (idx === -1) return null;

    data.customers[idx] = {
      ...data.customers[idx],
      ...updates,
    };

    // If name or phone changed, sync transactions & receipts
    if (updates.name || updates.phone) {
      const updatedName = data.customers[idx].name;
      const updatedPhone = data.customers[idx].phone;
      data.transactions.forEach((tx) => {
        if (tx.customerId === id) {
          if (updates.name) tx.customerName = updatedName;
          if (updates.phone) tx.customerPhone = updatedPhone;
        }
      });
      data.billReceipts.forEach((rc) => {
        if (rc.customerId === id) {
          if (updates.name) rc.customerName = updatedName;
        }
      });
    }

    this.saveData(data);
    return data.customers[idx];
  }

  public static deleteCustomer(id: string): boolean {
    const data = this.loadData();
    const initialLen = data.customers.length;
    data.customers = data.customers.filter((c) => c.id !== id);
    if (data.customers.length !== initialLen) {
      this.saveData(data);
      return true;
    }
    return false;
  }

  // Recalculate and audit customer balance directly from actual invoices and receipts
  public static recalculateCustomerBalance(customerId: string): { totalPurchased: number; currentBalance: number } | null {
    const data = this.loadData();
    const cust = data.customers.find((c) => c.id === customerId);
    if (!cust) return null;

    const custPhone = cust.phone ? cust.phone.replace(/[^0-9]/g, '') : '';
    const custName = cust.name.trim().toLowerCase();
    const isValidCustPhone = Boolean(
      custPhone &&
      custPhone.length >= 10 &&
      custPhone !== '9822000000' &&
      custPhone !== '0000000000' &&
      !/^0+$/.test(custPhone)
    );

    // Find all matching transactions
    const custTransactions = data.transactions.filter((t) => {
      if (t.customerId && t.customerId === customerId) return true;

      const txPhone = t.customerPhone ? t.customerPhone.replace(/[^0-9]/g, '') : '';
      const isValidTxPhone = Boolean(
        txPhone &&
        txPhone.length >= 10 &&
        txPhone !== '9822000000' &&
        txPhone !== '0000000000' &&
        !/^0+$/.test(txPhone)
      );

      if (isValidCustPhone && isValidTxPhone) {
        if (custPhone.slice(-10) === txPhone.slice(-10)) return true;
      }

      const tName = (t.customerName || '').trim().toLowerCase();
      if (
        custName.length > 2 &&
        tName === custName &&
        !['cash', 'counter', 'रोख', 'walk-in', 'customer', 'ग्राहक'].includes(custName)
      ) {
        if (isValidCustPhone && isValidTxPhone && custPhone.slice(-10) !== txPhone.slice(-10)) {
          return false;
        }
        return true;
      }

      return false;
    });

    // Find all matching receipts
    const custReceipts = data.billReceipts.filter((r) => {
      const matchId = r.customerId === customerId;
      const matchName = r.customerName && r.customerName.trim().toLowerCase() === custName;
      return matchId || matchName;
    });

    // Calculate actuals
    const calcPurchased = custTransactions.reduce((acc, t) => acc + (t.grandTotal || 0), 0);
    const invoiceDues = custTransactions.reduce((acc, t) => acc + (t.balanceDue || 0), 0);
    const receiptsPaid = custReceipts.reduce((acc, r) => acc + (r.amountPaid || 0), 0);

    // If transactions exist, net balance is remaining dues on transactions minus standalone receipts
    let calcBalance = 0;
    if (custTransactions.length > 0) {
      calcBalance = Math.max(0, invoiceDues - receiptsPaid);
    } else {
      // If customer was imported without transactions, keep current or 0
      calcBalance = Math.max(0, cust.currentBalance - receiptsPaid);
    }

    cust.totalPurchased = calcPurchased > 0 ? calcPurchased : cust.totalPurchased;
    cust.currentBalance = calcBalance;

    this.saveData(data);
    return { totalPurchased: cust.totalPurchased, currentBalance: cust.currentBalance };
  }

  // Expenses
  public static addExpense(exp: Omit<Expense, 'id' | 'voucherNo'>): Expense {
    const data = this.loadData();
    const todayStr = new Date().toISOString().slice(5, 10).replace('-', '');
    const voucherNo = `VOU-${todayStr}-${String(data.expenses.length + 1).padStart(2, '0')}`;
    const newExp: Expense = {
      ...exp,
      id: 'exp-' + Date.now(),
      voucherNo,
    };
    data.expenses.unshift(newExp);
    this.saveData(data);
    return newExp;
  }

  // Staff & Advances
  public static addStaff(stf: Omit<Staff, 'id'>): Staff {
    const data = this.loadData();
    const newStaff: Staff = {
      ...stf,
      id: 'stf-' + Date.now(),
    };
    data.staff.push(newStaff);
    this.saveData(data);
    return newStaff;
  }

  public static updateStaff(id: string, updates: Partial<Staff>): { success: boolean; staff?: Staff; error?: string } {
    const data = this.loadData();
    const index = data.staff.findIndex((s) => s.id === id);
    if (index === -1) {
      return { success: false, error: 'Staff member not found.' };
    }

    // Phone duplicate validation - allows update if phone belongs to the same staff member
    if (updates.phone) {
      const cleanPhone = updates.phone.trim();
      const existingPhoneCollision = data.staff.find((s) => s.id !== id && s.phone.trim() === cleanPhone);
      if (existingPhoneCollision) {
        return { success: false, error: `Mobile number already registered to ${existingPhoneCollision.name}.` };
      }
    }

    data.staff[index] = {
      ...data.staff[index],
      ...updates,
    };

    this.saveData(data);
    return { success: true, staff: data.staff[index] };
  }

  public static deleteStaff(id: string): boolean {
    const data = this.loadData();
    const initialLen = data.staff.length;
    data.staff = data.staff.filter((s) => s.id !== id);
    if (data.staff.length !== initialLen) {
      this.saveData(data);
      return true;
    }
    return false;
  }

  public static addAgentAdvance(adv: Omit<AgentAdvance, 'id'>): AgentAdvance {
    const data = this.loadData();
    const newAdv: AgentAdvance = {
      ...adv,
      id: 'adv-' + Date.now(),
    };
    data.agentAdvances.unshift(newAdv);
    this.saveData(data);
    return newAdv;
  }

  // Admin / Staff User Management & Approvals
  public static addAdminUser(newUser: Omit<AdminUser, 'id'>): AdminUser {
    const data = this.loadData();
    if (!data.adminUsers) data.adminUsers = [];
    const user: AdminUser = {
      ...newUser,
      id: 'usr-' + Date.now(),
      status: newUser.status || 'pending',
      createdAt: newUser.createdAt || new Date().toISOString(),
    };
    data.adminUsers.push(user);
    this.saveData(data);
    return user;
  }

  public static approveAdminUser(userId: string, approvedBy = 'Owner / Admin'): boolean {
    const data = this.loadData();
    if (!data.adminUsers) return false;
    const idx = data.adminUsers.findIndex((u) => u.id === userId);
    if (idx !== -1) {
      data.adminUsers[idx].status = 'active';
      data.adminUsers[idx].approvedBy = approvedBy;
      this.saveData(data);
      return true;
    }
    return false;
  }

  public static rejectAdminUser(userId: string): boolean {
    const data = this.loadData();
    if (!data.adminUsers) return false;
    const idx = data.adminUsers.findIndex((u) => u.id === userId);
    if (idx !== -1) {
      data.adminUsers[idx].status = 'rejected';
      this.saveData(data);
      return true;
    }
    return false;
  }

  public static deleteAdminUser(userId: string): boolean {
    const data = this.loadData();
    if (!data.adminUsers) return false;
    data.adminUsers = data.adminUsers.filter((u) => u.id !== userId);
    this.saveData(data);
    return true;
  }

  // Settings
  public static updateSettings(settings: StoreSettings): void {
    const data = this.loadData();
    data.settings = settings;
    this.saveData(data);
  }

  // Export JSON Database
  public static exportDatabaseJSON(): string {
    const data = this.loadData();
    return JSON.stringify(data, null, 2);
  }

  // Export ZIP Backup containing database JSON, summary, and stock catalog
  public static async exportBackupZIP(): Promise<Blob> {
    const data = this.loadData();
    const zip = new JSZip();

    // 1. Full database JSON
    zip.file('shri-sai-enterprises-db.json', JSON.stringify(data, null, 2));

    // 2. Inventory CSV
    const stockCsvRows = [
      ['Code', 'Name', 'Category', 'Brand', 'Model', 'Serial No', 'Purchase Price', 'Sale Price', 'Stock Qty', 'Unit'].join(','),
      ...data.stock.map((s) =>
        [
          `"${s.code}"`,
          `"${s.name.replace(/"/g, '""')}"`,
          `"${s.category}"`,
          `"${s.brand}"`,
          `"${s.model || ''}"`,
          `"${s.serialNo || ''}"`,
          s.purchasePrice,
          s.salePrice,
          s.stockQty,
          `"${s.unit}"`,
        ].join(',')
      ),
    ];
    zip.file('inventory_stock.csv', stockCsvRows.join('\n'));

    // 3. Customers CSV
    const custCsvRows = [
      ['ID', 'Name', 'Phone', 'Address', 'City', 'Due Balance', 'Total Purchases'].join(','),
      ...data.customers.map((c) =>
        [
          `"${c.id}"`,
          `"${c.name.replace(/"/g, '""')}"`,
          `"${c.phone}"`,
          `"${c.address.replace(/"/g, '""')}"`,
          `"${c.city}"`,
          c.currentBalance,
          c.totalPurchased,
        ].join(',')
      ),
    ];
    zip.file('customers_ledger.csv', custCsvRows.join('\n'));

    // 4. Scheme Members CSV
    const schemeCsvRows = [
      ['Card No', 'Member Name', 'Phone', 'Months Paid', 'Total Deposited', 'Status'].join(','),
      ...data.cardMembers.map((m) =>
        [
          `"${m.cardNo}"`,
          `"${m.memberName.replace(/"/g, '""')}"`,
          `"${m.phone}"`,
          m.totalPaidMonths,
          m.totalAmountPaid,
          `"${m.status}"`,
        ].join(',')
      ),
    ];
    zip.file('savings_scheme_members.csv', schemeCsvRows.join('\n'));

    // Generate blob
    return await zip.generateAsync({ type: 'blob' });
  }

  // Import Database
  public static importDatabase(jsonData: string): boolean {
    try {
      const parsed = JSON.parse(jsonData) as StoreData;
      if (parsed.settings && Array.isArray(parsed.stock) && Array.isArray(parsed.customers)) {
        this.saveData(parsed);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Import error:', e);
      return false;
    }
  }
}
