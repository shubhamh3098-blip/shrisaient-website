import React from 'react';
import { Printer, Share2, X, Store, CheckCircle } from 'lucide-react';
import { BusinessSettings, TransactionEntry } from '../types';
import { AppLogo } from './AppLogo';

interface InvoiceModalProps {
  entry: TransactionEntry | null;
  onClose: () => void;
  settings: BusinessSettings;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  entry,
  onClose,
  settings,
}) => {
  if (!entry) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const invoiceUrl = `${window.location.origin}/?invoice=${entry.invoiceNo}`;
    const text = encodeURIComponent(
      `*${settings.businessName}*\n` +
      `*Cash / Tax Invoice: ${entry.invoiceNo}*\n` +
      `Date: ${entry.date}\n` +
      `Customer: ${entry.customerName}\n` +
      `Items: ${entry.itemDetails}\n` +
      `--------------------------------\n` +
      `Total Amount: ₹${(Number(entry.totalAmount) || 0).toLocaleString()}\n` +
      `Amount Paid: ₹${(Number(entry.payingNow) || 0).toLocaleString()} (${entry.paymentMode})\n` +
      ((Number(entry.dueAmount) || 0) > 0 ? `Remaining Due / Udhar: ₹${(Number(entry.dueAmount) || 0).toLocaleString()}\n` : `Status: FULLY PAID\n`) +
      `--------------------------------\n` +
      `🔗 Digital Bill Slip: ${invoiceUrl}\n` +
      `GSTIN: ${settings.gstin}\n` +
      `Thank you for doing business with Shree Sai Enterprises!`
    );
    const phone = entry.customerPhone ? entry.customerPhone.replace(/[^0-9]/g, '') : '';
    const url = phone ? `https://wa.me/91${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-fade-in my-auto">
        {/* Top action header (hidden in print) */}
        <div className="no-print bg-slate-900 dark:bg-slate-950 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-emerald-400">Invoice Ready</span>
            <span className="text-slate-400">•</span>
            <span className="font-mono text-slate-300">{entry.invoiceNo}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>
            <button
              onClick={handleShareWhatsApp}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              WhatsApp
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Sheet matching authentic bill book BILL BOOK.p.png */}
        <div id="printable-invoice" className="p-0 text-slate-800 bg-white">
          {/* Authentic Deep Navy Banner */}
          <div className="bg-[#0B1528] text-white px-6 py-5 text-center border-b-2 border-amber-500">
            <div className="flex justify-center mb-2">
              <AppLogo size="sm" variant="iconOnly" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-wide font-serif">
              श्री साई इंटरप्राइजेस
            </h2>
            <p className="text-xs sm:text-sm font-medium text-slate-200 mt-1">
              Shri Sai Enterprises • Electronics & Home Appliances
            </p>
            <p className="text-[11px] sm:text-xs text-slate-300 mt-1">
              पत्ता : मातोश्री सभागृह समोर आर्वी रोड पंजाब कॉलनी वर्धा ,442001
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono text-amber-300 mt-1.5 font-bold">
              <span>📞 8766486915</span>
              <span>•</span>
              <span>8600122798</span>
              <span>•</span>
              <span>9175534365</span>
              <span>•</span>
              <span>7822859073</span>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-5">
            {/* GST and Invoice Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3 text-xs">
              <div>
                <span className="font-bold text-slate-900 font-mono text-sm">
                  GST IN 27ALOPL0030G2ZC
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">Tax Invoice / बिल क्र: <span className="font-bold font-mono text-slate-900">{entry.invoiceNo}</span></p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-xs text-slate-700">दिनांक / Date: <span className="font-bold font-mono text-slate-900">{entry.date}</span></p>
                <span className="inline-block px-2 py-0.5 mt-1 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase">
                  {entry.paymentMode}
                </span>
              </div>
            </div>

            {/* Customer info */}
            <div className="bg-slate-50 rounded-xl p-3.5 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-slate-200">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">नाव / Billed To:</span>
                <p className="font-bold text-slate-900 text-sm">{entry.customerName}</p>
                {entry.customerPhone && (
                  <p className="text-slate-600 font-mono mt-0.5">मोबाइल क्र : {entry.customerPhone}</p>
                )}
              </div>
              <div className="text-left sm:text-right text-[11px]">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">गाव / Location:</span>
                <span className="font-semibold text-slate-800">वर्धा व परिसर / Wardha</span>
              </div>
            </div>

            {/* Line item details */}
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 w-10">अ.क्र</th>
                    <th className="py-2.5 px-3">विवरण / Description</th>
                    <th className="py-2.5 px-3 text-right">दर / Rate</th>
                    <th className="py-2.5 px-3 text-right">एकूण / Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-slate-100">
                    <td className="py-3 px-3 text-slate-500 font-mono">1</td>
                    <td className="py-3 px-3">
                      <p className="font-semibold text-slate-900">{entry.itemDetails}</p>
                      {entry.notes && (
                        <p className="text-[11px] text-slate-500 italic mt-0.5">
                          नोंद: {entry.notes}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-700">
                      ₹{(Number(entry.totalAmount) || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-bold font-mono text-slate-900">
                      ₹{(Number(entry.totalAmount) || 0).toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Total calculation & Status */}
            <div className="space-y-1.5 pt-1 text-xs border-t border-slate-200">
              <div className="flex justify-between text-slate-700 font-medium">
                <span>एकूण / Total Amount:</span>
                <span className="font-bold text-slate-900 text-sm font-mono">
                  ₹{(Number(entry.totalAmount) || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-slate-700 font-medium">
                <span>अ‍ॅडव्हान्स / Paid Now:</span>
                <span className="font-bold text-emerald-600 text-sm font-mono">
                  ₹{(Number(entry.payingNow) || 0).toLocaleString()}
                </span>
              </div>
              {(Number(entry.dueAmount) || 0) > 0 ? (
                <div className="flex justify-between text-amber-800 bg-amber-50 px-3 py-1.5 rounded-lg font-bold">
                  <span>बाकी / Balance Due:</span>
                  <span className="font-mono">₹{(Number(entry.dueAmount) || 0).toLocaleString()}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-emerald-700 text-[11px] font-semibold pt-1">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Full payment received with thanks (पूर्ण भरणा प्राप्त झाला).</span>
                </div>
              )}
            </div>

            {/* Warranty & Bank Details matching Bill Book */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-slate-200 text-[10px]">
              {/* Warranty note */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-2.5 text-amber-900">
                <p className="font-bold mb-1">वॉरंटी सूचना (Warranty Note):</p>
                <p className="leading-relaxed text-[9.5px]">
                  दिलेली वॉरंटी ही दुकानदाराची नसून कंपनीची आहे. म्हणून वस्तूत काही बिघाड आल्यास त्याला दुकानदार जबाबदार नसून कंपनी आहे. तेव्हा कृपया वस्तू घेतेवेळेस कंपनीच्या सर्व्हिस सेण्टरचा मोबाईल नंबर घ्यावा.
                </p>
              </div>

              {/* Bank Details */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-700 space-y-0.5">
                <p className="font-bold text-slate-900 mb-1">Bank Details (बँक तपशील):</p>
                <p>Bank: <span className="font-semibold text-slate-900">HDFC Bank</span></p>
                <p>A/C No: <span className="font-bold font-mono text-slate-900">50200083215914</span></p>
                <p>IFSC: <span className="font-bold font-mono text-slate-900">HDFC0000965</span></p>
                <p className="text-[9px] text-slate-500 truncate">Branch: OPP.BANK OF MAHARASHTRA WARDHA</p>
              </div>
            </div>

            {/* Signatory footer */}
            <div className="pt-4 flex items-end justify-between text-xs text-slate-500 border-t border-slate-100">
              <div>
                <p className="text-[11px] font-medium text-slate-700">Thank you for your business!</p>
                <p className="text-[9px] text-slate-400 font-mono mt-0.5">
                  ShriSaiEnt.in • Wardha 442001
                </p>
              </div>
              <div className="text-center">
                <div className="h-8 w-28 border-b border-dashed border-slate-400 mx-auto"></div>
                <p className="text-[10px] font-bold text-slate-800 mt-1">
                  Authorized Sign
                </p>
                <p className="text-[9px] text-slate-500">श्री साई इंटरप्राइजेस</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
