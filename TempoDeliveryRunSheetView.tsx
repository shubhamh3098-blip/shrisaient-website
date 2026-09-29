import React, { useState, useMemo } from 'react';
import {
  Truck,
  MapPin,
  Clock,
  CheckCircle2,
  Phone,
  User,
  Package,
  Calendar,
  AlertCircle,
  FileText,
  Search,
  Printer,
  Share2,
  Navigation,
  PenTool,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Plus
} from 'lucide-react';
import { StoreData, Transaction } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface TempoDeliveryRunSheetViewProps {
  storeData: StoreData;
}

export interface DeliveryRunItem {
  id: string;
  invoiceNo: string;
  customerName: string;
  phone: string;
  village: string;
  itemsSummary: string;
  vehicleNo: string;
  driverName: string;
  driverPhone: string;
  technicianName: string;
  status: 'Scheduled' | 'Out for Delivery' | 'Delivered' | 'Installation Complete';
  dispatchedAt: string;
  deliveredAt?: string;
  podReceiverName?: string;
  podNotes?: string;
  grandTotal: number;
  balanceDue: number;
}

export const TempoDeliveryRunSheetView: React.FC<TempoDeliveryRunSheetViewProps> = ({
  storeData,
}) => {
  const { isDayMode } = useTheme();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedDriverFilter, setSelectedDriverFilter] = useState<string>('All');

  // Selected delivery for POD (Proof of Delivery) Modal
  const [activePodItem, setActivePodItem] = useState<DeliveryRunItem | null>(null);
  const [receiverNameInput, setReceiverNameInput] = useState('');
  const [podNotesInput, setPodNotesInput] = useState('');
  const [collectedBalanceInput, setCollectedBalanceInput] = useState<number>(0);

  // New Delivery Dispatch Modal
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [newDispatchInvoice, setNewDispatchInvoice] = useState('');
  const [newDriver, setNewDriver] = useState('Ganesh Bawane (Tata Ace MH-32-T-4412)');
  const [newTechnician, setNewTechnician] = useState('Vinod Carpenter (Fitting Expert)');

  // Seeded / Stored Delivery Runs
  const [deliveries, setDeliveries] = useState<DeliveryRunItem[]>(() => {
    // Generate initial live runs from transactions
    const initialRuns: DeliveryRunItem[] = [
      {
        id: 'del-101',
        invoiceNo: 'INV-2026-1082',
        customerName: 'Gajananrao Deshmukh',
        phone: '98224 55102',
        village: 'Sawangi Meghe, Wardha',
        itemsSummary: 'Teakwood 3+1+1 Sofa Set + Glass Teapoy',
        vehicleNo: 'MH-32-T-4412 (Tata Ace Gold)',
        driverName: 'Ganesh Bawane',
        driverPhone: '94228 11902',
        technicianName: 'Vinod Carpenter (Fitting Specialist)',
        status: 'Out for Delivery',
        dispatchedAt: '2026-03-21 10:30 AM',
        grandTotal: 48500,
        balanceDue: 0,
      },
      {
        id: 'del-102',
        invoiceNo: 'INV-2026-1085',
        customerName: 'Rameshwarji Thakre',
        phone: '97664 12389',
        village: 'Deoli Road, Wardha',
        itemsSummary: 'Samsung 55" 4K UHD LED TV + Wall Mount Bracket',
        vehicleNo: 'MH-32-AA-9901 (Mahindra Bolero Pickup)',
        driverName: 'Sachin Madavi',
        driverPhone: '98220 44101',
        technicianName: 'Pravin Electrician (LED TV Installation)',
        status: 'Installation Complete',
        dispatchedAt: '2026-03-21 09:15 AM',
        deliveredAt: '2026-03-21 11:45 AM',
        podReceiverName: 'Rameshwar Thakre (Self)',
        podNotes: 'Wall mounting checked & demo given. Customer satisfied.',
        grandTotal: 52000,
        balanceDue: 0,
      },
      {
        id: 'del-103',
        invoiceNo: 'INV-2026-1089',
        customerName: 'Sau. Anita Patil',
        phone: '91755 88901',
        village: 'Seloo Town, Wardha',
        itemsSummary: 'Godrej 240L Double Door Refrigerator + Teak Diwan Bed (4x6)',
        vehicleNo: 'MH-32-T-4412 (Tata Ace Gold)',
        driverName: 'Ganesh Bawane',
        driverPhone: '94228 11902',
        technicianName: 'Vinod Carpenter',
        status: 'Scheduled',
        dispatchedAt: '2026-03-21 02:00 PM',
        grandTotal: 58000,
        balanceDue: 5000,
      },
      {
        id: 'del-104',
        invoiceNo: 'INV-2026-1077',
        customerName: 'Pramodrao Wankhede',
        phone: '87664 22910',
        village: 'Hinganghat Bypass, Wardha',
        itemsSummary: 'Steel Almirah (Heavy Gauge 3 Door) + Foam Mattress 5x6',
        vehicleNo: 'MH-32-AA-9901 (Mahindra Bolero Pickup)',
        driverName: 'Sachin Madavi',
        driverPhone: '98220 44101',
        technicianName: 'Akash Delivery Boy',
        status: 'Delivered',
        dispatchedAt: '2026-03-20 04:00 PM',
        deliveredAt: '2026-03-20 06:30 PM',
        podReceiverName: 'Sanjay Wankhede (Brother)',
        podNotes: 'Received in good condition on 1st floor.',
        grandTotal: 34500,
        balanceDue: 0,
      }
    ];
    return initialRuns;
  });

  // Filtered deliveries
  const filteredDeliveries = useMemo(() => {
    return deliveries.filter((d) => {
      const matchesSearch =
        d.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.village.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.phone.includes(searchQuery);

      const matchesStatus = statusFilter === 'All' || d.status === statusFilter;
      const matchesDriver = selectedDriverFilter === 'All' || d.driverName === selectedDriverFilter;

      return matchesSearch && matchesStatus && matchesDriver;
    });
  }, [deliveries, searchQuery, statusFilter, selectedDriverFilter]);

  // Handle Mark Delivered / Complete
  const handleSavePod = () => {
    if (!activePodItem) return;

    setDeliveries((prev) =>
      prev.map((d) => {
        if (d.id === activePodItem.id) {
          const nowStr = new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          return {
            ...d,
            status: 'Delivered',
            deliveredAt: nowStr,
            podReceiverName: receiverNameInput || d.customerName,
            podNotes: podNotesInput || 'Delivered safely with unboxing inspection.',
            balanceDue: Math.max(0, d.balanceDue - (collectedBalanceInput || 0)),
          };
        }
        return d;
      })
    );

    alert(`✅ Delivery Confirmed! POD recorded for ${activePodItem.customerName} (${activePodItem.invoiceNo}).`);
    setActivePodItem(null);
    setReceiverNameInput('');
    setPodNotesInput('');
    setCollectedBalanceInput(0);
  };

  // WhatsApp Driver Challan
  const handleShareDriverChallan = (d: DeliveryRunItem) => {
    const msg =
`🚚 *SHRI SAI ENTERPRISES, WARDHA - TEMPO DISPATCH CHALLAN* 🚚

Vehicle: *${d.vehicleNo}*
Driver: *${d.driverName}* (📞 ${d.driverPhone})
Technician: ${d.technicianName}

📋 *Customer Details:*
Name: *${d.customerName}*
Phone: *${d.phone}*
Address/Village: *${d.village}*
Bill Ref: *${d.invoiceNo}*

📦 *Items to Deliver:*
${d.itemsSummary}

💰 *Payment & Dues:*
Total Bill: ₹${d.grandTotal.toLocaleString('en-IN')}
Balance to Collect on Delivery: *₹${d.balanceDue.toLocaleString('en-IN')}*

_Please check all items carefully upon unboxing and obtain customer signature/acknowledgement._
📍 Main Road, Wardha. 📞 98220 11223`;

    const encoded = encodeURIComponent(msg);
    const phone = d.driverPhone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${phone ? '91' + phone : ''}?text=${encoded}`, '_blank');
  };

  // WhatsApp Customer Delivery Notice
  const handleShareCustomerPod = (d: DeliveryRunItem) => {
    const msg =
`🎉 *SHRI SAI ENTERPRISES, WARDHA - OUT FOR DELIVERY NOTIFICATION* 🎉

Dear *${d.customerName}*,
Your ordered furniture/appliances are dispatched from our Wardha Showroom!

📦 Items: *${d.itemsSummary}*
🚚 Vehicle: *${d.vehicleNo}*
Driver: *${d.driverName}* (📞 ${d.driverPhone})
Technician for Fitting: *${d.technicianName}*
${d.balanceDue > 0 ? `💵 Cash to Pay on Delivery: *₹${d.balanceDue.toLocaleString('en-IN')}*` : '✅ Bill Fully Paid'}

Our tempo will reach your address (${d.village}) shortly.
Thank you for choosing Shri Sai Enterprises! 📞 98220 11223`;

    const encoded = encodeURIComponent(msg);
    const phone = d.phone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${phone ? '91' + phone : ''}?text=${encoded}`, '_blank');
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className={`p-4 sm:p-5 rounded-2xl border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
        isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/20">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight">
                Tempo Delivery & Installation Run-Sheet
              </h1>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30">
                Challan + POD
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live tempo dispatch for Teakwood furniture & electronics, driver run-sheets, and digital Proof-of-Delivery
            </p>
          </div>
        </div>

        {/* Quick Stats Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Out: {deliveries.filter(d => d.status === 'Out for Delivery').length}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Delivered: {deliveries.filter(d => d.status === 'Delivered' || d.status === 'Installation Complete').length}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Strip */}
      <div className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
        isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Customer, Bill No, Village/Area or Mobile..."
            className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs border focus:outline-none focus:border-sky-500 ${
              isDayMode ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
            }`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`px-3 py-2 rounded-xl border font-bold ${
              isDayMode ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
            }`}
          >
            <option value="All">All Statuses</option>
            <option value="Scheduled">Scheduled (नियोजित)</option>
            <option value="Out for Delivery">Out for Delivery (रस्त्यावर)</option>
            <option value="Delivered">Delivered (पोहोचले)</option>
            <option value="Installation Complete">Installation Complete (फिटिंग पूर्ण)</option>
          </select>

          <select
            value={selectedDriverFilter}
            onChange={(e) => setSelectedDriverFilter(e.target.value)}
            className={`px-3 py-2 rounded-xl border font-bold ${
              isDayMode ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
            }`}
          >
            <option value="All">All Drivers (सर्व ड्रायव्हर)</option>
            <option value="Ganesh Bawane">Ganesh Bawane (Tata Ace)</option>
            <option value="Sachin Madavi">Sachin Madavi (Bolero)</option>
          </select>
        </div>
      </div>

      {/* Deliveries Run Sheet Table */}
      <div className={`rounded-2xl border overflow-hidden shadow-xs ${
        isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                isDayMode ? 'bg-slate-50 text-slate-500 border-slate-200' : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}>
                <th className="p-3">Challan / Bill</th>
                <th className="p-3">Customer & Destination</th>
                <th className="p-3">Furniture / Electronics Items</th>
                <th className="p-3">Vehicle & Driver</th>
                <th className="p-3 text-right">Balance Due</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Actions & POD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredDeliveries.map((del) => {
                const isDelivered = del.status === 'Delivered' || del.status === 'Installation Complete';
                return (
                  <tr
                    key={del.id}
                    className={`hover:bg-slate-500/5 transition ${
                      del.status === 'Out for Delivery' ? 'bg-amber-500/5' : ''
                    }`}
                  >
                    <td className="p-3">
                      <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
                        {del.invoiceNo}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {del.dispatchedAt}
                      </div>
                    </td>

                    <td className="p-3">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {del.customerName}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <MapPin className="w-3 h-3 text-red-500" />
                        <span>{del.village}</span>
                        <span>•</span>
                        <span>{del.phone}</span>
                      </div>
                    </td>

                    <td className="p-3 max-w-xs">
                      <p className="font-medium text-slate-800 dark:text-slate-200 line-clamp-2">
                        {del.itemsSummary}
                      </p>
                      {del.technicianName && (
                        <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 font-semibold flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          <span>Fitter: {del.technicianName}</span>
                        </div>
                      )}
                    </td>

                    <td className="p-3">
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        {del.driverName}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {del.vehicleNo}
                      </div>
                    </td>

                    <td className="p-3 text-right">
                      {del.balanceDue > 0 ? (
                        <span className="font-mono font-black text-rose-600 dark:text-rose-400 text-xs">
                          ₹{del.balanceDue.toLocaleString('en-IN')}
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          Paid
                        </span>
                      )}
                    </td>

                    <td className="p-3 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide inline-flex items-center gap-1 ${
                          del.status === 'Installation Complete'
                            ? 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30'
                            : del.status === 'Delivered'
                            ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                            : del.status === 'Out for Delivery'
                            ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 animate-pulse'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {del.status === 'Out for Delivery' && <Truck className="w-3 h-3" />}
                        {del.status === 'Delivered' && <CheckCircle2 className="w-3 h-3" />}
                        {del.status === 'Installation Complete' && <Sparkles className="w-3 h-3" />}
                        <span>{del.status}</span>
                      </span>

                      {del.deliveredAt && (
                        <div className="text-[10px] text-slate-400 mt-1">
                          {del.deliveredAt}
                        </div>
                      )}
                    </td>

                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* WhatsApp to Driver */}
                        <button
                          type="button"
                          onClick={() => handleShareDriverChallan(del)}
                          className="p-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 border border-sky-500/30 cursor-pointer"
                          title="Share Challan with Driver on WhatsApp"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>

                        {/* WhatsApp to Customer */}
                        <button
                          type="button"
                          onClick={() => handleShareCustomerPod(del)}
                          className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 border border-emerald-500/30 cursor-pointer"
                          title="Notify Customer via WhatsApp"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </button>

                        {/* Mark Delivered Modal */}
                        {!isDelivered ? (
                          <button
                            type="button"
                            onClick={() => {
                              setActivePodItem(del);
                              setReceiverNameInput(del.customerName);
                              setCollectedBalanceInput(del.balanceDue);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer shadow-xs"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>POD</span>
                          </button>
                        ) : (
                          <span className="text-[11px] font-bold text-slate-400 px-1">
                            Done
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Proof of Delivery (POD) Modal */}
      {activePodItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className={`w-full max-w-md rounded-2xl border p-5 space-y-4 shadow-2xl ${
            isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <h3 className="text-base font-bold">Proof of Delivery (POD)</h3>
              </div>
              <button
                type="button"
                onClick={() => setActivePodItem(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-500/10 space-y-1 text-xs">
              <div className="font-bold text-slate-900 dark:text-white">
                {activePodItem.customerName} ({activePodItem.invoiceNo})
              </div>
              <div className="text-slate-500">{activePodItem.itemsSummary}</div>
              <div className="text-sky-500 font-medium">Destination: {activePodItem.village}</div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1 text-slate-600 dark:text-slate-400">
                  Receiver Name (वस्तू स्वीकारणाऱ्या व्यक्तीचे नाव):
                </label>
                <input
                  type="text"
                  value={receiverNameInput}
                  onChange={(e) => setReceiverNameInput(e.target.value)}
                  placeholder="उदा. Gajanan Deshmukh (Self / Family)"
                  className={`w-full p-2.5 rounded-xl border font-bold ${
                    isDayMode ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                />
              </div>

              {activePodItem.balanceDue > 0 && (
                <div>
                  <label className="block font-bold mb-1 text-slate-600 dark:text-slate-400">
                    Cash Collected by Driver (ड्रायव्हरकडे जमा झालेली शिल्लक रक्कम):
                  </label>
                  <input
                    type="number"
                    value={collectedBalanceInput}
                    onChange={(e) => setCollectedBalanceInput(Number(e.target.value))}
                    className={`w-full p-2.5 rounded-xl border font-mono font-black text-emerald-600 ${
                      isDayMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700'
                    }`}
                  />
                </div>
              )}

              <div>
                <label className="block font-bold mb-1 text-slate-600 dark:text-slate-400">
                  Inspection / Fitting Note (तपासणी व इन्स्टॉलेशन शेरा):
                </label>
                <textarea
                  rows={2}
                  value={podNotesInput}
                  onChange={(e) => setPodNotesInput(e.target.value)}
                  placeholder="उदा. माल सुस्थितीत मिळाला, स्क्रॅच नाही, सोफा व टीव्ही चालू करून पाहिला."
                  className={`w-full p-2 rounded-xl border text-xs ${
                    isDayMode ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setActivePodItem(null)}
                className="px-4 py-2 rounded-xl border text-xs font-bold text-slate-500 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePod}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm Delivery</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
