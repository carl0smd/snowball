/**
 * Formats a numeric value as a currency string with custom rule:
 * - USD ($) is always placed BEFORE the number.
 * - EUR (€) is always placed AFTER the number.
 * Formatting (dots vs commas) is based on the selected language.
 */
export function formatCurrency(
  value: number,
  currency: 'EUR' | 'USD',
  lang: string = 'es'
): string {
  const formattedNumber = new Intl.NumberFormat(lang === 'es' ? 'es-ES' : 'en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

  if (currency === 'USD') {
    return `$${formattedNumber}`;
  } else {
    return `${formattedNumber}\u00A0€`;
  }
}
