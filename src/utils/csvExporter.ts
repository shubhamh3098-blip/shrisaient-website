/**
 * Universal CSV Exporter for Shri Sai Enterprise ERP
 * Exports Schemes (1, 2, 3), Sales Invoices, Receipts, Customers, and General Datasets
 * Handles UTF-8 with BOM for flawless Excel & Google Sheets display across Mobile & Desktop.
 */

import { CardMember, CardTransaction, Customer, TransactionEntry } from '../types';

export const downloadCsvFile = (filename: string, headers: string[], rows: (string | number | undefined | null)[][]) => {
  const escapeCell = (val: string | number | undefined | null): string => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerLine = headers.map(escapeCell).join(',');
  const rowLines = rows.map(r => r.map(escapeCell).join(',')).join('\r\n');
  const csvContent = '\uFEFF' + headerLine + '\r\n' + rowLines;

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export Card Scheme Members to CSV (for Scheme 1, Scheme 2, Scheme 3, or All)
 */
export const exportSchemeCardsToCsv = (
  members: CardMember[],
  schemeTitle: string = 'Scheme',
  schemeIdFilter?: string
) => {
  const filtered = schemeIdFilter && schemeIdFilter !== 'all'
    ? members.filter(m => m.schemeId === schemeIdFilter)
    : members;

  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `ShriSai_${schemeTitle.replace(/\s+/g, '_')}_Members_${dateStr}.csv`;

  const headers = [
    'Card Number (कार्ड क्र.)',
    'Scheme (योजना)',
    'Customer Name (ग्राहक नाव)',
    'Mobile (मोबाईल)',
    'Village / Address (गाव / पत्ता)',
    'Sheet No (शीट नं)',
    'Agent Name (एजंट)',
    'Total Deposited (एकूण जमा ₹)',
    'Total Refunded (एकूण परत ₹)',
    'Net Balance (शिल्लक ₹)',
    'Status (स्थिती)',
    'Joining Date (नोंदणी दिनांक)',
    'Notes (नोंद)',
  ];

  const rows = filtered.map(m => [
    m.cardNumber,
    m.schemeName || m.schemeId,
    m.customerName,
    m.phone || '',
    m.village || m.address || '',
    m.sheetNo || '',
    m.agentName || '',
    Number(m.totalDeposited) || 0,
    Number(m.totalRefunded) || 0,
    Number(m.netBalance) || 0,
    m.status || 'Active',
    m.joiningDate || '',
    m.notes || '',
  ]);

  downloadCsvFile(filename, headers, rows);
};

/**
 * Export Sales Invoices to CSV
 */
export const exportSalesToCsv = (
  bills: TransactionEntry[],
  filenamePrefix: string = 'ShriSai_Sales_Invoices'
) => {
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `${filenamePrefix}_${dateStr}.csv`;

  const headers = [
    'Invoice No (बिल क्र.)',
    'Date (तारीख)',
    'Customer Name (ग्राहक नाव)',
    'Customer Phone (मोबाईल)',
    'Village (गाव)',
    'Item / Product Details (वस्तू तपशील)',
    'Total Bill Amount (एकूण बिल ₹)',
    'Paid / Advance (जमा ₹)',
    'Balance Due (उधारी बाकी ₹)',
    'Payment Mode (पेमेंट मोड)',
    'Card No (कार्ड क्र.)',
    'Notes (नोंद)',
  ];

  const rows = bills.map(b => [
    b.invoiceNo,
    b.date,
    b.customerName,
    b.customerPhone || '',
    b.village || '',
    b.itemDetails,
    Number(b.totalAmount) || 0,
    Number(b.payingNow) || 0,
    Number(b.dueAmount) || 0,
    b.paymentMode || 'Cash',
    b.cardNumber || '',
    b.notes || '',
  ]);

  downloadCsvFile(filename, headers, rows);
};

/**
 * Export Scheme / Udhar Receipts to CSV
 */
export const exportReceiptsToCsv = (
  receipts: (CardTransaction | TransactionEntry)[],
  filenamePrefix: string = 'ShriSai_Receipts'
) => {
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `${filenamePrefix}_${dateStr}.csv`;

  const headers = [
    'Receipt / Voucher No (पावती क्र.)',
    'Date (तारीख)',
    'Customer Name (ग्राहक नाव)',
    'Phone (मोबाईल)',
    'Card No (कार्ड क्र.)',
    'Particulars / Item (तपशील)',
    'Amount Received (जमा रक्कम ₹)',
    'Payment Mode (मोड)',
    'Remaining Balance (शिल्लक बाकी ₹)',
    'Remarks / Notes (नोंद)',
  ];

  const rows = receipts.map((item) => {
    if ('receiptNo' in item) {
      // CardTransaction
      return [
        item.receiptNo,
        item.date,
        item.customerName,
        item.customerPhone || '',
        item.cardNumber || '',
        item.type + (item.weekNumber ? ` (Wk #${item.weekNumber})` : ''),
        Number(item.amount) || 0,
        item.paymentMode || 'Cash',
        Number(item.balanceAfter) || 0,
        item.remarks || '',
      ];
    } else {
      // TransactionEntry
      return [
        item.invoiceNo,
        item.date,
        item.customerName,
        item.customerPhone || '',
        item.cardNumber || '',
        item.itemDetails,
        Number(item.payingNow) || 0,
        item.paymentMode || 'Cash',
        Number(item.dueAmount) || 0,
        (item.refBillNo ? `Against Bill #${item.refBillNo}. ` : '') + (item.notes || ''),
      ];
    }
  });

  downloadCsvFile(filename, headers, rows);
};

/**
 * Export Customers Khata to CSV
 */
export const exportCustomersToCsv = (
  customers: Customer[],
  filenamePrefix: string = 'ShriSai_Customers_Khata'
) => {
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `${filenamePrefix}_${dateStr}.csv`;

  const headers = [
    'Customer Name (ग्राहक नाव)',
    'Mobile (मोबाईल)',
    'Village (गाव)',
    'Address (पत्ता)',
    'Total Purchased (एकूण खरेदी ₹)',
    'Total Paid (एकूण जमा ₹)',
    'Balance Due (उधारी बाकी ₹)',
    'Linked Card (संबंधित कार्ड)',
  ];

  const rows = customers.map(c => [
    c.name,
    c.phone || '',
    c.village || '',
    c.address || '',
    Number(c.totalPurchased || c.totalPurchases) || 0,
    Number(c.totalPaid) || 0,
    Number(c.balanceDue) || 0,
    c.linkedCardNumber || '',
  ]);

  downloadCsvFile(filename, headers, rows);
};

/**
 * Export Purchases to CSV
 */
export const exportPurchasesToCsv = (
  purchases: any[],
  filenamePrefix: string = 'ShriSai_Purchases'
) => {
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `${filenamePrefix}_${dateStr}.csv`;

  const headers = [
    'Bill / Voucher No (बिल क्र.)',
    'Date (तारीख)',
    'Supplier / Dealer (सप्लायर/डीलर)',
    'Items Purchased (खरेदी वस्तू)',
    'Total Amount (एकूण रक्कम ₹)',
    'Paid Amount (दिलेली रक्कम ₹)',
    'Pending Balance (बाकी ₹)',
    'Status (स्थिती)',
    'Payment Mode (पेमेंट मोड)',
    'Notes (नोंद)',
  ];

  const rows = purchases.map(p => [
    p.billNo,
    p.date,
    p.supplierName,
    p.items || '',
    Number(p.totalAmount) || 0,
    Number(p.paidAmount) || 0,
    (Number(p.totalAmount) || 0) - (Number(p.paidAmount) || 0),
    p.status || 'Paid',
    p.paymentMode || 'Cash',
    p.notes || '',
  ]);

  downloadCsvFile(filename, headers, rows);
};

/**
 * Export Stock Inventory to CSV
 */
export const exportStockToCsv = (
  stock: any[],
  filenamePrefix: string = 'ShriSai_Stock_Inventory'
) => {
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `${filenamePrefix}_${dateStr}.csv`;

  const headers = [
    'Item Code (कोड)',
    'Product Name (वस्तूचे नाव)',
    'Category (प्रकार)',
    'Available Quantity (उपलब्ध नग)',
    'Unit (युनिट)',
    'Purchase Price (खरेदी दर ₹)',
    'Selling Price (विक्री दर ₹)',
    'Stock Value (एकूण साठा मूल्य ₹)',
    'Min Stock Alert (किमान साठा मर्यादा)',
  ];

  const rows = stock.map(s => [
    s.code || '',
    s.name,
    s.category || 'General',
    Number(s.quantity) || 0,
    s.unit || 'नग',
    Number(s.purchasePrice) || 0,
    Number(s.sellingPrice) || 0,
    (Number(s.quantity) || 0) * (Number(s.purchasePrice) || 0),
    Number(s.minStockLevel) || 5,
  ]);

  downloadCsvFile(filename, headers, rows);
};

/**
 * Export Dealer Ledger to CSV
 */
export const exportDealersToCsv = (
  dealers: any[],
  filenamePrefix: string = 'ShriSai_Dealer_Ledger'
) => {
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `${filenamePrefix}_${dateStr}.csv`;

  const headers = [
    'Dealer Name (डीलर नाव)',
    'Phone (मोबाईल)',
    'Address (पत्ता)',
    'GSTIN (जीएसटी)',
    'Total Purchases (एकूण खरेदी ₹)',
    'Total Paid (एकूण जमा ₹)',
    'Balance Due (देणे बाकी ₹)',
  ];

  const rows = dealers.map(d => [
    d.name,
    d.phone || '',
    d.address || '',
    d.gstin || '',
    Number(d.totalPurchases) || 0,
    Number(d.totalPaid) || 0,
    Number(d.balanceDue) || 0,
  ]);

  downloadCsvFile(filename, headers, rows);
};
