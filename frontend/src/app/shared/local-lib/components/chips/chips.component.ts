import { Component, computed, model } from '@angular/core';
import { ChipGroupComponent, ChipOption } from '@anotoki/lib/ui/chips';
import { AbstractInputComponent } from '../../abstract-input.class';

type Type = string[];

/**
 * Several choices out of a few words - a character's roles, a phase's
 * elements: the kit's choice chips (@anotoki/lib/ui/chips, `multiple`: a
 * named group of toggles that wrap, each a real button with aria-pressed and
 * a check on a chosen one, 44 px where the pointer is a finger), holding this
 * form's value - the chosen words, in the options' order - and saying its
 * rules' errors (AbstractInputComponent). Without a label the placeholder
 * names the group for screen readers, as on every field adapter here.
 */
@Component({
  selector: 'app-chips',
  imports: [ChipGroupComponent],
  templateUrl: './chips.component.html',
  styleUrls: ['./chips.component.scss'],
  providers: [
    {
      provide: AbstractInputComponent,
      useExisting: ChipsComponent,
    },
  ],
})
export class ChipsComponent extends AbstractInputComponent<Type> {
  options = model<string[]>([]);

  readonly chipOptions = computed<ChipOption[]>(() => this.options().map((option) => ({ value: option, label: option })));
  readonly chosen = computed<string[]>(() => this.value() ?? []);

  onChosen(values: readonly string[]): void {
    this.isTouched.set(true);
    this.value.set([...values]);
    this.inputChange.emit(this.value());
  }
}
