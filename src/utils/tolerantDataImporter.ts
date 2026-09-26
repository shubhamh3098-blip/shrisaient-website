import { Customer, CardMember, Transaction, BillReceipt, StoreData } from '../types';
import { StorageService } from '../services/storageService';
import { parseDateSmart, mapAgentName, estimateProductPrice } from './showroomDataImporter';

export interface TolerantImportResult {
  totalRowsProcessed: number;
  added: number;
  updated: number;
  skipped: number;
  category: string;
}

/**
 * Clean and parse numeric currency or quantity values (handles ₹, commas, /-, spaces)
 */
export function cleanNumber(val: any, fallback = 0): number {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'number') return isNaN(val) ? fallback : val;
  const str = String(val).replace(/[₹,\s/\\-]/g, '').trim();
  const num = parseFloat(str);
  return isNaN(num) ? fallback : num;
}

/**
 * Find column index matching any of the possible header keywords
 */
function findColIndex(headers: string[], keywords: string[], fallbackIdx: number): number {
  const lowerHeaders = headers.map(h => (h || '').toLowerCase().trim());
  
  for (let i = 0; i < lowerHeaders.length; i++) {
    const h = lowerHeaders[i];
    if (!h) continue;
    for (const kw of keywords) {
      if (h === kw || h.includes(kw)) {
        return i;
      }
    }
  }
  return fallbackIdx;
}

/**
 * TOLERANT CUSTOMER IMPORTER
 * Accepts EVERY row, tolerates missing fields, auto-assigns fallback values,
 * and lets the user correct anything later in the UI.
 */
export function importCustomersTolerant(
  headers: string[],
  rows: string[][],
  storeData: StoreData,
  duplicateMode: 'merge' | 'skip' | 'allow' = 'merge'
): TolerantImportResult {
  if (rows.length === 0) {
    return { totalRowsProcessed: 0, added: 0, updated: 0, skipped: 0, category: 'customers' };
  }

  // 1. Column index detection
  let nameIdx = findColIndex(headers, ['नाव', 'name', 'customer', 'party', 'ग्राहक', 'खातेदार', 'सभासद'], 0);
  let phoneIdx = findColIndex(headers, ['मोबाईल', 'phone', 'mobile', 'contact', 'cell', 'फोन', 'संपर्क'], 1);
  let villageIdx = findColIndex(headers, ['गाव', 'village', 'villege', 'town', 'city', 'शहर'], 2);
  let addressIdx = findColIndex(headers, ['पत्ता', 'address', 'addr', 'add', 'रहिवासी'], 3);
  let purchaseIdx = findColIndex(headers, ['खरेदी', 'purchase', 'total purchase', 'total', 'एकूण', 'बिल'], 4);
  let balanceIdx = findColIndex(headers, ['बाकी', 'due', 'balance', 'pending', 'उधारी', 'शिल्लक'], 5);

  // If column 0 appears to be a Serial Number (e.g. '1', '2', 'sr no'), shift name to col 1 if col 0 was assigned
  const firstRowCol0 = rows[0]?.[0]?.trim() || '';
  const isCol0Serial = /^(\d+|sr\.?\s*no\.?|अ\.?\s*क्र\.?)$/i.test(firstRowCol0) || 
                       /^(\d+|sr\.?\s*no\.?|अ\.?\s*क्र\.?)$/i.test(headers[0] || '');
  if (isCol0Serial && nameIdx === 0 && rows[0]?.length > 1) {
    nameIdx = 1;
    if (phoneIdx === 1) phoneIdx = 2;
    if (villageIdx === 2) villageIdx = 3;
    if (addressIdx === 3) addressIdx = 4;
    if (purchaseIdx === 4) purchaseIdx = 5;
    if (balanceIdx === 5) balanceIdx = 6;
  }

  const existingCustomers = [...storeData.customers];
  let added = 0;
  let updated = 0;
  let skipped = 0;

  for (let i = 0; i < rows.length; i++) {
    const cols = rows[i];
    if (!cols || cols.every(c => !c || c.trim() === '')) continue;

    let rawName = cols[nameIdx]?.trim() || '';
    let rawPhone = cols[phoneIdx]?.trim() || '';
    let rawVillage = cols[villageIdx]?.trim() || '';
    let rawAddress = cols[addressIdx]?.trim() || '';
    let rawPurchase = cols[purchaseIdx]?.trim() || '0';
    let rawBalance = cols[balanceIdx]?.trim() || '0';

    // If phone column didn't have phone, check if any column looks like a 10-digit number
    if (!rawPhone || rawPhone === '0' || rawPhone.length < 10) {
      for (const col of cols) {
        const cleaned = (col || '').replace(/\D/g, '');
        if (cleaned.length === 10) {
          rawPhone = cleaned;
          break;
        }
      }
    }

    // Tolerant Name: if empty, never reject, provide meaningful fallback
    if (!rawName) {
      rawName = `ग्राहक (नोंद #${i + 1})`;
    }

    // Tolerant Village: if empty, default to Wardha
    const village = rawVillage || 'Wardha';
    const address = rawAddress || `${village}, Wardha`;
    const totalPurchased = cleanNumber(rawPurchase, 0);
    const currentBalance = cleanNumber(rawBalance, 0);
    const phone = rawPhone || '0';

    // Duplicate detection
    const normalizedName = rawName.toLowerCase();
    const hasValidPhone = phone !== '0' && phone.length >= 10;
    
    const existingIndex = existingCustomers.findIndex(c => {
      if (hasValidPhone && c.phone === phone) return true;
      return c.name.toLowerCase() === normalizedName;
    });

    if (existingIndex >= 0) {
      if (duplicateMode === 'skip') {
        skipped++;
        continue;
      } else if (duplicateMode === 'merge') {
        existingCustomers[existingIndex].totalPurchased = (existingCustomers[existingIndex].totalPurchased || 0) + totalPurchased;
        existingCustomers[existingIndex].totalPurchase = existingCustomers[existingIndex].totalPurchased;
        existingCustomers[existingIndex].currentBalance += currentBalance;
        if ((!existingCustomers[existingIndex].phone || existingCustomers[existingIndex].phone === '0') && hasValidPhone) {
          existingCustomers[existingIndex].phone = phone;
        }
        updated++;
        continue;
      }
    }

    // Add as new Customer (Tolerant & 100% saved)
    const newCustomer: Customer = {
      id: `cust-${Date.now()}-${i}`,
      name: rawName.toUpperCase(),
      phone: hasValidPhone ? phone : '0',
      village,
      city: village,
      address,
      creditLimit: 50000,
      totalPurchased,
      totalPurchase: totalPurchased,
      currentBalance,
      status: currentBalance > 0 ? 'Due' : 'Clear',
      createdAt: new Date().toISOString()
    };

    existingCustomers.push(newCustomer);
    added++;
  }

  storeData.customers = existingCustomers;
  storeData.isDemoWiped = false; // Mark data as active
  StorageService.saveData(storeData);

  return {
    totalRowsProcessed: rows.length,
    added,
    updated,
    skipped,
    category: 'customers'
  };
}

