import React, { useState, useMemo } from 'react';
import {
  Truck,
  FileText,
  Printer,
  Plus,
  Trash2,
  CheckCircle2,
  Calendar,
  Clock,
  ShieldCheck,
  Send,
  Building2,
  UserCheck,
  Sparkles,
  Search
} from 'lucide-react';
import { StoreData, DeliveryChallan, Transaction } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { StorageService } from '../../services/storageService';

interface EwayDeliveryChallanViewProps {
  storeData: StoreData;
  onRefreshData?: () => void;
}

export const EwayDeliveryChallanView: React.FC<EwayDeliveryChallanViewProps> = ({
  storeData,
  onRefreshData,
}) => {
  const { isDayMode } = useTheme();

  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');
  const [selectedTxId, setSelectedTxId] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [vehicleNo, setVehicleNo] = useState<string>('MH-32 B 4521 (Tata Ace)');
  const [driverName, setDriverName] = useState<string>('अनिल मेश्राम (ड्रायव्हर)');
  const [driverPhone, setDriverPhone] = useState<string>('98220 11445');
  const [ewayBillNo, setEwayBillNo] = useState<string>('');
  const [items, setItems] = useState<{ itemName: string; qty: number; serialNo?: string }[]>([
    { itemName: 'चंद्रपूर अस्सल सागवान सोफा सेट (3+1+1)', qty: 1, serialNo: 'WOD-SOF-2026' },
  ]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const challans = useMemo(() => storeData.deliveryChallans || [], [storeData.deliveryChallans]);

  // Autofill from existing transaction
  const handleSelectTransaction = (txId: string) => {
    setSelectedTxId(txId);
    const tx = storeData.transactions.find((t) => t.id === txId);
    if (tx) {
      setCustomerName(tx.customerName);
      setCustomerPhone(tx.customerPhone);
      setDeliveryAddress(tx.customerAddress || 'वर्धा शहर / ग्रामीण बीट');
      setItems(
        tx.items.map((it) => ({
          itemName: it.name,
          qty: it.qty,
          serialNo: it.serialNo || '',
        }))
      );
    }
  };

  const handleAddItem = () => {
    setItems((prev) => [...prev, { itemName: '', qty: 1, serialNo: '' }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Save Challan
  const handleSaveChallan = () => {
    if (!customerName.trim() || items.length === 0) return;

    const challanNo = `DC-2026-${String(challans.length + 101).padStart(3, '0')}`;
    const newChallan: DeliveryChallan = {
      id: `dc-${Date.now()}`,
      challanNo,
      date: new Date().toISOString().slice(0, 10),
      invoiceNo: selectedTxId ? storeData.transactions.find((t) => t.id === selectedTxId)?.invoiceNo : undefined,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      deliveryAddress: deliveryAddress.trim(),
      vehicleNo: vehicleNo.trim(),
      driverName: driverName.trim(),
      driverPhone: driverPhone.trim(),
      items: items.filter((it) => it.itemName.trim().length > 0),
      ewayBillNo: ewayBillNo.trim() || undefined,
      dispatchTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      status: 'Dispatched',
    };

    const updatedData: StoreData = {
      ...storeData,
      deliveryChallans: [newChallan, ...challans],
    };

    StorageService.saveData(updatedData);
    setSuccessMsg(`डिलिव्हरी चलान ${challanNo} यशस्वीरित्या तयार झाले!`);
    if (onRefreshData) onRefreshData();

    setTimeout(() => {
      setSuccessMsg(null);
      setActiveTab('list');
    }, 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div
        className={`p-4 sm:p-6 rounded-2xl border transition-all ${
          isDayMode
            ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 border-emerald-200 text-slate-800 shadow-sm'
            : 'bg-gradient-to-r from-[#0d1f19] via-[#0d1624] to-[#141b2d] border-emerald-500/30 text-white shadow-xl'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black tracking-wider uppercase bg-emerald-500 text-slate-950">
                Logistics & Dispatch
              </span>
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <Truck className="w-3.5 h-3.5" />
                GST नियम ५५ अधिकृत डिलिव्हरी चलान
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              ई-वे बिल व ट्रान्सपोर्ट डिलिव्हरी चलान (Delivery Challan & Gate Pass)
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-300 mt-1">
              वर्धा व लगतच्या ग्रामीण भागातील टेम्पो डिलिव्हरीसाठी अधिकृत चलान, वाहन क्रमांक व ड्रायव्हर गेट-पास तयार करा.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>चलान प्रिंट (Print Challan)</span>
            </button>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-lg animate-fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tabs */}
      <div
        className={`flex items-center gap-2 p-1.5 rounded-xl border text-xs font-bold ${
          isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}
      >
        <button
          onClick={() => setActiveTab('create')}
          className={`flex-1 py-2 px-4 rounded-lg transition cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'create' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>नवीन डिलिव्हरी चलान बनवा (Create Delivery Challan)</span>
        </button>

        <button
          onClick={() => setActiveTab('list')}
          className={`flex-1 py-2 px-4 rounded-lg transition cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'list' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>पाठवलेली चलान यादी ({challans.length} नोंदी)</span>
        </button>
      </div>

      {activeTab === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form */}
          <div className="lg:col-span-7 space-y-4">
            <div
              className={`p-5 rounded-2xl border transition-all ${
                isDayMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0f172a] border-slate-800 shadow-xl'
              }`}
            >
              <h3 className="font-bold text-sm mb-4">चलान व ट्रान्सपोर्ट तपशील</h3>

              {/* Autofill from Sale */}
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  विक्री बिलातून थेट माहिती भरा (Autofill from Sale):
                </label>
                <select
                  value={selectedTxId}
                  onChange={(e) => handleSelectTransaction(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border text-xs bg-black/5 dark:bg-black/30 border-slate-300 dark:border-slate-700 outline-none"
                >
                  <option value="" className="bg-slate-900">-- थेट कस्टम चलान बनवा किंवा बिल निवडा --</option>
                  {storeData.transactions.slice(0, 30).map((t) => (
                    <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                      {t.invoiceNo} - {t.customerName} (₹{t.grandTotal})
                    </option>
                  ))}
                </select>
              </div>

              {/* Customer & Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">ग्राहकाचे नाव:</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="उदा. राजेश वानखेडे"
                    className="w-full px-3 py-2 rounded-xl border text-xs bg-black/5 dark:bg-black/30 border-slate-300 dark:border-slate-700 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">मोबाईल नंबर:</label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="98XXXXXXXX"
                    className="w-full px-3 py-2 rounded-xl border text-xs font-mono bg-black/5 dark:bg-black/30 border-slate-300 dark:border-slate-700 outline-none"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-400 mb-1">डिलिव्हरी पत्ता (गाव / शहर):</label>
                <input
                  type="text"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="उदा. मु. पो. सेलू, मुख्य रस्ता, ता. सेलू, जि. वर्धा"
                  className="w-full px-3 py-2 rounded-xl border text-xs bg-black/5 dark:bg-black/30 border-slate-300 dark:border-slate-700 outline-none"
                />
              </div>

              {/* Transport Vehicle & Driver */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 pt-3 border-t border-slate-200 dark:border-slate-800">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">वाहन क्रमांक (Vehicle No):</label>
                  <input
                    type="text"
                    value={vehicleNo}
                    onChange={(e) => setVehicleNo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-mono font-bold bg-black/5 dark:bg-black/30 border-slate-300 dark:border-slate-700 outline-none text-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">चालकाचे नाव (Driver Name):</label>
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-xs bg-black/5 dark:bg-black/30 border-slate-300 dark:border-slate-700 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">ई-वे बिल क्र. (पर्यायी):</label>
                  <input
                    type="text"
                    value={ewayBillNo}
                    onChange={(e) => setEwayBillNo(e.target.value)}
                    placeholder="EWB-12345678"
                    className="w-full px-3 py-2 rounded-xl border text-xs font-mono bg-black/5 dark:bg-black/30 border-slate-300 dark:border-slate-700 outline-none"
                  />
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    गाडीत भरलेला माल (Items Dispatched):
                  </span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold hover:bg-emerald-500/30 transition cursor-pointer"
                  >
                    + वस्तू जोडा
                  </button>
                </div>

                {items.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={item.itemName}
                      onChange={(e) => {
                        const copy = [...items];
                        copy[index].itemName = e.target.value;
                        setItems(copy);
                      }}
                      placeholder="वस्तूचे नाव"
                      className="flex-1 px-3 py-1.5 rounded-lg border text-xs bg-black/5 dark:bg-black/30 border-slate-700 outline-none"
                    />
                    <input
                      type="number"
                      value={item.qty}
                      onChange={(e) => {
                        const copy = [...items];
                        copy[index].qty = parseInt(e.target.value) || 1;
                        setItems(copy);
                      }}
                      className="w-16 px-2 py-1.5 rounded-lg border text-xs text-center font-mono font-bold bg-black/5 dark:bg-black/30 border-slate-700 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="p-1.5 text-rose-400 hover:text-rose-300 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleSaveChallan}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
              >
                <Truck className="w-4 h-4" />
                <span>चलान जारी करा व गेट-पास प्रिंट करा (Generate Gate Pass)</span>
              </button>
            </div>
          </div>

          {/* Printable Preview */}
          <div className="lg:col-span-5 flex justify-center">
            <div
              className={`w-full max-w-[420px] p-5 rounded-2xl border-2 shadow-xl ${
                isDayMode ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#0b1020] border-slate-700 text-white'
              }`}
            >
              <div className="text-center border-b border-slate-700 pb-3 mb-3">
                <span className="font-serif font-black text-sm text-emerald-400 uppercase tracking-wide block">
                  SHRI SAI ENTERPRISES
                </span>
                <span className="text-[10px] text-slate-400 block">
                  GSTIN: {storeData.settings.gstin || '27AAAAA0000A1Z5'}
                </span>
                <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px] uppercase">
                  डिलिव्हरी चलान / गेट-पास (DELIVERY CHALLAN)
                </span>
              </div>

              <div className="text-[11px] space-y-1 mb-3">
                <div><strong>ग्राहक:</strong> {customerName || '—'} ({customerPhone})</div>
                <div><strong>डिलिव्हरी पत्ता:</strong> {deliveryAddress || '—'}</div>
                <div><strong>वाहन क्र:</strong> <span className="font-mono text-emerald-400 font-bold">{vehicleNo}</span></div>
                <div><strong>चालक:</strong> {driverName} ({driverPhone})</div>
                {ewayBillNo && <div><strong>E-Way Bill:</strong> {ewayBillNo}</div>}
              </div>

              <div className="border-t border-b border-slate-700 py-2 mb-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">मालाचा तपशील:</span>
                {items.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-xs py-0.5">
                    <span>{it.itemName || '—'}</span>
                    <span className="font-mono font-bold">{it.qty} नग</span>
                  </div>
                ))}
              </div>

              <div className="pt-6 flex justify-between text-[10px] text-slate-400">
                <div className="text-center">
                  <div className="w-20 border-b border-slate-600 mb-1" />
                  <span>माल मिळणाऱ्याची सही</span>
                </div>
                <div className="text-center">
                  <div className="w-20 border-b border-slate-600 mb-1" />
                  <span>अधिकृत गेट-पास सही</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'list' && (
        <div
          className={`p-5 rounded-2xl border transition-all ${
            isDayMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0f172a] border-slate-800 shadow-xl'
          }`}
        >
          <h3 className="font-bold text-sm mb-4">पाठवलेली सर्व डिलिव्हरी चलान (Challan Dispatch History)</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className={`border-b ${isDayMode ? 'bg-slate-50 text-slate-700' : 'bg-slate-900/60 text-slate-300'}`}>
                <tr>
                  <th className="py-2.5 px-3">चलान क्र.</th>
                  <th className="py-2.5 px-3">तारीख व वेळ</th>
                  <th className="py-2.5 px-3">ग्राहक नाव</th>
                  <th className="py-2.5 px-3">पत्ता</th>
                  <th className="py-2.5 px-3">वाहन क्र.</th>
                  <th className="py-2.5 px-3">चालक</th>
                  <th className="py-2.5 px-3 text-center">वस्तू</th>
                  <th className="py-2.5 px-3 text-center">स्थिती</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {challans.length > 0 ? (
                  challans.map((ch) => (
                    <tr key={ch.id} className="hover:bg-slate-500/5">
                      <td className="py-2 px-3 font-mono font-bold text-emerald-400">{ch.challanNo}</td>
                      <td className="py-2 px-3 text-slate-400 font-mono">{ch.date} {ch.dispatchTime}</td>
                      <td className="py-2 px-3 font-medium">{ch.customerName}</td>
                      <td className="py-2 px-3 text-slate-400 truncate max-w-xs">{ch.deliveryAddress}</td>
                      <td className="py-2 px-3 font-mono font-bold">{ch.vehicleNo}</td>
                      <td className="py-2 px-3">{ch.driverName}</td>
                      <td className="py-2 px-3 text-center font-mono font-bold">{ch.items.length}</td>
                      <td className="py-2 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                          {ch.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      अद्याप कोणतीही डिलिव्हरी चलान नोंदवलेली नाहीत.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
