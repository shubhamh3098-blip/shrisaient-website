import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Trophy,
  Sparkles,
  Gift,
  Play,
  RotateCcw,
  CheckCircle2,
  Printer,
  Share2,
  Calendar,
  Award,
  Crown,
  Building2,
  Volume2,
  VolumeX,
  Layers,
  Filter,
  Users,
  Search,
  Check,
  Phone,
  MapPin,
  TrendingUp,
  Percent,
  Calculator,
  Flame,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Package,
  Boxes,
  X,
  Undo2,
  Tag,
  Edit3,
  Save,
  SlidersHorizontal
} from 'lucide-react';
import { StoreData, CardMember, StockItem } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { StorageService } from '../../services/storageService';
import { SCHEME_CONFIGS, getSchemeConfig } from '../../utils/schemeUtils';

interface DigitalLuckyDrawMachineViewProps {
  storeData: StoreData;
  onRefreshData?: () => void;
}

// Default 30-Month Prize Schedule if not yet customized
const DEFAULT_MONTHLY_PRIZES: Record<number, string> = {
  1: 'Smart 4K UHD LED TV 43" (किंमत ₹३२,९९०)',
  2: 'Whirlpool 190L Direct-Cool Refrigerator (किंमत ₹१८,९९०)',
  3: 'Front-Load Fully Automatic Washing Machine (किंमत ₹२४,५००)',
  4: 'Godrej 3-Door Teak Wood Wardrobe / कपाट (किंमत ₹२१,०००)',
  5: 'Prestige 4-Jar Mixer Grinder + Induction (किंमत ₹८,५००)',
  6: '24K Gold Coin 1 Gram / सोन्याचे नाणे (किंमत ₹८,०००)',
  7: 'Bajaj 20L Grill Microwave Oven (किंमत ₹९,९९०)',
  8: 'Sagwan Teakwood Diwan Bed 3x6 (किंमत ₹१६,५००)',
  9: 'Voltas 1.5 Ton Split Inverter AC (किंमत ₹३६,५००)',
  10: 'Sagwan Double Bed 6x6 with Storage (किंमत ₹३४,०००)',
  11: 'Symphony Heavy Room Air Cooler 70L (किंमत ₹१२,५००)',
  12: 'Samsung 50" Crystal 4K UHD TV (किंमत ₹४२,९९०)',
  13: 'Haier 258L Frost-Free Double Door Fridge (किंमत ₹२४,९००)',
  14: 'Sony 5.1ch Bluetooth Soundbar System (किंमत ₹१४,९९०)',
  15: 'L-Shape 6-Seater Luxury Sofa Set (किंमत ₹३८,०००)',
  16: 'Aquaguard RO+UV Water Purifier (किंमत ₹१६,५००)',
  17: 'Teakwood Dressing Table with Mirror (किंमत ₹१५,०००)',
  18: 'IFB 7kg Front Load Washing Machine (किंमत ₹२८,०००)',
  19: 'Prestige Gas Stove 3-Burner + Nonstick Set (किंमत ₹७,५००)',
  20: 'Godrej 2-Ton Inverter Split AC (किंमत ₹४४,०००)',
  21: 'Dining Table 4-Seater Teak Wood (किंमत ₹२२,०००)',
  22: 'Philips 50" Ultra HD 4K LED TV (किंमत ₹३८,०००)',
  23: 'Hero Splendor / EV Scooter Cash Subsidy ₹३५,०००',
  24: 'Whirlpool 265L Triple Door Refrigerator (किंमत ₹२९,०००)',
  25: 'Executive Office Table & Chair Set (किंमत ₹१८,०००)',
  26: 'Smart Tablet 10.5" Wi-Fi+LTE (किंमत ₹१९,५००)',
  27: 'Commercial Flour Mill / घरघंटी आटा चक्की (किंमत ₹१६,०००)',
  28: 'Bedsheet + Quilt Blanket VIP Set (किंमत ₹८,०००)',
  29: 'Prestige 5-Item Kitchen Appliance Combo (किंमत ₹१२,५००)',
  30: 'महा-बंपर: कार / सोन्याचा सेट डाऊनपेमेंट रोख ₹५१,०००',
};

