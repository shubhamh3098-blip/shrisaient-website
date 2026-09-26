import React, { useState, useMemo, useEffect } from 'react';
import {
  FileText,
  Search,
  CheckCircle2,
  Printer,
  RotateCcw,
  ArrowLeft,
  CreditCard,
  Building2,
  Tag,
  Barcode,
  Sparkles,
  Smartphone,
  MapPin,
  Clock,
  RefreshCw,
  Gift,
  Link,
  X,
  PlusCircle,
  PackagePlus,
  Boxes,
  Bell,
  Check,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Landmark,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { Customer, InvoiceItem, StockItem, StoreData, Transaction, BillReceipt, CardMember } from '../../types';
import { StorageService } from '../../services/storageService';
import { useTheme } from '../../context/ThemeContext';

export interface BillItemFormRow {
  id: string;
  stockId?: string;
  name: string;
  brand?: string;
  model: string;
  serialNo: string;
  qty: number;
  rate: number;
  total: number;
}

export interface InitialBillingOrderData {
  customerName?: string;
  customerPhone?: string;
  customerLocation?: string;
  itemDetails?: string;
  modelName?: string;
  serialNo?: string;
  totalAmount?: number;
  stockId?: string;
}

interface AddEntryViewProps {
  storeData: StoreData;
  onRefreshData: () => void;
  onPrintInvoice: (tx: Transaction) => void;
  onBackToDashboard: () => void;
  initialOrderData?: InitialBillingOrderData | null;
  onClearInitialOrderData?: () => void;
}

export const AddEntryView: React.FC<AddEntryViewProps> = ({
  storeData,
  onRefreshData,
  onPrintInvoice,
  onBackToDashboard,
  initialOrderData,
  onClearInitialOrderData,
}) => {
  const { isDayMode } = useTheme();

  // Document Type: Sale Invoice vs Quotation
  const [docType, setDocType] = useState<'sale_invoice' | 'quotation'>('sale_invoice');

  // Stock Search / Item Linking
  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const [selectedStock, setSelectedStock] = useState<StockItem | null>(null);
  const [showStockDropdown, setShowStockDropdown] = useState(false);

  // New Product Modal State
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdBrand, setNewProdBrand] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('Electronics');
  const [newProdModel, setNewProdModel] = useState('');
  const [newProdSerial, setNewProdSerial] = useState('');
  const [newProdSalePrice, setNewProdSalePrice] = useState('');
  const [newProdCostPrice, setNewProdCostPrice] = useState('');
  const [newProdStockQty, setNewProdStockQty] = useState('1');
  const [newProdUnit, setNewProdUnit] = useState('Piece');
  const [newProdSaveToStock, setNewProdSaveToStock] = useState(true);

  // Form Fields matching Screenshot 2 exactly
  const [customerName, setCustomerName] = useState('');
  const [customerLocation, setCustomerLocation] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [totalAmount, setTotalAmount] = useState<string>('');
  const [payingNow, setPayingNow] = useState<string>('');
  const [itemDetails, setItemDetails] = useState('');
  const [modelName, setModelName] = useState('');
  const [serialNo, setSerialNo] = useState('');

  // Multi-Product Bill Items State (matching Screenshot: Bill Items & Products)
  const [billItems, setBillItems] = useState<BillItemFormRow[]>([
    {
      id: `item-${Date.now()}-1`,
      name: '',
      brand: '',
      model: '',
      serialNo: '',
      qty: 1,
      rate: 0,
      total: 0,
    }
  ]);
  const [activeStockDropdownRowId, setActiveStockDropdownRowId] = useState<string | null>(null);

  // Built-in Finance System State (बजाज, TVS, HDB, कोटक, शोरूम ईएमआय)
  const [isFinance, setIsFinance] = useState(false);
  const [financeProvider, setFinanceProvider] = useState<string>('बजाज फायनान्स (Bajaj Finserv)');
  const [financeDownPayment, setFinanceDownPayment] = useState<string>('');
  const [financeFileNo, setFinanceFileNo] = useState<string>('');
  const [financeTenureMonths, setFinanceTenureMonths] = useState<number>(10);

  // Pre-load from initialOrderData if supplied
  useEffect(() => {
    if (initialOrderData) {
      if (initialOrderData.customerName) setCustomerName(initialOrderData.customerName);
      if (initialOrderData.customerPhone) setCustomerPhone(initialOrderData.customerPhone);
      if (initialOrderData.customerLocation) setCustomerLocation(initialOrderData.customerLocation);
      if (initialOrderData.itemDetails) setItemDetails(initialOrderData.itemDetails);
      if (initialOrderData.modelName) setModelName(initialOrderData.modelName);
      if (initialOrderData.serialNo) setSerialNo(initialOrderData.serialNo);
      if (initialOrderData.totalAmount) {
        setTotalAmount(initialOrderData.totalAmount.toString());
        setPayingNow(initialOrderData.totalAmount.toString());
      }
      const initialRow: BillItemFormRow = {
        id: `item-initial-${Date.now()}`,
        name: initialOrderData.itemDetails || '',
        brand: '',
        model: initialOrderData.modelName || '',
        serialNo: initialOrderData.serialNo || '',
        qty: 1,
        rate: initialOrderData.totalAmount || 0,
        total: initialOrderData.totalAmount || 0,
        stockId: initialOrderData.stockId,
      };
      if (initialOrderData.stockId) {
        const item = storeData.stock.find((s) => s.id === initialOrderData.stockId);
        if (item) {
          setSelectedStock(item);
          initialRow.brand = item.brand;
          if (!initialRow.name) initialRow.name = item.name;
          if (!initialRow.model) initialRow.model = item.model || '';
          if (!initialRow.serialNo) initialRow.serialNo = item.serialNo || '';
          setStockSearchQuery(`${item.name} (${item.brand})`);
        }
      }
      setBillItems([initialRow]);
    }
  }, [initialOrderData, storeData.stock]);

  // Card Scheme Linking (30-month Scheme member linking)
  const [linkedCardNo, setLinkedCardNo] = useState<string>('');
  const [linkedCardMember, setLinkedCardMember] = useState<CardMember | null>(null);
  const [showCardSelector, setShowCardSelector] = useState<boolean>(false);
  const [cardSearchQuery, setCardSearchQuery] = useState<string>('');

  // Additional Sales Config
  const [paymentMode, setPaymentMode] = useState<Transaction['paymentMode']>('Cash');
  const [deliveryStatus, setDeliveryStatus] = useState<Transaction['deliveryStatus']>('Delivered');
  const [remarks, setRemarks] = useState('');

  // Success Notification state
  const [savedSuccessTx, setSavedSuccessTx] = useState<Transaction | null>(null);

  // Customer Credit Limit & Overdue Warning
  const [overrideCreditLimit, setOverrideCreditLimit] = useState<boolean>(false);

  const matchedCustomer = useMemo(() => {
    if (!customerName.trim() && !customerPhone.trim()) return null;
    return storeData.customers.find(
      (c) =>
        (customerName.trim() && c.name.toLowerCase() === customerName.trim().toLowerCase()) ||
        (customerPhone.trim() && customerPhone.trim() !== '0' && c.phone === customerPhone.trim())
    ) || null;
  }, [customerName, customerPhone, storeData.customers]);

  const newBillRemaining = Math.max(0, (parseFloat(totalAmount) || 0) - (parseFloat(payingNow) || 0));
  const currentCustBalance = matchedCustomer?.currentBalance || 0;
  const customerCreditLimit = matchedCustomer?.creditLimit || 20000;
  const projectedTotalDue = currentCustBalance + newBillRemaining;
  const isCreditLimitExceeded = Boolean(
    matchedCustomer &&
    newBillRemaining > 0 &&
    (projectedTotalDue > customerCreditLimit || currentCustBalance >= customerCreditLimit)
  );

  // Filter stock for search autocomplete
  const filteredStock = storeData.stock.filter((s) => {
    if (!stockSearchQuery.trim()) return false;
    const q = stockSearchQuery.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.brand.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q) ||
      (s.model && s.model.toLowerCase().includes(q)) ||
      (s.serialNo && s.serialNo.toLowerCase().includes(q))
    );
  });

  // Filter customer suggestions
  const customerSuggestions = storeData.customers.filter((c) => {
    if (!customerName.trim() || customerName.length < 2) return false;
    const q = customerName.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.phone.includes(q);
  });

  // When stock is selected from top search bar, populate relevant fields and bill items
  const handleSelectStock = (stock: StockItem) => {
    setSelectedStock(stock);
    setItemDetails(`${stock.brand} - ${stock.name}`);
    setModelName(stock.model || '');
    
    // Only use serial if pre-saved in stock, otherwise leave empty for typing the real box serial
    const sNo = stock.serialNo && stock.serialNo.trim() !== '' ? stock.serialNo : '';
    setSerialNo(sNo);

    setStockSearchQuery(`${stock.name} (${stock.brand})`);
    setShowStockDropdown(false);

    // Populate or update billItems
    setBillItems((prev) => {
      const firstEmptyIndex = prev.findIndex((it) => !it.name.trim() && it.rate === 0);
      if (firstEmptyIndex >= 0) {
        const copy = [...prev];
        copy[firstEmptyIndex] = {
          ...copy[firstEmptyIndex],
          stockId: stock.id,
          name: stock.name,
          brand: stock.brand,
          model: stock.model || '',
          serialNo: sNo,
          qty: 1,
          rate: stock.salePrice,
          total: stock.salePrice,
        };
        const sum = copy.reduce((acc, it) => acc + (it.total || 0), 0);
        setTotalAmount(sum > 0 ? sum.toString() : stock.salePrice.toString());
        if (!isFinance) {
          setPayingNow(sum > 0 ? sum.toString() : stock.salePrice.toString());
        }
        return copy;
      }
      const updated = [
        ...prev,
        {
          id: `item-${Date.now()}-${prev.length + 1}`,
          stockId: stock.id,
          name: stock.name,
          brand: stock.brand,
          model: stock.model || '',
          serialNo: sNo,
          qty: 1,
          rate: stock.salePrice,
          total: stock.salePrice,
        }
      ];
      const sum = updated.reduce((acc, it) => acc + (it.total || 0), 0);
      setTotalAmount(sum > 0 ? sum.toString() : stock.salePrice.toString());
      if (!isFinance) {
        setPayingNow(sum > 0 ? sum.toString() : stock.salePrice.toString());
      }
      return updated;
    });
  };

  // Add Item Row to Bill Items Table
  const handleAddItemRow = () => {
    setBillItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}-${prev.length + 1}`,
        name: '',
        brand: '',
        model: '',
        serialNo: '',
        qty: 1,
        rate: 0,
        total: 0,
      }
    ]);
  };

  // Remove Item Row from Bill Items Table
  const handleRemoveItemRow = (id: string) => {
    if (billItems.length <= 1) {
      setBillItems([{
        id: `item-${Date.now()}-1`,
        name: '',
        brand: '',
        model: '',
        serialNo: '',
        qty: 1,
        rate: 0,
        total: 0,
      }]);
      setTotalAmount('');
      setPayingNow('');
      setItemDetails('');
      setModelName('');
      setSerialNo('');
      setSelectedStock(null);
      return;
    }
    const updated = billItems.filter((it) => it.id !== id);
    setBillItems(updated);
    const sum = updated.reduce((acc, it) => acc + (it.total || 0), 0);
    setTotalAmount(sum > 0 ? sum.toString() : '');
    if (!isFinance) {
      setPayingNow(sum > 0 ? sum.toString() : '');
    }
  };

  // Update Item Row in Bill Items Table
  const handleUpdateItemRow = (id: string, field: keyof BillItemFormRow, value: any) => {
    setBillItems((prev) => {
      const updated = prev.map((item) => {
        if (item.id !== id) return item;
        const newItem = { ...item, [field]: value };
        if (field === 'qty' || field === 'rate') {
          const q = field === 'qty' ? Number(value) || 0 : item.qty;
          const r = field === 'rate' ? Number(value) || 0 : item.rate;
          newItem.total = Math.round(q * r);
        }
        return newItem;
      });
      const sum = updated.reduce((acc, it) => acc + (it.total || 0), 0);
      setTotalAmount(sum > 0 ? sum.toString() : '');
      if (!isFinance) {
        setPayingNow(sum > 0 ? sum.toString() : '');
      }
      return updated;
    });
  };

  // Select Stock for a specific Row
  const handleSelectStockForItemRow = (rowId: string, stock: StockItem) => {
    setBillItems((prev) => {
      const updated = prev.map((item) => {
        if (item.id !== rowId) return item;
        const q = item.qty || 1;
        const r = stock.salePrice || 0;
        return {
          ...item,
          stockId: stock.id,
          name: stock.name,
          brand: stock.brand,
          model: stock.model || '',
          serialNo: stock.serialNo || '',
          qty: q,
          rate: r,
          total: Math.round(q * r),
        };
      });
      const sum = updated.reduce((acc, it) => acc + (it.total || 0), 0);
      setTotalAmount(sum > 0 ? sum.toString() : '');
      if (!isFinance) {
        setPayingNow(sum > 0 ? sum.toString() : '');
      }
      return updated;
    });
    setActiveStockDropdownRowId(null);
  };

  const handleSaveNewProduct = () => {
    if (!newProdName.trim()) {
      alert('कृपया वस्तूचे नाव टाका.');
      return;
    }
    const saleP = parseFloat(newProdSalePrice) || 0;
    const costP = parseFloat(newProdCostPrice) || 0;
    const qty = parseInt(newProdStockQty) || 1;

    const newStockItem: StockItem = {
      id: `stock_${Date.now()}`,
      code: `SSE-${Math.floor(1000 + Math.random() * 9000)}`,
      name: newProdName.trim(),
      brand: newProdBrand.trim() || 'General',
      category: (newProdCategory as StockItem['category']) || 'Other',
      model: newProdModel.trim() || 'Standard',
      serialNo: newProdSerial.trim() || undefined,
      purchasePrice: costP,
      salePrice: saleP,
      mrp: saleP,
      stockQty: qty,
      minAlertQty: 2,
      unit: newProdUnit || 'Piece',
      updatedAt: new Date().toISOString(),
    };

    if (newProdSaveToStock) {
      const data = StorageService.loadData();
      data.stock.unshift(newStockItem);
      StorageService.saveData(data);
      onRefreshData();
    }

    // Immediately select this product for current bill
    setSelectedStock(newStockItem);
    setItemDetails(`${newStockItem.brand} - ${newStockItem.name}`);
    setModelName(newStockItem.model || '');
    setSerialNo(newStockItem.serialNo || '');
    setStockSearchQuery(`${newStockItem.name} (${newStockItem.brand})`);

    // Add to bill items
    setBillItems((prev) => {
      const firstEmptyIndex = prev.findIndex((it) => !it.name.trim() && it.rate === 0);
      if (firstEmptyIndex >= 0) {
        const copy = [...prev];
        copy[firstEmptyIndex] = {
          ...copy[firstEmptyIndex],
          stockId: newStockItem.id,
          name: newStockItem.name,
          brand: newStockItem.brand,
          model: newStockItem.model || '',
          serialNo: newStockItem.serialNo || '',
          qty: 1,
          rate: saleP,
          total: saleP,
        };
        const sum = copy.reduce((acc, it) => acc + (it.total || 0), 0);
        setTotalAmount(sum > 0 ? sum.toString() : saleP.toString());
        if (!isFinance) setPayingNow(sum > 0 ? sum.toString() : saleP.toString());
        return copy;
      }
      const updated = [
        ...prev,
        {
          id: `item-${Date.now()}-${prev.length + 1}`,
          stockId: newStockItem.id,
          name: newStockItem.name,
          brand: newStockItem.brand,
          model: newStockItem.model || '',
          serialNo: newStockItem.serialNo || '',
          qty: 1,
          rate: saleP,
          total: saleP,
        }
      ];
      const sum = updated.reduce((acc, it) => acc + (it.total || 0), 0);
      setTotalAmount(sum > 0 ? sum.toString() : saleP.toString());
      if (!isFinance) setPayingNow(sum > 0 ? sum.toString() : saleP.toString());
      return updated;
    });

    // Reset modal fields and close
    setNewProdName('');
    setNewProdBrand('');
    setNewProdModel('');
    setNewProdSerial('');
    setNewProdSalePrice('');
    setNewProdCostPrice('');
    setNewProdStockQty('1');
    setIsAddProductOpen(false);
  };

  const handleGenerateNewSerial = () => {
    const prefix = selectedStock?.brand ? selectedStock.brand.slice(0, 3).toUpperCase() : 'SSE';
    const rand = Math.floor(100000 + Math.random() * 900000);
    setSerialNo(`${prefix}-${rand}`);
  };

  // When customer suggestion is clicked
  const handleSelectCustomer = (cust: Customer) => {
    setCustomerName(cust.name);
    setCustomerLocation(cust.address || cust.city || 'Wardha');
    setCustomerPhone(cust.phone === '0' ? '' : cust.phone);

    // Auto-search if this customer has a linked card scheme
    const matchMember = storeData.cardMembers.find(
      (m) => m.phone === cust.phone || m.memberName.toLowerCase() === cust.name.toLowerCase()
    );
    if (matchMember) {
      setLinkedCardNo(matchMember.cardNo);
      setLinkedCardMember(matchMember);
    }
  };

  const handleSelectCardMember = (member: CardMember) => {
    setLinkedCardMember(member);
    setLinkedCardNo(member.cardNo);
    setShowCardSelector(false);
    if (!customerName.trim()) {
      setCustomerName(member.memberName);
    }
    if (!customerPhone.trim() || customerPhone === '0') {
      setCustomerPhone(member.phone);
    }
    if (!customerLocation.trim()) {
      setCustomerLocation(member.village || member.address || 'Wardha');
    }
  };

  const handleClearCardLink = () => {
    setLinkedCardMember(null);
    setLinkedCardNo('');
    setCardSearchQuery('');
  };

  // Reset form
  const handleResetForm = () => {
    setSelectedStock(null);
    setStockSearchQuery('');
    setCustomerName('');
    setCustomerLocation('');
    setCustomerPhone('');
    setTotalAmount('');
    setPayingNow('');
    setItemDetails('');
    setModelName('');
    setSerialNo('');
    setBillItems([
      {
        id: `item-${Date.now()}-1`,
        name: '',
        brand: '',
        model: '',
        serialNo: '',
        qty: 1,
        rate: 0,
        total: 0,
      }
    ]);
    setIsFinance(false);
    setFinanceProvider('बजाज फायनान्स (Bajaj Finserv)');
    setFinanceDownPayment('');
    setFinanceFileNo('');
    setFinanceTenureMonths(10);
    setLinkedCardNo('');
    setLinkedCardMember(null);
    setShowCardSelector(false);
    setPaymentMode('Cash');
    setDeliveryStatus('Delivered');
    setRemarks('');
    setSavedSuccessTx(null);
  };

  // Handle Save
  const handleSave = (shouldPrint: boolean = false) => {
    if (!customerName.trim()) {
      alert('कृपया ग्राहकाचे नाव टाका (Customer Name is required)');
      return;
    }

    const totalVal = parseFloat(totalAmount) || 0;
    const paidVal = isFinance ? (parseFloat(financeDownPayment) || 0) : (parseFloat(payingNow) || 0);

    if (totalVal <= 0) {
      alert('कृपया बिलाची एकूण रक्कम टाका (Total Amount must be greater than 0)');
      return;
    }

    // Finance calculations
    const isFin = isFinance;
    const downPaymentVal = isFin ? (parseFloat(financeDownPayment) || 0) : paidVal;
    const loanAmountVal = isFin ? Math.max(0, totalVal - downPaymentVal) : Math.max(0, totalVal - paidVal);
    const tenureMonths = financeTenureMonths || 10;
    const monthlyEmiVal = isFin && tenureMonths > 0 ? Math.round(loanAmountVal / tenureMonths) : undefined;

    // Customer Credit Limit Validation
    if (!isFin && isCreditLimitExceeded && !overrideCreditLimit) {
      alert(`🛑 उधारी मर्यादा इशारा (Credit Limit Exceeded)!\n\nग्राहकाची सध्याची उधारी: ₹${currentCustBalance.toLocaleString('en-IN')}\nकमाल उधारी मर्यादा: ₹${customerCreditLimit.toLocaleString('en-IN')}\nनवीन बिलासह एकूण उधारी: ₹${projectedTotalDue.toLocaleString('en-IN')}\n\nकृपया मालकाच्या संमतीसाठी खालील 'मालकाच्या विशेष परवानगीने विक्री' बॉक्स निवडून सबमिट करा.`);
      return;
    }

    // Match or create customer
    let targetCustomerId = '';
    const existingCust = storeData.customers.find(
      (c) => c.name.toLowerCase() === customerName.trim().toLowerCase()
    );

    const data = StorageService.loadData();

    if (existingCust) {
      targetCustomerId = existingCust.id;
      // Update balance & purchase on real customer
      const custInStore = data.customers.find((c) => c.id === existingCust.id);
      if (custInStore) {
        custInStore.totalPurchased += totalVal;
        // In 3rd-party finance (Bajaj, TVS, HDB, Shriram, IDFC), the finance company pays showroom. Customer does not owe loan amount to showroom ledger.
        const isInHouseFinance = isFin && financeProvider.includes('इन-हाऊस');
        const dueIncrement = isFin ? (isInHouseFinance ? loanAmountVal : 0) : (totalVal - paidVal);
        custInStore.currentBalance += dueIncrement;
        if (customerLocation && (!custInStore.address || custInStore.address === '')) {
          custInStore.address = customerLocation;
        }
        if (customerPhone && (!custInStore.phone || custInStore.phone === '0')) {
          custInStore.phone = customerPhone;
        }
      }
    } else {
      // Create brand new customer
      const newCustId = `cust_${Date.now()}`;
      targetCustomerId = newCustId;
      const isInHouseFinance = isFin && financeProvider.includes('इन-हाऊस');
      const initialBalance = isFin ? (isInHouseFinance ? loanAmountVal : 0) : Math.max(0, totalVal - paidVal);
      const newCust: Customer = {
        id: newCustId,
        name: customerName.trim(),
        phone: customerPhone.trim() || '0',
        address: customerLocation.trim() || 'Wardha',
        city: customerLocation.trim() || 'Wardha',
        creditLimit: 30000,
        currentBalance: initialBalance,
        totalPurchased: totalVal,
        createdAt: new Date().toISOString(),
      };
      data.customers.unshift(newCust);
    }

    // Generate Invoice Number
    const invNum = data.settings.nextInvoiceNo || 1080;
    data.settings.nextInvoiceNo = invNum + 1;

    // Items array from billItems or fallback
    const validRows = billItems.filter((it) => it.name.trim() || it.rate > 0);
    const invoiceItems: InvoiceItem[] = validRows.length > 0
      ? validRows.map((it) => ({
          stockId: it.stockId || 'manual_item',
          name: it.name.trim() || 'Electronic / Furniture Item',
          brand: it.brand || 'Standard',
          model: it.model?.trim() || undefined,
          serialNo: it.serialNo?.trim() || undefined,
          qty: it.qty || 1,
          rate: it.rate || totalVal,
          discountPct: 0,
          taxPct: 0,
          total: it.total || (it.qty * it.rate) || totalVal,
        }))
      : [
          {
            stockId: selectedStock?.id || 'manual_item',
            name: itemDetails.trim() || (selectedStock ? selectedStock.name : 'Electronic / Furniture Item'),
            brand: selectedStock?.brand || 'Standard',
            model: modelName.trim() || selectedStock?.model,
            serialNo: serialNo.trim() || selectedStock?.serialNo,
            qty: 1,
            rate: totalVal,
            discountPct: 0,
            taxPct: 0,
            total: totalVal,
          },
        ];

    // Finance Details Object
    const financeDetailsObj = isFin
      ? {
          isFinance: true,
          provider: financeProvider,
          downPayment: downPaymentVal,
          loanAmount: loanAmountVal,
          fileNo: financeFileNo.trim() || undefined,
          emiMonths: tenureMonths,
          monthlyEmi: monthlyEmiVal,
        }
      : undefined;

    // Transaction record
    const effectivePaymentMode: Transaction['paymentMode'] = isFin
      ? (financeProvider.includes('बजाज') ? 'Bajaj Finance' : 'EMI')
      : paymentMode;

    const newTx: Transaction = {
      id: `tx_${Date.now()}`,
      invoiceNo: `SSE-INV-${invNum}`,
      date: new Date().toISOString().slice(0, 10),
      customerId: targetCustomerId,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim() || '0',
      customerAddress: customerLocation.trim() || 'Wardha',
      paymentMode: effectivePaymentMode,
      items: invoiceItems,
      subtotal: totalVal,
      taxTotal: 0,
      discountTotal: 0,
      grandTotal: totalVal,
      paidAmount: isFin ? downPaymentVal : paidVal,
      balanceDue: isFin ? loanAmountVal : Math.max(0, totalVal - paidVal),
      deliveryStatus: deliveryStatus,
      status: isFin
        ? (downPaymentVal >= totalVal ? 'Paid' : 'Partial')
        : (paidVal >= totalVal ? 'Paid' : paidVal > 0 ? 'Partial' : 'Unpaid'),
      linkedCardId: linkedCardMember?.id || undefined,
      linkedCardNo: linkedCardNo.trim() || linkedCardMember?.cardNo || undefined,
      financeDetails: financeDetailsObj,
      remarks: remarks.trim()
        ? `${remarks.trim()}${isFin ? ` | Finance: ${financeProvider} (Loan: ₹${loanAmountVal}, DO: ${financeFileNo || 'N/A'}, EMI: ₹${monthlyEmiVal}×${tenureMonths}m)` : ''}${linkedCardNo ? ` | Linked Card: ${linkedCardNo}` : ''}`
        : isFin
        ? `Finance: ${financeProvider} | DO: ${financeFileNo || 'N/A'} | Down Payment: ₹${downPaymentVal} | Loan: ₹${loanAmountVal} (${tenureMonths} Mo. EMI: ₹${monthlyEmiVal}/महिना)${linkedCardNo ? ` | Linked Card: ${linkedCardNo}` : ''}`
        : linkedCardNo
        ? `Linked Scheme Card: ${linkedCardNo}${serialNo ? ` | Serial: ${serialNo}` : ''}`
        : serialNo
        ? `Serial: ${serialNo}`
        : undefined,
      createdBy: 'Admin (Bhushan)',
    };

    data.transactions.unshift(newTx);

    // If down payment / paidNow > 0, generate automated Bill Receipt (#1079 series)
    const immediatePaidAmt = isFin ? downPaymentVal : paidVal;
    if (immediatePaidAmt > 0) {
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
        amountPaid: immediatePaidAmt,
        date: new Date().toISOString().slice(0, 10),
        paymentMode: receiptPaymentMode,
        balanceRemaining: isFin ? loanAmountVal : Math.max(0, totalVal - paidVal),
        remarks: isFin
          ? `फायनान्स डाऊन पेमेंट जमा पावती (${financeProvider} - DO: ${financeFileNo || 'N/A'})`
          : `Add Entry द्वारे तात्काळ जमा पावती (Immediate Payment against Bill #${invNum})`,
        handledBy: 'Admin (Bhushan)',
      };
      data.billReceipts.unshift(newReceipt);
    }

    // Deduct stock for all items in invoiceItems
    invoiceItems.forEach((invItem) => {
      if (invItem.stockId && invItem.stockId !== 'manual_item') {
        const sItem = data.stock.find((s) => s.id === invItem.stockId);
        if (sItem && sItem.stockQty > 0) {
          sItem.stockQty = Math.max(0, sItem.stockQty - (invItem.qty || 1));
        }
      }
    });

    // Save and commit
    StorageService.saveData(data);
    onRefreshData();
    setSavedSuccessTx(newTx);

    if (shouldPrint) {
      onPrintInvoice(newTx);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={onBackToDashboard}
            className={`p-2 rounded-2xl border transition cursor-pointer ${
              isDayMode
                ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className={`text-xl font-extrabold flex items-center gap-2 ${
              isDayMode ? 'text-slate-900' : 'text-white'
            }`}>
              <FileText className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <span>Add Entry (नवीन बिल नोंदणी)</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              इलेक्ट्रॉनिक्स व फर्निचर विक्री बिल, कोटेशन व तात्काळ जमा पावती
            </p>
          </div>
        </div>

        {/* Document Type Selector matching Screenshot 2 (Sale Invoice / Quotation) */}
        <div className={`flex items-center p-1 rounded-2xl border ${
          isDayMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
        }`}>
          <button
            onClick={() => setDocType('sale_invoice')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              docType === 'sale_invoice'
                ? 'bg-teal-600 text-white shadow-sm'
                : isDayMode ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Sale Invoice (पक्के बिल)</span>
          </button>
          <button
            onClick={() => setDocType('quotation')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              docType === 'quotation'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : isDayMode ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Quotation (अंदाजपत्रक)</span>
          </button>
        </div>
      </div>

      {/* Success Notification Card */}
      {savedSuccessTx && (
        <div className={`p-4 rounded-3xl border flex items-center justify-between gap-4 animate-in fade-in duration-300 ${
          isDayMode
            ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
            : 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
        }`}>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
            <div>
              <div className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                बिल यशस्वीरित्या सेव्ह झाले! (Invoice #{savedSuccessTx.invoiceNo})
              </div>
              <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                ग्राहक: {savedSuccessTx.customerName} • एकूण: ₹{savedSuccessTx.grandTotal.toLocaleString('en-IN')} • 
                जमा: ₹{savedSuccessTx.paidAmount.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPrintInvoice(savedSuccessTx)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>प्रिंट काढा</span>
            </button>
            <button
              onClick={handleResetForm}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                isDayMode ? 'bg-white border-emerald-300 text-emerald-800' : 'bg-slate-900 border-slate-700 text-slate-200'
              }`}
            >
              पुढील बिल
            </button>
          </div>
        </div>
      )}

      {/* Cart / Online Order Loaded Alert Banner */}
      {initialOrderData && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-500/20 to-orange-500/15 border border-amber-500/40 text-amber-300 flex items-center justify-between gap-3 text-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="font-extrabold text-amber-200 text-sm">
                कार्ट / ऑनलाइन ऑर्डर तपशील लोड केले!
              </div>
              <p className="text-[11px] text-slate-300">
                ग्राहकाचे नाव: <b>{customerName || 'N/A'}</b> | वस्तू: <b>{itemDetails || 'N/A'}</b> | कृपया बॉक्सवरील खरा <b>मॉडेल नंबर</b> व <b>सिरीयल नंबर (Serial No / IMEI)</b> भरून बिल अंतिम करा.
              </p>
            </div>
          </div>
          {onClearInitialOrderData && (
            <button
              onClick={onClearInitialOrderData}
              className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-bold text-xs shrink-0 cursor-pointer"
              title="क्लियर करा"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Main Billing Form Card matching Screenshot 2 */}
      <div className={`p-6 rounded-3xl border shadow-sm transition-colors duration-300 space-y-6 ${
        isDayMode
          ? 'bg-white/95 border-slate-200/90 text-slate-800'
          : 'bg-slate-900 border-slate-800 text-slate-100 shadow-xl'
      }`}>
        {/* Fast Stock Search & Auto-Fill Header with Add Product Feature */}
        <div className="relative">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold flex items-center gap-1.5 text-teal-600 dark:text-teal-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>स्टॉक किंवा प्रॉडक्ट शोधा (Fast Stock Search)</span>
              </label>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                • गोदामातील वस्तू निवडा किंवा थेट नवीन जोडा
              </span>
            </div>

            {/* CRITICAL FEATURE: + Add Product / Item Directly from Add Entry */}
            <button
              type="button"
              onClick={() => setIsAddProductOpen(true)}
              className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer active:scale-95"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ नवीन प्रॉडक्ट जोडा (Add Product)</span>
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={stockSearchQuery}
              onChange={(e) => {
                setStockSearchQuery(e.target.value);
                setShowStockDropdown(true);
              }}
              onFocus={() => setShowStockDropdown(true)}
              placeholder="स्टॉक नाव, ब्रँड किंवा मॉडेल टाईप करा (उदा. LG 43, Voltas AC, Samsung, Teakwood Diwan, Godrej)..."
              className={`w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs focus:outline-none focus:border-teal-500 transition border ${
                isDayMode
                  ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                  : 'bg-slate-950 border-slate-700 text-white placeholder-slate-500'
              }`}
            />
          </div>

          {/* Autocomplete dropdown */}
          {showStockDropdown && filteredStock.length > 0 && (
            <div className={`absolute z-20 top-full left-0 right-0 mt-1 rounded-2xl shadow-2xl max-h-60 overflow-y-auto divide-y border ${
              isDayMode
                ? 'bg-white border-slate-200 divide-slate-100'
                : 'bg-slate-900 border-slate-700 divide-slate-800'
            }`}>
              {filteredStock.map((stock) => (
                <div
                  key={stock.id}
                  onClick={() => handleSelectStock(stock)}
                  className={`p-3 cursor-pointer flex items-center justify-between transition ${
                    isDayMode ? 'hover:bg-teal-50' : 'hover:bg-slate-800'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">{stock.name}</div>
                    <div className="text-[11px] text-slate-400">
                      Brand: {stock.brand} {stock.model ? `• Model: ${stock.model}` : ''} {stock.serialNo ? `• S/N: ${stock.serialNo}` : ''}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      ₹{stock.salePrice.toLocaleString('en-IN')}
                    </div>
                    <div className={`text-[10px] ${stock.stockQty <= stock.minAlertQty ? 'text-rose-500 font-bold' : 'text-slate-400'}`}>
                      Stock: {stock.stockQty} {stock.unit}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Selected Stock Badge */}
          {selectedStock && (
            <div className="mt-2 p-2 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-teal-500 font-bold">✓ निवडलेला स्टॉक:</span>
                <span className="font-semibold text-slate-800 dark:text-white">{selectedStock.name}</span>
                <span className="text-slate-400">({selectedStock.brand})</span>
                <span className="text-emerald-500 font-bold">₹{selectedStock.salePrice}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedStock(null);
                  setStockSearchQuery('');
                }}
                className="text-[11px] text-rose-400 hover:text-rose-300 font-bold hover:underline"
              >
                बदला ✕
              </button>
            </div>
          )}
        </div>

        {/* Modal: Add New Product / Stock Item Directly */}
        {isAddProductOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
            <div className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[92vh] ${
              isDayMode ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'
            }`}>
              <div className={`p-4 border-b flex items-center justify-between ${
                isDayMode ? 'bg-teal-50/80 border-teal-100' : 'bg-slate-950 border-slate-800'
              }`}>
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-teal-600 text-white">
                    <PackagePlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">नवीन प्रॉडक्ट नोंदणी (Add New Product)</h3>
                    <p className="text-[11px] text-slate-400">नवीन वस्तू तयार करून थेट या बिलात जोडा</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddProductOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-500/20 text-slate-400 hover:text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-3.5 text-xs">
                {/* Product Name */}
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    वस्तूचे नाव (Product Name) *
                  </label>
                  <input
                    type="text"
                    value={newProdName}
                    onChange={(e) => setNewProdName(e.target.value)}
                    placeholder="उदा. Samsung 43 Crystal 4K TV / Teakwood Diwan 6x4"
                    className={`w-full px-3 py-2 rounded-xl border text-xs outline-none focus:ring-1 focus:ring-teal-500 ${
                      isDayMode ? 'bg-slate-50 border-slate-300' : 'bg-slate-950 border-slate-700'
                    }`}
                  />
                </div>

                {/* Brand & Category */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">
                      ब्रँड (Brand)
                    </label>
                    <input
                      type="text"
                      value={newProdBrand}
                      onChange={(e) => setNewProdBrand(e.target.value)}
                      placeholder="उदा. Samsung, LG, Godrej, श्री साई"
                      className={`w-full px-3 py-2 rounded-xl border text-xs outline-none focus:ring-1 focus:ring-teal-500 ${
                        isDayMode ? 'bg-slate-50 border-slate-300' : 'bg-slate-950 border-slate-700'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">
                      कॅटेगरी (Category)
                    </label>
                    <select
                      value={newProdCategory}
                      onChange={(e) => setNewProdCategory(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${
                        isDayMode ? 'bg-slate-50 border-slate-300' : 'bg-slate-950 border-slate-700 text-white'
                      }`}
                    >
                      <option value="Electronics">Electronics (इलेक्ट्रॉनिक्स)</option>
                      <option value="Furniture">Furniture (फर्निचर)</option>
                      <option value="Diwan">Diwan & Bed (दिवाण / कॉट)</option>
                      <option value="Home Appliances">Home Appliances (फ्रिज/कूलर/AC)</option>
                      <option value="General">General (इतर)</option>
                    </select>
                  </div>
                </div>

                {/* Model & Serial */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">
                      मॉडेल नंबर (Model No.)
                    </label>
                    <input
                      type="text"
                      value={newProdModel}
                      onChange={(e) => setNewProdModel(e.target.value)}
                      placeholder="उदा. UA43CU7700"
                      className={`w-full px-3 py-2 rounded-xl border text-xs outline-none focus:ring-1 focus:ring-teal-500 ${
                        isDayMode ? 'bg-slate-50 border-slate-300' : 'bg-slate-950 border-slate-700'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">
                      सिरीयल नंबर (Serial No / IMEI)
                    </label>
                    <input
                      type="text"
                      value={newProdSerial}
                      onChange={(e) => setNewProdSerial(e.target.value)}
                      placeholder="उदा. 602NRZX294301 (ऐच्छिक)"
                      className={`w-full px-3 py-2 rounded-xl border text-xs font-mono outline-none focus:ring-1 focus:ring-teal-500 ${
                        isDayMode ? 'bg-slate-50 border-slate-300' : 'bg-slate-950 border-slate-700'
                      }`}
                    />
                  </div>
                </div>

                {/* Prices & Qty */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">
                      विक्री दर (Sale ₹) *
                    </label>
                    <input
                      type="number"
                      value={newProdSalePrice}
                      onChange={(e) => setNewProdSalePrice(e.target.value)}
                      placeholder="उदा. 32000"
                      className={`w-full px-3 py-2 rounded-xl border text-xs font-bold text-emerald-500 outline-none ${
                        isDayMode ? 'bg-slate-50 border-slate-300' : 'bg-slate-950 border-slate-700'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">
                      खरेदी दर (Cost ₹)
                    </label>
                    <input
                      type="number"
                      value={newProdCostPrice}
                      onChange={(e) => setNewProdCostPrice(e.target.value)}
                      placeholder="उदा. 26000"
                      className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${
                        isDayMode ? 'bg-slate-50 border-slate-300' : 'bg-slate-950 border-slate-700'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">
                      प्रारंभिक स्टॉक संख्या
                    </label>
                    <input
                      type="number"
                      value={newProdStockQty}
                      onChange={(e) => setNewProdStockQty(e.target.value)}
                      min="1"
                      className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${
                        isDayMode ? 'bg-slate-50 border-slate-300' : 'bg-slate-950 border-slate-700'
                      }`}
                    />
                  </div>
                </div>

                {/* Checkbox: Save to database */}
                <label className="flex items-center gap-2 p-3 rounded-xl border bg-teal-500/10 border-teal-500/20 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newProdSaveToStock}
                    onChange={(e) => setNewProdSaveToStock(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-[11px] text-slate-300 font-medium">
                    गोदामातील स्टॉकमध्ये (Inventory Database) कायमस्वरूपी सेव्ह करा
                  </span>
                </label>
              </div>

              <div className={`p-4 border-t flex items-center justify-end gap-2 ${
                isDayMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
              }`}>
                <button
                  type="button"
                  onClick={() => setIsAddProductOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold"
                >
                  रद्द करा
                </button>
                <button
                  type="button"
                  onClick={handleSaveNewProduct}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow"
                >
                  <Check className="w-4 h-4" />
                  <span>प्रॉडक्ट सेव्ह करा व बिलात वापरा</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2-Column Responsive Input Form matching Screenshot 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Row 1: Customer Name */}
          <div className="relative">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Customer Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Search by name or ID..."
                className={`w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs focus:outline-none focus:border-teal-500 transition border ${
                  isDayMode
                    ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                    : 'bg-slate-950 border-slate-700 text-white placeholder-slate-500'
                }`}
              />
            </div>

            {/* Customer suggestion list */}
            {customerSuggestions.length > 0 && (
              <div className={`absolute z-10 top-full left-0 right-0 mt-1 rounded-2xl shadow-xl max-h-48 overflow-y-auto border ${
                isDayMode
                  ? 'bg-white border-slate-200 divide-y divide-slate-100'
                  : 'bg-slate-900 border-slate-700 divide-y divide-slate-800'
              }`}>
                {customerSuggestions.slice(0, 5).map((c) => (
                  <div
                    key={c.id}
                    onClick={() => handleSelectCustomer(c)}
                    className={`p-2.5 cursor-pointer text-xs flex justify-between ${
                      isDayMode ? 'hover:bg-slate-50' : 'hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-white">{c.name}</span>
                      <span className="text-slate-400 ml-2">📍 {c.city || c.address}</span>
                    </div>
                    <span className={c.currentBalance > 0 ? 'text-amber-500 font-bold' : 'text-emerald-500 font-semibold'}>
                      {c.currentBalance > 0 ? `Due: ₹${c.currentBalance.toLocaleString('en-IN')}` : 'Cleared'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Row 1: Village / Location */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                गाव / परिसर (Village / Location)
              </label>
              <span className="text-[10px] text-slate-400">(बिलावर व पत्त्यासाठी)</span>
            </div>
            <input
              type="text"
              value={customerLocation}
              onChange={(e) => setCustomerLocation(e.target.value)}
              placeholder="उदा. Satoda, Wardha, Hinganghat, Sevagram"
              className={`w-full px-4 py-2.5 rounded-2xl text-xs focus:outline-none focus:border-teal-500 transition border ${
                isDayMode
                  ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                  : 'bg-slate-950 border-slate-700 text-white placeholder-slate-500'
              }`}
            />
          </div>

          {/* Row 2: Customer Phone / WhatsApp */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Customer Phone / WhatsApp
              </label>
              <span className="text-[10px] text-slate-400">(for invoice share)</span>
            </div>
            <input
              type="text"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="e.g. 9876543210"
              className={`w-full px-4 py-2.5 rounded-2xl text-xs focus:outline-none focus:border-teal-500 transition border ${
                isDayMode
                  ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                  : 'bg-slate-950 border-slate-700 text-white placeholder-slate-500'
              }`}
            />
          </div>

          {/* Customer Credit Status & Limit Warning Banner */}
          {matchedCustomer && (
            <div className={`p-3 rounded-2xl border transition-all ${
              isCreditLimitExceeded
                ? 'bg-rose-500/10 border-rose-500/40 text-rose-300'
                : currentCustBalance > 0
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            }`}>
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span className="flex items-center gap-1.5">
                  {isCreditLimitExceeded ? '⚠️ उधारी मर्यादा ओलांडली!' : '📋 ग्राहक उधारी स्थिती:'}
                </span>
                <span className="text-[11px] font-mono">
                  कमाल मर्यादा: ₹{customerCreditLimit.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] opacity-90">
                <span>सध्याची जुनी उधारी: <b>₹{currentCustBalance.toLocaleString('en-IN')}</b></span>
                {newBillRemaining > 0 && (
                  <span>नवीन बिलासह एकूण: <b className={isCreditLimitExceeded ? 'text-rose-400 font-black' : ''}>₹{projectedTotalDue.toLocaleString('en-IN')}</b></span>
                )}
              </div>

              {isCreditLimitExceeded && (
                <div className="mt-2 pt-2 border-t border-rose-500/20 flex items-center justify-between gap-2">
                  <label className="flex items-center gap-2 text-xs font-semibold text-rose-200 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={overrideCreditLimit}
                      onChange={(e) => setOverrideCreditLimit(e.target.checked)}
                      className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                    />
                    <span>मालकाच्या विशेष संमतीने विक्री करा (Override Limit)</span>
                  </label>
                  <span className="text-[10px] bg-rose-500 text-white px-2 py-0.5 rounded font-black">
                    Caution
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Multi-Product Bill Items Section (बिलातील वस्तू व प्रॉडक्ट्स) */}
          <div className="md:col-span-2 p-4 rounded-3xl border bg-slate-50/60 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-teal-500/20 text-teal-600 dark:text-teal-400">
                  <Boxes className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>बिलातील वस्तू व प्रॉडक्ट्स (Bill Items)</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-700 dark:text-teal-300">
                      {billItems.length} वस्तू
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    बिलामध्ये एकापेक्षा जास्त प्रॉडक्ट जोडा, स्टॉक निवडा किंवा सिरीयल नंबर टाका
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddItemRow}
                  className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ वस्तू जोडा (Add Item)</span>
                </button>
              </div>
            </div>

            {/* Bill Items List Table / Cards */}
            <div className="space-y-2.5">
              {billItems.map((item, index) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-2xl border transition-all relative ${
                    isDayMode
                      ? 'bg-white border-slate-200 shadow-sm'
                      : 'bg-slate-900/90 border-slate-800'
                  }`}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    {/* Item Number & Name */}
                    <div className="sm:col-span-4 relative">
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                          <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] flex items-center justify-center font-mono">
                            {index + 1}
                          </span>
                          <span>वस्तूचे नाव / प्रॉडक्ट *</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setActiveStockDropdownRowId(activeStockDropdownRowId === item.id ? null : item.id)}
                          className="text-[10px] text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-0.5 font-medium"
                        >
                          <Search className="w-2.5 h-2.5" />
                          <span>स्टॉक शोधा</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleUpdateItemRow(item.id, 'name', e.target.value)}
                        placeholder="उदा. LG Double Door Refrigerator 260L"
                        className={`w-full px-3 py-1.5 rounded-xl text-xs border outline-none focus:ring-1 focus:ring-teal-500 ${
                          isDayMode
                            ? 'bg-slate-50 border-slate-200 text-slate-900'
                            : 'bg-slate-950 border-slate-700 text-white'
                        }`}
                      />

                      {/* Row Specific Stock Quick Picker Dropdown */}
                      {activeStockDropdownRowId === item.id && (
                        <div className={`absolute z-30 top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-xl border shadow-2xl divide-y ${
                          isDayMode ? 'bg-white border-slate-200 divide-slate-100' : 'bg-slate-900 border-slate-700 divide-slate-800'
                        }`}>
                          <div className="p-2 text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-950 flex justify-between items-center">
                            <span>स्टॉकमधील उपलब्ध वस्तू:</span>
                            <button
                              type="button"
                              onClick={() => setActiveStockDropdownRowId(null)}
                              className="text-rose-400 hover:underline"
                            >
                              ✕ बंद
                            </button>
                          </div>
                          {storeData.stock.slice(0, 10).map((st) => (
                            <div
                              key={st.id}
                              onClick={() => handleSelectStockForItemRow(item.id, st)}
                              className="p-2 cursor-pointer text-xs hover:bg-teal-500/10 flex items-center justify-between"
                            >
                              <div>
                                <div className="font-bold text-slate-900 dark:text-white">{st.name}</div>
                                <div className="text-[10px] text-slate-400">{st.brand} {st.model ? `• ${st.model}` : ''}</div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-teal-600 dark:text-teal-400">₹{st.salePrice}</div>
                                <div className="text-[9px] text-slate-500">Stock: {st.stockQty}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Model & Brand */}
                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">
                        मॉडेल / ब्रँड (Model & Brand)
                      </label>
                      <input
                        type="text"
                        value={item.model}
                        onChange={(e) => handleUpdateItemRow(item.id, 'model', e.target.value)}
                        placeholder="उदा. GL-B191K0WX"
                        className={`w-full px-2.5 py-1.5 rounded-xl text-xs border outline-none ${
                          isDayMode
                            ? 'bg-slate-50 border-slate-200 text-slate-900'
                            : 'bg-slate-950 border-slate-700 text-white'
                        }`}
                      />
                    </div>

                    {/* Serial / IMEI */}
                    <div className="sm:col-span-2">
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[11px] font-medium text-slate-500">
                          सिरीयल / IMEI
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const prefix = item.brand ? item.brand.slice(0, 3).toUpperCase() : 'SSE';
                            const rand = Math.floor(100000 + Math.random() * 900000);
                            handleUpdateItemRow(item.id, 'serialNo', `${prefix}-${rand}`);
                          }}
                          className="text-[9px] text-teal-500 hover:underline font-mono"
                          title="ऑटो जनरेट सिरीयल"
                        >
                          Auto
                        </button>
                      </div>
                      <input
                        type="text"
                        value={item.serialNo}
                        onChange={(e) => handleUpdateItemRow(item.id, 'serialNo', e.target.value)}
                        placeholder="602NRZX..."
                        className={`w-full px-2 py-1.5 rounded-xl text-xs font-mono border outline-none ${
                          isDayMode
                            ? 'bg-slate-50 border-slate-200 text-slate-900'
                            : 'bg-slate-950 border-slate-700 text-white'
                        }`}
                      />
                    </div>

                    {/* Qty */}
                    <div className="sm:col-span-1">
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">
                        नग (Qty)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) => handleUpdateItemRow(item.id, 'qty', Math.max(1, parseInt(e.target.value) || 1))}
                        className={`w-full px-2 py-1.5 rounded-xl text-xs text-center font-bold border outline-none ${
                          isDayMode
                            ? 'bg-slate-50 border-slate-200 text-slate-900'
                            : 'bg-slate-950 border-slate-700 text-white'
                        }`}
                      />
                    </div>

                    {/* Rate (₹) */}
                    <div className="sm:col-span-1">
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">
                        दर (Rate ₹)
                      </label>
                      <input
                        type="number"
                        value={item.rate || ''}
                        onChange={(e) => handleUpdateItemRow(item.id, 'rate', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className={`w-full px-2 py-1.5 rounded-xl text-xs font-bold text-right border outline-none ${
                          isDayMode
                            ? 'bg-slate-50 border-slate-200 text-slate-900'
                            : 'bg-slate-950 border-slate-700 text-white'
                        }`}
                      />
                    </div>

                    {/* Total & Action */}
                    <div className="sm:col-span-1 flex items-center justify-between sm:justify-end gap-2 pt-1 sm:pt-4">
                      <div className="text-right">
                        <div className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                          ₹{(item.total || item.qty * item.rate).toLocaleString('en-IN')}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(item.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                        title="वस्तू काढा"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bill Subtotal Footer Bar */}
            <div className="pt-2 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                एकूण {billItems.filter(it => it.name.trim() || it.rate > 0).length || billItems.length} वस्तूंची बेरीज
              </span>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700 dark:text-slate-300">एकूण बिलाची रक्कम (Grand Total):</span>
                <span className="text-base font-extrabold text-teal-600 dark:text-teal-400">
                  ₹{(parseFloat(totalAmount) || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* BUILT-IN FINANCE & EMI SYSTEM (फायनान्स व ईएमआय प्रणाली) */}
          <div className="md:col-span-2 p-4 sm:p-5 rounded-3xl border bg-gradient-to-br from-indigo-500/5 via-sky-500/5 to-teal-500/5 border-sky-500/30 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-2xl ${isFinance ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>फायनान्स / EMI वर विक्री (Finance / EMI Scheme Sale)</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition ${
                      isFinance
                        ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                    }`}>
                      {isFinance ? '✓ फायनान्स सक्रिय (Active)' : 'बंद (Off)'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    बजाज फायनान्स, TVS क्रेडिट, HDB, श्रीराम किंवा शोरूम स्वतःच्या हप्त्याने सोपी बिलिंग
                  </p>
                </div>
              </div>

              {/* Finance Toggle Button */}
              <button
                type="button"
                onClick={() => {
                  const nextFin = !isFinance;
                  setIsFinance(nextFin);
                  if (nextFin) {
                    setPaymentMode('Bajaj Finance');
                    if (!financeDownPayment && totalAmount) {
                      // Default 20% down payment
                      const defaultDown = Math.round((parseFloat(totalAmount) || 0) * 0.2);
                      setFinanceDownPayment(defaultDown.toString());
                      setPayingNow(defaultDown.toString());
                    }
                  } else {
                    setPaymentMode('Cash');
                    setPayingNow(totalAmount);
                  }
                }}
                className={`px-4 py-2 rounded-2xl font-bold text-xs transition cursor-pointer flex items-center gap-2 shadow-sm ${
                  isFinance
                    ? 'bg-gradient-to-r from-indigo-600 to-sky-600 text-white shadow-indigo-600/25 active:scale-95'
                    : isDayMode
                    ? 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                    : 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>{isFinance ? '✓ फायनान्स चालू आहे' : '+ फायनान्स लागू करा'}</span>
              </button>
            </div>

            {/* Expanded Finance Form Controls */}
            {isFinance && (
              <div className="pt-3 border-t border-sky-500/20 space-y-4 animate-in fade-in duration-200">
                {/* 1. Finance Provider Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    फायनान्स कंपनी / बँक निवडा (Select Finance Provider):
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                    {[
                      { name: 'बजाज फायनान्स (Bajaj Finserv)', short: '⚡ बजाज (Bajaj)' },
                      { name: 'TVS क्रेडिट (TVS Credit)', short: '🏍️ TVS क्रेडिट' },
                      { name: 'HDB फायनान्शियल (HDB Financial)', short: '🏛️ HDB फायनान्स' },
                      { name: 'श्रीराम फायनान्स (Shriram Finance)', short: '💼 श्रीराम फायनान्स' },
                      { name: 'आयडीएफसी फर्स्ट बँक (IDFC First)', short: '🏦 IDFC बँक' },
                      { name: 'शोरूम स्वतः फायनान्स (In-House EMI)', short: '🤝 शोरूम हप्ते' },
                    ].map((p) => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => {
                          setFinanceProvider(p.name);
                          if (p.name.includes('बजाज')) setPaymentMode('Bajaj Finance');
                          else setPaymentMode('EMI');
                        }}
                        className={`p-2 rounded-xl text-xs font-bold text-center transition cursor-pointer border ${
                          financeProvider === p.name
                            ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm ring-2 ring-indigo-400/30'
                            : isDayMode
                            ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {p.short}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Finance Split Details (Down Payment, Loan Amount, DO Number, Monthly EMI) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Total Bill Amount Display */}
                  <div className={`p-3 rounded-2xl border ${isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                    <span className="text-[11px] font-semibold text-slate-400 block">१. एकूण बिल रक्कम (Total)</span>
                    <span className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5 block">
                      ₹{(parseFloat(totalAmount) || 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Down Payment Input */}
                  <div className={`p-3 rounded-2xl border ${isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                    <label className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 block mb-1">
                      २. डाऊन पेमेंट (रोख/UPI जमा) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                      <input
                        type="number"
                        value={financeDownPayment}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFinanceDownPayment(val);
                          setPayingNow(val);
                        }}
                        placeholder="उदा. 5000"
                        className={`w-full pl-6 pr-2 py-1.5 rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-400 border outline-none focus:ring-1 focus:ring-emerald-500 ${
                          isDayMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-700'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Loan Amount Auto-Calculated */}
                  <div className={`p-3 rounded-2xl border ${isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                    <span className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 block">३. फायनान्स लोन रक्कम</span>
                    <span className="text-base font-black text-sky-600 dark:text-sky-400 mt-0.5 block">
                      ₹{Math.max(0, (parseFloat(totalAmount) || 0) - (parseFloat(financeDownPayment) || 0)).toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-slate-400">(कंपनीकडून मंजूर)</span>
                  </div>

                  {/* DO Number / File Reference Number */}
                  <div className={`p-3 rounded-2xl border ${isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      ४. DO / फाईल नंबर (DO No.)
                    </label>
                    <input
                      type="text"
                      value={financeFileNo}
                      onChange={(e) => setFinanceFileNo(e.target.value)}
                      placeholder="उदा. BF-7829104"
                      className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold border outline-none focus:ring-1 focus:ring-sky-500 ${
                        isDayMode ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
                      }`}
                    />
                  </div>
                </div>

                {/* 3. EMI Tenure & Monthly EMI Calculator */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      EMI कालावधी / महिने (Tenure Months):
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {[3, 6, 8, 9, 10, 12, 18, 24, 36].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setFinanceTenureMonths(m)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                            financeTenureMonths === m
                              ? 'bg-sky-600 text-white shadow-sm'
                              : isDayMode
                              ? 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                              : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          {m} महिने
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Calculated Monthly EMI Badge */}
                  <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-semibold text-indigo-400">अंदाजे दरमहा हप्ता (Monthly EMI)</div>
                      <div className="text-lg font-black text-indigo-700 dark:text-indigo-300">
                        ₹{financeTenureMonths > 0
                          ? Math.round(Math.max(0, (parseFloat(totalAmount) || 0) - (parseFloat(financeDownPayment) || 0)) / financeTenureMonths).toLocaleString('en-IN')
                          : 0}
                        <span className="text-xs font-normal text-slate-400"> / महिना ({financeTenureMonths} महिने)</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-lg">
                        0% Scheme
                      </span>
                    </div>
                  </div>
                </div>

                {/* Live Finance Summary Card */}
                <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-sky-900 dark:text-sky-300">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-sky-500 shrink-0" />
                    <span>
                      <b>{financeProvider}</b> अंतर्गत फायनान्स: ग्राहकाचे तात्काळ डाऊन पेमेंट <b>₹{(parseFloat(financeDownPayment) || 0).toLocaleString('en-IN')}</b> जमा होईल, आणि उर्वरित <b>₹{Math.max(0, (parseFloat(totalAmount) || 0) - (parseFloat(financeDownPayment) || 0)).toLocaleString('en-IN')}</b> फायनान्स फाईल #{financeFileNo || 'Pending'} द्वारे नोंदवले जाईल.
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Row 2: Total Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Total Amount (₹) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                ₹
              </span>
              <input
                type="number"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                placeholder="0.00"
                className={`w-full pl-8 pr-4 py-2.5 rounded-2xl text-sm font-bold focus:outline-none focus:border-teal-500 transition border ${
                  isDayMode
                    ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                    : 'bg-slate-950 border-slate-700 text-white placeholder-slate-500'
                }`}
                required
              />
            </div>
          </div>

          {/* Row 3: Paying Now */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {isFinance ? 'Down Payment (डाऊन पेमेंट रोख जमा)' : 'Paying Now (रोख / तात्काळ जमा)'}
              </label>
              <span className="text-[10px] text-emerald-500 font-semibold">
                (पावती आपोआप तयार होईल)
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                ₹
              </span>
              <input
                type="number"
                value={payingNow}
                onChange={(e) => {
                  setPayingNow(e.target.value);
                  if (isFinance) setFinanceDownPayment(e.target.value);
                }}
                placeholder="0.00"
                className={`w-full pl-8 pr-4 py-2.5 rounded-2xl text-sm font-bold focus:outline-none focus:border-teal-500 transition border ${
                  isDayMode
                    ? 'bg-slate-50 border-slate-200 text-emerald-700 placeholder-slate-400'
                    : 'bg-slate-950 border-slate-700 text-emerald-400 placeholder-slate-500'
                }`}
              />
            </div>
            {totalAmount && (
              <div className="mt-1 text-[11px] flex justify-between">
                <span className="text-slate-400">{isFinance ? 'Loan Amount (लोन शिल्लक):' : 'Remaining Balance (बाकी):'}</span>
                <span className="font-semibold text-amber-500">
                  ₹{Math.max(0, (parseFloat(totalAmount) || 0) - (parseFloat(payingNow) || 0)).toLocaleString('en-IN')}
                </span>
              </div>
            )}
          </div>

          {/* Row 5: Link Bill to Card Scheme Member */}
          <div className="md:col-span-2 p-3.5 rounded-2xl border bg-amber-500/5 border-amber-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold text-slate-900 dark:text-amber-300">
                  कार्ड योजना लिंक करा (Link Bill to Card Scheme Member)
                </span>
                <span className="text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full font-medium">
                  30-Month Scheme
                </span>
              </div>
              {linkedCardNo && (
                <button
                  type="button"
                  onClick={handleClearCardLink}
                  className="text-[10px] text-rose-500 hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                >
                  <X className="w-3 h-3" />
                  <span>लिंक काढा (Unlink)</span>
                </button>
              )}
            </div>

            <div className="relative">
              {linkedCardMember ? (
                <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                  isDayMode ? 'bg-white border-amber-300' : 'bg-slate-900 border-amber-500/40'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold text-xs">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{linkedCardMember.memberName}</span>
                        <span className="font-mono bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded text-[10px] font-bold">
                          {linkedCardMember.cardNo}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        गाव: {linkedCardMember.village || linkedCardMember.address || 'N/A'} • फोन: {linkedCardMember.phone} • भरलेले महिने: {linkedCardMember.totalPaidMonths}/30
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      ✓ लिंक सक्रिय
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="कार्ड नंबर किंवा सभासदाचे नाव/फोन शोधा (उदा. SSE-CD-0101 किंवा Suresh)..."
                        value={cardSearchQuery}
                        onChange={(e) => {
                          setCardSearchQuery(e.target.value);
                          setShowCardSelector(true);
                        }}
                        onFocus={() => setShowCardSelector(true)}
                        className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs focus:outline-none focus:border-amber-500 border ${
                          isDayMode
                            ? 'bg-white border-slate-200 text-slate-800'
                            : 'bg-slate-900 border-slate-700 text-white'
                        }`}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowCardSelector(!showCardSelector)}
                      className="px-3 py-2 rounded-xl text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Link className="w-3.5 h-3.5" />
                      <span>{showCardSelector ? 'बंद करा' : 'कार्ड निवडा'}</span>
                    </button>
                  </div>

                  {/* Dropdown list of card scheme members */}
                  {showCardSelector && (
                    <div className={`absolute z-30 left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-xl border shadow-xl divide-y ${
                      isDayMode
                        ? 'bg-white border-slate-200 divide-slate-100'
                        : 'bg-slate-900 border-slate-700 divide-slate-800'
                    }`}>
                      {storeData.cardMembers
                        .filter((m) => {
                          if (!cardSearchQuery.trim()) return true;
                          const q = cardSearchQuery.toLowerCase();
                          return (
                            m.cardNo.toLowerCase().includes(q) ||
                            m.memberName.toLowerCase().includes(q) ||
                            m.phone.includes(q) ||
                            (m.village && m.village.toLowerCase().includes(q))
                          );
                        })
                        .slice(0, 15)
                        .map((member) => (
                          <div
                            key={member.id}
                            onClick={() => handleSelectCardMember(member)}
                            className={`p-2.5 cursor-pointer text-xs flex items-center justify-between transition ${
                              isDayMode ? 'hover:bg-amber-50' : 'hover:bg-slate-800'
                            }`}
                          >
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <span className="font-mono text-amber-500 font-extrabold">{member.cardNo}</span>
                                <span>-</span>
                                <span>{member.memberName}</span>
                              </div>
                              <div className="text-[10px] text-slate-400">
                                📍 {member.village || member.address} • Ph: {member.phone}
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-300 font-bold">
                                {member.totalPaidMonths}/30 Months Paid
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Payment Mode & Delivery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Payment Mode (पैसे भरण्याची पद्धत)
            </label>
            <div className="grid grid-cols-5 gap-2">
              {(['Cash', 'UPI', 'Card', 'Bajaj Finance', 'Cheque'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPaymentMode(mode)}
                  className={`py-2 px-1 text-center rounded-xl text-xs font-semibold transition cursor-pointer border ${
                    paymentMode === mode
                      ? 'bg-teal-600 text-white border-teal-500 shadow-sm'
                      : isDayMode
                      ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Delivery Status (डिलिव्हरी स्थिती)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Delivered', 'Pending Delivery', 'Dispatched'] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setDeliveryStatus(status)}
                  className={`py-2 px-2 text-center rounded-xl text-xs font-semibold transition cursor-pointer border ${
                    deliveryStatus === status
                      ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                      : isDayMode
                      ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {status === 'Delivered'
                    ? 'डिलिव्हरी झाली'
                    : status === 'Pending Delivery'
                    ? 'डिलिव्हरी बाकी'
                    : 'रवाना केले (Dispatched)'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Remarks / Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            शेरा / टीप (Remarks / Warranty notes)
          </label>
          <input
            type="text"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="उदा. 1 Year Comprehensive + 4 Years Compressor Warranty by Service Center"
            className={`w-full px-4 py-2.5 rounded-2xl text-xs focus:outline-none focus:border-teal-500 transition border ${
              isDayMode
                ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                : 'bg-slate-950 border-slate-700 text-white placeholder-slate-500'
            }`}
          />
        </div>

        {/* Form Action Buttons matching Screenshot 2 */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={handleResetForm}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-semibold transition cursor-pointer border ${
              isDayMode
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset (फॉर्म साफ करा)</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleSave(false)}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-bold transition cursor-pointer shadow-md shadow-emerald-600/25 active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save Entry (नोंद सेव्ह करा)</span>
            </button>

            <button
              type="button"
              onClick={() => handleSave(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl text-xs font-extrabold transition cursor-pointer shadow-md shadow-amber-500/25 active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Save & Print (सेव्ह व प्रिंट)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
