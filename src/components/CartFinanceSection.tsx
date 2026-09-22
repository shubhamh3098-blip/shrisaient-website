import React, { useState, useMemo } from 'react';
import {
  Zap,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Calculator,
  Percent,
  Clock,
  MessageCircle,
  FileText,
  User,
  Phone,
  CreditCard,
  ChevronRight,
  Info,
  Sparkles,
  Award
} from 'lucide-react';
import { OrderFinanceDetails } from './OrderBillModal';

export type FinancePartnerId = 'bajaj' | 'tvs' | 'idfc' | 'hdb' | 'shri_sai_card';

interface FinancePartner {
  id: FinancePartnerId;
  name: string;
  marathiName: string;
  badge: string;
  badgeColor: string;
  primaryColor: string;
  textColor: string;
  borderColor: string;
  bgColor: string;
  description: string;
  approvalTime: string;
  features: string[];
}

const FINANCE_PARTNERS: FinancePartner[] = [
  {
    id: 'bajaj',
    name: 'Bajaj Finserv',
    marathiName: 'बजाज फायनान्स (No-Cost 0% EMI)',
    badge: 'सर्वात लोकप्रिय (Most Popular)',
    badgeColor: 'bg-blue-600 text-white',
    primaryColor: '#00529B',
    textColor: 'text-blue-900 dark:text-blue-300',
    borderColor: 'border-blue-500',
    bgColor: 'bg-blue-50/80 dark:bg-blue-950/40',
    description: 'बजाज इन्स्टा ईएमआय कार्ड किंवा स्पॉट डिजिटल अप्रूव्हल. ०% व्याज व ० डाऊन पेमेंट योजना.',
    approvalTime: '५ मिनिटांत स्पॉट अप्रूव्हल',
    features: ['०% नो-कॉस्ट ईएमआय', 'शून्य डाऊन पेमेंट पर्याय', 'कागदपत्रांशिवाय इन्स्टंट अप्रूव्हल', 'कार्ड नसले तरी स्पॉट कार्ड'],
  },
  {
    id: 'tvs',
    name: 'TVS Credit',
    marathiName: 'TVS क्रेडिट (कंझ्युमर ड्युरेबल)',
    badge: 'जलद मंजुरी',
    badgeColor: 'bg-red-600 text-white',
    primaryColor: '#D32F2F',
    textColor: 'text-red-900 dark:text-red-300',
    borderColor: 'border-red-500',
    bgColor: 'bg-red-50/80 dark:bg-red-950/40',
    description: 'इलेक्ट्रॉनिक्स, कुलर्स व फर्निचरसाठी TVS क्रेडिटचे सुलभ हप्ते.',
    approvalTime: '१० मिनिटांत डिजिटल मंजुरी',
    features: ['किमान कागदपत्रे (केवळ आधार/पॅन)', 'सुलभ मासिक हप्ते', '० डाऊन पेमेंट योजना उपलब्ध'],
  },
  {
    id: 'idfc',
    name: 'IDFC FIRST Bank',
    marathiName: 'IDFC फर्स्ट बँक फायनान्स',
    badge: 'पेपरलेस फायनान्स',
    badgeColor: 'bg-amber-700 text-white',
    primaryColor: '#9C27B0',
    textColor: 'text-purple-900 dark:text-purple-300',
    borderColor: 'border-purple-500',
    bgColor: 'bg-purple-50/80 dark:bg-purple-950/40',
    description: 'IDFC फर्स्ट बँकेचे १००% डिजिटल व पेपरलेस कंझ्युमर लोन.',
    approvalTime: 'झटपट मंजुरी',
    features: ['डिजिटल ई-केवायसी', 'फ्लेक्सिबल कालावधी ६ ते २४ महिने', 'आकर्षक व्याज सवलत'],
  },
  {
    id: 'hdb',
    name: 'HDB Financial Services',
    marathiName: 'HDB फायनान्शियल (HDFC EasyEMI)',
    badge: 'विश्वसनीय बँक फायनान्स',
    badgeColor: 'bg-emerald-700 text-white',
    primaryColor: '#00796B',
    textColor: 'text-emerald-900 dark:text-emerald-300',
    borderColor: 'border-emerald-500',
    bgColor: 'bg-emerald-50/80 dark:bg-emerald-950/40',
    description: 'HDFC बँक ग्रुपची अधिकृत फायनान्स कंपनी व डेबिट कार्ड EasyEMI.',
    approvalTime: 'त्वरित प्रोसेस',
    features: ['HDFC बँक डेबिट कार्ड EMI', 'कंझ्युमर ड्युरेबल लोन', 'घरपोच डिलिव्हरी फायनान्स'],
  },
  {
    id: 'shri_sai_card',
    name: 'Shri Sai Savings Card',
    marathiName: 'श्री साई ३०-महिने बचत कार्ड (आपले कार्ड)',
    badge: '५०% सुरुवातीला + हप्ते',
    badgeColor: 'bg-amber-500 text-slate-950 font-black',
    primaryColor: '#D97706',
    textColor: 'text-amber-900 dark:text-amber-300',
    borderColor: 'border-amber-500',
    bgColor: 'bg-amber-50/80 dark:bg-amber-950/40',
    description: 'आपल्या कार्डवर वस्तू घेण्यासाठी किमान ५०% रक्कम सुरुवातीला अनिवार्य. उरलेले ३० महिने/१३० आठवडे हप्ते. कॅश रिफंड फक्त ३० महिने पूर्ण झाल्यावरच.',
    approvalTime: 'तात्काळ पासबुक नोंदणी',
    features: [
      'किमान ५०% रक्कम सुरुवातीला अनिवार्य (वस्तू ताब्यात घेण्यासाठी)',
      'उरलेली ५०% रक्कम ३० महिने / १५ महिने सुलभ हप्त्यांमध्ये',
      '०% व्याज व ० फायनान्स चार्ज',
      'कॅश रिफंड फक्त कार्ड पूर्ण भरल्यावरच (३० महिने पूर्ण) मिळेल'
    ],
  },
];

