import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  ShieldCheck,
  Search,
  Plus,
  Phone,
  Printer,
  Share2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Tv,
  FileText,
  BadgeCheck,
  User,
  MapPin,
  Trash2,
  Wrench,
  Hammer,
  Send,
  MessageCircle,
  AlertCircle
} from 'lucide-react';
import { BusinessSettings, Customer, TransactionEntry } from '../types';
import { getSafeWhatsAppUrl } from '../utils/numbering';
import { ServiceComplaintSection } from './ServiceComplaintSection';

export interface ServiceComplaintTicket {
  id: string;
  ticketNo: string;
  date: string;
  customerName: string;
  customerPhone: string;
  village?: string;
  productName: string;
  brand: string;
  serialNumber?: string;
  invoiceNo?: string;
  problemDescription: string;
  priority: 'Normal' | 'High' | 'Urgent';
  technicianName: string;
  technicianPhone: string;
  visitDate?: string;
  status: 'Open' | 'Assigned' | 'In Progress' | 'Resolved';
  resolutionNotes?: string;
  serviceCharge?: number;
  createdAt: string;
}

export interface WarrantyCardRecord {
  id: string;
  invoiceNo?: string;
  customerName: string;
  customerPhone: string;
  village?: string;
  productName: string;
  brand: string;
  modelNumber?: string;
  serialNumber: string;
  purchaseDate: string;
  warrantyPeriodMonths: number;
  warrantyType: 'Comprehensive' | 'Compressor/Motor Only' | 'Wood Seasoning (5-Yr)' | 'Standard';
  customerCarePhone: string;
  notes?: string;
  createdAt: string;
}

const BRAND_CUSTOMER_CARE: Record<string, string> = {
  'LG': '1800 315 9999',
  'Samsung': '1800 40 7267864',
  'Whirlpool': '1800 208 1800',
  'Haier': '1800 419 9999',
  'Godrej': '1800 209 5511',
  'Voltas': '1860 599 4444',
  'Sony': '1800 103 7799',
  'Lloyd': '1800 102 0666',
  'Bajaj': '1800 102 5963',
  'Crompton': '1800 419 0505',
  'Havells': '1800 103 1313',
  'Usha': '1800 1033 111',
  'Blue Star': '1800 209 1177',
  'Shri Sai Teak Furniture': '8766486915',
  'Other / Local': '8766486915'
};

const INITIAL_WARRANTIES: WarrantyCardRecord[] = [
  {
    id: 'w-1',
    invoiceNo: '3848',
    customerName: 'सुनील बोबडे',
    customerPhone: '9822345671',
    village: 'सिंदी (रेल्वे)',
    productName: '43" 4K Ultra HD Smart Google TV',
    brand: 'LG',
    modelNumber: '43UR7500PSC',
    serialNumber: 'LG-43TV-902184',
    purchaseDate: '2026-03-15',
    warrantyPeriodMonths: 24,
    warrantyType: 'Comprehensive',
    customerCarePhone: '1800 315 9999',
    notes: '१ वर्ष पॅनल + १ वर्ष एक्सटेंडेड वॉरंटी',
    createdAt: new Date().toISOString()
  },
  {
    id: 'w-2',
    invoiceNo: '3820',
    customerName: 'गजानन ठाकरे',
    customerPhone: '9423456782',
    village: 'सेलू',
    productName: '240L Double Door Inverter Refrigerator',
    brand: 'Whirlpool',
    modelNumber: 'IF-INV-240D',
    serialNumber: 'WP-RF-883710',
    purchaseDate: '2025-11-10',
    warrantyPeriodMonths: 120,
    warrantyType: 'Compressor/Motor Only',
    customerCarePhone: '1800 208 1800',
    notes: '१ वर्ष संपूर्ण + १० वर्षे कॉम्प्रेसर वॉरंटी',
    createdAt: new Date().toISOString()
  },
  {
    id: 'w-3',
    invoiceNo: '3799',
    customerName: 'रमेशजी वानखेडे',
    customerPhone: '9881234567',
    village: 'देवळी',
    productName: 'सागवान ३-डोअर कपाट (CP Teak Almirah)',
    brand: 'Shri Sai Teak Furniture',
    modelNumber: 'SS-TEAK-3D',
    serialNumber: 'SAI-TK-4109',
    purchaseDate: '2026-01-20',
    warrantyPeriodMonths: 60,
    warrantyType: 'Wood Seasoning (5-Yr)',
    customerCarePhone: '8766486915',
    notes: '५ वर्षे लाकूड वाकणे किंवा किड न लागण्याची गॅरंटी',
    createdAt: new Date().toISOString()
  }
];

