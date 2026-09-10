import React, { useState } from 'react';
import { ShoppingCart, Plus, Calendar, DollarSign, Building2, ExternalLink } from 'lucide-react';
import { PurchaseEntry, Dealer } from '../types';

interface PurchasesViewProps {
  purchases: PurchaseEntry[];
  dealers?: Dealer[];
  onAddPurchase: (purchase: Omit<PurchaseEntry, 'id'>) => void;
  onNavigateDealerLedger?: (dealerName?: string) => void;
}

export const PurchasesView: React.FC<PurchasesViewProps> = ({
  purchases,
  dealers = [],
  onAddPurchase,
  onNavigateDealerLedger,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [supplierName, setSupplierName] = useState('');
  const [billNo, setBillNo] = useState('');
  const [items, setItems] = useState('');
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'Online' | 'Cheque'>('Online');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const totalPurchases = purchases.reduce((acc, p) => acc + p.totalAmount, 0);
  const totalPaid = purchases.reduce((acc, p) => acc + p.paidAmount, 0);
  const totalDueToSuppliers = Math.max(0, totalPurchases - totalPaid);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim() || totalAmount <= 0) return;

    const status =
      paidAmount >= totalAmount
        ? 'Paid'
        : paidAmount > 0
        ? 'Partial'
        : 'Pending';

    onAddPurchase({
      billNo: billNo.trim() || `PUR-${Date.now().toString().slice(-4)}`,
      date,
      supplierName: supplierName.trim(),
      items: items.trim() || 'Raw Materials / Goods',
      totalAmount,
      paidAmount,
      status,
      paymentMode,
    });

    setSupplierName('');
    setBillNo('');
    setItems('');
    setTotalAmount(0);
    setPaidAmount(0);
    setShowModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <ShoppingCart className="w-7 h-7 text-blue-600" />
            Purchases & Supplier Invoices (खरीद व माल आवक)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Keep track of inventory procurement, vendor bills, and supplier payables.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onNavigateDealerLedger && (
            <button
              onClick={() => onNavigateDealerLedger()}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-blue-600" />
              Open Dealer Khata (डीलर लेजर)
            </button>
          )}
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            + Add Purchase Bill
          </button>
        </div>
      </div>

      {/* Auto-Sync Notice Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-blue-900">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse shrink-0"></span>
          <p>
            <strong className="font-semibold text-blue-950">Auto-Synced Dealer Ledgers:</strong> Any purchase entered here (e.g.{' '}
            <span className="font-mono font-semibold bg-white/80 px-1.5 py-0.5 rounded border border-blue-200">
              Manisha Enterprises
            </span>
            ) automatically updates that supplier’s personal ledger and calculates pending balance.
          </p>
        </div>
        {onNavigateDealerLedger && (
          <button
            onClick={() => onNavigateDealerLedger('Manisha Enterprises')}
            className="shrink-0 font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-blue-200 shadow-xs"
          >
            View Manisha Enterprises Khata
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Total Procured Goods</p>
          <p className="text-xl font-bold text-slate-900 mt-1">₹{totalPurchases.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Paid to Suppliers</p>
          <p className="text-xl font-bold text-emerald-600 mt-1">₹{totalPaid.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Pending to Suppliers</p>
          <p className="text-xl font-bold text-amber-600 mt-1">₹{totalDueToSuppliers.toLocaleString()}</p>
        </div>
      </div>

      {/* Purchases Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Bill No / Date</th>
                <th className="py-3 px-4">Supplier / Vendor</th>
                <th className="py-3 px-4">Items Procured</th>
                <th className="py-3 px-4 text-right">Total Bill (₹)</th>
                <th className="py-3 px-4 text-right">Paid (₹)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Mode</th>
                <th className="py-3 px-4 text-center">Dealer Khata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {purchases.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-4">
                    <p className="font-semibold text-slate-900 font-mono">{p.billNo}</p>
                    <p className="text-[11px] text-slate-400">{p.date}</p>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-slate-900 block">{p.supplierName}</span>
                    {p.supplierName.toLowerCase().includes('manisha') && (
                      <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                        Key Supplier
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 max-w-xs truncate">{p.items}</td>
                  <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                    ₹{p.totalAmount.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-right font-semibold text-emerald-600">
                    ₹{p.paidAmount.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.status === 'Paid'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : p.status === 'Partial'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="text-[11px] text-slate-500 font-medium">{p.paymentMode}</span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {onNavigateDealerLedger ? (
                      <button
                        onClick={() => onNavigateDealerLedger(p.supplierName)}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-[11px] transition flex items-center justify-center gap-1 mx-auto cursor-pointer"
                        title={`View ${p.supplierName} ledger`}
                      >
                        <Building2 className="w-3 h-3" />
                        Ledger
                      </button>
                    ) : (
                      <span className="text-slate-400 font-mono text-[11px]">Active</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Record Purchase Bill (खरीद बिल)</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 font-bold">
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Supplier / Dealer Name *
                  </label>
                  <input
                    type="text"
                    required
                    list="dealers-list"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    placeholder="e.g. Manisha Enterprises"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium"
                  />
                  <datalist id="dealers-list">
                    {dealers.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name} ({d.phone || 'Dealer'})
                      </option>
                    ))}
                    <option value="Manisha Enterprises" />
                    <option value="Polycab Distributors Ltd." />
                    <option value="Anchor Switchgear Pvt Ltd" />
                  </datalist>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Automatically files under this dealer’s ledger.
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Supplier Bill No</label>
                  <input
                    type="text"
                    value={billNo}
                    onChange={(e) => setBillNo(e.target.value)}
                    placeholder="e.g. PUR-8823"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Items / Materials Description</label>
                <textarea
                  rows={2}
                  value={items}
                  onChange={(e) => setItems(e.target.value)}
                  placeholder="e.g. 50 bundles copper wire, 20 starter kits"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Total Bill (₹) *</label>
                  <input
                    type="number"
                    required
                    value={totalAmount || ''}
                    onChange={(e) => setTotalAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Paid Now (₹)</label>
                  <input
                    type="number"
                    value={paidAmount || ''}
                    onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Mode</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  >
                    <option value="Online">Online / UPI / NEFT</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Bill Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium shadow-md shadow-blue-600/20 cursor-pointer"
                >
                  Save Bill & Update Dealer Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
