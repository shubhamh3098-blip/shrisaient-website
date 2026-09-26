import React, { useState } from 'react';
import {
  X,
  Receipt,
  CheckCircle2,
  Phone,
  MapPin,
  Printer,
  CreditCard
} from 'lucide-react';
import { BillReceipt, Customer, StoreData } from '../../types';
import { StorageService } from '../../services/storageService';

interface FastReceiptModalProps {
  customer: Customer | null;
  storeData: StoreData;
  onClose: () => void;
  onRefreshData: () => void;
  onPrintReceipt: (receipt: BillReceipt) => void;
}

export const FastReceiptModal: React.FC<FastReceiptModalProps> = ({
  customer,
  storeData,
  onClose,
  onRefreshData,
  onPrintReceipt,
}) => {
  const [selectedCustId, setSelectedCustId] = useState<string>(customer ? customer.id : '');
  const [amount, setAmount] = useState<string>(
    customer && customer.currentBalance > 0 ? customer.currentBalance.toString() : '1000'
  );
  const [paymentMode, setPaymentMode] = useState<BillReceipt['paymentMode']>('Cash');
  const [remarks, setRemarks] = useState<string>('Part payment against invoice/account balance.');

  const currentSelectedCust = storeData.customers.find((c) => c.id === selectedCustId);

  const handleSaveReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSelectedCust) {
      alert('कृपया ग्राहक निवडा');
      return;
    }

    const amt = parseFloat(amount) || 0;
    if (amt <= 0) {
      alert('कृपया वैध रक्कम टाका');
      return;
    }

    const newReceipt = StorageService.createBillReceipt({
      customerId: currentSelectedCust.id,
      customerName: currentSelectedCust.name,
      amountPaid: amt,
      paymentMode: paymentMode,
      remarks: remarks.trim() || undefined,
      handledBy: 'Terminal-01 (Admin)',
    });

    onRefreshData();
    onPrintReceipt(newReceipt);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">जमा पावती घ्या (Bill Receipt #1079+)</h3>
              <p className="text-[11px] text-slate-400">उधारी खात्यात रक्कम जमा करून पावती तयार करा.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSaveReceipt} className="space-y-4 text-xs">
          {/* Customer Selection */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">ग्राहक निवडा</label>
            <select
              value={selectedCustId}
              onChange={(e) => {
                setSelectedCustId(e.target.value);
                const found = storeData.customers.find((c) => c.id === e.target.value);
                if (found && found.currentBalance > 0) {
                  setAmount(found.currentBalance.toString());
                }
              }}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-medium"
              required
            >
              <option value="">-- ग्राहक निवडा --</option>
              {storeData.customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.city || 'Wardha'}) - Due: ₹{c.currentBalance.toLocaleString('en-IN')}
                </option>
              ))}
            </select>
          </div>

          {currentSelectedCust && (
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
              <div className="flex justify-between font-semibold">
                <span className="text-slate-400">शिल्लक उधारी (Due):</span>
                <span className="text-amber-400 font-bold">
                  ₹{currentSelectedCust.currentBalance.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>पत्ता:</span>
                <span>{currentSelectedCust.address || currentSelectedCust.city || 'Wardha'}</span>
              </div>
            </div>
          )}

          {/* Amount Paid */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">जमा रक्कम (Amount Paid ₹)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-7 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-bold text-sm text-emerald-400"
                required
              />
            </div>
          </div>

          {/* Payment Mode */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">भरणा पद्धत (Mode)</label>
            <div className="grid grid-cols-4 gap-2">
              {(['Cash', 'UPI', 'Cheque', 'Card'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPaymentMode(m)}
                  className={`py-1.5 text-center rounded-lg text-xs font-semibold border transition ${
                    paymentMode === m
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">शेरा (Remarks)</label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-medium"
            >
              रद्द करा
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>पावती सेव्ह व प्रिंट करा</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
