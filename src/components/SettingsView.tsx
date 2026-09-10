import React, { useState } from 'react';
import {
  Settings,
  Globe,
  Save,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Building2,
  FileText,
  Cloud,
  Database,
  Truck,
  Trash2,
  Sparkles,
  KeyRound,
  Lock
} from 'lucide-react';
import { BusinessSettings, DeliveryRatesConfig } from '../types';

interface SettingsViewProps {
  settings: BusinessSettings;
  onUpdateSettings: (newSettings: BusinessSettings) => void;
  onExportData: () => void;
  onImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onResetData: () => void;
  onClearAllDemoData?: () => void;
  cloudStatus?: 'idle' | 'syncing' | 'connected' | 'offline' | 'error';
  lastSyncedTime?: string;
  onManualCloudSync?: () => void;
  userRole?: 'admin' | 'staff';
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onExportData,
  onImportData,
  onResetData,
  onClearAllDemoData,
  cloudStatus = 'connected',
  lastSyncedTime,
  onManualCloudSync,
  userRole = 'admin',
}) => {
  const [formData, setFormData] = useState<BusinessSettings>({
    ...settings,
    deliveryRates: settings.deliveryRates || {
      freeDeliveryMinAmount: 3000,
      localDeliveryFee: 100,
      outerDeliveryFee: 250,
      estimatedDeliveryTime: 'Same Day / 24 Hours',
      deliveryAreas: 'Local Town, Taluka, and All Surrounding Villages (50 km)',
      deliveryNote: 'Free home delivery on orders above ₹3,000 and all Card Scheme major appliances.',
    },
    shopNotice: settings.shopNotice || 'धमाका ऑफर: ३०-महिने कार्ड स्कीम बुकिंग चालू आहे • सर्व मोठ्या वस्तूंवर फ्री होम डिलिव्हरी!',
  });
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleChange = (field: keyof BusinessSettings, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDeliveryChange = (field: keyof DeliveryRatesConfig, value: any) => {
    setFormData((prev) => ({
      ...prev,
      deliveryRates: {
        ...(prev.deliveryRates as DeliveryRatesConfig),
        [field]: value,
      },
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            System & Business Settings
          </h1>
          <p className="text-sm text-slate-500">
            Configure business information, Google Cloud online database sync, and data backups.
          </p>
        </div>

        {userRole === 'staff' && (
          <span className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold self-start sm:self-auto">
            Staff View (Read-Only Settings)
          </span>
        )}
      </div>

      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm px-4 py-3 rounded-xl flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Settings saved successfully! Updated for all screens and invoices.</span>
        </div>
      )}

      <div className="space-y-6">
          {/* Business Profile Form */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6">
            <h2 className="text-base font-bold text-slate-900 mb-4 border-b border-slate-100 pb-3">
              Shop & Business Information
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Business / Shop Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.businessName}
                    onChange={(e) => handleChange('businessName', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Registered Domain Name
                  </label>
                  <input
                    type="text"
                    value={formData.domainName}
                    onChange={(e) => handleChange('domainName', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Owner / Administrator Name
                  </label>
                  <input
                    type="text"
                    value={formData.ownerName}
                    onChange={(e) => handleChange('ownerName', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Admin Role Title
                  </label>
                  <input
                    type="text"
                    value={formData.role}
                    onChange={(e) => handleChange('role', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone / WhatsApp Number
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    GSTIN Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.gstin}
                    onChange={(e) => handleChange('gstin', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Shop / Warehouse Address
                </label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Invoice Number Prefix
                  </label>
                  <input
                    type="text"
                    value={formData.invoicePrefix}
                    onChange={(e) => handleChange('invoicePrefix', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Business Tagline
                  </label>
                  <input
                    type="text"
                    value={formData.tagline}
                    onChange={(e) => handleChange('tagline', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              {/* Shop Announcement & WhatsApp Order */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Shop Landing Page Announcement & Notice
                </h3>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Top Announcement Banner Text (ग्राहक वेबसाइट पर मुख्य सूचना)
                  </label>
                  <input
                    type="text"
                    value={formData.shopNotice || ''}
                    onChange={(e) => handleChange('shopNotice', e.target.value)}
                    placeholder="e.g. ३०-महिने कार्ड स्कीम बुकिंग चालू आहे • सर्व मोठ्या वस्तूंवर फ्री होम डिलिव्हरी!"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              {/* Delivery Rates Management (Admin Controlled) */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-blue-600" />
                  Home Delivery Rates & Shipping Controls (डिलीवरी दरें)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Free Delivery Min. Order (₹)
                    </label>
                    <input
                      type="number"
                      value={formData.deliveryRates?.freeDeliveryMinAmount || 3000}
                      onChange={(e) => handleDeliveryChange('freeDeliveryMinAmount', Number(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold"
                    />
                    <span className="text-[10px] text-slate-500">इस राशि से ऊपर मुफ़्त डिलीवरी</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Local Town Delivery Rate (₹)
                    </label>
                    <input
                      type="number"
                      value={formData.deliveryRates?.localDeliveryFee || 100}
                      onChange={(e) => handleDeliveryChange('localDeliveryFee', Number(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold"
                    />
                    <span className="text-[10px] text-slate-500">लोकल शहर / 5 किमी दायरा (0 = Free)</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Outer / Village Delivery Rate (₹)
                    </label>
                    <input
                      type="number"
                      value={formData.deliveryRates?.outerDeliveryFee || 250}
                      onChange={(e) => handleDeliveryChange('outerDeliveryFee', Number(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold"
                    />
                    <span className="text-[10px] text-slate-500">अन्य गांव / ग्रामीण क्षेत्र</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Estimated Delivery Time (अनुमानित समय)
                    </label>
                    <input
                      type="text"
                      value={formData.deliveryRates?.estimatedDeliveryTime || 'Same Day / 24 Hours'}
                      onChange={(e) => handleDeliveryChange('estimatedDeliveryTime', e.target.value)}
                      placeholder="e.g. Same Day / 24 Hours"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Delivery Covered Areas (कवर क्षेत्र)
                    </label>
                    <input
                      type="text"
                      value={formData.deliveryRates?.deliveryAreas || 'Local Town, Taluka, and All Surrounding Villages (50 km)'}
                      onChange={(e) => handleDeliveryChange('deliveryAreas', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Delivery Policy & Notes for Customers
                  </label>
                  <textarea
                    rows={2}
                    value={formData.deliveryRates?.deliveryNote || ''}
                    onChange={(e) => handleDeliveryChange('deliveryNote', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none"
                  />
                </div>
              </div>

              {/* Security & Password Settings (Admin Control) */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                  सुरक्षा व लॉगिन पासवर्ड (Security & Passwords)
                </h3>
                <p className="text-xs text-slate-500">
                  हा पासवर्ड टाकून ॲडमिन थेट संपूर्ण बिझनेस अकाउंटिंग आणि सर्व खाती एका सेकंदात उघडू शकतात.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ॲडमिन मुख्य पासवर्ड (Admin Master Password) *
                    </label>
                    <input
                      type="text"
                      value={formData.adminPassword || 'admin'}
                      onChange={(e) => handleChange('adminPassword', e.target.value)}
                      placeholder="उदा. admin किंवा sai123"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono font-bold text-blue-900 bg-blue-50/50 focus:ring-2 focus:ring-blue-500 outline-hidden"
                    />
                    <span className="text-[10px] text-slate-500">डिफॉल्ट: `admin` (तुम्ही तुमच्या सोयीनुसार बदलू शकता)</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      स्टाफ पासवर्ड (Staff Login Password)
                    </label>
                    <input
                      type="text"
                      value={formData.staffPassword || 'staff'}
                      onChange={(e) => handleChange('staffPassword', e.target.value)}
                      placeholder="उदा. staff किंवा 1234"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono font-medium focus:ring-2 focus:ring-blue-500 outline-hidden"
                    />
                    <span className="text-[10px] text-slate-500">कर्मचाऱ्यांसाठी मर्यादित बिलिंग ॲक्सेस</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  Save Business & Delivery Changes
                </button>
              </div>
            </form>
          </div>

          {/* Google Cloud Firebase Online Storage Card */}
          <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-2xl border border-blue-800 shadow-sm p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-white tracking-tight">
                      Google Cloud Online Database (Firestore)
                    </h2>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Real-time Sync Active
                    </span>
                  </div>
                  <p className="text-xs text-blue-200">
                    Live cloud storage active for <span className="font-mono text-white font-semibold">shrisaient.in</span>
                  </p>
                </div>
              </div>

              {onManualCloudSync && (
                <button
                  type="button"
                  onClick={onManualCloudSync}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 transition cursor-pointer self-start sm:self-auto shadow-sm"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${cloudStatus === 'syncing' ? 'animate-spin' : ''}`} />
                  Sync to Cloud Now
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <p className="text-blue-300 font-medium">Multi-Device Access</p>
                <p className="text-slate-300 text-[11px]">
                  Dukan laptop, mobile ya ghar se kholein — sabhi jagah ek hi live balance aur bills dikhenge.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <p className="text-blue-300 font-medium">Automatic Cloud Backup</p>
                <p className="text-slate-300 text-[11px]">
                  Browser clear ya phone change hone par bhi aapka sara data Google Cloud par safe rahega.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <p className="text-blue-300 font-medium">Real-time Sync Status</p>
                <p className="text-emerald-300 text-[11px] font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  {lastSyncedTime ? `Last Synced: ${lastSyncedTime}` : 'Connected & Live'}
                </p>
              </div>
            </div>
          </div>

          {/* Backup and Data Export */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Data Management & Real Business Clean Slate
            </h2>
            <p className="text-xs text-slate-500">
              Your entries, stock levels, and customer ledger are saved automatically. You can export a JSON backup to keep your files safe or import anytime.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={onExportData}
                className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                Export Full Backup (JSON)
              </button>

              <label className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition flex items-center gap-2 cursor-pointer shadow-xs">
                <Upload className="w-4 h-4 text-blue-600" />
                Import Backup File
                <input
                  type="file"
                  accept=".json"
                  onChange={onImportData}
                  className="hidden"
                />
              </label>

              {onClearAllDemoData && (
                <button
                  onClick={() => {
                    if (
                      window.confirm(
                        'चेतावनी: क्या आप पूरा डेमो/सैंपल डेटा (सभी टेस्ट ग्राहक, डमी बिक्री और टेस्ट कार्ड मेंबर्स) हटाना चाहते हैं?\n\nयह आपका खाता ₹0 बैलेंस के साथ 100% साफ़ कर देगा ताकि आप असली बिजनेस एंट्री शुरू कर सकें।'
                      )
                    ) {
                      onClearAllDemoData();
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <Trash2 className="w-4 h-4" />
                  पूरा डेमो डेटा साफ़ करें (Start Clean Slate)
                </button>
              )}

              <button
                onClick={() => {
                  if (
                    window.confirm(
                      'Are you sure you want to restore default sample catalog data for Shree Sai Enterprises?'
                    )
                  ) {
                    onResetData();
                  }
                }}
                className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                Restore Sample Data
              </button>
            </div>
          </div>
        </div>
    </div>
  );
};