/**
 * TOLERANT SCHEME CARDS IMPORTER
 */
export function importSchemeCardsTolerant(
  headers: string[],
  rows: string[][],
  storeData: StoreData,
  explicitSchemeNo?: number
): TolerantImportResult {
  if (rows.length === 0) {
    return { totalRowsProcessed: 0, added: 0, updated: 0, skipped: 0, category: 'scheme_cards' };
  }

  let cardIdx = findColIndex(headers, ['कार्ड', 'card.no', 'card no', 'card', 'कार्ड क्र', 'कार्ड नं'], 1);
  let nameIdx = findColIndex(headers, ['नाव', 'name', 'member name', 'सभासद', 'सदस्य', 'party'], 0);
  let villageIdx = findColIndex(headers, ['गाव', 'village', 'villege', 'town', 'city'], 2);
  let phoneIdx = findColIndex(headers, ['मोबाईल', 'phone', 'mobile', 'contact', 'cell'], 3);
  let amountIdx = findColIndex(headers, ['opening amt', 'रक्कम', 'paid', 'amount', 'हप्ता', 'एकूण'], 4);
  let dateIdx = findColIndex(headers, ['date', 'तारीख', 'दिनांक'], 5);
  let sheetIdx = findColIndex(headers, ['sheet no', 'sheet', 'शिट'], 6);

  const existingCards = [...storeData.cardMembers];
  let added = 0;
  let updated = 0;
  let skipped = 0;

  for (let i = 0; i < rows.length; i++) {
    const cols = rows[i];
    if (!cols || cols.every(c => !c || c.trim() === '')) continue;

    let rawCard = cols[cardIdx]?.trim() || '';
    let rawName = cols[nameIdx]?.trim() || '';
    let rawVillage = cols[villageIdx]?.trim() || '';
    let rawPhone = cols[phoneIdx]?.trim() || '';
    let rawAmount = cols[amountIdx]?.trim() || '1000';
    let rawDate = cols[dateIdx]?.trim() || '';
    let rawSheet = cols[sheetIdx]?.trim() || '';

    // If card column had name and name had card, auto-swap
    if (/^\d+$/.test(rawName) && !/^\d+$/.test(rawCard)) {
      const temp = rawName;
      rawName = rawCard;
      rawCard = temp;
    }

    // Name fallback
    if (!rawName || rawName.toUpperCase() === 'NAME') {
      rawName = `सभासद (मेंबर #${i + 1})`;
    }

    // Extract digits from card
    const cardDigits = rawCard.match(/\d+/g);
    const cardNum = cardDigits ? parseInt(cardDigits[cardDigits.length - 1], 10) : (1001 + i);

    let schemeNo = explicitSchemeNo || 1;
    if (!explicitSchemeNo) {
      if (cardNum > 3000 && cardNum <= 6000) {
        schemeNo = 3;
      } else if (rawSheet.toLowerCase().includes('sch2') || rawSheet.toLowerCase().includes('scheme 2')) {
        schemeNo = 2;
      } else {
        schemeNo = 1;
      }
    }

    const schemeName = `योजना ${schemeNo} (Scheme ${schemeNo})`;
    const formattedCardNo = `SCH${schemeNo}-${cardNum}`;
    const openingAmt = cleanNumber(rawAmount, 100);
    const startDate = parseDateSmart(rawDate);
    const village = rawVillage || 'Wardha';

    // Exact scheme matching logic:
    // If openingAmt <= 500 (e.g. 100, 200, 450, 500), target is ₹15,000 with ₹100 weekly installment
    // If openingAmt > 500, target is ₹30,000 with ₹1,000 monthly installment
    const isWeekly = openingAmt <= 500;
    const targetAmount = isWeekly ? 15000 : 30000;
    const installmentUnit = isWeekly ? 100 : 1000;
    const paidInstallments = Math.max(1, Math.floor(openingAmt / installmentUnit));
    const planType: '15000_scheme' | '30000_scheme' = isWeekly ? '15000_scheme' : '30000_scheme';

    const cardObj: CardMember = {
      id: `cm-sch${schemeNo}-${cardNum}-${Date.now()}-${i}`,
      cardNo: formattedCardNo,
      schemeNo,
      schemeName,
      sheetNo: rawSheet || undefined,
      memberName: rawName.toUpperCase(),
      phone: rawPhone && rawPhone.length >= 10 ? rawPhone : '0',
      village,
      address: `${village}, Wardha`,
      durationMonths: 30,
      monthlyAmount: installmentUnit,
      targetAmount,
      planType,
      schemeMonth: 30,
      monthlyFee: installmentUnit,
      totalPaidMonths: paidInstallments,
      totalAmountPaid: openingAmt,
      paidMonthsCount: paidInstallments,
      startDate,
      endDate: new Date(Date.now() + 30 * 30 * 24 * 3600 * 1000).toISOString(),
      status: 'Active',
      collectedBy: 'Bhushan Lidbe',
      notes: `३०-महिने बचत योजना (${schemeName}) | कार्ड क्र. ${cardNum}${rawSheet ? ` | Sheet: ${rawSheet}` : ''}`,
    };

    const existingIdx = existingCards.findIndex(c => c.cardNo === cardObj.cardNo);
    if (existingIdx >= 0) {
      existingCards[existingIdx] = { ...existingCards[existingIdx], ...cardObj, id: existingCards[existingIdx].id };
      updated++;
    } else {
      existingCards.push(cardObj);
      added++;
    }

    // Ensure receipts/transactions passbook history matches opening amount
    if (openingAmt > 0) {
      const hasInitTx = storeData.cardTransactions.some(
        ct => ct.cardNo === formattedCardNo || ct.cardMemberId === cardObj.id
      );
      if (!hasInitTx) {
        storeData.cardTransactions.push({
          id: `ct-init-${cardNum}-${i}-${Date.now()}`,
          receiptNo: `REC-${cardNum}-INIT`,
          cardMemberId: cardObj.id,
          cardNo: formattedCardNo,
          memberName: cardObj.memberName,
          monthNumber: paidInstallments,
          weekNumber: paidInstallments,
          amount: openingAmt,
          date: startDate,
          paymentMode: 'Cash',
          collectedBy: 'Bhushan Lidbe',
          remarks: `प्रारंभिक जमा हप्ता (Opening Installment) - Sheet #${rawSheet || '1'}`,
        });
      }
    }
  }

  storeData.cardMembers = existingCards;
  storeData.isDemoWiped = false;
  StorageService.saveData(storeData);

  return {
    totalRowsProcessed: rows.length,
    added,
    updated,
    skipped,
    category: 'scheme_cards'
  };
}

