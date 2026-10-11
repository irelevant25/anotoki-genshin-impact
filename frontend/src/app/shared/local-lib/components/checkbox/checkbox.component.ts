import { Component, model } from '@angular/core';
import { CheckboxComponent as KitCheckboxComponent } from '@anotoki/lib/ui/forms';

import { AbstractInputComponent } from '../../abstract-input.class';

export type LabelPosition = 'left' | 'right';

type Type = boolean;

/**
 * A yes or no in the site's forms: the kit's checkbox (its label beside it,
 * the whole line the target), holding this form's value.
 */
@Component({
  selector: 'app-checkbox',
  imports: [KitCheckboxComponent],
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
  /**
   * Where it stands: on a line of its own - a card, a dialog - (true), or in a
   * form's grid beside other fields (false), lined up with their bottoms. The
   * kit's checkbox has its label beside it either way.
   */
  inline = model<boolean>(true);
  /** Kept for the forms that set it: the kit puts the label after the box. */
  labelPosition = model<LabelPosition>('left');

  onKitChange(checked: boolean): void {
    if (this.disabled()) {
      return;
    }
    this.value.set(checked);
    this.inputChange.emit(checked);
    this.isTouched.set(true);
    this.updateErrorMessageInternal();
    this.emitValidationState();
  }
}