interface SchemeOption {
  id: string;
  name: string;
  tenure: number;
  advanceEmis: number;
  isZeroDown: boolean;
  interestRateText: string;
  description: string;
  popular?: boolean;
}

const PARTNER_SCHEMES: Record<FinancePartnerId, SchemeOption[]> = {
  bajaj: [
    {
      id: 'bajaj-8-0',
      name: 'Bajaj 8/0 Scheme (0% No-Cost EMI)',
      tenure: 8,
      advanceEmis: 0,
      isZeroDown: true,
      interestRateText: '0% व्याज (No Cost)',
      description: '८ महिने, ₹० डाऊन पेमेंट, ० अगाऊ हप्ता',
      popular: true,
    },
    {
      id: 'bajaj-10-2',
      name: 'Bajaj 10/2 Scheme (2 Advance EMIs)',
      tenure: 10,
      advanceEmis: 2,
      isZeroDown: false,
      interestRateText: '0% व्याज (No Cost)',
      description: '१० महिने, २ अगाऊ हप्ते डाऊन पेमेंट',
      popular: true,
    },
    {
      id: 'bajaj-12-4',
      name: 'Bajaj 12/4 Scheme (4 Advance EMIs)',
      tenure: 12,
      advanceEmis: 4,
      isZeroDown: false,
      interestRateText: '0% व्याज (No Cost)',
      description: '१२ महिने, ४ अगाऊ हप्ते डाऊन पेमेंट',
    },
    {
      id: 'bajaj-6-0',
      name: 'Bajaj 6/0 Scheme (Zero Down Payment)',
      tenure: 6,
      advanceEmis: 0,
      isZeroDown: true,
      interestRateText: '0% व्याज (No Cost)',
      description: '६ महिने, ₹० डाऊन पेमेंट',
    },
    {
      id: 'bajaj-18-4',
      name: 'Bajaj 18/4 Long Tenure Low EMI',
      tenure: 18,
      advanceEmis: 4,
      isZeroDown: false,
      interestRateText: 'किमान व्याज',
      description: '१८ महिने, लहान मासिक हप्ता',
    },
    {
      id: 'bajaj-24-6',
      name: 'Bajaj 24/6 Smart Appliances Plan',
      tenure: 24,
      advanceEmis: 6,
      isZeroDown: false,
      interestRateText: 'कमी मासिक भार',
      description: '२४ महिने मोठा कालावधी',
    },
  ],
  tvs: [
    {
      id: 'tvs-6-0',
      name: 'TVS 6/0 Zero Down Payment',
      tenure: 6,
      advanceEmis: 0,
      isZeroDown: true,
      interestRateText: '0% व्याज',
      description: '६ महिने, ₹० डाऊन पेमेंट',
      popular: true,
    },
    {
      id: 'tvs-9-1',
      name: 'TVS 9/1 Easy Consumer Plan',
      tenure: 9,
      advanceEmis: 1,
      isZeroDown: false,
      interestRateText: '0% व्याज',
      description: '९ महिने, १ अगाऊ हप्ता',
      popular: true,
    },
    {
      id: 'tvs-12-2',
      name: 'TVS 12/2 Extended Appliances Plan',
      tenure: 12,
      advanceEmis: 2,
      isZeroDown: false,
      interestRateText: 'सुलभ ईएमआय',
      description: '१२ महिने, २ अगाऊ हप्ते',
    },
  ],
  idfc: [
    {
      id: 'idfc-6-0',
      name: 'IDFC 6 Months Zero Cost',
      tenure: 6,
      advanceEmis: 0,
      isZeroDown: true,
      interestRateText: '0% व्याज',
      description: '६ महिने पेपरलेस डिजिटल',
      popular: true,
    },
    {
      id: 'idfc-12-0',
      name: 'IDFC 12 Months Smart Loan',
      tenure: 12,
      advanceEmis: 0,
      isZeroDown: true,
      interestRateText: '०% नो-कॉस्ट',
      description: '१२ महिने शून्य डाऊन पेमेंट',
      popular: true,
    },
    {
      id: 'idfc-18-2',
      name: 'IDFC 18 Months Low EMI',
      tenure: 18,
      advanceEmis: 2,
      isZeroDown: false,
      interestRateText: 'सुलभ व्याज',
      description: '१८ महिने, २ अगाऊ हप्ते',
    },
  ],
  hdb: [
    {
      id: 'hdb-9-0',
      name: 'HDB 9 Months Consumer Durable',
      tenure: 9,
      advanceEmis: 0,
      isZeroDown: true,
      interestRateText: '0% नो-कॉस्ट',
      description: '९ महिने, ₹० डाऊन पेमेंट',
      popular: true,
    },
    {
      id: 'hdb-12-2',
      name: 'HDB 12/2 Easy HDFC Finance',
      tenure: 12,
      advanceEmis: 2,
      isZeroDown: false,
      interestRateText: 'किमान ईएमआय',
      description: '१२ महिने, २ अगाऊ हप्ते',
      popular: true,
    },
  ],
  shri_sai_card: [
    {
      id: 'sai-50-down-30m',
      name: 'श्री साई ३०-महिने बचत कार्ड (५०% सुरुवातीला + ३० महिने हप्ते)',
      tenure: 30,
      advanceEmis: 15,
      isZeroDown: false,
      interestRateText: '०% व्याज (किमान ५०% डाऊन पेमेंट)',
      description: 'किमान ५०% रक्कम सुरुवातीला + उरलेले ३० महिने / १३० आठवडे हप्ते',
      popular: true,
    },
    {
      id: 'sai-50-down-15m',
      name: 'श्री साई १५-महिने मासिक बचत कार्ड (५०% सुरुवातीला + १५ महिने हप्ते)',
      tenure: 15,
      advanceEmis: 8,
      isZeroDown: false,
      interestRateText: '०% व्याज (किमान ५०% डाऊन पेमेंट)',
      description: 'किमान ५०% रक्कम सुरुवातीला + उरलेले १५ महिने हप्ते',
      popular: true,
    },
  ],
};

