export type FinancePartnerId = 'bajaj' | 'tvs' | 'idbi' | 'hdb' | 'custom';

export interface FinancePartner {
  id: FinancePartnerId;
  name: string;
  marathiName: string;
  tagline: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  defaultProcessingFee: number;
  supportedSchemes: string[]; // e.g. ['8/2', '10/2', '12/4', '16/4', '6m', '12m']
  description: string;
  contactHelpline?: string;
}

export interface FinanceSchemePreset {
  id: string;
  name: string;
  marathiName: string;
  tenureMonths: number;
  advanceEmis: number;
  isNoCost: boolean;
  defaultInterestRate: number; // annual %
  description: string;
}

export interface FinanceCalculationInput {
  partnerId: FinancePartnerId;
  productName: string;
  productPrice: number;
  schemeId: string;
  tenureMonths: number;
  advanceEmis: number;
  isNoCost: boolean;
  interestRate: number; // annual %
  extraDownPayment: number;
  processingFee: number;
  dbdPercent: number; // dealer business discount / subvention %
  customerName?: string;
  customerPhone?: string;
  startDate?: string; // YYYY-MM-DD
  emiDueDay?: number; // Day of month (e.g. 2, 5, 10, 15)
}

export interface AmortizationRow {
  month: number;
  dateStr: string;
  formattedDate: string;
  isAdvance: boolean;
  emi: number;
  principal: number;
  interest: number;
  remainingBalance: number;
  status: 'paid_upfront' | 'upcoming' | 'final';
  statusMarathi: string;
  dueDay: number;
}

export interface FinanceCalculationResult {
  productPrice: number;
  tenureMonths: number;
  advanceEmis: number;
  monthlyEmi: number;
  advanceEmisTotal: number;
  totalDownPayment: number; // Advance EMIs + Extra Cash DP + Processing Fee
  loanAmount: number; // Product Price - (Advance EMIs + Extra Cash DP)
  remainingMonths: number; // tenureMonths - advanceEmis
  totalPaidByCustomer: number; // totalDownPayment + (monthlyEmi * remainingMonths)
  totalInterestPaid: number;
  totalExtraCost: number; // totalPaidByCustomer - productPrice
  netStoreDisbursal: number; // Product price - (productPrice * dbdPercent / 100)
  schedule: AmortizationRow[];
}

