import { TestBed } from '@angular/core/testing';
import { describe, beforeEach, it, expect } from 'vitest';
import { SliderInputComponent } from './slider-input.component';
import { ComponentRef } from '@angular/core';

describe('SliderInputComponent', () => {
  let component: SliderInputComponent;
  let componentRef: ComponentRef<SliderInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SliderInputComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(SliderInputComponent);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;

    // Set required inputs to mock defaults
    componentRef.setInput('label', 'Test Input');
    componentRef.setInput('displayValue', '100 €');
    componentRef.setInput('value', 100);
    componentRef.setInput('min', 0);
    componentRef.setInput('max', 200);
    componentRef.setInput('step', 1);
    componentRef.setInput('minLabel', '0 €');
    componentRef.setInput('midLabel', '100 €');
    componentRef.setInput('maxLabel', '200 €');

    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle isFocused on focus and blur', () => {
    expect(component.isFocused).toBe(false);
    component.onFocus();
    expect(component.isFocused).toBe(true);
    component.onBlur();
    expect(component.isFocused).toBe(false);
  });

  it('should emit a parsed number when valid input is entered', () => {
    let emittedValue: number | undefined;
    component.valueChange.subscribe((v) => (emittedValue = v));

    const mockEvent = {
      target: {
        value: '150'
      }
    } as unknown as Event;

    component.onInput(mockEvent);
    expect(emittedValue).toBe(150);
  });

  it('should immediately cap value to max in real-time inside onInput', () => {
    let emittedValue: number | undefined;
    component.valueChange.subscribe((v) => (emittedValue = v));

    const mockElement = {
      value: '250'
    };
    const mockEvent = {
      target: mockElement
    } as unknown as Event;

    component.onInput(mockEvent);
    expect(mockElement.value).toBe('200'); // Immediately capped at max limit
    expect(emittedValue).toBe(200);
  });

  it('should strip negative signs and emit absolute positive value when negative value is typed', () => {
    let emittedValue: number | undefined;
    component.valueChange.subscribe((v) => (emittedValue = v));

    const mockElement = {
      value: '-75'
    };
    const mockEvent = {
      target: mockElement
    } as unknown as Event;

    component.onInput(mockEvent);
    expect(mockElement.value).toBe('75'); // '-' stripped
    expect(emittedValue).toBe(75);
  });

  it('should block negative, plus, and exponent keys on keydown', () => {
    let defaultPrevented = false;
    const mockEvent = {
      key: '-',
      preventDefault: () => {
        defaultPrevented = true;
      }
    } as unknown as KeyboardEvent;

    component.onKeyDown(mockEvent);
    expect(defaultPrevented).toBe(true);

    defaultPrevented = false;
    const mockEventE = {
      key: 'e',
      preventDefault: () => {
        defaultPrevented = true;
      }
    } as unknown as KeyboardEvent;

    component.onKeyDown(mockEventE);
    expect(defaultPrevented).toBe(true);

    defaultPrevented = false;
    const mockEventValid = {
      key: '5',
      preventDefault: () => {
        defaultPrevented = true;
      }
    } as unknown as KeyboardEvent;

    component.onKeyDown(mockEventValid);
    expect(defaultPrevented).toBe(false);
  });

  it('should emit value when slider inputs change', () => {
    let emittedValue: number | undefined;
    component.valueChange.subscribe((v) => (emittedValue = v));

    const mockEvent = {
      target: {
        value: '80'
      }
    } as unknown as Event;

    component.onSliderInput(mockEvent);
    expect(emittedValue).toBe(80);
  });

  it('should clamp the value to max on blur if it exceeds the limit', () => {
    let emittedValue: number | undefined;
    component.valueChange.subscribe((v) => (emittedValue = v));

    // Force set the input value above max
    componentRef.setInput('value', 300);
    component.onBlur();

    expect(emittedValue).toBe(200); // Clamped to max
  });

  it('should clamp the value to min on blur if it is below the limit', () => {
    let emittedValue: number | undefined;
    component.valueChange.subscribe((v) => (emittedValue = v));

    // Force set the input value below min
    componentRef.setInput('value', -50);
    component.onBlur();

    expect(emittedValue).toBe(0); // Clamped to min (0)
  });

  it('should reset value to min on blur if value is NaN', () => {
    let emittedValue: number | undefined;
    component.valueChange.subscribe((v) => (emittedValue = v));

    componentRef.setInput('value', NaN);
    component.onBlur();

    expect(emittedValue).toBe(0); // Clamped to min
  });
});
