import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  User,
  Phone,
  MapPin,
  Home,
  AlertCircle,
  IndianRupee,
  ShoppingBag,
  CreditCard
} from 'lucide-react';
import { Customer } from '../types';

interface EditCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onSave: (updated: Customer) => void;
  existingVillages?: string[];
}

export const EditCustomerModal: React.FC<EditCustomerModalProps> = ({
  isOpen,
  onClose,
  customer,
  onSave,
  existingVillages = [],
}) => {
  const [formData, setFormData] = useState<Customer | null>(null);

  useEffect(() => {
    if (customer) {
      setFormData({ ...customer });
    } else {
      setFormData(null);
    }
  }, [customer]);

  if (!isOpen || !formData) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('कृपया ग्राहकाचे नाव प्रविष्ट करा');
      return;
    }
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto flex flex-col">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              👤
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                ग्राहक माहिती दुरुस्त करा
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                खाते क्र: #{formData.id.substring(0, 10)}
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
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 text-sm">
          {/* Customer Financial Quick Stat Strip */}
          <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">एकूण खरेदी</span>
              <span className="font-mono font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                ₹{(formData.totalPurchased || 0).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium block">एकूण भरणा</span>
              <span className="font-mono font-bold text-xs sm:text-sm text-emerald-700 dark:text-emerald-300">
                ₹{(formData.totalPaid || 0).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium block">बाकी उधारी</span>
              <span className="font-mono font-black text-xs sm:text-sm text-amber-900 dark:text-amber-300">
                ₹{(formData.balanceDue || 0).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Customer Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              ग्राहकाचे संपूर्ण नाव (Customer Name) *
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="ग्राहकाचे नाव लिहा"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              मोबाईल नंबर (Mobile Phone)
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="tel"
                value={formData.phone === '0' ? '' : formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                placeholder="10 अंकी मोबाईल नंबर"
                maxLength={10}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
            {(!formData.phone || formData.phone === '0' || formData.phone.length < 10) && (
              <span className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 block">
                ⚠️ मोबाईल नंबर उपलब्ध नाही किंवा अपूर्ण आहे (10 अंक आवश्यक)
              </span>
            )}
          </div>

          {/* Village */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              गाव / परिसर (Village)
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                list="customer-villages-list"
                value={formData.village || ''}
                onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                placeholder="गाव प्रविष्ट करा"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
              <datalist id="customer-villages-list">
                {existingVillages.map((v) => (
                  <option key={v} value={v} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Full Address */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              पत्ता किंवा खूण (Address / Landmark)
            </label>
            <div className="relative">
              <Home className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="उदा. पाण्याच्या टाकीजवळ, पोस्ट ऑफिस समोर"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Footer Controls */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
            >
              रद्द करा
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/25 transition cursor-pointer active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>ग्राहक माहिती सेव्ह करा</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
