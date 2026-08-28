import { Component, computed, input, model } from '@angular/core';
import { TextComponent } from '../../../../../shared/local-lib/components/text/text.component';
import { TextareaComponent } from '../../../../../shared/local-lib/components/textarea/textarea.component';
import { DropdownComponent } from '../../../../../shared/local-lib/components/dropdown/dropdown.component';
import { CalendarComponent } from '../../../../../shared/local-lib/components/calendar/calendar.component';
import { FileComponent, FileItemType } from '../../../../../shared/local-lib/components/file/file.component';
import { FieldContainerComponent } from '../../../../../shared/local-lib/components/field-container/field-container.component';
import { TooltipComponent } from '../../../../../shared/local-lib/components/tooltip/tooltip.component';
import { IMAGE_EXTENSIONS, imageSrc, setImage, toLines } from '../../../shared/admin-full-resource.model';
import { emptyWeapon, WEAPON_IMAGE_FIELDS, WeaponImageField, WeaponWrapper } from '../weapon-form.model';

@Component({
  selector: 'app-weapon-base-info-tab',
  templateUrl: './base-info-tab.component.html',
  styleUrls: ['./base-info-tab.component.scss'],
  imports: [TextComponent, TextareaComponent, DropdownComponent, CalendarComponent, FileComponent, FieldContainerComponent, TooltipComponent],
})
export class BaseInfoTabComponent {
  weapon = model<WeaponWrapper>(emptyWeapon());

  weaponTypes = input<string[]>([]);
  rarities = input<string[]>([]);
  stats = input<string[]>([]);

  readonly imageExtensions = IMAGE_EXTENSIONS;
  readonly imageFields = WEAPON_IMAGE_FIELDS;

  howToObtainText = computed(() => (this.weapon().data.how_to_obtain ?? []).join('\n'));
  effectsText = computed(() => (this.weapon().data.effects ?? []).join('\n'));

  imageSrcFor(field: WeaponImageField): string | undefined {
    return imageSrc(this.weapon().images[field], this.weapon().data[field] as string | undefined);
  }

  onImageSelect(field: WeaponImageField, files: FileItemType[] | undefined | null): void {
    this.weapon.update((weapon) => {
      const slot = weapon.images[field] ?? {};
      setImage(slot, files?.[0]?.file);
      return { ...weapon, images: { ...weapon.images, [field]: slot } };
    });
  }

  onHowToObtainChange(value: string | number | undefined | null): void {
    this.weapon().data.how_to_obtain = toLines(value);
  }

  onEffectsChange(value: string | number | undefined | null): void {
    this.weapon().data.effects = toLines(value);
  }
}
