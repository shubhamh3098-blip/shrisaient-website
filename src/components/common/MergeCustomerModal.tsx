import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  GitMerge,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Split,
  FileText,
  Calculator,
  Edit3,
  Phone,
  MapPin,
  Clock,
  Sparkles
} from 'lucide-react';
import { Customer, StoreData, Transaction, BillReceipt } from '../../types';
import { StorageService } from '../../services/storageService';

interface MergeCustomerModalProps {
  storeData: StoreData;
  onClose: () => void;
  onRefreshData: () => void;
}

interface DuplicatePair {
  accountA: Customer;
  accountB: Customer;
  reason: 'phone' | 'name' | 'manual';
  matchValue: string;
}

export const MergeCustomerModal: React.FC<MergeCustomerModalProps> = ({
  storeData,
  onClose,
  onRefreshData,
}) => {
  // Ignored pairs stored in localStorage so user doesn't see "Keep Separate" pairs repeatedly
  const [ignoredPairs, setIgnoredPairs] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('ignored_merge_pairs');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [isManualMode, setIsManualMode] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mergeNotice, setMergeNotice] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Manual selection states
  const [manualSourceId, setManualSourceId] = useState<string>('');
  const [manualTargetId, setManualTargetId] = useState<string>('');
  const [manualSearch, setManualSearch] = useState<string>('');

  // Find all potential duplicate pairs
  const duplicatePairs = useMemo<DuplicatePair[]>(() => {
    const pairs: DuplicatePair[] = [];
    const seenPairKeys = new Set<string>();

    const customers = storeData.customers;

    // 1. Match by Phone Number (clean 10 digits)
    const phoneMap = new Map<string, Customer[]>();
    customers.forEach((c) => {
      const p = c.phone ? c.phone.replace(/[^0-9]/g, '') : '';
      if (p && p.length >= 10 && p !== '0000000000' && p !== '1111111111' && p !== '9999999999') {
        const list = phoneMap.get(p) || [];
        list.push(c);
        phoneMap.set(p, list);
      }
    });

    phoneMap.forEach((list, phone) => {
      if (list.length > 1) {
        for (let i = 0; i < list.length; i++) {
          for (let j = i + 1; j < list.length; j++) {
            const a = list[i];
            const b = list[j];
            const pairKey = [a.id, b.id].sort().join('__');
            if (!seenPairKeys.has(pairKey) && !ignoredPairs.has(pairKey)) {
              seenPairKeys.add(pairKey);
              // Order by higher transaction count or older creation date as Account A
              const txCountA = storeData.transactions.filter((t) => t.customerId === a.id || t.customerPhone === a.phone).length;
              const txCountB = storeData.transactions.filter((t) => t.customerId === b.id || t.customerPhone === b.phone).length;
              if (txCountB > txCountA) {
                pairs.push({ accountA: b, accountB: a, reason: 'phone', matchValue: phone });
              } else {
                pairs.push({ accountA: a, accountB: b, reason: 'phone', matchValue: phone });
              }
            }
          }
        }
      }
    });

    // 2. Match by exact or very similar Name
    const nameMap = new Map<string, Customer[]>();
    customers.forEach((c) => {
      const n = c.name.trim().toLowerCase().replace(/\s+/g, ' ');
      if (n.length >= 3) {
        const list = nameMap.get(n) || [];
        list.push(c);
        nameMap.set(n, list);
      }
    });

    nameMap.forEach((list, cleanName) => {
      if (list.length > 1) {
        for (let i = 0; i < list.length; i++) {
          for (let j = i + 1; j < list.length; j++) {
            const a = list[i];
            const b = list[j];
            const pairKey = [a.id, b.id].sort().join('__');
            if (!seenPairKeys.has(pairKey) && !ignoredPairs.has(pairKey)) {
              seenPairKeys.add(pairKey);
              pairs.push({ accountA: a, accountB: b, reason: 'name', matchValue: cleanName });
            }
          }
        }
      }
    });

    return pairs;
  }, [storeData.customers, storeData.transactions, ignoredPairs]);

  // Active Pair based on mode
  const currentPair = useMemo<DuplicatePair | null>(() => {
    if (isManualMode) {
      if (!manualSourceId || !manualTargetId) return null;
      const a = storeData.customers.find((c) => c.id === manualTargetId);
      const b = storeData.customers.find((c) => c.id === manualSourceId);
      if (!a || !b) return null;
      return { accountA: a, accountB: b, reason: 'manual', matchValue: 'Manual' };
    }
    if (duplicatePairs.length === 0) return null;
    const safeIndex = Math.min(currentIndex, duplicatePairs.length - 1);
    return duplicatePairs[safeIndex] || null;
  }, [isManualMode, manualSourceId, manualTargetId, duplicatePairs, currentIndex, storeData.customers]);

  const accA = currentPair?.accountA || null;
  const accB = currentPair?.accountB || null;

  // Retrieve Transactions for Account A
  const transactionsA = useMemo(() => {
    if (!accA) return [];
    const pA = accA.phone ? accA.phone.replace(/[^0-9]/g, '') : '';
    const nA = accA.name.trim().toLowerCase();
    return storeData.transactions.filter((t) => {
      const matchId = t.customerId === accA.id;
      const matchP = pA && pA.length >= 10 && t.customerPhone && t.customerPhone.replace(/[^0-9]/g, '') === pA;
      const matchN = t.customerName && t.customerName.trim().toLowerCase() === nA;
      return matchId || matchP || matchN;
    });
  }, [accA, storeData.transactions]);

  // Retrieve Transactions for Account B
  const transactionsB = useMemo(() => {
    if (!accB) return [];
    const pB = accB.phone ? accB.phone.replace(/[^0-9]/g, '') : '';
    const nB = accB.name.trim().toLowerCase();
    return storeData.transactions.filter((t) => {
      const matchId = t.customerId === accB.id;
      // If same phone, don't double include what is already in A if distinct IDs
      const matchP = pB && pB.length >= 10 && t.customerPhone && t.customerPhone.replace(/[^0-9]/g, '') === pB && t.customerId === accB.id;
      const matchN = t.customerName && t.customerName.trim().toLowerCase() === nB && t.customerId === accB.id;
      return matchId || matchP || matchN;
    });
  }, [accB, storeData.transactions]);

  // Combined Distinct Transactions count
  const allMergedTransactions = useMemo(() => {
    const map = new Map<string, Transaction>();
    transactionsA.forEach((t) => map.set(t.id, t));
    transactionsB.forEach((t) => map.set(t.id, t));
    return Array.from(map.values());
  }, [transactionsA, transactionsB]);

  // Calculation Mode & Editable Final Master Fields
  const [calcMode, setCalcMode] = useState<'actual' | 'sum' | 'accA' | 'accB'>('actual');
  const [masterName, setMasterName] = useState('');
  const [masterPhone, setMasterPhone] = useState('');
  const [masterVillage, setMasterVillage] = useState('');
  const [masterAddress, setMasterAddress] = useState('');

  // Editable Financial amounts
  const [finalPurchases, setFinalPurchases] = useState<number>(0);
  const [finalPaid, setFinalPaid] = useState<number>(0);
  const [finalDue, setFinalDue] = useState<number>(0);

  // Initialize/reset form whenever active pair changes
  useEffect(() => {
    if (!accA || !accB) return;

    // Prefer name with more detail or uppercase
    setMasterName(accA.name || accB.name);
    setMasterPhone(accA.phone || accB.phone);
    setMasterVillage(accA.city || accB.city || accA.address || '');
    setMasterAddress(accA.address || accB.address || 'Alodi, Wardha');

    // Determine smart financial calculation
    // If transactions exist, calculate directly from actual distinct invoices to prevent double counting
    const txTotalPurchased = allMergedTransactions.reduce((acc, t) => acc + (t.grandTotal || 0), 0);
    const txTotalPaid = allMergedTransactions.reduce((acc, t) => acc + (t.paidAmount || 0), 0);
    const txTotalDue = allMergedTransactions.reduce((acc, t) => acc + (t.balanceDue || 0), 0);

    if (allMergedTransactions.length > 0) {
      setCalcMode('actual');
      setFinalPurchases(txTotalPurchased);
      setFinalPaid(txTotalPaid);
      setFinalDue(txTotalDue);
    } else {
      // No transactions found, compare imported amounts
      setCalcMode('sum');
      const p = (accA.totalPurchased || 0) + (accB.totalPurchased || 0);
      const d = (accA.currentBalance || 0) + (accB.currentBalance || 0);
      const pd = Math.max(0, p - d);
      setFinalPurchases(p);
      setFinalPaid(pd);
      setFinalDue(d);
    }
  }, [accA?.id, accB?.id, allMergedTransactions]);

  // Handle calculation mode change
  const handleCalcModeChange = (mode: 'actual' | 'sum' | 'accA' | 'accB') => {
    if (!accA || !accB) return;
    setCalcMode(mode);

    if (mode === 'actual') {
      const txTotalPurchased = allMergedTransactions.reduce((acc, t) => acc + (t.grandTotal || 0), 0);
      const txTotalPaid = allMergedTransactions.reduce((acc, t) => acc + (t.paidAmount || 0), 0);
      const txTotalDue = allMergedTransactions.reduce((acc, t) => acc + (t.balanceDue || 0), 0);
      if (allMergedTransactions.length > 0) {
        setFinalPurchases(txTotalPurchased);
        setFinalPaid(txTotalPaid);
        setFinalDue(txTotalDue);
      } else {
        setFinalPurchases(Math.max(accA.totalPurchased || 0, accB.totalPurchased || 0));
        setFinalDue(Math.max(accA.currentBalance || 0, accB.currentBalance || 0));
        setFinalPaid(Math.max(0, finalPurchases - finalDue));
      }
    } else if (mode === 'sum') {
      const p = (accA.totalPurchased || 0) + (accB.totalPurchased || 0);
      const d = (accA.currentBalance || 0) + (accB.currentBalance || 0);
      setFinalPurchases(p);
      setFinalDue(d);
      setFinalPaid(Math.max(0, p - d));
    } else if (mode === 'accA') {
      const p = accA.totalPurchased || 0;
      const d = accA.currentBalance || 0;
      setFinalPurchases(p);
      setFinalDue(d);
      setFinalPaid(Math.max(0, p - d));
    } else if (mode === 'accB') {
      const p = accB.totalPurchased || 0;
      const d = accB.currentBalance || 0;
      setFinalPurchases(p);
      setFinalDue(d);
      setFinalPaid(Math.max(0, p - d));
    }
  };

  // Skip / Keep Separate
  const handleKeepSeparate = () => {
    if (!accA || !accB) return;
    const pairKey = [accA.id, accB.id].sort().join('__');
    const newIgnored = new Set(ignoredPairs);
    newIgnored.add(pairKey);
    setIgnoredPairs(newIgnored);
    try {
      localStorage.setItem('ignored_merge_pairs', JSON.stringify(Array.from(newIgnored)));
    } catch (e) {
      console.error(e);
    }

    if (currentIndex < duplicatePairs.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setMergeNotice({ type: 'info', message: 'सर्व संभाव्य डुप्लिकेट खाती तपासली गेली आहेत.' });
    }
  };

  // Perform Merge
  const handleConfirmMerge = () => {
    if (!accA || !accB) return;
    setMergeNotice(null);

    if (!masterName.trim()) {
      setMergeNotice({ type: 'error', message: 'कृपया अंतिम मास्टर खाते नाव प्रविष्ट करा.' });
      return;
    }

    const data = StorageService.loadData();
    const targetCustomer = data.customers.find((c) => c.id === accA.id);
    const sourceCustomer = data.customers.find((c) => c.id === accB.id);

    if (!targetCustomer || !sourceCustomer) {
      setMergeNotice({ type: 'error', message: 'ग्राहक माहिती लोड करताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा.' });
      return;
    }

    // 1. Update Master Customer with verified fields
    targetCustomer.name = masterName.trim().toUpperCase();
    targetCustomer.phone = masterPhone.trim();
    if (masterVillage.trim()) targetCustomer.city = masterVillage.trim();
    if (masterAddress.trim()) targetCustomer.address = masterAddress.trim();

    // 2. Set audited/verified financial totals
    targetCustomer.totalPurchased = Number(finalPurchases) || 0;
    targetCustomer.currentBalance = Number(finalDue) || 0;

    // 3. Reassign all transactions from Source to Target
    data.transactions.forEach((tx) => {
      if (tx.customerId === sourceCustomer.id) {
        tx.customerId = targetCustomer.id;
        tx.customerName = targetCustomer.name;
        tx.customerPhone = targetCustomer.phone;
      }
    });

    // 4. Reassign all receipts from Source to Target
    data.billReceipts.forEach((rc) => {
      if (rc.customerId === sourceCustomer.id) {
        rc.customerId = targetCustomer.id;
        rc.customerName = targetCustomer.name;
      }
    });

    // 5. Reassign 30-Month Scheme cards if any
    data.cardMembers.forEach((cm) => {
      if (cm.phone === sourceCustomer.phone || (cm as any).customerId === sourceCustomer.id) {
        cm.phone = targetCustomer.phone;
        cm.memberName = targetCustomer.name;
      }
    });

    // 6. Delete source customer
    data.customers = data.customers.filter((c) => c.id !== sourceCustomer.id);

    StorageService.saveData(data);
    onRefreshData();

    setMergeNotice({
      type: 'success',
      message: `✓ खाते विलीन झाले: ${targetCustomer.name} (${targetCustomer.phone}) | खरेदी: ₹${targetCustomer.totalPurchased.toLocaleString('en-IN')} | बाकी: ₹${targetCustomer.currentBalance.toLocaleString('en-IN')}`,
    });

    // Advance to next duplicate pair or close if none left
    if (duplicatePairs.length > 1) {
      setTimeout(() => {
        setCurrentIndex((prev) => Math.min(prev, duplicatePairs.length - 2));
      }, 1200);
    } else {
      setTimeout(() => {
        onClose();
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
              <GitMerge className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  खाते विलीनीकरण व हिशोब ताळमेळ (Customer Accounts Merge & Review)
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  अकाउंटिंग दुरुस्ती
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                कोणती खाती एकत्र होणार आहेत आणि त्यांचा हिशोब कसा जुळणार आहे हे प्रत्यक्ष तपासा.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsManualMode(!isManualMode)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer ${
                isManualMode
                  ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isManualMode ? 'जोड्या तपासा (Auto Pairs)' : 'मॅन्युअल निवडा (Manual Pick)'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {mergeNotice && (
            <div
              className={`p-3 rounded-xl text-xs font-bold flex items-center justify-between gap-2 ${
                mergeNotice.type === 'success'
                  ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                  : mergeNotice.type === 'error'
                  ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
                  : 'bg-sky-500/20 border border-sky-500/40 text-sky-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{mergeNotice.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setMergeNotice(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Top Bar: Pair Navigation or Manual Pick Search */}
          {!isManualMode ? (
            <div className="flex items-center justify-between bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">संभाव्य डुप्लिकेट जोडी:</span>
                <span className="text-xs font-black px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-mono">
                  {duplicatePairs.length > 0 ? currentIndex + 1 : 0} / {duplicatePairs.length}
                </span>
                {currentPair && (
                  <span className="text-[11px] text-slate-400 hidden sm:inline">
                    (कारण: {currentPair.reason === 'phone' ? `समान फोन नं. ${currentPair.matchValue}` : `समान नाव`})
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((p) => Math.max(0, p - 1))}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>मागील (Prev)</span>
                </button>
                <button
                  disabled={currentIndex >= duplicatePairs.length - 1}
                  onClick={() => setCurrentIndex((p) => Math.min(duplicatePairs.length - 1, p + 1))}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                >
                  <span>पुढील (Next)</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl space-y-3">
              <div className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5" />
                <span>कोणतीही दोन खाती मॅन्युअल निवडा (Pick Any 2 Accounts to Merge):</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    खाते क्रमांक १ (ACCOUNT A - मुख्य खाते):
                  </label>
                  <select
                    value={manualTargetId}
                    onChange={(e) => setManualTargetId(e.target.value)}
                    className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                  >
                    <option value="">-- मुख्य ग्राहक निवडा --</option>
                    {storeData.customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone}) - Due: ₹{c.currentBalance}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    खाते क्रमांक २ (ACCOUNT B - विलीन होणारे खाते):
                  </label>
                  <select
                    value={manualSourceId}
                    onChange={(e) => setManualSourceId(e.target.value)}
                    className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                  >
                    <option value="">-- विलीन होणारा ग्राहक निवडा --</option>
                    {storeData.customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone}) - Due: ₹{c.currentBalance}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* If No Pairs */}
          {!currentPair ? (
            <div className="p-12 text-center bg-slate-950/60 rounded-2xl border border-slate-800 space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <div className="text-base font-bold text-white">अभिनंदन! कोणतेही प्रलंबित डुप्लिकेट खाते आढळले नाही</div>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                सर्व ग्राहकांची खाती व्यवस्थित आहेत. तुम्हाला गरज असल्यास वर &apos;मॅन्युअल निवडा&apos; बटण वापरून कोणतीही दोन खाती एकत्र करू शकता.
              </p>
            </div>
          ) : (
            <>
              {/* Side by Side Account Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* ACCOUNT A */}
                <div className="bg-slate-950/90 border-2 border-blue-500/40 rounded-2xl p-4 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-black text-blue-400 tracking-wider uppercase">
                      खाते क्रमांक १ (ACCOUNT A)
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">
                      {transactionsA.length} व्यवहाराच्या नोंदी
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-black text-white uppercase">{accA?.name}</h3>
                    <div className="text-xs text-slate-400 flex items-center gap-3 mt-1 flex-wrap">
                      <span className="flex items-center gap-1 font-mono">
                        <Phone className="w-3 h-3 text-slate-500" />
                        {accA?.phone || 'फोन नाही'}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        {accA?.city || accA?.address || 'Alodi, Wardha'}
                      </span>
                    </div>
                  </div>

                  {/* Financial Metrics */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-center">
                    <div>
                      <div className="text-[10px] text-slate-400">एकूण खरेदी</div>
                      <div className="text-xs font-black text-white font-mono mt-0.5">
                        ₹{(accA?.totalPurchased || 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">एकूण जमा</div>
                      <div className="text-xs font-black text-emerald-400 font-mono mt-0.5">
                        ₹{Math.max(0, (accA?.totalPurchased || 0) - (accA?.currentBalance || 0)).toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">बाकी उधारी</div>
                      <div className="text-xs font-black text-amber-400 font-mono mt-0.5">
                        ₹{(accA?.currentBalance || 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  {/* Transaction Records */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-400">
                      खात्यातील प्रमुख व्यवहार ({transactionsA.length}):
                    </div>
                    <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                      {transactionsA.length === 0 ? (
                        <div className="text-xs text-slate-500 italic p-2 bg-slate-900/40 rounded-lg">
                          कोणतेही बिल किंवा पावती उपलब्ध नाही.
                        </div>
                      ) : (
                        transactionsA.map((tx) => (
                          <div
                            key={tx.id}
                            className="p-2 bg-slate-900 border border-slate-800/80 rounded-lg text-[11px] flex items-center justify-between gap-2"
                          >
                            <div className="truncate">
                              <span className="font-mono font-bold text-blue-400">#{tx.invoiceNo}</span>{' '}
                              <span className="text-slate-400 text-[10px]">{new Date(tx.date).toISOString().slice(0, 10)}</span>
                              <div className="text-slate-300 truncate">
                                {tx.items.map((i) => i.name).join(' & ')}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="font-bold text-white font-mono">₹{tx.grandTotal.toLocaleString('en-IN')}</div>
                              <div className="text-amber-400 font-bold text-[10px]">बाकी: ₹{tx.balanceDue.toLocaleString('en-IN')}</div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* ACCOUNT B */}
                <div className="bg-slate-950/90 border-2 border-rose-500/40 rounded-2xl p-4 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-black text-rose-400 tracking-wider uppercase">
                      खाते क्रमांक २ (ACCOUNT B - DUPLICATE)
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">
                      {transactionsB.length} व्यवहाराच्या नोंदी
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-black text-white uppercase">{accB?.name}</h3>
                    <div className="text-xs text-slate-400 flex items-center gap-3 mt-1 flex-wrap">
                      <span className="flex items-center gap-1 font-mono">
                        <Phone className="w-3 h-3 text-slate-500" />
                        {accB?.phone || 'फोन नाही'}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        {accB?.city || accB?.address || 'Wardha'}
                      </span>
                    </div>
                  </div>

                  {/* Financial Metrics */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-center">
                    <div>
                      <div className="text-[10px] text-slate-400">एकूण खरेदी</div>
                      <div className="text-xs font-black text-white font-mono mt-0.5">
                        ₹{(accB?.totalPurchased || 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">एकूण जमा</div>
                      <div className="text-xs font-black text-emerald-400 font-mono mt-0.5">
                        ₹{Math.max(0, (accB?.totalPurchased || 0) - (accB?.currentBalance || 0)).toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">बाकी उधारी</div>
                      <div className="text-xs font-black text-amber-400 font-mono mt-0.5">
                        ₹{(accB?.currentBalance || 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  {/* Transaction Records */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-400">
                      खात्यातील प्रमुख व्यवहार ({transactionsB.length}):
                    </div>
                    <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                      {transactionsB.length === 0 ? (
                        <div className="text-xs text-slate-500 italic p-2 bg-slate-900/40 rounded-lg">
                          कोणतेही बिल किंवा पावती उपलब्ध नाही.
                        </div>
                      ) : (
                        transactionsB.map((tx) => (
                          <div
                            key={tx.id}
                            className="p-2 bg-slate-900 border border-slate-800/80 rounded-lg text-[11px] flex items-center justify-between gap-2"
                          >
                            <div className="truncate">
                              <span className="font-mono font-bold text-rose-400">#{tx.invoiceNo}</span>{' '}
                              <span className="text-slate-400 text-[10px]">{new Date(tx.date).toISOString().slice(0, 10)}</span>
                              <div className="text-slate-300 truncate">
                                {tx.items.map((i) => i.name).join(' & ')}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="font-bold text-white font-mono">₹{tx.grandTotal.toLocaleString('en-IN')}</div>
                              <div className="text-amber-400 font-bold text-[10px]">बाकी: ₹{tx.balanceDue.toLocaleString('en-IN')}</div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Master Khata Box */}
              <div className="bg-slate-950 border-2 border-emerald-500/50 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h4 className="text-sm sm:text-base font-black text-white">
                        मर्ज झाल्यानंतर होणारे अंतिम मास्टर खाते (Combined Master Khata)
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        दोन्ही खात्यांचे सर्व {allMergedTransactions.length} व्यवहार या खात्यात एकत्र जोडले जातील.
                      </p>
                    </div>
                  </div>

                  {/* Calculation Mode Selector Pills */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-400 font-bold">हिशोब पद्धत:</span>
                    <button
                      type="button"
                      onClick={() => handleCalcModeChange('actual')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition border cursor-pointer ${
                        calcMode === 'actual'
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                          : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                      title="प्रत्यक्ष बिले व पावत्यांवरून अचूक हिशोब (Double-counting टाळण्यासाठी सर्वोत्तम)"
                    >
                      ✓ प्रत्यक्ष व्यवहारांवरून (Recommended)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCalcModeChange('sum')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition border cursor-pointer ${
                        calcMode === 'sum'
                          ? 'bg-amber-600 text-white border-amber-500 shadow-xs'
                          : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                      title="दोन्ही खात्यांची बेरीज (A + B)"
                    >
                      बेरीज (A + B)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCalcModeChange('accA')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition border cursor-pointer ${
                        calcMode === 'accA'
                          ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                          : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      खाते A प्रमाणे
                    </button>
                  </div>
                </div>

                {/* Form Fields: Name, Phone, Village, Address */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 mb-1">
                      <span>अंतिम नाव (Master Name) *</span>
                      <div className="space-x-1 text-[10px]">
                        <button
                          type="button"
                          onClick={() => setMasterName(accA?.name || '')}
                          className="text-blue-400 hover:underline"
                        >
                          नाव A
                        </button>
                        <span className="text-slate-600">|</span>
                        <button
                          type="button"
                          onClick={() => setMasterName(accB?.name || '')}
                          className="text-rose-400 hover:underline"
                        >
                          नाव B
                        </button>
                      </div>
                    </div>
                    <input
                      type="text"
                      value={masterName}
                      onChange={(e) => setMasterName(e.target.value)}
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-white uppercase focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 mb-1">
                      <span>अंतिम फोन नंबर (Master Phone)</span>
                      <div className="space-x-1 text-[10px]">
                        <button
                          type="button"
                          onClick={() => setMasterPhone(accA?.phone || '')}
                          className="text-blue-400 hover:underline"
                        >
                          फोन A
                        </button>
                        <span className="text-slate-600">|</span>
                        <button
                          type="button"
                          onClick={() => setMasterPhone(accB?.phone || '')}
                          className="text-rose-400 hover:underline"
                        >
                          फोन B
                        </button>
                      </div>
                    </div>
                    <input
                      type="text"
                      value={masterPhone}
                      onChange={(e) => setMasterPhone(e.target.value)}
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono font-bold text-white focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      गाव (Village)
                    </label>
                    <input
                      type="text"
                      value={masterVillage}
                      onChange={(e) => setMasterVillage(e.target.value)}
                      placeholder="उदा. Alodi, Wardha"
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      पत्ता (Address)
                    </label>
                    <input
                      type="text"
                      value={masterAddress}
                      onChange={(e) => setMasterAddress(e.target.value)}
                      placeholder="उदा. मेन रोड, पोस्ट ऑफिस जवळ"
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Financial Summary & Direct Amount Overrides */}
                <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="grid grid-cols-3 gap-4 flex-1">
                    <div>
                      <span className="block text-[10px] text-slate-400">
                        {calcMode === 'actual' ? 'एकत्रित खरेदी (व्यवहारांवरून):' : 'एकत्रित खरेदी (Acc A + B):'}
                      </span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-slate-400 text-xs">₹</span>
                        <input
                          type="number"
                          value={finalPurchases}
                          onChange={(e) => setFinalPurchases(Number(e.target.value))}
                          className="w-full p-1 bg-slate-950 border border-slate-700 rounded text-xs font-mono font-black text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <span className="block text-[10px] text-slate-400">
                        एकत्रित जमा रक्कम:
                      </span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-emerald-500 text-xs">₹</span>
                        <input
                          type="number"
                          value={finalPaid}
                          onChange={(e) => setFinalPaid(Number(e.target.value))}
                          className="w-full p-1 bg-slate-950 border border-slate-700 rounded text-xs font-mono font-black text-emerald-400"
                        />
                      </div>
                    </div>

                    <div>
                      <span className="block text-[10px] text-amber-400 font-bold">
                        अंतिम बाकी उधारी (Net Balance):
                      </span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-amber-500 text-xs">₹</span>
                        <input
                          type="number"
                          value={finalDue}
                          onChange={(e) => setFinalDue(Number(e.target.value))}
                          className="w-full p-1 bg-slate-950 border border-amber-500/50 rounded text-xs font-mono font-black text-amber-400 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{allMergedTransactions.length} बिले व पावत्या सुरक्षित जोडल्या जातील</span>
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400">
            विलीनीकरणानंतर सर्व जुना डेटा आणि व्यवहार पूर्णपणे सुरक्षित राहतात.
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
            {currentPair && !isManualMode && (
              <button
                type="button"
                onClick={handleKeepSeparate}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                title="ही दोन खाती स्वतंत्र ठेवा, डुप्लिकेट म्हणून दाखवू नका"
              >
                ही २ स्वतंत्र खाती ठेवा (Keep Separate)
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              रद्द करा (Cancel)
            </button>

            {currentPair && (
              <button
                type="button"
                onClick={handleConfirmMerge}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition shadow-lg shadow-emerald-600/30 flex items-center gap-2 cursor-pointer"
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
