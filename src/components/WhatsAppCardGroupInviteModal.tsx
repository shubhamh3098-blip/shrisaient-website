import React, { useState, useMemo } from 'react';
import {
  MessageCircle,
  Users,
  Copy,
  Check,
  ExternalLink,
  Download,
  Search,
  CheckCircle2,
  X,
  Phone,
  Sparkles,
  QrCode,
  Printer,
  ChevronRight,
  Filter,
  RefreshCw,
  Share2,
  Send
} from 'lucide-react';
import { CardMember, BusinessSettings } from '../types';

interface WhatsAppCardGroupInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardMembers: CardMember[];
  settings: BusinessSettings;
}

export const WhatsAppCardGroupInviteModal: React.FC<WhatsAppCardGroupInviteModalProps> = ({
  isOpen,
  onClose,
  cardMembers = [],
  settings,
}) => {
  const groupLink =
    settings.whatsappGroupLink ||
    'https://chat.whatsapp.com/CLcaeUq1bHH1RE0203oPaP?s=cl&p=a&mlu=4&ilr=4';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'sent'>('all');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'invites' | 'vcf-import' | 'qr'>('invites');

  // Track invited status in localStorage so user knows who has received the link
  const [invitedMap, setInvitedMap] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem('whatsapp_group_invited_cards');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  if (!isOpen) return null;

  // Filter members with valid phone numbers
  const validMembers = useMemo(() => {
    return cardMembers.map((m) => {
      const cleanPhone = (m.phone || '').replace(/\D/g, '').slice(-10);
      const hasValidPhone = cleanPhone.length === 10;
      const isInvited = Boolean(invitedMap[m.id]);
      return {
        ...m,
        cleanPhone,
        hasValidPhone,
        isInvited,
      };
    });
  }, [cardMembers, invitedMap]);

  // Distinct villages
  const villages = useMemo(() => {
    const set = new Set<string>();
    validMembers.forEach((m) => {
      if (m.village?.trim()) set.add(m.village.trim());
    });
    return Array.from(set).sort();
  }, [validMembers]);

  // Filtered list
  const filteredMembers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return validMembers.filter((m) => {
      const matchesSearch =
        !q ||
        m.customerName.toLowerCase().includes(q) ||
        m.cleanPhone.includes(q) ||
        m.cardNumber.toString().includes(q) ||
        (m.village && m.village.toLowerCase().includes(q));

      const matchesVillage =
        selectedVillage === 'all' ||
        (m.village && m.village.trim().toLowerCase() === selectedVillage.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'sent' && m.isInvited) ||
        (statusFilter === 'pending' && !m.isInvited);

      return matchesSearch && matchesVillage && matchesStatus;
    });
  }, [validMembers, searchQuery, selectedVillage, statusFilter]);

  const totalWithPhone = validMembers.filter((m) => m.hasValidPhone).length;
  const totalSent = validMembers.filter((m) => m.hasValidPhone && m.isInvited).length;
  const totalPending = totalWithPhone - totalSent;

  // Mark member as invited
  const markAsInvited = (memberId: string) => {
    const updated = { ...invitedMap, [memberId]: true };
    setInvitedMap(updated);
    try {
      localStorage.setItem('whatsapp_group_invited_cards', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // Generate Message Text for a member
  const getInviteMessageText = (name: string, cardNumber: number) => {
    const storeName = settings.businessName || 'श्री साई एंटरप्रायझेस, वर्धा';
    return (
      `*नमस्कार ${name} जी,* 🙏\n\n` +
      `*${storeName}* च्या ३०-महिने कार्ड बचत व लकी ड्रॉ योजनेच्या (आपले कार्ड क्र. *#${cardNumber}*) अधिकृत व्हॉट्सॲप ग्रुपमध्ये सामील होण्यासाठी खालील लिंकवर क्लिक करा:\n\n` +
      `👉 *ग्रुप जॉईन लिंक:* ${groupLink}\n\n` +
      `📌 *या ग्रुपमध्ये काय मिळेल?*\n` +
      `• दरमहा लकी ड्रॉ सोडतीचे थेट निकाल व बक्षिसे\n` +
      `• मासिक हप्त्यांची नोंद व महत्त्वाची माहिती\n` +
      `• कार्डधारकांसाठी विशेष सवलती व ऑफर्स\n\n` +
      `कृपया त्वरित वरील निळ्या लिंकवर क्लिक करून ग्रुप जॉईन व्हा.\n\n` +
      `धन्यवाद!\n` +
      `*${storeName}*\n` +
      `मातोश्री सभागृह समोर, आर्वी रोड, पंजाब कॉलनी, वर्धा\n` +
      `📞 संपर्क: 8766486915 / 9766911693`
    );
  };

  // Send WhatsApp invite to specific member
  const handleSendInvite = (member: typeof validMembers[0]) => {
    if (!member.hasValidPhone) {
      alert('या ग्राहकाचा वैध १०-अंकी मोबाईल नंबर नोंदवलेला नाही.');
      return;
    }

    const text = encodeURIComponent(getInviteMessageText(member.customerName, member.cardNumber));
    const url = `https://wa.me/91${member.cleanPhone}?text=${text}`;
    markAsInvited(member.id);
    window.open(url, '_blank');
  };

  // Next Pending Invite
  const handleSendNextPending = () => {
    const nextPending = validMembers.find((m) => m.hasValidPhone && !m.isInvited);
    if (!nextPending) {
      alert('अभिनंदन! सर्व उपलब्ध कार्डधारकांना आमंत्रण पाठवले गेले आहे.');
      return;
    }
    handleSendInvite(nextPending);
  };

  // Copy Group Link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(groupLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Copy Message Template
  const handleCopyTemplate = () => {
    const sampleText = getInviteMessageText('ग्राहक', 101);
    navigator.clipboard.writeText(sampleText);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2500);
  };

  // Download VCF File for Bulk Contact Import into Phone
  const handleDownloadVcf = () => {
    const membersToExport = validMembers.filter((m) => m.hasValidPhone);
    if (membersToExport.length === 0) {
      alert('मोबाईल नंबर असलेले कार्डधारक सापडले नाहीत.');
      return;
    }

    let vcfContent = '';
    membersToExport.forEach((m) => {
      const vName = m.village ? ` - ${m.village}` : '';
      const fullName = `साई कार्ड ${m.cardNumber} ${m.customerName}${vName}`;
      vcfContent += `BEGIN:VCARD\r\n`;
      vcfContent += `VERSION:3.0\r\n`;
      vcfContent += `FN:${fullName}\r\n`;
      vcfContent += `TEL;TYPE=CELL,VOICE:+91${m.cleanPhone}\r\n`;
      vcfContent += `NOTE:Shri Sai Enterprises 30-Month Card Scheme Member #${m.cardNumber}\r\n`;
      vcfContent += `END:VCARD\r\n`;
    });

    const blob = new Blob([vcfContent], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Shri_Sai_Card_Members_${membersToExport.length}_Contacts.vcf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Print QR Standee
  const handlePrintQrStandee = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/15 rounded-2xl backdrop-blur-xs ring-2 ring-white/20">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black flex items-center gap-2">
                <span>कार्डधारक WhatsApp ग्रुप आमंत्रण हब</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase">
                  Direct Group Connect
                </span>
              </h2>
              <p className="text-xs text-emerald-100">
                सर्व कार्डधारकांचे मोबाईल नंबर थेट अधिकृत WhatsApp ग्रुपमध्ये जोडण्यासाठी जलद साधने
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Official WhatsApp Group Banner */}
        <div className="p-4 bg-emerald-50/80 dark:bg-emerald-950/30 border-b border-emerald-100 dark:border-emerald-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 dark:text-emerald-200">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span>अधिकृत ग्रुप लिंक:</span>
              <a
                href={groupLink}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-emerald-700 dark:text-emerald-400 underline truncate max-w-xs sm:max-w-md inline-block"
              >
                {groupLink}
              </a>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              एकूण <strong>{totalWithPhone} कार्डधारक</strong> वैध मोबाईल नंबरसह उपलब्ध आहेत (
              <span className="text-emerald-600 font-bold">{totalSent} पाठवले</span>,{' '}
              <span className="text-amber-600 font-bold">{totalPending} बाकी</span>)
            </p>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0">
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex-1 sm:flex-initial px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition shadow-2xs"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'कॉपी झाली!' : 'लिंक कॉपी करा'}</span>
            </button>
            <a
              href={groupLink}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition shadow-2xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>ग्रुप उघडा</span>
            </a>
          </div>
        </div>

        {/* 3 Main Tabs */}
        <div className="p-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('invites')}
              className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                activeTab === 'invites'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>१-क्लिक WhatsApp आमंत्रण</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('vcf-import')}
              className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                activeTab === 'vcf-import'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>सर्व Contacts (.vcf) डाऊनलोड</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('qr')}
              className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                activeTab === 'qr'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>काउंटर QR पोस्टर</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Member-by-Member Invites */}
        {activeTab === 'invites' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {/* Quick Action Top Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleSendNextPending}
                  className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>पुढील बाकी सदस्याला पाठवा (Next Invite)</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyTemplate}
                  className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer transition"
                  title="पूर्ण आमंत्रण मेसेज कॉपी करा"
                >
                  {copiedTemplate ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{copiedTemplate ? 'मेसेज कॉपी झाला!' : 'मेसेज कॉपी'}</span>
                </button>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end text-xs">
                <span className="text-slate-400 text-[11px]">दाखवा:</span>
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition text-xs cursor-pointer ${
                    statusFilter === 'all'
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  सर्व ({totalWithPhone})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('pending')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition text-xs cursor-pointer ${
                    statusFilter === 'pending'
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  बाकी ({totalPending})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('sent')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition text-xs cursor-pointer ${
                    statusFilter === 'sent'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  पाठवले ({totalSent})
                </button>
              </div>
            </div>

            {/* Search & Village Filters */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="कार्ड नंबर, ग्राहकाचे नाव किंवा मोबाईलने शोधा..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-emerald-500"
                />
              </div>

              {villages.length > 0 && (
                <select
                  value={selectedVillage}
                  onChange={(e) => setSelectedVillage(e.target.value)}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200"
                >
                  <option value="all">सर्व गावे ({villages.length})</option>
                  {villages.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Members Table / Cards */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
              <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {filteredMembers.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-xs">
                    कोणतेही कार्डधारक आढळले नाहीत.
                  </div>
                ) : (
                  filteredMembers.map((m) => (
                    <div
                      key={m.id}
                      className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                          #{m.cardNumber}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <strong className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                              {m.customerName}
                            </strong>
                            {m.village && (
                              <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px]">
                                {m.village}
                              </span>
                            )}
                            {m.isInvited && (
                              <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[9px] font-bold flex items-center gap-0.5">
                                <Check className="w-2.5 h-2.5" /> पाठवले
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {m.hasValidPhone ? `+91 ${m.cleanPhone}` : 'फोन नंबर उपलब्ध नाही'}
                          </div>
                        </div>
                      </div>

                      <div>
                        {m.hasValidPhone ? (
                          <button
                            type="button"
                            onClick={() => handleSendInvite(m)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition active:scale-95"
                          >
                            <MessageCircle className="w-3.5 h-3.5 fill-white/20" />
                            <span>{m.isInvited ? 'पुन्हा पाठवा' : 'ग्रुप लिंक पाठवा'}</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">नंबर नाही</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: VCF Bulk Import Solution (The FASTEST way to directly add all to WhatsApp group) */}
        {activeTab === 'vcf-import' && (
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-800 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm sm:text-base font-bold text-indigo-950 dark:text-indigo-200">
                  पद्धत: १-क्लिक मध्ये सर्व कार्डधारक थेट WhatsApp ग्रुपमध्ये कसे जोडावे?
                </h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                WhatsApp च्या सुरक्षेनुसार बाहेरील व्यक्तींना थेट ग्रुपमध्ये ॲड करण्यासाठी ते नंबर तुमच्या फोनच्या कॉन्टॅक्ट्समध्ये असणे आवश्यक असते. खालील १-क्लिक VCF फाईलमुळे तुमचे काम अवघ्या २ मिनिटांत होईल!
              </p>
            </div>

            {/* 3 Step Visual Guide */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                  १
                </div>
                <strong className="block text-slate-900 dark:text-white font-bold">
                  Contacts फाईल डाऊनलोड करा
                </strong>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  खालील निळे बटण दाबून सर्व {totalWithPhone} कार्डधारकांची Contacts (.vcf) फाईल डाऊनलोड करा.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                  २
                </div>
                <strong className="block text-slate-900 dark:text-white font-bold">
                  मोबाईलमध्ये सेव्ह करा
                </strong>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  मोबाईलमध्ये ती फाईल उघडून "Import All Contacts" वर टॅप करा. सर्व ग्राहक "साई कार्ड" नावाने सेव्ह होतील.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                  ३
                </div>
                <strong className="block text-slate-900 dark:text-white font-bold">
                  WhatsApp Group मध्ये Add करा
                </strong>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  WhatsApp ग्रुप उघडा &gt; "Add Participants" &gt; "साई कार्ड" शोधून सर्वांना एकाच वेळी जोडा!
                </p>
              </div>
            </div>

            {/* Big Download Button */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={handleDownloadVcf}
                className="px-6 py-3.5 bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2.5 mx-auto cursor-pointer transition active:scale-95"
              >
                <Download className="w-5 h-5" />
                <span>सर्व {totalWithPhone} कार्डधारक Contacts (.vcf) डाऊनलोड करा</span>
              </button>
              <p className="text-[11px] text-slate-400 mt-2">
                सर्व फोन (Android / iPhone / Samsung) मध्ये ही फाईल १ सेकंदात सेव्ह होते.
              </p>
            </div>
          </div>
        )}

        {/* Tab 3: QR Code & Showroom Poster */}
        {activeTab === 'qr' && (
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-center">
            <div className="max-w-md mx-auto bg-slate-50 dark:bg-slate-800/60 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-4 shadow-xs">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-emerald-600">
                  श्री साई एंटरप्रायझेस • वर्धा
                </span>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
                  ३०-महिने बचत व लकी ड्रॉ अधिकृत WhatsApp ग्रुप
                </h3>
                <p className="text-xs text-slate-500">
                  ग्राहकाने मोबाईल कॅमेऱ्याने QR स्कॅन करताच ते थेट ग्रुपमध्ये सामील होतील
                </p>
              </div>

              {/* Scannable QR Image */}
              <div className="bg-white p-4 rounded-2xl inline-block shadow-md border border-slate-200">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(groupLink)}`}
                  alt="WhatsApp Group QR"
                  className="w-48 h-48 mx-auto"
                />
              </div>

              <div className="space-y-1">
                <p className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 truncate max-w-xs mx-auto">
                  {groupLink}
                </p>
                <p className="text-[11px] text-slate-400">
                  हा QR कोड दुकानाच्या काउंटरवर किंवा पावतीवर लावू शकता.
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => window.open(groupLink, '_blank')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>ग्रुप तपासा</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedLink ? 'कॉपी झाली!' : 'लिंक कॉपी'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
