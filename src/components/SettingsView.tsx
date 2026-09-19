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
  Lock,
  FileSpreadsheet,
  Layers,
  ShoppingBag,
  Receipt,
  Users,
  Building,
  AlertTriangle,
  X
} from 'lucide-react';
import { BusinessSettings, DeliveryRatesConfig } from '../types';
import { CloudSyncStatus } from '../lib/firebase';
import { AppDatabase } from '../utils/storage';
import {
  exportSchemeCardsToCsv,
  exportSalesToCsv,
  exportReceiptsToCsv,
  exportCustomersToCsv,
  exportPurchasesToCsv,
  exportStockToCsv,
  exportDealersToCsv,
} from '../utils/csvExporter';

interface SettingsViewProps {
  settings: BusinessSettings;
  db?: AppDatabase;
  onUpdateSettings: (newSettings: BusinessSettings) => void;
  onExportData: () => void;
  onImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onResetData: () => void;
  onClearAllDemoData?: () => void;
  onClearCardsData?: () => void;
  onClearBillsData?: () => void;
  cloudStatus?: CloudSyncStatus;
  lastSyncedTime?: string;
  onManualCloudSync?: () => void;
  userRole?: 'admin' | 'staff';
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  db,
  onUpdateSettings,
  onExportData,
  onImportData,
  onResetData,
  onClearAllDemoData,
  onClearCardsData,
  onClearBillsData,
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
  const [cleanConfirmModal, setCleanConfirmModal] = useState<{
    type: 'all' | 'cards' | 'bills' | 'reset';
    title: string;
    description: string;
    action: () => void;
  } | null>(null);

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
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
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
                    value={formData.businessName || ''}
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
                    value={formData.domainName || ''}
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
                    value={formData.ownerName || ''}
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
                    value={formData.role || ''}
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
                    value={formData.phone || ''}
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
                    value={formData.email || ''}
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
                    value={formData.gstin || ''}
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
                  value={formData.address || ''}
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
                    value={formData.invoicePrefix || ''}
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
                    value={formData.tagline || ''}
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

