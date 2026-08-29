import { Component, model } from '@angular/core';
import { TextareaComponent } from '../../../../../shared/local-lib/components/textarea/textarea.component';
import { FieldContainerComponent } from '../../../../../shared/local-lib/components/field-container/field-container.component';
import { EntityImageComponent } from '../../../shared/entity-image/entity-image.component';
import { PickedImage } from '../../../shared/image-upload/image-upload.component';
import { revokePicked } from '../../../shared/admin-full-resource.model';
import { emptyFood, FOOD_QUALITIES, foodImageName, FoodImageField, FoodQuality, FoodWrapper } from '../food-form.model';

@Component({
  selector: 'app-food-qualities-tab',
  templateUrl: './qualities-tab.component.html',
  styleUrls: ['./qualities-tab.component.scss'],
  imports: [TextareaComponent, FieldContainerComponent, EntityImageComponent],
})
export class QualitiesTabComponent {
  food = model<FoodWrapper>(emptyFood());

  readonly qualities = FOOD_QUALITIES;

  /** Stored path; the slot shows a pending pick when there is one. */
  iconPath(quality: FoodQuality): string | undefined {
    return (this.food().data[`icon_${quality}`] as string | undefined) || undefined;
  }

  /** Derived from the name input, so it follows a rename while the form is open. */
  iconName(quality: FoodQuality): string {
    return foodImageName(this.food().data.name, quality);
  }

  pendingFor(quality: FoodQuality): PickedImage | undefined {
    return this.food().pending[`icon_${quality}` as FoodImageField];
  }

  onPicked(quality: FoodQuality, picked: PickedImage): void {
    const field = `icon_${quality}` as FoodImageField;
    this.food.update((food) => {
      revokePicked(food.pending[field]);
      return { ...food, pending: { ...food.pending, [field]: picked } };
    });
  }

  onCleared(quality: FoodQuality): void {
    const field = `icon_${quality}` as FoodImageField;
    this.food.update((food) => {
      revokePicked(food.pending[field]);
      const pending = { ...food.pending };
      delete pending[field];
      return { ...food, pending };
    });
  }

  description(quality: FoodQuality): string {
    return (this.food().data[`description_${quality}`] as string | undefined) ?? '';
  }

  onDescriptionChange(quality: FoodQuality, value: string | number | undefined | null): void {
    this.food().data[`description_${quality}`] = value == null ? null : String(value);
  }

  effect(quality: FoodQuality): string {
    return (this.food().data[`effect_${quality}`] as string | undefined) ?? '';
  }

  onEffectChange(quality: FoodQuality, value: string | number | undefined | null): void {
    this.food().data[`effect_${quality}`] = value == null ? null : String(value);
  }
}
