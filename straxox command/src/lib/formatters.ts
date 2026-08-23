// Internationalization formatters utilizing native Intl APIs

/**
 * Format a number as currency based on a locale and currency code.
 */
export const formatCurrency = (
  amount: number,
  currency: string = "USD",
  locale: string = "en-US"
) => {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format a date based on the user's locale.
 */
export const formatDate = (
  date: string | Date,
  locale: string = "en-US",
  options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' }
) => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "Invalid Date";
  return new Intl.DateTimeFormat(locale, options).format(d);
};

/**
 * Format a large number with abbreviations (e.g. 1M, 2.5K).
 */
export const formatCompactNumber = (
  number: number,
  locale: string = "en-US"
) => {
  return new Intl.NumberFormat(locale, {
    notation: "compact",
    compactDisplay: "short",
  }).format(number);
};
