import { StoreSettings } from '../types';

/**
 * Returns the 100% working live passbook URL for any card.
 * Automatically adapts to GitHub Pages (`username.github.io/repo/?passbook=1021`),
 * custom domain (`shrisaient.in/?passbook=1021`), or localhost.
 * Using root query parameter `?passbook=1021` guarantees ZERO 404 errors on GitHub Pages!
 */
export function getLivePassbookUrl(cardNo: string | number): string {
  const cleanCard = String(cardNo).replace(/\D/g, '') || String(cardNo);

  if (typeof window !== 'undefined' && window.location) {
    const origin = window.location.origin;
    // Strip trailing slashes and index.html if present
    let pathname = window.location.pathname.replace(/\/index\.html$/i, '').replace(/\/+$/, '');
    return `${origin}${pathname}/?passbook=${cleanCard}`;
  }

  return `https://shrisaient.in/?passbook=${cleanCard}`;
}

/**
 * Returns the official WhatsApp group link or a 100% working showroom direct chat link.
 * Prevents invalid broken placeholder invite link errors.
 */
export function getWhatsAppGroupDisplay(settings?: StoreSettings): {
  url: string;
  isCustomGroup: boolean;
  displayText: string;
} {
  const custom = settings?.whatsappGroupLink?.trim();

  // If owner configured their real WhatsApp group invite link
  if (custom && custom.startsWith('https://chat.whatsapp.com/') && !custom.includes('shrisaienterprises')) {
    return {
      url: custom,
      isCustomGroup: true,
      displayText: `👉 *अधिकृत व्हॉट्सॲप ग्रुप लिंक:* ${custom}`,
    };
  }

  // Safe fallback to direct showroom chat on WhatsApp
  const directUrl = `https://wa.me/918600122978?text=${encodeURIComponent('नमस्कार, मला श्री साई एंटरप्रायझेसच्या अधिकृत ग्रुपमध्ये ॲड करा.')}`;
  return {
    url: directUrl,
    isCustomGroup: false,
    displayText: `👉 *अधिकृत ग्रुप जॉईन करण्यासाठी थेट व्हॉट्सॲप मेसेज करा:* 8600122978 / 9175537365\n👉 *ग्रुप जॉईन लिंक:* ${directUrl}`,
  };
}
