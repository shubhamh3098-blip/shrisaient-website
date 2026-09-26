import fs from 'fs';
import path from 'path';

const mockPath = path.join(process.cwd(), 'src/mockData.ts');
let content = fs.readFileSync(mockPath, 'utf-8');

// Replace customers array
const custStart = content.indexOf('customers: [');
const custEnd = content.indexOf('transactions: [');
if (custStart !== -1 && custEnd !== -1) {
  content = content.slice(0, custStart) + 'customers: userShowroomCustomers,\n  ' + content.slice(custEnd);
}

// Replace transactions array
const txStart = content.indexOf('transactions: [');
const txEnd = content.indexOf('purchases: [');
if (txStart !== -1 && txEnd !== -1) {
  content = content.slice(0, txStart) + 'transactions: userShowroomTransactions,\n  ' + content.slice(txEnd);
}

// Replace cardMembers array
const cmStart = content.indexOf('cardMembers: [');
const cmEnd = content.indexOf('cardTransactions: [');
if (cmStart !== -1 && cmEnd !== -1) {
  content = content.slice(0, cmStart) + 'cardMembers: userShowroomCards,\n  ' + content.slice(cmEnd);
}

// Replace billReceipts array
const brStart = content.indexOf('billReceipts: [');
const brEnd = content.indexOf('authSessions: [');
if (brStart !== -1 && brEnd !== -1) {
  content = content.slice(0, brStart) + 'billReceipts: userShowroomReceipts,\n  ' + content.slice(brEnd);
}

fs.writeFileSync(mockPath, content, 'utf-8');
console.log('Successfully updated mockData.ts with userShowroom collections!');
