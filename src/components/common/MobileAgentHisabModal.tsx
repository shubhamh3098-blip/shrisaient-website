import React, { useState, useMemo } from 'react';
import {
  X,
  Smartphone,
  Search,
  CreditCard,
  BookOpen,
  Receipt,
  Phone,
  MessageCircle,
  CheckCircle2,
  AlertCircle,
  Filter,
  Printer,
  ChevronRight,
  TrendingUp,
  MapPin,
  Calendar,
  Sparkles,
  ArrowDownCircle
} from 'lucide-react';
import { Customer, CardMember, StoreData, BillReceipt, CardTransaction } from '../../types';
import { StorageService } from '../../services/storageService';
import { useTheme } from '../../context/ThemeContext';
import { getCardFinancialSummary, getCardBalanceDue } from '../../utils/schemeUtils';

interface MobileAgentHisabModalProps {
  storeData: StoreData;
  onClose: () => void;
  onRefreshData: () => void;
  onOpenCustomerKhata: (customer: Customer) => void;
  onPrintReceipt: (receipt: BillReceipt) => void;
}

export const MobileAgentHisabModal: React.FC<MobileAgentHisabModalProps> = ({
  storeData,
  onClose,
  onRefreshData,
  onOpenCustomerKhata,
  onPrintReceipt,
}) => {
  const { isDayMode } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('All');
  const [filterType, setFilterType] = useState<'all' | 'scheme' | 'due'>('all');
  const [selectedAgent, setSelectedAgent] = useState('All');
  const [activeCollectMember, setActiveCollectMember] = useState<{
    member: CardMember;
    customer?: Customer;
  } | null>(null);
  const [collectAmount, setCollectAmount] = useState('1000');
  const [collectMode, setCollectMode] = useState<'Cash' | 'UPI'>('Cash');
  const [collectSuccessMsg, setCollectSuccessMsg] = useState<string | null>(null);

  // Extract distinct villages
  const villages = useMemo(() => {
    const set = new Set<string>();
    storeData.customers.forEach((c) => {
      if (c.village) set.add(c.village);
      else if (c.city) set.add(c.city);
    });
    storeData.cardMembers.forEach((m) => {
      if (m.village) set.add(m.village);
    });
    return ['All', ...Array.from(set)];
  }, [storeData]);

  // Calculations
  const totalCustomers = storeData.customers.length;
  const totalSchemeMembers = storeData.cardMembers.length;
  const totalCustomerDues = storeData.customers.reduce((acc, c) => acc + (c.currentBalance || 0), 0);

  // Today's collections breakdown (Cash vs UPI)
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayCashScheme = storeData.cardTransactions
    .filter((c) => c.date.startsWith(todayStr) && c.paymentMode === 'Cash')
    .reduce((acc, c) => acc + c.amount, 0);
  const todayUpiScheme = storeData.cardTransactions
    .filter((c) => c.date.startsWith(todayStr) && c.paymentMode === 'UPI')
    .reduce((acc, c) => acc + c.amount, 0);

  const todayCashReceipts = storeData.billReceipts
    .filter((r) => r.date.startsWith(todayStr) && r.paymentMode === 'Cash')
    .reduce((acc, r) => acc + r.amountPaid, 0);
  const todayUpiReceipts = storeData.billReceipts
    .filter((r) => r.date.startsWith(todayStr) && r.paymentMode === 'UPI')
    .reduce((acc, r) => acc + r.amountPaid, 0);

  const todayTotalCash = todayCashScheme + todayCashReceipts;
  const todayTotalUpi = todayUpiScheme + todayUpiReceipts;
  const todayCollectionsTotal = todayTotalCash + todayTotalUpi;

  // Filtered customer & card list (includes standalone cards as well)
  const filteredList = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const list: Array<{ customer?: Customer; card?: CardMember }> = [];

    // Map existing customers
    storeData.customers.forEach((cust) => {
      const card = storeData.cardMembers.find(
        (m) =>
          m.phone === cust.phone ||
          m.memberName.toLowerCase() === cust.name.toLowerCase()
      );
      list.push({ customer: cust, card });
    });

    // Add standalone cards not linked to any customer
    storeData.cardMembers.forEach((card) => {
      const alreadyIncluded = list.some((item) => item.card?.id === card.id);
      if (!alreadyIncluded) {
        list.push({ card });
      }
    });

    return list.filter(({ customer: cust, card }) => {
      const name = cust?.name || card?.memberName || '';
      const phone = cust?.phone || card?.phone || '';
      const village = cust?.village || cust?.city || card?.village || '';
      const cardNo = card?.cardNo || '';

      const matchesSearch =
        !q ||
        name.toLowerCase().includes(q) ||
        phone.includes(q) ||
        village.toLowerCase().includes(q) ||
        cardNo.toLowerCase().includes(q);

      const matchesVillage =
        selectedVillage === 'All' ||
        village === selectedVillage;

      if (!matchesSearch || !matchesVillage) return false;

      if (filterType === 'scheme') {
        return !!card;
      }
      if (filterType === 'due') {
        return (cust?.currentBalance || 0) > 0;
      }
      return true;
    });
  }, [storeData, searchQuery, selectedVillage, filterType]);

  // Daily Agent Hishob Share to Shop WhatsApp
  const handleShareDailyAgentSummary = () => {
    const shopPhone = storeData.settings.phone || '8600122978';
    let text = `🚩 *श्री साई एंटरप्रायजेस, वर्धा - दैनिक एजंट हिशोब* 🚩\n`;
    text += `📅 दिनांक: ${new Date().toLocaleDateString('mr-IN')}\n`;
    text += `⏰ वेळ: ${new Date().toLocaleTimeString('mr-IN', { hour: '2-digit', minute: '2-digit' })}\n`;
    text += `--------------------------------\n`;
    text += `💵 *हातातील रोख (Cash in Hand): ₹${todayTotalCash.toLocaleString('en-IN')}*\n`;
    text += `📱 *ऑनलाइन जमा (UPI / PhonePe): ₹${todayTotalUpi.toLocaleString('en-IN')}*\n`;
    text += `💰 *आजची एकूण वसुली (Total): ₹${todayCollectionsTotal.toLocaleString('en-IN')}*\n`;
    text += `📝 एकूण पावती नोंदी: ${storeData.cardTransactions.filter(c => c.date.startsWith(todayStr)).length + storeData.billReceipts.filter(r => r.date.startsWith(todayStr)).length} हप्ते/पावत्या\n`;
    text += `--------------------------------\n`;
    text += `✅ दुकान काऊंटरला रोख रक्कम व हिशोब पूर्ण सुपूर्द केला.\n`;
    text += `📍 मातोश्री सभागृह समोर, आर्वी रोड, वर्धा.`;

    const url = `https://wa.me/91${shopPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Quick WhatsApp Hisab Message
  const handleShareWhatsAppHisab = (cust: Customer, card?: CardMember) => {
    let msg = `*श्री साई एंटरप्रायझेस, वर्धा (मोबाईल पावती व हिशोब)*\n`;
    msg += `ग्राहक: *${cust.name}*\n`;
    msg += `मोबाईल: ${cust.phone}\n`;
    msg += `गाव / पत्ता: ${cust.village || cust.city || 'Wardha'}\n`;
    msg += `--------------------------------\n`;

    if (cust.currentBalance > 0) {
      msg += `📋 *खातेवही शिल्लक बाकी (Khata Due): ₹${cust.currentBalance.toLocaleString('en-IN')}*\n`;
    } else {
      msg += `📋 *खातेवही बाकी: निरंक (Nil / All Clear)*\n`;
    }

    if (card) {
      const fin = getCardFinancialSummary(card);
      msg += `🎁 *३०-महिने कार्ड योजना:* ${card.cardNo}\n`;
      msg += `हप्ते भरले: *${fin.totalPaidMonths}/${fin.durationMonths} महिने* (₹${fin.totalPaid.toLocaleString('en-IN')} जमा)\n`;
      msg += `शिल्लक बाकी: *₹${fin.balanceDue.toLocaleString('en-IN')} बाकी* (${fin.remainingMonths} महिने)\n`;
      msg += `योजना उद्दिष्ट: *₹${fin.schemeTarget.toLocaleString('en-IN')}* (हिशोब पडताळणी: ₹${fin.totalPaid.toLocaleString('en-IN')} + ₹${fin.balanceDue.toLocaleString('en-IN')} = ₹${fin.schemeTarget.toLocaleString('en-IN')} ✅)\n`;
    }

    msg += `--------------------------------\n`;
    msg += `अधिक माहितीसाठी संपर्क: श्री साई एंटरप्रायझेस, मातोश्री सभागृह समोर, आर्वी रोड, वर्धा.\n📞 8600122978 / 9175537365 / 8766486915\nधन्यवाद! 🙏`;

    const encoded = encodeURIComponent(msg);
    const phone = cust.phone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${phone ? '91' + phone : ''}?text=${encoded}`, '_blank');
  };

  // Quick Scheme Installment Collection Handler
  const handleCollectSchemeInstallment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCollectMember) return;

    const { member, customer } = activeCollectMember;
    const amt = parseFloat(collectAmount) || 1000;
    const nextMonth = member.totalPaidMonths + 1;

    // Collect installment in storeData
    StorageService.collectCardInstallment({
      cardMemberId: member.id,
      monthNumber: nextMonth,
      amount: amt,
      paymentMode: collectMode,
      collectedBy: 'Mobile Agent (Field)',
      remarks: `Installment #${nextMonth} collected via Mobile Agent Shortcut`,
    });

    // Also generate a corresponding BillReceipt so it can be printed immediately
    if (customer) {
      const receipt = StorageService.createBillReceipt({
        customerId: customer.id,
        customerName: customer.name,
        amountPaid: amt,
        paymentMode: collectMode,
        remarks: `30-Month Scheme Card #${member.cardNo} Month ${nextMonth}/30 Payment`,
        handledBy: 'Mobile Field Agent',
      });
      onPrintReceipt(receipt);
    }

    onRefreshData();
    setCollectSuccessMsg(
      `पावती यशस्वी! ${member.memberName} (कार्ड #${member.cardNo}) चे ₹${amt} जमा झाले.`
    );
    setActiveCollectMember(null);

    setTimeout(() => {
      setCollectSuccessMsg(null);
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className={`w-full max-w-5xl rounded-2xl shadow-2xl border flex flex-col max-h-[94vh] overflow-hidden transition-colors ${
        isDayMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
      }`}>
        {/* Top Header */}
        <div className={`p-4 border-b flex items-center justify-between sticky top-0 z-20 ${
          isDayMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/20">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg">
                  मोबाईल एजंट कार्ड पावती व सर्व ग्राहक हिशोब
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  Field Agent Mode
                </span>
              </div>
              <p className={`text-xs ${isDayMode ? 'text-slate-500' : 'text-slate-400'}`}>
                सर्व ग्राहकांची उधारी, कार्ड योजना हिशोब, त्वरित पावती व WhatsApp शेअरिंग
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-xl transition ${
              isDayMode ? 'text-slate-400 hover:text-slate-800 hover:bg-slate-200' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Alert Banner */}
        {collectSuccessMsg && (
          <div className="bg-emerald-500 text-slate-950 px-4 py-2.5 text-xs font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{collectSuccessMsg}</span>
            </div>
            <button onClick={() => setCollectSuccessMsg(null)} className="text-slate-950 font-black">✕</button>
          </div>
        )}

        {/* Summary Stats Bar */}
        <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 border-b text-xs ${
          isDayMode ? 'bg-slate-100/70 border-slate-200' : 'bg-slate-950/80 border-slate-800'
        }`}>
          <div className={`p-2.5 rounded-xl border ${
            isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <span className={`text-[10px] uppercase font-bold ${isDayMode ? 'text-slate-500' : 'text-slate-400'}`}>
              एकूण ग्राहक संख्या
            </span>
            <p className="text-base font-bold mt-0.5">{totalCustomers} Customers</p>
          </div>

          <div className={`p-2.5 rounded-xl border ${
            isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">
              ३०-महिने कार्ड सभासद
            </span>
            <p className="text-base font-bold text-amber-600 dark:text-amber-400 mt-0.5">
              {totalSchemeMembers} Active Cards
            </p>
          </div>

          <div className={`p-2.5 rounded-xl border ${
            isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <span className="text-[10px] uppercase font-bold text-rose-500">
              एकूण शिल्लक बाकी हिशोब
            </span>
            <p className="text-base font-bold text-rose-500 font-mono mt-0.5">
              ₹{totalCustomerDues.toLocaleString('en-IN')}
            </p>
          </div>

          <div className={`p-2.5 rounded-xl border ${
            isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">
              आजची एजंट वसुली
            </span>
            <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
              ₹{todayCollectionsTotal.toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className={`p-3.5 border-b space-y-2.5 ${
          isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="ग्राहक नाव, मोबाईल नंबर, गाव किंवा कार्ड नंबर (उदा. SSE-CD-0101) शोधा..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs border focus:outline-none focus:border-emerald-500 ${
                  isDayMode
                    ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                    : 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                }`}
              />
            </div>

            {/* Village Selector */}
            <div className="flex gap-2">
              <select
                value={selectedVillage}
                onChange={(e) => setSelectedVillage(e.target.value)}
                className={`rounded-xl px-3 py-2 text-xs border focus:outline-none focus:border-emerald-500 ${
                  isDayMode ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              >
                {villages.map((v) => (
                  <option key={v} value={v}>
                    {v === 'All' ? 'सर्व गावे (All Villages)' : v}
                  </option>
                ))}
              </select>

              {/* Filter Tabs */}
              <div className="flex rounded-xl p-1 bg-slate-200 dark:bg-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setFilterType('all')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                    filterType === 'all'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white'
                  }`}
                >
                  सर्व
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('scheme')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                    filterType === 'scheme'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white'
                  }`}
                >
                  कार्ड योजना
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('due')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                    filterType === 'due'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white'
                  }`}
                >
                  बाकी उधारी
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Customer List Body */}
        <div className={`flex-1 overflow-y-auto p-3.5 space-y-3 ${
          isDayMode ? 'bg-slate-50/50' : 'bg-slate-950/50'
        }`}>
          {filteredList.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              कोणतेही रेकॉर्ड सापडले नाहीत. कृपया वेगळा शोध शब्द टाका.
            </div>
          ) : (
            filteredList.map((entry, idx) => {
              const cust = entry.customer;
              const card = entry.card;
              const displayName = cust?.name || card?.memberName || 'ग्राहक';
              const displayPhone = cust?.phone || card?.phone || '';
              const displayVillage = cust?.village || cust?.city || card?.village || 'Wardha';
              const khataBalance = cust?.currentBalance || 0;
              const totalPurchased = cust?.totalPurchased || 0;
              const rowKey = cust?.id || card?.id || `entry-${idx}`;

              const effectiveCustomer: Customer = cust || {
                id: card?.id ? `cust_${card.id}` : `cust_entry_${idx}`,
                name: displayName,
                phone: displayPhone || '0',
                address: displayVillage,
                city: displayVillage,
                creditLimit: 20000,
                currentBalance: 0,
                totalPurchased: 0,
                createdAt: new Date().toISOString(),
              };

              return (
                <div
                  key={rowKey}
                  className={`p-3.5 rounded-2xl border transition-all shadow-sm ${
                    isDayMode
                      ? 'bg-white border-slate-200/90 hover:border-emerald-300'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    {/* Customer Core Info */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {displayName}
                        </span>
                        {card && (
                          <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold flex items-center gap-1">
                            <CreditCard className="w-3 h-3" />
                            <span>{card.cardNo}</span>
                          </span>
                        )}
                        <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                          isDayMode ? 'bg-slate-100 text-slate-600' : 'bg-slate-800 text-slate-300'
                        }`}>
                          📍 {displayVillage}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                        {displayPhone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            <a href={`tel:${displayPhone}`} className="hover:underline font-mono">
                              {displayPhone}
                            </a>
                          </span>
                        )}
                        <span>•</span>
                        <span>खरेदी: ₹{totalPurchased.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    {/* Dues & Scheme Badges */}
                    <div className="flex items-center gap-4 flex-wrap">
                      {/* Khata Balance */}
                      <div className="text-right">
                        <div className="text-[10px] uppercase font-bold text-slate-400">खाते बाकी (Due)</div>
                        <div className={`text-sm font-bold font-mono ${
                          khataBalance > 0 ? 'text-rose-500' : 'text-emerald-500'
                        }`}>
                          {khataBalance > 0 ? `₹${khataBalance.toLocaleString('en-IN')}` : '₹0 (Clear)'}
                        </div>
                      </div>

                      {/* Card Scheme Months Progress */}
                      {card && (
                        <div className="text-right">
                          <div className="text-[10px] uppercase font-bold text-amber-500">योजना हप्ते</div>
                          <div className="text-xs font-bold text-amber-600 dark:text-amber-400">
                            {card.totalPaidMonths}/{card.durationMonths} भरले
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            बाकी: ₹{getCardBalanceDue(card).toLocaleString('en-IN')}
                          </div>
                        </div>
                      )}

                      {/* Quick Action Buttons */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* 1. Quick Scheme Installment Button (If has card) */}
                        {card && card.status !== 'Matured' && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveCollectMember({ member: card, customer: effectiveCustomer });
                              setCollectAmount(card.monthlyAmount.toString());
                            }}
                            className="px-2.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1 shadow-sm transition active:scale-95"
                            title="Collect Monthly Scheme Installment"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>हप्ता ₹{card.monthlyAmount}</span>
                          </button>
                        )}

                        {/* 2. WhatsApp Hisab Share */}
                        <button
                          type="button"
                          onClick={() => handleShareWhatsAppHisab(effectiveCustomer, card)}
                          className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-xl transition"
                          title="WhatsApp वर हिशोब पाठवा"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>

                        {/* 3. Open Customer Khata */}
                        <button
                          type="button"
                          onClick={() => onOpenCustomerKhata(effectiveCustomer)}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 border transition ${
                            isDayMode
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                          }`}
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>हिशोब खाते</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Sub-form for Fast Scheme Collection */}
        {activeCollectMember && (
          <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className={`w-full max-w-md rounded-2xl p-5 border shadow-2xl space-y-4 ${
              isDayMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
            }`}>
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-500">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">योजना हप्ता पावती तयार करा</h4>
                    <p className="text-[11px] text-slate-400">
                      कार्ड #{activeCollectMember.member.cardNo} • {activeCollectMember.member.memberName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveCollectMember(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCollectSchemeInstallment} className="space-y-3 text-xs">
                <div className={`p-3 rounded-xl border space-y-1 ${
                  isDayMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                }`}>
                  <div className="flex justify-between">
                    <span className="text-slate-400">सभासद नाव:</span>
                    <span className="font-bold">{activeCollectMember.member.memberName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">हप्ता क्रमांक:</span>
                    <span className="font-bold text-amber-500">
                      महिना #{activeCollectMember.member.totalPaidMonths + 1} / {activeCollectMember.member.durationMonths}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">आत्तापर्यंत जमा:</span>
                    <span className="font-mono text-emerald-500 font-bold">
                      ₹{activeCollectMember.member.totalAmountPaid.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block font-bold mb-1">जमा रक्कम (Installment Amount) ₹ *</label>
                  <input
                    type="number"
                    min="100"
                    value={collectAmount}
                    onChange={(e) => setCollectAmount(e.target.value)}
                    required
                    className={`w-full rounded-xl px-3 py-2 font-mono font-bold text-sm border focus:outline-none focus:border-amber-500 ${
                      isDayMode ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">पेमेंट प्रकार (Mode)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCollectMode('Cash')}
                      className={`py-2 rounded-xl font-bold border transition ${
                        collectMode === 'Cash'
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : isDayMode ? 'bg-slate-100 text-slate-700' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      💵 रोख (Cash)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCollectMode('UPI')}
                      className={`py-2 rounded-xl font-bold border transition ${
                        collectMode === 'UPI'
                          ? 'bg-indigo-600 text-white border-indigo-500'
                          : isDayMode ? 'bg-slate-100 text-slate-700' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      📱 PhonePe / UPI
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setActiveCollectMember(null)}
                    className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    रद्द करा
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold shadow-lg flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>पावती मारा & जमा करा</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
