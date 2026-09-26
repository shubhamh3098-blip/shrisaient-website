import React, { useState } from 'react';
import {
  Receipt,
  Plus,
  Wallet,
  TrendingDown,
  TrendingUp,
  Filter,
  Calendar,
  DollarSign,
  FileSpreadsheet,
  X
} from 'lucide-react';
import { Expense, StoreData } from '../../types';
import { StorageService } from '../../services/storageService';

interface ExpensesDayBookViewProps {
  storeData: StoreData;
  onRefreshData: () => void;
}

export const ExpensesDayBookView: React.FC<ExpensesDayBookViewProps> = ({
  storeData,
  onRefreshData,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);

  // Expense Form
  const [formCategory, setFormCategory] = useState<Expense['category']>('Tea & Refreshments');
  const [formAmount, setFormAmount] = useState<number>(0);
  const [formMode, setFormMode] = useState<Expense['paymentMode']>('Cash');
  const [formPaidTo, setFormPaidTo] = useState('');
  const [formNote, setFormNote] = useState('');

  // Cash Inflows for the selected date
  const dateSalesCash = storeData.transactions
    .filter((t) => t.date.startsWith(selectedDate) && t.paymentMode === 'Cash')
    .reduce((acc, t) => acc + t.paidAmount, 0);

  const dateReceiptsCash = storeData.billReceipts
    .filter((r) => r.date.startsWith(selectedDate) && r.paymentMode === 'Cash')
    .reduce((acc, r) => acc + r.amountPaid, 0);

  const dateSchemeCash = storeData.cardTransactions
    .filter((c) => c.date.startsWith(selectedDate) && c.paymentMode === 'Cash')
    .reduce((acc, c) => acc + c.amount, 0);

  const totalCashInflow = dateSalesCash + dateReceiptsCash + dateSchemeCash;

  // Cash Outflows for selected date
  const dateExpensesCash = storeData.expenses
    .filter((e) => e.date.startsWith(selectedDate) && e.paymentMode === 'Cash')
    .reduce((acc, e) => acc + e.amount, 0);

  const dateDealerCash = storeData.dealerPayments
    .filter((d) => d.date.startsWith(selectedDate) && d.paymentMode === 'Cash')
    .reduce((acc, d) => acc + d.amount, 0);

  const dateAdvancesCash = storeData.agentAdvances
    .filter((a) => a.date.startsWith(selectedDate))
    .reduce((acc, a) => acc + a.amount, 0);

  const totalCashOutflow = dateExpensesCash + dateDealerCash + dateAdvancesCash;
  const netCashChange = totalCashInflow - totalCashOutflow;

  // Filter expenses list
  const filteredExpenses = storeData.expenses.filter((e) => e.date.startsWith(selectedDate));

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (formAmount <= 0 || !formPaidTo.trim()) {
      alert('Please enter a valid amount and recipient.');
      return;
    }

    StorageService.addExpense({
      date: new Date().toISOString(),
      category: formCategory,
      amount: Number(formAmount),
      paymentMode: formMode,
      paidTo: formPaidTo.trim(),
      note: formNote.trim() || undefined,
    });

    onRefreshData();
    setIsAddExpenseModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Day-Book Cash Register & Expenses
            </h2>
            <p className="text-xs text-slate-400">
              Complete daily cash inflow/outflow audit and showroom expenditure vouchers.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-white focus:outline-none cursor-pointer"
            />
          </div>

          <button
            id="btn-add-expense-voucher"
            onClick={() => {
              setFormAmount(0);
              setFormPaidTo('');
              setFormNote('');
              setIsAddExpenseModalOpen(true);
            }}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-2 rounded-lg text-xs transition cursor-pointer shadow-md shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Record Expense Voucher</span>
          </button>
        </div>
      </div>

      {/* Daily Cash Ledger Tally Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Day-Book Cash Tally for {new Date(selectedDate).toLocaleDateString('en-IN', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </h3>
          </div>
          <div className="text-xs font-bold text-slate-300">
            Net Change in Cash Drawer:{' '}
            <span className={netCashChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
              {netCashChange >= 0 ? '+' : ''}₹{netCashChange.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Inflow Side */}
          <div className="space-y-3 bg-slate-800/40 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-400 border-b border-slate-700/60 pb-2">
              <span className="flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4" /> Cash Inflows (Showroom Counter)
              </span>
              <span>Total: ₹{totalCashInflow.toLocaleString('en-IN')}</span>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">Direct Sales (Cash Memos):</span>
                <span className="font-semibold text-emerald-400">
                  +₹{dateSalesCash.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">Against-Bill Receipts (#1079+):</span>
                <span className="font-semibold text-emerald-400">
                  +₹{dateReceiptsCash.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">30-Month Scheme Cash Deposits:</span>
                <span className="font-semibold text-amber-400">
                  +₹{dateSchemeCash.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Outflow Side */}
          <div className="space-y-3 bg-slate-800/40 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-xs font-bold text-rose-400 border-b border-slate-700/60 pb-2">
              <span className="flex items-center gap-1.5">
                <TrendingDown className="w-4 h-4" /> Cash Outflows (Disbursements)
              </span>
              <span>Total: ₹{totalCashOutflow.toLocaleString('en-IN')}</span>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">Shop Daily Expenses & Vouchers:</span>
                <span className="font-semibold text-rose-400">
                  -₹{dateExpensesCash.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">Dealer Payments (Cash Outflow):</span>
                <span className="font-semibold text-rose-400">
                  -₹{dateDealerCash.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">Staff / Agent Advances:</span>
                <span className="font-semibold text-rose-400">
                  -₹{dateAdvancesCash.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expenses Table for Selected Date */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm space-y-3 p-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Expense Vouchers on {selectedDate} ({filteredExpenses.length})
          </h3>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            No expenses recorded for this date.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Voucher No</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Paid To (Vendor / Staff)</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Payment Mode</th>
                  <th className="py-2.5 px-3">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3 font-mono font-semibold text-amber-400">
                      {exp.voucherNo}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 border border-slate-700 text-slate-200">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-medium text-white">{exp.paidTo}</td>
                    <td className="py-3 px-3 font-bold text-rose-400">
                      ₹{exp.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-slate-300 text-[10px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                        {exp.paymentMode}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400">{exp.note || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Expense Modal */}
      {isAddExpenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Record Showroom Expense Voucher</h3>
              <button
                onClick={() => setIsAddExpenseModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="p-5 space-y-4 text-xs">
              <div>
                <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1">
                  Expense Category *
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="Shop Rent">Shop Rent</option>
                  <option value="Electricity & Gen">Electricity & Generator Diesel</option>
                  <option value="Tea & Refreshments">Tea & Customer Hospitality</option>
                  <option value="Staff Welfare">Staff Welfare</option>
                  <option value="Freight & Transport">Freight & Unloading Transport</option>
                  <option value="Advertising">Advertising & Banners</option>
                  <option value="Showroom Maintenance">Showroom Maintenance</option>
                  <option value="Miscellaneous">Miscellaneous</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formAmount}
                    onChange={(e) => setFormAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1">
                    Payment Mode *
                  </label>
                  <select
                    value={formMode}
                    onChange={(e) => setFormMode(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Cash">Cash Drawer</option>
                    <option value="UPI">UPI (PhonePe / GPay)</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1">
                  Paid To (Vendor / Person) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MSEDCL / Tea Vendor / Tempo Union"
                  value={formPaidTo}
                  onChange={(e) => setFormPaidTo(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1">
                  Description / Voucher Note
                </label>
                <input
                  type="text"
                  placeholder="Details of expense..."
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddExpenseModalOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg shadow-md shadow-amber-500/20"
                >
                  Save Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
