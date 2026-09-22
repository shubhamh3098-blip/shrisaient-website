import React, { useState, useMemo } from 'react';
import {
  Printer,
  Calendar,
  User,
  MapPin,
  X,
  FileSpreadsheet,
  IndianRupee,
  Share2,
  CheckCircle,
  Filter
} from 'lucide-react';
import { CardMember, CardTransaction, BusinessSettings } from '../types';

interface AgentCollectionSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardMembers: CardMember[];
  cardTransactions?: CardTransaction[];
  settings: BusinessSettings;
  preselectedAgent?: string;
  initialAgent?: string;
  initialVillage?: string;
  initialDate?: string;
}

export const AgentCollectionSheetModal: React.FC<AgentCollectionSheetModalProps> = ({
  isOpen,
  onClose,
  cardMembers,
  cardTransactions = [],
  settings,
  preselectedAgent,
  initialAgent,
  initialVillage,
  initialDate,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    initialDate || new Date().toISOString().split('T')[0]
  );
  const [selectedAgent, setSelectedAgent] = useState<string>(
    initialAgent || preselectedAgent || 'All'
  );
  const [selectedVillage, setSelectedVillage] = useState<string>(
    initialVillage || 'All'
  );

  // Member map for quick lookup
  const memberMap = useMemo(() => {
    const map = new Map<number, CardMember>();
    cardMembers.forEach((m) => {
      map.set(m.cardNumber, m);
    });
    return map;
  }, [cardMembers]);

  // Extract all agents
  const allAgents = useMemo(() => {
    const agents = new Set<string>();
    cardTransactions.forEach((t) => {
      if (t.agentName) agents.add(t.agentName.trim());
    });
    cardMembers.forEach((m) => {
      if (m.agentName) agents.add(m.agentName.trim());
    });
    return Array.from(agents).sort();
  }, [cardTransactions, cardMembers]);

  // Extract all villages
  const allVillages = useMemo(() => {
    const villages = new Set<string>();
    cardMembers.forEach((m) => {
      if (m.village) villages.add(m.village.trim());
    });
    return Array.from(villages).sort();
  }, [cardMembers]);

  // Filter payments on selected date
  const collectionRows = useMemo(() => {
    const rows: Array<{
      receiptNo?: string;
      date: string;
      cardNo: number;
      memberId: string;
      memberName: string;
      village: string;
      phone?: string;
      installmentNo?: number;
      amount: number;
      mode: string;
      collector: string;
      notes?: string;
    }> = [];

    // 1. Check cardTransactions
    cardTransactions.forEach((t) => {
      const txDate = (t.date || '').split('T')[0];
      if (txDate === selectedDate && t.type !== 'Refund') {
        const mem = memberMap.get(t.cardNumber);
        const collector = t.agentName || mem?.agentName || 'दुकान काऊंटर';
        const village = mem?.village || '-';

        const agentMatches =
          selectedAgent === 'All' ||
          collector.toLowerCase() === selectedAgent.toLowerCase();
        const villageMatches =
          selectedVillage === 'All' ||
          village.toLowerCase() === selectedVillage.toLowerCase();

        if (agentMatches && villageMatches) {
          rows.push({
            receiptNo: t.receiptNo || `REC-${t.cardNumber}-${t.weekNumber || '1'}`,
            date: t.date,
            cardNo: t.cardNumber,
            memberId: t.cardId,
            memberName: t.customerName || mem?.customerName || 'सभासद',
            village,
            phone: t.customerPhone || mem?.phone,
            installmentNo: t.weekNumber,
            amount: t.amount,
            mode: t.paymentMode || 'Cash',
            collector,
            notes: t.remarks,
          });
        }
      }
    });

    return rows.sort((a, b) => a.cardNo - b.cardNo);
  }, [cardTransactions, memberMap, selectedDate, selectedAgent, selectedVillage]);

  // Stats
  const totalAmount = useMemo(
    () => collectionRows.reduce((sum, r) => sum + r.amount, 0),
    [collectionRows]
  );
  const totalCash = useMemo(
    () =>
      collectionRows
        .filter((r) => r.mode.toLowerCase() === 'cash' || r.mode.toLowerCase() === 'रोख')
        .reduce((sum, r) => sum + r.amount, 0),
    [collectionRows]
  );
  const totalOnline = totalAmount - totalCash;

  if (!isOpen) return null;

  const handlePrint = () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Daily Collection Sheet - ${selectedDate}</title>
        <style>
          @page { size: A4 portrait; margin: 10mm; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #111; padding: 10px; font-size: 11px; line-height: 1.3; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 10px; }
          .shop-title { font-size: 18px; font-weight: 900; text-transform: uppercase; }
          .sub { font-size: 12px; font-weight: bold; margin-top: 2px; }
          .meta-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 10px; font-size: 12px; font-weight: bold; background: #f1f5f9; padding: 6px 10px; border-radius: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 6px; }
          th, td { border: 1px solid #475569; padding: 5px 6px; text-align: left; }
          th { background: #e2e8f0; font-weight: bold; text-transform: uppercase; font-size: 10px; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .total-box { margin-top: 12px; display: flex; justify-content: space-between; font-size: 13px; font-weight: bold; background: #f8fafc; border: 1px solid #94a3b8; padding: 8px 12px; border-radius: 4px; }
          .sign-box { margin-top: 35px; display: flex; justify-content: space-between; font-size: 12px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="shop-title">${settings.businessName || 'SHRI SAI ENTERPRISES'}</div>
          <div class="sub">दैनिक हप्ता वसुली पत्रक (Daily Collection Beat Sheet)</div>
          <div>मातोश्री सभागृहासमोर, आर्वी रोड, वर्धा • फोन: ${settings.phone || '8766486915'}</div>
        </div>

        <div class="meta-grid">
          <div>तारीख: <u>${selectedDate}</u></div>
          <div>प्रतिनिधी: <u>${selectedAgent === 'All' ? 'सर्व प्रतिनिधी' : selectedAgent}</u></div>
          <div>गाव/विभाग: <u>${selectedVillage === 'All' ? 'सर्व गावे' : selectedVillage}</u></div>
        </div>

        <table>
          <thead>
            <tr>
              <th class="text-center" style="width: 25px;">क्र.</th>
              <th style="width: 65px;">पावती क्र.</th>
              <th style="width: 50px;">कार्ड क्र.</th>
              <th>सभासदाचे नाव</th>
              <th>गाव / पत्ता</th>
              <th class="text-center" style="width: 45px;">हप्ता क्र.</th>
              <th class="text-right" style="width: 65px;">रक्कम (₹)</th>
              <th class="text-center" style="width: 50px;">मोड</th>
              <th style="width: 80px;">सभासद सही</th>
            </tr>
          </thead>
          <tbody>
            ${collectionRows
              .map(
                (r, i) => `
              <tr>
                <td class="text-center">${i + 1}</td>
                <td>${r.receiptNo || '-'}</td>
                <td class="text-center" style="font-weight: bold;">#${r.cardNo}</td>
                <td style="font-weight: 600;">${r.memberName}</td>
                <td>${r.village}</td>
                <td class="text-center">${r.installmentNo ? r.installmentNo : '-'}</td>
                <td class="text-right" style="font-weight: bold;">₹${r.amount.toLocaleString('en-IN')}</td>
                <td class="text-center">${r.mode}</td>
                <td></td>
              </tr>
            `
              )
              .join('')}
            ${
              collectionRows.length === 0
                ? `<tr><td colspan="9" class="text-center" style="padding: 20px;">या तारखेस कोणतीही वसुली नोंद आढळली नाही.</td></tr>`
                : ''
            }
          </tbody>
        </table>

        <div class="total-box">
          <div>एकूण पावत्या: ${collectionRows.length}</div>
          <div>रोख (Cash): ₹${totalCash.toLocaleString('en-IN')}</div>
          <div>ऑनलाईन (Online): ₹${totalOnline.toLocaleString('en-IN')}</div>
          <div>एकूण वसुली जमा: ₹${totalAmount.toLocaleString('en-IN')}</div>
        </div>

        <div class="sign-box">
          <div>प्रतिनिधीची स्वाक्षरी: ___________________</div>
          <div>हिशोब तपासनीस: ___________________</div>
          <div>मालकाची स्वाक्षरी: ___________________</div>
        </div>
      </body>
      </html>
    `;

    try {
      const printWindow = window.open('', '_blank', 'width=900,height=1000');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 400);
        return;
      }
    } catch {
      // Fallback below
    }

    // Fallback if popup is blocked in preview iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);
    const iframeDoc = iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(htmlContent);
      iframeDoc.close();
      iframe.contentWindow?.focus();
      setTimeout(() => {
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-linear-to-r from-blue-700 to-cyan-800 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/15">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">
                एजंटनुसार दैनिक वसुली अहवाल (Daily Collection Beat Sheet)
              </h3>
              <p className="text-xs text-blue-100">
                किशोर बावणे किंवा इतर प्रतिनिधींनी आज कोणत्या गावातून किती हप्ता गोळा केला याचा १-क्लिक Printable अहवाल
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-4 gap-3">
          {/* Date Picker */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
              वसुली दिनांक (Date)
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-hidden"
            />
          </div>

          {/* Agent Selector */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
              प्रतिनिधी / एजंट (Agent)
            </label>
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-hidden"
            >
              <option value="All">सर्व प्रतिनिधी (All)</option>
              {allAgents.map((ag) => (
                <option key={ag} value={ag}>
                  {ag}
                </option>
              ))}
            </select>
          </div>

          {/* Village Selector */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
              गाव / विभाग (Village)
            </label>
            <select
              value={selectedVillage}
              onChange={(e) => setSelectedVillage(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-hidden"
            >
              <option value="All">सर्व गावे (All Villages)</option>
              {allVillages.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          {/* Print Button */}
          <div className="flex items-end">
            <button
              type="button"
              onClick={handlePrint}
              disabled={collectionRows.length === 0}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-sm transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>शीट प्रिंट करा (Print A4)</span>
            </button>
          </div>
        </div>

        {/* Summary Badges */}
        <div className="px-6 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80">
            <div className="text-[10px] text-slate-500 font-bold uppercase">एकूण पावत्या</div>
            <div className="text-lg font-black text-slate-900 dark:text-white">
              {collectionRows.length} <span className="text-xs font-normal">नोंदी</span>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
            <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase">
              एकूण रोख (Cash)
            </div>
            <div className="text-lg font-black text-emerald-800 dark:text-emerald-200">
              ₹ {totalCash.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
            <div className="text-[10px] text-blue-700 dark:text-blue-400 font-bold uppercase">
              ऑनलाईन (UPI/Online)
            </div>
            <div className="text-lg font-black text-blue-800 dark:text-blue-200">
              ₹ {totalOnline.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
            <div className="text-[10px] text-purple-700 dark:text-purple-400 font-bold uppercase">
              एकूण वसुली (Total)
            </div>
            <div className="text-lg font-black text-purple-900 dark:text-purple-200">
              ₹ {totalAmount.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* Table View */}
        <div className="p-4 max-h-[55vh] overflow-y-auto">
          {collectionRows.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Calendar className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="font-bold text-slate-600 dark:text-slate-400">
                {selectedDate} रोजी निवडलेल्या फिल्टरनुसार कोणतीही वसुली झालेली नाही.
              </p>
              <p className="text-xs text-slate-400 mt-1">तारीख किंवा एजंट नाव बदलून पहा.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200">
                <thead className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px]">
                  <tr>
                    <th className="p-2.5 text-center">#</th>
                    <th className="p-2.5">पावती क्र.</th>
                    <th className="p-2.5 text-center">कार्ड क्र.</th>
                    <th className="p-2.5">सभासदाचे नाव</th>
                    <th className="p-2.5">गाव / विभाग</th>
                    <th className="p-2.5 text-center">हप्ता क्र.</th>
                    <th className="p-2.5 text-right">रक्कम (₹)</th>
                    <th className="p-2.5 text-center">मोड</th>
                    <th className="p-2.5">प्रतिनिधी</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {collectionRows.map((r, i) => (
                    <tr
                      key={i}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                    >
                      <td className="p-2.5 text-center text-slate-400">{i + 1}</td>
                      <td className="p-2.5 font-mono text-[11px]">{r.receiptNo}</td>
                      <td className="p-2.5 text-center font-bold text-blue-700 dark:text-blue-400">
                        #{r.cardNo}
                      </td>
                      <td className="p-2.5 font-bold text-slate-900 dark:text-white">
                        {r.memberName}
                      </td>
                      <td className="p-2.5 text-slate-600 dark:text-slate-400">{r.village}</td>
                      <td className="p-2.5 text-center font-semibold">{r.installmentNo || '-'}</td>
                      <td className="p-2.5 text-right font-black font-mono text-slate-900 dark:text-white">
                        ₹ {r.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="p-2.5 text-center">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            r.mode.toLowerCase() === 'cash' || r.mode.toLowerCase() === 'रोख'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          }`}
                        >
                          {r.mode}
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-600 dark:text-slate-400">{r.collector}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
