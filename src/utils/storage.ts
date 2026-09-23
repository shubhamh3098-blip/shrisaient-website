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
  BillReceiptEntry,
  MergedCustomerRecord,
  FurnitureJobCard,
  FinanceDORecord,
  DailyCashReconciliation,
  StockTransferRecord,
} from '../types';
import { saveDatabaseToIndexedDB } from './indexedDb';

export const STORAGE_KEY = 'shri_sai_enterprise_db';
export const GLOBAL_ZERO_RESET_KEY = 'shri_sai_reset_zero_v2026_09_17_clean_slate';

export const DEFAULT_SETTINGS: BusinessSettings = {
  businessName: 'Shri Sai Enterprises',
  businessNameHindi: 'श्री साई इंटरप्राइजेस',
  domainName: 'shrisaient.in',
  ownerName: 'Shubham Shende',
  role: 'Admin',
  phone: '8766486915',
  additionalPhones: ['8600122798', '9175534365', '7822859073'],
  email: 'shubhamh3098@gmail.com',
  gstin: '27ALOPL0030G2ZC',
  address: 'मातोश्री सभागृह समोर, आर्वी रोड, पंजाब कॉलनी, वर्धा - ४४२००१',
  addressHindi: 'मातोश्री सभागृह समोर, आर्वी रोड, पंजाब कॉलनी, वर्धा - ४४२००१',
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
  whatsappGroupLink: 'https://chat.whatsapp.com/CLcaeUq1bHH1RE0203oPaP?s=cl&p=a&mlu=4&ilr=4',
  bankDetails: {
    bankName: 'HDFC Bank',
    accountNumber: '50200083215914',
    ifsc: 'HDFC0000965',
    branch: 'OPP.BANK OF MAHARASHTRA WARDHA 442001',
  },
  warrantyDisclaimer: 'दिलेली वॉरंटी ही दुकानदाराची नसून कंपनीची आहे. म्हणून वस्तूत काही बिघाड आल्यास त्याला दुकानदार जबाबदार नसून कंपनी आहे. तेव्हा कृपया वस्तू घेतेवेळेस कंपनीच्या सर्व्हिस सेण्टरचा मोबाईल नंबर घ्यावा.',
  adminPassword: 'Saksham@291022',
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


export const DEFAULT_SHOWROOM_PRODUCTS: StockItem[] = [
  {
    id: 'sofa-teak-7s',
    name: 'प्रीमियम सागवान एल-शेप सोफा सेट (७-सीटर)',
    code: 'FURN-SOFA-01',
    category: 'Furniture',
    quantity: 4,
    unit: 'Set',
    sellingPrice: 38500,
    purchasePrice: 28000,
    minStockLevel: 1,
    imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop&q=80',
    description: '१००% अस्सल सिझन्ड सागवान लाकूड, ४०-डेन्सिटी कम्फर्ट फोम, डाग-प्रतिरोधक मखमली फॅब्रिक, ५ वर्षे वाळवी व सिझनिंग वॉरंटी.',
  },
  {
    id: 'bed-teak-hydraulic',
    name: 'रॉयल सागवान हायड्रोलिक स्टोरेज बेड (किंग साईज ६x६.५ फूट)',
    code: 'FURN-BED-02',
    category: 'Furniture',
    quantity: 5,
    unit: 'Unit',
    sellingPrice: 29999,
    purchasePrice: 22000,
    minStockLevel: 1,
    imageUrl: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&auto=format&fit=crop&q=80',
    description: 'जर्मन गॅस-लिफ्ट हायड्रोलिक्स, प्रशस्त अंतर्गत स्टोरेज, वाळवी-प्रतिरोधक सागवान हेडबोर्ड व सॉलिड फ्रेम.',
  },
  {
    id: 'tv-43-4k-uhd',
    name: '43" 4K Ultra HD Smart Google TV (Dolby Audio)',
    code: 'ELEC-TV-03',
    category: 'Electronics',
    quantity: 8,
    unit: 'Unit',
    sellingPrice: 21999,
    purchasePrice: 16500,
    minStockLevel: 2,
    imageUrl: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&auto=format&fit=crop&q=80',
    description: 'बेझल-लेस 4K UHD डिस्प्ले, Google TV OS, ३० वॉट Dolby Audio, ड्युअल बँड Wi-Fi व ऑल ओटीटी ॲप्स सपोर्ट.',
  },
  {
    id: 'fridge-260l-5star',
    name: '260L 5-Star डबल डोअर फ्रॉस्ट-फ्री इनव्हर्टर रेफ्रिजरेटर',
    code: 'ELEC-FRIDGE-04',
    category: 'Electronics',
    quantity: 6,
    unit: 'Unit',
    sellingPrice: 24499,
    purchasePrice: 19000,
    minStockLevel: 1,
    imageUrl: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=800&auto=format&fit=crop&q=80',
    description: 'स्मार्ट इनव्हर्टर कॉम्प्रेसर, टफन्ड ग्लास शेल्व्हज, मल्टि-एअर फ्लो व १० वर्षे कॉम्प्रेसर वॉरंटी.',
  },
  {
    id: 'cooler-75l-desert',
    name: '75L हेवी-ड्युटी डेझर्ट एअर कुलर (हनीकॉम्ब पॅड)',
    code: 'ELEC-COOLER-05',
    category: 'Electronics',
    quantity: 15,
    unit: 'Unit',
    sellingPrice: 8499,
    purchasePrice: 5800,
    minStockLevel: 3,
    imageUrl: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&auto=format&fit=crop&q=80',
    description: '७५ लिटर पाण्याची टाकी, ४५ फूट शक्तिशाली एअर थ्रो, १००% कॉपर हाय-स्पीड मोटर व इन्व्हर्टर सुसंगत.',
  },
  {
    id: 'dining-6seater-teak',
    name: '६-सीटर सॉलिड सागवान डायनिंग टेबल सेट (कुशन्ड चेअर्स)',
    code: 'FURN-DINING-06',
    category: 'Furniture',
    quantity: 3,
    unit: 'Set',
    sellingPrice: 26500,
    purchasePrice: 19500,
    minStockLevel: 1,
    imageUrl: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800&auto=format&fit=crop&q=80',
    description: 'सॉलिड सागवान टेबलटॉप, ६ आरामदायी कुशन्ड खुर्च्या, नॅचरल मेलामाइन ग्लॉस पॉलिश फिनिश.',
  },
  {
    id: 'wardrobe-3door-teak',
    name: '३-डोअर सागवान लाकडी कपाट विथ ड्रेसर व लॉकर',
    code: 'FURN-WARDROBE-07',
    category: 'Furniture',
    quantity: 4,
    unit: 'Unit',
    sellingPrice: 22999,
    purchasePrice: 16500,
    minStockLevel: 1,
    imageUrl: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800&auto=format&fit=crop&q=80',
    description: 'प्रशस्त ३ कपाटे, अंतर्गत सिक्युरिटी लॉकर, कपडे हँगिंग रॉड व पूर्ण लांबीचा ड्रेसिंग मिरर.',
  },
  {
    id: 'wm-75kg-frontload',
    name: '7.5 kg फुली ऑटोमॅटिक फ्रंट लोड वॉशिंग मशीन',
    code: 'ELEC-WM-08',
    category: 'Electronics',
    quantity: 5,
    unit: 'Unit',
    sellingPrice: 27499,
    purchasePrice: 21000,
    minStockLevel: 1,
    imageUrl: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=800&auto=format&fit=crop&q=80',
    description: 'इनव्हर्टर डायरेक्ट ड्राईव्ह मोटर, स्टीम वॉश तंत्रज्ञान, ५-स्टार एनर्जी सेव्हिंग व अँटी-बॅक्टेरियल सायकल.',
  },
  {
    id: 'tv-55-4k-frameless',
    name: '55" Frameless 4K UHD Google Smart LED TV',
    code: 'ELEC-TV-09',
    category: 'Electronics',
    quantity: 6,
    unit: 'Unit',
    sellingPrice: 34999,
    purchasePrice: 26500,
    minStockLevel: 1,
    imageUrl: 'https://images.unsplash.com/photo-1461151304267-38535e780c79?w=800&auto=format&fit=crop&q=80',
    description: '५५ इंच भव्य सिनेमॅटिक स्क्रीन, डॉल्बी व्हिजन व ॲटमॉस, हँड्स-फ्री व्हॉईस कंट्रोल व २ वर्षे ऑन-साईट वॉरंटी.',
  },
  {
    id: 'fan-1200mm-bldc',
    name: '1200mm हाय-स्पीड इनव्हर्टर BLDC सीलिंग फॅन',
    code: 'ELEC-FAN-10',
    category: 'Electronics',
    quantity: 20,
    unit: 'Unit',
    sellingPrice: 2899,
    purchasePrice: 1950,
    minStockLevel: 5,
    imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=80',
    description: 'ऊर्जा बचत BLDC मोटर, रिमोट कंट्रोल, एरोडायनॅमिक ब्लेड्स, ६५% वीज बचत.',
  },
  {
    id: 'tvunit-teak-console',
    name: 'सागवान डिझायनर टीव्ही युनिट & कन्सोल वॉल कॅबिनेट',
    code: 'FURN-TVUNIT-11',
    category: 'Furniture',
    quantity: 5,
    unit: 'Unit',
    sellingPrice: 14500,
    purchasePrice: 10500,
    minStockLevel: 1,
    imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80',
    description: '६५ इंचांपर्यंत टीव्हीसाठी परिपूर्ण, सेट-टॉप बॉक्स शेल्फ, साउंडबार कम्पार्टमेंट व वायर मॅनेजमेंट.',
  },
  {
    id: 'tv-32-smart-led',
    name: '32" HD Ready Smart Google TV (Wi-Fi + OTT)',
    code: 'ELEC-TV-12',
    category: 'Electronics',
    quantity: 10,
    unit: 'Unit',
    sellingPrice: 10999,
    purchasePrice: 8200,
    minStockLevel: 2,
    imageUrl: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=800&auto=format&fit=crop&q=80',
    description: '३२ इंच एचडी रेडी, यूट्यूब, नेटफ्लिक्स व प्राईम व्हिडिओ ॲप्स, २० वॉट स्टीरिओ स्पीकर्स.',
  },
];

export const INITIAL_STOCK: StockItem[] = DEFAULT_SHOWROOM_PRODUCTS;

export const INITIAL_CUSTOMERS: Customer[] = [];

export const INITIAL_TRANSACTIONS: TransactionEntry[] = [];

export const INITIAL_PURCHASES: PurchaseEntry[] = [];

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
    status: 'Active',
    isApprovedByAdmin: true,
    approvedBy: 'Shubham Shende (Admin)',
  },
  {
    id: "stf-bhushan",
    name: "Bhushan Lidbe",
    role: "Field Collection Agent (भूषण लिडबे)",
    phone: "8600122798",
    salary: 15000,
    advancePaid: 0,
    attendanceToday: 'Present',
    status: 'Active',
    isApprovedByAdmin: true,
    approvedBy: 'Shubham Shende (Admin)',
  },
  {
    id: "stf-suraj",
    name: "Suraj Pendam",
    role: "Field Collection Agent (सुरज पेंदाम)",
    phone: "9175534365",
    salary: 15000,
    advancePaid: 0,
    attendanceToday: 'Present',
    status: 'Active',
    isApprovedByAdmin: true,
    approvedBy: 'Shubham Shende (Admin)',
  },
  {
    id: "stf-ninad",
    name: "Ninad Hole",
    role: "Field Collection Agent (निनाद होले)",
    phone: "7822859073",
    salary: 15000,
    advancePaid: 0,
    attendanceToday: 'Present',
    status: 'Active',
    isApprovedByAdmin: true,
    approvedBy: 'Shubham Shende (Admin)',
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
  mergedRecords?: MergedCustomerRecord[];
  furnitureJobCards?: FurnitureJobCard[];
  financeDORecords?: FinanceDORecord[];
  cashReconciliations?: DailyCashReconciliation[];
  stockTransfers?: StockTransferRecord[];
}

