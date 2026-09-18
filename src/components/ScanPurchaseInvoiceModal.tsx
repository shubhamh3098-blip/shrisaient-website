import React, { useState, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  X, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Building2, 
  FileText, 
  Tag, 
  Barcode, 
  Package, 
  ArrowRight,
  Plus,
  Trash2,
  Image as ImageIcon,
  RotateCcw,
  ExternalLink
} from 'lucide-react';
import { PurchaseEntry, PurchaseItemDetail, BusinessSettings } from '../types';

interface ScanPurchaseInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmPurchase: (purchase: Omit<PurchaseEntry, 'id'>) => void;
  settings: BusinessSettings;
  onNavigateTab?: (tab: 'stock' | 'dealer-ledger' | 'purchases') => void;
}

interface ExtractedItem {
  id: string;
  description: string;
  hsn: string;
  qty: number;
  rate: number;
  discount: number;
  taxRate: number;
  taxableAmount: number;
  taxAmount: number;
  totalAmount: number;
  serialNumbers: string[];
  serialNumbersInput: string;
}

export const ScanPurchaseInvoiceModal: React.FC<ScanPurchaseInvoiceModalProps> = ({
  isOpen,
  onClose,
  onConfirmPurchase,
  settings,
  onNavigateTab,
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string>('image/jpeg');
  const [isScanning, setIsScanning] = useState(false);
  const [scanStepText, setScanStepText] = useState('');
  const [scanError, setScanError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [lastSavedPurchase, setLastSavedPurchase] = useState<Omit<PurchaseEntry, 'id'> | null>(null);

  // Editable Form Data
  const [supplierName, setSupplierName] = useState('');
  const [supplierAddress, setSupplierAddress] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [supplierGstin, setSupplierGstin] = useState('');
  const [supplierState, setSupplierState] = useState('MAHARASHTRA');

  const [buyerName, setBuyerName] = useState(`${settings.businessName}-LG-WARDHA[NEW]`);
  const [buyerGstin, setBuyerGstin] = useState(settings.gstin || '27ALOPL0030G2ZC');
  const [buyerAddress, setBuyerAddress] = useState(settings.address || 'Arvi Road, Wardha 442001 Maharashtra');

  const [billNo, setBillNo] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [poNo, setPoNo] = useState('');
  const [poDate, setPoDate] = useState(new Date().toISOString().split('T')[0]);
  const [transporter, setTransporter] = useState('GENERAL TRANSPORT');
  const [vehicleNo, setVehicleNo] = useState('');

  const [items, setItems] = useState<ExtractedItem[]>([]);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'Online' | 'Cheque'>('Online');
  const [notes, setNotes] = useState('');

  // Bank info
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankAccountNo, setBankAccountNo] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [bankBranch, setBankBranch] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle file select (from file picker or camera)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const mime = file.type || 'image/jpeg';
    setImageMime(mime);

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImageSrc(result);
      processImageWithAI(result, mime);
    };
    reader.readAsDataURL(file);
  };

  // Sample data fallback for quick testing
  const handleUseSampleBill = (sampleType: 'manisha_lg' | 'samsung_tv') => {
    setIsScanning(true);
    setScanError(null);
    setScanStepText('डेमो बिल लोड करत आहे...');

    setTimeout(() => {
      if (sampleType === 'manisha_lg') {
        setSupplierName('MANISHA ENTERPRISES');
        setSupplierAddress('INGOLE CHOWK MAIN ROAD WARDHA 442001 MAHARASHTRA');
        setSupplierPhone('9766911693');
        setSupplierGstin('27ABDPB8956C1ZS');
        setSupplierState('MAHARASHTRA');
        setBillNo(`CS/2526/0${Math.floor(1000 + Math.random() * 9000)}`);
        setDate(new Date().toISOString().split('T')[0]);
        setPoNo('CSSO2526-00579');
        setTransporter('GENERAL TRANSPORT');
        setVehicleNo('MH32-Q-4107');

        setBankAccountName('MANISHA ENTERPRISE');
        setBankAccountNo('108051000302');
        setBankIfsc('ICIC0001080');
        setBankBranch('SHIVAJI CHOWK, ARVI ROAD, WARDHA');

        setItems([
          {
            id: `item-sample-1`,
            description: 'LG GLT2216WYRI Refrigerator 240L Double Door',
            hsn: '84182100',
            qty: 2,
            rate: 21592,
            discount: 0,
            taxRate: 18,
            taxableAmount: 43184,
            taxAmount: 7773.12,
            totalAmount: 50957,
            serialNumbers: ['602NRZX294301', '602NRQV293652'],
            serialNumbersInput: '602NRZX294301, 602NRQV293652',
          },
          {
            id: `item-sample-2`,
            description: 'LG Smart Inverter Washing Machine 7.0 Kg T70SPSF2Z',
            hsn: '84501100',
            qty: 1,
            rate: 16800,
            discount: 0,
            taxRate: 18,
            taxableAmount: 16800,
            taxAmount: 3024,
            totalAmount: 19824,
            serialNumbers: ['603WMAB891234'],
            serialNumbersInput: '603WMAB891234',
          }
        ]);
        setPaidAmount(0);
        setPaymentMode('Online');
        setNotes('AI Scanned Bill: Auto-extracted from Manisha Enterprises invoice');
      } else {
        setSupplierName('SAMSUNG INDIA ELECTRONICS PVT LTD');
        setSupplierAddress('MIDC INDUSTRIAL AREA, BUTIBORI, NAGPUR 441108');
        setSupplierPhone('9822334455');
        setSupplierGstin('27AABCS1429B1ZT');
        setSupplierState('MAHARASHTRA');
        setBillNo(`INV-SAM-${Math.floor(10000 + Math.random() * 90000)}`);
        setDate(new Date().toISOString().split('T')[0]);
        setPoNo('SAM-PO-2026-88');
        setTransporter('VRL LOGISTICS');
        setVehicleNo('MH31-CA-9921');

        setItems([
          {
            id: `item-sample-tv`,
            description: 'Samsung 43 Inch Crystal 4K UHD Smart TV (43DU7700)',
            hsn: '85287200',
            qty: 3,
            rate: 27990,
            discount: 0,
            taxRate: 18,
            taxableAmount: 83970,
            taxAmount: 15114.6,
            totalAmount: 99085,
            serialNumbers: ['SAM43DU8810291', 'SAM43DU8810292', 'SAM43DU8810293'],
            serialNumbersInput: 'SAM43DU8810291, SAM43DU8810292, SAM43DU8810293',
          }
        ]);
        setPaidAmount(0);
        setPaymentMode('Online');
        setNotes('AI Scanned: Samsung Electronics Distributor');
      }

      setIsScanning(false);
      setScanStepText('');
    }, 700);
  };

  // Call Server-side API for Gemini Multimodal Vision Scan
  const processImageWithAI = async (base64Data: string, mime: string) => {
    setIsScanning(true);
    setScanError(null);
    setScanStepText('AI द्वारे खरेदी बिलाचा फोटो तपासत आहे...');

    try {
      const response = await fetch('/api/scan-purchase-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Data,
          mimeType: mime,
        }),
      });

      const resJson = await response.json();

      if (!response.ok || !resJson.success) {
        throw new Error(resJson.error || 'Failed to extract bill data');
      }

      const extracted = resJson.data;

      // Populate Extracted Supplier Info
      if (extracted.supplierName) setSupplierName(extracted.supplierName);
      if (extracted.supplierAddress) setSupplierAddress(extracted.supplierAddress);
      if (extracted.supplierPhone) setSupplierPhone(extracted.supplierPhone);
      if (extracted.supplierGstin) setSupplierGstin(extracted.supplierGstin);
      if (extracted.supplierState) setSupplierState(extracted.supplierState);

      // Populate Bill Info
      if (extracted.billNo) setBillNo(extracted.billNo);
      if (extracted.date) setDate(extracted.date);
      if (extracted.poNo) setPoNo(extracted.poNo);
      if (extracted.poDate) setPoDate(extracted.poDate);
      if (extracted.transporter) setTransporter(extracted.transporter);
      if (extracted.vehicleNo) setVehicleNo(extracted.vehicleNo);

      // Bank info
      if (extracted.supplierBank) {
        if (extracted.supplierBank.accountName) setBankAccountName(extracted.supplierBank.accountName);
        if (extracted.supplierBank.accountNo) setBankAccountNo(extracted.supplierBank.accountNo);
        if (extracted.supplierBank.ifscCode) setBankIfsc(extracted.supplierBank.ifscCode);
        if (extracted.supplierBank.branch) setBankBranch(extracted.supplierBank.branch);
      }

      // Populate Items & Serial Numbers
      if (Array.isArray(extracted.items) && extracted.items.length > 0) {
        const mappedItems: ExtractedItem[] = extracted.items.map((item: any, idx: number) => {
          const qty = Number(item.qty) || 1;
          const rate = Number(item.rate) || 0;
          const discount = Number(item.discount) || 0;
          const taxRate = Number(item.taxRate) || 18;
          const taxable = Math.max(0, (qty * rate) - discount);
          const taxAmount = Number(item.taxAmount) || Math.round(((taxable * taxRate) / 100) * 100) / 100;
          const totalAmount = Number(item.totalAmount) || Math.round(taxable + taxAmount);

          const serials = Array.isArray(item.serialNumbers) ? item.serialNumbers.map(String) : [];

          return {
            id: `extracted-${idx}-${Date.now()}`,
            description: item.description || `Item #${idx + 1}`,
            hsn: item.hsn || '84182100',
            qty,
            rate,
            discount,
            taxRate,
            taxableAmount: taxable,
            taxAmount,
            totalAmount,
            serialNumbers: serials,
            serialNumbersInput: serials.join(', '),
          };
        });
        setItems(mappedItems);
      } else {
        // Fallback single item if no structured list
        setItems([
          {
            id: `extracted-single-${Date.now()}`,
            description: extracted.itemsSummary || 'Electronics / Goods',
            hsn: '84182100',
            qty: 1,
            rate: Number(extracted.totalAmount) || 0,
            discount: 0,
            taxRate: 18,
            taxableAmount: Number(extracted.totalAmount) || 0,
            taxAmount: 0,
            totalAmount: Number(extracted.totalAmount) || 0,
            serialNumbers: [],
            serialNumbersInput: '',
          }
        ]);
      }

      if (extracted.paidAmount) setPaidAmount(Number(extracted.paidAmount) || 0);
      if (extracted.paymentMode) setPaymentMode(extracted.paymentMode);
      if (extracted.notes) setNotes(extracted.notes);

    } catch (err: any) {
      console.warn('AI Scan error, activating smart fallback:', err);
      setScanError(err.message || 'AI द्वारे स्कॅन करताना त्रुटी आली. कृपया मॅन्युअली माहिती भरा किंवा डेमो वापरा.');
    } finally {
      setIsScanning(false);
      setScanStepText('');
    }
  };

  // Calculations
  const calculatedSubtotal = items.reduce((acc, item) => acc + (item.taxableAmount || 0), 0);
  const calculatedTax = items.reduce((acc, item) => acc + (item.taxAmount || 0), 0);
  const calculatedGrandTotal = items.reduce((acc, item) => acc + (item.totalAmount || 0), 0);

  // Line item actions
  const handleUpdateItem = (index: number, field: keyof ExtractedItem, value: any) => {
    const updated = [...items];
    const target = { ...updated[index], [field]: value };

    if (field === 'qty' || field === 'rate' || field === 'discount' || field === 'taxRate') {
      const qty = field === 'qty' ? Number(value) : target.qty;
      const rate = field === 'rate' ? Number(value) : target.rate;
      const discount = field === 'discount' ? Number(value) : target.discount;
      const taxRate = field === 'taxRate' ? Number(value) : target.taxRate;
      const taxable = Math.max(0, (qty * rate) - discount);
      const taxAmt = Math.round(((taxable * taxRate) / 100) * 100) / 100;
      target.taxableAmount = taxable;
      target.taxAmount = taxAmt;
      target.totalAmount = Math.round(taxable + taxAmt);
    }

    if (field === 'serialNumbersInput') {
      target.serialNumbers = String(value)
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean);
    }

    updated[index] = target;
    setItems(updated);
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: `item-manual-${Date.now()}`,
        description: '',
        hsn: '84182100',
        qty: 1,
        rate: 0,
        discount: 0,
        taxRate: 18,
        taxableAmount: 0,
        taxAmount: 0,
        totalAmount: 0,
        serialNumbers: [],
        serialNumbersInput: '',
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Final confirmation: calls onConfirmPurchase which updates Purchases, Dealer Ledger, and Stock!
  const handleConfirmAndSyncEverywhere = () => {
    if (!supplierName.trim()) {
      alert('कृपया पुरवठादार / सप्लायरचे नाव प्रविष्ट करा.');
      return;
    }

    if (items.length === 0 || calculatedGrandTotal <= 0) {
      alert('किमान एका वस्तूची नोंद आणि रक्कम असणे आवश्यक आहे.');
      return;
    }

    // Convert to PurchaseItemDetail
    const purchaseItemsDetail: PurchaseItemDetail[] = items.map((item, idx) => {
      const cgstRate = (item.taxRate || 18) / 2;
      const sgstRate = (item.taxRate || 18) / 2;
      const cgstAmount = Math.round(((item.taxableAmount * cgstRate) / 100) * 100) / 100;
      const sgstAmount = Math.round(((item.taxableAmount * sgstRate) / 100) * 100) / 100;

      return {
        id: item.id || `pi-${idx}-${Date.now()}`,
        description: item.description || 'Appliance / Item',
        hsn: item.hsn || '84182100',
        qty: item.qty || 1,
        rate: item.rate || 0,
        discount: item.discount || 0,
        taxableAmount: item.taxableAmount || 0,
        taxRate: item.taxRate || 18,
        cgstRate,
        cgstAmount,
        sgstRate,
        sgstAmount,
        taxAmount: item.taxAmount || (cgstAmount + sgstAmount),
        totalAmount: item.totalAmount || (item.taxableAmount + item.taxAmount),
        serialNumbers: item.serialNumbers || [],
      };
    });

    const summaryText = items
      .map((i) => `${i.description} (${i.qty} Pcs)`)
      .join(', ');

    const status: 'Paid' | 'Partial' | 'Pending' =
      paidAmount >= calculatedGrandTotal
        ? 'Paid'
        : paidAmount > 0
        ? 'Partial'
        : 'Pending';

    const newPurchaseData: Omit<PurchaseEntry, 'id'> = {
      billNo: billNo.trim() || `PUR/${Date.now().toString().slice(-6)}`,
      date,
      supplierName: supplierName.trim(),
      supplierAddress: supplierAddress.trim(),
      supplierPhone: supplierPhone.trim(),
      supplierGstin: supplierGstin.trim(),
      supplierState,
      buyerName: buyerName.trim(),
      buyerGstin: buyerGstin.trim(),
      buyerAddress: buyerAddress.trim(),
      poNo: poNo.trim(),
      poDate,
      location: 'DISTRIBUTION WAREHOUSE',
      salesConsultant: '',
      approvedBy: '',
      transporter: transporter.trim(),
      vehicleNo: vehicleNo.trim(),
      items: summaryText,
      itemsDetail: purchaseItemsDetail,
      subtotal: calculatedSubtotal,
      cgstAmount: calculatedTax / 2,
      sgstAmount: calculatedTax / 2,
      totalTax: calculatedTax,
      totalAmount: calculatedGrandTotal,
      paidAmount,
      status,
      paymentMode,
      supplierBank: {
        accountName: bankAccountName,
        accountNo: bankAccountNo,
        ifscCode: bankIfsc,
        bankName: 'BANK',
        branch: bankBranch,
      },
      notes: notes || 'AI Scanned & Auto-Synchronized Purchase',
      autoUpdateStock: true,
    };

    onConfirmPurchase(newPurchaseData);
    setLastSavedPurchase(newPurchaseData);
    setIsSuccess(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
              <Camera className="w-6 h-6 text-yellow-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight">
                  खरेदी बिल AI स्कॅनर व ऑटो-अपडेट
                </h2>
                <span className="bg-yellow-400 text-slate-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                  <Sparkles className="w-3 h-3" /> AI Vision
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-0.5">
                बिलाचा फोटो काढा — सप्लायर, उत्पादने, सिरीयल नंबर आणि स्टॉक आपोआप सर्वत्र अपडेट होतील!
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* Success Screen */}
          {isSuccess && lastSavedPurchase ? (
            <div className="py-8 text-center space-y-5">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-lg animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="max-w-md mx-auto space-y-2">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                  खरेदी बिल यशस्वीरीत्या सेव्ह झाले!
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  सप्लायर <span className="font-bold text-blue-600 dark:text-blue-400">{lastSavedPurchase.supplierName}</span> चे बिल #{lastSavedPurchase.billNo} नोंदवून स्टॉक व डीलर खाते आपोआप अपडेट केले गेले आहेत.
                </p>
              </div>

              {/* Status checklist */}
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 rounded-xl p-4 max-w-lg mx-auto text-left text-xs sm:text-sm space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>इन्व्हेंटरी स्टॉकमध्ये {lastSavedPurchase.itemsDetail?.length || 1} उत्पादने व संख्या जमा झाली.</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>सिरीयल नंबर्स / IMEI वॉरंटी ट्रॅकिंगसाठी सुरक्षित सेव्ह झाले.</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>डीलर लेजर (खाते) मध्ये ₹{lastSavedPurchase.totalAmount.toLocaleString()} ची खरेदी व बाकी रक्कम नोंदवली.</span>
                </div>
              </div>

              {/* Navigation Actions */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                {onNavigateTab && (
                  <>
                    <button
                      onClick={() => {
                        onClose();
                        onNavigateTab('stock');
                      }}
                      className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md flex items-center gap-2 transition"
                    >
                      <Package className="w-4 h-4" /> स्टॉक तपासा (View Stock)
                    </button>
                    <button
                      onClick={() => {
                        onClose();
                        onNavigateTab('dealer-ledger');
                      }}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md flex items-center gap-2 transition"
                    >
                      <Building2 className="w-4 h-4" /> डीलर खाते पहा (View Dealer)
                    </button>
                  </>
                )}
                <button
                  onClick={() => {
                    setIsSuccess(false);
                    setImageSrc(null);
                    setItems([]);
                    setSupplierName('');
                    setBillNo('');
                  }}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold rounded-xl border border-slate-300 dark:border-slate-700 flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" /> आणखी एक बिल स्कॅन करा
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Top Upload / Camera / Sample Selector (if no image or user wants to re-scan) */}
              <div className="bg-slate-50 dark:bg-slate-800/60 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-4 sm:p-6 text-center transition-all">
                
                {/* Hidden Inputs */}
                <input
                  type="file"
                  ref={cameraInputRef}
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />

                {!imageSrc && !isScanning && items.length === 0 ? (
                  <div className="space-y-4">
                    <div className="w-14 h-14 bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                      <Camera className="w-7 h-7" />
                    </div>

                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">
                        खरेदी बिलाचा फोटो काढा किंवा अपलोड करा
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
                        दुकानदाराचे खरेदी बिल (Tax Invoice) चा सुस्पष्ट फोटो दिल्यास सर्व उत्पादने, दर आणि सिरीयल नंबर आपोआप वाचले जातील.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md hover:shadow-lg flex items-center gap-2 transition"
                      >
                        <Camera className="w-4 h-4" /> कॅमेराने फोटो काढा (Take Photo)
                      </button>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-5 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600 text-xs sm:text-sm font-bold rounded-xl shadow-sm flex items-center gap-2 transition"
                      >
                        <Upload className="w-4 h-4 text-blue-600" /> गॅलरीतून बिल निवडा (Choose File)
                      </button>
                    </div>

                    {/* Quick Demo bills button */}
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-700/80">
                      <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block mb-2">
                        किंवा तत्काळ चाचणीसाठी डेमो बिल निवडा (Try Sample Bill):
                      </span>
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleUseSampleBill('manisha_lg')}
                          className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                        >
                          <Sparkles className="w-3.5 h-3.5" /> मनिषा एंटरप्रायझेस (LG Refrigerator & Washing Machine)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUseSampleBill('samsung_tv')}
                          className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                        >
                          <Sparkles className="w-3.5 h-3.5" /> सॅमसंग इलेक्ट्रॉनिक्स (Samsung 43" Smart TV)
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {imageSrc ? (
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 shadow-sm shrink-0 bg-slate-200">
                          <img src={imageSrc} alt="Bill Preview" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950/60 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                          <FileText className="w-6 h-6" />
                        </div>
                      )}
                      <div className="text-left">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          {imageSrc ? 'बिलाचा फोटो तपासला गेला' : 'डेमो खरेदी बिल लोड झाले'}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          खालील तपशील तपासून 'सर्व ठिकाणी आपोआप अपडेट करा' बटण दाबा.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-600 flex items-center gap-1"
                      >
                        <Camera className="w-3.5 h-3.5 text-blue-600" /> दुसरा फोटो
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-600 flex items-center gap-1"
                      >
                        <Upload className="w-3.5 h-3.5" /> फाईल बदला
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Scanning in progress indicator */}
              {isScanning && (
                <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-center gap-3 text-blue-800 dark:text-blue-200 animate-pulse">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600 shrink-0" />
                  <div className="text-xs sm:text-sm">
                    <span className="font-bold">{scanStepText || 'AI द्वारे बिल तपासत आहे...'}</span>
                    <p className="text-[11px] text-blue-600/80 dark:text-blue-300/80 mt-0.5">
                      सप्लायर माहिती, उत्पादनांचे नाव, HSN कोड आणि सिरीयल नंबर वेगळे केले जात आहेत.
                    </p>
                  </div>
                </div>
              )}

              {/* Scan Error notification if any */}
              {scanError && (
                <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl p-3 flex items-center gap-2 text-amber-800 dark:text-amber-200 text-xs">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{scanError} (खालील फॉर्ममध्ये आपण मॅन्युअली किंवा डेमोद्वारे माहिती तपासू शकता)</span>
                </div>
              )}

              {/* Form Data (Verified & Editable) */}
              {(items.length > 0 || supplierName) && (
                <div className="space-y-5">
                  
                  {/* Section 1: Supplier & Bill Info */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/80 pb-2">
                      <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-800 dark:text-white">
                        <Building2 className="w-4 h-4 text-blue-600" />
                        <span>१. पुरवठादार व बिल माहिती (Supplier & Invoice)</span>
                      </div>
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Auto-detected
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          सप्लायर / डीलर नाव (Supplier Name) *
                        </label>
                        <input
                          type="text"
                          value={supplierName}
                          onChange={(e) => setSupplierName(e.target.value)}
                          placeholder="उदा. MANISHA ENTERPRISES"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold text-slate-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          बिल क्र. (Bill / Inv No) *
                        </label>
                        <input
                          type="text"
                          value={billNo}
                          onChange={(e) => setBillNo(e.target.value)}
                          placeholder="CS/2526/01604"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-slate-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          बिल तारीख (Date) *
                        </label>
                        <input
                          type="date"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          सप्लायर GSTIN
                        </label>
                        <input
                          type="text"
                          value={supplierGstin}
                          onChange={(e) => setSupplierGstin(e.target.value)}
                          placeholder="27ABDPB8956C1ZS"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-slate-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          फोन नंबर
                        </label>
                        <input
                          type="text"
                          value={supplierPhone}
                          onChange={(e) => setSupplierPhone(e.target.value)}
                          placeholder="9766911693"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          पत्ता (Supplier Address)
                        </label>
                        <input
                          type="text"
                          value={supplierAddress}
                          onChange={(e) => setSupplierAddress(e.target.value)}
                          placeholder="Main Road, Wardha"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white truncate"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Items & Serial Numbers (Crucial for automatic stock updates) */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/80 pb-2">
                      <div>
                        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-800 dark:text-white">
                          <Package className="w-4 h-4 text-emerald-600" />
                          <span>२. स्टॉकमध्ये जमा होणारी उत्पादने व सिरीयल नंबर (Products to update in Stock)</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          ही उत्पादने आपोआप इन्व्हेंटरी स्टॉकमध्ये संख्या व सिरीयल नंबरसह जोडली जातील.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleAddItem}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> आणखी उत्पादन जोडा
                      </button>
                    </div>

                    <div className="space-y-3">
                      {items.map((item, idx) => (
                        <div
                          key={item.id || idx}
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl p-3 space-y-2 shadow-xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                              उत्पादन #{idx + 1}
                            </span>
                            {items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="text-red-500 hover:text-red-700 text-xs p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
                            <div className="sm:col-span-5">
                              <label className="block text-[10px] font-bold text-slate-500 uppercase">
                                वस्तूचे नाव व मॉडेल *
                              </label>
                              <input
                                type="text"
                                value={item.description}
                                onChange={(e) => handleUpdateItem(idx, 'description', e.target.value)}
                                placeholder="उदा. LG GLT2216WYRI Refrigerator"
                                className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-medium text-slate-900 dark:text-white"
                              />
                            </div>

                            <div className="sm:col-span-2">
                              <label className="block text-[10px] font-bold text-slate-500 uppercase">
                                HSN कोड
                              </label>
                              <input
                                type="text"
                                value={item.hsn}
                                onChange={(e) => handleUpdateItem(idx, 'hsn', e.target.value)}
                                placeholder="84182100"
                                className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-mono text-slate-900 dark:text-white"
                              />
                            </div>

                            <div className="sm:col-span-1">
                              <label className="block text-[10px] font-bold text-slate-500 uppercase">
                                नग (Qty)
                              </label>
                              <input
                                type="number"
                                min={1}
                                value={item.qty}
                                onChange={(e) => handleUpdateItem(idx, 'qty', e.target.value)}
                                className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-bold text-center text-slate-900 dark:text-white"
                              />
                            </div>

                            <div className="sm:col-span-2">
                              <label className="block text-[10px] font-bold text-slate-500 uppercase">
                                खरेदी दर (₹ Rate)
                              </label>
                              <input
                                type="number"
                                value={item.rate}
                                onChange={(e) => handleUpdateItem(idx, 'rate', e.target.value)}
                                className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-mono text-right text-slate-900 dark:text-white"
                              />
                            </div>

                            <div className="sm:col-span-2">
                              <label className="block text-[10px] font-bold text-slate-500 uppercase">
                                एकूण (Total ₹)
                              </label>
                              <div className="px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 font-mono font-bold text-right text-slate-900 dark:text-white">
                                ₹{item.totalAmount.toLocaleString()}
                              </div>
                            </div>
                          </div>

                          {/* Serial Numbers Row */}
                          <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-1.5 mb-1">
                              <Barcode className="w-3.5 h-3.5 text-emerald-600" />
                              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                सिरीयल नंबर्स / IMEI (Serial Numbers) — स्वल्पविराम (comma) देऊन वेगळे करा:
                              </label>
                            </div>
                            <input
                              type="text"
                              value={item.serialNumbersInput}
                              onChange={(e) => handleUpdateItem(idx, 'serialNumbersInput', e.target.value)}
                              placeholder="उदा. 602NRZX294301, 602NRQV293652"
                              className="w-full px-2.5 py-1 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20 font-mono text-xs text-slate-900 dark:text-white"
                            />
                            {item.serialNumbers.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1 mt-1.5">
                                {item.serialNumbers.map((s, sIdx) => (
                                  <span
                                    key={sIdx}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-[10px] font-mono font-bold border border-emerald-200 dark:border-emerald-700"
                                  >
                                    <Barcode className="w-2.5 h-2.5" />
                                    {s}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section 3: Totals & Settlement */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/80 pb-2">
                      <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-800 dark:text-white">
                        <Tag className="w-4 h-4 text-indigo-600" />
                        <span>३. रक्कम सारांश व पेमेंट (Billing Summary & Payment)</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                          करपूर्व रक्कम (Subtotal)
                        </label>
                        <div className="px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-sm font-bold text-slate-800 dark:text-white">
                          ₹{calculatedSubtotal.toLocaleString()}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                          कर रक्कम (Total GST)
                        </label>
                        <div className="px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-sm font-bold text-slate-800 dark:text-white">
                          ₹{calculatedTax.toLocaleString()}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-blue-700 dark:text-blue-400 mb-1">
                          एकूण बिल रक्कम (Grand Total)
                        </label>
                        <div className="px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-300 dark:border-blue-700 font-mono text-base font-black text-blue-900 dark:text-blue-200">
                          ₹{calculatedGrandTotal.toLocaleString()}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          सध्या भरलेली रक्कम (Paid Amount)
                        </label>
                        <input
                          type="number"
                          value={paidAmount}
                          onChange={(e) => setPaidAmount(Number(e.target.value) || 0)}
                          placeholder="0"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold text-slate-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          पेमेंट पद्धत (Payment Mode)
                        </label>
                        <select
                          value={paymentMode}
                          onChange={(e) => setPaymentMode(e.target.value as any)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold text-slate-900 dark:text-white"
                        >
                          <option value="Online">Online (NEFT / RTGS / UPI)</option>
                          <option value="Cheque">Cheque (धनादेश)</option>
                          <option value="Cash">Cash (रोख)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-red-600 dark:text-red-400 mb-1">
                          डीलरकडे बाकी रक्कम (Balance Due)
                        </label>
                        <div className="px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 font-mono text-sm font-black text-red-700 dark:text-red-300">
                          ₹{Math.max(0, calculatedGrandTotal - paidAmount).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Auto-Sync Confirmation Card */}
                  <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-emerald-950/40 border border-emerald-300 dark:border-emerald-700 rounded-2xl p-4 shadow-sm">
                    <h4 className="text-xs sm:text-sm font-black text-emerald-900 dark:text-emerald-200 flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      'सर्व ठिकाणी आपोआप अपडेट करा' दाबल्यावर काय घडेल:
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                      <div className="bg-white/80 dark:bg-slate-900/60 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
                        <p className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1 mb-1">
                          <Package className="w-3.5 h-3.5" /> १. इन्व्हेंटरी स्टॉक
                        </p>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400">
                          वस्तूंची संख्या आपोआप वाढेल व सिरीयल नंबर्स वॉरंटीसाठी सेव्ह होतील.
                        </p>
                      </div>

                      <div className="bg-white/80 dark:bg-slate-900/60 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
                        <p className="font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1 mb-1">
                          <Building2 className="w-3.5 h-3.5" /> २. डीलर खाते लेजर
                        </p>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400">
                          सप्लायरचे खाते अपडेट होईल व बाकी रक्कम आपोआप हिशेबात दिसेल.
                        </p>
                      </div>

                      <div className="bg-white/80 dark:bg-slate-900/60 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
                        <p className="font-bold text-indigo-800 dark:text-indigo-300 flex items-center gap-1 mb-1">
                          <FileText className="w-3.5 h-3.5" /> ३. खरेदी नोंदवही
                        </p>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400">
                          अधिकृत खरेदी बिल तयार होऊन जीएसटी व हिशेबासाठी सेव्ह राहील.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Bottom Actions */}
        {!isSuccess && (
          <div className="bg-slate-50 dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-800 p-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              रद्द करा (Cancel)
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={items.length === 0 || !supplierName.trim() || isScanning}
                onClick={handleConfirmAndSyncEverywhere}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white text-xs sm:text-sm font-black rounded-xl shadow-lg hover:shadow-xl flex items-center gap-2 transition cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-yellow-300" />
                <span>सर्व ठिकाणी आपोआप अपडेट करा (Confirm & Update Everywhere)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
