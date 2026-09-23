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
  Wind,
  LogOut,
  Star,
  ChevronDown,
  Menu,
  ArrowUp,
  ChevronLeft,
  Maximize2,
  Eye,
  Info,
  Package
} from 'lucide-react';
import {
  BusinessSettings,
  CardMember,
  CardTransaction,
  StockItem,
  TransactionEntry
} from '../types';
import { SCHEMES_CONFIG, DEFAULT_SHOWROOM_PRODUCTS } from '../utils/storage';
import { AppLogo } from './AppLogo';
import { PWAInstallModal } from './PWAInstallModal';
import { usePWAInstall } from '../utils/usePWAInstall';
import { ProductEditModal } from './ProductEditModal';
import { OrderBillModal, OrderBillData } from './OrderBillModal';
import { OrderTrackingModal } from './OrderTrackingModal';
import { ServicesAndTrustSection } from './ServicesAndTrustSection';
import { FloatingCallAndWhatsApp } from './FloatingCallAndWhatsApp';
import { useTheme } from '../context/ThemeContext';
import { ThemeToggle } from './ThemeToggle';
import { broadcastNewOrder } from '../utils/notifications';

const MARATHI_TO_ENGLISH_KEYWORDS: Record<string, string[]> = {
  'कुलर': ['cooler', 'air cooler', 'symphony', 'kenstar', 'crompton'],
  'कूलर': ['cooler', 'air cooler'],
  'फ्रीज': ['fridge', 'refrigerator', 'whirlpool', 'godrej', 'lg', 'samsung'],
  'रेफ्रिजरेटर': ['fridge', 'refrigerator'],
  'टीव्ही': ['tv', 'television', 'led', 'smart tv', 'smart', '4k'],
  'टेलिव्हिजन': ['tv', 'television'],
  'सोफा': ['sofa', 'couch', 'living room'],
  'पलंग': ['bed', 'cot', 'double bed', 'queen bed', 'king bed'],
  'कपाट': ['almirah', 'wardrobe', 'cupboard', 'अलमारी'],
  'अलमारी': ['almirah', 'wardrobe', 'cupboard'],
  'वॉशिंग': ['washing', 'machine'],
  'मशीन': ['machine', 'washing'],
  'टेबल': ['table', 'dining'],
  'डायनिंग': ['dining', 'table'],
  'पंखा': ['fan', 'ceiling fan'],
  'मिक्सर': ['mixer', 'grinder'],
};

export interface HeroSlide {
  id: string;
  badge: string;
  title: string;
  highlight: string;
  subtitle: string;
  imageUrl: string;
  primaryCta: string;
  primaryHref: string;
  categoryTarget: string;
  secondaryCta: string;
  secondaryHref: string;
  tag: string;
}

export const HERO_BANNER_SLIDES: HeroSlide[] = [
  {
    id: 'grand-fest',
    badge: 'Wardha Showroom Exclusive • Festival Mega Savings',
    title: 'Shri Sai Great Savings Festival',
    highlight: 'Up to 60% Off on Home Appliances & 100% Genuine Teak Furniture',
    subtitle: '30-Month Weekly Savings Scheme • 0% No-Cost EMI with 50% Down Payment • Free Express Home Delivery Across Wardha District.',
    imageUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1600&auto=format&fit=crop&q=80',
    primaryCta: 'Explore Showroom Deals',
    primaryHref: '#products-catalog',
    categoryTarget: 'all',
    secondaryCta: 'Weekly Scheme Details',
    secondaryHref: '#savings-schemes',
    tag: '✓ Sai Assured | Free Delivery',
  },
  {
    id: 'teak-wood',
    badge: '100% Seasoned Solid Teak Wood • Direct Factory Prices',
    title: 'Handcrafted Teak Furniture Studio',
    highlight: '7-Seater L-Shape Sofas, Hydraulic Storage Beds & Teak Dinings',
    subtitle: '5-Year Anti-Termite Warranty • High-Density 40 Comfort Foam • Custom Sizes Made by Master Artisans in Wardha.',
    imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1600&auto=format&fit=crop&q=80',
    primaryCta: 'Browse Teak Furniture',
    primaryHref: '#products-catalog',
    categoryTarget: 'Furniture',
    secondaryCta: 'Get Custom Quote (WhatsApp)',
    secondaryHref: 'https://wa.me/918766486915?text=' + encodeURIComponent('Hello Shri Sai Enterprises, I would like to inquire about Custom Teak Furniture.'),
    tag: '5-Yr Warranty | Custom Orders',
  },
  {
    id: 'passbook-card',
    badge: '30-Month Savings Scheme • 130 Weeks Guaranteed Rewards',
    title: '30-Month Weekly Savings Scheme',
    highlight: 'Deposit just ₹100, ₹150, or ₹200 every week',
    subtitle: '24/7 Digital Passbook Tracker • Weekly Lucky Draw Bumper Gifts • Guaranteed Premium Branded Appliance at Scheme Completion!',
    imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1600&auto=format&fit=crop&q=80',
    primaryCta: 'Check My Passbook',
    primaryHref: '#top',
    categoryTarget: 'passbook',
    secondaryCta: 'View Scheme Details',
    secondaryHref: '#savings-schemes',
    tag: 'Lucky Draw & Digital Passbook',
  },
  {
    id: 'summer-appliances',
    badge: 'Summer Cooling Range • 50% Down Payment EMI',
    title: 'Heavy-Duty Desert Coolers & Inverter Fridges',
    highlight: '75L Heavy-Duty Air Coolers & 5-Star Double Door Inverter Refrigerators',
    subtitle: '100% Copper Motors, Honeycomb Cooling Pads & 45ft Air Throw • Instant Approval on Bajaj & TVS Finance • 24hr Home Delivery.',
    imageUrl: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=1600&auto=format&fit=crop&q=80',
    primaryCta: 'Explore Coolers & Fridges',
    primaryHref: '#products-catalog',
    categoryTarget: 'Electronics',
    secondaryCta: '0% EMI Plans',
    secondaryHref: '#products-catalog',
    tag: '0% No-Cost EMI | Fast Delivery',
  },
  {
    id: 'cinema-tv',
    badge: 'Cinematic Experience • Official Brand Warranty',
    title: '4K Ultra HD Smart Google TVs',
    highlight: '32", 43", 55" Bezel-less Smart TVs with Dolby Audio & HDR10+',
    subtitle: 'Google TV OS, Voice Remote & Pre-installed OTT Apps • 2-Year Onsite Brand Warranty • Free Wall Mounting by Certified Technicians.',
    imageUrl: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=1600&auto=format&fit=crop&q=80',
    primaryCta: 'View Smart TVs',
    primaryHref: '#products-catalog',
    categoryTarget: 'Electronics',
    secondaryCta: 'Inquire on WhatsApp',
    secondaryHref: 'https://wa.me/918766486915?text=' + encodeURIComponent('Hello Shri Sai Enterprises, please share pricing and stock for 4K Smart TVs.'),
    tag: '2-Yr Warranty | Free Installation',
  },
];

interface CartItem {
  item: StockItem;
  quantity: number;
}

interface ShopLandingViewProps {
  settings: BusinessSettings;
  stock: StockItem[];
  cardMembers: CardMember[];
  cardTransactions: CardTransaction[];
  salesTransactions?: TransactionEntry[];
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
  salesTransactions = [],
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

  // Customer Account Isolation & Verification State (Customers only see their own account)
  const [customerCardInput, setCustomerCardInput] = useState(
    initialPassbookCardNo ? String(initialPassbookCardNo) : ''
  );
  const [customerPhoneInput, setCustomerPhoneInput] = useState('');
  const [searchError, setSearchError] = useState<string>('');
  const [selectedMember, setSelectedMember] = useState<CardMember | null>(null);
  const [isCustomerVerified, setIsCustomerVerified] = useState<boolean>(false);
  const [showFullPassbookModal, setShowFullPassbookModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showOrderTracking, setShowOrderTracking] = useState<boolean>(false);

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

  // Smart Search & 0% Finance States
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [financePlan, setFinancePlan] = useState<'full' | 'card_scheme_50' | 'bajaj' | 'tvs' | 'hdfc'>('full');
  const [selectedTenure, setSelectedTenure] = useState<number>(6);

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

