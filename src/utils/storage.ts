import {
  BusinessSettings,
  CardMember,
  CardSchemeConfig,
  CardSchemeId,
  CardTransaction,
  Customer,
  Dealer,
  DealerPayment,
  ExpenseEntry,
  PurchaseEntry,
  StaffMember,
  StockItem,
  TransactionEntry,
  AgentAdvance,
  BillReceiptEntry
} from '../types';
import { saveDatabaseToIndexedDB } from './indexedDb';

export const STORAGE_KEY = 'shri_sai_enterprise_db';

export const DEFAULT_SETTINGS: BusinessSettings = {
  businessName: 'Shri Sai Enterprises',
  businessNameHindi: 'श्री साई इंटरप्राइजेस',
  domainName: 'ShriSaiEnt.in',
  ownerName: 'Shubham',
  role: 'Admin',
  phone: '8766486915',
  additionalPhones: ['8600122798', '9175534365', '7822859073'],
  email: 'shubhamh3098@gmail.com',
  gstin: '27ALOPL0030G2ZC',
  address: 'Matoshree Sabhagruha Samor, Arvi Road, Punjab Colony, Wardha, 442001',
  addressHindi: 'मातोश्री सभागृह समोर आर्वी रोड पंजाब कॉलनी वर्धा ,442001',
  invoicePrefix: 'INV-2026-',
  currency: '₹',
  tagline: 'Electronics, Home Appliances & Contemporary Furniture Showroom',
  deliveryRates: {
    freeDeliveryMinAmount: 3000,
    localDeliveryFee: 100,
    outerDeliveryFee: 250,
    estimatedDeliveryTime: 'Same Day / 24 Hours',
    deliveryAreas: 'Wardha City, Arvi, and All Surrounding Villages (50 km)',
    deliveryNote: 'Free home delivery on orders above ₹3,000 and all Card Scheme major appliances & furniture.',
  },
  shopNotice: 'Shri Sai Electronics & Furniture: 30-Month Weekly Savings Scheme enrollment open • Free delivery across Wardha district!',
  whatsappOrderNumber: '8766486915',
  whatsappSecondaryNumber: '8600122798',
  bankDetails: {
    bankName: 'HDFC Bank',
    accountNumber: '50200083215914',
    ifsc: 'HDFC0000965',
    branch: 'OPP.BANK OF MAHARASHTRA WARDHA 442001',
  },
  warrantyDisclaimer: 'दिलेली वॉरंटी ही दुकानदाराची नसून कंपनीची आहे. म्हणून वस्तूत काही बिघाड आल्यास त्याला दुकानदार जबाबदार नसून कंपनी आहे. तेव्हा कृपया वस्तू घेतेवेळेस कंपनीच्या सर्व्हिस सेण्टरचा मोबाईल नंबर घ्यावा.',
  adminPassword: 'admin',
  staffPassword: 'staff',
};

export const SCHEMES_CONFIG: CardSchemeConfig[] = [
  {
    id: 'scheme1',
    name: 'Scheme 1 (योजना 1)',
    code: 'SCH-1',
    startCardNo: 1001,
    endCardNo: 3000,
    registrationFee: 50,
    description: '३०-महिने साप्ताहिक बचत योजना 1 • कार्ड नं 1001 ते 3000 • होम अप्लायंसेज',
    color: 'from-blue-600 to-blue-800',
  },
  {
    id: 'scheme2',
    name: 'Scheme 2 (योजना 2)',
    code: 'SCH-2',
    startCardNo: 1001,
    endCardNo: 3000,
    registrationFee: 50,
    description: '३०-महिने साप्ताहिक बचत योजना 2 • कार्ड नं 1001 ते 3000 • कुलर, फ्रिज, वॉशिंग मशीन',
    color: 'from-emerald-600 to-teal-800',
  },
  {
    id: 'scheme3',
    name: 'Scheme 3 (योजना 3)',
    code: 'SCH-3',
    startCardNo: 1001,
    endCardNo: 6000,
    registrationFee: 50,
    description: '३०-महिने साप्ताहिक बचत योजना 3 • कार्ड नं 1001 ते 6000 • स्मार्ट टीव्ही, एलईडी व इलेक्ट्रॉनिक्स',
    color: 'from-purple-600 to-indigo-800',
  },
  {
    id: 'scheme4',
    name: 'Scheme 4 (योजना 4)',
    code: 'SCH-4',
    startCardNo: 1001,
    endCardNo: 6000,
    registrationFee: 50,
    description: '३०-महिने साप्ताहिक बचत योजना 4 • कार्ड नं 1001 ते 6000',
    color: 'from-amber-600 to-orange-800',
  },
  {
    id: 'scheme5',
    name: 'Scheme 5 (योजना 5)',
    code: 'SCH-5',
    startCardNo: 1001,
    endCardNo: 6000,
    registrationFee: 50,
    description: '३०-महिने साप्ताहिक बचत योजना 5 (भविष्य योजना) • कार्ड नं 1001 ते 6000',
    color: 'from-rose-600 to-pink-800',
  },
];


