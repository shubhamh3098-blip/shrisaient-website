import React, { useState } from 'react';
import {
  Package,
  Search,
  Plus,
  AlertTriangle,
  ArrowUpDown,
  Edit2,
  Trash2,
  Download,
  ShieldCheck,
  BellRing,
  CheckCircle2
} from 'lucide-react';
import { StockItem, TransactionEntry, BusinessSettings } from '../types';
import { exportStockToCsv } from '../utils/csvExporter';
import { WarrantyTrackerModal } from './WarrantyTrackerModal';

interface StockViewProps {
  stock: StockItem[];
  onAddStockItem: (item: Omit<StockItem, 'id'>) => void;
  onUpdateStockQty: (id: string, newQty: number) => void;
  transactions?: TransactionEntry[];
  settings?: BusinessSettings;
}

export const StockView: React.FC<StockViewProps> = ({
  stock,
  onAddStockItem,
  onUpdateStockQty,
  transactions = [],
  settings = {
    businessName: 'Shri Sai Enterprises',
    address: 'Arvi Road, Punjab Colony, Wardha',
    phone: '8766486915',
    secondaryPhone: '8600122798',
  } as any,
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showWarrantyModal, setShowWarrantyModal] = useState(false);
  const [lowStockFilterOnly, setLowStockFilterOnly] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState('Electricals');
  const [quantity, setQuantity] = useState<number>(10);
  const [unit, setUnit] = useState('Piece');
  const [sellingPrice, setSellingPrice] = useState<number>(100);
  const [purchasePrice, setPurchasePrice] = useState<number>(75);
  const [minStockLevel, setMinStockLevel] = useState<number>(5);

  const categories = ['All', ...Array.from(new Set(stock.map((s) => s.category)))];

  const lowStockItems = stock.filter((item) => item.quantity <= item.minStockLevel);

  const filtered = stock.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.code.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === 'All' ? true : item.category === categoryFilter;
    const matchesLowStock = lowStockFilterOnly ? item.quantity <= item.minStockLevel : true;
    return matchesSearch && matchesCat && matchesLowStock;
  });

  const totalStockValuation = stock.reduce(
    (acc, item) => acc + item.quantity * item.purchasePrice,
    0
  );

  const totalPotentialRevenue = stock.reduce(
    (acc, item) => acc + item.quantity * item.sellingPrice,
    0
  );

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddStockItem({
      name: name.trim(),
      code: code.trim() || `STK-${Date.now().toString().slice(-4)}`,
      category,
      quantity,
      unit,
      sellingPrice,
      purchasePrice,
      minStockLevel,
    });

    setName('');
    setCode('');
    setQuantity(10);
    setSellingPrice(100);
    setPurchasePrice(75);
    setShowAddModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Stock & Inventory
          </h1>
          <p className="text-sm text-slate-500">
            Real-time stock quantities, low-stock reorder alerts & warranty tracker.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowWarrantyModal(true)}
            className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            title="इलेक्ट्रॉनिक्स व वस्तू वॉरंटी ट्रॅकर उघडा"
          >
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>🛡️ वॉरंटी ट्रॅकर</span>
          </button>
          <button
            onClick={() => exportStockToCsv(stock)}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            title="Download inventory list in CSV / Excel format"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            Export CSV
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            + Add New Stock Item
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Total Products Listed</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{stock.length} Items</p>
        </div>
        <div
          onClick={() => setLowStockFilterOnly(!lowStockFilterOnly)}
          className={`rounded-xl border p-4 shadow-xs transition cursor-pointer ${
            lowStockItems.length > 0
              ? lowStockFilterOnly
                ? 'bg-rose-500 text-white border-rose-600'
                : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
              : 'bg-white text-slate-900 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold">
              {lowStockItems.length > 0 ? '⚠️ Low Stock Alert' : 'Stock Status'}
            </p>
            {lowStockItems.length > 0 && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${lowStockFilterOnly ? 'bg-white text-rose-600' : 'bg-amber-200 text-amber-900'}`}>
                {lowStockFilterOnly ? 'फिल्टर चालू' : 'क्लिक करून पाहा'}
              </span>
            )}
          </div>
          <p className="text-xl font-black mt-1">
            {lowStockItems.length} {lowStockItems.length === 1 ? 'Item Low' : 'Items Low'}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Current Stock Valuation (Cost)</p>
          <p className="text-xl font-bold text-indigo-600 mt-1">
            ₹{totalStockValuation.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Potential Sales Value</p>
          <p className="text-xl font-bold text-emerald-600 mt-1">
            ₹{totalPotentialRevenue.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search || ''}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product name or item code..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-800"
          />
        </div>
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                categoryFilter === cat
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Item Name / Code</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Selling Price</th>
                <th className="py-3 px-4">Cost Price</th>
                <th className="py-3 px-4">In Stock</th>
                <th className="py-3 px-4 text-right">Quick Stock Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item, idx) => {
                const isLow = item.quantity <= item.minStockLevel;
                return (
                  <tr key={`${item.id}-${idx}`} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-900">{item.name}</p>
                      <span className="text-[11px] font-mono text-slate-400">
                        {item.code}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      ₹{item.sellingPrice.toLocaleString()}{' '}
                      <span className="text-[10px] text-slate-400 font-normal">
                        /{item.unit}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      ₹{item.purchasePrice.toLocaleString()}{' '}
                      <span className="text-[10px] text-slate-400">/{item.unit}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-bold ${
                            isLow ? 'text-amber-600' : 'text-emerald-600'
                          }`}
                        >
                          {item.quantity} {item.unit}
                        </span>
                        {isLow && (
                          <span className="px-1.5 py-0.5 text-[9px] bg-amber-100 text-amber-800 rounded font-bold">
                            Low
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onUpdateStockQty(item.id, Math.max(0, item.quantity - 1))}
                          className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer flex items-center justify-center"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-semibold text-slate-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateStockQty(item.id, item.quantity + 1)}
                          className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Add New Stock Product</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Product / Item Name *
                </label>
                <input
                  type="text"
                  required
                  value={name || ''}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Copper Wire 2.5mm or Switch Board 8-Modular"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Item Code / SKU
                  </label>
                  <input
                    type="text"
                    value={code || ''}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. STK-CW25"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={category || ''}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Electricals, Hardware, Pipes"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Selling Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={sellingPrice ?? 0}
                    onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cost Price (₹)
                  </label>
                  <input
                    type="number"
                    value={purchasePrice ?? 0}
                    onChange={(e) => setPurchasePrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Unit
                  </label>
                  <input
                    type="text"
                    value={unit || ''}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="Piece, Roll, Box"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Initial Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={quantity ?? 0}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Low Stock Alert Level
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={minStockLevel ?? 5}
                    onChange={(e) => setMinStockLevel(parseInt(e.target.value) || 5)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  Save Stock Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Warranty Tracker Modal */}
      {showWarrantyModal && (
        <WarrantyTrackerModal
          isOpen={showWarrantyModal}
          onClose={() => setShowWarrantyModal(false)}
          transactions={transactions}
          settings={settings}
        />
      )}
    </div>
  );
};
