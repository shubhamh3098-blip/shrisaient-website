import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  MessageCircle,
  QrCode,
  IndianRupee,
  Phone,
  MapPin,
  Filter,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Share2,
  Copy,
  ExternalLink,
  Calendar,
  Sparkles,
  Building2,
  Send
} from 'lucide-react';
import { Customer, CardMember, BusinessSettings } from '../types';

interface DuePaymentRemindersModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  cardMembers: CardMember[];
  settings: BusinessSettings;
}

interface DueItem {
  id: string;
  type: 'KhataCustomer' | 'CardSchemeMember';
  name: string;
  phone: string;
  village: string;
  dueAmount: number;
  lastPaymentDate?: string;
  identifier: string; // Phone or Card Number
  notes?: string;
}

export const DuePaymentRemindersModal: React.FC<DuePaymentRemindersModalProps> = ({
  isOpen,
  onClose,
  customers,
  cardMembers,
  settings,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'khata' | 'card'>('all');
  const [selectedVillage, setSelectedVillage] = useState<string>('all');
  const [minDue, setMinDue] = useState<number>(0);
  const [search, setSearch] = useState<string>('');
  const [activeQrItem, setActiveQrItem] = useState<DueItem | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Discover all due items
  const allDueItems = useMemo(() => {
    const list: DueItem[] = [];

    // 1. Regular Khata Customers with negative netBalance or positive due
    (customers || []).forEach((c) => {
      // In this app, negative netBalance typically represents pending customer credit / due
      const balance = typeof c.netBalance === 'number' ? c.netBalance : 0;
      if (balance < 0) {
        list.push({
          id: `khata-${c.id}`,
          type: 'KhataCustomer',
          name: c.name,
          phone: c.phone || '',
          village: c.village || 'गाव नमूद नाही',
          dueAmount: Math.abs(balance),
          identifier: c.phone || c.id,
          notes: 'दुकान उधारी / खाते बाकी',
        });
      }
    });

    // 2. 30-Month Card Scheme Members with active dues
    (cardMembers || []).forEach((m) => {
      if (m.status === 'active') {
        const totalPaid = m.totalDeposited || 0;
        // 30-month scheme standard is typically ₹500 weekly or monthly target
        // If they haven't paid this week or have pending target
        const pendingAmount = Math.max(0, 30000 - totalPaid);
        if (pendingAmount > 0) {
          list.push({
            id: `card-${m.id}`,
            type: 'CardSchemeMember',
            name: m.customerName,
            phone: m.phone || '',
            village: m.village || 'गाव नमूद नाही',
            dueAmount: 500, // standard weekly installment reminder amount
            identifier: `कार्ड #${m.cardNumber}`,
            notes: `३०-महिने बचत योजना (जमा: ₹${totalPaid.toLocaleString('en-IN')})`,
          });
        }
      }
    });

    return list.sort((a, b) => b.dueAmount - a.dueAmount);
  }, [customers, cardMembers]);

  // Unique villages
  const villagesList = useMemo(() => {
    const set = new Set<string>();
    allDueItems.forEach((item) => {
      if (item.village && item.village !== 'गाव नमूद नाही') set.add(item.village.trim());
    });
    return Array.from(set).sort();
  }, [allDueItems]);

  // Filtered dues
  const filteredDues = useMemo(() => {
    return allDueItems.filter((item) => {
      if (filterType === 'khata' && item.type !== 'KhataCustomer') return false;
      if (filterType === 'card' && item.type !== 'CardSchemeMember') return false;
      if (selectedVillage !== 'all' && item.village !== selectedVillage) return false;
      if (minDue > 0 && item.dueAmount < minDue) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchPhone = item.phone.includes(q);
        const matchVillage = item.village.toLowerCase().includes(q);
        const matchId = item.identifier.toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchVillage && !matchId) return false;
      }
      return true;
    });
  }, [allDueItems, filterType, selectedVillage, minDue, search]);

  const totalFilteredDueAmount = useMemo(() => {
    return filteredDues.reduce((sum, item) => sum + item.dueAmount, 0);
  }, [filteredDues]);

  if (!isOpen) return null;

  const upiId = settings.upiId || '8766486915@ybl';
  const businessName = settings.businessName || 'Shri Sai Enterprises';

  const generateUpiPayload = (item: DueItem) => {
    const note = encodeURIComponent(`Payment from ${item.name} (${item.identifier})`);
    return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(businessName)}&am=${item.dueAmount}&cu=INR&tn=${note}`;
  };

  const generateWhatsAppMessage = (item: DueItem) => {
    const upiLink = generateUpiPayload(item);
    if (item.type === 'CardSchemeMember') {
      return `नमस्कार ${item.name}जी,\n*${businessName} - ३०-महिने साप्ताहिक बचत योजना*\nआपले ${item.identifier} चालू आठवड्याचा हप्ता: *₹${item.dueAmount.toLocaleString('en-IN')}* बाकी आहे.\n\nकृपया खालील लिंकवरून PhonePe/GooglePay द्वारे किंवा एजंटकडे जमा करावा:\n📲 थेट UPI पेमेंट लिंक: ${upiLink}\nUPI ID: *${upiId}*\n\nकाही अडचण असल्यास संपर्क: ${settings.phone || '8766486915'}\nधन्यवाद!`;
    }

    return `नमस्कार ${item.name}जी,\n*${businessName} - उधारी / खाते स्मरणपत्र*\nआपली दुकानातील चालू बाकी रक्कम *₹${item.dueAmount.toLocaleString('en-IN')}* आहे.\n\nकृपया खालील UPI द्वारे त्वरित ऑनलाइन पेमेंट करावे:\n📲 थेट UPI पेमेंट लिंक: ${upiLink}\nUPI ID: *${upiId}*\n\nदुकान पत्ता: ${settings.address || 'आर्वी'}\nसंपर्क: ${settings.phone || '8766486915'}\nधन्यवाद!`;
  };

  const handleSendWhatsApp = (item: DueItem) => {
    const text = generateWhatsAppMessage(item);
    const cleanPh = item.phone.replace(/[^0-9]/g, '').slice(-10);
    const url = cleanPh
      ? `https://wa.me/91${cleanPh}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleCopyMessage = (item: DueItem) => {
    const text = generateWhatsAppMessage(item);
    navigator.clipboard?.writeText(text);
    setCopiedText(item.id);
    setTimeout(() => setCopiedText(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-800 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                <span>थकीत हप्ता व उधारी WhatsApp रिमाइंडर्स (Due Reminders Hub)</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 text-[10px] font-bold border border-emerald-300/30">
                  UPI QR Enabled
                </span>
              </h2>
              <p className="text-xs text-emerald-100/80 font-medium">
                ग्राहकांना १-क्लिकमध्ये UPI पेमेंट लिंक व QR कोडसह हप्त्याची आठवण पाठवा
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-black/20 hover:bg-black/40 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 space-y-3 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Filter Tabs */}
            <div className="inline-flex rounded-xl bg-slate-200 dark:bg-slate-700/60 p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  filterType === 'all'
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                सर्व बाकीदार ({allDueItems.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('khata')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  filterType === 'khata'
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                दुकान उधारी खाते
              </button>
              <button
                type="button"
                onClick={() => setFilterType('card')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  filterType === 'card'
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                ३०-महिने बचत योजना
              </button>
            </div>

            {/* Total Due Badge */}
            <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 px-3 py-1.5 rounded-xl text-xs">
              <span className="text-slate-600 dark:text-slate-300 font-medium">निवडलेली एकूण बाकी:</span>
              <strong className="text-emerald-700 dark:text-emerald-300 font-mono font-black text-sm">
                ₹{totalFilteredDueAmount.toLocaleString('en-IN')}
              </strong>
            </div>
          </div>

          {/* Search and Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ग्राहक नाव किंवा मोबाईल नंबर शोधा..."
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <select
                value={selectedVillage}
                onChange={(e) => setSelectedVillage(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                <option value="all">सर्व गावे (All Villages)</option>
                {villagesList.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={minDue}
                onChange={(e) => setMinDue(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                <option value={0}>सर्व रकमेचे बाकीदार</option>
                <option value={500}>₹500 पेक्षा जास्त</option>
                <option value={1000}>₹1,000 पेक्षा जास्त</option>
                <option value={5000}>₹5,000 पेक्षा जास्त</option>
                <option value={10000}>₹10,000 पेक्षा जास्त</option>
              </select>
            </div>
          </div>
        </div>

        {/* Customer Dues List */}
        <div className="p-3 sm:p-4 overflow-y-auto flex-1 divide-y divide-slate-100 dark:divide-slate-800">
          {filteredDues.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                कोणतीही बाकी आढळली नाही
              </h3>
              <p className="text-xs text-slate-500">
                निवडलेल्या फिल्टर्सनुसार सर्व हप्ते व उधारी जमा आहेत.
              </p>
            </div>
          ) : (
            filteredDues.map((item) => (
              <div
                key={item.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 px-2 rounded-xl transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      {item.name}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.type === 'CardSchemeMember'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                      }`}
                    >
                      {item.identifier}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    {item.phone ? (
                      <span className="flex items-center gap-1 font-mono">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{item.phone}</span>
                      </span>
                    ) : (
                      <span className="text-rose-500 italic text-[11px]">मोबाईल नंबर नाही</span>
                    )}

                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-rose-400" />
                      <span>{item.village}</span>
                    </span>

                    {item.notes && <span className="text-slate-400">• {item.notes}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <div className="text-right mr-2">
                    <span className="text-[10px] text-slate-400 block">बाकी रक्कम</span>
                    <span className="text-sm sm:text-base font-black font-mono text-rose-600 dark:text-rose-400">
                      ₹{item.dueAmount.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* QR Preview Button */}
                  <button
                    type="button"
                    onClick={() => setActiveQrItem(item)}
                    title="UPI QR कोड पहा"
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition cursor-pointer"
                  >
                    <QrCode className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </button>

                  {/* Copy Message */}
                  <button
                    type="button"
                    onClick={() => handleCopyMessage(item)}
                    title="मेसेज कॉपी करा"
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition cursor-pointer"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  {/* Direct WhatsApp Button */}
                  <button
                    type="button"
                    onClick={() => handleSendWhatsApp(item)}
                    disabled={!item.phone}
                    className="px-3 py-2 rounded-xl bg-[#25D366] hover:bg-[#20ba59] disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5 fill-white" />
                    <span>WhatsApp</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Dynamic UPI QR Modal Popup */}
        {activeQrItem && (
          <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="text-left">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    {activeQrItem.name}
                  </h4>
                  <span className="text-xs text-slate-400">{activeQrItem.identifier}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveQrItem(null)}
                  className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Dynamic QR image generated via Google Charts QR service */}
              <div className="p-3 bg-white rounded-2xl shadow-inner inline-block border border-slate-200">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                    generateUpiPayload(activeQrItem)
                  )}`}
                  alt="UPI QR Code"
                  className="w-52 h-52 object-contain"
                />
              </div>

              <div>
                <span className="text-xs text-slate-400 block">स्कॅन करून भरा (Scan to Pay)</span>
                <strong className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                  ₹{activeQrItem.dueAmount.toLocaleString('en-IN')}
                </strong>
                <p className="text-[11px] text-slate-500 font-mono mt-1">UPI ID: {upiId}</p>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => handleSendWhatsApp(activeQrItem)}
                  className="flex-1 py-2 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition"
                >
                  <MessageCircle className="w-3.5 h-3.5 fill-white" />
                  <span>WhatsApp पाठवा</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveQrItem(null)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold"
                >
                  बंद करा
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>
            एकूण बाकीदार: <strong>{filteredDues.length}</strong> • UPI ID: <strong>{upiId}</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold transition cursor-pointer"
          >
            बंद करा (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
