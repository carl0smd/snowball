import { Component, input, output, ElementRef, ViewChild, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { Chart, registerables } from 'chart.js';
import { YearlySimulationResult } from '../../core/services/finance.service';
import { AssetAllocation, ScenarioYearlyResult } from '../../app';

Chart.register(...registerables);

@Component({
  selector: 'app-growth-tab',
  standalone: true,
  imports: [CommonModule, TranslocoDirective],
  templateUrl: './growth-tab.component.html',
})
export class GrowthTabComponent {
  private translocoService = inject(TranslocoService);

  results = input.required<YearlySimulationResult[]>();
  scenarios = input.required<ScenarioYearlyResult[]>();
  allocation = input<AssetAllocation | null>(null);
  annualReturn = input.required<number>();
  riskProfile = input<string | null>(null);
  chartMode = input.required<'nominal-real' | 'scenarios'>();
  darkMode = input.required<boolean>();
  currentLang = input.required<string>();

  chartModeChange = output<'nominal-real' | 'scenarios'>();

  private _growthChartCanvas?: ElementRef<HTMLCanvasElement>;
  private _allocationChartCanvas?: ElementRef<HTMLCanvasElement>;

  private growthChartInstance?: Chart;
  private allocationChartInstance?: Chart;

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
      if (!this.allocationChartInstance && this.allocation()) {
        this.initAllocationChart();
      }
    }
  }

  constructor() {
    effect(() => {
      const results = this.results();
      const scenarios = this.scenarios();
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
      const allocation = this.allocation();
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
  }

  private initGrowthChart() {
    if (!this._growthChartCanvas) return;
    const isDark = this.darkMode();
    
    setTimeout(() => {
      if (!this._growthChartCanvas) return;
      const ctx = this._growthChartCanvas.nativeElement.getContext('2d');
      if (ctx) {
        if (this.growthChartInstance) {
          this.growthChartInstance.destroy();
        }
        this.growthChartInstance = new Chart(ctx, {
          type: 'line',
          data: {
            labels: [],
            datasets: [],
          },
          options: this.getGrowthChartOptions(isDark),
        });
        if (this.chartMode() === 'nominal-real') {
          this.updateGrowthChartData(this.results(), isDark);
        } else {
          this.updateScenariosChartData(this.scenarios(), isDark);
        }
      }
    }, 0);
  }

  private initAllocationChart() {
    if (!this._allocationChartCanvas) return;
    const allocation = this.allocation();
    if (!allocation) return;
    const isDark = this.darkMode();
    
    // Defer initialization to ensure the browser has completed layout and the canvas has physical dimensions
    setTimeout(() => {
      if (!this._allocationChartCanvas) return;
      const ctx = this._allocationChartCanvas.nativeElement.getContext('2d');
      if (ctx) {
        if (this.allocationChartInstance) {
          this.allocationChartInstance.destroy();
        }
        this.allocationChartInstance = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: [],
            datasets: [],
          },
          options: this.getAllocationChartOptions(isDark),
        });
        this.updateAllocationChartData(this.allocation(), isDark);
      }
    }, 0);
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

    this.growthChartInstance.options = this.getGrowthChartOptions(isDark);
    this.growthChartInstance.update();
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
          'rgb(167, 139, 250)', // Purple 400
          'rgb(96, 165, 250)',  // Blue 400
        ],
        borderWidth: isDark ? 2 : 1,
        borderColor: isDark ? 'rgb(24, 24, 27)' : 'rgb(255, 255, 255)',
        hoverOffset: 4,
      },
    ];

    this.allocationChartInstance.options = this.getAllocationChartOptions(isDark);
    this.allocationChartInstance.update();
  }

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
}
