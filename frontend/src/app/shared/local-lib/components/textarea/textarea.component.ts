import { Component, computed, model } from '@angular/core';
import { TextareaComponent as KitTextareaComponent } from '@anotoki/lib/ui/forms';
import { AbstractInputComponent } from '../../abstract-input.class';

type Type = string | number;

/**
 * Lines of text in the site's forms: the kit's textarea, holding this form's
 * value and saying its rules' errors (AbstractInputComponent).
 */
@Component({
  selector: 'app-textarea',
  imports: [KitTextareaComponent],
  templateUrl: './textarea.component.html',
  styleUrls: ['./textarea.component.scss'],
  providers: [
    {
      provide: AbstractInputComponent,
      useExisting: TextareaComponent,
    },
  ],
})
export class TextareaComponent extends AbstractInputComponent<Type> {
  rows = model<number>(7);
  maxLength = model<number | undefined>(undefined);
  /** Kept for the forms that set it; the kit's textarea is resized by its corner. */
  resize = model<boolean>(true);

  readonly text = computed(() => String(this.computedValue() ?? ''));

  onKitInput(text: string): void {
    this.value.set(text);
    this.inputChange.emit(text);
  }
}
