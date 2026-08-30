import { Component, computed, signal } from '@angular/core';
import { AbstractInputComponent } from './abstract-input.class';
import { AbstractModalComponent } from './abstract-modal.class';

@Component({ template: '' })
export abstract class InputValidationComponent extends AbstractModalComponent {
  private readonly _viewInitialized = signal(false);

  ngAfterViewInit(): void {
    this._viewInitialized.set(true);
  }

  protected getAllInputs(connected: boolean = true): AbstractInputComponent[] {
    AbstractInputComponent.registryVersion();
    const root = this.elementRef.nativeElement;
    const allInputs = Array.from(AbstractInputComponent.registry).filter((input) => root.contains(input.elementRef.nativeElement));
    return allInputs.filter((input) => input.elementRef.nativeElement.isConnected === connected);
  }

  readonly isValid = computed<boolean>(() => {
    if (!this._viewInitialized()) {
      return true;
    }
    const inputs = this.getAllInputs();
    if (inputs.length === 0) {
      console.error('No inputs found: ', this);
      return true;
    }
    return !inputs.some((input) => !input.isValid());
  });

  readonly isValidVisible = computed<boolean>(() => {
    if (!this._viewInitialized()) {
      return true;
    }
    const inputs = this.getAllInputs();
    if (inputs.length === 0) {
      console.error('No inputs found for: ', this);
      return true;
    }
    return !inputs.some((input) => input.hasError());
  });

  readonly isInvalid = computed<boolean>(() => !this.isValid());

  readonly isInvalidVisible = computed<boolean>(() => !this.isValidVisible());

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
}
