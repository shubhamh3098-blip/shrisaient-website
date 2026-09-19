import React from 'react';
import { TransactionEntry, BusinessSettings, InvoiceLineItem } from '../types';
import { numberToIndianWords } from '../utils/numberToWords';

export interface DispatchDetails {
  deliveryNote?: string;
  termsOfPayment?: string;
  suppliersRef?: string;
  otherRef?: string;
  buyersOrderNo?: string;
  buyersOrderDate?: string;
  despatchDocNo?: string;
  deliveryNoteDate?: string;
  despatchedThrough?: string;
  destination?: string;
  termsOfDelivery?: string;
}

interface ProfessionalGstInvoiceProps {
  entry: TransactionEntry;
  settings: BusinessSettings;
  docType: 'tax-bill' | 'quotation';
  lineItems: InvoiceLineItem[];
  dispatchDetails: DispatchDetails;
  modelNo?: string;
  serialNo?: string;
  validityDays?: string;
}

export const ProfessionalGstInvoice: React.FC<ProfessionalGstInvoiceProps> = ({
  entry,
  settings,
  docType,
  lineItems,
  dispatchDetails,
  modelNo,
  serialNo,
  validityDays,
}) => {
  const isQuotation = docType === 'quotation';

  // Total quantity calculation
  const totalQty = lineItems.reduce((acc, item) => acc + (Number(item.qty) || 0), 0);

  // Total item amount
  const rawTotalAmount = lineItems.reduce(
    (acc, item) => acc + (Number(item.amount) || Number(item.qty) * Number(item.rate) || 0),
    0
  );

  const finalTotalAmount = rawTotalAmount > 0 ? rawTotalAmount : (Number(entry.totalAmount) || 0);

  // Standard Indian GST calculation (18% GST: 9% CGST + 9% SGST inclusive)
  // Taxable Value = Total / 1.18
  const taxableValue = Math.round((finalTotalAmount / 1.18) * 100) / 100;
  const cgstAmount = Math.round(taxableValue * 0.09 * 100) / 100;
  const sgstAmount = Math.round(taxableValue * 0.09 * 100) / 100;
  const calculatedSum = taxableValue + cgstAmount + sgstAmount;
  const roundOff = Math.round((finalTotalAmount - calculatedSum) * 100) / 100;
  const totalTaxAmount = Math.round((cgstAmount + sgstAmount) * 100) / 100;

  const amountInWords = numberToIndianWords(finalTotalAmount);

  // Bank Info from settings with fallback
  const bankName = settings.bankDetails?.bankName || 'HDFC BANK';
  const accountNumber = settings.bankDetails?.accountNumber || '50200083215914';
  const ifscCode = settings.bankDetails?.ifsc || 'HDFC0000965';

  const docNumber = isQuotation
    ? entry.invoiceNo.startsWith('QT-')
      ? entry.invoiceNo
      : `QT-${entry.invoiceNo.replace(/^INV-/, '')}`
    : entry.invoiceNo;

  return (
    <div className="gst-invoice-sheet bg-white text-black text-[12px] leading-tight font-sans border-2 border-slate-900 w-full max-w-4xl mx-auto shadow-sm select-text">
      {/* 1. Top Header Banner */}
      <div className="bg-[#102A45] text-white text-center py-2 px-4 border-b-2 border-slate-900">
        <h1 className="text-xl sm:text-2xl font-bold tracking-wider font-serif uppercase">
          {isQuotation ? 'Quotation' : 'Tax Invoice'}
        </h1>
      </div>

      {/* 2. Seller and Dispatch Grid (Two Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-2 border-b border-slate-900 divide-y md:divide-y-0 md:divide-x divide-slate-900">
        {/* Left Column: Seller & Buyer Details */}
        <div className="flex flex-col justify-between">
          {/* Seller Details */}
          <div className="p-3 border-b border-slate-900">
            <h2 className="text-base font-extrabold text-slate-950 uppercase tracking-wide">
              {settings.businessName || 'SHRI SAI ENTERPRISES'}
            </h2>
            <p className="text-[11px] text-slate-800 mt-0.5">
              Opposite Matoshree Sabhagruh,arvi road
            </p>
            <p className="text-[11px] text-slate-800">
              Wardha, Maharashtra - 442001
            </p>
            <p className="text-[11.5px] font-bold text-slate-950 mt-1">
              GSTIN/UIN : {settings.gstin || '27ALOPL0030G2ZC'}
            </p>
            <p className="text-[11px] text-slate-800">
              State Name : Maharashtra, Code : 27
            </p>
            <p className="text-[11px] text-slate-800">
              Mobile : {settings.phone || '8766486915/8600122978'}
            </p>
            <p className="text-[11px] text-slate-800">
              Email : {settings.email || 'shreesaienterprisess994@gmail.com'}
            </p>
          </div>

          {/* Buyer (Bill to) */}
          <div className="p-3 bg-slate-50/50">
            <div className="font-bold text-[11px] uppercase text-slate-900 mb-1 border-b border-dotted border-slate-300 pb-0.5">
              Buyer (Bill to)
            </div>
            <p className="font-bold text-slate-950 text-sm">{entry.customerName}</p>
            <p className="text-[11px] text-slate-800 mt-0.5">
              {entry.buyerAddress ||
                (entry.village
                  ? `${entry.village}, Wardha 442001`
                  : 'Nagthana Road Hanuman Mandir Wardha 442001')}
            </p>
            <p className="text-[11px] text-slate-800 mt-0.5">
              GSTIN/UIN: <span className="font-mono">{entry.hsnCode || '—'}</span>
            </p>
            <p className="text-[11px] text-slate-800">
              State Name : Maharashtra, Code : 27
            </p>
            <p className="text-[11px] text-slate-800 font-mono">
              Mobile No: {entry.customerPhone || '—'}
            </p>
          </div>
        </div>

        {/* Right Column: Invoice & Dispatch Meta Grid */}
        <div className="divide-y divide-slate-900 text-[11px]">
          {/* Row 1: Invoice No & Date */}
          <div className="grid grid-cols-2 divide-x divide-slate-900">
            <div className="p-2">
              <span className="block text-[10px] text-slate-600 font-semibold">
                {isQuotation ? 'Quotation / Ref No.' : 'Invoice / Bill No.'}
              </span>
              <span className="font-bold text-slate-950 font-mono text-[12px]">{docNumber}</span>
            </div>
            <div className="p-2">
              <span className="block text-[10px] text-slate-600 font-semibold">Dated</span>
              <span className="font-bold text-slate-950 font-mono text-[12px]">{entry.date}</span>
            </div>
          </div>

          {/* Row 2: Delivery Note & Payment Mode */}
          <div className="grid grid-cols-2 divide-x divide-slate-900">
            <div className="p-2">
              <span className="block text-[10px] text-slate-600 font-semibold">Delivery Note</span>
              <span className="text-slate-900">{dispatchDetails.deliveryNote || '—'}</span>
            </div>
            <div className="p-2">
              <span className="block text-[10px] text-slate-600 font-semibold">
                Mode/Terms of Payment
              </span>
              <span className="font-bold text-slate-950">{entry.paymentMode || 'Cash / Online'}</span>
            </div>
          </div>

          {/* Row 3: Supplier's Ref & Other Ref */}
          <div className="grid grid-cols-2 divide-x divide-slate-900">
            <div className="p-2">
              <span className="block text-[10px] text-slate-600 font-semibold">Supplier's Ref.</span>
              <span className="text-slate-900">{dispatchDetails.suppliersRef || '—'}</span>
            </div>
            <div className="p-2">
              <span className="block text-[10px] text-slate-600 font-semibold">Other Reference(s)</span>
              <span className="text-slate-900">{dispatchDetails.otherRef || '—'}</span>
            </div>
          </div>

          {/* Row 4: Buyer's Order No & Dated */}
          <div className="grid grid-cols-2 divide-x divide-slate-900">
            <div className="p-2">
              <span className="block text-[10px] text-slate-600 font-semibold">Buyer's Order No.</span>
              <span className="text-slate-900">{dispatchDetails.buyersOrderNo || '—'}</span>
            </div>
            <div className="p-2">
              <span className="block text-[10px] text-slate-600 font-semibold">Dated</span>
              <span className="text-slate-900">{dispatchDetails.buyersOrderDate || '—'}</span>
            </div>
          </div>

          {/* Row 5: Despatch Doc No & Delivery Note Date */}
          <div className="grid grid-cols-2 divide-x divide-slate-900">
            <div className="p-2">
              <span className="block text-[10px] text-slate-600 font-semibold">Despatch Document No.</span>
              <span className="text-slate-900">{dispatchDetails.despatchDocNo || '—'}</span>
            </div>
            <div className="p-2">
              <span className="block text-[10px] text-slate-600 font-semibold">Delivery Note Date</span>
              <span className="text-slate-900">{dispatchDetails.deliveryNoteDate || '—'}</span>
            </div>
          </div>

          {/* Row 6: Despatched through & Destination */}
          <div className="grid grid-cols-2 divide-x divide-slate-900">
            <div className="p-2">
              <span className="block text-[10px] text-slate-600 font-semibold">Despatched through</span>
              <span className="text-slate-900">{dispatchDetails.despatchedThrough || 'Direct Delivery / Handover'}</span>
            </div>
            <div className="p-2">
              <span className="block text-[10px] text-slate-600 font-semibold">Destination</span>
              <span className="text-slate-900">{dispatchDetails.destination || (entry.village ? `${entry.village}, Wardha` : 'Wardha')}</span>
            </div>
          </div>

          {/* Row 7: Terms of Delivery */}
          <div className="p-2">
            <span className="block text-[10px] text-slate-600 font-semibold">Terms of Delivery:</span>
            <span className="text-[10.5px] font-medium text-slate-950">
              {dispatchDetails.termsOfDelivery || 'Goods once sold will not be taken back.'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Item Table with Deep Navy Header */}
      <div className="border-b border-slate-900 overflow-x-auto">
        <table className="w-full border-collapse text-[11px] text-slate-900">
          <thead>
            <tr className="bg-[#102A45] text-white divide-x divide-slate-800 text-center font-bold">
              <th className="py-1.5 px-2 w-10">Sr.</th>
              <th className="py-1.5 px-3 text-left">Description of Goods</th>
              <th className="py-1.5 px-2 w-20">HSN/SAC</th>
              <th className="py-1.5 px-2 w-16 text-right">Qty</th>
              <th className="py-1.5 px-2 w-24 text-right">Rate</th>
              <th className="py-1.5 px-2 w-12">per</th>
              <th className="py-1.5 px-3 w-28 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300">
            {lineItems.map((item, index) => {
              const itemAmt = Number(item.amount) || Number(item.qty) * Number(item.rate) || 0;
              return (
                <tr key={item.id || index} className="divide-x divide-slate-300 hover:bg-slate-50">
                  <td className="py-1.5 px-2 text-center font-mono text-slate-700">{index + 1}</td>
                  <td className="py-1.5 px-3 font-semibold text-slate-950">
                    <div>{item.description}</div>
                    {(item.modelNo || item.serialNo || ((modelNo || serialNo) && index === 0)) && (
                      <div className="text-[10px] text-slate-600 font-mono mt-0.5">
                        {(item.modelNo || (index === 0 ? modelNo : '')) && (
                          <span className="mr-2">Model: {item.modelNo || modelNo}</span>
                        )}
                        {(item.serialNo || (index === 0 ? serialNo : '')) && (
                          <span>| Serial: {item.serialNo || serialNo}</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="py-1.5 px-2 text-center font-mono text-slate-700">{item.hsn || '0'}</td>
                  <td className="py-1.5 px-2 text-right font-mono font-bold text-slate-950">
                    {Number(item.qty).toFixed(2)}
                  </td>
                  <td className="py-1.5 px-2 text-right font-mono text-slate-900">
                    {Number(item.rate).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-1.5 px-2 text-center text-slate-700">{item.per || 'nos'}</td>
                  <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-950">
                    {itemAmt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              );
            })}

            {/* Empty filler rows if items are fewer than 4 to give standard A4 stature */}
            {lineItems.length < 3 && (
              <tr className="divide-x divide-slate-200 text-transparent">
                <td className="py-3">&nbsp;</td>
                <td className="py-3">&nbsp;</td>
                <td className="py-3">&nbsp;</td>
                <td className="py-3">&nbsp;</td>
                <td className="py-3">&nbsp;</td>
                <td className="py-3">&nbsp;</td>
                <td className="py-3">&nbsp;</td>
              </tr>
            )}

            {/* CGST Rate row */}
            <tr className="divide-x divide-slate-300 bg-slate-50/70 border-t border-slate-400">
              <td></td>
              <td className="py-1 px-3 text-right font-bold text-slate-800">CGST Rate (%)</td>
              <td className="text-center font-mono text-slate-600"></td>
              <td></td>
              <td></td>
              <td className="py-1 px-2 text-center font-mono text-slate-800">9.00%</td>
              <td className="py-1 px-3 text-right font-mono font-semibold text-slate-900">
                {cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>

            {/* SGST Rate row */}
            <tr className="divide-x divide-slate-300 bg-slate-50/70">
              <td></td>
              <td className="py-1 px-3 text-right font-bold text-slate-800">SGST Rate (%)</td>
              <td className="text-center font-mono text-slate-600"></td>
              <td></td>
              <td></td>
              <td className="py-1 px-2 text-center font-mono text-slate-800">9.00%</td>
              <td className="py-1 px-3 text-right font-mono font-semibold text-slate-900">
                {sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>

            {/* Round off row */}
            <tr className="divide-x divide-slate-300 bg-slate-50/70">
              <td></td>
              <td className="py-1 px-3 text-right font-bold text-slate-800">Round Off</td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td className="py-1 px-3 text-right font-mono text-slate-900">
                {roundOff > 0 ? `+${roundOff.toFixed(2)}` : roundOff.toFixed(2)}
              </td>
            </tr>

            {/* Total Amount Row */}
            <tr className="divide-x divide-slate-900 bg-slate-100 font-bold border-t-2 border-slate-900 text-slate-950">
              <td colSpan={2} className="py-2 px-3 text-right font-bold">
                Total Amount
              </td>
              <td></td>
              <td className="py-2 px-2 text-right font-mono font-extrabold text-[12px]">
                {totalQty.toFixed(2)}
              </td>
              <td colSpan={2}></td>
              <td className="py-2 px-3 text-right font-mono font-extrabold text-[13px] text-slate-950">
                ₹{finalTotalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 4. Amount Chargeable in words */}
      <div className="p-2.5 border-b border-slate-900 flex flex-wrap items-center justify-between gap-2 bg-slate-50/30 text-[11px]">
        <div>
          <span className="text-[10px] text-slate-600 uppercase font-semibold block">
            Amount Chargeable (in words):
          </span>
          <span className="font-bold text-slate-950">{amountInWords}</span>
        </div>
        <span className="font-bold text-slate-600 text-xs">E & OE</span>
      </div>

      {/* 5. GST Tax Summary Analysis Table */}
      <div className="border-b border-slate-900">
        <table className="w-full border-collapse text-[10.5px]">
          <thead>
            <tr className="bg-slate-200 text-slate-900 border-b border-slate-900 text-center font-bold">
              <th rowSpan={2} className="py-1 px-2 border-r border-slate-900 w-16">
                SN/SA
              </th>
              <th rowSpan={2} className="py-1 px-2 border-r border-slate-900 text-right">
                Taxable Value
              </th>
              <th colSpan={2} className="py-1 px-2 border-r border-slate-900">
                Central Tax
              </th>
              <th colSpan={2} className="py-1 px-2 border-r border-slate-900">
                State Tax
              </th>
              <th rowSpan={2} className="py-1 px-2 text-right">
                Total Tax Amount
              </th>
            </tr>
            <tr className="bg-slate-200 text-slate-900 border-b border-slate-900 text-center font-bold">
              <th className="py-0.5 px-2 border-r border-slate-900 w-14">Rate</th>
              <th className="py-0.5 px-2 border-r border-slate-900 text-right">Amount</th>
              <th className="py-0.5 px-2 border-r border-slate-900 w-14">Rate</th>
              <th className="py-0.5 px-2 border-r border-slate-900 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300 font-mono text-[10.5px]">
            <tr className="divide-x divide-slate-900">
              <td className="py-1 px-2 text-center">8415</td>
              <td className="py-1 px-2 text-right">
                {taxableValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td className="py-1 px-2 text-center">9.00%</td>
              <td className="py-1 px-2 text-right">
                {cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td className="py-1 px-2 text-center">9.00%</td>
              <td className="py-1 px-2 text-right">
                {sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td className="py-1 px-2 text-right font-bold text-slate-950">
                {totalTaxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>
            <tr className="divide-x divide-slate-900 bg-slate-100 font-bold border-t border-slate-900">
              <td className="py-1 px-2 text-center">Total</td>
              <td className="py-1 px-2 text-right">
                {taxableValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td className="py-1 px-2 text-center"></td>
              <td className="py-1 px-2 text-right">
                {cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td className="py-1 px-2 text-center"></td>
              <td className="py-1 px-2 text-right">
                {sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td className="py-1 px-2 text-right font-bold text-slate-950">
                {totalTaxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 6. Bank Details, Declaration & Signatory */}
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-900">
        {/* Left: Bank & Declaration */}
        <div className="p-3 text-[11px] space-y-2">
          <div className="space-y-0.5">
            <p className="font-bold text-slate-950">Our Bank : {bankName}</p>
            <p className="text-slate-900">
              Account Number : <span className="font-mono font-bold text-slate-950">{accountNumber}</span>
            </p>
            <p className="text-slate-900">
              IFSC Code : <span className="font-mono font-bold text-slate-950">{ifscCode}</span>
            </p>
          </div>

          <div className="pt-1.5 border-t border-slate-300">
            <span className="font-bold text-slate-950 block mb-0.5 text-[10px] uppercase">
              Declaration:
            </span>
            <p className="text-[10px] text-slate-700 leading-normal">
              We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
            </p>
            {isQuotation && validityDays && (
              <p className="text-[10.5px] font-bold text-amber-900 mt-1">
                Quotation Validity: {validityDays}
              </p>
            )}
          </div>
        </div>

        {/* Right: Signature Box */}
        <div className="p-3 flex flex-col justify-between text-right">
          <p className="font-bold text-slate-950 text-[11px] uppercase">
            For {settings.businessName || 'SHRI SAI ENTERPRISES'}
          </p>
          <div className="pt-10">
            <div className="border-t border-slate-400 w-44 ml-auto mb-1"></div>
            <p className="font-bold text-slate-950 text-[11px]">Authorised Signatory</p>
          </div>
        </div>
      </div>

      {/* 7. Footer Note */}
      <div className="bg-slate-100 text-slate-600 text-center py-1 text-[10px] border-t border-slate-900 font-mono">
        This is a Computer Generated {isQuotation ? 'Quotation' : 'Tax Invoice'}
      </div>
    </div>
  );
};
