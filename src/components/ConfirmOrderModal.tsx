import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Tag,
  Barcode,
  Printer,
  MessageCircle,
  Phone,
  MapPin,
  Save,
  Package,
  Sparkles,
  Truck,
  ShieldCheck,
  Building2,
  Calendar,
  Clock,
  ExternalLink
} from 'lucide-react';
import {
  TransactionEntry,
  SaleItemDetail,
  OrderStatus,
  BusinessSettings,
  StockItem
} from '../types';
import { getSafeWhatsAppUrl } from '../utils/numbering';

interface ConfirmOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: TransactionEntry | null;
  onSaveOrder: (updatedOrder: TransactionEntry) => void;
  onPrintInvoice?: (order: TransactionEntry) => void;
  settings: BusinessSettings;
  stock?: StockItem[];
}

export const ConfirmOrderModal: React.FC<ConfirmOrderModalProps> = ({
  isOpen,
  onClose,
  order,
  onSaveOrder,
  onPrintInvoice,
  settings,
  stock = [],
}) => {
  const [formData, setFormData] = useState<TransactionEntry | null>(null);
  const [items, setItems] = useState<SaleItemDetail[]>([]);
  const [status, setStatus] = useState<OrderStatus>('confirmed');
  const [dispatchLocation, setDispatchLocation] = useState<'Godown' | 'Shop'>('Godown');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (order) {
      setFormData({ ...order });
      setStatus(order.orderStatus || 'confirmed');

      if (order.itemsDetail && order.itemsDetail.length > 0) {
        setItems(
          order.itemsDetail.map((it, idx) => ({
            ...it,
            id: it.id || `item-${idx}-${Date.now()}`,
            modelNumber: it.modelNumber || order.modelNumber || order.model || '',
            serialNumber: it.serialNumber || (idx === 0 ? order.serialNumber || '' : ''),
          }))
        );
      } else {
        // Fallback for single item entry
        setItems([
          {
            id: `item-1`,
            productName: order.itemDetails || 'गृहोपयोगी वस्तू',
            quantity: order.quantity || 1,
            unitPrice: order.totalAmount,
            total: order.totalAmount,
            modelNumber: order.modelNumber || order.model || '',
            serialNumber: order.serialNumber || '',
            stockItemId: order.stockItemId,
          },
        ]);
      }
    } else {
      setFormData(null);
      setItems([]);
    }
  }, [order]);

  if (!isOpen || !formData) return null;

  const handleItemChange = (index: number, field: keyof SaleItemDetail, value: any) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        [field]: value,
      };
      return next;
    });
  };

  const handleGenerateSerial = (index: number) => {
    const prefix = 'SAI';
    const year = new Date().getFullYear();
    const rand = Math.floor(10000 + Math.random() * 90000);
    const generated = `${prefix}-${year}-SN${rand}`;
    handleItemChange(index, 'serialNumber', generated);
  };

  const handleSave = (newStatus?: OrderStatus) => {
    if (isSubmitting || !formData) return;
    setIsSubmitting(true);

    const finalStatus = newStatus || status;
    const firstModel = items[0]?.modelNumber || '';
    const firstSerial = items[0]?.serialNumber || '';

    const updated: TransactionEntry = {
      ...formData,
      orderStatus: finalStatus,
      itemsDetail: items,
      modelNumber: firstModel,
      model: firstModel,
      serialNumber: firstSerial,
      dispatchLocation,
      confirmedAt: finalStatus === 'confirmed' ? new Date().toISOString() : formData.confirmedAt,
      confirmedBy: 'Store Admin',
    };

    onSaveOrder(updated);
    setSaveSuccessMsg(true);
    setTimeout(() => {
      setSaveSuccessMsg(false);
      setIsSubmitting(false);
      onClose();
    }, 1200);
  };

  const handleShareWhatsApp = () => {
    if (!formData) return;
    const itemsList = items
      .map(
        (it, idx) =>
          `${idx + 1}. *${it.productName}*\n` +
          `   • संख्या: ${it.quantity} नग\n` +
          `   • मॉडेल क्र.: ${it.modelNumber || 'Standard'}\n` +
          `   • सिरीयल / IMEI क्र.: ${it.serialNumber || 'नोंदणीकृत'}\n` +
          `   • रक्कम: ₹${it.total.toLocaleString()}`
      )
      .join('\n\n');

    const message = encodeURIComponent(
      `🙏 *नमस्कार ${formData.customerName} ji,*\n` +
      `*श्री साई इंटरप्राइजेस, वर्धा* कडून आपली ऑनलाईन ऑर्डर कन्फर्म झाली आहे! ✅\n` +
      `--------------------------------\n` +
      `🧾 *बिल क्र. (Invoice No):* #${formData.invoiceNo}\n` +
      `📅 *दिनांक:* ${formData.date}\n` +
      `📍 *डिलिव्हरी पत्ता:* ${formData.deliveryAddress || formData.village || 'Wardha'}\n` +
      `--------------------------------\n` +
      `📦 *वस्तू व सिरीयल नंबर तपशील:*\n${itemsList}\n` +
      `--------------------------------\n` +
      `💰 *एकूण बिल रक्कम:* ₹${formData.totalAmount.toLocaleString()}\n` +
      `💵 *जमा भरणा / Advance:* ₹${formData.payingNow.toLocaleString()}\n` +
      (formData.dueAmount > 0 ? `⚠️ *शिल्लक बाकी / EMI:* ₹${formData.dueAmount.toLocaleString()}\n` : `✅ *स्टेटस:* पूर्ण पेमेंट प्राप्त (Fully Paid)\n`) +
      `🚚 *ऑर्डर स्टेटस:* ${status === 'confirmed' ? 'कन्फर्म (तयार)' : status === 'dispatched' ? 'रवाना / डिलिव्हरीसाठी बाहेर' : 'डिलिव्हरी पूर्ण'}\n` +
      (typeof window !== 'undefined' ? `🔗 *लाईव्ह ऑर्डर ट्रॅक करा:* ${window.location.origin}/?trackOrder=${encodeURIComponent(formData.invoiceNo)}\n` : '') +
      `--------------------------------\n` +
      `आपल्या विश्वासासाठी धन्यवाद! 💐\n` +
      `दुकान: श्री साई इंटरप्राइजेस, मातोश्री सभागृह समोर, आर्वी रोड, वर्धा\n` +
      `संपर्क: 8766486915 / 8600122798`
    );

    const url = getSafeWhatsAppUrl(formData.customerPhone, message);
    window.open(url, '_blank');
  };

  const isConfirmed = status === 'confirmed';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-linear-to-r from-emerald-50 via-teal-50 to-blue-50 dark:from-emerald-950/40 dark:via-slate-900 dark:to-blue-950/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-600/20">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                  ऑर्डर कन्फर्म व मॉडेल / सिरीयल नंबर वाटप
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                  status === 'confirmed'
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                    : status === 'dispatched'
                    ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300'
                    : status === 'delivered'
                    ? 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-300'
                    : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300'
                }`}>
                  {status === 'pending' ? '🟡 नवीन / प्रलंबित' : status === 'confirmed' ? '🟢 कन्फर्म' : status === 'dispatched' ? '🚚 रवाना' : status === 'delivered' ? '✅ डिलिव्हरी पूर्ण' : 'रद्द'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                ऑर्डर क्र. #{formData.invoiceNo} • {formData.date}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs sm:text-sm text-slate-800 dark:text-slate-200">
          {saveSuccessMsg && (
            <div className="p-3 rounded-2xl bg-emerald-500 text-white font-bold text-center flex items-center justify-center gap-2 shadow-lg animate-bounce">
              <CheckCircle2 className="w-5 h-5" />
              <span>ऑर्डर यशस्वीरीत्या सेव्ह व कन्फर्म झाली! (Model & Serial No Linked)</span>
            </div>
          )}

          {/* Customer & Delivery Summary Card */}
          <div className="bg-slate-50 dark:bg-slate-850 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <span className="text-[11px] text-slate-400 uppercase font-bold block">ग्राहक नाव (Customer):</span>
              <strong className="text-slate-900 dark:text-white text-sm font-semibold block mt-0.5">
                {formData.customerName}
              </strong>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 uppercase font-bold block">मोबाईल नंबर (Phone):</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <a
                  href={`tel:${formData.customerPhone}`}
                  className="font-mono text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  <Phone className="w-3.5 h-3.5" />
                  {formData.customerPhone || 'उपलब्ध नाही'}
                </a>
              </div>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 uppercase font-bold block">डिलिव्हरी पत्ता / गाव:</span>
              <div className="flex items-center gap-1 mt-0.5 text-slate-700 dark:text-slate-300 font-medium">
                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span className="truncate">{formData.deliveryAddress || formData.village || 'वर्धा शहर'}</span>
              </div>
            </div>
          </div>

          {/* Status Change Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              ऑर्डर स्थिती बदला (Order Lifecycle Status):
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'pending' as OrderStatus, label: '🟡 प्रलंबित (Pending)', desc: 'नवीन आलेली ऑर्डर' },
                { id: 'confirmed' as OrderStatus, label: '🟢 कन्फर्म (Confirmed)', desc: 'मॉडेल व सिरीयल दिले' },
                { id: 'dispatched' as OrderStatus, label: '🚚 रवाना (Dispatched)', desc: 'डिलिव्हरीसाठी बाहेर' },
                { id: 'delivered' as OrderStatus, label: '✅ डिलिव्हरी पूर्ण', desc: 'ग्राहक सुपूर्द' },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStatus(st.id)}
                  className={`p-2.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                    status === st.id
                      ? 'border-emerald-600 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 ring-2 ring-emerald-500/30 font-bold'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750'
                  }`}
                >
                  <span className="text-xs font-bold">{st.label}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-400 mt-0.5">{st.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Dispatch Location Selector (Godown vs Shop Showroom) */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                डिलिव्हरी कुठून होणार? (Dispatch Location):
              </span>
              <span className="text-[11px] text-slate-500">
                निवडलेल्या गोडावून किंवा दुकानातून संबंधित वस्तूंचा साठा कमी केला जाईल
              </span>
            </div>
            <div className="inline-flex rounded-xl bg-slate-200 dark:bg-slate-700 p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setDispatchLocation('Godown')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  dispatchLocation === 'Godown'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                <span>🏭 मुख्य गोडावून (Godown)</span>
              </button>
              <button
                type="button"
                onClick={() => setDispatchLocation('Shop')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  dispatchLocation === 'Shop'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                <span>🏪 दुकान / शोरूम (Showroom)</span>
              </button>
            </div>
          </div>

          {/* Items Model and Serial Number Allocation Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-blue-600" />
                <span>वस्तू तपशील, मॉडेल आणि सिरीयल नंबर जोडा ({items.length} वस्तू):</span>
              </span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                * बिलावर व वॉरंटी कार्डवर हेच सिरीयल नंबर दिसतील
              </span>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="bg-white dark:bg-slate-800 p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 shadow-xs space-y-3"
                >
                  {/* Item Title & Price */}
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 font-bold flex items-center justify-center text-xs">
                        {idx + 1}
                      </span>
                      <strong className="text-sm text-slate-900 dark:text-white font-bold">
                        {item.productName}
                      </strong>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded font-bold text-slate-700 dark:text-slate-300">
                        {item.quantity} नग
                      </span>
                      <strong className="text-slate-900 dark:text-white">
                        ₹{item.total.toLocaleString()}
                      </strong>
                    </div>
                  </div>

                  {/* Model & Serial Inputs for this item */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Model Number */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>मॉडेल नंबर / नाव (Model Number):</span>
                      </label>
                      <input
                        type="text"
                        value={item.modelNumber || ''}
                        onChange={(e) => handleItemChange(idx, 'modelNumber', e.target.value)}
                        placeholder="उदा. WP-205-WDE, KD-43X75K, सागवान सोफा"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      />
                    </div>

                    {/* Serial Number / IMEI */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                          <Barcode className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>सिरीयल नंबर / IMEI (Serial No):</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => handleGenerateSerial(idx)}
                          className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 cursor-pointer font-semibold"
                          title="ऑटो-जनरेट सिरीयल"
                        >
                          <Sparkles className="w-3 h-3" />
                          ऑटो जनरेट
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          value={item.serialNumber || ''}
                          onChange={(e) => handleItemChange(idx, 'serialNumber', e.target.value)}
                          placeholder="उदा. SN-2026-FR-98214 / बारकोड स्कॅन करा"
                          className="w-full px-3 py-2 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50/40 dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-semibold text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Stock matching helper if stock items exist */}
                  {stock.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center gap-2 text-[11px] text-slate-500">
                      <span className="shrink-0 font-medium">स्टॉक लिंक:</span>
                      <select
                        value={item.stockItemId || ''}
                        onChange={(e) => {
                          const matched = stock.find((s) => s.id === e.target.value);
                          if (matched) {
                            handleItemChange(idx, 'stockItemId', matched.id);
                            if (matched.modelNumber && !item.modelNumber) {
                              handleItemChange(idx, 'modelNumber', matched.modelNumber);
                            }
                          }
                        }}
                        className="flex-1 py-1 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs"
                      >
                        <option value="">-- सध्याच्या उपलब्ध साठ्यामधून निवडा --</option>
                        {stock.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} (दुकान: {s.shopQty ?? s.quantity} | गोडावून: {s.godownQty ?? 0})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Payment Details Box */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-2 font-mono">
            <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
              <span className="font-sans">एकूण बिल (Total Amount):</span>
              <strong className="text-slate-900 dark:text-white text-base">₹{formData.totalAmount.toLocaleString()}</strong>
            </div>
            <div className="flex justify-between items-center text-emerald-700 dark:text-emerald-400">
              <span className="font-sans">जमा भरणा / Advance:</span>
              <strong className="text-base">₹{formData.payingNow.toLocaleString()}</strong>
            </div>
            <div className="flex justify-between items-center text-amber-700 dark:text-amber-400">
              <span className="font-sans">उधारी / बाकी रक्कम:</span>
              <strong className="text-base">₹{formData.dueAmount.toLocaleString()}</strong>
            </div>
            <div className="flex justify-between items-center text-slate-500 text-[11px] pt-1 border-t border-slate-200 dark:border-slate-700 font-sans">
              <span>पेमेंट मोड:</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{formData.paymentMode}</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            रद्द करा
          </button>

          <div className="flex items-center gap-2">
            {onPrintInvoice && (
              <button
                type="button"
                onClick={() => {
                  const firstModel = items[0]?.modelNumber || '';
                  const firstSerial = items[0]?.serialNumber || '';
                  const updated: TransactionEntry = {
                    ...formData,
                    orderStatus: status,
                    itemsDetail: items,
                    modelNumber: firstModel,
                    model: firstModel,
                    serialNumber: firstSerial,
                  };
                  onPrintInvoice(updated);
                }}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">बिल प्रिंट</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="px-3.5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSave(status)}
              className={`px-5 py-2.5 rounded-xl bg-[#00523f] hover:bg-[#003d2f] text-white font-bold flex items-center gap-2 transition shadow-md shadow-emerald-900/20 ${
                isSubmitting ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer active:scale-95'
              }`}
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'सेव्ह होत आहे...' : 'ऑर्डर कन्फर्म व सेव्ह करा'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
