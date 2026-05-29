import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoDirective } from '@jsverse/transloco';
import { FireResult } from '../../core/services/finance.service';

@Component({
  selector: 'app-fire-tab',
  standalone: true,
  imports: [CommonModule, TranslocoDirective],
  templateUrl: './fire-tab.component.html',
})
export class FireTabComponent {
  fireStatus = input.required<FireResult>();
  monthlyExpenses = input.required<number>();
}
