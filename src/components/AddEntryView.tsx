import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  User,
  IndianRupee,
  Calendar,
  Banknote,
  Smartphone,
  Info,
  CheckCircle2,
  Printer,
  Share2,
  RotateCcw,
  Sparkles,
  AlertCircle,
  AlertTriangle,
  MapPin,
  FileText,
  CreditCard,
  Edit3,
  Wrench,
  Plus,
  Trash2,
  ShoppingCart,
  Package,
  Layers,
  Check,
  Calculator
} from 'lucide-react';
import { Customer, StockItem, TransactionEntry, BusinessSettings, CardSchemeId, CardMember, InvoiceLineItem } from '../types';
import { SCHEMES_CONFIG } from '../utils/storage';
import {
  getSuggestedCustomers,
  detectCustomerPhoneMismatch,
  detectStockPriceMismatch,
  cleanPhoneNumber,
  ValidationIssue
} from '../utils/billingValidator';
import { BillingDiagnosticBox } from './BillingDiagnosticBox';
import { FinanceCalculatorModal, FinanceDetailsPayload } from './FinanceCalculatorModal';

export interface BillItemRow {
  id: string;
  stockItemId?: string;
  code?: string;
  description: string;
  modelNo?: string;
  serialNo?: string;
  hsn?: string;
  qty: number;
  rate: number;
  unit?: string;
  amount: number;
}

interface AddEntryViewProps {
  onSaveEntry: (entry: Omit<TransactionEntry, 'id' | 'createdAt'>) => void;
  onBackToDashboard: () => void;
  stockList: StockItem[];
  customersList: Customer[];
  settings: BusinessSettings;
  todaysTransactions: TransactionEntry[];
  allTransactions?: TransactionEntry[];
  cardMembers?: CardMember[];
  onOpenInvoiceModal: (entry: TransactionEntry) => void;
  initialEntryToEdit?: TransactionEntry | null;
  initialFinancePrefill?: FinanceDetailsPayload | null;
  onClearFinancePrefill?: () => void;
  onUpdateEntry?: (id: string, entry: Omit<TransactionEntry, 'id' | 'createdAt'>) => void;
  onCancelEdit?: () => void;
}

