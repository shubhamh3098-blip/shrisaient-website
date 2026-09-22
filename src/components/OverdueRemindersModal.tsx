import React, { useState, useMemo } from 'react';
import {
  BellRing,
  AlertCircle,
  Share2,
  Printer,
  X,
  Search,
  CheckCircle2,
  Calendar,
  Phone,
  Filter,
  IndianRupee,
  Clock
} from 'lucide-react';
import { CardMember, CardTransaction, BusinessSettings } from '../types';

interface OverdueRemindersModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardMembers: CardMember[];
  cardTransactions?: CardTransaction[];
  settings: BusinessSettings;
}

export const OverdueRemindersModal: React.FC<OverdueRemindersModalProps> = ({
  isOpen,
  onClose,
  cardMembers,
  cardTransactions = [],
  settings,
}) => {
  const [minOverdueCount, setMinOverdueCount] = useState<number>(2);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedVillage, setSelectedVillage] = useState<string>('All');
  const [sentMemberIds, setSentMemberIds] = useState<string[]>([]);

  // Calculate overdue details for each member
  const overdueMembers = useMemo(() => {
    const list: Array<{
      member: CardMember;
      paidInstallments: number;
      totalTargetInstallments: number;
      overdueCount: number;
      installmentAmount: number;
      overdueAmount: number;
      totalPaidAmount: number;
      lastPaymentDate?: string;
    }> = [];

    // Group transactions by cardNumber
    const txByCard = new Map<number, CardTransaction[]>();
    cardTransactions.forEach((t) => {
      const arr = txByCard.get(t.cardNumber) || [];
      arr.push(t);
      txByCard.set(t.cardNumber, arr);
    });

    cardMembers.forEach((m) => {
      const memberTxs = txByCard.get(m.cardNumber) || [];
      const isWeekly = m.schemeId === 'scheme3' || (m.schemeName && m.schemeName.includes('Week'));
      const installmentAmount = isWeekly ? 250 : 1000;
      const totalTargetInstallments = isWeekly ? 52 : 30;

      // Paid count
      const weeklyPayments = memberTxs.filter((t) => t.type === 'WeeklyPayment');
      const paidInstallments =
        weeklyPayments.length > 0
          ? weeklyPayments.length
          : Math.floor((m.totalDeposited || 0) / installmentAmount);

      const totalPaidAmount =
        weeklyPayments.length > 0
          ? weeklyPayments.reduce((s, t) => s + t.amount, 0)
          : m.totalDeposited || 0;

      // Estimate expected installments passed since joiningDate
      let expectedInstallments = 1;
      if (m.joiningDate) {
        const join = new Date(m.joiningDate);
        const now = new Date();
        if (isWeekly) {
          const diffTime = Math.abs(now.getTime() - join.getTime());
          const weeksPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7)) + 1;
          expectedInstallments = Math.max(1, Math.min(totalTargetInstallments, weeksPassed));
        } else {
          const monthsPassed =
            (now.getFullYear() - join.getFullYear()) * 12 +
            (now.getMonth() - join.getMonth()) +
            1;
          expectedInstallments = Math.max(1, Math.min(totalTargetInstallments, monthsPassed));
        }
      } else {
        expectedInstallments = Math.max(paidInstallments + 2, 2);
      }

      const overdueCount = Math.max(0, expectedInstallments - paidInstallments);

      // Last payment date
      const sortedTxs = [...memberTxs].sort((a, b) => b.date.localeCompare(a.date));
      const lastPaymentDate = sortedTxs.length > 0 ? sortedTxs[0].date : undefined;

      if (overdueCount >= minOverdueCount) {
        list.push({
          member: m,
          paidInstallments,
          totalTargetInstallments,
          overdueCount,
          installmentAmount,
          overdueAmount: overdueCount * installmentAmount,
          totalPaidAmount,
          lastPaymentDate,
        });
      }
    });

    return list.sort((a, b) => b.overdueCount - a.overdueCount);
  }, [cardMembers, cardTransactions, minOverdueCount]);

  // Extract villages
  const villages = useMemo(() => {
    const set = new Set<string>();
    cardMembers.forEach((m) => {
      if (m.village) set.add(m.village.trim());
    });
    return Array.from(set).sort();
  }, [cardMembers]);

  // Filtered members
  const filteredList = useMemo(() => {
    return overdueMembers.filter((item) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm.trim() ||
        (item.member.customerName && item.member.customerName.toLowerCase().includes(q)) ||
        (item.member.phone && item.member.phone.includes(q)) ||
        (item.member.cardNumber && String(item.member.cardNumber).includes(q)) ||
        (item.member.village && item.member.village.toLowerCase().includes(q));

      const matchesVillage =
        selectedVillage === 'All' ||
        (item.member.village &&
          item.member.village.toLowerCase() === selectedVillage.toLowerCase());

      return matchesSearch && matchesVillage;
    });
  }, [overdueMembers, searchTerm, selectedVillage]);

  if (!isOpen) return null;

  const handleSendReminder = (item: (typeof overdueMembers)[0]) => {
    const cleanPhone = (item.member.phone || '').replace(/[^0-9]/g, '');

    let msg = `*नमस्कार ${item.member.customerName} जी,*\n\n`;
    msg += `श्री साई एंटरप्रायझेस, वर्धा कडून नम्र आठवण:\n\n`;
    msg += `आपल्या ${item.member.schemeName || 'बचत योजना'} (कार्ड क्र. #${item.member.cardNumber}) चे *${item.overdueCount} हप्ते* (एकूण थकबाकी *₹${item.overdueAmount.toLocaleString('en-IN')}*) प्रलंबित आहेत.\n\n`;
    msg += `योजनेचे लकी ड्रॉ, भेटवस्तू आणि नियमित लाभ चालू राहण्यासाठी कृपया हा हप्ता लवकरात लवकर दुकानात किंवा प्रतिनिधीकडे जमा करावा.\n\n`;
    if (settings.upiId) {
      msg += `📱 *Google Pay / PhonePe द्वारे भरण्यासाठी:*\nUPI ID: *${settings.upiId}*\n\n`;
    }
    msg += `काही अडचण असल्यास कृपया संपर्क साधा:\n`;
    msg += `📞 ${settings.phone || '8766486915'} / ${settings.whatsappSecondaryNumber || '8600122798'}\n\n`;
    msg += `धन्यवाद! - श्री साई एंटरप्रायझेस, मातोश्री सभागृहासमोर, आर्वी रोड, वर्धा.`;

    const url = cleanPhone
      ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;

    window.open(url, '_blank');

    if (!sentMemberIds.includes(item.member.id)) {
      setSentMemberIds((prev) => [...prev, item.member.id]);
    }
  };

  const handlePrintOverdueSheet = () => {
    const printWindow = window.open('', '_blank', 'width=900,height=1000');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Overdue Collection Sheet - Shri Sai Enterprises</title>
        <style>
          @page { size: A4 portrait; margin: 10mm; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #111; padding: 10px; font-size: 11px; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 10px; }
          .title { font-size: 18px; font-weight: 900; text-transform: uppercase; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          th, td { border: 1px solid #334155; padding: 5px 6px; text-align: left; }
          th { background: #f1f5f9; font-weight: bold; font-size: 10px; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .badge { font-weight: bold; color: #b91c1c; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${settings.businessName || 'SHRI SAI ENTERPRISES'}</div>
          <div>प्रलंबित हप्ते वसुली यादी (Overdue Members List) • ${minOverdueCount}+ हप्ते बाकी</div>
          <div>दिनांक: ${new Date().toLocaleDateString('en-IN')} • फोन: ${settings.phone || '8766486915'}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th class="text-center" style="width: 25px;">#</th>
              <th class="text-center" style="width: 50px;">कार्ड क्र.</th>
              <th>सभासदाचे नाव</th>
              <th>गाव / पत्ता</th>
              <th>मोबाईल नंबर</th>
              <th class="text-center" style="width: 60px;">भरलेले हप्ते</th>
              <th class="text-center" style="width: 65px;">थकबाकी हप्ते</th>
              <th class="text-right" style="width: 80px;">थकबाकी रक्कम</th>
              <th style="width: 90px;">वसुली शेरा / सही</th>
            </tr>
          </thead>
          <tbody>
            ${filteredList
              .map(
                (item, idx) => `
              <tr>
                <td class="text-center">${idx + 1}</td>
                <td class="text-center font-bold">#${item.member.cardNumber}</td>
                <td style="font-weight: 600;">${item.member.customerName}</td>
                <td>${item.member.village || '-'}</td>
                <td>${item.member.phone || '-'}</td>
                <td class="text-center">${item.paidInstallments}</td>
                <td class="text-center badge">${item.overdueCount} हप्ते</td>
                <td class="text-right" style="font-weight: bold;">₹${item.overdueAmount.toLocaleString('en-IN')}</td>
                <td></td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  };

  const totalOverdueSum = filteredList.reduce((sum, item) => sum + item.overdueAmount, 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-linear-to-r from-rose-700 to-amber-700 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/15">
              <BellRing className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">
                स्वयंचलित हप्ता आठवण (Automated WhatsApp Payment Reminder)
              </h3>
              <p className="text-xs text-rose-100">
                २ किंवा अधिक हप्ते प्रलंबित असलेल्या सभासदांना एका क्लिकवर आदरपूर्वक WhatsApp स्मरणपत्र पाठवा
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

        {/* Toolbar & Filters */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                थकबाकी निकष (Filter):
              </label>
              <select
                value={minOverdueCount}
                onChange={(e) => setMinOverdueCount(Number(e.target.value))}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100"
              >
                <option value={1}>१ किंवा अधिक हप्ते बाकी (1+ Overdue)</option>
                <option value={2}>२ किंवा अधिक हप्ते बाकी (2+ Overdue)</option>
                <option value={3}>३ किंवा अधिक हप्ते बाकी (3+ Overdue)</option>
                <option value={4}>४ किंवा अधिक हप्ते बाकी (4+ Overdue)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                गाव (Village):
              </label>
              <select
                value={selectedVillage}
                onChange={(e) => setSelectedVillage(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100"
              >
                <option value="All">सर्व गावे (All)</option>
                {villages.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-48 sm:w-56">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                शोध (Search):
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="नाव, कार्ड क्र., मोबाईल..."
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={handlePrintOverdueSheet}
              disabled={filteredList.length === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold shadow-sm transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>वसुली यादी प्रिंट करा</span>
            </button>
          </div>
        </div>

        {/* Summary Counter */}
        <div className="px-6 py-2.5 bg-rose-50 dark:bg-rose-950/20 border-b border-rose-200 dark:border-rose-900 flex flex-wrap items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-rose-900 dark:text-rose-300">
              एकूण {filteredList.length} सभासद थकबाकीमध्ये आढळले.
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-600 dark:text-slate-400">
              पाठवले: {sentMemberIds.length}
            </span>
          </div>
          <div className="font-extrabold text-rose-800 dark:text-rose-300 font-mono text-sm">
            एकूण थकबाकी रक्कम: ₹ {totalOverdueSum.toLocaleString('en-IN')}
          </div>
        </div>

        {/* Members List */}
        <div className="p-4 max-h-[55vh] overflow-y-auto space-y-2">
          {filteredList.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2 opacity-60" />
              <p className="font-bold text-slate-700 dark:text-slate-300">
                अभिनंदन! या निकषात कोणताही प्रलंबित सभासद नाही.
              </p>
              <p className="text-xs text-slate-400 mt-1">सर्व सभासदांचे हप्ते वेळेवर भरलेले आहेत.</p>
            </div>
          ) : (
            filteredList.map((item) => {
              const isSent = sentMemberIds.includes(item.member.id);
              return (
                <div
                  key={item.member.id}
                  className={`p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 transition ${
                    isSent
                      ? 'border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20'
                      : 'border-slate-200 bg-white dark:bg-slate-800/70 hover:border-rose-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400 font-black text-sm flex items-center justify-center font-mono">
                      #{item.member.cardNumber}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {item.member.customerName}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 text-[10px] font-black uppercase">
                          {item.overdueCount} हप्ते बाकी
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {item.member.phone || 'मोबाईल नाही'}
                        </span>
                        {item.member.village && <span>• गाव: {item.member.village}</span>}
                        {item.lastPaymentDate && (
                          <span>• शेवटचा हप्ता: {item.lastPaymentDate}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-[10px] uppercase font-bold text-slate-400">थकबाकी रक्कम</div>
                      <div className="text-base font-black text-rose-600 dark:text-rose-400 font-mono">
                        ₹ {item.overdueAmount.toLocaleString('en-IN')}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSendReminder(item)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>{isSent ? 'पुन्हा पाठवा (Sent)' : 'WhatsApp आठवण पाठवा'}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
