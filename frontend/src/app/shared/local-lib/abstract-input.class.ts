import { Directive, ElementRef, forwardRef, inject, signal, computed, effect, ViewChild, model, output, untracked } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, ValidationErrors, Validator, ValidatorFn } from '@angular/forms';
import { Subject } from 'rxjs';
import { ValidationErrorService } from './services/validation.service';
import { AbstractRolesComponent } from './abstract-roles.class';
import { DomSanitizer } from '@angular/platform-browser';
import { isNullOrEmpty } from './helper.class';
import { CheckedField, FormChecks, isMissing } from './fields/form-checks';

@Directive({
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => AbstractInputComponent),
      multi: true,
    },
  ],
})
/**
 * What the fields local-lib still draws itself share - the filters' multiselect, the button that chooses files or a
 * folder, the HTML editor, which anotoki-lib 0.11.0 brings to the kit (the owner's request of 2026-10-25), and genshin
 * then binds the kit's: its value (any type - a list of keys, files, markup), `required` and `validators`, and the
 * error said once the field is touched. Each is one of the fields its form checks before a save (FormChecks), as the
 * kit's fields are through FieldCheck's directives.
 *
 * Drawn in the kit's look (components.scss), each with the label, the hint and the error worked out here (`kitLabel`,
 * `kitHint`, `kitError`).
 */
export abstract class AbstractInputComponent<T = string> extends AbstractRolesComponent implements Validator, CheckedField {
  @ViewChild('inputElement') inputElement?: ElementRef<HTMLInputElement | HTMLSelectElement>;
  @ViewChild('labelElement') labelElement?: ElementRef<HTMLLabelElement>;

  // inputs
  value = model<T | undefined | null>();
  required = model<boolean>(false);
  label = model<string>('');
  placeholder = model<string | undefined>();
  description = model<string>('');
  disabled = model<boolean>(false);
  customErrorMessage = model<string | undefined>();
  validators = model<ValidatorFn[]>([]);
  class = model<string | undefined>();
  displayError = model<boolean>(true);
  width = model<'default' | 'min-content'>('default');
  sanitize = model<boolean>(false);
  inputClass = model<string>('');

  // outputs
  inputChange = output<T | undefined | null>();
  focusChange = output<boolean>();
  touchChange = output<boolean>();
  blurChange = output<void>();
  validationChange = output<boolean>();

  // Internal state signals
  isTouched = model<boolean>(false);
  isFocused = model<boolean>(false);
  errorMessage = signal<string | undefined>(undefined);

  // Computed signals
  hasError = computed(() => {
    return this.errorMessage() !== undefined && this.errorMessage() !== null && this.isTouched() && !this.disabled();
  });
  isValid = computed(() => !this.errorMessage());

  /** The kit field's label: the field's own, marked when it must be filled; else what the placeholder says, for screen readers. */
  readonly kitLabel = computed(() => (this.label() ? this.label() + (this.required() ? ' *' : '') : (this.placeholder() ?? '')));
  /** The quieter line under the field. */
  readonly kitHint = computed(() => this.description() || null);
  /** The error the kit field says (role="alert", aria-invalid), once the field has been touched. */
  readonly kitError = computed(() => (this.displayError() && this.hasError() ? (this.errorMessage() ?? null) : null));
  isNullOrEmpty = computed(() => {
    const val = this.computedValue();
    return isNullOrEmpty(val);
  });
  computedValue = computed(() => {
    const value = this.value() ?? '';
    if (this.sanitize()) {
      return this.sanitizer.bypassSecurityTrustHtml(value as string) as string;
    }
    return value;
  });

  onValidatorChange?: () => void;
  unsubscriber = new Subject<void>();
  inputId: string = `input-${Math.random().toString(36).substr(2, 9)}`;
  abstractControl: AbstractControl = {
    value: this.value(),
    errors: null,
  } as AbstractControl;

  readonly elementRef = inject(ElementRef);
  readonly sanitizer = inject(DomSanitizer);
  protected readonly validationErrorService$ = inject(ValidationErrorService);
  protected skipAfterValueChange = false;
  private readonly _formChecks = inject(FormChecks);

  /** As its form's save checks it (FormChecks): where it is, whether it is wrong, and its error shown. */
  get element(): HTMLElement {
    return this.elementRef.nativeElement;
  }