interface CartFinanceSectionProps {
  totalAmount: number;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  onApplyFinance: (financeDetails: OrderFinanceDetails) => void;
  shopPhone?: string;
}

export const CartFinanceSection: React.FC<CartFinanceSectionProps> = ({
  totalAmount,
  customerName,
  customerPhone,
  customerAddress,
  onApplyFinance,
  shopPhone = '8766486915',
}) => {
  const [selectedPartnerId, setSelectedPartnerId] = useState<FinancePartnerId>('bajaj');
  const [selectedSchemeId, setSelectedSchemeId] = useState<string>('bajaj-8-0');
  const [cardOrDocNumber, setCardOrDocNumber] = useState('');
  const [employmentType, setEmploymentType] = useState('Salaried (नोकरदार)');
  const [hasExistingCard, setHasExistingCard] = useState<'yes' | 'no'>('yes');

  const selectedPartner = useMemo(() => {
    return (
      FINANCE_PARTNERS.find((p) => p.id === selectedPartnerId) ||
      FINANCE_PARTNERS[0]
    );
  }, [selectedPartnerId]);

  const availableSchemes = useMemo(() => {
    return PARTNER_SCHEMES[selectedPartnerId] || [];
  }, [selectedPartnerId]);

  // If partner changes, auto-select first scheme
  const handleSelectPartner = (partnerId: FinancePartnerId) => {
    setSelectedPartnerId(partnerId);
    const schemes = PARTNER_SCHEMES[partnerId];
    if (schemes && schemes.length > 0) {
      setSelectedSchemeId(schemes[0].id);
    }
  };

  const selectedScheme = useMemo(() => {
    return (
      availableSchemes.find((s) => s.id === selectedSchemeId) ||
      availableSchemes[0]
    );
  }, [availableSchemes, selectedSchemeId]);

  // EMI & Down Payment calculations
  const calculation = useMemo(() => {
    // Special Rule for Shri Sai Savings Card: Minimum 50% Upfront Down Payment
    if (selectedPartnerId === 'shri_sai_card') {
      const tenure = selectedScheme ? selectedScheme.tenure : 30;
      const downPayment = Math.round(totalAmount * 0.5); // 50% minimum upfront
      const financedAmount = Math.max(0, totalAmount - downPayment);
      const monthlyEmi = Math.round(financedAmount / tenure);
      const weeklyEmi = Math.round(financedAmount / (tenure * 4.33));

      return {
        tenure,
        advanceEmis: Math.round(tenure / 2),
        monthlyEmi,
        weeklyEmi,
        downPayment,
        financedAmount,
        isSaiCardScheme: true,
      };
    }

    if (!selectedScheme) {
      return {
        tenure: 8,
        advanceEmis: 0,
        monthlyEmi: Math.round(totalAmount / 8),
        downPayment: 0,
        financedAmount: totalAmount,
        isSaiCardScheme: false,
      };
    }

    const tenure = selectedScheme.tenure;
    const advanceEmis = selectedScheme.advanceEmis;
    // For zero-cost schemes, monthly EMI = total / tenure
    const baseEmi = Math.round(totalAmount / tenure);
    const downPayment = baseEmi * advanceEmis;
    const financedAmount = Math.max(0, totalAmount - downPayment);

    return {
      tenure,
      advanceEmis,
      monthlyEmi: baseEmi,
      weeklyEmi: Math.round(baseEmi / 4.33),
      downPayment,
      financedAmount,
      isSaiCardScheme: false,
    };
  }, [totalAmount, selectedScheme, selectedPartnerId]);

  const handleConfirmFinance = () => {
    const details: OrderFinanceDetails = {
      provider: selectedPartnerId,
      providerName: selectedPartner.name,
      tenureMonths: calculation.tenure,
      schemeName: selectedScheme?.name || `${selectedPartner.name} ${calculation.tenure} Months EMI`,
      downPayment: calculation.downPayment,
      monthlyEmi: calculation.monthlyEmi,
      advanceEmis: calculation.advanceEmis,
      processingFee: 0,
      customerDocType:
        selectedPartnerId === 'bajaj'
          ? hasExistingCard === 'yes'
            ? 'Bajaj Insta EMI Card'
            : 'New Bajaj In-Store Spot Finance (Aadhaar/PAN)'
          : selectedPartnerId === 'shri_sai_card'
          ? 'Shri Sai Savings Passbook'
          : 'Aadhaar / PAN Consumer Loan',
      customerDocNumber: cardOrDocNumber.trim() || undefined,
      employmentType,
    };

    onApplyFinance(details);
  };

  const getWhatsAppInquiryUrl = () => {
    const isSaiCard = selectedPartnerId === 'shri_sai_card';
    const text = encodeURIComponent(
      `*नमस्कार श्री साई इंटरप्राइजेस, वर्धा*\n` +
      `मला *${selectedPartner.name}* ${isSaiCard ? '(बचत कार्ड योजना)' : 'फायनान्स'}द्वारे खरेदी करावयाची आहे.\n` +
      `--------------------------------\n` +
      `*एकूण खरेदी रक्कम:* ₹${totalAmount.toLocaleString()}\n` +
      `*निवडलेली योजना:* ${selectedScheme?.name}\n` +
      `*कालावधी:* ${calculation.tenure} महिने\n` +
      `*मासिक हप्ता (EMI):* ₹${calculation.monthlyEmi.toLocaleString()} / महिना\n` +
      `*${isSaiCard ? 'किमान ५०% डाऊन पेमेंट' : 'डाऊन पेमेंट'}:* ₹${calculation.downPayment.toLocaleString()}\n` +
      (isSaiCard ? `*नियम:* ५०% सुरुवातीला + कॅश रिफंड ३० महिने पूर्ण झाल्यावरच\n` : '') +
      `*ग्राहक नाव:* ${customerName || 'Customer'}\n` +
      `*मोबाईल:* ${customerPhone || 'N/A'}\n` +
      `*पत्ता:* ${customerAddress || 'Wardha'}\n` +
      `--------------------------------\n` +
      `कृपया पुढील प्रक्रिया सांगा.`
    );
    return `https://wa.me/91${shopPhone}?text=${text}`;
  };

  return (
    <div className="space-y-4">
      {/* Top Value Banner */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 p-3 opacity-15 pointer-events-none">
          <Zap className="w-24 h-24" />
        </div>
        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] tracking-wider uppercase flex items-center gap-1">
              <Sparkles className="w-3 h-3 fill-slate-950" />
              0% No-Cost EMI
            </span>
            <span className="text-[11px] text-blue-200 font-semibold">
              स्पॉट इन्स्टंट अप्रूव्हल
            </span>
          </div>
          <h3 className="font-extrabold text-sm sm:text-base text-white tracking-tight">
            बजाज फायनान्स व इतर सुलभ हप्ते योजना
          </h3>
          <p className="text-[11px] text-slate-300 leading-snug">
            आताच खरेदी करा आणि ०% व्याजाने सुलभ मासिक हप्त्यांमध्ये भरा. वर्धा शोरूममध्ये तात्काळ स्पॉट अप्रूव्हल!
          </p>
        </div>
      </div>

      {/* 1. Finance Partner Selector Tabs */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-blue-600" />
            फायनान्स कंपनी निवडा (Select Finance Partner):
          </span>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
            {selectedPartner.approvalTime}
          </span>
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {FINANCE_PARTNERS.map((partner) => {
            const isSelected = partner.id === selectedPartnerId;
            return (
              <button
                key={partner.id}
                type="button"
                onClick={() => handleSelectPartner(partner.id)}
                className={`p-2.5 rounded-xl text-left border transition relative cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? `${partner.borderColor} ${partner.bgColor} ring-2 ring-blue-500/40 shadow-sm`
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                      {partner.name}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                    {partner.marathiName.split('(')[0]}
                  </p>
                </div>
                <span className={`mt-1 text-[9px] font-bold px-1.5 py-0.2 rounded w-fit ${partner.badgeColor}`}>
                  {partner.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Scheme Selector Pills */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Percent className="w-3.5 h-3.5 text-amber-500" />
          योजना व हप्ता कालावधी (Select EMI Scheme & Tenure):
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {availableSchemes.map((scheme) => {
            const isSelected = scheme.id === selectedSchemeId;
            const emiVal =
              selectedPartnerId === 'shri_sai_card'
                ? Math.round((totalAmount - Math.round(totalAmount * 0.5)) / scheme.tenure)
                : Math.round(totalAmount / scheme.tenure);
            const dpVal =
              selectedPartnerId === 'shri_sai_card'
                ? Math.round(totalAmount * 0.5)
                : Math.round(totalAmount / scheme.tenure) * scheme.advanceEmis;

            return (
              <button
                key={scheme.id}
                type="button"
                onClick={() => setSelectedSchemeId(scheme.id)}
                className={`p-2.5 rounded-xl text-left border transition cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 ring-1 ring-blue-500 text-slate-900 dark:text-white'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-xs">
                      {scheme.tenure} महिने (Months)
                    </span>
                    {scheme.isZeroDown && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold">
                        ₹० Down Payment
                      </span>
                    )}
                    {selectedPartnerId === 'shri_sai_card' && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 font-bold">
                        ५०% सुरुवातीला
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    {scheme.description}
                  </p>
                </div>

                <div className="text-right shrink-0 pl-2">
                  <span className="text-xs font-black font-mono text-blue-700 dark:text-blue-400 block">
                    ₹{emiVal.toLocaleString()}/महिना
                  </span>
                  <span className="text-[9px] text-slate-400 font-medium">
                    {selectedPartnerId === 'shri_sai_card'
                      ? `५०% DP: ₹${dpVal.toLocaleString()}`
                      : dpVal > 0
                      ? `DP: ₹${dpVal.toLocaleString()}`
                      : 'No DP'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Live Dynamic EMI Calculation Card */}
      <div className="p-3.5 rounded-2xl bg-slate-900 text-white shadow-lg space-y-3 border border-slate-800">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 text-xs">
          <div className="flex items-center gap-1.5">
            <Calculator className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-slate-200">
              {selectedPartner.name} ईएमआय हिशोब
            </span>
          </div>
          <span className="text-amber-400 font-bold text-[11px] bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30">
            {selectedScheme?.interestRateText || '0% No-Cost EMI'}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-xl bg-slate-800/80">
            <span className="text-[10px] text-slate-400 block">
              {selectedPartnerId === 'shri_sai_card' ? 'किमान ५०% DP' : 'डाऊन पेमेंट (DP)'}
            </span>
            <span className="text-sm font-black text-emerald-400 font-mono">
              {calculation.downPayment === 0
                ? '₹० (ZERO)'
                : `₹${calculation.downPayment.toLocaleString()}`}
            </span>
          </div>
          <div className="p-2 rounded-xl bg-slate-800/80">
            <span className="text-[10px] text-slate-400 block">कालावधी (Tenure)</span>
            <span className="text-sm font-black text-slate-100 font-mono">
              {calculation.tenure} महिने
            </span>
          </div>
          <div className="p-2 rounded-xl bg-blue-950/80 border border-blue-800">
            <span className="text-[10px] text-blue-300 block font-bold">मासिक हप्ता (EMI)</span>
            <span className="text-base font-black text-amber-300 font-mono">
              ₹{calculation.monthlyEmi.toLocaleString()}
            </span>
            {calculation.weeklyEmi && selectedPartnerId === 'shri_sai_card' && (
              <span className="text-[9px] text-slate-300 block">
                (~₹{calculation.weeklyEmi.toLocaleString()}/आठवडा)
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
          <span>एकूण वस्तू मूल्य: <strong className="text-white font-mono">₹{totalAmount.toLocaleString()}</strong></span>
          <span>प्रोसेंसिंग फी: <strong className="text-emerald-400">₹० (मोफत ऑफर)</strong></span>
        </div>

        {/* Shri Sai Card Scheme Special Rules Notice */}
        {selectedPartnerId === 'shri_sai_card' && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/40 rounded-xl space-y-1.5 text-xs text-left">
            <div className="flex items-center gap-1.5 font-bold text-amber-400">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>श्री साई बचत कार्ड अधिकृत खरेदी व रिफंड नियम:</span>
            </div>
            <ul className="space-y-1 text-[11px] text-slate-200 pl-4 list-disc leading-relaxed">
              <li>
                <strong>५०% रक्कम सुरुवातीला:</strong> आपल्या कार्डवर वस्तू ताब्यात घेण्यासाठी एकूण किमतीच्या <strong>किमान ५०% रक्कम (₹{calculation.downPayment.toLocaleString()})</strong> सुरुवातीला भरणे आवश्यक आहे.
              </li>
              <li>
                <strong>उरलेले ५०% हप्ते:</strong> शिल्लक ₹{calculation.financedAmount.toLocaleString()} ही रक्कम {calculation.tenure} महिन्यांच्या साप्ताहिक/मासिक हप्त्यांमध्ये भरता येईल.
              </li>
              <li>
                <strong className="text-amber-300">कॅश रिफंड नियम:</strong> कॅश रिफंड हा <strong>बचत कार्ड योजना पूर्ण भरल्यावरच (३० महिने पूर्ण)</strong> होईल, त्याआधी कॅश रिफंड मिळणार नाही!
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* 4. Quick KYC / Card Verification Input */}
      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
        <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <CreditCard className="w-3.5 h-3.5 text-blue-600" />
          इन्स्टंट अप्रूव्हल तपशील (Instant KYC Verification):
        </span>

        {selectedPartnerId === 'bajaj' && (
          <div className="flex items-center gap-3 text-[11px]">
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                name="hasBajajCard"
                checked={hasExistingCard === 'yes'}
                onChange={() => setHasExistingCard('yes')}
                className="accent-blue-600"
              />
              <span>माझ्याकडे बजाज ईएमआय कार्ड आहे</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                name="hasBajajCard"
                checked={hasExistingCard === 'no'}
                onChange={() => setHasExistingCard('no')}
                className="accent-blue-600"
              />
              <span>नवीन कार्ड हवे (Spot In-Store)</span>
            </label>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input
            type="text"
            placeholder={
              selectedPartnerId === 'bajaj'
                ? hasExistingCard === 'yes'
                  ? 'बजाज कार्ड नंबर / नोंदणीकृत मोबाइल'
                  : 'आधार कार्ड / पॅन कार्ड नंबर'
                : selectedPartnerId === 'shri_sai_card'
                ? 'मागील पासबुक नंबर (असल्यास)'
                : 'आधार कार्ड / पॅन कार्ड नंबर'
            }
            value={cardOrDocNumber}
            onChange={(e) => setCardOrDocNumber(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
          />

          <select
            value={employmentType}
            onChange={(e) => setEmploymentType(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-600"
          >
            <option value="Salaried (नोकरदार)">नोकरदार (Salaried)</option>
            <option value="Self-Employed / Business (व्यावसायिक)">व्यवसाय / दुकानदार (Business)</option>
            <option value="Farmer (शेतकरी)">शेतकरी (Farmer)</option>
            <option value="Housewife / Student (इतर)">इतर (Others)</option>
          </select>
        </div>

        <p className="text-[10px] text-slate-400 flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          श्री साई इंटरप्राइजेस वर्धा अधिकृत बजाज व बँक फायनान्स भागीदार आहे. तुमची माहिती १००% सुरक्षित राहील.
        </p>
      </div>

      {/* 5. Direct Action Buttons */}
      <div className="space-y-2 pt-1">
        <button
          type="button"
          onClick={handleConfirmFinance}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-black text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
        >
          <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
          <span>{selectedPartner.name} फायनान्सने खरेदी करा (Apply Instant Finance)</span>
        </button>

        <a
          href={getWhatsAppInquiryUrl()}
          target="_blank"
          rel="noreferrer"
          className="w-full py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <MessageCircle className="w-4 h-4 text-emerald-600" />
          <span>WhatsApp वर फायनान्स मंजुरी चौकशी करा ({shopPhone})</span>
        </a>
      </div>
    </div>
  );
};
