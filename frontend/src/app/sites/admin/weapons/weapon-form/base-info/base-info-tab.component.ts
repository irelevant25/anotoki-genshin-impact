import { Component, computed, inject, input, model } from '@angular/core';
import { SelectComponent, TextareaComponent, TextFieldComponent } from '@anotoki/lib/ui/forms';
import { DateFieldComponent } from '@anotoki/lib/ui/date-field';
import { AnotokiDates } from '@anotoki/lib/ui/dates';
import { FieldCheckDirective } from '../../../../../shared/local-lib/fields/field-check';
import { fieldText } from '../../../../../shared/local-lib/fields/field-text';
import { NumberFieldComponent } from '@anotoki/lib/ui/number-field';
import { NumberFieldDirective } from '../../../../../shared/local-lib/fields/number-field.directive';
import { ChoiceFieldDirective } from '../../../../../shared/local-lib/fields/choice-field.directive';
import { fieldDateToStored, fieldFormatOf, storedToFieldDate } from '../../../../../shared/local-lib/stored-dates';
import { EntityImageComponent } from '../../../shared/entity-image/entity-image.component';
import { PickedImage } from '../../../shared/image-upload/image-upload.component';
import { listText, revokePicked, toLines } from '../../../shared/admin-full-resource.model';
import { emptyWeapon, WEAPON_IMAGE_FIELDS, weaponImageName, WeaponImageField, WeaponWrapper } from '../weapon-form.model';

@Component({
  selector: 'app-weapon-base-info-tab',
  templateUrl: './base-info-tab.component.html',
  styleUrls: ['./base-info-tab.component.scss'],
  imports: [TextFieldComponent, TextareaComponent, SelectComponent, DateFieldComponent, FieldCheckDirective, NumberFieldComponent, NumberFieldDirective, ChoiceFieldDirective, EntityImageComponent],
})
export class BaseInfoTabComponent {
  weapon = model<WeaponWrapper>(emptyWeapon());

  private readonly _dates = inject(AnotokiDates);

  readonly fieldText = fieldText;
  /** The order the dates are typed in: the one the lists beside the form write them in (stored-dates.ts). */
  readonly dateFormat = computed(() => fieldFormatOf(this._dates));
  /** A date as the kit's date field reads it, and back as the API keeps it (stored-dates.ts). */
  readonly storedToFieldDate = storedToFieldDate;
  readonly fieldDateToStored = fieldDateToStored;

  weaponTypes = input<string[]>([]);
  rarities = input<string[]>([]);
  stats = input<string[]>([]);

  readonly imageFields = WEAPON_IMAGE_FIELDS;

  howToObtainText = computed(() => listText(this.weapon().data.how_to_obtain));
  effectsText = computed(() => listText(this.weapon().data.effects));

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
