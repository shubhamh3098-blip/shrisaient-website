import { CardMember, CardTransaction, TransactionEntry, AgentAdvance, BillReceiptEntry } from '../types';

/**
 * Calculates the next auto-incrementing Receipt Number (हप्ते पावती क्रमांक).
 * User rule: baseline is 1078, next is 1079, then 1080...
 */
export function getNextReceiptNumber(cardTransactions: CardTransaction[]): string {
  const BASELINE_RECEIPT = 1078;
  let maxFound = BASELINE_RECEIPT;

  if (Array.isArray(cardTransactions)) {
    for (const tx of cardTransactions) {
      if (!tx.receiptNo) continue;
      // Match standalone numeric or suffix digits e.g. "1078", "REC-1078", "CS-1078"
      const match = tx.receiptNo.match(/(\d+)/g);
      if (match) {
        // Look through extracted number chunks
        for (const numStr of match) {
          const val = parseInt(numStr, 10);
          // Only consider numbers in reasonable receipt sequence range (>= 1000 and <= 999999)
          if (!isNaN(val) && val >= 1000 && val < 10000000) {
            if (val > maxFound) {
              maxFound = val;
            }
          }
        }
      }
    }
  }

  return (maxFound + 1).toString();
}

/**
 * Calculates the next auto-incrementing Against The Bill Receipt Number (बिलाच्या विरोधातील जमा पावती क्र.).
 * User rule: baseline is 1078 (existing records), next new entry starts from 1079, 1080...
 */
export function getNextAgainstBillReceiptNumber(
  billReceipts: BillReceiptEntry[] = [],
  transactions: TransactionEntry[] = []
): string {
  const BASELINE_AGAINST_BILL_RECEIPT = 1078;
  let maxFound = BASELINE_AGAINST_BILL_RECEIPT;

  if (Array.isArray(billReceipts)) {
    for (const r of billReceipts) {
      if (!r.receiptNo) continue;
      const match = r.receiptNo.match(/(\d+)/g);
      if (match) {
        for (const numStr of match) {
          const val = parseInt(numStr, 10);
          if (!isNaN(val) && val >= 1000 && val < 10000000) {
            if (val > maxFound) {
              maxFound = val;
            }
          }
        }
      }
    }
  }

  // Also check if any transaction invoices have receipt numbers
  if (Array.isArray(transactions)) {
    for (const tx of transactions) {
      if (!tx.invoiceNo) continue;
      if (tx.invoiceNo.startsWith('REC-') || tx.invoiceNo.startsWith('RCP-') || tx.itemDetails?.toLowerCase().includes('settlement')) {
        const match = tx.invoiceNo.match(/(\d+)/g);
        if (match) {
          for (const numStr of match) {
            const val = parseInt(numStr, 10);
            if (!isNaN(val) && val >= 1000 && val < 10000000) {
              if (val > maxFound) {
                maxFound = val;
              }
            }
          }
        }
      }
    }
  }

  return (maxFound + 1).toString();
}

/**
 * Calculates the next auto-incrementing Bill / Invoice Number (विक्री बिल नंबर).
 * User rules:
 * - Regular bill: baseline is 3848, next is 3849, then 3850...
 * - Bajaj Finserv bill: baseline is B-200, next is B-201, then B-202...
 */
export function getNextBillNumber(
  transactions: TransactionEntry[],
  series: 'regular' | 'bajaj' = 'regular'
): string {
  if (series === 'bajaj') {
    const BASELINE_BAJAJ = 200;
    let maxBajaj = BASELINE_BAJAJ;

    if (Array.isArray(transactions)) {
      for (const tx of transactions) {
        if (!tx.invoiceNo) continue;
        const upper = tx.invoiceNo.trim().toUpperCase();
        if (upper.startsWith('B-') || upper.startsWith('BAJAJ-') || upper.startsWith('B')) {
          const digits = upper.replace(/[^0-9]/g, '');
          if (digits) {
            const val = parseInt(digits, 10);
            if (!isNaN(val) && val >= 100 && val < 100000) {
              if (val > maxBajaj) {
                maxBajaj = val;
              }
            }
          }
        }
      }
    }

    return `B-${maxBajaj + 1}`;
  }

  // Regular bill
  const BASELINE_REGULAR = 3848;
  let maxRegular = BASELINE_REGULAR;

  if (Array.isArray(transactions)) {
    for (const tx of transactions) {
      if (!tx.invoiceNo) continue;
      const upper = tx.invoiceNo.trim().toUpperCase();
      // Skip bajaj series
      if (upper.startsWith('B-') || upper.startsWith('BAJAJ-')) continue;

      const digits = upper.replace(/[^0-9]/g, '');
      if (digits) {
        const val = parseInt(digits, 10);
        if (!isNaN(val) && val >= 1000 && val < 10000000) {
          if (val > maxRegular) {
            maxRegular = val;
          }
        }
      }
    }
  }

  return (maxRegular + 1).toString();
}

