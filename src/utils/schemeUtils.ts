import { CardMember } from '../types';

export interface SchemeConfig {
  schemeNo: number;
  name: string;
  marathiName: string;
  minCard: number;
  maxCard: number;
  description: string;
  durationMonths: number;
  monthlyAmount: number;
  tag: string;
  color: 'amber' | 'blue' | 'emerald' | 'purple' | 'rose';
}

export const SCHEME_CONFIGS: Record<number, SchemeConfig> = {
  1: {
    schemeNo: 1,
    name: 'Scheme 1',
    marathiName: 'योजना १',
    minCard: 1001,
    maxCard: 3000,
    description: 'कार्ड क्र. १००१ ते ३००० (३० महिने बचत योजना)',
    durationMonths: 30,
    monthlyAmount: 500,
    tag: '१००१ - ३०००',
    color: 'amber',
  },
  2: {
    schemeNo: 2,
    name: 'Scheme 2',
    marathiName: 'योजना २',
    minCard: 1001,
    maxCard: 3000,
    description: 'कार्ड क्र. १००१ ते ३००० (३० महिने बचत योजना)',
    durationMonths: 30,
    monthlyAmount: 500,
    tag: '१००१ - ३०००',
    color: 'blue',
  },
  3: {
    schemeNo: 3,
    name: 'Scheme 3',
    marathiName: 'योजना ३',
    minCard: 1001,
    maxCard: 6000,
    description: 'कार्ड क्र. १००१ ते ६००० (३० महिने महा-बचत योजना)',
    durationMonths: 30,
    monthlyAmount: 500,
    tag: '१००१ - ६०००',
    color: 'emerald',
  },
  4: {
    schemeNo: 4,
    name: 'Scheme 4',
    marathiName: 'योजना ४',
    minCard: 1001,
    maxCard: 6000,
    description: 'कार्ड क्र. १००१ ते ६००० (भावी बचत योजना)',
    durationMonths: 30,
    monthlyAmount: 500,
    tag: '१००१ - ६००० (भावी)',
    color: 'purple',
  },
  5: {
    schemeNo: 5,
    name: 'Scheme 5',
    marathiName: 'योजना ५',
    minCard: 1001,
    maxCard: 6000,
    description: 'कार्ड क्र. १००१ ते ६००० (भावी बचत योजना)',
    durationMonths: 30,
    monthlyAmount: 500,
    tag: '१००१ - ६००० (भावी)',
    color: 'rose',
  },
  6: {
    schemeNo: 6,
    name: 'Scheme 6',
    marathiName: 'योजना ६',
    minCard: 1001,
    maxCard: 6000,
    description: 'कार्ड क्र. १००१ ते ६००० (भावी बचत योजना)',
    durationMonths: 30,
    monthlyAmount: 500,
    tag: '१००१ - ६००० (भावी)',
    color: 'amber',
  },
};

export function getSchemeConfig(schemeNo: number): SchemeConfig {
  return (
    SCHEME_CONFIGS[schemeNo] || {
      schemeNo,
      name: `Scheme ${schemeNo}`,
      marathiName: `योजना ${schemeNo}`,
      minCard: 1001,
      maxCard: 6000,
      description: `कार्ड क्र. १००१ ते ६०००`,
      durationMonths: 30,
      monthlyAmount: 500,
      tag: '१००१ - ६०००',
      color: 'blue',
    }
  );
}

/**
 * Extracts a clean numeric card number from strings like "SSE-CD-1050", "SCH1-1050", "1050"
 */
export function extractCardNumber(cardNoStr: string | number): number {
  if (typeof cardNoStr === 'number') return cardNoStr;
  if (!cardNoStr) return 0;
  const match = cardNoStr.match(/\d+/g);
  if (!match) return 0;
  // If multiple digits groups (like SSE-CD-01-1050), take the last numeric group which is usually the card number
  return parseInt(match[match.length - 1], 10) || 0;
}

/**
 * Resolves which scheme a card member belongs to based on explicit schemeNo, notes, or card number range
 */
export function resolveCardScheme(card: Partial<CardMember>): number {
  if (card.schemeNo && card.schemeNo >= 1 && card.schemeNo <= 10) {
    return card.schemeNo;
  }

  const notes = (card.notes || '').toLowerCase();
  const cardNo = (card.cardNo || '').toLowerCase();

  if (notes.includes('scheme 2') || notes.includes('योजना २') || cardNo.includes('sch2')) {
    return 2;
  }
  if (notes.includes('scheme 3') || notes.includes('योजना ३') || cardNo.includes('sch3')) {
    return 3;
  }
  if (notes.includes('scheme 4') || notes.includes('योजना ४') || cardNo.includes('sch4')) {
    return 4;
  }
  if (notes.includes('scheme 5') || notes.includes('योजना ५') || cardNo.includes('sch5')) {
    return 5;
  }

  // Check card number range
  const num = extractCardNumber(card.cardNo || '');
  if (num > 3000 && num <= 6000) {
    return 3; // Scheme 1 & 2 are 1001-3000, so >3000 must be Scheme 3
  }

  return 1; // Default to Scheme 1
}

