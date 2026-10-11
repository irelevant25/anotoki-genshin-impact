import { Component, computed, effect, inject, model } from '@angular/core';
import { TranslationService } from '@anotoki/lib/translations';
import { ButtonComponent } from '@anotoki/lib/ui/button';
import { CheckboxComponent } from '@anotoki/lib/ui/forms';
import { PopoverComponent, PopoverTriggerDirective } from '@anotoki/lib/ui/menu';
import { AbstractInputComponent } from '../../abstract-input.class';
import { DropdownOption } from '../../services/options-helper.service';

export type MultiselectOptionsType = DropdownOption[] | string[] | number[];

type Type = (string | number | boolean)[];

/**
 * Several choices out of a list - the admin lists' filters, a character's
 * roles. The kit has no multiselect, so this one is made of its pieces: a
 * button that looks like the kit's fields and says what is chosen, opening
 * the kit's popover (Escape, the focus leaving or a click outside put it
 * away) of the kit's checkboxes, one a choice.
 */
@Component({
  selector: 'app-multiselect',
  imports: [ButtonComponent, CheckboxComponent, PopoverComponent, PopoverTriggerDirective],
  templateUrl: './multiselect.component.html',
  styleUrls: ['./multiselect.component.scss'],
  providers: [
    {
      provide: AbstractInputComponent,
      useExisting: MultiselectComponent,
    },
  ],
})
export class MultiselectComponent extends AbstractInputComponent<Type> {
  private readonly _i18n = inject(TranslationService);

  options = model<MultiselectOptionsType>([]);
  maxDisplayItems = model<number>(3);
  selectedOptions = model<DropdownOption[]>([]);

  computedOptions = computed(() => {
    const raw = this.options();
    if (!Array.isArray(raw)) {
      return [];
    }

    return raw.map((option) => {
      if (typeof option === 'object' && 'key' in option && 'value' in option) {
        return option as DropdownOption;
      }
      return { key: option, value: option } as DropdownOption;
    });
  });

  /** What the button says: the first few chosen, and how many more. */
  displayValue = computed(() => {
    const selected = this.selectedOptions();
    const maxDisplay = this.maxDisplayItems();

    if (selected.length === 0) {
      return '';
    }

    if (selected.length <= maxDisplay) {
      return selected.map((opt) => opt.value).join(', ');
    }

    const displayed = selected
      .slice(0, maxDisplay)
      .map((opt) => opt.value)
      .join(', ');
    const remaining = selected.length - maxDisplay;
    return `${displayed} ${this._i18n.t(this._pluralKey('multiselect.more', remaining), { count: remaining })}`;
  });

  /**
   * Which plural form a language wants for `count`, as a key suffix.
   *
   * The count is deliberately not compared against numbers here: Slovak wants
   * separate wording for two-to-four where English does not, and a language
   * added later will want something neither of them does. `Intl.PluralRules`
   * already knows every language's own buckets. A form with no string of its
   * own falls back to `other`, which every language has.
   */
  private _pluralKey(base: string, count: number): string {
    const form = new Intl.PluralRules(this._i18n.effectiveLanguage()).select(count);
    return this._i18n.has(`${base}.${form}`) ? `${base}.${form}` : `${base}.other`;
  }

  constructor() {
    super();

    effect(() => {
      const value = this.value();
      const options = this.computedOptions();

      if (Array.isArray(value) && value.length > 0) {
        const selected = options.filter((opt) => value.includes(opt.key));
        if (JSON.stringify(selected) !== JSON.stringify(this.selectedOptions())) {
          this.selectedOptions.set(selected);
        }
      } else {
        this.selectedOptions.set([]);
      }
    });
  }

  isSelected(option: DropdownOption): boolean {
    return this.selectedOptions().some((selected) => selected.key === option.key);
  }

  /** One checkbox changed: the value is the chosen keys, in the list's order. */
  toggleOption(option: DropdownOption, checked: boolean): void {
    const chosen = new Set(this.selectedOptions().map((selected) => selected.key));
    if (checked) {
      chosen.add(option.key);
    } else {
      chosen.delete(option.key);
    }
    this._setKeys(this.computedOptions().filter((candidate) => chosen.has(candidate.key)).map((candidate) => candidate.key));
  }

  clear(): void {
    this._setKeys([]);
  }

  private _setKeys(keys: Type): void {
    this.value.set(keys);
    this.inputChange.emit(keys);
    this.isTouched.set(true);
    this.emitValidationState();
  }
}
