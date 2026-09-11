import {
  CardMember,
  CardSchemeId,
  CardTransaction,
  Customer,
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
  cardMembers: CardMember[];
  cardTransactions: CardTransaction[];
  customers: Customer[];
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
      cardMembers: [],
      cardTransactions: [],
      customers: [],
      auditIssues,
      summaryText: 'CSV file contains no data or is empty.',
    };
  }

  const headerLine = parsed[0].map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
  const headerJoined = headerLine.join(',');

  // Detect File Type
  let detectedType: 'bills' | 'receipts' | 'cards_raw' | 'cards_master' | 'unknown' = 'unknown';

  if (headerJoined.includes('billno') || headerJoined.includes('grandtotal') || headerJoined.includes('amountpaid')) {
    detectedType = 'bills';
  } else if (headerJoined.includes('receiptno') || headerJoined.includes('refbillno') || headerJoined.includes('againstbillno')) {
    detectedType = 'receipts';
  } else if (headerJoined.includes('agentname') || (headerJoined.includes('cardno') && headerJoined.includes('savingbalance'))) {
    detectedType = 'cards_master';
  } else if (headerJoined.includes('openingamt') || headerJoined.includes('sheetno') || (headerJoined.includes('name') && headerJoined.includes('cardno'))) {
    detectedType = 'cards_raw';
  }

  const bills: TransactionEntry[] = [];
  const cardMembers: CardMember[] = [];
  const cardTransactions: CardTransaction[] = [];
  const customerMap = new Map<string, Customer>();

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
    const idxTotal = getColIdx(['grandtotal', 'totalamount', 'subtotal', 'total']);
    const idxPaid = getColIdx(['amountpaid', 'paidamount', 'paid']);
    const idxDue = getColIdx(['balancedue', 'dueamount', 'due']);
    const idxMode = getColIdx(['paymentmode', 'mode']);
    const idxRemarks = getColIdx(['remarks', 'agent', 'itemssummary']);

    for (let r = 1; r < parsed.length; r++) {
      const row = parsed[r];
      let invoiceNo = idxBillNo !== -1 && row[idxBillNo] ? row[idxBillNo].trim() : `INV-${r}`;
      // Clean Bill No space typos e.g. "B/ 95" -> "B-95", "B/22" -> "B-22"
      if (invoiceNo.includes('B/') || invoiceNo.includes('B /')) {
        const cleanInv = invoiceNo.replace(/B\s*\/\s*/g, 'B-');
        auditIssues.push({
          type: 'spelling',
          description: 'Bill No prefix formatted to standard B-series',
          original: invoiceNo,
          corrected: cleanInv,
        });
        invoiceNo = cleanInv;
      }

      const rawCustName = idxCust !== -1 && row[idxCust] ? row[idxCust] : 'Customer';
      if (rawCustName.toUpperCase() === 'CANCEL' || rawCustName.toUpperCase() === 'CANCELLED') {
        auditIssues.push({
          type: 'ignored_cancelled',
          description: `Skipped cancelled entry for bill ${invoiceNo}`,
          original: rawCustName,
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

      const rawVillage = (idxVillage !== -1 && row[idxVillage]) || extractedVillage || '';
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

      const rawDate = idxDate !== -1 && row[idxDate] ? row[idxDate] : '';
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
      const items = (idxRemarks !== -1 && row[idxRemarks]) || 'Sales Invoice';

      bills.push({
        id: `bill-imp-${invoiceNo.replace(/[^a-zA-Z0-9-]/g, '')}`,
        invoiceNo,
        date,
        customerName: cleanName,
        customerPhone: phone || undefined,
        village: village || undefined,
        itemDetails: `${items}${village ? ` (${village})` : ''}`,
        totalAmount: total,
        payingNow: paid,
        dueAmount: due,
        paymentMode: mode as any,
        notes: `Bill: Total ₹${total}, Paid ₹${paid}, Due ₹${due}`,
        createdAt: new Date().toISOString(),
      });

      // Update customer map for Khata
      const custKey = cleanName.toLowerCase();
      const existing = customerMap.get(custKey);
      if (existing) {
        existing.totalPurchases += total;
        existing.totalPaid += paid;
        existing.balanceDue += due;
        if (!existing.phone && phone) existing.phone = phone;
        if (!existing.address && village) existing.address = `${village}, Wardha`;
      } else {
        customerMap.set(custKey, {
          id: `cust-${custKey.replace(/[^a-z0-9]/g, '-')}`,
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
    const idxRcptNo = getColIdx(['receiptno']);
    const idxDate = getColIdx(['date']);
    const idxCardNo = getColIdx(['cardno']);
    const idxCust = getColIdx(['customername', 'name']);
    const idxAmount = getColIdx(['amountreceived', 'amount']);
    const idxBillNo = getColIdx(['refbillno', 'againstbillno']);
    const idxRemarks = getColIdx(['remarks']);

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
      const cardNo = parseInt(cardNoStr, 10);
      const againstBill = idxBillNo !== -1 && row[idxBillNo] ? row[idxBillNo].trim() : '';
      const remarks = (idxRemarks !== -1 && row[idxRemarks]) || '';

      // Check if this is a Card Scheme deposit receipt
      if ((!isNaN(cardNo) && cardNo > 0) || remarks.toLowerCase().includes('scheme') || rcptNo.includes('SCHEME')) {
        const targetCardNo = isNaN(cardNo) ? 1001 : cardNo;
        const { schemeId } = getSchemeForCard(targetCardNo, remarks);

        cardTransactions.push({
          id: `card-tx-${rcptNo.replace(/[^a-zA-Z0-9-]/g, '')}`,
          cardId: `cm-${schemeId}-${targetCardNo}`,
          cardNumber: targetCardNo,
          schemeId,
          customerName: cleanName || `Member #${targetCardNo}`,
          receiptNo: rcptNo,
          date,
          type: 'WeeklyPayment',
          amount,
          paymentMode: 'Cash',
          remarks: remarks || `Scheme Payment Receipt: ${rcptNo}`,
          balanceAfter: amount,
          createdAt: new Date().toISOString(),
        });
      } else {
        // Sales bill receipt! Register into bills transaction ledger
        bills.push({
          id: `rcpt-entry-${rcptNo.replace(/[^a-zA-Z0-9-]/g, '')}`,
          invoiceNo: rcptNo,
          date,
          customerName: cleanName,
          itemDetails: againstBill ? `Payment Receipt against Bill #${againstBill}` : `Sale Payment Receipt (${remarks || 'Cash'})`,
          totalAmount: 0, // payment receipt does not add to bill amount
          payingNow: amount,
          dueAmount: 0,
          paymentMode: 'Cash',
          notes: `Receipt No: ${rcptNo} | Against Bill: ${againstBill || 'Direct'}`,
          createdAt: new Date().toISOString(),
        });

        // Credit to customer khata
        if (cleanName && cleanName !== 'Customer') {
          const custKey = cleanName.toLowerCase();
          const existing = customerMap.get(custKey);
          if (existing) {
            existing.totalPaid += amount;
            existing.balanceDue = Math.max(0, existing.balanceDue - amount);
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
  const summaryText = `सफलता: ${detectedType.toUpperCase()} ओळखले गेले! ${bills.length} बिले, ${cardMembers.length} कार्ड्स, ${cardTransactions.length} पावत्या/डिपॉझिट, आणि ${customers.length} ग्राहक खाती तयार झाली! (${auditIssues.length} दुरुस्त्या केल्या).`;

  return {
    detectedType,
    bills,
    cardMembers,
    cardTransactions,
    customers,
    auditIssues,
    summaryText,
  };
}