export const DigitalLuckyDrawMachineView: React.FC<DigitalLuckyDrawMachineViewProps> = ({
  storeData,
  onRefreshData,
}) => {
  const { isDayMode } = useTheme();

  // Active Sub-Tab: 'draw' (मशीन) | 'schedule' (३० महिन्यांचे शेड्युल) | 'winners' (विजेते) | 'maturity' (मॅच्युरिटी)
  const [activeSubTab, setActiveSubTab] = useState<'draw' | 'schedule' | 'winners' | 'maturity'>('draw');

  // Scheme Filter: 'all' | 1 | 2 | 3
  const [selectedScheme, setSelectedScheme] = useState<'all' | number>(1);

  // Draw Configuration: Month
  const [drawMonth, setDrawMonth] = useState<number>(() => new Date().getMonth() + 1);

  // Prize Schedule mapping from store settings or defaults
  const monthlyPrizes = useMemo(() => {
    return {
      ...DEFAULT_MONTHLY_PRIZES,
      ...(storeData.settings?.monthlyDrawPrizes || {}),
    };
  }, [storeData.settings?.monthlyDrawPrizes]);

  // Modal to Edit Prize for a Specific Month
  const [editingPrizeMonth, setEditingPrizeMonth] = useState<number | null>(null);
  const [editPrizeText, setEditPrizeText] = useState<string>('');

  // Stock Item Search & Picker Modal
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const [targetStockMonth, setTargetStockMonth] = useState<number | null>(null);

  // Edit Winner Modal (विजेत्याचे बक्षीस बदलणे)
  const [editingWinner, setEditingWinner] = useState<CardMember | null>(null);
  const [editWinnerPrizeText, setEditWinnerPrizeText] = useState<string>('');

  // Machine Spinning State
  const [isSpinning, setIsSpinning] = useState(false);
  const [displayCardNo, setDisplayCardNo] = useState<string>('----');
  const [displayMemberName, setDisplayMemberName] = useState<string>('श्री साई एंटरप्रायजेस');
  const [displayVillage, setDisplayVillage] = useState<string>('वर्धा');
  const [winnerMember, setWinnerMember] = useState<CardMember | null>(null);
  const [showCertificate, setShowCertificate] = useState(false);
  const [showFullPhone, setShowFullPhone] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [alertMsg, setAlertMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  const spinIntervalRef = useRef<any>(null);

  // Winners Gallery Search & Filter
  const [winnersSearch, setWinnersSearch] = useState('');
  const [winnersSchemeFilter, setWinnersSchemeFilter] = useState<'all' | number>('all');

  // Maturity Tab Search
  const [maturitySearch, setMaturitySearch] = useState('');

  useEffect(() => {
    return () => {
      if (spinIntervalRef.current) {
        clearInterval(spinIntervalRef.current);
      }
    };
  }, []);

  const triggerAlert = (text: string, isError = false) => {
    setAlertMsg({ text, isError });
    setTimeout(() => setAlertMsg(null), 4000);
  };

  // Current Month's configured prize
  const currentDrawPrize = useMemo(() => {
    return monthlyPrizes[drawMonth] || DEFAULT_MONTHLY_PRIZES[drawMonth] || 'Smart 4K UHD LED TV 43" (किंमत ₹३२,९९०)';
  }, [monthlyPrizes, drawMonth]);

  // Live prize text input directly editable on main screen
  const [livePrizeInput, setLivePrizeInput] = useState<string>('');
  const [winnerLivePrize, setWinnerLivePrize] = useState<string>('');

  // Scheme-specific prizes toggle and mapping (e.g. Scheme 1 gets Mixer, Scheme 2 gets TV, Scheme 3 gets Fridge)
  const [isSchemeSpecificPrizes, setIsSchemeSpecificPrizes] = useState<boolean>(false);
  const [schemePrizes, setSchemePrizes] = useState<Record<string, string>>(() => {
    return (storeData.settings as any)?.schemeMonthlyDrawPrizes || {};
  });

  // Keep livePrizeInput in sync when drawMonth, scheme or currentDrawPrize changes
  useEffect(() => {
    if (isSchemeSpecificPrizes && selectedScheme !== 'all') {
      const key = `${selectedScheme}-${drawMonth}`;
      setLivePrizeInput(schemePrizes[key] || currentDrawPrize);
    } else {
      setLivePrizeInput(currentDrawPrize);
    }
  }, [drawMonth, selectedScheme, currentDrawPrize, isSchemeSpecificPrizes, schemePrizes]);

  // Save prize for a month into storeData.settings.monthlyDrawPrizes
  const handleSaveMonthlyPrize = (month: number, prizeName: string) => {
    if (!prizeName.trim()) return;

    const updatedPrizes = {
      ...(storeData.settings?.monthlyDrawPrizes || {}),
      [month]: prizeName.trim(),
    };

    StorageService.saveData({
      ...storeData,
      settings: {
        ...storeData.settings,
        monthlyDrawPrizes: updatedPrizes,
      },
    });

    if (onRefreshData) {
      onRefreshData();
    }

    setEditingPrizeMonth(null);
    setLivePrizeInput(prizeName.trim());
    triggerAlert(`✓ महिना ${month} चे बक्षीस '${prizeName.trim()}' सेव्ह झाले!`);
  };

  // Handler: Save Live Prize Input from the main draw screen
  const handleSaveLivePrize = (customPrizeText?: string) => {
    const textToSave = (customPrizeText !== undefined ? customPrizeText : livePrizeInput).trim();
    if (!textToSave) {
      triggerAlert('कृपया वैध बक्षीस नाव प्रविष्ट करा!', true);
      return;
    }

    if (isSchemeSpecificPrizes && selectedScheme !== 'all') {
      const key = `${selectedScheme}-${drawMonth}`;
      const updatedSchemePrizes = {
        ...schemePrizes,
        [key]: textToSave,
      };
      setSchemePrizes(updatedSchemePrizes);

      StorageService.saveData({
        ...storeData,
        settings: {
          ...storeData.settings,
          schemeMonthlyDrawPrizes: updatedSchemePrizes,
        } as any,
      });

      if (onRefreshData) onRefreshData();
      triggerAlert(`✓ योजना ${selectedScheme} - महिना ${drawMonth} चे बक्षीस '${textToSave}' सेव्ह झाले!`);
    } else {
      handleSaveMonthlyPrize(drawMonth, textToSave);
    }

    setLivePrizeInput(textToSave);
  };

  // Save updated prize for an already drawn winner
  const handleSaveWinnerPrize = () => {
    if (!editingWinner || !editWinnerPrizeText.trim()) return;

    const updatedMembers = storeData.cardMembers.map((m) => {
      if (m.id === editingWinner.id) {
        return {
          ...m,
          prizeDetails: editWinnerPrizeText.trim(),
        };
      }
      return m;
    });

    StorageService.saveData({
      ...storeData,
      cardMembers: updatedMembers,
    });

    if (onRefreshData) {
      onRefreshData();
    }

    triggerAlert(`✓ विजेता कार्ड क्र. ${editingWinner.cardNo} चे बक्षीस अपडेट झाले!`);
    setEditingWinner(null);
  };

  // Handler: Update winner live prize directly on celebration card
  const handleUpdateWinnerLivePrize = () => {
    if (!winnerMember || !winnerLivePrize.trim()) return;

    const updatedWinner: CardMember = {
      ...winnerMember,
      prizeDetails: winnerLivePrize.trim(),
    };
    setWinnerMember(updatedWinner);

    const updatedMembers = storeData.cardMembers.map((m) => {
      if (m.id === winnerMember.id) {
        return updatedWinner;
      }
      return m;
    });

    StorageService.saveData({
      ...storeData,
      cardMembers: updatedMembers,
    });

    if (onRefreshData) onRefreshData();
    triggerAlert(`✓ विजेत्याचे बक्षीस '${winnerLivePrize.trim()}' अपडेट झाले!`);
  };

  // Total Uploaded Cards by Scheme
  const schemeStats = useMemo(() => {
    const totalAll = storeData.cardMembers.length;
    const s1 = storeData.cardMembers.filter((m) => (m.schemeNo || 1) === 1);
    const s2 = storeData.cardMembers.filter((m) => m.schemeNo === 2);
    const s3 = storeData.cardMembers.filter((m) => m.schemeNo === 3);

    return {
      all: totalAll,
      scheme1: {
        total: s1.length,
        active: s1.filter((m) => m.status === 'Active').length,
        winners: s1.filter((m) => m.status === 'Draw Winner' || !!m.drawMonthWon).length,
      },
      scheme2: {
        total: s2.length,
        active: s2.filter((m) => m.status === 'Active').length,
        winners: s2.filter((m) => m.status === 'Draw Winner' || !!m.drawMonthWon).length,
      },
      scheme3: {
        total: s3.length,
        active: s3.filter((m) => m.status === 'Active').length,
        winners: s3.filter((m) => m.status === 'Draw Winner' || !!m.drawMonthWon).length,
      },
    };
  }, [storeData.cardMembers]);

  // Eligible Active Members for the Lucky Draw strictly matching selectedScheme
  const eligibleMembers = useMemo(() => {
    return storeData.cardMembers.filter((m) => {
      if (m.status !== 'Active') return false;
      if (selectedScheme !== 'all') {
        const memberScheme = m.schemeNo || 1;
        if (memberScheme !== selectedScheme) return false;
      }
      return true;
    });
  }, [storeData.cardMembers, selectedScheme]);

  // Filtered Stock items for stock picker modal
  const filteredStockItems = useMemo(() => {
    const q = stockSearchQuery.trim().toLowerCase();
    if (!q) return storeData.stock.slice(0, 30);
    return storeData.stock.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.brand.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.model && item.model.toLowerCase().includes(q))
    ).slice(0, 30);
  }, [storeData.stock, stockSearchQuery]);

  // Past Winners Registry
  const drawWinners = useMemo(() => {
    return storeData.cardMembers.filter((m) => {
      const isWinner = m.status === 'Draw Winner' || !!m.drawMonthWon;
      if (!isWinner) return false;

      if (winnersSchemeFilter !== 'all') {
        const memberScheme = m.schemeNo || 1;
        if (memberScheme !== winnersSchemeFilter) return false;
      }

      if (winnersSearch.trim()) {
        const q = winnersSearch.toLowerCase();
        return (
          m.memberName.toLowerCase().includes(q) ||
          m.cardNo.toLowerCase().includes(q) ||
          m.phone.includes(q) ||
          (m.village && m.village.toLowerCase().includes(q))
        );
      }

      return true;
    });
  }, [storeData.cardMembers, winnersSchemeFilter, winnersSearch]);

  // Revert / Undo Winner
  const handleRevertWinner = (memberId: string, cardNo: string) => {
    if (!window.confirm(`तुम्हाला खात्री आहे का की कार्ड क्र. ${cardNo} चा विजेता दर्जा रद्द करून कार्ड पुन्हा 'Active' करायचे आहे?`)) {
      return;
    }

    const updatedMembers = storeData.cardMembers.map((m) => {
      if (m.id === memberId) {
        return {
          ...m,
          status: 'Active' as const,
          drawMonthWon: undefined,
          prizeDetails: undefined,
        };
      }
      return m;
    });

    StorageService.saveData({
      ...storeData,
      cardMembers: updatedMembers,
    });

    if (onRefreshData) {
      onRefreshData();
    }

    triggerAlert(`✓ कार्ड क्र. ${cardNo} पुन्हा सक्रिय (Active) केले गेले आहे!`);
  };

  // Maturity Members List
  const maturityMembers = useMemo(() => {
    return storeData.cardMembers
      .filter((m) => {
        if (maturitySearch.trim()) {
          const q = maturitySearch.toLowerCase();
          return (
            m.memberName.toLowerCase().includes(q) ||
            m.cardNo.toLowerCase().includes(q) ||
            m.phone.includes(q)
          );
        }
        return true;
      })
      .map((m) => {
        const totalDuration = m.durationMonths || 30;
        const paidMonths = m.totalPaidMonths || 0;
        const remainingMonths = Math.max(0, totalDuration - paidMonths);
        const monthlyAmt = m.monthlyAmount || 500;
        const totalDeposited = m.totalAmountPaid || paidMonths * monthlyAmt;
        const targetTotal = m.targetAmount || (m.schemeNo === 3 ? 30000 : 15000);
        const bonusBenefit = Math.round(targetTotal * 0.05);
        const progressPct = Math.min(100, Math.round((paidMonths / totalDuration) * 100));
        const isEligibleForGift = paidMonths >= totalDuration;

        return {
          ...m,
          totalDuration,
          paidMonths,
          remainingMonths,
          monthlyAmt,
          totalDeposited,
          targetTotal,
          bonusBenefit,
          progressPct,
          isEligibleForGift,
        };
      });
  }, [storeData.cardMembers, maturitySearch]);

  // Sounds
  const playBeep = (freq = 440, type: OscillatorType = 'sine', duration = 0.08) => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch {}
  };

  const playFanfare = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const notes = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99];
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
          gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.3);
        }, idx * 100);
      });
    } catch {}
  };

  // Purely Random Winner Selection from uploaded data
  const handleStartDraw = () => {
    if (eligibleMembers.length === 0) {
      triggerAlert(
        `लकी ड्रॉ साठी पात्र असलेले सक्रिय कार्ड्स आढळले नाहीत! (निवडलेली योजना: ${
          selectedScheme === 'all' ? 'सर्व' : `योजना ${selectedScheme}`
        }). कृपया कार्ड्स ॲक्टिव्ह असल्याची खात्री करा.`,
        true
      );
      return;
    }

    if (spinIntervalRef.current) {
      clearInterval(spinIntervalRef.current);
    }

    setAlertMsg(null);
    setIsSpinning(true);
    setWinnerMember(null);
    setShowCertificate(false);
    setShowFullPhone(false);

    const prizeToAward = livePrizeInput.trim() || currentDrawPrize;

    let counter = 0;
    const totalSpins = 38;

    spinIntervalRef.current = setInterval(() => {
      const tempIdx = Math.floor(Math.random() * eligibleMembers.length);
      const tempMember = eligibleMembers[tempIdx];

      setDisplayCardNo(tempMember.cardNo);
      setDisplayMemberName(tempMember.memberName);
      setDisplayVillage(tempMember.village || tempMember.address || 'Wardha');

      playBeep(400 + (counter % 8) * 60, 'sine', 0.05);
      counter++;

      if (counter >= totalSpins) {
        clearInterval(spinIntervalRef.current);
        spinIntervalRef.current = null;

        const finalWinnerIndex = Math.floor(Math.random() * eligibleMembers.length);
        const finalWinner = eligibleMembers[finalWinnerIndex];

        const winnerWithPrize: CardMember = {
          ...finalWinner,
          status: 'Draw Winner' as const,
          drawMonthWon: drawMonth,
          prizeDetails: prizeToAward,
        };

        setDisplayCardNo(finalWinner.cardNo);
        setDisplayMemberName(finalWinner.memberName);
        setDisplayVillage(finalWinner.village || finalWinner.address || 'Wardha');
        setWinnerMember(winnerWithPrize);
        setWinnerLivePrize(prizeToAward);
        setIsSpinning(false);
        setShowCertificate(true);

        playFanfare();

        const updatedMembers = storeData.cardMembers.map((m) => {
          if (m.id === finalWinner.id) {
            return winnerWithPrize;
          }
          return m;
        });

        StorageService.saveData({
          ...storeData,
          cardMembers: updatedMembers,
        });

        if (onRefreshData) {
          onRefreshData();
        }

        triggerAlert(`🎉 अभिनंदन! कार्ड क्र. ${finalWinner.cardNo} (${finalWinner.memberName}) हे महिना ${drawMonth} चे भाग्यवान विजेते ठरले आहेत!`);
      }
    }, 85);
  };

  const handleResetDraw = () => {
    if (spinIntervalRef.current) {
      clearInterval(spinIntervalRef.current);
    }
    setIsSpinning(false);
    setWinnerMember(null);
    setShowCertificate(false);
    setDisplayCardNo('----');
    setDisplayMemberName('श्री साई एंटरप्रायजेस');
    setDisplayVillage('वर्धा');
  };

  const handleShareWhatsApp = (member: CardMember) => {
    const text = `🎉 *श्री साई एंटरप्रायजेस, वर्धा - ३० महिने बचत योजना लकी ड्रॉ निकाल* 🎉\n\n` +
      `🏆 *अभिनंदन! भाग्यवान विजेता घोषित!*\n` +
      `📋 *कार्ड क्र.:* #${member.cardNo}\n` +
      `👤 *विजेत्याचे नाव:* ${member.memberName}\n` +
      `📍 *गाव/पत्ता:* ${member.village || member.address}\n` +
      `🎁 *बंपर बक्षीस:* ${member.prizeDetails || currentDrawPrize}\n` +
      `📅 *ड्रॉ महिना:* महिना ${member.drawMonthWon || drawMonth}\n` +
      `🏢 *योजना:* ${member.schemeName || `योजना ${member.schemeNo || 1}`}\n\n` +
      `सर्व सभासदांचे मनःपूर्वक आभार! पुढील ड्रॉ पुढील महिन्याच्या तारखेला होईल.\n` +
      `श्री साई एंटरप्रायजेस, आर्वी रोड, वर्धा. 📞 9822100000`;

    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Alert */}
      {alertMsg && (
        <div className={`fixed top-20 right-6 z-50 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border font-bold text-sm animate-bounce ${
          alertMsg.isError ? 'bg-rose-600 text-white border-rose-400' : 'bg-emerald-600 text-white border-emerald-400'
        }`}>
          {alertMsg.isError ? <AlertCircle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
          <span>{alertMsg.text}</span>
        </div>
      )}

      {/* Main Header Banner */}
      <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl relative overflow-hidden ${
        isDayMode
          ? 'bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-purple-500/10 border-amber-200 text-slate-900'
          : 'bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/80 border-slate-800 text-white'
      }`}>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500 text-slate-950 uppercase tracking-wider">
                अधिकृत लकी ड्रॉ पोर्टल
              </span>
              <span className="text-xs text-amber-400 font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                १००% पारदर्शक व रँडम निवड
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3">
              <Trophy className="w-8 h-8 text-amber-400 animate-pulse" />
              <span>डिजिटल लकी ड्रॉ मशीन व विजेते (Lucky Draw & Winners)</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              योजना १, २, ३ मधील अपलोड केलेल्या सभासदांमधून पूर्णपणे पारदर्शक व डिजिटल पद्धतीने बंपर बक्षीस विजेते निवडा. कोणत्याही महिन्याचे बक्षीस थेट सेट व एडिट करा.
            </p>
          </div>

          {/* Sound & Print */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2.5 rounded-2xl border transition flex items-center gap-1.5 text-xs font-bold cursor-pointer ${
                soundEnabled ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title={soundEnabled ? 'आवाज सुरू' : 'आवाज बंद'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span>{soundEnabled ? 'आवाज सुरू' : 'म्युट'}</span>
            </button>

            <button
              onClick={() => window.print()}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-2xl flex items-center gap-1.5 transition border border-slate-700 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>प्रिंट निकाल</span>
            </button>
          </div>
        </div>

        {/* 4 Unified Sub-Tabs Navigation */}
        <div className="mt-6 flex items-center gap-2 border-b border-slate-700/50 pb-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab('draw')}
            className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-black transition flex items-center gap-2.5 cursor-pointer shrink-0 ${
              activeSubTab === 'draw'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 scale-[1.02]'
                : isDayMode
                ? 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 border border-slate-700'
            }`}
          >
            <Play className="w-4 h-4" />
            <span>१. लकी ड्रॉ मशीन (Digital Drum Machine)</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-black/20 font-mono">Live</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('schedule')}
            className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-black transition flex items-center gap-2.5 cursor-pointer shrink-0 ${
              activeSubTab === 'schedule'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 scale-[1.02]'
                : isDayMode
                ? 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 border border-slate-700'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>२. ३० महिन्यांचे बक्षीस शेड्युल व प्लॅनर (Prize Planner)</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-black/20 font-mono">३० महिने</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('winners')}
            className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-black transition flex items-center gap-2.5 cursor-pointer shrink-0 ${
              activeSubTab === 'winners'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 scale-[1.02]'
                : isDayMode
                ? 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 border border-slate-700'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>३. सर्व विजेते यादी (Scheme Winners Gallery)</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-black/20 font-mono">{drawWinners.length}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('maturity')}
            className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-black transition flex items-center gap-2.5 cursor-pointer shrink-0 ${
              activeSubTab === 'maturity'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 scale-[1.02]'
                : isDayMode
                ? 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 border border-slate-700'
            }`}
          >
            <Crown className="w-4 h-4" />
            <span>४. ३० महिने मॅच्युरिटी व गिफ्ट ट्रॅकर (Maturity Bonus)</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-black/20 font-mono">Maturity</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SUB-TAB 1: DIGITAL LUCKY DRAW MACHINE                     */}
      {/* ========================================================= */}
      {activeSubTab === 'draw' && (
        <div className="space-y-6">
          {/* Top Scheme & Round Selector Card */}
          <div className={`p-6 rounded-3xl border shadow-xl ${
            isDayMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              {/* Scheme Selection Buttons */}
              <div className="flex-1">
                <label className="text-xs font-black uppercase text-slate-400 block mb-2.5 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span>कोणत्या योजनेचा ड्रॉ काढायचा आहे? (Select Scheme 1, 2, 3) *</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSelectedScheme('all')}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer relative ${
                      selectedScheme === 'all'
                        ? 'bg-amber-500 text-slate-950 font-black border-amber-500 shadow-md scale-[1.02]'
                        : isDayMode
                        ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-black">सर्व योजना (All)</div>
                    <div className="text-[11px] opacity-80 mt-1 font-mono">{schemeStats.all} कार्ड्स</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedScheme(1)}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer relative ${
                      selectedScheme === 1
                        ? 'bg-amber-500 text-slate-950 font-black border-amber-500 shadow-md scale-[1.02]'
                        : isDayMode
                        ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black">योजना १ (Scheme 1)</span>
                      {selectedScheme === 1 && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <div className="text-[10px] opacity-80 mt-0.5 font-mono">१००१ - ३०००</div>
                    <div className="text-[11px] font-bold text-amber-400 mt-1">{schemeStats.scheme1.active} सक्रिय पात्र</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedScheme(2)}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer relative ${
                      selectedScheme === 2
                        ? 'bg-amber-500 text-slate-950 font-black border-amber-500 shadow-md scale-[1.02]'
                        : isDayMode
                        ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black">योजना २ (Scheme 2)</span>
                      {selectedScheme === 2 && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <div className="text-[10px] opacity-80 mt-0.5 font-mono">१००१ - ३०००</div>
                    <div className="text-[11px] font-bold text-sky-400 mt-1">{schemeStats.scheme2.active} सक्रिय पात्र</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedScheme(3)}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer relative ${
                      selectedScheme === 3
                        ? 'bg-amber-500 text-slate-950 font-black border-amber-500 shadow-md scale-[1.02]'
                        : isDayMode
                        ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black">योजना ३ (Scheme 3)</span>
                      {selectedScheme === 3 && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <div className="text-[10px] opacity-80 mt-0.5 font-mono">१००१ - ६०००</div>
                    <div className="text-[11px] font-bold text-emerald-400 mt-1">{schemeStats.scheme3.active} सक्रिय पात्र</div>
                  </button>
                </div>
              </div>

              {/* Month Round Selector */}
              <div className="w-full lg:w-72">
                <label className="text-xs font-black uppercase text-slate-400 block mb-2.5 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span>ड्रॉ महिना / राऊंड (Month 1-30)</span>
                </label>
                <select
                  value={drawMonth}
                  onChange={(e) => setDrawMonth(parseInt(e.target.value, 10))}
                  className={`w-full px-4 py-3 rounded-2xl text-sm font-black border focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    isDayMode ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                  }`}
                >
                  {Array.from({ length: 30 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      महिना {m} चा लकी ड्रॉ (Month {m})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Interactive Prize Item Input & Customizer Banner */}
            <div className="mt-6 pt-6 border-t border-slate-700/50">
              <div className="p-5 sm:p-6 rounded-3xl border border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-purple-500/10 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 text-2xl shadow-inner">
                      🎁
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
                          महिना {drawMonth} चा लकी ड्रॉ - बक्षीस / गिफ्ट आयटम
                        </span>
                        <span className="text-xs text-slate-400 font-bold">
                          ({selectedScheme === 'all' ? 'सर्व योजना १, २, ३' : `योजना ${selectedScheme}`})
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">
                        येथे थेट बक्षीस नाव टाईप करा किंवा खालील पर्यायांमधून निवडा. हेच बक्षीस ड्रॉ काढल्यावर विजेत्याच्या नावावर नोंदवले जाईल.
                      </p>
                    </div>
                  </div>

                  {/* Toggle for Scheme-Specific Prizes */}
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-amber-300 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-amber-500/30 shrink-0">
                    <input
                      type="checkbox"
                      checked={isSchemeSpecificPrizes}
                      onChange={(e) => setIsSchemeSpecificPrizes(e.target.checked)}
                      className="rounded text-amber-500 focus:ring-amber-400"
                    />
                    <span>योजना १, २, ३ साठी वेगवेगळे बक्षीस?</span>
                  </label>
                </div>

                {/* Main Input Row */}
                <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
                  <div className="relative flex-1">
                    <Gift className="w-5 h-5 text-amber-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={livePrizeInput}
                      onChange={(e) => setLivePrizeInput(e.target.value)}
                      placeholder="या ड्रॉ चे बक्षीस नाव प्रविष्ट करा (उदा. Smart 4K UHD LED TV 43' किंवा Whirlpool 190L Fridge)..."
                      className={`w-full pl-11 pr-4 py-3 rounded-2xl text-sm font-bold border focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                        isDayMode ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-amber-500/50 text-white'
                      }`}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSaveLivePrize()}
                    className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition cursor-pointer shrink-0"
                  >
                    <Save className="w-4 h-4" />
                    <span>✓ बक्षीस सेव्ह करा</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTargetStockMonth(drawMonth);
                      setIsStockModalOpen(true);
                    }}
                    className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs rounded-2xl border border-amber-500/30 flex items-center justify-center gap-2 transition cursor-pointer shrink-0"
                  >
                    <Boxes className="w-4 h-4" />
                    <span>स्टॉकमधून निवडा</span>
                  </button>
                </div>

                {/* Scheme Specific Fields if toggled */}
                {isSchemeSpecificPrizes && (
                  <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-amber-500/30 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-black text-amber-400 block mb-1">
                        योजना १ बक्षीस (Scheme 1 Prize):
                      </label>
                      <input
                        type="text"
                        value={schemePrizes[`1-${drawMonth}`] || monthlyPrizes[drawMonth] || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSchemePrizes((prev) => ({ ...prev, [`1-${drawMonth}`]: val }));
                          if (selectedScheme === 1) setLivePrizeInput(val);
                        }}
                        placeholder="उदा. ४-जार मिक्सर ग्राइंडर"
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-black text-sky-400 block mb-1">
                        योजना २ बक्षीस (Scheme 2 Prize):
                      </label>
                      <input
                        type="text"
                        value={schemePrizes[`2-${drawMonth}`] || monthlyPrizes[drawMonth] || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSchemePrizes((prev) => ({ ...prev, [`2-${drawMonth}`]: val }));
                          if (selectedScheme === 2) setLivePrizeInput(val);
                        }}
                        placeholder="उदा. १९०L डायरेक्ट-कूल फ्रिज"
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-black text-emerald-400 block mb-1">
                        योजना ३ बक्षीस (Scheme 3 Prize):
                      </label>
                      <input
                        type="text"
                        value={schemePrizes[`3-${drawMonth}`] || monthlyPrizes[drawMonth] || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSchemePrizes((prev) => ({ ...prev, [`3-${drawMonth}`]: val }));
                          if (selectedScheme === 3) setLivePrizeInput(val);
                        }}
                        placeholder="उदा. ४३' Smart 4K TV"
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white"
                      />
                    </div>
                  </div>
                )}

                {/* 1-Click Quick Popular Preset Chips */}
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>जलद बक्षीस पर्याय (Quick 1-Click Pick for Month {drawMonth}):</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { icon: '📺', name: 'Smart 4K UHD LED TV 43" (किंमत ₹३२,९९०)' },
                      { icon: '🧊', name: 'Whirlpool 190L Direct-Cool Refrigerator (किंमत ₹१८,९९०)' },
                      { icon: '🌀', name: 'Fully Automatic Washing Machine (किंमत ₹२४,५००)' },
                      { icon: '🗄️', name: 'Godrej 3-Door Teak Wood Wardrobe / कपाट (किंमत ₹२१,०००)' },
                      { icon: '⚡', name: 'Prestige 4-Jar Mixer Grinder + Induction (किंमत ₹८,५००)' },
                      { icon: '🪙', name: '24K Gold Coin 1 Gram / सोन्याचे नाणे (किंमत ₹८,०००)' },
                      { icon: '🛋️', name: 'L-Shape 6-Seater Luxury Sofa Set (किंमत ₹३८,०००)' },
                      { icon: '🛏️', name: 'Sagwan Double Bed 6x6 with Storage (किंमत ₹३४,०००)' },
                      { icon: '💵', name: '₹१०,००० रोख खरेदी व्हाउचर / कूपन' },
                      { icon: '🛵', name: 'Hero Splendor / EV Scooter Cash Subsidy ₹३५,०००' },
                      { icon: '💨', name: 'Symphony Heavy Room Air Cooler 70L (किंमत ₹१२,५००)' },
                      { icon: '🔥', name: 'Bajaj 20L Grill Microwave Oven (किंमत ₹९,९९०)' },
                      { icon: '🥣', name: 'Prestige 5-Item Kitchen Appliance Combo (किंमत ₹१२,५००)' },
                    ].map((item) => (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => {
                          setLivePrizeInput(item.name);
                          handleSaveLivePrize(item.name);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                          livePrizeInput === item.name
                            ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md font-black'
                            : 'bg-slate-950/80 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800'
                        }`}
                      >
                        <span>{item.icon}</span>
                        <span>{item.name.split(' (')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Transparent Drum & Spinner Showcase */}
          <div className={`p-8 sm:p-12 rounded-3xl border shadow-2xl relative overflow-hidden text-center ${
            isDayMode
              ? 'bg-gradient-to-b from-slate-900 to-indigo-950 text-white border-amber-400/30'
              : 'bg-gradient-to-b from-slate-950 via-[#070a14] to-slate-950 text-white border-amber-500/20'
          }`}>
            <div className="absolute inset-0 bg-radial from-amber-500/10 via-transparent to-transparent pointer-events-none" />

            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black mb-6">
              <Users className="w-3.5 h-3.5" />
              <span>
                लकी ड्रॉ पात्र पूल: {eligibleMembers.length} कार्ड्स (
                {selectedScheme === 'all' ? 'सर्व योजना' : `योजना ${selectedScheme}`}
                )
              </span>
            </div>

            <div className="max-w-xl mx-auto my-4">
              <div className="p-6 sm:p-8 rounded-3xl bg-slate-950 border-2 border-amber-400/60 shadow-[0_0_50px_rgba(245,158,11,0.2)]">
                <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                  भाग्यवान कार्ड नंबर (WINNING CARD NO)
                </div>

                <div className={`text-6xl sm:text-8xl font-black font-mono tracking-wider transition-all duration-75 ${
                  isSpinning ? 'text-amber-400 scale-105 blur-[0.5px]' : 'text-white'
                }`}>
                  {displayCardNo}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800/80">
                  <div className="text-lg sm:text-2xl font-black text-amber-300 truncate">
                    {displayMemberName}
                  </div>
                  <div className="text-xs sm:text-sm text-slate-400 mt-1 flex items-center justify-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    <span>{displayVillage}</span>
                    <span>•</span>
                    <span>महिना {drawMonth} चा ड्रॉ</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 mt-8 flex-wrap">
              <button
                type="button"
                disabled={isSpinning || eligibleMembers.length === 0}
                onClick={handleStartDraw}
                className={`px-10 py-5 rounded-2xl text-base sm:text-lg font-black transition flex items-center gap-3 cursor-pointer shadow-2xl ${
                  isSpinning || eligibleMembers.length === 0
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    : 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-amber-500/40 hover:scale-105 active:scale-95'
                }`}
              >
                <Trophy className="w-6 h-6" />
                <span>
                  {isSpinning ? 'ड्रॉ सुरू आहे... फिरत आहे!' : 'लकी ड्रॉ काढा (Spin Digital Machine)'}
                </span>
              </button>

              {(winnerMember || isSpinning) && (
                <button
                  type="button"
                  onClick={handleResetDraw}
                  className="px-6 py-5 rounded-2xl text-sm font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition flex items-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>पुन्हा फिरवा (Reset)</span>
                </button>
              )}
            </div>

            <p className="text-[11px] text-slate-500 mt-4">
              * संगणकीय अल्गोरिदमद्वारे केवळ अपलोड केलेल्या आणि सक्रिय असलेल्या कार्ड्समधूनच पूर्णपणे निपक्ष व रँडम विजेता निवडला जातो.
            </p>
          </div>

          {/* Winner Celebration Modal / Card */}
          {showCertificate && winnerMember && (
            <div className={`p-8 rounded-3xl border-2 border-amber-400 bg-slate-950 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-white`}>
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Crown className="w-64 h-64 text-amber-400" />
              </div>

              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-black uppercase mb-1">
                    <Sparkles className="w-4 h-4" />
                    <span>अधिकृत भाग्यवान विजेता प्रमाणपत्र (Official Winner Certificate)</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black">
                    🎉 हार्दिक अभिनंदन! <span className="text-amber-400">{winnerMember.memberName}</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    श्री साई एंटरप्रायजेस ३० महिने बचत योजना • महिना {drawMonth} चे बंपर बक्षीस विजेता!
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => handleShareWhatsApp(winnerMember)}
                    className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-2 transition cursor-pointer shadow-lg shadow-emerald-600/30"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>व्हॉट्सॲपवर पाठवा (WhatsApp Share)</span>
                  </button>

                  <button
                    onClick={() => window.print()}
                    className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-black flex items-center gap-2 transition border border-slate-700 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>सर्टिफिकेट प्रिंट करा</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-6 p-6 rounded-2xl bg-slate-900/90 border border-amber-400/30">
                <div>
                  <div className="text-[11px] text-slate-400 uppercase font-bold">विजेता कार्ड नंबर</div>
                  <div className="text-2xl font-black text-amber-400 font-mono mt-1">
                    #{winnerMember.cardNo}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {winnerMember.schemeName || `योजना ${winnerMember.schemeNo || 1}`}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-slate-400 uppercase font-bold">गाव / पत्ता</div>
                  <div className="text-base font-bold text-white mt-1">
                    {winnerMember.village || winnerMember.address || 'Wardha'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">अधिकृत सभासद</div>
                </div>

                <div>
                  <div className="text-[11px] text-slate-400 uppercase font-bold">मोबाईल नंबर</div>
                  <div className="text-base font-mono font-bold text-white mt-1 flex items-center gap-2">
                    <span>
                      {showFullPhone
                        ? winnerMember.phone
                        : `${winnerMember.phone.slice(0, 3)}****${winnerMember.phone.slice(-3)}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowFullPhone(!showFullPhone)}
                      className="text-[10px] text-amber-400 hover:underline cursor-pointer"
                    >
                      {showFullPhone ? 'लपवा' : 'दाखवा'}
                    </button>
                  </div>
                </div>

                <div className="sm:col-span-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 uppercase font-bold">जिंकलेले बक्षीस</span>
                    <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                      <Edit3 className="w-3 h-3" />
                      <span>एडिट करा</span>
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-1.5">
                    <input
                      type="text"
                      value={winnerLivePrize}
                      onChange={(e) => setWinnerLivePrize(e.target.value)}
                      placeholder="बक्षीस नाव..."
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-emerald-500/50 text-emerald-300 font-bold text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400 font-sans"
                    />
                    <button
                      type="button"
                      onClick={handleUpdateWinnerLivePrize}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[11px] font-bold cursor-pointer shrink-0"
                      title="विजेत्याचे बक्षीस लगेच अपडेट करा"
                    >
                      अपडेट
                    </button>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">सर्टिफिकेट व WhatsApp वर हेच नाव जाईल</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-TAB 2: 30-MONTH PRIZE SCHEDULE & PLANNER              */}
      {/* ========================================================= */}
      {activeSubTab === 'schedule' && (
        <div className={`p-6 rounded-3xl border shadow-xl ${
          isDayMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-700/50">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500 text-slate-950 uppercase">
                  प्लॅनर व शेड्युल
                </span>
                <span className="text-xs text-amber-400 font-bold">१ ते ३० महिने</span>
              </div>
              <h2 className="text-lg font-black mt-1 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-400" />
                <span>कोणत्या ड्रॉवर काय द्यायचे - संपूर्ण ३० महिन्यांचे बक्षीस शेड्युल</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                येथून तुम्ही प्रत्येक महिन्याचे बक्षीस आधीच ठरवू शकता किंवा कधीही एडिट करू शकता. स्टॉकमधील वस्तू किंवा रोख रक्कम जोडू शकता.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setTargetStockMonth(drawMonth);
                setIsStockModalOpen(true);
              }}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl transition flex items-center gap-1.5 shadow-md cursor-pointer shrink-0"
            >
              <Boxes className="w-4 h-4" />
              <span>स्टॉकमधून बक्षीस निवडा</span>
            </button>
          </div>

          {/* 30 Months Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 mt-6">
            {Array.from({ length: 30 }, (_, i) => i + 1).map((monthNo) => {
              const prize = monthlyPrizes[monthNo] || DEFAULT_MONTHLY_PRIZES[monthNo] || 'बक्षीस';
              const isCurrent = drawMonth === monthNo;

              return (
                <div
                  key={monthNo}
                  className={`p-4 rounded-2xl border transition flex items-center justify-between gap-3 ${
                    isCurrent
                      ? 'border-amber-400/80 bg-amber-500/10 shadow-md'
                      : isDayMode
                      ? 'bg-slate-50 border-slate-200 hover:border-amber-300'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl font-mono font-black text-sm flex items-center justify-center shrink-0 ${
                      isCurrent ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-amber-400 border border-slate-700'
                    }`}>
                      #{monthNo}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-300">
                          महिना {monthNo} चा ड्रॉ
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-1.5 rounded">
                            सक्रिय
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-bold text-white truncate max-w-[210px] sm:max-w-[240px] mt-0.5" title={prize}>
                        {prize}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPrizeMonth(monthNo);
                        setEditPrizeText(prize);
                      }}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold border border-slate-700 transition cursor-pointer"
                      title={`महिना ${monthNo} चे बक्षीस बदला`}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-TAB 3: WINNERS GALLERY & HISTORY                     */}
      {/* ========================================================= */}
      {activeSubTab === 'winners' && (
        <div className={`p-6 rounded-3xl border shadow-xl ${
          isDayMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-700/50">
            <div>
              <h2 className="text-lg font-black flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <span>३० महिने योजना विजेते नोंदवही (Winners Registry)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                योजना १, २ आणि ३ मधील आतापर्यंत घोषित झालेल्या सर्व भाग्यवान विजेत्यांची यादी. येथे बक्षीस बदलण्याचा पर्यायही उपलब्ध आहे.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                {(['all', 1, 2, 3] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setWinnersSchemeFilter(s)}
                    className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                      winnersSchemeFilter === s ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {s === 'all' ? 'सर्व' : `योजना ${s}`}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="नाव, कार्ड नंबर किंवा गाव शोधा..."
                  value={winnersSearch}
                  onChange={(e) => setWinnersSearch(e.target.value)}
                  className={`pl-9 pr-3 py-2 rounded-xl text-xs font-bold border focus:outline-none focus:ring-1 focus:ring-amber-500 w-48 sm:w-60 ${
                    isDayMode ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                  }`}
                />
              </div>
            </div>
          </div>

          {drawWinners.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              <Trophy className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <p>या फिल्टरनुसार अद्याप कोणतेही विजेते आढळले नाहीत.</p>
              <button
                type="button"
                onClick={() => setActiveSubTab('draw')}
                className="mt-3 px-4 py-2 bg-amber-500 text-slate-950 rounded-xl font-bold text-xs cursor-pointer"
              >
                लकी ड्रॉ काढा
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-xs text-left">
                <thead className={`text-[11px] uppercase font-bold border-b ${
                  isDayMode ? 'bg-slate-50 text-slate-600 border-slate-200' : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}>
                  <tr>
                    <th className="py-3 px-4">कार्ड क्र.</th>
                    <th className="py-3 px-4">योजना</th>
                    <th className="py-3 px-4">विजेत्याचे नाव</th>
                    <th className="py-3 px-4">गाव / पत्ता</th>
                    <th className="py-3 px-4">मोबाईल</th>
                    <th className="py-3 px-4">ड्रॉ महिना</th>
                    <th className="py-3 px-4">जिंकलेले बक्षीस</th>
                    <th className="py-3 px-4 text-right">कृती</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {drawWinners.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-mono font-black text-amber-400">
                        #{w.cardNo}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {w.schemeName || `योजना ${w.schemeNo || 1}`}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-white">
                        {w.memberName}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {w.village || w.address || 'Wardha'}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400">
                        {w.phone}
                      </td>
                      <td className="py-3 px-4 font-bold text-amber-300">
                        महिना {w.drawMonthWon || '१'}
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-400">
                        {w.prizeDetails || currentDrawPrize}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Edit Winner Prize Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingWinner(w);
                              setEditWinnerPrizeText(w.prizeDetails || currentDrawPrize);
                            }}
                            className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                            title="विजेत्याचे बक्षीस बदला"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>बदला</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleShareWhatsApp(w)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                            title="व्हॉट्सॲपवर पाठवा"
                          >
                            <Share2 className="w-3 h-3" />
                            <span>शेअर</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRevertWinner(w.id, w.cardNo)}
                            className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                            title="विजेता रद्द करा व कार्ड पुन्हा सक्रिय करा"
                          >
                            <Undo2 className="w-3 h-3" />
                            <span>रद्द</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-TAB 4: 30-MONTH MATURITY & BONUS BENEFITS            */}
      {/* ========================================================= */}
      {activeSubTab === 'maturity' && (
        <div className={`p-6 rounded-3xl border shadow-xl ${
          isDayMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-700/50">
            <div>
              <h2 className="text-lg font-black flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                <span>३० महिने बचत योजना मॅच्युरिटी व गिफ्ट ट्रॅकर</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                सर्व ३० महिने पूर्ण करणाऱ्या सभासदांना ५% अतिरिक्त स्टोअर बोनस व बंपर गिफ्ट हॅम्पर्स.
              </p>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="कार्ड क्र. किंवा सभासद शोधा..."
                value={maturitySearch}
                onChange={(e) => setMaturitySearch(e.target.value)}
                className={`pl-9 pr-3 py-2 rounded-xl text-xs font-bold border focus:outline-none focus:ring-1 focus:ring-amber-500 w-60 ${
                  isDayMode ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                }`}
              />
            </div>
          </div>

          <div className="overflow-x-auto mt-4">
            <table className="w-full text-xs text-left">
              <thead className={`text-[11px] uppercase font-bold border-b ${
                isDayMode ? 'bg-slate-50 text-slate-600 border-slate-200' : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}>
                <tr>
                  <th className="py-3 px-4">कार्ड क्र.</th>
                  <th className="py-3 px-4">सभासदाचे नाव</th>
                  <th className="py-3 px-4">प्रगती (३० महिने)</th>
                  <th className="py-3 px-4">जमा रक्कम ₹</th>
                  <th className="py-3 px-4">लक्ष्य रक्कम ₹</th>
                  <th className="py-3 px-4">५% बोनस फायदा</th>
                  <th className="py-3 px-4">मॅच्युरिटी स्थिती</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {maturityMembers.slice(0, 25).map((m) => (
                  <tr key={m.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono font-black text-amber-400">
                      #{m.cardNo}
                    </td>
                    <td className="py-3 px-4 font-bold text-white">
                      {m.memberName}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-amber-400 h-full rounded-full"
                            style={{ width: `${m.progressPct}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">
                          {m.paidMonths}/30
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                      ₹{m.totalDeposited.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      ₹{m.targetTotal.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-amber-400">
                      +₹{m.bonusBenefit.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      {m.isEligibleForGift ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          ✓ गिफ्ट व बोनस पात्र
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400">
                          चालू ({30 - m.paidMonths} महिने बाकी)
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: EDIT PRIZE FOR A MONTH                           */}
      {/* ========================================================= */}
      {editingPrizeMonth !== null && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden ${
            isDayMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <div className="p-5 border-b border-slate-700/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black">महिना {editingPrizeMonth} चे बक्षीस बदला</h3>
                  <p className="text-xs text-slate-400 mt-0.5">या ड्रॉसाठी हवे ते प्रॉडक्ट किंवा वस्तू टाईप करा.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingPrizeMonth(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1.5">
                  बक्षीस / वस्तूचे नाव (Prize / Item Name) *
                </label>
                <input
                  type="text"
                  value={editPrizeText}
                  onChange={(e) => setEditPrizeText(e.target.value)}
                  placeholder="उदा. Smart 4K UHD LED TV 43' (किंमत ₹३२,९९०)"
                  className={`w-full px-4 py-3 rounded-2xl text-sm font-bold border focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    isDayMode ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                  }`}
                  autoFocus
                />
              </div>

              {/* Quick suggestions */}
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  जलद पर्याय (Quick Pick):
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Smart 4K UHD LED TV 43"',
                    'Whirlpool 190L Direct-Cool Refrigerator',
                    'Fully Automatic Washing Machine',
                    'Teak Wood Wardrobe / कपाट',
                    'Prestige 4-Jar Mixer Grinder',
                    '24K Gold Coin 1 Gram',
                    'Teakwood Double Bed 6x6',
                    '₹१०,००० रोख खरेदी व्हाउचर',
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setEditPrizeText(preset)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 cursor-pointer transition"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setTargetStockMonth(editingPrizeMonth);
                    setIsStockModalOpen(true);
                  }}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Boxes className="w-4 h-4" />
                  <span>स्टॉकमधून निवडा</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveMonthlyPrize(editingPrizeMonth, editPrizeText)}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>सेव्ह करा (Save Prize)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: EDIT WINNER PRIZE DETAILS                        */}
      {/* ========================================================= */}
      {editingWinner !== null && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden ${
            isDayMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <div className="p-5 border-b border-slate-700/50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black">
                  विजेत्याचे बक्षीस बदला (कार्ड #{editingWinner.cardNo})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  विजेता: {editingWinner.memberName} • महिना: {editingWinner.drawMonthWon || 1}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingWinner(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1.5">
                  सुधारित बक्षीस / वस्तूचे नाव (Prize Details) *
                </label>
                <input
                  type="text"
                  value={editWinnerPrizeText}
                  onChange={(e) => setEditWinnerPrizeText(e.target.value)}
                  placeholder="उदा. Samsung Smart TV 43' किंवा ₹२०,००० फर्निचर कूपन"
                  className={`w-full px-4 py-3 rounded-2xl text-sm font-bold border focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    isDayMode ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                  }`}
                  autoFocus
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingWinner(null)}
                  className="px-4 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
                >
                  रद्द
                </button>
                <button
                  type="button"
                  onClick={handleSaveWinnerPrize}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>अपडेट करा</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: SHOWROOM STOCK ITEM PICKER                       */}
      {/* ========================================================= */}
      {isStockModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] ${
            isDayMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <div className="p-5 border-b border-slate-700/50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black flex items-center gap-2">
                  <Boxes className="w-5 h-5 text-amber-400" />
                  <span>
                    दालनातील स्टॉकमधून बक्षीस निवडा {targetStockMonth ? `(महिना ${targetStockMonth})` : ''}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  एकूण {storeData.stock.length} प्रॉडक्ट्स उपलब्ध आहेत. बक्षीस म्हणून देण्याचे प्रॉडक्ट निवडा.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsStockModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-slate-700/40">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="प्रॉडक्ट नाव, ब्रँड, मॉडेल किंवा कॅटेगरी शोधा (उदा. LG, Samsung, Bed, Sofa, Godrej)..."
                  value={stockSearchQuery}
                  onChange={(e) => setStockSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs font-bold border focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    isDayMode ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                  }`}
                  autoFocus
                />
              </div>
            </div>

            <div className="p-4 overflow-y-auto space-y-2 flex-1 divide-y divide-slate-800/40">
              {filteredStockItems.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  कोणतेही प्रॉडक्ट आढळले नाही. कृपया इतर नाव शोधा.
                </div>
              ) : (
                filteredStockItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      const prizeStr = `${item.name} (${item.brand} ${item.model || ''}) - किंमत ₹${(item.salePrice || item.mrp || 0).toLocaleString('en-IN')}`;
                      const targetM = targetStockMonth || drawMonth;
                      handleSaveMonthlyPrize(targetM, prizeStr);
                      if (editingPrizeMonth !== null) {
                        setEditPrizeText(prizeStr);
                      }
                      setIsStockModalOpen(false);
                    }}
                    className={`p-3.5 rounded-2xl transition cursor-pointer flex items-center justify-between gap-3 ${
                      isDayMode ? 'hover:bg-slate-100' : 'hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 font-bold shrink-0">
                        {item.category === 'Electronics' ? '📺' : item.category === 'Furniture' ? '🛋️' : '🎁'}
                      </div>
                      <div>
                        <div className="font-black text-sm text-white">{item.name}</div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          ब्रँड: <span className="text-amber-300 font-bold">{item.brand}</span> • मॉडेल: {item.model || 'Standard'} • कॅटेगरी: {item.category}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-sm font-black text-emerald-400 font-mono">
                        ₹{(item.salePrice || item.mrp || 0).toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        स्टॉक: {item.stockQty} {item.unit || 'नग'}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-slate-700/50 flex justify-end">
              <button
                type="button"
                onClick={() => setIsStockModalOpen(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                बंद करा
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
