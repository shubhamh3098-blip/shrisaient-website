import express, { Response } from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "25mb" }));

// ----------------------------------------------------------------------------
// PERSISTENT DATA & REAL-TIME MULTI-DEVICE SYNC ENGINE
// ----------------------------------------------------------------------------
const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "store_data.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let serverStoreData: any = null;

// Load persisted data on server boot
try {
  if (fs.existsSync(DATA_FILE)) {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    serverStoreData = JSON.parse(raw);
    console.log(`[Realtime Sync] Loaded existing store data from ${DATA_FILE}`);
  }
} catch (err) {
  console.error("[Realtime Sync] Failed reading data file:", err);
}

// Active Server-Sent Events (SSE) clients for real-time live sync
const sseClients = new Set<Response>();

function broadcastSyncUpdate(updatedData: any, sourceDeviceId?: string) {
  const payload = JSON.stringify({
    type: "REALTIME_STORE_UPDATE",
    version: updatedData.updatedAt || new Date().toISOString(),
    updatedBy: updatedData.updatedBy || "Realtime Sync",
    sourceDeviceId: sourceDeviceId || "unknown",
    data: updatedData,
  });

  for (const client of sseClients) {
    try {
      client.write(`data: ${payload}\n\n`);
    } catch {
      sseClients.delete(client);
    }
  }
}

// 1. Get current server state
app.get("/api/sync", (_req, res) => {
  res.json({
    success: true,
    data: serverStoreData,
    version: serverStoreData?.updatedAt || null,
    connectedDevices: sseClients.size,
  });
});

// 2. Push client updates to server (from mobile agent phone or counter computer)
app.post("/api/sync", (req, res) => {
  const { data, sourceDeviceId } = req.body;
  if (!data) {
    return res.status(400).json({ success: false, message: "Missing store data payload" });
  }

  // Stamp updated timestamp
  data.updatedAt = new Date().toISOString();
  serverStoreData = data;

  // Persist to disk asynchronously
  fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf-8", (err) => {
    if (err) console.error("[Realtime Sync] Error saving store data to file:", err);
  });

  // Broadcast in real-time to all connected mobile agents and desktops
  broadcastSyncUpdate(data, sourceDeviceId);

  res.json({
    success: true,
    version: data.updatedAt,
    connectedDevices: sseClients.size,
  });
});

// 3. Server-Sent Events stream for instant real-time synchronization
app.get("/api/sync/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  sseClients.add(res);

  // Send initial handshake
  res.write(
    `data: ${JSON.stringify({
      type: "INIT_CONNECTED",
      version: serverStoreData?.updatedAt || null,
      message: "Real-time sync connected to Shri Sai Central Server",
      timestamp: new Date().toISOString(),
    })}\n\n`
  );

  // Keep-alive heartbeat every 20 seconds
  const heartbeat = setInterval(() => {
    try {
      res.write(": keepalive\n\n");
    } catch {
      clearInterval(heartbeat);
      sseClients.delete(res);
    }
  }, 20000);

  req.on("close", () => {
    clearInterval(heartbeat);
    sseClients.delete(res);
  });
});

// 4. Quick Agent Weekly Collection Endpoint (Ultra-lightweight for field agents on 2G/3G)
app.post("/api/agent/quick-collect", (req, res) => {
  const { cardNo, memberName, amount, paymentMode = "Cash", collectedBy = "Field Agent", monthNumber, remarks = "" } = req.body;

  if (!cardNo || !amount) {
    return res.status(400).json({ success: false, message: "Card number and amount are required" });
  }

  if (!serverStoreData) {
    return res.status(400).json({ success: false, message: "Store not initialized yet" });
  }

  const collectAmt = Number(amount) || 0;
  const now = new Date();
  const receiptNo = `SCH-REC-${Date.now().toString().slice(-6)}`;

  // Find card member
  const memberIndex = (serverStoreData.cardMembers || []).findIndex(
    (m: any) => m.cardNo.trim().toLowerCase() === cardNo.trim().toLowerCase()
  );

  let updatedMember = null;
  if (memberIndex !== -1) {
    const mem = serverStoreData.cardMembers[memberIndex];
    mem.paidAmount = (mem.paidAmount || 0) + collectAmt;
    mem.completedMonths = Math.min(30, (mem.completedMonths || 0) + (monthNumber ? 1 : Math.round(collectAmt / (mem.weeklyInstallment * 4 || 1000))));
    mem.lastPaymentDate = now.toISOString();
    updatedMember = mem;
  }

  const newTx = {
    id: `ct-${Date.now()}`,
    receiptNo,
    cardMemberId: updatedMember?.id || `cm-${cardNo}`,
    cardNo,
    memberName: memberName || updatedMember?.memberName || "Customer",
    monthNumber: monthNumber || updatedMember?.completedMonths || 1,
    amount: collectAmt,
    date: now.toISOString(),
    paymentMode,
    collectedBy,
    remarks,
  };

  if (!serverStoreData.cardTransactions) {
    serverStoreData.cardTransactions = [];
  }
  serverStoreData.cardTransactions.unshift(newTx);
  serverStoreData.updatedAt = now.toISOString();
  serverStoreData.updatedBy = `${collectedBy} (Mobile Field App)`;

  fs.writeFile(DATA_FILE, JSON.stringify(serverStoreData, null, 2), "utf-8", (err) => {
    if (err) console.error("Error saving quick collection:", err);
  });

  broadcastSyncUpdate(serverStoreData, "agent-mobile-quick");

  res.json({
    success: true,
    receiptNo,
    transaction: newTx,
    updatedMember,
  });
});

