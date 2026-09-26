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
  UserPlus,
  UserCheck,
  Key,
  Shield,
  User,
  Users,
  AlertCircle,
  BadgeCheck,
  Copy,
  ExternalLink,
  Navigation,
} from 'lucide-react';
import { StoreData, StockItem, CardMember, AdminUser } from '../../types';
import { StorageService } from '../../services/storageService';
import { NotificationService } from '../../services/notificationService';
import { SaiLogo, SaiLogoEmblem } from '../common/SaiLogo';
import { FinanceEmiModal } from '../common/FinanceEmiModal';
import { getGenuineProductImage } from '../../utils/productImages';
import { SecureErpLoginModal } from '../auth/SecureErpLoginModal';
import { MobileAgentFieldTerminal } from '../agent/MobileAgentFieldTerminal';
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
  const landingConfig = useMemo(() => getActiveLandingConfig(storeData.landingPageConfig), [storeData.landingPageConfig]);

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

  // Auto rotate hero slides every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % 3);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  const categories = [
    { id: 'All', label: 'All Categories', icon: Store },
    { id: 'Electronics', label: 'Smart 4K TVs', icon: Tv },
    { id: 'Furniture', label: 'Teakwood Sofas', icon: Sofa },
    { id: 'Diwan', label: 'Storage Diwan & Beds', icon: Layers },
    { id: 'Appliances', label: 'Refrigerators & Coolers', icon: Wind },
  ];

  // Quick Category Strip with Genuine Photographic Thumbnails (Amazon Style)
  const quickCategories = [
    {
      id: 'Electronics',
      label: 'Smart 4K TVs',
      sub: '32" to 65" UHD HDR',
      image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=300&auto=format&fit=crop&q=80',
      badge: 'Up to 38% OFF',
    },
    {
      id: 'Appliances',
      label: 'Refrigerators',
      sub: 'Inverter Single & Double Door',
      image: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=300&auto=format&fit=crop&q=80',
      badge: 'Energy Star 5★',
    },
    {
      id: 'Furniture',
      label: 'Royal Teak Sofas',
      sub: 'Pure Teak 3+1+1 Sets',
      image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300&auto=format&fit=crop&q=80',
      badge: 'Direct Factory Rate',
    },
    {
      id: 'Diwan',
      label: 'Wooden Diwans',
      sub: '4x6 & 5x6 Storage Box Cots',
      image: 'https://images.unsplash.com/photo-1540518614846-7ede433c4ef0?w=300&auto=format&fit=crop&q=80',
      badge: 'Heavy Sagwan',
    },
    {
      id: 'Appliances',
      label: 'Inverter AC & Coolers',
      sub: 'Split ACs & Heavy Coolers',
      image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=300&auto=format&fit=crop&q=80',
      badge: 'Summer Special',
    },
    {
      id: 'Furniture',
      label: 'Steel Wardrobes',
      sub: 'Godrej Style Almirah',
      image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=300&auto=format&fit=crop&q=80',
      badge: 'Heavy Gauge Steel',
    },
    {
      id: 'Scheme',
      label: '30-Month Scheme',
      sub: 'Weekly ₹100 - ₹200 Card',
      image: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=300&auto=format&fit=crop&q=80',
      badge: 'Monthly Lucky Draw',
    },
  ];

  // Helper to expand search tokens for Marathi + English keywords
  const getSearchTokens = (query: string): string[] => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const tokens = q.split(/\s+/);
    const expanded = new Set<string>(tokens);

    tokens.forEach((t) => {
      // TVs
      if (t.includes('tv') || t.includes('टीव्ही') || t.includes('led') || t.includes('स्मार्ट')) {
        ['tv', 'television', 'led', 'smart', '4k', 'uhd', 'oled', 'sony', 'lg', 'samsung'].forEach(w => expanded.add(w));
      }
      // Sofa / Furniture
      if (t.includes('sofa') || t.includes('सोफा') || t.includes('सागवान') || t.includes('teak')) {
        ['sofa', 'furniture', 'teak', 'cushion', 'recliner', 'wooden', 'सागवान'].forEach(w => expanded.add(w));
      }
      // Diwan / Bed
      if (t.includes('diwan') || t.includes('दिवाण') || t.includes('bed') || t.includes('कॉट') || t.includes('गादी')) {
        ['diwan', 'bed', 'box', 'storage', 'mattress', 'दिवाण'].forEach(w => expanded.add(w));
      }
      // Refrigerator / Fridge
      if (t.includes('fridge') || t.includes('फ्रिज') || t.includes('फ्रीज') || t.includes('रेफ्रिजरेटर')) {
        ['fridge', 'refrigerator', 'whirlpool', 'godrej', 'lg', 'samsung', 'फ्रिज'].forEach(w => expanded.add(w));
      }
      // Cooler / AC
      if (t.includes('cooler') || t.includes('कूलर') || t.includes('ac') || t.includes('एसी')) {
        ['cooler', 'ac', 'air', 'voltas', 'symphony', 'kenstar', 'कूलर'].forEach(w => expanded.add(w));
      }
      // Almirah / Cupboard
      if (t.includes('कपाट') || t.includes('अलमारी') || t.includes('wardrobe') || t.includes('cupboard') || t.includes('almari')) {
        ['wardrobe', 'cupboard', 'almirah', 'almari', 'steel', 'कपाट'].forEach(w => expanded.add(w));
      }
      // Washing Machine
      if (t.includes('वॉशिंग') || t.includes('washing') || t.includes('मशिन') || t.includes('machine')) {
        ['washing', 'machine', 'washer'].forEach(w => expanded.add(w));
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

    return storeData.stock.filter((item) => {
      // Respect admin visibility toggle from Landing Page Editor
      if (item.hideOnLanding) return false;

      const itemText = `${item.name} ${item.brand} ${item.model || ''} ${item.category || ''} ${item.code || ''} ${item.description || ''}`.toLowerCase();

      let matchesSearch = true;
      if (rawQ) {
        matchesSearch = tokens.some((tok) => itemText.includes(tok)) || itemText.includes(rawQ);
      }

      let matchesCat = true;
      // If user typed a specific search query, don't rigidly constrain by existing category tab
      if (selectedCategory !== 'All' && !rawQ) {
        if (selectedCategory === 'Electronics') {
          matchesCat = item.category === 'Electronics' || itemText.includes('tv') || itemText.includes('led');
        } else if (selectedCategory === 'Furniture') {
          matchesCat = item.category === 'Furniture' || itemText.includes('sofa') || itemText.includes('almari') || itemText.includes('कपाट');
        } else if (selectedCategory === 'Diwan') {
          matchesCat = itemText.includes('diwan') || itemText.includes('दिवाण') || itemText.includes('bed') || itemText.includes('कॉट');
        } else if (selectedCategory === 'Appliances') {
          matchesCat = item.category === 'Home Appliances' || item.category === 'Kitchen Appliances' || itemText.includes('refrigerator') || itemText.includes('cooler') || itemText.includes('washing') || itemText.includes('ac') || itemText.includes('फ्रिज');
        }
      }

      return matchesSearch && matchesCat;
    }).sort((a, b) => {
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

    let msg = `*SHRI SAI ENTERPRISES, WARDHA*\n`;
    msg += `(Electronics, Home Appliances & Teakwood Furniture Showroom)\n`;
    msg += `📍 Address: ${landingConfig.contactInfo.addressHindi || 'Opposite Matoshree Sabhagruh, Arvi Road, Punjab Colony, Wardha 442001'}\n`;
    msg += `📞 Contacts: ${landingConfig.contactInfo.helpline1 || '8766486915'} | ${landingConfig.contactInfo.helpline2 || '8600122978'} | ${landingConfig.contactInfo.helpline3 || '9175537365'}\n`;
    msg += `--------------------------------\n`;
    if (customerName.trim()) msg += `👤 Customer: *${customerName.trim()}*\n`;
    if (customerPhone.trim()) msg += `📞 WhatsApp: ${customerPhone.trim()}\n`;
    if (customerAddress.trim()) msg += `📍 Delivery Address: ${customerAddress.trim()}\n`;
    msg += `Date: ${new Date().toLocaleDateString('en-IN')}\n`;
    msg += `--------------------------------\n`;
    cart.forEach((item, index) => {
      msg += `${index + 1}. *${item.stock.name}* (${item.stock.brand})\n`;
      msg += `   Qty: ${item.qty} | Price: ₹${item.stock.salePrice.toLocaleString('en-IN')} = ₹${(item.stock.salePrice * item.qty).toLocaleString('en-IN')}\n`;
    });
    msg += `--------------------------------\n`;
    msg += `💰 *Total Amount: ₹${cartTotalAmount.toLocaleString('en-IN')} (All Taxes Included)*\n`;
    msg += `🚚 Delivery: FREE Express Delivery (Wardha & Nearby 50 KM)\n`;
    msg += `--------------------------------\n`;
    msg += `Please confirm this order. Thank you!`;

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
    // Weekly installment is ₹100 or ₹200 as per showroom rules
    const weeklyAmt = (member.monthlyAmount && member.monthlyAmount <= 500) ? member.monthlyAmount : 100;
    const paidWeeks = memberPayments.length > 0 ? memberPayments.length : Math.max(1, Math.floor(totalPaid / weeklyAmt));
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
      setOnPageError('Please enter a Card Number (e.g. 1001, 1050) or 10-digit mobile number.');
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
      setOnPageError(`No passbook record found for Card or Mobile "${onPageCardQuery}". Please verify and try again.`);
    }
  };

  // Modal Passbook Search
  const handleSearchPassbook = (e: React.FormEvent) => {
    e.preventDefault();
    setPassbookError('');
    const q = passbookCardQuery.trim().toLowerCase();
    if (!q) {
      setPassbookError('Please enter a Card Number or Mobile Number.');
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
      setPassbookError('No member card found for this number. Please check and try again.');
    }
  };

  // Current Admin & Staff Users (active and pending)
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
        pin: '1079',
        status: 'active',
      },
      {
        id: 'usr-2',
        username: 'cashier',
        displayName: 'Rahul Joshi (Cashier)',
        role: 'Cashier',
        pin: '0000',
        status: 'active',
      },
      {
        id: 'usr-3',
        username: 'manager',
        displayName: 'Mahesh Sharma (Showroom Manager)',
        role: 'Manager',
        pin: '5555',
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
    <div className="min-h-screen flex flex-col font-sans bg-[#0f1111] text-[#f3f4f6] selection:bg-[#f3a847] selection:text-black">
      
      {/* 0. SLEEK & ELEGANT TOP CUSTOMER ANNOUNCEMENT & CONTACT STRIP */}
      {landingConfig.enableAnnouncementBar !== false && (
        <div className="bg-[#0b1019] border-b border-amber-500/20 text-slate-300 text-xs py-1.5 px-3 sm:px-5">
          <div className="max-w-[1500px] mx-auto flex items-center justify-between gap-3">
            {/* Left: Store Greeting / Announcement */}
            <div className="flex items-center gap-2 overflow-hidden truncate">
              {landingConfig.announcement?.enabled ? (
                <>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black uppercase shrink-0 shadow-xs">
                    {landingConfig.announcement.badge || 'ऑफर'}
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
                <span className="text-slate-300 font-medium text-xs truncate">
                  🚩 <strong className="text-amber-400">श्री साई इंटरप्रायजेस, वर्धा</strong> • ३०-महिने योजना व सणवार विशेष ऑफर्स
                </span>
              )}
            </div>

            {/* Right: Clean Helpline & WhatsApp Link */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0 text-xs">
              <a
                href={`tel:${landingConfig.contactInfo.helpline1 || '8766486915'}`}
                className="hidden sm:flex items-center gap-1 text-slate-300 hover:text-white transition"
                title="कॉल करा"
              >
                <Phone className="w-3 h-3 text-amber-400" />
                <span className="font-mono">{landingConfig.contactInfo.helpline1 || '8766486915'}</span>
              </a>

              <span className="hidden sm:inline text-slate-600">|</span>

              <a
                href={`https://wa.me/${landingConfig.contactInfo.whatsappNumber}?text=Hello%20Shri%20Sai%20Enterprises,%20Wardha.%20I%20am%20calling%20regarding%20furniture%20and%20electronics.`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-bold text-xs transition"
                title="WhatsApp द्वारे थेट संपर्क करा"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 1. AMAZON SIGNATURE DARK HEADER (#131921) */}
      <header className="sticky top-0 z-40 bg-[#131921] text-white shadow-xl border-b border-[#232f3e]">
        <div className="max-w-[1500px] mx-auto px-3 sm:px-5 py-2 flex items-center justify-between gap-2 sm:gap-5">
          
          {/* Brand Logo & Amazon Prime Style Smile Tag */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <SaiLogo size="md" glow={true} />
            <div className="cursor-pointer" onClick={() => setSelectedCategory('All')}>
              <div className="flex items-baseline gap-1">
                <span className="text-base sm:text-2xl font-black tracking-tight text-white font-sans">
                  SHREE SAI
                </span>
                <span className="text-xs sm:text-sm font-bold text-[#febd69] tracking-tight">
                  .in
                </span>
                <span className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-black uppercase bg-[#febd69] text-[#131921] ml-1 shadow-sm">
                  prime <Check className="w-2.5 h-2.5 stroke-[3]" />
                </span>
              </div>
              <p className="text-[10px] text-slate-300 hidden sm:flex items-center gap-1 -mt-0.5">
                <span className="text-amber-400 font-bold">Arvi Road Showroom</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400">Electronics & Teak Furniture</span>
              </p>
            </div>
          </div>

          {/* Amazon Deliver Location Badge */}
          <div
            onClick={() => {
              const el = document.getElementById('google-business-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="hidden xl:flex items-center gap-1.5 px-2 py-1 rounded hover:outline hover:outline-1 hover:outline-white cursor-pointer text-xs text-left"
            title="Opposite Matoshree Sabhagruh, Arvi Road, Punjab Colony, Wardha 442001"
          >
            <MapPin className="w-4 h-4 text-[#febd69] shrink-0" />
            <div className="leading-tight">
              <span className="text-[10px] text-slate-400 block">Showroom Location</span>
              <span className="font-bold text-white block">Arvi Rd, Punjab Colony, Wardha</span>
            </div>
          </div>

          {/* Amazon Big Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex-1 max-w-3xl hidden md:flex items-center rounded-md overflow-hidden bg-white focus-within:ring-2 focus-within:ring-[#f90] shadow-inner"
          >
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                const el = document.getElementById('products-catalog-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-[#e6e6e6] text-[#0f1111] text-xs px-3 py-2.5 border-r border-slate-300 outline-none cursor-pointer font-medium hover:bg-slate-300 transition"
            >
              <option value="All">All Categories</option>
              <option value="Electronics">Smart 4K TVs</option>
              <option value="Furniture">Teak Sofas</option>
              <option value="Diwan">Diwan Beds</option>
              <option value="Appliances">Refrigerators & AC</option>
            </select>
            <input
              type="text"
              placeholder="Search Shri Sai: Smart TV, Teak Sofa, Diwan Bed, Inverter Fridge, Split AC..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-3 py-2 text-sm text-[#0f1111] outline-none placeholder:text-slate-500 font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="px-2 text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer"
                title="Clear Search"
              >
                ✕
              </button>
            )}
            <button
              type="submit"
              className="bg-[#febd69] hover:bg-[#f3a847] text-[#131921] px-5 py-2.5 transition flex items-center justify-center cursor-pointer active:scale-95"
              title="Search Products"
            >
              <Search className="w-5 h-5 stroke-[2.5]" />
            </button>
          </form>

          {/* Amazon Right Nav Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            
            {/* Passbook / Customer Account Link */}
            <button
              onClick={() => {
                const el = document.getElementById('passbook-portal-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
                else setIsOpenPassbookModal(true);
              }}
              className="px-2 py-1 rounded hover:outline hover:outline-1 hover:outline-white text-left cursor-pointer transition text-xs flex items-center gap-1.5"
            >
              <CreditCard className="w-5 h-5 text-[#febd69]" />
              <div className="hidden sm:block leading-tight">
                <span className="text-[10px] text-slate-300 block">Customer Portal</span>
                <span className="font-bold text-white block">View Passbook</span>
              </div>
            </button>

            {/* Lucky Draw 30-Month Scheme Link */}
            <button
              onClick={() => {
                const el = document.getElementById('passbook-portal-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded hover:outline hover:outline-1 hover:outline-white text-left cursor-pointer text-xs"
            >
              <Gift className="w-5 h-5 text-[#ffa41c]" />
              <div className="leading-tight">
                <span className="text-[10px] text-slate-300 block">30-Mo Scheme</span>
                <span className="font-bold text-amber-300 block">Lucky Draw Status</span>
              </div>
            </button>

            {/* Amazon Shopping Cart */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative px-2.5 py-1.5 rounded hover:outline hover:outline-1 hover:outline-white text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition"
            >
              <div className="relative">
                <ShoppingCart className="w-7 h-7 text-white" />
                <span className="absolute -top-1 left-3.5 px-1.5 py-0.2 rounded-full bg-[#f08804] text-[#131921] text-[11px] font-black leading-none">
                  {cartItemCount}
                </span>
              </div>
              <span className="hidden sm:inline font-bold mt-2">Cart</span>
            </button>

            {/* Admin ERP Login Protected */}
            {isAdminLoggedIn ? (
              <button
                onClick={() => (onReturnToERP ? onReturnToERP() : onEnterAdminERP())}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow cursor-pointer shrink-0 whitespace-nowrap"
              >
                <Store className="w-3.5 h-3.5 shrink-0" />
                <span>Admin ERP</span>
              </button>
            ) : (
              <button
                onClick={() => setIsAdminPinModalOpen(true)}
                className="px-2.5 py-1.5 rounded-lg border border-amber-500/40 hover:border-amber-400 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer relative shrink-0 whitespace-nowrap"
                title="ERP Login / Sign Up (Staff & Admin Portal)"
              >
                <Lock className="w-3.5 h-3.5 text-[#febd69] shrink-0" />
                <span className="hidden sm:inline">ERP Login / Sign Up</span>
                <span className="sm:hidden">Login</span>
                {pendingUsers.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center animate-pulse">
                    {pendingUsers.length}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Search Bar Row */}
        <div className="md:hidden px-3 pb-2 pt-0.5">
          <form
            onSubmit={handleSearchSubmit}
            className="flex items-center bg-white rounded-md overflow-hidden shadow-inner focus-within:ring-2 focus-within:ring-[#f90]"
          >
            <input
              type="text"
              placeholder="Search Smart TV, Teak Sofa, Diwan, Scheme..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-3 py-2 text-xs text-[#0f1111] outline-none font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="px-2 text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                ✕
              </button>
            )}
            <button
              type="submit"
              className="bg-[#febd69] active:bg-[#f3a847] text-[#131921] px-3.5 py-2 cursor-pointer"
              title="Search"
            >
              <Search className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>
        </div>

        {/* 2. AMAZON SUB-NAVBAR (#232f3e) */}
        <div className="bg-[#232f3e] text-white px-3 sm:px-5 py-1.5 text-xs font-medium flex items-center gap-4 overflow-x-auto no-scrollbar border-t border-slate-800">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`flex items-center gap-1 px-2 py-1 rounded hover:outline hover:outline-1 hover:outline-white whitespace-nowrap cursor-pointer ${
              selectedCategory === 'All' ? 'text-[#febd69] font-bold' : ''
            }`}
          >
            <Menu className="w-4 h-4" />
            <span>All Products</span>
          </button>

          <button
            onClick={() => setSelectedCategory('Electronics')}
            className={`px-2 py-1 rounded hover:outline hover:outline-1 hover:outline-white whitespace-nowrap cursor-pointer ${
              selectedCategory === 'Electronics' ? 'text-[#febd69] font-bold' : ''
            }`}
          >
            Smart 4K TVs
          </button>

          <button
            onClick={() => setSelectedCategory('Furniture')}
            className={`px-2 py-1 rounded hover:outline hover:outline-1 hover:outline-white whitespace-nowrap cursor-pointer ${
              selectedCategory === 'Furniture' ? 'text-[#febd69] font-bold' : ''
            }`}
          >
            Royal Teakwood Sofas
          </button>

          <button
            onClick={() => setSelectedCategory('Diwan')}
            className={`px-2 py-1 rounded hover:outline hover:outline-1 hover:outline-white whitespace-nowrap cursor-pointer ${
              selectedCategory === 'Diwan' ? 'text-[#febd69] font-bold' : ''
            }`}
          >
            Storage Diwan & Box Beds
          </button>

          <button
            onClick={() => setSelectedCategory('Appliances')}
            className={`px-2 py-1 rounded hover:outline hover:outline-1 hover:outline-white whitespace-nowrap cursor-pointer ${
              selectedCategory === 'Appliances' ? 'text-[#febd69] font-bold' : ''
            }`}
          >
            Refrigerators & AC
          </button>

          <button
            onClick={() => {
              const el = document.getElementById('passbook-portal-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-2 py-1 rounded hover:outline hover:outline-1 hover:outline-white whitespace-nowrap text-[#febd69] font-bold flex items-center gap-1 cursor-pointer ml-auto"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>30-Month Weekly Savings Scheme (₹100 - ₹200/wk)</span>
          </button>
        </div>
      </header>

      {/* 3. AMAZON CATEGORY THUMBNAILS RIBBON WITH GENUINE PHOTOS */}
      <div className="bg-[#1a222d] border-b border-[#2a3648] py-3.5 px-3 sm:px-5">
        <div className="max-w-[1500px] mx-auto flex items-center justify-between sm:justify-start gap-4 sm:gap-7 overflow-x-auto no-scrollbar">
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
                className={`flex flex-col items-center gap-1.5 shrink-0 group transition cursor-pointer p-1 rounded-xl ${
                  isSelected ? 'scale-105' : 'hover:scale-105'
                }`}
              >
                <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 transition-all p-0.5 bg-[#121820] shadow-md ${
                  isSelected
                    ? 'border-[#ff9900] ring-2 ring-[#ff9900]/50 shadow-[#ff9900]/20'
                    : 'border-[#2d3b4e] group-hover:border-[#ff9900]'
                }`}>
                  <img
                    src={c.image}
                    alt={c.label}
                    className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                </div>
                <div className="text-center">
                  <span className={`text-[11px] sm:text-xs font-bold block whitespace-nowrap leading-tight text-slate-200 ${
                    isSelected ? 'text-[#ff9900]' : 'group-hover:text-[#ff9900]'
                  }`}>
                    {c.label}
                  </span>
                  <span className="text-[9px] text-[#febd69] font-medium block leading-tight">
                    {c.badge}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. CINEMATIC FULL-IMAGE HERO BANNER (MINIMALIST WITH THEME COLOR OVERLAYS) */}
      {landingConfig.showHeroSection !== false && (() => {
        const heroSlides = (landingConfig.heroSlides && landingConfig.heroSlides.filter(s => s.active).length > 0)
          ? landingConfig.heroSlides.filter(s => s.active).map((s, idx) => {
              const isPurple = s.themeColor === 'purple' || idx === 1;
              const isEmerald = s.themeColor === 'emerald' || idx === 2;
              return {
                id: s.id,
                tag: s.tag,
                tagIcon: isPurple ? Gift : isEmerald ? Award : Sparkles,
                titleLead: s.titleLead,
                titleHighlight: s.titleHighlight,
                description: s.subtitle,
                bgImage: s.imageUrl,
                themeGradient: isPurple
                  ? 'from-[#140a02]/95 via-[#221205]/85 sm:via-[#221205]/75 to-[#221205]/30'
                  : isEmerald
                  ? 'from-[#130803]/95 via-[#1e0e06]/85 sm:via-[#1e0e06]/75 to-[#1e0e06]/30'
                  : 'from-[#050b14]/95 via-[#0b1526]/85 sm:via-[#0b1526]/75 to-[#0b1526]/30',
                accentColor: isPurple ? '#f59e0b' : isEmerald ? '#fbbf24' : '#febd69',
                ctaPrimary: s.primaryBtnText,
                ctaAction: () => {
                  if (s.primaryBtnTarget === 'scheme' || s.primaryBtnTarget === 'passbook') {
                    const el = document.getElementById('passbook-portal-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  } else if (s.primaryBtnTarget === 'whatsapp') {
                    window.open(`https://wa.me/${landingConfig.contactInfo.whatsappNumber}?text=Hello%20Shri%20Sai%20Enterprises,%20Wardha`, '_blank');
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
                    window.open(`https://wa.me/${landingConfig.contactInfo.whatsappNumber}?text=Hello%20Shri%20Sai%20Enterprises,%20Wardha`, '_blank');
                  } else {
                    const el = document.getElementById('passbook-portal-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }
                },
                highlights: [s.cardMetric, s.cardMetric2, '100% Brand Warranty'],
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
          <div className="max-w-[1500px] mx-auto px-3 sm:px-5 pt-3 pb-2 w-full">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-800/80 min-h-[440px] sm:min-h-[480px] lg:min-h-[510px] flex items-center bg-[#070b12]">
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
                    />
                    {/* Thematic Deep Color Gradient Overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-r ${slide.themeGradient}`} />
                    {/* Bottom fade blending seamlessly into page */}
                    <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0f1111] via-[#0f1111]/70 to-transparent" />
                    {/* Subtle top shade for header contrast */}
                    <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[#0f1111]/60 to-transparent" />
                  </div>
                );
              })}

              {/* Foreground Content for Current Slide */}
              <div className="relative z-10 w-full px-6 sm:px-10 lg:px-14 py-8 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                {/* Left Content */}
                <div className="max-w-2xl space-y-3.5">
                  {/* Badge Pill */}
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/55 backdrop-blur-md border border-white/15 text-white text-xs font-semibold shadow-lg">
                    {React.createElement(currentSlide.tagIcon, {
                      className: 'w-3.5 h-3.5 text-amber-400',
                    })}
                    <span className="tracking-wide">{currentSlide.tag}</span>
                  </div>

                  {/* Minimalist Bold Headline */}
                  <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white drop-shadow-md font-sans">
                    {currentSlide.titleLead}{' '}
                    <span
                      style={{ color: currentSlide.accentColor }}
                      className="drop-shadow underline decoration-amber-500/40 decoration-wavy underline-offset-8"
                    >
                      {currentSlide.titleHighlight}
                    </span>
                  </h1>

                  {/* Subtitle / Value Proposition */}
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-xl drop-shadow font-medium">
                    {currentSlide.description}
                  </p>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-3 pt-2 text-xs sm:text-sm">
                    <button
                      onClick={currentSlide.ctaAction}
                      className="px-6 py-3 rounded-full bg-[#ffd814] hover:bg-[#f7ca00] text-[#0f1111] font-black transition flex items-center gap-2 shadow-xl hover:shadow-[#ffd814]/20 active:scale-95 cursor-pointer border border-[#fcd200]"
                    >
                      <span>{currentSlide.ctaPrimary}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <button
                      onClick={currentSlide.ctaSecondaryAction}
                      className="px-5 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold backdrop-blur-md transition flex items-center gap-2 border border-white/25 active:scale-95 cursor-pointer shadow-md"
                    >
                      <span>{currentSlide.ctaSecondary}</span>
                    </button>

                    <a
                      href="https://wa.me/917822859073?text=Hello%20Shri%20Sai%20Enterprises,%20I%20am%20interested%20in%20your%20products%20and%20savings%20scheme."
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-3 rounded-full bg-emerald-600/90 hover:bg-emerald-600 text-white font-bold backdrop-blur-md transition flex items-center gap-1.5 border border-emerald-400/40 active:scale-95 shadow-md"
                      title="WhatsApp Enquiry"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span className="hidden sm:inline">WhatsApp</span>
                    </a>
                  </div>

                  {/* Minimalist Feature Badges */}
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    {currentSlide.highlights.map((h, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/45 backdrop-blur-md border border-white/10 text-[11px] text-slate-200 font-medium"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        {h}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Right Side Minimal Glass Preview Card (Desktop) */}
                <div className="hidden lg:block w-80 shrink-0">
                  <div className="p-5 rounded-2xl bg-black/45 backdrop-blur-xl border border-white/15 text-white shadow-2xl space-y-3.5 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-[#febd69] tracking-wider px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
                        {currentSlide.cardBadge}
                      </span>
                      <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> 100% Guaranteed
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-base font-black text-white leading-snug">
                        {currentSlide.cardTitle}
                      </h4>
                      <p className="text-[11px] text-slate-300">
                        {currentSlide.cardSubtitle}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1 text-xs">
                      <div className="flex items-center justify-between text-slate-300">
                        <span>Weekly Installment / EMI</span>
                        <strong className="text-amber-400 font-mono text-sm">{currentSlide.cardMetric}</strong>
                      </div>
                      <div className="flex items-center justify-between text-slate-300 text-[11px]">
                        <span>Delivery</span>
                        <span className="text-emerald-300 font-semibold">{currentSlide.cardMetric2}</span>
                      </div>
                    </div>

                    <button
                      onClick={currentSlide.ctaAction}
                      className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 border border-white/20 cursor-pointer"
                    >
                      <span>View Product Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Minimalist Progress Indicators */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
                {heroSlides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveSlide(idx)}
                    className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                      activeSlide === idx ? 'bg-[#ff9900] w-9 shadow-lg shadow-amber-500/50' : 'bg-white/35 w-2 hover:bg-white/70'
                    }`}
                    title={`Slide ${idx + 1}`}
                  />
                ))}
              </div>

              {/* Next / Prev Controls */}
              <button
                onClick={() => setActiveSlide((prev) => (prev === 0 ? heroSlides.length - 1 : prev - 1))}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-black/40 hover:bg-black/80 backdrop-blur-md text-white transition cursor-pointer border border-white/10 hover:scale-105"
                title="Previous Slide"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setActiveSlide((prev) => (prev === heroSlides.length - 1 ? 0 : prev + 1))}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-black/40 hover:bg-black/80 backdrop-blur-md text-white transition cursor-pointer border border-white/10 hover:scale-105"
                title="Next Slide"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        );
      })()}

      {/* 4.2 PROMINENT LIVE OFFERS & MEGA DEALS SECTION (ADMIN MANAGED FROM ERP) */}
      {landingConfig.enableOffersSection !== false && landingConfig.offers && landingConfig.offers.filter(o => o.active).length > 0 && (
        <section id="offers-deals-section" className="max-w-[1500px] mx-auto px-3 sm:px-5 py-3 w-full">
          <div className="rounded-3xl bg-gradient-to-r from-[#161208] via-[#241a0b] to-[#141007] border-2 border-amber-500/50 p-4 sm:p-6 shadow-2xl relative overflow-hidden">
            {/* Background ambient glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-amber-500/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/30">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-rose-600 text-white animate-pulse">
                      HOT DEALS
                    </span>
                    <h2 className="text-base sm:text-xl font-black text-white tracking-tight">
                      आजच्या भव्य ऑफर्स व फेस्टिव्हल सवलती
                    </h2>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    मर्यादित कालावधीच्या खास सवलती • WhatsApp वर एका क्लिकमध्ये ऑफर क्लेम करा
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-amber-400 font-bold">
                  {landingConfig.offers.filter(o => o.active).length} सक्रिय ऑफर्स उपलब्ध
                </span>
              </div>
            </div>

            {/* Offers Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-4">
              {landingConfig.offers.filter(o => o.active).map((offer) => (
                <div
                  key={offer.id}
                  className="rounded-2xl bg-[#0e141e]/90 border border-amber-500/40 hover:border-amber-400 p-3.5 flex flex-col justify-between space-y-3 transition-all duration-200 hover:shadow-xl hover:shadow-amber-500/10 group"
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
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          {offer.category}
                        </span>
                      </div>
                    )}

                    <h3 className="font-black text-sm text-white group-hover:text-amber-400 transition-colors line-clamp-2 leading-snug">
                      {offer.title}
                    </h3>

                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {offer.subtitle}
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-black text-emerald-400">
                        {offer.discount}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {offer.validTill}
                      </span>
                    </div>

                    <a
                      href={`https://wa.me/${landingConfig.contactInfo.whatsappNumber}?text=${encodeURIComponent(
                        offer.whatsappMessage || `नमस्कार, मला "${offer.title}" या ऑफरबद्दल माहिती हवी आहे.`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>ऑफर मिळवा (WhatsApp)</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4.5 PROMINENT FRONT STORE CONTACT & ADDRESS BANNER (OPTIONAL - ADMIN CONTROLLED) */}
      {landingConfig.showAddressBanner === true && (
        <div className="max-w-[1500px] mx-auto px-3 sm:px-5 py-2.5 w-full">
          <div className="rounded-2xl bg-gradient-to-r from-[#111927] via-[#19273c] to-[#111927] border-2 border-amber-500/40 p-4 sm:p-5 shadow-xl flex flex-col lg:flex-row items-center justify-between gap-4">
            {/* Address Details */}
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden shrink-0 shadow-[0_0_20px_rgba(245,158,11,0.4)] border-2 border-amber-400/60 bg-[#070a12] p-0.5">
                <SaiLogoEmblem />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500 text-black">
                    अधिकृत पत्ता (Official Address)
                  </span>
                  <span className="text-xs text-emerald-400 font-bold">
                    {landingConfig.contactInfo.timings || 'दुकान चालू आहे (Open Daily 9:30 AM – 9:30 PM)'}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white mt-1">
                  {landingConfig.contactInfo.addressHindi || 'मातोश्री सभागृह समोर, आर्वी रोड, पंजाब कॉलनी, वर्धा - ४४२००१'}
                </h3>
                <p className="text-xs text-slate-300">
                  {landingConfig.contactInfo.landmark ? `${landingConfig.contactInfo.landmark}, Wardha (Maharashtra)` : 'Opposite Matoshree Sabhagruh, Arvi Road, Punjab Colony, Wardha 442001 (Maharashtra)'}
                </p>
              </div>
            </div>

            {/* 3 Prominent Numbers and Quick Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
              <div className="flex items-center gap-2 flex-wrap justify-center">
                <a
                  href={`tel:${landingConfig.contactInfo.helpline1 || '8766486915'}`}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-black text-xs transition flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer border border-emerald-400/40"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{landingConfig.contactInfo.helpline1 || '8766486915'}</span>
                </a>

                <a
                  href={`tel:${landingConfig.contactInfo.helpline2 || '8600122978'}`}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-black text-xs transition flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer border border-amber-300"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{landingConfig.contactInfo.helpline2 || '8600122978'}</span>
                </a>

                <a
                  href={`tel:${landingConfig.contactInfo.helpline3 || '9175537365'}`}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono font-black text-xs transition flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer border border-blue-400/40"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{landingConfig.contactInfo.helpline3 || '9175537365'}</span>
                </a>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={landingConfig.contactInfo.googleMapLink || 'https://www.google.com/maps/search/?api=1&query=Shri+Sai+Enterprises+Matoshree+Sabhagruh+Arvi+Road+Punjab+Colony+Wardha+442001'}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-[#ffd814] hover:bg-[#f7ca00] text-[#0f1111] font-black text-xs transition flex items-center gap-1.5 shadow active:scale-95 cursor-pointer"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>गुगल मॅप दिशा</span>
                </a>

                <a
                  href={`https://wa.me/${landingConfig.contactInfo.whatsappNumber}?text=Hello%20Shri%20Sai%20Enterprises,%20Wardha.%20I%20am%20calling%20regarding%20furniture%20and%20electronics.`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition active:scale-95 cursor-pointer"
                  title="WhatsApp Us"
                >
                  <MessageCircle className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. AMAZON VALUE PROPOSITION STRIP */}
      <div className="max-w-[1500px] mx-auto px-3 sm:px-5 py-2 w-full">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-3.5 rounded-xl bg-[#171f2a] border border-[#273549] text-xs">
          <div className="flex items-center gap-2.5">
            <Truck className="w-5 h-5 text-[#febd69] shrink-0" />
            <div>
              <span className="font-bold block text-white">FREE Express Delivery</span>
              <span className="text-[10px] text-slate-400">Wardha & 50km Surroundings</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold block text-white">100% Genuine Brand Bill</span>
              <span className="text-[10px] text-slate-400">Authorized Manufacturer Warranty</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <CreditCard className="w-5 h-5 text-[#f08804] shrink-0" />
            <div>
              <span className="font-bold block text-white">₹100 - ₹200 Weekly Savings</span>
              <span className="text-[10px] text-slate-400">30-Month Passbook Scheme</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Calculator className="w-5 h-5 text-purple-400 shrink-0" />
            <div>
              <span className="font-bold block text-white">0% No Cost EMI</span>
              <span className="text-[10px] text-slate-400">Bajaj & TVS Finance In-Store</span>
            </div>
          </div>
        </div>
      </div>

      {/* 6. MAIN CATALOG: AMAZON DARK THEME PRODUCT GRID */}
      <main id="products-catalog-section" className="max-w-[1500px] mx-auto px-3 sm:px-5 py-4 flex-1 w-full space-y-6 scroll-mt-20">
        
        {/* Active Search Results Indicator Banner */}
        {searchQuery.trim() && (
          <div className="bg-[#172436] border border-[#f90]/60 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-lg animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-[#febd69] text-black">
                <Search className="w-4 h-4" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[#febd69] font-extrabold text-sm">Search Results:</span>
                  <span className="font-black text-white text-base">"{searchQuery}"</span>
                </div>
                <div className="text-slate-300 text-[11px]">
                  {filteredProducts.length > 0 
                    ? `Found ${filteredProducts.length} matching products.`
                    : `No exact product found with this name or model.`}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
              className="px-4 py-2 rounded-xl bg-[#232f3e] hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs flex items-center gap-1.5 transition border border-slate-600 cursor-pointer shadow-sm active:scale-95 self-stretch sm:self-auto justify-center"
            >
              <span>Show All Products</span>
              <span>✕</span>
            </button>
          </div>
        )}

        {/* Category Tabs & Sorting Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-[#273549]">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 no-scrollbar">
            {categories.map((c) => {
              const IconComp = c.icon;
              const isSelected = selectedCategory === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 border ${
                    isSelected
                      ? 'bg-[#febd69] text-[#131921] border-[#f3a847] shadow'
                      : 'bg-[#1a2432] text-slate-300 border-[#2d3a4d] hover:border-slate-500'
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
            <div className="flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="bg-[#17202d] text-white text-xs px-2.5 py-1.5 rounded border border-slate-700 outline-none cursor-pointer"
              >
                <option value="featured">Featured (Top Recommended)</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Zero Results Feedback with Fast Tag Suggestions */}
        {storeData.stock.length === 0 ? (
          <div className="py-20 px-4 text-center rounded-3xl bg-[#171f2a] border border-slate-800 space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#232f3e] text-[#febd69] flex items-center justify-center mx-auto text-3xl">
              🏪
            </div>
            <div className="space-y-2 max-w-md mx-auto">
              <h3 className="text-lg font-bold text-white">
                शोरूम नवीन स्टॉकसाठी सज्ज आहे (Showroom Ready)
              </h3>
              <p className="text-xs text-slate-400">
                सर्व डमी / डेमो उत्पादने डिलीट झाली आहेत. तुमच्या दुकानातील खरी उत्पादने जोडण्यासाठी खालील बटनावर क्लिक करून ERP पोर्टल उघडा.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsAdminPinModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-lg transition cursor-pointer"
              >
                🔐 ERP पोर्टल लॉगिन (+ नवीन माल जोडा)
              </button>
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-16 px-4 text-center rounded-3xl bg-[#171f2a] border border-slate-800 space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#232f3e] text-[#febd69] flex items-center justify-center mx-auto text-2xl">
              🔍
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">
                No products found for "{searchQuery}"
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Please check your spelling or choose from popular suggestions below:
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              {['Smart TV', 'Teakwood Sofa', 'Diwan Bed', 'Single Door Refrigerator', 'Air Cooler', 'Godrej Cupboard'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSearchQuery(tag)}
                  className="px-3 py-1.5 rounded-full bg-[#232f3e] hover:bg-[#febd69] hover:text-[#131921] text-slate-300 text-xs font-semibold border border-slate-700 transition cursor-pointer"
                >
                  + {tag}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                }}
                className="px-4 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow cursor-pointer"
              >
                Reset All Products
              </button>
            </div>
          </div>
        ) : (
          /* Amazon Dark Theme Product Grid with Genuine Images */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {filteredProducts.map((prod: StockItem) => {
            const genuineImg = getGenuineProductImage(prod);
            const discountPct = Math.round(((prod.mrp - prod.salePrice) / prod.mrp) * 100);
            const isBestSeller = prod.salePrice > 30000 || prod.category === 'Electronics';

            return (
              <div
                key={prod.id}
                className="rounded-xl border border-[#273549] bg-[#171f2a] hover:border-[#ff9900] hover:shadow-2xl hover:shadow-black/70 transition-all duration-200 flex flex-col justify-between overflow-hidden group relative"
              >
                {/* Genuine Photographic Image Frame */}
                <div
                  onClick={() => setQuickViewProduct(prod)}
                  className="relative h-56 sm:h-64 bg-[#111721] p-3 flex items-center justify-center cursor-pointer overflow-hidden border-b border-[#243041]"
                >
                  <img
                    src={genuineImg}
                    alt={prod.name}
                    className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />

                  {/* Brand Tag Top Left */}
                  <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-[#131921]/90 text-[#febd69] border border-slate-700">
                    {prod.brand}
                  </span>

                  {/* Deal / Prime Badges */}
                  <div className="absolute top-2.5 right-2.5 flex flex-col items-end gap-1">
                    {prod.landingBadge ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-[#cc0c39] text-white shadow">
                        {prod.landingBadge}
                      </span>
                    ) : discountPct > 0 ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-[#cc0c39] text-white shadow">
                        {discountPct}% OFF
                      </span>
                    ) : null}
                    <span className="text-[#00a8e1] font-black text-[11px] flex items-center gap-0.5 bg-[#131921]/90 px-1.5 py-0.2 rounded border border-slate-800">
                      prime <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                  </div>

                  {/* Quick View Button on Hover */}
                  <div className="absolute inset-x-3 bottom-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setQuickViewProduct(prod);
                      }}
                      className="w-full py-1.5 bg-[#232f3e]/90 hover:bg-[#232f3e] text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 shadow border border-slate-600"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#febd69]" />
                      <span>Quick View</span>
                    </button>
                  </div>
                </div>

                {/* Card Content & Amazon Pricing */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    {/* Amazon's Choice Tag */}
                    {isBestSeller && (
                      <div className="inline-flex items-center gap-1 bg-[#232f3e] text-white text-[10px] px-2 py-0.5 rounded mb-1.5 border-l-2 border-[#e77600]">
                        <span className="text-[#e77600] font-black">Amazon's</span>
                        <span className="font-bold">Choice</span>
                      </div>
                    )}

                    {/* Product Title */}
                    <h3
                      onClick={() => setQuickViewProduct(prod)}
                      className="font-bold text-sm text-slate-100 group-hover:text-[#ff9900] line-clamp-2 leading-snug cursor-pointer transition-colors"
                      title={prod.name}
                    >
                      {prod.name}
                    </h3>

                    {/* Amazon Rating Stars */}
                    <div className="flex items-center gap-1.5 mt-1 text-xs">
                      <div className="flex text-[#ffa41c]">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-current" />
                        ))}
                      </div>
                      <span className="text-slate-400 text-[11px] font-medium">
                        4.8 (1,240+)
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">
                      {prod.description || '100% authentic brand showroom warranty, GST invoice, and free express delivery.'}
                    </p>
                  </div>

                  {/* Pricing Box */}
                  <div className="space-y-2.5 pt-2 border-t border-[#273549]">
                    <div>
                      <div className="flex items-baseline gap-2">
                        {discountPct > 0 && (
                          <span className="text-sm font-bold text-[#cc0c39]">
                            -{discountPct}%
                          </span>
                        )}
                        <span className="text-2xl font-black text-white tabular-nums tracking-tight">
                          ₹{prod.salePrice.toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <span>M.R.P.:</span>
                        <span className="line-through">₹{prod.mrp.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    {/* 30-Month Scheme & EMI Badge */}
                    <div className="p-2 rounded-lg bg-[#111721] border border-slate-800 space-y-0.5">
                      <div className="flex items-center justify-between text-[11px] text-amber-300 font-bold">
                        <span>30-Mo Savings Scheme:</span>
                        <span className="text-[#febd69]">
                          {prod.schemeWeeklyAmount ? `₹${prod.schemeWeeklyAmount} / wk` : '₹100 - ₹200 / wk'}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block">
                        No Cost EMI from ₹{Math.round(prod.salePrice / 10).toLocaleString('en-IN')}/mo
                      </span>
                    </div>

                    {/* Fast Delivery Promise */}
                    <div className="text-[11px] text-slate-300 flex items-center gap-1">
                      <span className="text-emerald-400 font-bold">FREE Delivery</span>
                      <span>Tomorrow by 11 AM • Wardha</span>
                    </div>

                    {/* Action Buttons (Amazon Style: Add to Cart & Buy Now/WhatsApp) */}
                    <div className="space-y-2 pt-1">
                      <button
                        onClick={() => addToCart(prod)}
                        className="w-full py-2 px-3 bg-[#ffd814] hover:bg-[#f7ca00] active:scale-95 text-[#0f1111] font-bold rounded-full text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm border border-[#fcd200]"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>Add to Cart</span>
                      </button>

                      <div className="grid grid-cols-2 gap-2">
                        <a
                          href={`https://wa.me/918766486915?text=${encodeURIComponent(
                            `Hello Shri Sai Enterprises (Wardha), I would like to purchase:\nProduct: ${prod.name} (${prod.brand})\nPrice: ₹${prod.salePrice.toLocaleString('en-IN')}\nPlease share delivery and order confirmation details.`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="py-1.5 px-2 bg-[#ffa41c] hover:bg-[#fa8900] active:scale-95 text-[#0f1111] font-bold rounded-full text-[11px] flex items-center justify-center gap-1 transition cursor-pointer shadow-sm border border-[#ff8f00]"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Buy Now</span>
                        </a>

                        <button
                          onClick={() => {
                            setFinanceProduct({
                              name: prod.name,
                              price: prod.salePrice,
                            });
                            setIsFinanceEmiOpen(true);
                          }}
                          className="py-1.5 px-2 bg-[#232f3e] hover:bg-[#2c3a4d] text-slate-200 hover:text-white font-bold rounded-full text-[11px] flex items-center justify-center gap-1 transition cursor-pointer border border-slate-700"
                        >
                          <Calculator className="w-3 h-3 text-[#febd69]" />
                          <span>EMI Calculator</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        )}
      </main>

      {/* ========================================================================================= */}
      {/* 7. POINT 4: 30-MONTH SAVINGS SCHEME BIG PROMINENT BANNER (UNIQUE SELLING POINT)          */}
      {/* ========================================================================================= */}
      {landingConfig.showSchemeBanner !== false && (
        <section className="max-w-[1500px] mx-auto px-3 sm:px-5 py-4 w-full">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#170e03] via-[#2a1705] to-[#120a02] border-2 border-amber-500/50 p-6 sm:p-10 shadow-2xl">
            {/* Subtle Golden Glow Accents */}
            <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-amber-600/10 blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="max-w-3xl space-y-4">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black tracking-wide uppercase shadow-sm">
                  <Gift className="w-4 h-4 text-amber-400" />
                  <span>{landingConfig.schemeBanner?.badge || "३०-महिने साप्ताहिक बचत व मासिक लकी ड्रॉ योजना • WARDHA'S #1 SAVINGS SCHEME"}</span>
                </div>

                {/* Exact Marathi Highlight requested by User */}
                <h2 className="text-2xl sm:text-4xl lg:text-4xl font-black text-white leading-tight">
                  "{landingConfig.schemeBanner?.title || 'वर्ध्यात सर्वात सोप्या हप्त्यांवर आणि ३० महिन्यांच्या बचत योजनेवर फर्निचर व इलेक्ट्रॉनिक्स खरेदी करा!'}"
                </h2>

                <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-medium">
                  {landingConfig.schemeBanner?.subtitle || 'दर आठवड्याला फक्त ₹१०० किंवा ₹२०० बचत करा! दरमहा पारदर्शक लकी सोडत — जर तुमचा नंबर ड्रॉ मध्ये लागला, तर सर्व पुढील हप्ते १००% मोफत आणि वस्तू लगेच घरी! ३० महिन्यांनी ड्रॉ न लागल्यास पूर्ण जमा रकमेचे फर्निचर किंवा इलेक्ट्रॉनिक्स हमखास उपलब्ध. कोणताही तोटा नाही!'}
                </p>

                {/* Key Features Badges */}
                <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 border border-amber-500/30 text-amber-300 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> {landingConfig.schemeBanner?.weeklyBadge1 || 'हप्ता फक्त ₹१०० किंवा ₹२०० / आठवडा'}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 border border-amber-500/30 text-amber-300 font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" /> {landingConfig.schemeBanner?.weeklyBadge2 || 'दरमहा लकी ड्रॉ बंपर बक्षीस'}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 border border-amber-500/30 text-amber-300 font-bold">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> {landingConfig.schemeBanner?.highlightNote || '१००% सुरक्षित खरेदी हमी'}
                  </span>
                </div>
              </div>

              {/* Quick Action Box */}
              <div className="w-full lg:w-80 shrink-0 space-y-3 p-5 rounded-2xl bg-black/60 border border-amber-500/40 backdrop-blur-md shadow-xl text-center">
                <span className="text-[11px] font-black uppercase text-amber-400 tracking-wider block">
                  लकी ड्रॉ पासबुक व नवीन नोंदणी
                </span>
                <p className="text-xs text-slate-300">
                  तुमच्या कार्डचे हप्ते ऑनलाइन तपासा किंवा घरबसल्या WhatsApp वर नवीन कार्ड उघडा.
                </p>

                <button
                  onClick={() => {
                    const el = document.getElementById('passbook-portal-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full py-3 px-4 bg-[#ffd814] hover:bg-[#f7ca00] text-[#0f1111] font-black rounded-xl text-xs transition cursor-pointer shadow-lg hover:shadow-[#ffd814]/25 flex items-center justify-center gap-2 active:scale-95"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>योजना पासबुक शोधा (Check Passbook)</span>
                </button>

                <a
                  href="https://wa.me/918600122978?text=Hello%20Shri%20Sai%20Enterprises,%20I%20want%20to%20enroll%20in%20the%2030-Month%20Savings%20Scheme%20in%20Wardha."
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 px-4 bg-emerald-600/90 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow cursor-pointer border border-emerald-400/40 active:scale-95"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp वर नाव नोंदवा</span>
                </a>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 8. DEDICATED PASSBOOK LOOKUP PORTAL (PLACED ALONGSIDE SCHEME FOR CLEAN STOREFRONT) */}
      {landingConfig.showPassbookSection !== false && (
        <section id="passbook-portal-section" className="max-w-[1500px] mx-auto px-3 sm:px-5 py-3 w-full">
          <div className="rounded-2xl border border-[#3b4b62] bg-gradient-to-r from-[#131b26] via-[#17212e] to-[#1a2535] p-5 sm:p-7 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#2d3a4d]">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-black bg-[#febd69] text-[#131921] mb-1.5 uppercase tracking-wide shadow-sm">
                  <CreditCard className="w-3.5 h-3.5" /> Customer Digital Passbook & Ledger
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  Track Scheme Passbook & Paid Installments
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  Shri Sai Weekly Savings members can enter their Card Number or 10-digit Phone Number to view total deposits, balance weeks, and lucky draw eligibility.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="px-3 py-1.5 rounded-lg bg-[#232f3e] text-amber-300 font-bold text-xs border border-slate-700 shadow-sm flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{storeData.cardMembers.length} Active Member Cards</span>
                </span>
              </div>
            </div>

            {/* Passbook Search Input Form */}
            <form onSubmit={handleOnPageSearchPassbook} className="mt-4 flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Enter your Card No (e.g. 1001, 1050, 1088) or 10-digit Mobile Number..."
                  value={onPageCardQuery}
                  onChange={(e) => {
                    setOnPageCardQuery(e.target.value);
                    setOnPageError('');
                  }}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-700 bg-[#0f141c] text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#f90] shadow-inner"
                />
                {onPageCardQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setOnPageCardQuery('');
                      setOnPageMember(null);
                      setOnPageError('');
                    }}
                    className="absolute right-3 top-3 text-slate-400 hover:text-white text-xs px-1.5 py-0.5"
                  >
                    ✕
                  </button>
                )}
              </div>

              <button
                type="submit"
                className="py-3 px-6 bg-[#ffd814] hover:bg-[#f7ca00] text-[#0f1111] font-bold text-sm rounded-xl transition cursor-pointer shadow-md border border-[#fcd200] flex items-center justify-center gap-2 shrink-0 active:scale-95"
              >
                <Search className="w-4 h-4 stroke-[2.5]" />
                <span>Search Passbook</span>
              </button>
            </form>

            {/* Error Message */}
            {onPageError && (
              <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-2">
                <span>⚠️</span>
                <span>{onPageError}</span>
              </div>
            )}

            {/* Found Member Live Passbook Card Result */}
            {onPageMember && (() => {
              const stats = calculateMemberStats(onPageMember);
              return (
                <div className="mt-5 rounded-2xl bg-[#17212e] border border-[#ff9900]/50 p-5 sm:p-6 shadow-2xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-700">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded text-xs font-black bg-[#febd69] text-[#131921]">
                          Card #{onPageMember.cardNo}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          {onPageMember.status || 'Active'} Member
                        </span>
                        <span className="text-xs font-medium text-slate-400">
                          Scheme: {onPageMember.schemeName || '30-Month Weekly Savings Scheme'}
                        </span>
                      </div>
                      <h3 className="text-xl font-black text-white mt-1">
                        {onPageMember.memberName}
                      </h3>
                      <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-rose-400" />
                        <span>{onPageMember.village || onPageMember.address || 'Wardha'}</span>
                        <span>•</span>
                        <Phone className="w-3.5 h-3.5 text-[#febd69]" />
                        <span>{onPageMember.phone || 'Not Available'}</span>
                      </p>
                    </div>

                    {/* Lucky Draw Status */}
                    <div className="text-right flex sm:flex-col items-center sm:items-end justify-between gap-1">
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-600 text-white shadow-sm flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Lucky Draw Eligible
                      </span>
                      <span className="text-[11px] font-bold text-[#febd69]">
                        Weekly Installment: ₹{stats.weeklyAmt} / wk
                      </span>
                    </div>
                  </div>

                  {/* Key Passbook Financial Summary Metric Blocks */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-[#0f141c] border border-slate-700">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Weeks Paid
                      </span>
                      <span className="text-xl sm:text-2xl font-black text-[#febd69] tabular-nums">
                        {stats.paidWeeks} / {stats.totalWeeks} Weeks
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#0f141c] border border-slate-700">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Total Deposited
                      </span>
                      <span className="text-xl sm:text-2xl font-black text-emerald-400 tabular-nums">
                        ₹{stats.totalPaid.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#0f141c] border border-slate-700">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Weekly Installment
                      </span>
                      <span className="text-xl sm:text-2xl font-black text-amber-300 tabular-nums">
                        ₹{stats.weeklyAmt} <span className="text-xs font-normal">/wk</span>
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#0f141c] border border-slate-700">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Next Due Installment
                      </span>
                      <span className="text-xl sm:text-2xl font-black text-purple-400 tabular-nums">
                        Week #{stats.paidWeeks + 1}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold text-slate-300">
                      <span>Scheme Completion Progress</span>
                      <span>{Math.min(100, Math.round((stats.paidWeeks / stats.totalWeeks) * 100))}% Completed</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#f08804] to-[#febd69] transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(5, (stats.paidWeeks / stats.totalWeeks) * 100))}%` }}
                      />
                    </div>
                  </div>

                  {/* WhatsApp Statement Download Button */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-700 text-xs">
                    <span className="text-slate-400 text-[11px]">
                      Shri Sai Enterprises • Opp. Matoshree Hall, Arvi Road, Wardha
                    </span>

                    <a
                      href={`https://wa.me/917822859073?text=${encodeURIComponent(
                        `Hello Shri Sai Enterprises, my Card No is ${onPageMember.cardNo} (${onPageMember.memberName}). I have paid ₹${stats.totalPaid} (${stats.paidWeeks} weeks). Please send my official ledger statement and Lucky Draw status.`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 transition shadow"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Get Statement via WhatsApp</span>
                    </a>
                  </div>
                </div>
              );
            })()}
          </div>
        </section>
      )}

      {/* ========================================================================================= */}
      {/* 9. POINT 3: DEDICATED LANDING SECTION A — ELECTRONICS IN WARDHA (ADMIN TOGGLEABLE)        */}
      {/* ========================================================================================= */}
      {landingConfig.showElectronicsSection === true && (
        <section id="electronics-wardha-section" className="max-w-[1500px] mx-auto px-3 sm:px-5 py-6 w-full">
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#0c1422] via-[#0f1a2c] to-[#070c14] border border-[#23354f] shadow-2xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[#1e2f47]">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-bold uppercase tracking-wider">
                <Tv className="w-3.5 h-3.5" />
                <span>Electronics in Wardha • स्थानिक इलेक्ट्रॉनिक्स महासेल</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Electronics in Wardha
              </h2>
              <p className="text-sm font-bold text-amber-400">
                "वर्ध्यात ब्रँडेड इलेक्ट्रॉनिक्सवर विशेष सवलत"
              </p>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                स्मार्ट 4K UHD टीव्ही (LED TV), ड्युअल इन्व्हर्टर फ्रिज (Refrigerators), ५-स्टार वॉशिंग मशीन, कुलर आणि स्प्लिट एसी. अधिकृत शोरूम जीएसटी बिल, ब्रँड वॉरंटी, मोफत होम डिलिव्हरी व ०% डाऊनपेमेंट सुलभ हप्ते.
              </p>
            </div>

            <button
              onClick={() => {
                setSelectedCategory('Electronics');
                const el = document.getElementById('products-catalog-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 transition cursor-pointer shrink-0 shadow-lg active:scale-95"
            >
              <span>सर्व इलेक्ट्रॉनिक्स पहा (View All)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* 4 Feature Category Cards for Electronics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              onClick={() => {
                setSelectedCategory('Electronics');
                setSearchQuery('TV');
                const el = document.getElementById('products-catalog-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="p-4 rounded-2xl bg-[#141e30] border border-[#283c5a] hover:border-blue-400 transition cursor-pointer group space-y-3"
            >
              <div className="h-40 rounded-xl overflow-hidden bg-black/40 flex items-center justify-center p-2 relative">
                <img
                  src="https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600&auto=format&fit=crop&q=80"
                  alt="Smart 4K LED TVs Wardha"
                  className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition duration-500"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-black bg-blue-600 text-white">
                  32" ते 65" UHD
                </span>
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-white group-hover:text-blue-300 transition">
                  स्मार्ट 4K UHD टीव्ही (Smart LED TVs)
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Samsung, LG, Sony आणि Mi Smart TVs. व्हॉइस रिमोट, नेटफ्लिक्स व युट्यूब सपोर्टसह.
                </p>
                <div className="flex items-center justify-between pt-2 text-xs">
                  <span className="text-[#febd69] font-bold">हप्ता: ₹१०० - ₹२०० / wk</span>
                  <span className="text-blue-400 text-[11px] font-bold">एक्सप्लोर करा →</span>
                </div>
              </div>
            </div>

            <div
              onClick={() => {
                setSelectedCategory('Appliances');
                setSearchQuery('Fridge');
                const el = document.getElementById('products-catalog-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="p-4 rounded-2xl bg-[#141e30] border border-[#283c5a] hover:border-blue-400 transition cursor-pointer group space-y-3"
            >
              <div className="h-40 rounded-xl overflow-hidden bg-black/40 flex items-center justify-center p-2 relative">
                <img
                  src="https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=600&auto=format&fit=crop&q=80"
                  alt="Inverter Refrigerators Wardha"
                  className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition duration-500"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-black bg-blue-600 text-white">
                  इन्व्हर्टर फ्रिज
                </span>
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-white group-hover:text-blue-300 transition">
                  फ्रिज (Inverter Refrigerators)
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  LG, Whirlpool आणि Godrej सिंगल व डबल डोअर. १० वर्षे कॉम्प्रेसर वॉरंटी व वीज बचत.
                </p>
                <div className="flex items-center justify-between pt-2 text-xs">
                  <span className="text-[#febd69] font-bold">किंमत: ₹१४,९९० पासून</span>
                  <span className="text-blue-400 text-[11px] font-bold">एक्सप्लोर करा →</span>
                </div>
              </div>
            </div>

            <div
              onClick={() => {
                setSelectedCategory('Appliances');
                setSearchQuery('Washing');
                const el = document.getElementById('products-catalog-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="p-4 rounded-2xl bg-[#141e30] border border-[#283c5a] hover:border-blue-400 transition cursor-pointer group space-y-3"
            >
              <div className="h-40 rounded-xl overflow-hidden bg-black/40 flex items-center justify-center p-2 relative">
                <img
                  src="https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=600&auto=format&fit=crop&q=80"
                  alt="5-Star Washing Machines Wardha"
                  className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition duration-500"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-black bg-blue-600 text-white">
                  ५-स्टार वॉशिंग मशीन
                </span>
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-white group-hover:text-blue-300 transition">
                  वॉशिंग मशीन (Washing Machines)
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Whirlpool व Samsung सेमी व फुल्ली ऑटोमॅटिक. हेवी मोटर व क्विक ड्रायर.
                </p>
                <div className="flex items-center justify-between pt-2 text-xs">
                  <span className="text-[#febd69] font-bold">किंमत: ₹११,९९० पासून</span>
                  <span className="text-blue-400 text-[11px] font-bold">एक्सप्लोर करा →</span>
                </div>
              </div>
            </div>

            <div
              onClick={() => {
                setSelectedCategory('Appliances');
                setSearchQuery('Cooler');
                const el = document.getElementById('products-catalog-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="p-4 rounded-2xl bg-[#141e30] border border-[#283c5a] hover:border-blue-400 transition cursor-pointer group space-y-3"
            >
              <div className="h-40 rounded-xl overflow-hidden bg-black/40 flex items-center justify-center p-2 relative">
                <img
                  src="https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=600&auto=format&fit=crop&q=80"
                  alt="Air Coolers and Split AC Wardha"
                  className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition duration-500"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-black bg-blue-600 text-white">
                  कुलर आणि एसी
                </span>
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-white group-hover:text-blue-300 transition">
                  कुलर आणि एसी (Coolers & Split AC)
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Voltas इन्व्हर्टर स्प्लिट एसी आणि हेवी ड्युटी डेझर्ट कुलर्स. वीज बचत व तीव्र थंडावा.
                </p>
                <div className="flex items-center justify-between pt-2 text-xs">
                  <span className="text-[#febd69] font-bold">किंमत: ₹६,४९० पासून</span>
                  <span className="text-blue-400 text-[11px] font-bold">एक्सप्लोर करा →</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* ========================================================================================= */}
      {/* 10. POINT 3: DEDICATED LANDING SECTION B — FURNITURE IN WARDHA (ADMIN TOGGLEABLE)         */}
      {/* ========================================================================================= */}
      {landingConfig.showFurnitureSection === true && (
        <section id="furniture-wardha-section" className="max-w-[1500px] mx-auto px-3 sm:px-5 py-6 w-full">
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#1c1107] via-[#24160a] to-[#120a03] border border-[#523315] shadow-2xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[#44280f]">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
                <Sofa className="w-3.5 h-3.5" />
                <span>Furniture in Wardha • अस्सल चंद्रपूर सागवान व स्टील फर्निचर</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Furniture in Wardha
              </h2>
              <p className="text-sm font-bold text-amber-400">
                "वर्ध्यात सर्वोत्तम गुणवत्तेचे फर्निचर थेट कारखान्याच्या भावात"
              </p>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                लाकडी व मॉड्युलर सोफा सेट, डबल बेड, स्टोरेज दिवाण, वॉर्डरोब (कपाट), डायनिंग टेबल आणि ऑफिस चेअर्स. थेट फॅक्टरी होलसेल दर, आयुष्यभराची लाकूड हमी आणि ५ वर्षे शोरूम वॉरंटी.
              </p>
            </div>

            <button
              onClick={() => {
                setSelectedCategory('Furniture');
                const el = document.getElementById('products-catalog-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-2 transition cursor-pointer shrink-0 shadow-lg active:scale-95"
            >
              <span>सर्व फर्निचर पहा (View All)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* 4 Feature Category Cards for Furniture */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              onClick={() => {
                setSelectedCategory('Furniture');
                setSearchQuery('Sofa');
                const el = document.getElementById('products-catalog-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="p-4 rounded-2xl bg-[#20140a] border border-[#4a2e16] hover:border-amber-400 transition cursor-pointer group space-y-3"
            >
              <div className="h-40 rounded-xl overflow-hidden bg-black/40 flex items-center justify-center p-2 relative">
                <img
                  src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop&q=80"
                  alt="Teakwood Sofa Set Wardha"
                  className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition duration-500"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-black bg-amber-600 text-white">
                  अस्सल सागवान
                </span>
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-white group-hover:text-amber-300 transition">
                  सागवान सोफा सेट (Teakwood Sofas)
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  ३+१+१ रॉयल डिझायनर सागवान सोफा. चंद्रपूर अस्सल लाकूड, कुशन व ५ वर्षे वॉरंटी.
                </p>
                <div className="flex items-center justify-between pt-2 text-xs">
                  <span className="text-[#febd69] font-bold">थेट फॅक्टरी भाव</span>
                  <span className="text-amber-400 text-[11px] font-bold">एक्सप्लोर करा →</span>
                </div>
              </div>
            </div>

            <div
              onClick={() => {
                setSelectedCategory('Diwan');
                const el = document.getElementById('products-catalog-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="p-4 rounded-2xl bg-[#20140a] border border-[#4a2e16] hover:border-amber-400 transition cursor-pointer group space-y-3"
            >
              <div className="h-40 rounded-xl overflow-hidden bg-black/40 flex items-center justify-center p-2 relative">
                <img
                  src="https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&auto=format&fit=crop&q=80"
                  alt="Storage Box Diwan Wardha"
                  className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition duration-500"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-black bg-amber-600 text-white">
                  स्टोरेज बॉक्स दिवाण
                </span>
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-white group-hover:text-amber-300 transition">
                  स्टोरेज दिवाण व कॉट (Box Diwans & Beds)
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  ४x६ आणि ५x६ हेवी स्टोरेज बॉक्स दिवाण व शीशम कॉट. हायड्रोलिक लिफ्ट व मजबूत प्लाय.
                </p>
                <div className="flex items-center justify-between pt-2 text-xs">
                  <span className="text-[#febd69] font-bold">किंमत: ₹८,९९० पासून</span>
                  <span className="text-amber-400 text-[11px] font-bold">एक्सप्लोर करा →</span>
                </div>
              </div>
            </div>

            <div
              onClick={() => {
                setSelectedCategory('Furniture');
                setSearchQuery('Cupboard');
                const el = document.getElementById('products-catalog-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="p-4 rounded-2xl bg-[#20140a] border border-[#4a2e16] hover:border-amber-400 transition cursor-pointer group space-y-3"
            >
              <div className="h-40 rounded-xl overflow-hidden bg-black/40 flex items-center justify-center p-2 relative">
                <img
                  src="https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=600&auto=format&fit=crop&q=80"
                  alt="Steel Wardrobes and Almirahs Wardha"
                  className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition duration-500"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-black bg-amber-600 text-white">
                  टाटा स्टील कपाट
                </span>
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-white group-hover:text-amber-300 transition">
                  वॉर्डरोब व स्टील कपाट (Almirahs)
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  हेवी गेज स्टील कपाट व ३-डोअर डिझायनर वॉर्डरोब. सुरक्षित तिजोरी लॉकर व आरसा.
                </p>
                <div className="flex items-center justify-between pt-2 text-xs">
                  <span className="text-[#febd69] font-bold">किंमत: ₹९,४९० पासून</span>
                  <span className="text-amber-400 text-[11px] font-bold">एक्सप्लोर करा →</span>
                </div>
              </div>
            </div>

            <div
              onClick={() => {
                setSelectedCategory('Furniture');
                setSearchQuery('Dining');
                const el = document.getElementById('products-catalog-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="p-4 rounded-2xl bg-[#20140a] border border-[#4a2e16] hover:border-amber-400 transition cursor-pointer group space-y-3"
            >
              <div className="h-40 rounded-xl overflow-hidden bg-black/40 flex items-center justify-center p-2 relative">
                <img
                  src="https://images.unsplash.com/photo-1617806118233-18e1de247200?w=600&auto=format&fit=crop&q=80"
                  alt="Dining Tables and Office Chairs Wardha"
                  className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition duration-500"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-black bg-amber-600 text-white">
                  डायनिंग व चेअर्स
                </span>
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-white group-hover:text-amber-300 transition">
                  डायनिंग टेबल व ऑफिस चेअर्स (Dining & Chairs)
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  ४ व ६ सीटर सागवान डायनिंग टेबल आणि अर्गोनॉमिक ऑफिस रिव्हॉल्व्हिंग चेअर्स.
                </p>
                <div className="flex items-center justify-between pt-2 text-xs">
                  <span className="text-[#febd69] font-bold">किंमत: ₹५,९९० पासून</span>
                  <span className="text-amber-400 text-[11px] font-bold">एक्सप्लोर करा →</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* ========================================================================================= */}
      {/* 11. SHOWROOM LOCATION, VERIFIED REVIEWS & STORE EXPERIENCE (ADMIN TOGGLEABLE)             */}
      {/* ========================================================================================= */}
      {landingConfig.showReviewsSection !== false && (
        <section id="google-business-section" className="max-w-[1500px] mx-auto px-3 sm:px-5 py-6 w-full">
        <div className="rounded-3xl bg-[#0f1522] border-2 border-amber-500/40 p-5 sm:p-8 shadow-2xl space-y-6">
          
          {/* Header: Verified Store & Google Customer Rating */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden shadow-2xl shrink-0 border-2 border-amber-400/50 bg-[#070a12] p-0.5">
                <SaiLogoEmblem />
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <BadgeCheck className="w-3.5 h-3.5" /> अधिकृत शोरूम (Verified Showroom)
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    वर्धा मुख्य शाखा
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  श्री साई इंटरप्रायजेस • इलेक्ट्रॉनिक्स व फर्निचर शोरूम, वर्धा
                </h3>
                <p className="text-xs text-slate-300 flex items-center gap-1.5 flex-wrap">
                  <span className="text-amber-400 font-bold">१००% अस्सल चंद्रपूर सागवान लाकूड</span>
                  <span>•</span>
                  <span>ब्रँडेड स्मार्ट टीव्ही, कुलर व उपकरणे</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-bold">दररोज सकाळी ९:३० ते रात्री ९:३०</span>
                </p>
              </div>
            </div>

            {/* Google Rating Counter */}
            <div className="flex items-center gap-3 bg-[#172132] px-4 py-3 rounded-2xl border border-slate-700 shrink-0">
              <div className="text-center">
                <span className="text-2xl font-black text-white tabular-nums">4.9</span>
                <div className="flex text-amber-400 text-xs">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
              </div>
              <div className="text-[11px] text-slate-300 border-l border-slate-700 pl-3">
                <span className="font-bold block text-white">३५०+ ग्राहकांचे उत्तम रिव्ह्यूज</span>
                <span className="text-emerald-400 font-semibold">वर्ध्यात सर्वाधिक विश्वासू</span>
              </div>
            </div>
          </div>

          {/* Showroom Visit & Verified Testimonials Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Left: Showroom Interior Display & Directions */}
            <div className="lg:col-span-7 rounded-2xl overflow-hidden border border-slate-700 bg-black/60 relative group flex flex-col justify-between min-h-[360px]">
              <img
                src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&auto=format&fit=crop&q=80"
                alt="Shri Sai Enterprises Showroom Wardha"
                className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-black/30" />

              {/* Top Banner Tag */}
              <div className="relative z-10 p-4 flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/20 text-white text-xs font-bold flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-amber-400" />
                  <span>प्रत्यक्ष शोरूमला भेट द्या (Visit Our Showroom)</span>
                </span>
                <span className="px-2.5 py-1 rounded-full bg-emerald-600/90 text-white text-[11px] font-black uppercase shadow">
                  दुकान चालू आहे • OPEN
                </span>
              </div>

              {/* Bottom Info Overlay */}
              <div className="relative z-10 p-5 space-y-2.5">
                <h4 className="text-lg sm:text-xl font-black text-white drop-shadow">
                  श्री साई इंटरप्रायजेस • भव्य इलेक्ट्रॉनिक्स व फर्निचर शोरूम
                </h4>
                <p className="text-xs text-slate-200 drop-shadow max-w-xl leading-relaxed">
                  दोन मजली भव्य शोरूम — तळमजल्यावर सॅमसंग व एलजी स्मार्ट टीव्ही, फ्रिज, वॉशिंग मशीन आणि पहिल्या मजल्यावर चंद्रपूर अस्सल सागवान सोफा, स्टोरेज दिवाण व कपाट प्रदर्शन.
                </p>

                <div className="text-xs text-amber-300 font-medium flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>मातोश्री सभागृह समोर, आर्वी रोड, पंजाब कॉलनी, वर्धा - ४४२००१</span>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
                  <a
                    href="https://www.google.com/maps/search/?api=1&query=Shri+Sai+Enterprises+Matoshree+Sabhagruh+Arvi+Road+Punjab+Colony+Wardha+442001"
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl bg-[#ffd814] hover:bg-[#f7ca00] text-[#0f1111] font-black transition flex items-center gap-1.5 shadow-lg active:scale-95 cursor-pointer"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>गुगल मॅप्सवर दिशा पहा (Directions)</span>
                  </a>

                  <a
                    href="tel:8600122978"
                    className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold backdrop-blur-md border border-white/30 transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>कॉल करा: 8600122978</span>
                  </a>

                  <a
                    href={`https://wa.me/${landingConfig.contactInfo.whatsappNumber}?text=${encodeURIComponent('नमस्कार, मला शोरूमला भेट द्यायची आहे / चौकशी करायची आहे.')}`}
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

            {/* Right: Verified Customer Testimonials & Store Timings */}
            <div className="lg:col-span-5 rounded-2xl bg-[#141d2a] border border-slate-700/80 p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="font-black text-sm text-white flex items-center gap-1.5">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>समाधानी ग्राहकांचे अनुभव (Customer Reviews)</span>
                  </span>
                  <span className="text-[11px] font-bold text-amber-400">१००% खात्रीशीर</span>
                </div>

                {/* 3 Real Customer Testimonials */}
                <div className="space-y-2.5 mt-3">
                  <div className="p-3 rounded-xl bg-[#0e141f] border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white">अमोल देशमुख (वर्धा)</span>
                      <div className="flex text-amber-400 text-[10px]">★★★★★</div>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-snug">
                      "३०-महिन्यांच्या योजनेत दर आठवड्याला फक्त ₹१०० भरून दिवाळीला अस्सल सागवान सोफा मिळाला. लाकूड व फिनिशिंग १ नंबर आहे!"
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#0e141f] border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white">प्रदीप ठाकरे (आर्वी)</span>
                      <div className="flex text-amber-400 text-[10px]">★★★★★</div>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-snug">
                      "सॅमसंग ५५-इंच स्मार्ट टीव्ही नागपूरपेक्षा कमी भावात वर्ध्यात मिळाला. मोफत होम डिलिव्हरी व इन्स्टॉलेशन लगेच झाले."
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#0e141f] border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white">सौ. सुनीता वानखेडे (सेवाग्राम)</span>
                      <div className="flex text-amber-400 text-[10px]">★★★★★</div>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-snug">
                      "स्टोरेज बॉक्स दिवाण आणि स्टील कपाट अतिशय हेवी व मजबूत आहे. दुकानातील सर्व स्टाफचे बोलणे व मार्गदर्शन खूप आदरातिथ्यपूर्ण आहे."
                    </p>
                  </div>
                </div>
              </div>

              {/* Store Opening Hours & Direct Contact Bar */}
              <div className="pt-2 border-t border-slate-800 space-y-2.5 text-xs">
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#1a2536] border border-slate-700/60">
                  <Clock className="w-4 h-4 text-[#febd69] shrink-0" />
                  <div>
                    <span className="font-bold text-white block">वेळ (Opening Hours):</span>
                    <span className="text-slate-300 text-[11px]">
                      सोमवार ते रविवार: सकाळी ९:३० ते रात्री ९:३० (आठवड्याचे सातही दिवस खुले)
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <a
                    href={`tel:${landingConfig.contactInfo.helpline1 || '8766486915'}`}
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 font-bold text-center text-xs transition cursor-pointer"
                  >
                    📞 {landingConfig.contactInfo.helpline1 || '8766486915'}
                  </a>
                  <a
                    href={`tel:${landingConfig.contactInfo.helpline2 || '8600122978'}`}
                    className="flex-1 py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 font-bold text-center text-xs transition cursor-pointer"
                  >
                    📞 {landingConfig.contactInfo.helpline2 || '8600122978'}
                  </a>
                  <a
                    href={`tel:${landingConfig.contactInfo.helpline3 || '9175537365'}`}
                    className="flex-1 py-2 px-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 font-bold text-center text-xs transition cursor-pointer"
                  >
                    📞 {landingConfig.contactInfo.helpline3 || '9175537365'}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* ========================================================================================= */}
      {/* 12. RICH FOOTER WITH LOCAL WARDHA SEO KEYWORDS & COPYRIGHT                                */}
      {/* ========================================================================================= */}
      <footer className="bg-[#0b1019] text-white border-t border-[#1e2a3b] mt-8">
        <div className="max-w-[1500px] mx-auto px-3 sm:px-5 py-10 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            
            {/* Col 1: Brand & Logo */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <SaiLogo size="lg" glow={true} />
                <div>
                  <h4 className="font-black text-base text-white font-serif tracking-wide">SHREE SAI ENTERPRISES</h4>
                  <p className="text-[11px] text-[#febd69]">Electronics & Furniture Showroom, Wardha</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                वर्ध्यातील सर्वात विश्वासू व आघाडीचे फर्निचर आणि इलेक्ट्रॉनिक्स खरेदी केंद्र. ३० महिन्यांची साप्ताहिक बचत योजना व मासिक भाग्यशाली सोडत.
              </p>
              <div className="pt-1 text-xs text-slate-300 space-y-1">
                <p>📍 मातोश्री सभागृह समोर, आर्वी रोड, पंजाब कॉलनी, वर्धा - ४४२००१</p>
                <p className="text-[11px] text-slate-400 font-mono">(Opposite Matoshree Sabhagruh, Arvi Road, Punjab Colony)</p>
                <p className="text-amber-300 font-medium">📞 संपर्क: {landingConfig.contactInfo.helpline1 || '8766486915'} / {landingConfig.contactInfo.helpline2 || '8600122978'} / {landingConfig.contactInfo.helpline3 || '9175537365'}</p>
                <p>🌐 वेबसाइट: https://shrisaient.in</p>
              </div>
            </div>

            {/* Col 2: Electronics in Wardha */}
            <div className="space-y-2.5 text-xs">
              <h5 className="font-extrabold text-sm text-[#febd69] uppercase tracking-wider">
                Electronics in Wardha
              </h5>
              <ul className="space-y-1.5 text-slate-300">
                <li className="hover:text-amber-400 cursor-pointer" onClick={() => setSelectedCategory('Electronics')}>
                  • Smart 4K UHD LED TV (32" ते 65")
                </li>
                <li className="hover:text-amber-400 cursor-pointer" onClick={() => setSelectedCategory('Appliances')}>
                  • Inverter Double Door Refrigerators (LG, Whirlpool)
                </li>
                <li className="hover:text-amber-400 cursor-pointer" onClick={() => setSelectedCategory('Appliances')}>
                  • 5-Star Automatic Washing Machines
                </li>
                <li className="hover:text-amber-400 cursor-pointer" onClick={() => setSelectedCategory('Appliances')}>
                  • Air Coolers & Inverter Split AC
                </li>
                <li className="text-slate-400">• 0% Downpayment Easy EMI Finance</li>
              </ul>
            </div>

            {/* Col 3: Furniture in Wardha */}
            <div className="space-y-2.5 text-xs">
              <h5 className="font-extrabold text-sm text-[#febd69] uppercase tracking-wider">
                Furniture in Wardha
              </h5>
              <ul className="space-y-1.5 text-slate-300">
                <li className="hover:text-amber-400 cursor-pointer" onClick={() => setSelectedCategory('Furniture')}>
                  • चंद्रपूर अस्सल सागवान सोफा सेट (3+1+1)
                </li>
                <li className="hover:text-amber-400 cursor-pointer" onClick={() => setSelectedCategory('Diwan')}>
                  • हेवी स्टोरेज बॉक्स दिवाण (4x6 व 5x6)
                </li>
                <li className="hover:text-amber-400 cursor-pointer" onClick={() => setSelectedCategory('Diwan')}>
                  • शीशम लाकडी किंग व क्वीन कॉट
                </li>
                <li className="hover:text-amber-400 cursor-pointer" onClick={() => setSelectedCategory('Furniture')}>
                  • हेवी गेज स्टील कपाट व वॉर्डरोब
                </li>
                <li className="text-slate-400">• थेट फॅक्टरी होलसेल दर व ५ वर्षे वॉरंटी</li>
              </ul>
            </div>

            {/* Col 4: 30-Month Scheme & Quick Links */}
            <div className="space-y-2.5 text-xs">
              <h5 className="font-extrabold text-sm text-[#febd69] uppercase tracking-wider">
                30-Month Savings Scheme
              </h5>
              <p className="text-slate-400 leading-relaxed">
                दर आठवड्याला ₹१००/₹२०० बचत करून लकी ड्रॉ जिंका किंवा ३० महिन्यांनी पूर्ण हमीचे सामान घरी न्या.
              </p>
              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={() => {
                    const el = document.getElementById('passbook-portal-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full py-2 rounded-lg bg-[#232f3e] hover:bg-[#2e3e52] text-amber-300 font-bold border border-slate-700 transition cursor-pointer text-center"
                >
                  पासबुक तपासा (Check Passbook)
                </button>
                <button
                  onClick={() => setIsAdminPinModalOpen(true)}
                  className="w-full py-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-bold border border-amber-500/30 transition cursor-pointer text-center flex items-center justify-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>ERP पोर्टल (Staff & Admin)</span>
                </button>
                <button
                  onClick={() => {
                    if (onOpenAgentTerminal) onOpenAgentTerminal();
                    else setIsLocalAgentTerminalOpen(true);
                  }}
                  className="w-full py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-emerald-400 transition cursor-pointer text-center flex items-center justify-center gap-1.5 text-[11px]"
                >
                  <Smartphone className="w-3 h-3 text-emerald-500" />
                  <span>फील्ड एजंट टर्मिनल (Field Agent)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Copyright */}
          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
            <p>© {new Date().getFullYear()} Shri Sai Enterprises, Wardha. All rights reserved.</p>
            <div className="flex flex-wrap items-center gap-3">
              <p className="flex items-center gap-1">
                <span>अधिकृत वेबसाइट:</span>
                <a href="https://shrisaient.in" className="text-amber-400 font-bold hover:underline">
                  https://shrisaient.in
                </a>
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* 8. QUICK VIEW PRODUCT DETAIL MODAL */}
      {quickViewProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="w-full max-w-3xl rounded-2xl bg-[#171f2a] border border-[#ff9900]/40 text-white shadow-2xl overflow-hidden flex flex-col md:flex-row">
            
            {/* Image Showcase */}
            <div className="w-full md:w-1/2 p-6 bg-[#111721] flex items-center justify-center relative border-b md:border-b-0 md:border-r border-slate-800">
              <img
                src={getGenuineProductImage(quickViewProduct)}
                alt={quickViewProduct.name}
                className="max-h-72 w-full object-contain"
                referrerPolicy="no-referrer"
              />
              <span className="absolute top-4 left-4 px-2.5 py-0.5 rounded bg-[#131921] text-[#febd69] text-xs font-black uppercase border border-slate-700">
                {quickViewProduct.brand}
              </span>
            </div>

            {/* Details */}
            <div className="w-full md:w-1/2 p-6 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400">In Stock • Ready to Dispatch</span>
                  <button
                    onClick={() => setQuickViewProduct(null)}
                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <h3 className="text-lg font-bold text-white mt-1 leading-snug">
                  {quickViewProduct.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Model: {quickViewProduct.model || quickViewProduct.code} • Category: {quickViewProduct.category}
                </p>

                <div className="flex items-baseline gap-2 mt-3">
                  <span className="text-2xl font-black text-white tabular-nums">
                    ₹{quickViewProduct.salePrice.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-slate-400 line-through">
                    M.R.P.: ₹{quickViewProduct.mrp.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="mt-3 p-3 rounded-xl bg-[#111721] border border-slate-800 text-xs space-y-1.5">
                  <p className="text-slate-300 font-medium">
                    {quickViewProduct.description || 'Premium material, authentic showroom finishing and authorized warranty.'}
                  </p>
                  <p className="text-amber-300 font-bold">
                    💳 30-Month Weekly Savings Scheme: Only ₹100 to ₹200 / week!
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    🚚 Free Express Home Delivery in Wardha City & 50km Radius.
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => {
                    addToCart(quickViewProduct);
                    setQuickViewProduct(null);
                  }}
                  className="w-full py-2.5 bg-[#ffd814] hover:bg-[#f7ca00] text-[#0f1111] font-bold rounded-full text-xs flex items-center justify-center gap-1.5 shadow cursor-pointer border border-[#fcd200]"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Add to Cart</span>
                </button>

                <a
                  href={`https://wa.me/918766486915?text=${encodeURIComponent(
                    `Hello Shri Sai Enterprises, I want to order:\nProduct: ${quickViewProduct.name}\nPrice: ₹${quickViewProduct.salePrice.toLocaleString('en-IN')}`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2 bg-[#ffa41c] hover:bg-[#fa8900] text-[#0f1111] font-bold rounded-full text-xs flex items-center justify-center gap-1.5 shadow cursor-pointer border border-[#ff8f00]"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Order via WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9. CART DRAWER (AMAZON DARK THEME) */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md h-full flex flex-col bg-[#171f2a] text-white shadow-2xl border-l border-slate-800">
            {/* Header */}
            <div className="p-4 bg-[#131921] border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-[#febd69]" />
                <h3 className="font-extrabold text-sm">Your Shopping Cart ({cartItemCount})</h3>
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
                    className="px-4 py-2 bg-[#ffd814] text-[#0f1111] font-bold rounded-full text-xs cursor-pointer"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.stock.id}
                    className="p-3 rounded-xl border border-slate-700 bg-[#121820] flex items-center justify-between gap-3"
                  >
                    <img
                      src={getGenuineProductImage(item.stock)}
                      alt={item.stock.name}
                      className="w-14 h-14 object-contain bg-[#171f2a] p-1 rounded-lg shrink-0"
                      referrerPolicy="no-referrer"
                    />

                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs truncate text-white">{item.stock.name}</p>
                      <p className="text-[11px] text-[#febd69] font-bold tabular-nums">
                        ₹{item.stock.salePrice.toLocaleString('en-IN')} × {item.qty} = ₹
                        {(item.stock.salePrice * item.qty).toLocaleString('en-IN')}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => updateCartQty(item.stock.id, -1)}
                        className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold tabular-nums text-white">
                        {item.qty}
                      </span>
                      <button
                        onClick={() => updateCartQty(item.stock.id, 1)}
                        className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center cursor-pointer"
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
                  <label className="font-bold text-[11px] text-[#febd69] uppercase tracking-wider block">
                    Delivery & Contact Details:
                  </label>
                  <input
                    type="text"
                    placeholder="Your Full Name (e.g. Gajananrao Pawar)"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-700 bg-[#121820] text-white text-xs outline-none focus:ring-1 focus:ring-[#f90]"
                  />
                  <input
                    type="tel"
                    placeholder="Mobile Number (WhatsApp Enabled)"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-700 bg-[#121820] text-white text-xs outline-none focus:ring-1 focus:ring-[#f90]"
                  />
                  <textarea
                    placeholder="Delivery Address or Town/Village (e.g. Arvi Road, Wardha)"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    rows={2}
                    className="w-full p-2.5 rounded-lg border border-slate-700 bg-[#121820] text-white text-xs outline-none focus:ring-1 focus:ring-[#f90]"
                  />
                </div>
              )}
            </div>

            {/* Cart Footer */}
            {cart.length > 0 && (
              <div className="p-4 bg-[#131921] border-t border-slate-800 space-y-3">
                <div className="flex justify-between items-center text-sm font-bold">
                  <span className="text-slate-300">Subtotal:</span>
                  <span className="text-[#febd69] text-xl font-black tabular-nums">
                    ₹{cartTotalAmount.toLocaleString('en-IN')}
                  </span>
                </div>

                <button
                  onClick={handleCheckoutWhatsApp}
                  className="w-full py-3 bg-[#ffd814] hover:bg-[#f7ca00] text-[#0f1111] font-bold rounded-full text-xs flex items-center justify-center gap-2 shadow-lg transition cursor-pointer border border-[#fcd200]"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-800" />
                  <span>Proceed to Buy via WhatsApp</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 10. ONLINE PASSBOOK MODAL */}
      {isOpenPassbookModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-700 bg-[#171f2a] text-white flex flex-col max-h-[92vh] overflow-hidden">
            <div className="p-4 sm:p-5 bg-[#131921] border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-5 h-5 text-[#febd69]" />
                <h2 className="font-extrabold text-base">
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
              {/* Search Form */}
              <form onSubmit={handleSearchPassbook} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter Card No (e.g. 1001, 1050) or 10-digit Phone..."
                  value={passbookCardQuery}
                  onChange={(e) => setPassbookCardQuery(e.target.value)}
                  className="flex-1 p-2.5 rounded-xl border border-slate-700 bg-[#121820] text-white text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#f90]"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-[#ffd814] text-[#0f1111] font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Search</span>
                </button>
              </form>

              {passbookError && (
                <p className="text-rose-400 font-bold text-xs">{passbookError}</p>
              )}

              {/* Searched Member Passbook Display */}
              {searchedMember && (
                <div className="space-y-4 pt-2">
                  <div className="p-4 rounded-xl border border-slate-700 bg-[#121820] space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-black uppercase text-[#febd69]">
                          Card #{searchedMember.cardNo}
                        </span>
                        <h3 className="font-extrabold text-base text-white">
                          {searchedMember.memberName}
                        </h3>
                        <p className="text-slate-400 text-xs">
                          {searchedMember.address || searchedMember.village} • {searchedMember.phone}
                        </p>
                      </div>

                      <span className="px-2.5 py-1 rounded text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {searchedMember.status || 'Active'} Member
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-center">
                      <div className="p-2 rounded-xl bg-[#171f2a] border border-slate-700">
                        <span className="text-[10px] text-slate-400 block">Total Deposited</span>
                        <span className="font-black text-emerald-400 text-sm tabular-nums">
                          ₹{(searchedMember.totalAmountPaid ?? searchedMember.totalPaid ?? 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-[#171f2a] border border-slate-700">
                        <span className="text-[10px] text-slate-400 block">Weekly Installment</span>
                        <span className="font-black text-[#febd69] text-sm tabular-nums">
                          ₹{searchedMember.monthlyAmount || 100} / wk
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-[#171f2a] border border-slate-700">
                        <span className="text-[10px] text-slate-400 block">Tenure</span>
                        <span className="font-black text-sm text-white">
                          {searchedMember.durationMonths || 30} Months (130 Weeks)
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-[#171f2a] border border-slate-700">
                        <span className="text-[10px] text-slate-400 block">Lucky Draw Status</span>
                        <span className="font-black text-purple-400 text-sm">
                          {searchedMember.isLuckyDrawEligible !== false ? 'Eligible' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 11. SECURE ADMIN ERP LOGIN, SIGN UP & ADMIN APPROVALS MODAL */}
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

      {/* 12. AMAZON SIGNATURE DARK FOOTER */}
      <footer className="border-t border-[#232f3e] bg-[#131921] text-slate-300 text-xs">
        {/* Back to top button */}
        <button
          onClick={scrollToTop}
          className="w-full py-3.5 bg-[#232f3e] hover:bg-[#2c3a4d] text-slate-200 hover:text-white text-xs font-semibold text-center transition cursor-pointer flex items-center justify-center gap-1.5"
        >
          <ArrowUp className="w-3.5 h-3.5" />
          <span>Back to Top</span>
        </button>

        {/* Footer Link Columns */}
        <div className="max-w-[1500px] mx-auto px-5 py-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h4 className="font-bold text-white text-sm mb-3">About Shri Sai Enterprises</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Shri Sai Enterprises (Wardha) is the premier showroom for leading Electronics, Home Appliances, and authentic Chandrapur Teakwood Furniture.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white text-sm mb-3">30-Month Savings Scheme</h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li>• Weekly installment only ₹100 to ₹200</li>
              <li>• Monthly Grand Lucky Draw eligibility</li>
              <li>• Free product delivery if card wins in draw</li>
              <li>• Instant online digital passbook tracker</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white text-sm mb-3">Authorized Brands</h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li>• Samsung Crystal 4K UHD TVs</li>
              <li>• LG Smart Inverter Refrigerators</li>
              <li>• Voltas Split Inverter Air Conditioners</li>
              <li>• Whirlpool 5-Star Washing Machines</li>
              <li>• Sai Artisan Handcrafted Teakwood Sofas</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white text-sm mb-3">Contact & Store Location</h4>
            <p className="text-xs text-slate-400">
              Opposite Matoshree Sabhagruh, Arvi Road, Punjab Colony, Wardha - 442001
            </p>
            <div className="pt-2 space-y-1 text-xs">
              <p className="text-[#febd69] font-bold">
                📞 <a href="tel:8600122978" className="hover:underline">8600122978</a>
              </p>
              <p className="text-amber-300 font-bold">
                📞 <a href="tel:9175537365" className="hover:underline">9175537365</a>
              </p>
              <p className="text-blue-300 font-bold">
                📞 <a href="tel:8766486915" className="hover:underline">8766486915</a>
              </p>
            </div>
          </div>
        </div>

        {/* Copyright & Disclaimer Bar */}
        <div className="border-t border-[#232f3e] py-4 text-center text-[11px] text-slate-500">
          <p>© 2026 SHRI SAI ENTERPRISES, WARDHA • GSTIN: 27ALOPL0030G2ZC</p>
          <p className="text-[10px] text-slate-600 mt-0.5">
            All brand products carry manufacturer warranties with authentic tax invoices. All rights reserved.
          </p>
        </div>
      </footer>

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
