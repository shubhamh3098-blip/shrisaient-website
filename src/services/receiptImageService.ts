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
 * Converts generated thermal receipt slip into a base64 Data URL for instant on-screen rendering.
 */
export async function generateThermalReceiptDataUrl(
  tx: CardTransaction,
  member: CardMember,
  settings?: StoreSettings,
  format: '80mm' | '58mm' = '80mm'
): Promise<string> {
  const blob = await generateThermalReceiptBlob(tx, member, settings, format);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert blob to Data URL'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Prints thermal receipt directly using a hidden iframe to prevent mobile browser popup blocker issues.
 */
export function printThermalReceiptViaIframe(
  tx: CardTransaction,
  member: CardMember,
  settings?: StoreSettings,
  paperWidth: '80mm' | '58mm' = '80mm'
) {
  const is80 = paperWidth === '80mm';
  const todayPaid = tx.amount || 0;
  const totalSavings = member.totalAmountPaid || todayPaid;
  const prevBal = Math.max(0, totalSavings - todayPaid);
  const targetVal = member.targetAmount || (member.planType === '15000_scheme' ? 15000 : 30000);
  const remBal = Math.max(0, targetVal - totalSavings);
  const cleanCardNo = member.cardNo.replace(/\D/g, '') || member.cardNo;
  const dateFormatted = new Date(tx.date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const timeFormatted = new Date(tx.date).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const upiUrl = `upi://pay?pa=8766486915@ybl&pn=Shri%20Sai%20Enterprises&am=${todayPaid}&cu=INR`;
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(upiUrl)}`;

  const bodyWidth = is80 ? '74mm' : '54mm';
  const fontSize = is80 ? '12px' : '10.5px';
  const headerSize = is80 ? '16px' : '13px';
  const bigAmtSize = is80 ? '18px' : '15px';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>${is80 ? '80mm' : '58mm'} Thermal Receipt - ${tx.receiptNo}</title>
      <style>
        @page { size: ${is80 ? '80mm' : '58mm'} auto; margin: ${is80 ? '2.5mm' : '1.5mm'}; }
        body {
          font-family: 'Courier New', Courier, monospace;
          width: ${bodyWidth};
          margin: 0 auto;
          padding: 4px;
          color: #000;
          font-size: ${fontSize};
          line-height: 1.35;
          text-align: center;
        }
        .bold { font-weight: bold; }
        .header-title { font-size: ${headerSize}; font-weight: 900; margin-bottom: 2px; }
        .header-sub { font-size: ${is80 ? '11px' : '9px'}; font-weight: 600; }
        .divider { border-top: 1px dashed #000; margin: 4px 0; }
        .divider-double { border-top: 2px double #000; margin: 4px 0; }
        .row { display: flex; justify-content: space-between; text-align: left; margin: 2px 0; font-size: ${is80 ? '11.5px' : '10px'}; }
        .row-val { font-weight: bold; text-align: right; }
        .big-amount { font-size: ${bigAmtSize}; font-weight: 900; margin: 4px 0; }
        .qr-box { margin: 4px auto; width: 100px; height: 100px; }
        .qr-box img { width: 100px; height: 100px; display: block; margin: 0 auto; }
        .highlight-box { font-size: ${is80 ? '10px' : '8.5px'}; font-weight: bold; border: 1px solid #000; padding: 3px; margin: 4px 0; }
        .footer { font-size: ${is80 ? '9.5px' : '8px'}; margin-top: 5px; }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      <div class="header-title">${settings?.storeName || 'SHRI SAI ENTERPRISES'}</div>
      <div class="header-sub">श्री साई एंटरप्रायझेस (इलेक्ट्रॉनिक्स & फर्निचर शोरूम, वर्धा)</div>
      <div>मातोश्री सभागृह समोर, आर्वी रोड, पंजाब कॉलनी, वर्धा</div>
      <div>मो.: 8600122978 / 9175537365 / 8766486915</div>
      <div class="divider-double"></div>
      <div class="bold" style="font-size: ${is80 ? '13px' : '11px'};">साप्ताहिक बचत योजना पावती (${is80 ? '80mm POS' : '58mm POS'})</div>
      <div class="divider"></div>
      <div class="row"><span>पावती क्र (Receipt No):</span><span class="row-val">${tx.receiptNo}</span></div>
      <div class="row"><span>दिनांक (Date & Time):</span><span class="row-val">${dateFormatted} ${timeFormatted}</span></div>
      <div class="row"><span>कार्ड क्र (Card No):</span><span class="row-val">#${cleanCardNo}</span></div>
      <div class="row"><span>ग्राहक (Member Name):</span><span class="row-val">${member.memberName}</span></div>
      <div class="row"><span>गाव / पत्ता (Village):</span><span class="row-val">${member.village || 'Wardha'}</span></div>
      <div class="row"><span>हप्ता क्र (Installment):</span><span class="row-val">#${tx.weekNumber || tx.monthNumber}</span></div>
      <div class="divider"></div>
      <div class="row"><span>१. जुनी रक्कम (मागील जमा):</span><span class="row-val">₹${prevBal.toLocaleString('en-IN')}/-</span></div>
      <div class="row" style="font-size: ${is80 ? '13px' : '11px'}; font-weight: bold;"><span>२. आज जमा हप्ता (Today Paid):</span><span class="row-val">₹${todayPaid.toLocaleString('en-IN')}/-</span></div>
      <div class="big-amount">₹${todayPaid.toLocaleString('en-IN')}/-</div>
      <div class="row"><span>३. आतापर्यंत एकूण जमा:</span><span class="row-val">₹${totalSavings.toLocaleString('en-IN')}/-</span></div>
      <div class="row"><span>४. कार्ड योजना एकूण उद्दिष्ट:</span><span class="row-val">₹${targetVal.toLocaleString('en-IN')}/-</span></div>
      <div class="row" style="font-size: ${is80 ? '13px' : '11px'}; font-weight: bold;"><span>५. चालू शिल्लक बाकी:</span><span class="row-val" style="text-decoration: underline;">₹${remBal.toLocaleString('en-IN')}/-</span></div>
      <div class="divider"></div>
      <div class="highlight-box">
        हिशोब ताळमेळ: एकूण जमा ₹${totalSavings} + शिल्लक ₹${remBal} = एकूण उद्दिष्ट ₹${targetVal} (१००% अचूक)
      </div>
      <div class="row"><span>पेमेंट मोड:</span><span class="row-val">${tx.paymentMode || 'Cash'}</span></div>
      <div class="row"><span>वसुली प्रतिनिधी:</span><span class="row-val">${tx.collectedBy || 'Staff'}</span></div>
      <div class="divider"></div>
      <div class="qr-box">
        <img src="${qrApiUrl}" alt="UPI QR" />
      </div>
      <div style="font-size: ${is80 ? '9px' : '8px'};">स्कॅन करा: डिजिटल पासबुक व UPI पेमेंट</div>
      <div class="divider-double"></div>
      <div class="footer">
        श्री साई एंटरप्रायझेसवर विश्वास ठेवल्याबद्दल मनःपूर्वक धन्यवाद! 🙏<br/>
        (संगणकीय अधिकृत पावती - सहीची गरज नाही)
      </div>
    </body>
    </html>
  `;

  // Use hidden iframe to avoid mobile popup blockers
  let iframe = document.getElementById('thermal-print-iframe') as HTMLIFrameElement;
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.id = 'thermal-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
  }

  const doc = iframe.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(htmlContent);
    doc.close();
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    }, 300);
  } else {
    window.print();
  }
}

