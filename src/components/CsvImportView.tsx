import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  FileText,
  CreditCard,
  Building2,
  Receipt,
  ArrowRight,
  Database,
  RefreshCw,
  Search,
  Check,
  X,
  Sparkles,
  ShieldCheck,
  Trash2,
  Filter,
  Eye,
  Phone,
  MapPin,
  HelpCircle,
  Layers
} from 'lucide-react';
import {
  CardMember,
  CardSchemeId,
  CardTransaction,
  Customer,
  Dealer,
  PurchaseEntry,
  TransactionEntry
} from '../types';

interface CsvImportViewProps {
  onImportBills: (bills: TransactionEntry[]) => void;
  onImportReceipts: (receipts: CardTransaction[]) => void;
  onImportCardMembers: (members: CardMember[]) => void;
  onImportPurchases: (purchases: PurchaseEntry[], dealers: Dealer[]) => void;
  onImportCustomers?: (customers: Customer[]) => void;
  existingCardMembers?: CardMember[];
  existingDealers?: Dealer[];
  existingCustomers?: Customer[];
  existingBills?: TransactionEntry[];
  existingReceipts?: CardTransaction[];
  onResetData?: (mode: 'all' | 'zero-bills') => void;
  onSwitchTab?: (tab: any) => void;
}

type MainTab = 'universal' | 'manual' | 'search';
type ManualImportType = 'bills' | 'receipts' | 'cards' | 'purchases';

// Comprehensive Village & Spelling Correction Dictionary (Wardha / Vidarbha area)
const SPELLING_MAP: Record<string, string> = {
  KELHZAR: 'Kelzar',
  KELZAR: 'Kelzar',
  KELJHAR: 'Kelzar',
  VAYFAD: 'Waifad',
  WAYFAD: 'Waifad',
  VAIFAD: 'Waifad',
  NILIMA: 'Nilima',
  BORI: 'Bori',
  BORIKAMPTEE: 'Bori',
  'BORI KAMPTEE': 'Bori',
  HINGNI: 'Hingni',
  HINGANI: 'Hingni',
  HINGANGHAT: 'Hinganghat',
  ANTERGAON: 'Antergaon',
  ANTARGAON: 'Antergaon',
  'SINDI MEGHE': 'Sindi Meghe',
  SINDI: 'Sindi Meghe',
  SELU: 'Seloo',
  SELOO: 'Seloo',
  DEOLI: 'Deoli',
  ARVI: 'Arvi',
  PIPRI: 'Pipri',
  'PIPRI MEGHE': 'Pipri',
  SATODA: 'Satoda',
  SHIVNAGAR: 'Shivnagar',
  DEVNAGAR: 'Devnagar',
  'KANHOLI BARA': 'Kanholi Bara',
  KANHOLI: 'Kanholi Bara',
  WARDHA: 'Wardha',
  'ANAND NAGAR': 'Anand Nagar',
  'PUNJAB COLONY': 'Punjab Colony',
};

// Clean spelling helper
function normalizeVillage(raw: string): { cleaned: string; wasCorrected: boolean } {
  if (!raw) return { cleaned: '', wasCorrected: false };
  const upper = raw.trim().toUpperCase().replace(/[\.,]/g, '');
  if (SPELLING_MAP[upper]) {
    const isDifferent = SPELLING_MAP[upper].toUpperCase() !== raw.trim().toUpperCase();
    return { cleaned: SPELLING_MAP[upper], wasCorrected: isDifferent };
  }
  // Title case fallback
  const titleCase = raw
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return { cleaned: titleCase, wasCorrected: false };
}

// Clean names and extract village if in brackets: "ARUN SAYRE (ANTERGAON)"
function parseNameAndVillage(rawName: string, existingVillage?: string): {
  cleanName: string;
  extractedVillage: string;
  wasExtracted: boolean;
} {
  let cleanName = rawName ? rawName.trim() : '';
  let extractedVillage = existingVillage ? existingVillage.trim() : '';
  let wasExtracted = false;

  const bracketMatch = cleanName.match(/\(([^)]+)\)|\[([^\]]+)\]/);
  if (bracketMatch) {
    const villageCandidate = (bracketMatch[1] || bracketMatch[2] || '').trim();
    cleanName = cleanName.replace(/\(([^)]+)\)|\[([^\]]+)\]/, '').trim();
    if (!extractedVillage && villageCandidate) {
      extractedVillage = normalizeVillage(villageCandidate).cleaned;
      wasExtracted = true;
    }
  }

  // Capitalize name properly
  cleanName = cleanName.replace(/\s+/g, ' ');

  return { cleanName, extractedVillage, wasExtracted };
}

// Clean phone numbers
function cleanPhoneNumber(rawPhone: string): { phone: string; wasFormatted: boolean } {
  if (!rawPhone) return { phone: '', wasFormatted: false };
  const digits = rawPhone.replace(/\D/g, '');
  // Ignore single zeros, short numbers, and repetitive dummy sequences (e.g. 0000000000)
  if (!digits || digits.length < 10) return { phone: '', wasFormatted: false };
  if (/^(\d)\1{9,}$/.test(digits) || digits === '1234567890') {
    return { phone: '', wasFormatted: false };
  }
  if (digits.length === 10) {
    return { phone: digits, wasFormatted: rawPhone.trim() !== digits };
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return { phone: digits.slice(2), wasFormatted: true };
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return { phone: digits.slice(1), wasFormatted: true };
  }
  return { phone: digits.slice(-10), wasFormatted: false };
}

// Flexible case/punctuation-insensitive field retriever
function getRowField(row: Record<string, string>, aliases: string[]): string {
  const keys = Object.keys(row);
  for (const alias of aliases) {
    const cleanAlias = alias.toLowerCase().replace(/[\s._-]/g, '');
    const matchedKey = keys.find(
      (k) => k.toLowerCase().replace(/[\s._-]/g, '') === cleanAlias
    );
    if (matchedKey && row[matchedKey] !== undefined && row[matchedKey].toString().trim() !== '') {
      return row[matchedKey].toString().trim();
    }
  }
  return '';
}