/**
 * TOLERANT SALES BILLS IMPORTER
 */
export function importBillsTolerant(
  headers: string[],
  rows: string[][],
  storeData: StoreData
): TolerantImportResult {
  if (rows.length === 0) {
    return { totalRowsProcessed: 0, added: 0, updated: 0, skipped: 0, category: 'bills' };
  }

  let nameIdx = findColIndex(headers, ['नाव', 'name', 'customer', 'party'], 0);
  let villageIdx = findColIndex(headers, ['गाव', 'village', 'villege'], 1);
  let dateIdx = findColIndex(headers, ['date', 'तारीख', 'दिनांक'], 2);
  let billNoIdx = findColIndex(headers, ['bill no', 'bill', 'बिल क्र', 'पावती क्र'], 3);
  let phoneIdx = findColIndex(headers, ['mobile', 'phone', 'मोबाईल'], 4);
  let productIdx = findColIndex(headers, ['product', 'item', 'वस्तू', 'सामान'], 5);
  let totalIdx = findColIndex(headers, ['total', 'एकूण', 'खरेदी'], 6);
  let advIdx = findColIndex(headers, ['advance', 'जमा', 'adv'], 7);
  let balIdx = findColIndex(headers, ['balance', 'बाकी', 'उधारी'], 8);

  const existingTx = [...storeData.transactions];
  const existingCust = [...storeData.customers];
  let added = 0;
  let updated = 0;

  for (let i = 0; i < rows.length; i++) {
    const cols = rows[i];
    if (!cols || cols.every(c => !c || c.trim() === '')) continue;

    let name = cols[nameIdx]?.trim() || `ग्राहक (बिल #${i + 1})`;
    let village = cols[villageIdx]?.trim() || 'Wardha';
    let rawDate = cols[dateIdx]?.trim() || '';
    let billNo = cols[billNoIdx]?.trim() || `INV-${1000 + i}`;
    let phone = cols[phoneIdx]?.trim() || '0';
    let product = cols[productIdx]?.trim() || 'इलेक्ट्रॉनिक्स / फर्निचर';
    let total = cleanNumber(cols[totalIdx], 0);
    let advance = cleanNumber(cols[advIdx], 0);
    let balance = cleanNumber(cols[balIdx], 0);

    // Strict mathematical reconciliation: TOTAL = ADVANCE + BALANCE
    if (total <= 0) {
      if (advance > 0 && balance > 0) total = advance + balance;
      else if (advance > 0) total = advance;
      else if (balance > 0) total = balance;
      else total = estimateProductPrice(product);
    }

    if (total > 0) {
      if (advance >= 0 && balance >= 0) {
        if (advance + balance !== total) {
          if (balance > 0 && advance === 0) advance = Math.max(0, total - balance);
          else balance = Math.max(0, total - advance);
        }
      } else if (advance >= 0 && balance <= 0) {
        balance = Math.max(0, total - advance);
      }
    }

    const hasValidPhone = Boolean(phone && phone.length >= 10 && phone !== '0' && phone !== '9822000000' && !/^0+$/.test(phone));
    const normalizedName = name.trim().toLowerCase();
    const isGenericName = !name.trim() || ['cash', 'counter', 'रोख', 'walk-in', 'customer', 'ग्राहक'].includes(normalizedName);

    // Upsert customer
    let cust: Customer | undefined;
    if (hasValidPhone) {
      cust = existingCust.find(c => c.phone && c.phone.replace(/\D/g, '').slice(-10) === phone.slice(-10));
    }
    if (!cust && !isGenericName && normalizedName.length > 2) {
      cust = existingCust.find(c => c.name.toLowerCase() === normalizedName && (!village || !c.village || c.village.toLowerCase() === village.toLowerCase()));
    }

    if (cust) {
      cust.totalPurchased = (cust.totalPurchased || 0) + total;
      cust.totalPurchase = cust.totalPurchased;
      cust.currentBalance += balance;
      if ((!cust.phone || cust.phone === '0' || cust.phone === '9822000000') && hasValidPhone) {
        cust.phone = phone;
      }
    } else {
      cust = {
        id: `cust-${Date.now()}-${i}`,
        name: (isGenericName ? `${name} #${billNo}` : name).toUpperCase(),
        phone: hasValidPhone ? phone : '',
        village,
        city: village,
        address: `${village}, Wardha`,
        totalPurchased: total,
        totalPurchase: total,
        currentBalance: balance,
        creditLimit: 100000,
        status: balance > 0 ? 'Due' : 'Clear',
        createdAt: new Date().toISOString()
      };
      existingCust.push(cust);
    }

    // Upsert Transaction
    const date = parseDateSmart(rawDate);
    const txObj: Transaction = {
      id: `tx-${billNo}`,
      invoiceNo: billNo,
      date,
      customerId: cust.id,
      customerName: cust.name,
      customerPhone: hasValidPhone ? phone : (cust.phone && cust.phone.length >= 10 && cust.phone !== '9822000000' ? cust.phone : ''),
      customerAddress: cust.address,
      items: [
        {
          stockId: `stk-${billNo}`,
          name: product,
          brand: 'Sai Enterprise',
          model: '',
          qty: 1,
          rate: total,
          discountPct: 0,
          taxPct: 0,
          total
        }
      ],
      subtotal: total,
      discountTotal: 0,
      taxTotal: 0,
      grandTotal: total,
      paidAmount: advance,
      balanceDue: balance,
      paymentMode: advance > 0 && balance === 0 ? 'Cash' : 'Credit',
      status: balance === 0 ? 'Paid' : advance > 0 ? 'Partial' : 'Unpaid',
      deliveryStatus: 'Delivered',
      createdBy: 'Billing Counter'
    };

    const exIdx = existingTx.findIndex(t => t.invoiceNo === billNo);
    if (exIdx >= 0) {
      existingTx[exIdx] = txObj;
      updated++;
    } else {
      existingTx.push(txObj);
      added++;
    }
  }

  storeData.customers = existingCust;
  storeData.transactions = existingTx;
  storeData.isDemoWiped = false;
  StorageService.saveData(storeData);

  return {
    totalRowsProcessed: rows.length,
    added,
    updated,
    skipped: 0,
    category: 'bills'
  };
}

