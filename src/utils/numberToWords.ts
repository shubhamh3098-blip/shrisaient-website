/**
 * Converts numbers to Indian English Currency Words (Crores, Lakhs, Thousands, Hundreds)
 * Example: 2063565 -> "Twenty Lakh Sixty-Three Thousand Five Hundred Sixty-Five"
 */

const ones = [
  '',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen',
];

const tens = [
  '',
  '',
  'Twenty',
  'Thirty',
  'Forty',
  'Fifty',
  'Sixty',
  'Seventy',
  'Eighty',
  'Ninety',
];

function twoDigits(num: number): string {
  if (num === 0) return '';
  if (num < 20) return ones[num];
  const t = tens[Math.floor(num / 10)];
  const o = ones[num % 10];
  return o ? `${t}-${o}` : t;
}

function threeDigits(num: number): string {
  const hundred = Math.floor(num / 100);
  const remainder = num % 100;
  let res = '';
  if (hundred > 0) {
    res += `${ones[hundred]} Hundred`;
    if (remainder > 0) res += ' ';
  }
  if (remainder > 0) {
    res += twoDigits(remainder);
  }
  return res;
}

export function numberToIndianWords(amount: number): string {
  if (isNaN(amount) || amount === 0) {
    return 'Indian Rupees Zero Only';
  }

  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const integerPart = Math.floor(absAmount);
  const decimalPart = Math.round((absAmount - integerPart) * 100);

  if (integerPart === 0 && decimalPart === 0) {
    return 'Indian Rupees Zero Only';
  }

  // Indian format grouping:
  // last 3 digits = hundreds
  // next 2 digits = thousands
  // next 2 digits = lakhs
  // remaining = crores

  const crores = Math.floor(integerPart / 10000000);
  let rem = integerPart % 10000000;
  const lakhs = Math.floor(rem / 100000);
  rem = rem % 100000;
  const thousands = Math.floor(rem / 1000);
  const hundreds = rem % 1000;

  const parts: string[] = [];

  if (crores > 0) {
    parts.push(`${numberToIndianWordsRaw(crores)} Crore`);
  }
  if (lakhs > 0) {
    parts.push(`${twoDigits(lakhs)} Lakh`);
  }
  if (thousands > 0) {
    parts.push(`${twoDigits(thousands)} Thousand`);
  }
  if (hundreds > 0) {
    parts.push(threeDigits(hundreds));
  }

  let words = parts.join(' ').trim();
  if (isNegative) words = `Minus ${words}`;

  let result = `Indian Rupees ${words}`;
  if (decimalPart > 0) {
    result += ` and ${twoDigits(decimalPart)} Paise`;
  }
  result += ' Only';

  return result;
}

function numberToIndianWordsRaw(num: number): string {
  if (num < 100) return twoDigits(num);
  if (num < 1000) return threeDigits(num);
  const thousands = Math.floor(num / 1000);
  const rem = num % 1000;
  let str = `${twoDigits(thousands)} Thousand`;
  if (rem > 0) str += ` ${threeDigits(rem)}`;
  return str;
}
