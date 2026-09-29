import { Component, computed, input, model } from '@angular/core';
import { TextComponent } from '../../../../../shared/local-lib/components/text/text.component';
import { TextareaComponent } from '../../../../../shared/local-lib/components/textarea/textarea.component';
import { NumberComponent } from '../../../../../shared/local-lib/components/number/number.component';
import { DropdownComponent } from '../../../../../shared/local-lib/components/dropdown/dropdown.component';
import { DropdownOption } from '../../../../../shared/local-lib/services/options-helper.service';
import { FieldContainerComponent } from '../../../../../shared/local-lib/components/field-container/field-container.component';
import { toLines, toStringArray } from '../../../shared/admin-full-resource.model';
import { emptyFood, FoodWrapper } from '../food-form.model';

@Component({
  selector: 'app-food-base-info-tab',
  templateUrl: './base-info-tab.component.html',
  styleUrls: ['./base-info-tab.component.scss'],
  imports: [TextComponent, TextareaComponent, NumberComponent, DropdownComponent, FieldContainerComponent],
})
export class BaseInfoTabComponent {
  food = model<FoodWrapper>(emptyFood());

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
