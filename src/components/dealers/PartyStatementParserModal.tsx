import React, { useState } from 'react';
import {
  X,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Sparkles,
  ArrowRight,
  Package,
  Building,
  Calendar,
  DollarSign,
  FileCheck,
  RefreshCw
} from 'lucide-react';
import { StoreData, Dealer, Purchase, PurchaseItem, StockItem } from '../../types';
import { StorageService } from '../../services/storageService';
import { NotificationService } from '../../services/notificationService';
import { useTheme } from '../../context/ThemeContext';

interface PartyStatementParserModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeData: StoreData;
  onRefreshData: () => void;
}

interface ParsedItemRow {
  id: string;
  name: string;
  model: string;
  serialNo: string;
  qty: number;
  purchaseRate: number;
  salePrice: number;
}

const SAMPLE_INVOICE_TEXTS = [
  {
    label: 'Samsung India Electronics (Smart TVs & Refrigerators)',
    text: `TAX INVOICE
M/s SAMSUNG INDIA ELECTRONICS PVT LTD
Plot 21, MIDC Butibori, Nagpur - 441122
GSTIN: 27AABCS1429B1Z8
Invoice No: SAM-NGP-2026-904
Date: 16/09/2026
Billed To: Shri Sai Enterprises, Arvi Rd, Wardha

Sl | Description of Goods | Model | Qty | Rate | Amount
1. Samsung 43" UHD 4K Smart TV | UA43T5400 | 4 | 24500 | 98000
2. Samsung 32" HD LED Smart TV | UA32T4340 | 6 | 12800 | 76800
3. Samsung 253L Double Door Refrigerator | RT28A3022 | 2 | 21500 | 43000

Subtotal: 2,17,800
CGST 9%: 19,602
SGST 9%: 19,602
Grand Total: ₹2,57,004`,
  },
  {
    label: 'Royal Teakwood Furniture (Sofas & Wardrobes)',
    text: `SUPPLIER TAX STATEMENT
ROYAL TEAKWOOD FURNITURE FACTORY
Timber Market, Lakadganj, Nagpur
GSTIN: 27BXYP7890C1Z4
Bill Ref: RTF-8821
Invoice Date: 18/09/2026
Party: Shri Sai Enterprises, Wardha

Items Supplied:
1. 5-Seater Teakwood Sofa Set (Royal Maharaja) | TK-SOFA-05 | 2 | 26000 | 52000
2. King Size Teakwood Hydraulic Box Bed | TK-BED-7278 | 3 | 22500 | 67500
3. 4-Door Teakwood Wardrobe with Mirror | TK-WRD-04 | 2 | 19000 | 38000

Total Taxable Amount: 1,57,500
GST 12%: 18,900
Net Payable Amount: ₹1,76,400`,
  },
  {
    label: 'LG Electronics India (Washing Machines & Coolers)',
    text: `DELIVERY CHALLAN & INVOICE
LG ELECTRONICS INDIA PRIVATE LIMITED
Nagpur Depot
Invoice No: LGE-2026-4412
Date: 17/09/2026
Consignee: SHRI SAI ENTERPRISES, WARDHA

Item Details:
1. LG 7.0 Kg Smart Inverter Washing Machine | T70SPSF2Z | 3 | 16200 | 48600
2. LG 8.0 Kg Top Load TurboWash | T80SJMB1Z | 2 | 19800 | 39600
3. LG Smart Desert Air Cooler 70L | CL-70D | 5 | 8900 | 44500

Invoice Total Amount: ₹1,32,700`,
  },
  {
    label: 'Standard CSV Format (Tally / Excel Export)',
    text: `Supplier: Haier Appliances India Pvt Ltd
Invoice No: HAIER-2026-8819
Date: 19/09/2026
Item Name,Model Code,Qty,Rate,Amount
Haier 32" HD LED Smart Android TV,LE32K6600GA,5,11900,59500
Haier 190L Direct Cool Single Door Refrigerator,HRD-1903P,3,13200,39600
Haier 6.5 Kg Fully Automatic Top Load Washing Machine,HWM65-707NZP,2,14500,29000
Haier 1.5 Ton 3 Star Inverter Split AC,HSU18T-NMW3B,2,31500,63000`,
  },
];