// Lazy initialization for Gemini client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return geminiClient;
}

// Health Check API
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    time: new Date().toISOString(),
  });
});

// Helper: Generate dynamic smart Marathi promotional fallback
function generateSmartPromoFallback(params: {
  festivalName: string;
  category: string;
  discount: string;
  schemeWeekly: string;
  customMessage?: string;
  shopPhone?: string;
  shopAddress?: string;
}) {
  const {
    festivalName,
    category,
    discount,
    schemeWeekly,
    customMessage,
    shopPhone = "7822859073",
    shopAddress = "मातोश्री सभागृह समोर, आर्वी रोड, वर्धा",
  } = params;

  let themeColor = "#b45309";
  const lowerFest = (festivalName || "").toLowerCase();
  if (lowerFest.includes("दिवाळी") || lowerFest.includes("diwali") || lowerFest.includes("लक्ष्मी")) {
    themeColor = "#dc2626";
  } else if (lowerFest.includes("दसरा") || lowerFest.includes("dussehra")) {
    themeColor = "#7c3aed";
  } else if (lowerFest.includes("गुढी") || lowerFest.includes("पाडवा") || lowerFest.includes("padwa")) {
    themeColor = "#d97706";
  } else if (lowerFest.includes("उन्हाळा") || lowerFest.includes("कूलर") || lowerFest.includes("कुलर") || lowerFest.includes("summer")) {
    themeColor = "#0284c7";
  } else if (lowerFest.includes("साप्ताहिक") || lowerFest.includes("योजना") || lowerFest.includes("scheme")) {
    themeColor = "#059669";
  }

  const headline = `🚩 श्री साई इंटरप्रायजेस, वर्धा - भव्य ${festivalName} विशेष महाधमाका सेल! 🎁`;

  const bullets = [
    `✨ ${category} वर तब्बल ${discount} पर्यंत थेट फेस्टिव्हल डिस्काउंट!`,
    `💳 ३०-महिने साप्ताहिक बचत कार्ड: दर आठवड्याला फक्त ₹${schemeWeekly} चा सुलभ हप्ता!`,
    `🏆 प्रत्येक खरेदीवर हमखास भेटवस्तू व लकी ड्रॉ मध्ये आकर्षक बक्षिसे!`,
    `🚚 ०% व्याज फायनान्स (Bajaj/TVS) सह वर्धा शहर व ग्रामीण भागात मोफत होम डिलिव्हरी!`
  ];

  const whatsappMessage = `🚩 *श्री साई इंटरप्रायजेस, वर्धा* 🚩
✨ *${festivalName} विशेष सणवार महा ऑफर!* ✨

घर सजवा दर्जेदार इलेक्ट्रॉनिक्स आणि १००% अस्सल चंद्रपूर सागवान लाकडी फर्निचरने थेट फॅक्टरी दरात!

🎁 *मुख्य सणवार ऑफर्स:*
🔹 *${category}* वर तब्बल *${discount} पर्यंत भव्य सूट!*
🔹 *३०-महिने साप्ताहिक योजना:* दर आठवड्याला फक्त *₹${schemeWeekly} चा हप्ता!*
🔹 प्रत्येक खरेदीवर हमखास भेटवस्तू व दरमहा लकी ड्रॉ मध्ये आकर्षक बक्षिसे!
🔹 ०% व्याज फायनान्स (Bajaj Finance / TVS Credit) सह त्वरित मंजुरी.
🔹 वर्धा शहर व ग्रामीण भागात मोफत सुरक्षित होम डिलिव्हरी.
${customMessage ? `🔹 *विशेष सूचना:* ${customMessage}\n` : ''}
📍 *पत्ता:* श्री साई इंटरप्रायजेस, ${shopAddress}
📞 *संपर्क:* ${shopPhone} / 8766486915
💬 *थेट व्हॉट्सॲप ऑर्डर / चौकशी:*
https://wa.me/91${shopPhone}?text=${encodeURIComponent(`नमस्कार, मला ${festivalName} विशेष ऑफरबद्दल माहिती हवी आहे.`)}`;

  return {
    headline,
    whatsappMessage,
    bannerTagline: `${festivalName} निमित्त दर्जेदार वस्तू आणि सर्वात मोठा डिस्काउंट धमाका!`,
    offerBullets: bullets,
    themeColor,
  };
}

