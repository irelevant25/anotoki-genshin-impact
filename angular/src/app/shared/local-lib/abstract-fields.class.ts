import { Component, ElementRef, inject, QueryList, ViewChildren } from '@angular/core';
import { AbstractInputComponent } from './abstract-input.class';
import { AbstractModalComponent } from './abstract-modal.class';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { replaceObjectValues } from './helper.class';
import { ActivatedRoute } from '@angular/router';

interface NotificationMessage {
  success: string;
  error: string;
}

@Component({ template: '' })
export abstract class FieldsComponent<TRequestInput, TData = any> extends AbstractModalComponent {
  @ViewChildren(AbstractInputComponent) inputs?: QueryList<AbstractInputComponent>;

  routeIdName: string = 'id';
  get id(): number | string | undefined {
    const id = this._route$.snapshot.paramMap.get(this.routeIdName) ?? '';
    if (id === null) {
      console.error(`No id with name ${this.routeIdName} was found in route params`);
      return undefined;
    }
    return id;
  }

  private _data?: TData;
  set data(data: TData | undefined) {
    this._data = data;
    this.fillForm(data);
  }
  get data(): TData | undefined {
    return this._data;
  }

  abstract form: TRequestInput;

  protected readonly _route$ = inject(ActivatedRoute);
  private readonly _elementRef = inject(ElementRef);

  constructor() {
    super();
  }

  ngOnInit(): void {
    if (this.data) {
      this.fillForm();
    }
  }

  fillForm(data?: TData): void {
    replaceObjectValues(this.form, data ?? this.data);
  }

  protected getAllInputs(connected?: boolean): AbstractInputComponent[] {
    const root = this._elementRef.nativeElement;
    const allInputs = Array.from(AbstractInputComponent.registry).filter((input) => root.contains(input.elementRef.nativeElement));
    return connected != null ? allInputs.filter((input) => input.elementRef.nativeElement.isConnected === connected) : allInputs;
  }

  get isValid(): boolean {
    const inputs = this.getAllInputs();
    if (inputs.length === 0) {
      console.error('No inputs found');
      return true;
    }
    return !inputs.some((input) => !input.isValid());
  }

  get isInvalid(): boolean {
    return !this.isValid;
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  getIsValid(connected?: boolean): boolean {
    const inputs = this.getAllInputs(connected);
    if (inputs.length === 0) {
      console.error('No inputs found');
      return true;
    }
    return !inputs.some((input) => !input.isValid());
  }

  getIsInvalid(connected: boolean = true): boolean {
    return !this.getIsValid(connected);
  }

  markAllAsTouched(connected?: boolean): void {
    const inputs = this.getAllInputs(connected);
    if (inputs.length === 0) {
      console.error('No inputs found');
      return;
    }
    inputs.forEach((input) => input.markAsTouched());
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
        this.loadingElement?.loadingCtrl.loading$.subscribe((loading) => {
          if (!loading) {
            this.notificationService.showSuccess(message?.success ?? 'Operácia bola úspešná.');
            this.closeModal(true);
          }
        });
      },
      error: (e: HttpErrorResponse) => {
        this.loading.set(false);
        this.loadingElement?.loadingCtrl.loading$.subscribe((loading) => {
          if (!loading) {
            this.notificationService.showError(`${message?.error ?? 'Operácia sa nepodarila.'} Chyba: ${e?.error?.message}`);
          }
        });
      },
    });
  }
}