export const INITIAL_STOCK: StockItem[] = [];

export const INITIAL_CUSTOMERS: Customer[] = [];

export const INITIAL_TRANSACTIONS: TransactionEntry[] = [];

export const INITIAL_PURCHASES: PurchaseEntry[] = [
  {
    id: 'pur-manisha-01604',
    billNo: 'CS/2526/01604',
    date: '2026-02-25',
    supplierName: 'MANISHA ENTERPRISES',
    supplierAddress: 'INGOLE CHOWK MAIN ROAD WARDHA 442001 MAHARASHTRA INDIA',
    supplierPhone: '9766911693',
    supplierGstin: '27ABDPB8956C1ZS',
    supplierState: 'MAHARASHTRA',
    buyerName: 'SHRI SAI ENTERPRISES-LG-WARDHA[NEW]',
    buyerGstin: '27ALOPL0030G2ZC',
    buyerAddress: 'WARD NO 1, NEAR DATEY SABHAGRUH, Arvi Road, WARDHA 442001 MAHARASHTRA',
    poNo: 'CSSO2526-00579',
    poDate: '23/02/2026',
    location: 'LG DISTRIBUTION',
    salesConsultant: 'DHIRAJ BHOWARE',
    approvedBy: 'ARTI INGOLE',
    transporter: 'GENERAL TRANSPORT',
    items: 'LG GLT2216WYRI (2 Pcs)',
    itemsDetail: [
      {
        id: 'pi-1',
        description: 'LG GLT2216WYRI',
        hsn: '84182100',
        qty: 2,
        rate: 21592,
        discount: 0,
        taxableAmount: 43183,
        taxRate: 18,
        cgstRate: 9,
        cgstAmount: 3886.48,
        sgstRate: 9,
        sgstAmount: 3886.48,
        taxAmount: 7772.95,
        totalAmount: 50956,
        serialNumbers: ['602NRZX294301', '602NRQV293652'],
      },
    ],
    subtotal: 43183,
    cgstAmount: 3886.48,
    sgstAmount: 3886.48,
    totalTax: 7772.95,
    totalAmount: 50956,
    paidAmount: 0,
    status: 'Pending',
    paymentMode: 'Online',
    supplierBank: {
      accountName: 'MANISHA ENTERPRISE',
      accountNo: '108051000302',
      ifscCode: 'ICIC0001080',
      bankName: 'ICICI BANK',
      branch: 'SHIVAJI CHOWK, ARVI ROAD, WARDHA',
    },
    notes: 'LG Refrigerator Procurement • Serial Nos: 602NRZX294301, 602NRQV293652',
    autoUpdateStock: true,
  },
];

export const CORE_AGENTS = [
  { name: 'Shubham Shende', marathiName: 'शुभम शेंडे', phone: '8766486915' },
  { name: 'Bhushan Lidbe', marathiName: 'भूषण लिडबे', phone: '8600122798' },
  { name: 'Suraj Pendam', marathiName: 'सुरज पेंदाम', phone: '9175534365' },
  { name: 'Ninad Hole', marathiName: 'निनाद होले', phone: '7822859073' },
];

export const INITIAL_STAFF: StaffMember[] = [
  {
    id: "stf-shubham",
    name: "Shubham Shende",
    role: "Field Collection Agent (शुभम शेंडे)",
    phone: "8766486915",
    salary: 15000,
    advancePaid: 0,
    attendanceToday: 'Present',
  },
  {
    id: "stf-bhushan",
    name: "Bhushan Lidbe",
    role: "Field Collection Agent (भूषण लिडबे)",
    phone: "8600122798",
    salary: 15000,
    advancePaid: 0,
    attendanceToday: 'Present',
  },
  {
    id: "stf-suraj",
    name: "Suraj Pendam",
    role: "Field Collection Agent (सुरज पेंदाम)",
    phone: "9175534365",
    salary: 15000,
    advancePaid: 0,
    attendanceToday: 'Present',
  },
  {
    id: "stf-ninad",
    name: "Ninad Hole",
    role: "Field Collection Agent (निनाद होले)",
    phone: "7822859073",
    salary: 15000,
    advancePaid: 0,
    attendanceToday: 'Present',
  }
];

export const INITIAL_EXPENSES: ExpenseEntry[] = [];

export const INITIAL_DEALERS: Dealer[] = [];

export const INITIAL_DEALER_PAYMENTS: DealerPayment[] = [];

export const INITIAL_CARD_MEMBERS: CardMember[] = [];

export const INITIAL_CARD_TRANSACTIONS: CardTransaction[] = [];

