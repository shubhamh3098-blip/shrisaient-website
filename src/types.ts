/**
 * Shri Sai Enterprises - Cash & Business Manager
 * Schema definitions matching StoreData Firestore & Local entity structure
 */

export interface SchemeDefinition {
  id: string;
  name: string;
  code: string;
  startCardNo: number;
  endCardNo: number;
  registrationFee: number; // e.g. 50
  description: string;
  color: string;
}

export interface FinanceProviderConfig {
  id: 'bajaj' | 'tvs' | 'hdb' | 'idbi' | 'other';
  name: string;
  color: string;
  badge: string;
  defaultDbdPercent?: number;
  defaultProcessingFee?: number;
}

export interface StoreSettings {
  storeName: string;
  businessNameHindi?: string;
  domainName?: string;
  ownerName?: string;
  role?: string;
  tagline: string;
  address: string;
  addressHindi?: string;
  city: string;
  pincode: string;
  state: string;
  phone: string;
  additionalPhones?: string[];
  email: string;
  gstin: string;
  panNumber: string;
  bankDetails: {
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    branch: string;
    upiId: string;
  };
  invoicePrefix: string;
  nextInvoiceNo?: number;
  nextReceiptNo: number; // Begins from 1079
  currencySymbol: string;
  deliveryRates?: {
    freeDeliveryMinAmount: number;
    localDeliveryFee: number;
    outerDeliveryFee: number;
    estimatedDeliveryTime: string;
    deliveryAreas: string;
    deliveryNote: string;
  };
  shopNotice?: string;
  whatsappGroupLink?: string;
  whatsappOrderNumber?: string;
  whatsappSecondaryNumber?: string;
  warrantyDisclaimer?: string;
  schemeDefaults: {
    schemeName: string;
    durationMonths: number; // 30
    monthlyAmount: number; // 1000
    totalBenefit: string;
  };
  schemesList?: SchemeDefinition[];
  termsAndConditions: string[];
}

export interface StockItem {
  id: string;
  code: string; // SKU or barcode
  name: string;
  category: 'Electronics' | 'Furniture' | 'Home Appliances' | 'Kitchen Appliances' | 'Other';
  brand: string;
  model: string;
  serialNo?: string;
  purchasePrice: number;
  salePrice: number;
  mrp: number;
  stockQty: number;
  minAlertQty: number;
  unit: string; // Pcs, Sets, Units
  location?: string; // Floor / Rack
  warrantyMonths?: number;
  description?: string;
  specs?: string[];
  imageUrl?: string;
  updatedAt: string;
  // Landing Page Showroom extensions
  isFeaturedOnLanding?: boolean;
  landingBadge?: string;
  schemeWeeklyAmount?: number;
  hideOnLanding?: boolean;
}

export interface LandingHeroSlide {
  id: string;
  tag: string;
  titleLead: string;
  titleHighlight: string;
  subtitle: string;
  imageUrl: string;
  primaryBtnText: string;
  primaryBtnTarget?: 'catalog' | 'scheme' | 'whatsapp' | 'passbook';
  secondaryBtnText: string;
  secondaryBtnTarget?: 'catalog' | 'scheme' | 'whatsapp' | 'passbook';
  cardBadge: string;
  cardMetric: string;
  cardMetric2: string;
  themeColor: string;
  active: boolean;
}

export interface LandingOffer {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  discount: string;
  couponCode?: string;
  validTill: string;
  category: string;
  imageUrl?: string;
  whatsappMessage?: string;
  active: boolean;
}

export interface LandingAnnouncement {
  enabled: boolean;
  badge: string;
  text: string;
  highlightText?: string;
  whatsappButtonText?: string;
}

export interface LandingContactInfo {
  helpline1: string;
  helpline2: string;
  helpline3: string;
  whatsappNumber: string;
  addressHindi: string;
  landmark: string;
  googleMapLink: string;
  timings: string;
}

export interface LandingSchemeBanner {
  title: string;
  subtitle: string;
  badge: string;
  weeklyBadge1: string;
  weeklyBadge2: string;
  highlightNote: string;
}

export interface LandingPageConfig {
  announcement: LandingAnnouncement;
  heroSlides: LandingHeroSlide[];
  offers: LandingOffer[];
  contactInfo: LandingContactInfo;
  schemeBanner: LandingSchemeBanner;
  enableOffersSection: boolean;
  enableAnnouncementBar: boolean;
  showHeroSection?: boolean;
  showSchemeBanner?: boolean;
  showReviewsSection?: boolean;
  showElectronicsSection?: boolean;
  showFurnitureSection?: boolean;
  showAddressBanner?: boolean;
  showPassbookSection?: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  altPhone?: string;
  address: string;
  city: string;
  village?: string;
  creditLimit: number;
  maxDueDays?: number; // Credit validity (default 60 days)
  currentBalance: number; // Unpaid dues
  totalPurchased: number;
  totalPurchase?: number; // Alias for import convenience
  status?: string;
  createdAt: string;
  notes?: string;
}

