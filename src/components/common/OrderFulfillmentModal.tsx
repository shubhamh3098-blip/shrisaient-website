import React, { useState } from 'react';
import {
  X,
  ShoppingBag,
  User,
  Phone,
  MapPin,
  Tag,
  Barcode,
  CreditCard,
  CheckCircle2,
  Printer,
  ArrowRight,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { StoreData, StockItem, Transaction, BillReceipt, InvoiceItem } from '../../types';
import { StorageService } from '../../services/storageService';
import { useTheme } from '../../context/ThemeContext';
import { AppNotification, NotificationService } from '../../services/notificationService';

interface OrderFulfillmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  notification: AppNotification | null;
  storeData: StoreData;
  onRefreshData: () => void;
  onOpenInAddEntry: (orderData: {
    customerName: string;
    customerPhone: string;
    customerLocation: string;
    itemDetails: string;
    modelName: string;
    serialNo: string;
    totalAmount: number;
    stockId?: string;
  }) => void;
  onPrintInvoice?: (tx: Transaction) => void;
}

export const OrderFulfillmentModal: React.FC<OrderFulfillmentModalProps> = ({
  isOpen,
  onClose,
  notification,
  storeData,
  onRefreshData,
  onOpenInAddEntry,
  onPrintInvoice,
}) => {
  const { isDayMode } = useTheme();

  // Extract initial values from notification
  const initData = notification?.data;
  const firstItem = initData?.cartItems?.[0];

  const [customerName, setCustomerName] = useState<string>(initData?.customerName || '');
  const [customerPhone, setCustomerPhone] = useState<string>(initData?.customerPhone || '');
  const [customerLocation, setCustomerLocation] = useState<string>(initData?.customerAddress || 'Wardha');
  const [itemDetails, setItemDetails] = useState<string>(
    firstItem?.name || initData?.itemNames?.[0] || 'Electronics / Furniture Item'
  );
  const [selectedStockId, setSelectedStockId] = useState<string>(
    firstItem?.stockId || initData?.stockId || ''
  );
  const [modelName, setModelName] = useState<string>(firstItem?.model || initData?.model || '');
  const [serialNo, setSerialNo] = useState<string>(firstItem?.serialNo || initData?.serialNo || '');
  const [totalAmount, setTotalAmount] = useState<string>(
    initData?.amount ? initData.amount.toString() : '0'
  );
  const [payingNow, setPayingNow] = useState<string>(
    initData?.amount ? initData.amount.toString() : '0'
  );
  const [paymentMode, setPaymentMode] = useState<Transaction['paymentMode']>('UPI');
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [createdTx, setCreatedTx] = useState<Transaction | null>(null);

  // Sync state whenever notification changes
  React.useEffect(() => {
    if (notification?.data) {
      const d = notification.data;
      const fItem = d.cartItems?.[0];
      setCustomerName(d.customerName || '');
      setCustomerPhone(d.customerPhone || '');
      setCustomerLocation(d.customerAddress || 'Wardha');
      setItemDetails(fItem?.name || d.itemNames?.[0] || 'Electronics / Furniture Item');
      setSelectedStockId(fItem?.stockId || d.stockId || '');
      setModelName(fItem?.model || d.model || '');
      setSerialNo(fItem?.serialNo || d.serialNo || '');
      setTotalAmount(d.amount ? d.amount.toString() : '0');
      setPayingNow(d.amount ? d.amount.toString() : '0');
      setIsSaved(false);
      setCreatedTx(null);
    }
  }, [notification]);

  if (!isOpen) return null;

  const handleStockSelect = (stockId: string) => {
    setSelectedStockId(stockId);
    const item = storeData.stock.find((s) => s.id === stockId);
    if (item) {
      setItemDetails(`${item.brand} - ${item.name}`);
      setModelName(item.model || '');
      // If stock already has a non-empty serial number, pre-fill it, otherwise leave empty for typing
      setSerialNo(item.serialNo && item.serialNo.trim() !== '' ? item.serialNo : '');
      setTotalAmount(item.salePrice.toString());
      setPayingNow(item.salePrice.toString());
    }
  };

  const handleGenerateSerial = () => {
    const prefix = 'SSE';
    const rand = Math.floor(100000 + Math.random() * 900000);
    setSerialNo(`${prefix}-${rand}`);
  };

  const handleSaveOrderToBill = () => {
    if (!customerName.trim()) {
      alert('कृपया ग्राहकाचे नाव टाका.');
      return;
    }
    const totalVal = parseFloat(totalAmount) || 0;
    const paidVal = parseFloat(payingNow) || 0;

    const data = StorageService.loadData();

    // Customer Lookup or Create
    let targetCustomerId = 'cust_cash';
    const foundCust = data.customers.find(
      (c) =>
        (customerPhone.trim() && c.phone === customerPhone.trim()) ||
        c.name.toLowerCase() === customerName.trim().toLowerCase()
    );

    if (foundCust) {
      targetCustomerId = foundCust.id;
      foundCust.currentBalance += Math.max(0, totalVal - paidVal);
      foundCust.totalPurchased += totalVal;
    } else {
      targetCustomerId = `cust_${Date.now()}`;
      data.customers.unshift({
        id: targetCustomerId,
        name: customerName.trim(),
        phone: customerPhone.trim() || '0',
        address: customerLocation.trim() || 'Wardha',
        city: customerLocation.trim() || 'Wardha',
        creditLimit: 30000,
        currentBalance: Math.max(0, totalVal - paidVal),
        totalPurchased: totalVal,
        createdAt: new Date().toISOString(),
      });
    }

    // Next Invoice Number
    const invNum = data.settings.nextInvoiceNo || 1080;
    data.settings.nextInvoiceNo = invNum + 1;

    // Items array with assigned Model & Serial
    const invoiceItems: InvoiceItem[] = [
      {
        stockId: selectedStockId || 'manual_order_item',
        name: itemDetails.trim(),
        brand: 'Shri Sai Assured',
        model: modelName.trim() || undefined,
        serialNo: serialNo.trim() || undefined,
        qty: 1,
        rate: totalVal,
        discountPct: 0,
        taxPct: 0,
        total: totalVal,
      },
    ];

    const newTx: Transaction = {
      id: `tx_${Date.now()}`,
      invoiceNo: `SSE-INV-${invNum}`,
      date: new Date().toISOString().slice(0, 10),
      customerId: targetCustomerId,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim() || '0',
      customerAddress: customerLocation.trim() || 'Wardha',
      paymentMode: paymentMode,
      items: invoiceItems,
      subtotal: totalVal,
      taxTotal: 0,
      discountTotal: 0,
      grandTotal: totalVal,
      paidAmount: paidVal,
      balanceDue: Math.max(0, totalVal - paidVal),
      deliveryStatus: 'Delivered',
      status: paidVal >= totalVal ? 'Paid' : paidVal > 0 ? 'Partial' : 'Unpaid',
      remarks: `ऑनलाइन / कार्ट ऑर्डर बिल | मॉडेल: ${modelName || 'N/A'} | सिरीयल: ${serialNo || 'N/A'}`,
      createdBy: 'Admin (Bhushan)',
    };

    data.transactions.unshift(newTx);

    // Bill receipt if paid
    if (paidVal > 0) {
      const recNum = data.settings.nextReceiptNo || 1079;
      data.settings.nextReceiptNo = recNum + 1;
      const receiptPaymentMode: BillReceipt['paymentMode'] =
        paymentMode === 'UPI' ? 'UPI' :
        paymentMode === 'Card' ? 'Card' :
        paymentMode === 'Cheque' ? 'Cheque' : 'Cash';

      const newReceipt: BillReceipt = {
        id: `rec_${Date.now()}`,
        receiptNo: recNum,
        customerId: targetCustomerId,
        customerName: customerName.trim(),
        invoiceNo: newTx.invoiceNo,
        amountPaid: paidVal,
        date: new Date().toISOString().slice(0, 10),
        paymentMode: receiptPaymentMode,
        balanceRemaining: Math.max(0, totalVal - paidVal),
        remarks: `कार्ट ऑर्डर पावती (#${invNum})`,
        handledBy: 'Admin (Bhushan)',
      };
      data.billReceipts.unshift(newReceipt);
    }

    // Deduct stock if matching stock item exists
    if (selectedStockId) {
      const stockItem = data.stock.find((s) => s.id === selectedStockId);
      if (stockItem && stockItem.stockQty > 0) {
        stockItem.stockQty -= 1;
      }
    }

    StorageService.saveData(data);
    onRefreshData();

    // Mark notification as read
    if (notification) {
      NotificationService.markAsRead(notification.id);
    }

    setCreatedTx(newTx);
    setIsSaved(true);
  };

  const handleTransferToAddEntry = () => {
    onOpenInAddEntry({
      customerName,
      customerPhone,
      customerLocation,
      itemDetails,
      modelName,
      serialNo,
      totalAmount: parseFloat(totalAmount) || 0,
      stockId: selectedStockId,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className={`w-full max-w-2xl rounded-3xl shadow-2xl border overflow-hidden flex flex-col max-h-[92vh] ${
          isDayMode
            ? 'bg-white border-slate-200 text-slate-800'
            : 'bg-slate-900 border-slate-800 text-white'
        }`}
      >
        {/* Header */}
        <div
          className={`p-4 sm:p-5 border-b flex items-center justify-between ${
            isDayMode ? 'bg-amber-50/70 border-amber-100' : 'bg-slate-950 border-slate-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-[#ff9900] text-black">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base flex items-center gap-2">
                <span>कार्ट ऑर्डर संपादन व बिलिंग</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-black">
                  Live Order
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                ग्राहकाने मागवलेल्या वस्तूचा खरा मॉडेल आणि सिरीयल नंबर टाकून तात्काळ बिल बनवा.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-500/20 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {isSaved && createdTx ? (
            <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 space-y-3 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <h4 className="text-base font-extrabold text-white">
                बिल यशस्वीरीत्या तयार झाले!
              </h4>
              <p className="text-xs text-slate-300">
                इनव्हॉईस क्र. <b className="text-emerald-400 font-mono">{createdTx.invoiceNo}</b> | ग्राहक: {createdTx.customerName}
              </p>
              <div className="text-xs bg-slate-950/60 p-3 rounded-xl border border-emerald-500/20 text-left space-y-1">
                <div>वस्तू: <b>{itemDetails}</b></div>
                <div>मॉडेल नंबर: <b className="font-mono text-amber-300">{modelName || 'N/A'}</b></div>
                <div>सिरीयल नंबर: <b className="font-mono text-cyan-300">{serialNo || 'N/A'}</b></div>
                <div>रक्कम: <b>₹{createdTx.grandTotal.toLocaleString('en-IN')}</b> (जमा: ₹{createdTx.paidAmount.toLocaleString('en-IN')})</div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                {onPrintInvoice && (
                  <button
                    onClick={() => {
                      onPrintInvoice(createdTx);
                      onClose();
                    }}
                    className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold flex items-center gap-2 shadow cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>टॅक्स इनव्हॉईस छापा</span>
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold cursor-pointer"
                >
                  बंद करा (Close)
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Alert prompt */}
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <div className="leading-relaxed text-[11px]">
                  <b>महत्त्वाचे:</b> ग्राहकाच्या ऑर्डरमधील उत्पादनाचा <b>खरा बॉक्स सिरीयल नंबर (Serial No / IMEI)</b> आणि <b>मॉडेल नंबर</b> येथे तपासून टाकावा, जेणेकरून वॉरंटी आणि बिलिंग अचूक राहील.
                </div>
              </div>

              {/* Customer Info Section */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1 flex items-center gap-1">
                    <User className="w-3 h-3 text-sky-400" /> ग्राहकाचे नाव *
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Customer Name"
                    className={`w-full px-3 py-2 rounded-xl border text-xs outline-none focus:ring-1 focus:ring-teal-500 ${
                      isDayMode ? 'bg-slate-50 border-slate-300' : 'bg-slate-950 border-slate-700'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-emerald-400" /> मोबाईल नंबर
                  </label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="WhatsApp Phone"
                    className={`w-full px-3 py-2 rounded-xl border text-xs outline-none focus:ring-1 focus:ring-teal-500 ${
                      isDayMode ? 'bg-slate-50 border-slate-300' : 'bg-slate-950 border-slate-700'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-rose-400" /> गाव / पत्ता
                  </label>
                  <input
                    type="text"
                    value={customerLocation}
                    onChange={(e) => setCustomerLocation(e.target.value)}
                    placeholder="Village / Location"
                    className={`w-full px-3 py-2 rounded-xl border text-xs outline-none focus:ring-1 focus:ring-teal-500 ${
                      isDayMode ? 'bg-slate-50 border-slate-300' : 'bg-slate-950 border-slate-700'
                    }`}
                  />
                </div>
              </div>

              {/* Product Selection & Item Details */}
              <div className="space-y-2">
                <label className="block text-slate-400 font-semibold flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <ShoppingBag className="w-3 h-3 text-amber-400" /> ऑर्डर केलेली वस्तू (Item Name) *
                  </span>
                  <span className="text-[10px] text-slate-500">गोदामातील स्टॉक लिंक करा किंवा नाव बदला</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={itemDetails}
                    onChange={(e) => setItemDetails(e.target.value)}
                    placeholder="उदा. Samsung 43 Crystal UHD 4K Smart TV"
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-bold outline-none focus:ring-1 focus:ring-teal-500 ${
                      isDayMode ? 'bg-slate-50 border-slate-300' : 'bg-slate-950 border-slate-700'
                    }`}
                  />
                  <select
                    value={selectedStockId}
                    onChange={(e) => handleStockSelect(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs outline-none cursor-pointer ${
                      isDayMode ? 'bg-slate-50 border-slate-300' : 'bg-slate-950 border-slate-700 text-slate-200'
                    }`}
                  >
                    <option value="">-- स्टॉकमधील वस्तू निवडा (Optional) --</option>
                    {storeData.stock.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.brand}) - ₹{s.salePrice} (Stock: {s.stockQty})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* CRITICAL: MODEL NUMBER & SERIAL NUMBER EDITABLE INPUTS */}
              <div className={`p-4 rounded-2xl border space-y-3 ${
                isDayMode ? 'bg-sky-50/50 border-sky-200' : 'bg-slate-950/80 border-sky-500/30'
              }`}>
                <div className="text-xs font-bold text-sky-400 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Barcode className="w-4 h-4 text-sky-400" />
                    <span>मॉडेल आणि सिरीयल नंबर नोंद (Model & Serial Tracking)</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    (वॉरंटी व बिल हमीसाठी अनिवार्य)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Model Number */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1">
                      <Tag className="w-3 h-3 text-amber-400" /> मॉडेल नाव / नंबर (Model No.)
                    </label>
                    <input
                      type="text"
                      value={modelName}
                      onChange={(e) => setModelName(e.target.value)}
                      placeholder="उदा. QA43Q60BAK / 55UQ8000 / Royal-311"
                      className={`w-full px-3 py-2 rounded-xl border text-xs font-mono font-bold outline-none focus:ring-1 focus:ring-sky-500 ${
                        isDayMode ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700 text-white'
                      }`}
                    />
                  </div>

                  {/* Serial Number */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-300 font-semibold flex items-center gap-1">
                        <Barcode className="w-3 h-3 text-cyan-400" /> सिरीयल नंबर / IMEI (Serial No.) *
                      </label>
                      <button
                        type="button"
                        onClick={handleGenerateSerial}
                        className="text-[10px] text-teal-400 hover:underline flex items-center gap-0.5"
                      >
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>ऑटो जनरेट</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      value={serialNo}
                      onChange={(e) => setSerialNo(e.target.value)}
                      placeholder="उदा. 602NRZX294301 (बॉक्सवरील बारकोड नंबर)"
                      className={`w-full px-3 py-2 rounded-xl border text-xs font-mono font-bold outline-none focus:ring-1 focus:ring-teal-500 ${
                        isDayMode ? 'bg-white border-slate-300 text-teal-800' : 'bg-slate-900 border-slate-700 text-teal-300'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Amount, Payment Mode & Paying Now */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    एकूण बिल रक्कम (Total ₹) *
                  </label>
                  <input
                    type="number"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-bold font-mono outline-none ${
                      isDayMode ? 'bg-slate-50 border-slate-300' : 'bg-slate-950 border-slate-700'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    आत्ता जमा रक्कम (Paid Now ₹)
                  </label>
                  <input
                    type="number"
                    value={payingNow}
                    onChange={(e) => setPayingNow(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-bold font-mono text-emerald-400 outline-none ${
                      isDayMode ? 'bg-slate-50 border-slate-300' : 'bg-slate-950 border-slate-700'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    पेमेंट मोड (Payment Mode)
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e: any) => setPaymentMode(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold outline-none ${
                      isDayMode ? 'bg-slate-50 border-slate-300' : 'bg-slate-950 border-slate-700 text-white'
                    }`}
                  >
                    <option value="UPI">Google Pay / PhonePe (UPI)</option>
                    <option value="Cash">रोख (Cash)</option>
                    <option value="Card">Debit / Credit Card</option>
                    <option value="Credit">उधारी (Credit / Khata)</option>
                    <option value="Scheme">३०-महिने योजना जमा</option>
                  </select>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        {!isSaved && (
          <div
            className={`p-4 sm:p-5 border-t flex flex-col sm:flex-row items-center justify-between gap-3 ${
              isDayMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}
          >
            <button
              onClick={handleTransferToAddEntry}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center justify-center gap-1.5 transition text-xs cursor-pointer"
            >
              <span>संपूर्ण Add Entry मध्ये उघडा</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={onClose}
                className="flex-1 sm:flex-initial px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition text-xs font-semibold cursor-pointer"
              >
                रद्द करा
              </button>
              <button
                onClick={handleSaveOrderToBill}
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition shadow-lg flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>बिल अंतिम करा व पावती बनवा</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
