import { CardMember, CardSchemeId, CardTransaction, Customer, TransactionEntry } from '../types';
import { SCHEMES_CONFIG } from './storage';

// Canonical Village Map
export const VILLAGE_CORRECTIONS: Record<string, string> = {
  vayfad: 'Waifad',
  waifad: 'Waifad',
  wayfad: 'Waifad',
  vayfalh: 'Waifad',
  vaifad: 'Waifad',
  kelhzar: 'Kelzar',
  kelzer: 'Kelzar',
  kelzar: 'Kelzar',
  keljhar: 'Kelzar',
  kelzal: 'Kelzar',
  khadki: 'Khadki',
  khadaki: 'Khadki',
  khdki: 'Khadki',
  khadka: 'Khadki',
  vanrvira: 'Vanarveera',
  vanarveera: 'Vanarveera',
  vanarvira: 'Vanarveera',
  wanarvira: 'Vanarveera',
  wanrvira: 'Vanarveera',
  vanarveea: 'Vanarveera',
  sahujinagar: 'Sahuji Nagar',
  sahujinagr: 'Sahuji Nagar',
  saojinagar: 'Sahuji Nagar',
  sawjinagar: 'Sahuji Nagar',
  shahuinagar: 'Sahuji Nagar',
  dhamngav: 'Dhamangaon',
  dhamangav: 'Dhamangaon',
  dhamangoan: 'Dhamangaon',
  dhamangaon: 'Dhamangaon',
  tamaswada: 'Tamaswada',
  tambswada: 'Tamaswada',
  tamaswadha: 'Tamaswada',
  pipri: 'Pipri Meghe',
  pipari: 'Pipri Meghe',
  piprimeghe: 'Pipri Meghe',
  sindimeghe: 'Sindi Meghe',
  sindhimeghe: 'Sindi Meghe',
  sidhimeghe: 'Sindi Meghe',
  sindirelway: 'Sindi Railway',
  sindirailway: 'Sindi Railway',
  seldoh: 'Seldoh',
  sheldoh: 'Seldoh',
  pawnur: 'Pawnar',
  pavnur: 'Pawnar',
  pawnar: 'Pawnar',
  pavnar: 'Pawnar',
  barbadi: 'Barbadi',
  junapani: 'Junapani',
  jnapani: 'Junapani',
  itwara: 'Itwara',
  itvara: 'Itwara',
  hingni: 'Hingni',
  hingani: 'Hingni',
  juwadi: 'Juwadi',
  juvadi: 'Juwadi',
  selu: 'Seloo',
  seloo: 'Seloo',
  selukate: 'Seloo-Kate',
  anji: 'Aanji',
  aanji: 'Aanji',
  anjimothi: 'Aanji Mothi',
  antergaon: 'Antergaon',
  antargaon: 'Antergaon',
  antargoan: 'Antergaon',
  antrgav: 'Antergaon',
  tigaon: 'Tigaon',
  tigao: 'Tigaon',
  tuljapur: 'Tuljapur',
  tulhajapur: 'Tuljapur',
  tulajapur: 'Tuljapur',
  bori: 'Bori',
  bordharan: 'Bori (Bordharan)',
  buttibori: 'Butibori',
  butibori: 'Butibori',
  kanholibara: 'Kanholi Bara',
  kanolibara: 'Kanholi Bara',
  kanhan: 'Kanhan',
  umari: 'Umri Meghe',
  umarimeghe: 'Umri Meghe',
  umrimeghe: 'Umri Meghe',
  umri: 'Umri Meghe',
  devnagar: 'Devnagar',
  devanagar: 'Devnagar',
  waghala: 'Waghala',
  vaghala: 'Waghala',
  vaghalha: 'Waghala',
  vaghada: 'Waghala',
  shantinagar: 'Shanti Nagar',
  shantinganr: 'Shanti Nagar',
  shivnagar: 'Shivnagar',
  shivanagar: 'Shivnagar',
  shivangoan: 'Shivangaon',
  shivangaon: 'Shivangaon',
  gajannagar: 'Gajanan Nagar',
  gajanannagar: 'Gajanan Nagar',
};

