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
    aiClient = new GoogleGenAI({ apiKey: key });
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