          {/* Universal Excel / CSV Export Center */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-5">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  सर्व डेटा एक्सेल व CSV एक्सपोर्ट केंद्र (Universal Data Export Center)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  सर्व योजना (Scheme 1, 2, 3), विक्री बिले, खरेदी, हप्ते पावत्या आणि खातेवही एक्सेल/CSV फॉरमॅटमध्ये एका क्लिकवर डाउनलोड करा.
                </p>
              </div>
              <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                Excel & Sheets Ready
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Scheme 1 */}
              <div className="p-3.5 rounded-xl border border-purple-100 bg-purple-50/40 hover:bg-purple-50 transition flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-purple-600" />
                      योजना १ कार्ड्स (Scheme 1)
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-200/70 text-purple-800">
                      {db?.cardMembers?.filter(m => m.schemeId === 'scheme-1').length || 0} कार्ड्स
                    </span>
                  </div>
                  <p className="text-[11px] text-purple-700/80">
                    योजना १ मधील सर्व सभासद, जमा हप्ते, शिल्लक व पत्ता यादी.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => exportSchemeCardsToCsv(db?.cardMembers || [], 'Scheme_1', 'scheme-1')}
                  className="mt-3 w-full py-2 px-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  डाउनलोड Scheme 1 (.csv)
                </button>
              </div>

              {/* Scheme 2 */}
              <div className="p-3.5 rounded-xl border border-indigo-100 bg-indigo-50/40 hover:bg-indigo-50 transition flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-600" />
                      योजना २ कार्ड्स (Scheme 2)
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-200/70 text-indigo-800">
                      {db?.cardMembers?.filter(m => m.schemeId === 'scheme-2').length || 0} कार्ड्स
                    </span>
                  </div>
                  <p className="text-[11px] text-indigo-700/80">
                    योजना २ मधील सर्व सभासद, जमा रक्कम, शिल्लक व पत्ता यादी.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => exportSchemeCardsToCsv(db?.cardMembers || [], 'Scheme_2', 'scheme-2')}
                  className="mt-3 w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  डाउनलोड Scheme 2 (.csv)
                </button>
              </div>

              {/* Scheme 3 */}
              <div className="p-3.5 rounded-xl border border-blue-100 bg-blue-50/40 hover:bg-blue-50 transition flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-blue-600" />
                      योजना ३ कार्ड्स (Scheme 3)
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-200/70 text-blue-800">
                      {db?.cardMembers?.filter(m => m.schemeId === 'scheme-3').length || 0} कार्ड्स
                    </span>
                  </div>
                  <p className="text-[11px] text-blue-700/80">
                    योजना ३ मधील सर्व सभासद, जमा रक्कम, शिल्लक व पत्ता यादी.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => exportSchemeCardsToCsv(db?.cardMembers || [], 'Scheme_3', 'scheme-3')}
                  className="mt-3 w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  डाउनलोड Scheme 3 (.csv)
                </button>
              </div>

              {/* All Schemes Combined */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100/70 transition flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-slate-700" />
                      सर्व योजना एकत्र (All Schemes)
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-800">
                      {db?.cardMembers?.length || 0} कार्ड्स
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    सर्व योजनांचे मिळून सर्व सभासद, एकूण जमा व खाते माहिती.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => exportSchemeCardsToCsv(db?.cardMembers || [], 'All_Schemes', 'all')}
                  className="mt-3 w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  डाउनलोड All Schemes (.csv)
                </button>
              </div>

              {/* Receipts / Pavtya */}
              <div className="p-3.5 rounded-xl border border-amber-100 bg-amber-50/40 hover:bg-amber-50 transition flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <Receipt className="w-3.5 h-3.5 text-amber-600" />
                      सर्व हप्ते पावत्या (Receipts)
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-200/70 text-amber-800">
                      {db?.cardTransactions?.length || 0} पावत्या
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-700/80">
                    एजंट व दुकानात जमा झालेले सर्व साप्ताहिक हप्ते व पावती नोंदी.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => exportReceiptsToCsv(db?.cardTransactions || [], 'ShriSai_All_Receipts')}
                  className="mt-3 w-full py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  डाउनलोड Receipts (.csv)
                </button>
              </div>

              {/* Sales Invoices */}
              <div className="p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/40 hover:bg-emerald-50 transition flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                      <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
                      विक्री बिले (Sales Invoices)
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-200/70 text-emerald-800">
                      {db?.transactions?.length || 0} बिले
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-700/80">
                    सर्व रोख व उधारी विक्री बिले, ग्राहकाचे नाव व बाकी रक्कम.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => exportSalesToCsv(db?.transactions || [], 'ShriSai_Sales_Invoices')}
                  className="mt-3 w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  डाउनलोड Sales (.csv)
                </button>
              </div>

              {/* Purchases */}
              <div className="p-3.5 rounded-xl border border-cyan-100 bg-cyan-50/40 hover:bg-cyan-50 transition flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-900 flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-cyan-600" />
                      खरेदी नोंदी (Purchases)
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-200/70 text-cyan-800">
                      {db?.purchases?.length || 0} नोंदी
                    </span>
                  </div>
                  <p className="text-[11px] text-cyan-700/80">
                    सप्लायरकडून खरेदी केलेला सर्व माल, बिल नंबर व दिलेली रक्कम.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => exportPurchasesToCsv(db?.purchases || [], 'ShriSai_Purchases')}
                  className="mt-3 w-full py-2 px-3 rounded-lg bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  डाउनलोड Purchases (.csv)
                </button>
              </div>

              {/* Customers Khata */}
              <div className="p-3.5 rounded-xl border border-rose-100 bg-rose-50/40 hover:bg-rose-50 transition flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-rose-600" />
                      ग्राहक खातेवही (Customers Khata)
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-200/70 text-rose-800">
                      {db?.customers?.length || 0} ग्राहक
                    </span>
                  </div>
                  <p className="text-[11px] text-rose-700/80">
                    सर्व ग्राहकांची नावे, फोन नंबर, पत्ता, एकूण खरेदी व बाकी उधारी.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => exportCustomersToCsv(db?.customers || [], 'ShriSai_Customers_Khata')}
                  className="mt-3 w-full py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  डाउनलोड Customers (.csv)
                </button>
              </div>

              {/* Dealer Ledger */}
              <div className="p-3.5 rounded-xl border border-teal-100 bg-teal-50/40 hover:bg-teal-50 transition flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-teal-600" />
                      डीलर खातेवही (Dealer Ledger)
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-200/70 text-teal-800">
                      {db?.dealers?.length || 0} डीलर्स
                    </span>
                  </div>
                  <p className="text-[11px] text-teal-700/80">
                    सर्व डीलर्सची नावे, खरेदी, दिलेली रक्कम आणि देणे बाकी हिशोब.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => exportDealersToCsv(db?.dealers || [], 'ShriSai_Dealer_Ledger')}
                  className="mt-3 w-full py-2 px-3 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  डाउनलोड Dealer Ledger (.csv)
                </button>
              </div>

              {/* Stock Inventory */}
              <div className="p-3.5 rounded-xl border border-orange-100 bg-orange-50/40 hover:bg-orange-50 transition flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-orange-900 flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-orange-600" />
                      उपलब्ध साठा (Stock Inventory)
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-200/70 text-orange-800">
                      {db?.stock?.length || 0} वस्तू
                    </span>
                  </div>
                  <p className="text-[11px] text-orange-700/80">
                    दुकानातील सर्व वस्तू, शिल्लक नग, खरेदी व विक्री दर आणि साठा मूल्य.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => exportStockToCsv(db?.stock || [], 'ShriSai_Stock_Inventory')}
                  className="mt-3 w-full py-2 px-3 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  डाउनलोड Stock (.csv)
                </button>
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

              {onClearCardsData && (
                <button
                  type="button"
                  id="btn-settings-clear-cards"
                  onClick={() => {
                    setCleanConfirmModal({
                      type: 'cards',
                      title: 'कार्ड योजना डेटा साफ़ करायचा आहे का?',
                      description: 'सावधान: सर्व कार्ड्स आणि योजना हप्ते (Card Scheme Data) 100% साफ़ केले जातील.',
                      action: () => {
                        onClearCardsData();
                        setCleanConfirmModal(null);
                      },
                    });
                  }}
                  className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <Trash2 className="w-4 h-4" />
                  कार्ड डेटा साफ़ करा (Clear Cards)
                </button>
              )}

              {onClearBillsData && (
                <button
                  type="button"
                  id="btn-settings-clear-bills"
                  onClick={() => {
                    setCleanConfirmModal({
                      type: 'bills',
                      title: 'बिक्री बिल व ग्राहक खाते साफ़ करायचे का?',
                      description: 'सावधान: सर्व विक्री बिल आणि ग्राहक खाते (Sales Bills Data) 100% साफ़ केले जातील.',
                      action: () => {
                        onClearBillsData();
                        setCleanConfirmModal(null);
                      },
                    });
                  }}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <Trash2 className="w-4 h-4" />
                  बिक्री बिल साफ़ करा (Clear Bills)
                </button>
              )}

              {onClearAllDemoData && (
                <button
                  type="button"
                  id="btn-settings-clear-all-demo"
                  onClick={() => {
                    setCleanConfirmModal({
                      type: 'all',
                      title: 'सर्व जुना व डेमो डेटा डिलीट करायचा आहे का?',
                      description: 'सावधान: सर्व जुना डेटा (सर्व ग्राहक, बिले, पावत्या, खरेदी, कार्ड मेंबर्स व खर्च) 100% डिलीट होईल आणि सिस्टीम स्वच्छ होईल.',
                      action: () => {
                        onClearAllDemoData();
                        setCleanConfirmModal(null);
                      },
                    });
                  }}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <Trash2 className="w-4 h-4" />
                  सगळा जुना व डेमो डेटा डिलीट करा (Delete All Data)
                </button>
              )}

              <button
                type="button"
                id="btn-settings-reset-blank"
                onClick={() => {
                  setCleanConfirmModal({
                    type: 'reset',
                    title: 'नवीन कोरी सिस्टीम (Zero Balance) सुरू करायची आहे का?',
                    description: 'सर्व चालू डेटा रीसेट करून पूर्ण नवीन कोरी सिस्टीम (Zero Balance / Clean Blank Slate) सुरू होईल.',
                    action: () => {
                      onResetData();
                      setCleanConfirmModal(null);
                    },
                  });
                }}
                className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                नवीन कोरी सिस्टीम (Reset to Blank State)
              </button>
            </div>
          </div>
        </div>

      {/* In-App Clean Confirmation Modal - Works 100% in iFrames without popup blocking */}
      {cleanConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {cleanConfirmModal.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {cleanConfirmModal.description}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setCleanConfirmModal(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                रद्द करा (Cancel)
              </button>
              <button
                type="button"
                id="btn-confirm-clean-modal"
                onClick={cleanConfirmModal.action}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                होय, आता डिलीट करा (Yes, Proceed)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
