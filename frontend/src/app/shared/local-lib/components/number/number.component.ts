import { Component, computed, model, signal } from '@angular/core';
import { TextFieldComponent } from '@anotoki/lib/ui/forms';

import { AbstractInputComponent } from '../../abstract-input.class';

type Type = string | number | null;

/**
 * A number in the site's forms: the kit's text field with a number keyboard.
 * What is typed stays as it is while it is no number this field takes (a
 * letter, a second decimal point, below the minimum) and says why; once it is
 * one, it is the value - as the text it was typed as, a point for a comma, the
 * way the forms send it. Empty is NaN, which `required` reads as empty.
 */
@Component({
  selector: 'app-number',
  imports: [TextFieldComponent],
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

  /** What is in the box while it is not a number this field takes; null once it is. */
  private readonly _draft = signal<string | null>(null);

  readonly text = computed(() => {
    const draft = this._draft();
    if (draft !== null) {
      return draft;
    }
    const value = this.value();
    return value === null || value === undefined || (typeof value === 'number' && Number.isNaN(value)) ? '' : String(value);
  });

  /** Why what is typed is not taken - said before the rules' own errors. */
  readonly formatError = computed(() => (this._draft() === null ? null : this._rangeWords()));

  readonly shownError = computed(() => this.formatError() ?? this.kitError());

  onKitInput(text: string): void {
    let typed = text.trim();
    if (typed.startsWith('.') || typed.startsWith(',')) {
      typed = `0${typed}`;
    }
    if (!this.isValueAcceptable(typed)) {
      this._draft.set(text);
      return;
    }
    this._draft.set(null);
    const value: Type = typed === '' ? NaN : typed.replace(',', '.');
    this.value.set(value);
    this.inputChange.emit(value);
  }

  isValueAcceptable(value: string): boolean {
    if (value === '') {
      return true;
    }
    if (/[.,].*[.,]/.test(value) || !/^-?\d*[.,]?\d*$/.test(value)) {
      return false;
    }
    if (!this.allowNegative() && value.startsWith('-')) {
      return false;
    }
    if (!this.allowDecimal() && /[.,]/.test(value)) {
      return false;
    }
    const decimals = value.split(/[.,]/)[1];
    if (this.allowDecimal() && this.decimalPlaces() > 0 && decimals !== undefined && decimals.length > this.decimalPlaces()) {
      return false;
    }
    if (value === '-' || /[.,]$/.test(value)) {
      return false;
    }
    const number = Number(value.replace(',', '.'));
    const min = this.min();
    const max = this.max();
    return !Number.isNaN(number) && (min === undefined || number >= min) && (max === undefined || number <= max);
  }

  private _rangeWords(): string {
    const min = this.min();
    const max = this.max();
    const kind = this.allowDecimal() ? 'A number' : 'A whole number';
    if (min !== undefined && max !== undefined) {
      return `${kind} from ${min} to ${max}`;
    }
    if (min !== undefined) {
      return `${kind}, ${min} or more`;
    }
    if (max !== undefined) {
      return `${kind}, ${max} or less`;
    }
    return `${kind}`;
  }
}