/**
 * TOLERANT RECEIPTS IMPORTER
 */
export function importReceiptsTolerant(
  headers: string[],
  rows: string[][],
  storeData: StoreData
): TolerantImportResult {
  if (rows.length === 0) {
    return { totalRowsProcessed: 0, added: 0, updated: 0, skipped: 0, category: 'receipts' };
  }

  let srIdx = findColIndex(headers, ['sr no', 'sr', 'पावती क्र', 'क्र', 'no'], 0);
  let dateIdx = findColIndex(headers, ['date', 'तारीख', 'दिनांक'], 1);
  let nameIdx = findColIndex(headers, ['नाव', 'name', 'customer', 'party'], 2);
  let villageIdx = findColIndex(headers, ['गाव', 'village', 'villege'], 3);
  let amountIdx = findColIndex(headers, ['amount', 'रक्कम', 'जमा', 'amt'], 4);
  let agentIdx = findColIndex(headers, ['recived by', 'agent', 'नाव (जमाकर्ता)', 'by'], 5);

  const existingReceipts = [...storeData.billReceipts];
  const existingCust = [...storeData.customers];
  let added = 0;

  for (let i = 0; i < rows.length; i++) {
    const cols = rows[i];
    if (!cols || cols.every(c => !c || c.trim() === '')) continue;

    let receiptNo = parseInt(cols[srIdx]?.replace(/\D/g, '') || '', 10) || (1080 + i);
    let rawDate = cols[dateIdx]?.trim() || '';
    let name = cols[nameIdx]?.trim() || `ग्राहक #${i + 1}`;
    let village = cols[villageIdx]?.trim() || 'Wardha';
    let amount = cleanNumber(cols[amountIdx], 0);
    let agent = mapAgentName(cols[agentIdx] || '');

    if (amount <= 0) amount = 500; // minimum deposit if empty

    const date = parseDateSmart(rawDate);
    let cust = existingCust.find(c => c.name.toLowerCase() === name.toLowerCase());
    if (cust) {
      cust.currentBalance = Math.max(0, cust.currentBalance - amount);
    }

    const rObj: BillReceipt = {
      id: `rcpt-${receiptNo}`,
      receiptNo,
      customerId: cust ? cust.id : `cust-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      customerName: name.toUpperCase(),
      amountPaid: amount,
      date,
      paymentMode: agent.includes('UPI') ? 'UPI' : 'Cash',
      balanceRemaining: cust ? cust.currentBalance : 0,
      handledBy: agent,
      remarks: `पावती जमा (${village || 'Wardha'})`,
    };

    if (!existingReceipts.some(r => r.receiptNo === rObj.receiptNo)) {
      existingReceipts.push(rObj);
      added++;
    }
  }

  storeData.billReceipts = existingReceipts;
  storeData.customers = existingCust;
  storeData.isDemoWiped = false;
  StorageService.saveData(storeData);

  return {
    totalRowsProcessed: rows.length,
    added,
    updated: 0,
    skipped: 0,
    category: 'receipts'
  };
}
