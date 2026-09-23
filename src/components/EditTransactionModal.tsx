import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Trash2,
  Calculator,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Phone,
  User,
  MapPin,
  FileText,
  CreditCard,
  Barcode,
  Tag
} from 'lucide-react';
import { TransactionEntry } from '../types';

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: TransactionEntry | null;
  onSave: (updated: TransactionEntry) => void;
  onDelete?: (id: string) => void;
  existingVillages?: string[];
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  isOpen,
  onClose,
  transaction,
  onSave,
  onDelete,
  existingVillages = [],
}) => {
  const [formData, setFormData] = useState<TransactionEntry | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (transaction) {
      setFormData({ ...transaction });
      setShowDeleteConfirm(false);
    } else {
      setFormData(null);
    }
  }, [transaction]);

  if (!isOpen || !formData) return null;

  const total = Number(formData.totalAmount) || 0;
  const paid = Number(formData.payingNow) || 0;
  const due = Number(formData.dueAmount) || 0;
  const mathDiff = total - (paid + due);
  const isMathBalanced = Math.abs(mathDiff) <= 1;

  const handleAutoCalcDue = () => {
    const calculatedDue = Math.max(0, total - paid);
    setFormData((prev) => (prev ? { ...prev, dueAmount: calculatedDue } : null));
  };

  const handleAutoCalcTotal = () => {
    const calculatedTotal = paid + due;
    setFormData((prev) => (prev ? { ...prev, totalAmount: calculatedTotal } : null));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerName.trim()) {
      alert('कृपया ग्राहकाचे नाव प्रविष्ट करा');
      return;
    }
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              ✏️
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                विक्री बिल दुरुस्त करा / एडिट करा
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                बिल क्र: #{formData.invoiceNo || 'REC'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-sm">
          {/* Math Balance Warning or Success Alert */}
          {!isMathBalanced ? (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs">
                <span className="font-bold text-amber-900 dark:text-amber-200 block">
                  हिशोब बेरीज तफावत आढळली! (Math Mismatch)
                </span>
                <span className="text-amber-800 dark:text-amber-300 mt-0.5 block">
                  एकूण बिल (₹{total.toLocaleString()}) ≠ जमा भरणा (₹{paid.toLocaleString()}) + उधारी बाकी (₹{due.toLocaleString()})
                  {mathDiff !== 0 && ` [तफावत: ₹${Math.abs(mathDiff).toLocaleString()}]`}
                </span>
                <div className="flex flex-wrap gap-2 mt-2">
                  <button
                    type="button"
                    onClick={handleAutoCalcDue}
                    className="px-2.5 py-1 rounded-md bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] shadow-xs cursor-pointer active:scale-95"
                  >
                    ⚡ आपोआप बाकी काढा (₹{Math.max(0, total - paid).toLocaleString()})
                  </button>
                  <button
                    type="button"
                    onClick={handleAutoCalcTotal}
                    className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-white font-bold text-[11px] cursor-pointer"
                  >
                    एकूण बिल बरोबर करा (₹{(paid + due).toLocaleString()})
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>हिशोब अचूक जुळला आहे: ₹{total.toLocaleString()} = ₹{paid.toLocaleString()} (जमा) + ₹{due.toLocaleString()} (बाकी)</span>
            </div>
          )}

          {/* Row 1: Bill No & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                बिल / पावती क्रमांक (Invoice No)
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={formData.invoiceNo}
                  onChange={(e) => setFormData({ ...formData, invoiceNo: e.target.value })}
                  placeholder="उदा. 2423, B-101"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                तारीख (Bill Date)
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  placeholder="DD/MM/YYYY"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Row 2: Customer Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              ग्राहकाचे पूर्ण नाव (Customer Name) *
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                required
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                placeholder="ग्राहकाचे नाव लिहा"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Row 3: Mobile Phone & Village */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                मोबाईल नंबर (Phone)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="tel"
                  value={formData.customerPhone === '0' ? '' : formData.customerPhone || ''}
                  onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value.replace(/\D/g, '') })}
                  placeholder="10 अंकी मोबाईल नंबर"
                  maxLength={10}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
              {(!formData.customerPhone || formData.customerPhone === '0' || formData.customerPhone.length < 10) && (
                <span className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 block">
                  ⚠️ मोबाईल नंबर उपलब्ध नाही किंवा अपूर्ण आहे
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                गाव / परिसर (Village / Area)
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  list="villages-datalist"
                  value={formData.village || ''}
                  onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                  placeholder="उदा. Satoda, Wardha, Hinganghat"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
                <datalist id="villages-datalist">
                  {existingVillages.map((v) => (
                    <option key={v} value={v} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>

          {/* Row 4: Item Details */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              खरेदी केलेल्या वस्तू / तपशील (Item Details)
            </label>
            <textarea
              rows={2}
              value={formData.itemDetails}
              onChange={(e) => setFormData({ ...formData, itemDetails: e.target.value })}
              placeholder="उदा. 43 Inch Smart LED TV + Wall Stand"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden resize-none"
            />
          </div>

          {/* Row 5: Model Number & Serial Number (Separated) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>मॉडेल नाव / नंबर (Model No)</span>
              </label>
              <input
                type="text"
                value={formData.modelNumber || formData.model || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  const updatedItems = formData.itemsDetail?.map((it, i) => i === 0 ? { ...it, modelNumber: val } : it);
                  setFormData({ ...formData, modelNumber: val, model: val, itemsDetail: updatedItems });
                }}
                placeholder="उदा. GL-B191KOWX, 43LM5600"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Barcode className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>सिरीयल नंबर / IMEI (Serial No)</span>
              </label>
              <input
                type="text"
                value={formData.serialNumber || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  const updatedItems = formData.itemsDetail?.map((it, i) => i === 0 ? { ...it, serialNumber: val } : it);
                  setFormData({ ...formData, serialNumber: val, itemsDetail: updatedItems });
                }}
                placeholder="उदा. 602NRZX294301 / IMEI"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Detailed Items List if available */}
          {formData.itemsDetail && formData.itemsDetail.length > 0 && (
            <div className="space-y-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                प्रत्येक वस्तूचे मॉडेल व सिरीयल नंबर (Individual Item Serials):
              </span>
              <div className="space-y-2">
                {formData.itemsDetail.map((it, idx) => (
                  <div key={idx} className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div className="sm:col-span-1">
                      <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">{it.productName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">Qty: {it.quantity} | ₹{it.total.toLocaleString()}</span>
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Model No"
                        value={it.modelNumber || ''}
                        onChange={(e) => {
                          const updated = [...(formData.itemsDetail || [])];
                          updated[idx] = { ...updated[idx], modelNumber: e.target.value };
                          setFormData({ ...formData, itemsDetail: updated, modelNumber: idx === 0 ? e.target.value : formData.modelNumber });
                        }}
                        className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Serial / IMEI"
                        value={it.serialNumber || ''}
                        onChange={(e) => {
                          const updated = [...(formData.itemsDetail || [])];
                          updated[idx] = { ...updated[idx], serialNumber: e.target.value };
                          setFormData({ ...formData, itemsDetail: updated, serialNumber: idx === 0 ? e.target.value : formData.serialNumber });
                        }}
                        className="w-full px-2 py-1 rounded border border-emerald-300 dark:border-emerald-700 bg-emerald-50/40 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs font-semibold"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Financial Amounts Box */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-blue-600" />
                हिशोब व रकमा (Amount Calculation)
              </span>
              <button
                type="button"
                onClick={handleAutoCalcDue}
                className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
              >
                🔄 ऑटो-कॅल्क्युलेट बाकी
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Total Amount */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  एकूण बिल (Total ₹)
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={formData.totalAmount}
                    onChange={(e) =>
                      setFormData({ ...formData, totalAmount: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full pl-7 pr-2 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono font-bold text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Paying Now */}
              <div>
                <label className="block text-[11px] font-bold text-emerald-700 dark:text-emerald-400 mb-1">
                  रोख जमा (Paid / Advance ₹)
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-emerald-500 font-bold">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={formData.payingNow}
                    onChange={(e) =>
                      setFormData({ ...formData, payingNow: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full pl-7 pr-2 py-2 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 font-mono font-bold text-emerald-700 dark:text-emerald-300 text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Due Amount */}
              <div>
                <label className="block text-[11px] font-bold text-amber-800 dark:text-amber-400 mb-1">
                  उधारी बाकी (Due Balance ₹)
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-amber-500 font-bold">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={formData.dueAmount}
                    onChange={(e) =>
                      setFormData({ ...formData, dueAmount: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full pl-7 pr-2 py-2 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 font-mono font-bold text-amber-900 dark:text-amber-300 text-sm focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Mode */}
          <div className="flex items-center gap-4">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-slate-400" />
              पेमेंट पद्धत:
            </span>
            <label className="inline-flex items-center gap-1.5 text-xs font-medium cursor-pointer">
              <input
                type="radio"
                name="paymentMode"
                value="Cash"
                checked={formData.paymentMode === 'Cash'}
                onChange={() => setFormData({ ...formData, paymentMode: 'Cash' })}
                className="text-blue-600"
              />
              <span>रोख (Cash)</span>
            </label>
            <label className="inline-flex items-center gap-1.5 text-xs font-medium cursor-pointer">
              <input
                type="radio"
                name="paymentMode"
                value="Online"
                checked={formData.paymentMode === 'Online'}
                onChange={() => setFormData({ ...formData, paymentMode: 'Online' })}
                className="text-blue-600"
              />
              <span>ऑनलाइन / UPI (Online)</span>
            </label>
          </div>

          {/* Delete Prompt if confirmed */}
          {showDeleteConfirm && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200">
              <p className="font-bold mb-2">खरोखर हे बिल डिलीट करायचे आहे का?</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (onDelete && formData.id) {
                      onDelete(formData.id);
                      onClose();
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer"
                >
                  हो, डिलीट करा
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium"
                >
                  रद्द करा
                </button>
              </div>
            </div>
          )}

          {/* Footer Controls */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
            {onDelete ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">बिल हटवा</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
              >
                रद्द करा
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-blue-600/25 transition cursor-pointer active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>बदल सेव्ह करा</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
