import React, { useState } from 'react';
import { ReceiptIndianRupee, Plus, Calendar, Tag } from 'lucide-react';
import { ExpenseEntry } from '../types';

interface ExpensesViewProps {
  expenses: ExpenseEntry[];
  onAddExpense: (expense: Omit<ExpenseEntry, 'id'>) => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  expenses,
  onAddExpense,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [category, setCategory] = useState<ExpenseEntry['category']>('Tea & Snacks');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'Online'>('Cash');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const totalExpenses = expenses.reduce((acc, exp) => acc + exp.amount, 0);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayExpenses = expenses
    .filter((e) => e.date === todayStr)
    .reduce((acc, exp) => acc + exp.amount, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || amount <= 0) return;

    onAddExpense({
      date,
      category,
      description: description.trim(),
      amount,
      paymentMode,
    });

    setDescription('');
    setAmount(0);
    setShowModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Daily Shop Expenses
          </h1>
          <p className="text-sm text-slate-500">
            Log shop overheads, utilities, tea, transport, and maintenance costs.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          + Record Expense
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Today's Expenses</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">₹{todayExpenses.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">All Time Recorded Expenses</p>
          <p className="text-2xl font-bold text-rose-600 mt-1">₹{totalExpenses.toLocaleString()}</p>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-center">Payment Mode</th>
                <th className="py-3 px-4 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-4 font-medium text-slate-700">{exp.date}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                      {exp.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-900">{exp.description}</td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        exp.paymentMode === 'Cash'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-blue-50 text-blue-700'
                      }`}
                    >
                      {exp.paymentMode}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                    ₹{exp.amount.toLocaleString()}
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
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Record New Expense</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 font-bold">
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                >
                  <option value="Tea & Snacks">Tea & Snacks</option>
                  <option value="Rent">Shop Rent</option>
                  <option value="Electricity">Electricity Bill</option>
                  <option value="Transport">Transport / Freight</option>
                  <option value="Maintenance">Maintenance & Repair</option>
                  <option value="Stationery">Stationery & Printing</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description *</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Afternoon tea for 4 clients"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    value={amount || ''}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Mode</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Online">Online (UPI)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
