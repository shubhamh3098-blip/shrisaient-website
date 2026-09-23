import React, { useState, useEffect, useMemo } from 'react';
import {
  Wrench,
  Hammer,
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
  MessageCircle,
  Send,
  Check,
  ChevronRight,
  AlertCircle,
  X
} from 'lucide-react';
import { BusinessSettings, Customer } from '../types';
import { WarrantyCardRecord } from './WarrantyTrackerModal';

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

const TECHNICIANS = [
  { name: 'अमोल मेश्राम (LG / Samsung TV एक्सपर्ट)', phone: '9823112233', role: 'इलेक्ट्रॉनिक्स व टीव्ही' },
  { name: 'प्रमोद काळे (रेफ्रिजरेशन मेकॅनिक)', phone: '9850123456', role: 'फ्रीज व कुलर' },
  { name: 'विनोद मिस्त्री (सागवान कारागीर)', phone: '9766486915', role: 'फर्निचर व कपाट' },
  { name: 'दत्तात्रय घुगे (वॉशिंग मशीन व मोटर)', phone: '9822456789', role: 'घरगुती उपकरणे' },
  { name: 'शोरूम स्वतःची टीम / इतर', phone: '8766486915', role: 'जनरल सर्व्हिस' },
];

const INITIAL_SERVICE_TICKETS: ServiceComplaintTicket[] = [
  {
    id: 'tkt-1',
    ticketNo: 'TKT-101',
    date: '2026-09-21',
    customerName: 'सुनील बोबडे',
    customerPhone: '9822345671',
    village: 'सिंदी (रेल्वे)',
    productName: '43" 4K Smart Google TV',
    brand: 'LG',
    serialNumber: 'LG-43TV-902184',
    invoiceNo: '3848',
    problemDescription: 'डिस्प्ले चालू होत नाही, साऊंड चालू आहे',
    priority: 'Urgent',
    technicianName: 'अमोल मेश्राम (LG / Samsung TV एक्सपर्ट)',
    technicianPhone: '9823112233',
    visitDate: '2026-09-23',
    status: 'Assigned',
    serviceCharge: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'tkt-2',
    ticketNo: 'TKT-102',
    date: '2026-09-20',
    customerName: 'गजानन ठाकरे',
    customerPhone: '9423456782',
    village: 'सेलू',
    productName: '240L Double Door Inverter Refrigerator',
    brand: 'Whirlpool',
    serialNumber: 'WP-RF-883710',
    invoiceNo: '3820',
    problemDescription: 'फ्रिजचे वरचे फ्रीझर थंड करते पण खालचा कप्पा थंड करत नाही',
    priority: 'High',
    technicianName: 'प्रमोद काळे (रेफ्रिजरेशन मेकॅनिक)',
    technicianPhone: '9850123456',
    visitDate: '2026-09-22',
    status: 'In Progress',
    serviceCharge: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'tkt-3',
    ticketNo: 'TKT-103',
    date: '2026-09-18',
    customerName: 'रमेशजी वानखेडे',
    customerPhone: '9881234567',
    village: 'देवळी',
    productName: 'सागवान ३-डोअर कपाट',
    brand: 'Shri Sai Teak Furniture',
    serialNumber: 'SAI-TK-4109',
    invoiceNo: '3799',
    problemDescription: 'कपाटाच्या मधल्या दरवाज्याचा लॉक टाइट बसत आहे',
    priority: 'Normal',
    technicianName: 'विनोद मिस्त्री (सागवान कारागीर)',
    technicianPhone: '9766486915',
    status: 'Resolved',
    resolutionNotes: 'दरवाजा ॲलाइन केला व ऑइलिंग करून सुलभ केले',
    serviceCharge: 0,
    createdAt: new Date().toISOString()
  }
];

interface ServiceComplaintSectionProps {
  settings: BusinessSettings;
  customers?: Customer[];
  warranties?: WarrantyCardRecord[];
}

