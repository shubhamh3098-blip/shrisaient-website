import React, { useState } from 'react';
import {
  X,
  Search,
  Package,
  CheckCircle2,
  Clock,
  Truck,
  ShieldCheck,
  MapPin,
  Phone,
  MessageCircle,
  Share2,
  Building2,
  Calendar,
  IndianRupee,
  Barcode,
  Tag,
  Copy,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { TransactionEntry, BusinessSettings } from '../types';

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialInvoiceNo?: string;
  transactions: TransactionEntry[];
  settings: BusinessSettings;
}

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({
  isOpen,
  onClose,
  initialInvoiceNo = '',
  transactions,
  settings,
}) => {
  const [searchQuery, setSearchQuery] = useState(initialInvoiceNo);
  const [copiedLink, setCopiedLink] = useState(false);

  // Find matching order by invoice number or phone number or ID
  const matchedOrder = React.useMemo(() => {
    if (!searchQuery.trim()) {
      // If initial was provided or find latest online order
      if (initialInvoiceNo) {
        return transactions.find(
          (t) =>
            t.invoiceNo?.toLowerCase() === initialInvoiceNo.toLowerCase() ||
            t.id === initialInvoiceNo
        );
      }
      return transactions.find((t) => t.source === 'online_cart' || t.orderStatus) || null;
    }

    const q = searchQuery.trim().toLowerCase();
    return (
      transactions.find(
        (t) =>
          t.invoiceNo?.toLowerCase() === q ||
          t.id?.toLowerCase() === q ||
          (t.customerPhone && t.customerPhone.replace(/[^0-9]/g, '').includes(q.replace(/[^0-9]/g, '')))
      ) || null
    );
  }, [searchQuery, initialInvoiceNo, transactions]);

  if (!isOpen) return null;

  // Determine stage (1 to 5)
  // 1: Placed, 2: Confirmed, 3: Processing/Packed, 4: Dispatched, 5: Delivered
  const getStage = (order?: TransactionEntry | null): number => {
    if (!order) return 1;
    const status = (order.orderStatus || 'pending').toLowerCase();
    if (status === 'delivered') return 5;
    if (status === 'dispatched' || status === 'out_for_delivery') return 4;
    if (status === 'processing') return 3;
    if (status === 'confirmed' || Boolean(order.serialNumber)) return 2;
    return 1;
  };

  const currentStage = getStage(matchedOrder);

  const getTrackingUrl = (invNo: string) => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/?trackOrder=${encodeURIComponent(invNo)}`;
  };

  const handleCopyLink = () => {
    if (!matchedOrder?.invoiceNo) return;
    const url = getTrackingUrl(matchedOrder.invoiceNo);
    navigator.clipboard?.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleWhatsAppShare = () => {
    if (!matchedOrder) return;
    const url = getTrackingUrl(matchedOrder.invoiceNo);
    const text = `नमस्कार ${matchedOrder.customerName || 'ग्राहक'}जी,\nश्री साई एंटरप्रायझेस कडून आपल्या ऑर्डर (#${matchedOrder.invoiceNo}) चे लाइव्ह स्टेटस तपासण्यासाठी खालील लिंकवर क्लिक करा:\n🔗 ${url}\n\nवस्तू: ${matchedOrder.itemDetails || 'इलेक्ट्रॉनिक्स/फर्निचर'}\nस्टेटस: ${(matchedOrder.orderStatus || 'Pending').toUpperCase()}\nसंपर्क: ${settings.phone || '8766486915'}`;
    const cleanPh = (matchedOrder.customerPhone || '').replace(/[^0-9]/g, '').slice(-10);
    const target = cleanPh ? `https://wa.me/91${cleanPh}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(target, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-cyan-800 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-xs">
              <Package className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                <span>लाईव्ह ऑर्डर ट्रॅकिंग (Live Order Tracking)</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 text-[10px] font-bold border border-emerald-300/30">
                  Real-time
                </span>
              </h2>
              <p className="text-xs text-emerald-100/90 font-medium">
                {settings.businessName} • बिल नंबर किंवा मोबाईल नंबरने ट्रॅक करा
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-black/20 hover:bg-black/40 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700/60 shrink-0">
          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="बिल क्रमांक (उदा. INV-ORD-...) किंवा ग्राहक मोबाईल नंबर टाका"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
            <button
              type="button"
              onClick={() => {}}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
            >
              शोधा
            </button>
          </form>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {!matchedOrder ? (
            <div className="text-center py-10 space-y-3">
              <div className="w-14 h-14 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                कोणतीही ऑर्डर सापडली नाही
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                कृपया योग्य बिल क्रमांक (Invoice No.) किंवा १० अंकी ग्राहक मोबाईल नंबर टाकून पुन्हा प्रयत्न करा.
              </p>
            </div>
          ) : (
            <>
              {/* Order Info Card */}
              <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-3">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      बिल क्रमांक / ऑर्डर आयडी
                    </span>
                    <span className="text-base sm:text-lg font-mono font-black text-slate-900 dark:text-white">
                      {matchedOrder.invoiceNo}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide border ${
                        matchedOrder.orderStatus === 'delivered'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                          : matchedOrder.orderStatus === 'dispatched'
                          ? 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300'
                          : matchedOrder.orderStatus === 'processing'
                          ? 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-300'
                          : matchedOrder.orderStatus === 'confirmed'
                          ? 'bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-950 dark:text-cyan-300'
                          : 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {matchedOrder.orderStatus === 'delivered'
                        ? '✅ यशस्वी डिलिव्हरी (Delivered)'
                        : matchedOrder.orderStatus === 'dispatched'
                        ? '🚚 डिलिव्हरीसाठी रवाना (Dispatched)'
                        : matchedOrder.orderStatus === 'processing'
                        ? '📦 पॅकिंग चालू (Processing)'
                        : matchedOrder.orderStatus === 'confirmed'
                        ? '✨ ऑर्डर कन्फर्म (Confirmed)'
                        : '⏳ प्रलंबित तपासणी (Pending)'}
                    </span>
                  </div>
                </div>

                {/* Grid details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">ग्राहक नाव:</span>
                    <strong className="text-slate-800 dark:text-slate-100 font-bold text-sm">
                      {matchedOrder.customerName || 'अनामित'}
                    </strong>
                    {matchedOrder.customerPhone && (
                      <span className="text-slate-500 block font-mono">
                        📞 {matchedOrder.customerPhone}
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-400 block">ऑर्डर दिनांक:</span>
                    <strong className="text-slate-800 dark:text-slate-100 font-medium">
                      📅 {matchedOrder.date || 'आज'}
                    </strong>
                    <span className="text-slate-500 block">
                      पेमेंट मोड: <strong>{matchedOrder.paymentMode || 'Cash'}</strong>
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">एकूण रक्कम:</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 font-mono font-black text-sm">
                      ₹{matchedOrder.totalAmount?.toLocaleString('en-IN') || 0}
                    </strong>
                    {Boolean(matchedOrder.dueAmount && matchedOrder.dueAmount > 0) && (
                      <span className="text-rose-600 dark:text-rose-400 block font-mono text-[11px]">
                        बाकी रक्कम: ₹{matchedOrder.dueAmount.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Delivery Address */}
                {(matchedOrder.deliveryAddress || matchedOrder.village) && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-start gap-2 text-xs">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                    <span className="text-slate-600 dark:text-slate-300">
                      डिलिव्हरी पत्ता:{' '}
                      <strong>{matchedOrder.deliveryAddress || matchedOrder.village}</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Visual Multi-step Timeline */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>लाईव्ह प्रगती टाइमलाइन (Live Timeline)</span>
                </h3>

                <div className="relative pl-6 sm:pl-8 space-y-6 before:content-[''] before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
                  {/* Step 1: Order Placed */}
                  <div className="relative flex items-start gap-3">
                    <div
                      className={`absolute -left-6 sm:-left-8 w-6 sm:w-8 h-6 sm:h-8 rounded-full flex items-center justify-center text-xs font-black shadow-xs ${
                        currentStage >= 1
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 text-slate-500 dark:bg-slate-800'
                      }`}
                    >
                      ✓
                    </div>
                    <div className="bg-white dark:bg-slate-800/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 flex-1 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                          १. ऑर्डर यशस्वीरीत्या नोंदवली (Order Received)
                        </h4>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {matchedOrder.date || 'नोंदणीकृत'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        ग्राहकाकडून वेबसाइटवरून वस्तू कार्टमध्ये निवडून ऑर्डर नोंदवण्यात आली.
                      </p>
                    </div>
                  </div>

                  {/* Step 2: Confirmed & Model/Serial Assigned */}
                  <div className="relative flex items-start gap-3">
                    <div
                      className={`absolute -left-6 sm:-left-8 w-6 sm:w-8 h-6 sm:h-8 rounded-full flex items-center justify-center text-xs font-black shadow-xs ${
                        currentStage >= 2
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 text-slate-500 dark:bg-slate-800'
                      }`}
                    >
                      {currentStage >= 2 ? '✓' : '२'}
                    </div>
                    <div className="bg-white dark:bg-slate-800/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 flex-1 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                          २. ऑर्डर तपासणी व सिरीयल नंबर कन्फर्म (Model & Serial Assigned)
                        </h4>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            currentStage >= 2
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {currentStage >= 2 ? 'पुष्टी झाली' : 'प्रलंबित'}
                        </span>
                      </div>
                      {matchedOrder.serialNumber || matchedOrder.modelNumber ? (
                        <div className="mt-2.5 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs space-y-1">
                          {matchedOrder.modelNumber && (
                            <div className="flex items-center gap-1.5 font-bold text-emerald-900 dark:text-emerald-200">
                              <Tag className="w-3.5 h-3.5 text-emerald-600" />
                              <span>मॉडेल नंबर: {matchedOrder.modelNumber}</span>
                            </div>
                          )}
                          {matchedOrder.serialNumber && (
                            <div className="flex items-center gap-1.5 font-mono font-bold text-emerald-900 dark:text-emerald-200">
                              <Barcode className="w-3.5 h-3.5 text-emerald-600" />
                              <span>सिरीयल / IMEI: {matchedOrder.serialNumber}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 mt-1">
                          दुकानाच्या मॅनेजरकडून गोडावूनमधील उपलब्ध साठ्यानुसार मॉडेल व सिरीयल नंबर तपासणी केली जात आहे.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Step 3: Packed & Ready */}
                  <div className="relative flex items-start gap-3">
                    <div
                      className={`absolute -left-6 sm:-left-8 w-6 sm:w-8 h-6 sm:h-8 rounded-full flex items-center justify-center text-xs font-black shadow-xs ${
                        currentStage >= 3
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 text-slate-500 dark:bg-slate-800'
                      }`}
                    >
                      {currentStage >= 3 ? '✓' : '३'}
                    </div>
                    <div className="bg-white dark:bg-slate-800/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 flex-1 shadow-2xs">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        ३. गोडावूनमधून पॅकिंग व लोड तयार (Warehouse Packed)
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        वस्तू गोडावूनमधून पॅक करून सुरक्षित वाहतुकीसाठी टेम्पो/गाडीत लोड केली जात आहे.
                      </p>
                    </div>
                  </div>

                  {/* Step 4: Dispatched / Out for Delivery */}
                  <div className="relative flex items-start gap-3">
                    <div
                      className={`absolute -left-6 sm:-left-8 w-6 sm:w-8 h-6 sm:h-8 rounded-full flex items-center justify-center text-xs font-black shadow-xs ${
                        currentStage >= 4
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 text-slate-500 dark:bg-slate-800'
                      }`}
                    >
                      {currentStage >= 4 ? '✓' : '४'}
                    </div>
                    <div className="bg-white dark:bg-slate-800/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 flex-1 shadow-2xs">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-blue-500" />
                        <span>४. डिलिव्हरीसाठी रवाना (Out for Delivery)</span>
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        डिलिव्हरी प्रतिनिधी आपल्या दिलेल्या पत्त्यावर वस्तू घेऊन निघत आहे.
                      </p>
                    </div>
                  </div>

                  {/* Step 5: Delivered */}
                  <div className="relative flex items-start gap-3">
                    <div
                      className={`absolute -left-6 sm:-left-8 w-6 sm:w-8 h-6 sm:h-8 rounded-full flex items-center justify-center text-xs font-black shadow-xs ${
                        currentStage >= 5
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 text-slate-500 dark:bg-slate-800'
                      }`}
                    >
                      {currentStage >= 5 ? '✓' : '५'}
                    </div>
                    <div className="bg-white dark:bg-slate-800/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 flex-1 shadow-2xs">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>५. यशस्वीरीत्या ग्राहकाकडे पोहोचले (Delivered)</span>
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        वस्तूची सुरक्षित डिलिव्हरी पूर्ण झाली आणि पावती देण्यात आली. श्री साई एंटरप्रायझेस कडून खरेदीबद्दल धन्यवाद!
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Purchased Items Breakdown */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  ऑर्डरमधील वस्तू (Ordered Items)
                </span>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {matchedOrder.itemDetails || 'विविध इलेक्ट्रॉनिक्स व फर्निचर सामग्री'}
                </p>

                {matchedOrder.itemsDetail && matchedOrder.itemsDetail.length > 0 && (
                  <div className="mt-2 divide-y divide-slate-200 dark:divide-slate-700 text-xs">
                    {matchedOrder.itemsDetail.map((item, idx) => (
                      <div key={idx} className="py-2 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-100">
                            {item.description}
                          </span>
                          {(item.modelNumber || item.serialNumber) && (
                            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
                              {item.modelNumber && <span>Mod: {item.modelNumber} </span>}
                              {item.serialNumber && <span>Sr: {item.serialNumber}</span>}
                            </div>
                          )}
                        </div>
                        <span className="font-mono text-slate-600 dark:text-slate-300">
                          {item.qty || 1} नग • ₹{(item.totalAmount || item.rate || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer with Actions */}
        {matchedOrder && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedLink ? 'लिंक कॉपी झाली!' : 'ट्रॅकिंग लिंक कॉपी करा'}</span>
              </button>
              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="px-3 py-2 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp वर पाठवा</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold transition cursor-pointer"
            >
              बंद करा (Close)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
