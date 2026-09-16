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

export const INITIAL_TRANSACTIONS: TransactionEntry[] = [
  {
    id: 'tx-bhagat-1',
    invoiceNo: 'INV-2026-081',
    date: '2026-09-08',
    customerName: 'SHESHRAO BHAGAT',
    customerPhone: '9623626338',
    customerId: 'cust-bhagat-1',
    village: 'सातोडा (Satoda)',
    stockItemId: 'stk-fridge',
    stockItemName: 'Double Door Refrigerator 240L',
    quantity: 1,
    itemDetails: 'Double Door Refrigerator 240L + Copper Cables',
    totalAmount: 38500,
    payingNow: 26000,
    dueAmount: 12500,
    paymentMode: 'Online',
    notes: 'Satoda site delivery',
    createdAt: '2026-09-08T11:00:00Z',
  },
  {
    id: 'tx-bhagat-2',
    invoiceNo: 'INV-2026-054',
    date: '2026-08-20',
    customerName: 'SHESHRAV BHAGAT',
    customerPhone: '9623626338',
    customerId: 'cust-bhagat-2',
    village: 'Satoda',
    stockItemId: 'stk-cooler',
    stockItemName: 'Desert Air Cooler 70L',
    quantity: 2,
    itemDetails: 'Desert Air Cooler 70L Heavy Duty (2 units)',
    totalAmount: 14500,
    payingNow: 10000,
    dueAmount: 4500,
    paymentMode: 'Cash',
    notes: 'Satoda road home delivery',
    createdAt: '2026-08-20T16:30:00Z',
  },
  {
    id: 'tx-1',
    invoiceNo: 'INV-2026-001',
    date: '2026-09-09',
    customerName: 'Amit Patil (Contractor)',
    customerPhone: '9765412390',
    customerId: 'cust-2',
    stockItemId: 'stk-1',
    stockItemName: 'Copper Electric Wire 1.5 sq mm (90m)',
    quantity: 4,
    itemDetails: '4 rolls copper wire + 20 pcs modular switch',
    totalAmount: 8160,
    payingNow: 5000,
    dueAmount: 3160,
    paymentMode: 'Cash',
    notes: 'Remaining 3160 will clear by Friday',
    createdAt: '2026-09-09T10:15:00Z',
  },
  {
    id: 'tx-2',
    invoiceNo: 'INV-2026-002',
    date: '2026-09-09',
    customerName: 'Vijay Deshmukh',
    customerPhone: '9421098765',
    customerId: 'cust-3',
    stockItemId: 'stk-2',
    stockItemName: 'LED Tube Light 20W (Pack of 5)',
    quantity: 2,
    itemDetails: '2 packs LED Tube Light 20W for office fitting',
    totalAmount: 1900,
    payingNow: 1900,
    dueAmount: 0,
    paymentMode: 'Online',
    notes: 'Paid via GPay UPI',
    createdAt: '2026-09-09T11:45:00Z',
  },
  {
    id: 'tx-3',
    invoiceNo: 'INV-2026-003',
    date: '2026-09-08',
    customerName: 'Rajesh Sharma Electricals',
    customerPhone: '9822012345',
    customerId: 'cust-1',
    stockItemId: 'stk-3',
    stockItemName: 'PVC Conduit Pipe 25mm (3m)',
    quantity: 20,
    itemDetails: '20 pieces PVC pipes 25mm + fittings',
    totalAmount: 2600,
    payingNow: 2600,
    dueAmount: 0,
    paymentMode: 'Cash',
    notes: 'Full payment received in cash',
    createdAt: '2026-09-08T15:30:00Z',
  },
];

