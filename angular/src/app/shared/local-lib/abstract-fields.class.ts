import { Component, inject, QueryList, ViewChildren } from '@angular/core';
import { AbstractInputComponent } from './abstract-input.class';
import { AbstractModalComponent } from './abstract-modal.class';
import { NotificationService } from './components/notification/notification.service';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { replaceObjectValues } from './helper.class';

interface NotificationMessage {
  success: string;
  error: string;
}

@Component({ template: '' })
export abstract class FieldsComponent<TRequestInput, TData = any> extends AbstractModalComponent {
  @ViewChildren(AbstractInputComponent) inputs?: QueryList<AbstractInputComponent>;

  data?: TData;

  abstract form: TRequestInput;

  readonly notificationService = inject(NotificationService);

  ngOnInit(): void {
    if (this.data) {
      replaceObjectValues(this.form, this.data);
    }
  }

  get isValid(): boolean {
    if (!this.inputs || this.inputs.length === 0) {
      console.error('No inputs found');
      return true;
    }
    return !this.inputs.some((input) => !input.isValid());
  }

  get isInvalid(): boolean {
    return !this.isValid;
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  getIsValid(connected?: boolean): boolean {
    if (!this.inputs || this.inputs.length === 0) {
      console.error('No inputs found');
      return true;
    }
    const filteredInputs = connected ? this.inputs.filter((input) => input.elementRef.nativeElement.isConnected === connected) : this.inputs;
    return !filteredInputs.some((input) => !input.isValid());
  }

  getIsInvalid(connected: boolean = true): boolean {
    return !this.getIsValid(connected);
  }

  markAllAsTouched(connected?: boolean): void {
    if (!this.inputs || this.inputs.length === 0) {
      console.error('No inputs found');
      return;
    }
    const filteredInputs = connected ? this.inputs.filter((input) => input.elementRef.nativeElement.isConnected === connected) : this.inputs;
    filteredInputs.forEach((input) => input.markAsTouched());
  }

  submit<TResponse>(request: Observable<TResponse>, message?: NotificationMessage, isValid?: boolean): void {
    if (isValid !== undefined) {
      if (!isValid) {
        return;
      }
    } else {
      this.markAllAsTouched();
      if (this.isInvalid) {
        return;
      }
    }
    this.loading.set(true);
    request.subscribe({
      next: () => {
        this.loading.set(false);
        this.notificationService.showSuccess(message?.success ?? 'Operácia bola úspešná.');
        this.closeModal(true);
      },
      error: (e: HttpErrorResponse) => {
        this.loading.set(false);
        this.notificationService.showError(`${message?.error ?? 'Operácia sa nepodarila.'} Chyba: ${e?.error?.message}`);
      },
    });
  }
}
