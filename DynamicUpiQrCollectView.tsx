import React, { useState, useEffect, useMemo } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  Smartphone,
  CheckCircle2,
  Copy,
  Printer,
  Share2,
  Search,
  Sparkles,
  Wallet,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  MessageCircle,
  Building2,
  Receipt
} from 'lucide-react';
import { StoreData, Customer, Transaction } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { StorageService } from '../../services/storageService';

interface DynamicUpiQrCollectViewProps {
  storeData: StoreData;
  onRefreshData?: () => void;
}

export const DynamicUpiQrCollectView: React.FC<DynamicUpiQrCollectViewProps> = ({
  storeData,
  onRefreshData,
}) => {
  const { isDayMode } = useTheme();

  // Primary UPI Config
  const defaultUpi = storeData.settings.bankDetails?.upiId || '8766486915@upi';
  const payeeName = storeData.settings.businessNameHindi || storeData.settings.storeName || 'Shri Sai Enterprises';

  const [upiId, setUpiId] = useState<string>(defaultUpi);
  const [amount, setAmount] = useState<string>('500');
  const [note, setNote] = useState<string>('दुकान खरेदी / योजना हप्ता');
  const [customerSearch, setCustomerSearch] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isLoggedSuccess, setIsLoggedSuccess] = useState(false);

  // Construct NPCI Standard UPI Pay URL
  const upiPayString = useMemo(() => {
    const cleanAmount = parseFloat(amount) || 0;
    const params = new URLSearchParams();
    params.set('pa', upiId.trim());
    params.set('pn', payeeName);
    if (cleanAmount > 0) {
      params.set('am', cleanAmount.toFixed(2));
    }
    params.set('cu', 'INR');
    params.set('tn', note.trim() || 'Payment to Shri Sai Enterprises');
    return `upi://pay?${params.toString()}`;
  }, [upiId, payeeName, amount, note]);

  // Generate QR code canvas / data URL
  useEffect(() => {
    QRCode.toDataURL(upiPayString, {
      width: 320,
      margin: 1.5,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('QR generation error:', err));
  }, [upiPayString]);

  // Filter customers for auto-due fill
  const matchingCustomers = useMemo(() => {
    if (!customerSearch.trim()) return [];
    const q = customerSearch.toLowerCase();
    return storeData.customers
      .filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q))
      .slice(0, 5);
  }, [storeData.customers, customerSearch]);

  const handleSelectCustomer = (c: Customer) => {
    setSelectedCustomer(c);
    if (c.currentBalance > 0) {
      setAmount(String(c.currentBalance));
    }
    setNote(`उधारी वसुली - ${c.name}`);
    setCustomerSearch('');
  };

  const handleCopyUpiLink = () => {
    navigator.clipboard.writeText(upiPayString);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleSendWhatsApp = () => {
    const phone = selectedCustomer?.phone || '';
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const cleanAmount = parseFloat(amount) || 0;

    let msg = `*श्री साई एंटरप्रायझेस, वर्धा*\n`;
    msg += `(Electronics & Teakwood Furniture Showroom)\n`;
    msg += `📍 मातोश्री सभागृह समोर, आर्वी रोड, पंजाब कॉलनी, वर्धा - ४४२००१\n`;
    msg += `--------------------------------\n`;
    if (selectedCustomer) {
      msg += `👤 आदरणीय ग्राहक: *${selectedCustomer.name}*\n`;
    }
    msg += `💰 देय रक्कम: *₹${cleanAmount.toLocaleString('en-IN')}*\n`;
    msg += `📝 संदर्भ: ${note}\n`;
    msg += `--------------------------------\n`;
    msg += `📲 खालील सुरक्षित UPI लिंकवर क्लिक करून PhonePe / Google Pay / Paytm द्वारे लगेच पेमेंट करा:\n`;
    msg += `${upiPayString}\n\n`;
    msg += `कॉल / WhatsApp हेल्पलाइन: 8766486915 / 8600122978\n`;
    msg += `धन्यवाद!`;

    const targetUrl = cleanPhone.length >= 10
      ? `https://wa.me/91${cleanPhone.slice(-10)}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;

    window.open(targetUrl, '_blank');
  };

  // Instant 1-Click "Mark as Paid & Generate Receipt"
  const handleMarkPaymentReceived = () => {
    const cleanAmount = parseFloat(amount) || 0;
    if (cleanAmount <= 0) return;

    const receiptNo = (storeData.settings.nextReceiptNo || 1083) + 1;
    const nowIso = new Date().toISOString().slice(0, 10);

    const newReceipt = {
      id: `rcpt-${Date.now()}`,
      receiptNo,
      customerId: selectedCustomer?.id || 'walk-in',
      customerName: selectedCustomer?.name || 'काउंटर थेट ग्राहक (Counter UPI)',
      amountPaid: cleanAmount,
      date: nowIso,
      paymentMode: 'UPI' as const,
      balanceRemaining: Math.max(0, (selectedCustomer?.currentBalance || 0) - cleanAmount),
      remarks: `Dynamic UPI Payment - ${note}`,
      handledBy: 'Counter QR Terminal',
    };

    // Update customer balance if linked
    let updatedCustomers = storeData.customers;
    if (selectedCustomer) {
      updatedCustomers = storeData.customers.map((c) => {
        if (c.id === selectedCustomer.id) {
          return {
            ...c,
            currentBalance: Math.max(0, c.currentBalance - cleanAmount),
          };
        }
        return c;
      });
    }

    const updatedData: StoreData = {
      ...storeData,
      billReceipts: [newReceipt, ...storeData.billReceipts],
      customers: updatedCustomers,
      settings: {
        ...storeData.settings,
        nextReceiptNo: receiptNo,
      },
    };

    StorageService.saveData(updatedData);
    setIsLoggedSuccess(true);
    if (onRefreshData) onRefreshData();

    setTimeout(() => {
      setIsLoggedSuccess(false);
      setAmount('');
      setSelectedCustomer(null);
    }, 4000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div
        className={`p-4 sm:p-6 rounded-2xl border transition-all ${
          isDayMode
            ? 'bg-gradient-to-r from-purple-50 via-indigo-50 to-sky-50 border-purple-200 text-slate-800 shadow-sm'
            : 'bg-gradient-to-r from-[#170e2b] via-[#0d1624] to-[#0c1829] border-purple-500/30 text-white shadow-xl'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black tracking-wider uppercase bg-purple-500 text-white">
                Live QR Engine
              </span>
              <span className="text-xs text-purple-400 font-semibold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                NPCI डायनॅमिक काउंटर UPI कोड
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              डायनॅमिक UPI QR कोड व पेमेंट कलेक्टर (Counter Dynamic QR Hub)
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-300 mt-1">
              काऊंटरवर येणाऱ्या ग्राहकांसाठी थेट नेमकी रक्कम असलेला PhonePe / Google Pay / Paytm QR कोड एका सेकंदात!
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>काऊंटर स्टँडी प्रिंट (Print Standee)</span>
            </button>
          </div>
        </div>
      </div>

      {isLoggedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-lg animate-fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
          <span>
            पेमेंट यशस्वीरित्या जमा नोंदवले गेले! पावती #{storeData.settings.nextReceiptNo} तयार झाली आणि ग्राहक खात्यातून रक्कम वजा झाली.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Amount, Customer Search & Config */}
        <div className="lg:col-span-7 space-y-5">
          {/* Amount Keypad & Preset Pills */}
          <div
            className={`p-5 rounded-2xl border transition-all ${
              isDayMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0f172a] border-slate-800 shadow-xl'
            }`}
          >
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              पेमेंट रक्कम (Enter Amount to Collect)
            </label>

            <div className="relative mb-3">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-400">
                ₹
              </span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full pl-10 pr-4 py-3.5 rounded-xl border text-3xl font-black font-mono bg-black/5 dark:bg-black/30 border-slate-300 dark:border-slate-700 text-purple-400 outline-none focus:border-purple-500"
              />
            </div>

            {/* Quick Amount Pills */}
            <div className="flex items-center gap-2 flex-wrap mb-4">
              <span className="text-xs text-slate-400 font-bold">त्वरित रक्कम:</span>
              {[
                { label: '₹१०० (योजना १)', val: '100' },
                { label: '₹२०० (योजना २)', val: '200' },
                { label: '₹५००', val: '500' },
                { label: '₹१,००० (महिना)', val: '1000' },
                { label: '₹२,०००', val: '2000' },
                { label: '₹५,००० (ॲडव्हान्स)', val: '5000' },
                { label: '₹१०,०००', val: '10000' },
              ].map((pill) => (
                <button
                  key={pill.val}
                  type="button"
                  onClick={() => setAmount(pill.val)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition cursor-pointer border ${
                    amount === pill.val
                      ? 'bg-purple-600 text-white border-purple-500'
                      : isDayMode
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* Customer Search (for pulling exact balance) */}
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <label className="block text-xs font-bold text-slate-400">
                ग्राहकाचे नाव किंवा मोबाईल नंबर (पर्यायी - उधारी खेचण्यासाठी):
              </label>

              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="उदा. राहुल, सचिन, 8766..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border text-xs bg-black/5 dark:bg-black/30 border-slate-300 dark:border-slate-700 outline-none"
                />
              </div>

              {/* Suggestions */}
              {matchingCustomers.length > 0 && (
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-700 space-y-1">
                  {matchingCustomers.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => handleSelectCustomer(c)}
                      className="p-2 rounded-lg hover:bg-slate-800 flex items-center justify-between cursor-pointer text-xs"
                    >
                      <div>
                        <span className="font-bold text-white">{c.name}</span>
                        <span className="text-slate-400 ml-2 font-mono">({c.phone})</span>
                      </div>
                      <span className="font-mono font-bold text-amber-400">
                        शिल्लक: ₹{c.currentBalance.toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {selectedCustomer && (
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-purple-300">निवडलेला ग्राहक: {selectedCustomer.name}</span>
                    <p className="text-slate-400 font-mono">फोन: {selectedCustomer.phone} • एकूण उधारी: ₹{selectedCustomer.currentBalance}</p>
                  </div>
                  <button
                    onClick={() => setSelectedCustomer(null)}
                    className="text-xs text-rose-400 hover:underline cursor-pointer"
                  >
                    काढून टाका
                  </button>
                </div>
              )}
            </div>

            {/* Note & UPI ID settings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-200 dark:border-slate-800 mt-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  व्यवहार संदर्भ / टीप (Note):
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="उदा. बिल #1052"
                  className="w-full px-3 py-2 rounded-xl border text-xs bg-black/5 dark:bg-black/30 border-slate-300 dark:border-slate-700 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  दुकान UPI आयडी (Store VPA):
                </label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border text-xs font-mono bg-black/5 dark:bg-black/30 border-slate-300 dark:border-slate-700 outline-none text-purple-400"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons: WhatsApp Payment Link & Mark Received */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleSendWhatsApp}
              className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>व्हॉट्सॲपवर UPI लिंक पाठवा</span>
            </button>

            <button
              onClick={handleMarkPaymentReceived}
              className="py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
            >
              <Receipt className="w-4 h-4" />
              <span>पेमेंट मिळाले - पावती बनवा (Receipt)</span>
            </button>
          </div>
        </div>

        {/* Right Column (5 cols): The High-Visibility Counter Standee Display */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div
            className={`w-full max-w-[360px] p-6 rounded-3xl border-2 flex flex-col items-center text-center shadow-2xl relative ${
              isDayMode
                ? 'bg-white border-purple-300 text-slate-900 shadow-purple-500/10'
                : 'bg-gradient-to-b from-[#13172e] via-[#0b1020] to-[#070914] border-purple-500/40 text-white shadow-2xl'
            }`}
          >
            {/* Header Brand */}
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1.5 rounded-full bg-purple-500/20 text-purple-400">
                <Building2 className="w-4 h-4" />
              </span>
              <span className="font-serif font-black tracking-wide text-sm text-purple-400 uppercase">
                SHRI SAI ENTERPRISES
              </span>
            </div>

            <p className="text-[11px] text-slate-400 mb-3">
              Electronics, Appliances & Teakwood Furniture, Wardha
            </p>

            {/* Dynamic Amount Banner */}
            <div className="w-full py-2.5 px-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 mb-4">
              <span className="text-[11px] text-slate-400 block uppercase font-bold">स्वीकारायची रक्कम:</span>
              <span className="text-3xl font-black font-mono text-purple-400">
                ₹{parseFloat(amount || '0').toLocaleString('en-IN')}
              </span>
            </div>

            {/* Live QR Code Box */}
            <div className="p-3 bg-white rounded-2xl shadow-xl border-4 border-slate-900/10 mb-4">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="UPI QR Code"
                  className="w-56 h-56 object-contain rounded-lg"
                />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center text-slate-400 text-xs">
                  QR तयार होत आहे...
                </div>
              )}
            </div>

            {/* UPI Brand Logos Strip */}
            <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              <span>BHIM UPI</span> • <span>GPay</span> • <span>PhonePe</span> • <span>Paytm</span>
            </div>

            <p className="text-[11px] text-slate-400 font-mono">
              VPA: <strong className="text-white">{upiId}</strong>
            </p>

            {/* Copy UPI Link button */}
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 w-full flex items-center justify-between text-xs">
              <button
                onClick={handleCopyUpiLink}
                className="text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedLink ? 'लिंक कॉपी झाली!' : 'UPI लिंक कॉपी करा'}</span>
              </button>

              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                100% सुरक्षित
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