export const FINANCE_PARTNERS: Record<FinancePartnerId, FinancePartner> = {
  bajaj: {
    id: 'bajaj',
    name: 'Bajaj Finserv',
    marathiName: 'बजाज फायनान्स (Bajaj Finserv)',
    tagline: 'भारतातील सर्वात लोकप्रिय No-Cost EMI आणि झटपट मंजुरी',
    color: '#00529b',
    badgeBg: 'bg-blue-100 text-blue-800 border-blue-200',
    badgeText: 'Bajaj Finserv',
    defaultProcessingFee: 799,
    supportedSchemes: ['8/2', '10/2', '12/4', '16/4', '9/3', '6m', '12m'],
    description: 'बजाज ईएमआय नेटवर्क कार्ड व नवीन ग्राहकांसाठी त्वरित लोन.',
    contactHelpline: '020-71124000',
  },
  tvs: {
    id: 'tvs',
    name: 'TVS Credit',
    marathiName: 'टीव्हीएस क्रेडिट (TVS Credit)',
    tagline: 'किमान कागदपत्रांमध्ये इलेक्ट्रॉनिक्स व गृहोपयोगी वस्तूंवर हप्ता',
    color: '#d62828',
    badgeBg: 'bg-rose-100 text-rose-800 border-rose-200',
    badgeText: 'TVS Credit',
    defaultProcessingFee: 650,
    supportedSchemes: ['8/2', '10/2', '12/4', '6m', '9m', '12m'],
    description: 'ग्रामीण व शहरी भागातील ग्राहकांसाठी सोपे डाऊन पेमेंट व सुलभ हप्ते.',
    contactHelpline: '1800-103-5005',
  },
  idbi: {
    id: 'idbi',
    name: 'IDBI Bank Finance',
    marathiName: 'आयडीबीआय बँक (IDBI Bank)',
    tagline: 'कमी व्याजदर, थेट राष्ट्रीयकृत बँक ग्राहकांसाठी खात्रीशीर लोन',
    color: '#007f5f',
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    badgeText: 'IDBI Bank',
    defaultProcessingFee: 500,
    supportedSchemes: ['6m', '9m', '12m', '18m', '24m'],
    description: 'बँक खातेधारकांसाठी थेट खात्यातून ऑटो-डेबिट व पारदर्शक दर.',
    contactHelpline: '1800-209-4324',
  },
  hdb: {
    id: 'hdb',
    name: 'HDB Financial Services',
    marathiName: 'एचडीबी फायनान्शियल (HDB Financial - HDFC)',
    tagline: 'HDFC बँकेचे अधिकृत ग्राहक फायनान्स व जलद मंजुरी',
    color: '#7209b7',
    badgeBg: 'bg-purple-100 text-purple-800 border-purple-200',
    badgeText: 'HDB Financial',
    defaultProcessingFee: 850,
    supportedSchemes: ['8/2', '10/2', '12/4', '16/4', '12m', '18m'],
    description: 'टीव्ही, फ्रिज, वॉशिंग मशीन व एसी खरेदीसाठी विशेष सवलत योजना.',
    contactHelpline: '044-42984541',
  },
  custom: {
    id: 'custom',
    name: 'In-Store / Custom Finance',
    marathiName: 'दुकानदार स्वतःचा हप्ता / इतर फायनान्स',
    tagline: 'श्री साई इंटरप्राइजेस थेट मासिक हप्ता योजना',
    color: '#d97706',
    badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
    badgeText: 'In-Store EMI',
    defaultProcessingFee: 0,
    supportedSchemes: ['8/2', '10/2', '12/4', '6m', '12m'],
    description: 'स्थानिक ग्राहकांसाठी दुकानाची स्वतःची लवचिक हप्ता सोय.',
    contactHelpline: '8766486915',
  },
};

