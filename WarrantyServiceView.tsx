import React, { useState, useMemo } from 'react';
import {
  Wrench,
  ShieldCheck,
  Calendar,
  Search,
  MessageCircle,
  AlertTriangle,
  Clock,
  Phone,
  User,
  Tv,
  CheckCircle2,
  Sparkles,
  Printer
} from 'lucide-react';
import { StoreData, Transaction, WarrantyServiceReminder } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface WarrantyServiceViewProps {
  storeData: StoreData;
  onRefreshData?: () => void;
}

export const WarrantyServiceView: React.FC<WarrantyServiceViewProps> = ({
  storeData,
  onRefreshData,
}) => {
  const { isDayMode } = useTheme();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [remindedIds, setRemindedIds] = useState<Set<string>>(new Set());

  // Extract all warranty items from transactions
  const warrantyList = useMemo(() => {
    const list: WarrantyServiceReminder[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    storeData.transactions.forEach((tx) => {
      tx.items.forEach((item, idx) => {
        // Find stock item if available to get warranty months
        const stockItem = storeData.stock.find((s) => s.id === item.stockId || s.name === item.name);
        const warrantyMonths = stockItem?.warrantyMonths || 12; // default 1 year

        const saleDate = new Date(tx.date);
        const expiryDate = new Date(saleDate);
        expiryDate.setMonth(expiryDate.getMonth() + warrantyMonths);

        // Preventive service due at 6 months or 1 month before expiry
        const serviceDueDate = new Date(saleDate);
        serviceDueDate.setMonth(serviceDueDate.getMonth() + Math.max(6, warrantyMonths - 1));

        const diffTime = expiryDate.getTime() - today.getTime();
        const daysToExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let status: WarrantyServiceReminder['status'] = 'Active';
        if (daysToExpiry < 0) {
          status = 'Expired';
        } else if (daysToExpiry <= 30) {
          status = 'Expiring Soon';
        }

        list.push({
          id: `${tx.id}-${idx}`,
          transactionId: tx.id,
          invoiceNo: tx.invoiceNo,
          customerId: tx.customerId,
          customerName: tx.customerName,
          customerPhone: tx.customerPhone,
          productName: item.name,
          brand: item.brand,
          serialNo: item.serialNo,
          saleDate: tx.date.split('T')[0],
          warrantyMonths,
          expiryDate: expiryDate.toISOString().split('T')[0],
          serviceDueDate: serviceDueDate.toISOString().split('T')[0],
          status,
        });
      });
    });

    return list;
  }, [storeData.transactions, storeData.stock]);

  const filteredList = useMemo(() => {
    return warrantyList.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.customerName.toLowerCase().includes(q) ||
          item.customerPhone.includes(q) ||
          item.productName.toLowerCase().includes(q) ||
          item.invoiceNo.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [warrantyList, statusFilter, searchQuery]);

  const expiringCount = warrantyList.filter((w) => w.status === 'Expiring Soon').length;
  const activeCount = warrantyList.filter((w) => w.status === 'Active').length;

  const handleSendReminder = (w: WarrantyServiceReminder) => {
    setRemindedIds((prev) => new Set(prev).add(w.id));
    const message = `नमस्कार ${w.customerName}जी! 🌟 श्री साई इंटरप्रायजेस, वर्धा कडून सस्नेह नमस्कार.\n\nआपण आमच्या दुकानातून खरेदी केलेल्या *${w.productName}* (${w.brand}) ची कंपनी वॉरंटी *${w.expiryDate}* रोजी समाप्त होत आहे.\n\nआपल्या उपकरणाच्या उत्तम देखभालीसाठी व सुरळीत कार्यासाठी आमच्याकडे *मोफत सर्व्हिस चेकअप व ऑइलिंग* उपलब्ध आहे. काही अडचण असल्यास कृपया दुकानाशी संपर्क साधावा.\n\n📍 पत्ता: श्री साई इंटरप्रायजेस, आर्वी रोड, वर्धा\n📞 संपर्क: 7822859073`;
    const url = `https://wa.me/91${w.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className={`p-5 rounded-2xl border transition-colors ${
        isDayMode
          ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border-emerald-200'
          : 'bg-gradient-to-r from-[#162723] via-[#17232a] to-[#171e2c] border-emerald-500/20'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase bg-emerald-600 text-white mb-1.5 shadow-sm">
              <Wrench className="w-3.5 h-3.5" /> वॉरंटी व सर्व्हिसिंग स्मरणपत्र
            </div>
            <h1 className="text-xl sm:text-2xl font-black font-playfair tracking-tight text-slate-900 dark:text-white">
              Warranty & Free Service Expiry Reminder
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              टीव्ही, फ्रीज, कुलर मोटर, वॉशिंग मशीन वॉरंटी संपण्याआधी ग्राहकाला शुभेच्छा व मोफत सर्व्हिस चेकअप संदेश पाठवून विश्वास दृढ करा.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-400 text-slate-950 shadow-sm flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{expiringCount} उत्पादनांची वॉरंटी ३० दिवसांत समाप्त</span>
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`p-4 rounded-2xl border shadow-sm ${
          isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <span className="text-xs font-bold text-slate-500 block">सक्रिय वॉरंटी उत्पादने (Active)</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-emerald-600 tabular-nums">
              {activeCount} वस्तू
            </span>
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
          </div>
        </div>

        <div className={`p-4 rounded-2xl border shadow-sm ${
          isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <span className="text-xs font-bold text-slate-500 block">वॉरंटी लवकरच समाप्त (Expiring Soon)</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-amber-500 tabular-nums">
              {expiringCount} ग्राहक
            </span>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
        </div>

        <div className={`p-4 rounded-2xl border shadow-sm ${
          isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <span className="text-xs font-bold text-slate-500 block">पाठवलेले सर्व्हिस स्मरणपत्र</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-blue-600 tabular-nums">
              {remindedIds.size} पाठवले
            </span>
            <MessageCircle className="w-5 h-5 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={`p-4 rounded-2xl border shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 ${
        isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="w-full sm:w-80 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="ग्राहक नाव, फोन, बिल क्र. किंवा उत्पादन शोधा..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs font-medium border outline-none ${
              isDayMode ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-slate-700 text-white'
            }`}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={`px-3 py-2 rounded-xl text-xs font-bold border outline-none cursor-pointer w-full sm:w-auto ${
            isDayMode ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
          }`}
        >
          <option value="all">सर्व स्थिती (All)</option>
          <option value="Expiring Soon">वॉरंटी लवकरच समाप्त (Expiring in 30 Days)</option>
          <option value="Active">सक्रिय वॉरंटी (Active)</option>
          <option value="Expired">समाप्त (Expired)</option>
        </select>
      </div>

      {/* Warranty Records Table */}
      <div className={`rounded-2xl border shadow-sm overflow-hidden ${
        isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 font-bold">
                <th className="py-3 px-3">बिल क्र.</th>
                <th className="py-3 px-3">ग्राहक नाव</th>
                <th className="py-3 px-3">मोबाईल</th>
                <th className="py-3 px-3">वस्तू / उत्पादन</th>
                <th className="py-3 px-3">खरेदी तारीख</th>
                <th className="py-3 px-3">वॉरंटी समाप्ती तारीख</th>
                <th className="py-3 px-3">स्थिती</th>
                <th className="py-3 px-3 text-center">१-क्लिक सर्व्हिस व्हॉट्सॲप</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredList.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                  <td className="py-3 px-3 font-mono font-bold text-blue-600">
                    {item.invoiceNo}
                  </td>
                  <td className="py-3 px-3 font-extrabold text-slate-900 dark:text-white">
                    {item.customerName}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-500">
                    {item.customerPhone}
                  </td>
                  <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-200">
                    {item.productName} ({item.brand})
                  </td>
                  <td className="py-3 px-3 text-slate-500 font-mono">
                    {item.saleDate}
                  </td>
                  <td className="py-3 px-3 font-bold font-mono text-amber-600">
                    {item.expiryDate}
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                      item.status === 'Expiring Soon'
                        ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40'
                        : item.status === 'Active'
                        ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}>
                      {item.status === 'Expiring Soon' ? '३० दिवसांत समाप्त' : item.status === 'Active' ? 'सक्रिय' : 'समाप्त'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => handleSendReminder(item)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-[11px] shadow-sm transition active:scale-95 cursor-pointer ${
                        remindedIds.has(item.id)
                          ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      }`}
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>{remindedIds.has(item.id) ? 'पुन्हा पाठवा' : 'सर्व्हिस मेसेज पाठवा'}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
