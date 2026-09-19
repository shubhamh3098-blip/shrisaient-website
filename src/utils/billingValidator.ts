import { Customer, TransactionEntry, StockItem, CardMember } from '../types';

export interface CustomerSuggestion {
  id: string;
  name: string;
  phone: string;
  village: string;
  balanceDue: number;
  lastVisit?: string;
  billCount: number;
  matchReason: 'name' | 'phone' | 'exact';
}

export interface CustomerPhoneMismatch {
  hasMismatch: boolean;
  existingName?: string;
  existingPhone?: string;
  existingVillage?: string;
  existingBalanceDue?: number;
  typedName: string;
  typedPhone: string;
}

export interface StockPriceMismatch {
  hasMismatch: boolean;
  expectedTotal: number;
  enteredTotal: number;
  unitPrice: number;
  quantity: number;
  stockName: string;
}

export interface ValidationIssue {
  id: string;
  field: 'customerName' | 'customerPhone' | 'totalAmount' | 'payingNow' | 'stock' | 'invoiceNo' | 'cardNumber';
  severity: 'error' | 'warning';
  title: string;
  message: string;
  fixLabel?: string;
  onFix?: () => void;
}

/**
 * Clean phone number into standard 10 digits
 */
export const cleanPhoneNumber = (phone: string): string => {
  if (!phone) return '';
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.length > 10 && (digits.startsWith('91') || digits.startsWith('0'))) {
    return digits.slice(-10);
  }
  return digits;
};

/**
 * Smart Customer Suggestion Formula:
 * Combines both existing Customer list and all past transactions to find matches.
 */
export const getSuggestedCustomers = (
  nameQuery: string,
  phoneQuery: string,
  customersList: Customer[] = [],
  transactionsList: TransactionEntry[] = []
): CustomerSuggestion[] => {
  const cleanName = nameQuery.trim().toLowerCase();
  const cleanPhone = cleanPhoneNumber(phoneQuery);

  if (!cleanName && cleanPhone.length < 3) {
    return [];
  }

  // Aggregate customer database from both customersList and transactionsList
  const custMap = new Map<string, CustomerSuggestion>();

  // 1. From customersList
  customersList.forEach((c) => {
    const key = c.name.trim().toLowerCase();
    if (!key) return;
    custMap.set(key, {
      id: c.id,
      name: c.name.trim(),
      phone: c.phone || '',
      village: c.village || c.address || '',
      balanceDue: Number(c.balanceDue) || 0,
      lastVisit: c.lastVisit,
      billCount: 1,
      matchReason: 'name',
    });
  });

  // 2. Enrich from all past transactions
  transactionsList.forEach((t) => {
    const rawName = (t.customerName || '').trim();
    if (!rawName) return;
    const key = rawName.toLowerCase();
    const existing = custMap.get(key);
    if (existing) {
      existing.billCount += 1;
      if (!existing.phone && t.customerPhone) existing.phone = t.customerPhone;
      if (!existing.village && t.village) existing.village = t.village;
      if (t.date && (!existing.lastVisit || t.date > existing.lastVisit)) existing.lastVisit = t.date;
    } else {
      custMap.set(key, {
        id: t.customerId || `cust-${key.replace(/[^a-z0-9]/g, '-')}`,
        name: rawName,
        phone: t.customerPhone || '',
        village: t.village || '',
        balanceDue: Number(t.dueAmount) || 0,
        lastVisit: t.date,
        billCount: 1,
        matchReason: 'name',
      });
    }
  });

  const allAggregated = Array.from(custMap.values());

  const results: { suggestion: CustomerSuggestion; score: number }[] = [];

  allAggregated.forEach((cust) => {
    const custNameLower = cust.name.toLowerCase();
    const custCleanPhone = cleanPhoneNumber(cust.phone);
    let score = 0;
    let matchReason: 'name' | 'phone' | 'exact' = 'name';

    // Exact name match
    if (cleanName && custNameLower === cleanName) {
      score += 100;
      matchReason = 'exact';
    }
    // Name starts with query
    else if (cleanName && custNameLower.startsWith(cleanName)) {
      score += 60;
    }
    // Name contains query
    else if (cleanName && custNameLower.includes(cleanName)) {
      score += 40;
    }

    // Phone match
    if (cleanPhone.length >= 3 && custCleanPhone.includes(cleanPhone)) {
      score += custCleanPhone === cleanPhone ? 80 : 30;
      if (score > 60) matchReason = 'phone';
    }

    if (score > 0) {
      results.push({
        suggestion: { ...cust, matchReason },
        score,
      });
    }
  });

  // Sort by score descending and return top 5
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((r) => r.suggestion);
};

/**
 * Detect Phone Number Mismatch:
 * If the entered phone number belongs to an existing customer with a noticeably different name.
 */
export const detectCustomerPhoneMismatch = (
  typedName: string,
  typedPhone: string,
  customersList: Customer[] = [],
  transactionsList: TransactionEntry[] = []
): CustomerPhoneMismatch => {
  const cleanPhone = cleanPhoneNumber(typedPhone);
  const cleanName = typedName.trim().toLowerCase();

  if (cleanPhone.length !== 10) {
    return { hasMismatch: false, typedName, typedPhone };
  }

  // Look for any customer with this phone
  let matchedCustomer: { name: string; phone: string; village?: string; balanceDue?: number } | null = null;

  for (const c of customersList) {
    if (cleanPhoneNumber(c.phone) === cleanPhone) {
      matchedCustomer = {
        name: c.name,
        phone: c.phone,
        village: c.village || c.address,
        balanceDue: c.balanceDue,
      };
      break;
    }
  }

  if (!matchedCustomer) {
    for (const t of transactionsList) {
      if (t.customerPhone && cleanPhoneNumber(t.customerPhone) === cleanPhone && t.customerName) {
        matchedCustomer = {
          name: t.customerName,
          phone: t.customerPhone,
          village: t.village,
          balanceDue: t.dueAmount,
        };
        break;
      }
    }
  }

  if (matchedCustomer) {
    const existingLower = matchedCustomer.name.trim().toLowerCase();
    // If the typed name is non-empty and does NOT match the existing customer's name
    if (cleanName && existingLower !== cleanName && !existingLower.includes(cleanName) && !cleanName.includes(existingLower)) {
      return {
        hasMismatch: true,
        existingName: matchedCustomer.name,
        existingPhone: matchedCustomer.phone,
        existingVillage: matchedCustomer.village,
        existingBalanceDue: matchedCustomer.balanceDue,
        typedName,
        typedPhone,
      };
    }
  }

  return { hasMismatch: false, typedName, typedPhone };
};

/**
 * Detect Stock Price Mismatch:
 * Check if the total amount matches the selected stock item's unit price * quantity.
 */
export const detectStockPriceMismatch = (
  selectedStock: StockItem | undefined,
  stockQty: number,
  totalAmountStr: string
): StockPriceMismatch => {
  if (!selectedStock || !selectedStock.sellingPrice) {
    return {
      hasMismatch: false,
      expectedTotal: 0,
      enteredTotal: 0,
      unitPrice: 0,
      quantity: stockQty,
      stockName: '',
    };
  }

  const expectedTotal = selectedStock.sellingPrice * Math.max(1, stockQty);
  const enteredTotal = parseFloat(totalAmountStr) || 0;

  const hasMismatch = enteredTotal > 0 && Math.abs(enteredTotal - expectedTotal) > 0.5;

  return {
    hasMismatch,
    expectedTotal,
    enteredTotal,
    unitPrice: selectedStock.sellingPrice,
    quantity: stockQty,
    stockName: selectedStock.name,
  };
};
