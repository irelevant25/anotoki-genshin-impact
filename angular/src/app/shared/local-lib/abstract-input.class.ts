import { ChangeDetectorRef, Directive, ElementRef, forwardRef, inject, signal, computed, effect, ViewChild, model, output, untracked } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, ValidationErrors, Validator, ValidatorFn } from '@angular/forms';
import { Subject } from 'rxjs';
import { ValidationErrorService } from './services/validation.service';
import { AbstractTooltipComponent } from './abstract-tooltip.class';
import { requiredValidator } from './validators/required.class';

@Directive({
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => AbstractInputComponent),
      multi: true,
    },
  ],
})
export abstract class AbstractInputComponent<T = string> extends AbstractTooltipComponent implements Validator {
  @ViewChild('inputElement') inputElement?: ElementRef<HTMLInputElement | HTMLSelectElement>;
  @ViewChild('labelElement') labelElement?: ElementRef<HTMLLabelElement>;

  // inputs
  value = model<T | undefined | null>(undefined);
  required = model<boolean>(false);
  label = model<string>('');
  placeholder = model<string>('');
  description = model<string>('');
  disabled = model<boolean>(false);
  customErrorMessage = model<string | undefined>(undefined);
  validators = model<ValidatorFn[]>([]);
  class = model<string | undefined>(undefined);
  displayError = model<boolean>(true);

  // outputs
  inputChange = output<T | undefined | null>();
  focusChange = output<boolean>();
  touchChange = output<boolean>();
  blurChange = output<void>();
  validationChange = output<boolean>();

  // Internal state signals
  isTouched = signal<boolean>(false);
  isFocused = signal<boolean>(false);
  errorMessage = signal<string | undefined>(undefined);

  // Computed signals
  hasError = computed(() => {
    return !!this.errorMessage() && this.isTouched();
  });
  isValid = computed(() => !this.errorMessage());
  isNullOrEmpty = computed(() => {
    const val = this.computedValue();
    return val === undefined || val === null || val === '' || Number.isNaN(val);
  });
  computedValue = computed(() => {
    return this.value() ?? '';
  });

  onValidatorChange?: () => void;
  unsubscriber = new Subject<void>();
  inputId: string = `input-${Math.random().toString(36).substr(2, 9)}`;
  abstractControl: AbstractControl = {
    value: this.value(),
    errors: null,
  } as AbstractControl;

  readonly elementRef = inject(ElementRef);
  protected readonly cd = inject(ChangeDetectorRef);
  protected readonly validationErrorService$ = inject(ValidationErrorService);
  protected skipAfterValueChange = false;

  constructor() {
    super();
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

  override ngOnDestroy(): void {
    super.ngOnDestroy();
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

  setDisabledState(isDisabled: boolean): void {
    // For forms integration - would need a writable signal if needed
    this.cd.markForCheck();
  }

  validate(control: AbstractControl): ValidationErrors | null {
    // Otherwise use the existing validation logic
    const errors: ValidationErrors = {};
    const isRequired = this.required();
    const currentValidators = this.validators();

    // Use requiredValidator if required is true
    if (isRequired) {
      const requiredValidatorFn = requiredValidator(this);
      const requiredResult = requiredValidatorFn(control);
      if (requiredResult) {
        Object.assign(errors, requiredResult);
      }
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
  protected afterValueChange(value?: T | null): void { }

  registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChange = fn;
  }

  updateErrorMessageInternal(): void {
    const customMsg = this.customErrorMessage();

    // Custom error message overrides everything
    if (customMsg) {
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
    let message = '';

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
