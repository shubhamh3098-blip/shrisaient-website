import React, { useState, useMemo, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Users,
  Copy,
  Check,
  Share2,
  Printer,
  X,
  Search,
  ExternalLink,
  MessageCircle,
  Sparkles,
  QrCode
} from 'lucide-react';
import { CardMember, BusinessSettings } from '../types';

interface WhatsAppGroupInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardMembers: CardMember[];
  settings: BusinessSettings;
  onUpdateGroupLink?: (newLink: string) => void;
}

export const WhatsAppGroupInviteModal: React.FC<WhatsAppGroupInviteModalProps> = ({
  isOpen,
  onClose,
  cardMembers,
  settings,
  onUpdateGroupLink,
}) => {
  const [groupLink, setGroupLink] = useState(
    settings.whatsappGroupLink && !settings.whatsappGroupLink.includes('/invite')
      ? settings.whatsappGroupLink
      : 'https://chat.whatsapp.com/CLcaeUq1bHH1RE0203oPaP?s=cl&p=a&mlu=4&ilr=4'
  );
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedNumbers, setCopiedNumbers] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  // Extract all valid member mobile numbers
  const allPhones = useMemo(() => {
    const numbers: string[] = [];
    cardMembers.forEach((m) => {
      const clean = (m.phone || '').replace(/[^0-9]/g, '');
      if (clean.length >= 10 && !numbers.includes(clean)) {
        numbers.push(clean);
      }
    });
    return numbers;
  }, [cardMembers]);

  // Generate QR code for WhatsApp Group Link
  useEffect(() => {
    if (!groupLink) return;
    let isMounted = true;
    QRCode.toDataURL(groupLink, {
      width: 400,
      margin: 2,
      color: {
        dark: '#075e54', // WhatsApp brand dark green
        light: '#ffffff',
      },
    })
      .then((url: string) => {
        if (isMounted) setQrCodeUrl(url);
      })
      .catch((err: unknown) => {
        console.error('Error creating group QR:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [groupLink]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(groupLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyAllNumbers = () => {
    const formatted = allPhones.join(', ');
    navigator.clipboard.writeText(formatted);
    setCopiedNumbers(true);
    setTimeout(() => setCopiedNumbers(false), 2500);
  };

  const handleSendInviteToMember = (member: CardMember) => {
    const cleanPhone = (member.phone || '').replace(/[^0-9]/g, '');
    let msg = `*नमस्कार ${member.customerName || 'ग्राहक'} जी,*\n\n`;
    msg += `✨ *श्री साई एंटरप्रायझेस VIP कार्ड सभासद ग्रुप* ✨\n\n`;
    msg += `आपण आमच्या ३०-महिने बचत कार्ड योजनेचे सन्माननीय सभासद आहात (कार्ड क्र. #${member.cardNumber}).\n\n`;
    msg += `दुकान आणि योजनेच्या नवीन सण ऑफर्स, बंपर लकी ड्रॉ, भेटवस्तू आणि मासिक हप्ता अपडेट्स मिळवण्यासाठी खालील लिंकवर टच करून आमच्या WhatsApp ग्रुपमध्ये त्वरित सामील व्हा:\n\n`;
    msg += `👉 *ग्रुप जॉईन लिंक:* ${groupLink}\n\n`;
    msg += `काही अडचण असल्यास संपर्क साधा:\n`;
    msg += `📞 ${settings.phone || '8766486915'} / ${settings.whatsappSecondaryNumber || '8600122798'}\n`;
    msg += `दुकान: श्री साई एंटरप्रायझेस, आर्वी रोड, वर्धा.`;

    const url = cleanPhone
      ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const handlePrintPoster = () => {
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>WhatsApp VIP Group Poster - Shri Sai Enterprises</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body { font-family: 'Segoe UI', Arial, sans-serif; text-align: center; color: #0f172a; padding: 20px; }
          .container { border: 4px solid #16a34a; border-radius: 20px; padding: 30px; background: #ffffff; }
          .logo { font-size: 28px; font-weight: 900; color: #15803d; text-transform: uppercase; letter-spacing: 1px; }
          .sub { font-size: 16px; font-weight: 600; color: #475569; margin-top: 4px; }
          .badge { display: inline-block; background: #dcfce7; color: #166534; font-size: 18px; font-weight: 800; padding: 8px 24px; border-radius: 9999px; margin: 20px 0; border: 2px solid #86efac; }
          .qr-box { margin: 20px auto; padding: 16px; display: inline-block; border: 3px dashed #16a34a; border-radius: 16px; }
          .qr-img { width: 240px; height: 240px; display: block; }
          .instructions { font-size: 18px; font-weight: 700; color: #1e293b; margin: 15px 0 5px 0; }
          .link { font-family: monospace; font-size: 14px; color: #2563eb; margin-top: 5px; }
          .benefits { display: flex; justify-content: space-around; margin: 30px 0; text-align: left; font-size: 14px; font-weight: 600; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; padding: 15px 0; }
          .benefits ul { margin: 0; padding-left: 20px; }
          .footer { font-size: 14px; color: #64748b; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">${settings.businessName || 'SHRI SAI ENTERPRISES'}</div>
          <div class="sub">इलेक्ट्रॉनिक्स, फर्निचर & ३०-महिने कार्ड योजना दालन, आर्वी रोड, वर्धा</div>
          
          <div class="badge">★ अधिकृत VIP कार्ड ग्राहक WhatsApp ग्रुप ★</div>

          <div class="instructions">आपल्या मोबाईल कॅमेऱ्याने खालील QR कोड स्कॅन करा आणि ग्रुपमध्ये जॉईन व्हा:</div>

          <div class="qr-box">
            <img src="${qrCodeUrl}" class="qr-img" alt="WhatsApp Group QR" />
          </div>

          <div class="link">${groupLink}</div>

          <div class="benefits">
            <div>
              <strong>ग्रुपमधील खास फायदे:</strong>
              <ul>
                <li>मासिक हप्ता व लकी ड्रॉ चे थेट निकाल</li>
                <li>दिवाळी, पाडवा व सणांच्या विशेष डिस्काउंट ऑफर्स</li>
              </ul>
            </div>
            <div>
              <strong>ग्राहक मदत:</strong>
              <ul>
                <li>नवीन इलेक्ट्रॉनिक्स व फर्निचरचे घरपोच कॅटलॉग</li>
                <li>घरपोच मोफत डिलिव्हरी अपडेट्स</li>
              </ul>
            </div>
          </div>

          <div class="footer">
            <strong>पत्ता:</strong> मातोश्री सभागृहासमोर, आर्वी रोड, पंजाब कॉलनी, वर्धा • <strong>संपर्क:</strong> ${settings.phone || '8766486915'} / ${settings.whatsappSecondaryNumber || '8600122798'}
          </div>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  };

  const filteredMembers = cardMembers.filter((m) => {
    if (!memberSearch.trim()) return true;
    const q = memberSearch.toLowerCase();
    return (
      (m.customerName && m.customerName.toLowerCase().includes(q)) ||
      (m.phone && m.phone.includes(q)) ||
      (m.cardNumber && String(m.cardNumber).includes(q)) ||
      (m.village && m.village.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-linear-to-r from-emerald-600 to-teal-700 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/15">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">
                कार्ड सभासद WhatsApp VIP ग्रुप मॅनेजर
              </h3>
              <p className="text-xs text-emerald-100">
                ऑटो ग्रुप इन्व्हाईट, बल्क मोबाईल नंबर कॉपी आणि काऊंटर QR कोड पोस्टर
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Group Link Card */}
          <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <label className="text-xs font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>तुमच्या WhatsApp ग्रुपची लिंक:</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintPoster}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>दुकान काऊंटर पोस्टर प्रिंट (QR)</span>
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={groupLink}
                onChange={(e) => {
                  setGroupLink(e.target.value);
                  if (onUpdateGroupLink) onUpdateGroupLink(e.target.value);
                }}
                placeholder="https://chat.whatsapp.com/..."
                className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 text-xs font-mono text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer"
              >
                {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'कॉपी झाली!' : 'लिंक कॉपी'}</span>
              </button>
            </div>
          </div>

          {/* Bulk Copy Card Members Numbers */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>एकूण {allPhones.length} सभासदांचे मोबाईल नंबर्स उपलब्ध</span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  सर्व सभासदांचे नंबर एका क्लिकवर कॉपी करा आणि WhatsApp ब्रॉडकास्ट किंवा ग्रुपमध्ये पेस्ट करा.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCopyAllNumbers}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition cursor-pointer"
              >
                {copiedNumbers ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedNumbers ? 'सर्व नंबर्स कॉपी झाले!' : 'सर्व नंबर्स कॉपी करा'}</span>
              </button>
            </div>
          </div>

          {/* Member List with 1-Click WhatsApp Invite Button */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                सभासदांना वैयक्तिक इन्व्हाईट पाठवा ({filteredMembers.length})
              </h4>
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  placeholder="नाव, कार्ड क्र. किंवा मोबाईल शोधा..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-hidden"
                />
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl">
              {filteredMembers.slice(0, 50).map((member) => (
                <div
                  key={member.id}
                  className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        {member.customerName}
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-700 text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300">
                        #{member.cardNumber}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {member.phone || 'मोबाईल नाही'} {member.village && `• ${member.village}`}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSendInviteToMember(member)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs transition"
                  >
                    <Share2 className="w-3 h-3" />
                    <span>इन्व्हाईट पाठवा</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