  // Swipeable Hero Banner Carousel States
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);
  const touchStartXRef = React.useRef<number>(0);
  const mouseStartXRef = React.useRef<number | null>(null);

  // High-Res Original Product Photo & Specifications Modal State
  const [viewingProductImageModal, setViewingProductImageModal] = useState<StockItem | null>(null);
  const [isImageZoomed, setIsImageZoomed] = useState(false);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % HERO_BANNER_SLIDES.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + HERO_BANNER_SLIDES.length) % HERO_BANNER_SLIDES.length);
  };

  useEffect(() => {
    if (isCarouselPaused) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_BANNER_SLIDES.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [isCarouselPaused]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsCarouselPaused(true);
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsCarouselPaused(false);
    const diff = touchStartXRef.current - e.changedTouches[0].clientX;
    if (diff > 45) {
      nextSlide();
    } else if (diff < -45) {
      prevSlide();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsCarouselPaused(true);
    mouseStartXRef.current = e.clientX;
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (mouseStartXRef.current !== null) {
      const diff = mouseStartXRef.current - e.clientX;
      if (diff > 50) {
        nextSlide();
      } else if (diff < -50) {
        prevSlide();
      }
      mouseStartXRef.current = null;
    }
    setIsCarouselPaused(false);
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

  // Restore verified customer session from localStorage on mount (Customer Isolation)
  useEffect(() => {
    try {
      const savedCustomer = localStorage.getItem('shri_sai_verified_customer');
      if (savedCustomer) {
        const parsed = JSON.parse(savedCustomer);
        if (parsed?.cardNumber) {
          const match = cardMembers.find(
            (m) => m.cardNumber === Number(parsed.cardNumber)
          );
          if (match) {
            setSelectedMember(match);
            setIsCustomerVerified(true);
            setCustomerCardInput(String(match.cardNumber));
            if (match.phone) {
              setCustomerPhoneInput(match.phone.replace(/\D/g, '').slice(-4));
            }
          }
        }
      }
    } catch {
      // ignore
    }
  }, [cardMembers]);

  // If initialPassbookCardNo was passed in URL (e.g. from invoice / link)
  useEffect(() => {
    if (initialPassbookCardNo) {
      setCustomerCardInput(String(initialPassbookCardNo));
      const match = cardMembers.find(
        (m) => m.cardNumber === Number(initialPassbookCardNo)
      );
      if (match && isAdminLoggedIn) {
        // Staff/Admin can view directly
        setSelectedMember(match);
        setIsCustomerVerified(true);
        setShowFullPassbookModal(true);
      }
    }
  }, [initialPassbookCardNo, cardMembers, isAdminLoggedIn]);

  // SECURE CUSTOMER VERIFICATION HANDLER:
  // Customers MUST match their Card Number with their Registered Mobile Number to view their own account!
  const handleVerifyCustomerPassbook = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSearchError('');

    const cleanCard = customerCardInput.trim().replace(/\D/g, '');
    const cleanPhone = customerPhoneInput.trim().replace(/\D/g, '');

    if (!cleanCard) {
      setSearchError('कृपया आपला कार्ड क्रमांक प्रविष्ट करा (उदा. 1001)');
      return;
    }

    // Lookup card member
    const member = cardMembers.find(
      (m) => String(m.cardNumber) === cleanCard || String(m.id) === cleanCard
    );

    if (!member) {
      setSearchError(`कार्ड क्रमांक #${cleanCard} दुकानात नोंदणीकृत नाही. कृपया कार्ड नंबर तपासा.`);
      return;
    }

    // If Admin/Staff is logged in, allow instant admin inspection
    if (isAdminLoggedIn) {
      setSelectedMember(member);
      setIsCustomerVerified(true);
      setShowFullPassbookModal(true);
      return;
    }

    // For public visitors/customers: STRICT REGISTERED MOBILE VERIFICATION
    if (!cleanPhone) {
      setSearchError('सुरक्षा पडताळणी: कृपया कार्डशी जोडलेला आपला नोंदणीकृत मोबाईल नंबर (किंवा शेवटचे ४ अंक) टाका.');
      return;
    }

    const memPhone = (member.phone || '').replace(/\D/g, '');
    const isPhoneMatched =
      (memPhone && cleanPhone.length >= 4 && (memPhone.endsWith(cleanPhone) || cleanPhone.endsWith(memPhone))) ||
      (memPhone && cleanPhone === memPhone);

    if (!isPhoneMatched) {
      setSearchError(
        'सुरक्षा पडताळणी अयशस्वी: हा मोबाईल नंबर या कार्डशी जुळत नाही! ग्राहकांच्या गोपनीयतेसाठी केवळ अधिकृत कार्ड धारकच स्वतःचे पासबुक पाहू शकतात.'
      );
      return;
    }

    // Success: Customer identity is verified. They can now view ONLY their own account!
    setSelectedMember(member);
    setIsCustomerVerified(true);
    setShowFullPassbookModal(true);
    try {
      localStorage.setItem(
        'shri_sai_verified_customer',
        JSON.stringify({ cardNumber: member.cardNumber, verifiedAt: new Date().toISOString() })
      );
    } catch {
      // ignore
    }
  };

  // Close / Logout Customer Passbook Session
  const handleLogoutCustomer = () => {
    setSelectedMember(null);
    setIsCustomerVerified(false);
    setShowFullPassbookModal(false);
    setCustomerCardInput('');
    setCustomerPhoneInput('');
    setSearchError('');
    try {
      localStorage.removeItem('shri_sai_verified_customer');
    } catch {
      // ignore
    }
  };

  // Effective showroom products (combines database stock with default authentic showroom products)
  const effectiveStock = useMemo(() => {
    if (stock && stock.length > 0) {
      return stock.map((s) => {
        if (!s.imageUrl) {
          const match = DEFAULT_SHOWROOM_PRODUCTS.find(
            (d) => d.category.toLowerCase() === (s.category || '').toLowerCase()
          );
          if (match) {
            return { ...s, imageUrl: match.imageUrl };
          }
        }
        return s;
      });
    }
    return DEFAULT_SHOWROOM_PRODUCTS;
  }, [stock]);

  // Categories extracted from effective stock
  const categories = useMemo(() => {
    const cats = new Set<string>();
    effectiveStock.forEach((item) => cats.add(item.category || 'General'));
    return ['all', ...Array.from(cats)];
  }, [effectiveStock]);

  // Instant Card Number or Mobile Number Detection
  const detectedMemberForSearch = useMemo(() => {
    const trimmed = productSearchQuery.trim().replace(/#/g, '');
    if (!trimmed) return null;
    if (/^\d{3,4}$/.test(trimmed)) {
      return cardMembers.find((m) => String(m.cardNumber) === trimmed) || null;
    }
    if (/^\d{10}$/.test(trimmed)) {
      return cardMembers.find((m) => (m.phone || '').replace(/\D/g, '').endsWith(trimmed)) || null;
    }
    return null;
  }, [productSearchQuery, cardMembers]);

  // Filtered stock items with Marathi + English bilingual search
  const filteredStock = useMemo(() => {
    let list = effectiveStock;
    if (selectedCategory !== 'all') {
      list = list.filter((item) => item.category === selectedCategory);
    }

    const query = productSearchQuery.trim().toLowerCase();
    if (!query) return list;

    // Split search query into terms
    const terms = query.split(/\s+/).filter(Boolean);

    return list.filter((item) => {
      const itemName = (item.name || '').toLowerCase();
      const itemCat = (item.category || '').toLowerCase();
      const itemCode = (item.code || '').toLowerCase();
      const itemBrand = (item.brand || '').toLowerCase();
      const itemDesc = (item.description || '').toLowerCase();
      const fullText = `${itemName} ${itemCat} ${itemCode} ${itemBrand} ${itemDesc}`;

      return terms.every((term) => {
        if (fullText.includes(term)) return true;

        for (const [marathiWord, englishEquivs] of Object.entries(MARATHI_TO_ENGLISH_KEYWORDS)) {
          if (term.includes(marathiWord) || marathiWord.includes(term)) {
            if (englishEquivs.some((eq) => fullText.includes(eq))) {
              return true;
            }
          }
        }
        return false;
      });
    });
  }, [effectiveStock, selectedCategory, productSearchQuery]);

  // Transactions for selected passbook member (combines direct card collections + store sales/goods taken)
  const memberTransactions = useMemo(() => {
    if (!selectedMember) return [];
    const directCardTx = cardTransactions
      .filter(
        (t) =>
          Number(t.cardNumber) === Number(selectedMember.cardNumber) &&
          t.schemeId === selectedMember.schemeId
      );

    const normName = (selectedMember.customerName || '').trim().toLowerCase();
    const memberPhone = (selectedMember.phone || '').trim().replace(/\D/g, '');
    const memberCardNum = Number(selectedMember.cardNumber);

    const linkedSales = (salesTransactions || []).filter((s) => {
      if (s.cardNumber && Number(s.cardNumber) === memberCardNum) return true;
      if (s.customerName) {
        const sName = s.customerName.trim().toLowerCase();
        if (sName === normName) return true;
        const memberWords = normName.split(/\s+/).filter(Boolean);
        const saleWords = sName.split(/\s+/).filter(Boolean);
        if (memberWords.length >= 2 && memberWords.every((w) => sName.includes(w))) return true;
        if (saleWords.length >= 2 && saleWords.every((w) => normName.includes(w))) return true;
      }
      if (memberPhone && memberPhone.length >= 8 && s.customerPhone) {
        const sPhone = s.customerPhone.trim().replace(/\D/g, '');
        if (sPhone.includes(memberPhone) || memberPhone.includes(sPhone)) return true;
      }
      return false;
    });

    const synthesizedGoodsTx: CardTransaction[] = [];
    linkedSales.forEach((sale) => {
      const alreadyInCardTx = directCardTx.some(
        (ctx) =>
          ctx.receiptNo === sale.invoiceNo ||
          (ctx.type === 'GoodsTaken' && ctx.date === sale.date && ctx.amount === sale.totalAmount)
      );

      if (!alreadyInCardTx) {
        const itemDesc =
          sale.itemDetails ||
          (sale.itemsDetail && sale.itemsDetail.length > 0
            ? sale.itemsDetail.map((i) => `${i.productName || 'वस्तू'} x${i.quantity || 1}`).join(', ')
            : 'गृहोपयोगी वस्तू / साहित्य');

        synthesizedGoodsTx.push({
          id: `sale-goods-${sale.id}`,
          cardId: selectedMember.id,
          cardNumber: selectedMember.cardNumber,
          schemeId: selectedMember.schemeId,
          customerName: selectedMember.customerName,
          customerPhone: selectedMember.phone || sale.customerPhone,
          receiptNo: sale.invoiceNo || `BILL-${sale.id.slice(-6)}`,
          date: sale.date,
          type: 'GoodsTaken',
          amount: sale.totalAmount || 0,
          paymentMode: sale.paymentMode || 'Cash',
          agentName: sale.agentName || selectedMember.agentName || 'Store Billing',
          remarks: `वस्तू उचल / विक्री बिल: ${itemDesc} (बिल #${sale.invoiceNo})`,
          goodsDetail: itemDesc,
          balanceAfter: 0,
          createdAt: sale.createdAt || sale.date,
        });
      }
    });

    return [...directCardTx, ...synthesizedGoodsTx].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [selectedMember, cardTransactions, salesTransactions]);

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

    const minDownPayment = Math.round(cartGrandTotal * 0.5);
    const remainingFiftyPercent = cartGrandTotal - minDownPayment;

    const financeLabel =
      financePlan === 'full'
        ? 'Full Payment (Cash / UPI on Delivery)'
        : financePlan === 'card_scheme_50'
        ? `30-Month Savings Scheme (50% Down Payment: ₹${minDownPayment.toLocaleString()})`
        : financePlan === 'bajaj'
        ? `Bajaj Finserv 0% EMI (50% DP: ₹${minDownPayment.toLocaleString()}, ${selectedTenure}M EMI)`
        : financePlan === 'tvs'
        ? `TVS Credit 0% EMI (50% DP: ₹${minDownPayment.toLocaleString()}, ${selectedTenure}M EMI)`
        : `HDFC Easy EMI (50% DP: ₹${minDownPayment.toLocaleString()}, ${selectedTenure}M EMI)`;

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
      notes: orderNotes ? `${orderNotes.trim()} | ${financeLabel}` : financeLabel,
    };

    const detailedItems = cart.map((ci, index) => ({
      id: `cart-item-${Date.now()}-${index}`,
      stockItemId: ci.item.id,
      productName: ci.item.name,
      modelNumber: ci.item.modelNumber || ci.item.name,
      serialNumber: '', // Assigned by shop admin upon order confirmation
      quantity: ci.quantity,
      unitPrice: ci.item.sellingPrice,
      total: ci.item.sellingPrice * ci.quantity,
    }));

    if (onRecordOrder) {
      const summary = cart.map((ci) => `${ci.item.name} (${ci.quantity})`).join(', ');
      onRecordOrder({
        invoiceNo: invNo,
        date: today,
        customerName: billData.customerName,
        customerPhone: billData.customerPhone,
        village: customerAddress.trim() || 'Wardha',
        totalAmount: cartGrandTotal,
        payingNow: financePlan !== 'full' ? minDownPayment : 0,
        dueAmount: financePlan !== 'full' ? remainingFiftyPercent : cartGrandTotal,
        paymentMode: financePlan === 'full' ? 'Cash on Delivery' : '50% Down Payment / Finance',
        itemDetails: `Online Cart Order: ${summary} [${financeLabel}]`,
        itemsDetail: detailedItems,
        orderStatus: 'pending',
        source: 'online_cart',
        deliveryType,
        deliveryFee: currentDeliveryFee,
        deliveryAddress: customerAddress.trim() || 'Wardha',
        notes: orderNotes ? `${orderNotes.trim()} | ${financeLabel}` : financeLabel,
      });
    }

    // Trigger Real-Time Notification Chime and Floating ERP Banner
    broadcastNewOrder({
      id: invNo,
      invoiceNo: invNo,
      customerName: billData.customerName,
      customerPhone: billData.customerPhone || 'Not provided',
      customerAddress: billData.customerAddress,
      totalAmount: cartGrandTotal,
      downPayment: financePlan !== 'full' ? minDownPayment : undefined,
      paymentMode: financePlan === 'full' ? 'Cash on Delivery' : '50% Down Payment / Finance',
      financePlan: financePlan !== 'full' ? financeLabel : undefined,
      itemSummary: cart.map((ci) => `${ci.item.name} (${ci.quantity})`).join(', '),
      itemsDetail: detailedItems,
      orderStatus: 'pending',
      timestamp: Date.now(),
    });

    setActiveOrderBill(billData);
    setShowOrderBillModal(true);
    setCart([]);
    setIsCartOpen(false);
  };

  // WhatsApp Order Submission
  const handlePlaceOrderWhatsApp = (targetPhone = '8766486915') => {
    if (cart.length === 0) return;
    const minDownPayment = Math.round(cartGrandTotal * 0.5);
    const remainingFiftyPercent = cartGrandTotal - minDownPayment;

    const itemsList = cart
      .map(
        (ci, idx) =>
          `${idx + 1}. *${ci.item.name}* (Qty: ${ci.quantity}) - ₹${(
            ci.item.sellingPrice * ci.quantity
          ).toLocaleString()}`
      )
      .join('\n');

    const financeInfo =
      financePlan === 'full'
        ? `*पेमेंट पर्याय:* पूर्ण रोख / यूपीआय (Cash on Delivery)\n`
        : financePlan === 'card_scheme_50'
        ? `*पेमेंट पर्याय:* श्री साई ३०-महिने बचत कार्ड खरेदी (५०% डाऊन पेमेंट नियम)\n` +
          `*किमान ५०% डाऊन पेमेंट:* ₹${minDownPayment.toLocaleString()}\n` +
          `*उर्वरित ५०% रक्कम:* ₹${remainingFiftyPercent.toLocaleString()} (कालावधी: ${selectedTenure} महिने)\n`
        : `*फायनान्स पर्याय:* ${
            financePlan === 'bajaj'
              ? 'बजाज फायनान्स ०% ईएमआय (Bajaj Finserv No Cost EMI)'
              : financePlan === 'tvs'
              ? 'टीव्हीएस क्रेडिट ०% ईएमआय (TVS Credit No Cost EMI)'
              : 'एचडीएफसी बँक ईझी ईएमआय (HDFC Easy EMI)'
          }\n` +
          `*किमान ५०% डाऊन पेमेंट:* ₹${minDownPayment.toLocaleString()}\n` +
          `*उर्वरित ५०% ईएमआय रक्कम:* ₹${remainingFiftyPercent.toLocaleString()}\n` +
          `*ईएमआय हप्ता:* अंदाजे ₹${Math.round(remainingFiftyPercent / selectedTenure).toLocaleString()}/महिना (${selectedTenure} महिने)\n` +
          `*आवश्यक कागदपत्रे (मंजुरीसाठी):* आधार कार्ड, पॅन कार्ड, बँक पासबुक, २ फोटो\n`;

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
      `*Total Value:* ₹${cartGrandTotal.toLocaleString()}\n` +
      financeInfo +
      (orderNotes ? `*Note:* ${orderNotes}\n` : '') +
      `--------------------------------\n` +
      `*अधिकृत व्हॉट्सॲप ग्रुप:* ${settings.whatsappGroupLink || 'https://chat.whatsapp.com/CLcaeUq1bHH1RE0203oPaP?s=cl&p=a&mlu=4&ilr=4'}\n` +
      `Please confirm booking and delivery details. Thank you!`
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
      `Showroom: मातोश्री सभागृह समोर, आर्वी रोड, पंजाब कॉलनी, वर्धा - ४४२००१\n` +
      `अधिकृत व्हॉट्सॲप ग्रुप: ${settings.whatsappGroupLink || 'https://chat.whatsapp.com/CLcaeUq1bHH1RE0203oPaP?s=cl&p=a&mlu=4&ilr=4'}\n` +
      `WhatsApp: 8766486915 / 8600122798`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#eaeded] text-slate-900 flex flex-col font-sans selection:bg-[#ff9900] selection:text-slate-950 transition-colors duration-200">
      {/* Top Notification Bar */}
      <div className="bg-[#0f1111] text-slate-300 px-3 sm:px-4 py-1.5 text-xs text-center border-b border-white/10 flex items-center justify-center gap-2 sm:gap-4 no-print flex-wrap">
        <div className="flex items-center gap-1.5 font-medium text-amber-400">
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span>Shri Sai Enterprises Wardha • 30-Month Weekly Savings Scheme & 0% Finance Available</span>
        </div>
        <span className="hidden sm:inline text-white/30">|</span>
        <span className="hidden sm:inline text-slate-400 font-mono text-[11px]">
          GSTIN: <strong className="text-slate-200">27ALOPL0030G2ZC</strong>
        </span>
        <span className="hidden sm:inline text-white/30">|</span>
        <a href="tel:8766486915" className="hidden sm:flex items-center gap-1 text-slate-300 hover:text-white transition">
          <Phone className="w-3 h-3 text-[#febd69]" />
          <span>Helpline: 8766486915 / 8600122798</span>
        </a>
      </div>

      {/* Main Amazon Signature Header (#131921) */}
      <header className="sticky top-0 z-40 bg-[#131921] text-white shadow-md no-print">
        <div className="max-w-7xl mx-auto px-2.5 sm:px-4 py-2 sm:py-2.5">
          {/* Main Top Row */}
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            {/* Official Inside ERP AppLogo */}
            <a
              href="#top"
              className="flex items-center px-1.5 py-1 rounded-sm hover:outline-1 hover:outline-white transition shrink-0 group"
              title="Shri Sai Enterprises Wardha"
            >
              <AppLogo size="sm" variant="horizontal" theme="dark" showSubtitle={true} />
            </a>

            {/* Deliver to Wardha Pill (Desktop only) */}
            <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-xs hover:outline-1 hover:outline-white text-left cursor-pointer shrink-0">
              <MapPin className="w-4 h-4 text-white mt-1 shrink-0" />
              <div className="text-[11px] leading-tight">
                <span className="text-slate-300 block text-[10px]">Deliver to Wardha 442001</span>
                <span className="font-bold text-white block truncate max-w-[140px]">
                  Opp. Matoshree Hall
                </span>
              </div>
            </div>

            {/* Amazon Full-Width Search Bar (Desktop View: Inline Centered) */}
            <div className="hidden sm:block flex-1 max-w-2xl mx-1 sm:mx-2">
              <div className="flex items-center rounded-md bg-white overflow-hidden shadow-xs focus-within:ring-2 focus-within:ring-[#ff9900]">
                {/* Category Dropdown Pill */}
                <div
                  onClick={() => {
                    const nextCat = selectedCategory === 'all' ? 'Furniture' : selectedCategory === 'Furniture' ? 'Electronics' : 'all';
                    setSelectedCategory(nextCat);
                  }}
                  className="flex items-center gap-1 bg-[#e6e6e6] hover:bg-[#d4d4d4] text-slate-800 text-xs font-medium px-3 py-2 border-r border-slate-300 cursor-pointer select-none shrink-0"
                  title="Filter Category"
                >
                  <span>{selectedCategory === 'all' ? 'All' : selectedCategory}</span>
                  <ChevronDown className="w-3 h-3 text-slate-600" />
                </div>

                {/* Search Input */}
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={productSearchQuery}
                    onChange={(e) => setProductSearchQuery(e.target.value)}
                    placeholder="Search electronics, TVs, coolers, fridges, teak furniture or enter Card/Mobile No..."
                    className="w-full pl-3 pr-8 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none bg-white"
                  />
                  {productSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setProductSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Amazon Amber Search Button */}
                <button
                  type="button"
                  className="bg-[#febd69] hover:bg-[#f3a847] px-4 py-2.5 text-slate-950 transition flex items-center justify-center cursor-pointer shrink-0"
                  title="Search"
                >
                  <Search className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* Right Header Navigation Items */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Field Staff Counter Button */}
              {onOpenFieldActions && (
                <button
                  onClick={onOpenFieldActions}
                  className="hidden xl:flex items-center gap-1 px-2.5 py-1.5 rounded-xs bg-[#232f3e] hover:bg-[#2c3b4e] border border-amber-500/40 text-amber-300 text-xs font-medium cursor-pointer"
                  title="Field Staff Counter"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span>Staff Counter</span>
                </button>
              )}

              {/* Account & Lists / Staff Portal Button */}
              <button
                onClick={onOpenLoginModal}
                className="flex flex-col px-2 py-1 rounded-xs hover:outline-1 hover:outline-white text-left cursor-pointer transition"
                title="Staff or Admin Login"
              >
                <span className="text-[9px] sm:text-[10px] text-slate-300 leading-none">Hello, Sign In</span>
                <span className="text-[11px] sm:text-xs font-bold text-white flex items-center gap-0.5 leading-tight">
                  <span className="hidden sm:inline">Staff & </span>Admin <ChevronDown className="w-3 h-3 text-slate-400" />
                </span>
              </button>

              {/* Live Order Tracking Quick Trigger */}
              <button
                type="button"
                onClick={() => setShowOrderTracking(true)}
                className="hidden sm:flex flex-col px-2 py-1 rounded-xs hover:outline-1 hover:outline-white text-left cursor-pointer transition text-white"
                title="लाईव्ह ऑर्डर ट्रॅकिंग (Live Order Status)"
              >
                <span className="text-[10px] text-slate-300 leading-none">Returns &</span>
                <span className="text-xs font-bold text-white leading-tight flex items-center gap-1">
                  <Package className="w-3.5 h-3.5 text-amber-400" />
                  <span>ऑर्डर ट्रॅकिंग</span>
                </span>
              </button>

              {/* Amazon Shopping Cart */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xs hover:outline-1 hover:outline-white text-white cursor-pointer transition"
                title="Open Shopping Cart"
              >
                <div className="relative">
                  <ShoppingCart className="w-6 h-6 sm:w-8 sm:h-8 text-white stroke-[1.8]" />
                  <span className="absolute -top-1.5 left-3 sm:left-3.5 bg-[#f08804] text-slate-950 font-bold text-[10px] sm:text-[11px] px-1.5 py-0.2 rounded-full min-w-[18px] text-center shadow-xs">
                    {cartItemsCount}
                  </span>
                </div>
                <div className="hidden sm:flex flex-col text-left leading-tight">
                  <span className="text-[10px] text-slate-300">Cart</span>
                  <span className="text-xs font-bold text-white font-mono">
                    ₹{cartGrandTotal.toLocaleString()}
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Mobile-Only Dedicated Search Bar (Row 2 - Full Width, Beautiful & Uncramped) */}
          <div className="sm:hidden mt-2">
            <div className="flex items-center rounded-lg bg-white overflow-hidden shadow-xs focus-within:ring-2 focus-within:ring-[#ff9900]">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={productSearchQuery}
                  onChange={(e) => setProductSearchQuery(e.target.value)}
                  placeholder="Search products or card no. (e.g. TV, Fridge, Sofa)..."
                  className="w-full pl-3 pr-8 py-2 text-xs text-slate-900 placeholder:text-slate-500 focus:outline-none bg-white"
                />
                {productSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setProductSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <button
                type="button"
                className="bg-[#febd69] hover:bg-[#f3a847] px-3.5 py-2 text-slate-950 transition flex items-center justify-center cursor-pointer shrink-0"
                title="Search"
              >
                <Search className="w-4 h-4 text-slate-950 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>

        {/* Instant Auto-Detect Card Banner (Inside Amazon Header Ribbon) */}
        {detectedMemberForSearch && (
          <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 border-t border-emerald-600/50 text-white px-3 sm:px-4 py-2 text-xs flex items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center gap-2 min-w-0">
              <CreditCard className="w-4 h-4 text-emerald-300 shrink-0" />
              <span className="truncate">
                <strong className="text-amber-300">💳 Card #{detectedMemberForSearch.cardNumber} Found:</strong>{' '}
                {detectedMemberForSearch.customerName} ({detectedMemberForSearch.schemeName})
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setCustomerCardInput(String(detectedMemberForSearch.cardNumber));
                setCustomerPhoneInput(detectedMemberForSearch.phone?.slice(-4) || '');
                setSelectedMember(detectedMemberForSearch);
                setIsCustomerVerified(true);
                setShowFullPassbookModal(true);
              }}
              className="px-3.5 py-1 bg-[#ffd814] hover:bg-[#f7ca00] text-slate-950 font-bold rounded-full text-xs transition cursor-pointer shrink-0 shadow-xs"
            >
              Open My Passbook →
            </button>
          </div>
        )}

        {/* Amazon Subnav Bar (#232f3e) */}
        <div className="bg-[#232f3e] text-white text-xs px-2 sm:px-4 py-1.5 flex items-center justify-between overflow-x-auto no-scrollbar gap-4">
          <div className="flex items-center gap-3 sm:gap-5 shrink-0 font-medium">
            <button
              onClick={() => {
                setSelectedCategory('all');
                setProductSearchQuery('');
              }}
              className="flex items-center gap-1.5 text-white hover:text-[#febd69] transition py-0.5 cursor-pointer font-bold"
            >
              <Menu className="w-4 h-4" />
              <span>All Categories</span>
            </button>
            <a href="#savings-schemes" className="text-white hover:text-[#febd69] transition whitespace-nowrap">
              💳 30-Month Weekly Passbook
            </a>
            <a
              href="#products-catalog"
              onClick={() => {
                setSelectedCategory('all');
                setProductSearchQuery('');
              }}
              className="text-white hover:text-[#febd69] transition whitespace-nowrap"
            >
              ⚡ Today's Deals
            </a>
            <a
              href="#products-catalog"
              onClick={() => {
                setSelectedCategory('Electronics');
                setProductSearchQuery('');
              }}
              className="text-white hover:text-[#febd69] transition whitespace-nowrap"
            >
              📺 Electronics & 4K TVs
            </a>
            <a
              href="#products-catalog"
              onClick={() => {
                setSelectedCategory('Furniture');
                setProductSearchQuery('');
              }}
              className="text-white hover:text-[#febd69] transition whitespace-nowrap"
            >
              🛋️ Solid Teak Furniture
            </a>
            <a href="#products-catalog" className="text-white hover:text-[#febd69] transition whitespace-nowrap">
              🏷️ 0% No-Cost EMI (50% Down)
            </a>
            <a href="tel:8766486915" className="text-white hover:text-[#febd69] transition whitespace-nowrap">
              📞 Care: 8766486915
            </a>
          </div>

          <div className="hidden lg:flex items-center gap-2 text-[11px] font-bold text-[#febd69] shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#00a8e1]" />
            <span className="text-[#00a8e1]">✓ Sai Assured</span>
            <span className="text-slate-300 font-normal">| Free Home Delivery</span>
          </div>
        </div>

        {/* High-Impact English Announcement Banner requested by user */}
        <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 px-3 sm:px-4 py-2 border-t border-amber-600/30 flex items-center justify-between text-xs sm:text-sm font-semibold shadow-inner">
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full justify-between flex-wrap">
            <div className="flex items-center gap-2">
              <span className="bg-slate-950 text-amber-300 text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wide shrink-0">
                LATEST UPDATE
              </span>
              <span className="font-bold text-slate-950">
                Shri Sai Enterprises: 30-Month Weekly Savings Scheme enrollment open • Free delivery across Wardha district!
              </span>
            </div>
            <a
              href="#savings-schemes"
              className="inline-flex items-center gap-1 bg-slate-950 hover:bg-slate-900 text-amber-300 text-[11px] font-bold px-3 py-1 rounded-full transition shadow-xs shrink-0"
            >
              <span>Enroll In Scheme</span>
              <ArrowRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 space-y-16">
        {/* AMAZON HERO BANNER & 4-BOX BENTO FEATURE GRID */}
        <section id="top" className="relative bg-gradient-to-b from-[#232f3e] via-[#37475a] to-[#eaeded] pt-4 sm:pt-6 pb-8 px-3 sm:px-6">
          <div className="max-w-7xl mx-auto space-y-5">
            {/* AMAZON SWIPEABLE HERO BANNER CAROUSEL */}
            <div
              className="relative rounded-xl overflow-hidden shadow-2xl border border-white/20 select-none group/hero"
              onMouseEnter={() => setIsCarouselPaused(true)}
              onMouseLeave={() => {
                mouseStartXRef.current = null;
                setIsCarouselPaused(false);
              }}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
            >
              {/* Carousel Track */}
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {HERO_BANNER_SLIDES.map((slide, idx) => (
                  <div
                    key={slide.id}
                    className="w-full shrink-0 relative min-h-[280px] sm:min-h-[380px] md:min-h-[430px] flex items-center"
                  >
                    {/* Background Image with Referrer Policy */}
                    <img
                      src={slide.imageUrl}
                      alt={slide.title}
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 w-full h-full object-cover"
                      loading={idx === 0 ? 'eager' : 'lazy'}
                    />
                    {/* Deep Amazon-style gradient overlays for pristine readability */}
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0b1017] via-[#0b1017]/90 to-[#0b1017]/40 sm:to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0b1017]/90 via-transparent to-black/30" />

                    {/* Content Box */}
                    <div className="relative z-10 max-w-2xl px-4 py-5 sm:p-8 md:p-10 space-y-2 sm:space-y-3.5 text-white">
                      <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-[#febd69]/20 text-[#febd69] border border-[#febd69]/40 text-[10px] sm:text-xs font-bold tracking-wide backdrop-blur-xs">
                        <Award className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-[#febd69]" />
                        <span>{slide.badge}</span>
                      </div>

                      <h1 className="text-xl sm:text-3xl md:text-5xl font-black text-white tracking-tight leading-snug drop-shadow-sm">
                        {slide.title}
                      </h1>

                      <p className="text-xs sm:text-base font-bold text-[#febd69] leading-snug">
                        {slide.highlight}
                      </p>

                      <p className="text-[11px] sm:text-sm text-slate-200 leading-relaxed max-w-xl line-clamp-2 sm:line-clamp-none">
                        {slide.subtitle}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-1 sm:pt-2">
                        <a
                          href={slide.primaryHref}
                          onClick={() => {
                            if (slide.categoryTarget === 'all') {
                              setSelectedCategory('all');
                              setProductSearchQuery('');
                            } else if (slide.categoryTarget === 'passbook') {
                              const passbookEl = document.getElementById('passbook-section');
                              if (passbookEl) passbookEl.scrollIntoView({ behavior: 'smooth' });
                            } else if (slide.categoryTarget) {
                              setSelectedCategory(slide.categoryTarget);
                              setProductSearchQuery('');
                            }
                          }}
                          className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-[#ffd814] hover:bg-[#f7ca00] text-slate-950 font-bold text-xs shadow-md transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                        >
                          <span>{slide.primaryCta}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </a>

                        <a
                          href={slide.secondaryHref}
                          target={slide.secondaryHref.startsWith('http') ? '_blank' : '_self'}
                          rel="noreferrer"
                          className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-full bg-white/15 hover:bg-white/25 text-white font-semibold text-xs border border-white/30 backdrop-blur-xs transition cursor-pointer flex items-center gap-1.5"
                        >
                          <span>{slide.secondaryCta}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-[#febd69]" />
                        </a>

                        <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-950/70 px-2.5 py-1 rounded-full border border-emerald-500/40 backdrop-blur-xs">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{slide.tag}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Left Arrow Button (Desktop Only - Mobile Swipes Cleanly with Touch) */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  prevSlide();
                }}
                aria-label="मागील बॅनर (Previous Slide)"
                className="hidden sm:flex absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/80 hover:bg-white text-slate-900 shadow-xl items-center justify-center transition active:scale-95 cursor-pointer backdrop-blur-xs border border-white/60"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
              </button>

              {/* Right Arrow Button (Desktop Only - Mobile Swipes Cleanly with Touch) */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  nextSlide();
                }}
                aria-label="पुढील बॅनर (Next Slide)"
                className="hidden sm:flex absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/80 hover:bg-white text-slate-900 shadow-xl items-center justify-center transition active:scale-95 cursor-pointer backdrop-blur-xs border border-white/60"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
              </button>

              {/* Bottom Pagination Dots & Swipe Indicator */}
              <div className="absolute bottom-3 sm:bottom-4 left-0 right-0 z-20 flex items-center justify-center gap-2">
                <div className="bg-black/60 backdrop-blur-xs px-3.5 py-1.5 rounded-full flex items-center gap-2 border border-white/15 shadow-md">
                  {HERO_BANNER_SLIDES.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlide(idx)}
                      aria-label={`Slide ${idx + 1}`}
                      className={`transition-all duration-300 rounded-full cursor-pointer ${
                        idx === currentSlide
                          ? 'w-7 sm:w-9 h-2 bg-[#ffd814] shadow-xs'
                          : 'w-2 h-2 bg-white/50 hover:bg-white/90'
                      }`}
                    />
                  ))}
                  <span className="text-[10px] text-slate-300 ml-1.5 font-mono font-medium hidden sm:inline">
                    बॅनर स्वाइप करा ◄ ►
                  </span>
                </div>
              </div>
            </div>

            {/* AMAZON 4-BOX BENTO HIGHLIGHT GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {/* Box 1: Furniture Quadrant Box */}
              <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    Teak Furniture | Up to 60% Off
                  </h3>
                  {/* 4 Quadrants */}
                  <div className="grid grid-cols-2 gap-2">
                    <div
                      onClick={() => {
                        setSelectedCategory('Furniture');
                        setProductSearchQuery('sofa');
                      }}
                      className="group/q cursor-pointer bg-slate-50 rounded p-2 text-center hover:bg-amber-50/50 transition border border-slate-100"
                    >
                      <div className="h-14 flex items-center justify-center text-slate-600 group-hover/q:text-[#f08804]">
                        <Sofa className="w-7 h-7" />
                      </div>
                      <span className="text-[11px] text-slate-700 font-medium block truncate">Sofa Sets</span>
                    </div>
                    <div
                      onClick={() => {
                        setSelectedCategory('Furniture');
                        setProductSearchQuery('bed');
                      }}
                      className="group/q cursor-pointer bg-slate-50 rounded p-2 text-center hover:bg-amber-50/50 transition border border-slate-100"
                    >
                      <div className="h-14 flex items-center justify-center text-slate-600 group-hover/q:text-[#f08804]">
                        <Building2 className="w-7 h-7" />
                      </div>
                      <span className="text-[11px] text-slate-700 font-medium block truncate">Hydraulic Beds</span>
                    </div>
                    <div
                      onClick={() => {
                        setSelectedCategory('Furniture');
                        setProductSearchQuery('wardrobe');
                      }}
                      className="group/q cursor-pointer bg-slate-50 rounded p-2 text-center hover:bg-amber-50/50 transition border border-slate-100"
                    >
                      <div className="h-14 flex items-center justify-center text-slate-600 group-hover/q:text-[#f08804]">
                        <Store className="w-7 h-7" />
                      </div>
                      <span className="text-[11px] text-slate-700 font-medium block truncate">Steel & Wood Almirah</span>
                    </div>
                    <div
                      onClick={() => {
                        setSelectedCategory('Furniture');
                        setProductSearchQuery('dining');
                      }}
                      className="group/q cursor-pointer bg-slate-50 rounded p-2 text-center hover:bg-amber-50/50 transition border border-slate-100"
                    >
                      <div className="h-14 flex items-center justify-center text-slate-600 group-hover/q:text-[#f08804]">
                        <Sparkles className="w-7 h-7" />
                      </div>
                      <span className="text-[11px] text-slate-700 font-medium block truncate">Dining Sets</span>
                    </div>
                  </div>
                </div>
                <a
                  href="#products-catalog"
                  onClick={() => setSelectedCategory('Furniture')}
                  className="text-xs font-semibold text-[#007185] hover:text-[#c7511f] hover:underline flex items-center gap-1"
                >
                  <span>See all furniture deals</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Box 2: Electronics Quadrant Box */}
              <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    Appliances | Starting ₹2,999
                  </h3>
                  {/* 4 Quadrants */}
                  <div className="grid grid-cols-2 gap-2">
                    <div
                      onClick={() => {
                        setSelectedCategory('Electronics');
                        setProductSearchQuery('tv');
                      }}
                      className="group/q cursor-pointer bg-slate-50 rounded p-2 text-center hover:bg-amber-50/50 transition border border-slate-100"
                    >
                      <div className="h-14 flex items-center justify-center text-slate-600 group-hover/q:text-[#f08804]">
                        <Tv className="w-7 h-7" />
                      </div>
                      <span className="text-[11px] text-slate-700 font-medium block truncate">4K Smart TV</span>
                    </div>
                    <div
                      onClick={() => {
                        setSelectedCategory('Electronics');
                        setProductSearchQuery('cooler');
                      }}
                      className="group/q cursor-pointer bg-slate-50 rounded p-2 text-center hover:bg-amber-50/50 transition border border-slate-100"
                    >
                      <div className="h-14 flex items-center justify-center text-slate-600 group-hover/q:text-[#f08804]">
                        <Wind className="w-7 h-7" />
                      </div>
                      <span className="text-[11px] text-slate-700 font-medium block truncate">Desert Coolers</span>
                    </div>
                    <div
                      onClick={() => {
                        setSelectedCategory('Electronics');
                        setProductSearchQuery('fridge');
                      }}
                      className="group/q cursor-pointer bg-slate-50 rounded p-2 text-center hover:bg-amber-50/50 transition border border-slate-100"
                    >
                      <div className="h-14 flex items-center justify-center text-slate-600 group-hover/q:text-[#f08804]">
                        <PackageCheck className="w-7 h-7" />
                      </div>
                      <span className="text-[11px] text-slate-700 font-medium block truncate">Refrigerators</span>
                    </div>
                    <div
                      onClick={() => {
                        setSelectedCategory('Electronics');
                        setProductSearchQuery('fan');
                      }}
                      className="group/q cursor-pointer bg-slate-50 rounded p-2 text-center hover:bg-amber-50/50 transition border border-slate-100"
                    >
                      <div className="h-14 flex items-center justify-center text-slate-600 group-hover/q:text-[#f08804]">
                        <Zap className="w-7 h-7" />
                      </div>
                      <span className="text-[11px] text-slate-700 font-medium block truncate">Ceiling Fans</span>
                    </div>
                  </div>
                </div>
                <a
                  href="#products-catalog"
                  onClick={() => setSelectedCategory('Electronics')}
                  className="text-xs font-semibold text-[#007185] hover:text-[#c7511f] hover:underline flex items-center gap-1"
                >
                  <span>Explore all electronics</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Box 3: 30-Month Weekly Passbook & Quick Lookup Box */}
              <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 text-[#007185]">
                    <BookOpen className="w-4 h-4" />
                    <span className="text-[11px] font-bold uppercase tracking-wide">Weekly Passbook</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    30-Month Weekly Scheme
                  </h3>

                  {isCustomerVerified && selectedMember ? (
                    <div className="bg-emerald-50 border border-emerald-200 rounded p-3 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-900">#{selectedMember.cardNumber}</span>
                        <span className="text-[10px] bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                          Verified
                        </span>
                      </div>
                      <p className="font-medium text-slate-800 truncate">{selectedMember.customerName}</p>
                      <p className="font-mono text-emerald-800 font-bold">Deposited: ₹{selectedMember.totalDeposited.toLocaleString()}</p>
                      <button
                        type="button"
                        onClick={() => setShowFullPassbookModal(true)}
                        className="w-full py-1.5 rounded bg-[#ffd814] hover:bg-[#f7ca00] text-slate-950 font-bold text-xs shadow-xs"
                      >
                        Open Digital Passbook
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleVerifyCustomerPassbook} className="space-y-2">
                      <div>
                        <label className="block text-[10px] text-slate-500 font-medium">Card No. (e.g. 1001)</label>
                        <input
                          type="text"
                          value={customerCardInput}
                          onChange={(e) => {
                            setCustomerCardInput(e.target.value);
                            setSearchError('');
                          }}
                          placeholder="Card No."
                          className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-[#ff9900]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 font-medium">Registered Mobile / Last 4 Digits</label>
                        <input
                          type="text"
                          value={customerPhoneInput}
                          onChange={(e) => {
                            setCustomerPhoneInput(e.target.value);
                            setSearchError('');
                          }}
                          placeholder="Mobile No."
                          className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-[#ff9900]"
                        />
                      </div>
                      {searchError && (
                        <p className="text-[10px] text-rose-600 font-medium leading-tight">{searchError}</p>
                      )}
                      <button
                        type="submit"
                        className="w-full py-1.5 rounded bg-[#ffd814] hover:bg-[#f7ca00] text-slate-950 font-bold text-xs shadow-xs cursor-pointer"
                      >
                        Search My Passbook
                      </button>
                    </form>
                  )}
                </div>
                <a
                  href="#savings-schemes"
                  className="text-xs font-semibold text-[#007185] hover:text-[#c7511f] hover:underline flex items-center gap-1"
                >
                  <span>See 30-Month Scheme Rules</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Box 4: 0% EMI & 50% Down Payment Box */}
              <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 text-amber-600">
                    <CreditCard className="w-4 h-4" />
                    <span className="text-[11px] font-bold uppercase tracking-wide">0% No-Cost EMI</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    0% Interest & 50% Down Payment
                  </h3>
                  <div className="space-y-2 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5 font-medium text-slate-800">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>50% Down Payment rule across all products</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-medium text-slate-800">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Instant Bajaj Finserv, TVS Credit & HDFC</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-medium text-slate-800">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>10-Minute paperless approval</span>
                    </div>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded p-2 text-[11px] text-amber-900">
                    <strong>Documents:</strong> Aadhaar Card, PAN Card, Bank Passbook copy.
                  </div>
                </div>
                <a
                  href="#products-catalog"
                  className="text-xs font-semibold text-[#007185] hover:text-[#c7511f] hover:underline flex items-center gap-1"
                >
                  <span>Shop on 0% EMI</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* PRODUCTS CATALOG SECTION */}
        <section id="products-catalog" className="max-w-7xl mx-auto px-3 sm:px-6 space-y-6">
          {/* Header and Filter Category Bar */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-amber-100 text-amber-950 text-xs font-bold mb-1.5">
                <Store className="w-3.5 h-3.5 text-[#e47911]" />
                <span>Shri Sai Authorized Showroom Inventory • Free Home Delivery</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Electronics, Home Appliances & Solid Teak Furniture
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                Showroom: Opp. Matoshree Sabhagruh, Arvi Road, Punjab Colony, Wardha - 442001 | 📞 8766486915 / 8600122798
              </p>
            </div>

            {/* Admin Controls */}
            <div className="flex items-center gap-3">
              {isAdminMode ? (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-300 px-3 py-1.5 rounded text-xs text-emerald-800 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Admin Mode Active</span>
                </div>
              ) : (
                <button
                  onClick={() => setShowAdminPasswordPrompt(true)}
                  className="px-3.5 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition flex items-center gap-1.5 cursor-pointer border border-slate-300"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Admin Edit</span>
                </button>
              )}
            </div>
          </div>

          {/* Amazon Category Filter Pills & Search Results Status */}
          <div className="space-y-3">
            {productSearchQuery && (
              <div className="flex items-center justify-between bg-amber-50 border border-amber-300 px-4 py-2 rounded text-xs text-amber-950">
                <div className="flex items-center gap-2">
                  <Search className="w-3.5 h-3.5 text-[#e47911]" />
                  <span>
                    Search results: <strong>{filteredStock.length}</strong> items available (Query:{' '}
                    <em>'{productSearchQuery}'</em>)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setProductSearchQuery('')}
                  className="text-[11px] text-[#007185] hover:text-[#c7511f] hover:underline font-bold cursor-pointer"
                >
                  Clear Search
                </button>
              </div>
            )}

            <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-[#131921] text-white shadow-xs'
                      : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-300'
                  }`}
                >
                  {cat === 'all' ? 'All Products' : cat}
                </button>
              ))}
            </div>

            {filteredStock.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg border border-slate-200 p-6 space-y-4 shadow-xs">
                <AlertCircle className="w-10 h-10 mx-auto text-amber-500" />
                <p className="text-sm font-bold text-slate-900">
                  No products found matching '{productSearchQuery}'
                </p>
                <p className="text-xs text-slate-600">Try popular showroom categories:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {['Cooler', 'Fridge', 'TV', 'Sofa', 'Bed', 'Almirah'].map((tag) => (
                    <button
                      key={tag}
                      onClick={() => {
                        setProductSearchQuery(tag);
                        setSelectedCategory('all');
                      }}
                      className="px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-xs font-medium text-slate-800 transition cursor-pointer border border-slate-300"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Amazon Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {filteredStock.map((item) => {
              const mrp = Math.round(item.sellingPrice * 1.35);
              const discountPct = Math.round(((mrp - item.sellingPrice) / mrp) * 100);
              const emiPerMonth = Math.round((item.sellingPrice * 0.5) / 6);

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between group"
                >
                  <div>
                    {/* Image Container with Amazon Badges & Interactive Quick View */}
                    <div
                      className="relative h-60 bg-slate-50 overflow-hidden flex items-center justify-center p-3 border-b border-slate-100 cursor-pointer group/img"
                      onClick={() => {
                        setViewingProductImageModal(item);
                        setIsImageZoomed(false);
                      }}
                      title="Click to view original photo & specifications"
                    >
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-contain group-hover/img:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <Tv className="w-12 h-12 text-slate-300" />
                      )}

                      {/* Hover Overlay: View Original Photo */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="px-3.5 py-1.5 rounded-full bg-white/95 text-slate-900 font-bold text-xs shadow-lg flex items-center gap-1.5 backdrop-blur-xs">
                          <Eye className="w-3.5 h-3.5 text-[#007185]" />
                          <span>View Details & Photo</span>
                        </span>
                      </div>

                      {/* Amazon Choice / Sai's Choice Badge */}
                      <div className="absolute top-2 left-2 z-10">
                        <span className="px-2 py-0.5 rounded-r bg-[#232f3e] text-[#febd69] text-[10px] font-bold tracking-wide shadow-xs">
                          Sai's <span className="text-white">Choice</span>
                        </span>
                      </div>

                      <div className="absolute top-2 right-2 z-10">
                        <span className="px-2 py-0.5 rounded bg-rose-700 text-white text-[10px] font-extrabold tracking-wide">
                          {discountPct}% OFF
                        </span>
                      </div>
                    </div>

                    {/* Product Meta & Pricing in Amazon Format */}
                    <div className="p-4 space-y-2">
                      <span className="text-[11px] text-slate-500 font-medium block">
                        {item.category || 'Showroom Exclusive'}
                      </span>

                      <h3
                        onClick={() => {
                          setViewingProductImageModal(item);
                          setIsImageZoomed(false);
                        }}
                        className="font-medium text-slate-900 text-xs sm:text-sm leading-snug line-clamp-2 hover:text-[#c7511f] cursor-pointer"
                        title={item.name}
                      >
                        {item.name}
                      </h3>

                      {/* Star Ratings */}
                      <div className="flex items-center gap-1 text-xs">
                        <div className="flex text-[#ffa41c]">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-[#ffa41c] text-[#ffa41c]" />
                          ))}
                        </div>
                        <span className="text-[11px] text-[#007185] hover:underline font-semibold ml-1">
                          4.8 (86)
                        </span>
                      </div>

                      {/* Amazon Price Box */}
                      <div className="pt-1">
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-rose-700">-{discountPct}%</span>
                          <span className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">
                            ₹{item.sellingPrice.toLocaleString()}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          M.R.P.: <span className="line-through">₹{mrp.toLocaleString()}</span>
                        </div>
                        <div className="text-[11px] text-slate-700 mt-0.5">
                          EMI Option: <strong>50% Down Payment</strong>, then ₹{emiPerMonth.toLocaleString()}/month
                        </div>
                      </div>

                      {/* Prime / Sai Assured & Delivery */}
                      <div className="pt-1 text-[11px] space-y-0.5">
                        <div className="flex items-center gap-1 font-bold text-slate-800">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#00a8e1] shrink-0" />
                          <span className="text-[#00a8e1]">✓ Sai Assured</span>
                          <span className="text-slate-600 font-normal">| Free Delivery</span>
                        </div>
                        <p className="text-slate-600 text-[10px]">
                          Delivered in 24 hours across Wardha, Sevagram, Arvi & Deoli.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Amazon CTA Buttons */}
                  <div className="p-4 pt-0 space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        setViewingProductImageModal(item);
                        setIsImageZoomed(false);
                      }}
                      className="w-full py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer border border-slate-200"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#007185]" />
                      <span>View Specifications</span>
                    </button>

                    {isAdminMode && (
                      <button
                        onClick={() => {
                          setEditingStockItem(item);
                          setIsProductEditModalOpen(true);
                        }}
                        className="w-full py-1.5 rounded border border-teal-300 bg-teal-50 text-teal-900 text-xs font-bold flex items-center justify-center gap-1 hover:bg-teal-100 transition"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-teal-700" />
                        <span>Update Price / Photo (Admin)</span>
                      </button>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => addToCart(item)}
                        className="py-2 rounded-full bg-[#ffd814] hover:bg-[#f7ca00] text-slate-950 text-xs font-bold flex items-center justify-center gap-1 shadow-xs transition active:scale-95 cursor-pointer"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>Add to Cart</span>
                      </button>

                      <a
                        href={getDirectWhatsAppItemLink(item, '8766486915')}
                        target="_blank"
                        rel="noreferrer"
                        className="py-2 rounded-full bg-[#ffa41c] hover:bg-[#fa8900] text-slate-950 text-xs font-bold flex items-center justify-center gap-1 shadow-xs transition active:scale-95 cursor-pointer"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Buy Now</span>
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
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
        <section className="max-w-7xl mx-auto px-3 sm:px-6 pb-12">
          <div className="bg-[#131921] text-white rounded-xl p-6 sm:p-10 shadow-lg space-y-8 border border-slate-800">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Showroom Address */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-[#febd69] uppercase tracking-wider block">
                  Showroom Address (शोरूम पत्ता)
                </span>
                <h3 className="text-lg font-bold text-white">श्री साई इंटरप्राइजेस (Shri Sai Enterprises)</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  मातोश्री सभागृह समोर, आर्वी रोड, पंजाब कॉलनी, वर्धा - ४४२००१ (Opp. Matoshree Sabhagruha, Arvi Road, Punjab Colony, Wardha, Maharashtra - 442001).
                </p>
                <div className="text-xs font-mono text-amber-300 space-y-1 pt-1">
                  <p>GSTIN: <strong className="text-white">27ALOPL0030G2ZC</strong></p>
                  <p>Udyam: <strong className="text-white">UDYAM-MH-33-0012948</strong></p>
                </div>
              </div>

              {/* Contact Desks */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-[#febd69] uppercase tracking-wider block">
                  Contact & Official WhatsApp
                </span>
                <div className="space-y-2 text-xs font-mono">
                  <a href="tel:8766486915" className="flex items-center gap-2 text-slate-200 hover:text-white transition">
                    <Phone className="w-3.5 h-3.5 text-[#febd69]" /> 8766486915 (Primary & WhatsApp)
                  </a>
                  <a href="tel:8600122798" className="flex items-center gap-2 text-slate-200 hover:text-white transition">
                    <Phone className="w-3.5 h-3.5 text-[#febd69]" /> 8600122798 (WhatsApp 2)
                  </a>
                  <a href="tel:9175534365" className="flex items-center gap-2 text-slate-300 hover:text-white transition">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> 9175534365
                  </a>
                  <a
                    href="https://chat.whatsapp.com/invite/shrisaienterprises"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-sans font-bold transition mt-1"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>अधिकृत व्हॉट्सॲप ग्रुप जॉईन करा</span>
                  </a>
                </div>
              </div>

              {/* Bank Account */}
              <div className="space-y-3 bg-white/5 border border-white/10 rounded-lg p-4 text-xs">
                <span className="text-xs font-bold text-[#febd69] uppercase tracking-wider block">
                  Official Bank Account
                </span>
                <div className="space-y-1 font-mono text-slate-200">
                  <p>Bank: <strong className="text-white">HDFC Bank</strong></p>
                  <p>A/C No: <strong className="text-[#febd69]">50200083215914</strong></p>
                  <p>IFSC: <strong className="text-white">HDFC0000965</strong></p>
                  <p className="text-[11px] text-slate-400 truncate">Branch: OPP.BANK OF MAHARASHTRA WARDHA 442001</p>
                </div>
              </div>
            </div>

            {/* Official Warranty Notice */}
            <div className="border-t border-white/10 pt-4 text-[11px] text-slate-300 leading-relaxed bg-white/5 p-4 rounded-lg border border-white/10">
              <strong className="text-[#febd69] block mb-1 font-bold">वॉरंटी व अधिकृत नियम:</strong>
              सर्व ब्रँडेड इलेक्ट्रॉनिक्स वस्तूंवर अधिकृत कंपनी वॉरंटी लागू आहे. श्री साई द्वारे उत्पादित सर्व सागवान फर्निचरवर ५ वर्षांची वाळवी व सिझनिंग स्ट्रक्चरल गॅरंटी दिली जाते.
            </div>
          </div>
        </section>
      </main>

      {/* AMAZON FOOTER */}
      <footer className="bg-[#131921] text-slate-300 text-xs no-print">
        {/* Back to Top Bar */}
        <div
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="bg-[#37475a] hover:bg-[#485769] text-white text-center py-3 text-xs font-semibold cursor-pointer transition select-none flex items-center justify-center gap-1.5"
        >
          <ArrowUp className="w-3.5 h-3.5" />
          <span>Back to Top</span>
        </div>

        {/* 4 Columns Nav in #232f3e */}
        <div className="bg-[#232f3e] py-10 px-4 sm:px-6 border-b border-[#37475a]">
          <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            {/* Col 1: Get to Know Us */}
            <div className="space-y-3">
              <h4 className="text-white font-bold text-sm tracking-wide">Get to Know Us</h4>
              <ul className="space-y-2 text-xs text-slate-300">
                <li>
                  <a href="#top" className="hover:underline hover:text-white">Shri Sai Enterprises</a>
                </li>
                <li>
                  <a href="#products-catalog" className="hover:underline hover:text-white">Teak Furniture Factory</a>
                </li>
                <li>
                  <a href="#products-catalog" className="hover:underline hover:text-white">Authorized Electronics Showcase</a>
                </li>
                <li>
                  <span className="text-slate-400">Founder & Prop: Shubham Shende</span>
                </li>
              </ul>
            </div>

            {/* Col 2: Connect with Us */}
            <div className="space-y-3">
              <h4 className="text-white font-bold text-sm tracking-wide">Connect with Us</h4>
              <ul className="space-y-2 text-xs text-slate-300">
                <li>
                  <a href="tel:8766486915" className="hover:underline hover:text-white flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#febd69]" />
                    <span>8766486915 (Primary & WhatsApp)</span>
                  </a>
                </li>
                <li>
                  <a href="tel:8600122798" className="hover:underline hover:text-white flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#febd69]" />
                    <span>8600122798 (Secondary)</span>
                  </a>
                </li>
                <li>
                  <a
                    href="https://chat.whatsapp.com/invite/shrisaienterprises"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline hover:text-[#febd69] flex items-center gap-1.5"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Join Official WhatsApp Community</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 3: 30-Month Passbook */}
            <div className="space-y-3">
              <h4 className="text-white font-bold text-sm tracking-wide">30-Month Savings Scheme</h4>
              <ul className="space-y-2 text-xs text-slate-300">
                <li>
                  <a href="#savings-schemes" className="hover:underline hover:text-white">
                    Weekly Savings Card Plans
                  </a>
                </li>
                <li>
                  <a href="#top" className="hover:underline hover:text-white">
                    Digital Passbook Lookup
                  </a>
                </li>
                <li>
                  <a href="#top" className="hover:underline hover:text-white">
                    Lucky Draw Rules & Bumper Prizes
                  </a>
                </li>
                <li>
                  <span className="text-slate-400">Guaranteed gift handover after 130 weeks</span>
                </li>
              </ul>
            </div>

            {/* Col 4: Store Address & Timing */}
            <div className="space-y-3">
              <h4 className="text-white font-bold text-sm tracking-wide">Showroom & Timings</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Opp. Matoshree Sabhagruh, Arvi Road, Punjab Colony, Wardha - 442001
              </p>
              <p className="text-xs text-slate-400">
                Hours: 9:30 AM - 9:00 PM (Open All 7 Days)
              </p>
              <div className="pt-1 text-[11px] font-mono text-slate-400 space-y-0.5">
                <p>GSTIN: 27ALOPL0030G2ZC</p>
                <p>Udyam: UDYAM-MH-33-0012948</p>
              </div>
            </div>
          </div>
        </div>

        {/* Amazon Bottom Bar in #131921 */}
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AppLogo size="sm" theme="dark" showTagline={false} />
            <span className="text-slate-500 text-xs">|</span>
            <span className="text-xs text-slate-400 font-mono">Wardha, Maharashtra</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenLoginModal}
              className="px-3 py-1.5 rounded border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-[#febd69]" />
              <span>Staff / Admin Portal</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-400 text-center sm:text-right">
            <p>© 2026 shrisaient.in • All rights reserved.</p>
            <p className="text-slate-500 text-[10px]">Official Teak Furniture & Electronics Showroom, Wardha</p>
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
                    {/* PAYMENT & 0% FINANCE OPTIONS WITH 50% DOWN PAYMENT POLICY */}
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5 text-[#00523f]" />
                          पेमेंट किंवा फायनान्स पर्याय (Payment & 0% EMI):
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <label className={`p-2.5 rounded-xl border cursor-pointer transition flex items-start gap-2 ${
                          financePlan === 'full' ? 'border-[#00523f] bg-emerald-50/50' : 'border-slate-200 bg-white'
                        }`}>
                          <input
                            type="radio"
                            name="financePlan"
                            checked={financePlan === 'full'}
                            onChange={() => setFinancePlan('full')}
                            className="text-[#00523f] mt-0.5"
                          />
                          <div>
                            <span className="font-semibold text-slate-900 block">पूर्ण रोख / यूपीआय</span>
                            <span className="text-[10px] text-slate-500">Full Cash on Delivery</span>
                          </div>
                        </label>

                        <label className={`p-2.5 rounded-xl border cursor-pointer transition flex items-start gap-2 ${
                          financePlan === 'card_scheme_50' ? 'border-[#00523f] bg-emerald-50/50' : 'border-slate-200 bg-white'
                        }`}>
                          <input
                            type="radio"
                            name="financePlan"
                            checked={financePlan === 'card_scheme_50'}
                            onChange={() => setFinancePlan('card_scheme_50')}
                            className="text-[#00523f] mt-0.5"
                          />
                          <div>
                            <span className="font-semibold text-slate-900 block">३०-महिने बचत कार्ड खरेदी</span>
                            <span className="text-[10px] text-emerald-700 font-medium">किमान ५०% डाऊन पेमेंट</span>
                          </div>
                        </label>

                        <label className={`p-2.5 rounded-xl border cursor-pointer transition flex items-start gap-2 ${
                          financePlan === 'bajaj' ? 'border-[#00523f] bg-emerald-50/50' : 'border-slate-200 bg-white'
                        }`}>
                          <input
                            type="radio"
                            name="financePlan"
                            checked={financePlan === 'bajaj'}
                            onChange={() => setFinancePlan('bajaj')}
                            className="text-[#00523f] mt-0.5"
                          />
                          <div>
                            <span className="font-semibold text-slate-900 block">बजाज फायनान्स ०% EMI</span>
                            <span className="text-[10px] text-blue-600 font-medium">Bajaj Finserv No Cost</span>
                          </div>
                        </label>

                        <label className={`p-2.5 rounded-xl border cursor-pointer transition flex items-start gap-2 ${
                          financePlan === 'tvs' ? 'border-[#00523f] bg-emerald-50/50' : 'border-slate-200 bg-white'
                        }`}>
                          <input
                            type="radio"
                            name="financePlan"
                            checked={financePlan === 'tvs'}
                            onChange={() => setFinancePlan('tvs')}
                            className="text-[#00523f] mt-0.5"
                          />
                          <div>
                            <span className="font-semibold text-slate-900 block">टीव्हीएस क्रेडिट ०% EMI</span>
                            <span className="text-[10px] text-orange-600 font-medium">TVS Credit No Cost</span>
                          </div>
                        </label>
                      </div>

                      {/* 50% Down Payment Breakdown and Tenure Selector */}
                      {financePlan !== 'full' && (
                        <div className="bg-white rounded-xl p-3 border border-emerald-200 space-y-2 text-xs">
                          <div className="flex items-center justify-between text-slate-700">
                            <span>एकूण ऑर्डर रक्कम:</span>
                            <strong className="font-mono text-slate-900">₹{cartGrandTotal.toLocaleString()}</strong>
                          </div>
                          <div className="flex items-center justify-between text-emerald-800 font-semibold">
                            <span>किमान ५०% डाऊन पेमेंट (नियम):</span>
                            <strong className="font-mono text-sm text-emerald-700">₹{Math.round(cartGrandTotal * 0.5).toLocaleString()}</strong>
                          </div>
                          <div className="flex items-center justify-between text-slate-600">
                            <span>उर्वरित ५०% शिल्लक / हप्ते:</span>
                            <strong className="font-mono text-slate-900">₹{(cartGrandTotal - Math.round(cartGrandTotal * 0.5)).toLocaleString()}</strong>
                          </div>

                          <div className="pt-2 border-t border-slate-100">
                            <label className="text-[11px] font-medium text-slate-600 block mb-1">
                              कालावधी निवडा (Tenure):
                            </label>
                            <div className="grid grid-cols-4 gap-1.5 text-center font-mono text-[11px]">
                              {[3, 6, 10, 12].map((m) => (
                                <button
                                  key={m}
                                  type="button"
                                  onClick={() => setSelectedTenure(m)}
                                  className={`py-1.5 rounded-lg border cursor-pointer transition ${
                                    selectedTenure === m
                                      ? 'bg-emerald-700 text-white border-emerald-700 font-bold'
                                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                  }`}
                                >
                                  {m}M
                                </button>
                              ))}
                            </div>
                            <p className="text-[10px] text-emerald-800 font-medium mt-1 text-center">
                              अंदाजे हप्ता: ₹{Math.round((cartGrandTotal * 0.5) / selectedTenure).toLocaleString()}/महिना ({selectedTenure} महिने)
                            </p>
                          </div>

                          {/* Required Documents Checklist */}
                          <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-600 space-y-0.5">
                            <span className="font-bold text-slate-800 block">📋 फायनान्स मंजुरीसाठी आवश्यक कागदपत्रे:</span>
                            <p>1. आधार कार्ड • 2. पॅन कार्ड • 3. बँक पासबुक • 4. दोन पासपोर्ट फोटो</p>
                          </div>
                        </div>
                      )}
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
                  मातोश्री सभागृह समोर, आर्वी रोड, पंजाब कॉलनी, वर्धा - ४४२००१
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

              {/* Summary Metrics & Transactions */}
              {(() => {
                const totalDep = memberTransactions
                  .filter((t) => t.type === 'WeeklyPayment' || t.type === 'Deposit' || t.type === 'Fee')
                  .reduce((sum, t) => sum + (t.amount || 0), 0);
                const totalDeb = memberTransactions
                  .filter((t) => t.type === 'GoodsTaken' || t.type === 'Refund')
                  .reduce((sum, t) => sum + (t.amount || 0), 0);
                const netSav = totalDep - totalDeb;
                const weeksCount = memberTransactions.filter((t) => t.type === 'WeeklyPayment').length;

                return (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
                      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3">
                        <span className="text-[10px] text-emerald-800 block font-semibold">एकूण जमा (Deposited)</span>
                        <span className="font-mono font-bold text-emerald-700 text-sm sm:text-base">
                          ₹{totalDep.toLocaleString()}
                        </span>
                      </div>
                      <div className="bg-rose-50 border border-rose-100 rounded-2xl p-3">
                        <span className="text-[10px] text-rose-800 block font-semibold">वस्तू उचल / परतावा (Debits)</span>
                        <span className="font-mono font-bold text-rose-700 text-sm sm:text-base">
                          ₹{totalDeb.toLocaleString()}
                        </span>
                      </div>
                      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3">
                        <span className="text-[10px] text-blue-800 block font-semibold">शिल्लक बचत (Net Balance)</span>
                        <span className="font-mono font-bold text-blue-700 text-sm sm:text-base">
                          ₹{netSav.toLocaleString()}
                        </span>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
                        <span className="text-[10px] text-slate-600 block font-semibold">हफ्ते पूर्ण (Weeks Paid)</span>
                        <span className="font-mono font-semibold text-slate-800 text-sm sm:text-base">
                          {weeksCount} / 130
                        </span>
                      </div>
                    </div>

                    {/* Transactions Table */}
                    <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                          <tr>
                            <th className="py-2.5 px-3">#</th>
                            <th className="py-2.5 px-3">पावती / बिल क्र.</th>
                            <th className="py-2.5 px-3">तारीख</th>
                            <th className="py-2.5 px-3">तपशील व वस्तू</th>
                            <th className="py-2.5 px-3">प्रकार</th>
                            <th className="py-2.5 px-3 text-right">रक्कम (₹)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                          {memberTransactions.map((tx, idx) => {
                            const isDebit = tx.type === 'GoodsTaken' || tx.type === 'Refund';
                            return (
                              <tr key={tx.id} className={isDebit ? 'bg-rose-50/50' : 'hover:bg-slate-50'}>
                                <td className="py-2 px-3 text-slate-400">{idx + 1}</td>
                                <td className="py-2 px-3 font-semibold text-slate-900">{tx.receiptNo}</td>
                                <td className="py-2 px-3 text-slate-600 whitespace-nowrap">{tx.date}</td>
                                <td className="py-2 px-3 font-sans text-slate-800">
                                  {tx.remarks ||
                                    (tx.type === 'GoodsTaken'
                                      ? `साहित्य: ${tx.goodsDetail || 'वस्तू'}`
                                      : `हप्ता Week #${tx.weekNumber || 1}`)}
                                </td>
                                <td className="py-2 px-3 whitespace-nowrap">
                                  {isDebit ? (
                                    <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px]">
                                      {tx.type === 'GoodsTaken' ? 'वस्तू उचल' : 'परतावा'}
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                                      जमा
                                    </span>
                                  )}
                                </td>
                                <td
                                  className={`py-2 px-3 text-right font-bold whitespace-nowrap ${
                                    isDebit ? 'text-rose-600' : 'text-emerald-700'
                                  }`}
                                >
                                  {isDebit
                                    ? `-₹${(tx.amount || 0).toLocaleString()}`
                                    : `+₹${(tx.amount || 0).toLocaleString()}`}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                );
              })()}

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

      {/* ORIGINAL PRODUCT PHOTO & SPECIFICATIONS MODAL */}
      {viewingProductImageModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
          onClick={() => {
            setViewingProductImageModal(null);
            setIsImageZoomed(false);
          }}
        >
          <div
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 flex flex-col md:flex-row overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Modal Button */}
            <button
              type="button"
              onClick={() => {
                setViewingProductImageModal(null);
                setIsImageZoomed(false);
              }}
              aria-label="बंद करा (Close)"
              className="absolute top-3 right-3 z-30 w-8 h-8 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white flex items-center justify-center transition cursor-pointer shadow-md"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left/Top: High-Res Image View with Zoom feature */}
            <div className="md:w-1/2 bg-slate-950/5 relative flex flex-col items-center justify-center p-4 sm:p-6 border-b md:border-b-0 md:border-r border-slate-200 min-h-[300px] sm:min-h-[400px]">
              {/* Image Badges */}
              <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-20">
                <span className="px-2.5 py-1 rounded bg-[#232f3e] text-[#febd69] text-xs font-bold tracking-wide shadow-md flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-[#febd69]" />
                  <span>मूळ शोरूम फोटो • Sai Assured</span>
                </span>
                <span className="px-2.5 py-0.5 rounded bg-emerald-600 text-white text-[11px] font-bold tracking-wide shadow-xs">
                  ✓ १००% अस्सल ब्रँड गॅरंटी
                </span>
              </div>

              {/* Image Container */}
              <div
                className={`relative w-full h-full flex items-center justify-center overflow-hidden transition-all duration-300 ${
                  isImageZoomed ? 'cursor-zoom-out scale-125' : 'cursor-zoom-in'
                }`}
                onClick={() => setIsImageZoomed(!isImageZoomed)}
                title={isImageZoomed ? 'झूम कमी करण्यासाठी क्लिक करा' : 'झूम करण्यासाठी क्लिक करा'}
              >
                {viewingProductImageModal.imageUrl ? (
                  <img
                    src={viewingProductImageModal.imageUrl}
                    alt={viewingProductImageModal.name}
                    referrerPolicy="no-referrer"
                    className="max-h-[380px] w-auto max-w-full object-contain drop-shadow-md transition-transform duration-300 select-none"
                  />
                ) : (
                  <Tv className="w-24 h-24 text-slate-300" />
                )}
              </div>

              {/* Zoom toggle button below image */}
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsImageZoomed(!isImageZoomed)}
                  className="px-3 py-1 rounded-full bg-white text-slate-700 text-xs font-semibold shadow-xs border border-slate-200 flex items-center gap-1.5 hover:bg-slate-50 transition cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-[#007185]" />
                  <span>{isImageZoomed ? 'मूळ आकार (Normal)' : 'मोठा आकार पहा (Zoom)'}</span>
                </button>
                <span className="text-[11px] text-slate-500 hidden sm:inline">
                  (फोटोवर क्लिक करून झूम करता येते)
                </span>
              </div>
            </div>

            {/* Right/Bottom: Product Details & Authentic Specifications */}
            <div className="md:w-1/2 p-5 sm:p-7 flex flex-col justify-between space-y-4">
              <div className="space-y-3.5">
                <div>
                  <span className="text-xs font-semibold text-[#007185] uppercase tracking-wider block">
                    {viewingProductImageModal.category} {viewingProductImageModal.brand ? `• ${viewingProductImageModal.brand}` : ''}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-950 leading-tight mt-1">
                    {viewingProductImageModal.name}
                  </h2>
                </div>

                {/* Pricing & Discounts */}
                {(() => {
                  const mrp = Math.round(viewingProductImageModal.sellingPrice * 1.35);
                  const discountPct = Math.round(((mrp - viewingProductImageModal.sellingPrice) / mrp) * 100);
                  const downPay = Math.round(viewingProductImageModal.sellingPrice * 0.5);
                  const emi6 = Math.round(downPay / 6);
                  return (
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-extrabold text-rose-700">-{discountPct}%</span>
                        <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                          ₹{viewingProductImageModal.sellingPrice.toLocaleString()}
                        </span>
                        <span className="text-xs text-slate-500 line-through">M.R.P. ₹{mrp.toLocaleString()}</span>
                      </div>
                      <div className="text-xs text-emerald-800 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>तुम्ही थेट ₹{(mrp - viewingProductImageModal.sellingPrice).toLocaleString()} बचत करत आहात!</span>
                      </div>
                      <div className="pt-1.5 border-t border-slate-200 text-xs text-slate-700">
                        <strong>०% नो-कॉस्ट ईएमआय:</strong> ५०% डाऊन पेमेंट (₹{downPay.toLocaleString()}) नंतर फक्त <strong>₹{emi6.toLocaleString()}/महिना</strong> (६ महिने).
                      </div>
                    </div>
                  );
                })()}

                {/* Description & Features */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    वस्तूची वैशिष्ट्ये व माहिती (Specifications):
                  </h4>
                  <p className="text-xs text-slate-700 leading-relaxed bg-amber-50/60 p-3 rounded-lg border border-amber-200/70">
                    {viewingProductImageModal.description || 'श्री साई शोरूममधील उच्च दर्जाची अधिकृत मूळ उत्पादन श्रेणी. संपूर्ण कंपनी वॉरंटी व खात्रीशीर ग्राहक सेवा.'}
                  </p>
                </div>

                {/* Sai Assured Badges */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 p-2 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>शोरूम वॉरंटी हमी</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-2 rounded-lg bg-blue-50 text-blue-900 border border-blue-200 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>मोफत घरपोच डिलिव्हरी</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-2 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>५०% डाऊन पेमेंट ईएमआय</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-2 rounded-lg bg-purple-50 text-purple-900 border border-purple-200 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>वर्धा लोकल सपोर्ट</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500">
                  📍 शोरूम पत्ता: <strong>{settings.address || 'मातोश्री सभागृह समोर, आर्वी रोड, पंजाब कॉलनी, वर्धा - ४४२००१'}</strong>
                </div>
              </div>

              {/* Action Buttons in Modal */}
              <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    addToCart(viewingProductImageModal);
                    setViewingProductImageModal(null);
                  }}
                  className="flex-1 py-2.5 rounded-full bg-[#ffd814] hover:bg-[#f7ca00] text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Add to Cart (कार्टमध्ये जोडा)</span>
                </button>

                <a
                  href={getDirectWhatsAppItemLink(viewingProductImageModal, '8766486915')}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2.5 rounded-full bg-[#ffa41c] hover:bg-[#fa8900] text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp खरेदी / चौकशी</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* Customer Live Order Tracking Modal */}
      <OrderTrackingModal
        isOpen={showOrderTracking}
        onClose={() => setShowOrderTracking(false)}
        orders={salesTransactions}
        initialInvoice={initialInvoiceNo}
        settings={settings}
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