interface WarrantyTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: BusinessSettings;
  customers?: Customer[];
  salesTransactions?: TransactionEntry[];
  prefilledCustomer?: {
    name: string;
    phone: string;
    village?: string;
    invoiceNo?: string;
    productName?: string;
    brand?: string;
    serialNo?: string;
  };
}

export const WarrantyTrackerModal: React.FC<WarrantyTrackerModalProps> = ({
  isOpen,
  onClose,
  settings,
  customers = [],
  salesTransactions = [],
  prefilledCustomer
}) => {
  const [warranties, setWarranties] = useState<WarrantyCardRecord[]>(() => {
    try {
      const saved = localStorage.getItem('shri_sai_warranties');
      return saved ? JSON.parse(saved) : INITIAL_WARRANTIES;
    } catch {
      return INITIAL_WARRANTIES;
    }
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterBrand, setFilterBrand] = useState('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expiring' | 'expired'>('all');
  const [selectedWarranty, setSelectedWarranty] = useState<WarrantyCardRecord | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPrintView, setShowPrintView] = useState(false);
  const [activeSection, setActiveSection] = useState<'warranties' | 'complaints'>('warranties');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // New Warranty Form State
  const [formData, setFormData] = useState<Omit<WarrantyCardRecord, 'id' | 'createdAt'>>({
    invoiceNo: '',
    customerName: '',
    customerPhone: '',
    village: '',
    productName: '',
    brand: 'LG',
    modelNumber: '',
    serialNumber: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    warrantyPeriodMonths: 12,
    warrantyType: 'Comprehensive',
    customerCarePhone: BRAND_CUSTOMER_CARE['LG'] || '1800 315 9999',
    notes: ''
  });

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('shri_sai_warranties', JSON.stringify(warranties));
    } catch (e) {
      console.error(e);
    }
  }, [warranties]);

  // Set prefilled customer if passed
  useEffect(() => {
    if (prefilledCustomer && isOpen) {
      setFormData((prev) => ({
        ...prev,
        customerName: prefilledCustomer.name || prev.customerName,
        customerPhone: prefilledCustomer.phone || prev.customerPhone,
        village: prefilledCustomer.village || prev.village,
        invoiceNo: prefilledCustomer.invoiceNo || prev.invoiceNo,
        productName: prefilledCustomer.productName || prev.productName,
        brand: prefilledCustomer.brand || 'LG',
        serialNumber: prefilledCustomer.serialNo || prev.serialNumber,
        customerCarePhone: BRAND_CUSTOMER_CARE[prefilledCustomer.brand || 'LG'] || prev.customerCarePhone
      }));
      setShowAddForm(true);
    }
  }, [prefilledCustomer, isOpen]);

  // Handle Brand selection in Form
  const handleBrandChange = (brand: string) => {
    setFormData((prev) => ({
      ...prev,
      brand,
      customerCarePhone: BRAND_CUSTOMER_CARE[brand] || '8766486915'
    }));
  };

  // Helper to compute expiration
  const getWarrantyDetails = (rec: WarrantyCardRecord) => {
    const pDate = new Date(rec.purchaseDate);
    const expDate = new Date(pDate);
    expDate.setMonth(expDate.getMonth() + rec.warrantyPeriodMonths);

    const now = new Date();
    const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    let status: 'active' | 'expiring' | 'expired' = 'active';
    if (diffDays < 0) {
      status = 'expired';
    } else if (diffDays <= 30) {
      status = 'expiring';
    }

    return {
      expiryDateStr: expDate.toLocaleDateString('mr-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      daysLeft: diffDays,
      status
    };
  };

  // Filtered Warranties
  const filteredWarranties = useMemo(() => {
    return warranties.filter((w) => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        w.customerName.toLowerCase().includes(q) ||
        (w.customerPhone && w.customerPhone.includes(q)) ||
        (w.productName && w.productName.toLowerCase().includes(q)) ||
        (w.serialNumber && w.serialNumber.toLowerCase().includes(q)) ||
        (w.village && w.village.toLowerCase().includes(q)) ||
        (w.invoiceNo && w.invoiceNo.toLowerCase().includes(q));

      if (!matchSearch) return false;
      if (filterBrand !== 'all' && w.brand !== filterBrand) return false;

      if (filterStatus !== 'all') {
        const { status } = getWarrantyDetails(w);
        if (status !== filterStatus) return false;
      }

      return true;
    });
  }, [warranties, searchTerm, filterBrand, filterStatus]);

  // Handle Save
  const handleSaveWarranty = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setFormError('');

    if (!formData.customerName.trim() || !formData.productName.trim() || !formData.serialNumber.trim()) {
      setFormError('कृपया ग्राहकाचे नाव, वस्तूचे नाव आणि सिरियल नंबर प्रविष्ट करा.');
      return;
    }

    setIsSubmitting(true);

    const newRecord: WarrantyCardRecord = {
      ...formData,
      id: `w-${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    setWarranties((prev) => [newRecord, ...prev]);
    setSelectedWarranty(newRecord);
    setShowAddForm(false);
    setTimeout(() => {
      setIsSubmitting(false);
    }, 600);
  };

  // Handle Delete
  const handleDeleteWarranty = (id: string) => {
    if (confirm('नक्की हे वॉरंटी कार्ड हटवायचे आहे का?')) {
      setWarranties((prev) => prev.filter((w) => w.id !== id));
      if (selectedWarranty?.id === id) {
        setSelectedWarranty(null);
      }
    }
  };

  // Handle WhatsApp Share
  const handleWhatsAppShare = (rec: WarrantyCardRecord) => {
    const { expiryDateStr, status } = getWarrantyDetails(rec);

    const msg =
`🛡️ *अधिकृत डिजिटल वॉरंटी कार्ड* 🛡️
🚩 *श्री साई इंटरप्राइजेस, वर्धा* 🚩
(टीव्ही, फ्रीज, वॉशिंग मशीन, कूलर व सागवान फर्निचर)

आदरणीय *${rec.customerName}* जी,
आपल्या खरेदीचे अधिकृत वॉरंटी कार्ड खालीलप्रमाणे आहे:

📦 *वस्तू:* *${rec.productName}*
🏷️ *ब्रँड:* ${rec.brand}
🔢 *सिरियल नंबर:* *${rec.serialNumber}*
${rec.modelNumber ? `📑 *मॉडेल क्र:* ${rec.modelNumber}\n` : ''}${rec.invoiceNo ? `🧾 *बिल नंबर:* #${rec.invoiceNo}\n` : ''}📅 *खरेदी तारीख:* ${rec.purchaseDate}
⏳ *वॉरंटी कालावधी:* ${rec.warrantyPeriodMonths} महिने (${rec.warrantyType})
✅ *वॉरंटी समाप्ती तारीख:* *${expiryDateStr}*
📌 *स्थिती:* ${status === 'active' ? '🟢 Active (सध्या चालू)' : status === 'expiring' ? '🟠 Expiring Soon' : '🔴 Expired'}

📞 *कंपनी अधिकृत कस्टमर केअर (Toll-Free):*
☎️ *${rec.customerCarePhone}*

💡 *महत्त्वाची सूचना:*
सर्व्हिस किंवा दुरुस्तीसाठी कृपया वरील अधिकृत टोल-फ्री क्रमांकावर कॉल करून सिरियल नंबर नोंदवावा. काही अडचण असल्यास आमच्याशी संपर्क साधावा.

📍 *पत्ता:* मातोश्री सभागृह समोर, आर्वी रोड, पंजाब कॉलनी, वर्धा.
📱 *शोरूम संपर्क:* ${settings.phone || '8766486915'} / 8600122798`;

    const url = getSafeWhatsAppUrl(rec.customerPhone, msg);
    window.open(url, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm no-print">
      <div className="bg-white dark:bg-[#0C1425] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-slate-900 dark:text-white">
        
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shadow-inner">
              <ShieldCheck className="w-6 h-6 text-sky-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-xl font-black tracking-tight">
                  इलेक्ट्रॉनिक्स व फर्निचर वॉरंटी ट्रॅकर
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-sky-400 text-slate-950 font-bold text-[10px] tracking-wider uppercase">
                  Service & Warranty Card
                </span>
              </div>
              <p className="text-xs text-sky-100 font-medium">
                टीव्ही, फ्रीज, कुलर, वॉशिंग मशीन व सागवान फर्निचरचे सिरियल नंबर व डिजिटल वॉरंटी कार्ड
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeSection === 'warranties' && (
              <button
                onClick={() => setShowAddForm(true)}
                className="px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 active:scale-95 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md cursor-pointer transition"
              >
                <Plus className="w-4 h-4" />
                <span>नवीन वॉरंटी जोडा</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Subtab Switcher */}
        <div className="px-4 py-2 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveSection('warranties')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeSection === 'warranties'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>१. डिजिटल वॉरंटी कार्ड्स ({warranties.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('complaints')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeSection === 'complaints'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Wrench className="w-4 h-4 text-amber-300" />
              <span>२. सर्विस तक्रारी व मेकॅनिक जॉब शीट</span>
            </button>
          </div>
        </div>

        {activeSection === 'complaints' ? (
          <ServiceComplaintSection
            settings={settings}
            customers={customers}
            warranties={warranties}
          />
        ) : (
          <>
            {/* Search & Filters */}
            <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <div className="relative w-full max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ग्राहक नाव, सिरियल क्र, वस्तू, फोन किंवा बिल क्र..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Brand Filter */}
            <select
              value={filterBrand}
              onChange={(e) => setFilterBrand(e.target.value)}
              className="text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-1.5 px-3 font-semibold cursor-pointer"
            >
              <option value="all">सर्व ब्रँड्स ({warranties.length})</option>
              {Object.keys(BRAND_CUSTOMER_CARE).map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>

            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-0.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold">
              <button
                type="button"
                onClick={() => setFilterStatus('all')}
                className={`px-2 py-1 rounded-lg transition ${filterStatus === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}
              >
                सर्व
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('active')}
                className={`px-2 py-1 rounded-lg transition ${filterStatus === 'active' ? 'bg-emerald-600 text-white' : 'text-emerald-600'}`}
              >
                सध्या चालू
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('expiring')}
                className={`px-2 py-1 rounded-lg transition ${filterStatus === 'expiring' ? 'bg-amber-600 text-white' : 'text-amber-600'}`}
              >
                ३० दिवसांत संपणारी
              </button>
            </div>
          </div>
        </div>

        {/* Main Content: Two Columns (List + Detail/Card) */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800">
          
          {/* Left Column: Warranty Records List */}
          <div className="md:col-span-6 p-4 space-y-3 overflow-y-auto max-h-[60vh] md:max-h-none">
            {filteredWarranties.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <ShieldCheck className="w-10 h-10 mx-auto opacity-40 mb-2" />
                <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
                  कोणतीही वॉरंटी नोंद सापडली नाही
                </p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="mt-3 text-xs text-sky-600 dark:text-sky-400 font-bold underline cursor-pointer"
                >
                  + नवीन वॉरंटी कार्ड तयार करा
                </button>
              </div>
            ) : (
              filteredWarranties.map((w) => {
                const { expiryDateStr, daysLeft, status } = getWarrantyDetails(w);
                const isSelected = selectedWarranty?.id === w.id;

                return (
                  <div
                    key={w.id}
                    onClick={() => setSelectedWarranty(w)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-400 ring-2 ring-sky-500/20 shadow-xs'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {w.customerName}
                          </span>
                          {w.village && (
                            <span className="text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                              {w.village}
                            </span>
                          )}
                          {w.invoiceNo && (
                            <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded font-bold">
                              #{w.invoiceNo}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1 flex items-center gap-1.5">
                          <Tv className="w-3.5 h-3.5 text-sky-600" />
                          <span>{w.productName} ({w.brand})</span>
                        </p>
                      </div>

                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          status === 'active'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : status === 'expiring'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                        }`}
                      >
                        {status === 'active' ? 'Active' : status === 'expiring' ? 'Expiring' : 'Expired'}
                      </span>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                      <span>SN: <strong className="text-slate-700 dark:text-slate-300">{w.serialNumber}</strong></span>
                      <span>मुदत: <strong className="text-slate-700 dark:text-slate-300">{expiryDateStr}</strong></span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Detailed Digital Warranty Card & Actions */}
          <div className="md:col-span-6 p-4 sm:p-6 bg-slate-50/50 dark:bg-[#090F1E] flex flex-col justify-between">
            {selectedWarranty ? (
              <div className="space-y-4">
                {/* Official Digital Warranty Card Cardboard */}
                <div
                  id="printable-warranty-card"
                  className="bg-white dark:bg-slate-900 border-2 border-indigo-500/40 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden text-slate-900 dark:text-white"
                >
                  {/* Watermark Logo / Shield */}
                  <div className="absolute -right-6 -bottom-6 opacity-5 pointer-events-none text-indigo-600">
                    <ShieldCheck className="w-48 h-48" />
                  </div>

                  {/* Header */}
                  <div className="border-b border-indigo-100 dark:border-slate-800 pb-3 flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-600 text-white font-black text-[9px] uppercase tracking-widest">
                          OFFICIAL WARRANTY CARD
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ID: {selectedWarranty.id}
                        </span>
                      </div>
                      <h3 className="text-lg font-black uppercase text-slate-900 dark:text-white mt-1">
                        {settings.businessName || 'श्री साई इंटरप्राइजेस'}
                      </h3>
                      <p className="text-[10px] text-slate-500">
                        मातोश्री सभागृह समोर, आर्वी रोड, पंजाब कॉलनी, वर्धा • मो. {settings.phone || '8766486915'}
                      </p>
                    </div>

                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600">
                      <BadgeCheck className="w-6 h-6" />
                    </div>
                  </div>

                  {/* Customer & Appliance Details */}
                  <div className="py-3.5 space-y-2.5 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-slate-400 text-[10px] block">ग्राहक नाव (Customer):</span>
                        <strong className="text-sm font-bold text-slate-900 dark:text-white">
                          {selectedWarranty.customerName}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">मोबाईल व गाव:</span>
                        <strong className="font-mono text-slate-800 dark:text-slate-200">
                          {selectedWarranty.customerPhone} {selectedWarranty.village ? `(${selectedWarranty.village})` : ''}
                        </strong>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">वस्तू व मॉडेल:</span>
                        <strong className="text-indigo-600 dark:text-indigo-400 font-bold">
                          {selectedWarranty.productName}
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">कंपनी ब्रँड:</span>
                        <strong className="font-bold">{selectedWarranty.brand}</strong>
                      </div>
                      <div className="flex justify-between font-mono">
                        <span className="text-slate-500">सिरियल नंबर (Serial No):</span>
                        <strong className="text-amber-600 dark:text-amber-400 font-black">
                          {selectedWarranty.serialNumber}
                        </strong>
                      </div>
                      {selectedWarranty.invoiceNo && (
                        <div className="flex justify-between font-mono">
                          <span className="text-slate-500">टॅक्स बिल नंबर:</span>
                          <strong>#{selectedWarranty.invoiceNo}</strong>
                        </div>
                      )}
                    </div>

                    {/* Warranty Validity Box */}
                    <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60">
                      <div>
                        <span className="text-emerald-800 dark:text-emerald-400 text-[10px] block font-bold">
                          खरेदी तारीख (Start Date):
                        </span>
                        <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                          {selectedWarranty.purchaseDate}
                        </span>
                      </div>
                      <div>
                        <span className="text-emerald-800 dark:text-emerald-400 text-[10px] block font-bold">
                          वैधता समाप्ती (Expiry):
                        </span>
                        <span className="font-mono font-black text-xs text-emerald-700 dark:text-emerald-400">
                          {getWarrantyDetails(selectedWarranty).expiryDateStr}
                        </span>
                      </div>
                    </div>

                    {/* Brand Customer Care Toll-Free */}
                    <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-blue-600 animate-pulse" />
                        <div>
                          <span className="text-[10px] font-bold text-blue-800 dark:text-blue-300 block">
                            {selectedWarranty.brand} अधिकृत टोल-फ्री कस्टमर केअर:
                          </span>
                          <span className="font-mono font-black text-xs text-blue-900 dark:text-blue-200">
                            {selectedWarranty.customerCarePhone}
                          </span>
                        </div>
                      </div>
                      <a
                        href={`tel:${selectedWarranty.customerCarePhone.replace(/\s+/g, '')}`}
                        className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-bold text-[11px] hover:bg-blue-700 transition"
                      >
                        कॉल करा
                      </a>
                    </div>

                    {selectedWarranty.notes && (
                      <p className="text-[10px] text-slate-500 italic">
                        टीप: {selectedWarranty.notes}
                      </p>
                    )}
                  </div>

                  {/* Stamp & Verification */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                    <span>*कंपनीच्या अधिकृत अटी व शर्तींनुसार लागू</span>
                    <span className="font-bold text-slate-600 dark:text-slate-400">
                      Authorized Showroom Seal
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => handleWhatsAppShare(selectedWarranty)}
                    className="flex-1 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>WhatsApp वर कार्ड पाठवा</span>
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>प्रिंट</span>
                  </button>
                  <button
                    onClick={() => handleDeleteWarranty(selectedWarranty.id)}
                    className="p-2.5 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                    title="हटवा"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
                <ShieldCheck className="w-16 h-16 opacity-30 text-indigo-500 mb-3" />
                <h4 className="text-base font-bold text-slate-700 dark:text-slate-300">
                  वॉरंटी कार्ड पहा किंवा नवीन तयार करा
                </h4>
                <p className="text-xs text-slate-500 max-w-xs mt-1">
                  डाव्या बाजूच्या यादीतून कोणत्याही ग्राहकाचे वॉरंटी कार्ड निवडा किंवा 'नवीन वॉरंटी जोडा' बटण दाबा.
                </p>
              </div>
            )}
          </div>
        </div>
        </>
        )}

        {/* ========================================================================= */}
        {/* ADD WARRANTY SLIDE-OVER / MODAL */}
        {/* ========================================================================= */}
        {showAddForm && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-sky-600" />
                  <span>नवीन वॉरंटी कार्ड नोंदणी</span>
                </h3>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveWarranty} className="space-y-3 text-xs">
                {formError && (
                  <div className="p-2.5 rounded-xl bg-rose-100 border border-rose-300 text-rose-800 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{formError}</span>
                  </div>
                )}

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    ग्राहक नाव *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    placeholder="उदा. राहुल देशमुख"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      मोबाईल नंबर
                    </label>
                    <input
                      type="text"
                      value={formData.customerPhone}
                      onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                      placeholder="98XXXXXXXX"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      गाव / पत्ता
                    </label>
                    <input
                      type="text"
                      value={formData.village}
                      onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                      placeholder="उदा. सेलू / सिंदी"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      ब्रँड निवडा
                    </label>
                    <select
                      value={formData.brand}
                      onChange={(e) => handleBrandChange(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                    >
                      {Object.keys(BRAND_CUSTOMER_CARE).map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      बिल नंबर (वैकल्पिक)
                    </label>
                    <input
                      type="text"
                      value={formData.invoiceNo}
                      onChange={(e) => setFormData({ ...formData, invoiceNo: e.target.value })}
                      placeholder="उदा. 3848"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    वस्तूचे नाव / मॉडेल *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.productName}
                    onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                    placeholder="उदा. 43-inch 4K Google TV / 1.5 Ton Inverter AC"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      सिरियल नंबर (Serial No) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.serialNumber}
                      onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                      placeholder="उदा. LG-TV-438902"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      खरेदी तारीख
                    </label>
                    <input
                      type="date"
                      value={formData.purchaseDate}
                      onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      वॉरंटी कालावधी
                    </label>
                    <select
                      value={formData.warrantyPeriodMonths}
                      onChange={(e) => setFormData({ ...formData, warrantyPeriodMonths: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                    >
                      <option value={12}>१ वर्ष (12 Months)</option>
                      <option value={24}>२ वर्षे (24 Months)</option>
                      <option value={36}>३ वर्षे (36 Months)</option>
                      <option value={60}>५ वर्षे (60 Months - Furniture)</option>
                      <option value={120}>१० वर्षे (120 Months - Compressor)</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      कस्टमर केअर नंबर
                    </label>
                    <input
                      type="text"
                      value={formData.customerCarePhone}
                      onChange={(e) => setFormData({ ...formData, customerCarePhone: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    टीप / अटी (Notes)
                  </label>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="उदा. १ वर्ष स्क्रीन + १ वर्ष संपूर्ण"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold"
                  >
                    रद्द करा
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold shadow-md transition ${
                      isSubmitting ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer active:scale-95'
                    }`}
                  >
                    {isSubmitting ? 'सेव्ह होत आहे...' : 'वॉरंटी कार्ड सेव्ह करा'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WarrantyTrackerModal;
