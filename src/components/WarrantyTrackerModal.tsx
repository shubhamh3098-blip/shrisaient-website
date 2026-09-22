import React, { useState } from 'react';
import {
  ShieldAlert,
  Search,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Phone,
  FileText,
  Printer,
  Share2,
  X,
  Plus
} from 'lucide-react';
import { TransactionEntry, BusinessSettings } from '../types';

interface WarrantyTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: TransactionEntry[];
  settings: BusinessSettings;
}

interface WarrantyItemRecord {
  billNo: string;
  date: string;
  customerName: string;
  customerPhone?: string;
  village?: string;
  productName: string;
  modelNo?: string;
  serialNo?: string;
  warrantyMonths: number;
  expiryDate: string;
  daysRemaining: number;
  isExpired: boolean;
  isExpiringSoon: boolean;
}

export const WarrantyTrackerModal: React.FC<WarrantyTrackerModalProps> = ({
  isOpen,
  onClose,
  transactions,
  settings,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'active' | 'expiring' | 'expired'>('all');

  // Compute warranties from transactions
  const warrantyRecords: WarrantyItemRecord[] = React.useMemo(() => {
    const list: WarrantyItemRecord[] = [];
    const now = new Date();

    transactions.forEach((tx) => {
      // Determine warranty period: if set on tx, use it; otherwise default 12 months for electronics/appliances
      const months = tx.warrantyMonths || 12;
      const txDate = tx.date ? new Date(tx.date) : new Date();
      const expiry = new Date(txDate);
      expiry.setMonth(expiry.getMonth() + months);

      const diffTime = expiry.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const isExpired = diffDays < 0;
      const isExpiringSoon = diffDays >= 0 && diffDays <= 30;

      // Extract products: if line items exist, iterate; otherwise use tx details
      if (tx.lineItems && tx.lineItems.length > 0) {
        tx.lineItems.forEach((li) => {
          list.push({
            billNo: tx.invoiceNo,
            date: tx.date,
            customerName: tx.customerName,
            customerPhone: tx.customerPhone,
            village: tx.village,
            productName: li.description || tx.itemDetails || 'Electronics / Furniture Item',
            modelNo: li.modelNo || tx.modelNo,
            serialNo: li.serialNo || tx.serialNo,
            warrantyMonths: months,
            expiryDate: expiry.toISOString().split('T')[0],
            daysRemaining: diffDays,
            isExpired,
            isExpiringSoon,
          });
        });
      } else {
        list.push({
          billNo: tx.invoiceNo,
          date: tx.date,
          customerName: tx.customerName,
          customerPhone: tx.customerPhone,
          village: tx.village,
          productName: tx.itemDetails || 'Electronics / Furniture Item',
          modelNo: tx.modelNo,
          serialNo: tx.serialNo,
          warrantyMonths: months,
          expiryDate: expiry.toISOString().split('T')[0],
          daysRemaining: diffDays,
          isExpired,
          isExpiringSoon,
        });
      }
    });

    return list.sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [transactions]);

  const filteredRecords = warrantyRecords.filter((rec) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      rec.customerName.toLowerCase().includes(q) ||
      rec.billNo.toLowerCase().includes(q) ||
      rec.productName.toLowerCase().includes(q) ||
      (rec.serialNo && rec.serialNo.toLowerCase().includes(q)) ||
      (rec.modelNo && rec.modelNo.toLowerCase().includes(q)) ||
      (rec.village && rec.village.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (filterType === 'active') return !rec.isExpired;
    if (filterType === 'expiring') return rec.isExpiringSoon;
    if (filterType === 'expired') return rec.isExpired;
    return true;
  });

  const handleShareWarranty = (rec: WarrantyItemRecord) => {
    const text = encodeURIComponent(
      `*${settings.businessName || 'SHRI SAI ENTERPRISES, WARDHA'}*\n` +
      `*🛡️ उत्पादन वॉरंटी प्रमाणपत्र (Product Warranty Details)*\n` +
      `--------------------------------\n` +
      `ग्राहक: *${rec.customerName}*\n` +
      `बिल नंबर: *#${rec.billNo}*\n` +
      `खरेदी तारीख: *${rec.date}*\n` +
      `--------------------------------\n` +
      `वस्तू: *${rec.productName}*\n` +
      (rec.modelNo ? `मॉडेल क्र.: ${rec.modelNo}\n` : '') +
      (rec.serialNo ? `अनुक्रमांक (Serial No): *${rec.serialNo}*\n` : '') +
      `वॉरंटी कालावधी: *${rec.warrantyMonths} महिने*\n` +
      `वॉरंटी समाप्ती तारीख: *${rec.expiryDate}*\n` +
      `स्थिती (Status): *${rec.isExpired ? '❌ मुदत संपली (Expired)' : `✅ वैध (${rec.daysRemaining} दिवस बाकी)`}*\n` +
      `--------------------------------\n` +
      `⚠️ *महत्त्वाची नोंद:*\n${settings.warrantyDisclaimer || 'वॉरंटी ही संबंधित मॅन्युफॅक्चरर कंपनीची असून कंपनीच्या अधिकृत सर्व्हिस सेंटरकडून मोफत दुरुस्ती दिली जाते.'}\n\n` +
      `📞 संपर्क: 8766486915 / 8600122798\n` +
      `_श्री साई इंटरप्राइजेस, आर्वी रोड, पंजाब कॉलनी, वर्धा_`
    );
    const phone = rec.customerPhone ? rec.customerPhone.replace(/[^0-9]/g, '') : '';
    const url = phone ? `https://wa.me/91${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Top Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-md">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                वॉरंटी व सिरीयल नंबर ट्रॅकर (Warranty & Serial No Tracker)
              </h2>
              <p className="text-xs text-slate-400">
                इलेक्ट्रॉनिक्स व फर्निचर वॉरंटी समाप्ती अलर्ट, सिरीयल नंबर शोध व १-क्लिक वॉरंटी WhatsApp पावती
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ग्राहक नाव, बिल क्र., वस्तू, मॉडेल किंवा सिरीयल नंबरने शोधा..."
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
              {(['all', 'active', 'expiring', 'expired'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setFilterType(mode)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                    filterType === mode
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {mode === 'all' && `सर्व (${warrantyRecords.length})`}
                  {mode === 'active' && `चालू (${warrantyRecords.filter(r => !r.isExpired).length})`}
                  {mode === 'expiring' && `३० दिवसात संपत आहे (${warrantyRecords.filter(r => r.isExpiringSoon).length})`}
                  {mode === 'expired' && `समाप्त (${warrantyRecords.filter(r => r.isExpired).length})`}
                </button>
              ))}
            </div>
          </div>

          {/* List of Warranties */}
          <div className="space-y-2.5">
            {filteredRecords.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800 text-slate-400 text-xs">
                कोणतीही वॉरंटी नोंदी आढळली नाही. बिलामध्ये सिरीयल नंबर व वॉरंटी नमूद केल्यास इथे आपोआप दिसेल.
              </div>
            ) : (
              filteredRecords.map((rec, i) => (
                <div
                  key={`${rec.billNo}-${i}`}
                  className="p-3.5 bg-slate-950/50 hover:bg-slate-800/40 border border-slate-800 rounded-2xl transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-sm">{rec.productName}</span>
                      <span className="font-mono font-bold text-blue-400">बिल #{rec.billNo}</span>
                      {rec.isExpired ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-400 border border-rose-800">
                          वॉरंटी संपली (Expired)
                        </span>
                      ) : rec.isExpiringSoon ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800 animate-pulse">
                          ⚠️ {rec.daysRemaining} दिवस शिल्लक
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                          ✓ {rec.daysRemaining} दिवस वैध
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-slate-400 text-[11px] mt-1 flex-wrap">
                      <span>👤 {rec.customerName}</span>
                      {rec.customerPhone && <span>📞 {rec.customerPhone}</span>}
                      {rec.village && <span>📍 {rec.village}</span>}
                      <span>📅 खरेदी: {rec.date}</span>
                      <span>🛡️ समाप्ती: <strong className="text-slate-200">{rec.expiryDate}</strong> ({rec.warrantyMonths} महिने)</span>
                    </div>

                    {(rec.serialNo || rec.modelNo) && (
                      <div className="flex items-center gap-3 text-[11px] font-mono mt-1 text-amber-300">
                        {rec.modelNo && <span>Mod: {rec.modelNo}</span>}
                        {rec.serialNo && <span>Sr: {rec.serialNo}</span>}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleShareWarranty(rec)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-900/40 hover:bg-emerald-900/70 text-emerald-300 border border-emerald-700 font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>WhatsApp पावती</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
