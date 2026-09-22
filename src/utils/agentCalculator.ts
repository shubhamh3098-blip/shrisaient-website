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

/**
 * Returns distinct list of villages from card members.
 */
export function getDistinctVillages(cardMembers: CardMember[] = []): string[] {
  const villages = new Set<string>();
  cardMembers.forEach((m) => {
    if (m.village && m.village.trim().length > 0) {
      villages.add(m.village.trim());
    }
  });
  return Array.from(villages).sort((a, b) => a.localeCompare(b));
}

export interface AgentPeriodStats {
  agentName: string;
  villageName?: string;
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

export interface VillageSummary {
  village: string;
  totalMembers: number;
  activeCards: number;
  totalCollection: number;
  collectionCount: number;
  commission: number;
  newCardsCount: number;
  agentBreakdown: { agentName: string; count: number; amount: number }[];
}

/**
 * Compute stats for a specific date (or range), agent, and optional village.
 */
export function getAgentDailyStats(
  agentName: string, // 'all' or specific name
  dateStr: string, // 'YYYY-MM-DD'
  cardTransactions: CardTransaction[] = [],
  cardMembers: CardMember[] = [],
  agentAdvances: AgentAdvanceEntry[] = [],
  villageFilter: string = 'all' // 'all' or specific village name
): AgentPeriodStats {
  const isAllAgent = !agentName || agentName === 'all';
  const isAllVillage = !villageFilter || villageFilter === 'all';

  // Build member lookup map for village matching on transactions
  const memberMap = new Map<number, CardMember>();
  cardMembers.forEach((m) => {
    memberMap.set(m.cardNumber, m);
  });

  // Filter transactions
  const txs = cardTransactions.filter((tx) => {
    const matchesDate = tx.date === dateStr;
    const matchesAgent = isAllAgent || (tx.agentName && tx.agentName.trim().toLowerCase() === agentName.trim().toLowerCase());
    const isCollection = tx.type === 'WeeklyPayment' || !tx.type || tx.type === 'Fee';
    
    // Check village match
    let matchesVillage = true;
    if (!isAllVillage) {
      const member = memberMap.get(tx.cardNumber);
      const memberVillage = member?.village?.trim().toLowerCase() || '';
      matchesVillage = memberVillage === villageFilter.trim().toLowerCase();
    }

    return matchesDate && matchesAgent && isCollection && matchesVillage;
  });

  const totalCollection = txs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const collectionCount = txs.length;
  const commissionAmount = Math.round(totalCollection * COMMISSION_RATE);

  // Filter new cards opened on that day
  const newCards = cardMembers.filter((m) => {
    const matchesDate = m.joiningDate === dateStr;
    const matchesAgent = isAllAgent || (m.agentName && m.agentName.trim().toLowerCase() === agentName.trim().toLowerCase());
    const matchesVillage = isAllVillage || (m.village && m.village.trim().toLowerCase() === villageFilter.trim().toLowerCase());
    return matchesDate && matchesAgent && matchesVillage;
  });

  const newCardsCount = newCards.length;
  const cardBonusAmount = newCardsCount * CARD_BONUS_RATE;
  const grossEarnings = commissionAmount + cardBonusAmount;

  // Filter advances given on that day (advances belong to agent, unaffected by village unless viewing specific village where advances remain at agent level)
  const advances = isAllVillage ? agentAdvances.filter((adv) => {
    const matchesDate = adv.date === dateStr;
    const matchesAgent = isAllAgent || (adv.agentName && adv.agentName.trim().toLowerCase() === agentName.trim().toLowerCase());
    return matchesDate && matchesAgent;
  }) : [];

  const advancesAmount = advances.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
  const netPayable = grossEarnings - advancesAmount;

  return {
    agentName: isAllAgent ? 'All Agents' : agentName,
    villageName: isAllVillage ? 'All Villages' : villageFilter,
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
 * Compute monthly summary breakdown with day-by-day rows for an agent and optional village.
 */
export function getAgentMonthlyStats(
  agentName: string,
  yearMonth: string, // 'YYYY-MM'
  cardTransactions: CardTransaction[] = [],
  cardMembers: CardMember[] = [],
  agentAdvances: AgentAdvanceEntry[] = [],
  villageFilter: string = 'all'
): {
  monthLabel: string;
  agentName: string;
  villageName?: string;
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
  const isAllAgent = !agentName || agentName === 'all';
  const isAllVillage = !villageFilter || villageFilter === 'all';

  const memberMap = new Map<number, CardMember>();
  cardMembers.forEach((m) => {
    memberMap.set(m.cardNumber, m);
  });

  // Gather all unique dates in that month that have activity
  const datesSet = new Set<string>();

  cardTransactions.forEach((t) => {
    if (t.date && t.date.startsWith(yearMonth)) {
      const matchesAgent = isAllAgent || (t.agentName && t.agentName.trim().toLowerCase() === agentName.trim().toLowerCase());
      let matchesVillage = true;
      if (!isAllVillage) {
        const mem = memberMap.get(t.cardNumber);
        matchesVillage = (mem?.village?.trim().toLowerCase() || '') === villageFilter.trim().toLowerCase();
      }
      if (matchesAgent && matchesVillage) {
        datesSet.add(t.date);
      }
    }
  });

  cardMembers.forEach((m) => {
    if (m.joiningDate && m.joiningDate.startsWith(yearMonth)) {
      const matchesAgent = isAllAgent || (m.agentName && m.agentName.trim().toLowerCase() === agentName.trim().toLowerCase());
      const matchesVillage = isAllVillage || (m.village && m.village.trim().toLowerCase() === villageFilter.trim().toLowerCase());
      if (matchesAgent && matchesVillage) {
        datesSet.add(m.joiningDate);
      }
    }
  });

  if (isAllVillage) {
    agentAdvances.forEach((a) => {
      if (a.date && a.date.startsWith(yearMonth)) {
        if (isAllAgent || (a.agentName && a.agentName.trim().toLowerCase() === agentName.trim().toLowerCase())) {
          datesSet.add(a.date);
        }
      }
    });
  }

  const sortedDates = Array.from(datesSet).sort();

  const dayRows: DayRowSummary[] = sortedDates.map((dateStr) => {
    const stats = getAgentDailyStats(agentName, dateStr, cardTransactions, cardMembers, agentAdvances, villageFilter);
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

  const advancesList = isAllVillage
    ? agentAdvances.filter((a) => {
        const matchesMonth = a.date && a.date.startsWith(yearMonth);
        const matchesAgent = isAllAgent || (a.agentName && a.agentName.trim().toLowerCase() === agentName.trim().toLowerCase());
        return matchesMonth && matchesAgent;
      })
    : [];

  const totalAdvances = advancesList.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
  const netPayable = totalGross - totalAdvances;

  return {
    monthLabel: yearMonth,
    agentName: isAllAgent ? 'All Agents' : agentName,
    villageName: isAllVillage ? 'All Villages' : villageFilter,
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
 * Returns village-by-village summaries with members count, collection, commission and agent breakdown.
 */
export function getVillageWiseSummaries(
  cardMembers: CardMember[] = [],
  cardTransactions: CardTransaction[] = [],
  dateOrMonthFilter?: { type: 'daily' | 'monthly' | 'all'; value: string }
): VillageSummary[] {
  const memberMap = new Map<number, CardMember>();
  cardMembers.forEach((m) => {
    memberMap.set(m.cardNumber, m);
  });

  // Unique villages
  const distinctVillages = getDistinctVillages(cardMembers);
  if (distinctVillages.length === 0) {
    distinctVillages.push('सामान्य / इतर');
  }

  return distinctVillages.map((villageName) => {
    const vMembers = cardMembers.filter((m) => (m.village?.trim() || 'सामान्य / इतर') === villageName);
    const activeCards = vMembers.filter((m) => m.status !== 'Closed').length;

    // Filter transactions for this village
    const vTxs = cardTransactions.filter((tx) => {
      const isCollection = tx.type === 'WeeklyPayment' || !tx.type || tx.type === 'Fee';
      if (!isCollection) return false;
      const mem = memberMap.get(tx.cardNumber);
      const memVillage = mem?.village?.trim() || 'सामान्य / इतर';
      if (memVillage !== villageName) return false;

      if (!dateOrMonthFilter || dateOrMonthFilter.type === 'all') return true;
      if (dateOrMonthFilter.type === 'daily') {
        return tx.date === dateOrMonthFilter.value;
      }
      if (dateOrMonthFilter.type === 'monthly') {
        return tx.date && tx.date.startsWith(dateOrMonthFilter.value);
      }
      return true;
    });

    const totalCollection = vTxs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const collectionCount = vTxs.length;
    const commission = Math.round(totalCollection * COMMISSION_RATE);

    // Filter new cards in this village during period
    const newCards = vMembers.filter((m) => {
      if (!dateOrMonthFilter || dateOrMonthFilter.type === 'all') return true;
      if (dateOrMonthFilter.type === 'daily') {
        return m.joiningDate === dateOrMonthFilter.value;
      }
      if (dateOrMonthFilter.type === 'monthly') {
        return m.joiningDate && m.joiningDate.startsWith(dateOrMonthFilter.value);
      }
      return true;
    });

    // Agent breakdown in this village
    const agentMap = new Map<string, { count: number; amount: number }>();
    vTxs.forEach((t) => {
      const ag = t.agentName?.trim() || 'Unknown Agent';
      const existing = agentMap.get(ag) || { count: 0, amount: 0 };
      existing.count += 1;
      existing.amount += Number(t.amount) || 0;
      agentMap.set(ag, existing);
    });

    const agentBreakdown = Array.from(agentMap.entries()).map(([agentName, data]) => ({
      agentName,
      count: data.count,
      amount: data.amount,
    }));

    return {
      village: villageName,
      totalMembers: vMembers.length,
      activeCards,
      totalCollection,
      collectionCount,
      commission,
      newCardsCount: newCards.length,
      agentBreakdown,
    };
  }).sort((a, b) => b.totalCollection - a.totalCollection);
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

/**
 * Generate formatted WhatsApp message for customer digital card passbook.
 */
export function buildCustomerPassbookWhatsAppText(
  member: CardMember,
  txs: CardTransaction[] = [],
  businessName = 'SHRI SAI ENTERPRISES'
): string {
  const totalWeeksExpected = 130; // 30 months ~ 130 weeks
  const paidWeeks = txs.filter(t => t.type === 'WeeklyPayment').length;
  const remainingWeeks = Math.max(0, totalWeeksExpected - paidWeeks);
  const totalPaid = Number(member.totalDeposited) || 0;
  const recentTxs = txs.slice(-3).reverse();

  let recentText = '';
  if (recentTxs.length > 0) {
    recentText = `\n*📜 शेवटचे जमा हप्ते:*\n` + recentTxs.map(t => `• ${t.date}: ₹${t.amount} (पावती #${t.receiptNo})`).join('\n') + `\n`;
  }

  return encodeURIComponent(
    `*${businessName}*\n` +
    `*🌟 डिजिटल बचत कार्ड पासबुक (Savings Card Passbook)*\n` +
    `--------------------------------\n` +
    `💳 कार्ड नंबर: *#${member.cardNumber}*\n` +
    `👤 ग्राहक नाव: *${member.customerName}*\n` +
    `🏡 गाव/पत्ता: *${member.village || 'Wardha'}*\n` +
    `📅 सामील तारीख: *${member.joiningDate}*\n` +
    `👤 एजंट: *${member.agentName || 'Shri Sai Staff'}*\n` +
    `--------------------------------\n` +
    `💰 एकूण जमा रक्कम: *₹${totalPaid.toLocaleString()}*\n` +
    `🗓️ एकूण भरलेले हप्ते: *${paidWeeks} आठवडे*\n` +
    `⏳ उर्वरित हप्ते: *${remainingWeeks} आठवडे*\n` +
    `📊 प्रगती (Status): *${member.status === 'Completed' ? '✅ पूर्ण (Completed)' : '🔄 चालू (Active)'}*\n` +
    `--------------------------------` +
    recentText +
    `--------------------------------\n` +
    `🚚 सर्व मोठ्या इलेक्ट्रॉनिक्स व फर्निचर वस्तूंवर *फ्री होम डिलिव्हरी!*\n` +
    `📞 संपर्क: 8766486915 / 8600122798\n` +
    `_श्री साई इंटरप्राइजेस, आर्वी रोड, पंजाब कॉलनी, वर्धा_`
  );
}

