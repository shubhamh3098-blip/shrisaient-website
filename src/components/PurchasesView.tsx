import React, { useState } from 'react';
import {
  ShoppingCart,
  Plus,
  Calendar,
  DollarSign,
  Building2,
  ExternalLink,
  Download,
  Eye,
  Printer,
  FileText,
  CheckCircle2,
  Tag,
  Hash,
  Truck
} from 'lucide-react';
import { PurchaseEntry, Dealer, BusinessSettings } from '../types';
import { exportPurchasesToCsv } from '../utils/csvExporter';
import { PurchaseInvoiceModal } from './PurchaseInvoiceModal';

interface PurchasesViewProps {
  purchases: PurchaseEntry[];
  dealers?: Dealer[];
  onAddPurchase: (purchase: Omit<PurchaseEntry, 'id'>) => void;
  onNavigateDealerLedger?: (dealerName?: string) => void;
  settings?: BusinessSettings;
}

export const PurchasesView: React.FC<PurchasesViewProps> = ({
  purchases,
  dealers = [],
  onAddPurchase,
  onNavigateDealerLedger,
  settings,
}) => {
  const effectiveSettings: BusinessSettings = settings || {
    businessName: 'SHRI SAI ENTERPRISES',
    address: 'Ward No 1, Near Datey Sabhagruh, Arvi Road, Wardha 442001',
    phone: '8600122978',
    email: 'shrisaienterprises@gmail.com',
    gstin: '27ALOPL0030G2ZC',
    ownerName: 'Admin',
    domainName: 'shrisaielectronics.in',
    role: 'Owner',
    invoicePrefix: 'SSE',
    currency: '₹',
    tagline: 'Electronics & Home Appliances',
  };
  const [showModal, setShowModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<PurchaseEntry | null>(null);

  // Form mode: Simple or Full GST Tax Invoice
  const [isFullGstMode, setIsFullGstMode] = useState(true);

  // Purchase Form fields
  const [supplierName, setSupplierName] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [supplierAddress, setSupplierAddress] = useState('');
  const [supplierGstin, setSupplierGstin] = useState('');
  const [billNo, setBillNo] = useState('');
  const [poNo, setPO] = useState('');
  const [poDate, setPODate] = useState('');
  const [items, setItems] = useState('');
  const [hsn, setHsn] = useState('84182100');
  const [quantity, setQuantity] = useState<number>(1);
  const [rate, setRate] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(18); // 9% CGST + 9% SGST
  const [serialNumbersText, setSerialNumbersText] = useState('');
  const [transporter, setTransporter] = useState('GENERAL TRANSPORT');
  const [ewayBillNo, setEwayBillNo] = useState('');

  // Bank fields
  const [bankName, setBankName] = useState('');
  const [accountNo, setAccountNo] = useState('');
  const [ifsc, setIfsc] = useState('');

  // Amount fields
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'Online' | 'Cheque'>('Online');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const totalPurchases = purchases.reduce((acc, p) => acc + (p.totalAmount || 0), 0);
  const totalPaid = purchases.reduce((acc, p) => acc + (p.paidAmount || 0), 0);
  const totalDueToSuppliers = Math.max(0, totalPurchases - totalPaid);

  // Auto-fill template when supplier is Manisha Enterprises
  const handleSelectPreset = (type: 'manisha' | 'generic') => {
    if (type === 'manisha') {
      setSupplierName('MANISHA ENTERPRISES');
      setSupplierAddress('INGOLE CHOWK MAIN ROAD WARDHA 442001 MAHARASHTRA');
      setSupplierPhone('9766911693');
      setSupplierGstin('27ABDPB8956C1ZS');
      setBillNo(`CS/2526/0${Math.floor(1000 + Math.random() * 9000)}`);
      setPO('CSSO2526-00579');
      setPODate('2026-02-23');
      setItems('LG GLT2216WYRI Refrigerator');
      setHsn('84182100');
      setQuantity(2);
      setRate(21592);
      setDiscount(0);
      setTaxRate(18);
      setTotalAmount(50956);
      setPaidAmount(50956);
      setSerialNumbersText('602NRZX294301, 602NRQV293652');
      setTransporter('GENERAL TRANSPORT');
      setBankName('ICICI BANK, ARVI ROAD, WARDHA');
      setAccountNo('108051000302');
      setIfsc('ICIC0001080');
      setPaymentMode('Online');
    }
  };

  // Recalculate full GST totals when rate, qty, or tax changes
  const handleRateOrQtyChange = (newRate: number, newQty: number, newDisc: number, newTaxRate: number) => {
    const taxable = Math.max(0, newRate * newQty - newDisc);
    const taxAmt = Math.round(taxable * (newTaxRate / 100));
    const grand = taxable + taxAmt;
    setTotalAmount(grand);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim() || totalAmount <= 0) return;

    const status =
      paidAmount >= totalAmount
        ? 'Paid'
        : paidAmount > 0
        ? 'Partial'
        : 'Pending';

    const serials = serialNumbersText
      .split(/[,;\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    const taxableVal = Math.round((totalAmount / (1 + taxRate / 100)));
    const halfTax = Math.round((totalAmount - taxableVal) / 2);

    const lineItem = {
      description: items.trim() || 'Purchased Materials',
      hsn: hsn.trim() || '84182100',
      quantity: quantity || 1,
      rate: rate || taxableVal,
      discount: discount || 0,
      taxableAmount: taxableVal,
      cgstRate: taxRate / 2,
      cgstAmount: halfTax,
      sgstRate: taxRate / 2,
      sgstAmount: halfTax,
      totalAmount: totalAmount,
      serialNumbers: serials,
    };

    onAddPurchase({
      billNo: billNo.trim() || `PUR-${Date.now().toString().slice(-4)}`,
      date,
      supplierName: supplierName.trim(),
      supplierAddress: supplierAddress.trim() || undefined,
      supplierPhone: supplierPhone.trim() || undefined,
      supplierGstin: supplierGstin.trim() || undefined,
      poNo: poNo.trim() || undefined,
      poDate: poDate.trim() || undefined,
      location: 'LG DISTRIBUTION',
      items: items.trim() || 'Purchased Electronics Goods',
      lineItems: [lineItem],
      taxableAmount: taxableVal,
      cgstAmount: halfTax,
      sgstAmount: halfTax,
      totalAmount,
      paidAmount,
      status,
      paymentMode,
      transporter: transporter.trim() || undefined,
      ewayBillNo: ewayBillNo.trim() || undefined,
      bankDetails: bankName ? {
        bankName,
        accountName: supplierName.trim(),
        accountNo,
        ifsc,
      } : undefined,
      notes: notes.trim() || (serials.length > 0 ? `Serials: ${serials.join(', ')}` : undefined),
    });

    // Reset
    setSupplierName('');
    setSupplierPhone('');
    setSupplierAddress('');
    setSupplierGstin('');
    setBillNo('');
    setPO('');
    setItems('');
    setSerialNumbersText('');
    setTotalAmount(0);
    setPaidAmount(0);
    setShowModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <ShoppingCart className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              खरेदी व माल आवक (Purchases & Invoices)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            अधिकृत जीएसटी कर बीजक (Official GST Tax Invoices), सिरीयल क्रमांक (Serial Nos), आणि डीलर खातेवही.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => exportPurchasesToCsv(purchases)}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-semibold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            title="Download all purchases in CSV / Excel format"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            Export CSV
          </button>

          {onNavigateDealerLedger && (
            <button
              onClick={() => onNavigateDealerLedger()}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              डीलर लेजर (Dealer Khata)
            </button>
          )}

          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            + नवीन खरेदी बिल (Add Purchase Bill)
          </button>
        </div>
      </div>

      {/* Featured Supplier Notice: MANISHA ENTERPRISES Sample Tax Invoice */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 border border-blue-700/50">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/40 text-blue-300 flex items-center justify-center shrink-0 mt-0.5">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-400/30">
                नमुना खरेदी इनव्हॉइस (Sample Tax Invoice)
              </span>
              <span className="text-xs text-blue-200">CS/2526/01604</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold mt-1">
              MANISHA ENTERPRISES (LG DISTRIBUTION, WARDHA)
            </h3>
            <p className="text-xs text-slate-300 max-w-2xl mt-0.5">
              LG GLT2216WYRI Refrigerator (HSN: 84182100, Serials: 602NRZX294301, 602NRQV293652).
              एकूण बिल: ₹50,956 (Taxable ₹43,183 + CGST ₹3,886 + SGST ₹3,886).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
          {purchases.find((p) => p.billNo === 'CS/2526/01604') ? (
            <button
              onClick={() => {
                const sample = purchases.find((p) => p.billNo === 'CS/2526/01604');
                if (sample) setSelectedInvoice(sample);
              }}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>हे कर बीजक प्रत्यक्ष पाहा व प्रिंट करा</span>
            </button>
          ) : (
            <button
              onClick={() => {
                handleSelectPreset('manisha');
                setShowModal(true);
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Manisha Enterprises इनव्हॉइस लोड करा</span>
            </button>
          )}

          {onNavigateDealerLedger && (
            <button
              onClick={() => onNavigateDealerLedger('MANISHA ENTERPRISES')}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition flex items-center gap-1 cursor-pointer border border-white/20"
            >
              खातेवही (Khata)
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">एकूण खरेदी (Total Procured Goods)</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono-num">
            ₹{totalPurchases.toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">वितरकांना दिलेली रक्कम (Total Paid)</p>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono-num">
            ₹{totalPaid.toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">बाकी देणी (Pending Payables)</p>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 font-mono-num">
            ₹{totalDueToSuppliers.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Purchases Table with Full Invoice View Action */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4">बीजक क्र. / दिनांक (Bill & Date)</th>
                <th className="py-3 px-4">वितरक (Supplier / Vendor)</th>
                <th className="py-3 px-4">वस्तू / सिरीयल नंबर्स (Items & Serials)</th>
                <th className="py-3 px-4 text-right">करपात्र (Taxable)</th>
                <th className="py-3 px-4 text-right">एकूण बिल (Total ₹)</th>
                <th className="py-3 px-4 text-right">जमा (Paid ₹)</th>
                <th className="py-3 px-4 text-center">स्थिती (Status)</th>
                <th className="py-3 px-4 text-center">कृती (Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {purchases.map((p) => {
                const hasSerials =
                  (p.lineItems?.[0]?.serialNumbers && p.lineItems[0].serialNumbers.length > 0) ||
                  p.notes?.includes('602NRZX');

                const serialsList = p.lineItems?.[0]?.serialNumbers || [];

                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900 dark:text-white font-mono text-sm">{p.billNo}</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">{p.date}</p>
                      {p.poNo && (
                        <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">
                          PO: {p.poNo}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 dark:text-white block text-sm">
                        {p.supplierName}
                      </span>
                      {p.supplierGstin && (
                        <span className="font-mono text-[10px] text-slate-500 block">
                          GST: {p.supplierGstin}
                        </span>
                      )}
                      {p.supplierName.toLowerCase().includes('manisha') && (
                        <span className="inline-block mt-1 px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 text-[10px] font-bold border border-blue-300 dark:border-blue-800">
                          LG Distribution
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 max-w-sm">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{p.items}</p>
                      {serialsList.length > 0 ? (
                        <div className="mt-1 flex flex-wrap gap-1">
                          <span className="text-[10px] font-bold text-slate-500">Serials:</span>
                          {serialsList.map((sn, idx) => (
                            <span
                              key={idx}
                              className="font-mono text-[10px] bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 px-1.5 py-0.2 rounded font-bold"
                            >
                              {sn}
                            </span>
                          ))}
                        </div>
                      ) : p.notes ? (
                        <p className="text-[10px] text-slate-500 truncate max-w-xs mt-0.5">{p.notes}</p>
                      ) : null}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-600 dark:text-slate-300">
                      ₹{(p.taxableAmount || Math.round(p.totalAmount / 1.18)).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-slate-900 dark:text-white font-mono-num text-sm">
                      ₹{p.totalAmount.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400 font-mono-num">
                      ₹{p.paidAmount.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          p.status === 'Paid'
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : p.status === 'Partial'
                            ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                            : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedInvoice(p)}
                          className="px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-xs transition flex items-center gap-1 cursor-pointer border border-blue-200 dark:border-blue-800 shadow-2xs"
                          title="View Official Purchase Tax Invoice (कर बीजक पाहा व प्रिंट करा)"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>पाहा / प्रिंट</span>
                        </button>
                        {onNavigateDealerLedger && (
                          <button
                            onClick={() => onNavigateDealerLedger(p.supplierName)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                            title={`View ${p.supplierName} ledger`}
                          >
                            <Building2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Purchase Invoice Modal */}
      {selectedInvoice && (
        <PurchaseInvoiceModal
          purchase={selectedInvoice}
          settings={effectiveSettings}
          onClose={() => setSelectedInvoice(null)}
        />
      )}

      {/* Add Purchase Bill Modal (Rich GST Purchase Format) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  अधिकृत जीएसटी खरेदी बीजक नोंद (Official GST Purchase Bill)
                </h3>
                <p className="text-xs text-slate-500">
                  डीलर लेजर आणि इन्व्हेंटरी आपोआप अपडेट केली जाते.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-bold cursor-pointer text-lg"
              >
                ✕
              </button>
            </div>

            {/* Presets Quick Fill */}
            <div className="bg-blue-50 dark:bg-blue-950/40 p-2.5 rounded-xl border border-blue-200 dark:border-blue-900 flex items-center justify-between gap-2 text-xs">
              <span className="font-bold text-blue-900 dark:text-blue-200">
                ⚡ नमुना वितरक झटपट भरा:
              </span>
              <button
                type="button"
                onClick={() => handleSelectPreset('manisha')}
                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition cursor-pointer"
              >
                MANISHA ENTERPRISES (LG Sample)
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Supplier Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    वितरक / डीलर नाव (Supplier Name) *
                  </label>
                  <input
                    type="text"
                    required
                    list="dealers-list"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    placeholder="उदा. MANISHA ENTERPRISES"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-xs font-bold"
                  />
                  <datalist id="dealers-list">
                    {dealers.map((d) => (
                      <option key={d.id} value={d.name} />
                    ))}
                    <option value="MANISHA ENTERPRISES" />
                    <option value="Polycab Distributors Ltd." />
                    <option value="Anchor Switchgear Pvt Ltd" />
                  </datalist>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    वितरक GSTIN / UIN
                  </label>
                  <input
                    type="text"
                    value={supplierGstin}
                    onChange={(e) => setSupplierGstin(e.target.value)}
                    placeholder="उदा. 27ABDPB8956C1ZS"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              {/* Invoice No & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    कर बीजक क्र. (Tax Invoice No) *
                  </label>
                  <input
                    type="text"
                    required
                    value={billNo}
                    onChange={(e) => setBillNo(e.target.value)}
                    placeholder="उदा. CS/2526/01604"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    बीजक दिनांक (Invoice Date)
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    PO No (ऑर्डर क्र.)
                  </label>
                  <input
                    type="text"
                    value={poNo}
                    onChange={(e) => setPO(e.target.value)}
                    placeholder="उदा. CSSO2526-00579"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              {/* Product Model & HSN */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    वस्तू / मॉडेल नाव (Description / Model) *
                  </label>
                  <input
                    type="text"
                    required
                    value={items}
                    onChange={(e) => setItems(e.target.value)}
                    placeholder="उदा. LG GLT2216WYRI Refrigerator"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    HSN Code
                  </label>
                  <input
                    type="text"
                    value={hsn}
                    onChange={(e) => setHsn(e.target.value)}
                    placeholder="84182100"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              {/* Quantity, Rate, Tax Rate */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    नग (Qty)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => {
                      const q = parseInt(e.target.value) || 1;
                      setQuantity(q);
                      handleRateOrQtyChange(rate, q, discount, taxRate);
                    }}
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    दर / युनिट दर (Rate ₹)
                  </label>
                  <input
                    type="number"
                    value={rate || ''}
                    onChange={(e) => {
                      const r = parseFloat(e.target.value) || 0;
                      setRate(r);
                      handleRateOrQtyChange(r, quantity, discount, taxRate);
                    }}
                    placeholder="21592"
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    GST दर (% Tax)
                  </label>
                  <select
                    value={taxRate}
                    onChange={(e) => {
                      const tr = parseFloat(e.target.value) || 18;
                      setTaxRate(tr);
                      handleRateOrQtyChange(rate, quantity, discount, tr);
                    }}
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-lg font-semibold"
                  >
                    <option value={18}>18% (9% CGST + 9% SGST)</option>
                    <option value={28}>28% (14% CGST + 14% SGST)</option>
                    <option value={12}>12% (6% CGST + 6% SGST)</option>
                    <option value={5}>5% (2.5% CGST + 2.5% SGST)</option>
                    <option value={0}>0% (Exempted)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    एकूण करपात्र बिल (Total ₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={totalAmount || ''}
                    onChange={(e) => setTotalAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 border border-blue-400 bg-white dark:bg-slate-800 rounded-lg font-mono font-black text-sm text-blue-900 dark:text-blue-200"
                  />
                </div>
              </div>

              {/* Serial Numbers / Barcodes / IMEI */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  सिरीयल क्रमांक / बारकोड (Serial Numbers / IMEI)
                </label>
                <input
                  type="text"
                  value={serialNumbersText}
                  onChange={(e) => setSerialNumbersText(e.target.value)}
                  placeholder="उदा. 602NRZX294301, 602NRQV293652 (स्वल्पविरामाने वेगळे करा)"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-xs font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-0.5">
                  प्रत्येक उपकरणाचा सिरीयल नंबर इनव्हॉइस व वॉरंटी पडताळणीसाठी प्रिंट केला जाईल.
                </p>
              </div>

              {/* Payment details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    आताच दिलेली रक्कम (Paid Now ₹)
                  </label>
                  <input
                    type="number"
                    value={paidAmount || ''}
                    onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                    placeholder="उदा. 50956"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    पेमेंट मोड (Payment Mode)
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-xs"
                  >
                    <option value="Online">Online / NEFT / RTGS</option>
                    <option value="Cash">Cash (रोख)</option>
                    <option value="Cheque">Cheque (धनादेश)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ट्रान्सपोर्टर (Transporter)
                  </label>
                  <input
                    type="text"
                    value={transporter}
                    onChange={(e) => setTransporter(e.target.value)}
                    placeholder="GENERAL TRANSPORT"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  रद्द करा (Cancel)
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-600/20 cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  खरेदी बिल सेव्ह करा व लेजर अद्ययावत करा
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
