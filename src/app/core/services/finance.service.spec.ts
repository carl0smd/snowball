import { describe, it, expect } from 'vitest';
import { FinanceService } from './finance.service';

describe('FinanceService', () => {
  const service = new FinanceService();

  describe('calculateCompoundInterest', () => {
    it('should initialize year 0 with initial capital and zero interest', () => {
      const initialCapital = 10000;
      const results = service.calculateCompoundInterest(initialCapital, 100, 0.05, 5, 0.02);

      expect(results[0]).toEqual({
        year: 0,
        totalContributed: initialCapital,
        nominalBalance: initialCapital,
        realBalance: initialCapital,
        nominalInterests: 0,
        realInterests: 0,
      });
    });

    it('should compute compound interest correctly over years', () => {
      // Setup simple calculation: 1000 initial, 100/month, 10% returns, 2 years, 0% inflation
      const results = service.calculateCompoundInterest(1000, 100, 0.10, 2, 0.0);
      
      expect(results.length).toBe(3); // Years 0, 1, 2
      
      const year2 = results[2];
      expect(year2.year).toBe(2);
      expect(year2.totalContributed).toBe(1000 + 100 * 24); // 3400
      expect(year2.nominalBalance).toBeGreaterThan(year2.totalContributed);
      expect(year2.nominalInterests).toBe(Math.round((year2.nominalBalance - year2.totalContributed) * 100) / 100);
      expect(year2.realBalance).toBe(year2.nominalBalance); // 0% inflation
    });

    it('should adjust for inflation correctly', () => {
      const initialCapital = 10000;
      const monthlyContribution = 0;
      const annualReturn = 0.08;
      const inflation = 0.03;
      const years = 10;

      const results = service.calculateCompoundInterest(
        initialCapital,
        monthlyContribution,
        annualReturn,
        years,
        inflation
      );

      const year10 = results[10];
      // Real balance should be significantly less than nominal balance due to 3% inflation compounded for 10 years
      expect(year10.realBalance).toBeLessThan(year10.nominalBalance);
      
      // Real balance formula: Nominal / (1 + inflation)^years
      const expectedRealBalance = year10.nominalBalance / Math.pow(1 + inflation, years);
      expect(Math.abs(year10.realBalance - expectedRealBalance)).toBeLessThan(1); // Within rounding errors
    });
  });

  describe('calculateFireStatus', () => {
    it('should return 0 years to FIRE if initial capital already exceeds FIRE number', () => {
      const initialCapital = 500000;
      const monthlyContribution = 1000;
      const annualReturn = 0.06;
      const monthlyExpenses = 1500; // FIRE Number = 1500 * 12 * 25 = 450,000
      const inflation = 0.02;

      const result = service.calculateFireStatus(
        initialCapital,
        monthlyContribution,
        annualReturn,
        monthlyExpenses,
        inflation
      );

      expect(result.fireNumber).toBe(450000);
      expect(result.yearsToFire).toBe(0);
      expect(result.monthsToFire).toBe(0);
      expect(result.isAchievable).toBe(true);
    });

    it('should calculate time to FIRE correctly for active savers', () => {
      const initialCapital = 50000;
      const monthlyContribution = 2000;
      const annualReturn = 0.08;
      const monthlyExpenses = 2000; // FIRE Number = 600,000
      const inflation = 0.02;

      const result = service.calculateFireStatus(
        initialCapital,
        monthlyContribution,
        annualReturn,
        monthlyExpenses,
        inflation,
        0.04,
        40
      );

      expect(result.fireNumber).toBe(600000);
      expect(result.isAchievable).toBe(true);
      expect(result.yearsToFire).toBeGreaterThan(0);
      expect(result.monthsToFire).toBeGreaterThan(0);
    });

    it('should return unachievable if target is too high for maximum years limit', () => {
      const initialCapital = 1000;
      const monthlyContribution = 10;
      const annualReturn = 0.02;
      const monthlyExpenses = 10000; // FIRE Number = 3,000,000
      const inflation = 0.03; // inflation > return, practically impossible to hit

      const result = service.calculateFireStatus(
        initialCapital,
        monthlyContribution,
        annualReturn,
        monthlyExpenses,
        inflation,
        0.04,
        15 // limit to 15 years
      );

      expect(result.isAchievable).toBe(false);
      expect(result.yearsToFire).toBeNull();
      expect(result.monthsToFire).toBeNull();
    });
  });
});
