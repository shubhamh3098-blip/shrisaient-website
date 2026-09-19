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
  AgentAdvanceEntry
} from '../types';

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
  tagline: 'Electronics, Home Appliances, Wires & Hardware Trading',
  deliveryRates: {
    freeDeliveryMinAmount: 3000,
    localDeliveryFee: 100,
    outerDeliveryFee: 250,
    estimatedDeliveryTime: 'Same Day / 24 Hours',
    deliveryAreas: 'Wardha City, Arvi, and All Surrounding Villages (50 km)',
    deliveryNote: 'Free home delivery on orders above ₹3,000 and all Card Scheme major appliances (TV, Refrigerator, Cooler, Washing Machine).',
  },
  shopNotice: 'श्री साई इंटरप्राइजेस: ३०-महिने साप्ताहिक बचत कार्ड योजना बुकिंग चालू आहे • सर्व मोठ्या वस्तूंवर फ्री होम डिलिव्हरी!',
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
    endCardNo: 2999,
    registrationFee: 50,
    description: '३०-महिने साप्ताहिक बचत योजना 1 • कार्ड नं 1001 ते 2999 • सर्व मोठ्या होम अप्लायंसेजवर लागू',
    color: 'from-blue-600 to-blue-800',
  },
  {
    id: 'scheme2',
    name: 'Scheme 2 (योजना 2)',
    code: 'SCH-2',
    startCardNo: 3001,
    endCardNo: 3999,
    registrationFee: 50,
    description: '३०-महिने साप्ताहिक बचत योजना 2 • कार्ड नं 3001 ते 3999 • कुलर, फ्रिज, वॉशिंग मशीन',
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
    startCardNo: 6001,
    endCardNo: 7999,
    registrationFee: 50,
    description: 'साप्ताहिक बचत योजना 4 • कार्ड नं 6001 ते 7999 • प्रीमियम इलेक्ट्रॉनिक्स व फर्निचर',
    color: 'from-amber-600 to-orange-800',
  },
  {
    id: 'scheme5',
    name: 'Scheme 5 (योजना 5)',
    code: 'SCH-5',
    startCardNo: 8001,
    endCardNo: 9999,
    registrationFee: 50,
    description: 'साप्ताहिक बचत योजना 5 • कार्ड नं 8001 ते 9999 • नवीन ऑफर्स व फेस्टिव्हल स्कीम',
    color: 'from-pink-600 to-rose-800',
  },
  {
    id: 'scheme6',
    name: 'Scheme 6 (योजना 6)',
    code: 'SCH-6',
    startCardNo: 10001,
    endCardNo: 12000,
    registrationFee: 50,
    description: 'साप्ताहिक बचत योजना 6 • कार्ड नं 10001 ते 12000 • सुपर सेव्हर वीकली स्कीम',
    color: 'from-cyan-600 to-blue-900',
  },
];


