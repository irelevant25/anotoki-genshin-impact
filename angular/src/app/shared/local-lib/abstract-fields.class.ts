import { Component, effect, inject, model, ModelSignal, untracked } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { replaceObjectValues } from './helper.class';
import { OptionsHelperService } from './services/options-helper.service';
import { InputValidationComponent } from './abstract-input-validation.class';

interface NotificationMessage {
  success: string;
  error: string;
}

@Component({ template: '' })
export abstract class FieldsComponent<TRequestInput, TData = any> extends InputValidationComponent {
  routeIdName: string = 'id';
  get id(): number | string | undefined {
    const id = this.route.snapshot.paramMap.get(this.routeIdName) ?? '';
    if (id === null) {
      console.error(`No id with name ${this.routeIdName} was found in route params`);
      return undefined;
    }
    return id;
  }

  data = model<TData>();
  abstract form: ModelSignal<TRequestInput>;

  readonly optionsHelperService = inject(OptionsHelperService);

  constructor() {
    super();
    // Only `data` should retrigger this. Reading `form` inside `fillForm` would
    // otherwise make a `form.set(...)` refill the form from `data` again.
    effect(() => {
      const data = this.data();
      untracked(() => this.fillForm(data));
    });
  }

  fillForm(data?: TData): void {
    replaceObjectValues(this.form(), data ?? this.data());
  }

  submit<TResponse>(request: Observable<TResponse>, message?: NotificationMessage, isValid?: boolean): void {
    if (isValid !== undefined) {
      if (!isValid) {
        return;
      }
    } else {
      this.markAllAsTouched();
      if (this.isInvalid()) {
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
