import React, { useState, useEffect, useMemo } from 'react';
import {
  Store,
  ShoppingCart,
  Phone,
  MapPin,
  Search,
  CheckCircle2,
  Lock,
  CreditCard,
  MessageCircle,
  Plus,
  Minus,
  Trash2,
  X,
  Sparkles,
  ShieldCheck,
  Truck,
  Award,
  Calendar,
  Gift,
  Eye,
  ArrowRight,
  Calculator,
  Star,
  Zap,
  Tag,
  Share2,
  Printer,
  ChevronLeft,
  ChevronRight,
  Tv,
  Sofa,
  Layers,
  Wind,
  Smartphone,
  RefreshCw,
  Check,
  Clock,
  Menu,
  Heart,
  HelpCircle,
  ArrowUp,
  SlidersHorizontal,
  BadgeCheck,
  Navigation,
  BookOpen,
  Instagram,
  Facebook,
  ExternalLink,
} from 'lucide-react';
import { StoreData, StockItem, CardMember, AdminUser } from '../../types';
import { NotificationService } from '../../services/notificationService';
import { SaiLogo, SaiLogoEmblem } from '../common/SaiLogo';
import { FinanceEmiModal } from '../common/FinanceEmiModal';
import { getGenuineProductImage } from '../../utils/productImages';
import { SecureErpLoginModal } from '../auth/SecureErpLoginModal';
import { MobileAgentFieldTerminal } from '../agent/MobileAgentFieldTerminal';
import { CardPassbookPrintModal } from '../scheme/CardPassbookPrintModal';
import { getActiveLandingConfig } from '../../utils/defaultLandingConfig';

interface CustomerShowroomViewProps {
  storeData: StoreData;
  isAdminLoggedIn?: boolean;
  onEnterAdminERP: (user?: AdminUser) => void;
  onReturnToERP?: () => void;
  onRefreshData?: () => void;
  onOpenAgentTerminal?: () => void;
}

interface CartItem {
  stock: StockItem;
  qty: number;
}

