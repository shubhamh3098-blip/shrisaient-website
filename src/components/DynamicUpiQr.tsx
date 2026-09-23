import React from 'react';
import { QrCode, ExternalLink, Check, Copy } from 'lucide-react';

interface DynamicUpiQrProps {
  amount: number;
  note?: string;
  payeeName?: string;
  upiId?: string;
  size?: number;
  showDetails?: boolean;
  className?: string;
}

export const DynamicUpiQr: React.FC<DynamicUpiQrProps> = ({
  amount,
  note = 'Shri Sai Enterprises',
  payeeName = 'Shri Sai Enterprises',
  upiId = '8766486915@upi',
  size = 170,
  showDetails = true,
  className = '',
}) => {
  const [copied, setCopied] = React.useState(false);

  // Standard UPI URI specification
  // upi://pay?pa=VPA&pn=NAME&am=AMOUNT&tn=NOTE&cu=INR
  const formattedAmount = Math.max(0, Math.round(amount));
  const cleanNote = note.replace(/[^a-zA-Z0-9 _-]/g, ' ').trim().slice(0, 30);
  const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${formattedAmount}&tn=${encodeURIComponent(cleanNote)}&cu=INR`;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size * 2}x${size * 2}&margin=1&data=${encodeURIComponent(upiUrl)}`;

  const handleCopyUpi = () => {
    navigator.clipboard?.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex flex-col items-center text-center p-3 bg-white rounded-2xl border border-slate-200 shadow-xs ${className}`}>
      {/* QR Code Container */}
      <div 
        className="relative bg-white p-2 rounded-xl border border-slate-100 shadow-inner flex items-center justify-center overflow-hidden"
        style={{ width: size, height: size }}
      >
        <img
          src={qrImageUrl}
          alt={`UPI QR Code ₹${formattedAmount}`}
          className="w-full h-full object-contain"
          loading="lazy"
        />
        {/* Centered Small UPI Badge */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-8 h-8 rounded-md bg-white p-0.5 shadow-md flex items-center justify-center border border-slate-200">
            <span className="text-[9px] font-black text-[#00523f] tracking-tighter">UPI</span>
          </div>
        </div>
      </div>

      {showDetails && (
        <div className="mt-2.5 w-full">
          <div className="flex items-center justify-center gap-1 text-xs font-bold text-slate-900">
            <span>स्कॅन करा / Scan to Pay:</span>
            <span className="text-emerald-700 font-mono text-sm">₹{formattedAmount.toLocaleString('en-IN')}</span>
          </div>

          <div className="mt-1 flex items-center justify-center gap-1 text-[11px] text-slate-500 font-mono bg-slate-50 py-1 px-2 rounded-lg border border-slate-100">
            <span>{upiId}</span>
            <button
              type="button"
              onClick={handleCopyUpi}
              className="p-1 hover:text-slate-800 transition cursor-pointer"
              title="Copy UPI ID"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>

          {/* Quick Pay Button for Mobile */}
          <a
            href={upiUrl}
            className="mt-2 inline-flex items-center justify-center gap-1.5 w-full py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold transition shadow-xs cursor-pointer sm:hidden"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Pay via PhonePe / GPay / Paytm</span>
          </a>

          <div className="mt-1 text-[10px] text-slate-400">
            PhonePe • Google Pay • Paytm • BHIM
          </div>
        </div>
      )}
    </div>
  );
};
