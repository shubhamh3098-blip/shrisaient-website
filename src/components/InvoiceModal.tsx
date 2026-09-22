import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Printer,
  Share2,
  X,
  FileText,
  CheckCircle,
  Edit3,
  Save,
  ShieldCheck,
  Plus,
  Trash2,
  Layers,
  Truck,
  Building,
  Check
} from 'lucide-react';
import { BusinessSettings, TransactionEntry, InvoiceLineItem } from '../types';
import { AppLogo } from './AppLogo';
import { ProfessionalGstInvoice, DispatchDetails } from './ProfessionalGstInvoice';
import { ThermalReceiptModal, ThermalReceiptData } from './ThermalReceiptModal';
import { DynamicUpiQrCode } from './DynamicUpiQrCode';

interface InvoiceModalProps {
  entry: TransactionEntry | null;
  onClose: () => void;
  settings: BusinessSettings;
  onUpdateEntry?: (updated: TransactionEntry) => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  entry,
  onClose,
  settings,
  onUpdateEntry,
}) => {
  if (!entry) return null;

  const isReceipt =
    entry.entryType === 'Receipt' ||
    entry.invoiceNo.startsWith('SSE/RCPT') ||
    entry.invoiceNo.startsWith('REC-') ||
    (entry.totalAmount === 0 && entry.payingNow > 0);

  // Template Layout mode: 'tally-gst' (like user's uploaded example) or 'compact-slip'
  const [layoutMode, setLayoutMode] = useState<'tally-gst' | 'compact-slip'>(() => {
    return isReceipt ? 'compact-slip' : 'tally-gst';
  });

  // Toggle between Tax Invoice and Quotation
  const [docType, setDocType] = useState<'tax-bill' | 'quotation'>(
    entry.isQuotation ? 'quotation' : 'tax-bill'
  );

  // Model & Serial number state
  const [modelNo, setModelNo] = useState(entry.modelNo || '');
  const [serialNo, setSerialNo] = useState(entry.serialNo || '');
  const [showThermalModal, setShowThermalModal] = useState(false);
  const [validityDays, setValidityDays] = useState(entry.quotationValidity || '15 दिवस वैध (15 Days)');
  const [buyerAddress, setBuyerAddress] = useState(
    entry.buyerAddress ||
      (entry.village
        ? `${entry.village}, Wardha 442001`
        : 'Nagthana Road Hanuman Mandir Wardha 442001')
  );

  // Dispatch / Transport details
  const [dispatchDetails, setDispatchDetails] = useState<DispatchDetails>({
    deliveryNote: entry.deliveryNote || '',
    termsOfPayment: entry.paymentMode || 'Cash / Online',
    suppliersRef: entry.supplierRef || '',
    otherRef: entry.refBillNo ? `Ref: #${entry.refBillNo}` : '',
    buyersOrderNo: entry.buyersOrderNo || '',
    buyersOrderDate: entry.date || '',
    despatchDocNo: '',
    deliveryNoteDate: '',
    despatchedThrough: entry.despatchThrough || 'Direct Delivery / Handover',
    destination: entry.destination || (entry.village ? `${entry.village}, Wardha` : 'Wardha'),
    termsOfDelivery: entry.deliveryTerms || 'Goods once sold will not be taken back.',
  });

  // Editable Line Items
  const initialParsedItems: InvoiceLineItem[] = useMemo(() => {
    if (entry.lineItems && entry.lineItems.length > 0) {
      return entry.lineItems;
    }
    // Parse from itemDetails if multi-line or single item
    const rawDetails = entry.itemDetails || 'साहित्य / Goods';
    const lines = rawDetails.split(/\n|;/).map((s) => s.trim()).filter(Boolean);

    if (lines.length > 1) {
      const approxRate = Math.round(entry.totalAmount / lines.length);
      return lines.map((line, idx) => ({
        id: `item-${idx + 1}`,
        srNo: idx + 1,
        description: line,
        hsn: '0',
        qty: 1,
        rate: approxRate,
        per: 'nos',
        amount: approxRate,
      }));
    }

    const qty = entry.quantity && entry.quantity > 0 ? entry.quantity : 1;
    const rate = entry.unitPrice || Math.round(entry.totalAmount / qty);

    return [
      {
        id: 'item-1',
        srNo: 1,
        description: rawDetails,
        hsn: entry.hsnCode || '0',
        qty,
        rate,
        per: 'nos',
        amount: entry.totalAmount,
      },
    ];
  }, [entry]);

  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>(initialParsedItems);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  useEffect(() => {
    if (!entry) return;
    setDocType(entry.isQuotation ? 'quotation' : 'tax-bill');
    setModelNo(entry.modelNo || '');
    setSerialNo(entry.serialNo || '');
    setValidityDays(entry.quotationValidity || '15 दिवस वैध (15 Days)');
    setBuyerAddress(
      entry.buyerAddress ||
        (entry.village
          ? `${entry.village}, Wardha 442001`
          : 'Nagthana Road Hanuman Mandir Wardha 442001')
    );
    setDispatchDetails({
      deliveryNote: entry.deliveryNote || '',
      termsOfPayment: entry.paymentMode || 'Cash / Online',
      suppliersRef: entry.supplierRef || '',
      otherRef: entry.refBillNo ? `Ref: #${entry.refBillNo}` : '',
      buyersOrderNo: entry.buyersOrderNo || '',
      buyersOrderDate: entry.date || '',
      despatchDocNo: '',
      deliveryNoteDate: '',
      despatchedThrough: entry.despatchThrough || 'Direct Delivery / Handover',
      destination: entry.destination || (entry.village ? `${entry.village}, Wardha` : 'Wardha'),
      termsOfDelivery: entry.deliveryTerms || 'Goods once sold will not be taken back.',
    });
    setLineItems(initialParsedItems);
    setIsEditingDetails(false);
  }, [entry, initialParsedItems]);

  // Recalculate total from line items if changed
  const calculatedTotal = useMemo(() => {
    return lineItems.reduce((acc, it) => acc + (Number(it.amount) || Number(it.qty) * Number(it.rate) || 0), 0);
  }, [lineItems]);

  const handleAddItem = () => {
    const nextSr = lineItems.length + 1;
    setLineItems([
      ...lineItems,
      {
        id: `item-${Date.now()}-${nextSr}`,
        srNo: nextSr,
        description: '',
        hsn: '0',
        qty: 1,
        rate: 0,
        per: 'nos',
        amount: 0,
      },
    ]);
  };

  const handleUpdateItem = (index: number, field: keyof InvoiceLineItem, value: any) => {
    const updated = [...lineItems];
    const target = { ...updated[index], [field]: value };

    if (field === 'qty' || field === 'rate') {
      const q = field === 'qty' ? Number(value) || 0 : Number(target.qty) || 0;
      const r = field === 'rate' ? Number(value) || 0 : Number(target.rate) || 0;
      target.amount = Math.round(q * r * 100) / 100;
    }
    updated[index] = target;
    setLineItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    if (lineItems.length <= 1) return;
    const filtered = lineItems
      .filter((_, i) => i !== index)
      .map((item, idx) => ({ ...item, srNo: idx + 1 }));
    setLineItems(filtered);
  };

  const handleSaveSpecsAndItems = () => {
    if (onUpdateEntry) {
      const itemSummaries = lineItems
        .map((it) => it.description.trim())
        .filter(Boolean)
        .join(', ');

      const updated: TransactionEntry = {
        ...entry,
        modelNo: modelNo.trim(),
        serialNo: serialNo.trim(),
        isQuotation: docType === 'quotation',
        quotationValidity: validityDays,
        buyerAddress: buyerAddress.trim(),
        lineItems,
        itemDetails: itemSummaries || entry.itemDetails,
        totalAmount: calculatedTotal > 0 ? calculatedTotal : entry.totalAmount,
        dueAmount: Math.max(0, (calculatedTotal > 0 ? calculatedTotal : entry.totalAmount) - (entry.payingNow || 0)),
        deliveryNote: dispatchDetails.deliveryNote,
        supplierRef: dispatchDetails.suppliersRef,
        buyersOrderNo: dispatchDetails.buyersOrderNo,
        despatchThrough: dispatchDetails.despatchedThrough,
        destination: dispatchDetails.destination,
        deliveryTerms: dispatchDetails.termsOfDelivery,
      };
      onUpdateEntry(updated);
    }
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 2500);
    setIsEditingDetails(false);
  };

  useEffect(() => {
    document.body.classList.add('has-invoice-modal');
    return () => {
      document.body.classList.remove('has-invoice-modal');
      document.body.classList.remove('printing-invoice');
    };
  }, []);

  const handlePrint = () => {
    document.body.classList.add('printing-invoice');
    const cleanUp = () => {
      document.body.classList.remove('printing-invoice');
      window.removeEventListener('afterprint', cleanUp);
    };
    window.addEventListener('afterprint', cleanUp);
    setTimeout(() => {
      window.print();
      setTimeout(cleanUp, 1500);
    }, 60);
  };

  const isQuotationMode = docType === 'quotation';
  const displayDocNumber = isQuotationMode
    ? entry.invoiceNo.startsWith('QT-')
      ? entry.invoiceNo
      : `QT-${entry.invoiceNo.replace(/^INV-/, '')}`
    : entry.invoiceNo;

  const handleShareWhatsApp = () => {
    const invoiceUrl = `${window.location.origin}/?invoice=${entry.invoiceNo}`;
    const docTitle = isReceipt
      ? 'Payment Receipt (जमा पावती)'
      : isQuotationMode
      ? 'कोटेशन / अंदाजपत्रक (QUOTATION)'
      : 'Cash / Tax Invoice (विक्री बिल)';

    const itemsSummary = lineItems
      .map((it, idx) => `${idx + 1}. ${it.description} (Qty: ${it.qty} ${it.per || 'nos'}) - ₹${Number(it.amount || it.qty * it.rate).toLocaleString()}`)
      .join('\n');

    let text =
      `*${settings.businessName}*\n` +
      `*${docTitle}: ${displayDocNumber}*\n` +
      `तारीख: ${entry.date}\n` +
      `ग्राहक: ${entry.customerName}\n` +
      (buyerAddress ? `पत्ता: ${buyerAddress}\n` : '') +
      `--------------------------------\n` +
      `*साहित्य तपशील (Items):*\n` +
      (itemsSummary || entry.itemDetails) + '\n' +
      (modelNo ? `मॉडेल क्र.: ${modelNo}\n` : '') +
      (serialNo ? `सिरीयल क्र.: ${serialNo}\n` : '') +
      `--------------------------------\n` +
      (isReceipt
        ? `जमा रक्कम: ₹${(Number(entry.payingNow) || 0).toLocaleString()} (${entry.paymentMode})\n`
        : `एकूण रक्कम: ₹${(Number(calculatedTotal || entry.totalAmount) || 0).toLocaleString()}\n` +
          `भरणा / अ‍ॅडव्हान्स: ₹${(Number(entry.payingNow) || 0).toLocaleString()} (${entry.paymentMode})\n` +
          ((Number(entry.dueAmount) || 0) > 0
            ? `बाकी / देय रक्कम: ₹${(Number(entry.dueAmount) || 0).toLocaleString()}\n`
            : `स्थिती: पूर्ण भरणा (Fully Paid)\n`)) +
      (isQuotationMode ? `वैधता: ${validityDays}\n` : '') +
      `--------------------------------\n` +
      `बँक तपशील: ${settings.bankDetails?.bankName || 'HDFC Bank'}\n` +
      `A/C: ${settings.bankDetails?.accountNumber || '50200083215914'} | IFSC: ${settings.bankDetails?.ifsc || 'HDFC0000965'}\n` +
      `🔗 Digital Invoice: ${invoiceUrl}\n` +
      `GSTIN: 27ALOPL0030G2ZC\n` +
      `संपर्क: 8766486915 • 8600122978\n` +
      `श्री साई इंटरप्राइजेस, आर्वी रोड, वर्धा.`;

    const phone = entry.customerPhone ? entry.customerPhone.replace(/[^0-9]/g, '') : '';
    const url = phone
      ? `https://wa.me/91${phone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const modalContent = (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div
        className={`bg-white dark:bg-slate-900 rounded-2xl w-full shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-fade-in my-auto transition-all ${
          layoutMode === 'tally-gst' ? 'max-w-4xl' : 'max-w-xl'
        }`}
      >
        {/* Top Action & Configuration Header (Hidden in Print) */}
        <div className="no-print bg-slate-900 dark:bg-slate-950 text-white px-3 sm:px-5 py-3 flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-800">
          {/* Format Mode & Type Switches */}
          <div className="flex flex-wrap items-center gap-2">
            {!isReceipt && (
              <>
                {/* 1. Layout Mode Switcher */}
                <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-xs">
                  <button
                    type="button"
                    onClick={() => setLayoutMode('tally-gst')}
                    className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      layoutMode === 'tally-gst'
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="जसे तुमच्या फोटोमध्ये आहे (Full A4 Professional Tax Invoice / Quotation)"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>A4 जीएसटी / Tally फॉरमॅट</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLayoutMode('compact-slip')}
                    className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      layoutMode === 'compact-slip'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="कॉम्पॅक्ट पावती स्लिप"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>कॉम्पॅक्ट स्लिप</span>
                  </button>
                </div>

                {/* 2. Document Type Switcher */}
                <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-xs">
                  <button
                    type="button"
                    onClick={() => setDocType('quotation')}
                    className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      docType === 'quotation'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>📋 कोटेशन</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDocType('tax-bill')}
                    className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      docType === 'tax-bill'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>टॅक्स इनव्हॉइस</span>
                  </button>
                </div>
              </>
            )}

            <span className="font-mono text-xs text-slate-300 hidden md:inline">
              #{displayDocNumber}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {!isReceipt && (
              <button
                type="button"
                onClick={() => setIsEditingDetails(!isEditingDetails)}
                className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition ${
                  isEditingDetails
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-amber-300'
                }`}
                title="साहित्य (Line Items), ट्रान्सपोर्ट आणि मॉडेल नंबर बदला"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Items व तपशील एडिट</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowThermalModal(true)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 text-xs font-semibold flex items-center gap-1 cursor-pointer transition shadow-xs"
              title="2-इंच / 3-इंच POS थर्मल प्रिंट पावती"
            >
              <Printer className="w-3.5 h-3.5 text-cyan-400" />
              <span>थर्मल पावती</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>प्रिंट (A4)</span>
            </button>
            <button
              onClick={handleShareWhatsApp}
              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition shadow-xs"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Save Confirmation Toast */}
        {saveSuccessMsg && (
          <div className="no-print bg-emerald-600 text-white text-xs font-bold py-1.5 px-4 text-center animate-fade-in flex items-center justify-center gap-2">
            <Check className="w-4 h-4" />
            <span>तपशील यशस्वीरीत्या सेव्ह झाले आणि कोटेशन/बिल अपडेट झाले!</span>
          </div>
        )}

        {/* Multi-Item & Dispatch Edit Drawer (no-print) */}
        {isEditingDetails && !isReceipt && (
          <div className="no-print bg-amber-50 dark:bg-slate-800 border-b border-amber-200 dark:border-slate-700 p-3 sm:p-4 text-xs animate-fade-in max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-amber-200 dark:border-slate-700 mb-3">
              <h3 className="font-bold text-amber-950 dark:text-amber-300 text-sm flex items-center gap-1.5">
                <Edit3 className="w-4 h-4" />
                <span>कोटेशन / बिलामधील साहित्य (Line Items) व ट्रान्सपोर्ट तपशील एडिट करा</span>
              </h3>
              <button
                type="button"
                onClick={handleSaveSpecsAndItems}
                className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>बदल सेव्ह करा (Save)</span>
              </button>
            </div>

            {/* Line items editor */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                  साहित्य यादी (Description of Goods - जसे फोटोत आहे):
                </span>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="px-2 py-0.5 bg-blue-600 text-white rounded font-bold text-[11px] flex items-center gap-1 cursor-pointer hover:bg-blue-700"
                >
                  <Plus className="w-3 h-3" />
                  <span>नवीन वस्तू जोडा (Add Item)</span>
                </button>
              </div>

              <div className="space-y-2">
                {lineItems.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="grid grid-cols-12 gap-2 p-2 bg-white dark:bg-slate-900 rounded-lg border border-amber-200 dark:border-slate-700 items-center"
                  >
                    <div className="col-span-1 text-center font-bold text-slate-500 font-mono">
                      #{idx + 1}
                    </div>
                    <div className="col-span-4">
                      <input
                        type="text"
                        value={item.description || ''}
                        onChange={(e) => handleUpdateItem(idx, 'description', e.target.value)}
                        placeholder="उदा. Red Apple Bed / IFB AC / LG TV"
                        className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="text"
                        value={item.hsn || ''}
                        onChange={(e) => handleUpdateItem(idx, 'hsn', e.target.value)}
                        placeholder="HSN (0)"
                        className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div className="col-span-1">
                      <input
                        type="number"
                        min="1"
                        value={item.qty ?? 1}
                        onChange={(e) => handleUpdateItem(idx, 'qty', e.target.value)}
                        placeholder="Qty"
                        className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs font-mono font-bold text-center focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        value={item.rate ?? 0}
                        onChange={(e) => handleUpdateItem(idx, 'rate', e.target.value)}
                        placeholder="दर (Rate)"
                        className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div className="col-span-1 text-right font-mono font-bold text-slate-900 dark:text-white">
                      ₹{((Number(item.qty) || 0) * (Number(item.rate) || 0)).toLocaleString()}
                    </div>
                    <div className="col-span-1 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        disabled={lineItems.length <= 1}
                        className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded disabled:opacity-30 cursor-pointer"
                        title="Delete line"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dispatch, Transport & Customer Address Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-white dark:bg-slate-900 rounded-lg border border-amber-200 dark:border-slate-700 mb-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                  ग्राहकाचा संपूर्ण पत्ता (Buyer Address):
                </label>
                <input
                  type="text"
                  value={buyerAddress || ''}
                  onChange={(e) => setBuyerAddress(e.target.value)}
                  placeholder="उदा. Nagthana Road Hanuman Mandir Wardha 442001"
                  className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                  डिलिव्हरी ठिकाण (Destination):
                </label>
                <input
                  type="text"
                  value={dispatchDetails.destination || ''}
                  onChange={(e) =>
                    setDispatchDetails({ ...dispatchDetails, destination: e.target.value })
                  }
                  placeholder="उदा. Wardha / Seloo"
                  className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                  कशाद्वारे पाठवले (Despatched Through):
                </label>
                <input
                  type="text"
                  value={dispatchDetails.despatchedThrough || ''}
                  onChange={(e) =>
                    setDispatchDetails({ ...dispatchDetails, despatchedThrough: e.target.value })
                  }
                  placeholder="उदा. Direct Delivery / Tempo"
                  className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                  मॉडेल क्र. (Model No):
                </label>
                <input
                  type="text"
                  value={modelNo || ''}
                  onChange={(e) => setModelNo(e.target.value)}
                  placeholder="उदा. 55NU875 4K"
                  className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                  सिरीयल क्र. (Serial No / IMEI):
                </label>
                <input
                  type="text"
                  value={serialNo || ''}
                  onChange={(e) => setSerialNo(e.target.value)}
                  placeholder="उदा. SN-892182"
                  className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                  कोटेशन वैधता (Validity):
                </label>
                <input
                  type="text"
                  value={validityDays || ''}
                  onChange={(e) => setValidityDays(e.target.value)}
                  placeholder="उदा. 15 दिवस वैध"
                  className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Printable Invoice Container */}
        <div id="printable-invoice" className="p-3 sm:p-5 text-slate-900 bg-white">
          {layoutMode === 'tally-gst' && !isReceipt ? (
            /* Format 1: Exact Tally / GST A4 Format matching the user's PDF */
            <ProfessionalGstInvoice
              entry={entry}
              settings={settings}
              docType={docType}
              lineItems={lineItems}
              dispatchDetails={dispatchDetails}
              modelNo={modelNo}
              serialNo={serialNo}
              validityDays={validityDays}
            />
          ) : (
            /* Format 2: Compact Receipt Slip */
            <div className="bg-white text-slate-800 rounded-xl border border-slate-200 overflow-hidden">
              <div className="bg-[#102A45] text-white px-6 py-5 text-center border-b-2 border-amber-500">
                <div className="flex justify-center mb-2">
                  <AppLogo size="sm" variant="iconOnly" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-wide font-serif">
                  {settings.businessName || 'श्री साई इंटरप्राइजेस'}
                </h2>
                <p className="text-xs sm:text-sm font-medium text-slate-200 mt-1">
                  Shri Sai Enterprises • Electronics & Home Appliances
                </p>
                <p className="text-[11px] sm:text-xs text-slate-300 mt-1">
                  पत्ता : मातोश्री सभागृह समोर आर्वी रोड पंजाब कॉलनी वर्धा ,442001
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono text-amber-300 mt-1.5 font-bold">
                  <span>📞 8766486915</span>
                  <span>•</span>
                  <span>8600122798</span>
                  <span>•</span>
                  <span>GST: 27ALOPL0030G2ZC</span>
                </div>
              </div>

              <div className="p-5 space-y-3.5">
                {/* Header details */}
                <div className="flex justify-between items-center border-b pb-3 text-xs">
                  <div>
                    <span
                      className={`px-2 py-0.5 rounded font-black text-xs uppercase tracking-wide ${
                        isQuotationMode
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : isReceipt
                          ? 'bg-purple-100 text-purple-900 border border-purple-300'
                          : 'bg-blue-100 text-blue-900 border border-blue-300'
                      }`}
                    >
                      {isQuotationMode
                        ? '📋 कोटेशन (QUOTATION)'
                        : isReceipt
                        ? 'पावती / RECEIPT'
                        : 'टॅक्स बिल / TAX INVOICE'}
                    </span>
                    <p className="font-bold font-mono text-slate-900 text-sm mt-1">
                      #{displayDocNumber}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-700">
                      दिनांक: <span className="font-bold font-mono">{entry.date}</span>
                    </p>
                    <span className="inline-block px-2 py-0.5 mt-1 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      {entry.paymentMode}
                    </span>
                  </div>
                </div>

                {/* Customer info */}
                <div className="bg-slate-50 rounded-xl p-3 text-xs border border-slate-200">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">
                    नाव / Billed To:
                  </span>
                  <p className="font-bold text-slate-900 text-sm">{entry.customerName}</p>
                  <p className="text-slate-600 font-mono mt-0.5">
                    {entry.customerPhone && `मो. ${entry.customerPhone} • `}
                    {buyerAddress}
                  </p>
                </div>

                {/* Items */}
                <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[11px] border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3 w-10">अ.क्र</th>
                        <th className="py-2 px-3">साहित्य तपशील</th>
                        <th className="py-2 px-3 text-right">रक्कम</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {lineItems.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-2 px-3 text-slate-500 font-mono">{idx + 1}</td>
                          <td className="py-2 px-3 font-semibold text-slate-900">
                            {item.description}
                            <span className="text-slate-500 text-[10px] block font-mono">
                              Qty: {item.qty} {item.per || 'nos'} @ ₹{item.rate}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right font-bold font-mono text-slate-900">
                            ₹{(Number(item.amount) || Number(item.qty) * Number(item.rate) || 0).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="space-y-1.5 pt-1 text-xs border-t border-slate-200">
                  <div className="flex justify-between text-slate-700 font-medium">
                    <span>एकूण बिल रक्कम:</span>
                    <span className="font-bold text-slate-900 text-sm font-mono">
                      ₹{(Number(calculatedTotal || entry.totalAmount) || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-700 font-medium">
                    <span>भरणा / जमा:</span>
                    <span className="font-bold text-emerald-600 text-sm font-mono">
                      ₹{(Number(entry.payingNow) || 0).toLocaleString()}
                    </span>
                  </div>
                  {(Number(entry.dueAmount) || 0) > 0 ? (
                    <div className="flex justify-between text-amber-800 bg-amber-50 px-3 py-1.5 rounded-lg font-bold border border-amber-200">
                      <span>उर्वरित बाकी:</span>
                      <span className="font-mono">₹{(Number(entry.dueAmount) || 0).toLocaleString()}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-emerald-700 text-[11px] font-semibold pt-1">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Full payment received with thanks.</span>
                    </div>
                  )}
                </div>

                {/* Bank Details, UPI QR & Signature */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-200 text-[10px]">
                  <div className="bg-slate-50 p-2 rounded border border-slate-200">
                    <p className="font-bold text-slate-900">Bank Details:</p>
                    <p>HDFC Bank | A/C: 50200083215914</p>
                    <p>IFSC: HDFC0000965</p>
                    <p className="font-mono mt-0.5">UPI: {settings.upiId || '8766486915@ybl'}</p>
                  </div>
                  <div className="flex items-center justify-center">
                    <DynamicUpiQrCode
                      upiId={settings.upiId || '8766486915@ybl'}
                      payeeName={settings.businessName || 'Shri Sai Enterprises'}
                      amount={Number(entry.dueAmount) > 0 ? Number(entry.dueAmount) : Number(entry.totalAmount) || 0}
                      note={`Rec #${displayDocNumber}`}
                      size={80}
                      showBadges={false}
                      showAmountPill={true}
                    />
                  </div>
                  <div className="text-right flex flex-col justify-end">
                    <p className="font-bold text-slate-900">श्री साई इंटरप्राइजेस</p>
                    <p className="text-slate-500 text-[9px]">Authorised Signatory</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showThermalModal && entry && (
        <ThermalReceiptModal
          isOpen={showThermalModal}
          onClose={() => setShowThermalModal(false)}
          settings={settings}
          data={{
            type: 'sales_bill',
            receiptNo: displayDocNumber,
            date: entry.date || new Date().toISOString().split('T')[0],
            customerName: entry.customerName || 'ग्राहक',
            customerPhone: entry.customerPhone,
            customerVillage: entry.village || buyerAddress,
            paidAmount: Number(entry.payingNow) || Number(entry.totalAmount) || 0,
            totalAmount: Number(entry.totalAmount) || 0,
            dueAmount: Number(entry.dueAmount) || 0,
            paymentMode: entry.paymentMode || 'Cash',
            items: lineItems.map((li) => ({
              name: li.description,
              qty: Number(li.qty) || 1,
              rate: Number(li.rate) || 0,
              amount: Number(li.amount) || Number(li.qty) * Number(li.rate) || 0,
            })),
          }}
        />
      )}
    </div>
  );

  if (typeof document === 'undefined') {
    return modalContent;
  }
  return createPortal(modalContent, document.body);
};
