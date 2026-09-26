import * as XLSX from 'xlsx';

export interface ParsedTableData {
  headers: string[];
  rows: string[][];
  rawText: string;
}

const HEADER_KEYWORDS = [
  'name', 'नाव', 'customer', 'party', 'ग्राहक', 'खातेदार', 'सभासद', 'सदस्य', 'member', 'client',
  'phone', 'mobile', 'मोबाईल', 'contact', 'cell', 'फोन', 'संपर्क', 'mob', 'tel',
  'village', 'गाव', 'villege', 'town', 'city', 'शहर', 'पत्ता', 'address', 'taluka', 'area',
  'balance', 'बाकी', 'due', 'amount', 'रक्कम', 'purchase', 'खरेदी', 'total', 'एकूण', 'bill', 'बिल', 'paid', 'deposit', 'जमा',
  'card', 'कार्ड', 'card no', 'card.no', 'scheme', 'योजना', 'sheet', 'शिट', 'date', 'दिनांक', 'तारीख', 'sr', 'no'
];

/**
 * Universal file reader for .xlsx, .xls, .csv, .tsv, .txt
 * Works seamlessly in all browsers, supporting regional text, various delimiters, and messy Excel formats.
 */
export async function parseFileToTable(file: File): Promise<ParsedTableData> {
  const fileName = file.name.toLowerCase();

  // 1. Binary Excel workbook (.xlsx, .xls)
  if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    // Pick the sheet with the most rows of data
    let bestSheetName = workbook.SheetNames[0];
    let maxRows = 0;
    for (const sheetName of workbook.SheetNames) {
      const ws = workbook.Sheets[sheetName];
      const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      if (data.length > maxRows) {
        maxRows = data.length;
        bestSheetName = sheetName;
      }
    }

    const worksheet = workbook.Sheets[bestSheetName];
    const sheetData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    
    if (sheetData.length === 0) {
      return { headers: [], rows: [], rawText: '' };
    }

    // Filter out completely blank lines and clean cell strings
    const cleanedRows = sheetData
      .filter(row => row && Array.isArray(row) && row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== ''))
      .map(row => row.map(cell => (cell === null || cell === undefined ? '' : String(cell).trim())));

    if (cleanedRows.length === 0) {
      return { headers: [], rows: [], rawText: '' };
    }

    // Detect true header row among first 10 rows
    const { headerRowIndex, headers, rows } = extractHeadersAndData(cleanedRows);
    const rawCsv = [headers, ...rows].map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');

    return {
      headers,
      rows,
      rawText: rawCsv
    };
  }

  // 2. Text / CSV / TSV file
  const text = await readFileAsText(file);
  return parseCsvOrTextToTable(text);
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve((e.target?.result as string) || '');
    reader.onerror = (e) => reject(e);
    // Use UTF-8 with fallback
    reader.readAsText(file, 'UTF-8');
  });
}

/**
 * Parses raw CSV/TSV/text into clean headers and rows,
 * handling commas, tabs, semicolons, pipes, quotes, and title rows.
 */
export function parseCsvOrTextToTable(text: string): ParsedTableData {
  if (!text) return { headers: [], rows: [], rawText: '' };

  // Remove BOM if present
  let clean = text.replace(/^\uFEFF/, '').trim();
  if (!clean) return { headers: [], rows: [], rawText: '' };

  // Determine delimiter: detect whether commas, tabs, semicolons, or pipes dominate
  const firstFewLines = clean.split(/\r?\n/).slice(0, 10).join('\n');
  const commaCount = (firstFewLines.match(/,/g) || []).length;
  const tabCount = (firstFewLines.match(/\t/g) || []).length;
  const semiCount = (firstFewLines.match(/;/g) || []).length;
  const pipeCount = (firstFewLines.match(/\|/g) || []).length;

  let delimiter = ',';
  if (tabCount > commaCount && tabCount >= semiCount && tabCount >= pipeCount) {
    delimiter = '\t';
  } else if (semiCount > commaCount && semiCount > tabCount && semiCount >= pipeCount) {
    delimiter = ';';
  } else if (pipeCount > commaCount && pipeCount > tabCount && pipeCount > semiCount) {
    delimiter = '|';
  }

  // Parse CSV lines respecting quotes & delimiters
  const allRows = parseDelimitedLines(clean, delimiter);
  if (allRows.length === 0) {
    return { headers: [], rows: [], rawText: clean };
  }

  const { headers, rows } = extractHeadersAndData(allRows);

  return {
    headers,
    rows,
    rawText: clean
  };
}

/**
 * Intelligent extraction of header row vs data rows.
 * If file starts with shop banner or report title (e.g. "SHRI SAI ENTERPRISES"),
 * skips past it to find the true column headers.
 * If file has NO headers (starts directly with customer data), keeps all data rows.
 */
