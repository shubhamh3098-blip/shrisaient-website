import {
  CardMember,
  CardSchemeId,
  CardTransaction,
  Customer,
  StockItem,
  TransactionEntry
} from '../types';
import {
  cleanCustomerName,
  cleanDate,
  cleanPhone,
  cleanVillage,
  getSchemeForCard
} from './dataCleaner';

export interface ImportAuditIssue {
  type: 'spelling' | 'date' | 'phone' | 'amount' | 'card_number' | 'ignored_cancelled';
  description: string;
  original: string;
  corrected: string;
}

export interface UniversalImportResult {
  detectedType: 'bills' | 'receipts' | 'cards_raw' | 'cards_master' | 'unknown';
  bills: TransactionEntry[];
  salesReceipts: TransactionEntry[];
  cardMembers: CardMember[];
  cardTransactions: CardTransaction[];
  customers: Customer[];
  stockItems: StockItem[];
  auditIssues: ImportAuditIssue[];
  summaryText: string;
}

const parseCSVLines = (csvText: string): string[][] => {
  const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const result: string[][] = [];

  for (const line of lines) {
    // Regex matches CSV while respecting quoted fields
    const row: string[] = [];
    let insideQuotes = false;
    let entry = '';

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        row.push(entry.trim().replace(/^["']|["']$/g, ''));
        entry = '';
      } else {
        entry += char;
      }
    }
    row.push(entry.trim().replace(/^["']|["']$/g, ''));

    // Strip trailing empty commas if entire trailing part is empty
    while (row.length > 0 && row[row.length - 1] === '') {
      row.pop();
    }

    if (row.length > 0 && row.some((c) => c !== '')) {
      result.push(row);
    }
  }

  return result;
};

export function processUniversalCsv(
  csvContent: string,
  forceType?: 'bills' | 'receipts' | 'cards_raw' | 'cards_master' | 'auto'
): UniversalImportResult {
  const parsed = parseCSVLines(csvContent);
  const auditIssues: ImportAuditIssue[] = [];

  if (parsed.length < 2) {
    return {
      detectedType: 'unknown',
      bills: [],
      salesReceipts: [],
      cardMembers: [],
      cardTransactions: [],
      customers: [],
      stockItems: [],
      auditIssues,
      summaryText: 'CSV file contains no data or is empty.',
    };
  }

  // 1. Intelligent Header Row Finder (scans rows 0 to 4 in case file has title or empty leading lines)
  let headerRowIndex = 0;
  let maxKeywordMatches = 0;
  const knownKeywords = [
    'date', 'bill', 'receipt', 'rcpt', 'voucher', 'pavti', 'pauti', 'customer', 'name', 'party', 'village',
    'amount', 'total', 'grandtotal', 'paid', 'due', 'balance', 'card', 'scheme', 'saving', 'mobile', 'phone',
    'recived', 'received', 'collected', 'product', 'item', 'rate', 'qty', 'quantity', 'mrp', 'srno', 'sr', 'no',
    'tarikh', 'gav', 'rakkam', 'jama', 'baki', 'shillak', 'तारीख', 'दिनांक', 'नाव', 'गाव', 'रक्कम', 'जमा', 'पावती', 'बिल', 'कार्ड', 'मोबाईल'
  ];

  for (let r = 0; r < Math.min(5, parsed.length); r++) {
    const rowClean = parsed[r].map((h) => (h || '').toLowerCase().replace(/[\s_\-\.\/\(\)\[\]#:,]/g, '')).join(',');
    let matches = 0;
    for (const kw of knownKeywords) {
      if (rowClean.includes(kw)) matches++;
    }
    if (matches > maxKeywordMatches) {
      maxKeywordMatches = matches;
      headerRowIndex = r;
    }
  }

  // If row 0 had no matches but contains pure numeric data and dates, it might be headerless data
  let dataRows = parsed.slice(headerRowIndex + 1);
  let rawHeaders = parsed[headerRowIndex];

  // Clean Header Words (preserve alphanumeric and Unicode / Marathi letters)
  const cleanHeaderWord = (h: string) => (h || '').toLowerCase().replace(/[\s_\-\.\/\(\)\[\]#:,]/g, '');
  const headerLine = rawHeaders.map(cleanHeaderWord);
  const headerJoined = headerLine.join(',');

  // Detect File Type
  let detectedType: 'bills' | 'receipts' | 'cards_raw' | 'cards_master' | 'unknown' = 'unknown';

  // Receipt indicators (Receipt No, Amount Received, Against Bill No, Ref Bill No, Recived By, etc.)
  const hasReceiptIndicator =
    headerJoined.includes('receiptno') ||
    headerJoined.includes('amountreceived') ||
    headerJoined.includes('againstbillno') ||
    headerJoined.includes('againstbill') ||
    headerJoined.includes('refbillno') ||
    headerJoined.includes('refbill') ||
    headerJoined.includes('receivedby') ||
    headerJoined.includes('recivedby') ||
    headerJoined.includes('recived') ||
    headerJoined.includes('received') ||
    headerJoined.includes('receipt') ||
    headerJoined.includes('reciept') ||
    headerJoined.includes('pavti') ||
    headerJoined.includes('pauti') ||
    headerJoined.includes('collectedby') ||
    headerJoined.includes('collection') ||
    headerJoined.includes('voucherno') ||
    headerJoined.includes('voucher') ||
    headerJoined.includes('पावती') ||
    headerJoined.includes('जमा') ||
    headerJoined.includes('वसूली') ||
    headerJoined.includes('jama') ||
    headerJoined.includes('vasuli');

  const hasGrandTotal =
    headerJoined.includes('grandtotal') ||
    headerJoined.includes('totalamount') ||
    headerJoined.includes('subtotal') ||
    headerJoined.includes('billamount');

  const hasLineItemIndicators =
    headerJoined.includes('product') ||
    headerJoined.includes('item') ||
    headerJoined.includes('particulars') ||
    headerJoined.includes('quantity') ||
    headerJoined.includes('rate') ||
    headerJoined.includes('mrp') ||
    headerJoined.includes('unitprice') ||
    headerJoined.includes('subtotal') ||
    headerJoined.includes('grandtotal');

  const hasBillIndicators =
    headerLine.includes('billno') ||
    headerLine.includes('invoiceno') ||
    hasLineItemIndicators;

  const hasCardIndicators =
    headerJoined.includes('cardno') ||
    headerJoined.includes('openingamt') ||
    headerJoined.includes('sheetno') ||
    headerJoined.includes('savingbalance');

  // Enforce forceType if specified by user in UI
  if (forceType && forceType !== 'auto') {
    detectedType = forceType;
  } else {
    // Intelligent auto-detection
    if (
      (hasReceiptIndicator && !hasGrandTotal && !hasLineItemIndicators) ||
      (headerJoined.includes('againstbill') || headerJoined.includes('refbill')) ||
      (!hasBillIndicators && !hasCardIndicators && headerJoined.includes('amount') && (headerJoined.includes('name') || headerJoined.includes('customer') || headerJoined.includes('नाव')))
    ) {
      detectedType = 'receipts';
    } else if (
      (headerLine.includes('billno') || headerLine.includes('invoiceno')) &&
      !hasLineItemIndicators &&
      (headerJoined.includes('amount') || headerJoined.includes('paid')) &&
      !hasCardIndicators
    ) {
      // Single amount rows referencing a bill without item/qty details are receipts against bills
      detectedType = 'receipts';
    } else if (
      headerLine.includes('billno') ||
      headerLine.includes('invoiceno') ||
      hasGrandTotal ||
      headerJoined.includes('amountpaid') ||
      hasLineItemIndicators
    ) {
      detectedType = 'bills';
    } else if (
      headerJoined.includes('agentname') ||
      (headerJoined.includes('cardno') && headerJoined.includes('savingbalance'))
    ) {
      detectedType = 'cards_master';
    } else if (
      headerJoined.includes('openingamt') ||
      headerJoined.includes('sheetno') ||
      (headerJoined.includes('name') && headerJoined.includes('cardno'))
    ) {
      detectedType = 'cards_raw';
    }
  }

  const bills: TransactionEntry[] = [];
  const salesReceipts: TransactionEntry[] = [];
  const cardMembers: CardMember[] = [];
  const cardTransactions: CardTransaction[] = [];
  const customerMap = new Map<string, Customer>();
  const productMap = new Map<string, StockItem>();

  const getColIdx = (candidates: string[]): number => {
    for (const cand of candidates) {
      const cleanCand = cleanHeaderWord(cand);
      const idx = headerLine.indexOf(cleanCand);
      if (idx !== -1) return idx;
      // Also match partial substring if candidate is descriptive enough
      const pIdx = headerLine.findIndex((h) => h === cleanCand || (cleanCand.length >= 4 && (h.includes(cleanCand) || cleanCand.includes(h))));
      if (pIdx !== -1) return pIdx;
    }
    return -1;
  };

  if (detectedType === 'bills') {
    const idxBillNo = getColIdx(['billno', 'invoiceno', 'bill', 'बिलक्र', 'बिलनंबर', 'बिल']);
    const idxDate = getColIdx(['date', 'billdate', 'दिनांक', 'तारीख']);
    const idxCust = getColIdx(['customername', 'name', 'customer', 'party', 'grahak', 'ग्राहकाचेनाव', 'नाव']);
    const idxPhone = getColIdx(['mobile', 'phone', 'contact', 'मोबाईल', 'फोन']);
    const idxVillage = getColIdx(['village', 'villege', 'city', 'town', 'address', 'गाव', 'पत्ता']);
    const idxTotal = getColIdx(['grandtotal', 'totalamount', 'subtotal', 'total', 'billamount', 'amount', 'एकूण', 'रक्कम']);
    const idxPaid = getColIdx(['amountpaid', 'paidamount', 'paid', 'cashpaid', 'advance', 'adv', 'deposit', 'jama', 'जमारक्कम', 'अॅडव्हान्स', 'जमा']);
    const idxDue = getColIdx(['balancedue', 'dueamount', 'due', 'balance', 'shillak', 'baki', 'बाकीरक्कम', 'शिल्लक']);
    const idxMode = getColIdx(['paymentmode', 'mode', 'पेमेंटमोड']);
    const idxProduct = getColIdx([
      'product',
      'productname',
      'item',
      'items',
      'itemname',
      'particulars',
      'description',
      'goods',
      'article',
      'model',
      'itemdetails',
      'products',
      'itemdescription',
      'sahitya',
      'vastu',
      'वस्तू'
    ]);
    const idxQty = getColIdx(['quantity', 'qty', 'qnty', 'pieces', 'nos', 'count', 'units', 'nag', 'नग']);
    const idxRate = getColIdx(['rate', 'price', 'unitprice', 'mrp', 'itemrate', 'cost', 'bhav', 'dar', 'दर']);
    const idxCategory = getColIdx(['category', 'brand', 'type', 'productcategory']);
    const idxRemarks = getColIdx(['remarks', 'agent', 'itemssummary', 'notes']);

    for (let r = 0; r < dataRows.length; r++) {
      const row = dataRows[r];

      let rawCustName = idxCust !== -1 && row[idxCust] ? row[idxCust].trim() : 'Customer';
      let rawVillage = idxVillage !== -1 && row[idxVillage] ? row[idxVillage].trim() : '';
      let rawDate = idxDate !== -1 && row[idxDate] ? row[idxDate].trim() : '';
      let rawBillNo = idxBillNo !== -1 && row[idxBillNo] ? row[idxBillNo].trim() : '';

      // Check if village column actually contains a date and date column contains bill number
      // e.g. "ARUN BAWNE,03-04-2024,1816,,,BAJAJ FAN,..."
      if ((!rawBillNo || rawBillNo === '') && /^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}$/.test(rawVillage) && /^\d+$/.test(rawDate)) {
        rawBillNo = rawDate;
        rawDate = rawVillage;
        rawVillage = '';
      }

      let invoiceNo = rawBillNo;
      if (!invoiceNo) {
        if (bills.length > 0 && /^\d+$/.test(bills[bills.length - 1].invoiceNo)) {
          invoiceNo = String(parseInt(bills[bills.length - 1].invoiceNo, 10) + 1);
        } else {
          invoiceNo = `INV-${r}`;
        }
      }

      // Clean Bill No space typos e.g. "B/ 95" -> "B-95", "B/22" -> "B-22"
      if (invoiceNo.includes('B/') || invoiceNo.includes('B /') || invoiceNo.includes('B -')) {
        const cleanInv = invoiceNo.replace(/B\s*[/ -]\s*/g, 'B-');
        auditIssues.push({
          type: 'spelling',
          description: 'Bill No prefix formatted to standard B-series',
          original: invoiceNo,
          corrected: cleanInv,
        });
        invoiceNo = cleanInv;
      }

      if (rawCustName.toUpperCase() === 'CANCEL' || rawCustName.toUpperCase() === 'CANCELLED' || (!rawCustName && row.some(c => c.toUpperCase().includes('CANCEL')))) {
        auditIssues.push({
          type: 'ignored_cancelled',
          description: `Skipped cancelled entry for bill ${invoiceNo}`,
          original: rawCustName || 'CANCEL',
          corrected: 'SKIPPED',
        });
        continue;
      }

      const { cleanName, extractedVillage } = cleanCustomerName(rawCustName);
      if (rawCustName !== cleanName) {
        auditIssues.push({
          type: 'spelling',
          description: 'Customer Name corrected / double-spaces stripped',
          original: rawCustName,
          corrected: cleanName,
        });
      }

      if (!rawVillage && extractedVillage) {
        rawVillage = extractedVillage;
      }
      const village = cleanVillage(rawVillage);
      if (rawVillage && rawVillage !== village) {
        auditIssues.push({
          type: 'spelling',
          description: 'Village name canonicalized',
          original: rawVillage,
          corrected: village,
        });
      }

      const rawPhone = idxPhone !== -1 && row[idxPhone] ? row[idxPhone] : '';
      const phone = cleanPhone(rawPhone);
      if (rawPhone && rawPhone !== phone && phone !== '') {
        auditIssues.push({
          type: 'phone',
          description: 'Phone number trimmed/normalized to 10 digits',
          original: rawPhone,
          corrected: phone,
        });
      }

      const date = cleanDate(rawDate);
      if (rawDate && rawDate !== date) {
        auditIssues.push({
          type: 'date',
          description: 'Date format / year corrected',
          original: rawDate,
          corrected: date,
        });
      }

      let total = parseFloat((idxTotal !== -1 && row[idxTotal]?.replace(/[^0-9.-]/g, '')) || '0') || 0;
      let paid = parseFloat((idxPaid !== -1 && row[idxPaid]?.replace(/[^0-9.-]/g, '')) || '0') || 0;
      let due = parseFloat((idxDue !== -1 && row[idxDue]?.replace(/[^0-9.-]/g, '')) || '0') || 0;

      // Handle total if zero but paid or due exist
      if (total === 0 && (paid > 0 || due > 0)) {
        total = paid + (due > 0 ? due : 0);
      }

      // Handle negative due amount anomaly
      if (total === 0 && paid > 0 && due < 0) {
        total = paid;
        due = 0;
        auditIssues.push({
          type: 'amount',
          description: `Corrected negative due on bill ${invoiceNo}`,
          original: `Total: 0, Paid: ${paid}, Due: ${due}`,
          corrected: `Total: ${total}, Paid: ${paid}, Due: 0`,
        });
      } else if (due === 0 && total > paid) {
        due = total - paid;
      }

      const mode = (idxMode !== -1 && row[idxMode]?.toLowerCase().includes('credit')) ? 'Credit / Udhari' : 'Cash';
      
      // Extract Product Details
      let productName = '';
      if (idxProduct !== -1 && row[idxProduct]) {
        productName = row[idxProduct].trim();
      } else if (idxRemarks !== -1 && row[idxRemarks]) {
        const cand = row[idxRemarks].trim();
        if (cand && !['sales invoice', 'cash', 'credit', 'bill', 'direct', 'udhari', 'deposit'].includes(cand.toLowerCase())) {
          productName = cand;
        }
      }

      const rawQty = idxQty !== -1 && row[idxQty] ? row[idxQty] : '';
      const quantity = Math.max(1, parseInt(rawQty.replace(/[^0-9]/g, ''), 10) || 1);

      const rawRate = idxRate !== -1 && row[idxRate] ? row[idxRate] : '';
      let unitPrice = parseFloat(rawRate.replace(/[^0-9.-]/g, '')) || 0;
      if (unitPrice === 0 && total > 0 && quantity > 0) {
        unitPrice = Math.round(total / quantity);
      }

      const rawCategory = idxCategory !== -1 && row[idxCategory] ? row[idxCategory].trim() : '';
      const category = rawCategory || 'इलेक्ट्रॉनिक्स & घरगुती उपकरणे';

      const displayItemName = productName || (idxRemarks !== -1 && row[idxRemarks] ? row[idxRemarks].trim() : 'विक्री बिल');
      const itemDetails = `${displayItemName}${quantity > 1 ? ` (${quantity} नग)` : ''}${village ? ` - ${village}` : ''}`;

      bills.push({
        id: `bill-imp-${invoiceNo ? invoiceNo.replace(/[^a-zA-Z0-9-]/g, '') : 'inv'}-${r}`,
        invoiceNo,
        date,
        customerName: cleanName,
        customerPhone: phone || undefined,
        village: village || undefined,
        stockItemName: productName || undefined,
        quantity,
        unitPrice: unitPrice > 0 ? unitPrice : undefined,
        category: category || undefined,
        itemDetails,
        totalAmount: total,
        payingNow: paid,
        dueAmount: due,
        paymentMode: mode as any,
        notes: `Bill: Total ₹${total}, Paid ₹${paid}, Due ₹${due}${productName ? ` | प्रॉडक्ट: ${productName}` : ''}`,
        createdAt: new Date().toISOString(),
      });

      // Accumulate into Product Catalog / Stock Items
      if (productName && productName.length > 1 && !['sales invoice', 'bill', 'invoice', 'sales'].includes(productName.toLowerCase())) {
        const cleanProdName = productName.trim();
        const slugKey = cleanProdName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'item';
        const existingProd = productMap.get(slugKey);
        if (existingProd) {
          existingProd.quantity += quantity;
          if (unitPrice > 0) {
            existingProd.sellingPrice = Math.max(existingProd.sellingPrice, unitPrice);
          }
        } else {
          productMap.set(slugKey, {
            id: `prod-${slugKey}`,
            name: cleanProdName,
            code: `PRD-${(productMap.size + 1).toString().padStart(3, '0')}`,
            category: category || 'फर्निचर व घरगुती वस्तू',
            quantity: quantity,
            unit: 'नग (Piece)',
            sellingPrice: unitPrice > 0 ? unitPrice : total,
            purchasePrice: Math.round((unitPrice > 0 ? unitPrice : total) * 0.75),
            minStockLevel: 5,
            description: `Bill Import वरून आपोआप जोडलेली वस्तू (${invoiceNo})`,
          });
        }
      }

      // Update customer map for Khata
      const custKey = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'cust';
      const existing = customerMap.get(custKey);
      if (existing) {
        existing.totalPurchases += total;
        existing.totalPaid += paid;
        existing.balanceDue += due;
        if (!existing.phone && phone) existing.phone = phone;
        if (!existing.address && village) existing.address = `${village}, Wardha`;
      } else {
        customerMap.set(custKey, {
          id: `cust-${custKey}`,
          name: cleanName,
          phone: phone || '',
          address: village ? `${village}, Wardha` : 'Wardha',
          totalPurchases: total,
          totalPurchased: total,
          totalPaid: paid,
          balanceDue: due,
          lastVisit: date,
        });
      }
    }
  } else if (detectedType === 'receipts') {
    const idxRcptNo = getColIdx(['receiptno', 'receipt', 'voucherno', 'rcptno', 'pavtino', 'pawtino', 'srno', 'sr', 'no', 'slno', 'पावतीक्र', 'पावती']);
    const idxDate = getColIdx(['date', 'receiptdate', 'voucherdate', 'billdate', 'tarikh', 'दिनांक', 'तारीख']);
    const idxCardNo = getColIdx([
      'cardno', 'cardnumber', 'card', 'cardnum', 'cno', 'crdno', 'card_no',
      'schemecard', 'schemecardno', 'memberno', 'member_no', 'acno', 'accountno',
      'passbookno', 'passbook', 'khatano', 'schemeno', 'कार्डक्र', 'कार्ड'
    ]);
    const idxCust = getColIdx(['customername', 'name', 'customer', 'partyname', 'party', 'clientname', 'client', 'grahak', 'custname', 'ग्राहकाचेनाव', 'नाव']);
    const idxVillage = getColIdx(['village', 'villege', 'city', 'town', 'address', 'location', 'gav', 'patta', 'गाव', 'पत्ता']);
    const idxAmount = getColIdx(['amountreceived', 'amount', 'paid', 'totalreceived', 'receivedamount', 'jama', 'rakkam', 'pay', 'paidamount', 'रक्कम', 'जमा']);
    const idxRefBill = getColIdx(['refbillno', 'refbill', 'billno', 'bill', 'बिलक्र', 'बिल']);
    const idxAgainstBill = getColIdx(['againstbillno', 'againstbill', 'againstbill_no', 'बिलक्रमांक', 'बिलविरुद्ध']);
    const idxReceivedBy = getColIdx(['receivedby', 'recivedby', 'collectedby', 'agent', 'staff', 'user', 'cashier', 'जमाघेणारा', 'कलेक्टर']);
    const idxRemarks = getColIdx(['remarks', 'remark', 'note', 'notes', 'receivedby', 'recivedby', 'details', 'particulars', 'narration', 'शेरा', 'तपशील']);
    const idxMode = getColIdx(['paymentmode', 'mode', 'type', 'पेमेंटमोड']);

    // Check if column 0 contains serial / receipt numbers when idxRcptNo === -1
    let actualIdxRcptNo = idxRcptNo;
    if (actualIdxRcptNo === -1 && dataRows.length > 0) {
      const sampleCol0 = dataRows.slice(0, Math.min(10, dataRows.length)).map((r) => r[0]?.trim());
      if (sampleCol0.some((v) => v && /^\d+$/.test(v))) {
        actualIdxRcptNo = 0;
      }
    }

    for (let r = 0; r < dataRows.length; r++) {
      const row = dataRows[r];

      // Skip completely empty rows
      if (row.length === 0 || row.every((c) => !c || c.trim() === '')) {
        continue;
      }

      // Check for CANCEL / CANCELLED / CANCE;L in any cell of the row
      const isCancelled = row.some((c) => {
        if (!c) return false;
        const u = c.toUpperCase().trim();
        return u.includes('CANCEL') || u.includes('CANCE;L') || u.includes('CANCELED');
      });

      const rawCust = idxCust !== -1 && row[idxCust] ? row[idxCust].trim() : '';
      const rawRcptVal = actualIdxRcptNo !== -1 && row[actualIdxRcptNo] ? row[actualIdxRcptNo].trim() : '';
      const rcptNo = rawRcptVal
        ? (/^\d+$/.test(rawRcptVal) ? `REC-${rawRcptVal}` : rawRcptVal)
        : `REC-${r + 1}`;

      if (isCancelled) {
        auditIssues.push({
          type: 'ignored_cancelled',
          description: `रद्द केलेली पावती #${rcptNo} (${rawCust || 'ग्राहक'}) वगळली (Skipped cancelled receipt)`,
          original: rawCust || 'CANCEL',
          corrected: 'SKIPPED',
        });
        continue;
      }

      const rawAmount = parseFloat((idxAmount !== -1 && row[idxAmount]?.replace(/[^0-9.-]/g, '')) || '0') || 0;
      if (!rawCust && rawAmount === 0) {
        continue;
      }

      const rawDate = idxDate !== -1 && row[idxDate] ? row[idxDate] : '';
      const date = cleanDate(rawDate);
      if (rawDate && rawDate !== date) {
        auditIssues.push({
          type: 'date',
          description: 'Receipt date cleaned',
          original: rawDate,
          corrected: date,
        });
      }

      const { cleanName, extractedVillage } = cleanCustomerName(rawCust);
      const rawVillage = (idxVillage !== -1 && row[idxVillage] ? row[idxVillage].trim() : '') || extractedVillage || '';
      const village = cleanVillage(rawVillage);
      if (rawVillage && rawVillage !== village) {
        auditIssues.push({
          type: 'spelling',
          description: 'गाव नाव प्रमाणबद्ध केले',
          original: rawVillage,
          corrected: village,
        });
      }

      // Audit checks for missing data
      if (!cleanName || cleanName === 'Customer') {
        auditIssues.push({
          type: 'spelling',
          description: `पावती #${rcptNo} मध्ये ग्राहकाचे नाव स्पष्ट नाही`,
          original: rawCust || 'रिकामे',
          corrected: 'ग्राहकाचे नाव तपासणी आवश्यक',
        });
      }
      if (rawAmount <= 0) {
        auditIssues.push({
          type: 'amount',
          description: `पावती #${rcptNo} (${cleanName || 'ग्राहक'}) मध्ये रक्कम ₹0 किंवा अवैध आहे`,
          original: (idxAmount !== -1 ? row[idxAmount] : '') || '0',
          corrected: 'रक्कम तपासणी आवश्यक',
        });
      }
      if (!village) {
        auditIssues.push({
          type: 'spelling',
          description: `पावती #${rcptNo} (${cleanName || 'ग्राहक'}) साठी गाव/पत्ता नोंदवलेला नाही`,
          original: 'रिकामे',
          corrected: 'गाव नोंदवणे आवश्यक',
        });
      }

      const amount = rawAmount;
      const cardNoStr = idxCardNo !== -1 && row[idxCardNo] ? row[idxCardNo].trim() : '';
      let cardNo = parseInt(cardNoStr.replace(/[^0-9]/g, ''), 10);

      const againstBill =
        (idxAgainstBill !== -1 && row[idxAgainstBill] ? row[idxAgainstBill].trim() : '') ||
        (idxRefBill !== -1 && row[idxRefBill] ? row[idxRefBill].trim() : '');

      const receivedBy = idxReceivedBy !== -1 && row[idxReceivedBy] ? row[idxReceivedBy].trim() : '';
      const rawMode = idxMode !== -1 && row[idxMode] ? row[idxMode].trim() : '';
      
      const fullRowText = `${rawMode} ${receivedBy} ${row.join(' ')}`.toLowerCase();
      const paymentMode: 'Cash' | 'Online' =
        fullRowText.includes('online') ||
        fullRowText.includes('upi') ||
        fullRowText.includes('gpay') ||
        fullRowText.includes('phonepe') ||
        fullRowText.includes('bank')
          ? 'Online'
          : 'Cash';

      // Look for extra notes like "BAJAJ" in remarks or extra columns
      let extraNote = '';
      if (row.length > 5) {
        const extraCells = row.slice(5).filter((c) => c && c.trim() !== '' && !c.toUpperCase().includes('CANCEL'));
        if (extraCells.length > 0) {
          extraNote = extraCells.join(' | ');
        }
      }
      const remarks = (idxRemarks !== -1 && row[idxRemarks] ? row[idxRemarks].trim() : '') || (receivedBy ? `जमा घेणारा: ${receivedBy}` : '') || extraNote;

      // If cardNo is not directly in card column, inspect text for 4-digit card number (1001-6999)
      if (isNaN(cardNo) || cardNo <= 0) {
        const textToScan = `${remarks} ${rcptNo} ${rawCust}`;
        const cardMatch = textToScan.match(/(?:card|scheme|c|no|#)\s*[:#-]?\s*([1-6]\d{3})\b/i);
        if (cardMatch) {
          cardNo = parseInt(cardMatch[1], 10);
        }
      }

      // Check if this is a Card Scheme deposit receipt
      if ((!isNaN(cardNo) && cardNo > 0) || remarks.toLowerCase().includes('scheme') || rcptNo.includes('SCHEME')) {
        const targetCardNo = isNaN(cardNo) ? 1001 : cardNo;
        const { schemeId } = getSchemeForCard(targetCardNo, remarks);

        cardTransactions.push({
          id: `card-tx-${rcptNo ? rcptNo.replace(/[^a-zA-Z0-9-]/g, '') : 'rcpt'}-${r}`,
          cardId: `cm-${schemeId}-${targetCardNo}`,
          cardNumber: targetCardNo,
          schemeId,
          customerName: cleanName || `Member #${targetCardNo}`,
          receiptNo: rcptNo,
          date,
          type: 'WeeklyPayment',
          amount,
          paymentMode,
          remarks: remarks || `Scheme Payment Receipt: ${rcptNo}`,
          balanceAfter: amount,
          createdAt: new Date().toISOString(),
        });
      } else {
        // Customer credit recovery / Sales payment receipt against bill / udhari (NOT a bill!)
        salesReceipts.push({
          id: `rcpt-entry-${rcptNo ? rcptNo.replace(/[^a-zA-Z0-9-]/g, '') : 'rcpt'}-${r}`,
          invoiceNo: rcptNo,
          date,
          customerName: cleanName,
          village: village || undefined,
          itemDetails: againstBill
            ? `उधारी जमा पावती #${rcptNo} (संदर्भ बिल #${againstBill})${receivedBy ? ` [जमा: ${receivedBy}]` : ''}`
            : `उधारी जमा पावती #${rcptNo}${receivedBy ? ` [जमा: ${receivedBy}]` : ''}${village ? ` (${village})` : ''}`,
          totalAmount: 0, // payment receipt does not add to bill amount
          payingNow: amount,
          dueAmount: 0,
          paymentMode,
          refBillNo: againstBill || undefined,
          againstBillNo: againstBill || undefined,
          entryType: 'Receipt',
          notes: `पावती: ${rcptNo} | जमा रक्कम: ₹${amount}${receivedBy ? ` | जमा घेणारा: ${receivedBy}` : ''}${extraNote ? ` | ${extraNote}` : ''}${village ? ` | गाव: ${village}` : ''}`,
          createdAt: new Date().toISOString(),
        });

        // Credit to customer khata
        if (cleanName && cleanName !== 'Customer') {
          const custKey = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'cust';
          const existing = customerMap.get(custKey);
          if (existing) {
            existing.totalPaid += amount;
            existing.balanceDue = Math.max(0, existing.balanceDue - amount);
            if (date && (!existing.lastVisit || date > existing.lastVisit)) existing.lastVisit = date;
            if ((!existing.address || existing.address === 'Wardha') && village) existing.address = `${village}, Wardha`;
          } else {
            customerMap.set(custKey, {
              id: `cust-${custKey}`,
              name: cleanName,
              phone: '',
              address: village ? `${village}, Wardha` : 'Wardha',
              totalPurchases: 0,
              totalPurchased: 0,
              totalPaid: amount,
              balanceDue: 0,
              lastVisit: date,
            });
          }
        }
      }
    }
  } else if (detectedType === 'cards_raw' || detectedType === 'cards_master') {
    const idxCardNo = getColIdx(['cardno', 'cardnumber', 'कार्डक्र', 'कार्ड']);
    const idxName = getColIdx(['name', 'customername', 'सभासदाचेनाव', 'नाव']);
    const idxVillage = getColIdx(['villege', 'village', 'address', 'city', 'गाव', 'पत्ता']);
    const idxPhone = getColIdx(['mobileno', 'mobile', 'phone', 'मोबाईल']);
    const idxOpening = getColIdx(['openingamt', 'savingbalance', 'balance', 'opening', 'जमारक्कम', 'शिल्लक']);
    const idxDate = getColIdx(['date', 'joiningdate', 'दिनांक', 'तारीख']);
    const idxSheetNo = getColIdx(['sheetno', 'sheet', 'शीटक्र']);
    const idxAgent = getColIdx(['agentname', 'agent', 'scheme', 'schemename', 'एजंट']);

    for (let r = 0; r < dataRows.length; r++) {
      const row = dataRows[r];
      const rawCardNo = idxCardNo !== -1 && row[idxCardNo] ? row[idxCardNo].trim() : '';
      let cardNum = parseInt(rawCardNo.replace(/[^0-9]/g, ''), 10);

      const rawName = idxName !== -1 && row[idxName] ? row[idxName] : '';
      if (!rawName && isNaN(cardNum)) continue;

      const { cleanName, extractedVillage } = cleanCustomerName(rawName);
      const rawVillage = (idxVillage !== -1 && row[idxVillage]) || extractedVillage || '';
      const village = cleanVillage(rawVillage);

      if (rawVillage && rawVillage !== village) {
        auditIssues.push({
          type: 'spelling',
          description: 'Village normalized on card',
          original: rawVillage,
          corrected: village,
        });
      }

      const rawPhone = idxPhone !== -1 && row[idxPhone] ? row[idxPhone] : '';
      const phone = cleanPhone(rawPhone);

      const rawDate = idxDate !== -1 && row[idxDate] ? row[idxDate] : '';
      const date = cleanDate(rawDate);

      const openingAmt = parseFloat((idxOpening !== -1 && row[idxOpening]?.replace(/[^0-9.-]/g, '')) || '0') || 0;
      const sheetNo = idxSheetNo !== -1 && row[idxSheetNo] ? row[idxSheetNo].trim() : '';
      const agentText = idxAgent !== -1 && row[idxAgent] ? row[idxAgent].trim() : '';

      // If card number was empty in sheet, assign a safe unique card number in 4000/3000 series
      if (isNaN(cardNum) || cardNum === 0) {
        cardNum = 4800 + r;
        auditIssues.push({
          type: 'card_number',
          description: `Missing card number auto-assigned for ${cleanName}`,
          original: 'EMPTY',
          corrected: String(cardNum),
        });
      }

      const { schemeId, schemeName } = getSchemeForCard(cardNum, agentText);
      const cardId = `cm-${schemeId}-${cardNum}`;

      cardMembers.push({
        id: cardId,
        cardNumber: cardNum,
        schemeId,
        schemeName,
        customerName: cleanName,
        phone: phone || '',
        village: village || undefined,
        sheetNo: sheetNo || undefined,
        openingAmt: openingAmt > 0 ? openingAmt : undefined,
        address: village ? `${village}, Wardha` : 'Wardha',
        joiningDate: date,
        registrationFee: 50,
        registrationFeePaid: true,
        totalDeposited: openingAmt,
        totalRefunded: 0,
        netBalance: openingAmt,
        status: 'Active',
        notes: `Imported card member${sheetNo ? ` • Sheet #${sheetNo}` : ''}`,
      });

      if (openingAmt > 0) {
        cardTransactions.push({
          id: `rcpt-opn-${schemeId}-${cardNum}-${r}`,
          cardId,
          cardNumber: cardNum,
          schemeId,
          customerName: cleanName,
          customerPhone: phone || undefined,
          receiptNo: `REC-OPN-${cardNum}`,
          date,
          type: 'WeeklyPayment',
          weekNumber: 1,
          amount: openingAmt,
          paymentMode: 'Cash',
          remarks: `Opening Savings Balance: ₹${openingAmt}`,
          balanceAfter: openingAmt,
          createdAt: new Date().toISOString(),
        });
      }
    }
  }

  const customers = Array.from(customerMap.values());
  const stockItems = Array.from(productMap.values());
  const totalReceipts = salesReceipts.length + cardTransactions.length;
  let summaryText = '';

  if (detectedType === 'receipts') {
    summaryText = `सफलता: RECEIPTS (पावत्या) फाईल ओळखली गेली! एकूण ${totalReceipts} जमा पावत्या (${cardTransactions.length > 0 ? `${cardTransactions.length} कार्ड योजना पावत्या + ` : ''}${salesReceipts.length} ग्राहक उधारी जमा पावत्या), ० विक्री बिले, आणि ${customers.length} ग्राहक खाती सुरक्षित अपडेट झाली! (${auditIssues.length} दुरुस्त्या केल्या).`;
  } else if (detectedType === 'bills') {
    summaryText = `सफलता: BILLS (विक्री बिले) फाईल ओळखली गेली! ${bills.length} विक्री बिले, ${stockItems.length > 0 ? `${stockItems.length} प्रॉडक्ट्स/वस्तू (Products), ` : ''}${totalReceipts > 0 ? `${totalReceipts} जमा पावत्या, ` : ''}आणि ${customers.length} ग्राहक खाती तयार झाली! (${auditIssues.length} दुरुस्त्या केल्या).`;
  } else {
    summaryText = `सफलता: ${detectedType.toUpperCase()} ओळखले गेले! ${bills.length} बिले, ${stockItems.length > 0 ? `${stockItems.length} वस्तू, ` : ''}${cardMembers.length} कार्ड्स, ${totalReceipts} पावत्या/डिपॉझिट, आणि ${customers.length} ग्राहक खाती तयार झाली! (${auditIssues.length} दुरुस्त्या केल्या).`;
  }

  return {
    detectedType,
    bills,
    salesReceipts,
    cardMembers,
    cardTransactions,
    customers,
    stockItems,
    auditIssues,
    summaryText,
  };
}
