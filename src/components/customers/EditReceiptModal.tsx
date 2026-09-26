import React, { useState } from 'react';
import {
  X,
  Receipt,
  Calendar,
  User,
  Trash2,
  Save,
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import { BillReceipt, StoreData } from '../../types';
import { StorageService } from '../../services/storageService';

interface EditReceiptModalProps {
  receipt: BillReceipt;
  storeData: StoreData;
  isOpen: boolean;
  onClose: () => void;
  onRefreshData: () => void;
}

export const EditReceiptModal: React.FC<EditReceiptModalProps> = ({
  receipt,
  storeData,
  isOpen,
  onClose,
  onRefreshData,
}) => {
  const [date, setDate] = useState(
    receipt.date ? new Date(receipt.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)
  );
  const [customerId, setCustomerId] = useState(receipt.customerId || '');
  const [customerName, setCustomerName] = useState(receipt.customerName || '');
  const [amountPaid, setAmountPaid] = useState<number>(receipt.amountPaid || 0);
  const [paymentMode, setPaymentMode] = useState<BillReceipt['paymentMode']>(receipt.paymentMode || 'Cash');
  const [invoiceNo, setInvoiceNo] = useState(receipt.invoiceNo || '');
  const [remarks, setRemarks] = useState(receipt.remarks || '');
  const [handledBy, setHandledBy] = useState(receipt.handledBy || 'Counter Cashier');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleCustomerSelect = (id: string) => {
    setCustomerId(id);
    const found = storeData.customers.find((c) => c.id === id);
    if (found) {
      setCustomerName(found.name);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!customerName.trim()) {
      setFormError('कृपया ग्राहकाचे नाव प्रविष्ट करा.');
      return;
    }

    if (amountPaid <= 0) {
      setFormError('कृपया वैध जमा रक्कम टाका (शून्यापेक्षा जास्त).');
      return;
    }

    const updatedReceipt: BillReceipt = {
      ...receipt,
      date: new Date(date).toISOString(),
      customerId: customerId || receipt.customerId,
      customerName: customerName.trim().toUpperCase(),
      amountPaid: Number(amountPaid),
      paymentMode,
      invoiceNo: invoiceNo.trim() || undefined,
      remarks: remarks.trim() || undefined,
      handledBy: handledBy.trim() || 'Counter Cashier',
    };

    try {
      StorageService.updateBillReceipt(updatedReceipt);
      onRefreshData();
      setFormSuccess(`✓ पावती #${updatedReceipt.receiptNo} (₹${updatedReceipt.amountPaid}) यशस्वीरीत्या दुरुस्त झाली!`);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setFormError('त्रुटी: ' + (err.message || 'पावती अपडेट करताना अडचण आली'));
    }
  };

  const handleExecuteDelete = () => {
    try {
      StorageService.deleteBillReceipt(receipt.id);
      onRefreshData();
      setFormSuccess(`✓ पावती #${receipt.receiptNo} हटवली गेली. रक्कम ग्राहकाच्या खात्यात परत समायोजित झाली.`);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setFormError('त्रुटी: ' + err.message);
      setShowDeleteConfirm(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">पावती दुरुस्त करा (Edit Receipt)</h3>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  #{receipt.receiptNo}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                पावतीची रक्कम, पद्धत, तारीख किंवा ग्राहकाचे नाव बदला.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-4 sm:p-5 space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <X className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {formSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{formSuccess}</span>
            </div>
          )}

          {showDeleteConfirm && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-600 space-y-2">
              <div className="text-xs font-bold text-rose-200">
                ⚠️ तुम्हाला खात्री आहे का? पावती #{receipt.receiptNo} (₹{receipt.amountPaid}) हटवायची आहे का?
              </div>
              <p className="text-[11px] text-rose-300/80">
                ही रक्कम ग्राहकाच्या खात्यातील बाकी उधारीत पुन्हा जमा केली जाईल.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleExecuteDelete}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  होय, पावती हटवा
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition cursor-pointer"
                >
                  रद्द करा
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">पावती नंबर:</label>
              <input
                type="text"
                disabled
                value={`#${receipt.receiptNo}`}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono font-bold text-teal-400 opacity-80"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">तारीख:</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:border-teal-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-300">ग्राहकाचे नाव:</label>
              <select
                value={customerId}
                onChange={(e) => handleCustomerSelect(e.target.value)}
                className="text-[10px] p-1 bg-slate-950 border border-slate-700 rounded text-slate-300"
              >
                <option value="">-- ग्राहक बदला --</option>
                {storeData.customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone})
                  </option>
                ))}
              </select>
            </div>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-bold text-white uppercase focus:border-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-emerald-400 mb-1">
                जमा रक्कम (Amount):
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-500">₹</span>
                <input
                  type="number"
                  min="1"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(Number(e.target.value))}
                  className="w-full pl-6 pr-2 p-2 bg-slate-950 border border-emerald-500/50 rounded-lg text-sm font-black font-mono text-emerald-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">
                भरणा प्रकार (Mode):
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as any)}
                className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
              >
                <option value="Cash">Cash (रोख)</option>
                <option value="UPI">UPI (Google Pay / PhonePe)</option>
                <option value="Cheque">Cheque</option>
                <option value="Card">Card</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">
                बिलाचा संदर्भ (Invoice Ref):
              </label>
              <input
                type="text"
                placeholder="उदा. SSE-INV-2024-1016"
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
                className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">
                हँडल्ड बाय (Staff):
              </label>
              <input
                type="text"
                value={handledBy}
                onChange={(e) => setHandledBy(e.target.value)}
                className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">शेरा (Remarks):</label>
            <input
              type="text"
              placeholder="उदा. उधारी बिलाविरुद्ध जमा / दुरुस्ती"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="px-3.5 py-2 bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 text-rose-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>पावती हटवा</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              रद्द करा
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-black transition shadow-lg shadow-teal-600/30 flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>पावती अपडेट करा</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
