import React, { useState } from 'react';
import {
  Boxes,
  Search,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  Package,
  Sparkles,
  Barcode,
  CheckCircle,
  X
} from 'lucide-react';
import { StockItem, StoreData } from '../../types';
import { StorageService } from '../../services/storageService';
import { useTheme } from '../../context/ThemeContext';

interface InventoryViewProps {
  storeData: StoreData;
  onRefreshData: () => void;
  onOpenFrontAddProduct?: () => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({ storeData, onRefreshData, onOpenFrontAddProduct }) => {
  const { isDayMode } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);

  // Form fields
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<StockItem['category']>('Electronics');
  const [formBrand, setFormBrand] = useState('');
  const [formModel, setFormModel] = useState('');
  const [formSerialNo, setFormSerialNo] = useState('');
  const [formPurchasePrice, setFormPurchasePrice] = useState<number>(0);
  const [formSalePrice, setFormSalePrice] = useState<number>(0);
  const [formMrp, setFormMrp] = useState<number>(0);
  const [formStockQty, setFormStockQty] = useState<number>(1);
  const [formMinAlertQty, setFormMinAlertQty] = useState<number>(2);
  const [formUnit, setFormUnit] = useState('Pcs');
  const [formLocation, setFormLocation] = useState('Floor 1');
  const [formWarrantyMonths, setFormWarrantyMonths] = useState<number>(12);

  const filteredStock = storeData.stock.filter((item) => {
    const matchesQuery =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.model && item.model.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.serialNo && item.serialNo.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesQuery && matchesCategory;
  });

  const openAddModal = () => {
    setEditingItem(null);
    setFormCode(`SSE-${Date.now().toString().slice(-5)}`);
    setFormName('');
    setFormCategory('Electronics');
    setFormBrand('');
    setFormModel('');
    setFormSerialNo('');
    setFormPurchasePrice(0);
    setFormSalePrice(0);
    setFormMrp(0);
    setFormStockQty(1);
    setFormMinAlertQty(2);
    setFormUnit('Pcs');
    setFormLocation('Floor 1');
    setFormWarrantyMonths(12);
    setIsAddModalOpen(true);
  };

  const openEditModal = (item: StockItem) => {
    setEditingItem(item);
    setFormCode(item.code);
    setFormName(item.name);
    setFormCategory(item.category);
    setFormBrand(item.brand);
    setFormModel(item.model);
    setFormSerialNo(item.serialNo || '');
    setFormPurchasePrice(item.purchasePrice);
    setFormSalePrice(item.salePrice);
    setFormMrp(item.mrp);
    setFormStockQty(item.stockQty);
    setFormMinAlertQty(item.minAlertQty);
    setFormUnit(item.unit);
    setFormLocation(item.location || '');
    setFormWarrantyMonths(item.warrantyMonths || 0);
    setIsAddModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCode.trim()) {
      alert('Please fill Item Name and SKU/Code.');
      return;
    }

    if (editingItem) {
      StorageService.updateStockItem({
        ...editingItem,
        code: formCode.trim(),
        name: formName.trim(),
        category: formCategory,
        brand: formBrand.trim(),
        model: formModel.trim(),
        serialNo: formSerialNo.trim() || undefined,
        purchasePrice: Number(formPurchasePrice),
        salePrice: Number(formSalePrice),
        mrp: Number(formMrp),
        stockQty: Number(formStockQty),
        minAlertQty: Number(formMinAlertQty),
        unit: formUnit,
        location: formLocation.trim() || undefined,
        warrantyMonths: Number(formWarrantyMonths),
      });
    } else {
      StorageService.addStockItem({
        code: formCode.trim(),
        name: formName.trim(),
        category: formCategory,
        brand: formBrand.trim(),
        model: formModel.trim(),
        serialNo: formSerialNo.trim() || undefined,
        purchasePrice: Number(formPurchasePrice),
        salePrice: Number(formSalePrice),
        mrp: Number(formMrp),
        stockQty: Number(formStockQty),
        minAlertQty: Number(formMinAlertQty),
        unit: formUnit,
        location: formLocation.trim() || undefined,
        warrantyMonths: Number(formWarrantyMonths),
      });
    }

