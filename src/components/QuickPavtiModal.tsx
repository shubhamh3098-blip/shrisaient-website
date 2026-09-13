import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Search,
  X,
  IndianRupee,
  Calendar,
  CheckCircle,
  Phone,
  Printer,
  Share2,
  Sparkles
} from 'lucide-react';
import { Customer, BusinessSettings, TransactionEntry } from '../types';

interface QuickPavtiModalProps {
  customers: Customer[];
  settings: BusinessSettings;
  onClose: () => void;
  onSettlePayment: (customerId: string, amount: number, mode: 'Cash' | 'Online', notes: string) => void;
  onOpenInvoiceModal?: (entry: TransactionEntry) => void;
}

export const QuickPavtiModal: React.FC<QuickPavtiModalProps> = ({
  customers = [],
  settings,
  onClose,
  onSettlePayment,
  onOpenInvoiceModal,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState<'Cash' | 'Online'>('Cash');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [submittedEntry, setSubmittedEntry] = useState<TransactionEntry | null>(null);

  // Filter customers with search
  const filteredCustomers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      // Show customers with balance due first
      return (customers || [])
        .slice()
        .sort((a, b) => (Number(b.balanceDue) || 0) - (Number(a.balanceDue) || 0))
        .slice(0, 15);
    }
    return (customers || [])
      .filter((c) => {
        if (!c) return false;
        const name = String(c.name || '').toLowerCase();
        const phone = String(c.phone || '');
        return name.includes(q) || phone.includes(q);
      })
      .slice(0, 15);
  }, [customers, search]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!selectedCustomer || !numAmount || numAmount <= 0) return;

    onSettlePayment(selectedCustomer.id, numAmount, mode, notes);

    // Create receipt entry object for instant receipt preview
    const receiptNo = `SSE/RCPT-${Date.now().toString().slice(-4)}`;
    const createdReceipt: TransactionEntry = {
      id: `rcpt-${Date.now()}`,
      invoiceNo: receiptNo,
      entryType: 'Receipt',
      date: date,
      customerName: selectedCustomer.name,
      customerPhone: selectedCustomer.phone,
      itemDetails: `Payment received towards account / हिशोबात जमा (${mode})`,
      totalAmount: 0,
      payingNow: numAmount,
      dueAmount: 0,
      paymentMode: mode,
      notes: notes || 'Received towards outstanding dues',
      createdAt: new Date().toISOString(),
    };

    setSubmittedEntry(createdReceipt);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs">
      <div className="tactile-card-modal max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[var(--tactile-border-subtle)] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-[var(--tactile-text-heading)] text-base">
                Quick Payment Pavti
              </h3>
              <p className="text-[11px] text-[var(--tactile-text-muted)]">
                उधारी जमा पावती (Instant Receipt)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[var(--tactile-surface-inset)] hover:bg-[var(--tactile-surface)] flex items-center justify-center text-[var(--tactile-text-muted)] hover:text-[var(--tactile-text-main)] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {submittedEntry ? (
          /* Success Screen */
          <div className="space-y-4 py-3 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-lg font-black text-[var(--tactile-text-heading)]">
                Payment Received & Recorded!
              </h4>
              <p className="text-xs text-[var(--tactile-text-muted)] mt-1">
                Receipt #{submittedEntry.invoiceNo} • ₹{(submittedEntry.payingNow || 0).toLocaleString()} credited to {submittedEntry.customerName}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[var(--tactile-surface-inset)] border border-[var(--tactile-border)] text-xs text-left space-y-1">
              <div className="flex justify-between">
                <span className="text-[var(--tactile-text-muted)]">Customer:</span>
                <span className="font-bold text-[var(--tactile-text-heading)]">{submittedEntry.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--tactile-text-muted)]">Amount Credited:</span>
                <span className="font-bold text-emerald-600">₹{submittedEntry.payingNow.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--tactile-text-muted)]">Payment Mode:</span>
                <span className="font-bold text-[var(--tactile-text-heading)]">{submittedEntry.paymentMode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--tactile-text-muted)]">Date:</span>
                <span className="font-mono text-[var(--tactile-text-heading)]">{submittedEntry.date}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
              {onOpenInvoiceModal && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenInvoiceModal(submittedEntry);
                  }}
                  className="w-full sm:flex-1 py-2.5 rounded-xl tactile-btn-primary text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Formal Pavti / Receipt</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[var(--tactile-border)] text-xs font-bold text-[var(--tactile-text-muted)] hover:text-[var(--tactile-text-main)] cursor-pointer"
              >
                Done / Close
              </button>
            </div>
          </div>
        ) : (
          /* Pavti Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 1. Customer Selection */}
            <div>
              <label className="block text-xs font-bold text-[var(--tactile-text-main)] mb-1">
                Select Customer * <span className="text-[10px] text-[var(--tactile-text-dim)]">(ग्राहक निवडा)</span>
              </label>

              {selectedCustomer ? (
                <div className="p-3 rounded-xl border border-blue-500/40 bg-blue-500/10 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-black text-blue-950 dark:text-blue-100 truncate">
                      {selectedCustomer.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-blue-800 dark:text-blue-300 mt-0.5">
                      <span className="font-mono">{selectedCustomer.phone}</span>
                      <span>•</span>
                      <span className="font-bold text-amber-700 dark:text-amber-300">
                        Due: ₹{(Number(selectedCustomer.balanceDue) || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCustomer(null);
                      setAmount('');
                    }}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white/80 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-white cursor-pointer"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Type customer name or phone to search..."
                      className="w-full pl-9 pr-4 py-2 rounded-xl border border-[var(--tactile-border)] bg-[var(--tactile-surface-raised)] text-[var(--tactile-text-main)] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                  </div>

                  {/* Customer Dropdown List */}
                  <div className="max-h-40 overflow-y-auto border border-[var(--tactile-border)] rounded-xl divide-y divide-[var(--tactile-border-subtle)] bg-[var(--tactile-surface-raised)]">
                    {filteredCustomers.length === 0 ? (
                      <div className="p-3 text-center text-xs text-[var(--tactile-text-dim)]">
                        No customer found matching "{search}"
                      </div>
                    ) : (
                      filteredCustomers.map((c) => {
                        const due = Number(c.balanceDue) || 0;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setSelectedCustomer(c);
                              if (due > 0) setAmount(String(due));
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-[var(--tactile-surface-inset)] flex items-center justify-between gap-2 cursor-pointer"
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-[var(--tactile-text-heading)] truncate">
                                {c.name}
                              </p>
                              <p className="text-[10px] text-[var(--tactile-text-dim)] font-mono">
                                {c.phone}
                              </p>
                            </div>
                            <span className={`text-[11px] font-bold font-mono-num ${due > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600'}`}>
                              {due > 0 ? `Due: ₹${due.toLocaleString()}` : 'Cleared'}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 2. Amount & Mode */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[var(--tactile-text-main)] mb-1">
                  Amount Received (₹) * <span className="text-[10px] text-[var(--tactile-text-dim)]">(रक्कम)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="any"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-[var(--tactile-border)] bg-[var(--tactile-surface-raised)] text-[var(--tactile-text-main)] font-black text-base focus:outline-none focus:ring-2 focus:ring-rose-500/30 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--tactile-text-main)] mb-1">
                  Payment Mode <span className="text-[10px] text-[var(--tactile-text-dim)]">(प्रकार)</span>
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setMode('Cash')}
                    className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      mode === 'Cash'
                        ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
                        : 'border-[var(--tactile-border)] bg-[var(--tactile-surface-inset)] text-[var(--tactile-text-main)]'
                    }`}
                  >
                    Cash (रोख)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('Online')}
                    className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      mode === 'Online'
                        ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                        : 'border-[var(--tactile-border)] bg-[var(--tactile-surface-inset)] text-[var(--tactile-text-main)]'
                    }`}
                  >
                    Online / UPI
                  </button>
                </div>
              </div>
            </div>

            {/* 3. Date & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[var(--tactile-text-main)] mb-1">
                  Receipt Date <span className="text-[10px] text-[var(--tactile-text-dim)]">(तारीख)</span>
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--tactile-border)] bg-[var(--tactile-surface-raised)] text-[var(--tactile-text-main)] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--tactile-text-main)] mb-1">
                  Notes / Reference <span className="text-[10px] text-[var(--tactile-text-dim)]">(संदर्भ)</span>
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Cleared bill, UPI Ref ID"
                  className="w-full px-3 py-2 rounded-xl border border-[var(--tactile-border)] bg-[var(--tactile-surface-raised)] text-[var(--tactile-text-main)] text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-3 border-t border-[var(--tactile-border-subtle)]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-[var(--tactile-border)] text-xs font-semibold text-[var(--tactile-text-muted)] hover:text-[var(--tactile-text-main)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedCustomer || !parseFloat(amount)}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Save Pavti (पावती नोंदवा)</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
