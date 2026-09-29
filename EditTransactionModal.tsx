import React, { useState } from 'react';
import {
  X,
  FileText,
  Calendar,
  User,
  Phone,
  MapPin,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Save,
  DollarSign
} from 'lucide-react';
import { InvoiceItem, StoreData, Transaction } from '../../types';
import { StorageService } from '../../services/storageService';

interface EditTransactionModalProps {
  transaction: Transaction;
  storeData: StoreData;
  isOpen: boolean;
  onClose: () => void;
  onRefreshData: () => void;
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  transaction,
  storeData,
  isOpen,
  onClose,
  onRefreshData,
}) => {
  // Form states
  const [invoiceNo, setInvoiceNo] = useState(transaction.invoiceNo);
  const [date, setDate] = useState(
    transaction.date ? new Date(transaction.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)
  );
  const [customerId, setCustomerId] = useState(transaction.customerId || '');
  const [customerName, setCustomerName] = useState(transaction.customerName || '');
  const [customerPhone, setCustomerPhone] = useState(transaction.customerPhone || '');
  const [customerAddress, setCustomerAddress] = useState(transaction.customerAddress || '');
  const [paymentMode, setPaymentMode] = useState<Transaction['paymentMode']>(transaction.paymentMode || 'Cash');
  const [deliveryStatus, setDeliveryStatus] = useState<Transaction['deliveryStatus']>(transaction.deliveryStatus || 'Delivered');
  const [remarks, setRemarks] = useState(transaction.remarks || '');

  // Line items
  const [items, setItems] = useState<InvoiceItem[]>(
    transaction.items && transaction.items.length > 0
      ? JSON.parse(JSON.stringify(transaction.items))
      : [
          {
            stockId: 'custom-1',
            name: 'सागवान फर्निचर / इलेक्ट्रॉनिक्स वस्तू',
            brand: 'SSE',
            qty: 1,
            rate: transaction.grandTotal || 1000,
            discountPct: 0,
            taxPct: 0,
            total: transaction.grandTotal || 1000,
          },
        ]
  );

  const [paidAmount, setPaidAmount] = useState<number>(transaction.paidAmount ?? 0);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Recalculate items subtotal & grandTotal
  const subtotal = items.reduce((sum, item) => sum + (item.qty * item.rate), 0);
  const discountTotal = items.reduce((sum, item) => sum + ((item.qty * item.rate * (item.discountPct || 0)) / 100), 0);
  const grandTotal = Math.max(0, subtotal - discountTotal);
  const balanceDue = Math.max(0, grandTotal - paidAmount);

  // Handle changing item properties
  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };

    // Recalculate item total
    const qty = Number(updated[index].qty) || 0;
    const rate = Number(updated[index].rate) || 0;
    const disc = Number(updated[index].discountPct) || 0;
    const lineTotal = qty * rate * (1 - disc / 100);
    updated[index].total = Math.round(lineTotal);

    setItems(updated);
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        stockId: 'stk-' + Date.now(),
        name: '',
        brand: '',
        qty: 1,
        rate: 0,
        discountPct: 0,
        taxPct: 0,
        total: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) {
      setFormError('किमान १ वस्तू असणे आवश्यक आहे.');
      return;
    }
    setFormError(null);
    setItems(items.filter((_, i) => i !== index));
  };

  // When customer selection changes
  const handleCustomerSelect = (id: string) => {
    setCustomerId(id);
    const found = storeData.customers.find((c) => c.id === id);
    if (found) {
      setCustomerName(found.name);
      setCustomerPhone(found.phone);
      setCustomerAddress(found.address || found.city || 'Wardha');
    }
  };

  // Save changes
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!customerName.trim()) {
      setFormError('कृपया ग्राहकाचे नाव प्रविष्ट करा.');
      return;
    }

    if (items.some((i) => !i.name.trim() || i.qty <= 0)) {
      setFormError('कृपया सर्व वस्तूंसाठी वैध नाव आणि संख्या प्रविष्ट करा.');
      return;
    }

    const updatedTx: Transaction = {
      ...transaction,
      invoiceNo: invoiceNo.trim() || transaction.invoiceNo,
      date: new Date(date).toISOString(),
      customerId: customerId || transaction.customerId,
      customerName: customerName.trim().toUpperCase(),
      customerPhone: customerPhone.trim(),
      customerAddress: customerAddress.trim(),
      items,
      subtotal,
      discountTotal,
      taxTotal: 0,
      grandTotal,
      paidAmount,
      balanceDue,
      paymentMode,
      deliveryStatus,
      status: balanceDue <= 0 ? 'Paid' : paidAmount > 0 ? 'Partial' : 'Unpaid',
      remarks: remarks.trim() || undefined,
    };

    try {
      StorageService.updateTransaction(updatedTx);
      onRefreshData();
      setFormSuccess(`✓ बिल क्र. ${updatedTx.invoiceNo} यशस्वीरीत्या अपडेट झाले!`);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setFormError('त्रुटी: ' + (err.message || 'बिल सेव्ह करताना अडचण आली'));
    }
  };

  // Delete invoice
  const handleExecuteDelete = () => {
    try {
      StorageService.deleteTransaction(transaction.id);
      onRefreshData();
      setFormSuccess(`✓ बिल क्र. ${transaction.invoiceNo} हटवले गेले. रक्कम खात्यातून वजा झाली.`);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setFormError('त्रुटी: ' + err.message);
      setShowDeleteConfirm(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">जुने बिल दुरुस्त करा (Edit Sales Invoice)</h3>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  #{transaction.invoiceNo}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                तारीख, ग्राहक, वस्तूंचे दर, जमा किंवा उधारी रक्कम बदलून खात्याचा हिशोब अचूक करा.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <X className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {formSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{formSuccess}</span>
            </div>
          )}

          {showDeleteConfirm && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-600 space-y-2">
              <div className="text-xs font-bold text-rose-200">
                ⚠️ तुम्हाला खात्री आहे का? बिल क्र. {transaction.invoiceNo} कायमचे हटवायचे आहे का?
              </div>
              <p className="text-[11px] text-rose-300/80">
                या बिलाची रक्कम ग्राहकाच्या खात्यातून आपोआप वजा केली जाईल व स्टॉक परत जमा होईल.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleExecuteDelete}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  होय, बिल हटवा
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition cursor-pointer"
                >
                  रद्द करा
                </button>
              </div>
            </div>
          )}

          {/* Top Row: Invoice No, Date, Payment Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">बिल नंबर (Invoice No):</label>
              <input
                type="text"
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
                className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono font-bold text-white focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">बिल तारीख (Bill Date):</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">पेमेंट पद्धत (Payment Mode):</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as any)}
                className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
              >
                <option value="Cash">Cash (रोख)</option>
                <option value="UPI">UPI (Google Pay / PhonePe)</option>
                <option value="Card">Card</option>
                <option value="Bajaj Finance">Bajaj Finance</option>
                <option value="Cheque">Cheque</option>
                <option value="Scheme Adjustment">Scheme Adjustment (योजना वर्ग)</option>
                <option value="Credit">Credit (उधारी)</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>
          </div>

          {/* Customer Details Row */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-400" />
                <span>ग्राहक तपशील (Customer Info):</span>
              </span>
              <select
                value={customerId}
                onChange={(e) => handleCustomerSelect(e.target.value)}
                className="text-[11px] p-1 bg-slate-900 border border-slate-700 rounded text-slate-300 max-w-[200px]"
              >
                <option value="">-- ग्राहकांची यादी बदला --</option>
                {storeData.customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">ग्राहकाचे नाव:</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-white uppercase focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">मोबाईल नंबर:</label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">गाव / पत्ता:</label>
                <input
                  type="text"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">खरेदी वस्तूंची यादी (Purchased Items):</span>
              <button
                type="button"
                onClick={addItem}
                className="px-2.5 py-1 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-500/40 rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>+ वस्तू जोडा</span>
              </button>
            </div>

            <div className="space-y-2">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 gap-2 items-center bg-slate-900 p-2 rounded-lg border border-slate-800 text-xs"
                >
                  <div className="col-span-12 sm:col-span-5">
                    <input
                      type="text"
                      placeholder="उदा. Sagwan Sofa (3+1+1) / Smart TV"
                      value={item.name}
                      onChange={(e) => updateItem(idx, 'name', e.target.value)}
                      className="w-full p-1.5 bg-slate-950 border border-slate-700 rounded text-xs font-bold text-white placeholder-slate-500"
                    />
                  </div>
                  <div className="col-span-3 sm:col-span-2">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-400">नग:</span>
                      <input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) => updateItem(idx, 'qty', Number(e.target.value))}
                        className="w-full p-1.5 bg-slate-950 border border-slate-700 rounded text-xs font-mono text-center text-white"
                      />
                    </div>
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-400">दर:</span>
                      <input
                        type="number"
                        value={item.rate}
                        onChange={(e) => updateItem(idx, 'rate', Number(e.target.value))}
                        className="w-full p-1.5 bg-slate-950 border border-slate-700 rounded text-xs font-mono text-right text-white"
                      />
                    </div>
                  </div>
                  <div className="col-span-4 sm:col-span-2 text-right">
                    <span className="text-white font-mono font-bold">
                      ₹{(item.total || item.qty * item.rate).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="col-span-1 text-center">
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="text-slate-500 hover:text-rose-400 p-1 transition"
                      title="ही वस्तू काढा"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals & Payments Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">
                एकूण बिल रक्कम (Grand Total):
              </label>
              <div className="p-2 bg-slate-900 border border-slate-700 rounded-lg text-sm font-black font-mono text-white">
                ₹{grandTotal.toLocaleString('en-IN')}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-emerald-400 mb-1">
                ग्राहकाने जमा केलेली रक्कम (Paid Amount):
              </label>
              <input
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(Number(e.target.value))}
                className="w-full p-2 bg-slate-900 border border-emerald-500/50 rounded-lg text-sm font-black font-mono text-emerald-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-amber-400 mb-1">
                शिल्लक बाकी उधारी (Balance Due):
              </label>
              <div className="p-2 bg-slate-900 border border-amber-500/50 rounded-lg text-sm font-black font-mono text-amber-400">
                ₹{balanceDue.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Remarks & Delivery status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">डिलिव्हरी स्थिती:</label>
              <select
                value={deliveryStatus}
                onChange={(e) => setDeliveryStatus(e.target.value as any)}
                className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
              >
                <option value="Delivered">Delivered (वस्तू घरपोच दिली)</option>
                <option value="Pending Delivery">Pending Delivery (डिलिव्हरी बाकी)</option>
                <option value="Dispatched">Dispatched (टेम्पो निघाला)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">शेरा / नोट्स (Remarks):</label>
              <input
                type="text"
                placeholder="उदा. जुने बिल दुरुस्ती / दर सवलत"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="px-3.5 py-2 bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 text-rose-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>हे बिल हटवा (Delete)</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              रद्द करा
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black transition shadow-lg shadow-blue-600/30 flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>बदल सेव्ह करा (Save Bill)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
