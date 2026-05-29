import { TestBed } from '@angular/core/testing';
import { describe, beforeEach, it, expect } from 'vitest';
import { App } from './app';
import { provideTransloco, TranslocoLoader } from '@jsverse/transloco';
import { Injectable } from '@angular/core';

@Injectable()
class MockTranslocoLoader implements TranslocoLoader {
  getTranslation(lang: string) {
    return Promise.resolve({
      title: 'Snowball',
      subtitle: 'Interactive Financial Planner',
      dashboard: {
        year: 'Año',
        chart: {
          nominalBalance: 'Nominal Balance',
          realBalance: 'Real Balance',
          contributions: 'Contributions',
          stocks: 'Stocks',
          bonds: 'Bonds',
          cash: 'Cash'
        }
      }
    });
  }
}

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideTransloco({
          config: {
            availableLangs: ['en', 'es'],
            defaultLang: 'es',
          },
          loader: MockTranslocoLoader
        })
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should initialize with default financial parameters', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app.initialCapital()).toBe(10000);
    expect(app.monthlyContribution()).toBe(200);
    expect(app.annualReturn()).toBe(7);
    expect(app.years()).toBe(30);
    expect(app.inflation()).toBe(2);
  });

  it('should initialize with default chartMode as nominal-real', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app.chartMode()).toBe('nominal-real');
  });

  it('should calculate scenarios correctly with a cono de incertidumbre', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    
    app.initialCapital.set(10000);
    app.monthlyContribution.set(200);
    app.years.set(10);
    app.selectRiskProfile('moderate'); // 6% return, 8% volatility
    
    const scenarios = app.scenariosResults();
    expect(scenarios.length).toBe(11); // Year 0 to 10
    
    const year0 = scenarios[0];
    expect(year0.expected).toBe(10000);
    expect(year0.optimistic).toBe(10000);
    expect(year0.pessimistic).toBe(10000);
    
    const year10 = scenarios[10];
    expect(year10.optimistic).toBeGreaterThan(year10.expected);
    expect(year10.expected).toBeGreaterThan(year10.pessimistic);
  });

  it('should clear the risk profile when deselected and reset annual return to 7%', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    
    app.selectRiskProfile('moderate');
    expect(app.riskProfile()).toBe('moderate');
    expect(app.annualReturn()).toBe(6.0);
    
    app.deselectRiskProfile();
    expect(app.riskProfile()).toBeNull();
    expect(app.annualReturn()).toBe(7);
  });
});
