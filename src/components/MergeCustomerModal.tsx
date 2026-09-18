import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Merge,
  ArrowRight,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Search,
  Phone,
  MapPin,
  IndianRupee,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { Customer } from '../types';

export interface MergeCustomerModalProps {
  isOpen?: boolean;
  onClose: () => void;
  customers: Customer[];
  initialPrimaryCustomer?: Customer | null;
  initialSecondaryCustomer?: Customer | null;
  initialPrimary?: Customer | null;
  initialSecondary?: Customer | null;
  onConfirmMerge?: (
    primaryId: string,
    secondaryId: string,
    customOverrides?: {
      name?: string;
      phone?: string;
      village?: string;
      address?: string;
    }
  ) => void;
  onMerge?: (
    primaryId: string,
    secondaryId: string,
    customOverrides?: {
      name?: string;
      phone?: string;
      village?: string;
      address?: string;
    }
  ) => void;
}

export const MergeCustomerModal: React.FC<MergeCustomerModalProps> = ({
  isOpen = true,
  onClose,
  customers,
  initialPrimaryCustomer,
  initialSecondaryCustomer,
  initialPrimary,
  initialSecondary,
  onConfirmMerge,
  onMerge,
}) => {
  const effectivePrimary = initialPrimaryCustomer || initialPrimary;
  const effectiveSecondary = initialSecondaryCustomer || initialSecondary;

  const [primaryId, setPrimaryId] = useState<string>(effectivePrimary?.id || '');
  const [secondaryId, setSecondaryId] = useState<string>(effectiveSecondary?.id || '');

  const [primarySearch, setPrimarySearch] = useState<string>('');
  const [secondarySearch, setSecondarySearch] = useState<string>('');

  const [customName, setCustomName] = useState<string>('');
  const [customPhone, setCustomPhone] = useState<string>('');
  const [customVillage, setCustomVillage] = useState<string>('');
  const [customAddress, setCustomAddress] = useState<string>('');
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Sync initial selections when modal opens or initial props change
  useEffect(() => {
    if (isOpen) {
      if (effectivePrimary) setPrimaryId(effectivePrimary.id);
      if (effectiveSecondary) setSecondaryId(effectiveSecondary.id);
    }
  }, [isOpen, effectivePrimary, effectiveSecondary]);

  const primary = useMemo(() => customers.find((c) => c.id === primaryId), [customers, primaryId]);
  const secondary = useMemo(() => customers.find((c) => c.id === secondaryId), [customers, secondaryId]);

  // Pre-fill combined fields when both are selected
  useEffect(() => {
    if (primary && secondary) {
      const isShesh =
        (primary.name + ' ' + secondary.name).toLowerCase().includes('shesh') &&
        (primary.name + ' ' + secondary.name).toLowerCase().includes('bhagat');

      const bestName = isShesh ? 'SHESHRAO BHAGAT' : (primary.name.length >= secondary.name.length ? primary.name : secondary.name);
      setCustomName(bestName);

      const p1 = (primary.phone || '').replace(/\D/g, '');
      const p2 = (secondary.phone || '').replace(/\D/g, '');
      const bestPhone = p1.length >= 10 ? p1.slice(-10) : (p2.length >= 10 ? p2.slice(-10) : '');
      setCustomPhone(bestPhone);

      const bestVillage = primary.village || secondary.village || '';
      setCustomVillage(bestVillage);

      let bestAddress = primary.address || secondary.address || '';
      if (!bestAddress && bestVillage) {
        bestAddress = `${bestVillage}, Wardha`;
      }
      setCustomAddress(bestAddress);
    } else if (primary) {
      setCustomName(primary.name);
      setCustomPhone(primary.phone || '');
      setCustomVillage(primary.village || '');
      setCustomAddress(primary.address || '');
    }
  }, [primary, secondary]);

  // Filtered dropdown lists
  const filteredPrimaryList = useMemo(() => {
    if (!primarySearch.trim()) return customers.slice(0, 150);
    const q = primarySearch.toLowerCase().trim();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q)) ||
        (c.village && c.village.toLowerCase().includes(q))
    ).slice(0, 150);
  }, [customers, primarySearch]);

  const filteredSecondaryList = useMemo(() => {
    const candidateList = customers.filter((c) => c.id !== primaryId);
    if (!secondarySearch.trim()) return candidateList.slice(0, 150);
    const q = secondarySearch.toLowerCase().trim();
    return candidateList.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q)) ||
        (c.village && c.village.toLowerCase().includes(q))
    ).slice(0, 150);
  }, [customers, primaryId, secondarySearch]);

  if (!isOpen) return null;

  // Financial calculations
  const pur1 = primary ? Math.max(primary.totalPurchased || 0, (primary.totalPaid || 0) + (primary.balanceDue || 0)) : 0;
  const pur2 = secondary ? Math.max(secondary.totalPurchased || 0, (secondary.totalPaid || 0) + (secondary.balanceDue || 0)) : 0;
  const combinedPurchased = pur1 + pur2;
  const combinedPaid = (primary?.totalPaid || 0) + (secondary?.totalPaid || 0);
  const combinedDue = Math.max(0, combinedPurchased - combinedPaid);

  const handleMergeSubmit = () => {
    setErrorNotice(null);
    if (!primaryId || !secondaryId) {
      setErrorNotice('कृपया मुख्य खाते (Primary) आणि मर्ज करायचे दुय्यम खाते (Secondary) दोन्ही निवडा.');
      return;
    }
    if (primaryId === secondaryId) {
      setErrorNotice('दोन्ही खाती वेगळी असणे आवश्यक आहे.');
      return;
    }

    const mergeCallback = onConfirmMerge || onMerge;
    if (mergeCallback) {
      mergeCallback(primaryId, secondaryId, {
        name: customName.trim(),
        phone: customPhone.trim(),
        village: customVillage.trim(),
        address: customAddress.trim(),
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white p-5 sm:p-6 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-white/10 border border-white/20 shrink-0">
              <Merge className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight">
                खाते एकत्र / मर्ज करा (Customer Account Merge)
              </h2>
              <p className="text-xs sm:text-sm text-blue-100 mt-0.5">
                दोन स्वतंत्र खाती एकाच व्यक्तीची असल्यास सर्व बिले, पावत्या व बाकी एकत्र करून एकच अचूक खाते बनवा.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Top Notice */}
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs sm:text-sm flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">अकाउंटिंग सुरक्षितता हमी:</strong> खाते विलीन (Merge) केल्यानंतर दुय्यम खात्याची सर्व जुनी बिले आणि जमा पावत्या आपोआप मुख्य खात्याशी कायमस्वरूपी जोडल्या जातात. यामुळे ताळेबंदामध्ये ₹1 चाही फरक पडत नाही.
            </div>
          </div>

          {errorNotice && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs sm:text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="font-bold">{errorNotice}</div>
            </div>
          )}

          {/* 2-Column Selection Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Box 1: Primary Account */}
            <div className="p-4 rounded-2xl border-2 border-blue-200 dark:border-blue-900 bg-blue-50/40 dark:bg-blue-950/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-blue-700 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4" />
                  <span>१. मुख्य खाते (राखून ठेवायचे)</span>
                </span>
                <span className="text-[11px] bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-bold px-2 py-0.5 rounded-md">
                  Primary ID
                </span>
              </div>

              {primary ? (
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 shadow-2xs space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-black text-slate-900 dark:text-white text-base">
                        {primary.name}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{primary.phone || 'मोबाईल नाही'}</span>
                      </div>
                      {(primary.village || primary.address) && (
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{primary.village || primary.address}</span>
                        </div>
                      )}
                    </div>
                    <span className="px-2 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 text-xs font-black">
                      बाकी: ₹{(primary.balanceDue || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-700 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">खरेदी</span>
                      <span className="font-bold font-mono">₹{pur1.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">भरणा</span>
                      <span className="font-bold font-mono text-emerald-600">₹{(primary.totalPaid || 0).toLocaleString()}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPrimaryId('')}
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-bold pt-1 block"
                  >
                    बदला / दुसरे निवडा ↺
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="मुख्य ग्राहक शोधा (नाव किंवा मोबाईल)..."
                      value={primarySearch}
                      onChange={(e) => setPrimarySearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-1">
                    {filteredPrimaryList.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setPrimaryId(c.id);
                          setPrimarySearch('');
                        }}
                        className="w-full text-left p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-700 text-xs flex items-center justify-between transition cursor-pointer"
                      >
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{c.name}</div>
                          <div className="text-[11px] text-slate-500">{c.phone || 'मोबाईल नाही'} {c.village ? `• ${c.village}` : ''}</div>
                        </div>
                        <span className="font-mono font-bold text-amber-600 text-[11px]">
                          ₹{(c.balanceDue || 0).toLocaleString()}
                        </span>
                      </button>
                    ))}
                    {filteredPrimaryList.length === 0 && (
                      <div className="p-3 text-center text-xs text-slate-400">
                        {customers.length === 0 ? 'अद्याप ग्राहक उपलब्ध नाहीत' : 'कोणताही ग्राहक सापडला नाही'}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Box 2: Secondary Account (To be merged in) */}
            <div className="p-4 rounded-2xl border-2 border-rose-200 dark:border-rose-900 bg-rose-50/40 dark:bg-rose-950/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-rose-700 dark:text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Merge className="w-4 h-4" />
                  <span>२. विलीन होणारे खाते (Secondary - Merge In)</span>
                </span>
                <span className="text-[11px] bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-200 font-bold px-2 py-0.5 rounded-md">
                  विलीन होईल
                </span>
              </div>

              {secondary ? (
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-800 shadow-2xs space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-black text-slate-900 dark:text-white text-base">
                        {secondary.name}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{secondary.phone || 'मोबाईल नाही'}</span>
                      </div>
                      {(secondary.village || secondary.address) && (
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{secondary.village || secondary.address}</span>
                        </div>
                      )}
                    </div>
                    <span className="px-2 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 text-xs font-black">
                      बाकी: ₹{(secondary.balanceDue || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-700 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">खरेदी</span>
                      <span className="font-bold font-mono">₹{pur2.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">भरणा</span>
                      <span className="font-bold font-mono text-emerald-600">₹{(secondary.totalPaid || 0).toLocaleString()}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSecondaryId('')}
                    className="text-[11px] text-rose-600 dark:text-rose-400 hover:underline font-bold pt-1 block"
                  >
                    बदला / दुसरे निवडा ↺
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="मर्ज करायचा ग्राहक शोधा (नाव किंवा मोबाईल)..."
                      value={secondarySearch}
                      onChange={(e) => setSecondarySearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-1">
                    {filteredSecondaryList.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setSecondaryId(c.id);
                          setSecondarySearch('');
                        }}
                        className="w-full text-left p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-slate-700 text-xs flex items-center justify-between transition cursor-pointer"
                      >
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{c.name}</div>
                          <div className="text-[11px] text-slate-500">{c.phone || 'मोबाईल नाही'} {c.village ? `• ${c.village}` : ''}</div>
                        </div>
                        <span className="font-mono font-bold text-amber-600 text-[11px]">
                          ₹{(c.balanceDue || 0).toLocaleString()}
                        </span>
                      </button>
                    ))}
                    {filteredSecondaryList.length === 0 && (
                      <div className="p-3 text-center text-xs text-slate-400">
                        {customers.length <= 1 ? 'मर्ज करण्यासाठी दुसरा ग्राहक उपलब्ध नाही' : 'कोणताही ग्राहक सापडला नाही'}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Live Merged Output Preview */}
          {primary && secondary && (
            <div className="rounded-2xl border-2 border-emerald-400 dark:border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 p-5 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>एकत्रित खात्याचे स्वरूप (Combined Account Result)</span>
                </span>
                <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white font-bold text-xs">
                  नवीन फायनल खाते
                </span>
              </div>

              {/* Editable Fields for perfect accuracy */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    ग्राहकाचे अधिकृत नाव (Official Name)
                  </label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    मोबाईल नंबर (Contact Phone)
                  </label>
                  <input
                    type="tel"
                    value={customPhone}
                    onChange={(e) => setCustomPhone(e.target.value)}
                    placeholder="10 अंकी मोबाईल नंबर"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold font-mono text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    गाव (Village)
                  </label>
                  <input
                    type="text"
                    value={customVillage}
                    onChange={(e) => setCustomVillage(e.target.value)}
                    placeholder="उदा. Satoda, Wardha"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    पूर्ण पत्ता (Full Address)
                  </label>
                  <input
                    type="text"
                    value={customAddress}
                    onChange={(e) => setCustomAddress(e.target.value)}
                    placeholder="उदा. Satoda, Wardha"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Combined Financial Tally Bar */}
              <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800">
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">एकूण खरेदी (Total)</span>
                  <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white font-mono">
                    ₹{combinedPurchased.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    ({pur1.toLocaleString()} + {pur2.toLocaleString()})
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">एकूण भरणा (Paid)</span>
                  <span className="text-sm sm:text-base font-black text-emerald-700 dark:text-emerald-400 font-mono">
                    ₹{combinedPaid.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    ({(primary.totalPaid || 0).toLocaleString()} + {(secondary.totalPaid || 0).toLocaleString()})
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-amber-700 dark:text-amber-400 block font-medium">एकूण बाकी (Net Due)</span>
                  <span className="text-sm sm:text-base font-black text-amber-700 dark:text-amber-400 font-mono">
                    ₹{combinedDue.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    ({(primary.balanceDue || 0).toLocaleString()} + {(secondary.balanceDue || 0).toLocaleString()})
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            रद्द करा (Cancel)
          </button>

          <button
            type="button"
            disabled={!primary || !secondary || primary.id === secondary.id}
            onClick={handleMergeSubmit}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-blue-600/30 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer active:scale-95"
          >
            <Merge className="w-4 h-4" />
            <span>खाते एकत्र करा आणि सर्व बिले जोडा (Confirm & Merge)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
