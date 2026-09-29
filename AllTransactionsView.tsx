import React, { useState } from 'react';
import {
  FileText,
  Search,
  Printer,
  Calendar,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Share2,
  Download,
  Edit3
} from 'lucide-react';
import { StoreData, Transaction } from '../../types';
import { EditTransactionModal } from './EditTransactionModal';

interface AllTransactionsViewProps {
  storeData: StoreData;
  onPrintInvoice: (tx: Transaction) => void;
  onRefreshData?: () => void;
}

export const AllTransactionsView: React.FC<AllTransactionsViewProps> = ({
  storeData,
  onPrintInvoice,
  onRefreshData,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Paid' | 'Partial' | 'Unpaid'>('All');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const filteredTransactions = storeData.transactions.filter((tx) => {
    const matchesSearch =
      !search ||
      tx.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
      tx.customerName.toLowerCase().includes(search.toLowerCase()) ||
      tx.customerPhone.includes(search) ||
      (tx.customerAddress && tx.customerAddress.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'All' || tx.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalSalesVal = storeData.transactions.reduce((acc, t) => acc + t.grandTotal, 0);
  const totalPaidVal = storeData.transactions.reduce((acc, t) => acc + t.paidAmount, 0);
  const totalDueVal = storeData.transactions.reduce((acc, t) => acc + t.balanceDue, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-400" />
            <span>विक्री बिले व सर्व व्यवहार (All Transactions #1079)</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            शोरूममधील सर्व पक्के विक्री बिले, उधारी आणि पेमेंट पावत्यांचा संपूर्ण इतिहास.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-2 transition cursor-pointer self-start sm:self-auto border border-slate-700"
        >
          <Printer className="w-4 h-4" />
          <span>प्रिंट रिपोर्ट</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="text-xs text-slate-400 font-medium">एकूण विक्री (Total Sales)</div>
          <div className="text-2xl font-bold text-white mt-1">
            ₹{totalSalesVal.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">{storeData.transactions.length} बिले जारी</div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="text-xs text-slate-400 font-medium">एकूण रोख भरणा (Total Received)</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            ₹{totalPaidVal.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">जमा झालेले पैसे</div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="text-xs text-slate-400 font-medium">बाकी उधारी (Pending Dues)</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">
            ₹{totalDueVal.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">ग्राहकांकडून येणे बाकी</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice number, customer name, phone..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
          {(['All', 'Paid', 'Partial', 'Unpaid'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                statusFilter === s ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">बिल क्र. व तारीख</th>
                <th className="py-3.5 px-4">ग्राहक नाव व गाव</th>
                <th className="py-3.5 px-4">वस्तू / आयटम्स</th>
                <th className="py-3.5 px-4 text-right">एकूण बिल</th>
                <th className="py-3.5 px-4 text-right">जमा</th>
                <th className="py-3.5 px-4 text-right">बाकी</th>
                <th className="py-3.5 px-4 text-center">स्थिती</th>
                <th className="py-3.5 px-4 text-center">क्रिया</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4">
                    <div className="font-bold text-white font-mono">{tx.invoiceNo}</div>
                    <div className="text-[11px] text-slate-400">
                      {new Date(tx.date).toLocaleDateString('en-IN')}
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-bold text-white">{tx.customerName}</div>
                    <div className="text-[11px] text-slate-400">
                      📍 {tx.customerAddress || 'Wardha'} {tx.customerPhone !== '0' && `• ${tx.customerPhone}`}
                    </div>
                  </td>

                  <td className="py-3 px-4 max-w-xs truncate">
                    {tx.items.map((i) => i.name).join(', ')}
                  </td>

                  <td className="py-3 px-4 text-right font-bold text-white">
                    ₹{tx.grandTotal.toLocaleString('en-IN')}
                  </td>

                  <td className="py-3 px-4 text-right font-semibold text-emerald-400">
                    ₹{tx.paidAmount.toLocaleString('en-IN')}
                  </td>

                  <td className="py-3 px-4 text-right font-semibold text-amber-400">
                    {tx.balanceDue > 0 ? `₹${tx.balanceDue.toLocaleString('en-IN')}` : '₹0'}
                  </td>

                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        tx.status === 'Paid'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : tx.status === 'Partial'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {tx.status}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => setEditingTransaction(tx)}
                        className="p-1.5 bg-slate-800 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 rounded-lg transition border border-slate-700/80 cursor-pointer"
                        title="बिल एडिट करा (Edit Invoice)"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onPrintInvoice(tx)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition border border-slate-700/80 cursor-pointer"
                        title="Print Invoice"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Invoice Modal */}
      {editingTransaction && (
        <EditTransactionModal
          transaction={editingTransaction}
          storeData={storeData}
          isOpen={true}
          onClose={() => setEditingTransaction(null)}
          onRefreshData={() => {
            if (onRefreshData) onRefreshData();
          }}
        />
      )}
    </div>
  );
};
