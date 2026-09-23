// Real-Time Notification & Audio Chime Service for Shri Sai Enterprises ERP
export interface OrderNotificationPayload {
  id: string;
  invoiceNo: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  totalAmount: number;
  downPayment?: number;
  paymentMode: string;
  financePlan?: string;
  itemSummary: string;
  itemsDetail?: any[];
  orderStatus?: string;
  timestamp: number;
  isRead?: boolean;
}

const STORAGE_KEY = 'shri_sai_order_notifications';

export function getStoredOrderNotifications(): OrderNotificationPayload[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveOrderNotification(order: OrderNotificationPayload) {
  if (typeof window === 'undefined') return;
  try {
    const current = getStoredOrderNotifications();
    // Prepend and keep latest 30
    const filtered = current.filter((o) => o.invoiceNo !== order.invoiceNo);
    const updated = [{ ...order, isRead: false }, ...filtered].slice(0, 30);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save order notification:', e);
  }
}

export function markOrderNotificationRead(invoiceNo: string) {
  if (typeof window === 'undefined') return;
  try {
    const current = getStoredOrderNotifications();
    const updated = current.map((o) => (o.invoiceNo === invoiceNo ? { ...o, isRead: true } : o));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

export function markAllOrderNotificationsRead() {
  if (typeof window === 'undefined') return;
  try {
    const current = getStoredOrderNotifications();
    const updated = current.map((o) => ({ ...o, isRead: true }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

// Web Audio API Chime Synthesizer - 100% reliable, zero external mp3 files needed
export function playOrderChimeSound() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Pleasant three-note ascending chime: D5 (587.33Hz) -> A5 (880Hz) -> D6 (1174.66Hz)
    const notes = [
      { freq: 587.33, start: now, duration: 0.25 },
      { freq: 880.0, start: now + 0.12, duration: 0.3 },
      { freq: 1174.66, start: now + 0.24, duration: 0.5 },
    ];

    notes.forEach(({ freq, start, duration }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.2, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + duration);
    });
  } catch (err) {
    console.warn('Audio chime could not be played automatically:', err);
  }
}

// BroadcastChannel for cross-tab multi-channel synchronization
const CHANNEL_NAME = 'shri_sai_realtime_channel';
let broadcastChannel: BroadcastChannel | null = null;

try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
  }
} catch {
  broadcastChannel = null;
}

// Dispatch an order alert to ERP and other tabs
export function broadcastNewOrder(order: OrderNotificationPayload) {
  // 1. Play chime immediately
  playOrderChimeSound();

  // 2. Persist in notification log
  saveOrderNotification(order);

  // 3. Local window event for immediate UI update in the current tab
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('shri_sai_new_order', {
        detail: order,
      })
    );
  }

  // 3. Multi-channel broadcast to other tabs (e.g. ERP open in another tab)
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({
        type: 'NEW_ONLINE_ORDER',
        payload: order,
      });
    } catch (e) {
      console.warn('BroadcastChannel postMessage error:', e);
    }
  }
}

// Subscribe to real-time order alerts
export function subscribeToRealtimeOrders(callback: (order: OrderNotificationPayload) => void) {
  if (typeof window === 'undefined') return () => {};

  const handleLocalEvent = (e: Event) => {
    const customEvent = e as CustomEvent<OrderNotificationPayload>;
    if (customEvent.detail) {
      callback(customEvent.detail);
    }
  };

  const handleBroadcastMessage = (event: MessageEvent) => {
    if (event.data && event.data.type === 'NEW_ONLINE_ORDER' && event.data.payload) {
      playOrderChimeSound();
      callback(event.data.payload);
    }
  };

  window.addEventListener('shri_sai_new_order', handleLocalEvent);
  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleBroadcastMessage);
  }

  // Return unsubscribe cleanup function
  return () => {
    window.removeEventListener('shri_sai_new_order', handleLocalEvent);
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleBroadcastMessage);
    }
  };
}
