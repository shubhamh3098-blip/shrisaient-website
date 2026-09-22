import React, { useState, useEffect } from 'react';
import {
  Truck,
  Plus,
  Search,
  Printer,
  Share2,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  Calendar,
  X,
  User,
  PackageCheck
} from 'lucide-react';
import { CardMember, CardPrizeDeliveryChallan, BusinessSettings } from '../types';

interface DeliveryChallanModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardMembers: CardMember[];
  settings: BusinessSettings;
  initialMember?: CardMember | null;
}

const STORAGE_CHALLANS_KEY = 'shri_sai_card_delivery_challans';

export const DeliveryChallanModal: React.FC<DeliveryChallanModalProps> = ({
  isOpen,
  onClose,
  cardMembers,
  settings,
  initialMember,
}) => {
  const [challans, setChallans] = useState<CardPrizeDeliveryChallan[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_CHALLANS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChallanToPrint, setSelectedChallanToPrint] = useState<CardPrizeDeliveryChallan | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form states
  const [selectedCardNo, setSelectedCardNo] = useState<number>(initialMember?.cardNumber || 0);
  const [customerName, setCustomerName] = useState(initialMember?.customerName || '');
  const [customerPhone, setCustomerPhone] = useState(initialMember?.phone || '');
  const [village, setVillage] = useState(initialMember?.village || '');
  const [deliveryAddress, setDeliveryAddress] = useState(initialMember?.address || initialMember?.village || 'Wardha');
  const [schemeType, setSchemeType] = useState<'Scheme Complete (30 Months)' | 'Lucky Draw Winner'>('Scheme Complete (30 Months)');
  const [itemsDelivered, setItemsDelivered] = useState('');
  const [modelNumber, setModelNumber] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [deliveredByStaff, setDeliveredByStaff] = useState('Shri Sai Delivery Team');
  const [agentName, setAgentName] = useState(initialMember?.agentName || '');
  const [vehicleNumber, setVehicleNumber] = useState('MH-32-');
  const [status, setStatus] = useState<'Delivered' | 'In Transit' | 'Pending Delivery'>('Delivered');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (initialMember) {
      setSelectedCardNo(initialMember.cardNumber);
      setCustomerName(initialMember.customerName);
      setCustomerPhone(initialMember.phone || '');
      setVillage(initialMember.village || '');
      setDeliveryAddress(initialMember.address || initialMember.village || 'Wardha');
      setAgentName(initialMember.agentName || '');
      setIsCreating(true);
    }
  }, [initialMember]);

  const handleSelectMember = (cardNo: number) => {
    setSelectedCardNo(cardNo);
    const m = cardMembers.find((item) => item.cardNumber === cardNo);
    if (m) {
      setCustomerName(m.customerName);
      setCustomerPhone(m.phone || '');
      setVillage(m.village || '');
      setDeliveryAddress(m.address || m.village || 'Wardha');
      setAgentName(m.agentName || '');
    }
  };

  const handleSaveChallan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !itemsDelivered) {
      alert('कृपया ग्राहकाचे नाव आणि दिलेल्या वस्तूचे नाव भरा.');
      return;
    }

    const challanNo = `CH-${Date.now().toString().slice(-5)}`;
    const newChallan: CardPrizeDeliveryChallan = {
      id: `ch-${Date.now()}`,
      challanNo,
      date: new Date().toISOString().split('T')[0],
      cardNumber: Number(selectedCardNo) || 0,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      village: village.trim(),
      deliveryAddress: deliveryAddress.trim(),
      schemeType,
      itemsDelivered: itemsDelivered.trim(),
      modelNumber: modelNumber.trim(),
      serialNumber: serialNumber.trim(),
      deliveredByStaff: deliveredByStaff.trim(),
      agentName: agentName.trim(),
      vehicleNumber: vehicleNumber.trim(),
      status,
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
    };

    const updated = [newChallan, ...challans];
    setChallans(updated);
    localStorage.setItem(STORAGE_CHALLANS_KEY, JSON.stringify(updated));

    setIsCreating(false);
    setSelectedChallanToPrint(newChallan);
  };

  const handleShareWhatsApp = (ch: CardPrizeDeliveryChallan) => {
    const text = encodeURIComponent(
      `*${settings.businessName || 'SHRI SAI ENTERPRISES, WARDHA'}*\n` +
      `*🚚 अधिकृत वस्तू वितरण पावती (Delivery Challan)*\n` +
      `--------------------------------\n` +
      `चलन क्र: *#${ch.challanNo}*\n` +
      `तारीख: *${ch.date}*\n` +
      `कार्ड नंबर: *#${ch.cardNumber}*\n` +
      `ग्राहक: *${ch.customerName}*\n` +
      (ch.village ? `गाव: *${ch.village}*\n` : '') +
      `वितरण प्रकार: *${ch.schemeType}*\n` +
      `--------------------------------\n` +
      `🎁 *वितरित केलेल्या वस्तू / बक्षीस:*\n` +
      `👉 *${ch.itemsDelivered}*\n` +
      (ch.modelNumber ? `मॉडेल क्र.: ${ch.modelNumber}\n` : '') +
      (ch.serialNumber ? `अनुक्रमांक (Serial No): ${ch.serialNumber}\n` : '') +
      `--------------------------------\n` +
      `डिलिव्हरी स्टेटस: *${ch.status === 'Delivered' ? '✅ यशस्वीरित्या पोहचवले' : '⏳ डिलिव्हरी सुरू आहे'}*\n` +
      (ch.agentName ? `एजंट: ${ch.agentName}\n` : '') +
      (ch.deliveredByStaff ? `डिलिव्हरी कर्मचारी: ${ch.deliveredByStaff}\n` : '') +
      `--------------------------------\n` +
      `_मोफत होम डिलिव्हरीसह वर्धा जिल्ह्यातील अग्रगण्य दालन!_\n` +
      `📞 संपर्क: 8766486915 / 8600122798\n` +
      `_श्री साई इंटरप्राइजेस, आर्वी रोड, पंजाब कॉलनी, वर्धा_`
    );
    const phone = ch.customerPhone ? ch.customerPhone.replace(/[^0-9]/g, '') : '';
    const url = phone ? `https://wa.me/91${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredChallans = challans.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.customerName.toLowerCase().includes(q) ||
      c.challanNo.toLowerCase().includes(q) ||
      c.village.toLowerCase().includes(q) ||
      c.cardNumber.toString().includes(q) ||
      c.itemsDelivered.toLowerCase().includes(q)
    );
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Top Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-slate-950 shadow-md">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                बक्षीस / वस्तू वितरण चलन (Prize & Delivery Challan)
              </h2>
              <p className="text-xs text-slate-400">
                ३० महिने योजना पूर्ण झाल्यावर किंवा लकी ड्रॉ विजेत्याला वस्तू देताना अधिकृत डिलिव्हरी पावती व ट्रॅकर
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Action Ribbon */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="नाव, कार्ड नं, गाव किंवा चलन नंबर शोधा..."
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              type="button"
              onClick={() => setIsCreating(!isCreating)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md"
            >
              {isCreating ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{isCreating ? 'फॉर्म बंद करा' : '+ नवीन डिलिव्हरी चलन बनवा'}</span>
            </button>
          </div>

          {/* Creation Form */}
          {isCreating && (
            <form onSubmit={handleSaveChallan} className="bg-slate-950/90 border border-amber-500/40 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-bold text-sm text-amber-400 flex items-center gap-2">
                  <PackageCheck className="w-4 h-4" />
                  नवीन वस्तू वितरण चलन नोंदणी (New Delivery Record)
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">
                  तारीख: {new Date().toISOString().split('T')[0]}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    कार्ड नंबर निवडा (Card No)
                  </label>
                  <select
                    value={selectedCardNo}
                    onChange={(e) => handleSelectMember(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono font-bold text-amber-400"
                  >
                    <option value={0}>-- कार्ड निवडा किंवा मॅन्युअल नाव लिहा --</option>
                    {cardMembers.map((m) => (
                      <option key={m.id} value={m.cardNumber}>
                        #{m.cardNumber} - {m.customerName} ({m.village || 'Wardha'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    ग्राहकाचे नाव (Customer Name) *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="उदा. राहुल देशमुख"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    मोबाईल नंबर (Phone)
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="१० अंकी नंबर"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    गाव / पत्ता (Village / Address)
                  </label>
                  <input
                    type="text"
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    placeholder="उदा. Kelzar, Wardha"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    वितरणाचे कारण (Delivery Reason)
                  </label>
                  <select
                    value={schemeType}
                    onChange={(e) => setSchemeType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                  >
                    <option value="Scheme Complete (30 Months)">योजना पूर्ण (30 Months Complete)</option>
                    <option value="Lucky Draw Winner">लकी ड्रॉ विजेता (Lucky Draw Winner)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    कलेक्शन एजंट (Agent)
                  </label>
                  <input
                    type="text"
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    placeholder="उदा. Nilesh Deshmukh"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  दिलेली वस्तू / अप्लायन्स / फर्निचर नाव (Delivered Items) *
                </label>
                <input
                  type="text"
                  required
                  value={itemsDelivered}
                  onChange={(e) => setItemsDelivered(e.target.value)}
                  placeholder="उदा. LG 43-inch 4K Smart TV + 70L Heavy Desert Cooler"
                  className="w-full px-3 py-2.5 bg-slate-900 border border-amber-500/50 rounded-xl text-xs font-bold text-amber-300"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    मॉडेल क्र. (Model No)
                  </label>
                  <input
                    type="text"
                    value={modelNumber}
                    onChange={(e) => setModelNumber(e.target.value)}
                    placeholder="उदा. 43UQ7500"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    अनुक्रमांक (Serial No)
                  </label>
                  <input
                    type="text"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    placeholder="उदा. 304INRD8991"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    गाडी नंबर (Vehicle No)
                  </label>
                  <input
                    type="text"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    placeholder="उदा. MH-32-Q-4521"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    डिलिव्हरी स्टेटस (Status)
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-bold"
                  >
                    <option value="Delivered">Delivered (वस्तू सुपूर्द केली)</option>
                    <option value="In Transit">In Transit (रस्त्यात आहे)</option>
                    <option value="Pending Delivery">Pending (प्रलंबित)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
                >
                  रद्द करा
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-lg"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  चलन सेव्ह व प्रिंट करा (Save & Print)
                </button>
              </div>
            </form>
          )}

          {/* Printable Preview of Selected Challan */}
          {selectedChallanToPrint && (
            <div className="bg-white text-slate-950 p-6 rounded-2xl border-2 border-amber-500 shadow-2xl relative space-y-4">
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
                <div>
                  <h3 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                    {settings.businessName || 'SHRI SAI ENTERPRISES'}
                  </h3>
                  <p className="text-xs text-slate-700 font-medium">
                    इलेक्ट्रॉनिक्स व फर्निचरचे भव्य दालन • आर्वी रोड, पंजाब कॉलनी, वर्धा • फोन: 8766486915 / 8600122798
                  </p>
                </div>
                <div className="text-right">
                  <span className="px-3 py-1 bg-amber-100 text-amber-900 font-black rounded-lg text-xs border border-amber-300">
                    DELIVERY CHALLAN
                  </span>
                  <p className="text-xs font-mono font-bold mt-1">
                    चलन क्र: #{selectedChallanToPrint.challanNo}
                  </p>
                  <p className="text-xs text-slate-600">
                    तारीख: {selectedChallanToPrint.date}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <p className="text-slate-500">ग्राहक तपशील (Customer Details):</p>
                  <p className="text-sm font-bold text-slate-900">{selectedChallanToPrint.customerName}</p>
                  <p className="text-slate-700">गाव / पत्ता: {selectedChallanToPrint.village || selectedChallanToPrint.deliveryAddress}</p>
                  <p className="text-slate-700">फोन: {selectedChallanToPrint.customerPhone || 'N/A'}</p>
                  <p className="font-bold text-blue-700">बचत कार्ड क्र: #{selectedChallanToPrint.cardNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-500">डिलिव्हरी प्रकार:</p>
                  <p className="text-xs font-bold text-emerald-800">{selectedChallanToPrint.schemeType}</p>
                  <p className="text-slate-700">वाहन क्र.: {selectedChallanToPrint.vehicleNumber || 'Shri Sai Van'}</p>
                  <p className="text-slate-700">एजंट: {selectedChallanToPrint.agentName || 'Shop'}</p>
                  <p className="text-xs font-bold text-slate-800 mt-1">
                    स्टेटस: <span className="text-emerald-600">✓ {selectedChallanToPrint.status}</span>
                  </p>
                </div>
              </div>

              <div className="border border-slate-300 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 font-bold border-b border-slate-300 text-slate-800">
                    <tr>
                      <th className="p-2.5">अ.क्र.</th>
                      <th className="p-2.5">वितरित केलेल्या वस्तूचे तपशील (Item Description)</th>
                      <th className="p-2.5">मॉडेल व सिरीयल नं.</th>
                      <th className="p-2.5 text-right">प्रमाण (Qty)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="p-2.5 font-bold">1</td>
                      <td className="p-2.5">
                        <p className="font-bold text-sm text-slate-900">{selectedChallanToPrint.itemsDelivered}</p>
                        <p className="text-[11px] text-slate-600">श्री साई इंटरप्राइजेस योजनांतर्गत होम डिलिव्हरीसह सुपूर्द</p>
                      </td>
                      <td className="p-2.5 font-mono">
                        {selectedChallanToPrint.modelNumber && <div>Model: {selectedChallanToPrint.modelNumber}</div>}
                        {selectedChallanToPrint.serialNumber && <div>Sr: {selectedChallanToPrint.serialNumber}</div>}
                        {!selectedChallanToPrint.modelNumber && !selectedChallanToPrint.serialNumber && '-'}
                      </td>
                      <td className="p-2.5 text-right font-bold">1 Set</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-slate-700 leading-relaxed">
                <strong>हमी व स्वीकृती:</strong> मी वर उल्लेखित वस्तू संपूर्ण सुस्थितीत, नवीन व सिलबंद प्राप्त केल्या आहेत. डिलिव्हरीबाबत माझी कोणतीही तक्रार नाही.
              </div>

              <div className="pt-6 flex items-center justify-between text-xs font-bold border-t border-slate-300">
                <div className="text-center">
                  <div className="w-36 border-b border-slate-400 mb-1"></div>
                  <span>ग्राहकाची स्वाक्षरी (Customer Sign)</span>
                </div>
                <div className="text-center">
                  <div className="w-36 border-b border-slate-400 mb-1"></div>
                  <span>डिलिव्हरी कर्मचाऱ्याची सही</span>
                </div>
                <div className="text-center">
                  <div className="w-36 border-b border-slate-400 mb-1"></div>
                  <span>श्री साई एंटरप्रायझेस (अधिकृत शिक्का)</span>
                </div>
              </div>

              {/* Action buttons inside preview */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Printer className="w-4 h-4" />
                  प्रिंट काढा (Print Challan)
                </button>
                <button
                  type="button"
                  onClick={() => handleShareWhatsApp(selectedChallanToPrint)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Share2 className="w-4 h-4" />
                  WhatsApp पावती पाठवा
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedChallanToPrint(null)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  बंद करा
                </button>
              </div>
            </div>
          )}

          {/* List of Previous Delivery Challans */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              मागील वस्तू वितरण इतिहास ({filteredChallans.length} Challans)
            </h3>

            {filteredChallans.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800 text-slate-500 text-xs">
                कोणतीही डिलिव्हरी चलन सापडले नाही. नवीन चलन तयार करण्यासाठी वरच्या बटणावर क्लिक करा.
              </div>
            ) : (
              <div className="divide-y divide-slate-800 bg-slate-950/50 rounded-2xl border border-slate-800 overflow-hidden">
                {filteredChallans.map((ch) => (
                  <div
                    key={ch.id}
                    className="p-3.5 hover:bg-slate-800/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-amber-400">#{ch.challanNo}</span>
                        <span className="font-bold text-white text-sm">{ch.customerName}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-900/50 text-blue-300 border border-blue-700">
                          कार्ड #{ch.cardNumber}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                          {ch.status}
                        </span>
                      </div>
                      <p className="text-slate-300 font-semibold mt-1">
                        🎁 {ch.itemsDelivered}
                      </p>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5 flex-wrap">
                        <span>📍 {ch.village || 'Wardha'}</span>
                        <span>📅 {ch.date}</span>
                        {ch.agentName && <span>👤 एजंट: {ch.agentName}</span>}
                        {ch.serialNumber && <span>🔢 अनुक्रमांक: {ch.serialNumber}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setSelectedChallanToPrint(ch)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5 text-blue-400" />
                        <span>पावती</span>
                      </button>
                      <button
                        onClick={() => handleShareWhatsApp(ch)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-900/40 hover:bg-emerald-900/70 text-emerald-300 border border-emerald-700 font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
