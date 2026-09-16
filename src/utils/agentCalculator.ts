import { CardMember, CardTransaction, StaffMember, AgentAdvanceEntry, AgentDaySummary } from '../types';

export const COMMISSION_RATE = 0.04; // 4%
export const CARD_BONUS_RATE = 50; // ₹50 per new card

/**
 * Returns distinct list of agent names from members, transactions, and staff.
 */
export function getDistinctAgents(
  cardMembers: CardMember[] = [],
  cardTransactions: CardTransaction[] = [],
  staff: StaffMember[] = []
): string[] {
  const fromMembers = cardMembers
    .map((m) => m.agentName?.trim())
    .filter((a): a is string => Boolean(a && a.length > 0));

  const fromTxs = cardTransactions
    .map((t) => t.agentName?.trim())
    .filter((a): a is string => Boolean(a && a.length > 0));

  const fromStaff = staff.map((s) => s.name?.trim()).filter(Boolean);

  const defaults = ['Rahul Sharma', 'Sachin Deshmukh', 'Pooja Patil'];
  const merged = Array.from(new Set([...defaults, ...fromStaff, ...fromMembers, ...fromTxs]));
  return merged.sort((a, b) => a.localeCompare(b));
}

export interface AgentPeriodStats {
  agentName: string;
  periodLabel: string;
  totalCollection: number;
  collectionCount: number;
  commissionRate: number;
  commissionAmount: number;
  newCardsCount: number;
  cardBonusRate: number;
  cardBonusAmount: number;
  grossEarnings: number;
  advancesAmount: number;
  netPayable: number;
  transactions: CardTransaction[];
  newCards: CardMember[];
  advances: AgentAdvanceEntry[];
}

/**
 * Compute stats for a specific date (or range) and agent.
 */
export function getAgentDailyStats(
  agentName: string, // 'all' or specific name
  dateStr: string, // 'YYYY-MM-DD'
  cardTransactions: CardTransaction[] = [],
  cardMembers: CardMember[] = [],
  agentAdvances: AgentAdvanceEntry[] = []
): AgentPeriodStats {
  const isAll = !agentName || agentName === 'all';

  // Filter transactions
  const txs = cardTransactions.filter((tx) => {
    const matchesDate = tx.date === dateStr;
    const matchesAgent = isAll || (tx.agentName && tx.agentName.trim().toLowerCase() === agentName.trim().toLowerCase());
    const isCollection = tx.type === 'WeeklyPayment' || !tx.type || tx.type === 'Fee';
    return matchesDate && matchesAgent && isCollection;
  });

  const totalCollection = txs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const collectionCount = txs.length;
  const commissionAmount = Math.round(totalCollection * COMMISSION_RATE);

  // Filter new cards opened on that day
  const newCards = cardMembers.filter((m) => {
    const matchesDate = m.joiningDate === dateStr;
    const matchesAgent = isAll || (m.agentName && m.agentName.trim().toLowerCase() === agentName.trim().toLowerCase());
    return matchesDate && matchesAgent;
  });

  const newCardsCount = newCards.length;
  const cardBonusAmount = newCardsCount * CARD_BONUS_RATE;
  const grossEarnings = commissionAmount + cardBonusAmount;

  // Filter advances given on that day
  const advances = agentAdvances.filter((adv) => {
    const matchesDate = adv.date === dateStr;
    const matchesAgent = isAll || (adv.agentName && adv.agentName.trim().toLowerCase() === agentName.trim().toLowerCase());
    return matchesDate && matchesAgent;
  });

  const advancesAmount = advances.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
  const netPayable = grossEarnings - advancesAmount;

  return {
    agentName: isAll ? 'All Agents' : agentName,
    periodLabel: dateStr,
    totalCollection,
    collectionCount,
    commissionRate: COMMISSION_RATE,
    commissionAmount,
    newCardsCount,
    cardBonusRate: CARD_BONUS_RATE,
    cardBonusAmount,
    grossEarnings,
    advancesAmount,
    netPayable,
    transactions: txs,
    newCards,
    advances,
  };
}

export interface DayRowSummary {
  date: string;
  collection: number;
  txCount: number;
  commission: number;
  newCards: number;
  cardBonus: number;
  gross: number;
  advances: number;
  net: number;
}

/**
 * Compute monthly summary breakdown with day-by-day rows for an agent.
 */