export const INITIAL_STOCK: StockItem[] = [
  {
    id: 'stk-tv32',
    name: 'Smart LED TV 32" HD Ready (Frameless)',
    code: 'TV-32-SMART',
    category: 'Home Appliances',
    quantity: 14,
    unit: 'Unit',
    sellingPrice: 12500,
    purchasePrice: 9800,
    minStockLevel: 3,
    imageUrl: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=600&q=80',
    description: '32-inch Frameless Smart LED TV with YouTube, Netflix, Wi-Fi & 1 Year Warranty',
  },
  {
    id: 'stk-tv43',
    name: 'Smart LED TV 43" 4K Ultra HD Display',
    code: 'TV-43-4K',
    category: 'Home Appliances',
    quantity: 8,
    unit: 'Unit',
    sellingPrice: 23900,
    purchasePrice: 19500,
    minStockLevel: 2,
    imageUrl: 'https://images.unsplash.com/photo-1461151304267-38535e780c79?auto=format&fit=crop&w=600&q=80',
    description: '43-inch 4K HDR Ultra Clear Display, Dolby Audio, Bluetooth & Screen Mirroring',
  },
  {
    id: 'stk-lg-glt2216wyri',
    name: 'LG GLT2216WYRI Refrigerator',
    code: 'LG-GLT2216',
    category: 'Home Appliances',
    quantity: 2,
    unit: 'Unit',
    sellingPrice: 25478,
    purchasePrice: 21592,
    minStockLevel: 1,
    imageUrl: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=600&q=80',
    description: 'LG Inverter Refrigerator (from MANISHA ENTERPRISES CS/2526/01604), Serials: 602NRZX294301, 602NRQV293652',
  },
  {
    id: 'stk-fridge',
    name: 'Double Door Refrigerator 240L (5-Star Inverter)',
    code: 'FRIDGE-240L',
    category: 'Home Appliances',
    quantity: 6,
    unit: 'Unit',
    sellingPrice: 21500,
    purchasePrice: 17800,
    minStockLevel: 2,
    imageUrl: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=600&q=80',
    description: 'Frost-Free Inverter Compressor, Toughened Glass Shelves, 10 Years Compressor Warranty',
  },
  {
    id: 'stk-cooler',
    name: 'Desert Air Cooler 70L Heavy Duty Honeycomb',
    code: 'CLR-70L-HD',
    category: 'Home Appliances',
    quantity: 18,
    unit: 'Unit',
    sellingPrice: 7800,
    purchasePrice: 5900,
    minStockLevel: 5,
    imageUrl: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=600&q=80',
    description: '70 Litres Tank, High Air Delivery Fan, 3-Side Honeycomb Cooling Pads & Inverter Compatible',
  },
  {
    id: 'stk-wm',
    name: 'Semi-Automatic Washing Machine 7.5 Kg',
    code: 'WM-75-SEMI',
    category: 'Home Appliances',
    quantity: 9,
    unit: 'Unit',
    sellingPrice: 11200,
    purchasePrice: 8900,
    minStockLevel: 3,
    imageUrl: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=600&q=80',
    description: '7.5 Kg Capacity, Powerful Spin Dryer, Rust-Proof Polypropylene Body & 5 Years Motor Warranty',
  },
  {
    id: 'stk-fan',
    name: 'Ceiling Fan 1200mm High Speed Copper (Pack of 2)',
    code: 'FAN-1200-HS',
    category: 'Electricals',
    quantity: 32,
    unit: 'Pack',
    sellingPrice: 3200,
    purchasePrice: 2400,
    minStockLevel: 8,
    imageUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=80',
    description: '100% Pure Copper Winding, 400 RPM High Air Delivery, Double Ball Bearing',
  },
  {
    id: 'stk-1',
    name: 'Copper Electric Wire 1.5 sq mm (90m Roll)',
    code: 'STK-CW15',
    category: 'Electricals',
    quantity: 48,
    unit: 'Roll',
    sellingPrice: 1850,
    purchasePrice: 1450,
    minStockLevel: 10,
    imageUrl: 'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?auto=format&fit=crop&w=600&q=80',
    description: 'Flame Retardant (FR) PVC Insulated Multi-strand Copper Industrial Cable (90 Meters)',
  },
  {
    id: 'stk-2',
    name: 'LED Tube Light 20W (Pack of 5)',
    code: 'STK-LED20',
    category: 'Electricals',
    quantity: 65,
    unit: 'Pack',
    sellingPrice: 950,
    purchasePrice: 680,
    minStockLevel: 15,
    imageUrl: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=600&q=80',
    description: '20W Cool Day White Light, Surge Protection 4kV, Glare-Free Polycarbonate Batten',
  },
  {
    id: 'stk-6',
    name: 'Submersible Pump Starter Panel 1.5 HP',
    code: 'STK-PNL15',
    category: 'Industrial',
    quantity: 5,
    unit: 'Unit',
    sellingPrice: 3400,
    purchasePrice: 2750,
    minStockLevel: 4,
    imageUrl: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80',
    description: 'Heavy Duty Contactor, Overload Thermal Relay, Voltmeter & Ammeter Dual Gauges',
  },
  {
    id: 'stk-sofa',
    name: 'Royal Teak Finish 3+1+1 High-Density Sofa Set',
    code: 'FRN-SOFA-311',
    category: 'Furniture',
    quantity: 4,
    unit: 'Set',
    sellingPrice: 38500,
    purchasePrice: 29500,
    minStockLevel: 1,
    imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80',
    description: 'Premium Solid Teakwood Frame, High-Resilience 40-Density Foam, Stain-Resistant Fabric & 5-Year Warranty',
  },
  {
    id: 'stk-bed',
    name: 'King Size Teak Finish Bed with Hydraulic Storage',
    code: 'FRN-BED-KING',
    category: 'Furniture',
    quantity: 5,
    unit: 'Unit',
    sellingPrice: 28900,
    purchasePrice: 22000,
    minStockLevel: 2,
    imageUrl: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=600&q=80',
    description: 'Sturdy Engineered Wood & Teak Finish, Smooth Hydraulic Gas-Lift Box Storage & Cushioned Headboard',
  },
  {
    id: 'stk-wardrobe',
    name: '4-Door Solid Wood Almirah & Wardrobe with Mirror',
    code: 'FRN-WRD-4D',
    category: 'Furniture',
    quantity: 6,
    unit: 'Unit',
    sellingPrice: 24500,
    purchasePrice: 18500,
    minStockLevel: 2,
    imageUrl: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=600&q=80',
    description: 'Spacious 4-Door Wardrobe with Full Length Dressing Mirror, Locker Drawer, Coat Hanging Rail & Safety Locks',
  },
  {
    id: 'stk-dining',
    name: '6-Seater Solid Sheesham Wood Dining Table Set',
    code: 'FRN-DNG-6S',
    category: 'Furniture',
    quantity: 3,
    unit: 'Set',
    sellingPrice: 32000,
    purchasePrice: 25000,
    minStockLevel: 1,
    imageUrl: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=600&q=80',
    description: 'Pure Sheesham Wood Craftsmanship, 6 Ergonomically Curved Dining Chairs with Premium Cushion Seating',
  },
  {
    id: 'stk-dressing',
    name: 'Luxury Dressing Table with LED Mirror & Drawers',
    code: 'FRN-DRS-LED',
    category: 'Furniture',
    quantity: 7,
    unit: 'Unit',
    sellingPrice: 13500,
    purchasePrice: 9800,
    minStockLevel: 2,
    imageUrl: 'https://images.unsplash.com/photo-1534349762230-e0cadf78f5da?auto=format&fit=crop&w=600&q=80',
    description: 'Contemporary Dressing Vanity with Touch LED Lighted Mirror, Multiple Storage Drawers & Cosmetics Shelves',
  },
];

