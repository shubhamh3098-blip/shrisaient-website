import React, { useState, useMemo } from 'react';
import {
  FileText,
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Building2,
  Users,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Percent
} from 'lucide-react';
import { StoreData } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface GstTaxReportsViewProps {
  storeData: StoreData;
}

export const GstTaxReportsView: React.FC<GstTaxReportsViewProps> = ({ storeData }) => {
  const { isDayMode } = useTheme();

  // Active Month: YYYY-MM
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState<string>(defaultMonth);
  const [activeTab, setActiveTab] = useState<'gstr1' | 'gstr3b' | 'hsn'>('gstr1');

  // Filter Transactions for selected month
  const monthlyTransactions = useMemo(() => {
    return storeData.transactions.filter(t => t.date && t.date.startsWith(selectedMonth));
  }, [storeData.transactions, selectedMonth]);

  // Filter Purchases for selected month (for Input Tax Credit - ITC)
  const monthlyPurchases = useMemo(() => {
    return storeData.purchases.filter(p => p.date && p.date.startsWith(selectedMonth));
  }, [storeData.purchases, selectedMonth]);

  // Break transactions into B2B (with GSTIN) and B2C (Consumer)
  const gstr1Data = useMemo(() => {
    const b2bInvoices: typeof monthlyTransactions = [];
    const b2cInvoices: typeof monthlyTransactions = [];

    let totalTaxableValue = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;
    let totalInvoiceValue = 0;

    monthlyTransactions.forEach(tx => {
      // Determine if B2B (if remarks or customer notes mention a 15-char GSTIN)
      const hasGstin = tx.remarks && /[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}/i.test(tx.remarks);
      
      const invVal = tx.grandTotal || 0;
      const taxVal = tx.taxTotal || (invVal * 0.18 / 1.18); // default standard 18% GST if bundled
      const taxable = invVal - taxVal;
      const halfTax = taxVal / 2;

      totalInvoiceValue += invVal;
      totalTaxableValue += taxable;
      totalCgst += halfTax;
      totalSgst += halfTax;

      if (hasGstin) {
        b2bInvoices.push(tx);
      } else {
        b2cInvoices.push(tx);
      }
    });

    return {
      b2bInvoices,
      b2cInvoices,
      totalInvoiceValue,
      totalTaxableValue,
      totalCgst,
      totalSgst,
      totalIgst,
      totalTax: totalCgst + totalSgst + totalIgst,
    };
  }, [monthlyTransactions]);

  // Calculate HSN Summary
  const hsnSummary = useMemo(() => {
    const hsnMap: Record<string, { desc: string; qty: number; taxable: number; rate: number; cgst: number; sgst: number; total: number }> = {
      '8528': { desc: 'Smart LED TV & Monitors (इलेक्ट्रॉनिक्स टीव्ही)', qty: 0, taxable: 0, rate: 18, cgst: 0, sgst: 0, total: 0 },
      '8418': { desc: 'Refrigerators & Freezers (रेफ्रिजरेटर)', qty: 0, taxable: 0, rate: 18, cgst: 0, sgst: 0, total: 0 },
      '8450': { desc: 'Washing Machines (वॉशिंग मशीन)', qty: 0, taxable: 0, rate: 18, cgst: 0, sgst: 0, total: 0 },
      '9403': { desc: 'Teakwood & Steel Furniture (सागवान व स्टील फर्निचर)', qty: 0, taxable: 0, rate: 18, cgst: 0, sgst: 0, total: 0 },
      '8415': { desc: 'Air Conditioners & Coolers (एअर कुलर व एसी)', qty: 0, taxable: 0, rate: 18, cgst: 0, sgst: 0, total: 0 },
      '8516': { desc: 'Electric Appliances & Mixer (घरगुती उपकरणे)', qty: 0, taxable: 0, rate: 18, cgst: 0, sgst: 0, total: 0 },
      '9999': { desc: 'General Goods & Other (इतर साहित्याची विक्री)', qty: 0, taxable: 0, rate: 18, cgst: 0, sgst: 0, total: 0 },
    };

    monthlyTransactions.forEach(tx => {
      tx.items.forEach(item => {
        const nameLower = (item.name || '').toLowerCase();
        let code = '9999';

        if (nameLower.includes('tv') || nameLower.includes('led') || nameLower.includes('smart')) {
          code = '8528';
        } else if (nameLower.includes('fridge') || nameLower.includes('refrigerator')) {
          code = '8418';
        } else if (nameLower.includes('wash') || nameLower.includes('machine')) {
          code = '8450';
        } else if (nameLower.includes('sofa') || nameLower.includes('diwan') || nameLower.includes('cupboard') || nameLower.includes('cot') || nameLower.includes('furniture')) {
          code = '9403';
        } else if (nameLower.includes('cooler') || nameLower.includes('ac')) {
          code = '8415';
        } else if (nameLower.includes('mixer') || nameLower.includes('grinder') || nameLower.includes('iron')) {
          code = '8516';
        }

        const itemTotal = item.total || (item.rate * item.qty);
        const taxVal = itemTotal * 0.18 / 1.18;
        const taxable = itemTotal - taxVal;
        const half = taxVal / 2;

        hsnMap[code].qty += item.qty;
        hsnMap[code].taxable += taxable;
        hsnMap[code].cgst += half;
        hsnMap[code].sgst += half;
        hsnMap[code].total += itemTotal;
      });
    });

    return Object.entries(hsnMap).filter(([_, data]) => data.qty > 0);
  }, [monthlyTransactions]);

  // GSTR-3B Input Tax Credit (ITC) from Purchases
  const itcData = useMemo(() => {
    let totalPurchaseValue = 0;
    let totalPurchaseTaxable = 0;
    let itcCgst = 0;
    let itcSgst = 0;

    monthlyPurchases.forEach(p => {
      const amt = p.totalAmount || 0;
      const tax = amt * 0.18 / 1.18;
      const taxable = amt - tax;
      const half = tax / 2;

      totalPurchaseValue += amt;
      totalPurchaseTaxable += taxable;
      itcCgst += half;
      itcSgst += half;
    });

    const outputTax = gstr1Data.totalTax;
    const inputCredit = itcCgst + itcSgst;
    const netGstPayable = Math.max(0, outputTax - inputCredit);

    return {
      totalPurchaseValue,
      totalPurchaseTaxable,
      itcCgst,
      itcSgst,
      totalItc: inputCredit,
      netGstPayable,
    };
  }, [monthlyPurchases, gstr1Data.totalTax]);

  // Export for CA
  const handleExportCAExcel = () => {
    let csv = `SHRI SAI ENTERPRISES, WARDHA (GSTIN: ${storeData.settings.gstin || '27AAAAA0000A1Z5'})\n`;
    csv += `GSTR-1 & TAX AUDIT REPORT - MONTH: ${selectedMonth}\n`;
    csv += `Generated On: ${new Date().toLocaleDateString('en-IN')}\n\n`;

    csv += `GSTR-1 OUTWARD SUPPLIES SUMMARY\n`;
    csv += `Invoice No,Date,Customer Name,Type,Taxable Value (₹),CGST 9% (₹),SGST 9% (₹),Total GST (₹),Invoice Total (₹)\n`;

    monthlyTransactions.forEach(tx => {
      const invVal = tx.grandTotal || 0;
      const tax = tx.taxTotal || (invVal * 0.18 / 1.18);
      const taxable = invVal - tax;
      const half = tax / 2;
      const type = (tx.remarks && tx.remarks.length > 10) ? 'B2B' : 'B2C (Retail)';

      csv += `"${tx.invoiceNo}","${tx.date}","${tx.customerName.replace(/"/g, '""')}","${type}",${taxable.toFixed(2)},${half.toFixed(2)},${half.toFixed(2)},${tax.toFixed(2)},${invVal.toFixed(2)}\n`;
    });

    csv += `\nTOTALS,,,${gstr1Data.totalTaxableValue.toFixed(2)},${gstr1Data.totalCgst.toFixed(2)},${gstr1Data.totalSgst.toFixed(2)},${gstr1Data.totalTax.toFixed(2)},${gstr1Data.totalInvoiceValue.toFixed(2)}\n\n`;

    csv += `HSN / SAC SUMMARY (TABLE 12)\n`;
    csv += `HSN Code,Description,UQC,Total Qty,Taxable Value,Rate %,CGST,SGST,Total Tax\n`;
    hsnSummary.forEach(([code, data]) => {
      csv += `"${code}","${data.desc}","NOS",${data.qty},${data.taxable.toFixed(2)},${data.rate}%,${data.cgst.toFixed(2)},${data.sgst.toFixed(2)},${(data.cgst + data.sgst).toFixed(2)}\n`;
    });

    csv += `\nGSTR-3B TAX LIABILITY RECONCILIATION\n`;
    csv += `Metric,Amount (INR)\n`;
    csv += `Total Output Tax on Sales,${gstr1Data.totalTax.toFixed(2)}\n`;
    csv += `Eligible Input Tax Credit (ITC from Purchases),${itcData.totalItc.toFixed(2)}\n`;
    csv += `Net Tax Payable in Cash,${itcData.netGstPayable.toFixed(2)}\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ShriSai_GST_Report_${selectedMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className={`p-4 sm:p-6 rounded-2xl border transition-all ${
        isDayMode
          ? 'bg-gradient-to-r from-blue-50 via-sky-50 to-indigo-50 border-blue-200 text-slate-800 shadow-sm'
          : 'bg-gradient-to-r from-[#0c1829] via-[#0d1624] to-[#12142e] border-sky-500/30 text-white shadow-xl'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black tracking-wider uppercase bg-sky-500 text-slate-950">
                ERP Strong Upgrade
              </span>
              <span className="text-xs text-sky-400 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                जीएसटी GSTR-1, 3B व टॅक्स ऑडिट केंद्र
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              जीएसटी रिटर्न्स व टॅक्स अनुपालन (GST Tax Compliance Center)
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-300 mt-1">
              GSTIN: <strong className="text-amber-400 font-mono">{storeData.settings.gstin || '27AAAAA0000A1Z5'}</strong> • वर्धा शोरूम मासिक विक्री व खरेदी कर विवरण.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Month Picker */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold ${
              isDayMode ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700'
            }`}>
              <Calendar className="w-4 h-4 text-sky-400" />
              <span>महिना:</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent font-mono outline-none text-sky-400 cursor-pointer"
              />
            </div>

            {/* Export for CA */}
            <button
              onClick={handleExportCAExcel}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>CA साठी एक्सेल डाउनलोड</span>
            </button>

            <button
              onClick={() => window.print()}
              className={`p-2 rounded-xl border font-bold text-xs transition cursor-pointer ${
                isDayMode ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
              title="प्रिंट करा"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Taxable Value */}
        <div className={`p-4 rounded-2xl border transition-all ${
          isDayMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0f172a] border-slate-800 shadow-lg'
        }`}>
          <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">
            करपात्र मूल्य (Taxable Value)
          </div>
          <div className="text-2xl font-black text-sky-400 font-mono">
            ₹{gstr1Data.totalTaxableValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            एकूण इनव्हॉइस: ₹{gstr1Data.totalInvoiceValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
        </div>

        {/* 2. Output GST Collected */}
        <div className={`p-4 rounded-2xl border transition-all ${
          isDayMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0f172a] border-slate-800 shadow-lg'
        }`}>
          <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">
            एकूण विक्री कर (Output GST)
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono">
            ₹{gstr1Data.totalTax.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <div className="text-xs text-slate-400 mt-2 font-mono flex justify-between">
            <span>CGST: ₹{gstr1Data.totalCgst.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            <span>SGST: ₹{gstr1Data.totalSgst.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
          </div>
        </div>

        {/* 3. Input Tax Credit (ITC) */}
        <div className={`p-4 rounded-2xl border transition-all ${
          isDayMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0f172a] border-slate-800 shadow-lg'
        }`}>
          <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">
            खरेदीवरील कर सवलत (Eligible ITC)
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            ₹{itcData.totalItc.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            डीलर्सकडून खरेदी बिलांवर मिळालेली वजावट
          </div>
        </div>

        {/* 4. Net Tax Payable */}
        <div className={`p-4 rounded-2xl border transition-all ${
          isDayMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0f172a] border-slate-800 shadow-lg'
        }`}>
          <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">
            शासनास देय निव्वळ कर (Net Tax Payable)
          </div>
          <div className="text-2xl font-black text-rose-400 font-mono">
            ₹{itcData.netGstPayable.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            चलन भरणा (Output Tax वजा Input Credit)
          </div>
        </div>
      </div>

      {/* Sub-Tab Navigation */}
      <div className={`flex items-center gap-2 p-1.5 rounded-xl border text-xs font-bold ${
        isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <button
          onClick={() => setActiveTab('gstr1')}
          className={`flex-1 py-2 px-4 rounded-lg transition cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'gstr1'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>GSTR-1 विक्री तपशील (Outward Supplies)</span>
        </button>

        <button
          onClick={() => setActiveTab('hsn')}
          className={`flex-1 py-2 px-4 rounded-lg transition cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'hsn'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>HSN/SAC कोड समरी (Table 12)</span>
        </button>

        <button
          onClick={() => setActiveTab('gstr3b')}
          className={`flex-1 py-2 px-4 rounded-lg transition cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'gstr3b'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Percent className="w-4 h-4" />
          <span>GSTR-3B कर ताळमेळ (Tax Reconciliation)</span>
        </button>
      </div>

      {/* TAB 1: GSTR-1 Invoices Table */}
      {activeTab === 'gstr1' && (
        <div className={`rounded-2xl border overflow-hidden transition-all ${
          isDayMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0f172a] border-slate-800 shadow-xl'
        }`}>
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-sm">
              मासिक विक्री बिले ({monthlyTransactions.length} नोंदी - {selectedMonth})
            </h3>
            <span className="text-xs text-slate-400">GSTR-1 B2C व B2B रेकॉर्ड्स</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className={`border-b ${isDayMode ? 'bg-slate-50 text-slate-700' : 'bg-slate-900/60 text-slate-300'}`}>
                <tr>
                  <th className="py-3 px-4">बिल क्र.</th>
                  <th className="py-3 px-4">तारीख</th>
                  <th className="py-3 px-4">ग्राहक नाव</th>
                  <th className="py-3 px-4">प्रकार</th>
                  <th className="py-3 px-4 text-right">करपात्र रक्कम</th>
                  <th className="py-3 px-4 text-right">CGST 9%</th>
                  <th className="py-3 px-4 text-right">SGST 9%</th>
                  <th className="py-3 px-4 text-right">एकूण बिल</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {monthlyTransactions.length > 0 ? (
                  monthlyTransactions.map(tx => {
                    const invVal = tx.grandTotal || 0;
                    const tax = tx.taxTotal || (invVal * 0.18 / 1.18);
                    const taxable = invVal - tax;
                    const half = tax / 2;

                    return (
                      <tr key={tx.id} className="hover:bg-slate-500/5 transition">
                        <td className="py-2.5 px-4 font-mono font-bold text-sky-400">{tx.invoiceNo}</td>
                        <td className="py-2.5 px-4 font-mono text-slate-400">{tx.date}</td>
                        <td className="py-2.5 px-4 font-medium">{tx.customerName}</td>
                        <td className="py-2.5 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/10 text-slate-300">
                            B2C Retail
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono">₹{taxable.toFixed(2)}</td>
                        <td className="py-2.5 px-4 text-right font-mono text-amber-400">₹{half.toFixed(2)}</td>
                        <td className="py-2.5 px-4 text-right font-mono text-amber-400">₹{half.toFixed(2)}</td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-400">₹{invVal.toFixed(2)}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      {selectedMonth} या महिन्यात कोणतीही विक्री बिले आढळली नाहीत.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: HSN Summary */}
      {activeTab === 'hsn' && (
        <div className={`rounded-2xl border overflow-hidden transition-all ${
          isDayMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0f172a] border-slate-800 shadow-xl'
        }`}>
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-sm">
              HSN/SAC कोडनुसार सारांश (Table 12 Summary)
            </h3>
            <p className="text-xs text-slate-400">
              जीएसटी पोर्टलवर थेट अपलोड करण्यासाठी प्रमाणित HSN कोड नुसार वर्गीकरण
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className={`border-b ${isDayMode ? 'bg-slate-50 text-slate-700' : 'bg-slate-900/60 text-slate-300'}`}>
                <tr>
                  <th className="py-3 px-4">HSN कोड</th>
                  <th className="py-3 px-4">वर्णन (Description)</th>
                  <th className="py-3 px-4 text-center">UQC</th>
                  <th className="py-3 px-4 text-center">एकूण नग (Qty)</th>
                  <th className="py-3 px-4 text-right">करपात्र मूल्य</th>
                  <th className="py-3 px-4 text-right">दर %</th>
                  <th className="py-3 px-4 text-right">CGST</th>
                  <th className="py-3 px-4 text-right">SGST</th>
                  <th className="py-3 px-4 text-right">एकूण कर</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {hsnSummary.length > 0 ? (
                  hsnSummary.map(([code, data]) => (
                    <tr key={code} className="hover:bg-slate-500/5 transition">
                      <td className="py-3 px-4 font-mono font-bold text-amber-400">{code}</td>
                      <td className="py-3 px-4 font-medium">{data.desc}</td>
                      <td className="py-3 px-4 text-center font-mono">NOS</td>
                      <td className="py-3 px-4 text-center font-mono font-bold">{data.qty}</td>
                      <td className="py-3 px-4 text-right font-mono">₹{data.taxable.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-mono">18%</td>
                      <td className="py-3 px-4 text-right font-mono text-sky-400">₹{data.cgst.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-mono text-sky-400">₹{data.sgst.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                        ₹{(data.cgst + data.sgst).toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-500">
                      या महिन्यासाठी HSN डेटा उपलब्ध नाही.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: GSTR-3B Reconciliation */}
      {activeTab === 'gstr3b' && (
        <div className={`p-5 rounded-2xl border transition-all ${
          isDayMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0f172a] border-slate-800 shadow-xl'
        }`}>
          <h3 className="font-bold text-base mb-1">GSTR-3B कर दायित्व व इनपुट क्रेडिट ताळमेळ</h3>
          <p className="text-xs text-slate-400 mb-6">
            विक्री कर (Outward Liability) व खरेदीवरील कर सवलत (ITC) वजा करून शासनास भरावयाचा निव्वळ कर.
          </p>

          <div className="space-y-4 max-w-3xl">
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 flex items-center justify-between">
              <div>
                <span className="font-bold text-sm block">1. Table 3.1: एकूण विक्रीवरील कर देयता (Outward Supplies)</span>
                <span className="text-xs text-slate-400">ग्राहकांकडून बिलांमध्ये गोळा केलेला कर</span>
              </div>
              <span className="font-mono font-bold text-base text-amber-400">
                ₹{gstr1Data.totalTax.toFixed(2)}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 flex items-center justify-between">
              <div>
                <span className="font-bold text-sm block">2. Table 4.0: खरेदीवरील उपलब्ध कर सवलत (Eligible ITC)</span>
                <span className="text-xs text-slate-400">डीलर्सकडून खरेदी केलेल्या स्टॉकवर अदा केलेला कर</span>
              </div>
              <span className="font-mono font-bold text-base text-emerald-400">
                -₹{itcData.totalItc.toFixed(2)}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-r from-rose-950/40 to-slate-900 border border-rose-500/40 flex items-center justify-between">
              <div>
                <span className="font-black text-sm block text-rose-300">
                  3. Table 6.1: रोख चलनाने शासनास देय निव्वळ कर (Net Tax Payable in Cash)
                </span>
                <span className="text-xs text-slate-400">बँकेतून किंवा नेटबँकिंगने भरणा करावयाची अंतिम रक्कम</span>
              </div>
              <span className="font-mono font-black text-xl text-rose-400">
                ₹{itcData.netGstPayable.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
