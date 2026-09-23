import React, { useState, useMemo } from 'react';
import {
  X,
  Crown,
  Sparkles,
  Gift,
  Share2,
  Printer,
  Plus,
  Trash2,
  Calculator,
  Building2,
  Phone,
  Calendar,
  CheckCircle2,
  Tag,
  Percent,
  Check,
  Package,
  Layers,
  Heart
} from 'lucide-react';
import { BusinessSettings } from '../types';

export interface PackageItem {
  id: string;
  name: string;
  category: 'Furniture' | 'Electronics' | 'Appliance' | 'Gift';
  mrp: number;
  dealPrice: number;
  qty: number;
  specs?: string;
  isFreeGift?: boolean;
}

export interface PackagePreset {
  id: string;
  title: string;
  marathiTitle: string;
  tagline: string;
  badge: string;
  badgeColor: string;
  freeGiftsNote: string;
  defaultDownPayment: number;
  defaultTenure: number;
  items: PackageItem[];
}

const PACKAGE_PRESETS: PackagePreset[] = [
  {
    id: 'royal-wedding',
    title: 'Royal Teak Wedding Combo',
    marathiTitle: '👑 शाही लग्न बस्ता पॅकेज',
    tagline: 'सागवान फर्निचर + ब्रँडेड इलेक्ट्रॉनिक्सचे संपूर्ण विवाह पॅकेज',
    badge: 'सर्वात लोकप्रिय',
    badgeColor: 'bg-amber-500 text-slate-950',
    freeGiftsNote: '🎁 २ ऑर्थो उशा + १ डबल बेडशीट + टीव्ही वॉल माउंट + कुलर ट्रॉली मोफत!',
    defaultDownPayment: 30000,
    defaultTenure: 18,
    items: [
      { id: 'item-1', name: 'सागवान ६×६.५ फूट किंग बेड (Pure Teakwood)', category: 'Furniture', mrp: 32000, dealPrice: 27500, qty: 1, specs: 'सागवान लाकूड, हेवी बॉक्स स्टोरेज' },
      { id: 'item-2', name: '३-डोअर हेवी सागवान/स्टील कपाट (Wardrobe)', category: 'Furniture', mrp: 26500, dealPrice: 22999, qty: 1, specs: 'मिरर + लॉकर + ड्रेसिंग युनिट' },
      { id: 'item-3', name: '५-सीटर लक्झरी सोफा सेट (३+१+१)', category: 'Furniture', mrp: 28000, dealPrice: 23500, qty: 1, specs: 'हाय-डेन्सिटी फोम, प्रीमियम फॅब्रिक' },
      { id: 'item-4', name: '४३" 4K Ultra HD Smart Google TV', category: 'Electronics', mrp: 34990, dealPrice: 26999, qty: 1, specs: 'LG / Samsung 4K HDR, Voice Remote' },
      { id: 'item-5', name: '२४०L डबल डोअर इन्व्हर्टर रेफ्रिजरेटर', category: 'Appliance', mrp: 29990, dealPrice: 24500, qty: 1, specs: 'Whirlpool / Haier 3-Star Inverter' },
      { id: 'item-6', name: '७.५ kg सेमी-ऑटो वॉशिंग मशीन', category: 'Appliance', mrp: 16500, dealPrice: 13499, qty: 1, specs: '५-स्टार रेटिंग, पॉवर स्क्रब' },
      { id: 'item-7', name: '८०L हेवी ड्युटी जंबो रूम कुलर', category: 'Appliance', mrp: 11500, dealPrice: 8999, qty: 1, specs: 'हनीकोंब पॅड, कॉपर मोटर' },
      { id: 'item-8', name: 'भेट: २ कम्फर्ट उशा + १ बेडशीट सेट', category: 'Gift', mrp: 2500, dealPrice: 0, qty: 1, specs: 'साई स्पेशल वेडिंग गिफ्ट', isFreeGift: true },
      { id: 'item-9', name: 'भेट: टीव्ही वॉल माउंट + कुलर ट्रॉली', category: 'Gift', mrp: 1800, dealPrice: 0, qty: 1, specs: 'मोफत इन्स्टॉलेशन किट', isFreeGift: true },
    ]
  },
  {
    id: 'shubh-wedding',
    title: 'Standard Shubh Vivah Combo',
    marathiTitle: '🌸 शुभ विवाह मध्यम बस्ता पॅकेज',
    tagline: 'किफायतशीर किमतीत सर्व आवश्यक फर्निचर व गृहोपयोगी वस्तू',
    badge: 'बजेट फ्रेंडली',
    badgeColor: 'bg-emerald-600 text-white',
    freeGiftsNote: '🎁 १ डबल बेडशीट + टीव्ही वॉल माउंट किट मोफत!',
    defaultDownPayment: 20000,
    defaultTenure: 12,
    items: [
      { id: 'item-11', name: 'सागवान ५×६.५ फूट क्वीन बेड (Teak Finish)', category: 'Furniture', mrp: 22000, dealPrice: 18500, qty: 1, specs: 'स्टोरेजसह मजबूत फिनिश' },
      { id: 'item-12', name: '२-डोअर हेवी स्टील अलमिरा (Godrej Type)', category: 'Furniture', mrp: 16000, dealPrice: 13999, qty: 1, specs: 'डबल लॉकर व लेडीज मिरर' },
      { id: 'item-13', name: '३२" HD Smart LED TV (Google TV)', category: 'Electronics', mrp: 18990, dealPrice: 13999, qty: 1, specs: 'Frameless Display, Wi-Fi' },
      { id: 'item-14', name: '१९०L सिंगल डोअर डायरेक्ट कूल फ्रिज', category: 'Appliance', mrp: 18500, dealPrice: 15499, qty: 1, specs: '५-स्टार इन्व्हर्टर मॉडेल' },
      { id: 'item-15', name: '५०L पर्सनल डिझायनर कुलर', category: 'Appliance', mrp: 8500, dealPrice: 6999, qty: 1, specs: 'हाय-स्पीड एअर थ्रो' },
      { id: 'item-16', name: 'भेट: १ कॉटन डबल बेडशीट + टीव्ही वॉल माउंट', category: 'Gift', mrp: 1500, dealPrice: 0, qty: 1, specs: 'साई स्पेशल गिफ्ट', isFreeGift: true }
    ]
  },
  {
    id: 'griha-pravesh',
    title: 'Griha Pravesh Complete Home Package',
    marathiTitle: '🏠 गृहप्रवेश संपूर्ण होम पॅकेज',
    tagline: 'नवीन घराच्या वास्तूशांती व गृहप्रवेशासाठी सर्वोत्तम कॉम्बो',
    badge: 'नवीन घर स्पेशल',
    badgeColor: 'bg-indigo-600 text-white',
    freeGiftsNote: '🎁 टीव्ही वॉल माउंट + इन्स्टॉलेशन मोफत!',
    defaultDownPayment: 25000,
    defaultTenure: 15,
    items: [
      { id: 'item-21', name: '६-सीटर सागवान डायनिंग टेबल सेट', category: 'Furniture', mrp: 35000, dealPrice: 28999, qty: 1, specs: 'सागवान टेबल + ६ कुशन खुर्च्या' },
      { id: 'item-22', name: '५-सीटर कॉर्नर एल-शेप सोफा सेट', category: 'Furniture', mrp: 32000, dealPrice: 26500, qty: 1, specs: 'सुपर सॉफ्ट कुशनिंग' },
      { id: 'item-23', name: '४३" 4K Smart Google LED TV', category: 'Electronics', mrp: 34990, dealPrice: 26999, qty: 1, specs: 'Dolby Audio, Android 4K' },
      { id: 'item-24', name: '२६०L फ्रॉस्ट फ्री डबल डोअर फ्रिज', category: 'Appliance', mrp: 32000, dealPrice: 26499, qty: 1, specs: 'कन्व्हर्टिबल ३-इन-१' },
      { id: 'item-25', name: 'आरओ + युव्ही वॉटर प्युरिफायर (RO Filter)', category: 'Appliance', mrp: 12000, dealPrice: 8999, qty: 1, specs: '१० लिटर क्षमता, टीडीएस कंट्रोलर' }
    ]
  }
];

