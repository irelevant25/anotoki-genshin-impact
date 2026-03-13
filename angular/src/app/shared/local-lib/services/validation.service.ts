import { Injectable } from '@angular/core';
import { ValidationErrors } from '@angular/forms';

export interface ErrorMessageConfig {
  [errorKey: string]: string | ((error: any) => string);
}

@Injectable({
  providedIn: 'root',
})
export class ValidationErrorService {
  private _defaultErrorMessages: ErrorMessageConfig = {
    required: () => 'Toto pole je povinné',
    min: (min: any) => `Minimálna hodnota je ${min}`,
    max: (max: any) => `Maximálna hodnota je ${max}`,
    minlength: (requiredLength: any) => `Minimálna dĺžka je ${requiredLength} ${requiredLength <= 0 || requiredLength >= 5 ? 'znakov' : requiredLength === 1 ? 'znak' : 'znaky'}`,
    maxlength: (requiredLength: any) => `Maximálna dĺžka je ${requiredLength} ${requiredLength <= 0 || requiredLength >= 5 ? 'znakov' : requiredLength === 1 ? 'znak' : 'znaky'}`,
    lengthRange: (error: any) => `Maximálna dĺžka musí byť medzi ${error.minlength} a ${error.maxlength} znakov`,
    email: () => 'Neplatná emailová adresa. Požadovany format: xxx@yyy.zzz',
    phoneNumber: () => 'Neplatné telefónne číslo',
    forbiddenValue: (value: any) => `Hodnota "${value}" nie je povolená`,
    allowedValues: (allowed: any) => `Povolené sú len hodnoty: ${allowed.join(', ')}`,
    numberRange: (error: any) => `Hodnota musí byť medzi ${error.min} a ${error.max}`,
    uniqueValue: (value: any) => `Hodnota "${value}" už existuje`,
    dateRangeInvalid: () => 'Neplatný dátumový rozsah',
    rangeInvalid: () => 'Neplatný číselný rozsah',
    custom: () => 'Neplatná hodnota',
  };

  /**
   * Get error message for a validation error
   * @param errorKey - The validation error key
   * @param errorValue - The validation error value
   * @param customMessages - Custom error message overrides
   * @returns The formatted error message
   */
  getErrorMessage(errorKey: string, errorValue: any, customMessages: ErrorMessageConfig = {}): string {
    // Priority 1: Custom message override
    if (customMessages[errorKey]) {
      const customMessage = customMessages[errorKey];
      return typeof customMessage === 'function' ? customMessage(errorValue) : customMessage;
    }

    // Priority 2: Default message
    if (this._defaultErrorMessages[errorKey]) {
      const defaultMessage = this._defaultErrorMessages[errorKey];
      return typeof defaultMessage === 'function' ? defaultMessage(errorValue) : defaultMessage;
    }

    // Priority 3: Fallback message
    return `Neplatná hodnota (${errorKey})`;
  }

  /**
   * Get the first error message from validation errors
   * @param validationErrors - The validation errors object
   * @param customMessages - Custom error message overrides
   * @returns The first error message or empty string
   */
  getFirstErrorMessage(validationErrors: ValidationErrors | null, customMessages: ErrorMessageConfig = {}): string {
    if (!validationErrors || Object.keys(validationErrors).length === 0) {
      return '';
    }

    const firstErrorKey = Object.keys(validationErrors)[0];
    const firstErrorValue = validationErrors[firstErrorKey];

    return this.getErrorMessage(firstErrorKey, firstErrorValue, customMessages);
  }

  /**
   * Get all error messages from validation errors
   * @param validationErrors - The validation errors object
   * @param customMessages - Custom error message overrides
   * @returns Array of error messages
   */
  getAllErrorMessages(validationErrors: ValidationErrors | null, customMessages: ErrorMessageConfig = {}): string[] {
    if (!validationErrors || Object.keys(validationErrors).length === 0) {
      return [];
    }

    return Object.keys(validationErrors).map((errorKey) => this.getErrorMessage(errorKey, validationErrors[errorKey], customMessages));
  }

  /**
   * Set custom default error messages
   * @param customDefaults - Custom default error message configuration
   */
  setDefaultErrorMessages(customDefaults: Partial<ErrorMessageConfig>): void {
    // Filter out undefined values and merge with existing defaults
    const filteredDefaults = Object.entries(customDefaults)
      .filter(([_, value]) => value !== undefined)
      .reduce((acc, [key, value]) => {
        acc[key] = value as string | ((error: any) => string);
        return acc;
      }, {} as ErrorMessageConfig);

    this._defaultErrorMessages = { ...this._defaultErrorMessages, ...filteredDefaults };
  }

  /**
   * Add a single default error message
   * @param errorKey - The error key
   * @param message - The error message template
   */
  addDefaultErrorMessage(errorKey: string, message: string | ((error: any) => string)): void {
    this._defaultErrorMessages[errorKey] = message;
  }

  /**
   * Remove a default error message
   * @param errorKey - The error key to remove
   */
  removeDefaultErrorMessage(errorKey: string): void {
    delete this._defaultErrorMessages[errorKey];
  }

  /**
   * Get all currently configured default error messages
   * @returns Current default error message configuration
   */
  getDefaultErrorMessages(): ErrorMessageConfig {
    return { ...this._defaultErrorMessages };
  }
}
