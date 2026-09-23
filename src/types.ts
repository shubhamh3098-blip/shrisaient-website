export type CardSchemeId = 'scheme1' | 'scheme2' | 'scheme3' | 'scheme4' | 'scheme5';

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
  totalGoodsTaken?: number;
  netBalance: number; // totalDeposited - (totalRefunded + (totalGoodsTaken || 0))
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
  village?: string;
  receiptNo: string;
  date: string;
  type: 'WeeklyPayment' | 'Refund' | 'Fee' | 'GoodsTaken' | 'Deposit';
  weekNumber?: number;
  amount: number;
  paymentMode: 'Cash' | 'Online';
  agentName?: string;
  remarks?: string;
  goodsDetail?: string;
  billNo?: string;
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

export interface SaleItemDetail {
  id: string;
  stockItemId?: string;
  productName: string;
  modelNumber?: string;
  serialNumber?: string;
  serialNumbers?: string[];
  quantity: number;
  unitPrice: number;
  total: number;
}

export type OrderStatus = 'pending' | 'confirmed' | 'dispatched' | 'delivered' | 'cancelled';

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
  modelNumber?: string;
  model?: string;
  serialNumber?: string;
  docType?: 'invoice' | 'quotation';
  agentName?: string;
  itemDetails: string;
  itemsDetail?: SaleItemDetail[];
  totalAmount: number;
  payingNow: number;
  dueAmount: number; // totalAmount - payingNow
  paymentMode: 'Cash' | 'Online' | string;
  notes?: string;
  orderStatus?: OrderStatus;
  source?: 'pos' | 'online_cart';
  deliveryType?: 'local' | 'outer';
  deliveryFee?: number;
  deliveryAddress?: string;
  dispatchLocation?: 'Godown' | 'Shop';
  confirmedAt?: string;
  confirmedBy?: string;
  createdAt: string;
}

export interface BillReceiptEntry {
  id: string;
  receiptNo: string; // Sequence: 1078, 1079, 1080...
  date: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  customerVillage?: string;
  againstInvoiceNo?: string; // Reference bill number e.g. "3848", "B-201"
  billTotal?: number;
  previousBalance: number; // आधीची बाकी
  amountPaid: number; // आज जमा केलेली रक्कम
  remainingBalance: number; // शिल्लक बाकी
  paymentMode: 'Cash' | 'Online';
  agentName?: string; // Shubham Shende, Bhushan Lidbe, Suraj Pendam, Ninad Hole, Counter
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
  createdAt?: string;
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
  godownQty?: number; // मुख्य गोडावून मधील साठा (Godown / Warehouse Qty)
  shopQty?: number; // दुकान / शोरूम मधील साठा (Shop / Showroom Qty)
  godownLocation?: string; // गोडावून नाव / लोकेशन (उदा. मुख्य गोडावून, आर्वी रोड)
  rackLocation?: string; // रॅक / कपाट क्रमांक
}

export interface StockTransferRecord {
  id: string;
  date: string;
  stockItemId: string;
  itemName: string;
  itemCode: string;
  fromLocation: 'Godown' | 'Shop';
  toLocation: 'Godown' | 'Shop';
  quantity: number;
  transferredBy: string;
  notes?: string;
  timestamp: string;
}

export interface PurchaseItemDetail {
  id: string;
  description: string;
  hsn: string;
  qty: number;
  rate: number;
  discount: number;
  taxableAmount: number;
  taxRate: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate?: number;
  igstAmount?: number;
  taxAmount: number;
  totalAmount: number;
  serialNumbers?: string[];
}

export interface PurchaseEntry {
  id: string;
  billNo: string;
  date: string;
  supplierName: string;
  supplierAddress?: string;
  supplierPhone?: string;
  supplierGstin?: string;
  supplierState?: string;
  
  // Buyer Details
  buyerName?: string;
  buyerGstin?: string;
  buyerAddress?: string;
  
  // Order & Logistics
  poNo?: string;
  poDate?: string;
  location?: string;
  salesConsultant?: string;
  approvedBy?: string;
  transporter?: string;
  vehicleNo?: string;
  ewayBillNo?: string;
  irn?: string;

  // Items
  items: string;
  itemsDetail?: PurchaseItemDetail[];

