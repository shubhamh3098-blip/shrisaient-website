import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const PORT = 3000;

// Lazy initialize GoogleGenAI client to avoid crash if GEMINI_API_KEY is unset
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // API Health check
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  // API endpoint: Gemini AI Purchase Bill OCR Scanner
  app.post("/api/scan-purchase-bill", async (req, res) => {
    try {
      const { imageBase64, mimeType } = req.body;

      if (!imageBase64) {
        return res.status(400).json({
          error: "Missing imageBase64 in request body",
        });
      }

      const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, "");
      const resolvedMime = mimeType || "image/jpeg";

      const ai = getGenAI();
      if (!ai) {
        // Graceful fallback when API key is missing
        return res.status(503).json({
          error: "GEMINI_API_KEY is not configured in server environment.",
          fallback: true,
        });
      }

      const systemPrompt = `You are an expert Indian GST invoice OCR parser for Shri Sai Enterprises (Electronics and Furniture showroom, Wardha).
Analyze this purchase invoice / bill image and extract all details in strictly valid JSON format.
Extract:
- supplierName: Wholesaler or dealer name (e.g. MANISHA ENTERPRISES, LG ELECTRONICS, etc.)
- supplierPhone: Phone/mobile if available
- supplierAddress: Supplier address with city/pincode
- supplierGstin: 15-digit GSTIN (e.g. 27ABDPB8956C1ZS)
- billNo: Invoice / bill number (e.g. CS/2526/01677)
- date: Invoice date in YYYY-MM-DD format
- poNo: Purchase order number if present
- poDate: PO date in YYYY-MM-DD format if present
- transporter: Transport company name
- ewayBillNo: E-Way bill number if present
- bankName: Supplier bank name if listed
- accountNo: Bank account number if listed
- ifsc: Bank IFSC code if listed
- items: Array of line items:
    - description: Product / item name with brand (e.g. LG Refrigerator GL-D201AELU)
    - modelNo: Model number or code (e.g. GL-D201AELU)
    - serialNumbers: Array of individual serial numbers if printed on bill
    - hsn: HSN code (e.g. 84182100)
    - quantity: number
    - rate: Unit purchase rate without tax
    - discount: Discount per item or line
    - taxRate: Total GST percentage (e.g. 18 or 28)
    - taxableAmount: Total taxable amount for this line
    - cgstAmount: CGST amount
    - sgstAmount: SGST amount
    - totalAmount: Total line amount including taxes
- taxableAmount: Grand taxable amount
- cgstAmount: Total CGST amount
- sgstAmount: Total SGST amount
- totalAmount: Grand total invoice amount (Gross amount)
- paidAmount: Amount paid (if indicated as paid, else 0)
- paymentMode: 'Cash' | 'Online' | 'Cheque'
- notes: Any notes, IRN number, or remarks printed on invoice.

Respond with ONLY valid JSON matching this schema.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  mimeType: resolvedMime,
                  data: cleanBase64,
                },
              },
              {
                text: systemPrompt,
              },
            ],
          },
        ],
        config: {
          responseMimeType: "application/json",
        },
      });

      const responseText = response.text || "{}";
      let parsedData;
      try {
        parsedData = JSON.parse(responseText);
      } catch (parseError) {
        // Attempt cleanup if markdown ticks remain
        const cleaned = responseText.replace(/```json\s*/gi, "").replace(/```\s*$/gi, "").trim();
        parsedData = JSON.parse(cleaned);
      }

      return res.json({
        success: true,
        data: parsedData,
      });
    } catch (err: any) {
      console.error("Error in /api/scan-purchase-bill:", err);
      return res.status(500).json({
        error: err?.message || "Failed to parse purchase bill image with Gemini AI",
      });
    }
  });

  // API endpoint: Automated Party Statement Parser (PDF & PNG OCR)
  app.post("/api/parse-party-statement", async (req, res) => {
    try {
      const { fileBase64, mimeType, fileName } = req.body;

      if (!fileBase64) {
        return res.status(400).json({
          error: "Missing fileBase64 in request body",
        });
      }

      const cleanBase64 = fileBase64.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, "");
      const resolvedMime = mimeType || (fileName?.endsWith(".pdf") ? "application/pdf" : "image/jpeg");

      const ai = getGenAI();
      if (!ai) {
        return res.status(503).json({
          error: "GEMINI_API_KEY is not configured in server environment.",
          fallback: true,
        });
      }

      const statementPrompt = `You are an expert accountant and OCR parser for Indian business party statements, dealer ledger sheets, and financial accounts for Shri Sai Enterprises.
Analyze this financial statement / ledger (PDF or image) and extract the financial ledger table in strictly valid JSON format matching this schema:
{
  "partyName": "Wholesaler or Dealer Name (e.g. Manisha Enterprises, LG Electronics, Godrej, etc.)",
  "openingBalance": 0,
  "closingBalance": 0,
  "statementPeriod": "Date range if mentioned",
  "rows": [
    {
      "date": "YYYY-MM-DD",
      "particulars": "Description, Invoice or Voucher details",
      "vchType": "Purchase | Payment | Journal | Receipt",
      "vchNo": "Bill or Voucher Number",
      "debit": 0,
      "credit": 0,
      "balance": 0
    }
  ]
}
Ensure:
1. Every ledger row has date (YYYY-MM-DD), particulars, debit (purchase/bill amount), credit (payment amount), and running balance.
2. Numeric values must be numbers, not strings with commas.
3. Respond with strictly valid JSON only.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  mimeType: resolvedMime,
                  data: cleanBase64,
                },
              },
              {
                text: statementPrompt,
              },
            ],
          },
        ],
        config: {
          responseMimeType: "application/json",
        },
      });

      const responseText = response.text || "{}";
      let parsedData;
      try {
        parsedData = JSON.parse(responseText);
      } catch (parseError) {
        const cleaned = responseText.replace(/```json\s*/gi, "").replace(/```\s*$/gi, "").trim();
        parsedData = JSON.parse(cleaned);
      }

      return res.json({
        success: true,
        data: parsedData,
      });
    } catch (err: any) {
      console.error("Error in /api/parse-party-statement:", err);
      return res.status(500).json({
        error: err?.message || "Failed to parse party statement with AI",
      });
    }
  });

  // Real-time Order & Sales Broadcast System (SSE + Polling)
  interface RealtimeEvent {
    id: string;
    type: 'order_placed' | 'cart_updated' | 'collection_recorded';
    data: any;
    timestamp: number;
  }

  const recentRealtimeEvents: RealtimeEvent[] = [];
  const sseClients = new Set<express.Response>();

  // SSE Stream Endpoint
  app.get("/api/realtime/events", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    // Send welcome / connected heartbeat
    res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`);

    sseClients.add(res);

    // Keep connection alive with periodic heartbeat comment
    const heartbeatTimer = setInterval(() => {
      res.write(": heartbeat\n\n");
    }, 25000);

    req.on("close", () => {
      clearInterval(heartbeatTimer);
      sseClients.delete(res);
    });
  });

  // Broadcast new order notification
  app.post("/api/realtime/order-notification", (req, res) => {
    const { type = 'order_placed', order } = req.body;
    if (!order) {
      return res.status(400).json({ error: "Missing order data" });
    }

    const event: RealtimeEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type,
      data: order,
      timestamp: Date.now(),
    };

    recentRealtimeEvents.unshift(event);
    if (recentRealtimeEvents.length > 50) {
      recentRealtimeEvents.pop();
    }

    // Broadcast to all active SSE subscribers
    const payload = `data: ${JSON.stringify(event)}\n\n`;
    for (const client of sseClients) {
      try {
        client.write(payload);
      } catch (err) {
        sseClients.delete(client);
      }
    }

    return res.json({
      success: true,
      broadcastCount: sseClients.size,
      eventId: event.id,
    });
  });

  // Polling fallback endpoint for clients behind strict proxies or mobile webviews
  app.get("/api/realtime/recent-orders", (req, res) => {
    const since = Number(req.query.since) || 0;
    const events = recentRealtimeEvents.filter((e) => e.timestamp > since);
    res.json({
      events,
      serverTime: Date.now(),
      activeListeners: sseClients.size,
    });
  });

  // API endpoint: Gemini AI Zero-Watermark Festival & Scheme Promo Generator
  app.post("/api/generate-promo", async (req, res) => {
    try {
      const {
        occasion = "गुढीपाडवा विशेष",
        product = "इलेक्ट्रॉनिक्स व फर्निचर",
        offer = "भरघोस डिस्काउंट व सुलभ फायनान्स",
        gift = "प्रत्येक खरेदीवर खात्रीशीर भेट",
        customNotes = "",
        businessName = "श्री साई एंटरप्रायझेस (SHRI SAI ENTERPRISES)",
        phone = "8766486915 / 8600122798",
        address = "मातोश्री सभागृह समोर, आर्वी रोड, वर्धा",
        whatsappGroupLink = "https://chat.whatsapp.com/CLcaeUq1bHH1RE0203oPaP?s=cl&p=a&mlu=4&ilr=4",
      } = req.body;

      const prompt = `तुम्ही 'श्री साई एंटरप्रायझेस, वर्धा' (इलेक्ट्रॉनिक्स, फर्निचर, कुलर, फ्रीज, सोफा, आणि ३०-महिन्यांची साप्ताहिक बचत योजना) साठी व्यावसायिक मराठी कॉपीरायटर आहात.
खालील मुद्द्यांवर आधारित ग्राहकांना आकर्षित करणारा, अत्यंत सुंदर, वाचायला सोपा आणि मराठी सणासुदीचा व्हॉट्सॲप मेसेज (WhatsApp Promo Message) तयार करा:

- सण / प्रसंग: ${occasion}
- वस्तू / ऑफर: ${product}
- सूट / फायनान्स: ${offer}
- मोफत भेट: ${gift}
${customNotes ? `- विशेष माहिती: ${customNotes}\n` : ''}- दुकान नाव: ${businessName}
- पत्ता: ${address}
- संपर्क नंबर: ${phone}
- व्हॉट्सॲप ग्रुप: ${whatsappGroupLink}

महत्त्वाचे नियम:
1. मेसेज संपूर्ण मराठीत (किंवा सोप्या मराठी-इंग्रजी मिश्रित) व आकर्षक इमोजीसह (🎉, 🌸, 💥, 🎁, 📞, 📍) असावा.
2. कोणत्याही प्रकारचे AI वॉटरमार्क, AI स्वाक्षरी, किंवा मेटा-कमेंट्स (उदा. "Here is your message:", "Generated by Gemini", "AI disclaimer") मुळीच देऊ नका.
3. थेट कॉपी-पेस्ट करून ग्राहकांना पाठवता येईल असाच शुद्ध मेसेज द्या.`;

      const ai = getGenAI();
      if (ai) {
        try {
          const response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: prompt,
            config: {
              systemInstruction: "You are an expert Marathi retail marketing copywriter for Shri Sai Enterprises. Output strictly the clean, beautiful WhatsApp promo text with emojis. Never include any AI signatures, watermarks, intro greetings, or metadata.",
              temperature: 0.7,
            },
          });

          const message = response.text?.trim();
          if (message) {
            return res.json({
              success: true,
              message,
              provider: "gemini",
            });
          }
        } catch (geminiErr) {
          console.warn("Gemini promo generation error, falling back to clean template:", geminiErr);
        }
      }

      // Zero-Watermark High-Converting Fallback Generator
      const cleanMessage = `🎉 *${occasion.toUpperCase()} महाधमाका ऑफर!* 🎉
*${businessName}* कडून सर्व ग्राहकांना सस्नेह नमस्कार! 🙏✨

घर सजवा आणि आनंद द्विगुणीत करा! आमच्या शोरूममध्ये खास सणानिमित्त सुरू आहे भव्य सेल:

✨ *ऑफरचे मुख्य आकर्षण:*
━━━━━━━━━━━━━━━━━
🛍️ *वस्तू:* ${product}
💰 *खास सवलत:* ${offer}
🎁 *मोफत भेट:* ${gift}
${customNotes ? `⭐ *विशेष:* ${customNotes}\n` : ''}━━━━━━━━━━━━━━━━━

💳 *बजाज / टीव्हीएस / एचडीबी फायनान्सवर ०% व्याजावर सुलभ हप्ते उपलब्ध!*
🤝 *३०-महिन्यांची साप्ताहिक बचत कार्ड योजना सुरू (कमी हप्त्यात मोठी बचत)!*

👉 *अधिकृत व्हॉट्सॲप ग्रुप जॉईन करा व रोजच्या ऑफर्स मिळवा:*
${whatsappGroupLink}

📍 *पत्ता:* ${address}
📞 *संपर्क / ऑर्डर:* ${phone}

_आजच भेट द्या आणि आपल्या पसंतीचे सामान घेऊन जा!_ ✨`;

      return res.json({
        success: true,
        message: cleanMessage,
        provider: "template",
      });
    } catch (err: any) {
      console.error("Error generating promo:", err);
      return res.status(500).json({ error: "Failed to generate promo message" });
    }
  });

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });

    // Cleanly suppress Vite HMR websocket unhandled rejection in AI Studio preview (DISABLE_HMR=true)
    app.use((req, res, next) => {
      if (req.url && req.url.startsWith('/@vite/client')) {
        const originalWrite = res.write;
        const originalEnd = res.end;
        const chunks: Buffer[] = [];

        res.write = function(chunk: any, ...args: any[]) {
          if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          return true;
        } as any;

        res.end = function(chunk: any, ...args: any[]) {
          if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          let body = Buffer.concat(chunks).toString('utf8');

          body = body.replace('throw e;', '/* HMR unhandled rejection suppressed in AI Studio */');
          body = body.replace(/console\.error\(`\[vite\] failed to connect to websocket/g, 'console.debug(`[vite] failed to connect to websocket');
          body = body.replace('error: (err) => console.error("[vite]", err)', 'error: (err) => console.debug("[vite]", err)');

          res.setHeader('Content-Length', Buffer.byteLength(body));
          return (originalEnd as any).call(this, body, ...args);
        } as any;
      }
      next();
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Shri Sai Enterprises ERP server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
