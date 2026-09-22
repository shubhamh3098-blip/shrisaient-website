import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Store,
  Phone,
  MessageCircle,
  MapPin,
  CheckCircle2,
  Search,
  Truck,
  ShieldCheck,
  CreditCard,
  Tv,
  Sparkles,
  ExternalLink,
  Printer,
  X,
  Clock,
  Award,
  ArrowRight,
  PackageCheck,
  Lock,
  Unlock,
  Shield,
  Share2,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Building2,
  Info,
  Calendar,
  ChevronRight,
  Check,
  RefreshCw,
  Download,
  Smartphone,
  Edit3,
  Camera,
  FileText,
  KeyRound,
  AlertCircle,
  Zap,
  Bookmark,
  Armchair,
  Bell
} from 'lucide-react';
import {
  BusinessSettings,
  CardMember,
  CardTransaction,
  StockItem,
  CardSchemeConfig
} from '../types';
import { SCHEMES_CONFIG } from '../utils/storage';
import {
  maskPhoneNumber,
  maskAddress,
  verifyCustomerLast4Digits,
  checkSearchRateLimit
} from '../utils/security';
import { AppLogo } from './AppLogo';
import { PWAInstallModal } from './PWAInstallModal';
import { usePWAInstall } from '../utils/usePWAInstall';
import { ProductEditModal } from './ProductEditModal';
import { OrderBillModal, OrderBillData, OrderFinanceDetails } from './OrderBillModal';
import { ServicesAndTrustSection } from './ServicesAndTrustSection';
import { FloatingCallAndWhatsApp } from './FloatingCallAndWhatsApp';
import { DayNightToggle } from './DayNightToggle';
import { AmazonHeader } from './AmazonHeader';
import { AmazonHeroSection } from './AmazonHeroSection';
import { AmazonDealsCarousel } from './AmazonDealsCarousel';
import { AmazonProductCard } from './AmazonProductCard';
import { AmazonFooter } from './AmazonFooter';
import { CartNotificationToast, CartNotificationItem } from './CartNotificationToast';
import { CartFinanceSection } from './CartFinanceSection';

interface CartItem {
  item: StockItem;
  quantity: number;
}

interface ShopLandingViewProps {
  settings: BusinessSettings;
  stock: StockItem[];
  cardMembers: CardMember[];
  cardTransactions: CardTransaction[];
  onOpenLoginModal: () => void;
  initialPassbookCardNo?: number | null;
  initialInvoiceNo?: string | null;
  isAdminLoggedIn?: boolean;
  onGoToAdminDashboard?: () => void;
  onUpdateStockItem?: (item: StockItem) => void;
  onAddStockItem?: (item: StockItem) => void;
  onDeleteStockItem?: (itemId: string) => void;
  onRecordOrder?: (tx: any) => void;
}

