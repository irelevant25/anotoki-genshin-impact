import { Component, computed, input, model } from '@angular/core';
import { TextComponent } from '../../../../../shared/local-lib/components/text/text.component';
import { TextareaComponent } from '../../../../../shared/local-lib/components/textarea/textarea.component';
import { DropdownComponent } from '../../../../../shared/local-lib/components/dropdown/dropdown.component';
import { CalendarComponent } from '../../../../../shared/local-lib/components/calendar/calendar.component';
import { FieldContainerComponent } from '../../../../../shared/local-lib/components/field-container/field-container.component';
import { EntityImageComponent } from '../../../shared/entity-image/entity-image.component';
import { PickedImage } from '../../../shared/image-upload/image-upload.component';
import { revokePicked, toLines, toStringArray } from '../../../shared/admin-full-resource.model';
import { emptyWeapon, WEAPON_IMAGE_FIELDS, weaponImageName, WeaponImageField, WeaponWrapper } from '../weapon-form.model';

@Component({
  selector: 'app-weapon-base-info-tab',
  templateUrl: './base-info-tab.component.html',
  styleUrls: ['./base-info-tab.component.scss'],
  imports: [TextComponent, TextareaComponent, DropdownComponent, CalendarComponent, FieldContainerComponent, EntityImageComponent],
})
export class BaseInfoTabComponent {
  weapon = model<WeaponWrapper>(emptyWeapon());

  weaponTypes = input<string[]>([]);
  rarities = input<string[]>([]);
  stats = input<string[]>([]);

  readonly imageFields = WEAPON_IMAGE_FIELDS;

  howToObtainText = computed(() => toStringArray(this.weapon().data.how_to_obtain).join('\n'));
  effectsText = computed(() => toStringArray(this.weapon().data.effects).join('\n'));

  /** Stored path; the slot shows a pending pick when there is one. */
  imagePath(field: WeaponImageField): string | undefined {
    return (this.weapon().data[field] as string | undefined) || undefined;
  }

  /** Derived from the name input, so it follows a rename while the form is open. */
  imageName(field: WeaponImageField): string {
    return weaponImageName(this.weapon().data.name, field);
  }

  pendingFor(field: WeaponImageField): PickedImage | undefined {
    return this.weapon().pending[field];
  }

  onPicked(field: WeaponImageField, picked: PickedImage): void {
    this.weapon.update((weapon) => {
      revokePicked(weapon.pending[field]);
      return { ...weapon, pending: { ...weapon.pending, [field]: picked } };
    });
  }

  onCleared(field: WeaponImageField): void {
    this.weapon.update((weapon) => {
      revokePicked(weapon.pending[field]);
      const pending = { ...weapon.pending };
      delete pending[field];
      return { ...weapon, pending };
    });
  }

  onHowToObtainChange(value: string | number | undefined | null): void {
    this.weapon().data.how_to_obtain = toLines(value);
  }

  onEffectsChange(value: string | number | undefined | null): void {
    this.weapon().data.effects = toLines(value);
  }
}
