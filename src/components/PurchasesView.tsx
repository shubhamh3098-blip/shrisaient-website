import React, { useState } from 'react';
import { 
  ShoppingCart, 
  Plus, 
  Calendar, 
  Building2, 
  ExternalLink, 
  Printer, 
  Share2, 
  Eye, 
  FileText, 
  Tag, 
  Trash2, 
  Sparkles,
  Info,
  CheckCircle2,
  Barcode,
  Camera
} from 'lucide-react';
import { PurchaseEntry, Dealer, BusinessSettings, PurchaseItemDetail } from '../types';
import { PurchaseInvoiceModal } from './PurchaseInvoiceModal';
import { ScanPurchaseInvoiceModal } from './ScanPurchaseInvoiceModal';

interface PurchasesViewProps {
  purchases: PurchaseEntry[];
  dealers?: Dealer[];
  settings: BusinessSettings;
  onAddPurchase: (purchase: Omit<PurchaseEntry, 'id'>) => void;
  onNavigateDealerLedger?: (dealerName?: string) => void;
}

interface NewItemFormRow {
  description: string;
  hsn: string;
  qty: number;
  rate: number;
  discount: number;
  taxRate: number;
  serialNumbersStr: string;
}

export const PurchasesView: React.FC<PurchasesViewProps> = ({
  purchases,
  dealers = [],
  settings,
  onAddPurchase,
  onNavigateDealerLedger,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [selectedPurchaseForInvoice, setSelectedPurchaseForInvoice] = useState<PurchaseEntry | null>(null);

  // Form State
  const [supplierName, setSupplierName] = useState('');
  const [supplierAddress, setSupplierAddress] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [supplierGstin, setSupplierGstin] = useState('');
  const [supplierState, setSupplierState] = useState('MAHARASHTRA');

  const [buyerName, setBuyerName] = useState(`${settings.businessName}-LG-WARDHA[NEW]`);
  const [buyerGstin, setBuyerGstin] = useState(settings.gstin || '27ALOPL0030G2ZC');
  const [buyerAddress, setBuyerAddress] = useState('WARD NO 1, NEAR DATEY SABHAGRUH, Arvi Road, WARDHA 442001 MAHARASHTRA');

  const [billNo, setBillNo] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [poNo, setPoNo] = useState('');
  const [poDate, setPoDate] = useState(new Date().toISOString().split('T')[0]);
  const [location, setLocation] = useState('LG DISTRIBUTION');
  const [salesConsultant, setSalesConsultant] = useState('');
  const [approvedBy, setApprovedBy] = useState('');
  const [transporter, setTransporter] = useState('GENERAL TRANSPORT');
  const [vehicleNo, setVehicleNo] = useState('');

  // Line items state
  const [itemsRows, setItemsRows] = useState<NewItemFormRow[]>([
    {
      description: 'LG GLT2216WYRI',
      hsn: '84182100',
      qty: 2,
      rate: 21592,
      discount: 0,
      taxRate: 18,
      serialNumbersStr: '602NRZX294301, 602NRQV293652',
    },
  ]);

  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'Online' | 'Cheque'>('Online');
  const [autoUpdateStock, setAutoUpdateStock] = useState<boolean>(true);
  const [notes, setNotes] = useState('');

  // Supplier Bank info
  const [bankAccountName, setBankAccountName] = useState('MANISHA ENTERPRISE');
  const [bankAccountNo, setBankAccountNo] = useState('108051000302');
  const [bankIfsc, setBankIfsc] = useState('ICIC0001080');
  const [bankBranch, setBankBranch] = useState('SHIVAJI CHOWK, ARVI ROAD, WARDHA');

  // Compute calculated line item values
  const computedItems: PurchaseItemDetail[] = itemsRows.map((row, idx) => {
    const rawTotal = (row.qty || 0) * (row.rate || 0);
    const taxable = Math.max(0, rawTotal - (row.discount || 0));
    const taxRate = row.taxRate || 18;
    const cgstRate = taxRate / 2;
    const sgstRate = taxRate / 2;
    const cgstAmt = Math.round(((taxable * cgstRate) / 100) * 100) / 100;
    const sgstAmt = Math.round(((taxable * sgstRate) / 100) * 100) / 100;
    const totalTax = cgstAmt + sgstAmt;
    const lineTotal = Math.round(taxable + totalTax);

    const serials = row.serialNumbersStr
      ? row.serialNumbersStr.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean)
      : [];

    return {
      id: `item-${idx}-${Date.now()}`,
      description: row.description || 'Appliance / Item',
      hsn: row.hsn || '84182100',
      qty: row.qty || 1,
      rate: row.rate || 0,
      discount: row.discount || 0,
      taxableAmount: taxable,
      taxRate,
      cgstRate,
      cgstAmount: cgstAmt,
      sgstRate,
      sgstAmount: sgstAmt,
      taxAmount: totalTax,
      totalAmount: lineTotal,
      serialNumbers: serials,
    };
  });

  const calculatedSubtotal = computedItems.reduce((acc, i) => acc + i.taxableAmount, 0);
  const calculatedCgst = computedItems.reduce((acc, i) => acc + i.cgstAmount, 0);
  const calculatedSgst = computedItems.reduce((acc, i) => acc + i.sgstAmount, 0);
  const calculatedTotalTax = calculatedCgst + calculatedSgst;
  const calculatedGrandTotal = computedItems.reduce((acc, i) => acc + i.totalAmount, 0);

  // Fill sample data like Manisha Enterprises (LG Distributor)
  const handleFillManishaExample = () => {
    setSupplierName('MANISHA ENTERPRISES');
    setSupplierAddress('INGOLE CHOWK MAIN ROAD WARDHA 442001 MAHARASHTRA INDIA');
    setSupplierPhone('9766911693');
    setSupplierGstin('27ABDPB8956C1ZS');
    setSupplierState('MAHARASHTRA');

    setBuyerName('SHRI SAI ENTERPRISES-LG-WARDHA[NEW]');
    setBuyerGstin('27ALOPL0030G2ZC');
    setBuyerAddress('WARD NO 1, NEAR DATEY SABHAGRUH, Arvi Road, WARDHA 442001 MAHARASHTRA');

    setBillNo('CS/2526/01604');
    setDate('2026-02-25');
    setPoNo('CSSO2526-00579');
    setPoDate('2026-02-23');
    setLocation('LG DISTRIBUTION');
    setSalesConsultant('DHIRAJ BHOWARE');
    setApprovedBy('ARTI INGOLE');
    setTransporter('GENERAL TRANSPORT');
    setVehicleNo('');

    setItemsRows([
      {
        description: 'LG GLT2216WYRI',
        hsn: '84182100',
        qty: 2,
        rate: 21592,
        discount: 0,
        taxRate: 18,
        serialNumbersStr: '602NRZX294301, 602NRQV293652',
      },
    ]);

    setPaidAmount(0);
    setPaymentMode('Online');
    setNotes('LG Refrigerator Procurement (BP LESS 500 EXTRA)');
    setBankAccountName('MANISHA ENTERPRISE');
    setBankAccountNo('108051000302');
    setBankIfsc('ICIC0001080');
    setBankBranch('SHIVAJI CHOWK, ARVI ROAD, WARDHA');
  };

  const handleAddItemRow = () => {
    setItemsRows([
      ...itemsRows,
      {
        description: '',
        hsn: '84182100',
        qty: 1,
        rate: 0,
        discount: 0,
        taxRate: 18,
        serialNumbersStr: '',
      },
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (itemsRows.length <= 1) return;
    setItemsRows(itemsRows.filter((_, i) => i !== index));
  };

  const handleUpdateItemRow = (index: number, field: keyof NewItemFormRow, value: any) => {
    const updated = [...itemsRows];
    updated[index] = { ...updated[index], [field]: value };
    setItemsRows(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim() || calculatedGrandTotal <= 0) return;

    const summaryText = computedItems
      .map((i) => `${i.description} (${i.qty} Pcs)`)
      .join(', ');

    const status: 'Paid' | 'Partial' | 'Pending' =
      paidAmount >= calculatedGrandTotal
        ? 'Paid'
        : paidAmount > 0
        ? 'Partial'
        : 'Pending';

    const newPurchaseData: Omit<PurchaseEntry, 'id'> = {
      billNo: billNo.trim() || `CS/2526/${Date.now().toString().slice(-5)}`,
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
      location,
      salesConsultant: salesConsultant.trim(),
      approvedBy: approvedBy.trim(),
      transporter: transporter.trim(),
      vehicleNo: vehicleNo.trim(),
      items: summaryText || 'Electronics / Goods',
      itemsDetail: computedItems,
      subtotal: calculatedSubtotal,
      cgstAmount: calculatedCgst,
      sgstAmount: calculatedSgst,
      totalTax: calculatedTotalTax,
      totalAmount: calculatedGrandTotal,
      paidAmount,
      status,
      paymentMode,
      supplierBank: {
        accountName: bankAccountName,
        accountNo: bankAccountNo,
        ifscCode: bankIfsc,
        bankName: 'ICICI BANK',
        branch: bankBranch,
      },
      notes,
      autoUpdateStock,
    };

    onAddPurchase(newPurchaseData);

    // Reset & close
    setShowAddModal(false);
  };

  const totalPurchases = purchases.reduce((acc, p) => acc + p.totalAmount, 0);
  const totalPaid = purchases.reduce((acc, p) => acc + p.paidAmount, 0);
  const totalDueToSuppliers = Math.max(0, totalPurchases - totalPaid);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <ShoppingCart className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            Purchases & Supplier Invoices (खरेदी व पुरवठादार बीजक)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Official Purchase Tax Invoices with HSN, CGST/SGST, Serial Numbers & Dealer Ledger Sync.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onNavigateDealerLedger && (
            <button
              onClick={() => onNavigateDealerLedger()}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700"
            >
              <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Dealer Khata (डीलर लेजर)
            </button>
          )}

          <button
            onClick={() => setShowScanModal(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5 cursor-pointer active:scale-95 animate-pulse"
          >
            <Camera className="w-4 h-4 text-yellow-300" />
            <span>📷 खरेदी बिल स्कॅन करा (AI Scan Bill)</span>
          </button>

          <button
            onClick={() => {
              handleFillManishaExample();
              setShowAddModal(true);
            }}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            + Manual Entry (मॅन्युअल नोंद)
          </button>
        </div>
      </div>

      {/* Model & Invoice Format Highlight Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-2xl p-4 sm:p-5 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200 text-[10px] font-bold border border-blue-400/30 uppercase tracking-wide">
              Official Purchase Invoice Format
            </span>
            <span className="text-xs text-blue-200">
              Manisha Enterprises (LG Distribution)
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-bold">
            डिस्ट्रीब्युटर खरेदी बिल मॉडेल व सिरियल नंबर ट्रॅकिंग
          </h2>
          <p className="text-xs text-blue-100/80 max-w-2xl">
            खरेदी केलेल्या प्रत्येक उपकरणाचे मॉडेल (उदा. LG GLT2216WYRI), HSN कोड (84182100), युनिट दर (₹21,592), ९%+९% CGST/SGST आणि सिरियल नंबर (उदा. 602NRZX294301, 602NRQV293652) आपोआप स्टॉकमध्ये नोंदवले जातात.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {purchases.length > 0 && (
            <button
              onClick={() => setSelectedPurchaseForInvoice(purchases[0])}
              className="px-4 py-2 rounded-xl bg-white text-blue-950 font-bold text-xs hover:bg-blue-50 shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Eye className="w-4 h-4 text-blue-600" />
              <span>पहिले बीजक पहा (View Tax Invoice)</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#0F172A] rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Purchases (एकूण खरेदी)</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">₹{totalPurchases.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white dark:bg-[#0F172A] rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Paid to Suppliers (जमा रक्कम)</p>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">₹{totalPaid.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white dark:bg-[#0F172A] rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Supplier Dues (देय बाकी)</p>
          <p className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">₹{totalDueToSuppliers.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Purchases Table */}
      <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Invoice No / Date</th>
                <th className="py-3 px-4">Distributor / Supplier</th>
                <th className="py-3 px-4">Items & Serial Numbers</th>
                <th className="py-3 px-4 text-right">Taxable (₹)</th>
                <th className="py-3 px-4 text-right">Total Bill (₹)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {purchases.map((p) => {
                const serials = p.itemsDetail?.flatMap((i) => i.serialNumbers || []) || [];
                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    
                    {/* Invoice No & Date */}
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900 dark:text-white font-mono text-sm">{p.billNo}</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        {p.date}
                      </p>
                      {p.poNo && (
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                          PO: {p.poNo}
                        </p>
                      )}
                    </td>

                    {/* Supplier */}
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 dark:text-white block">{p.supplierName}</span>
                      {p.supplierGstin && (
                        <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 block">
                          GST: {p.supplierGstin}
                        </span>
                      )}
                      {p.location && (
                        <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-[10px] font-bold">
                          {p.location}
                        </span>
                      )}
                    </td>

                    {/* Items & Serial numbers */}
                    <td className="py-3.5 px-4 max-w-sm">
                      <p className="font-medium text-slate-800 dark:text-slate-200">{p.items}</p>
                      {serials.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {serials.map((s, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[9px] font-bold flex items-center gap-1"
                            >
                              <Barcode className="w-2.5 h-2.5 text-blue-600" />
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Taxable */}
                    <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-700 dark:text-slate-300">
                      ₹{(p.subtotal || p.totalAmount).toLocaleString('en-IN')}
                      {p.cgstAmount ? (
                        <span className="block text-[10px] text-slate-400">
                          +₹{((p.cgstAmount || 0) + (p.sgstAmount || 0)).toLocaleString('en-IN')} Tax
                        </span>
                      ) : null}
                    </td>

                    {/* Total Bill */}
                    <td className="py-3.5 px-4 text-right">
                      <p className="font-bold text-slate-900 dark:text-white font-mono text-sm">
                        ₹{p.totalAmount.toLocaleString('en-IN')}
                      </p>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                        Paid: ₹{p.paidAmount.toLocaleString('en-IN')}
                      </p>
                      {p.totalAmount - p.paidAmount > 0 && (
                        <p className="text-[10px] text-rose-600 dark:text-rose-400 font-bold">
                          Due: ₹{(p.totalAmount - p.paidAmount).toLocaleString('en-IN')}
                        </p>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.status === 'Paid'
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                            : p.status === 'Partial'
                            ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                            : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>

                    {/* Action buttons */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedPurchaseForInvoice(p)}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 font-semibold text-[11px] transition flex items-center gap-1 cursor-pointer border border-blue-200 dark:border-blue-800"
                          title="View & Print Official Tax Invoice"
                        >
                          <Printer className="w-3 h-3" />
                          <span>बीजक प्रिंट</span>
                        </button>

                        {onNavigateDealerLedger && (
                          <button
                            type="button"
                            onClick={() => onNavigateDealerLedger(p.supplierName)}
                            className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-600 dark:text-slate-300 transition cursor-pointer border border-slate-200 dark:border-slate-700"
                            title={`Open ${p.supplierName} ledger`}
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

      {/* Add Purchase Bill Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#0F172A] rounded-2xl max-w-4xl w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800 my-auto text-slate-900 dark:text-white max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base sm:text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  खरेदी बीजक नोंद (Record Purchase Tax Invoice)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Enter supplier tax invoice details, item models, HSN, serial numbers, and taxes.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Quick Fill & AI Camera Scan Option */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-2.5 rounded-xl text-xs">
                <span className="text-emerald-900 dark:text-emerald-200 font-bold flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-emerald-600" />
                  बिलाचा थेट फोटो काढून भरायचे?
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowScanModal(true);
                  }}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs cursor-pointer active:scale-95 flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-yellow-300" />
                  AI स्कॅन करा
                </button>
              </div>

              <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 p-2.5 rounded-xl text-xs">
                <span className="text-blue-900 dark:text-blue-200 font-medium truncate">
                  ⚡ मनिषा एंटरप्रायझेस (LG) बिल भरा:
                </span>
                <button
                  type="button"
                  onClick={handleFillManishaExample}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs cursor-pointer active:scale-95 shrink-0"
                >
                  ऑटो-भरा
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* 1. Supplier / Distributor Details */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  १. पुरवठादार / डिस्ट्रीब्युटर तपशील (Supplier Info)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">पुरवठादार नाव *</label>
                    <input
                      type="text"
                      required
                      value={supplierName}
                      onChange={(e) => setSupplierName(e.target.value)}
                      placeholder="e.g. MANISHA ENTERPRISES"
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1">GSTIN/UIN</label>
                    <input
                      type="text"
                      value={supplierGstin}
                      onChange={(e) => setSupplierGstin(e.target.value)}
                      placeholder="e.g. 27ABDPB8956C1ZS"
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1">फोन नंबर</label>
                    <input
                      type="text"
                      value={supplierPhone}
                      onChange={(e) => setSupplierPhone(e.target.value)}
                      placeholder="e.g. 9766911693"
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">पत्ता (Registered Address)</label>
                  <input
                    type="text"
                    value={supplierAddress}
                    onChange={(e) => setSupplierAddress(e.target.value)}
                    placeholder="e.g. INGOLE CHOWK MAIN ROAD WARDHA 442001 MAHARASHTRA"
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* 2. Invoice & Order Details */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-blue-600" />
                  २. बीजक व ऑर्डर तपशील (Tax Invoice & PO Info)
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Tax Invoice No *</label>
                    <input
                      type="text"
                      required
                      value={billNo}
                      onChange={(e) => setBillNo(e.target.value)}
                      placeholder="e.g. CS/2526/01604"
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1">Invoice Date *</label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1">PO No</label>
                    <input
                      type="text"
                      value={poNo}
                      onChange={(e) => setPoNo(e.target.value)}
                      placeholder="e.g. CSSO2526-00579"
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1">Location / Brand</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. LG DISTRIBUTION"
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Sales Consultant</label>
                    <input
                      type="text"
                      value={salesConsultant}
                      onChange={(e) => setSalesConsultant(e.target.value)}
                      placeholder="e.g. DHIRAJ BHOWARE"
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1">Approved By</label>
                    <input
                      type="text"
                      value={approvedBy}
                      onChange={(e) => setApprovedBy(e.target.value)}
                      placeholder="e.g. ARTI INGOLE"
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1">Transporter</label>
                    <input
                      type="text"
                      value={transporter}
                      onChange={(e) => setTransporter(e.target.value)}
                      placeholder="e.g. GENERAL TRANSPORT"
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Items Table with Serial Numbers */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Barcode className="w-3.5 h-3.5 text-blue-600" />
                    ३. वस्तूंचे मॉडेल, HSN व सिरियल नंबर (Line Items & Barcodes)
                  </h4>

                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    + आणखी वस्तू जोडा (Add Item)
                  </button>
                </div>

                <div className="space-y-3">
                  {itemsRows.map((row, idx) => {
                    const rowRaw = (row.qty || 0) * (row.rate || 0) - (row.discount || 0);
                    const rowTax = (rowRaw * (row.taxRate || 18)) / 100;
                    const rowTotal = Math.round(rowRaw + rowTax);

                    return (
                      <div
                        key={idx}
                        className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                            आयटम #{idx + 1}
                          </span>

                          {itemsRows.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItemRow(idx)}
                              className="text-rose-500 hover:text-rose-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              हटवा
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-6 gap-2">
                          <div className="sm:col-span-2">
                            <label className="block text-[11px] font-semibold mb-0.5">मॉडेल / Description *</label>
                            <input
                              type="text"
                              required
                              value={row.description}
                              onChange={(e) => handleUpdateItemRow(idx, 'description', e.target.value)}
                              placeholder="e.g. LG GLT2216WYRI"
                              className="w-full px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs font-bold"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold mb-0.5">HSN Code</label>
                            <input
                              type="text"
                              value={row.hsn}
                              onChange={(e) => handleUpdateItemRow(idx, 'hsn', e.target.value)}
                              placeholder="84182100"
                              className="w-full px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs font-mono text-center"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold mb-0.5">Qty</label>
                            <input
                              type="number"
                              min="1"
                              value={row.qty || ''}
                              onChange={(e) => handleUpdateItemRow(idx, 'qty', parseInt(e.target.value) || 1)}
                              className="w-full px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs font-bold text-center"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold mb-0.5">Rate (₹) *</label>
                            <input
                              type="number"
                              value={row.rate || ''}
                              onChange={(e) => handleUpdateItemRow(idx, 'rate', parseFloat(e.target.value) || 0)}
                              placeholder="21592"
                              className="w-full px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs font-mono font-bold text-right"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold mb-0.5">Tax (GST %)</label>
                            <select
                              value={row.taxRate}
                              onChange={(e) => handleUpdateItemRow(idx, 'taxRate', parseFloat(e.target.value) || 18)}
                              className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs"
                            >
                              <option value="18">18% (9+9)</option>
                              <option value="28">28% (14+14)</option>
                              <option value="12">12% (6+6)</option>
                              <option value="5">5% (2.5+2.5)</option>
                              <option value="0">0%</option>
                            </select>
                          </div>
                        </div>

                        {/* Serial Numbers input */}
                        <div>
                          <label className="block text-[11px] font-semibold mb-0.5 flex items-center justify-between">
                            <span>सिरियल नंबर / बारकोड (Serial Numbers - स्वल्पविरामाने वेगळे करा)</span>
                            <span className="text-[10px] text-slate-400">
                              (उदा. 602NRZX294301, 602NRQV293652)
                            </span>
                          </label>
                          <input
                            type="text"
                            value={row.serialNumbersStr}
                            onChange={(e) => handleUpdateItemRow(idx, 'serialNumbersStr', e.target.value)}
                            placeholder="602NRZX294301, 602NRQV293652"
                            className="w-full px-2.5 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs font-mono"
                          />
                        </div>

                        {/* Row Calculation Info */}
                        <div className="flex justify-between items-center text-[11px] pt-1 text-slate-500 border-t border-slate-100 dark:border-slate-700">
                          <span>
                            करपात्र (Taxable): ₹{rowRaw.toLocaleString('en-IN')} + GST ({row.taxRate}%): ₹{Math.round(rowTax).toLocaleString('en-IN')}
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            एकूण रक्कम: ₹{rowTotal.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 4. Tax & Totals Summary */}
              <div className="bg-slate-900 text-white p-4 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Subtotal (एकूण करपात्र रक्कम):</span>
                  <span className="font-mono font-bold">₹{calculatedSubtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>CGST (९%):</span>
                  <span className="font-mono">₹{Math.round(calculatedCgst).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>SGST (९%):</span>
                  <span className="font-mono">₹{Math.round(calculatedSgst).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm font-bold pt-2 border-t border-slate-700 text-emerald-400">
                  <span>GRAND TOTAL INVOICE (एकूण देय):</span>
                  <span className="font-mono text-base font-black">₹{calculatedGrandTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* 5. Payment & Stock Sync */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">आत्ता जमा रक्कम (Paid Now ₹)</label>
                  <input
                    type="number"
                    value={paidAmount || ''}
                    onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    उर्वरित बाकी डीलर लेजरमध्ये बाकी राहील.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">पेमेंट मोड</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium"
                  >
                    <option value="Online">Online / NEFT / RTGS</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <label className="flex items-start gap-2 cursor-pointer bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 w-full">
                    <input
                      type="checkbox"
                      checked={autoUpdateStock}
                      onChange={(e) => setAutoUpdateStock(e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs font-medium">
                      हे मॉडेल व सिरियल नंबर दुकानाच्या <strong>इन्व्हेंटरी स्टॉकमध्ये</strong> जोडा (Auto-add Stock)
                    </span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  रद्द करा (Cancel)
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 cursor-pointer active:scale-95"
                >
                  खरेदी बिल जतन करा व डीलर लेजर अपडेट करा
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Official Tax Invoice Print & Share Modal */}
      {selectedPurchaseForInvoice && (
        <PurchaseInvoiceModal
          purchase={selectedPurchaseForInvoice}
          settings={settings}
          onClose={() => setSelectedPurchaseForInvoice(null)}
        />
      )}

      {/* AI Purchase Bill Scanner Modal (Auto-updates Purchases, Stock & Dealer Ledger) */}
      <ScanPurchaseInvoiceModal
        isOpen={showScanModal}
        onClose={() => setShowScanModal(false)}
        onConfirmPurchase={onAddPurchase}
        settings={settings}
        onNavigateTab={onNavigateDealerLedger ? () => onNavigateDealerLedger() : undefined}
      />

    </div>
  );
};
