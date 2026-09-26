import React, { useState, useMemo } from 'react';
import {
  Truck,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Plus,
  FileText,
  Building2,
  DollarSign,
  AlertTriangle,
  X,
  MessageCircle,
  Search,
  Filter
} from 'lucide-react';
import { StoreData, DealerPdcCheque, Dealer } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface DealerPdcTrackerViewProps {
  storeData: StoreData;
  onRefreshData?: () => void;
}

export const DealerPdcTrackerView: React.FC<DealerPdcTrackerViewProps> = ({
  storeData,
  onRefreshData,
}) => {
  const { isDayMode } = useTheme();

  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Initial demo PDC cheques if none exist in storeData
  const defaultCheques: DealerPdcCheque[] = useMemo(() => {
    if (storeData.dealerCheques && storeData.dealerCheques.length > 0) {
      return storeData.dealerCheques;
    }
    const today = new Date();
    const addDays = (d: number) => {
      const dt = new Date(today);
      dt.setDate(dt.getDate() + d);
      return dt.toISOString().split('T')[0];
    };

    return [
      {
        id: 'pdc-1',
        dealerId: 'dlr-1',
        dealerName: 'LG Electronics India Pvt Ltd',
        chequeNumber: '741258',
        bankName: 'State Bank of India (SBI)',
        amount: 85000,
        issueDate: addDays(-20),
        dueDate: addDays(2), // Due in 2 days (ALERT!)
        status: 'Due in 3 Days',
        note: 'Smart TV 43" & 55" stock purchase invoice #LG-9021',
      },
      {
        id: 'pdc-2',
        dealerId: 'dlr-2',
        dealerName: 'Godrej & Boyce Mfg Co Ltd',
        chequeNumber: '369852',
        bankName: 'HDFC Bank, Wardha',
        amount: 62000,
        issueDate: addDays(-15),
        dueDate: addDays(1), // Due tomorrow (ALERT!)
        status: 'Due in 3 Days',
        note: 'Direct Cool & Double Door Refrigerators consignment',
      },
      {
        id: 'pdc-3',
        dealerId: 'dlr-3',
        dealerName: 'Chandrapur Sagwan Teak Timber Depot',
        chequeNumber: '159753',
        bankName: 'Bank of Maharashtra',
        amount: 45000,
        issueDate: addDays(-25),
        dueDate: addDays(12),
        status: 'Upcoming',
        note: 'Solid Teak Wood logs for sofa frame manufacturing',
      },
      {
        id: 'pdc-4',
        dealerId: 'dlr-4',
        dealerName: 'Voltas Cooling Systems Ltd',
        chequeNumber: '852147',
        bankName: 'Axis Bank',
        amount: 38000,
        issueDate: addDays(-35),
        dueDate: addDays(-5),
        status: 'Cleared',
        note: 'Heavy Desert Coolers and spare motors batch',
      },
    ];
  }, [storeData.dealerCheques]);

  const [cheques, setCheques] = useState<DealerPdcCheque[]>(defaultCheques);

  // New Cheque Form state
  const [newDealerId, setNewDealerId] = useState<string>('');
  const [newChequeNumber, setNewChequeNumber] = useState<string>('');
  const [newBankName, setNewBankName] = useState<string>('State Bank of India');
  const [newAmount, setNewAmount] = useState<string>('');
  const [newDueDate, setNewDueDate] = useState<string>('');
  const [newNote, setNewNote] = useState<string>('');

  // Calculate days remaining and update status dynamically
  const enrichedCheques = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return cheques.map((c) => {
      if (c.status === 'Cleared' || c.status === 'Bounced') {
        return c;
      }
      const due = new Date(c.dueDate);
      due.setHours(0, 0, 0, 0);
      const diffTime = due.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let updatedStatus = c.status;
      if (diffDays < 0) {
        updatedStatus = 'Overdue';
      } else if (diffDays === 0) {
        updatedStatus = 'Due Today';
      } else if (diffDays <= 3) {
        updatedStatus = 'Due in 3 Days';
      } else {
        updatedStatus = 'Upcoming';
      }

      return {
        ...c,
        daysRemaining: diffDays,
        status: updatedStatus as DealerPdcCheque['status'],
      };
    });
  }, [cheques]);

  // Alert cheques (Due in <= 3 days or Overdue)
  const urgentAlerts = enrichedCheques.filter(
    (c) => c.status === 'Due in 3 Days' || c.status === 'Due Today' || c.status === 'Overdue'
  );

  const filteredCheques = enrichedCheques.filter((c) => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.dealerName.toLowerCase().includes(q) ||
        c.chequeNumber.toLowerCase().includes(q) ||
        c.bankName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Handle Mark Cleared
  const handleMarkCleared = (id: string) => {
    const updated = cheques.map((c) => (c.id === id ? { ...c, status: 'Cleared' as const } : c));
    setCheques(updated);
    storeData.dealerCheques = updated;
    try {
      localStorage.setItem('sse_store_data', JSON.stringify(storeData));
    } catch (e) {
      console.error(e);
    }
  };

  // Add Cheque
  const handleAddCheque = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDealerId || !newChequeNumber || !newAmount || !newDueDate) return;

    const dealer = storeData.dealers.find((d) => d.id === newDealerId);
    const dealerName = dealer ? dealer.companyName || dealer.name : 'डीलर';

    const newEntry: DealerPdcCheque = {
      id: `pdc-${Date.now()}`,
      dealerId: newDealerId,
      dealerName,
      chequeNumber: newChequeNumber,
      bankName: newBankName,
      amount: parseFloat(newAmount) || 0,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: newDueDate,
      status: 'Upcoming',
      note: newNote,
    };

    const updated = [newEntry, ...cheques];
    setCheques(updated);
    storeData.dealerCheques = updated;
    try {
      localStorage.setItem('sse_store_data', JSON.stringify(storeData));
    } catch (err) {
      console.error(err);
    }

    setIsAddModalOpen(false);
    setNewChequeNumber('');
    setNewAmount('');
    setNewDueDate('');
    setNewNote('');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className={`p-5 rounded-2xl border transition-colors ${
        isDayMode
          ? 'bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 border-blue-200'
          : 'bg-gradient-to-r from-[#171f33] via-[#1a2138] to-[#151c2d] border-blue-500/20'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase bg-blue-600 text-white mb-1.5 shadow-sm">
              <Truck className="w-3.5 h-3.5" /> डीलर देय तारीख व चेक ट्रॅकर
            </div>
            <h1 className="text-xl sm:text-2xl font-black font-playfair tracking-tight text-slate-900 dark:text-white">
              Wholesaler Payment Due & Cheque/PDC Alert System
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              होलसेलरचे पेमेंट व बँकेतील पोस्ट-डेटेड चेक (PDC) वटण्याआधी ३ दिवस आधी पूर्वसूचना व सतर्कता.
            </p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-1.5 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>नवीन चेक / PDC नोंदवा</span>
          </button>
        </div>
      </div>

      {/* 3-Day Advance Urgent Alerts Box */}
      {urgentAlerts.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 text-amber-900 dark:text-amber-200 space-y-3 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 animate-pulse" />
            <h3 className="text-sm font-black">
              ⚠️ आगामी ३ दिवसांत देय असणारे चेक व पेमेंट सतर्कता ({urgentAlerts.length} व्यवहार)
            </h3>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            पुढील चेक नजीकच्या १ ते ३ दिवसांत बँकेत सादर होणार आहेत. खात्यात पुरेशी रक्कम (Balance) असल्याची खात्री करा जेणेकरून चेक बाऊन्स होणार नाही व सप्लायरसोबतची पत उत्तम राहील.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {urgentAlerts.map((c) => (
              <div
                key={c.id}
                className={`p-3 rounded-xl border bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between ${
                  c.status === 'Due Today'
                    ? 'border-rose-500 ring-2 ring-rose-500/20'
                    : 'border-amber-400'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                      {c.dealerName}
                    </span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      c.status === 'Due Today'
                        ? 'bg-rose-500 text-white'
                        : 'bg-amber-400 text-slate-950'
                    }`}>
                      {c.status === 'Due Today' ? 'आज देय (Today)' : `३ दिवसांत देय (${c.daysRemaining}d)`}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    चेक क्र.: <span className="font-mono font-bold text-slate-700 dark:text-slate-200">#{c.chequeNumber}</span> • {c.bankName}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-base font-black text-rose-600 tabular-nums">
                    ₹{c.amount.toLocaleString('en-IN')}
                  </span>
                  <button
                    onClick={() => handleMarkCleared(c.id)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow-sm transition active:scale-95 cursor-pointer flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>वटला (Clear)</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className={`p-4 rounded-2xl border shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 ${
        isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="w-full sm:w-80 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="डीलर, चेक क्र. किंवा बँक शोधा..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs font-medium border outline-none ${
              isDayMode ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-slate-700 text-white'
            }`}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border outline-none cursor-pointer w-full sm:w-auto ${
              isDayMode ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
            }`}
          >
            <option value="all">सर्व चेक (All Status)</option>
            <option value="Due in 3 Days">३ दिवसांत देय (Due in 3 Days)</option>
            <option value="Due Today">आज देय (Due Today)</option>
            <option value="Upcoming">आगामी (Upcoming)</option>
            <option value="Cleared">वटलेले (Cleared)</option>
            <option value="Overdue">मुदत संपलेले (Overdue)</option>
          </select>
        </div>
      </div>

      {/* All Cheques List Table */}
      <div className={`rounded-2xl border shadow-sm overflow-hidden ${
        isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-black text-sm text-slate-900 dark:text-white">
            डीलर चेक व देय तारखा यादी ({filteredCheques.length} रेकॉर्ड्स)
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 font-bold">
                <th className="py-3 px-3">डीलर / कंपनी</th>
                <th className="py-3 px-3">चेक क्र.</th>
                <th className="py-3 px-3">बँक</th>
                <th className="py-3 px-3 text-right">रक्कम</th>
                <th className="py-3 px-3">जारी तारीख</th>
                <th className="py-3 px-3">देय तारीख (Maturity)</th>
                <th className="py-3 px-3">स्थिती</th>
                <th className="py-3 px-3 text-center">कृती</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredCheques.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                  <td className="py-3 px-3 font-extrabold text-slate-900 dark:text-white">
                    {c.dealerName}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                    #{c.chequeNumber}
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                    {c.bankName}
                  </td>
                  <td className="py-3 px-3 text-right font-black text-slate-900 dark:text-white tabular-nums">
                    ₹{c.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 text-slate-500 font-mono">
                    {c.issueDate}
                  </td>
                  <td className="py-3 px-3 font-bold font-mono text-amber-600">
                    {c.dueDate}
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                      c.status === 'Cleared'
                        ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30'
                        : c.status === 'Due in 3 Days'
                        ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40'
                        : c.status === 'Due Today'
                        ? 'bg-rose-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    {c.status !== 'Cleared' && (
                      <button
                        onClick={() => handleMarkCleared(c.id)}
                        className="px-2 py-1 rounded bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-700 dark:bg-slate-800 dark:hover:bg-emerald-900/40 text-[11px] font-bold border border-slate-300 dark:border-slate-700 transition cursor-pointer"
                      >
                        क्लियर करा
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Cheque Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-2xl border shadow-2xl p-5 space-y-4 ${
            isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                नवीन डीलर चेक / PDC जोडा
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleAddCheque} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  होलसेल डीलर निवडा:
                </label>
                <select
                  required
                  value={newDealerId}
                  onChange={(e) => setNewDealerId(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border font-bold outline-none ${
                    isDayMode ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                >
                  <option value="">-- डीलर निवडा --</option>
                  {storeData.dealers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.companyName || d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    चेक नंबर:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="उदा. 458921"
                    value={newChequeNumber}
                    onChange={(e) => setNewChequeNumber(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border outline-none font-mono ${
                      isDayMode ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    रक्कम (₹):
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="उदा. 50000"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border outline-none font-bold ${
                      isDayMode ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    बँक नाव:
                  </label>
                  <input
                    type="text"
                    required
                    value={newBankName}
                    onChange={(e) => setNewBankName(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border outline-none ${
                      isDayMode ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    देय तारीख (Maturity Date):
                  </label>
                  <input
                    type="date"
                    required
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border outline-none font-mono cursor-pointer ${
                      isDayMode ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  नोंद किंवा मालाचा तपशील (Note):
                </label>
                <input
                  type="text"
                  placeholder="उदा. टीव्ही व फ्रिज कन्साईनमेंट पेमेंट..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border outline-none ${
                    isDayMode ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
                >
                  रद्द करा
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold shadow-md cursor-pointer"
                >
                  चेक सेव्ह करा
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
