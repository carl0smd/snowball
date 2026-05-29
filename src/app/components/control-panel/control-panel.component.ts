import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'app-control-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslocoDirective],
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
}
