import { computed, Directive, inject, model, signal } from '@angular/core';
import { NumberFieldComponent } from '@anotoki/lib/ui/number-field';
import { FieldCheck } from './field-check';

/** A number as the admin forms hold it: as the API answered it (a NUMERIC column comes as text), as the field gave it, or NaN once emptied. */
export type NumberValue = string | number | null | undefined;

/**
 * The kit's number field (@anotoki/lib/ui/number-field, anotoki-lib 0.11.0) as the admin forms keep a number: the
 * field draws it, reads what is typed - a dot or a comma, its `min`, `max` and `step` (1 a whole number, 0.01 two
 * decimals) - and says why a text is not taken ("Write a whole number.", "The largest number is 6."); this keeps the
 * forms' side of it as it was.
 *
 * The value is a model of the form's own field - `[(appNumber)]`, or `[appNumber]` with `(appNumberChange)` where the
 * form decides what a change does (an order that moves the rows) - and the field shows it: `[value]="x.number()"`.
 * A number the field takes is the value; the box emptied, it is NaN, which `required` reads as empty; a text the field
 * does not take keeps the last number taken, as these forms always had it, while the field says why. It is a
 * FieldCheck of its own (`required`, the words under the field once it is left or a save asks - `[error]="x.error()"`,
 * which gives way to the field's own words while the box holds a text that is no number), counted as left when the
 * field is.
 */
@Directive({ selector: 'anotoki-number-field[appNumber]', exportAs: 'appNumber' })
export class NumberFieldDirective extends FieldCheck {
  readonly value = model<NumberValue>(undefined, { alias: 'appNumber' });

  protected readonly checked = this.value;

  private readonly _field = inject(NumberFieldComponent, { self: true });

  /**
   * What the box holds, as last typed; null until the person typed. The field tells every input (anotoki-lib 0.11.1),
   * not only those that change its value - from an emptied box to a number out of range it stays null, and is told
   * again all the same.
   */
  private readonly _text = signal<string | null>(null);

  /** The value as the kit's field takes it: a number, or null for none. */
  readonly number = computed<number | null>(() => {
    const value = this.value();
    if (value === null || value === undefined || value === '') {
      return null;
    }
    const number = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(number) ? number : null;
  });

  /** Nothing in the box: what was typed, or - before anything was - no number to show. */
  private readonly _blank = computed(() => {
    const text = this._text();
    return text === null ? this.number() === null : text.trim() === '';
  });

  /** The required field's words while the box is empty; a text in it that is no number is the field's own to say. */
  override readonly error = computed(() => (this._blank() ? this.missingError() : null));

  constructor() {
    super();
    this._field.value.subscribe((number) => {
      // Read as the field tells it, inside its own input event: the box holds the new text already.
      this._text.set(this.element.querySelector('input')?.value ?? '');
      if (number !== null) {
        this.value.set(number);
      } else if (this._blank()) {
        this.value.set(NaN);
      }
    });
    this._field.blurred.subscribe(() => this.touch());
  }
}
