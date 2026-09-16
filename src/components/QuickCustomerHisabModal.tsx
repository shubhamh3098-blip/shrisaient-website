import React, { useState, useMemo } from 'react';
import {
  X,
  Calculator,
  Printer,
  Share2,
  Phone,
  CheckCircle2,
  Calendar,
  IndianRupee,
  Receipt,
  FileText,
  Clock,
  Send
} from 'lucide-react';
import { Customer, BusinessSettings, TransactionEntry } from '../types';
import { openStandardPrintWindow } from '../utils/printStandards';

interface QuickCustomerHisabModalProps {
  initialCustomer?: Customer | null;
  customers: Customer[];
  settings: BusinessSettings;
  onClose: () => void;
  onSaveQuickHisab?: (data: {
    customerId?: string;
    customerName: string;
    customerPhone: string;
    itemDetails: string;
    totalAmount: number;
    advancePaid: number;
    receiptPaid: number;
    balanceDue: number;
    notes?: string;
  }) => void;
}

export const QuickCustomerHisabModal: React.FC<QuickCustomerHisabModalProps> = ({
  initialCustomer,
  customers = [],
  settings,
  onClose,
  onSaveQuickHisab,
}) => {
  const [selectedCustId, setSelectedCustId] = useState<string>(initialCustomer?.id || '');
  const [name, setName] = useState<string>(initialCustomer?.name || '');
  const [phone, setPhone] = useState<string>(initialCustomer?.phone || '');
  const [itemPurchased, setItemPurchased] = useState<string>('दिवाण / फर्निचर (Diwan)');
  const [billAmount, setBillAmount] = useState<string>('7000');
  const [advancePaid, setAdvancePaid] = useState<string>('3000');
  const [receiptPaid, setReceiptPaid] = useState<string>('1500');
  const [notes, setNotes] = useState<string>('पावती जमा हिशोब');
  const [isSaved, setIsSaved] = useState<boolean>(false);

  // Auto-fill customer details if selected from dropdown
  const handleSelectCustomer = (cId: string) => {
    setSelectedCustId(cId);
    const found = customers.find((c) => c.id === cId);
    if (found) {
      setName(found.name);
      setPhone(found.phone || '');
      if (found.balanceDue && found.balanceDue > 0) {
        setBillAmount(String(found.balanceDue));
        setAdvancePaid('0');
        setReceiptPaid('0');
        setItemPurchased('मागील उधारी बाकी');
      }
    }
  };

  // Math Calculations (e.g., 7000 bill - 3000 advance - 1500 receipt = 2500 due)
  const numTotal = Math.max(0, parseFloat(billAmount) || 0);
  const numAdvance = Math.max(0, parseFloat(advancePaid) || 0);
  const numReceipt = Math.max(0, parseFloat(receiptPaid) || 0);
  const totalPaid = numAdvance + numReceipt;
  const balanceDue = Math.max(0, numTotal - totalPaid);

  const todayStr = useMemo(() => {
    return new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }, []);

  // WhatsApp Share with instant preformatted professional text
  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `*${settings.businessName}*\n` +
      `*ग्राहक हिशोब पावती (Account Hisab)*\n` +
      `--------------------------------\n` +
      `दिनांक (Date): ${todayStr}\n` +
      `ग्राहक नाव (Customer): *${name || 'Customer'}*\n` +
      (phone ? `मोबाईल: ${phone}\n` : '') +
      `वस्तू / खरेदी (Item): ${itemPurchased}\n` +
      `--------------------------------\n` +
      `एकूण खरेदी बिल (Total Bill): ₹${numTotal.toLocaleString()}\n` +
      `१. खरेदीवेळी दिलेले (Advance Paid): ₹${numAdvance.toLocaleString()}\n` +
      `२. नंतर आलेली पावती (Receipt Paid): ₹${numReceipt.toLocaleString()}\n` +
      `*एकूण जमा रक्कम (Total Received): ₹${totalPaid.toLocaleString()}*\n` +
      `--------------------------------\n` +
      `⚠️ *शिल्लक बाकी रक्कम (Balance Due): ₹${balanceDue.toLocaleString()}*\n` +
      `--------------------------------\n` +
      `दुकान पत्ता: ${settings.address || 'वर्धा'}\n` +
      `संपर्क / फोन: ${settings.phone || '8766486915'}\n` +
      `श्री साई इंटरप्राइजेस, वर्धा`
    );

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const url = cleanPhone ? `https://wa.me/91${cleanPhone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  // Standardized Clean Printable Output
  const handlePrint = () => {
    const innerHtml = `
      <div class="header-bar">
        <div>
          <h1 class="brand-title">${settings.businessName}</h1>
          <p class="brand-subtitle">${settings.address} | फोन: ${settings.phone} ${settings.gstin ? `| GSTIN: ${settings.gstin}` : ''}</p>
        </div>
        <div class="text-right">
          <div class="doc-type-badge">ग्राहक हिशोब पावती</div>
          <p style="font-size: 8.5pt; color: #64748b; margin-top: 4px;">दिनांक: <strong>${todayStr}</strong></p>
        </div>
      </div>

      <div class="info-grid">
        <div class="info-box">
          <strong>ग्राहक तपशील (Customer Info):</strong><br>
          नाव: <strong>${name || 'N/A'}</strong><br>
          मोबाईल: <strong>${phone || 'N/A'}</strong>
        </div>
        <div class="info-box">
          <strong>खरेदी तपशील (Purchase Info):</strong><br>
          वस्तू / काम: <strong>${itemPurchased || 'General Goods'}</strong><br>
          नोंद: ${notes || 'उधारी व पावती हिशोब'}
        </div>
      </div>

      <div class="kpi-row">
        <div class="kpi-card">
          <div class="kpi-title">एकूण बिल (Total Amount)</div>
          <div class="kpi-val">₹${numTotal.toLocaleString()}</div>
        </div>
        <div class="kpi-card paid">
          <div class="kpi-title">एकूण जमा (Total Paid)</div>
          <div class="kpi-val">₹${totalPaid.toLocaleString()}</div>
        </div>
        <div class="kpi-card due">
          <div class="kpi-title">शिल्लक बाकी (Balance Due)</div>
          <div class="kpi-val">₹${balanceDue.toLocaleString()}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 45px;">अ.क्र</th>
            <th>तपशील (Particulars / Details)</th>
            <th class="text-right" style="width: 140px;">नावे / खरेदी ₹ (Debit)</th>
            <th class="text-right" style="width: 140px;">जमा रक्कम ₹ (Credit)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="text-center font-mono">1</td>
            <td>
              <strong>${itemPurchased}</strong> (खरेदी बिल)
            </td>
            <td class="text-right font-bold font-mono">₹${numTotal.toLocaleString()}</td>
            <td class="text-right font-mono">-</td>
          </tr>
          <tr>
            <td class="text-center font-mono">2</td>
            <td>
              खरेदीवेळी दिलेले अ‍ॅडव्हान्स (Advance at purchase)
            </td>
            <td class="text-right font-mono">-</td>
            <td class="text-right font-bold font-mono tag-receipt">₹${numAdvance.toLocaleString()}</td>
          </tr>
          <tr>
            <td class="text-center font-mono">3</td>
            <td>
              उधारी जमा पावती (Receipt Paid Later)
            </td>
            <td class="text-right font-mono">-</td>
            <td class="text-right font-bold font-mono tag-receipt">₹${numReceipt.toLocaleString()}</td>
          </tr>
          <tr style="background-color: #f8fafc; font-weight: bold; border-top: 2px solid #cbd5e1;">
            <td colspan="2" class="text-right">एकूण बेरीज (Totals):</td>
            <td class="text-right font-mono">₹${numTotal.toLocaleString()}</td>
            <td class="text-right font-mono tag-receipt">₹${totalPaid.toLocaleString()}</td>
          </tr>
          <tr style="background-color: #fff1f2; font-weight: bold; border-top: 1.5px solid #fecdd3;">
            <td colspan="3" class="text-right" style="color: #e11d48; font-size: 11pt;">अंतिम शिल्लक बाकी येणे (Net Balance Due):</td>
            <td class="text-right font-mono" style="color: #e11d48; font-size: 13pt;">₹${balanceDue.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>

      <div class="footer-section">
        <div>
          <p style="margin: 0;"><strong>टीप:</strong> ग्राहकाने हिशोब तपासून उर्वरित बाकी मुदतीत जमा करावी.</p>
          <p style="margin: 3px 0 0 0;">श्री साई इंटरप्राइजेस • आर्वी रोड, वर्धा • फोन: 8766486915</p>
        </div>
        <div class="sign-box">
          <div class="sign-line"></div>
          <strong>अधिकृत स्वाक्षरी / शिक्का</strong>
        </div>
      </div>
    `;

    openStandardPrintWindow(`Hisab_${name || 'Customer'}`, innerHtml, 'portrait', 'A4');
  };

  const handleSaveToLedger = () => {
    if (onSaveQuickHisab) {
      onSaveQuickHisab({
        customerId: selectedCustId || undefined,
        customerName: name.trim() || 'Customer',
        customerPhone: phone.trim(),
        itemDetails: itemPurchased.trim(),
        totalAmount: numTotal,
        advancePaid: numAdvance,
        receiptPaid: numReceipt,
        balanceDue,
        notes: notes.trim(),
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-fade-in my-auto">
        {/* Header with High-Contrast Deep Banner */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-1.5">
                <span>मोबाईल हिशोब कॅल्क्युलेटर</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                  Fast
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                खरेदी बिल, अ‍ॅडव्हान्स आणि जमा पावतीचे तत्काळ कॅल्क्युलेशन व प्रिंट
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic Calculation Cards */}
        <div className="p-4 sm:p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          {/* Quick Customer Picker */}
          {customers.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ग्राहक निवडा (किंवा खाली नवीन नाव टाईप करा):
              </label>
              <select
                value={selectedCustId}
                onChange={(e) => handleSelectCustomer(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="">-- ग्राहक यादीतून निवडा (Select Customer) --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ''} {c.balanceDue > 0 ? `• बाकी: ₹${c.balanceDue}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Customer info fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ग्राहकाचे नाव (Customer Name) *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="उदा. राहुल शर्मा / निलेश पाटील"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                मोबाईल नंबर (WhatsApp No)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="उदा. 9876543210"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              खरेदी केलेली वस्तू / तपशील (Item Details)
            </label>
            <input
              type="text"
              value={itemPurchased}
              onChange={(e) => setItemPurchased(e.target.value)}
              placeholder="उदा. दिवाण 7000 चा / कपाट / बेड"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Three Input Fields for Hisab: Total, Advance, Receipt */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                हिशोब तपशील (Math Breakup)
              </span>
              <span className="text-[10px] text-slate-500">
                (उदा. दिवाण 7000, दिलेले 3000, पावती 1500)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-blue-700 dark:text-blue-400 mb-1">
                  १. एकूण बिल (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  value={billAmount}
                  onChange={(e) => setBillAmount(e.target.value)}
                  placeholder="7000"
                  className="w-full px-3 py-2 rounded-xl border border-blue-300 dark:border-blue-700/60 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold text-base focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-emerald-700 dark:text-emerald-400 mb-1">
                  २. खरेदीवेळी दिले (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  value={advancePaid}
                  onChange={(e) => setAdvancePaid(e.target.value)}
                  placeholder="3000"
                  className="w-full px-3 py-2 rounded-xl border border-emerald-300 dark:border-emerald-700/60 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold text-base focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-teal-700 dark:text-teal-400 mb-1">
                  ३. नंतरची पावती (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  value={receiptPaid}
                  onChange={(e) => setReceiptPaid(e.target.value)}
                  placeholder="1500"
                  className="w-full px-3 py-2 rounded-xl border border-teal-300 dark:border-teal-700/60 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold text-base focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Live Calculated Output Card */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-4 rounded-2xl shadow-md space-y-2.5">
            <div className="flex justify-between items-center text-xs text-slate-300 border-b border-slate-700/60 pb-2">
              <span>एकूण खरेदी किंमत (Billed):</span>
              <span className="font-mono font-bold text-sm text-white">₹{numTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-emerald-400 border-b border-slate-700/60 pb-2">
              <span>एकूण जमा रक्कम (Paid = ₹{numAdvance} + ₹{numReceipt}):</span>
              <span className="font-mono font-bold text-sm">₹{totalPaid.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <div>
                <span className="text-xs font-bold text-rose-300 uppercase tracking-wider block">
                  शिल्लक बाकी (Balance Due):
                </span>
                <span className="text-[10px] text-slate-400">
                  {balanceDue > 0 ? 'ग्राहकाकडून येणे बाकी आहे' : 'हिशोब पूर्ण चुकता झाला आहे'}
                </span>
              </div>
              <span className="font-mono font-black text-2xl text-rose-400">
                ₹{balanceDue.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Success Banner if Saved */}
          {isSaved && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>हा हिशोब मुख्य ग्राहक खातेवहीत यशस्वीरित्या नोंदवला गेला आहे!</span>
            </div>
          )}

          {/* Action Buttons: Print, WhatsApp, Save */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
            <button
              type="button"
              onClick={handlePrint}
              className="py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
            >
              <Printer className="w-4 h-4 text-amber-300" />
              <span>हिशोब पावती प्रिंट करा (Print A4)</span>
            </button>

            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
            >
              <Share2 className="w-4 h-4" />
              <span>व्हॉट्सॲपवर हिशोब पाठवा (Send)</span>
            </button>
          </div>

          {onSaveQuickHisab && (
            <button
              type="button"
              onClick={handleSaveToLedger}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-blue-500" />
              <span>खातेवहीत नवीन व्यवहार नोंदवा (Save to Khata)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
