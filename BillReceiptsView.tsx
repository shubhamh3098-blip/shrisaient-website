import React, { useState } from 'react';
import {
  Receipt,
  Search,
  Printer,
  Plus,
  Calendar,
  CreditCard,
  Phone,
  CheckCircle2,
  Share2,
  Download,
  Edit3
} from 'lucide-react';
import { BillReceipt, StoreData } from '../../types';
import { EditReceiptModal } from './EditReceiptModal';

interface BillReceiptsViewProps {
  storeData: StoreData;
  onOpenFastPaymentModal: () => void;
  onPrintReceipt: (receipt: BillReceipt) => void;
  onRefreshData?: () => void;
}

export const BillReceiptsView: React.FC<BillReceiptsViewProps> = ({
  storeData,
  onOpenFastPaymentModal,
  onPrintReceipt,
  onRefreshData,
}) => {
  const [search, setSearch] = useState('');
  const [modeFilter, setModeFilter] = useState<string>('All');
  const [editingReceipt, setEditingReceipt] = useState<BillReceipt | null>(null);

  const filteredReceipts = storeData.billReceipts.filter((r) => {
    const matchesSearch =
      !search ||
      String(r.receiptNo).includes(search) ||
      r.customerName.toLowerCase().includes(search.toLowerCase()) ||
      (r.invoiceNo && r.invoiceNo.toLowerCase().includes(search.toLowerCase())) ||
      (r.remarks && r.remarks.toLowerCase().includes(search.toLowerCase()));

    const matchesMode = modeFilter === 'All' || r.paymentMode === modeFilter;
    return matchesSearch && matchesMode;
  });

  const totalReceiptsAmount = storeData.billReceipts.reduce((acc, r) => acc + r.amountPaid, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-teal-400" />
            <span>जमा पावत्या नोंदवही (Bill Receipts #1079+)</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            ग्राहकांच्या उधारी खात्यातील थेट रोख, UPI, चेक व कार्ड द्वारे जमा झालेल्या पावत्यांचा अधिकृत संग्रह.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition border border-slate-700"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>प्रिंट रिपोर्ट</span>
          </button>

          <button
            onClick={onOpenFastPaymentModal}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-md shadow-emerald-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>नवीन पावती फाडा (New Receipt)</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="text-xs text-slate-400 font-medium">एकूण जमा पावत्या (Total Receipts)</div>
          <div className="text-2xl font-bold text-white mt-1">
            {Math.max(1079, storeData.billReceipts.length).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">सिरीयल #1079 पासून सुरू</div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="text-xs text-slate-400 font-medium">एकूण जमा रक्कम (Total Amount Collected)</div>
          <div className="text-2xl font-bold text-teal-400 mt-1">
            ₹{totalReceiptsAmount.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">पावत्यांद्वारे खात्यात जमा</div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="text-xs text-slate-400 font-medium">पुढील पावती नंबर (Next Sequence)</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">
            #{storeData.settings.nextReceiptNo || 1080}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">ऑटोमॅटिक अनुक्रम</div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search receipt number, customer name, invoice ref..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
          {['All', 'Cash', 'UPI', 'Cheque', 'Card'].map((m) => (
            <button
              key={m}
              onClick={() => setModeFilter(m)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                modeFilter === m ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {m}
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
                <th className="py-3.5 px-4">पावती क्र. व तारीख</th>
                <th className="py-3.5 px-4">ग्राहक नाव</th>
                <th className="py-3.5 px-4">भरणा प्रकार</th>
                <th className="py-3.5 px-4">बिलाचा संदर्भ / शेरा</th>
                <th className="py-3.5 px-4 text-right">जमा रक्कम</th>
                <th className="py-3.5 px-4">हँडल्ड बाय</th>
                <th className="py-3.5 px-4 text-center">क्रिया</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredReceipts.map((r) => (
                <tr key={r.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4">
                    <div className="font-bold text-teal-400 font-mono">#{r.receiptNo}</div>
                    <div className="text-[11px] text-slate-400">
                      {new Date(r.date).toLocaleDateString('en-IN')}
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-bold text-white">{r.customerName}</div>
                  </td>

                  <td className="py-3 px-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      {r.paymentMode}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-slate-400 max-w-xs truncate">
                    {r.invoiceNo && <span className="text-blue-400 font-mono mr-1.5">[{r.invoiceNo}]</span>}
                    {r.remarks || 'Account balance collection'}
                  </td>

                  <td className="py-3 px-4 text-right font-bold text-emerald-400 text-sm">
                    +₹{r.amountPaid.toLocaleString('en-IN')}
                  </td>

                  <td className="py-3 px-4 text-slate-400 text-[11px]">
                    {r.handledBy}
                  </td>

                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => setEditingReceipt(r)}
                        className="p-1.5 bg-slate-800 hover:bg-teal-600/30 text-teal-400 hover:text-teal-300 rounded-lg transition border border-slate-700/80 cursor-pointer"
                        title="पावती दुरुस्त करा (Edit Receipt)"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onPrintReceipt(r)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition border border-slate-700/80 cursor-pointer"
                        title="Print Official Receipt"
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

      {/* Edit Receipt Modal */}
      {editingReceipt && (
        <EditReceiptModal
          receipt={editingReceipt}
          storeData={storeData}
          isOpen={true}
          onClose={() => setEditingReceipt(null)}
          onRefreshData={() => {
            if (onRefreshData) onRefreshData();
          }}
        />
      )}
    </div>
  );
};
