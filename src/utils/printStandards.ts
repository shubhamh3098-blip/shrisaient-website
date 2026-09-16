/**
 * Standardized Print Stylesheet and Printable Document Generation Utility
 * Ensures all reports, invoices, customer khata statements, and scheme passbooks
 * print in perfect format across A4 portrait/landscape and thermal formats.
 */

export interface PrintDocOptions {
  title: string;
  businessName?: string;
  businessPhone?: string;
  businessAddress?: string;
  gstin?: string;
  documentType?: 'INVOICE' | 'STATEMENT' | 'RECEIPT' | 'PASSBOOK' | 'REPORT';
  pageSize?: 'A4' | 'A5' | 'receipt';
  orientation?: 'portrait' | 'landscape';
}

export const getStandardPrintCss = (orientation: 'portrait' | 'landscape' = 'portrait', pageSize: 'A4' | 'A5' | 'receipt' = 'A4'): string => {
  return `
    @page {
      size: ${pageSize} ${orientation};
      margin: 8mm 10mm 10mm 10mm;
    }
    *, *:before, *:after {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff !important;
      color: #0f172a !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.35;
    }
    .print-container {
      width: 100%;
      max-width: 100%;
      margin: 0 auto;
      padding: 0;
    }
    .header-bar {
      border-bottom: 2.5px solid #0f172a;
      padding-bottom: 8px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .brand-title {
      font-size: 20pt;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
      letter-spacing: -0.5px;
    }
    .brand-subtitle {
      font-size: 9.5pt;
      color: #475569;
      margin: 3px 0 0 0;
    }
    .doc-type-badge {
      display: inline-block;
      padding: 4px 10px;
      background: #0f172a;
      color: #ffffff !important;
      font-size: 9pt;
      font-weight: 700;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      text-align: right;
    }
    .info-grid {
      display: flex;
      gap: 12px;
      margin-bottom: 12px;
    }
    .info-box {
      flex: 1;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 8px 12px;
      font-size: 9.5pt;
    }
    .info-box strong {
      color: #0f172a;
    }
    .kpi-row {
      display: flex;
      gap: 10px;
      margin-bottom: 12px;
    }
    .kpi-card {
      flex: 1;
      border: 1px solid #cbd5e1;
      background: #ffffff;
      border-radius: 6px;
      padding: 8px 10px;
      text-align: center;
    }
    .kpi-title {
      font-size: 8pt;
      text-transform: uppercase;
      color: #64748b;
      font-weight: 700;
    }
    .kpi-val {
      font-size: 14pt;
      font-weight: 800;
      color: #0f172a;
      margin-top: 2px;
      font-family: monospace;
    }
    .kpi-card.due {
      background: #fff1f2;
      border-color: #fecdd3;
    }
    .kpi-card.due .kpi-val {
      color: #e11d48;
    }
    .kpi-card.paid {
      background: #f0fdf4;
      border-color: #bbf7d0;
    }
    .kpi-card.paid .kpi-val {
      color: #16a34a;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
      font-size: 9pt;
    }
    th {
      background-color: #f1f5f9;
      color: #0f172a;
      font-weight: 700;
      text-align: left;
      padding: 6px 8px;
      border: 1px solid #cbd5e1;
      white-space: nowrap;
    }
    td {
      padding: 6px 8px;
      border: 1px solid #e2e8f0;
      vertical-align: top;
    }
    tr:nth-child(even) td {
      background-color: #fafbfc;
    }
    tr {
      page-break-inside: avoid;
    }
    .text-right {
      text-align: right;
    }
    .text-center {
      text-align: center;
    }
    .font-mono {
      font-family: monospace;
      font-size: 9.5pt;
    }
    .font-bold {
      font-weight: 700;
    }
    .tag-bill {
      color: #1d4ed8;
      font-weight: 700;
    }
    .tag-receipt {
      color: #15803d;
      font-weight: 700;
    }
    .footer-section {
      margin-top: 25px;
      padding-top: 10px;
      border-top: 1px solid #cbd5e1;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      font-size: 8.5pt;
      color: #64748b;
      page-break-inside: avoid;
    }
    .sign-box {
      text-align: center;
      min-width: 160px;
    }
    .sign-line {
      border-bottom: 1px dashed #64748b;
      height: 35px;
      margin-bottom: 5px;
    }
    @media screen {
      body {
        background: #f1f5f9 !important;
        padding: 20px;
      }
      .print-container {
        background: #ffffff;
        padding: 25px;
        border-radius: 8px;
        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
      }
    }
  `;
};

/**
 * Executes a clean popup print job with standard CSS
 */
export const openStandardPrintWindow = (
  title: string,
  innerHtml: string,
  orientation: 'portrait' | 'landscape' = 'portrait',
  pageSize: 'A4' | 'A5' | 'receipt' = 'A4'
): boolean => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    // If popup blocked, fallback to window.print
    window.print();
    return false;
  }

  const css = getStandardPrintCss(orientation, pageSize);
  const fullHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>${css}</style>
    </head>
    <body>
      <div class="print-container">
        ${innerHtml}
      </div>
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.focus();
            window.print();
          }, 250);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(fullHtml);
  printWindow.document.close();
  return true;
};
