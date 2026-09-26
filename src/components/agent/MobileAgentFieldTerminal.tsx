import React, { useState, useEffect, useMemo } from 'react';
import {
  Smartphone,
  Search,
  CreditCard,
  Phone,
  MessageCircle,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Wallet,
  TrendingUp,
  MapPin,
  RefreshCw,
  Share2,
  DollarSign,
  ArrowRight,
  Layers,
  ShoppingBag,
  Clock,
  Printer,
  X,
  ChevronRight,
  Radio,
  Check,
  User,
  Building2,
  Calculator
} from 'lucide-react';
import { CardMember, CardTransaction, Customer, StoreData, StockItem } from '../../types';
import { StorageService } from '../../services/storageService';
import { NotificationService } from '../../services/notificationService';
import { useTheme } from '../../context/ThemeContext';
import { getCardFinancialSummary } from '../../utils/schemeUtils';

interface MobileAgentFieldTerminalProps {
  storeData: StoreData;
  onRefreshData: () => void;
  onClose?: () => void;
  onOpenCustomerKhata?: (customer: Customer) => void;
  defaultAgentName?: string;
  isStandalonePage?: boolean;
}

export const MobileAgentFieldTerminal: React.FC<MobileAgentFieldTerminalProps> = ({
  storeData,
  onRefreshData,
  onClose,
  onOpenCustomerKhata,
  defaultAgentName = 'Rahul Sharma (Field Agent)',
  isStandalonePage = false,
}) => {
  const { isDayMode } = useTheme();

  // Active Main Sub-Tab in Mobile Terminal
  const [activeTab, setActiveTab] = useState<'collection' | 'hishob' | 'customers' | 'stock' | 'sync'>('collection');

  // Active Agent Name
  const [currentAgent, setCurrentAgent] = useState<string>(() => {
    return localStorage.getItem('sai_active_agent_name') || defaultAgentName;
  });

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Monitor online / offline network state
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSyncStatusMsg('🟢 इंटरनेट पूर्ववत झाले! रिअल-टाईम सिंक चालू आहे.');
      handleManualSync();
    };
    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatusMsg('⚠️ ऑफलाइन मोड: इंटरनेट बंद आहे. नोंदी फोनमध्ये सुरक्षित राहतील.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleAgentChange = (name: string) => {
    setCurrentAgent(name);
    localStorage.setItem('sai_active_agent_name', name);
  };

  // Manual Force Sync with Server
  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncStatusMsg('सर्व्हरसोबत डेटा सिंक होत आहे...');
    try {
      const serverData = await StorageService.pullFromServer();
      if (serverData) {
        onRefreshData();
        setSyncStatusMsg('✅ सर्व डेटा मुख्य सर्व्हरवर यशस्वीरित्या सिंक झाला!');
      } else {
        // Push local state
        const current = StorageService.loadData();
        await StorageService.pushToServer(current);
        setSyncStatusMsg('✅ स्थानिक डेटा सर्व्हरवर सुरक्षित पाठवला गेला!');
      }
    } catch {
      setSyncStatusMsg('⚠️ सिंक करताना त्रुटी आली, डेटा स्थानिक मेमरीत सुरक्षित आहे.');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatusMsg(null), 4000);
    }
  };

  // --------------------------------------------------------------------------
  // TAB 1: WEEKLY COLLECTION (हप्ता वसुली)
  // --------------------------------------------------------------------------
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('All');
  const [collectAmount, setCollectAmount] = useState<string>('100');
  const [collectMode, setCollectMode] = useState<'Cash' | 'UPI'>('Cash');
  const [activeCollectingCardId, setActiveCollectingCardId] = useState<string | null>(null);
  const [lastCollectedTx, setLastCollectedTx] = useState<{
    tx: CardTransaction;
    member: CardMember;
  } | null>(null);

  // Extract distinct villages
  const villages = useMemo(() => {
    const set = new Set<string>();
    storeData.cardMembers.forEach((m) => {
      if (m.village) set.add(m.village.trim());
    });
    storeData.customers.forEach((c) => {
      if (c.village) set.add(c.village.trim());
      else if (c.city) set.add(c.city.trim());
    });
    return ['All', ...Array.from(set).filter(Boolean)];
  }, [storeData]);

  // Filtered Cards List
  const filteredCards = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return storeData.cardMembers.filter((m) => {
      const name = (m.memberName || '').toLowerCase();
      const phone = (m.phone || '');
      const cardNo = (m.cardNo || '').toLowerCase();
      const village = (m.village || m.address || '').toLowerCase();

      const matchesSearch =
        !q ||
        name.includes(q) ||
        phone.includes(q) ||
        cardNo.includes(q) ||
        village.includes(q);

      const matchesVillage =
        selectedVillage === 'All' ||
        (m.village || m.address || '').trim().toLowerCase() === selectedVillage.toLowerCase();

      return matchesSearch && matchesVillage;
    });
  }, [storeData.cardMembers, searchQuery, selectedVillage]);

  // Today's Stats for Weekly Collection
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayCardTransactions = useMemo(() => {
    return storeData.cardTransactions.filter((tx) => tx.date.startsWith(todayStr));
  }, [storeData.cardTransactions, todayStr]);

  const todayCashScheme = useMemo(() => {
    return todayCardTransactions
      .filter((tx) => tx.paymentMode === 'Cash')
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [todayCardTransactions]);

  const todayUpiScheme = useMemo(() => {
    return todayCardTransactions
      .filter((tx) => tx.paymentMode === 'UPI')
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [todayCardTransactions]);

  const todayTotalScheme = todayCashScheme + todayUpiScheme;

  // Handler for 1-Tap Collection
  const handleCollectHapta = (member: CardMember, customAmt?: number) => {
    const amt = customAmt || parseFloat(collectAmount) || 100;
    const nextWeek = (member.totalPaidMonths || 0) + 1;
    const cleanCardNum = member.cardNo.replace(/\D/g, '') || 'CARD';
    const generatedReceiptNo = `REC-${cleanCardNum}-${Math.floor(1000 + Math.random() * 9000)}`;

    const tx = StorageService.collectCardInstallment({
      cardMemberId: member.id,
      monthNumber: nextWeek,
      weekNumber: nextWeek,
      amount: amt,
      paymentMode: collectMode,
      collectedBy: currentAgent,
      receiptNo: generatedReceiptNo,
      remarks: `साप्ताहिक हप्ता क्र. #${nextWeek} - एजंट मोबाईल ॲप नोंद`,
    });

    onRefreshData();
    setLastCollectedTx({ tx, member });
    setActiveCollectingCardId(null);

    // Audio cue / tactile feedback if available
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([40, 30, 40]);
      }
    } catch {
      // ignore
    }

    NotificationService.addNotification({
      type: 'installment_collected',
      title: 'साप्ताहिक हप्ता जमा!',
      message: `${member.memberName} (कार्ड #${member.cardNo}) चे ₹${amt} जमा झाले.`,
      data: {
        amount: amt,
        cardNo: member.cardNo,
        customerName: member.memberName,
      },
    });
  };

  // 80mm Thermal Receipt Print for Mobile POS / Field Agents
  const handlePrint80mmThermalReceipt = (tx: CardTransaction, member: CardMember) => {
    const printWindow = window.open('', '_blank', 'width=440,height=700');
    if (!printWindow) return;

    const fin = getCardFinancialSummary(member);
    const todayPaid = tx.amount;
    const prevPaid = Math.max(0, fin.totalPaid - todayPaid);
    const totalSavings = fin.totalPaid;
    const targetVal = fin.schemeTarget;
    const exactBalance = Math.max(0, targetVal - totalSavings);
    const dateFormatted = new Date(tx.date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const timeFormatted = new Date(tx.date).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    const waGroupUrl = storeData.settings.whatsappGroupLink || 'https://chat.whatsapp.com/invite/shrisaienterprises';
    const upiUrl = `upi://pay?pa=8766486915@ybl&pn=Shri%20Sai%20Enterprises&am=${todayPaid}&cu=INR`;
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(upiUrl)}`;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>80mm POS Receipt - ${tx.receiptNo}</title>
        <style>
          @page { size: 80mm auto; margin: 2.5mm; }
          body {
            font-family: 'Courier New', Courier, monospace;
            width: 74mm;
            margin: 0 auto;
            padding: 4px;
            color: #000;
            font-size: 12px;
            line-height: 1.35;
            text-align: center;
          }
          .bold { font-weight: bold; }
          .header-title { font-size: 16px; font-weight: 900; margin-bottom: 2px; }
          .header-sub { font-size: 11px; font-weight: 600; }
          .divider { border-top: 1px dashed #000; margin: 5px 0; }
          .divider-double { border-top: 2px double #000; margin: 5px 0; }
          .row { display: flex; justify-content: space-between; text-align: left; margin: 2.5px 0; font-size: 11.5px; }
          .row-val { font-weight: bold; text-align: right; }
          .big-amount { font-size: 18px; font-weight: 900; margin: 4px 0; }
          .qr-box { margin: 6px auto; width: 110px; height: 110px; }
          .qr-box img { width: 110px; height: 110px; display: block; margin: 0 auto; }
          .highlight-box { font-size: 10.5px; font-weight: bold; border: 1px solid #000; padding: 4px; margin: 4px 0; }
          .footer { font-size: 10px; margin-top: 6px; }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="header-title">SHRI SAI ENTERPRISES</div>
        <div class="header-sub">श्री साई एंटरप्रायजेस (इलेक्ट्रॉनिक्स & फर्निचर शोरूम, वर्धा)</div>
        <div>मातोश्री सभागृह समोर, आर्वी रोड, पंजाब कॉलनी, वर्धा</div>
        <div>मो.: 8600122978 / 9175537365 / 8766486915</div>
        <div class="divider-double"></div>
        <div class="bold" style="font-size: 13px;">साप्ताहिक बचत योजना पावती (80mm POS)</div>
        <div class="divider"></div>
        <div class="row"><span>पावती क्र (Receipt No):</span><span class="row-val">${tx.receiptNo}</span></div>
        <div class="row"><span>दिनांक (Date & Time):</span><span class="row-val">${dateFormatted} ${timeFormatted}</span></div>
        <div class="row"><span>कार्ड क्र (Card No):</span><span class="row-val">#${member.cardNo}</span></div>
        <div class="row"><span>ग्राहक (Member Name):</span><span class="row-val">${member.memberName}</span></div>
        <div class="row"><span>गाव / पत्ता (Village):</span><span class="row-val">${member.village || member.address || 'वर्धा'}</span></div>
        <div class="row"><span>हप्ता क्र (Week / Installment):</span><span class="row-val">#${tx.weekNumber || tx.monthNumber}</span></div>
        <div class="divider"></div>
        <div class="row"><span>१. जुनी रक्कम (मागील जमा):</span><span class="row-val">₹${prevPaid.toLocaleString('en-IN')}/-</span></div>
        <div class="row" style="font-size: 13px; font-weight: bold;"><span>२. आज जमा हप्ता (Today Paid):</span><span class="row-val">₹${todayPaid.toLocaleString('en-IN')}/-</span></div>
        <div class="big-amount">₹${todayPaid.toLocaleString('en-IN')}/-</div>
        <div class="row"><span>३. आतापर्यंत एकूण जमा:</span><span class="row-val">₹${totalSavings.toLocaleString('en-IN')}/-</span></div>
        <div class="row"><span>४. कार्ड योजना एकूण उद्दिष्ट:</span><span class="row-val">₹${targetVal.toLocaleString('en-IN')}/-</span></div>
        <div class="row" style="font-size: 13px; font-weight: bold;"><span>५. कार्डमधील चालू शिल्लक बाकी:</span><span class="row-val" style="text-decoration: underline;">₹${exactBalance.toLocaleString('en-IN')}/-</span></div>
        <div class="divider"></div>
        <div class="highlight-box">
          हिशोब ताळमेळ: एकूण जमा ₹${totalSavings} + शिल्लक ₹${exactBalance} = एकूण उद्दिष्ट ₹${targetVal} (१००% अचूक)
        </div>
        <div class="row"><span>पेमेंट मोड:</span><span class="row-val">${tx.paymentMode || 'Cash'}</span></div>
        <div class="row"><span>वसुली प्रतिनिधी:</span><span class="row-val">${tx.collectedBy || currentAgent}</span></div>
        <div class="divider"></div>
        <div class="bold" style="font-size: 10.5px;">🎁 लकी ड्रॉ, बंपर योजना व ऑफर्ससाठी ग्रुपला जॉईन व्हा:</div>
        <div style="font-size: 9.5px; word-break: break-all; margin: 2px 0;">${waGroupUrl}</div>
        <div class="qr-box">
          <img src="${qrApiUrl}" alt="UPI / WhatsApp QR" />
        </div>
        <div style="font-size: 9px;">Scan QR for UPI Payment • UPI: 8766486915@ybl</div>
        <div class="divider-double"></div>
        <div class="footer">
          श्री साई एंटरप्रायजेसवर विश्वास ठेवल्याबद्दल मनःपूर्वक धन्यवाद! 🙏<br/>
          (संगणकीय अधिकृत पावती - सहीची गरज नाही)
        </div>
        <script>
          window.onload = function() {
            window.focus();
            setTimeout(function() { window.print(); }, 250);
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // WhatsApp Receipt to Customer
  const handleSendWhatsAppReceipt = (tx: CardTransaction, member: CardMember) => {
    const fin = getCardFinancialSummary(member);
    const nowTime = new Date(tx.date).toLocaleTimeString('mr-IN', { hour: '2-digit', minute: '2-digit' });
    const nowDate = new Date(tx.date).toLocaleDateString('mr-IN');
    const todayPaid = tx.amount;
    const prevPaid = Math.max(0, fin.totalPaid - todayPaid);
    const totalSavings = fin.totalPaid;
    const targetVal = fin.schemeTarget;
    const exactBalance = Math.max(0, targetVal - totalSavings);
    const waGroupUrl = storeData.settings.whatsappGroupLink || 'https://chat.whatsapp.com/invite/shrisaienterprises';
    const cardCleanNum = member.cardNo.replace(/\D/g, '') || member.cardNo;
    const passbookUrl = `https://shrisaient.in/passbook?card=${cardCleanNum}`;

    let msg = `🚩 *श्री साई एंटरप्रायजेस, वर्धा* 🚩\n`;
    msg += `*(इलेक्ट्रॉनिक्स व फर्निचर शोरूम • ३०-महिने बचत योजना)*\n`;
    msg += `====================================\n`;
    msg += `🧾 *साप्ताहिक हप्ता जमा पावती / Weekly Collection Slip*\n`;
    msg += `====================================\n`;
    msg += `👤 *ग्राहक / सभासद:* ${member.memberName}\n`;
    msg += `💳 *कार्ड नंबर:* #${member.cardNo} (${member.schemeName || 'योजना १'})\n`;
    msg += `🧾 *पावती क्र. (Receipt No):* ${tx.receiptNo}\n`;
    msg += `📅 *दिनांक:* ${nowDate} (वेळ: ${nowTime})\n`;
    msg += `🗓️ *हप्ता क्र.:* #${tx.weekNumber || tx.monthNumber}\n`;
    msg += `📍 *गाव / पत्ता:* ${member.village || member.address || 'वर्धा'}\n`;
    msg += `------------------------------------\n`;
    msg += `⏳ *१. जुनी रक्कम (मागील जमा):* ₹${prevPaid.toLocaleString('en-IN')}/-\n`;
    msg += `💵 *२. आजची जमा रक्कम (Today Paid):* ₹${todayPaid.toLocaleString('en-IN')}/- [${tx.paymentMode === 'UPI' ? 'ऑनलाइन UPI' : 'रोख / Cash'}]\n`;
    msg += `💰 *३. आतापर्यंत एकूण जमा:* ₹${totalSavings.toLocaleString('en-IN')}/-\n`;
    msg += `🎯 *४. कार्ड योजना एकूण उद्दिष्ट:* ₹${targetVal.toLocaleString('en-IN')}/-\n`;
    msg += `📉 *५. कार्डमधील चालू शिल्लक बाकी (Exact Balance):* ₹${exactBalance.toLocaleString('en-IN')}/-\n`;
    msg += `✅ *हिशोब पडताळणी: ₹${totalSavings} + ₹${exactBalance} = ₹${targetVal} (१००% अचूक)*\n`;
    msg += `------------------------------------\n`;
    msg += `🎁 *लकी ड्रॉ, बंपर बक्षीस व स्पेशल ऑफर्ससाठी आमच्या अधिकृत व्हॉट्सॲप ग्रुपला जॉईन व्हा:*\n`;
    msg += `👉 *ग्रुप लिंक:* ${waGroupUrl}\n`;
    msg += `🌐 *लाईव्ह पासबुक पाहण्यासाठी:* ${passbookUrl}\n`;
    msg += `------------------------------------\n`;
    msg += `👨‍💼 *वसुली प्रतिनिधी:* ${tx.collectedBy || currentAgent}\n`;
    msg += `🙏 *श्री साई एंटरप्रायजेसवर विश्वास ठेवल्याबद्दल मनःपूर्वक धन्यवाद!*\n`;
    msg += `📞 *संपर्क:* 8600122978 / 9175537365 / 8766486915\n`;
    msg += `📍 *पत्ता:* मातोश्री सभागृह समोर, आर्वी रोड, पंजाब कॉलनी, वर्धा`;

    const cleanPhone = (member.phone || '').replace(/[^0-9]/g, '');
    const phoneParam = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const url = `https://wa.me/${phoneParam}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  // --------------------------------------------------------------------------
  // TAB 2: DAILY & WEEKLY SALES & CASH HISHOB (विक्री व गल्ला हिशोब)
  // --------------------------------------------------------------------------
  const [hishobTimeframe, setHishobTimeframe] = useState<'today' | 'yesterday' | 'week'>('today');

  const selectedDateRangeStr = useMemo(() => {
    const d = new Date();
    if (hishobTimeframe === 'yesterday') {
      d.setDate(d.getDate() - 1);
      return d.toISOString().slice(0, 10);
    }
    return d.toISOString().slice(0, 10);
  }, [hishobTimeframe]);

  const hishobTransactions = useMemo(() => {
    return storeData.transactions.filter((t) => {
      if (hishobTimeframe === 'week') {
        const d = new Date(t.date);
        const now = new Date();
        const diff = (now.getTime() - d.getTime()) / (1000 * 3600 * 24);
        return diff <= 7;
      }
      return t.date.startsWith(selectedDateRangeStr);
    });
  }, [storeData.transactions, hishobTimeframe, selectedDateRangeStr]);

  const hishobReceipts = useMemo(() => {
    return storeData.billReceipts.filter((r) => {
      if (hishobTimeframe === 'week') {
        const d = new Date(r.date);
        const now = new Date();
        const diff = (now.getTime() - d.getTime()) / (1000 * 3600 * 24);
        return diff <= 7;
      }
      return r.date.startsWith(selectedDateRangeStr);
    });
  }, [storeData.billReceipts, hishobTimeframe, selectedDateRangeStr]);

  const hishobSchemeTx = useMemo(() => {
    return storeData.cardTransactions.filter((c) => {
      if (hishobTimeframe === 'week') {
        const d = new Date(c.date);
        const now = new Date();
        const diff = (now.getTime() - d.getTime()) / (1000 * 3600 * 24);
        return diff <= 7;
      }
      return c.date.startsWith(selectedDateRangeStr);
    });
  }, [storeData.cardTransactions, hishobTimeframe, selectedDateRangeStr]);

  // Cash In Hand Calculation
  const cashFromSales = hishobTransactions
    .filter((t) => t.paymentMode === 'Cash' || (t.paidAmount && t.paymentMode !== 'UPI'))
    .reduce((sum, t) => sum + (t.paidAmount || 0), 0);

  const cashFromReceipts = hishobReceipts
    .filter((r) => r.paymentMode === 'Cash')
    .reduce((sum, r) => sum + r.amountPaid, 0);

  const cashFromScheme = hishobSchemeTx
    .filter((c) => c.paymentMode === 'Cash')
    .reduce((sum, c) => sum + c.amount, 0);

  const totalCashInHand = cashFromSales + cashFromReceipts + cashFromScheme;

  // UPI / Online Calculations
  const upiFromSales = hishobTransactions
    .filter((t) => t.paymentMode === 'UPI')
    .reduce((sum, t) => sum + (t.paidAmount || 0), 0);

  const upiFromReceipts = hishobReceipts
    .filter((r) => r.paymentMode === 'UPI')
    .reduce((sum, r) => sum + r.amountPaid, 0);

  const upiFromScheme = hishobSchemeTx
    .filter((c) => c.paymentMode === 'UPI')
    .reduce((sum, c) => sum + c.amount, 0);

  const totalUpiCollected = upiFromSales + upiFromReceipts + upiFromScheme;
  const grandTotalBusiness = totalCashInHand + totalUpiCollected;

  // Share Daily Agent Hishob to Shop Owner on WhatsApp
  const handleShareHishobToShop = () => {
    const shopPhone = storeData.settings.phone || '8600122978';
    const nowTime = new Date().toLocaleTimeString('mr-IN', { hour: '2-digit', minute: '2-digit' });
    const nowDate = new Date().toLocaleDateString('mr-IN');

    let text = `🚩 *श्री साई एंटरप्रायजेस, वर्धा - दैनिक एजंट हिशोब अहवाल* 🚩\n`;
    text += `--------------------------------\n`;
    text += `👤 एजंट नाव: *${currentAgent}*\n`;
    text += `📅 दिनांक: ${nowDate} (वेळ: ${nowTime})\n`;
    text += `--------------------------------\n`;
    text += `💵 *हातातील रोख रक्कम (Cash in Hand): ₹${totalCashInHand.toLocaleString('en-IN')}*\n`;
    text += `   • योजना आठवडी हप्ता रोख: ₹${cashFromScheme.toLocaleString('en-IN')}\n`;
    text += `   • काऊंटर बिल व पावती रोख: ₹${(cashFromSales + cashFromReceipts).toLocaleString('en-IN')}\n`;
    text += `--------------------------------\n`;
    text += `📱 *ऑनलाइन जमा (UPI / PhonePe): ₹${totalUpiCollected.toLocaleString('en-IN')}*\n`;
    text += `   • योजना UPI: ₹${upiFromScheme.toLocaleString('en-IN')}\n`;
    text += `   • विक्री UPI: ₹${(upiFromSales + upiFromReceipts).toLocaleString('en-IN')}\n`;
    text += `--------------------------------\n`;
    text += `💰 *एकूण एकत्रित व्यवसाय: ₹${grandTotalBusiness.toLocaleString('en-IN')}*\n`;
    text += `📝 एकूण पावती नोंदी: ${hishobSchemeTx.length + hishobReceipts.length + hishobTransactions.length} नोंदी\n`;
    text += `--------------------------------\n`;
    text += `✅ *हिशोब नोंद:* वरील सर्व रोख रक्कम व डिजिटल पावत्या दुकान काऊंटरला तपासणीसाठी सुपूर्द करण्यात येत आहेत.\n`;
    text += `📍 मातोश्री सभागृह समोर, आर्वी रोड, वर्धा.`;

    const url = `https://wa.me/91${shopPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // --------------------------------------------------------------------------
  // TAB 4: SHOWROOM STOCK & PRICE CHECKER
  // --------------------------------------------------------------------------
  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const [stockCategory, setStockCategory] = useState('All');

  const filteredStock = useMemo(() => {
    const q = stockSearchQuery.toLowerCase().trim();
    return storeData.stock.filter((s) => {
      const matchText = `${s.name} ${s.brand} ${s.category} ${s.model || ''}`.toLowerCase();
      const matchQ = !q || matchText.includes(q);
      const matchCat = stockCategory === 'All' || s.category === stockCategory;
      return matchQ && matchCat;
    });
  }, [storeData.stock, stockSearchQuery, stockCategory]);

  return (
    <div className={`flex flex-col min-h-screen ${
      isDayMode ? 'bg-slate-100 text-slate-900' : 'bg-[#090d1f] text-slate-100'
    } pb-24`}>
      {/* Top Mobile App Header */}
      <header className={`sticky top-0 z-30 px-3.5 py-2.5 border-b shadow-md backdrop-blur-md ${
        isDayMode
          ? 'bg-white/95 border-slate-200 text-slate-900'
          : 'bg-[#0b1226]/95 border-sky-500/20 text-white'
      }`}>
        <div className="flex items-center justify-between gap-2">
          {/* Brand & Terminal Identity */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 flex items-center justify-center font-black text-sm shadow-md shrink-0">
              साई
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-sm font-black tracking-tight truncate">
                  श्री साई एंटरप्रायजेस
                </h1>
                <span className="text-[10px] font-extrabold px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  एजंट टर्मिनल
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                हप्ता वसुली, दैनिक विक्री व गल्ला हिशोब
              </p>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Realtime Sync Status Pill */}
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border transition active:scale-95 ${
                isOnline
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-500 border-rose-500/30'
              }`}
              title="री-सिंक करा"
            >
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isSyncing ? 'सिंक सुरू...' : 'सिंक'}</span>
            </button>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-white"
                title="बंद करा"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Sync Status Banner */}
        {syncStatusMsg && (
          <div className="mt-2 text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-300 flex items-center justify-between animate-fadeIn">
            <span>{syncStatusMsg}</span>
            <button onClick={() => setSyncStatusMsg(null)} className="ml-2 font-black text-xs">✕</button>
          </div>
        )}

        {/* Active Agent Selector Bar */}
        <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between text-xs gap-2">
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
            <User className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-semibold text-[11px]">एजंट नाव:</span>
            <select
              value={currentAgent}
              onChange={(e) => handleAgentChange(e.target.value)}
              className="font-bold bg-transparent border-b border-amber-500/50 pb-0.5 outline-none text-slate-900 dark:text-amber-300 text-xs cursor-pointer"
            >
              <option value="Rahul Sharma (Field Agent)">राहुल शर्मा (Field Agent)</option>
              <option value="Mahesh Sharma (Manager)">महेश शर्मा (Manager)</option>
              <option value="Suresh Verma (Agent)">सुरेश वर्मा (Agent)</option>
              <option value="Dinesh Fulzele (Agent)">दिनेश फुलझेले (Agent)</option>
              <option value="Bhushan (Collector)">भूषण (Collector)</option>
              <option value="Store Counter Cashier">काऊंटर कॅशियर (Cashier)</option>
            </select>
          </div>

          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
            {new Date().toLocaleDateString('mr-IN', { day: '2-digit', month: 'short' })}
          </div>
        </div>
      </header>

      {/* Main Mode Sub-Navigation Tabs */}
      <div className={`sticky top-[93px] z-20 px-3 py-2 border-b backdrop-blur-md flex items-center gap-2 overflow-x-auto scrollbar-none ${
        isDayMode ? 'bg-white/90 border-slate-200' : 'bg-[#090d1f]/90 border-slate-800'
      }`}>
        <button
          onClick={() => setActiveTab('collection')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
            activeTab === 'collection'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
              : 'bg-slate-200/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>💰 आठवडी हप्ता वसुली</span>
          <span className="px-1.5 py-0.2 rounded-full bg-emerald-950 text-[10px] text-emerald-300">
            {filteredCards.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('hishob')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
            activeTab === 'hishob'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
              : 'bg-slate-200/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300'
          }`}
        >
          <Wallet className="w-3.5 h-3.5" />
          <span>📊 दैनिक विक्री व गल्ला हिशोब</span>
        </button>

        <button
          onClick={() => setActiveTab('customers')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
            activeTab === 'customers'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
              : 'bg-slate-200/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>👥 गाववार ग्राहक यादी</span>
        </button>

        <button
          onClick={() => setActiveTab('stock')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
            activeTab === 'stock'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
              : 'bg-slate-200/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>📦 शोरूम स्टॉक व दर</span>
        </button>
      </div>

      {/* Main Body Content */}
      <main className="flex-1 px-3 pt-3 space-y-3 max-w-4xl mx-auto w-full">

        {/* ---------------------------------------------------------------- */}
        {/* TAB 1: WEEKLY CARD COLLECTION (आठवडी हप्ता वसुली) */}
        {/* ---------------------------------------------------------------- */}
        {activeTab === 'collection' && (
          <div className="space-y-3">
            {/* Quick Agent Collection Stats Pill */}
            <div className={`p-3 rounded-2xl border shadow-sm ${
              isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
            }`}>
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/60 dark:border-slate-800">
                <span className="text-[11px] uppercase font-extrabold text-slate-500 dark:text-slate-400">
                  आजची एकूण वसुली ({new Date().toLocaleDateString('mr-IN')})
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  {todayCardTransactions.length} हप्ते जमा
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">
                    रोख (Cash)
                  </span>
                  <span className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    ₹{todayCashScheme.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">
                    ऑनलाईन UPI
                  </span>
                  <span className="text-sm sm:text-base font-black text-blue-600 dark:text-blue-400 font-mono">
                    ₹{todayUpiScheme.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">
                    एकूण जमा
                  </span>
                  <span className="text-sm sm:text-base font-black text-amber-600 dark:text-amber-400 font-mono">
                    ₹{todayTotalScheme.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Last Collected Success Alert & WhatsApp Share */}
            {lastCollectedTx && (
              <div className="p-3.5 rounded-2xl bg-emerald-600 text-white shadow-lg space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
                    <div>
                      <h4 className="font-black text-sm">हप्ता यशस्वी जमा झाला!</h4>
                      <p className="text-xs text-emerald-100">
                        {lastCollectedTx.member.memberName} (कार्ड #{lastCollectedTx.member.cardNo}) चे ₹{lastCollectedTx.tx.amount} जमा.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setLastCollectedTx(null)}
                    className="p-1 rounded-lg text-emerald-200 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <div className="pt-1 flex flex-wrap gap-2">
                  <button
                    onClick={() => handleSendWhatsAppReceipt(lastCollectedTx.tx, lastCollectedTx.member)}
                    className="flex-1 min-w-[140px] py-2 px-3 rounded-xl bg-white text-emerald-900 font-black text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                    <span>WhatsApp पावती पाठवा</span>
                  </button>
                  <button
                    onClick={() => handlePrint80mmThermalReceipt(lastCollectedTx.tx, lastCollectedTx.member)}
                    className="py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                    title="80mm Thermal Receipt (80 थर्मल प्रिंट)"
                  >
                    <Printer className="w-4 h-4" />
                    <span>80mm थर्मल प्रिंट</span>
                  </button>
                </div>
              </div>
            )}

            {/* Search & Village Filter Row */}
            <div className={`p-3 rounded-2xl border space-y-2.5 ${
              isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="कार्ड नंबर (#1001), ग्राहक नाव, मोबाईल किंवा गाव शोधा..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-9 pr-8 py-2.5 rounded-xl text-xs font-semibold border outline-none ${
                    isDayMode
                      ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-500'
                      : 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-emerald-500'
                  }`}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-3 text-slate-400 hover:text-white text-xs font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-500 shrink-0">गाव निवडा:</span>
                <select
                  value={selectedVillage}
                  onChange={(e) => setSelectedVillage(e.target.value)}
                  className={`flex-1 px-3 py-1.5 rounded-xl text-xs font-bold border outline-none ${
                    isDayMode ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                >
                  {villages.map((v) => (
                    <option key={v} value={v}>
                      {v === 'All' ? 'सर्व गावे (All Villages)' : v}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Member Cards List */}
            <div className="space-y-2.5">
              {filteredCards.length === 0 ? (
                <div className={`p-8 text-center rounded-2xl border text-xs text-slate-500 ${
                  isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                }`}>
                  कोणतेही कार्ड सापडले नाही. शोध शब्द किंवा गाव तपासा.
                </div>
              ) : (
                filteredCards.map((member) => {
                  const fin = getCardFinancialSummary(member);
                  const isCollectingThis = activeCollectingCardId === member.id;
                  const progressPct = Math.min(100, Math.round((fin.totalPaidMonths / (fin.durationMonths || 30)) * 100));

                  return (
                    <div
                      key={member.id}
                      className={`p-3.5 rounded-2xl border transition-all shadow-sm ${
                        isDayMode
                          ? 'bg-white border-slate-200 hover:border-emerald-400'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* Card Header & Member Info */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-mono font-black">
                              #{member.cardNo}
                            </span>
                            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                              {member.memberName}
                            </h3>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                            <span>📍 {member.village || member.address || 'वर्धा'}</span>
                            {member.phone && member.phone !== '0' && (
                              <>
                                <span>•</span>
                                <a href={`tel:${member.phone}`} className="text-emerald-600 dark:text-emerald-400 font-mono hover:underline">
                                  📞 {member.phone}
                                </a>
                              </>
                            )}
                          </p>
                        </div>

                        {/* Status Badge */}
                        <div className="text-right shrink-0">
                          <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 block">
                            {fin.totalPaidMonths} / {fin.durationMonths} महिने
                          </span>
                          <span className="text-xs font-black text-rose-500 font-mono">
                            बाकी: ₹{fin.balanceDue.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-2.5 w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full rounded-full transition-all"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>

                      {/* Bottom Actions: Quick Collection Toggle */}
                      {!isCollectingThis ? (
                        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                          <div className="text-[11px] text-slate-500">
                            जमा: <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">₹{fin.totalPaid.toLocaleString('en-IN')}</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveCollectingCardId(member.id);
                              setCollectAmount(String(member.monthlyAmount && member.monthlyAmount <= 500 ? member.monthlyAmount : 100));
                            }}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer touch-manipulation min-h-[38px]"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>हप्ता जमा करा</span>
                          </button>
                        </div>
                      ) : (
                        /* Expanded In-Card Collection Tray */
                        <div className="mt-3 pt-3 border-t border-emerald-500/30 space-y-2.5 bg-emerald-500/5 p-2.5 rounded-xl border border-emerald-500/20">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-extrabold text-emerald-700 dark:text-emerald-300">
                              हप्ता क्र. #{fin.totalPaidMonths + 1} भरणे:
                            </span>
                            <button
                              onClick={() => setActiveCollectingCardId(null)}
                              className="text-slate-400 hover:text-white font-bold text-xs"
                            >
                              रद्द करा ✕
                            </button>
                          </div>

                          {/* Quick Amount Pills */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {[100, 150, 200, 250, 500, 1000].map((pill) => (
                              <button
                                key={pill}
                                type="button"
                                onClick={() => setCollectAmount(String(pill))}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                                  collectAmount === String(pill)
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                                }`}
                              >
                                ₹{pill}
                              </button>
                            ))}
                          </div>

                          {/* Custom Amount & Mode Row */}
                          <div className="flex items-center gap-2">
                            <div className="flex-1 relative">
                              <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">₹</span>
                              <input
                                type="number"
                                value={collectAmount}
                                onChange={(e) => setCollectAmount(e.target.value)}
                                className={`w-full pl-6 pr-2 py-1.5 rounded-lg text-xs font-bold border outline-none ${
                                  isDayMode ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                                }`}
                                placeholder="रक्कम"
                              />
                            </div>

                            {/* Mode toggle */}
                            <div className="flex rounded-lg p-0.5 bg-slate-200 dark:bg-slate-800 text-[11px] font-bold">
                              <button
                                type="button"
                                onClick={() => setCollectMode('Cash')}
                                className={`px-2 py-1 rounded-md transition ${
                                  collectMode === 'Cash' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400'
                                }`}
                              >
                                रोख 💵
                              </button>
                              <button
                                type="button"
                                onClick={() => setCollectMode('UPI')}
                                className={`px-2 py-1 rounded-md transition ${
                                  collectMode === 'UPI' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400'
                                }`}
                              >
                                UPI 📱
                              </button>
                            </div>
                          </div>

                          {/* Submit Collection Button */}
                          <button
                            type="button"
                            onClick={() => handleCollectHapta(member)}
                            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md active:scale-95 cursor-pointer touch-manipulation min-h-[44px]"
                          >
                            <Check className="w-4 h-4 stroke-[3]" />
                            <span>₹{collectAmount} जमा करा व सिंक करा</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* TAB 2: DAILY & WEEKLY SALES & CASH HISHOB (विक्री व गल्ला हिशोब) */}
        {/* ---------------------------------------------------------------- */}
        {activeTab === 'hishob' && (
          <div className="space-y-3">
            {/* Timeframe selector */}
            <div className="flex rounded-2xl p-1 bg-slate-200 dark:bg-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => setHishobTimeframe('today')}
                className={`flex-1 py-1.5 rounded-xl transition ${
                  hishobTimeframe === 'today'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-white'
                }`}
              >
                आजचा हिशोब (Today)
              </button>
              <button
                type="button"
                onClick={() => setHishobTimeframe('yesterday')}
                className={`flex-1 py-1.5 rounded-xl transition ${
                  hishobTimeframe === 'yesterday'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-white'
                }`}
              >
                कालचा हिशोब (Yesterday)
              </button>
              <button
                type="button"
                onClick={() => setHishobTimeframe('week')}
                className={`flex-1 py-1.5 rounded-xl transition ${
                  hishobTimeframe === 'week'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-white'
                }`}
              >
                चालू आठवडा (This Week)
              </button>
            </div>

            {/* Master Cash In Hand Highlight Box */}
            <div className="p-4 rounded-2xl bg-gradient-to-tr from-emerald-700 via-teal-700 to-emerald-800 text-white shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-200">
                    हातातील प्रत्यक्ष रोख (Cash in Hand)
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black font-mono tracking-tight mt-0.5">
                    ₹{totalCashInHand.toLocaleString('en-IN')}
                  </h2>
                </div>
                <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
                  <Wallet className="w-6 h-6 text-emerald-200" />
                </div>
              </div>

              <div className="pt-2 border-t border-white/20 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-emerald-200 text-[10px] block">योजना रोख वसुली:</span>
                  <span className="font-bold font-mono">₹{cashFromScheme.toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-emerald-200 text-[10px] block">काऊंटर विक्री रोख:</span>
                  <span className="font-bold font-mono">₹{(cashFromSales + cashFromReceipts).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Secondary KPI Cards */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className={`p-3 rounded-2xl border shadow-sm ${
                isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">
                  डिजिटल / UPI जमा
                </span>
                <span className="text-lg font-black text-blue-600 dark:text-blue-400 font-mono mt-0.5 block">
                  ₹{totalUpiCollected.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">
                  योजना: ₹{upiFromScheme.toLocaleString('en-IN')} • विक्री: ₹{(upiFromSales + upiFromReceipts).toLocaleString('en-IN')}
                </span>
              </div>

              <div className={`p-3 rounded-2xl border shadow-sm ${
                isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">
                  एकूण व्यवसाय (Total)
                </span>
                <span className="text-lg font-black text-amber-600 dark:text-amber-400 font-mono mt-0.5 block">
                  ₹{grandTotalBusiness.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">
                  एकूण {hishobSchemeTx.length + hishobReceipts.length + hishobTransactions.length} नोंदी
                </span>
              </div>
            </div>

            {/* Share to Owner Button */}
            <button
              onClick={handleShareHishobToShop}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>📲 दुकान मालकाला आजचा संपूर्ण हिशोब WhatsApp वर पाठवा</span>
            </button>

            {/* Itemized Transactions Breakdown */}
            <div className={`p-3.5 rounded-2xl border space-y-2.5 ${
              isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}>
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                आजच्या सर्व नोंदींचा तपशील ({hishobSchemeTx.length + hishobReceipts.length + hishobTransactions.length})
              </h3>

              <div className="space-y-2 max-h-72 overflow-y-auto">
                {/* Scheme Installments */}
                {hishobSchemeTx.map((tx) => (
                  <div key={tx.id} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 dark:text-white">{tx.memberName}</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-amber-500/20 text-amber-600 dark:text-amber-300">
                          #{tx.cardNo}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(tx.date).toLocaleTimeString('mr-IN', { hour: '2-digit', minute: '2-digit' })} • {tx.receiptNo}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        +₹{tx.amount.toLocaleString('en-IN')}
                      </span>
                      <span className="block text-[10px] font-bold text-slate-400">
                        {tx.paymentMode === 'UPI' ? '📱 UPI' : '💵 रोख'}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Sales Transactions */}
                {hishobTransactions.map((tx) => (
                  <div key={tx.id} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 dark:text-white">{tx.customerName}</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-purple-500/20 text-purple-600 dark:text-purple-300">
                          विक्री बिल #{tx.invoiceNo}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(tx.date).toLocaleTimeString('mr-IN', { hour: '2-digit', minute: '2-digit' })} • {tx.items?.map(i => i.name).join(', ') || 'Showroom Sale'}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                        +₹{(tx.paidAmount || tx.grandTotal).toLocaleString('en-IN')}
                      </span>
                      <span className="block text-[10px] font-bold text-slate-400">
                        {tx.paymentMode === 'UPI' ? '📱 UPI' : '💵 रोख'}
                      </span>
                    </div>
                  </div>
                ))}

                {hishobSchemeTx.length === 0 && hishobTransactions.length === 0 && (
                  <div className="text-center py-6 text-xs text-slate-500">
                    या कालावधीत कोणतीही नोंद उपलब्ध नाही.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* TAB 3: CUSTOMER DIRECTORY & VILLAGE KHATA (गाववार ग्राहक उधारी) */}
        {/* ---------------------------------------------------------------- */}
        {activeTab === 'customers' && (
          <div className="space-y-3">
            <div className={`p-3 rounded-2xl border space-y-2 ${
              isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="ग्राहक नाव, फोन किंवा गाव शोधा..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs font-semibold border outline-none ${
                    isDayMode ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-500 shrink-0">गाव:</span>
                <select
                  value={selectedVillage}
                  onChange={(e) => setSelectedVillage(e.target.value)}
                  className={`flex-1 px-3 py-1.5 rounded-xl text-xs font-bold border outline-none ${
                    isDayMode ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                >
                  {villages.map((v) => (
                    <option key={v} value={v}>
                      {v === 'All' ? 'सर्व गावे' : v}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2.5">
              {storeData.customers
                .filter((c) => {
                  const q = searchQuery.toLowerCase().trim();
                  const matchQ = !q || c.name.toLowerCase().includes(q) || c.phone.includes(q) || (c.village || '').toLowerCase().includes(q);
                  const matchV = selectedVillage === 'All' || (c.village || c.city || '').trim().toLowerCase() === selectedVillage.toLowerCase();
                  return matchQ && matchV;
                })
                .map((cust) => (
                  <div
                    key={cust.id}
                    className={`p-3.5 rounded-2xl border shadow-sm flex items-center justify-between gap-3 ${
                      isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {cust.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 flex items-center gap-2">
                        <span>📍 {cust.village || cust.city || 'वर्धा'}</span>
                        <span>•</span>
                        <a href={`tel:${cust.phone}`} className="text-emerald-600 font-mono">
                          📞 {cust.phone}
                        </a>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 block">उधारी बाकी:</span>
                      <span className={`text-sm font-black font-mono ${
                        cust.currentBalance > 0 ? 'text-rose-500' : 'text-emerald-500'
                      }`}>
                        {cust.currentBalance > 0 ? `₹${cust.currentBalance.toLocaleString('en-IN')}` : '₹० (निरंक)'}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* TAB 4: SHOWROOM STOCK & PRICE CHECKER (स्टॉक व दर) */}
        {/* ---------------------------------------------------------------- */}
        {activeTab === 'stock' && (
          <div className="space-y-3">
            <div className={`p-3 rounded-2xl border space-y-2 ${
              isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="टीव्ही, सोफा, बेड, फ्रिज, वॉशिंग मशिन, कपाट शोधा..."
                  value={stockSearchQuery}
                  onChange={(e) => setStockSearchQuery(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs font-semibold border outline-none ${
                    isDayMode ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                {['All', 'Electronics', 'Furniture', 'Home Appliances'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setStockCategory(cat)}
                    className={`px-3 py-1 rounded-xl font-bold whitespace-nowrap transition ${
                      stockCategory === cat
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {cat === 'All' ? 'सर्व' : cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2.5">
              {filteredStock.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  कोणतीही वस्तू सापडली नाही.
                </div>
              ) : (
                filteredStock.map((item) => {
                  const weeklyEmi = Math.round(item.salePrice / 120);
                  const monthlyEmi = Math.round(item.salePrice / 30);

                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-2xl border shadow-sm ${
                        isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase">
                            {item.brand} • {item.category}
                          </span>
                          <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                            {item.name}
                          </h4>
                          {item.model && (
                            <span className="text-[11px] text-slate-500 font-mono">
                              मॉडेल: {item.model}
                            </span>
                          )}
                        </div>

                        <div className="text-right">
                          <span className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono block">
                            ₹{item.salePrice.toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] text-slate-500 line-through font-mono">
                            MRP: ₹{item.mrp.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      {/* 30-Month Scheme Breakdown Pill for Field Agent Pitch */}
                      <div className="mt-2.5 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300 font-bold">
                          <Calculator className="w-3.5 h-3.5" />
                          <span>३०-महिने सुलभ योजना:</span>
                        </div>
                        <div className="text-right font-mono font-bold text-amber-700 dark:text-amber-300">
                          <span>~₹{weeklyEmi}/आठवडा</span>
                          <span className="text-slate-400 font-normal mx-1">किंवा</span>
                          <span>~₹{monthlyEmi}/महिना</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </main>

      {/* Floating Bottom Quick Bar for Field Agent on Mobile */}
      <footer className={`fixed bottom-0 left-0 right-0 z-30 border-t backdrop-blur-2xl p-2 px-4 flex items-center justify-around select-none shadow-2xl ${
        isDayMode
          ? 'bg-white/95 border-slate-200 text-slate-600'
          : 'bg-[#060a17]/95 border-sky-500/20 text-slate-300'
      }`}>
        <button
          onClick={() => setActiveTab('collection')}
          className={`flex flex-col items-center justify-center py-1 px-2 text-[10px] font-extrabold transition cursor-pointer min-w-[55px] ${
            activeTab === 'collection'
              ? 'text-emerald-600 dark:text-emerald-400 font-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Calendar className="w-5 h-5 mb-0.5" />
          <span>हप्ता वसुली</span>
        </button>

        <button
          onClick={() => setActiveTab('hishob')}
          className={`flex flex-col items-center justify-center py-1 px-2 text-[10px] font-extrabold transition cursor-pointer min-w-[55px] ${
            activeTab === 'hishob'
              ? 'text-amber-600 dark:text-amber-400 font-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Wallet className="w-5 h-5 mb-0.5" />
          <span>विक्री हिशोब</span>
        </button>

        <button
          onClick={handleManualSync}
          disabled={isSyncing}
          className="flex flex-col items-center justify-center py-1 px-2 text-[10px] font-extrabold text-blue-500 transition cursor-pointer min-w-[55px]"
        >
          <RefreshCw className={`w-5 h-5 mb-0.5 ${isSyncing ? 'animate-spin text-amber-500' : ''}`} />
          <span>{isSyncing ? 'सिंक...' : 'क्लाउड सिंक'}</span>
        </button>

        <button
          onClick={() => setActiveTab('customers')}
          className={`flex flex-col items-center justify-center py-1 px-2 text-[10px] font-extrabold transition cursor-pointer min-w-[55px] ${
            activeTab === 'customers'
              ? 'text-sky-600 dark:text-sky-400 font-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Building2 className="w-5 h-5 mb-0.5" />
          <span>गाव खाती</span>
        </button>

        <button
          onClick={() => setActiveTab('stock')}
          className={`flex flex-col items-center justify-center py-1 px-2 text-[10px] font-extrabold transition cursor-pointer min-w-[55px] ${
            activeTab === 'stock'
              ? 'text-purple-600 dark:text-purple-400 font-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShoppingBag className="w-5 h-5 mb-0.5" />
          <span>स्टॉक दर</span>
        </button>
      </footer>
    </div>
  );
};