/**
 * Shares thermal receipt slip image directly on WhatsApp using Web Share API,
 * or downloads PNG + opens WhatsApp if Web Share API is blocked / unsupported.
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
      return { sharedViaFile: true, message: 'पावती फोटो WhatsApp वर यशस्वी पाठवला!' };
    }
  } catch (err: any) {
    if (err?.name !== 'AbortError') {
      console.warn('Web Share API not supported or cancelled:', err);
    }
  }

  // Fallback: Download image file & open WhatsApp with pre-filled Marathi message
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

  // Open WhatsApp direct chat if phone available
  const cleanPhone = (member.phone || '').replace(/\D/g, '').slice(-10);
  if (cleanPhone && cleanPhone !== '0000000000') {
    const textMsg = `*श्री साई एंटरप्रायझेस हप्ता पावती (पावती #${tx.receiptNo})*\nकार्ड #${cleanCardNo} - ${member.memberName}\nआज जमा हप्ता: ₹${tx.amount}/-\nएकूण जमा: ₹${member.totalAmountPaid || tx.amount}/-\n\n(पावती फोटो डाऊनलोड झाला आहे, कृपया शेअर करा!)`;
    const waUrl = `https://api.whatsapp.com/send?phone=91${cleanPhone}&text=${encodeURIComponent(textMsg)}`;
    window.open(waUrl, '_blank');
  }

  return { sharedViaFile: false, message: 'पावती PNG फोटो डाऊनलोड झाला! WhatsApp मध्ये सहज पाठवा.' };
}
