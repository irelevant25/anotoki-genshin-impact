import { Component, model, Pipe, PipeTransform } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AbstractInputComponent } from '../../abstract-input.class';

@Pipe({ name: 'formatNumber' })
export class NumberPipe implements PipeTransform {
  private _padding?: number;
  setPadding(padding: number): this {
    this._padding = padding;
    return this;
  }
  transform(value?: Type, padding?: number): string {
    let result = Number.isNaN(value) ? '' : (value?.toString() ?? '');
    const actualPadding = padding ?? this._padding;

    if (typeof value === 'number' && actualPadding !== undefined) {
      result = value.toFixed(actualPadding);
    }

    return result.replace('.', ',');
  }
}

type Type = string | number | null;

@Component({
  selector: 'app-number',
  imports: [FormsModule, NumberPipe],
  templateUrl: './number.component.html',
  styleUrls: ['./number.component.scss'],
  providers: [
    {
      provide: AbstractInputComponent,
      useExisting: NumberComponent,
    },
  ],
})
export class NumberComponent extends AbstractInputComponent<Type> {
  allowDecimal = model<boolean>(false);
  allowNegative = model<boolean>(false);
  decimalPlaces = model<number>(2);
  min = model<number | undefined>(undefined);
  max = model<number | undefined>(undefined);

  oldValue: string = '';
  Number = Number;

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    let value = target.value;
    if (value.startsWith('.') || value.startsWith(',')) {
      value = `0${value}`;
      target.value = value;
    }
    if (!this.isValueAcceptable(value)) {
      target.value = this.oldValue;
      return;
    }
    this.oldValue = target.value;
    let newValue: Type = target.value.replace(',', '.');
    if (newValue === null || newValue === undefined || newValue === '') {
      newValue = NaN;
    }
    this.value.set(newValue);
    this.inputChange.emit(this.value());
  }

  isValueAcceptable(value?: Type | null): boolean {
    value = value ? (value?.toString() ?? '') : this.value();
    value = value?.toString() ?? '';

    if (!/[0-9.,-]*/.test(value)) {
      return false;
    }

    if (/[.,].*[.,]/.test(value)) {
      return false;
    }

    if (value.includes(',')) {
      value = value.replace(',', '.');
    }

    const number = parseInt(value);
    // Check if min is defined and if it is greater than the value
    const minValue = this.min();
    if (minValue !== undefined && number < minValue) {
      return false;
    }
    // Check if max is defined and if it is less than the value
    const maxValue = this.max();
    if (maxValue !== undefined && number > maxValue) {
      return false;
    }
    // Check if allowNegative is false and if the value is negative
    if (!this.allowNegative() && value.startsWith('-')) {
      return false;
    }
    // Check if allowDecimal is false and if the value has a decimal point
    if (!this.allowDecimal() && value.includes('.')) {
      return false;
    }
    // Check if decimalPlaces is greater than 0 and if the value has more decimal places than allowed
    if (this.allowDecimal() && this.decimalPlaces() > 0 && value.includes('.')) {
      const decimalNumber = value.split('.').at(-1)?.length;
      if (decimalNumber && decimalNumber > this.decimalPlaces()) {
        return false;
      }
    }
    // Check if allowNegative is true and if the value is just a negative sign
    if (this.allowNegative() && value.length === 1 && value === '-') {
      return true;
    }
    // Check if allowDecimal is true and if the value ends with a decimal point
    if (this.allowDecimal() && value && value.length >= 1 && value.endsWith('.')) {
      return true;
    }
    // Check if value is a number
    if (value && value.length > 0 && isNaN(number)) {
      return false;
    }
    // If all checks pass, return true
    return true;
  }
}
