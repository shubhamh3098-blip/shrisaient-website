import React, { useState } from 'react';
import {
  X,
  User,
  Phone,
  MapPin,
  Save,
  Trash2,
  Calculator,
  RotateCcw,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { Customer, StoreData } from '../../types';
import { StorageService } from '../../services/storageService';

interface EditCustomerModalProps {
  customer: Customer;
  storeData: StoreData;
  isOpen: boolean;
  onClose: () => void;
  onRefreshData: () => void;
}

export const EditCustomerModal: React.FC<EditCustomerModalProps> = ({
  customer,
  storeData,
  isOpen,
  onClose,
  onRefreshData,
}) => {
  const [name, setName] = useState(customer.name);
  const [phone, setPhone] = useState(customer.phone);
  const [altPhone, setAltPhone] = useState(customer.altPhone || '');
  const [city, setCity] = useState(customer.city || customer.village || 'Wardha');
  const [address, setAddress] = useState(customer.address || '');
  const [creditLimit, setCreditLimit] = useState(customer.creditLimit || 50000);
  const [totalPurchased, setTotalPurchased] = useState(customer.totalPurchased || 0);
  const [currentBalance, setCurrentBalance] = useState(customer.currentBalance || 0);
  const [notes, setNotes] = useState(customer.notes || '');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Re-audit from invoices and receipts
  const handleRecalculateBalance = () => {
    const res = StorageService.recalculateCustomerBalance(customer.id);
    if (res) {
      setTotalPurchased(res.totalPurchased);
      setCurrentBalance(res.currentBalance);
      setFormSuccess(`✓ ग्राहकाचा प्रत्यक्ष बिले व पावत्यांवरून ताळमेळ झाला: खरेदी ₹${res.totalPurchased.toLocaleString('en-IN')}, बाकी उधारी ₹${res.currentBalance.toLocaleString('en-IN')}`);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('कृपया ग्राहकाचे नाव प्रविष्ट करा.');
      return;
    }

    try {
      StorageService.updateCustomer(customer.id, {
        name: name.trim().toUpperCase(),
        phone: phone.trim(),
        altPhone: altPhone.trim() || undefined,
        city: city.trim(),
        village: city.trim(),
        address: address.trim(),
        creditLimit: Number(creditLimit),
        totalPurchased: Number(totalPurchased),
        currentBalance: Number(currentBalance),
        notes: notes.trim() || undefined,
      });

      onRefreshData();
      setFormSuccess(`✓ ग्राहक खाते '${name}' माहिती यशस्वीरीत्या सेव्ह झाली!`);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setFormError('त्रुटी: ' + err.message);
    }
  };

  const handleExecuteDelete = () => {
    try {
      StorageService.deleteCustomer(customer.id);
      onRefreshData();
      setFormSuccess(`✓ ग्राहक खाते '${customer.name}' हटवले गेले.`);
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
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">ग्राहक खाते व हिशोब दुरुस्त करा (Edit Customer)</h3>
              <p className="text-[11px] text-slate-400">
                अपलोड केलेल्या डेटातील चुका, चुकीचा फोन नंबर, नाव किंवा शिल्लक रक्कम येथे थेट दुरुस्त करा.
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
        <form onSubmit={handleSave} className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
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
                ⚠️ तुम्हाला खात्री आहे का? ग्राहक खाते '{customer.name}' कायमचे हटवायचे आहे का?
              </div>
              <p className="text-[11px] text-rose-300/80">
                या ग्राहकाची खात्यातील माहिती कायमची काढून टाकली जाईल.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleExecuteDelete}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  होय, खाते हटवा
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                ग्राहकाचे नाव (Customer Name) *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-bold text-white uppercase focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                मोबाईल नंबर (Phone) *
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono font-bold text-white focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                पर्यायी फोन (Alt Phone)
              </label>
              <input
                type="text"
                value={altPhone}
                onChange={(e) => setAltPhone(e.target.value)}
                className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                गाव / शहर (Village / City)
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">
              संपूर्ण पत्ता (Address)
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:border-blue-500"
            />
          </div>

          {/* Financial Totals & Re-Audit Tool */}
          <div className="bg-slate-950 border-2 border-amber-500/40 p-3.5 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-black text-amber-400">हिशोब दुरुस्ती व ताळमेळ (Financial Balances):</span>
                <p className="text-[10px] text-slate-400">
                  एक्सेल अपलोडमुळे किंवा चुकीच्या नोंदीमुळे हिशोबात चूक झाली असल्यास येथे थेट दुरुस्त करा.
                </p>
              </div>
              <button
                type="button"
                onClick={handleRecalculateBalance}
                className="px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition cursor-pointer"
                title="या ग्राहकाची सर्व बिले व पावत्या पुन्हा मोजून अचूक शिल्लक सेट करा"
              >
                <RotateCcw className="w-3 h-3" />
                <span>🔄 बिलांवरून ऑटो-ताळमेळ</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  एकूण खरेदी (Total Purchased):
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    value={totalPurchased}
                    onChange={(e) => setTotalPurchased(Number(e.target.value))}
                    className="w-full pl-6 pr-2 p-2 bg-slate-900 border border-slate-700 rounded-lg text-sm font-black font-mono text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-amber-400 mb-1">
                  बाकी उधारी (Current Balance Due):
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-500">₹</span>
                  <input
                    type="number"
                    value={currentBalance}
                    onChange={(e) => setCurrentBalance(Number(e.target.value))}
                    className="w-full pl-6 pr-2 p-2 bg-slate-900 border border-amber-500/60 rounded-lg text-sm font-black font-mono text-amber-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">
              शेरा / विशेष सूचना (Notes):
            </label>
            <input
              type="text"
              placeholder="उदा. नियमित ग्राहक / हमीदार..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
            <span>खाते हटवा (Delete)</span>
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
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black transition shadow-lg shadow-blue-600/30 flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>बदल सेव्ह करा</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
