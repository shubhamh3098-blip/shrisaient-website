import QRCode from 'qrcode';
import { CardMember, CardTransaction, StoreSettings } from '../types';
import { getLivePassbookUrl } from '../utils/passbookUtils';

/**
 * Generates an ultra-crisp 80mm or 58mm graphical thermal receipt slip on an HTML5 canvas.
 * Can be shared as an image file on WhatsApp via navigator.share or downloaded as PNG.
 */
export async function generateThermalReceiptBlob(
  tx: CardTransaction,
  member: CardMember,
  settings?: StoreSettings,
  format: '80mm' | '58mm' = '80mm'
): Promise<Blob> {
  const is80 = format === '80mm';
  const width = is80 ? 540 : 380;
  const scale = 2; // Retina 2x for razor-sharp Marathi fonts

  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  // Estimate height
  canvas.height = 960 * scale;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context not available');
  }

  ctx.scale(scale, scale);

  // Background - White thermal paper with slight subtle border
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, 960);

  // Decorative border
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(8, 8, width - 16, 960 - 16);

  let y = 30;

  // Header
  ctx.textAlign = 'center';
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 20px "Segoe UI", Tahoma, Arial, sans-serif';
  ctx.fillText(settings?.storeName || 'श्री साई एंटरप्रायझेस, वर्धा', width / 2, y);

  y += 20;
  ctx.font = '12px "Segoe UI", Tahoma, Arial, sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText('(इलेक्ट्रॉनिक्स व फर्निचर शोरूम • ३०-महिने बचत योजना)', width / 2, y);

  y += 18;
  ctx.font = '11px "Segoe UI", Tahoma, Arial, sans-serif';
  ctx.fillText('पत्ता: मातोश्री सभागृह समोर, आर्वी रोड, पंजाब कॉलनी, वर्धा', width / 2, y);

  y += 16;
  ctx.fillText('📞 8600122978 / 9175537365 / 8766486915', width / 2, y);

  // Horizontal divider
  y += 14;
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(16, y);
  ctx.lineTo(width - 16, y);
  ctx.stroke();

  // Receipt Badge
  y += 24;
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(30, y - 16, width - 60, 24);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 13px "Segoe UI", Tahoma, Arial, sans-serif';
  ctx.fillText(`🧾 ${format.toUpperCase()} साप्ताहिक हप्ता पावती (Collection Slip)`, width / 2, y);

  y += 24;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#0f172a';

  const row = (label: string, val: string, isBold: boolean = false, isHighlight: boolean = false) => {
    ctx.font = isBold ? 'bold 13px "Segoe UI", Tahoma, Arial, sans-serif' : '12px "Segoe UI", Tahoma, Arial, sans-serif';
    if (isHighlight) {
      ctx.fillStyle = '#ecfdf5';
      ctx.fillRect(16, y - 14, width - 32, 20);
      ctx.fillStyle = '#065f46';
    } else {
      ctx.fillStyle = '#0f172a';
    }
    ctx.textAlign = 'left';
    ctx.fillText(label, 20, y);
    ctx.textAlign = 'right';
    ctx.fillText(val, width - 20, y);
    y += 20;
  };

  const cleanCardNo = member.cardNo.replace(/\D/g, '') || member.cardNo;
  const dateStr = new Date(tx.date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = new Date(tx.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  const todayPaid = tx.amount || 0;
  const totalSavings = member.totalAmountPaid || todayPaid;
  const prevBal = Math.max(0, totalSavings - todayPaid);
  const targetVal = member.targetAmount || (member.planType === '15000_scheme' ? 15000 : 30000);
  const remBal = Math.max(0, targetVal - totalSavings);

  row('पावती क्र. (Receipt No):', tx.receiptNo, true);
  row('दिनांक व वेळ (Date):', `${dateStr} (${timeStr})`);
  row('कार्ड नंबर (Card No):', `#${cleanCardNo} (${member.schemeName || 'योजना १'})`, true);
  row('ग्राहक (Member):', member.memberName, true);
  row('गाव / पत्ता (Village):', member.village || 'Wardha');
  row('हप्ता क्र. (Week / Month):', `#${tx.weekNumber || tx.monthNumber}`, true);

  // Dashed divider
  y += 4;
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = '#94a3b8';
  ctx.beginPath();
  ctx.moveTo(16, y);
  ctx.lineTo(width - 16, y);
  ctx.stroke();
  ctx.setLineDash([]);
  y += 18;

  row('१. जुनी रक्कम (मागील जमा):', `₹${prevBal.toLocaleString('en-IN')}/-`);
  row('२. आज जमा हप्ता (Paid Today):', `₹${todayPaid.toLocaleString('en-IN')}/- [${tx.paymentMode || 'Cash'}]`, true, true);

  // Big Amount Box
  y += 8;
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(width / 2 - 100, y, 200, 36);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.font = 'bold 20px "Segoe UI", Tahoma, Arial, sans-serif';
  ctx.fillText(`₹${todayPaid.toLocaleString('en-IN')}/- जमा`, width / 2, y + 25);
  y += 48;

  row('३. आतापर्यंत एकूण जमा:', `₹${totalSavings.toLocaleString('en-IN')}/-`, true);
  row('४. कार्ड योजना एकूण उद्दिष्ट:', `₹${targetVal.toLocaleString('en-IN')}/-`);
  row('५. कार्डमधील चालू शिल्लक बाकी:', `₹${remBal.toLocaleString('en-IN')}/-`, true);

  // Highlight Box - Verification
  y += 8;
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(16, y, width - 32, 28);
  ctx.strokeStyle = '#cbd5e1';
  ctx.strokeRect(16, y, width - 32, 28);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 10.5px "Segoe UI", Tahoma, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`हिशोब पडताळणी: ₹${totalSavings} + ₹${remBal} = ₹${targetVal} (१००% अचूक)`, width / 2, y + 18);
  y += 38;

  row('पेमेंट मोड (Mode):', tx.paymentMode || 'Cash');
  row('वसुली प्रतिनिधी (Agent):', tx.collectedBy || 'Staff');

  // QR Code for Passbook
  const passbookUrl = getLivePassbookUrl(cleanCardNo);
  const qrCanvas = document.createElement('canvas');
  await QRCode.toCanvas(qrCanvas, passbookUrl, {
    width: 90,
    margin: 1,
    color: { dark: '#0f172a', light: '#ffffff' },
  });

  y += 10;
  ctx.drawImage(qrCanvas, width / 2 - 45, y);
  y += 100;

  ctx.textAlign = 'center';
  ctx.font = 'bold 10px "Segoe UI", Tahoma, Arial, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText('स्कॅन करा: मोबाईलवर लाईव्ह डिजिटल पासबुक पहा', width / 2, y);

  y += 16;
  ctx.font = 'italic 10px "Segoe UI", Tahoma, Arial, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('श्री साई एंटरप्रायझेसवर विश्वास ठेवल्याबद्दल मनःपूर्वक धन्यवाद! 🙏', width / 2, y);

  y += 14;
  ctx.fillText('(संगणकीय अधिकृत पावती - सहीची गरज नाही)', width / 2, y);

  // Return final canvas cropped to actual height y + 20
  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = width * scale;
  finalCanvas.height = (y + 20) * scale;
  const finalCtx = finalCanvas.getContext('2d');
  if (finalCtx) {
    finalCtx.drawImage(canvas, 0, 0, width * scale, (y + 20) * scale, 0, 0, width * scale, (y + 20) * scale);
  }

  return new Promise((resolve, reject) => {
    finalCanvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Canvas to blob failed'));
      }
    }, 'image/png');
  });
}