export interface InvoiceItem {
  stockId: string;
  name: string;
  brand: string;
  model?: string;
  serialNo?: string;
  qty: number;
  rate: number;
  discountPct: number;
  taxPct: number;
  total: number;
}

export interface Transaction {
  id: string;
  invoiceNo: string;
  date: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  items: InvoiceItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  paidAmount: number;
  balanceDue: number;
  paymentMode: 'Cash' | 'UPI' | 'Card' | 'Bajaj Finance' | 'Cheque' | 'Scheme Adjustment' | 'Credit' | 'Bank Transfer' | 'EMI';
  status: 'Paid' | 'Partial' | 'Unpaid';
  deliveryStatus: 'Delivered' | 'Pending Delivery' | 'Dispatched';
  linkedCardId?: string;
  linkedCardNo?: string;
  schemeDiscount?: number;
  financeDetails?: {
    isFinance: boolean;
    provider?: string;
    downPayment?: number;
    loanAmount?: number;
    fileNo?: string;
    emiMonths?: number;
    monthlyEmi?: number;
  };
  remarks?: string;
  createdBy: string;
}

export interface PurchaseItem {
  name: string;
  brand: string;
  model?: string;
  serialNo?: string;
  barcode?: string;
  qty: number;
  purchaseRate: number;
  salePrice?: number;
  total: number;
}

export interface Purchase {
  id: string;
  purchaseNo: string;
  dealerId: string;
  dealerName: string;
  date: string;
  items: PurchaseItem[];
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  paymentMode: string;
  updateStock?: boolean;
  notes?: string;
}

export interface Dealer {
  id: string;
  name: string;
  companyName: string;
  phone: string;
  email?: string;
  city: string;
  openingBalance: number;
  currentPayable: number;
  notes?: string;
}

export interface DealerPayment {
  id: string;
  dealerId: string;
  dealerName: string;
  date: string;
  amount: number;
  paymentMode: 'NEFT/RTGS' | 'Cheque' | 'Cash' | 'UPI';
  referenceNo?: string;
  note?: string;
}

export interface CardMember {
  id: string;
  cardNo: string; // e.g. 1050 or SSE-CD-1050
  schemeNo?: number; // 1, 2, 3, 4, 5 (Scheme 1 & 2: 1001-3000, Scheme 3, 4, 5: 1001-6000)
  schemeName?: string; // e.g. 'योजना १ (1001-3000)'
  sheetNo?: string;
  memberName: string;
  phone: string;
  address: string;
  village?: string;
  nomineeName?: string;
  durationMonths: number; // 30
  monthlyAmount: number; // e.g. 100, 200, 1000
  targetAmount?: number; // e.g. 15000 (weekly 100/200 scheme) or 30000 (monthly 1000 scheme)
  planType?: '15000_scheme' | '30000_scheme' | 'custom_scheme';
  schemeMonth?: number;
  monthlyFee?: number;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Draw Winner' | 'Matured' | 'Redeemed' | 'Surrendered';
  totalPaidMonths: number;
  paidMonthsCount?: number;
  totalAmountPaid: number;
  totalPaid?: number;
  isLuckyDrawEligible?: boolean;
  drawMonthWon?: number;
  prizeDetails?: string;
  collectedBy?: string;
  notes?: string;
  // Attached Item Delivered / Bill Khata Details
  deliveredItemName?: string;
  itemBillNo?: string;
  itemBillDate?: string;
  itemTotalAmount?: number;
  itemAdvancePaid?: number;
  itemBalanceDue?: number;
  itemDueDt?: string;
}

export interface CardTransaction {
  id: string;
  receiptNo: string;
  cardMemberId: string;
  cardNo: string;
  memberName: string;
  monthNumber: number; // 1 to 30
  amount: number;
  date: string;
  paymentMode: 'Cash' | 'UPI' | 'Bank Transfer';
  collectedBy: string;
  weekNumber?: number;
  remarks?: string;
}

export interface Staff {
  id: string;
  name: string;
  role: 'Sales Executive' | 'Floor Manager' | 'Cashier' | 'Delivery Driver' | 'Accountant' | 'Agent';
  phone: string;
  monthlySalary: number;
  joiningDate: string;
  isActive: boolean;
}

