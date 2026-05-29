import { Injectable } from '@angular/core';

export interface YearlySimulationResult {
  year: number;
  totalContributed: number;
  nominalBalance: number;
  realBalance: number;
  nominalInterests: number;
  realInterests: number;
}

export interface FireResult {
  fireNumber: number;
  yearsToFire: number | null;
  monthsToFire: number | null;
  isAchievable: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class FinanceService {
  /**
   * Performs a month-by-month simulation and aggregates it into yearly data points.
   *
   * @param initialCapital Starting balance
   * @param monthlyContribution Amount added at the start of each month
   * @param annualReturnNominal Expected annualized interest rate (e.g. 0.07 for 7%)
   * @param years Duration of the simulation
   * @param annualInflation Expected annualized inflation rate (e.g. 0.025 for 2.5%)
   */
  calculateCompoundInterest(
    initialCapital: number,
    monthlyContribution: number,
    annualReturnNominal: number,
    years: number,
    annualInflation: number
  ): YearlySimulationResult[] {
    const results: YearlySimulationResult[] = [];
    
    // Yearly compounding equivalents or simple nominal rate compounded monthly
    const monthlyRate = annualReturnNominal / 12;
    const totalMonths = years * 12;
    
    let currentNominalBalance = initialCapital;
    let totalContributed = initialCapital;

    // Year 0 starting point
    results.push({
      year: 0,
      totalContributed: initialCapital,
      nominalBalance: initialCapital,
      realBalance: initialCapital,
      nominalInterests: 0,
      realInterests: 0,
    });

    for (let month = 1; month <= totalMonths; month++) {
      // Saver contribution at the beginning of the month
      currentNominalBalance += monthlyContribution;
      totalContributed += monthlyContribution;
      
      // Compound monthly interest at the end of the month
      currentNominalBalance = currentNominalBalance * (1 + monthlyRate);

      // End of a year, capture status
      if (month % 12 === 0) {
        const year = month / 12;
        
        // Adjust for cumulative inflation: Real Value = Nominal Value / (1 + inflation)^year
        const inflationFactor = Math.pow(1 + annualInflation, year);
        const realBalance = currentNominalBalance / inflationFactor;
        const nominalInterests = currentNominalBalance - totalContributed;
        
        // Real interests: Real accumulated balance minus real value of contributions
        // For simplicity and accuracy of purchasing power, we adjust nominal interests by inflation
        const realInterests = nominalInterests / inflationFactor;

        results.push({
          year,
          totalContributed,
          nominalBalance: Math.round(currentNominalBalance * 100) / 100,
          realBalance: Math.round(realBalance * 100) / 100,
          nominalInterests: Math.round(nominalInterests * 100) / 100,
          realInterests: Math.round(realInterests * 100) / 100,
        });
      }
    }

    return results;
  }

  /**
   * Calculates the F.I.R.E. target number and estimates time to reach it using real (inflation-adjusted) values.
   *
   * @param initialCapital Starting balance
   * @param monthlyContribution Amount added at the start of each month
   * @param annualReturnNominal Expected annualized interest rate (e.g. 0.07 for 7%)
   * @param monthlyExpenses Current estimated monthly expenses in today's money
   * @param annualInflation Expected annualized inflation rate (e.g. 0.025 for 2.5%)
   * @param safeWithdrawalRate Safe withdrawal rate (default is 4% or 0.04)
   * @param maxYears limit of simulation length to check (default 50 years)
   */
  calculateFireStatus(
    initialCapital: number,
    monthlyContribution: number,
    annualReturnNominal: number,
    monthlyExpenses: number,
    annualInflation: number,
    safeWithdrawalRate: number = 0.04,
    maxYears: number = 50
  ): FireResult {
    // FIRE Number = Annual Expenses / Safe Withdrawal Rate
    // Using expenses in today's money means this FIRE number is in real terms!
    const annualExpenses = monthlyExpenses * 12;
    const fireNumber = annualExpenses / safeWithdrawalRate;

    // If starting capital already exceeds FIRE number, you are already FIRE!
    if (initialCapital >= fireNumber) {
      return {
        fireNumber: Math.round(fireNumber),
        yearsToFire: 0,
        monthsToFire: 0,
        isAchievable: true,
      };
    }

    const monthlyRate = annualReturnNominal / 12;
    const maxMonths = maxYears * 12;
    
    let currentNominalBalance = initialCapital;
    
    for (let month = 1; month <= maxMonths; month++) {
      currentNominalBalance += monthlyContribution;
      currentNominalBalance = currentNominalBalance * (1 + monthlyRate);
      
      // Calculate current real balance adjusted for inflation
      const currentYear = month / 12;
      const inflationFactor = Math.pow(1 + annualInflation, currentYear);
      const currentRealBalance = currentNominalBalance / inflationFactor;

      if (currentRealBalance >= fireNumber) {
        return {
          fireNumber: Math.round(fireNumber),
          yearsToFire: Math.round((month / 12) * 10) / 10,
          monthsToFire: month,
          isAchievable: true,
        };
      }
    }

    return {
      fireNumber: Math.round(fireNumber),
      yearsToFire: null,
      monthsToFire: null,
      isAchievable: false,
    };
  }
}
