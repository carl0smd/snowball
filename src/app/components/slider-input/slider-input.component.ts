import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-slider-input',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './slider-input.component.html',
})
export class SliderInputComponent {
  label = input.required<string>();
  displayValue = input.required<string>();
  value = input.required<number>();
  min = input<number>(0);
  max = input.required<number>();
  step = input<number>(1);
  minLabel = input.required<string>();
  midLabel = input.required<string>();
  maxLabel = input.required<string>();

  valueChange = output<number>();

  isFocused = false;

  onFocus() {
    this.isFocused = true;
  }

  onBlur() {
    this.isFocused = false;
    let val = this.value();
    if (isNaN(val)) {
      val = this.min();
    } else {
      if (val < this.min()) val = this.min();
      if (val > this.max()) val = this.max();
    }
    this.valueChange.emit(val);
  }

  onInput(event: Event) {
    const inputEl = event.target as HTMLInputElement;
    let rawValue = inputEl.value;

    // Enforce positive number: strip any negative sign
    if (rawValue.includes('-')) {
      rawValue = rawValue.replace(/-/g, '');
      inputEl.value = rawValue;
    }

    if (rawValue === '') return;

    let parsed = parseFloat(rawValue);
    if (!isNaN(parsed)) {
      // Enforce the dynamic cap in real-time
      if (parsed > this.max()) {
        parsed = this.max();
        inputEl.value = parsed.toString(); // Update visual value immediately
      }
      this.valueChange.emit(Math.max(this.min(), parsed));
    }
  }

  onSliderInput(event: Event) {
    const parsed = parseFloat((event.target as HTMLInputElement).value);
    if (!isNaN(parsed)) {
      this.valueChange.emit(parsed);
    }
  }

  onKeyDown(event: KeyboardEvent) {
    if (['-', '+', 'e', 'E'].includes(event.key)) {
      event.preventDefault();
    }
  }
}