export function getAgentMonthlyStats(
  agentName: string,
  yearMonth: string, // 'YYYY-MM'
  cardTransactions: CardTransaction[] = [],
  cardMembers: CardMember[] = [],
  agentAdvances: AgentAdvanceEntry[] = []
): {
  monthLabel: string;
  agentName: string;
  totalCollection: number;
  totalCommission: number;
  totalNewCards: number;
  totalCardBonus: number;
  totalGross: number;
  totalAdvances: number;
  netPayable: number;
  dayRows: DayRowSummary[];
  advancesList: AgentAdvanceEntry[];
} {
  const isAll = !agentName || agentName === 'all';

  // Gather all unique dates in that month that have activity
  const datesSet = new Set<string>();

  cardTransactions.forEach((t) => {
    if (t.date && t.date.startsWith(yearMonth)) {
      if (isAll || (t.agentName && t.agentName.trim().toLowerCase() === agentName.trim().toLowerCase())) {
        datesSet.add(t.date);
      }
    }
  });

  cardMembers.forEach((m) => {
    if (m.joiningDate && m.joiningDate.startsWith(yearMonth)) {
      if (isAll || (m.agentName && m.agentName.trim().toLowerCase() === agentName.trim().toLowerCase())) {
        datesSet.add(m.joiningDate);
      }
    }
  });

  agentAdvances.forEach((a) => {
    if (a.date && a.date.startsWith(yearMonth)) {
      if (isAll || (a.agentName && a.agentName.trim().toLowerCase() === agentName.trim().toLowerCase())) {
        datesSet.add(a.date);
      }
    }
  });

  const sortedDates = Array.from(datesSet).sort();

  const dayRows: DayRowSummary[] = sortedDates.map((dateStr) => {
    const stats = getAgentDailyStats(agentName, dateStr, cardTransactions, cardMembers, agentAdvances);
    return {
      date: dateStr,
      collection: stats.totalCollection,
      txCount: stats.collectionCount,
      commission: stats.commissionAmount,
      newCards: stats.newCardsCount,
      cardBonus: stats.cardBonusAmount,
      gross: stats.grossEarnings,
      advances: stats.advancesAmount,
      net: stats.netPayable,
    };
  });

  const totalCollection = dayRows.reduce((sum, r) => sum + r.collection, 0);
  const totalCommission = dayRows.reduce((sum, r) => sum + r.commission, 0);
  const totalNewCards = dayRows.reduce((sum, r) => sum + r.newCards, 0);
  const totalCardBonus = dayRows.reduce((sum, r) => sum + r.cardBonus, 0);
  const totalGross = dayRows.reduce((sum, r) => sum + r.gross, 0);

  const advancesList = agentAdvances.filter((a) => {
    const matchesMonth = a.date && a.date.startsWith(yearMonth);
    const matchesAgent = isAll || (a.agentName && a.agentName.trim().toLowerCase() === agentName.trim().toLowerCase());
    return matchesMonth && matchesAgent;
  });

  const totalAdvances = advancesList.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
  const netPayable = totalGross - totalAdvances;

  return {
    monthLabel: yearMonth,
    agentName: isAll ? 'All Agents' : agentName,
    totalCollection,
    totalCommission,
    totalNewCards,
    totalCardBonus,
    totalGross,
    totalAdvances,
    netPayable,
    dayRows,
    advancesList,
  };
}

/**
 * Generate formatted WhatsApp message for agent daily hisab.
 */
export function buildAgentDailyWhatsAppText(
  agentName: string,
  dateStr: string,
  stats: AgentPeriodStats,
  businessName = 'SHRI SAI ENTERPRISES'
): string {
  return encodeURIComponent(
    `*${businessName}*\n` +
    `*📋 एजंट दैनिक हिशोब पावती (Daily Agent Hisab)*\n` +
    `--------------------------------\n` +
    `👤 एजंट: *${agentName}*\n` +
    `📅 तारीख: *${dateStr}*\n` +
    `--------------------------------\n` +
    `💰 आजचे एकूण कलेक्शन: *₹${stats.totalCollection.toLocaleString()}* (${stats.collectionCount} पावत्या)\n` +
    `✨ ४% कलेक्शन कमिशन: *₹${stats.commissionAmount.toLocaleString()}*\n` +
    `💳 नवीन कार्ड्स जोडले: *${stats.newCardsCount}* (₹50/कार्ड)\n` +
    `🎁 कार्ड इन्सेंटिव्ह बोनस: *₹${stats.cardBonusAmount.toLocaleString()}*\n` +
    `--------------------------------\n` +
    `💵 एकूण कमाई (Gross Earnings): *₹${stats.grossEarnings.toLocaleString()}*\n` +
    (stats.advancesAmount > 0 ? `🔻 आज घेतलेला अॅडव्हान्स: *₹${stats.advancesAmount.toLocaleString()}*\n` : '') +
    `--------------------------------\n` +
    `🎯 *निव्वळ देय रक्कम (Net Payable): ₹${stats.netPayable.toLocaleString()}*\n` +
    `--------------------------------\n` +
    `_श्री साई इंटरप्राइजेस, वर्धा • रिअल-टाइम सिंक प्रणाली_`
  );
}
