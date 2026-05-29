import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoDirective } from '@jsverse/transloco';
import { FireResult } from '../../core/services/finance.service';
import { formatCurrency } from '../../core/utils/currency-formatter';

@Component({
  selector: 'app-fire-tab',
  standalone: true,
  imports: [CommonModule, TranslocoDirective],
  templateUrl: './fire-tab.component.html',
})
export class FireTabComponent {
  fireStatus = input.required<FireResult>();
  monthlyExpenses = input.required<number>();
  currency = input<'EUR' | 'USD'>('EUR');
  currentLang = input<string>('es');

  formatCurrency = formatCurrency;
}