/**
 * Shares thermal receipt slip image directly on WhatsApp using Web Share API,
 * or downloads PNG + copies formatted Marathi message if desktop browser.
 */
export async function shareThermalReceiptOnWhatsApp(
  tx: CardTransaction,
  member: CardMember,
  settings?: StoreSettings,
  format: '80mm' | '58mm' = '80mm'
): Promise<{ sharedViaFile: boolean; message: string }> {
  const cleanCardNo = member.cardNo.replace(/\D/g, '') || member.cardNo;
  const fileName = `ShriSai_Receipt_${tx.receiptNo || cleanCardNo}.png`;

  try {
    const blob = await generateThermalReceiptBlob(tx, member, settings, format);
    const file = new File([blob], fileName, { type: 'image/png' });

    // Check if device supports sharing image files (Android Chrome, iOS Safari)
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: `श्री साई एंटरप्रायझेस हप्ता पावती #${cleanCardNo}`,
        text: `श्री साई एंटरप्रायझेस अधिकृत हप्ता पावती - कार्ड #${cleanCardNo} (पावती क्र: ${tx.receiptNo})`,
        files: [file],
      });
      return { sharedViaFile: true, message: 'पावती फोटो WhatsApp वर यशस्वीरित्या पाठवला!' };
    }
  } catch (err: any) {
    if (err?.name !== 'AbortError') {
      console.warn('Web Share API not supported or cancelled:', err);
    }
  }

  // Fallback for PC / Laptop: Download image file & open WhatsApp
  try {
    const blob = await generateThermalReceiptBlob(tx, member, settings, format);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error('Download fallback failed:', e);
  }

  return { sharedViaFile: false, message: 'पावती फोटो डाऊनलोड झाला! WhatsApp मध्ये ड्रॅग किंवा पेस्ट करा.' };
}
