import React, { useState } from 'react';
import { 
  Hammer, 
  Plus, 
  Search, 
  Calendar, 
  Phone, 
  Clock, 
  CheckCircle2, 
  MessageCircle, 
  Printer, 
  ArrowRight, 
  User, 
  ChevronRight,
  Filter,
  DollarSign,
  Layers,
  X,
  AlertCircle
} from 'lucide-react';
import { FurnitureJobCard } from '../types';
import { getSafeWhatsAppUrl } from '../utils/numbering';

interface FurnitureJobCardTrackerProps {
  jobCards: FurnitureJobCard[];
  onSaveJobCard: (card: FurnitureJobCard) => void;
  onUpdateStage: (id: string, newStage: FurnitureJobCard['stage']) => void;
  businessPhone: string;
}

const STAGES: { id: FurnitureJobCard['stage']; label: string; marathi: string; color: string }[] = [
  { id: 'Seasoning', label: '1. Seasoning', marathi: 'सागवान सिझनिंग', color: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/40 dark:text-amber-200' },
  { id: 'Cutting', label: '2. Cutting & Joinery', marathi: 'फ्रेमवर्क व कटिंग', color: 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/40 dark:text-blue-200' },
  { id: 'Carving', label: '3. Carving & Assembly', marathi: 'असेंब्ली व कोरीव काम', color: 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950/40 dark:text-purple-200' },
  { id: 'Polishing', label: '4. Sanding & Polish', marathi: 'पॉलिशिंग व फिनिशिंग', color: 'bg-orange-100 text-orange-900 border-orange-300 dark:bg-orange-950/40 dark:text-orange-200' },
  { id: 'Cushioning', label: '5. Cushioning', marathi: 'फोम व फॅब्रिक कुशनिंग', color: 'bg-pink-100 text-pink-900 border-pink-300 dark:bg-pink-950/40 dark:text-pink-200' },
  { id: 'QC', label: '6. Quality Check', marathi: 'फायनल तपासणी', color: 'bg-cyan-100 text-cyan-900 border-cyan-300 dark:bg-cyan-950/40 dark:text-cyan-200' },
  { id: 'Ready', label: '7. Ready for Delivery', marathi: 'डिलिव्हरीसाठी तयार', color: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-200' },
  { id: 'Delivered', label: '8. Delivered', marathi: 'ग्राहकाकडे पोहोचले', color: 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300' },
];

export const FurnitureJobCardTracker: React.FC<FurnitureJobCardTrackerProps> = ({
  jobCards = [],
  onSaveJobCard,
  onUpdateStage,
  businessPhone = '8766486915',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // New Job Card Form State
  const [formData, setFormData] = useState<Partial<FurnitureJobCard>>({
    customerName: '',
    customerPhone: '',
    itemType: 'Sofa Set',
    woodType: 'Pure Teak (सागवान)',
    dimensionOrSpecs: '',
    totalAmount: 35000,
    advancePaid: 15000,
    artisanName: 'सुरेश सुतार',
    targetDeliveryDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    notes: '',
  });

  const filteredJobs = jobCards.filter((job) => {
    if (stageFilter !== 'all' && job.stage !== stageFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = job.customerName.toLowerCase().includes(q);
      const matchJobNo = job.jobNo.toLowerCase().includes(q);
      const matchPhone = job.customerPhone.includes(q);
      const matchItem = job.itemType.toLowerCase().includes(q);
      if (!matchName && !matchJobNo && !matchPhone && !matchItem) return false;
    }
    return true;
  });

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setFormError('');

    if (!formData.customerName?.trim()) {
      setFormError('कृपया ग्राहकाचे नाव प्रविष्ट करा.');
      return;
    }

    setIsSubmitting(true);

    const total = Number(formData.totalAmount || 0);
    const adv = Number(formData.advancePaid || 0);

    const newJob: FurnitureJobCard = {
      id: `job-${Date.now()}`,
      jobNo: `JOB-2026-${String(jobCards.length + 101).padStart(3, '0')}`,
      customerName: formData.customerName || '',
      customerPhone: formData.customerPhone || '',
      itemType: (formData.itemType as any) || 'Sofa Set',
      woodType: (formData.woodType as any) || 'Pure Teak (सागवान)',
      dimensionOrSpecs: formData.dimensionOrSpecs || '',
      totalAmount: total,
      advancePaid: adv,
      balanceDue: Math.max(0, total - adv),
      artisanName: formData.artisanName || 'दुकान फॅक्टरी',
      orderDate: new Date().toISOString().split('T')[0],
      targetDeliveryDate: formData.targetDeliveryDate || new Date().toISOString().split('T')[0],
      stage: 'Seasoning',
      notes: formData.notes || '',
      updatedAt: new Date().toISOString(),
    };

    onSaveJobCard(newJob);
    setShowAddModal(false);
    setFormData({
      customerName: '',
      customerPhone: '',
      itemType: 'Sofa Set',
      woodType: 'Pure Teak (सागवान)',
      dimensionOrSpecs: '',
      totalAmount: 35000,
      advancePaid: 15000,
      artisanName: 'सुरेश सुतार',
      targetDeliveryDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      notes: '',
    });
    setTimeout(() => {
      setIsSubmitting(false);
    }, 600);
  };

  const handleWhatsAppUpdate = (job: FurnitureJobCard) => {
    const currentStageObj = STAGES.find(s => s.id === job.stage);
    const stageName = currentStageObj ? `${currentStageObj.marathi} (${currentStageObj.label})` : job.stage;

    const msg = 
`🛋️ *श्री साई फर्निचर फॅक्टरी अपडेट* 🛋️
(आर्वी रोड, वर्धा)

नमस्कार *${job.customerName}* जी,
आपल्या *${job.itemType} (${job.woodType})* फर्निचर कामाची सद्यस्थिती खालीलप्रमाणे आहे:

📋 *जॉब कार्ड क्र:* *${job.jobNo}*
🔨 *कामाचा टप्पा:* *${stageName}*
📐 *तपशील:* ${job.dimensionOrSpecs || 'सागवान फिनिश'}
📅 *अपेक्षित डिलिव्हरी:* ${job.targetDeliveryDate}
💰 *शिल्लक बाकी रक्कम:* ₹${job.balanceDue.toLocaleString('en-IN')}

आपल्या फर्निचरचे काम उत्तम दर्जेदार पद्धतीने सुरू आहे. काही शंका असल्यास संपर्क साधावा.

📍 *फॅक्टरी:* श्री साई इंटरप्राइजेस, मातोश्री सभागृह समोर, आर्वी रोड, वर्धा.
📞 *संपर्क:* ${businessPhone}`;

    const url = getSafeWhatsAppUrl(job.customerPhone, msg);
    window.open(url, '_blank');
  };

  const handleAdvanceStage = (job: FurnitureJobCard) => {
    const currentIndex = STAGES.findIndex(s => s.id === job.stage);
    if (currentIndex < STAGES.length - 1) {
      const nextStage = STAGES[currentIndex + 1].id;
      onUpdateStage(job.id, nextStage);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Action Header */}
      <div className="bg-gradient-to-r from-amber-700 via-amber-800 to-amber-950 text-white p-4 sm:p-6 rounded-2xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center text-amber-200">
            <Hammer className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight">
              सागवान फर्निचर फॅक्टरी जॉब कार्ड ट्रॅकर (Furniture Job Cards)
            </h1>
            <p className="text-xs sm:text-sm text-amber-200">
              सोफा, हायड्रोलिक बेड, डायनिंग, कपाट यांच्या ऑर्डर ते डिलिव्हरीपर्यंतचे ८ टप्पे
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#ffd814] hover:bg-[#f7ca00] active:scale-95 text-slate-950 font-bold text-xs sm:text-sm shadow-md transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>नवीन जॉब कार्ड जोडा (New Furniture Job)</span>
        </button>
      </div>

      {/* Stage Flow Indicator Strip */}
      <div className="bg-white dark:bg-[#0F172A] p-3 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar shadow-2xs">
        <div className="flex items-center gap-2 min-w-[760px]">
          {STAGES.map((st, idx) => (
            <React.Fragment key={st.id}>
              <div 
                onClick={() => setStageFilter(stageFilter === st.id ? 'all' : st.id)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition flex items-center gap-1.5 ${
                  stageFilter === st.id ? 'ring-2 ring-amber-500 font-bold' : ''
                } ${st.color}`}
              >
                <span>{st.marathi}</span>
                <span className="w-5 h-5 rounded-full bg-white/60 dark:bg-black/30 flex items-center justify-center text-[10px] font-mono">
                  {jobCards.filter(j => j.stage === st.id).length}
                </span>
              </div>
              {idx < STAGES.length - 1 && (
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="जॉब कार्ड नंबर, ग्राहक नाव, सोफा / बेड, मोबाईल शोधा..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {stageFilter !== 'all' && (
          <button
            onClick={() => setStageFilter('all')}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
          >
            फिल्टर काढा (Reset)
          </button>
        )}
      </div>

      {/* Job Cards Grid */}
      {filteredJobs.length === 0 ? (
        <div className="bg-white dark:bg-[#0F172A] p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-slate-500">
          <Hammer className="w-12 h-12 text-amber-500 mx-auto mb-3 opacity-60" />
          <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">कोणतेही जॉब कार्ड आढळले नाही</h3>
          <p className="text-xs mt-1">नवीन फर्निचर ऑर्डरसाठी "नवीन जॉब कार्ड जोडा" बटणावर क्लिक करा.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredJobs.map((job) => {
            const currentStageObj = STAGES.find(s => s.id === job.stage) || STAGES[0];
            return (
              <div
                key={job.id}
                className="bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs hover:border-amber-500/50 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Row: Job No & Stage Badge */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="font-mono text-xs font-black text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md border border-amber-300 dark:border-amber-800">
                      {job.jobNo}
                    </span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${currentStageObj.color}`}>
                      {currentStageObj.marathi}
                    </span>
                  </div>

                  {/* Customer & Item */}
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    {job.customerName}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-0.5">
                    <Phone className="w-3 h-3" />
                    <span>{job.customerPhone || 'नंबर उपलब्ध नाही'}</span>
                  </div>

                  <div className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 font-semibold">
                      <span>{job.itemType}</span>
                      <span className="text-amber-800 dark:text-amber-400 font-bold">{job.woodType}</span>
                    </div>
                    {job.dimensionOrSpecs && (
                      <p className="text-slate-500 text-[11px] line-clamp-2">
                        {job.dimensionOrSpecs}
                      </p>
                    )}
                    <div className="text-[11px] text-slate-400 pt-1 flex items-center justify-between">
                      <span>कारागीर: <strong>{job.artisanName || '-'}</strong></span>
                      <span>डिलिव्हरी: <strong>{job.targetDeliveryDate}</strong></span>
                    </div>
                  </div>

                  {/* Financials */}
                  <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-slate-400 text-[10px] block">एकूण रक्कम</span>
                      <span className="font-bold text-slate-900 dark:text-white font-mono">₹{job.totalAmount.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">ऍडव्हान्स जमा</span>
                      <span className="font-bold text-emerald-600 font-mono">₹{job.advancePaid.toLocaleString()}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 text-[10px] block">बाकी रक्कम</span>
                      <span className="font-bold text-rose-600 font-mono">₹{job.balanceDue.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleWhatsAppUpdate(job)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-white font-bold text-xs shadow-2xs transition cursor-pointer"
                    title="ग्राहकाला WhatsApp स्टेटस पाठवा"
                  >
                    <MessageCircle className="w-3.5 h-3.5 fill-white" />
                    <span>WhatsApp</span>
                  </button>

                  {job.stage !== 'Delivered' && (
                    <button
                      type="button"
                      onClick={() => handleAdvanceStage(job)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs shadow-2xs transition cursor-pointer"
                    >
                      <span>पुढील टप्पा</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Job Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs no-print">
          <div className="bg-white dark:bg-[#0F172A] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-amber-700 text-white shrink-0">
              <div className="flex items-center gap-2">
                <Hammer className="w-5 h-5" />
                <h3 className="font-bold text-base">नवीन फर्निचर जॉब कार्ड (New Custom Teak Job)</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="p-4 overflow-y-auto space-y-3 text-xs">
              {formError && (
                <div className="p-2.5 rounded-xl bg-rose-100 border border-rose-300 text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">ग्राहक नाव *</label>
                  <input
                    type="text"
                    required
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    placeholder="उदा. राजेश देशमुख"
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">मोबाईल नंबर *</label>
                  <input
                    type="tel"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    placeholder="10 अंकी मोबाईल"
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">फर्निचर प्रकार</label>
                  <select
                    value={formData.itemType}
                    onChange={(e) => setFormData({ ...formData, itemType: e.target.value as any })}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    <option value="Sofa Set">सागवान सोफा सेट (L-Shape / 3+1+1)</option>
                    <option value="Teak Bed">सागवान हायड्रोलिक बेड</option>
                    <option value="Dining Table">सागवान डायनिंग टेबल सेट</option>
                    <option value="Wardrobe">सागवान वॉर्डरोब / कपाट</option>
                    <option value="Dressing Table">ड्रेसिंग टेबल</option>
                    <option value="Mandir">सागवान देवघर (Temple)</option>
                    <option value="Custom Teak Item">इतर कस्टम फर्निचर</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">लाकूड प्रकार (Wood)</label>
                  <select
                    value={formData.woodType}
                    onChange={(e) => setFormData({ ...formData, woodType: e.target.value as any })}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    <option value="Pure Teak (सागवान)">Pure Teak (१००% अस्सल सागवान)</option>
                    <option value="Engineered Teak">Engineered Teak / Plywood Teak Finish</option>
                    <option value="Rosewood Polish">Rosewood / Melamine Polish Finish</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">मापे व डिझाईन तपशील</label>
                <textarea
                  rows={2}
                  value={formData.dimensionOrSpecs}
                  onChange={(e) => setFormData({ ...formData, dimensionOrSpecs: e.target.value })}
                  placeholder="उदा. 7-सीटर सोफा, राखाडी-क्रीम फॅब्रिक, 40-डेन्सिटी फोम, ब्रास डिझाईन"
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">एकूण ठरलेली रक्कम (₹)</label>
                  <input
                    type="number"
                    value={formData.totalAmount}
                    onChange={(e) => setFormData({ ...formData, totalAmount: Number(e.target.value) })}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">ऍडव्हान्स जमा (₹)</label>
                  <input
                    type="number"
                    value={formData.advancePaid}
                    onChange={(e) => setFormData({ ...formData, advancePaid: Number(e.target.value) })}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">कारागीर (Artisan)</label>
                  <input
                    type="text"
                    value={formData.artisanName}
                    onChange={(e) => setFormData({ ...formData, artisanName: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">डिलिव्हरी तारीख</label>
                  <input
                    type="date"
                    value={formData.targetDeliveryDate}
                    onChange={(e) => setFormData({ ...formData, targetDeliveryDate: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  रद्द करा
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-sm transition ${
                    isSubmitting ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer active:scale-95'
                  }`}
                >
                  {isSubmitting ? 'सेव्ह होत आहे...' : 'जॉब कार्ड सेव्ह करा'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
