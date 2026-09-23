import React, { useState, useMemo } from 'react';
import { 
  X, 
  MessageCircle, 
  Search, 
  Filter, 
  AlertCircle, 
  CheckCircle2, 
  Send, 
  Phone, 
  CreditCard, 
  Calendar,
  Share2,
  Copy,
  Check
} from 'lucide-react';
import { CardMember, CardSchemeConfig } from '../types';
import { getSafeWhatsAppUrl } from '../utils/numbering';

interface CardDueRemindersModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardMembers: CardMember[];
  schemesConfig: CardSchemeConfig[];
  businessPhone: string;
}

export const CardDueRemindersModal: React.FC<CardDueRemindersModalProps> = ({
  isOpen,
  onClose,
  cardMembers,
  schemesConfig,
  businessPhone = '8766486915',
}) => {
  const [selectedScheme, setSelectedScheme] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  // Extract unique agents
  const agents = useMemo(() => {
    const set = new Set<string>();
    cardMembers.forEach((m) => {
      if (m.agentName && m.agentName.trim()) set.add(m.agentName.trim());
    });
    return Array.from(set).sort();
  }, [cardMembers]);

  // Calculate pending dues for active members
  // 30-month scheme = 130 weeks. Expected deposit approx ₹200-₹500/week or simple weekly installment check.
  // We check members whose deposit is lagging or last payment was not this week.
  const dueMembers = useMemo(() => {
    return cardMembers
      .filter((m) => m.status === 'Active')
      .map((member) => {
        // Calculate weeks since joining
        const joinDate = member.joiningDate ? new Date(member.joiningDate) : new Date('2026-01-01');
        const now = new Date();
        const diffDays = Math.max(1, Math.floor((now.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24)));
        const elapsedWeeks = Math.min(130, Math.max(1, Math.ceil(diffDays / 7)));
        
        // Standard weekly installment baseline: ₹200 (or ₹300 for higher schemes)
        const weeklyRate = member.schemeId === 'scheme3' || member.schemeId === 'scheme4' ? 300 : 200;
        const expectedDeposit = elapsedWeeks * weeklyRate;
        const currentDeposit = Number(member.totalDeposited || 0);
        const estimatedDue = Math.max(0, expectedDeposit - currentDeposit);
        
        // Even if caught up, weekly reminder for current week is ₹weeklyRate
        const weeklyDueAmount = estimatedDue > 0 ? estimatedDue : weeklyRate;
        
        return {
          ...member,
          elapsedWeeks,
          weeklyRate,
          estimatedDue: weeklyDueAmount,
          hasBacklog: estimatedDue > 0,
        };
      })
      .filter((m) => {
        if (selectedScheme !== 'all' && m.schemeId !== selectedScheme) return false;
        if (selectedAgent !== 'all' && m.agentName !== selectedAgent) return false;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const matchName = m.customerName.toLowerCase().includes(q);
          const matchCard = String(m.cardNumber).includes(q);
          const matchPhone = (m.phone || '').includes(q);
          const matchVillage = (m.village || '').toLowerCase().includes(q);
          if (!matchName && !matchCard && !matchPhone && !matchVillage) return false;
        }
        return true;
      });
  }, [cardMembers, selectedScheme, selectedAgent, searchQuery]);

  if (!isOpen) return null;

  const generateWhatsAppUrl = (member: typeof dueMembers[0]) => {
    const message = 
`🚩 *श्री साई इंटरप्राइजेस, वर्धा* 🚩
(३०-महिने साप्ताहिक बचत कार्ड योजना दालन)

नमस्कार *${member.customerName}* जी,
आपल्या *${member.schemeName || 'साप्ताहिक बचत योजना'}* अंतर्गत कार्ड नंबर: *${member.cardNumber}* चा साप्ताहिक हप्ता भरणा करणे बाकी आहे.

📊 *खाते तपशील:*
• कार्ड नंबर: *#${member.cardNumber}*
• आतापर्यंत एकूण जमा: *₹${(member.totalDeposited || 0).toLocaleString('en-IN')}*
• देय हप्ता रक्कम: *₹${member.estimatedDue.toLocaleString('en-IN')}*
• एजंट / प्रतिनिधी: ${member.agentName || 'दुकान काउंटर'}

💳 *घरबसल्या त्वरित UPI ने भरा:*
UPI ID: *${businessPhone}@upi* (PhonePe / Google Pay / Paytm)
रक्कम भरून स्क्रिनशॉट याच नंबरवर पाठवावा.

📍 *पत्ता:* मातोश्री सभागृह समोर, आर्वी रोड, पंजाब कॉलनी, वर्धा.
📞 *संपर्क:* ${businessPhone}`;

    return getSafeWhatsAppUrl(member.phone, message);
  };

  const handleCopyMessage = (member: typeof dueMembers[0]) => {
    const message = 
`श्री साई इंटरप्राइजेस, वर्धा: नमस्कार ${member.customerName} जी, आपल्या कार्ड क्र. #${member.cardNumber} चा साप्ताहिक हप्ता ₹${member.estimatedDue} बाकी आहे. UPI ID: ${businessPhone}@upi वर भरणा करून पावती मिळवा. संपर्क: ${businessPhone}`;
    navigator.clipboard?.writeText(message);
    setCopiedId(member.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyAllDues = () => {
    const lines = dueMembers.map((m, idx) => 
      `${idx + 1}. कार्ड #${m.cardNumber} | ${m.customerName} | मो: ${m.phone} | बाकी: ₹${m.estimatedDue} | एजंट: ${m.agentName || '-'}`
    );
    const text = `📋 श्री साई इंटरप्राइजेस - साप्ताहिक हप्ता वसुली यादी (${new Date().toLocaleDateString('mr-IN')}):\n\n` + lines.join('\n');
    navigator.clipboard?.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs no-print">
      <div className="bg-white dark:bg-[#0F172A] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-white font-bold">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                स्वयंचलित WhatsApp हप्ता रिमाइंडर्स (1-Click Due Reminders)
              </h2>
              <p className="text-xs text-emerald-100">
                साप्ताहिक बचत योजनेतील शिल्लक हप्ते भरण्यासाठी थेट ग्राहकांना मेसेज पाठवा
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters & Actions Bar */}
        <div className="p-3 sm:p-4 bg-slate-50 dark:bg-[#15213b] border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="नाव, कार्ड नंबर, मोबाईल नंबर शोधा..."
                className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Scheme Filter */}
            <select
              value={selectedScheme}
              onChange={(e) => setSelectedScheme(e.target.value)}
              className="text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white py-1.5 px-2.5 focus:outline-none cursor-pointer"
            >
              <option value="all">सर्व योजना (All Schemes)</option>
              {schemesConfig.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            {/* Agent Filter */}
            {agents.length > 0 && (
              <select
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                className="text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white py-1.5 px-2.5 focus:outline-none cursor-pointer hidden md:block"
              >
                <option value="all">सर्व एजंट (All Agents)</option>
                {agents.map((ag) => (
                  <option key={ag} value={ag}>{ag}</option>
                ))}
              </select>
            )}
          </div>

          {/* Quick Copy All Dues for field collection */}
          <button
            type="button"
            onClick={handleCopyAllDues}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 transition shadow-2xs cursor-pointer"
            title="संपूर्ण वसुली यादी कॉपी करा"
          >
            {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
            <span>{copiedAll ? 'यादी कॉपी झाली!' : 'वसुली यादी कॉपी करा'}</span>
          </button>
        </div>

        {/* Member List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5">
          {dueMembers.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="font-semibold text-base">सर्व ग्राहकांचे हप्ते अद्ययावत आहेत किंवा कोणताही रेकॉर्ड सापडला नाही.</p>
              <p className="text-xs mt-1">नवीन ग्राहक जोडण्यासाठी किंवा फिल्टर बदलण्यासाठी वरील पर्याय वापरा.</p>
            </div>
          ) : (
            dueMembers.map((member) => (
              <div
                key={member.id}
                className="p-3 sm:p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 hover:border-emerald-500/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
              >
                {/* Left Member Info */}
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex flex-col items-center justify-center shrink-0 border border-emerald-300 dark:border-emerald-800">
                    <span className="text-[9px] uppercase font-bold tracking-tighter">CARD</span>
                    <span className="text-xs font-black leading-none font-mono">#{member.cardNumber}</span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">
                        {member.customerName}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                        {member.schemeName || member.schemeId}
                      </span>
                      {member.village && (
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          • {member.village}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                      <span className="flex items-center gap-1 font-mono">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {member.phone || 'नंबर नाही'}
                      </span>
                      <span>
                        एकूण जमा: <strong className="text-slate-800 dark:text-slate-200 font-mono">₹{(member.totalDeposited || 0).toLocaleString()}</strong>
                      </span>
                      {member.agentName && (
                        <span className="text-slate-500">
                          एजंट: <span className="text-emerald-700 dark:text-emerald-400 font-medium">{member.agentName}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Due & WhatsApp Action */}
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">हप्ता रक्कम</span>
                    <span className="text-base font-extrabold text-amber-700 dark:text-amber-400 font-mono">
                      ₹{member.estimatedDue.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Copy Text */}
                    <button
                      type="button"
                      onClick={() => handleCopyMessage(member)}
                      className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                      title="मेसेज कॉपी करा"
                    >
                      {copiedId === member.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>

                    {/* WhatsApp 1-Click Send */}
                    <a
                      href={generateWhatsAppUrl(member)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4 fill-white" />
                      <span>WhatsApp पाठवा</span>
                    </a>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#15213b] flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 shrink-0">
          <div>
            एकूण ग्राहक: <strong className="text-slate-900 dark:text-white">{dueMembers.length}</strong>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 font-semibold cursor-pointer"
          >
            बंद करा (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
