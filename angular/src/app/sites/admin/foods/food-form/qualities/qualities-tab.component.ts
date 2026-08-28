import { Component, model } from '@angular/core';
import { TextareaComponent } from '../../../../../shared/local-lib/components/textarea/textarea.component';
import { FileComponent, FileItemType } from '../../../../../shared/local-lib/components/file/file.component';
import { FieldContainerComponent } from '../../../../../shared/local-lib/components/field-container/field-container.component';
import { TooltipComponent } from '../../../../../shared/local-lib/components/tooltip/tooltip.component';
import { IMAGE_EXTENSIONS, imageSrc, setImage } from '../../../shared/admin-full-resource.model';
import { emptyFood, FOOD_QUALITIES, FoodImageField, FoodQuality, FoodWrapper } from '../food-form.model';

@Component({
  selector: 'app-food-qualities-tab',
  templateUrl: './qualities-tab.component.html',
  styleUrls: ['./qualities-tab.component.scss'],
  imports: [TextareaComponent, FileComponent, FieldContainerComponent, TooltipComponent],
})
export class QualitiesTabComponent {
  food = model<FoodWrapper>(emptyFood());

  readonly imageExtensions = IMAGE_EXTENSIONS;
  readonly qualities = FOOD_QUALITIES;

  iconSrc(quality: FoodQuality): string | undefined {
    const field = `icon_${quality}` as FoodImageField;
    return imageSrc(this.food().images[field], this.food().data[field] as string | undefined);
  }

  onIconSelect(quality: FoodQuality, files: FileItemType[] | undefined | null): void {
    const field = `icon_${quality}` as FoodImageField;
    this.food.update((food) => {
      const slot = food.images[field] ?? {};
      setImage(slot, files?.[0]?.file);
      return { ...food, images: { ...food.images, [field]: slot } };
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
