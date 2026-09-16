import React, { useState, useMemo } from 'react';
import {
  X,
  AlertTriangle,
  GitMerge,
  ArrowRight,
  CheckCircle2,
  Receipt,
  FileText,
  UserCheck,
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Building2,
  Phone,
  MapPin
} from 'lucide-react';
import { Customer, TransactionEntry, CardMember } from '../types';

export interface DuplicatePair {
  id: string;
  custA: Customer;
  custB: Customer;
  reason: string;
  matchScore?: number;
}

interface DuplicateCustomerMergeModalProps {
  isOpen: boolean;
  onClose: () => void;
  duplicatePairs: DuplicatePair[];
  customers: Customer[];
  transactions: TransactionEntry[];
  cardMembers?: CardMember[];
  onMerge: (
    primaryId: string,
    duplicateId: string,
    mergedData: {
      name: string;
      phone: string;
      village?: string;
      address?: string;
    }
  ) => void;
  onDismissPair?: (pairId: string) => void;
  initialSelectedPairId?: string;
}

export const DuplicateCustomerMergeModal: React.FC<DuplicateCustomerMergeModalProps> = ({
  isOpen,
  onClose,
  duplicatePairs,
  customers,
  transactions,
  cardMembers = [],
  onMerge,
  onDismissPair,
  initialSelectedPairId,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [manualMode, setManualMode] = useState(false);
  const [manualIdA, setManualIdA] = useState<string>('');
  const [manualIdB, setManualIdB] = useState<string>('');

  // Selected details for merged result
  const [customName, setCustomName] = useState('');
  const [customPhone, setCustomPhone] = useState('');
  const [customVillage, setCustomVillage] = useState('');
  const [customAddress, setCustomAddress] = useState('');

  // Find active pair
  const activePair: DuplicatePair | null = useMemo(() => {
    if (manualMode) {
      const a = customers.find((c) => c.id === manualIdA);
      const b = customers.find((c) => c.id === manualIdB);
      if (a && b) {
        return {
          id: `manual-${a.id}-${b.id}`,
          custA: a,
          custB: b,
          reason: 'मॅन्युअल निवड (User Selected Accounts to Merge)',
        };
      }
      return null;
    }

    if (duplicatePairs.length === 0) return null;
    const foundIdx = initialSelectedPairId
      ? duplicatePairs.findIndex((p) => p.id === initialSelectedPairId)
      : -1;
    const safeIdx = foundIdx >= 0 ? foundIdx : Math.min(currentIndex, duplicatePairs.length - 1);
    return duplicatePairs[safeIdx] || null;
  }, [manualMode, manualIdA, manualIdB, duplicatePairs, currentIndex, initialSelectedPairId, customers]);

  // Sync default form inputs when pair changes
  React.useEffect(() => {
    if (activePair) {
      const name = activePair.custA.name.length >= activePair.custB.name.length
        ? activePair.custA.name
        : activePair.custB.name;
      const phone = activePair.custA.phone || activePair.custB.phone || '';
      const village = activePair.custA.village || activePair.custB.village || '';
      const address = activePair.custA.address || activePair.custB.address || '';

      setCustomName(name);
      setCustomPhone(phone);
      setCustomVillage(village);
      setCustomAddress(address);
    }
  }, [activePair]);

  if (!isOpen) return null;

  // Transactions belonging to Account A & B
  const txA = activePair
    ? transactions.filter(
        (t) =>
          t.customerId === activePair.custA.id ||
          (t.customerName && t.customerName.toLowerCase() === activePair.custA.name.toLowerCase())
      )
    : [];

  const txB = activePair
    ? transactions.filter(
        (t) =>
          t.customerId === activePair.custB.id ||
          (t.customerName && t.customerName.toLowerCase() === activePair.custB.name.toLowerCase())
      )
    : [];

  // Computed hisab metrics
  const dueA = activePair ? Number(activePair.custA.balanceDue) || 0 : 0;
  const purchasedA = activePair ? Number(activePair.custA.totalPurchased || activePair.custA.totalPurchases) || 0 : 0;
  const paidA = activePair ? Number(activePair.custA.totalPaid) || 0 : 0;

  const dueB = activePair ? Number(activePair.custB.balanceDue) || 0 : 0;
  const purchasedB = activePair ? Number(activePair.custB.totalPurchased || activePair.custB.totalPurchases) || 0 : 0;
  const paidB = activePair ? Number(activePair.custB.totalPaid) || 0 : 0;

  const combinedPurchased = purchasedA + purchasedB;
  const combinedPaid = paidA + paidB;
  const combinedDue = Math.max(0, combinedPurchased - combinedPaid);

  const handleConfirmMerge = () => {
    if (!activePair || !customName.trim()) return;

    onMerge(activePair.custA.id, activePair.custB.id, {
      name: customName.trim(),
      phone: customPhone.trim(),
      village: customVillage.trim() || undefined,
      address: customAddress.trim() || undefined,
    });

    if (!manualMode && duplicatePairs.length > 1) {
      setCurrentIndex((prev) => Math.min(prev, duplicatePairs.length - 2));
    } else {
      onClose();
    }
  };

  const handleDismiss = () => {
    if (activePair && onDismissPair) {
      onDismissPair(activePair.id);
    }
    if (duplicatePairs.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % duplicatePairs.length);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[96vh]">
        {/* Top Header */}
        <div className="bg-amber-500/10 dark:bg-amber-500/20 border-b border-amber-500/30 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0">
              <GitMerge className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  खाते विलीनीकरण व हिशोब ताळमेळ (Customer Accounts Merge & Review)
                </h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                  अकाउंटिंग दुरुस्ती
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                कोणती खाती एकत्र होणार आहेत आणि त्यांचा हिशोब कसा जुळणार आहे हे प्रत्यक्ष तपासा.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setManualMode(!manualMode)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition cursor-pointer"
            >
              {manualMode ? 'ऑटो शोधक (Auto Pairs)' : 'मॅन्युअल निवडा (Manual Pick)'}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Pair Carousel / Navigation */}
        {!manualMode && duplicatePairs.length > 0 && (
          <div className="bg-slate-100 dark:bg-slate-800/80 px-5 py-2.5 flex items-center justify-between border-b border-slate-200 dark:border-slate-700 text-xs font-semibold">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 dark:text-slate-400">संभाव्य डुप्लिकेट जोडी:</span>
              <span className="bg-amber-500 text-slate-950 font-bold px-2 py-0.5 rounded-md font-mono">
                {currentIndex + 1} / {duplicatePairs.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="px-2.5 py-1 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 disabled:opacity-40 transition flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> मागील (Prev)
              </button>
              <button
                onClick={() => setCurrentIndex((prev) => Math.min(duplicatePairs.length - 1, prev + 1))}
                disabled={currentIndex >= duplicatePairs.length - 1}
                className="px-2.5 py-1 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 disabled:opacity-40 transition flex items-center gap-1 cursor-pointer"
              >
                पुढील (Next) <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Manual Account Selector (if manualMode) */}
        {manualMode && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="font-bold block mb-1">पहिले खाते निवडा (Account A):</label>
              <select
                value={manualIdA}
                onChange={(e) => setManualIdA(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
              >
                <option value="">-- ग्राहक १ निवडा --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone || 'No phone'}) - {c.village || 'No village'} [बाकी: ₹{(c.balanceDue || 0).toLocaleString()}]
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-bold block mb-1">दुसरे खाते निवडा (Account B):</label>
              <select
                value={manualIdB}
                onChange={(e) => setManualIdB(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
              >
                <option value="">-- ग्राहक २ निवडा --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id} disabled={c.id === manualIdA}>
                    {c.name} ({c.phone || 'No phone'}) - {c.village || 'No village'} [बाकी: ₹{(c.balanceDue || 0).toLocaleString()}]
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Modal Main Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {activePair ? (
            <>
              {/* Detection Reason Banner */}
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>डुप्लिकेट आढळण्याचे कारण:</strong> {activePair.reason}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-amber-700 dark:text-amber-400 font-bold">
                  ID A: {activePair.custA.id.slice(-6)} • ID B: {activePair.custB.id.slice(-6)}
                </span>
              </div>

              {/* Side-by-Side Comparison of Account A vs Account B */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* ACCOUNT A */}
                <div className="border border-blue-300 dark:border-blue-900 bg-blue-50/30 dark:bg-blue-950/20 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-blue-200 dark:border-blue-800/60 pb-2">
                    <span className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                      खाते क्रमांक १ (Account A)
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      {txA.length} व्यवहाराच्या नोंदी
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                      {activePair.custA.name}
                    </h3>
                    <div className="flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-300 mt-1">
                      <span className="flex items-center gap-1 font-mono">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {activePair.custA.phone || 'फोन नंबर नाही'}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {activePair.custA.village || activePair.custA.address || 'गाव नोंद नाही'}
                      </span>
                    </div>
                  </div>

                  {/* Hisab KPI */}
                  <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-blue-200 dark:border-slate-700 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block">एकूण खरेदी</span>
                      <strong className="font-mono text-slate-900 dark:text-white font-black">
                        ₹{purchasedA.toLocaleString()}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">एकूण जमा</span>
                      <strong className="font-mono text-emerald-600 font-bold">
                        ₹{paidA.toLocaleString()}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">बाकी उधारी</span>
                      <strong className="font-mono text-amber-600 font-black">
                        ₹{dueA.toLocaleString()}
                      </strong>
                    </div>
                  </div>

                  {/* Transaction history peek */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">
                      खात्यातील प्रमुख व्यवहार ({txA.length}):
                    </span>
                    <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                      {txA.length === 0 ? (
                        <p className="text-[11px] text-slate-400 italic">कोणतेही बिल किंवा पावती उपलब्ध नाही.</p>
                      ) : (
                        txA.map((t) => (
                          <div
                            key={t.id}
                            className="p-1.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] flex justify-between items-center"
                          >
                            <div>
                              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                                #{t.invoiceNo}
                              </span>
                              <span className="text-slate-400 text-[10px] ml-1.5">{t.date}</span>
                              <div className="text-[10px] text-slate-600 dark:text-slate-400 truncate max-w-[180px]">
                                {t.itemDetails || 'खरेदी बिल'}
                              </div>
                            </div>
                            <div className="text-right font-mono">
                              <span className="font-bold text-slate-900 dark:text-white">
                                ₹{t.totalAmount.toLocaleString()}
                              </span>
                              {t.dueAmount > 0 && (
                                <span className="block text-[9px] text-amber-600">बाकी: ₹{t.dueAmount}</span>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* ACCOUNT B */}
                <div className="border border-purple-300 dark:border-purple-900 bg-purple-50/30 dark:bg-purple-950/20 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-purple-200 dark:border-purple-800/60 pb-2">
                    <span className="text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
                      खाते क्रमांक २ (Account B - Duplicate)
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      {txB.length} व्यवहाराच्या नोंदी
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                      {activePair.custB.name}
                    </h3>
                    <div className="flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-300 mt-1">
                      <span className="flex items-center gap-1 font-mono">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {activePair.custB.phone || 'फोन नंबर नाही'}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {activePair.custB.village || activePair.custB.address || 'गाव नोंद नाही'}
                      </span>
                    </div>
                  </div>

                  {/* Hisab KPI */}
                  <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-purple-200 dark:border-slate-700 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block">एकूण खरेदी</span>
                      <strong className="font-mono text-slate-900 dark:text-white font-black">
                        ₹{purchasedB.toLocaleString()}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">एकूण जमा</span>
                      <strong className="font-mono text-emerald-600 font-bold">
                        ₹{paidB.toLocaleString()}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">बाकी उधारी</span>
                      <strong className="font-mono text-amber-600 font-black">
                        ₹{dueB.toLocaleString()}
                      </strong>
                    </div>
                  </div>

                  {/* Transaction history peek */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">
                      खात्यातील प्रमुख व्यवहार ({txB.length}):
                    </span>
                    <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                      {txB.length === 0 ? (
                        <p className="text-[11px] text-slate-400 italic">कोणतेही बिल किंवा पावती उपलब्ध नाही.</p>
                      ) : (
                        txB.map((t) => (
                          <div
                            key={t.id}
                            className="p-1.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] flex justify-between items-center"
                          >
                            <div>
                              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                                #{t.invoiceNo}
                              </span>
                              <span className="text-slate-400 text-[10px] ml-1.5">{t.date}</span>
                              <div className="text-[10px] text-slate-600 dark:text-slate-400 truncate max-w-[180px]">
                                {t.itemDetails || 'खरेदी बिल'}
                              </div>
                            </div>
                            <div className="text-right font-mono">
                              <span className="font-bold text-slate-900 dark:text-white">
                                ₹{t.totalAmount.toLocaleString()}
                              </span>
                              {t.dueAmount > 0 && (
                                <span className="block text-[9px] text-amber-600">बाकी: ₹{t.dueAmount}</span>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Proposed Merged Account (अंतिम एकत्रित होणारे मास्टर खाते) */}
              <div className="border-2 border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-emerald-300 dark:border-emerald-800 pb-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-sm font-black text-emerald-950 dark:text-emerald-200">
                      मर्ज झाल्यानंतर होणारे अंतिम मास्टर खाते (Combined Master Khata)
                    </span>
                  </div>
                  <span className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold">
                    दोन्ही खात्यांचे सर्व {txA.length + txB.length} व्यवहार या खात्यात एकत्र जोडले जातील
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      अंतिम नाव (Master Customer Name) *
                    </label>
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                    />
                    <div className="flex gap-1 mt-1">
                      <button
                        type="button"
                        onClick={() => setCustomName(activePair.custA.name)}
                        className="text-[10px] text-blue-600 hover:underline cursor-pointer"
                      >
                        नाव A
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => setCustomName(activePair.custB.name)}
                        className="text-[10px] text-purple-600 hover:underline cursor-pointer"
                      >
                        नाव B
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      अंतिम फोन नंबर (Master Phone)
                    </label>
                    <input
                      type="text"
                      value={customPhone}
                      onChange={(e) => setCustomPhone(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                    />
                    <div className="flex gap-1 mt-1">
                      {activePair.custA.phone && (
                        <button
                          type="button"
                          onClick={() => setCustomPhone(activePair.custA.phone)}
                          className="text-[10px] text-blue-600 hover:underline cursor-pointer"
                        >
                          फोन A
                        </button>
                      )}
                      {activePair.custB.phone && (
                        <button
                          type="button"
                          onClick={() => setCustomPhone(activePair.custB.phone)}
                          className="text-[10px] text-purple-600 hover:underline cursor-pointer"
                        >
                          फोन B
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      गाव (Village)
                    </label>
                    <input
                      type="text"
                      value={customVillage}
                      onChange={(e) => setCustomVillage(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                    />
                    <div className="flex gap-1 mt-1">
                      {activePair.custA.village && (
                        <button
                          type="button"
                          onClick={() => setCustomVillage(activePair.custA.village || '')}
                          className="text-[10px] text-blue-600 hover:underline cursor-pointer"
                        >
                          गाव A
                        </button>
                      )}
                      {activePair.custB.village && (
                        <button
                          type="button"
                          onClick={() => setCustomVillage(activePair.custB.village || '')}
                          className="text-[10px] text-purple-600 hover:underline cursor-pointer"
                        >
                          गाव B
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      पत्ता (Address)
                    </label>
                    <input
                      type="text"
                      value={customAddress}
                      onChange={(e) => setCustomAddress(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Combined Financial Ledger Balance */}
                <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-emerald-300 dark:border-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex flex-wrap gap-4 items-center">
                    <div>
                      <span className="text-[10px] text-slate-500 block">एकत्रित खरेदी (Acc A + B)</span>
                      <strong className="text-sm font-mono font-black text-slate-900 dark:text-white">
                        ₹{combinedPurchased.toLocaleString()}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">एकत्रित जमा रक्कम</span>
                      <strong className="text-sm font-mono font-bold text-emerald-600">
                        ₹{combinedPaid.toLocaleString()}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">अंतिम बाकी उधारी (Net Balance)</span>
                      <strong className="text-base font-mono font-black text-amber-600">
                        ₹{combinedDue.toLocaleString()}
                      </strong>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                    ✓ {txA.length + txB.length} बिले व पावत्या सुरक्षित जोडल्या जातील
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-slate-500">
              <UserCheck className="w-12 h-12 mx-auto text-emerald-600 mb-2" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                कोणतीही डुप्लिकेट खाती प्रलंबित नाहीत!
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                सर्व ग्राहक खाती व्यवस्थित आणि ताडून तपासलेली आहेत. आपण वरून मॅन्युअल मोडमध्ये जाऊन हवी ती दोन खाती एकत्र करू शकता.
              </p>
            </div>
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div className="bg-slate-100 dark:bg-slate-800/80 px-5 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-700">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            विलीनीकरणानंतर सर्व जुना डेटा आणि व्यवहार पूर्णपणे सुरक्षित राहतात.
          </span>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {activePair && (
              <button
                type="button"
                onClick={handleDismiss}
                className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-white dark:hover:bg-slate-700 transition cursor-pointer"
                title="Keep both accounts separate"
              >
                ही २ स्वतंत्र खाती ठेवा (Keep Separate)
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold hover:bg-slate-300 transition cursor-pointer"
            >
              रद्द करा (Cancel)
            </button>

            {activePair && (
              <button
                type="button"
                onClick={handleConfirmMerge}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>होय, हिशोब बरोबर आहे - एकत्र करा (Confirm Merge)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
