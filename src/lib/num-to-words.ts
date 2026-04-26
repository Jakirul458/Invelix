// Convert a number to Indian-English words (rupees & paise).
// Example: 9200 -> "Nine Thousand Two Hundred"
const ones = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen",
];
const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function twoDigits(n: number): string {
  if (n < 20) return ones[n];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return tens[t] + (o ? " " + ones[o] : "");
}

function threeDigits(n: number): string {
  const h = Math.floor(n / 100);
  const r = n % 100;
  let out = "";
  if (h) out += ones[h] + " Hundred";
  if (r) out += (out ? " " : "") + twoDigits(r);
  return out;
}

export function numberToWordsIN(amount: number): string {
  if (!isFinite(amount)) return "";
  const isNeg = amount < 0;
  amount = Math.abs(amount);
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);

  if (rupees === 0 && paise === 0) return "Zero Only";

  const buildIntegerWords = (num: number): string => {
    if (num === 0) return "Zero";
    const crore = Math.floor(num / 10000000);
    const lakh = Math.floor((num % 10000000) / 100000);
    const thousand = Math.floor((num % 100000) / 1000);
    const rest = num % 1000;
    let parts: string[] = [];
    if (crore) parts.push(twoDigits(crore) + " Crore");
    if (lakh) parts.push(twoDigits(lakh) + " Lakh");
    if (thousand) parts.push(twoDigits(thousand) + " Thousand");
    if (rest) parts.push(threeDigits(rest));
    return parts.join(" ");
  };

  let str = "";
  if (rupees > 0) str = buildIntegerWords(rupees);
  if (paise > 0) {
    str += (str ? " and " : "") + twoDigits(paise) + " Paise";
  }
  return (isNeg ? "Minus " : "") + str + " Only";
}