// 6. सणवार व साप्ताहिक ऑफर्स व्हॉट्सॲप ब्रॉडकास्ट (AI Promo Creative Generator with Gemini Free Tier & Resilient Fallback)
app.post("/api/generate-promo", async (req, res) => {
  const {
    festivalName = "गुढीपाडवा",
    category = "इलेक्ट्रॉनिक्स व फर्निचर",
    discount = "30%",
    schemeWeekly = "100",
    customMessage = "",
    shopPhone = "7822859073",
    shopAddress = "मातोश्री सभागृह समोर, आर्वी रोड, वर्धा",
  } = req.body;

  const fallbackData = generateSmartPromoFallback({
    festivalName,
    category,
    discount,
    schemeWeekly,
    customMessage,
    shopPhone,
    shopAddress,
  });

  const ai = getGeminiClient();

  if (!ai) {
    return res.json({
      success: true,
      source: "template-engine",
      ...fallbackData,
    });
  }

  const prompt = `You are an expert Marathi advertising copywriter for "श्री साई इंटरप्रायजेस" (Shri Sai Enterprises), a leading electronics and teakwood furniture showroom in Wardha, Maharashtra.
The shop sells Smart 4K TVs, Inverter Refrigerators, Coolers, Teakwood Sofas (3+1+1), Sagwan Diwan beds (4x6, 5x6), Steel Cupboards, and runs a famous "३०-महिने साप्ताहिक बचत कार्ड योजना" with weekly installments of ₹100 or ₹200.

Generate an appealing Marathi festive WhatsApp broadcast message and promotional flyer details for:
- Festival/Event: ${festivalName}
- Category: ${category}
- Discount: ${discount}
- Weekly Scheme installment: ₹${schemeWeekly}/week
- Shop address: ${shopAddress}
- Phone: ${shopPhone}
- Extra note: ${customMessage}

Format your response as a valid JSON object ONLY with the following structure (no markdown fences, just pure JSON):
{
  "headline": "Short punchy Marathi headline with festival vibe and emojis",
  "whatsappMessage": "Full ready-to-send Marathi WhatsApp message formatted with bold asterisks, emojis, bullet points, shop address, and contact number",
  "bannerTagline": "Catchy Marathi banner tagline (max 10 words)",
  "offerBullets": ["Marathi offer highlight 1", "Marathi offer highlight 2", "Marathi offer highlight 3", "Marathi offer highlight 4"],
  "themeColor": "hex color code representing the festival (e.g., #b45309 for orange/gold, #dc2626 for festive red, #047857 for emerald)"
}`;

  let responseText = "";
  let activeSource = "gemini-3.8-flash";

  // Tier 1: Try Primary Model (gemini-3.8-flash)
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });
    responseText = response.text || "";
  } catch (primaryErr: any) {
    console.warn("Primary model gemini-3.8-flash unavailable/busy:", primaryErr?.message || primaryErr);
    
    // Tier 2: Try Secondary High-Throughput Model (gemini-3.1-flash-lite)
    try {
      activeSource = "gemini-3.1-flash-lite";
      const liteResponse = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });
      responseText = liteResponse.text || "";
    } catch (liteErr: any) {
      console.warn("Secondary model gemini-3.1-flash-lite also unavailable:", liteErr?.message || liteErr);
      // Both AI models busy/unavailable (e.g. 503 high demand spike).
      // Seamlessly deliver smart fallback without failing with HTTP 500!
      return res.json({
        success: true,
        source: "smart-template-engine",
        ...fallbackData,
      });
    }
  }

  // Parse JSON response safely
  let parsedData = {};
  try {
    // Strip markdown fences if present
    const cleanText = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();
    parsedData = JSON.parse(cleanText);
  } catch {
    parsedData = {
      headline: `🚩 श्री साई इंटरप्रायजेस - ${festivalName} विशेष ऑफर!`,
      whatsappMessage: responseText || fallbackData.whatsappMessage,
      bannerTagline: fallbackData.bannerTagline,
      offerBullets: fallbackData.offerBullets,
      themeColor: fallbackData.themeColor,
    };
  }

  return res.json({
    success: true,
    source: activeSource,
    ...fallbackData,
    ...parsedData,
  });
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
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
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
