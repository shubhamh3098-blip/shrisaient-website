export interface AppNotification {
  id: string;
  type: 'order_completed' | 'cart_item_added' | 'installment_collected' | 'payment_received';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  data?: {
    amount?: number;
    customerName?: string;
    customerPhone?: string;
    customerAddress?: string;
    itemNames?: string[];
    cardNo?: string;
    invoiceNo?: string;
    stockId?: string;
    brand?: string;
    model?: string;
    serialNo?: string;
    cartItems?: Array<{
      stockId?: string;
      name: string;
      brand?: string;
      model?: string;
      serialNo?: string;
      salePrice: number;
      qty: number;
    }>;
  };
}

const STORAGE_KEY = 'shri_sai_notifications_v1';
const LISTENERS: Array<(notifications: AppNotification[]) => void> = [];

// Cross-tab real-time BroadcastChannel
let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel('shri_sai_realtime_notifications');
    broadcastChannel.onmessage = (event) => {
      if (event.data && event.data.type === 'REFRESH_NOTIFICATIONS') {
        NotificationService.dispatchCurrent();
      }
    };
  } catch (e) {
    console.warn('BroadcastChannel not supported', e);
  }
}

// Window Storage Event Listener for multi-window / tab sync
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      NotificationService.dispatchCurrent();
    }
  });
}

// Subtle pleasant Web Audio chime
const playNotificationChime = () => {
  try {
    if (typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    // Audio context may be muted or blocked by browser policy
  }
};

const DEFAULT_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-init-1',
    type: 'order_completed',
    title: 'नवीन ऑर्डर पूर्ण झाली (New Order Completed)',
    message: 'राहुल बिल्लोनकर यांनी Samsung 43" Smart LED TV ची खरेदी पूर्ण केली.',
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    isRead: false,
    data: {
      amount: 28500,
      customerName: 'राहुल बिल्लोनकर',
      customerPhone: '7447419284',
      itemNames: ['Samsung 43" Smart LED TV'],
      invoiceNo: 'SSE-2026-089',
    },
  },
  {
    id: 'notif-init-2',
    type: 'cart_item_added',
    title: 'कार्टमध्ये वस्तू जोडली (Item Added to Cart)',
    message: 'एका ग्राहकाने "टीकवूड सोफा सेट 5-Seater" कार्टमध्ये जोडले आहे.',
    timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    isRead: false,
    data: {
      amount: 32000,
      itemNames: ['टीकवूड सोफा सेट 5-Seater'],
    },
  },
  {
    id: 'notif-init-3',
    type: 'installment_collected',
    title: 'साप्ताहिक हप्ता जमा (Installment Collected)',
    message: 'कार्ड #1021 वर ₹1,000 चा हप्ता एजंट राहुल शर्मा यांनी जमा केला.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    isRead: true,
    data: {
      amount: 1000,
      cardNo: '1021',
      customerName: 'गणेश सोनटक्के',
    },
  },
];

export class NotificationService {
  public static getNotifications(): AppNotification[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_NOTIFICATIONS));
        return DEFAULT_NOTIFICATIONS;
      }
      return JSON.parse(raw);
    } catch {
      return DEFAULT_NOTIFICATIONS;
    }
  }

  public static saveNotifications(list: AppNotification[], playSound = false): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      this.notifyListeners(list);
      if (broadcastChannel) {
        try {
          broadcastChannel.postMessage({ type: 'REFRESH_NOTIFICATIONS' });
        } catch {
          // Ignore
        }
      }
      if (playSound) {
        playNotificationChime();
      }
    } catch (e) {
      console.error('Failed to save notifications', e);
    }
  }

  public static dispatchCurrent(): void {
    const list = this.getNotifications();
    this.notifyListeners(list);
  }

  public static addNotification(
    notif: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>
  ): AppNotification {
    const list = this.getNotifications();
    const newNotif: AppNotification = {
      ...notif,
      id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
      isRead: false,
    };
    list.unshift(newNotif);
    // Keep max 50 recent notifications
    const trimmed = list.slice(0, 50);
    this.saveNotifications(trimmed, true);
    return newNotif;
  }

  public static markAsRead(id: string): void {
    const list = this.getNotifications();
    const updated = list.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    this.saveNotifications(updated);
  }

  public static markAllAsRead(): void {
    const list = this.getNotifications();
    const updated = list.map((n) => ({ ...n, isRead: true }));
    this.saveNotifications(updated);
  }

  public static clearAll(): void {
    this.saveNotifications([]);
  }

  public static getUnreadCount(): number {
    return this.getNotifications().filter((n) => !n.isRead).length;
  }

  public static subscribe(listener: (notifications: AppNotification[]) => void): () => void {
    LISTENERS.push(listener);
    // Dispatch current
    listener(this.getNotifications());
    return () => {
      const idx = LISTENERS.indexOf(listener);
      if (idx !== -1) LISTENERS.splice(idx, 1);
    };
  }

  private static notifyListeners(list: AppNotification[]): void {
    LISTENERS.forEach((l) => {
      try {
        l(list);
      } catch (err) {
        console.error(err);
      }
    });
  }
}