export const INITIAL_PURCHASES: PurchaseEntry[] = [
  {
    id: 'pur-manisha-lg-sample',
    billNo: 'CS/2526/01604',
    date: '2026-02-25',
    supplierName: 'MANISHA ENTERPRISES',
    supplierAddress: 'INGOLE CHOWK MAIN ROAD WARDHA 442001 MAHARASHTRA',
    supplierPhone: '9766911693',
    supplierGstin: '27ABDPB8956C1ZS',
    poNo: 'CSSO2526-00579',
    poDate: '2026-02-23',
    salesConsultant: 'DHIRAJ BHOWARE',
    approvedBy: 'ARTI INGOLE',
    location: 'LG DISTRIBUTION',
    items: 'LG GLT2216WYRI (Qty: 2)',
    lineItems: [
      {
        id: 'li-1',
        description: 'LG GLT2216WYRI',
        hsn: '84182100',
        quantity: 2,
        rate: 21592,
        discount: 0,
        taxableAmount: 43183,
        cgstRate: 9.0,
        cgstAmount: 3886.48,
        sgstRate: 9.0,
        sgstAmount: 3886.48,
        totalAmount: 50956,
        serialNumbers: ['602NRZX294301', '602NRQV293652'],
      },
    ],
    taxableAmount: 43183,
    cgstAmount: 3886.48,
    sgstAmount: 3886.48,
    totalAmount: 50956,
    paidAmount: 50956,
    status: 'Paid',
    paymentMode: 'Online',
    transporter: 'GENERAL TRANSPORT',
    ewayBillNo: '1157e72a690b8a5814ec191c0d6fc38f595d1ba078a40ccff9b91418bf4e10f4',
    irn: '1157e72a690b8a5814ec191c0d6fc38f595d1ba078a40ccff9b91418bf4e10f4',
    ackDate: '2026-02-25 19:26:00',
    bankDetails: {
      bankName: 'ICICI BANK, SHIVAJI CHOWK, ARVI ROAD, WARDHA',
      accountName: 'MANISHA ENTERPRISE',
      accountNo: '108051000302',
      ifsc: 'ICIC0001080',
      branch: 'ARVI ROAD, WARDHA',
    },
    notes: 'LG Refrigerator stock batch received in good condition. Serial numbers registered in system.',
  },
  {
    id: 'pur-manisha-1',
    billNo: 'PUR-7701',
    date: '2026-08-10',
    supplierName: 'Manisha Enterprises',
    items: 'Wires and modular accessories',
    totalAmount: 95000,
    paidAmount: 50000,
    status: 'Partial',
    paymentMode: 'Online',
    notes: 'Primary wiring stock batch',
  },
  {
    id: 'pur-manisha-2',
    billNo: 'PUR-7702',
    date: '2026-08-25',
    supplierName: 'Manisha Enterprises',
    items: 'PVC pipes & electrical conduits lot',
    totalAmount: 50000,
    paidAmount: 65000,
    status: 'Paid',
    paymentMode: 'Online',
    notes: 'PVC stock batch',
  },
  {
    id: 'pur-1',
    billNo: 'PUR-8821',
    date: '2026-09-06',
    supplierName: 'Polycab Distributors Ltd.',
    items: 'Copper Wires 1.5mm & 2.5mm (50 coils)',
    totalAmount: 72500,
    paidAmount: 72500,
    status: 'Paid',
    paymentMode: 'Online',
  },
  {
    id: 'pur-2',
    billNo: 'PUR-8822',
    date: '2026-09-08',
    supplierName: 'Anchor Switchgear Pvt Ltd',
    items: 'Modular switches, plates, 32A MCBs',
    totalAmount: 28400,
    paidAmount: 20000,
    status: 'Partial',
    paymentMode: 'Online',
  },
];

export const INITIAL_STAFF: StaffMember[] = [
  {
    id: 'stf-1',
    name: 'Ramesh Kadam',
    role: 'Store Manager & Billing',
    phone: '9870011223',
    salary: 18000,
    advancePaid: 2000,
    attendanceToday: 'Present',
  },
  {
    id: 'stf-2',
    name: 'Suresh More',
    role: 'Warehouse & Delivery',
    phone: '9870033445',
    salary: 14000,
    advancePaid: 0,
    attendanceToday: 'Present',
  },
];

