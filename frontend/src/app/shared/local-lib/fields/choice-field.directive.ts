import { computed, Directive, effect, inject, input, model, untracked } from '@angular/core';
import { SelectComponent, SelectOption } from '@anotoki/lib/ui/select';
import { DropdownOption } from '../services/options-helper.service';
import { FieldCheck } from './field-check';

/** A choice's key, in its own type: a name, a rarity's number, an id. */
export type ChoiceKey = string | number | boolean;

/** What may be chosen: words or numbers - each its own key and words -, or options with a key and words. */
export type Choices = readonly (string | number)[] | readonly DropdownOption[];

/**
 * One choice out of a list in the kit's select, kept as the form keeps it. The select carries the choices' own keys
 * (anotoki-lib 0.11.0's typed values: a rarity's number, a region's name, a food's id - `[none]="null"` for its empty
 * option); this adds what the forms ask of it.
 *
 * The value is the chosen option's key, and null once the select's empty option (its `placeholder`, "— none —") is
 * chosen; a model, `[(appChoice)]`, or `[appChoice]` with `(appChoiceChange)` where the form decides what a change
 * does. The select binds the options (`[options]="x.options()"`, each one's words between `prefix` and `suffix`) and
 * the option it shows (`[value]="x.selected()"`: the one whose key the value is, found loosely - a rarity kept as text
 * is the option 4). With no empty option, a value the list does not have becomes the list's first option, as the
 * select shows it (its key as text, as genshin's select always wrote it): what is seen is what is saved. `chosen()` is
 * the option chosen (a material's picture beside the select). It is a FieldCheck of its own (`required`,
 * `[error]="x.error()"`), counted as left when the focus leaves the select or a choice is made.
 */
@Directive({ selector: 'anotoki-select[appChoice]', exportAs: 'appChoice', host: { '(focusout)': 'touch()' } })
export class ChoiceFieldDirective extends FieldCheck {
  readonly value = model<ChoiceKey | null | undefined>(undefined, { alias: 'appChoice' });
  readonly choices = input<Choices>([]);
  /** Words before and after each option's own (" ★" after a rarity). */
  readonly prefix = input('');
  readonly suffix = input('');

  protected readonly checked = this.value;

  private readonly _select = inject<SelectComponent<ChoiceKey | null>>(SelectComponent, { self: true });

  /** The choices as options with keys: words or numbers are their own key and words. */
  private readonly _choices = computed<DropdownOption[]>(() =>
    (this.choices() as readonly (string | number | DropdownOption)[]).map((choice) => (typeof choice === 'object' ? choice : { key: choice, value: choice })),
  );

  /** The options as the kit's select takes them: each its key in its own type, its words between the prefix and the suffix. */
  readonly options = computed<SelectOption<ChoiceKey | null>[]>(() =>
    this._choices().map((choice) => ({ value: choice.key, label: `${this.prefix()}${choice.value}${this.suffix()}`, disabled: choice.disabled })),
  );

  /** The option chosen - found loosely, as a rarity kept as a number is the option "4". */
  readonly chosen = computed(() => this._choices().find((choice) => choice.key == this.value()));

  /** The option the select shows: the chosen one's own key, or null - its empty option. */
  readonly selected = computed<ChoiceKey | null>(() => this.chosen()?.key ?? null);

  constructor() {
    super();
    // The person's choice: the option's key in its own type, null for the empty option.
    this._select.value.subscribe((key) => {
      this.value.set(key ?? null);
      this.touch();
    });
    // No empty option: a value the list does not have becomes its first option, as the select shows it.
    effect(() => {
      const choices = this._choices();
      const value = this.value();
      if (this._select.placeholder() === null && choices.length > 0 && !choices.some((choice) => choice.key == value)) {
        untracked(() => this.value.set(choices[0].key.toString()));
      }
    });
  }
}
