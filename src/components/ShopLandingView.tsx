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
  Calendar,
  ChevronRight,
  Download,
  Edit3,
  FileText,
  KeyRound,
  BookOpen,
  AlertCircle,
  Zap,
  Sofa,
  Wind
} from 'lucide-react';
import {
  BusinessSettings,
  CardMember,
  CardTransaction,
  StockItem
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
import { ThemeToggle } from './ThemeToggle';

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
  const { theme } = useTheme();

  // Live typing search state for customer passbook lookup
  const [searchQuery, setSearchQuery] = useState(
    initialPassbookCardNo ? String(initialPassbookCardNo) : ''
  );
  const [searchError, setSearchError] = useState<string>('');
  const [selectedMember, setSelectedMember] = useState<CardMember | null>(null);
  const [showFullPassbookModal, setShowFullPassbookModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Shopping Cart state with localStorage persistence
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('shri_sai_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartToastMsg, setCartToastMsg] = useState<string | null>(null);

  // Sync cart to localStorage whenever updated
  useEffect(() => {
    try {
      localStorage.setItem('shri_sai_cart', JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart]);

  const [deliveryType, setDeliveryType] = useState<'local' | 'outer'>('local');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const { isInstallable } = usePWAInstall();

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
      setAdminPasswordError('Incorrect password! Please enter the admin password.');
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
      'Free home delivery on orders above ₹3,000 and all Card Scheme major appliances (TV, Refrigerator, Cooler, Sofa, Bed).',
  };

  // Optimized Member lookup map for O(1) instant search on mobile & web
  const memberLookupIndex = useMemo(() => {
    const cardMap = new Map<string, CardMember>();
    const phoneMap = new Map<string, CardMember>();
    const uniqueMap = new Map<string, CardMember>();

    for (const m of cardMembers) {
      cardMap.set(String(m.cardNumber), m);
      if (m.phone) {
        const cleanPhone = m.phone.replace(/[^0-9]/g, '');
        if (cleanPhone) {
          phoneMap.set(cleanPhone, m);
          if (cleanPhone.length >= 10) {
            phoneMap.set(cleanPhone.slice(-10), m);
          }
        }
      }
      if (m.uniqueId) {
        uniqueMap.set(m.uniqueId.toLowerCase().replace(/[^0-9a-zA-Z]/g, ''), m);
      }
    }
    return { cardMap, phoneMap, uniqueMap };
  }, [cardMembers]);

  // LIVE LOOKUP AS CUSTOMER TYPES CARD NUMBER OR MOBILE NUMBER
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSelectedMember(null);
      return;
    }

    const cleanQ = q.replace(/[^0-9a-zA-Z]/g, '').toLowerCase();
    const { cardMap, phoneMap, uniqueMap } = memberLookupIndex;

    const match =
      cardMap.get(q) ||
      phoneMap.get(cleanQ) ||
      (cleanQ.length >= 10 ? phoneMap.get(cleanQ.slice(-10)) : undefined) ||
      uniqueMap.get(cleanQ);

    if (match) {
      setSelectedMember(match);
    } else {
      setSelectedMember(null);
    }
  }, [searchQuery, memberLookupIndex]);

  // Explicit Search / Enter Handler
  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = searchQuery.trim();
    if (!q) {
      setSearchError('Please enter a Card Number (e.g. 1001) or mobile number');
      return;
    }

    const cleanQ = q.replace(/[^0-9a-zA-Z]/g, '').toLowerCase();
    const { cardMap, phoneMap, uniqueMap } = memberLookupIndex;

    const match =
      cardMap.get(q) ||
      phoneMap.get(cleanQ) ||
      (cleanQ.length >= 10 ? phoneMap.get(cleanQ.slice(-10)) : undefined) ||
      uniqueMap.get(cleanQ);

    if (match) {
      setSelectedMember(match);
      setSearchError('');
      setShowFullPassbookModal(true);
    } else {
      setSearchError(`No member record found for '${q}'. Please check your card number or phone.`);
    }
  };

  // If initialPassbookCardNo was passed in URL, auto-load that member
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
    setCartToastMsg(`Added "${item.name}" to cart`);
    setTimeout(() => {
      setCartToastMsg(null);
    }, 3000);
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
      customerName: customerName.trim() || 'Valued Customer',
      customerPhone: customerPhone.trim(),
      customerAddress: customerAddress.trim() || 'Wardha',
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

  // WhatsApp Order Submission
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
      `*Delivery Address:* ${customerAddress || 'Wardha delivery'}\n` +
      `*Delivery Area:* ${deliveryType === 'local' ? 'Wardha City' : 'Surrounding Area / Outer'}\n` +
      `--------------------------------\n` +
      `*ORDERED ITEMS:*\n${itemsList}\n` +
      `--------------------------------\n` +
      `*Subtotal:* ₹${cartSubtotal.toLocaleString()}\n` +
      `*Delivery Fee:* ${isFreeDelivery ? 'FREE (Order above ₹3,000)' : `₹${currentDeliveryFee}`}\n` +
      `*Total Payable:* ₹${cartGrandTotal.toLocaleString()}\n` +
      (orderNotes ? `*Note:* ${orderNotes}\n` : '') +
      `--------------------------------\n` +
      `Please confirm stock availability and dispatch time. Thank you!`
    );

    window.open(`https://wa.me/91${targetPhone}?text=${message}`, '_blank');
  };

  // Direct WhatsApp Link for individual items
  const getDirectWhatsAppItemLink = (item: StockItem, phone = '8766486915') => {
    const message = encodeURIComponent(
      `Hello Shri Sai Enterprises,\n` +
      `I am interested in purchasing this item:\n` +
      `*Item:* ${item.name}\n` +
      `*Price:* ₹${item.sellingPrice.toLocaleString()}\n` +
      `*Product Code:* ${item.code}\n` +
      `Please provide stock status and delivery details. Thank you!`
    );
    return `https://wa.me/91${phone}?text=${message}`;
  };

  // WhatsApp Passbook Share
  const handleSharePassbook = (member: CardMember) => {
    const url = `${window.location.origin}/?passbook=${member.cardNumber}`;
    const text = encodeURIComponent(
      `*Shri Sai Enterprises - Digital Savings Passbook*\n` +
      `Card Number: #${member.cardNumber} (${member.schemeName})\n` +
      `Member Name: ${member.customerName}\n` +
      `Total Deposited: ₹${member.totalDeposited.toLocaleString()}\n` +
      `Status: ${member.status}\n` +
      `🔗 View Verified Passbook Online:\n${url}\n\n` +
      `Showroom: Opp. Matoshree Sabhagruha, Arvi Road, Punjab Colony, Wardha - 442001\n` +
      `WhatsApp: 8766486915 / 8600122798`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 flex flex-col selection:bg-[#00523f] selection:text-white transition-colors duration-200">
      {/* Top Subtle Notification Bar */}
      <div className="bg-slate-900 text-slate-200 px-4 py-2 text-xs text-center border-b border-white/10 flex items-center justify-center gap-2 no-print">
        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span>
          {settings.shopNotice || 'Shri Sai Enterprises: 30-Month Weekly Passbook Schemes Enrollment Open • Direct Delivery Across Wardha'}
        </span>
        <span className="hidden md:inline text-white/25">•</span>
        <span className="hidden md:inline text-amber-300/90 font-mono text-[11px]">
          GSTIN: 27ALOPL0030G2ZC
        </span>
      </div>

      {/* Floating Minimalist Header (Neo-Apple Style) */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          {/* Brand Identity */}
          <a href="#top" className="flex items-center gap-3 group">
            <AppLogo size="sm" variant="iconOnly" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900 text-base sm:text-lg tracking-tight group-hover:text-[#00523f] transition-colors">
                  SHRI SAI
                </span>
                <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-medium tracking-wide">
                  Showroom & Schemes
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block truncate max-w-sm">
                Contemporary Furniture, Smart Electronics & Passbook Hub
              </p>
            </div>
          </a>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-slate-600">
            <a href="#products-catalog" className="hover:text-[#00523f] transition-colors">
              Collections
            </a>
            <a href="#top" className="hover:text-[#00523f] transition-colors">
              Passbook Lookup
            </a>
            <a href="#savings-schemes" className="hover:text-[#00523f] transition-colors">
              30-Month Schemes
            </a>
            <a href="#services" className="hover:text-[#00523f] transition-colors">
              Services & Trust
            </a>
            <a href="#location" className="hover:text-[#00523f] transition-colors">
              Showroom Location
            </a>
          </nav>

          {/* Action Buttons & Cart */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Install PWA Button */}
            <button
              onClick={() => setShowInstallModal(true)}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-700 transition cursor-pointer"
              title="Install App"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Install App</span>
            </button>

            {/* Shopping Cart Pill Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative px-4 py-2 rounded-full bg-[#00523f] hover:bg-[#004232] text-white text-xs font-medium transition flex items-center gap-1.5 shadow-[0_4px_14px_rgba(0,82,63,0.25)] active:scale-95 cursor-pointer"
              title="Open Shopping Cart"
            >
              <ShoppingCart className="w-3.5 h-3.5 text-white" />
              <span>Cart</span>
              {cartItemsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-white text-[#00523f] text-[10px] font-mono font-bold ml-1">
                  {cartItemsCount}
                </span>
              )}
            </button>

            {/* Quick Field Staff Actions Button */}
            {onOpenFieldActions && (
              <button
                onClick={onOpenFieldActions}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-medium transition cursor-pointer"
                title="Field Staff Actions"
              >
                <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
                <span className="hidden sm:inline">Staff Counter</span>
                <span className="sm:hidden">Staff</span>
              </button>
            )}

            {/* Staff / Admin Login */}
            <button
              onClick={onOpenLoginModal}
              className="p-2 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
              title="Staff Portal Login"
            >
              <Lock className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 space-y-16">
        {/* HERO SECTION: Minimalist, Neo-Apple with Bento Feature Cards */}
        <section id="top" className="pt-10 pb-6 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto space-y-10">
            {/* Top Typography & Minimal Header */}
            <div className="max-w-3xl mx-auto text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium">
                <Award className="w-3.5 h-3.5 text-[#00523f]" />
                <span>Wardha Showroom • Handcrafted Teak & Smart Electronics</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-semibold text-slate-900 tracking-tight leading-[1.15]">
                Curated Electronics & Contemporary Furniture
              </h1>

              <p className="text-sm sm:text-base text-slate-500 max-w-2xl mx-auto leading-relaxed">
                Experience solid wood furniture, certified 4K home appliances, and flexible 30-month installment plans with verified digital passbooks.
              </p>

              {/* Seamless Pill Search Bar for Passbook Lookup */}
              <div className="pt-2 max-w-xl mx-auto">
                <form
                  onSubmit={handleSearchSubmit}
                  className="bg-white rounded-full p-1.5 shadow-[0_12px_40px_-10px_rgba(0,0,0,0.08)] border border-slate-200/90 flex items-center gap-2"
                >
                  <div className="flex items-center gap-2.5 pl-4 flex-1">
                    <Search className="w-4 h-4 text-slate-400 shrink-0" />
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
                      placeholder="Enter Card # (e.g. 1001) or mobile..."
                      className="w-full text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none bg-transparent"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedMember(null);
                          setSearchError('');
                        }}
                        className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-full bg-[#00523f] hover:bg-[#004232] text-white text-xs font-medium flex items-center gap-1.5 shadow-[0_4px_14px_rgba(0,82,63,0.25)] transition active:scale-95 cursor-pointer shrink-0"
                  >
                    <span>Check Passbook</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </form>

                {/* Validation message */}
                {searchError && (
                  <div className="mt-2 p-2.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-center gap-2 animate-shake">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{searchError}</span>
                  </div>
                )}

                <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 mt-2.5">
                  <span>Quick demo cards:</span>
                  {['1001', '1002', '2001'].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        setSearchQuery(num);
                        setSearchError('');
                      }}
                      className="font-medium text-slate-600 hover:text-[#00523f] hover:underline cursor-pointer"
                    >
                      #{num}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* LIVE PASSBOOK RESULT CARD (Appears when valid member is looked up) */}
            {selectedMember && (
              <div className="max-w-2xl mx-auto bg-white rounded-3xl p-6 shadow-[0_16px_50px_-10px_rgba(0,0,0,0.06)] border border-slate-200/90 animate-fade-in space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-[#00523f] flex items-center justify-center font-mono font-bold text-sm">
                      #{selectedMember.cardNumber}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-slate-900">
                          {selectedMember.customerName}
                        </h3>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-[#00523f] text-[10px] font-semibold border border-emerald-100">
                          {selectedMember.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">
                        {selectedMember.schemeName} • {selectedMember.village || 'Wardha'} • {selectedMember.phone || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSharePassbook(selectedMember)}
                      className="px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Share</span>
                    </button>
                    <button
                      onClick={() => setShowFullPassbookModal(true)}
                      className="px-4 py-1.5 rounded-full bg-[#00523f] hover:bg-[#004232] text-white text-xs font-medium transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Slip</span>
                    </button>
                  </div>
                </div>

                {/* 4 Stat Tiles */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100">
                    <span className="text-slate-400 text-[11px] block">Total Deposited</span>
                    <span className="text-base font-semibold text-slate-900 font-mono mt-0.5 block">
                      ₹{selectedMember.totalDeposited.toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100">
                    <span className="text-slate-400 text-[11px] block">Installments Paid</span>
                    <span className="text-base font-semibold text-[#00523f] font-mono mt-0.5 block">
                      {memberTransactions.length} Weeks
                    </span>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100">
                    <span className="text-slate-400 text-[11px] block">Weekly Amount</span>
                    <span className="text-base font-semibold text-slate-900 font-mono mt-0.5 block">
                      ₹{selectedMember.schemeId === 'scheme-1' ? '150' : selectedMember.schemeId === 'scheme-2' ? '100' : '200'} / wk
                    </span>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100">
                    <span className="text-slate-400 text-[11px] block">Lucky Draw Status</span>
                    <span className="text-xs font-semibold text-amber-700 mt-1 block flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      Eligible
                    </span>
                  </div>
                </div>

                {/* Micro Progress Bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Passbook Tenure Progress</span>
                    <span className="font-mono">{memberTransactions.length} / 130 Weeks</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-[#00523f] rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, Math.round((memberTransactions.length / 130) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* BENTO HIGHLIGHT CARDS (Inspired directly by the reference image) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              {/* Card 1: Crisp White Minimal Card */}
              <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-[0_12px_40px_-10px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_45px_-8px_rgba(0,0,0,0.08)] transition-all duration-300 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#00523f] flex items-center justify-center border border-emerald-100">
                    <BookOpen className="w-6 h-6 stroke-[1.8]" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 tracking-tight">
                    30-Month Weekly Passbook
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Disciplined weekly savings with live 24/7 digital passbook tracking, instant verified receipts, and weekly lucky draws with bumper home appliances.
                  </p>
                </div>
                <div>
                  <a
                    href="#savings-schemes"
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-[#00523f] hover:bg-[#004232] text-white text-xs font-medium shadow-[0_4px_14px_rgba(0,82,63,0.2)] transition active:scale-95 cursor-pointer"
                  >
                    <span>View All Schemes</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Card 2: Sunset Apricot Gradient Card (Centerpiece) */}
              <div className="bg-gradient-to-b from-[#ffa34d] via-[#f7882f] to-[#f97316] text-white rounded-3xl p-8 shadow-[0_16px_50px_-10px_rgba(249,115,22,0.35)] flex flex-col justify-between space-y-6 relative overflow-hidden">
                <div className="space-y-4 relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs text-white flex items-center justify-center border border-white/30">
                    <Sofa className="w-6 h-6 stroke-[1.8]" />
                  </div>
                  <h3 className="text-xl font-semibold text-white tracking-tight">
                    Designer Furniture Studio
                  </h3>
                  <p className="text-xs text-white/90 leading-relaxed">
                    Handcrafted seasoned teak wood sofas, hydraulic storage beds, 6-seater dining sets, and wardrobes engineered for decades of comfort.
                  </p>
                </div>
                <div className="relative z-10">
                  <a
                    href="#products-catalog"
                    onClick={() => setSelectedCategory('Furniture')}
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-white hover:bg-slate-50 text-slate-900 text-xs font-medium shadow-md transition active:scale-95 cursor-pointer"
                  >
                    <span>Browse Furniture</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-900" />
                  </a>
                </div>
              </div>

              {/* Card 3: Deep Forest Emerald Card */}
              <div className="bg-[#00523f] text-white rounded-3xl p-8 shadow-[0_16px_50px_-10px_rgba(0,82,63,0.3)] flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/15 text-white flex items-center justify-center border border-white/20">
                    <Tv className="w-6 h-6 stroke-[1.8]" />
                  </div>
                  <h3 className="text-xl font-semibold text-white tracking-tight">
                    Smart Home Electronics
                  </h3>
                  <p className="text-xs text-white/80 leading-relaxed">
                    4K Google Smart TVs, 5-Star inverter frost-free refrigerators, high-speed ceiling fans, and heavy-duty desert coolers with official warranty.
                  </p>
                </div>
                <div>
                  <a
                    href="#products-catalog"
                    onClick={() => setSelectedCategory('all')}
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-medium border border-white/20 transition active:scale-95 cursor-pointer"
                  >
                    <span>Explore Appliances</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PRODUCTS CATALOG SECTION */}
        <section id="products-catalog" className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
          {/* Header and Filter Category Bar */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/80 pb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium mb-2">
                <Store className="w-3.5 h-3.5 text-[#00523f]" />
                <span>Showroom Inventory • Free Doorstep Delivery</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
                Curated Electronics & Furniture
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Order directly online or visit our showroom on Arvi Road, Wardha.
              </p>
            </div>

            {/* Admin Controls & Delivery Info */}
            <div className="flex items-center gap-3">
              {isAdminMode ? (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full text-xs text-[#00523f]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span className="font-medium">Admin Mode Active</span>
                </div>
              ) : (
                <button
                  onClick={() => setShowAdminPasswordPrompt(true)}
                  className="px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Admin Edit</span>
                </button>
              )}
            </div>
          </div>

          {/* Minimalist Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-medium transition cursor-pointer whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                {cat === 'all' ? 'All Collections' : cat}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredStock.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-3xl border border-slate-150 overflow-hidden shadow-[0_10px_30px_-6px_rgba(0,0,0,0.03)] hover:shadow-lg hover:border-slate-300 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  {/* Image Container */}
                  <div className="relative h-56 bg-slate-50 overflow-hidden flex items-center justify-center p-3">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover rounded-2xl group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <Tv className="w-12 h-12 text-slate-300" />
                    )}

                    <div className="absolute top-5 left-5">
                      <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-xs text-[10px] font-medium text-slate-700 shadow-2xs">
                        {item.category || 'Product'}
                      </span>
                    </div>

                    <div className="absolute top-5 right-5">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/90 text-white text-[10px] font-medium backdrop-blur-xs">
                        In Stock
                      </span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-5 space-y-2">
                    <h3 className="font-semibold text-slate-900 text-sm leading-snug group-hover:text-[#00523f] transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {item.description || 'Genuine company appliance with warranty and free delivery across Wardha.'}
                    </p>

                    <div className="pt-2 flex items-baseline justify-between">
                      <div>
                        <span className="text-[11px] text-slate-400 block">Retail Price:</span>
                        <span className="text-lg font-semibold text-slate-900 font-mono">
                          ₹{item.sellingPrice.toLocaleString()}
                        </span>
                      </div>
                      <span className="text-[11px] text-emerald-700 font-medium">
                        Free Delivery
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-5 pt-0 space-y-2">
                  {isAdminMode && (
                    <button
                      onClick={() => {
                        setEditingStockItem(item);
                        setIsProductEditModalOpen(true);
                      }}
                      className="w-full py-1.5 rounded-full border border-teal-200 bg-teal-50 text-teal-800 text-[11px] font-medium flex items-center justify-center gap-1 mb-2 hover:bg-teal-100 transition"
                    >
                      <Edit3 className="w-3 h-3 text-teal-600" />
                      <span>Edit Price & Photo</span>
                    </button>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => addToCart(item)}
                      className="py-2.5 rounded-full bg-[#00523f] hover:bg-[#004232] text-white text-xs font-medium flex items-center justify-center gap-1 shadow-xs transition active:scale-95 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add to Cart</span>
                    </button>

                    <a
                      href={getDirectWhatsAppItemLink(item, '8766486915')}
                      target="_blank"
                      rel="noreferrer"
                      className="py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium flex items-center justify-center gap-1 transition cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Inquire</span>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 30-MONTH SAVINGS SCHEMES SECTION */}
        <section id="savings-schemes" className="bg-slate-100/70 py-16 px-4 sm:px-6 border-y border-slate-200/80">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-xs font-semibold text-[#00523f] uppercase tracking-wider">
                Weekly Savings & Lucky Draw Plans
              </span>
              <h2 className="text-2xl sm:text-4xl font-semibold text-slate-900 tracking-tight">
                Shri Sai 30-Month Savings Schemes
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Save a small amount every week. Receive assured major electronic appliances or handcrafted teak furniture after 30 months, with weekly bumper lucky draws.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {SCHEMES_CONFIG.map((sc, idx) => (
                <div
                  key={sc.id}
                  className="bg-white rounded-3xl border border-slate-200/80 p-7 shadow-[0_12px_40px_-10px_rgba(0,0,0,0.04)] flex flex-col justify-between space-y-6 hover:border-slate-300 transition"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full bg-emerald-50 text-[#00523f] font-mono font-semibold text-xs border border-emerald-100">
                        {sc.code}
                      </span>
                      <span className="text-xs text-amber-600 font-semibold">
                        Plan No. {idx + 1}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-slate-900">{sc.name}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {sc.description}
                    </p>

                    <div className="bg-slate-50 rounded-2xl p-4 text-xs space-y-2 border border-slate-100 font-mono">
                      <div className="flex justify-between text-slate-500">
                        <span>Card Range:</span>
                        <span className="font-semibold text-slate-900">{sc.startCardNo} - {sc.endCardNo}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Registration Fee:</span>
                        <span className="font-semibold text-slate-900">₹{sc.registrationFee} (One Time)</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Tenure Duration:</span>
                        <span className="font-semibold text-slate-900">30 Months (130 Weeks)</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <a
                      href={`https://wa.me/918766486915?text=${encodeURIComponent(
                        `Hello Shri Sai Enterprises, I would like to book a card in ${sc.name} (Cards ${sc.startCardNo}-${sc.endCardNo}).`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="py-2.5 rounded-full bg-[#00523f] hover:bg-[#004232] text-white text-xs font-medium transition flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Book on WA 1</span>
                    </a>
                    <a
                      href={`https://wa.me/918600122798?text=${encodeURIComponent(
                        `Hello Shri Sai Enterprises, I would like to book a card in ${sc.name} (Cards ${sc.startCardNo}-${sc.endCardNo}).`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Book on WA 2</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SERVICES, TRUST, REVIEWS & LOCATION */}
        <ServicesAndTrustSection shopSettings={settings} />

        {/* OFFICIAL STORE & BANK DETAILS SECTION */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
          <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 sm:p-12 shadow-2xl space-y-8 border border-slate-800">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Showroom Address */}
              <div className="space-y-3">
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">
                  Showroom Address
                </span>
                <h3 className="text-xl font-semibold text-white">Shri Sai Enterprises</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Opposite Matoshree Sabhagruha, Arvi Road, Punjab Colony, Wardha - 442001, Maharashtra.
                </p>
                <div className="text-xs font-mono text-emerald-300 space-y-1 pt-1">
                  <p>GSTIN: <strong className="text-white">27ALOPL0030G2ZC</strong></p>
                  <p>Udyam: <strong className="text-white">UDYAM-MH-33-0012948</strong></p>
                </div>
              </div>

              {/* Contact Desks */}
              <div className="space-y-3">
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">
                  Contact & WhatsApp
                </span>
                <div className="space-y-2 text-xs font-mono">
                  <a href="tel:8766486915" className="flex items-center gap-2 text-slate-200 hover:text-white transition">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" /> 8766486915 (Primary & WhatsApp)
                  </a>
                  <a href="tel:8600122798" className="flex items-center gap-2 text-slate-200 hover:text-white transition">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" /> 8600122798 (WhatsApp 2)
                  </a>
                  <a href="tel:9175534365" className="flex items-center gap-2 text-slate-300 hover:text-white transition">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> 9175534365
                  </a>
                  <a href="tel:7822859073" className="flex items-center gap-2 text-slate-300 hover:text-white transition">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> 7822859073
                  </a>
                </div>
              </div>

              {/* Bank Account */}
              <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-4 text-xs">
                <span className="text-xs font-semibold text-amber-300 uppercase tracking-wider block">
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

            {/* Official Warranty Notice */}
            <div className="border-t border-white/10 pt-6 text-[11px] text-slate-300 leading-relaxed bg-white/5 p-4 rounded-2xl border border-white/10">
              <strong className="text-emerald-300 block mb-1 font-semibold">Warranty Terms & Official Coverage:</strong>
              All branded electronics carry official company warranties supported directly by certified service centers. Furniture crafted by Shri Sai carries a 5-year structural warranty against seasoning and termite defects.
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-slate-950 text-slate-400 text-xs py-10 px-4 sm:px-6 border-t border-slate-900 no-print">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-900">
            <div>
              <p className="font-semibold text-base text-white">
                Shri Sai Enterprises • Wardha
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Opposite Matoshree Sabhagruha, Arvi Road, Punjab Colony, Wardha - 442001, Maharashtra.
              </p>
              <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-slate-400 mt-2">
                <span>GSTIN: <strong className="text-slate-200">27ALOPL0030G2ZC</strong></span>
                <span>•</span>
                <span>Udyam: <strong className="text-slate-200">UDYAM-MH-33-0012948</strong></span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href="tel:8766486915"
                className="px-4 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs flex items-center gap-1.5 transition border border-slate-800"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                8766486915
              </a>
              <button
                onClick={onOpenLoginModal}
                className="px-4 py-2 rounded-full border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs font-medium cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Staff Portal</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
            <p>
              Electronics showroom, contemporary teak furniture, and 30-month weekly installment scheme manager.
            </p>
            <p className="shrink-0 font-medium">
              shrisaient.in © 2026
            </p>
          </div>
        </div>
      </footer>

      {/* SHOPPING CART DRAWER */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-fade-in">
            {/* Header */}
            <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-[#00523f]" />
                <h3 className="font-semibold text-base text-slate-900">Your Shopping Cart</h3>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                  {cartItemsCount}
                </span>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4 text-slate-800">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-slate-400 space-y-3">
                  <ShoppingCart className="w-12 h-12 mx-auto text-slate-300" />
                  <p className="text-sm font-semibold text-slate-700">Your cart is empty</p>
                  <p className="text-xs text-slate-400">Browse the catalog above and click "Add to Cart" to start.</p>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-slate-100">
                    {cart.map(({ item, quantity }) => (
                      <div key={item.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <Tv className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                          <div className="truncate">
                            <h4 className="font-semibold text-slate-900 truncate">{item.name}</h4>
                            <span className="text-[11px] text-slate-400 font-mono">
                              ₹{item.sellingPrice.toLocaleString()} each
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center border border-slate-200 rounded-full overflow-hidden bg-slate-50">
                            <button
                              onClick={() => updateQuantity(item.id, -1)}
                              className="px-2 py-1 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2 font-mono font-semibold text-slate-900">
                              {quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, 1)}
                              className="px-2 py-1 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <span className="font-mono font-semibold text-slate-900 min-w-16 text-right">
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
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-700">Delivery Destination:</span>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1 cursor-pointer text-slate-700">
                          <input
                            type="radio"
                            name="deliveryType"
                            checked={deliveryType === 'local'}
                            onChange={() => setDeliveryType('local')}
                            className="text-[#00523f]"
                          />
                          <span>Wardha City</span>
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer text-slate-700">
                          <input
                            type="radio"
                            name="deliveryType"
                            checked={deliveryType === 'outer'}
                            onChange={() => setDeliveryType('outer')}
                            className="text-[#00523f]"
                          />
                          <span>Surrounding Area</span>
                        </label>
                      </div>
                    </div>

                    {isFreeDelivery ? (
                      <div className="bg-emerald-50 text-[#00523f] border border-emerald-100 p-2.5 rounded-xl font-medium text-[11px] flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-[#00523f] shrink-0" />
                        <span>Free Home Delivery Applied (Order above ₹{delivery.freeDeliveryMinAmount.toLocaleString()})</span>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-500">
                        Add ₹{(delivery.freeDeliveryMinAmount - cartSubtotal).toLocaleString()} more for Free Delivery!
                      </div>
                    )}
                  </div>

                  {/* Customer Checkout Form */}
                  <div className="space-y-3 pt-2 text-xs">
                    <span className="font-semibold text-slate-900 block">
                      Delivery & Contact Details:
                    </span>
                    <div>
                      <label className="text-[11px] text-slate-500 block mb-1">Full Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Ramesh Patil"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00523f] text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-500 block mb-1">WhatsApp / Phone Number *</label>
                      <input
                        type="tel"
                        placeholder="e.g. 9876543210"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00523f] text-sm font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-500 block mb-1">Delivery Address / Village *</label>
                      <input
                        type="text"
                        placeholder="e.g. Shivaji Nagar, Wardha / Sawangi"
                        value={customerAddress}
                        onChange={(e) => setCustomerAddress(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00523f] text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-500 block mb-1">Order Notes (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Preferred delivery time..."
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#00523f] text-xs"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Cart Footer */}
            {cart.length > 0 && (
              <div className="bg-slate-50 p-6 border-t border-slate-100 space-y-4">
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Items Subtotal:</span>
                    <span className="font-mono font-semibold text-slate-900">₹{cartSubtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Delivery Charge:</span>
                    <span className="font-mono font-semibold text-emerald-700">
                      {isFreeDelivery ? 'FREE' : `₹${currentDeliveryFee}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold text-slate-900 pt-2 border-t border-slate-200">
                    <span>Total Payable:</span>
                    <span className="font-mono text-base text-[#00523f] font-bold">₹{cartGrandTotal.toLocaleString()}</span>
                  </div>
                </div>

                {/* Primary Action */}
                <button
                  onClick={handlePlaceOrderAndGenerateBill}
                  className="w-full py-3.5 rounded-full bg-[#00523f] hover:bg-[#004232] text-white font-medium text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(0,82,63,0.3)] cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Confirm Order & Generate Tax Invoice</span>
                </button>

                {/* WhatsApp Direct Forwarding */}
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <button
                    onClick={() => handlePlaceOrderWhatsApp('8766486915')}
                    className="py-2.5 px-3 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-[11px] transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Send on WA 1</span>
                  </button>
                  <button
                    onClick={() => handlePlaceOrderWhatsApp('8600122798')}
                    className="py-2.5 px-3 rounded-full bg-emerald-700 hover:bg-emerald-600 text-white font-medium text-[11px] transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Send on WA 2</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FULL PRINTABLE PASSBOOK RECEIPT MODAL */}
      {showFullPassbookModal && selectedMember && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-fade-in my-auto">
            {/* Top Modal Controls */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between no-print">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-amber-400">Card #{selectedMember.cardNumber}</span>
                <span className="text-slate-400">•</span>
                <span>Official Digital Passbook</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 rounded-full bg-[#00523f] hover:bg-[#004232] text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Slip</span>
                </button>
                <button
                  onClick={() => setShowFullPassbookModal(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Passbook Sheet */}
            <div id="printable-passbook" className="p-8 space-y-6 text-slate-800 bg-white">
              <div className="text-center border-b border-slate-200 pb-5">
                <h2 className="text-2xl font-semibold text-slate-900">
                  Shri Sai Enterprises
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Contemporary Furniture, Home Appliances & 30-Month Weekly Passbook
                </p>
                <p className="text-[11px] text-slate-400">
                  Opp. Matoshree Sabhagruha, Arvi Road, Punjab Colony, Wardha - 442001
                </p>
                <p className="text-[11px] font-mono text-slate-600 mt-1 font-medium">
                  GSTIN: 27ALOPL0030G2ZC • Phone: 8766486915, 8600122798
                </p>
              </div>

              {/* Member Card Box */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs grid grid-cols-2 gap-3 font-mono">
                <div>
                  <span className="text-slate-400 text-[10px] block">MEMBER NAME:</span>
                  <span className="font-semibold text-slate-900 font-sans text-sm">{selectedMember.customerName}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">CARD NUMBER:</span>
                  <span className="font-semibold text-slate-900 text-sm">#{selectedMember.cardNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">SCHEME:</span>
                  <span className="font-semibold text-[#00523f]">{selectedMember.schemeName}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">PHONE:</span>
                  <span className="font-medium text-slate-800">{selectedMember.phone || 'N/A'}</span>
                </div>
              </div>

              {/* Summary Metrics */}
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3">
                  <span className="text-[10px] text-emerald-800 block">Total Deposited</span>
                  <span className="font-mono font-semibold text-[#00523f] text-base">₹{selectedMember.totalDeposited.toLocaleString()}</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
                  <span className="text-[10px] text-slate-600 block">Weeks Completed</span>
                  <span className="font-mono font-semibold text-slate-800 text-base">{memberTransactions.length} / 130</span>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3">
                  <span className="text-[10px] text-amber-800 block">Lucky Draw Status</span>
                  <span className="font-semibold text-amber-700 text-xs">Eligible</span>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3.5">#</th>
                      <th className="py-2.5 px-3.5">Receipt No</th>
                      <th className="py-2.5 px-3.5">Date</th>
                      <th className="py-2.5 px-3.5">Mode</th>
                      <th className="py-2.5 px-3.5 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {memberTransactions.map((tx, idx) => (
                      <tr key={tx.id}>
                        <td className="py-2 px-3.5 text-slate-400">{idx + 1}</td>
                        <td className="py-2 px-3.5 font-semibold text-slate-900">{tx.receiptNo}</td>
                        <td className="py-2 px-3.5 text-slate-600">{tx.date}</td>
                        <td className="py-2 px-3.5">{tx.paymentMode}</td>
                        <td className="py-2 px-3.5 text-right font-semibold text-emerald-700">₹{tx.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="text-[10px] text-slate-400 border-t border-slate-100 pt-3 leading-relaxed">
                Brand warranties on appliances are serviced directly by official manufacturer service centers. Teak furniture carries a 5-year structural warranty.
              </div>

              {/* Signatory */}
              <div className="pt-4 flex items-end justify-between text-xs text-slate-500 border-t border-slate-100">
                <p className="text-[10px] text-slate-400 font-mono">Verified online: shrisaient.in</p>
                <div className="text-center">
                  <div className="h-6 w-28 border-b border-dashed border-slate-300 mx-auto"></div>
                  <p className="text-[10px] font-semibold text-slate-800 mt-1">Authorized Signatory</p>
                  <p className="text-[9px] text-slate-400">Shri Sai Enterprises</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN PASSWORD PROMPT MODAL */}
      {showAdminPasswordPrompt && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-500" />
                <h3 className="font-semibold text-slate-900 text-sm">Administrator Access</h3>
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

            <p className="text-xs text-slate-500 leading-relaxed">
              Enter the showroom admin password to edit product prices, stock details, and photographs:
            </p>

            <form onSubmit={handleVerifyAdminPassword} className="space-y-3">
              <div>
                <input
                  type="password"
                  autoFocus
                  placeholder="Enter admin password..."
                  value={adminPasswordInput}
                  onChange={(e) => {
                    setAdminPasswordInput(e.target.value);
                    setAdminPasswordError('');
                  }}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00523f] text-sm font-mono"
                />
                {adminPasswordError && (
                  <p className="text-xs text-rose-600 font-medium mt-1">
                    {adminPasswordError}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdminPasswordPrompt(false)}
                  className="flex-1 py-2.5 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-full bg-[#00523f] hover:bg-[#004232] text-white font-medium text-xs shadow-xs cursor-pointer"
                >
                  Unlock Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRODUCT EDIT MODAL */}
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

      {/* PRINTED BILL MODAL */}
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

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-1.5 lg:hidden shadow-2xl safe-area-pb">
        <div className="flex items-center justify-around max-w-lg mx-auto text-[10px]">
          <a
            href="#products-catalog"
            className="flex flex-col items-center justify-center p-1 rounded-xl text-slate-500 hover:text-[#00523f] transition"
          >
            <Store className="w-5 h-5 mb-0.5" />
            <span>Catalog</span>
          </a>

          <a
            href="#top"
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex flex-col items-center justify-center p-1 rounded-xl text-slate-500 hover:text-[#00523f] transition"
          >
            <CreditCard className="w-5 h-5 mb-0.5 text-[#00523f]" />
            <span>Passbook</span>
          </a>

          {/* Cart Button */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="flex flex-col items-center justify-center -mt-3.5 cursor-pointer"
          >
            <div className="relative w-12 h-12 rounded-full bg-[#00523f] text-white flex items-center justify-center shadow-lg shadow-emerald-950/20 border-2 border-white active:scale-95 transition-transform">
              <ShoppingCart className="w-5 h-5 stroke-[2.2]" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-red-500 text-white text-[9px] font-bold">
                  {cartItemsCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-semibold text-[#00523f] mt-0.5">Cart</span>
          </button>

          {/* Install App */}
          <button
            onClick={() => setShowInstallModal(true)}
            className="flex flex-col items-center justify-center p-1 rounded-xl text-slate-500 hover:text-slate-800 transition"
          >
            <Download className="w-5 h-5 mb-0.5" />
            <span>App</span>
          </button>

          {/* Staff Counter */}
          {onOpenFieldActions && (
            <button
              onClick={onOpenFieldActions}
              className="flex flex-col items-center justify-center p-1 rounded-xl text-amber-700 hover:text-amber-800 transition cursor-pointer"
              title="Staff Actions"
            >
              <Zap className="w-5 h-5 mb-0.5 fill-amber-500 text-amber-500" />
              <span className="font-semibold text-[9px]">Staff</span>
            </button>
          )}

          {/* Staff Login */}
          <button
            onClick={onOpenLoginModal}
            className="flex flex-col items-center justify-center p-1 rounded-xl text-slate-500 hover:text-slate-800 transition"
          >
            <Lock className="w-5 h-5 mb-0.5" />
            <span>Login</span>
          </button>
        </div>
      </nav>

      {/* Cart Toast Notification */}
      {cartToastMsg && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-[#00523f] text-white px-5 py-2.5 rounded-full shadow-xl flex items-center gap-2 text-xs font-medium animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{cartToastMsg}</span>
          <button
            onClick={() => {
              setCartToastMsg(null);
              setIsCartOpen(true);
            }}
            className="ml-2 px-2.5 py-0.5 rounded-full bg-white text-[#00523f] text-[10px] font-semibold cursor-pointer"
          >
            View Cart
          </button>
        </div>
      )}
    </div>
  );
};
