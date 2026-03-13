import { Component, model } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AbstractInputComponent } from '../../abstract-input.class';

export type LabelPosition = 'left' | 'right';

type Type = boolean;

@Component({
  selector: 'app-checkbox',
  imports: [FormsModule],
  templateUrl: './checkbox.component.html',
  styleUrl: './checkbox.component.scss',
  providers: [
    {
      provide: AbstractInputComponent,
      useExisting: CheckboxComponent,
    },
  ],
})
export class CheckboxComponent extends AbstractInputComponent<Type> {
  inline = model<boolean>(true);
  labelPosition = model<LabelPosition>('left');

  onClick(event: Event): void {
    if (this.disabled()) {
      return;
    }
    const target = event.target as HTMLInputElement;
    this.value.set(target.checked);
    this.inputChange.emit(this.value());
    this.updateErrorMessageInternal();
    this.emitValidationState();
  }
}