export const INITIAL_EXPENSES: ExpenseEntry[] = [
  {
    id: 'exp-1',
    date: '2026-09-09',
    category: 'Tea & Snacks',
    description: 'Staff tea & morning snacks',
    amount: 140,
    paymentMode: 'Cash',
  },
  {
    id: 'exp-2',
    date: '2026-09-09',
    category: 'Transport',
    description: 'Tempo auto delivery freight to Site #3',
    amount: 350,
    paymentMode: 'Cash',
  },
  {
    id: 'exp-3',
    date: '2026-09-05',
    category: 'Electricity',
    description: 'MSEDCL Shop electricity bill',
    amount: 2450,
    paymentMode: 'Online',
  },
];

export const INITIAL_DEALERS: Dealer[] = [
  {
    id: 'dlr-1',
    name: 'Manisha Enterprises',
    phone: '9823019876',
    address: 'Shop 14, Wholesale Electrical Market, Pune',
    gstin: '27AABCM7612E1Z4',
    totalPurchases: 145000,
    totalPaid: 115000,
    balanceDue: 30000,
    lastTransactionDate: '2026-09-08',
  },
  {
    id: 'dlr-2',
    name: 'Polycab Distributors Ltd.',
    phone: '9822019900',
    address: 'Plot 45, MIDC Industrial Area, Chakan',
    gstin: '27AAACP4412F1Z9',
    totalPurchases: 72500,
    totalPaid: 72500,
    balanceDue: 0,
    lastTransactionDate: '2026-09-06',
  },
  {
    id: 'dlr-3',
    name: 'Anchor Switchgear Pvt Ltd',
    phone: '9890045678',
    address: 'Gala 8, Commercial Complex, Station Road',
    gstin: '27AABCA3319K1ZR',
    totalPurchases: 28400,
    totalPaid: 20000,
    balanceDue: 8400,
    lastTransactionDate: '2026-09-08',
  },
];

export const INITIAL_DEALER_PAYMENTS: DealerPayment[] = [
  {
    id: 'dp-1',
    dealerId: 'dlr-1',
    dealerName: 'Manisha Enterprises',
    voucherNo: 'VCH-1001',
    date: '2026-09-05',
    amount: 50000,
    paymentMode: 'Online',
    referenceNo: 'UPI-984712093',
    notes: 'Part payment against August invoices',
    createdAt: '2026-09-05T14:30:00Z',
  },
  {
    id: 'dp-2',
    dealerId: 'dlr-1',
    dealerName: 'Manisha Enterprises',
    voucherNo: 'VCH-1002',
    date: '2026-09-08',
    amount: 65000,
    paymentMode: 'Online',
    referenceNo: 'NEFT-88349120',
    notes: 'Advance against wire and cable supply',
    createdAt: '2026-09-08T16:45:00Z',
  },
];