export interface Expense {
  id: string;
  date: string;
  category: 'Shop Rent' | 'Electricity & Gen' | 'Tea & Refreshments' | 'Staff Welfare' | 'Freight & Transport' | 'Advertising' | 'Showroom Maintenance' | 'Miscellaneous';
  amount: number;
  paymentMode: 'Cash' | 'UPI' | 'Bank Transfer';
  paidTo: string;
  voucherNo: string;
  note?: string;
}

export interface AgentAdvance {
  id: string;
  staffId: string;
  staffName: string;
  date: string;
  amount: number;
  reason: string;
  deductionMonth: string; // e.g. "Oct 2026"
  status: 'Pending' | 'Deducted' | 'Waived';
}

export interface BillReceipt {
  id: string;
  receiptNo: number; // Numbered starting from 1079
  customerId: string;
  customerName: string;
  invoiceNo?: string;
  amountPaid: number;
  date: string;
  paymentMode: 'Cash' | 'UPI' | 'Cheque' | 'Card';
  balanceRemaining: number;
  remarks?: string;
  handledBy: string;
}

export interface AuthSession {
  id: string;
  username: string;
  role: 'Admin' | 'Manager' | 'Cashier';
  loginTime: string;
  device: string;
}

export interface SecurityAuditEntry {
  id: string;
  timestamp: string;
  username: string;
  role: string;
  eventType:
    | 'LOGIN_SUCCESS'
    | 'LOGIN_FAILED'
    | 'LOGOUT'
    | 'PASSWORD_CHANGED'
    | 'LOCKOUT_TRIGGERED'
    | 'STAFF_ADDED'
    | 'ACCOUNT_APPROVED'
    | 'ACCOUNT_REJECTED'
    | 'ACCOUNT_DELETED'
    | 'SECURITY_SETTINGS_UPDATED';
  ipOrDevice: string;
  details?: string;
}

export interface SecuritySettings {
  masterUsername: string;
  masterPasswordHash?: string;
  masterPinHash?: string;
  securityRecoveryQuestion?: string;
  securityRecoveryAnswerHash?: string;
  maxFailedAttempts: number;
  lockoutDurationMinutes: number;
  autoLockMinutes: number;
  requireStrongPassword: boolean;
}

export interface AdminUser {
  id: string;
  username: string;
  displayName: string;
  role: 'Admin' | 'Manager' | 'Cashier' | 'Agent' | 'Staff';
  pin: string; // PIN or Password hash
  phone?: string;
  status?: 'active' | 'pending' | 'rejected';
  createdAt?: string;
  approvedBy?: string;
  passwordHash?: string;
  lastLogin?: string;
}

export interface CashDenomination {
  d500: number;
  d200: number;
  d100: number;
  d50: number;
  d20: number;
  d10: number;
  coins: number;
}

export interface DailyCashClosing {
  id: string;
  date: string; // YYYY-MM-DD
  closedAt: string; // ISO string
  closedBy: string; // Staff/Admin name

  // Inflows
  openingCash: number;
  salesCash: number; // Cash from Transactions
  receiptsCash: number; // Cash from Customer Bill Receipts
  schemeCash: number; // Cash from Card Scheme installments
  otherCashIn: number;
  totalCashIn: number;

  // Outflows
  expensesCash: number; // Cash paid for shop expenses
  staffAdvanceCash: number; // Cash paid for staff/agent advances
  dealerCash: number; // Cash paid to wholesale dealers
  otherCashOut: number;
  totalCashOut: number;

  // Expected vs Actual
  expectedCash: number; // openingCash + totalCashIn - totalCashOut
  actualCash: number; // calculated from denomination breakdown
  discrepancy: number; // actualCash - expectedCash (0 = matched, negative = shortage/तूट, positive = excess)
  denominations: CashDenomination;
  remarks?: string;
  status: 'Matched' | 'Shortage' | 'Excess';
}

export interface DealerPdcCheque {
  id: string;
  dealerId: string;
  dealerName: string;
  chequeNumber: string;
  bankName: string;
  amount: number;
  issueDate: string;
  dueDate: string; // PDC Maturity Date
  daysRemaining?: number;
  status: 'Upcoming' | 'Due in 3 Days' | 'Due Today' | 'Overdue' | 'Cleared' | 'Bounced';
  note?: string;
}

