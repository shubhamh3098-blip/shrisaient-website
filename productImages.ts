import { StockItem } from '../types';

export const GENUINE_PRODUCT_IMAGES: Record<string, string> = {
  // Samsung & Smart TVs
  'stk-1': 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&auto=format&fit=crop&q=80',
  'samsung-tv': 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&auto=format&fit=crop&q=80',
  'smart-tv': 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=800&auto=format&fit=crop&q=80',
  '4k-tv': 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=800&auto=format&fit=crop&q=80',

  // LG & Refrigerators
  'stk-2': 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=800&auto=format&fit=crop&q=80',
  'fridge': 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=800&auto=format&fit=crop&q=80',
  'refrigerator': 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=800&auto=format&fit=crop&q=80',

  // Voltas & Air Conditioners
  'stk-3': 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=80',
  'air-conditioner': 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=80',
  'ac': 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=80',

  // Solid Teak / Sheesham Wood King Bed
  'stk-4': 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&auto=format&fit=crop&q=80',
  'bed': 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&auto=format&fit=crop&q=80',
  'king-bed': 'https://images.unsplash.com/photo-1540518614846-7ede433c4ef0?w=800&auto=format&fit=crop&q=80',

  // Luxury Teak / Fabric Recliner Sofa Set
  'stk-5': 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop&q=80',
  'sofa': 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop&q=80',
  'teak-sofa': 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&auto=format&fit=crop&q=80',

  // Italian Marble / Teak Dining Table
  'stk-6': 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800&auto=format&fit=crop&q=80',
  'dining': 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800&auto=format&fit=crop&q=80',

  // Whirlpool Washing Machine
  'stk-7': 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=800&auto=format&fit=crop&q=80',
  'washing-machine': 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=800&auto=format&fit=crop&q=80',

  // Panasonic Microwave Oven
  'stk-8': 'https://images.unsplash.com/photo-1585659722983-3a675dabf23d?w=800&auto=format&fit=crop&q=80',
  'microwave': 'https://images.unsplash.com/photo-1585659722983-3a675dabf23d?w=800&auto=format&fit=crop&q=80',

  // Teakwood Diwan Cot & Beds
  'diwan': 'https://images.unsplash.com/photo-1540518614846-7ede433c4ef0?w=800&auto=format&fit=crop&q=80',
  'cot': 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&auto=format&fit=crop&q=80',

  // Steel Almirah & Wardrobe Cupboard
  'almirah': 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800&auto=format&fit=crop&q=80',
  'cupboard': 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800&auto=format&fit=crop&q=80',
  'wardrobe': 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800&auto=format&fit=crop&q=80',

  // Air Cooler & Fans
  'cooler': 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=800&auto=format&fit=crop&q=80',

  // 30-Month Scheme & Lucky Draw
  'scheme': 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&auto=format&fit=crop&q=80',
};

/**
 * Returns a genuine high-definition product photo matching the item name, code, brand, or category.
 */
export function getGenuineProductImage(item: Partial<StockItem>): string {
  if (item.imageUrl && item.imageUrl.trim() !== '') {
    return item.imageUrl;
  }

  if (item.id && GENUINE_PRODUCT_IMAGES[item.id]) {
    return GENUINE_PRODUCT_IMAGES[item.id];
  }

  const name = (item.name || '').toLowerCase();
  const brand = (item.brand || '').toLowerCase();
  const cat = (item.category || '').toLowerCase();

  // TV
  if (name.includes('tv') || name.includes('led') || name.includes('samsung') || cat.includes('tv')) {
    return GENUINE_PRODUCT_IMAGES['samsung-tv'];
  }

  // Refrigerator / Fridge
  if (name.includes('refrigerator') || name.includes('fridge') || name.includes('freeze') || name.includes('फ्रीज')) {
    return GENUINE_PRODUCT_IMAGES['refrigerator'];
  }

  // Air Conditioner / AC
  if (name.includes('ac') || name.includes('air conditioner') || name.includes('voltas') || name.includes('split')) {
    return GENUINE_PRODUCT_IMAGES['ac'];
  }

  // Sofa
  if (name.includes('sofa') || name.includes('couch') || name.includes('सोफा')) {
    return GENUINE_PRODUCT_IMAGES['sofa'];
  }

  // Diwan / Cot
  if (name.includes('diwan') || name.includes('दिवाण') || name.includes('cot') || name.includes('कॉट')) {
    return GENUINE_PRODUCT_IMAGES['diwan'];
  }

  // Bed
  if (name.includes('bed') || name.includes('king') || name.includes('queen') || name.includes('बेड')) {
    return GENUINE_PRODUCT_IMAGES['bed'];
  }

  // Dining
  if (name.includes('dining') || name.includes('डायनिंग') || name.includes('table')) {
    return GENUINE_PRODUCT_IMAGES['dining'];
  }

  // Washing Machine
  if (name.includes('washing') || name.includes('वॉशिंग') || name.includes('whirlpool')) {
    return GENUINE_PRODUCT_IMAGES['washing-machine'];
  }

  // Microwave Oven
  if (name.includes('microwave') || name.includes('oven') || name.includes('ओव्हन')) {
    return GENUINE_PRODUCT_IMAGES['microwave'];
  }

  // Cupboard / Almirah
  if (name.includes('almari') || name.includes('almirah') || name.includes('cupboard') || name.includes('कपाट') || name.includes('wardrobe')) {
    return GENUINE_PRODUCT_IMAGES['cupboard'];
  }

  // Cooler
  if (name.includes('cooler') || name.includes('कुलर') || name.includes('fan')) {
    return GENUINE_PRODUCT_IMAGES['cooler'];
  }

  // Default by category
  if (cat === 'electronics') {
    return GENUINE_PRODUCT_IMAGES['samsung-tv'];
  }
  if (cat === 'furniture') {
    return GENUINE_PRODUCT_IMAGES['teak-sofa'];
  }
  if (cat === 'kitchen appliances') {
    return GENUINE_PRODUCT_IMAGES['microwave'];
  }

  return GENUINE_PRODUCT_IMAGES['sofa'];
}
