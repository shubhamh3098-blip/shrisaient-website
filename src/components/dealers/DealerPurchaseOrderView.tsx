import React, { useState, useMemo } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Printer,
  Download,
  Building2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Send,
  Receipt,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { StoreData, Dealer, PurchaseOrder, DebitNote } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { StorageService } from '../../services/storageService';

interface DealerPurchaseOrderViewProps {
  storeData: StoreData;
  onRefreshData?: () => void;
}

export const DealerPurchaseOrderView: React.FC<DealerPurchaseOrderViewProps> = ({
  storeData,
  onRefreshData,
}) => {
  const { isDayMode } = useTheme();

  const [activeTab, setActiveTab] = useState<'po' | 'debit-note'>('po');

  // Purchase Order Form State
  const [selectedDealerId, setSelectedDealerId] = useState<string>(storeData.dealers[0]?.id || '');
  const [expectedDate, setExpectedDate] = useState<string>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [poNotes, setPoNotes] = useState<string>('कृपया माल तपासणी करून व पक्क्या बिलासह टेम्पोने पाठवावा.');
  const [poItems, setPoItems] = useState<
    { itemName: string; category: string; brand: string; qty: number; expectedRate: number }[]
  >([
    { itemName: 'Smart 4K UHD LED TV 43"', category: 'Electronics', brand: 'LG', qty: 5, expectedRate: 22500 },
    { itemName: '5-Star Direct Cool Refrigerator 190L', category: 'Appliances', brand: 'Whirlpool', qty: 3, expectedRate: 12800 },
  ]);

  // Debit Note Form State
  const [dnDealerId, setDnDealerId] = useState<string>(storeData.dealers[0]?.id || '');
  const [dnReason, setDnReason] = useState<DebitNote['reason']>('Transit Damage');
  const [dnProductName, setDnProductName] = useState<string>('');
  const [dnSerialNo, setDnSerialNo] = useState<string>('');
  const [dnAmount, setDnAmount] = useState<string>('');
  const [dnRemarks, setDnRemarks] = useState<string>('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Existing POs & Debit Notes (from storeData or empty defaults)
  const purchaseOrders = useMemo(() => storeData.purchaseOrders || [], [storeData.purchaseOrders]);
  const debitNotes = useMemo(() => storeData.debitNotes || [], [storeData.debitNotes]);

  // Add Item to PO
  const handleAddPoItem = () => {
    setPoItems((prev) => [
      ...prev,
      { itemName: '', category: 'Electronics', brand: '', qty: 1, expectedRate: 0 },
    ]);
  };

  const handleRemovePoItem = (index: number) => {
    setPoItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, val: any) => {
    setPoItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  // Calculate PO Total
  const poTotalAmount = useMemo(() => {
    return poItems.reduce((acc, it) => acc + (it.qty * it.expectedRate), 0);
  }, [poItems]);

  // Save & Create Purchase Order
  const handleSavePurchaseOrder = () => {
    const dealer = storeData.dealers.find((d) => d.id === selectedDealerId);
    if (!dealer) return;

    const poNumber = `PO-${new Date().getFullYear()}-${String(purchaseOrders.length + 101).padStart(3, '0')}`;
    const newPO: PurchaseOrder = {
      id: `po-${Date.now()}`,
      poNumber,
      dealerId: dealer.id,
      dealerName: dealer.companyName || dealer.name,
      date: new Date().toISOString().slice(0, 10),
      expectedDate,
      items: poItems.map((it) => ({
        ...it,
        total: it.qty * it.expectedRate,
      })),
      totalAmount: poTotalAmount,
      notes: poNotes,
      status: 'Sent',
    };

    const updatedData: StoreData = {
      ...storeData,
      purchaseOrders: [newPO, ...purchaseOrders],
    };

    StorageService.saveData(updatedData);
    setActionSuccessMsg(`नवीन खरेदी ऑर्डर ${poNumber} तयार झाली!`);
    if (onRefreshData) onRefreshData();
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  // Save & Apply Debit Note (Deduct from dealer currentPayable)
  const handleSaveDebitNote = () => {
    const amt = parseFloat(dnAmount) || 0;
    if (amt <= 0 || !dnProductName.trim()) return;

    const dealer = storeData.dealers.find((d) => d.id === dnDealerId);
    if (!dealer) return;

    const debitNoteNo = `DN-${new Date().getFullYear()}-${String(debitNotes.length + 51).padStart(3, '0')}`;
    const newDebitNote: DebitNote = {
      id: `dn-${Date.now()}`,
      debitNoteNo,
      dealerId: dealer.id,
      dealerName: dealer.companyName || dealer.name,
      date: new Date().toISOString().slice(0, 10),
      reason: dnReason,
      productName: dnProductName.trim(),
      serialNo: dnSerialNo.trim(),
      amount: amt,
      status: 'Applied',
      remarks: dnRemarks.trim(),
    };

    // Deduct from dealer's current payable balance
    const updatedDealers = storeData.dealers.map((d) => {
      if (d.id === dealer.id) {
        return {
          ...d,
          currentPayable: Math.max(0, d.currentPayable - amt),
        };
      }
      return d;
    });

    const updatedData: StoreData = {
      ...storeData,
      dealers: updatedDealers,
      debitNotes: [newDebitNote, ...debitNotes],
    };

    StorageService.saveData(updatedData);
    setActionSuccessMsg(`डेबिट नोट ${debitNoteNo} लागू झाली! डीलरच्या देण्यामधून ₹${amt.toLocaleString('en-IN')} वजा झाले.`);
    if (onRefreshData) onRefreshData();

    setDnProductName('');
    setDnSerialNo('');
    setDnAmount('');
    setDnRemarks('');
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div
        className={`p-4 sm:p-6 rounded-2xl border transition-all ${
          isDayMode
            ? 'bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 border-amber-200 text-slate-800 shadow-sm'
            : 'bg-gradient-to-r from-[#211707] via-[#1a140b] to-[#121624] border-amber-500/30 text-white shadow-xl'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black tracking-wider uppercase bg-amber-500 text-slate-950">
                Dealer Hub Pro
              </span>
              <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                खरेदी मागणी (PO) व डॅमेज डेबिट नोट
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              डीलर खरेदी मागणी व खराब माल डेबिट नोट (Purchase Order & Debit Note)
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-300 mt-1">
              होलसेल वितरकांना अधिकृत खरेदी मागणी पाठवा आणि ट्रान्सपोर्टमध्ये डॅमेज झालेल्या मालाचे पैसे थेट खात्यातून वजा करा.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>प्रिंट काढा (Print)</span>
            </button>
          </div>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-lg animate-fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Tabs */}
      <div
        className={`flex items-center gap-2 p-1.5 rounded-xl border text-xs font-bold ${
          isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}
      >
        <button
          onClick={() => setActiveTab('po')}
          className={`flex-1 py-2 px-4 rounded-lg transition cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'po' ? 'bg-amber-600 text-slate-950 font-black shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>अधिकृत खरेदी मागणी (Purchase Order Generator)</span>
        </button>

        <button
          onClick={() => setActiveTab('debit-note')}
          className={`flex-1 py-2 px-4 rounded-lg transition cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'debit-note' ? 'bg-amber-600 text-slate-950 font-black shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>डॅमेज माल व क्लेम डेबिट नोट (Damage Claim / Debit Note)</span>
        </button>
      </div>

      {/* TAB 1: PURCHASE ORDER GENERATOR */}
      {activeTab === 'po' && (
        <div className="space-y-6">
          <div
            className={`p-5 rounded-2xl border transition-all ${
              isDayMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0f172a] border-slate-800 shadow-xl'
            }`}
          >
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-400" />
              <span>नवीन खरेदी मागणी विवरण (Create Purchase Order)</span>
            </h3>

            {/* Dealer & Date Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  वितरक / डीलर निवडा (Select Wholesaler):
                </label>
                <select
                  value={selectedDealerId}
                  onChange={(e) => setSelectedDealerId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border text-xs bg-black/5 dark:bg-black/30 border-slate-300 dark:border-slate-700 outline-none cursor-pointer"
                >
                  {storeData.dealers.map((d) => (
                    <option key={d.id} value={d.id} className="bg-slate-900 text-white">
                      {d.companyName || d.name} ({d.city}) • देय: ₹{d.currentPayable.toLocaleString('en-IN')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  अपेक्षित डिलिव्हरी तारीख (Expected Date):
                </label>
                <input
                  type="date"
                  value={expectedDate}
                  onChange={(e) => setExpectedDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border text-xs font-mono bg-black/5 dark:bg-black/30 border-slate-300 dark:border-slate-700 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  डिलिव्हरी पत्ता (Delivery Location):
                </label>
                <input
                  type="text"
                  readOnly
                  value="मातोश्री सभागृह समोर, आर्वी रोड, वर्धा"
                  className="w-full px-3 py-2 rounded-xl border text-xs bg-black/5 dark:bg-black/30 border-slate-300 dark:border-slate-700 opacity-75 outline-none"
                />
              </div>
            </div>

            {/* Items Table */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  मागणी केलेली उत्पादने (Order Items List):
                </span>
                <button
                  type="button"
                  onClick={handleAddPoItem}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1 hover:bg-amber-500/30 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>वस्तू जोडा (+ Item)</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className={`border-b ${isDayMode ? 'bg-slate-50 text-slate-700' : 'bg-slate-900/60 text-slate-300'}`}>
                    <tr>
                      <th className="py-2.5 px-3">वस्तूचे नाव व मॉडेल</th>
                      <th className="py-2.5 px-3">कॅटेगरी</th>
                      <th className="py-2.5 px-3">ब्रँड</th>
                      <th className="py-2.5 px-3 text-center">नग (Qty)</th>
                      <th className="py-2.5 px-3 text-right">अपेक्षित दर (Rate ₹)</th>
                      <th className="py-2.5 px-3 text-right">एकूण (₹)</th>
                      <th className="py-2.5 px-3 text-center">काढा</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {poItems.map((item, index) => (
                      <tr key={index}>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={item.itemName}
                            onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                            placeholder="उदा. Smart LED TV 43"
                            className="w-full px-2 py-1 rounded border bg-transparent border-slate-700 outline-none text-xs"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <select
                            value={item.category}
                            onChange={(e) => handleItemChange(index, 'category', e.target.value)}
                            className="px-2 py-1 rounded border bg-transparent border-slate-700 outline-none text-xs"
                          >
                            <option value="Electronics" className="bg-slate-900">Electronics</option>
                            <option value="Appliances" className="bg-slate-900">Appliances</option>
                            <option value="Furniture" className="bg-slate-900">Furniture</option>
                            <option value="Other" className="bg-slate-900">Other</option>
                          </select>
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={item.brand}
                            onChange={(e) => handleItemChange(index, 'brand', e.target.value)}
                            placeholder="LG / Whirlpool"
                            className="w-24 px-2 py-1 rounded border bg-transparent border-slate-700 outline-none text-xs"
                          />
                        </td>
                        <td className="py-2 px-3 text-center">
                          <input
                            type="number"
                            value={item.qty}
                            onChange={(e) => handleItemChange(index, 'qty', parseInt(e.target.value) || 1)}
                            className="w-16 px-2 py-1 rounded border bg-transparent border-slate-700 outline-none text-center font-mono font-bold text-xs"
                          />
                        </td>
                        <td className="py-2 px-3 text-right">
                          <input
                            type="number"
                            value={item.expectedRate}
                            onChange={(e) => handleItemChange(index, 'expectedRate', parseFloat(e.target.value) || 0)}
                            className="w-24 px-2 py-1 rounded border bg-transparent border-slate-700 outline-none text-right font-mono text-xs"
                          />
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-amber-400">
                          ₹{(item.qty * item.expectedRate).toLocaleString('en-IN')}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemovePoItem(index)}
                            className="text-rose-400 hover:text-rose-300 cursor-pointer p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Row with Total & Save */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="text-xs text-slate-400">
                एकूण अंदाज रक्कम: <strong className="text-amber-400 text-lg font-mono ml-2">₹{poTotalAmount.toLocaleString('en-IN')}</strong>
              </div>

              <button
                type="button"
                onClick={handleSavePurchaseOrder}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>अधिकृत खरेदी मागणी सेव्ह करा (Generate PO)</span>
              </button>
            </div>
          </div>

          {/* List of Existing POs */}
          <div
            className={`p-5 rounded-2xl border transition-all ${
              isDayMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0f172a] border-slate-800 shadow-xl'
            }`}
          >
            <h4 className="font-bold text-sm mb-3">मागील खरेदी मागण्या (Purchase Orders History)</h4>
            <div className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
              {purchaseOrders.length > 0 ? (
                purchaseOrders.map((po) => (
                  <div key={po.id} className="py-3 flex items-center justify-between">
                    <div>
                      <span className="font-bold font-mono text-amber-400">{po.poNumber}</span>
                      <span className="text-slate-400 ml-2">डीलर: {po.dealerName}</span>
                      <span className="text-slate-500 text-[11px] block mt-0.5">तारीख: {po.date} • {po.items.length} वस्तू</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-emerald-400 block text-sm">
                        ₹{po.totalAmount.toLocaleString('en-IN')}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300">
                        {po.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-slate-500 py-4 text-center">अद्याप कोणतीही खरेदी मागणी नोंदवलेली नाही.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DEBIT NOTE / DAMAGE CLAIM */}
      {activeTab === 'debit-note' && (
        <div className="space-y-6">
          <div
            className={`p-5 rounded-2xl border transition-all ${
              isDayMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0f172a] border-slate-800 shadow-xl'
            }`}
          >
            <h3 className="font-bold text-sm mb-1 flex items-center gap-2 text-rose-400">
              <RotateCcw className="w-4 h-4" />
              <span>खराब माल / डॅमेज डेबिट नोट जारी करा (Issue Debit Note)</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              कंपनीकडून किंवा ट्रान्सपोर्टमध्ये आलेला खराब माल डीलरच्या खात्यातून थेट वजा करण्यासाठी डेबिट नोट बनवा.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  संबंधित वितरक (Dealer):
                </label>
                <select
                  value={dnDealerId}
                  onChange={(e) => setDnDealerId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border text-xs bg-black/5 dark:bg-black/30 border-slate-300 dark:border-slate-700 outline-none"
                >
                  {storeData.dealers.map((d) => (
                    <option key={d.id} value={d.id} className="bg-slate-900 text-white">
                      {d.companyName || d.name} (देय: ₹{d.currentPayable.toLocaleString('en-IN')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  परताव्याचे कारण (Claim Reason):
                </label>
                <select
                  value={dnReason}
                  onChange={(e) => setDnReason(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border text-xs bg-black/5 dark:bg-black/30 border-slate-300 dark:border-slate-700 outline-none"
                >
                  <option value="Transit Damage">वाहतुकीत डॅमेज/फूट (Transit Damage)</option>
                  <option value="Defective Display/Panel">डिस्प्ले/स्क्रीन फॉल्ट (Defective Panel)</option>
                  <option value="Cracked Body">बॉडी क्रॅक/स्क्रॅचेस (Cracked Body)</option>
                  <option value="Rate Difference">दरातील फरक (Rate Difference)</option>
                  <option value="Short Supply">कमी आलेला माल (Short Supply)</option>
                  <option value="Other">इतर कारण (Other)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  वस्तूचे नाव व मॉडेल (Product Name):
                </label>
                <input
                  type="text"
                  value={dnProductName}
                  onChange={(e) => setDnProductName(e.target.value)}
                  placeholder="उदा. Desert Air Cooler 70L"
                  className="w-full px-3 py-2 rounded-xl border text-xs bg-black/5 dark:bg-black/30 border-slate-300 dark:border-slate-700 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  क्लेम रक्कम (Debit Amount ₹):
                </label>
                <input
                  type="number"
                  value={dnAmount}
                  onChange={(e) => setDnAmount(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-xl border text-xs font-mono font-bold text-rose-400 bg-black/5 dark:bg-black/30 border-slate-300 dark:border-slate-700 outline-none"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-400 mb-1">
                तपशील व ट्रान्सपोर्ट पावती टीप (Remarks):
              </label>
              <input
                type="text"
                value={dnRemarks}
                onChange={(e) => setDnRemarks(e.target.value)}
                placeholder="उदा. नागपूर ट्रान्सपोर्ट डिलिव्हरी दरम्यान कुलरचा डावा टँक फुटलेला आढळला."
                className="w-full px-3 py-2 rounded-xl border text-xs bg-black/5 dark:bg-black/30 border-slate-300 dark:border-slate-700 outline-none"
              />
            </div>

            <button
              type="button"
              onClick={handleSaveDebitNote}
              className="py-2.5 px-5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>डेबिट नोट जारी करा व डीलरकडून पैसे वजा करा</span>
            </button>
          </div>

          {/* Debit Notes History */}
          <div
            className={`p-5 rounded-2xl border transition-all ${
              isDayMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0f172a] border-slate-800 shadow-xl'
            }`}
          >
            <h4 className="font-bold text-sm mb-3">जारी केलेल्या डेबिट नोट्स (Issued Debit Notes History)</h4>
            <div className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
              {debitNotes.length > 0 ? (
                debitNotes.map((dn) => (
                  <div key={dn.id} className="py-3 flex items-center justify-between">
                    <div>
                      <span className="font-bold font-mono text-rose-400">{dn.debitNoteNo}</span>
                      <span className="text-slate-300 ml-2 font-medium">{dn.productName}</span>
                      <span className="text-slate-400 ml-2">({dn.dealerName})</span>
                      <span className="text-slate-500 text-[11px] block mt-0.5">कारण: {dn.reason} • तारीख: {dn.date}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-rose-400 block text-sm">
                        -₹{dn.amount.toLocaleString('en-IN')}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                        खात्यातून वजा
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-slate-500 py-4 text-center">अद्याप कोणतीही डेबिट नोट जारी केलेली नाही.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