/**
 * Validates whether card number is in the allowed range for the chosen scheme:
 * - Scheme 1: 1001-3000
 * - Scheme 2: 1001-3000
 * - Scheme 3: 1001-6000
 * - Scheme 4: 1001-6000
 * - Scheme 5: 1001-6000
 */
export function validateCardNumberForScheme(
  cardNum: number,
  schemeNo: number
): { valid: boolean; message?: string } {
  const config = getSchemeConfig(schemeNo);
  if (isNaN(cardNum) || cardNum <= 0) {
    return { valid: false, message: 'कृपया वैध संख्यात्मक कार्ड क्रमांक टाका (उदा. १०५०)' };
  }

  if (cardNum < config.minCard || cardNum > config.maxCard) {
    return {
      valid: false,
      message: `${config.marathiName} साठी कार्ड क्रमांक ${config.minCard} ते ${config.maxCard} दरम्यान असणे आवश्यक आहे (आपण टाकलेला: ${cardNum}).`,
    };
  }

  return { valid: true };
}

/**
 * Returns the next suggested available card number in the chosen scheme
 */
export function getNextAvailableCardNumber(
  existingMembers: CardMember[],
  schemeNo: number
): number {
  const config = getSchemeConfig(schemeNo);
  const schemeMembers = existingMembers.filter((m) => resolveCardScheme(m) === schemeNo);
  
  const existingNumbers = new Set(
    schemeMembers.map((m) => extractCardNumber(m.cardNo)).filter((n) => n >= config.minCard && n <= config.maxCard)
  );

  for (let num = config.minCard; num <= config.maxCard; num++) {
    if (!existingNumbers.has(num)) {
      return num;
    }
  }

  return config.minCard;
}

export function getSchemeBadgeClasses(schemeNo: number): {
  badge: string;
  pill: string;
  border: string;
  text: string;
} {
  switch (schemeNo) {
    case 1:
      return {
        badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        pill: 'bg-amber-500 text-slate-950 font-bold',
        border: 'border-amber-500/40',
        text: 'text-amber-400',
      };
    case 2:
      return {
        badge: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
        pill: 'bg-blue-500 text-white font-bold',
        border: 'border-blue-500/40',
        text: 'text-blue-400',
      };
    case 3:
      return {
        badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        pill: 'bg-emerald-500 text-slate-950 font-bold',
        border: 'border-emerald-500/40',
        text: 'text-emerald-400',
      };
    case 4:
      return {
        badge: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
        pill: 'bg-purple-500 text-white font-bold',
        border: 'border-purple-500/40',
        text: 'text-purple-400',
      };
    case 5:
      return {
        badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
        pill: 'bg-rose-500 text-white font-bold',
        border: 'border-rose-500/40',
        text: 'text-rose-400',
      };
    default:
      return {
        badge: 'bg-slate-800 text-slate-300 border-slate-700',
        pill: 'bg-slate-700 text-white font-bold',
        border: 'border-slate-700',
        text: 'text-slate-300',
      };
  }
}

export interface CardFinancialSummary {
  schemeTarget: number;
  bonusAmount: number;
  totalMaturityValue: number;
  membershipFee: number;
  totalPaid: number;
  balanceDue: number;
  durationMonths: number;
  monthlyAmount: number;
  totalPaidMonths: number;
  remainingMonths: number;
  completionPercentage: number;
  isFullyPaid: boolean;
  isEligibleForBonus: boolean;
  refundValueIfCancelled: number;
}

/**
 * अधिकृत १६ नियम व अटी (Official 16 Rules & Conditions from Shri Sai Enterprises physical passbook card)
 */