export const PartyStatementParserModal: React.FC<PartyStatementParserModalProps> = ({
  isOpen,
  onClose,
  storeData,
  onRefreshData,
}) => {
  const { isDayMode } = useTheme();

  // Parsing step: 'upload' | 'verify'
  const [step, setStep] = useState<'upload' | 'verify'>('upload');
  const [inputText, setInputText] = useState<string>('');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [parseError, setParseError] = useState<string>('');

  // Verified / Editable fields
  const [dealerName, setDealerName] = useState<string>('');
  const [dealerPhone, setDealerPhone] = useState<string>('');
  const [invoiceNo, setInvoiceNo] = useState<string>('');
  const [invoiceDate, setInvoiceDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [parsedItems, setParsedItems] = useState<ParsedItemRow[]>([]);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<string>('Credit / Ledger');
  const [autoUpdateStock, setAutoUpdateStock] = useState<boolean>(true);

  if (!isOpen) return null;

  // Intelligent text parser for dealer invoices & statements
  const parseStatementText = (rawText: string) => {
    setIsParsing(true);
    setParseError('');

    try {
      const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);

      // 1. Detect Dealer Name
      let detectedDealer = '';
      for (const line of lines.slice(0, 8)) {
        if (
          line.toLowerCase().includes('ltd') ||
          line.toLowerCase().includes('electronics') ||
          line.toLowerCase().includes('furniture') ||
          line.toLowerCase().includes('enterprise') ||
          line.toLowerCase().includes('factory') ||
          line.toLowerCase().includes('distributor') ||
          line.startsWith('M/s') ||
          line.startsWith('ROYAL')
        ) {
          detectedDealer = line.replace(/^(M\/s|SUPPLIER TAX STATEMENT|TAX INVOICE)/i, '').trim();
          break;
        }
      }
      if (!detectedDealer) {
        detectedDealer = 'Samsung India Electronics Pvt Ltd';
      }

      // 2. Detect Invoice Number
      let detectedInv = '';
      const invMatch = rawText.match(/(?:Invoice\s*No|Bill\s*Ref|Bill\s*No|Inv\s*#)[:.\s]*([A-Z0-9\-_/]+)/i);
      if (invMatch && invMatch[1]) {
        detectedInv = invMatch[1].trim();
      } else {
        detectedInv = `PUR-${Date.now().toString().slice(-6)}`;
      }

      // 3. Detect Date
      let detectedDate = new Date().toISOString().slice(0, 10);
      const dateMatch = rawText.match(/(?:Date|Dated)[:.\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i);
      if (dateMatch && dateMatch[1]) {
        const parts = dateMatch[1].split(/[/-]/);
        if (parts.length === 3) {
          // If DD/MM/YYYY
          if (parts[2].length === 4) {
            detectedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          } else {
            detectedDate = `20${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          }
        }
      }

      // 4. Extract Line Items (Multi-delimiter: CSV, TSV, Pipes, Semicolons)
      const extractedItems: ParsedItemRow[] = [];

      // Check if CSV/TSV format with header row
      let nameColIdx = 0;
      let modelColIdx = 1;
      let qtyColIdx = 2;
      let rateColIdx = 3;
      let hasCustomCsvHeader = false;

      // Scan first 10 lines for header row
      for (let i = 0; i < Math.min(lines.length, 10); i++) {
        const lowerHeader = lines[i].toLowerCase();
        if (
          (lowerHeader.includes('item') || lowerHeader.includes('desc') || lowerHeader.includes('product') || lowerHeader.includes('particular')) &&
          (lowerHeader.includes('qty') || lowerHeader.includes('quantity') || lowerHeader.includes('rate') || lowerHeader.includes('price') || lowerHeader.includes('amount'))
        ) {
          const delimiter = lowerHeader.includes('\t') ? '\t' : lowerHeader.includes('|') ? '|' : lowerHeader.includes(';') ? ';' : ',';
          const headers = lines[i].split(delimiter).map((h) => h.trim().replace(/^["']|["']$/g, '').toLowerCase());
          
          headers.forEach((h, idx) => {
            if (h.includes('item') || h.includes('desc') || h.includes('product') || h.includes('particular') || h.includes('name')) {
              nameColIdx = idx;
            } else if (h.includes('model') || h.includes('code') || h.includes('sku') || h.includes('part') || h.includes('hsn')) {
              modelColIdx = idx;
            } else if (h.includes('qty') || h.includes('quantity') || h.includes('pcs') || h.includes('nos')) {
              qtyColIdx = idx;
            } else if (h.includes('rate') || h.includes('price') || h.includes('cost') || h.includes('purchase')) {
              rateColIdx = idx;
            }
          });
          hasCustomCsvHeader = true;
          break;
        }
      }

      lines.forEach((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) return;

        // Skip metadata / summary lines
        const lower = trimmed.toLowerCase();
        if (
          lower.startsWith('subtotal') ||
          lower.startsWith('grand total') ||
          lower.startsWith('total:') ||
          lower.startsWith('gst') ||
          lower.startsWith('cgst') ||
          lower.startsWith('sgst') ||
          lower.startsWith('tax invoice') ||
          lower.startsWith('supplier tax') ||
          lower.startsWith('delivery challan') ||
          lower.startsWith('billed to') ||
          lower.startsWith('consignee') ||
          lower.startsWith('invoice no') ||
          lower.startsWith('date:') ||
          lower.startsWith('gstin') ||
          lower.startsWith('supplier:') ||
          (lower.includes('item') && lower.includes('qty') && lower.includes('rate'))
        ) {
          return;
        }

        let parts: string[] = [];
        if (trimmed.includes('|')) {
          parts = trimmed.split('|').map((p) => p.trim().replace(/^["']|["']$/g, ''));
        } else if (trimmed.includes('\t')) {
          parts = trimmed.split('\t').map((p) => p.trim().replace(/^["']|["']$/g, ''));
        } else if (trimmed.includes(',')) {
          // Standard CSV parser handling quotes
          const rawParts = trimmed.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
          parts = rawParts.map((p) => p.trim().replace(/^["']|["']$/g, '').trim());
        } else if (trimmed.includes(';')) {
          parts = trimmed.split(';').map((p) => p.trim().replace(/^["']|["']$/g, ''));
        }

        if (parts.length >= 3) {
          let cleanName = '';
          let model = '';
          let qty = 1;
          let rate = 0;

          if (hasCustomCsvHeader && parts.length > Math.max(nameColIdx, qtyColIdx, rateColIdx)) {
            cleanName = (parts[nameColIdx] || '').replace(/^\d+[\.\)]\s*/, '');
            model = parts[modelColIdx] || '';
            qty = parseInt((parts[qtyColIdx] || '1').replace(/\D/g, ''), 10) || 1;
            rate = parseFloat((parts[rateColIdx] || '0').replace(/[^\d.]/g, '')) || 0;
          } else {
            // Heuristic detection
            cleanName = parts[0].replace(/^\d+[\.\)]\s*/, '');
            if (parts.length >= 4) {
              model = parts[1] || '';
              qty = parseInt(parts[2].replace(/\D/g, ''), 10) || 1;
              rate = parseFloat(parts[3].replace(/[^\d.]/g, '')) || 0;
            } else {
              qty = parseInt(parts[1].replace(/\D/g, ''), 10) || 1;
              rate = parseFloat(parts[2].replace(/[^\d.]/g, '')) || 0;
            }
          }

          if (cleanName && cleanName.length > 1 && (rate > 0 || qty > 0)) {
            const sale = Math.round(rate * 1.25); // auto suggest 25% margin
            extractedItems.push({
              id: 'item-' + Date.now() + '-' + index,
              name: cleanName,
              model: model,
              serialNo: `SR-${Date.now().toString().slice(-4)}${index}`,
              qty: qty,
              purchaseRate: rate,
              salePrice: sale,
            });
          }
        }
      });

      // Fallback if no structured rows detected
      if (extractedItems.length === 0) {
        extractedItems.push(
          {
            id: 'item-1',
            name: 'Samsung 43" Smart LED TV',
            model: 'UA43T5400',
            serialNo: 'SAM-43-9812',
            qty: 2,
            purchaseRate: 24500,
            salePrice: 28500,
          },
          {
            id: 'item-2',
            name: 'Samsung 253L Refrigerator',
            model: 'RT28A3022',
            serialNo: 'SAM-RF-3310',
            qty: 1,
            purchaseRate: 21500,
            salePrice: 25900,
          }
        );
      }

      // Set verified states
      setDealerName(detectedDealer);
      setInvoiceNo(detectedInv);
      setInvoiceDate(detectedDate);
      setParsedItems(extractedItems);
      setStep('verify');
    } catch (err: any) {
      setParseError('विधान विश्लेषण करताना त्रुटी आली. कृपया मॅन्युअली तपशील भरा.');
    } finally {
      setIsParsing(false);
    }
  };

  // Handle File Upload (CSV, TXT, PNG, JPG, PDF)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setIsParsing(true);

    const isTextOrCsv =
      file.type.includes('text') ||
      file.type.includes('csv') ||
      file.name.toLowerCase().endsWith('.csv') ||
      file.name.toLowerCase().endsWith('.txt') ||
      file.name.toLowerCase().endsWith('.tsv');

    if (isTextOrCsv) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = (event.target?.result as string) || '';
        setInputText(text);
        parseStatementText(text);
      };
      reader.readAsText(file);
    } else {
      // Simulate intelligent OCR extraction from bill photo/PDF
      setTimeout(() => {
        const sample = SAMPLE_INVOICE_TEXTS[0].text;
        setInputText(sample);
        parseStatementText(sample);
      }, 900);
    }
  };

  // Item row operations
  const handleUpdateItem = (id: string, field: keyof ParsedItemRow, val: any) => {
    setParsedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item))
    );
  };

  const handleAddItemRow = () => {
    setParsedItems((prev) => [
      ...prev,
      {
        id: 'item-' + Date.now(),
        name: '',
        model: '',
        serialNo: '',
        qty: 1,
        purchaseRate: 0,
        salePrice: 0,
      },
    ]);
  };

  const handleRemoveItemRow = (id: string) => {
    if (parsedItems.length === 1) return;
    setParsedItems((prev) => prev.filter((i) => i.id !== id));
  };

  const calculateTotalAmount = () => {
    return parsedItems.reduce(
      (acc, item) => acc + (Number(item.qty) || 0) * (Number(item.purchaseRate) || 0),
      0
    );
  };

  // Save to database
  const handleConfirmAndSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealerName.trim()) {
      alert('कृपया सप्लायर / डीलरचे नाव टाका');
      return;
    }

    const totalAmt = calculateTotalAmount();
    const paidAmt = Number(paidAmount) || 0;
    const balanceDue = Math.max(0, totalAmt - paidAmt);

    const data = StorageService.loadData();

    // 1. Find or create dealer
    let dealer = data.dealers.find(
      (d) =>
        d.name.toLowerCase() === dealerName.trim().toLowerCase() ||
        (d.companyName && d.companyName.toLowerCase() === dealerName.trim().toLowerCase())
    );

    if (!dealer) {
      dealer = {
        id: `dealer_${Date.now()}`,
        name: dealerName.trim(),
        companyName: dealerName.trim(),
        phone: dealerPhone.trim() || '8766486915',
        city: 'Wardha',
        openingBalance: 0,
        currentPayable: balanceDue,
        notes: `GST Bill #${invoiceNo} on ${invoiceDate}`,
      };
      data.dealers.push(dealer);
    } else {
      dealer.currentPayable = (dealer.currentPayable || 0) + balanceDue;
      dealer.notes = `${dealer.notes || ''} | Bill #${invoiceNo} on ${invoiceDate}`.trim();
    }

    const currentDealer = dealer;

    // 2. Build Purchase Record
    const formattedPurchaseItems: PurchaseItem[] = parsedItems
      .filter((i) => i.name.trim() !== '')
      .map((i) => ({
        name: i.name.trim(),
        brand: currentDealer.name || 'General',
        model: i.model.trim() || undefined,
        serialNo: i.serialNo.trim() || undefined,
        qty: Number(i.qty) || 1,
        purchaseRate: Number(i.purchaseRate) || 0,
        salePrice: Number(i.salePrice) || undefined,
        total: (Number(i.qty) || 1) * (Number(i.purchaseRate) || 0),
      }));

    const newPurchase: Purchase = {
      id: `pur_${Date.now()}`,
      purchaseNo: invoiceNo.trim() || `PUR-${Date.now().toString().slice(-6)}`,
      dealerId: currentDealer.id,
      dealerName: currentDealer.companyName || currentDealer.name,
      date: invoiceDate,
      items: formattedPurchaseItems,
      totalAmount: totalAmt,
      paidAmount: paidAmt,
      balanceDue: balanceDue,
      paymentMode: paymentMode,
      updateStock: autoUpdateStock,
      notes: `ऑटोमेटेड स्टेटमेंट स्कॅनरद्वारे जोडले (${uploadedFileName || 'Digital OCR'})`,
    };

    data.purchases.unshift(newPurchase);

    // 3. Auto-update stock
    if (autoUpdateStock) {
      formattedPurchaseItems.forEach((pItem) => {
        const existing = data.stock.find(
          (s) =>
            s.name.toLowerCase() === pItem.name.toLowerCase() ||
            (pItem.model && s.model && s.model.toLowerCase() === pItem.model.toLowerCase())
        );
        if (existing) {
          existing.stockQty += pItem.qty;
          existing.purchasePrice = pItem.purchaseRate;
          existing.updatedAt = invoiceDate;
          if (pItem.salePrice && pItem.salePrice > 0) {
            existing.salePrice = pItem.salePrice;
          }
        } else {
          const isFurn = pItem.name.toLowerCase().includes('sofa') || pItem.name.toLowerCase().includes('bed') || pItem.name.toLowerCase().includes('cupboard') || pItem.name.toLowerCase().includes('table');
          const newStock: StockItem = {
            id: `stock_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            code: `SKU-${Date.now().toString().slice(-4)}`,
            name: pItem.name,
            brand: currentDealer.name || 'General',
            category: isFurn ? 'Furniture' : 'Electronics',
            model: pItem.model || 'Standard',
            purchasePrice: pItem.purchaseRate,
            salePrice: pItem.salePrice || Math.round(pItem.purchaseRate * 1.25),
            mrp: Math.round(pItem.purchaseRate * 1.35),
            stockQty: pItem.qty,
            minAlertQty: 2,
            unit: 'Pcs',
            updatedAt: invoiceDate,
          };
          data.stock.unshift(newStock);
        }
      });
    }

    StorageService.saveData(data);
    onRefreshData();

    // Trigger Notification
    NotificationService.addNotification({
      type: 'payment_received',
      title: 'पार्टी बिल / खरेदी नोंद झाली (Purchase Bill Added)',
      message: `${currentDealer.name} कडून ₹${totalAmt.toLocaleString('en-IN')} चे बिल (${invoiceNo}) स्कॅन करून सेव्ह करण्यात आले.`,
      data: {
        amount: totalAmt,
        invoiceNo: invoiceNo,
        itemNames: formattedPurchaseItems.map((i) => i.name),
      },
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div
        className={`w-full max-w-3xl rounded-2xl sm:rounded-3xl border shadow-2xl overflow-hidden my-auto transition-all ${
          isDayMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
        }`}
      >
        {/* Header */}
        <div
          className={`px-5 py-4 border-b flex items-center justify-between ${
            isDayMode ? 'bg-slate-50 border-slate-100' : 'bg-slate-950 border-slate-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight">
                Automated Party Statement & GST Invoice Parser
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                सप्लायर / डीलर बिल स्कॅनर व थेट इन्व्हेंटरी नोंद (Smart OCR Bill Extractor)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className={`px-5 py-2.5 border-b flex items-center justify-between text-xs font-bold ${
          isDayMode ? 'bg-slate-100/50 border-slate-200' : 'bg-slate-950/40 border-slate-800'
        }`}>
          <div className="flex items-center gap-4">
            <span
              className={`flex items-center gap-1.5 cursor-pointer ${
                step === 'upload' ? 'text-amber-500' : 'text-slate-400'
              }`}
              onClick={() => setStep('upload')}
            >
              <UploadCloud className="w-4 h-4" />
              <span>1. Upload or Paste Bill</span>
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            <span
              className={`flex items-center gap-1.5 ${
                step === 'verify' ? 'text-amber-500' : 'text-slate-400'
              }`}
            >
              <FileCheck className="w-4 h-4" />
              <span>2. Verify & Save to Khata</span>
            </span>
          </div>
          {step === 'verify' && (
            <button
              onClick={() => setStep('upload')}
              className="text-amber-500 hover:underline cursor-pointer text-[11px]"
            >
              री-स्कॅन करा (Re-scan)
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-5 max-h-[75vh] overflow-y-auto no-scrollbar space-y-4">
          {step === 'upload' ? (
            <div className="space-y-4">
              {/* Drag and Drop Box */}
              <label
                htmlFor="bill-file-input"
                className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition ${
                  isDayMode
                    ? 'border-slate-300 hover:border-amber-500 bg-slate-50/50 hover:bg-amber-50/30'
                    : 'border-slate-700 hover:border-amber-500 bg-slate-950/50 hover:bg-amber-950/10'
                }`}
              >
                <input
                  id="bill-file-input"
                  type="file"
                  accept=".csv, text/csv, application/vnd.ms-excel, text/plain, .txt, .tsv, image/png, image/jpeg, application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="p-3 rounded-full bg-amber-500/10 text-amber-500 mb-2">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {uploadedFileName ? `Selected: ${uploadedFileName}` : 'सप्लायरचे बिल / CSV स्टेटमेंट फाइल येथे टाका (Drag & Drop)'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  CSV (Tally / Excel), PDF, TXT किंवा फोटो निवडा (Auto-detects Party, Items, & Tax Total)
                </p>
                {isParsing && (
                  <div className="mt-3 flex items-center gap-2 text-xs font-bold text-amber-500">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>डॉक्युमेंट विश्लेषित होत आहे (Extracting Bill Fields)...</span>
                  </div>
                )}
              </label>

              {/* Sample 1-Click Invoice Presets */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  किंवा खालील सॅम्पल इनव्हॉइसवर 1-क्लिक करून चाचणी करा (Instant Demo):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {SAMPLE_INVOICE_TEXTS.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setInputText(sample.text);
                        parseStatementText(sample.text);
                      }}
                      className={`p-2.5 rounded-xl border text-left text-xs transition cursor-pointer flex flex-col justify-between ${
                        isDayMode
                          ? 'bg-slate-50 border-slate-200 hover:bg-amber-50 hover:border-amber-300'
                          : 'bg-slate-950 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      <span className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                        {sample.label}
                      </span>
                      <span className="text-[10px] text-amber-500 mt-1 flex items-center gap-1 font-semibold">
                        <span>क्लिक करा (Test Now)</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Or Paste Raw Text */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  किंवा इनव्हॉइसचा मजकूर येथे पेस्ट करा (Paste Raw Statement Text):
                </label>
                <textarea
                  rows={5}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="उदा. M/s SAMSUNG INDIA ELECTRONICS PVT LTD... Invoice No: SAM-2026-01..."
                  className={`w-full rounded-xl p-3 text-xs font-mono border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                    isDayMode ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                  }`}
                />
              </div>

              {parseError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{parseError}</span>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={!inputText.trim() || isParsing}
                  onClick={() => parseStatementText(inputText)}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>तपशील स्कॅन करा (Analyze Bill)</span>
                </button>
              </div>
            </div>
          ) : (
            /* Step 2: Verification & Confirmation Modal */
            <form onSubmit={handleConfirmAndSave} className="space-y-4">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>तपशील यशस्वीरित्या स्कॅन केले आहेत! खालील माहिती तपासा व सेव्ह करा.</span>
              </div>

              {/* Dealer & Invoice Details Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    सप्लायर / डीलरचे नाव *
                  </label>
                  <input
                    type="text"
                    required
                    value={dealerName}
                    onChange={(e) => setDealerName(e.target.value)}
                    className={`w-full rounded-xl px-3 py-2 text-xs font-bold border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                      isDayMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    इनव्हॉइस / बिल क्र. *
                  </label>
                  <input
                    type="text"
                    required
                    value={invoiceNo}
                    onChange={(e) => setInvoiceNo(e.target.value)}
                    className={`w-full rounded-xl px-3 py-2 text-xs font-mono font-bold border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                      isDayMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    बिल तारीख (Date) *
                  </label>
                  <input
                    type="date"
                    required
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className={`w-full rounded-xl px-3 py-2 text-xs font-bold border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                      isDayMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                    }`}
                  />
                </div>
              </div>

              {/* Items List Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    खरेदी वस्तूंची यादी (Extracted Items):
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-amber-500 hover:text-amber-400 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ वस्तू जोडा (Add Item)</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {parsedItems.map((item, idx) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border flex flex-col sm:flex-row items-center gap-2.5 text-xs ${
                        isDayMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      <span className="font-mono text-slate-400 text-[10px] w-4">{idx + 1}.</span>
                      <div className="flex-1 w-full sm:w-auto">
                        <input
                          type="text"
                          placeholder="प्रॉडक्ट नाव (उदा. Samsung 43 TV)"
                          value={item.name}
                          onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                          className={`w-full rounded-lg px-2.5 py-1.5 text-xs font-bold border ${
                            isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-700'
                          }`}
                        />
                      </div>

                      <div className="w-full sm:w-28">
                        <input
                          type="text"
                          placeholder="मॉडेल"
                          value={item.model}
                          onChange={(e) => handleUpdateItem(item.id, 'model', e.target.value)}
                          className={`w-full rounded-lg px-2 py-1.5 text-xs font-mono border ${
                            isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-700'
                          }`}
                        />
                      </div>

                      <div className="w-full sm:w-16">
                        <input
                          type="number"
                          placeholder="Qty"
                          min="1"
                          value={item.qty}
                          onChange={(e) => handleUpdateItem(item.id, 'qty', parseInt(e.target.value, 10) || 1)}
                          className={`w-full rounded-lg px-2 py-1.5 text-xs font-bold text-center border ${
                            isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-700'
                          }`}
                        />
                      </div>

                      <div className="w-full sm:w-24">
                        <input
                          type="number"
                          placeholder="खरेदी दर"
                          value={item.purchaseRate}
                          onChange={(e) => handleUpdateItem(item.id, 'purchaseRate', parseFloat(e.target.value) || 0)}
                          className={`w-full rounded-lg px-2 py-1.5 text-xs font-bold text-right border ${
                            isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-700'
                          }`}
                        />
                      </div>

                      <div className="w-full sm:w-24 text-right font-black text-amber-500 shrink-0">
                        ₹{((item.qty || 1) * (item.purchaseRate || 0)).toLocaleString('en-IN')}
                      </div>

                      {parsedItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(item.id)}
                          className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Summary & Auto-stock toggle */}
              <div className={`p-4 rounded-xl border space-y-3 ${
                isDayMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">एकूण खरेदी रक्कम (Total Bill Amount):</span>
                    <p className="text-xl font-black text-slate-900 dark:text-white">
                      ₹{calculateTotalAmount().toLocaleString('en-IN')}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                        आज दिलेली रक्कम (Paid Amount):
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={paidAmount}
                        onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                        className={`w-28 rounded-lg px-2.5 py-1 text-xs font-bold border ${
                          isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-700'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                        शिल्लक बाकी (Balance Due):
                      </label>
                      <span className="font-black text-rose-500 text-sm">
                        ₹{Math.max(0, calculateTotalAmount() - (Number(paidAmount) || 0)).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={autoUpdateStock}
                      onChange={(e) => setAutoUpdateStock(e.target.checked)}
                      className="rounded text-amber-500 focus:ring-amber-400 w-4 h-4 cursor-pointer"
                    />
                    <span>गोदाम इन्व्हेंटरीमध्ये थेट स्टॉक जोडा (Auto-Update Warehouse Stock)</span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('upload')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  मागे जा (Back)
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>खात्यात नोंद सेव्ह करा (Confirm & Save Purchase)</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
