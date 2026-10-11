import { Component, computed, effect, model } from '@angular/core';
import { SelectComponent, SelectOption } from '@anotoki/lib/ui/forms';
import { AbstractInputComponent } from '../../abstract-input.class';
import { DropdownOption } from '../../services/options-helper.service';

export type DropdownOptionsType = DropdownOption[] | string[] | number[];

type Type = string | number | boolean;

/**
 * One choice out of a list in the site's forms: the kit's select - native, so
 * a phone opens its own picker - holding the chosen option's key in whatever
 * type it is (a rarity's number, a region's name), where the kit's select
 * holds text. `emptyOption` puts "none" first (`emptyOptionText`); without it
 * a value the list does not have becomes its first option.
 */
@Component({
  selector: 'app-dropdown',
  imports: [SelectComponent],
  templateUrl: './dropdown.component.html',
  styleUrls: ['./dropdown.component.scss'],
  providers: [
    {
      provide: AbstractInputComponent,
      useExisting: DropdownComponent,
    },
  ],
})
export class DropdownComponent extends AbstractInputComponent<Type> {
  options = model<DropdownOptionsType>([]);
  emptyOption = model<boolean>(false);
  selectedOption = model<DropdownOption | undefined>(undefined);
  prefix = model<string | undefined>(undefined);
  suffix = model<string | undefined>(undefined);
  emptyOptionText = model<string | undefined>(undefined);

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

  /**
   * The option the field shows, worked out from the value alone.
   *
   * It must not read `selectedOption`: that signal is written from this one,
   * so preferring it here made the pair feed each other.
   */
  computedOption = computed(() => {
    const options = this.computedOptions();
    const value = this.value();
    return options.find((option) => option.key == value);
  });

  /** The options as the kit's select takes them: text for a key, the prefix and suffix around the words. */
  readonly kitOptions = computed<SelectOption[]>(() =>
    this.computedOptions().map((option) => ({
      value: String(option.key),
      label: `${this.prefix() ?? ''}${option.value}${this.suffix() ?? ''}`,
      disabled: option.disabled,
    })),
  );

  readonly kitValue = computed(() => {
    const value = this.value();
    return value === undefined || value === null ? '' : String(value);
  });

  constructor() {
    super();
    effect(() => {
      this.options();
      this.emptyOption();
      this.afterValueChange?.(this.value());
    });
  }

  onKitChange(text: string): void {
    const option = this.computedOptions().find((candidate) => String(candidate.key) === text);
    this.value.set(option ? option.key : null);
    this.inputChange.emit(this.value());
    this.isTouched.set(true);
    this.emitValidationState();
  }

  override afterValueChange(value?: Type | null): void {
    const options = this.computedOptions();
    if (!this.emptyOption() && options.length > 0 && !options.some((option) => option.key == value)) {
      this.value.set(options[0]?.key.toString());
    } else {
      this.selectedOption.set(this.computedOption());
    }
  }
}
