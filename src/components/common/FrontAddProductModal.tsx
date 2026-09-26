import React, { useState } from 'react';
import {
  X,
  PackagePlus,
  Barcode,
  Tag,
  Boxes,
  CheckCircle2,
  DollarSign,
  Layers,
  MapPin,
  ShieldCheck
} from 'lucide-react';
import { StockItem } from '../../types';
import { StorageService } from '../../services/storageService';
import { useTheme } from '../../context/ThemeContext';

interface FrontAddProductModalProps {
  onClose: () => void;
  onRefreshData: () => void;
  onProductAdded?: (item: StockItem) => void;
}

export const FrontAddProductModal: React.FC<FrontAddProductModalProps> = ({
  onClose,
  onRefreshData,
  onProductAdded,
}) => {
  const { isDayMode } = useTheme();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<StockItem['category']>('Electronics');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [serialNo, setSerialNo] = useState('');
  const [barcode, setBarcode] = useState(`SSE-${Date.now().toString().slice(-6)}`);
  const [purchasePrice, setPurchasePrice] = useState<string>('');
  const [salePrice, setSalePrice] = useState<string>('');
  const [mrp, setMrp] = useState<string>('');
  const [stockQty, setStockQty] = useState<string>('1');
  const [minAlertQty, setMinAlertQty] = useState<string>('2');
  const [unit, setUnit] = useState('Pcs');
  const [location, setLocation] = useState('Main Showroom');
  const [warrantyMonths, setWarrantyMonths] = useState<string>('12');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('कृपया उत्पादनाचे नाव टाका (Please enter product name).');
      return;
    }

    const pPrice = parseFloat(purchasePrice) || 0;
    const sPrice = parseFloat(salePrice) || (pPrice > 0 ? Math.round(pPrice * 1.2) : 0);
    const mPrice = parseFloat(mrp) || (sPrice > 0 ? Math.round(sPrice * 1.15) : 0);
    const qty = parseInt(stockQty) || 1;

    const newItem = StorageService.addStockItem({
      code: barcode.trim() || `SSE-${Date.now().toString().slice(-6)}`,
      name: name.trim(),
      category: category,
      brand: brand.trim() || 'General',
      model: model.trim() || 'Standard',
      serialNo: serialNo.trim() || undefined,
      purchasePrice: pPrice,
      salePrice: sPrice,
      mrp: mPrice,
      stockQty: qty,
      minAlertQty: parseInt(minAlertQty) || 2,
      unit: unit,
      location: location.trim() || 'Main Showroom',
      warrantyMonths: parseInt(warrantyMonths) || 12,
    });

    onRefreshData();
    if (onProductAdded) {
      onProductAdded(newItem);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className={`w-full max-w-2xl rounded-2xl shadow-2xl border transition-colors overflow-hidden ${
        isDayMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
      }`}>
        {/* Header */}
        <div className={`p-4 border-b flex items-center justify-between ${
          isDayMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/30">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">नवीन उत्पादन जोडा (Front Add Product)</h3>
              <p className={`text-xs ${isDayMode ? 'text-slate-500' : 'text-slate-400'}`}>
                थेट शोरूम स्टॉक आणि विक्री सूचीमध्ये वस्तू नोंदवा
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-lg transition ${
              isDayMode ? 'text-slate-400 hover:text-slate-800 hover:bg-slate-200' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4 text-xs">
          {/* Row 1: Product Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1">
                उत्पादनाचे नाव (Product Name) *
              </label>
              <input
                type="text"
                placeholder="उदा. Samsung 43 Inch 4K Smart TV / Wooden Double Bed"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className={`w-full rounded-xl px-3 py-2 border focus:outline-none focus:border-amber-500 ${
                  isDayMode
                    ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                    : 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                }`}
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1">
                प्रवर्ग (Category)
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as StockItem['category'])}
                className={`w-full rounded-xl px-3 py-2 border focus:outline-none focus:border-amber-500 ${
                  isDayMode
                    ? 'bg-slate-50 border-slate-300 text-slate-900'
                    : 'bg-slate-800 border-slate-700 text-white'
                }`}
              >
                <option value="Electronics">Electronics (इलेक्ट्रॉनिक्स)</option>
                <option value="Furniture">Furniture (फर्निचर)</option>
                <option value="Home Appliances">Home Appliances (घरगुती उपकरणे)</option>
                <option value="Mobile">Mobile & Tablets (मोबाईल)</option>
                <option value="Kitchen Appliances">Kitchen (किचन)</option>
                <option value="Other">Other (इतर)</option>
              </select>
            </div>
          </div>

          {/* Row 2: Brand, Model No, Serial No / IMEI */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1">
                ब्रँड / कंपनी (Brand)
              </label>
              <input
                type="text"
                placeholder="उदा. LG, Samsung, Whirlpool, Godrej"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className={`w-full rounded-xl px-3 py-2 border focus:outline-none focus:border-amber-500 ${
                  isDayMode
                    ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                    : 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                }`}
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1">
                मॉडेल नंबर (Model No.)
              </label>
              <input
                type="text"
                placeholder="उदा. 43UR7500 / RT28"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className={`w-full rounded-xl px-3 py-2 border focus:outline-none focus:border-amber-500 ${
                  isDayMode
                    ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                    : 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                }`}
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1">
                सिरियल / IMEI नंबर (Serial No.)
              </label>
              <input
                type="text"
                placeholder="उदा. SN-8921820"
                value={serialNo}
                onChange={(e) => setSerialNo(e.target.value)}
                className={`w-full rounded-xl px-3 py-2 font-mono border focus:outline-none focus:border-amber-500 ${
                  isDayMode
                    ? 'bg-slate-50 border-slate-300 text-amber-700 placeholder-slate-400'
                    : 'bg-slate-800 border-slate-700 text-amber-300 placeholder-slate-500'
                }`}
              />
            </div>
          </div>

          {/* Row 3: Barcode/SKU, Stock Qty, Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1">
                बारकोड / कोड (SKU Code)
              </label>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className={`w-full rounded-xl px-3 py-2 font-mono border focus:outline-none focus:border-amber-500 ${
                  isDayMode
                    ? 'bg-slate-50 border-slate-300 text-slate-900'
                    : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1">
                स्टॉक संख्या (Initial Qty) *
              </label>
              <input
                type="number"
                min="1"
                value={stockQty}
                onChange={(e) => setStockQty(e.target.value)}
                required
                className={`w-full rounded-xl px-3 py-2 font-mono border focus:outline-none focus:border-amber-500 ${
                  isDayMode
                    ? 'bg-slate-50 border-slate-300 text-slate-900'
                    : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1">
                युनिट (Unit)
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className={`w-full rounded-xl px-3 py-2 border focus:outline-none focus:border-amber-500 ${
                  isDayMode
                    ? 'bg-slate-50 border-slate-300 text-slate-900'
                    : 'bg-slate-800 border-slate-700 text-white'
                }`}
              >
                <option value="Pcs">Pcs (नग)</option>
                <option value="Set">Set (संच)</option>
                <option value="Nos">Nos</option>
                <option value="Box">Box</option>
              </select>
            </div>
          </div>

          {/* Row 4: Pricing (Purchase Price, Sale Price, MRP) */}
          <div className={`p-3.5 rounded-xl border grid grid-cols-1 sm:grid-cols-3 gap-3 ${
            isDayMode ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-slate-500">
                खरेदी दर (Purchase Rate) ₹
              </label>
              <input
                type="number"
                min="0"
                placeholder="उदा. 25000"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                className={`w-full rounded-xl px-3 py-2 font-mono border focus:outline-none focus:border-amber-500 ${
                  isDayMode
                    ? 'bg-white border-slate-300 text-slate-900'
                    : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-emerald-600 dark:text-emerald-400">
                विक्री दर (Sale Price) ₹ *
              </label>
              <input
                type="number"
                min="0"
                placeholder="उदा. 29500"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                required
                className={`w-full rounded-xl px-3 py-2 font-mono font-bold border focus:outline-none focus:border-emerald-500 ${
                  isDayMode
                    ? 'bg-white border-emerald-300 text-emerald-700'
                    : 'bg-slate-800 border-emerald-500/40 text-emerald-300'
                }`}
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-slate-500">
                छापील किंमत (MRP) ₹
              </label>
              <input
                type="number"
                min="0"
                placeholder="उदा. 34990"
                value={mrp}
                onChange={(e) => setMrp(e.target.value)}
                className={`w-full rounded-xl px-3 py-2 font-mono border focus:outline-none focus:border-amber-500 ${
                  isDayMode
                    ? 'bg-white border-slate-300 text-slate-900'
                    : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>
          </div>

          {/* Row 5: Location & Warranty */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1">
                जागा / रॅक (Location)
              </label>
              <input
                type="text"
                placeholder="Floor 1, Rack B, Main Showroom"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className={`w-full rounded-xl px-3 py-2 border focus:outline-none focus:border-amber-500 ${
                  isDayMode
                    ? 'bg-slate-50 border-slate-300 text-slate-900'
                    : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1">
                वॉरंटी (Warranty in Months)
              </label>
              <input
                type="number"
                value={warrantyMonths}
                onChange={(e) => setWarrantyMonths(e.target.value)}
                className={`w-full rounded-xl px-3 py-2 border focus:outline-none focus:border-amber-500 ${
                  isDayMode
                    ? 'bg-slate-50 border-slate-300 text-slate-900'
                    : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className={`pt-3 border-t flex justify-end gap-2 ${
            isDayMode ? 'border-slate-200' : 'border-slate-800'
          }`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl font-medium transition ${
                isDayMode ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              रद्द करा (Cancel)
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer transition active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>उत्पादन सेव्ह करा (Save Product)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
