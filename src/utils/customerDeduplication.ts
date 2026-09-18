import { Customer, TransactionEntry, BillReceiptEntry, CardMember, CardTransaction } from '../types';

export const MERGED_CUSTOMERS_STORAGE_KEY = 'shri_sai_merged_customers_map';

export interface MergedRecord {
  primaryId: string;
  primaryName: string;
  primaryPhone?: string;
  mergedAt: string;
}

export function getStoredCustomerMerges(): Record<string, MergedRecord> {
  try {
    const raw = localStorage.getItem(MERGED_CUSTOMERS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load merged customers map', e);
  }
  return {};
}

export function saveStoredCustomerMerges(map: Record<string, MergedRecord>): void {
  try {
    localStorage.setItem(MERGED_CUSTOMERS_STORAGE_KEY, JSON.stringify(map));
  } catch (e) {
    console.error('Failed to save merged customers map', e);
  }
}

export function clearStoredCustomerMerges(): void {
  try {
    localStorage.removeItem(MERGED_CUSTOMERS_STORAGE_KEY);
  } catch (e) {}
}

/**
 * Normalizes Marathi/Indian names by stripping common suffixes like -rao, -rav, -ji, -patil, -seth, -bhau
 * and phonetic variants like v/w, sh/s
 */
export function extractNameTokens(rawName: string): {
  tokens: string[];
  cleanFull: string;
  rootFirst: string;
  surname: string;
} {
  if (!rawName) return { tokens: [], cleanFull: '', rootFirst: '', surname: '' };

  const clean = rawName
    .toLowerCase()
    .replace(/[()[\]{}_,.\-+]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const rawTokens = clean.split(' ').filter(Boolean);
  const titles = new Set(['shri', 'mr', 'smt', 'sau', 'dr', 'mrs', 'miss']);
  const tokens = rawTokens.filter((t) => !titles.has(t));

  const stripSuffixes = (w: string): string => {
    let word = w;
    // Replace common Marathi honorific suffixes
    const suffixes = ['raoji', 'rao', 'rav', 'ji', 'patil', 'bhau', 'saheb', 'sheth', 'seth'];
    for (const suf of suffixes) {
      if (word.length > suf.length + 2 && word.endsWith(suf)) {
        word = word.slice(0, -suf.length);
        break;
      }
    }
    // Normalize phonetic w to v
    word = word.replace(/w/g, 'v');
    return word;
  };

  const normalizedTokens = tokens.map(stripSuffixes);
  const rootFirst = normalizedTokens[0] || '';
  const surname = normalizedTokens.length > 1 ? normalizedTokens[normalizedTokens.length - 1] : '';

  return {
    tokens: normalizedTokens,
    cleanFull: clean,
    rootFirst,
    surname,
  };
}

export interface DuplicateCandidatePair {
  id: string;
  primary: Customer;
  secondary: Customer;
  reason: string;
  matchScore: number;
  combinedPurchased: number;
  combinedPaid: number;
  combinedDue: number;
}

/**
 * Fast O(N) Heuristics to find duplicate customer accounts:
 * 1. Specific known case: "SHESH BHAGAT" and "SHESHRAV BHAGAT"
 * 2. Exact same 10-digit phone number with slight name variation
 * 3. Exact same surname + same normalized first-name root (e.g. Shesh / Sheshrav, Ramesh / Rameshrao)
 * 4. Same village + high name token overlap
 */
export function detectDuplicateCustomers(
  customers: Customer[],
  mergedRecords?: { secondaryId?: string; secondaryName?: string; primaryId?: string }[]
): DuplicateCandidatePair[] {
  if (!customers || customers.length < 2) return [];

  const pairs: DuplicateCandidatePair[] = [];
  const processedPairs = new Set<string>();

  // Stored merges lookup
  const storedMerges = getStoredCustomerMerges();
  const mergedSecondaryIds = new Set<string>();
  const mergedSecondaryNames = new Set<string>();

  if (mergedRecords && Array.isArray(mergedRecords)) {
    mergedRecords.forEach((r) => {
      if (r.secondaryId) mergedSecondaryIds.add(r.secondaryId);
      if (r.secondaryName) mergedSecondaryNames.add(r.secondaryName.trim().toLowerCase());
    });
  }
  Object.entries(storedMerges).forEach(([k, v]) => {
    mergedSecondaryIds.add(k);
    if (v && v.primaryId) mergedSecondaryIds.add(k);
  });

  interface ParsedCustomer {
    c: Customer;
    phone: string;
    village: string;
    cleanFull: string;
    rootFirst: string;
    surname: string;
    isShesh: boolean;
  }

  const phoneMap = new Map<string, ParsedCustomer[]>();
  const surnameRootMap = new Map<string, ParsedCustomer[]>();
  const cleanNameMap = new Map<string, ParsedCustomer[]>();
  const sheshList: ParsedCustomer[] = [];

  // 1. Single O(N) pass to extract tokens and index customers into lookup buckets
  for (let i = 0; i < customers.length; i++) {
    const c = customers[i];
    const rawName = (c.name || '').trim();
    // Skip completely empty or purely generic bill customers
    if (!rawName || rawName.startsWith('ग्राहक #') || rawName.startsWith('ग्राहक (बिल #') || rawName.startsWith('customer #')) {
      continue;
    }

    // Skip accounts that are already merged as secondary
    if (mergedSecondaryIds.has(c.id) || mergedSecondaryNames.has(rawName.toLowerCase())) {
      continue;
    }

    const cleanDigits = (c.phone || '').replace(/\D/g, '');
    const phone =
      cleanDigits.length >= 10 && !/^(\d)\1{9,}$/.test(cleanDigits.slice(-10))
        ? cleanDigits.slice(-10)
        : '';
    const village = (c.village || '').trim().toLowerCase();

    const n = extractNameTokens(rawName);
    const isShesh =
      (n.cleanFull.includes('shesh') || n.cleanFull.includes('sheshrav') || n.cleanFull.includes('sheshrao')) &&
      n.cleanFull.includes('bhagat');

    const parsed: ParsedCustomer = {
      c,
      phone,
      village,
      cleanFull: n.cleanFull,
      rootFirst: n.rootFirst,
      surname: n.surname,
      isShesh,
    };

    // Bucket by 10-digit phone
    if (phone) {
      const pArr = phoneMap.get(phone);
      if (pArr) pArr.push(parsed);
      else phoneMap.set(phone, [parsed]);
    }

    // Bucket by surname + rootFirst
    if (n.surname && n.rootFirst && n.surname.length >= 2 && n.rootFirst.length >= 2) {
      const srKey = `${n.surname}___${n.rootFirst}`;
      const srArr = surnameRootMap.get(srKey);
      if (srArr) srArr.push(parsed);
      else surnameRootMap.set(srKey, [parsed]);
    }

    // Bucket by exact cleanFull name
    if (n.cleanFull && n.cleanFull.length >= 3) {
      const cnArr = cleanNameMap.get(n.cleanFull);
      if (cnArr) cnArr.push(parsed);
      else cleanNameMap.set(n.cleanFull, [parsed]);
    }

    if (isShesh) {
      sheshList.push(parsed);
    }
  }

  // Helper to add candidate pair
  const tryAddPair = (p1: ParsedCustomer, p2: ParsedCustomer, matchScore: number, reason: string) => {
    if (p1.c.id === p2.c.id) return;
    const pairKey = [p1.c.id, p2.c.id].sort().join('___');
    if (processedPairs.has(pairKey)) return;
    processedPairs.add(pairKey);

    // Skip if either customer is already flagged as merged into the other
    if (
      storedMerges[p1.c.id]?.primaryId === p2.c.id ||
      storedMerges[p2.c.id]?.primaryId === p1.c.id ||
      mergedSecondaryIds.has(p1.c.id) ||
      mergedSecondaryIds.has(p2.c.id)
    ) {
      return;
    }

    // Decide which is primary: prefer valid phone number, then higher purchase history
    const c1Score = (p1.phone ? 10 : 0) + (p1.c.totalPurchased || 0);
    const c2Score = (p2.phone ? 10 : 0) + (p2.c.totalPurchased || 0);
    const primary = c1Score >= c2Score ? p1.c : p2.c;
    const secondary = c1Score >= c2Score ? p2.c : p1.c;

    const pur1 = Math.max(primary.totalPurchased || 0, (primary.totalPaid || 0) + (primary.balanceDue || 0));
    const pur2 = Math.max(secondary.totalPurchased || 0, (secondary.totalPaid || 0) + (secondary.balanceDue || 0));
    const combinedPurchased = pur1 + pur2;
    const combinedPaid = (primary.totalPaid || 0) + (secondary.totalPaid || 0);
    const combinedDue = Math.max(0, combinedPurchased - combinedPaid);

    pairs.push({
      id: pairKey,
      primary,
      secondary,
      reason,
      matchScore,
      combinedPurchased,
      combinedPaid,
      combinedDue,
    });
  };

  // 1. Shesh Bhagat bucket (Priority 100)
  if (sheshList.length >= 2) {
    for (let i = 0; i < sheshList.length; i++) {
      for (let j = i + 1; j < sheshList.length; j++) {
        tryAddPair(
          sheshList[i],
          sheshList[j],
          100,
          'एकाच व्यक्तीचे नाव: "SHESH BHAGAT" व "SHESHRAV BHAGAT" (सातोडा / वर्धा)'
        );
      }
    }
  }

  // 2. Exact same 10-digit Phone buckets (O(bucket_size) where size is 2-3)
  for (const [phone, list] of phoneMap.entries()) {
    if (list.length >= 2) {
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          tryAddPair(list[i], list[j], 95, `समान मोबाईल नंबर (${phone}) असलेली खाती`);
        }
      }
    }
  }

  // 3. Same surname + same normalized root first name buckets
  for (const [_, list] of surnameRootMap.entries()) {
    if (list.length >= 2) {
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          const a = list[i];
          const b = list[j];
          const vComp =
            !a.village ||
            !b.village ||
            a.village === b.village ||
            a.village.includes(b.village) ||
            b.village.includes(a.village);
          if (vComp) {
            tryAddPair(
              a,
              b,
              90,
              `समान आडनाव (${a.surname}) व मूळ नाव (${a.rootFirst}) - नाव प्रत्यय भेद (उदा. राव/जी)`
            );
          }
        }
      }
    }
  }

  // 4. Exact same full clean name buckets
  for (const [_, list] of cleanNameMap.entries()) {
    if (list.length >= 2) {
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          tryAddPair(list[i], list[j], 85, 'तंतोतंत समान नाव असलेली स्वतंत्र खाती');
        }
      }
    }
  }

  // Sort by match score desc and then due amount desc; cap at top 30 to keep UI ultra responsive
  return pairs
    .sort((a, b) => b.matchScore - a.matchScore || b.combinedDue - a.combinedDue)
    .slice(0, 30);
}