export const AddEntryView: React.FC<AddEntryViewProps> = ({
  onSaveEntry,
  onBackToDashboard,
  stockList,
  customersList,
  settings,
  todaysTransactions,
  allTransactions = [],
  cardMembers = [],
  onOpenInvoiceModal,
  initialEntryToEdit = null,
  initialFinancePrefill = null,
  onClearFinancePrefill,
  onUpdateEntry,
  onCancelEdit,
}) => {
  // Document Type: Regular Sale Bill vs Official Quotation / Estimate
  const [docType, setDocType] = useState<'tax-bill' | 'quotation'>('tax-bill');

  // Form States
  const [items, setItems] = useState<BillItemRow[]>([
    {
      id: `item-1`,
      description: '',
      qty: 1,
      rate: 0,
      amount: 0,
      unit: 'नग',
    },
  ]);
  const [activeStockDropdownRowId, setActiveStockDropdownRowId] = useState<string | null>(null);
  const [stockSearchQueryMap, setStockSearchQueryMap] = useState<{ [rowId: string]: string }>({});

  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [village, setVillage] = useState<string>('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);

  // Model & Serial / IMEI Number (Critical for appliances & quotations)
  const [modelNo, setModelNo] = useState<string>('');
  const [serialNo, setSerialNo] = useState<string>('');
  const [quotationValidity, setQuotationValidity] = useState<string>('15 दिवस वैध');

  const [totalAmount, setTotalAmount] = useState<string>('');
  const [payingNow, setPayingNow] = useState<string>('');
  const [itemDetails, setItemDetails] = useState<string>('');
  const [invoiceNo, setInvoiceNo] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'Online'>('Cash');
  const [selectedSchemeId, setSelectedSchemeId] = useState<CardSchemeId | ''>('');
  const [selectedCardNumber, setSelectedCardNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Finance Calculator Integration (Bajaj, TVS, HDB, IDBI)
  const [showFinanceModal, setShowFinanceModal] = useState(false);
  const [appliedFinance, setAppliedFinance] = useState<{
    provider: string;
    productName: string;
    productPrice: number;
    downPayment: number;
    financedAmount: number;
    tenure: number;
    monthlyEmi: number;
    processingFee: number;
    advanceEmis: number;
    upfrontPaid: number;
  } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [savedEntry, setSavedEntry] = useState<TransactionEntry | null>(null);

  // Load initialEntryToEdit if provided (Editing Past Bill Mode)
  useEffect(() => {
    if (initialEntryToEdit) {
      setDocType(initialEntryToEdit.isQuotation ? 'quotation' : 'tax-bill');
      setCustomerName(initialEntryToEdit.customerName || '');
      setCustomerPhone(initialEntryToEdit.customerPhone || '');
      setVillage(initialEntryToEdit.village || '');
      setTotalAmount((initialEntryToEdit.totalAmount || 0).toString());
      setPayingNow((initialEntryToEdit.payingNow || 0).toString());
      setItemDetails(initialEntryToEdit.itemDetails || '');
      setInvoiceNo(initialEntryToEdit.invoiceNo || '');
      setDate(initialEntryToEdit.date || new Date().toISOString().split('T')[0]);
      setPaymentMode(initialEntryToEdit.paymentMode || 'Cash');
      setModelNo(initialEntryToEdit.modelNo || '');
      setSerialNo(initialEntryToEdit.serialNo || '');
      setQuotationValidity(initialEntryToEdit.quotationValidity || '15 दिवस वैध');
      setNotes(initialEntryToEdit.notes || '');
      setSelectedSchemeId(initialEntryToEdit.schemeId || '');
      setSelectedCardNumber(initialEntryToEdit.cardNumber ? initialEntryToEdit.cardNumber.toString() : '');
      setErrorMsg('');
      setSavedEntry(null);

      if (initialEntryToEdit.lineItems && initialEntryToEdit.lineItems.length > 0) {
        setItems(
          initialEntryToEdit.lineItems.map((li, idx) => ({
            id: li.id || `item-init-${idx}`,
            stockItemId: li.stockItemId,
            description: li.description || '',
            modelNo: li.modelNo || initialEntryToEdit.modelNo || '',
            serialNo: li.serialNo || initialEntryToEdit.serialNo || '',
            qty: li.qty || 1,
            rate: li.rate || 0,
            amount: li.amount || (li.qty || 1) * (li.rate || 0),
            unit: li.per || 'नग',
            hsn: li.hsn || '',
          }))
        );
      } else if (initialEntryToEdit.stockItemId || initialEntryToEdit.itemDetails || initialEntryToEdit.totalAmount) {
        const qty = initialEntryToEdit.quantity || 1;
        const total = initialEntryToEdit.totalAmount || 0;
        setItems([
          {
            id: `item-init-0`,
            stockItemId: initialEntryToEdit.stockItemId,
            description: initialEntryToEdit.stockItemName || initialEntryToEdit.itemDetails || 'वस्तू',
            modelNo: initialEntryToEdit.modelNo || '',
            serialNo: initialEntryToEdit.serialNo || '',
            qty,
            rate: total && qty ? Math.round((total / qty) * 100) / 100 : total,
            amount: total,
            unit: 'नग',
          },
        ]);
      }
    }
  }, [initialEntryToEdit]);

  // Auto-fill from Finance Calculator (बिलामध्ये फायनान्स तपशील भरा)
  useEffect(() => {
    if (initialFinancePrefill) {
      if (initialFinancePrefill.customerName) {
        setCustomerName(initialFinancePrefill.customerName);
      }
      if (initialFinancePrefill.customerPhone) {
        setCustomerPhone(initialFinancePrefill.customerPhone);
      }
      if (initialFinancePrefill.customerVillage) {
        setVillage(initialFinancePrefill.customerVillage);
      }
      if (initialFinancePrefill.productName && initialFinancePrefill.productPrice) {
        setItems([
          {
            id: `item-fin-${Date.now()}`,
            description: initialFinancePrefill.productName,
            qty: 1,
            rate: initialFinancePrefill.productPrice,
            amount: initialFinancePrefill.productPrice,
            unit: 'नग',
          },
        ]);
        setTotalAmount(String(initialFinancePrefill.productPrice));
      }
      setAppliedFinance(initialFinancePrefill);
      setPayingNow(String(initialFinancePrefill.upfrontPaid));
      const emiNote = `[${initialFinancePrefill.provider.toUpperCase()} Finance: Down Payment ₹${initialFinancePrefill.downPayment}, Loan ₹${initialFinancePrefill.financedAmount}, EMI ₹${initialFinancePrefill.monthlyEmi} x ${initialFinancePrefill.tenure} mo]`;
      setNotes((prev) => (prev ? `${prev} | ${emiNote}` : emiNote));
      if (onClearFinancePrefill) {
        onClearFinancePrefill();
      }
    }
  }, [initialFinancePrefill, onClearFinancePrefill]);

  // Auto-generate invoice/quotation number (only for new bills)
  useEffect(() => {
    if (initialEntryToEdit) return;
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const prefix = docType === 'quotation' ? 'QT-2026-' : (settings.invoicePrefix || 'INV-2026-');
    const generated = `${prefix}${todaysTransactions.length + 1}-${randomSuffix}`;
    setInvoiceNo(generated);
  }, [settings.invoicePrefix, todaysTransactions.length, docType, initialEntryToEdit]);

  // Filter customers
  const filteredCustomers = customersList.filter((c) =>
    c.name.toLowerCase().includes(customerName.toLowerCase()) ||
    c.phone.includes(customerName)
  );

  // Smart suggestions formula: checks both customersList and past allTransactions
  const smartSuggestions = useMemo(() => {
    return getSuggestedCustomers(customerName, customerPhone, customersList, allTransactions);
  }, [customerName, customerPhone, customersList, allTransactions]);

  // Phone mismatch detection
  const phoneMismatch = useMemo(() => {
    return detectCustomerPhoneMismatch(customerName, customerPhone, customersList, allTransactions);
  }, [customerName, customerPhone, customersList, allTransactions]);

  // Multi-Item Totals
  const itemsGrandTotal = useMemo(() => {
    return items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);
  }, [items]);

  const itemsTotalQty = useMemo(() => {
    return items.reduce((sum, it) => sum + (Number(it.qty) || 0), 0);
  }, [items]);

  const handleUpdateItem = (id: string, updates: Partial<BillItemRow>) => {
    setItems((prev) => {
      const next = prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, ...updates };
          if ('qty' in updates || 'rate' in updates) {
            const validQty = Math.max(1, Number(updated.qty) || 1);
            const validRate = Math.max(0, Number(updated.rate) || 0);
            updated.qty = validQty;
            updated.rate = validRate;
            updated.amount = Math.round(validQty * validRate * 100) / 100;
          }
          return updated;
        }
        return item;
      });

      const grandTotal = next.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);
      if (grandTotal > 0) {
        setTotalAmount(grandTotal.toString());
        setPayingNow((prevPaid) => {
          const pVal = parseFloat(prevPaid) || 0;
          if (!prevPaid || pVal === 0 || prevPaid === totalAmount) {
            return grandTotal.toString();
          }
          return prevPaid;
        });

        const validDescs = next
          .filter((it) => it.description.trim())
          .map((it, idx) => `${idx + 1}) ${it.description.trim()} (${it.qty} ${it.unit || 'नग'} @ ₹${(it.rate || 0).toLocaleString()})`);
        if (validDescs.length > 0) {
          setItemDetails(validDescs.join(', '));
        }
      }
      return next;
    });
  };

  const handleSelectStockForItem = (rowId: string, stock: StockItem) => {
    setItems((prev) => {
      const next = prev.map((item) => {
        if (item.id === rowId) {
          const qty = item.qty || 1;
          const rate = stock.sellingPrice || 0;
          return {
            ...item,
            stockItemId: stock.id,
            description: stock.name,
            modelNo: stock.modelNo || item.modelNo,
            serialNo: stock.serialNumbers?.[0] || item.serialNo,
            hsn: stock.hsnCode || item.hsn,
            code: stock.code,
            unit: stock.unit || 'नग',
            rate,
            amount: qty * rate,
          };
        }
        return item;
      });

      const grandTotal = next.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);
      setTotalAmount(grandTotal.toString());
      setPayingNow((prevPaid) => {
        const pVal = parseFloat(prevPaid) || 0;
        if (!prevPaid || pVal === 0 || prevPaid === totalAmount) {
          return grandTotal.toString();
        }
        return prevPaid;
      });

      const validDescs = next
        .filter((it) => it.description.trim())
        .map((it, idx) => `${idx + 1}) ${it.description.trim()} (${it.qty} ${it.unit || 'नग'} @ ₹${(it.rate || 0).toLocaleString()})`);
      if (validDescs.length > 0) {
        setItemDetails(validDescs.join(', '));
      }
      if (!modelNo && stock.code) {
        setModelNo(stock.code);
      }
      return next;
    });

    setActiveStockDropdownRowId(null);
  };

  const handleAddItemRow = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}-${prev.length + 1}`,
        description: '',
        qty: 1,
        rate: 0,
        amount: 0,
        unit: 'नग',
      },
    ]);
  };

  const handleRemoveItemRow = (id: string) => {
    setItems((prev) => {
      if (prev.length <= 1) {
        return [
          {
            id: `item-${Date.now()}-1`,
            description: '',
            qty: 1,
            rate: 0,
            amount: 0,
            unit: 'नग',
          },
        ];
      }
      const next = prev.filter((it) => it.id !== id);
      const grandTotal = next.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);
      setTotalAmount(grandTotal > 0 ? grandTotal.toString() : '');
      const validDescs = next
        .filter((it) => it.description.trim())
        .map((it, idx) => `${idx + 1}) ${it.description.trim()} (${it.qty} ${it.unit || 'नग'} @ ₹${(it.rate || 0).toLocaleString()})`);
      setItemDetails(validDescs.join(', '));
      return next;
    });
  };

  const handleSelectCustomer = (cust: Customer) => {
    setCustomerName(cust.name);
    setCustomerPhone(cust.phone);
    if (cust.village || cust.address) {
      setVillage(cust.village || cust.address || '');
    }
    setIsCustomerDropdownOpen(false);
  };

  const numTotal = parseFloat(totalAmount) || 0;
  const numPaid = parseFloat(payingNow) || 0;
  const dueAmount = Math.max(0, numTotal - numPaid);

  // Live Comprehensive Validation Issues & Formulas with 1-click Fixes
  const validationIssues = useMemo<ValidationIssue[]>(() => {
    const issues: ValidationIssue[] = [];

    // 1. Error: Customer Name
    if (!customerName.trim()) {
      issues.push({
        id: 'err-name',
        field: 'customerName',
        severity: 'error',
        title: 'ग्राहकाचे नाव (Customer Name)',
        message: 'ग्राहकाचे नाव प्रविष्ट करणे आवश्यक आहे.',
      });
    }

    // 2. Error: Total Amount
    if (!totalAmount || numTotal <= 0) {
      issues.push({
        id: 'err-total',
        field: 'totalAmount',
        severity: 'error',
        title: 'एकूण बिल रक्कम (Total Amount)',
        message: 'एकूण बिल रक्कम ₹0 पेक्षा जास्त असणे आवश्यक आहे.',
        fixLabel: itemsGrandTotal > 0 ? `वस्तूंची बेरीज लावा (₹${itemsGrandTotal.toLocaleString()})` : undefined,
        onFix: itemsGrandTotal > 0 ? () => {
          setTotalAmount(itemsGrandTotal.toString());
          setPayingNow(itemsGrandTotal.toString());
        } : undefined,
      });
    }

    // 3. Error: Paying Now > Total
    if (numPaid > numTotal && numTotal > 0) {
      issues.push({
        id: 'err-paid-exceed',
        field: 'payingNow',
        severity: 'error',
        title: 'भरलेली रक्कम (Paying Now)',
        message: `भरलेली रक्कम (₹${numPaid.toLocaleString()}) एकूण बिलापेक्षा (₹${numTotal.toLocaleString()}) जास्त असू शकत नाही!`,
        fixLabel: `रक्कम जुळवा (भरणा = ₹${numTotal.toLocaleString()})`,
        onFix: () => setPayingNow(totalAmount),
      });
    }

    // 4. Error: Duplicate Invoice Number
    const isEditingOriginalNo = initialEntryToEdit && initialEntryToEdit.invoiceNo.trim().toLowerCase() === invoiceNo.trim().toLowerCase();
    const duplicateBill = allTransactions.find(
      (t) => t.invoiceNo.trim().toLowerCase() === invoiceNo.trim().toLowerCase() && (!initialEntryToEdit || t.id !== initialEntryToEdit.id)
    );
    if (duplicateBill && !isEditingOriginalNo) {
      issues.push({
        id: 'err-dup-invoice',
        field: 'invoiceNo',
        severity: 'error',
        title: 'बिल क्र. विसंगती (Duplicate Bill No)',
        message: `बिल क्र. '${invoiceNo}' आधीच '${duplicateBill.customerName}' यांच्या नावे नोंदवलेला आहे!`,
        fixLabel: 'नवीन युनिक बिल क्र. द्या (Generate New)',
        onFix: () => {
          const randomSuffix = Math.floor(1000 + Math.random() * 9000);
          const prefix = docType === 'quotation' ? 'QT-2026-' : (settings.invoicePrefix || 'INV-2026-');
          setInvoiceNo(`${prefix}${Date.now().toString().slice(-4)}-${randomSuffix}`);
        },
      });
    }

    // 5. Warning: Phone Mismatch
    if (phoneMismatch.hasMismatch && phoneMismatch.existingName) {
      issues.push({
        id: 'warn-phone-mismatch',
        field: 'customerPhone',
        severity: 'warning',
        title: 'मोबाईल क्रमांक विसंगती (Phone Mismatch)',
        message: `हा मोबाईल नंबर आधीच जुने ग्राहक '${phoneMismatch.existingName}' यांच्या खात्यावर नोंदणीकृत आहे.`,
        fixLabel: `नावात दुरुस्ती करा ('${phoneMismatch.existingName}')`,
        onFix: () => {
          setCustomerName(phoneMismatch.existingName || '');
          if (phoneMismatch.existingVillage) setVillage(phoneMismatch.existingVillage);
        },
      });
    }

    // 6. Warning: Multi-Item Calculation Check
    if (itemsGrandTotal > 0 && Math.abs(numTotal - itemsGrandTotal) > 0.5) {
      issues.push({
        id: 'warn-items-total-mismatch',
        field: 'totalAmount',
        severity: 'warning',
        title: 'वस्तूंची बेरीज विसंगती (Item Total Mismatch)',
        message: `जोडलेल्या सर्व ${items.length} वस्तूंची प्रत्यक्ष बेरीज ₹${itemsGrandTotal.toLocaleString()} होते, पण एकूण बिलाची रक्कम ₹${numTotal.toLocaleString()} टाकलेली आहे.`,
        fixLabel: `एकूण रक्कम वस्तूंच्या बेरजेनुसार (₹${itemsGrandTotal.toLocaleString()}) करा`,
        onFix: () => {
          setTotalAmount(itemsGrandTotal.toString());
          setPayingNow(itemsGrandTotal.toString());
        },
      });
    }

    // 7. Warning: Phone Format
    if (customerPhone && /[^0-9]/.test(customerPhone)) {
      issues.push({
        id: 'warn-phone-format',
        field: 'customerPhone',
        severity: 'warning',
        title: 'मोबाईल फॉरमॅट (Phone Format)',
        message: 'मोबाईल क्रमांकामध्ये स्पेस किंवा अनावश्यक चिन्हे आहेत.',
        fixLabel: 'नंबर स्वच्छ करा (Clean 10 Digits)',
        onFix: () => setCustomerPhone(cleanPhoneNumber(customerPhone)),
      });
    } else if (customerPhone && customerPhone.length > 0 && customerPhone.length !== 10) {
      issues.push({
        id: 'warn-phone-length',
        field: 'customerPhone',
        severity: 'warning',
        title: 'मोबाईल अंक (Phone Length)',
        message: `मोबाईल नंबर 10 अंकी असावा (सध्या ${customerPhone.length} अंक आहेत).`,
      });
    }

    // 8. Warning: Cardholder Name Mismatch
    if (selectedCardNumber && cardMembers.length > 0) {
      const cardNum = parseInt(selectedCardNumber);
      const matchedMember = cardMembers.find(
        (m) => m.cardNumber === cardNum && (!selectedSchemeId || m.schemeId === selectedSchemeId)
      );
      if (matchedMember) {
        const memberNameLower = matchedMember.customerName.trim().toLowerCase();
        const currentNameLower = customerName.trim().toLowerCase();
        if (currentNameLower && memberNameLower !== currentNameLower && !memberNameLower.includes(currentNameLower)) {
          issues.push({
            id: 'warn-card-mismatch',
            field: 'cardNumber',
            severity: 'warning',
            title: 'कार्ड धारक विसंगती (Cardholder Mismatch)',
            message: `कार्ड क्र. ${cardNum} हे '${matchedMember.customerName}' यांच्या नावे आहे, पण फॉर्ममध्ये नाव '${customerName}' आहे.`,
            fixLabel: `कार्ड धारकाचे नाव '${matchedMember.customerName}' भरा`,
            onFix: () => {
              setCustomerName(matchedMember.customerName);
              if (matchedMember.phone) setCustomerPhone(matchedMember.phone);
              if (matchedMember.village) setVillage(matchedMember.village);
            },
          });
        }
      }
    }

    return issues;
  }, [
    customerName,
    totalAmount,
    payingNow,
    invoiceNo,
    items,
    itemsGrandTotal,
    phoneMismatch,
    customerPhone,
    selectedCardNumber,
    cardMembers,
    selectedSchemeId,
    initialEntryToEdit,
    allTransactions,
    docType,
    settings.invoicePrefix,
    numTotal,
    numPaid,
  ]);

  const resetForm = () => {
    setItems([
      {
        id: `item-${Date.now()}-1`,
        description: '',
        qty: 1,
        rate: 0,
        amount: 0,
        unit: 'नग',
      },
    ]);
    setActiveStockDropdownRowId(null);
    setStockSearchQueryMap({});
    setCustomerName('');
    setCustomerPhone('');
    setVillage('');
    setModelNo('');
    setSerialNo('');
    setQuotationValidity('15 दिवस वैध');
    setTotalAmount('');
    setPayingNow('');
    setItemDetails('');
    setPaymentMode('Cash');
    setSelectedSchemeId('');
    setSelectedCardNumber('');
    setNotes('');
    setErrorMsg('');
    setSavedEntry(null);
    if (initialEntryToEdit && onCancelEdit) {
      onCancelEdit();
    } else {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const prefix = docType === 'quotation' ? 'QT-2026-' : (settings.invoicePrefix || 'INV-2026-');
      setInvoiceNo(`${prefix}${todaysTransactions.length + 1}-${randomSuffix}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Check blocking errors from the diagnostic formula
    const blockingError = validationIssues.find((i) => i.severity === 'error');
    if (blockingError) {
      setErrorMsg(`${blockingError.title}: ${blockingError.message}`);
      return;
    }

    if (numPaid < 0) {
      setErrorMsg('Paying Now cannot be negative');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const existingCustomer = customersList.find(
        (c) => c.name.toLowerCase() === customerName.toLowerCase()
      );

      const formattedLineItems: InvoiceLineItem[] = items
        .filter((it) => it.description.trim() || (it.amount || 0) > 0)
        .map((it, idx) => ({
          id: it.id,
          srNo: idx + 1,
          description: it.description.trim() || `वस्तू ${idx + 1}`,
          modelNo: it.modelNo?.trim() || undefined,
          serialNo: it.serialNo?.trim() || undefined,
          qty: it.qty || 1,
          rate: it.rate || 0,
          per: it.unit || 'नग',
          amount: it.amount || (it.qty || 1) * (it.rate || 0),
          hsn: it.hsn || '',
          stockItemId: it.stockItemId,
        }));

      const primaryStockItem = stockList.find((s) => s.id === items[0]?.stockItemId);
      const allStockItemIds = formattedLineItems.map((li) => li.stockItemId).filter(Boolean);

      const computedDetails = formattedLineItems.length > 0
        ? formattedLineItems.map((li, idx) => `${idx + 1}) ${li.description} (${li.qty} ${li.per || 'नग'})`).join(', ')
        : 'General Goods / Services';

      const primaryModelFromItems = formattedLineItems
        .map((li) => li.modelNo?.trim())
        .filter(Boolean)
        .join(', ');

      const primarySerialFromItems = formattedLineItems
        .map((li) => li.serialNo?.trim())
        .filter(Boolean)
        .join(', ');

      const finalModelNo = primaryModelFromItems || modelNo.trim() || undefined;
      const finalSerialNo = primarySerialFromItems || serialNo.trim() || undefined;

      const isQuot = docType === 'quotation';
      const newEntryData: Omit<TransactionEntry, 'id' | 'createdAt'> = {
        invoiceNo: invoiceNo.trim() || `${isQuot ? 'QT-' : 'INV-'}${Date.now().toString().slice(-6)}`,
        date,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || existingCustomer?.phone || '',
        customerId: existingCustomer?.id,
        village: village.trim() || existingCustomer?.village || existingCustomer?.address || '',
        cardNumber: selectedCardNumber ? parseInt(selectedCardNumber) : undefined,
        schemeId: selectedSchemeId ? (selectedSchemeId as CardSchemeId) : undefined,
        stockItemId: primaryStockItem?.id || allStockItemIds[0],
        stockItemName: primaryStockItem?.name || formattedLineItems[0]?.description,
        quantity: formattedLineItems.reduce((sum, it) => sum + (it.qty || 1), 0),
        itemDetails: itemDetails.trim() || computedDetails,
        lineItems: formattedLineItems.length > 0 ? formattedLineItems : undefined,
        modelNo: finalModelNo,
        serialNo: finalSerialNo,
        isQuotation: isQuot,
        quotationValidity: isQuot ? quotationValidity.trim() : undefined,
        totalAmount: numTotal,
        payingNow: numPaid,
        dueAmount,
        paymentMode,
        notes: notes.trim(),
      };

      if (initialEntryToEdit && onUpdateEntry) {
        onUpdateEntry(initialEntryToEdit.id, newEntryData);
        setIsSubmitting(false);
        const updatedEntryFull: TransactionEntry = {
          ...newEntryData,
          id: initialEntryToEdit.id,
          createdAt: initialEntryToEdit.createdAt || new Date().toISOString(),
        };
        setSavedEntry(updatedEntryFull);
      } else {
        onSaveEntry(newEntryData);
        setIsSubmitting(false);

        const createdEntryFull: TransactionEntry = {
          ...newEntryData,
          id: `tx-${Date.now()}`,
          createdAt: new Date().toISOString(),
        };
        setSavedEntry(createdEntryFull);
      }
    }, 450);
  };

  // Calculations for bottom summary cards
  const todayCashIn = todaysTransactions
    .filter((t) => t.paymentMode === 'Cash')
    .reduce((acc, curr) => acc + curr.payingNow, 0);

  const todayOnlineIn = todaysTransactions
    .filter((t) => t.paymentMode === 'Online')
    .reduce((acc, curr) => acc + curr.payingNow, 0);

  const todayTotalDues = todaysTransactions.reduce(
    (acc, curr) => acc + (curr.dueAmount || 0),
    0
  );

  const handleShareWhatsApp = (entry: TransactionEntry) => {
    const isQuot = entry.isQuotation;
    const docTitle = isQuot ? '📋 अधिकृत कोटेशन / अंदाजपत्रक (QUOTATION)' : '🧾 विक्री टॅक्स बिल (TAX INVOICE)';
    const itemsFormatted = entry.lineItems && entry.lineItems.length > 0
      ? entry.lineItems.map((li, idx) => `  ${idx + 1}. ${li.description} (${li.qty} ${li.per || 'नग'} @ ₹${(li.rate || 0).toLocaleString()} = ₹${(li.amount || 0).toLocaleString()})`).join('\n')
      : entry.itemDetails;

    const textMsg =
      `*${settings.businessName}*\n` +
      `*${docTitle}: #${entry.invoiceNo}*\n` +
      `तारीख: ${entry.date}\n` +
      `ग्राहक: ${entry.customerName}\n` +
      (entry.village ? `गाव: ${entry.village}\n` : '') +
      `साहित्य:\n${itemsFormatted}\n` +
      (entry.modelNo ? `मॉडेल क्र. (Model No): ${entry.modelNo}\n` : '') +
      (entry.serialNo ? `सिरीयल / IMEI क्र.: ${entry.serialNo}\n` : '') +
      `--------------------------------\n` +
      (isQuot
        ? `कोटेशन एकूण रक्कम: ₹${(Number(entry.totalAmount) || 0).toLocaleString()}\n` +
          (Number(entry.payingNow) > 0 ? `टोकन अ‍ॅडव्हान्स: ₹${(Number(entry.payingNow) || 0).toLocaleString()}\n` : '') +
          `डिलिव्हरी वेळी देय: ₹${(Number(entry.dueAmount || entry.totalAmount) || 0).toLocaleString()}\n` +
          `वैधता: ${entry.quotationValidity || '15 दिवस'}\n`
        : `एकूण बिल रक्कम: ₹${(Number(entry.totalAmount) || 0).toLocaleString()}\n` +
          `भरणा / अ‍ॅडव्हान्स: ₹${(Number(entry.payingNow) || 0).toLocaleString()} (${entry.paymentMode})\n` +
          ((Number(entry.dueAmount) || 0) > 0
            ? `बाकी रक्कम: ₹${(Number(entry.dueAmount) || 0).toLocaleString()}\n`
            : `स्थिती: पूर्ण भरणा (Fully Paid)\n`)) +
      `--------------------------------\n` +
      `GSTIN: 27ALOPL0030G2ZC\n` +
      `पत्ता: मातोश्री सभागृह समोर, आर्वी रोड, पंजाब कॉलनी, वर्धा.\n` +
      `संपर्क: 8766486915 • 8600122798\n` +
      `श्री साई इंटरप्राइजेस वर्धा.`;

    const phone = entry.customerPhone ? entry.customerPhone.replace(/[^0-9]/g, '') : '';
    const url = phone ? `https://wa.me/91${phone}?text=${encodeURIComponent(textMsg)}` : `https://wa.me/?text=${encodeURIComponent(textMsg)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              {initialEntryToEdit ? 'Edit Past Bill / जुने बिल दुरुस्ती' : 'Add Entry'}
            </h1>
            {initialEntryToEdit && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 font-mono">
                #{initialEntryToEdit.invoiceNo}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {initialEntryToEdit
              ? `या बिलातील जुनी माहिती, तारीख, रक्कम अथवा वस्तू तपशील बदला.`
              : `Record a sale or cash entry for ${settings.businessName}.`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {initialEntryToEdit && (
            <button
              type="button"
              id="btn-cancel-edit-bill-top"
              onClick={onCancelEdit || onBackToDashboard}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              दुरुस्ती रद्द करा (Cancel)
            </button>
          )}
          <button
            id="btn-back-dashboard"
            onClick={onBackToDashboard}
            className="inline-flex items-center text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition self-start sm:self-auto cursor-pointer"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>

      {/* Editing Past Bill Mode Alert Banner */}
      {initialEntryToEdit && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs animate-fade-in">
          <div className="flex items-center gap-3">
            <Edit3 className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <p className="text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-200">
                जुने बिल संपादन मोड सुरु आहे (Editing Bill #{initialEntryToEdit.invoiceNo})
              </p>
              <p className="text-[11px] sm:text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                मूळ ग्राहक: <span className="font-semibold">{initialEntryToEdit.customerName}</span> • मूळ रक्कम: ₹{(Number(initialEntryToEdit.totalAmount) || 0).toLocaleString()} • तारीख: {initialEntryToEdit.date}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancelEdit || onBackToDashboard}
            className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-amber-300 dark:border-amber-700 text-xs font-semibold hover:bg-amber-100 dark:hover:bg-slate-700 transition cursor-pointer shrink-0"
          >
            नवीन बिल मोडवर जा
          </button>
        </div>
      )}

      {/* Success banner after saving */}
      {savedEntry && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 shadow-sm animate-fade-in">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <p className="text-xs sm:text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                Entry recorded successfully! (#{savedEntry.invoiceNo})
              </p>
              <p className="text-[11px] sm:text-xs text-emerald-700 dark:text-emerald-300">
                Total: ₹{(Number(savedEntry.totalAmount) || 0).toLocaleString()} • Paid: ₹{(Number(savedEntry.payingNow) || 0).toLocaleString()} ({savedEntry.paymentMode})
                {(Number(savedEntry.dueAmount) || 0) > 0 && ` • Due Balance: ₹${(Number(savedEntry.dueAmount) || 0).toLocaleString()}`}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              id="btn-print-saved-bill"
              onClick={() => onOpenInvoiceModal(savedEntry)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-100 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              {savedEntry.isQuotation ? 'कोटेशन प्रिंट करा' : 'बिल / कोटेशन प्रिंट'}
            </button>
            <button
              id="btn-whatsapp-saved-bill"
              onClick={() => handleShareWhatsApp(savedEntry)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition shadow-xs cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              WhatsApp {savedEntry.isQuotation ? 'कोटेशन' : 'बिल'}
            </button>
            <button
              id="btn-new-entry-another"
              onClick={resetForm}
              className="px-3 py-1.5 rounded-lg bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white text-xs font-medium transition cursor-pointer"
            >
              + Next Entry
            </button>
          </div>
        </div>
      )}

      {/* Main Entry Card matching screenshot */}
      <div className="bg-white dark:bg-slate-800/95 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm p-4 sm:p-7">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Document Type Selector: Regular Tax Bill vs Quotation (अंदाजपत्रक) */}
          <div className="bg-slate-50 dark:bg-slate-900/60 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  दस्तऐवज प्रकार (Document Type):
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {docType === 'quotation'
                  ? '📋 कोटेशन / अंदाजपत्रक मोड: मॉडेल व सिरीयल नंबरसह अधिकृत अंदाजपत्रक प्रिंट होईल.'
                  : '🧾 विक्री टॅक्स इनव्हॉइस बिल मोड: विक्री व वॉरंटीसाठी मूळ बिल.'}
              </p>
            </div>
            <div className="flex items-center bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
              <button
                type="button"
                id="toggle-doc-bill"
                onClick={() => setDocType('tax-bill')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  docType === 'tax-bill'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                <span>🧾 विक्री बिल (Bill)</span>
              </button>
              <button
                type="button"
                id="toggle-doc-quotation"
                onClick={() => setDocType('quotation')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  docType === 'quotation'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                <span>📋 कोटेशन (Quotation)</span>
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm px-4 py-3 rounded-xl flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Multi-Product Items in Bill Section */}
          <div className="bg-slate-50/90 dark:bg-slate-900/70 border-2 border-blue-100 dark:border-slate-700/80 rounded-2xl p-4 sm:p-5 space-y-3.5 relative shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shadow-2xs">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      बिलातील वस्तू / प्रॉडक्ट्स (Bill Items & Products)
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      {items.length} {items.length > 1 ? 'वस्तू' : 'वस्तू'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    एकाच बिलात २ किंवा अधिक प्रॉडक्ट्स जोडू शकता. दुसऱ्या वस्तूसाठी वेगळे बिल करण्याची गरज नाही.
                  </p>
                </div>
              </div>

              <button
                type="button"
                id="btn-add-item-top"
                onClick={handleAddItemRow}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition cursor-pointer self-start sm:self-auto active:scale-98"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ आणखी प्रॉडक्ट जोडा</span>
              </button>
            </div>

            {/* List of Product Rows */}
            <div className="space-y-3">
              {items.map((item, idx) => {
                const stockItem = stockList.find((s) => s.id === item.stockItemId);
                const query = stockSearchQueryMap[item.id] !== undefined ? stockSearchQueryMap[item.id] : item.description;
                const isDropdownOpen = activeStockDropdownRowId === item.id;
                const matchingStock = stockList.filter(
                  (s) =>
                    s.name.toLowerCase().includes((query || '').toLowerCase()) ||
                    s.code.toLowerCase().includes((query || '').toLowerCase())
                );

                return (
                  <div
                    key={item.id}
                    className="p-3.5 sm:p-4 rounded-xl bg-white dark:bg-slate-800/95 border border-slate-200 dark:border-slate-700 space-y-3 shadow-2xs hover:border-blue-300 dark:hover:border-slate-600 transition"
                  >
                    {/* Row header: Item #, Stock connection badge, and Delete */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center">
                          #{idx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          आयटम क्र. {idx + 1}
                        </span>
                        {stockItem && (
                          <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                            <Package className="w-3 h-3" />
                            स्टॉकमधून: {stockItem.name} ({stockItem.code}) • शिल्लक: {stockItem.quantity} {stockItem.unit}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {stockItem && (
                          <button
                            type="button"
                            onClick={() => {
                              handleUpdateItem(item.id, {
                                stockItemId: undefined,
                                code: undefined,
                              });
                            }}
                            className="text-[11px] text-slate-500 hover:text-rose-600 transition cursor-pointer font-medium"
                            title="स्टॉक लिंक काढा"
                          >
                            अनलिंक करा ✕
                          </button>
                        )}
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItemRow(item.id)}
                            className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                            title="हा प्रॉडक्ट बिलातून काढा"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Row Inputs: Description / Stock Search, Qty, Rate, Amount */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                      {/* Product Name & Stock Search */}
                      <div className="sm:col-span-6 relative">
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                            प्रॉडक्टचे नाव / स्टॉकमधून निवडा <span className="text-rose-500">*</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveStockDropdownRowId(isDropdownOpen ? null : item.id);
                              setStockSearchQueryMap((prev) => ({ ...prev, [item.id]: '' }));
                            }}
                            className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer"
                          >
                            {isDropdownOpen ? 'मेन्यू बंद ✕' : 'स्टॉक यादी पहा ▾'}
                          </button>
                        </div>

                        <div className="relative flex items-center">
                          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                          <input
                            type="text"
                            value={item.description || ''}
                            onChange={(e) => {
                              handleUpdateItem(item.id, { description: e.target.value });
                              setStockSearchQueryMap((prev) => ({ ...prev, [item.id]: e.target.value }));
                              setActiveStockDropdownRowId(item.id);
                            }}
                            onFocus={() => {
                              setStockSearchQueryMap((prev) => ({ ...prev, [item.id]: item.description || '' }));
                              setActiveStockDropdownRowId(item.id);
                            }}
                            placeholder="नाव टाईप करा किंवा स्टॉकमधून निवडा (उदा. कुलर, मिक्सर, इ.)..."
                            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-800 dark:text-slate-100 placeholder-slate-400"
                            required
                          />
                        </div>

                        {/* Stock dropdown list */}
                        {isDropdownOpen && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-30 max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                            <div className="p-2 bg-slate-50 dark:bg-slate-800/80 text-[10px] font-bold text-slate-600 dark:text-slate-300 flex items-center justify-between sticky top-0">
                              <span>📦 स्टॉकमधील उपलब्ध उत्पादने (क्लिक करून जोडा):</span>
                              <button
                                type="button"
                                onClick={() => setActiveStockDropdownRowId(null)}
                                className="text-rose-500 hover:text-rose-700 cursor-pointer"
                              >
                                ✕ बंद करा
                              </button>
                            </div>
                            {matchingStock.length > 0 ? (
                              matchingStock.slice(0, 15).map((st) => (
                                <div
                                  key={st.id}
                                  onClick={() => handleSelectStockForItem(item.id, st)}
                                  className="p-2.5 hover:bg-blue-50/80 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between text-xs transition"
                                >
                                  <div>
                                    <p className="font-bold text-slate-900 dark:text-slate-100">{st.name}</p>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                      कोड: <span className="font-mono">{st.code}</span> • शिल्लक:{' '}
                                      <span
                                        className={`font-bold ${
                                          st.quantity <= st.minStockLevel
                                            ? 'text-amber-600 dark:text-amber-400'
                                            : 'text-emerald-600 dark:text-emerald-400'
                                        }`}
                                      >
                                        {st.quantity} {st.unit}
                                      </span>
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <span className="font-bold text-slate-900 dark:text-slate-100 block">
                                      ₹{(Number(st.sellingPrice) || 0).toLocaleString()}
                                    </span>
                                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                                      + बिलात जोडा
                                    </span>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="p-3 text-center text-xs text-slate-400">
                                स्टॉकमध्ये सापडले नाही. तुम्ही थेट वरील नाव टाईप करू शकता.
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Quantity */}
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          नग (Qty)
                        </label>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleUpdateItem(item.id, { qty: Math.max(1, item.qty - 1) })}
                            className="w-7 h-8 rounded border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center cursor-pointer text-xs"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={item.qty ?? 1}
                            onChange={(e) => handleUpdateItem(item.id, { qty: parseInt(e.target.value) || 1 })}
                            className="w-full text-center py-1.5 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg font-bold text-slate-800 dark:text-slate-100"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateItem(item.id, { qty: item.qty + 1 })}
                            className="w-7 h-8 rounded border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center cursor-pointer text-xs"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Rate / Price */}
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          दर (Rate ₹)
                        </label>
                        <div className="relative flex items-center">
                          <span className="absolute left-2.5 text-slate-400 text-xs font-semibold">₹</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.rate || ''}
                            onChange={(e) => handleUpdateItem(item.id, { rate: parseFloat(e.target.value) || 0 })}
                            placeholder="0"
                            className="w-full pl-6 pr-2 py-1.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-slate-800 dark:text-slate-100"
                          />
                        </div>
                      </div>

                      {/* Item Total Amount */}
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          रक्कम (₹)
                        </label>
                        <div className="py-1.5 px-3 bg-slate-100 dark:bg-slate-900/80 rounded-lg border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 text-right">
                          ₹{(Number(item.amount) || 0).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Model & Serial Numbers for this line item */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-slate-50/70 dark:bg-slate-900/40 p-2.5 rounded-lg">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">
                          मॉडेल क्र. (Model No - उदा. GL-D201AELU / 43UR7500)
                        </label>
                        <input
                          type="text"
                          value={item.modelNo || ''}
                          onChange={(e) => handleUpdateItem(item.id, { modelNo: e.target.value })}
                          placeholder="उदा. GL-D201AELU किंवा 43UR7500"
                          className="w-full px-2.5 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md font-mono text-slate-900 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">
                          सिरीयल क्र. / IMEI (Serial No / Barcode)
                        </label>
                        <input
                          type="text"
                          value={item.serialNo || ''}
                          onChange={(e) => handleUpdateItem(item.id, { serialNo: e.target.value })}
                          placeholder="उदा. JWH6512NRKA188661IN"
                          className="w-full px-2.5 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md font-mono text-slate-900 dark:text-slate-100"
                        />
                        {stockItem && stockItem.serialNumbers && stockItem.serialNumbers.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1 items-center">
                            <span className="text-[9px] text-slate-500 font-medium">उपलब्ध सिरीयल:</span>
                            {stockItem.serialNumbers.slice(0, 4).map((sn, sIdx) => (
                              <button
                                key={sIdx}
                                type="button"
                                onClick={() => handleUpdateItem(item.id, { serialNo: sn })}
                                className="text-[9px] font-mono font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 px-1.5 py-0.5 rounded hover:bg-amber-200 cursor-pointer border border-amber-300 dark:border-amber-700"
                                title="हा सिरीयल नंबर निवडा"
                              >
                                {sn}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom of Items: Add Another Item & Live Totals */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                id="btn-add-another-item-bottom"
                onClick={handleAddItemRow}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/70 border-2 border-dashed border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 font-bold text-xs sm:text-sm transition cursor-pointer active:scale-98 shadow-2xs"
              >
                <Plus className="w-4 h-4" />
                <span>+ आणखी प्रॉडक्ट / वस्तू जोडा (+ Add Product / Item)</span>
              </button>

              <div className="flex items-center gap-3 bg-white dark:bg-slate-800 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm shadow-2xs self-end sm:self-auto">
                <span className="text-slate-500 dark:text-slate-400">
                  एकूण वस्तू: <strong className="text-slate-800 dark:text-slate-100 font-bold">{items.length}</strong> (नग: {itemsTotalQty})
                </span>
                <span className="text-slate-300 dark:text-slate-600">|</span>
                <span className="text-slate-700 dark:text-slate-300 font-semibold">
                  सर्व वस्तूंची बेरीज:{' '}
                  <strong className="text-emerald-600 dark:text-emerald-400 text-sm sm:text-base font-bold">
                    ₹{itemsGrandTotal.toLocaleString()}
                  </strong>
                </span>
              </div>
            </div>
          </div>

          {/* Form fields grid: 2 columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Customer Name */}
            <div className="relative">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Customer Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <User className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                <input
                  id="input-customer-name"
                  type="text"
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    setIsCustomerDropdownOpen(true);
                  }}
                  onFocus={() => setIsCustomerDropdownOpen(true)}
                  placeholder="Search by name or ID..."
                  className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition"
                  required
                />
              </div>

              {/* Customer quick dropdown */}
              {isCustomerDropdownOpen && customerName.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredCustomers.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => handleSelectCustomer(c)}
                      className="p-2.5 hover:bg-blue-50/60 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between text-xs transition"
                    >
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{c.name}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Phone: {c.phone}</p>
                      </div>
                      {(Number(c.balanceDue) || 0) > 0 && (
                        <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded">
                          Due: ₹{(Number(c.balanceDue) || 0).toLocaleString()}
                        </span>
                      )}
                    </div>
                  ))}
                  <div
                    onClick={() => setIsCustomerDropdownOpen(false)}
                    className="p-2 text-center text-xs text-blue-600 dark:text-blue-400 font-medium bg-slate-50 dark:bg-slate-800 cursor-pointer hover:bg-blue-50 dark:hover:bg-slate-700"
                  >
                    + Keep "{customerName}" as customer
                  </div>
                </div>
              )}

              {/* Smart Name Suggestion Pills (नाव आधीपासून असल्यास तात्काळ सूचना) */}
              {smartSuggestions.length > 0 && customerName.length >= 2 && (
                <div className="mt-2 p-2.5 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl space-y-1.5 animate-fade-in">
                  <div className="flex items-center justify-between text-[11px] font-bold text-blue-900 dark:text-blue-200">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      नाव जुळणारे आधीचे ग्राहक (Suggested Customers):
                    </span>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-normal">
                      क्लिक केल्यास माहिती आपोआप भरेल
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {smartSuggestions.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setCustomerName(s.name);
                          if (s.phone) setCustomerPhone(s.phone);
                          if (s.village) setVillage(s.village);
                          setIsCustomerDropdownOpen(false);
                        }}
                        className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-100 flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                      >
                        <User className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" />
                        <span className="font-semibold">{s.name}</span>
                        {s.village && <span className="text-slate-400 text-[10px]">({s.village})</span>}
                        {s.phone && <span className="text-slate-500 text-[10px] font-mono">• {s.phone}</span>}
                        {s.balanceDue > 0 && (
                          <span className="text-rose-600 dark:text-rose-400 font-bold text-[10px]">
                            बाकी: ₹{s.balanceDue.toLocaleString()}
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/60 px-1 py-0.5 rounded">
                          वापरा ↵
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Total Amount */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Total Amount (₹) <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3 text-slate-400 font-semibold text-sm">
                  ₹
                </div>
                <input
                  id="input-total-amount"
                  type="number"
                  step="0.01"
                  value={totalAmount}
                  onChange={(e) => {
                    setTotalAmount(e.target.value);
                    if (!payingNow || payingNow === totalAmount) {
                      setPayingNow(e.target.value);
                    }
                  }}
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-900 dark:text-slate-100 font-medium placeholder-slate-400 dark:placeholder-slate-500 transition"
                  required
                />
              </div>
            </div>

            {/* Customer Phone (Optional helper for receipts & WhatsApp) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Customer Phone / WhatsApp{' '}
                <span className="text-slate-400 dark:text-slate-500 font-normal">(for invoice share)</span>
              </label>
              <input
                id="input-customer-phone"
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="e.g. 9876543210"
                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition"
              />

              {/* Phone Mismatch Inline Alert with 1-Click Fix */}
              {phoneMismatch.hasMismatch && phoneMismatch.existingName && (
                <div className="mt-1.5 p-2 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 rounded-lg flex items-center justify-between gap-2 text-xs text-amber-900 dark:text-amber-200 animate-fade-in">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="truncate">
                      हा नंबर आधीच <strong className="font-bold">{phoneMismatch.existingName}</strong> यांचा आहे!
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomerName(phoneMismatch.existingName || '');
                      if (phoneMismatch.existingVillage) setVillage(phoneMismatch.existingVillage);
                    }}
                    className="shrink-0 px-2 py-0.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[10px] rounded shadow-xs flex items-center gap-1 cursor-pointer transition"
                  >
                    <Wrench className="w-2.5 h-2.5" />
                    नाव बदला (Fix)
                  </button>
                </div>
              )}
            </div>

            {/* Customer Village / Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                गाव / पत्ता (Village / Town)
              </label>
              <div className="relative flex items-center">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                <input
                  id="input-customer-village"
                  type="text"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  placeholder="उदा. हिंगणी, सेलू, वर्धा..."
                  className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition"
                />
              </div>
            </div>

            {/* Paying Now */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Paying Now (₹) <span className="text-rose-500">*</span>
                </label>
                {(Number(dueAmount) || 0) > 0 ? (
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                    Remaining Udhar: ₹{(Number(dueAmount) || 0).toLocaleString()}
                  </span>
                ) : numTotal > 0 && numPaid === numTotal ? (
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                    ✓ Full Payment
                  </span>
                ) : null}
              </div>
              <div className="relative flex items-center">
                <div className="absolute left-3 text-slate-400 font-semibold text-sm">
                  ₹
                </div>
                <input
                  id="input-paying-now"
                  type="number"
                  step="0.01"
                  value={payingNow}
                  onChange={(e) => setPayingNow(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-900 dark:text-slate-100 font-medium placeholder-slate-400 dark:placeholder-slate-500 transition"
                  required
                />
              </div>
            </div>

            {/* Item / Details */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Item / Details
              </label>
              <textarea
                id="input-item-details"
                rows={3}
                value={itemDetails}
                onChange={(e) => setItemDetails(e.target.value)}
                placeholder="What was sold or bought (e.g. Rice 10kg, Electric wire)"
                className="w-full p-3 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 resize-none transition"
              />
            </div>

            {/* Bill / Invoice / Quotation No. and Date */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {docType === 'quotation' ? 'Quotation No. / अंदाज क्र.' : 'Bill / Invoice No.'}
                </label>
                <input
                  id="input-invoice-no"
                  type="text"
                  value={invoiceNo || ''}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  placeholder={docType === 'quotation' ? 'उदा. QT-2026-001' : 'उदा. INV-2026-001'}
                  className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Date <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                  <input
                    id="input-entry-date"
                    type="date"
                    value={date || ''}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-800 dark:text-slate-100 transition"
                    required
                  />
                </div>
              </div>

              {docType === 'quotation' && (
                <div>
                  <label className="block text-xs font-semibold text-amber-800 dark:text-amber-400 mb-1.5">
                    कोटेशन वैधता (Validity)
                  </label>
                  <input
                    id="input-quotation-validity"
                    type="text"
                    value={quotationValidity || ''}
                    onChange={(e) => setQuotationValidity(e.target.value)}
                    placeholder="उदा. 15 दिवस वैध"
                    className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder-slate-400 font-medium focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Link Scheme Card (Optional) */}
          <div className="p-4 bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Link Scheme Card to this Bill (Optional / कार्ड लिंक करें)
                </span>
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">Card Schems 1, 2, 3</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Card Scheme
                </label>
                <select
                  value={selectedSchemeId}
                  onChange={(e) => {
                    const sid = e.target.value as CardSchemeId | '';
                    setSelectedSchemeId(sid);
                  }}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg text-xs"
                >
                  <option value="">No Card Scheme (Regular Customer)</option>
                  {SCHEMES_CONFIG.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code} • Nos {s.startCardNo}-{s.endCardNo})
                    </option>
                  ))}
                </select>
              </div>

              {selectedSchemeId && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Card Number (कार्ड नंबर)
                  </label>
                  <input
                    type="number"
                    placeholder={`e.g. ${SCHEMES_CONFIG.find((s) => s.id === selectedSchemeId)?.startCardNo || 1001}`}
                    value={selectedCardNumber}
                    onChange={(e) => setSelectedCardNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg text-xs font-mono font-bold text-blue-700 dark:text-blue-400"
                  />
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
                    Range: {SCHEMES_CONFIG.find((s) => s.id === selectedSchemeId)?.startCardNo} - {SCHEMES_CONFIG.find((s) => s.id === selectedSchemeId)?.endCardNo}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Payment Mode & Finance Calculator */}
          <div className="space-y-3">
            {/* Finance / EMI Helper Banner */}
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-800 dark:text-amber-200 flex items-center justify-center font-bold shrink-0">
                  <Calculator className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-950 dark:text-amber-100 flex items-center gap-1.5">
                    <span>Finance EMI (Bajaj / TVS / HDB / IDBI)</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-100 font-normal">
                      फायनान्स कॅल्क्युलेटर
                    </span>
                  </h4>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
                    {appliedFinance
                      ? `✓ ${appliedFinance.provider.toUpperCase()} लागू: डाऊनपेमेंट ₹${appliedFinance.upfrontPaid.toLocaleString()} | हप्ता ₹${appliedFinance.monthlyEmi.toLocaleString()} (${appliedFinance.tenure} महिने)`
                      : 'ग्राहकास हप्त्यावर वस्तू हवी असल्यास थेट ईएमआय काढा व डाऊनपेमेंट बिलात जोडा'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                {appliedFinance && (
                  <button
                    type="button"
                    onClick={() => {
                      setAppliedFinance(null);
                      setPayingNow(totalAmount);
                    }}
                    className="px-2.5 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/50 rounded-lg transition cursor-pointer"
                  >
                    रद्द करा
                  </button>
                )}
                <button
                  type="button"
                  id="btn-open-bill-finance"
                  onClick={() => setShowFinanceModal(true)}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>{appliedFinance ? 'ईएमआय बदला' : 'ईएमआय काढा (Finance Calc)'}</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Payment Mode
              </label>
              <div className="grid grid-cols-2 gap-3 max-w-md">
                <button
                  type="button"
                  id="btn-mode-cash"
                  onClick={() => setPaymentMode('Cash')}
                  className={`flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl font-semibold text-sm transition cursor-pointer border-2 ${
                    paymentMode === 'Cash'
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Banknote
                    className={`w-5 h-5 ${
                      paymentMode === 'Cash' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
                    }`}
                  />
                  <span>Cash</span>
                </button>

                <button
                  type="button"
                  id="btn-mode-online"
                  onClick={() => setPaymentMode('Online')}
                  className={`flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl font-semibold text-sm transition cursor-pointer border-2 ${
                    paymentMode === 'Online'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Smartphone
                    className={`w-5 h-5 ${
                      paymentMode === 'Online' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'
                    }`}
                  />
                  <span>Online (UPI)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Notes
            </label>
            <textarea
              id="input-entry-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any extra notes"
              className="w-full p-3 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 resize-none transition"
            />
          </div>

          {/* Smart Diagnostics & Mismatch Auto-Fix Box (त्रुटी व विसंगती तपासणी) */}
          <div className="pt-2">
            <BillingDiagnosticBox issues={validationIssues} isSubmitting={isSubmitting} />
          </div>

          {/* Bottom Action bar */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-xs">
              <button
                type="button"
                id="btn-reset-form"
                onClick={resetForm}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {initialEntryToEdit ? 'रीसेट करा (Reset)' : 'Reset Form'}
              </button>
              <span className="text-slate-400 dark:text-slate-500 hidden sm:inline-flex items-center gap-1">
                <Info className="w-3.5 h-3.5" />
                Tip: त्रुटी असल्यास वरील 'दुरुस्त करा' बटणावर क्लिक करा
              </span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                id="btn-cancel-entry"
                onClick={initialEntryToEdit ? (onCancelEdit || onBackToDashboard) : onBackToDashboard}
                className="w-1/2 sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                {initialEntryToEdit ? 'रद्द करा (Cancel)' : 'Cancel'}
              </button>
              <button
                type="submit"
                id="btn-submit-entry"
                disabled={isSubmitting || validationIssues.some((i) => i.severity === 'error')}
                className={`w-1/2 sm:w-auto px-6 py-2.5 rounded-xl text-white text-sm font-semibold shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                  initialEntryToEdit
                    ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                    : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Processing...</span>
                  </>
                ) : initialEntryToEdit ? (
                  <>
                    <Edit3 className="w-4 h-4" />
                    <span>बदल सेव्ह करा (Update Bill)</span>
                  </>
                ) : (
                  <span>Save Entry</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Bottom 3 cards matching screenshot */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Today's Summary */}
        <div className="bg-white dark:bg-slate-800/95 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-2.5">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Today's Summary</h2>
            <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-md">
              {todaysTransactions.length} Entries
            </span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Cash Received:
              </span>
              <span className="font-semibold text-slate-900 dark:text-white">
                ₹{(Number(todayCashIn) || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Online (UPI) In:
              </span>
              <span className="font-semibold text-slate-900 dark:text-white">
                ₹{(Number(todayOnlineIn) || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-100 dark:border-slate-700/60">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Udhar (Pending Dues):
              </span>
              <span className="font-bold text-amber-600 dark:text-amber-400">
                ₹{(Number(todayTotalDues) || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* This Month */}
        <div className="bg-white dark:bg-slate-800/95 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-2.5">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">This Month</h2>
            <span className="text-xs text-slate-400 font-medium">September 2026</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span>Total Revenue:</span>
              <span className="font-bold text-slate-900 dark:text-white text-sm">
                ₹
                {(
                  (Number(todayCashIn) || 0) +
                  (Number(todayOnlineIn) || 0) +
                  todaysTransactions.reduce((a, b) => a + (Number(b.totalAmount) || 0), 0)
                ).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span>Domain Active:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
                {settings.domainName}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-700/60">
              Track real-time transactions & inventory effortlessly.
            </p>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="bg-white dark:bg-slate-800/95 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs p-5 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-2.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Quick Tips</h2>
          </div>
          <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2 list-disc list-inside">
            <li>Link items from stock to auto-deduct inventory on save.</li>
            <li>Press Tab to swiftly jump through customer and amount fields.</li>
            <li>Use the WhatsApp button after saving to send instant e-bills.</li>
          </ul>
        </div>
      </div>
      {/* Finance Calculator Modal */}
      <FinanceCalculatorModal
        settings={settings}
        customers={customersList}
        isOpen={showFinanceModal}
        onClose={() => setShowFinanceModal(false)}
        initialAmount={parseFloat(totalAmount) || undefined}
        initialProductName={items[0]?.description || itemDetails || undefined}
        initialCustomerName={customerName}
        initialCustomerPhone={customerPhone}
        initialCustomerVillage={village}
        onApplyToBill={(details) => {
          setAppliedFinance(details);
          if (details.customerName) {
            setCustomerName(details.customerName);
          }
          if (details.customerPhone) {
            setCustomerPhone(details.customerPhone);
          }
          if (details.customerVillage) {
            setVillage(details.customerVillage);
          }
          if (details.productName && (!items[0]?.description || items[0]?.description === '')) {
            setItems([
              {
                id: `item-fin-${Date.now()}`,
                description: details.productName,
                qty: 1,
                rate: details.productPrice,
                amount: details.productPrice,
                unit: 'नग',
              },
            ]);
            setTotalAmount(String(details.productPrice));
          }
          setPayingNow(String(details.upfrontPaid));
          const emiNote = `[${details.provider.toUpperCase()} Finance: Down Payment ₹${details.downPayment}, Loan ₹${details.financedAmount}, EMI ₹${details.monthlyEmi} x ${details.tenure} mo]`;
          setNotes((prev) => (prev ? `${prev} | ${emiNote}` : emiNote));
          setShowFinanceModal(false);
        }}
      />
    </div>
  );
};