export const POPULAR_SCHEMES: FinanceSchemePreset[] = [
  {
    id: '8/2',
    name: '8 / 2 No-Cost Scheme',
    marathiName: '८ / २ योजना (८ महिने: २ आगाऊ + ६ मासिक हप्ते)',
    tenureMonths: 8,
    advanceEmis: 2,
    isNoCost: true,
    defaultInterestRate: 0,
    description: '२ हप्ते सुरुवातीला डाऊन पेमेंट म्हणून + उरलेले ६ हप्ते दरमहा शून्य व्याज.',
  },
  {
    id: '10/2',
    name: '10 / 2 No-Cost Scheme (Most Popular)',
    marathiName: '१० / २ योजना (१० महिने: २ आगाऊ + ८ मासिक हप्ते - सर्वात लोकप्रिय)',
    tenureMonths: 10,
    advanceEmis: 2,
    isNoCost: true,
    defaultInterestRate: 0,
    description: '२ हप्ते डाऊन पेमेंट + ८ मासिक हप्ते. टीव्ही, फ्रिज, वॉशिंग मशीनसाठी उत्तम.',
  },
  {
    id: '12/4',
    name: '12 / 4 Scheme',
    marathiName: '१२ / ४ योजना (१२ महिने: ४ आगाऊ + ८ मासिक हप्ते)',
    tenureMonths: 12,
    advanceEmis: 4,
    isNoCost: true,
    defaultInterestRate: 0,
    description: '४ हप्ते सुरुवातीला + उरलेले ८ हप्ते दरमहा भरणा.',
  },
  {
    id: '16/4',
    name: '16 / 4 Long Tenure Scheme',
    marathiName: '१६ / ४ दीर्घ मुदत (१६ महिने: ४ आगाऊ + १२ मासिक हप्ते)',
    tenureMonths: 16,
    advanceEmis: 4,
    isNoCost: true,
    defaultInterestRate: 0,
    description: 'मोठ्या वस्तू (उदा. एसी, मोठा टीव्ही) साठी दीर्घ मुदत व लहान मासिक हप्ता.',
  },
  {
    id: '9/3',
    name: '9 / 3 Scheme',
    marathiName: '९ / ३ योजना (९ महिने: ३ आगाऊ + ६ मासिक हप्ते)',
    tenureMonths: 9,
    advanceEmis: 3,
    isNoCost: true,
    defaultInterestRate: 0,
    description: '३ हप्ते डाऊन पेमेंट + ६ मासिक हप्ते.',
  },
  {
    id: '6/0',
    name: '6 / 0 Zero Downpayment',
    marathiName: '६ / ० शून्य डाऊन पेमेंट (६ महिने: ० आगाऊ + ६ मासिक हप्ते)',
    tenureMonths: 6,
    advanceEmis: 0,
    isNoCost: true,
    defaultInterestRate: 0,
    description: 'सुरुवातीला ० रुपये हप्ता, फक्त फाईल चार्ज आणि ६ समान मासिक हप्ते.',
  },
  {
    id: '6m',
    name: '6 Months Standard',
    marathiName: '६ महिने स्टँडर्ड हप्ता',
    tenureMonths: 6,
    advanceEmis: 0,
    isNoCost: false,
    defaultInterestRate: 14,
    description: '६ महिन्यांची सुलभ मुदत, नाममात्र व्याजदराने.',
  },
  {
    id: '9m',
    name: '9 Months Standard',
    marathiName: '९ महिने स्टँडर्ड हप्ता',
    tenureMonths: 9,
    advanceEmis: 0,
    isNoCost: false,
    defaultInterestRate: 15,
    description: '९ महिन्यांची हप्ता मुदत.',
  },
  {
    id: '12m',
    name: '12 Months Regular',
    marathiName: '१२ महिने (१ वर्ष) नियमित हप्ता',
    tenureMonths: 12,
    advanceEmis: 0,
    isNoCost: false,
    defaultInterestRate: 16,
    description: '१२ समान मासिक हप्ते, बँक व एनबीएफसी व्याजदरानुसार.',
  },
  {
    id: '18m',
    name: '18 Months Regular',
    marathiName: '१८ महिने (दीर्घ मुदत)',
    tenureMonths: 18,
    advanceEmis: 0,
    isNoCost: false,
    defaultInterestRate: 16.5,
    description: '१८ महिने कमीत कमी मासिक हप्त्यासाठी.',
  },
  {
    id: '24m',
    name: '24 Months Regular',
    marathiName: '२४ महिने (२ वर्षे)',
    tenureMonths: 24,
    advanceEmis: 0,
    isNoCost: false,
    defaultInterestRate: 17,
    description: '२४ महिने हप्ता कालावधी.',
  },
];

export const APPLIANCE_PRESETS = [
  { name: '32" Smart LED TV', marathi: '३२" स्मार्ट एलईडी टीव्ही', price: 14990, icon: '📺' },
  { name: '43" 4K UHD Smart TV', marathi: '४३" ४के स्मार्ट टीव्ही', price: 27990, icon: '📺' },
  { name: '55" 4K QLED Smart TV', marathi: '५५" ४के क्यूएलईडी टीव्ही', price: 43990, icon: '📺' },
  { name: 'Single Door Refrigerator (190L)', marathi: 'सिंगल डोअर फ्रिज १९० लिटर', price: 16500, icon: '❄️' },
  { name: 'Double Door Refrigerator (265L)', marathi: 'डबल डोअर फ्रिज २६५ लिटर', price: 27900, icon: '❄️' },
  { name: 'Semi-Automatic Washing Machine 7.5kg', marathi: 'सेमी-ऑटोमॅटिक वॉशिंग मशीन', price: 12990, icon: '🧺' },
  { name: 'Fully Automatic Top Load (7kg)', marathi: 'फुल्ली ऑटोमॅटिक वॉशिंग मशीन', price: 21500, icon: '🧺' },
  { name: '1.5 Ton 5-Star Inverter AC', marathi: '१.५ टन ५-स्टार इन्व्हर्टर एसी', price: 38500, icon: '❄️' },
  { name: '5G Smartphone', marathi: '५जी स्मार्टफोन', price: 17999, icon: '📱' },
  { name: 'Home Theatre / Soundbar 5.1', marathi: 'साउंडबार / होम थिएटर', price: 11990, icon: '🔊' },
];