interface WeddingPackageQuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: BusinessSettings;
}

export const WeddingPackageQuotationModal: React.FC<WeddingPackageQuotationModalProps> = ({
  isOpen,
  onClose,
  settings
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('royal-wedding');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerVillage, setCustomerVillage] = useState<string>('');
  const [weddingDate, setWeddingDate] = useState<string>('');

  // Items State (editable)
  const [items, setItems] = useState<PackageItem[]>(() => {
    return PACKAGE_PRESETS[0].items;
  });

  // Package Level Overrides
  const [packageTitle, setPackageTitle] = useState<string>(PACKAGE_PRESETS[0].marathiTitle);
  const [freeGiftsNote, setFreeGiftsNote] = useState<string>(PACKAGE_PRESETS[0].freeGiftsNote);
  const [comboDiscountDiscountPercent, setComboDiscountPercent] = useState<number>(0);
  const [extraLumpSumDiscount, setExtraLumpSumDiscount] = useState<number>(0);

  // EMI & Finance Calculation
  const [downPayment, setDownPayment] = useState<number>(PACKAGE_PRESETS[0].defaultDownPayment);
  const [tenureMonths, setTenureMonths] = useState<number>(PACKAGE_PRESETS[0].defaultTenure);
  const [financePartner, setFinancePartner] = useState<'Bajaj Finserv' | 'TVS Credit' | 'Shop Khata EMI'>('Bajaj Finserv');
  const [showPrintView, setShowPrintView] = useState<boolean>(false);
  const [newItemName, setNewItemName] = useState<string>('');
  const [newItemPrice, setNewItemPrice] = useState<number>(0);
  const [showAddItem, setShowAddItem] = useState<boolean>(false);

  if (!isOpen) return null;

  // Handle Preset Change
  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const found = PACKAGE_PRESETS.find((p) => p.id === presetId);
    if (found) {
      setItems(found.items);
      setPackageTitle(found.marathiTitle);
      setFreeGiftsNote(found.freeGiftsNote);
      setDownPayment(found.defaultDownPayment);
      setTenureMonths(found.defaultTenure);
    }
  };

  // Calculations
  const totalMrp = useMemo(() => {
    return items.reduce((sum, it) => sum + (Number(it.mrp || 0) * (it.qty || 1)), 0);
  }, [items]);

  const itemsTotalDealPrice = useMemo(() => {
    return items.reduce((sum, it) => sum + (Number(it.dealPrice || 0) * (it.qty || 1)), 0);
  }, [items]);

  const finalComboPrice = useMemo(() => {
    const afterExtra = Math.max(0, itemsTotalDealPrice - extraLumpSumDiscount);
    return Math.round(afterExtra);
  }, [itemsTotalDealPrice, extraLumpSumDiscount]);

  const totalSavings = useMemo(() => {
    return Math.max(0, totalMrp - finalComboPrice);
  }, [totalMrp, finalComboPrice]);

  const loanAmount = useMemo(() => {
    return Math.max(0, finalComboPrice - downPayment);
  }, [finalComboPrice, downPayment]);

  const monthlyEmi = useMemo(() => {
    if (tenureMonths <= 0 || loanAmount <= 0) return 0;
    // Simple 0% or low-cost calculation for quotation
    return Math.round(loanAmount / tenureMonths);
  }, [loanAmount, tenureMonths]);

  // Remove item
  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  // Add custom item
  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || newItemPrice <= 0) return;
    const newItem: PackageItem = {
      id: `custom-${Date.now()}`,
      name: newItemName.trim(),
      category: 'Furniture',
      mrp: Math.round(newItemPrice * 1.25),
      dealPrice: newItemPrice,
      qty: 1,
      specs: 'कस्टम निवड'
    };
    setItems((prev) => [...prev, newItem]);
    setNewItemName('');
    setNewItemPrice(0);
    setShowAddItem(false);
  };

  // WhatsApp Share
  const handleWhatsAppShare = () => {
    const cleanPh = (customerPhone || '').replace(/\D/g, '').slice(-10);
    const storeName = settings.businessName || 'श्री साई एंटरप्रायझेस, वर्धा';
    const storeAddress = settings.address || 'मातोश्री सभागृह समोर, आर्वी रोड, पंजाब कॉलनी, वर्धा - ४४२००१';
    const storePhone = settings.ownerPhone || settings.phone || '9766911693 / 8766486915';
    const groupLink = settings.whatsappGroupLink || 'https://chat.whatsapp.com/CLcaeUq1bHH1RE0203oPaP?s=cl&p=a&mlu=4&ilr=4';

    let itemsListText = '';
    items.forEach((it, idx) => {
      const freeTag = it.isFreeGift ? ' 🎁 (मोफत भेट)' : '';
      itemsListText += `${idx + 1}. *${it.name}* (१ नग) - ${it.specs || ''}${freeTag}\n`;
    });

    const quoteMsg =
      `💐 *${packageTitle} - अधिकृत कोटेशन* 💐\n` +
      `🚩 *${storeName}* 🚩\n` +
      `(इलेक्ट्रॉनिक्स व सागवान फर्निचर शोभिवंत दालन)\n` +
      `--------------------------------\n` +
      (customerName ? `आदरणीय ग्राहक: *${customerName}* जी${customerVillage ? ` (${customerVillage})` : ''}\n` : '') +
      (weddingDate ? `शुभ विवाह / गृहप्रवेश तारीख: *${weddingDate}*\n` : '') +
      `कोटेशन तारीख: *${new Date().toLocaleDateString('mr-IN', { day: 'numeric', month: 'long', year: 'numeric' })}*\n` +
      `--------------------------------\n` +
      `📦 *पॅकेजमधील सर्व वस्तू:* \n${itemsListText}\n` +
      `🎁 *विशेष मोफत भेटी:* \n${freeGiftsNote}\n` +
      `--------------------------------\n` +
      `🏷️ मूळ एकूण MRP: ~₹${totalMrp.toLocaleString('en-IN')}~/-\n` +
      `🎉 *विशेष कॉम्बो बस्ता किंमत: फक्त ₹${finalComboPrice.toLocaleString('en-IN')}/-*\n` +
      `💰 *एकूण थेट बचत: ₹${totalSavings.toLocaleString('en-IN')}/- (धमाका ऑफर!)*\n` +
      `--------------------------------\n` +
      `💳 *सुलभ फायनान्स EMI हप्ता पर्याय (${financePartner}):*\n` +
      `• डाऊन पेमेंट: *₹${downPayment.toLocaleString('en-IN')}/-*\n` +
      `• मासिक हप्ता (EMI): *₹${monthlyEmi.toLocaleString('en-IN')}/- × ${tenureMonths} महिने*\n` +
      `• डॉक्युमेंट्स: आधार कार्ड, पॅन कार्ड, बँक पासबुक\n` +
      `--------------------------------\n` +
      `👉 *आमच्या अधिकृत WhatsApp ग्रुपला भेट द्या:* ${groupLink}\n\n` +
      `📍 *पत्ता:* ${storeAddress}\n` +
      `📞 *संपर्क / बुकिंग:* ${storePhone}\n` +
      `_शुभ कार्यात आपणास व आपल्या परिवारास मनःपूर्वक शुभेच्छा!_ 🙏`;

    const encoded = encodeURIComponent(quoteMsg);
    if (cleanPh && cleanPh.length === 10) {
      window.open(`https://wa.me/91${cleanPh}?text=${encoded}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${encoded}`, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-white dark:bg-[#0C1425] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden text-slate-900 dark:text-white">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-rose-700 via-pink-700 to-amber-700 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shadow-inner">
              <Crown className="w-6 h-6 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-xl font-black tracking-tight">
                  लग्न बस्ता व गृहप्रवेश पॅकेज कोटेशन
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-bold text-[10px] tracking-wider uppercase">
                  Wedding & Griha Pravesh Combo
                </span>
              </div>
              <p className="text-xs text-rose-100 font-medium">
                फर्निचर + टीव्ही + फ्रीज + कुलर कॉम्बो पॅकेज, थेट बचत व बजाज/TVS हप्ता कॅल्क्युलेटर
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPrintView(!showPrintView)}
              className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{showPrintView ? 'फॉर्म पहा' : 'A4 कोटेशन प्रिंट'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {showPrintView ? (
            /* Printable Formal A4 Sheet */
            <div id="printable-wedding-quotation" className="max-w-3xl mx-auto bg-white text-slate-950 p-6 sm:p-8 rounded-2xl border-2 border-slate-300 shadow-lg space-y-5 print:border-none print:shadow-none print:p-0 print:m-0">
              <div className="border-b-2 border-rose-600 pb-4 text-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                  अधिकृत विवाह बस्ता व कॉम्बो पॅकेज कोटेशन
                </span>
                <h1 className="text-2xl font-black uppercase text-slate-900 mt-2">
                  {settings.businessName || 'श्री साई एंटरप्रायझेस'}
                </h1>
                <p className="text-xs text-slate-600 font-medium">
                  इलेक्ट्रॉनिक्स शोभिवंत दालन व सागवान फर्निचर • {settings.address}
                </p>
                <p className="text-xs text-slate-700 font-bold mt-0.5">
                  📞 संपर्क: {settings.ownerPhone || '9766911693'} / {settings.phone || '8766486915'}
                </p>
              </div>

              {/* Customer Box */}
              <div className="bg-rose-50/70 p-3.5 rounded-xl border border-rose-200 flex flex-wrap justify-between items-center text-xs">
                <div>
                  <p className="text-slate-500 font-semibold">ग्राहकाचे नाव:</p>
                  <p className="text-sm font-black text-slate-900">{customerName || 'सन्माननीय ग्राहक'}</p>
                  {customerVillage && <p className="text-[11px] text-slate-600 font-medium">गाव/पत्ता: {customerVillage}</p>}
                </div>
                <div className="text-right">
                  <p className="text-slate-500 font-semibold">कोटेशन दिनांक: <span className="font-bold text-slate-800">{new Date().toLocaleDateString('mr-IN')}</span></p>
                  {customerPhone && <p className="text-slate-700 font-mono font-bold">मो: {customerPhone}</p>}
                  {weddingDate && <p className="text-rose-700 font-bold">शुभ मुहूर्त: {weddingDate}</p>}
                </div>
              </div>

              {/* Package Heading */}
              <div className="text-center py-2 bg-gradient-to-r from-rose-600 to-amber-600 text-white rounded-xl shadow-xs">
                <h2 className="text-base font-black tracking-wide">{packageTitle}</h2>
                <p className="text-[11px] text-rose-100">{freeGiftsNote}</p>
              </div>

              {/* Items Table */}
              <table className="w-full text-left text-xs border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 font-bold">
                    <th className="p-2 border-r border-slate-300 text-center w-8">क्र.</th>
                    <th className="p-2 border-r border-slate-300">साहित्याचे नाव व तपशील</th>
                    <th className="p-2 border-r border-slate-300 text-center w-12">नग</th>
                    <th className="p-2 border-r border-slate-300 text-right w-24">MRP (₹)</th>
                    <th className="p-2 text-right w-28">कॉम्बो ऑफर (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {items.map((it, idx) => (
                    <tr key={it.id} className={it.isFreeGift ? 'bg-amber-50/70 font-semibold' : ''}>
                      <td className="p-2 border-r border-slate-200 text-center font-mono">{idx + 1}</td>
                      <td className="p-2 border-r border-slate-200">
                        <span className="font-bold">{it.name}</span>
                        {it.specs && <span className="block text-[10px] text-slate-500">{it.specs}</span>}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-center font-mono">{it.qty}</td>
                      <td className="p-2 border-r border-slate-200 text-right font-mono text-slate-500 line-through">
                        ₹{(it.mrp * it.qty).toLocaleString('en-IN')}
                      </td>
                      <td className="p-2 text-right font-mono font-bold text-slate-900">
                        {it.isFreeGift ? (
                          <span className="text-emerald-700 font-black">🎁 मोफत</span>
                        ) : (
                          `₹${(it.dealPrice * it.qty).toLocaleString('en-IN')}`
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 border-t border-slate-300 text-xs">
                    <td colSpan={3} className="p-2 font-bold text-right border-r border-slate-300">
                      एकूण मूळ किंमत (Total MRP):
                    </td>
                    <td colSpan={2} className="p-2 text-right font-mono font-bold text-slate-500 line-through">
                      ₹{totalMrp.toLocaleString('en-IN')}
                    </td>
                  </tr>
                  <tr className="bg-emerald-50 border-t border-slate-300 text-sm font-black text-emerald-950">
                    <td colSpan={3} className="p-2.5 text-right uppercase border-r border-slate-300">
                      कॉम्बो पॅकेज किंमत (Special Package Price):
                    </td>
                    <td colSpan={2} className="p-2.5 text-right font-mono text-base text-rose-700 font-black">
                      ₹{finalComboPrice.toLocaleString('en-IN')}
                    </td>
                  </tr>
                  <tr className="bg-amber-50 border-t border-slate-300 text-xs font-bold text-amber-900">
                    <td colSpan={3} className="p-2 text-right border-r border-slate-300">
                      थेट ग्राहकाची बचत (Your Total Savings):
                    </td>
                    <td colSpan={2} className="p-2 text-right font-mono font-black text-emerald-700">
                      ₹{totalSavings.toLocaleString('en-IN')} ची भव्य बचत!
                    </td>
                  </tr>
                </tfoot>
              </table>

              {/* Finance EMI Box */}
              <div className="bg-blue-50/80 p-3.5 rounded-xl border border-blue-200 grid grid-cols-3 gap-3 text-xs text-center">
                <div>
                  <span className="text-slate-500 block text-[11px]">फायनान्स पार्टनर</span>
                  <strong className="font-bold text-blue-900 text-sm">{financePartner}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">डाऊन पेमेंट (Down Payment)</span>
                  <strong className="font-mono font-black text-slate-900 text-sm">₹{downPayment.toLocaleString('en-IN')}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">अंदाजे मासिक हप्ता ({tenureMonths} महिने)</span>
                  <strong className="font-mono font-black text-emerald-700 text-base">₹{monthlyEmi.toLocaleString('en-IN')}/महिना</strong>
                </div>
              </div>

              {/* Terms and Signatures */}
              <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-6 text-xs">
                <div className="text-[11px] text-slate-500 space-y-1">
                  <p className="font-bold text-slate-700">नियम व अटी:</p>
                  <p>१. होम डिलिव्हरी व इन्स्टॉलेशन सुविधा उपलब्ध.</p>
                  <p>२. इलेक्ट्रॉनिक्स वस्तूंवर कंपनी अधिकृत ऑन-साईट वॉरंटी लागू.</p>
                  <p>३. सागवान फर्निचरवर ५ वर्षे दीमक व स्ट्रक्चरल वॉरंटी.</p>
                </div>
                <div className="text-right space-y-8">
                  <div className="h-8"></div>
                  <p className="font-bold text-slate-800">
                    श्री साई एंटरप्रायझेस, वर्धा<br />
                    <span className="text-[10px] text-slate-500 font-normal">अधिकृत स्वाक्षरी / शिक्का</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 no-print">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center gap-1.5 shadow-md hover:bg-slate-800 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>कोटेशन प्रिंट करा</span>
                </button>
                <button
                  type="button"
                  onClick={handleWhatsAppShare}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md hover:bg-emerald-500 cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>WhatsApp वर पाठवा</span>
                </button>
              </div>
            </div>
          ) : (
            /* Builder View */
            <div className="space-y-5">
              {/* Presets Selector Pills */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  १. तयार पॅकेज निवडा (Package Presets):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {PACKAGE_PRESETS.map((p) => {
                    const isSelected = selectedPresetId === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => handleSelectPreset(p.id)}
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                          isSelected
                            ? 'border-rose-500 bg-rose-50/70 dark:bg-rose-950/30 shadow-md ring-2 ring-rose-500/20'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full absolute top-3 right-3 ${p.badgeColor}`}>
                          {p.badge}
                        </span>
                        <h3 className="font-black text-sm text-slate-900 dark:text-white pr-16">
                          {p.marathiTitle}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                          {p.tagline}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Customer Details Form */}
              <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  २. ग्राहक व लग्न/कार्य माहिती:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">ग्राहकाचे नाव</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="उदा. गजानन बोरकर"
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">मोबाईल नंबर (WhatsApp)</label>
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="उदा. 9881234567"
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">गाव / शहर</label>
                    <input
                      type="text"
                      value={customerVillage}
                      onChange={(e) => setCustomerVillage(e.target.value)}
                      placeholder="उदा. बोरगाव / हिंगणी / वर्धा"
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">विवाह / मुहूर्त तारीख</label>
                    <input
                      type="text"
                      value={weddingDate}
                      onChange={(e) => setWeddingDate(e.target.value)}
                      placeholder="उदा. २५ नोव्हेंबर २०२६"
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Items List in Package */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-rose-600" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      पॅकेजमधील वस्तूंची यादी ({items.length} आयटम्स):
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddItem(!showAddItem)}
                    className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>आणखी वस्तू जोडा (Add Item)</span>
                  </button>
                </div>

                {/* Add Item form */}
                {showAddItem && (
                  <form onSubmit={handleAddCustomItem} className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center gap-2 flex-wrap">
                    <input
                      type="text"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      placeholder="वस्तूचे नाव (उदा. ड्रेसिंग टेबल, मिक्सर)"
                      className="flex-1 min-w-[200px] px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                    <input
                      type="number"
                      value={newItemPrice || ''}
                      onChange={(e) => setNewItemPrice(Number(e.target.value))}
                      placeholder="किंमत (₹)"
                      className="w-28 px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-500 cursor-pointer"
                    >
                      जोडा
                    </button>
                  </form>
                )}

                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-64 overflow-y-auto">
                  {items.map((it) => (
                    <div key={it.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <strong className="text-slate-900 dark:text-white font-bold">{it.name}</strong>
                          {it.isFreeGift && (
                            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">
                              🎁 मोफत
                            </span>
                          )}
                        </div>
                        {it.specs && <p className="text-[11px] text-slate-500">{it.specs}</p>}
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-slate-400 line-through text-[11px] font-mono">
                          ₹{(it.mrp * it.qty).toLocaleString('en-IN')}
                        </span>
                        <span className="font-mono font-black text-slate-900 dark:text-white text-xs">
                          {it.isFreeGift ? '₹0' : `₹${(it.dealPrice * it.qty).toLocaleString('en-IN')}`}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(it.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                          title="काढून टाका"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Extra Lump Sum Discount & Finance Calculation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Total Summary Card */}
                <div className="bg-gradient-to-br from-rose-500/10 via-amber-500/10 to-transparent p-5 rounded-2xl border-2 border-rose-400/30 space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>कोटेशन सारांश व भव्य बचत:</span>
                  </h4>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>एकूण मूळ MRP:</span>
                      <span className="line-through font-mono">₹{totalMrp.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                      <span>अतिरिक्त विशेष सवलत (Lump Sum):</span>
                      <input
                        type="number"
                        value={extraLumpSumDiscount || ''}
                        onChange={(e) => setExtraLumpSumDiscount(Number(e.target.value))}
                        placeholder="₹ सूट"
                        className="w-24 px-2 py-1 text-xs text-right rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold"
                      />
                    </div>
                    <div className="pt-2 border-t border-rose-200 dark:border-slate-800 flex justify-between items-center">
                      <strong className="text-sm font-bold text-slate-900 dark:text-white">
                        अंतिम कॉम्बो बस्ता किंमत:
                      </strong>
                      <strong className="text-lg sm:text-xl font-black font-mono text-rose-600 dark:text-rose-400">
                        ₹{finalComboPrice.toLocaleString('en-IN')}
                      </strong>
                    </div>
                    <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold text-center text-xs">
                      🎉 ग्राहकाची एकूण थेट बचत: ₹{totalSavings.toLocaleString('en-IN')}/-!
                    </div>
                  </div>
                </div>

                {/* Finance EMI Box */}
                <div className="bg-slate-50 dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                    <Calculator className="w-4 h-4" />
                    <span>सुलभ मासिक EMI हप्ता कॅल्क्युलेटर:</span>
                  </h4>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 block mb-1">फायनान्स पार्टनर</label>
                      <select
                        value={financePartner}
                        onChange={(e) => setFinancePartner(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold cursor-pointer"
                      >
                        <option value="Bajaj Finserv">Bajaj Finserv</option>
                        <option value="TVS Credit">TVS Credit</option>
                        <option value="Shop Khata EMI">दुकान स्वतःची योजना</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 block mb-1">मुदत (महिने)</label>
                      <select
                        value={tenureMonths}
                        onChange={(e) => setTenureMonths(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold cursor-pointer"
                      >
                        <option value={6}>६ महिने</option>
                        <option value={9}>९ महिने</option>
                        <option value={12}>१२ महिने (१ वर्ष)</option>
                        <option value={18}>१८ महिने (१.५ वर्षे)</option>
                        <option value={24}>२४ महिने (२ वर्षे)</option>
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                        डाऊन पेमेंट: <strong className="text-slate-900 dark:text-white font-mono">₹{downPayment.toLocaleString('en-IN')}</strong>
                      </label>
                      <input
                        type="range"
                        min={5000}
                        max={Math.max(10000, finalComboPrice - 5000)}
                        step={1000}
                        value={downPayment}
                        onChange={(e) => setDownPayment(Number(e.target.value))}
                        className="w-full accent-indigo-600"
                      />
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900 text-center">
                    <span className="text-[11px] text-slate-600 dark:text-slate-400 block">अंदाजे मासिक हप्ता:</span>
                    <strong className="text-lg font-black font-mono text-indigo-700 dark:text-indigo-300">
                      ₹{monthlyEmi.toLocaleString('en-IN')}/- <span className="text-xs font-semibold text-slate-500">दरमहा ({tenureMonths} महिने)</span>
                    </strong>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowPrintView(true)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>A4 फॉर्मॅट पहा व प्रिंट करा</span>
                </button>

                <button
                  type="button"
                  onClick={handleWhatsAppShare}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white text-xs font-black transition flex items-center gap-2 shadow-md cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>WhatsApp वर कोटेशन पाठवा</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
