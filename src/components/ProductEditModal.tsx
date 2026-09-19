import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Upload,
  Image as ImageIcon,
  DollarSign,
  Package,
  Tag,
  Check,
  Trash2,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { StockItem } from '../types';

interface ProductEditModalProps {
  isOpen: boolean;
  item: StockItem | null;
  onClose: () => void;
  onSave: (savedItem: StockItem) => void;
  onDelete?: (itemId: string) => void;
}

const COMMON_CATEGORIES = [
  'Home Appliances',
  'Electronics',
  'Electricals',
  'Wires & Cables',
  'Fans & Coolers',
  'LED TVs & Audio',
  'Refrigerators & Washing Machines',
  'Hardware & Fittings',
  'Industrial',
  'Other'
];

export const ProductEditModal: React.FC<ProductEditModalProps> = ({
  isOpen,
  item,
  onClose,
  onSave,
  onDelete,
}) => {
  const isEditing = Boolean(item && item.id);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<StockItem>>({
    name: '',
    code: '',
    category: 'Home Appliances',
    quantity: 10,
    unit: 'Unit',
    sellingPrice: 0,
    purchasePrice: 0,
    minStockLevel: 2,
    imageUrl: '',
    description: '',
  });

  const [imageTab, setImageTab] = useState<'upload' | 'url'>('upload');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData({
        id: item.id,
        name: item.name,
        code: item.code,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        sellingPrice: item.sellingPrice,
        purchasePrice: item.purchasePrice,
        minStockLevel: item.minStockLevel,
        imageUrl: item.imageUrl || '',
        description: item.description || '',
      });
      setImageUrlInput(item.imageUrl || '');
    } else {
      const generatedCode = `STK-${Date.now().toString().slice(-4)}`;
      setFormData({
        name: '',
        code: generatedCode,
        category: 'Home Appliances',
        quantity: 5,
        unit: 'Unit',
        sellingPrice: 1000,
        purchasePrice: 800,
        minStockLevel: 2,
        imageUrl: '',
        description: '',
      });
      setImageUrlInput('');
    }
    setErrorMessage('');
  }, [item, isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('कृपया फक्त फोटो / इमेज निवडा (Please select an image file)');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setErrorMessage('फोटोचा आकार 4MB पेक्षा कमी असावा (Image must be under 4MB)');
      return;
    }
    setErrorMessage('');
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFormData((prev) => ({ ...prev, imageUrl: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      setErrorMessage('कृपया उत्पादनाचे नाव टाका (Product name is required)');
      return;
    }
    if ((formData.sellingPrice ?? 0) <= 0) {
      setErrorMessage('कृपया वैध विक्री किंमत सेट करा (Valid selling price is required)');
      return;
    }

    const finalItem: StockItem = {
      id: formData.id || `stk-${Date.now()}`,
      name: formData.name.trim(),
      code: formData.code?.trim() || `STK-${Date.now().toString().slice(-4)}`,
      category: formData.category || 'Home Appliances',
      quantity: Number(formData.quantity) || 0,
      unit: formData.unit || 'Unit',
      sellingPrice: Number(formData.sellingPrice) || 0,
      purchasePrice: Number(formData.purchasePrice) || 0,
      minStockLevel: Number(formData.minStockLevel) || 1,
      imageUrl: formData.imageUrl?.trim() || '',
      description: formData.description?.trim() || '',
    };

    onSave(finalItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-fade-in my-auto">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">
                {isEditing ? 'उत्पादनाची किंमत व फोटो बदला (Edit Product)' : 'नवीन उत्पादन जोडा (Add New Product)'}
              </h3>
              <p className="text-xs text-slate-400">
                श्री साई इंटरप्राइजेस • ॲडमिन इन्व्हेंटरी आणि कॅटलॉग व्यवस्थापन
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[82vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Photo Upload Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                उत्पादनाचा फोटो (Product Photo)
              </label>
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px]">
                <button
                  type="button"
                  onClick={() => setImageTab('upload')}
                  className={`px-2 py-0.5 rounded-md font-medium transition ${
                    imageTab === 'upload' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  गॅलरी / कॅमेरामधून
                </button>
                <button
                  type="button"
                  onClick={() => setImageTab('url')}
                  className={`px-2 py-0.5 rounded-md font-medium transition ${
                    imageTab === 'url' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  वेब URL
                </button>
              </div>
            </div>

            {formData.imageUrl ? (
              <div className="relative rounded-xl border border-slate-200 overflow-hidden bg-slate-50 p-2 flex items-center gap-4">
                <img
                  src={formData.imageUrl}
                  alt="Product Preview"
                  className="w-24 h-24 object-contain rounded-lg bg-white border border-slate-200"
                />
                <div className="flex-1 space-y-1 text-xs">
                  <p className="font-semibold text-emerald-700 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> फोटो जोडला गेला आहे
                  </p>
                  <p className="text-slate-500 text-[11px]">
                    हा फोटो ग्राहक वेबसाइट आणि कार्टवर थेट दिसेल.
                  </p>
                  <div className="pt-1 flex gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1 rounded-md bg-slate-200 hover:bg-slate-300 text-slate-800 text-[11px] font-medium transition cursor-pointer"
                    >
                      फोटो बदला
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, imageUrl: '' }))}
                      className="px-2.5 py-1 rounded-md bg-red-50 hover:bg-red-100 text-red-600 text-[11px] font-medium transition cursor-pointer"
                    >
                      काढा
                    </button>
                  </div>
                </div>
              </div>
            ) : imageTab === 'upload' ? (
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50/50'
                    : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-800">
                    फोटो अपलोड करण्यासाठी येथे क्लिक करा किंवा ड्रॅग करा
                  </p>
                  <p className="text-[11px] text-slate-500">
                    PNG, JPG, WEBP • कमाल आकार 4MB
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="url"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  placeholder="https://example.com/product-image.jpg"
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (imageUrlInput.trim()) {
                      setFormData((prev) => ({ ...prev, imageUrl: imageUrlInput.trim() }));
                    }
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 cursor-pointer"
                >
                  जोडा
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Product Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-bold text-slate-700">
                उत्पादनाचे नाव (Product Title / Name) *
              </label>
              <input
                type="text"
                required
                value={formData.name || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="उदा. Smart LED TV 43 Inch 4K Ultra HD"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                कॅटेगरी (Category)
              </label>
              <select
                value={formData.category || 'Home Appliances'}
                onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium bg-white focus:ring-2 focus:ring-blue-500 outline-hidden"
              >
                {COMMON_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                आयटम कोड (Product Code / SKU)
              </label>
              <input
                type="text"
                value={formData.code || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value }))}
                placeholder="उदा. TV-43-4K"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-hidden"
              />
            </div>
          </div>

          {/* Pricing Controls: The core user requirement! */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                किंमत दर निश्चिती (Price & Rate Setting)
              </span>
              <span className="text-[11px] text-amber-800 font-semibold">
                ग्राहकांना दिसणारी किंमत
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-900 flex items-center gap-1">
                  विक्री किंमत (Selling Price / Retail Price ₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-bold text-xs">₹</span>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.sellingPrice || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, sellingPrice: Number(e.target.value) }))
                    }
                    placeholder="12500"
                    className="w-full pl-7 pr-3 py-2 bg-white border border-amber-300 rounded-xl text-sm font-black font-mono text-slate-900 focus:ring-2 focus:ring-amber-500 outline-hidden shadow-2xs"
                  />
                </div>
                <p className="text-[10px] text-slate-500">
                  लँडिंग पेजवर आणि कार्टमध्ये हीच किंमत ग्राहकाला दिसेल.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  खरेदी किंमत (Purchase / Cost Price ₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-bold text-xs">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={formData.purchasePrice || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, purchasePrice: Number(e.target.value) }))
                    }
                    placeholder="9800"
                    className="w-full pl-7 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold font-mono text-slate-700 focus:ring-2 focus:ring-blue-500 outline-hidden"
                  />
                </div>
                <p className="text-[10px] text-slate-500">
                  नफा गणनेसाठी अंतर्गत दुकानाची खरेदी किंमत (ग्राहकाला दिसत नाही).
                </p>
              </div>
            </div>
          </div>

          {/* Stock Quantity and Units */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                शिल्लक संख्या (Stock Quantity)
              </label>
              <input
                type="number"
                min="0"
                value={formData.quantity ?? 1}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, quantity: Number(e.target.value) }))
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                युनिट (Unit)
              </label>
              <input
                type="text"
                value={formData.unit || 'Unit'}
                onChange={(e) => setFormData((prev) => ({ ...prev, unit: e.target.value }))}
                placeholder="Unit, Piece, Pack, Roll"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-hidden"
              />
            </div>
          </div>

          {/* Description / Features */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">
              वर्णन व वैशिष्ट्ये (Description / Features)
            </label>
            <textarea
              rows={2}
              value={formData.description || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="उदा. 1 वर्षाची कंपनी वॉरंटी, 5-स्टार ऊर्जा बचत, मोफत होम डिलिव्हरी उपलब्ध..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs leading-relaxed focus:ring-2 focus:ring-blue-500 outline-hidden"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
            {isEditing && onDelete && (
              confirmDelete ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (item) {
                        onDelete(item.id);
                        onClose();
                      }
                    }}
                    className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    नक्की काढून टाका
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="text-xs text-slate-500 hover:text-slate-800 underline"
                  >
                    रद्द
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  काढून टाका
                </button>
              )
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
              >
                रद्द करा
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Check className="w-4 h-4" />
                {isEditing ? 'बदल जतन करा (Save Price & Photo)' : 'नवीन उत्पादन जोडा (Add Product)'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
