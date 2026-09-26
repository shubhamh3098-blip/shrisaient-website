import fs from 'fs';
import path from 'path';

function run() {
  const receiptsRaw = fs.readFileSync(path.join(process.cwd(), 'scripts/raw_receipts.txt'), 'utf-8');
  const billsRaw = fs.readFileSync(path.join(process.cwd(), 'scripts/raw_bills.txt'), 'utf-8');
  const cardsRaw = fs.readFileSync(path.join(process.cwd(), 'scripts/raw_cards.txt'), 'utf-8');

  // Customer map
  const customersMap = new Map();

  function getOrInitCustomer(name, village = '', phone = '') {
    const cleanName = (name || '').trim().toUpperCase();
    if (!cleanName) return null;
    if (!customersMap.has(cleanName)) {
      customersMap.set(cleanName, {
        id: 'cust-' + cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        name: cleanName,
        phone: phone ? phone.trim() : '',
        village: village ? village.trim() : 'Wardha',
        address: `${village ? village.trim() : 'Wardha'}, Wardha`,
        city: village ? village.trim() : 'Wardha',
        creditLimit: 100000,
        currentBalance: 0,
        totalPurchased: 0,
        createdAt: '2023-01-01T10:00:00Z'
      });
    }
    const c = customersMap.get(cleanName);
    if (!c.phone && phone) c.phone = phone.trim();
    if ((!c.village || c.village === 'Wardha') && village) {
      c.village = village.trim();
      c.city = village.trim();
      c.address = `${village.trim()}, Wardha`;
    }
    return c;
  }

  // Parse bills
  const transactions = [];
  const billLines = billsRaw.split('\n').map(l => l.trim()).filter(Boolean);
  for (const line of billLines) {
    const parts = line.split(',');
    if (parts.length < 7) continue;
    const name = parts[0].trim();
    const village = parts[1]?.trim() || '';
    const dateStr = parts[2]?.trim() || '2026-09-18';
    const billNo = parts[3]?.trim() || 'INV-001';
    const phone = parts[4]?.trim() || '';
    const product = parts[5]?.trim() || 'Electronics Goods';
    const total = parseFloat(parts[6]) || 0;
    const advance = parseFloat(parts[7]) || 0;
    const balance = parts[8] !== undefined && parts[8] !== '' ? parseFloat(parts[8]) : (total - advance);

    const cust = getOrInitCustomer(name, village, phone);
    if (!cust) continue;

    cust.totalPurchased += total;
    cust.currentBalance += balance;

    // Convert date DD-MM-YYYY to YYYY-MM-DD
    let isoDate = dateStr;
    const dateParts = dateStr.split('-');
    if (dateParts.length === 3 && dateParts[0].length <= 2) {
      isoDate = `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`;
    }

    transactions.push({
      id: `tx-${billNo}`,
      invoiceNo: billNo,
      date: isoDate,
      customerId: cust.id,
      customerName: cust.name,
      customerPhone: cust.phone || '9822000000',
      customerAddress: cust.address,
      items: [
        {
          stockId: `stk-${billNo}`,
          name: product,
          brand: 'Brand',
          model: '',
          qty: 1,
          rate: total,
          discountPct: 0,
          taxPct: 0,
          total: total
        }
      ],
      subtotal: total,
      discountTotal: 0,
      taxTotal: 0,
      grandTotal: total,
      paidAmount: advance,
      balanceDue: balance,
      paymentMode: advance > 0 ? 'Cash' : 'Credit',
      status: balance <= 0 ? 'Paid' : (advance > 0 ? 'Partial' : 'Unpaid'),
      deliveryStatus: 'Delivered',
      createdBy: 'Terminal-01'
    });
  }

  // Parse receipts
  const receipts = [];
  const receiptLines = receiptsRaw.split('\n').map(l => l.trim()).filter(Boolean);
  for (const line of receiptLines) {
    const parts = line.split(',');
    if (parts.length < 5) continue;
    const recNo = parseInt(parts[0], 10) || receipts.length + 1;
    const dateStr = parts[1]?.trim() || '2026-09-18';
    const name = parts[2]?.trim() || '';
    const village = parts[3]?.trim() || '';
    const amount = parseFloat(parts[4]) || 0;
    const handledBy = parts[5]?.trim() || 'SHUBHAM';

    const cust = getOrInitCustomer(name, village);
    if (!cust) continue;

    cust.currentBalance -= amount;

    let isoDate = dateStr;
    const dateParts = dateStr.split('-');
    if (dateParts.length === 3 && dateParts[0].length <= 2) {
      isoDate = `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`;
    }

    receipts.push({
      id: `rcpt-coll-${recNo}`,
      receiptNo: recNo,
      customerId: cust.id,
      customerName: cust.name,
      amountPaid: amount,
      date: isoDate,
      paymentMode: 'Cash',
      balanceRemaining: cust.currentBalance,
      remarks: `जमा घेणारा: ${handledBy}`,
      handledBy: handledBy
    });
  }

  // Parse cards
  const cards = [];
  const cardLines = cardsRaw.split('\n').map(l => l.trim()).filter(Boolean);
  for (const line of cardLines) {
    const parts = line.split(',');
    if (parts.length < 4) continue;
    const name = parts[0]?.trim() || '';
    const cardNo = parts[1]?.trim() || `SSE-CD-${cards.length + 1001}`;
    const village = parts[2]?.trim() || 'Wardha';
    const phone = parts[3]?.trim() || '';
    const openingAmt = parseFloat(parts[4]) || 1000;
    const dateStr = parts[5]?.trim() || '2023-06-15';

    let isoDate = dateStr;
    const dateParts = dateStr.split('-');
    if (dateParts.length === 3 && dateParts[0].length <= 2) {
      isoDate = `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`;
    }

    cards.push({
      id: `card-${cardNo}`,
      cardNo: cardNo.startsWith('SSE-CD-') ? cardNo : `SSE-CD-${cardNo}`,
      memberName: name,
      phone: phone || '9822000000',
      address: `${village}, Wardha`,
      village: village,
      durationMonths: 30,
      monthlyAmount: 1000,
      startDate: isoDate,
      endDate: '2025-12-15',
      status: 'Active',
      totalPaidMonths: Math.max(1, Math.round(openingAmt / 1000)),
      totalAmountPaid: openingAmt,
      collectedBy: 'SHUBHAM'
    });
  }

  const customersList = Array.from(customersMap.values());

  const tsContent = `// Auto-generated authenticated showroom dataset
import { Customer, Transaction, BillReceipt, CardMember } from '../types';

export const userShowroomCustomers: Customer[] = ${JSON.stringify(customersList, null, 2)};

export const userShowroomTransactions: Transaction[] = ${JSON.stringify(transactions, null, 2)};

export const userShowroomReceipts: BillReceipt[] = ${JSON.stringify(receipts, null, 2)};

export const userShowroomCards: CardMember[] = ${JSON.stringify(cards, null, 2)};
`;

  fs.writeFileSync(path.join(process.cwd(), 'src/data/userShowroomData.ts'), tsContent, 'utf-8');
  console.log(`Generated userShowroomData.ts with ${customersList.length} customers, ${transactions.length} bills, ${receipts.length} receipts, ${cards.length} cards.`);
}

run();
