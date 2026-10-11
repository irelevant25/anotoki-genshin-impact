import { Component, computed, model } from '@angular/core';
import { TextFieldComponent } from '@anotoki/lib/ui/forms';
import { AbstractInputComponent } from '../../abstract-input.class';

type Type = string | number;

/**
 * A line of text in the site's forms: the kit's text field, holding this
 * form's value and saying its rules' errors (AbstractInputComponent).
 */
@Component({
  selector: 'app-text',
  imports: [TextFieldComponent],
  templateUrl: './text.component.html',
  styleUrls: ['./text.component.scss'],
  providers: [
    {
      provide: AbstractInputComponent,
      useExisting: TextComponent,
    },
  ],
})
export class TextComponent extends AbstractInputComponent<Type> {
  maxLength = model<number | undefined>(undefined);

  /** Left off unless asked for, so existing fields behave exactly as before. */
  autocomplete = model<string | undefined>(undefined);

  readonly text = computed(() => String(this.computedValue() ?? ''));

  onKitInput(text: string): void {
    this.value.set(text);
    this.inputChange.emit(text);
  }
}