export const INITIAL_CARD_MEMBERS: CardMember[] = [
  // Scheme 1 (Card Nos 1001-2999)
  {
    id: 'cm-1030',
    cardNumber: 1030,
    schemeId: 'scheme1',
    schemeName: 'Scheme 1 (योजना 1)',
    customerName: 'SANGITA UTTAM PATIL',
    phone: '9822001030',
    village: 'HINGNI',
    address: 'HINGNI, Wardha',
    joiningDate: '2025-06-01',
    registrationFee: 50,
    registrationFeePaid: true,
    totalDeposited: 450,
    totalRefunded: 0,
    netBalance: 450,
    status: 'Active',
    notes: 'Active Member (Scheme 1)',
  },
  {
    id: 'cm-1029',
    cardNumber: 1029,
    schemeId: 'scheme1',
    schemeName: 'Scheme 1 (योजना 1)',
    customerName: 'YAMUNA PRABHAKAR KAIKADI',
    phone: '9822001029',
    village: 'HINGNI',
    address: 'HINGNI, Wardha',
    joiningDate: '2025-06-01',
    registrationFee: 50,
    registrationFeePaid: true,
    totalDeposited: 200,
    totalRefunded: 0,
    netBalance: 200,
    status: 'Active',
    notes: 'Active Member (Scheme 1)',
  },
  {
    id: 'cm-1021',
    cardNumber: 1021,
    schemeId: 'scheme1',
    schemeName: 'Scheme 1 (योजना 1)',
    customerName: 'SURAJ GAUTAM MOON',
    phone: '9822001021',
    village: 'SINDHI MEGHE',
    address: 'SINDHI MEGHE, Wardha',
    joiningDate: '2025-06-01',
    registrationFee: 50,
    registrationFeePaid: true,
    totalDeposited: 300,
    totalRefunded: 0,
    netBalance: 300,
    status: 'Active',
    notes: 'Active Member (Scheme 1)',
  },
  {
    id: 'cm-1081',
    cardNumber: 1081,
    schemeId: 'scheme1',
    schemeName: 'Scheme 1 (योजना 1)',
    customerName: 'SHALINI NARAYAN KUBHARE',
    phone: '',
    village: 'HINGNI',
    address: 'HINGNI, Wardha',
    joiningDate: '2025-06-01',
    registrationFee: 50,
    registrationFeePaid: true,
    totalDeposited: 500,
    totalRefunded: 0,
    netBalance: 500,
    status: 'Active',
    notes: 'Active Member (Scheme 1)',
  },
  {
    id: 'cm-1242',
    cardNumber: 1242,
    schemeId: 'scheme1',
    schemeName: 'Scheme 1 (योजना 1)',
    customerName: 'SAVITA VASANT RAUT',
    phone: '9822001242',
    village: 'WAIFAD',
    address: 'WAIFAD, Wardha',
    joiningDate: '2025-06-01',
    registrationFee: 50,
    registrationFeePaid: true,
    totalDeposited: 5300,
    totalRefunded: 0,
    netBalance: 5300,
    status: 'Active',
    notes: 'Active Member (Scheme 1)',
  },

  // Scheme 2 (Card Nos 3001-3999)
  {
    id: 'cm-3191',
    cardNumber: 3191,
    schemeId: 'scheme2',
    schemeName: 'Scheme 2 (योजना 2)',
    customerName: 'SUNIL DANDAGE',
    phone: '9822003191',
    village: 'PIPRI',
    address: 'PIPRI, Wardha',
    sheetNo: '',
    openingAmt: 0,
    joiningDate: '2024-11-01',
    registrationFee: 50,
    registrationFeePaid: true,
    totalDeposited: 3000,
    totalRefunded: 0,
    netBalance: 3000,
    status: 'Active',
    notes: 'Active Member (Scheme 2)',
  },
  {
    id: 'cm-3201',
    cardNumber: 3201,
    schemeId: 'scheme2',
    schemeName: 'Scheme 2 (योजना 2)',
    customerName: 'PRASHANT BHALE',
    phone: '',
    village: 'SATODA',
    address: 'SATODA, Wardha',
    sheetNo: '',
    openingAmt: 100,
    joiningDate: '2024-11-01',
    registrationFee: 50,
    registrationFeePaid: true,
    totalDeposited: 100,
    totalRefunded: 0,
    netBalance: 100,
    status: 'Active',
    notes: 'Active Member (Scheme 2)',
  },
  {
    id: 'cm-3001',
    cardNumber: 3001,
    schemeId: 'scheme2',
    schemeName: 'Scheme 2 (योजना 2)',
    customerName: 'SHIVANSHU NIDHEKAR',
    phone: '',
    village: 'JAMNI',
    address: 'JAMNI, Wardha',
    sheetNo: '',
    openingAmt: 200,
    joiningDate: '2024-11-01',
    registrationFee: 50,
    registrationFeePaid: true,
    totalDeposited: 200,
    totalRefunded: 0,
    netBalance: 200,
    status: 'Active',
    notes: 'Active Member (Scheme 2)',
  },
  {
    id: 'cm-3123',
    cardNumber: 3123,
    schemeId: 'scheme2',
    schemeName: 'Scheme 2 (योजना 2)',
    customerName: 'PRATIBHA MAROTI KHOLAME',
    phone: '9822003123',
    village: 'PARSODI',
    address: 'PARSODI, Wardha',
    sheetNo: '',
    openingAmt: 200,
    joiningDate: '2024-11-01',
    registrationFee: 50,
    registrationFeePaid: true,
    totalDeposited: 200,
    totalRefunded: 0,
    netBalance: 200,
    status: 'Active',
    notes: 'Active Member (Scheme 2)',
  },
  {
    id: 'cm-3014',
    cardNumber: 3014,
    schemeId: 'scheme2',
    schemeName: 'Scheme 2 (योजना 2)',
    customerName: 'BALAJI SHAMRAO DANDGE',
    phone: '9822003014',
    village: 'SHIVNAGAR',
    address: 'SHIVNAGAR, Wardha',
    sheetNo: '',
    openingAmt: 1000,
    joiningDate: '2024-11-01',
    registrationFee: 50,
    registrationFeePaid: true,
    totalDeposited: 1000,
    totalRefunded: 0,
    netBalance: 1000,
    status: 'Active',
    notes: 'Active Member (Scheme 2)',
  },
  {
    id: 'cm-3234',
    cardNumber: 3234,
    schemeId: 'scheme2',
    schemeName: 'Scheme 2 (योजना 2)',
    customerName: 'SARIKA SANDIP BHANDEKAR',
    phone: '9822003234',
    village: 'KANHOLI BARA',
    address: 'KANHOLI BARA, Wardha',
    sheetNo: '',
    openingAmt: 100,
    joiningDate: '2024-11-01',
    registrationFee: 50,
    registrationFeePaid: true,
    totalDeposited: 100,
    totalRefunded: 0,
    netBalance: 100,
    status: 'Active',
    notes: 'Active Member (Scheme 2)',
  },
  {
    id: 'cm-3027',
    cardNumber: 3027,
    schemeId: 'scheme2',
    schemeName: 'Scheme 2 (योजना 2)',
    customerName: 'SUNIL GHONGADE',
    phone: '9822003027',
    village: 'SATODA',
    address: 'SATODA, Wardha',
    sheetNo: '',
    openingAmt: 500,
    joiningDate: '2024-11-01',
    registrationFee: 50,
    registrationFeePaid: true,
    totalDeposited: 500,
    totalRefunded: 0,
    netBalance: 500,
    status: 'Active',
    notes: 'Active Member (Scheme 2)',
  },

  // Scheme 3 (Card Nos 4001-6000)
  {
    id: 'cm-4107',
    cardNumber: 4107,
    schemeId: 'scheme3',
    schemeName: 'Scheme 3 (योजना 3)',
    customerName: 'RANJANA SHAMBHARKAR',
    phone: '',
    village: 'BORI',
    address: 'BORI, Wardha',
    sheetNo: '2793',
    openingAmt: 600,
    joiningDate: '2025-07-05',
    registrationFee: 50,
    registrationFeePaid: true,
    totalDeposited: 600,
    totalRefunded: 0,
    netBalance: 600,
    status: 'Active',
    notes: 'Active Member (Scheme 3) • Sheet #2793',
  },
  {
    id: 'cm-4304',
    cardNumber: 4304,
    schemeId: 'scheme3',
    schemeName: 'Scheme 3 (योजना 3)',
    customerName: 'VAISHALI BAVNE',
    phone: '',
    village: 'HINGNI',
    address: 'HINGNI, Wardha',
    sheetNo: '5104',
    openingAmt: 100,
    joiningDate: '2025-10-18',
    registrationFee: 50,
    registrationFeePaid: true,
    totalDeposited: 100,
    totalRefunded: 0,
    netBalance: 100,
    status: 'Active',
    notes: 'Active Member (Scheme 3) • Sheet #5104',
  },
  {
    id: 'cm-4181',
    cardNumber: 4181,
    schemeId: 'scheme3',
    schemeName: 'Scheme 3 (योजना 3)',
    customerName: 'SANGITA',
    phone: '',
    village: 'DEVNAGAR',
    address: 'DEVNAGAR, Wardha',
    sheetNo: '5110',
    openingAmt: 200,
    joiningDate: '2025-10-01',
    registrationFee: 50,
    registrationFeePaid: true,
    totalDeposited: 200,
    totalRefunded: 0,
    netBalance: 200,
    status: 'Active',
    notes: 'Active Member (Scheme 3) • Sheet #5110',
  },
  {
    id: 'cm-4302',
    cardNumber: 4302,
    schemeId: 'scheme3',
    schemeName: 'Scheme 3 (योजना 3)',
    customerName: 'SANJAY KUMBHARE',
    phone: '',
    village: 'KELHZAR',
    address: 'KELHZAR, Wardha',
    sheetNo: '5122',
    openingAmt: 500,
    joiningDate: '2025-10-01',
    registrationFee: 50,
    registrationFeePaid: true,
    totalDeposited: 500,
    totalRefunded: 0,
    netBalance: 500,
    status: 'Active',
    notes: 'Active Member (Scheme 3) • Sheet #5122',
  },
  {
    id: 'cm-4349',
    cardNumber: 4349,
    schemeId: 'scheme3',
    schemeName: 'Scheme 3 (योजना 3)',
    customerName: 'RAHUL DUDHAKOHALHE',
    phone: '',
    village: 'VAYFAD',
    address: 'VAYFAD, Wardha',
    sheetNo: '5125',
    openingAmt: 100,
    joiningDate: '2025-10-29',
    registrationFee: 50,
    registrationFeePaid: true,
    totalDeposited: 100,
    totalRefunded: 0,
    netBalance: 100,
    status: 'Active',
    notes: 'Active Member (Scheme 3) • Sheet #5125',
  },
  {
    id: 'cm-4352',
    cardNumber: 4352,
    schemeId: 'scheme3',
    schemeName: 'Scheme 3 (योजना 3)',
    customerName: 'KAUSHALYA CHAUDHARI',
    phone: '',
    village: 'KHADKI',
    address: 'KHADKI, Wardha',
    sheetNo: '5132',
    openingAmt: 500,
    joiningDate: '2025-11-02',
    registrationFee: 50,
    registrationFeePaid: true,
    totalDeposited: 500,
    totalRefunded: 0,
    netBalance: 500,
    status: 'Active',
    notes: 'Active Member (Scheme 3) • Sheet #5132',
  },
  {
    id: 'cm-4398',
    cardNumber: 4398,
    schemeId: 'scheme3',
    schemeName: 'Scheme 3 (योजना 3)',
    customerName: 'GANESH TELRANDE',
    phone: '9822004398',
    village: 'KELHZAR',
    address: 'KELHZAR, Wardha',
    sheetNo: '5166',
    openingAmt: 100,
    joiningDate: '2025-11-01',
    registrationFee: 50,
    registrationFeePaid: true,
    totalDeposited: 100,
    totalRefunded: 0,
    netBalance: 100,
    status: 'Active',
    notes: 'Active Member (Scheme 3) • Sheet #5166',
  },
  {
    id: 'cm-4393',
    cardNumber: 4393,
    schemeId: 'scheme3',
    schemeName: 'Scheme 3 (योजना 3)',
    customerName: 'RUPALI PULKARI',
    phone: '',
    village: 'VAYFAD',
    address: 'VAYFAD, Wardha',
    sheetNo: '5486',
    openingAmt: 600,
    joiningDate: '2025-11-26',
    registrationFee: 50,
    registrationFeePaid: true,
    totalDeposited: 600,
    totalRefunded: 0,
    netBalance: 600,
    status: 'Active',
    notes: 'Active Member (Scheme 3) • Sheet #5486',
  },
  {
    id: 'cm-4049',
    cardNumber: 4049,
    schemeId: 'scheme3',
    schemeName: 'Scheme 3 (योजना 3)',
    customerName: 'AADESH DEHARE',
    phone: '',
    village: 'KHADKI',
    address: 'KHADKI, Wardha',
    sheetNo: '634',
    openingAmt: 1000,
    joiningDate: '2025-06-15',
    registrationFee: 50,
    registrationFeePaid: true,
    totalDeposited: 1000,
    totalRefunded: 0,
    netBalance: 1000,
    status: 'Active',
    notes: 'Active Member (Scheme 3) • Sheet #634',
  },
];

