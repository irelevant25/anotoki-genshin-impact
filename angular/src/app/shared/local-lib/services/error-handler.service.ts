import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { NotificationService } from '../components/notification/notification.service';

export interface ErrorContext {
  operation: string;
  data?: any;
  showNotification?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ErrorHandlerService {
  constructor(private _notificationService: NotificationService) {}

  handleError(error: unknown, context: ErrorContext): string {
    let message = '';

    if (error instanceof HttpErrorResponse) {
      message = this.handleHttpError(error, context);
    } else if (error instanceof Error) {
      message = this.handleGenericError(error, context);
    } else {
      message = 'Nastala neočakávaná chyba';
      console.error('Unknown error type:', error, context);
    }

    if (context.showNotification !== false) {
      this._notificationService.showError(message);
    }

    return message;
  }

  private handleHttpError(error: HttpErrorResponse, context: ErrorContext): string {
    let message = '';

    switch (error.status) {
      case 400:
        message = `Nesprávne dáta pre ${context.operation}: ${error.error?.message || 'Skontrolujte vstupné údaje'}`;
        break;
      case 401:
        message = 'Nemáte oprávnenie na túto operáciu. Prihláste sa znovu.';
        break;
      case 403:
        message = `Nemáte dostatočné oprávnenia pre ${context.operation}`;
        break;
      case 404:
        message = `Požadované dáta pre ${context.operation} neboli nájdené: ${error.error?.message}`;
        break;
      case 409:
        message = `Konflikt pri ${context.operation}: ${error.error?.message || 'Dáta boli medzičasom zmenené'}`;
        break;
      case 413:
        message = `Nahraný súbor je príliš veľký.`;
        break;
      case 422:
        message = `Validačná chyba pri ${context.operation}: ${this.extractValidationErrors(error)}`;
        break;
      case 501:
        message = `Táto funkcionalita je stále vo vývoji.`;
        break;
      case 500:
        message = `Chyba servera pri ${context.operation}. Skúste to znovu neskôr.`;
        break;
      case 503:
        message = 'Služba je dočasne nedostupná. Skúste to znovu neskôr.';
        break;
      default:
        message = `Nastala chyba pri ${context.operation}: ${error.error?.message || error.message}`;
    }

    // Log for debugging
    console.error(`HTTP Error [${error.status}] in ${context.operation}:`, {
      error,
      context,
      timestamp: new Date().toISOString(),
    });

    return message;
  }

  private handleGenericError(error: Error, context: ErrorContext): string {
    const message = `Chyba pri ${context.operation}: ${error.message}`;

    console.error(`Generic Error in ${context.operation}:`, {
      error,
      context,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });

    return message;
  }

  private extractValidationErrors(error: HttpErrorResponse): string {
    if (error.error?.errors && typeof error.error.errors === 'object') {
      const errors = Object.entries(error.error.errors)
        .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
        .join('; ');
      return errors || error.error.message || 'Nesprávne údaje';
    }
    return error.error?.message || 'Nesprávne údaje';
  }
}
