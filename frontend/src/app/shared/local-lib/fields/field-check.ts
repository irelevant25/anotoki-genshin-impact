import { booleanAttribute, computed, Directive, ElementRef, inject, input, OnDestroy, Signal, signal } from '@angular/core';
import { TextareaComponent, TextFieldComponent } from '@anotoki/lib/ui/forms';
import { DateFieldComponent } from '@anotoki/lib/ui/date-field';
import { CheckedField, FormChecks, isMissing, REQUIRED_WORDS } from './form-checks';

/**
 * One of the kit's fields as the admin forms check it before a save (FormChecks): marked `required` - the same binding
 * the kit's field takes for its native attribute -, it is wrong while what it holds is empty (isMissing) and says so
 * under itself once it has been left or a save has asked: `error`, for the kit field's `[error]`. The kit draws the
 * field and says the words; what is right is the form's. Each directive on a kit field gives the value it checks.
 */
@Directive()
export abstract class FieldCheck implements CheckedField, OnDestroy {
  /** The field must be filled. */
  readonly required = input(false, { transform: booleanAttribute });

  readonly element: HTMLElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  /** What the check reads: the value the field holds. */
  protected abstract readonly checked: Signal<unknown>;

  private readonly _touched = signal(false);
  private readonly _checks = inject(FormChecks);

  readonly wrong = computed(() => this.required() && isMissing(this.checked()));

  /** The required field's words, once it has been left (or a save asked) while it is empty. */
  protected readonly missingError = computed(() => (this._touched() && this.wrong() ? REQUIRED_WORDS : null));

  /** What the kit's field says under itself. */
  readonly error: Signal<string | null> = this.missingError;

  constructor() {
    this._checks.add(this);
  }

  ngOnDestroy(): void {
    this._checks.remove(this);
  }

  touch(): void {
    this._touched.set(true);
  }
}

/**
 * The check of a kit text field, textarea or date field (FieldCheck): `appCheck` on it, with `required`, and the
 * field's `[error]` bound to the check's `error()`. It reads what the field holds - the text, or its date ('' while
 * there is none) - and the field counts as left as genshin's own fields had it: the text or the date when the field's
 * input is left (its `blurred`), a textarea when the focus leaves it.
 */
@Directive({
  selector: 'anotoki-text-field[appCheck], anotoki-textarea[appCheck], anotoki-date-field[appCheck]',
  exportAs: 'appCheck',
  host: { '(focusout)': 'onFocusOut()' },
})
export class FieldCheckDirective extends FieldCheck {
  private readonly _text = inject(TextFieldComponent, { self: true, optional: true });
  private readonly _area = inject(TextareaComponent, { self: true, optional: true });
  private readonly _date = inject(DateFieldComponent, { self: true, optional: true });

  protected readonly checked = computed(() => (this._text ?? this._area ?? this._date)?.value());

  constructor() {
    super();
    (this._text ?? this._date)?.blurred.subscribe(() => this.touch());
  }

  protected onFocusOut(): void {
    if (this._area) {
      this.touch();
    }
  }
}