export function loadDatabase(): AppDatabase {
  try {
    if (typeof window !== 'undefined') {
      const isResetDone = localStorage.getItem(GLOBAL_ZERO_RESET_KEY);
      if (isResetDone !== 'done') {
        localStorage.setItem(GLOBAL_ZERO_RESET_KEY, 'done');
        localStorage.removeItem(STORAGE_KEY);
        return {
          settings: DEFAULT_SETTINGS,
          stock: [],
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
          mergedRecords: [],
        };
      }
    }

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
      if (!mergedSettings.adminPassword || mergedSettings.adminPassword === 'admin') {
        mergedSettings.adminPassword = 'Saksham@291022';
      }
      mergedSettings.email = 'shubhamh3098@gmail.com';
      mergedSettings.domainName = 'shrisaient.in';
      mergedSettings.ownerName = 'Shubham Shende';
      if (!mergedSettings.address || mergedSettings.address.includes('बोरगाव') || mergedSettings.address.includes('आरटीओ')) {
        mergedSettings.address = 'मातोश्री सभागृह समोर, आर्वी रोड, पंजाब कॉलनी, वर्धा - ४४२००१';
        mergedSettings.addressHindi = 'मातोश्री सभागृह समोर, आर्वी रोड, पंजाब कॉलनी, वर्धा - ४४२००१';
      }
      if (!mergedSettings.whatsappGroupLink || mergedSettings.whatsappGroupLink.includes('invite/shrisaienterprises')) {
        mergedSettings.whatsappGroupLink = 'https://chat.whatsapp.com/CLcaeUq1bHH1RE0203oPaP?s=cl&p=a&mlu=4&ilr=4';
      }

      const demoStockIds = new Set(['stk-tv32', 'stk-tv43', 'stk-fridge', 'stk-cooler', 'stk-wm', 'stk-fan', 'stk-1', 'stk-2', 'stk-6', 'stk-bed1', 'stk-dining1', 'stk-wardrobe1', 'stk-recliner1']);
      const loadedStock: StockItem[] = Array.isArray(parsed.stock)
        ? parsed.stock
            .filter((item: StockItem) => !demoStockIds.has(item.id))
            .map((item: StockItem) => {
              const total = Number(item.quantity || 0);
              let sQty = item.shopQty;
              let gQty = item.godownQty;
              if (sQty === undefined && gQty === undefined) {
                if (total <= 1) {
                  sQty = total;
                  gQty = 0;
                } else {
                  gQty = Math.floor(total * 0.6);
                  sQty = total - gQty;
                }
              } else if (sQty === undefined) {
                sQty = Math.max(0, total - (gQty || 0));
              } else if (gQty === undefined) {
                gQty = Math.max(0, total - (sQty || 0));
              }
              return {
                ...item,
                shopQty: Number(sQty || 0),
                godownQty: Number(gQty || 0),
                godownLocation: item.godownLocation || 'मुख्य गोडावून (आर्वी रोड, वर्धा)',
                quantity: Number(sQty || 0) + Number(gQty || 0),
              };
            })
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

      const finalPurchases = loadedPurchases;
      const finalDealers = loadedDealers;

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
        mergedRecords: Array.isArray(parsed.mergedRecords) ? parsed.mergedRecords : [],
        furnitureJobCards: Array.isArray(parsed.furnitureJobCards) ? parsed.furnitureJobCards : [],
        financeDORecords: Array.isArray(parsed.financeDORecords) ? parsed.financeDORecords : [],
        cashReconciliations: Array.isArray(parsed.cashReconciliations) ? parsed.cashReconciliations : [],
        stockTransfers: Array.isArray(parsed.stockTransfers) ? parsed.stockTransfers : [],
      };
    }
  } catch (e) {
    console.error('Failed to parse database from localStorage', e);
  }
  return {
    settings: DEFAULT_SETTINGS,
    stock: [],
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
    mergedRecords: [],
    furnitureJobCards: [],
    financeDORecords: [],
    cashReconciliations: [],
    stockTransfers: [],
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
    billReceipts: [],
    mergedRecords: [],
    furnitureJobCards: [],
    financeDORecords: [],
    cashReconciliations: [],
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

