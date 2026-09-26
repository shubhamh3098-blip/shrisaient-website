import React, { useState } from 'react';
import {
  CreditCard,
  Check,
  Printer,
  Share2,
  Plus,
  Edit3,
  ShoppingBag,
  ShieldCheck,
  QrCode,
  Calendar,
  Save,
  X,
  Sparkles,
  Phone,
  MapPin,
  Clock,
  AlertCircle,
  FileCheck,
  FileText,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { CardMember, CardTransaction, StoreSettings, Transaction } from '../../types';
import {
  getCardFinancialSummary,
  getSchemeConfig,
  resolveCardScheme,
  extractCardNumber,
  SCHEME_OFFICIAL_RULES_16,
  SCHEME_WARRANTY_DISCLAIMER
} from '../../utils/schemeUtils';

interface InteractiveDigitalCardProps {
  member: CardMember;
  transactions: CardTransaction[];
  storeTransactions?: Transaction[];
  settings: StoreSettings;
  onDepositNext: (monthNo: number) => void;
  onUpdateMember: (updatedMember: CardMember) => void;
  onOpenPrintModal: () => void;
}

export const InteractiveDigitalCard: React.FC<InteractiveDigitalCardProps> = ({
  member,
  transactions,
  storeTransactions = [],
  settings,
  onDepositNext,
  onUpdateMember,
  onOpenPrintModal,
}) => {
  const [activeCardTab, setActiveCardTab] = useState<'card' | 'item' | 'rules'>('card');
  const [isEditingItem, setIsEditingItem] = useState(false);

  // Form states for attached item delivery / bill details
  const [itemName, setItemName] = useState(member.deliveredItemName || '');
  const [billNo, setBillNo] = useState(member.itemBillNo || '');
  const [billDate, setBillDate] = useState(member.itemBillDate || new Date().toISOString().split('T')[0]);
  const [itemAmount, setItemAmount] = useState<number | ''>(member.itemTotalAmount ?? '');
  const [advancePaid, setAdvancePaid] = useState<number | ''>(member.itemAdvancePaid ?? member.totalAmountPaid ?? '');
  const [balanceDue, setBalanceDue] = useState<number | ''>(member.itemBalanceDue ?? '');
  const [dueDt, setDueDt] = useState(member.itemDueDt || '');

  const schemeNo = resolveCardScheme(member);
  const config = getSchemeConfig(schemeNo);
  const cardNum = extractCardNumber(member.cardNo);
  const fin = getCardFinancialSummary(member);

  // Filter transactions for this member
  const memberTx = transactions.filter(
    (t) => t.cardMemberId === member.id || t.cardNo === member.cardNo
  );

  // Check if bill has been generated/item delivered
  const hasBill = Boolean(member.deliveredItemName || member.itemBillNo);

  // Check if there is an existing store sale invoice matching this card or phone
  const matchedStoreInvoice = storeTransactions?.find(
    (t) =>
      (t.linkedCardId && t.linkedCardId === member.id) ||
      (t.linkedCardNo && t.linkedCardNo === member.cardNo) ||
      (t.customerPhone &&
        member.phone &&
        member.phone !== '0' &&
        t.customerPhone.replace(/\D/g, '').slice(-10) === member.phone.replace(/\D/g, '').slice(-10))
  );

  // Compute 30 months data - strictly ₹15,000 scheme (₹500/month, ₹500 bonus, ₹15,500 maturity)
  const monthlyTarget = 500;
  const weeklySteps = [100, 100, 100, 100, 200];

  const monthsList = Array.from({ length: 30 }, (_, idx) => {
    const monthNum = idx + 1;
    const cumulativeTotal = monthNum * 500;
    const isFullyPaid = fin.totalPaid >= cumulativeTotal;
    const isPartiallyPaid = !isFullyPaid && fin.totalPaid > (monthNum - 1) * 500;
    const isNextDue = !isFullyPaid && (monthNum === 1 || fin.totalPaid >= (monthNum - 1) * 500);
    
    // Find receipt if available
    const tx = memberTx.find((t) => (t.monthNumber || 0) === monthNum);

    return {
      monthNum,
      cumulativeTotal,
      isFullyPaid,
      isPartiallyPaid,
      isNextDue,
      txDate: tx ? new Date(tx.date).toLocaleDateString('en-IN') : null,
      txAmount: tx ? tx.amount : null,
    };
  });

  const handleSaveItemDetails = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: CardMember = {
      ...member,
      deliveredItemName: itemName.trim() || undefined,
      itemBillNo: billNo.trim() || undefined,
      itemBillDate: billDate || undefined,
      itemTotalAmount: itemAmount === '' ? undefined : Number(itemAmount),
      itemAdvancePaid: advancePaid === '' ? undefined : Number(advancePaid),
      itemBalanceDue: balanceDue === '' ? undefined : Number(balanceDue),
      itemDueDt: dueDt || undefined,
    };
    onUpdateMember(updated);
    setIsEditingItem(false);
  };

  const handleClearBillDetails = () => {
    if (confirm('या कार्डवरील बिल व वस्तू नोंद हटवायची आहे का? (Remove bill entry?)')) {
      const updated: CardMember = {
        ...member,
        deliveredItemName: undefined,
        itemBillNo: undefined,
        itemBillDate: undefined,
        itemTotalAmount: undefined,
        itemAdvancePaid: undefined,
        itemBalanceDue: undefined,
        itemDueDt: undefined,
      };
      setItemName('');
      setBillNo('');
      setItemAmount('');
      setAdvancePaid('');
      setBalanceDue('');
      setDueDt('');
      onUpdateMember(updated);
      setIsEditingItem(false);
    }
  };

  const handleQuickFillFromInvoice = (inv: Transaction) => {
    const firstItem = inv.items?.[0]?.name || 'श्री साई वस्तू';
    const itemsDescription = inv.items?.map((it) => it.name).join(', ') || firstItem;
    setItemName(itemsDescription);
    setBillNo(inv.invoiceNo);
    setBillDate(inv.date ? inv.date.split('T')[0] : new Date().toISOString().split('T')[0]);
    setItemAmount(inv.grandTotal);
    setAdvancePaid(inv.paidAmount);
    setBalanceDue(inv.balanceDue);
  };

  const handleQuickFillMaturityBill = () => {
    setItemName('३०-महिने बचत योजना मॅच्युरिटी वस्तू');
    setBillNo(`SSE-SCHEME-${cardNum}`);
    setBillDate(new Date().toISOString().split('T')[0]);
    setItemAmount(15500);
    setAdvancePaid(fin.totalPaid);
    setBalanceDue(Math.max(0, 15500 - fin.totalPaid));
  };

  const handleShareWhatsApp = () => {
    let msg = `*${settings.storeName || 'SHRI SAI ENTERPRISES'}*\n`;
    msg += `(श्री साई इंटरप्रायजेस, वर्धा • ३०-महिने बचत योजना पासबुक)\n`;
    msg += `📞 संपर्क: 8600122978 / 9175537365 / 8766486915\n`;
    msg += `----------------------------------------\n`;
    msg += `💳 *कार्ड क्र.:* #${cardNum} (${config.marathiName})\n`;
    msg += `👤 *सभासद नाव:* ${member.memberName}\n`;
    msg += `📱 *मोबाईल:* ${member.phone && member.phone !== '0' ? member.phone : 'N/A'}\n`;
    msg += `📍 *पत्ता:* ${member.village || member.address || 'Wardha'}\n`;
    msg += `🎟️ *सदस्यता नोंदणी शुल्क:* ₹${fin.membershipFee}/-\n`;
    msg += `📅 *दिनांक:* ${new Date(member.startDate || Date.now()).toLocaleDateString('en-IN')}\n`;
    msg += `----------------------------------------\n`;
    msg += `📊 *अचूक हिशोब (Exact Financial Ledger):*\n`;
    msg += `• हप्ता दर: ₹५००/- दरमहा (साप्ताहिक ₹१००)\n`;
    msg += `• योजना उद्दिष्ट: *₹१५,०००/-* (३० महिने)\n`;
    msg += `• आजवर एकूण जमा: *₹${fin.totalPaid.toLocaleString('en-IN')}* (${fin.totalPaidMonths}/३० महिने पूर्ण)\n`;
    msg += `• शिल्लक बाकी देय: *₹${Math.max(0, 15000 - fin.totalPaid).toLocaleString('en-IN')}*\n`;
    msg += `🎁 *३०-महिने बोनस:* ₹५००/-\n`;
    msg += `💰 *मॅच्युरिटी एकूण परतावा/वस्तू:* *₹१५,५००/-*\n`;

    if (member.deliveredItemName) {
      msg += `----------------------------------------\n`;
      msg += `🛍️ *नेलेली वस्तू / खरेदी नोंद (Item Delivered):*\n`;
      msg += `• वस्तू: ${member.deliveredItemName}\n`;
      if (member.itemBillNo) msg += `• बिल क्र.: ${member.itemBillNo}\n`;
      if (member.itemTotalAmount) msg += `• वस्तू एकूण किंमत: ₹${member.itemTotalAmount.toLocaleString('en-IN')}\n`;
      if (member.itemAdvancePaid) msg += `• जमा रक्कम: ₹${member.itemAdvancePaid.toLocaleString('en-IN')}\n`;
      if (member.itemBalanceDue) msg += `• शिल्लक देय बाकी: ₹${member.itemBalanceDue.toLocaleString('en-IN')}\n`;
      if (member.itemDueDt) msg += `• देय तारीख: ${member.itemDueDt}\n`;
    }

    msg += `----------------------------------------\n`;
    msg += `धन्यवाद! 🙏 श्री साई इंटरप्रायजेस, वर्धा`;

    const encoded = encodeURIComponent(msg);
    const cleanPhone = member.phone.replace(/\D/g, '');
    const phoneParam = cleanPhone.length >= 10 ? `phone=91${cleanPhone.slice(-10)}&` : '';
    window.open(`https://api.whatsapp.com/send?${phoneParam}text=${encoded}`, '_blank');
  };

  const handleShareRulesWhatsApp = () => {
    let msg = `*श्री साई इंटरप्रायजेस, वर्धा - ३०-महिने बचत योजना*\n`;
    msg += `*अधिकृत १६ नियम व अटी (Official Rules & Conditions)*\n`;
    msg += `📞 8600122978 / 9175537365 / 8766486915\n`;
    msg += `----------------------------------------\n`;
    SCHEME_OFFICIAL_RULES_16.forEach((r) => {
      msg += `${r}\n\n`;
    });
    msg += `📌 *गॅरंटी टीप:* ${SCHEME_WARRANTY_DISCLAIMER}\n`;
    const encoded = encodeURIComponent(msg);
    const cleanPhone = member.phone.replace(/\D/g, '');
    const phoneParam = cleanPhone.length >= 10 ? `phone=91${cleanPhone.slice(-10)}&` : '';
    window.open(`https://api.whatsapp.com/send?${phoneParam}text=${encoded}`, '_blank');
  };

  return (
    <div className="space-y-4 w-full max-w-full min-w-0 overflow-hidden">
      {/* Top Action Ribbon - Fully responsive with clean wrapping */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 sm:p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs w-full max-w-full">
        <div className="flex items-center gap-1.5 font-bold text-amber-500 min-w-0">
          <Sparkles className="w-4 h-4 shrink-0" />
          <span className="truncate">अधिकृत ३०-महिने डिजिटल पासबुक कार्ड • कार्ड #{cardNum}</span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* View Toggles */}
          <div className="flex rounded-xl bg-slate-900/80 p-0.5 border border-slate-700">
            <button
              type="button"
              onClick={() => setActiveCardTab('card')}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 text-xs ${
                activeCardTab === 'card'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <span>📜 मूळ कार्ड</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveCardTab('item')}
              className={`px-2 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 text-xs ${
                activeCardTab === 'item'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>वस्तू/बिल</span>
              {member.deliveredItemName && (
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveCardTab('rules')}
              className={`px-2 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 text-xs ${
                activeCardTab === 'rules'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>१६ नियम</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2.5 py-1.5 rounded-xl text-xs transition cursor-pointer flex items-center gap-1 shadow-sm whitespace-nowrap"
            title="WhatsApp वर पासबुक पाठवा"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>WhatsApp पासबुक</span>
          </button>

          <button
            type="button"
            onClick={handleShareRulesWhatsApp}
            className="bg-teal-700 hover:bg-teal-600 text-white font-bold px-2.5 py-1.5 rounded-xl text-xs transition cursor-pointer flex items-center gap-1 shadow-sm whitespace-nowrap"
            title="WhatsApp वर १६ नियम व अटी पाठवा"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>नियम</span>
          </button>

          <button
            type="button"
            onClick={onOpenPrintModal}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-2.5 py-1.5 rounded-xl text-xs transition cursor-pointer flex items-center gap-1 shadow-sm whitespace-nowrap"
            title="प्रिंट / PDF फॉरमॅट्स"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Passbook</span>
          </button>
        </div>
      </div>

      {/* Main Tab 1: EXACT PHYSICAL CARD REPLICA */}
      {activeCardTab === 'card' && (
        <div className="bg-[#fffdf9] text-slate-900 rounded-2xl p-3 sm:p-5 border-2 border-amber-900/30 shadow-xl space-y-4 font-sans select-none w-full max-w-full min-w-0 overflow-hidden">
          {/* Card Top Header (Matching physical card photo) */}
          <div className="border-b-2 border-slate-900 pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-dashed border-slate-400 pb-2 mb-2">
              <div className="flex items-center gap-2 sm:gap-3 text-xs font-semibold flex-wrap">
                <span className="bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded font-bold">
                  सदस्यता शुल्क: <b className="font-mono text-slate-950">रु. ५०/-</b>
                </span>
                <span className="text-slate-400 hidden sm:inline">•</span>
                <span className="text-slate-700">
                  दिनांक: <b className="font-mono">{member.startDate ? new Date(member.startDate).toLocaleDateString('en-IN') : '19/8/24'}</b>
                </span>
                <span className="text-slate-400 hidden sm:inline">•</span>
                <span className="text-slate-700">
                  शिट नं.: <b className="font-mono">{member.sheetNo || '1'}</b>
                </span>
                <span className="text-slate-400 hidden sm:inline">•</span>
                {/* Official Bill Badge in Header */}
                {hasBill ? (
                  <span className="bg-emerald-100 text-emerald-950 border border-emerald-400 px-2.5 py-0.5 rounded-md font-black text-[11px] flex items-center gap-1 shadow-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                    <span>बिल झाले: #{member.itemBillNo || 'नोंद'} ({member.deliveredItemName ? member.deliveredItemName.slice(0, 16) : 'वस्तू'})</span>
                  </span>
                ) : (
                  <span className="bg-slate-100 text-slate-700 border border-slate-300 px-2.5 py-0.5 rounded-md font-bold text-[11px] flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>बिल: अद्याप नाही (बचत चालू)</span>
                  </span>
                )}
              </div>

              <div className="text-right">
                <span className="text-red-700 font-mono font-black text-xl sm:text-2xl tracking-wider inline-block">
                  कार्ड क्र. {String(cardNum).padStart(5, '0')}
                </span>
              </div>
            </div>

            {/* Member Details Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
              <div className="md:col-span-2">
                <span className="font-bold text-slate-700">पूर्ण नाव श्री / सौ : </span>
                <span className="font-black uppercase text-sm text-slate-950 underline decoration-amber-600 underline-offset-4 ml-1">
                  {member.memberName}
                </span>
              </div>
              <div className="text-left md:text-right">
                <span className="font-bold text-slate-700">मो. नं. : </span>
                <span className="font-mono font-bold text-slate-950 text-xs ml-1">
                  {member.phone && member.phone !== '0' ? member.phone : '________________'}
                </span>
              </div>
              <div className="md:col-span-3">
                <span className="font-bold text-slate-700">पत्ता : </span>
                <span className="font-semibold text-slate-900 ml-1">
                  {member.village || member.address || 'इंदूसी नगर, वर्धा'}
                </span>
              </div>
            </div>
          </div>

          {/* 🧾 ठळक खरेदी बिल व डिलिव्हरी स्टेटस कार्ड (HIGH-VISIBILITY BILL STATUS ON CARD) */}
          {hasBill ? (
            <div className="bg-emerald-50 border-2 border-emerald-500 rounded-xl p-3 sm:p-3.5 text-emerald-950 shadow-xs flex flex-wrap items-center justify-between gap-3 min-w-0">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  <FileCheck className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-emerald-700 text-white px-2.5 py-0.5 rounded font-black text-xs uppercase tracking-wide flex items-center gap-1 shadow-xs">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>बिल झाले आहे (Billed & Item Delivered)</span>
                    </span>
                    <span className="font-mono text-xs font-black text-slate-950 bg-white px-2.5 py-0.5 rounded border border-emerald-300">
                      बिल क्र.: #{member.itemBillNo || 'SSE-BILLED'}
                    </span>
                    {member.itemBillDate && (
                      <span className="text-xs text-slate-700 font-medium">
                        तारीख: <b className="font-mono">{new Date(member.itemBillDate).toLocaleDateString('en-IN')}</b>
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-bold text-slate-900 mt-1.5 flex items-center gap-2.5 flex-wrap">
                    <span>
                      वस्तू: <span className="text-emerald-950 font-black uppercase underline decoration-emerald-500 decoration-2">{member.deliveredItemName}</span>
                    </span>
                    <span className="text-slate-400">•</span>
                    <span>
                      एकूण बिल: <span className="font-mono text-slate-950 font-black">₹{(member.itemTotalAmount ?? 15500).toLocaleString('en-IN')}</span>
                    </span>
                    <span className="text-slate-400">•</span>
                    <span>
                      जमा / ॲडव्हान्स: <span className="font-mono text-emerald-700 font-black">₹{(member.itemAdvancePaid ?? fin.totalPaid).toLocaleString('en-IN')}</span>
                    </span>
                    <span className="text-slate-400">•</span>
                    <span>
                      बाकी देय: <span className={`font-mono font-black px-1.5 py-0.5 rounded ${(member.itemBalanceDue ?? 0) > 0 ? 'text-rose-700 bg-rose-100 border border-rose-300' : 'text-emerald-800 bg-emerald-100'}`}>
                        {(member.itemBalanceDue ?? 0) > 0 ? `₹${(member.itemBalanceDue ?? 0).toLocaleString('en-IN')} बाकी` : '₹० (पूर्ण फेडले ✓)'}
                      </span>
                    </span>
                    {member.itemDueDt && (
                      <>
                        <span className="text-slate-400">•</span>
                        <span className="text-[11px] text-amber-900 font-mono">देय तारीख: {member.itemDueDt}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditingItem(true)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>बिल बदला / पहा</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50/70 border border-dashed border-amber-300 rounded-xl p-3 text-slate-800 flex flex-wrap items-center justify-between gap-3 min-w-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-amber-700" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-amber-200 text-amber-950 px-2 py-0.5 rounded font-black text-[11px] uppercase tracking-wide">
                      ⏳ अद्याप बिल झालेले नाही (No Bill / Item Yet)
                    </span>
                    <span className="text-xs text-slate-600">
                      सभासदाने अद्याप कोणतीही वस्तू उचललेली नाही (नियमित मासिक बचत योजना चालू आहे)
                    </span>
                  </div>
                  {matchedStoreInvoice && (
                    <div className="mt-1 flex items-center gap-2 text-xs text-indigo-700 font-bold">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>दुकानात सेल्स इनव्हॉइस आढळले: #{matchedStoreInvoice.invoiceNo} (₹{matchedStoreInvoice.grandTotal.toLocaleString('en-IN')})</span>
                      <button
                        type="button"
                        onClick={() => {
                          handleQuickFillFromInvoice(matchedStoreInvoice);
                          setIsEditingItem(true);
                        }}
                        className="underline text-indigo-900 cursor-pointer font-extrabold hover:text-indigo-600"
                      >
                        हे बिल जोडा ➔
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingItem(true)}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap active:scale-95 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ बिल / खरेदी नोंद जोडा</span>
              </button>
            </div>
          )}

          {/* 30 Months Grid (भाग १: १ ते १४, भाग २: १५ ते ३०) - Fully responsive with table-fixed & overflow-x-auto */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 min-w-0">
            {/* Left Half: Months 1 to 14 */}
            <div className="border border-slate-400 rounded-xl overflow-hidden bg-white shadow-xs min-w-0 flex flex-col justify-between">
              <div>
                <div className="bg-amber-100/80 border-b border-slate-400 px-3 py-1 font-black text-xs text-amber-950 flex justify-between items-center">
                  <span>भाग १ (महिना १ ते १४) • दरमहा ₹५००</span>
                  <span className="font-mono text-emerald-800">एकूण: ₹७,०००</span>
                </div>
                <div className="w-full overflow-x-auto min-w-0">
                  <table className="w-full text-center border-collapse text-[10px] table-fixed min-w-[320px]">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase">
                        <th className="w-[12%] py-1 px-0.5 border-r border-slate-300">सो.क्र.</th>
                        <th className="w-[28%] py-1 px-0.5 border-r border-slate-300">हप्ते (रुपये)</th>
                        <th className="w-[22%] py-1 px-0.5 border-r border-slate-300">र.नं.</th>
                        <th className="w-[20%] py-1 px-0.5 border-r border-slate-300">दिनांक</th>
                        <th className="w-[18%] py-1 px-0.5">स्थिती / सही</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthsList.slice(0, 14).map((m) => (
                        <tr
                          key={m.monthNum}
                          className={`border-b border-slate-200 transition ${
                            m.isFullyPaid
                              ? 'bg-emerald-50/70 text-slate-950'
                              : m.isPartiallyPaid
                              ? 'bg-amber-50 text-slate-950'
                              : m.isNextDue
                              ? 'bg-amber-100/60 text-amber-950 font-bold'
                              : 'text-slate-500'
                          }`}
                        >
                          <td className="py-1 px-0.5 font-bold font-mono border-r border-slate-300 bg-slate-50">
                            {m.monthNum}
                          </td>
                          <td className="py-1 px-0.5 border-r border-slate-300 font-mono text-[9px] leading-tight">
                            <div>{weeklySteps.slice(0, 2).join(' ')}</div>
                            <div>{weeklySteps.slice(2).join(' ')}</div>
                          </td>
                          <td className="py-1 px-0.5 font-bold font-mono border-r border-slate-300 text-slate-900">
                            ₹{m.cumulativeTotal}
                          </td>
                          <td className="py-1 px-0.5 border-r border-slate-300 font-mono text-[9px]">
                            {m.txDate ? m.txDate : m.isFullyPaid ? 'जमा' : '-'}
                          </td>
                          <td className="py-1 px-0.5">
                            {m.isFullyPaid ? (
                              <span className="inline-flex items-center gap-0.5 text-emerald-700 font-bold text-[9px]">
                                <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                                <span>जमा ✓</span>
                              </span>
                            ) : m.isNextDue ? (
                              <button
                                type="button"
                                onClick={() => onDepositNext(m.monthNum)}
                                className="px-1.5 py-0.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded font-black text-[9px] transition cursor-pointer shadow-xs whitespace-nowrap"
                              >
                                + भरा
                              </button>
                            ) : (
                              <span className="text-slate-300 text-[9px]">बाकी</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Half: Months 15 to 30 */}
            <div className="border border-slate-400 rounded-xl overflow-hidden bg-white shadow-xs min-w-0 flex flex-col justify-between">
              <div>
                <div className="bg-amber-100/80 border-b border-slate-400 px-3 py-1 font-black text-xs text-amber-950 flex justify-between items-center">
                  <span>भाग २ (महिना १५ ते ३०) • दरमहा ₹५००</span>
                  <span className="font-mono text-emerald-800">एकूण: ₹८,००० (एकूण ₹१५,०००)</span>
                </div>
                <div className="w-full overflow-x-auto min-w-0">
                  <table className="w-full text-center border-collapse text-[10px] table-fixed min-w-[320px]">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase">
                        <th className="w-[12%] py-1 px-0.5 border-r border-slate-300">सो.क्र.</th>
                        <th className="w-[28%] py-1 px-0.5 border-r border-slate-300">हप्ते (रुपये)</th>
                        <th className="w-[22%] py-1 px-0.5 border-r border-slate-300">र.नं.</th>
                        <th className="w-[20%] py-1 px-0.5 border-r border-slate-300">दिनांक</th>
                        <th className="w-[18%] py-1 px-0.5">स्थिती / सही</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthsList.slice(14, 30).map((m) => (
                        <tr
                          key={m.monthNum}
                          className={`border-b border-slate-200 transition ${
                            m.isFullyPaid
                              ? 'bg-emerald-50/70 text-slate-950'
                              : m.isPartiallyPaid
                              ? 'bg-amber-50 text-slate-950'
                              : m.isNextDue
                              ? 'bg-amber-100/60 text-amber-950 font-bold'
                              : 'text-slate-500'
                          }`}
                        >
                          <td className="py-1 px-0.5 font-bold font-mono border-r border-slate-300 bg-slate-50">
                            {m.monthNum}
                          </td>
                          <td className="py-1 px-0.5 border-r border-slate-300 font-mono text-[9px] leading-tight">
                            <div>{weeklySteps.slice(0, 2).join(' ')}</div>
                            <div>{weeklySteps.slice(2).join(' ')}</div>
                          </td>
                          <td className="py-1 px-0.5 font-bold font-mono border-r border-slate-300 text-slate-900">
                            ₹{m.cumulativeTotal}
                          </td>
                          <td className="py-1 px-0.5 border-r border-slate-300 font-mono text-[9px]">
                            {m.txDate ? m.txDate : m.isFullyPaid ? 'जमा' : '-'}
                          </td>
                          <td className="py-1 px-0.5">
                            {m.isFullyPaid ? (
                              <span className="inline-flex items-center gap-0.5 text-emerald-700 font-bold text-[9px]">
                                <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                                <span>जमा ✓</span>
                              </span>
                            ) : m.isNextDue ? (
                              <button
                                type="button"
                                onClick={() => onDepositNext(m.monthNum)}
                                className="px-1.5 py-0.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded font-black text-[9px] transition cursor-pointer shadow-xs whitespace-nowrap"
                              >
                                + भरा
                              </button>
                            ) : (
                              <span className="text-slate-300 text-[9px]">बाकी</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bonus & Total Banner (Matching physical card photo) - Strictly Bonus Rs. 500/- and Total Rs. 15,500/- */}
              <div className="bg-amber-500/25 border-t-2 border-amber-600 p-2 text-center font-bold space-y-0.5">
                <div className="text-amber-950 font-black text-sm">
                  Bonus Rs. 500/-
                </div>
                <div className="text-slate-950 font-black text-lg font-mono">
                  Total Rs. 15,500/-
                </div>
                <div className="text-[10px] text-slate-700">
                  (३० महिने पूर्ण भरल्यानंतर ₹१५,००० + ₹५०० बोनस = ₹१५,५०० परतावा अथवा वस्तू)
                </div>
              </div>
            </div>
          </div>

          {/* Mathematical Reconciliation Summary - Strictly ₹15,000 Scheme Target & ₹15,500 Maturity */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-100 p-2.5 sm:p-3 rounded-xl border border-slate-300 text-center font-mono">
            <div>
              <span className="text-[10px] text-slate-600 font-sans block">योजना उद्दिष्ट</span>
              <span className="font-bold text-sm text-slate-900">₹15,000</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-600 font-sans block">आजवर एकूण जमा</span>
              <span className="font-black text-sm text-emerald-700">₹{fin.totalPaid.toLocaleString('en-IN')}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-600 font-sans block">शिल्लक बाकी देय</span>
              <span className="font-black text-sm text-rose-700">₹{Math.max(0, 15000 - fin.totalPaid).toLocaleString('en-IN')}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-600 font-sans block">मॅच्युरिटी मूल्य</span>
              <span className="font-black text-sm text-amber-700">₹15,500</span>
            </div>
          </div>

          {/* Bottom Section from Physical Card: Bill Details + Disclaimer + QR + 16 Rules */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 pt-2 border-t-2 border-slate-900 min-w-0">
            {/* Left: Bill Section & Guarantee Disclaimer (5 cols) */}
            <div className={`xl:col-span-5 space-y-2 border-2 p-3 rounded-xl text-[10px] min-w-0 transition ${
              hasBill ? 'border-emerald-500 bg-emerald-50/40' : 'border-slate-300 bg-slate-50'
            }`}>
              <div className="font-bold text-slate-900 uppercase border-b border-slate-300 pb-1 flex justify-between items-center">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-700" />
                  <span>बिल व खरेदी नोंद (Bill / Item)</span>
                  {hasBill && (
                    <span className="bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded">
                      ✓ नोंद पूर्ण
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditingItem(true)}
                  className="text-amber-800 hover:text-amber-900 font-black flex items-center gap-0.5 cursor-pointer text-[10px] bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>{hasBill ? 'बदला' : '+ नोंद करा'}</span>
                </button>
              </div>

              {/* Item delivery details if recorded */}
              <div className="space-y-1 font-mono text-[10px]">
                <div className="flex justify-between border-b border-dashed border-slate-300 pb-0.5">
                  <span className="font-sans text-slate-600 font-semibold">Bill No. :</span>
                  <span className={`font-bold ${member.itemBillNo ? 'text-slate-950 font-black' : 'text-slate-400'}`}>
                    {member.itemBillNo || '____________________'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-dashed border-slate-300 pb-0.5">
                  <span className="font-sans text-slate-600 font-semibold">Date :</span>
                  <span className={`font-bold ${member.itemBillDate ? 'text-slate-950' : 'text-slate-400'}`}>
                    {member.itemBillDate || '____________________'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-dashed border-slate-300 pb-0.5">
                  <span className="font-sans text-slate-600 font-semibold">Item (वस्तू) :</span>
                  <span className={`font-bold uppercase ${member.deliveredItemName ? 'text-emerald-900 font-black' : 'text-slate-400'}`}>
                    {member.deliveredItemName || '____________________'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-dashed border-slate-300 pb-0.5">
                  <span className="font-sans text-slate-600 font-semibold">Amt :</span>
                  <span className={`font-bold ${member.itemTotalAmount ? 'text-slate-950 font-black' : 'text-slate-400'}`}>
                    {member.itemTotalAmount ? `₹${member.itemTotalAmount.toLocaleString('en-IN')}` : '____________________'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-dashed border-slate-300 pb-0.5">
                  <span className="font-sans text-slate-600 font-semibold">Advance :</span>
                  <span className={`font-bold ${member.itemAdvancePaid ? 'text-emerald-700 font-black' : 'text-slate-400'}`}>
                    {member.itemAdvancePaid ? `₹${member.itemAdvancePaid.toLocaleString('en-IN')}` : '____________________'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-dashed border-slate-300 pb-0.5">
                  <span className="font-sans text-slate-600 font-semibold">Balance :</span>
                  <span className={`font-bold ${member.itemBalanceDue !== undefined && member.itemBalanceDue > 0 ? 'text-rose-700 font-black' : member.itemBalanceDue === 0 ? 'text-emerald-700 font-black' : 'text-slate-400'}`}>
                    {member.itemBalanceDue !== undefined ? `₹${member.itemBalanceDue.toLocaleString('en-IN')}` : '____________________'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-dashed border-slate-300 pb-0.5">
                  <span className="font-sans text-slate-600 font-semibold">Due Dt. :</span>
                  <span className={`font-bold ${member.itemDueDt ? 'text-slate-900' : 'text-slate-400'}`}>
                    {member.itemDueDt || '____________________'}
                  </span>
                </div>
              </div>

              {!hasBill && (
                <div
                  onClick={() => setIsEditingItem(true)}
                  className="p-1.5 rounded-lg bg-amber-100/70 border border-amber-300 text-center text-amber-900 text-[9.5px] font-bold cursor-pointer hover:bg-amber-100 transition"
                >
                  सभासदाने वस्तू नेली असल्यास येथे क्लिक करून बिल नोंद करा ➔
                </div>
              )}

              {/* Warranty Disclaimer from card */}
              <div className="p-2 rounded-lg bg-amber-50 border border-amber-300 text-[9px] leading-tight text-amber-950">
                <span className="font-bold">महत्त्वाची सूचना: </span>
                {SCHEME_WARRANTY_DISCLAIMER}
              </div>

              {/* QR code box */}
              <div className="flex items-center gap-2 pt-1 border-t border-slate-200">
                <div className="w-12 h-12 bg-white p-0.5 border border-slate-400 rounded shrink-0 flex items-center justify-center">
                  <QrCode className="w-10 h-10 text-slate-900" />
                </div>
                <span className="text-[8.5px] text-slate-600 leading-tight">
                  ही पावती व योजनेची संपूर्ण माहिती अथवा कोणत्याही अडचणीकरिता हा QR कोड स्कॅन करा.
                </span>
              </div>
            </div>

            {/* Right: All 16 Rules & Conditions (7 cols) */}
            <div className="xl:col-span-7 border border-slate-300 p-3 rounded-xl bg-slate-50 text-[9.5px] space-y-1.5 flex flex-col justify-between min-w-0">
              <div>
                <h3 className="font-black text-xs text-amber-950 uppercase border-b border-slate-300 pb-1 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>नियम व अटी :- (Rules & Conditions)</span>
                </h3>
                <ol className="space-y-1 pt-1 text-slate-800 leading-tight">
                  {SCHEME_OFFICIAL_RULES_16.map((rule, idx) => (
                    <li key={idx} className="flex gap-1">
                      <span className="text-slate-900 font-normal">{rule}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Declaration & Signatures */}
              <div className="pt-2 border-t border-slate-300 space-y-2">
                <p className="text-[8.5px] text-slate-600 italic">
                  मी खाली सही करणार मला श्री साई एंटरप्रायझेस ची वस्तू खरेदी करण्याकरिता या योजनेत सहभागी होत आहे.
                </p>
                <div className="flex justify-between items-end pt-3 text-[9.5px] font-bold text-slate-800">
                  <div className="text-center">
                    <div className="w-28 border-b border-slate-400 mb-1"></div>
                    <span>कार्ड काढणाऱ्याची सही</span>
                  </div>
                  <div className="text-center">
                    <div className="w-28 border-b border-slate-400 mb-1"></div>
                    <span>ग्राहकाची सही</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Tab 2: Vastu / Item Delivery & Khata Form */}
      {activeCardTab === 'item' && (
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-black text-white uppercase flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-amber-400" />
                <span>नेलेली वस्तू व खरेदी बिल खातेवही (Item Delivered / Khata)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                ग्राहकाने योजनेतून नेलेली वस्तू (दिवाण, सोफा, कपाट, फ्रीज, इ.) आणि चालू हप्ते/बाकी हिशोब.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsEditingItem(true)}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 cursor-pointer shadow-sm"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>नोंद बदला (Edit Details)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-amber-400 uppercase block">वस्तू व बिल तपशील</span>
              <div className="text-xs space-y-1.5">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">वस्तूचे नाव:</span>
                  <span className="font-bold text-white uppercase">{member.deliveredItemName || 'नोंद नाही'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">बिल क्रमांक:</span>
                  <span className="font-mono text-white">{member.itemBillNo || 'नोंद नाही'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">बिल तारीख:</span>
                  <span className="font-mono text-white">{member.itemBillDate || 'नोंद नाही'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">बाकी देण्याची तारीख (Due Dt.):</span>
                  <span className="font-mono text-amber-400">{member.itemDueDt || 'नोंद नाही'}</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-emerald-400 uppercase block">रक्कम व हिशोब ताळेबंद</span>
              <div className="text-xs space-y-1.5">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">वस्तू एकूण किंमत:</span>
                  <span className="font-bold text-white font-mono">
                    ₹{(member.itemTotalAmount || fin.schemeTarget).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">कार्ड जमा + अ‍ॅडव्हान्स:</span>
                  <span className="font-bold text-emerald-400 font-mono">
                    ₹{(member.itemAdvancePaid || fin.totalPaid).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">शिल्लक बाकी रक्कम:</span>
                  <span className="font-bold text-rose-400 font-mono">
                    ₹{(member.itemBalanceDue || fin.balanceDue).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">मॅच्युरिटी बोनस लाभ:</span>
                  <span className="font-bold text-amber-400 font-mono">
                    +₹{fin.bonusAmount}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Tab 3: All 16 Rules Dedicated Screen */}
      {activeCardTab === 'rules' && (
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-black text-amber-400 uppercase flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>३०-महिने बचत योजना • अधिकृत १६ नियम व अटी</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                श्री साई एंटरप्रायझेस, मातोश्री सभागृह समोर, आर्वी रोड, पंजाब कॉलनी, वर्धा
              </p>
            </div>
            <button
              type="button"
              onClick={handleShareRulesWhatsApp}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 cursor-pointer shadow-sm"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp वर पाठवा</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {SCHEME_OFFICIAL_RULES_16.map((rule, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 leading-relaxed flex gap-2"
              >
                <span className="font-mono font-bold text-amber-400 shrink-0">#{idx + 1}</span>
                <span>{rule}</span>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300">
            <strong>गॅरंटी व वॉरंटी टीप: </strong> {SCHEME_WARRANTY_DISCLAIMER}
          </div>
        </div>
      )}

      {/* Edit Item Delivery Modal */}
      {isEditingItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-amber-400" />
                <span>वस्तू नेली असल्यास खरेदी नोंद (Attach Delivered Item)</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsEditingItem(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Helper Chips */}
            <div className="flex flex-wrap items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800 text-[11px]">
              <span className="text-slate-400 font-bold">जलद पर्याय:</span>
              <button
                type="button"
                onClick={handleQuickFillMaturityBill}
                className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg font-bold cursor-pointer transition flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>₹१५,५०० योजना मॅच्युरिटी बिल</span>
              </button>

              {matchedStoreInvoice && (
                <button
                  type="button"
                  onClick={() => handleQuickFillFromInvoice(matchedStoreInvoice)}
                  className="px-2.5 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 rounded-lg font-bold cursor-pointer transition flex items-center gap-1"
                >
                  <FileText className="w-3 h-3 text-indigo-400" />
                  <span>स्टोअर बिल #{matchedStoreInvoice.invoiceNo} (₹{matchedStoreInvoice.grandTotal.toLocaleString('en-IN')})</span>
                </button>
              )}
            </div>

            <form onSubmit={handleSaveItemDetails} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">
                  नेलेल्या वस्तूचे नाव (Item Name):
                </label>
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="उदा. दिवाण 5x6 / गोदरेज कपाट / एलजी फ्रीज"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">बिल क्र. (Bill No.):</label>
                  <input
                    type="text"
                    value={billNo}
                    onChange={(e) => setBillNo(e.target.value)}
                    placeholder="उदा. SSE-2024-89"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">बिल दिनांक (Date):</label>
                  <input
                    type="date"
                    value={billDate}
                    onChange={(e) => setBillDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">एकूण किंमत (Amt):</label>
                  <input
                    type="number"
                    value={itemAmount}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : Number(e.target.value);
                      setItemAmount(val);
                      if (val !== '' && advancePaid !== '') {
                        setBalanceDue(Math.max(0, val - Number(advancePaid)));
                      }
                    }}
                    placeholder="15500"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">अ‍ॅडव्हान्स / जमा:</label>
                  <input
                    type="number"
                    value={advancePaid}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : Number(e.target.value);
                      setAdvancePaid(val);
                      if (itemAmount !== '' && val !== '') {
                        setBalanceDue(Math.max(0, Number(itemAmount) - val));
                      }
                    }}
                    placeholder="8000"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400 font-mono font-bold text-emerald-400"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">शिल्लक बाकी:</label>
                  <input
                    type="number"
                    value={balanceDue}
                    onChange={(e) => setBalanceDue(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="7500"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400 font-mono font-bold text-rose-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">
                  बाकी देण्याची तारीख (Due Dt.):
                </label>
                <input
                  type="date"
                  value={dueDt}
                  onChange={(e) => setDueDt(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
                <div>
                  {hasBill && (
                    <button
                      type="button"
                      onClick={handleClearBillDetails}
                      className="px-3 py-1.5 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 cursor-pointer font-bold flex items-center gap-1 text-[11px]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>बिल नोंद हटवा</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingItem(false)}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-white cursor-pointer font-bold"
                  >
                    रद्द करा
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black cursor-pointer flex items-center gap-1.5 shadow-md active:scale-95 transition"
                  >
                    <Save className="w-4 h-4" />
                    <span>जतन करा (Save)</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
