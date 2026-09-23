import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  ScanLine, 
  Camera, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  Package, 
  ShieldCheck, 
  RefreshCw,
  QrCode
} from 'lucide-react';
import { StockItem, TransactionEntry } from '../types';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  stock: StockItem[];
  transactions: TransactionEntry[];
  onSelectSerialNumber?: (serial: string, item?: StockItem) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  stock = [],
  transactions = [],
  onSelectSerialNumber,
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'manual'>('camera');
  const [scannedCode, setScannedCode] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [matchedStock, setMatchedStock] = useState<StockItem | null>(null);
  const [matchedSale, setMatchedSale] = useState<TransactionEntry | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('आपल्या ब्राउझरमध्ये कॅमेरा परवानगी उपलब्ध नाही. मॅन्युअल इनपुट वापरा.');
        setActiveTab('manual');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // Check for native BarcodeDetector
      if ('BarcodeDetector' in window) {
        const barcodeDetector = new (window as any).BarcodeDetector({
          formats: ['code_128', 'code_39', 'ean_13', 'ean_8', 'qr_code', 'upc_a'],
        });

        scanIntervalRef.current = setInterval(async () => {
          if (videoRef.current && videoRef.current.readyState >= 2) {
            try {
              const barcodes = await barcodeDetector.detect(videoRef.current);
              if (barcodes && barcodes.length > 0) {
                const code = barcodes[0].rawValue;
                handleCodeFound(code);
              }
            } catch (err) {
              // Ignore frame detection hiccups
            }
          }
        }, 500);
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError('कॅमेरा सुरू करता आला नाही किंवा परवानगी नाकारली. आपण खाली सीरियल नंबर हाताने टाकू शकता.');
    }
  };

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const handleCodeFound = (code: string) => {
    if (!code) return;
    setScannedCode(code);
    lookupCode(code);
  };

  const lookupCode = (code: string) => {
    const clean = code.trim().toLowerCase();
    
    // Check Stock
    const foundStock = stock.find((s) => 
      s.code.toLowerCase().includes(clean) ||
      (s.name.toLowerCase().includes(clean))
    );
    setMatchedStock(foundStock || null);

    // Check Past Sales (Transactions with serial number or matching item)
    const foundSale = transactions.find((t) => 
      (t.serialNumber && t.serialNumber.toLowerCase().includes(clean)) ||
      (t.itemsDetail && t.itemsDetail.some(it => it.serialNumber && it.serialNumber.toLowerCase().includes(clean)))
    );
    setMatchedSale(foundSale || null);
  };

  const handleCopy = () => {
    if (!scannedCode) return;
    navigator.clipboard?.writeText(scannedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs no-print">
      <div className="bg-white dark:bg-[#0F172A] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-bold">
              <ScanLine className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                सीरियल नंबर व बारकोड स्कॅनर (Barcode / Serial Scanner)
              </h2>
              <p className="text-[11px] text-slate-400">
                टीव्ही, फ्रिज, कुलर व वॉशिंग मशीन बॉक्सवरील बारकोड स्कॅन करा
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-1.5 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('camera')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'camera'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>कॅमेरा लाईव्ह स्कॅन (Live Camera)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'manual'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>मॅन्युअल नंबर शोध (Manual Search)</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === 'camera' && (
            <div className="flex flex-col items-center">
              {/* Camera Preview Box */}
              <div className="relative w-full aspect-4/3 max-w-sm rounded-2xl overflow-hidden bg-black border-2 border-indigo-500 shadow-inner flex items-center justify-center">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Reticle / Scanner Overlay */}
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                  <div className="w-56 h-36 border-2 border-dashed border-indigo-400 rounded-xl bg-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.5)] flex items-center justify-center">
                    <span className="text-[10px] text-white bg-black/60 px-2 py-0.5 rounded font-mono">
                      येथे बारकोड धरा (Align Code)
                    </span>
                  </div>
                </div>
              </div>

              {cameraError && (
                <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg border border-amber-200 dark:border-amber-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{cameraError}</span>
                </div>
              )}
            </div>
          )}

          {/* Manual Input / Result Bar */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              सीरियल नंबर / बारकोड (Serial Number / Barcode):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={scannedCode}
                onChange={(e) => {
                  setScannedCode(e.target.value);
                  lookupCode(e.target.value);
                }}
                placeholder="उदा. SN-2026-LG43-9981 किंवा बारकोड टाईप करा..."
                className="flex-1 p-2 text-sm font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
              {scannedCode && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition cursor-pointer"
                  title="कॉपी करा"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>

          {/* Verification Results */}
          {scannedCode && (
            <div className="p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/60 dark:bg-indigo-950/20 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>वॉरंटी व स्टॉक माहिती (Lookup Status)</span>
                </span>
                <span className="font-mono text-[10px] text-slate-500">
                  {scannedCode}
                </span>
              </div>

              {matchedSale ? (
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800">
                  <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>विक्री नोंद सापडली (Sold Unit):</span>
                  </div>
                  <div className="mt-1 space-y-0.5 text-slate-700 dark:text-slate-300 text-[11px]">
                    <p>• ग्राहक: <strong>{matchedSale.customerName}</strong> ({matchedSale.customerPhone || '-'})</p>
                    <p>• बिल नंबर: <strong className="font-mono">{matchedSale.invoiceNo}</strong> | तारीख: {matchedSale.date}</p>
                    <p>• वस्तू: {matchedSale.itemDetails || matchedSale.stockItemName}</p>
                  </div>
                </div>
              ) : matchedStock ? (
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-800">
                  <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400 font-bold">
                    <Package className="w-4 h-4" />
                    <span>स्टॉकमध्ये उपलब्ध आयटम (Available in Stock):</span>
                  </div>
                  <div className="mt-1 space-y-0.5 text-slate-700 dark:text-slate-300 text-[11px]">
                    <p>• नाव: <strong>{matchedStock.name}</strong></p>
                    <p>• आयटम कोड: <strong className="font-mono">{matchedStock.code}</strong></p>
                    <p>• शिल्लक स्टॉक: <strong className="text-emerald-600">{matchedStock.quantity} {matchedStock.unit}</strong></p>
                    <p>• विक्री किंमत: <strong>₹{matchedStock.sellingPrice.toLocaleString()}</strong></p>
                  </div>
                </div>
              ) : (
                <div className="text-slate-500 text-[11px] p-2 bg-white dark:bg-slate-900 rounded-lg">
                  हा सीरियल नंबर नवीन युनिटवर जोडण्यासाठी उपलब्ध आहे.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
          >
            रद्द करा (Close)
          </button>

          {scannedCode && onSelectSerialNumber && (
            <button
              type="button"
              onClick={() => {
                onSelectSerialNumber(scannedCode, matchedStock || undefined);
                onClose();
              }}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs cursor-pointer"
            >
              हा सीरियल नंबर बिलात जोडा (Use Serial)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