/**
 * Calculates complete finance terms, down payment, EMI, and month-by-month schedule.
 */
export function calculateFinanceTerms(input: FinanceCalculationInput): FinanceCalculationResult {
  const {
    productPrice,
    tenureMonths,
    advanceEmis,
    isNoCost,
    interestRate,
    extraDownPayment = 0,
    processingFee = 0,
    dbdPercent = 0,
  } = input;

  const validTenure = Math.max(1, tenureMonths);
  const validAdvance = Math.min(validTenure, Math.max(0, advanceEmis));
  const remainingMonths = Math.max(0, validTenure - validAdvance);

  let monthlyEmi = 0;
  let totalInterestPaid = 0;
  let loanAmount = 0;

  if (isNoCost || interestRate <= 0) {
    // Zero-cost / subvention scheme
    // The base price is divided evenly among total tenure months
    monthlyEmi = Math.round(productPrice / validTenure);
    loanAmount = productPrice - (monthlyEmi * validAdvance) - extraDownPayment;
    totalInterestPaid = 0;
  } else {
    // Standard interest loan (reducing balance EMI formula)
    loanAmount = Math.max(0, productPrice - extraDownPayment);
    const monthlyRate = interestRate / (12 * 100);
    
    if (validTenure > 0 && monthlyRate > 0) {
      const factor = Math.pow(1 + monthlyRate, validTenure);
      monthlyEmi = Math.round((loanAmount * monthlyRate * factor) / (factor - 1));
      totalInterestPaid = Math.max(0, (monthlyEmi * validTenure) - loanAmount);
    } else {
      monthlyEmi = Math.round(loanAmount / validTenure);
    }
  }

  const advanceEmisTotal = monthlyEmi * validAdvance;
  const totalDownPayment = advanceEmisTotal + extraDownPayment + processingFee;
  const totalPaidByCustomer = totalDownPayment + (monthlyEmi * remainingMonths);
  const totalExtraCost = Math.max(0, totalPaidByCustomer - productPrice);

  // Net Disbursal to the Store
  const dbdDeduction = (productPrice * Math.max(0, dbdPercent)) / 100;
  const netStoreDisbursal = Math.round(productPrice - dbdDeduction);

  // Generate Amortization Schedule
  const schedule: AmortizationRow[] = [];
  const baseDate = input.startDate ? new Date(input.startDate) : new Date();
  const validBaseDate = isNaN(baseDate.getTime()) ? new Date() : baseDate;
  const startYear = validBaseDate.getFullYear();
  const startMonth = validBaseDate.getMonth();
  const startDay = validBaseDate.getDate();
  const dueDay = Math.min(28, Math.max(1, Number(input.emiDueDay) || 5));

  let currentBalance = isNoCost ? productPrice : loanAmount;

  for (let i = 1; i <= validTenure; i++) {
    const isAdvance = i <= validAdvance;
    let emiDate: Date;

    if (isAdvance) {
      // Advance EMIs are collected on booking / disbursement day
      emiDate = new Date(startYear, startMonth, startDay);
    } else {
      // Monthly regular bank EMIs start from the subsequent months on dueDay
      const monthOffset = i - validAdvance;
      emiDate = new Date(startYear, startMonth + monthOffset, dueDay);
    }

    const dateStr = emiDate.toISOString().split('T')[0];
    const formattedDate = emiDate.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    let interestPart = 0;
    let principalPart = monthlyEmi;

    if (!isNoCost && interestRate > 0) {
      const monthlyRate = interestRate / (12 * 100);
      interestPart = Math.round(currentBalance * monthlyRate);
      principalPart = monthlyEmi - interestPart;
    }

    currentBalance = Math.max(0, currentBalance - (isNoCost ? monthlyEmi : principalPart));

    const isFinal = i === validTenure;
    let status: 'paid_upfront' | 'upcoming' | 'final' = 'upcoming';
    let statusMarathi = `मासिक बँक हप्ता (Auto-Debit)`;

    if (isAdvance) {
      status = 'paid_upfront';
      statusMarathi = `डाऊन पेमेंटमध्ये भरले`;
    } else if (isFinal) {
      status = 'final';
      statusMarathi = `शेवटचा हप्ता - लोन पूर्ण समाप्त (NIL)!`;
    }

    schedule.push({
      month: i,
      dateStr,
      formattedDate,
      isAdvance,
      emi: monthlyEmi,
      principal: principalPart,
      interest: interestPart,
      remainingBalance: currentBalance,
      status,
      statusMarathi,
      dueDay,
    });
  }

  return {
    productPrice,
    tenureMonths: validTenure,
    advanceEmis: validAdvance,
    monthlyEmi,
    advanceEmisTotal,
    totalDownPayment,
    loanAmount: Math.max(0, loanAmount),
    remainingMonths,
    totalPaidByCustomer,
    totalInterestPaid,
    totalExtraCost,
    netStoreDisbursal,
    schedule,
  };
}

