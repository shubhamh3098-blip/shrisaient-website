/**
 * Customer Privacy & Anti-Scraping Security Utility
 * Ensures customer Personally Identifiable Information (PII) is masked on public screens
 * and prevents automated scrapers from harvesting sensitive phone numbers or address details.
 */

/**
 * Masks a phone number for public display (e.g. "9876543210" -> "98****3210")
 * Only reveals the full number if user is verified (admin or owner verified via OTP/digits).
 */
export function maskPhoneNumber(phone?: string, reveal: boolean = false): string {
  if (!phone) return 'नंबर नोंदवलेला नाही';
  const clean = phone.replace(/[^0-9]/g, '');
  if (reveal) return clean;
  if (clean.length < 7) return '******';
  // Keep first 2 digits and last 4 digits, mask middle
  return `${clean.slice(0, 2)}****${clean.slice(-4)}`;
}

/**
 * Masks detailed residential address on public cards, showing only town/village.
 */
export function maskAddress(address?: string, village?: string, reveal: boolean = false): string {
  if (reveal) return address || village || 'Wardha';
  if (village) return `${village}, Wardha`;
  if (address) {
    const parts = address.split(',').map((p) => p.trim()).filter(Boolean);
    if (parts.length > 1) {
      return parts.slice(-2).join(', ');
    }
    return address;
  }
  return 'Wardha';
}

/**
 * Verifies that the entered 4 digits match the last 4 digits of the registered phone number.
 */
export function verifyCustomerLast4Digits(registeredPhone?: string, inputDigits?: string): boolean {
  if (!registeredPhone || !inputDigits) return false;
  const cleanPhone = registeredPhone.replace(/[^0-9]/g, '');
  const cleanInput = inputDigits.replace(/[^0-9]/g, '');
  if (cleanInput.length !== 4) return false;
  return cleanPhone.endsWith(cleanInput);
}

/**
 * In-memory client-side rate-limiter to prevent automated scrapers from querying all 1000-9999 cards.
 */
let queryCount = 0;
let windowStartTime = Date.now();

export function checkSearchRateLimit(): { allowed: boolean; message?: string } {
  const now = Date.now();
  // Reset window every 15 seconds
  if (now - windowStartTime > 15000) {
    queryCount = 0;
    windowStartTime = now;
  }

  queryCount++;
  // If more than 10 fast requests within 15 seconds, trigger rate limit
  if (queryCount > 10) {
    const remainingSeconds = Math.max(3, Math.ceil((15000 - (now - windowStartTime)) / 1000));
    return {
      allowed: false,
      message: `सुरक्षिततेसाठी कृपया ${remainingSeconds} सेकंद थांबा (Anti-Scrape Protection Active).`,
    };
  }

  return { allowed: true };
}