export interface WarrantyServiceReminder {
  id: string;
  transactionId: string;
  invoiceNo: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  productName: string;
  brand: string;
  serialNo?: string;
  saleDate: string;
  warrantyMonths: number;
  expiryDate: string;
  serviceDueDate: string; // Usually at 6 or 12 months for preventive checkup
  status: 'Active' | 'Expiring Soon' | 'Expired';
  lastReminderSent?: string;
}

export interface FestivalPromoCreative {
  id: string;
  festivalName: string;
  category: string;
  headline: string;
  tagline: string;
  discount: string;
  schemeWeekly: string;
  whatsappMessage: string;
  themeColor: string;
  createdAt: string;
}

export interface PurchaseOrderItem {
  itemName: string;
  category: string;
  brand: string;
  qty: number;
  expectedRate: number;
  total: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  dealerId: string;
  dealerName: string;
  date: string;
  expectedDate?: string;
  items: PurchaseOrderItem[];
  totalAmount: number;
  notes?: string;
  status: 'Draft' | 'Sent' | 'Received' | 'Cancelled';
}

export interface DebitNote {
  id: string;
  debitNoteNo: string;
  dealerId: string;
  dealerName: string;
  date: string;
  reason: 'Transit Damage' | 'Defective Display/Panel' | 'Cracked Body' | 'Rate Difference' | 'Short Supply' | 'Other';
  productName: string;
  serialNo?: string;
  amount: number;
  status: 'Applied' | 'Settled' | 'Pending';
  remarks?: string;
}

export interface StaffAttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  staffId: string;
  staffName: string;
  status: 'Present' | 'Half Day' | 'Absent' | 'Paid Leave';
  overtimeHours?: number;
  note?: string;
}

export interface CustomerLoyaltyRecord {
  customerId: string;
  customerName: string;
  pointsBalance: number; // 1 point = ₹1
  totalEarned: number;
  totalRedeemed: number;
  referredBy?: string;
  referralCount: number;
}

export interface DeliveryChallan {
  id: string;
  challanNo: string;
  date: string;
  invoiceNo?: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  vehicleNo: string;
  driverName: string;
  driverPhone: string;
  items: { itemName: string; qty: number; serialNo?: string }[];
  ewayBillNo?: string;
  dispatchTime: string;
  status: 'Dispatched' | 'Delivered' | 'Returned';
  receiverSign?: boolean;
}

export interface FinanceCase {
  id: string;
  fileNo: string;
  customerName: string;
  customerPhone: string;
  provider: 'Bajaj Finserv' | 'TVS Credit' | 'HDB Financial' | 'IDFC First' | 'Other';
  productName: string;
  invoiceAmount: number;
  downPayment: number;
  loanAmount: number;
  tenureMonths: number;
  monthlyEmi: number;
  dbdPercent?: number; // Dealer Buy Down
  status: 'Document Pending' | 'Underwriting' | 'Approved' | 'Delivered' | 'Disbursed' | 'Rejected';
  approvalDate?: string;
  disbursedAmount?: number;
  utrNo?: string;
}

export interface CustomerCreditScore {
  customerId: string;
  customerName: string;
  score: number; // 300 to 900
  grade: 'A+ Elite' | 'A Good' | 'B Fair' | 'C Watchlist' | 'High Risk';
  factors: string[];
  maxCreditAllowed: number;
  isCreditBlocked: boolean;
}

export interface StoreData {
  updatedAt: string;
  updatedBy: string;
  settings: StoreSettings;
  stock: StockItem[];
  customers: Customer[];
  transactions: Transaction[];
  purchases: Purchase[];
  dealers: Dealer[];
  dealerPayments: DealerPayment[];
  cardMembers: CardMember[];
  cardTransactions: CardTransaction[];
  staff: Staff[];
  expenses: Expense[];
  agentAdvances: AgentAdvance[];
  billReceipts: BillReceipt[];
  authSessions: AuthSession[];
  adminUsers: AdminUser[];
  dailyClosings?: DailyCashClosing[];
  dealerCheques?: DealerPdcCheque[];
  serviceReminders?: WarrantyServiceReminder[];
  savedPromos?: FestivalPromoCreative[];
  lastBackupDate?: string;
  isDemoWiped?: boolean;
  securitySettings?: SecuritySettings;
  securityAuditLogs?: SecurityAuditEntry[];
  landingPageConfig?: LandingPageConfig;
  purchaseOrders?: PurchaseOrder[];
  debitNotes?: DebitNote[];
  staffAttendance?: StaffAttendanceRecord[];
  loyaltyRecords?: CustomerLoyaltyRecord[];
  deliveryChallans?: DeliveryChallan[];
  financeCases?: FinanceCase[];
}