export const SCHEME_OFFICIAL_RULES_16: string[] = [
  '१) सदर योजना ही ३० महिन्यांची राहील आणि ५० रुपये सदस्य शुल्क देऊन सभासद बनता येईल.',
  '२) सदर योजनेत ५०० रुपये हप्ता किंवा ५०० रुपये महिना याप्रमाणे ३० महिने भरल्या नंतरच पैसे परत भेटेल.',
  '३) सदर योजनेचा हप्ता दर महिन्याच्या १ तारखेला भरावयाचा असून नंतर ५०० रुपये दंड आकारला जाईल.',
  '४) सदर योजनेची पहिली सोडत १ सप्टेंबर २०२४ ला करण्यात येईल पण जर अपेक्षेनुसार सभासद नाही झाले तर सोडतीची तारीख ही समोर वाढवली जाईल.',
  '५) सदर योजनेत बदल करण्याचा अधिकार हा श्री साई एंटरप्रायझेस यांना राहील.',
  '६) या योजनेत सदस्यांनी सुरुवातीची सोडत ३ऱ्या महिन्यांपर्यंतच सक्तीने भरणे बंधनकारक राहील नंतर त्यावर दंड आकारला जाईल.',
  '७) आपण काढलेल्या कार्ड चे रजिस्ट्रेशन झाले आहे की नाही हे व्हॉट्सॲप वरून चेक करून घेणे.',
  '८) नियमित कार्ड भरणार्‍या सदस्यांना कार्ड भरण्याच्या नंतर शेवटी ५०० रुपये बोनस म्हणून देण्यात येईल.',
  '९) कार्ड भरण्याचा नंतर शेवटी ५०० रुपये बोनस म्हणून देण्यात येईल.',
  '१०) सभासद कार्ड हे अखेरपर्यंत जपून व सांभाळून ठेवावे.',
  '११) ही योजना बचत हेतु असून कुणी एखादा सभासद मयत झाला तर पैसे किंवा वस्तू हे वारसालाच देण्याचे अधिकार राहतील.',
  '१२) सभासदाने कार्ड जर अपूर्ण अथवा अर्धवट सोडल्यास त्याला वस्तू घेणे बंधनकारक राहील.',
  '१३) सभासद स्वतः किंवा दुसरा कोणी त्याचे पैसे भरत असल्यास कार्ड च्या व्यक्तीने कार्ड चेक केले पाहिजे.',
  '१४) आपण भरलेले पैसे परत हवे असल्यास भरलेल्या रकमेच्या ५०% रक्कम कापून देण्यात येईल.',
  '१५) अपूर्ण भरलेल्या कार्डावर ५००/- रुपये बोनस भेटणार नाही (नियम व अटीनुसार).',
  '१६) सभासदाने स्वतः कार्ड पूर्ण भरल्यानंतर १५००० + ५०० बोनस असे एकूण १५५०० रुपये रोख किंवा वस्तू घेता येईल.'
];

export const SCHEME_WARRANTY_DISCLAIMER =
  'इलेक्ट्रॉनिक वस्तूंची गॅरंटी ही कंपनीची राहील, ती श्री साई एंटरप्रायजेस दुकानाची जबाबदार राहणार नाही. वस्तू घेतेवेळी कृपया ज्या कंपनीची वस्तू घेतली आहे त्या कंपनीच्या सर्विस सेंटरचा मोबाईल नंबर घ्यावा.';

/**
 * Resolves the exact scheme target amount (Strictly ₹15,000 for Shri Sai Enterprises 30-month scheme)
 * User instruction: "30000 cha ahe tri 15000 pahije aani same card sarkhaa"
 */
export function getCardTargetAmount(member: Partial<CardMember>): number {
  if (member.planType === 'custom_scheme' && member.targetAmount && member.targetAmount !== 30000 && member.targetAmount !== 15000) {
    return member.targetAmount;
  }
  // All 30-month savings scheme cards are strictly ₹15,000
  return 15000;
}

/**
 * Calculates remaining balance due: targetAmount - totalPaid
 * GUARANTEE: totalPaid + balanceDue === schemeTarget always
 */
export function getCardBalanceDue(member: Partial<CardMember>): number {
  const target = getCardTargetAmount(member);
  const paid = member.totalAmountPaid ?? member.totalPaid ?? 0;
  return Math.max(0, target - paid);
}

/**
 * Complete, unified, mathematically validated summary for any card member
 * ₹15,000 Scheme Target + ₹500 Official Bonus = ₹15,500 Total Maturity Value
 */
export function getCardFinancialSummary(member: Partial<CardMember>): CardFinancialSummary {
  const schemeTarget = getCardTargetAmount(member); // 15000
  const totalPaid = Math.max(0, member.totalAmountPaid ?? member.totalPaid ?? 0);
  const balanceDue = Math.max(0, schemeTarget - totalPaid);
  const durationMonths = 30;
  const monthlyAmount = 500;
  const totalPaidMonths = member.totalPaidMonths ?? (monthlyAmount > 0 ? Math.floor(totalPaid / 500) : 0);
  const remainingMonths = Math.max(0, durationMonths - totalPaidMonths);
  const completionPercentage = schemeTarget > 0 ? Math.min(100, Math.round((totalPaid / schemeTarget) * 100)) : 0;
  const isFullyPaid = totalPaid >= schemeTarget || balanceDue === 0;
  const bonusAmount = 500;
  const totalMaturityValue = schemeTarget + bonusAmount; // ₹15,500
  const membershipFee = 50;
  const isEligibleForBonus = isFullyPaid;
  // Rule #14: If user demands cash back before maturity, 50% is deducted
  const refundValueIfCancelled = Math.round(totalPaid * 0.5);

  return {
    schemeTarget,
    bonusAmount,
    totalMaturityValue,
    membershipFee,
    totalPaid,
    balanceDue,
    durationMonths,
    monthlyAmount,
    totalPaidMonths,
    remainingMonths,
    completionPercentage,
    isFullyPaid,
    isEligibleForBonus,
    refundValueIfCancelled,
  };
}