  readonly wrong = computed(() => !this.isValid());

  touch(): void {
    this.markAsTouched();
  }

  constructor() {
    super();
    this._formChecks.add(this);
    effect(() => {
      const value = this.value();

      if (this.skipAfterValueChange) {
        this.skipAfterValueChange = false;
      } else {
        this.afterValueChange?.(value);
      }
      untracked(() => this.updateErrorMessageInternal());
    });

    effect(() => {
      this.required();
      this.customErrorMessage();
      this.validators();
      untracked(() => this.updateErrorMessageInternal());
    });
  }

  ngOnInit(): void {
    this.updateErrorMessageInternal();
  }

  /** Says the field is drawn (a form that measures its fields waits for it). */
  readonly initialized = output<boolean>();

  ngAfterViewInit(): void {
    this.initialized.emit(true);
  }

  ngOnDestroy(): void {
    this._formChecks.remove(this);
    this.unsubscriber.next();
    this.unsubscriber.complete();
  }

  onBlur(event?: Event): void {
    this.isTouched.set(true);
    this.touchChange.emit(this.isTouched());
    this.isFocused.set(false);
    this.focusChange.emit(this.isFocused());
    this.updateErrorMessageInternal();
    this.emitValidationState();
    this.blurChange.emit();
  }

  onFocus(event?: Event): void {
    this.inputElement?.nativeElement.focus();
    this.isFocused.set(true);
    this.focusChange.emit(this.isFocused());
  }

  validate(control: AbstractControl): ValidationErrors | null {
    // Otherwise use the existing validation logic
    const errors: ValidationErrors = {};
    const isRequired = this.required();
    const currentValidators = this.validators();

    if (isRequired && isMissing(this.value())) {
      errors['required'] = true;
    }

    if (currentValidators && currentValidators.length > 0) {
      currentValidators.forEach((validator) => {
        const validationResult = validator(control);
        if (validationResult) {
          Object.assign(errors, validationResult);
        }
      });
    }

    return Object.keys(errors).length > 0 ? errors : null;
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected afterValueChange(value?: T | null): void {}

  registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChange = fn;
  }

  updateErrorMessageInternal(): void {
    const customMsg = this.customErrorMessage();

    // Custom error message overrides everything
    if (customMsg !== null && customMsg !== undefined) {
      this.errorMessage.set(customMsg);
      return;
    }

    // Show validation errors
    this.abstractControl = {
      value: this.value(),
      errors: null,
    } as AbstractControl;
    const validationErrors = this.validate(this.abstractControl);
    this.setErrorMessage(validationErrors);
  }

  setErrorMessage(validationErrors: ValidationErrors | null): void {
    let message;

    if (validationErrors) {
      message = this.validationErrorService$.getFirstErrorMessage(validationErrors);
    }

    this.errorMessage.set(message);
    this.emitValidationState();
  }

  emitValidationState(): void {
    const valid = this.isValid();
    this.validationChange.emit(valid);
  }

  markAsTouched(): void {
    this.isTouched.set(true);
    this.touchChange.emit(this.isTouched());
    this.updateErrorMessageInternal();
    this.emitValidationState();
  }

  setCustomError(message: string): void {
    // Note: With signal inputs, we can't directly set the input
    // This would need to be handled differently, perhaps with a separate writable signal
    this.errorMessage.set(message);
    this.emitValidationState();
  }

  clearCustomError(): void {
    this.errorMessage.set('');
    this.emitValidationState();
  }

  updateValidators(validators: ValidatorFn[]): void {
    this.validators.set(validators);
    this.onValidatorChange?.();
    this.updateErrorMessageInternal();
    this.emitValidationState();
  }

  addValidator(validator?: ValidatorFn): void {
    if (!validator) {
      return;
    }
    this.validators.update((current) => [...current, validator]);
    this.onValidatorChange?.();
    this.updateErrorMessageInternal();
    this.emitValidationState();
  }

  removeValidator(validatorToRemove?: ValidatorFn): void {
    if (validatorToRemove === undefined) {
      // Remove all validators
      this.validators.set([]);
    } else {
      // Remove specific validator
      this.validators.update((current) => current.filter((v) => v !== validatorToRemove));
    }
    this.onValidatorChange?.();
    this.updateErrorMessageInternal();
    this.emitValidationState();
  }
}
