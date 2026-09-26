import React, { useState, useMemo } from 'react';
import {
  Award,
  Users,
  Coins,
  Gift,
  Share2,
  CheckCircle2,
  Search,
  Sparkles,
  ArrowRight,
  TrendingUp,
  MessageCircle,
  ShieldCheck,
  Percent
} from 'lucide-react';
import { StoreData, Customer, CardMember, CustomerLoyaltyRecord } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { StorageService } from '../../services/storageService';

interface CustomerLoyaltyReferralViewProps {
  storeData: StoreData;
  onRefreshData?: () => void;
}

export const CustomerLoyaltyReferralView: React.FC<CustomerLoyaltyReferralViewProps> = ({
  storeData,
  onRefreshData,
}) => {
  const { isDayMode } = useTheme();

  const [activeTab, setActiveTab] = useState<'loyalty' | 'referrals'>('loyalty');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [redeemPoints, setRedeemPoints] = useState<string>('100');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Referral states
  const [referringCardNo, setReferringCardNo] = useState<string>('');
  const [referredFriendName, setReferredFriendName] = useState<string>('');
  const [referredFriendPhone, setReferredFriendPhone] = useState<string>('');

  // Auto-generate loyalty records from customer purchases if not already existing
  const loyaltyRecords = useMemo(() => {
    if (storeData.loyaltyRecords && storeData.loyaltyRecords.length > 0) {
      return storeData.loyaltyRecords;
    }
    // Calculate synthetic points from customer purchases (1 point per ₹100 spent)
    return storeData.customers.map((c) => {
      const earned = Math.floor((c.totalPurchased || 5000) / 100);
      return {
        customerId: c.id,
        customerName: c.name,
        pointsBalance: Math.max(50, earned),
        totalEarned: Math.max(50, earned),
        totalRedeemed: 0,
        referralCount: 1,
      };
    });
  }, [storeData.customers, storeData.loyaltyRecords]);

  // Filtered loyalty records
  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return loyaltyRecords;
    const q = searchQuery.toLowerCase();
    return loyaltyRecords.filter((r) => r.customerName.toLowerCase().includes(q));
  }, [loyaltyRecords, searchQuery]);

  // Total points in circulation
  const totalPointsInCirculation = useMemo(() => {
    return loyaltyRecords.reduce((acc, r) => acc + r.pointsBalance, 0);
  }, [loyaltyRecords]);

  // Handle Redeem Points
  const handleRedeemPoints = () => {
    const pts = parseInt(redeemPoints) || 0;
    if (pts <= 0 || !selectedCustomerId) return;

    const record = loyaltyRecords.find((r) => r.customerId === selectedCustomerId);
    if (!record || record.pointsBalance < pts) {
      alert('ग्राहकाकडे पुरेशी कॉइन्स शिल्लक नाहीत!');
      return;
    }

    const updatedRecords = loyaltyRecords.map((r) => {
      if (r.customerId === selectedCustomerId) {
        return {
          ...r,
          pointsBalance: r.pointsBalance - pts,
          totalRedeemed: r.totalRedeemed + pts,
        };
      }
      return r;
    });

    const updatedData: StoreData = {
      ...storeData,
      loyaltyRecords: updatedRecords,
    };

    StorageService.saveData(updatedData);
    setSuccessMsg(`₹${pts} ची वजावट (Discount) यशस्वीरित्या लागू झाली!`);
    if (onRefreshData) onRefreshData();

    setSelectedCustomerId('');
    setRedeemPoints('100');
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // WhatsApp Referral Invite
  const handleSendReferralWhatsApp = () => {
    if (!referredFriendPhone.trim()) return;

    const card = storeData.cardMembers.find((m) => m.cardNo === referringCardNo);
    const referrerName = card ? card.memberName : 'श्री साई ग्राहक';

    let msg = `*श्री साई एंटरप्रायझेस, वर्धा - ३० महिने बचत योजना रेफरल ऑफर!*\n\n`;
    msg += `नमस्कार ${referredFriendName.trim() || 'मित्रा'},\n`;
    msg += `आमचे सन्माननीय कार्ड सभासद *${referrerName}* यांनी तुम्हाला वर्ध्यातील सर्वात लोकप्रिय "३०-महिने साप्ताहिक बचत व लकी ड्रॉ योजनेसाठी" आमंत्रित केले आहे!\n\n`;
    msg += `✨ *योजनेचे मुख्य फायदे:*\n`;
    msg += `• दर आठवड्याला फक्त ₹१०० किंवा ₹२०० बचत करा\n`;
    msg += `• दरमहा पारदर्शक लकी ड्रॉ मध्ये नाव लागल्यास वस्तू लगेच घरी आणि पुढील सर्व हप्ते १००% मोफत!\n`;
    msg += `• ड्रॉ न लागल्यास ३० महिन्यांनी पूर्ण जमा रकमेचे फर्निचर किंवा इलेक्ट्रॉनिक्स हमखास हमी!\n`;
    msg += `• रेफरल स्पेशल: नवीन नोंदणीवर ₹५० ची विशेष सूट!\n\n`;
    msg += `📍 पत्ता: मातोश्री सभागृह समोर, आर्वी रोड, पंजाब कॉलनी, वर्धा\n`;
    msg += `📞 संपर्क: 8766486915 / 8600122978\n`;

    const cleanPhone = referredFriendPhone.replace(/[^0-9]/g, '');
    const url = `https://wa.me/91${cleanPhone.slice(-10)}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div
        className={`p-4 sm:p-6 rounded-2xl border transition-all ${
          isDayMode
            ? 'bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 border-amber-200 text-slate-800 shadow-sm'
            : 'bg-gradient-to-r from-[#211807] via-[#1a140b] to-[#121624] border-amber-500/30 text-white shadow-xl'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black tracking-wider uppercase bg-amber-500 text-slate-950">
                VIP Rewards Pro
              </span>
              <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
                <Coins className="w-3.5 h-3.5" />
                साई रिवॉर्ड कॉइन्स व रेफरल बोनस
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              ग्राहक लॉयल्टी कॉइन्स व रेफरल हब (Customer Loyalty & Referral Engine)
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-300 mt-1">
              नियमित खरेदीदार व बचत योजना सभासदांना रिवॉर्ड कॉइन्स द्या आणि नवीन ग्राहक जोडण्यासाठी रेफरल बोनस चालवा.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-right">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">एकूण सक्रिय रिवॉर्ड कॉइन्स</span>
            <span className="text-2xl font-black font-mono text-amber-400">
              🪙 {totalPointsInCirculation.toLocaleString('en-IN')}
            </span>
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
          onClick={() => setActiveTab('loyalty')}
          className={`flex-1 py-2 px-4 rounded-lg transition cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'loyalty' ? 'bg-amber-600 text-slate-950 font-black shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>साई रिवॉर्ड कॉइन्स व रिडेम्प्शन (Loyalty Points & Redeem)</span>
        </button>

        <button
          onClick={() => setActiveTab('referrals')}
          className={`flex-1 py-2 px-4 rounded-lg transition cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'referrals' ? 'bg-amber-600 text-slate-950 font-black shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Gift className="w-4 h-4" />
          <span>३०-महिने योजना रेफरल बोनस (Referral Bonus & WhatsApp Invite)</span>
        </button>
      </div>

      {/* TAB 1: LOYALTY POINTS & REDEEM */}
      {activeTab === 'loyalty' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Redeem Action Form */}
          <div className="lg:col-span-5 space-y-4">
            <div
              className={`p-5 rounded-2xl border transition-all ${
                isDayMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0f172a] border-slate-800 shadow-xl'
              }`}
            >
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2 text-amber-400">
                <Coins className="w-4 h-4" />
                <span>काऊंटरवर कॉइन्स वजा करा (Redeem Discount)</span>
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                १ साई कॉइन = ₹१ थेट डिस्काउंट. ग्राहकाच्या बिलातून कॉइन्स वजा करण्यासाठी खालील फॉर्म वापरा.
              </p>

              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">ग्राहक निवडा:</label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-xs bg-black/5 dark:bg-black/30 border-slate-300 dark:border-slate-700 outline-none"
                  >
                    <option value="" className="bg-slate-900">-- ग्राहक निवडा --</option>
                    {loyaltyRecords.map((r) => (
                      <option key={r.customerId} value={r.customerId} className="bg-slate-900 text-white">
                        {r.customerName} (शिल्लक कॉइन्स: 🪙 {r.pointsBalance})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">वजा करावयाची कॉइन्स (₹ Discount):</label>
                  <input
                    type="number"
                    value={redeemPoints}
                    onChange={(e) => setRedeemPoints(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-mono font-bold text-amber-400 bg-black/5 dark:bg-black/30 border-slate-300 dark:border-slate-700 outline-none"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleRedeemPoints}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>कॉइन्स वजा करून डिस्काउंट द्या (Apply Discount)</span>
              </button>
            </div>
          </div>

          {/* Customers Points Directory */}
          <div className="lg:col-span-7">
            <div
              className={`p-5 rounded-2xl border transition-all ${
                isDayMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0f172a] border-slate-800 shadow-xl'
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
                <h4 className="font-bold text-sm">ग्राहकांचे लॉयल्टी कॉइन्स खाते (Customer Coin Wallets)</h4>
                <div className="relative w-48">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="नाव शोधा..."
                    className="w-full pl-8 pr-2 py-1 rounded-lg border text-xs bg-black/5 dark:bg-black/30 border-slate-700 outline-none"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className={`border-b ${isDayMode ? 'bg-slate-50 text-slate-700' : 'bg-slate-900/60 text-slate-300'}`}>
                    <tr>
                      <th className="py-2.5 px-3">ग्राहक</th>
                      <th className="py-2.5 px-3 text-right">एकूण जमवलेले</th>
                      <th className="py-2.5 px-3 text-right">वापरलेले</th>
                      <th className="py-2.5 px-3 text-right">शिल्लक कॉइन्स</th>
                      <th className="py-2.5 px-3 text-center">रेफरल्स</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {filteredRecords.map((rec) => (
                      <tr key={rec.customerId} className="hover:bg-slate-500/5">
                        <td className="py-2 px-3 font-medium">{rec.customerName}</td>
                        <td className="py-2 px-3 text-right font-mono text-slate-400">🪙 {rec.totalEarned}</td>
                        <td className="py-2 px-3 text-right font-mono text-rose-400">🪙 {rec.totalRedeemed}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-amber-400">🪙 {rec.pointsBalance}</td>
                        <td className="py-2 px-3 text-center font-mono">{rec.referralCount || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REFERRAL BONUS & WHATSAPP INVITE */}
      {activeTab === 'referrals' && (
        <div className="space-y-6">
          <div
            className={`p-5 rounded-2xl border transition-all ${
              isDayMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0f172a] border-slate-800 shadow-xl'
            }`}
          >
            <h3 className="font-bold text-sm mb-1 flex items-center gap-2 text-amber-400">
              <Gift className="w-4 h-4" />
              <span>३०-महिने योजना मित्र रेफरल आमंत्रण (Send Scheme Invite via WhatsApp)</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              चालू कार्ड सभासदाच्या नावे त्याच्या मित्राला किंवा नातेवाईकाला व्हॉट्सॲपवर आकर्षक आमंत्रण पाठवा.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  रेफर करणारा कार्ड सभासद (Existing Member):
                </label>
                <select
                  value={referringCardNo}
                  onChange={(e) => setReferringCardNo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border text-xs bg-black/5 dark:bg-black/30 border-slate-300 dark:border-slate-700 outline-none"
                >
                  <option value="" className="bg-slate-900">-- कार्ड निवडा --</option>
                  {storeData.cardMembers.slice(0, 50).map((m) => (
                    <option key={m.id} value={m.cardNo} className="bg-slate-900 text-white">
                      कार्ड #{m.cardNo} - {m.memberName} ({m.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">मित्राचे नाव (Friend Name):</label>
                <input
                  type="text"
                  value={referredFriendName}
                  onChange={(e) => setReferredFriendName(e.target.value)}
                  placeholder="उदा. अमित देशमुख"
                  className="w-full px-3 py-2 rounded-xl border text-xs bg-black/5 dark:bg-black/30 border-slate-300 dark:border-slate-700 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">मित्राचा WhatsApp नंबर:</label>
                <input
                  type="text"
                  value={referredFriendPhone}
                  onChange={(e) => setReferredFriendPhone(e.target.value)}
                  placeholder="98XXXXXXXX"
                  className="w-full px-3 py-2 rounded-xl border text-xs font-mono bg-black/5 dark:bg-black/30 border-slate-300 dark:border-slate-700 outline-none"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleSendReferralWhatsApp}
              className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>व्हॉट्सॲपवर आमंत्रण पाठवा (Send WhatsApp Invite)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
