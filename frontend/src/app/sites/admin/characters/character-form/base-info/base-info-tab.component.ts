import { Component, computed, input, model } from '@angular/core';
import { ButtonComponent } from '@anotoki/lib/ui/button';
import { CheckboxComponent, SelectComponent, TextareaComponent, TextFieldComponent } from '@anotoki/lib/ui/forms';
import { DateFieldComponent } from '@anotoki/lib/ui/date-field';
import { ChipGroupComponent, ChipOption } from '@anotoki/lib/ui/chips';
import { IdNameEntry } from '../../../../../api';
import { RelationshipFormData } from '../../../shared/admin-form.model';
import { DropdownOption } from '../../../../../shared/local-lib/services/options-helper.service';
import { FieldCheckDirective } from '../../../../../shared/local-lib/fields/field-check';
import { fieldText } from '../../../../../shared/local-lib/fields/field-text';
import { NumberFieldComponent } from '@anotoki/lib/ui/number-field';
import { NumberFieldDirective } from '../../../../../shared/local-lib/fields/number-field.directive';
import { ChoiceFieldDirective } from '../../../../../shared/local-lib/fields/choice-field.directive';
import { fieldDateToStored, fieldDayMonthToStored, storedToFieldDate, storedToFieldDayMonth } from '../../../../../shared/local-lib/stored-dates';
import { EntityImageComponent } from '../../../shared/entity-image/entity-image.component';
import { PickedImage } from '../../../shared/image-upload/image-upload.component';
import { characterImageName, CharacterImageField, CharacterWrapper, emptyCharacter, revokePicked } from '../character-form.model';
import { listText, toLines } from '../../../../../sites/admin/shared/admin-full-resource.model';

interface ImageFieldConfig {
  field: CharacterImageField;
  label: string;
  required: boolean;
}

const NAMECARD_IMAGES: ImageFieldConfig[] = [
  { field: 'namecard_icon', label: 'Namecard Icon', required: false },
  { field: 'namecard_background', label: 'Namecard Background', required: false },
  { field: 'namecard_banner', label: 'Namecard Banner', required: false },
];

const CHARACTER_IMAGES: ImageFieldConfig[] = [
  { field: 'icon', label: 'Icon', required: true },
  { field: 'card_icon', label: 'Card Icon', required: true },
  { field: 'card_icon_2', label: 'Card Icon 2', required: false },
  { field: 'wish_icon', label: 'Wish Icon', required: true },
];

function emptyRelationship(): RelationshipFormData {
  return { type: '', name: '', state: '', is_biological: false };
}

@Component({
  selector: 'app-base-info-tab',
  templateUrl: './base-info-tab.component.html',
  styleUrls: ['./base-info-tab.component.scss'],
  imports: [
    ButtonComponent,
    TextFieldComponent,
    TextareaComponent,
    SelectComponent,
    CheckboxComponent,
    DateFieldComponent,
    ChipGroupComponent,
    FieldCheckDirective,
    NumberFieldComponent,
    NumberFieldDirective,
    ChoiceFieldDirective,
    EntityImageComponent,
  ],
})
export class BaseInfoTabComponent {
  character = model<CharacterWrapper>(emptyCharacter());
  relationships = model<RelationshipFormData[]>([]);
  selectedRoles = model<string[]>([]);

  readonly fieldText = fieldText;
  /** The dates as the kit's date field reads them, and back as the API keeps them (stored-dates.ts). */
  readonly storedToFieldDate = storedToFieldDate;
  readonly fieldDateToStored = fieldDateToStored;
  readonly storedToFieldDayMonth = storedToFieldDayMonth;
  readonly fieldDayMonthToStored = fieldDayMonthToStored;

  // Lookups
  elements = input<string[]>([]);
  weaponTypes = input<string[]>([]);
  models = input<string[]>([]);
  rarities = input<string[]>([]);
  regions = input<string[]>([]);
  relationshipTypes = input<string[]>([]);
  roles = input<string[]>([]);
  characterStates = input<string[]>([]);
  foods = input<IdNameEntry[]>([]);

  readonly namecardImages = NAMECARD_IMAGES;
  readonly characterImages = CHARACTER_IMAGES;
  /** The Arkhe a character is aligned with - a fixed list, as the database allows. */
  readonly arkheOptions = ['Pneuma', 'Ousia', 'Pneuma & Ousia'];

  foodOptions = computed<DropdownOption[]>(() => this.foods().map((food) => ({ key: food.id, value: food.name })));
  /** The roles as the kit's chips take them. */
  roleChips = computed<ChipOption[]>(() => this.roles().map((role) => ({ value: role, label: role })));

  /** Newline-separated editing surfaces for the JSONB string-array columns. */
  howToObtainText = computed(() => listText(this.character().data.how_to_obtain));
  affiliationsText = computed(() => listText(this.character().data.affiliations));
  namecardSourcesText = computed(() => listText(this.character().data.namecard_sources));

  // ── Images ──────────────────────────────────────────────────────────────────

  /** Stored path for a field; the slot itself shows a pending pick if there is one. */
  imagePath(field: CharacterImageField): string | undefined {
    return (this.character().data[field] as string | undefined) ?? undefined;
  }

  /** Derived from the name input, so it follows a rename while the form is open. */
  imageName(field: CharacterImageField): string {
    return characterImageName(this.character().data.name, field);
  }

  pendingFor(field: CharacterImageField): PickedImage | undefined {
    return this.character().pending[field];
  }

  onPicked(field: CharacterImageField, picked: PickedImage): void {
    this.character.update((character) => {
      revokePicked(character.pending[field]);
      return { ...character, pending: { ...character.pending, [field]: picked } };
    });
  }

  onCleared(field: CharacterImageField): void {
    this.character.update((character) => {
      revokePicked(character.pending[field]);
      const pending = { ...character.pending };
      delete pending[field];
      return { ...character, pending };
    });
  }

  onHowToObtainChange(value: string | number | undefined | null): void {
    this.character().data.how_to_obtain = toLines(value);
  }

  onAffiliationsChange(value: string | number | undefined | null): void {
    this.character().data.affiliations = toLines(value);
  }

  onNamecardSourcesChange(value: string | number | undefined | null): void {
    this.character().data.namecard_sources = toLines(value);
  }

  // ── Relationships ───────────────────────────────────────────────────────────

  addRelationship(): void {
    this.relationships.update((relationships) => [...relationships, emptyRelationship()]);
  }

  removeRelationship(relationship: RelationshipFormData): void {
    this.relationships.update((relationships) => relationships.filter((current) => current !== relationship));
  }
}
