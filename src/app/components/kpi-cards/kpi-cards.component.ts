import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoDirective } from '@jsverse/transloco';
import { formatCurrency } from '../../core/utils/currency-formatter';

@Component({
  selector: 'app-kpi-cards',
  standalone: true,
  imports: [CommonModule, TranslocoDirective],
  templateUrl: './kpi-cards.component.html',
})
export class KpiCardsComponent {
  nominalBalance = input.required<number>();
  realBalance = input.required<number>();
  totalContributed = input.required<number>();
  nominalInterests = input.required<number>();
  currency = input<'EUR' | 'USD'>('EUR');
  currentLang = input<string>('es');

  formatCurrency = formatCurrency;
}
