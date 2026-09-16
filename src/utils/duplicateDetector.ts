import { Customer } from '../types';
import { DuplicatePair } from '../components/DuplicateCustomerMergeModal';

function normalizeText(text?: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[.,\-_()[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizePhone(phone?: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 10) return digits.slice(-10);
  return digits;
}

// Fast Levenshtein distance using 2 rows instead of full matrix
function fastLevenshtein(s1: string, s2: string): number {
  if (s1 === s2) return 0;
  if (!s1.length) return s2.length;
  if (!s2.length) return s1.length;

  let prev = Array.from({ length: s2.length + 1 }, (_, i) => i);
  let curr = new Array(s2.length + 1);

  for (let i = 0; i < s1.length; i++) {
    curr[0] = i + 1;
    for (let j = 0; j < s2.length; j++) {
      const cost = s1[i] === s2[j] ? 0 : 1;
      curr[j + 1] = Math.min(curr[j] + 1, prev[j + 1] + 1, prev[j] + cost);
    }
    const temp = prev;
    prev = curr;
    curr = temp;
  }
  return prev[s2.length];
}

function stringSimilarity(s1: string, s2: string): number {
  if (!s1 || !s2) return 0;
  if (s1 === s2) return 1;
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1;
  return 1 - fastLevenshtein(s1, s2) / maxLen;
}

function simplifyMarathiName(name: string): string {
  let norm = normalizeText(name);
  return norm
    .replace(/\brao\b/g, 'rav')
    .replace(/\brav\b/g, 'rao')
    .replace(/\bbabu\b/g, 'bapu')
    .replace(/\bpatil\b/g, '')
    .replace(/\bcontractor\b/g, '')
    .replace(/\belectricals\b/g, '')
    .replace(/\bshri\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function detectDuplicateCustomers(
  customers: Customer[],
  dismissedPairIds: Set<string> = new Set()
): DuplicatePair[] {
  if (!customers || customers.length === 0) return [];

  const results: DuplicatePair[] = [];
  const addedPairKeys = new Set<string>();

  const addMatch = (cA: Customer, cB: Customer, score: number, reason: string) => {
    if (cA.id === cB.id) return;
    const pairKey = [cA.id, cB.id].sort().join(':::');
    if (addedPairKeys.has(pairKey)) return;

    const pairId = `pair-${pairKey}`;
    if (dismissedPairIds.has(pairId)) return;

    addedPairKeys.add(pairKey);
    results.push({
      id: pairId,
      custA: cA,
      custB: cB,
      reason,
      matchScore: score,
    });
  };

  // 1. Phone Number Hash Map (Instant match)
  const phoneMap = new Map<string, Customer[]>();

  for (const c of customers) {
    const p = normalizePhone(c.phone);
    if (p.length === 10) {
      if (!phoneMap.has(p)) phoneMap.set(p, []);
      phoneMap.get(p)!.push(c);
    }
  }

  phoneMap.forEach((matchedList, phone) => {
    if (matchedList.length > 1) {
      for (let i = 0; i < matchedList.length; i++) {
        for (let j = i + 1; j < matchedList.length; j++) {
          addMatch(
            matchedList[i],
            matchedList[j],
            0.98,
            `समान मोबाईल नंबर (${phone}) दोन्ही खात्यांमध्ये नोंदवला आहे.`
          );
        }
      }
    }
  });

  // 2. Village / City based Bucketing for Name Similarity (Avoids full N^2 scan)
  const villageMap = new Map<string, Customer[]>();

  for (const c of customers) {
    const v = normalizeText(c.village || c.address);
    if (v.length >= 3) {
      if (!villageMap.has(v)) villageMap.set(v, []);
      villageMap.get(v)!.push(c);
    }
  }

  villageMap.forEach((group, village) => {
    if (group.length > 1 && group.length <= 150) {
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          const cA = group[i];
          const cB = group[j];

          const nameA = normalizeText(cA.name);
          const nameB = normalizeText(cB.name);
          if (!nameA || !nameB) continue;

          // Quick first character check to skip calculation
          if (nameA[0] !== nameB[0]) continue;

          const simpleA = simplifyMarathiName(cA.name);
          const simpleB = simplifyMarathiName(cB.name);

          const sim = stringSimilarity(simpleA, simpleB);
          if (sim >= 0.82) {
            addMatch(
              cA,
              cB,
              0.85,
              `एकाच गावातील (${village}) समान नाव: "${cA.name}" आणि "${cB.name}"`
            );
          }
        }
      }
    }
  });

  return results.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
}