/**
 * Execute full atomic merge across:
 * - Customers
 * - Transactions (all sales bills)
 * - BillReceipts (all payment vouchers)
 * - CardMembers & CardTransactions
 */
export function executeFullCustomerMerge(
  primaryCust: Customer,
  secondaryCust: Customer,
  allCustomers: Customer[],
  allTransactions: TransactionEntry[] = [],
  allReceipts: BillReceiptEntry[] = [],
  allCardMembers: CardMember[] = [],
  allCardTransactions: CardTransaction[] = [],
  customOverrides?: {
    name?: string;
    phone?: string;
    village?: string;
    address?: string;
  }
): {
  updatedCustomers: Customer[];
  updatedTransactions: TransactionEntry[];
  updatedReceipts: BillReceiptEntry[];
  updatedCardMembers: CardMember[];
  updatedCardTransactions: CardTransaction[];
  mergedCustomer: Customer;
} {
  const cleanPhone1 = (primaryCust.phone || '').replace(/\D/g, '');
  const cleanPhone2 = (secondaryCust.phone || '').replace(/\D/g, '');
  const validPhone = cleanPhone1.length >= 10 ? cleanPhone1.slice(-10) : (cleanPhone2.length >= 10 ? cleanPhone2.slice(-10) : '');
  const finalPhone = customOverrides?.phone !== undefined && customOverrides.phone !== '' ? customOverrides.phone : validPhone;

  // Best village & address
  const finalVillage = customOverrides?.village || primaryCust.village || secondaryCust.village || '';
  let finalAddress = customOverrides?.address || primaryCust.address || secondaryCust.address || '';
  if (!finalAddress && finalVillage) {
    finalAddress = `${finalVillage}, Wardha`;
  }

  // Name resolution
  let finalName = customOverrides?.name || primaryCust.name;
  const isShesh = (primaryCust.name + ' ' + secondaryCust.name).toLowerCase().includes('shesh') &&
                  (primaryCust.name + ' ' + secondaryCust.name).toLowerCase().includes('bhagat');
  if (isShesh && !customOverrides?.name) {
    finalName = 'SHESHRAO BHAGAT';
  }

  // Helper to build extensive name variations
  const getNameVariants = (name: string): string[] => {
    if (!name) return [];
    const n = name.trim().toLowerCase();
    const noSpaces = n.replace(/\s+/g, '');
    const cleanAlpha = n.replace(/[^a-z0-9\u0900-\u097F]/gi, ' ').replace(/\s+/g, ' ').trim();
    const list = [n, noSpaces, cleanAlpha];
    if (n.includes('rao')) list.push(n.replace(/rao/g, 'rav'), n.replace(/rao/g, ''));
    if (n.includes('rav')) list.push(n.replace(/rav/g, 'rao'), n.replace(/rav/g, ''));
    if (n.includes('sh')) list.push(n.replace(/sh/g, 's'));
    return Array.from(new Set(list.filter(Boolean)));
  };

  const secId = secondaryCust.id;
  const primId = primaryCust.id;

  const secondaryNameVariants = getNameVariants(secondaryCust.name);
  const secondaryNames = new Set(secondaryNameVariants.map((s) => s.toLowerCase()));

  const primaryNameVariants = getNameVariants(primaryCust.name);
  const primaryNames = new Set(primaryNameVariants.map((s) => s.toLowerCase()));

  // Helper to check phone match
  const matchesSecondaryPhone = (ph?: string): boolean => {
    if (!ph || cleanPhone2.length < 10) return false;
    const clean = ph.replace(/\D/g, '');
    return clean.endsWith(cleanPhone2.slice(-10));
  };

  const matchesPrimaryPhone = (ph?: string): boolean => {
    if (!ph || cleanPhone1.length < 10) return false;
    const clean = ph.replace(/\D/g, '');
    return clean.endsWith(cleanPhone1.slice(-10));
  };

  // 1. Re-link transactions
  const updatedTransactions = allTransactions.map((t) => {
    const tName = (t.customerName || '').trim().toLowerCase();
    const isSecondary =
      (t.customerId && t.customerId === secId) ||
      (secondaryCust.name && tName === secondaryCust.name.trim().toLowerCase()) ||
      secondaryNames.has(tName) ||
      matchesSecondaryPhone(t.customerPhone);

    const isPrimary =
      (t.customerId && t.customerId === primId) ||
      (primaryCust.name && tName === primaryCust.name.trim().toLowerCase()) ||
      primaryNames.has(tName) ||
      matchesPrimaryPhone(t.customerPhone);

    if (isSecondary || isPrimary) {
      return {
        ...t,
        customerId: primId,
        customerName: finalName,
        customerPhone: finalPhone || t.customerPhone,
        village: finalVillage,
      };
    }
    return t;
  });

  // 2. Re-link bill receipts
  const updatedReceipts = allReceipts.map((r) => {
    const rName = (r.customerName || '').trim().toLowerCase();
    const isSecondary =
      (r.customerId && r.customerId === secId) ||
      (secondaryCust.name && rName === secondaryCust.name.trim().toLowerCase()) ||
      secondaryNames.has(rName) ||
      matchesSecondaryPhone(r.customerPhone);

    const isPrimary =
      (r.customerId && r.customerId === primId) ||
      (primaryCust.name && rName === primaryCust.name.trim().toLowerCase()) ||
      primaryNames.has(rName) ||
      matchesPrimaryPhone(r.customerPhone);

    if (isSecondary || isPrimary) {
      return {
        ...r,
        customerId: primId,
        customerName: finalName,
        customerPhone: finalPhone || r.customerPhone,
        customerVillage: finalVillage,
      };
    }
    return r;
  });

  // 3. Re-link card members
  const updatedCardMembers = allCardMembers.map((cm) => {
    const cmName = (cm.customerName || '').trim().toLowerCase();
    const isSecondary =
      (secondaryCust.name && cmName === secondaryCust.name.trim().toLowerCase()) ||
      secondaryNames.has(cmName) ||
      matchesSecondaryPhone(cm.phone);

    const isPrimary =
      (primaryCust.name && cmName === primaryCust.name.trim().toLowerCase()) ||
      primaryNames.has(cmName) ||
      matchesPrimaryPhone(cm.phone);

    if (isSecondary || isPrimary) {
      return {
        ...cm,
        customerName: finalName,
        phone: finalPhone || cm.phone,
        village: finalVillage,
      };
    }
    return cm;
  });

  // 4. Re-link card transactions
  const updatedCardTransactions = allCardTransactions.map((ct) => {
    const ctName = (ct.customerName || '').trim().toLowerCase();
    const isSecondary =
      (secondaryCust.name && ctName === secondaryCust.name.trim().toLowerCase()) ||
      secondaryNames.has(ctName) ||
      matchesSecondaryPhone(ct.customerPhone);

    const isPrimary =
      (primaryCust.name && ctName === primaryCust.name.trim().toLowerCase()) ||
      primaryNames.has(ctName) ||
      matchesPrimaryPhone(ct.customerPhone);

    if (isSecondary || isPrimary) {
      return {
        ...ct,
        customerName: finalName,
        customerPhone: finalPhone || ct.customerPhone,
      };
    }
    return ct;
  });

  // Accurate Financial Consolidation:
  // Calculate from all linked transactions and receipts for maximum integrity
  const allCustTx = updatedTransactions.filter((t) => t.customerId === primId);
  const txPurchased = allCustTx.reduce((sum, t) => sum + (Number(t.totalAmount) || 0), 0);
  const txPaid = allCustTx.reduce((sum, t) => sum + (Number(t.payingNow) || 0), 0);

  const allCustReceipts = updatedReceipts.filter((r) => r.customerId === primId);
  const receiptPaid = allCustReceipts.reduce((sum, r) => sum + (Number(r.amountPaid) || 0), 0);
  const totalLedgerPaid = txPaid + receiptPaid;

  const pur1 = Math.max(primaryCust.totalPurchased || 0, (primaryCust.totalPaid || 0) + (primaryCust.balanceDue || 0));
  const pur2 = Math.max(secondaryCust.totalPurchased || 0, (secondaryCust.totalPaid || 0) + (secondaryCust.balanceDue || 0));
  const fallbackPurchased = pur1 + pur2;
  const fallbackPaid = (primaryCust.totalPaid || 0) + (secondaryCust.totalPaid || 0);

  const combinedPurchased = txPurchased > 0 ? txPurchased : fallbackPurchased;
  const combinedPaid = txPurchased > 0 ? totalLedgerPaid : fallbackPaid;
  const combinedDue = Math.max(0, combinedPurchased - combinedPaid);

  const mergedCustomer: Customer = {
    ...primaryCust,
    id: primId,
    name: finalName,
    phone: finalPhone,
    village: finalVillage,
    address: finalAddress,
    totalPurchased: combinedPurchased,
    totalPaid: combinedPaid,
    balanceDue: combinedDue,
    lastVisit: primaryCust.lastVisit || secondaryCust.lastVisit || new Date().toISOString().split('T')[0],
  };

  // 5. Replace primary with mergedCustomer, and purge secondary completely
  // BUG FIX: Never filter out primary customer even if secondary has the same name!
  let primaryInserted = false;
  const updatedCustomers: Customer[] = [];

  for (const c of allCustomers) {
    if (c.id === primId) {
      updatedCustomers.push(mergedCustomer);
      primaryInserted = true;
      continue;
    }
    if (c.id === secId) {
      // Discard secondary customer record
      continue;
    }
    // If it's another secondary record by 10-digit phone
    if (cleanPhone2 && cleanPhone2.length >= 10 && c.phone && c.phone.replace(/\D/g, '').endsWith(cleanPhone2.slice(-10))) {
      continue;
    }
    // If the customer has identical name and identical village as secondary, but different ID from primary
    const cNameLower = (c.name || '').trim().toLowerCase();
    const cVillLower = (c.village || '').trim().toLowerCase();
    const secNameLower = (secondaryCust.name || '').trim().toLowerCase();
    const secVillLower = (secondaryCust.village || '').trim().toLowerCase();
    if (cNameLower === secNameLower && cVillLower === secVillLower && c.id !== primId) {
      continue;
    }
    updatedCustomers.push(c);
  }

  if (!primaryInserted) {
    updatedCustomers.unshift(mergedCustomer);
  }

  // 6. Persist merge mapping in localStorage
  const map = getStoredCustomerMerges();
  const mergeRecord = {
    primaryId: primId,
    primaryName: finalName,
    primaryPhone: finalPhone,
    mergedAt: new Date().toISOString(),
  };

  if (secId) {
    map[secId] = mergeRecord;
  }
  if (secondaryCust.name) {
    const secNameLower = secondaryCust.name.trim().toLowerCase();
    map[secNameLower] = mergeRecord;
    map[`${secNameLower}::${(secondaryCust.village || '').trim().toLowerCase()}`] = mergeRecord;
  }
  secondaryNameVariants.forEach((variant) => {
    map[variant.toLowerCase()] = mergeRecord;
  });

  if (cleanPhone2 && cleanPhone2.length >= 10) {
    map[`phone:${cleanPhone2.slice(-10)}`] = mergeRecord;
  }
  saveStoredCustomerMerges(map);

  return {
    updatedCustomers,
    updatedTransactions,
    updatedReceipts,
    updatedCardMembers,
    updatedCardTransactions,
    mergedCustomer,
  };
}
