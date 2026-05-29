import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, TranslocoDirective],
  templateUrl: './header.component.html',
  host: {
    class: 'sticky top-0 z-50 block w-full'
  }
})
export class HeaderComponent {
  currentLang = input.required<string>();
  darkMode = input.required<boolean>();
  currentCurrency = input.required<'EUR' | 'USD'>();

  toggleLanguage = output<void>();
  toggleTheme = output<void>();
  toggleCurrency = output<void>();
}
