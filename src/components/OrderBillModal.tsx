import React, { useState } from 'react';
import {
  Printer,
  Share2,
  MessageCircle,
  X,
  CheckCircle2,
  Phone,
  Truck,
  Building2,
  Copy,
  Check,
  Download
} from 'lucide-react';
import { BusinessSettings } from '../types';
import { AppLogo } from './AppLogo';

export interface OrderBillData {
  invoiceNo: string;
  date: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  deliveryType: 'local' | 'outer';
  items: {
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  subtotal: number;
  deliveryFee: number;
  grandTotal: number;
  notes?: string;
}

interface OrderBillModalProps {
  order: OrderBillData | null;
  settings: BusinessSettings;
  onClose: () => void;
}

export const OrderBillModal: React.FC<OrderBillModalProps> = ({
  order,
  settings,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!order) return null;

  const getBillFormattedText = () => {
    const itemsList = order.items
      .map(
        (it, idx) =>
          `${idx + 1}. *${it.name}* x ${it.quantity} = ₹${(Number(it.total) || 0).toLocaleString()}`
      )
      .join('\n');

    return (
      `*श्री साई इंटरप्राइजेस - अधिकृत ऑनलाइन ऑर्डर बिल*\n` +
      `--------------------------------\n` +
      `*बिल क्र (Invoice No):* ${order.invoiceNo}\n` +
      `*दिनांक (Date):* ${order.date}\n` +
      `*ग्राहक नाव (Customer):* ${order.customerName}\n` +
      `*मोबाइल क्र (Mobile):* ${order.customerPhone || 'N/A'}\n` +
      `*डिलिव्हरी पत्ता (Address):* ${order.customerAddress || 'Wardha'}\n` +
      `*डिलिव्हरी प्रकार:* ${order.deliveryType === 'local' ? 'वर्धा शहर (Local Town)' : 'परिसरातील खेडी/गावे (Outer Village)'}\n` +
      `--------------------------------\n` +
      `*खरेदी केलेल्या वस्तू (Items):*\n${itemsList}\n` +
      `--------------------------------\n` +
      `*एकूण वस्तू मूल्य (Subtotal):* ₹${(Number(order.subtotal) || 0).toLocaleString()}\n` +
      `*डिलिव्हरी शुल्क (Delivery Charge):* ${order.deliveryFee === 0 ? 'मोफत (FREE)' : `₹${order.deliveryFee}`}\n` +
      `*एकूण देय रक्कम (Grand Total):* ₹${(Number(order.grandTotal) || 0).toLocaleString()}\n` +
      `*पेमेंट प्रकार:* कॅश ऑन डिलिव्हरी (COD) / UPI\n` +
      (order.notes ? `*टीप:* ${order.notes}\n` : '') +
      `--------------------------------\n` +
      `*दुकान:* श्री साई इंटरप्राइजेस\n` +
      `पत्ता: मातोश्री सभागृह समोर, आर्वी रोड, पंजाब कॉलनी, वर्धा - 442001\n` +
      `GSTIN: 27ALOPL0030G2ZC\n` +
      `*अधिकृत WhatsApp:* 8766486915 / 8600122798\n` +
      `धन्यवाद! आपले ऑर्डर सुरक्षितपणे नोंदवले गेले आहे.`
    );
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyBill = () => {
    navigator.clipboard.writeText(getBillFormattedText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const cleanCustomerPhone = order.customerPhone.replace(/\D/g, '').slice(-10);

  const forwardToCustomerWhatsApp = () => {
    const text = encodeURIComponent(getBillFormattedText());
    if (cleanCustomerPhone) {
      window.open(`https://wa.me/91${cleanCustomerPhone}?text=${text}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${text}`, '_blank');
    }
  };

  const forwardToShopWhatsApp1 = () => {
    const text = encodeURIComponent(getBillFormattedText());
    window.open(`https://wa.me/918766486915?text=${text}`, '_blank');
  };

  const forwardToShopWhatsApp2 = () => {
    const text = encodeURIComponent(getBillFormattedText());
    window.open(`https://wa.me/918600122798?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-fade-in my-auto">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="no-print bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-bold text-emerald-400">ऑर्डर नोंदवली गेली! (Order Confirmed)</span>
            <span className="text-slate-500">•</span>
            <span className="font-mono text-slate-300">{order.invoiceNo}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Buttons Toolbar for WhatsApp Forwarding & Printing */}
        <div className="no-print bg-slate-100 p-3.5 border-b border-slate-200 space-y-2">
          <p className="text-[11px] text-slate-600 font-medium">
            हे बिल थेट प्रिंट करा किंवा WhatsApp वर ग्राहकाला व दुकानाला त्वरित फॉरवर्ड करा:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={handlePrint}
              className="py-2 px-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              प्रिंट बिल
            </button>

            <button
              onClick={forwardToCustomerWhatsApp}
              title={cleanCustomerPhone ? `ग्राहक WhatsApp: ${cleanCustomerPhone}` : 'WhatsApp वर शेअर करा'}
              className="py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              ग्राहक WhatsApp
            </button>

            <button
              onClick={forwardToShopWhatsApp1}
              className="py-2 px-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              दुकान WA 1
            </button>

            <button
              onClick={forwardToShopWhatsApp2}
              className="py-2 px-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              दुकान WA 2
            </button>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-slate-500 font-mono">
              मुख्य WhatsApp: 8766486915 / 8600122798
            </span>
            <button
              onClick={handleCopyBill}
              className="text-[11px] text-blue-700 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'कॉपी झाले!' : 'बिल मजकूर कॉपी करा'}
            </button>
          </div>
        </div>

        {/* Official Printable Bill Sheet (Formatted matching store authentic bill book) */}
        <div id="printable-order-bill" className="p-6 space-y-4 text-slate-800 bg-white">
          {/* Header */}
          <div className="text-center border-b-2 border-slate-900 pb-3">
            <div className="flex justify-center mb-1.5">
              <AppLogo size="sm" variant="iconOnly" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 font-serif tracking-wide">
              श्री साई इंटरप्राइजेस
            </h2>
            <p className="text-xs font-bold text-slate-700">
              Shri Sai Enterprises • Electronics, Home Appliances & Electricals
            </p>
            <p className="text-[11px] text-slate-600 mt-0.5">
              पत्ता: मातोश्री सभागृह समोर आर्वी रोड पंजाब कॉलनी वर्धा ,442001
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono text-slate-800 mt-1 font-bold">
              <span>GST IN: 27ALOPL0030G2ZC</span>
              <span>•</span>
              <span className="text-emerald-700">WhatsApp: 8766486915, 8600122798</span>
              <span>•</span>
              <span>Ph: 9175534365, 7822859073</span>
            </div>
          </div>

          {/* Invoice Meta and Customer Information */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">
                बिल व दिनांक (Invoice Info):
              </span>
              <p className="font-bold text-slate-900 font-mono text-sm">
                बिल क्र: {order.invoiceNo}
              </p>
              <p className="text-slate-600 font-mono text-[11px]">
                दिनांक: {order.date}
              </p>
              <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                <Truck className="w-3 h-3" />
                {order.deliveryType === 'local' ? 'वर्धा शहर डिलिव्हरी' : 'परिसरातील खेडी डिलिव्हरी'}
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">
                ग्राहक माहिती (Billed To):
              </span>
              <p className="font-bold text-slate-900 text-sm">
                {order.customerName}
              </p>
              <p className="text-slate-600 font-mono text-[11px]">
                मोबाइल: {order.customerPhone || 'N/A'}
              </p>
              <p className="text-slate-600 text-[11px] line-clamp-2">
                पत्ता: {order.customerAddress || 'वर्धा / Wardha'}
              </p>
            </div>
          </div>

          {/* Ordered Line Items Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3">अ.क्र</th>
                  <th className="py-2 px-3">वस्तूचे नाव (Item Details)</th>
                  <th className="py-2 px-3 text-center">संख्या (Qty)</th>
                  <th className="py-2 px-3 text-right">दर (Price)</th>
                  <th className="py-2 px-3 text-right">एकूण रक्कम (Total)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {order.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-2 px-3 text-slate-400">{idx + 1}</td>
                    <td className="py-2 px-3 font-semibold text-slate-900 font-sans">
                      {item.name}
                    </td>
                    <td className="py-2 px-3 text-center font-bold text-slate-800">
                      {item.quantity}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-600">
                      ₹{(Number(item.unitPrice) || 0).toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-slate-900">
                      ₹{(Number(item.total) || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Calculation Breakdown */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-1">
            {/* Payment Mode and Bank Info */}
            <div className="w-full sm:w-1/2 space-y-2 text-xs">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5">
                <span className="font-bold text-emerald-900 text-xs block">
                  पेमेंट पद्धत: कॅश ऑन डिलिव्हरी (COD) / UPI
                </span>
                <p className="text-[10px] text-emerald-700 mt-0.5">
                  वस्तू घरात पोहोचल्यावर रोख किंवा फोनपे/गुगलपे द्वारे भरा.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-[10px] font-mono space-y-0.5">
                <span className="font-bold text-slate-700 block font-sans">
                  दुकान बँक खाते (HDFC Bank):
                </span>
                <p>A/C: <strong className="text-slate-900">50200083215914</strong></p>
                <p>IFSC: <strong className="text-slate-900">HDFC0000965</strong></p>
                <p>शाखा: OPP.BANK OF MAHARASHTRA WARDHA 442001</p>
              </div>
            </div>

            {/* Total summary */}
            <div className="w-full sm:w-1/2 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-2 font-mono">
              <div className="flex justify-between text-slate-600">
                <span>उप-एकूण (Subtotal):</span>
                <span className="font-bold text-slate-900">₹{(Number(order.subtotal) || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>होम डिलिव्हरी शुल्क:</span>
                <span className="font-bold text-emerald-700">
                  {order.deliveryFee === 0 ? 'मोफत (FREE)' : `₹${order.deliveryFee}`}
                </span>
              </div>
              <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                <span>एकूण देय रक्कम:</span>
                <span className="text-base text-blue-700">₹{(Number(order.grandTotal) || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Warranty Terms and Signatory Footer */}
          <div className="text-[9.5px] text-slate-500 border-t border-slate-200 pt-2.5 leading-relaxed">
            <strong>नियम व अटी:</strong> दिलेली वॉरंटी ही दुकानदाराची नसून अधिकृत कंपनीची आहे. बिघाड आल्यास कंपनी सर्व्हिस देईल. वस्तू घेतेवेळी पावती व वॉरंटी कार्ड तपासून घ्यावे.
          </div>

          <div className="pt-2 flex items-end justify-between text-xs text-slate-500 border-t border-slate-100">
            <div>
              <p className="text-[10px] text-slate-400 font-mono">
                श्री साई इंटरप्राइजेस • वर्धा • ShriSaiEnt.in
              </p>
            </div>
            <div className="text-center">
              <div className="h-6 w-28 border-b border-dashed border-slate-400 mx-auto"></div>
              <p className="text-[10px] font-bold text-slate-800 mt-1">अधिकृत स्वाक्षरी / शिक्का</p>
              <p className="text-[9px] text-slate-400">श्री साई इंटरप्राइजेस</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
