import React from 'react';
import { Printer, Share2, X, Building2, QrCode, Phone, MapPin, Truck, CheckCircle } from 'lucide-react';
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

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `*PURCHASE TAX INVOICE*\n` +
      `*Supplier:* ${purchase.supplierName}\n` +
      (purchase.supplierGstin ? `*Supplier GSTIN:* ${purchase.supplierGstin}\n` : '') +
      `*Invoice No:* ${purchase.billNo}\n` +
      `*Date:* ${purchase.date}\n` +
      (purchase.poNo ? `*PO No:* ${purchase.poNo} (${purchase.poDate || ''})\n` : '') +
      `--------------------------------\n` +
      `*Buyer:* ${purchase.buyerName || settings.businessName}\n` +
      `*Items:* ${purchase.items}\n` +
      (purchase.itemsDetail && purchase.itemsDetail.some(i => i.serialNumbers && i.serialNumbers.length > 0)
        ? `*Serials:* ${purchase.itemsDetail.flatMap(i => i.serialNumbers || []).join(', ')}\n`
        : '') +
      `--------------------------------\n` +
      `*Subtotal (Taxable):* ₹${(purchase.subtotal || purchase.totalAmount).toLocaleString('en-IN')}\n` +
      (purchase.cgstAmount ? `*CGST:* ₹${purchase.cgstAmount.toLocaleString('en-IN')}\n` : '') +
      (purchase.sgstAmount ? `*SGST:* ₹${purchase.sgstAmount.toLocaleString('en-IN')}\n` : '') +
      `*TOTAL INVOICE:* ₹${purchase.totalAmount.toLocaleString('en-IN')}\n` +
      `*Paid:* ₹${purchase.paidAmount.toLocaleString('en-IN')} (${purchase.paymentMode})\n` +
      `*Balance Due:* ₹${Math.max(0, purchase.totalAmount - purchase.paidAmount).toLocaleString('en-IN')}\n` +
      `--------------------------------\n` +
      `Shri Sai Enterprises • Wardha ERP`
    );

    const phone = purchase.supplierPhone ? purchase.supplierPhone.replace(/[^0-9]/g, '') : '';
    const url = phone ? `https://wa.me/91${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  // Fallback items array if itemsDetail is not set
  const itemsList = purchase.itemsDetail && purchase.itemsDetail.length > 0
    ? purchase.itemsDetail
    : [
        {
          id: 'item-1',
          description: purchase.items || 'Procured Goods / Electronics',
          hsn: '84182100',
          qty: 1,
          rate: purchase.subtotal || Math.round(purchase.totalAmount / 1.18),
          discount: 0,
          taxableAmount: purchase.subtotal || Math.round(purchase.totalAmount / 1.18),
          taxRate: 18,
          cgstRate: 9,
          cgstAmount: purchase.cgstAmount || Math.round((purchase.totalAmount - (purchase.subtotal || Math.round(purchase.totalAmount / 1.18))) / 2),
          sgstRate: 9,
          sgstAmount: purchase.sgstAmount || Math.round((purchase.totalAmount - (purchase.subtotal || Math.round(purchase.totalAmount / 1.18))) / 2),
          taxAmount: purchase.totalTax || (purchase.totalAmount - (purchase.subtotal || Math.round(purchase.totalAmount / 1.18))),
          totalAmount: purchase.totalAmount,
          serialNumbers: [],
        },
      ];

  const subtotal = purchase.subtotal || itemsList.reduce((acc, i) => acc + (i.taxableAmount || 0), 0);
  const cgstTotal = purchase.cgstAmount || itemsList.reduce((acc, i) => acc + (i.cgstAmount || 0), 0);
  const sgstTotal = purchase.sgstAmount || itemsList.reduce((acc, i) => acc + (i.sgstAmount || 0), 0);
  const grandTotal = purchase.totalAmount;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:m-0 print:static print:bg-white">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden border border-slate-200 animate-fade-in my-auto print:my-0 print:border-none print:shadow-none print:rounded-none print:max-w-none text-slate-900 font-sans">
        
        {/* Top Control Bar (Hidden when printing) */}
        <div className="no-print bg-slate-900 text-white px-5 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-0.5 rounded bg-blue-600 font-bold uppercase text-[10px]">
              खरेदी बीजक (Purchase Tax Invoice)
            </span>
            <span className="font-mono text-slate-300 font-bold">
              #{purchase.billNo}
            </span>
            <span className="text-slate-400">
              • {purchase.supplierName}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>प्रिंट (Print A4 Invoice)</span>
            </button>

            <button
              onClick={handleShareWhatsApp}
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer active:scale-95"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp पाठवा</span>
            </button>

            <button
              onClick={onClose}
              type="button"
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Purchase Tax Invoice Layout (Exact replica of Manisha Enterprises format) */}
        <div className="p-6 sm:p-8 bg-white print:p-4 text-[11px] leading-tight text-black border border-slate-300 print:border-black">
          
          {/* Supplier Header Block */}
          <div className="flex justify-between items-start border-b border-black pb-3">
            <div className="flex-1 pr-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 border border-blue-900 text-blue-900 flex items-center justify-center font-black text-xs">
                  M
                </div>
                <div>
                  <h1 className="text-base sm:text-lg font-black tracking-tight text-blue-950 uppercase">
                    {purchase.supplierName || 'MANISHA ENTERPRISES'}
                  </h1>
                  <p className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">
                    DISTRIBUTOR & WHOLESALE ELECTRONICS
                  </p>
                </div>
              </div>
              <p className="mt-1.5 text-[10px] text-slate-700">
                <span className="font-bold">Registered Address:</span>{' '}
                {purchase.supplierAddress || 'INGOLE CHOWK MAIN ROAD WARDHA 442001 MAHARASHTRA INDIA'}
              </p>
              <p className="text-[10px] text-slate-700">
                <span className="font-bold">Phone:</span> {purchase.supplierPhone || '9766911693'}
              </p>
              <p className="text-[10px] text-slate-700">
                <span className="font-bold">GSTIN/UIN:</span>{' '}
                <span className="font-mono font-bold">{purchase.supplierGstin || '27ABDPB8956C1ZS'}</span>
                {' '}• <span className="font-bold">State:</span> {purchase.supplierState || 'MAHARASHTRA'}
              </p>
            </div>

            {/* QR Code / IRN Box Placeholder */}
            <div className="w-24 h-24 border border-black p-1 flex flex-col items-center justify-center text-center shrink-0 bg-slate-50">
              <QrCode className="w-14 h-14 text-black stroke-[1.2]" />
              <span className="text-[8px] font-mono mt-0.5">GST E-INVOICE</span>
            </div>
          </div>

          {/* Location & Tax Invoice Title Bar */}
          <div className="grid grid-cols-3 border-b border-black py-1.5 bg-slate-100/70 font-semibold text-[10px]">
            <div>
              <span className="text-slate-600">Location :</span>{' '}
              <span className="font-bold">{purchase.location || 'LG DISTRIBUTION'}</span>
            </div>
            <div className="text-center font-black text-xs tracking-wider uppercase underline">
              Tax Invoice
            </div>
            <div className="text-right">
              <span className="text-slate-600">Sales Consultant :</span>{' '}
              <span className="font-bold">{purchase.salesConsultant || 'DHIRAJ BHOWARE'}</span>
            </div>
          </div>

          {/* Invoice No, Date & Approval */}
          <div className="grid grid-cols-2 sm:grid-cols-3 border-b border-black py-1 text-[10px]">
            <div>
              <span className="font-bold">Tax Invoice :</span>{' '}
              <span className="font-mono font-bold text-[11px]">{purchase.billNo}</span>
            </div>
            <div className="text-center">
              <span className="font-bold">Date :</span>{' '}
              <span className="font-mono font-bold">{purchase.date}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-600">Approved By :</span>{' '}
              <span className="font-bold">{purchase.approvedBy || 'ARTI INGOLE'}</span>
            </div>
          </div>

          {/* Bill To & Ship To 2-Column Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 border-b border-black text-[10px]">
            {/* Bill To */}
            <div className="p-2 border-r border-black">
              <p className="font-bold uppercase text-[10px] text-slate-800">
                Bill To : <span className="font-black">{purchase.buyerName || `${settings.businessName}-LG-WARDHA[NEW]`}</span>
              </p>
              <p className="text-slate-700 mt-0.5">
                {purchase.buyerAddress || settings.address || 'मातोश्री सभागृह समोर, आर्वी रोड, पंजाब कॉलनी, वर्धा - ४४२००१'}
              </p>
              <p className="mt-1 text-slate-700">
                <span className="font-bold">Phone :</span> {settings.phone || '8766486915 / 8600122798'}
              </p>
              <p className="text-slate-700">
                <span className="font-bold">Email :</span> {settings.email || 'shubhamh3098@gmail.com'}
              </p>
              <p className="text-slate-700 font-mono mt-1">
                <span className="font-bold font-sans">GSTIN/UIN :</span>{' '}
                <span className="font-bold">{purchase.buyerGstin || settings.gstin || '27ALOPL0030G2ZC'}</span>
              </p>
              <p className="text-slate-700">
                <span className="font-bold">State :</span> MAHARASHTRA
              </p>
            </div>

            {/* Ship To & PO Info */}
            <div className="p-2">
              <p className="font-bold uppercase text-[10px] text-slate-800">
                Ship To : <span className="font-black">{purchase.buyerName || `${settings.businessName}-LG-WARDHA[NEW]`}</span>
              </p>
              <p className="text-slate-700 mt-0.5">
                {purchase.buyerAddress || settings.address || 'मातोश्री सभागृह समोर, आर्वी रोड, पंजाब कॉलनी, वर्धा - ४४२००१'}
              </p>
              <p className="mt-1 text-slate-700">
                <span className="font-bold">Phone :</span> {settings.phone || '8766486915 / 8600122798'}
              </p>
              <div className="mt-2 pt-1 border-t border-dashed border-slate-300 grid grid-cols-2 gap-1 text-[10px]">
                <div>
                  <span className="font-bold">PO No :</span>{' '}
                  <span className="font-mono font-bold">{purchase.poNo || 'CSSO2526-00579'}</span>
                </div>
                <div>
                  <span className="font-bold">PO Date :</span>{' '}
                  <span className="font-mono">{purchase.poDate || '23/02/2026'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Items Table with Serial Numbers Under Row */}
          <table className="w-full border-collapse border-b border-black text-[10px]">
            <thead>
              <tr className="border-b border-black bg-slate-100 font-bold text-center">
                <th className="p-1.5 border-r border-black w-8">#</th>
                <th className="p-1.5 border-r border-black text-left">Description</th>
                <th className="p-1.5 border-r border-black w-20">HSN</th>
                <th className="p-1.5 border-r border-black w-12">Qty</th>
                <th className="p-1.5 border-r border-black w-18 text-right">Rate</th>
                <th className="p-1.5 border-r border-black w-14 text-right">Discount</th>
                <th className="p-1.5 border-r border-black w-20 text-right">Taxable</th>
                <th className="p-1.5 border-r border-black w-16 text-right">Tax</th>
                <th className="p-1.5 text-right w-22">Amount</th>
              </tr>
            </thead>
            <tbody>
              {itemsList.map((item, idx) => (
                <React.Fragment key={item.id || idx}>
                  <tr className="border-b border-slate-200">
                    <td className="p-1.5 border-r border-black text-center font-bold">{idx + 1}</td>
                    <td className="p-1.5 border-r border-black font-bold uppercase">{item.description}</td>
                    <td className="p-1.5 border-r border-black text-center font-mono">{item.hsn || '84182100'}</td>
                    <td className="p-1.5 border-r border-black text-center font-bold">{item.qty}</td>
                    <td className="p-1.5 border-r border-black text-right font-mono">{item.rate?.toLocaleString('en-IN')}</td>
                    <td className="p-1.5 border-r border-black text-right font-mono">{item.discount || 0}</td>
                    <td className="p-1.5 border-r border-black text-right font-mono font-bold">{item.taxableAmount?.toLocaleString('en-IN')}</td>
                    <td className="p-1.5 border-r border-black text-right font-mono">{item.taxAmount?.toLocaleString('en-IN')}</td>
                    <td className="p-1.5 text-right font-mono font-bold">{item.totalAmount?.toLocaleString('en-IN')}</td>
                  </tr>
                  
                  {/* Serial Numbers / Barcodes row printed underneath item */}
                  {item.serialNumbers && item.serialNumbers.length > 0 && (
                    <tr className="border-b border-black bg-slate-50/70">
                      <td className="p-1 border-r border-black"></td>
                      <td colSpan={8} className="p-1 font-mono text-[9px] text-slate-800">
                        <span className="font-bold text-slate-500 font-sans">Serial Nos:</span>{' '}
                        <span className="font-bold tracking-wider">{item.serialNumbers.join(', ')}</span>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>

          {/* Tax Breakdown Table (Exact match to Manisha Enterprises Tax Detail block) */}
          <div className="mt-2 border border-black">
            <div className="bg-slate-100 border-b border-black px-2 py-0.5 font-bold text-[9px] uppercase">
              Tax Detail
            </div>
            <table className="w-full border-collapse text-[9px] text-center">
              <thead>
                <tr className="border-b border-black font-semibold">
                  <th className="p-1 border-r border-black">HSN CODE</th>
                  <th className="p-1 border-r border-black" colSpan={2}>CGST</th>
                  <th className="p-1 border-r border-black" colSpan={2}>U/SGST</th>
                  <th className="p-1 border-r border-black" colSpan={2}>IGST</th>
                  <th className="p-1 border-r border-black">CESS</th>
                  <th className="p-1">TOTAL TAX</th>
                </tr>
                <tr className="border-b border-black text-[8px] bg-slate-50">
                  <th className="p-0.5 border-r border-black"></th>
                  <th className="p-0.5 border-r border-black w-12">%</th>
                  <th className="p-0.5 border-r border-black w-16">Amount</th>
                  <th className="p-0.5 border-r border-black w-12">%</th>
                  <th className="p-0.5 border-r border-black w-16">Amount</th>
                  <th className="p-0.5 border-r border-black w-12">%</th>
                  <th className="p-0.5 border-r border-black w-16">Amount</th>
                  <th className="p-0.5 border-r border-black"></th>
                  <th className="p-0.5"></th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-1 border-r border-black font-mono">84182100</td>
                  <td className="p-1 border-r border-black font-mono">9.00 %</td>
                  <td className="p-1 border-r border-black font-mono">{cgstTotal.toFixed(2)}</td>
                  <td className="p-1 border-r border-black font-mono">9.00 %</td>
                  <td className="p-1 border-r border-black font-mono">{sgstTotal.toFixed(2)}</td>
                  <td className="p-1 border-r border-black font-mono">0.00 %</td>
                  <td className="p-1 border-r border-black font-mono">0.00</td>
                  <td className="p-1 border-r border-black font-mono">0.00</td>
                  <td className="p-1 font-mono font-bold">{(cgstTotal + sgstTotal).toFixed(2)}</td>
                </tr>
                <tr className="border-t border-black font-bold bg-slate-50">
                  <td className="p-1 border-r border-black">Total</td>
                  <td className="p-1 border-r border-black"></td>
                  <td className="p-1 border-r border-black font-mono">{cgstTotal.toFixed(2)}</td>
                  <td className="p-1 border-r border-black"></td>
                  <td className="p-1 border-r border-black font-mono">{sgstTotal.toFixed(2)}</td>
                  <td className="p-1 border-r border-black"></td>
                  <td className="p-1 border-r border-black font-mono">0.00</td>
                  <td className="p-1 border-r border-black">0.00</td>
                  <td className="p-1 font-mono">{(cgstTotal + sgstTotal).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Bank Details & Totals Summary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 border border-black border-t-0 text-[10px]">
            {/* Left: Bank details & Transporter */}
            <div className="p-2 border-r border-black space-y-1">
              <p className="font-bold uppercase text-[9px] text-slate-600">Supplier Bank Details:</p>
              <p className="font-bold">A/C NAME : {purchase.supplierBank?.accountName || 'MANISHA ENTERPRISE'}</p>
              <p className="font-mono">A/C NO. : {purchase.supplierBank?.accountNo || '108051000302'}</p>
              <p className="font-mono">IFSC CODE : {purchase.supplierBank?.ifscCode || 'ICIC0001080'}</p>
              <p>BANK : {purchase.supplierBank?.bankName || 'ICICI BANK'}, BRANCH : {purchase.supplierBank?.branch || 'SHIVAJI CHOWK, ARVI ROAD, WARDHA'}</p>
              <div className="pt-2 mt-2 border-t border-dashed border-slate-300">
                <span className="font-bold">Transporter :</span> {purchase.transporter || 'GENERAL TRANSPORT'}
                {purchase.vehicleNo && <span> • Vehicle: {purchase.vehicleNo}</span>}
              </div>
            </div>

            {/* Right: Subtotal, CGST, SGST, Grand Total */}
            <div className="divide-y divide-black">
              <div className="flex justify-between p-1.5 font-bold">
                <span>Subtotal (करपात्र रक्कम) :</span>
                <span className="font-mono">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between p-1.5">
                <span>CGST (९%) :</span>
                <span className="font-mono">₹{Math.round(cgstTotal).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between p-1.5">
                <span>U/SGST (९%) :</span>
                <span className="font-mono">₹{Math.round(sgstTotal).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between p-2 font-black text-sm bg-slate-100">
                <span>TOTAL INVOICE (एकूण देय) :</span>
                <span className="font-mono">₹{grandTotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between p-1.5 text-[10px] bg-emerald-50">
                <span className="text-emerald-900 font-bold">रक्कम जमा (Paid) :</span>
                <span className="font-mono font-bold text-emerald-800">₹{purchase.paidAmount.toLocaleString('en-IN')}</span>
              </div>
              {grandTotal - purchase.paidAmount > 0 && (
                <div className="flex justify-between p-1.5 text-[10px] bg-rose-50">
                  <span className="text-rose-900 font-bold">उर्वरित बाकी (Payable Due) :</span>
                  <span className="font-mono font-black text-rose-700">₹{(grandTotal - purchase.paidAmount).toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Footer Terms & Signatures */}
          <div className="grid grid-cols-2 border border-black border-t-0 p-2 text-[9px]">
            <div>
              <p className="font-bold underline">Declaration :</p>
              <p className="text-slate-600 mt-0.5">
                We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
              </p>
              <ol className="list-decimal pl-3.5 mt-1 text-slate-500 space-y-0.2">
                <li>Cheques are subject to realization</li>
                <li>Received the above goods in good condition</li>
                <li>Articles once sold will not be taken back</li>
                <li>Subject to Wardha/Nagpur Jurisdiction</li>
              </ol>
            </div>

            <div className="flex flex-col justify-between items-end text-right pl-4">
              <p className="font-bold">For {purchase.supplierName || 'MANISHA ENTERPRISES'}</p>
              <div className="pt-8">
                <p className="border-t border-black font-bold pt-1 px-4">
                  Authorised Signatory
                </p>
              </div>
            </div>
          </div>

          {/* Acknowledgement / IRN footer */}
          <div className="mt-1 text-[8px] font-mono text-slate-500 flex justify-between">
            <span>IRN : {purchase.irn || '1157e72a690b8a5814ec191c0d6fc38f595d1ba078a40ccff9b91418bf4e10f4'}</span>
            <span>Ack Date : {purchase.date} 19:26:00</span>
          </div>

        </div>

      </div>
    </div>
  );
};