    onRefreshData();
    setIsAddModalOpen(false);
  };

  const handleDeleteItem = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}" from inventory?`)) {
      StorageService.deleteStockItem(id);
      onRefreshData();
    }
  };

  const handleQuickQtyAdjust = (item: StockItem, delta: number) => {
    const newQty = Math.max(0, item.stockQty + delta);
    StorageService.updateStockItem({ ...item, stockQty: newQty });
    onRefreshData();
  };

  const totalValuation = storeData.stock.reduce((a, s) => a + s.salePrice * s.stockQty, 0);
  const totalCost = storeData.stock.reduce((a, s) => a + s.purchasePrice * s.stockQty, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 ${
        isDayMode ? 'border-slate-200' : 'border-slate-800'
      }`}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/20">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <h2 className={`text-lg font-bold tracking-tight ${isDayMode ? 'text-slate-900' : 'text-white'}`}>
              Showroom Inventory & Stock Management (गोदाम व स्टॉक)
            </h2>
            <p className={`text-xs ${isDayMode ? 'text-slate-500' : 'text-slate-400'}`}>
              Track Electronics serial numbers, Furniture sets, cost valuation & low-stock alerts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {onOpenFrontAddProduct && (
            <button
              onClick={onOpenFrontAddProduct}
              className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition cursor-pointer shadow-md shadow-emerald-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>+ नवीन प्रॉडक्ट (Direct Entry)</span>
            </button>
          )}
          <button
            id="btn-add-new-stock"
            onClick={openAddModal}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs transition cursor-pointer shadow-md shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add Stock Item</span>
          </button>
        </div>
      </div>

      {/* Summary Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className={`border p-3 rounded-xl ${
          isDayMode ? 'bg-white border-slate-200 text-slate-900 shadow-sm' : 'bg-slate-900 border-slate-800 text-white'
        }`}>
          <span className={`text-[10px] uppercase font-bold ${isDayMode ? 'text-slate-500' : 'text-slate-400'}`}>Total Products</span>
          <p className="text-base font-bold mt-0.5">{storeData.stock.length} Unique SKUs</p>
        </div>
        <div className={`border p-3 rounded-xl ${
          isDayMode ? 'bg-white border-slate-200 text-slate-900 shadow-sm' : 'bg-slate-900 border-slate-800 text-white'
        }`}>
          <span className={`text-[10px] uppercase font-bold ${isDayMode ? 'text-slate-500' : 'text-slate-400'}`}>Total Showroom Units</span>
          <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
            {storeData.stock.reduce((a, s) => a + s.stockQty, 0)} Units
          </p>
        </div>
        <div className={`border p-3 rounded-xl ${
          isDayMode ? 'bg-white border-slate-200 text-slate-900 shadow-sm' : 'bg-slate-900 border-slate-800 text-white'
        }`}>
          <span className={`text-[10px] uppercase font-bold ${isDayMode ? 'text-slate-500' : 'text-slate-400'}`}>Cost Value</span>
          <p className={`text-base font-bold mt-0.5 ${isDayMode ? 'text-slate-800' : 'text-slate-300'}`}>
            ₹{totalCost.toLocaleString('en-IN')}
          </p>
        </div>
        <div className={`border p-3 rounded-xl ${
          isDayMode ? 'bg-white border-slate-200 text-slate-900 shadow-sm' : 'bg-slate-900 border-slate-800 text-white'
        }`}>
          <span className={`text-[10px] uppercase font-bold ${isDayMode ? 'text-slate-500' : 'text-slate-400'}`}>Retail Valuation</span>
          <p className="text-base font-bold text-amber-600 dark:text-amber-400 mt-0.5">
            ₹{totalValuation.toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Controls: Search & Category */}
      <div className={`border rounded-xl p-4 space-y-3 ${
        isDayMode ? 'bg-white border-slate-200 text-slate-900 shadow-sm' : 'bg-slate-900 border-slate-800 text-white'
      }`}>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by SKU, item name, brand (Samsung, LG, Sai Artisan), model, or serial number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full border rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-amber-500 ${
              isDayMode
                ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                : 'bg-slate-800/80 border-slate-700 text-white placeholder-slate-500'
            }`}
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {['All', 'Electronics', 'Furniture', 'Home Appliances', 'Kitchen Appliances'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : isDayMode
                  ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Stock Table */}
      <div className={`border rounded-xl overflow-hidden shadow-sm ${
        isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="overflow-x-auto">
          <table className={`w-full text-left text-xs ${isDayMode ? 'text-slate-700' : 'text-slate-300'}`}>
            <thead className={`uppercase text-[10px] tracking-wider ${
              isDayMode ? 'bg-slate-100 text-slate-600 border-b border-slate-200' : 'bg-slate-800/80 text-slate-400'
            }`}>
              <tr>
                <th className="py-3 px-3">Item Details</th>
                <th className="py-3 px-3">Category & Brand</th>
                <th className="py-3 px-3">Serial / Model</th>
                <th className="py-3 px-3">Purchase Rate</th>
                <th className="py-3 px-3">Selling Price</th>
                <th className="py-3 px-3">Stock Qty</th>
                <th className="py-3 px-3">Location</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDayMode ? 'divide-slate-200' : 'divide-slate-800'}`}>
              {filteredStock.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 px-4 text-center">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto text-xl font-bold">
                        📦
                      </div>
                      <h4 className="text-sm font-bold">गोदामात अद्याप उत्पादन उपलब्ध नाही (No Products in Inventory)</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        सर्व डमी / डेमो उत्पादने डिलीट करण्यात आली आहेत. दुकानातील खरे उत्पादन जोडण्यासाठी खाली क्लिक करा.
                      </p>
                      <button
                        type="button"
                        onClick={openAddModal}
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow transition cursor-pointer"
                      >
                        + नवीन उत्पादन जोडा (Add Real Product)
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStock.map((item) => {
                  const isLow = item.stockQty <= item.minAlertQty;
                  return (
                    <tr key={item.id} className={isDayMode ? 'hover:bg-slate-50' : 'hover:bg-slate-800/40'}>
                    <td className="py-3 px-3">
                      <div className={`font-semibold ${isDayMode ? 'text-slate-900' : 'text-white'}`}>{item.name}</div>
                      <div className="text-[10px] text-amber-600 dark:text-amber-400 font-mono">SKU: {item.code}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] border ${
                        isDayMode
                          ? 'bg-slate-100 border-slate-200 text-slate-700'
                          : 'bg-slate-800 border-slate-700 text-slate-200'
                      }`}>
                        {item.category}
                      </span>
                      <p className={`text-[10px] mt-1 font-medium ${isDayMode ? 'text-slate-500' : 'text-slate-400'}`}>{item.brand}</p>
                    </td>
                    <td className="py-3 px-3">
                      <p className={isDayMode ? 'text-slate-700' : 'text-slate-300'}>{item.model || '-'}</p>
                      {item.serialNo && (
                        <p className={`text-[10px] font-mono ${isDayMode ? 'text-slate-500' : 'text-slate-400'}`}>SN: {item.serialNo}</p>
                      )}
                    </td>
                    <td className={`py-3 px-3 ${isDayMode ? 'text-slate-700' : 'text-slate-300'}`}>
                      ₹{item.purchasePrice.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 font-bold text-amber-600 dark:text-amber-400 font-mono">
                      ₹{item.salePrice.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-xs ${
                            isLow
                              ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30'
                              : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {item.stockQty} {item.unit}
                        </span>
                        {/* Quick increment / decrement buttons */}
                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={() => handleQuickQtyAdjust(item, -1)}
                            className={`w-5 h-5 rounded text-center text-xs cursor-pointer ${
                              isDayMode
                                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                            }`}
                            title="Decrease stock by 1"
                          >
                            -
                          </button>
                          <button
                            onClick={() => handleQuickQtyAdjust(item, 1)}
                            className={`w-5 h-5 rounded text-center text-xs cursor-pointer ${
                              isDayMode
                                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                            }`}
                            title="Increase stock by 1"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      {isLow && (
                        <span className="text-[10px] text-rose-500 font-semibold block mt-0.5">
                          Low alert (min {item.minAlertQty})
                        </span>
                      )}
                    </td>
                    <td className={`py-3 px-3 ${isDayMode ? 'text-slate-500' : 'text-slate-400'}`}>{item.location || 'Showroom'}</td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(item)}
                          className={`p-1.5 rounded-md border transition cursor-pointer ${
                            isDayMode
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                          }`}
                          title="Edit Stock Item"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-amber-500" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id, item.name)}
                          className={`p-1.5 rounded-md border transition cursor-pointer ${
                            isDayMode
                              ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200'
                              : 'bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border-slate-700'
                          }`}
                          title="Delete from Inventory"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className={`border rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl ${
            isDayMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <div className={`px-6 py-4 border-b flex items-center justify-between ${
              isDayMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/50 border-slate-800'
            }`}>
              <h3 className={`text-base font-bold ${isDayMode ? 'text-slate-900' : 'text-white'}`}>
                {editingItem ? 'Edit Stock Item' : 'Add New Inventory Item'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={`text-[11px] uppercase font-bold block mb-1 ${isDayMode ? 'text-slate-600' : 'text-slate-400'}`}>
                    SKU / Item Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-500 ${
                      isDayMode ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={`text-[11px] uppercase font-bold block mb-1 ${isDayMode ? 'text-slate-600' : 'text-slate-400'}`}>
                    Product Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Samsung 55 Inch Crystal 4K Smart TV"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-500 ${
                      isDayMode ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400' : 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={`text-[11px] uppercase font-bold block mb-1 ${isDayMode ? 'text-slate-600' : 'text-slate-400'}`}>
                    Category *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-500 ${
                      isDayMode ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  >
                    <option value="Electronics">Electronics</option>
                    <option value="Furniture">Furniture</option>
                    <option value="Home Appliances">Home Appliances</option>
                    <option value="Kitchen Appliances">Kitchen Appliances</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className={`text-[11px] uppercase font-bold block mb-1 ${isDayMode ? 'text-slate-600' : 'text-slate-400'}`}>
                    Brand Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Samsung, LG, Sai Artisan..."
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-500 ${
                      isDayMode ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400' : 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                    }`}
                  />
                </div>
                <div>
                  <label className={`text-[11px] uppercase font-bold block mb-1 ${isDayMode ? 'text-slate-600' : 'text-slate-400'}`}>
                    Model Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. GL-I292RPZX"
                    value={formModel}
                    onChange={(e) => setFormModel(e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-500 ${
                      isDayMode ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400' : 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={`text-[11px] uppercase font-bold block mb-1 ${isDayMode ? 'text-slate-600' : 'text-slate-400'}`}>
                    Purchase Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formPurchasePrice}
                    onChange={(e) => setFormPurchasePrice(parseFloat(e.target.value) || 0)}
                    className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-500 ${
                      isDayMode ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  />
                </div>
                <div>
                  <label className={`text-[11px] uppercase font-bold block mb-1 ${isDayMode ? 'text-slate-600' : 'text-slate-400'}`}>
                    Selling Rate (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formSalePrice}
                    onChange={(e) => setFormSalePrice(parseFloat(e.target.value) || 0)}
                    className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-500 ${
                      isDayMode ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  />
                </div>
                <div>
                  <label className={`text-[11px] uppercase font-bold block mb-1 ${isDayMode ? 'text-slate-600' : 'text-slate-400'}`}>
                    MRP (₹)
                  </label>
                  <input
                    type="number"
                    value={formMrp}
                    onChange={(e) => setFormMrp(parseFloat(e.target.value) || 0)}
                    className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-500 ${
                      isDayMode ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className={`text-[11px] uppercase font-bold block mb-1 ${isDayMode ? 'text-slate-600' : 'text-slate-400'}`}>
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    required
                    value={formStockQty}
                    onChange={(e) => setFormStockQty(parseInt(e.target.value) || 0)}
                    className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-500 ${
                      isDayMode ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  />
                </div>
                <div>
                  <label className={`text-[11px] uppercase font-bold block mb-1 ${isDayMode ? 'text-slate-600' : 'text-slate-400'}`}>
                    Min Alert Qty
                  </label>
                  <input
                    type="number"
                    value={formMinAlertQty}
                    onChange={(e) => setFormMinAlertQty(parseInt(e.target.value) || 0)}
                    className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-500 ${
                      isDayMode ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  />
                </div>
                <div>
                  <label className={`text-[11px] uppercase font-bold block mb-1 ${isDayMode ? 'text-slate-600' : 'text-slate-400'}`}>
                    Unit
                  </label>
                  <input
                    type="text"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-500 ${
                      isDayMode ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  />
                </div>
                <div>
                  <label className={`text-[11px] uppercase font-bold block mb-1 ${isDayMode ? 'text-slate-600' : 'text-slate-400'}`}>
                    Warranty (Months)
                  </label>
                  <input
                    type="number"
                    value={formWarrantyMonths}
                    onChange={(e) => setFormWarrantyMonths(parseInt(e.target.value) || 0)}
                    className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-500 ${
                      isDayMode ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`text-[11px] uppercase font-bold block mb-1 ${isDayMode ? 'text-slate-600' : 'text-slate-400'}`}>
                    Serial Number / Barcode
                  </label>
                  <input
                    type="text"
                    placeholder="Optional hardware serial"
                    value={formSerialNo}
                    onChange={(e) => setFormSerialNo(e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-500 ${
                      isDayMode ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400' : 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                    }`}
                  />
                </div>
                <div>
                  <label className={`text-[11px] uppercase font-bold block mb-1 ${isDayMode ? 'text-slate-600' : 'text-slate-400'}`}>
                    Location / Floor
                  </label>
                  <input
                    type="text"
                    placeholder="Floor 1 / Living Suite..."
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-500 ${
                      isDayMode ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400' : 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                    }`}
                  />
                </div>
              </div>

              <div className={`pt-4 border-t flex justify-end gap-2 ${
                isDayMode ? 'border-slate-200' : 'border-slate-800'
              }`}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className={`px-4 py-2 rounded-lg text-xs font-medium cursor-pointer transition ${
                    isDayMode ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs cursor-pointer shadow-md shadow-amber-500/20"
                >
                  {editingItem ? 'Save Changes' : 'Add Item to Catalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
