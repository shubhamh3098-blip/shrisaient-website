import React, { useState, useMemo } from 'react';
import {
  Cake,
  Heart,
  Calendar,
  Gift,
  Phone,
  Share2,
  Sparkles,
  Users,
  Search,
  Filter,
  CheckCircle2,
  Percent,
  PartyPopper,
  MessageCircle
} from 'lucide-react';
import { StoreData, Customer, CardMember } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface BirthdayAnniversaryCrmViewProps {
  storeData: StoreData;
}

interface CelebrationContact {
  id: string;
  name: string;
  phone: string;
  event: 'Birthday' | 'Anniversary';
  dateStr: string;
  isToday: boolean;
  isUpcomingWeek: boolean;
  accountType: '30-Mo Scheme Card' | 'Showroom Customer';
  cardNo?: string;
  specialDiscountCode: string;
}

export const BirthdayAnniversaryCrmView: React.FC<BirthdayAnniversaryCrmViewProps> = ({
  storeData,
}) => {
  const { isDayMode } = useTheme();

  const [activeFilter, setActiveFilter] = useState<'all' | 'today' | 'upcoming'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Sample or extracted celebrations
  const celebrationList = useMemo(() => {
    const list: CelebrationContact[] = [
      {
        id: 'cel-1',
        name: 'Gajananrao Deshmukh',
        phone: '98224 55102',
        event: 'Birthday',
        dateStr: 'Today (आज)',
        isToday: true,
        isUpcomingWeek: false,
        accountType: 'Showroom Customer',
        specialDiscountCode: 'SAI-BDAY-500',
      },
      {
        id: 'cel-2',
        name: 'Sau. Anita & Ramesh Patil',
        phone: '91755 88901',
        event: 'Anniversary',
        dateStr: 'Today (आज)',
        isToday: true,
        isUpcomingWeek: false,
        accountType: '30-Mo Scheme Card',
        cardNo: 'CRD-1024',
        specialDiscountCode: 'SAI-ANNIV-1000',
      },
      {
        id: 'cel-3',
        name: 'Pravinji Wankhede',
        phone: '97664 12389',
        event: 'Birthday',
        dateStr: 'In 2 Days (२ दिवसात)',
        isToday: false,
        isUpcomingWeek: true,
        accountType: 'Showroom Customer',
        specialDiscountCode: 'SAI-BDAY-500',
      },
      {
        id: 'cel-4',
        name: 'Sunilrao & Rekhatai Gawande',
        phone: '94228 11902',
        event: 'Anniversary',
        dateStr: 'In 4 Days (४ दिवसात)',
        isToday: false,
        isUpcomingWeek: true,
        accountType: '30-Mo Scheme Card',
        cardNo: 'CRD-1089',
        specialDiscountCode: 'SAI-ANNIV-1000',
      },
      {
        id: 'cel-5',
        name: 'Sanjayji Thakre',
        phone: '98220 44101',
        event: 'Birthday',
        dateStr: 'In 5 Days',
        isToday: false,
        isUpcomingWeek: true,
        accountType: 'Showroom Customer',
        specialDiscountCode: 'SAI-BDAY-500',
      },
    ];

    return list;
  }, [storeData]);

  // Filtered
  const filteredCelebrations = celebrationList.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery);

    if (activeFilter === 'today') return matchSearch && c.isToday;
    if (activeFilter === 'upcoming') return matchSearch && c.isUpcomingWeek;
    return matchSearch;
  });

  // Send WhatsApp Wish + VIP Discount Voucher
  const handleSendWishWhatsApp = (c: CelebrationContact) => {
    const isBirthday = c.event === 'Birthday';
    const msg =
`🎉💐 *श्री साई इंटरप्रायझेस, वर्धा तर्फे हार्दिक शुभेच्छा!* 💐🎉

आदरणीय *${c.name}*,
आपणास ${isBirthday ? 'वाढदिवसाच्या' : 'लग्नाच्या वाढदिवसाच्या'} मनःपूर्वक हार्दिक शुभेच्छा! 🎂✨

आपले जीवन सुख, समृद्धी, उत्तम आरोग्य आणि भरभराटीने उजळून निघो हीच साईचरणी प्रार्थना.

🎁 *तुमच्यासाठी खास वाढदिवस भेट व्हाऊचर:*
आमच्या शोरूममधून कोणताही *सागवान सोफा, कपाट, एलईडी टीव्ही किंवा फ्रिज* खरेदीवर थेट *₹${isBirthday ? '500' : '1,000'} ची अतिरिक्त सूट!*
🏷️ कूपन कोड: *${c.specialDiscountCode}* (वैधता: पुढील १५ दिवस)

📍 *श्री साई इंटरप्रायझेस*
मुख्य बाजारपेठ, वर्धा.
📞 98220 11223 / 87664 86915`;

    const encoded = encodeURIComponent(msg);
    const phone = c.phone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/91${phone}?text=${encoded}`, '_blank');
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className={`p-4 sm:p-5 rounded-2xl border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
        isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-600 text-white shadow-md shadow-pink-500/20">
            <Cake className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight">
                Customer Birthday & Anniversary VIP Wishes CRM
              </h1>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-pink-500/15 text-pink-700 dark:text-pink-300 border border-pink-500/30">
                Auto Greetings + ₹500 Voucher
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Build lifetime customer loyalty with personalized WhatsApp greeting cards and exclusive furniture discount vouchers
            </p>
          </div>
        </div>

        {/* Quick count */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-pink-500/10 border border-pink-500/30 text-pink-600 dark:text-pink-400 text-xs font-bold flex items-center gap-1.5">
            <PartyPopper className="w-3.5 h-3.5" />
            <span>Today's VIPs: {celebrationList.filter(c => c.isToday).length}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Strip */}
      <div className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
        isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customer name or phone number..."
            className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs border focus:outline-none focus:border-pink-500 ${
              isDayMode ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
            }`}
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          {[
            { id: 'all', label: 'All Celebrations' },
            { id: 'today', label: 'Today Only (आजचे)' },
            { id: 'upcoming', label: 'Upcoming 7 Days (पुढील ७ दिवस)' },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setActiveFilter(f.id as any)}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer border ${
                activeFilter === f.id
                  ? 'bg-pink-500 text-white border-pink-500 shadow-xs'
                  : isDayMode
                  ? 'bg-slate-50 border-slate-200 text-slate-700'
                  : 'bg-slate-800 border-slate-700 text-slate-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Celebrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCelebrations.map((cel) => {
          const isBday = cel.event === 'Birthday';
          return (
            <div
              key={cel.id}
              className={`p-4 rounded-2xl border transition-all duration-300 flex flex-col justify-between space-y-3 ${
                cel.isToday
                  ? isDayMode
                    ? 'bg-pink-50/50 border-pink-300 shadow-md'
                    : 'bg-gradient-to-b from-pink-950/40 to-slate-900 border-pink-500/40 shadow-md shadow-pink-500/10'
                  : isDayMode
                  ? 'bg-white border-slate-200'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
                    isBday
                      ? 'bg-pink-500/20 text-pink-700 dark:text-pink-300 border border-pink-500/30'
                      : 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                  }`}>
                    {isBday ? <Cake className="w-3 h-3" /> : <Heart className="w-3 h-3" />}
                    <span>{cel.event}</span>
                  </span>

                  <span className={`text-[11px] font-bold ${
                    cel.isToday ? 'text-pink-600 dark:text-pink-400 animate-pulse' : 'text-slate-400'
                  }`}>
                    {cel.dateStr}
                  </span>
                </div>

                <div className="mt-3">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {cel.name}
                  </h3>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">
                    📞 {cel.phone}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>{cel.accountType} {cel.cardNo ? `(${cel.cardNo})` : ''}</span>
                  </div>
                </div>

                {/* Gift voucher card */}
                <div className="mt-3 p-2.5 rounded-xl bg-pink-500/10 border border-pink-500/20 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-pink-700 dark:text-pink-300 font-bold uppercase">
                      Gift Voucher:
                    </span>
                    <span className="font-mono font-bold text-pink-600 dark:text-pink-400">
                      {cel.specialDiscountCode}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-300 font-medium mt-0.5">
                    {isBday ? '₹500 OFF on Teak Furniture / LED TV' : '₹1,000 OFF on Royal Sofa / Refrigerator'}
                  </div>
                </div>
              </div>

              {/* Action */}
              <button
                type="button"
                onClick={() => handleSendWishWhatsApp(cel)}
                className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Send WhatsApp Greetings + Voucher</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
