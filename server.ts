import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

// Safe directory resolution compatible with both ESM (tsx dev) and CommonJS (esbuild dist/server.cjs)
const getAppDirname = (): string => {
  try {
    if (typeof __dirname !== 'undefined' && __dirname) {
      return __dirname;
    }
    if (typeof import.meta !== 'undefined' && import.meta.url) {
      return path.dirname(fileURLToPath(import.meta.url));
    }
  } catch (e) {
    // Fallback if environment doesn't provide URL
  }
  return process.cwd();
};

const appDirname = getAppDirname();

dotenv.config();

async function startServer() {
  const app = express();

  // Increase payload limit for base64 bill photos (supports high-res images)
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // API & Container Health checks (for Cloud Run startup/liveness probes & internal monitoring)
  const healthCheckHandler = (req: express.Request, res: express.Response) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  };
  app.get('/api/health', healthCheckHandler);
  app.get('/health', healthCheckHandler);
  app.get('/healthz', healthCheckHandler);

  // API: Scan Purchase Invoice / Bill via Gemini AI Multimodal Vision
  app.post('/api/scan-purchase-invoice', async (req, res) => {
    try {
      const { imageBase64, mimeType } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ success: false, error: 'Image data is required' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(503).json({
          success: false,
          error: 'GEMINI_API_KEY is not configured in server environment.',
          needKey: true,
        });
      }

      let cleanBase64 = imageBase64;
      let detectedMime = mimeType || 'image/jpeg';
      if (imageBase64.includes(';base64,')) {
        const parts = imageBase64.split(';base64,');
        detectedMime = parts[0].replace('data:', '') || detectedMime;
        cleanBase64 = parts[1];
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const prompt = `You are an expert OCR and retail invoice data extraction specialist for electronics, home appliances, and furniture store purchase bills (खरेदी बीजक / Tax Invoice).
Your task is to analyze the attached purchase bill/invoice image, accurately read English, Hindi, and Marathi text, and extract all supplier, bill, product items, serial numbers, taxes, and billing totals.

Return strictly valid JSON with this exact schema:
{
  "supplierName": "Name of supplier/distributor/company (e.g. MANISHA ENTERPRISES, LG ELECTRONICS, SAMSUNG, GODREJ, etc.)",
  "supplierAddress": "Address of supplier or empty string",
  "supplierPhone": "Phone or mobile number if present, else empty string",
  "supplierGstin": "15-character GSTIN number if present, else empty string",
  "supplierState": "MAHARASHTRA",
  "buyerName": "Buyer name (e.g. SHRI SAI ENTERPRISES) if printed, else empty string",
  "buyerGstin": "Buyer GSTIN if printed, else empty string",
  "buyerAddress": "Buyer address if printed, else empty string",
  "billNo": "Invoice/Bill number as printed on bill",
  "date": "Invoice date in YYYY-MM-DD format (convert DD/MM/YYYY or DD-MM-YYYY to YYYY-MM-DD)",
  "poNo": "Purchase order / PO number if mentioned, else empty string",
  "poDate": "PO date in YYYY-MM-DD or empty string",
  "location": "Location / Warehouse / Distribution branch if shown, else 'DISTRIBUTION WAREHOUSE'",
  "salesConsultant": "Sales person or consultant name if shown, else empty string",
  "approvedBy": "Approved by name if shown, else empty string",
  "transporter": "Transporter name if mentioned, else 'GENERAL TRANSPORT'",
  "vehicleNo": "Vehicle number if mentioned, else empty string",
  "items": [
    {
      "description": "Clear product description with brand and model (e.g. 'LG GLT2216WYRI Refrigerator 240L', 'Samsung 43 Inch Smart LED TV', etc.)",
      "hsn": "HSN code (e.g. '84182100', '84501100', '85287200', etc.) or empty string",
      "qty": 1,
      "rate": 20000,
      "discount": 0,
      "taxRate": 18,
      "taxableAmount": 20000,
      "taxAmount": 3600,
      "totalAmount": 23600,
      "serialNumbers": ["602NRZX294301", "602NRQV293652"]
    }
  ],
  "subtotal": 20000,
  "cgstAmount": 1800,
  "sgstAmount": 1800,
  "igstAmount": 0,
  "totalTax": 3600,
  "totalAmount": 23600,
  "paidAmount": 0,
  "paymentMode": "Online",
  "supplierBank": {
    "accountName": "Supplier bank account name if mentioned",
    "accountNo": "Bank account number if mentioned",
    "ifscCode": "IFSC code if mentioned",
    "bankName": "Bank name",
    "branch": "Branch name"
  },
  "notes": "Any special notes, scheme discounts, or delivery details mentioned on bill"
}

Important Instructions:
1. Extract every individual item line row in the bill.
2. Carefully look for Serial Numbers, IMEI numbers, Barcodes, or Unit Numbers printed on the bill (often in a dedicated column, below the item name, or in a serial list at the bottom). Put each individual serial into the 'serialNumbers' array.
3. Ensure all numbers (qty, rate, discount, taxRate, taxableAmount, taxAmount, totalAmount, subtotal, cgstAmount, sgstAmount, igstAmount, totalTax) are numbers, NOT strings.
4. If rate is per unit, ensure line totalAmount = taxableAmount + taxAmount.
5. If payment status or paid amount is marked on the bill, extract it; otherwise default paidAmount to 0.
6. Return ONLY the JSON object. Do not include extra conversational text or formatting outside the JSON.`;

      const imagePart = {
        inlineData: {
          mimeType: detectedMime,
          data: cleanBase64,
        },
      };

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            parts: [
              imagePart,
              { text: prompt },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });

      let responseText = response.text || '{}';
      responseText = responseText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
      const parsedData = JSON.parse(responseText);

      return res.json({
        success: true,
        data: parsedData,
      });
    } catch (err: any) {
      console.error('Error processing invoice with Gemini Vision:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to parse invoice with AI Vision',
      });
    }
  });

  // API: Scan Dealer / Supplier Ledger Statement & Invoices (PDF or Image)
  app.post('/api/scan-dealer-statement', async (req, res) => {
    try {
      const { fileBase64, imageBase64, mimeType } = req.body;
      const rawBase64 = fileBase64 || imageBase64;
      if (!rawBase64) {
        return res.status(400).json({ success: false, error: 'Document or image data is required' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(503).json({
          success: false,
          error: 'GEMINI_API_KEY is not configured in server environment.',
          needKey: true,
        });
      }

      let cleanBase64 = rawBase64;
      let detectedMime = mimeType || 'application/pdf';
      if (rawBase64.includes(';base64,')) {
        const parts = rawBase64.split(';base64,');
        detectedMime = parts[0].replace('data:', '') || detectedMime;
        cleanBase64 = parts[1];
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const statementPrompt = `You are an expert financial auditor and retail ledger reconciliation specialist for electronics, home appliances, and furniture dealerships.
Your task is to analyze the attached supplier/dealer account statement or purchase invoice (PDF or image).
Suppliers include companies like MANISHA ENTERPRISES, LG ELECTRONICS, SAMSUNG, GODREJ, VOLTAS, BAJAJ, or local distributors.
The buyer is SHRI SAI ENTERPRISES (श्री साई एंटरप्रायझेस, वर्धा).

Carefully extract:
1. Supplier / Dealer identity: Name, phone, address, GSTIN.
2. Document type: Determine whether this is a "STATEMENT" (account statement/ledger covering multiple dates/invoices/payments) or a single "INVOICE" (purchase bill).
3. If statement: Extract statement date range, opening balance, closing balance, total debits, total credits.
4. Extract every transaction row in chronological order:
   - date: formatted as YYYY-MM-DD
   - type: "INVOICE" (when goods were billed/debit to buyer) or "PAYMENT" (when buyer paid via NEFT/RTGS/UPI/Cheque/Cash credit)
   - refNo: Invoice number (e.g. CS/2526/0842, INV-9812) or Payment reference (e.g. UTR, Cheque No, Bank Ref)
   - particulars: Brief item summary (e.g. "LG 240L Fridge 2 Nos", "Payment via NEFT", etc.)
   - debit: Amount billed for goods (number, 0 if payment)
   - credit: Amount paid to supplier (number, 0 if invoice)
   - balance: Running balance if shown (number)

Return strictly valid JSON with this exact schema:
{
  "documentType": "STATEMENT" or "INVOICE",
  "dealerName": "Supplier / Dealer Name",
  "dealerPhone": "Supplier Phone or mobile",
  "dealerAddress": "Supplier Address",
  "dealerGstin": "Supplier GSTIN",
  "statementPeriod": "e.g. 01/04/2025 to 31/03/2026",
  "openingBalance": 0,
  "closingBalance": 45000,
  "totalDebits": 125000,
  "totalCredits": 80000,
  "summaryNotes": "Brief 1-line note summarizing statement status",
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "type": "INVOICE",
      "refNo": "INV-1029",
      "particulars": "LG Refrigerators & LED TV",
      "debit": 45000,
      "credit": 0,
      "balance": 45000
    },
    {
      "date": "YYYY-MM-DD",
      "type": "PAYMENT",
      "refNo": "UTR-ICICI90214",
      "particulars": "NEFT Payment from SBI A/c",
      "debit": 0,
      "credit": 30000,
      "balance": 15000
    }
  ]
}

Important Instructions:
- Ensure all numbers (debit, credit, balance, openingBalance, closingBalance, totalDebits, totalCredits) are numeric numbers, NOT strings.
- Dates must be in YYYY-MM-DD format.
- Return ONLY the JSON object. Do not wrap in conversational text.`;

      const filePart = {
        inlineData: {
          mimeType: detectedMime,
          data: cleanBase64,
        },
      };

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            parts: [
              filePart,
              { text: statementPrompt },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });

      let responseText = response.text || '{}';
      responseText = responseText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
      const parsedData = JSON.parse(responseText);

      return res.json({
        success: true,
        data: parsedData,
      });
    } catch (err: any) {
      console.error('Error processing dealer statement with Gemini Vision:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to parse dealer statement with AI Vision',
      });
    }
  });

  // Serve production build if NODE_ENV is production
  const distCandidates = [
    path.resolve(process.cwd(), 'dist'),
    path.resolve(appDirname),
    path.resolve(appDirname, 'dist'),
  ];
  const distPath = distCandidates.find((dir) => {
    return fs.existsSync(path.join(dir, 'index.html')) && fs.existsSync(path.join(dir, 'assets'));
  }) || path.resolve(process.cwd(), 'dist');
  const indexHtmlPath = path.join(distPath, 'index.html');
  const isProduction = process.env.NODE_ENV === 'production' || 
                       (typeof __filename !== 'undefined' && __filename.endsWith('server.cjs')) ||
                       (Boolean(process.env.K_SERVICE) && !process.env.K_SERVICE.startsWith('ais-dev-'));

  if (!isProduction) {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: {
          middlewareMode: true,
          hmr: false,
        },
        appType: 'spa',
      });
      app.use(vite.middlewares);
      console.log('Vite middleware successfully initialized and mounted');
    } catch (viteError: any) {
      console.warn('Vite dev server failed to initialize, falling back to static build:', viteError.message);
      if (fs.existsSync(distPath)) {
        app.use(express.static(distPath));
        app.get('*', (req, res) => {
          if (fs.existsSync(indexHtmlPath)) {
            res.sendFile(indexHtmlPath);
          } else {
            res.status(200).send('API Server is ready');
          }
        });
      }
    }
  } else {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      if (fs.existsSync(indexHtmlPath)) {
        res.sendFile(indexHtmlPath);
      } else {
        res.status(200).send('API Server is ready');
      }
    });
  }

  // AI Studio Dev Container and Cloud Run require binding to port 3000 on 0.0.0.0
  // Nginx proxies incoming traffic from port 8080 ($PORT) to internal port 3000.
  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server actively running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
