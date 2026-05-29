import { Component, signal, computed, inject, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FinanceService, YearlySimulationResult, FireResult } from './core/services/finance.service';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';

import { HeaderComponent } from './components/header/header.component';
import { ControlPanelComponent } from './components/control-panel/control-panel.component';
import { KpiCardsComponent } from './components/kpi-cards/kpi-cards.component';
import { GrowthTabComponent } from './components/growth-tab/growth-tab.component';
import { FireTabComponent } from './components/fire-tab/fire-tab.component';

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
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslocoDirective,
    HeaderComponent,
    ControlPanelComponent,
    KpiCardsComponent,
    GrowthTabComponent,
    FireTabComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
  host: {
    '(window:scroll)': 'onWindowScroll()'
  }
})
export class App implements OnInit {
  private financeService = inject(FinanceService);
  private translocoService = inject(TranslocoService);

  // --- Input Signals ---
  initialCapital = signal<number>(10000);
  monthlyContribution = signal<number>(200);
  annualReturn = signal<number>(7); // in % (e.g. 7 means 7%)
  years = signal<number>(30);
  inflation = signal<number>(3); // in % (e.g. 3 means 3%)
  monthlyExpenses = signal<number>(1500);
  riskProfile = signal<'conservative' | 'moderate' | 'aggressive' | 'extreme' | null>(null);
  
  // --- UI State Signals ---
  darkMode = signal<boolean>(true);
  currentLang = signal<string>('es');
  currency = signal<'EUR' | 'USD'>('EUR');
  activeTab = signal<'compound' | 'fire'>('compound');
  chartMode = signal<'nominal-real' | 'scenarios'>('nominal-real');
  isScrolledDown = signal<boolean>(false);

  onWindowScroll() {
    this.isScrolledDown.set(window.scrollY > 250);
  }

  toggleScroll() {
    if (this.isScrolledDown()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const element = document.getElementById('results-section');
      if (element) {
        const yOffset = -80; // height of sticky header (64px) + breathing padding (16px)
        const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }
  }

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
      return { fixedIncome: 80, variableIncome: 20 };
    } else if (profile === 'moderate') {
      return { fixedIncome: 40, variableIncome: 60 };
    } else if (profile === 'aggressive') {
      return { fixedIncome: 20, variableIncome: 80 };
    } else if (profile === 'extreme') {
      return { fixedIncome: 0, variableIncome: 100 };
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
        currency: this.currency(),
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
        if (settings.currency !== undefined) this.currency.set(settings.currency);
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
    this.inflation.set(3);
    this.monthlyExpenses.set(1500);
    this.riskProfile.set(null);
    this.chartMode.set('nominal-real');
    this.currency.set('EUR');
  }

  selectRiskProfile(profile: 'conservative' | 'moderate' | 'aggressive' | 'extreme') {
    this.riskProfile.set(profile);
    if (profile === 'conservative') {
      this.annualReturn.set(4.0);
    } else if (profile === 'moderate') {
      this.annualReturn.set(6.0);
    } else if (profile === 'aggressive') {
      this.annualReturn.set(8.0);
    } else if (profile === 'extreme') {
      this.annualReturn.set(9.0);
    }
  }

  deselectRiskProfile() {
    this.riskProfile.set(null);
    this.annualReturn.set(7);
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

  toggleCurrency() {
    this.currency.update(curr => curr === 'EUR' ? 'USD' : 'EUR');
  }

  toggleTheme() {
    this.darkMode.update(val => !val);
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
    input.value = '';
  }
}