export function generateEmiScheduleWhatsAppText(params: {
  businessName: string;
  businessAddress?: string;
  businessPhone?: string;
  partnerName: string;
  customerName?: string;
  customerPhone?: string;
  productName: string;
  productPrice: number;
  schemeName: string;
  result: FinanceCalculationResult;
  dueDay: number;
}): string {
  const {
    businessName,
    businessAddress,
    businessPhone,
    partnerName,
    customerName,
    productName,
    productPrice,
    schemeName,
    result,
    dueDay,
  } = params;

  let msg = `*${businessName}*\n`;
  msg += `*अधिकृत फायनान्स हप्ते वेळापत्रक (EMI Repayment Schedule)*\n`;
  msg += `--------------------------------\n`;
  if (customerName) msg += `👤 ग्राहक: *${customerName}*\n`;
  msg += `🛍️ वस्तू: *${productName}*\n`;
  msg += `💰 वस्तू किंमत: *₹${productPrice.toLocaleString('en-IN')}*\n`;
  msg += `🏦 फायनान्स कंपनी: *${partnerName}*\n`;
  msg += `📊 योजना: *${schemeName} (${result.tenureMonths} महिने)*\n`;
  msg += `--------------------------------\n`;
  msg += `💳 *सुरुवातीला डाऊन पेमेंट: ₹${result.totalDownPayment.toLocaleString('en-IN')}*\n`;
  if (result.advanceEmis > 0) {
    msg += `   (${result.advanceEmis} आगाऊ हप्ते जमा: ₹${result.advanceEmisTotal.toLocaleString('en-IN')})\n`;
  }
  msg += `💰 *मासिक हप्ता (Monthly EMI): ₹${result.monthlyEmi.toLocaleString('en-IN')}*\n`;
  msg += `⏱️ *एकूण मासिक हप्ते: ${result.remainingMonths} महिने*\n`;
  msg += `🗓️ *हप्ता कटिंग तारीख: दरमहा ${dueDay} तारीख (Auto-Debit)*\n`;
  msg += `--------------------------------\n`;
  msg += `📅 *तारीखवार हप्ते यादी (Installment Dates):*\n`;

  result.schedule.forEach((row) => {
    if (row.isAdvance) {
      msg += `🔹 हप्ता ${row.month} (${row.formattedDate}): ₹${row.emi.toLocaleString('en-IN')} [${row.statusMarathi}]\n`;
    } else {
      const finishTag = row.status === 'final' ? ' 🏁 [शेवटचा हप्ता - लोन संपले!]' : '';
      msg += `🔹 हप्ता ${row.month} (${row.formattedDate}): ₹${row.emi.toLocaleString('en-IN')} (शिल्लक: ₹${row.remainingBalance.toLocaleString('en-IN')})${finishTag}\n`;
    }
  });

  msg += `--------------------------------\n`;
  msg += `ℹ️ *टीप:* वरील तारखेला बँक खात्यात शिल्लक ठेवावी म्हणजे ईसीएस बाऊन्स चार्ज लागणार नाही.\n`;
  if (businessAddress) msg += `📍 पत्ता: ${businessAddress}\n`;
  if (businessPhone) msg += `📞 संपर्क: ${businessPhone}\n`;
  msg += `*श्री साई एंटरप्रायझेस - आपली सेवा आमचे कर्तव्य!*`;

  return msg;
}