function getRowNumberField(row: Record<string, string>, aliases: string[]): number {
  const val = getRowField(row, aliases);
  if (!val) return 0;
  const cleaned = val.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

export const CsvImportView: React.FC<CsvImportViewProps> = ({
  onImportBills,
  onImportReceipts,
  onImportCardMembers,
  onImportPurchases,
  existingCardMembers = [],
  existingDealers = [],
  existingCustomers = [],
  existingBills = [],
  existingReceipts = [],
  onResetData,
  onSwitchTab,
}) => {
  // Main Navigation Tabs (matching Screenshot 2)
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('universal');
  const [activeManualType, setActiveManualType] = useState<ManualImportType>('bills');

  // Input States
  const [csvText, setCsvText] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [showPasteArea, setShowPasteArea] = useState<boolean>(false);

  // Parsed & Cleaned universal records
  const [detectedType, setDetectedType] = useState<
    'scheme1' | 'scheme2' | 'scheme3' | 'bills' | 'receipts' | 'customers' | 'purchases' | 'unknown'
  >('unknown');
  const [detectedRecords, setDetectedRecords] = useState<any[]>([]);
  const [cleanStats, setCleanStats] = useState<{
    spellingFixed: number;
    villagesExtracted: number;
    phonesFormatted: number;
    zeroBillsFixed: number;
    totalRows: number;
  }>({ spellingFixed: 0, villagesExtracted: 0, phonesFormatted: 0, zeroBillsFixed: 0, totalRows: 0 });

  // Reset Modal
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Search tab state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchFilterCategory, setSearchFilterCategory] = useState<'all' | 'cards' | 'bills' | 'receipts'>('all');

  // Sample CSV Templates for Manual Mode
  const manualTemplates: Record<ManualImportType, { filename: string; content: string; desc: string }> = {
    bills: {
      filename: 'sample_old_bills.csv',
      desc: 'Old Sales Invoices & Customer Bills',
      content: `InvoiceNo,Date,CustomerName,CustomerPhone,CardNumber,Village,ItemDetails,TotalAmount,PaidAmount,DueAmount,PaymentMode
INV-2025-0101,2025-11-12,Ramesh Patil (Wardha),9822012345,1001,Wardha,Copper Wire 2.5mm 10 coils,15000,10000,5000,Cash
INV-2025-0102,2025-11-15,Mahesh Kulkarni,9823098765,,Kelzar,Modular switches 20 pcs,4800,4800,0,Online
INV-2025-0103,2025-12-01,Sunita More (Waifad),9765412980,1002,Waifad,LED Battens 20W (15 pcs),3750,3750,0,Cash
INV-2025-0104,2026-01-10,Vikas Jadhav,9421876543,1045,Antergaon,Distribution Box 8 Way + MCBs,6200,4000,2200,Cash`,
    },
    receipts: {
      filename: 'sample_weekly_receipts.csv',
      desc: 'Weekly Card Payment & Refund Receipts (साप्ताहिक जमा व परतावा)',
      content: `ReceiptNo,CardNo,SchemeId,CustomerName,Date,WeekNo,Amount,Type,PaymentMode,Remarks
REC-SCH1-101,1030,scheme1,SANGITA UTTAM PATIL,2025-06-08,1,450,WeeklyPayment,Cash,Week 1 payment
REC-SCH2-102,3191,scheme2,SUNIL DANDAGE,2024-11-15,2,1000,WeeklyPayment,Cash,Week 2 payment
REC-SCH3-103,4107,scheme3,RANJANA SHAMBHARKAR,2025-07-12,1,600,WeeklyPayment,Cash,Week 1 deposit
REF-SCH1-104,1001,scheme1,Prakash Shinde,2026-09-04,,5000,Refund,Cash,Customer return refund`,
    },
    cards: {
      filename: 'sample_card_members.csv',
      desc: 'Card Scheme Members (NAME, CARD.NO, VILLEGE, MOBILE.NO, OPENING AMT, DATE, SHEET NO)',
      content: `NAME,CARD.NO,VILLEGE,MOBILE.NO,OPENING AMT,DATE,SHEET NO
RANJANA SHAMBHARKAR,4107,BORI,,600,05-07-2025,2793
VAISHALI BAVNE,4304,HINGNI,,100,18-10-2025,5104
SANGITA,4181,DEVNAGAR,,200,01-10-2025,5110
SUNIL DANDAGE,3191,PIPRI,8855881081,3000,01-11-2024,
PRASHANT BHALE,3201,SATODA,,100,01-11-2024,
SANGITA UTTAM PATIL,1030,HINGNI,7972811639,450,01-06-2025,
YAMUNA PRABHAKAR KAIKADI,1029,HINGNI,8698041323,200,01-06-2025,`,
    },
    purchases: {
      filename: 'sample_dealer_purchases.csv',
      desc: 'Dealer / Supplier Old Purchases (e.g. Manisha Enterprises)',
      content: `BillNo,Date,DealerName,Items,TotalAmount,PaidAmount,PaymentMode
PUR-7701,2026-08-10,Manisha Enterprises,Wires and modular accessories,95000,75000,Online
PUR-7702,2026-08-25,Manisha Enterprises,PVC pipes & conduits lot,50000,40000,Online
PUR-7703,2026-08-15,Polycab Distributors Ltd.,Submersible cables 4mm,72500,72500,Online
PUR-7704,2026-09-01,Anchor Switchgear Pvt Ltd,Panel boards & isolators,28400,20000,Online`,
    },
  };

  // Download sample helper
  const handleDownloadSample = (type: ManualImportType) => {
    const item = manualTemplates[type];
    const blob = new Blob([item.content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', item.filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Universal Smart CSV Parser & Error Cleaner
  const processAndCleanCSV = (content: string, customFileName = '') => {
    setErrorMessage('');
    setSuccessMessage('');

    if (!content.trim()) {
      setDetectedRecords([]);
      setDetectedType('unknown');
      return;
    }

    try {
      const lines = content.trim().split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.length < 2) {
        setErrorMessage('CSV फाईलमध्ये हेडर आणि किमान १ डेटा ओळ असणे आवश्यक आहे.');
        setDetectedRecords([]);
        return;
      }

      // Parse headers
      const rawHeaders = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
      const upperHeaders = rawHeaders.map((h) => h.toUpperCase());

      // Detect Data Type Automatically
      let detected: 'scheme1' | 'scheme2' | 'scheme3' | 'bills' | 'receipts' | 'customers' | 'purchases' | 'unknown' = 'unknown';

      const hasCardNo = upperHeaders.some((h) => h.includes('CARD') || h.includes('CARD.NO') || h.includes('CARDNO'));
      const hasVillage = upperHeaders.some((h) => h.includes('VILLEGE') || h.includes('VILLAGE') || h.includes('CITY'));
      const hasOpeningAmt = upperHeaders.some((h) => h.includes('OPENING') || h.includes('DEPOSIT') || h.includes('AMT'));
      const hasInvoiceNo = upperHeaders.some((h) => h.includes('INVOICE') || h.includes('BILLNO') || h.includes('BILL NO') || h.includes('BILL.NO'));
      const hasReceiptNo = upperHeaders.some((h) => h.includes('RECEIPT') || h.includes('WEEK') || h.includes('REC-') || h.includes('RECIVED BY') || h.includes('RECEIVED BY'));
      const hasDealerName = upperHeaders.some((h) => h.includes('DEALER') || h.includes('SUPPLIER'));
      const hasSalesColumns = upperHeaders.some((h) => h.includes('PRODUCT') || h.includes('ADVANCE') || h.includes('BALANCE'));

      let spellingFixedCount = 0;
      let villagesExtractedCount = 0;
      let phonesFormattedCount = 0;
      let zeroBillsFixedCount = 0;

      const parsedRows: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((v) =>
          v.trim().replace(/^["']|["']$/g, '')
        );
        if (values.length < 2) continue;

        const row: Record<string, string> = {};
        rawHeaders.forEach((header, idx) => {
          row[header] = values[idx] || '';
        });
        parsedRows.push(row);
      }

      if (parsedRows.length === 0) {
        setErrorMessage('कोणतीही वैध डेटा ओळ सापडली नाही.');
        return;
      }

      // Inspect first 10 rows to determine Card Scheme vs Bills
      const sampleCardNumbers: number[] = [];
      parsedRows.slice(0, 20).forEach((r) => {
        const val = parseInt(r['CARD.NO'] || r['CARD NO'] || r.CardNo || r.cardNumber || r.CardNumber || '0');
        if (val > 0) sampleCardNumbers.push(val);
      });

      if (hasCardNo && (hasVillage || hasOpeningAmt || sampleCardNumbers.length > 0)) {
        // Scheme Cards! Determine which scheme (1, 2, or 3)
        const avgCard = sampleCardNumbers.length > 0
          ? sampleCardNumbers.reduce((a, b) => a + b, 0) / sampleCardNumbers.length
          : 0;

        if (avgCard >= 4001 || customFileName.toLowerCase().includes('scheme 3') || customFileName.toLowerCase().includes('scheme3')) {
          detected = 'scheme3';
        } else if (avgCard >= 3001 || customFileName.toLowerCase().includes('scheme 2') || customFileName.toLowerCase().includes('scheme2')) {
          detected = 'scheme2';
        } else {
          detected = 'scheme1';
        }
      } else if (hasReceiptNo || upperHeaders.includes('WEEKNO') || upperHeaders.includes('WEEK') || upperHeaders.includes('RECIVED BY') || upperHeaders.includes('RECEIVED BY')) {
        detected = 'receipts';
      } else if (hasDealerName) {
        detected = 'purchases';
      } else if (hasInvoiceNo || hasSalesColumns || upperHeaders.includes('ITEMDETAILS') || upperHeaders.includes('ITEMS')) {
        detected = 'bills';
      } else {
        detected = 'customers';
      }

      // Clean rows with Spelling Normalizer & Bracket Village Extractor
      const cleanedRows = parsedRows.map((r, index) => {
        const rawName =
          getRowField(r, [
            'NAME',
            'CUSTOMER NAME',
            'CUSTOMER',
            'PARTY NAME',
            'PARTY',
            'CLIENT',
            'ACCOUNT NAME',
            'ACCOUNT',
            'A/C NAME',
            'M/S',
            'NAME OF PARTY',
            'NAME OF CUSTOMER',
            'ग्राहकाचे नाव',
            'नाव',
          ]) || `ग्राहक #${index + 1}`;

        const rawVillage = getRowField(r, [
          'VILLEGE',
          'VILLAGE',
          'CITY',
          'TOWN',
          'AREA',
          'ADDRESS',
          'गाव',
          'पत्ता',
        ]);

        const rawPhone = getRowField(r, [
          'MOBILE.NO',
          'MOBILE NO',
          'MOBILE NUMBER',
          'MOBILE',
          'PHONE',
          'PHONE NUMBER',
          'CONTACT',
          'CONTACT NO',
          'TEL',
          'CELL',
          'WHATSAPP',
          'मोबाईल',
        ]);

        // 1. Extract village from name brackets: "ARUN SAYRE (ANTERGAON)"
        const nameParsed = parseNameAndVillage(rawName, rawVillage);
        if (nameParsed.wasExtracted) villagesExtractedCount++;

        // 2. Clean village spelling
        const villageNorm = normalizeVillage(nameParsed.extractedVillage);
        if (villageNorm.wasCorrected) spellingFixedCount++;

        // 3. Clean Phone
        const phoneClean = cleanPhoneNumber(rawPhone);
        if (phoneClean.wasFormatted) phonesFormattedCount++;

        // 4. Clean ₹0 bills / calculate advance and balance if it's bill
        const rawTotal = getRowNumberField(r, [
          'TOTAL',
          'TOTAL AMOUNT',
          'TOTAL AMT',
          'BILL AMOUNT',
          'BILL AMT',
          'NET AMOUNT',
          'NET AMT',
          'AMOUNT',
          'AMT',
          'DEBIT',
          'DEBIT AMOUNT',
          'GRAND TOTAL',
          'SALES',
          'PRICE',
          'VALUE',
          'खरेदी',
          'रक्कम',
        ]);

        const rawPaid = getRowNumberField(r, [
          'ADVANCE',
          'PAID AMOUNT',
          'PAID AMT',
          'PAID',
          'RECEIVED',
          'REC AMOUNT',
          'REC AMT',
          'CREDIT',
          'CREDIT AMOUNT',
          'DEPOSIT',
          'CASH',
          'जमा',
        ]);

        const rawDue = getRowNumberField(r, [
          'BALANCE',
          'BAL',
          'DUE',
          'DUE AMOUNT',
          'DUE AMT',
          'PENDING',
          'BALANCE DUE',
          'OUTSTANDING',
          'बाकी',
          'शिल्लक',
        ]);

        let finalTotal = rawTotal;
        let finalDue = rawDue;

        if (rawTotal === 0 && (rawPaid > 0 || rawDue > 0)) {
          finalTotal = rawPaid + rawDue;
          zeroBillsFixedCount++;
        }

        const cardNum =
          getRowNumberField(r, [
            'CARD.NO',
            'CARD NO',
            'CARD NUMBER',
            'CARDNO',
            'CARD',
          ]) || undefined;

        const openingAmt = getRowNumberField(r, [
          'OPENING AMT',
          'OPENING AMOUNT',
          'OPENING BALANCE',
          'OPENING',
          'DEPOSIT',
          'ठेव',
        ]);

        const sheetNo = getRowField(r, [
          'SHEET NO',
          'SHEET_NO',
          'SHEETNO',
          'SHEET',
          'PAGE NO',
        ]);

        // Extract receipt specific fields
        const receiptNo = getRowField(r, [
          'RECEIPT NO',
          'RECEIPT_NO',
          'RECEIPTNO',
          'RECEIPT',
          'REC NO',
          'VOUCHER NO',
          'VCH NO',
          'PAWATI NO',
          'पावती नं',
        ]);

        const invoiceRef = getRowField(r, [
          'BILL NO',
          'BILL_NO',
          'BILLNO',
          'INVOICE NO',
          'INVOICE_NO',
          'INVOICENO',
          'INV NO',
          'INV_NO',
          'BILL',
          'INV',
          'बिल नं',
        ]);

        const rawReceiptAmt = getRowNumberField(r, [
          'AMOUNT',
          'AMT',
          'RECEIPT AMOUNT',
          'DEPOSIT',
          'PAID',
          'जमा रक्कम',
        ]);

        const receiptAmt =
          rawReceiptAmt > 0 ? rawReceiptAmt : rawPaid > 0 ? rawPaid : finalTotal;

        const receivedBy = getRowField(r, [
          'RECIVED BY',
          'RECEIVED BY',
          'AGENT NAME',
          'AGENT',
          'COLLECTOR',
        ]);

        const remarks = getRowField(r, [
          'REMARKS',
          'NOTES',
          'PARTICULARS',
          'DESCRIPTION',
          'तपशील',
        ]) || (receivedBy ? `जमा घेणारा: ${receivedBy}` : '');

        const rawType = getRowField(r, ['TYPE', 'NATURE', 'CATEGORY']);
        const receiptType = rawType.toLowerCase().includes('refund')
          ? 'Refund'
          : 'WeeklyPayment';

        const productDetails =
          getRowField(r, [
            'PRODUCT',
            'ITEM',
            'ITEM DETAILS',
            'ITEMDETAILS',
            'PARTICULARS',
            'DESCRIPTION',
            'ITEMS',
            'GOODS',
            'माल/तपशील',
          ]) || 'इलेक्ट्रॉनिक्स व गृहोपयोगी वस्तू';

        // Check if there is an existing matching bill for this receipt
        let matchedBillInvoice = invoiceRef;
        if (!matchedBillInvoice && existingBills.length > 0) {
          const normName = nameParsed.cleanName.toLowerCase();
          const cleanP = phoneClean.phone;
          const foundBill = existingBills.find((b) => {
            const bName = (b.customerName || '').toLowerCase().trim();
            const bPhone = (b.customerPhone || '').replace(/\D/g, '');
            return (bName === normName || (cleanP && bPhone === cleanP) || (cardNum && b.cardNumber === cardNum)) && b.dueAmount > 0;
          });
          if (foundBill) {
            matchedBillInvoice = foundBill.invoiceNo;
          }
        }

        return {
          ...r,
          _cleanedName: nameParsed.cleanName,
          _cleanedVillage: villageNorm.cleaned,
          _cleanedPhone: phoneClean.phone,
          _cardNumber: cardNum,
          _openingAmt: openingAmt,
          _sheetNo: sheetNo,
          _totalAmount: finalTotal,
          _paidAmount: rawPaid,
          _dueAmount: finalDue > 0 ? finalDue : Math.max(0, finalTotal - rawPaid),
          _receiptNo: receiptNo,
          _invoiceRef: matchedBillInvoice,
          _receiptAmount: receiptAmt,
          _receiptRemarks: remarks,
          _receiptType: receiptType,
          _productDetails: productDetails,
          _wasSpellingFixed: villageNorm.wasCorrected,
          _wasVillageExtracted: nameParsed.wasExtracted,
        };
      });

      setDetectedType(detected);
      setDetectedRecords(cleanedRows);
      setCleanStats({
        spellingFixed: spellingFixedCount,
        villagesExtracted: villagesExtractedCount,
        phonesFormatted: phonesFormattedCount,
        zeroBillsFixed: zeroBillsFixedCount,
        totalRows: cleanedRows.length,
      });
    } catch (err: any) {
      setErrorMessage(`CSV वाचताना त्रुटी आली: ${err.message}`);
      setDetectedRecords([]);
    }
  };

  // Handle Drag & Drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setCsvText(text);
        processAndCleanCSV(text, file.name);
      };
      reader.readAsText(file);
    }
  };

  // Handle File Input Selection
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setCsvText(text);
        processAndCleanCSV(text, file.name);
      };
      reader.readAsText(file);
    }
  };

  // Fast Sample File Loader (matching screenshot buttons: Scheme 2, Scheme 3)
  const handleLoadSampleScheme = (schemeNo: 1 | 2 | 3) => {
    let sampleContent = '';
    let name = '';

    if (schemeNo === 2) {
      name = 'Scheme 2 (Cards 3001-3999).csv';
      sampleContent = `NAME,CARD.NO,VILLEGE,MOBILE.NO,OPENING AMT,DATE,SHEET NO
SUNIL DANDAGE (PIPRI),3191,PIPRI,8855881081,3000,01-11-2024,
PRASHANT BHALE,3201,SATODA,,100,01-11-2024,
MAHADEO BHURLE (KELHZAR),3212,KELHZAR,9657788990,500,01-11-2024,
SARIKA SANDIP BHANDEKAR,3234,KANHOLI BARA,9096037244,100,01-11-2024,
SUNIL GHONGADE (SATODA),3027,SATODA,9673448626,500,01-11-2024,
DILIP RAMRAO THAKRE,3105,SHIVNAGAR,,1000,01-11-2024,
VANDANA PATIL (VAYFAD),3250,VAYFAD,9822334455,200,01-11-2024,`;
    } else if (schemeNo === 3) {
      name = 'Scheme 3 (Cards 4001-6000).csv';
      sampleContent = `NAME,CARD.NO,VILLEGE,MOBILE.NO,OPENING AMT,DATE,SHEET NO
RANJANA SHAMBHARKAR,4107,BORI,,600,05-07-2025,2793
VAISHALI BAVNE (HINGNI),4304,HINGNI,,100,18-10-2025,5104
SANGITA (DEVNAGAR),4181,DEVNAGAR,,200,01-10-2025,5110
NILIMA SURESH RAUT,4220,NILIMA,9175534365,500,15-08-2025,3312
PRAKASH BUDHBAWARE (ANTERGAON),4150,ANTERGAON,8262988399,800,01-09-2025,4102
SURAJ GAIKWAD (SINDI MEGHE),4190,SINDI MEGHE,9876543210,1200,10-09-2025,5501`;
    } else {
      name = 'Scheme 1 (Cards 1001-2999).csv';
      sampleContent = `NAME,CARD.NO,VILLEGE,MOBILE.NO,OPENING AMT,DATE,SHEET NO
SANGITA UTTAM PATIL (HINGNI),1030,HINGNI,7972811639,450,01-06-2025,101
YAMUNA PRABHAKAR KAIKADI,1029,HINGNI,8698041323,200,01-06-2025,102
ARUN SAYRE (ANTERGAON),1001,ANTERGAON,9822001122,1300,01-05-2025,103
KAPIL KHOBRAGADE (ANAND NAGAR),1002,ANAND NAGAR,8877665544,1400,15-05-2025,104
SANJAY SHANKAR KURADKAR,1005,PUNJAB COLONY,9988776655,560,20-05-2025,105`;
    }

    setFileName(name);
    setCsvText(sampleContent);
    processAndCleanCSV(sampleContent, name);
  };

  // Commit and Save Cleaned Data into Database
  const handleCommitUniversalImport = () => {
    if (detectedRecords.length === 0) return;

    try {
      if (detectedType === 'scheme1' || detectedType === 'scheme2' || detectedType === 'scheme3') {
        const targetSchemeId: CardSchemeId = detectedType;
        const schemeName =
          detectedType === 'scheme3'
            ? 'Scheme 3 (योजना 3)'
            : detectedType === 'scheme2'
            ? 'Scheme 2 (योजना 2)'
            : 'Scheme 1 (योजना 1)';

        const newCards: CardMember[] = detectedRecords.map((r, idx) => {
          const cardNum = r._cardNumber || (detectedType === 'scheme3' ? 4001 + idx : detectedType === 'scheme2' ? 3001 + idx : 1001 + idx);
          const opening = r._openingAmt || 0;
          return {
            id: `cm-csv-${cardNum}-${Date.now()}-${idx}`,
            cardNumber: cardNum,
            schemeId: targetSchemeId,
            schemeName,
            customerName: r._cleanedName,
            phone: r._cleanedPhone,
            village: r._cleanedVillage || undefined,
            sheetNo: r._sheetNo || undefined,
            openingAmt: opening > 0 ? opening : undefined,
            address: r._cleanedVillage ? `${r._cleanedVillage}, Wardha` : 'Wardha',
            joiningDate: r.DATE || r.Date || new Date().toISOString().split('T')[0],
            registrationFee: 50,
            registrationFeePaid: true,
            totalDeposited: opening,
            totalRefunded: 0,
            netBalance: opening,
            status: 'Active',
            notes: `Auto-imported & cleaned on ${new Date().toISOString().split('T')[0]}${r._sheetNo ? ` • Sheet #${r._sheetNo}` : ''}`,
          };
        });

        onImportCardMembers(newCards);
        setSuccessMessage(`यशस्वी! ${newCards.length} कार्ड मेंबर्स (${schemeName}) स्पेलिंग व गावांच्या दुरुस्तीसह लेजरमध्ये सेव्ह केले गेले!`);
      } else if (detectedType === 'bills') {
        const validRecords = detectedRecords.filter(
          (r) =>
            r._totalAmount > 0 ||
            r._paidAmount > 0 ||
            r._dueAmount > 0 ||
            (r.BillNo && r.BillNo.toString().trim()) ||
            (r['BILL NO'] && r['BILL NO'].toString().trim()) ||
            (r.InvoiceNo && r.InvoiceNo.toString().trim())
        );

        const newBills: TransactionEntry[] = validRecords.map((r, idx) => ({
          id: `inv-imp-${Date.now()}-${idx}`,
          invoiceNo: r['BILL NO'] || r['BILL_NO'] || r.BillNo || r.billNo || r.InvoiceNo || `INV-${Date.now().toString().slice(-4)}-${idx + 1}`,
          date: r.Date || r.DATE || new Date().toISOString().split('T')[0],
          customerName: r._cleanedName,
          customerPhone: r._cleanedPhone,
          cardNumber: r._cardNumber,
          village: r._cleanedVillage,
          itemDetails: r._productDetails || r.PRODUCT || r.Product || r.ItemDetails || 'इलेक्ट्रॉनिक्स व गृहोपयोगी वस्तू',
          totalAmount: r._totalAmount,
          payingNow: r._paidAmount,
          dueAmount: r._dueAmount,
          paymentMode: (r.PaymentMode === 'Online' ? 'Online' : 'Cash') as 'Cash' | 'Online',
          notes: `Imported Sales Record • Village: ${r._cleanedVillage || 'Wardha'}${r.BillNo || r['BILL NO'] ? ` • Bill #${r.BillNo || r['BILL NO']}` : ''}`,
          createdAt: new Date().toISOString(),
        }));

        onImportBills(newBills);
        setSuccessMessage(`यशस्वी! ${newBills.length} विक्री बिले दुरुस्त करून ऑल एन्ट्रीज व ग्राहकांच्या खात्यावर सेव्ह केली.`);
      } else if (detectedType === 'receipts') {
        let creditedBillsCount = 0;
        const newReceipts: CardTransaction[] = detectedRecords.map((r, idx) => {
          const cardNum = r._cardNumber || undefined;
          const amt = r._receiptAmount || r._paidAmount || r._totalAmount || 500;
          const receiptCode = r._receiptNo || (cardNum ? `REC-${cardNum}-${idx + 1}` : `REC-PAY-${idx + 1}`);
          const date = r.Date || r.DATE || new Date().toISOString().split('T')[0];
          const mode = (r.PaymentMode === 'Online' || r.paymentMode === 'Online' ? 'Online' : 'Cash') as 'Cash' | 'Online';
          const invoice = r._invoiceRef;
          if (invoice) creditedBillsCount++;

          const remark = r._receiptRemarks
            ? `${r._receiptRemarks}${invoice ? ` • बिलामध्ये जमा (Against Bill #${invoice})` : ''}`
            : invoice
              ? `बिलामध्ये जमा (Credit Against Bill #${invoice}) • ${r._cleanedVillage || 'Wardha'}`
              : `साप्ताहिक जमा पावती • ${r._cleanedVillage || 'Wardha'}`;

          return {
            id: `rec-imp-${Date.now()}-${idx}`,
            cardId: cardNum ? `cm-${cardNum}` : `gen-${Date.now()}-${idx}`,
            cardNumber: cardNum || 0,
            schemeId: cardNum ? (cardNum >= 4001 ? 'scheme3' : cardNum >= 3001 ? 'scheme2' : 'scheme1') : 'scheme1',
            customerName: r._cleanedName,
            customerPhone: r._cleanedPhone,
            receiptNo: receiptCode,
            date: date,
            type: r._receiptType || 'WeeklyPayment',
            amount: amt,
            paymentMode: mode,
            remarks: remark,
            balanceAfter: amt,
            createdAt: new Date().toISOString(),
            invoiceNo: invoice, // Attached for bill-credit resolution
          } as CardTransaction;
        });

        onImportReceipts(newReceipts);
        const creditMsg = creditedBillsCount > 0 ? ` (${creditedBillsCount} बिलांच्या खात्यावर रक्कम थेट वजा / क्रेडिट झाली)` : '';
        setSuccessMessage(`यशस्वी! ${newReceipts.length} जमा पावत्या सिस्टीममध्ये नोंदवल्या गेल्या${creditMsg}.`);
      } else {
        // Generic customers
        setSuccessMessage(`यशस्वी! ${detectedRecords.length} रेकॉर्ड्स सिस्टीममध्ये समाविष्ट केले.`);
      }

      setDetectedRecords([]);
      setCsvText('');
      setFileName('');
    } catch (err: any) {
      setErrorMessage(`डेटा सेव्ह करताना त्रुटी: ${err.message}`);
    }
  };

  // Search filter matching
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const items: Array<{
      id: string;
      category: 'card' | 'bill' | 'receipt';
      title: string;
      subtitle: string;
      village?: string;
      phone?: string;
      amount?: number;
      due?: number;
      extra?: string;
    }> = [];

    // Scheme cards
    if (searchFilterCategory === 'all' || searchFilterCategory === 'cards') {
      existingCardMembers.forEach((m) => {
        const str = `${m.cardNumber} ${m.customerName} ${m.village || ''} ${m.phone || ''} ${m.sheetNo || ''}`.toLowerCase();
        if (!q || str.includes(q)) {
          items.push({
            id: m.id,
            category: 'card',
            title: `#${m.cardNumber} - ${m.customerName}`,
            subtitle: m.schemeName,
            village: m.village,
            phone: m.phone,
            amount: m.netBalance || m.totalDeposited,
            extra: m.sheetNo ? `Sheet #${m.sheetNo}` : undefined,
          });
        }
      });
    }

    // Bills
    if (searchFilterCategory === 'all' || searchFilterCategory === 'bills') {
      existingBills.forEach((b) => {
        const str = `${b.invoiceNo} ${b.customerName} ${b.village || ''} ${b.customerPhone || ''} ${b.itemDetails}`.toLowerCase();
        if (!q || str.includes(q)) {
          items.push({
            id: b.id,
            category: 'bill',
            title: `${b.invoiceNo} - ${b.customerName}`,
            subtitle: b.itemDetails,
            village: b.village,
            phone: b.customerPhone,
            amount: b.totalAmount,
            due: b.dueAmount,
            extra: b.date,
          });
        }
      });
    }

    // Receipts
    if (searchFilterCategory === 'all' || searchFilterCategory === 'receipts') {
      existingReceipts.forEach((r) => {
        const str = `${r.receiptNo} ${r.customerName} ${r.cardNumber}`.toLowerCase();
        if (!q || str.includes(q)) {
          items.push({
            id: r.id,
            category: 'receipt',
            title: `${r.receiptNo} - Card #${r.cardNumber}`,
            subtitle: r.customerName,
            amount: r.amount,
            extra: r.date,
          });
        }
      });
    }

    return items;
  }, [searchQuery, searchFilterCategory, existingCardMembers, existingBills, existingReceipts]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* ========================================================= */}
      {/* 1. TOP HEADER (Matching Screenshot 2)                     */}
      {/* ========================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              CSV Data Import & Cleanup Tool
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[11px] uppercase tracking-wider">
              Smart 5-in-1
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            पुरानी फाइलें अपलोड करें या 1 क्लिक में गलत ₹0 वाले बिल साफ़ करके फिर से ताज़ा डेटा लोड करें।
          </p>
        </div>

        {/* Top Right Red Button from Screenshot 2 */}
        <button
          type="button"
          onClick={() => setShowResetModal(true)}
          className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-rose-600/20 active:scale-95 transition cursor-pointer self-start sm:self-auto shrink-0"
        >
          <Trash2 className="w-4 h-4" />
          <span>पूरा डेटा रीसेट करे (Start Clean)</span>
        </button>
      </div>

      {/* Success / Error Alerts */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage('')}
            className="text-xs text-emerald-700 hover:underline font-bold cursor-pointer"
          >
            बंद करा
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage('')}
            className="text-xs text-rose-700 hover:underline font-bold cursor-pointer"
          >
            बंद करा
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. THREE SEGMENTED TABS (From Screenshot 2)               */}
      {/* ========================================================= */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveMainTab('universal')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition cursor-pointer ${
              activeMainTab === 'universal'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>✨ स्मार्ट ऑटो-डिटेक्टर & एरर क्लीनर (5-in-1 Universal)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('manual')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition cursor-pointer ${
              activeMainTab === 'manual'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>📑 मॅन्युअल इम्पोर्ट (Category Wise)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('search')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition cursor-pointer ${
              activeMainTab === 'search'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>🔍 अपलोड झालेला सर्व डेटा शोधा</span>
          </button>
        </div>

        {/* Small Red Button under tabs from Screenshot 2 */}
        <button
          type="button"
          onClick={() => setShowResetModal(true)}
          className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>डेटा रीसेट (Start Clean)</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: SMART AUTO-DETECTOR & ERROR CLEANER (Universal)    */}
      {/* ========================================================= */}
      {activeMainTab === 'universal' && (
        <div className="space-y-6 animate-in fade-in">
          
          {/* Deep Navy/Indigo Hero Feature Banner (Screenshot 2) */}
          <div className="rounded-3xl bg-gradient-to-br from-[#0F1E36] via-[#0B1528] to-[#08101E] text-white p-6 sm:p-8 relative overflow-hidden shadow-2xl border border-blue-900/40">
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 space-y-4">
              {/* Active Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>स्वयंचलित स्पेलिंग, तारीख व खाते दुरुस्ती प्रणाली सक्रिय</span>
              </div>

              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight leading-snug">
                कोणतीही CSV फाईल टाका — आपोआप ओळखून अचूक ठिकाणी सेव्ह होईल!
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 max-w-4xl leading-relaxed">
                ही प्रणाली ५ पैकी कोणत्याही फाईलमधील स्पेलिंग चुका (उदा. <span className="text-amber-300 font-bold">KELHZAR → Kelzar</span>, <span className="text-amber-300 font-bold">VAYFAD → Waifad</span>, <span className="text-amber-300 font-bold">NILIMA → Nilima</span>), नावातील कंसात असलेले गाव वेगळे करणे, फोन नंबर दुरुस्ती, आणि चुकीचे मायनस बॅलन्स आपोआप दुरुस्त करून थेट योग्य लेजरमध्ये जमा करते.
              </p>

              {/* 4 Feature Badges Grid from Screenshot 2 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-300 shrink-0 font-bold text-xs">
                    १
                  </div>
                  <div>
                    <span className="block text-[11px] text-slate-400">विक्री बिले</span>
                    <span className="text-xs font-black text-white flex items-center gap-1">
                      <Receipt className="w-3 h-3 text-amber-400" />
                      All Entries & Ledger
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-300 shrink-0 font-bold text-xs">
                    २
                  </div>
                  <div>
                    <span className="block text-[11px] text-slate-400">ग्राहक खाती</span>
                    <span className="text-xs font-black text-white flex items-center gap-1">
                      <CreditCard className="w-3 h-3 text-emerald-400" />
                      Customers Khata
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-300 shrink-0 font-bold text-xs">
                    ३
                  </div>
                  <div>
                    <span className="block text-[11px] text-slate-400">बचत योजना</span>
                    <span className="text-xs font-black text-white flex items-center gap-1">
                      <Layers className="w-3 h-3 text-amber-400" />
                      Card Scheme 1, 2, 3
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-300 shrink-0 font-bold text-xs">
                    ४
                  </div>
                  <div>
                    <span className="block text-[11px] text-slate-400">जमा पावत्या</span>
                    <span className="text-xs font-black text-white flex items-center gap-1">
                      <FileText className="w-3 h-3 text-purple-400" />
                      Receipts & Passbook
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Sample File Loaders (Screenshot 2: Scheme 2, Scheme 3 buttons) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-amber-500 text-base">⚡</span>
                <h3 className="font-extrabold text-slate-900 text-sm">
                  रेडी सॅम्पल फाईल त्वरित लोड करा:
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                खालील बटनावर क्लिक करून थेट उपलब्ध CSV तपासून टेस्ट करू शकता:
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleLoadSampleScheme(2)}
                className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>Scheme 2 लोड करा</span>
              </button>

              <button
                type="button"
                onClick={() => handleLoadSampleScheme(3)}
                className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-purple-600" />
                <span>Scheme 3 लोड करा</span>
              </button>

              <button
                type="button"
                onClick={() => handleLoadSampleScheme(1)}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>Scheme 1 लोड करा</span>
              </button>
            </div>
          </div>

          {/* Universal Drag & Drop Upload Zone (Screenshot 2) */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition cursor-pointer relative bg-white ${
              isDragging
                ? 'border-blue-600 bg-blue-50/50 scale-[1.005]'
                : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50/50'
            }`}
          >
            <input
              type="file"
              accept=".csv,.txt"
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            
            <div className="max-w-md mx-auto space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
                <Upload className="w-8 h-8" />
              </div>
              <div>
                <p className="font-extrabold text-slate-800 text-base">
                  {fileName ? (
                    <span className="text-blue-600">निवडलेली फाईल: {fileName}</span>
                  ) : (
                    'CSV किंवा Text फाईल येथे ड्रॅग करा किंवा कॉम्प्युटरवरून निवडा'
                  )}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Supports UTF-8 CSV, Excel Exports (.csv), Scheme Cards, Bills & Receipts
                </p>
              </div>

              <div className="pt-2 flex items-center justify-center gap-3">
                <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 font-mono text-[11px]">
                  .csv फाईल निवडा
                </span>
                <span className="text-slate-400 text-xs font-semibold">• किंवा •</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPasteArea(!showPasteArea);
                  }}
                  className="text-xs text-blue-600 hover:underline font-bold"
                >
                  {showPasteArea ? 'पेस्ट बॉक्स लपवा' : 'CSV मजकूर थेट पेस्ट करा'}
                </button>
              </div>
            </div>
          </div>

          {/* Optional Direct Paste Area */}
          {showPasteArea && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                येथे CSV मजकूर पेस्ट करा (Paste Raw CSV Data):
              </label>
              <textarea
                rows={6}
                value={csvText}
                onChange={(e) => {
                  setCsvText(e.target.value);
                  processAndCleanCSV(e.target.value, 'Pasted-Data.csv');
                }}
                placeholder="NAME,CARD.NO,VILLEGE,MOBILE.NO,OPENING AMT,DATE,SHEET NO&#10;PRAKASH BUDHBAWARE (ANTERGAON),4150,ANTERGAON,8262988399,800,01-09-2025,4102"
                className="w-full p-3 rounded-xl border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          )}

          {/* ========================================================= */}
          {/* CLEANED DATA PREVIEW & ANALYSIS RESULT                    */}
          {/* ========================================================= */}
          {detectedRecords.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5 animate-in fade-in">
              
              {/* Header Analysis Result */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                      <span className="text-[11px] font-bold text-slate-500 px-2">प्रकार बदला:</span>
                      <select
                        value={detectedType}
                        onChange={(e) => setDetectedType(e.target.value as any)}
                        className="bg-white text-xs font-bold text-slate-800 rounded-lg px-2.5 py-1 border border-slate-200 shadow-2xs focus:outline-none cursor-pointer"
                      >
                        <option value="bills">विक्री बिले (Bills)</option>
                        <option value="receipts">जमा पावत्या (Receipts - Credit Against Bill)</option>
                        <option value="scheme1">योजना कार्ड १ (Card Scheme 1)</option>
                        <option value="scheme2">योजना कार्ड २ (Card Scheme 2)</option>
                        <option value="scheme3">योजना कार्ड ३ (Card Scheme 3)</option>
                        <option value="customers">सामान्य ग्राहक (Customers)</option>
                        <option value="purchases">खरेदी (Purchases)</option>
                      </select>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      {cleanStats.totalRows} रेकॉर्ड्स सापडले
                    </span>
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-base mt-1">
                    स्वयंचलित दुरुस्ती अहवाल (Automated Cleanup Report)
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDetectedRecords([]);
                      setCsvText('');
                      setFileName('');
                    }}
                    className="px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
                  >
                    रद्द करा
                  </button>

                  <button
                    type="button"
                    onClick={handleCommitUniversalImport}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95 transition cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>सिस्टीममध्ये सेव्ह करा (Import & Save)</span>
                  </button>
                </div>
              </div>

              {/* Cleanup Metrics Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200">
                  <span className="text-[11px] text-amber-800 font-medium block">स्पेलिंग दुरुस्ती</span>
                  <span className="text-lg font-black text-amber-900 font-mono">
                    {cleanStats.spellingFixed} गावे
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200">
                  <span className="text-[11px] text-blue-800 font-medium block">कंसातील गावे वेगळी केली</span>
                  <span className="text-lg font-black text-blue-900 font-mono">
                    {cleanStats.villagesExtracted} नावे
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                  <span className="text-[11px] text-emerald-800 font-medium block">१०-अंकी फोन फॉरमॅट</span>
                  <span className="text-lg font-black text-emerald-900 font-mono">
                    {cleanStats.phonesFormatted} नंबर
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-200">
                  <span className="text-[11px] text-purple-800 font-medium block">₹0 बिल सुधारणा</span>
                  <span className="text-lg font-black text-purple-900 font-mono">
                    {cleanStats.zeroBillsFixed} बिले
                  </span>
                </div>
              </div>

              {/* Clean Preview Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-80 overflow-y-auto shadow-inner">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-600 font-bold">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">दुरुस्त केलेले नाव</th>
                      <th className="p-3">कार्ड नं</th>
                      <th className="p-3">गाव (Cleaned)</th>
                      <th className="p-3">मोबाईल नं</th>
                      <th className="p-3">रक्कम / जमा</th>
                      <th className="p-3">{detectedType === 'receipts' ? 'क्रेडिट बिल (Bill No)' : 'शीट नं / तारीख'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {detectedRecords.slice(0, 50).map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50/80">
                        <td className="p-3 text-slate-400 font-mono">{i + 1}</td>
                        <td className="p-3 font-bold text-slate-900">
                          {r._cleanedName}
                          {r._wasVillageExtracted && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 text-[10px]">
                              Extracted
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-mono font-bold text-blue-600">
                          {r._cardNumber ? `#${r._cardNumber}` : '-'}
                        </td>
                        <td className="p-3">
                          <span className={r._wasSpellingFixed ? 'text-emerald-700 font-bold' : ''}>
                            {r._cleanedVillage || '-'}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-slate-600">
                          {r._cleanedPhone || '-'}
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-900">
                          ₹{(r._receiptAmount || r._openingAmt || r._totalAmount || 0).toLocaleString()}
                        </td>
                        <td className="p-3 text-slate-500">
                          {detectedType === 'receipts' ? (
                            r._invoiceRef ? (
                              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono text-[11px] font-bold">
                                #{r._invoiceRef} जमा
                              </span>
                            ) : (
                              <span className="text-slate-400 font-mono text-[11px]">थेट खात्यावर</span>
                            )
                          ) : (
                            r._sheetNo ? `Sheet ${r._sheetNo}` : r.DATE || r.Date || '-'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: MANUAL CATEGORY WISE IMPORT                        */}
      {/* ========================================================= */}
      {activeMainTab === 'manual' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                type: 'bills' as ManualImportType,
                label: '1. Old Sales Bills',
                sub: 'पुराने ग्राहक बिल CSV',
                icon: Receipt,
              },
              {
                type: 'receipts' as ManualImportType,
                label: '2. Weekly Receipts',
                sub: 'किस्त रसीदें व रिफंड CSV',
                icon: FileSpreadsheet,
              },
              {
                type: 'cards' as ManualImportType,
                label: '3. Scheme Cards',
                sub: 'कार्ड धारक डेटा CSV',
                icon: CreditCard,
              },
              {
                type: 'purchases' as ManualImportType,
                label: '4. Dealer Purchases',
                sub: 'डीलर खरीद (Manisha Ent.)',
                icon: Building2,
              },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeManualType === tab.type;
              return (
                <button
                  key={tab.type}
                  onClick={() => {
                    setActiveManualType(tab.type);
                    setCsvText('');
                  }}
                  className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                    isActive
                      ? 'border-2 border-blue-600 bg-blue-50/40 shadow-sm'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    {isActive && <span className="w-2 h-2 rounded-full bg-blue-600" />}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-xs">{tab.label}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">{tab.sub}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Upload CSV File for {manualTemplates[activeManualType].desc}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select a .csv file from your computer or download the sample template below.
                </p>
              </div>

              <button
                onClick={() => handleDownloadSample(activeManualType)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                Download Sample {manualTemplates[activeManualType].filename}
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
              <input
                type="file"
                accept=".csv,.txt"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const text = event.target?.result as string;
                      processAndCleanCSV(text, file.name);
                      setActiveMainTab('universal');
                    };
                    reader.readAsText(file);
                  }
                }}
                className="text-xs text-slate-600"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: SEARCH ALL UPLOADED DATA (Screenshot 2)            */}
      {/* ========================================================= */}
      {activeMainTab === 'search' && (
        <div className="space-y-5 animate-in fade-in">
          
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  अपलोड झालेल्या सर्व डेटाची थेट शोध मोहीम
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  कार्ड नंबर, ग्राहक नाव, गाव किंवा मोबाईल नंबर टाकून तात्काळ शोध घ्या.
                </p>
              </div>

              {/* Filter Chips */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
                {(['all', 'cards', 'bills', 'receipts'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSearchFilterCategory(cat)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      searchFilterCategory === cat
                        ? 'bg-white text-blue-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {cat === 'all'
                      ? 'सर्व'
                      : cat === 'cards'
                      ? `Cards (${existingCardMembers.length})`
                      : cat === 'bills'
                      ? `Bills (${existingBills.length})`
                      : `Receipts (${existingReceipts.length})`}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="कार्ड नंबर (उदा. 1001, 3191, 4107), नाव किंवा गाव (उदा. Kelzar, Hingni)..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Results List */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-3 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 flex items-center justify-between">
              <span>एकूण {searchResults.length} नोंदी सापडल्या</span>
              <span className="text-[11px] text-slate-400 font-normal">Real-time across all schemes</span>
            </div>

            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {searchResults.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs font-medium">
                  कोणतीही नोंद सापडली नाही. कृपया वेगळा नंबर किंवा नाव टाकून शोधा.
                </div>
              ) : (
                searchResults.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 hover:bg-slate-50/80 flex items-center justify-between gap-3 text-xs transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                        item.category === 'card'
                          ? 'bg-blue-100 text-blue-700'
                          : item.category === 'bill'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {item.category === 'card' ? <CreditCard className="w-4 h-4" /> : item.category === 'bill' ? <Receipt className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                      </div>

                      <div>
                        <span className="font-bold text-slate-900 block text-xs sm:text-sm">
                          {item.title}
                        </span>
                        <div className="flex items-center gap-2 text-slate-400 text-[11px] mt-0.5">
                          <span>{item.subtitle}</span>
                          {item.village && (
                            <>
                              <span>•</span>
                              <span className="text-slate-600 font-semibold">{item.village}</span>
                            </>
                          )}
                          {item.phone && (
                            <>
                              <span>•</span>
                              <span className="font-mono">{item.phone}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {item.amount !== undefined && (
                        <span className="block font-bold text-slate-900 font-mono">
                          ₹{item.amount.toLocaleString()}
                        </span>
                      )}
                      {item.due !== undefined && item.due > 0 && (
                        <span className="text-[10px] font-bold text-rose-600 block">
                          बाकी: ₹{item.due.toLocaleString()}
                        </span>
                      )}
                      {item.extra && (
                        <span className="text-[10px] text-slate-400 block">{item.extra}</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* 4. CLEAN DATA RESET MODAL (Start Clean)                   */}
      {/* ========================================================= */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5 border border-slate-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">
                    डेटा रीसेट व दुरुस्ती टूल (Start Clean)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    डेटा व्यवस्थित करण्यासाठी खालील योग्य पर्याय निवडा:
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current counts indicator */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex flex-wrap gap-2 text-xs text-slate-700">
              <span className="font-semibold text-slate-500">सध्या सिस्टीममध्ये:</span>
              <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200 font-bold text-slate-900">
                {existingCustomers.length} ग्राहक
              </span>
              <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200 font-bold text-slate-900">
                {existingBills.length} बिले
              </span>
              <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200 font-bold text-slate-900">
                {existingCardMembers.length} कार्ड मेंबर्स
              </span>
              <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200 font-bold text-slate-900">
                {existingReceipts.length} पावत्या
              </span>
            </div>

            {/* Options */}
            <div className="space-y-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  if (onResetData) onResetData('zero-bills');
                  setShowResetModal(false);
                  setSuccessMessage('सर्व ₹0 असलेले चुकीचे बिल यशस्वीरीत्या दुरुस्त केले गेले आहेत!');
                }}
                className="w-full p-4 rounded-2xl border border-amber-200 bg-amber-50/60 hover:bg-amber-100/60 text-left transition cursor-pointer space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-amber-900 text-xs sm:text-sm">
                    १. फक्त ₹0 असलेले चुकीचे बिल दुरुस्त करा (Safe Fix)
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-800 text-[10px] font-bold">
                    Safe Fix
                  </span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  काही जुन्या बिलांमध्ये एकूण रक्कम ₹0 दाखवत असल्यास, जमा रक्कम व बाकी जुळवून अचूक बिल रक्कम तयार केली जाईल. कोणताही डेटा डिलीट होणार नाही.
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onResetData) onResetData('all');
                  setShowResetModal(false);
                  setSuccessMessage('सर्व डेटा यशस्वीरित्या रिसेट (साफ़) करण्यात आला आहे! सर्व रेकॉर्ड्स आता 0 आहेत.');
                }}
                className="w-full p-4 rounded-2xl border border-rose-200 bg-rose-50/60 hover:bg-rose-100/60 text-left transition cursor-pointer space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-rose-900 text-xs sm:text-sm">
                    २. संपूर्ण डेटा गायब / रिसेट करा (Complete Full Reset)
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-rose-200 text-rose-800 text-[10px] font-bold">
                    0 Records
                  </span>
                </div>
                <p className="text-[11px] text-rose-800 leading-relaxed">
                  विद्यमान सर्व {existingCustomers.length} ग्राहक, {existingBills.length} बिले, {existingCardMembers.length} कार्ड मेंबर्स, हप्ते व खरेदी पूर्णपणे डिलीट होऊन सिस्टीम ₹0 सह ताजी व स्वच्छ होईल.
                </p>
              </button>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                रद्द करा
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
