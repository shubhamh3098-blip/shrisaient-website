import React from 'react';
import { Printer, X, CheckCircle, ShieldCheck } from 'lucide-react';
import { BillReceipt, StoreSettings } from '../../types';

interface ReceiptPrintModalProps {
  receipt: BillReceipt | null;
  settings: StoreSettings;
  onClose: () => void;
}

export const ReceiptPrintModal: React.FC<ReceiptPrintModalProps> = ({
  receipt,
  settings,
  onClose,
}) => {
  if (!receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Top Bar */}
        <div className="px-5 py-3.5 bg-slate-800/80 border-b border-slate-700/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-white font-bold">
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Money Receipt Voucher #{receipt.receiptNo}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Voucher</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Voucher Paper */}
        <div className="p-6 overflow-y-auto bg-slate-950/60 flex justify-center">
          <div
            id="printable-money-receipt"
            className="w-full bg-white text-slate-900 p-6 rounded-xl border border-slate-200 shadow-xl font-sans text-xs space-y-4"
          >
            {/* Showroom Header */}
            <div className="text-center border-b-2 border-slate-900 pb-3">
              <h1 className="text-xl font-black uppercase tracking-wider text-slate-950">
                {settings.storeName}
              </h1>
              <p className="text-[11px] font-semibold text-slate-700 mt-0.5">{settings.tagline}</p>
              <p className="text-[10px] text-slate-600 mt-0.5">
                {settings.address}, {settings.city} - Ph: {settings.phone}
              </p>
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-700 mt-2 px-2 pt-1 border-t border-dashed border-slate-300">
                <span>GSTIN: {settings.gstin}</span>
                <span className="text-amber-700 uppercase bg-amber-50 px-2 py-0.5 rounded border border-amber-300 font-extrabold">
                  MONEY RECEIPT
                </span>
              </div>
            </div>

            {/* Receipt Meta */}
            <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-500 block">Receipt No:</span>
                <span className="font-extrabold text-slate-950 text-sm">#{receipt.receiptNo}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block">Date & Time:</span>
                <span className="font-semibold text-slate-900">
                  {new Date(receipt.date).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}{' '}
                  • {new Date(receipt.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            {/* Customer & Bill Details */}
            <div className="space-y-2 border-b border-slate-200 pb-3">
              <div className="flex justify-between py-1">
                <span className="text-slate-600">Received with thanks from:</span>
                <span className="font-bold text-slate-950 uppercase">{receipt.customerName}</span>
              </div>
              {receipt.invoiceNo && (
                <div className="flex justify-between py-1">
                  <span className="text-slate-600">Against Showroom Invoice:</span>
                  <span className="font-semibold text-slate-800">{receipt.invoiceNo}</span>
                </div>
              )}
              <div className="flex justify-between py-1">
                <span className="text-slate-600">Payment Mode:</span>
                <span className="font-semibold text-slate-950 uppercase bg-slate-100 px-2 py-0.5 rounded">
                  {receipt.paymentMode}
                </span>
              </div>
              {receipt.remarks && (
                <div className="flex justify-between py-1 text-slate-600">
                  <span>Particulars:</span>
                  <span className="text-right font-medium italic">{receipt.remarks}</span>
                </div>
              )}
            </div>

            {/* Amount Box */}
            <div className="bg-amber-50 border-2 border-amber-400/80 p-3.5 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-900 block">
                  Amount Received (Net)
                </span>
                <span className="text-xl font-black text-slate-950">
                  ₹{receipt.amountPaid.toLocaleString('en-IN')}.00
                </span>
              </div>
              <div className="text-right text-[10px]">
                <span className="text-slate-600 block">Remaining Due:</span>
                <span className="font-bold text-rose-600 text-xs">
                  ₹{receipt.balanceRemaining.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Terms & Signature */}
            <div className="pt-4 flex justify-between items-end text-[10px] text-slate-500">
              <div className="max-w-[200px] leading-tight">
                <p>• Goods once sold are not returnable.</p>
                <p>• Subject to Wardha jurisdiction.</p>
                <p>• Computer generated valid money voucher.</p>
              </div>
              <div className="text-center">
                <div className="w-32 border-b border-slate-400 mb-1"></div>
                <span className="font-semibold text-slate-700 block">
                  For {settings.storeName}
                </span>
                <span className="text-[9px] text-slate-400 block">Authorized Signatory</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
