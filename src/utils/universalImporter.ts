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

export function processUniversalCsv(csvContent: string): UniversalImportResult {
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

  const headerLine = parsed[0].map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
  const headerJoined = headerLine.join(',');

  // Detect File Type
  let detectedType: 'bills' | 'receipts' | 'cards_raw' | 'cards_master' | 'unknown' = 'unknown';

  // Receipt indicators (e.g. Receipt No, Amount Received, Against Bill No, Ref Bill No)
  const hasReceiptIndicator =
    headerJoined.includes('receiptno') ||
    headerJoined.includes('amountreceived') ||
    headerJoined.includes('againstbillno') ||
    headerJoined.includes('refbillno') ||
    headerJoined.includes('receivedby');

  const hasGrandTotal =
    headerJoined.includes('grandtotal') ||
    headerJoined.includes('totalamount') ||
    headerJoined.includes('subtotal') ||
    headerJoined.includes('billamount');

  // If receipt indicator is present and not an explicit multi-product bill with grand total
  if (hasReceiptIndicator && !hasGrandTotal) {
    detectedType = 'receipts';
  } else if (
    headerLine.includes('billno') ||
    headerLine.includes('invoiceno') ||
    hasGrandTotal ||
    headerJoined.includes('amountpaid')
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

  const bills: TransactionEntry[] = [];
  const salesReceipts: TransactionEntry[] = [];
  const cardMembers: CardMember[] = [];
  const cardTransactions: CardTransaction[] = [];
  const customerMap = new Map<string, Customer>();
  const productMap = new Map<string, StockItem>();

  const getColIdx = (candidates: string[]): number => {
    for (const cand of candidates) {
      const idx = headerLine.indexOf(cand.toLowerCase().replace(/[^a-z0-9]/g, ''));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  if (detectedType === 'bills') {
    const idxBillNo = getColIdx(['billno', 'invoiceno', 'bill']);
    const idxDate = getColIdx(['date', 'billdate']);
    const idxCust = getColIdx(['customername', 'name', 'customer']);
    const idxPhone = getColIdx(['mobile', 'phone', 'contact']);
    const idxVillage = getColIdx(['village', 'villege', 'city', 'town', 'address']);
    const idxTotal = getColIdx(['grandtotal', 'totalamount', 'subtotal', 'total', 'billamount', 'amount']);
    const idxPaid = getColIdx(['amountpaid', 'paidamount', 'paid', 'cashpaid', 'advance', 'adv', 'deposit', 'jama']);
    const idxDue = getColIdx(['balancedue', 'dueamount', 'due', 'balance', 'shillak', 'baki']);
    const idxMode = getColIdx(['paymentmode', 'mode']);
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
      'vastu'
    ]);
    const idxQty = getColIdx(['quantity', 'qty', 'qnty', 'pieces', 'nos', 'count', 'units', 'nag']);
    const idxRate = getColIdx(['rate', 'price', 'unitprice', 'mrp', 'itemrate', 'cost', 'bhav', 'dar']);
    const idxCategory = getColIdx(['category', 'brand', 'type', 'productcategory']);
    const idxRemarks = getColIdx(['remarks', 'agent', 'itemssummary', 'notes']);

    for (let r = 1; r < parsed.length; r++) {
      const row = parsed[r];

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
    const idxRcptNo = getColIdx(['receiptno', 'receipt', 'voucherno', 'rcptno', 'pavtino', 'pawtino']);
    const idxDate = getColIdx(['date', 'receiptdate', 'voucherdate', 'billdate']);
    const idxCardNo = getColIdx([
      'cardno', 'cardnumber', 'card', 'cardnum', 'cno', 'crdno', 'card_no',
      'schemecard', 'schemecardno', 'memberno', 'member_no', 'acno', 'accountno',
      'passbookno', 'passbook', 'khatano', 'schemeno'
    ]);
    const idxCust = getColIdx(['customername', 'name', 'customer', 'partyname', 'clientname', 'grahak']);
    const idxAmount = getColIdx(['amountreceived', 'amount', 'paid', 'totalreceived', 'receivedamount', 'jama']);
    const idxRefBill = getColIdx(['refbillno', 'refbill', 'billno', 'bill']);
    const idxAgainstBill = getColIdx(['againstbillno', 'againstbill', 'againstbill_no']);
    const idxRemarks = getColIdx(['remarks', 'remark', 'note', 'notes', 'receivedby', 'details', 'particulars', 'narration']);
    const idxMode = getColIdx(['paymentmode', 'mode', 'type']);

    for (let r = 1; r < parsed.length; r++) {
      const row = parsed[r];
      const rcptNo = idxRcptNo !== -1 && row[idxRcptNo] ? row[idxRcptNo].trim() : `RCPT-${r}`;
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

      const rawCust = idxCust !== -1 && row[idxCust] ? row[idxCust] : '';
      const { cleanName, extractedVillage } = cleanCustomerName(rawCust);
      const amount = parseFloat((idxAmount !== -1 && row[idxAmount]?.replace(/[^0-9.-]/g, '')) || '0') || 0;
      const cardNoStr = idxCardNo !== -1 && row[idxCardNo] ? row[idxCardNo].trim() : '';
      let cardNo = parseInt(cardNoStr.replace(/[^0-9]/g, ''), 10);

      const againstBill =
        (idxAgainstBill !== -1 && row[idxAgainstBill] ? row[idxAgainstBill].trim() : '') ||
        (idxRefBill !== -1 && row[idxRefBill] ? row[idxRefBill].trim() : '');
      const rawMode = idxMode !== -1 && row[idxMode] ? row[idxMode].trim() : 'Cash';
      const paymentMode: 'Cash' | 'Online' =
        rawMode.toLowerCase().includes('online') ||
        rawMode.toLowerCase().includes('upi') ||
        rawMode.toLowerCase().includes('gpay')
          ? 'Online'
          : 'Cash';
      const remarks = (idxRemarks !== -1 && row[idxRemarks]) || '';

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
        // Customer credit recovery / Sales payment receipt (NOT a bill!)
        salesReceipts.push({
          id: `rcpt-entry-${rcptNo ? rcptNo.replace(/[^a-zA-Z0-9-]/g, '') : 'rcpt'}-${r}`,
          invoiceNo: rcptNo,
          date,
          customerName: cleanName,
          village: extractedVillage || undefined,
          itemDetails: againstBill
            ? `उधारी जमा पावती #${rcptNo} (संदर्भ बिल #${againstBill})`
            : `उधारी जमा पावती #${rcptNo} (${remarks || paymentMode})`,
          totalAmount: 0, // payment receipt does not add to bill amount
          payingNow: amount,
          dueAmount: 0,
          paymentMode,
          refBillNo: againstBill || undefined,
          againstBillNo: againstBill || undefined,
          entryType: 'Receipt',
          notes: remarks
            ? `पावती: ${rcptNo} | संदर्भ बिल: ${againstBill || 'Direct'} | ${remarks}`
            : `पावती: ${rcptNo} | संदर्भ बिल: ${againstBill || 'Direct'}`,
          createdAt: new Date().toISOString(),
        });

        // Credit to customer khata
        if (cleanName && cleanName !== 'Customer') {
          const custKey = cleanName.toLowerCase();
          const existing = customerMap.get(custKey);
          if (existing) {
            existing.totalPaid += amount;
            existing.balanceDue = Math.max(0, existing.balanceDue - amount);
            if (date) existing.lastVisit = date;
          } else {
            customerMap.set(custKey, {
              id: `cust-${custKey.replace(/[^a-z0-9]/g, '-')}`,
              name: cleanName,
              phone: '',
              address: extractedVillage ? `${extractedVillage}, Wardha` : 'Wardha',
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
    const idxCardNo = getColIdx(['cardno', 'cardnumber']);
    const idxName = getColIdx(['name', 'customername']);
    const idxVillage = getColIdx(['villege', 'village', 'address', 'city']);
    const idxPhone = getColIdx(['mobileno', 'mobile', 'phone']);
    const idxOpening = getColIdx(['openingamt', 'savingbalance', 'balance', 'opening']);
    const idxDate = getColIdx(['date', 'joiningdate']);
    const idxSheetNo = getColIdx(['sheetno', 'sheet']);
    const idxAgent = getColIdx(['agentname', 'agent', 'scheme', 'schemename']);

    for (let r = 1; r < parsed.length; r++) {
      const row = parsed[r];
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
