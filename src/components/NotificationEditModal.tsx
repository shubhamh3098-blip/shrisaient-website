import React, { useState, useEffect } from 'react';
import {
  X,
  ShoppingCart,
  Zap,
  Package,
  Save,
  MessageCircle,
  Phone,
  FileText,
  Trash2,
  CheckCircle2,
  Clock,
  User,
  MapPin,
  Tag,
  AlertCircle,
  Edit3,
} from 'lucide-react';
import { AdminNotification } from './AdminNotificationDropdown';

interface NotificationEditModalProps {
  notification: AdminNotification | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: AdminNotification) => void;
  onDelete: (id: string) => void;
  onConvertToBill: (notification: AdminNotification) => void;
}

export const NotificationEditModal: React.FC<NotificationEditModalProps> = ({
  notification,
  isOpen,
  onClose,
  onSave,
  onDelete,
  onConvertToBill,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [amount, setAmount] = useState<number>(0);
  const [status, setStatus] = useState<'pending' | 'contacted' | 'converted_to_bill' | 'cancelled'>('pending');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (notification) {
      setCustomerName(notification.customerName || (notification.type === 'cart_add' ? 'काउंटर ग्राहक' : ''));
      setCustomerPhone(notification.customerPhone || '');
      setCustomerAddress(notification.customerAddress || 'वर्धा');
      setItemName(notification.itemName || notification.title || '');
      setQuantity(notification.quantity || 1);
      setAmount(notification.amount || 0);
      setStatus(notification.status || 'pending');
      setNotes(notification.notes || '');
    }
  }, [notification]);

  if (!isOpen || !notification) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: AdminNotification = {
      ...notification,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerAddress: customerAddress.trim(),
      itemName: itemName.trim(),
      quantity: Number(quantity) || 1,
      amount: Number(amount) || 0,
      status,
      notes: notes.trim(),
      subtitle: `${customerName.trim() || 'ग्राहक'} (${customerPhone.trim() || 'वर्धा'}) • ${itemName.trim()} (₹${(Number(amount) || 0).toLocaleString()})`,
    };
    onSave(updated);
    onClose();
  };

  const isFinance = notification.type === 'finance_order_placed';
  const isOrder = notification.type === 'order_placed';
  const isCart = notification.type === 'cart_add';

  const cleanPhone = customerPhone.replace(/\D/g, '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in no-print overflow-y-auto">
      <div className="bg-white dark:bg-[#1E293B] text-slate-900 dark:text-slate-100 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden my-auto animate-scale-up">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shadow-xs ${
                isFinance
                  ? 'bg-blue-600 text-white'
                  : isOrder
                  ? 'bg-emerald-600 text-white'
                  : 'bg-amber-400 text-slate-950'
              }`}
            >
              {isFinance ? (
                <Zap className="w-5 h-5 fill-current" />
              ) : isOrder ? (
                <Package className="w-5 h-5" />
              ) : (
                <ShoppingCart className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-white">
                  {isFinance
                    ? '०% फायनान्स अर्ज संपादित करा'
                    : isOrder
                    ? 'ऑनलाइन ऑर्डर संपादित करा'
                    : 'कार्ट ॲक्टिव्हिटी / ग्राहक माहिती संपादित करा'}
                </h3>
              </div>
              <p className="text-[11px] text-slate-300 flex items-center gap-1.5 mt-0.5">
                <Clock className="w-3 h-3" />
                <span>
                  {new Date(notification.timestamp).toLocaleString('mr-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
                {notification.providerName && (
                  <span className="px-1.5 py-0.2 rounded bg-blue-500/30 text-blue-200 text-[10px] font-bold">
                    {notification.providerName}
                  </span>
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Action Top Bar (WhatsApp / Call / Convert to Bill) */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 flex-wrap justify-between text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            {cleanPhone && (
              <>
                <a
                  href={`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
                    `नमस्कार ${customerName || 'ग्राहक'}, श्री साई इंटरप्राइजेस वर्धा मधून संपर्क करत आहोत. आपल्या ${itemName || 'वस्तू'} (₹${amount.toLocaleString()}) बाबत माहिती हवी आहे का?`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1 shadow-2xs transition"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>

                <a
                  href={`tel:${cleanPhone}`}
                  className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1 shadow-2xs transition"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>कॉल करा</span>
                </a>
              </>
            )}

            <button
              type="button"
              onClick={() => {
                onConvertToBill({
                  ...notification,
                  customerName,
                  customerPhone,
                  customerAddress,
                  itemName,
                  quantity,
                  amount,
                  status: 'converted_to_bill',
                  notes,
                });
                onClose();
              }}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold flex items-center gap-1.5 shadow-2xs transition cursor-pointer active:scale-95"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>याचे थेट बिल बनवा (Create Bill)</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              if (confirm('ही सूचना हटवायची आहे का?')) {
                onDelete(notification.id);
                onClose();
              }
            }}
            className="text-red-500 hover:text-red-700 dark:hover:text-red-400 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
            title="सूचना हटवा (Delete)"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSave} className="p-4 sm:p-5 space-y-3.5 text-xs sm:text-sm">
          {/* Customer Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <User className="w-3 h-3 text-slate-500" />
                <span>ग्राहकाचे नाव (Customer Name)</span>
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="उदा. राहुल देशमुख"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-500" />
                <span>मोबाईल नंबर (Phone)</span>
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="उदा. 9822123456"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Village / Address */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-500" />
              <span>पत्ता / गाव (Address / Village)</span>
            </label>
            <input
              type="text"
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              placeholder="उदा. वर्धा, रामनगर"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>

          {/* Item Name / Details */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <Tag className="w-3 h-3 text-slate-500" />
              <span>वस्तूचे नाव / वर्णन (Item Description)</span>
            </label>
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="उदा. LG 32 Inch Smart TV / सोफा सेट"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>

          {/* Quantity & Amount */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                संख्या (Quantity)
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                रक्कम ₹ (Total Price)
              </label>
              <input
                type="number"
                min="0"
                value={amount}
                onChange={(e) => setAmount(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Status Selection */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              ऑर्डर/फॉलो-अप स्थिती (Status)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() => setStatus('pending')}
                className={`p-2 rounded-xl border text-center font-bold text-xs transition cursor-pointer ${
                  status === 'pending'
                    ? 'bg-amber-100 dark:bg-amber-950/60 border-amber-500 text-amber-900 dark:text-amber-200 shadow-xs ring-1 ring-amber-500'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                🟡 प्रलंबित (Pending)
              </button>

              <button
                type="button"
                onClick={() => setStatus('contacted')}
                className={`p-2 rounded-xl border text-center font-bold text-xs transition cursor-pointer ${
                  status === 'contacted'
                    ? 'bg-blue-100 dark:bg-blue-950/60 border-blue-500 text-blue-900 dark:text-blue-200 shadow-xs ring-1 ring-blue-500'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                🔵 संपर्क साधला
              </button>

              <button
                type="button"
                onClick={() => setStatus('converted_to_bill')}
                className={`p-2 rounded-xl border text-center font-bold text-xs transition cursor-pointer ${
                  status === 'converted_to_bill'
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-200 shadow-xs ring-1 ring-emerald-500'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                🟢 बिल बनवले
              </button>

              <button
                type="button"
                onClick={() => setStatus('cancelled')}
                className={`p-2 rounded-xl border text-center font-bold text-xs transition cursor-pointer ${
                  status === 'cancelled'
                    ? 'bg-slate-200 dark:bg-slate-700 border-slate-400 text-slate-800 dark:text-slate-200 shadow-xs ring-1 ring-slate-400'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                ⚪ रद्द (Cancelled)
              </button>
            </div>
          </div>

          {/* Admin Internal Notes */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <Edit3 className="w-3 h-3 text-slate-500" />
              <span>अ‍ॅडमिन अंतर्गत टीप / फॉलो-अप नोट्स (Admin Notes)</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="उदा. ग्राहकाशी फोनवर बोलणे झाले, शनिवारी दुकानात येऊन वस्तू घेणार आहेत..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden resize-none"
            />
          </div>

          {/* Modal Footer */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
            >
              रद्द करा
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-amber-400 dark:hover:bg-amber-300 dark:text-slate-950 text-xs font-black transition flex items-center gap-1.5 shadow-md cursor-pointer active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>बदल सेव्ह करा (Save)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