export const ShopLandingView: React.FC<ShopLandingViewProps> = ({
  settings,
  stock,
  cardMembers,
  cardTransactions,
  onOpenLoginModal,
  initialPassbookCardNo,
  initialInvoiceNo,
  isAdminLoggedIn = false,
  onGoToAdminDashboard,
  onUpdateStockItem,
  onAddStockItem,
  onDeleteStockItem,
  onRecordOrder,
}) => {
  // Live typing search state for customer passbook lookup
  const [searchQuery, setSearchQuery] = useState(
    initialPassbookCardNo ? String(initialPassbookCardNo) : ''
  );
  // Search query for products catalog (Amazon search bar)
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<CardMember | null>(null);
  const [passbookSearchError, setPassbookSearchError] = useState('');
  const [showFullPassbookModal, setShowFullPassbookModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Shopping Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [deliveryType, setDeliveryType] = useState<'local' | 'outer'>('local');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [cartNotification, setCartNotification] = useState<CartNotificationItem | null>(null);
  const [checkoutMode, setCheckoutMode] = useState<'cash' | 'finance'>('cash');
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const { isInstallable, isInstalled } = usePWAInstall();

  // Admin Product Photo & Price Editing state
  const [isAdminMode, setIsAdminMode] = useState(isAdminLoggedIn);
  const [showAdminPasswordPrompt, setShowAdminPasswordPrompt] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminPasswordError, setAdminPasswordError] = useState('');
  const [editingStockItem, setEditingStockItem] = useState<StockItem | null>(null);
  const [isProductEditModalOpen, setIsProductEditModalOpen] = useState(false);

  // Printed Bill state for online orders
  const [activeOrderBill, setActiveOrderBill] = useState<OrderBillData | null>(null);
  const [showOrderBillModal, setShowOrderBillModal] = useState(false);

  // Customer verification & PII protection state for Digital Passbook
  const [isMemberVerified, setIsMemberVerified] = useState(false);
  const [verifyLast4Input, setVerifyLast4Input] = useState('');
  const [verifyError, setVerifyError] = useState('');

  // Unlocked if either Admin is logged in, or customer verified last 4 digits
  const isUnlocked = isAdminMode || isMemberVerified;

  const handleVerifyOwnership = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    if (!selectedMember.phone) {
      setIsMemberVerified(true);
      setVerifyError('');
      return;
    }
    if (verifyCustomerLast4Digits(selectedMember.phone, verifyLast4Input)) {
      setIsMemberVerified(true);
      setVerifyError('');
      setVerifyLast4Input('');
    } else {
      setVerifyError('शेवटचे ४ अंक जुळले नाहीत. कृपया नोंदणीकृत मोबाईलचे शेवटचे ४ अंक तपासा.');
    }
  };

  useEffect(() => {
    if (isAdminLoggedIn) {
      setIsAdminMode(true);
    }
  }, [isAdminLoggedIn]);

  const handleVerifyAdminPassword = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPassword = settings.adminPassword || 'admin';
    if (adminPasswordInput.trim() === correctPassword) {
      setIsAdminMode(true);
      setShowAdminPasswordPrompt(false);
      setAdminPasswordInput('');
      setAdminPasswordError('');
    } else {
      setAdminPasswordError('चुकीचा पासवर्ड! कृपया योग्य ॲडमिन पासवर्ड टाका.');
    }
  };

  const handleSaveProduct = (savedItem: StockItem) => {
    if (stock.some((s) => s.id === savedItem.id)) {
      onUpdateStockItem?.(savedItem);
    } else {
      onAddStockItem?.(savedItem);
    }
  };

  // Delivery configuration defaults with fallback to settings
  const delivery = settings.deliveryRates || {
    freeDeliveryMinAmount: 3000,
    localDeliveryFee: 100,
    outerDeliveryFee: 250,
    estimatedDeliveryTime: 'Same Day / 24 Hours',
    deliveryAreas: 'Wardha City, Arvi, and Surrounding Villages (50 km)',
    deliveryNote:
      'Free home delivery on orders above ₹3,000 and all Card Scheme major appliances (TV, Refrigerator, Cooler, Washing Machine).',
  };

  // 1. LIVE LOOKUP AS CUSTOMER TYPES CARD NUMBER OR MOBILE NUMBER
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSelectedMember(null);
      return;
    }

    const cleanQ = q.replace(/[^0-9a-zA-Z]/g, '').toLowerCase();
    const match = cardMembers.find((m) => {
      const cardStr = String(m.cardNumber);
      const phoneClean = (m.phone || '').replace(/[^0-9]/g, '');
      const uniqueClean = (m.uniqueId || '').replace(/[^0-9a-zA-Z]/g, '').toLowerCase();
      return (
        cardStr === q ||
        phoneClean === cleanQ ||
        uniqueClean === cleanQ ||
        (q.length >= 10 && phoneClean.endsWith(cleanQ.slice(-10)))
      );
    });

    if (match) {
      setSelectedMember(match);
      setPassbookSearchError('');
    } else {
      setSelectedMember(null);
    }
  }, [searchQuery, cardMembers]);

  // Handle explicit form submit / Enter key on Digital Passbook search
  const handlePassbookSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPassbookSearchError('');

    // Rate-limiting check to protect customer records against scraping
    const rateCheck = checkSearchRateLimit();
    if (!rateCheck.allowed) {
      setPassbookSearchError(rateCheck.message || 'सुरक्षिततेसाठी कृपया काही सेकंद थांबा.');
      return;
    }

    const q = searchQuery.trim();
    if (!q) {
      setPassbookSearchError('कृपया आधी तुमचा कार्ड नंबर किंवा १०-अंकी मोबाईल नंबर टाका.');
      return;
    }

    const cleanQ = q.replace(/[^0-9a-zA-Z]/g, '').toLowerCase();
    const match = cardMembers.find((m) => {
      const cardStr = String(m.cardNumber);
      const phoneClean = (m.phone || '').replace(/[^0-9]/g, '');
      const uniqueClean = (m.uniqueId || '').replace(/[^0-9a-zA-Z]/g, '').toLowerCase();
      return (
        cardStr === q ||
        phoneClean === cleanQ ||
        uniqueClean === cleanQ ||
        (q.length >= 10 && phoneClean.endsWith(cleanQ.slice(-10)))
      );
    });

    if (match) {
      if (selectedMember?.cardNumber !== match.cardNumber) {
        setIsMemberVerified(false);
        setVerifyLast4Input('');
        setVerifyError('');
      }
      setSelectedMember(match);
      setPassbookSearchError('');
      // If already shown on screen, opening the full passbook modal gives instant satisfaction
      if (selectedMember && selectedMember.cardNumber === match.cardNumber) {
        setShowFullPassbookModal(true);
      } else {
        setTimeout(() => {
          const el = document.getElementById('digital-passbook-card');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 50);
      }
    } else {
      setSelectedMember(null);
      setPassbookSearchError(`कार्ड किंवा मोबाईल नंबर "${q}" सापडला नाही. कृपया नंबर तपासा किंवा 8766486915 वर संपर्क करा.`);
    }
  };

  // If initialPassbookCardNo was passed in URL, auto-load that member & pop modal
  useEffect(() => {
    if (initialPassbookCardNo) {
      const match = cardMembers.find(
        (m) => m.cardNumber === Number(initialPassbookCardNo)
      );
      if (match) {
        setSelectedMember(match);
        setShowFullPassbookModal(true);
      }
    }
  }, [initialPassbookCardNo, cardMembers]);

  // Categories extracted from stock
  const categories = useMemo(() => {
    const cats = new Set<string>();
    stock.forEach((item) => cats.add(item.category || 'General'));
    return ['all', ...Array.from(cats)];
  }, [stock]);

  // Filtered stock items based on selected category AND product search query
  const filteredStock = useMemo(() => {
    let list = stock;
    if (selectedCategory !== 'all') {
      list = list.filter((item) => item.category === selectedCategory);
    }
    const q = productSearchQuery.trim().toLowerCase();
    if (!q) return list;

    // Multi-term matching with English & Marathi keyword synonyms
    const tokens = q.split(/\s+/).filter(Boolean);
    const marathiSynonyms: Record<string, string[]> = {
      cooler: ['कुलर', 'कूलर', 'हवा'],
      fridge: ['फ्रीज', 'फ्रिज', 'रेफ्रिजरेटर', 'godrej', 'lg', 'whirlpool', 'samsung'],
      refrigerator: ['फ्रीज', 'फ्रिज', 'रेफ्रिजरेटर'],
      tv: ['टीव्ही', 'दूरदर्शन', 'स्मार्ट टीव्ही', 'led', 'smart tv', '4k'],
      television: ['टीव्ही', 'दूरदर्शन'],
      sofa: ['सोफा', 'सिटिंग', 'बेड', 'कौच', 'corner sofa'],
      bed: ['बेड', 'पलंग', 'गादी', 'king size', 'queen'],
      almirah: ['कपाट', 'अलमारी', 'अल्मारी', 'wardrobe', 'steel'],
      cupboard: ['कपाट', 'अलमारी'],
      wardrobe: ['कपाट', 'अलमारी'],
      washing: ['वॉशिंग', 'कपडे', 'machine'],
      machine: ['मशीन', 'वॉशिंग'],
      furniture: ['फर्निचर', 'सोफा', 'कपाट', 'बेड'],
      table: ['टेबल', 'डायनिंग'],
      chair: ['खुर्ची', 'चेअर'],
    };

    return list.filter((item) => {
      const name = (item.name || '').toLowerCase();
      const cat = (item.category || '').toLowerCase();
      const code = (item.code || '').toLowerCase();
      const unit = (item.unit || '').toLowerCase();
      const desc = `${name} ${cat} ${code} ${unit}`;

      return tokens.every((token) => {
        // Direct match
        if (desc.includes(token)) return true;

        // Synonym matching
        for (const [key, synonyms] of Object.entries(marathiSynonyms)) {
          if (token.includes(key) || key.includes(token)) {
            if (synonyms.some((s) => desc.includes(s))) return true;
          }
          if (synonyms.some((s) => token.includes(s) || s.includes(token))) {
            if (desc.includes(key) || synonyms.some((s) => desc.includes(s))) return true;
          }
        }
        return false;
      });
    });
  }, [stock, selectedCategory, productSearchQuery]);

  // Transactions for selected passbook member
  const memberTransactions = useMemo(() => {
    if (!selectedMember) return [];
    return cardTransactions
      .filter(
        (t) =>
          t.cardNumber === selectedMember.cardNumber &&
          t.schemeId === selectedMember.schemeId
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [selectedMember, cardTransactions]);

  // Cart operations
  const addToCart = (item: StockItem) => {
    setCart((prev) => {
      const existing = prev.find((ci) => ci.item.id === item.id);
      if (existing) {
        return prev.map((ci) =>
          ci.item.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci
        );
      }
      return [...prev, { item, quantity: 1 }];
    });

    // Gentle audio chime notification
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch (e) {}

    // Trigger direct instant notification toast to customer outside
    setCartNotification({
      item,
      quantity: 1,
      timestamp: Date.now(),
    });

    // Notify admin inside ERP (window event, multi-tab BroadcastChannel, and server SSE)
    const cartActivityData = {
      type: 'cart_add',
      item: {
        id: item.id,
        name: item.name,
        sellingPrice: item.sellingPrice,
        category: item.category,
        imageUrl: item.imageUrl,
      },
      timestamp: Date.now(),
    };

    try {
      window.dispatchEvent(new CustomEvent('shri_sai_cart_updated', { detail: cartActivityData }));
    } catch (e) {}

    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('shri_sai_realtime_channel');
        bc.postMessage(cartActivityData);
        bc.close();
      }
    } catch (e) {}

    try {
      fetch('/api/realtime/order-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'cart_activity',
          order: {
            activityType: 'add_to_cart',
            itemName: item.name,
            itemPrice: item.sellingPrice,
            category: item.category,
            timestamp: Date.now(),
          },
        }),
      }).catch(() => {});
    } catch (e) {}
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((ci) => {
          if (ci.item.id === itemId) {
            const newQty = ci.quantity + delta;
            return newQty > 0 ? { ...ci, quantity: newQty } : null;
          }
          return ci;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((ci) => ci.item.id !== itemId));
  };

  const cartItemsCount = cart.reduce((sum, ci) => sum + ci.quantity, 0);
  const cartSubtotal = cart.reduce(
    (sum, ci) => sum + ci.item.sellingPrice * ci.quantity,
    0
  );
  const isFreeDelivery = cartSubtotal >= delivery.freeDeliveryMinAmount;
  const currentDeliveryFee = isFreeDelivery
    ? 0
    : deliveryType === 'local'
    ? delivery.localDeliveryFee
    : delivery.outerDeliveryFee;
  const cartGrandTotal = cartSubtotal + currentDeliveryFee;

  // Order Placement & Printed Bill Generation
  const handlePlaceOrderAndGenerateBill = (financeDetails?: OrderFinanceDetails) => {
    if (cart.length === 0) return;
    const invNo = `INV-ORD-${Date.now().toString().slice(-6)}`;
    const today = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    const isFinance = Boolean(financeDetails);
    const paymentMode = isFinance ? 'Finance EMI' : 'Cash on Delivery';

    const billData: OrderBillData = {
      invoiceNo: invNo,
      date: today,
      customerName: customerName.trim() || 'ग्राहक / Valued Customer',
      customerPhone: customerPhone.trim(),
      customerAddress: customerAddress.trim() || 'वर्धा / Wardha',
      deliveryType,
      items: cart.map((ci) => ({
        name: ci.item.name,
        quantity: ci.quantity,
        unitPrice: ci.item.sellingPrice,
        total: ci.item.sellingPrice * ci.quantity,
      })),
      subtotal: cartSubtotal,
      deliveryFee: currentDeliveryFee,
      grandTotal: cartGrandTotal,
      notes: orderNotes.trim(),
      paymentMode,
      financeDetails,
    };

    // 1. Record into ERP store transactions if handler provided
    if (onRecordOrder) {
      const summary = cart.map((ci) => `${ci.item.name} (${ci.quantity})`).join(', ');
      onRecordOrder({
        invoiceNo: invNo,
        date: today,
        customerName: billData.customerName,
        customerPhone: billData.customerPhone,
        totalAmount: cartGrandTotal,
        payingNow: financeDetails ? financeDetails.downPayment : 0,
        dueAmount: financeDetails ? Math.max(0, cartGrandTotal - financeDetails.downPayment) : cartGrandTotal,
        paymentMode: isFinance ? `Finance (${financeDetails?.providerName})` : 'Cash on Delivery',
        itemDetails: `Online Store Order: ${summary}${financeDetails ? ` [${financeDetails.schemeName} | EMI: ₹${financeDetails.monthlyEmi}/mo]` : ''}`,
      });
    }

    // 2. Play sound chime
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.18);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      }
    } catch (e) {}

    // 3. Dispatch event for real-time notification alert in ERP & Server SSE
    try {
      window.dispatchEvent(new CustomEvent('shri_sai_order_placed', { detail: billData }));
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('shri_sai_realtime_channel');
        bc.postMessage({ type: isFinance ? 'finance_order_placed' : 'order_placed', order: billData });
        bc.close();
      }
      fetch('/api/realtime/order-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: isFinance ? 'finance_order_placed' : 'order_placed', order: billData }),
      }).catch(() => {});
    } catch (e) {}

    // 4. Save to local storage online orders
    try {
      const savedOrders = JSON.parse(localStorage.getItem('shri_sai_online_orders') || '[]');
      localStorage.setItem('shri_sai_online_orders', JSON.stringify([billData, ...savedOrders.slice(0, 19)]));
    } catch (e) {}

    setActiveOrderBill(billData);
    setShowOrderBillModal(true);
    setCart([]);
    setIsCartOpen(false);

    // 5. Automatically forward order to owner's WhatsApp so owner gets immediate notification
    handlePlaceOrderWhatsApp('8766486915', financeDetails);
  };

  // WhatsApp Order Submission (Direct forward)
  const handlePlaceOrderWhatsApp = (targetPhone = '8766486915', finance?: OrderFinanceDetails) => {
    if (cart.length === 0) return;
    const itemsList = cart
      .map(
        (ci, idx) =>
          `${idx + 1}. *${ci.item.name}* (Qty: ${ci.quantity}) - ₹${(
            ci.item.sellingPrice * ci.quantity
          ).toLocaleString()}`
      )
      .join('\n');

    let financeMsgSection = '';
    if (finance) {
      financeMsgSection =
        `--------------------------------\n` +
        `⚡ *फायनान्स अर्ज तपशील (FINANCE SCHEME):*\n` +
        `*फायनान्स कंपनी:* ${finance.providerName}\n` +
        `*योजना:* ${finance.schemeName}\n` +
        `*कालावधी:* ${finance.tenureMonths} महिने\n` +
        `*मासिक हप्ता (EMI):* ₹${finance.monthlyEmi.toLocaleString()} / महिना\n` +
        `*डाऊन पेमेंट:* ₹${finance.downPayment.toLocaleString()}\n` +
        (finance.customerDocNumber ? `*केवायसी/कार्ड नंबर:* ${finance.customerDocNumber}\n` : '') +
        (finance.employmentType ? `*रोजगार प्रकार:* ${finance.employmentType}\n` : '');
    }

    const message = encodeURIComponent(
      (finance ? `⚡ *नवीन ०% फायनान्स अर्ज - श्री साई इंटरप्राइजेस*\n` : `🛒 *नवीन ऑनलाइन ऑर्डर - श्री साई इंटरप्राइजेस*\n`) +
      `--------------------------------\n` +
      `*Customer Name:* ${customerName || 'Customer'}\n` +
      `*Contact Phone:* ${customerPhone || 'Not provided'}\n` +
      `*Delivery Address:* ${customerAddress || 'Local Wardha pickup/delivery'}\n` +
      `*Delivery Area:* ${deliveryType === 'local' ? 'Wardha Local Town' : 'Surrounding Village / Outer'}\n` +
      `--------------------------------\n` +
      `*ORDERED ITEMS:*\n${itemsList}\n` +
      `--------------------------------\n` +
      `*Subtotal:* ₹${cartSubtotal.toLocaleString()}\n` +
      `*Delivery Fee:* ${isFreeDelivery ? 'FREE (Order above ₹3,000)' : `₹${currentDeliveryFee}`}\n` +
      `*Total Payable:* ₹${cartGrandTotal.toLocaleString()}\n` +
      financeMsgSection +
      (orderNotes ? `*Note:* ${orderNotes}\n` : '') +
      `--------------------------------\n` +
      (finance
        ? `कृपया तात्काळ फायनान्स डॉकेट व्हेरिफाय करून ईएमआय मंजुरी द्या. धन्यवाद!`
        : `Please confirm availability and dispatch time. Thank you!`)
    );

    window.open(`https://wa.me/91${targetPhone}?text=${message}`, '_blank');
  };

  // Direct WhatsApp Link for individual items
  const getDirectWhatsAppItemLink = (item: StockItem, phone = '8766486915') => {
    const message = encodeURIComponent(
      `नमस्ते Shri Sai Enterprises,\n` +
      `मुझे यह प्रोडक्ट खरीदना / जानकारी चाहिए:\n` +
      `*Item:* ${item.name}\n` +
      `*Price:* ₹${item.sellingPrice.toLocaleString()}\n` +
      `*Code:* ${item.code}\n` +
      `कृपया स्टॉक और होम डिलीवरी की जानकारी दें। धन्यवाद!`
    );
    return `https://wa.me/91${phone}?text=${message}`;
  };

  // WhatsApp Passbook Share
  const handleSharePassbook = (member: CardMember) => {
    const url = `${window.location.origin}/?passbook=${member.cardNumber}`;
    const text = encodeURIComponent(
      `*श्री साई इंटरप्राइजेस - डिजिटल बचत पासबुक*\n` +
      `कार्ड नंबर: #${member.cardNumber} (${member.schemeName})\n` +
      `ग्राहक का नाम: ${member.customerName}\n` +
      `कुल जमा राशि: ₹${member.totalDeposited.toLocaleString()}\n` +
      `स्थिति: ${member.status}\n` +
      `🔗 अपनी डिजिटल पासबुक ऑनलाइन देखें:\n${url}\n\n` +
      `पत्ता: मातोश्री सभागृह समोर आर्वी रोड पंजाब कॉलनी वर्धा ,442001\n` +
      `अधिकृत WhatsApp: 8766486915 / 8600122798`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="min-h-screen tactile-canvas text-[var(--tactile-text-main)] flex flex-col selection:bg-[var(--tactile-primary)] selection:text-white">
      {/* Top Announcement Bar */}
      <div className="bg-[#0B1528] text-amber-300 px-3 sm:px-4 py-2 text-xs font-semibold text-center border-b border-white/10 flex items-center justify-center gap-2 no-print overflow-hidden">
        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span className="text-slate-100 truncate sm:whitespace-normal">
          {(!settings.shopNotice || settings.shopNotice.includes('श्री साई'))
            ? 'Shri Sai Enterprises: 30-Month Weekly Savings Card Scheme Booking Open • Free Home Delivery on all major items!'
            : settings.shopNotice}
        </span>
        <span className="hidden md:inline text-white/30">•</span>
        <span className="hidden md:inline text-amber-300 font-mono font-bold">
          GST: 27ALOPL0030G2ZC
        </span>
      </div>

      {/* Amazon-Style Header */}
      <AmazonHeader
        searchQuery={productSearchQuery}
        onSearchChange={(q) => {
          setProductSearchQuery(q);
        }}
        onSearchSubmit={(e) => {
          if (e) e.preventDefault();
          const q = productSearchQuery.trim();
          if (!q) return;

          // Check if user is searching for a numeric card number (e.g. 1001-3000) or 10-digit mobile
          const isCardOrPhone = /^\d{3,10}$/.test(q);
          if (isCardOrPhone) {
            const match = cardMembers.find((m) => {
              const cardStr = String(m.cardNumber);
              const phoneClean = (m.phone || '').replace(/[^0-9]/g, '');
              return cardStr === q || phoneClean.endsWith(q);
            });
            if (match) {
              setSelectedMember(match);
              setSearchQuery(q);
              const el = document.getElementById('digital-passbook-card') || document.getElementById('passbook-section');
              el?.scrollIntoView({ behavior: 'smooth' });
              return;
            }
          }

          // Otherwise, scroll smoothly to the products catalog
          const el = document.getElementById('products-catalog');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          const el = document.getElementById('products-catalog');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
        categories={categories}
        cartCount={cartItemsCount}
        onOpenCart={() => setIsCartOpen(true)}
        isAdminLoggedIn={isAdminLoggedIn}
        onGoToAdminDashboard={onGoToAdminDashboard}
        onOpenLoginModal={onOpenLoginModal}
        onScrollToPassbook={() => {
          const el = document.getElementById('passbook-section');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
        onScrollToSchemes={() => {
          const el = document.getElementById('savings-schemes');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
        onScrollToProducts={() => {
          const el = document.getElementById('products-catalog');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
        onScrollToDeals={() => {
          const el = document.getElementById('todays-deals');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Main Container */}
      <main className="flex-1 pb-24 lg:pb-12 overflow-x-hidden bg-[#eaeded] dark:bg-[#0b1120] transition-colors">
        {/* Amazon Hero Banner Carousel & 4-in-1 Quad Bento Cards */}
        <AmazonHeroSection
          onSelectCategory={(cat) => {
            setSelectedCategory(cat);
            const el = document.getElementById('products-catalog');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
          onScrollToProducts={() => {
            const el = document.getElementById('products-catalog');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
          onScrollToPassbook={() => {
            const el = document.getElementById('passbook-section');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
          onScrollToSchemes={() => {
            const el = document.getElementById('savings-schemes');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
          shopPhone={settings.phone || '8766486915'}
        />

        {/* Amazon Today's Deals Horizontal Scroll Strip */}
        <AmazonDealsCarousel
          items={stock}
          onAddToCart={addToCart}
          shopPhone={settings.phone || '8766486915'}
        />

        {/* HERO SECTION WITH CLEAN LIGHT & NIGHT THEME & PASSBOOK LOOKUP */}
        <section id="passbook-section" className="bg-gradient-to-b from-white via-slate-50/50 to-white dark:from-[#0F172A] dark:via-[#131F37] dark:to-[#0F172A] text-slate-900 dark:text-slate-100 pt-10 pb-14 px-4 sm:px-6 relative overflow-hidden transition-colors">
          <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
            {/* Eyebrow Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200/70 dark:border-teal-800/60 text-teal-800 dark:text-teal-300 text-xs font-semibold shadow-2xs">
              <Bookmark className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              Wardha Showroom • Handcrafted Teak & Smart Electronics
            </div>

            {/* Display Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black font-display text-slate-900 dark:text-white tracking-tight leading-[1.15] max-w-4xl mx-auto">
              Curated Electronics & Contemporary Furniture
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed font-sans">
              Experience solid wood furniture, certified 4K home appliances, and flexible 30-month installment plans with verified digital passbooks.
            </p>

            {/* LIVE PASSBOOK SEARCH INPUT BOX WITH GREEN PILL BUTTON */}
            <div className="max-w-xl mx-auto text-left space-y-3">
              <form onSubmit={handlePassbookSubmit}>
                <div className="bg-white dark:bg-[#1E293B] border border-slate-200/90 dark:border-slate-700 rounded-full shadow-sm p-1.5 sm:p-2 flex items-center justify-between gap-2 transition focus-within:border-[#0D5C4D] dark:focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-[#0D5C4D]/20">
                  <div className="flex items-center gap-2.5 flex-1 pl-3 sm:pl-4">
                    <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        if (passbookSearchError) setPassbookSearchError('');
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handlePassbookSubmit(e);
                        }
                      }}
                      placeholder="Enter Card # (e.g. 1001) or mobile..."
                      className="w-full bg-transparent text-slate-900 dark:text-slate-100 text-xs sm:text-sm font-semibold placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-normal focus:outline-none"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedMember(null);
                          setPassbookSearchError('');
                        }}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                        title="Clear"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Dark Forest Green Pill Button */}
                  <button
                    type="submit"
                    className="px-4 sm:px-5 py-2.5 rounded-full bg-[#0D5C4D] hover:bg-[#084337] active:bg-[#06332a] text-white font-bold text-xs sm:text-sm transition flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer active:scale-95"
                    title="Check Passbook"
                  >
                    <span>Check Passbook</span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                </div>

                {passbookSearchError && (
                  <div className="mt-2 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2 animate-fade-in">
                    <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                    <span>{passbookSearchError}</span>
                  </div>
                )}
              </form>

              {/* Quick Demo Cards Helper */}
              <div className="flex items-center justify-center text-xs text-slate-500 dark:text-slate-400 pt-0.5 gap-2">
                <span>
                  Quick demo cards:{' '}
                  <button type="button" className="text-slate-700 dark:text-slate-200 font-mono font-bold hover:underline cursor-pointer" onClick={() => setSearchQuery('1001')}>#1001</button>{'  '}
                  <button type="button" className="text-slate-700 dark:text-slate-200 font-mono font-bold hover:underline cursor-pointer" onClick={() => setSearchQuery('1002')}>#1002</button>{'  '}
                  <button type="button" className="text-slate-700 dark:text-slate-200 font-mono font-bold hover:underline cursor-pointer" onClick={() => setSearchQuery('2001')}>#2001</button>
                </span>
              </div>
            </div>

            {/* THREE PROMINENT SHOWCASE CARDS MATCHING SCREENSHOT */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto pt-6 text-left">
              {/* Card 1: 30-Month Weekly Passbook */}
              <div className="bg-white dark:bg-[#1E293B] rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-slate-700 dark:text-slate-300" />
                  </div>
                  <h3 className="text-xl font-black font-display text-slate-900 dark:text-white tracking-tight">
                    30-Month Weekly Passbook
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                    Zero-interest weekly savings scheme with transparent installment tracking, lucky draw eligibility, and instant digital passbook receipts.
                  </p>
                </div>
                <a
                  href="#savings-schemes"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0D5C4D] dark:text-emerald-400 hover:underline"
                >
                  <span>Learn about 30-Month Plans</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Card 2: Designer Furniture Studio (Vibrant Orange Card) */}
              <div className="bg-[#F97316] text-white rounded-3xl p-6 shadow-lg shadow-orange-500/20 hover:shadow-xl transition-all space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white">
                    <Armchair className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-black font-display text-white tracking-tight">
                    Designer Furniture Studio
                  </h3>
                  <p className="text-xs text-orange-50 leading-relaxed font-sans">
                    Handcrafted Solid Teak Sofas, King Size Storage Beds, Modular 3-Door Wardrobes & Luxury Dining Sets with direct doorstep delivery.
                  </p>
                </div>
                <a
                  href="#products-catalog"
                  onClick={() => setSelectedCategory('furniture')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-white hover:underline"
                >
                  <span>Explore Furniture Collection</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Card 3: Smart Home Electronics (Deep Forest Green Card) */}
              <div className="bg-[#0D5C4D] text-white rounded-3xl p-6 shadow-lg shadow-emerald-900/20 hover:shadow-xl transition-all space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white">
                    <Tv className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-black font-display text-white tracking-tight">
                    Smart Home Electronics
                  </h3>
                  <p className="text-xs text-emerald-100 leading-relaxed font-sans">
                    4K Google Smart TVs, Heavy-Duty Inverter Coolers, Double Door Frost-Free Refrigerators & Washing Machines with genuine brand warranty.
                  </p>
                </div>
                <a
                  href="#products-catalog"
                  onClick={() => setSelectedCategory('electronics')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-white hover:underline"
                >
                  <span>Explore Electronics Catalog</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* INSTANT MINIMAL & ANIMATED PASSBOOK CARD (APPEARS AS USER TYPES OR HITS ENTER) */}
            <AnimatePresence mode="wait">
              {selectedMember && (
                <motion.div
                  key={`passbook-${selectedMember.cardNumber}`}
                  initial={{ opacity: 0, y: 16, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -12, scale: 0.98 }}
                  transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                  id="digital-passbook-card"
                  className="max-w-2xl mx-auto text-left bg-white dark:bg-[#1E293B] text-slate-900 dark:text-slate-100 rounded-3xl p-5 sm:p-6 shadow-2xl border border-amber-300/40 dark:border-amber-500/30 space-y-5 scroll-mt-24 relative overflow-hidden transition-colors"
                >
                  {/* Top Member Card Banner */}
                  <div className="bg-gradient-to-r from-[#0B1528] to-[#1E3A8A] text-white p-4 sm:p-5 rounded-2xl border border-white/15 relative overflow-hidden shadow-md">
                    <div className="absolute right-3 top-3 opacity-10 pointer-events-none">
                      <Store className="w-32 h-32" />
                    </div>
                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-mono font-black text-xs uppercase">
                            CARD #{selectedMember.cardNumber}
                          </span>
                          <span className="text-xs text-slate-300 font-medium">
                            {selectedMember.schemeName}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-slate-200 border border-white/20 text-[10px] font-semibold">
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            {isUnlocked ? 'Verified Access' : 'Protected PII'}
                          </span>
                        </div>
                        <h3 className="text-lg sm:text-xl font-extrabold text-white mt-1">
                          {selectedMember.customerName}
                        </h3>
                        <p className="text-xs text-slate-300 font-mono mt-0.5 flex flex-wrap items-center gap-2">
                          <span>📞 {maskPhoneNumber(selectedMember.phone, isUnlocked)}</span>
                          <span>•</span>
                          <span>📍 {maskAddress(selectedMember.address, selectedMember.village, isUnlocked)}</span>
                        </p>
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="inline-block px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-bold text-xs">
                          ● {selectedMember.status} Member
                        </span>
                        <p className="text-[11px] text-amber-300 font-semibold mt-1">
                          🎁 Eligible for Weekly Lucky Draw
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Customer Ownership & Privacy Shield Unlock Box */}
                  {!isUnlocked ? (
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 border border-amber-200/90 dark:border-amber-700/50 rounded-2xl p-3.5 sm:p-4 text-xs space-y-2.5">
                      <div className="flex items-start gap-2.5">
                        <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 shrink-0">
                          <Lock className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-amber-200">
                            <span>ग्राहक सुरक्षा व गोपनीयता (PII Protected)</span>
                            <span className="px-1.5 py-0.2 rounded bg-amber-200 dark:bg-amber-800 text-amber-950 dark:text-amber-100 text-[10px] uppercase font-mono">
                              Private
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                            तुमची खाजगी माहिती इतर कोणासही दिसू नये म्हणून फोन व पत्ता सुरक्षित ठेवला आहे. तुमचे संपूर्ण स्टेटमेंट अनलॉक करण्यासाठी नोंदणीकृत मोबाईलचे शेवटचे ४ अंक टाका:
                          </p>
                        </div>
                      </div>

                      <form onSubmit={handleVerifyOwnership} className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-200/50 dark:border-amber-700/40">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            मोबाईलचे शेवटचे ४ अंक:
                          </span>
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={4}
                            value={verifyLast4Input}
                            onChange={(e) => {
                              setVerifyLast4Input(e.target.value.replace(/[^0-9]/g, ''));
                              if (verifyError) setVerifyError('');
                            }}
                            placeholder="उदा. 1030"
                            className="w-24 px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#0F172A] border border-amber-300 dark:border-amber-600 text-center font-mono font-black text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner"
                          />
                        </div>
                        <button
                          type="submit"
                          className="px-3.5 py-1.5 rounded-lg bg-slate-950 dark:bg-amber-500 hover:bg-slate-800 dark:hover:bg-amber-400 active:scale-95 text-white dark:text-slate-950 font-bold text-xs cursor-pointer transition flex items-center gap-1.5 shadow-xs"
                        >
                          <Unlock className="w-3.5 h-3.5 text-amber-400 dark:text-slate-950" />
                          <span>Unlock Full Statement</span>
                        </button>
                      </form>
                      {verifyError && (
                        <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          {verifyError}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>ग्राहक पडताळणी पूर्ण • संपूर्ण डिजिटल पासबुक व पावत्या अनलॉक झाल्या आहेत.</span>
                      </span>
                      {!isAdminMode && (
                        <button
                          type="button"
                          onClick={() => setIsMemberVerified(false)}
                          className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 underline cursor-pointer"
                        >
                          Lock Again
                        </button>
                      )}
                    </div>
                  )}

                  {/* Key Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                      <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Total Deposited</span>
                      <span className="text-base sm:text-lg font-black text-emerald-700 dark:text-emerald-400 font-mono">
                        ₹{selectedMember.totalDeposited.toLocaleString()}
                      </span>
                    </div>
                    <div className="bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                      <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Installments Paid</span>
                      <span className="text-base sm:text-lg font-black text-blue-700 dark:text-blue-400 font-mono">
                        {memberTransactions.length} Weeks
                      </span>
                    </div>
                    <div className="bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                      <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Weekly Amount</span>
                      <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-mono">
                        ₹500 / week
                      </span>
                    </div>
                    <div className="bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                      <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Passbook Status</span>
                      <span className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400">
                        Verified ✓
                      </span>
                    </div>
                  </div>

                  {/* 52-WEEK PROGRESS VISUAL MATRIX */}
                  <div className="bg-slate-50 dark:bg-[#0F172A] rounded-xl p-4 border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        52-Week Progress Tracker (साप्ताहिक हप्ते ट्रॅकर)
                      </span>
                      <span className="text-slate-600 dark:text-slate-400 font-mono font-semibold">
                        {memberTransactions.length} / 52 Completed
                      </span>
                    </div>

                    {/* Visual micro-pills for 52 weeks */}
                    <div className="grid grid-cols-13 gap-1 pt-1">
                      {Array.from({ length: 52 }).map((_, idx) => {
                        const weekNo = idx + 1;
                        const isPaid = weekNo <= memberTransactions.length;
                        return (
                          <div
                            key={weekNo}
                            title={`Week ${weekNo}: ${isPaid ? 'PAID ✓' : 'Upcoming'}`}
                            className={`h-5 rounded flex items-center justify-center text-[9px] font-mono font-bold transition ${
                              isPaid
                                ? 'bg-emerald-600 text-white shadow-2xs'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                            }`}
                          >
                            {weekNo}
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded bg-emerald-600"></span> हप्ता भरला (Paid)
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded bg-slate-200 dark:bg-slate-800"></span> आगामी हप्ते (Upcoming)
                      </span>
                    </div>
                  </div>

                  {/* Recent Receipts List */}
                  {memberTransactions.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Recent Payment Receipts:</span>
                      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
                        <table className="w-full text-left">
                          <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                            <tr>
                              <th className="py-2 px-3">Receipt No</th>
                              <th className="py-2 px-3">Date</th>
                              <th className="py-2 px-3">Type</th>
                              <th className="py-2 px-3 text-right">Amount (₹)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                            {memberTransactions.slice(-4).map((tx) => (
                              <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white">{tx.receiptNo}</td>
                                <td className="py-2 px-3 text-slate-600 dark:text-slate-400">{tx.date}</td>
                                <td className="py-2 px-3">
                                  <span className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[10px] font-sans font-semibold">
                                    {tx.paymentMode}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                                  ₹{tx.amount.toLocaleString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Passbook Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Verified Digital Record from ShriSaiEnt.in
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSharePassbook(selectedMember)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        WhatsApp Share
                      </button>
                      <button
                        onClick={() => setShowFullPassbookModal(true)}
                        className="px-3.5 py-1.5 rounded-lg bg-[#0B1528] hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Printer className="w-3.5 h-3.5 text-amber-400" />
                        Print Official Slip
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* SHOP PRODUCTS CATALOG & CART SECTION */}
        <section id="products-catalog" className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-8">
          {/* Section Header & Admin Controls */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--tactile-border-subtle)] pb-5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-bold mb-2">
                <Tv className="w-3.5 h-3.5" /> Curated Electronics & Luxury Furniture Collection
              </div>
              <h2 className="text-2xl sm:text-4xl font-black font-display text-[var(--tactile-text-heading)] tracking-tight">
                Premium Electronics & Handcrafted Furniture
              </h2>
              <p className="text-xs sm:text-sm text-[var(--tactile-text-muted)] mt-1 max-w-2xl font-sans">
                Explore energy-efficient Smart TVs, heavy-duty Inverter Coolers, Frost-Free Refrigerators alongside luxury Solid Teak Sofas, King Size Storage Beds, and Modular Wardrobes.
              </p>
            </div>

            {/* Delivery Highlight Pill & Admin Mode Switch */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-xl px-4 py-2.5 text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-2.5 shrink-0">
                <Truck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold block">Free Home Delivery</span>
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-300">On all orders above ₹{delivery.freeDeliveryMinAmount.toLocaleString()}</span>
                </div>
              </div>

              {isAdminMode ? (
                <div className="flex items-center gap-2 bg-amber-500/15 border border-amber-500/40 p-1.5 rounded-xl">
                  <button
                    onClick={() => {
                      setEditingStockItem(null);
                      setIsProductEditModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    नवीन उत्पादन जोडा
                  </button>
                  <button
                    onClick={() => setIsAdminMode(false)}
                    className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold transition cursor-pointer"
                  >
                    ॲडमिन मोड बंद करा
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    if (isAdminLoggedIn) {
                      setIsAdminMode(true);
                    } else {
                      setShowAdminPasswordPrompt(true);
                    }
                  }}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-700 text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  👑 ॲडमिन: किंमत व फोटो बदला
                </button>
              )}
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#0B1528] dark:bg-amber-400 text-amber-300 dark:text-slate-950 shadow-sm'
                    : 'bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {cat === 'all' ? 'All Products' : cat}
              </button>
            ))}
          </div>

          {/* Active Search Feedback Bar */}
          {productSearchQuery.trim() && (
            <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl px-4 py-2.5 text-xs text-amber-900 dark:text-amber-200">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>
                  <strong>"{productSearchQuery}"</strong> साठी <strong>{filteredStock.length}</strong> उत्पादने सापडली
                </span>
              </div>
              <button
                type="button"
                onClick={() => setProductSearchQuery('')}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600 text-xs font-semibold cursor-pointer"
              >
                Clear (सर्व उत्पादने पहा)
              </button>
            </div>
          )}

          {/* Empty Search Result State */}
          {filteredStock.length === 0 && (
            <div className="text-center py-12 px-4 bg-white dark:bg-[#1E293B] rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 space-y-3">
              <Search className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                "{productSearchQuery}" साठी कोणतेही उत्पादन सापडले नाही
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                कृपया शब्दलेखन तपासा किंवा खालील लोकप्रिय उत्पादन श्रेणी निवडा:
              </p>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                {['Cooler', 'Refrigerator', 'Smart TV', 'Sofa', 'Almirah'].map((suggest) => (
                  <button
                    key={suggest}
                    type="button"
                    onClick={() => setProductSearchQuery(suggest)}
                    className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-amber-100 hover:text-amber-900 transition cursor-pointer"
                  >
                    🔍 {suggest}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setProductSearchQuery('');
                    setSelectedCategory('all');
                  }}
                  className="px-3 py-1 rounded-full bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 cursor-pointer"
                >
                  सर्व उत्पादने दाखवा
                </button>
              </div>
            </div>
          )}

          {/* Stock Items Grid with Amazon Product Cards & Real Photos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {filteredStock.map((item) => (
              <AmazonProductCard
                key={item.id}
                item={item}
                onAddToCart={addToCart}
                isAdminMode={isAdminMode}
                onEditItem={(it) => {
                  setEditingStockItem(it);
                  setIsProductEditModalOpen(true);
                }}
                shopPhone={settings.phone || '8766486915'}
              />
            ))}
          </div>
        </section>

        {/* 30-MONTH SAVINGS SCHEMES SECTION */}
        <section id="savings-schemes" className="bg-slate-100 dark:bg-[#0B132B] py-12 px-4 sm:px-6 border-y border-slate-200 dark:border-slate-800 transition-colors">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                Weekly Savings & Lucky Draw Scheme
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                श्री साई ३०-महिने साप्ताहिक बचत योजना 1, 2, 3
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                प्रत्येक आठवड्याला छोटी बचत करा आणि ३० महिन्यांत आपल्या पसंतीचे घरगुती इलेक्ट्रॉनिक्स उपकरणे मिळवा!
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {SCHEMES_CONFIG.map((sc, idx) => (
                <motion.div
                  key={sc.id}
                  whileHover={{ y: -4, transition: { duration: 0.18 } }}
                  className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between space-y-4 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-mono font-bold text-xs">
                        {sc.code}
                      </span>
                      <span className="text-xs text-amber-600 dark:text-amber-400 font-bold">
                        योजना क्र. {idx + 1}
                      </span>
                    </div>

                    <h3 className="text-lg font-black text-slate-900 dark:text-white">{sc.name}</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {sc.description}
                    </p>

                    <div className="bg-slate-50 dark:bg-[#0F172A] rounded-xl p-3 text-xs space-y-1.5 border border-slate-100 dark:border-slate-800 font-mono">
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>Card Range:</span>
                        <span className="font-bold text-slate-900 dark:text-white">{sc.startCardNo} - {sc.endCardNo}</span>
                      </div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>Registration Fee:</span>
                        <span className="font-bold text-slate-900 dark:text-white">₹{sc.registrationFee} (One Time)</span>
                      </div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>कालावधी (Tenure):</span>
                        <span className="font-bold text-slate-900 dark:text-white">३० महिने (130 Weeks)</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <a
                      href={`https://wa.me/918766486915?text=${encodeURIComponent(
                        `नमस्ते Shri Sai Enterprises, मुझे ${sc.name} (Cards ${sc.startCardNo}-${sc.endCardNo}) में कार्ड बुक करना है।`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-1 shadow-xs"
                      title="WhatsApp 1 (8766486915)"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      WA 8766486915
                    </a>
                    <a
                      href={`https://wa.me/918600122798?text=${encodeURIComponent(
                        `नमस्ते Shri Sai Enterprises, मुझे ${sc.name} (Cards ${sc.startCardNo}-${sc.endCardNo}) में कार्ड बुक करना है।`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition flex items-center justify-center gap-1 shadow-xs"
                      title="WhatsApp 2 (8600122798)"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      WA 8600122798
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* SERVICES, PRICING, SOCIAL PROOF, ENQUIRY FORM & LOCATION SECTION */}
        <ServicesAndTrustSection shopSettings={settings} />

        {/* GENUINE STORE DETAILS & BANK INFO SECTION */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="bg-[#0B1528] text-white rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8 border border-white/10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Address & Shop info */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block">
                  Official Shop Address
                </span>
                <h3 className="text-xl font-bold font-serif">श्री साई इंटरप्राइजेस</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  पत्ता : मातोश्री सभागृह समोर आर्वी रोड पंजाब कॉलनी वर्धा ,442001
                </p>
                <div className="text-xs font-mono text-amber-300 space-y-1 pt-1">
                  <p>GST IN: <strong className="text-white">27ALOPL0030G2ZC</strong></p>
                  <p>Location: Wardha City, Maharashtra</p>
                </div>
              </div>

              {/* Verified Contact Numbers */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block">
                  Store Contact Numbers
                </span>
                <div className="space-y-2 text-xs font-mono">
                  <a href="tel:8766486915" className="flex items-center gap-2 text-slate-200 hover:text-amber-300 transition">
                    <Phone className="w-3.5 h-3.5 text-amber-400" /> 8766486915 (Primary & WhatsApp)
                  </a>
                  <a href="tel:8600122978" className="flex items-center gap-2 text-slate-200 hover:text-amber-300 transition">
                    <Phone className="w-3.5 h-3.5 text-amber-400" /> 8600122978
                  </a>
                  <a href="tel:9175534365" className="flex items-center gap-2 text-slate-200 hover:text-amber-300 transition">
                    <Phone className="w-3.5 h-3.5 text-amber-400" /> 9175534365
                  </a>
                  <a href="tel:7822859073" className="flex items-center gap-2 text-slate-200 hover:text-amber-300 transition">
                    <Phone className="w-3.5 h-3.5 text-amber-400" /> 7822859073
                  </a>
                </div>
              </div>

              {/* Official Bank Account for UPI/NEFT */}
              <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-4 text-xs">
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block">
                  Official Bank Account
                </span>
                <div className="space-y-1 font-mono text-slate-200">
                  <p>Bank: <strong className="text-white">HDFC Bank</strong></p>
                  <p>A/C No: <strong className="text-amber-300">50200083215914</strong></p>
                  <p>IFSC: <strong className="text-white">HDFC0000965</strong></p>
                  <p className="text-[11px] text-slate-400 truncate">Branch: OPP.BANK OF MAHARASHTRA WARDHA 442001</p>
                </div>
              </div>
            </div>

            {/* Official Warranty Disclaimer from Bill Book */}
            <div className="border-t border-white/10 pt-6 text-[11px] text-slate-300 leading-relaxed bg-white/5 p-4 rounded-xl border border-white/10">
              <strong className="text-amber-300 block mb-1">वॉरंटी सूचना (Warranty Disclaimer as per Official Bill Book):</strong>
              दिलेली वॉरंटी ही दुकानदाराची नसून कंपनीची आहे. म्हणून वस्तूत काही बिघाड आल्यास त्याला दुकानदार जबाबदार नसून कंपनी आहे. तेव्हा कृपया वस्तू घेतेवेळेस कंपनीच्या सर्व्हिस सेण्टरचा मोबाईल नंबर घ्यावा.
            </div>
          </div>
        </section>
      </main>

      {/* Amazon Multi-Column Directory Footer with Back to Top */}
      <AmazonFooter
        settings={settings}
        onOpenLoginModal={onOpenLoginModal}
        onScrollToPassbook={() => {
          const el = document.getElementById('passbook-section');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
        onScrollToSchemes={() => {
          const el = document.getElementById('savings-schemes');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
        onScrollToProducts={() => {
          const el = document.getElementById('products-catalog');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* CLEAN & MINIMAL SHOPPING CART MODAL */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#1E293B] text-slate-900 dark:text-slate-100 rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] animate-fade-in">
            {/* Minimal Header */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-[#1E293B] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-tight">तुमची कार्ट (Cart)</h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {cartItemsCount} {cartItemsCount === 1 ? 'वस्तू' : 'वस्तू'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition cursor-pointer"
                title="बंद करा"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Cart Content */}
            {cart.length === 0 ? (
              <div className="p-8 text-center space-y-3 flex-1 flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-white">तुमची कार्ट रिकामी आहे</p>
                  <p className="text-xs text-slate-400 mt-0.5">खालील उत्पादने पाहून "Add to Cart" वर क्लिक करा.</p>
                </div>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    const el = document.getElementById('products');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="mt-1 px-4 py-2 rounded-xl bg-slate-900 dark:bg-amber-400 text-white dark:text-slate-950 text-xs font-bold hover:bg-slate-800 dark:hover:bg-amber-300 transition cursor-pointer"
                >
                  उत्पादने पहा (Browse Products)
                </button>
              </div>
            ) : (
              <div className="overflow-y-auto flex-1">
                {/* Minimal Item Rows */}
                <div className="divide-y divide-slate-100 dark:divide-slate-800 px-5">
                  {cart.map(({ item, quantity }) => (
                    <div key={item.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-11 h-11 rounded-xl bg-slate-50 dark:bg-slate-900 overflow-hidden shrink-0 border border-slate-200/70 dark:border-slate-700 flex items-center justify-center">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <Tv className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-slate-800 dark:text-white truncate text-xs">{item.name}</h4>
                          <span className="text-[11px] text-slate-400 font-mono">
                            ₹{item.sellingPrice.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Stepper & Total */}
                      <div className="flex items-center gap-2.5 shrink-0">
                        <div className="inline-flex items-center rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-5 h-5 rounded hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition cursor-pointer"
                            title="कमी करा"
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          <span className="w-5 text-center text-[11px] font-mono font-bold text-slate-900 dark:text-white">
                            {quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-5 h-5 rounded hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition cursor-pointer"
                            title="वाढवा"
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        </div>

                        <span className="font-mono font-bold text-slate-900 dark:text-white text-xs min-w-14 text-right">
                          ₹{(item.sellingPrice * quantity).toLocaleString()}
                        </span>

                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-slate-300 hover:text-rose-500 transition p-1 cursor-pointer"
                          title="काढून टाका"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Minimal Delivery Selection */}
                <div className="px-5 py-3 bg-slate-50/70 dark:bg-slate-900/50 border-y border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-slate-400" />
                      डिलिव्हरी:
                    </span>
                    <div className="inline-flex rounded-lg bg-slate-200/80 dark:bg-slate-800 p-0.5 text-xs font-medium">
                      <button
                        type="button"
                        onClick={() => setDeliveryType('local')}
                        className={`px-2.5 py-1 rounded-md transition cursor-pointer text-xs ${
                          deliveryType === 'local' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-2xs' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                        }`}
                      >
                        📍 वर्धा शहर
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeliveryType('outer')}
                        className={`px-2.5 py-1 rounded-md transition cursor-pointer text-xs ${
                          deliveryType === 'outer' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-2xs' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                        }`}
                      >
                        🚚 इतर गावे (+₹{delivery.outerDeliveryFee})
                      </button>
                    </div>
                  </div>

                  <div className="text-[11px]">
                    {isFreeDelivery ? (
                      <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        ₹{delivery.freeDeliveryMinAmount.toLocaleString()} पेक्षा जास्त खरेदीवर मोफत डिलिव्हरी लागू!
                      </span>
                    ) : (
                      <span className="text-slate-400">
                        आणखी ₹{(delivery.freeDeliveryMinAmount - cartSubtotal).toLocaleString()} ची खरेदी करा व मोफत डिलिव्हरी मिळवा
                      </span>
                    )}
                  </div>
                </div>

                {/* Direct Instant Notification Banner */}
                <div className="mx-5 my-2.5 p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-amber-500/10 border border-emerald-500/30 dark:border-emerald-500/20 text-xs flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Bell className="w-3.5 h-3.5 animate-bounce" />
                  </div>
                  <div className="min-w-0 flex-1 text-[11px] leading-snug text-slate-700 dark:text-slate-200">
                    <strong className="text-emerald-700 dark:text-emerald-400 font-bold block">
                      डायरेक्ट WhatsApp व स्टोअर अलर्ट ॲक्टिव्ह:
                    </strong>
                    ऑर्डर किंवा फायनान्स अर्ज देताच श्री साई वर्धा दुकानात (8766486915) व तुमच्या मोबाईलवर थेट इन्स्टंट अलर्ट व डिजिटल बिल पाठवले जाईल.
                  </div>
                </div>

                {/* Minimal Customer Form */}
                <div className="px-5 py-2.5 space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <input
                      type="text"
                      placeholder="तुमचे नाव (Full Name)"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-amber-400 placeholder:text-slate-400"
                    />
                    <input
                      type="tel"
                      placeholder="WhatsApp / मोबाइल नंबर"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-amber-400 placeholder:text-slate-400 font-mono"
                    />
                  </div>

                  <input
                    type="text"
                    placeholder="डिलिव्हरी पत्ता / गाव (Address / Village)"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-amber-400 placeholder:text-slate-400"
                  />
                </div>

                {/* Payment Option Switcher Tabs */}
                <div className="px-5 pt-1 pb-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                    पेमेंट किंवा फायनान्स पर्याय निवडा (Select Payment / Finance):
                  </span>
                  <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs">
                    <button
                      type="button"
                      onClick={() => setCheckoutMode('cash')}
                      className={`py-2.5 px-3 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer font-bold ${
                        checkoutMode === 'cash'
                          ? 'bg-white dark:bg-slate-700 text-slate-950 dark:text-white shadow-xs font-black'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      <span>💵 कॅश ऑन डिलिव्हरी / UPI</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCheckoutMode('finance')}
                      className={`py-2.5 px-3 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer font-bold ${
                        checkoutMode === 'finance'
                          ? 'bg-blue-600 text-white shadow-xs font-black ring-2 ring-blue-400/40'
                          : 'text-blue-700 dark:text-blue-400 hover:text-blue-900'
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                      <span>⚡ बजाज ०% फायनान्स / EMI</span>
                    </button>
                  </div>
                </div>

                {/* Embedded Finance Section when Finance Mode is active */}
                {checkoutMode === 'finance' && (
                  <div className="px-5 pb-5">
                    <CartFinanceSection
                      totalAmount={cartGrandTotal}
                      customerName={customerName}
                      customerPhone={customerPhone}
                      customerAddress={customerAddress}
                      onApplyFinance={(financeDetails) => handlePlaceOrderAndGenerateBill(financeDetails)}
                      shopPhone="8766486915"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Minimal Summary & Confirm (Visible in Cash Mode) */}
            {cart.length > 0 && checkoutMode === 'cash' && (
              <div className="p-5 bg-white dark:bg-[#1E293B] border-t border-slate-100 dark:border-slate-800 space-y-3 shrink-0">
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>किंमत (Subtotal):</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">₹{cartSubtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>डिलिव्हरी (Delivery):</span>
                    <span className={`font-mono ${isFreeDelivery ? 'text-emerald-700 dark:text-emerald-400 font-bold' : 'text-slate-800 dark:text-slate-200'}`}>
                      {isFreeDelivery ? 'मोफत (Free)' : `₹${currentDeliveryFee}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-white pt-1.5 border-t border-slate-100 dark:border-slate-800">
                    <span>एकूण देय (Grand Total):</span>
                    <span className="font-mono text-base font-black text-slate-950 dark:text-amber-400">₹{cartGrandTotal.toLocaleString()}</span>
                  </div>
                </div>

                {/* Dominant Primary Action Button */}
                <button
                  onClick={() => handlePlaceOrderAndGenerateBill()}
                  className="w-full py-3 rounded-xl bg-slate-950 dark:bg-amber-400 hover:bg-slate-800 dark:hover:bg-amber-300 text-white dark:text-slate-950 font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-sm cursor-pointer active:scale-[0.99]"
                >
                  <FileText className="w-4 h-4 text-amber-400 dark:text-slate-950" />
                  <span>कॅश ऑन डिलिव्हरीने ऑर्डर निश्चित करा (Confirm Order)</span>
                </button>

                {/* Switch to Bajaj Finance CTA */}
                <button
                  type="button"
                  onClick={() => setCheckoutMode('finance')}
                  className="w-full py-2 px-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>पैसे एकत्र नाहीत? बजाज ०% हप्त्याने (EMI) खरेदी करा</span>
                </button>

                {/* Direct WhatsApp Option */}
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>WhatsApp वर पाठवा:</span>
                  <button
                    onClick={() => handlePlaceOrderWhatsApp('8766486915')}
                    className="font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    8766486915
                  </button>
                  <span>•</span>
                  <button
                    onClick={() => handlePlaceOrderWhatsApp('8600122798')}
                    className="font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    8600122798
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DIRECT INSTANT CART NOTIFICATION TOAST */}
      <CartNotificationToast
        notification={cartNotification}
        cartCount={cartItemsCount}
        cartTotal={cartGrandTotal}
        currentQuantity={cart.find((c) => c.item.id === cartNotification?.item.id)?.quantity}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeFromCart}
        onClose={() => setCartNotification(null)}
        onOpenCart={() => {
          setCheckoutMode('cash');
          setIsCartOpen(true);
        }}
        onOpenBajajFinance={() => {
          setCheckoutMode('finance');
          setIsCartOpen(true);
        }}
      />

      {/* SLEEK FLOATING CART PILL WHEN CART HAS ITEMS */}
      {cartItemsCount > 0 && !isCartOpen && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 animate-fade-in no-print">
          <button
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-slate-950 hover:bg-slate-900 text-white shadow-xl border border-white/10 transition cursor-pointer group active:scale-95"
            title="कार्ट उघडा"
          >
            <div className="relative">
              <ShoppingCart className="w-4 h-4 text-amber-400" />
              <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-amber-400 text-slate-950 text-[9px] font-black flex items-center justify-center font-mono">
                {cartItemsCount}
              </span>
            </div>
            <div className="text-xs font-medium border-l border-white/20 pl-2.5 flex items-center gap-1.5">
              <span className="font-bold text-amber-300 font-mono">₹{cartGrandTotal.toLocaleString()}</span>
              <span className="text-slate-300 hidden sm:inline">• कार्ट उघडा</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition" />
          </button>
        </div>
      )}

      {/* FULL PRINTABLE PASSBOOK RECEIPT MODAL */}
      {showFullPassbookModal && selectedMember && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-fade-in my-auto">
            {/* Top Modal Controls */}
            <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between no-print">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-amber-400">Card #{selectedMember.cardNumber}</span>
                <span className="text-slate-400">•</span>
                <span>Official Digital Passbook</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Passbook
                </button>
                <button
                  onClick={() => setShowFullPassbookModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Passbook Sheet matching official layout */}
            <div id="printable-passbook" className="p-6 space-y-5 text-slate-800 bg-white">
              {/* Header */}
              <div className="text-center border-b-2 border-slate-900 pb-4">
                <h2 className="text-2xl font-black text-slate-900 font-serif">
                  श्री साई इंटरप्राइजेस
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Shri Sai Enterprises • Electronics & Home Appliances
                </p>
                <p className="text-[11px] text-slate-500">
                  पत्ता : मातोश्री सभागृह समोर आर्वी रोड पंजाब कॉलनी वर्धा ,442001
                </p>
                <p className="text-[11px] font-mono text-slate-700 mt-1 font-bold">
                  GST IN 27ALOPL0030G2ZC • Ph: 8766486915, 8600122978, 9175534365, 7822859073
                </p>
              </div>

              {/* Member Card Box */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs grid grid-cols-2 gap-2 font-mono">
                <div>
                  <span className="text-slate-400 text-[10px] block">MEMBER NAME / नाव:</span>
                  <span className="font-bold text-slate-900 font-sans text-sm">{selectedMember.customerName}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">CARD NUMBER / कार्ड क्र:</span>
                  <span className="font-black text-slate-900 text-sm">#{selectedMember.cardNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">SCHEME / योजना:</span>
                  <span className="font-bold text-blue-700">{selectedMember.schemeName}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">PHONE / मोबाइल:</span>
                  <span className="font-semibold text-slate-800">{maskPhoneNumber(selectedMember.phone, isUnlocked)}</span>
                </div>
                <div className="col-span-2 border-t border-slate-200/60 pt-1 text-[11px] font-sans flex items-center justify-between">
                  <span className="text-slate-500">गाव / पत्ता: {maskAddress(selectedMember.address, selectedMember.village, isUnlocked)}</span>
                  {!isUnlocked && (
                    <span className="text-amber-700 font-bold flex items-center gap-1">
                      <Lock className="w-3 h-3 text-amber-600" /> PII Masked
                    </span>
                  )}
                </div>
              </div>

              {/* Summary Metrics */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5">
                  <span className="text-[10px] text-emerald-800 block">एकूण जमा (Deposited)</span>
                  <span className="font-mono font-black text-emerald-700 text-base">₹{selectedMember.totalDeposited.toLocaleString()}</span>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-2.5">
                  <span className="text-[10px] text-blue-800 block">हप्ते भरले (Weeks Paid)</span>
                  <span className="font-mono font-black text-blue-700 text-base">{memberTransactions.length} / 52</span>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5">
                  <span className="text-[10px] text-amber-800 block">लकी ड्रॉ पात्रता</span>
                  <span className="font-bold text-amber-700 text-xs">पात्र (Eligible)</span>
                </div>
              </div>

              {/* Transaction Statement Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">अ.क्र</th>
                      <th className="py-2 px-3">पावती क्र. (Receipt)</th>
                      <th className="py-2 px-3">दिनांक (Date)</th>
                      <th className="py-2 px-3">प्रकार</th>
                      <th className="py-2 px-3 text-right">रक्कम (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {memberTransactions.map((tx, idx) => (
                      <tr key={tx.id}>
                        <td className="py-2 px-3 text-slate-400">{idx + 1}</td>
                        <td className="py-2 px-3 font-semibold text-slate-900">{tx.receiptNo}</td>
                        <td className="py-2 px-3 text-slate-600">{tx.date}</td>
                        <td className="py-2 px-3">{tx.paymentMode}</td>
                        <td className="py-2 px-3 text-right font-bold text-emerald-600">₹{tx.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Warranty and Note */}
              <div className="text-[9.5px] text-slate-500 border-t border-slate-200 pt-3 leading-relaxed">
                दिलेली वॉरंटी ही दुकानदाराची नसून कंपनीची आहे. म्हणून वस्तूत काही बिघाड आल्यास त्याला दुकानदार जबाबदार नसून कंपनी आहे. तेव्हा कृपया वस्तू घेतेवेळेस कंपनीच्या सर्व्हिस सेण्टरचा मोबाईल नंबर घ्यावा.
              </div>

              {/* Signatory Footer */}
              <div className="pt-3 flex items-end justify-between text-xs text-slate-500 border-t border-slate-100">
                <div>
                  <p className="text-[10px] text-slate-400 font-mono">Online Passbook: ShriSaiEnt.in</p>
                </div>
                <div className="text-center">
                  <div className="h-6 w-24 border-b border-dashed border-slate-400 mx-auto"></div>
                  <p className="text-[10px] font-bold text-slate-800 mt-1">अधिकृत स्वाक्षरी</p>
                  <p className="text-[9px] text-slate-400">श्री साई इंटरप्राइजेस</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONTACT NUMBERS POPUP MODAL */}
      {showContactsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-amber-500" />
                Store Phone & WhatsApp Numbers
              </h4>
              <button
                onClick={() => setShowContactsModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Shri Sai Enterprises (Wardha) official contact & WhatsApp numbers:
            </p>

            <div className="space-y-2 font-mono text-xs">
              <a
                href="https://wa.me/918766486915"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-slate-900 font-bold transition"
              >
                <span>8766486915 (WhatsApp 1 & Main)</span>
                <MessageCircle className="w-4 h-4 text-emerald-600" />
              </a>
              <a
                href="https://wa.me/918600122798"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-slate-900 font-bold transition"
              >
                <span>8600122798 (WhatsApp 2)</span>
                <MessageCircle className="w-4 h-4 text-emerald-600" />
              </a>
              <a
                href="tel:9175534365"
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-900 font-semibold transition"
              >
                <span>9175534365</span>
                <Phone className="w-3.5 h-3.5 text-slate-500" />
              </a>
              <a
                href="tel:7822859073"
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-900 font-semibold transition"
              >
                <span>7822859073</span>
                <Phone className="w-3.5 h-3.5 text-slate-500" />
              </a>
            </div>

            <p className="text-[10px] text-slate-400 text-center">
              Matoshree Sabhagruha Samor, Arvi Road, Punjab Colony, Wardha
            </p>
          </div>
        </div>
      )}

      {/* ADMIN PASSWORD PROMPT MODAL */}
      {showAdminPasswordPrompt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">ॲडमिन ओळख पडताळणी</h3>
              </div>
              <button
                onClick={() => {
                  setShowAdminPasswordPrompt(false);
                  setAdminPasswordError('');
                }}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              लँडिंग पेजवर वस्तूंचे <strong>फोटो अपलोड करणे</strong> व <strong>किंमत बदलणे</strong> यासाठी आपला ॲडमिन पासवर्ड टाका:
            </p>

            <form onSubmit={handleVerifyAdminPassword} className="space-y-3">
              <div>
                <input
                  type="password"
                  autoFocus
                  placeholder="ॲडमिन पासवर्ड टाका..."
                  value={adminPasswordInput}
                  onChange={(e) => {
                    setAdminPasswordInput(e.target.value);
                    setAdminPasswordError('');
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-mono"
                />
                {adminPasswordError && (
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold mt-1">
                    {adminPasswordError}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdminPasswordPrompt(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-xs cursor-pointer"
                >
                  रद्द करा
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-slate-950 dark:bg-amber-400 hover:bg-slate-800 dark:hover:bg-amber-300 text-white dark:text-slate-950 font-bold text-xs shadow-sm cursor-pointer"
                >
                  ॲडमिन अनलॉक करा
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRODUCT EDIT MODAL (FOR ADMIN PHOTO UPLOAD & PRICE EDITING) */}
      <ProductEditModal
        isOpen={isProductEditModalOpen}
        onClose={() => {
          setIsProductEditModalOpen(false);
          setEditingStockItem(null);
        }}
        item={editingStockItem}
        onSave={handleSaveProduct}
        onDelete={onDeleteStockItem}
      />

      {/* PRINTED BILL & WHATSAPP FORWARDING MODAL */}
      {showOrderBillModal && activeOrderBill && (
        <OrderBillModal
          order={activeOrderBill}
          settings={settings}
          onClose={() => {
            setShowOrderBillModal(false);
            setActiveOrderBill(null);
          }}
        />
      )}

      {/* Customer Mobile Bottom Navigation Bar (Fixed for Mobile Screens) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0B1528]/95 backdrop-blur-md border-t border-white/10 px-3 py-1.5 lg:hidden shadow-2xl safe-area-pb">
        <div className="flex items-center justify-around max-w-lg mx-auto text-[10px]">
          {/* Shop */}
          <a
            href="#products-catalog"
            className="flex flex-col items-center justify-center p-1 rounded-xl text-slate-300 hover:text-amber-400 transition"
          >
            <Store className="w-5 h-5 mb-0.5" />
            <span>शॉप</span>
          </a>

          {/* Passbook Search */}
          <a
            href="#top"
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex flex-col items-center justify-center p-1 rounded-xl text-slate-300 hover:text-amber-400 transition"
          >
            <CreditCard className="w-5 h-5 mb-0.5 text-amber-400" />
            <span>पासबुक</span>
          </a>

          {/* Center Shopping Cart Button */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="flex flex-col items-center justify-center -mt-3.5 cursor-pointer"
          >
            <div className="relative w-12 h-12 rounded-full bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/30 border-2 border-[#0B1528] active:scale-95 transition-transform">
              <ShoppingCart className="w-5 h-5 stroke-[2.5]" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-red-600 text-white text-[9px] font-bold">
                  {cartItemsCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-bold text-amber-400 mt-0.5">कार्ट</span>
          </button>

          {/* Install App */}
          <button
            onClick={() => setShowInstallModal(true)}
            className="flex flex-col items-center justify-center p-1 rounded-xl text-amber-300 hover:text-amber-200 transition"
          >
            <Download className="w-5 h-5 mb-0.5 animate-bounce" />
            <span className="font-bold">ॲप 📥</span>
          </button>

          {/* Staff Login */}
          <button
            onClick={onOpenLoginModal}
            className="flex flex-col items-center justify-center p-1 rounded-xl text-slate-400 hover:text-slate-200 transition"
          >
            <Lock className="w-5 h-5 mb-0.5" />
            <span>लॉगिन</span>
          </button>
        </div>
      </nav>

      {/* PWA Install Modal Dialog */}
      <PWAInstallModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
      />

      {/* FLOATING DIRECT CALL & WHATSAPP BUTTONS (High Conversion) */}
      <FloatingCallAndWhatsApp
        primaryPhone="8766486915"
        secondaryPhone="8600122798"
      />
    </div>
  );
};