export const INITIAL_CUSTOMERS: Customer[] = [];
export const INITIAL_TRANSACTIONS: TransactionEntry[] = [];
export const INITIAL_PURCHASES: PurchaseEntry[] = [];
export const INITIAL_STAFF: StaffMember[] = [];
export const INITIAL_EXPENSES: ExpenseEntry[] = [];
export const INITIAL_DEALERS: Dealer[] = [];
export const INITIAL_DEALER_PAYMENTS: DealerPayment[] = [];
export const INITIAL_CARD_MEMBERS: CardMember[] = [];
export const INITIAL_CARD_TRANSACTIONS: CardTransaction[] = [];

const STORAGE_KEY = 'shri_sai_ent_db_v2';

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
  agentAdvances?: AgentAdvanceEntry[];
}

export function deduplicateStock(items: StockItem[]): StockItem[] {
  if (!Array.isArray(items)) return [];
  const mergedMap = new Map<string, StockItem>();

  items.forEach((item, index) => {
    if (!item) return;
    const name = (item.name || '').trim();
    // Normalize name to alphanumeric slug to catch variations like "DIWAN 4*6" vs "DIWAN 4/6"
    const nameSlug = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const idSlug = (item.id || '').trim();

    // Grouping key: if id exists and starts with prod-, use idSlug; otherwise use nameSlug or fallback
    const groupKey = (idSlug && idSlug.startsWith('prod-'))
      ? idSlug
      : (nameSlug || idSlug || `item-${index}`);

    if (mergedMap.has(groupKey)) {
      const existing = mergedMap.get(groupKey)!;
      existing.quantity = (Number(existing.quantity) || 0) + (Number(item.quantity) || 0);
      if ((!existing.sellingPrice || existing.sellingPrice === 0) && item.sellingPrice) {
        existing.sellingPrice = item.sellingPrice;
      }
      if ((!existing.purchasePrice || existing.purchasePrice === 0) && item.purchasePrice) {
        existing.purchasePrice = item.purchasePrice;
      }
      if (!existing.imageUrl && item.imageUrl) {
        existing.imageUrl = item.imageUrl;
      }
      if (!existing.category && item.category) {
        existing.category = item.category;
      }
      if ((!existing.description || existing.description.length < (item.description || '').length) && item.description) {
        existing.description = item.description;
      }
    } else {
      mergedMap.set(groupKey, { ...item });
    }
  });

  // Guarantee that every single item in the returned array has a strictly unique ID
  const result: StockItem[] = [];
  const seenIds = new Set<string>();

  mergedMap.forEach((item, groupKey) => {
    let finalId = item.id ? item.id.trim() : `prod-${groupKey}`;
    if (!finalId || seenIds.has(finalId)) {
      finalId = `${finalId || 'prod'}-${result.length + 1}`;
    }
    seenIds.add(finalId);
    result.push({
      ...item,
      id: finalId,
    });
  });

  return result;
}

