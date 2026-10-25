import { Component, computed, input, model } from '@angular/core';
import { SelectComponent, TextareaComponent, TextFieldComponent } from '@anotoki/lib/ui/forms';
import { DropdownOption } from '../../../../../shared/local-lib/services/options-helper.service';
import { FieldCheckDirective } from '../../../../../shared/local-lib/fields/field-check';
import { fieldText } from '../../../../../shared/local-lib/fields/field-text';
import { NumberFieldDirective } from '../../../../../shared/local-lib/fields/number-field.directive';
import { ChoiceFieldDirective } from '../../../../../shared/local-lib/fields/choice-field.directive';
import { toLines, toStringArray } from '../../../shared/admin-full-resource.model';
import { emptyFood, FoodWrapper } from '../food-form.model';

@Component({
  selector: 'app-food-base-info-tab',
  templateUrl: './base-info-tab.component.html',
  styleUrls: ['./base-info-tab.component.scss'],
  imports: [TextFieldComponent, TextareaComponent, SelectComponent, FieldCheckDirective, NumberFieldDirective, ChoiceFieldDirective],
})
export class BaseInfoTabComponent {
  food = model<FoodWrapper>(emptyFood());

  readonly fieldText = fieldText;

  foodTypes = input<string[]>([]);
  regions = input<string[]>([]);
  rarities = input<string[]>([]);
  baseDishOptions = input<DropdownOption[]>([]);

  eventsText = computed(() => toStringArray(this.food().data.events).join('\n'));
  howToObtainText = computed(() => toStringArray(this.food().data.how_to_obtain).join('\n'));
  effectsText = computed(() => toStringArray(this.food().data.effects).join('\n'));

  onEventsChange(value: string | number | undefined | null): void {
    this.food().data.events = toLines(value);
  }

  onHowToObtainChange(value: string | number | undefined | null): void {
    this.food().data.how_to_obtain = toLines(value);
  }

  onEffectsChange(value: string | number | undefined | null): void {
    this.food().data.effects = toLines(value);
  }
}
