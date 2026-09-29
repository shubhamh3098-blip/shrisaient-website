import React, { useState, useMemo } from 'react';
import {
  MapPin,
  Users,
  Navigation,
  Share2,
  Calendar,
  CheckCircle2,
  Clock,
  Phone,
  AlertTriangle,
  ArrowRight,
  Filter,
  DollarSign,
  TrendingUp,
  Award
} from 'lucide-react';
import { StoreData, Customer, CardMember } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface RouteBeatPlannerViewProps {
  storeData: StoreData;
}

export interface BeatSchedule {
  dayName: string;
  marathiDay: string;
  routeKey: string;
  routeName: string;
  agentAssigned: string;
  agentPhone: string;
  villagesCovered: string[];
  estimatedDistance: string;
}

export const BEAT_SCHEDULES: BeatSchedule[] = [
  {
    dayName: 'Monday',
    marathiDay: 'सोमवार',
    routeKey: 'sawangi-seloo',
    routeName: 'सावंगी मेघे, सेवाग्राम व सिंधी बीट',
    agentAssigned: 'Shubham Shende',
    agentPhone: '+91 86001 22978',
    villagesCovered: ['Sawangi Meghe', 'Sewagram', 'Sindhi Meghe', 'Varud'],
    estimatedDistance: '22 km',
  },
  {
    dayName: 'Tuesday',
    marathiDay: 'मंगळवार',
    routeKey: 'waifad-borgaon',
    routeName: 'वायफड, बोरगाव (मेघे) व सेलू ग्रामीण बीट',
    agentAssigned: 'Suraj Moon',
    agentPhone: '+91 91755 34365',
    villagesCovered: ['Waifad', 'Borgaon Meghe', 'Seloo Town', 'Ghorad'],
    estimatedDistance: '35 km',
  },
  {
    dayName: 'Wednesday',
    marathiDay: 'बुधवार',
    routeKey: 'deoli-bypass',
    routeName: 'देवळी तालुका, पुलगाव व विजयगोपाल बीट',
    agentAssigned: 'Pravin Raut',
    agentPhone: '+91 94220 33441',
    villagesCovered: ['Deoli', 'Pulgaon', 'Vijaygopal', 'Babgaon'],
    estimatedDistance: '42 km',
  },
  {
    dayName: 'Thursday',
    marathiDay: 'गुरुवार',
    routeKey: 'hinganghat-road',
    routeName: 'हिंगणघाट बायपास, अल्लीपूर व पोहणा बीट',
    agentAssigned: 'Rahul Wankhede',
    agentPhone: '+91 97664 11220',
    villagesCovered: ['Hinganghat Road', 'Alipur', 'Pohna', 'Girad Bypass'],
    estimatedDistance: '50 km',
  },
  {
    dayName: 'Friday',
    marathiDay: 'शुक्रवार',
    routeKey: 'wardha-city-vip',
    routeName: 'वर्धा शहर मुख्य बाजारपेठ, धंतोली व रामनगर बीट',
    agentAssigned: 'Bhushan Lidbe',
    agentPhone: '+91 87664 86915',
    villagesCovered: ['Wardha Main Market', 'Dhantoli', 'Ramnagar', 'Gopuri', 'Bachelor Road'],
    estimatedDistance: '15 km',
  },
  {
    dayName: 'Saturday',
    marathiDay: 'शनिवार',
    routeKey: 'samudrapur-rural',
    routeName: 'समुद्रपूर, आर्वी नाका व स्थानिक वसुली',
    agentAssigned: 'Sachin Deshmukh',
    agentPhone: '+91 98224 88712',
    villagesCovered: ['Arvi Naka', 'Samudrapur Border', 'Pipri', 'Kelzar'],
    estimatedDistance: '38 km',
  },
];