export function loadDatabase(): AppDatabase {
  try {
    const PURGE_KEY = 'shri_sai_all_demo_data_purged_v2026_09_18_clean_v2';
    if (!localStorage.getItem(PURGE_KEY)) {
      localStorage.setItem(PURGE_KEY, 'true');
      const cleanDb: AppDatabase = {
        settings: DEFAULT_SETTINGS,
        stock: INITIAL_STOCK,
        customers: [],
        transactions: [],
        purchases: [],
        dealers: [],
        dealerPayments: [],
        cardMembers: [],
        cardTransactions: [],
        staff: [],
        expenses: [],
        agentAdvances: [],
      };
      saveDatabase(cleanDb);
      return cleanDb;
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

      const rawStockList: StockItem[] = Array.isArray(parsed.stock) && parsed.stock.length > 0
        ? parsed.stock.map((item: StockItem) => {
            if (!item.imageUrl) {
              const matched = INITIAL_STOCK.find((s) => s.id === item.id || s.code === item.code);
              if (matched?.imageUrl) {
                return { ...item, imageUrl: matched.imageUrl, description: item.description || matched.description };
              }
            }
            return item;
          })
        : INITIAL_STOCK;

      const loadedStock = deduplicateStock(rawStockList);

      const isDemoCust = (c: any) => c?.id && (c.id.startsWith('cust-bhagat') || c.id.startsWith('demo-') || c.id.includes('placeholder'));
      const isDemoCard = (m: any) => m?.id && (m.id.startsWith('cm-demo') || m.id.startsWith('card-demo') || m.id.startsWith('demo-'));
      const isDemoTx = (t: any) => t?.id && (t.id.startsWith('tx-bhagat') || t.id.startsWith('tx-demo') || t.id.startsWith('demo-'));
      const isDemoPur = (p: any) => p?.id && (p.id.startsWith('pur-demo') || p.id.startsWith('demo-'));
      const isDemoDlr = (d: any) => d?.id && (d.id.startsWith('dlr-demo') || d.id.startsWith('demo-'));
      const isDemoStaff = (s: any) => s?.id && (s.id.startsWith('stf-demo') || s.id.startsWith('demo-'));

      return {
        settings: mergedSettings,
        stock: loadedStock,
        customers: Array.isArray(parsed.customers) ? parsed.customers.filter((c: any) => !isDemoCust(c)) : [],
        transactions: Array.isArray(parsed.transactions) ? parsed.transactions.filter((t: any) => !isDemoTx(t)) : [],
        purchases: Array.isArray(parsed.purchases) ? parsed.purchases.filter((p: any) => !isDemoPur(p)) : [],
        dealers: Array.isArray(parsed.dealers) ? parsed.dealers.filter((d: any) => !isDemoDlr(d)) : [],
        dealerPayments: Array.isArray(parsed.dealerPayments) ? parsed.dealerPayments : [],
        cardMembers: Array.isArray(parsed.cardMembers) ? parsed.cardMembers.filter((m: any) => !isDemoCard(m)) : [],
        cardTransactions: Array.isArray(parsed.cardTransactions) ? parsed.cardTransactions : [],
        staff: Array.isArray(parsed.staff) ? parsed.staff.filter((s: any) => !isDemoStaff(s)) : [],
        expenses: Array.isArray(parsed.expenses) ? parsed.expenses : [],
        agentAdvances: Array.isArray(parsed.agentAdvances) ? parsed.agentAdvances : [],
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
    staff: [],
    expenses: [],
    agentAdvances: [],
  };
}

export function clearAllDemoData(currentDb: AppDatabase): AppDatabase {
  const clean: AppDatabase = {
    settings: currentDb.settings || DEFAULT_SETTINGS,
    stock: currentDb.stock && currentDb.stock.length > 0 ? currentDb.stock : INITIAL_STOCK,
    customers: [],
    transactions: [],
    purchases: [],
    dealers: [],
    dealerPayments: [],
    cardMembers: [],
    cardTransactions: [],
    staff: [],
    expenses: [],
    agentAdvances: [],
  };
  saveDatabase(clean);
  return clean;
}

export function clearCardsData(currentDb: AppDatabase): AppDatabase {
  const clean: AppDatabase = {
    ...currentDb,
    cardMembers: [],
    cardTransactions: [],
  };
  saveDatabase(clean);
  return clean;
}

export function clearBillsData(currentDb: AppDatabase): AppDatabase {
  const clean: AppDatabase = {
    ...currentDb,
    transactions: [],
    customers: [],
  };
  saveDatabase(clean);
  return clean;
}

export function saveDatabase(db: AppDatabase): void {
  try {
    const cleanDb = {
      ...db,
      stock: deduplicateStock(db.stock || []),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanDb));
  } catch (e) {
    console.error('Failed to save database to localStorage', e);
  }
}

