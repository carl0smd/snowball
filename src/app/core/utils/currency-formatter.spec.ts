import { describe, it, expect } from 'vitest';
import { formatCurrency } from './currency-formatter';

describe('currency-formatter utility', () => {
  it('should format EUR with the € symbol at the end', () => {
    const formatted = formatCurrency(1250500, 'EUR', 'es');
    expect(formatted.endsWith('€')).toBe(true);
    expect(formatted.trim().endsWith('€')).toBe(true);
    expect(formatted.startsWith('€')).toBe(false);
  });

  it('should format USD with the $ symbol at the front', () => {
    const formatted = formatCurrency(1250500, 'USD', 'es');
    expect(formatted.startsWith('$')).toBe(true);
    expect(formatted.endsWith('$')).toBe(false);
  });

  it('should format using grouping rules and proper positioning', () => {
    const formattedEnUsd = formatCurrency(1250500, 'USD', 'en');
    expect(formattedEnUsd).toContain('1,250,500');
    expect(formattedEnUsd.startsWith('$')).toBe(true);

    const formattedEnEur = formatCurrency(1250500, 'EUR', 'en');
    expect(formattedEnEur).toContain('1,250,500');
    expect(formattedEnEur.endsWith('€')).toBe(true);
  });
});