export const INITIAL_CARD_TRANSACTIONS: CardTransaction[] = [
  {
    id: 'ctx-1',
    cardId: 'cm-1',
    cardNumber: 1001,
    schemeId: 'scheme1',
    customerName: 'Prakash Shinde',
    customerPhone: '9822456781',
    receiptNo: 'REC-SCH1-001',
    date: '2026-07-01',
    type: 'Fee',
    amount: 50,
    paymentMode: 'Cash',
    remarks: 'Card Opening / Registration Fee',
    balanceAfter: 0,
    createdAt: '2026-07-01T10:00:00Z',
  },
  {
    id: 'ctx-2',
    cardId: 'cm-1',
    cardNumber: 1001,
    schemeId: 'scheme1',
    customerName: 'Prakash Shinde',
    customerPhone: '9822456781',
    receiptNo: 'REC-SCH1-012',
    date: '2026-07-08',
    type: 'WeeklyPayment',
    weekNumber: 1,
    amount: 1000,
    paymentMode: 'Cash',
    remarks: 'Week 1 Installment',
    balanceAfter: 1000,
    createdAt: '2026-07-08T11:00:00Z',
  },
  {
    id: 'ctx-3',
    cardId: 'cm-1',
    cardNumber: 1001,
    schemeId: 'scheme1',
    customerName: 'Prakash Shinde',
    customerPhone: '9822456781',
    receiptNo: 'REC-SCH1-045',
    date: '2026-08-15',
    type: 'WeeklyPayment',
    weekNumber: 6,
    amount: 4000,
    paymentMode: 'Online',
    remarks: 'Weeks 2 to 5 lump-sum deposit',
    balanceAfter: 5000,
    createdAt: '2026-08-15T15:30:00Z',
  },
  {
    id: 'ctx-4',
    cardId: 'cm-1',
    cardNumber: 1001,
    schemeId: 'scheme1',
    customerName: 'Prakash Shinde',
    customerPhone: '9822456781',
    receiptNo: 'REC-SCH1-098',
    date: '2026-08-28',
    type: 'WeeklyPayment',
    weekNumber: 8,
    amount: 5000,
    paymentMode: 'Cash',
    remarks: 'Week 7 & 8 deposit',
    balanceAfter: 10000,
    createdAt: '2026-08-28T16:00:00Z',
  },
  {
    id: 'ctx-5',
    cardId: 'cm-1',
    cardNumber: 1001,
    schemeId: 'scheme1',
    customerName: 'Prakash Shinde',
    customerPhone: '9822456781',
    receiptNo: 'REF-SCH1-003',
    date: '2026-09-04',
    type: 'Refund',
    amount: 5000,
    paymentMode: 'Cash',
    remarks: 'Partial withdrawal/refund to customer (₹10000 se ₹5000 wapas)',
    balanceAfter: 5000,
    createdAt: '2026-09-04T12:00:00Z',
  },
];

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

      return {
        settings: mergedSettings,
        stock: loadedStock,
        customers: Array.isArray(parsed.customers) ? parsed.customers : [],
        transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
        purchases: Array.isArray(parsed.purchases) ? parsed.purchases : [],
        dealers: Array.isArray(parsed.dealers) ? parsed.dealers : [],
        dealerPayments: Array.isArray(parsed.dealerPayments) ? parsed.dealerPayments : [],
        cardMembers: Array.isArray(parsed.cardMembers) ? parsed.cardMembers : [],
        cardTransactions: Array.isArray(parsed.cardTransactions) ? parsed.cardTransactions : [],
        staff: Array.isArray(parsed.staff) ? parsed.staff : INITIAL_STAFF,
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
    staff: INITIAL_STAFF,
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
    staff: currentDb.staff && currentDb.staff.length > 0 ? currentDb.staff : INITIAL_STAFF,
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