export const ServiceComplaintSection: React.FC<ServiceComplaintSectionProps> = ({
  settings,
  customers = [],
  warranties = []
}) => {
  const [tickets, setTickets] = useState<ServiceComplaintTicket[]>(() => {
    try {
      const saved = localStorage.getItem('shri_sai_service_tickets');
      return saved ? JSON.parse(saved) : INITIAL_SERVICE_TICKETS;
    } catch {
      return INITIAL_SERVICE_TICKETS;
    }
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<ServiceComplaintTicket | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPrintSlip, setShowPrintSlip] = useState(false);

  // Form State
  const [formCustomerName, setFormCustomerName] = useState('');
  const [formCustomerPhone, setFormCustomerPhone] = useState('');
  const [formVillage, setFormVillage] = useState('');
  const [formProductName, setFormProductName] = useState('');
  const [formBrand, setFormBrand] = useState('LG');
  const [formSerialNumber, setFormSerialNumber] = useState('');
  const [formInvoiceNo, setFormInvoiceNo] = useState('');
  const [formProblem, setFormProblem] = useState('');
  const [formPriority, setFormPriority] = useState<'Normal' | 'High' | 'Urgent'>('High');
  const [formTechnician, setFormTechnician] = useState(TECHNICIANS[0]);
  const [formVisitDate, setFormVisitDate] = useState(new Date().toISOString().split('T')[0]);

  // Resolution Modal State
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolveNotes, setResolveNotes] = useState('');
  const [resolveCharge, setResolveCharge] = useState(0);

  // Save tickets
  useEffect(() => {
    try {
      localStorage.setItem('shri_sai_service_tickets', JSON.stringify(tickets));
    } catch (e) {
      console.error(e);
    }
  }, [tickets]);

  // Filtered Tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        t.ticketNo.toLowerCase().includes(q) ||
        t.customerName.toLowerCase().includes(q) ||
        t.customerPhone.includes(q) ||
        t.productName.toLowerCase().includes(q) ||
        (t.village && t.village.toLowerCase().includes(q)) ||
        (t.technicianName && t.technicianName.toLowerCase().includes(q));

      if (!matchSearch) return false;
      if (filterStatus !== 'all' && t.status !== filterStatus) return false;
      return true;
    });
  }, [tickets, searchTerm, filterStatus]);

  // Quick stats
  const stats = useMemo(() => {
    return {
      total: tickets.length,
      open: tickets.filter((t) => t.status === 'Open').length,
      assigned: tickets.filter((t) => t.status === 'Assigned' || t.status === 'In Progress').length,
      resolved: tickets.filter((t) => t.status === 'Resolved').length,
    };
  }, [tickets]);

  // Create Ticket
  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCustomerName.trim() || !formCustomerPhone.trim() || !formProductName.trim() || !formProblem.trim()) {
      alert('कृपया ग्राहकाचे नाव, फोन, वस्तू आणि समस्येचे वर्णन प्रविष्ट करा.');
      return;
    }

    const nextNum = tickets.length + 101;
    const newTkt: ServiceComplaintTicket = {
      id: `tkt-${Date.now()}`,
      ticketNo: `TKT-${nextNum}`,
      date: new Date().toISOString().split('T')[0],
      customerName: formCustomerName.trim(),
      customerPhone: formCustomerPhone.trim(),
      village: formVillage.trim() || 'वर्धा',
      productName: formProductName.trim(),
      brand: formBrand,
      serialNumber: formSerialNumber.trim(),
      invoiceNo: formInvoiceNo.trim(),
      problemDescription: formProblem.trim(),
      priority: formPriority,
      technicianName: formTechnician.name,
      technicianPhone: formTechnician.phone,
      visitDate: formVisitDate,
      status: 'Assigned',
      serviceCharge: 0,
      createdAt: new Date().toISOString()
    };

    setTickets((prev) => [newTkt, ...prev]);
    setSelectedTicket(newTkt);
    setShowAddModal(false);

    // Reset Form
    setFormCustomerName('');
    setFormCustomerPhone('');
    setFormVillage('');
    setFormProductName('');
    setFormSerialNumber('');
    setFormProblem('');
  };

  // Status Change
  const handleUpdateStatus = (id: string, newStatus: ServiceComplaintTicket['status']) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
    );
    if (selectedTicket?.id === id) {
      setSelectedTicket((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  // Mark Resolved
  const handleConfirmResolve = () => {
    if (!selectedTicket) return;
    const updated = {
      ...selectedTicket,
      status: 'Resolved' as const,
      resolutionNotes: resolveNotes.trim() || 'दुरुस्ती यशस्वीरित्या पूर्ण झाली',
      serviceCharge: Number(resolveCharge) || 0
    };

    setTickets((prev) => prev.map((t) => (t.id === selectedTicket.id ? updated : t)));
    setSelectedTicket(updated);
    setShowResolveModal(false);
    setResolveNotes('');
    setResolveCharge(0);
  };

  // WhatsApp to Technician (Job Sheet)
  const handleWhatsAppTechnician = (tkt: ServiceComplaintTicket) => {
    const cleanPh = (tkt.technicianPhone || '').replace(/\D/g, '').slice(-10);
    const storeName = settings.businessName || 'श्री साई एंटरप्रायझेस, वर्धा';
    const storePhone = settings.ownerPhone || '9766911693';

    const msg =
      `🛠️ *${storeName} - मेकॅनिक जॉब शीट* 🛠️\n` +
      `तक्रार नोंद क्र: *#${tkt.ticketNo}*\n` +
      `तारीख: ${tkt.date} | प्राधान्य: *${tkt.priority === 'Urgent' ? '🔴 तातडीचे (Urgent)' : tkt.priority === 'High' ? '🟠 महत्त्वाचे' : '🟢 सामान्य'}*\n` +
      `--------------------------------\n` +
      `👤 *ग्राहक:* *${tkt.customerName}*\n` +
      `📞 *मोबाईल:* ${tkt.customerPhone}\n` +
      `📍 *पत्ता/गाव:* *${tkt.village || 'वर्धा'}*\n` +
      `--------------------------------\n` +
      `📦 *वस्तू:* *${tkt.productName} (${tkt.brand})*\n` +
      `${tkt.serialNumber ? `🔢 *सिरियल क्र:* ${tkt.serialNumber}\n` : ''}` +
      `${tkt.invoiceNo ? `🧾 *बिल क्र:* #${tkt.invoiceNo}\n` : ''}` +
      `⚠️ *तक्रार/समस्या:* *${tkt.problemDescription}*\n` +
      `📅 *अपेक्षित भेट तारीख:* *${tkt.visitDate || 'आज/उद्या'}*\n` +
      `--------------------------------\n` +
      `कृपया ग्राहकाशी संपर्क करून व्हिजिट पूर्ण करावी व शोरूमला कामाचा रिपोर्ट द्यावा.\n` +
      `📞 शोरूम संपर्क: ${storePhone} / 8766486915\n` +
      `_श्री साई एंटरप्रायझेस अधिकृत सर्व्हिस नेटवर्क_ 🙏`;

    const encoded = encodeURIComponent(msg);
    if (cleanPh && cleanPh.length === 10) {
      window.open(`https://wa.me/91${cleanPh}?text=${encoded}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${encoded}`, '_blank');
    }
  };

  // WhatsApp to Customer (Acknowledgment)
  const handleWhatsAppCustomerUpdate = (tkt: ServiceComplaintTicket) => {
    const cleanPh = (tkt.customerPhone || '').replace(/\D/g, '').slice(-10);
    const storeName = settings.businessName || 'श्री साई एंटरप्रायझेस, वर्धा';
    const storePhone = settings.ownerPhone || '9766911693';

    const msg =
      `🙏 *नमस्कार ${tkt.customerName} जी,*\n` +
      `*${storeName}* कडून आपल्या सर्व्हिस तक्रारीची नोंद घेण्यात आली आहे.\n\n` +
      `📋 *तक्रार क्र:* *#${tkt.ticketNo}*\n` +
      `📦 *वस्तू:* ${tkt.productName} (${tkt.brand})\n` +
      `👨‍🔧 *नेमणूक केलेले टेक्निशियन:* *${tkt.technicianName}*\n` +
      `📞 *टेक्निशियन मोबाईल:* *${tkt.technicianPhone}*\n` +
      `📅 *अंदाजे भेट तारीख:* ${tkt.visitDate || 'आज/उद्या'}\n` +
      `📌 *स्थिती:* ${tkt.status === 'Resolved' ? '✅ दुरुस्त झाले' : '🔄 टेक्निशियनकडे सोपवले'}\n\n` +
      `टेक्निशियन लवकरच आपल्याशी संपर्क करतील. काही अडचण असल्यास संपर्क साधावा:\n` +
      `📞 ${storeName} - ${storePhone}\n` +
      `_आमच्या सेवेवर विश्वास ठेवल्याबद्दल धन्यवाद!_ 🙏`;

    const encoded = encodeURIComponent(msg);
    if (cleanPh && cleanPh.length === 10) {
      window.open(`https://wa.me/91${cleanPh}?text=${encoded}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${encoded}`, '_blank');
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Search & Actions Bar */}
      <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="तक्रार क्र, ग्राहक, वस्तू, फोन किंवा टेक्निशियन शोधा..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-0.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold">
            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              className={`px-2 py-1 rounded-lg transition ${filterStatus === 'all' ? 'bg-amber-600 text-white' : 'text-slate-500'}`}
            >
              सर्व ({stats.total})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('Assigned')}
              className={`px-2 py-1 rounded-lg transition ${filterStatus === 'Assigned' ? 'bg-blue-600 text-white' : 'text-blue-600'}`}
            >
              सोपवले ({stats.assigned})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('Resolved')}
              className={`px-2 py-1 rounded-lg transition ${filterStatus === 'Resolved' ? 'bg-emerald-600 text-white' : 'text-emerald-600'}`}
            >
              पूर्ण ({stats.resolved})
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md cursor-pointer transition"
          >
            <Plus className="w-4 h-4" />
            <span>नवीन तक्रार नोंदवा</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800">
        
        {/* Left Column: Tickets List */}
        <div className="md:col-span-6 p-4 space-y-3 overflow-y-auto max-h-[60vh] md:max-h-none">
          {filteredTickets.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <Wrench className="w-10 h-10 mx-auto opacity-40 mb-2" />
              <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
                कोणतीही तक्रार नोंद आढळली नाही
              </p>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="mt-3 text-xs text-amber-600 dark:text-amber-400 font-bold underline cursor-pointer"
              >
                + नवीन तक्रार नोंदवा
              </button>
            </div>
          ) : (
            filteredTickets.map((tkt) => {
              const isSelected = selectedTicket?.id === tkt.id;
              return (
                <div
                  key={tkt.id}
                  onClick={() => setSelectedTicket(tkt)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 ring-2 ring-amber-500/20 shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-black text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded">
                          #{tkt.ticketNo}
                        </span>
                        <strong className="text-slate-900 dark:text-white font-bold text-sm">
                          {tkt.customerName}
                        </strong>
                        {tkt.village && (
                          <span className="text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                            {tkt.village}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1 flex items-center gap-1.5">
                        <Wrench className="w-3.5 h-3.5 text-amber-600" />
                        <span>{tkt.productName} ({tkt.brand})</span>
                      </p>
                      <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium mt-0.5 line-clamp-1">
                        समस्या: {tkt.problemDescription}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                          tkt.status === 'Resolved'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : tkt.status === 'Assigned'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {tkt.status === 'Resolved' ? 'पूर्ण' : tkt.status === 'Assigned' ? 'सोपवले' : 'नोंद'}
                      </span>
                      {tkt.priority === 'Urgent' && (
                        <span className="text-[9px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded">
                          🔴 तातडीचे
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                    <span>मेकॅनिक: <strong className="text-slate-700 dark:text-slate-300">{tkt.technicianName.split('(')[0]}</strong></span>
                    <span>भेट: <strong className="text-slate-700 dark:text-slate-300">{tkt.visitDate || tkt.date}</strong></span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Ticket Details & Action Hub */}
        <div className="md:col-span-6 p-4 sm:p-6 bg-slate-50/50 dark:bg-[#090F1E] flex flex-col justify-between">
          {selectedTicket ? (
            <div className="space-y-4">
              {/* Job Card Box */}
              <div className="bg-white dark:bg-slate-900 border-2 border-amber-500/40 rounded-3xl p-5 shadow-xl relative overflow-hidden text-slate-900 dark:text-white space-y-4">
                <div className="border-b border-amber-100 dark:border-slate-800 pb-3 flex items-start justify-between">
                  <div>
                    <span className="px-2 py-0.5 rounded-md bg-amber-600 text-white font-black text-[9px] uppercase tracking-widest">
                      मेकॅनिक जॉब शीट / तक्रार पावती
                    </span>
                    <h3 className="text-base font-black text-slate-900 dark:text-white mt-1">
                      तक्रार #{selectedTicket.ticketNo}
                    </h3>
                  </div>
                  <span
                    className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                      selectedTicket.status === 'Resolved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {selectedTicket.status}
                  </span>
                </div>

                {/* Customer & Product Information */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">ग्राहक नाव</span>
                    <strong className="text-sm font-black">{selectedTicket.customerName}</strong>
                    {selectedTicket.village && <span className="block text-[11px] text-slate-500">गाव: {selectedTicket.village}</span>}
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">मोबाईल</span>
                    <strong className="text-sm font-mono font-bold">{selectedTicket.customerPhone}</strong>
                  </div>
                  <div className="col-span-2 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block font-bold">वस्तू व ब्रँड</span>
                    <strong className="text-xs font-bold text-slate-900 dark:text-white">
                      {selectedTicket.productName} ({selectedTicket.brand})
                    </strong>
                    {selectedTicket.serialNumber && (
                      <span className="block text-[10px] text-slate-500 font-mono mt-0.5">
                        सिरियल क्र: {selectedTicket.serialNumber}
                      </span>
                    )}
                  </div>
                  <div className="col-span-2 bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60">
                    <span className="text-[10px] text-rose-600 dark:text-rose-400 block font-bold uppercase">
                      नोंदवलेली समस्या (Fault / Issue)
                    </span>
                    <p className="text-xs font-bold text-rose-950 dark:text-rose-200 mt-0.5">
                      {selectedTicket.problemDescription}
                    </p>
                  </div>
                  <div className="col-span-2 bg-blue-50 dark:bg-blue-950/40 p-2.5 rounded-xl border border-blue-200 dark:border-blue-900/60 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 block font-bold">नेमणूक केलेले टेक्निशियन</span>
                      <strong className="text-xs font-bold text-blue-950 dark:text-blue-100">
                        {selectedTicket.technicianName}
                      </strong>
                    </div>
                    <span className="text-xs font-mono font-bold text-blue-700 dark:text-blue-300">
                      📞 {selectedTicket.technicianPhone}
                    </span>
                  </div>
                </div>

                {selectedTicket.resolutionNotes && (
                  <div className="bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-200 text-xs">
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold block">दुरुस्ती रिपोर्ट</span>
                    <p className="text-emerald-900 dark:text-emerald-200 font-medium">{selectedTicket.resolutionNotes}</p>
                  </div>
                )}
              </div>

              {/* Fast WhatsApp & Status Actions */}
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleWhatsAppTechnician(selectedTicket)}
                    className="p-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>मेकॅनिकला जॉब पाठवा</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleWhatsAppCustomerUpdate(selectedTicket)}
                    className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>ग्राहकाला अपडेट पाठवा</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {selectedTicket.status !== 'Resolved' ? (
                    <button
                      type="button"
                      onClick={() => setShowResolveModal(true)}
                      className="flex-1 p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>काम पूर्ण झाले (Mark Resolved)</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(selectedTicket.id, 'Assigned')}
                      className="flex-1 p-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-300 cursor-pointer"
                    >
                      पुन्हा उघडा (Reopen Ticket)
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 flex items-center gap-1 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>प्रिंट</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <Wrench className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
              <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
                तपशील पाहण्यासाठी डावीकडील कोणतीही तक्रार निवडा
              </p>
            </div>
          )}
        </div>
      </div>

      {/* NEW TICKET MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0C1425] rounded-3xl p-5 sm:p-6 w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-2xl text-slate-900 dark:text-white space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-amber-500" />
                <h3 className="font-black text-base">नवीन तक्रार / सर्व्हिस जॉब नोंदवा</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">ग्राहकाचे नाव *</label>
                  <input
                    type="text"
                    required
                    value={formCustomerName}
                    onChange={(e) => setFormCustomerName(e.target.value)}
                    placeholder="उदा. सुनील बोबडे"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">मोबाईल नंबर *</label>
                  <input
                    type="text"
                    required
                    value={formCustomerPhone}
                    onChange={(e) => setFormCustomerPhone(e.target.value)}
                    placeholder="उदा. 9822345671"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">गाव / पत्ता</label>
                  <input
                    type="text"
                    value={formVillage}
                    onChange={(e) => setFormVillage(e.target.value)}
                    placeholder="उदा. सिंदी / वर्धा"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">बिल नंबर (ऐच्छिक)</label>
                  <input
                    type="text"
                    value={formInvoiceNo}
                    onChange={(e) => setFormInvoiceNo(e.target.value)}
                    placeholder="उदा. 3848"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">वस्तूचे नाव *</label>
                  <input
                    type="text"
                    required
                    value={formProductName}
                    onChange={(e) => setFormProductName(e.target.value)}
                    placeholder="उदा. 43-इंच LED TV किंवा फ्रिज"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">ब्रँड</label>
                  <input
                    type="text"
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                    placeholder="LG, Godrej"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">समस्येचे वर्णन (Problem Description) *</label>
                <textarea
                  required
                  rows={2}
                  value={formProblem}
                  onChange={(e) => setFormProblem(e.target.value)}
                  placeholder="ग्राहकाने काय अडचण सांगितली आहे (उदा. डिस्प्ले येत नाही, कूलिंग नाही, आवाज येतो)..."
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">मेकॅनिक / टेक्निशियन निवडा</label>
                  <select
                    value={formTechnician.name}
                    onChange={(e) => {
                      const t = TECHNICIANS.find((x) => x.name === e.target.value);
                      if (t) setFormTechnician(t);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold cursor-pointer"
                  >
                    {TECHNICIANS.map((tech) => (
                      <option key={tech.name} value={tech.name}>
                        {tech.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">प्राधान्य (Priority)</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold cursor-pointer"
                  >
                    <option value="Normal">सामान्य (Normal)</option>
                    <option value="High">महत्त्वाचे (High)</option>
                    <option value="Urgent">🔴 तातडीचे (Urgent)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                >
                  रद्द करा
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-md cursor-pointer active:scale-95"
                >
                  तक्रार नोंद सेव्ह करा
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESOLUTION MODAL */}
      {showResolveModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0C1425] rounded-3xl p-5 sm:p-6 w-full max-w-md border border-slate-200 dark:border-slate-800 shadow-2xl text-slate-900 dark:text-white space-y-4">
            <h3 className="font-black text-base flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span>काम पूर्ण नोंद (Resolution Report)</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">दुरुस्ती रिपोर्ट / नोट्स</label>
                <textarea
                  rows={3}
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
                  placeholder="उदा. पॅनल केबल बदलली, कुलर पंप बदलला, दरवाजा ॲलाइन केला..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">सर्व्हिस शुल्क (वॉरंटीबाहेर असल्यास, ₹)</label>
                <input
                  type="number"
                  value={resolveCharge || ''}
                  onChange={(e) => setResolveCharge(Number(e.target.value))}
                  placeholder="₹ 0 (मोफत)"
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResolveModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                >
                  रद्द
                </button>
                <button
                  type="button"
                  onClick={handleConfirmResolve}
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold shadow-md cursor-pointer"
                >
                  पूर्ण म्हणून नोंदवा
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
