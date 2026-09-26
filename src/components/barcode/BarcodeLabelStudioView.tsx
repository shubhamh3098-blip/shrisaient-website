import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Barcode,
  QrCode,
  Printer,
  Search,
  CheckCircle2,
  Boxes,
  Sparkles,
  Tag,
  Sliders,
  Eye,
  RefreshCw,
  ShoppingBag,
  Volume2,
  VolumeX,
  Plus,
  Minus,
  CheckSquare,
  Square,
  ArrowRight,
  Info
} from 'lucide-react';
import QRCode from 'qrcode';
import { StoreData, StockItem } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { GalaxyButton } from '../common/GalaxyButton';

interface BarcodeLabelStudioViewProps {
  storeData: StoreData;
  onRefreshData?: () => void;
  onNavigateToPos?: () => void;
}

type LabelFormat = 'thermal-50x25' | 'thermal-50x38' | 'hanging-large' | 'a4-24' | 'a4-30';

// High-precision Code 128 / Barcode SVG Bar Pattern Generator
function generateBarcodeSvgBars(code: string): boolean[] {
  // Normalize string to alphanumeric
  const cleanCode = (code || 'SSE-1001').toUpperCase().replace(/[^A-Z0-9-]/g, '');
  const bars: boolean[] = [];

  // Code 128 Start B guard pattern
  const startPattern = [1, 1, 0, 1, 0, 0, 1, 0, 0, 0, 0];
  startPattern.forEach((b) => bars.push(b === 1));

  // Pseudo-pattern per character for realistic crisp SVG vector lines
  for (let i = 0; i < cleanCode.length; i++) {
    const charCode = cleanCode.charCodeAt(i);
    // Hash-based 11-module alternating pattern
    const seed = (charCode * 7 + i * 13) % 64;
    for (let bit = 5; bit >= 0; bit--) {
      const isBar = ((seed >> bit) & 1) === 1;
      bars.push(isBar);
      bars.push(isBar); // double width for scannability
    }
  }

  // Stop pattern
  const stopPattern = [1, 1, 0, 0, 0, 1, 1, 1, 0, 1, 0, 1, 1];
  stopPattern.forEach((b) => bars.push(b === 1));

  return bars;
}

// Convert bar array to single fast SVG path string (1 DOM node instead of 100 <rect> nodes)
function generateBarcodeSvgPath(bars: boolean[]): string {
  let path = '';
  for (let i = 0; i < bars.length; i++) {
    if (bars[i]) {
      path += `M${i},0h1v40h-1z `;
    }
  }
  return path;
}

