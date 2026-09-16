export type CardSchemeId = 'scheme1' | 'scheme2' | 'scheme3' | 'scheme4' | 'scheme5' | 'scheme6' | string;

export interface CardSchemeConfig {
  id: CardSchemeId;
  name: string;
  code: string;
  startCardNo: number;
  endCardNo: number;
  registrationFee: number; // default 50
  description: string;
  color: string;
}

export interface CardMember {
  id: string;
  uniqueId?: string; // e.g. SAI-SCH1-4107
  cardNumber: number;
  schemeId: CardSchemeId;
  schemeName: string;
  customerName: string;
  phone: string;
  village?: string;
  address?: string;
  sheetNo?: string;
  agentName?: string;
  openingAmt?: number;
  joiningDate: string;
  registrationFee: number;
  registrationFeePaid: boolean;
  totalDeposited: number;
  totalRefunded: number;
  netBalance: number; // totalDeposited - totalRefunded
  status: 'Active' | 'Completed' | 'Closed';
  notes?: string;
}

export interface CardTransaction {
  id: string;
  cardId: string;
  cardNumber: number;
  schemeId: CardSchemeId;
  customerName: string;
  customerPhone?: string;
  receiptNo: string;
  date: string;
  type: 'WeeklyPayment' | 'Refund' | 'Fee';
  weekNumber?: number;
  amount: number;
  paymentMode: 'Cash' | 'Online';
  agentName?: string;
  remarks?: string;
  balanceAfter: number;
  createdAt: string;
}

export interface Dealer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  gstin?: string;
  totalPurchases: number;
  totalPaid: number;
  balanceDue: number; // totalPurchases - totalPaid
  lastTransactionDate?: string;
}

export interface DealerPayment {
  id: string;
  dealerId: string;
  dealerName: string;
  voucherNo: string;
  date: string;
  amount: number;
  paymentMode: 'Cash' | 'Online' | 'Cheque';
  referenceNo?: string;
  notes?: string;
  createdAt: string;
}

export interface TransactionEntry {
  id: string;
  invoiceNo: string;
  date: string;
  customerName: string;
  customerPhone?: string;
  customerId?: string;
  village?: string;
  cardNumber?: number;
  schemeId?: CardSchemeId;
  stockItemId?: string;
  stockItemName?: string;
  quantity?: number;
  unitPrice?: number;
  category?: string;
  itemDetails: string;
  totalAmount: number;
  payingNow: number;
  dueAmount: number; // totalAmount - payingNow
  paymentMode: 'Cash' | 'Online';
  refBillNo?: string;
  againstBillNo?: string;
  entryType?: 'Bill' | 'Receipt';
  modelNo?: string;
  serialNo?: string;
  isQuotation?: boolean;
  quotationValidity?: string;
  notes?: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  village?: string;
  address?: string;
  totalPurchased: number;
  totalPurchases?: number; // alias for totalPurchased
  totalPaid: number;
  balanceDue: number;
  linkedCardNumber?: number;
  linkedSchemeId?: CardSchemeId;
  lastVisit?: string;
  lastTransactionDate?: string;
}

export interface StockItem {
  id: string;
  name: string;
  code: string;
  category: string;
  quantity: number;
  unit: string;
  sellingPrice: number;
  purchasePrice: number;
  minStockLevel: number;
  imageUrl?: string;
  description?: string;
}

export interface PurchaseLineItem {
  id?: string;
  description: string;
  hsn?: string;
  quantity: number;
  rate: number;
  discount?: number;
  taxableAmount: number;
  cgstRate?: number;
  cgstAmount?: number;
  sgstRate?: number;
  sgstAmount?: number;
  igstRate?: number;
  igstAmount?: number;
  totalAmount: number;
  serialNumbers?: string[]; // e.g. ["602NRZX294301", "602NRQV293652"]
}

export interface PurchaseEntry {
  id: string;
  billNo: string;
  date: string;
  supplierName: string;
  supplierAddress?: string;
  supplierPhone?: string;
  supplierGstin?: string;
  poNo?: string;
  poDate?: string;
  salesConsultant?: string;
  approvedBy?: string;
  location?: string;
  items: string;
  lineItems?: PurchaseLineItem[];
  taxableAmount?: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  totalAmount: number;
  paidAmount: number;
  status: 'Paid' | 'Partial' | 'Pending';
  paymentMode: 'Cash' | 'Online' | 'Cheque';
  transporter?: string;
  vehicleNo?: string;
  ewayBillNo?: string;
  irn?: string;
  ackDate?: string;
  bankDetails?: {
    bankName?: string;
    accountName?: string;
    accountNo?: string;
    ifsc?: string;
    branch?: string;
  };
  notes?: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  phone: string;
  salary: number;
  advancePaid: number;
  attendanceToday: 'Present' | 'Absent' | 'Half Day';
  email?: string;
}

export interface ExpenseEntry {
  id: string;
  date: string;
  category: 'Tea & Snacks' | 'Rent' | 'Electricity' | 'Maintenance' | 'Transport' | 'Stationery' | 'Other';
  description: string;
  amount: number;
  paymentMode: 'Cash' | 'Online';
}

export interface DeliveryRatesConfig {
  freeDeliveryMinAmount: number;
  localDeliveryFee: number;
  outerDeliveryFee: number;
  estimatedDeliveryTime: string;
  deliveryAreas: string;
  deliveryNote: string;
}

export interface BusinessBankDetails {
  bankName: string;
  accountNumber: string;
  ifsc: string;
  branch: string;
  upiQrText?: string;
}

export interface BusinessSettings {
  businessName: string;
  businessNameHindi?: string;
  domainName: string;
  ownerName: string;
  role: string;
  phone: string;
  additionalPhones?: string[];
  email: string;
  gstin: string;
  address: string;
  addressHindi?: string;
  invoicePrefix: string;
  currency: string;
  tagline: string;
  deliveryRates?: DeliveryRatesConfig;
  shopNotice?: string;
  whatsappOrderNumber?: string;
  whatsappSecondaryNumber?: string;
  bankDetails?: BusinessBankDetails;
  warrantyDisclaimer?: string;
  adminPassword?: string;
  staffPassword?: string;
}

export type UserRole = 'admin' | 'staff';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  loggedInAt: string;
}

export interface AgentAdvanceEntry {
  id: string;
  agentName: string;
  date: string; // YYYY-MM-DD
  amount: number;
  paymentMode: 'Cash' | 'Online';
  notes?: string;
  createdAt: string;
}

export interface AgentDaySummary {
  date: string;
  agentName: string;
  collectionAmount: number;
  collectionCount: number;
  collectionCommission: number; // 4%
  newCardsCount: number;
  newCardsBonus: number; // ₹50 per card
  grossEarnings: number; // 4% comm + bonus
  advancesPaid: number;
  netPayable: number;
}

export type ActiveTab = 
  | 'dashboard'
  | 'add-entry'
  | 'all-entries'
  | 'card-scheme'
  | 'agent-hisab'
  | 'customers'
  | 'stock'
  | 'purchases'
  | 'dealer-ledger'
  | 'csv-import'
  | 'uploaded-data'
  | 'staff'
  | 'expenses'
  | 'settings';