  // Financials & Tax
  subtotal?: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  totalTax?: number;
  totalAmount: number;
  paidAmount: number;
  status: 'Paid' | 'Partial' | 'Pending';
  paymentMode: 'Cash' | 'Online' | 'Cheque';
  
  // Supplier Bank Details
  supplierBank?: {
    accountName?: string;
    accountNo?: string;
    ifscCode?: string;
    bankName?: string;
    branch?: string;
  };

  notes?: string;
  autoUpdateStock?: boolean;
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
  status?: 'Active' | 'Pending Approval' | 'Inactive';
  isApprovedByAdmin?: boolean;
  approvalDate?: string;
  approvedBy?: string;
}

export interface ExpenseEntry {
  id: string;
  date: string;
  category: 'Tea & Snacks' | 'Rent' | 'Electricity' | 'Maintenance' | 'Transport' | 'Stationery' | 'Other';
  description: string;
  amount: number;
  paymentMode: 'Cash' | 'Online';
}

export interface AgentAdvance {
  id: string;
  agentName: string;
  date: string;
  amount: number;
  paymentMode: 'Cash' | 'Online';
  notes?: string;
  createdAt: string;
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
  whatsappGroupLink?: string;
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

export type ActiveTab = 
  | 'dashboard'
  | 'add-entry'
  | 'online-orders'
  | 'all-entries'
  | 'bill-receipts'
  | 'card-scheme'
  | 'card-passbook'
  | 'customers'
  | 'stock'
  | 'purchases'
  | 'dealer-ledger'
  | 'csv-import'
  | 'uploaded-data'
  | 'staff'
  | 'agent-commission'
  | 'expenses'
  | 'finance-calc'
  | 'furniture-job-cards'
  | 'furniture-jobs'
  | 'finance-do-register'
  | 'finance-do'
  | 'daily-reconciliation'
  | 'daily-collection-log'
  | 'village-khata'
  | 'settings';

export interface FurnitureJobCard {
  id: string;
  jobNo: string;
  customerName: string;
  customerPhone: string;
  itemType: 'Sofa Set' | 'Teak Bed' | 'Dining Table' | 'Wardrobe' | 'Dressing Table' | 'Mandir' | 'Custom Teak Item';
  woodType: 'Pure Teak (सागवान)' | 'Engineered Teak' | 'Rosewood Polish';
  dimensionOrSpecs: string;
  totalAmount: number;
  advancePaid: number;
  balanceDue: number;
  artisanName?: string;
  orderDate: string;
  targetDeliveryDate: string;
  stage: 'Seasoning' | 'Cutting' | 'Carving' | 'Polishing' | 'Cushioning' | 'QC' | 'Ready' | 'Delivered';
  notes?: string;
  updatedAt: string;
}

export interface FinanceDORecord {
  id: string;
  customerName: string;
  customerPhone: string;
  invoiceNo: string;
  itemName: string;
  financeCompany: 'Bajaj Finserv' | 'TVS Credit' | 'HDB Financial' | 'IDFC First' | 'Shriram Finance' | 'Other';
  doNumber: string;
  sanctionedAmount: number;
  customerDownPayment: number;
  processingFee: number;
  dbdAmount?: number;
  insuranceAmount?: number;
  netDisbursalAmount?: number;
  payoutStatus: 'Pending DO Verification' | 'Disbursed to Bank' | 'UTR Received' | 'Claim Rejected';
  utrNumber?: string;
  disbursedDate?: string;
  notes?: string;
  createdAt: string;
}

export interface DailyCashReconciliation {
  id: string;
  date: string;
  openingCash: number;
  cashSales: number;
  cashSchemeDeposits: number;
  cashKhataReceipts: number;
  cashExpenses: number;
  expectedCash: number;
  physicalCash: number;
  discrepancy: number;
  denominations: {
    c500: number;
    c200: number;
    c100: number;
    c50: number;
    c20: number;
    c10: number;
    coins: number;
  };
  closedBy: string;
  notes?: string;
  createdAt: string;
}

export interface MergedCustomerRecord {
  secondaryId: string;
  secondaryName: string;
  secondaryPhone?: string;
  primaryId: string;
  primaryName: string;
  primaryPhone?: string;
  mergedAt: string;
}