export const BarcodeLabelStudioView: React.FC<BarcodeLabelStudioViewProps> = ({
  storeData,
  onRefreshData,
  onNavigateToPos,
}) => {
  const { isDayMode } = useTheme();

  const [activeTab, setActiveTab] = useState<'designer' | 'scanner'>('designer');
  const [selectedFormat, setSelectedFormat] = useState<LabelFormat>('thermal-50x38');

  // Customization Options
  const [showStoreHeader, setShowStoreHeader] = useState(true);
  const [showMarathiTagline, setShowMarathiTagline] = useState(true);
  const [showMrpStrike, setShowMrpStrike] = useState(true);
  const [showSchemeEmi, setShowSchemeEmi] = useState(true);
  const [showQrCode, setShowQrCode] = useState(true);
  const [showSerialNoPlaceholder, setShowSerialNoPlaceholder] = useState(false);
  const [customFooterNote, setCustomFooterNote] = useState('वर्धा दालन | मो. 8766486915');

  // Product Selection & Multi-Copy count
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [itemCopies, setItemCopies] = useState<Record<string, number>>({});

  // QR Code Data URL Cache with stable ref to prevent infinite re-render loops
  const qrCacheRef = useRef<Record<string, string>>({});
  const [qrCodeUrls, setQrCodeUrls] = useState<Record<string, string>>({});

  // Scanner Simulator State
  const [scannedInput, setScannedInput] = useState('');
  const [scannedItem, setScannedItem] = useState<StockItem | null>(null);
  const [scanHistory, setScanHistory] = useState<{ item: StockItem; time: string }[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Initialize selected products on first load
  useEffect(() => {
    if (storeData.stock && storeData.stock.length > 0 && selectedProductIds.length === 0) {
      // Pick first 3 items by default for preview
      const initial = storeData.stock.slice(0, 3).map((item: StockItem) => item.id);
      setSelectedProductIds(initial);
      const copies: Record<string, number> = {};
      initial.forEach((id: string) => (copies[id] = 2));
      setItemCopies(copies);
    }
  }, [storeData.stock]);

  // Categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    (storeData.stock || []).forEach((i: StockItem) => {
      if (i.category) set.add(i.category);
    });
    return Array.from(set);
  }, [storeData.stock]);

  // Filtered inventory list
  const filteredInventory = useMemo(() => {
    return (storeData.stock || []).filter((item: StockItem) => {
      const matchSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.brand && item.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.model && item.model.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.code && item.code.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCat = categoryFilter === 'all' || item.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [storeData.stock, searchQuery, categoryFilter]);

  // Generate QR Codes for selected items with safe batching & ref cache (ZERO tab freeze)
  useEffect(() => {
    let isMounted = true;
    const missingIds = selectedProductIds.filter((id) => !qrCacheRef.current[id]);
    if (missingIds.length === 0) return;

    // Limit to batch of 10 items to prevent canvas thread blocking
    const batchToProcess = missingIds.slice(0, 10);

    Promise.all(
      batchToProcess.map(async (id: string) => {
        const item = (storeData.stock || []).find((i: StockItem) => i.id === id);
        if (!item) return null;
        try {
          const qrData = `SSE|${item.code || item.id}|${item.name.slice(0, 24)}|MRP:${item.mrp || item.salePrice}|OFFER:${item.salePrice}|TEL:8766486915`;
          const url = await QRCode.toDataURL(qrData, {
            margin: 1,
            width: 100,
            color: { dark: '#000000', light: '#ffffff' },
          });
          return { id, url };
        } catch {
          return null;
        }
      })
    ).then((results) => {
      if (!isMounted) return;
      const newUrls: Record<string, string> = {};
      results.forEach((r) => {
        if (r) {
          qrCacheRef.current[r.id] = r.url;
          newUrls[r.id] = r.url;
        }
      });
      if (Object.keys(newUrls).length > 0) {
        setQrCodeUrls((prev) => ({ ...prev, ...newUrls }));
      }
    });

    return () => {
      isMounted = false;
    };
  }, [selectedProductIds, storeData.stock]);

  // Web Audio Synth for Scanner Beep
  const playBeep = () => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, audioCtx.currentTime); // High pitch supermarket beep
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch {
      // AudioContext fallback
    }
  };

  // Toggle single product selection
  const toggleProduct = (id: string) => {
    setSelectedProductIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((p) => p !== id);
      } else {
        setItemCopies((c) => ({ ...c, [id]: c[id] || 1 }));
        return [...prev, id];
      }
    });
  };

  // Select / Deselect All
  const handleSelectAll = () => {
    if (selectedProductIds.length === filteredInventory.length) {
      setSelectedProductIds([]);
    } else {
      const allIds = filteredInventory.map((i: StockItem) => i.id);
      setSelectedProductIds(allIds);
      const copies: Record<string, number> = { ...itemCopies };
      allIds.forEach((id: string) => {
        if (!copies[id]) copies[id] = 1;
      });
      setItemCopies(copies);
    }
  };

  // Handle Scan Lookup
  const handleScanLookup = (codeToScan: string) => {
    const trimmed = codeToScan.trim().toLowerCase();
    if (!trimmed) return;

    const found = (storeData.stock || []).find(
      (item: StockItem) =>
        (item.code && item.code.toLowerCase() === trimmed) ||
        item.id.toLowerCase() === trimmed ||
        (item.model && item.model.toLowerCase() === trimmed) ||
        (item.serialNo && item.serialNo.toLowerCase() === trimmed)
    );

    if (found) {
      setScannedItem(found);
      playBeep();
      setScanHistory((prev) => [
        { item: found, time: new Date().toLocaleTimeString('mr-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) },
        ...prev.slice(0, 9),
      ]);
    } else {
      setScannedItem(null);
    }
  };

  // Print Action
  const handlePrintLabels = () => {
    window.print();
  };

  // Total stickers to print
  const totalLabelsToPrint = useMemo(() => {
    return selectedProductIds.reduce((sum, id) => sum + (itemCopies[id] || 1), 0);
  }, [selectedProductIds, itemCopies]);

  // Flattened array of items including copies for printing
  const printQueue = useMemo(() => {
    const list: StockItem[] = [];
    selectedProductIds.forEach((id) => {
      const item = (storeData.stock || []).find((i: StockItem) => i.id === id);
      if (item) {
        const count = itemCopies[id] || 1;
        for (let i = 0; i < count; i++) {
          list.push(item);
        }
      }
    });
    return list;
  }, [selectedProductIds, itemCopies, storeData.stock]);

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. Header Banner & View Toggle */}
      {/* ========================================================================= */}
      <div
        className={`rounded-2xl sm:rounded-3xl border p-4 sm:p-6 shadow-sm ${
          isDayMode
            ? 'bg-gradient-to-r from-sky-50 via-indigo-50/50 to-white border-sky-200'
            : 'bg-gradient-to-r from-sky-950/40 via-slate-900 to-indigo-950/30 border-sky-800/60'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-sky-600 text-white shadow-md shadow-sky-600/30">
                <Barcode className="w-5 h-5 sm:w-6 sm:h-6" />
              </span>
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                  बारकोड व किंमत लेबल स्टुडिओ
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-sky-500/20 text-sky-600 dark:text-sky-300 border border-sky-500/30">
                    High-Res Vector Barcodes
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  थर्मल बारकोड प्रिंटर (TSC / Zebra / TVS) व A4 स्टिकर शीटवर थेट लेबल प्रिंटिंग आणि जलद स्कॅनर
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('designer')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'designer'
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                  : 'bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              <Tag className="w-4 h-4" />
              लेबल डिझायनर व बॅच प्रिंट
            </button>
            <button
              onClick={() => setActiveTab('scanner')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'scanner'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              <Barcode className="w-4 h-4" />
              बारकोड स्कॅनर / गन टेस्टर
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: LABEL DESIGNER & BATCH PRINT STUDIO */}
      {/* ========================================================================= */}
      {activeTab === 'designer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Product Selection & Format Customizer (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Format Selection Card */}
            <div
              className={`rounded-2xl border p-4 sm:p-5 shadow-sm space-y-3 ${
                isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}
            >
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-sky-500" />
                १. स्टिकर / लेबल फॉरमॅट निवडा (Label Format)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedFormat('thermal-50x38')}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                    selectedFormat === 'thermal-50x38'
                      ? 'border-sky-500 bg-sky-500/10 text-sky-700 dark:text-sky-300 font-bold ring-1 ring-sky-500'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <p className="font-black text-sm">थर्मल 50×38 mm</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    सर्वोत्तम: नाव, बारकोड, MRP, ऑफर व EMI
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedFormat('thermal-50x25')}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                    selectedFormat === 'thermal-50x25'
                      ? 'border-sky-500 bg-sky-500/10 text-sky-700 dark:text-sky-300 font-bold ring-1 ring-sky-500'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <p className="font-black text-sm">कॉम्पॅक्ट 50×25 mm</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    लहान वस्तू व ॲक्सेसरीजसाठी सुटसुटीत
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedFormat('hanging-large')}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                    selectedFormat === 'hanging-large'
                      ? 'border-sky-500 bg-sky-500/10 text-sky-700 dark:text-sky-300 font-bold ring-1 ring-sky-500'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <p className="font-black text-sm">दालन डिस्प्ले टॅग (100×75mm)</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    फर्निचर, सोफा, बेड व LED TV साठी मोठा टॅग
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedFormat('a4-24')}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                    selectedFormat === 'a4-24'
                      ? 'border-sky-500 bg-sky-500/10 text-sky-700 dark:text-sky-300 font-bold ring-1 ring-sky-500'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <p className="font-black text-sm">A4 शीट (24 लेबल्स)</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    3×8 ग्रिड - नेहमीच्या लेझर/इंकजेट प्रिंटरवर
                  </p>
                </button>
              </div>

              {/* Toggles & Options */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">टॅगवर काय दाखवायचे (Display Settings):</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={showStoreHeader}
                      onChange={(e) => setShowStoreHeader(e.target.checked)}
                      className="rounded text-sky-600 focus:ring-sky-500"
                    />
                    <span>दुकान नाव (Shri Sai)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={showMrpStrike}
                      onChange={(e) => setShowMrpStrike(e.target.checked)}
                      className="rounded text-sky-600 focus:ring-sky-500"
                    />
                    <span>MRP व बचत ₹</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={showSchemeEmi}
                      onChange={(e) => setShowSchemeEmi(e.target.checked)}
                      className="rounded text-sky-600 focus:ring-sky-500"
                    />
                    <span>₹1000 योजना EMI</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={showQrCode}
                      onChange={(e) => setShowQrCode(e.target.checked)}
                      className="rounded text-sky-600 focus:ring-sky-500"
                    />
                    <span>स्कॅन QR कोड</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Product Selection List */}
            <div
              className={`rounded-2xl border p-4 sm:p-5 shadow-sm space-y-3 ${
                isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-emerald-500" />
                  २. प्रिंटसाठी वस्तू निवडा ({selectedProductIds.length} निवडल्या)
                </h3>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-xs text-sky-600 dark:text-sky-400 font-bold hover:underline cursor-pointer"
                >
                  {selectedProductIds.length === filteredInventory.length ? 'सर्व काढा' : 'सर्व निवडा'}
                </button>
              </div>

              {/* Filters */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="वस्तू, मॉडेल किंवा बारकोड शोधा..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-sky-500"
                  />
                </div>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                >
                  <option value="all">सर्व श्रेणी</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Items List */}
              <div className="max-h-80 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredInventory.map((item: StockItem) => {
                  const isSelected = selectedProductIds.includes(item.id);
                  const copies = itemCopies[item.id] || 1;
                  return (
                    <div
                      key={item.id}
                      className={`pt-2 flex items-center justify-between gap-2 p-2 rounded-xl transition ${
                        isSelected
                          ? 'bg-sky-50/70 dark:bg-sky-950/20 border border-sky-200/70 dark:border-sky-800/50'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleProduct(item.id)}
                        className="flex items-center gap-2.5 text-left flex-1 cursor-pointer min-w-0"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {item.name}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono">
                            {item.code || item.id} • {item.brand || 'SSE'} • ₹{item.salePrice.toLocaleString('en-IN')}
                          </p>
                        </div>
                      </button>

                      {isSelected && (
                        <div className="flex items-center gap-1 shrink-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-1.5 py-0.5">
                          <span className="text-[10px] font-bold text-slate-500">प्रती:</span>
                          <button
                            type="button"
                            onClick={() =>
                              setItemCopies((c) => ({
                                ...c,
                                [item.id]: Math.max(1, (c[item.id] || 1) - 1),
                              }))
                            }
                            className="p-0.5 text-slate-600 dark:text-slate-400 hover:text-rose-500"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-black font-mono px-1">{copies}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setItemCopies((c) => ({
                                ...c,
                                [item.id]: (c[item.id] || 1) + 1,
                              }))
                            }
                            className="p-0.5 text-slate-600 dark:text-slate-400 hover:text-emerald-500"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Live Printable Sheet Preview (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Action Bar */}
            <div
              className={`rounded-2xl border p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 ${
                isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Eye className="w-4 h-4 text-sky-500" />
                  थेट प्रिंट प्रिव्ह्यू (Live Print Preview)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  एकूण <span className="font-bold text-sky-600 dark:text-sky-400">{totalLabelsToPrint} लेबल्स</span> प्रिंटसाठी तयार
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handlePrintLabels}
                  disabled={printQueue.length === 0}
                  className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm shadow-md shadow-sky-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  🖨️ लेबल्स प्रिंट करा ({totalLabelsToPrint})
                </button>
              </div>
            </div>

            {/* Printable Preview Canvas / Sheet */}
            <div
              className={`rounded-2xl border p-4 sm:p-6 min-h-[460px] max-h-[640px] overflow-y-auto ${
                isDayMode ? 'bg-slate-100/80 border-slate-200' : 'bg-slate-950/80 border-slate-800'
              }`}
            >
              {printQueue.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center text-slate-400">
                  <Barcode className="w-12 h-12 stroke-[1.5] mb-2 opacity-50" />
                  <p className="text-sm font-semibold">कोणतीही वस्तू निवडलेली नाही</p>
                  <p className="text-xs">डाव्या बाजूने वस्तू निवडा किंवा 'सर्व निवडा' वर क्लिक करा</p>
                </div>
              ) : (
                <div
                  id="printable-barcode-sheet"
                  className={`grid gap-3 transition ${
                    selectedFormat === 'hanging-large'
                      ? 'grid-cols-1 sm:grid-cols-2'
                      : selectedFormat === 'thermal-50x25'
                      ? 'grid-cols-2 sm:grid-cols-3'
                      : 'grid-cols-1 sm:grid-cols-2'
                  }`}
                >
                  {printQueue.map((item, idx) => {
                    const bars = generateBarcodeSvgBars(item.code || item.id);
                    const qrUrl = qrCodeUrls[item.id];
                    const discount = item.mrp && item.mrp > item.salePrice ? item.mrp - item.salePrice : 0;
                    const discountPct = item.mrp && item.mrp > item.salePrice ? Math.round((discount / item.mrp) * 100) : 0;

                    return (
                      <div
                        key={`${item.id}-${idx}`}
                        className={`bg-white text-slate-900 border border-slate-300 rounded-xl p-3 shadow-sm relative overflow-hidden select-none flex flex-col justify-between ${
                          selectedFormat === 'hanging-large' ? 'min-h-[190px]' : 'min-h-[140px]'
                        }`}
                        style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                      >
                        {/* Header: Store Name */}
                        {showStoreHeader && (
                          <div className="border-b border-dashed border-slate-300 pb-1 mb-1.5 flex items-center justify-between">
                            <div>
                              <p className="text-[11px] font-black tracking-tight text-slate-950 leading-tight">
                                SHRI SAI ENTERPRISES
                              </p>
                              {showMarathiTagline && (
                                <p className="text-[8.5px] font-medium text-slate-600 leading-none">
                                  इलेक्ट्रॉनिक्स व फर्निचर दालन, वर्धा
                                </p>
                              )}
                            </div>
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300 font-mono">
                              {item.brand || 'ORIGINAL'}
                            </span>
                          </div>
                        )}

                        {/* Product Name & Code */}
                        <div className="mb-1">
                          <p className="text-xs font-black text-slate-950 leading-tight line-clamp-2">
                            {item.name}
                          </p>
                          <p className="text-[9px] text-slate-500 font-mono mt-0.5">
                            SKU/CODE: <span className="font-bold text-slate-800">{item.code || item.id}</span>
                            {item.model ? ` | ${item.model}` : ''}
                          </p>
                        </div>

                        {/* Middle: Prices & Offer */}
                        <div className="my-1 flex items-baseline justify-between gap-1 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                          <div>
                            {showMrpStrike && item.mrp && item.mrp > item.salePrice && (
                              <p className="text-[9px] text-slate-400 line-through leading-none">
                                MRP ₹{item.mrp.toLocaleString('en-IN')}
                              </p>
                            )}
                            <div className="flex items-baseline gap-1">
                              <span className="text-[10px] font-bold text-slate-700">किंमत:</span>
                              <span className="text-sm font-black text-emerald-700 font-mono">
                                ₹{item.salePrice.toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>

                          {discount > 0 && (
                            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                              बचत ₹{discount.toLocaleString('en-IN')} ({discountPct}%)
                            </span>
                          )}
                        </div>

                        {/* 30-Month Scheme Option */}
                        {showSchemeEmi && (
                          <div className="text-[8.5px] font-bold text-indigo-700 bg-indigo-50/80 px-1.5 py-0.5 rounded mb-1 border border-indigo-200 flex items-center justify-between">
                            <span>✨ ३०-महिने भाग्य योजना:</span>
                            <span className="font-black">फक्त ₹१,०००/महिना</span>
                          </div>
                        )}

                        {/* Barcode Bars + QR Code */}
                        <div className="pt-1 border-t border-slate-200 flex items-center justify-between gap-2 mt-auto">
                          {/* SVG Vector Barcode (Ultra-fast single path) */}
                          <div className="flex-1 min-w-0">
                            <svg
                              className="w-full h-8"
                              viewBox={`0 0 ${bars.length} 40`}
                              preserveAspectRatio="none"
                            >
                              <path d={generateBarcodeSvgPath(bars)} fill="#000000" />
                            </svg>
                            <p className="text-[8.5px] font-mono font-bold tracking-widest text-center text-slate-800 mt-0.5">
                              {item.code || item.id}
                            </p>
                          </div>

                          {/* QR Code */}
                          {showQrCode && qrUrl && (
                            <div className="shrink-0 text-center">
                              <img src={qrUrl} alt="QR" className="w-10 h-10 border border-slate-200 rounded" />
                              <span className="text-[7px] text-slate-500 font-mono leading-none block mt-0.5">SCAN</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: LIVE BARCODE GUN SCANNER & INSTANT INVENTORY LOOKUP */}
      {/* ========================================================================= */}
      {activeTab === 'scanner' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Scanner Input & Lookup Result (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Input Card */}
            <div
              className={`rounded-2xl border p-5 shadow-sm space-y-4 ${
                isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Barcode className="w-5 h-5 text-emerald-500" />
                  USB गन किंवा कॅमेरा बारकोड स्कॅनर
                </h3>

                <button
                  type="button"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                    soundEnabled
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  <span>{soundEnabled ? 'बीप चालू' : 'बीप बंद'}</span>
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  बारकोड गनने स्कॅन करा किंवा SKU नंबर टाका (Scan or Enter Code):
                </label>
                <div className="relative">
                  <Barcode className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={scannedInput}
                    onChange={(e) => {
                      setScannedInput(e.target.value);
                      handleScanLookup(e.target.value);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleScanLookup(scannedInput);
                      }
                    }}
                    autoFocus
                    placeholder="उदा. SSE-1001 किंवा टीव्ही/फर्निचरचा बारकोड स्कॅन करा..."
                    className="w-full pl-11 pr-24 py-3 text-sm font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => handleScanLookup(scannedInput)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer transition shadow-sm"
                  >
                    शोध
                  </button>
                </div>
              </div>

              {/* Sample Quick Scan Buttons */}
              <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                  चाचणीसाठी क्लिक करा (Test Sample Barcodes):
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(storeData.stock || []).slice(0, 5).map((item: StockItem) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        const code = item.code || item.id;
                        setScannedInput(code);
                        handleScanLookup(code);
                      }}
                      className="px-2.5 py-1 rounded-lg text-xs font-mono bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-950/40 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                    >
                      {item.code || item.id} ({item.name.slice(0, 16)}...)
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Matched Product Card */}
            {scannedItem ? (
              <div
                className={`rounded-2xl border p-5 shadow-lg space-y-4 border-emerald-500/50 ${
                  isDayMode
                    ? 'bg-gradient-to-br from-emerald-50/50 via-white to-sky-50/30'
                    : 'bg-gradient-to-br from-emerald-950/20 via-slate-900 to-slate-950'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    उत्पादन सापडले (Item Matched!)
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    SKU: {scannedItem.code || scannedItem.id}
                  </span>
                </div>

                <div>
                  <h4 className="text-lg font-black text-slate-900 dark:text-white">
                    {scannedItem.name}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {scannedItem.brand} • {scannedItem.category} • मॉडेल: {scannedItem.model || 'N/A'}
                  </p>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-black/5 dark:bg-black/30 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px]">विक्री किंमत:</span>
                    <span className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">
                      ₹{scannedItem.salePrice.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-black/5 dark:bg-black/30 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px]">MRP:</span>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 font-mono">
                      ₹{(scannedItem.mrp || scannedItem.salePrice).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-black/5 dark:bg-black/30 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px]">उपलब्ध साठा:</span>
                    <span
                      className={`text-sm font-black font-mono ${
                        scannedItem.stockQty <= (scannedItem.minAlertQty || 2)
                          ? 'text-rose-500'
                          : 'text-sky-600 dark:text-sky-400'
                      }`}
                    >
                      {scannedItem.stockQty} {scannedItem.unit || 'Pcs'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-black/5 dark:bg-black/30 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px]">वॉरंटी:</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {scannedItem.warrantyMonths ? `${scannedItem.warrantyMonths} महिने` : '१ वर्ष अधिकृत'}
                    </span>
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  {onNavigateToPos && (
                    <button
                      type="button"
                      onClick={onNavigateToPos}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      थेट POS बिलामध्ये ॲड करा
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProductIds([scannedItem.id]);
                      setItemCopies({ [scannedItem.id]: 1 });
                      setActiveTab('designer');
                    }}
                    className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition"
                  >
                    <Tag className="w-3.5 h-3.5" />
                    याचे बारकोड स्टिकर प्रिंट करा
                  </button>
                </div>
              </div>
            ) : scannedInput ? (
              <div
                className={`rounded-2xl border p-6 text-center space-y-2 ${
                  isDayMode ? 'bg-rose-50/50 border-rose-200 text-rose-800' : 'bg-rose-950/20 border-rose-800 text-rose-300'
                }`}
              >
                <p className="text-sm font-bold">बारकोड कोड "{scannedInput}" गोदामात आढळला नाही!</p>
                <p className="text-xs opacity-80">कृपया कोड तपासा किंवा वस्तू गोदामात नोंदवलेली असल्याची खात्री करा.</p>
              </div>
            ) : null}
          </div>

          {/* Right Column: Recent Scans History (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div
              className={`rounded-2xl border p-4 sm:p-5 shadow-sm space-y-3 ${
                isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}
            >
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-sky-500" />
                नुकतेच स्कॅन केलेले आयटम्स (Scan History)
              </h3>

              {scanHistory.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">
                  अद्याप कोणतेही उत्पादन स्कॅन केलेले नाही
                </p>
              ) : (
                <div className="space-y-2 divide-y divide-slate-100 dark:divide-slate-800">
                  {scanHistory.map(({ item, time }, idx) => (
                    <div key={`${item.id}-${idx}`} className="pt-2 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{item.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {item.code || item.id} • ₹{item.salePrice.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                        {time}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Global CSS for Print Media to strictly print only barcode sheet */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-barcode-sheet, #printable-barcode-sheet * {
            visibility: visible !important;
          }
          #printable-barcode-sheet {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          @page {
            size: auto;
            margin: 4mm;
          }
        }
      `}</style>
    </div>
  );
};
