import React from 'react';
import { X, Printer, Share2, Building2, Phone, MapPin, CheckCircle2, FileText, Truck } from 'lucide-react';
import { PurchaseEntry, BusinessSettings } from '../types';

interface PurchaseInvoiceModalProps {
  purchase: PurchaseEntry | null;
  settings: BusinessSettings;
  onClose: () => void;
}

export const PurchaseInvoiceModal: React.FC<PurchaseInvoiceModalProps> = ({
  purchase,
  settings,
  onClose,
}) => {
  if (!purchase) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `*खरेदी कर बीजक (Purchase Tax Invoice)*\n` +
      `वितरक (Supplier): ${purchase.supplierName}\n` +
      `बीजक क्र. (Invoice No): ${purchase.billNo}\n` +
      `दिनांक (Date): ${purchase.date}\n` +
      `वस्तू / Model: ${purchase.items}\n` +
      `रक्कम (Total): ₹${purchase.totalAmount.toLocaleString()}\n` +
      `पेमेंट स्थिती: ${purchase.status}\n` +
      (purchase.bankDetails ? `बँक खाते: ${purchase.bankDetails.bankName || ''} A/C: ${purchase.bankDetails.accountNo || ''}\n` : '') +
      `दुकान: ${settings.businessName} (Wardha)`
    );
    const phone = (purchase.supplierPhone || '').replace(/\D/g, '');
    const url = phone ? `https://wa.me/91${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  const lineItems = purchase.lineItems && purchase.lineItems.length > 0 ? purchase.lineItems : [
    {
      description: purchase.items || 'माल / इलेक्ट्रॉनिक्स साहित्य',
      hsn: '84182100',
      quantity: 1,
      rate: purchase.taxableAmount || Math.round(purchase.totalAmount / 1.18),
      discount: 0,
      taxableAmount: purchase.taxableAmount || Math.round(purchase.totalAmount / 1.18),
      cgstRate: 9,
      cgstAmount: purchase.cgstAmount || Math.round((purchase.totalAmount * 0.09) / 1.18),
      sgstRate: 9,
      sgstAmount: purchase.sgstAmount || Math.round((purchase.totalAmount * 0.09) / 1.18),
      totalAmount: purchase.totalAmount,
      serialNumbers: purchase.notes?.match(/([A-Z0-9]{8,20})/g) || [],
    }
  ];

  const subtotal = purchase.taxableAmount || lineItems.reduce((acc, it) => acc + (it.taxableAmount || 0), 0);
  const cgst = purchase.cgstAmount || lineItems.reduce((acc, it) => acc + (it.cgstAmount || 0), 0);
  const sgst = purchase.sgstAmount || lineItems.reduce((acc, it) => acc + (it.sgstAmount || 0), 0);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white text-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh]">
        {/* Modal Top Control Bar (Hidden on Print) */}
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between no-print border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            <div>
              <span className="font-bold text-sm">खरेदी कर बीजक (Purchase Tax Invoice)</span>
              <span className="text-xs text-slate-400 ml-2">#{purchase.billNo}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>प्रिंट करा (Print A4)</span>
            </button>
            <button
              onClick={handleWhatsApp}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Invoice Body (Matches Manisha Enterprises exact layout) */}
        <div className="p-6 sm:p-8 overflow-y-auto font-sans text-xs print:p-0 print:m-0 print:text-[11px] leading-tight select-text">
          {/* Top Section: Supplier Details & Tax Invoice Title */}
          <div className="border border-slate-900 p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-3 border-b border-slate-400">
              <div>
                <span className="text-[10px] text-slate-500 font-semibold block uppercase">Registered Address :</span>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight uppercase">
                  {purchase.supplierName}
                </h2>
                <p className="text-xs text-slate-700 font-medium max-w-md mt-0.5">
                  {purchase.supplierAddress || 'INGOLE CHOWK MAIN ROAD WARDHA 442001 MAHARASHTRA INDIA'}
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-800 mt-1 font-semibold">
                  <span>Phone : {purchase.supplierPhone || '9766911693'}</span>
                  <span>GSTIN/UIN : <strong className="font-mono">{purchase.supplierGstin || '27ABDPB8956C1ZS'}</strong></span>
                  <span>State : MAHARASHTRA</span>
                </div>
              </div>

              <div className="text-right sm:min-w-[220px]">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-wide border-b-2 border-slate-900 pb-1 inline-block">
                  Tax Invoice
                </h1>
                <div className="mt-2 space-y-1 text-xs text-slate-800">
                  <div className="flex justify-between gap-2">
                    <span className="font-bold">Tax Invoice :</span>
                    <span className="font-black font-mono">{purchase.billNo}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="font-bold">Date :</span>
                    <span className="font-semibold">{purchase.date}</span>
                  </div>
                  <div className="flex justify-between gap-2 text-[11px] text-slate-600">
                    <span>Location :</span>
                    <span>{purchase.location || 'LG DISTRIBUTION'}</span>
                  </div>
                  {purchase.salesConsultant && (
                    <div className="flex justify-between gap-2 text-[11px] text-slate-600">
                      <span>Sales Consultant :</span>
                      <span>{purchase.salesConsultant}</span>
                    </div>
                  )}
                  {purchase.approvedBy && (
                    <div className="flex justify-between gap-2 text-[11px] text-slate-600">
                      <span>Approved By :</span>
                      <span>{purchase.approvedBy}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bill To & Ship To (Customer/Buyer = Shri Sai Enterprises) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-3 border-b border-slate-400">
              <div className="border-r border-slate-300 pr-3">
                <span className="font-bold text-slate-900 text-xs block mb-1">
                  Bill To : <strong className="uppercase">{settings.businessName || 'SHRI SAI ENTERPRISES'}-LG-WARDHA[NEW]</strong>
                </span>
                <p className="text-xs text-slate-700">
                  {settings.address || 'WARD NO 1, NEAR DATEY SABHAGRUH, ARVI ROAD, WARDHA 442001 MAHARASHTRA INDIA'}
                </p>
                <div className="mt-1 space-y-0.5 text-xs text-slate-800">
                  <p>Phone : {settings.phone || '8600122978'}, {settings.additionalPhones?.[0] || '8766486915'}</p>
                  <p>Email : {settings.email || 'shrisaienterprises@gmail.com'}</p>
                  <p>GSTIN/UIN : <strong className="font-mono">{settings.gstin || '27ALOPL0030G2ZC'}</strong></p>
                  <p>State : MAHARASHTRA | PAN : ALOPL0030G</p>
                </div>
              </div>

              <div className="pl-1">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold text-slate-900 text-xs block mb-1">
                      Ship To : <strong className="uppercase">{settings.businessName || 'SHRI SAI ENTERPRISES'}-LG-WARDHA[NEW]</strong>
                    </span>
                    <p className="text-xs text-slate-700">
                      {settings.address || 'WARD NO 1, NEAR DATEY SABHAGRUH, ARVI ROAD, WARDHA 442001 MAHARASHTRA INDIA'}
                    </p>
                    <p className="mt-1 text-xs text-slate-800">Phone : {settings.phone || '8600122978'}</p>
                  </div>
                  <div className="text-right text-xs bg-slate-50 p-2 rounded border border-slate-200 min-w-[130px]">
                    <p className="font-bold text-slate-900">PO No : {purchase.poNo || 'CSSO2526-00579'}</p>
                    <p className="text-slate-600">PO Date : {purchase.poDate || '23/02/2026'}</p>
                    <p className="text-[10px] text-indigo-700 font-semibold mt-1">BP LESS 500 EXTRA</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="my-3 overflow-x-auto">
              <table className="w-full border-collapse border border-slate-400 text-xs text-left">
                <thead>
                  <tr className="bg-slate-100 font-bold border-b border-slate-400 text-slate-900">
                    <th className="p-2 border-r border-slate-400 text-center w-8">#</th>
                    <th className="p-2 border-r border-slate-400">Description / Model</th>
                    <th className="p-2 border-r border-slate-400 text-center w-20">HSN</th>
                    <th className="p-2 border-r border-slate-400 text-center w-12">Qty</th>
                    <th className="p-2 border-r border-slate-400 text-right w-20">Rate</th>
                    <th className="p-2 border-r border-slate-400 text-right w-16">Discount</th>
                    <th className="p-2 border-r border-slate-400 text-right w-24">Taxable</th>
                    <th className="p-2 border-r border-slate-400 text-right w-20">Tax</th>
                    <th className="p-2 text-right w-24">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item, idx) => (
                    <React.Fragment key={idx}>
                      <tr className="border-b border-slate-300">
                        <td className="p-2 border-r border-slate-400 text-center font-bold">{idx + 1}</td>
                        <td className="p-2 border-r border-slate-400 font-black text-slate-900">
                          {item.description}
                        </td>
                        <td className="p-2 border-r border-slate-400 text-center font-mono">{item.hsn || '84182100'}</td>
                        <td className="p-2 border-r border-slate-400 text-center font-bold">{item.quantity}</td>
                        <td className="p-2 border-r border-slate-400 text-right font-mono font-semibold">
                          {(item.rate || 0).toLocaleString()}
                        </td>
                        <td className="p-2 border-r border-slate-400 text-right font-mono">
                          {(item.discount || 0).toLocaleString()}
                        </td>
                        <td className="p-2 border-r border-slate-400 text-right font-mono font-bold">
                          {(item.taxableAmount || 0).toLocaleString()}
                        </td>
                        <td className="p-2 border-r border-slate-400 text-right font-mono">
                          {((item.cgstAmount || 0) + (item.sgstAmount || 0)).toLocaleString()}
                        </td>
                        <td className="p-2 text-right font-mono font-black text-slate-900">
                          {(item.totalAmount || 0).toLocaleString()}
                        </td>
                      </tr>
                      {/* Serial Numbers / IMEI Row */}
                      {item.serialNumbers && item.serialNumbers.length > 0 && (
                        <tr className="border-b border-slate-400 bg-amber-50/40">
                          <td className="p-1 border-r border-slate-400"></td>
                          <td colSpan={8} className="p-2 font-mono text-[11px] text-slate-800">
                            <span className="font-bold text-slate-900 mr-2">सिरीयल क्रमांक (Serial / IMEI Nos):</span>
                            <span className="bg-white px-2 py-0.5 rounded border border-amber-300 font-bold text-indigo-950">
                              {item.serialNumbers.join(', ')}
                            </span>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Tax Detail Breakdown Table (Matching HSN / CGST / SGST exactly) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-3 items-start">
              <div className="border border-slate-400">
                <div className="bg-slate-100 p-1.5 font-bold text-[11px] text-slate-900 border-b border-slate-400">
                  Tax Detail (कराचा तपशील)
                </div>
                <table className="w-full text-[11px] text-left">
                  <thead>
                    <tr className="border-b border-slate-300 bg-slate-50 font-semibold">
                      <th className="p-1.5 border-r border-slate-300">HSN CODE</th>
                      <th className="p-1.5 border-r border-slate-300 text-center" colSpan={2}>CGST</th>
                      <th className="p-1.5 border-r border-slate-300 text-center" colSpan={2}>U/SGST</th>
                      <th className="p-1.5 text-right">TOTAL TAX</th>
                    </tr>
                    <tr className="border-b border-slate-400 text-[10px] text-slate-600 bg-slate-50">
                      <th className="p-1 border-r border-slate-300"></th>
                      <th className="p-1 text-center">%</th>
                      <th className="p-1 border-r border-slate-300 text-right">रक्कम</th>
                      <th className="p-1 text-center">%</th>
                      <th className="p-1 border-r border-slate-300 text-right">रक्कम</th>
                      <th className="p-1 text-right">₹</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-300 font-mono">
                      <td className="p-1.5 border-r border-slate-300 font-bold">84182100</td>
                      <td className="p-1.5 text-center">9.00%</td>
                      <td className="p-1.5 border-r border-slate-300 text-right">₹{cgst.toLocaleString()}</td>
                      <td className="p-1.5 text-center">9.00%</td>
                      <td className="p-1.5 border-r border-slate-300 text-right">₹{sgst.toLocaleString()}</td>
                      <td className="p-1.5 text-right font-bold">₹{(cgst + sgst).toLocaleString()}</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="font-bold bg-slate-100 font-mono">
                      <td className="p-1.5 border-r border-slate-300">एकूण कर (Total)</td>
                      <td className="p-1.5 text-center">9%</td>
                      <td className="p-1.5 border-r border-slate-300 text-right">₹{cgst.toLocaleString()}</td>
                      <td className="p-1.5 text-center">9%</td>
                      <td className="p-1.5 border-r border-slate-300 text-right">₹{sgst.toLocaleString()}</td>
                      <td className="p-1.5 text-right font-black">₹{(cgst + sgst).toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Subtotal, CGST, SGST, Total Calculation Card */}
              <div className="border border-slate-400 divide-y divide-slate-300">
                <div className="flex justify-between p-2">
                  <span className="font-bold text-slate-700">Subtotal (करपात्र मूल्य) :</span>
                  <span className="font-mono font-bold text-slate-900">₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between p-2">
                  <span className="text-slate-700">CGST (9%) :</span>
                  <span className="font-mono text-slate-900">₹{cgst.toLocaleString()}</span>
                </div>
                <div className="flex justify-between p-2">
                  <span className="text-slate-700">U/SGST (9%) :</span>
                  <span className="font-mono text-slate-900">₹{sgst.toLocaleString()}</span>
                </div>
                <div className="flex justify-between p-2.5 bg-slate-900 text-white font-black text-sm">
                  <span>TOTAL INVOICE (एकूण देय रक्कम) :</span>
                  <span className="font-mono text-base">₹{purchase.totalAmount.toLocaleString()}</span>
                </div>
                <div className="p-2 text-[11px] text-slate-600 bg-slate-50 flex justify-between">
                  <span>पेमेंट स्थिती: <strong className="text-emerald-700">{purchase.status}</strong> (मोड: {purchase.paymentMode})</span>
                  <span>जमा: ₹{purchase.paidAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Bank Details & Logistics Footer */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-3 border-t border-slate-400 text-xs">
              <div className="space-y-1">
                <span className="font-bold text-slate-900 uppercase block">वितरक बँक तपशील (Supplier Bank Details):</span>
                <p className="font-mono font-bold text-slate-800">
                  A/C NAME : {purchase.bankDetails?.accountName || 'MANISHA ENTERPRISE'}
                </p>
                <p className="font-mono font-bold text-slate-800">
                  A/C NO. : {purchase.bankDetails?.accountNo || '108051000302'} | IFSC CODE : {purchase.bankDetails?.ifsc || 'ICIC0001080'}
                </p>
                <p className="text-slate-700">
                  BANK : {purchase.bankDetails?.bankName || 'ICICI BANK, BRANCH : SHIVAJI CHOWK, ARVI ROAD, WARDHA'}
                </p>
                <div className="pt-2 text-[11px] text-slate-600 space-y-0.5">
                  <p>Transporter : <strong>{purchase.transporter || 'GENERAL TRANSPORT'}</strong></p>
                  <p className="font-mono truncate">IRN / Eway Bill : {purchase.ewayBillNo || '1157e72a690b8a5814ec191c0d6fc38f595d1ba078a40ccff9b91418bf4e10f4'}</p>
                  <p>Ack Date : {purchase.ackDate || '2026-02-25 19:26:00'}</p>
                </div>
              </div>

              {/* Declarations & Signatures */}
              <div className="flex flex-col justify-between pt-1">
                <div className="text-[10px] text-slate-600 space-y-0.5 border border-slate-200 p-2 rounded bg-slate-50">
                  <span className="font-bold text-slate-800 block">Declaration & Terms:</span>
                  <p>1) Received the above goods in good condition with registered serial numbers.</p>
                  <p>2) Articles once sold will not be taken back without original packaging.</p>
                  <p>3) Subject to Wardha / Nagpur Jurisdiction.</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-6 text-center text-xs">
                  <div className="border-t border-slate-400 pt-1 font-bold text-slate-800">
                    Customer Signature
                    <span className="block text-[10px] font-normal text-slate-500">(Shri Sai Enterprises)</span>
                  </div>
                  <div className="border-t border-slate-400 pt-1 font-bold text-slate-800">
                    Authorised Signatory
                    <span className="block text-[10px] font-normal text-slate-500">For {purchase.supplierName}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer Actions (Hidden on Print) */}
        <div className="bg-slate-100 dark:bg-slate-800 px-4 py-3 flex items-center justify-between border-t border-slate-200 dark:border-slate-700 no-print">
          <span className="text-xs text-slate-500">
            ✓ अधिकृत जीएसटी खरेदी बीजक (Official GST Purchase Tax Invoice Format)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>प्रिंट इनव्हॉइस (Print)</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition cursor-pointer"
            >
              बंद करा (Close)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