export interface DayWiseCollectionSummary {
  date: string;
  count: number;
  cashAmount: number;
  onlineAmount: number;
  totalAmount: number;
  commission: number; // 4%
  transactions: CardTransaction[];
}

export interface AgentEarningsSummary {
  agentName: string;
  totalCollection: number;
  commissionRate: number; // 0.04
  commissionAmount: number; // 4% of total collection
  newCardsCount: number;
  bonusPerNewCard: number; // 50
  newCardsBonus: number; // count * 50
  totalGrossEarnings: number; // commissionAmount + newCardsBonus
  advancePaid: number;
  netPayableSalary: number; // totalGrossEarnings - advancePaid
  dayWiseCollections: DayWiseCollectionSummary[];
  newCardsList: CardMember[];
  advancesList: AgentAdvance[];
}

/**
 * Calculates Agent Salary, 4% Commission, ₹50 New Card Bonus, Advances and Day-wise collection monitor.
 */
export function calculateAgentEarnings(
  agentName: string,
  allCardTransactions: CardTransaction[],
  allCardMembers: CardMember[],
  allAdvances: AgentAdvance[],
  options?: {
    startDate?: string;
    endDate?: string;
  }
): AgentEarningsSummary {
  const normAgent = (agentName || '').trim().toLowerCase();
  const isAllAgents = !normAgent || normAgent === 'all' || normAgent === 'सर्व प्रतिनिधी';

  // 1. Filter Transactions by Agent and Date
  const filteredTxs = (allCardTransactions || []).filter((tx) => {
    if (tx.type !== 'WeeklyPayment') return false;
    if (!isAllAgents) {
      const txAgent = (tx.agentName || '').trim().toLowerCase();
      if (txAgent !== normAgent) return false;
    }
    if (options?.startDate && tx.date < options.startDate) return false;
    if (options?.endDate && tx.date > options.endDate) return false;
    return true;
  });

  // Total Collection
  const totalCollection = filteredTxs.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  const commissionAmount = Math.round(totalCollection * 0.04);

  // 2. Filter New Cards registered by Agent
  const newCardsList = (allCardMembers || []).filter((m) => {
    if (!isAllAgents) {
      const memberAgent = (m.agentName || '').trim().toLowerCase();
      if (memberAgent !== normAgent) return false;
    }
    if (options?.startDate && m.joiningDate < options.startDate) return false;
    if (options?.endDate && m.joiningDate > options.endDate) return false;
    return true;
  });

  const newCardsCount = newCardsList.length;
  const newCardsBonus = newCardsCount * 50;
  const totalGrossEarnings = commissionAmount + newCardsBonus;

  // 3. Filter Advances
  const advancesList = (allAdvances || []).filter((adv) => {
    if (!isAllAgents) {
      const advAgent = (adv.agentName || '').trim().toLowerCase();
      if (advAgent !== normAgent) return false;
    }
    if (options?.startDate && adv.date < options.startDate) return false;
    if (options?.endDate && adv.date > options.endDate) return false;
    return true;
  });

  const advancePaid = advancesList.reduce((sum, adv) => sum + (Number(adv.amount) || 0), 0);
  const netPayableSalary = totalGrossEarnings - advancePaid;

  // 4. Group by Day for Realtime Day-wise Monitor
  const dayGroups: { [date: string]: CardTransaction[] } = {};
  for (const tx of filteredTxs) {
    const d = tx.date || 'Unknown';
    if (!dayGroups[d]) dayGroups[d] = [];
    dayGroups[d].push(tx);
  }

  const dayWiseCollections: DayWiseCollectionSummary[] = Object.keys(dayGroups)
    .sort((a, b) => b.localeCompare(a)) // Latest date first
    .map((date) => {
      const txs = dayGroups[date];
      let cash = 0;
      let online = 0;
      let tot = 0;
      for (const t of txs) {
        const amt = Number(t.amount) || 0;
        tot += amt;
        if (t.paymentMode === 'Online') {
          online += amt;
        } else {
          cash += amt;
        }
      }
      return {
        date,
        count: txs.length,
        cashAmount: cash,
        onlineAmount: online,
        totalAmount: tot,
        commission: Math.round(tot * 0.04),
        transactions: txs,
      };
    });

  return {
    agentName: isAllAgents ? 'All Agents (सर्व प्रतिनिधी)' : agentName,
    totalCollection,
    commissionRate: 0.04,
    commissionAmount,
    newCardsCount,
    bonusPerNewCard: 50,
    newCardsBonus,
    totalGrossEarnings,
    advancePaid,
    netPayableSalary,
    dayWiseCollections,
    newCardsList,
    advancesList,
  };
}
