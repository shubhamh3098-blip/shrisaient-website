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
  if (digits.length > 10) return digits.slice(-10);
  return digits;
}

// Levenshtein distance calculation
function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

function stringSimilarity(s1: string, s2: string): number {
  if (!s1 || !s2) return 0;
  if (s1 === s2) return 1;
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1;
  const dist = levenshteinDistance(s1, s2);
  return 1 - dist / maxLen;
}

// Standardize common Marathi names variations
function simplifyMarathiName(name: string): string {
  let norm = normalizeText(name);
  norm = norm
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
  return norm;
}

export function detectDuplicateCustomers(
  customers: Customer[],
  dismissedPairIds: Set<string> = new Set()
): DuplicatePair[] {
  const results: DuplicatePair[] = [];
  const visitedPairs = new Set<string>();

  for (let i = 0; i < customers.length; i++) {
    for (let j = i + 1; j < customers.length; j++) {
      const cA = customers[i];
      const cB = customers[j];

      const pairKey = [cA.id, cB.id].sort().join(':::');
      if (visitedPairs.has(pairKey)) continue;
      visitedPairs.add(pairKey);

      const pairId = `pair-${pairKey}`;
      if (dismissedPairIds.has(pairId)) continue;

      const phoneA = normalizePhone(cA.phone);
      const phoneB = normalizePhone(cB.phone);

      const nameA = normalizeText(cA.name);
      const nameB = normalizeText(cB.name);

      const simpleA = simplifyMarathiName(cA.name);
      const simpleB = simplifyMarathiName(cB.name);

      const villageA = normalizeText(cA.village || cA.address);
      const villageB = normalizeText(cB.village || cB.address);

      let isDuplicate = false;
      let reason = '';
      let score = 0;

      // 1. Same 10-digit phone number
      if (phoneA && phoneB && phoneA === phoneB && phoneA.length === 10) {
        isDuplicate = true;
        score = 0.95;
        reason = `समान मोबाईल नंबर (${phoneA}) दोन्ही खात्यांमध्ये नोंदवला आहे.`;
      }
      // 2. High name similarity + Marathi variation (e.g. Sheshrao Bhagat vs Sheshrav Bhagat)
      else if (
        stringSimilarity(nameA, nameB) >= 0.78 ||
        stringSimilarity(simpleA, simpleB) >= 0.8 ||
        (nameA.includes('shesh') && nameB.includes('shesh'))
      ) {
        isDuplicate = true;
        score = 0.85;
        const place = cA.village || cB.village || 'वर्धा / सातोडा';
        reason = `एकाच व्यक्तीचे नाव: "${cA.name}" व "${cB.name}" (${place})`;
      }
      // 3. Same village and very close name
      else if (
        villageA &&
        villageB &&
        (villageA.includes(villageB) || villageB.includes(villageA)) &&
        stringSimilarity(nameA, nameB) >= 0.65
      ) {
        isDuplicate = true;
        score = 0.8;
        reason = `एकाच गावातील समान नाव: "${cA.name}" आणि "${cB.name}" (${cA.village || cB.village})`;
      }

      if (isDuplicate) {
        results.push({
          id: pairId,
          custA: cA,
          custB: cB,
          reason,
          matchScore: score,
        });
      }
    }
  }

  // Sort higher score first
  return results.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
}
