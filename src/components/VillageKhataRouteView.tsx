import React, { useState, useMemo, useDeferredValue } from 'react';
import {
  MapPin,
  Users,
  CreditCard,
  Receipt,
  Search,
  Printer,
  Share2,
  Phone,
  ArrowUpRight,
  TrendingDown,
  Building2,
  Calendar,
  Filter,
  CheckCircle2,
  AlertCircle,
  Coins,
  ChevronRight,
  UserCheck,
  Download,
  BookOpen,
  X,
  Plus,
  MessageCircle,
  Copy,
  Send
} from 'lucide-react';
import {
  Customer,
  CardMember,
  TransactionEntry,
  BillReceiptEntry,
  CardTransaction,
  BusinessSettings,
  StaffMember
} from '../types';

interface VillageSummary {
  villageName: string;
  // Card metrics
  cardCount: number;
  totalCardDeposits: number;
  cardNetBalance: number;
  cardMembers: CardMember[];
  // Customer Khata metrics
  customerCount: number;
  totalSales: number;
  totalPaid: number;
  totalUdhariDue: number;
  customers: Customer[];
  // Combined
  totalCombinedDue: number;
}

interface VillageKhataRouteViewProps {
  customers: Customer[];
  cardMembers: CardMember[];
  transactions?: TransactionEntry[];
  billReceipts?: BillReceiptEntry[];
  cardTransactions?: CardTransaction[];
  staff?: StaffMember[];
  settings: BusinessSettings;
  onOpenCardMemberPassbook?: (member: CardMember) => void;
  onOpenCustomerLedger?: (customer: Customer) => void;
  onCollectCardPayment?: (member: CardMember) => void;
  onSettleCustomerKhata?: (customer: Customer) => void;
}

