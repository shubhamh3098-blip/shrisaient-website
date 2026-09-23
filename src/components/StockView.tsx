import React, { useState } from 'react';
import {
  Package,
  Search,
  Plus,
  AlertTriangle,
  ArrowUpDown,
  Building2,
  Store,
  ArrowRightLeft,
  Printer,
  History,
  CheckCircle2,
  Boxes,
  MapPin,
  TrendingDown,
  Layers,
  ChevronDown,
  AlertCircle
} from 'lucide-react';
import { StockItem, StockTransferRecord } from '../types';

interface StockViewProps {
  stock: StockItem[];
  stockTransfers?: StockTransferRecord[];
  staff?: { name: string; role?: string }[];
  onAddStockItem: (item: Omit<StockItem, 'id'>) => void;
  onUpdateStockQty: (id: string, newQty: number) => void;
  onUpdateStockLocations?: (id: string, shopQty: number, godownQty: number) => void;
  onTransferStock?: (transfer: Omit<StockTransferRecord, 'id' | 'timestamp'>) => void;
  onDeleteStockItem?: (id: string) => void;
}

export const StockView: React.FC<StockViewProps> = ({
  stock,
  stockTransfers = [],
  staff = [],
  onAddStockItem,
  onUpdateStockQty,
  onUpdateStockLocations,
  onTransferStock,
  onDeleteStockItem,
}) => {
  const [search, setSearch] = useState('');
  const [activeLocationTab, setActiveLocationTab] = useState<'all' | 'godown' | 'shop' | 'low' | 'transfers'>('all');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedProductForTransfer, setSelectedProductForTransfer] = useState<StockItem | null>(null);

  // Transfer Form State
  const [transferDirection, setTransferDirection] = useState<'GodownToShop' | 'ShopToGodown'>('GodownToShop');
  const [transferQty, setTransferQty] = useState<number>(1);
  const [transferredBy, setTransferredBy] = useState<string>('Shubham Shende');
  const [transferNotes, setTransferNotes] = useState<string>('');
  const [activeChallan, setActiveChallan] = useState<StockTransferRecord | null>(null);
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState(false);
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);
  const [transferError, setTransferError] = useState('');

  // Add Item Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [shopQty, setShopQty] = useState<number>(2);
  const [godownQty, setGodownQty] = useState<number>(8);
  const [godownLocation, setGodownLocation] = useState('मुख्य गोडावून (आर्वी रोड)');
  const [rackLocation, setRackLocation] = useState('रॅक A-1');
  const [unit, setUnit] = useState('Unit');
  const [sellingPrice, setSellingPrice] = useState<number>(12000);
  const [purchasePrice, setPurchasePrice] = useState<number>(9000);
  const [minStockLevel, setMinStockLevel] = useState<number>(2);

  const categories = ['All', ...Array.from(new Set(stock.map((s) => s.category).filter(Boolean)))];

  // Calculations
  const totalGodownUnits = stock.reduce((sum, item) => sum + (item.godownQty ?? 0), 0);
  const totalShopUnits = stock.reduce((sum, item) => sum + (item.shopQty ?? item.quantity), 0);
  const totalUnits = stock.reduce((sum, item) => sum + item.quantity, 0);

  const totalGodownValuation = stock.reduce(
    (sum, item) => sum + (item.godownQty ?? 0) * (item.purchasePrice || 0),
    0
  );
  const totalShopValuation = stock.reduce(
    (sum, item) => sum + (item.shopQty ?? item.quantity) * (item.purchasePrice || 0),
    0
  );
  const totalStockValuation = stock.reduce(
    (acc, item) => acc + item.quantity * (item.purchasePrice || 0),
    0
  );
  const totalPotentialRevenue = stock.reduce(
    (acc, item) => acc + item.quantity * (item.sellingPrice || 0),
    0
  );

  const lowStockItems = stock.filter((item) => item.quantity <= item.minStockLevel);

  // Filtered list
  const filtered = stock.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.code.toLowerCase().includes(search.toLowerCase()) ||
      (item.godownLocation && item.godownLocation.toLowerCase().includes(search.toLowerCase()));

    const matchesCat = categoryFilter === 'All' ? true : item.category === categoryFilter;

    if (!matchesSearch || !matchesCat) return false;

    if (activeLocationTab === 'godown') {
      return (item.godownQty ?? 0) > 0;
    }
    if (activeLocationTab === 'shop') {
      return (item.shopQty ?? item.quantity) > 0;
    }
    if (activeLocationTab === 'low') {
      return item.quantity <= item.minStockLevel;
    }
    return true;
  });

  const handleOpenTransfer = (item: StockItem) => {
    setSelectedProductForTransfer(item);
    setTransferQty(1);
    setTransferNotes('');
    setTransferDirection('GodownToShop');
    setShowTransferModal(true);
  };

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingTransfer || !selectedProductForTransfer || transferQty <= 0) return;
    setTransferError('');

    const curGodown = selectedProductForTransfer.godownQty ?? 0;
    const curShop = selectedProductForTransfer.shopQty ?? selectedProductForTransfer.quantity;

    if (transferDirection === 'GodownToShop' && transferQty > curGodown) {
      setTransferError(`गोडावून मध्ये फक्त ${curGodown} नग उपलब्ध आहेत! त्यापेक्षा जास्त ट्रान्सफर करता येणार नाही.`);
      return;
    }

    if (transferDirection === 'ShopToGodown' && transferQty > curShop) {
      setTransferError(`दुकानात फक्त ${curShop} नग उपलब्ध आहेत!`);
      return;
    }

    setIsSubmittingTransfer(true);

    const nextGodown = transferDirection === 'GodownToShop' ? curGodown - transferQty : curGodown + transferQty;
    const nextShop = transferDirection === 'GodownToShop' ? curShop + transferQty : curShop - transferQty;

    if (onUpdateStockLocations) {
      onUpdateStockLocations(selectedProductForTransfer.id, nextShop, nextGodown);
    } else {
      // Fallback
      onUpdateStockQty(selectedProductForTransfer.id, nextShop + nextGodown);
    }

    if (onTransferStock) {
      const record = {
        date: new Date().toLocaleDateString('mr-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        stockItemId: selectedProductForTransfer.id,
        itemName: selectedProductForTransfer.name,
        itemCode: selectedProductForTransfer.code,
        fromLocation: transferDirection === 'GodownToShop' ? ('Godown' as const) : ('Shop' as const),
        toLocation: transferDirection === 'GodownToShop' ? ('Shop' as const) : ('Godown' as const),
        quantity: transferQty,
        transferredBy: transferredBy || 'Staff',
        notes: transferNotes || (transferDirection === 'GodownToShop' ? 'गोडावून ➔ दुकान/शोरूम ट्रान्सफर' : 'दुकान ➔ गोडावून ट्रान्सफर'),
      };
      onTransferStock(record);
      setActiveChallan({
        ...record,
        id: `trans-${Date.now()}`,
        timestamp: new Date().toISOString(),
      });
    }

    setShowTransferModal(false);
    setSelectedProductForTransfer(null);
    setTimeout(() => {
      setIsSubmittingTransfer(false);
    }, 600);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingAdd || !name.trim()) return;

    setIsSubmittingAdd(true);

    const totalCalculatedQty = Math.max(0, shopQty) + Math.max(0, godownQty);

    onAddStockItem({
      name: name.trim(),
      code: code.trim() || `STK-${Date.now().toString().slice(-4)}`,
      category,
      quantity: totalCalculatedQty,
      shopQty: Math.max(0, shopQty),
      godownQty: Math.max(0, godownQty),
      godownLocation: godownLocation.trim() || 'मुख्य गोडावून (आर्वी रोड)',
      rackLocation: rackLocation.trim() || 'A-1',
      unit: unit.trim() || 'Unit',
      sellingPrice,
      purchasePrice,
      minStockLevel,
    });

    setName('');
    setCode('');
    setShopQty(2);
    setGodownQty(8);
    setShowAddModal(false);
    setTimeout(() => {
      setIsSubmittingAdd(false);
    }, 600);
  };

  const handlePrintStock = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Boxes className="w-8 h-8 text-amber-500" />
              <span>स्टॉक व गोडावून व्यवस्थापन</span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
              गोडावून + शोरूम
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            मुख्य गोडावून (Warehouse) आणि दुकान/शोरूम स्टॉक ट्रॅकिंग, आंतर-स्टॉक ट्रान्सफर आणि री-ऑर्डर लेव्हल.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handlePrintStock}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>स्टॉक शीट प्रिंट</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (stock.length > 0) {
                handleOpenTransfer(stock[0]);
              } else {
                setShowAddModal(true);
              }
            }}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>गोडावून ➔ दुकान ट्रान्सफर</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 text-xs font-black shadow-md shadow-amber-500/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ नवीन स्टॉक वस्तू जोडा</span>
          </button>
        </div>
      </div>

      {/* KPI Stats (Showroom vs Godown Breakdown) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Stock */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">एकूण प्रॉडक्ट्स व साठा</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">{totalUnits}</span>
            <span className="text-xs text-slate-500 ml-1.5">नग ({stock.length} प्रॉडक्ट्स)</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between text-[11px] text-slate-500">
            <span>खरेदी मूल्य: ₹{totalStockValuation.toLocaleString()}</span>
          </div>
        </div>

        {/* Godown Stock */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-amber-200 dark:border-amber-900/40 p-4 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-amber-700 dark:text-amber-400 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" />
              <span>मुख्य गोडावून साठा</span>
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-700 dark:text-amber-300">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">{totalGodownUnits}</span>
            <span className="text-xs text-slate-500 ml-1.5">नग गोडावूनमध्ये</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between text-[11px] text-slate-500">
            <span>गोडावून व्हॅल्यूएशन:</span>
            <strong className="text-amber-600 font-mono">₹{totalGodownValuation.toLocaleString()}</strong>
          </div>
        </div>

        {/* Shop / Showroom Stock */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200 dark:border-emerald-900/40 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
              <Store className="w-3.5 h-3.5" />
              <span>दुकान / शोरूम साठा</span>
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-700 dark:text-emerald-300">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{totalShopUnits}</span>
            <span className="text-xs text-slate-500 ml-1.5">नग डिस्प्लेवर</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between text-[11px] text-slate-500">
            <span>शोरूम व्हॅल्यूएशन:</span>
            <strong className="text-emerald-600 font-mono">₹{totalShopValuation.toLocaleString()}</strong>
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-900/40 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-rose-600 dark:text-rose-400 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>कमी साठा (री-ऑर्डर)</span>
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">{lowStockItems.length}</span>
            <span className="text-xs text-slate-500 ml-1.5">आयटम्स कमी आहेत</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between text-[11px] text-slate-500">
            <span>संभाव्य एकूण विक्री:</span>
            <strong className="text-slate-800 dark:text-slate-200 font-mono">₹{totalPotentialRevenue.toLocaleString()}</strong>
          </div>
        </div>
      </div>

      {/* Tabs & Location Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setActiveLocationTab('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeLocationTab === 'all'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>सर्व स्टॉक ({stock.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveLocationTab('godown')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeLocationTab === 'godown'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-amber-50 dark:hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>गोडावून साठा ({totalGodownUnits} नग)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveLocationTab('shop')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeLocationTab === 'shop'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-emerald-50 dark:hover:bg-slate-800'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>दुकान / शोरूम ({totalShopUnits} नग)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveLocationTab('low')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeLocationTab === 'low'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-slate-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>कमी साठा ({lowStockItems.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveLocationTab('transfers')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeLocationTab === 'transfers'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>ट्रान्सफर इतिहास ({stockTransfers.length})</span>
          </button>
        </div>

        {/* Search Bar */}
        {activeLocationTab !== 'transfers' && (
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="वस्तूचे नाव, कोड, गोडावून शोधा..."
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-slate-800 dark:text-slate-200"
            />
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {activeLocationTab === 'transfers' ? (
        /* Stock Transfer History Log */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <History className="w-4 h-4 text-indigo-500" />
                <span>गोडावून व दुकान अंतर्गत स्टॉक ट्रान्सफर नोंदी</span>
              </h2>
              <p className="text-xs text-slate-500">
                गोडावून मधून दुकानात आणलेला व दुकानातून गोडावूनमध्ये पाठवलेला माल.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (stock.length > 0) handleOpenTransfer(stock[0]);
              }}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>नवीन ट्रान्सफर</span>
            </button>
          </div>

          {stockTransfers.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <Boxes className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p>अद्याप कोणतीही स्टॉक ट्रान्सफर नोंद नाही.</p>
              <p className="text-[11px] text-slate-500 mt-1">
                वरील &quot;गोडावून ➔ दुकान ट्रान्सफर&quot; बटणावर क्लिक करून नोंद जोडा.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">तारीख</th>
                    <th className="py-3 px-4">वस्तूचे नाव व कोड</th>
                    <th className="py-3 px-4">ट्रान्सफर दिशा</th>
                    <th className="py-3 px-4 text-center">संख्या (Qty)</th>
                    <th className="py-3 px-4">कोणी केले (Staff)</th>
                    <th className="py-3 px-4">शेरा / कारण</th>
                    <th className="py-3 px-4 text-right">गेटपास / चलन</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {stockTransfers.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-mono font-medium text-slate-600 dark:text-slate-400">
                        {t.date}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900 dark:text-white">{t.itemName}</p>
                        <span className="text-[10px] font-mono text-slate-400">{t.itemCode}</span>
                      </td>
                      <td className="py-3 px-4">
                        {t.fromLocation === 'Godown' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                            <Building2 className="w-3 h-3" />
                            <span>गोडावून ➔ दुकान</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                            <Store className="w-3 h-3" />
                            <span>दुकान ➔ गोडावून</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-black text-sm text-indigo-600 dark:text-indigo-400">
                        {t.quantity} नग
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                        {t.transferredBy}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {t.notes || '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setActiveChallan(t)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition cursor-pointer border border-indigo-200 dark:border-indigo-800"
                          title="स्टॉक ट्रान्सफर चलन व गेटपास प्रिंट करा"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>चलन</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Inventory Table with Godown vs Shop Split */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">आयटम नाव व कोड</th>
                  <th className="py-3 px-4">वर्गवारी</th>
                  <th className="py-3 px-4 text-center bg-amber-50/50 dark:bg-amber-950/20 border-x border-amber-100 dark:border-amber-900/30">
                    <div className="flex items-center justify-center gap-1 text-amber-700 dark:text-amber-400 font-black">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>गोडावून साठा</span>
                    </div>
                  </th>
                  <th className="py-3 px-4 text-center bg-emerald-50/50 dark:bg-emerald-950/20 border-r border-emerald-100 dark:border-emerald-900/30">
                    <div className="flex items-center justify-center gap-1 text-emerald-700 dark:text-emerald-400 font-black">
                      <Store className="w-3.5 h-3.5" />
                      <span>दुकान साठा</span>
                    </div>
                  </th>
                  <th className="py-3 px-4 text-center font-black">एकूण साठा (Total)</th>
                  <th className="py-3 px-4">किंमत (विक्री / खरेदी)</th>
                  <th className="py-3 px-4 text-right">कृती / ट्रान्सफर</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((item) => {
                  const sQty = item.shopQty ?? item.quantity;
                  const gQty = item.godownQty ?? 0;
                  const isLow = item.quantity <= item.minStockLevel;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                      {/* Name & Code */}
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900 dark:text-white">{item.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-mono text-slate-400">{item.code}</span>
                          {item.godownLocation && (
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                              <MapPin className="w-2.5 h-2.5" />
                              <span>{item.godownLocation}</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {item.category}
                        </span>
                      </td>

                      {/* Godown Qty Column */}
                      <td className="py-3 px-4 text-center bg-amber-50/30 dark:bg-amber-950/10 border-x border-amber-100 dark:border-amber-900/30">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              const nextG = Math.max(0, gQty - 1);
                              if (onUpdateStockLocations) {
                                onUpdateStockLocations(item.id, sQty, nextG);
                              } else {
                                onUpdateStockQty(item.id, sQty + nextG);
                              }
                            }}
                            className="w-5 h-5 rounded bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 font-bold text-xs flex items-center justify-center cursor-pointer"
                            title="गोडावून साठा -1"
                          >
                            -
                          </button>
                          <span className="font-mono font-black text-sm text-amber-800 dark:text-amber-300 w-8 text-center">
                            {gQty}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const nextG = gQty + 1;
                              if (onUpdateStockLocations) {
                                onUpdateStockLocations(item.id, sQty, nextG);
                              } else {
                                onUpdateStockQty(item.id, sQty + nextG);
                              }
                            }}
                            className="w-5 h-5 rounded bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 font-bold text-xs flex items-center justify-center cursor-pointer"
                            title="गोडावून साठा +1"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-[10px] text-amber-700/70 dark:text-amber-400/70 block mt-0.5">
                          {item.unit}
                        </span>
                      </td>

                      {/* Shop Qty Column */}
                      <td className="py-3 px-4 text-center bg-emerald-50/30 dark:bg-emerald-950/10 border-r border-emerald-100 dark:border-emerald-900/30">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              const nextS = Math.max(0, sQty - 1);
                              if (onUpdateStockLocations) {
                                onUpdateStockLocations(item.id, nextS, gQty);
                              } else {
                                onUpdateStockQty(item.id, nextS + gQty);
                              }
                            }}
                            className="w-5 h-5 rounded bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 font-bold text-xs flex items-center justify-center cursor-pointer"
                            title="दुकान साठा -1"
                          >
                            -
                          </button>
                          <span className="font-mono font-black text-sm text-emerald-800 dark:text-emerald-300 w-8 text-center">
                            {sQty}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const nextS = sQty + 1;
                              if (onUpdateStockLocations) {
                                onUpdateStockLocations(item.id, nextS, gQty);
                              } else {
                                onUpdateStockQty(item.id, nextS + gQty);
                              }
                            }}
                            className="w-5 h-5 rounded bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 font-bold text-xs flex items-center justify-center cursor-pointer"
                            title="दुकान साठा +1"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-[10px] text-emerald-700/70 dark:text-emerald-400/70 block mt-0.5">
                          {item.unit}
                        </span>
                      </td>

                      {/* Total Qty */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className={`font-mono font-black text-sm ${isLow ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                            {item.quantity} {item.unit}
                          </span>
                          {isLow && (
                            <span className="px-1.5 py-0.5 text-[9px] bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 rounded font-black">
                              कमी
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Pricing */}
                      <td className="py-3 px-4">
                        <p className="font-black text-slate-900 dark:text-white font-mono">
                          ₹{item.sellingPrice.toLocaleString()}
                        </p>
                        <span className="text-[10px] text-slate-400">
                          खरेदी: ₹{item.purchasePrice.toLocaleString()}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenTransfer(item)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 font-bold text-[11px] transition flex items-center gap-1 cursor-pointer"
                            title="गोडावून मधून दुकानात ट्रान्सफर करा"
                          >
                            <ArrowRightLeft className="w-3 h-3" />
                            <span>ट्रान्सफर</span>
                          </button>

                          {onDeleteStockItem && (
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`नक्की "${item.name}" स्टॉक मधून हटवायचे आहे का?`)) {
                                  onDeleteStockItem(item.id);
                                }
                              }}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 transition cursor-pointer"
                              title="हटवा"
                            >
                              ✕
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
      )}

      {/* Inter-Location Stock Transfer Modal */}
      {showTransferModal && selectedProductForTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs no-print">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-base">स्टॉक ट्रान्सफर (Inter-Stock)</h3>
                  <p className="text-[11px] text-slate-500">{selectedProductForTransfer.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {/* Current Inventory Summary */}
            <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
              <div>
                <span className="text-[11px] text-amber-700 dark:text-amber-400 font-bold flex items-center justify-center gap-1">
                  <Building2 className="w-3 h-3" />
                  <span>गोडावून साठा</span>
                </span>
                <span className="text-xl font-mono font-black text-amber-600 dark:text-amber-300">
                  {selectedProductForTransfer.godownQty ?? 0} {selectedProductForTransfer.unit}
                </span>
              </div>
              <div className="border-l border-slate-200 dark:border-slate-700">
                <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold flex items-center justify-center gap-1">
                  <Store className="w-3 h-3" />
                  <span>दुकान साठा</span>
                </span>
                <span className="text-xl font-mono font-black text-emerald-600 dark:text-emerald-300">
                  {selectedProductForTransfer.shopQty ?? selectedProductForTransfer.quantity} {selectedProductForTransfer.unit}
                </span>
              </div>
            </div>

            {transferError && (
              <div className="p-2.5 rounded-xl bg-rose-100 border border-rose-300 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{transferError}</span>
              </div>
            )}

            <form onSubmit={handleExecuteTransfer} className="space-y-4">
              {/* Transfer Direction Toggle */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  ट्रान्सफर दिशा (Transfer Direction) *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTransferDirection('GodownToShop')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition flex flex-col items-center gap-1 cursor-pointer ${
                      transferDirection === 'GodownToShop'
                        ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-400 text-amber-800 dark:text-amber-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-1 text-[11px]">
                      <Building2 className="w-3.5 h-3.5 text-amber-600" />
                      <span>गोडावून</span>
                      <span>➔</span>
                      <Store className="w-3.5 h-3.5 text-emerald-600" />
                      <span>दुकान</span>
                    </div>
                    <span className="text-[10px] opacity-75">गोडावून मधून दुकानात आणणे</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTransferDirection('ShopToGodown')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition flex flex-col items-center gap-1 cursor-pointer ${
                      transferDirection === 'ShopToGodown'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 text-emerald-800 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-1 text-[11px]">
                      <Store className="w-3.5 h-3.5 text-emerald-600" />
                      <span>दुकान</span>
                      <span>➔</span>
                      <Building2 className="w-3.5 h-3.5 text-amber-600" />
                      <span>गोडावून</span>
                    </div>
                    <span className="text-[10px] opacity-75">दुकानातून गोडावूनमध्ये पाठवणे</span>
                  </button>
                </div>
              </div>

              {/* Transfer Quantity */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    ट्रान्सफर संख्या (Qty in {selectedProductForTransfer.unit}) *
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">
                    उपलब्ध: {transferDirection === 'GodownToShop' ? selectedProductForTransfer.godownQty ?? 0 : selectedProductForTransfer.shopQty ?? selectedProductForTransfer.quantity}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max={transferDirection === 'GodownToShop' ? selectedProductForTransfer.godownQty ?? 0 : selectedProductForTransfer.shopQty ?? selectedProductForTransfer.quantity}
                    value={transferQty}
                    onChange={(e) => setTransferQty(parseInt(e.target.value) || 1)}
                    required
                    className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const max = transferDirection === 'GodownToShop' ? selectedProductForTransfer.godownQty ?? 0 : selectedProductForTransfer.shopQty ?? selectedProductForTransfer.quantity;
                      setTransferQty(max);
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold"
                  >
                    सर्व (All)
                  </button>
                </div>
              </div>

              {/* Staff / Agent in charge */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ट्रान्सफर करणारी व्यक्ती (Staff / Handler)
                </label>
                <select
                  value={transferredBy}
                  onChange={(e) => setTransferredBy(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="Shubham Shende">Shubham Shende (शुभम शेंडे)</option>
                  <option value="Bhushan Lidbe">Bhushan Lidbe (भूषण लिडबे)</option>
                  <option value="Suraj Pendam">Suraj Pendam (सुरज पेंदाम)</option>
                  <option value="Ninad Hole">Ninad Hole (निनाद होले)</option>
                  <option value="Godown Supervisor">गोडावून सुपरवायझर (Godown In-charge)</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  शेरा / कारण (Notes)
                </label>
                <input
                  type="text"
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  placeholder="उदा. दुकानातील डिस्प्लेसाठी, ग्राहकाची ऑर्डर"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  रद्द करा
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTransfer}
                  className={`px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md transition flex items-center gap-1.5 ${
                    isSubmittingTransfer ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer active:scale-95'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmittingTransfer ? 'ट्रान्सफर होत आहे...' : 'ट्रान्सफर पूर्ण करा'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs no-print">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <h3 className="font-black text-base">नवीन स्टॉक वस्तू जोडा (गोडावून व दुकान)</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  वस्तूचे पूर्ण नाव (Product Name) *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="उदा. 43 inch 4K Smart TV किंवा सागवान हायड्रोलिक बेड"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    आयटम कोड / SKU
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="उदा. ELEC-TV-43"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    वर्गवारी (Category)
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Electronics">Electronics (इलेक्ट्रॉनिक्स)</option>
                    <option value="Furniture">Furniture (फर्निचर)</option>
                    <option value="Home Appliances">Home Appliances (होम अप्लायंसेज)</option>
                    <option value="Cooler/Fans">Cooler / Fans (कुलर/फॅन)</option>
                    <option value="General">General Goods</option>
                  </select>
                </div>
              </div>

              {/* Godown & Showroom Stock Split */}
              <div className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-3">
                <div className="text-xs font-black text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-amber-600" />
                  <span>साठा वाटप (Stock Allocation)</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-amber-800 dark:text-amber-400 mb-1">
                      🏭 गोडावून साठा (Godown Qty)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={godownQty}
                      onChange={(e) => setGodownQty(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-amber-300 dark:border-amber-800 rounded-xl text-sm font-mono font-black bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-emerald-800 dark:text-emerald-400 mb-1">
                      🏪 दुकान साठा (Shop Qty)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={shopQty}
                      onChange={(e) => setShopQty(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-emerald-300 dark:border-emerald-800 rounded-xl text-sm font-mono font-black bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-medium text-slate-500 mb-1">
                      गोडावून लोकेशन / नाव
                    </label>
                    <input
                      type="text"
                      value={godownLocation}
                      onChange={(e) => setGodownLocation(e.target.value)}
                      placeholder="उदा. मुख्य गोडावून (आर्वी रोड)"
                      className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-slate-500 mb-1">
                      रॅक / कपाट नंबर
                    </label>
                    <input
                      type="text"
                      value={rackLocation}
                      onChange={(e) => setRackLocation(e.target.value)}
                      placeholder="उदा. रॅक A-1"
                      className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Pricing & Unit */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    विक्री दर (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    खरेदी दर (₹)
                  </label>
                  <input
                    type="number"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    एकक (Unit)
                  </label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="Unit, Box, नग"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  कमी साठा इशारा पातळी (Low Stock Alert Level)
                </label>
                <input
                  type="number"
                  min="1"
                  value={minStockLevel}
                  onChange={(e) => setMinStockLevel(parseInt(e.target.value) || 2)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50"
                >
                  रद्द करा
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdd}
                  className={`px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black shadow-md transition ${
                    isSubmittingAdd ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer active:scale-95'
                  }`}
                >
                  {isSubmittingAdd ? 'साठा सेव्ह होत आहे...' : 'साठा सुरक्षित सेव्ह करा'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Transfer Delivery Challan & Gate Pass Printable Modal */}
      {activeChallan && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200">
            {/* Modal Header Actions (No Print) */}
            <div className="bg-slate-900 text-white p-3.5 flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-xs sm:text-sm">
                  स्टॉक ट्रान्सफर चलन / गेटपास पूर्वावलोकन (Gate Pass Print)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>प्रिंट चलन (Print)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveChallan(null)}
                  className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Challan Sheet */}
            <div id="printable-stock-challan" className="p-6 sm:p-8 space-y-5 bg-white print:p-0 print:border-none print:shadow-none">
              {/* Company Header */}
              <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
                <span className="text-[10px] tracking-widest uppercase font-black text-slate-500 block">
                  ॥ श्री गणेशाय नमः ॥
                </span>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 uppercase font-serif">
                  श्री साई एंटरप्रायझेस
                </h2>
                <p className="text-xs font-bold text-slate-700">
                  इलेक्ट्रॉनिक्स, फर्निचर, होम अप्लायन्सेस व ३०-महिने बचत योजना
                </p>
                <p className="text-[11px] text-slate-500">
                  पत्ता: मातोश्री सभागृह समोर, आर्वी रोड, वर्धा • मो.: 8766486915 / 8600122798
                </p>
                <div className="inline-block px-3 py-0.5 rounded-full bg-slate-100 text-slate-900 border border-slate-300 font-bold text-xs mt-1">
                  स्टॉक ट्रान्सफर चलन व डिलिव्हरी गेटपास (STOCK TRANSFER CHALLAN & GATE PASS)
                </div>
              </div>

              {/* Meta Info Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1 border-r border-slate-200 pr-2">
                  <div>
                    <span className="text-slate-400 font-medium">चलन क्रमांक: </span>
                    <strong className="font-mono text-slate-900">
                      CHLN-{activeChallan.id.replace(/[^0-9]/g, '').slice(-6) || '849102'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">दिनांक: </span>
                    <strong className="font-mono text-slate-900">{activeChallan.date}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">माल पाठविणारे ठिकाण (From): </span>
                    <strong className="text-amber-800 block">
                      {activeChallan.fromLocation === 'Godown'
                        ? '🏭 मुख्य गोडावून (Main Godown) - आर्वी बायपास'
                        : '🏪 दुकान / मुख्य शोरूम (Main Showroom)'}
                    </strong>
                  </div>
                </div>

                <div className="space-y-1 pl-2">
                  <div>
                    <span className="text-slate-400 font-medium">ट्रान्सफर प्रकार: </span>
                    <strong className="text-slate-900">
                      {activeChallan.fromLocation === 'Godown' ? 'गोडावून ➔ दुकान साठा' : 'दुकान ➔ गोडावून साठा'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">जबाबदार कर्मचारी: </span>
                    <strong className="text-slate-900">{activeChallan.transferredBy}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">माल पोहचणारे ठिकाण (To): </span>
                    <strong className="text-emerald-800 block">
                      {activeChallan.toLocation === 'Shop'
                        ? '🏪 दुकान / मुख्य शोरूम (Main Showroom)'
                        : '🏭 मुख्य गोडावून (Main Godown)'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Goods Table */}
              <div className="border border-slate-300 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">क्र.</th>
                      <th className="py-2.5 px-3">वस्तूचे नाव (Item Description)</th>
                      <th className="py-2.5 px-3">आयटम कोड</th>
                      <th className="py-2.5 px-3 text-center">नग संख्या (Qty)</th>
                      <th className="py-2.5 px-3">शेरा / रिमार्क</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium">
                    <tr>
                      <td className="py-3 px-3 text-center font-mono">1</td>
                      <td className="py-3 px-3">
                        <strong className="text-slate-950 font-bold text-sm block">
                          {activeChallan.itemName}
                        </strong>
                        <span className="text-[10px] text-slate-500">श्री साई एंटरप्रायझेस इन्व्हेंटरी</span>
                      </td>
                      <td className="py-3 px-3 font-mono">{activeChallan.itemCode}</td>
                      <td className="py-3 px-3 text-center font-black font-mono text-base text-slate-950">
                        {activeChallan.quantity} नग
                      </td>
                      <td className="py-3 px-3 text-slate-600 text-[11px]">
                        {activeChallan.notes || 'दुकानातील विक्री / ऑर्डर पूर्ततेसाठी'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Terms / Gate Pass Note */}
              <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-600 border border-slate-200">
                <p>
                  <strong>टीप (Security Note):</strong> हे चलन केवळ अंतर्गत गोडावून व शोरूम दरम्यान माल वाहतूक व
                  स्टॉक नियंत्रणासाठी आहे. कृपया माल तपासूनच स्वाक्षरी करावी.
                </p>
              </div>

              {/* Signature Blocks */}
              <div className="grid grid-cols-3 gap-4 pt-6 text-center text-xs">
                <div className="space-y-8">
                  <div className="h-9 border-b border-dashed border-slate-400"></div>
                  <div>
                    <span className="font-bold text-slate-800 block">गोडावून सुपरवायझर</span>
                    <span className="text-[10px] text-slate-400">माल पाठवणारा (Dispatcher)</span>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="h-9 border-b border-dashed border-slate-400"></div>
                  <div>
                    <span className="font-bold text-slate-800 block">वाहतूकदार / कर्मचारी</span>
                    <span className="text-[10px] text-slate-400">वाहतूक (Tempo / Carrier)</span>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="h-9 border-b border-dashed border-slate-400"></div>
                  <div>
                    <span className="font-bold text-slate-800 block">शोरूम मॅनेजर</span>
                    <span className="text-[10px] text-slate-400">माल स्वीकारणारा (Receiver)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockView;
