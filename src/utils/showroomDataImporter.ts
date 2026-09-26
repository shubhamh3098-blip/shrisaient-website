import { Customer, Transaction, BillReceipt, CardMember, StoreData } from '../types';

// Standard Catalog Lookup for intelligent auto-estimation when total is 0 or missing
export const PRODUCT_CATALOG_PRICES: Record<string, number> = {
  'DIWAN 4*6': 7500,
  'DIWAN 3*6': 4500,
  'DIWAN 4/6': 7500,
  'DIWAN 3/6': 4500,
  'DIWAN 6*7': 15000,
  'DIWAN 5*7': 14000,
  'DIWAN 6*6': 16000,
  'DIWAN 6*6.5': 15500,
  'SOFA': 15000,
  'CORNER SOFA': 38000,
  'MAHARAJA SOFA': 16000,
  'DURIAN SOFA': 25000,
  'DURIUN SOFA': 25000,
  'SAGAR SOFA': 16000,
  'RINKI SOFA': 11000,
  'COOLER 3FT': 4000,
  'COOLER 3 FT': 4000,
  'COOLER 2FT': 2500,
  'COOLER 4FT': 7500,
  'FIBER COOLER': 5500,
  'FAIBER CULER': 5500,
  'SANGHAMITRA COOLER': 6000,
  'SANGHMITRA COOLER': 6000,
  'ALMARI 3 DOOR': 13500,
  'ALMARI 2 DOOR': 11500,
  'SINGLE ALMARI': 6500,
  '3 DOOR ALMARI': 13500,
  '2 DOOR ALMARI': 11500,
  'MANDIR 18': 3500,
  'MANDIR 21': 4500,
  'MANDIR 24': 5500,
  'MANDIR 15': 2500,
  'LG REF': 18000,
  'SAMSUNG REF': 19000,
  'HAIER REF': 15500,
  'IFB REF': 17000,
  'LLOYD REF': 16500,
  'VOLTAS REF': 16000,
  'LIBHERR REF': 17500,
  'LG 32': 16000,
  'LG 43': 36000,
  'SAMSUNG 32': 16000,
  'SAMSUNG 43': 31000,
  'IMEE 32': 12500,
  'BESTON 32': 12000,
  'SKY 32': 13500,
  'SKY 43': 23500,
  'TCL 32': 13500,
  'TCL 43': 25000,
  'TCL 55': 35000,
  'BAJAJ FAN': 1800,
  'BPL FAN': 1700,
  'VENUS CEELING FAN': 1600,
  'CHAIR': 1100,
  'MURAJ CHAIR': 1500,
  'BAJAJ MIXER': 3000,
  'WYZER MIXER': 2700,
  'FREE DISH': 1500,
  'DTH': 1500,
  'MI TECH HT': 3500,
  'MI-TECH TOWER': 6500,
  'IRON': 700,
  'WYZER IRON': 700,
};

export function estimateProductPrice(productName: string): number {
  if (!productName) return 2500;
  const upper = productName.toUpperCase();
  for (const [key, price] of Object.entries(PRODUCT_CATALOG_PRICES)) {
    if (upper.includes(key)) return price;
  }
  if (upper.includes('SOFA')) return 15000;
  if (upper.includes('REF') || upper.includes('FRIDGE')) return 17500;
  if (upper.includes('LED') || upper.includes('TV')) return 14000;
  if (upper.includes('COOLER') || upper.includes('CULER')) return 4500;
  if (upper.includes('ALMARI') || upper.includes('KAPAT')) return 11000;
  if (upper.includes('DIWAN') || upper.includes('BED')) return 7500;
  if (upper.includes('FAN')) return 1800;
  if (upper.includes('MIXER')) return 2800;
  if (upper.includes('CHAIR')) return 1200;
  if (upper.includes('MANDIR')) return 3500;
  return 2500;
}

