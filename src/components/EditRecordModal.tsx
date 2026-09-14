import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Trash2,
  AlertTriangle,
  User,
  Phone,
  MapPin,
  Calendar,
  FileText,
  CreditCard,
  Building2,
  Tag,
  CheckCircle2,
} from 'lucide-react';
import { CardMember, CardTransaction, Customer, Dealer, PurchaseEntry, TransactionEntry } from '../types';

export interface EditableRecordData {
  id: string;
  category: 'bill' | 'receipt' | 'card' | 'customer' | 'purchase' | 'dealer';
  title: string;
  subtitle?: string;
  date?: string;
  referenceNo?: string;
  amount?: number;
  secondaryAmount?: number;
  phone?: string;
  village?: string;
  status?: string;
  rawItem: any;
}

interface EditRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: EditableRecordData | null;
  onSave: (category: 'bill' | 'receipt' | 'card' | 'customer' | 'purchase' | 'dealer', id: string, updatedData: any) => void;
  onDelete?: (category: 'bill' | 'receipt' | 'card' | 'customer' | 'purchase' | 'dealer', id: string) => void;
}

export const EditRecordModal: React.FC<EditRecordModalProps> = ({
  isOpen,
  onClose,
  record,
  onSave,
  onDelete,
}) => {
  if (!isOpen || !record) return null;

  const raw = record.rawItem || {};

  // Form State initialized based on category
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [village, setVillage] = useState('');
  const [date, setDate] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [secondaryAmount, setSecondaryAmount] = useState<number>(0);
  const [itemDetails, setItemDetails] = useState('');
  const [sheetNo, setSheetNo] = useState('');
  const [agentName, setAgentName] = useState('');
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'Online'>('Cash');
  const [notes, setNotes] = useState('');
  const [cardNumber, setCardNumber] = useState<number>(0);
  const [supplierName, setSupplierName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!record) return;
    setIsDeleting(false);
    setSaveSuccess(false);

    if (record.category === 'card') {
      const m = raw as CardMember;
      setCustomerName(m.customerName || '');
      setPhone(m.phone || '');
      setVillage(m.village || '');
      setSheetNo(m.sheetNo || '');
      setAgentName(m.agentName || '');
      setCardNumber(m.cardNumber || 0);
      setDate(m.joiningDate || '');
      setAmount(m.totalDeposited || 0);
      setNotes(m.notes || '');
    } else if (record.category === 'bill') {
      const b = raw as TransactionEntry;
      setCustomerName(b.customerName || '');
      setPhone(b.customerPhone || '');
      setDate(b.date || '');
      setReferenceNo(b.invoiceNo || '');
      setAmount(b.totalAmount || 0);
      setSecondaryAmount(b.dueAmount || 0);
      setItemDetails(b.itemDetails || b.stockItemName || '');
      setPaymentMode(b.paymentMode || 'Cash');
      setNotes(b.notes || '');
    } else if (record.category === 'receipt') {
      // Could be CardTransaction or TransactionEntry (Khata settle)
      if (raw.cardNumber !== undefined) {
        const ct = raw as CardTransaction;
        setCustomerName(ct.customerName || '');
        setPhone(ct.customerPhone || '');
        setDate(ct.date || '');
        setReferenceNo(ct.receiptNo || '');
        setAmount(ct.amount || 0);
        setCardNumber(ct.cardNumber || 0);
        setPaymentMode(ct.paymentMode || 'Cash');
        setNotes(ct.remarks || '');
      } else {
        const te = raw as TransactionEntry;
        setCustomerName(te.customerName || '');
        setPhone(te.customerPhone || '');
        setDate(te.date || '');
        setReferenceNo(te.invoiceNo || '');
        setAmount(te.payingNow || te.totalAmount || 0);
        setItemDetails(te.itemDetails || '');
        setPaymentMode(te.paymentMode || 'Cash');
        setNotes(te.notes || '');
      }
    } else if (record.category === 'customer') {
      const c = raw as Customer;
      setCustomerName(c.name || '');
      setPhone(c.phone || '');
      setVillage(c.address || '');
      setAmount(c.balanceDue || 0);
      setSecondaryAmount(c.totalPurchased || 0);
    } else if (record.category === 'purchase') {
      const p = raw as PurchaseEntry;
      setSupplierName(p.supplierName || '');
      setReferenceNo(p.billNo || '');
      setDate(p.date || '');
      setAmount(p.totalAmount || 0);
      setSecondaryAmount(p.paidAmount || 0);
      setItemDetails(p.items || '');
    } else if (record.category === 'dealer') {
      const d = raw as Dealer;
      setSupplierName(d.name || '');
      setPhone(d.phone || '');
      setAmount(d.balanceDue || 0);
      setSecondaryAmount(d.totalPurchases || 0);
    }
  }, [record]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!record) return;

    if (record.category === 'card') {
      const updated: CardMember = {
        ...raw,
        customerName: customerName.trim(),
        phone: phone.trim(),
        village: village.trim(),
        sheetNo: sheetNo.trim(),
        agentName: agentName.trim(),
        cardNumber: cardNumber || raw.cardNumber,
        joiningDate: date || raw.joiningDate,
        notes: notes.trim(),
      };
      onSave('card', raw.id, updated);
    } else if (record.category === 'bill') {
      const updated: TransactionEntry = {
        ...raw,
        customerName: customerName.trim(),
        customerPhone: phone.trim(),
        invoiceNo: referenceNo.trim(),
        date: date || raw.date,
        totalAmount: Number(amount) || 0,
        dueAmount: Number(secondaryAmount) || 0,
        payingNow: Math.max(0, (Number(amount) || 0) - (Number(secondaryAmount) || 0)),
        itemDetails: itemDetails.trim(),
        paymentMode,
        notes: notes.trim(),
      };
      onSave('bill', raw.id, updated);
    } else if (record.category === 'receipt') {
      if (raw.cardNumber !== undefined) {
        const updated: CardTransaction = {
          ...raw,
          customerName: customerName.trim(),
          customerPhone: phone.trim(),
          receiptNo: referenceNo.trim(),
          date: date || raw.date,
          amount: Number(amount) || 0,
          paymentMode,
          remarks: notes.trim(),
        };
        onSave('receipt', raw.id, updated);
      } else {
        const updated: TransactionEntry = {
          ...raw,
          customerName: customerName.trim(),
          customerPhone: phone.trim(),
          invoiceNo: referenceNo.trim(),
          date: date || raw.date,
          payingNow: Number(amount) || 0,
          totalAmount: 0,
          itemDetails: itemDetails.trim() || 'उधारी जमा पावती',
          paymentMode,
          notes: notes.trim(),
        };
        onSave('receipt', raw.id, updated);
      }
    } else if (record.category === 'customer') {
      const updated: Customer = {
        ...raw,
        name: customerName.trim(),
        phone: phone.trim(),
        address: village.trim(),
        balanceDue: Number(amount) || 0,
      };
      onSave('customer', raw.id, updated);
    } else if (record.category === 'purchase') {
      const updated: PurchaseEntry = {
        ...raw,
        supplierName: supplierName.trim(),
        billNo: referenceNo.trim(),
        date: date || raw.date,
        totalAmount: Number(amount) || 0,
        paidAmount: Number(secondaryAmount) || 0,
        items: itemDetails.trim(),
      };
      onSave('purchase', raw.id, updated);
    } else if (record.category === 'dealer') {
      const updated: Dealer = {
        ...raw,
        name: supplierName.trim(),
        phone: phone.trim(),
        balanceDue: Number(amount) || 0,
      };
      onSave('dealer', raw.id, updated);
    }

    setSaveSuccess(true);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  const handleDelete = () => {
    if (!record || !onDelete) return;
    const confirmText = `तुम्हाला ही नोंद (${record.title}) कायमची सिस्टीममधून हटवायची आहे का?`;
    if (window.confirm(confirmText)) {
      onDelete(record.category, record.rawItem?.id || record.id);
      onClose();
    }
  };

  const getCategoryTitle = () => {
    switch (record.category) {
      case 'card':
        return 'कार्ड मेंबर माहिती दुरुस्त करा (Card Member)';
      case 'bill':
        return 'विक्री बिल दुरुस्त करा (Sales Bill)';
      case 'receipt':
        return 'जमा पावती दुरुस्त करा (Payment Receipt)';
      case 'customer':
        return 'ग्राहक खाते दुरुस्त करा (Customer Khata)';
      case 'purchase':
        return 'खरेदी नोंद दुरुस्त करा (Purchase Entry)';
      case 'dealer':
        return 'सप्लायर / डीलर दुरुस्त करा (Supplier)';
      default:
        return 'नोंद एडिट करा';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shrink-0 shadow-xs">
              ✏️
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-base text-white truncate">
                {getCategoryTitle()}
              </h3>
              <p className="text-xs text-indigo-200 truncate">
                {record.title} {record.referenceNo ? `• #${record.referenceNo}` : ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success Alert */}
        {saveSuccess && (
          <div className="p-3 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 border-b border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>बदल यशस्वीरित्या सेव्ह करण्यात आले आहेत!</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[78vh] overflow-y-auto">
          {/* Card Member Specific Fields */}
          {record.category === 'card' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    कार्ड क्रमांक (Card Number) *
                  </label>
                  <input
                    type="number"
                    required
                    value={cardNumber || ''}
                    onChange={(e) => setCardNumber(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold font-mono bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    शीट क्रमांक (Sheet No)
                  </label>
                  <input
                    type="text"
                    value={sheetNo}
                    onChange={(e) => setSheetNo(e.target.value)}
                    placeholder="उदा. 5104 किंवा 2793"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ग्राहकाचे नाव (Customer Full Name) *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                    <span>मोबाईल नंबर (Phone)</span>
                    {!phone && <span className="text-[10px] text-amber-600 font-normal">नंबर टाका</span>}
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="उदा. 9822000000"
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                    <span>गाव / शहर (Village)</span>
                    {!village && <span className="text-[10px] text-amber-600 font-normal">गाव टाका</span>}
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={village}
                      onChange={(e) => setVillage(e.target.value)}
                      placeholder="उदा. HINGNI, KELZAR"
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    कलेक्शन एजंट (Agent Name)
                  </label>
                  <input
                    type="text"
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    placeholder="उदा. Rahul Sharma"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    सुरू तारीख (Date)
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  टिप्पणी / पत्ता (Notes / Address)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="अतिरिक्त माहिती किंवा संदर्भ..."
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none"
                />
              </div>
            </>
          )}

          {/* Sales Bill Specific Fields */}
          {record.category === 'bill' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    बिल क्रमांक (Invoice No) *
                  </label>
                  <input
                    type="text"
                    required
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold font-mono bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    तारीख (Date)
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ग्राहकाचे नाव (Customer Name) *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    मोबाईल नंबर (Phone)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  वस्तूचे तपशील / प्रॉडक्ट (Item Details)
                </label>
                <input
                  type="text"
                  value={itemDetails}
                  onChange={(e) => setItemDetails(e.target.value)}
                  placeholder="उदा. Cooler, LED TV 32, Mixer"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    एकूण बिल रक्कम (Total ₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white font-mono bg-white dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    बाकी रक्कम (Due ₹)
                  </label>
                  <input
                    type="number"
                    value={secondaryAmount}
                    onChange={(e) => setSecondaryAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-rose-600 dark:text-rose-400 font-mono bg-white dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    पेमेंट पद्धत (Mode)
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Cash">Cash (नकद)</option>
                    <option value="Online">Online / UPI</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Receipt Specific Fields */}
          {record.category === 'receipt' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    पावती क्रमांक (Receipt / Ref No) *
                  </label>
                  <input
                    type="text"
                    required
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold font-mono bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    पावती तारीख (Date)
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ग्राहकाचे नाव (Customer Name) *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    मोबाईल नंबर (Phone)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    जमा पावती रक्कम (Amount Received ₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono bg-white dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    पेमेंट पद्धत (Mode)
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Cash">Cash (नकद)</option>
                    <option value="Online">Online / UPI</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  तपशील / शेरा (Remarks)
                </label>
                <input
                  type="text"
                  value={notes || itemDetails}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="उदा. हप्ता #4 जमा, उधारी क्लिअर"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </>
          )}

          {/* Customer Specific Fields */}
          {record.category === 'customer' && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ग्राहकाचे नाव (Customer Name) *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    मोबाईल नंबर (Phone)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    गाव / पत्ता (Village / Address)
                  </label>
                  <input
                    type="text"
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  बाकी उधारी रक्कम (Current Balance Due ₹)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-black text-rose-600 dark:text-rose-400 font-mono bg-white dark:bg-slate-800"
                />
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            {onDelete ? (
              <button
                type="button"
                onClick={handleDelete}
                className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-rose-200 dark:border-rose-800"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>नोंद हटवा (Delete)</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition cursor-pointer"
              >
                रद्द करा
              </button>

              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>बदल सेव्ह करा (Save)</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
