import React, { useMemo } from 'react';
import {
  X,
  Building,
  MapPin,
  Users,
  CreditCard,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { Customer, StoreData } from '../../types';

interface TownViewModalProps {
  storeData: StoreData;
  onClose: () => void;
  onSelectTown: (townName: string) => void;
}

export const TownViewModal: React.FC<TownViewModalProps> = ({
  storeData,
  onClose,
  onSelectTown,
}) => {
  // Group customers by town / village
  const townStats = useMemo(() => {
    const map = new Map<string, { count: number; totalPurchases: number; totalDues: number }>();

    storeData.customers.forEach((c) => {
      let town = (c.city || 'Wardha').trim();
      if (!town && c.address) {
        town = c.address.split(',')[0].trim();
      }
      if (!town) town = 'Other / Unknown';

      const existing = map.get(town) || { count: 0, totalPurchases: 0, totalDues: 0 };
      existing.count += 1;
      existing.totalPurchases += c.totalPurchased;
      existing.totalDues += c.currentBalance;
      map.set(town, existing);
    });

    return Array.from(map.entries()).sort((a, b) => b[1].count - a[1].count);
  }, [storeData.customers]);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="p-4 md:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">टाऊन व गाववार विश्लेषण (Town Breakdown)</h3>
              <p className="text-[11px] text-slate-400">गावानुसार ग्राहक संख्या, खरेदी आणि उर्वरित उधारी सारांश.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 md:p-6 overflow-y-auto space-y-3 flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {townStats.map(([town, stats]) => (
              <div
                key={town}
                onClick={() => {
                  onSelectTown(town);
                  onClose();
                }}
                className="p-3.5 bg-slate-950/80 border border-slate-800 hover:border-amber-500/50 rounded-xl cursor-pointer transition group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold text-white text-sm flex items-center gap-1.5 group-hover:text-amber-400 transition">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    <span>{town}</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                    {stats.count} ग्राहक
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
                  <div>
                    <span className="text-slate-400 text-[10px]">एकूण खरेदी: </span>
                    <span className="font-semibold text-slate-200">₹{stats.totalPurchases.toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px]">उधारी: </span>
                    <span className={`font-bold ${stats.totalDues > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {stats.totalDues > 0 ? `₹${stats.totalDues.toLocaleString('en-IN')}` : 'Cleared'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 bg-slate-950 border-t border-slate-800 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg"
          >
            बंद करा
          </button>
        </div>
      </div>
    </div>
  );
};
