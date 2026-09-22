import React, { useState } from 'react';
import { Printer, X, CheckCircle, Share2, Smartphone } from 'lucide-react';
import { BusinessSettings } from '../types';
import { DynamicUpiQrCode } from './DynamicUpiQrCode';

export interface ThermalReceiptData {
  type: 'card_installment' | 'sales_bill' | 'quick_pavti';
  receiptNo: string;
  date: string;
  customerName: string;
  customerPhone?: string;
  customerVillage?: string;
  cardNo?: number | string;
  schemeName?: string;
  installmentNo?: number;
  totalInstallments?: number;
  paidAmount: number;
  totalAmount?: number;
  dueAmount?: number;
  paymentMode: string;
  collectorName?: string;
  notes?: string;
  items?: Array<{ name: string; qty: number; rate: number; amount: number }>;
}

interface ThermalReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ThermalReceiptData;
  settings: BusinessSettings;
}

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({
  isOpen,
  onClose,
  data,
  settings,
}) => {
  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>('58mm');

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const cleanPhone = (data.customerPhone || '').replace(/[^0-9]/g, '');
    let msg = `*श्री साई एंटरप्रायझेस - पावती*\n`;
    msg += `पावती क्र.: ${data.receiptNo}\n`;
    msg += `दिनांक: ${data.date}\n`;
    msg += `ग्राहक: ${data.customerName}\n`;
    if (data.cardNo) msg += `कार्ड क्र.: #${data.cardNo}\n`;
    if (data.installmentNo) msg += `हप्ता क्र.: ${data.installmentNo}/${data.totalInstallments || 30}\n`;
    msg += `*जमा रक्कम: ₹${data.paidAmount.toLocaleString('en-IN')}*\n`;
    if (data.dueAmount !== undefined) msg += `शिल्लक बाकी: ₹${data.dueAmount.toLocaleString('en-IN')}\n`;
    msg += `पेमेंट मोड: ${data.paymentMode}\n`;
    if (data.collectorName) msg += `वसुली प्रतिनिधी: ${data.collectorName}\n`;
    msg += `\nधन्यवाद! - श्री साई एंटरप्रायझेस, आर्वी रोड, वर्धा. 📞 ${settings.phone || '8766486915'}`;

    const url = cleanPhone
      ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 print:hidden">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                थर्मल पावती प्रिंटर (POS Thermal Receipt)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                2-इंच (58mm) किंवा 3-इंच (80mm) ब्ल्यूटूथ / USB प्रिंटरसाठी
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Paper Size Selector & Action Toolbar */}
        <div className="p-4 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">कागद रुंदी:</span>
            <button
              type="button"
              onClick={() => setPaperWidth('58mm')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                paperWidth === '58mm'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600'
              }`}
            >
              2-इंच (58mm)
            </button>
            <button
              type="button"
              onClick={() => setPaperWidth('80mm')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                paperWidth === '80mm'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600'
              }`}
            >
              3-इंच (80mm)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition"
            >
              <Printer className="w-4 h-4" />
              <span>प्रिंट काढा (Print)</span>
            </button>
          </div>
        </div>

        {/* Thermal Slip Live Preview */}
        <div className="p-6 bg-slate-200 dark:bg-slate-950 flex justify-center overflow-x-auto print:p-0 print:bg-white">
          <div
            id="thermal-print-area"
            style={{ width: paperWidth === '58mm' ? '58mm' : '80mm' }}
            className="bg-white text-black p-2 font-mono text-[11px] leading-tight border border-slate-400 shadow-lg print:border-none print:shadow-none print:p-0"
          >
            {/* Store Header */}
            <div className="text-center pb-2 border-b border-dashed border-black">
              <div className="font-extrabold text-[14px] uppercase tracking-tighter">
                {settings.businessName || 'SHRI SAI ENTERPRISES'}
              </div>
              <div className="text-[10px] font-semibold mt-0.5">
                इलेक्ट्रॉनिक्स & फर्निचर दालन
              </div>
              <div className="text-[9px] mt-0.5 leading-snug">
                मातोश्री सभागृहासमोर, आर्वी रोड, पंजाब कॉलनी, वर्धा
              </div>
              <div className="text-[10px] font-bold mt-1">
                मो.: {settings.phone || '8766486915'} / {settings.whatsappSecondaryNumber || '8600122798'}
              </div>
              {settings.gstin && (
                <div className="text-[9px] font-bold mt-0.5">GST: {settings.gstin}</div>
              )}
            </div>

            {/* Receipt Title & Meta */}
            <div className="py-2 border-b border-dashed border-black">
              <div className="text-center font-bold text-[12px] uppercase">
                {data.type === 'card_installment'
                  ? '★ हप्ता पावती (SCHEME RECEIPT) ★'
                  : '★ रोख पावती (CASH MEMO) ★'}
              </div>
              <div className="flex justify-between mt-1 text-[10px]">
                <span>पावती: #{data.receiptNo}</span>
                <span>{data.date}</span>
              </div>
            </div>

            {/* Customer Details */}
            <div className="py-1.5 border-b border-dashed border-black text-[10px]">
              <div className="flex justify-between font-bold">
                <span>ग्राहक:</span>
                <span className="text-right truncate max-w-[140px]">{data.customerName}</span>
              </div>
              {data.customerVillage && (
                <div className="flex justify-between">
                  <span>गाव/पत्ता:</span>
                  <span>{data.customerVillage}</span>
                </div>
              )}
              {data.customerPhone && (
                <div className="flex justify-between">
                  <span>मोबाईल:</span>
                  <span>{data.customerPhone}</span>
                </div>
              )}
              {data.cardNo && (
                <div className="flex justify-between font-black text-[11px] mt-0.5 bg-slate-100 print:bg-transparent px-1">
                  <span>कार्ड क्रमांक:</span>
                  <span>#{data.cardNo}</span>
                </div>
              )}
            </div>

            {/* Transaction Particulars */}
            <div className="py-2 border-b border-dashed border-black">
              {data.type === 'card_installment' ? (
                <div>
                  <div className="flex justify-between text-[10px]">
                    <span>योजना:</span>
                    <span className="font-bold">{data.schemeName || '३०-महिने बचत योजना'}</span>
                  </div>
                  {data.installmentNo && (
                    <div className="flex justify-between text-[10px] mt-0.5">
                      <span>हप्ता क्रमांक:</span>
                      <span className="font-bold">
                        {data.installmentNo} / {data.totalInstallments || 30}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                data.items &&
                data.items.length > 0 && (
                  <div className="text-[10px]">
                    <div className="flex justify-between font-bold border-b border-dotted pb-0.5 mb-1">
                      <span>वस्तू</span>
                      <span>रक्कम</span>
                    </div>
                    {data.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-[9px] mb-0.5">
                        <span className="truncate max-w-[120px]">
                          {item.name} x{item.qty}
                        </span>
                        <span>₹{item.amount.toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                )
              )}

              {/* Amount Highlight */}
              <div className="mt-2 text-center py-1 bg-slate-100 print:bg-transparent border border-black rounded-xs">
                <div className="text-[9px] uppercase font-bold text-slate-700">एकूण जमा रक्कम</div>
                <div className="text-[16px] font-black tracking-tight">
                  ₹ {data.paidAmount.toLocaleString('en-IN')} /-
                </div>
              </div>

              {/* Remaining Balance & Mode */}
              <div className="mt-1.5 text-[10px] space-y-0.5">
                {data.dueAmount !== undefined && (
                  <div className="flex justify-between font-bold">
                    <span>शिल्लक बाकी:</span>
                    <span>₹ {data.dueAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>पेमेंट पद्धत:</span>
                  <span className="font-semibold">{data.paymentMode}</span>
                </div>
                {data.collectorName && (
                  <div className="flex justify-between text-[9px]">
                    <span>वसुली प्रतिनिधी:</span>
                    <span>{data.collectorName}</span>
                  </div>
                )}
                {data.notes && (
                  <div className="text-[9px] text-slate-600 mt-1 italic">
                    टीप: {data.notes}
                  </div>
                )}
              </div>
            </div>

            {/* Dynamic UPI QR Code for due balance */}
            {data.dueAmount && data.dueAmount > 0 ? (
              <div className="py-2 text-center border-b border-dashed border-black">
                <div className="text-[9px] font-bold mb-1">
                  शिल्लक ₹{data.dueAmount} ऑनलाईन भरण्यासाठी स्कॅन करा:
                </div>
                <div className="flex justify-center">
                  <DynamicUpiQrCode
                    upiId={settings.upiId || '8766486915@ybl'}
                    payeeName={settings.businessName || 'Shri Sai Enterprises'}
                    amount={data.dueAmount}
                    note={`Card #${data.cardNo || 'Bal'}`}
                    size={paperWidth === '58mm' ? 95 : 120}
                    showBadges={false}
                    showAmountPill={false}
                    className="p-1 border-none shadow-none"
                  />
                </div>
              </div>
            ) : null}

            {/* Footer Notice */}
            <div className="pt-2 text-center text-[9px] space-y-1">
              <div className="font-bold">★ संगणकीय पावती - सहीची गरज नाही ★</div>
              <div>धन्यवाद! पुन्हा भेट द्या!</div>
              <div className="text-[8px] text-slate-500">
                श्री साई एंटरप्रायझेस डिजिटल पावती सिस्टीम
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
