import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Search,
  Lock,
  Unlock,
  TrendingUp,
  TrendingDown,
  UserCheck,
  Users,
  Sparkles,
  ArrowRight,
  Filter
} from 'lucide-react';
import { StoreData, Customer, CustomerCreditScore } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { StorageService } from '../../services/storageService';

interface CustomerCreditRiskShieldViewProps {
  storeData: StoreData;
  onRefreshData?: () => void;
}

export const CustomerCreditRiskShieldView: React.FC<CustomerCreditRiskShieldViewProps> = ({
  storeData,
  onRefreshData,
}) => {
  const { isDayMode } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [blockedCustomers, setBlockedCustomers] = useState<Record<string, boolean>>({});

  // Compute 360 Credit Scores for all customers
  const evaluatedCustomers: (CustomerCreditScore & { phone: string; balance: number; totalPurchased: number })[] = useMemo(() => {
    return storeData.customers.map((c) => {
      let score = 700; // Base baseline
      const factors: string[] = [];

      // 1. Overdue balance factor
      if (c.currentBalance > 25000) {
        score -= 180;
        factors.push('₹२५,००० हून अधिक उधारी प्रलंबित');
      } else if (c.currentBalance > 10000) {
        score -= 90;
        factors.push('₹१०,००० हून अधिक उधारी बाकी');
      } else if (c.currentBalance === 0) {
        score += 80;
        factors.push('शून्य उधारी - १००% वेळेवर भरणा');
      }

      // 2. Lifetime purchases factor
      if ((c.totalPurchased || 0) > 50000) {
        score += 100;
        factors.push('उच्च मूल्याचा निष्ठावान ग्राहक (₹५०,०००+ खरेदी)');
      } else if ((c.totalPurchased || 0) > 20000) {
        score += 40;
        factors.push('नियमित खरेदीदार');
      }

      // 3. Scheme Member check (active scheme installments)
      const linkedCard = storeData.cardMembers.find(
        (m) => m.phone === c.phone || m.memberName.toLowerCase() === c.name.toLowerCase()
      );
      if (linkedCard) {
        if (linkedCard.status === 'Active' && (linkedCard.totalPaidMonths || 0) >= 6) {
          score += 60;
          factors.push('३०-महिने बचत योजनेचे नियमित सभासद');
        } else if (linkedCard.status === 'Active' && (linkedCard.totalAmountPaid || 0) === 0) {
          score -= 50;
          factors.push('योजना हप्ता वेळेवर भरला नाही');
        }
      }

      // Bound score between 300 and 900
      const finalScore = Math.max(300, Math.min(900, score));

      let grade: CustomerCreditScore['grade'] = 'A Good';
      let maxCredit = 30000;

      if (finalScore >= 780) {
        grade = 'A+ Elite';
        maxCredit = 60000;
      } else if (finalScore >= 680) {
        grade = 'A Good';
        maxCredit = 35000;
      } else if (finalScore >= 580) {
        grade = 'B Fair';
        maxCredit = 15000;
      } else if (finalScore >= 480) {
        grade = 'C Watchlist';
        maxCredit = 8000;
      } else {
        grade = 'High Risk';
        maxCredit = 0;
      }

      const isBlocked = blockedCustomers[c.id] !== undefined ? blockedCustomers[c.id] : grade === 'High Risk';

      return {
        customerId: c.id,
        customerName: c.name,
        phone: c.phone,
        balance: c.currentBalance,
        totalPurchased: c.totalPurchased || 0,
        score: finalScore,
        grade,
        factors,
        maxCreditAllowed: maxCredit,
        isCreditBlocked: isBlocked,
      };
    });
  }, [storeData.customers, storeData.cardMembers, blockedCustomers]);

  // Toggle Blocked Status
  const handleToggleBlock = (customerId: string) => {
    setBlockedCustomers((prev) => ({
      ...prev,
      [customerId]: !prev[customerId],
    }));
  };

  // Filtered List
  const filteredList = useMemo(() => {
    return evaluatedCustomers.filter((c) => {
      const matchesSearch =
        !searchQuery.trim() ||
        c.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery);

      const matchesGrade = filterGrade === 'all' || c.grade.includes(filterGrade);
      return matchesSearch && matchesGrade;
    });
  }, [evaluatedCustomers, searchQuery, filterGrade]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div
        className={`p-4 sm:p-6 rounded-2xl border transition-all ${
          isDayMode
            ? 'bg-gradient-to-r from-rose-50 via-amber-50 to-orange-50 border-rose-200 text-slate-800 shadow-sm'
            : 'bg-gradient-to-r from-[#210c14] via-[#1a0f18] to-[#121624] border-rose-500/30 text-white shadow-xl'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black tracking-wider uppercase bg-rose-500 text-white">
                Risk Management
              </span>
              <span className="text-xs text-rose-400 font-semibold flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                ग्राहक ३६०° क्रेडिट स्कोअर व उधारी रिस्क शील्ड
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              ग्राहक ३६०° क्रेडिट ट्रस्ट स्कोअर व डिफेन्स शील्ड (Credit Score & Risk Shield)
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-300 mt-1">
              उधारी वसुलीचा वेग, योजना हप्त्यांची नियमितता यावर आधारित ग्राहकांचा क्रेडिट स्कोअर (३०० ते ९००) आणि हाय-रिस्क डिफॉल्टर्सना ब्लॉक करण्याची सुविधा.
            </p>
          </div>
        </div>
      </div>

      {/* Top 4 Risk Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          className={`p-4 rounded-2xl border ${
            isDayMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0f172a] border-slate-800 shadow-lg'
          }`}
        >
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">
            🟢 A+ / A विश्वासू ग्राहक (Low Risk)
          </span>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {evaluatedCustomers.filter((c) => c.score >= 680).length} ग्राहक
          </div>
          <p className="text-xs text-slate-400 mt-1">वेळेवर पैसे भरणारे • सुरक्षित खाते</p>
        </div>

        <div
          className={`p-4 rounded-2xl border ${
            isDayMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0f172a] border-slate-800 shadow-lg'
          }`}
        >
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">
            🟡 B मध्यम रिस्क (Moderate Risk)
          </span>
          <div className="text-2xl font-black text-amber-400 font-mono">
            {evaluatedCustomers.filter((c) => c.score >= 580 && c.score < 680).length} ग्राहक
          </div>
          <p className="text-xs text-slate-400 mt-1">२०% ॲडव्हान्स आवश्यक</p>
        </div>

        <div
          className={`p-4 rounded-2xl border ${
            isDayMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0f172a] border-slate-800 shadow-lg'
          }`}
        >
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">
            🔴 हाय-रिस्क ग्राहक (High Risk / Watchlist)
          </span>
          <div className="text-2xl font-black text-rose-400 font-mono">
            {evaluatedCustomers.filter((c) => c.score < 580).length} ग्राहक
          </div>
          <p className="text-xs text-slate-400 mt-1">उधारी देण्यास बंदी किंवा सावधगिरी</p>
        </div>

        <div
          className={`p-4 rounded-2xl border ${
            isDayMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0f172a] border-slate-800 shadow-lg'
          }`}
        >
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">
            🔒 उधारी ब्लॉक केलेले (Credit Blocked)
          </span>
          <div className="text-2xl font-black text-rose-500 font-mono">
            {evaluatedCustomers.filter((c) => c.isCreditBlocked).length} खाती
          </div>
          <p className="text-xs text-slate-400 mt-1">अ‍ॅडमिन मंजुरीशिवाय बिल बनणार नाही</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          {['all', 'A+', 'A', 'B', 'C', 'High Risk'].map((gr) => (
            <button
              key={gr}
              onClick={() => setFilterGrade(gr)}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer border ${
                filterGrade === gr
                  ? 'bg-rose-600 text-white border-rose-500'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              {gr === 'all' ? 'सर्व ग्राहक' : `ग्रेड ${gr}`}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="नाव किंवा फोन नंबर शोधा..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border text-xs bg-black/5 dark:bg-black/30 border-slate-700 outline-none"
          />
        </div>
      </div>

      {/* Directory Table */}
      <div
        className={`p-5 rounded-2xl border transition-all ${
          isDayMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0f172a] border-slate-800 shadow-xl'
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className={`border-b ${isDayMode ? 'bg-slate-50 text-slate-700' : 'bg-slate-900/60 text-slate-300'}`}>
              <tr>
                <th className="py-2.5 px-3">ग्राहक नाव</th>
                <th className="py-2.5 px-3">मोबाईल</th>
                <th className="py-2.5 px-3 text-right">सध्याची उधारी</th>
                <th className="py-2.5 px-3 text-center">क्रेडिट स्कोअर</th>
                <th className="py-2.5 px-3 text-center">ग्रेड व पात्रता</th>
                <th className="py-2.5 px-3">विश्लेषण घटक (Risk Factors)</th>
                <th className="py-2.5 px-3 text-center">उधारी स्थिती</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredList.map((cust) => (
                <tr key={cust.customerId} className="hover:bg-slate-500/5">
                  <td className="py-2.5 px-3 font-bold text-white">{cust.customerName}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-400">{cust.phone}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-400">
                    ₹{cust.balance.toLocaleString('en-IN')}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-mono font-black ${
                        cust.score >= 680
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : cust.score >= 580
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      }`}
                    >
                      {cust.score} / 900
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="font-bold text-[11px] block">{cust.grade}</span>
                    <span className="text-[10px] text-slate-500 font-mono">मर्यादा: ₹{cust.maxCreditAllowed.toLocaleString('en-IN')}</span>
                  </td>
                  <td className="py-2.5 px-3 text-[11px] text-slate-400">
                    {cust.factors.join(' • ')}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={() => handleToggleBlock(cust.customerId)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1 mx-auto ${
                        cust.isCreditBlocked
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {cust.isCreditBlocked ? (
                        <>
                          <Lock className="w-3 h-3" />
                          <span>ब्लॉक (Blocked)</span>
                        </>
                      ) : (
                        <>
                          <Unlock className="w-3 h-3 text-emerald-400" />
                          <span>सक्रिय (Active)</span>
                        </>
                      )}
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
