import JSZip from 'jszip';
import {
  CardMember,
  CardSchemeId,
  CardTransaction,
  Customer,
  Dealer,
  DealerPayment,
  PurchaseEntry,
  StockItem,
  TransactionEntry,
} from '../types';

/**
 * Escapes a cell for CSV: handles quotes, commas, newlines, undefined, and numbers.
 */
function escapeCsvCell(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  return `"${str.replace(/"/g, '""')}"`;
}

/**
 * Converts array of headers and rows into UTF-8 encoded CSV string with BOM for Excel compatibility.
 */
function toCsvString(headers: string[], rows: (string | number | undefined | null)[][]): string {
  const headerLine = headers.map(escapeCsvCell).join(',');
  const rowLines = rows.map((r) => r.map(escapeCsvCell).join(','));
  // UTF-8 BOM (\uFEFF) ensures Excel properly displays Marathi/Devanagari characters and Rupee symbols
  return '\uFEFF' + [headerLine, ...rowLines].join('\r\n');
}

/**
 * Triggers a browser download of a CSV file.
 */
export function downloadCsvFile(filename: string, csvString: string) {
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================================================
// INDIVIDUAL CSV GENERATORS
// ============================================================================

export function generateSchemeCardsCsv(
  cardMembers: CardMember[],
  schemeId?: CardSchemeId
): { filename: string; csv: string; count: number } {
  const filtered = schemeId ? cardMembers.filter((m) => m.schemeId === schemeId) : cardMembers;

  const headers = [
    'Card Number (कार्ड क्र)',
    'Scheme Name (योजना)',
    'Scheme ID',
    'Unique ID',
    'Customer Name (ग्राहकाचे नाव)',
    'Mobile Number (मोबाईल)',
    'Village / Location (गाव / पत्ता)',
    'Agent Name (एजंट)',
    'Sheet No (शीट क्र)',
    'Joining Date (नोंदणी दिनांक)',
    'Registration Fee (₹)',
    'Fee Paid (फी भरली?)',
    'Total Deposited (₹ जमा रक्कम)',
    'Total Refunded (₹ परतावा रक्कम)',
    'Net Balance Due/Held (₹ शिल्लक)',
    'Status (स्थिती)',
    'Remarks / Notes',
  ];

  const rows = filtered.map((m) => [
    m.cardNumber,
    m.schemeName || (m.schemeId === 'scheme1' ? 'Scheme 1' : m.schemeId === 'scheme2' ? 'Scheme 2' : 'Scheme 3'),
    m.schemeId,
    m.uniqueId || `SAI-${m.schemeId?.toUpperCase()}-${m.cardNumber}`,
    m.customerName,
    m.phone,
    m.village || m.address || '',
    m.agentName || '',
    m.sheetNo || '',
    m.joiningDate || '',
    m.registrationFee ?? 50,
    m.registrationFeePaid ? 'Yes' : 'No',
    m.totalDeposited ?? 0,
    m.totalRefunded ?? 0,
    m.netBalance ?? ((m.totalDeposited ?? 0) - (m.totalRefunded ?? 0)),
    m.status || 'Active',
    m.notes || '',
  ]);

  const schemeLabel = schemeId
    ? schemeId.toUpperCase()
    : 'ALL_SCHEMES';
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `ShriSaiEnt_${schemeLabel}_Cards_${dateStr}.csv`;

  return {
    filename,
    csv: toCsvString(headers, rows),
    count: filtered.length,
  };
}

export function generateSalesInvoicesCsv(
  transactions: TransactionEntry[]
): { filename: string; csv: string; count: number } {
  const headers = [
    'Invoice No (बिल क्र)',
    'Date (दिनांक)',
    'Customer Name (ग्राहकाचे नाव)',
    'Mobile Number (मोबाईल)',
    'Village (गाव)',
    'Items & Particulars (खरेदी केलेल्या वस्तू)',
    'Total Amount (₹ एकूण बिल)',
    'Paid Amount (₹ दिलेली रक्कम)',
    'Due Balance (₹ उधारी बाकी)',
    'Payment Mode (पद्धत - Cash/Online)',
    'Linked Scheme Card',
    'Notes / Remarks',
  ];

  const rows = transactions.map((t) => [
    t.invoiceNo,
    t.date,
    t.customerName,
    t.customerPhone || '',
    t.village || '',
    t.itemDetails,
    t.totalAmount,
    t.payingNow,
    t.dueAmount,
    t.paymentMode,
    t.cardNumber ? `Card #${t.cardNumber} (${t.schemeId || ''})` : '',
    t.notes || '',
  ]);

  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `ShriSaiEnt_Sales_Invoices_${dateStr}.csv`;

  return {
    filename,
    csv: toCsvString(headers, rows),
    count: transactions.length,
  };
}

export function generatePurchasesCsv(
  purchases: PurchaseEntry[]
): { filename: string; csv: string; count: number } {
  const headers = [
    'Bill No (बिल क्र)',
    'Date (दिनांक)',
    'Supplier / Vendor (डीलरचे नाव)',
    'Items / Materials Procured (माल वर्णन)',
    'Total Bill (₹ एकूण खरीद)',
    'Paid to Supplier (₹ दिलेली रक्कम)',
    'Balance Due (₹ देय शिल्लक)',
    'Payment Status (स्थिती)',
    'Payment Mode (पद्धत)',
  ];

  const rows = purchases.map((p) => [
    p.billNo,
    p.date,
    p.supplierName,
    p.items,
    p.totalAmount,
    p.paidAmount,
    p.totalAmount - p.paidAmount,
    p.status,
    p.paymentMode,
  ]);

  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `ShriSaiEnt_Purchases_${dateStr}.csv`;

  return {
    filename,
    csv: toCsvString(headers, rows),
    count: purchases.length,
  };
}

export function generateCardReceiptsCsv(
  receipts: CardTransaction[]
): { filename: string; csv: string; count: number } {
  const headers = [
    'Receipt No (पावती क्र)',
    'Date (दिनांक)',
    'Scheme ID',
    'Card Number (कार्ड क्र)',
    'Customer Name (ग्राहकाचे नाव)',
    'Customer Phone (मोबाईल)',
    'Week No (आठवडा)',
    'Entry Type (प्रकार)',
    'Amount (₹ रक्कम)',
    'Payment Mode (Cash/Online)',
    'Balance After Receipt (₹ शिल्लक)',
    'Agent Name (एजंट)',
    'Remarks / Note',
  ];

  const rows = receipts.map((r) => [
    r.receiptNo,
    r.date,
    r.schemeId,
    r.cardNumber,
    r.customerName,
    r.customerPhone || '',
    r.weekNumber ?? '',
    r.type,
    r.amount,
    r.paymentMode,
    r.balanceAfter,
    r.agentName || '',
    r.remarks || '',
  ]);

  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `ShriSaiEnt_Card_Receipts_${dateStr}.csv`;

  return {
    filename,
    csv: toCsvString(headers, rows),
    count: receipts.length,
  };
}

export function generateDealerLedgersCsv(
  dealers: Dealer[]
): { filename: string; csv: string; count: number } {
  const headers = [
    'Dealer Name (डीलरचे नाव)',
    'Phone (फोन)',
    'GSTIN',
    'Address / Location (पत्ता)',
    'Total Purchases Invoiced (₹ एकूण माल खरीद)',
    'Total Paid (₹ एकूण दिलेली रक्कम)',
    'Balance Due Payable (₹ शिल्लक देणे)',
    'Last Transaction Date',
  ];

  const rows = dealers.map((d) => [
    d.name,
    d.phone,
    d.gstin || '',
    d.address || '',
    d.totalPurchases,
    d.totalPaid,
    d.balanceDue,
    d.lastTransactionDate || '',
  ]);

  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `ShriSaiEnt_Dealer_Ledgers_${dateStr}.csv`;

  return {
    filename,
    csv: toCsvString(headers, rows),
    count: dealers.length,
  };
}

export function generateDealerPaymentsCsv(
  payments: DealerPayment[]
): { filename: string; csv: string; count: number } {
  const headers = [
    'Voucher No (व्हाउचर क्र)',
    'Date (दिनांक)',
    'Dealer Name (डीलरचे नाव)',
    'Payment Amount (₹ रक्कम)',
    'Payment Mode (पद्धत)',
    'Reference / UTR / Cheque No',
    'Notes / Remarks',
  ];

  const rows = payments.map((p) => [
    p.voucherNo,
    p.date,
    p.dealerName,
    p.amount,
    p.paymentMode,
    p.referenceNo || '',
    p.notes || '',
  ]);

  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `ShriSaiEnt_Dealer_Payments_${dateStr}.csv`;

  return {
    filename,
    csv: toCsvString(headers, rows),
    count: payments.length,
  };
}

export function generateCustomerKhataCsv(
  customers: Customer[]
): { filename: string; csv: string; count: number } {
  const headers = [
    'Customer Name (ग्राहकाचे नाव)',
    'Phone (फोन)',
    'Village (गाव)',
    'Address (पत्ता)',
    'Total Purchases (₹ एकूण खरेदी)',
    'Total Paid (₹ भरलेली रक्कम)',
    'Balance Due (₹ उधारी बाकी)',
    'Linked Scheme Card',
    'Last Visit Date',
  ];

  const rows = customers.map((c) => [
    c.name,
    c.phone,
    c.village || '',
    c.address || '',
    c.totalPurchased ?? c.totalPurchases ?? 0,
    c.totalPaid ?? 0,
    c.balanceDue ?? 0,
    c.linkedCardNumber ? `Card #${c.linkedCardNumber} (${c.linkedSchemeId || ''})` : '',
    c.lastVisit || '',
  ]);

  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `ShriSaiEnt_Customer_Khata_${dateStr}.csv`;

  return {
    filename,
    csv: toCsvString(headers, rows),
    count: customers.length,
  };
}

export function generateStockCsv(
  stock: StockItem[]
): { filename: string; csv: string; count: number } {
  const headers = [
    'Item Code (कोड)',
    'Item Name (मालाचे नाव)',
    'Category (प्रकार)',
    'Current Stock (शिल्लक नग)',
    'Unit (युनिट)',
    'Purchase Price (₹ खरीद भाव)',
    'Selling Price (₹ विक्री भाव)',
    'Min Stock Alert Level (किमान मर्यादा)',
    'Description (माहिती)',
  ];

  const rows = stock.map((s) => [
    s.code,
    s.name,
    s.category,
    s.quantity,
    s.unit,
    s.purchasePrice,
    s.sellingPrice,
    s.minStockLevel,
    s.description || '',
  ]);

  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `ShriSaiEnt_Stock_Inventory_${dateStr}.csv`;

  return {
    filename,
    csv: toCsvString(headers, rows),
    count: stock.length,
  };
}

export function generateExpensesCsv(
  expenses: any[]
): { filename: string; csv: string; count: number } {
  const headers = [
    'Expense ID',
    'Date (दिनांक)',
    'Category (खर्चाचा प्रकार)',
    'Amount (₹ रक्कम)',
    'Payment Mode (पद्धत)',
    'Description / Particulars (तपशील)',
    'Recorded By',
  ];

  const rows = expenses.map((e) => [
    e.id || '',
    e.date || '',
    e.category || '',
    e.amount ?? 0,
    e.paymentMode || '',
    e.description || '',
    e.recordedBy || '',
  ]);

  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `ShriSaiEnt_Shop_Expenses_${dateStr}.csv`;

  return {
    filename,
    csv: toCsvString(headers, rows),
    count: expenses.length,
  };
}

// ============================================================================
// ALL-IN-ONE ZIP EXPORTER
// ============================================================================

export interface ExportAllDataPayload {
  cardMembers: CardMember[];
  cardTransactions: CardTransaction[];
  transactions: TransactionEntry[];
  purchases: PurchaseEntry[];
  dealers: Dealer[];
  dealerPayments: DealerPayment[];
  customers: Customer[];
  stock?: StockItem[];
  expenses?: any[];
}

export async function exportAllDataAsZip(data: ExportAllDataPayload): Promise<void> {
  const zip = new JSZip();
  const folderName = `ShriSaiEnt_CSV_Export_${new Date().toISOString().split('T')[0]}`;
  const folder = zip.folder(folderName) || zip;

  // 1. Scheme 1
  const sch1 = generateSchemeCardsCsv(data.cardMembers, 'scheme1');
  folder.file('01_Scheme_1_Cards_1001_to_2999.csv', sch1.csv);

  // 2. Scheme 2
  const sch2 = generateSchemeCardsCsv(data.cardMembers, 'scheme2');
  folder.file('02_Scheme_2_Cards_3001_to_3999.csv', sch2.csv);

  // 3. Scheme 3
  const sch3 = generateSchemeCardsCsv(data.cardMembers, 'scheme3');
  folder.file('03_Scheme_3_Cards_4001_to_6000.csv', sch3.csv);

  // 4. Combined All Schemes
  const allCards = generateSchemeCardsCsv(data.cardMembers);
  folder.file('04_All_Card_Schemes_Master.csv', allCards.csv);

  // 5. Card Weekly Receipts
  const receipts = generateCardReceiptsCsv(data.cardTransactions);
  folder.file('05_Card_Scheme_Receipts.csv', receipts.csv);

  // 6. Sales Invoices
  const sales = generateSalesInvoicesCsv(data.transactions);
  folder.file('06_Sales_Invoices.csv', sales.csv);

  // 7. Purchase Bills
  const purchases = generatePurchasesCsv(data.purchases);
  folder.file('07_Purchases_Supplier_Bills.csv', purchases.csv);

  // 8. Dealer Ledgers
  const dealers = generateDealerLedgersCsv(data.dealers);
  folder.file('08_Dealer_Khata_Summary.csv', dealers.csv);

  // 9. Dealer Payments
  const dealerPayments = generateDealerPaymentsCsv(data.dealerPayments);
  folder.file('09_Dealer_Payment_Vouchers.csv', dealerPayments.csv);

  // 10. Customer Udhar Khata
  const customers = generateCustomerKhataCsv(data.customers);
  folder.file('10_Customer_Udhar_Khata.csv', customers.csv);

  // 11. Stock Items
  if (data.stock && data.stock.length > 0) {
    const stock = generateStockCsv(data.stock);
    folder.file('11_Stock_Inventory.csv', stock.csv);
  }

  // 12. Expenses
  if (data.expenses && data.expenses.length > 0) {
    const expenses = generateExpensesCsv(data.expenses);
    folder.file('12_Shop_Expenses.csv', expenses.csv);
  }

  // Generate ZIP blob and download
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${folderName}.zip`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
