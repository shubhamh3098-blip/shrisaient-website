import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { IndianRupee, QrCode, Copy, Check } from 'lucide-react';

interface DynamicUpiQrCodeProps {
  upiId?: string;
  payeeName?: string;
  amount?: number;
  note?: string;
  size?: number;
  showBadges?: boolean;
  showAmountPill?: boolean;
  className?: string;
}

export const DynamicUpiQrCode: React.FC<DynamicUpiQrCodeProps> = ({
  upiId = '8766486915@ybl',
  payeeName = 'Shri Sai Enterprises',
  amount,
  note = 'Payment',
  size = 130,
  showBadges = true,
  showAmountPill = true,
  className = '',
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Construct standard NPCI UPI URI
  const effectiveUpiId = upiId.trim() || '8766486915@ybl';
  const effectivePayee = payeeName.trim() || 'Shri Sai Enterprises';
  const cleanAmount = amount && amount > 0 ? amount.toFixed(2) : undefined;
  
  let upiUri = `upi://pay?pa=${encodeURIComponent(effectiveUpiId)}&pn=${encodeURIComponent(effectivePayee)}&cu=INR`;
  if (cleanAmount) {
    upiUri += `&am=${cleanAmount}`;
  }
  if (note) {
    upiUri += `&tn=${encodeURIComponent(note.slice(0, 30))}`;
  }

  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL(upiUri, {
      width: size * 2, // 2x for sharp print & retina
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
      .then((url: string) => {
        if (isMounted) setQrDataUrl(url);
      })
      .catch((err: unknown) => {
        console.error('Error generating UPI QR code:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [upiUri, size]);

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(effectiveUpiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex flex-col items-center text-center p-2 rounded-xl bg-white border border-slate-300 shadow-xs print:shadow-none print:border-slate-400 ${className}`}>
      {/* Title */}
      <div className="flex items-center gap-1 mb-1">
        <QrCode className="w-3.5 h-3.5 text-blue-700 print:text-black" />
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-800 print:text-black">
          GPay / PhonePe / Paytm स्कॅन करा
        </span>
      </div>

      {/* QR Code Container */}
      <div className="bg-white p-1 rounded-lg border border-slate-200 print:border-slate-900 inline-block shadow-xs print:shadow-none">
        {qrDataUrl ? (
          <img
            src={qrDataUrl}
            alt={`UPI Payment QR for ₹${cleanAmount || 'due'}`}
            style={{ width: `${size}px`, height: `${size}px` }}
            className="block"
          />
        ) : (
          <div
            style={{ width: `${size}px`, height: `${size}px` }}
            className="flex items-center justify-center bg-slate-100 text-[10px] text-slate-400"
          >
            QR लोड होत आहे...
          </div>
        )}
      </div>

      {/* Dynamic Amount Pill */}
      {showAmountPill && cleanAmount && (
        <div className="mt-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 font-mono text-[11px] font-black print:border-slate-900 print:bg-white print:text-black flex items-center gap-0.5">
          <IndianRupee className="w-3 h-3" />
          <span>{Number(cleanAmount).toLocaleString()} भरण्यासाठी</span>
        </div>
      )}

      {/* UPI ID display & copy */}
      <div className="mt-1 flex items-center justify-center gap-1 text-[10px] text-slate-600 font-mono">
        <span className="font-bold text-slate-900 print:text-black">{effectiveUpiId}</span>
        <button
          type="button"
          onClick={handleCopyUpi}
          className="print:hidden p-0.5 text-slate-500 hover:text-blue-600 transition cursor-pointer"
          title="UPI ID कॉपी करा"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
        </button>
      </div>

      {/* Supported App Badges */}
      {showBadges && (
        <div className="mt-1 flex items-center gap-1.5 text-[9px] font-bold text-slate-500 print:text-slate-700 uppercase">
          <span className="px-1 py-0.2 rounded bg-slate-100 border border-slate-200 print:border-slate-400">GPay</span>
          <span className="px-1 py-0.2 rounded bg-slate-100 border border-slate-200 print:border-slate-400">PhonePe</span>
          <span className="px-1 py-0.2 rounded bg-slate-100 border border-slate-200 print:border-slate-400">BHIM UPI</span>
        </div>
      )}
    </div>
  );
};
