import { Customer } from '../types';
import { DuplicatePair } from '../components/DuplicateCustomerMergeModal';

export type { DuplicatePair };

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
  if (digits.length > 10) return digits.slice(-10);
  return digits;
}

// Memory-efficient 1D Levenshtein with length difference guard
function fastLevenshtein(s1: string, s2: string): number {
  if (s1 === s2) return 0;
  const len1 = s1.length;
  const len2 = s2.length;
  if (Math.abs(len1 - len2) > 4) return 99;

  let prev = Array.from({ length: len2 + 1 }, (_, i) => i);
  let curr = new Array(len2 + 1);

  for (let i = 1; i <= len1; i++) {
    curr[0] = i;
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    const temp = prev;
    prev = curr;
    curr = temp;
  }
  return prev[len2];
}

function fastSimilarity(s1: string, s2: string): number {
  if (!s1 || !s2) return 0;
  if (s1 === s2) return 1;
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1;
  const dist = fastLevenshtein(s1, s2);
  return Math.max(0, 1 - dist / maxLen);
}

// Standardize common Marathi names variations
function simplifyMarathiName(name: string): string {
  const norm = normalizeText(name);
  return norm
    .replace(/\brao\b/g, 'rav')
    .replace(/\brav\b/g, 'rao')
    .replace(/\bbabu\b/g, 'bapu')
    .replace(/\bpatil\b/g, '')
    .replace(/\bcontractor\b/g, '')
    .replace(/\belectricals\b/g, '')
    .replace(/\bshri\b/g, '')
    .replace(/\b(satoda|wardha|arvi|hinganghat)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * High-performance, non-blocking duplicate customer detection.
 * Uses O(N) Hash indexing by Phone & Normalized Name first,
 * with bounded bucket-based similarity checking to avoid UI freezing.
 */
export function detectDuplicateCustomers(
  customers: Customer[],
  dismissedPairIds: Set<string> = new Set()
): DuplicatePair[] {
  if (!Array.isArray(customers) || customers.length < 2) return [];

  const results: DuplicatePair[] = [];
  const visitedPairs = new Set<string>();
  const MAX_PAIRS = 30;

  const addPair = (
    cA: Customer,
    cB: Customer,
    reason: string,
    score: number
  ) => {
    if (!cA || !cB || cA.id === cB.id) return;
    const pairKey = [cA.id, cB.id].sort().join(':::');
    if (visitedPairs.has(pairKey)) return;
    visitedPairs.add(pairKey);

    const pairId = `pair-${pairKey}`;
    if (dismissedPairIds.has(pairId)) return;

    results.push({
      id: pairId,
      custA: cA,
      custB: cB,
      reason,
      matchScore: score,
    });
  };

  // Phase 1: Fast O(N) Hash Grouping by 10-digit Phone Number
  const phoneBuckets = new Map<string, Customer[]>();
  // Phase 2: Fast O(N) Hash Grouping by Normalized Name
  const nameBuckets = new Map<string, Customer[]>();
  // Phase 3: Prefix grouping for fuzzy matching (first 3 letters)
  const prefixBuckets = new Map<string, Customer[]>();

  for (let i = 0; i < customers.length; i++) {
    const c = customers[i];
    if (!c) continue;

    const p = normalizePhone(c.phone);
    if (p && p.length === 10) {
      const bucket = phoneBuckets.get(p) || [];
      bucket.push(c);
      phoneBuckets.set(p, bucket);
    }

    const normName = normalizeText(c.name);
    if (normName && normName.length > 2) {
      const bucket = nameBuckets.get(normName) || [];
      bucket.push(c);
      nameBuckets.set(normName, bucket);

      const prefix = normName.slice(0, 3);
      const pBucket = prefixBuckets.get(prefix) || [];
      if (pBucket.length < 15) {
        pBucket.push(c);
        prefixBuckets.set(prefix, pBucket);
      }
    }
  }

  // Check Exact Phone matches (O(N) - instant)
  for (const [phone, list] of phoneBuckets.entries()) {
    if (list.length > 1) {
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          addPair(
            list[i],
            list[j],
            `समान मोबाईल नंबर (${phone}) दोन्ही खात्यांमध्ये नोंदवला आहे.`,
            0.95
          );
          if (results.length >= MAX_PAIRS) break;
        }
        if (results.length >= MAX_PAIRS) break;
      }
    }
    if (results.length >= MAX_PAIRS) break;
  }

  // Check Exact Name matches (O(N) - instant)
  if (results.length < MAX_PAIRS) {
    for (const [, list] of nameBuckets.entries()) {
      if (list.length > 1) {
        for (let i = 0; i < list.length; i++) {
          for (let j = i + 1; j < list.length; j++) {
            addPair(
              list[i],
              list[j],
              `एकच नाव दोन्ही खात्यांमध्ये नोंदवले आहे: "${list[i].name}"`,
              1.0
            );
            if (results.length >= MAX_PAIRS) break;
          }
          if (results.length >= MAX_PAIRS) break;
        }
      }
      if (results.length >= MAX_PAIRS) break;
    }
  }

  // Check bounded prefix buckets for Marathi variations (e.g. Sheshrao vs Sheshrav)
  // Strict budget of comparisons to guarantee 0ms UI freeze
  let comparisonBudget = 300;
  if (results.length < MAX_PAIRS) {
    for (const [, list] of prefixBuckets.entries()) {
      if (list.length > 1 && list.length <= 10) {
        for (let i = 0; i < list.length; i++) {
          for (let j = i + 1; j < list.length; j++) {
            comparisonBudget--;
            if (comparisonBudget <= 0) break;

            const cA = list[i];
            const cB = list[j];
            const nameA = normalizeText(cA.name);
            const nameB = normalizeText(cB.name);
            const simpleA = simplifyMarathiName(cA.name);
            const simpleB = simplifyMarathiName(cB.name);

            if (
              fastSimilarity(nameA, nameB) >= 0.8 ||
              fastSimilarity(simpleA, simpleB) >= 0.82
            ) {
              const place = cA.village || cB.village || 'वर्धा / सातोडा';
              addPair(
                cA,
                cB,
                `एकाच व्यक्तीचे नाव: "${cA.name}" व "${cB.name}" (${place})`,
                0.85
              );
              if (results.length >= MAX_PAIRS) break;
            }
          }
          if (comparisonBudget <= 0 || results.length >= MAX_PAIRS) break;
        }
      }
      if (comparisonBudget <= 0 || results.length >= MAX_PAIRS) break;
    }
  }

  // Sort higher score first
  return results.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
}
