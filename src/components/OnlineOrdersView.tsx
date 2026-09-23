import React, { useState, useMemo } from 'react';
import {
  ShoppingCart,
  CheckCircle2,
  Clock,
  AlertCircle,
  Truck,
  CheckCheck,
  XCircle,
  Phone,
  MessageCircle,
  Printer,
  Search,
  Tag,
  Barcode,
  Eye,
  Filter,
  ArrowUpDown,
  Sparkles,
  MapPin,
  Edit3
} from 'lucide-react';
import { TransactionEntry, OrderStatus, BusinessSettings, StockItem } from '../types';

interface OnlineOrdersViewProps {
  transactions: TransactionEntry[];
  onConfirmOrder: (order: TransactionEntry) => void;
  onViewInvoice: (invoiceNo: string) => void;
  onEditTransaction: (order: TransactionEntry) => void;
  settings: BusinessSettings;
  stock?: StockItem[];
}

export const OnlineOrdersView: React.FC<OnlineOrdersViewProps> = ({
  transactions,
  onConfirmOrder,
  onViewInvoice,
  onEditTransaction,
  settings,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Extract online orders (either tagged with source: 'online_cart' or having orderStatus or invoice starting with INV-ORD)
  const onlineOrders = useMemo(() => {
    return transactions.filter(
      (t) =>
        t.source === 'online_cart' ||
        t.invoiceNo.startsWith('INV-ORD') ||
        Boolean(t.orderStatus) ||
        (t.itemDetails && t.itemDetails.toLowerCase().includes('online'))
    );
  }, [transactions]);

  // Status counts
  const counts = useMemo(() => {
    const total = onlineOrders.length;
    const pending = onlineOrders.filter((o) => (o.orderStatus || 'pending') === 'pending').length;
    const confirmed = onlineOrders.filter((o) => o.orderStatus === 'confirmed').length;
    const dispatched = onlineOrders.filter((o) => o.orderStatus === 'dispatched').length;
    const delivered = onlineOrders.filter((o) => o.orderStatus === 'delivered').length;
    const totalValue = onlineOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    return { total, pending, confirmed, dispatched, delivered, totalValue };
  }, [onlineOrders]);

  // Filtered list
  const filteredOrders = useMemo(() => {
    return onlineOrders.filter((order) => {
      const orderStatus = order.orderStatus || 'pending';
      const matchesStatus = filterStatus === 'all' || orderStatus === filterStatus;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        order.invoiceNo.toLowerCase().includes(q) ||
        order.customerName.toLowerCase().includes(q) ||
        (order.customerPhone && order.customerPhone.includes(q)) ||
        (order.deliveryAddress && order.deliveryAddress.toLowerCase().includes(q)) ||
        (order.village && order.village.toLowerCase().includes(q)) ||
        order.itemDetails.toLowerCase().includes(q);

      return matchesStatus && matchesSearch;
    });
  }, [onlineOrders, filterStatus, searchQuery]);

  const handleWhatsAppCustomer = (order: TransactionEntry) => {
    const cleanPhone = order.customerPhone?.replace(/\D/g, '') || '';
    const statusText =
      order.orderStatus === 'confirmed'
        ? 'कन्फर्म झाली आहे'
        : order.orderStatus === 'dispatched'
        ? 'डिलिव्हरीसाठी निघाली आहे'
        : 'नोंदवली गेली आहे';

    const text = encodeURIComponent(
      `🙏 *नमस्कार ${order.customerName} ji,*\n` +
      `श्री साई इंटरप्राइजेस, वर्धा कडून आपली ऑनलाईन ऑर्डर (${order.invoiceNo}) ${statusText}.\n` +
      `एकूण रक्कम: ₹${order.totalAmount.toLocaleString()}\n` +
      (order.modelNumber ? `मॉडेल: ${order.modelNumber}\n` : '') +
      (order.serialNumber ? `सिरीयल क्र: ${order.serialNumber}\n` : '') +
      `पत्ता: ${order.deliveryAddress || order.village || 'Wardha'}\n` +
      `काही अडचण असल्यास संपर्क करा: 8766486915 / 8600122798`
    );

    if (cleanPhone) {
      window.open(`https://wa.me/91${cleanPhone}?text=${text}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${text}`, '_blank');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner / Header */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  कार्ट ऑर्डर्स व्यवस्थापन (Online Cart Orders)
                </h1>
                {counts.pending > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-white font-bold text-xs animate-pulse">
                    {counts.pending} नवीन
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                कार्टमधून आलेल्या ऑर्डर्स तपासा, कन्फर्म करा आणि बिलासाठी वस्तूंचे मॉडेल व सिरीयल नंबर जोडा.
              </p>
            </div>
          </div>
        </div>

        {/* Quick KPI Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100 dark:border-slate-700">
          <div
            onClick={() => setFilterStatus('all')}
            className={`p-3.5 rounded-2xl border transition cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-slate-100 dark:bg-slate-700 border-slate-400 dark:border-slate-500'
                : 'bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-800 hover:bg-slate-100/50'
            }`}
          >
            <span className="text-[11px] font-bold text-slate-500 uppercase block">एकूण ऑर्डर्स</span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
              {counts.total}
            </span>
          </div>

          <div
            onClick={() => setFilterStatus('pending')}
            className={`p-3.5 rounded-2xl border transition cursor-pointer ${
              filterStatus === 'pending'
                ? 'bg-amber-100/80 dark:bg-amber-950/60 border-amber-400'
                : 'bg-amber-50/50 dark:bg-slate-850 border-amber-200/60 dark:border-slate-800 hover:bg-amber-50'
            }`}
          >
            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase block">
              🟡 नवीन / प्रलंबित
            </span>
            <span className="text-xl sm:text-2xl font-black text-amber-900 dark:text-amber-300 font-mono">
              {counts.pending}
            </span>
          </div>

          <div
            onClick={() => setFilterStatus('confirmed')}
            className={`p-3.5 rounded-2xl border transition cursor-pointer ${
              filterStatus === 'confirmed'
                ? 'bg-emerald-100/80 dark:bg-emerald-950/60 border-emerald-400'
                : 'bg-emerald-50/50 dark:bg-slate-850 border-emerald-200/60 dark:border-slate-800 hover:bg-emerald-50'
            }`}
          >
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase block">
              🟢 कन्फर्म (सिरीयल नंबर सह)
            </span>
            <span className="text-xl sm:text-2xl font-black text-emerald-900 dark:text-emerald-300 font-mono">
              {counts.confirmed}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
            <span className="text-[11px] font-bold text-slate-500 uppercase block">एकूण ऑर्डर व्हॅल्यू</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono">
              ₹{counts.totalValue.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
        {/* Search input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ग्राहक, फोन, बिल क्र. किंवा वस्तू शोधा..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Status filter tabs */}
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'सर्व ऑर्डर्स' },
            { id: 'pending', label: '🟡 प्रलंबित' },
            { id: 'confirmed', label: '🟢 कन्फर्म' },
            { id: 'dispatched', label: '🚚 रवाना' },
            { id: 'delivered', label: '✅ डिलिव्हरी पूर्ण' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                filterStatus === tab.id
                  ? 'bg-[#00523f] text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List / Table */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-700 space-y-3">
          <ShoppingCart className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            कोणतीही ऑनलाईन कार्ट ऑर्डर सापडली नाही
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {searchQuery || filterStatus !== 'all'
              ? 'फिल्टर किंवा शोध बदलून पुन्हा पहा.'
              : 'ग्राहक जेव्हा दुकान पोर्टलवरून (E-Commerce Store) कार्टमध्ये वस्तू जोडून ऑर्डर करतील, तेव्हा त्या येथे रिअल-टाइम दिसतील.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const currentStatus: OrderStatus = order.orderStatus || 'pending';
            const hasSerial = Boolean(order.serialNumber || (order.itemsDetail && order.itemsDetail.some((i) => i.serialNumber)));

            return (
              <div
                key={order.id || order.invoiceNo}
                className={`bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border transition shadow-xs hover:shadow-md ${
                  currentStatus === 'pending'
                    ? 'border-amber-300 dark:border-amber-700/60 bg-amber-50/20'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left info */}
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-sm text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-700 px-2.5 py-0.5 rounded-lg">
                        #{order.invoiceNo}
                      </span>
                      <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                        {order.date}
                      </span>

                      {/* Status badge */}
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                          currentStatus === 'confirmed'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300'
                            : currentStatus === 'dispatched'
                            ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300'
                            : currentStatus === 'delivered'
                            ? 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-300'
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 animate-pulse'
                        }`}
                      >
                        {currentStatus === 'pending'
                          ? '🟡 प्रलंबित (नवीन ऑर्डर)'
                          : currentStatus === 'confirmed'
                          ? '🟢 कन्फर्म'
                          : currentStatus === 'dispatched'
                          ? '🚚 रवाना'
                          : currentStatus === 'delivered'
                          ? '✅ डिलिव्हरी पूर्ण'
                          : 'रद्द'}
                      </span>

                      {/* Model & Serial assigned indicator */}
                      {hasSerial ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                          <Barcode className="w-3 h-3 text-emerald-600" />
                          सिरीयल नंबर जोडला
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                          <AlertCircle className="w-3 h-3 text-amber-600" />
                          सिरीयल नंबर बाकी
                        </span>
                      )}
                    </div>

                    {/* Customer & Address */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-700 dark:text-slate-300">
                      <div>
                        <span className="text-slate-400 font-normal">ग्राहक: </span>
                        <strong className="text-slate-900 dark:text-white font-bold">{order.customerName}</strong>
                      </div>

                      {order.customerPhone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-blue-600" />
                          <a href={`tel:${order.customerPhone}`} className="font-mono hover:underline">
                            {order.customerPhone}
                          </a>
                        </div>
                      )}

                      <div className="flex items-center gap-1 text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span className="truncate max-w-xs">{order.deliveryAddress || order.village || 'वर्धा'}</span>
                      </div>
                    </div>

                    {/* Items Details */}
                    <div className="bg-slate-50 dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200">
                      {order.itemsDetail && order.itemsDetail.length > 0 ? (
                        <div className="space-y-1.5">
                          {order.itemsDetail.map((it, i) => (
                            <div key={i} className="flex items-center justify-between gap-2">
                              <span className="font-medium truncate">
                                • {it.productName} ({it.quantity} नग)
                              </span>
                              <div className="flex items-center gap-2 font-mono text-[11px] shrink-0">
                                {it.modelNumber && (
                                  <span className="bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                                    M: {it.modelNumber}
                                  </span>
                                )}
                                {it.serialNumber && (
                                  <span className="bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                                    SN: {it.serialNumber}
                                  </span>
                                )}
                                <span className="font-bold">₹{it.total.toLocaleString()}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="truncate font-medium">{order.itemDetails}</p>
                      )}
                    </div>
                  </div>

                  {/* Right side: Amount & Action Buttons */}
                  <div className="flex lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-3 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100 dark:border-slate-700 shrink-0">
                    <div className="text-left lg:text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">एकूण बिल</span>
                      <strong className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-mono">
                        ₹{order.totalAmount.toLocaleString()}
                      </strong>
                      <span className="text-[10px] text-slate-500 block">
                        {order.paymentMode} {order.payingNow > 0 ? `(जमा ₹${order.payingNow.toLocaleString()})` : ''}
                      </span>
                    </div>

                    {/* Primary Button: Confirm & Edit Model / Serial Number */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => onConfirmOrder(order)}
                        className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs ${
                          currentStatus === 'pending' || !hasSerial
                            ? 'bg-[#00523f] hover:bg-[#003d2f] text-white shadow-emerald-900/20 active:scale-95'
                            : 'bg-emerald-700 hover:bg-emerald-600 text-white'
                        }`}
                      >
                        <Barcode className="w-3.5 h-3.5" />
                        <span>{hasSerial ? 'मॉडेल/सिरीयल बदला' : 'कन्फर्म व सिरीयल जोडा'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onViewInvoice(order.invoiceNo)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold transition cursor-pointer"
                        title="बिल पहा"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleWhatsAppCustomer(order)}
                        className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 transition cursor-pointer"
                        title="WhatsApp मेसेज पाठवा"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
