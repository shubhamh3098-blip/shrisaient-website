import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase payload limit for base64 bill photos (supports high-res images)
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // API: Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

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

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : undefined,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
