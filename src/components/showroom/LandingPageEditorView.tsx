import React, { useState, useMemo } from 'react';
import {
  Store,
  Sparkles,
  Tag,
  Sliders,
  Bell,
  CreditCard,
  Phone,
  Plus,
  Trash2,
  Edit2,
  Check,
  Eye,
  Save,
  RotateCcw,
  Image as ImageIcon,
  ExternalLink,
  Search,
  CheckCircle2,
  Gift,
  Tv,
  Sofa,
  Layers,
  Wind,
  ShoppingBag,
  Percent,
  Calendar,
  MessageCircle,
  MapPin,
  Clock,
  ChevronRight,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import {
  StoreData,
  StockItem,
  LandingPageConfig,
  LandingHeroSlide,
  LandingOffer,
  LandingAnnouncement,
  LandingContactInfo,
  LandingSchemeBanner
} from '../../types';
import { StorageService } from '../../services/storageService';
import {
  DEFAULT_LANDING_CONFIG,
  DEFAULT_HERO_SLIDES,
  DEFAULT_OFFERS,
  getActiveLandingConfig,
  SAMPLE_SHOWROOM_PRODUCTS
} from '../../utils/defaultLandingConfig';
import { GENUINE_PRODUCT_IMAGES, getGenuineProductImage } from '../../utils/productImages';
import { useTheme } from '../../context/ThemeContext';

interface LandingPageEditorViewProps {
  storeData: StoreData;
  onRefreshData?: () => void;
  onOpenCustomerShowroom: () => void;
}

type EditorSubTab = 'products' | 'offers' | 'hero' | 'announcement' | 'scheme' | 'contact' | 'layout';

export const LandingPageEditorView: React.FC<LandingPageEditorViewProps> = ({
  storeData,
  onRefreshData,
  onOpenCustomerShowroom,
}) => {
  const { isDayMode } = useTheme();

  // Active sub-tab
  const [activeTab, setActiveTab] = useState<EditorSubTab>('products');

  // Working copy of landing page config
  const [config, setConfig] = useState<LandingPageConfig>(() =>
    getActiveLandingConfig(storeData.landingPageConfig)
  );

  // Success Toast state
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // ----------------------------------------------------
  // PRODUCT MANAGEMENT STATE
  // ----------------------------------------------------
  const [productSearch, setProductSearch] = useState('');
  const [selectedProductCategory, setSelectedProductCategory] = useState<string>('All');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<StockItem | null>(null);

  // New or Edit Product Form
  const [productForm, setProductForm] = useState({
    name: '',
    category: 'Electronics' as StockItem['category'],
    brand: '',
    model: '',
    mrp: 0,
    salePrice: 0,
    stockQty: 5,
    unit: 'Units',
    imageUrl: '',
    landingBadge: '',
    schemeWeeklyAmount: 100,
    isFeaturedOnLanding: true,
    hideOnLanding: false,
    description: '',
  });

  // ----------------------------------------------------
  // OFFER MANAGEMENT STATE
  // ----------------------------------------------------
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<LandingOffer | null>(null);
  const [offerForm, setOfferForm] = useState<LandingOffer>({
    id: '',
    title: '',
    subtitle: '',
    badge: 'MEGA DEAL',
    discount: '५०% पर्यंत सूट',
    couponCode: '',
    validTill: 'मर्यादित काळासाठी',
    category: 'Electronics',
    imageUrl: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600&auto=format&fit=crop&q=80',
    whatsappMessage: '',
    active: true,
  });

  // ----------------------------------------------------
  // HERO SLIDE MANAGEMENT STATE
  // ----------------------------------------------------
  const [isSlideModalOpen, setIsSlideModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<LandingHeroSlide | null>(null);
  const [slideForm, setSlideForm] = useState<LandingHeroSlide>({
    id: '',
    tag: '',
    titleLead: '',
    titleHighlight: '',
    subtitle: '',
    imageUrl: '',
    primaryBtnText: 'कॅटलॉग पहा',
    primaryBtnTarget: 'catalog',
    secondaryBtnText: 'योजना पासबुक',
    secondaryBtnTarget: 'passbook',
    cardBadge: 'हॉट ऑफर',
    cardMetric: '100% Brand Warranty',
    cardMetric2: '०% व्याज EMI',
    themeColor: 'amber',
    active: true,
  });

  const showToast = (msg: string) => {
    setSaveSuccessMessage(msg);
    setTimeout(() => setSaveSuccessMessage(null), 3500);
  };

  // Save entire landing page config to StoreData
  const handleSaveConfig = (newConfig?: LandingPageConfig) => {
    const toSave = newConfig || config;
    const updatedStoreData: StoreData = {
      ...storeData,
      landingPageConfig: toSave,
    };
    StorageService.saveData(updatedStoreData);
    if (onRefreshData) onRefreshData();
    showToast('लँडिंग पेज सेटिंग्ज व ऑफर्स यशस्वीरित्या सेव्ह झाल्या! ✅');
  };

  // Reset to default templates
  const handleResetToDefault = () => {
    if (window.confirm('तुम्हाला खरोखर लँडिंग पेजच्या सर्व ऑफर्स व बॅनर्स मूळ डिफॉल्ट्सवर रिसेट करायचे आहेत का?')) {
      setConfig(DEFAULT_LANDING_CONFIG);
      handleSaveConfig(DEFAULT_LANDING_CONFIG);
      showToast('लँडिंग पेज मूळ डिझाइनवर रिसेट केले गेले! 🔄');
    }
  };

  // ----------------------------------------------------
  // PRODUCT HANDLERS
  // ----------------------------------------------------
  const filteredProducts = useMemo(() => {
    return storeData.stock.filter((prod) => {
      const matchSearch =
        productSearch === '' ||
        prod.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        prod.brand.toLowerCase().includes(productSearch.toLowerCase()) ||
        prod.code.toLowerCase().includes(productSearch.toLowerCase()) ||
        (prod.landingBadge && prod.landingBadge.toLowerCase().includes(productSearch.toLowerCase()));

      const matchCat =
        selectedProductCategory === 'All' || prod.category === selectedProductCategory;

      return matchSearch && matchCat;
    });
  }, [storeData.stock, productSearch, selectedProductCategory]);

  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      category: 'Electronics',
      brand: '',
      model: '',
      mrp: 10000,
      salePrice: 7990,
      stockQty: 5,
      unit: 'Units',
      imageUrl: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&auto=format&fit=crop&q=80',
      landingBadge: 'दिवाळी विशेष',
      schemeWeeklyAmount: 100,
      isFeaturedOnLanding: true,
      hideOnLanding: false,
      description: '100% genuine showroom piece with official warranty and free delivery.',
    });
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod: StockItem) => {
    setEditingProduct(prod);
    setProductForm({
      name: prod.name,
      category: prod.category,
      brand: prod.brand,
      model: prod.model || '',
      mrp: prod.mrp,
      salePrice: prod.salePrice,
      stockQty: prod.stockQty,
      unit: prod.unit || 'Units',
      imageUrl: prod.imageUrl || getGenuineProductImage(prod),
      landingBadge: prod.landingBadge || '',
      schemeWeeklyAmount: prod.schemeWeeklyAmount || 100,
      isFeaturedOnLanding: prod.isFeaturedOnLanding ?? true,
      hideOnLanding: prod.hideOnLanding ?? false,
      description: prod.description || '',
    });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name.trim()) {
      alert('कृपया उत्पादनाचे नाव प्रविष्ट करा.');
      return;
    }

    let updatedStock: StockItem[] = [];

    if (editingProduct) {
      // Update existing
      updatedStock = storeData.stock.map((item) =>
        item.id === editingProduct.id
          ? {
              ...item,
              name: productForm.name.trim(),
              category: productForm.category,
              brand: productForm.brand.trim() || 'Generic',
              model: productForm.model.trim(),
              mrp: Number(productForm.mrp) || 0,
              salePrice: Number(productForm.salePrice) || 0,
              stockQty: Number(productForm.stockQty) || 0,
              unit: productForm.unit,
              imageUrl: productForm.imageUrl.trim(),
              landingBadge: productForm.landingBadge.trim(),
              schemeWeeklyAmount: Number(productForm.schemeWeeklyAmount) || 100,
              isFeaturedOnLanding: productForm.isFeaturedOnLanding,
              hideOnLanding: productForm.hideOnLanding,
              description: productForm.description.trim(),
              updatedAt: new Date().toISOString(),
            }
          : item
      );
    } else {
      // Add new product
      const newProd: StockItem = {
        id: `prod-${Date.now()}`,
        code: `SHOW-${Math.floor(1000 + Math.random() * 9000)}`,
        name: productForm.name.trim(),
        category: productForm.category,
        brand: productForm.brand.trim() || 'Sai Enterprises',
        model: productForm.model.trim() || '2026-MODEL',
        purchasePrice: Math.round(Number(productForm.salePrice) * 0.8),
        salePrice: Number(productForm.salePrice) || 0,
        mrp: Number(productForm.mrp) || Number(productForm.salePrice) * 1.3,
        stockQty: Number(productForm.stockQty) || 5,
        minAlertQty: 1,
        unit: productForm.unit,
        imageUrl: productForm.imageUrl.trim(),
        landingBadge: productForm.landingBadge.trim(),
        schemeWeeklyAmount: Number(productForm.schemeWeeklyAmount) || 100,
        isFeaturedOnLanding: productForm.isFeaturedOnLanding,
        hideOnLanding: productForm.hideOnLanding,
        description: productForm.description.trim(),
        updatedAt: new Date().toISOString(),
      };
      updatedStock = [newProd, ...storeData.stock];
    }

    const updatedStoreData: StoreData = {
      ...storeData,
      stock: updatedStock,
    };
    StorageService.saveData(updatedStoreData);
    if (onRefreshData) onRefreshData();
    setIsProductModalOpen(false);
    showToast(editingProduct ? 'उत्पादन माहिती अपडेट झाली! ✅' : 'नवीन उत्पादन लँडिंग पेजवर जोडले गेले! 🎉');
  };

  const handleDeleteProduct = (productId: string) => {
    if (window.confirm('हे उत्पादन लँडिंग पेज व स्टॉक मधून हटवायचे आहे का?')) {
      const updatedStock = storeData.stock.filter((s) => s.id !== productId);
      const updatedStoreData: StoreData = {
        ...storeData,
        stock: updatedStock,
      };
      StorageService.saveData(updatedStoreData);
      if (onRefreshData) onRefreshData();
      showToast('उत्पादन यशस्वीरित्या हटवले गेले! 🗑️');
    }
  };

  const handleToggleProductVisibility = (productId: string, currentHidden: boolean) => {
    const updatedStock = storeData.stock.map((item) =>
      item.id === productId ? { ...item, hideOnLanding: !currentHidden } : item
    );
    const updatedStoreData: StoreData = {
      ...storeData,
      stock: updatedStock,
    };
    StorageService.saveData(updatedStoreData);
    if (onRefreshData) onRefreshData();
    showToast(currentHidden ? 'उत्पादन लँडिंग पेजवर दिसेल! 👀' : 'उत्पादन लँडिंग पेजवरून लपवले गेले! 🙈');
  };

  const handleToggleFeatured = (productId: string, currentFeatured: boolean) => {
    const updatedStock = storeData.stock.map((item) =>
      item.id === productId ? { ...item, isFeaturedOnLanding: !currentFeatured } : item
    );
    const updatedStoreData: StoreData = {
      ...storeData,
      stock: updatedStock,
    };
    StorageService.saveData(updatedStoreData);
    if (onRefreshData) onRefreshData();
    showToast(!currentFeatured ? 'उत्पादन खास हायलाइट केले गेले! ⭐' : 'हायलाइट काढले गेले.');
  };

  const handleLoadSampleProducts = () => {
    if (window.confirm('तुम्हाला लँडिंग पेजसाठी लोकप्रिय सॅम्पल उत्पादने (स्मार्ट टीव्ही, सागवान सोफा, फ्रिज, कपाट इ.) जोडायचे आहेत का?')) {
      const newItems: StockItem[] = SAMPLE_SHOWROOM_PRODUCTS.map((p, idx) => ({
        ...p,
        id: `sample-stk-${Date.now()}-${idx}`,
        purchasePrice: p.purchasePrice,
        salePrice: p.salePrice,
        mrp: p.mrp,
        stockQty: p.stockQty,
        minAlertQty: p.minAlertQty,
        unit: p.unit,
        updatedAt: new Date().toISOString(),
      }));

      const updatedStock = [...newItems, ...storeData.stock];
      const updatedStoreData: StoreData = {
        ...storeData,
        stock: updatedStock,
      };
      StorageService.saveData(updatedStoreData);
      if (onRefreshData) onRefreshData();
      showToast(`${SAMPLE_SHOWROOM_PRODUCTS.length} आकर्षक उत्पादने लँडिंग पेजवर जोडली गेली! 🎉`);
    }
  };

  // ----------------------------------------------------
  // OFFER HANDLERS
  // ----------------------------------------------------
  const handleOpenAddOffer = () => {
    setEditingOffer(null);
    setOfferForm({
      id: `off-${Date.now()}`,
      title: '',
      subtitle: '',
      badge: 'MEGA DEAL',
      discount: '५०% सूट',
      couponCode: 'FESTIVE50',
      validTill: '३१ ऑक्टोबर पर्यंत',
      category: 'Electronics',
      imageUrl: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600&auto=format&fit=crop&q=80',
      whatsappMessage: 'नमस्कार, मला या नवीन ऑफरबद्दल माहिती हवी आहे.',
      active: true,
    });
    setIsOfferModalOpen(true);
  };

  const handleOpenEditOffer = (offer: LandingOffer) => {
    setEditingOffer(offer);
    setOfferForm({ ...offer });
    setIsOfferModalOpen(true);
  };

  const handleSaveOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerForm.title.trim()) {
      alert('कृपया ऑफरचे शीर्षक प्रविष्ट करा.');
      return;
    }

    let updatedOffers: LandingOffer[] = [];
    if (editingOffer) {
      updatedOffers = config.offers.map((o) => (o.id === editingOffer.id ? { ...offerForm } : o));
    } else {
      updatedOffers = [offerForm, ...config.offers];
    }

    const newConfig: LandingPageConfig = {
      ...config,
      offers: updatedOffers,
    };
    setConfig(newConfig);
    handleSaveConfig(newConfig);
    setIsOfferModalOpen(false);
    showToast(editingOffer ? 'ऑफर अपडेट झाली! ✅' : 'नवीन ऑफर लँडिंग पेजवर जोडली गेली! 🎁');
  };

  const handleDeleteOffer = (offerId: string) => {
    if (window.confirm('ही ऑफर हटवायची आहे का?')) {
      const updatedOffers = config.offers.filter((o) => o.id !== offerId);
      const newConfig: LandingPageConfig = {
        ...config,
        offers: updatedOffers,
      };
      setConfig(newConfig);
      handleSaveConfig(newConfig);
      showToast('ऑफर यशस्वीरित्या हटवली! 🗑️');
    }
  };

  const handleToggleOfferActive = (offerId: string) => {
    const updatedOffers = config.offers.map((o) =>
      o.id === offerId ? { ...o, active: !o.active } : o
    );
    const newConfig: LandingPageConfig = {
      ...config,
      offers: updatedOffers,
    };
    setConfig(newConfig);
    handleSaveConfig(newConfig);
  };

  // ----------------------------------------------------
  // HERO SLIDE HANDLERS
  // ----------------------------------------------------
  const handleOpenEditSlide = (slide: LandingHeroSlide) => {
    setEditingSlide(slide);
    setSlideForm({ ...slide });
    setIsSlideModalOpen(true);
  };

  const handleSaveSlide = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slideForm.titleLead.trim() || !slideForm.titleHighlight.trim()) {
      alert('कृपया स्लाईडचे मुख्य शीर्षक भरा.');
      return;
    }

    let updatedSlides: LandingHeroSlide[] = [];
    if (editingSlide) {
      updatedSlides = config.heroSlides.map((s) => (s.id === editingSlide.id ? { ...slideForm } : s));
    } else {
      updatedSlides = [...config.heroSlides, { ...slideForm, id: `slide-${Date.now()}` }];
    }

    const newConfig: LandingPageConfig = {
      ...config,
      heroSlides: updatedSlides,
    };
    setConfig(newConfig);
    handleSaveConfig(newConfig);
    setIsSlideModalOpen(false);
    showToast('हिरो बॅनर स्लाईड अपडेट झाली! 🖼️');
  };

  const handleToggleSlideActive = (slideId: string) => {
    const updatedSlides = config.heroSlides.map((s) =>
      s.id === slideId ? { ...s, active: !s.active } : s
    );
    const newConfig: LandingPageConfig = {
      ...config,
      heroSlides: updatedSlides,
    };
    setConfig(newConfig);
    handleSaveConfig(newConfig);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {saveSuccessMessage && (
        <div className="fixed top-20 right-6 z-50 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-400/40 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span>{saveSuccessMessage}</span>
        </div>
      )}

      {/* TOP HEADER & ACTION BAR */}
      <div className={`p-4 sm:p-6 rounded-3xl border transition-all ${
        isDayMode
          ? 'bg-gradient-to-r from-amber-50 via-white to-amber-50/50 border-amber-200/80 shadow-sm'
          : 'bg-gradient-to-r from-[#17140f] via-[#1f1911] to-[#120f0a] border-amber-500/30 shadow-2xl'
      }`}>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-black flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
              <Store className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  लँडिंग पेज व शोकेस एडिटर
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40 shrink-0">
                  Storefront Manager
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1 shrink-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 sm:line-clamp-none">
                ग्राहकांना दिसणारे मुख्य लँडिंग पेज, उत्पादने, नवीन सणवार ऑफर्स, हिरो बॅनर्स आणि संपर्क माहिती येथे थेट बदला.
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap self-stretch lg:self-auto justify-start lg:justify-end shrink-0">
            <button
              type="button"
              onClick={onOpenCustomerShowroom}
              className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-sky-600/20 cursor-pointer active:scale-95 transition shrink-0 whitespace-nowrap"
              title="ग्राहकांना दिसणारे प्रत्यक्ष लँडिंग पेज नवीन टॅब/व्ह्यूमध्ये उघडा"
            >
              <Eye className="w-4 h-4 text-sky-200" />
              <span>थेट लँडिंग पेज पहा</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </button>

            <button
              type="button"
              onClick={() => handleSaveConfig()}
              className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-amber-500/25 cursor-pointer active:scale-95 transition shrink-0 whitespace-nowrap"
            >
              <Save className="w-4 h-4 text-slate-950" />
              <span>सर्व बदल सेव्ह करा</span>
            </button>

            <button
              type="button"
              onClick={handleResetToDefault}
              className={`p-2 sm:p-2.5 rounded-xl border cursor-pointer transition shrink-0 ${
                isDayMode
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
              }`}
              title="मूळ डिझाइनवर रिसेट करा"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* METRICS STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-200 dark:border-white/10">
          <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
              एकूण उत्पादने
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
              {storeData.stock.length} वस्तू
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
              {storeData.stock.filter((s) => !s.hideOnLanding).length} लँडिंगवर थेट
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
              सक्रिय ऑफर्स (Deals)
            </span>
            <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
              {config.offers.filter((o) => o.active).length} चालू
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              एकूण {config.offers.length} तयार
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
              हिरो स्लाईड्स
            </span>
            <div className="text-xl font-black text-purple-600 dark:text-purple-400 mt-0.5">
              {config.heroSlides.filter((s) => s.active).length} स्लाईड्स
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              ऑटो कॅरोसेल चालू
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
              वरची सूचना पट्टी
            </span>
            <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              {config.announcement?.enabled ? 'सक्रिय' : 'बंद'}
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate block">
              {config.announcement?.badge || 'उत्सव विशेष'}
            </span>
          </div>
        </div>
      </div>

      {/* HORIZONTAL TAB NAVIGATION */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar border-b border-slate-200 dark:border-white/10 scroll-smooth">
        {[
          { id: 'products', label: 'उत्पादने व शोकेस', marathi: 'Products', icon: ShoppingBag, count: storeData.stock.length },
          { id: 'offers', label: 'नवीन ऑफर्स व डील्स', marathi: 'Offers & Deals', icon: Tag, count: config.offers.length },
          { id: 'hero', label: 'हिरो स्लाईडर बॅनर्स', marathi: 'Hero Carousel', icon: Sliders, count: config.heroSlides.length },
          { id: 'announcement', label: 'वरची सूचना पट्टी', marathi: 'Notice Ticker', icon: Bell },
          { id: 'scheme', label: '३०-महिने योजना बॅनर', marathi: 'Scheme Promo', icon: CreditCard },
          { id: 'contact', label: 'पत्ता, संपर्क व वेळ', marathi: 'Contact & Store', icon: Phone },
          { id: 'layout', label: 'विभाग दृश्यमानता (Layout)', marathi: 'Section Visibility', icon: Layers },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as EditorSubTab)}
              className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 shrink-0 whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                  : isDayMode
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] shrink-0 ${
                  isActive ? 'bg-black text-amber-300' : 'bg-black/20 text-slate-400'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 1. PRODUCTS MANAGEMENT TAB                                                */}
      {/* ========================================================================= */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          {/* Products Control Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="उत्पादन नाव, ब्रँड, बॅज शोधा..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs sm:text-sm border outline-none transition ${
                  isDayMode
                    ? 'bg-white border-slate-300 text-slate-800 focus:border-amber-500'
                    : 'bg-[#151921] border-slate-700 text-white focus:border-amber-500'
                }`}
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {['All', 'Electronics', 'Furniture', 'Home Appliances', 'Other'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedProductCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                    selectedProductCategory === cat
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : isDayMode
                      ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      : 'bg-white/10 text-slate-300 hover:bg-white/15'
                  }`}
                >
                  {cat === 'All' ? 'सर्व' : cat}
                </button>
              ))}
            </div>

            {/* Add & Sample Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleOpenAddProduct}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md cursor-pointer whitespace-nowrap active:scale-95 transition"
              >
                <Plus className="w-4 h-4" />
                <span>+ नवीन उत्पादन जोडा</span>
              </button>

              <button
                type="button"
                onClick={handleLoadSampleProducts}
                className={`px-3 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition ${
                  isDayMode
                    ? 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                }`}
                title="लोकप्रिय सॅम्पल उत्पादने (टीव्ही, सोफा, दिवाण, फ्रिज) जोडा"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>सॅम्पल स्टॉक जोडा</span>
              </button>
            </div>
          </div>

          {/* Product Grid */}
          {filteredProducts.length === 0 ? (
            <div className="py-16 text-center rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-black/5 dark:bg-white/5 p-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto text-2xl">
                🛍️
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-lg text-slate-800 dark:text-white">
                  कोणतीही उत्पादने सापडली नाहीत
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  तुमच्या लँडिंग पेजवर ग्राहकांना दाखवण्यासाठी वरील "+ नवीन उत्पादन जोडा" बटनावर क्लिक करा किंवा "सॅम्पल स्टॉक जोडा" निवडा.
                </p>
              </div>
              <button
                type="button"
                onClick={handleLoadSampleProducts}
                className="px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs shadow-lg hover:bg-amber-400 cursor-pointer transition active:scale-95"
              >
                सॅम्पल उत्पादने आता लोड करा
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map((prod) => {
                const genuineImg = prod.imageUrl || getGenuineProductImage(prod);
                const isHidden = prod.hideOnLanding;
                const isFeatured = prod.isFeaturedOnLanding;
                const discount = prod.mrp > prod.salePrice ? Math.round(((prod.mrp - prod.salePrice) / prod.mrp) * 100) : 0;

                return (
                  <div
                    key={prod.id}
                    className={`rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col justify-between group ${
                      isHidden
                        ? 'opacity-60 bg-slate-900/40 border-dashed border-slate-700'
                        : isDayMode
                        ? 'bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-amber-400'
                        : 'bg-[#151922] border-slate-800 hover:border-amber-500/60 shadow-lg'
                    }`}
                  >
                    {/* Top Image Frame */}
                    <div className="relative h-44 bg-[#0d1117] p-2 flex items-center justify-center overflow-hidden border-b border-slate-200 dark:border-slate-800">
                      <img
                        src={genuineImg}
                        alt={prod.name}
                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />

                      {/* Brand & Category */}
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-black uppercase bg-black/80 text-amber-300 border border-slate-700">
                        {prod.brand} • {prod.category}
                      </span>

                      {/* Landing Badge */}
                      {prod.landingBadge && (
                        <span className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-black bg-rose-600 text-white shadow">
                          {prod.landingBadge}
                        </span>
                      )}

                      {/* Visibility Overlay Flag if Hidden */}
                      {isHidden && (
                        <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-slate-300 text-xs font-bold gap-1.5">
                          <span>लँडिंगवर लपवले आहे (Hidden)</span>
                        </div>
                      )}
                    </div>

                    {/* Card Content */}
                    <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] text-slate-400 font-mono">
                            {prod.code}
                          </span>
                          {isFeatured && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500 dark:text-amber-300 text-[10px] font-bold border border-amber-500/40">
                              ⭐ मुख्य हायलाइट
                            </span>
                          )}
                        </div>

                        <h4
                          className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 line-clamp-2 mt-1 leading-snug"
                          title={prod.name}
                        >
                          {prod.name}
                        </h4>

                        {prod.model && (
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            मॉडेल: {prod.model}
                          </span>
                        )}
                      </div>

                      {/* Pricing & Scheme Pill */}
                      <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-white/5">
                        <div className="flex items-baseline justify-between">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                              ₹{prod.salePrice.toLocaleString('en-IN')}
                            </span>
                            {prod.mrp > prod.salePrice && (
                              <span className="text-[11px] line-through text-slate-400">
                                ₹{prod.mrp.toLocaleString('en-IN')}
                              </span>
                            )}
                          </div>
                          {discount > 0 && (
                            <span className="text-[10px] font-black text-rose-500">
                              {discount}% OFF
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-amber-500 dark:text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-md">
                          <span>३०-महिने हप्ता:</span>
                          <span>₹{prod.schemeWeeklyAmount || 100} / आठवडा</span>
                        </div>
                      </div>

                      {/* Action Bar */}
                      <div className="flex items-center justify-between gap-1 pt-2">
                        <button
                          type="button"
                          onClick={() => handleToggleProductVisibility(prod.id, !!prod.hideOnLanding)}
                          className={`p-1.5 rounded-lg border text-xs cursor-pointer transition ${
                            isHidden
                              ? 'bg-slate-800 text-slate-400 hover:text-white border-slate-700'
                              : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                          }`}
                          title={isHidden ? 'लँडिंगवर दाखवा' : 'लँडिंगवरून लपवा'}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleFeatured(prod.id, !!prod.isFeaturedOnLanding)}
                          className={`p-1.5 rounded-lg border text-xs cursor-pointer transition ${
                            isFeatured
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                              : 'bg-black/10 dark:bg-white/5 text-slate-400 hover:text-amber-400 border-transparent'
                          }`}
                          title="स्टार / मुख्य हायलाइट म्हणून दाखवा"
                        >
                          ⭐
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditProduct(prod)}
                            className="px-2.5 py-1 rounded-lg bg-sky-600/20 hover:bg-sky-600/30 text-sky-400 border border-sky-500/30 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>बदला</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(prod.id)}
                            className="p-1 rounded-lg text-rose-400 hover:bg-rose-500/20 cursor-pointer transition"
                            title="हटवा"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. OFFERS & DEALS TAB                                                     */}
      {/* ========================================================================= */}
      {activeTab === 'offers' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                लँडिंग पेज ऑफर्स व सवलती (Promotional Offers)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                येथील ऑफर्स ग्राहकांना लँडिंग पेजवर थेट दिसतात व ग्राहक एका क्लिकवर WhatsApp द्वारे चौकशी करू शकतात.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenAddOffer}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-md cursor-pointer active:scale-95 transition"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              <span>+ नवीन ऑफर तयार करा</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {config.offers.map((offer) => (
              <div
                key={offer.id}
                className={`p-4 rounded-3xl border transition-all flex flex-col justify-between ${
                  !offer.active
                    ? 'opacity-60 bg-black/10 dark:bg-white/5 border-slate-700'
                    : isDayMode
                    ? 'bg-white border-amber-200/90 shadow-sm hover:border-amber-400'
                    : 'bg-[#151922] border-amber-500/30 hover:border-amber-400 shadow-xl'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  {offer.imageUrl && (
                    <img
                      src={offer.imageUrl}
                      alt={offer.title}
                      className="w-20 h-20 rounded-2xl object-cover border border-slate-700 shrink-0"
                    />
                  )}

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-rose-600 text-white">
                        {offer.badge}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        {offer.category}
                      </span>
                      {offer.couponCode && (
                        <span className="px-1.5 py-0.5 rounded font-mono text-[10px] bg-slate-800 text-slate-200">
                          {offer.couponCode}
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                      {offer.title}
                    </h4>

                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                      {offer.subtitle}
                    </p>

                    <div className="text-[11px] text-emerald-500 font-bold flex items-center gap-2 pt-1">
                      <span>सवलत: {offer.discount}</span>
                      <span>• मुदत: {offer.validTill}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-3 mt-3 border-t border-slate-200 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => handleToggleOfferActive(offer.id)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition ${
                      offer.active
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${offer.active ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                    <span>{offer.active ? 'सक्रिय (Live)' : 'बंद (Off)'}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEditOffer(offer)}
                      className="px-3 py-1 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 text-sky-400 border border-sky-500/30 text-xs font-bold flex items-center gap-1 cursor-pointer transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>बदला</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteOffer(offer.id)}
                      className="p-1 rounded-lg text-rose-400 hover:bg-rose-500/20 cursor-pointer transition"
                      title="हटवा"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. HERO SLIDER BANNERS TAB                                                */}
      {/* ========================================================================= */}
      {activeTab === 'hero' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                हिरो स्लाईडर बॅनर्स (Top Carousel Slides)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                लँडिंग पेजच्या अगदी वर दिसणारे ३ मुख्य मोठे सिनेमॅटिक बॅनर्स.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {config.heroSlides.map((slide, index) => (
              <div
                key={slide.id}
                className={`p-4 sm:p-5 rounded-3xl border transition-all ${
                  isDayMode
                    ? 'bg-white border-slate-200 shadow-sm'
                    : 'bg-[#151922] border-slate-800 shadow-xl'
                }`}
              >
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="relative w-28 h-20 sm:w-36 sm:h-24 rounded-2xl overflow-hidden shrink-0 border border-slate-700">
                      <img
                        src={slide.imageUrl}
                        alt={slide.titleLead}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-bold text-amber-300">
                        Slide {index + 1}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500/20 text-amber-400 border border-amber-500/40">
                        {slide.tag}
                      </span>

                      <h4 className="font-black text-base sm:text-lg text-slate-900 dark:text-white">
                        {slide.titleLead}{' '}
                        <span className="text-amber-500">{slide.titleHighlight}</span>
                      </h4>

                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                        {slide.subtitle}
                      </p>

                      <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400 flex-wrap">
                        <span className="text-emerald-400 font-bold">✓ {slide.cardMetric}</span>
                        <span>•</span>
                        <span className="text-amber-400 font-bold">✓ {slide.cardMetric2}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end lg:self-center">
                    <button
                      type="button"
                      onClick={() => handleToggleSlideActive(slide.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition ${
                        slide.active
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {slide.active ? 'सक्रिय (Live)' : 'बंद (Off)'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEditSlide(slide)}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow cursor-pointer transition active:scale-95"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>स्लाईड एडिट करा</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. ANNOUNCEMENT TICKER TAB                                                */}
      {/* ========================================================================= */}
      {activeTab === 'announcement' && (
        <div className={`p-5 sm:p-6 rounded-3xl border space-y-4 ${
          isDayMode ? 'bg-white border-slate-200' : 'bg-[#151922] border-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                लँडिंग पेज वरची सूचना पट्टी (Top Announcement Ticker)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ग्राहकांना आकर्षित करण्यासाठी लँडिंग पेजच्या सर्वात वर धावणारी उत्सव घोषणा.
              </p>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.announcement?.enabled ?? true}
                onChange={(e) => {
                  const newConfig = {
                    ...config,
                    announcement: {
                      ...config.announcement,
                      enabled: e.target.checked,
                    },
                  };
                  setConfig(newConfig);
                  handleSaveConfig(newConfig);
                }}
                className="w-4 h-4 text-amber-500 rounded focus:ring-amber-400 cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-800 dark:text-white">
                सूचना पट्टी दाखवा
              </span>
            </label>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                बॅज मजकूर (Badge Text):
              </label>
              <input
                type="text"
                value={config.announcement?.badge || ''}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    announcement: { ...config.announcement, badge: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm bg-black/5 dark:bg-black/30 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-amber-500"
                placeholder="उदा. 🌟 उत्सव विशेष ऑफर"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                मुख्य घोषणा मजकूर (Announcement Headline):
              </label>
              <textarea
                rows={2}
                value={config.announcement?.text || ''}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    announcement: { ...config.announcement, text: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm bg-black/5 dark:bg-black/30 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-amber-500"
                placeholder="उदा. श्री साई एंटरप्रायझेस - वर्धा | भव्य दसरा-दिवाळी महासेल सुरू आहे! सर्व उत्पादनांवर ०% व्याज EMI आणि मोफत होम डिलिव्हरी!"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                हायलाइट टीप (Highlight Note):
              </label>
              <input
                type="text"
                value={config.announcement?.highlightText || ''}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    announcement: { ...config.announcement, highlightText: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm bg-black/5 dark:bg-black/30 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-amber-500"
                placeholder="उदा. सविस्तर माहितीसाठी थेट संपर्क साधा"
              />
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => handleSaveConfig()}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow cursor-pointer transition active:scale-95"
              >
                <Save className="w-4 h-4 text-slate-950" />
                <span>सूचना पट्टी सेव्ह करा</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. 30-MONTH SCHEME BANNER TAB                                             */}
      {/* ========================================================================= */}
      {activeTab === 'scheme' && (
        <div className={`p-5 sm:p-6 rounded-3xl border space-y-4 ${
          isDayMode ? 'bg-white border-slate-200' : 'bg-[#151922] border-slate-800'
        }`}>
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              ३०-महिने साप्ताहिक बचत योजना बॅनर एडिटर
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              लँडिंग पेजवर दिसणाऱ्या ₹१०० / ₹२०० बचत योजना आणि लकी ड्रॉ बॅनर्सचा मजकूर येथून बदला.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                बॅनर मुख्य शीर्षक (Headline):
              </label>
              <input
                type="text"
                value={config.schemeBanner?.title || ''}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    schemeBanner: { ...config.schemeBanner, title: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm bg-black/5 dark:bg-black/30 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                बॅनर उपशीर्षक व नियम (Description):
              </label>
              <textarea
                rows={3}
                value={config.schemeBanner?.subtitle || ''}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    schemeBanner: { ...config.schemeBanner, subtitle: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm bg-black/5 dark:bg-black/30 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  हप्ता बॅज १:
                </label>
                <input
                  type="text"
                  value={config.schemeBanner?.weeklyBadge1 || ''}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      schemeBanner: { ...config.schemeBanner, weeklyBadge1: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border text-xs bg-black/5 dark:bg-black/30 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  हप्ता बॅज २:
                </label>
                <input
                  type="text"
                  value={config.schemeBanner?.weeklyBadge2 || ''}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      schemeBanner: { ...config.schemeBanner, weeklyBadge2: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border text-xs bg-black/5 dark:bg-black/30 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => handleSaveConfig()}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow cursor-pointer transition active:scale-95"
              >
                <Save className="w-4 h-4 text-slate-950" />
                <span>योजना बॅनर सेव्ह करा</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. CONTACT & LOCATION TAB                                                 */}
      {/* ========================================================================= */}
      {activeTab === 'contact' && (
        <div className={`p-5 sm:p-6 rounded-3xl border space-y-4 ${
          isDayMode ? 'bg-white border-slate-200' : 'bg-[#151922] border-slate-800'
        }`}>
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              दुकान पत्ता, संपर्क क्रमांक व वेळ (Showroom Contacts & Location)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              लँडिंग पेजवर दिसणारे ३ मुख्य हेल्पलाईन नंबर आणि दुकान पत्ता येथे एडिट करा.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                हेल्पलाईन १ (Call & WhatsApp):
              </label>
              <input
                type="text"
                value={config.contactInfo?.helpline1 || ''}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    contactInfo: { ...config.contactInfo, helpline1: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm bg-black/5 dark:bg-black/30 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                placeholder="8766486915"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                हेल्पलाईन २:
              </label>
              <input
                type="text"
                value={config.contactInfo?.helpline2 || ''}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    contactInfo: { ...config.contactInfo, helpline2: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm bg-black/5 dark:bg-black/30 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                placeholder="9822467147"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                हेल्पलाईन ३:
              </label>
              <input
                type="text"
                value={config.contactInfo?.helpline3 || ''}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    contactInfo: { ...config.contactInfo, helpline3: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm bg-black/5 dark:bg-black/30 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                placeholder="7057962456"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                WhatsApp ऑर्डर नंबर (बिना + किंवा 0):
              </label>
              <input
                type="text"
                value={config.contactInfo?.whatsappNumber || ''}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    contactInfo: { ...config.contactInfo, whatsappNumber: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm bg-black/5 dark:bg-black/30 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                placeholder="918600122978"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                दुकान वेळ (Store Timings):
              </label>
              <input
                type="text"
                value={config.contactInfo?.timings || ''}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    contactInfo: { ...config.contactInfo, timings: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm bg-black/5 dark:bg-black/30 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                placeholder="सकाळी १०:०० ते रात्री ९:०० (सर्व दिवस सुरू)"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              दुकान संपूर्ण पत्ता (Showroom Full Address):
            </label>
            <input
              type="text"
              value={config.contactInfo?.addressHindi || ''}
              onChange={(e) =>
                setConfig({
                  ...config,
                  contactInfo: { ...config.contactInfo, addressHindi: e.target.value },
                })
              }
              className="w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm bg-black/5 dark:bg-black/30 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
              placeholder="दुकान क्र. १ व २, मुख्य बाजारपेठ, छत्रपती शिवाजी महाराज चौक जवळ, वर्धा - ४४२००१"
            />
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => handleSaveConfig()}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow cursor-pointer transition active:scale-95"
            >
              <Save className="w-4 h-4 text-slate-950" />
              <span>संपर्क माहिती सेव्ह करा</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. LAYOUT & SECTION VISIBILITY TAB                                        */}
      {/* ========================================================================= */}
      {activeTab === 'layout' && (
        <div className={`p-5 sm:p-7 rounded-3xl border space-y-6 ${
          isDayMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#151922] border-slate-800'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-white/10">
            <div>
              <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-500" />
                <span>लँडिंग पेजवरील विभाग दृश्यमानता (Showroom Sections Visibility)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                ग्राहकांना कोणते विभाग दाखवायचे आणि कोणते लपवायचे हे येथून १ क्लिकमध्ये नियंत्रित करा. अनावश्यक माहिती बंद ठेवा.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleSaveConfig()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow cursor-pointer transition active:scale-95 shrink-0"
            >
              <Save className="w-4 h-4 text-slate-950" />
              <span>लेआउट सेव्ह करा</span>
            </button>
          </div>

          {/* Toggle Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* 1. Announcement Strip */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
              config.enableAnnouncementBar !== false
                ? isDayMode ? 'bg-emerald-50/60 border-emerald-300' : 'bg-emerald-950/20 border-emerald-500/30'
                : isDayMode ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-black/20 border-slate-800 opacity-60'
            }`}>
              <div className="space-y-0.5">
                <span className="font-bold text-sm text-slate-900 dark:text-white block">
                  १. वरची सूचना व संपर्क पट्टी (Top Notice Strip)
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  हेडरच्या वर छोटी पट्टी — फेस्टिव्हल ग्रीटिंग, घोषणा व WhatsApp लिंक.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const updated = { ...config, enableAnnouncementBar: config.enableAnnouncementBar === false ? true : false };
                  setConfig(updated);
                  handleSaveConfig(updated);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
                  config.enableAnnouncementBar !== false
                    ? 'bg-emerald-600 text-white shadow'
                    : 'bg-slate-300 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                }`}
              >
                {config.enableAnnouncementBar !== false ? 'चालू (ON)' : 'बंद (OFF)'}
              </button>
            </div>

            {/* 2. Hero Slider */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
              config.showHeroSection !== false
                ? isDayMode ? 'bg-emerald-50/60 border-emerald-300' : 'bg-emerald-950/20 border-emerald-500/30'
                : isDayMode ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-black/20 border-slate-800 opacity-60'
            }`}>
              <div className="space-y-0.5">
                <span className="font-bold text-sm text-slate-900 dark:text-white block">
                  २. मुख्य हिरो स्लाईडर बॅनर्स (Hero Slider)
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  मोठे सिनेमॅटिक फोटो बॅनर्स व कॉल-टू-ॲक्शन बटणे.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const updated = { ...config, showHeroSection: config.showHeroSection === false ? true : false };
                  setConfig(updated);
                  handleSaveConfig(updated);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
                  config.showHeroSection !== false
                    ? 'bg-emerald-600 text-white shadow'
                    : 'bg-slate-300 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                }`}
              >
                {config.showHeroSection !== false ? 'चालू (ON)' : 'बंद (OFF)'}
              </button>
            </div>

            {/* 3. Hot Deals & Offers */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
              config.enableOffersSection !== false
                ? isDayMode ? 'bg-emerald-50/60 border-emerald-300' : 'bg-emerald-950/20 border-emerald-500/30'
                : isDayMode ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-black/20 border-slate-800 opacity-60'
            }`}>
              <div className="space-y-0.5">
                <span className="font-bold text-sm text-slate-900 dark:text-white block">
                  ३. सणासुदीच्या ऑफर्स व डील्स (Live Hot Deals)
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  दिवाळी/दसरा विशेष डिस्काउंट कार्ड्स व कूपन ऑफर्स.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const updated = { ...config, enableOffersSection: config.enableOffersSection === false ? true : false };
                  setConfig(updated);
                  handleSaveConfig(updated);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
                  config.enableOffersSection !== false
                    ? 'bg-emerald-600 text-white shadow'
                    : 'bg-slate-300 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                }`}
              >
                {config.enableOffersSection !== false ? 'चालू (ON)' : 'बंद (OFF)'}
              </button>
            </div>

            {/* 4. Scheme Promo Banner */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
              config.showSchemeBanner !== false
                ? isDayMode ? 'bg-emerald-50/60 border-emerald-300' : 'bg-emerald-950/20 border-emerald-500/30'
                : isDayMode ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-black/20 border-slate-800 opacity-60'
            }`}>
              <div className="space-y-0.5">
                <span className="font-bold text-sm text-slate-900 dark:text-white block">
                  ४. ३०-महिने बचत योजना बॅनर (Scheme USP Banner)
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  दर आठवड्याला ₹१००/₹२०० बचत आणि मासिक लकी सोडत माहिती.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const updated = { ...config, showSchemeBanner: config.showSchemeBanner === false ? true : false };
                  setConfig(updated);
                  handleSaveConfig(updated);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
                  config.showSchemeBanner !== false
                    ? 'bg-emerald-600 text-white shadow'
                    : 'bg-slate-300 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                }`}
              >
                {config.showSchemeBanner !== false ? 'चालू (ON)' : 'बंद (OFF)'}
              </button>
            </div>

            {/* 5. Passbook Lookup Section */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
              config.showPassbookSection !== false
                ? isDayMode ? 'bg-emerald-50/60 border-emerald-300' : 'bg-emerald-950/20 border-emerald-500/30'
                : isDayMode ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-black/20 border-slate-800 opacity-60'
            }`}>
              <div className="space-y-0.5">
                <span className="font-bold text-sm text-slate-900 dark:text-white block">
                  ५. ऑनलाइन पासबुक शोध पोर्टल (Passbook Lookup)
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  ग्राहकांना कार्ड नंबर/मोबाईल नंबर टाकून हप्ते तपासण्याचा विभाग (योजनेखाली).
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const updated = { ...config, showPassbookSection: config.showPassbookSection === false ? true : false };
                  setConfig(updated);
                  handleSaveConfig(updated);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
                  config.showPassbookSection !== false
                    ? 'bg-emerald-600 text-white shadow'
                    : 'bg-slate-300 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                }`}
              >
                {config.showPassbookSection !== false ? 'चालू (ON)' : 'बंद (OFF)'}
              </button>
            </div>

            {/* 6. Google Reviews & Store Location */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
              config.showReviewsSection !== false
                ? isDayMode ? 'bg-emerald-50/60 border-emerald-300' : 'bg-emerald-950/20 border-emerald-500/30'
                : isDayMode ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-black/20 border-slate-800 opacity-60'
            }`}>
              <div className="space-y-0.5">
                <span className="font-bold text-sm text-slate-900 dark:text-white block">
                  ६. गुगल रिव्ह्यू व शोरूम माहिती (Google Reviews & Storefront)
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  ४.९ स्टार गुगल रेटिंग, शोरूम फोटो, दिशा, संपर्क व ग्राहकांचे अनुभव.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const updated = { ...config, showReviewsSection: config.showReviewsSection === false ? true : false };
                  setConfig(updated);
                  handleSaveConfig(updated);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
                  config.showReviewsSection !== false
                    ? 'bg-emerald-600 text-white shadow'
                    : 'bg-slate-300 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                }`}
              >
                {config.showReviewsSection !== false ? 'चालू (ON)' : 'बंद (OFF)'}
              </button>
            </div>

            {/* 7. Dedicated Electronics Landing Section */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
              config.showElectronicsSection === true
                ? isDayMode ? 'bg-emerald-50/60 border-emerald-300' : 'bg-emerald-950/20 border-emerald-500/30'
                : isDayMode ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-black/20 border-slate-800 opacity-60'
            }`}>
              <div className="space-y-0.5">
                <span className="font-bold text-sm text-slate-900 dark:text-white block">
                  ७. इलेक्ट्रॉनिक्स विशेष विभाग (Dedicated Electronics Showcase)
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  टीव्ही, फ्रिज, वॉशिंग मशीनचा स्वतंत्र सेक्शन (कॅटलॉगमध्ये आधीच असल्यास बंद ठेवणे योग्य).
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const updated = { ...config, showElectronicsSection: !config.showElectronicsSection };
                  setConfig(updated);
                  handleSaveConfig(updated);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
                  config.showElectronicsSection === true
                    ? 'bg-emerald-600 text-white shadow'
                    : 'bg-slate-300 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                }`}
              >
                {config.showElectronicsSection === true ? 'चालू (ON)' : 'बंद (OFF)'}
              </button>
            </div>

            {/* 8. Dedicated Furniture Landing Section */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
              config.showFurnitureSection === true
                ? isDayMode ? 'bg-emerald-50/60 border-emerald-300' : 'bg-emerald-950/20 border-emerald-500/30'
                : isDayMode ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-black/20 border-slate-800 opacity-60'
            }`}>
              <div className="space-y-0.5">
                <span className="font-bold text-sm text-slate-900 dark:text-white block">
                  ८. फर्निचर विशेष विभाग (Dedicated Furniture Showcase)
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  सोफा, दिवाण, कपाटचा स्वतंत्र सेक्शन (कॅटलॉगमध्ये आधीच असल्यास बंद ठेवणे योग्य).
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const updated = { ...config, showFurnitureSection: !config.showFurnitureSection };
                  setConfig(updated);
                  handleSaveConfig(updated);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
                  config.showFurnitureSection === true
                    ? 'bg-emerald-600 text-white shadow'
                    : 'bg-slate-300 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                }`}
              >
                {config.showFurnitureSection === true ? 'चालू (ON)' : 'बंद (OFF)'}
              </button>
            </div>

            {/* 9. Upfront Address Banner */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
              config.showAddressBanner === true
                ? isDayMode ? 'bg-emerald-50/60 border-emerald-300' : 'bg-emerald-950/20 border-emerald-500/30'
                : isDayMode ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-black/20 border-slate-800 opacity-60'
            }`}>
              <div className="space-y-0.5">
                <span className="font-bold text-sm text-slate-900 dark:text-white block">
                  ९. समोरचा मोठा पत्ता बॅनर (Upfront Address Box)
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  उत्पादनांच्या वर येणारा पत्ता बॅनर (गुगल रिव्ह्यू व फुटरमध्ये आधीच पत्ता असल्याने डिफॉल्ट बंद ठेवला आहे).
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const updated = { ...config, showAddressBanner: !config.showAddressBanner };
                  setConfig(updated);
                  handleSaveConfig(updated);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
                  config.showAddressBanner === true
                    ? 'bg-emerald-600 text-white shadow'
                    : 'bg-slate-300 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                }`}
              >
                {config.showAddressBanner === true ? 'चालू (ON)' : 'बंद (OFF)'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT PRODUCT                                                 */}
      {/* ========================================================================= */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className={`w-full max-w-xl rounded-3xl border p-5 sm:p-6 space-y-4 shadow-2xl my-8 transition-all ${
            isDayMode ? 'bg-white border-slate-200' : 'bg-[#151922] border-slate-700'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
              <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-500" />
                <span>{editingProduct ? 'उत्पादन एडिट करा' : 'नवीन उत्पादन लँडिंग पेजवर जोडा'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="w-8 h-8 rounded-full bg-black/10 dark:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  उत्पादनाचे नाव (Product Title)*:
                </label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="उदा. Samsung 55-inch Crystal 4K UHD Smart TV किंवा Pure Teak Sofa"
                  className="w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm bg-black/5 dark:bg-black/30 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-amber-500 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    कॅटेगरी (Category)*:
                  </label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border text-xs bg-black/5 dark:bg-black/30 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                  >
                    <option value="Electronics">Electronics (स्मार्ट टीव्ही, साउंडबार)</option>
                    <option value="Furniture">Furniture (सागवान सोफा, दिवाण, कपाट)</option>
                    <option value="Home Appliances">Home Appliances (फ्रिज, वॉशिंग मशीन, कुलर)</option>
                    <option value="Kitchen Appliances">Kitchen Appliances</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ब्रँड (Brand):
                  </label>
                  <input
                    type="text"
                    value={productForm.brand}
                    onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                    placeholder="Samsung, LG, Sony, Sai Craft"
                    className="w-full px-3 py-2 rounded-xl border text-xs bg-black/5 dark:bg-black/30 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    M.R.P. (₹):
                  </label>
                  <input
                    type="number"
                    value={productForm.mrp || ''}
                    onChange={(e) => setProductForm({ ...productForm, mrp: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border text-xs bg-black/5 dark:bg-black/30 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ऑफर विक्री दर (Sale Price ₹)*:
                  </label>
                  <input
                    type="number"
                    required
                    value={productForm.salePrice || ''}
                    onChange={(e) => setProductForm({ ...productForm, salePrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-black text-emerald-500 bg-black/5 dark:bg-black/30 border-slate-300 dark:border-slate-700 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    साप्ताहिक हप्ता (₹):
                  </label>
                  <input
                    type="number"
                    value={productForm.schemeWeeklyAmount || ''}
                    onChange={(e) => setProductForm({ ...productForm, schemeWeeklyAmount: Number(e.target.value) })}
                    placeholder="100 किंवा 200"
                    className="w-full px-3 py-2 rounded-xl border text-xs bg-black/5 dark:bg-black/30 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  लँडिंग बॅज (उदा. ५०% सूट / बेस्ट सेलर / दिवाळी स्पेशल):
                </label>
                <input
                  type="text"
                  value={productForm.landingBadge}
                  onChange={(e) => setProductForm({ ...productForm, landingBadge: e.target.value })}
                  placeholder="उदा. ५०% सूट, फॅक्टरी डायरेक्ट, नवीन आगमन"
                  className="w-full px-3.5 py-2.5 rounded-xl border text-xs bg-black/5 dark:bg-black/30 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  उत्पादन फोटो (Image URL):
                </label>
                <input
                  type="text"
                  value={productForm.imageUrl}
                  onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                  placeholder="https://... किंवा खालीलपैकी प्रीसेट निवडा"
                  className="w-full px-3.5 py-2 rounded-xl border text-xs bg-black/5 dark:bg-black/30 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                />

                {/* Photo Presets for Easy 1-Tap Pick */}
                <div className="mt-2 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block">
                    क्विक फोटो प्रीसेट्स (१-क्लिकने निवडा):
                  </span>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                    {[
                      { label: 'Smart 4K TV', url: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&auto=format&fit=crop&q=80' },
                      { label: 'Teak Sofa', url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop&q=80' },
                      { label: 'Diwan Cot', url: 'https://images.unsplash.com/photo-1540518614846-7ede433c4ef0?w=800&auto=format&fit=crop&q=80' },
                      { label: 'Refrigerator', url: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=800&auto=format&fit=crop&q=80' },
                      { label: 'Steel Almirah', url: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800&auto=format&fit=crop&q=80' },
                      { label: 'Washing Machine', url: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=800&auto=format&fit=crop&q=80' },
                      { label: 'Cooler', url: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=800&auto=format&fit=crop&q=80' },
                    ].map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => setProductForm({ ...productForm, imageUrl: p.url })}
                        className="px-2.5 py-1 rounded-lg bg-black/10 dark:bg-white/10 hover:bg-amber-500 hover:text-black text-[10px] font-bold text-slate-300 transition cursor-pointer whitespace-nowrap"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  वर्णन (Description):
                </label>
                <textarea
                  rows={2}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="वस्तूची वैशिष्ट्ये, वॉरंटी, मोफत डिलिव्हरी बाबत..."
                  className="w-full px-3.5 py-2 rounded-xl border text-xs bg-black/5 dark:bg-black/30 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div className="flex items-center justify-between gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={productForm.isFeaturedOnLanding}
                    onChange={(e) => setProductForm({ ...productForm, isFeaturedOnLanding: e.target.checked })}
                    className="w-4 h-4 text-amber-500 rounded"
                  />
                  <span>⭐ मुख्य लँडिंग हायलाइट (Featured)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={productForm.hideOnLanding}
                    onChange={(e) => setProductForm({ ...productForm, hideOnLanding: e.target.checked })}
                    className="w-4 h-4 text-rose-500 rounded"
                  />
                  <span>लँडिंगवरून लपवा (Hide)</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
                >
                  रद्द करा
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-1.5 shadow cursor-pointer active:scale-95 transition"
                >
                  <Save className="w-4 h-4 text-slate-950" />
                  <span>उत्पादन सेव्ह करा</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT OFFER                                                   */}
      {/* ========================================================================= */}
      {isOfferModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className={`w-full max-w-lg rounded-3xl border p-5 sm:p-6 space-y-4 shadow-2xl my-8 ${
            isDayMode ? 'bg-white border-slate-200' : 'bg-[#151922] border-slate-700'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
              <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <Tag className="w-5 h-5 text-amber-500" />
                <span>{editingOffer ? 'ऑफर एडिट करा' : 'नवीन सणवार / मेगा ऑफर जोडा'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsOfferModalOpen(false)}
                className="w-8 h-8 rounded-full bg-black/10 dark:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveOffer} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ऑफरचे शीर्षक (Offer Headline)*:
                </label>
                <input
                  type="text"
                  required
                  value={offerForm.title}
                  onChange={(e) => setOfferForm({ ...offerForm, title: e.target.value })}
                  placeholder="उदा. स्मार्ट 4K टीव्हीवर ५०% पर्यंत थेट सूट"
                  className="w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm bg-black/5 dark:bg-black/30 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-amber-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  उपशीर्षक / सविस्तर माहिती (Subtitle)*:
                </label>
                <textarea
                  rows={2}
                  required
                  value={offerForm.subtitle}
                  onChange={(e) => setOfferForm({ ...offerForm, subtitle: e.target.value })}
                  placeholder="उदा. Samsung, Sony, LG स्मार्ट टीव्हीवर बंपर डिस्काउंट + मोफत वॉल माउंटिंग."
                  className="w-full px-3.5 py-2 rounded-xl border text-xs bg-black/5 dark:bg-black/30 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    बॅज (Badge Text):
                  </label>
                  <input
                    type="text"
                    value={offerForm.badge}
                    onChange={(e) => setOfferForm({ ...offerForm, badge: e.target.value })}
                    placeholder="MEGA DEAL, मोफत भेट, 0% EMI"
                    className="w-full px-3 py-2 rounded-xl border text-xs bg-black/5 dark:bg-black/30 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    सवलत रक्कम / टक्केवारी:
                  </label>
                  <input
                    type="text"
                    value={offerForm.discount}
                    onChange={(e) => setOfferForm({ ...offerForm, discount: e.target.value })}
                    placeholder="५०% पर्यंत सूट, ₹5,000 OFF"
                    className="w-full px-3 py-2 rounded-xl border text-xs bg-black/5 dark:bg-black/30 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none font-bold text-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    कूपन कोड (असल्यास):
                  </label>
                  <input
                    type="text"
                    value={offerForm.couponCode || ''}
                    onChange={(e) => setOfferForm({ ...offerForm, couponCode: e.target.value })}
                    placeholder="SAI4KTV, DIWALI2026"
                    className="w-full px-3 py-2 rounded-xl border text-xs font-mono bg-black/5 dark:bg-black/30 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    मुदत (Valid Till):
                  </label>
                  <input
                    type="text"
                    value={offerForm.validTill}
                    onChange={(e) => setOfferForm({ ...offerForm, validTill: e.target.value })}
                    placeholder="उदा. ३१ ऑक्टोबर पर्यंत"
                    className="w-full px-3 py-2 rounded-xl border text-xs bg-black/5 dark:bg-black/30 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    कॅटेगरी:
                  </label>
                  <select
                    value={offerForm.category}
                    onChange={(e) => setOfferForm({ ...offerForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border text-xs bg-black/5 dark:bg-black/30 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                  >
                    <option value="All">All Categories (सर्व)</option>
                    <option value="Electronics">Electronics (टीव्ही, ऑडिओ)</option>
                    <option value="Furniture">Furniture (सोफा, दिवाण)</option>
                    <option value="Appliances">Appliances (फ्रिज, कुलर)</option>
                    <option value="Scheme">Scheme (३०-महिने योजना)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ऑफर फोटो (Image URL):
                  </label>
                  <input
                    type="text"
                    value={offerForm.imageUrl || ''}
                    onChange={(e) => setOfferForm({ ...offerForm, imageUrl: e.target.value })}
                    placeholder="https://images.unsplash..."
                    className="w-full px-3 py-2 rounded-xl border text-xs bg-black/5 dark:bg-black/30 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={offerForm.active}
                    onChange={(e) => setOfferForm({ ...offerForm, active: e.target.checked })}
                    className="w-4 h-4 text-emerald-500 rounded"
                  />
                  <span>ही ऑफर लँडिंग पेजवर त्वरित चालू ठेवा (Active)</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsOfferModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
                >
                  रद्द करा
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-1.5 shadow cursor-pointer active:scale-95 transition"
                >
                  <Save className="w-4 h-4 text-slate-950" />
                  <span>ऑफर सेव्ह करा</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT HERO SLIDE                                                    */}
      {/* ========================================================================= */}
      {isSlideModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className={`w-full max-w-xl rounded-3xl border p-5 sm:p-6 space-y-4 shadow-2xl my-8 ${
            isDayMode ? 'bg-white border-slate-200' : 'bg-[#151922] border-slate-700'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
              <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-amber-500" />
                <span>हिरो स्लाईड एडिट करा</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsSlideModalOpen(false)}
                className="w-8 h-8 rounded-full bg-black/10 dark:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSlide} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  स्लाईड टॅग (Top Pill Tag):
                </label>
                <input
                  type="text"
                  required
                  value={slideForm.tag}
                  onChange={(e) => setSlideForm({ ...slideForm, tag: e.target.value })}
                  placeholder="उदा. SHRI SAI ELECTRONICS EXPO • MEGA FESTIVAL SALE"
                  className="w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm bg-black/5 dark:bg-black/30 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    शीर्षक सुरुवात (Title Lead)*:
                  </label>
                  <input
                    type="text"
                    required
                    value={slideForm.titleLead}
                    onChange={(e) => setSlideForm({ ...slideForm, titleLead: e.target.value })}
                    placeholder="Smart 4K UHD TVs &"
                    className="w-full px-3 py-2 rounded-xl border text-xs bg-black/5 dark:bg-black/30 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    शीर्षक हायलाइट (Highlight)*:
                  </label>
                  <input
                    type="text"
                    required
                    value={slideForm.titleHighlight}
                    onChange={(e) => setSlideForm({ ...slideForm, titleHighlight: e.target.value })}
                    placeholder="Royal Teak Sofas"
                    className="w-full px-3 py-2 rounded-xl border text-xs font-bold text-amber-500 bg-black/5 dark:bg-black/30 border-slate-300 dark:border-slate-700 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  उपशीर्षक / माहिती (Subtitle):
                </label>
                <textarea
                  rows={2}
                  value={slideForm.subtitle}
                  onChange={(e) => setSlideForm({ ...slideForm, subtitle: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border text-xs bg-black/5 dark:bg-black/30 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  बॅकग्राउंड इमेज URL (High-Res 1600px):
                </label>
                <input
                  type="text"
                  required
                  value={slideForm.imageUrl}
                  onChange={(e) => setSlideForm({ ...slideForm, imageUrl: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border text-xs bg-black/5 dark:bg-black/30 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    बटण १ मजकूर:
                  </label>
                  <input
                    type="text"
                    value={slideForm.primaryBtnText}
                    onChange={(e) => setSlideForm({ ...slideForm, primaryBtnText: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border text-xs bg-black/5 dark:bg-black/30 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    बटण २ मजकूर:
                  </label>
                  <input
                    type="text"
                    value={slideForm.secondaryBtnText}
                    onChange={(e) => setSlideForm({ ...slideForm, secondaryBtnText: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border text-xs bg-black/5 dark:bg-black/30 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    मेट्रिक १ (Metric 1):
                  </label>
                  <input
                    type="text"
                    value={slideForm.cardMetric}
                    onChange={(e) => setSlideForm({ ...slideForm, cardMetric: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border text-xs bg-black/5 dark:bg-black/30 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    मेट्रिक २ (Metric 2):
                  </label>
                  <input
                    type="text"
                    value={slideForm.cardMetric2}
                    onChange={(e) => setSlideForm({ ...slideForm, cardMetric2: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border text-xs bg-black/5 dark:bg-black/30 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsSlideModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
                >
                  रद्द करा
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-1.5 shadow cursor-pointer active:scale-95 transition"
                >
                  <Save className="w-4 h-4 text-slate-950" />
                  <span>स्लाईड सेव्ह करा</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
