import { booleanAttribute, computed, Directive, inject, input, model, signal } from '@angular/core';
import { TextFieldComponent } from '@anotoki/lib/ui/forms';
import { FieldCheck } from './field-check';

/** A number as the admin forms hold it: as the API answered it, as it was typed (the text, a point for a comma), or NaN once emptied. */
export type NumberValue = string | number | null | undefined;

/**
 * A number typed into the kit's text field: what the kit's field lacks until anotoki-lib 0.11.0 (the library's half of
 * the owner's request of 2026-10-25 gives it one), kept here meanwhile - then this goes, and the forms bind the kit's.
 *
 * What is typed stays as it is while it is no number this field takes - a letter, a second decimal point, more than
 * `decimalPlaces` decimals, outside `min` and `max` - and says why under the field, before the form's own check. Once
 * it is one, it is the value: the text it was typed as with a point for a comma, the way the forms send it on (the
 * save turns it into a number, admin-full-resource.model.ts); emptied, it is NaN, which `required` reads as empty. The
 * value is a model - `[(appNumber)]` for a form's field, `[appNumber]` with `(appNumberChange)` where the form decides
 * what a change does (an order that moves the rows). The field binds the text shown (`[value]="x.text()"`), the
 * phone's keyboard (`[inputmode]="x.inputmode()"`) and the words under it (`[error]="x.error()"`); it is a
 * FieldCheck of its own, counted as left when its input is.
 */
@Directive({ selector: 'anotoki-text-field[appNumber]', exportAs: 'appNumber' })
export class NumberFieldDirective extends FieldCheck {
  readonly value = model<NumberValue>(undefined, { alias: 'appNumber' });
  /** Decimals taken, up to `decimalPlaces`; a whole number otherwise. */
  readonly decimal = input(false, { transform: booleanAttribute });
  /** Below nought taken. */
  readonly negative = input(false, { transform: booleanAttribute });
  readonly decimalPlaces = input(2);
  readonly min = input<number | undefined>(undefined);
  readonly max = input<number | undefined>(undefined);

  protected readonly checked = this.value;

  private readonly _field = inject(TextFieldComponent, { self: true });

  /** What is in the box while it is no number this field takes; null once it is. */
  private readonly _draft = signal<string | null>(null);

  /** The text the field shows. */
  readonly text = computed(() => {
    const draft = this._draft();
    if (draft !== null) {
      return draft;
    }
    const value = this.value();
    return value === null || value === undefined || (typeof value === 'number' && Number.isNaN(value)) ? '' : String(value);
  });

  readonly inputmode = computed(() => (this.decimal() ? 'decimal' : 'numeric'));

  /** Why what is typed is not taken - said before the form's own check. */
  private readonly _formatError = computed(() => (this._draft() === null ? null : this._rangeWords()));

  override readonly error = computed(() => this._formatError() ?? this.missingError());

  constructor() {
    super();
    this._field.value.subscribe((text) => this._typed(text));
    this._field.blurred.subscribe(() => this.touch());
  }

  private _typed(text: string): void {
    let typed = text.trim();
    if (typed.startsWith('.') || typed.startsWith(',')) {
      typed = `0${typed}`;
    }
    if (!this._takes(typed)) {
      this._draft.set(text);
      return;
    }
    this._draft.set(null);
    this.value.set(typed === '' ? NaN : typed.replace(',', '.'));
  }

  private _takes(value: string): boolean {
    if (value === '') {
      return true;
    }
    if (/[.,].*[.,]/.test(value) || !/^-?\d*[.,]?\d*$/.test(value)) {
      return false;
    }
    if (!this.negative() && value.startsWith('-')) {
      return false;
    }
    if (!this.decimal() && /[.,]/.test(value)) {
      return false;
    }
    const decimals = value.split(/[.,]/)[1];
    if (this.decimal() && this.decimalPlaces() > 0 && decimals !== undefined && decimals.length > this.decimalPlaces()) {
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
    const kind = this.decimal() ? 'A number' : 'A whole number';
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