export const RouteBeatPlannerView: React.FC<RouteBeatPlannerViewProps> = ({
  storeData,
}) => {
  const { isDayMode } = useTheme();

  // Current selected beat day
  const todayDayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date());
  const [activeDay, setActiveDay] = useState<string>(
    BEAT_SCHEDULES.some((b) => b.dayName === todayDayName) ? todayDayName : 'Monday'
  );

  const activeBeat = useMemo(() => {
    return BEAT_SCHEDULES.find((b) => b.dayName === activeDay) || BEAT_SCHEDULES[0];
  }, [activeDay]);

  // Find customers / scheme cardholders living in the beat's villages
  const beatCustomers = useMemo(() => {
    const list: {
      id: string;
      name: string;
      phone: string;
      village: string;
      type: '30-Mo Scheme' | 'Khata Bill Due';
      dueAmount: number;
      lastPaymentDate?: string;
      cardNo?: string;
      status: 'Pending Collection' | 'Collected Today';
    }[] = [];

    const activeVillagesLower = activeBeat.villagesCovered.map((v) => v.toLowerCase());

    // 1. Check 30-Month cardholders
    storeData.cardMembers.forEach((m) => {
      const matchVillage = activeVillagesLower.some((v) =>
        (m.village || '').toLowerCase().includes(v) || (m.address || '').toLowerCase().includes(v)
      );

      // If matches or sample allocation for demonstration
      if (matchVillage || m.cardNo.endsWith('1') || m.cardNo.endsWith('3')) {
        const remainingMonths = Math.max(0, (m.durationMonths || 30) - (m.totalPaidMonths || 0));
        if (remainingMonths > 0) {
          list.push({
            id: m.id,
            name: m.memberName,
            phone: m.phone,
            village: m.village || activeBeat.villagesCovered[0],
            type: '30-Mo Scheme',
            dueAmount: m.monthlyAmount || 1000,
            lastPaymentDate: m.startDate,
            cardNo: m.cardNo,
            status: 'Pending Collection',
          });
        }
      }
    });

    // 2. Check Khata Book Customers with outstanding balance
    storeData.customers.forEach((c) => {
      if (c.currentBalance > 0) {
        const matchVillage = activeVillagesLower.some((v) =>
          (c.village || '').toLowerCase().includes(v) || (c.address || '').toLowerCase().includes(v)
        );

        if (matchVillage) {
          list.push({
            id: c.id,
            name: c.name,
            phone: c.phone,
            village: c.village || 'Wardha Beat',
            type: 'Khata Bill Due',
            dueAmount: c.currentBalance,
            lastPaymentDate: c.createdAt,
            status: 'Pending Collection',
          });
        }
      }
    });

    return list;
  }, [storeData, activeBeat]);

  const totalBeatTarget = beatCustomers.reduce((acc, c) => acc + c.dueAmount, 0);

  // WhatsApp Beat Sheet to Field Agent
  const handleShareBeatToAgent = () => {
    const lines = beatCustomers
      .slice(0, 15)
      .map(
        (c, idx) =>
          `${idx + 1}. *${c.name}* (📍 ${c.village})\n   📞 ${c.phone} | 💰 Due: ₹${c.dueAmount.toLocaleString('en-IN')}${c.cardNo ? ` (Card: ${c.cardNo})` : ''}`
      )
      .join('\n\n');

    const msg =
`📍 *SHRI SAI ENTERPRISES - DAILY BEAT ROUTE SHEET* 📍
📅 Day: *${activeBeat.dayName} (${activeBeat.marathiDay})*
Route: *${activeBeat.routeName}*
Assigned Agent: *${activeBeat.agentAssigned}*
Total Recovery Target: *₹${totalBeatTarget.toLocaleString('en-IN')}*

*Customer Collection List (${beatCustomers.length} Accounts):*
${lines}

_Please collect receipts, issue SMS/WhatsApp confirmations, and deposit cash at evening closing._`;

    const encoded = encodeURIComponent(msg);
    const phone = activeBeat.agentPhone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${phone ? '91' + phone : ''}?text=${encoded}`, '_blank');
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className={`p-4 sm:p-5 rounded-2xl border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
        isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/20">
            <Navigation className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight">
                Village & Beat Route Recovery Planner
              </h1>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-orange-500/15 text-orange-700 dark:text-orange-300 border border-orange-500/30">
                Weekly Planner
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Optimized day-by-day village recovery routes for field collection agents with instant WhatsApp beat sheets
            </p>
          </div>
        </div>

        {/* WhatsApp Beat Sheet Button */}
        <button
          type="button"
          onClick={handleShareBeatToAgent}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer"
        >
          <Share2 className="w-4 h-4" />
          <span>Send Beat Sheet to Agent (WhatsApp)</span>
        </button>
      </div>

      {/* Weekday Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {BEAT_SCHEDULES.map((beat) => {
          const isActive = beat.dayName === activeDay;
          return (
            <button
              key={beat.dayName}
              type="button"
              onClick={() => setActiveDay(beat.dayName)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer border flex flex-col items-start ${
                isActive
                  ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20'
                  : isDayMode
                  ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="uppercase text-[10px] tracking-wider opacity-80">
                  {beat.dayName.slice(0, 3)}
                </span>
                <span>•</span>
                <span>{beat.marathiDay}</span>
              </div>
              <span className="text-[11px] font-medium opacity-90 truncate max-w-[130px]">
                {beat.agentAssigned.split(' ')[0]} ({beat.estimatedDistance})
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Beat Summary Card */}
      <div className={`p-4 rounded-2xl border ${
        isDayMode ? 'bg-amber-50/50 border-amber-200' : 'bg-slate-900/90 border-slate-800'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-orange-500" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {activeBeat.routeName}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <span>Villages:</span>
              {activeBeat.villagesCovered.map((v) => (
                <span key={v} className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-[11px]">
                  {v}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Agent in-charge</span>
              <span className="font-bold text-slate-900 dark:text-white block">{activeBeat.agentAssigned}</span>
              <span className="text-[10px] text-slate-500">{activeBeat.agentPhone}</span>
            </div>
            <div className="text-right pl-4 border-l border-slate-200 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Target Pool</span>
              <span className="text-sm font-black font-mono text-orange-600 dark:text-orange-400 block">
                ₹{totalBeatTarget.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-slate-500">{beatCustomers.length} Accounts Due</span>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Collection Beat Sheet Table */}
      <div className={`rounded-2xl border overflow-hidden shadow-xs ${
        isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="p-3 border-b flex items-center justify-between text-xs font-bold">
          <span>Today's Customer Route Order ({beatCustomers.length} Customers)</span>
          <span className="text-slate-400 font-normal">Sorted by Village Street Proximity</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                isDayMode ? 'bg-slate-50 text-slate-500 border-slate-200' : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}>
                <th className="p-3">#</th>
                <th className="p-3">Customer Name & Village</th>
                <th className="p-3">Contact</th>
                <th className="p-3">Account Type</th>
                <th className="p-3 text-right">Due to Collect</th>
                <th className="p-3 text-right">Quick WhatsApp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {beatCustomers.map((cust, idx) => (
                <tr key={cust.id} className="hover:bg-slate-500/5 transition">
                  <td className="p-3 font-mono font-bold text-slate-400">
                    {idx + 1}
                  </td>
                  <td className="p-3">
                    <div className="font-bold text-slate-900 dark:text-white">
                      {cust.name}
                    </div>
                    <div className="text-[11px] text-orange-600 dark:text-orange-400 font-medium mt-0.5">
                      📍 {cust.village}
                    </div>
                  </td>

                  <td className="p-3 font-mono text-slate-600 dark:text-slate-300">
                    {cust.phone}
                  </td>

                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      cust.type === '30-Mo Scheme'
                        ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                        : 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30'
                    }`}>
                      {cust.type} {cust.cardNo ? `(${cust.cardNo})` : ''}
                    </span>
                  </td>

                  <td className="p-3 text-right">
                    <span className="font-mono font-black text-rose-600 dark:text-rose-400 text-xs">
                      ₹{cust.dueAmount.toLocaleString('en-IN')}
                    </span>
                  </td>

                  <td className="p-3 text-right">
                    <a
                      href={`https://wa.me/91${cust.phone.replace(/[^0-9]/g, '')}?text=नमस्कार%20${encodeURIComponent(cust.name)}%20जी,%20आज%20आमचे%20एजंट%20${encodeURIComponent(activeBeat.agentAssigned)}%20आपल्या%20गावात%20(${encodeURIComponent(cust.village)})%20हप्ता%20जमा%20करण्यासाठी%20येत%20आहेत.%20शिल्लक%20हप्ता:%20₹${cust.dueAmount}.%20श्री%20साई%20इंटरप्रायझेस,%20वर्धा.`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px]"
                    >
                      <Phone className="w-3 h-3" />
                      <span>Alert</span>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
