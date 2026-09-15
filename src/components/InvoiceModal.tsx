import React, { useState } from 'react';
import { Printer, Share2, X, Store, CheckCircle, Barcode, FileText, FileSpreadsheet } from 'lucide-react';
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

  const [docType, setDocType] = useState<'invoice' | 'quotation'>(entry.docType || 'invoice');

  const isQuotation = docType === 'quotation';
  const displayDocTitle = isQuotation ? 'दरपत्रक / अंदाजपत्रक (QUOTATION)' : 'कर बीजक (TAX INVOICE)';
  const displayDocNumberLabel = isQuotation ? 'कोटेशन क्र. (Quotation No)' : 'Tax Invoice / बिल क्र';

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const invoiceUrl = `${window.location.origin}/?invoice=${entry.invoiceNo}`;
    const text = encodeURIComponent(
      `*${settings.businessName}*\n` +
      `*${isQuotation ? 'QUOTATION / दरपत्रक' : 'TAX INVOICE / विक्री बिल'}: ${entry.invoiceNo}*\n` +
      `Date: ${entry.date}\n` +
      `Customer: ${entry.customerName}\n` +
      (entry.serialNumber ? `Serial No / IMEI: ${entry.serialNumber}\n` : '') +
      `Items: ${entry.itemDetails}\n` +
      `--------------------------------\n` +
      `Total Amount: ₹${entry.totalAmount.toLocaleString()}\n` +
      (!isQuotation ? `Amount Paid: ₹${entry.payingNow.toLocaleString()} (${entry.paymentMode})\n` : '') +
      (!isQuotation && entry.dueAmount > 0 ? `Remaining Due / Udhar: ₹${entry.dueAmount.toLocaleString()}\n` : (!isQuotation ? `Status: FULLY PAID\n` : `Estimate Validity: 15 Days\n`)) +
      `--------------------------------\n` +
      `🔗 Digital Bill Slip: ${invoiceUrl}\n` +
      `GSTIN: ${settings.gstin}\n` +
      `Shree Sai Enterprises • Wardha (8766486915 / 8600122798)`
    );
    const phone = entry.customerPhone ? entry.customerPhone.replace(/[^0-9]/g, '') : '';
    const url = phone ? `https://wa.me/91${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto print:p-0 print:m-0 print:static print:bg-white">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200 animate-fade-in my-auto print:my-0 print:border-none print:shadow-none print:rounded-none print:max-w-none">
        {/* Top action header (hidden in print) */}
        <div className="no-print bg-slate-900 text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 text-xs">
            <span className={`font-bold ${isQuotation ? 'text-amber-400' : 'text-emerald-400'}`}>
              {isQuotation ? 'दरपत्रक (Quotation)' : 'विक्री बिल (Invoice)'}
            </span>
            <span className="text-slate-500">•</span>
            <span className="font-mono text-slate-300 font-bold">{entry.invoiceNo}</span>
          </div>

          {/* Quick toggle between Invoice and Quotation */}
          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700 text-[11px]">
            <button
              type="button"
              onClick={() => setDocType('invoice')}
              className={`px-2.5 py-1 rounded-md font-bold transition flex items-center gap-1 cursor-pointer ${
                !isQuotation
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3 h-3" />
              <span>बिल (Invoice)</span>
            </button>
            <button
              type="button"
              onClick={() => setDocType('quotation')}
              className={`px-2.5 py-1 rounded-md font-bold transition flex items-center gap-1 cursor-pointer ${
                isQuotation
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-3 h-3" />
              <span>कोटेशन (Quote)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-full bg-[#00523f] hover:bg-[#004232] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-[0_4px_14px_rgba(0,82,63,0.3)] active:scale-95 transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              प्रिंट (Print)
            </button>
            <button
              onClick={handleShareWhatsApp}
              className="px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-all"
            >
              <Share2 className="w-3.5 h-3.5" />
              व्हॉट्सॲप
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Invoice / Quotation Sheet */}
        <div id="printable-invoice" className="p-0 text-slate-800 bg-white print:w-full print:m-0">
          {/* Authentic Deep Navy Banner */}
          <div className="bg-[#0B1528] text-white px-5 py-4 sm:px-6 sm:py-5 print:px-4 print:py-3 text-center border-b-2 border-amber-500">
            <div className="flex justify-center mb-1.5 print:mb-1">
              <AppLogo size="sm" variant="iconOnly" />
            </div>
            <h2 className="text-2xl sm:text-3xl print:text-xl font-extrabold tracking-wide font-serif">
              श्री साई इंटरप्राइजेस
            </h2>
            <p className="text-xs sm:text-sm print:text-[11px] font-medium text-slate-200 mt-0.5">
              Shri Sai Enterprises • Electronics & Home Appliances
            </p>
            <p className="text-[11px] sm:text-xs print:text-[10px] text-slate-300 mt-0.5">
              पत्ता : मातोश्री सभागृह समोर आर्वी रोड पंजाब कॉलनी वर्धा ,442001
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] print:text-[10px] font-mono text-amber-300 mt-1 font-bold">
              <span>GSTIN: 27AABCS1429B1Z8</span>
              <span>•</span>
              <span>मो: 8766486915 / 8600122798</span>
            </div>
          </div>

          <div className="p-5 sm:p-6 print:p-4 space-y-3.5 print:space-y-2.5">
            {/* Header with Document Type Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5 print:pb-1.5 text-xs">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold tracking-wide uppercase ${
                    isQuotation
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  }`}>
                    {displayDocTitle}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1">
                  {displayDocNumberLabel}: <span className="font-bold font-mono text-slate-900 text-xs">{entry.invoiceNo}</span>
                </p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-xs text-slate-700">दिनांक / Date: <span className="font-bold font-mono text-slate-900">{entry.date}</span></p>
                <span className={`inline-block px-2 py-0.5 mt-0.5 rounded font-bold text-[10px] uppercase ${
                  isQuotation
                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {isQuotation ? 'कोटेशन / ESTIMATE' : (entry.paymentMode || 'Cash')}
                </span>
              </div>
            </div>

            {/* Customer info */}
            <div className="bg-slate-50 print:bg-slate-50/50 rounded-xl p-3 print:p-2 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-slate-200">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">नाव / Billed To:</span>
                <p className="font-bold text-slate-900 text-sm">{entry.customerName}</p>
                <div className="flex items-center gap-2 mt-0.5 font-mono text-slate-600 text-[11px]">
                  {entry.customerPhone && (
                    <span>मो: {entry.customerPhone}</span>
                  )}
                  {entry.cardNumber && (
                    <span className="text-blue-700 font-bold bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                      कार्ड #{entry.cardNumber}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-left sm:text-right text-[11px]">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">गाव / Location:</span>
                <span className="font-semibold text-slate-800">
                  {entry.village ? `${entry.village}, वर्धा` : 'वर्धा व परिसर / Wardha'}
                </span>
              </div>
            </div>

            {/* Line item details */}
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3 w-10">अ.क्र</th>
                    <th className="py-2 px-3">विवरण / Item Description</th>
                    <th className="py-2 px-3 text-right">दर / Rate</th>
                    <th className="py-2 px-3 text-right">एकूण / Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-slate-100">
                    <td className="py-2.5 px-3 text-slate-500 font-mono">1</td>
                    <td className="py-2.5 px-3">
                      <p className="font-semibold text-slate-900">{entry.itemDetails}</p>
                      {entry.notes && (
                        <p className="text-[11px] text-slate-500 italic mt-0.5">
                          नोंद: {entry.notes}
                        </p>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                      ₹{entry.totalAmount.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold font-mono text-slate-900">
                      ₹{entry.totalAmount.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Serial Number Section (User Request: SALE MHNJE BILL MADE SERIAL NUMBER VALA SECTION PAHIJE) */}
            <div className="bg-slate-50 print:bg-slate-50/70 border border-slate-200 rounded-xl p-2.5 print:p-2">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <Barcode className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                    सिरीयल क्र. / IMEI / मॉडेल नंबर (Serial Number):
                  </span>
                </div>
                <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  अधिकृत वॉरंटी नोंदणी
                </span>
              </div>
              <div className="bg-white print:bg-white border border-slate-200 rounded-lg px-3 py-1.5 font-mono flex items-center justify-between">
                <span className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-wider">
                  {entry.serialNumber ? entry.serialNumber : '— N/A / स्टैंडर्ड युनिट —'}
                </span>
                <span className="text-[10px] text-slate-500 font-sans">
                  Shree Sai Enterprises Verified
                </span>
              </div>
            </div>

            {/* Total calculation & Status */}
            <div className="space-y-1 pt-1 text-xs border-t border-slate-200">
              <div className="flex justify-between text-slate-700 font-medium">
                <span>एकूण / Total Amount:</span>
                <span className="font-bold text-slate-900 text-sm font-mono">
                  ₹{entry.totalAmount.toLocaleString()}
                </span>
              </div>
              {!isQuotation ? (
                <>
                  <div className="flex justify-between text-slate-700 font-medium">
                    <span>अ‍ॅडव्हान्स / Paid Now:</span>
                    <span className="font-bold text-emerald-600 text-sm font-mono">
                      ₹{entry.payingNow.toLocaleString()}
                    </span>
                  </div>
                  {entry.dueAmount > 0 ? (
                    <div className="flex justify-between text-amber-900 bg-amber-50 px-3 py-1.5 rounded-lg font-bold">
                      <span>बाकी / Balance Due (उधारी):</span>
                      <span className="font-mono">₹{entry.dueAmount.toLocaleString()}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-emerald-700 text-[11px] font-semibold pt-0.5">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Full payment received with thanks (पूर्ण भरणा प्राप्त झाला).</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg text-amber-900 text-[11px] font-medium flex justify-between items-center">
                  <span>कोटेशन वैधता: दर १५ दिवसांपर्यंत वैध राहतील.</span>
                  <span className="font-bold">दरपत्रक (Estimate Only)</span>
                </div>
              )}
            </div>

            {/* Warranty & Bank Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-[10px] print:grid-cols-2">
              <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-2 text-amber-900">
                <p className="font-bold mb-0.5">वॉरंटी सूचना (Warranty Note):</p>
                <p className="leading-relaxed text-[9px]">
                  दिलेली वॉरंटी ही दुकानदाराची नसून कंपनीची आहे. वस्तूत काही बिघाड आल्यास कंपनी सर्व्हिस सेंटर जबाबदार राहील. कृपया सिरीयल नंबर जपून ठेवावा.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-700 space-y-0.5">
                <p className="font-bold text-slate-900 mb-0.5">Bank Details (बँक तपशील):</p>
                <p>Bank: <span className="font-semibold text-slate-900">HDFC Bank</span></p>
                <p>A/C: <span className="font-bold font-mono text-slate-900">50200083215914</span> | IFSC: <span className="font-bold font-mono text-slate-900">HDFC0000965</span></p>
                <p className="text-[9px] text-slate-500 truncate">Branch: OPP.BANK OF MAHARASHTRA WARDHA</p>
              </div>
            </div>

            {/* Signatory footer */}
            <div className="pt-2.5 print:pt-1.5 flex items-end justify-between text-xs text-slate-500 border-t border-slate-100">
              <div>
                <p className="text-[11px] font-medium text-slate-700">Thank you for choosing Shree Sai Enterprises!</p>
                <p className="text-[9px] text-slate-400 font-mono mt-0.5">
                  Wardha 442001 • Mo: 8766486915
                </p>
              </div>
              <div className="text-center">
                <div className="h-6 w-28 border-b border-dashed border-slate-400 mx-auto"></div>
                <p className="text-[10px] font-bold text-slate-800 mt-0.5">
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

