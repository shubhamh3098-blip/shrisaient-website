import React, { useState, useEffect } from 'react';
import { Printer, Share2, X, FileText, CheckCircle, Edit3, Save, ShieldCheck } from 'lucide-react';
import { BusinessSettings, TransactionEntry } from '../types';
import { AppLogo } from './AppLogo';

interface InvoiceModalProps {
  entry: TransactionEntry | null;
  onClose: () => void;
  settings: BusinessSettings;
  onUpdateEntry?: (updated: TransactionEntry) => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  entry,
  onClose,
  settings,
  onUpdateEntry,
}) => {
  if (!entry) return null;

  const isReceipt =
    entry.entryType === 'Receipt' ||
    entry.invoiceNo.startsWith('SSE/RCPT') ||
    entry.invoiceNo.startsWith('REC-') ||
    (entry.totalAmount === 0 && entry.payingNow > 0);

  // Toggle between Tax Invoice and Quotation
  const [docType, setDocType] = useState<'tax-bill' | 'quotation'>(
    entry.isQuotation ? 'quotation' : 'tax-bill'
  );

  // Model & Serial number state
  const [modelNo, setModelNo] = useState(entry.modelNo || '');
  const [serialNo, setSerialNo] = useState(entry.serialNo || '');
  const [isEditingSpecs, setIsEditingSpecs] = useState(false);
  const [validityDays, setValidityDays] = useState(entry.quotationValidity || '15 दिवस वैध (15 Days)');

  useEffect(() => {
    if (!entry) return;
    setDocType(entry.isQuotation ? 'quotation' : 'tax-bill');
    setModelNo(entry.modelNo || '');
    setSerialNo(entry.serialNo || '');
    setValidityDays(entry.quotationValidity || '15 दिवस वैध (15 Days)');
    setIsEditingSpecs(false);
  }, [entry]);

  const handleSaveSpecs = () => {
    if (onUpdateEntry) {
      const updated: TransactionEntry = {
        ...entry,
        modelNo: modelNo.trim(),
        serialNo: serialNo.trim(),
        isQuotation: docType === 'quotation',
        quotationValidity: validityDays,
      };
      onUpdateEntry(updated);
    }
    setIsEditingSpecs(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const isQuotationMode = docType === 'quotation';
  const displayDocNumber = isQuotationMode
    ? entry.invoiceNo.startsWith('QT-')
      ? entry.invoiceNo
      : `QT-${entry.invoiceNo.replace(/^INV-/, '')}`
    : entry.invoiceNo;

  const handleShareWhatsApp = () => {
    const invoiceUrl = `${window.location.origin}/?invoice=${entry.invoiceNo}`;
    let docTitle = isReceipt
      ? 'Payment Receipt (जमा पावती)'
      : isQuotationMode
      ? 'कोटेशन / अंदाजपत्रक (QUOTATION / ESTIMATE)'
      : 'Cash / Tax Invoice (विक्री बिल)';

    let text =
      `*${settings.businessName}*\n` +
      `*${docTitle}: ${displayDocNumber}*\n` +
      `तारीख: ${entry.date}\n` +
      `ग्राहक: ${entry.customerName}\n` +
      (entry.village ? `गाव: ${entry.village}\n` : '') +
      (entry.refBillNo ? `Against Bill No: #${entry.refBillNo}\n` : '') +
      `तपशील: ${entry.itemDetails}\n` +
      (modelNo ? `मॉडेल क्र. (Model No): ${modelNo}\n` : '') +
      (serialNo ? `सिरीयल क्र. (Serial No): ${serialNo}\n` : '') +
      `--------------------------------\n` +
      (isReceipt
        ? `जमा रक्कम: ₹${(Number(entry.payingNow) || 0).toLocaleString()} (${entry.paymentMode})\n`
        : `एकूण रक्कम: ₹${(Number(entry.totalAmount) || 0).toLocaleString()}\n` +
          `भरणा / अ‍ॅडव्हान्स: ₹${(Number(entry.payingNow) || 0).toLocaleString()} (${entry.paymentMode})\n` +
          ((Number(entry.dueAmount) || 0) > 0
            ? `बाकी / डिलिव्हरी वेळी देय: ₹${(Number(entry.dueAmount) || 0).toLocaleString()}\n`
            : `स्थिती: पूर्ण भरणा (Fully Paid)\n`)) +
      (isQuotationMode ? `वैधता: ${validityDays}\n` : '') +
      `--------------------------------\n` +
      `🔗 Digital Slip: ${invoiceUrl}\n` +
      `GSTIN: 27ALOPL0030G2ZC\n` +
      `संपर्क: 8766486915 • 8600122798\n` +
      `श्री साई इंटरप्राइजेस, आर्वी रोड, पंजाब कॉलनी, वर्धा.`;

    const phone = entry.customerPhone ? entry.customerPhone.replace(/[^0-9]/g, '') : '';
    const url = phone ? `https://wa.me/91${phone}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-fade-in my-auto">
        {/* Top action header (hidden in print) */}
        <div className="no-print bg-slate-900 dark:bg-slate-950 text-white px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            {!isReceipt && (
              <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-xs">
                <button
                  type="button"
                  onClick={() => setDocType('tax-bill')}
                  className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    docType === 'tax-bill'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileText className="w-3 h-3" />
                  <span>टॅक्स बिल</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDocType('quotation')}
                  className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    docType === 'quotation'
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>📋 कोटेशन</span>
                </button>
              </div>
            )}
            <span className="font-mono text-xs text-slate-300 hidden sm:inline">
              {displayDocNumber}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditingSpecs(!isEditingSpecs)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 text-xs font-semibold flex items-center gap-1 cursor-pointer transition"
              title="मॉडेल व सिरीयल नंबर बदला"
            >
              <Edit3 className="w-3 h-3" />
              <span className="hidden sm:inline">मॉडेल / सिरीयल</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>प्रिंट</span>
            </button>
            <button
              onClick={handleShareWhatsApp}
              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition shadow-xs"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Edit Model & Serial No Bar (no-print) */}
        {isEditingSpecs && (
          <div className="no-print bg-amber-50 border-b border-amber-200 p-3 sm:px-5 flex flex-wrap items-center gap-2.5 text-xs animate-fade-in">
            <div className="flex-1 min-w-[130px]">
              <label className="block text-[10px] font-bold text-amber-900 mb-0.5">मॉडेल क्र. (Model No):</label>
              <input
                type="text"
                value={modelNo}
                onChange={(e) => setModelNo(e.target.value)}
                placeholder="उदा. LG-260L-INV"
                className="w-full px-2 py-1 bg-white border border-amber-300 rounded text-slate-800 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div className="flex-1 min-w-[130px]">
              <label className="block text-[10px] font-bold text-amber-900 mb-0.5">सिरीयल क्र. (Serial / IMEI No):</label>
              <input
                type="text"
                value={serialNo}
                onChange={(e) => setSerialNo(e.target.value)}
                placeholder="उदा. SN-8942109"
                className="w-full px-2 py-1 bg-white border border-amber-300 rounded text-slate-800 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            {isQuotationMode && (
              <div className="w-32">
                <label className="block text-[10px] font-bold text-amber-900 mb-0.5">कोटेशन वैधता:</label>
                <input
                  type="text"
                  value={validityDays}
                  onChange={(e) => setValidityDays(e.target.value)}
                  placeholder="उदा. 15 दिवस"
                  className="w-full px-2 py-1 bg-white border border-amber-300 rounded text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            )}
            <div className="flex items-end pt-3">
              <button
                type="button"
                onClick={handleSaveSpecs}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>सेव्ह करा</span>
              </button>
            </div>
          </div>
        )}

        {/* Printable Sheet */}
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

          <div className="p-6 sm:p-7 space-y-4">
            {/* Document Header (Quotation vs Invoice) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-slate-200 pb-3 text-xs">
              <div>
                <span className="font-bold text-slate-900 font-mono text-sm">
                  GST IN 27ALOPL0030G2ZC
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded font-black text-xs uppercase tracking-wide ${
                    isQuotationMode
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : isReceipt
                      ? 'bg-purple-100 text-purple-900 border border-purple-300'
                      : 'bg-blue-100 text-blue-900 border border-blue-300'
                  }`}>
                    {isQuotationMode
                      ? '📋 कोटेशन / अंदाजपत्रक (QUOTATION)'
                      : isReceipt
                      ? 'पावती / PAYMENT RECEIPT'
                      : 'टॅक्स इनव्हॉइस / TAX INVOICE'}
                  </span>
                  <span className="font-bold font-mono text-slate-900 text-sm">
                    #{displayDocNumber}
                  </span>
                </div>
                {entry.refBillNo && (
                  <p className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block mt-1">
                    संदर्भ बिल (Against Bill): #{entry.refBillNo}
                  </p>
                )}
              </div>
              <div className="text-left sm:text-right">
                <p className="text-xs text-slate-700">
                  दिनांक / Date: <span className="font-bold font-mono text-slate-900">{entry.date}</span>
                </p>
                {isQuotationMode ? (
                  <p className="text-[11px] font-bold text-amber-800 mt-1">
                    वैधता: <span className="font-mono">{validityDays}</span>
                  </p>
                ) : (
                  <span className="inline-block px-2 py-0.5 mt-1 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase">
                    भरणा पद्धत: {entry.paymentMode}
                  </span>
                )}
              </div>
            </div>

            {/* Customer info */}
            <div className="bg-slate-50 rounded-xl p-3.5 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-slate-200">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">
                  {isQuotationMode ? 'कोटेशन दिले कोणाला / Quoted To:' : 'नाव / Billed To:'}
                </span>
                <p className="font-bold text-slate-900 text-sm">{entry.customerName}</p>
                {entry.customerPhone && (
                  <p className="text-slate-600 font-mono mt-0.5">मोबाइल क्र : {entry.customerPhone}</p>
                )}
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
                    <th className="py-2.5 px-3 w-10">अ.क्र</th>
                    <th className="py-2.5 px-3">विवरण व साहित्य तपशील (Description)</th>
                    <th className="py-2.5 px-3 text-right">दर / Rate</th>
                    <th className="py-2.5 px-3 text-right">एकूण / Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-slate-100">
                    <td className="py-3 px-3 text-slate-500 font-mono align-top">1</td>
                    <td className="py-3 px-3 space-y-1">
                      <p className="font-bold text-slate-900 text-sm">{entry.itemDetails}</p>

                      {/* Prominent Model & Serial Number Display */}
                      {(modelNo || serialNo) && (
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          {modelNo && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-900 text-[11px] font-mono font-bold">
                              <span className="text-indigo-600 font-sans font-semibold">मॉडेल क्र.:</span>
                              <span>{modelNo}</span>
                            </span>
                          )}
                          {serialNo && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-mono font-bold">
                              <span className="text-amber-700 font-sans font-semibold">सिरीयल / IMEI क्र.:</span>
                              <span>{serialNo}</span>
                            </span>
                          )}
                        </div>
                      )}

                      {entry.notes && (
                        <p className="text-[11px] text-slate-500 italic mt-0.5">
                          नोंद: {entry.notes}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-700 align-top">
                      ₹{(Number(entry.totalAmount) || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-bold font-mono text-slate-900 align-top">
                      ₹{(Number(entry.totalAmount) || 0).toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Total calculation & Status */}
            <div className="space-y-1.5 pt-1 text-xs border-t border-slate-200">
              {isReceipt ? (
                <div className="flex justify-between items-center text-slate-900 bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl font-bold">
                  <span>जमा झालेली रक्कम / Amount Received:</span>
                  <span className="font-bold text-emerald-700 text-base font-mono">
                    ₹{(Number(entry.payingNow) || 0).toLocaleString()}
                  </span>
                </div>
              ) : isQuotationMode ? (
                <>
                  <div className="flex justify-between text-slate-700 font-medium">
                    <span>अंदाजपत्रकीय एकूण रक्कम (Quotation Total):</span>
                    <span className="font-bold text-slate-900 text-base font-mono">
                      ₹{(Number(entry.totalAmount) || 0).toLocaleString()}
                    </span>
                  </div>
                  {Number(entry.payingNow) > 0 && (
                    <div className="flex justify-between text-slate-700 font-medium">
                      <span>टोकन / संभाव्य अ‍ॅडव्हान्स (Token Advance):</span>
                      <span className="font-bold text-emerald-600 text-sm font-mono">
                        ₹{(Number(entry.payingNow) || 0).toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-amber-900 bg-amber-50 px-3 py-1.5 rounded-lg font-bold border border-amber-200">
                    <span>डिलिव्हरी वेळी देय रक्कम (Payable on Delivery):</span>
                    <span className="font-mono text-sm">
                      ₹{(Number(entry.dueAmount || entry.totalAmount) || 0).toLocaleString()}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between text-slate-700 font-medium">
                    <span>एकूण बिल रक्कम / Total Amount:</span>
                    <span className="font-bold text-slate-900 text-sm font-mono">
                      ₹{(Number(entry.totalAmount) || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-700 font-medium">
                    <span>अ‍ॅडव्हान्स भरणा / Paid Now:</span>
                    <span className="font-bold text-emerald-600 text-sm font-mono">
                      ₹{(Number(entry.payingNow) || 0).toLocaleString()}
                    </span>
                  </div>
                  {(Number(entry.dueAmount) || 0) > 0 ? (
                    <div className="flex justify-between text-amber-800 bg-amber-50 px-3 py-1.5 rounded-lg font-bold border border-amber-200">
                      <span>उर्वरित बाकी / Balance Due:</span>
                      <span className="font-mono">₹{(Number(entry.dueAmount) || 0).toLocaleString()}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-emerald-700 text-[11px] font-semibold pt-1">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Full payment received with thanks (पूर्ण भरणा प्राप्त झाला).</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Warranty & Bank Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-200 text-[10px]">
              {/* Warranty / Quotation note */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-2.5 text-amber-900">
                {isQuotationMode ? (
                  <>
                    <p className="font-bold mb-1 flex items-center gap-1 text-amber-950">
                      <ShieldCheck className="w-3 h-3 text-amber-600" />
                      <span>कोटेशन अटी व शर्ती (Quotation Terms):</span>
                    </p>
                    <p className="leading-relaxed text-[9.5px]">
                      हे केवळ अधिकृत अंदाजपत्रक (कोटेशन) असून वस्तू खरेदीच्या वेळी मूळ टॅक्स इन्व्हॉइस दिले जाईल. नमूद केलेले दर १५ दिवसांपर्यंत वैध असून कंपनी उपलब्धतेनुसार बदलू शकतात.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-bold mb-1">वॉरंटी सूचना (Warranty Note):</p>
                    <p className="leading-relaxed text-[9.5px]">
                      दिलेली वॉरंटी ही दुकानदाराची नसून कंपनीची आहे. म्हणून वस्तूत काही बिघाड आल्यास त्याला दुकानदार जबाबदार नसून कंपनी आहे. मॉडेल व सिरीयल नंबरनुसार कंपनी सर्व्हिस सेण्टर दाव्यासाठी आवश्यक आहे.
                    </p>
                  </>
                )}
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
            <div className="pt-3 flex items-end justify-between text-xs text-slate-500 border-t border-slate-100">
              <div>
                <p className="text-[11px] font-medium text-slate-700">
                  {isQuotationMode ? 'कोटेशन प्राप्त केल्याबद्दल धन्यवाद!' : 'Thank you for your business!'}
                </p>
                <p className="text-[9px] text-slate-400 font-mono mt-0.5">
                  ShriSaiEnt.in • Wardha 442001
                </p>
              </div>
              <div className="text-center">
                <div className="h-7 w-28 border-b border-dashed border-slate-400 mx-auto"></div>
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