export interface AppDatabase {
  settings: BusinessSettings;
  stock: StockItem[];
  customers: Customer[];
  transactions: TransactionEntry[];
  purchases: PurchaseEntry[];
  dealers: Dealer[];
  dealerPayments: DealerPayment[];
  cardMembers: CardMember[];
  cardTransactions: CardTransaction[];
  staff: StaffMember[];
  expenses: ExpenseEntry[];
  agentAdvances: AgentAdvance[];
  billReceipts?: BillReceiptEntry[];
}

export function loadDatabase(): AppDatabase {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const rawSettings = parsed.settings || {};
      const isOldPlaceholder = !rawSettings.gstin || rawSettings.gstin === '27AABCS1429B1Z8' || rawSettings.phone === '+91 98765 43210';
      const mergedSettings: BusinessSettings = isOldPlaceholder
        ? { ...DEFAULT_SETTINGS, ...rawSettings, ...DEFAULT_SETTINGS }
        : { ...DEFAULT_SETTINGS, ...rawSettings };

      // Ensure active 30-month scheme notice and dual WhatsApp numbers
      if (!mergedSettings.shopNotice || mergedSettings.shopNotice.includes('13-महीने') || mergedSettings.shopNotice.includes('13-महिने')) {
        mergedSettings.shopNotice = 'श्री साई इंटरप्राइजेस: ३०-महिने साप्ताहिक बचत कार्ड योजना बुकिंग चालू आहे • सर्व मोठ्या वस्तूंवर फ्री होम डिलिव्हरी!';
      }
      mergedSettings.whatsappOrderNumber = '8766486915';
      mergedSettings.whatsappSecondaryNumber = '8600122798';
      if (!mergedSettings.additionalPhones || mergedSettings.additionalPhones.includes('8600122978')) {
        mergedSettings.additionalPhones = ['8600122798', '9175534365', '7822859073'];
      }

      const demoStockIds = new Set(['stk-tv32', 'stk-tv43', 'stk-fridge', 'stk-cooler', 'stk-wm', 'stk-fan', 'stk-1', 'stk-2', 'stk-6', 'stk-bed1', 'stk-dining1', 'stk-wardrobe1', 'stk-recliner1']);
      const loadedStock: StockItem[] = Array.isArray(parsed.stock)
        ? parsed.stock.filter((item: StockItem) => !demoStockIds.has(item.id))
        : [];

      const demoCustIds = new Set(['cust-1', 'cust-2', 'cust-3', 'cust-4']);
      const loadedCustomers: Customer[] = Array.isArray(parsed.customers)
        ? parsed.customers
            .filter((c: Customer) => !demoCustIds.has(c.id))
            .map((c: Customer) => {
              const purchased = Number(c.totalPurchased || 0);
              const paid = Number(c.totalPaid || 0);
              const due = Number(c.balanceDue || 0);
              if (purchased === 0 && (paid > 0 || due > 0)) {
                return {
                  ...c,
                  totalPurchased: paid + due,
                };
              }
              return c;
            })
        : [];

      const demoTxIds = new Set(['tx-1', 'tx-2', 'tx-3']);
      const loadedTransactions: TransactionEntry[] = Array.isArray(parsed.transactions)
        ? parsed.transactions.filter((t: TransactionEntry) => !demoTxIds.has(t.id))
        : [];

      const demoPurIds = new Set(['pur-manisha-1', 'pur-manisha-2', 'pur-1', 'pur-2']);
      const loadedPurchases: PurchaseEntry[] = Array.isArray(parsed.purchases)
        ? parsed.purchases.filter((p: PurchaseEntry) => !demoPurIds.has(p.id))
        : [];

      const demoDlrIds = new Set(['dlr-1', 'dlr-2', 'dlr-3']);
      const loadedDealers: Dealer[] = Array.isArray(parsed.dealers)
        ? parsed.dealers.filter((d: Dealer) => !demoDlrIds.has(d.id))
        : [];

      const demoDpIds = new Set(['dp-1', 'dp-2', 'dp-3', 'dp-4']);
      const loadedDealerPayments: DealerPayment[] = Array.isArray(parsed.dealerPayments)
        ? parsed.dealerPayments.filter((dp: DealerPayment) => !demoDpIds.has(dp.id))
        : [];

      const demoCardTxIds = new Set(['ctx-1', 'ctx-2', 'ctx-3', 'ctx-4', 'ctx-5']);
      const loadedCardTransactions: CardTransaction[] = Array.isArray(parsed.cardTransactions)
        ? parsed.cardTransactions.filter((ctx: CardTransaction) => !demoCardTxIds.has(ctx.id) && ctx.customerName !== 'Prakash Shinde')
        : [];

      const demoExpIds = new Set(['exp-1', 'exp-2', 'exp-3', 'exp-4', 'exp-5']);
      const loadedExpenses: ExpenseEntry[] = Array.isArray(parsed.expenses)
        ? parsed.expenses.filter((e: ExpenseEntry) => !demoExpIds.has(e.id))
        : [];

      // Ensure the 4 primary agents always exist in staff
      const rawStaff: StaffMember[] = Array.isArray(parsed.staff) && parsed.staff.length > 0
        ? parsed.staff.filter((s: StaffMember) => s.name !== 'Rahul Sharma')
        : [];
      INITIAL_STAFF.forEach((agent) => {
        if (!rawStaff.some((s) => s.name.toLowerCase() === agent.name.toLowerCase())) {
          rawStaff.push(agent);
        }
      });
      const loadedStaff = rawStaff;

      const finalPurchases = loadedPurchases.length > 0 ? loadedPurchases : INITIAL_PURCHASES;
      const finalDealers = loadedDealers.length > 0
        ? loadedDealers
        : [
            {
              id: 'dlr-manisha-lg',
              name: 'MANISHA ENTERPRISES',
              phone: '9766911693',
              totalPurchases: 50956,
              totalPaid: 0,
              balanceDue: 50956,
              lastTransactionDate: '2026-02-25',
            },
          ];

      return {
        settings: mergedSettings,
        stock: loadedStock,
        customers: loadedCustomers,
        transactions: loadedTransactions,
        purchases: finalPurchases,
        dealers: finalDealers,
        dealerPayments: loadedDealerPayments,
        cardMembers: Array.isArray(parsed.cardMembers)
        ? parsed.cardMembers.filter((cm: CardMember) => !["cm-1030", "cm-1029", "cm-1021", "cm-1081", "cm-4181", "cm-4302", "cm-4349", "cm-4352", "cm-4398", "cm-4393", "cm-4049"].includes(cm.id))
        : [],
        cardTransactions: loadedCardTransactions,
        staff: loadedStaff,
        expenses: loadedExpenses,
        agentAdvances: Array.isArray(parsed.agentAdvances) ? parsed.agentAdvances : [],
        billReceipts: Array.isArray(parsed.billReceipts) ? parsed.billReceipts : [],
      };
    }
  } catch (e) {
    console.error('Failed to parse database from localStorage', e);
  }
  return {
    settings: DEFAULT_SETTINGS,
    stock: INITIAL_STOCK,
    customers: [],
    transactions: [],
    purchases: [],
    dealers: [],
    dealerPayments: [],
    cardMembers: [],
    cardTransactions: [],
    staff: INITIAL_STAFF,
    expenses: [],
    agentAdvances: [],
    billReceipts: [],
  };
}