export const VillageKhataRouteView: React.FC<VillageKhataRouteViewProps> = ({
  customers = [],
  cardMembers = [],
  transactions = [],
  billReceipts = [],
  cardTransactions = [],
  staff = [],
  settings,
  onOpenCardMemberPassbook,
  onOpenCustomerLedger,
  onCollectCardPayment,
  onSettleCustomerKhata,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearch = useDeferredValue(searchQuery);
  const [selectedVillageName, setSelectedVillageName] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'udhari' | 'cards' | 'route-sheet'>('all');
  const [sortBy, setSortBy] = useState<'due_desc' | 'cards_desc' | 'name_asc'>('due_desc');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showWhatsAppAlertModal, setShowWhatsAppAlertModal] = useState(false);
  const [copiedBroadcast, setCopiedBroadcast] = useState(false);
  const [alertFilterType, setAlertFilterType] = useState<'all' | 'cards' | 'udhari'>('all');

  // Normalize village name string helper
  const cleanVillage = (str?: string): string => {
    if (!str) return 'इतर / नोंद नसलेली गावे';
    let v = str.trim();
    if (!v) return 'इतर / नोंद नसलेली गावे';
    // Clean trailing Wardha, pin codes, etc.
    v = v.replace(/,?\s*(wardha|वर्धा|dist|district)\b/gi, '').trim();
    if (!v || v.length < 2) return 'इतर / नोंद नसलेली गावे';
    // Capitalize first letter
    return v.charAt(0).toUpperCase() + v.slice(1);
  };

  // Group all data by Village
  const villageSummaries = useMemo<VillageSummary[]>(() => {
    const map = new Map<string, {
      cardMembers: CardMember[];
      customers: Customer[];
    }>();

    // 1. Group Card Members by village
    const phoneToVillageMap = new Map<string, string>();

    cardMembers.forEach((m) => {
      const v = cleanVillage(m.village || m.address);
      if (m.phone && v !== 'इतर / नोंद नसलेली गावे') {
        phoneToVillageMap.set(m.phone.trim().replace(/[^0-9]/g, ''), v);
      }
      if (!map.has(v)) {
        map.set(v, { cardMembers: [], customers: [] });
      }
      map.get(v)!.cardMembers.push(m);
    });

    transactions.forEach((t) => {
      if (t.customerPhone && t.village) {
        const v = cleanVillage(t.village);
        if (v !== 'इतर / नोंद नसलेली गावे') {
          phoneToVillageMap.set(t.customerPhone.trim().replace(/[^0-9]/g, ''), v);
        }
      }
    });

    // 2. Group Customers by village
    customers.forEach((c) => {
      const cleanPhone = c.phone ? c.phone.trim().replace(/[^0-9]/g, '') : '';
      const fallbackVillage = cleanPhone ? phoneToVillageMap.get(cleanPhone) : undefined;
      const v = cleanVillage(c.village || c.address || fallbackVillage);
      if (!map.has(v)) {
        map.set(v, { cardMembers: [], customers: [] });
      }
      map.get(v)!.customers.push(c);
    });

    // Build summaries array
    const summaries: VillageSummary[] = [];

    map.forEach((data, vName) => {
      const cardCount = data.cardMembers.length;
      const totalCardDeposits = data.cardMembers.reduce((sum, m) => sum + (m.totalDeposited || 0), 0);
      const cardNetBalance = data.cardMembers.reduce((sum, m) => sum + (m.netBalance || 0), 0);

      const customerCount = data.customers.length;
      const totalSales = data.customers.reduce((sum, c) => sum + (c.totalPurchased || c.totalPurchases || 0), 0);
      const totalPaid = data.customers.reduce((sum, c) => sum + (c.totalPaid || 0), 0);
      const totalUdhariDue = data.customers.reduce((sum, c) => sum + Math.max(0, c.balanceDue || 0), 0);

      summaries.push({
        villageName: vName,
        cardCount,
        totalCardDeposits,
        cardNetBalance,
        cardMembers: data.cardMembers,
        customerCount,
        totalSales,
        totalPaid,
        totalUdhariDue,
        customers: data.customers,
        totalCombinedDue: totalUdhariDue,
      });
    });

    // Sort based on sortBy
    return summaries.sort((a, b) => {
      if (sortBy === 'due_desc') return b.totalUdhariDue - a.totalUdhariDue;
      if (sortBy === 'cards_desc') return b.cardCount - a.cardCount;
      return a.villageName.localeCompare(b.villageName);
    });
  }, [customers, cardMembers, sortBy]);

  // Overall Global Statistics across all villages
  const globalStats = useMemo(() => {
    let totalUdhari = 0;
    let totalCards = 0;
    let totalCardSavings = 0;
    let totalCust = 0;
    let highestDueVillage = '';
    let maxDue = 0;

    villageSummaries.forEach((vs) => {
      totalUdhari += vs.totalUdhariDue;
      totalCards += vs.cardCount;
      totalCardSavings += vs.totalCardDeposits;
      totalCust += vs.customerCount;
      if (vs.totalUdhariDue > maxDue && vs.villageName !== 'इतर / नोंद नसलेली गावे') {
        maxDue = vs.totalUdhariDue;
        highestDueVillage = vs.villageName;
      }
    });

    return {
      totalVillages: villageSummaries.length,
      totalUdhari,
      totalCards,
      totalCardSavings,
      totalCust,
      highestDueVillage: highestDueVillage || 'वर्धा शहर',
      maxDue,
    };
  }, [villageSummaries]);

  // Filtered villages based on search query
  const filteredVillages = useMemo(() => {
    if (!deferredSearch.trim()) return villageSummaries;
    const q = deferredSearch.toLowerCase().trim();
    return villageSummaries.filter((vs) => {
      const matchVillage = vs.villageName.toLowerCase().includes(q);
      const matchCustomer = vs.customers.some((c) => c.name.toLowerCase().includes(q) || (c.phone && c.phone.includes(q)));
      const matchCard = vs.cardMembers.some((m) => m.customerName.toLowerCase().includes(q) || String(m.cardNumber).includes(q));
      return matchVillage || matchCustomer || matchCard;
    });
  }, [villageSummaries, deferredSearch]);

  // Currently selected village summary object
  const currentVillage = useMemo(() => {
    if (!selectedVillageName) return null;
    return villageSummaries.find((v) => v.villageName === selectedVillageName) || null;
  }, [selectedVillageName, villageSummaries]);

  // Auto-select first village on desktop if none selected
  React.useEffect(() => {
    if (!selectedVillageName && filteredVillages.length > 0) {
      setSelectedVillageName(filteredVillages[0].villageName);
    }
  }, [filteredVillages, selectedVillageName]);

  // Filtered members & customers inside selected village
  const villageDueCustomers = useMemo(() => {
    if (!currentVillage) return [];
    return currentVillage.customers
      .filter((c) => (c.balanceDue || 0) > 0)
      .sort((a, b) => (b.balanceDue || 0) - (a.balanceDue || 0));
  }, [currentVillage]);

  const villageAllCustomers = useMemo(() => {
    if (!currentVillage) return [];
    return currentVillage.customers.sort((a, b) => (b.balanceDue || 0) - (a.balanceDue || 0));
  }, [currentVillage]);

  const villageCardMembers = useMemo(() => {
    if (!currentVillage) return [];
    return currentVillage.cardMembers.sort((a, b) => a.cardNumber - b.cardNumber);
  }, [currentVillage]);

  // Combined Recovery Route items for print/view
  const combinedRouteItems = useMemo(() => {
    if (!currentVillage) return [];
    const items: Array<{
      type: 'card' | 'udhari';
      id: string;
      name: string;
      phone?: string;
      refNumber: string;
      dueAmount: number;
      depositAmount?: number;
      rawObj: CardMember | Customer;
    }> = [];

    // Add Udhari customers with due
    villageDueCustomers.forEach((c) => {
      items.push({
        type: 'udhari',
        id: `cust-${c.id}`,
        name: c.name,
        phone: c.phone,
        refNumber: 'उधारी खाते',
        dueAmount: c.balanceDue || 0,
        rawObj: c,
      });
    });

    // Add Card Members
    villageCardMembers.forEach((m) => {
      items.push({
        type: 'card',
        id: `card-${m.id}`,
        name: m.customerName,
        phone: m.phone,
        refNumber: `Card #${m.cardNumber} (${m.schemeName})`,
        dueAmount: 500, // standard weekly installment target
        depositAmount: m.totalDeposited,
        rawObj: m,
      });
    });

    return items;
  }, [currentVillage, villageDueCustomers, villageCardMembers]);

  // Handle WhatsApp Reminder to Customer
  const handleWhatsAppReminder = (c: Customer) => {
    const text = `नमस्कार ${c.name}जी,\nश्री साई इंटरप्राइजेस (आर्वी रोड, वर्धा) कडून विनंती आहे की आपल्या खात्यावर ₹${(c.balanceDue || 0).toLocaleString('en-IN')} उधारी शिल्लक आहे.\nकृपया आज भेट देणाऱ्या प्रतिनिधीकडे किंवा दुकानात येऊन भरणा करावा.\nमो. ${settings.phone || '8766486915'}`;
    const cleanPh = (c.phone || '').replace(/[^0-9]/g, '').slice(-10);
    window.open(`https://wa.me/91${cleanPh}?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Handle WhatsApp Card Installment Reminder
  const handleWhatsAppCardReminder = (m: CardMember) => {
    const text = `नमस्कार ${m.customerName}जी,\nश्री साई इंटरप्राइजेस - ३०-महिने साप्ताहिक बचत योजना (कार्ड #${m.cardNumber})\nआपली आत्तापर्यंत जमा बचत: ₹${(m.totalDeposited || 0).toLocaleString('en-IN')}.\nकृपया चालू आठवड्याचा हप्ता ₹500 प्रतिनिधीकडे जमा करावा.\nमो. ${settings.phone || '8766486915'}`;
    const cleanPh = (m.phone || '').replace(/[^0-9]/g, '').slice(-10);
    window.open(`https://wa.me/91${cleanPh}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto p-3 sm:p-6 text-slate-900 dark:text-white">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 sm:p-6 rounded-2xl shadow-xl border border-indigo-900/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                <span>गाववार उधारी विक्री व बचत कार्ड हब</span>
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
                Village / Route Khata Master
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              गावानुसार उधारी शिल्लक • ३०-महिने बचत कार्ड धारक • वसुली एजंट रूट शीट व प्रिंट
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowWhatsAppAlertModal(true)}
            disabled={!currentVillage}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-black transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>📢 {currentVillage ? `${currentVillage.villageName} WhatsApp अलर्ट` : 'गाव WhatsApp अलर्ट'}</span>
          </button>
          <button
            onClick={() => setShowPrintModal(true)}
            disabled={!currentVillage}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-black transition flex items-center gap-1.5 shadow-md shadow-indigo-500/20 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>🖨️ {currentVillage ? `${currentVillage.villageName} रूट शीट प्रिंट` : 'गाव वसुली प्रिंट'}</span>
          </button>
        </div>
      </div>

      {/* Global Statistics Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Villages */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold">एकूण गावे (Villages)</span>
            <MapPin className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">
            {globalStats.totalVillages}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {globalStats.totalCust} एकूण नोंदणीकृत ग्राहक
          </p>
        </div>

        {/* Total Udhari Due */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 shadow-2xs bg-rose-50/20">
          <div className="flex items-center justify-between text-xs text-rose-700 dark:text-rose-400">
            <span className="font-bold">एकूण उधारी बाकी (Total Udhari)</span>
            <TrendingDown className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1 font-mono">
            ₹{globalStats.totalUdhari.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-rose-600/80 mt-0.5">
            गावातील येणे बाकी रक्कम
          </p>
        </div>

        {/* Total Card Scheme Members */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/50 shadow-2xs bg-emerald-50/20">
          <div className="flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-400">
            <span className="font-bold">बचत कार्ड धारक (Cards)</span>
            <CreditCard className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
            {globalStats.totalCards}
          </p>
          <p className="text-[11px] text-emerald-600/80 mt-0.5 font-mono">
            ₹{globalStats.totalCardSavings.toLocaleString('en-IN')} एकूण जमा बचत
          </p>
        </div>

        {/* Highest Due Village */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/50 shadow-2xs bg-amber-50/20">
          <div className="flex items-center justify-between text-xs text-amber-700 dark:text-amber-400">
            <span className="font-bold">उच्च उधारी गाव (Top Due)</span>
            <AlertCircle className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-lg font-black text-amber-800 dark:text-amber-300 mt-1 truncate">
            {globalStats.highestDueVillage}
          </p>
          <p className="text-[11px] text-amber-700/80 mt-0.5 font-mono">
            ₹{globalStats.maxDue.toLocaleString('en-IN')} बाकी
          </p>
        </div>
      </div>

      {/* Main Two-Column Layout: Left = Village List, Right = Village Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Column: Village Selector & Overview List (4 Cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5 shadow-2xs space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="गाव शोधा (उदा. सेलू, देवळी, बोरगाव...)"
                className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Sort Toggle */}
            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 font-semibold">क्रमवारी:</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setSortBy('due_desc')}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition ${
                    sortBy === 'due_desc'
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  उधारी बाकी
                </button>
                <button
                  onClick={() => setSortBy('cards_desc')}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition ${
                    sortBy === 'cards_desc'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  बचत कार्ड
                </button>
                <button
                  onClick={() => setSortBy('name_asc')}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition ${
                    sortBy === 'name_asc'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  नाव (A-Z)
                </button>
              </div>
            </div>
          </div>

          {/* Village List Cards */}
          <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
            {filteredVillages.map((vs) => {
              const isSelected = selectedVillageName === vs.villageName;
              return (
                <div
                  key={vs.villageName}
                  onClick={() => setSelectedVillageName(vs.villageName)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500 shadow-sm ring-2 ring-indigo-500/20'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`p-1.5 rounded-lg ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                        <MapPin className="w-3.5 h-3.5" />
                      </span>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                        {vs.villageName}
                      </h3>
                    </div>

                    <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isSelected ? 'translate-x-0.5 text-indigo-600' : ''}`} />
                  </div>

                  {/* Badges Grid */}
                  <div className="grid grid-cols-2 gap-2 mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                    {/* Udhari info */}
                    <div>
                      <span className="text-[10px] text-slate-500 block">उधारी बाकी (Due)</span>
                      <span className={`font-mono font-bold ${vs.totalUdhariDue > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`}>
                        ₹{vs.totalUdhariDue.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {vs.customers.filter((c) => (c.balanceDue || 0) > 0).length} उधारी ग्राहक
                      </span>
                    </div>

                    {/* Cards info */}
                    <div>
                      <span className="text-[10px] text-slate-500 block">बचत कार्ड (Cards)</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {vs.cardCount} कार्ड
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                        ₹{vs.totalCardDeposits.toLocaleString('en-IN')} बचत
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredVillages.length === 0 && (
              <div className="p-8 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                <MapPin className="w-8 h-8 mx-auto opacity-40 mb-1" />
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  कोणतेही गाव सापडले नाही
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Selected Village Detail & Route Recovery Sheet (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          {currentVillage ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
              {/* Village Header */}
              <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 to-indigo-50/40 dark:from-slate-800/80 dark:to-indigo-950/30 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-indigo-600" />
                      <span>{currentVillage.villageName}</span>
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 font-bold text-xs">
                      {currentVillage.customers.length} ग्राहक • {currentVillage.cardCount} कार्ड
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    गावातील एकूण येणे बाकी उधारी: <strong className="text-rose-600 font-mono text-sm">₹{currentVillage.totalUdhariDue.toLocaleString('en-IN')}</strong> • एकूण बचत ठेव: <strong className="text-emerald-600 font-mono text-sm">₹{currentVillage.totalCardDeposits.toLocaleString('en-IN')}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowWhatsAppAlertModal(true)}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>गाव WhatsApp अलर्ट</span>
                  </button>
                  <button
                    onClick={() => setShowPrintModal(true)}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>यादी प्रिंट करा</span>
                  </button>
                </div>
              </div>

              {/* Sub-Tabs: Udhari Customers vs Card Members vs Combined Route */}
              <div className="p-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center gap-1.5 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    activeTab === 'all'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  सर्व ग्राहक व कार्ड ({currentVillage.customers.length + currentVillage.cardCount})
                </button>
                <button
                  onClick={() => setActiveTab('udhari')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'udhari'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                  }`}
                >
                  <TrendingDown className="w-3.5 h-3.5" />
                  उधारी ग्राहक ({villageDueCustomers.length})
                </button>
                <button
                  onClick={() => setActiveTab('cards')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'cards'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  बचत कार्ड धारक ({currentVillage.cardCount})
                </button>
                <button
                  onClick={() => setActiveTab('route-sheet')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'route-sheet'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  रूट वसुली यादी ({combinedRouteItems.length})
                </button>
              </div>

              {/* TAB 1 & 2: Content Listings */}
              <div className="p-4 overflow-y-auto max-h-[580px] space-y-4">
                
                {/* SECTION: Udhari Customers */}
                {(activeTab === 'all' || activeTab === 'udhari') && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                      <h3 className="font-bold text-xs uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                        <TrendingDown className="w-4 h-4" />
                        <span>उधारी बाकी ग्राहक खाते ({villageDueCustomers.length})</span>
                      </h3>
                      <span className="text-xs font-mono font-black text-rose-600">
                        एकूण बाकी: ₹{currentVillage.totalUdhariDue.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {villageDueCustomers.map((c) => (
                        <div
                          key={c.id}
                          className="p-3.5 rounded-xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                                {c.name}
                              </h4>
                              {c.phone && (
                                <p className="text-xs text-slate-600 dark:text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  {c.phone}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] text-slate-500 font-medium block">उधारी बाकी</span>
                              <span className="font-mono font-black text-base text-rose-600 dark:text-rose-400">
                                ₹{(c.balanceDue || 0).toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-rose-100 dark:border-rose-900/30">
                            <span>एकूण खरेदी: ₹{(c.totalPurchased || c.totalPurchases || 0).toLocaleString('en-IN')}</span>
                            <span>जमा: ₹{(c.totalPaid || 0).toLocaleString('en-IN')}</span>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1.5 pt-1">
                            {onSettleCustomerKhata && (
                              <button
                                onClick={() => onSettleCustomerKhata(c)}
                                className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold text-center flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                              >
                                <ArrowUpRight className="w-3.5 h-3.5" />
                                <span>उधारी जमा करा</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleWhatsAppReminder(c)}
                              className="py-1.5 px-2.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                              title="WhatsApp पेमेंट आठवण पाठवा"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </button>

                            {onOpenCustomerLedger && (
                              <button
                                onClick={() => onOpenCustomerLedger(c)}
                                className="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold cursor-pointer"
                                title="खातेवही बघा"
                              >
                                खाते
                              </button>
                            )}
                          </div>
                        </div>
                      ))}

                      {villageDueCustomers.length === 0 && (
                        <div className="col-span-2 p-6 text-center text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                          <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-1" />
                          <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                            या गावात कोणाचीही उधारी बाकी नाही! सर्व जमा आहे.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* SECTION: Card Scheme Members */}
                {(activeTab === 'all' || activeTab === 'cards') && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                      <h3 className="font-bold text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4" />
                        <span>३०-महिने बचत कार्ड धारक ({villageCardMembers.length})</span>
                      </h3>
                      <span className="text-xs font-mono font-black text-emerald-600">
                        एकूण बचत ठेव: ₹{currentVillage.totalCardDeposits.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {villageCardMembers.map((m) => (
                        <div
                          key={m.id}
                          className="p-3.5 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-mono font-black text-xs">
                                  #{m.cardNumber}
                                </span>
                                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                                  {m.schemeName}
                                </span>
                              </div>
                              <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-1">
                                {m.customerName}
                              </h4>
                              {m.phone && (
                                <p className="text-xs text-slate-600 dark:text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  {m.phone}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] text-slate-500 font-medium block">एकूण बचत</span>
                              <span className="font-mono font-black text-base text-emerald-600 dark:text-emerald-400">
                                ₹{(m.totalDeposited || 0).toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-emerald-100 dark:border-emerald-900/30">
                            <span>हप्ता: ₹500/आठवडा</span>
                            <span>शिल्लक बचत: ₹{(m.netBalance || 0).toLocaleString('en-IN')}</span>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1.5 pt-1">
                            {onCollectCardPayment && (
                              <button
                                onClick={() => onCollectCardPayment(m)}
                                className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold text-center flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>+ हप्ता जमा</span>
                              </button>
                            )}

                            {onOpenCardMemberPassbook && (
                              <button
                                onClick={() => onOpenCardMemberPassbook(m)}
                                className="py-1.5 px-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                                title="बँक पासबुक उघडा"
                              >
                                <BookOpen className="w-3.5 h-3.5" />
                                <span>पासबुक</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleWhatsAppCardReminder(m)}
                              className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                              title="WhatsApp पावती पाठवा"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}

                      {villageCardMembers.length === 0 && (
                        <div className="col-span-2 p-6 text-center text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                          <CreditCard className="w-8 h-8 mx-auto opacity-30 mb-1" />
                          <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                            या गावात अजून कोणतेही बचत कार्ड नोंदवलेले नाही.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* SECTION: Combined Field Route Sheet (Tab 3) */}
                {activeTab === 'route-sheet' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                      <div>
                        <h3 className="font-bold text-xs uppercase tracking-wider text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                          <UserCheck className="w-4 h-4" />
                          <span>फील्ड वसुली रूट यादी (गाव: {currentVillage.villageName})</span>
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          घरोघरी जाऊन वसुली करण्यासाठी संपूर्ण यादी (बचत कार्ड + उधारी)
                        </p>
                      </div>

                      <button
                        onClick={() => setShowPrintModal(true)}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>रूट शीट प्रिंट</span>
                      </button>
                    </div>

                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                            <th className="p-2.5 w-10 text-center">क्र.</th>
                            <th className="p-2.5">ग्राहक नाव व मोबाईल</th>
                            <th className="p-2.5">खाते / कार्ड प्रकार</th>
                            <th className="p-2.5 text-right">येणे रक्कम (₹)</th>
                            <th className="p-2.5 text-center">कृती</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {combinedRouteItems.map((item, idx) => (
                            <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                              <td className="p-2.5 text-center font-mono font-bold text-slate-400">
                                {idx + 1}
                              </td>
                              <td className="p-2.5">
                                <span className="font-bold text-slate-900 dark:text-white block">
                                  {item.name}
                                </span>
                                {item.phone && (
                                  <span className="text-[11px] text-slate-500 font-mono">
                                    {item.phone}
                                  </span>
                                )}
                              </td>
                              <td className="p-2.5">
                                {item.type === 'card' ? (
                                  <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                                    {item.refNumber}
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 text-[10px] font-bold">
                                    उधारी खाते बाकी
                                  </span>
                                )}
                              </td>
                              <td className="p-2.5 text-right font-mono font-black text-slate-900 dark:text-white">
                                ₹{item.dueAmount.toLocaleString('en-IN')}
                              </td>
                              <td className="p-2.5 text-center">
                                {item.type === 'card' && onCollectCardPayment && (
                                  <button
                                    onClick={() => onCollectCardPayment(item.rawObj as CardMember)}
                                    className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] cursor-pointer"
                                  >
                                    हप्ता जमा
                                  </button>
                                )}
                                {item.type === 'udhari' && onSettleCustomerKhata && (
                                  <button
                                    onClick={() => onSettleCustomerKhata(item.rawObj as Customer)}
                                    className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] cursor-pointer"
                                  >
                                    उधारी जमा
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center text-slate-400">
              <MapPin className="w-12 h-12 mx-auto text-indigo-400 mb-2 opacity-50" />
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
                कोणतेही गाव निवडा
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                डाव्या बाजूच्या यादीमधून कोणत्याही गावावर क्लिक करा; त्या गावातील उधारी ग्राहक व बचत कार्ड धारकांची माहिती दिसेल.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* PRINT MODAL FOR VILLAGE ROUTE SHEET */}
      {showPrintModal && currentVillage && (
        <div className="fixed inset-0 bg-black/80 z-60 flex items-center justify-center p-2 sm:p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[95vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden text-slate-900">
            {/* Modal Top Bar */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between gap-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <Printer className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="text-base font-bold text-white">
                    गाव वसुली रूट प्रिंट शीट (Village Route Sheet)
                  </h3>
                  <p className="text-xs text-slate-400">
                    गाव: <strong className="text-amber-300">{currentVillage.villageName}</strong> • बचत कार्ड व उधारी वसुली यादी
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black transition flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  प्रिंट करा (Print)
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Area (A4 layout) */}
            <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-white print:p-0">
              <div className="max-w-3xl mx-auto space-y-6 text-slate-900 border border-slate-300 p-6 rounded-xl shadow-xs print:border-none print:p-0">
                {/* Header */}
                <div className="text-center border-b-2 border-slate-900 pb-4">
                  <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">
                    {settings.businessName || 'SHRI SAI ENTERPRISES'}
                  </h2>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">
                    मातोश्री सभागृह समोर, आर्वी रोड, पंजाब कॉलनी, वर्धा - ४४२००१
                  </p>
                  <p className="text-xs font-mono font-bold text-slate-800 mt-0.5">
                    मोबाईल: {settings.phone || '8766486915, 8600122798'}
                  </p>
                  <div className="inline-block mt-2 px-4 py-1 bg-slate-900 text-white rounded-full text-xs font-black tracking-widest uppercase">
                    गाववार वसुली व रूट शीट (गाव: {currentVillage.villageName})
                  </div>
                </div>

                {/* Village Summary Info */}
                <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-center text-xs">
                  <div>
                    <span className="text-slate-500 block">एकूण उधारी बाकी</span>
                    <strong className="text-base font-black text-rose-700 font-mono">
                      ₹{currentVillage.totalUdhariDue.toLocaleString('en-IN')}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">बचत कार्ड संख्या</span>
                    <strong className="text-base font-black text-emerald-700 font-mono">
                      {currentVillage.cardCount} कार्ड धारक
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">एकूण वसुली ग्राहक</span>
                    <strong className="text-base font-black text-indigo-700 font-mono">
                      {combinedRouteItems.length} घरांची यादी
                    </strong>
                  </div>
                </div>

                {/* Tabular Route Sheet */}
                <table className="w-full text-left text-xs border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 font-bold text-[11px]">
                      <th className="p-2 border-r border-slate-300 w-8 text-center">क्र.</th>
                      <th className="p-2 border-r border-slate-300">ग्राहक नाव</th>
                      <th className="p-2 border-r border-slate-300">मोबाईल क्र.</th>
                      <th className="p-2 border-r border-slate-300">प्रकार व संदर्भ</th>
                      <th className="p-2 border-r border-slate-300 text-right">येणे बाकी (₹)</th>
                      <th className="p-2 border-r border-slate-300 w-24 text-center">आज जमा (₹)</th>
                      <th className="p-2 border-r border-slate-300 w-16 text-center">मोड</th>
                      <th className="p-2 text-center w-20">ग्राहक सही</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {combinedRouteItems.map((item, idx) => (
                      <tr key={item.id}>
                        <td className="p-2 border-r border-slate-200 text-center font-mono">{idx + 1}</td>
                        <td className="p-2 border-r border-slate-200 font-bold">{item.name}</td>
                        <td className="p-2 border-r border-slate-200 font-mono text-[11px]">{item.phone || '-'}</td>
                        <td className="p-2 border-r border-slate-200 text-[11px]">
                          {item.type === 'card' ? (
                            <span className="font-semibold text-emerald-800">{item.refNumber}</span>
                          ) : (
                            <span className="font-semibold text-rose-800">उधारी खाते बाकी</span>
                          )}
                        </td>
                        <td className="p-2 border-r border-slate-200 text-right font-mono font-bold">
                          ₹{item.dueAmount.toLocaleString('en-IN')}
                        </td>
                        <td className="p-2 border-r border-slate-200"></td>
                        <td className="p-2 border-r border-slate-200 text-center text-[10px] text-slate-400">Cash/UPI</td>
                        <td className="p-2 border-slate-200"></td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-black border-t-2 border-slate-900 text-slate-900">
                      <td colSpan={4} className="p-2 text-right uppercase border-r border-slate-300">
                        एकूण वसुली लक्ष्य (Target Total):
                      </td>
                      <td className="p-2 text-right font-mono text-sm border-r border-slate-300">
                        ₹{combinedRouteItems.reduce((sum, i) => sum + i.dueAmount, 0).toLocaleString('en-IN')}
                      </td>
                      <td colSpan={3} className="p-2 text-[11px] text-slate-500">
                        प्रत्यक्ष जमा मोजून सही घ्यावी
                      </td>
                    </tr>
                  </tfoot>
                </table>

                {/* Signatures */}
                <div className="pt-8 border-t border-slate-300 grid grid-cols-2 gap-8 text-center text-xs">
                  <div className="space-y-8">
                    <div className="h-10 border-b border-dashed border-slate-400"></div>
                    <p className="font-bold text-slate-800">
                      वसुली एजंट स्वाक्षरी<br />
                      <span className="text-[11px] text-slate-500 font-normal">(प्रतिनिधी)</span>
                    </p>
                  </div>
                  <div className="space-y-8">
                    <div className="h-10 border-b border-dashed border-slate-400"></div>
                    <p className="font-bold text-slate-800">
                      शोरूम पडताळणी सही<br />
                      <span className="text-[11px] text-slate-500 font-normal">शुभम शेंडे (संचालक)</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WHATSAPP PRE-ROUTE ALERT MODAL */}
      {showWhatsAppAlertModal && currentVillage && (
        <div className="fixed inset-0 bg-black/80 z-60 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl border border-emerald-500/40 overflow-hidden text-slate-900 dark:text-white">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 text-white flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shadow-inner">
                  <MessageCircle className="w-6 h-6 fill-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-black tracking-tight">
                      गाववार वसुली पूर्व-सूचना (Pre-Route WhatsApp Alert)
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-slate-950 text-emerald-300 font-bold text-[10px] uppercase">
                      {currentVillage.villageName}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-100 font-medium">
                    एजंट गावात निघण्यापूर्वी ग्राहकांना 1-क्लिकने WhatsApp मेसेज पाठवून हप्ता तयार ठेवण्यास सांगा
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowWhatsAppAlertModal(false)}
                className="p-1.5 rounded-lg bg-black/20 hover:bg-black/40 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter and Quick Broadcast Header */}
            <div className="p-3 sm:p-4 bg-emerald-50/70 dark:bg-emerald-950/20 border-b border-emerald-200 dark:border-emerald-900/40 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setAlertFilterType('all')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                    alertFilterType === 'all'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  सर्व ({combinedRouteItems.length})
                </button>
                <button
                  onClick={() => setAlertFilterType('cards')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                    alertFilterType === 'cards'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  बचत कार्ड ({combinedRouteItems.filter(i => i.type === 'card').length})
                </button>
                <button
                  onClick={() => setAlertFilterType('udhari')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                    alertFilterType === 'udhari'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  उधारी बाकी ({combinedRouteItems.filter(i => i.type === 'udhari').length})
                </button>
              </div>

              {/* Copy Broadcast List */}
              <button
                onClick={() => {
                  const filtered = combinedRouteItems.filter(i => {
                    if (alertFilterType === 'cards') return i.type === 'card';
                    if (alertFilterType === 'udhari') return i.type === 'udhari';
                    return true;
                  });

                  const textList = filtered.map((item, idx) => {
                    return `${idx + 1}. ${item.name} (${item.type === 'card' ? 'कार्ड #' + item.refNumber : 'उधारी'}): ₹${item.dueAmount} - फोन: ${item.phone || '-'}`;
                  }).join('\n');

                  const summary = `📢 श्री साई इंटरप्राइजेस - गाव वसुली रूट यादी (${currentVillage.villageName})\nतारीख: ${new Date().toLocaleDateString('mr-IN')}\n\n${textList}\n\nएकूण लक्ष्य: ₹${filtered.reduce((s, x) => s + x.dueAmount, 0).toLocaleString('en-IN')}`;

                  navigator.clipboard.writeText(summary);
                  setCopiedBroadcast(true);
                  setTimeout(() => setCopiedBroadcast(false), 2500);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm hover:bg-slate-800 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-emerald-400" />
                <span>{copiedBroadcast ? '✅ कॉपी झाले!' : '📋 संपूर्ण यादी कॉपी करा'}</span>
              </button>
            </div>

            {/* List of Contacts */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2.5">
              {combinedRouteItems
                .filter(item => {
                  if (alertFilterType === 'cards') return item.type === 'card';
                  if (alertFilterType === 'udhari') return item.type === 'udhari';
                  return true;
                })
                .map((item, idx) => {
                  const cleanPhone = (item.phone || '').replace(/\D/g, '').slice(-10);
                  const isCard = item.type === 'card';

                  const msgText = 
`नमस्कार *${item.name}* जी,
🚩 *श्री साई इंटरप्राइजेस, वर्धा* 🚩

आपणास कळवण्यात येते की आमचे अधिकृत वसुली प्रतिनिधी आज आपल्या *${currentVillage.villageName}* गावात येत आहेत.

📌 *आपला हिशोब तपशील:*
• प्रकार: *${isCard ? '३०-महिने बचत योजना (कार्ड #' + item.refNumber + ')' : 'शोरूम उधारी खाते बाकी'}*
• ${isCard ? 'चालू साप्ताहिक हप्ता' : 'येणे उधारी रक्कम'}: *₹${item.dueAmount.toLocaleString('en-IN')}*

कृपया ही रक्कम रोख अथवा फोन पे / गुगल पे द्वारे प्रतिनिधीकडे जमा करण्यासाठी तयार ठेवावी.

📍 *पत्ता:* मातोश्री सभागृह समोर, आर्वी रोड, पंजाब कॉलनी, वर्धा.
📞 *संपर्क:* ${settings.phone || '8766486915'} / 8600122798`;

                  const waUrl = cleanPhone.length === 10
                    ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msgText)}`
                    : null;

                  return (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-start gap-3">
                        <span className="w-7 h-7 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <strong className="text-slate-900 dark:text-white font-bold text-sm">
                              {item.name}
                            </strong>
                            {isCard ? (
                              <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[10px]">
                                कार्ड #{item.refNumber}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 font-bold text-[10px]">
                                उधारी खाते
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-slate-500 mt-1 text-[11px]">
                            <span className="font-mono flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {item.phone || 'नंबर उपलब्ध नाही'}
                            </span>
                            <span>•</span>
                            <span className="text-slate-700 dark:text-slate-300 font-bold">
                              रक्कम: <strong className="font-mono text-emerald-600 dark:text-emerald-400">₹{item.dueAmount.toLocaleString('en-IN')}</strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        {waUrl ? (
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
                          >
                            <MessageCircle className="w-3.5 h-3.5 fill-white" />
                            <span>WhatsApp पाठवा</span>
                          </a>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            मोबाईल नंबर नाही
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Modal Footer */}
            <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between text-xs text-slate-500 shrink-0">
              <span>
                एकूण संपर्क: <strong>{combinedRouteItems.length}</strong> • गाव: <strong>{currentVillage.villageName}</strong>
              </span>
              <button
                onClick={() => setShowWhatsAppAlertModal(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold cursor-pointer"
              >
                बंद करा (Close)
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
