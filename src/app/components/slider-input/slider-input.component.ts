import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-slider-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './slider-input.component.html',
})
export class SliderInputComponent {
  label = input.required<string>();
  displayValue = input.required<string>();
  value = input.required<number>();
  min = input<number>(0);
  max = input<number>(100);
  step = input<number>(1);
  minLabel = input.required<string>();
  midLabel = input.required<string>();
  maxLabel = input.required<string>();

  valueChange = output<number>();
}
