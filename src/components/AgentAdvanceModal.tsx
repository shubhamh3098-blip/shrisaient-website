import React, { useState } from 'react';
import { X, HandCoins, Calendar, CreditCard, Banknote, CheckCircle, Smartphone } from 'lucide-react';
import { AgentAdvanceEntry, BusinessSettings } from '../types';

interface AgentAdvanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  agents: string[];
  initialAgent?: string;
  onSaveAdvance: (advance: Omit<AgentAdvanceEntry, 'id' | 'createdAt'>) => void;
  settings: BusinessSettings;
}

export const AgentAdvanceModal: React.FC<AgentAdvanceModalProps> = ({
  isOpen,
  onClose,
  agents,
  initialAgent = '',
  onSaveAdvance,
  settings,
}) => {
  const [selectedAgent, setSelectedAgent] = useState<string>(initialAgent || (agents[0] || ''));
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'Online'>('Cash');
  const [notes, setNotes] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const numAmount = Number(amount);
    if (!selectedAgent) {
      setFormError('कृपया एजंट निवडा (Please select an agent)');
      return;
    }
    if (!numAmount || numAmount <= 0) {
      setFormError('कृपया वैध रक्कम टाका (Please enter valid amount)');
      return;
    }

    onSaveAdvance({
      agentName: selectedAgent.trim(),
      date,
      amount: numAmount,
      paymentMode,
      notes: notes.trim() || undefined,
    });

    setSubmitted(true);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in no-print">
      <div className="bg-[#0f172a] text-slate-100 rounded-2xl w-full max-w-md border border-slate-700 shadow-2xl overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <HandCoins className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                एजंट अॅडव्हान्स नोंद (Agent Advance)
              </h2>
              <p className="text-xs text-slate-400">
                Day-wise advance for weekly/monthly hisab
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {formError && (
            <div className="p-3 bg-rose-950/60 border border-rose-700 text-rose-200 rounded-xl text-xs font-semibold">
              ⚠️ {formError}
            </div>
          )}

          {/* Agent Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              एजंटचे नाव (Agent Name) *
            </label>
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            >
              <option value="" disabled>-- एजंट निवडा (Select Agent) --</option>
              {agents.map((ag) => (
                <option key={ag} value={ag}>
                  {ag}
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-amber-400" /> तारीख (Advance Date) *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>

          {/* Advance Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              अॅडव्हान्स रक्कम (Advance Amount ₹) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400 font-bold text-lg">
                ₹
              </span>
              <input
                type="number"
                min="1"
                step="1"
                placeholder="उदा. 500, 1000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                autoFocus
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white font-bold text-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden placeholder:font-normal placeholder:text-slate-500"
              />
            </div>
            {/* Quick Amount Buttons */}
            <div className="flex items-center gap-2 mt-2">
              {[200, 500, 1000, 2000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAmount(amt.toString())}
                  className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 border border-slate-700 hover:border-amber-500/50 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                >
                  +₹{amt}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Mode */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              पेमेंट पद्धत (Payment Mode)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMode('Cash')}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition cursor-pointer ${
                  paymentMode === 'Cash'
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400 shadow-xs'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <Banknote className="w-4 h-4" />
                रोकड (Cash)
              </button>
              <button
                type="button"
                onClick={() => setPaymentMode('Online')}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition cursor-pointer ${
                  paymentMode === 'Online'
                    ? 'bg-blue-600/20 border-blue-500 text-blue-400 shadow-xs'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                ऑनलाइन (UPI / GPay)
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              नोंद / कारण (Reason / Notes)
            </label>
            <input
              type="text"
              placeholder="उदा. पेट्रोल खर्च, घरगुती गरज"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800/90 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden placeholder:text-slate-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
            >
              रद्द करा (Cancel)
            </button>
            <button
              type="submit"
              disabled={submitted}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitted ? (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-950" />
                  नोंद झाली!
                </>
              ) : (
                <>
                  <HandCoins className="w-4 h-4" />
                  अॅडव्हान्स जतन करा (Save Advance)
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
