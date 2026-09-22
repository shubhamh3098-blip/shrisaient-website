// High-resolution real product photography for electronics, home appliances, and furniture
export const REAL_PRODUCT_IMAGES = {
  smartTv32: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=800&q=85',
  smartTv43: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=800&q=85',
  smartTv55: 'https://images.unsplash.com/photo-1461151304267-38535e780c79?auto=format&fit=crop&w=800&q=85',
  refrigeratorLg: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=800&q=85',
  refrigeratorDoubleDoor: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?auto=format&fit=crop&w=800&q=85',
  airCooler: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=800&q=85',
  washingMachine: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=800&q=85',
  ceilingFan: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=85',
  electricWire: 'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?auto=format&fit=crop&w=800&q=85',
  ledLight: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=800&q=85',
  pumpStarter: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=85',
  sofaTeak: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=85',
  bedKing: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=85',
  wardrobe4D: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=85',
  diningTable: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=800&q=85',
  dressingTable: 'https://images.unsplash.com/photo-1534349762230-e0cadf78f5da?auto=format&fit=crop&w=800&q=85',
  mattress: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=85',
  microwave: 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?auto=format&fit=crop&w=800&q=85',
  waterPurifier: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=85',
};

/**
 * Returns a real, crisp, authentic product image based on item name and category,
 * with fallback to the item's stored image or a category-specific real photo.
 */
export function getRealProductImage(name: string = '', category: string = '', currentUrl?: string): string {
  const n = name.toLowerCase();
  const c = category.toLowerCase();

  // If item already has a high-res image and it's not a generic placeholder, return it
  if (currentUrl && currentUrl.startsWith('http') && !currentUrl.includes('placeholder')) {
    return currentUrl;
  }

  // 1. Smart TVs
  if (n.includes('32') && (n.includes('tv') || n.includes('led'))) {
    return REAL_PRODUCT_IMAGES.smartTv32;
  }
  if (n.includes('43') && (n.includes('tv') || n.includes('led'))) {
    return REAL_PRODUCT_IMAGES.smartTv43;
  }
  if (n.includes('tv') || n.includes('led') || n.includes('television')) {
    return REAL_PRODUCT_IMAGES.smartTv55;
  }

  // 2. Refrigerators
  if (n.includes('lg') && (n.includes('refrigerator') || n.includes('fridge'))) {
    return REAL_PRODUCT_IMAGES.refrigeratorLg;
  }
  if (n.includes('refrigerator') || n.includes('fridge')) {
    return REAL_PRODUCT_IMAGES.refrigeratorDoubleDoor;
  }

  // 3. Air Coolers
  if (n.includes('cooler') || n.includes('desert')) {
    return REAL_PRODUCT_IMAGES.airCooler;
  }

  // 4. Washing Machines
  if (n.includes('washing') || n.includes('machine') || n.includes('wm-')) {
    return REAL_PRODUCT_IMAGES.washingMachine;
  }

  // 5. Ceiling Fans
  if (n.includes('fan') || n.includes('ceiling')) {
    return REAL_PRODUCT_IMAGES.ceilingFan;
  }

  // 6. Sofa
  if (n.includes('sofa') || n.includes('couch') || n.includes('3+1+1')) {
    return REAL_PRODUCT_IMAGES.sofaTeak;
  }

  // 7. Bed
  if (n.includes('bed') || n.includes('king') || n.includes('queen') || n.includes('hydraulic')) {
    return REAL_PRODUCT_IMAGES.bedKing;
  }

  // 8. Wardrobe / Almirah
  if (n.includes('wardrobe') || n.includes('almirah') || n.includes('cupboard')) {
    return REAL_PRODUCT_IMAGES.wardrobe4D;
  }

  // 9. Dining Table
  if (n.includes('dining') || n.includes('table set')) {
    return REAL_PRODUCT_IMAGES.diningTable;
  }

  // 10. Dressing Table
  if (n.includes('dressing') || n.includes('vanity') || n.includes('mirror')) {
    return REAL_PRODUCT_IMAGES.dressingTable;
  }

  // 11. Wires & Electricals
  if (n.includes('wire') || n.includes('cable') || n.includes('copper')) {
    return REAL_PRODUCT_IMAGES.electricWire;
  }
  if (n.includes('tube') || n.includes('bulb') || n.includes('light')) {
    return REAL_PRODUCT_IMAGES.ledLight;
  }
  if (n.includes('starter') || n.includes('panel') || n.includes('pump')) {
    return REAL_PRODUCT_IMAGES.pumpStarter;
  }

  // Category fallback
  if (c.includes('furniture')) return REAL_PRODUCT_IMAGES.sofaTeak;
  if (c.includes('appliance')) return REAL_PRODUCT_IMAGES.refrigeratorDoubleDoor;
  if (c.includes('electrical')) return REAL_PRODUCT_IMAGES.ceilingFan;

  return REAL_PRODUCT_IMAGES.smartTv43;
}