export function clearAllDemoData(currentDb: AppDatabase): AppDatabase {
  const clean: AppDatabase = {
    settings: currentDb.settings || DEFAULT_SETTINGS,
    stock: [],
    customers: [],
    transactions: [],
    purchases: [],
    dealers: [],
    dealerPayments: [],
    cardMembers: [],
    cardTransactions: [],
    staff: currentDb.staff && currentDb.staff.length > 0 ? currentDb.staff : INITIAL_STAFF,
    expenses: [],
    agentAdvances: [],
  };
  saveDatabase(clean);
  return clean;
}

export function saveDatabase(db: AppDatabase): void {
  // 1. Always save the complete database to IndexedDB (unlimited storage)
  saveDatabaseToIndexedDB(db).catch((err) => {
    console.warn('IndexedDB save notice:', err);
  });

  // 2. Try saving to localStorage. If quota is exceeded, gracefully fall back to saving
  // critical core configuration and summary so app never crashes or errors out.
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (e: any) {
    const isQuota =
      e?.name === 'QuotaExceededError' ||
      e?.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      e?.message?.includes('quota') ||
      e?.message?.includes('Quota') ||
      e?.code === 22 ||
      e?.code === 1014;

    if (isQuota) {
      console.warn('localStorage quota exceeded. Large dataset is safely stored in IndexedDB and Cloud Firestore.');
      try {
        // Save an essential compact version to localStorage so synchronous boots still have settings & stock
        const compactDb: Partial<AppDatabase> = {
          settings: db.settings,
          stock: db.stock,
          staff: db.staff,
          // Limit heavy arrays in localStorage to prevent quota errors
          customers: (db.customers || []).slice(0, 100),
          transactions: (db.transactions || []).slice(0, 50),
          cardMembers: (db.cardMembers || []).slice(0, 50),
          cardTransactions: (db.cardTransactions || []).slice(0, 50),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(compactDb));
      } catch (innerErr) {
        // If even compact doesn't fit, just save minimal settings
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ settings: db.settings, staff: db.staff }));
        } catch (_) {}
      }
    } else {
      console.error('Failed to save database to localStorage', e);
    }
  }
}

