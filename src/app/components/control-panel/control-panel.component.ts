import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoDirective } from '@jsverse/transloco';
import { SliderInputComponent } from '../slider-input/slider-input.component';
import { formatCurrency } from '../../core/utils/currency-formatter';

@Component({
  selector: 'app-control-panel',
  standalone: true,
  imports: [CommonModule, TranslocoDirective, SliderInputComponent],
  templateUrl: './control-panel.component.html',
})
export class ControlPanelComponent {
  initialCapital = input.required<number>();
  monthlyContribution = input.required<number>();
  annualReturn = input.required<number>();
  years = input.required<number>();
  inflation = input.required<number>();
  monthlyExpenses = input.required<number>();
  riskProfile = input<string | null>(null);
  activeTab = input.required<string>();
  currency = input<'EUR' | 'USD'>('EUR');
  currentLang = input<string>('es');

  formatCurrency = formatCurrency;

  initialCapitalChange = output<number>();
  monthlyContributionChange = output<number>();
  annualReturnChange = output<number>();
  yearsChange = output<number>();
  inflationChange = output<number>();
  monthlyExpensesChange = output<number>();
  riskProfileSelect = output<'conservative' | 'moderate' | 'aggressive' | 'extreme'>();
  riskProfileDeselect = output<void>();
  resetSettings = output<void>();
  exportSettings = output<void>();
  importSettings = output<Event>();

  readonly riskProfiles = [
    { id: 'conservative', labelKey: 'inputs.riskConservative' },
    { id: 'moderate', labelKey: 'inputs.riskModerate' },
    { id: 'aggressive', labelKey: 'inputs.riskAggressive' },
    { id: 'extreme', labelKey: 'inputs.riskExtreme' },
  ] as const;

  formatCurrencyLabel(value: number): string {
    const symbol = this.currency() === 'EUR' ? '€' : '$';
    if (value === 0) return `${value} ${symbol}`;
    if (value >= 1000000) return `${value / 1000000}M ${symbol}`;
    if (value >= 1000) {
      // Use standard prefix or suffix based on symbol
      return this.currency() === 'EUR' ? `${value / 1000}k €` : `$${value / 1000}k`;
    }
    return this.currency() === 'EUR' ? `${value} €` : `$${value}`;
  }
}
