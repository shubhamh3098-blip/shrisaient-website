import React, { useState } from 'react';
import {
  Truck,
  Search,
  Plus,
  ArrowUpRight,
  Receipt,
  Building,
  Phone,
  DollarSign,
  FileText,
  X,
  PackagePlus,
  Barcode,
  Trash2,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { Dealer, DealerPayment, Purchase, PurchaseItem, StoreData, StockItem } from '../../types';
import { StorageService } from '../../services/storageService';
import { useTheme } from '../../context/ThemeContext';
import { PartyStatementParserModal } from './PartyStatementParserModal';

interface DealersViewProps {
  storeData: StoreData;
  onRefreshData: () => void;
}

export const DealersView: React.FC<DealersViewProps> = ({ storeData, onRefreshData }) => {
  const { isDayMode } = useTheme();
  const [activeTab, setActiveTab] = useState<'dealers' | 'purchases' | 'payments'>('dealers');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedDealer, setSelectedDealer] = useState<Dealer | null>(null);

  // Pay Dealer Form
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMode, setPayMode] = useState<DealerPayment['paymentMode']>('NEFT/RTGS');
  const [payRefNo, setPayRefNo] = useState<string>('');
  const [payNote, setPayNote] = useState<string>('');

  // Add Purchase Bill Form State
  const [isAddPurchaseModalOpen, setIsAddPurchaseModalOpen] = useState(false);
  const [isParserModalOpen, setIsParserModalOpen] = useState(false);
  const [purchaseDealerId, setPurchaseDealerId] = useState<string>('');
  const [purchaseBillNo, setPurchaseBillNo] = useState<string>('');
  const [purchaseDate, setPurchaseDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [purchasePaymentMode, setPurchasePaymentMode] = useState<string>('Credit / Ledger');
  const [purchasePaidAmount, setPurchasePaidAmount] = useState<string>('0');
  const [purchaseAutoUpdateStock, setPurchaseAutoUpdateStock] = useState<boolean>(true);
  const [purchaseNotes, setPurchaseNotes] = useState<string>('');

  // Purchase Items list in the modal
  const [purchaseItems, setPurchaseItems] = useState<Array<{
    name: string;
    model: string;
    serialNo: string;
    qty: number;
    purchaseRate: number;
    salePrice: number;
  }>>([
    { name: '', model: '', serialNo: '', qty: 1, purchaseRate: 0, salePrice: 0 }
  ]);

  const handleAddPurchaseItemRow = () => {
    setPurchaseItems([
      ...purchaseItems,
      { name: '', model: '', serialNo: '', qty: 1, purchaseRate: 0, salePrice: 0 }
    ]);
  };

  const handleRemovePurchaseItemRow = (idx: number) => {
    if (purchaseItems.length === 1) return;
    setPurchaseItems(purchaseItems.filter((_, i) => i !== idx));
  };

  const handleUpdatePurchaseItem = (idx: number, field: string, val: any) => {
    const copy = [...purchaseItems];
    copy[idx] = { ...copy[idx], [field]: val };
    setPurchaseItems(copy);
  };

  const calculatePurchaseTotal = () => {
    return purchaseItems.reduce((acc, item) => acc + (Number(item.qty) || 0) * (Number(item.purchaseRate) || 0), 0);
  };

  const handleSavePurchaseBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchaseDealerId) {
      alert('कृपया सप्लायर / डीलर निवडा (Please select a Supplier/Dealer).');
      return;
    }
    const validItems = purchaseItems.filter((i) => i.name.trim() !== '');
    if (validItems.length === 0) {
      alert('किमान एका वस्तूचे नाव टाका (Please enter at least 1 valid product).');
      return;
    }

    const data = StorageService.loadData();
    const dealer = data.dealers.find((d) => d.id === purchaseDealerId);
    if (!dealer) {
      alert('डीलर सापडला नाही.');
      return;
    }

    const totalAmt = calculatePurchaseTotal();
    const paidAmt = parseFloat(purchasePaidAmount) || 0;
    const dueAmt = Math.max(0, totalAmt - paidAmt);
    const billNum = purchaseBillNo.trim() || `PUR-${Date.now().toString().slice(-6)}`;

    // Build Purchase Items
    const formattedItems: PurchaseItem[] = validItems.map((item) => ({
      name: item.name.trim(),
      brand: dealer.name || 'General',
      model: item.model.trim() || undefined,
      serialNo: item.serialNo.trim() || undefined,
      qty: Number(item.qty) || 1,
      purchaseRate: Number(item.purchaseRate) || 0,
      salePrice: Number(item.salePrice) || undefined,
      total: (Number(item.qty) || 1) * (Number(item.purchaseRate) || 0),
    }));

    const newPurchase: Purchase = {
      id: `pur_${Date.now()}`,
      purchaseNo: billNum,
      dealerId: dealer.id,
      dealerName: dealer.companyName || dealer.name,
      date: purchaseDate,
      items: formattedItems,
      totalAmount: totalAmt,
      paidAmount: paidAmt,
      balanceDue: dueAmt,
      paymentMode: purchasePaymentMode,
      updateStock: purchaseAutoUpdateStock,
      notes: purchaseNotes.trim() || undefined,
    };

    // Update Dealer payable balance with the unpaid balance
    dealer.currentPayable += dueAmt;

    // Auto-update stock if checked
    if (purchaseAutoUpdateStock) {
      formattedItems.forEach((pItem) => {
        const existingStock = data.stock.find(
          (s) => s.name.toLowerCase() === pItem.name.toLowerCase() || (pItem.model && s.model && s.model.toLowerCase() === pItem.model.toLowerCase())
        );
        if (existingStock) {
          existingStock.stockQty += pItem.qty;
          existingStock.purchasePrice = pItem.purchaseRate;
          existingStock.updatedAt = purchaseDate;
          if (pItem.salePrice && pItem.salePrice > 0) {
            existingStock.salePrice = pItem.salePrice;
          }
          if (pItem.serialNo && (!existingStock.serialNo || existingStock.serialNo.trim() === '')) {
            existingStock.serialNo = pItem.serialNo;
          }
        } else {
          // Create new StockItem
          const newStockItem: StockItem = {
            id: `stk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            code: `ITM-${Date.now().toString().slice(-4)}`,
            name: pItem.name,
            brand: dealer.name,
            category: 'Electronics',
            model: pItem.model || '',
            serialNo: pItem.serialNo || '',
            purchasePrice: pItem.purchaseRate,
            salePrice: pItem.salePrice && pItem.salePrice > 0 ? pItem.salePrice : Math.round(pItem.purchaseRate * 1.2),
            mrp: Math.round((pItem.salePrice || pItem.purchaseRate) * 1.25),
            stockQty: pItem.qty,
            unit: 'Pcs',
            minAlertQty: 2,
            location: 'Main Showroom',
            updatedAt: purchaseDate,
          };
          data.stock.unshift(newStockItem);
        }
      });
    }

    // If paidAmt > 0, generate DealerPayment voucher
    if (paidAmt > 0) {
      const paymentRecord: DealerPayment = {
        id: `dp_${Date.now()}`,
        dealerId: dealer.id,
        dealerName: dealer.name,
        date: purchaseDate,
        amount: paidAmt,
        paymentMode: purchasePaymentMode === 'Cash' ? 'Cash' : purchasePaymentMode === 'Cheque' ? 'Cheque' : 'NEFT/RTGS',
        referenceNo: `PUR-PAY-${billNum}`,
        note: `Advance/Spot payment against Purchase Bill #${billNum}`,
      };
      data.dealerPayments.unshift(paymentRecord);
    }

    data.purchases.unshift(newPurchase);
    StorageService.saveData(data);
    onRefreshData();

    // Reset & close
    setIsAddPurchaseModalOpen(false);
    setPurchaseDealerId('');
    setPurchaseBillNo('');
    setPurchasePaidAmount('0');
    setPurchaseNotes('');
    setPurchaseItems([{ name: '', model: '', serialNo: '', qty: 1, purchaseRate: 0, salePrice: 0 }]);
  };

  const filteredDealers = storeData.dealers.filter((d) => {
    const q = searchQuery.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      d.companyName.toLowerCase().includes(q) ||
      d.phone.toLowerCase().includes(q) ||
      d.city.toLowerCase().includes(q)
    );
  });

  const openPayModal = (dealer: Dealer) => {
    setSelectedDealer(dealer);
    setPayAmount(dealer.currentPayable);
    setPayMode('NEFT/RTGS');
    setPayRefNo(`RTGS-SBI-${Date.now().toString().slice(-8)}`);
    setPayNote('');
    setIsPayModalOpen(true);
  };

  const handleConfirmDealerPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDealer || payAmount <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }

    const data = StorageService.loadData();
    const d = data.dealers.find((dl) => dl.id === selectedDealer.id);
    if (d) {
      d.currentPayable = Math.max(0, d.currentPayable - Number(payAmount));
    }

    const paymentRecord: DealerPayment = {
      id: 'dp-' + Date.now(),
      dealerId: selectedDealer.id,
      dealerName: selectedDealer.name,
      date: new Date().toISOString(),
      amount: Number(payAmount),
      paymentMode: payMode,
      referenceNo: payRefNo.trim() || undefined,
      note: payNote.trim() || undefined,
    };

    data.dealerPayments.unshift(paymentRecord);
    StorageService.saveData(data);
    onRefreshData();
    setIsPayModalOpen(false);
  };

  const totalPayable = storeData.dealers.reduce((a, d) => a + d.currentPayable, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 ${
        isDayMode ? 'border-slate-200' : 'border-slate-800'
      }`}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg border border-amber-500/20">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h2 className={`text-lg font-bold tracking-tight ${isDayMode ? 'text-slate-900' : 'text-white'}`}>
              Dealers & Suppliers Management
            </h2>
            <p className={`text-xs ${isDayMode ? 'text-slate-500' : 'text-slate-400'}`}>
              Manage electronics brand distributors, furniture artisans, purchase bills & payments.
            </p>
          </div>
        </div>

        {/* Tab switchers */}
        <div className={`flex items-center gap-1 border p-1 rounded-xl ${
          isDayMode ? 'bg-slate-100 border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <button
            onClick={() => setActiveTab('dealers')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              activeTab === 'dealers'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : isDayMode ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
            }`}
          >
            Suppliers ({storeData.dealers.length})
          </button>
          <button
            onClick={() => setActiveTab('purchases')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              activeTab === 'purchases'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : isDayMode ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
            }`}
          >
            Purchase Bills ({storeData.purchases.length})
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              activeTab === 'payments'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : isDayMode ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
            }`}
          >
            Payment Vouchers ({storeData.dealerPayments.length})
          </button>
        </div>
      </div>

      {/* KPI banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className={`border p-3.5 rounded-xl ${
          isDayMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
        }`}>
          <span className={`text-[10px] uppercase font-bold ${isDayMode ? 'text-slate-500' : 'text-slate-400'}`}>
            Active Distributors
          </span>
          <p className={`text-lg font-bold mt-0.5 ${isDayMode ? 'text-slate-900' : 'text-white'}`}>
            {storeData.dealers.length} Agencies
          </p>
        </div>
        <div className={`border p-3.5 rounded-xl ${
          isDayMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
        }`}>
          <span className="text-[10px] uppercase font-bold text-rose-500">Total Supplier Payables</span>
          <p className="text-lg font-bold text-rose-500 mt-0.5 font-mono">₹{totalPayable.toLocaleString('en-IN')}</p>
        </div>
        <div className={`border p-3.5 rounded-xl ${
          isDayMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
        }`}>
          <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Purchases Recorded</span>
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono">
            ₹{storeData.purchases.reduce((a, p) => a + p.totalAmount, 0).toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {activeTab === 'dealers' && (
        <div className="space-y-4">
          <div className={`border rounded-xl p-4 ${
            isDayMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
          }`}>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search suppliers by name, company, contact or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full border rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-amber-500 ${
                  isDayMode
                    ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                    : 'bg-slate-800/80 border-slate-700 text-white placeholder-slate-500'
                }`}
              />
            </div>
          </div>

          <div className={`border rounded-xl overflow-hidden shadow-sm ${
            isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <div className="overflow-x-auto">
              <table className={`w-full text-left text-xs ${isDayMode ? 'text-slate-700' : 'text-slate-300'}`}>
                <thead className={`uppercase text-[10px] tracking-wider ${
                  isDayMode ? 'bg-slate-100 text-slate-600 border-b border-slate-200' : 'bg-slate-800/80 text-slate-400'
                }`}>
                  <tr>
                    <th className="py-3 px-3">Supplier Name & Company</th>
                    <th className="py-3 px-3">City / Hub</th>
                    <th className="py-3 px-3">Contact</th>
                    <th className="py-3 px-3">Current Payable Balance</th>
                    <th className="py-3 px-3">Notes</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDayMode ? 'divide-slate-200' : 'divide-slate-800'}`}>
                  {filteredDealers.map((dealer) => (
                    <tr key={dealer.id} className={`transition ${
                      isDayMode ? 'hover:bg-slate-50' : 'hover:bg-slate-800/40'
                    }`}>
                      <td className="py-3 px-3">
                        <div className={`font-semibold ${isDayMode ? 'text-slate-900' : 'text-white'}`}>{dealer.name}</div>
                        <div className={`text-[10px] ${isDayMode ? 'text-slate-500' : 'text-slate-400'}`}>{dealer.companyName}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded border text-[10px] ${
                          isDayMode ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-300'
                        }`}>
                          {dealer.city}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className={isDayMode ? 'text-slate-800 font-medium' : 'text-slate-200'}>{dealer.phone}</div>
                        {dealer.email && <div className={`text-[10px] ${isDayMode ? 'text-slate-500' : 'text-slate-400'}`}>{dealer.email}</div>}
                      </td>
                      <td className="py-3 px-3">
                        {dealer.currentPayable > 0 ? (
                          <span className="font-bold text-rose-500 text-sm font-mono">
                            ₹{dealer.currentPayable.toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400 text-xs font-medium">Nil Payable</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-400">{dealer.notes || '-'}</td>
                      <td className="py-3 px-3 text-right">
                        {dealer.currentPayable > 0 && (
                          <button
                            onClick={() => openPayModal(dealer)}
                            className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition cursor-pointer flex items-center gap-1 ml-auto shadow-sm"
                          >
                            <span>Pay Balance</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'purchases' && (
        <div className="space-y-4">
          <div className={`flex justify-between items-center border p-3.5 rounded-xl ${
            isDayMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
          }`}>
            <div>
              <h3 className={`text-sm font-bold flex items-center gap-2 ${isDayMode ? 'text-slate-900' : 'text-white'}`}>
                <Receipt className="w-4 h-4 text-amber-500" />
                <span>खरेदी बिले (Dealer Purchase Invoices)</span>
              </h3>
              <p className={`text-[11px] ${isDayMode ? 'text-slate-500' : 'text-slate-400'}`}>
                डीलरकडून आलेले मालाचे इनव्हॉइस नोंदवा आणि स्टॉक वाढवा
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsParserModalOpen(true)}
                className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer transition active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>+ ऑटो-स्कॅन बिल (Smart Bill Parser)</span>
              </button>
              <button
                type="button"
                onClick={() => setIsAddPurchaseModalOpen(true)}
                className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer transition active:scale-95"
              >
                <PackagePlus className="w-4 h-4" />
                <span>+ मॅन्युअल बिल मारा (Manual Bill)</span>
              </button>
            </div>
          </div>

          <div className={`border rounded-xl overflow-hidden shadow-sm ${
            isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <div className="overflow-x-auto">
              <table className={`w-full text-left text-xs ${isDayMode ? 'text-slate-700' : 'text-slate-300'}`}>
                <thead className={`uppercase text-[10px] tracking-wider ${
                  isDayMode ? 'bg-slate-100 text-slate-600 border-b border-slate-200' : 'bg-slate-800/80 text-slate-400'
                }`}>
                  <tr>
                    <th className="py-3 px-3">Bill Number</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Supplier / Dealer</th>
                    <th className="py-3 px-3">Items Consignment</th>
                    <th className="py-3 px-3">Bill Amount</th>
                    <th className="py-3 px-3">Paid / Due</th>
                    <th className="py-3 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDayMode ? 'divide-slate-200' : 'divide-slate-800'}`}>
                  {storeData.purchases.map((pur) => (
                    <tr key={pur.id} className={`transition ${
                      isDayMode ? 'hover:bg-slate-50' : 'hover:bg-slate-800/40'
                    }`}>
                      <td className={`py-3 px-3 font-semibold font-mono ${isDayMode ? 'text-slate-900' : 'text-white'}`}>
                        {pur.purchaseNo}
                      </td>
                      <td className="py-3 px-3 text-slate-400">
                        {new Date(pur.date).toLocaleDateString('en-IN')}
                      </td>
                      <td className={`py-3 px-3 font-medium ${isDayMode ? 'text-slate-800' : 'text-slate-200'}`}>
                        {pur.dealerName}
                      </td>
                      <td className={`py-3 px-3 ${isDayMode ? 'text-slate-600' : 'text-slate-300'}`}>
                        {pur.items.map((i) => `${i.name}${i.model ? ` [${i.model}]` : ''} (x${i.qty})`).join(', ')}
                      </td>
                      <td className={`py-3 px-3 font-bold font-mono ${isDayMode ? 'text-slate-900' : 'text-white'}`}>
                        ₹{pur.totalAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium font-mono">
                          ₹{pur.paidAmount.toLocaleString('en-IN')}
                        </span>
                        {pur.balanceDue > 0 && (
                          <span className="text-rose-500 block text-[10px] font-bold font-mono">
                            Due: ₹{pur.balanceDue.toLocaleString('en-IN')}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            pur.balanceDue === 0
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {pur.balanceDue === 0 ? 'Full Paid' : 'Partial Due'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'payments' && (
        <div className={`border rounded-xl overflow-hidden shadow-sm ${
          isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="overflow-x-auto">
            <table className={`w-full text-left text-xs ${isDayMode ? 'text-slate-700' : 'text-slate-300'}`}>
              <thead className={`uppercase text-[10px] tracking-wider ${
                isDayMode ? 'bg-slate-100 text-slate-600 border-b border-slate-200' : 'bg-slate-800/80 text-slate-400'
              }`}>
                <tr>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Dealer / Beneficiary</th>
                  <th className="py-3 px-3">Amount Paid</th>
                  <th className="py-3 px-3">Payment Mode</th>
                  <th className="py-3 px-3">Ref / UTR Number</th>
                  <th className="py-3 px-3">Note</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDayMode ? 'divide-slate-200' : 'divide-slate-800'}`}>
                {storeData.dealerPayments.map((dp) => (
                  <tr key={dp.id} className={`transition ${
                    isDayMode ? 'hover:bg-slate-50' : 'hover:bg-slate-800/40'
                  }`}>
                    <td className="py-3 px-3 text-slate-400">
                      {new Date(dp.date).toLocaleDateString('en-IN')}
                    </td>
                    <td className={`py-3 px-3 font-medium ${isDayMode ? 'text-slate-900' : 'text-white'}`}>
                      {dp.dealerName}
                    </td>
                    <td className="py-3 px-3 font-bold text-amber-600 dark:text-amber-400 font-mono">
                      ₹{dp.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded border text-[10px] ${
                        isDayMode ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-300'
                      }`}>
                        {dp.paymentMode}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-400">{dp.referenceNo || '-'}</td>
                    <td className="py-3 px-3 text-slate-400">{dp.note || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pay Dealer Modal */}
      {isPayModalOpen && selectedDealer && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl ${
            isDayMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <div className={`px-5 py-4 border-b flex items-center justify-between ${
              isDayMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}>
              <h3 className="text-sm font-bold">Disburse Payment to Supplier</h3>
              <button
                onClick={() => setIsPayModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmDealerPayment} className="p-5 space-y-4 text-xs">
              <div className={`p-3 rounded-lg border ${
                isDayMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/80 border-slate-700/60'
              }`}>
                <p className="font-bold">{selectedDealer.name}</p>
                <p className="text-[11px] text-slate-400">{selectedDealer.city}</p>
                <p className="text-[11px] text-rose-500 font-bold mt-1 font-mono">
                  Current Payable: ₹{selectedDealer.currentPayable.toLocaleString('en-IN')}
                </p>
              </div>

              <div>
                <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1">
                  Amount to Pay (₹) *
                </label>
                <input
                  type="number"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                  className={`w-full border rounded-lg px-3 py-2 font-bold font-mono text-sm focus:outline-none focus:border-amber-500 ${
                    isDayMode
                      ? 'bg-slate-50 border-slate-300 text-slate-900'
                      : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                />
              </div>

              <div>
                <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1">
                  Payment Mode *
                </label>
                <select
                  value={payMode}
                  onChange={(e) => setPayMode(e.target.value as any)}
                  className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500 ${
                    isDayMode
                      ? 'bg-slate-50 border-slate-300 text-slate-900'
                      : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                >
                  <option value="NEFT/RTGS">NEFT / RTGS / NetBanking</option>
                  <option value="Cheque">Bank Cheque</option>
                  <option value="Cash">Cash Voucher</option>
                  <option value="UPI">UPI / Current Account QR</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1">
                  Bank Reference / UTR Number
                </label>
                <input
                  type="text"
                  value={payRefNo}
                  onChange={(e) => setPayRefNo(e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2 font-mono focus:outline-none focus:border-amber-500 ${
                    isDayMode
                      ? 'bg-slate-50 border-slate-300 text-slate-900'
                      : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                />
              </div>

              <div>
                <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1">
                  Payment Note / Remarks
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cleared 50% bill amount"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500 ${
                    isDayMode
                      ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                      : 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                  }`}
                />
              </div>

              <div className={`pt-3 border-t flex justify-end gap-2 ${
                isDayMode ? 'border-slate-200' : 'border-slate-800'
              }`}>
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className={`px-3.5 py-1.5 rounded-lg ${
                    isDayMode ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg shadow-md shadow-amber-500/20"
                >
                  Confirm & Deduct Balance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Purchase Bill Modal */}
      {isAddPurchaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className={`border rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col ${
            isDayMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
          }`}>
            {/* Modal Header */}
            <div className={`flex items-center justify-between p-4 border-b sticky top-0 z-10 ${
              isDayMode ? 'bg-slate-50/95 border-slate-200' : 'bg-slate-950/95 border-slate-800'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/30">
                  <PackagePlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`font-bold text-base ${isDayMode ? 'text-slate-900' : 'text-white'}`}>
                    नवीन खरेदी बिल (New Purchase Bill)
                  </h3>
                  <p className={`text-xs ${isDayMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    Record inward consignment, assign serial/models, and update supplier payable ledger
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddPurchaseModalOpen(false)}
                className={`p-1.5 rounded-lg transition ${
                  isDayMode ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSavePurchaseBill} className="p-4 space-y-4 text-xs">
              {/* Top Row: Dealer, Bill No, Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={`text-[11px] font-bold uppercase tracking-wide block mb-1 ${
                    isDayMode ? 'text-slate-600' : 'text-slate-300'
                  }`}>
                    सप्लायर / डीलर निवडा *
                  </label>
                  <select
                    value={purchaseDealerId}
                    onChange={(e) => setPurchaseDealerId(e.target.value)}
                    required
                    className={`w-full border rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500 ${
                      isDayMode
                        ? 'bg-slate-50 border-slate-300 text-slate-900'
                        : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  >
                    <option value="">-- सप्लायर निवडा (Select Dealer) --</option>
                    {storeData.dealers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.companyName || d.name} ({d.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`text-[11px] font-bold uppercase tracking-wide block mb-1 ${
                    isDayMode ? 'text-slate-600' : 'text-slate-300'
                  }`}>
                    खरेदी बिल नंबर (Invoice / Challan No.)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. INV-LG-9821"
                    value={purchaseBillNo}
                    onChange={(e) => setPurchaseBillNo(e.target.value)}
                    className={`w-full border rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-amber-500 ${
                      isDayMode
                        ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                        : 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                    }`}
                  />
                </div>

                <div>
                  <label className={`text-[11px] font-bold uppercase tracking-wide block mb-1 ${
                    isDayMode ? 'text-slate-600' : 'text-slate-300'
                  }`}>
                    बिल तारीख (Date)
                  </label>
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className={`w-full border rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500 ${
                      isDayMode
                        ? 'bg-slate-50 border-slate-300 text-slate-900'
                        : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  />
                </div>
              </div>

              {/* Items Table Section */}
              <div className={`space-y-2 pt-2 border-t ${isDayMode ? 'border-slate-200' : 'border-slate-800'}`}>
                <div className="flex items-center justify-between">
                  <span className={`font-bold text-xs flex items-center gap-1.5 ${
                    isDayMode ? 'text-slate-800' : 'text-slate-200'
                  }`}>
                    <FileText className="w-3.5 h-3.5 text-amber-500" />
                    <span>खरेदी वस्तू तपशील (Items & Consignment Details)</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleAddPurchaseItemRow}
                    className={`px-2.5 py-1 font-semibold rounded-lg border text-[11px] flex items-center gap-1 cursor-pointer transition ${
                      isDayMode
                        ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                        : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border-slate-700'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ वस्तू जोडा (Add Row)</span>
                  </button>
                </div>

                <div className={`overflow-x-auto rounded-xl border ${
                  isDayMode ? 'border-slate-200' : 'border-slate-800'
                }`}>
                  <table className={`w-full text-left text-xs ${isDayMode ? 'text-slate-700' : 'text-slate-300'}`}>
                    <thead className={`uppercase text-[10px] tracking-wider ${
                      isDayMode ? 'bg-slate-100 text-slate-600 border-b border-slate-200' : 'bg-slate-800/80 text-slate-400'
                    }`}>
                      <tr>
                        <th className="py-2.5 px-3 min-w-[180px]">Product / Item Name *</th>
                        <th className="py-2.5 px-3 min-w-[120px]">Model No.</th>
                        <th className="py-2.5 px-3 min-w-[140px]">Serial No. / IMEI</th>
                        <th className="py-2.5 px-3 w-16">Qty</th>
                        <th className="py-2.5 px-3 w-28">Purchase Rate (₹)</th>
                        <th className="py-2.5 px-3 w-28">Sale Price (₹)</th>
                        <th className="py-2.5 px-3 w-24 text-right">Total (₹)</th>
                        <th className="py-2.5 px-2 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDayMode ? 'divide-slate-200' : 'divide-slate-800'}`}>
                      {purchaseItems.map((row, idx) => (
                        <tr key={idx} className={isDayMode ? 'hover:bg-slate-50' : 'hover:bg-slate-800/40'}>
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              placeholder="e.g. LG Smart TV 43 Inch"
                              value={row.name}
                              onChange={(e) => handleUpdatePurchaseItem(idx, 'name', e.target.value)}
                              className={`w-full border rounded-lg px-2 py-1.5 focus:outline-none focus:border-amber-500 text-xs ${
                                isDayMode
                                  ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                                  : 'bg-slate-950 border-slate-700 text-white placeholder-slate-500'
                              }`}
                              required
                            />
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              placeholder="e.g. 43UR7500"
                              value={row.model}
                              onChange={(e) => handleUpdatePurchaseItem(idx, 'model', e.target.value)}
                              className={`w-full border rounded-lg px-2 py-1.5 focus:outline-none focus:border-amber-500 text-xs ${
                                isDayMode
                                  ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                                  : 'bg-slate-950 border-slate-700 text-white placeholder-slate-500'
                              }`}
                            />
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              placeholder="e.g. SN-8921820"
                              value={row.serialNo}
                              onChange={(e) => handleUpdatePurchaseItem(idx, 'serialNo', e.target.value)}
                              className={`w-full border rounded-lg px-2 py-1.5 font-mono focus:outline-none focus:border-amber-500 text-xs ${
                                isDayMode
                                  ? 'bg-slate-50 border-slate-300 text-amber-700 placeholder-slate-400'
                                  : 'bg-slate-950 border-slate-700 text-amber-300 placeholder-slate-500'
                              }`}
                            />
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="number"
                              min="1"
                              value={row.qty}
                              onChange={(e) => handleUpdatePurchaseItem(idx, 'qty', parseInt(e.target.value) || 1)}
                              className={`w-full border rounded-lg px-2 py-1.5 font-mono text-center focus:outline-none focus:border-amber-500 text-xs ${
                                isDayMode
                                  ? 'bg-slate-50 border-slate-300 text-slate-900'
                                  : 'bg-slate-950 border-slate-700 text-white'
                              }`}
                            />
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="number"
                              min="0"
                              value={row.purchaseRate || ''}
                              onChange={(e) => handleUpdatePurchaseItem(idx, 'purchaseRate', parseFloat(e.target.value) || 0)}
                              placeholder="0"
                              className={`w-full border rounded-lg px-2 py-1.5 font-mono focus:outline-none focus:border-amber-500 text-xs ${
                                isDayMode
                                  ? 'bg-slate-50 border-slate-300 text-slate-900'
                                  : 'bg-slate-950 border-slate-700 text-white'
                              }`}
                            />
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="number"
                              min="0"
                              value={row.salePrice || ''}
                              onChange={(e) => handleUpdatePurchaseItem(idx, 'salePrice', parseFloat(e.target.value) || 0)}
                              placeholder="Optional"
                              className={`w-full border rounded-lg px-2 py-1.5 font-mono focus:outline-none focus:border-amber-500 text-xs ${
                                isDayMode
                                  ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                                  : 'bg-slate-950 border-slate-700 text-white placeholder-slate-500'
                              }`}
                            />
                          </td>
                          <td className={`py-2 px-3 text-right font-mono font-bold ${
                            isDayMode ? 'text-slate-900' : 'text-white'
                          }`}>
                            ₹{((row.qty || 1) * (row.purchaseRate || 0)).toLocaleString('en-IN')}
                          </td>
                          <td className="py-2 px-2 text-center">
                            {purchaseItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemovePurchaseItemRow(idx)}
                                className="text-slate-400 hover:text-rose-500 p-1 transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payment Terms & Calculations */}
              <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl border ${
                isDayMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
              }`}>
                <div>
                  <label className={`text-[11px] font-bold uppercase tracking-wide block mb-1 ${
                    isDayMode ? 'text-slate-600' : 'text-slate-300'
                  }`}>
                    पेमेंट प्रकार (Payment Mode)
                  </label>
                  <select
                    value={purchasePaymentMode}
                    onChange={(e) => setPurchasePaymentMode(e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500 ${
                      isDayMode
                        ? 'bg-white border-slate-300 text-slate-900'
                        : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  >
                    <option value="Credit / Ledger">उधार / लेजर (Credit / Ledger)</option>
                    <option value="NEFT/RTGS">NEFT / RTGS</option>
                    <option value="Cheque">Bank Cheque</option>
                    <option value="Cash">Cash (रोख)</option>
                  </select>
                </div>

                <div>
                  <label className={`text-[11px] font-bold uppercase tracking-wide block mb-1 ${
                    isDayMode ? 'text-slate-600' : 'text-slate-300'
                  }`}>
                    आज जमा केलेली रक्कम (Paid Now) ₹
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={purchasePaidAmount}
                    onChange={(e) => setPurchasePaidAmount(e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 font-mono focus:outline-none focus:border-amber-500 ${
                      isDayMode
                        ? 'bg-white border-slate-300 text-slate-900'
                        : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  />
                </div>

                <div className={`flex flex-col justify-center p-2.5 rounded-lg border ${
                  isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                }`}>
                  <div className="flex justify-between text-xs">
                    <span className={isDayMode ? 'text-slate-500' : 'text-slate-400'}>एकूण बिल (Total):</span>
                    <span className={`font-bold font-mono ${isDayMode ? 'text-slate-900' : 'text-white'}`}>
                      ₹{calculatePurchaseTotal().toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-rose-500 font-medium">उर्वरित बाकी (Due):</span>
                    <span className="font-bold text-rose-500 font-mono">
                      ₹{Math.max(0, calculatePurchaseTotal() - (parseFloat(purchasePaidAmount) || 0)).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Automatic Stock Update Checkbox */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={purchaseAutoUpdateStock}
                    onChange={(e) => setPurchaseAutoUpdateStock(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-0 focus:ring-offset-0"
                  />
                  <div>
                    <span className={`font-bold text-xs block ${isDayMode ? 'text-amber-900' : 'text-amber-300'}`}>
                      स्टॉकमध्ये त्वरित माल जमा करा (Auto Add to Inventory Stock)
                    </span>
                    <span className={`text-[11px] ${isDayMode ? 'text-slate-600' : 'text-slate-400'}`}>
                      ह्या बिलामधील वस्तू थेट दुकानाच्या गोदामातील स्टॉकमध्ये वाढतील.
                    </span>
                  </div>
                </label>
                <CheckCircle2 className="w-5 h-5 text-amber-500 shrink-0" />
              </div>

              {/* Notes */}
              <div>
                <label className={`text-[11px] font-bold uppercase tracking-wide block mb-1 ${
                  isDayMode ? 'text-slate-600' : 'text-slate-300'
                }`}>
                  नोंद / शेरा (Notes / Dispatch Details)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Received via VRL Logistics, tempo no MH-31..."
                  value={purchaseNotes}
                  onChange={(e) => setPurchaseNotes(e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500 ${
                    isDayMode
                      ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                      : 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                  }`}
                />
              </div>

              {/* Modal Actions */}
              <div className={`pt-3 border-t flex justify-end gap-2 ${
                isDayMode ? 'border-slate-200' : 'border-slate-800'
              }`}>
                <button
                  type="button"
                  onClick={() => setIsAddPurchaseModalOpen(false)}
                  className={`px-4 py-2 rounded-xl transition ${
                    isDayMode ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  रद्द करा (Cancel)
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition cursor-pointer active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>खरेदी बिल सेव्ह करा (Save Purchase Bill)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Automated Party Statement & GST Bill Parser Modal */}
      <PartyStatementParserModal
        isOpen={isParserModalOpen}
        onClose={() => setIsParserModalOpen(false)}
        storeData={storeData}
        onRefreshData={onRefreshData}
      />
    </div>
  );
};
