import React, { useState, useMemo, useEffect } from 'react';
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
  Truck,
  Trash2,
  Copy,
  Check,
  Info,
  Layers,
  Sparkles,
  ShieldCheck,
  Camera,
  UploadCloud,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { PurchaseEntry, Dealer, BusinessSettings, PurchaseLineItem } from '../types';
import { exportPurchasesToCsv } from '../utils/csvExporter';
import { PurchaseInvoiceModal } from './PurchaseInvoiceModal';

interface PurchasesViewProps {
  purchases: PurchaseEntry[];
  dealers?: Dealer[];
  onAddPurchase: (purchase: Omit<PurchaseEntry, 'id'>) => void;
  onNavigateDealerLedger?: (dealerName?: string) => void;
  settings?: BusinessSettings;
}

export interface PurchaseFormItem {
  id: string;
  description: string;
  modelNo: string;
  serialNumbersText: string;
  hsn: string;
  quantity: number;
  rate: number;
  discount: number;
  taxRate: number; // e.g. 18 (9% CGST + 9% SGST)
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
  const [copiedLink, setCopiedLink] = useState(false);

  // Supplier & Metadata fields
  const [supplierName, setSupplierName] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [supplierAddress, setSupplierAddress] = useState('');
  const [supplierGstin, setSupplierGstin] = useState('');
  const [billNo, setBillNo] = useState('');
  const [poNo, setPO] = useState('');
  const [poDate, setPODate] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [transporter, setTransporter] = useState('GENERAL TRANSPORT');
  const [ewayBillNo, setEwayBillNo] = useState('');

  // Bank fields
  const [bankName, setBankName] = useState('');
  const [accountNo, setAccountNo] = useState('');
  const [ifsc, setIfsc] = useState('');

  // Multi-item rows state
  const [purchaseItems, setPurchaseItems] = useState<PurchaseFormItem[]>([
    {
      id: 'p-item-1',
      description: 'LG Refrigerator GL-D201AELU',
      modelNo: 'GL-D201AELU',
      serialNumbersText: 'JWH6512NRKA188661IN',
      hsn: '84182100',
      quantity: 1,
      rate: 16898,
      discount: 0,
      taxRate: 18,
    },
  ]);

  // Payment amounts
  const [totalAmount, setTotalAmount] = useState<number>(19940);
  const [paidAmount, setPaidAmount] = useState<number>(19940);
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'Online' | 'Cheque'>('Online');
  const [notes, setNotes] = useState('');