// Normalize Village
export function cleanVillage(rawVillage?: string): string {
  if (!rawVillage) return '';
  const trimmed = rawVillage.trim();
  const slug = trimmed.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (VILLAGE_CORRECTIONS[slug]) {
    return VILLAGE_CORRECTIONS[slug];
  }
  return trimmed
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

// Clean Customer Name & Extract embedded village if present (e.g. "ARUN SAYRE (ANTERGAON)")
export function cleanCustomerName(rawName: string): { cleanName: string; extractedVillage?: string } {
  if (!rawName) return { cleanName: 'Customer' };
  let s = rawName.trim().replace(/^["']|["']$/g, '');

  // Fix known typographical errors
  s = s.replace(/NI,LIMA/gi, 'NILIMA');
  s = s.replace(/GANESG\b/gi, 'GANESH');
  s = s.replace(/KLPANA\b/gi, 'KALPANA');
  s = s.replace(/PURVA SACIN\b/gi, 'PURVA SACHIN');
  s = s.replace(/DUP PAL\b/gi, 'DIPU PAL');
  s = s.replace(/SNGITA\b/gi, 'SANGITA');
  s = s.replace(/CARUDATT\b/gi, 'CHARUDATT');
  s = s.replace(/SURESH CATARE\b/gi, 'SURESH CHATARE');
  s = s.replace(/VIJAY CARDE\b/gi, 'VIJAY CHARDE');
  s = s.replace(/VINOD CAHANDE\b/gi, 'VINOD CHAHANDE');
  s = s.replace(/KOSHLYA\b/gi, 'KAUSHALYA');
  s = s.replace(/DIPAK CARBHE\b/gi, 'DIPAK CHARBHE');
  s = s.replace(/PRMILA\b/gi, 'PREMILA');
  s = s.replace(/\bSANAJY\b/gi, 'SANJAY');
  s = s.replace(/\bDHANRAJ NANDNE\b/gi, 'DHANRAJ NANDANE');
  s = s.replace(/\bWAR CHIMULKAR\b/gi, 'RAMESHWAR CHIMULKAR');
  s = s.replace(/\bKUNAK SONPITALE\b/gi, 'KUNAL SONPITALE');
  s = s.replace(/\bVIJAY RATOD\b/gi, 'VIJAY RATHOD');
  s = s.replace(/\bCHETAN KANGALI\b/gi, 'CHETAN KANGALE');

  let extractedVillage: string | undefined;
  const match = s.match(/\(([^)]+)\)/);
  if (match) {
    extractedVillage = cleanVillage(match[1]);
    s = s.replace(/\([^)]+\)/g, '').trim();
  }

  s = s.replace(/\s+/g, ' ').trim();
  return {
    cleanName: s || 'Customer',
    extractedVillage,
  };
}

// Clean Phone Number
export function cleanPhone(rawPhone?: any): string {
  if (!rawPhone) return '';
  let str = String(rawPhone).replace(/[^0-9]/g, '');
  if (str === '0' || str.length < 8) return '';
  if (str.length === 11 && str.startsWith('0')) {
    str = str.slice(1);
  } else if (str.length > 10) {
    // Cut down 11 digits to 10 if extra digit appended
    str = str.slice(0, 10);
  }
  return str;
}

// Normalize Date
export function cleanDate(rawDate?: string): string {
  if (!rawDate) return new Date().toISOString().split('T')[0];
  let s = rawDate.trim().replace(/\//g, '-').replace(/\.$/, '');

  // Fix typo 2003 -> 2023 for Shri Sai records
  if (s.includes('2003')) {
    s = s.replace('2003', '2023');
  }
  if (s.includes('0226')) {
    s = s.replace('0226', '2026');
  }

  const monthNames: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
  };

  const parts = s.split('-').filter(Boolean);
  if (parts.length === 3) {
    const p1 = parts[0].trim();
    let p2 = parts[1].trim().toLowerCase();
    const p3 = parts[2].trim();

    if (monthNames[p2.slice(0, 3)]) {
      p2 = monthNames[p2.slice(0, 3)];
    }

    // DD-MM-YYYY
    if (p1.length <= 2 && p3.length === 4) {
      return `${p3}-${p2.padStart(2, '0')}-${p1.padStart(2, '0')}`;
    }
    // DD-MM-YY
    if (p1.length <= 2 && p3.length === 2) {
      const yr = parseInt(p3, 10);
      const fullYr = yr < 50 ? `20${p3}` : `19${p3}`;
      return `${fullYr}-${p2.padStart(2, '0')}-${p1.padStart(2, '0')}`;
    }
    // YYYY-MM-DD
    if (p1.length === 4) {
      return `${p1}-${p2.padStart(2, '0')}-${p3.padStart(2, '0')}`;
    }
  } else if (parts.length === 2) {
    // e.g. "13-Mar", "01-Jun", "24-Nov" -> defaults to appropriate year 2025/2026
    const p1 = parts[0].trim();
    const mStr = parts[1].trim().toLowerCase().slice(0, 3);
    const mNum = monthNames[mStr];
    if (mNum) {
      const defaultYear = parseInt(mNum, 10) >= 6 ? '2025' : '2026';
      return `${defaultYear}-${mNum}-${p1.padStart(2, '0')}`;
    }
  }

  return s || new Date().toISOString().split('T')[0];
}

// Determine scheme from card number, text hints (Marathi/English/code), or explicit target
export function getSchemeForCard(cardNum: number, schemeHint = ''): { schemeId: CardSchemeId; schemeName: string } {
  const hint = (schemeHint || '').toLowerCase().trim();
  const cleanHint = hint.replace(/[\s_\-\.\/\(\)\[\]#:,]/g, '');

  // 1. Direct or partial hint matches (Scheme 3 / योजना ३ / SCH-3 / 3)
  if (
    hint === 'scheme3' ||
    hint === 'scheme 3' ||
    hint === '3' ||
    hint === '३' ||
    cleanHint.includes('scheme3') ||
    cleanHint.includes('sch3') ||
    cleanHint.includes('योजना3') ||
    cleanHint.includes('योजना३') ||
    cleanHint.includes('स्कीम3') ||
    cleanHint.includes('स्कीम३') ||
    cleanHint.includes('schemeiii') ||
    cleanHint.includes('schiii') ||
    hint.includes('sch-3') ||
    hint.includes('sch 3') ||
    hint.includes('s-3') ||
    hint.includes('s 3') ||
    hint.includes('योजना ३') ||
    hint.includes('योजना 3') ||
    hint.includes('स्कीम ३') ||
    hint.includes('स्कीम 3')
  ) {
    return { schemeId: 'scheme3', schemeName: 'Scheme 3 (योजना 3)' };
  }

  // 2. Direct or partial hint matches (Scheme 2 / योजना २ / SCH-2 / 2)
  if (
    hint === 'scheme2' ||
    hint === 'scheme 2' ||
    hint === '2' ||
    hint === '२' ||
    cleanHint.includes('scheme2') ||
    cleanHint.includes('sch2') ||
    cleanHint.includes('योजना2') ||
    cleanHint.includes('योजना२') ||
    cleanHint.includes('स्कीम2') ||
    cleanHint.includes('स्कीम२') ||
    cleanHint.includes('schemeii') ||
    cleanHint.includes('schii') ||
    hint.includes('sch-2') ||
    hint.includes('sch 2') ||
    hint.includes('s-2') ||
    hint.includes('s 2') ||
    hint.includes('योजना २') ||
    hint.includes('योजना 2') ||
    hint.includes('स्कीम २') ||
    hint.includes('स्कीम 2')
  ) {
    return { schemeId: 'scheme2', schemeName: 'Scheme 2 (योजना 2)' };
  }

  // 3. Direct or partial hint matches (Scheme 1 / योजना १ / SCH-1 / 1)
  if (
    hint === 'scheme1' ||
    hint === 'scheme 1' ||
    hint === '1' ||
    hint === '१' ||
    cleanHint.includes('scheme1') ||
    cleanHint.includes('sch1') ||
    cleanHint.includes('योजना1') ||
    cleanHint.includes('योजना१') ||
    cleanHint.includes('स्कीम1') ||
    cleanHint.includes('स्कीम१') ||
    cleanHint.includes('schemei') ||
    cleanHint.includes('schi') ||
    hint.includes('sch-1') ||
    hint.includes('sch 1') ||
    hint.includes('s-1') ||
    hint.includes('s 1') ||
    hint.includes('योजना १') ||
    hint.includes('योजना 1') ||
    hint.includes('स्कीम १') ||
    hint.includes('स्कीम 1')
  ) {
    return { schemeId: 'scheme1', schemeName: 'Scheme 1 (योजना 1)' };
  }

  // 4. Higher schemes (4, 5, 6)
  if (cleanHint.includes('scheme4') || cleanHint.includes('sch4') || cleanHint.includes('योजना4') || cleanHint.includes('योजना४') || hint === '4' || hint === '४') {
    return { schemeId: 'scheme4', schemeName: 'Scheme 4 (योजना 4)' };
  }
  if (cleanHint.includes('scheme5') || cleanHint.includes('sch5') || cleanHint.includes('योजना5') || cleanHint.includes('योजना५') || hint === '5' || hint === '५') {
    return { schemeId: 'scheme5', schemeName: 'Scheme 5 (योजना 5)' };
  }
  if (cleanHint.includes('scheme6') || cleanHint.includes('sch6') || cleanHint.includes('योजना6') || cleanHint.includes('योजना६') || hint === '6' || hint === '६') {
    return { schemeId: 'scheme6', schemeName: 'Scheme 6 (योजना 6)' };
  }

  // 5. Fallback based on card number ranges
  if (cardNum >= 10001 && cardNum <= 12000) {
    return { schemeId: 'scheme6', schemeName: 'Scheme 6 (योजना 6)' };
  }
  if (cardNum >= 8001 && cardNum <= 9999) {
    return { schemeId: 'scheme5', schemeName: 'Scheme 5 (योजना 5)' };
  }
  if (cardNum >= 6001 && cardNum <= 7999) {
    return { schemeId: 'scheme4', schemeName: 'Scheme 4 (योजना 4)' };
  }
  if (cardNum >= 4000) {
    return { schemeId: 'scheme3', schemeName: 'Scheme 3 (योजना 3)' };
  }
  if (cardNum >= 3000 && cardNum < 4000) {
    return { schemeId: 'scheme2', schemeName: 'Scheme 2 (योजना 2)' };
  }
  return { schemeId: 'scheme1', schemeName: 'Scheme 1 (योजना 1)' };
}