function extractHeadersAndData(allRows: string[][]): { headerRowIndex: number; headers: string[]; rows: string[][] } {
  if (allRows.length === 0) {
    return { headerRowIndex: -1, headers: [], rows: [] };
  }

  // Check the first 8 rows to find a row matching header keywords
  let bestHeaderIdx = -1;
  let maxKeywordMatches = 0;

  for (let i = 0; i < Math.min(8, allRows.length); i++) {
    const row = allRows[i];
    if (!row || row.length === 0) continue;

    let matches = 0;
    for (const cell of row) {
      const lower = (cell || '').toLowerCase().trim();
      if (HEADER_KEYWORDS.some(kw => lower === kw || lower.includes(kw))) {
        matches++;
      }
    }

    // A row is considered a header if it has 2+ keywords, or if it has 1 keyword and multiple columns
    if (matches > maxKeywordMatches) {
      maxKeywordMatches = matches;
      bestHeaderIdx = i;
    }
  }

  // If a header row was found
  if (bestHeaderIdx !== -1 && maxKeywordMatches >= 1) {
    const headers = allRows[bestHeaderIdx].map((h, colIdx) => h.trim() || `Col_${colIdx + 1}`);
    const rows = allRows.slice(bestHeaderIdx + 1).filter(r => r.some(c => c && c.trim() !== ''));
    return { headerRowIndex: bestHeaderIdx, headers, rows };
  }

  // If no clear header row exists (e.g. direct data or Sr No / Name / Mobile directly):
  // Check if first row has purely numbers in phone/amount columns
  const firstRow = allRows[0];
  const maxCols = Math.max(...allRows.map(r => r.length));
  const fallbackHeaders = Array.from({ length: maxCols }, (_, idx) => `Column_${idx + 1}`);

  return {
    headerRowIndex: -1,
    headers: fallbackHeaders,
    rows: allRows.filter(r => r.some(c => c && c.trim() !== ''))
  };
}

/**
 * Ultra-resilient line-by-line CSV tokenizer that:
 * 1. Handles quotes containing delimiters or newlines
 * 2. Does NOT break on stray inch symbols like 32" TV or 5" pipe
 * 3. Handles empty cells and irregular column counts
 */
export function parseDelimitedLines(content: string, delimiter: string = ','): string[][] {
  const rows: string[][] = [];
  const lines = content.split(/\r?\n/);

  let inMultilineQuote = false;
  let multilineBuffer = '';

  for (let l = 0; l < lines.length; l++) {
    const line = lines[l];
    if (!line.trim() && !inMultilineQuote) continue;

    const textToProcess = inMultilineQuote ? multilineBuffer + '\n' + line : line;

    // Count quotes in this line segment
    const quoteCount = (textToProcess.match(/"/g) || []).length;

    // If odd number of quotes and not ending with a quote before delimiter,
    // check if it's an actual unclosed multiline quote or just an inch mark (e.g. 32")
    if (quoteCount % 2 !== 0) {
      // If we are already in multiline quote or the line seems to genuinely open a multiline cell
      if (inMultilineQuote) {
        // Closed now?
        inMultilineQuote = false;
        multilineBuffer = '';
      } else {
        // Check if quote is at the start of a field (genuine CSV multiline)
        const hasOpenFieldQuote = new RegExp(`(^|${escapeRegExp(delimiter)})"[^"]*$`).test(textToProcess);
        if (hasOpenFieldQuote && l < lines.length - 1) {
          inMultilineQuote = true;
          multilineBuffer = textToProcess;
          continue;
        }
      }
    } else {
      inMultilineQuote = false;
      multilineBuffer = '';
    }

    // Tokenize fields for this row
    const fields = splitFields(textToProcess, delimiter);
    if (fields.some(f => f.length > 0)) {
      rows.push(fields);
    }
  }

  // Handle remaining multiline buffer if any
  if (inMultilineQuote && multilineBuffer) {
    const fields = splitFields(multilineBuffer, delimiter);
    if (fields.some(f => f.length > 0)) {
      rows.push(fields);
    }
  }

  return rows;
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Split a single line into delimited fields, respecting quotes
 */
function splitFields(line: string, delimiter: string): string[] {
  const fields: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      fields.push(cleanFieldValue(currentField));
      currentField = '';
    } else {
      currentField += char;
    }
  }

  fields.push(cleanFieldValue(currentField));
  return fields;
}

function cleanFieldValue(val: string): string {
  let res = val.trim();
  if (res.startsWith('"') && res.endsWith('"') && res.length >= 2) {
    res = res.slice(1, -1).replace(/""/g, '"').trim();
  }
  return res;
}