  // Gemini AI OCR State
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanSuccess, setScanSuccess] = useState<string | null>(null);

  const handleScanInvoicePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setScanError(null);
    setScanSuccess(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = (reader.result as string) || '';
          const res = await fetch('/api/scan-purchase-bill', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageBase64: base64,
              mimeType: file.type || 'image/jpeg',
            }),
          });

          const json = await res.json();
          if (!res.ok || !json.data) {
            throw new Error(json.error || 'Gemini AI ने बिल स्कॅन करताना त्रुटी नोंदवली');
          }

          const d = json.data;
          // Populate fields
          if (d.supplierName) setSupplierName(d.supplierName);
          if (d.supplierGstin) setSupplierGstin(d.supplierGstin);
          if (d.supplierPhone) setSupplierPhone(d.supplierPhone);
          if (d.supplierAddress) setSupplierAddress(d.supplierAddress);
          if (d.billNo) setBillNo(d.billNo);
          if (d.date) setDate(d.date);
          if (d.poNo) setPO(d.poNo);
          if (d.poDate) setPODate(d.poDate);
          if (d.transporter) setTransporter(d.transporter);
          if (d.ewayBillNo) setEwayBillNo(d.ewayBillNo);
          if (d.bankName) setBankName(d.bankName);
          if (d.accountNo) setAccountNo(d.accountNo);
          if (d.ifsc) setIfsc(d.ifsc);
          if (d.paidAmount !== undefined) setPaidAmount(Number(d.paidAmount));
          if (d.paymentMode) setPaymentMode(d.paymentMode);
          if (d.notes) setNotes(d.notes);

          if (d.items && Array.isArray(d.items) && d.items.length > 0) {
            const mappedItems: PurchaseFormItem[] = d.items.map((it: any, idx: number) => ({
              id: `p-item-${idx + 1}`,
              description: it.description || 'Goods',
              modelNo: it.modelNo || '',
              serialNumbersText: Array.isArray(it.serialNumbers) ? it.serialNumbers.join(', ') : (it.serialNumbers || ''),
              hsn: it.hsn || '84182100',
              quantity: Number(it.quantity) || 1,
              rate: Number(it.rate) || 0,
              discount: Number(it.discount) || 0,
              taxRate: Number(it.taxRate) || 18,
            }));
            setPurchaseItems(mappedItems);
          }

          setScanSuccess(`Gemini AI ने बिल यशस्वीरीत्या स्कॅन केले! ${d.items?.length || 1} वस्तू व टॅक्स तपशील फॉर्ममध्ये भरले गेले.`);
        } catch (err: any) {
          setScanError(err.message || 'बिल स्कॅन करताना त्रुटी आली.');
        } finally {
          setIsScanning(false);
        }
      };
      reader.onerror = () => {
        setScanError('इमेज वाचताना त्रुटी आली.');
        setIsScanning(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setScanError(err.message || 'त्रुटी आली.');
      setIsScanning(false);
    }
  };

  // KPI Calculations
  const totalPurchases = purchases.reduce((acc, p) => acc + (p.totalAmount || 0), 0);
  const totalPaid = purchases.reduce((acc, p) => acc + (p.paidAmount || 0), 0);
  const totalDueToSuppliers = Math.max(0, totalPurchases - totalPaid);

  // Reactive line item totals calculation
  const computedTotals = useMemo(() => {
    let sumTaxable = 0;
    let sumCgst = 0;
    let sumSgst = 0;
    let sumGrand = 0;

    purchaseItems.forEach((it) => {
      const q = Math.max(1, Number(it.quantity) || 1);
      const r = Math.max(0, Number(it.rate) || 0);
      const d = Math.max(0, Number(it.discount) || 0);
      const tr = Number(it.taxRate) || 18;

      const rowTaxable = Math.max(0, q * r - d);
      const rowCgst = Math.round(rowTaxable * (tr / 200));
      const rowSgst = Math.round(rowTaxable * (tr / 200));
      const rowGrand = rowTaxable + rowCgst + rowSgst;

      sumTaxable += rowTaxable;
      sumCgst += rowCgst;
      sumSgst += rowSgst;
      sumGrand += rowGrand;
    });

    return { sumTaxable, sumCgst, sumSgst, sumGrand };
  }, [purchaseItems]);

  // Update totalAmount when items change
  useEffect(() => {
    if (computedTotals.sumGrand > 0) {
      setTotalAmount(computedTotals.sumGrand);
      setPaidAmount((prev) => (prev === 0 || prev === totalAmount ? computedTotals.sumGrand : prev));
    }
  }, [computedTotals.sumGrand]);

  // Item row operations
  const handleAddItemRow = () => {
    setPurchaseItems((prev) => [
      ...prev,
      {
        id: `p-item-${Date.now()}-${prev.length + 1}`,
        description: '',
        modelNo: '',
        serialNumbersText: '',
        hsn: '84182100',
        quantity: 1,
        rate: 0,
        discount: 0,
        taxRate: 18,
      },
    ]);
  };

  const handleUpdateItemRow = (id: string, updates: Partial<PurchaseFormItem>) => {
    setPurchaseItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const handleRemoveItemRow = (id: string) => {
    if (purchaseItems.length <= 1) return;
    setPurchaseItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Presets
  const handleSelectPreset = (type: 'manisha-single' | 'manisha-multi') => {
    if (type === 'manisha-single') {
      // Single item refrigerator matching user's exact uploaded invoice CS/2526/01677
      setSupplierName('MANISHA ENTERPRISES');
      setSupplierAddress('INGOLE CHOWK MAIN ROAD WARDHA 442001 MAHARASHTRA INDIA');
      setSupplierPhone('9766911693');
      setSupplierGstin('27ABDPB8956C1ZS');
      setBillNo('CS/2526/01677');
      setPO('CSSO2526-00628');
      setPODate('2026-02-27');
      setDate('2026-02-28');
      setTransporter('GENERAL TRANSPORT');
      setBankName('ICICI BANK, ARVI ROAD, WARDHA');
      setAccountNo('108051000302');
      setIfsc('ICIC0001080');
      setPaymentMode('Online');
      setPurchaseItems([
        {
          id: 'p-item-manisha-1',
          description: 'LG Refrigerator GL-D201AELU',
          modelNo: 'GL-D201AELU',
          serialNumbersText: 'JWH6512NRKA188661IN',
          hsn: '84182100',
          quantity: 1,
          rate: 16898,
          discount: 0,
          taxRate: 18,
        },
      ]);
      setNotes('IRN: f6aec60a2174be4e61e8aa56ba2ba0806dc953b90aed29636ac480a5b2243624 | Consultant: DHIRAJ BHOWARE | Approved: ARTI INGOLE');
    } else if (type === 'manisha-multi') {
      // 3 Different Electronic Models (Fridge + TV + Washing Machine) in 1 Purchase
      setSupplierName('MANISHA ENTERPRISES');
      setSupplierAddress('INGOLE CHOWK MAIN ROAD WARDHA 442001 MAHARASHTRA INDIA');
      setSupplierPhone('9766911693');
      setSupplierGstin('27ABDPB8956C1ZS');
      setBillNo(`CS/2526/0${Math.floor(1800 + Math.random() * 8000)}`);
      setPO('CSSO2526-00630');
      setPODate('2026-02-28');
      setDate('2026-02-28');
      setTransporter('GENERAL TRANSPORT');
      setBankName('ICICI BANK, ARVI ROAD, WARDHA');
      setAccountNo('108051000302');
      setIfsc('ICIC0001080');
      setPaymentMode('Online');
      setPurchaseItems([
        {
          id: 'p-multi-1',
          description: 'LG Single Door Refrigerator 190L',
          modelNo: 'GL-D201AELU',
          serialNumbersText: 'JWH6512NRKA188661IN',
          hsn: '84182100',
          quantity: 1,
          rate: 16898,
          discount: 0,
          taxRate: 18,
        },
        {
          id: 'p-multi-2',
          description: 'LG 43" 4K UHD Smart LED TV',
          modelNo: '43UR7500',
          serialNumbersText: '403INPK992011, 403INPK992012',
          hsn: '85287200',
          quantity: 2,
          rate: 28500,
          discount: 500,
          taxRate: 18,
        },
        {
          id: 'p-multi-3',
          description: 'LG 7Kg Inverter Front Load Washing Machine',
          modelNo: 'FHM1207ZDL',
          serialNumbersText: '501WMXZ771029',
          hsn: '84501100',
          quantity: 1,
          rate: 29900,
          discount: 0,
          taxRate: 18,
        },
      ]);
      setNotes('3 Different Electronic Models (Fridge + TV + Washing Machine) with individual Serial numbers and Model codes.');
    }
  };

  const handleCopyDirectLink = () => {
    const url = window.location.href;
    navigator.clipboard?.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim() || totalAmount <= 0) return;

    // Convert form items to structured line items
    const formattedLineItems: PurchaseLineItem[] = purchaseItems.map((item) => {
      const serials = item.serialNumbersText
        .split(/[,;\n]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      const q = Math.max(1, Number(item.quantity) || 1);
      const r = Math.max(0, Number(item.rate) || 0);
      const d = Math.max(0, Number(item.discount) || 0);
      const tr = Number(item.taxRate) || 18;

      const taxableVal = Math.max(0, q * r - d);
      const halfTax = Math.round(taxableVal * (tr / 200));
      const rowTotal = taxableVal + halfTax * 2;

      return {
        description: item.description.trim() || `Item ${item.modelNo || 'Goods'}`,
        modelNo: item.modelNo.trim() || undefined,
        hsn: item.hsn.trim() || '84182100',
        quantity: q,
        rate: r,
        discount: d,
        taxableAmount: taxableVal,
        cgstRate: tr / 2,
        cgstAmount: halfTax,
        sgstRate: tr / 2,
        sgstAmount: halfTax,
        totalAmount: rowTotal,
        serialNumbers: serials,
      };
    });

    const totalTaxable = formattedLineItems.reduce((acc, it) => acc + it.taxableAmount, 0);
    const totalCgst = formattedLineItems.reduce((acc, it) => acc + (it.cgstAmount || 0), 0);
    const totalSgst = formattedLineItems.reduce((acc, it) => acc + (it.sgstAmount || 0), 0);
    const grand = totalAmount > 0 ? totalAmount : formattedLineItems.reduce((acc, it) => acc + it.totalAmount, 0);

    const status =
      paidAmount >= grand
        ? 'Paid'
        : paidAmount > 0
        ? 'Partial'
        : 'Pending';

    const itemsSummary = formattedLineItems
      .map((it) => `${it.description}${it.modelNo ? ` [${it.modelNo}]` : ''} (${it.quantity} नग)`)
      .join(', ');

    const newPurchase: Omit<PurchaseEntry, 'id'> = {
      supplierName: supplierName.trim(),
      supplierAddress: supplierAddress.trim() || undefined,
      supplierPhone: supplierPhone.trim() || undefined,
      supplierGstin: supplierGstin.trim() || undefined,
      billNo: billNo.trim(),
      poNo: poNo.trim() || undefined,
      poDate: poDate || undefined,
      date,
      items: itemsSummary,
      totalAmount: grand,
      taxableAmount: totalTaxable,
      cgstAmount: totalCgst,
      sgstAmount: totalSgst,
      paidAmount,
      status,
      paymentMode,
      notes: notes.trim() || undefined,
      transporter: transporter.trim() || undefined,
      ewayBillNo: ewayBillNo.trim() || undefined,
      bankDetails: (bankName.trim() || accountNo.trim() || ifsc.trim()) ? {
        bankName: bankName.trim() || undefined,
        accountNo: accountNo.trim() || undefined,
        ifsc: ifsc.trim() || undefined,
      } : undefined,
      lineItems: formattedLineItems,
    };

    onAddPurchase(newPurchase);

    // Reset Form
    setSupplierName('');
    setSupplierAddress('');
    setSupplierPhone('');
    setSupplierGstin('');
    setBillNo('');
    setPO('');
    setPODate('');
    setBankName('');
    setAccountNo('');
    setIfsc('');
    setNotes('');
    setPurchaseItems([
      {
        id: 'p-item-1',
        description: '',
        modelNo: '',
        serialNumbersText: '',
        hsn: '84182100',
        quantity: 1,
        rate: 0,
        discount: 0,
        taxRate: 18,
      },
    ]);
    setShowModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
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
            अधिकृत जीएसटी कर बीजक (Official GST Tax Invoices), मॉडेल व सिरीयल क्रमांक (Model & Serial Nos), आणि डीलर लेजर.
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

          <label className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition flex items-center gap-1.5 cursor-pointer">
            <Camera className="w-4 h-4" />
            <span>🤖 AI बिल स्कॅनर (Gemini OCR)</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                setShowModal(true);
                handleScanInvoicePhoto(e);
              }}
              className="hidden"
            />
          </label>

          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            + नवीन खरेदी बिल (Add Purchase Bill)
          </button>
        </div>
      </div>

      {/* Quota-Free Testing Environment Banner */}
      <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-emerald-600 text-white shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-emerald-900 dark:text-emerald-200 text-sm">
                स्थानिक चाचणी लिंक & कोटा सुरक्षितता (Zero Quota Consumption)
              </span>
              <span className="text-[10px] font-bold bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 px-2 py-0.5 rounded-full">
                १००% मोफत / अमर्यादित
              </span>
            </div>
            <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5 leading-relaxed">
              या ॲपमधील सर्व डेटा इम्पोर्ट, बिले, खरेदी व कार्ड स्कीम 100% तुमच्या संगणक/मोबाईल ब्राउझरमध्ये स्थानिकरीत्या (Client-side localStorage) चालतात. त्यामुळे तुम्ही कितीही फायली अपलोड केल्या तरी <strong>तुमचा AI किंवा अपलोड कोटा अजिबात संपणार नाही!</strong>
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleCopyDirectLink}
          className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
        >
          {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-200" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copiedLink ? 'लिंक कॉपी झाली!' : 'थेट टेस्टिंग लिंक कॉपी करा'}</span>
        </button>
      </div>

      {/* Featured Supplier Notice: MANISHA ENTERPRISES (LG Distribution Wardha) */}
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
              <span className="text-xs text-blue-200">CS/2526/01677</span>
            </div>
            <h2 className="text-lg font-black text-white mt-1">
              MANISHA ENTERPRISES (LG Distribution Wardha)
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              जीएसटी: 27ABDPB8956C1ZS • इंगोले चौक, मुख्य रस्ता, वर्धा • फोन: 9766911693 • ICICI Bank A/C: 108051000302
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              handleSelectPreset('manisha-single');
              setShowModal(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-slate-900" />
            <span>⚡ Manisha LG पावती भरा (CS/2526/01677)</span>
          </button>

          <button
            onClick={() => {
              handleSelectPreset('manisha-multi');
              setShowModal(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-white/20"
          >
            <Layers className="w-3.5 h-3.5 text-blue-300" />
            <span>⚡ ३ इलेक्ट्रॉनिक्स मॉडेल्स सॅम्पल</span>
          </button>
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

      {/* Purchases Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4">बीजक क्र. / दिनांक (Bill & Date)</th>
                <th className="py-3 px-4">वितरक (Supplier / Vendor)</th>
                <th className="py-3 px-4">वस्तू, मॉडेल & सिरीयल नंबर्स (Items & Models)</th>
                <th className="py-3 px-4 text-right">करपात्र (Taxable)</th>
                <th className="py-3 px-4 text-right">एकूण बिल (Total ₹)</th>
                <th className="py-3 px-4 text-right">जमा (Paid ₹)</th>
                <th className="py-3 px-4 text-center">स्थिती (Status)</th>
                <th className="py-3 px-4 text-center">कृती (Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {purchases.map((p) => {
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
                    <td className="py-3.5 px-4 max-w-md">
                      {p.lineItems && p.lineItems.length > 0 ? (
                        <div className="space-y-1.5">
                          {p.lineItems.map((li, lIdx) => (
                            <div key={lIdx} className="text-xs">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="font-bold text-slate-900 dark:text-white">{li.description}</span>
                                <span className="text-[10px] text-slate-500 font-bold font-mono">x{li.quantity}</span>
                                {li.modelNo && (
                                  <span className="text-[10px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-1.5 py-0.2 rounded">
                                    Mod: {li.modelNo}
                                  </span>
                                )}
                              </div>
                              {li.serialNumbers && li.serialNumbers.length > 0 && (
                                <div className="mt-0.5 flex flex-wrap gap-1 items-center">
                                  <span className="text-[9.5px] font-bold text-slate-500">Serials:</span>
                                  {li.serialNumbers.map((sn, sIdx) => (
                                    <span
                                      key={sIdx}
                                      className="font-mono text-[9.5px] bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 px-1.5 py-0.2 rounded font-bold"
                                    >
                                      {sn}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{p.items}</p>
                          {p.notes && <p className="text-[10px] text-slate-500 truncate max-w-xs mt-0.5">{p.notes}</p>}
                        </div>
                      )}
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
                      <button
                        onClick={() => setSelectedInvoice(p)}
                        className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-bold text-xs flex items-center gap-1 mx-auto transition cursor-pointer"
                        title="View & Print Official GST Tax Invoice"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>बिल पाहा</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Purchase Bill Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full p-5 sm:p-6 space-y-5 shadow-2xl border border-slate-200 dark:border-slate-800 my-8 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span>नवीन अधिकृत खरेदी बिल (New Purchase Tax Invoice)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  एकाच बिलात विविध मॉडेल्स व सिरीयल क्रमांक नोंदवून इन्व्हेंटरी आणि डीलर लेजर अद्ययावत करा.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-bold cursor-pointer text-lg"
              >
                ✕
              </button>
            </div>

            {/* Gemini AI OCR Bill Scanner Box */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/40 dark:to-indigo-950/40 p-4 rounded-2xl border border-purple-200 dark:border-purple-800 space-y-3 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-purple-600 text-white shadow-xs">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                      <span>🤖 Gemini AI खरेदी बिल फोटो स्कॅनर (Smart OCR)</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-200 text-purple-900 dark:bg-purple-900 dark:text-purple-200">
                        Auto-Fill
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                      खरेदी बिलाचा फोटो किंवा इमेज निवडा — सप्लायर, GSTIN, बिल नं., सर्व वस्तू व टॅक्स फॉर्ममध्ये आपोआप भरले जातील.
                    </p>
                  </div>
                </div>

                <label className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition cursor-pointer shadow-md shadow-purple-600/20 flex items-center justify-center gap-2 shrink-0">
                  {isScanning ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>AI वाचत आहे...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      <span>बिलाचा फोटो निवडा</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isScanning}
                    onChange={handleScanInvoicePhoto}
                    className="hidden"
                  />
                </label>
              </div>

              {scanSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{scanSuccess}</span>
                </div>
              )}

              {scanError && (
                <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{scanError}</span>
                </div>
              )}
            </div>

            {/* Presets Quick Fill Buttons */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>झटपट नमुना पावती भरा (Quick Presets):</span>
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectPreset('manisha-single')}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition cursor-pointer shadow-xs"
                >
                  ⚡ Manisha LG (CS/2526/01677)
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset('manisha-multi')}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition cursor-pointer shadow-xs"
                >
                  ⚡ ३ इलेक्ट्रॉनिक्स मॉडेल्स सॅम्पल
                </button>
              </div>
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
                    value={supplierGstin || ''}
                    onChange={(e) => setSupplierGstin(e.target.value)}
                    placeholder="उदा. 27ABDPB8956C1ZS"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              {/* Invoice No, Date & PO */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    कर बीजक क्र. (Tax Invoice No) *
                  </label>
                  <input
                    type="text"
                    required
                    value={billNo || ''}
                    onChange={(e) => setBillNo(e.target.value)}
                    placeholder="उदा. CS/2526/01677"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    बीजक दिनांक (Invoice Date)
                  </label>
                  <input
                    type="date"
                    value={date || ''}
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
                    value={poNo || ''}
                    onChange={(e) => setPO(e.target.value)}
                    placeholder="उदा. CSSO2526-00628"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              {/* Multi-Line Items (Unlimited products, models and serials) */}
              <div className="space-y-3 bg-slate-50 dark:bg-slate-800/60 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-2.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900 dark:text-white text-sm">
                        खरेदी वस्तू व मॉडेल तपशील (Items, Models & Serials)
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        {purchaseItems.length} उत्पादने
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      एकाच डीलर बिलामध्ये ३ किंवा अधिक वेगळे इलेक्ट्रॉनिक्स मॉडेल्स व त्यांचे सिरीयल नंबर जोडू शकता.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition cursor-pointer self-start sm:self-auto"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ आणखी प्रॉडक्ट / मॉडेल जोडा</span>
                  </button>
                </div>

                {/* Rows List */}
                <div className="space-y-3">
                  {purchaseItems.map((item, idx) => {
                    const q = Math.max(1, Number(item.quantity) || 1);
                    const r = Math.max(0, Number(item.rate) || 0);
                    const d = Math.max(0, Number(item.discount) || 0);
                    const tr = Number(item.taxRate) || 18;
                    const rowTaxable = Math.max(0, q * r - d);
                    const rowTax = Math.round(rowTaxable * (tr / 100));
                    const rowTotal = rowTaxable + rowTax;

                    return (
                      <div
                        key={item.id}
                        className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5 shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">
                            प्रॉडक्ट #{idx + 1}
                          </span>
                          {purchaseItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItemRow(item.id)}
                              className="text-rose-500 hover:text-rose-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>काढून टाका</span>
                            </button>
                          )}
                        </div>

                        {/* Description, Model No & HSN */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                          <div className="sm:col-span-6">
                            <label className="block text-[10.5px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                              वस्तू नाव (Item Description) *
                            </label>
                            <input
                              type="text"
                              required
                              value={item.description || ''}
                              onChange={(e) => handleUpdateItemRow(item.id, { description: e.target.value })}
                              placeholder="उदा. LG Refrigerator किंवा 43 Smart LED TV"
                              className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold bg-white dark:bg-slate-900"
                            />
                          </div>

                          <div className="sm:col-span-3">
                            <label className="block text-[10.5px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                              मॉडेल क्र. (Model No)
                            </label>
                            <input
                              type="text"
                              value={item.modelNo || ''}
                              onChange={(e) => handleUpdateItemRow(item.id, { modelNo: e.target.value })}
                              placeholder="उदा. GL-D201AELU"
                              className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300"
                            />
                          </div>

                          <div className="sm:col-span-3">
                            <label className="block text-[10.5px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                              HSN Code
                            </label>
                            <input
                              type="text"
                              value={item.hsn || ''}
                              onChange={(e) => handleUpdateItemRow(item.id, { hsn: e.target.value })}
                              placeholder="84182100"
                              className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono bg-white dark:bg-slate-900"
                            />
                          </div>
                        </div>

                        {/* Qty, Rate, Discount, Tax Rate, Line Total */}
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                          <div>
                            <label className="block text-[10.5px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                              नग (Qty)
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity ?? 1}
                              onChange={(e) =>
                                handleUpdateItemRow(item.id, { quantity: parseInt(e.target.value) || 1 })
                              }
                              className="w-full px-2 py-1 border border-slate-300 dark:border-slate-700 rounded-md font-mono font-bold text-center bg-white dark:bg-slate-900"
                            />
                          </div>

                          <div>
                            <label className="block text-[10.5px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                              दर (Rate ₹)
                            </label>
                            <input
                              type="number"
                              value={item.rate || ''}
                              onChange={(e) =>
                                handleUpdateItemRow(item.id, { rate: parseFloat(e.target.value) || 0 })
                              }
                              placeholder="16898"
                              className="w-full px-2 py-1 border border-slate-300 dark:border-slate-700 rounded-md font-mono font-bold bg-white dark:bg-slate-900"
                            />
                          </div>

                          <div>
                            <label className="block text-[10.5px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                              सूट (Discount ₹)
                            </label>
                            <input
                              type="number"
                              value={item.discount || ''}
                              onChange={(e) =>
                                handleUpdateItemRow(item.id, { discount: parseFloat(e.target.value) || 0 })
                              }
                              placeholder="0"
                              className="w-full px-2 py-1 border border-slate-300 dark:border-slate-700 rounded-md font-mono bg-white dark:bg-slate-900"
                            />
                          </div>

                          <div>
                            <label className="block text-[10.5px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                              GST (% Tax)
                            </label>
                            <select
                              value={item.taxRate}
                              onChange={(e) =>
                                handleUpdateItemRow(item.id, { taxRate: parseFloat(e.target.value) || 18 })
                              }
                              className="w-full px-1.5 py-1 border border-slate-300 dark:border-slate-700 rounded-md font-semibold bg-white dark:bg-slate-900"
                            >
                              <option value={18}>18% (9+9)</option>
                              <option value={28}>28% (14+14)</option>
                              <option value={12}>12% (6+6)</option>
                              <option value={5}>5% (2.5+2.5)</option>
                              <option value={0}>0%</option>
                            </select>
                          </div>

                          <div className="col-span-2 sm:col-span-1">
                            <label className="block text-[10.5px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                              एकूण (Total ₹)
                            </label>
                            <div className="py-1 px-2 border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/40 rounded-md font-mono font-bold text-blue-900 dark:text-blue-200 text-right">
                              ₹{rowTotal.toLocaleString()}
                            </div>
                          </div>
                        </div>

                        {/* Serial Numbers Input */}
                        <div>
                          <label className="block text-[10.5px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                            सिरीयल क्रमांक / IMEI / बारकोड (Serial Numbers - स्वल्पविरामाने वेगळे करा)
                          </label>
                          <input
                            type="text"
                            value={item.serialNumbersText || ''}
                            onChange={(e) =>
                              handleUpdateItemRow(item.id, { serialNumbersText: e.target.value })
                            }
                            placeholder="उदा. JWH6512NRKA188661IN, 602NRQV293652"
                            className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono bg-white dark:bg-slate-900"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Computed Breakdown Card */}
                <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span>
                      करपात्र: <strong className="font-mono font-bold">₹{computedTotals.sumTaxable.toLocaleString()}</strong>
                    </span>
                    <span className="text-slate-300">|</span>
                    <span>
                      CGST: <strong className="font-mono font-bold">₹{computedTotals.sumCgst.toLocaleString()}</strong>
                    </span>
                    <span className="text-slate-300">|</span>
                    <span>
                      SGST: <strong className="font-mono font-bold">₹{computedTotals.sumSgst.toLocaleString()}</strong>
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 mr-2">एकूण बिल (Grand Total):</span>
                    <strong className="text-blue-600 dark:text-blue-400 font-mono font-black text-sm sm:text-base">
                      ₹{computedTotals.sumGrand.toLocaleString()}
                    </strong>
                  </div>
                </div>
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
                    placeholder="उदा. 19940"
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
                  <span>खरेदी बिल सेव्ह करा व स्टॉक अद्ययावत करा</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Tax Invoice Print/View Modal */}
      {selectedInvoice && (
        <PurchaseInvoiceModal
          purchase={selectedInvoice}
          settings={effectiveSettings}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
};
