import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  MapPin,
  IndianRupee,
  Share2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { BusinessSettings, Customer } from '../types';

interface CustomersViewProps {
  customers: Customer[];
  onAddCustomer: (customer: Omit<Customer, 'id'>) => void;
  onSettlePayment: (customerId: string, amount: number, mode: 'Cash' | 'Online', notes: string) => void;
  settings: BusinessSettings;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  onAddCustomer,
  onSettlePayment,
  settings,
}) => {
  const [search, setSearch] = useState('');
  const [filterDueOnly, setFilterDueOnly] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [settleModalCust, setSettleModalCust] = useState<Customer | null>(null);

  // Add customer form states
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');

  // Settle form states
  const [settleAmount, setSettleAmount] = useState('');
  const [settleMode, setSettleMode] = useState<'Cash' | 'Online'>('Cash');
  const [settleNotes, setSettleNotes] = useState('');

  const filtered = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search);
    const matchesDue = filterDueOnly ? c.balanceDue > 0 : true;
    return matchesSearch && matchesDue;
  });

  const totalUdhar = customers.reduce((acc, c) => acc + (c.balanceDue || 0), 0);

  const handleSendReminder = (c: Customer) => {
    const text = encodeURIComponent(
      `Namaste ${c.name},\nThis is a gentle reminder from *${settings.businessName}* regarding your outstanding balance of *₹${c.balanceDue.toLocaleString()}*.\nKindly clear the payment at your earliest convenience via Cash or UPI.\nContact: ${settings.phone}\nWebsite: ${settings.domainName}`
    );
    const phone = c.phone.replace(/[^0-9]/g, '');
    const url = phone ? `https://wa.me/91${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  const submitAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;

    onAddCustomer({
      name: newName.trim(),
      phone: newPhone.trim(),
      address: newAddress.trim() || undefined,
      totalPurchased: 0,
      totalPaid: 0,
      balanceDue: 0,
      lastVisit: new Date().toISOString().split('T')[0],
    });

    setNewName('');
    setNewPhone('');
    setNewAddress('');
    setShowAddModal(false);
  };

  const submitSettlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(settleAmount);
    if (!settleModalCust || !amount || amount <= 0) return;

    onSettlePayment(settleModalCust.id, amount, settleMode, settleNotes);
    setSettleModalCust(null);
    setSettleAmount('');
    setSettleNotes('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Customers & Khata Book
          </h1>
          <p className="text-sm text-slate-500">
            Customer directory, balance ledger (Udhar), and payment reminders.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          + Add New Customer
        </button>
      </div>

      {/* KPI & Filters Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Total Registered Clients</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{customers.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-amber-200 bg-amber-50/40 p-4 shadow-xs">
          <p className="text-xs text-amber-800 font-medium">Total Market Udhar (Pending)</p>
          <p className="text-2xl font-bold text-amber-700 mt-1">₹{totalUdhar.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Filter By Udhar</p>
            <p className="text-xs font-semibold text-slate-800 mt-1">
              {filterDueOnly ? 'Showing customers with pending dues' : 'Showing all customers'}
            </p>
          </div>
          <button
            onClick={() => setFilterDueOnly(!filterDueOnly)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              filterDueOnly
                ? 'bg-amber-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {filterDueOnly ? 'Dues Only' : 'All'}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by customer name or phone number..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
        />
      </div>

      {/* Customers List Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((c) => (
          <div
            key={c.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{c.name}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>{c.phone}</span>
                  </div>
                </div>
                {c.balanceDue > 0 ? (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    Due: ₹{c.balanceDue.toLocaleString()}
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    All Cleared
                  </span>
                )}
              </div>

              {c.address && (
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-2">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span className="truncate">{c.address}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Total Purchased</span>
                  <span className="font-semibold text-slate-900">
                    ₹{c.totalPurchased.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Total Paid</span>
                  <span className="font-semibold text-emerald-600">
                    ₹{c.totalPaid.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setSettleModalCust(c)}
                className="flex-1 py-2 px-3 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold transition cursor-pointer text-center"
              >
                + Receive Payment
              </button>
              {c.balanceDue > 0 && (
                <button
                  title="WhatsApp Due Reminder"
                  onClick={() => handleSendReminder(c)}
                  className="p-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Add New Customer</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>
            <form onSubmit={submitAddCustomer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer / Business Name *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Ramesh Hardware or Amit Patil"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone / WhatsApp Number *
                </label>
                <input
                  type="tel"
                  required
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="e.g. 9822112233"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Shop Address / Location
                </label>
                <textarea
                  rows={2}
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="Shop number, street, town..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settle Balance Modal */}
      {settleModalCust && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Receive Payment / Udhar Settle</h3>
                <p className="text-xs text-slate-500">{settleModalCust.name}</p>
              </div>
              <button
                onClick={() => setSettleModalCust(null)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs flex items-center justify-between">
              <span className="text-amber-800 font-medium">Current Balance Due:</span>
              <span className="font-bold text-amber-900 text-sm">
                ₹{settleModalCust.balanceDue.toLocaleString()}
              </span>
            </div>

            <form onSubmit={submitSettlePayment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Amount Received (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  placeholder={settleModalCust.balanceDue.toString()}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSettleMode('Cash')}
                    className={`py-2 text-xs font-semibold rounded-lg border ${
                      settleMode === 'Cash'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Cash
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettleMode('Online')}
                    className={`py-2 text-xs font-semibold rounded-lg border ${
                      settleMode === 'Online'
                        ? 'border-blue-600 bg-blue-50 text-blue-800'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Online (UPI)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Note / Reference
                </label>
                <input
                  type="text"
                  value={settleNotes}
                  onChange={(e) => setSettleNotes(e.target.value)}
                  placeholder="e.g. Cleared pending bill, GPay Txn ID"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSettleModalCust(null)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
