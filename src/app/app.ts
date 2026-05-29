import { Component, signal, computed, inject, effect, ElementRef, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FinanceService, YearlySimulationResult, FireResult } from './core/services/finance.service';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

export interface AssetAllocation {
  fixedIncome: number;
  variableIncome: number;
}

export interface ScenarioYearlyResult {
  year: number;
  expected: number;
  optimistic: number;
  pessimistic: number;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslocoDirective],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  private financeService = inject(FinanceService);
  private translocoService = inject(TranslocoService);

  // --- View Children for Canvas via Setters ---
  private _growthChartCanvas?: ElementRef<HTMLCanvasElement>;
  private _allocationChartCanvas?: ElementRef<HTMLCanvasElement>;

  @ViewChild('growthChart') set growthChart(content: ElementRef<HTMLCanvasElement>) {
    if (content) {
      this._growthChartCanvas = content;
      if (!this.growthChartInstance) {
        this.initGrowthChart();
      }
    }
  }

  @ViewChild('allocationChart') set allocationChart(content: ElementRef<HTMLCanvasElement>) {
    if (content) {
      this._allocationChartCanvas = content;
      if (!this.allocationChartInstance && this.riskAllocation()) {
        this.initAllocationChart();
      }
    }
  }

  private growthChartInstance?: Chart;
  private allocationChartInstance?: Chart;

  // --- Input Signals ---
  initialCapital = signal<number>(10000);
  monthlyContribution = signal<number>(200);
  annualReturn = signal<number>(7); // in % (e.g. 7 means 7%)
  years = signal<number>(30);
  inflation = signal<number>(2); // in % (e.g. 2 means 2%)
  monthlyExpenses = signal<number>(1500);
  riskProfile = signal<'conservative' | 'moderate' | 'aggressive' | 'extreme' | null>(null);
  
  // --- UI State Signals ---
  darkMode = signal<boolean>(true);
  currentLang = signal<string>('es');
  activeTab = signal<'compound' | 'fire'>('compound');
  chartMode = signal<'nominal-real' | 'scenarios'>('nominal-real');

  // --- Computed Outputs ---
  simulationResults = computed<YearlySimulationResult[]>(() => {
    return this.financeService.calculateCompoundInterest(
      this.initialCapital(),
      this.monthlyContribution(),
      this.annualReturn() / 100,
      this.years(),
      this.inflation() / 100
    );
  });

  scenariosResults = computed<ScenarioYearlyResult[]>(() => {
    const results = this.simulationResults();
    const profile = this.riskProfile();
    const rate = this.annualReturn() / 100;
    
    // Determine annual volatility (standard deviation)
    let volatility = 0.12; // default
    if (profile === 'conservative') {
      volatility = 0.05;
    } else if (profile === 'moderate') {
      volatility = 0.08;
    } else if (profile === 'aggressive') {
      volatility = 0.12;
    } else if (profile === 'extreme') {
      volatility = 0.15;
    } else {
      // Interpolate volatility based on expected return (from 4% to 18%)
      volatility = Math.min(0.18, Math.max(0.04, 0.04 + (rate - 0.01) * 0.95));
    }
    
    return results.map(r => {
      const t = r.year;
      if (t === 0) {
        return {
          year: 0,
          expected: r.nominalBalance,
          optimistic: r.nominalBalance,
          pessimistic: r.nominalBalance
        };
      }
      
      const expectedBalance = r.nominalBalance;
      const term1 = 1.282 * volatility * Math.sqrt(t);
      const term2 = 0.5 * volatility * volatility * t;
      
      const optimistic = expectedBalance * Math.exp(term1 - term2);
      const pessimistic = expectedBalance * Math.exp(-term1 - term2);
      
      return {
        year: t,
        expected: Math.round(expectedBalance * 100) / 100,
        optimistic: Math.round(optimistic * 100) / 100,
        pessimistic: Math.round(pessimistic * 100) / 100
      };
    });
  });

  fireStatus = computed<FireResult>(() => {
    return this.financeService.calculateFireStatus(
      this.initialCapital(),
      this.monthlyContribution(),
      this.annualReturn() / 100,
      this.monthlyExpenses(),
      this.inflation() / 100
    );
  });

  riskAllocation = computed<AssetAllocation | null>(() => {
    const profile = this.riskProfile();
    if (profile === 'conservative') {
      return { fixedIncome: 80, variableIncome: 20 }; // Classic 20/80 Portfolio
    } else if (profile === 'moderate') {
      return { fixedIncome: 40, variableIncome: 60 }; // Classic 60/40 Portfolio
    } else if (profile === 'aggressive') {
      return { fixedIncome: 20, variableIncome: 80 }; // Classic 80/20 Portfolio
    } else if (profile === 'extreme') {
      return { fixedIncome: 0, variableIncome: 100 }; // 100% Equities Portfolio
    } else {
      return null;
    }
  });

  finalYearResult = computed<YearlySimulationResult>(() => {
    const results = this.simulationResults();
    return results[results.length - 1] || {
      year: 0,
      totalContributed: 0,
      nominalBalance: 0,
      realBalance: 0,
      nominalInterests: 0,
      realInterests: 0,
    };
  });

  totalContributed = computed(() => this.finalYearResult().totalContributed);
  nominalBalance = computed(() => this.finalYearResult().nominalBalance);
  realBalance = computed(() => this.finalYearResult().realBalance);
  nominalInterests = computed(() => this.finalYearResult().nominalInterests);
  realInterests = computed(() => this.finalYearResult().realInterests);

  constructor() {
    // --- Effects for Reactive updates ---
    
    // Auto-update charts when simulation data, mode or theme changes
    effect(() => {
      const results = this.simulationResults();
      const scenarios = this.scenariosResults();
      const mode = this.chartMode();
      const isDark = this.darkMode();
      
      if (this.growthChartInstance) {
        if (mode === 'nominal-real') {
          this.updateGrowthChartData(results, isDark);
        } else {
          this.updateScenariosChartData(scenarios, isDark);
        }
      }
    });

    effect(() => {
      const allocation = this.riskAllocation();
      const isDark = this.darkMode();
      if (allocation && this._allocationChartCanvas) {
        if (!this.allocationChartInstance) {
          this.initAllocationChart();
        } else {
          this.updateAllocationChartData(allocation, isDark);
        }
      } else if (!allocation && this.allocationChartInstance) {
        this.allocationChartInstance.destroy();
        this.allocationChartInstance = undefined;
      }
    });

    // Dark mode class toggler on HTML element
    effect(() => {
      if (this.darkMode()) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    });

    // Auto-save settings in LocalStorage on any input change
    effect(() => {
      const settings = {
        initialCapital: this.initialCapital(),
        monthlyContribution: this.monthlyContribution(),
        annualReturn: this.annualReturn(),
        years: this.years(),
        inflation: this.inflation(),
        monthlyExpenses: this.monthlyExpenses(),
        riskProfile: this.riskProfile(),
        darkMode: this.darkMode(),
        currentLang: this.currentLang(),
        chartMode: this.chartMode(),
      };
      localStorage.setItem('snowball_settings', JSON.stringify(settings));
    });
  }

  ngOnInit() {
    this.loadSettings();
  }


  // --- Settings Persistence ---
  loadSettings() {
    const saved = localStorage.getItem('snowball_settings');
    if (saved) {
      try {
        const settings = JSON.parse(saved);
        if (settings.initialCapital !== undefined) this.initialCapital.set(settings.initialCapital);
        if (settings.monthlyContribution !== undefined) this.monthlyContribution.set(settings.monthlyContribution);
        if (settings.annualReturn !== undefined) this.annualReturn.set(settings.annualReturn);
        if (settings.years !== undefined) this.years.set(settings.years);
        if (settings.inflation !== undefined) this.inflation.set(settings.inflation);
        if (settings.monthlyExpenses !== undefined) this.monthlyExpenses.set(settings.monthlyExpenses);
        if (settings.riskProfile !== undefined) this.riskProfile.set(settings.riskProfile);
        if (settings.darkMode !== undefined) this.darkMode.set(settings.darkMode);
        if (settings.chartMode !== undefined) this.chartMode.set(settings.chartMode);
        if (settings.currentLang !== undefined) {
          this.currentLang.set(settings.currentLang);
          this.translocoService.setActiveLang(settings.currentLang);
        }
      } catch (e) {
        console.error('Failed to parse saved settings', e);
      }
    }
  }

  resetSettings() {
    this.initialCapital.set(10000);
    this.monthlyContribution.set(200);
    this.annualReturn.set(7);
    this.years.set(30);
    this.inflation.set(2);
    this.monthlyExpenses.set(1500);
    this.riskProfile.set(null);
    this.chartMode.set('nominal-real');
  }

  selectRiskProfile(profile: 'conservative' | 'moderate' | 'aggressive' | 'extreme') {
    this.riskProfile.set(profile);
    if (profile === 'conservative') {
      this.annualReturn.set(4.0); // 4% return (midpoint of conservative 3% - 5%)
    } else if (profile === 'moderate') {
      this.annualReturn.set(6.0); // 6% return (midpoint of moderate 5% - 7%)
    } else if (profile === 'aggressive') {
      this.annualReturn.set(8.0); // 8% return (midpoint of aggressive 7% - 9%)
    } else if (profile === 'extreme') {
      this.annualReturn.set(9.0); // 9% return (midpoint of extreme 8% - 10%)
    }
  }

  onReturnChange(val: number) {
    this.annualReturn.set(val);
    this.riskProfile.set(null); // Deselect preset profile on manual slider drag
  }

  // --- UI Interaction handlers ---
  toggleLanguage() {
    const nextLang = this.currentLang() === 'es' ? 'en' : 'es';
    this.translocoService.setActiveLang(nextLang);
    this.currentLang.set(nextLang);
  }

  toggleTheme() {
    this.darkMode.update(val => !val);
  }

  // --- Chart.js Initializations ---
  private initGrowthChart() {
    if (!this._growthChartCanvas) return;
    const isDark = this.darkMode();
    const ctx = this._growthChartCanvas.nativeElement.getContext('2d');
    if (ctx) {
      this.growthChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: [],
          datasets: [],
        },
        options: this.getGrowthChartOptions(isDark),
      });
      if (this.chartMode() === 'nominal-real') {
        this.updateGrowthChartData(this.simulationResults(), isDark);
      } else {
        this.updateScenariosChartData(this.scenariosResults(), isDark);
      }
    }
  }

  private updateScenariosChartData(scenarios: ScenarioYearlyResult[], isDark: boolean) {
    if (!this.growthChartInstance) return;

    const yearsLabels = scenarios.map(r => `${this.translocoService.translate('dashboard.year')} ${r.year}`);
    const expected = scenarios.map(r => r.expected);
    const optimistic = scenarios.map(r => r.optimistic);
    const pessimistic = scenarios.map(r => r.pessimistic);

    this.growthChartInstance.data.labels = yearsLabels;
    this.growthChartInstance.data.datasets = [
      {
        label: this.translocoService.translate('dashboard.chart.optimistic'),
        data: optimistic,
        borderColor: 'rgb(56, 189, 248)', // Sky 400
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        tension: 0.3,
        borderWidth: 2,
        pointBackgroundColor: 'rgb(56, 189, 248)',
      },
      {
        label: this.translocoService.translate('dashboard.chart.expected'),
        data: expected,
        borderColor: 'rgb(139, 92, 246)', // Violet 500
        backgroundColor: 'rgba(139, 92, 246, 0.05)',
        fill: true,
        tension: 0.3,
        borderWidth: 3,
        pointBackgroundColor: 'rgb(139, 92, 246)',
      },
      {
        label: this.translocoService.translate('dashboard.chart.pessimistic'),
        data: pessimistic,
        borderColor: 'rgb(248, 113, 113)', // Red 400
        backgroundColor: 'transparent',
        tension: 0.3,
        borderWidth: 2,
        pointBackgroundColor: 'rgb(248, 113, 113)',
      },
    ];

    this.growthChartInstance.options = this.getGrowthChartOptions(isDark);
    this.growthChartInstance.update();
  }

  private initAllocationChart() {
    if (!this._allocationChartCanvas) return;
    const allocation = this.riskAllocation();
    if (!allocation) return;
    const isDark = this.darkMode();
    const ctx = this._allocationChartCanvas.nativeElement.getContext('2d');
    if (ctx) {
      this.allocationChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: [],
          datasets: [],
        },
        options: this.getAllocationChartOptions(isDark),
      });
      this.updateAllocationChartData(this.riskAllocation(), isDark);
    }
  }

  private updateGrowthChartData(results: YearlySimulationResult[], isDark: boolean) {
    if (!this.growthChartInstance) return;

    const yearsLabels = results.map(r => `${this.translocoService.translate('dashboard.year')} ${r.year}`);
    const nominalBalances = results.map(r => r.nominalBalance);
    const realBalances = results.map(r => r.realBalance);
    const contributions = results.map(r => r.totalContributed);

    this.growthChartInstance.data.labels = yearsLabels;
    this.growthChartInstance.data.datasets = [
      {
        label: this.translocoService.translate('dashboard.chart.nominalBalance'),
        data: nominalBalances,
        borderColor: 'rgb(139, 92, 246)', // Violet 500
        backgroundColor: 'rgba(139, 92, 246, 0.05)',
        fill: true,
        tension: 0.3,
        borderWidth: 3,
        pointBackgroundColor: 'rgb(139, 92, 246)',
      },
      {
        label: this.translocoService.translate('dashboard.chart.realBalance'),
        data: realBalances,
        borderColor: 'rgb(16, 185, 129)', // Emerald 500
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        tension: 0.3,
        borderWidth: 2,
        pointBackgroundColor: 'rgb(16, 185, 129)',
      },
      {
        label: this.translocoService.translate('dashboard.chart.contributions'),
        data: contributions,
        borderColor: 'rgb(107, 114, 128)', // Gray 500
        backgroundColor: 'transparent',
        tension: 0.1,
        borderWidth: 2,
        pointBackgroundColor: 'rgb(107, 114, 128)',
      },
    ];

    // Dynamic Options updates for Dark/Light mode theme syncing
    this.growthChartInstance.options = this.getGrowthChartOptions(isDark);
    this.growthChartInstance.update();
  }

  private updateAllocationChartData(allocation: AssetAllocation | null, isDark: boolean) {
    if (!this.allocationChartInstance || !allocation) return;

    const labels = [
      this.translocoService.translate('dashboard.chart.variableIncome'),
      this.translocoService.translate('dashboard.chart.fixedIncome'),
    ];

    this.allocationChartInstance.data.labels = labels;
    this.allocationChartInstance.data.datasets = [
      {
        data: [allocation.variableIncome, allocation.fixedIncome],
        backgroundColor: [
          'rgb(167, 139, 250)', // Purple 400 (Variable)
          'rgb(96, 165, 250)',  // Blue 400 (Fixed)
        ],
        borderWidth: isDark ? 2 : 1,
        borderColor: isDark ? 'rgb(24, 24, 27)' : 'rgb(255, 255, 255)',
        hoverOffset: 4,
      },
    ];

    this.allocationChartInstance.options = this.getAllocationChartOptions(isDark);
    this.allocationChartInstance.update();
  }

  // --- Options Generators for Styling Charts ---
  private getGrowthChartOptions(isDark: boolean): any {
    const textColor = isDark ? '#a1a1aa' : '#4b5563';
    const gridColor = isDark ? 'rgba(63, 63, 70, 0.3)' : 'rgba(228, 228, 231, 0.6)';

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: textColor,
            font: { family: 'Inter', size: 12, weight: '500' },
          },
        },
        tooltip: {
          padding: 12,
          bodyFont: { family: 'Inter' },
          titleFont: { family: 'Outfit', size: 14 },
          callbacks: {
            label: (context: any) => {
              let label = context.dataset.label || '';
              if (label) label += ': ';
              if (context.parsed.y !== null) {
                label += new Intl.NumberFormat(this.currentLang() === 'es' ? 'es-ES' : 'en-US', {
                  style: 'currency',
                  currency: 'EUR',
                  maximumFractionDigits: 0,
                }).format(context.parsed.y);
              }
              return label;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { color: 'transparent' },
          ticks: { color: textColor, font: { family: 'Inter', size: 11 } },
        },
        y: {
          grid: { color: gridColor },
          ticks: {
            color: textColor,
            font: { family: 'Inter', size: 11 },
            callback: (value: number) => {
              if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M €`;
              if (value >= 1e3) return `${(value / 1e3).toFixed(0)}k €`;
              return `${value} €`;
            },
          },
        },
      },
    };
  }

  private getAllocationChartOptions(isDark: boolean): any {
    const textColor = isDark ? '#a1a1aa' : '#4b5563';

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: textColor,
            font: { family: 'Inter', size: 12, weight: '500' },
            padding: 15,
          },
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              return ` ${context.label}: ${context.raw}%`;
            },
          },
        },
      },
      cutout: '70%',
    };
  }

  // --- Export Functionalities ---
  exportToJson() {
    const data = {
      simulationInputs: {
        initialCapital: this.initialCapital(),
        monthlyContribution: this.monthlyContribution(),
        annualReturn: this.annualReturn(),
        years: this.years(),
        inflation: this.inflation(),
        monthlyExpenses: this.monthlyExpenses(),
        riskProfile: this.riskProfile(),
      },
      summary: {
        nominalBalance: this.nominalBalance(),
        realBalance: this.realBalance(),
        totalContributed: this.totalContributed(),
        nominalInterests: this.nominalInterests(),
        realInterests: this.realInterests(),
        yearsToFire: this.fireStatus().yearsToFire,
      },
      exportedAt: new Date().toISOString(),
    };

    const sJson = JSON.stringify(data, null, 2);
    const element = document.createElement('a');
    const file = new Blob([sJson], { type: 'application/json' });
    element.href = URL.createObjectURL(file);
    element.download = `snowball_simulation_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  importFromJson(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        const inputs = data.simulationInputs;
        if (inputs) {
          if (inputs.initialCapital !== undefined) this.initialCapital.set(inputs.initialCapital);
          if (inputs.monthlyContribution !== undefined) this.monthlyContribution.set(inputs.monthlyContribution);
          if (inputs.annualReturn !== undefined) this.annualReturn.set(inputs.annualReturn);
          if (inputs.years !== undefined) this.years.set(inputs.years);
          if (inputs.inflation !== undefined) this.inflation.set(inputs.inflation);
          if (inputs.monthlyExpenses !== undefined) this.monthlyExpenses.set(inputs.monthlyExpenses);
          if (inputs.riskProfile !== undefined) this.riskProfile.set(inputs.riskProfile);
        }
      } catch (err) {
        alert(this.translocoService.translate('dashboard.importError'));
      }
    };
    reader.readAsText(file);
  }
}
