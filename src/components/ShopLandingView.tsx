import React, { useState, useEffect, useMemo } from 'react';
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
  BookOpen,
  AlertCircle,
  Zap,
  Sun,
  Moon
} from 'lucide-react';
import {
  BusinessSettings,
  CardMember,
  CardTransaction,
  StockItem,
  CardSchemeConfig
} from '../types';
import { SCHEMES_CONFIG } from '../utils/storage';
import { AppLogo } from './AppLogo';
import { PWAInstallModal } from './PWAInstallModal';
import { usePWAInstall } from '../utils/usePWAInstall';
import { ProductEditModal } from './ProductEditModal';
import { OrderBillModal, OrderBillData } from './OrderBillModal';
import { ServicesAndTrustSection } from './ServicesAndTrustSection';
import { FloatingCallAndWhatsApp } from './FloatingCallAndWhatsApp';
import { useTheme } from '../context/ThemeContext';

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
  onOpenFieldActions?: () => void;
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
  onOpenFieldActions,
}) => {
  const { theme, toggleTheme } = useTheme();

  // Live typing search state for customer passbook lookup
  const [searchQuery, setSearchQuery] = useState(
    initialPassbookCardNo ? String(initialPassbookCardNo) : ''
  );
  const [searchError, setSearchError] = useState<string>('');
  const [selectedMember, setSelectedMember] = useState<CardMember | null>(null);
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
    } else {
      setSelectedMember(null);
    }
  }, [searchQuery, cardMembers]);

  // Explicit Search / Enter Handler requested by user
  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = searchQuery.trim();
    if (!q) {
      setSearchError('कृपया कार्ड नंबर (उदा. 1001) किंवा मोबाईल नंबर टाका');
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
      setSearchError('');
      setShowFullPassbookModal(true);
    } else {
      setSearchError(`कार्ड / मोबाईल '${q}' साठी नोंद सापडली नाही. कृपया नंबर तपासा.`);
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

  // Filtered stock items
  const filteredStock = useMemo(() => {
    if (selectedCategory === 'all') return stock;
    return stock.filter((item) => item.category === selectedCategory);
  }, [stock, selectedCategory]);

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
    setIsCartOpen(true);
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
  const handlePlaceOrderAndGenerateBill = () => {
    if (cart.length === 0) return;
    const invNo = `INV-ORD-${Date.now().toString().slice(-6)}`;
    const today = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

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
    };

    // Record into ERP store transactions if handler provided
    if (onRecordOrder) {
      const summary = cart.map((ci) => `${ci.item.name} (${ci.quantity})`).join(', ');
      onRecordOrder({
        invoiceNo: invNo,
        date: today,
        customerName: billData.customerName,
        customerPhone: billData.customerPhone,
        totalAmount: cartGrandTotal,
        payingNow: 0,
        dueAmount: cartGrandTotal,
        paymentMode: 'Cash on Delivery',
        itemDetails: `Online Store Order: ${summary}`,
      });
    }

    setActiveOrderBill(billData);
    setShowOrderBillModal(true);
    setCart([]);
    setIsCartOpen(false);
  };

  // WhatsApp Order Submission (Direct forward)
  const handlePlaceOrderWhatsApp = (targetPhone = '8766486915') => {
    if (cart.length === 0) return;
    const itemsList = cart
      .map(
        (ci, idx) =>
          `${idx + 1}. *${ci.item.name}* (Qty: ${ci.quantity}) - ₹${(
            ci.item.sellingPrice * ci.quantity
          ).toLocaleString()}`
      )
      .join('\n');

    const message = encodeURIComponent(
      `🛒 *NEW ONLINE ORDER - SHRI SAI ENTERPRISES*\n` +
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
      (orderNotes ? `*Note:* ${orderNotes}\n` : '') +
      `--------------------------------\n` +
      `Please confirm availability and dispatch time. Thank you!`
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
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 flex flex-col selection:bg-[#0D9488] selection:text-white transition-colors duration-200">
      {/* Top Admin Notice if Admin is Previewing */}
      {isAdminLoggedIn && (
        <div className="bg-slate-900 text-white px-4 py-2 text-xs flex items-center justify-between border-b border-slate-800 no-print">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-300 font-medium">
              Previewing <strong>Public Customer Website</strong> (Safe & Read-Only for Customers)
            </span>
          </div>
          {onGoToAdminDashboard && (
            <button
              onClick={onGoToAdminDashboard}
              className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              Back to Billing ERP
            </button>
          )}
        </div>
      )}

      {/* Top Announcement Bar */}
      <div className="bg-[#0B1528] text-amber-300 px-4 py-2 text-xs font-semibold text-center border-b border-white/10 flex items-center justify-center gap-2 no-print">
        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span className="text-slate-200">
          {settings.shopNotice || 'श्री साई इंटरप्राइजेस: ३०-महिने साप्ताहिक बचत कार्ड योजना बुकिंग चालू आहे • WhatsApp: 8766486915 & 8600122798'}
        </span>
        <span className="hidden md:inline text-white/30">•</span>
        <span className="hidden md:inline text-amber-300 font-mono font-bold">
          GST IN: 27ALOPL0030G2ZC
        </span>
      </div>

      {/* Primary Unique Header in English */}
      <header className="sticky top-0 z-40 bg-[#0B1528] text-white border-b border-white/10 shadow-lg no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3">
          {/* Brand Name & Address */}
          <div className="flex items-center gap-3">
            <a href="#top" className="flex items-center gap-3 group">
              <AppLogo size="sm" variant="iconOnly" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-white text-base sm:text-xl tracking-tight group-hover:text-amber-300 transition">
                    SHRI SAI ENTERPRISES
                  </span>
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-[10px] font-bold">
                    श्री साई इंटरप्राइजेस
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 hidden sm:block truncate max-w-md">
                  Matoshree Sabhagruha Samor, Arvi Road, Punjab Colony, Wardha - 442001
                </p>
              </div>
            </a>
          </div>

          {/* Header Action Buttons & Cart */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Install App Button */}
            <button
              onClick={() => setShowInstallModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-amber-400/10 hover:from-amber-500/30 hover:to-amber-400/20 border border-amber-400/40 text-xs font-bold text-amber-300 transition cursor-pointer shadow-sm animate-pulse"
              title="Install Mobile App on Phone"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">इन्स्टॉल ॲप</span>
              <span className="sm:hidden font-extrabold">ॲप 📥</span>
            </button>

            {/* Contact numbers popup button */}
            <button
              onClick={() => setShowContactsModal(true)}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold text-slate-200 transition cursor-pointer"
              title="View all official contact numbers"
            >
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              <span>संपर्क नंबर</span>
            </button>

            {/* Direct WhatsApp Buttons for both 8766486915 & 8600122798 */}
            <a
              href="https://wa.me/918766486915?text=Hello%20Shri%20Sai%20Enterprises"
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              title="Chat on WhatsApp 1 (8766486915)"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WA 1</span>
            </a>
            <a
              href="https://wa.me/918600122798?text=Hello%20Shri%20Sai%20Enterprises"
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              title="Chat on WhatsApp 2 (8600122798)"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WA 2</span>
            </a>

            {/* Day / Night Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Day (Light)' : 'Night (Dark)'} Mode`}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 hover:text-amber-300 transition-colors border border-white/15 cursor-pointer flex items-center justify-center shrink-0"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-300 animate-spin-slow" />
              ) : (
                <Moon className="w-4 h-4 text-slate-200" />
              )}
            </button>

            {/* Shopping Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative px-3 py-1.5 rounded-lg bg-[#0D9488] hover:bg-[#0f766e] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Open Shopping Cart"
            >
              <ShoppingCart className="w-3.5 h-3.5 text-white" />
              <span className="font-extrabold">Cart</span>
              {cartItemsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-slate-900 text-amber-300 text-[10px] font-mono font-black ml-0.5">
                  {cartItemsCount}
                </span>
              )}
            </button>

            {/* Quick Field Staff Actions Button (Fast access for marketing / field collection staff) */}
            {onOpenFieldActions && (
              <button
                onClick={onOpenFieldActions}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black transition cursor-pointer shadow-sm active:scale-95"
                title="Field Staff Counter: Weekly Collection, New Bill, Receipt & Ledger"
              >
                <Zap className="w-3.5 h-3.5 text-slate-950 fill-slate-950" />
                <span>स्टाफ काउंटर</span>
              </button>
            )}

            {/* Staff & Admin Login */}
            <button
              onClick={onOpenLoginModal}
              className="px-2.5 py-1.5 rounded-lg border border-white/20 hover:bg-white/10 text-slate-300 text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
              title="Staff & Owner Portal Login"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Staff Portal</span>
            </button>
          </div>
        </div>

        {/* Quick SEO Category & Conversion Navigation Bar */}
        <div className="bg-[#0e1b33] border-t border-white/10 px-4 py-2 overflow-x-auto no-scrollbar no-print">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 text-[11px] font-semibold text-slate-300 min-w-max">
            <div className="flex items-center gap-3 sm:gap-6">
              <a href="#products-catalog" className="hover:text-amber-400 transition flex items-center gap-1">
                <span>🛒 इलेक्ट्रॉनिक्स उत्पादने</span>
              </a>
              <a href="#services" className="hover:text-amber-400 transition flex items-center gap-1">
                <span>⚡ अधिकृत सेवा व दरपत्रक</span>
              </a>
              <a href="#savings-schemes" className="hover:text-amber-400 transition flex items-center gap-1">
                <span>🏆 ३०-महिने बचत योजना</span>
              </a>
              <a href="#enquiry-section" className="hover:text-amber-400 transition text-amber-300 flex items-center gap-1">
                <span>📝 त्वरित कोटेशन फॉर्म</span>
              </a>
              <a href="#location" className="hover:text-amber-400 transition flex items-center gap-1">
                <span>📍 गुगल मॅप व पत्ता</span>
              </a>
            </div>

            <div className="hidden lg:flex items-center gap-3 text-slate-400 font-mono text-[10px]">
              <span>📍 मातोश्री सभागृह समोर, आर्वी रोड, वर्धा</span>
              <span>•</span>
              <span className="text-emerald-400 font-bold">📲 8766486915 / 8600122798</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1">
        {/* HERO SECTION WITH LIVE TYPING PASSBOOK LOOKUP */}
        <section className="bg-[#0B1528] text-white pt-8 pb-10 px-4 sm:px-6 relative border-b border-slate-800">
          <div className="max-w-4xl mx-auto text-center space-y-4 relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-500/10 border border-teal-500/25 text-xs font-semibold text-teal-300">
              <Award className="w-3.5 h-3.5 text-teal-400" />
              <span>अधिकृत इलेक्ट्रॉनिक्स शोरूम • डिजिटल पासबुक • मोफत डिलिव्हरी</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight text-white font-marathi">
              श्री साई एंटरप्रायझेस, वर्धा<br />
              <span className="text-teal-400 text-xl sm:text-2xl font-bold block mt-1">
                इलेक्ट्रॉनिक्स, होम अप्लायन्सेस व ३०-महिने बचत योजना
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed font-marathi font-normal">
              कुलर, स्मार्ट LED टीव्ही, फ्रिज, वॉशिंग मशीन व दर्जेदार वायरिंग साहित्य. खाली तुमचा <strong className="text-teal-300 font-semibold">कार्ड नंबर</strong> किंवा <strong className="text-teal-300 font-semibold">मोबाईल नंबर</strong> टाकून थेट पासबुक तपासा.
            </p>

            {/* LIVE PASSBOOK SEARCH INPUT BOX WITH ENTER BUTTON */}
            <div className="bg-slate-900/90 p-3 sm:p-4 rounded-2xl border border-slate-700/80 shadow-xl max-w-xl mx-auto text-left space-y-2.5">
              <label className="block text-xs font-semibold text-teal-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-marathi">
                  <CreditCard className="w-4 h-4 text-teal-400" />
                  डिजिटल पासबुक शोध (कार्ड नंबर किंवा मोबाईल)
                </span>
                {selectedMember && (
                  <span className="text-[11px] text-emerald-400 font-mono font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> कार्ड सापडले #{selectedMember.cardNumber}
                  </span>
                )}
              </label>

              <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setSearchError('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSearchSubmit();
                      }
                    }}
                    placeholder="उदा. 1001 किंवा 10-अंकी मोबाईल नंबर..."
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white text-slate-900 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0D9488] shadow-inner"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedMember(null);
                        setSearchError('');
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#0D9488] hover:bg-[#0f766e] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition cursor-pointer shrink-0"
                >
                  <BookOpen className="w-4 h-4 text-white" />
                  <span>पासबुक उघडा</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>

              {/* Validation message if card not found */}
              {searchError && (
                <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-400/40 text-rose-200 text-xs flex items-center gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 text-rose-300 shrink-0" />
                  <span>{searchError}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] text-slate-300 pt-1">
                <span>उदा. कार्ड नंबर तपासा: <strong className="text-amber-300 cursor-pointer hover:underline" onClick={() => { setSearchQuery('1001'); setSearchError(''); }}>1001</strong>, <strong className="text-amber-300 cursor-pointer hover:underline" onClick={() => { setSearchQuery('1002'); setSearchError(''); }}>1002</strong>, <strong className="text-amber-300 cursor-pointer hover:underline" onClick={() => { setSearchQuery('2001'); setSearchError(''); }}>2001</strong></span>
                <span className="text-emerald-400 font-semibold">⚡ थेट लाइव्ह पासबुक</span>
              </div>
            </div>

            {/* INSTANT MINIMAL & INTERESTING PASSBOOK CARD (APPEARS AS USER TYPES) */}
            {selectedMember && (
              <div className="max-w-2xl mx-auto text-left bg-white text-slate-900 rounded-2xl p-5 sm:p-6 shadow-2xl border border-amber-300/40 animate-fade-in space-y-5">
                {/* Top Member Card Banner */}
                <div className="bg-gradient-to-r from-[#0B1528] to-[#1E3A8A] text-white p-4 sm:p-5 rounded-xl border border-white/15 relative overflow-hidden shadow-md">
                  <div className="absolute right-3 top-3 opacity-10 pointer-events-none">
                    <Store className="w-32 h-32" />
                  </div>
                  <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-mono font-black text-xs uppercase">
                          CARD #{selectedMember.cardNumber}
                        </span>
                        <span className="text-xs text-slate-300 font-medium">
                          {selectedMember.schemeName}
                        </span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-extrabold text-white mt-1">
                        {selectedMember.customerName}
                      </h3>
                      <p className="text-xs text-slate-300 font-mono mt-0.5">
                        📞 {selectedMember.phone || 'Phone not registered'} • {selectedMember.village || 'Wardha'}
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

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <span className="text-slate-500 text-[11px] block">Total Deposited</span>
                    <span className="text-base sm:text-lg font-black text-emerald-700 font-mono">
                      ₹{selectedMember.totalDeposited.toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <span className="text-slate-500 text-[11px] block">Installments Paid</span>
                    <span className="text-base sm:text-lg font-black text-blue-700 font-mono">
                      {memberTransactions.length} Weeks
                    </span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <span className="text-slate-500 text-[11px] block">Weekly Amount</span>
                    <span className="text-base sm:text-lg font-black text-slate-900 font-mono">
                      ₹500 / week
                    </span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <span className="text-slate-500 text-[11px] block">Passbook Status</span>
                    <span className="text-base sm:text-lg font-black text-emerald-600">
                      Verified ✓
                    </span>
                  </div>
                </div>

                {/* 52-WEEK PROGRESS VISUAL MATRIX */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      52-Week Progress Tracker (साप्ताहिक हप्ते ट्रॅकर)
                    </span>
                    <span className="text-slate-600 font-mono font-semibold">
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
                              : 'bg-slate-200 text-slate-400'
                          }`}
                        >
                          {weekNo}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded bg-emerald-600"></span> हप्ता भरला (Paid)
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded bg-slate-200"></span> आगामी हप्ते (Upcoming)
                    </span>
                  </div>
                </div>

                {/* Recent Receipts List */}
                {memberTransactions.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-700 block">Recent Payment Receipts:</span>
                    <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                      <table className="w-full text-left">
                        <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                          <tr>
                            <th className="py-2 px-3">Receipt No</th>
                            <th className="py-2 px-3">Date</th>
                            <th className="py-2 px-3">Type</th>
                            <th className="py-2 px-3 text-right">Amount (₹)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono">
                          {memberTransactions.slice(-4).map((tx) => (
                            <tr key={tx.id} className="hover:bg-slate-50">
                              <td className="py-2 px-3 font-semibold text-slate-900">{tx.receiptNo}</td>
                              <td className="py-2 px-3 text-slate-600">{tx.date}</td>
                              <td className="py-2 px-3">
                                <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-sans font-semibold">
                                  {tx.paymentMode}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-right font-bold text-emerald-600">
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
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200">
                  <div className="text-[11px] text-slate-500">
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
              </div>
            )}
          </div>
        </section>

        {/* SHOP PRODUCTS CATALOG & CART SECTION */}
        <section id="products" className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-8">
          {/* Section Header & Admin Controls */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-2">
                <Tv className="w-3.5 h-3.5" /> Home Appliances & Electronics Catalog
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Products Available for Direct Purchase & Free Delivery
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                घरगुती इलेक्ट्रॉनिक्स, कुलर, टीव्ही, फ्रिज, पंखे व वायरिंग साहित्य. थेट ऑनलाइन ऑर्डर करा किंवा ॲडमिनद्वारे फोटो व किंमत बदला.
              </p>
            </div>

            {/* Delivery Highlight Pill & Admin Mode Switch */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 text-xs text-emerald-900 flex items-center gap-2.5 shrink-0">
                <Truck className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-bold block">Free Home Delivery</span>
                  <span className="text-[11px] text-emerald-700">On all orders above ₹{delivery.freeDeliveryMinAmount.toLocaleString()}</span>
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
                    className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition cursor-pointer"
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
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#0D9488] text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750'
                }`}
              >
                {cat === 'all' ? 'All Products' : cat}
              </button>
            ))}
          </div>

          {/* Stock Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredStock.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-750 p-4 flex flex-col justify-between shadow-xs hover:shadow-md transition group relative"
              >
                <div>
                  {/* Product Photo */}
                  <div className="w-full h-48 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 mb-3 relative flex items-center justify-center border border-slate-100 dark:border-slate-700">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={`Shri Sai Enterprises Wardha - ${item.name} (${item.category})`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400 gap-1.5 p-4 text-center">
                        <Tv className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                        <span className="text-[11px] font-medium text-slate-400">{item.category}</span>
                      </div>
                    )}

                    {/* Quick Admin Edit Button on Photo Overlay */}
                    {isAdminMode && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingStockItem(item);
                          setIsProductEditModalOpen(true);
                        }}
                        className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-900 text-teal-300 text-[11px] font-bold backdrop-blur-xs flex items-center gap-1 shadow-md transition cursor-pointer"
                        title="किंमत व फोटो बदला"
                      >
                        <Edit3 className="w-3 h-3 text-teal-300" />
                        किंमत/फोटो बदला
                      </button>
                    )}
                  </div>

                  {/* Badges & Code */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono font-medium">
                        {item.code}
                      </span>
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" /> In Stock ({item.quantity} {item.unit})
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-[#0D9488] transition leading-snug line-clamp-2">
                        {item.name}
                      </h3>
                      {item.description && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">किंमत (Retail Price):</span>
                      <span className="text-xl font-black text-slate-900 dark:text-white font-mono">
                        ₹{item.sellingPrice.toLocaleString()}
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                      Genuine Warranty
                    </span>
                  </div>

                  {/* Admin Direct Price/Photo edit button if in Admin Mode */}
                  {isAdminMode && (
                    <button
                      onClick={() => {
                        setEditingStockItem(item);
                        setIsProductEditModalOpen(true);
                      }}
                      className="w-full py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 border border-teal-200 dark:border-teal-800 text-teal-900 dark:text-teal-300 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-teal-600" />
                      किंमत व फोटो बदला (Set Price & Photo)
                    </button>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => addToCart(item)}
                      className="w-full py-2 rounded-xl bg-[#0D9488] hover:bg-[#0f766e] text-white text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer shadow-xs active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add to Cart
                    </button>
                    <a
                      href={getDirectWhatsAppItemLink(item, '8766486915')}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition flex items-center justify-center gap-1 cursor-pointer"
                      title="WhatsApp वर चौकशी करा"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                      WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 30-MONTH SAVINGS SCHEMES SECTION */}
        <section id="savings-schemes" className="bg-slate-50 dark:bg-[#0c1427] py-12 px-4 sm:px-6 border-y border-slate-200 dark:border-slate-800">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-semibold text-[#0D9488] uppercase tracking-wider">
                साप्ताहिक बचत व लकी ड्रॉ योजना
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight font-marathi">
                श्री साई ३०-महिने साप्ताहिक बचत योजना 1, 2, 3
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-marathi">
                प्रत्येक आठवड्याला नियमित छोटी बचत करा आणि ३० महिन्यांत खात्रीशीर आपल्या पसंतीचे दर्जेदार इलेक्ट्रॉनिक्स उपकरणे मिळवा.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {SCHEMES_CONFIG.map((sc, idx) => (
                <div
                  key={sc.id}
                  className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-750 p-6 shadow-xs flex flex-col justify-between space-y-4 hover:border-teal-500/50 transition"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-mono font-bold text-xs">
                        {sc.code}
                      </span>
                      <span className="text-xs text-amber-600 dark:text-amber-400 font-bold font-marathi">
                        योजना क्र. {idx + 1}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 dark:text-white font-marathi">{sc.name}</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {sc.description}
                    </p>

                    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-xs space-y-1.5 border border-slate-100 dark:border-slate-700 font-mono">
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
                        <span className="font-bold text-slate-900 dark:text-white font-marathi">३० महिने (130 Weeks)</span>
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
                      className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-1 shadow-xs cursor-pointer"
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
                      className="py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                      title="WhatsApp 2 (8600122798)"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      WA 8600122798
                    </a>
                  </div>
                </div>
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

      {/* FOOTER */}
      <footer className="bg-slate-950 text-slate-400 text-xs py-10 px-4 sm:px-6 border-t border-slate-900 no-print">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-900">
            <div>
              <p className="font-bold text-base text-slate-100">
                Shri Sai Enterprises (श्री साई इंटरप्राइजेस) • Wardha
              </p>
              <p className="text-xs text-slate-400 mt-1">
                मातोश्री सभागृह समोर, आर्वी रोड, पंजाब कॉलनी, वर्धा - 442001, महाराष्ट्र
              </p>
              <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-amber-400 mt-2">
                <span>GSTIN: <strong>27ALOPL0030G2ZC</strong></span>
                <span>•</span>
                <span>Udyam Reg: <strong>UDYAM-MH-33-0012948</strong></span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href="tel:8766486915"
                className="px-3.5 py-2 rounded-xl bg-blue-900/60 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-1.5 transition"
              >
                <Phone className="w-3.5 h-3.5 text-amber-300" />
                8766486915
              </a>
              <a
                href="tel:8600122798"
                className="px-3.5 py-2 rounded-xl bg-blue-900/60 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-1.5 transition"
              >
                <Phone className="w-3.5 h-3.5 text-amber-300" />
                8600122798
              </a>
              <button
                onClick={onOpenLoginModal}
                className="px-3.5 py-2 rounded-xl border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-amber-300 transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Staff Portal</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
            <p>
              Top Services: Air Cooler Sales, Smart TV, Refrigerators, 30-Month Weekly Savings Card Scheme, Electrical Wiring & Appliance Repairs in Wardha, Arvi, Sevagram, Maharashtra.
            </p>
            <p className="shrink-0 font-medium">
              shrisaient.in © 2026
            </p>
          </div>
        </div>
      </footer>

      {/* SHOPPING CART MODAL / DRAWER */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#0F172A] rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-fade-in">
            {/* Cart Header */}
            <div className="bg-[#0F172A] text-white px-5 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-[#0D9488]" />
                <h3 className="font-bold text-base text-white">Your Shopping Cart</h3>
                <span className="px-2 py-0.5 rounded-full bg-[#0D9488] text-white text-xs font-black">
                  {cartItemsCount}
                </span>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4 text-slate-800 dark:text-slate-200">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-slate-400 space-y-3">
                  <ShoppingCart className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Your cart is empty</p>
                  <p className="text-xs text-slate-500">Browse the products below and click "Add to Cart" to start.</p>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {cart.map(({ item, quantity }) => (
                      <div key={item.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <Tv className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                          <div className="truncate">
                            <h4 className="font-bold text-slate-900 dark:text-white truncate">{item.name}</h4>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                              ₹{item.sellingPrice.toLocaleString()} each
                            </span>
                            {isAdminMode && (
                              <button
                                onClick={() => {
                                  setEditingStockItem(item);
                                  setIsProductEditModalOpen(true);
                                }}
                                className="block text-[10px] text-teal-600 dark:text-teal-400 font-bold hover:underline"
                              >
                                ✏️ किंमत/फोटो बदला
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-800">
                            <button
                              onClick={() => updateQuantity(item.id, -1)}
                              className="px-2 py-1 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold transition cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2.5 py-1 font-mono font-bold text-slate-900 dark:text-white">
                              {quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, 1)}
                              className="px-2 py-1 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold transition cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <span className="font-mono font-bold text-slate-900 dark:text-white min-w-16 text-right">
                            ₹{(item.sellingPrice * quantity).toLocaleString()}
                          </span>

                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Delivery Location & Free Delivery Banner */}
                  <div className="bg-slate-50 dark:bg-slate-850 rounded-xl p-3 border border-slate-200 dark:border-slate-750 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700 dark:text-slate-300">Delivery Destination:</span>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            name="deliveryType"
                            checked={deliveryType === 'local'}
                            onChange={() => setDeliveryType('local')}
                            className="text-[#0D9488]"
                          />
                          <span>Wardha City</span>
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            name="deliveryType"
                            checked={deliveryType === 'outer'}
                            onChange={() => setDeliveryType('outer')}
                            className="text-[#0D9488]"
                          />
                          <span>Surrounding Village</span>
                        </label>
                      </div>
                    </div>

                    {isFreeDelivery ? (
                      <div className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 p-2 rounded-lg font-bold text-[11px] flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>🎉 FREE HOME DELIVERY APPLIED! (Order over ₹{delivery.freeDeliveryMinAmount.toLocaleString()})</span>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-500">
                        Add ₹{(delivery.freeDeliveryMinAmount - cartSubtotal).toLocaleString()} more for FREE Delivery!
                      </div>
                    )}
                  </div>

                  {/* Customer Checkout Form */}
                  <div className="space-y-2 pt-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 dark:text-slate-200 font-marathi">ग्राहक माहिती (Customer Details):</span>
                      <span className="text-[10px] text-teal-700 dark:text-teal-400 font-semibold font-marathi">📲 छापील बिल WhatsApp वर मिळेल</span>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5 font-marathi">पूर्ण नाव (Full Name):</label>
                      <input
                        type="text"
                        placeholder="उदा. रमेश पाटील"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5 font-marathi">WhatsApp / मोबाईल नंबर:</label>
                      <input
                        type="tel"
                        placeholder="उदा. 9876543210"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0D9488] font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5 font-marathi">डिलिव्हरी पत्ता / गाव:</label>
                      <input
                        type="text"
                        placeholder="उदा. शिवाजी नगर, वर्धा / सावंगी"
                        value={customerAddress}
                        onChange={(e) => setCustomerAddress(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5 font-marathi">विशेष नोंद (Order Notes - Optional):</label>
                      <input
                        type="text"
                        placeholder="उदा. दुपारी डिलिव्हरी करावी"
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0D9488] text-xs"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Cart Footer Total & Checkout */}
            {cart.length > 0 && (
              <div className="bg-slate-50 dark:bg-slate-900/90 p-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Items Subtotal:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">₹{cartSubtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Delivery Charge:</span>
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {isFreeDelivery ? 'FREE' : `₹${currentDeliveryFee}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-800">
                    <span>Total Payable:</span>
                    <span className="font-mono text-base text-[#0D9488] font-black">₹{cartGrandTotal.toLocaleString()}</span>
                  </div>
                </div>

                {/* Primary Action: Confirm Order & Open Printed Bill */}
                <button
                  onClick={handlePlaceOrderAndGenerateBill}
                  className="w-full py-3 rounded-xl bg-[#0D9488] hover:bg-[#0f766e] text-white font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-white" />
                  <span className="font-marathi">ऑर्डर निश्चित करा व बिल मिळवा (Confirm & Get Bill)</span>
                </button>

                {/* WhatsApp Direct Forwarding Options */}
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <button
                    onClick={() => handlePlaceOrderWhatsApp('8766486915')}
                    className="py-2 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                    title="दुकान WhatsApp 1 वर ऑर्डर पाठवा"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    WA 1 (8766486915)
                  </button>
                  <button
                    onClick={() => handlePlaceOrderWhatsApp('8600122798')}
                    className="py-2 px-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-[11px] transition flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                    title="दुकान WhatsApp 2 वर ऑर्डर पाठवा"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    WA 2 (8600122798)
                  </button>
                </div>
              </div>
            )}
          </div>
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
                  <span className="font-semibold text-slate-800">{selectedMember.phone || 'N/A'}</span>
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
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-slate-900 text-sm">ॲडमिन ओळख पडताळणी</h3>
              </div>
              <button
                onClick={() => {
                  setShowAdminPasswordPrompt(false);
                  setAdminPasswordError('');
                }}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm font-mono"
                />
                {adminPasswordError && (
                  <p className="text-xs text-rose-600 font-semibold mt-1">
                    {adminPasswordError}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdminPasswordPrompt(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs cursor-pointer"
                >
                  रद्द करा
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-bold text-xs shadow-sm cursor-pointer"
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
          isOpen={showOrderBillModal}
          onClose={() => {
            setShowOrderBillModal(false);
            setActiveOrderBill(null);
          }}
          bill={activeOrderBill}
          shopSettings={settings}
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

          {/* Field Staff Quick Counter */}
          {onOpenFieldActions && (
            <button
              onClick={onOpenFieldActions}
              className="flex flex-col items-center justify-center p-1 rounded-xl text-amber-400 hover:text-amber-300 transition cursor-pointer"
              title="Field Staff Quick Actions"
            >
              <Zap className="w-5 h-5 mb-0.5 fill-amber-400 text-amber-400 animate-pulse" />
              <span className="font-extrabold text-amber-300 text-[9px]">स्टाफ</span>
            </button>
          )}

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
