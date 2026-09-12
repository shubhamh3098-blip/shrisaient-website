import React from 'react';
import { Share2, Printer, MapPin, FileText, CheckCircle2, X } from 'lucide-react';
import { CardMember, CardTransaction, BusinessSettings } from '../types';

interface CardPassbookModalProps {
  member: CardMember;
  transactions: CardTransaction[];
  settings: BusinessSettings;
  onClose: () => void;
}

export const CardPassbookModal: React.FC<CardPassbookModalProps> = ({
  member,
  transactions,
  settings,
  onClose,
}) => {
  const memberTransactions = transactions
    .filter(
      (t) =>
        t.cardNumber === member.cardNumber &&
        t.schemeId === member.schemeId
    )
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const handleShareWhatsApp = () => {
    const passbookUrl = `${window.location.origin}/?passbook=${member.cardNumber}`;
    const text = encodeURIComponent(
      `*${settings.businessName}*\n` +
      `*Card Scheme Passbook / Ledger*\n` +
      `--------------------------------\n` +
      `Member: *${member.customerName}*\n` +
      `Card No: *#${member.cardNumber}* (${member.schemeName})\n` +
      (member.village ? `Village: ${member.village}\n` : '') +
      (member.sheetNo ? `Sheet No: ${member.sheetNo}\n` : '') +
      `Registration Fee: ₹50 (Paid)\n` +
      `Total Deposited: ₹${(member.totalDeposited ?? 0).toLocaleString()}\n` +
      `Total Refunded: ₹${(member.totalRefunded ?? 0).toLocaleString()}\n` +
      `*Net Balance in Account: ₹${(member.netBalance ?? 0).toLocaleString()}*\n` +
      `--------------------------------\n` +
      `🔗 Digital Passbook Slip: ${passbookUrl}\n` +
      `Date: ${new Date().toISOString().split('T')[0]}\n` +
      `Shop Address: ${settings.address}`
    );
    const phone = member.phone ? member.phone.replace(/[^0-9]/g, '') : '';
    const url = phone ? `https://wa.me/91${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl my-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-lg bg-blue-600 text-white font-mono font-bold text-sm">
                Card #{member.cardNumber}
              </span>
              <h3 className="font-bold text-slate-900 text-lg">
                {member.customerName}
              </h3>
            </div>
            <div className="text-xs text-slate-500 mt-1 font-medium flex flex-wrap items-center gap-2">
              <span>{member.schemeName}</span>
              {member.phone && <span>• Phone: {member.phone}</span>}
              {member.village && (
                <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-semibold text-[11px] border border-emerald-200 inline-flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {member.village}
                </span>
              )}
              {member.sheetNo && (
                <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-semibold text-[11px] border border-blue-200 font-mono inline-flex items-center gap-1">
                  <FileText className="w-3 h-3" /> Sheet #{member.sheetNo}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Joined: {member.joiningDate} • Opening Fee: ₹50 (Paid)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShareWhatsApp}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              WhatsApp
            </button>
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-800 font-bold cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Balances Banner */}
        <div className="grid grid-cols-3 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
          <div>
            <span className="text-slate-500 block text-[11px]">Total Deposited</span>
            <span className="text-base font-bold text-emerald-700">
              ₹{(member.totalDeposited ?? 0).toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Total Refunded</span>
            <span className="text-base font-bold text-rose-700">
              ₹{(member.totalRefunded ?? 0).toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Current Net Balance</span>
            <span className="text-base font-bold text-blue-700">
              ₹{(member.netBalance ?? 0).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Card Transactions Timeline / Ledger */}
        <div>
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Card Passbook & Transaction Ledger
          </h4>
          <div className="border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0">
                <tr>
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5">Receipt / Type</th>
                  <th className="p-2.5">Particulars / Note</th>
                  <th className="p-2.5 text-right">Debit (Refund)</th>
                  <th className="p-2.5 text-right">Credit (Deposit)</th>
                  <th className="p-2.5 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {memberTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50">
                    <td className="p-2.5 font-mono text-[11px] text-slate-600">{tx.date}</td>
                    <td className="p-2.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          tx.type === 'WeeklyPayment'
                            ? 'bg-emerald-100 text-emerald-800'
                            : tx.type === 'Refund'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {tx.type === 'WeeklyPayment'
                          ? `Week ${tx.weekNumber || ''}`
                          : tx.type === 'Refund'
                          ? 'Refund / Return'
                          : 'Card Fee'}
                      </span>
                      <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                        {tx.receiptNo}
                      </span>
                    </td>
                    <td className="p-2.5 text-slate-700">
                      {tx.remarks ||
                        (tx.type === 'Fee'
                          ? 'Registration & Card opening fee'
                          : tx.type === 'WeeklyPayment'
                          ? 'Weekly Installment'
                          : 'Customer refund')}
                    </td>
                    <td className="p-2.5 text-right font-bold text-rose-600">
                      {tx.type === 'Refund' ? `₹${(tx.amount ?? 0).toLocaleString()}` : '-'}
                    </td>
                    <td className="p-2.5 text-right font-bold text-emerald-600">
                      {tx.type !== 'Refund' ? `₹${(tx.amount ?? 0).toLocaleString()}` : '-'}
                    </td>
                    <td className="p-2.5 text-right font-bold text-slate-900 font-mono">
                      ₹{(tx.balanceAfter ?? 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {memberTransactions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-slate-400">
                      No transaction entries recorded yet. Opening balance: ₹{member.openingAmt || member.netBalance || 0}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 cursor-pointer"
          >
            Close Passbook
          </button>
        </div>
      </div>
    </div>
  );
};