export const CustomerShowroomView: React.FC<CustomerShowroomViewProps> = ({
  storeData,
  isAdminLoggedIn = false,
  onEnterAdminERP,
  onReturnToERP,
  onRefreshData,
  onOpenAgentTerminal,
}) => {
  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating'>('featured');

  // Dynamic Landing Page Config (Admin editable from ERP)
  const landingConfig = useMemo(
    () => getActiveLandingConfig(storeData.landingPageConfig),
    [storeData.landingPageConfig]
  );

  // Hero Carousel State
  const [activeSlide, setActiveSlide] = useState(0);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLocalAgentTerminalOpen, setIsLocalAgentTerminalOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  // On-Page Passbook Portal State
  const [onPageCardQuery, setOnPageCardQuery] = useState('');
  const [onPageMember, setOnPageMember] = useState<CardMember | null>(null);
  const [onPageError, setOnPageError] = useState('');

  // Passbook Modal State
  const [isOpenPassbookModal, setIsOpenPassbookModal] = useState(false);
  const [passbookCardQuery, setPassbookCardQuery] = useState('');
  const [searchedMember, setSearchedMember] = useState<CardMember | null>(null);
  const [passbookError, setPassbookError] = useState('');
  const [isCardPassbookModalOpen, setIsCardPassbookModalOpen] = useState(false);
  const [selectedPassbookMember, setSelectedPassbookMember] = useState<CardMember | null>(null);

  // Quick View Product Detail Modal
  const [quickViewProduct, setQuickViewProduct] = useState<StockItem | null>(null);

  // Admin ERP Auth Modal State
  const [isAdminPinModalOpen, setIsAdminPinModalOpen] = useState(false);

  // Finance EMI Quotation Modal State
  const [isFinanceEmiOpen, setIsFinanceEmiOpen] = useState(false);
  const [financeProduct, setFinanceProduct] = useState<{ name: string; price: number }>({
    name: 'Samsung 55-inch Crystal 4K UHD Smart TV',
    price: 44990,
  });

  // Auto rotate hero slides every 5.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % 3);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  // Automatic Live Digital Passbook detection from URL parameters (?passbook=1021 or ?card=1021)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const cardParam = params.get('passbook') || params.get('card');
    if (cardParam) {
      const q = cardParam.trim().toLowerCase();
      const cleanNum = q.replace(/\D/g, '');
      const found = storeData.cardMembers.find(
        (m) =>
          m.cardNo.toLowerCase() === q ||
          m.cardNo.replace(/\D/g, '') === cleanNum ||
          m.cardNo.toLowerCase().includes(q) ||
          (cleanNum && m.phone.replace(/[^0-9]/g, '').includes(cleanNum))
      );
      if (found) {
        setOnPageCardQuery(found.cardNo);
        setOnPageMember(found);
        setSelectedPassbookMember(found);
        setIsCardPassbookModalOpen(true);
      } else {
        setOnPageCardQuery(cardParam);
        const el = document.getElementById('passbook-portal-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [storeData.cardMembers]);

  const categories = [
    { id: 'All', label: 'All Showroom Collections', icon: Store },
    { id: 'Electronics', label: 'Smart 4K TVs', icon: Tv },
    { id: 'Furniture', label: 'Royal Teakwood Sofas', icon: Sofa },
    { id: 'Diwan', label: 'Storage Diwans & Beds', icon: Layers },
    { id: 'Appliances', label: 'Refrigerators & AC', icon: Wind },
  ];

  // Curated Showroom Showcase Thumbnails
  const quickCategories = [
    {
      id: 'Electronics',
      label: 'Smart 4K LED TVs',
      sub: 'Sony, Samsung, LG (32"–65")',
      image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&auto=format&fit=crop&q=80',
      badge: 'Brand Warranty',
    },
    {
      id: 'Furniture',
      label: 'Royal Teak Sofas',
      sub: 'Pure Teakwood 3+1+1 Sets',
      image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&auto=format&fit=crop&q=80',
      badge: 'Factory Direct',
    },
    {
      id: 'Diwan',
      label: 'Storage Box Diwans',
      sub: 'Hydraulic Storage & Sagwan Cots',
      image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400&auto=format&fit=crop&q=80',
      badge: 'Heavy Wood',
    },
    {
      id: 'Appliances',
      label: 'Refrigerators & AC',
      sub: 'Single & Double Door Inverters',
      image: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=400&auto=format&fit=crop&q=80',
      badge: '5-Star Inverter',
    },
    {
      id: 'Furniture',
      label: 'Steel Almirahs',
      sub: 'Heavy Gauge Wardrobes',
      image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=400&auto=format&fit=crop&q=80',
      badge: 'Godrej Style',
    },
    {
      id: 'Scheme',
      label: '30-Month Scheme',
      sub: 'Weekly ₹100 / ₹200 Passbook',
      image: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=400&auto=format&fit=crop&q=80',
      badge: 'Weekly Lucky Draw',
    },
  ];

  // Helper to expand search tokens for Marathi + English keywords
  const getSearchTokens = (query: string): string[] => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const tokens = q.split(/\s+/);
    const expanded = new Set<string>(tokens);

    tokens.forEach((t) => {
      if (t.includes('tv') || t.includes('टीव्ही') || t.includes('led') || t.includes('स्मार्ट')) {
        ['tv', 'television', 'led', 'smart', '4k', 'uhd', 'oled', 'sony', 'lg', 'samsung'].forEach((w) =>
          expanded.add(w)
        );
      }
      if (t.includes('sofa') || t.includes('सोफा') || t.includes('सागवान') || t.includes('teak')) {
        ['sofa', 'furniture', 'teak', 'cushion', 'recliner', 'wooden', 'सागवान'].forEach((w) =>
          expanded.add(w)
        );
      }
      if (
        t.includes('diwan') ||
        t.includes('दिवाण') ||
        t.includes('bed') ||
        t.includes('कॉट') ||
        t.includes('गादी')
      ) {
        ['diwan', 'bed', 'box', 'storage', 'mattress', 'दिवाण'].forEach((w) => expanded.add(w));
      }
      if (
        t.includes('fridge') ||
        t.includes('फ्रिज') ||
        t.includes('फ्रीज') ||
        t.includes('रेफ्रिजरेटर')
      ) {
        ['fridge', 'refrigerator', 'whirlpool', 'godrej', 'lg', 'samsung', 'फ्रिज'].forEach((w) =>
          expanded.add(w)
        );
      }
      if (t.includes('cooler') || t.includes('कूलर') || t.includes('ac') || t.includes('एसी')) {
        ['cooler', 'ac', 'air', 'voltas', 'symphony', 'kenstar', 'कूलर'].forEach((w) =>
          expanded.add(w)
        );
      }
      if (
        t.includes('कपाट') ||
        t.includes('अलमारी') ||
        t.includes('wardrobe') ||
        t.includes('cupboard') ||
        t.includes('almari')
      ) {
        ['wardrobe', 'cupboard', 'almirah', 'almari', 'steel', 'कपाट'].forEach((w) =>
          expanded.add(w)
        );
      }
      if (
        t.includes('वॉशिंग') ||
        t.includes('washing') ||
        t.includes('मशिन') ||
        t.includes('machine')
      ) {
        ['washing', 'machine', 'washer'].forEach((w) => expanded.add(w));
      }
    });

    return Array.from(expanded);
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const el = document.getElementById('products-catalog-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Robust bilingual filter for catalog products
  const filteredProducts = useMemo(() => {
    const rawQ = searchQuery.trim().toLowerCase();
    const tokens = getSearchTokens(rawQ);

    return storeData.stock
      .filter((item) => {
        if (item.hideOnLanding) return false;

        const itemText = `${item.name} ${item.brand} ${item.model || ''} ${item.category || ''} ${
          item.code || ''
        } ${item.description || ''}`.toLowerCase();

        let matchesSearch = true;
        if (rawQ) {
          matchesSearch = tokens.some((tok) => itemText.includes(tok)) || itemText.includes(rawQ);
        }

        let matchesCat = true;
        if (selectedCategory !== 'All' && !rawQ) {
          if (selectedCategory === 'Electronics') {
            matchesCat =
              item.category === 'Electronics' || itemText.includes('tv') || itemText.includes('led');
          } else if (selectedCategory === 'Furniture') {
            matchesCat =
              item.category === 'Furniture' ||
              itemText.includes('sofa') ||
              itemText.includes('almari') ||
              itemText.includes('कपाट');
          } else if (selectedCategory === 'Diwan') {
            matchesCat =
              itemText.includes('diwan') ||
              itemText.includes('दिवाण') ||
              itemText.includes('bed') ||
              itemText.includes('कॉट');
          } else if (selectedCategory === 'Appliances') {
            matchesCat =
              item.category === 'Home Appliances' ||
              item.category === 'Kitchen Appliances' ||
              itemText.includes('refrigerator') ||
              itemText.includes('cooler') ||
              itemText.includes('washing') ||
              itemText.includes('ac') ||
              itemText.includes('फ्रिज');
          }
        }

        return matchesSearch && matchesCat;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.salePrice - b.salePrice;
        if (sortBy === 'price-desc') return b.salePrice - a.salePrice;
        return 0;
      });
  }, [storeData.stock, searchQuery, selectedCategory, sortBy]);

  // Cart operations
  const addToCart = (stock: StockItem) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.stock.id === stock.id);
      if (existing) {
        return prev.map((item) =>
          item.stock.id === stock.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { stock, qty: 1 }];
    });
    setIsCartOpen(true);

    NotificationService.addNotification({
      type: 'cart_item_added',
      title: 'Item Added to Cart',
      message: `A customer added "${stock.name}" (${stock.brand}) to their cart.`,
      data: {
        amount: stock.salePrice,
        itemNames: [stock.name],
      },
    });
  };

  const updateCartQty = (stockId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.stock.id === stockId) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const cartTotalAmount = cart.reduce((acc, item) => acc + item.stock.salePrice * item.qty, 0);
  const cartItemCount = cart.reduce((acc, item) => acc + item.qty, 0);

  // WhatsApp Order Generator
  const handleCheckoutWhatsApp = () => {
    if (cart.length === 0) return;

    NotificationService.addNotification({
      type: 'order_completed',
      title: 'New Order Placed!',
      message: `${customerName.trim() || 'A customer'} placed an order worth ₹${cartTotalAmount.toLocaleString('en-IN')}.`,
      data: {
        amount: cartTotalAmount,
        customerName: customerName.trim() || 'Customer',
        customerPhone: customerPhone.trim() || undefined,
        itemNames: cart.map((i) => i.stock.name),
      },
    });

    let msg = `*Shree Sai Enterprises (SHRI SAI ENTERPRISES, WARDHA)*\n`;
    msg += `(Electronics, Home Appliances & Solid Teakwood Furniture Showroom)\n`;
    msg += `📍 Address: ${landingConfig.contactInfo.address || 'Opp. Matoshree Sabhagruh, Arvi Road, Punjab Colony, Wardha - 442001'}\n`;
    msg += `📞 Helpline: ${landingConfig.contactInfo.helpline1 || '8766486915'} | ${landingConfig.contactInfo.helpline2 || '8600122978'} | ${landingConfig.contactInfo.helpline3 || '9175537365'}\n`;
    msg += `--------------------------------\n`;
    if (customerName.trim()) msg += `👤 Customer: *${customerName.trim()}*\n`;
    if (customerPhone.trim()) msg += `📞 Phone: ${customerPhone.trim()}\n`;
    if (customerAddress.trim()) msg += `📍 Address: ${customerAddress.trim()}\n`;
    msg += `Date: ${new Date().toLocaleDateString('en-IN')}\n`;
    msg += `--------------------------------\n`;
    cart.forEach((item, index) => {
      msg += `${index + 1}. *${item.stock.name}* (${item.stock.brand})\n`;
      msg += `   Qty: ${item.qty} | Rate: ₹${item.stock.salePrice.toLocaleString('en-IN')} = ₹${(item.stock.salePrice * item.qty).toLocaleString('en-IN')}\n`;
    });
    msg += `--------------------------------\n`;
    msg += `💰 *Total Amount: ₹${cartTotalAmount.toLocaleString('en-IN')} (All Taxes Included)*\n`;
    msg += `🚚 Delivery: Free Doorstep Delivery (Wardha & 50 km Radius)\n`;
    msg += `--------------------------------\n`;
    msg += `Please confirm my order and share delivery schedule. Thank you!`;

    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/${landingConfig.contactInfo.whatsappNumber}?text=${encoded}`, '_blank');
  };

  // Helper for Member Stats Calculation
  const calculateMemberStats = (member: CardMember) => {
    const memberPayments = storeData.cardTransactions.filter(
      (t) => t.cardNo.toLowerCase() === member.cardNo.toLowerCase()
    );
    const txTotal = memberPayments.reduce((acc, t) => acc + t.amount, 0);
    const totalPaid = txTotal + (member.totalAmountPaid || member.totalPaid || 0);
    const weeklyAmt =
      member.monthlyAmount && member.monthlyAmount <= 500 ? member.monthlyAmount : 100;
    const paidWeeks =
      memberPayments.length > 0
        ? memberPayments.length
        : Math.max(1, Math.floor(totalPaid / weeklyAmt));
    const totalWeeks = member.durationMonths ? member.durationMonths * 4 : 120;
    const totalTarget = weeklyAmt * totalWeeks;
    const remainingWeeks = Math.max(0, totalWeeks - paidWeeks);
    return {
      memberPayments,
      totalPaid,
      weeklyAmt,
      paidWeeks,
      remainingWeeks,
      totalTarget,
      totalWeeks,
    };
  };

  // On-Page Passbook Search Handler
  const handleOnPageSearchPassbook = (e: React.FormEvent) => {
    e.preventDefault();
    setOnPageError('');
    const q = onPageCardQuery.trim().toLowerCase();
    if (!q) {
      setOnPageError('Please enter your Card Number (e.g. 1001) or 10-digit mobile number.');
      return;
    }

    const found = storeData.cardMembers.find(
      (m) =>
        m.cardNo.toLowerCase() === q ||
        m.cardNo.toLowerCase().includes(q) ||
        m.phone.replace(/[^0-9]/g, '').includes(q.replace(/[^0-9]/g, ''))
    );

    if (found) {
      setOnPageMember(found);
      setOnPageError('');
    } else {
      setOnPageMember(null);
      setOnPageError(`No passbook record found for Card/Mobile "${onPageCardQuery}".`);
    }
  };

  // Modal Passbook Search
  const handleSearchPassbook = (e: React.FormEvent) => {
    e.preventDefault();
    setPassbookError('');
    const q = passbookCardQuery.trim().toLowerCase();
    if (!q) {
      setPassbookError('Please enter a Card Number or mobile number.');
      return;
    }

    const found = storeData.cardMembers.find(
      (m) =>
        m.cardNo.toLowerCase() === q ||
        m.cardNo.toLowerCase().includes(q) ||
        m.phone.replace(/[^0-9]/g, '').includes(q.replace(/[^0-9]/g, ''))
    );

    if (found) {
      setSearchedMember(found);
      setPassbookError('');
    } else {
      setSearchedMember(null);
      setPassbookError('No member card found for this number.');
    }
  };

  // Current Admin & Staff Users
  const currentAdminUsers: AdminUser[] = useMemo(() => {
    if (storeData.adminUsers && storeData.adminUsers.length > 0) {
      return storeData.adminUsers;
    }
    return [
      {
        id: 'usr-1',
        username: 'admin',
        displayName: 'Store Owner / Admin',
        role: 'Admin',
        pin: '1234',
        status: 'active',
      },
    ];
  }, [storeData.adminUsers]);

  const pendingUsers = useMemo(() => {
    return currentAdminUsers.filter((u) => u.status === 'pending');
  }, [currentAdminUsers]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#080d16] text-[#f1f5f9] selection:bg-amber-500 selection:text-slate-950">
      
      {/* 0. ELEGANT LUXURY TOP ANNOUNCEMENT & CONTACT RIBBON */}
      {landingConfig.enableAnnouncementBar !== false && (
        <div className="bg-[#05080e] border-b border-amber-500/20 text-slate-300 text-xs py-2 px-3 sm:px-6">
          <div className="max-w-[1520px] mx-auto flex items-center justify-between gap-4">
            
            {/* Left: Store Greeting / Trust Badge */}
            <div className="flex items-center gap-2 overflow-hidden truncate">
              {landingConfig.announcement?.enabled ? (
                <>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black uppercase shrink-0 shadow-xs">
                    {landingConfig.announcement.badge || 'SPECIAL DEAL'}
                  </span>
                  <span className="truncate text-white font-medium text-xs">
                    {landingConfig.announcement.text}
                  </span>
                  {landingConfig.announcement.highlightText && (
                    <span className="hidden md:inline text-amber-300 font-bold shrink-0">
                      • {landingConfig.announcement.highlightText}
                    </span>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2 text-xs truncate">
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-black tracking-wider uppercase shrink-0">
                    Wardha Flagship Showroom
                  </span>
                  <span className="text-slate-200 font-medium truncate">
                    Shree Sai Enterprises • 30-Month Lucky Draw Savings Scheme, Solid Teakwood Furniture & Branded Electronics
                  </span>
                </div>
              )}
            </div>

            {/* Right: Direct Helpline, Timings & Quick Contacts */}
            <div className="flex items-center gap-4 shrink-0 text-xs font-semibold">
              <div className="hidden xl:flex items-center gap-1.5 text-slate-400">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Open Daily: 9:30 AM – 9:30 PM</span>
              </div>

              <a
                href={`tel:${landingConfig.contactInfo.helpline1 || '8766486915'}`}
                className="hidden sm:inline-flex items-center gap-1.5 text-amber-300 hover:text-amber-200 transition"
                title="Call Showroom Directly"
              >
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <span>{landingConfig.contactInfo.helpline1 || '8766486915'}</span>
              </a>

              <a
                href={`https://wa.me/${landingConfig.contactInfo.whatsappNumber}?text=${encodeURIComponent(
                  'Hello Shree Sai Enterprises (Wardha), I would like information regarding furniture, electronics, and the 30-Month Weekly Savings Scheme.'
                )}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 font-bold text-xs transition"
                title="Connect via WhatsApp"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>WhatsApp Inquiry</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 1. DISTINCTIVE ROYAL SHOWROOM MAIN HEADER */}
      <header className="sticky top-0 z-40 bg-[#090e18]/95 backdrop-blur-md text-white shadow-xl border-b border-amber-500/20">
        <div className="max-w-[1520px] mx-auto px-3 sm:px-6 py-3 flex items-center justify-between gap-3 sm:gap-6">
          
          {/* Brand Logo & Royal Identity (High Contrast, Bold & Ultra Visible!) */}
          <div
            className="flex items-center gap-3 sm:gap-4 shrink-0 cursor-pointer group"
            onClick={() => setSelectedCategory('All')}
          >
            <SaiLogo size="lg" glow={true} />
            <div className="flex flex-col">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base sm:text-2xl font-black tracking-tight text-white font-sans">
                  SHREE SAI ENTERPRISES
                </span>
                <span className="text-[10px] sm:text-xs font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Wardha Showroom
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-300 flex items-center gap-1.5 mt-0.5 font-sans">
                <span className="text-amber-400 font-semibold">Shree Sai Enterprises</span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400 hidden sm:inline">Electronics & Solid Teak Furniture Showroom (Arvi Road)</span>
              </p>
            </div>
          </div>

          {/* Showroom Physical Location Pin */}
          <div
            onClick={() => {
              const el = document.getElementById('google-business-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/40 cursor-pointer text-xs text-left transition"
            title="Opposite Matoshree Sabhagruh, Arvi Road, Punjab Colony, Wardha 442001"
          >
            <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="leading-tight">
              <span className="text-[10px] text-slate-400 block">Showroom Address</span>
              <span className="font-bold text-slate-200 block truncate max-w-[180px]">
                Opp. Matoshree Sabhagruh, Arvi Road, Wardha
              </span>
            </div>
          </div>

          {/* Sleek Showroom Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex-1 max-w-2xl hidden md:flex items-center rounded-xl overflow-hidden bg-[#111827] border border-slate-700/80 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/20 shadow-inner transition"
          >
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                const el = document.getElementById('products-catalog-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-[#1a2333] text-slate-200 text-xs px-3.5 py-2.5 border-r border-slate-700 outline-none cursor-pointer font-semibold hover:bg-slate-800 transition"
            >
              <option value="All">All Departments</option>
              <option value="Electronics">Smart 4K TVs</option>
              <option value="Furniture">Teakwood Sofas</option>
              <option value="Diwan">Storage Diwans & Beds</option>
              <option value="Appliances">Refrigerators & AC</option>
            </select>

            <input
              type="text"
              placeholder="Search Smart 4K TVs, Teak Sofas, Diwans, Refrigerators, 30-Month Scheme..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-3.5 py-2 text-xs text-slate-100 outline-none placeholder:text-slate-500 font-medium bg-transparent"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="px-2 text-slate-400 hover:text-slate-200 text-xs font-bold cursor-pointer"
                title="Clear Search"
              >
                ✕
              </button>
            )}
            <button
              type="submit"
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 px-4 py-2.5 transition flex items-center justify-center cursor-pointer font-bold shrink-0"
              title="Search Products"
            >
              <Search className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>

          {/* Right Showroom Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            
            {/* Passbook / Customer Account Link */}
            <button
              onClick={() => {
                const el = document.getElementById('passbook-portal-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
                else setIsOpenPassbookModal(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-left cursor-pointer transition text-xs flex items-center gap-2"
              title="30-Month Weekly Savings Scheme Passbook"
            >
              <CreditCard className="w-4 h-4 text-amber-400" />
              <div className="hidden sm:block leading-tight">
                <span className="text-[10px] text-amber-400/80 block">30-Month Scheme</span>
                <span className="font-bold text-amber-200 block">Check Passbook</span>
              </div>
            </button>

            {/* Showroom Order / Cart Drawer */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 cursor-pointer transition"
              title="View Cart / Quote"
            >
              <div className="relative">
                <ShoppingCart className="w-4 h-4 text-amber-400" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black leading-none">
                    {cartItemCount}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline">Cart / Quote</span>
            </button>

            {/* Admin & Staff ERP Protected Login */}
            {isAdminLoggedIn ? (
              <button
                onClick={() => (onReturnToERP ? onReturnToERP() : onEnterAdminERP())}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-md cursor-pointer shrink-0"
              >
                <Store className="w-3.5 h-3.5 shrink-0" />
                <span>ERP Dashboard</span>
              </button>
            ) : (
              <button
                onClick={() => setIsAdminPinModalOpen(true)}
                className="px-3 py-1.5 rounded-xl border border-slate-700 hover:border-amber-400/60 bg-slate-900/80 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer relative shrink-0"
                title="ERP Login (Staff & Admin Portal)"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="hidden sm:inline">Staff ERP Login</span>
                <span className="sm:hidden">Login</span>
                {pendingUsers.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center animate-pulse">
                    {pendingUsers.length}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Search Bar Row */}
        <div className="md:hidden px-3 pb-2.5 pt-0.5">
          <form
            onSubmit={handleSearchSubmit}
            className="flex items-center bg-[#111827] rounded-xl overflow-hidden border border-slate-700 focus-within:border-amber-400 shadow-inner"
          >
            <input
              type="text"
              placeholder="Search Smart TVs, Teak Sofas, Diwans, Scheme..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-3 py-2 text-xs text-white outline-none font-medium bg-transparent"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="px-2 text-slate-400 text-xs font-bold"
              >
                ✕
              </button>
            )}
            <button
              type="submit"
              className="bg-amber-500 text-slate-950 px-3.5 py-2 cursor-pointer font-bold"
              title="Search"
            >
              <Search className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>
        </div>

        {/* 2. REFINED SHOWROOM COLLECTIONS NAVIGATION BAR */}
        <div className="bg-[#0b101a] text-slate-300 px-3 sm:px-6 py-2 text-xs font-medium flex items-center gap-3 sm:gap-5 overflow-x-auto no-scrollbar border-t border-slate-800/80">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg whitespace-nowrap cursor-pointer transition ${
              selectedCategory === 'All'
                ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                : 'hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Store className="w-3.5 h-3.5 text-amber-400" />
            <span>All Showroom Stock</span>
          </button>

          <button
            onClick={() => setSelectedCategory('Electronics')}
            className={`px-3 py-1 rounded-lg whitespace-nowrap cursor-pointer transition ${
              selectedCategory === 'Electronics'
                ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                : 'hover:text-white hover:bg-slate-800/50'
            }`}
          >
            Smart 4K TVs (Sony, Samsung, LG)
          </button>

          <button
            onClick={() => setSelectedCategory('Furniture')}
            className={`px-3 py-1 rounded-lg whitespace-nowrap cursor-pointer transition ${
              selectedCategory === 'Furniture'
                ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                : 'hover:text-white hover:bg-slate-800/50'
            }`}
          >
            Solid Teakwood Sofas
          </button>

          <button
            onClick={() => setSelectedCategory('Diwan')}
            className={`px-3 py-1 rounded-lg whitespace-nowrap cursor-pointer transition ${
              selectedCategory === 'Diwan'
                ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                : 'hover:text-white hover:bg-slate-800/50'
            }`}
          >
            Storage Box Diwans & Beds
          </button>

          <button
            onClick={() => setSelectedCategory('Appliances')}
            className={`px-3 py-1 rounded-lg whitespace-nowrap cursor-pointer transition ${
              selectedCategory === 'Appliances'
                ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                : 'hover:text-white hover:bg-slate-800/50'
            }`}
          >
            Inverter Refrigerators, Washers & AC
          </button>

          <button
            onClick={() => {
              const el = document.getElementById('passbook-portal-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-3 py-1 rounded-lg whitespace-nowrap text-amber-300 font-bold flex items-center gap-1.5 cursor-pointer ml-auto bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>30-Month Weekly Savings Scheme (₹100–₹200/Week)</span>
          </button>
        </div>
      </header>

      {/* 3. SHOWROOM FEATURED CATEGORY THUMBNAILS RIBBON */}
      <div className="bg-[#0b101a]/60 border-b border-slate-800/80 py-4 px-3 sm:px-6">
        <div className="max-w-[1520px] mx-auto flex items-center justify-between sm:justify-start gap-3 sm:gap-6 overflow-x-auto no-scrollbar">
          {quickCategories.map((c) => {
            const isSelected = selectedCategory === c.id;
            return (
              <button
                key={c.label}
                onClick={() => {
                  if (c.id === 'Scheme') {
                    const el = document.getElementById('passbook-portal-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                    else setIsOpenPassbookModal(true);
                  } else {
                    setSelectedCategory(c.id);
                  }
                }}
                className={`flex flex-col items-center gap-2 shrink-0 group transition cursor-pointer p-1.5 rounded-2xl ${
                  isSelected ? 'scale-105' : 'hover:scale-105'
                }`}
              >
                <div
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-2 transition-all p-0.5 bg-[#0f172a] shadow-lg ${
                    isSelected
                      ? 'border-amber-400 ring-2 ring-amber-400/40 shadow-amber-500/20'
                      : 'border-slate-700 group-hover:border-amber-400'
                  }`}
                >
                  <img
                    src={c.image}
                    alt={c.label}
                    className="w-full h-full object-cover rounded-xl group-hover:scale-110 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src =
                        'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300&auto=format&fit=crop&q=80';
                    }}
                  />
                </div>
                <div className="text-center">
                  <span
                    className={`text-[11px] sm:text-xs font-bold block whitespace-nowrap leading-tight text-slate-200 ${
                      isSelected ? 'text-amber-300' : 'group-hover:text-amber-300'
                    }`}
                  >
                    {c.label}
                  </span>
                  <span className="text-[9px] text-amber-400 font-medium block leading-tight">
                    {c.badge}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. EDITORIAL CINEMATIC HERO BANNER FOR WARDHA SHOWROOM */}
      {landingConfig.showHeroSection !== false && (() => {
        const heroSlides =
          landingConfig.heroSlides && landingConfig.heroSlides.filter((s) => s.active).length > 0
            ? landingConfig.heroSlides
                .filter((s) => s.active)
                .map((s, idx) => {
                  return {
                    id: s.id,
                    tag: s.tag,
                    tagIcon: idx === 1 ? Gift : idx === 2 ? Award : Sparkles,
                    titleLead: s.titleLead,
                    titleHighlight: s.titleHighlight,
                    description: s.subtitle,
                    bgImage: s.imageUrl,
                    themeGradient:
                      idx === 1
                        ? 'from-[#120803]/95 via-[#1c0d05]/85 sm:via-[#1c0d05]/75 to-[#1c0d05]/20'
                        : idx === 2
                        ? 'from-[#08121f]/95 via-[#0e1c30]/85 sm:via-[#0e1c30]/75 to-[#0e1c30]/20'
                        : 'from-[#080d16]/95 via-[#101726]/85 sm:via-[#101726]/75 to-[#101726]/20',
                    accentColor: '#f59e0b',
                    ctaPrimary: s.primaryBtnText,
                    ctaAction: () => {
                      if (s.primaryBtnTarget === 'scheme' || s.primaryBtnTarget === 'passbook') {
                        const el = document.getElementById('passbook-portal-section');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      } else if (s.primaryBtnTarget === 'whatsapp') {
                        window.open(
                          `https://wa.me/${landingConfig.contactInfo.whatsappNumber}?text=${encodeURIComponent(
                            'Hello Shree Sai Enterprises (Wardha), I would like to inquire about your products.'
                          )}`,
                          '_blank'
                        );
                      } else {
                        const el = document.getElementById('products-catalog-section');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }
                    },
                    ctaSecondary: s.secondaryBtnText,
                    ctaSecondaryAction: () => {
                      if (s.secondaryBtnTarget === 'catalog') {
                        const el = document.getElementById('products-catalog-section');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      } else if (s.secondaryBtnTarget === 'whatsapp') {
                        window.open(
                          `https://wa.me/${landingConfig.contactInfo.whatsappNumber}?text=${encodeURIComponent(
                            'Hello Shree Sai Enterprises (Wardha), I would like to request a quotation.'
                          )}`,
                          '_blank'
                        );
                      } else {
                        const el = document.getElementById('passbook-portal-section');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }
                    },
                    highlights: [s.cardMetric, s.cardMetric2, '100% Authorized Warranty'],
                    cardBadge: s.cardBadge,
                    cardTitle: s.titleLead,
                    cardSubtitle: s.titleHighlight,
                    cardMetric: s.cardMetric,
                    cardMetric2: s.cardMetric2,
                  };
                })
            : [];

        const currentSlide = heroSlides[activeSlide] || heroSlides[0];

        return (
          <div className="max-w-[1520px] mx-auto px-3 sm:px-6 pt-4 pb-2 w-full">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-800 min-h-[440px] sm:min-h-[480px] lg:min-h-[510px] flex items-center bg-[#070b12]">
              {/* Full-bleed background image layers with crossfade */}
              {heroSlides.map((slide, idx) => {
                const isActive = activeSlide === idx;
                return (
                  <div
                    key={slide.id}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                      isActive ? 'opacity-100 z-0' : 'opacity-0 -z-10 pointer-events-none'
                    }`}
                  >
                    <img
                      src={slide.bgImage}
                      alt={slide.titleLead}
                      className="w-full h-full object-cover object-center transform scale-105 transition-transform duration-7000 ease-out"
                      referrerPolicy="no-referrer"
                      loading={idx === 0 ? 'eager' : 'lazy'}
                      onError={(e) => {
                        e.currentTarget.src =
                          'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1600&auto=format&fit=crop&q=80';
                      }}
                    />
                    <div className={`absolute inset-0 bg-gradient-to-r ${slide.themeGradient}`} />
                    <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#080d16] via-[#080d16]/70 to-transparent" />
                    <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[#080d16]/60 to-transparent" />
                  </div>
                );
              })}

              {/* Foreground Content for Current Slide */}
              <div className="relative z-10 w-full px-6 sm:px-10 lg:px-14 py-8 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                {/* Left Content */}
                <div className="max-w-2xl space-y-4">
                  {/* Badge Pill */}
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/70 backdrop-blur-md border border-amber-500/30 text-amber-300 text-xs font-bold shadow-lg">
                    {React.createElement(currentSlide.tagIcon, {
                      className: 'w-3.5 h-3.5 text-amber-400',
                    })}
                    <span className="tracking-wide">{currentSlide.tag}</span>
                  </div>

                  {/* Headline */}
                  <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white drop-shadow-md font-serif">
                    {currentSlide.titleLead}{' '}
                    <span className="bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
                      {currentSlide.titleHighlight}
                    </span>
                  </h1>

                  {/* Description */}
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-xl drop-shadow font-medium">
                    {currentSlide.description}
                  </p>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-3 pt-2 text-xs sm:text-sm">
                    <button
                      onClick={currentSlide.ctaAction}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black transition flex items-center gap-2 shadow-xl shadow-amber-500/20 active:scale-95 cursor-pointer"
                    >
                      <span>{currentSlide.ctaPrimary}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <button
                      onClick={currentSlide.ctaSecondaryAction}
                      className="px-5 py-3 rounded-xl bg-slate-900/60 hover:bg-slate-800 text-white font-bold backdrop-blur-md transition flex items-center gap-2 border border-slate-700 active:scale-95 cursor-pointer shadow-md"
                    >
                      <span>{currentSlide.ctaSecondary}</span>
                    </button>

                    <a
                      href={`https://wa.me/${landingConfig.contactInfo.whatsappNumber}?text=${encodeURIComponent(
                        'Hello Shree Sai Enterprises, I would like information regarding products and the 30-Month Savings Scheme.'
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center gap-1.5 active:scale-95 shadow-md"
                      title="WhatsApp Enquiry"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span className="hidden sm:inline">WhatsApp Connect</span>
                    </a>
                  </div>

                  {/* Trust Highlights */}
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    {currentSlide.highlights.map((h, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/60 backdrop-blur-md border border-slate-800 text-[11px] text-slate-200 font-medium"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        {h}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Right Side Minimal Glass Preview Card (Desktop) */}
                <div className="hidden lg:block w-80 shrink-0">
                  <div className="p-5 rounded-2xl bg-slate-900/70 backdrop-blur-xl border border-amber-500/20 text-white shadow-2xl space-y-3.5 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-amber-300 tracking-wider px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
                        {currentSlide.cardBadge}
                      </span>
                      <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> 100% Genuine Quality
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-base font-black text-white leading-snug font-serif">
                        {currentSlide.cardTitle}
                      </h4>
                      <p className="text-[11px] text-slate-300">{currentSlide.cardSubtitle}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1 text-xs">
                      <div className="flex items-center justify-between text-slate-300">
                        <span>Weekly Installment Option</span>
                        <strong className="text-amber-300 font-mono text-sm">
                          {currentSlide.cardMetric}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between text-slate-300 text-[11px]">
                        <span>Free Doorstep Delivery</span>
                        <span className="text-emerald-300 font-semibold">{currentSlide.cardMetric2}</span>
                      </div>
                    </div>

                    <button
                      onClick={currentSlide.ctaAction}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 text-amber-300 text-xs font-bold transition flex items-center justify-center gap-1.5 border border-amber-500/40 cursor-pointer"
                    >
                      <span>Explore Collection</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Progress Indicators */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
                {heroSlides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveSlide(idx)}
                    className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                      activeSlide === idx
                        ? 'bg-amber-400 w-9 shadow-lg shadow-amber-500/50'
                        : 'bg-white/30 w-2 hover:bg-white/60'
                    }`}
                    title={`Slide ${idx + 1}`}
                  />
                ))}
              </div>

              {/* Next / Prev Controls */}
              <button
                onClick={() =>
                  setActiveSlide((prev) => (prev === 0 ? heroSlides.length - 1 : prev - 1))
                }
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-slate-950/60 hover:bg-slate-950/90 backdrop-blur-md text-white transition cursor-pointer border border-slate-700 hover:scale-105"
                title="Previous Slide"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() =>
                  setActiveSlide((prev) => (prev === heroSlides.length - 1 ? 0 : prev + 1))
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-slate-950/60 hover:bg-slate-950/90 backdrop-blur-md text-white transition cursor-pointer border border-slate-700 hover:scale-105"
                title="Next Slide"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        );
      })()}

      {/* 4.2 PROMINENT LIVE OFFERS & FESTIVE SHOWROOM DEALS */}
      {landingConfig.enableOffersSection !== false &&
        landingConfig.offers &&
        landingConfig.offers.filter((o) => o.active).length > 0 && (
          <section id="offers-deals-section" className="max-w-[1520px] mx-auto px-3 sm:px-6 py-3 w-full">
            <div className="rounded-3xl bg-gradient-to-r from-[#141b27] via-[#1a2333] to-[#141b27] border-2 border-amber-500/40 p-4 sm:p-6 shadow-2xl relative overflow-hidden">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-amber-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/30">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-rose-600 text-white">
                        Showroom Specials
                      </span>
                      <h2 className="text-base sm:text-xl font-black text-white tracking-tight font-serif">
                        Exclusive Showroom Deals & Festive Offers
                      </h2>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Limited-Time Offers • Book Directly via WhatsApp with 1 Click
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-amber-300 font-bold">
                    {landingConfig.offers.filter((o) => o.active).length} Active Offers Available
                  </span>
                </div>
              </div>

              {/* Offers Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                {landingConfig.offers
                  .filter((o) => o.active)
                  .map((offer) => (
                    <div
                      key={offer.id}
                      className="rounded-2xl bg-[#0b1019]/90 border border-slate-700/80 hover:border-amber-400 p-4 flex flex-col justify-between space-y-3 transition-all duration-200 hover:shadow-xl hover:shadow-amber-500/10 group"
                    >
                      <div className="space-y-2.5">
                        {offer.imageUrl && (
                          <div className="h-32 rounded-xl overflow-hidden bg-black/60 relative">
                            <img
                              src={offer.imageUrl}
                              alt={offer.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-black uppercase bg-rose-600 text-white shadow">
                              {offer.badge}
                            </span>
                            <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold bg-black/80 text-amber-300">
                              {offer.category}
                            </span>
                          </div>
                        )}

                        {!offer.imageUrl && (
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-rose-600 text-white shadow">
                              {offer.badge}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              {offer.category}
                            </span>
                          </div>
                        )}

                        <h3 className="font-bold text-sm text-white group-hover:text-amber-300 transition-colors line-clamp-2 leading-snug font-serif">
                          {offer.title}
                        </h3>

                        <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                          {offer.subtitle}
                        </p>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-slate-800">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-black text-emerald-400">{offer.discount}</span>
                          <span className="text-[11px] text-slate-400">{offer.validTill}</span>
                        </div>

                        <a
                          href={`https://wa.me/${landingConfig.contactInfo.whatsappNumber}?text=${encodeURIComponent(
                            offer.whatsappMessage ||
                              `Hello, I would like more details about "${offer.title}".`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition cursor-pointer"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Claim Offer (WhatsApp)</span>
                        </a>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </section>
        )}

      {/* 5. SHOWROOM TRUST & VALUE PROPOSITION STRIP */}
      <div className="max-w-[1520px] mx-auto px-3 sm:px-6 py-2.5 w-full">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 rounded-2xl bg-[#0f1726] border border-slate-800 text-xs shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <span className="font-bold block text-white text-xs">Free Express Delivery</span>
              <span className="text-[10px] text-slate-400">Wardha City & 50 km Radius</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <span className="font-bold block text-white text-xs">100% Authentic GST Invoice</span>
              <span className="text-[10px] text-slate-400">Official Brand Warranty</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <span className="font-bold block text-white text-xs">Weekly Savings from ₹100</span>
              <span className="text-[10px] text-slate-400">30-Month Lucky Draw Scheme</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
              <Calculator className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <span className="font-bold block text-white text-xs">0% Interest Easy EMI</span>
              <span className="text-[10px] text-slate-400">Bajaj & TVS Finance Available</span>
            </div>
          </div>
        </div>
      </div>

      {/* 6. MAIN CATALOG: BOUTIQUE SHOWROOM PRODUCT GRID */}
      <main
        id="products-catalog-section"
        className="max-w-[1520px] mx-auto px-3 sm:px-6 py-5 flex-1 w-full space-y-6 scroll-mt-20"
      >
        {/* Search Results Banner */}
        {searchQuery.trim() && (
          <div className="bg-[#10192a] border border-amber-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-lg">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold">
                <Search className="w-4 h-4" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 font-extrabold text-sm">Search Results:</span>
                  <span className="font-black text-white text-base">"{searchQuery}"</span>
                </div>
                <div className="text-slate-300 text-[11px]">
                  {filteredProducts.length > 0
                    ? `${filteredProducts.length} products found.`
                    : `No products found matching this name.`}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs flex items-center gap-1.5 transition border border-slate-700 cursor-pointer shadow-sm active:scale-95"
            >
              <span>Show All Products</span>
              <span>✕</span>
            </button>
          </div>
        )}

        {/* Category Tabs & Sorting Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 no-scrollbar">
            {categories.map((c) => {
              const IconComp = c.icon;
              const isSelected = selectedCategory === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-2 border ${
                    isSelected
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 border-amber-400 shadow-md shadow-amber-500/10'
                      : 'bg-[#101726] text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  <IconComp className="w-3.5 h-3.5" />
                  <span>{c.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto text-xs text-slate-400">
            <span>{filteredProducts.length} Products Available</span>
            <div className="flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="bg-[#101726] text-slate-200 text-xs px-3 py-1.5 rounded-xl border border-slate-700 outline-none cursor-pointer"
              >
                <option value="featured">Featured / Best Sellers</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Zero Results Feedback */}
        {storeData.stock.length === 0 ? (
          <div className="py-20 px-4 text-center rounded-3xl bg-[#0f1726] border border-slate-800 space-y-4">
            <div className="w-16 h-16 rounded-full bg-slate-800 text-amber-400 flex items-center justify-center mx-auto text-3xl">
              🏪
            </div>
            <div className="space-y-2 max-w-md mx-auto">
              <h3 className="text-lg font-bold text-white font-serif">Showroom Ready for New Stock</h3>
              <p className="text-xs text-slate-400">
                Login to the ERP Portal to add new inventory or import from Excel/CSV.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsAdminPinModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-lg transition cursor-pointer"
              >
                🔐 ERP Portal Login (+ Add Stock)
              </button>
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-16 px-4 text-center rounded-3xl bg-[#0f1726] border border-slate-800 space-y-4">
            <div className="w-16 h-16 rounded-full bg-slate-800 text-amber-400 flex items-center justify-center mx-auto text-2xl">
              🔍
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">"{searchQuery}" No products found for</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Please check the spelling or choose from our showroom categories:
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('Electronics');
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs font-semibold text-amber-300 hover:bg-slate-700"
              >
                Smart 4K TVs
              </button>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('Furniture');
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs font-semibold text-amber-300 hover:bg-slate-700"
              >
                Teakwood Sofas
              </button>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('Diwan');
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs font-semibold text-amber-300 hover:bg-slate-700"
              >
                Diwan Beds
              </button>
            </div>
          </div>
        ) : (
          /* High-End Showroom Product Cards Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredProducts.map((prod) => {
              const genuineImg = getGenuineProductImage(prod);
              const discountPct =
                prod.mrp && prod.mrp > prod.salePrice
                  ? Math.round(((prod.mrp - prod.salePrice) / prod.mrp) * 100)
                  : 0;
              const savingsAmt = prod.mrp ? Math.max(0, prod.mrp - prod.salePrice) : 0;
              const isBestSeller =
                prod.isFeaturedOnLanding ||
                (prod.landingBadge && prod.landingBadge.toLowerCase().includes('best'));

              return (
                <div
                  key={prod.id}
                  className="rounded-2xl overflow-hidden bg-[#0d1424] border border-slate-800 hover:border-amber-400/60 transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/10 flex flex-col justify-between group"
                >
                  {/* Image Container with Brand & Tags */}
                  <div
                    onClick={() => setQuickViewProduct(prod)}
                    className="relative h-60 bg-[#070b14] p-4 flex items-center justify-center cursor-pointer overflow-hidden border-b border-slate-800/80"
                  >
                    <img
                      src={genuineImg}
                      alt={prod.name}
                      className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src =
                          'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop&q=80';
                      }}
                    />

                    {/* Brand Tag Top Left */}
                    <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-900/90 text-amber-300 border border-amber-500/30">
                      {prod.brand}
                    </span>

                    {/* Deal Badges Top Right */}
                    <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
                      {prod.landingBadge ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-600 text-white shadow">
                          {prod.landingBadge}
                        </span>
                      ) : discountPct > 0 ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-600 text-white shadow">
                          {discountPct}% OFF
                        </span>
                      ) : null}
                    </div>

                    {/* Quick View Button on Hover */}
                    <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setQuickViewProduct(prod);
                        }}
                        className="w-full py-1.5 bg-slate-900/95 hover:bg-slate-900 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow border border-slate-700"
                      >
                        <Eye className="w-3.5 h-3.5 text-amber-400" />
                        <span>Quick View</span>
                      </button>
                    </div>
                  </div>

                  {/* Card Content & Pricing */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      {isBestSeller && (
                        <div className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 mb-1.5 font-bold">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span>Showroom Best Seller</span>
                        </div>
                      )}

                      <h3
                        onClick={() => setQuickViewProduct(prod)}
                        className="font-bold text-sm text-slate-100 group-hover:text-amber-300 line-clamp-2 leading-snug cursor-pointer transition-colors font-serif"
                        title={prod.name}
                      >
                        {prod.name}
                      </h3>

                      {/* Verified Rating */}
                      <div className="flex items-center gap-1.5 mt-1 text-xs">
                        <div className="flex text-amber-400">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-current" />
                          ))}
                        </div>
                        <span className="text-slate-400 text-[11px] font-medium">
                          4.8★ (Customer Favorite)
                        </span>
                      </div>

                      <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">
                        {prod.description ||
                          '100% Authorized Brand Warranty, GST Invoice & Free Doorstep Delivery.'}
                      </p>
                    </div>

                    {/* Pricing Box */}
                    <div className="space-y-2.5 pt-2 border-t border-slate-800">
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-black text-white tabular-nums tracking-tight">
                            ₹{prod.salePrice.toLocaleString('en-IN')}
                          </span>
                          {prod.mrp && prod.mrp > prod.salePrice && (
                            <span className="text-xs text-slate-400 line-through">
                              ₹{prod.mrp.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>

                        {savingsAmt > 0 && (
                          <div className="text-[11px] text-emerald-400 font-bold">
                            Instant Savings: ₹{savingsAmt.toLocaleString('en-IN')}
                          </div>
                        )}
                      </div>

                      {/* 30-Month Weekly Scheme Card Calculation */}
                      <div className="p-2 rounded-xl bg-[#090f1a] border border-slate-800 space-y-0.5">
                        <div className="flex items-center justify-between text-[11px] text-amber-300 font-bold">
                          <span>30-Month Scheme:</span>
                          <span className="text-amber-200">
                            {prod.schemeWeeklyAmount
                              ? `₹${prod.schemeWeeklyAmount} / week`
                              : '₹100 - ₹200 / week'}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 block">
                          0% Down Payment EMI Available
                        </span>
                      </div>

                      {/* Free Delivery Promise */}
                      <div className="text-[11px] text-slate-300 flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">Free Delivery</span>
                        <span>• Wardha City & 50 km</span>
                      </div>

                      {/* Action Buttons: Add to Cart & WhatsApp Direct Order */}
                      <div className="space-y-2 pt-1">
                        <button
                          onClick={() => addToCart(prod)}
                          className="w-full py-2 px-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-95 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>Add to Cart</span>
                        </button>

                        <a
                          href={`https://wa.me/${landingConfig.contactInfo.whatsappNumber}?text=${encodeURIComponent(
                            `Hello Shree Sai Enterprises (Wardha), I would like to purchase this product:\nProduct: ${prod.name} (${prod.brand})\nPrice: ₹${prod.salePrice.toLocaleString('en-IN')}\nPlease provide delivery details and booking confirmation.`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full py-2 px-3 bg-emerald-600/90 hover:bg-emerald-600 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Order on WhatsApp</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 7. DIGITAL PASSBOOK & 30-MONTH SAVINGS SCHEME SECTION */}
      <section
        id="passbook-portal-section"
        className="max-w-[1520px] mx-auto px-3 sm:px-6 py-6 w-full scroll-mt-20"
      >
        <div className="rounded-3xl bg-gradient-to-br from-[#0c1424] via-[#10192e] to-[#0a101d] border border-amber-500/30 p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
                <Gift className="w-3.5 h-3.5 text-amber-400" />
                <span>Shree Sai 30-Month Weekly Savings Scheme • Digital Passbook</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white font-serif tracking-tight">
                Track Your Installment & Lucky Draw Status
              </h2>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Save just ₹100 or ₹200 every week to participate in monthly lucky draws and win free appliances and furniture! Enter your card number or mobile number below to check your ledger:
              </p>
            </div>

            {/* Direct On-Page Search Input */}
            <form onSubmit={handleOnPageSearchPassbook} className="flex gap-2 w-full lg:w-96">
              <input
                type="text"
                placeholder="Enter Card Number (e.g. 1001) or Mobile Number..."
                value={onPageCardQuery}
                onChange={(e) => setOnPageCardQuery(e.target.value)}
                className="flex-1 p-2.5 rounded-xl border border-slate-700 bg-[#070b14] text-white text-xs font-semibold focus:outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow-md"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Check Status</span>
              </button>
            </form>
          </div>

          {onPageError && (
            <p className="text-rose-400 font-bold text-xs bg-rose-500/10 p-3 rounded-xl border border-rose-500/30">
              {onPageError}
            </p>
          )}

          {/* If Member Found, show details */}
          {onPageMember && (
            <div className="p-5 rounded-2xl border border-amber-500/30 bg-[#080d16] space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <span className="text-[10px] font-black uppercase text-amber-400">
                    Card #{onPageMember.cardNo}
                  </span>
                  <h3 className="font-extrabold text-lg text-white font-serif">
                    {onPageMember.memberName}
                  </h3>
                  <p className="text-slate-400 text-xs">
                    {onPageMember.address || onPageMember.village} • {onPageMember.phone}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {onPageMember.status || 'Active'} Member
                  </span>
                  <button
                    onClick={() => {
                      setSelectedPassbookMember(onPageMember);
                      setIsCardPassbookModalOpen(true);
                    }}
                    className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition shadow cursor-pointer flex items-center gap-1.5"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Open Full Passbook</span>
                  </button>
                </div>
              </div>

              {/* Stats Calculation */}
              {(() => {
                const stats = calculateMemberStats(onPageMember);
                return (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-3 rounded-xl bg-[#0f1726] border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Total Paid Amount</span>
                      <span className="font-black text-emerald-400 text-base tabular-nums">
                        ₹{stats.totalPaid.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#0f1726] border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Weekly Installment</span>
                      <span className="font-black text-amber-300 text-base tabular-nums">
                        ₹{stats.weeklyAmt} / week
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#0f1726] border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Paid Weeks</span>
                      <span className="font-black text-white text-base">
                        {stats.paidWeeks} Weeks Paid
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#0f1726] border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Lucky Draw Status</span>
                      <span className="font-black text-purple-400 text-base">
                        {onPageMember.isLuckyDrawEligible !== false ? 'Eligible' : 'Pending'}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </section>

      {/* 8. SHOWROOM VISIT, ADDRESS & GOOGLE REVIEWS SECTION */}
      <section
        id="google-business-section"
        className="max-w-[1520px] mx-auto px-3 sm:px-6 py-6 w-full scroll-mt-20"
      >
        <div className="rounded-3xl bg-[#0d1424] border border-slate-800 p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-2xl shrink-0 border border-amber-400/40 bg-[#070a12] p-1">
                <SaiLogoEmblem />
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <BadgeCheck className="w-3.5 h-3.5" /> Verified Flagship Showroom
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Wardha Main Branch
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white font-sans">
                  SHREE SAI ENTERPRISES • Main Showroom
                </h3>
                <p className="text-xs text-slate-300 flex items-center gap-1.5 flex-wrap">
                  <span className="text-amber-400 font-bold">100% Solid Teakwood</span>
                  <span>•</span>
                  <span>Branded Smart TVs & Appliances</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-bold">Open Daily: 9:30 AM to 9:30 PM</span>
                </p>
              </div>
            </div>

            {/* Google Rating Counter */}
            <div className="flex items-center gap-3 bg-[#131b2e] px-4 py-3 rounded-2xl border border-slate-700 shrink-0">
              <div className="text-center">
                <span className="text-2xl font-black text-white tabular-nums">4.9</span>
                <div className="flex text-amber-400 text-xs">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
              </div>
              <div className="text-[11px] text-slate-300 border-l border-slate-700 pl-3">
                <span className="font-bold block text-white">350+ Verified Google Reviews</span>
                <span className="text-emerald-400 font-semibold">#1 Trusted Showroom in Wardha</span>
              </div>
            </div>
          </div>

          {/* Showroom Visual & Testimonials Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Showroom Interior Display & Directions */}
            <div className="lg:col-span-7 rounded-2xl overflow-hidden border border-slate-700 bg-black/60 relative group flex flex-col justify-between min-h-[360px]">
              <img
                src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&auto=format&fit=crop&q=80"
                alt="Shri Sai Enterprises Showroom Wardha"
                className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-black/30" />

              <div className="relative z-10 p-4 flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/20 text-white text-xs font-bold flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-amber-400" />
                  <span>Visit Our Showroom in Person</span>
                </span>
                <span className="px-2.5 py-1 rounded-full bg-emerald-600/90 text-white text-[11px] font-black uppercase shadow">
                  Open Today
                </span>
              </div>

              <div className="relative z-10 p-5 space-y-2.5">
                <h4 className="text-lg sm:text-xl font-black text-white font-serif">
                  Shree Sai Enterprises • 2-Story Mega Showroom
                </h4>
                <p className="text-xs text-slate-200 max-w-xl leading-relaxed">
                  Two-story grand showroom: Ground floor features Samsung, LG, Sony Smart TVs, refrigerators, and washing machines. First floor showcases genuine Chandrapur teakwood sofas, storage diwans, and heavy-gauge steel almirahs.
                </p>

                <div className="text-xs text-amber-300 font-medium flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>Opp. Matoshree Sabhagruh, Arvi Road, Punjab Colony, Wardha - 442001</span>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
                  <a
                    href="https://www.google.com/maps/search/?api=1&query=Shri+Sai+Enterprises+Matoshree+Sabhagruh+Arvi+Road+Punjab+Colony+Wardha+442001"
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black transition flex items-center gap-1.5 shadow-lg active:scale-95 cursor-pointer"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Get Directions on Google Maps</span>
                  </a>

                  <a
                    href="tel:8600122978"
                    className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold backdrop-blur-md border border-white/30 transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Call Store: 8600122978</span>
                  </a>

                  <a
                    href={`https://wa.me/${landingConfig.contactInfo.whatsappNumber}?text=${encodeURIComponent(
                      'Hello Shree Sai Enterprises, I am planning to visit the showroom.'
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Verified Reviews & Timings */}
            <div className="lg:col-span-5 rounded-2xl bg-[#090f1a] border border-slate-800 p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="font-black text-sm text-white flex items-center gap-1.5 font-serif">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>Verified Customer Testimonials</span>
                  </span>
                  <span className="text-[11px] font-bold text-amber-400">100% Real Reviews</span>
                </div>

                <div className="space-y-2.5 mt-3">
                  <div className="p-3 rounded-xl bg-[#0f1726] border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white">Amol Deshmukh (Wardha)</span>
                      <div className="flex text-amber-400 text-[10px]">★★★★★</div>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-snug">
                      "I was paying just ₹100 per week in the 30-month savings scheme. In the Diwali lucky draw, my card was selected and I won a royal teakwood sofa set! The wood finishing is outstanding!"
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#0f1726] border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white">Pradeep Thakare (Arvi)</span>
                      <div className="flex text-amber-400 text-[10px]">★★★★★</div>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-snug">
                      "Got a 55-inch Samsung 4K Smart TV at a price cheaper than Nagpur! Same-day free doorstep delivery and wall-mounting installation completed."
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#0f1726] border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white">Sunita Wankhede (Sewagram)</span>
                      <div className="flex text-amber-400 text-[10px]">★★★★★</div>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-snug">
                      "Purchased a hydraulic storage diwan and heavy steel wardrobe. The structure is very strong and durable. The showroom staff was very courteous and helpful."
                    </p>
                  </div>
                </div>
              </div>

              {/* Showroom Timings & Quick Contact */}
              <div className="pt-2 border-t border-slate-800 space-y-2.5 text-xs">
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#0f1726] border border-slate-800">
                  <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <span className="font-bold text-white block">Showroom Hours:</span>
                    <span className="text-slate-300 text-[11px]">
                      Monday to Sunday: 9:30 AM to 9:30 PM (Open all 7 days)
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <a
                    href={`tel:${landingConfig.contactInfo.helpline1 || '8766486915'}`}
                    className="flex-1 py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-center text-xs transition cursor-pointer"
                  >
                    📞 {landingConfig.contactInfo.helpline1 || '8766486915'}
                  </a>
                  <a
                    href={`tel:${landingConfig.contactInfo.helpline2 || '8600122978'}`}
                    className="flex-1 py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-center text-xs transition cursor-pointer"
                  >
                    📞 {landingConfig.contactInfo.helpline2 || '8600122978'}
                  </a>
                  <a
                    href={`tel:${landingConfig.contactInfo.helpline3 || '9175537365'}`}
                    className="flex-1 py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-center text-xs transition cursor-pointer"
                  >
                    📞 {landingConfig.contactInfo.helpline3 || '9175537365'}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. WARDHA LOCAL SEO FAQ & SEMANTIC SEARCH KEYWORDS */}
      <section id="wardha-faq" className="max-w-[1520px] mx-auto px-3 sm:px-6 py-6 w-full scroll-mt-20">
        <div className="rounded-3xl bg-gradient-to-br from-[#0c1424] via-[#10192e] to-[#0a101d] border border-slate-800 p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Wardha’s #1 Electronics & Furniture Showroom • Quality & Trust</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white font-serif tracking-tight">
                Best Price Guarantee on Electronics, Appliances & Furniture
              </h2>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Looking for branded 4K TVs, refrigerators, washing machines, or solid teakwood furniture in Wardha? Shree Sai Enterprises provides factory-direct wholesale pricing with 0% EMI and manufacturer warranties.
              </p>
            </div>

            <a
              href={`https://wa.me/${landingConfig.contactInfo.whatsappNumber}?text=${encodeURIComponent(
                'Hello Shree Sai Enterprises, I would like to inquire about your best prices and offers in Wardha.'
              )}`}
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-2 transition cursor-pointer shrink-0 shadow-lg active:scale-95"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Inquire Best Prices (WhatsApp)</span>
            </a>
          </div>

          {/* 3 Core Value Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-[#090f1a] border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <Award className="w-4 h-4" />
                <span>Guaranteed Best Prices & Direct Factory Savings</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Direct factory wholesale pricing with zero middlemen markup. Compare our prices on Sony, LG, Samsung Smart TVs and solid teakwood furniture across Vidarbha.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#090f1a] border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <ShieldCheck className="w-4 h-4" />
                <span>100% Authorized GST Invoice & Brand Warranty</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Every TV, refrigerator, cooler, and washing machine comes with an authorized company GST invoice, manufacturer warranty, and local technician support.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#090f1a] border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                <Truck className="w-4 h-4" />
                <span>Free Delivery Across Wardha District</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Free safe doorstep delivery and wall-mount installation across Wardha, Sewagram, Deoli, Arvi, Hinganghat, Seloo, Pulgaon, and neighboring areas.
              </p>
            </div>
          </div>

          {/* FAQs */}
          <div className="pt-2 space-y-3">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2 font-serif">
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span>Frequently Asked Questions (FAQ)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-[#090f1a] border border-slate-800 space-y-1">
                <h4 className="font-bold text-slate-100">
                  Q: Which is the best showroom for furniture and electronics in Wardha?
                </h4>
                <p className="text-slate-300 leading-relaxed">
                  A: Shree Sai Enterprises (Opp. Matoshree Sabhagruh, Arvi Road, Wardha) is the largest showroom with a 4.9★ rating. We provide branded electronics and authentic Chandrapur teakwood furniture at wholesale rates.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#090f1a] border border-slate-800 space-y-1">
                <h4 className="font-bold text-slate-100">
                  Q: Can I purchase furniture or TVs on easy weekly installments or EMI?
                </h4>
                <p className="text-slate-300 leading-relaxed">
                  A: Yes! You can participate in our 30-Month Weekly Savings Scheme for just ₹100 or ₹200/week, or avail 0% down payment finance through Bajaj Finserv, TVS Credit, and HDB.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#090f1a] border border-slate-800 space-y-1">
                <h4 className="font-bold text-slate-100">
                  Q: What are your showroom timings and contact numbers?
                </h4>
                <p className="text-slate-300 leading-relaxed">
                  A: The showroom is open all 7 days from 9:30 AM to 9:30 PM. Helpline: 8600122978 / 8766486915 / 9175537365.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#090f1a] border border-slate-800 space-y-1">
                <h4 className="font-bold text-slate-100">
                  Q: How does the 30-Month Weekly Lucky Draw Scheme operate?
                </h4>
                <p className="text-slate-300 leading-relaxed">
                  A: A transparent monthly lucky draw is conducted every month. If your member card is picked, you immediately receive your product, and all remaining installments are 100% waived off!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 10. SINGLE DISTINCTIVE LUXURY SHOWROOM FOOTER */}
      <footer className="bg-[#05080e] text-white border-t border-slate-800/80 mt-12">
        <div className="max-w-[1520px] mx-auto px-3 sm:px-6 py-12 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            
            {/* Col 1: Brand & Logo */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <SaiLogo size="lg" glow={true} />
                <div>
                  <h4 className="font-black text-base text-white font-sans tracking-wide">
                    SHREE SAI ENTERPRISES
                  </h4>
                  <p className="text-[11px] text-amber-300 font-sans">Shree Sai Enterprises • Wardha Showroom</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Wardha’s most trusted and reputed retail showroom. Authentic Chandrapur teakwood furniture, Smart 4K TVs, home appliances, and our celebrated 30-month weekly savings scheme.
              </p>
              <div className="pt-1 text-xs text-slate-300 space-y-1">
                <p>📍 Opp. Matoshree Sabhagruh, Arvi Road, Punjab Colony, Wardha - 442001</p>
                <p className="text-amber-300 font-medium">
                  📞 Helpline: {landingConfig.contactInfo.helpline1 || '8766486915'} / {landingConfig.contactInfo.helpline2 || '8600122978'}
                </p>
                <p>🌐 Official Website: https://shrisaient.in</p>

                {/* Social & Directory Links */}
                <div className="pt-2 flex flex-wrap gap-2">
                  <a
                    href="https://www.justdial.com/jdmart/Wardha/Shree-Sai-Enterprises-Opposite-Matoshree-SabhagruhPipri-/9999P7152-7152-231230084013-U6K2_BZDET/catalogue"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#ff7a00]/15 hover:bg-[#ff7a00]/25 text-[#ff9436] border border-[#ff7a00]/40 text-[11px] font-bold transition shadow-xs cursor-pointer"
                    title="Shree Sai Enterprises Justdial Verified"
                  >
                    <span>Justdial Verified</span>
                    <ExternalLink className="w-3 h-3 text-[#ff9436]" />
                  </a>

                  <a
                    href="https://share.google/pRPd28v4DoL3a5Ocr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border border-blue-500/30 text-[11px] font-bold transition shadow-xs cursor-pointer"
                    title="Google Business Profile & Maps"
                  >
                    <span>Google Maps</span>
                    <ExternalLink className="w-3 h-3 text-blue-300" />
                  </a>

                  <a
                    href="https://www.instagram.com/shreesaienterprisess"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-pink-500/15 hover:bg-pink-500/25 text-pink-300 border border-pink-500/30 text-[11px] font-bold transition shadow-xs cursor-pointer"
                    title="Instagram"
                  >
                    <Instagram className="w-3.5 h-3.5 text-pink-400" />
                    <span>Instagram</span>
                  </a>

                  <a
                    href="https://www.facebook.com/profile.php?id=61554340030893"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-600/15 hover:bg-blue-600/25 text-blue-300 border border-blue-500/30 text-[11px] font-bold transition shadow-xs cursor-pointer"
                    title="Facebook"
                  >
                    <Facebook className="w-3.5 h-3.5 text-blue-400" />
                    <span>Facebook</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Col 2: Electronics */}
            <div className="space-y-2.5 text-xs">
              <h5 className="font-extrabold text-sm text-amber-300 uppercase tracking-wider font-serif">
                Electronics Department
              </h5>
              <ul className="space-y-1.5 text-slate-300">
                <li
                  className="hover:text-amber-400 cursor-pointer"
                  onClick={() => setSelectedCategory('Electronics')}
                >
                  • Smart 4K UHD LED TVs (32" to 65")
                </li>
                <li
                  className="hover:text-amber-400 cursor-pointer"
                  onClick={() => setSelectedCategory('Appliances')}
                >
                  • Inverter Double Door Refrigerators (LG, Whirlpool, Haier)
                </li>
                <li
                  className="hover:text-amber-400 cursor-pointer"
                  onClick={() => setSelectedCategory('Appliances')}
                >
                  • 5-Star Automatic Washing Machines
                </li>
                <li
                  className="hover:text-amber-400 cursor-pointer"
                  onClick={() => setSelectedCategory('Appliances')}
                >
                  • Heavy Desert Air Coolers & Inverter Split ACs
                </li>
                <li className="text-slate-400">• 0% Down Payment Easy EMI Finance</li>
              </ul>
            </div>

            {/* Col 3: Furniture */}
            <div className="space-y-2.5 text-xs">
              <h5 className="font-extrabold text-sm text-amber-300 uppercase tracking-wider font-serif">
                Teakwood Furniture Department
              </h5>
              <ul className="space-y-1.5 text-slate-300">
                <li
                  className="hover:text-amber-400 cursor-pointer"
                  onClick={() => setSelectedCategory('Furniture')}
                >
                  • Royal Solid Teakwood Sofa Sets (3+1+1)
                </li>
                <li
                  className="hover:text-amber-400 cursor-pointer"
                  onClick={() => setSelectedCategory('Diwan')}
                >
                  • Heavy Storage Box Diwans (4x6 & 5x6)
                </li>
                <li
                  className="hover:text-amber-400 cursor-pointer"
                  onClick={() => setSelectedCategory('Diwan')}
                >
                  • Teakwood King & Queen Cots (Double Beds)
                </li>
                <li
                  className="hover:text-amber-400 cursor-pointer"
                  onClick={() => setSelectedCategory('Furniture')}
                >
                  • Heavy-Gauge Steel Cupboards & Godrej-Type Almirahs
                </li>
                <li className="text-slate-400">• Factory-Direct Pricing & 5-Year Wood Warranty</li>
              </ul>
            </div>

            {/* Col 4: 30-Month Scheme & ERP Portal */}
            <div className="space-y-2.5 text-xs">
              <h5 className="font-extrabold text-sm text-amber-300 uppercase tracking-wider font-serif">
                30-Month Scheme
              </h5>
              <p className="text-slate-400 leading-relaxed">
                Save just ₹100 or ₹200 weekly to participate in monthly lucky draws or receive guaranteed premium furniture at completion.
              </p>
              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={() => {
                    const el = document.getElementById('passbook-portal-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold border border-slate-700 transition cursor-pointer text-center"
                >
                  Check Digital Passbook
                </button>
                <button
                  onClick={() => setIsAdminPinModalOpen(true)}
                  className="w-full py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-bold border border-amber-500/30 transition cursor-pointer text-center flex items-center justify-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Staff & Admin ERP Portal</span>
                </button>
                <button
                  onClick={() => {
                    if (onOpenAgentTerminal) onOpenAgentTerminal();
                    else setIsLocalAgentTerminalOpen(true);
                  }}
                  className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 transition cursor-pointer text-center flex items-center justify-center gap-1.5 text-[11px]"
                >
                  <Smartphone className="w-3 h-3 text-emerald-500" />
                  <span>Field Agent Terminal</span>
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Copyright & Back to Top */}
          <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-3">
            <p>© {new Date().getFullYear()} Shree Sai Enterprises, Wardha. All rights reserved.</p>

            <button
              onClick={scrollToTop}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition cursor-pointer flex items-center gap-1.5"
            >
              <ArrowUp className="w-3.5 h-3.5" />
              <span>Back to Top</span>
            </button>
          </div>
        </div>
      </footer>

      {/* QUICK VIEW PRODUCT DETAIL MODAL */}
      {quickViewProduct && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="w-full max-w-3xl rounded-2xl bg-[#0d1424] border border-amber-500/40 text-white shadow-2xl overflow-hidden flex flex-col md:flex-row">
            {/* Image Showcase */}
            <div className="w-full md:w-1/2 p-6 bg-[#070b14] flex items-center justify-center relative border-b md:border-b-0 md:border-r border-slate-800">
              <img
                src={getGenuineProductImage(quickViewProduct)}
                alt={quickViewProduct.name}
                className="max-h-72 w-full object-contain"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.src =
                    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop&q=80';
                }}
              />
              <span className="absolute top-4 left-4 px-2.5 py-0.5 rounded bg-slate-900 text-amber-300 text-xs font-black uppercase border border-amber-500/30">
                {quickViewProduct.brand}
              </span>
            </div>

            {/* Details */}
            <div className="w-full md:w-1/2 p-6 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400">
                    In Stock • Ready for Same-Day Delivery
                  </span>
                  <button
                    onClick={() => setQuickViewProduct(null)}
                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <h3 className="text-lg font-bold text-white mt-1 leading-snug font-serif">
                  {quickViewProduct.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Model: {quickViewProduct.model || quickViewProduct.code} • Department:{' '}
                  {quickViewProduct.category}
                </p>

                <div className="flex items-baseline gap-2 mt-3">
                  <span className="text-2xl font-black text-white tabular-nums">
                    ₹{quickViewProduct.salePrice.toLocaleString('en-IN')}
                  </span>
                  {quickViewProduct.mrp && quickViewProduct.mrp > quickViewProduct.salePrice && (
                    <span className="text-xs text-slate-400 line-through">
                      M.R.P.: ₹{quickViewProduct.mrp.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>

                <div className="mt-3 p-3 rounded-xl bg-[#070b14] border border-slate-800 text-xs space-y-1.5">
                  <p className="text-slate-300 font-medium">
                    {quickViewProduct.description ||
                      'Authentic quality, premium finish, and official brand warranty.'}
                  </p>
                  <p className="text-amber-300 font-bold">
                    💳 30-Month Scheme: Just ₹100 to ₹200 / week!
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    🚚 Free doorstep delivery across Wardha city and within 50 km.
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => {
                    addToCart(quickViewProduct);
                    setQuickViewProduct(null);
                  }}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow cursor-pointer"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Add to Cart</span>
                </button>

                <a
                  href={`https://wa.me/${landingConfig.contactInfo.whatsappNumber}?text=${encodeURIComponent(
                    `Hello Shree Sai Enterprises, I would like to order this product:\nProduct: ${quickViewProduct.name}\nPrice: ₹${quickViewProduct.salePrice.toLocaleString('en-IN')}`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Order via WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CART DRAWER */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md h-full flex flex-col bg-[#0d1424] text-white shadow-2xl border-l border-slate-800">
            {/* Header */}
            <div className="p-4 bg-[#070b14] border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-amber-400" />
                <h3 className="font-extrabold text-sm font-serif">
                  Your Cart / Quote ({cartItemCount} items)
                </h3>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="p-4 flex-1 overflow-y-auto space-y-3">
              {cart.length === 0 ? (
                <div className="py-16 text-center text-slate-400 space-y-3">
                  <ShoppingCart className="w-12 h-12 mx-auto stroke-1 text-slate-600" />
                  <p className="text-sm font-semibold">Your cart is currently empty.</p>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs cursor-pointer"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.stock.id}
                    className="p-3 rounded-xl border border-slate-800 bg-[#070b14] flex items-center justify-between gap-3"
                  >
                    <img
                      src={getGenuineProductImage(item.stock)}
                      alt={item.stock.name}
                      className="w-14 h-14 object-contain bg-[#0f1726] p-1 rounded-lg shrink-0"
                      referrerPolicy="no-referrer"
                    />

                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs truncate text-white">{item.stock.name}</p>
                      <p className="text-[11px] text-amber-300 font-bold tabular-nums">
                        ₹{item.stock.salePrice.toLocaleString('en-IN')} × {item.qty} = ₹
                        {(item.stock.salePrice * item.qty).toLocaleString('en-IN')}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => updateCartQty(item.stock.id, -1)}
                        className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold tabular-nums text-white">
                        {item.qty}
                      </span>
                      <button
                        onClick={() => updateCartQty(item.stock.id, 1)}
                        className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}

              {/* Delivery Details Form */}
              {cart.length > 0 && (
                <div className="pt-4 border-t border-slate-800 space-y-2.5 text-xs">
                  <label className="font-bold text-[11px] text-amber-300 uppercase tracking-wider block">
                    Delivery & Contact Details:
                  </label>
                  <input
                    type="text"
                    placeholder="Your Full Name (e.g. Rahul Sharma)"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-[#070b14] text-white text-xs outline-none focus:border-amber-400"
                  />
                  <input
                    type="tel"
                    placeholder="Mobile Number (WhatsApp preferred)"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-[#070b14] text-white text-xs outline-none focus:border-amber-400"
                  />
                  <textarea
                    placeholder="Delivery Address / Area (e.g. Arvi Road, Wardha)"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    rows={2}
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-[#070b14] text-white text-xs outline-none focus:border-amber-400"
                  />
                </div>
              )}
            </div>

            {/* Cart Footer */}
            {cart.length > 0 && (
              <div className="p-4 bg-[#070b14] border-t border-slate-800 space-y-3">
                <div className="flex justify-between items-center text-sm font-bold">
                  <span className="text-slate-300">Total Amount:</span>
                  <span className="text-amber-300 text-xl font-black tabular-nums">
                    ₹{cartTotalAmount.toLocaleString('en-IN')}
                  </span>
                </div>

                <button
                  onClick={handleCheckoutWhatsApp}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Send Order via WhatsApp</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ONLINE PASSBOOK MODAL */}
      {isOpenPassbookModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-800 bg-[#0d1424] text-white flex flex-col max-h-[92vh] overflow-hidden">
            <div className="p-4 sm:p-5 bg-[#070b14] border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-5 h-5 text-amber-400" />
                <h2 className="font-extrabold text-base font-serif">
                  Weekly Savings Digital Passbook & Ledger
                </h2>
              </div>
              <button
                onClick={() => {
                  setIsOpenPassbookModal(false);
                  setSearchedMember(null);
                  setPassbookCardQuery('');
                }}
                className="p-1 rounded-lg hover:bg-white/10 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
              <form onSubmit={handleSearchPassbook} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter Card Number (e.g. 1001, 1050) or Mobile Number..."
                  value={passbookCardQuery}
                  onChange={(e) => setPassbookCardQuery(e.target.value)}
                  className="flex-1 p-2.5 rounded-xl border border-slate-700 bg-[#070b14] text-white text-xs font-semibold focus:outline-none focus:border-amber-400"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Check Status</span>
                </button>
              </form>

              {passbookError && (
                <p className="text-rose-400 font-bold text-xs">{passbookError}</p>
              )}

              {searchedMember && (
                <div className="space-y-4 pt-2">
                  <div className="p-4 rounded-xl border border-slate-800 bg-[#070b14] space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-black uppercase text-amber-400">
                          Card #{searchedMember.cardNo}
                        </span>
                        <h3 className="font-extrabold text-base text-white font-serif">
                          {searchedMember.memberName}
                        </h3>
                        <p className="text-slate-400 text-xs">
                          {searchedMember.address || searchedMember.village} • {searchedMember.phone}
                        </p>
                      </div>

                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {searchedMember.status || 'Active'} Member
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-center">
                      <div className="p-2 rounded-xl bg-[#0f1726] border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Total Paid Amount</span>
                        <span className="font-black text-emerald-400 text-sm tabular-nums">
                          ₹
                          {(
                            searchedMember.totalAmountPaid ??
                            searchedMember.totalPaid ??
                            0
                          ).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-[#0f1726] border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Weekly Installment</span>
                        <span className="font-black text-amber-300 text-sm tabular-nums">
                          ₹{searchedMember.monthlyAmount || 100} / week
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-[#0f1726] border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Duration</span>
                        <span className="font-black text-sm text-white">
                          {searchedMember.durationMonths || 30} Months (130 Weeks)
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-[#0f1726] border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Lucky Draw Status</span>
                        <span className="font-black text-purple-400 text-sm">
                          {searchedMember.isLuckyDrawEligible !== false ? 'Eligible' : 'Pending'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPassbookMember(searchedMember);
                          setIsCardPassbookModalOpen(true);
                        }}
                        className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <BookOpen className="w-4 h-4 text-slate-950" />
                        <span>Open Full 30-Month Passbook Card & Print</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FULL 30-MONTH PASSBOOK CARD & 1-PAGE PRINT MODAL */}
      {isCardPassbookModalOpen && selectedPassbookMember && (
        <CardPassbookPrintModal
          member={selectedPassbookMember}
          transactions={storeData.cardTransactions}
          settings={storeData.settings}
          isOpen={isCardPassbookModalOpen}
          onClose={() => {
            setIsCardPassbookModalOpen(false);
            setSelectedPassbookMember(null);
          }}
        />
      )}

      {/* SECURE ADMIN ERP LOGIN, SIGN UP & ADMIN APPROVALS MODAL */}
      {isAdminPinModalOpen && (
        <SecureErpLoginModal
          storeData={storeData}
          isOpen={isAdminPinModalOpen}
          onClose={() => setIsAdminPinModalOpen(false)}
          onLoginSuccess={(user) => {
            setIsAdminPinModalOpen(false);
            onEnterAdminERP(user);
          }}
          onRefreshData={() => {
            if (onRefreshData) onRefreshData();
          }}
        />
      )}

      {/* Finance EMI Calculator Modal */}
      {isFinanceEmiOpen && (
        <FinanceEmiModal
          storeData={storeData}
          isOpen={isFinanceEmiOpen}
          onClose={() => setIsFinanceEmiOpen(false)}
          initialPrice={financeProduct.price}
          productTitle={financeProduct.name}
        />
      )}

      {/* Field Agent Terminal Direct View / Modal */}
      {isLocalAgentTerminalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90">
          <MobileAgentFieldTerminal
            storeData={storeData}
            onRefreshData={onRefreshData || (() => {})}
            onClose={() => setIsLocalAgentTerminalOpen(false)}
            isStandalonePage={false}
          />
        </div>
      )}
    </div>
  );
};
