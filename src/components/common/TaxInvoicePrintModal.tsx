import React, { useState } from 'react';
import {
  Printer,
  X,
  MessageCircle,
  FileText,
  FileCheck2,
  Receipt
} from 'lucide-react';
import { StoreSettings, Transaction } from '../../types';

interface TaxInvoicePrintModalProps {
  transaction: Transaction | null;
  settings: StoreSettings;
  onClose: () => void;
}

type PrintFormat = 'a4' | 'thermal80' | 'thermal58';
type BillType = 'tax' | 'estimate';

export const TaxInvoicePrintModal: React.FC<TaxInvoicePrintModalProps> = ({
  transaction,
  settings,
  onClose,
}) => {
  const [printFormat, setPrintFormat] = useState<PrintFormat>('a4');
  const [billType, setBillType] = useState<BillType>('tax');

  const handlePrint = () => {
    if (!transaction) return;
    window.print();
  };

  const handleSendWhatsApp = () => {
    if (!transaction) return;
    let msg = `*${settings.storeName} - ${billType === 'tax' ? 'टॅक्स बिल (Tax Invoice)' : 'अंदाज पत्रक (Estimate Bill)'}*\n`;
    msg += `मातोश्री सभागृह समोर, आर्वी रोड, पंजाब कॉलनी, वर्धा - 442001\n`;
    msg += `📞 संपर्क: 8600122978 / 9175537365 / 8766486915\n`;
    msg += `--------------------------------\n`;
    msg += `बिल क्र.: *${transaction.invoiceNo}*\n`;
    msg += `तारीख: ${new Date(transaction.date).toLocaleDateString('en-IN')}\n`;
    msg += `ग्राहक: *${transaction.customerName}* (${transaction.customerPhone})\n`;
    msg += `पत्ता: ${transaction.customerAddress || 'Wardha'}\n`;
    msg += `--------------------------------\n`;
    msg += `📦 *वस्तू तपशील (Items):*\n`;
    transaction.items.forEach((item, idx) => {
      msg += `${idx + 1}. *${item.name}* (नग: ${item.qty})\n`;
      if (item.serialNo) msg += `   S/N: ${item.serialNo}\n`;
      msg += `   दर: ₹${item.rate.toLocaleString('en-IN')} = ₹${item.total.toLocaleString('en-IN')}\n`;
    });
    msg += `--------------------------------\n`;
    msg += `एकूण रक्कम: *₹${transaction.grandTotal.toLocaleString('en-IN')}*\n`;
    msg += `जमा रक्कम (${transaction.paymentMode}): *₹${transaction.paidAmount.toLocaleString('en-IN')}*\n`;
    if (transaction.balanceDue > 0) {
      msg += `🚨 *शिल्लक बाकी (Balance Due): ₹${transaction.balanceDue.toLocaleString('en-IN')}*\n`;
    } else {
      msg += `✅ *पूर्ण रक्कम जमा (Paid in Full)*\n`;
    }
    msg += `--------------------------------\n`;
    msg += `आमच्या शोरूमला भेट दिल्याबद्दल धन्यवाद! 🙏`;

    const encoded = encodeURIComponent(msg);
    const cleanPhone = transaction.customerPhone.replace(/[^0-9]/g, '');
    const url = cleanPhone.length >= 10
      ? `https://wa.me/91${cleanPhone.slice(-10)}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
  };

  if (!transaction) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">
        {/* Top Control Bar */}
        <div className="px-4 py-3 bg-slate-800/90 border-b border-slate-700 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-white font-bold">
            <Printer className="w-4 h-4 text-amber-400" />
            <span>{billType === 'tax' ? 'Tax Invoice' : 'Estimate Bill'} - {transaction.invoiceNo}</span>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Bill Type Toggle */}
            <div className="flex rounded-lg bg-slate-900 p-0.5 border border-slate-700">
              <button
                type="button"
                onClick={() => setBillType('tax')}
                className={`px-2 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
                  billType === 'tax' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                GST Tax Invoice
              </button>
              <button
                type="button"
                onClick={() => setBillType('estimate')}
                className={`px-2 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
                  billType === 'estimate' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Estimate / कच्चा बिल
              </button>
            </div>

            {/* Print Format Selector */}
            <div className="flex rounded-lg bg-slate-900 p-0.5 border border-slate-700">
              <button
                type="button"
                onClick={() => setPrintFormat('a4')}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition cursor-pointer ${
                  printFormat === 'a4' ? 'bg-teal-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                A4 / A5
              </button>
              <button
                type="button"
                onClick={() => setPrintFormat('thermal80')}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition cursor-pointer ${
                  printFormat === 'thermal80' ? 'bg-teal-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                3" (80mm)
              </button>
              <button
                type="button"
                onClick={() => setPrintFormat('thermal58')}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition cursor-pointer ${
                  printFormat === 'thermal58' ? 'bg-teal-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                2" (58mm)
              </button>
            </div>

            {/* WhatsApp Send Button */}
            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition cursor-pointer flex items-center gap-1 shadow-sm"
              title="WhatsApp वर थेट पाठवा"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Invoice Paper Area */}
        <div className="p-4 sm:p-6 overflow-y-auto bg-slate-950/70 flex justify-center">
          {/* Format: Standard A4 / A5 */}
          {printFormat === 'a4' && (
            <div
              id="printable-tax-invoice"
              className="w-full bg-white text-slate-900 p-6 sm:p-8 rounded-xl border border-slate-200 shadow-xl font-sans text-xs space-y-4"
            >
              {/* Header */}
              <div className="text-center border-b-2 border-slate-900 pb-3">
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest block">
                  {billType === 'tax' ? 'TAX INVOICE / CASH MEMO' : 'ESTIMATE / RETAIL QUOTATION (कच्चा बिल)'}
                </span>
                <h1 className="text-2xl font-black uppercase tracking-wider text-slate-950 font-serif">
                  {settings.storeName}
                </h1>
                <p className="text-[11px] font-semibold text-slate-700 mt-0.5">{settings.tagline}</p>
                <p className="text-[10px] text-slate-600 mt-0.5">
                  {settings.address}, {settings.city} - Ph: {settings.phone}
                </p>
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-700 mt-2 px-2 pt-1 border-t border-dashed border-slate-300">
                  <span>{billType === 'tax' ? `GSTIN: ${settings.gstin}` : 'RETAIL ESTIMATE MEMO'}</span>
                  <span>STATE: MAHARASHTRA (27)</span>
                </div>
              </div>

              {/* Bill Details & Customer Meta */}
              <div className="grid grid-cols-2 gap-3 text-[11px] bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-slate-500">Billed To (Customer):</p>
                  <p className="font-extrabold text-slate-950 text-xs">{transaction.customerName}</p>
                  <p className="text-slate-600">Mobile: {transaction.customerPhone}</p>
                  <p className="text-slate-600">Address: {transaction.customerAddress || 'Wardha'}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[10px] uppercase font-bold text-slate-500">Invoice Info:</p>
                  <p className="font-extrabold text-amber-700 text-xs">{transaction.invoiceNo}</p>
                  <p className="text-slate-600">
                    Date:{' '}
                    {new Date(transaction.date).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="text-slate-600">Payment Mode: {transaction.paymentMode}</p>
                  {transaction.financeDetails?.isFinance && (
                    <div className="mt-1 p-1 bg-sky-50 rounded border border-sky-200 text-[10px] text-sky-900 font-semibold text-right">
                      <div>🏦 {transaction.financeDetails.provider}</div>
                      <div>DO/File: {transaction.financeDetails.fileNo || 'N/A'} • Loan: ₹{transaction.financeDetails.loanAmount?.toLocaleString('en-IN')}</div>
                      {transaction.financeDetails.downPayment !== undefined && transaction.financeDetails.downPayment > 0 && (
                        <div>Down Payment: ₹{transaction.financeDetails.downPayment?.toLocaleString('en-IN')}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-300 bg-slate-100 text-[10px] uppercase font-bold text-slate-700">
                    <th className="py-2 px-2">#</th>
                    <th className="py-2 px-2">Description of Goods</th>
                    <th className="py-2 px-2 text-center">Qty</th>
                    <th className="py-2 px-2 text-right">Rate (₹)</th>
                    <th className="py-2 px-2 text-right">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {transaction.items.map((item, index) => (
                    <tr key={item.stockId + index}>
                      <td className="py-2 px-2 font-semibold text-slate-500">{index + 1}</td>
                      <td className="py-2 px-2 font-medium text-slate-900">
                        <div>{item.name}</div>
                        {item.serialNo && (
                          <div className="text-[9px] text-slate-500 font-mono">
                            S/N: {item.serialNo}
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-2 text-center font-bold">{item.qty}</td>
                      <td className="py-2 px-2 text-right font-mono">₹{item.rate.toLocaleString('en-IN')}</td>
                      <td className="py-2 px-2 text-right font-bold font-mono">
                        ₹{item.total.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals Calculation */}
              <div className="border-t-2 border-slate-300 pt-3 flex justify-between text-xs">
                <div className="space-y-1 text-[10px] text-slate-600 max-w-[280px]">
                  <p className="font-bold text-slate-800">Bank Transfer & UPI QR:</p>
                  <p>Bank: {settings.bankDetails.bankName}</p>
                  <p>A/C: {settings.bankDetails.accountNumber} | IFSC: {settings.bankDetails.ifscCode}</p>
                  <p>UPI ID: <span className="font-mono font-bold text-slate-900">{settings.bankDetails.upiId}</span></p>
                </div>

                <div className="w-60 space-y-1 text-[11px]">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-mono">₹{transaction.subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  {transaction.discountTotal > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>Showroom Discount:</span>
                      <span className="font-mono">-₹{transaction.discountTotal.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {billType === 'tax' && (
                    <div className="flex justify-between text-slate-600">
                      <span>GST (Included/Tax):</span>
                      <span className="font-mono">₹{transaction.taxTotal.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-black text-sm text-slate-950 border-t-2 border-slate-900 pt-1">
                    <span>Grand Total:</span>
                    <span className="font-mono">₹{transaction.grandTotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-bold text-[11px]">
                    <span>Paid ({transaction.paymentMode}):</span>
                    <span className="font-mono">₹{transaction.paidAmount.toLocaleString('en-IN')}</span>
                  </div>
                  {transaction.balanceDue > 0 && (
                    <div className="flex justify-between text-rose-600 font-bold text-[11px]">
                      <span>Balance Dues (बाकी):</span>
                      <span className="font-mono">₹{transaction.balanceDue.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Signatory */}
              <div className="pt-4 border-t border-slate-200 flex justify-between items-end text-[10px] text-slate-500">
                <div>
                  <p>• Goods once sold will not be returned or exchanged.</p>
                  <p>• Manufacturer warranty card and bill required for service.</p>
                  <p>• Thank you for shopping with Shri Sai Enterprises!</p>
                </div>
                <div className="text-center">
                  <div className="w-36 border-b border-slate-400 mb-1"></div>
                  <span className="font-semibold text-slate-800 block">
                    For {settings.storeName}
                  </span>
                  <span className="text-[9px] text-slate-400 block">Authorized Signatory</span>
                </div>
              </div>
            </div>
          )}

          {/* Format: 3-Inch (80mm) Thermal Receipt */}
          {printFormat === 'thermal80' && (
            <div
              id="printable-tax-invoice"
              className="w-[300px] bg-white text-slate-900 p-4 rounded-lg border border-slate-200 shadow-xl font-mono text-[11px] space-y-2 leading-tight"
            >
              <div className="text-center border-b border-dashed border-slate-400 pb-2">
                <p className="font-bold text-sm tracking-wider uppercase">{settings.storeName}</p>
                <p className="text-[10px]">{settings.tagline}</p>
                <p className="text-[9px]">आर्वी रोड, पंजाब कॉलनी, वर्धा</p>
                <p className="text-[9px]">Ph: {settings.phone}</p>
                <p className="text-[9px] mt-1 font-bold">GSTIN: {settings.gstin}</p>
                <p className="text-[10px] uppercase font-bold mt-1">*** {billType === 'tax' ? 'TAX INVOICE' : 'ESTIMATE MEMO'} ***</p>
              </div>

              <div className="text-[10px] border-b border-dashed border-slate-400 pb-1.5 space-y-0.5">
                <div className="flex justify-between">
                  <span>Bill: {transaction.invoiceNo}</span>
                  <span>{new Date(transaction.date).toLocaleDateString('en-IN')}</span>
                </div>
                <p className="truncate">Cust: {transaction.customerName}</p>
                <p>Mob: {transaction.customerPhone}</p>
              </div>

              {/* Items */}
              <div className="border-b border-dashed border-slate-400 pb-2">
                <div className="flex justify-between font-bold text-[10px] border-b border-slate-300 pb-1 mb-1">
                  <span>Item</span>
                  <span>Qty × Rate</span>
                  <span>Total</span>
                </div>
                {transaction.items.map((item, idx) => (
                  <div key={idx} className="mb-1">
                    <div className="font-bold truncate">{item.name}</div>
                    {item.serialNo && <div className="text-[9px] text-slate-500">S/N: {item.serialNo}</div>}
                    <div className="flex justify-between text-[10px]">
                      <span>{item.qty} × ₹{item.rate}</span>
                      <span className="font-bold">₹{item.total}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-1 text-[11px] border-b border-dashed border-slate-400 pb-2">
                <div className="flex justify-between">
                  <span>Total:</span>
                  <span>₹{transaction.grandTotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Paid ({transaction.paymentMode}):</span>
                  <span>₹{transaction.paidAmount.toLocaleString('en-IN')}</span>
                </div>
                {transaction.financeDetails?.isFinance && (
                  <div className="p-1.5 my-1 bg-slate-100 rounded text-[10px] space-y-0.5 border border-slate-300">
                    <div className="font-bold text-slate-800">🏦 {transaction.financeDetails.provider}</div>
                    <div className="flex justify-between text-sky-800">
                      <span>Loan Amount:</span>
                      <span className="font-bold">₹{transaction.financeDetails.loanAmount?.toLocaleString('en-IN')}</span>
                    </div>
                    {transaction.financeDetails.fileNo && (
                      <div className="flex justify-between text-[9px] text-slate-600">
                        <span>DO / File:</span>
                        <span>{transaction.financeDetails.fileNo}</span>
                      </div>
                    )}
                    {transaction.financeDetails.monthlyEmi && (
                      <div className="flex justify-between text-[9px] text-indigo-700 font-semibold">
                        <span>Monthly EMI:</span>
                        <span>₹{transaction.financeDetails.monthlyEmi} × {transaction.financeDetails.emiMonths || 10} Mo.</span>
                      </div>
                    )}
                  </div>
                )}
                {transaction.balanceDue > 0 && !transaction.financeDetails?.isFinance && (
                  <div className="flex justify-between text-rose-600 font-bold">
                    <span>Balance Due:</span>
                    <span>₹{transaction.balanceDue.toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>

              <div className="text-center text-[9px] pt-1 text-slate-600 space-y-0.5">
                <p>Thank you for your visit!</p>
                <p>श्री साई इंटरप्रायजेस, वर्धा 🙏</p>
              </div>
            </div>
          )}

          {/* Format: 2-Inch (58mm) Mini Thermal Receipt */}
          {printFormat === 'thermal58' && (
            <div
              id="printable-tax-invoice"
              className="w-[220px] bg-white text-slate-900 p-3 rounded-lg border border-slate-200 shadow-xl font-mono text-[10px] space-y-1.5 leading-tight"
            >
              <div className="text-center border-b border-dashed border-slate-400 pb-1.5">
                <p className="font-bold text-xs uppercase">{settings.storeName}</p>
                <p className="text-[8px]">वर्धा - 8766486915</p>
                <p className="text-[9px] font-bold mt-0.5">*** {transaction.invoiceNo} ***</p>
                <p className="text-[8px]">{new Date(transaction.date).toLocaleDateString('en-IN')}</p>
              </div>

              <div className="text-[9px] border-b border-dashed border-slate-400 pb-1">
                <p className="truncate"><b>{transaction.customerName}</b></p>
                <p>{transaction.customerPhone}</p>
              </div>

              {/* Items */}
              <div className="border-b border-dashed border-slate-400 pb-1 space-y-1 text-[9px]">
                {transaction.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className="truncate max-w-[130px]">{item.name}</span>
                    <span className="font-bold">₹{item.total}</span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-0.5 text-[10px] font-bold border-b border-dashed border-slate-400 pb-1">
                <div className="flex justify-between">
                  <span>TOTAL:</span>
                  <span>₹{transaction.grandTotal}</span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>PAID:</span>
                  <span>₹{transaction.paidAmount}</span>
                </div>
                {transaction.financeDetails?.isFinance && (
                  <div className="text-[9px] text-sky-700 py-0.5 border-y border-dashed border-slate-300 my-0.5">
                    <div className="flex justify-between font-bold">
                      <span>LOAN ({transaction.financeDetails.provider?.split(' ')[0]}):</span>
                      <span>₹{transaction.financeDetails.loanAmount}</span>
                    </div>
                    {transaction.financeDetails.fileNo && (
                      <div className="flex justify-between text-[8px] text-slate-500">
                        <span>DO/FILE:</span>
                        <span>{transaction.financeDetails.fileNo}</span>
                      </div>
                    )}
                  </div>
                )}
                {transaction.balanceDue > 0 && !transaction.financeDetails?.isFinance && (
                  <div className="flex justify-between text-rose-600">
                    <span>DUE:</span>
                    <span>₹{transaction.balanceDue}</span>
                  </div>
                )}
              </div>

              <div className="text-center text-[8px] text-slate-600 pt-0.5">
                <p>धन्यवाद! पुन्हा भेट द्या 🙏</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
