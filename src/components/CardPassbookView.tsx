import React, { useState, useMemo, useEffect } from 'react';
import {
  BookOpen,
  Search,
  Plus,
  CreditCard,
  Calculator,
  User,
  ArrowRight,
  ListFilter,
  CheckCircle2,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { CardMember, CardTransaction, BusinessSettings, TransactionEntry } from '../types';
import { CardPassbookModal } from './CardPassbookModal';

interface CardPassbookViewProps {
  cardMembers: CardMember[];
  transactions: CardTransaction[];
  salesTransactions?: TransactionEntry[];
  settings: BusinessSettings;
  activeAgent?: string;
  initialCardNumber?: number;
  onRecordTransaction: (tx: Omit<CardTransaction, 'id' | 'createdAt'>) => void;
  onUpdateMember: (id: string, updates: Partial<CardMember>) => void;
  onOpenNewCardModal?: () => void;
  onNavigateSchemeTable?: () => void;
  onNavigateFinanceCalc?: () => void;
}

export const CardPassbookView: React.FC<CardPassbookViewProps> = ({
  cardMembers,
  transactions,
  salesTransactions = [],
  settings,
  activeAgent,
  initialCardNumber,
  onRecordTransaction,
  onUpdateMember,
  onOpenNewCardModal,
  onNavigateSchemeTable,
  onNavigateFinanceCalc,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCardId, setSelectedCardId] = useState<string>('');

  // Filter members based on search
  const filteredMembers = useMemo(() => {
    if (!searchTerm.trim()) return cardMembers;
    const term = searchTerm.toLowerCase().trim();
    return cardMembers.filter(
      (m) =>
        m.cardNumber.toString().includes(term) ||
        m.customerName.toLowerCase().includes(term) ||
        (m.phone && m.phone.includes(term)) ||
        (m.village && m.village.toLowerCase().includes(term)) ||
        (m.sheetNo && m.sheetNo.toLowerCase().includes(term))
    );
  }, [cardMembers, searchTerm]);

  // Initial selection
  useEffect(() => {
    if (initialCardNumber) {
      const match = cardMembers.find((m) => Number(m.cardNumber) === Number(initialCardNumber));
      if (match) {
        setSelectedCardId(match.id);
        return;
      }
    }

    if (!selectedCardId && cardMembers.length > 0) {
      setSelectedCardId(cardMembers[0].id);
    }
  }, [cardMembers, initialCardNumber, selectedCardId]);

  // Current selected member
  const selectedMember = useMemo(() => {
    return cardMembers.find((m) => m.id === selectedCardId) || cardMembers[0] || null;
  }, [cardMembers, selectedCardId]);

  return (
    <div className="space-y-6 pb-12">
      {/* ========================================================================= */}
      {/* 1. TOP TITLE & CONTROLS BAR */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-[#0C1425] border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                  बँक-अकाउंट टाईप डिजिटल पासबुक
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 font-bold text-xs uppercase tracking-wider">
                  Bank-Style Ledger
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                ग्राहक कार्ड निवडा आणि बँक पासबुकप्रमाणे जमा (Kab Diye), उचल (Kab Liye), हप्ते व शिल्लक खात्याची नोंद पहा.
              </p>
            </div>
          </div>

          {/* Quick Action Navigation Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {onOpenNewCardModal && (
              <button
                type="button"
                onClick={onOpenNewCardModal}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                नवीन कार्ड नोंदणी
              </button>
            )}

            {onNavigateFinanceCalc && (
              <button
                type="button"
                onClick={onNavigateFinanceCalc}
                className="px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
              >
                <Calculator className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                Finance EMI
              </button>
            )}

            {onNavigateSchemeTable && (
              <button
                type="button"
                onClick={onNavigateSchemeTable}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                कार्ड यादी टेबल
              </button>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. CARD SELECTOR & SEARCH BAR */}
        {/* ========================================================================= */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-col md:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="कार्ड क्र, ग्राहक नाव, गाव, फोन शोधा..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Member Dropdown Picker */}
          <div className="w-full md:flex-1">
            <select
              value={selectedCardId}
              onChange={(e) => setSelectedCardId(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-900 dark:text-slate-100 cursor-pointer"
            >
              {cardMembers.length === 0 && (
                <option value="">कोणतेही कार्ड उपलब्ध नाही (No Cards)</option>
              )}
              {filteredMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  कार्ड #{m.cardNumber} - {m.customerName} {m.village ? `(${m.village})` : ''} • जमा: ₹{(m.totalDeposited ?? 0).toLocaleString('en-IN')} • शिल्लक: ₹{(m.netBalance ?? 0).toLocaleString('en-IN')}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Horizontal Cards Slider for 1-click Switching */}
        {cardMembers.length > 0 && (
          <div className="mt-3 flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider whitespace-nowrap mr-1">
              जलद कार्ड:
            </span>
            {filteredMembers.slice(0, 15).map((m) => {
              const isSelected = selectedMember?.id === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedCardId(m.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 border flex items-center gap-1 ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs scale-102'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>#{m.cardNumber}</span>
                  <span className="max-w-[100px] truncate">{m.customerName.split(' ')[0]}</span>
                  {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. MAIN PASSBOOK COMPONENT */}
      {/* ========================================================================= */}
      {selectedMember ? (
        <CardPassbookModal
          isFullView={true}
          member={selectedMember}
          transactions={transactions}
          salesTransactions={salesTransactions}
          settings={settings}
          onRecordTransaction={onRecordTransaction}
          onUpdateMember={onUpdateMember}
          onOpenFinanceCalculator={onNavigateFinanceCalc}
        />
      ) : (
        <div className="bg-white dark:bg-[#0C1425] border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center">
            <BookOpen className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            कोणतेही कार्ड निवडलेले नाही किंवा कार्ड सापडले नाही
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            कृपया वरील शोध रकान्यात कार्ड क्रमांक किंवा ग्राहक नाव टाका, अथवा नवीन कार्ड नोंदवा.
          </p>
          {onOpenNewCardModal && (
            <button
              type="button"
              onClick={onOpenNewCardModal}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold inline-flex items-center gap-2 shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              नवीन कार्ड तयार करा
            </button>
          )}
        </div>
      )}
    </div>
  );
};