export function parseDateSmart(rawDate: string): string {
  if (!rawDate) return new Date().toISOString().split('T')[0];
  let clean = rawDate.trim().replace(/--/g, '-');
  const parts = clean.split(/[-/]/);
  if (parts.length === 3) {
    let [d, m, y] = parts;
    if (d.length === 4) return `${d}-${m.padStart(2, '0')}-${y.padStart(2, '0')}`;
    if (y.length === 2) y = '20' + y;
    if (y === '2003') y = '2023'; // Ledger entry typo fix
    if (y === '0226') y = '2026';
    if (y === '1024') y = '2024';
    const monthMap: Record<string, string> = {
      jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
      jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
    };
    if (monthMap[m.toLowerCase().slice(0, 3)]) {
      m = monthMap[m.toLowerCase().slice(0, 3)];
    }
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return new Date().toISOString().split('T')[0];
}

export function mapAgentName(raw: string): string {
  if (!raw) return 'Bhushan Lidbe';
  const u = raw.toUpperCase().trim();
  if (u.includes('SHUBHAM')) return 'Shubham Shende';
  if (u.includes('BHUSHAN')) return 'Bhushan Lidbe';
  if (u.includes('SMOON') || u.includes('SURAJ')) return 'Suraj Moon';
  if (u.includes('ABHI')) return 'Abhishek';
  if (u.includes('AKSHAY') || u.includes('AKSHY')) return 'Akshay';
  if (u.includes('ONLINE') || u.includes('UPI')) return 'Online / UPI';
  return raw.trim();
}

export interface ImportResult {
  customersAdded: number;
  customersUpdated: number;
  transactionsAdded: number;
  receiptsAdded: number;
  cardsAdded: number;
  cancelledBills: number;
  autoEstimatedBills: number;
}

export function importSalesBills(csvContent: string, storeData: StoreData): ImportResult {
  const lines = csvContent.trim().split('\n');
  if (lines.length <= 1) return { customersAdded: 0, customersUpdated: 0, transactionsAdded: 0, receiptsAdded: 0, cardsAdded: 0, cancelledBills: 0, autoEstimatedBills: 0 };

  const customers = [...storeData.customers];
  const transactions = [...storeData.transactions];

  let txAdded = 0;
  let custAdded = 0;
  let custUpdated = 0;
  let cancelledCount = 0;
  let estimatedCount = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = line.split(',').map(c => c.replace(/"/g, '').trim());
    
    // Check format: NAME,VILLAGE,DATE,BILL NO,MOBILE NO,PRODUCT,TOTAL,ADVANCE,BALANCE
    const name = cols[0] || '';
    const village = cols[1] || 'Wardha';
    const rawDate = cols[2] || '';
    const billNo = cols[3] || `INV-${1000 + i}`;
    let phone = cols[4] || '';
    const product = cols[5] || 'Electronics / Furniture';
    
    let rawTotal = parseFloat(cols[6]);
    let rawAdvance = parseFloat(cols[7]);
    let rawBalance = parseFloat(cols[8]);

    const isCancel = name.toUpperCase().includes('CANCEL') || (!name && isNaN(rawTotal) && isNaN(rawAdvance));

    let grandTotal = !isNaN(rawTotal) ? rawTotal : 0;
    let paidAmount = !isNaN(rawAdvance) ? rawAdvance : 0;
    let balanceDue = !isNaN(rawBalance) ? rawBalance : 0;
    let isEstimated = false;

    if (isCancel) {
      cancelledCount++;
      grandTotal = 0;
      paidAmount = 0;
      balanceDue = 0;
    } else if (grandTotal <= 0) {
      // Smart "Daimag" Correction:
      if (paidAmount > 0 && balanceDue <= 0) {
        // Customer paid advance and balance was 0 or negative (e.g. 3000, -3000)
        grandTotal = paidAmount;
        balanceDue = 0;
      } else if (balanceDue > 0) {
        // Advance was 0, remaining balance was recorded
        grandTotal = balanceDue;
        paidAmount = 0;
      } else if (product && product !== 'Electronics / Furniture') {
        // Both 0/empty, infer from catalog
        grandTotal = estimateProductPrice(product);
        balanceDue = grandTotal;
        paidAmount = 0;
        isEstimated = true;
        estimatedCount++;
      }
    } else {
      if (isNaN(paidAmount)) paidAmount = 0;
      if (isNaN(balanceDue)) balanceDue = Math.max(0, grandTotal - paidAmount);
      // Reconcile: grandTotal = paidAmount + balanceDue
      if (grandTotal > 0 && paidAmount >= 0) {
        if (paidAmount + balanceDue !== grandTotal) {
          if (balanceDue > 0 && paidAmount === 0) paidAmount = Math.max(0, grandTotal - balanceDue);
          else balanceDue = Math.max(0, grandTotal - paidAmount);
        }
      }
    }

    if (!isCancel && name) {
      // Customer Upsert
      let cust = customers.find(c => c.name.toLowerCase() === name.toLowerCase());
      if (cust) {
        cust.totalPurchased = (cust.totalPurchased || 0) + grandTotal;
        cust.totalPurchase = cust.totalPurchased;
        cust.currentBalance += balanceDue;
        if (!cust.phone || cust.phone === '0' || cust.phone.length < 10) {
          if (phone && phone.length >= 10) cust.phone = phone;
        }
        custUpdated++;
      } else {
        const custId = `cust-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
        cust = {
          id: custId,
          name: name.toUpperCase(),
          phone: phone && phone.length >= 10 ? phone : '',
          village: village || 'Wardha',
          city: village || 'Wardha',
          address: `${village || 'Wardha'}, Wardha`,
          totalPurchased: grandTotal,
          totalPurchase: grandTotal,
          currentBalance: balanceDue,
          creditLimit: 100000,
          status: balanceDue > 0 ? 'Due' : 'Clear',
          createdAt: new Date().toISOString()
        };
        customers.push(cust);
        custAdded++;
      }

      // Add Transaction
      const date = parseDateSmart(rawDate);
      const existingTxIdx = transactions.findIndex(t => t.invoiceNo === billNo);
      const txObj: Transaction = {
        id: `tx-${billNo}`,
        invoiceNo: billNo,
        date,
        customerId: cust.id,
        customerName: cust.name,
        customerPhone: cust.phone,
        customerAddress: cust.address,
        items: [
          {
            stockId: `stk-${billNo}`,
            name: product,
            brand: 'Sai Enterprise',
            model: isEstimated ? 'Estimated Catalog Price' : '',
            qty: 1,
            rate: grandTotal,
            discountPct: 0,
            taxPct: 0,
            total: grandTotal
          }
        ],
        subtotal: grandTotal,
        discountTotal: 0,
        taxTotal: 0,
        grandTotal,
        paidAmount,
        balanceDue,
        paymentMode: paidAmount > 0 && balanceDue === 0 ? 'Cash' : 'Credit',
        status: balanceDue === 0 ? 'Paid' : paidAmount > 0 ? 'Partial' : 'Unpaid',
        deliveryStatus: 'Delivered',
        createdBy: 'Billing Counter'
      };

      if (existingTxIdx >= 0) {
        transactions[existingTxIdx] = txObj;
      } else {
        transactions.push(txObj);
        txAdded++;
      }
    }
  }

  storeData.customers = customers;
  storeData.transactions = transactions;

  return {
    customersAdded: custAdded,
    customersUpdated: custUpdated,
    transactionsAdded: txAdded,
    receiptsAdded: 0,
    cardsAdded: 0,
    cancelledBills: cancelledCount,
    autoEstimatedBills: estimatedCount
  };
}

export function importBillReceipts(csvContent: string, storeData: StoreData): ImportResult {
  const lines = csvContent.trim().split('\n');
  if (lines.length <= 1) return { customersAdded: 0, customersUpdated: 0, transactionsAdded: 0, receiptsAdded: 0, cardsAdded: 0, cancelledBills: 0, autoEstimatedBills: 0 };

  const receipts = [...storeData.billReceipts];
  const customers = [...storeData.customers];
  let receiptsAdded = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = line.split(',').map(c => c.replace(/"/g, '').trim());

    // Format: SR NO, DATE, NAME, VILLAGE, AMOUNT, RECIVED BY
    const receiptNo = cols[0] ? parseInt(cols[0], 10) : (1000 + i);
    const rawDate = cols[1] || '';
    const name = cols[2] || '';
    const village = cols[3] || 'Wardha';
    const amount = parseFloat(cols[4]) || 0;
    const agent = mapAgentName(cols[5]);

    if (!name || amount <= 0) continue;

    const date = parseDateSmart(rawDate);
    let cust = customers.find(c => c.name.toLowerCase() === name.toLowerCase());
    if (cust) {
      cust.currentBalance = Math.max(0, cust.currentBalance - amount);
    }

    const rObj: BillReceipt = {
      id: `rcpt-${receiptNo}`,
      receiptNo: isNaN(receiptNo) ? 1000 + i : receiptNo,
      customerId: cust ? cust.id : `cust-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      customerName: name.toUpperCase(),
      amountPaid: amount,
      date,
      paymentMode: agent === 'Online / UPI' ? 'UPI' : 'Cash',
      balanceRemaining: cust ? cust.currentBalance : 0,
      handledBy: agent,
      remarks: `पावती जमा (${village || 'Wardha'})`,
    };

    if (!receipts.some(r => r.receiptNo === rObj.receiptNo)) {
      receipts.push(rObj);
      receiptsAdded++;
    }
  }

  storeData.billReceipts = receipts;
  storeData.customers = customers;

  return {
    customersAdded: 0,
    customersUpdated: 0,
    transactionsAdded: 0,
    receiptsAdded,
    cardsAdded: 0,
    cancelledBills: 0,
    autoEstimatedBills: 0
  };
}

export function importSchemeCards(
  csvContent: string,
  storeData: StoreData,
  explicitSchemeNo?: number
): ImportResult {
  const lines = csvContent.trim().split('\n');
  if (lines.length <= 1)
    return {
      customersAdded: 0,
      customersUpdated: 0,
      transactionsAdded: 0,
      receiptsAdded: 0,
      cardsAdded: 0,
      cancelledBills: 0,
      autoEstimatedBills: 0,
    };

  const cards = [...storeData.cardMembers];
  let cardsAdded = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = line.split(',').map((c) => c.replace(/"/g, '').trim());

    // Format: NAME, CARD.NO, VILLEGE, MOBILE.NO, OPENING AMT, DATE, SHEET NO
    const name = cols[0] || 'Member';
    const rawCardNo = cols[1] || '';
    const village = cols[2] || 'Wardha';
    const phone =
      cols[3] && cols[3].length >= 10
        ? cols[3]
        : `98221${Math.floor(10000 + Math.random() * 90000)}`;
    const openingAmt = parseFloat(cols[4]) || 100;
    const rawDate = cols[5] || '';
    const sheetNo = cols[6] || '';

    if (!name || name === 'NAME') continue;

    const startDate = parseDateSmart(rawDate);
    const cardDigits = rawCardNo.match(/\d+/g);
    const cardNum = cardDigits ? parseInt(cardDigits[cardDigits.length - 1], 10) : (2000 + i);

    // Determine Scheme based on user rule:
    // Scheme 1: 1001-3000
    // Scheme 2: 1001-3000
    // Scheme 3: 1001-6000
    // Scheme 4 & 5: 1001-6000
    let schemeNo = explicitSchemeNo || 1;
    if (!explicitSchemeNo) {
      if (cardNum > 3000 && cardNum <= 6000) {
        schemeNo = 3;
      } else if (sheetNo.toLowerCase().includes('sch2') || sheetNo.toLowerCase().includes('scheme 2')) {
        schemeNo = 2;
      } else {
        schemeNo = 1;
      }
    }

    const schemeCategory = `योजना ${schemeNo} (Scheme ${schemeNo})`;
    const formattedCardNo = `SCH${schemeNo}-${cardNum}`;

    const isWeekly = openingAmt <= 500;
    const targetAmount = isWeekly ? 15000 : 30000;
    const installmentUnit = isWeekly ? 100 : 1000;
    const paidInstallments = Math.max(1, Math.floor(openingAmt / installmentUnit));
    const planType: '15000_scheme' | '30000_scheme' = isWeekly ? '15000_scheme' : '30000_scheme';

    const cardObj: CardMember = {
      id: `cm-sch${schemeNo}-${cardNum}-${Date.now()}-${i}`,
      cardNo: formattedCardNo,
      schemeNo,
      schemeName: schemeCategory,
      sheetNo: sheetNo || undefined,
      memberName: name.toUpperCase(),
      phone,
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
      notes: `३०-महिने बचत योजना (${schemeCategory}) | कार्ड क्र. ${cardNum}${
        sheetNo ? ` | Sheet: ${sheetNo}` : ''
      }`,
    };

    // Prevent duplicate within the same scheme
    const exists = cards.some(
      (c) =>
        c.cardNo === cardObj.cardNo ||
        (c.schemeNo === schemeNo && c.cardNo.endsWith(`-${cardNum}`))
    );

    if (!exists) {
      cards.push(cardObj);
      cardsAdded++;
    }
  }

  storeData.cardMembers = cards;
  return {
    customersAdded: 0,
    customersUpdated: 0,
    transactionsAdded: 0,
    receiptsAdded: 0,
    cardsAdded,
    cancelledBills: 0,
    autoEstimatedBills: 0,
  };
}
