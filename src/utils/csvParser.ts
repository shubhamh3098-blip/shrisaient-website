// CSV Parsing and Date utilities for Shri Sai Enterprises

export function normalizeDate(str: string): string {
  if (!str) return '';
  const clean = str.trim().replace(/\//g, '-').replace(/\./g, '-');
  const parts = clean.split('-');
  if (parts.length === 3) {
    const d = parts[0].trim().padStart(2, '0');
    const m = parts[1].trim().padStart(2, '0');
    let y = parts[2].trim();
    if (y.length === 2) y = '20' + y;
    if (d.length <= 2 && y.length === 4) {
      return `${y}-${m}-${d}`;
    }
    if (parts[0].length === 4) {
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    }
  }
  return clean;
}

export function toNumber(val: any, defaultVal = 0): number {
  if (val === null || val === undefined || val === '') return defaultVal;
  if (typeof val === 'number') return isNaN(val) ? defaultVal : val;
  const cleaned = String(val).replace(/,/g, '').replace(/₹/g, '').trim();
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? defaultVal : parsed;
}

// Clean BOM and parse CSV lines properly
export function parseCSV(csvText: string): Record<string, string>[] {
  if (!csvText || !csvText.trim()) return [];
  // Strip BOM
  const sanitized = csvText.replace(/^\uFEFF/, '').trim();
  const rawLines = sanitized.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (rawLines.length < 2) return [];

  // Parse header
  const headers = splitCSVLine(rawLines[0]).map(h => h.trim().replace(/^["']|["']$/g, ''));

  const rows: Record<string, string>[] = [];
  for (let i = 1; i < rawLines.length; i++) {
    const values = splitCSVLine(rawLines[i]).map(v => v.trim().replace(/^["']|["']$/g, ''));
    if (!values.some(v => v.length > 0)) continue;
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      if (header) {
        row[header] = values[idx] !== undefined ? values[idx] : '';
      }
    });
    rows.push(row);
  }
  return rows;
}

function splitCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

export function getField(row: Record<string, string>, possibleKeys: string[], defaultVal = ''): string {
  // Normalize row keys for case-insensitive and trimmed lookup
  const rowKeys = Object.keys(row);
  for (const pKey of possibleKeys) {
    const exact = row[pKey];
    if (exact !== undefined && exact.trim() !== '') return exact.trim();

    const normalizedPKey = pKey.toLowerCase().replace(/[\s._-]/g, '');
    const foundKey = rowKeys.find(k => k.toLowerCase().replace(/[\s._-]/g, '') === normalizedPKey);
    if (foundKey && row[foundKey] !== undefined && row[foundKey].trim() !== '') {
      return row[foundKey].trim();
    }
  }
  return defaultVal;
}
